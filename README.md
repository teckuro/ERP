# ERP Remuneraciones Chile

Sistema ERP enfocado en cálculo de remuneraciones según normativa chilena.

## Módulos

- Remuneraciones
- Contratos
- Previsión
- Liquidación de sueldos

## Stack

- Angular 21 (standalone) en el frontend
- Supabase alojado (PostgreSQL + Auth). No hace falta base local ni Docker.

## Requisitos

- **Node.js 22 o superior**, con npm.
- **Windows:** activa las rutas largas en git **antes de clonar**. Algunas rutas del módulo de nómina superan los 260 caracteres y el clon falla con `Filename too long`.
  ```bash
  git config --global core.longpaths true
  ```
- Credenciales del **proyecto Supabase de pruebas** (`erp-staging`): pídeselas al dueño del proyecto. Las de producción no se comparten.

## Correr el proyecto

```bash
git clone https://github.com/teckuro/ERP.git
cd ERP
git switch develop                      # todo el trabajo parte de develop
npm ci
cp .env.staging.example .env.staging    # completa los valores (ver abajo)
npm start                               # http://localhost:4200
```

En `.env.staging`:

| Variable | Para qué | ¿Obligatoria para `npm start`? |
|---|---|---|
| `STAGING_SUPABASE_URL` | URL del proyecto de pruebas | Sí |
| `STAGING_SUPABASE_ANON_KEY` | Publishable key (`sb_publishable_…`) | Sí |
| `STAGING_DB_URL` | Conexión SQL para `npm run db:dev` | No |

`npm start` genera `public/app-config.json` a partir de `.env.staging` y levanta el servidor. La app muestra una **franja azul DEV**: estás en la base de pruebas, donde se puede guardar y probar flujos completos.

Usuarios de prueba: `admin@erp-staging.test` (admin) y `consulta@erp-staging.test` (solo consulta). Las contraseñas las tiene el dueño.

`.env`, `.env.staging` y `public/app-config.json` están en `.gitignore`: nunca se suben al repositorio.

## Ambientes

| Comando | Base | Archivo |
|---|---|---|
| `npm start` | Pruebas (`erp-staging`), franja azul **DEV** | `.env.staging` |
| `npm run start:prod` | **Producción**, franja roja. Exige `ERP_CONFIRMO_PROD=si` | `.env`, que solo tiene el dueño |

## Verificar cambios

```bash
npx tsc --noEmit                          # typecheck
npx ng test --watch=false                 # tests unitarios (Vitest)
npx ng build --configuration development  # build
npm run check:secretos                    # antes de commitear
```

`npm run build` (producción) muestra avisos de tamaño de CSS (*budget*). Son conocidos y no impiden el build.

## Ramas

- `develop` corresponde al ambiente de pruebas y `main` a producción. `main` es la rama por defecto del repositorio.
- Las ramas de trabajo (`fix/*`, `feat/*`, `chore/*`) salen de `develop` y vuelven a `develop` por PR: `gh pr create --base develop`.
- El paso a producción se hace con un PR `develop → main`.

Más detalle sobre convenciones, ambientes y migraciones en [AGENTS.md](AGENTS.md). Seguridad de Supabase en [SUPABASE_SETUP.md](SUPABASE_SETUP.md).

## Problemas comunes

| Síntoma | Solución |
|---|---|
| `Filename too long` al clonar | `git config --global core.longpaths true` y volver a clonar |
| `No existe .env.staging` | `cp .env.staging.example .env.staging` y completar los valores |
| El asistente o la gestión de usuarios fallan en localhost | Es lo esperado: esas Edge Functions rechazan `localhost` (CORS). Se prueban en el preview de Vercel |
