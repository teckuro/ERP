# Impuesto único de segunda categoría

El impuesto único de segunda categoría grava las remuneraciones de los trabajadores dependientes.  Aunque el detalle del cálculo se tratará en un documento específico del motor de liquidación, este archivo resume las disposiciones generales.

## Características generales

* Se aplica a las **remuneraciones mensuales imponibles** de los trabajadores sujetos al Sistema Integrado de Impuestos.
* Es un impuesto progresivo que utiliza una **tabla mensual** definida por el Servicio de Impuestos Internos (SII).  La tabla se actualiza periódicamente y debe considerarse la vigencia correspondiente.
* El empleador actúa como **agente retenedor** y está obligado a declarar y enterar el impuesto en la forma y plazos que determina el SII.

## Implementación en el ERP

* La **tabla de tramos y tasas** debe almacenarse en `tabla_impuesto_unico` y versionarse por vigencia (`vigencia_inicio` / `vigencia_fin`).  Al cargar esta tabla se genera un campo `periodo` que corresponde al mes de inicio, aunque la clasificación oficial se basa en la vigencia.  Consulte `decisiones-pendientes.md` para una discusión sobre este diseño.
* El cálculo del impuesto y la liquidación del sueldo líquido se abordarán en una fase posterior del proyecto (motor de liquidación).  Por ahora, este documento fija la referencia normativa.

Para más información, revise los manuales del SII y la sección de **renta** en la Ley sobre Impuesto a la Renta.


## Contrato de datos

Este impuesto se estructura en una **tabla de tramos** que debe cargarse y versionarse mensualmente.  Cada fila de la tabla representa un rango de renta y su factor de cálculo.

| Campo | Uso |
|------|-----|
| `periodo` | Mes operativo mostrado en la UI. Se deriva de `vigencia_inicio`. |
| `vigencia_inicio` | Fecha desde la cual aplica la tabla o tramo (inclusive). |
| `vigencia_fin` | Fecha final hasta la cual aplica la tabla (si existe). |
| `desde` | Renta líquida imponible desde la cual comienza a aplicarse el tramo. |
| `hasta` | Renta líquida imponible hasta la cual termina el tramo. Para el último tramo se indica cero o `null`. |
| `factor` | Porcentaje o factor de cálculo aplicable al tramo. |
| `rebaja` | Cantidad fija a descontar en el cálculo de la retención para ese tramo. |
| `tasa_maxima` | Tasa efectiva máxima de referencia, útil para simulaciones. |

El diseño de esta tabla responde al debate sobre si el impuesto debe modelarse como **vigencia** (con fechas) o **periodo mensual**.  En esta versión se adopta un esquema de **vigencia** con derivación de `periodo`, lo que permite cargar cambios con anticipación y mantener registros históricos.

## Fuente normativa

| Campo | Valor |
|---|---|
| **Fuente oficial** | Servicio de Impuestos Internos (SII) |
| **Documento / página** | Tablas mensuales del Impuesto Único de Segunda Categoría |
| **URL oficial** | [www.sii.cl](https://www.sii.cl/) |
| **Fecha de vigencia** | Variable (actualizado mensualmente) |
| **Fecha de revisión documental** | 2026-05-05 |
| **Tipo de dato ERP** | TABLA / VIGENCIA |
| **Módulo responsable** | Parámetros / Nómina |
