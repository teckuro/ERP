# Diccionario de tablas canonicas

Este documento es la referencia obligatoria antes de escribir consultas, servicios, mappers, SQL o documentacion tecnica con nombres de tablas del ERP.

Regla operativa:

- Revisar primero este diccionario antes de usar nombres de tablas.
- No crear tablas nuevas ni usar nombres alternativos sin confirmar la base real.
- Si una tabla esta marcada como pendiente, no tratarla como tabla implementada.
- Si se confirma un cambio contra Supabase/PostgreSQL, actualizar este diccionario y registrar la decision en el changelog.

| Dominio | Tabla canonica | Campos clave | No usar | Estado |
|---|---|---|---|---|
| AFP catalogo | `afp` | `id_afp`, `codigo`, `nombre`, `periodo`, `vigencia_inicio`, `vigencia_fin`, `vigente` | `afp_parametro` | Confirmado contra Supabase DB-01 |
| AFP vigencias y tasas | `afp_vigencia` | `id_afp_vigencia`, `id_afp`, `vigencia_inicio`, `vigencia_fin`, `tasa_obligatoria`, `comision`, `sis`, `tope_imponible_uf` | `afp_parametro` | Confirmado contra Supabase DB-01 |
| Salud catalogo | `salud` | `id_salud`, `codigo`, `nombre`, `tipo`, `porcentaje_cotizacion`, `vigencia_inicio`, `vigencia_fin`, `vigente` | `salud_vigencia` | Confirmado contra Supabase DB-01 |
| Salud planes | `salud_plan` | `id_salud_plan`, `id_salud`, `codigo`, `nombre`, `valor_referencia`, `porcentaje_legal`, `vigencia_inicio`, `vigencia_fin`, `vigente` | `salud_vigencia` | Confirmado contra Supabase DB-01 |
| Seguro de cesantia | `afc_parametro` | `id_afc_parametro`, `codigo_tipo_contrato`, `periodo`, `vigencia_inicio`, `vigencia_fin`, `tasa_empleador`, `tasa_trabajador` | `afc_vigencia` | Confirmado contra Supabase DB-01 |
| Asignacion familiar | `tramo_carga` | `id_tramo`, `periodo`, `tramo`, `desde`, `hasta`, `valor` | `asignacion_familiar_tramo` | Confirmado contra Supabase DB-01 |
| Ley 16.744 parametros | `ley_16744_parametros` | `id_ley_16744_parametro`, `codigo`, `periodo`, `cotizacion_basica_empleador`, `vigencia_inicio`, `vigencia_fin`, `vigente` | `mutual_vigencia` | Confirmado contra Supabase DB-01 |
| Mutualidad empresa | `empresa_ley_16744` | `id_empresa_ley_16744`, `id_empresa`, `id_organismo_administrador_ley_16744`, `tasa_adicional_diferenciada`, `vigencia_inicio`, `vigencia_fin` | `empresa_mutual_config`, `mutual_vigencia` | Canonico corregido contra Supabase DB-01 |
| Organismo administrador Ley 16.744 | `organismo_administrador_ley_16744` | `id_organismo_administrador_ley_16744`, `codigo`, `nombre`, `tipo`, `periodo`, `vigente` | `mutual_vigencia` | Confirmado contra Supabase DB-01 |
| Tabla de impuesto unico | `tabla_impuesto_unico` | `id`, `periodo`, `tramo`, `desde`, `hasta`, `factor`, `rebaja`, `vigencia_inicio`, `vigencia_fin` | Pendiente de confirmar | Confirmado contra Supabase DB-01 |
| Parametros generales | `parametros_generales` | `periodo`, `sueldo_minimo`, `uf`, `utm`, `uta`, `sis`, `sanna`, `tope_afp`, `tope_cesantia`, `tope_ips` | `topes_imponibles` como tabla separada no confirmada | Confirmado contra Supabase DB-01 |
| Parametros generales cliente | `parametros_generales_cliente` | `periodo`, `descuentos_base_por_dia`, `gratificacion`, `imm_gratificacion`, `id_ccaf_entidad`, `id_organismo_administrador_ley_16744`, `fecha_actualizacion` | guardar configuracion cliente dentro de `parametros_generales` | Pendiente aplicar migracion DB local/remota |
| Novedades mensuales | `novedad_remuneracion_periodo` | `id_novedad_remuneracion_periodo`, `periodo`, `id_persona`, `id_contrato`, `id_concepto`, `categoria`, `tipo_movimiento`, `cantidad`, `monto`, `estado`, `origen` | guardar novedades nuevas en `haberdescuento_persona`, `movimiento`, `liquidacion` o tablas de snapshot calculado | Base SQL NOM-01B + RLS SEG-NOV-02 aplicado contra `SUPABASE_DB_URL` |
| Reforma previsional | `reforma_previsional_parametro` | `id_reforma_previsional_parametro`, `codigo`, `periodo`, `vigencia_inicio`, `vigencia_fin`, `aporte_empleador_total`, `seguro_social_sis_cev` | Pendiente de confirmar | Confirmado contra Supabase DB-01 |
| SIS | `parametros_generales.sis` y `afp_vigencia.sis` | `periodo`, `sis`, `vigencia_inicio`, `vigencia_fin`, `id_afp` segun tabla | `sis_parametro` como tabla separada no confirmada; no hardcodear tasa SIS | Confirmado contra Supabase DB-01; fuente oficial mensual sigue obligatoria |
| SANNA | `parametros_generales.sanna` | `periodo`, `sanna` | `sanna_parametro` como tabla separada no confirmada | Confirmado contra Supabase DB-01 |

