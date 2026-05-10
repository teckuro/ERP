# Estados de envío del LRE

Una vez generado el archivo del Libro de Remuneraciones Electrónico (LRE) y cargado en la plataforma MiDT, es importante registrar y seguir el estado de la declaración.� Estos estados permiten gestionar adecuadamente los acuses de recibo, correcciones y eventuales rectificaciones.

## Estados principales

| Estado | Descripción | Acción en el ERP |
|---|---|---|
| **Borrador** | El archivo ha sido generado pero aún no se ha enviado a la plataforma. | El usuario puede revisar y modificar los datos antes de la carga. |
| **Enviado** | El archivo fue cargado en la plataforma MiDT, pero todavía no existe una respuesta. | Registrar fecha y hora de envío y esperar confirmación. |
| **Aceptado** | La DT y el SII han aceptado el archivo; no se requieren correcciones. | Guardar el comprobante y bloquear nuevas modificaciones para ese periodo. |
| **Observado** | El archivo fue revisado y la DT solicitó aclaraciones o correcciones. | Mostrar las observaciones al usuario y permitir la generación de un archivo de rectificación. |
| **Rechazado** | El archivo fue rechazado por errores en la estructura o datos. | Generar un nuevo archivo corrigiendo los errores y reenviarlo. |
| **Rectificado** | Se presentó una rectificación que subsana observaciones o errores. | Marcar la versión anterior como rectificada y asociar el nuevo archivo. |

## Seguimiento

* Cada envío debe registrar el identificador otorgado por la plataforma MiDT y el comprobante de recepción, de modo que se pueda demostrar el cumplimiento ante fiscalizaciones.
* El ERP debe permitir filtrar los envíos por estado, periodo y empresa, facilitando la trazabilidad de la información enviada.
* Las rectificaciones deben mantener la relación con el envío original, indicando el motivo de la corrección y la fecha en que se realizó.

Consulte `errores-y-rectificaciones-lre.md` para más información sobre los tipos de errores y cómo corregirlos.