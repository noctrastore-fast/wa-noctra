import { describe, it, expect, vi, beforeAll } from 'vitest';

// Set required env vars BEFORE importing anything that reads them.
process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/noctra_test';
process.env.WHATSAPP_TOKEN = 'test-token';
process.env.WHATSAPP_PHONE_NUMBER_ID = 'test-phone-id';
process.env.WHATSAPP_VERIFY_TOKEN = 'test-verify-token';

let request: typeof import('supertest');
let createApp: typeof import('../src/app').createApp;

beforeAll(async () => {
  request = (await import('supertest')).default as unknown as typeof import('supertest');
  ({ createApp } = await import('../src/app'));
});

describe('WhatsApp webhook verification (GET)', () => {
  it('echoes hub.challenge when verify token matches', async () => {
    const app = createApp();
    const res = await request(app)
      .get('/webhooks/whatsapp')
      .query({ 'hub.mode': 'subscribe', 'hub.verify_token': 'test-verify-token', 'hub.challenge': '12345' });

    expect(res.status).toBe(200);
    expect(res.text).toBe('12345');
  });

  it('rejects when verify token does not match', async () => {
    const app = createApp();
    const res = await request(app)
      .get('/webhooks/whatsapp')
      .query({ 'hub.mode': 'subscribe', 'hub.verify_token': 'wrong-token', 'hub.challenge': '12345' });

    expect(res.status).toBe(403);
  });
});

describe('WhatsApp webhook receive (POST)', () => {
  it('always responds 200 immediately even with an empty payload', async () => {
    const app = createApp();
    const res = await request(app).post('/webhooks/whatsapp').send({ object: 'whatsapp_business_account', entry: [] });
    expect(res.status).toBe(200);
  });
});

describe('Health endpoint', () => {
  it('returns a JSON payload describing store + db status', async () => {
    const app = createApp();
    const res = await request(app).get('/api/health');
    expect([200, 503]).toContain(res.status);
    expect(res.body).toHaveProperty('store');
    expect(res.body).toHaveProperty('database');
  });
});
