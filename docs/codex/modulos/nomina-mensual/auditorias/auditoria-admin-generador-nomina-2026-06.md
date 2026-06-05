# NOM-ADMIN-GENERADOR-AUDIT-2026-06

> **Estado:** Vigente. Roadmap P0–P3 propuesto, no ejecutado.  
> **Última revisión de estado:** 2026-06-05 (ver §15).  
> Índice: [`README.md`](./README.md). Documento rector relacionado: [`../arquitectura-administrador-generador.md`](../arquitectura-administrador-generador.md).

## Auditoría profunda del Administrador y Generador de Nómina

Fecha: 2026-06-05  
Tipo: auditoría documental, funcional, UX, accesibilidad y arquitectura  
Rutas: `/remuneraciones/nominas` y `/remuneraciones/nominas/:nominaPeriodoId/generador`  
Estado: diagnóstico cerrado; roadmap P0-P3 propuesto, no ejecutado  
Documento rector relacionado: [`../arquitectura-administrador-generador.md`](../arquitectura-administrador-generador.md)

> Esta auditoría no modifica UI productiva, servicios, motor, SQL, RPC, RLS ni
> persistencia. Describe el estado observado y define una evolución implementable.

---

## 1. Resumen ejecutivo

El Administrador y el Generador ya tienen una base funcional superior a la
maqueta inicial: rutas definitivas, seis pasos, persistencia de nómina, máquina
de estados, cálculo acotado por dotación, invalidación de cálculo, cierre
trazable y acceso a liquidaciones desde una nómina cerrada.

La brecha principal ya no es “hacer funcionar el flujo”, sino consolidarlo como
una experiencia única, coherente y mantenible para RRHH. Hoy conviven tres capas:

1. El Administrador nuevo, orientado a múltiples nóminas.
2. El Generador de seis pasos, conectado al modelo `nomina_periodo`.
3. Infraestructura heredada de V1/V2: sesión por período, componentes de
   Alcance/Empleados, overlays, mocks de navegación, trazabilidad anterior y un
   CSS acumulativo de gran tamaño.

Esto produce cuatro riesgos:

- el usuario puede ver más de una acción primaria para la misma intención;
- el lenguaje visible mezcla conceptos RRHH con IDs, enums y términos técnicos;
- Dotación y Movimientos todavía no escalan de forma consistente a 1.000+
  trabajadores;
- el costo de mantener o rediseñar el Generador seguirá creciendo mientras la
  capa heredada permanezca dentro del contenedor activo.

### Fortalezas observadas

- Separación de rutas entre bandeja y generador.
- Flujo explícito de seis pasos.
- Trabajo por excepción declarado como principio rector.
- Uso de `app-data-grid` en el Administrador.
- Estados de carga, error y vacío en las superficies principales.
- Persistencia de estado y evidencia de cálculo.
- Guardias de cálculo y cierre.
- Confirmación de cierre con `app-message-box`.
- E2E del recorrido Administrador → Generador.
- Dotación consultada mediante paginación remota.

### Cinco decisiones prioritarias

1. **Una acción primaria por paso.** El CTA del shell será la única acción
   primaria de avance; los pies de paso quedarán para volver, cancelar o
   acciones secundarias.
2. **El estado de la nómina gobierna la navegación.** El stepper no marcará un
   paso como completo solo porque el usuario lo visitó; usará evidencia
   persistida y guardias reales.
3. **Dotación adopta `app-data-grid`.** Se elimina la tabla manual y toda
   selección masiva debe funcionar entre páginas con preview verificable.
4. **El contenedor nuevo deja de depender de piezas visuales antiguas.** Alcance,
   Empleados, overlays y navegación basada en mocks se retiran gradualmente.
5. **La capa visual se consolida en `app-page-frame` y tokens `--pf-*`.** No se
   mantiene una paleta paralela `--nomina-*` como sistema alternativo.

---

## 2. Método y clasificación

La revisión se realizó contra:

- rutas y contenedores Angular activos;
- templates y CSS del Administrador y los seis pasos;
- presenters, reglas, servicios y modelos de `nomina_periodo`;
- migraciones y tipos Supabase ya preparados;
- specs unitarios y E2E existentes;
- manual, guardrails, antipatrones y checklist NOIA;
- documentación histórica de V1, V2 y reconstrucción Admin + Generador.

Cada observación se clasifica así:

| Etiqueta | Significado |
|---|---|
| **Hecho** | Comportamiento o estructura verificable directamente en el repositorio. |
| **Inferencia** | Riesgo razonable derivado de varios hechos; debe validarse durante la implementación. |
| **Propuesta** | Diseño objetivo recomendado; todavía no es contrato productivo. |

Severidad:

| Prioridad | Criterio |
|---|---|
| **P0** | Puede provocar una acción incorrecta, estado incoherente, bloqueo de operación o incumplimiento NOIA crítico. |
| **P1** | Dificulta el trabajo frecuente, la escalabilidad o la comprensión del flujo. |
| **P2** | Deuda visual/arquitectónica que incrementa costo y riesgo de evolución. |
| **P3** | Consolidación, limpieza y retiro controlado de compatibilidad anterior. |

---

## 3. Inventario real

### 3.1 Rutas

| Ruta | Rol | Estado observado |
|---|---|---|
| `/remuneraciones/nominas` | Administrador | Ruta canónica de la bandeja. |
| `/remuneraciones/nominas/:nominaPeriodoId/generador` | Generador | Ruta canónica para trabajar una nómina. |
| `/remuneraciones/nomina-mensual-v2` | Compatibilidad | Redirige al Administrador. |
| `/remuneraciones/proceso-mensual` | V1 | Continúa disponible como motor/flujo anterior. |
| `/remuneraciones/liquidaciones` | Salida | Recibe período, nómina y cálculo trazable. |

### 3.2 Administrador

| Pieza | Responsabilidad |
|---|---|
| `administrador-nominas-container.ts` | Carga, filtros rápidos, acciones, navegación y modales. |
| `administrador-nominas-container.html` | KPIs, estados, `app-data-grid`, acciones por fila y diálogos. |
| `admin-nominas.presenter.ts` | Diez columnas, filtros y orden operativo. |
| `admin-nominas.rules.ts` | Matriz de acciones por estado. |
| Modal nueva nómina | Período, empresa, tipo y creación. |
| Modal resumen | Totales, guardias, incidencias y continuación. |

### 3.3 Generador

| Paso | Fuente principal | Responsabilidad visible |
|---|---|---|
| Parámetros | Mantenedores + sesión V2 | Verificar configuración normativa y operativa. |
| Dotación | `NominaPeriodoService` | Revisar incluidos, estados, incidencias y exclusiones. |
| Movimientos | recurrentes + movimientos de nómina | Aplicar, crear, omitir y reaplicar. |
| Cálculo | adapter al motor V1 | Prevalidar, calcular y mostrar resumen del snapshot. |
| Validación | incidencias persistidas | Revisar excepciones y aprobar. |
| Cierre | nómina + validación | Confirmar cierre, reabrir y volver al Administrador. |

### 3.4 Persistencia y dominio

- `NominaPeriodo` es la cabecera operativa.
- `SegmentoNomina` define grupos de dotación.
- `MovimientoNomina` registra movimientos aplicados a una nómina.
- `IncidenciaNomina` modela críticas, advertencias e informativas.
- `EventoAuditoriaNomina` registra acciones administrativas.
- La máquina de estados incluye:

```text
borrador
→ dotacion_generada
→ en_revision
→ calculada
→ validada
→ aprobada
→ cerrada
```

Con estados laterales `reabierta` y `anulada`.

### 3.5 Modales y overlays

