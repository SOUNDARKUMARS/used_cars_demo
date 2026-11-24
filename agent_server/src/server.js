import Fastify from 'fastify';
import cors from '@fastify/cors';
import env from './config/env.js';
import logger from './utils/logger.js';
import { checkHealth, closePool } from './db/pool.js';
import healthRoutes from './routes/health.js';
import chatRoutes from './routes/chat.js';
import analyticsRoutes from './routes/analytics.js';
import instagramWebhookRoutes from './routes/instagramWebhook.js';

export async function buildApp(opts = {}) {
  const app = Fastify({
    loggerInstance: logger,
    ...opts
  });

  // Enable CORS for frontend clients
  await app.register(cors, {
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
  });

  // Register modular routes
  await app.register(healthRoutes);
  await app.register(chatRoutes);
  await app.register(analyticsRoutes);
  await app.register(instagramWebhookRoutes);

  // Welcome route
  app.get('/', async (request, reply) => {
    return reply.send({
      name: 'Harsha Cars AI Agent Server',
      status: 'active',
      model: env.AGENT_MODEL,
      endpoints: {
        health: 'GET /health',
        chat: 'POST /api/v1/agent/chat',
        streamChat: 'POST /api/v1/agent/chat/stream',
        cars: 'GET /api/v1/agent/cars',
        sessionMessages: 'GET /api/v1/agent/messages/:sessionId',
        instagramStatus: 'GET /api/v1/instagram/status',
        instagramWebhook: 'GET/POST /api/v1/instagram/webhook',
        instagramSimulate: 'POST /api/v1/instagram/simulate'
      }
    });
  });

  return app;
}

export async function startServer() {
  const app = await buildApp();
  try {
    await app.listen({ port: env.PORT, host: env.HOST });
    logger.info(
      { port: env.PORT, host: env.HOST, model: env.AGENT_MODEL, database: 'Supabase Cloud Database' },
      'Harsha Cars Agent Server running directly with Supabase Cloud DB'
    );
  } catch (err) {
    logger.error({ err: err.message }, 'Failed to start agent server');
    process.exit(1);
  }

  const shutdown = async () => {
    logger.info('Shutting down agent server...');
    await app.close();
    await closePool();
    process.exit(0);
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);

  return app;
}

// Auto-start if run directly
if (process.argv[1] && process.argv[1].endsWith('server.js')) {
  startServer();
}

export default { buildApp, startServer };
