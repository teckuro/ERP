# Modulo Haberes y descuentos - punto de entrada

## Estado

Fases 9.3A, 9.3B y 9.3C cerradas en alcance funcional: el uso esta acotado a **asignaciones recurrentes** por trabajador, con validacion de concepto asignable, vigencias coherentes, bloqueo de duplicados activos, bloqueo de rangos superpuestos, cierre/desactivacion controlada sin eliminacion fisica y vista historica filtrable por estado de vigencia derivado.

## Documentos

| Archivo | Rol |
|---------|-----|
| [`contrato-general.md`](./contrato-general.md) | Limites del modulo, dependencia de Conceptos, regla 9.3A de vigencias/duplicados, regla 9.3B de cierre controlado y regla 9.3C de vista historica/filtros |

## Flujo de rutas

Ruta oficial de la aplicacion: `/remuneraciones/haberes-descuentos`. Compatibilidad temporal: `/haberes-descuentos` redirige a la oficial.

Detalle en [`../../temas/flujos/haberes-descuentos.md`](../../temas/flujos/haberes-descuentos.md) y en [`contrato-general.md`](./contrato-general.md) (seccion Navegacion oficial).
