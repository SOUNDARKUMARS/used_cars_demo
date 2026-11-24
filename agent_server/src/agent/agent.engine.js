import OpenAI from 'openai';
import crypto from 'crypto';
import env from '../config/env.js';
import logger from '../utils/logger.js';
import { HARSHA_CARS_SYSTEM_PROMPT } from './systemPrompt.js';
import { executeReadOnlySqlTool, handleExecuteReadOnlySql } from '../tools/executeReadOnlySql.js';
import { calculateTokenCost, logAgentInteraction } from '../services/costLogger.js';
import { getCompactedSummaries, formatCompactedMemoryBlock } from '../services/compactionService.js';

export class AgentEngine {
  constructor(opts = {}) {
    this.primaryModel = opts.model || env.AGENT_MODEL || 'deepseek/deepseek-v4.1-flash';
    this.maxTokens = opts.maxTokens || env.MAX_TOKENS || 180;
    this.temperature = opts.temperature || env.TEMPERATURE || 0.1;

    // Primary client: OpenRouter (DeepSeek V4.1 Flash)
    this.primaryClient = new OpenAI({
      apiKey: env.OPENROUTER_API_KEY,
      baseURL: 'https://openrouter.ai/api/v1',
      defaultHeaders: {
        'HTTP-Referer': 'https://harshacars.com',
        'X-Title': 'Harsha Cars AI Agent'
      }
    });

    // Fallback client: OpenAI (gpt-4o-mini)
    this.fallbackModel = 'gpt-4o-mini';
    if (env.OPENAI_API_KEY) {
      this.fallbackClient = new OpenAI({
        apiKey: env.OPENAI_API_KEY
      });
    }

    // In-memory conversation session store
    this.sessions = new Map();
  }

  /**
   * Get or initialize session conversation history
   */
  getSessionHistory(sessionId) {
    if (!sessionId) return [];
    if (!this.sessions.has(sessionId)) {
      this.sessions.set(sessionId, []);
    }
    return this.sessions.get(sessionId);
  }

  /**
   * Save a message into session history (keeping last 8 messages = 4 turns to preserve context without bloat)
   */
  appendToSession(sessionId, message) {
    if (!sessionId) return;
    const history = this.getSessionHistory(sessionId);
    history.push(message);
    if (history.length > 8) {
      this.sessions.set(sessionId, history.slice(-8));
    }
  }

  /**
   * Format messages for OpenRouter / OpenAI API with compacted conversation memory
   */
  formatMessages(systemPrompt, history, newPrompt, compactedMemory = '') {
    let finalSystemPrompt = systemPrompt;
    if (compactedMemory) {
      finalSystemPrompt += `\n\n${compactedMemory}`;
    }

    const formatted = [{ role: 'system', content: finalSystemPrompt }];

    // Only include clean user and assistant text messages from recent turns to prevent history bloat
    for (const msg of history) {
      if (msg.role === 'user' || msg.role === 'assistant') {
        formatted.push({
          role: msg.role,
          content: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content)
        });
      }
    }

    if (newPrompt) {
      formatted.push({ role: 'user', content: newPrompt });
    }

