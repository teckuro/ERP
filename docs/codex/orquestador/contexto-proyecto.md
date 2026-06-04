# Contexto global del proyecto ERP

## 1. Propósito de este documento

Ofrecer en **una sola lectura** el mapa del producto: visión, stack, principios de UI, módulos y camino hacia remuneraciones completas. Sirve de **ancla** para agentes y personas; el detalle por dominio vive en [`modulos/`](../modulos/empleados/README.md) y material transversal en [`temas/`](../temas/README.md); índice [`../README.md`](../README.md).

## 2. Visión del producto

ERP **chileno**, orientado a **remuneraciones completas**, con interfaz **limpia, guiada y trazable**.

- **Complejo por dentro**: normativa previsional, laboral y períodos deben modelarse bien en datos y procesos.
- **Claro por fuera**: el usuario ve estado, pendientes y acciones, no una planilla infinita.

## 3. Stack

| Capa | Tecnología / convención |
|------|-------------------------|
| Front | **Angular** (aplicación principal en este repo). |
| Datos | **Supabase** / **PostgreSQL**. |
| Esquema actual | **`bd/base/v11`** como referencia de base de datos del proyecto. |
| Carga normativa y parámetros | **Python** (carpeta de parámetros en el workspace; **v6.11** para carga mensual, vigencias y seeds normativos). |
| Pruebas E2E / UI | **Playwright**. |
| Contrato de trabajo para agentes | **`docs/codex`** (`AGENTS.md`, guías UI, `modulos/`, `temas/`). |

## 4. Principio UI/UX

Guiado por **estados**, **pendientes** y **acciones**. Orden de presentación:

1. **Estado** — en qué situación está el registro o el proceso.
2. **Qué falta** — pendientes principales (pocos, claros).
3. **Acción siguiente** — un CTA coherente con el estado.
4. **Detalle bajo demanda** — pestañas, paneles o drill‑down; no todo visible a la vez.

El sistema **no** debe parecer una planilla gigante. En UI operativa **no** mostrar nombres de tablas, columnas ni errores crudos de motor. La complejidad legal y previsional existe **por capas** (catálogo, vigencia, período mensual, etc.); ver [`periodo-vigencia-catalogo.md`](../modulos/parametros/periodo-vigencia-catalogo.md).

Criterios operativos de pantalla (estado → pendientes → acción, qué evitar y **siguiente fase fuerte**): [`diseno-operativo-erp.md`](./diseno-operativo-erp.md).

## 5. Mapa de módulos (alto nivel)

| Área | Rol en el producto |
|------|-------------------|
| **Empleados** | Ciclo de vida del trabajador: borrador avanzado, ficha en proceso, activación y **aptitud** para remuneraciones. |
| **Parámetros** | Período activo, datos mensuales vs vigencias vs catálogos globales; estado oficial del período de remuneración. |
| **Python / seeds** | Carga oficial de parámetros mensuales y normativa base alineada a BD v11. |
| **Haberes / descuentos** | Asignaciones recurrentes por trabajador (en evolución); no sustituyen conceptos ni liquidaciones. |
| **Conceptos de remuneración** | **Fase fuerte en curso**; Fase 9 **documental cerrada** (diagnóstico + contrato funcional). Catálogo maestro para haberes, descuentos, aportes y liquidaciones. Entrada: [`../modulos/conceptos-remuneracion/README.md`](../modulos/conceptos-remuneracion/README.md). |
| **Movimientos variables** | Haberes/descuentos **puntuales** por trabajador y período (`YYYY-MM`). Contrato **9.4A**, modelo **9.4B**, persistencia **9.4C**, service **9.4D** y UI carga manual **9.4E** (`/remuneraciones/movimientos-variables`) en [`../modulos/movimientos-variables/README.md`](../modulos/movimientos-variables/README.md); RLS y proceso mensual en fases posteriores. |
| **Proceso mensual / motor / liquidaciones** | **Proceso mensual:** prevalidaciones por `YYYY-MM` (**9.5A–9.5B**, sin motor) en [`../modulos/nomina-mensual/preparar-nomina/README.md`](../modulos/nomina-mensual/preparar-nomina/README.md). **Motor / liquidaciones:** futuro checklist, cálculo, cierre y congelado de resultados. **Reinterpretación 2026-06-03/04 (NOM-REBUILD-NOMINA-MENSUAL-01):** el módulo `proceso-mensual` sigue intacto como motor V1; en paralelo se opera con Administrador (`/remuneraciones/nominas`, bandeja de N nóminas) y Generador V2 (`/remuneraciones/nominas/:id/generador`, una nómina por id) con stepper de 6 pasos (`Parámetros / Dotación / Movimientos / Cálculo / Validación / Cierre`). F3 fusion (2026-06-04) cerró la conexión a BD real: tablas `nomina_periodo`, `segmento_nomina`, `movimiento_recurrente`, `movimiento_nomina`, `incidencia_nomina`, `evento_auditoria_nomina` (RLS estricto + triggers). Documento rector: [`../modulos/nomina-mensual/arquitectura-administrador-generador.md`](../modulos/nomina-mensual/arquitectura-administrador-generador.md). Migración BD: [`../modulos/nomina-mensual/migracion-bd-nomina-rebuild.md`](../modulos/nomina-mensual/migracion-bd-nomina-rebuild.md). |
| **Previred / LRE** | Fases posteriores con trazabilidad y validaciones. |

