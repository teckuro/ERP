# Decisiones pendientes

## Evidencia NOM-CIERRE-DB-APPLY-01 2026-05-10

- DEC-005 a DEC-008 siguen cerradas e implementadas en SQL versionado.
- Se aplicaron y validaron en BD real/controlada `15_nomina_calculo_snapshot.sql` y `21_nomina_cierre_operativo_rpc.sql`.
- RPC `cerrar_nomina_operativa`: existente, `SECURITY INVOKER`, `authenticated=true`, `anon=false`.
- Periodo E2E observado: `2026-04`, snapshot activo `id_calculo_periodo=15`, aprobado operativamente y cerrado operativamente con `E2E_NOMINA_CIERRE_REAL=1`.
- Pendiente operativo de cierre real: resuelto. Queda pendiente funcional DEC-009 para disenar liquidaciones oficiales.

Este registro lista los temas que requieren una decisión por parte de Producto o Arquitectura antes de avanzar con el desarrollo.  Cada entrada incluye un identificador, una descripción del problema, la decisión requerida, el estado y los módulos afectados.  Una vez tomada la decisión, debe actualizarse el estado y eliminarse la entrada del listado.

| ID | Tema | Problema | Decisión requerida | Estado | Bloquea |
|----|------|---------|-------------------|-------|---------|
| **DEC-001** | `trabajo_pesado_parametro` | Modelo híbrido entre `periodo` obligatorio y `vigencia_inicio`/`vigencia_fin`; la UI trata las filas como vigencias solapadas pero el SQL exige el mes. | Definir si la dimensión principal será **PERIODO_MENSUAL** o **VIGENCIA** y ajustar claves y filtros. | Pendiente | Nómina |
| **DEC-002** | `afp` vs `afp_vigencia` | La grilla de AFP muestra la tabla plana `afp` en unos contextos e ignora `afp_vigencia`, lo que puede desalinear los cálculos de cotizaciones. | Decidir si la UI debe exponer `afp_vigencia` o si la tabla `afp` debe enriquecerse con la información vigente al periodo. | Pendiente | Empleados / Nómina |
| **DEC-003** | `tabla_impuesto_unico` | Se versiona por vigencia, pero al cargarla se genera un campo `periodo` igual al mes de inicio; la UI la trata como **PERIODO_MENSUAL**, generando ambigüedad. | Determinar si el contrato final será de carga mensual o de vigencia pura. | Pendiente | Nómina |
| **DEC-004** | Estados `BORRADOR` | El valor `BORRADOR` se usa para estados de persona y de periodo, provocando confusión. | Reservar `BORRADOR` para la ficha de empleado en alta avanzada y usar `PENDIENTE` u otro estado para el periodo de remuneraciones. | Recomendado | Parámetros |

Una vez que se cierre cada tema, el equipo debe actualizar el `CHANGELOG.md` y ajustar los contratos y modelos de datos afectados.  Para inconsistencias de menor impacto, consulte el archivo `inconsistencias.md` y las recomendaciones allí contenidas.

<!-- ARQ-ERP-01-INTEGRACION -->

## Decisiones pendientes agregadas 2026-05-07

| Decision | Estado recomendado | Motivo |
|---|---|---|
| Como migrar `movimiento_variable_mensual` a `novedad_remuneracion_periodo` | Pendiente | Requiere revisar datos reales y mapper de estados. |
| Si la ruta legacy `/remuneraciones/movimientos-variables` se oculta, redirige o queda solo lectura | Pendiente | No debe coexistir productivamente con Novedades. |
| RLS de `novedad_remuneracion_periodo` | Pendiente tecnico | Necesario antes de uso productivo. |
| Definicion de liquidacion oficial vs snapshots preliminares | Pendiente LIQ-00 | Evita doble fuente de resultados. |


## Decisiones pendientes agregadas 2026-05-10

| ID | Tema | Decision requerida | Estado | Bloquea |
|---|---|---|---|---|
| **DEC-005** | Persistencia de cierre operativo | `NOM-CIERRE-01` guarda cierre v1 en `nomina_calculo_periodo`; tabla historica queda para reapertura/auditoria futura si se necesita. | Cerrada por NOM-CIERRE-DESIGN-01 | - |
| **DEC-006** | Cierre y `periodo_remuneracion` | Cierre operativo v1 no toca `periodo_remuneracion.estado`. | Cerrada por NOM-CIERRE-DESIGN-01 | - |
| **DEC-007** | Advertencias en cierre | Advertencias no bloquean por defecto; se muestran y registran en metadata. | Cerrada por NOM-CIERRE-DESIGN-01 | - |
| **DEC-008** | Reapertura | Reapertura queda fuera de cierre v1 y requiere fase propia. | Cerrada por NOM-CIERRE-DESIGN-01 | - |
| **DEC-009** | Liquidaciones oficiales | Definir contrato de liquidacion oficial desde snapshot cerrado. | Pendiente | LIQ-DESIGN-01 |
| **DEC-010** | UX comercial post-liquidaciones | Definir alcance visual/comercial despues de `LIQ-OFICIAL-01`. | Pendiente | UX-COMERCIAL-01 |

## Cierre NOM-CIERRE-01 2026-05-10

- Las decisiones DEC-005 a DEC-008 quedan implementadas en codigo/SQL versionado por `NOM-CIERRE-01`.
- Se mantiene pendiente DEC-009: definir liquidaciones oficiales desde snapshot cerrado en `LIQ-DESIGN-01`.
- Pendiente operativo no funcional: aplicar `15_nomina_calculo_snapshot.sql`/`21_nomina_cierre_operativo_rpc.sql` en BD real controlada y ejecutar E2E con `E2E_NOMINA_CIERRE_REAL=1`.