    return formatted;
  }

  /**
   * Safe execution of chat completion with credit fallback handling
   */
  async _callCompletion(messages, signal, toolChoice = 'auto') {
    const isSynthesis = toolChoice === 'none';
    const tokensLimit = isSynthesis ? 180 : 350;

    const primaryPayload = {
      model: this.primaryModel,
      messages,
      tools: [executeReadOnlySqlTool],
      tool_choice: toolChoice,
      temperature: this.temperature,
      max_tokens: tokensLimit,
      provider: {
        order: ['Baidu', 'OpenInference', 'Fireworks'],
        allow_fallbacks: true
      }
    };

    try {
      const response = await this.primaryClient.chat.completions.create(primaryPayload, { signal });
      return { response, provider: 'openrouter', model: this.primaryModel };
    } catch (err) {
      const isCreditOrAuthIssue =
        err.status === 402 ||
        (err.message && (err.message.includes('credits') || err.message.includes('402')));

      if (isCreditOrAuthIssue && this.fallbackClient) {
        logger.warn(
          { originalError: err.message },
          'OpenRouter credit limit reached. Seamlessly routing to high-reliability fallback model (gpt-4o-mini).'
        );

        const fallbackPayload = {
          model: this.fallbackModel,
          messages,
          tools: [executeReadOnlySqlTool],
          tool_choice: toolChoice,
          temperature: this.temperature,
          max_tokens: tokensLimit
        };

        const response = await this.fallbackClient.chat.completions.create(fallbackPayload, { signal });
        return { response, provider: 'openai-fallback', model: this.fallbackModel };
      }

      throw err;
    }
  }

  /**
   * Run the agent with autonomous SQL execution loop
   */
  async run({
    prompt,
    sessionId = `session_${crypto.randomUUID().slice(0, 8)}`,
    userId = null,
    customerName = null,
    history = null,
    stream = false,
    onStatus = null,
    onInterim = null,
    onTextDelta = null,
    onCars = null,
    onSql = null,
    signal = null
  }) {
    const startTime = Date.now();
    const activeHistory = history || this.getSessionHistory(sessionId);

    const emitStatus = (status) => {
      if (typeof onStatus === 'function') {
        try {
          onStatus(status);
        } catch (_) {}
      }
    };

    const emitInterim = (interim) => {
      if (typeof onInterim === 'function') {
        try {
          onInterim(interim);
        } catch (_) {}
      }
      emitStatus(interim);
    };

    emitStatus('Checking conversation notes...');

    // 1. Fetch any compacted conversation summaries for this session
    let compactedMemory = '';
    try {
      const summaries = await getCompactedSummaries(sessionId);
      if (summaries && summaries.length > 0) {
        emitStatus('Summarizing conversation memory...');
        compactedMemory = formatCompactedMemoryBlock(summaries);
        logger.info(
          { sessionId, count: summaries.length },
          'Loaded compacted conversation memory into agent prompt'
        );
      }
    } catch (compactErr) {
      logger.debug({ err: compactErr.message }, 'Notice loading compacted summaries');
    }

    // 2. Prepare conversation messages with compacted memory and active history
    const messages = this.formatMessages(HARSHA_CARS_SYSTEM_PROMPT, activeHistory, prompt, compactedMemory);

    let collectedCars = [];
    const executedQueries = [];
    const toolResults = [];
    let finalText = '';
    let usedProvider = 'openrouter';
    let usedModel = this.primaryModel;
    let maxIterations = 3;
    let iteration = 0;
    let totalPromptTokens = 0;
    let totalCompletionTokens = 0;
    let totalTokens = 0;

    while (iteration < maxIterations) {
      iteration++;

      // On iteration 1: auto tool choice to generate SQL.
      // On subsequent iterations: 'none' to force concise human synthesis text.
      const toolChoice = iteration === 1 ? 'auto' : 'none';
      const { response, provider, model } = await this._callCompletion(messages, signal, toolChoice);
      usedProvider = provider;
      usedModel = model;

      if (response?.usage) {
        totalPromptTokens += response.usage.prompt_tokens || 0;
        totalCompletionTokens += response.usage.completion_tokens || 0;
        totalTokens += response.usage.total_tokens || 0;
      }

      const choice = response.choices?.[0];
      if (!choice) {
        throw new Error('No response returned by the AI model');
      }

      const message = choice.message;
      const toolCalls = message.tool_calls || [];

      // If the model wants to call execute_read_only_sql
      if (toolCalls.length > 0) {
        messages.push({
          role: 'assistant',
          content: message.content || null,
          tool_calls: toolCalls
        });

        for (const tc of toolCalls) {
          if (tc.function.name === 'execute_read_only_sql') {
            let args = {};
            try {
              args = typeof tc.function.arguments === 'string'
                ? JSON.parse(tc.function.arguments)
                : tc.function.arguments;
            } catch (parseErr) {
              logger.warn({ parseErr: parseErr.message }, 'Failed to parse SQL tool arguments');
            }

            // Emit the tiny LLM-generated interim message immediately to cover up latency
            const interimMsg = args.interim_message || message.content || 'Checking our live inventory for you right now...';
            emitInterim(interimMsg);
            logger.info({ interimMsg, sql: args.query }, 'Emitted AI interim acknowledgment and executing SQL');

            if (typeof onSql === 'function') {
              try {
                onSql(args.query);
              } catch (_) {}
            }

            executedQueries.push(args.query);

            const toolResult = await handleExecuteReadOnlySql(args);
            toolResults.push({
              query: args.query,
              count: toolResult.count,
              durationMs: toolResult.durationMs,
              success: toolResult.success
            });

            if (toolResult.extractedCars && toolResult.extractedCars.length > 0) {
              collectedCars = toolResult.extractedCars;
              if (typeof onCars === 'function') {
                try {
                  onCars(collectedCars);
                } catch (_) {}
              }
            }

            // Return result to model
            messages.push({
              role: 'tool',
              tool_call_id: tc.id,
              content: JSON.stringify({
                success: toolResult.success,
                count: toolResult.count,
                rows: toolResult.rows || [],
                error: toolResult.error || null
              })
            });
          }
        }

        // Loop continues to let model synthesize answer based on SQL result
        continue;
      }

      // Final response produced - strip any accidental markdown image syntax since UI renders rich cards
      finalText = (message.content || '')
        .replace(/!\[.*?\]\(.*?\)/g, '')
        .replace(/^\s*[-*•]\s*$/gm, '')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
      break;
    }

    // Fallback if tokens were missing from API
    if (totalTokens === 0) {
      totalTokens = totalPromptTokens + totalCompletionTokens;
    }

    // Calculate cost in USD & INR
    const costDetails = calculateTokenCost(usedModel, totalPromptTokens, totalCompletionTokens);

    // If streaming tokens was requested and text is ready
    if (stream && onTextDelta && finalText) {
      onTextDelta(finalText);
    }

    // Save to conversation history
    this.appendToSession(sessionId, { role: 'user', content: prompt });
    this.appendToSession(sessionId, { role: 'assistant', content: finalText });

    const totalDuration = Date.now() - startTime;

    // Run parallel asynchronous log persistence to Supabase Cloud DB
    logAgentInteraction({
      sessionId,
      userId,
      customerName,
      userPrompt: prompt,
      assistantResponse: finalText,
      toolCalls: executedQueries.map((q) => ({ tool: 'execute_read_only_sql', query: q })),
      toolResults,
      matchedCars: collectedCars.map((c) => ({
        id: c.id,
        title: c.title,
        priceFormatted: c.priceFormatted,
        price: c.price
      })),
      model: usedModel,
      provider: usedProvider,
      inputTokens: totalPromptTokens,
      outputTokens: totalCompletionTokens,
      totalTokens,
      costUsd: costDetails.costUsd,
      costInr: costDetails.costInr,
      durationMs: totalDuration
    }).catch((err) => {
      logger.warn({ err: err.message }, 'Background Supabase log write notice');
    });

    logger.info(
      {
        sessionId,
        durationMs: totalDuration,
        carsCount: collectedCars.length,
        sqlCount: executedQueries.length,
        provider: usedProvider,
        model: usedModel,
        tokens: totalTokens,
        costUsd: costDetails.costUsd,
        costInr: costDetails.costInr
      },
      'Agent run completed with parallel cost analytics'
    );

    return {
      text: finalText,
      cars: collectedCars,
      sqlQueries: executedQueries,
      sessionId,
      provider: usedProvider,
      model: usedModel,
      inputTokens: totalPromptTokens,
      outputTokens: totalCompletionTokens,
      totalTokens,
      costUsd: costDetails.costUsd,
      costInr: costDetails.costInr,
      durationMs: totalDuration
    };
  }
}

export const agentEngine = new AgentEngine();
export default agentEngine;
