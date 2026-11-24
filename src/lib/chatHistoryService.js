/**
 * chatHistoryService.js
 * Manages database persistence for logged-in user AI chat messages with
 * on-demand pagination (fetching the last 15 messages initially).
 */
import { supabase } from './supabase.js';

export const CHAT_PAGE_SIZE = 15;

/**
 * Saves a single message (user or assistant) to Supabase Cloud database
 */
export async function saveChatMessage({
  userId,
  sessionId,
  role,
  content,
  cars = [],
  sqlQueries = []
}) {
  if (!userId || !content) return null;

  try {
    const payload = {
      user_id: String(userId),
      session_id: sessionId || `user_${userId}`,
      role: role === 'user' ? 'user' : 'assistant',
      content: String(content),
      cars: Array.isArray(cars) ? cars : [],
      sql_queries: Array.isArray(sqlQueries) ? sqlQueries : []
    };

    const { data, error } = await supabase
      .from('agent_chat_messages')
      .insert([payload])
      .select()
      .maybeSingle();

    if (error) {
      // If agent_chat_messages table hasn't been created yet, fall back to agent_messages
      if (error.code === 'PGRST205' || error.message?.includes('does not exist')) {
        console.debug('[chatHistoryService] agent_chat_messages table not created yet. Run migration SQL.');
        return null;
      }
      console.warn('[chatHistoryService] Failed to save chat message:', error.message);
      return null;
    }

    return data;
  } catch (err) {
    console.warn('[chatHistoryService] Save message error:', err.message);
    return null;
  }
}

/**
 * Fetches user chat messages with reverse-chronological pagination.
 * Only fetches 15 messages per page and returns them in display order (oldest to newest).
 */
export async function fetchChatMessages({ userId, page = 0, pageSize = CHAT_PAGE_SIZE }) {
  if (!userId) {
    return { messages: [], hasMore: false, totalCount: 0 };
  }

  const from = page * pageSize;
  const to = from + pageSize - 1;

  try {
    // 1. Primary: query agent_chat_messages
    const { data, count, error } = await supabase
      .from('agent_chat_messages')
      .select('*', { count: 'exact' })
      .eq('user_id', String(userId))
      .order('created_at', { ascending: false })
      .range(from, to);

    if (!error && Array.isArray(data)) {
      const total = count || 0;
      const formatted = data.map((row) => ({
        id: row.id,
        role: row.role,
        content: row.content,
        cars: Array.isArray(row.cars) ? row.cars : [],
        sqlQueries: Array.isArray(row.sql_queries) ? row.sql_queries : [],
        timestamp: row.created_at
          ? new Date(row.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        createdAt: row.created_at
      }));

      // Reverse the fetched descending page so it appears chronologically
      return {
        messages: formatted.reverse(),
        totalCount: total,
        hasMore: total > to + 1
      };
    }

    // 2. Fallback: If agent_chat_messages table doesn't exist yet, check agent_messages
    if (error && (error.code === 'PGRST205' || error.message?.includes('does not exist'))) {
      const userSessionId = `user_${userId}`;
      const turnPageSize = Math.max(1, Math.ceil(pageSize / 2));
      const turnFrom = page * turnPageSize;
      const turnTo = turnFrom + turnPageSize - 1;

      const { data: turns, count: turnsCount, error: turnErr } = await supabase
        .from('agent_messages')
        .select('*', { count: 'exact' })
        .eq('session_id', userSessionId)
        .order('created_at', { ascending: false })
        .range(turnFrom, turnTo);

      if (!turnErr && Array.isArray(turns)) {
        const msgs = [];
        turns.forEach((turn) => {
          if (turn.user_prompt) {
            msgs.push({
              id: `user_${turn.id}`,
              role: 'user',
              content: turn.user_prompt,
              timestamp: new Date(turn.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              createdAt: turn.created_at
            });
          }
          if (turn.assistant_response) {
            msgs.push({
              id: `assistant_${turn.id}`,
              role: 'assistant',
              content: turn.assistant_response,
              cars: Array.isArray(turn.matched_cars) ? turn.matched_cars : [],
              sqlQueries: Array.isArray(turn.tool_calls)
                ? turn.tool_calls.map((t) => t.function?.arguments?.query || t.query).filter(Boolean)
                : [],
              timestamp: new Date(turn.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              createdAt: turn.created_at
            });
          }
        });

        const totalMsgs = (turnsCount || 0) * 2;
        return {
          messages: msgs,
          totalCount: totalMsgs,
          hasMore: (turnsCount || 0) > turnTo + 1
        };
      }
    }

    return { messages: [], hasMore: false, totalCount: 0 };
  } catch (err) {
    console.warn('[chatHistoryService] Fetch chat messages error:', err.message);
    return { messages: [], hasMore: false, totalCount: 0 };
  }
}

/**
 * Clears user chat history from database
 */
export async function clearUserChatHistory(userId) {
  if (!userId) return false;

  try {
    await supabase
      .from('agent_chat_messages')
      .delete()
      .eq('user_id', String(userId));

    // Also remove from agent_messages under user session if present
    await supabase
      .from('agent_messages')
      .delete()
      .eq('session_id', `user_${userId}`);

    return true;
  } catch (err) {
    console.warn('[chatHistoryService] Clear chat history error:', err.message);
    return false;
  }
}
