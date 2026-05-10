# Validaciones previas al envío del LRE

Antes de generar y enviar el Libro de Remuneraciones Electrónico (LRE), el ERP debe ejecutar una serie de validaciones para asegurar que la información cumpla con las normativas vigentes y que la plataforma MiDT la acepte sin errores.

## Validaciones de datos

1. **Completeness**: verificar que todos los campos obligatorios estén presentes para cada trabajador y periodo.� Los campos vacíos o nulos deben reportarse y bloquear la generación del archivo.
2. **Vigencias de parámetros**: confirmar que las tasas de cotización, montos de asignación familiar, topes de gratificación y otros parámetros utilizados correspondan al periodo de remuneración.� Si falta un valor vigente, se debe bloquear la exportación.
3. **Códigos LRE**: comprobar que cada concepto de haberes y descuentos esté asociado a un código válido en el catálogo LRE.� Cualquier concepto sin código válido debe marcarse como error.
4. **Validación de RUT y fechas**: el formato de los RUT debe ser sin puntos ni guion, y las fechas deben respetar el formato `YYYY-MM-DD`.� Se deben validar los dígitos verificadores.
5. **Totales coherentes**: el total líquido pagado debe ser igual a la suma de los haberes imponibles y no imponibles menos las cotizaciones y descuentos.� Las diferencias deben advertirse o bloquearse según la política del empleador.
6. **Jornada y horas extraordinarias**: asegurar que la jornada registrada se ajuste a la normativa vigente (40, 42, 44 o 45� horas) y que las horas extraordinarias respeten el recargo mínimo del 50� %.

## Flujo de validación

1. **Preparación de datos**: al cierre del periodo de remuneración, el módulo de nómina genera los registros de cada trabajador con todos los haberes y descuentos.
2. **Ejecución de reglas**: se aplican las validaciones anteriores.� Los registros con errores se marcan y se informan al usuario para su corrección.
3. **Generación del archivo**: una vez que todos los registros pasan las validaciones, se genera el archivo CSV/TXT con separador punto y coma (`;`) siguiendo la estructura definida en `estructura-archivo-lre.md`.
4. **Revisión final**: el usuario descarga o revisa el archivo generado y confirma su envío.� El sistema puede incluir una vista previa para detectar problemas visuales (por ejemplo, columnas desordenadas o valores nulos).
5. **Envío a la plataforma MiDT**: el archivo se carga en el portal oficial.� Se debe registrar el estado del envío y almacenar el comprobante que emita la Dirección del Trabajo.

Para conocer los posibles estados y cómo gestionarlos, consulte `estados-envio-lre.md`.