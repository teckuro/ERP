# Diccionario de tablas canónicas

En el contexto del ERP de remuneraciones, las tablas de la base de datos son la fuente de verdad para los cálculos y validaciones. Este diccionario resume las tablas **canonizadas** que existen en la base de datos de la versión actual. Se incluyen campos clave, nombres que **no deben usarse** y el estado de confirmación. Este documento reemplaza cualquier referencia a tablas inventadas en versiones anteriores.

| Dominio | Tabla canónica | Campos clave | No usar | Estado |
|---|---|---|---|---|
| AFP catálogo | `afp` | `id_afp`, `nombre`, `rut` | `afp_parametro` | Confirmado |
| AFP vigencias (tasas) | `afp_vigencia` | `id_afp`, `vigencia_inicio`, `vigencia_fin`, `tasa_obligatoria`, `comision` | `afp_parametro` | Confirmado |
| Salud (Fonasa/Isapre) | `salud` | `id_salud`, `nombre` | `salud_vigencia` | Confirmado |
| Salud – planes | `salud_plan` | `id_salud_plan`, `id_salud`, `plan`, `valor`, `vigencia_inicio`, `vigencia_fin` | `salud_vigencia` | Confirmado |
| Seguro de Cesantía | `afc_parametro` | `tipo_contrato`, `vigencia_inicio`, `vigencia_fin`, `tasa_empleador`, `tasa_trabajador` | `afc_vigencia` | Confirmado |
| Asignación familiar | `tramo_carga` | `periodo`, `tramo`, `monto` | `asignacion_familiar_tramo` | Nombre a confirmar por BD |
| Ley 16.744 parámetros | `ley_16744_parametros` | `periodo`, `cotizacion_basica`, `cotizacion_extraordinaria` | `mutual_vigencia` | Confirmado |
| Mutualidad empresa | `empresa_mutual_config` | `id_empresa`, `vigencia_inicio`, `vigencia_fin`, `cotizacion_adicional`, `organismo_administrador_id` | `mutual_vigencia` | Confirmado |
| Organismo administrador Ley 16.744 | `organismo_administrador_ley_16744` | `id`, `nombre` | — | Confirmado |
| Tabla de impuesto único | `tabla_impuesto_unico` | `vigencia_inicio`, `vigencia_fin`, `desde`, `hasta`, `factor`, `rebaja`, `tasa_maxima` | — | Confirmado |
| Parámetros generales | `parametros_generales` | `parametro`, `valor`, `vigencia_inicio`, `vigencia_fin` | — | Confirmado |
| Reforma previsional | `reforma_previsional_parametro` | `vigencia_inicio`, `vigencia_fin`, `tasa`, `descripcion` | — | Confirmado |

### Uso

* **Tabla canónica**: nombre exacto de la tabla en la base de datos. Utilice estos nombres al implementar consultas y validaciones.
* **Campos clave**: columnas necesarias para identificar una fila o aplicar reglas de negocio.
* **No usar**: nombres de tablas que se encontraron en documentación preliminar pero que **no existen** en la base real. No deben usarse ni crearse sin confirmación.
* **Estado**: indica si la tabla está confirmada en la BD o si el nombre se debe validar. Si el estado es “Nombre a confirmar por BD”, verifique el nombre exacto antes de codificar.

Este diccionario se mantendrá actualizado a medida que se agreguen nuevas tablas o se renombren las existentes. Consulte siempre este documento antes de crear reglas o estructuras en los módulos del ERP.