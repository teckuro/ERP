# Matriz normativa operativa

Esta matriz consolida las principales normas laborales vigentes y las relaciona con los elementos del ERP.  Su objetivo es que las reglas legales se transformen en validaciones concretas sobre tablas y campos del sistema.  Cada fila identifica la fuente oficial, la tabla y campo donde se aplica, el módulo impactado, el tipo de dato a controlar y la severidad cuando no se cumple.

| Regla | Fuente oficial | Tabla/campo ERP | Módulo afectado | Tipo de dato | Severidad |
|------|---------------|-----------------|----------------|-------------|-----------|
| **Ingreso mínimo mensual** | Dirección del Trabajo / Ley vigente | `parametros_generales.sueldo_minimo` | Parámetros / Nómina | PERIODO_MENSUAL | BLOQUEO |
| **Gratificación art. 50** | Código del Trabajo / Dirección del Trabajo | `imm_gratificacion`, regla de cálculo futura | Nómina | CALCULO | BLOQUEO |
| **Remuneración imponible/no imponible** | Código del Trabajo art. 41 | `concepto.afecta_imponible`, `concepto.afecta_liquido` | Conceptos / Nómina | REGLA | BLOQUEO |
| **Jornada 40 horas** | Ley 21.561 | `contrato.jornada` | Empleados / Nómina | VIGENCIA | ADVERTENCIA/BLOQUEO |
| **Libro de Remuneraciones Electrónico (LRE)** | Servicio de Impuestos Internos / Dirección del Trabajo | `catalogo_lre`, exportación futura | Conceptos / LRE | CATALOGO/FUTURO | ADVERTENCIA |

<!-- Nuevas reglas incorporadas en la matriz operativa. Estas filas amplían el alcance normativo del ERP. -->
| **Asignación familiar por tramos** | Superintendencia de Seguridad Social (SUSESO) | `tramo_carga.tramo`, `tramo_carga.monto`, `tramo_carga.periodo` | Parámetros / Empleados / Nómina | VIGENCIA/TRAMO | BLOQUEO |
| **Impuesto único de segunda categoría** | Servicio de Impuestos Internos (SII) | `tabla_impuesto_unico.vigencia_inicio`, `tabla_impuesto_unico.desde`, `tabla_impuesto_unico.hasta`, `tabla_impuesto_unico.factor`, `tabla_impuesto_unico.rebaja` | Parámetros / Nómina | TABLA | BLOQUEO |
| **AFP y cotizaciones previsionales** | Código del Trabajo / Superintendencia de Pensiones | `afp_vigencia.tasa_obligatoria`, `afp_vigencia.comision`, `afp_vigencia.vigencia_inicio`, `afp_vigencia.vigencia_fin` | Parámetros / Empleados / Nómina | VIGENCIA | BLOQUEO |
| **Seguro de Invalidez y Sobrevivencia (SIS)** | Superintendencia de Pensiones | `sis_parametro.tasa`, `sis_parametro.vigencia_inicio`, `sis_parametro.vigencia_fin` (tabla confirmada) | Parámetros / Nómina | VIGENCIA | BLOQUEO |
| **Seguro de Cesantía (AFC)** | Ley 19.728 | `afc_parametro.tasa_empleador`, `afc_parametro.tasa_trabajador`, `afc_parametro.vigencia_inicio`, `afc_parametro.vigencia_fin` | Parámetros / Nómina | VIGENCIA | BLOQUEO |
| **Salud (Fonasa/Isapre)** | Código del Trabajo / Leyes de Salud | `salud.id`, `salud_plan.id`, `empleado.plan_salud_id` | Empleados / Nómina | PLAN | BLOQUEO o ADVERTENCIA |
| **Ley 16.744 (mutualidad)** | Ley 16.744 / Dirección del Trabajo | `ley_16744_parametros.cotizacion_basica`, `ley_16744_parametros.cotizacion_extraordinaria`, `empresa_mutual_config.cotizacion_adicional`, `organismo_administrador_ley_16744.id` | Empresa / Parámetros / Nómina | VIGENCIA | BLOQUEO |
| **Reforma previsional Ley 21.735** | Ley 21.735 (Reforma previsional) | `reforma_previsional_parametro.vigencia_inicio`, `reforma_previsional_parametro.tasa` | Parámetros / Nómina | VIGENCIA | BLOQUEO |
| **Topes imponibles AFP/IPS/AFC/APV** | Superintendencia de Pensiones / SII | `parametros_generales.tasa_tope_imponible` u otra tabla específica | Parámetros / Nómina | TOPES | BLOQUEO |
| **Códigos y clasificación LRE** | Servicio de Impuestos Internos / Dirección del Trabajo | `catalogo_lre.codigo`, `catalogo_lre.clasificacion` | Conceptos / Nómina / LRE | CATALOGO | ADVERTENCIA/BLOQUEO |
| **Jornada máxima vigente** | Ley 21.561 | `contrato.jornada` | Empleados / Nómina | VIGENCIA | BLOQUEO |

La severidad indica cómo debe reaccionar el sistema ante un incumplimiento:

- **BLOQUEO**: impide validar o calcular; no se permite avanzar hasta subsanar el problema.
- **ADVERTENCIA**: permite continuar pero informa de un riesgo o falta de dato opcional.
- **INFO**: sólo informa contexto, sin bloquear ni advertir.

Esta matriz se ampliará a medida que se incorporen otras normas (asignación familiar, previsión social, impuesto único, ley 16.744, etc.).  Consulte `versionado‑normativo.md` para ver la vigencia temporal de cada norma.