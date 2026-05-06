# AGENTS.md

## Cursor Cloud specific instructions

### Project overview

Chilean Payroll ERP (Angular 21 standalone frontend + hosted Supabase backend). No local database or Docker needed.

### Running services

| Service | Command | URL |
|---------|---------|-----|
| Angular dev server | `npm run start` | http://localhost:4200 |

The app loads Supabase config from `public/app-config.json` at runtime. If this file doesn't exist, copy from `public/app-config.example.json`. With placeholder credentials the UI renders but data-dependent features show errors.

### Lint / type-check / format

- **TypeScript check:** `npx tsc --noEmit` (uses `tsconfig.json`)
- **Prettier:** `npx prettier --check "src/**/*.ts"` or `npx prettier --write "src/**/*.ts"`
- No ESLint is configured in this project.

### Testing

- **Unit tests (Vitest):** `npm test` (runs `ng test` which delegates to `@angular/build:unit-test`; 277 tests)
- **Visual/E2E (Playwright):** `npm run test:visual` (auto-starts dev server)
- **E2E empleados borrador:** `npm run test:e2e:empleados-borrador`

### Build

- **Development build:** `npx ng build --configuration development` (succeeds)
- **Production build:** `npm run build` (may fail due to CSS budget limits in `angular.json`)

### Gotchas

- The Angular CLI prompts for analytics on first run. Disable non-interactively: `npx ng analytics disable --global` (already handled by the update script).
- Node.js 22+ is required (Angular 21 dependency).
- The `packageManager` field in `package.json` specifies npm@11.11.0 but the installed npm 10.x works fine.
- `public/app-config.json` is gitignored. Always ensure it exists before running.
