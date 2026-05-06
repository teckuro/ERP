# Dependencias entre fases

El éxito del proyecto ERP depende de identificar y gestionar las dependencias entre fases. Una fase puede bloquear el inicio o la finalización de otra si no se cumplen sus criterios de cierre. Esta matriz resume las relaciones de dependencia conocidas al 2026‑05‑05.

## Matriz de dependencias

| Fase | Depende de | Motivo | Comentarios |
|---|---|---|---|
| **SEG‑01 – Roles, permisos, JWT/RLS** | **Orden‑01 – Integración del roadmap** | El diseño de roles y permisos requiere definir primero el roadmap general y las fases que habilitarán los módulos. | No iniciar la implementación de seguridad sin un roadmap consolidado. |
| **Parámetros / periodo / vigencia / catálogo (Fase 1)** | **SEG‑01** | El módulo de parámetros necesita definir modelos de seguridad y roles para gestionar quién puede cargar o modificar datos sensibles. | La implementación de parámetros puede avanzar en paralelo como prototipo, pero no se puede liberar sin seguridad básica. |
| **Python / BD v11 / carga mensual (Fase 2)** | **Parámetros Fase 1** | La carga mensual de PreviRed sólo funciona correctamente si se han definido las tablas y vigencias de parámetros. | Bloquea la obtención de tasas actualizadas. |
| **Empleados – estados y aptitud (Fase 3)** | **Fase 1 Parámetros** | La creación de empleados debe validar parámetros vigentes (IMM, tasas, etc.). | |
| **Movimientos variables (Fase 9.4)** | **Haberes y descuentos (Fase 9.3)** | Los movimientos variables consumen conceptos definidos en haberes y descuentos, por lo que no se pueden calcular sin haber definido estas asignaciones. | |
| **Proceso mensual chileno: prevalidaciones (Fase 9.5A)** | **Fase 3 Empleados**, **Fase 9.3 Haberes y descuentos**, **Fase 9.4 Movimientos variables** | Las prevalidaciones requieren que existan empleados con aptitud, conceptos recurrentes y movimientos variables correctamente ingresados. | |
| **Motor de liquidación** | **Fase 9.5A Prevalidaciones** | El motor de liquidación no debe procesar la nómina sin pasar las prevalidaciones. | Se puede construir un prototipo antes, pero no liberar a producción. |
| **Previred / LRE** | **Motor de liquidación** | La exportación a Previred y al LRE requiere que la nómina esté correctamente calculada. | |

## Cómo utilizar esta matriz

1. **Planificación**: Antes de comenzar una fase, revise sus dependencias y asegúrese de que las fases previas están documentadas e implementadas al nivel necesario.
2. **Gestión de riesgos**: Si una fase depende de otra que está atrasada o con dificultades, evalúe acciones para mitigar el riesgo (por ejemplo, desarrollar en paralelo prototipos o preparar documentación). 
3. **Actualización**: Cada vez que se cree una nueva fase o cambien sus alcances, actualice esta matriz. Consulte `estado-fases.md` y `roadmap-operativo.md` para detalles adicionales.

Esta información se mantendrá viva a lo largo del proyecto y ayudará a coordinar a los equipos de desarrollo, QA y operación.
