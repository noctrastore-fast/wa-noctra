// Minimal typing for the subset of the WhatsApp Cloud API webhook payload
// that Noctra Store actually consumes. Meta's full payload has more
// fields (statuses, reactions, etc.) — extend as needed in later phases.

export interface WhatsAppWebhookPayload {
  object: string;
  entry: Array<{
    id: string;
    changes: Array<{
      field: string;
      value: {
        messaging_product: 'whatsapp';
        metadata: { display_phone_number: string; phone_number_id: string };
        contacts?: Array<{ profile: { name: string }; wa_id: string }>;
        messages?: WhatsAppInboundMessage[];
        statuses?: WhatsAppStatusUpdate[];
      };
    }>;
  }>;
}

export interface WhatsAppInboundMessage {
  from: string; // sender's WhatsApp number, no "+"
  id: string;
  timestamp: string;
  type: 'text' | 'interactive' | 'image' | 'button' | string;
  text?: { body: string };
  interactive?: {
    type: 'button_reply' | 'list_reply';
    button_reply?: { id: string; title: string };
    list_reply?: { id: string; title: string; description?: string };
  };
}

export interface WhatsAppStatusUpdate {
  id: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  timestamp: string;
  recipient_id: string;
}
