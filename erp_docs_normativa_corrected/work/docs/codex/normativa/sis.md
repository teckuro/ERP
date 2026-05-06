# Seguro de Invalidez y Sobrevivencia (SIS)

El Seguro de Invalidez y Sobrevivencia protege a las y los trabajadores en caso de invalidez o fallecimiento.  Este seguro se financia mediante una prima adicional sobre las remuneraciones imponibles y es administrado por las AFP.

## Estado de la tasa SIS

La Superintendencia de Pensiones publica periódicamente la prima del Seguro de Invalidez y Sobrevivencia. Sin embargo, en la última revisión (mayo de 2026) se encontraron **referencias contradictorias** sobre la tasa aplicable para 2026: algunas fuentes indican un 1,54 % desde enero de 2026, mientras que otras indican un 1,62 % a partir de abril de 2026. Ante esta discrepancia se recomienda **no hardcodear** una tasa fija en el cálculo de liquidaciones.

## Recomendaciones de implementación

* Registrar la tasa y su vigencia en una tabla de parámetros de SIS (por ejemplo `sis_parametro`) **sólo después de confirmarla** con la Superintendencia de Pensiones y los indicadores de Previred del mes. Hasta entonces, marcar la tasa como pendiente.
* Asociar la tasa confirmada al cálculo de cotizaciones previsionales en el módulo de Nómina. Si no existe una tasa vigente para el periodo de remuneración, el sistema debe **bloquear** la liquidación e informar al usuario.
* Validar mensualmente las actualizaciones de la tasa SIS consultando la Superintendencia de Pensiones y los indicadores de Previred. No deben cargarse tasas desde fuentes no oficiales.

## Fuente normativa

| Campo | Valor |
|---|---|
| **Fuente oficial** | Superintendencia de Pensiones |
| **Documento / página** | Informes de tasas del Seguro de Invalidez y Sobrevivencia |
| **URL oficial** | [www.spensiones.cl](https://www.spensiones.cl/) |
| **Fecha de vigencia** | Pendiente de confirmación (2026‑??‑??) |
| **Fecha de revisión documental** | 2026‑05‑05 |
| **Tipo de dato ERP** | VIGENCIA |
| **Módulo responsable** | Parámetros / Nómina |
