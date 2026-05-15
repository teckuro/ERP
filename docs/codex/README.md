# Documentación ERP — índice padre (reglas y módulos)

**Punto de entrada** para normas de producto, UI y flujos en `docs/codex`. Las definiciones por dominio viven en **`modulos/`**; `temas/` conserva **flujos transversales**, **stubs de redirección** y documentos no migrados.

## Orden de lectura (obligatorio para agentes y personas)

1. **Orquestador** — contexto global, diseño operativo y fases: [`orquestador/README.md`](./orquestador/README.md), [`orquestador/contexto-proyecto.md`](./orquestador/contexto-proyecto.md), [`orquestador/diseno-operativo-erp.md`](./orquestador/diseno-operativo-erp.md), [`orquestador/estado-fases.md`](./orquestador/estado-fases.md).
2. **Mapa de documentación** — inventario global / por módulo / histórico: [`orquestador/mapa-documentacion.md`](./orquestador/mapa-documentacion.md).
3. **Arquitectura frontend (Angular)** — páginas wrapper, contenedores, capas: [`arquitectura/frontend-interfaces.md`](./arquitectura/frontend-interfaces.md) (leer antes de rutas/pantallas/feature nuevos o refactors grandes).
4. **Contrato del agente y guías UI** — [`AGENTS.md`](./AGENTS.md), [`ui-form-guidelines.md`](./ui-form-guidelines.md), [`ui-button-guidelines.md`](./ui-button-guidelines.md), [`ui-tables.md`](./ui-tables.md), [`estilos/README.md`](./estilos/README.md).
5. **Módulo** — [`modulos/<módulo>/README.md`](./modulos/empleados/README.md) (elegir carpeta: `empleados`, `parametros`, etc.).
6. **Subflujo / pantalla** — el `.md` concreto dentro de esa carpeta (p. ej. [`modulos/empleados/ficha-empleado.md`](./modulos/empleados/ficha-empleado.md)).
7. **`temas/`** — solo si hace falta un **flujo por rutas** ([`temas/flujos/README.md`](./temas/flujos/README.md)), UI de implementación ([`temas/implementacion-ui.md`](./temas/implementacion-ui.md)), menú ([`temas/crear-menu-base.md`](./temas/crear-menu-base.md)) o un doc **aún no migrado**. Muchos `.md` en la raíz de `temas/` son **stubs** (“Documento migrado…”) hacia `modulos/`.

### Cada petición: qué pedir y qué se aplica

1. **Alcance**: pantalla, archivo o flujo concreto.
2. **Tipo de cambio**: solo UI, solo lógica, o ambos; si el contrato dice «solo UI», no tocar guardado, servicios ni `formControlName` sin acuerdo explícito.
3. **Fuente de verdad** si hay lista cerrada: p. ej. [`peticiones-fusion-items-1-65.md`](./peticiones-fusion-items-1-65.md).
4. **Jerarquía** (en conflicto gana el primero):
   1. [`AGENTS.md`](./AGENTS.md)
   2. **Este README** — índice y orden de lectura; no sustituye `AGENTS.md`.
   3. [`arquitectura/frontend-interfaces.md`](./arquitectura/frontend-interfaces.md) — estructura Angular (`pages` vs `features`, contenedores, capas).
   4. [`ui-form-guidelines.md`](./ui-form-guidelines.md)
   5. Documentos bajo [`modulos/`](./modulos/empleados/README.md) (y transversales en `temas/` cuando aplique).

---

## `docs/codex/arquitectura/` — contratos transversales de código

| Documento | Contenido |
|-------------|-------------|
| [`arquitectura/README.md`](./arquitectura/README.md) | Índice de esta carpeta |
| [`arquitectura/frontend-interfaces.md`](./arquitectura/frontend-interfaces.md) | Contrato frontend Angular (inglés): wrappers en `pages/`, contenedores, servicios, reglas |

---

## `docs/codex/modulos/` — contratos por módulo

| Módulo | README |
|--------|--------|
| Empleados | [`modulos/empleados/README.md`](./modulos/empleados/README.md) |
| Parámetros | [`modulos/parametros/README.md`](./modulos/parametros/README.md) |
| Conceptos remuneración | [`modulos/conceptos-remuneracion/README.md`](./modulos/conceptos-remuneracion/README.md) (diagnóstico + [`contrato-funcional.md`](./modulos/conceptos-remuneracion/contrato-funcional.md)) |
| Haberes y descuentos | [`modulos/haberes-descuentos/README.md`](./modulos/haberes-descuentos/README.md) |
| Movimientos variables (mensuales) | [`modulos/movimientos-variables/README.md`](./modulos/movimientos-variables/README.md) |
| Nómina mensual (visión) | [`modulos/nomina-mensual/README.md`](./modulos/nomina-mensual/README.md) |

---

## Contrato y formularios (UI central)

| Documento | Contenido |
|-----------|-----------|
| [`AGENTS.md`](./AGENTS.md) | Contrato agente, prioridades, tokens resumidos, layout ERP, anti‑patrones |
| [`ui-form-guidelines.md`](./ui-form-guidelines.md) | Tokens completos, formularios, MessageBox, loading, checklist |
| [`ui-button-guidelines.md`](./ui-button-guidelines.md) | Botones, toolbar, variantes |
| [`ui-tables.md`](./ui-tables.md) | Estándar de tablas, DataGrid, columnas, formatos, filtros, empty states y responsive |
| [`estilos/README.md`](./estilos/README.md) | Grilla 8 columnas, anchos, checklist de cierre (7 ítems) |
| [`temas/implementacion-ui.md`](./temas/implementacion-ui.md) | Dónde está el CSS y componentes en el repo (sin duplicar tokens) |
| [`temas/organizacion-por-modulo-y-flujos.md`](./temas/organizacion-por-modulo-y-flujos.md) | Convención `modulos/` + `temas/` + `flujos/` |
| [`temas/flujos/README.md`](./temas/flujos/README.md) | Índice de flujos de la app (rutas ↔ recorridos) |

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
- [`prompts-cursor/CURSOR-UX-COMERCIAL-01.md`](./prompts-cursor/CURSOR-UX-COMERCIAL-01.md)

Regla: despues de liquidaciones oficiales internas, el foco inmediato es UX comercial antes de Previred/LRE/banco/contabilidad.
## ERP-NOIA-BITACORA-OPERATIVA-00 - Identidad global

Documento rector: [`diseno/bitacora-operativa-noia.md`](./diseno/bitacora-operativa-noia.md).

Define el ERP como `Bitacora Operativa` bajo criterio NOIA: pantallas sobrias, administrativas, con estado, decision, trazabilidad y cierre visible. Es regla transversal para nuevas fases UX antes de intervenir pantallas operativas.