| Superficie | Implementación | Observación |
|---|---|---|
| Nueva nómina | Modal local | Correcto como formulario breve. |
| Resumen de nómina | Modal local | Útil, pero todavía no orienta siempre al siguiente paso concreto. |
| Eliminar/anular/reabrir | Diálogo local | Debe migrar a `app-message-box`. |
| Preview de exclusión | Modal local | Debe normalizarse y mostrar afectados de forma verificable. |
| Cierre | `app-message-box` | Patrón correcto. |
| Overlays V2 heredados | Componente agregador | Conserva decisiones de Alcance/Empleados ya fuera del flujo visible. |
| Trazabilidad | Modal + drawer | Hay dos superficies; debe definirse una jerarquía única. |

### 3.6 Pruebas

La cobertura actual incluye:

- presenter, reglas y utilidades del Administrador;
- smoke del contenedor;
- creación y resumen;
- reglas de máquina de estados;
- servicio de nómina y adapter de cálculo;
- specs V2 históricos;
- E2E Administrador → Generador.

No se observaron specs de componente dedicados para:

- Dotación;
- Movimientos;
- Cálculo;
- Validación;
- Cierre;
- stepper nuevo;
- overlays activos;
- drawer/modal de trazabilidad.

---

## 4. Matriz NOIA

### 4.1 Administrador

| Decisión | Definición |
|---|---|
| Tipo de pantalla | Listado operativo / bandeja de trabajo. |
| Usuario | RRHH, remuneraciones, supervisor de nómina. |
| Fuente de verdad | `NominaPeriodoResumen[]` persistido. |
| Puede | Crear, continuar, revisar, anular, reabrir y acceder a liquidaciones trazables. |
| No debe | Editar datos internos ni exponer IDs técnicos como información principal. |
| Estado principal | Nóminas que requieren acción. |
| Acción recomendada | Continuar la nómina prioritaria. |
| Riesgo | Sobrecarga de acciones y confusión entre estado, siguiente paso y acción administrativa. |
| Patrón visual | `app-page-frame` + franja operativa + `app-data-grid`. |

### 4.2 Shell del Generador

| Decisión | Definición |
|---|---|
| Tipo de pantalla | Flujo guiado / expediente operativo. |
| Usuario | Analista que prepara una nómina específica. |
| Fuente de verdad | `NominaPeriodo` + evidencia persistida de cada etapa. |
| Puede | Avanzar, retroceder y corregir mientras la nómina sea editable. |
| No debe | Saltar guardias ni confundir visitar un paso con completarlo. |
| Estado principal | Etapa actual y vigencia del cálculo. |
| Acción recomendada | Único CTA del paso actual. |
| Riesgo | Navegación basada en estado local y duplicación de CTA. |
| Patrón visual | `app-page-frame` + mapa compacto de etapas + superficie principal. |

### 4.3 Parámetros

| Decisión | Definición |
|---|---|
| Tipo | Lista de verificación normativa. |
| Fuente | Parámetros oficiales, cliente y configuración guardada. |
| Acción | Resolver pendientes o confirmar configuración vigente. |
| Riesgo | Separación cognitiva entre Generador y mantenedor. |
| Patrón | Lista de revisión con estado, impacto y deep link contextual. |

### 4.4 Dotación

| Decisión | Definición |
|---|---|
| Tipo | Tabla contextual de revisión masiva. |
| Fuente | Consulta remota paginada por `nominaPeriodoId`. |
| Acción | Resolver excepciones y confirmar dotación. |
| Riesgo | Selección parcial entre páginas y acciones sin contexto humano suficiente. |
| Patrón | `app-data-grid` + detalle lateral bajo demanda + barra masiva. |

### 4.5 Movimientos

| Decisión | Definición |
|---|---|
| Tipo | Registro y revisión de novedades económicas. |
| Fuente | Recurrentes y movimientos de la nómina. |
| Acción | Aplicar recurrentes y resolver movimientos excepcionales. |
| Riesgo | Tipo libre, IDs visibles y falta de importación/edición consolidada. |
| Patrón | Tabla contextual con filtros de origen/estado + formulario secundario. |

### 4.6 Cálculo

| Decisión | Definición |
|---|---|
| Tipo | Consola de ejecución y resultado. |
| Fuente | Snapshot vigente vinculado a la nómina. |
| Acción | Calcular o recalcular después de resolver bloqueos. |
| Riesgo | Resumen insuficiente para explicar cambios y vigencia. |
| Patrón | Franja de prevalidación + CTA único + resumen comparativo. |

### 4.7 Validación

| Decisión | Definición |
|---|---|
| Tipo | Lista de revisión por excepción. |
| Fuente | Incidencias persistidas del cálculo vigente. |
| Acción | Resolver, justificar o aprobar. |
| Riesgo | Aprobar sin evidencia clara de responsables y resolución. |
| Patrón | Bandeja agrupada por causa/trabajador + panel de detalle. |

### 4.8 Cierre

| Decisión | Definición |
|---|---|
| Tipo | Acta y decisión administrativa. |
| Fuente | Estado aprobado, cálculo vigente, validación y auditoría. |
| Acción | Cerrar la nómina. |
| Riesgo | Cierre sin mostrar firmantes, versión o salida posterior. |
| Patrón | Acta compacta + checklist persistido + `app-message-box`. |

---

## 5. Recorrido completo observado

### 5.1 Crear

1. El usuario abre “Nueva nómina”.
2. Selecciona período, empresa y tipo.
3. El servicio crea la cabecera y genera una dotación general.
4. El Administrador incorpora el resumen.
5. Se abre automáticamente el Generador.

**Evaluación:** el recorrido es directo. Falta anticipar con claridad qué
ocurrirá con duplicados ordinarios y extraordinarias, y mostrar la dotación
generada como resultado de creación, no como efecto implícito.

### 5.2 Parámetros

1. Se consultan estado oficial, configuración guardada y pendientes.
2. El usuario puede abrir el mantenedor.
3. Al continuar, el contenedor persiste parcialmente la cabecera.

**Evaluación:** es el paso con mayor madurez visual. La continuidad al
mantenedor debe conservar retorno, nómina, período y foco exacto.

### 5.3 Dotación

1. Se consulta una página de trabajadores.
2. Se filtra por búsqueda, estado, incidencias y movimientos.
3. Se abre detalle bajo demanda.
4. Se seleccionan filas de la página.
5. La exclusión requiere preview.
6. Se confirma dotación.

**Evaluación:** la consulta remota es correcta, pero la tabla manual duplica
capacidades del sistema y la selección no expresa si aplica solo a la página o
al universo filtrado.

### 5.4 Movimientos

1. Se cargan recurrentes, movimientos y un conjunto inicial de trabajadores.
2. Se aplican recurrentes de forma idempotente.
3. Se busca trabajador por nombre o RUT.
4. Se agrega movimiento manual.
5. Se omite o reaplica un movimiento.

**Evaluación:** funcionalmente útil, pero todavía se muestran tipo, categoría,
origen, estado e ID con lenguaje técnico. Falta catálogo de conceptos,
edición, importación y navegación desde una incidencia.

### 5.5 Cálculo

1. Se obtiene prevalidación.
2. Las críticas bloqueantes impiden calcular.
3. El adapter ejecuta el motor para la dotación de la nómina.
4. Se registra snapshot, totales, versión y vigencia.
5. Se muestra resumen y top 5 de líquidos.

**Evaluación:** el vínculo funcional está resuelto. Para revisión real falta
comparar contra la versión anterior y ofrecer acceso a trabajadores con
variaciones relevantes, bloqueos o resultados atípicos.

### 5.6 Validación

1. Se carga el resumen persistido.
2. Se filtran críticas y advertencias.
3. Se puede volver a Dotación para una incidencia con trabajador.
4. Sin bloqueos se valida y aprueba.

