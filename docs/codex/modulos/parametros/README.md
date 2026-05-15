# Módulo Parámetros — punto de entrada

## Qué documenta esta carpeta

Período global de remuneración, distinción mensual / vigencia / catálogo, UI del módulo `/parametros`, carga Python v6.11, reforma previsional, sync y permisos de ejemplo.

| Documento | Contenido |
|-----------|-----------|
| [`contrato-general.md`](./contrato-general.md) | Visión consolidada y enlaces al detalle |
| [`periodo-vigencia-catalogo.md`](./periodo-vigencia-catalogo.md) | Período vs vigencia vs catálogo global |
| [`ui-parametros.md`](./ui-parametros.md) | Banda, tabs, subtabs, DataGrid, copy |
| [`campos-y-listas.md`](./campos-y-listas.md) | Modelo y catálogos en pantalla |
| [`python-carga-mensual.md`](./python-carga-mensual.md) | Contrato Python: mensual, seeds, preparación vs carga oficial |
| [`reforma-gradualidad.md`](./reforma-gradualidad.md) | Reforma / gradualidad (p. ej. 8,5 %) |
| [`sync-parametros-v611.md`](./sync-parametros-v611.md) | Parámetros v6.11 |
| [`permisos-bd-ejemplo.sql`](./permisos-bd-ejemplo.sql) | Ejemplo SQL / RLS orientativo |
| [`tests-parametros.md`](./tests-parametros.md) | Unitarios, Playwright, assets |

**Recorrido de rutas:** [`../../temas/flujos/parametros.md`](../../temas/flujos/parametros.md).

## Orden de lectura recomendado

1. [`contrato-general.md`](./contrato-general.md).
2. [`periodo-vigencia-catalogo.md`](./periodo-vigencia-catalogo.md) + [`ui-parametros.md`](./ui-parametros.md).
3. [`python-carga-mensual.md`](./python-carga-mensual.md) si el trabajo toca carga normativa o BD v11.
4. Resto según subárea (reforma, sync, permisos).

## Estado del módulo

Fases **1** y **2** del tablero cerradas (UI período/vigencia/catálogo; Python mensual alineado v11). Siguiente foco global del producto: **Conceptos** (otro módulo bajo `modulos/conceptos-remuneracion/`).

## Auditoria PARAM-CHILE-01 (proceso mensual vs demo)

La pantalla **Proceso mensual** (`/remuneraciones/proceso-mensual`) no debe mostrar cifras normativas demo: quedo alineado en **PARAM-CHILE-01** con enlace a **`/parametros`** como fuente de valores. Informe ASCII: [`../../auditorias/param-chile-01-parametros-y-demo-proceso.md`](../../auditorias/param-chile-01-parametros-y-demo-proceso.md). La lectura automatica en ese flujo usa `obtenerUltimoHastaPeriodo`, `obtenerPeriodoRemuneracion` y **`listarCatalogos`** para prevalidaciones (**9.5A** + **9.5B**); ver [`../nomina-mensual/prevalidaciones-9-5A.md`](../nomina-mensual/prevalidaciones-9-5A.md) y [`../nomina-mensual/prevalidaciones-9-5B.md`](../nomina-mensual/prevalidaciones-9-5B.md).
## ERP-NOIA-BITACORA-OPERATIVA-00 - Lectura de modulo

Parametros queda alineado a [`NOIA / Bitacora Operativa`](../../diseno/bitacora-operativa-noia.md) como `Registro normativo`.

- Las pantallas deben mostrar vigencia, fuente normativa, estado y efecto operacional sobre nomina.
- Evitar presentar parametros como catalogos genericos sin contexto de periodo o impacto.
- Esta referencia es documental; no modifica semillas, SQL, servicios, motor ni estilos globales.
