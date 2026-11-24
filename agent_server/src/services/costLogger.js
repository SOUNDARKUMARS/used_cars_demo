import { supabase } from '../db/pool.js';
import logger from '../utils/logger.js';
import { checkAndCompactSession } from './compactionService.js';

// Exchange rate USD -> INR (configurable)
export const USD_TO_INR_RATE = 86.50;

/**
 * Calculates token cost in USD and INR for a given model.
 */
export function calculateTokenCost(model = '', promptTokens = 0, completionTokens = 0) {
  const m = (model || '').toLowerCase();

  // Pricing per 1,000,000 tokens
  let promptRatePerM = 0.14; // Default: DeepSeek V4.1 Flash ($0.14 / 1M)
  let completionRatePerM = 0.28; // Default: DeepSeek V4.1 Flash ($0.28 / 1M)

  if (m.includes('deepseek')) {
    promptRatePerM = 0.14;
    completionRatePerM = 0.28;
  } else if (m.includes('gpt-4o-mini')) {
    promptRatePerM = 0.15;
    completionRatePerM = 0.60;
  } else if (m.includes('gpt-4o')) {
    promptRatePerM = 2.50;
    completionRatePerM = 10.00;
  } else if (m.includes('glm')) {
    promptRatePerM = 0.10;
    completionRatePerM = 0.20;
  }

  const promptCostUsd = (promptTokens * promptRatePerM) / 1000000;
  const completionCostUsd = (completionTokens * completionRatePerM) / 1000000;
  const totalCostUsd = Number((promptCostUsd + completionCostUsd).toFixed(6));
  const totalCostInr = Number((totalCostUsd * USD_TO_INR_RATE).toFixed(4));

  return {
    costUsd: totalCostUsd,
    costInr: totalCostInr,
    promptRatePerM,
    completionRatePerM,
    usdToInrRate: USD_TO_INR_RATE
  };
}

/**
 * Asynchronously logs agent interaction and cost into Supabase Cloud DB.
 * Runs in parallel without blocking client response.
 */
