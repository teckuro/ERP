# Documentación ERP — índice padre (reglas y módulos)

**Punto de entrada** para normas de producto, UI y flujos en `docs/codex`. Las definiciones por dominio viven en **`modulos/`**; `temas/` conserva **flujos transversales**, **stubs de redirección** y documentos no migrados.

## Orden de lectura (obligatorio para agentes y personas)

Para fases acotadas o diagnóstico rápido, partir por [`contexto-rapido.md`](./contexto-rapido.md) y luego seguir la jerarquía completa de este README. El contexto rápido no reemplaza los contratos; solo reduce ruido inicial.

1. **Orquestador** — contexto global, diseño operativo y fases: [`orquestador/README.md`](./orquestador/README.md), [`orquestador/contexto-proyecto.md`](./orquestador/contexto-proyecto.md), [`orquestador/diseno-operativo-erp.md`](./orquestador/diseno-operativo-erp.md), [`orquestador/estado-fases.md`](./orquestador/estado-fases.md).
2. **Constitución técnica** — estándares transversales EST-001…EST-008: [`estandares/README.md`](./estandares/README.md) (obligatorio para código nuevo y agentes).
3. **Mapa de documentación** — inventario global / por módulo / histórico: [`orquestador/mapa-documentacion.md`](./orquestador/mapa-documentacion.md).
4. **Arquitectura frontend (Angular)** — páginas wrapper, contenedores, capas: [`arquitectura/frontend-interfaces.md`](./arquitectura/frontend-interfaces.md) (leer antes de rutas/pantallas/feature nuevos o refactors grandes).
5. **Contrato del agente y guías UI** — para UI visible leer primero [`diseno/noia-ui-manual.md`](./diseno/noia-ui-manual.md), luego [`AGENTS.md`](./AGENTS.md), [`ui-form-guidelines.md`](./ui-form-guidelines.md), [`ui-button-guidelines.md`](./ui-button-guidelines.md), [`ui-tables.md`](./ui-tables.md), [`estilos/README.md`](./estilos/README.md).
6. **Módulo** — [`modulos/<módulo>/README.md`](./modulos/empleados/README.md) (elegir carpeta: `empleados`, `parametros`, etc.).
7. **Subflujo / pantalla** — el `.md` concreto dentro de esa carpeta (p. ej. [`modulos/empleados/ficha-empleado.md`](./modulos/empleados/ficha-empleado.md)).
8. **`temas/`** — solo si hace falta un **flujo por rutas** ([`temas/flujos/README.md`](./temas/flujos/README.md)), UI de implementación ([`temas/implementacion-ui.md`](./temas/implementacion-ui.md)), menú ([`temas/crear-menu-base.md`](./temas/crear-menu-base.md)) o un doc **aún no migrado**. Muchos `.md` en la raíz de `temas/` son **stubs** (“Documento migrado…”) hacia `modulos/`.

### Cada petición: qué pedir y qué se aplica

1. **Alcance**: pantalla, archivo o flujo concreto.
2. **Tipo de cambio**: solo UI, solo lógica, o ambos; si el contrato dice «solo UI», no tocar guardado, servicios ni `formControlName` sin acuerdo explícito.
3. **Fuente de verdad** si hay lista cerrada: p. ej. [`peticiones-fusion-items-1-65.md`](./peticiones-fusion-items-1-65.md).
4. **Jerarquía** (en conflicto gana el primero):
   1. [`diseno/noia-ui-manual.md`](./diseno/noia-ui-manual.md) para UI visible.
   2. [`AGENTS.md`](./AGENTS.md)
   3. [`estandares/README.md`](./estandares/README.md) — constitución técnica EST-001…EST-008.
   4. **Este README** — índice y orden de lectura; no sustituye `AGENTS.md`.
   5. [`arquitectura/frontend-interfaces.md`](./arquitectura/frontend-interfaces.md) — estructura Angular (`pages` vs `features`, contenedores, capas).
   6. [`ui-form-guidelines.md`](./ui-form-guidelines.md)
   7. Documentos bajo [`modulos/`](./modulos/empleados/README.md) (y transversales en `temas/` cuando aplique).

---

## `docs/codex/estandares/` — constitución técnica (EST-001…EST-008)

