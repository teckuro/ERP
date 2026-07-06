# GRATIFICACION-FIX-01 - Correccion de gratificacion legal art. 50 (motor Angular)

Fecha de correccion: **2026-05-28**.

Alcance: correccion de los hallazgos criticos **B1, B2 y B3** detectados en la auditoria profunda del motor de calculo de remuneraciones (gratificacion legal art. 50). Solo motor Angular y sus tests; no se toco SQL, Python, Supabase remoto ni migraciones.

---

## 1. Estado de los hallazgos

| Hallazgo | Descripcion | Estado |
|----------|-------------|--------|
| **B1** | Semantica de `immGratificacion` mal interpretada: se usaba como sueldo minimo en pesos y se volvia a multiplicar por 4,75. | **Corregido y validado** |
| **B2** | Factor 4,75 hardcodeado y duplicado dentro de la formula, ademas del parametro. | **Corregido y validado** |
| **B3** | El motor ignoraba `parametros.gratificacion` (politica de empresa). | **Corregido y validado** |

> El estado global del sistema **no** cambia a "listo para produccion". Solo se actualiza el estado de B1/B2/B3.

---

## 2. Detalle de la correccion

- **B1 - Semantica de `immGratificacion`:** ahora se trata como **factor legal 4,75**, no como sueldo minimo en pesos. El sueldo minimo se obtiene de `sueldoMinimo18a65 ?? sueldoMinimo`.
- **B2 - Hardcode duplicado:** se elimino el literal `4.75` dentro de la formula. El factor proviene de `parametros.immGratificacion`; el `4.75` queda solo como **constante de fallback** (`FACTOR_GRATIFICACION_LEGAL_DEFECTO`). El porcentaje `25%` quedo aislado en `PORCENTAJE_GRATIFICACION_LEGAL_DEFECTO`, preparado para parametrizarse.
- **B3 - Politica de empresa:** si `parametros.gratificacion` no esta activa, el motor no calcula gratificacion legal automatica y emite un aviso informativo (`GRATIFICACION_DESACTIVADA_EMPRESA`).

### Formula final usada

```
gratificacion = min(base_imponible * porcentaje, sueldo_minimo * factor_gratificacion / 12)
```

Donde:
- `porcentaje` = 25% (fallback parametrizable).
- `factor_gratificacion` = `parametros.immGratificacion` (4,75) con fallback a la constante.
- `sueldo_minimo` = `parametros.sueldoMinimo18a65 ?? parametros.sueldoMinimo`.

Ejemplo: `immGratificacion = 4,75` y `sueldoMinimo = 539.000` -> tope mensual `(539.000 * 4,75) / 12 = 213.354,17`.

---

## 3. Archivos modificados

| Archivo | Cambio |
|---------|--------|
| `src/app/features/nomina-mensual/rules/proceso-mensual-motor.rules.ts` | Reescritura de `calcularGratificacionArticulo50`: gate de empresa, sueldo minimo correcto, factor desde parametro, constantes de fallback, trazas actualizadas. |
| `src/app/features/nomina-mensual/rules/proceso-mensual-motor.rules.spec.ts` | Fixture default `gratificacion: true`; nuevo bloque de tests explicitos de gratificacion. |
| `src/app/features/parametros-generales/models/parametro-general.model.ts` | Documentacion de `immGratificacion` como factor legal (no monto) y de `gratificacion` como politica de empresa. No se renombro el campo para no propagar a repository/mappers/Python/SQL en esta fase. |

---

## 4. Tests agregados y validacion

Tests agregados en `proceso-mensual-motor.rules.spec.ts` (bloque "gratificacion legal art. 50"):
- `immGratificacion = 4,75` + `sueldoMinimo = 539.000` -> tope mensual cercano a `213.354` y tope aplicado.
- Trabajador que **supera** el tope -> resultado = tope.
- Trabajador que **no supera** el tope -> resultado = `base * 25%`.
- Factor desde parametro (`immGratificacion = 10`) -> demuestra que el factor no esta hardcodeado.
- `parametros.gratificacion = false` -> resultado 0 + aviso `GRATIFICACION_DESACTIVADA_EMPRESA`.
- Ausencia de sueldo minimo -> resultado 0 + advertencia `GRATIFICACION_SIN_CONFIGURACION`.

Resultado de validacion:
- `proceso-mensual-motor.rules.spec.ts` -> **OK**
- `proceso-mensual-motor-calculos-concretos.spec.ts` -> **OK**
- `container.spec` (`proceso-mensual-container.spec.ts`) -> **OK**
- Build dev (`ng build --configuration=development`) -> **correcto**

> Nota: `proceso-mensual.service.spec.ts` tiene 5 fallos **preexistentes** por el mock de `supabase.auth` (`getUser` undefined en `guardarBaseNominaBorrador`/`guardarSnapshotPreliminar`), ajenos a esta correccion.

---

## 5. Pendiente para fases posteriores

Esta correccion **no** aborda y queda pendiente:
- **RBAC / permisos** sobre parametros normativos y liquidaciones.
- **Auditoria** de cambios (usuario, fecha, valor anterior/nuevo, motivo, periodo).
- **Previred / LRE**: exportacion y validacion previsional.
- **Entradas mensuales**: integracion al motor (haberes/descuentos variables del periodo).
- **Prorrateo** de gratificacion y de remuneraciones por dias trabajados.