## 6. Estado resumido — Empleados

Contrato de estados, completitud y aptitud: [`contrato-general.md`](../modulos/empleados/contrato-general.md). Ficha: [`ficha-empleado.md`](../modulos/empleados/ficha-empleado.md). Modo básico: [`creacion-basica.md`](../modulos/empleados/creacion-basica.md).

Puntos ya alineados al contrato (resumen): helper central `evaluarCompletitudYAptitudEmpleado`, listado y ficha orientados a estado/pendientes/acción, selects sin falsa autoselección, rehidratación de borrador avanzado sin tratar defaults técnicos como datos reales. **Fase 8 cerrada:** validación explícita **Validar para remuneraciones** en Ficha (opción B: sin aptitud automática); implementación y contrato en [`validar-remuneraciones.md`](../modulos/empleados/validar-remuneraciones.md) y [`estado-fases.md`](./estado-fases.md).

## 7. Estado resumido — Parámetros

Período activo como contexto global; distinción **mensual / vigencia / catálogo**: [`periodo-vigencia-catalogo.md`](../modulos/parametros/periodo-vigencia-catalogo.md). UI del módulo: [`ui-parametros.md`](../modulos/parametros/ui-parametros.md). Reforma y gradualidad (p. ej. 8,5 %): [`reforma-gradualidad.md`](../modulos/parametros/reforma-gradualidad.md). Campos y listas: [`campos-y-listas.md`](../modulos/parametros/campos-y-listas.md).

La UI no debe dar por “todo vacío” si solo falta **carga mensual** oficial.

## 8. Estado resumido — Python / BD v11

Contrato de carga mensual, preparación y alineación con período: [`python-carga-mensual.md`](../modulos/parametros/python-carga-mensual.md). Esquema: [`../../../bd/base/v11/README.md`](../../../bd/base/v11/README.md) (ruta relativa desde este archivo).

## 9. Estado resumido — Haberes y descuentos

Uso actual acotado a **asignaciones recurrentes** por trabajador, con período global; **no** calcula liquidaciones ni reemplaza **movimientos variables** (contrato en [`../modulos/movimientos-variables/README.md`](../modulos/movimientos-variables/README.md)). No duplicar aquí el contrato fino del módulo.

## 10. Estado resumido — Conceptos de remuneración

**Fase fuerte en curso** (Fase 9 documental **cerrada**: diagnóstico + contrato funcional). Catálogo maestro (LRE, sistema/protegido, automático/manual, vigencias, reglas de edición) y **fuente** para haberes, descuentos, aportes y liquidaciones. **No** mezclar con asignaciones por trabajador. Punto de entrada: [`../modulos/conceptos-remuneracion/README.md`](../modulos/conceptos-remuneracion/README.md). Contrato detallado: [`../modulos/conceptos-remuneracion/contrato-funcional.md`](../modulos/conceptos-remuneracion/contrato-funcional.md). Marco UX: [`diseno-operativo-erp.md`](./diseno-operativo-erp.md) §6.

## 11. Módulos futuros

- **Conceptos** — documentación de gobernanza (Fase 9) **cerrada**; sigue prioridad alta **cerrar implementación** (permisos, pruebas, reglas motor en UI) antes de motor fuerte.
- **Movimientos variables mensuales** — 9.4A documental + 9.4B modelo TS/reglas + 9.4C SQL/repositorio + 9.4D service fino + 9.4E UI carga manual: [`../modulos/movimientos-variables/README.md`](../modulos/movimientos-variables/README.md).
- Proceso mensual tipo checklist (parámetros → aptos → recurrentes → variables → cálculo → cierre); en Angular hay **prevalidaciones** por periodo sin liquidación ([`../modulos/nomina-mensual/preparar-nomina/README.md`](../modulos/nomina-mensual/preparar-nomina/README.md)).
- Motor de cálculo y **liquidaciones congeladas** (resultado, no formulario principal).
- Previred y LRE con trazabilidad y versiones.

## 12. Camino oficial hacia remuneraciones completas

Orden lógico **sin saltos**:

1. Empleados **aptos** (ficha válida y reglas de aptitud cumplidas).
2. **Parámetros** sólidos (período, mensual, vigencias, catálogos).
3. **Conceptos** gobernados.
4. **Haberes recurrentes** alineados a conceptos y vigencias.
5. **Movimientos variables** mensuales.
6. **Proceso mensual** de remuneraciones (guiado).
7. **Motor de cálculo**.
8. **Liquidaciones** (generadas y auditables).
9. **Previred**.
10. **LRE**.
11. **Reportes**, auditoría y cierre.

**Regla:** no avanzar a motor de liquidaciones productivo si no están razonablemente cerrados: empleados aptos, parámetros, conceptos, haberes recurrentes y variables según alcance.