export async function logAgentInteraction({
  sessionId,
  userId = null,
  customerName = null,
  userPrompt,
  assistantResponse,
  toolCalls = [],
  toolResults = [],
  matchedCars = [],
  model = 'deepseek/deepseek-v4.1-flash',
  provider = 'openrouter',
  inputTokens = 0,
  outputTokens = 0,
  totalTokens = 0,
  costUsd = 0,
  costInr = 0,
  durationMs = 0
}) {
  try {
    // 1. Insert message log
    const msgRecord = {
      session_id: sessionId,
      user_prompt: userPrompt,
      assistant_response: assistantResponse,
      tool_calls: toolCalls,
      tool_results: toolResults,
      matched_cars: matchedCars,
      model,
      provider,
      input_tokens: inputTokens,
      output_tokens: outputTokens,
      total_tokens: totalTokens,
      cost_usd: costUsd,
      cost_inr: costInr,
      duration_ms: durationMs,
      is_compacted: false
    };

    if (userId) {
      msgRecord.user_id = String(userId);
    }

    let { error: msgErr } = await supabase.from('agent_messages').insert([msgRecord]);

    // If user_id column doesn't exist yet, retry without it
    if (msgErr && (msgErr.code === 'PGRST204' || msgErr.message?.includes('user_id'))) {
      delete msgRecord.user_id;
      const retry = await supabase.from('agent_messages').insert([msgRecord]);
      msgErr = retry.error;
    }

    if (msgErr) {
      // Table might not exist yet if user hasn't run the SQL migration
      if (msgErr.code === 'PGRST205' || msgErr.message?.includes('does not exist')) {
        logger.debug('agent_messages table not created yet in Supabase. Run migration SQL.');
        return { success: false, reason: 'table_not_found' };
      }
      logger.warn({ err: msgErr.message }, 'Failed to insert into agent_messages');
      return { success: false, error: msgErr.message };
    }

    // 2. Upsert session rollup
    const { data: existingSession } = await supabase
      .from('agent_conversations')
      .select('id, customer_name, total_messages, total_cost_usd, total_cost_inr, total_input_tokens, total_output_tokens, total_tokens')
      .eq('id', sessionId)
      .maybeSingle();

    const newTotalMessages = (existingSession?.total_messages || 0) + 1;
    const newCostUsd = Number(((Number(existingSession?.total_cost_usd) || 0) + costUsd).toFixed(6));
    const newCostInr = Number(((Number(existingSession?.total_cost_inr) || 0) + costInr).toFixed(4));
    const newInputTokens = (existingSession?.total_input_tokens || 0) + inputTokens;
    const newOutputTokens = (existingSession?.total_output_tokens || 0) + outputTokens;
    const newTotalTokens = (existingSession?.total_tokens || 0) + totalTokens;

    const convRecord = {
      id: sessionId,
      customer_name: customerName || existingSession?.customer_name || null,
      total_messages: newTotalMessages,
      total_cost_usd: newCostUsd,
      total_cost_inr: newCostInr,
      total_input_tokens: newInputTokens,
      total_output_tokens: newOutputTokens,
      total_tokens: newTotalTokens,
      last_message: assistantResponse ? assistantResponse.slice(0, 200) : '',
      last_message_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    if (userId) {
      convRecord.user_id = String(userId);
    }

    let { error: convErr } = await supabase.from('agent_conversations').upsert([convRecord]);
    if (convErr && (convErr.code === 'PGRST204' || convErr.message?.includes('user_id'))) {
      delete convRecord.user_id;
      await supabase.from('agent_conversations').upsert([convRecord]);
    }

    // 3. Trigger asynchronous background compaction if 20 uncompacted messages accumulated
    checkAndCompactSession(sessionId).catch((compactErr) => {
      logger.debug({ err: compactErr.message, sessionId }, 'Background compaction check note');
    });

    return { success: true };
  } catch (err) {
    logger.warn({ err: err.message }, 'Parallel logAgentInteraction error (non-blocking)');
    return { success: false, error: err.message };
  }
}

/**
 * Retrieves aggregated cost & usage summary directly from Supabase Cloud DB.
 */
export async function getCostSummary() {
  try {
    const { data: messages, error } = await supabase
      .from('agent_messages')
      .select('id, session_id, model, provider, input_tokens, output_tokens, total_tokens, cost_usd, cost_inr, duration_ms, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      return {
        tableExists: false,
        error: error.message,
        totalMessages: 0,
        totalCostUsd: 0,
        totalCostInr: 0,
        totalTokens: 0,
        totalInputTokens: 0,
        totalOutputTokens: 0,
        totalSessions: 0,
        avgDurationMs: 0,
        modelBreakdown: {}
      };
    }

    const list = messages || [];
    let totalCostUsd = 0;
    let totalCostInr = 0;
    let totalInputTokens = 0;
    let totalOutputTokens = 0;
    let totalTokens = 0;
    let totalDuration = 0;
    const uniqueSessions = new Set();
    const modelBreakdown = {};

    for (const m of list) {
      totalCostUsd += Number(m.cost_usd) || 0;
      totalCostInr += Number(m.cost_inr) || 0;
      totalInputTokens += Number(m.input_tokens) || 0;
      totalOutputTokens += Number(m.output_tokens) || 0;
      totalTokens += Number(m.total_tokens) || 0;
      totalDuration += Number(m.duration_ms) || 0;
      if (m.session_id) uniqueSessions.add(m.session_id);

      const mod = m.model || 'unknown';
      if (!modelBreakdown[mod]) {
        modelBreakdown[mod] = { count: 0, costUsd: 0, costInr: 0, tokens: 0 };
      }
      modelBreakdown[mod].count += 1;
      modelBreakdown[mod].costUsd += Number(m.cost_usd) || 0;
      modelBreakdown[mod].costInr += Number(m.cost_inr) || 0;
      modelBreakdown[mod].tokens += Number(m.total_tokens) || 0;
    }

    return {
      tableExists: true,
      totalMessages: list.length,
      totalSessions: uniqueSessions.size,
      totalCostUsd: Number(totalCostUsd.toFixed(6)),
      totalCostInr: Number(totalCostInr.toFixed(4)),
      totalTokens,
      totalInputTokens,
      totalOutputTokens,
      avgCostPerMessageUsd: list.length ? Number((totalCostUsd / list.length).toFixed(6)) : 0,
      avgCostPerMessageInr: list.length ? Number((totalCostInr / list.length).toFixed(4)) : 0,
      avgDurationMs: list.length ? Math.round(totalDuration / list.length) : 0,
      modelBreakdown
    };
  } catch (err) {
    return {
      tableExists: false,
      error: err.message,
      totalMessages: 0,
      totalCostUsd: 0,
      totalCostInr: 0
    };
  }
}
