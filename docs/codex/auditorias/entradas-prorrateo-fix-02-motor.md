# ENTRADAS-PRORRATEO-FIX-02 - Fase 2: entradas mensuales y prorrateo (motor Angular)

Fecha de correccion: **2026-05-28**.

Estado de la fase: **Fase 2 - Entradas mensuales y prorrateo: completada tecnicamente.**

Alcance: correccion de los hallazgos criticos **B6** y **B7** de la auditoria profunda del motor de calculo de remuneraciones. Solo motor Angular y sus tests; no se toco RBAC, auditoria, Previred/LRE, snapshot congelado de parametros, SQL, Python ni migraciones.

---

## 1. Estado de los hallazgos

| Hallazgo | Descripcion | Estado |
|----------|-------------|--------|
| **B6** | `entradasMensuales` llegaba al motor pero no impactaba el calculo. | **Corregido y validado** |
| **B7** | No existia prorrateo real por dias trabajados o ausencias. | **Corregido y validado** |

> El estado global del modulo **no** cambia a "listo para produccion".
>
> Estado correcto: *"Motor de calculo parcialmente fortalecido. Gratificacion legal, entradas mensuales y prorrateo corregidos y validados tecnicamente. Persisten bloqueantes productivos: RBAC, auditoria, cierre operativo, snapshot congelado y Previred/LRE."*

---

## 2. Detalle de la correccion

- **B6 - Entradas mensuales:** las entradas aptas ahora se clasifican e impactan el calculo (haberes imponibles/no imponibles, descuentos, anticipos, ausencias). Antes el motor las ignoraba.
- **B7 - Prorrateo:** el sueldo base se prorratea por dias trabajados cuando hay ausencias (`sueldo * dias_trabajados / dias_base_mes`), y la gratificacion proporcional considera dias trabajados (prorrateo del tope mensual cuando `gratificacionProporcional = true`).

### Ajuste minimo de modelo

`EntradaMensualMotor` no traia imponibilidad (`afectaBase` siempre `null`) ni dias trabajados. Ajuste minimo, sin nueva arquitectura:
- Campos opcionales `imponible?` / `tributable?` en `EntradaMensualMotor`, poblados desde `metadata` por el mapper.
- Dias de ausencia derivados de las entradas tipo `ausencia` (`cantidad`).
- Dia base del mes = constante `DIAS_BASE_MES = 30` (convencion mes comercial), centralizada.

---

## 3. Archivos modificados

| Archivo | Cambio |
|---------|--------|
| `src/app/features/nomina-mensual/models/proceso-mensual.model.ts` | `EntradaMensualMotor`: + `imponible?` / `tributable?` documentados. |
| `src/app/features/nomina-mensual/rules/proceso-mensual-motor-entradas.rules.ts` | `DIAS_BASE_MES`, `clasificarEntradaMensualMotor()`, `calcularDiasAusenciaEntradas()`; mapper lee imponibilidad desde `metadata`. |
| `src/app/features/nomina-mensual/rules/proceso-mensual-motor.rules.ts` | Prorrateo del sueldo base por ausencias; incorporacion de entradas al calculo; gratificacion proporcional por dias. |
| `src/app/features/nomina-mensual/rules/proceso-mensual-motor.rules.spec.ts` | Reemplazo del test que afirmaba B6; 9 casos nuevos; helper `entradaMotor()`. |
| `src/app/features/nomina-mensual/rules/proceso-mensual-motor-entradas.rules.spec.ts` | Tests de clasificacion, dias de ausencia y lectura de imponibilidad. |

---

## 4. Reglas implementadas

- **Clasificacion de entradas mensuales** por `tipoEntrada` / `categoria` / `tipoMovimiento`.
- **Haberes imponibles** (bonos imponibles, horas extra) → suman a base imponible y total haberes.
- **Haberes no imponibles** → suman a total haberes sin afectar base imponible.
- **Descuentos** (legal informado / voluntario) → descuentan del liquido.
- **Anticipos** → descuento del liquido sin afectar bases ni cotizaciones.
- **Ausencias** → afectan dias trabajados y prorratean el sueldo base.
- **Prorrateo de sueldo base** = `sueldo_base * dias_trabajados / 30` cuando hay ausencia.
- **Gratificacion proporcional por dias** = tope mensual prorrateado por `dias_trabajados / 30` cuando `gratificacionProporcional = true`.
- **Trazabilidad e issues**: `ENTRADA_HABER_IMPONIBLE`, `ENTRADA_HABER_NO_IMPONIBLE`, `ENTRADA_DESCUENTO_*`, `ENTRADA_ANTICIPO`, `ENTRADA_AUSENCIA_DIAS`, `SUELDO_BASE_PRORRATEADO`, `GRATIFICACION_ART_50_TOPE_PRORRATEADO`; issues `SUELDO_PRORRATEADO_AUSENCIA`, `ANTICIPO_DESCONTADO`, `ENTRADA_SIN_MONTO`, `ENTRADA_NO_SOPORTADA`.

---

## 5. Tests ejecutados y validacion

- `proceso-mensual-motor.rules.spec.ts` → **OK**
- `proceso-mensual-motor-entradas.rules.spec.ts` → **OK**
- `proceso-mensual-motor-calculos-concretos.spec.ts` → **OK**
- `proceso-mensual-container.spec.ts` → **OK**
- Build dev (`ng build --configuration=development`) → **correcto**
- **Sin lints.**

---

## 6. Resultado

- **B6: corregido y validado.**
- **B7: corregido y validado.**

---

## 7. Riesgos pendientes

- Licencias medicas / subsidios no calculados (clasificadas como no soportadas).
- Horas extra requieren `monto`, no solo `cantidad`.
- Distincion descuento legal / voluntario aun depende de `metadata`.
- Dia base `30` como convencion.
- No contempla todavia inicio / termino de contrato dentro del mes.
- **RBAC** pendiente.
- **Auditoria** pendiente.
- **Previred / LRE** pendiente.
- **Snapshot congelado de parametros** pendiente.
