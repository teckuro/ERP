# Modulo Haberes y descuentos - punto de entrada

## Estado

Fases 9.3A, 9.3B y 9.3C cerradas en alcance funcional: el uso esta acotado a **asignaciones recurrentes** por trabajador, con validacion de concepto asignable, vigencias coherentes, bloqueo de duplicados activos, bloqueo de rangos superpuestos, cierre/desactivacion controlada sin eliminacion fisica y vista historica filtrable por estado de vigencia derivado. **Proceso mensual (9.5B)** consume `listarAsignacionesParaPrevalidacionMensual` para prerequisitos por `YYYY-MM`; ver [`../nomina-mensual/prevalidaciones-9-5B.md`](../nomina-mensual/prevalidaciones-9-5B.md). Los **movimientos variables mensuales** (haberes/descuentos puntuales por periodo) son otro modulo: [`../movimientos-variables/README.md`](../movimientos-variables/README.md) (9.4A documental; 9.4B modelo TS y validaciones puras).

## Documentos

| Archivo | Rol |
|---------|-----|
| [`contrato-general.md`](./contrato-general.md) | Limites del modulo, dependencia de Conceptos, regla 9.3A de vigencias/duplicados, regla 9.3B de cierre controlado, regla 9.3C de vista historica/filtros y separacion respecto de movimientos variables |

## Flujo de rutas

Ruta oficial de la aplicacion: `/remuneraciones/haberes-descuentos`. Compatibilidad temporal: `/haberes-descuentos` redirige a la oficial.

Detalle en [`../../temas/flujos/haberes-descuentos.md`](../../temas/flujos/haberes-descuentos.md) y en [`contrato-general.md`](./contrato-general.md) (seccion Navegacion oficial).

## REM-UX-FLOWS-02 aplicado

La pantalla visible `Asignaciones recurrentes` mantiene el periodo activo global como contexto y guia el flujo:

```txt
seleccionar trabajador
-> revisar resumen del trabajador
-> crear o revisar asignaciones recurrentes
```

La explicacion fija de impacto en nomina queda como nota compacta visible, no como collapsable. Con trabajador seleccionado se muestra resumen de asignaciones activas, futuras, vencidas/cerradas e invalidas antes de la grilla.

## REM-PERIOD-GLOBAL-01 aplicado

La clasificacion de vigencia en `Asignaciones recurrentes` usa como fecha de referencia el primer dia del periodo activo global. Al cambiar el periodo se recargan conceptos/asignaciones del trabajador seleccionado y se cierra el dialogo abierto para evitar guardar con contexto vencido.