| Documento | Contenido |
|-------------|-------------|
| [`estandares/README.md`](./estandares/README.md) | Índice, jerarquía y legacy vs código nuevo |
| [`estandares/EST-001-nomenclatura-tecnica.md`](./estandares/EST-001-nomenclatura-tecnica.md) | Nomenclatura BD, SQL, TS, archivos |
| [`estandares/EST-002-base-de-datos.md`](./estandares/EST-002-base-de-datos.md) | Tablas, RLS, índices, auditoría |
| [`estandares/EST-003-sql-postgresql.md`](./estandares/EST-003-sql-postgresql.md) | Funciones, transacciones, errores |
| [`estandares/EST-004-typescript.md`](./estandares/EST-004-typescript.md) | Models, mappers, repositories |
| [`estandares/EST-005-angular.md`](./estandares/EST-005-angular.md) | Features, containers, grid servidor |
| [`estandares/EST-006-supabase.md`](./estandares/EST-006-supabase.md) | RPC, auth, migraciones |
| [`estandares/EST-007-documentacion.md`](./estandares/EST-007-documentacion.md) | docs/codex, fases, auditorías |
| [`estandares/EST-008-ia.md`](./estandares/EST-008-ia.md) | Agentes IA: flujo, prohibiciones |

---

## `docs/codex/arquitectura/` — contratos transversales de código

| Documento | Contenido |
|-------------|-------------|
| [`arquitectura/README.md`](./arquitectura/README.md) | Índice de esta carpeta |
| [`arquitectura/frontend-interfaces.md`](./arquitectura/frontend-interfaces.md) | Contrato frontend Angular (inglés): wrappers en `pages/`, contenedores, servicios, reglas |

---

## `docs/codex/modulos/` — contratos por módulo

| Módulo | README | Estado |
|--------|--------|--------|
| Empleados | [`modulos/empleados/README.md`](./modulos/empleados/README.md) | productivo |
| Parámetros | [`modulos/parametros/README.md`](./modulos/parametros/README.md) | productivo (feature: `src/app/features/parametros-generales/`) |
| Conceptos remuneración | [`modulos/conceptos-remuneracion/README.md`](./modulos/conceptos-remuneracion/README.md) (diagnóstico + [`contrato-funcional.md`](./modulos/conceptos-remuneracion/contrato-funcional.md)) | productivo |
| Haberes y descuentos | [`modulos/haberes-descuentos/README.md`](./modulos/haberes-descuentos/README.md) | productivo |
| Movimientos variables (mensuales) | [`modulos/movimientos-variables/README.md`](./modulos/movimientos-variables/README.md) | productivo |
| Remuneraciones (punto de entrada) | [`modulos/remuneraciones/README.md`](./modulos/remuneraciones/README.md) | productivo (transversal del dominio) |
| Movimientos de remuneración (producto) | [`modulos/remuneraciones/movimientos-de-remuneracion.md`](./modulos/remuneraciones/movimientos-de-remuneracion.md) | productivo |
| Movimientos — resumen para agentes | [`orquestador/resumen-trabajo-movimientos-remuneracion.md`](./orquestador/resumen-trabajo-movimientos-remuneracion.md) | resumen |
| Remuneraciones — fases y decisión | [`modulos/remuneraciones/movimientos-remuneracion-simple.md`](./modulos/remuneraciones/movimientos-remuneracion-simple.md) | productivo |
| Nómina mensual (visión) | [`modulos/nomina-mensual/preparar-nomina/README.md`](./modulos/nomina-mensual/preparar-nomina/README.md) | productivo (V1 + V2 acotada pasos 1–3) |
| Auth | [`modulos/auth/README.md`](./modulos/auth/README.md) | productivo (código en `src/app/core/auth/`) |
| Empresas | [`modulos/empresas/README.md`](./modulos/empresas/README.md) | productivo |
| Liquidaciones oficiales | [`modulos/liquidaciones-oficiales/README.md`](./modulos/liquidaciones-oficiales/README.md) | productivo |
| LRE (Libro Remuneraciones Electrónico) | [`modulos/lre/README.md`](./modulos/lre/README.md) | plan futuro (sin feature) |

---

## Poda documental

`docs/codex` mantiene solo documentación activa, modular y context-packs (cuando existan).

Eliminados del repo activo (auditoría 2026-06-02; detalle en [`auditorias/auditoria-docs-2026-06.md`](./auditorias/auditoria-docs-2026-06.md)):

