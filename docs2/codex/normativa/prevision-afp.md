# AFP y cotizaciones previsionales

Las administradoras de fondos de pensiones (AFP) reciben las cotizaciones obligatorias de los trabajadores dependientes.  La tasa de cotización se compone de un **10� % de ahorro obligatorio** más una **comisión** que varía según la AFP.  El Seguro de Invalidez y Sobrevivencia (SIS) se registra en un documento aparte.

## Obligaciones del empleador

* Retener y declarar mensualmente el aporte obligatorio de cada trabajador.
* Pagar la cotización adicional correspondiente a la comisión de la AFP y las primas de seguros.
* Mantener informado al trabajador sobre su AFP y las tasas vigentes.

## Implementación en el ERP

* Registrar las AFP en la tabla `afp` (catálogo) con su identificación y datos básicos.� Las tasas y comisiones vigentes se almacenan en la tabla `afp_vigencia` con campos `id_afp`, `vigencia_inicio`, `vigencia_fin`, `tasa_obligatoria` y `comision`.
* Asociar cada empleado a una AFP mediante el campo `empleado.afp_id`.
* Validar que al crear o actualizar un empleado exista una AFP con tasas vigentes para la fecha de inicio del contrato; de lo contrario se debe bloquear la creación o actualización.

## Fuente normativa

| Campo | Valor |
|---|---|
| **Fuente oficial** | Superintendencia de Pensiones / Código del Trabajo |
| **Documento / página** | Normas sobre cotizaciones obligatorias y comisiones de las AFP |
| **URL oficial** | [www.spensiones.cl](https://www.spensiones.cl/) |
| **Fecha de vigencia** | Variable según AFP y año |
| **Fecha de revisión documental** | 2026-05-05 |
| **Tipo de dato ERP** | VIGENCIA |
| **Módulo responsable** | Parámetros / Empleados / Nómina |