**Evaluación:** el paso sigue siendo una lista plana. No diferencia incidencia
resuelta, justificada, aceptada o pendiente, ni muestra quién validará la
aprobación.

### 5.7 Cierre y liquidaciones

1. Se carga checklist basado en evidencia.
2. Se confirma el cierre con `app-message-box`.
3. La nómina queda cerrada y no editable.
4. Desde el Administrador se habilita Liquidaciones si existe cálculo trazable.

**Evaluación:** la guardia central es correcta. Debe mostrarse explícitamente la
versión cerrada, responsables, fecha/hora y estado de generación de
liquidaciones.

### 5.8 Reapertura

1. Puede iniciarse desde el cierre o el Administrador.
2. Requiere motivo.
3. Se registra auditoría.
4. Se invalida el cálculo anterior.

**Evaluación:** la regla es correcta. La UI debe anticipar el impacto:
liquidaciones existentes, cálculo que pierde vigencia y pasos que deben
repetirse.

---

## 6. Hallazgos

### 6.1 Coherencia de acciones y navegación

| ID | Tipo | P | Evidencia | Impacto | Recomendación | Aceptación |
|---|---|---:|---|---|---|---|
| AG-CTA-01 | Hecho | P0 | El shell publica CTA primario y los pasos 2-6 repiten un botón primario en su footer. | Dos acciones dominantes para la misma intención. | Dejar el CTA del shell como único avance; footer solo con volver/secundarias. | En cada paso existe exactamente un control visual primario para avanzar. |
| AG-NAV-02 | Hecho | P0 | El estado visual del stepper se calcula por posición respecto del paso actual. | Visitar un paso puede parecer equivalente a completarlo. | Derivar estados del stepper desde evidencia persistida. | Retroceder o recargar no cambia “completo” sin transición persistida. |
| AG-NAV-03 | Inferencia | P0 | `nextStep()` navega secuencialmente; guardias están distribuidas en hijos y shell. | Un CTA global puede avanzar sin ejecutar la acción real del paso. | Cada paso expone un comando de avance único con resultado tipado. | Ningún paso avanza si su operación principal falla o sigue pendiente. |
| AG-CTX-04 | Hecho | P1 | Breadcrumb del Generador muestra `Nómina / Paso`, sin empresa, tipo ni período en el nivel visible. | Riesgo de operar la nómina equivocada. | Incorporar contexto compacto persistente. | Empresa, período, tipo, estado y versión son visibles sin abrir modal. |
| AG-ERR-05 | Hecho | P1 | La carga de nómina falla con `console.error` y deja `nominaCargada=null`. | No hay recuperación clara para el usuario. | Estado de error de página con reintento y retorno al Administrador. | Fallo de carga nunca deja el stepper operativo sin nómina. |

### 6.2 Administrador

| ID | Tipo | P | Evidencia | Impacto | Recomendación | Aceptación |
|---|---|---:|---|---|---|---|
| ADM-ACT-01 | Hecho | P1 | Una fila puede mostrar Resumen, Eliminar/Reabrir/Anular, Liquidaciones y Abrir. | Columna de acciones ancha y difícil de escanear. | CTA contextual + menú “Más acciones”. | Máximo dos acciones visibles; destructivas dentro del menú. |
| ADM-FIL-02 | Hecho | P1 | “Requiere acción” y “Abiertas” comparten el mismo predicado. | Dos filtros con significado aparente distinto producen igual resultado. | Definir taxonomía exclusiva. | Cada KPI/filtro tiene definición documentada y resultado diferenciable. |
| ADM-KPI-03 | Hecho | P1 | KPIs se usan como botones, pero no expresan resultado ni estado a lectores de pantalla. | Navegación y filtro menos accesibles. | Añadir nombre accesible, `aria-pressed` y conteo de resultados. | Cambio de KPI se anuncia y puede operarse por teclado. |
| ADM-AGE-04 | Inferencia | P1 | Se ordena por `updatedAt`, pero la tabla solo dice “Actualizada”. | La antigüedad operativa no se entiende como riesgo. | Mostrar “sin actividad hace N días” y responsable de última acción. | Nóminas estancadas se reconocen sin ordenar manualmente. |
| ADM-MOD-05 | Hecho | P0 | Acciones administrativas usan diálogo local distinto del sistema. | Inconsistencia de foco, teclado y confirmación. | Migrar a `app-message-box` con motivo y consecuencias. | Escape, foco inicial/retorno y bloqueo durante envío están cubiertos. |
| ADM-NEW-06 | Hecho | P1 | Empresas disponibles se derivan de resúmenes existentes. | Una empresa sin nóminas previas puede no aparecer. | Consultar catálogo de empresas autorizado. | Crear nómina no depende de la existencia de otra nómina. |
| ADM-RES-07 | Hecho | P1 | Si falla el resumen se fabrica un estado bloqueado vacío. | Se confunde “fallo de lectura” con “nómina bloqueada”. | Mostrar error explícito con reintento. | Nunca se presenta una guardia inferida tras un error de red. |
| ADM-RSP-08 | Inferencia | P2 | Diez columnas + acciones múltiples compiten en ancho reducido. | Scroll horizontal o pérdida de contexto en laptop. | Definir columnas primarias y detalle expandible. | 1280 px conserva período, empresa, estado, acción y siguiente paso. |

### 6.3 Parámetros

| ID | Tipo | P | Evidencia | Impacto | Recomendación | Aceptación |
|---|---|---:|---|---|---|---|
| PAR-RET-01 | Inferencia | P1 | Se navega al mantenedor desde varias filas. | El usuario puede perder la nómina y el pendiente original. | Deep link con `returnTo`, sección y nómina. | Volver restaura paso, scroll y foco de la fila revisada. |
| PAR-COPY-02 | Hecho | P2 | Coexisten configuración guardada, base y parámetros oficiales en lógica heredada. | Conceptos cercanos pueden confundirse. | Glosario RRHH único en UI; detalle técnico en trazabilidad. | Ningún copy principal usa `snapshot`, `base` o IDs internos. |
| PAR-CTA-03 | Hecho | P0 | El shell puede decir “Guardar parámetros” mientras el paso maneja validación y decisiones adicionales. | El texto del CTA puede no representar la operación real. | Resolver CTA desde el estado operativo completo. | Etiqueta, acción y resultado coinciden en todos los estados. |

### 6.4 Dotación

| ID | Tipo | P | Evidencia | Impacto | Recomendación | Aceptación |
|---|---|---:|---|---|---|---|
| DOT-GRID-01 | Hecho | P1 | La grilla se construye manualmente con `div role=row`. | Duplica filtros, selección, responsive y accesibilidad. | Migrar a `app-data-grid`. | Columnas, teclado, filtros y empty states usan el componente compartido. |
| DOT-SEL-02 | Hecho | P0 | “Seleccionar todos” opera sobre `vista().filas`, es decir, la página visible. | Puede interpretarse como selección global. | Distinguir “esta página” y “todos los resultados”. | La UI indica alcance y el preview muestra total exacto. |
| DOT-SEG-03 | Hecho | P1 | La UI no muestra segmento ni permite mover seleccionado, aunque el dominio lo soporta. | Segmentación operativa queda incompleta. | Columna/filtro Segmento y acción masiva “Mover”. | Se puede revisar y modificar pertenencia sin salir de Dotación. |
| DOT-DET-04 | Hecho | P0 | El panel muestra “Trabajador {id}” y estados/tipos crudos. | Expone códigos técnicos a RRHH. | Mostrar nombre, RUT, contrato y etiquetas traducidas. | Ningún ID interno es protagonista del detalle. |
| DOT-MASS-05 | Hecho | P1 | Solo exclusión está expuesta; el modelo declara más acciones. | Flujo masivo parcial. | Incorporar mover segmento, agregar movimiento y marcar revisado. | Toda acción tiene preview, afectados, advertencias y resultado. |
| DOT-INC-06 | Inferencia | P1 | El preview bloquea exclusiones con críticas. | Podría impedir retirar justamente a un trabajador problemático. | Definir guardia por tipo de acción, no una regla universal. | Cada acción documenta por qué puede o no aplicarse. |
| DOT-PAG-07 | Hecho | P1 | Paginación solo anterior/siguiente; page size fijo. | Navegación lenta en dotaciones grandes. | Selector de tamaño y salto de página del DataGrid. | 1.000+ trabajadores se recorren sin llamadas o scroll excesivos. |

