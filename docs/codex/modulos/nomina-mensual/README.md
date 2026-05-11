# Módulo Nómina mensual — punto de entrada

## Estado

**Prevalidaciones 9.5A + 9.5B** implementadas (sin motor ni liquidaciones): recurrentes por mes, grupos minimos de parametros + catalogos, resumen en UI. Proceso productivo end-to-end sigue **pendiente**. Vision de producto: [`vision-futura.md`](./vision-futura.md); orquestador: [`../../orquestador/estado-fases.md`](../../orquestador/estado-fases.md).

## Documentos

| Archivo | Rol |
|---------|-----|
| [`contrato-general.md`](./contrato-general.md) | Objetivo, alcance, relaciones con Parametros, empleados, conceptos, MV, motor futuro |
| [`prevalidaciones-9-5A.md`](./prevalidaciones-9-5A.md) | Reglas base 9.5A (periodo, fila PG, calendario, empleados, conceptos, MV) |
| [`prevalidaciones-9-5B.md`](./prevalidaciones-9-5B.md) | Recurrentes por `YYYY-MM`, grupos minimos de parametros, archivos y pruebas 9.5B |
| [`vision-futura.md`](./vision-futura.md) | Checklist orientativo y relación con otros módulos |

## Relación con flujos documentados

Pantalla **Proceso mensual**: **`/remuneraciones/proceso-mensual`** (redirect desde `/proceso-remuneraciones`). UI: `src/app/features/nomina-mensual/containers/proceso-mensual-container/`; pagina `src/app/pages/proceso-remuneraciones.page.ts` wrapper (`docs/codex/arquitectura/frontend-interfaces.md`). Servicio: `ProcesoMensualService`; reglas: `proceso-mensual-prevalidacion.rules.ts`. Limpieza demo previa: [`../../auditorias/param-chile-01-parametros-y-demo-proceso.md`](../../auditorias/param-chile-01-parametros-y-demo-proceso.md).

[`../../temas/flujos/proceso-remuneraciones.md`](../../temas/flujos/proceso-remuneraciones.md) y [`../../orquestador/contexto-proyecto.md`](../../orquestador/contexto-proyecto.md) §11–§15.

**Movimientos variables** (entrada del proceso): [`../movimientos-variables/README.md`](../movimientos-variables/README.md), [`../movimientos-variables/ui-9-4E.md`](../movimientos-variables/ui-9-4E.md).

<!-- UX-COMERCIAL-01-NOMINA -->

## Hito funcional y siguiente foco UX

El flujo de nomina queda validado hasta liquidaciones internas:

```txt
Preparar nomina
-> Resultado preliminar
-> Aprobacion operativa
-> Cierre operativo
-> Liquidaciones oficiales internas
```

Para fases siguientes de UI, `Preparar nomina` debe presentarse como tablero operativo/comercial del periodo:

```txt
estado principal
resumen ejecutivo
siguiente accion
bloqueos/advertencias
resultado guardado
cierre
liquidaciones
trazabilidad secundaria
```

No agregar Previred, LRE, banco, contabilidad, PDF ni firma en esta etapa.
