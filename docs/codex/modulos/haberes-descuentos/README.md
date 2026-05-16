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
## ERP-NOIA-BITACORA-OPERATIVA-00 - Lectura de modulo

Haberes y descuentos queda alineado a [`NOIA / Bitacora Operativa`](../../diseno/bitacora-operativa-noia.md) como fuente de asignaciones recurrentes dentro de la futura lectura `Movimientos de remuneracion`.

- Debe distinguirse de `Conceptos`: aqui se registran montos o asignaciones aplicadas a trabajadores.
- La narrativa visible debe priorizar vigencia, periodicidad, estado y efecto en nomina.
- Esta referencia es documental; no cambia SQL, motor, rutas, servicios ni persistencia.

## NOM-MOVIMIENTOS-SIMPLE-00

La decision documental vigente define `Movimientos de remuneracion` como experiencia futura que unifica `Movimientos del mes` y `Asignaciones recurrentes` desde la duracion del registro: `Solo este mes`, `Recurrente` o `En cuotas`. Documento rector: [`../remuneraciones/movimientos-remuneracion-simple.md`](../remuneraciones/movimientos-remuneracion-simple.md).

Esta fase no cambia rutas, servicios, SQL, motor ni pantallas actuales.

## NOM-MOVIMIENTOS-SIMPLE-01

La pantalla `/remuneraciones/haberes-descuentos` queda comunicada como vista `Recurrentes` dentro de `Movimientos de remuneracion`. La logica de asignaciones recurrentes, servicios y persistencia no cambian.

## NOM-MOVIMIENTOS-POR-TRABAJADOR-01

Recurrentes queda como flujo separado dentro de Movimientos de remuneracion. Desde la gestion por trabajador se navega a `Recurrentes` con la persona seleccionada. Las cuotas se tratan como variante del recurrente, no como opcion del modal mensual.
