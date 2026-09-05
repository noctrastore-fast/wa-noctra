import { env } from './env';

export const storeConfig = {
  name: env.STORE_NAME,
  currency: env.STORE_CURRENCY,
  timezone: env.STORE_TIMEZONE,
  brandTagline: 'Your Digital Gaming Store',
} as const;

export const whatsappConfig = {
  token: env.WHATSAPP_TOKEN,
  phoneNumberId: env.WHATSAPP_PHONE_NUMBER_ID,
  verifyToken: env.WHATSAPP_VERIFY_TOKEN,
  apiVersion: env.WHATSAPP_API_VERSION,
  graphBaseUrl: 'https://graph.facebook.com',
} as const;
