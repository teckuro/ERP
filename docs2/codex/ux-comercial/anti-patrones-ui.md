# Anti-patrones UI del ERP

## Objetivo

Registrar errores visuales que deben evitarse en futuras fases.

## Anti-patrones

| Anti-patron | Por que afecta | Como corregir |
|---|---|---|
| Pantalla como tabla gigante | No guia decision | Agregar estado, resumen y CTA arriba. |
| Botones sin jerarquia | El usuario no sabe que sigue | Un CTA primario y secundarios claros. |
| Texto tecnico como principal | Baja valor comercial | Traducir a lenguaje operativo. |
| Chips repetidos | Ruido visual | Agrupar estado y reducir duplicacion. |
| Cards infladas | Layout falso | Resolver altura en contenedor padre. |
| Empty state generico | No orienta | Explicar causa y accion. |
| Acciones futuras habilitadas | Promete lo que no existe | Deshabilitar con helper de fase futura. |
| Ocultar errores | Rompe confianza | Mostrar bloqueo con accion sugerida. |
| Redisenar por modulo sin patron | Inconsistencia | Usar patrones globales de `ux-comercial`. |

## Regla

Si una mejora visual no aclara estado, accion o confianza, probablemente es decoracion y debe esperar.
