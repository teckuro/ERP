# Plantilla de correo — restablecer contraseña

Fuente canónica del HTML: [`supabase/templates/recovery.html`](../../../../supabase/templates/recovery.html).

Asunto:

```text
Restablecer contraseña — ERP Remuneraciones
```

Criterio visual: bloque compacto centrado, **sin franjas ni cajas con borde de color**; solo borde neutro del marco y un botón primario. No pegar la URL completa en el cuerpo. El remitente «Supabase Auth» se cambia en Dashboard → Authentication → SMTP / Sender.


## Aplicar en proyecto hosted (Dashboard)

1. Abrir [Authentication → Email Templates](https://supabase.com/dashboard/project/mjrckxodzrfkyqjkyjkn/auth/templates).
2. Elegir **Reset password**.
3. Pegar el **Subject** de arriba.
4. Pegar el contenido de `supabase/templates/recovery.html` en el cuerpo (Body).
5. Guardar.
6. Verificar `Redirect URLs` con `{origin}/actualizar-contrasena` (ver `SUPABASE_SETUP.md`).
7. Probar desde `/recuperar-contrasena`.

Variables usadas: `{{ .Email }}`, `{{ .ConfirmationURL }}` (incluye el `redirect_to` que envía el frontend).

## Local (`supabase start`)

En `supabase/config.toml`:

```toml
[auth.email.template.recovery]
subject = "Restablecer contraseña — ERP Remuneraciones"
content_path = "./supabase/templates/recovery.html"
```

Reiniciar contenedores locales tras cambiar la plantilla.

## Management API (opcional)

Con un access token de cuenta ([tokens](https://supabase.com/dashboard/account/tokens)):

```bash
set SUPABASE_ACCESS_TOKEN=...
node scripts/apply-recovery-email-template.mjs
```

El script lee `supabase/templates/recovery.html` y hace PATCH a
`mailer_subjects_recovery` / `mailer_templates_recovery_content` del proyecto
`api-remuneraciones` (`mjrckxodzrfkyqjkyjkn`).