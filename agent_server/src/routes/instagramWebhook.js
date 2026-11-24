import env from '../config/env.js';
import logger from '../utils/logger.js';
import agentEngine from '../agent/agent.engine.js';
import { BRAND_NAME } from '../config/constants.js';

/**
 * Send an outbound message to a user on Instagram via Meta Graph API
 */
export async function sendInstagramMessage(
  recipientId,
  text,
  accessToken = env.INSTAGRAM_PAGE_ACCESS_TOKEN
) {
  if (!accessToken) {
    logger.warn({ recipientId }, 'Cannot send Instagram reply: INSTAGRAM_PAGE_ACCESS_TOKEN is not configured');
    return null;
  }

  try {
    const isInstagramToken = accessToken.startsWith('IG');
    const apiHost = isInstagramToken ? 'graph.instagram.com' : 'graph.facebook.com';
    const url = `https://${apiHost}/v21.0/me/messages?access_token=${encodeURIComponent(accessToken)}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        recipient: { id: recipientId },
        message: { text }
      })
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      logger.error({ status: response.status, data }, 'Failed to send Instagram message via Graph API');
      return null;
    }

    logger.info({ recipientId, messageId: data.message_id }, 'Sent reply to Instagram user');
    return data;
  } catch (err) {
    logger.error({ err: err.message, recipientId }, 'Error sending Instagram message');
    return null;
  }
}

/**
 * Send a sender_action (e.g. 'typing_on', 'typing_off', 'mark_seen') to Instagram/Messenger user
 * to display the native animated typing bubble while the agent is processing.
 */
export async function sendInstagramSenderAction(
  recipientId,
  action = 'typing_on',
  accessToken = env.INSTAGRAM_PAGE_ACCESS_TOKEN
) {
  if (!accessToken) {
    logger.warn({ recipientId, action }, 'Cannot send Instagram sender_action: INSTAGRAM_PAGE_ACCESS_TOKEN is not configured');
    return null;
  }

  try {
    const isInstagramToken = accessToken.startsWith('IG');
    const apiHost = isInstagramToken ? 'graph.instagram.com' : 'graph.facebook.com';
    const url = `https://${apiHost}/v21.0/me/messages?access_token=${encodeURIComponent(accessToken)}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        recipient: { id: recipientId },
        sender_action: action
      })
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      logger.debug({ status: response.status, data, action }, 'Instagram sender_action response');
      return null;
    }

    logger.info({ recipientId, action }, 'Sent sender_action to Instagram user');
    return data;
  } catch (err) {
    logger.debug({ err: err.message, recipientId, action }, 'Error sending Instagram sender_action');
    return null;
  }
}

/**
 * Fastify routes for Instagram DM Webhook integration
 */
