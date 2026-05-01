# Tablas ERP y DataGrid

Este documento define el estándar oficial para tablas, listados y grillas del ERP. Complementa el contrato visual de [`AGENTS.md`](./AGENTS.md), las reglas de formularios de [`ui-form-guidelines.md`](./ui-form-guidelines.md) y las reglas de altura/ancho de [`estilos/README.md`](./estilos/README.md).

## Diagnóstico Inicial

- Componente reutilizable principal: `src/app/shared/components/ui/data-grid.component.ts`.
- Usos principales del DataGrid: listado de empleados, Parámetros, Haberes y descuentos, Conceptos de remuneración.
- Tablas propias simples: páginas de Proceso Remuneraciones, Liquidaciones y Licencias Médicas usan `<table>` local en vistas de bajo alcance o placeholders.
- Columnas repetidas: código, nombre, tipo, período/vigencia, valor/monto/porcentaje, estado y acciones.
- Filtros repetidos: búsqueda textual, estado, tipo, vigencia/período, institución o trabajador según módulo.
- Acciones repetidas: crear, refrescar, exportar, editar, ver/continuar, desactivar/eliminar con confirmación.
- Riesgos observados: columnas técnicas visibles en algunos catálogos, formatos de vacío/porcentaje no uniformes, filtros de vigencia nombrados como período en algunos casos, y tablas propias sin el patrón completo de toolbar/empty/loading.

## Principio

Una tabla ERP muestra información operativa útil, no estructura técnica de base de datos. Debe permitir responder rápido:

- Qué registro es.
- A qué período o vigencia corresponde.
- En qué estado está.
- Cuál es el dato principal.
- Qué acción puede ejecutar el usuario.
- Si hay algo pendiente o bloqueado.

## Qué Mostrar

Columnas recomendadas:

- Identificación funcional: nombre, RUT, código, concepto, institución, período, tipo o categoría.
- Estado operativo: activo, inactivo, borrador, en proceso, vigente, vencido, pendiente, bloqueado, solo lectura, incompleto.
- Datos clave de negocio: sueldo base, valor, porcentaje, monto, tope, tasa, vigencia, cantidad, tramo, institución.
- Fechas relevantes: vigencia inicio, vigencia fin, fecha ingreso, fecha término, última actualización si aporta.
- Acciones principales: ver, editar, continuar alta, activar/desactivar, duplicar, descargar, revisar.

Los estados deben mostrarse como chip/badge cuando exista patrón en la pantalla. Evitar texto largo en celdas.

## Qué No Mostrar

No mostrar por defecto:

- IDs técnicos: `id_persona`, `id_contrato`, `id_catalogo`, UUID, foreign keys o ids internos de relación.
- Auditoría técnica: `created_at`, `updated_at`, `deleted_at`, `created_by`, `sync_id`, `raw_payload`, JSON.
- Booleanos crudos: `true`, `false`, `1`, `0`, `S`, `N` sin contexto.
- Estados crudos: `EN_PROCESO`, `BORRADOR`, `ACTIVO`, `INCOMPLETO`, `NULL`, `undefined`, `NaN`.
- Valores temporales del sistema: `DRAFT-*`, defaults técnicos, cuenta temporal, banco técnico o fechas usadas solo para persistir borrador.
- Textos largos: observaciones, notas internas extensas, payload o JSON. Usar detalle, tooltip, modal o ficha.

Excepciones: folio, número de ficha, código interno visible o número de liquidación si el usuario lo usa funcionalmente.

## Orden de Columnas

Orden base:

1. Identificador humano.
2. Nombre o descripción corta.
3. Tipo o categoría.
4. Período o vigencia.
5. Valor principal.
6. Estado.
7. Última actualización si aplica.
8. Acciones.

Ejemplos:

- Empleados: RUT, nombre, cargo, sucursal/centro, estado, fecha ingreso o actualización, acciones.
- Parámetros: período, parámetro/tramo/institución, valor/porcentaje, vigencia inicio, vigencia fin, estado, acciones.
- Haberes y descuentos: trabajador si no está seleccionado, concepto, tipo, monto/porcentaje, vigencia, estado, acciones.
- Conceptos de remuneración: código, nombre, tipo, clasificación LRE, automático/manual, vigencia, estado, acciones.

