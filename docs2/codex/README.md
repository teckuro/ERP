# Documentación ERP - índice padre (reglas y módulos)

**Punto de entrada** para normas de producto, UI y flujos en `docs/codex`. Las definiciones por dominio viven en **`modulos/`**; `temas/` conserva **flujos transversales**, **stubs de redirección** y documentos no migrados.

## Orden de lectura (obligatorio para agentes y personas)

1. **Orquestador** - contexto global, diseño operativo y fases: [`orquestador/README.md`](./orquestador/README.md), [`orquestador/contexto-proyecto.md`](./orquestador/contexto-proyecto.md), [`orquestador/diseno-operativo-erp.md`](./orquestador/diseno-operativo-erp.md), [`orquestador/estado-fases.md`](./orquestador/estado-fases.md).
2. **Mapa de documentación** - inventario global / por módulo / histórico: [`orquestador/mapa-documentacion.md`](./orquestador/mapa-documentacion.md).
3. **Diccionario de tablas canonicas** - obligatorio antes de consultas, servicios, mappers, SQL o documentacion tecnica con nombres de tablas: [`orquestador/diccionario-tablas-canonicas.md`](./orquestador/diccionario-tablas-canonicas.md).
4. **Normativa operativa** - matriz y fuentes legales: [`normativa/README.md`](./normativa/README.md), [`normativa/matriz-normativa-operativa.md`](./normativa/matriz-normativa-operativa.md), [`normativa/fuentes-oficiales.md`](./normativa/fuentes-oficiales.md).
5. **Arquitectura frontend (Angular)** - páginas wrapper, contenedores, capas: [`arquitectura/frontend-interfaces.md`](./arquitectura/frontend-interfaces.md) (leer antes de rutas/pantallas/feature nuevos o refactors grandes).
6. **Contrato del agente y guías UI** - [`AGENTS.md`](./AGENTS.md), [`ui-form-guidelines.md`](./ui-form-guidelines.md), [`ui-button-guidelines.md`](./ui-button-guidelines.md), [`ui-tables.md`](./ui-tables.md), [`estilos/README.md`](./estilos/README.md).
7. **Módulo** - [`modulos/<módulo>/README.md`](./modulos/empleados/README.md) (elegir carpeta: `empleados`, `parametros`, etc.).
8. **Subflujo / pantalla** - el `.md` concreto dentro de esa carpeta (p. ej. [`modulos/empleados/ficha-empleado.md`](./modulos/empleados/ficha-empleado.md)).
9. **`temas/`** - solo si hace falta un **flujo por rutas** ([`temas/flujos/README.md`](./temas/flujos/README.md)), UI de implementación ([`temas/implementacion-ui.md`](./temas/implementacion-ui.md)), menú ([`temas/crear-menu-base.md`](./temas/crear-menu-base.md)) o un doc **aún no migrado**. Muchos `.md` en la raíz de `temas/` son **stubs** (“Documento migrado…”) hacia `modulos/`.

### Cada petición: qué pedir y qué se aplica

1. **Alcance**: pantalla, archivo o flujo concreto.
2. **Tipo de cambio**: solo UI, solo lógica, o ambos; si el contrato dice «solo UI», no tocar guardado, servicios ni `formControlName` sin acuerdo explícito.
3. **Fuente de verdad** si hay lista cerrada: p. ej. [`peticiones-fusion-items-1-65.md`](./peticiones-fusion-items-1-65.md).
4. **Jerarquía** (en conflicto gana el primero):
   1. [`AGENTS.md`](./AGENTS.md)
   2. **Este README** - índice y orden de lectura; no sustituye `AGENTS.md`.
   3. [`arquitectura/frontend-interfaces.md`](./arquitectura/frontend-interfaces.md) - estructura Angular (`pages` vs `features`, contenedores, capas).
   4. [`ui-form-guidelines.md`](./ui-form-guidelines.md)
   5. Documentos bajo [`modulos/`](./modulos/empleados/README.md) (y transversales en `temas/` cuando aplique).

---

## `docs/codex/arquitectura/` - contratos transversales de código

| Documento | Contenido |
|-------------|-------------|
| [`arquitectura/README.md`](./arquitectura/README.md) | Índice de esta carpeta |
| [`arquitectura/frontend-interfaces.md`](./arquitectura/frontend-interfaces.md) | Contrato frontend Angular (inglés): wrappers en `pages/`, contenedores, servicios, reglas |

---

