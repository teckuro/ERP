# Nómina mensual - visión futura

## Mensaje corto

El **proceso mensual de remuneraciones** (checklist guiado, cálculo, cierre) **aún no está implementado** de forma productiva en la app; este documento evita ambigüedad con la ficha empleado y con parámetros.

## Orden lógico esperado (sin saltos)

Alineado a [`../../orquestador/contexto-proyecto.md`](../../orquestador/contexto-proyecto.md) §12:

1. Empleados **aptos** (ficha válida y validación explícita según contrato).
2. **Parámetros** del período (mensual, vigencias, catálogos).
3. **Conceptos** gobernados.
4. **Haberes recurrentes** y luego **movimientos variables**.
5. Proceso mensual → motor → **liquidaciones congeladas** → integraciones (Previred, LRE, reportes).

## Qué no construir antes de tiempo

Ver [`../../orquestador/contexto-proyecto.md`](../../orquestador/contexto-proyecto.md) §15: motor de liquidación productivo, nómina masiva sin auditoría, etc.
