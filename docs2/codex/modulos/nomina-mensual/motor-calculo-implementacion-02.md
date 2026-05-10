# MOTOR-02 - Gratificacion, impuesto unico y reglas legales avanzadas

## Objetivo

Fortalecer el calculo preliminar de MOTOR-01 con reglas legales avanzadas, manteniendo el resultado en memoria y sin convertirlo en liquidacion oficial.

MOTOR-02 no cierra periodo, no persiste liquidaciones, no genera snapshots definitivos, PDF, Previred, LRE, contabilidad ni exportaciones.

## Alcance

- Gratificacion legal art. 50 controlada por datos contractuales existentes.
- Impuesto unico de segunda categoria con `tabla_impuesto_unico`.
- Topes previsionales solo si existen campos claros en `parametros_generales`.
- Asignacion familiar simple solo si el trabajador trae cargas y tramo.
- Validacion IMM/jornada parcial usando IMM del periodo.
- Issues y trazabilidad normativa ampliada.

## Calculos agregados

### Gratificacion

- Si existe concepto recurrente de gratificacion vigente, se respeta y se suma segun su clasificacion.
- Si el trabajador trae configuracion suficiente (`tipoGratificacion` art. 50/25% o `gratificacionProporcional`), se calcula:
  - `tope_anual = IMM * 4.75`
  - `tope_mensual = tope_anual / 12`
  - `gratificacion_art_50 = min(base_gratificacion * 0.25, tope_mensual)`
- Si falta configuracion, se informa `GRATIFICACION_SIN_CONFIGURACION` y no se inventa monto.

No implementa 30% de utilidades, reliquidacion anual ni proporcionalidad compleja por dias.

### Impuesto unico

- Usa `tabla_impuesto_unico` con `desde`, `hasta`, `factor`, `rebaja`, `vigencia_inicio` y `vigencia_fin`.
- Base tributable MOTOR-02: haberes tributables menos descuentos legales disponibles del trabajador (AFP, salud y AFC).
- Formula: `max(0, baseTributable * factor - rebaja)`.
- Si falta tabla o tramo, deja issue y no inventa formula.

### Topes

- Usa `parametros_generales.topeAfp` o `topeAfpUf * uf` si existen.
- Usa `parametros_generales.topeCesantia` o `topeCesantiaUf * uf` para AFC si existen.
- Si no hay tope claro, genera `TOPE_IMPONIBLE_NO_DISPONIBLE` sin hardcodear valores ni crear `topes_imponibles`.

### Asignacion familiar

- Usa `tramo_carga` solo cuando el snapshot del trabajador trae cargas familiares e `idTramoCarga`.
- Monto simple: `cargasFamiliares * tramo_carga.valor`.
- El monto se agrega como haber no imponible y no tributable.
- Si falta tramo, genera `ASIGNACION_FAMILIAR_SIN_TRAMO`.

### Jornada e IMM

- Jornada parcial `<= 30` permite validar IMM proporcional.
- Jornada `> 30` exige IMM completo.
- Jornada maxima del periodo sigue el calendario documental de Ley 21.561.

## Trazabilidad

Se agregan trazas:

- `GRATIFICACION_ART_50_BASE`
- `GRATIFICACION_ART_50_TOPE`
- `GRATIFICACION_ART_50_RESULTADO`
- `IMPUESTO_UNICO_TRAMO`
- `IMPUESTO_UNICO_FACTOR`
- `IMPUESTO_UNICO_REBAJA`
- `IMPUESTO_UNICO_RESULTADO`
- `TOPE_IMPONIBLE_APLICADO`
- `IMM_PROPORCIONAL_JORNADA_PARCIAL`
- `ASIGNACION_FAMILIAR_TRAMO`

## Tablas usadas

MOTOR-02 respeta DB-01 y usa solo tablas canonicas ya confirmadas o snapshots derivados:

- `parametros_generales`
- `afp`
- `afp_vigencia`
- `salud`
- `salud_plan` como contrato conceptual del plan vigente
- `afc_parametro`
- `tramo_carga`
- `ley_16744_parametros`
- `empresa_ley_16744` como snapshot opcional
- `organismo_administrador_ley_16744` solo catalogo
- `tabla_impuesto_unico`
- `reforma_previsional_parametro` sin calculo avanzado en esta fase

No usa como reales: `empresa_mutual_config`, `afp_parametro`, `salud_vigencia`, `afc_vigencia`, `mutual_vigencia`, `asignacion_familiar_tramo`, `sis_parametro`, `sanna_parametro`, `topes_imponibles`.

## Tests

Suite actualizada: `proceso-mensual-motor.rules.spec.ts`.

Casos cubiertos:

- Gratificacion recurrente vigente.
- Gratificacion art. 50 con tope.
- Gratificacion sin configuracion.
- Trazabilidad de tope de gratificacion.
- Impuesto con tramo, factor y rebaja.
- Impuesto negativo en cero.
- Tabla o tramo de impuesto faltante.
- Tope imponible disponible y no disponible.
- IMM proporcional para jornada parcial.
- IMM completo para jornada mayor a 30 horas.
- Asignacion familiar con y sin tramo.
- Regresiones MOTOR-01: sueldo base, SIS, Ley 16.744 separada y resultado no persistido.

Validacion ejecutada:

```bash
npm test -- --watch=false
```

Resultado: 27 archivos de test, 255 tests en verde.

## Pendientes

- Persistencia controlada de resultados preliminares y snapshot de calculo.
- Configuracion empresarial formal para gratificacion.
- Proporcionalidad por dias, ausencias y licencias.
- Impuesto unico con validaciones adicionales si se incorporan haberes/descuentos tributarios mas finos.
- Asignacion familiar con ingreso promedio y cargas desde modelo dedicado.
- Topes legales adicionales si se exponen campos nuevos confirmados por DB-01.

## Siguiente fase recomendada

MOTOR-03 - Persistencia controlada de resultados preliminares y snapshot de calculo.
