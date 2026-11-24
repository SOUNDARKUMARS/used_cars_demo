import { checkHealth } from '../db/pool.js';
import env from '../config/env.js';

export async function healthRoutes(fastify) {
  fastify.get('/health', async (request, reply) => {
    const health = await checkHealth();
    const isOk = health.status === 'healthy';
    return reply.code(isOk ? 200 : 503).send({
      status: isOk ? 'ok' : 'degraded',
      service: 'Harsha Cars AI Agent Server',
      database: health,
      model: env.AGENT_MODEL,
      timestamp: new Date().toISOString()
    });
  });
}

export default healthRoutes;
