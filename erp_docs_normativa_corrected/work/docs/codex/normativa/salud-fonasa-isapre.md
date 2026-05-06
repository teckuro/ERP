# Salud: Fonasa e Isapres

El Sistema de Salud chileno contempla dos alternativas para los trabajadores: el Fondo Nacional de Salud (Fonasa) y las Instituciones de Salud Previsional (Isapres).  En ambos casos el aporte mínimo legal es del **7 %** de la remuneración imponible, pero en las Isapres el afiliado puede contratar un plan que supere ese monto.

## Fonasa

* Los afiliados a Fonasa aportan un 7 % de su remuneración imponible.
* No existen planes diferenciados; el aporte se calcula sobre la base imponible hasta el tope legal de salud.

## Isapres

* Las Isapres ofrecen planes de salud cuyo valor puede ser superior al 7 %.
* La diferencia entre el plan y el 7 % se descuenta como cotización voluntaria.

## Implementación en el ERP

* Definir las tablas `salud` (institución: Fonasa o Isapre) y `salud_plan` (plan específico en Isapres) para modelar las entidades de salud y sus planes.
* Asociar a cada empleado el plan de salud (`empleado.plan_salud_id`).
* Al calcular las cotizaciones, aplicar el 7 % legal y registrar cualquier diferencia del plan como cotización adicional del trabajador.

## Fuente normativa

| Campo | Valor |
|---|---|
| **Fuente oficial** | Código del Trabajo / Superintendencia de Salud |
| **Documento / página** | Leyes sobre cotización de salud (Fonasa e Isapres) |
| **URL oficial** | [www.supersalud.gob.cl](https://www.supersalud.gob.cl/) |
| **Fecha de vigencia** | Permanente (7 % mínimo) |
| **Fecha de revisión documental** | 2026‑05‑05 |
| **Tipo de dato ERP** | PLAN / VIGENCIA |
| **Módulo responsable** | Parámetros / Empleados / Nómina |
