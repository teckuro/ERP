# Remuneración imponible y no imponible

## Concepto de remuneración

El **artículo 41** del Código del Trabajo define la remuneración como las contraprestaciones en dinero y las adicionales en especie, avaluables en dinero, que el empleador paga al trabajador por causa del contrato.  Esta definición es el punto de partida para determinar qué haberes son imponibles y qué pagos se excluyen de la base de cotizaciones.

### Exclusiones

No constituyen remuneración — y, por tanto, no forman parte de la base imponible ni se consideran para el sueldo base — los siguientes pagos:

1. **Asignación de locomoción** y **asignación por desgaste de herramientas**.
2. **Asignación de colación** y **viáticos** por gastos de alojamiento y desplazamiento.
3. **Asignación familiar** y subsidio único familiar.
4. **Indemnizaciones** por término de contrato o despido.
5. **Reembolsos de gastos** en que incurra el trabajador por cuenta del empleador.

Estos conceptos deben registrarse en el ERP como haberes **no imponibles** y no deben alimentar el cálculo de cotizaciones ni el sueldo base.

### Elementos que constituyen remuneración

El **artículo 42** enumera las partidas que sí constituyen remuneración, entre ellas:

- **Sueldo base**: estipendio fijo pagado en intervalos regulares.  No puede ser inferior al Ingreso Mínimo Mensual vigente.
- **Sobresueldo** (horas extraordinarias): recargo mínimo del 50 % sobre la hora ordinaria.
- **Comisiones** sobre ventas u operaciones.
- **Participaciones** en utilidades u otros beneficios.
- **Gratificaciones**: repartos de utilidades o pagos fijos según el artículo 50.

En el ERP, los conceptos que afecten las cotizaciones o el sueldo líquido deben marcarse con los indicadores `afecta_imponible` y `afecta_liquido`.  La correcta clasificación de los haberes y descuentos permite que las validaciones y cálculos respeten la normativa.

## Fuente normativa

| Campo | Valor |
|---|---|
| **Fuente oficial** | Código del Trabajo |
| **Documento / página** | Artículos 41 y 42 – definición de remuneración |
| **URL oficial** | [www.dt.gob.cl](https://www.dt.gob.cl/) |
| **Fecha de vigencia** | Permanente |
| **Fecha de revisión documental** | 2026‑05‑05 |
| **Tipo de dato ERP** | CLASIFICACIÓN |
| **Módulo responsable** | Conceptos / Nómina |
