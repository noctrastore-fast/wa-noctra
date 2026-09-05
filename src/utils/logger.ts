import pino from 'pino';
import { env } from '../config/env';

export const logger = pino({
  level: env.NODE_ENV === 'production' ? 'info' : 'debug',
  transport:
    env.NODE_ENV === 'production'
      ? undefined
      : {
          target: 'pino-pretty',
          options: { colorize: true, translateTime: 'SYS:standard', ignore: 'pid,hostname' },
        },
  base: { service: 'noctra-store' },
  // Never log full env / secrets. Redact common sensitive keys defensively.
  redact: {
    paths: [
      'req.headers.authorization',
      '*.token',
      '*.WHATSAPP_TOKEN',
      '*.PAYMENT_API_KEY',
      '*.WEBHOOK_SECRET',
      '*.ADMIN_SECRET',
      '*.password',
    ],
    remove: true,
  },
});

/**
 * Creates a child logger tagged with a correlation id so a whole flow
 * (one WhatsApp message, one order, one webhook delivery) can be grepped
 * as a single unit in the logs.
 */
export function withCorrelation(correlationId: string) {
  return logger.child({ correlationId });
}
