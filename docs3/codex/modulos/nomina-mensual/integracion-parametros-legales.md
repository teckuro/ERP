# Integracion de parametros legales

La generacion de la nomina mensual depende de parametros legales cargados y vigentes para el periodo: IMM, asignacion familiar, topes imponibles, AFP, salud, AFC, SIS, Ley 16.744, SANNA, impuesto unico y reforma previsional.

Antes de usar nombres de tablas, revisar [`../../orquestador/diccionario-tablas-canonicas.md`](../../orquestador/diccionario-tablas-canonicas.md). No crear tablas nuevas ni asumir nombres alternativos sin confirmacion de BD.

## Matriz de parametros

| Regla o parametro | Tabla fuente | Periodicidad / vigencia | Bloquea liquidacion | Observacion |
|---|---|---|---|---|
| Ingreso Minimo Mensual (IMM) | `parametros_generales` | Mensual / vigencia legal | Si | Base para validar sueldo base y topes derivados. |
| UF / UTM / UTA | `parametros_generales` | Mensual | Si | UTM afecta impuesto unico; UTA se usa en referencias legales. |
| Tope de gratificacion | `parametros_generales` / derivado de IMM | Mensual | Si | Derivado del IMM vigente; no duplicar fuente si el calculo puede derivarse. |
| Asignacion familiar | `tramo_carga` | Mensual / tramo | Si, si el trabajador tiene cargas | Nombre pendiente de confirmar contra BD en DB-01. |
| Tabla de impuesto unico | `tabla_impuesto_unico` | Mensual / vigencia | Si | Usar tramos oficiales vigentes del periodo. |
| AFP y cotizaciones previsionales | `afp`, `afp_vigencia` | Catalogo + vigencia | Si | AFP del trabajador y tasa/comision vigente. |
| Salud Fonasa / Isapre | `salud`, `salud_plan` | Catalogo + vigencia | Si | Aplica 7% legal o plan pactado segun corresponda. |
| Seguro de cesantia (AFC) | `afc_parametro` | Vigencia | Si | Tasas por tipo de contrato. |
| Seguro de Invalidez y Sobrevivencia (SIS) | Tabla pendiente de confirmar en DB-01 | Vigencia mensual oficial | Si | No hardcodear tasa; resolver por PreviRed mensual, Superintendencia de Pensiones o registro manual auditado. |
| Ley 16.744 | `ley_16744_parametros`, `empresa_ley_16744`, `organismo_administrador_ley_16744` | General + empresa | Si | Basica, extraordinaria y adicional por empresa. |
| SANNA | Pendiente de tabla o parametro confirmado | Vigencia | Si si aplica al periodo | Mantener como parametro normativo auditado hasta confirmar modelo. |
| Reforma previsional | `reforma_previsional_parametro` | Vigencia | Si | Nuevas tasas segun vigencia legal. |
| Topes imponibles AFP/IPS/AFC/APV | `parametros_generales` u otra tabla confirmada por DB-01 | Vigencia | Si | No usar `topes_imponibles` como tabla real sin confirmacion. |

## Validaciones

1. Existencia: cada parametro critico debe existir para el periodo o tener vigencia aplicable.
2. Vigencia: `vigencia_inicio` debe cubrir el periodo y `vigencia_fin` debe ser nula o posterior al periodo validado.
3. Consistencia: los parametros derivados deben coincidir con su fuente base; diferencias generan advertencia o bloqueo segun severidad.
4. SIS: si no existe tasa confirmada para el periodo, bloquear nomina.

## Consumo en nomina

- El sueldo minimo valida sueldo base y reglas derivadas.
- Tramos y topes alimentan gratificacion, asignacion familiar, cotizaciones e impuesto unico.
- Tasas previsionales se resuelven desde tablas canonicas confirmadas.
- SIS siempre se resuelve por periodo desde fuente oficial mensual; no se acepta constante fija.

## Mantenimiento

Toda carga o ajuste normativo debe registrar fuente, fecha de revision, periodo de vigencia y responsable. Cualquier cambio de nombre de tabla debe actualizar el diccionario canonico y quedar pendiente de DB-01 si no se ha validado contra Supabase/PostgreSQL.
