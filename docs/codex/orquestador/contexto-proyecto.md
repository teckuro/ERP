# Contexto global del proyecto ERP

## 1. Propósito de este documento

Ofrecer en **una sola lectura** el mapa del producto: visión, stack, principios de UI, módulos y camino hacia remuneraciones completas. Sirve de **ancla** para agentes y personas; el detalle vive en [`temas/`](../temas/README.md) y en el índice [`../README.md`](../README.md).

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
| Contrato de trabajo para agentes | **`docs/codex`** (`AGENTS.md`, guías UI, `temas/`). |

## 4. Principio UI/UX

Guiado por **estados**, **pendientes** y **acciones**. Orden de presentación:

1. **Estado** — en qué situación está el registro o el proceso.
2. **Qué falta** — pendientes principales (pocos, claros).
3. **Acción siguiente** — un CTA coherente con el estado.
4. **Detalle bajo demanda** — pestañas, paneles o drill‑down; no todo visible a la vez.

El sistema **no** debe parecer una planilla gigante. En UI operativa **no** mostrar nombres de tablas, columnas ni errores crudos de motor. La complejidad legal y previsional existe **por capas** (catálogo, vigencia, período mensual, etc.); ver [`parametros-vigencia-y-periodo.md`](../temas/parametros-vigencia-y-periodo.md).

## 5. Mapa de módulos (alto nivel)

| Área | Rol en el producto |
|------|-------------------|
| **Empleados** | Ciclo de vida del trabajador: borrador avanzado, ficha en proceso, activación y **aptitud** para remuneraciones. |
| **Parámetros** | Período activo, datos mensuales vs vigencias vs catálogos globales; estado oficial del período de remuneración. |
| **Python / seeds** | Carga oficial de parámetros mensuales y normativa base alineada a BD v11. |
| **Haberes / descuentos** | Asignaciones recurrentes por trabajador (en evolución); no sustituyen conceptos ni liquidaciones. |
| **Conceptos de remuneración** | Pendiente de fase fuerte: catálogo maestro gobernado para haberes, descuentos, aportes y liquidaciones. |
| **Movimientos variables** | Futuro: horas extra, bonos puntuales, comisiones, ausencias, etc. |
| **Proceso mensual / motor / liquidaciones** | Futuro: checklist guiado, cálculo, cierre y congelado de resultados. |
| **Previred / LRE** | Fases posteriores con trazabilidad y validaciones. |

## 6. Estado resumido — Empleados

Contrato de estados, completitud y aptitud: [`empleados-estados-completitud-aptitud.md`](../temas/empleados-estados-completitud-aptitud.md). Flujos de ficha: [`flujo-edicion-ficha-empleado.md`](../temas/flujo-edicion-ficha-empleado.md). Modo básico: [`modo-basico-empleado.md`](../temas/modo-basico-empleado.md).

Puntos ya alineados al contrato (resumen): helper central `evaluarCompletitudYAptitudEmpleado`, listado y ficha orientados a estado/pendientes/acción, selects sin falsa autoselección, rehidratación de borrador avanzado sin tratar defaults técnicos como datos reales. **Fase 8 cerrada:** validación explícita **Validar para remuneraciones** en Ficha (opción B: sin aptitud automática); implementación y contrato en tema §21 y [`estado-fases.md`](./estado-fases.md).

## 7. Estado resumido — Parámetros

Período activo como contexto global; distinción **mensual / vigencia / catálogo**: [`parametros-vigencia-y-periodo.md`](../temas/parametros-vigencia-y-periodo.md). UI del módulo: [`parametros-ui-estandar.md`](../temas/parametros-ui-estandar.md). Reforma y gradualidad (p. ej. 8,5 %): [`reforma-pensiones-gradualidad.md`](../temas/reforma-pensiones-gradualidad.md). Campos y listas: [`parametros-generales-campos-y-listas.md`](../temas/parametros-generales-campos-y-listas.md).

La UI no debe dar por “todo vacío” si solo falta **carga mensual** oficial.

## 8. Estado resumido — Python / BD v11

Contrato de carga mensual, preparación y alineación con período: [`python-parametros-carga-mensual.md`](../temas/python-parametros-carga-mensual.md). Esquema: [`../../../bd/base/v11/README.md`](../../../bd/base/v11/README.md) (ruta relativa desde este archivo).

## 9. Estado resumido — Haberes y descuentos

Uso actual acotado a **asignaciones recurrentes** por trabajador, con período global; **no** calcula liquidaciones ni reemplaza movimientos variables. Pendiente: reglas de vigencia, duplicados, separación clara respecto de **conceptos** y UI más guiada. No duplicar aquí el contrato fino del módulo.

## 10. Estado resumido — Conceptos de remuneración

**Pendiente de fase fuerte.** Debe ser catálogo maestro (LRE, sistema/protegido, automático/manual, vigencias, reglas de edición) y **fuente** para haberes, descuentos, aportes y liquidaciones. **No** mezclar con asignaciones por trabajador.

## 11. Módulos futuros

- Conceptos gobernados (prioridad alta antes de motor fuerte).
- Movimientos variables mensuales.
- Proceso mensual tipo checklist (parámetros → aptos → recurrentes → variables → cálculo → cierre).
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
- Respetar separación **preparación** vs **carga oficial** en Python cuando el contrato lo exija ([`python-parametros-carga-mensual.md`](../temas/python-parametros-carga-mensual.md)).
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
| Empleados estado/aptitud | [`../temas/empleados-estados-completitud-aptitud.md`](../temas/empleados-estados-completitud-aptitud.md) |
| Borrador / tests | [`../temas/creacion-avanzada-borrador-tests.md`](../temas/creacion-avanzada-borrador-tests.md) |
| Organización temas / flujos app | [`../temas/organizacion-por-modulo-y-flujos.md`](../temas/organizacion-por-modulo-y-flujos.md), [`../temas/flujos/README.md`](../temas/flujos/README.md) |
| Parámetros período / vigencia | [`../temas/parametros-vigencia-y-periodo.md`](../temas/parametros-vigencia-y-periodo.md) |
| Parámetros UI | [`../temas/parametros-ui-estandar.md`](../temas/parametros-ui-estandar.md) |
| Python carga mensual | [`../temas/python-parametros-carga-mensual.md`](../temas/python-parametros-carga-mensual.md) |