### 6.5 Movimientos

| ID | Tipo | P | Evidencia | Impacto | Recomendación | Aceptación |
|---|---|---:|---|---|---|---|
| MOV-CON-01 | Hecho | P0 | “Tipo” es input libre. | Errores de nomenclatura y cálculo por concepto incorrecto. | Buscar concepto desde catálogo autorizado. | Movimiento siempre referencia concepto válido o categoría excepcional explícita. |
| MOV-WRK-02 | Hecho | P1 | Buscar trabajador y elegir trabajador son controles separados. | Interacción duplicada y selección poco fluida. | Usar `app-search-select` remoto. | Nombre/RUT se buscan y seleccionan en un solo control con teclado. |
| MOV-ID-03 | Hecho | P0 | Listas muestran `Trabajador {trabajadorId}`. | Copy técnico y baja trazabilidad humana. | Resolver identidad resumida del trabajador. | Todas las filas muestran nombre + RUT; ID solo en detalle técnico. |
| MOV-TAB-04 | Hecho | P1 | Tabs separan recurrentes, manuales y omitidos, pero no existe vista consolidada. | Difícil responder qué impactará finalmente. | Tabla única con filtros de origen/estado. | Puede verse el universo final y filtrar recurrentes/manuales/omitidos. |
| MOV-EDIT-05 | Hecho | P1 | Se puede agregar, omitir y reaplicar, no editar/anular con motivo. | Correcciones obligan a recrear o dejan baja trazabilidad. | Edición controlada y anulación auditable. | Cambiar monto/glosa invalida cálculo y conserva historial. |
| MOV-IMP-06 | Propuesta | P2 | No hay importación masiva visible. | Alta carga manual en bonos/horas/descuentos. | Importación con plantilla, preview y rechazo por fila. | Archivo no modifica datos hasta confirmar preview. |
| MOV-REC-07 | Hecho | P1 | “Aplicar recurrentes” no anticipa cuántos serán creados/omitidos. | Acción masiva opaca. | Preview de aplicación idempotente. | Se muestran nuevos, existentes, omitidos y monto estimado. |

### 6.6 Cálculo

| ID | Tipo | P | Evidencia | Impacto | Recomendación | Aceptación |
|---|---|---:|---|---|---|---|
| CAL-VER-01 | Hecho | P1 | La UI dice “snapshot”, pero no muestra versión, fecha ni autor. | No se identifica qué cálculo se revisa. | Mostrar “Cálculo N”, vigencia, ejecutor y hora. | El usuario puede citar inequívocamente la versión. |
| CAL-CMP-02 | Propuesta | P1 | Solo se muestran totales y top 5 líquidos. | No se detectan variaciones anómalas. | Comparación con cálculo anterior y período anterior. | Variaciones configurables tienen acceso al trabajador afectado. |
| CAL-PRG-03 | Inferencia | P1 | El botón cambia a “Calculando…”, sin fases ni duración estimada. | En dotaciones grandes parece bloqueado. | Progreso por etapas o polling de ejecución. | Operación larga informa estado y permite reintento seguro. |
| CAL-TOP-04 | Hecho | P2 | “Top 5 líquidos” domina el resultado. | No necesariamente representa riesgo de nómina. | Priorizar bloqueos, variaciones y totales; top como detalle. | La primera vista responde qué cambió y qué requiere revisión. |
| CAL-INV-05 | Hecho | P0 | Mutaciones invalidan cálculo, pero la UI no siempre explica el alcance. | Usuario puede creer que una versión sigue vigente. | Banda persistente de cálculo invalidado con causa. | Al cambiar datos, todos los pasos posteriores muestran estado no vigente. |

### 6.7 Validación

| ID | Tipo | P | Evidencia | Impacto | Recomendación | Aceptación |
|---|---|---:|---|---|---|---|
| VAL-LST-01 | Hecho | P1 | Incidencias se muestran en lista plana. | Revisión lenta y repetitiva. | Agrupar por causa, trabajador y segmento. | El usuario puede resolver lotes homogéneos sin revisar uno a uno. |
| VAL-STA-02 | Hecho | P0 | No hay estado visible “resuelta/justificada/aceptada”. | Aprobar puede ser solo ausencia de bloqueos, no evidencia de revisión. | Workflow mínimo de resolución. | Cada crítica cerrada conserva resolución, usuario y fecha. |
| VAL-APP-03 | Hecho | P0 | “Aprobar para cierre” ejecuta validación/aprobación sin resumen final de firmante. | Decisión administrativa poco explícita. | `app-message-box` con versión, totales, advertencias y responsable. | La aprobación exige confirmación y produce evento visible. |
| VAL-NAV-04 | Hecho | P1 | “Ver en dotación” navega al paso, pero no se observa contrato de foco/filtro. | El usuario puede perder la incidencia. | Deep link interno a trabajador e incidencia. | Dotación abre filtrada y enfoca el registro exacto. |
| VAL-OWN-05 | Propuesta | P2 | No se muestra asignación o responsable. | Difícil coordinar equipos. | Responsable opcional y estado de revisión. | La bandeja permite saber quién atiende cada excepción. |

### 6.8 Cierre y liquidaciones

| ID | Tipo | P | Evidencia | Impacto | Recomendación | Aceptación |
|---|---|---:|---|---|---|---|
| CIE-ENUM-01 | Hecho | P0 | Chip muestra `n.estado` directamente. | Enum técnico visible (`dotacion_generada`, etc.). | Usar presenter de estado RRHH. | Ningún enum crudo aparece en Cierre. |
| CIE-ACT-02 | Hecho | P1 | Checklist no muestra autor/fecha por evidencia. | Acta incompleta para auditoría humana. | Añadir cálculo, validación, aprobación y cierre con responsables. | Cada hito muestra quién, cuándo y versión. |
| CIE-LIQ-03 | Hecho | P1 | El título menciona liquidaciones, pero el paso no muestra estado ni acción posterior. | Promesa visual incompleta. | Mostrar salida “Generar/Ver liquidaciones” tras cerrar. | Nómina cerrada ofrece una siguiente acción inequívoca. |
| CIE-REO-04 | Hecho | P0 | Reapertura pide motivo, pero no muestra consecuencias. | Puede invalidar trabajo posterior sin conciencia del impacto. | MessageBox de reapertura con cálculo y liquidaciones afectadas. | Confirmación lista explícitamente qué pierde vigencia. |
| CIE-MOT-05 | Hecho | P2 | Motivo de cierre es opcional y usa placeholder largo. | Criterio inconsistente con reapertura/anulación. | Definir política: motivo sugerido o requerido según riesgo. | Regla documentada y validación coherente en dominio/UI. |

### 6.9 Arquitectura visual y técnica