export async function instagramWebhookRoutes(fastify) {
  /**
   * 1. GET /api/v1/instagram/status
   * Health and setup status for the Instagram connection
   */
  fastify.get('/api/v1/instagram/status', async (request, reply) => {
    const hasToken = Boolean(env.INSTAGRAM_PAGE_ACCESS_TOKEN);
    const tokenPreview = hasToken
      ? `${env.INSTAGRAM_PAGE_ACCESS_TOKEN.slice(0, 8)}...${env.INSTAGRAM_PAGE_ACCESS_TOKEN.slice(-6)}`
      : null;

    return reply.code(200).send({
      success: true,
      service: `${BRAND_NAME} Instagram DM AI Assistant`,
      connected: hasToken,
      tokenConfigured: hasToken,
      tokenPreview,
      verifyToken: env.INSTAGRAM_VERIFY_TOKEN,
      webhookPath: '/api/v1/instagram/webhook',
      note: 'Configure this webhook URL in your Meta App Dashboard under Instagram Messenger Webhooks with field "messages".'
    });
  });

  /**
   * 2. GET /api/v1/instagram/webhook
   * Verification handshake endpoint required by Meta.
   * Meta sends hub.mode, hub.verify_token, and hub.challenge.
   */
  fastify.get('/api/v1/instagram/webhook', async (request, reply) => {
    const mode = request.query['hub.mode'];
    const token = request.query['hub.verify_token'];
    const challenge = request.query['hub.challenge'];

    const validTokens = [
      env.INSTAGRAM_VERIFY_TOKEN,
      'harsha_ig_verify_token_2026',
      'esan_ig_verify_token_2026'
    ].filter(Boolean);

    if (mode === 'subscribe' && validTokens.includes(token)) {
      logger.info({ mode }, 'Instagram webhook verified successfully by Meta');
      return reply.code(200).type('text/plain').send(challenge);
    }

    logger.warn({ receivedToken: token, validTokens }, 'Instagram webhook verification failed');
    return reply.code(403).send('Forbidden: Verification token mismatch');
  });

  /**
   * 3. POST /api/v1/instagram/webhook
   * Receives incoming messages and events from Instagram DMs.
   */
  fastify.post('/api/v1/instagram/webhook', async (request, reply) => {
    const body = request.body || {};

    // Meta requires an immediate 200 OK acknowledgment
    reply.code(200).send({ status: 'EVENT_RECEIVED' });

    // Validate object type
    if (body.object !== 'instagram' && body.object !== 'page') {
      return;
    }

    const entries = Array.isArray(body.entry) ? body.entry : [];

    for (const entry of entries) {
      const messagingEvents = Array.isArray(entry.messaging) ? entry.messaging : [];

      for (const event of messagingEvents) {
        const senderId = event.sender?.id;
        const message = event.message;

        // Skip echo messages or non-text messages
        if (!message || message.is_echo || !message.text) {
          continue;
        }

        const incomingText = message.text.trim();
        logger.info({ senderId, text: incomingText }, 'Received incoming Instagram DM');

        // Execute Harsha Cars AI Agent asynchronously
        (async () => {
          try {
            // 1. Instantly mark user message as seen & trigger typing indicator ("typing_on")
            await sendInstagramSenderAction(senderId, 'mark_seen');
            await sendInstagramSenderAction(senderId, 'typing_on');

            const sessionId = `ig_${senderId}`;

            const result = await agentEngine.run({
              prompt: incomingText,
              sessionId,
              customerName: 'Instagram Customer'
            });

            // Format clean response for Instagram DM
            let replyText = (result.text || '')
              .replace(/\[\[car:.*?\]\]/g, '')
              .replace(/\n{3,}/g, '\n\n')
              .trim();

            // Append vehicle summaries if cars were matched
            if (Array.isArray(result.cars) && result.cars.length > 0) {
              const carSummary = result.cars
                .slice(0, 3)
                .map((c) => {
                  const price = c.priceFormatted || `₹ ${Number(c.price).toLocaleString('en-IN')}`;
                  const emi = c.emi ? ` (${c.emi})` : '';
                  const loc = c.location ? ` • ${c.location.split(',')[0]}` : '';
                  return `🚗 ${c.title}\n   ${price}${emi}${loc}`;
                })
                .join('\n\n');

              replyText += `\n\n${carSummary}\n\n👉 Book a free doorstep test drive or view more details with Harsha Cars!`;
            }

            if (!replyText) {
              replyText = `Hello from ${BRAND_NAME}! 🚗 How can we assist you with certified pre-owned cars in Tiruppur and Coimbatore today?`;
            }

            // 2. Deliver message (Meta automatically clears typing_on when message is sent)
            await sendInstagramMessage(senderId, replyText);
          } catch (agentErr) {
            logger.error({ err: agentErr.message, senderId }, 'Error running agent for Instagram DM');
            await sendInstagramSenderAction(senderId, 'typing_off');
            await sendInstagramMessage(
              senderId,
              `Sorry, I had a brief issue querying our car inventory. Please ask your question again!`
            );
          }
        })();
      }
    }
  });

  /**
   * 4. POST /api/v1/instagram/sender-action
   * Endpoint to trigger typing indicator or mark as seen directly via Meta Graph API
   */
  fastify.post('/api/v1/instagram/sender-action', async (request, reply) => {
    const { recipientId, action = 'typing_on' } = request.body || {};
    if (!recipientId) {
      return reply.code(400).send({ success: false, error: 'Missing recipientId' });
    }

    const res = await sendInstagramSenderAction(recipientId, action);
    return reply.code(200).send({
      success: true,
      recipientId,
      action,
      data: res
    });
  });

  /**
   * 5. POST /api/v1/instagram/simulate
   * Simulator endpoint to test the agent DM flow locally without Meta webhooks
   */
  fastify.post('/api/v1/instagram/simulate', async (request, reply) => {
    const { prompt, senderId = 'test_ig_user_123' } = request.body || {};

    if (!prompt) {
      return reply.code(400).send({ success: false, error: 'Missing prompt' });
    }

    try {
      const sessionId = `ig_${senderId}`;
      const result = await agentEngine.run({
        prompt: prompt.trim(),
        sessionId,
        customerName: 'Simulated Instagram User'
      });

      let replyText = (result.text || '')
        .replace(/\[\[car:.*?\]\]/g, '')
        .replace(/\n{3,}/g, '\n\n')
        .trim();

      if (Array.isArray(result.cars) && result.cars.length > 0) {
        const carSummary = result.cars
          .slice(0, 3)
          .map((c) => {
            const price = c.priceFormatted || `₹ ${Number(c.price).toLocaleString('en-IN')}`;
            const emi = c.emi ? ` (${c.emi})` : '';
            const loc = c.location ? ` • ${c.location.split(',')[0]}` : '';
            return `🚗 ${c.title}\n   ${price}${emi}${loc}`;
          })
          .join('\n\n');

        replyText += `\n\n${carSummary}\n\n👉 Book a free doorstep test drive or view more details with Harsha Cars!`;
      }

      return reply.code(200).send({
        success: true,
        senderId,
        incomingPrompt: prompt,
        typingIndicatorTriggered: true,
        senderActionsExecuted: ['mark_seen', 'typing_on', 'typing_off'],
        formattedInstagramReply: replyText,
        matchedCarsCount: result.cars?.length || 0,
        sqlExecuted: result.sqlQueries || []
      });
    } catch (err) {
      return reply.code(500).send({ success: false, error: err.message });
    }
  });
}

export default instagramWebhookRoutes;
