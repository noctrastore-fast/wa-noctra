import { Router } from 'express';
import { whatsappConfig } from '../config/store';
import { withCorrelation } from '../utils/logger';
import { dispatchInboundMessage } from './messageDispatcher';
import type { WhatsAppWebhookPayload } from './types';

export const whatsappWebhookRouter = Router();

/**
 * Meta calls this once when you register the webhook URL in the Meta App
 * Dashboard, to prove you control the endpoint. Must echo back
 * `hub.challenge` if the verify token matches.
 */
whatsappWebhookRouter.get('/', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === whatsappConfig.verifyToken) {
    res.status(200).send(challenge);
    return;
  }

  res.sendStatus(403);
});

/**
 * Receives inbound messages/status updates from WhatsApp. Always responds
 * 200 quickly (Meta retries aggressively on non-2xx / timeout) and does
 * the actual work asynchronously-but-awaited within the request — Phase 1
 * traffic is low volume; a queue can be introduced later without changing
 * this route's contract.
 */
whatsappWebhookRouter.post('/', async (req, res) => {
  const log = withCorrelation(req.correlationId);
  const payload = req.body as WhatsAppWebhookPayload;

  // Always ack immediately so Meta doesn't retry/duplicate-deliver.
  res.sendStatus(200);

  try {
    const messages = payload.entry?.flatMap((e) => e.changes.flatMap((c) => c.value.messages ?? []));

    if (!messages || messages.length === 0) {
      return; // likely a status update (sent/delivered/read) — nothing to do in Phase 1
    }

    for (const message of messages) {
      await dispatchInboundMessage(message, req.correlationId);
    }
  } catch (err) {
    log.error({ err }, 'Failed processing WhatsApp webhook payload');
  }
});