| ID | Tipo | P | Evidencia | Impacto | Recomendación | Aceptación |
|---|---|---:|---|---|---|---|
| ARC-CSS-01 | Hecho | P2 | `nomina-mensual-v2-container.css` tiene 3.394 líneas y 65.986 bytes. | Colisiones, overrides y alto costo de cambio. | Extraer solo estilos activos por shell/paso y borrar bloques sin uso. | El contenedor conserva solo layout transversal; cada paso posee su CSS. |
| ARC-TOK-02 | Hecho | P2 | `nomina-mensual-v2-visual-system.css` define 577 líneas y tokens `--nomina-*`. | Sistema paralelo a `--pf-*` y Bitácora. | Mapear a tokens oficiales y retirar duplicados. | Ningún token nuevo replica color/espacio ya provisto por el frame. |
| ARC-FRM-03 | Hecho | P1 | Templates activos no renderizan directamente `app-page-frame`. | Incumplimiento de guardrail vigente. | Envolver Admin y Generador en el frame compartido. | Ambos usan slots summary/toolbar/body sin padding duplicado. |
| ARC-OLD-04 | Hecho | P3 | El contenedor importa Alcance y Empleados y conserva `viewChild`/handlers. | Código muerto o semiactivo dentro del flujo definitivo. | Retirar imports, handlers y overlays tras pruebas de equivalencia. | Build y E2E no referencian pasos eliminados. |
| ARC-MOCK-05 | Hecho | P2 | `payrollSteps` se importa desde `nomina-mensual-v2.mock.ts`. | Una constante productiva depende de archivo denominado mock. | Mover definición a modelo/config productiva. | Runtime no importa archivos `*.mock.ts`. |
| ARC-SES-06 | Inferencia | P2 | Sesión por período y `NominaPeriodo` conviven como fuentes de navegación. | Rehidratación puede restaurar un paso no válido para la nómina. | Hacer `nominaPeriodoId` fuente principal; sesión solo preferencia local. | Recarga siempre deriva etapa posible desde la nómina persistida. |
| ARC-OVR-07 | Hecho | P3 | Overlays incluyen pendientes de Empleados y advertencias de Alcance. | Superficies obsoletas mantienen dependencias. | Inventariar uso real y retirar por lote. | El agregador contiene solo decisiones de los seis pasos vigentes. |
| ARC-TRZ-08 | Hecho | P2 | Existen modal y drawer de trazabilidad simultáneos. | Dos patrones para la misma información. | Drawer para bitácora breve; modal solo detalle técnico exportable, o unificar. | Cada contenido tiene una única ubicación primaria. |

### 6.10 Accesibilidad, responsive y calidad

| ID | Tipo | P | Evidencia | Impacto | Recomendación | Aceptación |
|---|---|---:|---|---|---|---|
| QA-FOC-01 | Inferencia | P0 | Varios modales locales no muestran gestión de foco ni retorno al disparador. | Teclado/lector puede quedar fuera del diálogo. | Usar `app-message-box` o focus trap compartido. | Foco entra, queda contenido y vuelve al origen. |
| QA-TAB-02 | Hecho | P1 | Tabs de Movimientos tienen roles, pero no `aria-controls`/paneles asociados. | Navegación de lector incompleta. | Implementar patrón tabs completo. | Flechas, Home/End y relación tab-panel pasan prueba. |
| QA-GRID-03 | Hecho | P1 | Dotación emula grid con `div`, sin semántica completa de tabla/grid. | Lectura y navegación inconsistentes. | Adoptar `app-data-grid`. | Auditoría axe no reporta estructura de tabla/grid inválida. |
| QA-RSP-04 | Inferencia | P1 | Stepper de seis columnas y tablas densas requieren validación real en 1280/1024/768. | Cortes, scroll y CTA fuera de viewport. | Matriz responsive y screenshots. | Estado y CTA son visibles sin scroll horizontal de página. |
| QA-1K-05 | Propuesta | P1 | No hay prueba automatizada de 1.000+ trabajadores. | Riesgo de latencia y selección incorrecta. | Fixture SQL/E2E con paginación y filtros. | Búsqueda, filtros y preview masivo usan totales del servidor. |
| QA-CMP-06 | Hecho | P1 | Cinco pasos productivos no tienen spec de componente dedicado. | Regresiones visuales y de acción no quedan localizadas. | Specs por paso y contratos de avance. | Cada paso cubre carga, error, bloqueo, éxito y avance. |
| QA-E2E-07 | Hecho | P1 | E2E actual cubre bandeja y apertura del generador. | No verifica ciclo completo. | E2E crear → cerrar → reabrir con datos controlados. | Flujo completo verde y cálculo invalidado tras cambio. |

---

## 7. Diseño objetivo

### 7.1 Administrador

```text
Shell
Remuneraciones / Administrador de nóminas
Título + subtítulo                              [Nueva nómina]

Franja operativa
[Requieren acción 7] [Con críticas 2] [Pendientes de cierre 1] [Todas 18]

DataGrid
Siguiente acción | Período | Empresa | Tipo | Estado | Incidencias | Actividad | Acción
Resolver críticas  2026-06   Empresa A Mensual  En revisión  3 críticas  Hace 2 h [Continuar] [⋯]
Cerrar nómina       2026-06   Empresa B Mensual  Aprobada     Sin bloqueos Hace 1 d [Cerrar]    [⋯]

Menú ⋯
Ver resumen
Ver auditoría
Liquidaciones
Reabrir / Anular / Eliminar, según estado
```

Reglas:

- “Continuar”, “Cerrar” o “Ver liquidaciones” es el CTA contextual.
- Las acciones destructivas nunca aparecen como texto repetido en la fila.
- La franja rápida y los filtros del DataGrid tienen definiciones distintas.
- Actividad muestra antigüedad y responsable, no solo una fecha.

### 7.2 Generador

```text
Shell
Remuneraciones / Nóminas / Empresa A · Junio 2026
Nómina mensual · En revisión · Cálculo 3 no vigente      [Acción del paso]

Stepper compacto
1 Parámetros ✓  2 Dotación !  3 Movimientos •  4 Cálculo —  5 Validación —  6 Cierre —

Banda contextual
Qué falta + impacto + acceso directo a resolverlo

Superficie principal del paso
Contenido operativo, sin repetir título/subtítulo del shell

Pie
[Volver] [acción secundaria]
```

Reglas:

- El shell muestra contexto fijo de la nómina.
- El CTA superior ejecuta la operación real del paso.
- El stepper usa `completo`, `actual`, `requiere revisión`, `bloqueado` y
  `pendiente` derivados de persistencia.
- No se repiten título, eyebrow, descripción y CTA dentro de cada paso.

### 7.3 Dotación

```text
Franja: 1.248 trabajadores · 23 requieren revisión · 4 bloqueados

DataGrid con filtros remotos
[Buscar] [Estado] [Segmento] [Incidencias] [Movimientos]

[ ] Nombre y RUT | Segmento | Contrato | Estado | Incidencias | Movimientos | [Detalle]

Selección
25 seleccionados en esta página
[Seleccionar los 186 resultados filtrados]
[Mover segmento] [Agregar movimiento] [Marcar revisado] [Excluir]

Drawer detalle
Identidad + contrato + segmento + incidencias + movimientos + trazabilidad
```

### 7.4 Movimientos

```text
Resumen: 312 aplicados · 14 manuales · 8 omitidos · $18.450.000 impacto

Tabla única
[Origen] [Estado] [Concepto] [Trabajador] [Segmento] [Buscar]

Trabajador | Concepto | Origen | Monto | Estado | Última acción | [⋯]

Acciones
[Aplicar recurrentes] [Agregar movimiento] [Importar]
```

### 7.5 Cálculo y validación

```text
Cálculo 4 · vigente · realizado por Ana Pérez a las 11:42

Variación vs cálculo 3
Haberes +1,8 % | Descuentos +0,3 % | Líquido +1,5 % | 18 trabajadores con cambio alto

Requiere atención
4 bloqueos | 12 advertencias | 7 variaciones fuera de rango

[Ver excepciones]                                      [Recalcular / Validar]
```

