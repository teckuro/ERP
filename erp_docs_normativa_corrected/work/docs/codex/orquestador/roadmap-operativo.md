# Roadmap operativo

Este roadmap resume las fases planificadas del ERP de remuneraciones y su orden de ejecucion. 
Refleja decisiones actuales y esta sujeto a cambios a medida que se cierran fases y se identifican nuevas dependencias.

1. **SEG-01 – Roles y permisos** (en definicion)
   - Elaborar la matriz de roles y permisos.
   - Definir JWT/RLS para el backend.
   - Ajustar servicios y endpoints.
   - No incluye implementacion completa de RLS.

2. **9.2–9.3 – Conceptos y Haberes** (cerradas)
   - Consolidar catalogo de conceptos de remuneracion.
   - Implementar asignaciones recurrentes con filtros por vigencia.
   - Ajustar la UI para navegacion `/remuneraciones/*`.

3. **9.4 – Movimientos variables** (cerrada en documentacion)
   - Definir contrato funcional y modelo.
   - Implementar persistencia local y servicios.
   - UI basica para carga manual.

4. **9.5 – Proceso mensual y prevalidaciones** (parcialmente implementado)
   - Definir prevalidaciones por periodo.
   - Crear contenedor base y validaciones visuales.
   - Integrar con parametros, empleados y movimientos variables.
   - No incluye motor de calculo ni liquidaciones.

5. **Motor de liquidacion y calculo** (pendiente)
   - Disenar e implementar el motor de calculo de remuneraciones.
   - Integrar con Previred/LRE y generacion de liquidaciones.
   - Aplicar reglas de calculo definidas en concepto.

6. **RLS/JWT y roles finales** (pendiente)
   - Implementar seguridad a nivel de fila en BD y servicios.
   - Activar JWT real para usuarios y roles.
   - Completar integracion con Supabase.

Este roadmap acompana a `estado-fases.md` y se actualiza cuando se agregan o cierran fases. 
Cada fase nueva debe documentarse previamente en un contrato o documento de especificacion funcional.
