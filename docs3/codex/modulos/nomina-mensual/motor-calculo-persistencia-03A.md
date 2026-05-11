# MOTOR-03A - Contrato de persistencia y snapshot de calculo

## Objetivo

Definir el contrato documental para guardar resultados preliminares del motor de calculo de nomina mensual de forma trazable, auditable y reversible.

MOTOR-03A no implementa persistencia. No crea SQL, migraciones, servicios de escritura, RLS, cambios de Supabase, UI ni TypeScript funcional.

## Concepto de snapshot preliminar

Un snapshot preliminar es una copia congelada del resultado del motor para un periodo y empresa.

Debe distinguirse de:

- calculo en memoria: resultado temporal generado por el servicio/pantalla, sin escritura;
- snapshot preliminar guardado: resultado congelado para revision y auditoria;
- calculo recalculado: nuevo resultado generado desde entradas actualizadas;
- resultado oficial futuro: liquidacion formal derivada de un snapshot aprobado;
- periodo cerrado futuro: estado operacional posterior que bloquea cambios.

Reglas:

- No es liquidacion oficial.
- No cierra el periodo.
- Puede ser reemplazado por un nuevo calculo si el periodo no esta cerrado.
- Debe conservar parametros, formulas, issues, trazabilidad, origenes y fuente de datos.
- Debe permitir comparar recalculos mediante version de motor y hash.

## Estados del calculo persistido

Estados permitidos para snapshot preliminar:

| Estado | Uso |
|---|---|
| `borrador` | Registro incompleto o generado para validacion tecnica inicial. |
| `preliminar` | Snapshot guardado desde calculo preliminar valido. |
| `recalculado` | Snapshot generado por nuevo calculo que reemplaza uno preliminar anterior. |
| `observado` | Snapshot con observaciones funcionales o legales pendientes. |
| `listo_para_revision` | Snapshot listo para revision interna. |
| `aprobado_para_liquidacion` | Snapshot aceptado como fuente para una liquidacion oficial futura. |
| `anulado` | Snapshot reemplazado o descartado sin borrado fisico. |

Estados no permitidos en MOTOR-03A/MOTOR-03B:

- `cerrado`
- `enviado_previred`
- `enviado_lre`
- `contabilizado`

Esos estados pertenecen a fases futuras de cierre, Previred, LRE y contabilidad.

## Tablas candidatas

Las tablas siguientes son candidatas documentales. No se crean en MOTOR-03A.

### `nomina_calculo_periodo`

Cabecera del snapshot por periodo y empresa.

Campos sugeridos:

| Campo | Proposito |
|---|---|
| `id_calculo_periodo` | Identificador del snapshot. |
| `id_empresa` | Empresa del proceso, si el modelo multiempresa lo expone. |
| `periodo` | Periodo `YYYY-MM`. |
| `estado` | Estado del snapshot preliminar. |
| `fecha_generacion` | Fecha/hora de generacion. |
| `usuario_generador` | Usuario o actor que ejecuto el guardado. |
| `total_trabajadores` | Total trabajadores incluidos. |
| `total_haberes` | Suma de haberes del snapshot. |
| `total_descuentos` | Suma de descuentos del trabajador. |
| `total_liquido` | Total liquido preliminar. |
| `total_bloqueados` | Trabajadores con bloqueo. |
| `total_advertencias` | Trabajadores o periodo con advertencias. |
| `version_motor` | Version funcional del motor, por ejemplo `MOTOR-02`. |
| `hash_snapshot` | Hash del contenido congelado. |
| `origen` | `preliminar`, `manual` o `recalculo`. |
| `created_at` | Auditoria tecnica de creacion. |
| `updated_at` | Auditoria tecnica de actualizacion. |

### `nomina_calculo_trabajador`

Detalle consolidado por trabajador.

Campos sugeridos:

| Campo | Proposito |
|---|---|
| `id_calculo_trabajador` | Identificador de fila trabajador. |
| `id_calculo_periodo` | FK conceptual a cabecera. |
| `id_persona` | Identificador del trabajador. |
| `rut` | RUT snapshot. |
| `nombre_completo_snapshot` | Nombre congelado al calcular. |
| `estado` | Estado calculado del trabajador. |
| `sueldo_base` | Sueldo base usado. |
| `base_imponible_previsional` | Base previsional con topes aplicados si correspondia. |
| `base_tributable` | Base afecta a impuesto unico. |
| `total_haberes_imponibles` | Total imponible. |
| `total_haberes_no_imponibles` | Total no imponible. |
| `total_descuentos_legales` | Total descuentos legales trabajador. |
| `total_descuentos_voluntarios` | Total descuentos voluntarios. |
| `impuesto_unico` | Impuesto unico calculado. |
| `liquido_preliminar` | Liquido preliminar. |
| `cotizacion_afp` | Cotizacion AFP trabajador. |
| `cotizacion_salud` | Cotizacion salud trabajador. |
| `cotizacion_afc` | Cotizacion AFC trabajador. |
| `cotizacion_sis` | SIS calculado. |
| `cotizacion_sanna` | SANNA empleador cuando corresponda. |
| `cotizacion_ley_16744_empleador` | Ley 16.744 empleador separada del descuento trabajador. |
| `created_at` | Auditoria tecnica de creacion. |
| `updated_at` | Auditoria tecnica de actualizacion. |

### `nomina_calculo_concepto`

Lineas de haberes, descuentos, cotizaciones e impuesto.

Campos sugeridos:

| Campo | Proposito |
|---|---|
| `id_calculo_concepto` | Identificador de linea. |
| `id_calculo_trabajador` | FK conceptual al trabajador calculado. |
| `id_concepto` | Concepto origen si existe. |
| `tipo` | `haber`, `descuento`, `cotizacion` o `impuesto`. |
| `nombre_concepto_snapshot` | Nombre congelado. |
| `codigo_lre_snapshot` | Codigo LRE opcional, solo informativo en esta fase. |
| `monto` | Monto de la linea. |
| `imponible` | Si afecta base previsional. |
| `tributable` | Si afecta base tributable. |
| `afecta_liquido` | Si afecta liquido del trabajador. |
| `origen` | `sueldo_base`, `recurrente`, `movimiento_variable` o `sistema`. |
| `trazabilidad_json` | Resumen trazable de la linea si no se normaliza completo. |

### `nomina_calculo_issue`

Issues del periodo o trabajador.

Campos sugeridos:

| Campo | Proposito |
|---|---|
| `id_issue` | Identificador del issue. |
| `id_calculo_periodo` | Snapshot asociado. |
| `id_calculo_trabajador` | Trabajador asociado, opcional. |
| `codigo` | Codigo de issue. |
| `severidad` | `BLOQUEO`, `ADVERTENCIA` o `INFO`. |
| `origen` | Origen funcional o tabla fuente. |
| `mensaje` | Mensaje congelado. |
| `campo` | Campo asociado. |
| `entidad_id` | Entidad asociada. |
| `created_at` | Fecha de registro. |

### `nomina_calculo_trazabilidad`

Trazabilidad normalizada de formulas y parametros.

Campos sugeridos:

| Campo | Proposito |
|---|---|
| `id_trazabilidad` | Identificador de traza. |
| `id_calculo_periodo` | Snapshot asociado. |
| `id_calculo_trabajador` | Trabajador asociado, opcional. |
| `codigo` | Codigo de trazabilidad. |
| `origen` | Motor, parametro, concepto, contrato u otro origen. |
| `tabla_fuente` | Tabla o fuente canonica usada. |
| `campo_fuente` | Campo fuente usado. |
| `vigencia_inicio` | Vigencia del dato aplicado. |
| `vigencia_fin` | Fin de vigencia si existe. |
| `valor_entrada` | Valor usado por la formula. |
| `formula` | Formula documentada. |
| `valor_resultado` | Resultado calculado. |
| `observacion` | Contexto adicional. |
| `created_at` | Fecha de registro. |

## Reglas de reemplazo y recalculo

