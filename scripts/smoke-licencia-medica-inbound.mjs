#!/usr/bin/env node
/**
 * Smoke test del webhook licencia-medica-inbound.
 *
 * Uso:
 *   LM_INBOUND_WEBHOOK_URL=https://.../functions/v1/licencia-medica-inbound \
 *   LM_INBOUND_WEBHOOK_SECRET=... \
 *   node scripts/smoke-licencia-medica-inbound.mjs
 */

const url = process.env.LM_INBOUND_WEBHOOK_URL?.trim();
const secret = process.env.LM_INBOUND_WEBHOOK_SECRET?.trim();

if (!url || !secret) {
  console.error('Faltan LM_INBOUND_WEBHOOK_URL o LM_INBOUND_WEBHOOK_SECRET');
  process.exit(1);
}

const messageId = `smoke-${Date.now()}@erp.local`;

const payload = {
  type: 'email.received',
  created_at: new Date().toISOString(),
  data: {
    from: 'compin@ejemplo.cl',
    subject: 'Licencia médica LM-2026-009999',
    text: 'Se informa licencia desde 2026-04-01 hasta 2026-04-07.',
    message_id: messageId,
    attachments: [],
  },
};

const res = await fetch(url, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-lm-webhook-secret': secret,
  },
  body: JSON.stringify(payload),
});

const body = await res.text();
console.log('status', res.status);
console.log(body);

if (!res.ok) {
  process.exit(1);
}

// Idempotencia: segundo POST con mismo message_id
const res2 = await fetch(url, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-lm-webhook-secret': secret,
  },
  body: JSON.stringify(payload),
});

const body2 = await res2.text();
console.log('dedupe status', res2.status);
console.log(body2);

if (!res2.ok) {
  process.exit(1);
}
