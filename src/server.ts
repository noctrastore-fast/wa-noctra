import { createApp } from './app';
import { env } from './config/env';
import { prisma } from './database/prisma';
import { logger } from './utils/logger';

async function bootstrap() {
  await prisma.$connect();
  logger.info('Database connected');

  const app = createApp();

  const server = app.listen(env.PORT, () => {
    logger.info(`🌙 Noctra Store server listening on port ${env.PORT} [${env.NODE_ENV}]`);
    logger.info(`Webhook URL to register in Meta: POST/GET http://<your-host>/webhooks/whatsapp`);
  });

  const shutdown = async (signal: string) => {
    logger.info(`${signal} received. Shutting down gracefully...`);
    server.close(async () => {
      await prisma.$disconnect();
      logger.info('Shutdown complete.');
      process.exit(0);
    });
  };

  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
}

bootstrap().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Fatal error during bootstrap:', err);
  process.exit(1);
});
