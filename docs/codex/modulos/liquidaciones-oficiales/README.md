# Modulo Liquidaciones oficiales

## Proposito

Permitir generar y revisar liquidaciones oficiales internas desde una nómina mensual confirmada.

## Estado actual

**Implementado y validado en BD real/controlada** mediante `LIQ-OFICIAL-01` y `LIQ-DB-APPLY-01`.

## Flujo

```txt
Nómina mensual
-> Revisar trabajadores
-> Confirmar nomina
-> Liquidaciones oficiales internas
```

## Regla central

```txt
Liquidaciones oficiales no recalcula.
Materializa la nómina mensual confirmada.
```

## NOM-MENSUAL-CONFIRMACION-FLOW-00

Liquidaciones oficiales queda alineado a la nueva regla rectora de Nómina mensual:

```txt
Nómina mensual confirmada = fuente oficial para generar liquidaciones.
```

La regla actual se mantiene: Liquidaciones no recalcula. El lenguaje visible debe usar `nómina mensual confirmada` como condicion de entrada a RRHH.


## NOM-LIQ-ACTA-GUIADA-DESIGN-00

Liquidaciones oficiales queda documentado como acta de salida interna del flujo `Nómina mensual -> Liquidaciones oficiales`.

La pantalla debe explicar la condicion de entrada, confirmar que no recalcula y mostrar evidencia despues de generar o revisar liquidaciones. Ver [`../../diseno/nom-liq-acta-guiada-design-00.md`](../../diseno/nom-liq-acta-guiada-design-00.md).

La fase `NOM-PREPARAR-NOMINA-ACTA-ACCION-UX-01` deja preparada en `Nómina mensual` una evidencia visual local previa a este modulo. Liquidaciones no recibe datos nuevos ni recalcula por esa accion. La persistencia formal queda para `NOM-LIQ-ACTA-GENERACION-UX-01`.

## Incluye v1

```txt
estado del periodo
boton Generar liquidaciones oficiales
confirmacion previa temporal
resumen de totales
grilla de trabajadores
detalle por trabajador con conceptos
persistencia en tablas nomina_liquidacion_*
RPC generar_liquidaciones_oficiales
```

## Fuera de alcance v1

```txt
firma
recepcion
envio masivo
portal trabajador
Previred
LRE operativo
archivo banco
contabilidad
reapertura
anulacion
rectificacion
reliquidacion
```

## LIQ-01a (2026-07-05)

- PDF / vista imprimible por trabajador desde grilla liquidaciones (`Ver liquidación`)
- Sin recálculo; snapshot materializado (`nomina_liquidacion_concepto`)

## LIQ-01b (2026-07-05)

- Auditoría de emisión en `nomina_liquidacion_emision` + RPC `emitir_liquidacion_trabajador`
- Registro automático al abrir vista oficial e imprimir desde navegador
- `ultimaEmision` en metadata del trabajador para consulta rápida

## LIQ-01c (2026-07-05)

- Franja `liq-version-diff` al cambiar versión (totales vs versión anterior)
- Reglas y presenter reutilizando patrón F09 diff recálculo

## Evidencia real/controlada

```txt
Periodo: 2026-04
id_calculo_periodo: 1
id_liquidacion_periodo: 1
Trabajadores: 1
Conceptos: 8
Haberes: 750001.88
Descuentos: 588301.48
Liquido: 161700.40
Duplicados activos: 0
```

## Pruebas registradas

```txt
npx playwright test tests/liquidaciones-oficiales.e2e.spec.ts --workers=1 --timeout=120000: OK, 1 passed
npx ng test --watch=false: OK, 433 tests
npm run build: OK con warnings CSS conocidos
```

## Deuda UX

La confirmacion fue reemplazada por modal/MsgBox estandar durante UX-COMERCIAL-01.

## UX-COMERCIAL-01 V4 aplicado

- La pantalla explica que la salida nace desde nómina mensual confirmada.
- Resumen, siguiente accion, bloqueos/advertencias e informacion quedan por sobre la trazabilidad tecnica.
- El detalle vacio ya no queda sin salida: ofrece volver a Liquidaciones oficiales o preparar la nomina.
- Acciones futuras siguen fuera de alcance: sin PDF, firma, envio, Previred, LRE, banco ni contabilidad.

## REM-UX-FLOWS-01 V2 aplicado

- `Liquidaciones oficiales` consume el periodo activo global y lo muestra como contexto compacto.
- Se elimina el selector local editable de periodo para evitar dos fuentes visuales de verdad.
- El header queda con acciones secundarias. `Generar liquidaciones oficiales` vive como accion principal del bloque operativo segun estado.
- `Que falta ahora` explica si falta cerrar nomina, si ya existen liquidaciones o si puede generarse la salida interna.

## REM-UX-FLOWS-01 V3 aplicado

- La vista prioriza disponibilidad, resumen y accion principal antes de cualquier detalle interno.
- `Que falta ahora` no muestra identificadores ni versionado tecnico. Solo estado, pendiente, advertencias y siguiente accion.
- La trazabilidad queda al final en un disclosure secundario con etiquetas de negocio (`Referencia interna`, `Version interna`).
- Salidas externas siguen fuera de alcance: sin PDF, firma, envio, Previred, LRE, banco ni contabilidad.

## Selector de nómina (F18c UX)

- La elección de nómina origen se hace mediante modal con `app-data-grid` filtrable (no select nativo ni segundo selector de período).
- El período global del shell sigue siendo la referencia; el modal lista solo nóminas liquidadas o cerradas con comprobantes.
- Tras seleccionar, la pantalla principal muestra origen, versiones y trabajadores liquidados.
- **Entrada sin nómina:** grilla inline filtrable (sin modal automático ni botón intermedio); el modal queda solo para «Cambiar» nómina.

## Revisión guiada y acta de generación (F18c)

- Sobre la grilla de trabajadores: franja de contadores por **estado** (autorización, pago, documento, rectificación).
- Filtros DG: búsqueda por nombre/RUT/cargo y select por **Estado**.
- Panel lateral: chip de estado, cuadratura de totales y placeholder accionable.
- Generar/Regenerar: confirmación MessageBox con secciones de acta; evidencia de versión creada tras la acción.
- Acciones por trabajador (autorizar → pago → documento → rectificación): transiciones operativas con persistencia en servidor (`actualizar_estado_revision_liquidacion_trabajador`) y respaldo local por sesión.

## ERP-NOIA-BITACORA-OPERATIVA-00 - Lectura de modulo

Liquidaciones oficiales queda alineado a [`NOIA / Bitacora Operativa`](../../diseno/bitacora-operativa-noia.md) como `Acta de salida interna` del periodo.

- La pantalla debe comunicar origen del cierre, trabajadores listos para nomina, estado de emision y trazabilidad antes que decoracion visual.
- El documento liquidacion se entiende como salida oficial del periodo ya cerrado.
- Esta referencia es documental. No cambia calculo, motor, PDF, SQL, rutas ni estilos globales.

## NOM-MOVIMIENTOS-SIMPLE-01

Liquidaciones no cambia. La relacion con movimientos sigue entrando por la nómina mensual confirmada. No se recalculan cuotas, recurrentes ni movimientos desde Liquidaciones.
