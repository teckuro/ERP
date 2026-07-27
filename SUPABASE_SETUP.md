# Supabase seguro para este proyecto

## 1. Configuracion local

1. Copia `public/app-config.example.json` a `public/app-config.json`.
2. Completa:
   - `supabaseUrl`
   - `supabaseAnonKey` (publishable key `sb_publishable_...` o legacy anon key)
3. `public/app-config.json` esta en `.gitignore`, asi que no se sube al repositorio.

## 2. Regla critica

- La `publishable key` o legacy `anon public key` puede estar en frontend.
- La `service_role key` nunca debe entrar en Angular, ni en `public/`, ni en `src/`.
- La `secret key` (`sb_secret_...`) tampoco debe entrar en Angular, ni en `public/`, ni en `src/`.
- Si necesitas privilegios elevados, hazlo desde backend o Edge Functions con secretos del servidor.

## 3. Seguridad minima en Supabase Dashboard

- `Authentication`:
  - Desactiva proveedores que no uses.
  - Configura `Site URL` y `Redirect URLs` exactas por ambiente.
  - Para recuperacion de contrasena, allowlist por ambiente:
    - `http://localhost:4200/actualizar-contrasena` (dev)
    - `{URL_preview}/actualizar-contrasena`
    - `{URL_produccion}/actualizar-contrasena`
  - El frontend envia `redirectTo` a `{origin}/actualizar-contrasena` desde `AuthService.solicitarRecuperacionContrasena`.
  - Revisa la plantilla **Reset password** y SMTP; sin correo no hay flujo usable.
  - Plantilla del proyecto (asunto + HTML): `supabase/templates/recovery.html` y guía
    `docs/codex/modulos/auth/plantilla-correo-recuperacion.md`. En hosted hay que pegarla
    en Dashboard → Authentication → Email Templates (el archivo del repo no se despliega solo).
  - `supportEmail` en `public/app-config.json` (ver example): correo del enlace «administrador del sistema» (`mailto:`).
  - Activa confirmacion de correo si usas password login.
- `Database`:
  - Activa RLS en toda tabla expuesta al cliente.
  - Crea policies explicitas; no dependas de que "anon no sabe el nombre de la tabla".
  - Expone solo los esquemas necesarios en `Settings > API > Exposed schemas`.
- `Storage`:
  - No dejes buckets publicos salvo necesidad real.
  - Usa policies por bucket y ruta.

## 4. Checklist recomendado de RLS

- `alter table ... enable row level security;`
- Policy de `select` solo para usuarios autenticados/autorizados.
- Policy de `insert/update/delete` restringida por `auth.uid()` o rol de negocio.
- Si el ERP es multiempresa, filtra por `empresa_id` en todas las policies.

## 5. Despliegue

- En cada ambiente genera su propio `app-config.json`.
- En Vercel, define estas variables en `Settings > Environment Variables` para Production, Preview y Development si corresponde:
  - `SUPABASE_URL`: URL del proyecto, formato `https://xxxx.supabase.co`.
  - `SUPABASE_ANON_KEY`: publishable key `sb_publishable_...` o legacy `anon public` completa del mismo proyecto.
  - `SUPPORT_EMAIL` (opcional): correo del administrador en login (`mailto:`); default `admin@erp.cl`.
- No pegues el contenido de `public/app-config.example.json` como una sola variable: Vercel debe recibir las dos variables separadas.
- El build de Vercel ejecuta `node scripts/generate-app-config.mjs && npm run build`, por lo que `public/app-config.json` se genera durante el build.
- No reutilices proyecto Supabase de desarrollo en produccion.
- Rota llaves si alguna `service_role` fue expuesta.

## 6. Verificacion

- `npm run test:supabase`
- `node scripts/test-empleados-supabase.mjs`