### 7.6 Cierre

```text
Acta de cierre
Nómina mensual · Empresa A · Junio 2026 · Cálculo 4

✓ Parámetros confirmados        Ana Pérez · 05/06 09:18
✓ Dotación confirmada           Juan Soto · 05/06 10:02
✓ Cálculo vigente               Ana Pérez · 05/06 11:42
✓ Validación aprobada           María Díaz · 05/06 12:15
✓ Sin bloqueos críticos

Resultado: 1.248 trabajadores · líquido $1.245.000.000

[Volver a validación]                              [Cerrar nómina]
```

Tras cerrar:

```text
Nómina cerrada · Cálculo 4
[Generar liquidaciones] [Ver auditoría] [Reabrir con motivo]
```

---

## 8. Roadmap P0-P3

### P0 — Coherencia operativa y seguridad

#### Objetivo

Eliminar ambigüedades que pueden producir una acción incorrecta o una falsa
percepción de avance.

#### Alcance

- Unificar CTA por paso.
- Derivar stepper de estado persistido.
- Traducir IDs, enums y términos técnicos.
- Migrar acciones destructivas/reapertura/aprobación a `app-message-box`.
- Añadir estado de error recuperable al cargar una nómina.
- Mostrar contexto fijo: empresa, período, tipo, estado y cálculo.
- Explicar invalidación y consecuencias de reapertura.

#### Contratos afectados

- View model de navegación de pasos:
  `estadoVisual`, `accionPrincipal`, `puedeEjecutar`, `motivoBloqueo`.
- Resumen de nómina:
  contexto humano y evidencia de cálculo.
- Comandos de avance por paso con resultado de éxito/error.

#### Pruebas

- Unitarias de estado visual del stepper.
- Componentes: CTA único y bloqueo.
- Accesibilidad de MessageBox y foco.
- E2E: fallo de carga, cálculo invalidado y reapertura.

#### Dependencias

- Máquina de estados y evidencia de cálculo ya implementadas.
- Presenter común de estados RRHH.

#### Condición de salida

No existe ningún camino en que navegar visualmente implique completar una
etapa sin persistencia, ni dos CTA primarios ejecuten la misma intención.

---

### P1 — Operación por excepción y escalabilidad

#### Objetivo

Permitir trabajar nóminas grandes sin revisar trabajador por trabajador.

#### Alcance

- Menú de acciones por fila en Administrador.
- Definiciones exclusivas de KPIs/filtros.
- Catálogo real de empresas en creación.
- `app-data-grid` en Dotación.
- Selección explícita página/universo filtrado.
- Segmentos y cuatro acciones masivas con preview.
- `app-search-select` remoto para trabajador.
- Concepto de remuneración desde catálogo.
- Tabla consolidada de movimientos.
- Preview de recurrentes.
- Validación agrupada por excepción.
- Deep links internos con filtro y foco.

#### Contratos afectados

- Consulta remota de Dotación con orden y selección por filtro.
- Preview masivo capaz de representar IDs explícitos o criterio filtrado.
- Resumen de trabajador para movimientos.
- Consulta consolidada de movimientos con identidad humana.
- Estado de resolución de incidencias.

#### Pruebas

- Integración con 1.000+ trabajadores.
- Selección entre páginas y preview exacto.
- Idempotencia de recurrentes.
- Edición/anulación e invalidación de cálculo.
- Navegación Validación → Dotación con foco.

#### Dependencias

- Definir semántica de selección global.
- Catálogo de conceptos y empresas autorizado.
- Política de resolución/aceptación de incidencias.

#### Condición de salida

Un analista puede identificar y resolver excepciones de una nómina de 1.000+
trabajadores sin cargar todo el universo ni perder el contexto del filtro.

---

### P2 — Consolidación visual NOIA y mantenibilidad

#### Objetivo

Reducir duplicación visual y convertir el Generador en un flujo coherente con
el sistema de diseño vigente.

#### Alcance

- Integrar `app-page-frame` en Administrador y Generador.
- Retirar títulos/eyebrows/subtítulos duplicados dentro de los pasos.
- Consumir `--pf-*`, `--bitacora-*` y tokens ERP.
- Retirar tokens `--nomina-*` equivalentes.
- Dividir CSS transversal y CSS por paso.
- Eliminar reglas muertas con búsqueda de uso verificable.
- Normalizar estados, badges, alerts, tabs, tablas y drawers.
- Resolver una única jerarquía para trazabilidad.
- Validar responsive 1440/1280/1024/768.

#### Contratos afectados

- Ningún contrato de negocio.
- API de slots del frame.
- Presenters visuales compartidos.
- Convenciones locales de CSS y tokens.

#### Pruebas

- Specs de estructura del frame.
- Screenshots por paso y viewport.
- Axe/accessibility smoke.
- Build productivo con comparación de budgets.

#### Dependencias

- P0 cerrado para no estilizar interacciones ambiguas.
- Inventario de selectores activos antes de borrar CSS.

#### Condición de salida

El contenedor conserva solo reglas de shell; cada paso es autocontenido, no
duplica identidad de página y no define una paleta paralela.

---

### P3 — Consolidación arquitectónica y retiro V1/V2 antiguo

#### Objetivo

Eliminar compatibilidad heredada cuando el flujo nuevo tenga equivalencia
funcional y evidencia productiva.

#### Alcance

- Mover `payrollSteps` fuera de `*.mock.ts`.
- Retirar componentes Alcance y Empleados del contenedor activo.
- Retirar handlers, `viewChild` y overlays asociados.
- Hacer `nominaPeriodoId` fuente principal de rehidratación.
- Reducir dependencia del orquestador/sesión V2 anterior.
- Unificar trazabilidad.
- Completar E2E crear → cerrar → liquidaciones → reabrir.
- Preparar redirect y retiro controlado de `/proceso-mensual`.

#### Contratos afectados

- Configuración productiva del stepper.
- Rehidratación de etapa por estado/evidencia.
- Compatibilidad de rutas y retornos.
- Adapter del motor V1 mientras F6 no sea reemplazado.

#### Pruebas

- No existen imports runtime desde mocks.
- Cobertura de los seis pasos.
- E2E completo con cálculo vigente e invalidación.
- Comparación funcional V1/V2 sobre fixture controlado.
- Smoke de rutas antiguas y redirecciones.

#### Dependencias

- P0-P2 cerrados.
- Migración de ciclo consistente aplicada y verificada.
- Flujo nuevo estable en entorno productivo.
- Decisión explícita de retiro de V1.

#### Condición de salida

El Generador no depende de componentes visuales antiguos ni de mocks en
runtime; V1 puede retirarse sin perder cálculo, trazabilidad o liquidaciones.

---

## 9. Dependencias y riesgos transversales

| Riesgo | Mitigación |
|---|---|
| Cambiar UX antes de aplicar la migración preparada | Gate de entorno y feature readiness visible. |
| Retirar V1 demasiado pronto | Mantener adapter y comparación E2E hasta equivalencia. |
| Borrar CSS todavía usado por overlays | Inventario selector → template/TS antes de cada lote. |
| Selección masiva inconsistente | Contrato servidor para criterio filtrado + preview inmutable. |
| Catálogo de conceptos incompleto | No cerrar input libre sin estrategia de conceptos excepcionales. |
| Reapertura con liquidaciones emitidas | Definir impacto, invalidación y política documental antes de habilitar. |
| Doble fuente de etapa | Estado persistido manda; sesión local solo recuerda preferencia compatible. |
| Auditoría insuficiente | Evento por cada transición y mutación que invalida cálculo. |

