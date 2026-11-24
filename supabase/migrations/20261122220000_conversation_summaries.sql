-- ==============================================================================
-- HARSHA CARS AI AGENT: ALL-IN-ONE SETUP & COMPACTION TABLES
-- Run this entire script in your Supabase SQL Editor:
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

-- 2. Detailed Messages Table
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

-- Fast Indexing for Real-Time Querying & Admin Filters
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

-- 4. Pre-aggregated Real-time Summary View
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
FROM public.agent_messages;
