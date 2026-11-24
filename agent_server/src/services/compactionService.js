import OpenAI from 'openai';
import env from '../config/env.js';
import logger from '../utils/logger.js';
import { supabase } from '../db/pool.js';

export const COMPACTION_THRESHOLD = 20; // Summarize when 20 uncompacted messages accumulate
export const MAX_SUMMARY_ROW_TOKENS = 500; // Hard ceiling per summary row
export const TARGET_SUMMARY_TOKENS = 400; // Target generation length to prevent premature row splitting

/**
 * Fast local token estimation (~3.8 chars per token for English text)
 */
export function estimateTokens(text = '') {
  if (!text) return 0;
  return Math.max(1, Math.ceil(text.trim().length / 3.8));
}

/**
 * LLM client initialization with OpenRouter & OpenAI fallback
 */
function getCompactorClients() {
  const primaryClient = new OpenAI({
    apiKey: env.OPENROUTER_API_KEY,
    baseURL: 'https://openrouter.ai/api/v1',
    defaultHeaders: {
      'HTTP-Referer': 'https://harshacars.com',
      'X-Title': 'Harsha Cars Compactor'
    }
  });

  const fallbackClient = env.OPENAI_API_KEY
    ? new OpenAI({ apiKey: env.OPENAI_API_KEY })
    : null;

  return { primaryClient, fallbackClient };
}

/**
 * Calls LLM to synthesize/compact conversation messages
 */
async function callSummarizerLlm({ systemPrompt, userPrompt, maxTokens = 450 }) {
  const { primaryClient, fallbackClient } = getCompactorClients();
  const primaryModel = env.AGENT_MODEL || 'deepseek/deepseek-v4.1-flash';
  const fallbackModel = 'gpt-4o-mini';

  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt }
  ];

  try {
    const response = await primaryClient.chat.completions.create({
      model: primaryModel,
      messages,
      temperature: 0.2,
      max_tokens: maxTokens,
      provider: {
        order: ['Baidu', 'OpenInference', 'Fireworks'],
        allow_fallbacks: true
      }
    });

    const text = response.choices?.[0]?.message?.content?.trim() || '';
    const tokens = response.usage?.completion_tokens || estimateTokens(text);
    return { text, tokens, model: primaryModel };
  } catch (err) {
    if (fallbackClient) {
      logger.info({ err: err.message }, 'Using fallback LLM for conversation compaction');
      const response = await fallbackClient.chat.completions.create({
        model: fallbackModel,
        messages,
        temperature: 0.2,
        max_tokens: maxTokens
      });

      const text = response.choices?.[0]?.message?.content?.trim() || '';
      const tokens = response.usage?.completion_tokens || estimateTokens(text);
      return { text, tokens, model: fallbackModel };
    }
    throw err;
  }
}

/**
 * Fetch all existing compacted summary rows for a given session
 */
export async function getCompactedSummaries(sessionId) {
  if (!sessionId) return [];
  try {
    const { data, error } = await supabase
      .from('agent_conversation_summaries')
      .select('id, session_id, summary, token_count, message_count, is_sealed, created_at, updated_at')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (error) {
      if (error.code === 'PGRST205' || error.message?.includes('does not exist')) {
        logger.debug('agent_conversation_summaries table not found. Awaiting SQL migration.');
        return [];
      }
      logger.warn({ err: error.message, sessionId }, 'Error fetching conversation summaries');
      return [];
    }

    return data || [];
  } catch (err) {
    logger.warn({ err: err.message }, 'Notice getting conversation summaries');
    return [];
  }
}

/**
 * Formats compacted summaries into a clean prompt memory block
 */
export function formatCompactedMemoryBlock(summaries = []) {
  if (!Array.isArray(summaries) || summaries.length === 0) return '';

  const parts = summaries.map((s, idx) => {
    return `[Memory Part ${idx + 1} (${s.token_count || 0} tokens, ${s.message_count || 0} msgs)]:\n${s.summary.trim()}`;
  });

  return `### PREVIOUS CONVERSATION MEMORY (COMPACTED):\n${parts.join('\n\n')}`;
}

/**
 * Core Compaction Engine:
 * 1. Checks if uncompacted messages >= 20
 * 2. Takes a 20-message batch
 * 3. Compacts into existing open row if token_count < 500
 * 4. If row exceeds 500 or already full, creates a new summary row
 * 5. Flags processed messages as is_compacted = true
 */