- Solo puede existir un snapshot activo por periodo y empresa.
- Un nuevo calculo preliminar puede reemplazar al anterior si el periodo no esta cerrado.
- El snapshot anterior debe quedar `anulado` o historico segun regla de MOTOR-03B.
- No borrar fisicamente snapshots anteriores si fueron revisados, observados o aprobados.
- No permitir recalculo si el periodo esta cerrado en una fase futura.
- Cada recalculo debe guardar nueva `version_motor` y nuevo `hash_snapshot`.
- Si el hash no cambia, la UI futura puede informar que el recalculo no altero resultados.
- Si el hash cambia, debe quedar trazable que hubo diferencias entre snapshots.

## Hash y version

`version_motor` identifica la version funcional del calculo. Ejemplos:

- `MOTOR-01`
- `MOTOR-02`
- `MOTOR-03B`

`hash_snapshot` debe derivarse, en una fase posterior, de un payload ordenado y estable que incluya:

- periodo y empresa;
- trabajadores incluidos;
- conceptos y montos;
- bases;
- cotizaciones;
- impuesto;
- issues;
- trazabilidad;
- version del motor.

MOTOR-03A solo documenta esta regla. MOTOR-03B implementa un hash deterministico simple para deteccion preliminar de cambios; no es firma criptografica ni mecanismo de seguridad.

## Relacion con `periodo_remuneracion`

- El snapshot preliminar no cambia automaticamente el periodo a cerrado.
- Una fase posterior puede definir un estado operativo `calculado_preliminar` si el enum/campo real lo permite.
- MOTOR-03A no modifica BD ni estados reales.
- Si el periodo esta cerrado en fase futura, no se debe permitir guardar ni recalcular snapshots preliminares.

## Relacion con liquidacion oficial

- El snapshot preliminar no es liquidacion oficial.
- La liquidacion oficial futura puede generarse desde un snapshot en estado `aprobado_para_liquidacion`.
- PDF, Previred y LRE no deben consumir calculo en memoria directamente.
- PDF, Previred y LRE deben consumir una liquidacion oficial o un snapshot aprobado segun contrato futuro.

## Reglas DB-01

El snapshot debe preservar referencias a tablas canonicas confirmadas:

- `afp`
- `afp_vigencia`
- `salud`
- `salud_plan`
- `afc_parametro`
- `tramo_carga`
- `ley_16744_parametros`
- `empresa_ley_16744`
- `organismo_administrador_ley_16744`
- `tabla_impuesto_unico`
- `parametros_generales`
- `reforma_previsional_parametro`

No usar como reales:

- `empresa_mutual_config`
- `afp_parametro`
- `salud_vigencia`
- `afc_vigencia`
- `mutual_vigencia`
- `asignacion_familiar_tramo`
- `sis_parametro`
- `sanna_parametro`
- `topes_imponibles`

## Casos de prueba futuros para MOTOR-03B

- Guardar snapshot preliminar exitoso.
- Reemplazar snapshot preliminar no cerrado.
- Conservar snapshot anterior como historico o anulado.
- Impedir guardar si la pre-nomina esta bloqueada.
- Guardar issues y trazabilidad.
- Consultar snapshot por periodo.
- Recalcular y detectar hash distinto.
- Confirmar que guardar snapshot no cierra periodo.
- Confirmar que guardar snapshot no genera PDF, Previred ni LRE.

## Fuera de alcance

- Migraciones reales.
- SQL.
- RLS.
- Politicas de seguridad.
- Escritura en Supabase.
- Servicios de persistencia.
- UI.
- Cierre de periodo.
- PDF.
- Previred.
- LRE.
- Contabilidad.
- Liquidacion oficial.
- Rectificaciones.

## Siguiente fase

MOTOR-03B - Implementacion de persistencia controlada de snapshots preliminares.

## Cierre posterior MOTOR-03B

MOTOR-03B implementa el contrato definido aqui con SQL local, mapping, repository, servicio y UI minima para snapshot preliminar. La aplicacion controlada de la migracion y la validacion contra Supabase local/remoto quedan para MOTOR-03C.