## 13. Reglas globales de UI

Cada pantalla debe ayudar a responder:

1. Qué **estado** tiene el contexto o el registro.
2. Qué **falta** (pocos pendientes claros).
3. Qué puede hacer el **usuario** ahora.
4. Qué **no** debe hacer todavía (deshabilitado o no mostrado).
5. **Dónde** ver el detalle (pestaña, panel, enlace).

**Evitar:** todo visible a la vez; chips redundantes; textos técnicos largos; tablas/columnas en copy de usuario; defaults técnicos como si fueran datos reales; autoseleccionar el primer catálogo; marcar pasos completos con datos solo técnicos; “sin información” cuando solo falta carga mensual; cards o padding inflados.

**Favorecer:** panel de estado; pendientes principales; acción siguiente; detalle bajo demanda; mensajes de negocio; empty states específicos; scroll horizontal solo donde el **DataGrid** lo requiera; layout estable y liviano. Tablas: [`../ui-tables.md`](../ui-tables.md). Formularios: [`../ui-form-guidelines.md`](../ui-form-guidelines.md).

## 14. Reglas globales de trazabilidad

- Los cambios de producto/UI relevantes deben poder **rastrearse** (p. ej. [`peticiones-estilos.md`](../peticiones-estilos.md) para mejoras visuales acordadas).
- No mezclar **períodos** ni fuentes de verdad sin dejar explícito en doc o en UI qué período aplica.
- Respetar separación **preparación** vs **carga oficial** en Python cuando el contrato lo exija ([`python-carga-mensual.md`](../modulos/parametros/python-carga-mensual.md)).
- Historial o bitácoras de negocio, donde existan en el sistema, deben reflejar **quién / cuándo / qué** sin sustituir el modelo de datos documentado en temas.

## 15. Qué no construir todavía

Hasta cerrar las fases previas del tablero y el contrato correspondiente:

- Motor de liquidación **productivo**.
- Liquidaciones **productivas** masivas sin auditoría clara.
- Previred / LRE **finales** sin fuente y versión acotadas.
- Nómina mensual **productiva** end‑to‑end sin checklist y aptos.
- Cálculo automático **completo** sin conceptos y datos mensuales gobernados.
- Movimientos variables si **conceptos / haberes** no están alineados.
- **Activación automática** de aptitud remuneraciones **sin** acción explícita en ficha (opción B).

## 16. Documentos específicos relacionados

| Tema | Documento |
|------|-------------|
| Contrato agente | [`../AGENTS.md`](../AGENTS.md) |
| Índice padre | [`../README.md`](../README.md) |
| Manual de lectura del repo | [`../manual-base-proyecto.md`](../manual-base-proyecto.md) |
| Fases y cierre | [`estado-fases.md`](./estado-fases.md) |
| Diseño operativo (UX prioridades, Conceptos siguiente fase) | [`diseno-operativo-erp.md`](./diseno-operativo-erp.md) |
| Mapa documentación | [`mapa-documentacion.md`](./mapa-documentacion.md) |
| Empleados (módulo) | [`../modulos/empleados/README.md`](../modulos/empleados/README.md) |
| Empleados estado/aptitud | [`../modulos/empleados/contrato-general.md`](../modulos/empleados/contrato-general.md) |
| Borrador / tests | [`../modulos/empleados/borrador-continuar-alta.md`](../modulos/empleados/borrador-continuar-alta.md), [`../modulos/empleados/tests-empleados.md`](../modulos/empleados/tests-empleados.md) |
| Organización temas / flujos app | [`../temas/organizacion-por-modulo-y-flujos.md`](../temas/organizacion-por-modulo-y-flujos.md), [`../temas/flujos/README.md`](../temas/flujos/README.md) |
| Parámetros (módulo) | [`../modulos/parametros/README.md`](../modulos/parametros/README.md) |
| Parámetros período / vigencia | [`../modulos/parametros/periodo-vigencia-catalogo.md`](../modulos/parametros/periodo-vigencia-catalogo.md) |
| Parámetros UI | [`../modulos/parametros/ui-parametros.md`](../modulos/parametros/ui-parametros.md) |
| Python carga mensual | [`../modulos/parametros/python-carga-mensual.md`](../modulos/parametros/python-carga-mensual.md) |
| Conceptos (módulo) | [`../modulos/conceptos-remuneracion/README.md`](../modulos/conceptos-remuneracion/README.md), [`../modulos/conceptos-remuneracion/contrato-funcional.md`](../modulos/conceptos-remuneracion/contrato-funcional.md), [`../modulos/conceptos-remuneracion/diagnostico-fase-9.md`](../modulos/conceptos-remuneracion/diagnostico-fase-9.md) |
| Haberes / descuentos | [`../modulos/haberes-descuentos/README.md`](../modulos/haberes-descuentos/README.md) |
| Nómina mensual (visión) | [`../modulos/nomina-mensual/preparar-nomina/README.md`](../modulos/nomina-mensual/preparar-nomina/README.md) |
