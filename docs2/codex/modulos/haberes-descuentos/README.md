# Modulo Haberes y descuentos - punto de entrada

> Nombre visible en UI: `Asignaciones recurrentes`.
> Nombre tecnico/documental: `Haberes y descuentos`.
> Tabla principal: `haberdescuento_persona`.

## Estado

Fases 9.3A, 9.3B y 9.3C cerradas en alcance funcional: el uso esta acotado a **asignaciones recurrentes** por trabajador, con validacion de concepto asignable, vigencias coherentes, bloqueo de duplicados activos, bloqueo de rangos superpuestos, cierre/desactivacion controlada sin eliminacion fisica y vista historica filtrable por estado de vigencia derivado. **Preparar nomina (9.5B)** consume `listarAsignacionesParaPrevalidacionMensual` para prerequisitos por `YYYY-MM`; ver [`../nomina-mensual/prevalidaciones-9-5B.md`](../nomina-mensual/prevalidaciones-9-5B.md). Los movimientos puntuales del periodo se cargan en **Movimientos del mes**, nombre visible del flujo tecnico de Novedades mensuales.

## Documentos

| Archivo | Rol |
|---------|-----|
| [`contrato-general.md`](./contrato-general.md) | Limites del modulo, dependencia de Conceptos, regla 9.3A de vigencias/duplicados, regla 9.3B de cierre controlado, regla 9.3C de vista historica/filtros y separacion respecto de movimientos variables |

## Flujo de rutas

Ruta oficial de la aplicacion: `/remuneraciones/haberes-descuentos`. Compatibilidad temporal: `/haberes-descuentos` redirige a la oficial.

Detalle en [`../../temas/flujos/haberes-descuentos.md`](../../temas/flujos/haberes-descuentos.md) y en [`contrato-general.md`](./contrato-general.md) (seccion Navegacion oficial).