- 21 respaldos `.bak` bajo `archivo/backups/` (carpeta eliminada).
- 3 ZIPs en `modulos/nomina-mensual/` redundantes con las carpetas extraídas (3.87 MB).
- `archivo/assets-antiguos/` y su árbol `parametros-tabs-*` (96 PNG de iteraciones antiguas).
- `archivo/fases-cerradas/` — era duplicado byte a byte de [`fases/`](./fases/). Política vigente: cuando una fase cierra se **mueve** (no se copia) y queda enlace desde [`orquestador/estado-fases.md`](./orquestador/estado-fases.md).
- `modulos/nomina/` y `modulos/liquidaciones/` (carpetas vacías; reemplazadas por `nomina-mensual/` y `liquidaciones-oficiales/`).

Historial completo: git. No usar [`archivo/`](./archivo/README.md) como fuente normativa.

## Deuda documental conocida

[`inconsistencias.md`](./inconsistencias.md) lista contradicciones de dominio (vigencia/período en parámetros, `BORRADOR` empleados vs períodos, mensajes de estado duplicados) pendientes de resolver con producto.

---

### Diseno NOIA y decisiones de maquetacion

**Constitución visual (obligatoria antes de fases UI):**

- [`diseno/noia-ui-manual.md`](./diseno/noia-ui-manual.md) — **fuente unica de decision UI NOIA**: jerarquia, flujo obligatorio, que crear y que no hacer
- [`diseno/noia-bases-sistema-referencia.md`](./diseno/noia-bases-sistema-referencia.md) — **bases del sistema** + ejemplo canónico Creación avanzada
- [`diseno/noia-ui-guardrails.md`](./diseno/noia-ui-guardrails.md) — reglas visuales obligatorias
- [`diseno/noia-antipatrones-ia.md`](./diseno/noia-antipatrones-ia.md) — colores extravagantes, espacio mal usado, UI tipo IA (rechazar)
- [`diseno/noia-prompt-cursor.md`](./diseno/noia-prompt-cursor.md) — prompt copiable para Cursor
- [`diseno/noia-ui-review-checklist.md`](./diseno/noia-ui-review-checklist.md) — checklist de cierre
- [`diseno/bitacora-operativa-noia.md`](./diseno/bitacora-operativa-noia.md) — identidad Bitácora Operativa

Los antiguos auxiliares de tokens/layout/componentes/arquetipos fueron consolidados en `noia-ui-manual.md` para evitar reglas paralelas.
## Contrato y formularios (UI central)

| Documento | Contenido |
|-----------|-----------|
| [`contexto-rapido.md`](./contexto-rapido.md) | Resumen operativo corto para Cursor/Codex: fuente de verdad, restricciones, NOIA, fases recientes y validaciones por tipo de fase |
| [`AGENTS.md`](./AGENTS.md) | Contrato agente, prioridades, tokens resumidos, layout ERP, anti-patrones |
| [`ui-form-guidelines.md`](./ui-form-guidelines.md) | Tokens completos, formularios, MessageBox, loading, checklist |
| [`ui-button-guidelines.md`](./ui-button-guidelines.md) | Botones, toolbar, variantes |
| [`ui-tables.md`](./ui-tables.md) | Estándar de tablas, DataGrid, columnas, formatos, filtros, empty states y responsive |
| [`estilos/README.md`](./estilos/README.md) | Grilla 8 columnas, anchos, checklist de cierre (7 ítems) |
| [`temas/implementacion-ui.md`](./temas/implementacion-ui.md) | Dónde está el CSS y componentes en el repo (sin duplicar tokens) |
| [`temas/organizacion-por-modulo-y-flujos.md`](./temas/organizacion-por-modulo-y-flujos.md) | Convención `modulos/` + `temas/` + `flujos/` |
| [`temas/flujos/README.md`](./temas/flujos/README.md) | Índice de flujos de la app (rutas ? recorridos) |

---

## Proyecto y tipografía

| Documento | Contenido |
|-----------|-----------|
| [`manual-base-proyecto.md`](./manual-base-proyecto.md) | Lectura del proyecto, regla tipográfica (pesos) |
| [`../../README.md`](../../README.md) | Visión producto y stack (raíz repo) |

---

## Bitácoras (no son normativa base)

| Documento | Contenido |
|-----------|-----------|
| [`peticiones-estilos.md`](./peticiones-estilos.md) | Registro de mejoras visuales por fecha |
| [`peticiones-fusion-items-1-65.md`](./peticiones-fusion-items-1-65.md) | Índice de trabajo fusionado |

---

