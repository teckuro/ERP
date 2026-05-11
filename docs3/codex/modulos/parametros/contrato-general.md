# Parámetros - contrato general (resumen)

## Objetivo

Unificar criterios del módulo **Parámetros** sin duplicar el detalle de cada subdocumento: **período global activo**, `periodo_remuneracion.estado`, separación **mensual / vigencia / catálogo**, **estado mensual** en UI y **pantalla limpia** (no confundir “vacío” con “falta solo carga mensual oficial”).

## Principios

1. **Período de remuneración** es contexto global; la UI y Python deben respetar el período seleccionado o el activo según reglas del repo.
2. **Tres capas de datos:** valores **mensuales** del período; tablas con **vigencia** (histórico); **catálogos globales** sin amarrar a un solo mes mal interpretado.
3. **Estado del período** (oficial vs borrador, sincronización, etc.) se documenta en los archivos de período y UI; no inventar estados en cliente sin contrato.
4. **UI** sigue tokens y guías: [`../../ui-form-guidelines.md`](../../ui-form-guidelines.md), [`../../ui-tables.md`](../../ui-tables.md).

## Completitud mensual operativa

El estado visual de Parametros no debe depender solo de `periodo_remuneracion.estado` ni de la existencia de una fila en `parametros_generales`. La UI calcula completitud mensual con `evaluarCompletitudParametrosMensual(...)`, agrupando:

- datos oficiales mensuales (`parametros_generales`, tramos de carga, tramos de impuesto, tabla impuesto unico, Ley 16.744);
- configuracion cliente (`parametros_generales_cliente`);
- vigencias aplicables (AFP, salud, AFC, reforma previsional, trabajo pesado y parametros legales);
- consistencia oficial vs cliente;
- estado tecnico.

`parametros_generales` es snapshot oficial mensual y sirve para comparacion. El guardado normal de Parametros persiste configuracion cliente; no debe sobrescribir el snapshot oficial central. Cuando existan diferencias oficial/cliente se marca advertencia y no se considera cerrado hasta que exista confirmacion o flujo controlado.

## Flujo operativo UI

- Guardar en Parametros no cierra periodo: solo persiste `parametros_generales_cliente`.
- Mostrar referencia anterior no carga el mes y no suma completitud oficial.
- Usar referencia anterior como base crea/prepara una configuracion cliente del periodo actual solo despues de que el usuario confirme y guarde.
- Carga oficial mensual sigue viniendo por Python o accion mensual controlada sobre `parametros_generales` y tablas mensuales.
- Si llegan oficiales despues de configurar cliente y existen diferencias, la UI marca `Pendiente de reconciliacion` y permite actualizar `parametros_generales_cliente` con oficiales, mantener la configuracion o revisar despues. La decision queda persistida de forma minima en `parametros_generales_cliente`; no modifica `parametros_generales` ni incorpora auditoria avanzada.
- El cierre completo y la validacion final de periodo quedan fuera de esta fase.

## Documentos de detalle

| Tema | Archivo |
|------|---------|
| Clasificación período / vigencia / catálogo | [`periodo-vigencia-catalogo.md`](./periodo-vigencia-catalogo.md) |
| Estándar visual `/parametros` | [`ui-parametros.md`](./ui-parametros.md) |
| Campos y listas | [`campos-y-listas.md`](./campos-y-listas.md) |
| Python carga mensual y seeds | [`python-carga-mensual.md`](./python-carga-mensual.md) |
| Reforma / gradualidad | [`reforma-gradualidad.md`](./reforma-gradualidad.md) |
| Sync v6.11 | [`sync-parametros-v611.md`](./sync-parametros-v611.md) |
| Permisos ejemplo | [`permisos-bd-ejemplo.sql`](./permisos-bd-ejemplo.sql) |

## Pruebas

Ver [`tests-parametros.md`](./tests-parametros.md).


## Regla canonica de completitud 2026-05-10

La completitud estricta de Parametros no debe bloquear operacion parcial durante el mes. Debe reservarse para cierre, reconciliacion o carga final del periodo.
