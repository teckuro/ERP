# Cursor — configuración del repo ERP

## Qué ya está activo

| Pieza | Ubicación | Rol |
|-------|-----------|-----|
| Reglas globales | `.cursor/rules/*.mdc` (`alwaysApply: true`) | Orquestador, **estándares EST**, contrato codex, archivos protegidos, NOIA |
| Skill | `.cursor/skills/erp-codex-docs/` | Flujo lectura → implementar → autorevisar |
| Skill | `.cursor/skills/erp-fullscreen-data-grid/` | Grilla `app-data-grid` a altura completa (patrón administrador-nominas) |
| Contrato raíz | `AGENTS.md` | Puntero al contrato en `docs/codex` |
| Workspace VS Code | `.vscode/` | Formato, tareas npm, debug Chrome, MCP Angular CLI |
| Contexto reducido | `scripts/build-context-pack.ps1` | ZIP mínimo por módulo |

## Reglas (leer en este orden al iniciar)

1. `erp-orquestador.mdc` — `docs/codex/orquestador/*`, fases, qué no construir
2. `erp-estandares.mdc` — constitución técnica EST-001…EST-008
3. `erp-codex-contract.mdc` — skill codex, alcance, peticiones-estilos
4. `erp-protected-files.mdc` — no tocar estilos globales, motor, SQL sin fase
5. `erp-ui-noia.mdc` + `erp-ui-visual-guardrails.mdc` — solo si hay UI

## Extensiones recomendadas

Al abrir el proyecto, Cursor/VS Code sugiere instalar las de `.vscode/extensions.json`:

- Angular Language Service
- Prettier
- Playwright
- EditorConfig

## Tareas útiles (Terminal → Run Task)

- `npm: start` — dev server
- `npm: test` — unit tests en watch (Karma/Vitest según `ng test`)
- `ng test (sin watch)` — una pasada CI
- `lint: texto` / `lint: nomina rules` — higiene de copy y reglas nómina
- Gates por módulo: empleados, parámetros, nómina (unit + e2e según script)
- `auditar-estandares-desviaciones.ps1` — baseline EST vs repo (antes de cerrar fase BD/feature)

## Debug

- **ng serve** — Chrome contra `http://localhost:4200/` (levanta `npm start` antes)
- **ng test** — Chrome contra el runner de tests

## MCP

`.vscode/mcp.json` registra el servidor **angular-cli** (`npx @angular/cli mcp`). En Cursor: Settings → MCP y habilitar el servidor del workspace si no aparece solo.

## Pedir trabajo al agente (plantilla corta)

```text
Módulo: <empleados | parametros | nomina-mensual | …>
Alcance: <archivo o pantalla>
Tipo: solo UI | lógica | ambos
Leer: docs/codex/estandares/EST-008-ia.md + docs/codex/modulos/<módulo>/README.md + estado-fases.md
Validar: npx ng test --watch=false --include=**/ruta/**/*.spec.ts
No tocar: estilos globales, angular.json, motor, SQL (salvo fase explícita; si hay fase BD seguir EST-002…006)
```

Prompt UI listo para User Rules: `docs/codex/diseno/noia-prompt-cursor.md`.

## Context pack (menos tokens)

```powershell
./scripts/build-context-pack.ps1 -IncludeNomina
./scripts/build-context-pack.ps1 -IncludeParametros -IncludeEmpleadoAdvanced
```

Salida típica: `tmp/context-pack.zip`.
