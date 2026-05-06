# Matriz de bloqueos por periodo

Esta matriz describe las validaciones mínimas que debe superar un periodo de nómina antes de permitir su cálculo o cierre.  Cada bloqueo indica el origen del problema, la severidad y la acción sugerida.

| Código | Causa | Severidad | Acción sugerida |
|------|------|----------|----------------|
| **BLK‑IMM** | Falta el Ingreso Mínimo Mensual del periodo en `parametros_generales`. | BLOQUEO | Cargar el IMM vigente en Parámetros. |
| **BLK‑CONTRATO** | El trabajador no tiene un contrato activo durante el periodo. | BLOQUEO | Activar o crear el contrato en el módulo Empleados. |
| **BLK‑HABER‑VENCIDO** | Un haber recurrente tiene `vigencia_fin` anterior al periodo. | ADVERTENCIA | No integrar el haber; revisar vigencia. |
| **BLK‑CONCEPTO‑INACTIVO** | El concepto asociado a un haber o descuento está inactivo o vencido. | BLOQUEO | Revisar el catálogo de conceptos o su vigencia. |
| **BLK‑PARAM‑INCONSISTENTE** | Existe una incoherencia entre parámetros relacionados (p. ej., tope de gratificación distinto de 4,75 IMM). | ADVERTENCIA | Revisar los parámetros y corregir la relación. |

Esta matriz sirve como referencia para la implementación de prevalidaciones automáticas.  Los códigos de bloqueo se deben reflejar en la interfaz de usuario, acompañados de un mensaje explicativo y un enlace al módulo correspondiente para subsanar el problema.
