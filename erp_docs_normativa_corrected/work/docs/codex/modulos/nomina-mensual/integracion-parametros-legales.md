# Integración de parámetros legales

La generación de la nómina mensual depende de la correcta carga y vigencia de los parámetros legales (Ingreso Mínimo Mensual, asignación familiar, topes imponibles, tasas previsionales, etc.). Este documento reúne en una matriz los parámetros críticos y explica cómo deben validarse y consumirse antes de calcular la remuneración.

## Matriz de parámetros

| Regla o parámetro | Tabla fuente | Periodicidad / Vigencia | Bloquea liquidación | Observación |
|---|---|---|---|---|
| **Ingreso Mínimo Mensual (IMM)** | `parametros_generales` (campo `sueldo_minimo`) | Mensual (se actualiza por ley) | **Sí** | Base para validar el sueldo base y otros topes; consulte `ingreso‑minimo‑mensual.md` |
| **UF / UTM / UTA** | `parametros_generales` | Mensual | **Sí** | UTM afecta la tabla del impuesto único; UTA se usa en indemnizaciones |
| **Topes de gratificación (4,75 IMM)** | `parametros_generales` / derivado del IMM | Mensual | **Sí** | Se calcula como 4,75 veces el IMM vigente; se registra como `imm_gratificacion` |
| **Asignación familiar** | `tramo_carga` | Vigencia mensual / por tramo | **Sí**, si el trabajador tiene cargas | Monto por carga según tramo de renta; ver `asignacion‑familiar.md` |
| **Tabla de impuesto único** | `tabla_impuesto_unico` | Vigencia mensual | **Sí** | Contiene campos `vigencia_inicio`, `desde`, `hasta`, `factor`, `rebaja` |
| **AFP y cotizaciones previsionales** | `afp_vigencia` | Vigencia | **Sí** | Tasa obligatoria y comisión de cada AFP; asignada por trabajador |
| **Salud (Fonasa / Isapre)** | `salud` y `salud_plan` | Catálogo y vigencia | **Sí** | Aplica el 7 % legal o plan pactado; diferencia registrada como cotización voluntaria |
| **Seguro de Cesantía (AFC)** | `afc_parametro` | Vigencia | **Sí** | Tasas diferenciadas para contratos indefinidos y a plazo |
| **Seguro de Invalidez y Sobrevivencia (SIS)** | `sis_parametro` (o tabla confirmada) | Vigencia | **Sí** | Ver `sis.md`; tasa puede variar por periodo y debe verificarse mensualmente |
| **Ley 16.744 (mutualidad)** | `ley_16744_parametros`, `empresa_mutual_config` | Vigencia general / por empresa | **Sí** | Incluye cotización básica, extraordinaria y adicional diferenciada |
| **Reforma previsional** | `reforma_previsional_parametro` | Vigencia | **Sí** | Nuevas tasas cuando entren en vigor; ver `reforma‑previsional‑ley‑21735.md` |
| **Topes imponibles (AFP/IPS/AFC/APV)** | `parametros_generales` o tabla específica | Vigencia | **Sí** | Determina límites máximos de remuneración imponible para cotizaciones |

### Cómo validar

Para cada parámetro de la matriz anterior se aplican las siguientes validaciones:

1. **Existencia:** Para cada periodo se debe encontrar al menos un registro vigente en la tabla fuente. Si un parámetro crítico no existe para el periodo, el cálculo de la nómina se bloquea.
2. **Vigencia:** La `vigencia_inicio` debe ser anterior o igual al primer día del periodo y la `vigencia_fin` debe ser nula o posterior. Los registros con vigencia expirada no se aplican.
3. **Consistencia:** Algunos parámetros derivan de otros (por ejemplo, el tope de gratificación es 4,75 veces el IMM vigente). El sistema debe verificar que esta relación matemática se cumpla; en caso contrario se genera una **ADVERTENCIA**.

### Consumo en la nómina

* **Sueldo mínimo:** se utiliza para validar que el sueldo base de cada trabajador no sea inferior al IMM vigente. Se aplica al crear contratos y al validar haberes recurrentes.
* **Topes y tramos:** se emplean al calcular gratificaciones, asignaciones familiares y límites de cotización. El módulo de nómina lee estos valores de `parametros_generales`, `tramo_carga` y `tabla_impuesto_unico`.
* **Tasas previsionales:** se suman para calcular cotizaciones de AFP, salud, AFC y SIS. Se obtienen de `afp_vigencia`, `salud_plan` y `afc_parametro`; la tasa SIS se encuentra en la tabla confirmada (`sis_parametro`).

### Mantenimiento y actualización

Los parámetros legales se cargan mensualmente mediante procesos automáticos o manuales. Consulte `parametros/carga-parametros-python.md` para más detalles sobre la extracción de datos desde Previred y otras fuentes. Cualquier modificación debe registrarse en el `CHANGELOG.md` y validarse a través del plan de pruebas.
