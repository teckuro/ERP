# Auth - contrato general

## Objetivo

Proveer una autenticacion base para que el ERP opere con una sesion Supabase `authenticated` real.

AUTH-BASE-01 desbloquea pruebas E2E y uso operativo de RLS/RPC sin introducir roles avanzados ni administracion de usuarios.

## Alcance implementado

- Pantalla publica `/login` con email, contrasena, validaciones basicas, estado cargando y error operativo.
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

Ruta publica:

- `/login`

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

## Seguridad

Reglas activas:

- no usar `service_role` desde frontend;
- no imprimir tokens ni passwords;
- no abrir RLS para compensar errores de login;
- mantener `authenticated` como rol operativo base;
- no implementar roles inventados en esta fase.

## Fuera de alcance

No implementa:

- modulo completo de usuarios;
- roles avanzados;
- permisos finos por modulo;
- invitaciones;
- reset password;
- registro publico;
- SSO/MFA;
- auditoria avanzada de sesiones;
- cierre operativo o legal;
- liquidaciones oficiales;
- Previred, LRE, banco, PDF o firma;
- cambios de formulas legales o motor de nomina.
