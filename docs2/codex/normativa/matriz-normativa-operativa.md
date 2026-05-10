# Matriz normativa operativa

Esta matriz consolida normas laborales y previsionales chilenas y las relaciona con datos operativos del ERP. Su objetivo es convertir reglas legales en validaciones concretas sobre parametros, empleados, conceptos, nomina y exportaciones.

Antes de usar nombres de tablas en implementacion o documentacion tecnica, revisar [`../orquestador/diccionario-tablas-canonicas.md`](../orquestador/diccionario-tablas-canonicas.md).

| Regla | Fuente oficial | Dato ERP | Modulo afectado | Tipo de dato ERP | Severidad |
|---|---|---|---|---|---|
| Ingreso Minimo Mensual | Direccion del Trabajo / ley vigente | `parametros_generales` | Parametros / Nomina | PERIODO_MENSUAL | BLOQUEO |
| Gratificacion legal art. 50 | Codigo del Trabajo / Direccion del Trabajo | IMM y regla futura de calculo | Nomina | CALCULO | BLOQUEO |
| Remuneracion imponible/no imponible | Codigo del Trabajo art. 41 | `concepto.afecta_imponible`, `concepto.afecta_liquido` | Conceptos / Nomina | REGLA | BLOQUEO |
| Jornada 40 horas | Ley 21.561 | Jornada contractual del trabajador | Empleados / Nomina | VIGENCIA | ADVERTENCIA/BLOQUEO |
| Asignacion familiar | SUSESO | `tramo_carga` | Parametros / Empleados / Nomina | VIGENCIA/TRAMO | BLOQUEO |
| Impuesto unico segunda categoria | SII | `tabla_impuesto_unico` | Parametros / Nomina | TABLA | BLOQUEO |
| AFP y cotizaciones previsionales | Superintendencia de Pensiones | `afp`, `afp_vigencia` | Parametros / Empleados / Nomina | VIGENCIA | BLOQUEO |
| SIS | PreviRed mensual / Superintendencia de Pensiones | Tabla pendiente de confirmar en DB-01; no hardcodear tasa | Parametros / Nomina | VIGENCIA_MENSUAL_OFICIAL | BLOQUEO |
| AFC | Ley 19.728 | `afc_parametro` | Parametros / Nomina | VIGENCIA | BLOQUEO |
| Salud Fonasa / Isapre | Normativa de salud vigente | `salud`, `salud_plan` | Empleados / Nomina | PLAN/VIGENCIA | BLOQUEO |
| Ley 16.744 | Ley 16.744 / organismos administradores | `ley_16744_parametros`, `empresa_ley_16744`, `organismo_administrador_ley_16744` | Empresa / Parametros / Nomina | VIGENCIA | BLOQUEO |
| SANNA | Ley SANNA / organismo oficial | Parametro o tabla a confirmar | Parametros / Nomina | VIGENCIA | BLOQUEO |
| Reforma previsional Ley 21.735 | Ley 21.735 | `reforma_previsional_parametro` | Parametros / Nomina | VIGENCIA | BLOQUEO |
| Topes imponibles AFP/IPS/AFC/APV | Superintendencia de Pensiones / SII | `parametros_generales` u otra tabla confirmada por DB-01 | Parametros / Nomina | TOPES | BLOQUEO |
| Codigos y clasificacion LRE | SII / Direccion del Trabajo | `catalogo_lre` | Conceptos / Nomina / LRE | CATALOGO | ADVERTENCIA/BLOQUEO |

## Severidad

- BLOQUEO: impide validar, calcular, cerrar o exportar hasta corregir el dato.
- ADVERTENCIA: permite continuar solo si el riesgo no afecta un calculo legal obligatorio.
- INFO: informa contexto sin bloquear.

## Regla SIS

La tasa SIS es mensual y debe validarse contra fuente oficial. Resolver por este orden: PreviRed mensual, Superintendencia de Pensiones, registro manual auditado en Parametros. Si no hay tasa confirmada para el periodo, bloquear nomina.
