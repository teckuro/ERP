# Conceptos de remuneracion – decisiones operativas

## Contexto

Durante la fase 9.2 se tomaron diversas decisiones de producto y diseno para el catalogo de conceptos. Estas decisiones resuelven brechas detectadas en el diagnostico y sientan las bases para futuras fases.

## Decisiones clave

1. **Listado base**: la grilla de conceptos muestra las columnas Nombre, Codigo, Tipo, LRE, Vigencia, Origen, Calculo y Asignable. 
   - Se anaden chips de vigencia (Vigente, Futuro, Vencido, Invalido).
   - El campo LRE muestra **No asignado** en gris cuando no corresponde.
   - Se habilitan filtros compactos por columna.

2. **Detalle del concepto**:
   - Se muestra en un modal con scroll interno y un footer fijo con acciones **Cerrar** y **Editar** (condicional).
   - Se incluyen listados de motivos y bloqueos en tipografia compacta.
   - La vigencia invalida se destaca con un chip de estilo distintivo.

3. **Asignabilidad**:
   - El campo `esConceptoAsignable` se calcula en servicio y se expone como campo booleano derivado.
   - Haberes y Movimientos variables consumen este campo para validar asignaciones manuales.
   - Conceptos no asignables aparecen deshabilitados en los selects.

4. **Integracion con Haberes y descuentos**:
   - `HaberesDescuentosService.listarConceptos` filtra conceptos asignables para el periodo de referencia.
   - La UI de Haberes muestra un hint sobre esta regla.

5. **Dependencias futuras**:
   - CRUD completo del catalogo, reglas de calculo en UI, roles/JWT, RLS y auditoria quedan fuera del alcance de la fase 9.2.
   - El motor de liquidaciones utilizara estos conceptos pero se documentara en una fase posterior.

## Pendientes

- Implementar permisos reales (JWT/RLS) para edicion de conceptos.
- Completar la experiencia de filtrado avanzado y ordenacion.
- Integrar reglas de calculo en el motor de remuneraciones.
