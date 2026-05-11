# Gratificación legal (artículo� 50)

El **artículo� 50** del Código del Trabajo regula la gratificación legal como una forma de participación en las utilidades de la empresa.  Consiste en que el empleador pague a sus trabajadores un porcentaje de las remuneraciones percibidas durante el año comercial.

## Modalidad del 25� %

Si el empleador paga a sus trabajadores **el 25� % de lo devengado por concepto de remuneraciones mensuales durante el ejercicio comercial**, queda eximido de repartir utilidades.  Esta gratificación está sujeta a un **tope de 4,75 Ingresos Mínimos Mensuales por trabajador**.  Para el cálculo del 25� % deben actualizarse las remuneraciones mensuales de acuerdo con la variación experimentada dentro del mismo ejercicio.

## Reglas en el ERP

* El módulo de **Nómina** debe incorporar la opción de calcular la gratificación legal ya sea en forma **proporcional** (25� % con tope) o como **reparto de utilidades**; la modalidad debe definirse en los parámetros de la empresa.
* La tabla `imm_gratificacion` (u otra estructura que defina el tope en 4,75� IMM) debe mantenerse actualizada en el módulo de **Parámetros**.
* Al calcular la gratificación, el sistema debe validar que la suma de gratificaciones pagadas no supere el tope y que el método elegido sea consistente con la política de la empresa.

Más detalles sobre la clasificación de haberes que constituyen remuneración se encuentran en `remuneracion-imponible-no-imponible.md`.

## Fuente normativa

| Campo | Valor |
|---|---|
| **Fuente oficial** | Código del Trabajo |
| **Documento / página** | Artículo� 50 y artículos relacionados |
| **URL oficial** | [www.dt.gob.cl](https://www.dt.gob.cl/) |
| **Fecha de vigencia** | Permanente |
| **Fecha de revisión documental** | 2026-05-05 |
| **Tipo de dato ERP** | TOPE / CÁLCULO |
| **Módulo responsable** | Nómina |
