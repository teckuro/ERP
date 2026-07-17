# REPORTES-01 — Contrato de fase

> Fase siguiente tras **LRE-01** en el plan de salidas externas.  
> Fecha contrato: **2026-07-17**. Estado: **documentado — listo para implementación por subfases**.

## Precondiciones

| Precondición | Estado |
|--------------|--------|
| LIQ-01 (liquidaciones oficiales + emisión) | Cerrado |
| PREVIRED-01/02 | Cerrado |
| LRE-01 (borrador + persistencia + formato DT) | Cerrado |
| Smoke manual RRHH Ola 7 (pasos piloto) | Pendiente firma operador |

## Objetivo

Dar a RRHH una **bandeja de reportes operativos** del período/nómina, sin inventar un BI genérico:

1. Qué liquidaciones / exportaciones existen.
2. Qué falta (Previred, LRE, actas).
3. Una acción clara por informe (abrir, exportar, revisar).

## Alcance propuesto (incremental)

### REPORTES-01a — Placeholder NOIA + mapa de informes

- Pantalla `/reportes` con franja operativa (no cards comerciales).
- Lista de informes previstos con estado: disponible / próximamente / no aplica.
- Enlaces a módulos ya vivos: liquidaciones, Previred, LRE, nóminas.
- Copy RRHH; sin IDs técnicos ni nombres de RPC.

### REPORTES-01b — Informe liquidaciones del período

- Resumen por nómina: trabajadores, líquido, estado revisión, emisiones.
- Reutiliza RPCs/repositorios existentes de liquidaciones (sin motor nuevo).

### REPORTES-01c — Informe salidas externas

- Últimas exportaciones Previred y LRE por nómina (tablas de auditoría).
- Criterio: trazabilidad quién / cuándo / canal.

## Fuera de alcance REPORTES-01

- Dashboards con KPIs decorativos o charts genéricos.
- Exportaciones legales nuevas (ya viven en Previred/LRE).
- Contabilidad, banco, portal trabajador.
- Cambios a estilos globales o motor de cálculo.

## Criterio de cierre

1. Contrato + README de módulo publicados (este documento).
2. REPORTES-01a: pantalla útil (mapa + enlaces), tipografía y densidad NOIA.
3. Al menos un informe vivo (01b o 01c) con datos reales del tenant.
4. Registro en `peticiones-estilos.md` si hay cambio visual.
5. Actualizar plan de salidas externas a ✅ al cerrar 01a+01b (o 01a+01c).

## UI actual (arranque)

[`src/app/pages/reportes.page.ts`](../../../src/app/pages/reportes.page.ts) muestra placeholder «Próximamente» alineado a REPORTES-01a hasta implementar el mapa.

## Documentos relacionados

- [`README.md`](./README.md)
- [`../../orquestador/plan-salidas-externas-liq-previred-lre.md`](../../orquestador/plan-salidas-externas-liq-previred-lre.md)
- [`../liquidaciones-oficiales/README.md`](../liquidaciones-oficiales/README.md)
- [`../lre/LRE-01-contrato-fase.md`](../lre/LRE-01-contrato-fase.md)
- [`../previred/PREVIRED-01-contrato-fase.md`](../previred/PREVIRED-01-contrato-fase.md)
