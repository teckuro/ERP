# Asistente preguntor (Edge Function)

Código fuente desplegado en Supabase como **`super-service`**. El ERP llama vía `functions.invoke` con `{ "pregunta": "..." }`.

## Dashboard

1. **Secrets:** `NVIDIA_API_KEY`, `NVIDIA_MODEL` (`qwen/qwen3.5-122b-a10b`).
2. **`ERP_ALLOWED_ORIGIN`** (opcional, SEC-05/SEC-06): origen del ERP en producción para CORS restringido (origen ajeno: OPTIONS 403 / sin `Allow-Origin`).
3. **Rate limit SEC-06:** 10 consultas / 60s por usuario (memoria isolate; cold start reinicia contador).
4. **super-service:** pegar `index.ts` de esta carpeta → **Deploy**.
5. No usar `jsr:@supabase/server` en el editor (provoca 500).

## Local

```powershell
.\scripts\supabase-deploy-asistente.ps1
```

Genera `supabase/.env` desde `Python/.env` y sube secrets si hay Supabase CLI.

## ERP

`public/app-config.json`:

```json
"asistentePreguntorFunction": "super-service"
```

Ruta: `/preguntor`.
