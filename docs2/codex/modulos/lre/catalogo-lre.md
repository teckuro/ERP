# Catalogo LRE

El catalogo LRE vincula conceptos internos del ERP con codigos oficiales requeridos para el Libro de Remuneraciones Electronico.

## Reglas

- Un concepto puede existir sin codigo LRE mientras no participe en una exportacion oficial.
- Antes de exportar, todo concepto usado en liquidaciones debe tener clasificacion revisada.
- Los conceptos deben distinguir haberes, descuentos, aportes e informacion no remuneracional cuando aplique.
- Las decisiones de mapeo deben quedar auditables.

## Dependencias

- Conceptos de remuneracion gobernados.
- Liquidaciones reales generadas por motor.
- Validaciones previas LRE.

## Fuera de alcance DOC-04

No se crean tablas ni seeds. Cualquier cambio fisico debe esperar DB-01 y una fase LRE especifica.