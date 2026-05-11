# Glosario y nomenclatura

## Objetivo

Centralizar en un solo lugar la terminología clave utilizada en el ERP de remuneraciones.  Este glosario sirve como referencia para equipos de negocio, desarrollo y QA, evitando ambigüedades y manteniendo un lenguaje común.  Cuando un término aparezca en los contratos de módulo o en la UI, su significado debe coincidir con la definición registrada aquí.

## Tipos de vigencia y periodo

| Término | Definición | Comentario |
|--------|------------|-----------|
| `PERIODO_MENSUAL` | Snapshot mensual cuya clave natural incluye `periodo` en formato `YYYY-MM`.  Se utiliza para tablas que registran valores oficiales para un mes específico (UF/UTM, tramos, topes, etc.). | Si una grilla muestra datos de tipo **PERIODO_MENSUAL** y no hay filas para el mes activo, el mensaje debe indicar “no hay datos cargados para {mes}”, ofreciendo acción de carga. |
| `ANUAL` | Conjunto normativo identificado por año completo.  No existe actualmente en v11 pero se reserva para tablas futuras cuya vigencia sea anual sin subdivisiones por mes. | Las UIs deben tratar estos catálogos por año, no por mes. |
| `VIGENCIA` | Conjuntos de datos versionados por `vigencia_inicio` y `vigencia_fin`.  Una fila aplica a todo período que intersecte su rango de vigencia. | La UI debe mostrar hint “vigentes al periodo activo” y filtrar por solape con el mes actual.  El periodo activo es solo contexto para resaltar la vigencia aplicable. |
| `CATALOGO_GLOBAL` | Catálogo maestro sin dependencia real del mes.  Puede incluir `periodo` nulo o marcas por mes solo por trazabilidad. | La pantalla no debe culpar al mes activo si el catálogo está vacío; el mensaje debe decir “catálogo general” o “sin registros en catálogo”. |
| `CONFIG_EMPRESA` | Configuraciones propias de la empresa (CCAF seleccionada, mutual, etc.) que se guardan en el snapshot mensual o en tablas `empresa_*` fuera de este módulo. | El mensaje en la UI debe indicar “configuración aplicable al periodo activo” cuando corresponda. |

## Estados del período de remuneración

`periodo_remuneracion.estado` es la fuente oficial para determinar el estado de un mes en Parametros y Nómina.  Los scripts Python y la UI deben respetar estos valores y no inventar estados extra en el cliente.

| Estado | Descripción |
|-------|-------------|
| `pendiente` | Se ha creado el registro del mes pero sin preparar datos base ni vigencias. |
| `parcial` | El periodo ha sido preparado con catálogos, vigencias y normativa base (modo preparar) pero aún no tiene la carga mensual oficial.  No habilita liquidación definitiva. |
| `cargado` | La carga mensual oficial está validada y renderizada para este período. |
| `corregido` | Existen modificaciones posteriores a la carga oficial (correcciones). |
| `cerrado` | El periodo está finalizado; la preparación parcial posterior no puede degradarlo. |
| `error` | Se registró una falla en el flujo de carga o validación. |

## Estados de empleados

Los empleados pasan por una combinación de estados operativos (`persona.estado`), estado de ficha (`persona.estado_ficha`), indicador de aptitud para remuneraciones (`persona.apto_para_remuneraciones`) y paso del wizard avanzado (`persona.paso_alta_avanzada`).  Estas señales determinan la acción principal en el listado y habilitan o bloquean el cálculo de nómina.

- **Estados operativos (`persona.estado`):** `BORRADOR`, `EN_PROCESO`, `ACTIVO`, `SUSPENDIDO`, `INACTIVO`, `DESVINCULADO`, `BLOQUEADO`.  Solo los activos pueden ser aptos para remuneraciones.  Los borradores son exclusivos del wizard avanzado.
- **Estado de ficha (`persona.estado_ficha`):** `BORRADOR`, `INCOMPLETO`, `VALIDO`.  Define el grado de completitud de la ficha.  Una ficha válida puede ser apta o no apta según la matriz de aptitud.
- **Apto para remuneraciones (`persona.apto_para_remuneraciones`):** booleano que indica si la persona puede participar en procesos de remuneraciones.  La validación explícita desde la ficha la activa; no se deriva automáticamente al completar la ficha.
- **Paso avanzado (`persona.paso_alta_avanzada`):** guarda el paso del wizard cuando se guarda un borrador del alta avanzada.  Si existe un valor distinto de `null`, la acción principal es “Continuar alta” y no se usa la ficha en modo básico.

