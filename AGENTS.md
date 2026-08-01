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