---

## 10. Estrategia de retiro de V1

El retiro no debe realizarse por eliminación directa. Se propone:

1. **Coexistencia controlada:** V1 sigue disponible y el Generador usa el
   adapter actual.
2. **Paridad medible:** ejecutar ambos recorridos con fixtures conocidos y
   comparar totales, incidencias y liquidaciones.
3. **Entrada única:** el menú dirige al Administrador; V1 queda solo como
   compatibilidad operativa.
4. **Ventana de observación:** registrar uso, fallos y reaperturas del flujo
   nuevo durante períodos reales.
5. **Gate de retiro:** E2E completo verde, migraciones aplicadas, cálculo
   trazable y liquidaciones generadas desde nómina cerrada.
6. **Redirect y limpieza:** redirigir V1, retirar UI antigua y luego eliminar
   dependencias no utilizadas en lotes verificables.

No se propone reescribir el motor durante el rediseño. El adapter sigue siendo
la frontera hasta que exista una fase funcional específica para reemplazarlo.

---

## 11. Plan de pruebas objetivo

### Unitarias

- Todas las transiciones válidas e inválidas.
- Estado visual de cada paso.
- CTA, motivo de bloqueo y siguiente acción.
- Definiciones exclusivas de KPIs.
- Presenters de copy RRHH.
- Invalidación por movimiento, dotación y parámetros.

### Componentes

Para cada paso:

- carga;
- error y reintento;
- vacío;
- bloqueado;
- listo;
- acción principal;
- retroceso;
- cambio que invalida cálculo;
- teclado y foco.

### Integración

```text
crear
→ verificar parámetros
→ confirmar dotación
→ aplicar movimientos
→ calcular
→ resolver incidencias
→ validar/aprobar
→ cerrar
→ generar/ver liquidaciones
→ reabrir
→ comprobar cálculo no vigente
```

### Escalabilidad

- 1.000, 5.000 y 10.000 trabajadores.
- búsqueda remota con debounce;
- filtros combinados;
- selección por página y universo;
- preview masivo;
- cálculo largo;
- lista de incidencias agrupada.

### Accesibilidad

- navegación completa con teclado;
- foco inicial, trap y retorno en modales;
- tabs con relación tab/panel;
- `aria-live` para carga y resultados;
- contraste;
- nombres accesibles;
- zoom 200 %;
- axe smoke sin violaciones críticas.

### Responsive

| Viewport | Validación |
|---|---|
| 1440 | Densidad completa sin ancho desperdiciado. |
| 1280 | Columnas prioritarias y CTA visibles. |
| 1024 | Stepper compacto y acciones sin solaparse. |
| 768 | Lectura vertical, sin scroll horizontal de página. |

---

## 12. Criterios finales de aceptación

| Dimensión | Criterio |
|---|---|
| Funcional | Cada transición usa evidencia persistida y guardias de estado. |
| Operativa | El usuario identifica qué falta y qué hacer en menos de 10 segundos. |
| Administrador | Las nóminas prioritarias aparecen primero y tienen un CTA contextual. |
| Generador | Existe un solo CTA primario de avance por paso. |
| Dotación | Paginación, filtros y selección masiva funcionan sobre datos remotos. |
| Movimientos | No se crean tipos libres sin concepto o excepción explícita. |
| Cálculo | Se muestra versión, vigencia, autor, fecha y variaciones relevantes. |
| Validación | Cada crítica conserva resolución, usuario y fecha. |
| Cierre | El acta muestra cálculo, validación, aprobación y responsable. |
| Liquidaciones | Solo se originan desde versión cerrada y trazable. |
| Accesibilidad | Teclado, foco, tabs y modales cumplen el patrón compartido. |
| Visual | Admin y Generador usan frame/tokens NOIA sin identidad duplicada. |
| Arquitectura | Runtime no importa mocks ni componentes de pasos retirados. |
| Calidad | Seis pasos con specs y E2E del ciclo completo verde. |
| Escala | Casos de 1.000+ trabajadores mantienen totales y selección correctos. |

---

## 13. Fuentes contrastadas

### Documentación

- [`../../../AGENTS.md`](../../../AGENTS.md)
- [`../../../contexto-rapido.md`](../../../contexto-rapido.md)
- [`../../../diseno/noia-ui-manual.md`](../../../diseno/noia-ui-manual.md)
- [`../../../diseno/noia-ui-guardrails.md`](../../../diseno/noia-ui-guardrails.md)
- [`../../../diseno/noia-antipatrones-ia.md`](../../../diseno/noia-antipatrones-ia.md)
- [`../../../diseno/noia-bases-sistema-referencia.md`](../../../diseno/noia-bases-sistema-referencia.md)
- [`../../../diseno/noia-ui-review-checklist.md`](../../../diseno/noia-ui-review-checklist.md)
- [`../arquitectura-administrador-generador.md`](../arquitectura-administrador-generador.md)
- [`./auditoria-nomina-v2-2026-06.md`](./auditoria-nomina-v2-2026-06.md)

### Código

- `src/app/app.routes.ts`
- `src/app/features/nomina-mensual/containers/administrador-nominas-container/`
- `src/app/features/nomina-mensual/presenters/admin-nominas.presenter.ts`
- `src/app/features/nomina-mensual/rules/admin-nominas.rules.ts`
- `src/app/features/nomina-mensual/services/nomina-periodo.service.ts`
- `src/app/features/nomina-mensual-v2/containers/nomina-mensual-v2-container/`
- `src/app/features/nomina-mensual-v2/data/nomina-mensual-v2.mock.ts`
- `src/app/shared/components/ui/page-frame/`
- `src/app/shared/components/ui/data-grid/`
- `src/app/shared/components/ui/feedback/message-box/`

---

## 14. Declaración de alcance

Esta fase solo crea documentación.

No se aplicaron:

- cambios de UI;
- cambios de rutas;
- cambios de servicios;
- cambios de modelos o presenters;
- cambios de motor;
- cambios de SQL, RPC o RLS;
- migraciones;
- cambios de persistencia;
- limpieza de componentes o CSS.

Las recomendaciones P0-P3 deben ejecutarse como fases separadas, con pruebas y
registro en `docs/codex/peticiones-estilos.md` cuando impliquen UI visible.

---

## 15. Estado de ejecución (post-publicación)

Actualización: 2026-06-05.

Esta sección consolida qué decisiones se aplicaron desde la publicación de la auditoría y qué hallazgos siguen pendientes. No reescribe el diagnóstico previo; solo lo complementa con la realidad actual del repo. Si una decisión se apartó del roadmap propuesto, queda anotada explícitamente.

### Tabla A — Decisiones ya tomadas o parcialmente cubiertas

