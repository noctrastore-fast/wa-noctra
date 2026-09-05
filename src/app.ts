import express from 'express';
import pinoHttp from 'pino-http';
import { requestId } from './middleware/requestId';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { apiRouter } from './api/routes';
import { whatsappWebhookRouter } from './whatsapp/webhook.route';
import { logger } from './utils/logger';

export function createApp() {
  const app = express();

  app.disable('x-powered-by');
  app.use(requestId);
  app.use(
    pinoHttp({
      logger,
      customProps: (req) => ({ correlationId: req.correlationId }),
      autoLogging: { ignore: (req) => req.url === '/api/health' },
    }),
  );
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));

  app.use('/api', apiRouter);
  app.use('/webhooks/whatsapp', whatsappWebhookRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
