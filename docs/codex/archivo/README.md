# Archivo (`docs/codex/archivo`)

Carpeta para **documentos reemplazados u obsoletos** que conviene conservar por historial (bitácoras largas, fusiones, borradores de contrato), **sin** usarlos como fuente normativa.

- **Fuente vigente** de contratos por módulo: [`../modulos/`](../modulos/).
- **Índice operativo**: [`../orquestador/mapa-documentacion.md`](../orquestador/mapa-documentacion.md).

Si un archivo en `temas/` solo redirige a `modulos/`, no hace falta duplicarlo aquí salvo que se haya movido físicamente el contenido histórico.

## Poda documental (DOCS-CODEX-MERGE-PRUNE-QUALITY-01)

Los respaldos `.bak` y assets antiguos pesados fueron eliminados del repo activo para reducir ruido y peso documental.

Si se requiere revisar historial, usar Git o el ZIP histórico previo.

### Política vigente

Cuando una fase cierra se **mueve** (no se copia) a la carpeta histórica correspondiente y queda enlace desde [`../orquestador/estado-fases.md`](../orquestador/estado-fases.md). No mantener duplicados literales.

### Qué ya no existe en el repo activo

- `archivo/backups/` (respaldos `.bak` duplicados; eliminados en auditoría 2026-06-02).
- `archivo/assets-antiguos/` (carpetas vacías; eliminadas en auditoría 2026-06-02).
- `archivo/fases-cerradas/` (era duplicado byte a byte de `../fases/`; eliminado 2026-06-02).

Los assets activos de parámetros viven en [`../assets/parametros-tabs/`](../assets/parametros-tabs/).

Detalle de la poda: [`../orquestador/auditoria-docs-2026-06.md`](../orquestador/auditoria-docs-2026-06.md).
