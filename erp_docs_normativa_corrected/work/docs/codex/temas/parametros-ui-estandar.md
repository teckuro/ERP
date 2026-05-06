# Parámetros – UI estándar

La interfaz de usuario del módulo **Parámetros** debe ser consistente y fácil de usar, ya que es el punto de entrada para la carga de valores legales y empresariales que afectan a toda la nómina. A continuación se definen los patrones y componentes recomendados.

## Principios generales

* **Uniformidad**: todas las pantallas de parámetros deben compartir la misma estructura: título, descripción, formulario de edición y tabla de vigencias o registros. Esto facilita la navegación y la formación de los usuarios.
* **Separación de vigencias**: distinguir claramente entre parámetros de **periodo mensual** y parámetros de **vigencia** (con fecha de inicio y fin). Para los primeros se mostrará un campo de periodo (`YYYY‑MM`), y para los segundos se incluirán dos campos de fecha.
* **Validación inline**: los campos deben validar su formato y obligatoriedad al perder el foco. Los mensajes de error deben aparecer debajo del campo en color rojo y con un texto claro (por ejemplo, “El valor no puede estar vacío” o “La fecha de inicio debe ser anterior a la fecha de fin”).
* **Edición modal o en línea**: permitir la creación y edición de registros mediante un diálogo modal o inline en la tabla. Las acciones de guardar y cancelar deben ser accesibles y mostrar confirmaciones antes de descartar cambios.
* **Historial y auditoría**: mostrar en una tabla la lista de valores vigentes y pasados de cada parámetro, con sus fechas de vigencia, usuario que modificó y fecha de modificación. Esto ayuda a auditar cambios y a revertirlos si es necesario.

## Componentes comunes

| Componente | Uso |
|---|---|
| **Selector de periodo** | Campo de selección de año y mes (`YYYY‑MM`) para parámetros mensuales, con validación que impida seleccionar periodos futuros no permitidos. |
| **Calendario de vigencia** | Campos de fecha para `vigencia_inicio` y `vigencia_fin`, con indicador opcional de “vigencia indefinida” (fin en blanco). |
| **Campo numérico monetario** | Entrada para valores en pesos o porcentajes, con formateo automático de miles y decimales. Debe admitir configuraciones de moneda y porcentaje. |
| **Tabla de registros** | Lista de registros existentes con botones de **editar**, **duplicar vigencia** (pre‑llenar campos con la última vigencia) y **eliminar**. |
| **Formulario de carga masiva** | Para parámetros que provienen de PreviRed u otras fuentes, incluir un componente de carga de archivos CSV/TXT y un log de resultados. |

## Estilo y accesibilidad

* Utilizar los estilos definidos en `estilos/README.md` y `ui-form-guidelines.md`: colores consistentes, tipografía legible y espaciado adecuado.
* Asegurar que todos los controles sean accesibles mediante teclado y que los formularios incluyan etiquetas (`label`) asociadas a cada campo.
* Mostrar estados de carga y mensajes de éxito o error al guardar los parámetros.

Esta guía evolucionará con el avance del proyecto. Cualquier componente nuevo o variación debe documentarse aquí para mantener la coherencia de la interfaz.
