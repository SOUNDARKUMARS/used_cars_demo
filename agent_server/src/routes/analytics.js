import { getCostSummary } from '../services/costLogger.js';
import { supabase } from '../db/pool.js';
import logger from '../utils/logger.js';
import { checkAndCompactSession, getCompactedSummaries } from '../services/compactionService.js';

export async function analyticsRoutes(fastify) {
  /**
   * Aggregated cost & usage metrics
   * GET /api/v1/agent/analytics/summary
   */
  fastify.get('/api/v1/agent/analytics/summary', async (request, reply) => {
    try {
      const summary = await getCostSummary();
      return reply.code(200).send({
        success: true,
        data: summary
      });
    } catch (err) {
      logger.error({ err: err.message }, 'Failed to fetch agent cost summary');
      return reply.code(500).send({
        success: false,
        error: err.message
      });
    }
  });

  /**
   * Detailed message logs with tools & cost audit
   * GET /api/v1/agent/analytics/messages
   */
  fastify.get('/api/v1/agent/analytics/messages', async (request, reply) => {
    const { limit = 50, sessionId } = request.query || {};
    try {
      let query = supabase
        .from('agent_messages')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(Number(limit) || 50);

      if (sessionId) {
        query = query.eq('session_id', sessionId);
      }

      const { data, error } = await query;

      if (error) {
        return reply.code(200).send({
          success: true,
          tableExists: false,
          error: error.message,
          count: 0,
          messages: []
        });
      }

      return reply.code(200).send({
        success: true,
        tableExists: true,
        count: data?.length || 0,
        messages: data || []
      });
    } catch (err) {
      return reply.code(500).send({
        success: false,
        error: err.message
      });
    }
  });

  /**
   * Conversation sessions list
   * GET /api/v1/agent/analytics/sessions
   */
  fastify.get('/api/v1/agent/analytics/sessions', async (request, reply) => {
    try {
      const { data, error } = await supabase
        .from('agent_conversations')
        .select('*')
        .order('last_message_at', { ascending: false })
        .limit(50);

      if (error) {
        return reply.code(200).send({
          success: true,
          tableExists: false,
          sessions: []
        });
      }

      return reply.code(200).send({
        success: true,
        tableExists: true,
        sessions: data || []
      });
    } catch (err) {
      return reply.code(500).send({
        success: false,
        error: err.message
      });
    }
  });

  /**
   * Conversation Compacted Summaries (500 tokens cap rows)
   * GET /api/v1/agent/analytics/summaries
   */
  fastify.get('/api/v1/agent/analytics/summaries', async (request, reply) => {
    const { sessionId } = request.query || {};
    try {
      if (sessionId) {
        const summaries = await getCompactedSummaries(sessionId);
        return reply.code(200).send({
          success: true,
          tableExists: true,
          sessionId,
          count: summaries.length,
          summaries
        });
      }

      const { data, error } = await supabase
        .from('agent_conversation_summaries')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        return reply.code(200).send({
          success: true,
          tableExists: false,
          summaries: []
        });
      }

      return reply.code(200).send({
        success: true,
        tableExists: true,
        count: data?.length || 0,
        summaries: data || []
      });
    } catch (err) {
      return reply.code(500).send({
        success: false,
        error: err.message
      });
    }
  });

  /**
   * Trigger Manual Compaction for a Session
   * POST /api/v1/agent/compact
   */
  fastify.post('/api/v1/agent/compact', async (request, reply) => {
    const { sessionId, force = false } = request.body || {};
    if (!sessionId) {
      return reply.code(400).send({
        success: false,
        error: 'Missing required "sessionId" parameter'
      });
    }

    try {
      const result = await checkAndCompactSession(sessionId, force);
      return reply.code(200).send({
        success: true,
        data: result
      });
    } catch (err) {
      logger.error({ err: err.message, sessionId }, 'Manual compaction failed');
      return reply.code(500).send({
        success: false,
        error: err.message
      });
    }
  });
}

export default analyticsRoutes;
