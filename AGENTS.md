# Instrucciones para agentes

La documentación operativa del proyecto (`docs/`, `.cursor/`) es **local** y no forma parte del repositorio público.

Antes de cambiar código:

1. Confirmar alcance con el usuario (pantalla/módulo concreto).
2. Preferir diff mínimo y patrones ya usados en el módulo tocado.
3. No commitear secretos (`.env`, `app-config.json` con claves, service role).
4. No tocar estilos globales ni SQL de producción sin pedirlo explícitamente.

## Cursor Cloud / entorno local

ERP remuneraciones Chile: Angular 21 standalone + Supabase alojado. No requiere base local ni Docker.

| Servicio | Comando | URL |
|----------|---------|-----|
| Dev server | `npm run start` | http://localhost:4200 |

- Config runtime: `public/app-config.json` (gitignored). Si no existe, copiar desde `public/app-config.example.json`.
- Typecheck: `npx tsc --noEmit`
- Unit: `npm test` · E2E/visual: según scripts `test:e2e:*` / `test:visual` del `package.json`
- Build dev: `npx ng build --configuration development` · prod: `npm run build` (puede fallar por budgets CSS)
- Node.js 22+ (Angular 21). Desactivar analytics CLI: `npx ng analytics disable --global`

## Trabajo por backlog (ahorro de contexto)

- El backlog vivo está en `docs/backlog.md` (local). Lee **solo el ítem pedido** y los archivos que indica. No leas los PDFs de `docs/` ni explores el repo completo.
- Los archivos de más de 1000 líneas (`form-empleado.ts`, `novedades-mensuales-container.ts`, `empleados.repository.ts`, `parametros-workspace.orquestador.ts`, `data-grid.component.ts`, `database.types.ts`) se leen por rangos (`grep -n` + offset), nunca enteros.
- Verifica de la forma más barata posible: `npx tsc --noEmit` y luego `npx ng test --watch=false --include='**/<modulo>/**/*.spec.ts'`. La suite completa y el navegador, solo al cerrar el bloque, leyendo texto (no capturas).
- Al terminar, marca el ítem en `docs/backlog.md` y responde en 3 líneas (qué cambió, cómo se verificó, qué falta).

## Convenciones del repo

- Muchos archivos usan **CRLF**: al reemplazar texto con scripts, normaliza `\r\n` y restáuralo al escribir.
- En los specs que inyectan permisos, usa `provideErpPermisosStub({ soloConsulta? })` de `src/app/core/auth/testing/erp-permisos.stub.ts` (evita NG0201 por `SupabaseClient`).
- Para ocultar botones de escritura según el perfil, usa `*erpPuedeEscribir="'<modulo>'"`. La base valida igual con RLS (SEC-08).
- El rol y la empresa se leen solo de `app_metadata` (SEC-07). Nunca de `user_metadata`.
- **Ambientes:** `npm run start` usa **staging** (proyecto Supabase `erp-staging`, credenciales en `.env.staging`, fuera de git). `npm run start:prod` usa **producción** (`.env`). `npm run config:staging` / `config:prod` solo regeneran `public/app-config.json`.
  - En **staging** se puede guardar, confirmar y probar flujos completos. Usuarios de prueba: `admin@erp-staging.test` (admin_sistema) y `consulta@erp-staging.test` (consulta); las contraseñas las tiene el usuario.
  - En **producción**: no guardes, confirmes, emitas ni elimines nada. Ver o imprimir una liquidación oficial registra una emisión. Las consultas con psql van dentro de `begin read only; … rollback;`.
  - Al conectar a cualquier base con psql, no imprimas errores sin filtrar: pueden mostrar partes de la URL (contraseña).
- SQL desde la terminal: `npm run db:dev -- <archivo.sql>` (o `--sql "..."`) contra dev/staging; `npm run db:prod -- …` contra producción, **siempre en una transacción de solo lectura con rollback** (el pooler ignora PGOPTIONS, por eso no se usa). Ambos ocultan la URL en los errores. `start:dev` y `config:dev` son alias de staging.
- **Producción, solo a propósito:** `npm run start:prod` / `config:prod` exigen `ERP_CONFIRMO_PROD=si`. La app muestra una franja **DEV** (azul) contra la base de pruebas y **PRODUCCIÓN** (roja) si se usa la base real desde localhost.
- **Clonar el repo no trae nada de producción:** sin `.env.staging` la app no arranca (copiar `.env.staging.example` y completar con credenciales de **dev**). Las credenciales de producción solo las tiene el dueño (`.env` local, secreto de GitHub y variables de Vercel).
- **Antes de commitear:** `npm run check:secretos` (o `-- --todo` para todo el repo) busca contraseñas en URLs, claves `sb_secret_`, JWT, tokens `sbp_` y el id del proyecto de producción.
- **Datos:** la base dev se clonó con datos ficticios. Si producción llega a tener trabajadores reales, no se copian tal cual a dev: se anonimizan (RUT, nombres, sueldos).
- Las migraciones se prueban primero en **staging** (`STAGING_DB_URL`) y se aplican en producción solo con el OK explícito del usuario.
- Los cambios de esquema van como migración en `supabase/migrations/`, y se aplican en producción solo con el OK explícito del usuario.
- Las Edge Functions (`admin-usuarios`, asistente) rechazan `localhost` por CORS: no se pueden probar en local.
