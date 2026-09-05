import axios, { AxiosError } from 'axios';
import { whatsappConfig } from '../config/store';
import { logger } from '../utils/logger';

const api = axios.create({
  baseURL: `${whatsappConfig.graphBaseUrl}/${whatsappConfig.apiVersion}/${whatsappConfig.phoneNumberId}`,
  headers: {
    Authorization: `Bearer ${whatsappConfig.token}`,
    'Content-Type': 'application/json',
  },
  timeout: 10_000,
});

export interface InteractiveListRow {
  id: string;
  title: string;
  description?: string;
}

export interface InteractiveListSection {
  title: string;
  rows: InteractiveListRow[];
}

/**
 * Thin wrapper around the WhatsApp Cloud API "send message" endpoint.
 * Kept intentionally small in Phase 1 — grows in later phases (images,
 * buttons for product detail, etc.) but the HTTP plumbing lives here only.
 */
class WhatsAppClient {
  async sendText(to: string, body: string): Promise<void> {
    await this.send({
      messaging_product: 'whatsapp',
      to,
      type: 'text',
      text: { body, preview_url: false },
    });
  }

  /**
   * Sends an interactive LIST message (used for the main menu). Falls back
   * to a plain numbered text menu automatically if the interactive send
   * fails for any reason (e.g. WhatsApp rejects the payload) — per spec
   * section 3 ("fallback ke numbered menu").
   */
  async sendListMenu(
    to: string,
    headerText: string,
    bodyText: string,
    buttonLabel: string,
    sections: InteractiveListSection[],
    fallbackText: string,
  ): Promise<void> {
    try {
      await this.send({
        messaging_product: 'whatsapp',
        to,
        type: 'interactive',
        interactive: {
          type: 'list',
          header: { type: 'text', text: headerText },
          body: { text: bodyText },
          action: { button: buttonLabel, sections },
        },
      });
    } catch (err) {
      logger.warn({ err }, 'Interactive list send failed, falling back to numbered text menu');
      await this.sendText(to, fallbackText);
    }
  }

  private async send(payload: Record<string, unknown>): Promise<void> {
    try {
      await api.post('/messages', payload);
    } catch (err) {
      const axiosErr = err as AxiosError;
      logger.error(
        { status: axiosErr.response?.status, data: axiosErr.response?.data },
        'WhatsApp API send failed',
      );
      throw err;
    }
  }
}

export const whatsappClient = new WhatsAppClient();