## Formatos

- Montos CLP: `$ 500.000`, `$ 0`, o `Sin información` si corresponde.
- Porcentajes: `10,00 %`, `1,44 %`, `0,00 %`.
- UF/UTM/UTA: etiquetar explícitamente como UF, UTM, UTA o CLP. Evitar `$` ambiguo.
- Fechas: usar formato consistente de proyecto en tablas, preferentemente `dd-mm-aaaa` o `dd/mm/aaaa` si el componente ya lo estandariza. No mezclar ISO visible con formatos locales en la misma tabla.
- Vacíos: `—`, `Sin información`, `No aplica` o `Pendiente` según contexto.
- Booleanos: `Sí/No`, `Activo/Inactivo`, `Vigente/No vigente`, `Aplica/No aplica`, `Automático/Manual`.

## Filtros

Cada tabla debe tener filtros útiles, no todos los campos.

Filtros base:

- Búsqueda general.
- Período.
- Estado.
- Tipo/categoría.
- Vigencia.
- Institución o trabajador si aplica.

Reglas:

- Los filtros más usados quedan visibles.
- Si hay muchos filtros, usar colapso o configuración.
- No mostrar 8 o 10 filtros de golpe salvo mantenedores densos.
- Si el filtro representa vigencia, llamarlo `Vigencia inicio` o `Vigencia fin`, no `Periodo`.
- Botones `Buscar` y `Limpiar` van juntos y alineados.

## Toolbar

La toolbar estándar incluye:

- Título y contador arriba a la izquierda.
- Acciones arriba a la derecha: crear, refrescar, exportar, columnas, filtros.
- Selector de cantidad por página cuando aporte.

Reglas:

- No mostrar acciones que no funcionan.
- No dejar botones deshabilitados sin razón clara.
- Iconos con `title`/`aria-label` cuando no tienen texto.
- Acción primaria visible y específica.

## Loading, Empty State y Paginación

- Loading dentro del área de tabla; no bloquear toda la página si solo carga el listado.
- Mantener altura estable del contenedor de tabla.
- Empty state con icono discreto, título específico, mensaje útil y acción opcional.
- Evitar `Sin datos` como único texto.
- Paginación abajo de la tabla, con página actual, total si existe, y botones claros.

## Acciones por Fila

- Acciones al final de la fila.
- Máximo dos acciones visibles.
- Si hay más, usar menú `Más`.
- Acción principal visible: ver ficha, editar, continuar alta o revisar.
- Acciones destructivas en menú o con confirmación.
- Evitar iconos sin texto si el contexto no es evidente.

## Responsive

Desktop:

- Tabla completa, filtros en grilla y acciones visibles.

Ancho medio:

- Scroll horizontal interno al componente si hace falta.
- No scroll horizontal global.
- Mantener columnas clave visibles.

Mobile:

- Usar tarjetas por registro cuando el DataGrid lo permita.
- Si se mantiene tabla, scroll interno controlado.
- No ocultar identificador, nombre/concepto, estado ni acción principal.

Columnas que pueden ocultarse primero: última actualización, detalles secundarios, campos numéricos secundarios y columnas no críticas.

## Checklist por Módulo

- Parámetros: mantener vigencia clara, estados como vigente/inactivo, porcentajes con `%`, empty states por período y sin ids técnicos.
- Empleados: mostrar RUT, nombre, cargo/centro, estado y acción principal. Borradores como `Borrador` o `En proceso`, no defaults técnicos.
- Haberes y descuentos: mostrar trabajador si aplica, concepto, tipo, monto/porcentaje, vigencia, estado y acciones. No mostrar ids ni payload.
- Conceptos de remuneración: mostrar código, nombre, tipo, clasificación LRE, automático/manual, vigencia, estado y acciones. Ocultar campos de sistema por defecto.
- Proceso, Liquidaciones, Licencias y Reportes: migrar tablas propias al DataGrid cuando necesiten filtros, paginación, loading o acciones consistentes.