export async function checkAndCompactSession(sessionId, force = false) {
  if (!sessionId) return { success: false, reason: 'missing_session_id' };

  try {
    // 1. Fetch uncompacted messages
    const { data: uncompacted, error: fetchErr } = await supabase
      .from('agent_messages')
      .select('id, user_prompt, assistant_response, created_at')
      .eq('session_id', sessionId)
      .eq('is_compacted', false)
      .order('created_at', { ascending: true });

    if (fetchErr) {
      if (fetchErr.code === 'PGRST205' || fetchErr.message?.includes('does not exist')) {
        return { success: false, reason: 'migration_pending' };
      }
      logger.warn({ err: fetchErr.message }, 'Failed to query uncompacted messages');
      return { success: false, error: fetchErr.message };
    }

    const uncompactedCount = uncompacted?.length || 0;
    if (!force && uncompactedCount < COMPACTION_THRESHOLD) {
      return { success: true, compacted: false, uncompactedCount };
    }

    if (uncompactedCount === 0) {
      return { success: true, compacted: false, uncompactedCount: 0 };
    }

    // Take the oldest batch of up to 20 messages to compact
    const batch = uncompacted.slice(0, COMPACTION_THRESHOLD);
    const batchIds = batch.map((m) => m.id);

    // Format new conversation turns
    const formattedTurns = batch
      .map(
        (m, idx) =>
          `Turn ${idx + 1}:\nCustomer: ${m.user_prompt}\nSales Assistant: ${m.assistant_response}`
      )
      .join('\n\n');

    // 2. Fetch latest open (unsealed) summary row for this session
    const { data: openSummary } = await supabase
      .from('agent_conversation_summaries')
      .select('*')
      .eq('session_id', sessionId)
      .eq('is_sealed', false)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const SYSTEM_PROMPT = `You are the conversation memory compactor for Harsha Cars dealership.
Condense the user-sales conversation history into a dense, structured, factual memory summary.

CAPTURE CRITICAL CONTEXT:
1. Customer Profile: Exact budget (INR), preferred makes/models (e.g. Swift, Triber, Rapid), body types (SUV/Sedan/Hatchback), fuel (Petrol/Diesel), transmission (MT/AT), location (Tiruppur/Coimbatore).
2. Vehicles Discussed: Specific cars shown, customer likes/dislikes, pricing/EMI reactions, test drive requests/status.
3. Decision Status: Pending questions, objections, next action agreed upon.
4. Omit filler and chit-chat. Keep bullet points ultra-dense and factual.
5. HARD LIMIT: Output must remain under 450 tokens.`;

    let finalSummaryText = '';
    let finalTokens = 0;
    let targetRowId = null;
    let isNewRow = false;

    // 3. Scenario A: An existing open row exists with token_count < MAX_SUMMARY_ROW_TOKENS
    if (openSummary && (openSummary.token_count || 0) < MAX_SUMMARY_ROW_TOKENS) {
      logger.info(
        { sessionId, rowId: openSummary.id, existingTokens: openSummary.token_count },
        'Attempting to merge new messages into existing open summary row'
      );

      const userPrompt = `Here is the EXISTING CONVERSATION SUMMARY (${openSummary.token_count} tokens):
"""
${openSummary.summary}
"""

Here are ${batch.length} NEW CONVERSATION TURNS to incorporate:
"""
${formattedTurns}
"""

TASK:
Merge the existing summary with the new conversation turns into an updated, single cohesive memory block.
Ensure you retain all customer preferences, budgets, and vehicle statuses.
Strictly keep the total merged summary under ${MAX_SUMMARY_ROW_TOKENS} tokens if possible.`;

      const { text, tokens } = await callSummarizerLlm({
        systemPrompt: SYSTEM_PROMPT,
        userPrompt,
        maxTokens: MAX_SUMMARY_ROW_TOKENS
      });

      // Check if it successfully fit within 500 tokens
      if (tokens <= MAX_SUMMARY_ROW_TOKENS) {
        finalSummaryText = text;
        finalTokens = tokens;
        targetRowId = openSummary.id;

        // Update the existing row
        const willSeal = finalTokens >= 480;
        await supabase
          .from('agent_conversation_summaries')
          .update({
            summary: finalSummaryText,
            token_count: finalTokens,
            message_count: (openSummary.message_count || 0) + batch.length,
            is_sealed: willSeal,
            updated_at: new Date().toISOString()
          })
          .eq('id', openSummary.id);

        logger.info(
          { sessionId, rowId: openSummary.id, tokens: finalTokens, willSeal },
          'Updated existing summary row with new compacted messages'
        );
      } else {
        // Exceeded 500 tokens! Seal the old row and create a new row for the new batch
        logger.info(
          { sessionId, oldRowId: openSummary.id, overflowTokens: tokens },
          'Summary exceeded 500 tokens. Sealing existing row and creating a new summary row.'
        );

        // Seal the old row
        await supabase
          .from('agent_conversation_summaries')
          .update({ is_sealed: true, updated_at: new Date().toISOString() })
          .eq('id', openSummary.id);

        // Summarize the new batch separately for a new row
        const newBatchPrompt = `Summarize these ${batch.length} new conversation turns into a fresh, dense memory block (under 450 tokens):
"""
${formattedTurns}
"""`;

        const freshRes = await callSummarizerLlm({
          systemPrompt: SYSTEM_PROMPT,
          userPrompt: newBatchPrompt,
          maxTokens: 450
        });

        finalSummaryText = freshRes.text;
        finalTokens = freshRes.tokens;
        isNewRow = true;

        const { data: newRow } = await supabase
          .from('agent_conversation_summaries')
          .insert([
            {
              session_id: sessionId,
              summary: finalSummaryText,
              token_count: finalTokens,
              message_count: batch.length,
              is_sealed: finalTokens >= 480
            }
          ])
          .select()
          .single();

        targetRowId = newRow?.id;
      }
    } else {
      // 4. Scenario B: No open row exists (or latest is already sealed at >= 500 tokens) -> Create new row!
      if (openSummary) {
        // Ensure old row is marked sealed
        await supabase
          .from('agent_conversation_summaries')
          .update({ is_sealed: true })
          .eq('id', openSummary.id);
      }

      logger.info({ sessionId }, 'Creating a brand new summary row for the compacted batch');

      const userPrompt = `Summarize these ${batch.length} customer conversation messages into a dense, high-retention memory summary (under 450 tokens):
"""
${formattedTurns}
"""`;

      const { text, tokens } = await callSummarizerLlm({
        systemPrompt: SYSTEM_PROMPT,
        userPrompt,
        maxTokens: 450
      });

      finalSummaryText = text;
      finalTokens = tokens;
      isNewRow = true;

      const { data: newRow, error: insertErr } = await supabase
        .from('agent_conversation_summaries')
        .insert([
          {
            session_id: sessionId,
            summary: finalSummaryText,
            token_count: finalTokens,
            message_count: batch.length,
            is_sealed: finalTokens >= 480
          }
        ])
        .select()
        .single();

      if (insertErr) {
        logger.warn({ err: insertErr.message }, 'Failed to insert into agent_conversation_summaries');
      }
      targetRowId = newRow?.id;
    }

    // 5. Mark the processed messages as is_compacted = true
    const { error: updateErr } = await supabase
      .from('agent_messages')
      .update({ is_compacted: true })
      .in('id', batchIds);

    if (updateErr) {
      logger.warn({ err: updateErr.message }, 'Failed to set is_compacted on agent_messages');
    }

    logger.info(
      {
        sessionId,
        batchSize: batch.length,
        rowId: targetRowId,
        isNewRow,
        tokenCount: finalTokens
      },
      'Successfully completed conversation compaction batch'
    );

    return {
      success: true,
      compacted: true,
      batchSize: batch.length,
      rowId: targetRowId,
      isNewRow,
      tokenCount: finalTokens,
      remainingUncompacted: uncompactedCount - batch.length
    };
  } catch (err) {
    logger.warn({ err: err.message, sessionId }, 'Error during checkAndCompactSession');
    return { success: false, error: err.message };
  }
}

export default {
  COMPACTION_THRESHOLD,
  MAX_SUMMARY_ROW_TOKENS,
  TARGET_SUMMARY_TOKENS,
  estimateTokens,
  getCompactedSummaries,
  formatCompactedMemoryBlock,
  checkAndCompactSession
};