| Frente | Estado | Detalle |
|--------|--------|---------|
| F3 Fusion + migración ciclo consistente | Aplicado | `nomina_periodo` guarda snapshot V1 vigente, versión y fechas; `transicionar_nomina_periodo` valida transiciones; cambiar dotación o movimientos invalida cálculo (sustento dominio para CAL-INV-05). Ver §3.4 de esta auditoría y [`../arquitectura-administrador-generador.md`](../arquitectura-administrador-generador.md). |
| Shell residual al navegar | Aplicado | `ShellPageContextService` rediseñado con tokens de ownership; `LayoutShellComponent` coordina `NavigationStart`/`NavigationEnd`; helper `bindShellPageContext`. Cubre la dimensión "shell muestra otra pantalla" detrás de AG-CTX-04 sin resolverla por completo. |
| Filtro de mes con nómina cargada | Aplicado | Container del Generador V2 redirige al generador del periodo nuevo si existe nómina; vuelve al Administrador si no. Resuelve la inconsistencia entre `PeriodoActivoService` y la nómina fijada por URL. |
| Rediseño visual Admin + Generador (full-bleed) | Aplicado **con decisión opuesta a ARC-FRM-03** | El usuario optó por full-bleed sin envolver en `app-page-frame`. Ver "Discrepancia con ARC-FRM-03" abajo. |
| L0–L7 del audit V2 (pasos 1–3) | Aplicado | Documentado en [`auditoria-nomina-v2-2026-06.md`](./auditoria-nomina-v2-2026-06.md). Atiende parcialmente PAR-COPY-02 (sin `snapshot`/`base`/IDs internos como protagonistas) en el alcance V2 actual. |
| Limpieza CSS V2 (L5/L5.2) | Aplicado | `container.css` pasó de 7.676 a 3.414 líneas. Atiende parcialmente ARC-CSS-01 en el contenedor V2. Deuda L5.3 sigue abierta y opcional. |
| Sub-lote P0 acotado (ADM-MOD-05, CIE-ENUM-01, DOT-DET-04, MOV-ID-03, CAL-INV-05, QA-FOC-01) | Aplicado (2026-06-05) | Diálogos locales del Administrador migrados a `app-message-box`; chip de Cierre consume `estadoNominaToLabel`; panel de detalle de Dotación y listas de Movimientos muestran nombre + RUT con fallback; banda persistente de cálculo no vigente en Cálculo, Validación y Cierre derivada de `evidenciaCalculo.calculoVigente`; reapertura del paso Cierre migrada a `app-message-box` con consecuencias explícitas (cubre incidentalmente parte de CIE-REO-04) y aside de Dotación con Escape + retorno de foco. Entrada de bitácora en [`docs/codex/peticiones-estilos.md`](../../../peticiones-estilos.md) (2026-06-05). Sin cambios en motor, dominio ni SQL. |
| Lote estructural P0 (AG-NAV-03, AG-CTA-01, AG-NAV-02) | Aplicado (2026-06-05) | Cada paso 2–6 implementa el puerto `PasoNominaPort` con `avanzar(): Promise<ResultadoAvancePaso>`. El container delega el CTA del shell vía función pura `ejecutarAvancePaso` del facade; `closure` no navega tras `ok:true` (es terminal); `ok:false` publica `ayudaAvance`. Modo **híbrido acotado**: terminal en Dotación/Validación/Cierre, navegacional en Movimientos/Cálculo (mantienen botones operativos inline `Aplicar recurrentes`, `Calcular nómina`, `Agregar manual`). Labels CTA actualizados: `Aplicar movimientos`→`Continuar al cálculo`, `Procesar cálculo`→`Continuar a validación`. Footer de los 5 pasos pierde `is-primary` duplicado; en Cierre se sustituye por hint que indica que el cierre se dispara desde el shell. Stepper recibe `[nomina]`; `obtenerEstadoPaso(stepId, pasoActual, nomina)` deriva de `nomina.estado` + `evidenciaCalculo.calculoVigente` con caveats `reabierta` (closure→pending) y `anulada` (todos→pending). Tests: 22 nuevos en facade (matriz por estado + delegación pura) + 16 nuevos por paso. Entrada de bitácora en [`docs/codex/peticiones-estilos.md`](../../../peticiones-estilos.md) (2026-06-05). |

#### Discrepancia con ARC-FRM-03

La auditoría recomienda envolver Admin y Generador en `app-page-frame` y consumir tokens `--pf-*` (sección 6.9). En sesiones posteriores el usuario priorizó un layout full-bleed (sin frame compartido) para que la tabla del Administrador y los pasos del Generador ocuparan todo el espacio disponible. El path de regreso no se descarta: si una fase futura prioriza homogeneidad con el resto del ERP, ARC-FRM-03 se reactiva como tarea formal. Hasta entonces, el módulo conserva tokens `--nomina-*` y composición propia.

### Tabla B — Pendientes priorizados para el siguiente lote

#### P0 críticos (6 hallazgos restantes)

> Los ítems ADM-MOD-05, CIE-ENUM-01, DOT-DET-04, MOV-ID-03, CAL-INV-05 y QA-FOC-01 pasaron a la Tabla A el 2026-06-05 (sub-lote P0 ejecutado). AG-CTA-01, AG-NAV-02 y AG-NAV-03 pasaron a la Tabla A el 2026-06-05 (lote estructural ejecutado, ver entrada en bitácora). De CIE-REO-04 se cubrió incidentalmente la advertencia visual; queda pendiente la persistencia explícita (invalidación de liquidaciones).

| ID | Descripción corta | Origen |
|----|-------------------|--------|
| PAR-CTA-03 | CTA del shell puede no representar la operación real del paso Parámetros. Resolver desde estado operativo completo. | §6.3 |
| DOT-SEL-02 | "Seleccionar todos" actúa sobre la página visible. Distinguir página vs. universo filtrado. | §6.4 |
| MOV-CON-01 | Tipo de movimiento como input libre. Búsqueda de concepto desde catálogo autorizado. | §6.5 |
| VAL-STA-02 | Sin estado de resolución (resuelta/justificada/aceptada) por incidencia. Workflow mínimo. | §6.7 |
| VAL-APP-03 | Aprobar sin resumen final del firmante. `app-message-box` con versión, totales, advertencias y responsable. | §6.7 |
| CIE-REO-04 | Reapertura: queda persistir el alcance explícito (impacto sobre liquidaciones generadas). La advertencia visible se entregó como colateral de QA-FOC-01 / Fase 5 del sub-lote 2026-06-05. | §6.8 |

#### Bloques siguientes (no detallados aquí)

- **P1** (escalabilidad y operación por excepción): `app-data-grid` en Dotación, segmentos, acciones masivas con preview, `app-search-select` remoto en Movimientos, comparación de cálculos, validación agrupada, deep links Validación → Dotación. Ver §6.4–§6.8 y §7.3–§7.5.
- **P2** (consolidación visual NOIA): ARC-CSS-01 + ARC-TOK-02 (consolidación de tokens y CSS por paso), normalización de tabs/alerts/drawers, unificación de trazabilidad. Reabrir ARC-FRM-03 solo si se decide volver al frame común.
- **P3** (retiro V1/V2 antiguo): mover `payrollSteps` fuera de `*.mock.ts`, retirar Alcance/Empleados/overlays del contenedor activo, hacer `nominaPeriodoId` la única fuente de rehidratación, preparar redirect controlado de `/proceso-mensual`.

### Próximo paso recomendado

Cerrado el lote estructural (AG-NAV-03 + AG-CTA-01 + AG-NAV-02, 2026-06-05), el contrato shell ↔ paso está reorganizado. Los próximos P0 son **acotados, sin interdependencia entre sí** y se pueden ejecutar en cualquier orden:

1. **PAR-CTA-03** — alinear el CTA del shell en el paso Parámetros con el estado operativo completo (incluir variantes Guardar/Validar/Continuar según `EstadoBaseParametrosPeriodoView` + diferencias detectadas). Por su impacto en el primer paso del flujo y por compartir naturaleza con el contrato AG-NAV-03 recién aplicado, es el candidato natural a iniciar.
2. **DOT-SEL-02** — distinguir "selección de la página" vs. "selección del universo filtrado" en Dotación. Toca presenter + componente; requiere un selector tipo `app-message-box` con confirmación de alcance.
3. **VAL-APP-03** — abrir un `app-message-box` con versión del cálculo, totales, advertencias y responsable antes de aprobar la validación. Hereda directamente la infraestructura del lote estructural recién cerrado.

Otros candidatos restantes (`MOV-CON-01`, `VAL-STA-02`, `CIE-REO-04` persistencia) implican dominio o catálogos y conviene tratarlos como fases dedicadas con SQL/RPC propios.
