# Criterios de severidad de validaciones

Las prevalidaciones y reglas de negocio del ERP se clasifican según la severidad de su incumplimiento.  Esta clasificación determina si el sistema bloquea una operación, muestra una advertencia o simplemente informa un dato.  La siguiente tabla resume los niveles de severidad y su significado:

| Severidad | Significado | Permite continuar | Ejemplo |
|---------|-------------|-------------------|---------|
| **BLOQUEO** | Impide validar o calcular; el usuario debe corregir el problema antes de continuar. | No | Falta el valor del Ingreso Mínimo Mensual para el periodo. |
| **ADVERTENCIA** | Permite continuar con la operación, pero advierte de un riesgo o de un dato opcional faltante. | Sí | Falta un dato opcional de contacto en la ficha del empleado. |
| **INFO** | Sólo informa contexto; no bloquea ni advierte. | Sí | El periodo hereda parámetros del mes anterior. |
| **OK** | La validación se supera correctamente. | Sí | Todos los parámetros requeridos están cargados. |

Los módulos deberán asignar una severidad a cada regla de validación.  Esto ayuda a priorizar la atención del usuario y a asegurar que los bloqueos se apliquen sólo cuando exista un incumplimiento normativo grave.
