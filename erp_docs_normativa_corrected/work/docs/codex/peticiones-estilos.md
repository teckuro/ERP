# Bitacora de peticiones de estilos

Las solicitudes de cambios visuales y mejoras de UI se registran aqui para mantener la trazabilidad de cuando y donde se aplicaron. No sustituyen las guias de `AGENTS.md`, pero documentan excepciones y ajustes especificos en el tiempo.

| Fecha (AAAA-MM-DD) | Modulo/Area | Cambio | Archivos afectados |
|--------------------|-------------|--------|--------------------|
| 2026-05-04 | Proceso mensual (Nomina) | Se anadio un resumen con conteos de asignaciones recurrentes y grupos de parametros debajo del resumen existente; se incluye una linea compacta “Parametros (grupos)” sin valores literales. | `proceso-mensual-container.html`, `proceso-mensual-container.spec.ts` |
| 2026-05-03 | Proceso mensual (Nomina) | Se retiraron cifras normativas y totales demo (UF, sueldos) y se agregaron pasos marcados como no disponibles; se anadio enlace a Parametros. | `proceso-remuneraciones.page.ts` |
| 2026-05-03 | Movimientos variables | Se anadio pantalla `/remuneraciones/movimientos-variables` con cabecera estilo Haberes, filtro por mes y `DataGrid` con chips de estado; se enlaza desde Haberes. | Contenedores y rutas de movimientos variables |
| 2026-05-03 | Haberes y descuentos | Se integro filtro de vigencia en el panel de filtros con opciones Operativas, Todas, Activas, Futuras, Vencidas, Cerradas e Invalidas; acciones de cierre se ajustaron para no permitir cierres dobles. | `haberes-descuentos-container` |
| 2026-05-03 | Conceptos (detalle) | El modal de detalle fue ajustado con header fijo, scroll en el cuerpo y footer fijo, se anadieron chips de vigencia y estilos distintivos para registros invalidos. | `conceptos-remuneracion-container` |

Para solicitudes detalladas consulte el registro completo original. Los cambios aqui descritos son consolidaciones de las fechas clave. 
Las mejoras visuales futuras deben documentarse en esta bitacora con fecha, modulo, descripcion y archivos modificados.
