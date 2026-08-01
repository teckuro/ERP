# licencia-medica-inbound

Webhook para correos reenviados (Resend Inbound o Mailgun Route).

## Variables

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `LM_INBOUND_WEBHOOK_SECRET`
- `LM_INBOUND_EMPRESA_ID`
- `ERP_ALLOWED_ORIGIN` (opcional, SEC-05/SEC-06): origen del ERP en producción. Si no está definido, CORS responde `*`. Los webhooks sin `Origin` no se rechazan por CORS; la auth es el secreto (comparación en tiempo constante, SEC-06).

## Despliegue

```bash
supabase functions deploy licencia-medica-inbound --no-verify-jwt
```

`--no-verify-jwt` porque el proveedor de correo no envía JWT de Supabase; la autenticación es por `x-lm-webhook-secret`.

## Smoke

Ver `scripts/smoke-licencia-medica-inbound.mjs`.
