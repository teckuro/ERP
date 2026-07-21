# Auth - contrato general

## Objetivo

Proveer una autenticacion base para que el ERP opere con una sesion Supabase `authenticated` real.

AUTH-BASE-01 desbloquea pruebas E2E y uso operativo de RLS/RPC sin introducir roles avanzados ni administracion de usuarios.

## Alcance implementado

- Pantalla publica `/login` con email, contrasena, validaciones basicas, estado cargando y error operativo.
- Recuperacion de contrasena (self-service) con Supabase Auth:
  - `/recuperar-contrasena` → `resetPasswordForEmail` + `redirectTo` a `/actualizar-contrasena`;
  - `/actualizar-contrasena` espera el evento `PASSWORD_RECOVERY`, exige sesion de recuperacion, llama `updateUser({ password })` y cierra sesion.
- `AuthService` en `src/app/core/auth/auth.service.ts`.
- Guards `authGuard` y `authChildGuard` en `src/app/core/auth/auth.guard.ts`.
- Rutas internas bajo `LayoutShellComponent` protegidas por `canActivateChild`.
- Header muestra email de usuario o fallback operativo y accion `Cerrar sesion`.
- E2E de nomina usa login UI cuando existen variables reales.

## Sesion Supabase

La aplicacion usa el cliente Supabase existente configurado en `src/app/core/services/supabase.service.ts`.

Configuracion relevante:

- `persistSession: true`;
- `autoRefreshToken: true`;
- `storageKey: angular-erp-auth`;
- anon publishable key desde `public/app-config.json`.

No se crea un cliente frontend con `service_role`.

## Rutas

Rutas publicas:

- `/login`
- `/recuperar-contrasena`
- `/actualizar-contrasena` (solo habilita guardado si hay sesion de recuperacion `PASSWORD_RECOVERY`)

Rutas internas protegidas:

- `/`
- `/empleados`
- `/remuneraciones/proceso-mensual`
- `/remuneraciones/novedades-mensuales`
- `/remuneraciones/haberes-descuentos`
- `/remuneraciones/conceptos`
- `/remuneraciones/liquidaciones` (sigue neutralizada funcionalmente)
- `/licencias-medicas`
- `/reportes`
- `/parametros`

Si no existe sesion, el guard redirige a `/login` y conserva `returnUrl` para volver a la ruta solicitada.

## Usuario de desarrollo

Crear o usar un usuario de prueba desde:

```txt
Supabase Dashboard -> Authentication -> Users
```

Configurar credenciales solo en variables locales o en el gestor seguro del entorno:

```powershell
$env:E2E_SUPABASE_AUTH_EMAIL='usuario-dev@example.com'
$env:E2E_SUPABASE_AUTH_PASSWORD='...'
```

No commitear credenciales, passwords, access tokens, refresh tokens, connection strings ni `service_role`.

## E2E real

Variables para ejecutar nomina con sesion real:

```powershell
$env:E2E_NOMINA_REAL='1'
$env:E2E_SUPABASE_AUTH_EMAIL='...'
$env:E2E_SUPABASE_AUTH_PASSWORD='...'
$env:E2E_NOMINA_PERIODO='YYYY-MM'
npx playwright test tests/nomina-mensual.e2e.spec.ts --workers=1
```

Si faltan variables, el E2E se omite para evitar escrituras contra ambientes no confirmados.

### Ejecucion NOM-E2E-02

En la ejecucion local del 2026-05-09 faltaban `E2E_NOMINA_REAL`, `E2E_SUPABASE_AUTH_EMAIL`, `E2E_SUPABASE_AUTH_PASSWORD`, `E2E_NOMINA_PERIODO` y `SUPABASE_DB_URL`.

Resultado:

- no hubo login real validado contra Supabase Auth;
- no hubo periodo probado;
- no hubo guardado RPC ni aprobacion operativa desde UI real;
- no hubo SQL post-E2E;
- `tests/nomina-mensual.e2e.spec.ts` paso en modo seguro con el caso real omitido.

Estado actualizado por NOM-E2E-CLOSE-01:

- el flujo real authenticated queda validado para `2026-04`;
- login real por Supabase Auth opero con rol `authenticated`;
- la prueba cubrio guardar por RPC real, consultar `Resultado guardado desde BD`, aprobar operativamente y recuperar tras recargar;
- evidencia consolidada: `npx playwright test tests/nomina-mensual.e2e.spec.ts --workers=1` OK, 1 passed / 1 skipped;
- no se exponen email, password, tokens, connection strings ni `service_role`.

### Preparacion ENV-E2E-01

ENV-E2E-01 deja documentado el entorno requerido para repetir NOM-E2E-02 en modo real.

Ambiente:

- frontend apuntando al proyecto Supabase remoto/controlado de `public/app-config.json`;
- `SUPABASE_DB_URL` disponible en `.env` local para SQL post-E2E;
- `.env` permanece ignorado por Git.

Variables requeridas en `.env` local o sesion PowerShell:

```powershell
$env:E2E_NOMINA_REAL='1'
$env:E2E_SUPABASE_AUTH_EMAIL='...'
$env:E2E_SUPABASE_AUTH_PASSWORD='...'
$env:E2E_NOMINA_PERIODO='YYYY-MM'
$env:SUPABASE_DB_URL='...'
```

Estado de preparacion:

- conexion SQL validada sin exponer secretos;
- permisos RPC validados: `authenticated=true`, `anon=false`;
- para repetir en otro ambiente, pendiente crear/confirmar usuario Supabase Auth de desarrollo y definir periodo E2E;
- el hito E2E real de nomina queda cerrado por NOM-E2E-CLOSE-01 en el ambiente controlado usado para `2026-04`.

## Recuperacion de contrasena (Supabase)

Flujo alineado a la guia oficial [Passwords](https://supabase.com/docs/guides/auth/passwords) y `resetPasswordForEmail`:

1. Usuario pide enlace en `/recuperar-contrasena`.
2. Frontend llama `supabase.auth.resetPasswordForEmail(email, { redirectTo: origin + '/actualizar-contrasena' })`.
3. El correo debe estar allowlisted en Dashboard → Authentication → URL Configuration (`Redirect URLs`).
4. Al abrir el enlace, supabase-js hidrata la sesion (`detectSessionInUrl`) y emite `PASSWORD_RECOVERY`.
5. `/actualizar-contrasena` espera ese evento (no un timeout fijo), exige flag de recuperacion + usuario, actualiza con `updateUser({ password })` y hace `signOut`.
6. El mensaje de exito en paso 1 no revela si el correo existe (anti-enumeracion).

Operacion Dashboard (obligatorio por ambiente):

- `Site URL` del frontend.
- `Redirect URLs` con `{origin}/actualizar-contrasena` (local, preview y produccion).
- Plantilla de correo **Reset password** activa (SMTP configurado).
- Contenido canónico en repo: `supabase/templates/recovery.html` +
  [`plantilla-correo-recuperacion.md`](./plantilla-correo-recuperacion.md)
  (pegar en Dashboard del ambiente hosted).

## Seguridad

Reglas activas:

- no usar `service_role` desde frontend;
- no imprimir tokens ni passwords;
- no abrir RLS para compensar errores de login;
- mantener `authenticated` como rol operativo base;
- no implementar roles inventados en esta fase;
- `/actualizar-contrasena` no permite cambiar clave solo por sesion de login normal: requiere `PASSWORD_RECOVERY` (flag en memoria + `sessionStorage`).

## Fuera de alcance

No implementa:

- modulo completo de usuarios;
- roles avanzados;
- permisos finos por modulo;
- invitaciones;
- registro publico;
- SSO/MFA;
- cambio de contrasena desde perfil logueado (flujo distinto al de recuperacion);
- auditoria avanzada de sesiones;
- cierre operativo o legal;
- liquidaciones oficiales;
- Previred, LRE, banco, PDF o firma;
- cambios de formulas legales o motor de nomina.


## Regla canonica 2026-05-10

La autenticacion base habilita flujos reales authenticated, pero no debe confundirse con un sistema completo de roles/permisos.

No documentar ni implementar permisos avanzados salvo fase explicita.
