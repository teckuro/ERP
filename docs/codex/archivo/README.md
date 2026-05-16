# Archivo (`docs/codex/archivo`)

Carpeta para **documentos reemplazados u obsoletos** que conviene conservar por historial (bitácoras largas, fusiones, borradores de contrato), **sin** usarlos como fuente normativa.

- **Fuente vigente** de contratos por módulo: [`../modulos/`](../modulos/).
- **Índice operativo**: [`../orquestador/mapa-documentacion.md`](../orquestador/mapa-documentacion.md).

Si un archivo en `temas/` solo redirige a `modulos/`, no hace falta duplicarlo aquí salvo que se haya movido físicamente el contenido histórico.

## Poda documental (DOCS-CODEX-MERGE-PRUNE-QUALITY-01)

Los respaldos `.bak` y assets antiguos pesados fueron eliminados del repo activo para reducir ruido y peso documental.

Si se requiere revisar historial, usar Git o el ZIP histórico previo.

### Qué sigue en esta carpeta

| Subcarpeta | Uso |
|------------|-----|
| `fases-cerradas/` | Trazabilidad mínima de fases ya cerradas |
| `documentos-reemplazados/` | Contratos sustituidos por `modulos/` |
| `pendientes-clasificar/` | Material sin clasificar (revisar antes de usar) |

### Qué ya no existe en el repo activo

- `archivo/backups/` (respaldos `.bak` duplicados)
- `archivo/assets-antiguos/` (capturas de iteraciones visuales antiguas)

Los assets activos de parámetros viven en [`../assets/parametros-tabs/`](../assets/parametros-tabs/).
