import agentEngine from '../agent/agent.engine.js';
import { executeReadOnlyQuery } from '../db/pool.js';
import { extractCarCards } from '../tools/executeReadOnlySql.js';
import logger from '../utils/logger.js';

export async function chatRoutes(fastify) {
  /**
   * Non-streaming chat endpoint
   * POST /api/v1/agent/chat
   */
  fastify.post('/api/v1/agent/chat', async (request, reply) => {
    const { prompt, sessionId, userId, customerName, history } = request.body || {};

    if (!prompt || typeof prompt !== 'string') {
      return reply.code(400).send({
        success: false,
        error: 'Missing required field: "prompt"'
      });
    }

    try {
      const result = await agentEngine.run({
        prompt: prompt.trim(),
        sessionId: sessionId || (userId ? `user_${userId}` : undefined),
        userId: userId || undefined,
        customerName: customerName || undefined,
        history: Array.isArray(history) ? history : undefined
      });

      return reply.code(200).send({
        success: true,
        data: result
      });
    } catch (err) {
      logger.error({ err: err.message }, 'Chat request failed');
      return reply.code(500).send({
        success: false,
        error: err.message || 'Internal agent error'
      });
    }
  });

  /**
   * Server-Sent Events (SSE) streaming chat endpoint
   * POST /api/v1/agent/chat/stream
   */
  fastify.post('/api/v1/agent/chat/stream', async (request, reply) => {
    const { prompt, sessionId, userId, customerName, history } = request.body || {};

    if (!prompt || typeof prompt !== 'string') {
      return reply.code(400).send({
        success: false,
        error: 'Missing required field: "prompt"'
      });
    }

    reply.raw.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    reply.raw.setHeader('Cache-Control', 'no-cache, no-transform');
    reply.raw.setHeader('Connection', 'keep-alive');
    reply.raw.setHeader('Access-Control-Allow-Origin', '*');
    reply.raw.flushHeaders();

    const sendEvent = (event, data) => {
      reply.raw.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    };

    try {
      const result = await agentEngine.run({
        prompt: prompt.trim(),
        sessionId: sessionId || (userId ? `user_${userId}` : undefined),
        userId: userId || undefined,
        customerName: customerName || undefined,
        history: Array.isArray(history) ? history : undefined,
        stream: true,
        onStatus: (status) => sendEvent('agent:status', { status }),
        onInterim: (message) => sendEvent('agent:interim', { message }),
        onSql: (sql) => sendEvent('agent:sql', { sql }),
        onCars: (cars) => sendEvent('agent:cars', { cars }),
        onTextDelta: (delta) => sendEvent('agent:text_delta', { delta })
      });

      sendEvent('agent:done', {
        text: result.text,
        cars: result.cars,
        sqlQueries: result.sqlQueries,
        sessionId: result.sessionId,
        durationMs: result.durationMs
      });

      reply.raw.end();
    } catch (err) {
      logger.error({ err: err.message }, 'Streaming chat request failed');
      sendEvent('agent:error', { error: err.message || 'Stream processing failed' });
      reply.raw.end();
    }
  });

  /**
   * Retrieve active inventory
   * GET /api/v1/agent/cars
   */
  fastify.get('/api/v1/agent/cars', async (request, reply) => {
    try {
      const res = await executeReadOnlyQuery(
        `SELECT id, title, make, model, year, price, price_formatted, km, fuel, transmission, body_type, location, image, emi, emi_numeric, inspected, ownership
         FROM cars
         WHERE listing_status = 'Available' AND is_draft = false
         ORDER BY price ASC
         LIMIT 50`
      );
      const cars = extractCarCards(res.rows);
      return reply.code(200).send({
        success: true,
        count: cars.length,
        cars
      });
    } catch (err) {
      return reply.code(500).send({
        success: false,
        error: err.message
      });
    }
  });

  /**
   * Retrieve conversation history for a session
   * GET /api/v1/agent/messages/:sessionId
   */
  fastify.get('/api/v1/agent/messages/:sessionId', async (request, reply) => {
    const { sessionId } = request.params;
    const history = agentEngine.getSessionHistory(sessionId);
    return reply.code(200).send({
      success: true,
      sessionId,
      messages: history
    });
  });
}

export default chatRoutes;
