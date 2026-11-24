-- ==============================================================================
-- HARSHA CARS AI AGENT: USER CHAT MESSAGES WITH PAGINATION & CONTEXT
-- Run this script in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/qkriofsteqxccheavuot/editor
-- ==============================================================================

-- 1. Create Dedicated User Chat Messages Table
CREATE TABLE IF NOT EXISTS public.agent_chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    session_id TEXT,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    cars JSONB DEFAULT '[]'::jsonb,
    sql_queries JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- 2. Fast Index for User Pagination (fetching latest 15, then page-wise)
CREATE INDEX IF NOT EXISTS idx_agent_chat_messages_user_created 
ON public.agent_chat_messages(user_id, created_at DESC);

-- 3. Add user_id column to existing agent_messages and agent_conversations if not exists
ALTER TABLE public.agent_messages 
ADD COLUMN IF NOT EXISTS user_id TEXT;

ALTER TABLE public.agent_conversations 
ADD COLUMN IF NOT EXISTS user_id TEXT;

CREATE INDEX IF NOT EXISTS idx_agent_messages_user_id 
ON public.agent_messages(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_agent_conversations_user_id 
ON public.agent_conversations(user_id);

-- 4. Enable Row Level Security (RLS) & Policies
ALTER TABLE public.agent_chat_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all on agent_chat_messages" ON public.agent_chat_messages;
CREATE POLICY "Allow all on agent_chat_messages" 
ON public.agent_chat_messages 
FOR ALL 
USING (true) 
WITH CHECK (true);