## Otros términos

- **LRE (Libro de Remuneraciones Electrónico):** catálogo oficial de códigos LRE (`catalogo_lre`) en concepto de remuneración.  Un concepto puede vincularse opcionalmente a un código LRE.  Las reglas de obligatoriedad y desvinculación se documentan en el contrato funcional de Conceptos.
- **Concepto (Remuneraciones):** entrada del catálogo `concepto` que describe el tipo de haber, descuento o aporte.  Las asignaciones recurrentes (Haberes y descuentos) y los movimientos variables mensuales referencian `id_concepto`.  Los detalles sobre vigencia, asignabilidad, tipo, naturaleza e invariantes se encuentran en los contratos funcionales de Conceptos y Haberes.
- **Snapshot mensual:** copia de datos mensual oficial para un mes (`periodo`) que se utiliza para liquidaciones y reportes.  Incluye parámetros generales, tramos de impuesto, cargas, etc.  No debe mezclarse con vigencias o catálogos globales.
- **Gradualidad 8,5 %:** calendario de gradualidad de la cotización del empleador que aumenta progresivamente hasta 8,5 %.  Se trata como `SEED_NORMATIVO` + `CARGA_VIGENCIA`: los datos se versionan por `vigencia_inicio` / `vigencia_fin` y no por mes.  La UI muestra el tramo aplicable para el periodo activo (vigente, futuro o histórico).
- **APV (Ahorro Previsional Voluntario):** instituciones (`institucion_apv`) y formas de pago (`forma_pago_apv`) son catalogos globales; no dependen del mes activo.  Deben mostrarse completos en la UI aunque el periodo activo no tenga filas específicas.

Consulte también `criterios-globales.md` para más detalles sobre clasificación de datos y criterios transversales.

### Términos legales relacionados con remuneraciones

Para mantener consistencia con la normativa chilena resumida en `normativa-remuneraciones.md`, se agregan las siguientes definiciones:

- **Remuneración:** contraprestación en dinero y en especie avaluable en dinero que percibe el trabajador del empleador por causa del contrato de trabajo.  Se excluyen de la remuneración las asignaciones de locomoción, colación, desgaste de herramientas, viáticos, asignación familiar y subsidio único familiar, indemnizaciones por término de contrato y reembolsos de gastos.
- **Sueldo base:** estipendio fijo pagado en intervalos regulares (generalmente mensuales).  Debe ser igual o superior al **Ingreso Mínimo Mensual** vigente para el grupo de edad del trabajador.  El sueldo base se ajusta automáticamente cuando aumenta el IMM.
- **Ingreso Mínimo Mensual (IMM):** monto mínimo de remuneración imponible que debe pagar el empleador a un trabajador con jornada completa.  El valor se reajusta periódicamente por ley; existen montos diferenciados para trabajadores entre 18� y� 65� años, para menores de 18� y mayores de� 65� años y para fines no remuneracionales.
- **Gratificación legal:** mecanismo alternativo de reparto de utilidades establecido en el artículo� 50 del Código del Trabajo.  Permite pagar el 25� % de lo devengado por remuneraciones mensuales, con un tope de 4,75� IMM por trabajador, eximiendo al empleador de repartir utilidades según el artículo� 47.
- **Horas extraordinarias (sobresueldo):** tiempo de trabajo que excede la jornada ordinaria pactada.  Deben pagarse con un recargo mínimo del 50� % sobre la hora ordinaria.  La reducción de jornada a 40� horas semanales no disminuye la remuneración total; el valor de la hora se recalcula sobre la nueva jornada.
- **Reducción de jornada a 40� horas:** reforma legal (Ley� 21.561) que reduce la jornada ordinaria de 45� a� 40� horas semanales de manera gradual (44� h en 2024, 42� h en 2026, 40� h en 2028) y establece que la reducción no implica disminución de la remuneración.