## Auditorías (hallazgos priorizados)

| Documento | Contenido |
|-----------|-----------|
| [`auditorias/README.md`](./auditorias/README.md) | Índice de auditorías |
| [`auditorias/qa-chile-01-remuneraciones.md`](./auditorias/qa-chile-01-remuneraciones.md) | QA-CHILE-01: remuneraciones chilenas (riesgos, brechas, checklist) |
| [`auditorias/param-chile-01-parametros-y-demo-proceso.md`](./auditorias/param-chile-01-parametros-y-demo-proceso.md) | PARAM-CHILE-01: parametros reales vs demo en proceso mensual (ALTO-004) |

---

## Base de datos e infra (fuera de UI)

| Ubicación | Contenido |
|-----------|-----------|
| [`../../SUPABASE_SETUP.md`](../../SUPABASE_SETUP.md) | Supabase |
| [`../../bd/README.md`](../../bd/README.md), [`../../bd/base/README.md`](../../bd/base/README.md), [`../../bd/base/v11/README.md`](../../bd/base/v11/README.md) | Esquema SQL (`bd/` solo `base/`) |

---

## `temas/` — transversal, histórico o pendiente de migración

- **Flujos por ruta**: [`temas/flujos/`](./temas/flujos/README.md).
- **Stubs**: varios archivos `temas/*.md` con el mismo nombre histórico redirigen a **`modulos/`** (ver [`orquestador/mapa-documentacion.md`](./orquestador/mapa-documentacion.md) §5).
- **Archivo de documentos viejos** (si se mueven explícitamente): [`archivo/README.md`](./archivo/README.md).

**Mejoras visuales**: registrar en [`peticiones-estilos.md`](./peticiones-estilos.md) cuando proceda según [`AGENTS.md`](./AGENTS.md).

<!-- UX-COMERCIAL-01-INTEGRACION -->

## UX comercial y flujo vendible validado

El flujo funcional validado en BD real/controlada queda como base para redisenio comercial:

```txt
Empleado/Ficha apta
-> Preparar nomina
-> Resultado preliminar
-> Aprobacion operativa
-> Cierre operativo
-> Liquidaciones oficiales internas
```

Para cambios de experiencia visible leer:

- [`ux-comercial/README.md`](./ux-comercial/README.md)
- [`ux-comercial/contrato-diseno-comercial.md`](./ux-comercial/contrato-diseno-comercial.md)
- [`ux-comercial/patrones-pantallas-erp.md`](./ux-comercial/patrones-pantallas-erp.md)
- [`ux-comercial/sistema-estados-acciones.md`](./ux-comercial/sistema-estados-acciones.md)
- [`fases/ux-comercial/UX-COMERCIAL-01.md`](./fases/ux-comercial/UX-COMERCIAL-01.md)
- [`prompts/CURSOR-UX-COMERCIAL-01.md`](./prompts/CURSOR-UX-COMERCIAL-01.md)

Regla: despues de liquidaciones oficiales internas, el foco inmediato es UX comercial antes de Previred/LRE/banco/contabilidad.
## ERP-NOIA-BITACORA-OPERATIVA-00 - Identidad global

Documento rector: [`diseno/bitacora-operativa-noia.md`](./diseno/bitacora-operativa-noia.md).

Define el ERP como `Bitacora Operativa` bajo criterio NOIA: pantallas sobrias, administrativas, con estado, decision, trazabilidad y cierre visible. Es regla transversal para nuevas fases UX antes de intervenir pantallas operativas.

## ERP-CONTEXT-OPTIMIZATION-01 - Contexto liviano para Cursor/Codex

Documento de fase: [`diseno/erp-context-optimization-01.md`](./diseno/erp-context-optimization-01.md).

Agrega `contexto-rapido.md`, reglas Cursor NOIA/protegidos, `.cursorignore` y `scripts/build-context-pack.ps1` para reducir tokens y ruido en fases futuras sin tocar pantallas ni lógica de negocio.

## NOM-MOVIMIENTOS-SIMPLE-01 - Movimientos visible

Documento de fase: [`diseno/nom-movimientos-simple-01.md`](./diseno/nom-movimientos-simple-01.md).

Primera capa visible de `Movimientos de remuneracion`: menu `Movimientos`, vista `Este mes`, vista `Recurrentes` y lenguaje preparado para `En cuotas`, sin tocar SQL, motor, servicios productivos ni persistencia critica.