## `docs/codex/modulos/` - contratos por módulo

| Módulo | README |
|--------|--------|
| Auth | [`modulos/auth/README.md`](./modulos/auth/README.md) |
| Empleados | [`modulos/empleados/README.md`](./modulos/empleados/README.md) |
| Parámetros | [`modulos/parametros/README.md`](./modulos/parametros/README.md) |
| Conceptos remuneración | [`modulos/conceptos-remuneracion/README.md`](./modulos/conceptos-remuneracion/README.md) (diagnóstico + [`contrato-funcional.md`](./modulos/conceptos-remuneracion/contrato-funcional.md)) |
| Haberes y descuentos | [`modulos/haberes-descuentos/README.md`](./modulos/haberes-descuentos/README.md) |
| Movimientos variables (mensuales) | [`modulos/movimientos-variables/README.md`](./modulos/movimientos-variables/README.md) |
| Nómina mensual (visión) | [`modulos/nomina-mensual/README.md`](./modulos/nomina-mensual/README.md) |
| LRE | [`modulos/lre/contrato-general.md`](./modulos/lre/contrato-general.md) |

---

## Normativa y datos canonicos

| Documento | Contenido |
|-----------|-----------|
| [`contrato-general.md`](./contrato-general.md) | Contrato documental transversal del ERP de remuneraciones |
| [`criterios-globales.md`](./criterios-globales.md) | Criterios transversales de validacion y bloqueo |
| [`criterios-severidad.md`](./criterios-severidad.md) | Severidades documentales |
| [`orquestador/diccionario-tablas-canonicas.md`](./orquestador/diccionario-tablas-canonicas.md) | Tablas canonicas y nombres que no deben usarse |
| [`normativa/README.md`](./normativa/README.md) | Indice normativo |
| [`normativa/matriz-normativa-operativa.md`](./normativa/matriz-normativa-operativa.md) | Matriz norma -> dato ERP -> severidad |
| [`plan-pruebas.md`](./plan-pruebas.md) | Plan documental de pruebas |
| [`CHANGELOG.md`](./CHANGELOG.md) | Registro de integraciones documentales |

---

## Contrato y formularios (UI central)

| Documento | Contenido |
|-----------|-----------|
| [`AGENTS.md`](./AGENTS.md) | Contrato agente, prioridades, tokens resumidos, layout ERP, anti-patrones |
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

## `temas/` - transversal, histórico o pendiente de migración

- **Flujos por ruta**: [`temas/flujos/`](./temas/flujos/README.md).
- **Stubs**: varios archivos `temas/*.md` con el mismo nombre histórico redirigen a **`modulos/`** (ver [`orquestador/mapa-documentacion.md`](./orquestador/mapa-documentacion.md) §5).
- **Archivo de documentos viejos** (si se mueven explícitamente): [`archivo/README.md`](./archivo/README.md).

**Mejoras visuales**: registrar en [`peticiones-estilos.md`](./peticiones-estilos.md) cuando proceda según [`AGENTS.md`](./AGENTS.md).

<!-- ARQ-ERP-01-INTEGRACION -->

## Integracion canonica 2026-05-07

Se agrega como lectura obligatoria para fases de Nomina y consolidacion:

| Documento | Rol |
|---|---|
| [`orquestador/estructura-canonica-erp.md`](./orquestador/estructura-canonica-erp.md) | Mapa canonico del ERP, fuentes de verdad y legacy/transicion. |
| [`orquestador/plan-transicion-novedades-movimientos.md`](./orquestador/plan-transicion-novedades-movimientos.md) | Transicion entre Movimientos variables y Novedades mensuales. |
| [`modulos/nomina-mensual/benchmark-novedades-pre-nomina.md`](./modulos/nomina-mensual/benchmark-novedades-pre-nomina.md) | Benchmark funcional para UI/flujo de Novedades y Pre-nomina. |
| [`orquestador/integracion-documental-2026-05-07.md`](./orquestador/integracion-documental-2026-05-07.md) | Resumen de integracion aplicada a este paquete documental. |

Decision canonica:

- **Novedades mensuales** es el nombre funcional oficial para RRHH.
- `novedad_remuneracion_periodo` es la tabla canonica futura para hechos del periodo.
- **Movimientos variables** queda como termino legacy/tecnico de transicion.
- `movimiento_variable_mensual` queda como tabla legacy de transicion.
- No crear nuevas mejoras funcionales sobre el flujo legacy salvo bugs criticos o compatibilidad temporal.