## Regla SIS

La tasa SIS no se hardcodea en calculos ni se fija como constante documental.

Para un periodo, resolverla en este orden:

1. Tabla oficial cargada desde PreviRed mensual.
2. Fuente oficial de la Superintendencia de Pensiones.
3. Registro manual auditado en Parametros, marcado como excepcion.

Si no existe tasa confirmada para el periodo, el proceso de nomina debe bloquearse.

## Resultado DB-01

Validacion ejecutada el 2026-05-05 contra tipos remotos generados desde Supabase (`npx supabase gen types typescript --project-id ...`). Resultado:

- Confirmadas las tablas canonicas principales del diccionario.
- Corregida `empresa_mutual_config`: no existe en Supabase; la tabla canonica real es `empresa_ley_16744`.
- No existen tablas separadas `sis_parametro`, `sanna_parametro` ni `topes_imponibles` en el esquema remoto.
- No existen los nombres alternativos `afp_parametro`, `salud_vigencia`, `afc_vigencia`, `mutual_vigencia` ni `asignacion_familiar_tramo`.

<!-- ARQ-ERP-01-INTEGRACION -->

## Anexo ARQ-ERP-01 - canonico vs legacy en Nomina

| Dominio | Tabla | Clasificacion | Regla operativa |
|---|---|---|---|
| Novedades mensuales | `novedad_remuneracion_periodo` | **Canonica futura** | Usar para nuevas funcionalidades de hechos del periodo. |
| Movimientos variables | `movimiento_variable_mensual` | **Legacy/transicion** | Mantener por compatibilidad; no crear nuevas mejoras funcionales salvo bug/compatibilidad. |
| Liquidacion legacy | `liquidacion` | **Pendiente LIQ-00** | No declararla oficial hasta decidir relacion con snapshots. |
| Detalle liquidacion legacy | `liquidacion_detalle` | **Pendiente LIQ-00** | No usar como snapshot oficial sin decision. |

Decision: `novedad_remuneracion_periodo` es la fuente canonica futura para hechos del periodo. `movimiento_variable_mensual` queda como tabla historica/transicional hasta migracion o adaptacion controlada.
