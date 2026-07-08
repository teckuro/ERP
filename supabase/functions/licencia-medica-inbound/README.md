# licencia-medica-inbound

Webhook para correos reenviados (Resend Inbound o Mailgun Route).

## Variables

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `LM_INBOUND_WEBHOOK_SECRET`
- `LM_INBOUND_EMPRESA_ID`

## Despliegue

```bash
supabase functions deploy licencia-medica-inbound --no-verify-jwt
```

`--no-verify-jwt` porque el proveedor de correo no envía JWT de Supabase; la autenticación es por `x-lm-webhook-secret`.

## Smoke

Ver `scripts/smoke-licencia-medica-inbound.mjs`.
