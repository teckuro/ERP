# Auditoría documental `docs/codex` (2026-06-02)

Fecha: 2026-06-02. Alcance: estructura, índice y consistencia de `docs/codex`. Sin tocar contratos vivos ni contenido normativo.

## 1. Inventario

| Métrica | Antes | Después | Delta |
|---------|-------|---------|-------|
| Total archivos | 597 | 468 | -129 |
| Total bytes | 33.18 MB | 17.56 MB | -15.62 MB (-47 %) |
| `.md` | 338 | 329 | -9 |
| `.png` | 229 | 133 | -96 |
| `.bak` | 21 | 0 | -21 |
| `.zip` | 3 | 0 | -3 |
| `.svg` | 4 | 4 | 0 |
| `.sql` | 2 | 2 | 0 |

## 2. Hallazgos y acciones aplicadas

### 2.1 Respaldos `.bak` contradecían el índice

[`README.md`](../README.md) §"Poda documental" y [`contexto-rapido.md`](../contexto-rapido.md) §"Regla documental vigente" declaraban que no había `.bak` en el repo activo. La realidad eran **21 `.bak`** bajo `archivo/backups/`.

Acción: eliminados los 21 `.bak` y las 9 subcarpetas vacías resultantes; eliminada la carpeta `archivo/backups/`. Documentos preservados en el historial de git.

### 2.2 ZIPs redundantes con carpetas extraídas

| Archivo | Tamaño | Carpeta extraída |
|---------|--------|------------------|
| `modulos/nomina-mensual.zip` | 2.09 MB | `modulos/nomina-mensual/` (completa) |
| `modulos/nomina-mensual/preparar-nomina.zip` | 12 KB | `modulos/nomina-mensual/preparar-nomina/` (completa) |
| `modulos/nomina-mensual/preparar-nomina/imagenes/paso-a-paso.zip` | 1.77 MB | `modulos/nomina-mensual/preparar-nomina/imagenes/paso-a-paso/` (completa) |

Acción: eliminados los 3 ZIPs (3.87 MB ahorrados). El contenido extraído permanece intacto.

### 2.3 `fases/` y `archivo/fases-cerradas/` duplicados literalmente

Verificación MD5 confirmó que las 9 fases bajo `archivo/fases-cerradas/{liquidaciones,nomina,ux-comercial}/` eran **idénticas byte a byte** a las activas en `fases/`. [`README.md`](../README.md) referenciaba ambas como rutas válidas.

Acción: eliminada la copia bajo `archivo/fases-cerradas/` y su `README-original.md` residual. Política vigente actualizada en [`archivo/README.md`](../archivo/README.md): cuando una fase cierra se **mueve** (no se copia) y queda enlace desde [`estado-fases.md`](./estado-fases.md). Las fases activas siguen en [`fases/`](../fases/).

### 2.4 Carpetas vacías eliminadas

- `archivo/assets-antiguos/` y todo el árbol `parametros/parametros-tabs-*` (15 carpetas, 96 PNGs antiguos): el propio [`archivo/README.md`](../archivo/README.md) ya declaraba que esta carpeta había sido podada; quedaba el árbol como residuo.
- `modulos/nomina/`: módulo nunca poblado; reemplazado por `modulos/nomina-mensual/`.
- `modulos/liquidaciones/`: módulo nunca poblado; reemplazado por `modulos/liquidaciones-oficiales/`.

### 2.5 Inventario `modulos/` post-limpieza

| Módulo | Archivos | Notas |
|--------|----------|-------|
| `nomina-mensual/` | 69 md + carpeta `preparar-nomina/` | Plano; ver propuesta D1 |
| `empleados/` | 35 md | OK |
| `parametros/` | 16 md | OK |
| `lre/` | 7 md | OK |
| `movimientos-variables/` | 8 md | OK |
| `conceptos-remuneracion/` | 5 md | OK |
| `remuneraciones/` | 3 md | OK |
| `liquidaciones-oficiales/` | 2 md | OK |
| `haberes-descuentos/` | 2 md | OK |
| `auth/` | 2 md | OK |
| `empresas/` | 1 md | OK |

## 3. Hallazgos no ejecutados (propuestas)

Las siguientes recomendaciones requieren fase dedicada (afectan referencias cruzadas o políticas vivas). Se documentan aquí como deuda controlada.

### D1. Subagrupar `modulos/nomina-mensual/`

69 archivos planos dificultan navegación. Subcarpetas sugeridas:

