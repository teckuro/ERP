# Estado de fases del proyecto

Este documento presenta el estado de cada fase definida en el proyecto ERP de remuneraciones.  Para evitar confusión entre la documentación y la implementación real, cada fase se evalúa con dos criterios:

* **Estado documental**: indica si la documentación está completa (`Cerrado documental`), en elaboración (`En definición`) o si faltan insumos.
* **Estado de implementación**: refleja el avance real en el código (`Implementado parcial`, `Validado funcionalmente`, `Pendiente de implementación`, etc.).

Además, se indica si la fase bloquea el avance de fases posteriores.  Una fase puede estar documentada pero no implementada; en ese caso, no debe marcarse como cerrada.

| Fase | Estado documental | Estado implementación | Bloquea siguiente | Resumen | Documentos relacionados | Pendientes |
|------|-------------------|-----------------------|------------------|---------|------------------------|-----------|
| **Orden‑01 – Integración final del roadmap** | Cerrado documental | N/A | No | Se integró el roadmap oficial; define las fases que seguirán a SEG‑01. | `roadmap-operativo.md`, `dependencias-fases.md`, `criterios-cierre-fases.md` | — |
| **SEG‑01 – Roles, permisos, JWT/RLS base** | En definición | Pendiente de implementación | Sí | Se elabora la matriz de roles y permisos a nivel documental. No se han implementado permisos reales en código. | `matriz-roles-permisos.md`, `criterios-cierre-fases.md`, `dependencias-fases.md` | Implementar JWT/RLS y probar |
| **1 – Parámetros / periodo / vigencia / catálogo** | Cerrado documental | Implementado parcial | No | Define el periodo activo, distingue entre mensual/vigencia/catálogo y unifica la UI del módulo Parámetros. | `parametros/contrato-general.md`, `parametros/vigencia-y-periodo.md`, `parametros/carga-parametros-python.md` | Ajustar scripts si cambian fuentes externas |
| **2 – Python / BD v11 / carga mensual** | Cerrado documental | Implementado parcial | No | Alinea Python v6.11, gradualidad 8,5 %, tablas `v11` y carga mensual oficial. | `parametros/carga-parametros-python.md`, scripts SQL | Actualizar scripts ante cambios externos |
| **3 – Empleados: estados y aptitud** | Cerrado documental | Implementado parcial | No | Establece estados de empleado, completitud y aptitud para remuneraciones, junto con flujos de creación. | `empleados/contrato-general.md`, `empleados/flujo-creacion-basica.md`, `empleados/flujo-creacion-avanzada.md` | Validar implementación y pruebas |
| **9.3A–9.3C – Haberes y descuentos** | Cerrado documental | Implementado parcial | No | Define asignaciones recurrentes, cierre/desactivación controlada y filtros de vigencia. | `haberes-descuentos/contrato-general.md` | Agregar constraint SQL y auditoría de cierre |
| **9.4A–9.4E – Movimientos variables** | Faltan documentos | Implementado parcial / no verificado | Sí | Existe un documento funcional pero no se incluye en esta base simplificada. La implementación inicial de UI y servicios está en curso. | `(crear modulo 'movimientos-variables')` | Documentar y verificar el motor y proceso mensual completo |
| **9.5A – Proceso mensual chileno: prevalidaciones** | Cerrado documental (prevalidación) | Sin motor | Sí | Contrato funcional de prevalidaciones mensuales y contenedor base del proceso mensual. | `nomina-mensual/contrato-general.md`, `nomina-mensual/prevalidaciones.md` | Implementar motor y liquidaciones |

Las fases de **Motor de liquidación**, **Previred/LRE** y **RLS/JWT** permanecen **pendientes**.  Ninguna fase debe marcarse como cerrada hasta que cumpla sus criterios y se registren los pendientes en este tablero.
