# Nomina mensual - prevalidaciones

## Objetivo

Describir las prevalidaciones ejecutadas por el modulo de Nomina mensual antes de calcular remuneraciones. 
Estas reglas se aplican por periodo `YYYY-MM` y verifican consistencia en parametros, empleados, conceptos y movimientos variables.

## Regla general

Las prevalidaciones no calculan montos ni generan liquidaciones; solamente revisan que existan datos suficientes y coherentes para el periodo seleccionado.

## Validaciones principales

| Categoria | Validacion | Accion cuando falla |
|-----------|-----------|---------------------|
| **Parametros** | Verificar que el periodo exista en `periodo_remuneracion` con estado `cargado` o `corregido`. | Mostrar bloqueo: “No existe carga mensual oficial para el periodo {YYYY-MM}.” |
| **Parametros legales y catalogos** | Asegurar que los parametros legales y tablas de vigencia aplicables esten vigentes al periodo. | Advertencia: informar que normativa falta o esta vencida. |
| **Empleados** | Verificar que existan empleados con `estado_ficha = VALIDO` y `apto_para_remuneraciones = true` dentro del periodo. | Bloqueo: “No hay empleados aptos para remuneraciones en el periodo.” |
| **Conceptos** | Revisar que el catalogo de conceptos asignables este consistente y que los conceptos asignados esten vigentes. | Advertencia o bloqueo segun gravedad; listar conceptos no vigentes. |
| **Haberes y descuentos** | Validar que las asignaciones recurrentes interfieran con el periodo y no existan duplicados invalidos. | Advertencia: conceptos recurrentes fuera de periodo o sin vigencia activa. |
| **Movimientos variables** | Revisar que los movimientos variables del periodo esten en estado `VALIDADO`. | Advertencia: hay movimientos variables en estado distinto a `VALIDADO`. |
| **Normativa legal** | Validar que el sueldo base de todos los empleados sea igual o mayor al IMM vigente, que las asignaciones excluidas (locomoción, colación, indemnizaciones) no se consideren remuneración imponible y que las horas extraordinarias se hayan pagado con el recargo legal.  Verificar además si el empleador está inscrito en el Libro de Remuneraciones Electrónico (LRE) para preparar la exportación. | Bloqueo: “Inconsistencias legales detectadas en el periodo {YYYY-MM}; revise `normativa-remuneraciones.md` y actualice parámetros y empleados.” |

## Servicios y modelos

- `ProcesoMensualService` - orquesta llamadas a servicios de Parametros (`listarCatalogos`), Empleados (`listarActivosAptos`), Conceptos (`listarAsignables`), Movimientos variables (`listarMovimientosPorPeriodo`).
- `proceso-mensual-prevalidacion.rules.ts` - contiene reglas puras que derivan bloqueos, advertencias e informaciones.
- Modelos TypeScript describen los paneles y elementos de UI (area, tipo de validacion, mensaje).

## UI

La pantalla de Proceso mensual presenta:

- Seleccion del periodo (`input type="month"`).
- Boton **Validar periodo**.
- Paneles colapsables para **Bloqueos**, **Advertencias**, **Informacion** y **Detalles por area**.
- Estado global del periodo (Parcial, Cargado, Corregido, etc.).

No se permiten acciones de calculo ni cierre en esta fase.

## Pendientes

- Integrar haberes recurrentes por periodo (`PENDIENTE_INTEGRACION`).
- Anadir validaciones para Previred/LRE cuando se incluya en el proceso.
- Permitir exportar un resumen de las prevalidaciones.