```text
modulos/nomina-mensual/
  motor/          # motor-calculo-* (12)
  flow/           # nom-mensual-flow-* (9)
  modales-periodo/ # nom-modales-periodo-* (6) + modales-periodo-* (3)
  prevalidaciones/ # prevalidaciones-* (5) + verificar-periodo-* (1)
  workspace/      # nom-mensual-workspace-* y nom-workspace-* (8)
  preparar-nomina/ # ya existe
  vision/         # vision-futura.md, contrato-general.md, arquitectura-funcional-*
  revisiones/     # nom-mensual-revision-* (1) + cierre/auditoría
```

Impacto: necesita actualizar enlaces internos y posiblemente reglas Cursor. Estimado: 1-2 h.

### D2. Unificar `prompts/` y `prompts-cursor/`

`prompts/` tiene 4 archivos genéricos y `prompts-cursor/` solo `CURSOR-UX-COMERCIAL-01.md`. Propuesta: mover el contenido de `prompts-cursor/` a `prompts/CURSOR-*` y borrar la carpeta.

### D3. Promover los stubs `temas/*`

[`mapa-documentacion.md` §5](./mapa-documentacion.md#L66) lista 11 archivos de `temas/` como stubs que redirigen a `modulos/`. Recomendación: dejar cada stub como un único bloque `> [moved] modulos/<...>` con la fecha; revisar que ninguno tenga contenido nuevo que aún no esté migrado.

### D4. Rotar `peticiones-estilos.md` por trimestre

[`peticiones-estilos.md`](../peticiones-estilos.md) supera las 2700 líneas. Propuesta: rotar por trimestre (`peticiones-estilos-2026-Q2.md`) y dejar `peticiones-estilos.md` como índice ligero con enlaces.

### D5. Enlazar `inconsistencias.md` desde el índice

[`inconsistencias.md`](../inconsistencias.md) hoy es huérfano (sin links entrantes desde `README.md` ni `mapa-documentacion.md`). Recomendación: agregar sección "Deuda documental" al `README.md` con link directo.

### D6. Promesa vs realidad en index padre

[`README.md`](../README.md) §"Poda documental" debe quedar alineado con la realidad post-limpieza. Cubierto en esta auditoría.

## 4. Archivos tocados

- Borrados: 21 `.bak`, 3 `.zip`, 96 PNG (`archivo/assets-antiguos/**`), 9 `.md` (`archivo/fases-cerradas/**`), 1 `README-original.md`.
- Editados: [`archivo/README.md`](../archivo/README.md), [`README.md`](../README.md), [`mapa-documentacion.md`](./mapa-documentacion.md), [`contexto-rapido.md`](../contexto-rapido.md).
- Creados: este archivo.

## 5. Archivos NO tocados

- `AGENTS.md`, `peticiones-estilos.md`, `inconsistencias.md`, `manual-base-proyecto.md`, todos los contratos vivos en `modulos/`, `diseno/`, `normativa/`, `auditorias/`, `temas/` y `orquestador/estado-fases.md`.
- Archivos de la app (`src/`, `bd/`, `angular.json`, estilos globales).

## 6. Validación

- Re-conteo confirmado: 468 archivos (-129), 17.56 MB (-15.62 MB).
- Búsqueda de referencias a rutas eliminadas registrada en la sección 7.
- Sin cambios a estilos globales, SQL, motor de cálculo ni rutas Angular.

## 7. Referencias residuales

Las siguientes menciones a rutas eliminadas son menciones documentales (no son links rotos a archivos perdidos, solo recordatorios históricos en docs/codex):

- Menciones a `archivo/backups/` y `.bak`: ya solo aparecen en este documento y en `archivo/README.md` (como explicación de poda).
- Menciones a `archivo/fases-cerradas/`: en este documento y en `archivo/README.md`.
- Menciones a `archivo/assets-antiguos/`: en este documento, `archivo/README.md` y `mapa-documentacion.md` (actualizado).
- Menciones a los 3 ZIPs: ninguna (no había enlaces hacia ellos).

## 8. Siguientes pasos sugeridos

1. Ejecutar D5 (enlazar `inconsistencias.md`) — bajo riesgo, 5 min.
2. Ejecutar D2 (unificar prompts) — bajo riesgo, 10 min.
3. Ejecutar D1 (subagrupar `nomina-mensual`) — fase dedicada con búsqueda de referencias cruzadas.
4. Ejecutar D4 (rotar `peticiones-estilos.md`) cuando la próxima sesión la actualice.
