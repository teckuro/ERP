# Errores comunes y rectificaciones en el LRE

Al enviar el Libro de Remuneraciones Electrónico (LRE) pueden producirse errores que obliguen a corregir la información y enviar una rectificación.� Esta guía describe los problemas más frecuentes y cómo solucionarlos.

## Errores comunes

1. **Estructura inválida**: el archivo no cumple con el formato requerido (separador incorrecto, columnas adicionales, campos faltantes).� La plataforma rechaza el envío.� **Solución:** verificar la estructura en `estructura-archivo-lre.md` y generar nuevamente el archivo.
2. **Códigos LRE incorrectos**: se utilizaron códigos que no existen en el catálogo oficial o que no corresponden al concepto.� **Solución:** revisar el mapeo de conceptos internos con `catalogo_lre` y corregir los códigos.
3. **Datos incoherentes**: los totales de haberes, descuentos o cotizaciones no coinciden entre sí o el sueldo líquido no cuadra con la suma de los componentes.� **Solución:** revisar los cálculos en el módulo de nómina y corregir los registros antes de generar el archivo.
4. **Períodos duplicados**: se intenta cargar un periodo que ya fue enviado y aceptado.� **Solución:** usar el mecanismo de rectificación para modificar un periodo ya informado en lugar de reenviarlo como nuevo.
5. **RUT inválido**: los RUT de empleador o trabajador tienen formato incorrecto o dígito verificador erróneo.� **Solución:** validar los RUT en la base y corregirlos antes del envío.

## Rectificaciones

Cuando la DT observa o rechaza un archivo, el empleador debe enviar una **rectificación**.� Este proceso implica:

1. Identificar el archivo original y el motivo de la rectificación (observación o rechazo).
2. Corregir los datos que generaron el error en el ERP.
3. Generar un nuevo archivo LRE marcándolo como **rectificación** y asociándolo al envío original.� El formato es el mismo que el de carga inicial.
4. Enviar la rectificación a la plataforma MiDT y guardar el nuevo comprobante.

Es importante conservar los comprobantes tanto del archivo original como de la rectificación y registrar en el ERP la fecha y hora de cada envío.� Las rectificaciones deben cumplir con las mismas reglas de vigencia y plazos que la carga inicial.

Para entender los estados posibles de un envío, consulte `estados-envio-lre.md`.