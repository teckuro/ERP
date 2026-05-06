# Decisiones pendientes

Este registro lista los temas que requieren una decisión por parte de Producto o Arquitectura antes de avanzar con el desarrollo.  Cada entrada incluye un identificador, una descripción del problema, la decisión requerida, el estado y los módulos afectados.  Una vez tomada la decisión, debe actualizarse el estado y eliminarse la entrada del listado.

| ID | Tema | Problema | Decisión requerida | Estado | Bloquea |
|----|------|---------|-------------------|-------|---------|
| **DEC‑001** | `trabajo_pesado_parametro` | Modelo híbrido entre `periodo` obligatorio y `vigencia_inicio`/`vigencia_fin`; la UI trata las filas como vigencias solapadas pero el SQL exige el mes. | Definir si la dimensión principal será **PERIODO_MENSUAL** o **VIGENCIA** y ajustar claves y filtros. | Pendiente | Nómina |
| **DEC‑002** | `afp` vs `afp_vigencia` | La grilla de AFP muestra la tabla plana `afp` en unos contextos e ignora `afp_vigencia`, lo que puede desalinear los cálculos de cotizaciones. | Decidir si la UI debe exponer `afp_vigencia` o si la tabla `afp` debe enriquecerse con la información vigente al periodo. | Pendiente | Empleados / Nómina |
| **DEC‑003** | `tabla_impuesto_unico` | Se versiona por vigencia, pero al cargarla se genera un campo `periodo` igual al mes de inicio; la UI la trata como **PERIODO_MENSUAL**, generando ambigüedad. | Determinar si el contrato final será de carga mensual o de vigencia pura. | Pendiente | Nómina |
| **DEC‑004** | Estados `BORRADOR` | El valor `BORRADOR` se usa para estados de persona y de periodo, provocando confusión. | Reservar `BORRADOR` para la ficha de empleado en alta avanzada y usar `PENDIENTE` u otro estado para el periodo de remuneraciones. | Recomendado | Parámetros |

Una vez que se cierre cada tema, el equipo debe actualizar el `CHANGELOG.md` y ajustar los contratos y modelos de datos afectados.  Para inconsistencias de menor impacto, consulte el archivo `inconsistencias.md` y las recomendaciones allí contenidas.
