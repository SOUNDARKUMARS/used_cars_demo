/**
 * agentApi.js
 * Client library connecting the Harsha Cars frontend to the modular Agent Server
 */

const DEFAULT_AGENT_BASE = 'http://localhost:4001/api/v1/agent';

export function getAgentApiUrl() {
  return (
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_AGENT_API_URL) ||
    (typeof process !== 'undefined' && process.env?.VITE_AGENT_API_URL) ||
    DEFAULT_AGENT_BASE
  );
}

/**
 * Standard Non-Streaming Chat Request
 */
export async function sendChatMessage({ prompt, sessionId, userId = null, customerName = null, history = null }) {
  const baseUrl = getAgentApiUrl();
  const response = await fetch(`${baseUrl}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, sessionId, userId, customerName, history })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Agent server returned ${response.status}`);
  }

  const result = await response.json();
  return result.data || result;
}

/**
 * Streaming Chat Request with real-time events (status, SQL, cars, text)
 */
export async function streamChatMessage({
  prompt,
  sessionId,
  userId = null,
  customerName = null,
  history = null,
  onStatus = null,
  onInterim = null,
  onSql = null,
  onCars = null,
  onTextDelta = null
}) {
  const baseUrl = getAgentApiUrl();

  try {
    const response = await fetch(`${baseUrl}/chat/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'text/event-stream'
      },
      body: JSON.stringify({ prompt, sessionId, userId, customerName, history })
    });

    if (!response.ok) {
      // Fallback to non-streaming chat endpoint
      return await sendChatMessage({ prompt, sessionId, userId, customerName, history });
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';
    let finalResult = null;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const blocks = buffer.split('\n\n');
      buffer = blocks.pop() || '';

      for (const block of blocks) {
        if (!block.trim()) continue;

        let eventType = 'message';
        let dataStr = '';

        const lines = block.split('\n');
        for (const line of lines) {
          if (line.startsWith('event: ')) {
            eventType = line.slice(7).trim();
          } else if (line.startsWith('data: ')) {
            dataStr = line.slice(6).trim();
          }
        }

        if (dataStr) {
          try {
            const data = JSON.parse(dataStr);

            if (eventType === 'agent:interim' && typeof onInterim === 'function') {
              onInterim(data.message);
            } else if (eventType === 'agent:status' && typeof onStatus === 'function') {
              onStatus(data.status);
            } else if (eventType === 'agent:sql' && typeof onSql === 'function') {
              onSql(data.sql);
            } else if (eventType === 'agent:cars' && typeof onCars === 'function') {
              onCars(data.cars);
            } else if (eventType === 'agent:text_delta' && typeof onTextDelta === 'function') {
              onTextDelta(data.delta);
            } else if (eventType === 'agent:done') {
              finalResult = data;
            } else if (eventType === 'agent:error') {
              throw new Error(data.error || 'Agent stream reported an error');
            }
          } catch (jsonErr) {
            // Ignore parse errors for partial chunks
          }
        }
      }
    }

    if (finalResult) {
      return finalResult;
    }

    return await sendChatMessage({ prompt, sessionId });
  } catch (err) {
    console.warn('[agentApi] Stream error, falling back to standard chat:', err.message);
    return await sendChatMessage({ prompt, sessionId });
  }
}

/**
 * Fetch available cars directly
 */
export async function fetchAgentCars() {
  const baseUrl = getAgentApiUrl();
  const res = await fetch(`${baseUrl}/cars`);
  if (!res.ok) throw new Error('Failed to fetch cars from agent');
  return await res.json();
}

/**
 * Complete SQL Setup script for Supabase SQL Editor
 */
export const AGENT_SQL_SETUP_SCRIPT = `-- ==============================================================================
-- HARSHA CARS AI AGENT: REAL-TIME COST ANALYSIS & MESSAGE AUDIT TABLES
-- Run this script in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/qkriofsteqxccheavuot/editor
-- ==============================================================================

-- 1. Conversation Sessions Rollup Table
CREATE TABLE IF NOT EXISTS public.agent_conversations (
    id TEXT PRIMARY KEY,
    customer_name TEXT,
    customer_phone TEXT,
    total_messages INTEGER DEFAULT 0,
    total_cost_usd NUMERIC(12, 6) DEFAULT 0.000000,
    total_cost_inr NUMERIC(12, 4) DEFAULT 0.0000,
    total_input_tokens INTEGER DEFAULT 0,
    total_output_tokens INTEGER DEFAULT 0,
    total_tokens INTEGER DEFAULT 0,
    last_message TEXT,
    last_message_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- 2. Detailed Messages & Parallel Cost Execution Logs
CREATE TABLE IF NOT EXISTS public.agent_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT NOT NULL,
    user_prompt TEXT NOT NULL,
    assistant_response TEXT NOT NULL,
    tool_calls JSONB DEFAULT '[]'::jsonb,
    tool_results JSONB DEFAULT '[]'::jsonb,
    matched_cars JSONB DEFAULT '[]'::jsonb,
    model TEXT NOT NULL DEFAULT 'deepseek/deepseek-v4.1-flash',
    provider TEXT NOT NULL DEFAULT 'openrouter',
    input_tokens INTEGER DEFAULT 0,
    output_tokens INTEGER DEFAULT 0,
    total_tokens INTEGER DEFAULT 0,
    cost_usd NUMERIC(12, 6) DEFAULT 0.000000,
    cost_inr NUMERIC(12, 4) DEFAULT 0.0000,
    duration_ms INTEGER DEFAULT 0,
    is_compacted BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- Ensure is_compacted exists even if agent_messages was created earlier
ALTER TABLE public.agent_messages 
ADD COLUMN IF NOT EXISTS is_compacted BOOLEAN DEFAULT false;

-- 3. Conversation Summaries Table (500 tokens cap per row)
CREATE TABLE IF NOT EXISTS public.agent_conversation_summaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT NOT NULL,
    summary TEXT NOT NULL,
    token_count INTEGER NOT NULL DEFAULT 0,
    message_count INTEGER NOT NULL DEFAULT 0,
    is_sealed BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- Fast Indexing for Real-Time Querying & Compaction
CREATE INDEX IF NOT EXISTS idx_agent_messages_session ON public.agent_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_agent_messages_created_at ON public.agent_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_messages_model ON public.agent_messages(model);
CREATE INDEX IF NOT EXISTS idx_agent_messages_compaction ON public.agent_messages(session_id, is_compacted, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_agent_conversations_last_at ON public.agent_conversations(last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_conv_summaries_session ON public.agent_conversation_summaries(session_id, created_at ASC);

-- Enable Row Level Security (RLS)
ALTER TABLE public.agent_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_conversation_summaries ENABLE ROW LEVEL SECURITY;

-- Allow Public/Anon read & insert (so agent server & admin dashboard can log & display)
DROP POLICY IF EXISTS "Allow all on agent_conversations" ON public.agent_conversations;
CREATE POLICY "Allow all on agent_conversations" 
ON public.agent_conversations 
FOR ALL 
USING (true) 
WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all on agent_messages" ON public.agent_messages;
CREATE POLICY "Allow all on agent_messages" 
ON public.agent_messages 
FOR ALL 
USING (true) 
WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all on agent_conversation_summaries" ON public.agent_conversation_summaries;
CREATE POLICY "Allow all on agent_conversation_summaries" 
ON public.agent_conversation_summaries 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- 3. Pre-aggregated Real-time Summary View
CREATE OR REPLACE VIEW public.agent_cost_summary AS
SELECT
    COUNT(*)::INTEGER AS total_ai_messages,
    COUNT(DISTINCT session_id)::INTEGER AS total_sessions,
    COALESCE(SUM(cost_usd), 0)::NUMERIC(12, 6) AS total_cost_usd,
    COALESCE(SUM(cost_inr), 0)::NUMERIC(12, 4) AS total_cost_inr,
    COALESCE(SUM(input_tokens), 0)::INTEGER AS total_input_tokens,
    COALESCE(SUM(output_tokens), 0)::INTEGER AS total_output_tokens,
    COALESCE(SUM(total_tokens), 0)::INTEGER AS total_tokens,
    COALESCE(AVG(duration_ms), 0)::INTEGER AS avg_duration_ms
FROM public.agent_messages;`;

/**
 * Fetch Aggregated AI Cost & Usage Summary
 */
export async function fetchAgentAnalyticsSummary() {
  const baseUrl = getAgentApiUrl();
  try {
    const res = await fetch(`${baseUrl}/analytics/summary`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    return json.data || json;
  } catch (err) {
    console.warn('[agentApi] Analytics summary error:', err.message);
    return null;
  }
}

/**
 * Fetch Detailed Messages with SQL & Cost Tracking
 */
export async function fetchAgentAnalyticsMessages(limit = 50) {
  const baseUrl = getAgentApiUrl();
  try {
    const res = await fetch(`${baseUrl}/analytics/messages?limit=${limit}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    return json;
  } catch (err) {
    console.warn('[agentApi] Analytics messages error:', err.message);
    return { success: false, messages: [] };
  }
}

/**
 * Fetch Aggregated Sessions
 */
export async function fetchAgentAnalyticsSessions() {
  const baseUrl = getAgentApiUrl();
  try {
    const res = await fetch(`${baseUrl}/analytics/sessions`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    return json;
  } catch (err) {
    console.warn('[agentApi] Analytics sessions error:', err.message);
    return { success: false, sessions: [] };
  }
}

/**
 * Fetch Compacted Conversation Summaries (500 tokens cap per row)
 */
export async function fetchAgentAnalyticsSummaries(sessionId = '') {
  const baseUrl = getAgentApiUrl();
  try {
    const url = sessionId
      ? `${baseUrl}/analytics/summaries?sessionId=${encodeURIComponent(sessionId)}`
      : `${baseUrl}/analytics/summaries`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    return json;
  } catch (err) {
    console.warn('[agentApi] Analytics summaries error:', err.message);
    return { success: false, summaries: [] };
  }
}

/**
 * Trigger manual compaction on a session
 */
export async function triggerAgentCompaction({ sessionId, force = true }) {
  const baseUrl = getAgentApiUrl();
  try {
    const res = await fetch(`${baseUrl}/compact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, force })
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('[agentApi] Trigger compaction error:', err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Fetch Instagram Connection and Webhook Status
 */
export async function fetchInstagramStatus() {
  const baseUrl = getAgentApiUrl();
  // Strip '/agent' to access '/api/v1/instagram/status'
  const rootApi = baseUrl.replace(/\/agent\/?$/, '');
  try {
    const res = await fetch(`${rootApi}/instagram/status`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('[agentApi] Instagram status error:', err.message);
    return { success: false, connected: false, error: err.message };
  }
}

/**
 * Simulate an incoming Instagram DM for admin testing
 */
export async function simulateInstagramMessage(prompt, senderId = 'admin_tester') {
  const baseUrl = getAgentApiUrl();
  const rootApi = baseUrl.replace(/\/agent\/?$/, '');
  try {
    const res = await fetch(`${rootApi}/instagram/simulate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, senderId })
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('[agentApi] Instagram simulation error:', err.message);
    return { success: false, error: err.message };
  }
}

