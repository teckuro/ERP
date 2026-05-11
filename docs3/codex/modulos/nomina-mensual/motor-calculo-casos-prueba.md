# MOTOR-00 - Casos de prueba esperados para MOTOR-01

Estos casos son obligatorios antes de implementar montos reales. En MOTOR-00 solo se documentan.

## Casos minimos

| Caso | Esperado |
|---|---|
| Trabajador sueldo base simple | Calcula haberes, descuentos legales y liquido sin adicionales. |
| Trabajador con gratificacion | Aplica regla definida por empresa y tope 4,75 IMM. |
| Trabajador con haberes imponibles adicionales | Suma a base imponible y tributable segun clasificacion. |
| Trabajador con haberes no imponibles | Suma a total haberes y liquido, no afecta cotizaciones. |
| Trabajador Fonasa | Aplica salud legal segun base imponible y tope. |
| Trabajador Isapre | Aplica plan pactado y diferencia si corresponde. |
| Trabajador con AFC indefinido | Usa tasas de `afc_parametro` para contrato indefinido. |
| Trabajador con AFC plazo fijo | Usa tasas de `afc_parametro` para plazo fijo u obra. |
| SIS faltante | Bloquea calculo del trabajador/periodo. |
| Tabla impuesto faltante | Bloquea calculo del trabajador/periodo. |
| Sueldo menor IMM | Bloquea si no corresponde proporcionalidad. |
| Jornada parcial `<= 30` | Permite evaluar IMM proporcional si la politica lo define. |
| Jornada `> 30` | Exige IMM completo. |
| Ley 16.744 empresa configurada | Calcula aporte empleador con tabla general y configuracion empresa. |
| Concepto sin clasificacion | Bloquea antes de calcular bases. |

## Datos fixture iniciales sugeridos

- Periodo: `2026-04`.
- IMM 18-65: `539000`.
- Jornada maxima desde 2026-04-26: `42`.
- Ley 16.744 basica: `0.90`.
- SIS: confirmado por fuente oficial mensual; si falta, bloqueo.
- SANNA: desde `parametros_generales.sanna`; si aplica y falta, bloqueo.

## Criterio de pruebas para MOTOR-01

- Reglas puras con fixtures controlados.
- Pruebas de bloqueos previos.
- Pruebas de trazabilidad por linea.
- Pruebas de no mutacion de entradas.
- Pruebas de orden de operaciones para bases, topes, cotizaciones e impuesto.
- Pruebas sin dependencia de Supabase remoto.

## MOTOR-02 - Casos agregados

| Caso | Esperado |
|---|---|
| Gratificacion recurrente vigente | Se respeta como haber recurrente y suma segun clasificacion. |
| Gratificacion art. 50 configurada | Calcula 25% con tope mensual `IMM * 4.75 / 12`. |
| Gratificacion sin configuracion | Genera advertencia y no inventa monto. |
| Tope de gratificacion | Registra trazabilidad de base, tope y resultado. |
| Impuesto unico con tabla | Identifica tramo, aplica factor y rebaja, y deja resultado en trazabilidad. |
| Impuesto negativo | Resultado se limita a cero. |
| Tabla o tramo de impuesto faltante | Genera issue sin inventar formula. |
| Tope imponible disponible | Limita base previsional usando `parametros_generales`. |
| Tope imponible no disponible | Genera issue sin usar `topes_imponibles` ni hardcodear valores. |
| Jornada parcial `<= 30` | Permite IMM proporcional y traza formula. |
| Jornada `> 30` | Exige IMM completo. |
| Asignacion familiar con `tramo_carga` | Calcula monto simple por carga como haber no imponible. |
| Asignacion familiar sin tramo | Genera issue y no inventa monto. |

Pruebas implementadas en `proceso-mensual-motor.rules.spec.ts`; validacion global `npm test -- --watch=false`.

## MOTOR-03B - Casos agregados

| Caso | Esperado |
|---|---|
| Sin calculo en memoria | No permite guardar snapshot y genera `SNAPSHOT_SIN_CALCULO`. |
| Calculo con bloqueos | No permite guardar snapshot y genera `SNAPSHOT_CALCULO_BLOQUEADO`. |
| Snapshot preliminar exitoso | Construye cabecera con periodo, resumen, version de motor y hash. |
| Detalle trabajador | Persiste bases, cotizaciones, impuesto, haberes, descuentos y liquido preliminar. |
| Conceptos asociados | Guarda lineas de haberes, descuentos, cotizaciones e impuesto. |
| Issues | Guarda issues de periodo y trabajador. |
| Trazabilidad | Guarda formulas, fuentes, campos, valores y resultados. |
| Reemplazo | Marca snapshot anterior inactivo/anulado y no lo borra fisicamente. |
| Consulta | Permite obtener snapshot activo por periodo. |
| Hash distinto | Cambia si cambian montos relevantes. |
| Periodo | Guardar snapshot no marca periodo como cerrado. |
| Fuera de alcance | No genera PDF, Previred, LRE ni liquidacion oficial. |

Pruebas implementadas en `proceso-mensual-snapshot.rules.spec.ts`, `proceso-mensual.service.spec.ts` y `proceso-mensual-container.spec.ts`.
