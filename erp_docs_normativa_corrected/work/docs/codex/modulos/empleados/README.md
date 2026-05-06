# Modulo Empleados — guia general

## Objetivo

Gestionar el ciclo de vida del trabajador en el sistema, incluyendo creacion (basica y avanzada), borrador, ficha, validacion para remuneraciones y pruebas. Este modulo define los estados de la ficha, las acciones disponibles y los flujos permitidos.

## Alcance

- Listado y estados visuales de empleados.
- Creacion basica y avanzada.
- Ficha de empleado con secciones de datos personales, contacto, contrato, prevision y bancario.
- Validacion de la ficha para remuneraciones.
- Pruebas unitarias y de integracion (no documentadas aqui).

## Fuera de alcance

- Calculo de liquidaciones o nomina mensual.
- Configuracion de roles y permisos (definido en la fase SEG‑01).
- Persistencia y modelos SQL especificos (ver BD v11 para detalles).

## Documentos relacionados

| Documento | Descripcion |
|-----------|-------------|
| `contrato-general.md` | Define estados, completitud y aptitud de empleados. |
| `flujo-creacion-basica.md` | Describe el flujo de alta basica desde el listado. |
| `flujo-creacion-avanzada.md` | Describe el wizard de alta avanzada y el manejo de borradores. |
| `ficha-empleado.md` | Describe la estructura de la ficha y las acciones de validacion. |

## Orden de lectura

1. `contrato-general.md` — marco de negocio y datos.
2. `flujo-creacion-basica.md` o `flujo-creacion-avanzada.md` segun el flujo a implementar.
3. `ficha-empleado.md` para detalles de la ficha y reglas de validacion.
