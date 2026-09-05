import { whatsappClient } from './client';
import { MAIN_MENU_SECTIONS, buildMainMenuFallbackText, buildWelcomeHeader } from './messageBuilder';
import type { WhatsAppInboundMessage } from './types';
import { withCorrelation } from '../utils/logger';

const MENU_TRIGGERS = new Set(['menu', 'start', 'hi', 'halo', 'hello', 'shop']);

/**
 * Phase 1 scope: recognize the "menu" family of commands and reply with
 * the main menu (interactive list, with numbered-text fallback baked into
 * whatsappClient.sendListMenu). Product/category/cart/order command
 * routing is added in Phase 2+ without needing to touch this entry point's
 * shape — just its internal branches.
 */
export async function dispatchInboundMessage(
  message: WhatsAppInboundMessage,
  correlationId: string,
): Promise<void> {
  const log = withCorrelation(correlationId);
  const from = message.from;

  const text = extractText(message);
  log.info({ from, type: message.type, text }, 'Inbound WhatsApp message');

  const normalized = text?.trim().toLowerCase();

  if (normalized && MENU_TRIGGERS.has(normalized)) {
    await whatsappClient.sendListMenu(
      from,
      buildWelcomeHeader(),
      `Selamat datang di Noctra Store. Pilih menu di bawah ini untuk mulai belanja.`,
      'Buka Menu',
      MAIN_MENU_SECTIONS,
      buildMainMenuFallbackText(),
    );
    return;
  }

  // Anything else falls back to a friendly nudge toward the menu.
  // Product/category/cart/search command handling arrives in Phase 2/3.
  await whatsappClient.sendText(
    from,
    `Halo! 👋 Ketik *menu* untuk melihat semua fitur Noctra Store.`,
  );
}

function extractText(message: WhatsAppInboundMessage): string | undefined {
  if (message.type === 'text') return message.text?.body;
  if (message.type === 'interactive') {
    return message.interactive?.list_reply?.title ?? message.interactive?.button_reply?.title;
  }
  return undefined;
}
