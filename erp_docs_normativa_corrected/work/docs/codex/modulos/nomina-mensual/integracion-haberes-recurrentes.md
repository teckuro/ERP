# Integración de haberes recurrentes

Este documento explica cómo integrar los haberes recurrentes vigentes en el proceso de generación de la nómina mensual.  Los haberes recurrentes son prestaciones periódicas (p. ej. asignaciones permanentes, bonos mensuales) asociadas a un trabajador que se deben sumar a cada periodo de remuneración hasta su fecha de fin.

## Reglas de integración

1. **Vigencia**: El haber recurrente sólo se integra si su `vigencia_inicio` es anterior o igual al primer día del periodo y su `vigencia_fin` es nula o posterior al último día del periodo.
2. **Estado**: El haber debe estar en estado **ACTIVO**.  Los estados **INACTIVO** o **VENCIDO** no se integran.
3. **Asignabilidad**: El concepto asociado al haber debe estar marcado como asignable al empleado y no debe estar vencido ni inactivo.
4. **Multiplicidad**: Si un trabajador tiene más de un haber recurrente del mismo concepto, se suman los montos.  Se recomienda definir en el contrato de haberes si se permite o no la duplicidad.
5. **Bloqueos**: Si falta un parámetro requerido para calcular el haber (por ejemplo, el IMM para una gratificación proporcional), se genera un **BLOQUEO** y no se integra el haber.

## Flujo operativo

Al validar un periodo de nómina:

1. Obtener la lista de haberes recurrentes vigentes para cada empleado.
2. Filtrar aquellos que cumplan las reglas de vigencia, estado y asignabilidad.
3. Integrar los montos al pre‑liquidador y etiquetar el origen como “recurrente”.
4. Registrar advertencias o bloqueos según la severidad definida en `criterios-severidad.md`.

Esta integración debe ejecutarse antes del cálculo final de la remuneración líquida y puede repetirse cada vez que se modifiquen parámetros o contratos durante la validación del periodo.
