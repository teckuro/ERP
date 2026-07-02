# Constitución técnica — Estándares ERP

**ERP Remuneraciones Chile**

Colección obligatoria de normas técnicas transversales. Complementa (no reemplaza) `AGENTS.md`, contratos de módulo y documentos NOIA.

## Propósito

- Una sola nomenclatura y arquitectura para personas y agentes (Cursor/Codex/ChatGPT).
- Reducir deuda por convenciones paralelas.
- Servir como checklist antes de crear tablas, RPC, servicios, pantallas o documentación.

## Jerarquía documental

En conflicto entre estándares y otro documento:

1. **Fase o módulo congelado** — lo que diga el documento vivo del módulo o `orquestador/estado-fases.md`.
2. **EST-008 (IA)** — alcance, zonas protegidas y flujo de trabajo para agentes.
3. **EST-001 … EST-007** — reglas técnicas por capa.
4. **Contratos de módulo** — `docs/codex/modulos/<módulo>/`.
5. **Bitácoras** — `peticiones-estilos.md`, auditorías (referencia, no normativa base).

Para **UI visible**, prevalece [`diseno/noia-ui-manual.md`](../diseno/noia-ui-manual.md) sobre cualquier estándar de código.

## Índice

| ID | Documento | Alcance |
|----|-----------|---------|
| [EST-001](./EST-001-nomenclatura-tecnica.md) | Nomenclatura técnica | snake_case BD, camelCase TS, archivos, prefijos |
| [EST-002](./EST-002-base-de-datos.md) | Base de datos | Tablas, relaciones, auditoría, índices, RLS |
| [EST-003](./EST-003-sql-postgresql.md) | SQL y PostgreSQL | Funciones, vistas, CTE, transacciones, errores |
| [EST-004](./EST-004-typescript.md) | TypeScript | DTO, interfaces, types, mappers, repositories |
| [EST-005](./EST-005-angular.md) | Angular | Estructura features, componentes, servicios, rules |
| [EST-006](./EST-006-supabase.md) | Supabase | RPC, policies, storage, auth, migraciones |
| [EST-007](./EST-007-documentacion.md) | Documentación | `docs/codex`, fases, auditorías, bitácoras |
| [EST-008](./EST-008-ia.md) | Agentes de IA | Cómo crear código y qué nunca hacer |

## Orden de lectura recomendado

### Desarrollador humano (feature nueva)

1. `orquestador/contexto-proyecto.md` + `orquestador/estado-fases.md`
2. EST-001 → EST-006 según capas tocadas
3. Contrato del módulo en `modulos/<módulo>/`
4. Si hay UI: NOIA + `ui-form-guidelines.md`

### Agente de IA (cualquier tarea)

1. [`contexto-rapido.md`](../contexto-rapido.md)
2. **EST-008**
3. EST-001 … EST-007 según alcance
4. Documento del módulo o fase

## Legacy vs código nuevo

El ERP acumula convenciones históricas (`ix_` vs `idx_`, `trg_` vs `tg_`, FK `id_*`).

- **No renombrar objetos existentes** salvo fase explícita de migración.
- **Todo desarrollo nuevo** debe seguir la columna «Obligatorio (nuevo)» de EST-001 y EST-002.
- Si un patrón legacy debe extenderse, copiar el estilo del archivo más cercano y registrar deuda en el PR o fase.

## Relación con documentos existentes

| Tema | Estándar | Documento hermano |
|------|----------|-------------------|
| Arquitectura Angular (inglés) | EST-005 | [`arquitectura/frontend-interfaces.md`](../arquitectura/frontend-interfaces.md) |
| camelCase español en TS | EST-001, EST-004 | [`diseno/nomenclatura-es-camelcase-01.md`](../diseno/nomenclatura-es-camelcase-01.md) |
| UI NOIA | — | [`diseno/noia-ui-manual.md`](../diseno/noia-ui-manual.md) |
| Contrato agente | EST-008 | [`AGENTS.md`](../AGENTS.md) |
| Mapa de docs | EST-007 | [`orquestador/mapa-documentacion.md`](../orquestador/mapa-documentacion.md) |

## Versionado

- **Versión colección:** 1.0 (2026-07-02)
- **Estado:** Obligatorio para desarrollo nuevo
- Cambios estructurales a un EST requieren actualizar este README y, si aplica, `contexto-rapido.md`

## Auditoría continua

Antes de cerrar fases BD o features grandes:

```powershell
./scripts/auditar-estandares-desviaciones.ps1
```

Hallazgos y backlog: [`auditorias/auditoria-estandares-desviaciones-2026-07.md`](../auditorias/auditoria-estandares-desviaciones-2026-07.md).
