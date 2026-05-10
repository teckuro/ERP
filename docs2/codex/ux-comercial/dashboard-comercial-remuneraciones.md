# Dashboard comercial de remuneraciones

## Objetivo

Disenar la pantalla de entrada vendible del ERP despues de tener cierre operativo y liquidaciones oficiales.

No implementar aun. Este documento define direccion visual y funcional.

## Objetivo de negocio

Un usuario debe entender el estado del mes en menos de 30 segundos:

```txt
cuantos trabajadores hay
si la nomina esta lista
que falta para pagar/liquidar
que alertas existen
cual es la siguiente accion
```

## Estructura propuesta

```txt
Dashboard remuneraciones
  periodo activo
  estado del mes
  resumen ejecutivo
  siguiente accion
  alertas criticas
  tarjetas de flujo
  actividad reciente
  accesos rapidos
```

## Tarjetas principales

| Tarjeta | Contenido | Accion |
|---|---|---|
| Empleados | activos, incompletos, no aptos | Revisar empleados |
| Parametros | estado mensual, pendientes criticos | Revisar parametros |
| Movimientos | movimientos aprobados/pendientes | Registrar movimientos |
| Nomina | base, calculo, guardado, aprobacion, cierre | Preparar nomina |
| Liquidaciones | generadas, pendientes, con observaciones | Ver liquidaciones |

## Estado del mes

Estados sugeridos:

```txt
Preparacion pendiente
Listo para calcular
Resultado preliminar guardado
Aprobado operativamente
Nomina cerrada
Liquidaciones generadas
```

## Indicadores comerciales

No usar demasiados indicadores. Priorizar:

```txt
trabajadores incluidos
trabajadores con observaciones
total haberes
total descuentos
liquido estimado/oficial
estado de cierre
estado de liquidaciones
```

## Accesos rapidos

```txt
Crear empleado
Registrar movimiento del mes
Revisar asignaciones recurrentes
Preparar nomina
Ver liquidaciones
Revisar parametros
```

## Reglas visuales

- El dashboard no reemplaza las pantallas operativas.
- No debe permitir acciones peligrosas sin confirmacion.
- No debe mostrar datos tecnicos como hash/IDs en primer nivel.
- Debe mostrar bloqueos con accion sugerida.
- Debe evitar graficos decorativos sin utilidad.

## Fuera de alcance

```txt
Predicciones IA
reporteria contable avanzada
Previred
LRE
banco
contabilidad
```
