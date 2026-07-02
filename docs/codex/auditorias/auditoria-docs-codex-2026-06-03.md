# Auditoría documental `docs/codex` — DOCS-AUDIT-02 (2026-06-03)

> **Estado**: **Cerrada** el 2026-06-03 con plan iterativo L0–L7 **ejecutado completo**. Pendientes opcionales declarados al final (DOCS-AUDIT-03).
>
> Registro de cierre en [`../orquestador/estado-fases/docs.md`](../orquestador/estado-fases/docs.md#DOCS-AUDIT-02-Auditor%C3%ADa-docscodex).
>
> Resumen de impacto: peso `docs/codex/` 17.300 KB → ~5.300 KB (**−69 %**); `peticiones-estilos.md` 312 KB → 66 KB; `estado-fases.md` 188 KB → 4 KB (índice); `nomina-mensual/` 72 archivos planos en raíz → 3 en raíz + 9 subcarpetas; 6 READMEs nuevos en carpetas críticas; convención de naming declarada en `mapa-documentacion.md`.

Fase 0. Solo lectura. Sin cambios de archivos. Salida: hallazgos categorizados + plan iterativo declarado. Confirmar lotes antes de Fase 1.

Continuación de [`../auditorias/auditoria-docs-2026-06.md`](../auditorias/auditoria-docs-2026-06.md) (DOCS-AUDIT-01, 2026-06-02). Extiende el alcance previo con 6 dimensiones nuevas (estructura, coherencia con código, duplicidad fina, tamaño, frescura, naming) y reabre las propuestas D1–D6 pendientes.

## 1. Decisión rectora (confirmada con usuario, 2026-06-03)

- **Alcance del audit**: las 6 dimensiones sobre la totalidad de `docs/codex` (332 archivos `.md` + 139 assets = 471 archivos / 17,3 MB).
- **Nivel de intervención**: solo Fase 0 (este documento). Los lotes L0–L7 quedan declarados, no ejecutados. La aprobación por lote se hará después de leer estos hallazgos.
- **Preferencia para L3** (si se ejecuta): rotación de `orquestador/estado-fases.md` **por dominio** (Opción A — `estado-fases/empleados.md`, `/nomina.md`, `/ux-comercial.md`, etc.) en vez de por año/estado.
- **Restricciones**: sin tocar `angular.json`, `src/styles*.css`, `src/styles/*`, código de la app, `bd/`, motor, RPCs, SQL. Sin reescribir contratos vivos (`AGENTS.md`, `noia-ui-manual.md`, READMEs de módulo). Sin renombrar convención de IDs de fase (`EMP-*`, `NOMINA-V2-*`).

## 2. Estado de las propuestas D1–D6 del audit previo

| ID | Propuesta original | Estado 2026-06-03 |
|----|-------------------|-------------------|
| D1 | Subagrupar `modulos/nomina-mensual/` (69 archivos planos) | **Pendiente, peor**: hoy son 72 archivos planos |
| D2 | Unificar `prompts/` + `prompts-cursor/` | **Pendiente**: `prompts/` 4 archivos, `prompts-cursor/` 1 archivo |
| D3 | Revisar y validar stubs en `temas/` | **Pendiente parcial**: 14 stubs vivos validados por subagente 1, 5 docs reales identificados, 1 SQL stub |
| D4 | Rotar `peticiones-estilos.md` por trimestre | **Pendiente, peor**: 306 KB / 3 037 líneas hoy (vs 2 700 líneas en DOCS-AUDIT-01); corte natural identificado en línea 378 |
| D5 | Enlazar `inconsistencias.md` desde README padre | **Hecho** (sección "Deuda documental" en `docs/codex/README.md` §"Poda documental") |
| D6 | "Poda documental" alineada con realidad post-limpieza | **Hecho** |

## 3. Resumen ejecutivo (top 10)

1. **P0 — Doble módulo `nomina-mensual` V1 + V2 sin separación en docs**. Los features `src/app/features/nomina-mensual/` (ruta productiva `/remuneraciones/proceso-mensual`) y `src/app/features/nomina-mensual-v2/` (ruta `/remuneraciones/nomina-mensual-v2`, acotada a pasos 1–3 por `NOMINA-V2-AUDIT-01`) conviven con toda su documentación mezclada en `docs/codex/modulos/nomina-mensual/` (72 `.md` planos). Un agente nuevo puede leer fases V1 cerradas (`NOM-MENSUAL-*`, `NOM-MODALES-PERIODO-*`, `motor-calculo-*`) como aplicables a V2.
2. **P0 — 105 PNG huérfanos = ~12 MB (70 % del peso total de `docs/codex`)** en 14 carpetas `assets/parametros-tab*-*` y `parametros-tablas-observacion/`. Solo `assets/parametros-tabs/` (8 PNG, 950 KB) está referenciado. La poda DOCS-AUDIT-01 no incluyó este árbol.
3. **P0 — `peticiones-estilos.md` (306 KB / 3 037 líneas / 313 entradas)** tiene corte natural entre junio (líneas 1–377, 25 entradas, ~37 KB) y mayo (líneas 384–3 033, 288 entradas, ~268 KB). Rotación a `archivo/peticiones-estilos-2026-05.md` → archivo activo de 306 KB → ~38 KB (−88 %).
4. **P1 — 4 duplicados byte-equivalentes o legacy en raíz**: `prevalidaciones-9-5A.md`, `prevalidaciones-9-5B.md`, `tests-empleados.md`, `tests-parametros.md`. Los 4 tienen copia canónica en `modulos/<m>/`. Sin política de stub-redirect en raíz (`temas/` sí la tiene), generan riesgo de divergencia silenciosa.
5. **P1 — `NOM-MODALES-PERIODO-REVISION-COPY-03` aparece DUPLICADA** en [`docs/codex/orquestador/estado-fases.md`](../orquestador/estado-fases.md) (líneas 355–364 y 1431–1441), con redacciones distintas y ambas "Implementada".
6. **P1 — 3 docs declarados por `ERP-NOIA-UI-GUARDRAILS-01` no existen**: `docs/codex/diseno/noia-visual-tokens.md`, `noia-layout-rules.md`, `noia-component-rules.md`. La fase aparece como "Implementada (documental)" pero sus entregables faltan.
7. **P1 — Link roto en hub**: [`docs/codex/modulos/auth/README.md`](../modulos/auth/README.md) enlaza `fases/auth/*` que no existe (la carpeta `fases/auth/` nunca fue creada).
8. **P1 — `auditoria-nomina-v2-2026-06.md` línea 5 declara ruta falsa** `/remuneraciones/nomina-v2`. La ruta real registrada en [`src/app/app.routes.ts`](../../../src/app/app.routes.ts) (línea 90) es `/remuneraciones/nomina-mensual-v2`. Es la única ruta declarada para V2.
9. **P1 — Convención mixta sin política escrita** sobre dónde vive una auditoría (5 en `auditorias/`, 4 dispersas en `modulos/<m>/`, 3 en `arquitectura/`/`diseno/`/`orquestador/`). [`docs/codex/auditorias/README.md`](../auditorias/README.md) no lista 2 archivos de su carpeta (`erp-audit-repair-ux-01.md`, `liquidacion-legacy-deprecacion-01.md`).
10. **P2 — `orquestador/estado-fases.md` (188 KB / 1 441 líneas / 112 fases / 61 cerradas)** crece sin rotación. CHANGELOG.md (62 KB, 27 entradas todas 2026-05) en mismo escenario.

## 4. Inventario actualizado

### 4.1 Métricas globales (snapshot 2026-06-03)

| Métrica | DOCS-AUDIT-01 (2026-06-02) | DOCS-AUDIT-02 (2026-06-03) | Delta |
|---------|---------------------------|---------------------------|-------|
| Total archivos | 468 | 471 | +3 |
| Total bytes | 17,56 MB | 17,30 MB | −0,26 MB |
| `.md` | 329 | 332 | +3 |
| `.png` | 133 | 133 | 0 |
| `.svg` | 4 | 4 | 0 |
| `.sql` | 2 | 2 | 0 |
| PNG huérfanos (no referenciados desde ningún `.md`) | no medido | **116 / 133 (87 %)** | — |
| PNG huérfanos solo en `assets/` (14 carpetas) | no medido | **105 / 113 (~12 MB)** | — |

### 4.2 Distribución por carpeta densa

| Carpeta | Archivos `.md` | Tiene README | Citada en README padre |
|---------|---------------|--------------|------------------------|
| `modulos/nomina-mensual` | 72 | sí | sí |
| `diseno` | 38 | **no** | sí (varios docs sí) |
| `modulos/empleados` | 35 | sí | sí |
| raíz `docs/codex/` | 23 | n/a | sí |
| `normativa` | 20 | n/a (no verificado) | **no** |
| `temas` | 19 | sí | sí |
| `orquestador` | 18 | sí | sí |
| `modulos/parametros` | 16 | sí | sí |
| `temas/flujos` | 10 | sí | sí |
| `modulos/movimientos-variables` | 8 | sí | sí |
| `ux-comercial` | 8 | sí | sí |
| `auditorias` | 7 | sí (desactualizado) | sí |
| `modulos/lre` | 7 | **no** | **no** |
| `context-packs` | 6 | sí | parcial (citado pero sin doc en hub) |
| `modulos/nomina-mensual/preparar-nomina` | 6 | sí | indirectamente |
| `modulos/conceptos-remuneracion` | 5 | sí | sí |
| `prompts` | 4 | n/a (no verificado) | **no** |
| `modulos/remuneraciones` | 3 | sí | sí |
| `estilos` | 3 | sí | sí |
| `fases/liquidaciones`, `fases/nomina`, `fases/ux-comercial`, `arquitectura` | 3 c/u | sí | sí (excepto `fases/*`) |
| `modulos/liquidaciones-oficiales`, `modulos/haberes-descuentos`, `modulos/auth`, `fases/ux-comercial` | 2 c/u | sí | sí (haberes, ux-comercial); **no** (auth, liquidaciones-oficiales) |
| `infra`, `prompts-cursor`, `archivo`, `modulos/empresas`, `fases` | 1 c/u | n/a | **no** (infra, prompts-cursor, fases) |

## 5. Mapa de capas

| Capa | Carpetas | Rol |
|------|----------|-----|
| Globales / hubs | raíz `docs/codex/` (`README.md`, `AGENTS.md`, `contexto-rapido.md`, `manual-base-proyecto.md`, `inconsistencias.md`, `peticiones-estilos.md`, `peticiones-fusion-items-1-65.md`, `CHANGELOG.md`, `ui-*.md`, `glosario.md`, `contrato-general.md`, `criterios-*.md`, `flujo-git-developer-main.md`, `normativa-remuneraciones.md`, `observaciones.md`) | Punto de entrada y contratos transversales |
| Orquestador | `orquestador/` (18 `.md`) | Roadmap, fases, mapa de documentación, contexto-proyecto, dependencias, criterios, matriz roles |
| Arquitectura | `arquitectura/` (3 `.md`) | Contrato frontend Angular (`pages/` vs `features/`, contenedores, capas) |
| Diseño NOIA | `diseno/` (38 `.md`) | Manual NOIA + iteraciones de diseño por fase |
| Estilos | `estilos/` (3 `.md`) | Grilla + checklist visual |
| Módulos productivos | `modulos/empleados`, `modulos/parametros`, `modulos/nomina-mensual`, `modulos/movimientos-variables`, `modulos/haberes-descuentos`, `modulos/conceptos-remuneracion`, `modulos/remuneraciones`, `modulos/liquidaciones-oficiales`, `modulos/auth`, `modulos/empresas` | Contratos por dominio |
| Módulos futuros | `modulos/lre` | Sin feature; plan documental |
| Transversales | `temas/`, `temas/flujos/` | Flujos por ruta + stubs hacia `modulos/` |
| Bitácoras | `peticiones-estilos.md`, `peticiones-fusion-items-1-65.md`, `CHANGELOG.md` | Registro histórico |
| Auditorías | `auditorias/` + auditorías dispersas en `modulos/<m>/`, `arquitectura/`, `diseno/`, `orquestador/` | Hallazgos cerrados |
| Fases | `fases/liquidaciones`, `fases/nomina`, `fases/ux-comercial` | Docs canónicos de fase (≠ resúmenes en `estado-fases.md`) |
| Context packs | `context-packs/` (6 `.md`) | Packs generables por `scripts/build-context-pack.ps1` |
| Prompts | `prompts/` (4), `prompts-cursor/` (1) | Prompts Cursor/Codex históricos |
| Normativa | `normativa/` (20 `.md`) | Documentación regulatoria chilena |
| UX comercial | `ux-comercial/` (8 `.md`) | Contrato de experiencia vendible |
| Infraestructura | `infra/` (1 `.md`) | Soporte mínimo (qué contiene sin verificar) |
| Archivo | `archivo/` (1 `.md`) | Política de archivado; vacío post-DOCS-AUDIT-01 |
| Assets | `assets/parametros-tabs/` (vivo) + 14 huérfanas | Capturas de iteraciones de diseño |

## 6. Hallazgos por dimensión

Plantilla: `ID · síntoma · trigger · ubicación · severidad · propuesta`.

### 6.1 Estructura e índices

| ID | Síntoma | Trigger | Ubicación | Severidad | Propuesta |
|----|---------|---------|-----------|-----------|-----------|
| H-ES1 | `modulos/auth/README.md` enlaza `fases/auth/*` inexistente | Lectura del README de auth | [`docs/codex/modulos/auth/README.md`](../modulos/auth/README.md) | **P1** | Eliminar el link o crear stub `fases/auth/README.md` indicando que la fase SEG-01 vive en `orquestador/matriz-roles-permisos.md` |
| H-ES2 | `diseno/` (38 `.md`) sin `README.md` ni índice | Navegación a `diseno/` | `docs/codex/diseno/` | **P1** | Crear `diseno/README.md` agrupando los 38 docs por subfamilia (NOIA core, iteraciones por módulo, fases UX) |
| H-ES3 | `modulos/lre/` (7 `.md`) sin `README.md` ni cita en README padre | Navegación a `lre/` | `docs/codex/modulos/lre/` | **P1** | Crear `modulos/lre/README.md` declarando plan futuro y agregar fila en tabla de módulos del README padre |
| H-ES4 | README padre omite `auth`, `empresas`, `lre`, `liquidaciones-oficiales` de la tabla "Módulos" | Inspección de `docs/codex/README.md` §"`modulos/`" | [`docs/codex/README.md`](../README.md) líneas 43–55 | **P1** | Agregar las 4 filas faltantes con su README correspondiente |
| H-ES5 | Carpetas no citadas en hubs principales: `context-packs/`, `infra/`, `prompts/`, `prompts-cursor/`, `normativa/`, `fases/` (raíz) | Audit subagente 1 | varios | P2 | Citar desde `mapa-documentacion.md` con rol explícito |
| H-ES6 | `auditorias/README.md` desactualizado: no lista `erp-audit-repair-ux-01.md` ni `liquidacion-legacy-deprecacion-01.md` | Audit subagente 3 | [`docs/codex/auditorias/README.md`](../auditorias/README.md) | P2 | Agregar las 2 filas faltantes |
| H-ES7 | `peticiones-fusion-items-1-65.md` huérfano funcional (citado solo como "bitácora fusionada" sin instrucciones de uso) | Inspección de `mapa-documentacion.md §4` | raíz | P3 | Confirmar si sigue vivo; si no, archivar |

### 6.2 Coherencia con código

| ID | Síntoma | Trigger | Ubicación | Severidad | Propuesta |
|----|---------|---------|-----------|-----------|-----------|
| H-CO1 | Doble feature productivo `nomina-mensual` V1 + V2 con docs mezcladas | Census 72 `.md` planos | `docs/codex/modulos/nomina-mensual/` | **P0** | Subdividir en `nomina-mensual/v1/`, `nomina-mensual/v2/`, `nomina-mensual/shared/` o etiquetar cada fase en frontmatter; actualizar README del módulo con tabla "qué aplica a V1, qué a V2, qué a ambos" |
| H-CO2 | `auditoria-nomina-v2-2026-06.md` línea 5 declara ruta `/remuneraciones/nomina-v2` (no existe) | Lectura del audit V2 | [`docs/codex/modulos/nomina-mensual/auditorias/auditoria-nomina-v2-2026-06.md`](../modulos/nomina-mensual/auditorias/auditoria-nomina-v2-2026-06.md) línea 5 | **P1** | Corregir a `/remuneraciones/nomina-mensual-v2` |
| H-CO3 | Carpeta doc `modulos/parametros/` no coincide con nombre real del feature `parametros-generales/` | Cruce features vs docs | `docs/codex/modulos/parametros/` | P2 | Renombrar carpeta doc o agregar nota en README del módulo aclarando la equivalencia |
| H-CO4 | `modulos/auth/` doc activa pero código vive en `core/auth/` (no en `features/`) | Cruce features vs docs | `docs/codex/modulos/auth/` | P2 | Aclarar en README del módulo que el código vive en `core/` (no es feature) y agregar nota en `arquitectura/frontend-interfaces.md` sobre módulos cross-cutting |
| H-CO5 | 3 docs declarados por `ERP-NOIA-UI-GUARDRAILS-01` no existen: `noia-visual-tokens.md`, `noia-layout-rules.md`, `noia-component-rules.md` | Cruce `estado-fases.md` vs filesystem | `docs/codex/diseno/` | **P1** | Crear los 3 docs o reescribir la entrada de la fase como "guardrails consolidados en `noia-ui-manual.md` + `noia-ui-guardrails.md`" |
| H-CO6 | Features sin doc dedicada en `modulos/`: `asistente-preguntor/`, `pages/licencias-medicas`, `pages/reportes`, `pages/dashboard` | Cruce features vs docs | `src/app/features/asistente-preguntor/`, `src/app/pages/` | P2 | Crear stub `modulos/<x>/README.md` mínimo aclarando alcance, aunque sea "feature aislada sin contrato extenso" |
| H-CO7 | `LRE-CONCEPT-RULES-01` y `EMP-PERFIL-LABORAL-SQL-01` "Implementada en ZIP, pendiente BD real" | Estado intermedio | `estado-fases.md` | P2 | Marcar como "Parcial" en lugar de "Implementada" para evitar lectura ambigua |
| H-CO8 | `NOM-MODALES-PERIODO-REVISION-COPY-03` aparece DUPLICADA en `estado-fases.md` líneas 355–364 y 1431–1441 con redacciones distintas | Cruce de IDs de fase | [`docs/codex/orquestador/estado-fases.md`](../orquestador/estado-fases.md) | **P1** | Consolidar en una sola entrada (la más completa) y borrar la duplicada |
| H-CO9 | `prevalidaciones-9-5C.md` existe pero su fase no aparece como bloque propio en `estado-fases.md` (sí 9.5A y 9.5B) | Cruce de fases | `estado-fases.md` + `modulos/nomina-mensual/prevalidaciones/prevalidaciones-9-5C.md` | P2 | Cerrar formalmente Fase 9.5C en `estado-fases.md` o documentar como subfase abierta |
| H-CO10 | Fases en `fases/<sub>/` (`LIQ-*`, `NOM-CIERRE-*`, `UX-QA-01`) sin sección propia en `estado-fases.md` | Cruce `fases/` vs `estado-fases.md` | `fases/liquidaciones/`, `fases/nomina/` | P2 | Agregar entradas resumen o aclarar política: el doc canónico vive en `fases/`, `estado-fases.md` solo registra fases con seguimiento activo |
| H-CO11 | 6 archivos `.bak` residuales en `bd/base/v11/partes/` (fuera de docs pero política del repo "sin `.bak`" declarada por DOCS-AUDIT-01) | Audit subagente 2 | `bd/base/v11/partes/*.sql.bak` | P3 | Confirmar con dueño de `bd/`; fuera del alcance de DOCS-AUDIT-02 pero conviene flag |

### 6.3 Duplicidad y solapamiento

| ID | Síntoma | Trigger | Ubicación | Severidad | Propuesta |
|----|---------|---------|-----------|-----------|-----------|
| H-DU1 | `prevalidaciones-9-5A.md` y `prevalidaciones-9-5B.md` byte-equivalentes en raíz y en `modulos/nomina-mensual/` | Diff de bytes | raíz vs `modulos/nomina-mensual/` | **P1** | Borrar los de raíz; `estado-fases.md` ya apunta a los del módulo |
| H-DU2 | `tests-empleados.md` y `tests-parametros.md` raíz son subset histórico migrado a `modulos/<m>/tests-*.md` | Diff de contenido | raíz vs `modulos/empleados/`, `modulos/parametros/` | **P1** | Borrar los de raíz; la sección "Escenarios históricos migrados" del módulo ya cubre |
| H-DU3 | `reforma-pensiones-gradualidad.md` y `reforma-gradualidad.md` en mismo módulo (parametros) solapan tema | Audit subagente 3 | `docs/codex/modulos/parametros/` | P2 | Mantener `reforma-gradualidad.md` (más reciente y completo), archivar el otro |
| H-DU4 | `observaciones.md` raíz (bloque BD-v11 + UI-FONTS) vs `estilos/observaciones.md` (subset solo UI-FONTS) | Audit subagente 3 | raíz + `estilos/` | P2 | Mover bloque BD-v11 a `inconsistencias.md`; borrar `estilos/observaciones.md` |
| H-DU5 | Stubs `temas/*` con basename igual a docs en `context-packs/`: `empleados.md`, `parametros.md` | Audit subagente 3 | `temas/flujos/` vs `context-packs/` | P3 | Renombrar `context-packs/empleados.md` → `context-packs/empleados-pack.md` para evitar colisión semántica |
| H-DU6 | Cluster `nom-mensual-flow-unificado-03-fase-{02..05}` (5 docs, fase ya cerrada) | Census nomina-mensual | `modulos/nomina-mensual/` | P2 | Consolidar las 4 fases en un único doc o sección del índice |
| H-DU7 | Cluster `nom-modales-periodo-revision-*-0{1..5}` (5 iteraciones del mismo modal) | Census nomina-mensual | `modulos/nomina-mensual/` | P2 | Crear `nom-modales-periodo-revision.md` consolidado + mover individuales a `archivo/` |
| H-DU8 | Cluster `motor-calculo-*` (9 docs serializados) sin subcarpeta | Census nomina-mensual | `modulos/nomina-mensual/` | P2 | Mover a `modulos/nomina-mensual/motor-calculo/` con README índice (parte de L4) |
| H-DU9 | Cluster `nom-preparar-nomina-bitacora-v3-*` (5 docs pequeños 0,9–1,6 KB) en `diseno/` | Census diseno | `docs/codex/diseno/` | P2 | Consolidar en un único `nom-preparar-nomina-bitacora-v3.md` |
| H-DU10 | `contrato-general.md` en raíz (4,4 KB) coincide en basename con 9 módulos (1,7–22,2 KB) | Census | raíz + 9 `modulos/<m>/contrato-general.md` | P3 | Renombrar el de raíz a `contrato-global.md` o documentar el rol diferencial |
| H-DU11 | 13 stubs `temas/*` redirect a `modulos/` validados como vivos (esperado por política `mapa-documentacion.md §5`) | Census temas | `docs/codex/temas/` | P3 | Mantener tal cual (forma parte del contrato); revalidar contenido (línea única "Documento migrado…") |
| H-DU12 | 4 snapshots con fecha embebida en el nombre (`*-2026-05-18.md`, `*-2026-05-25.md`) | Census | varios | P2 | Mover a `archivo/` una vez la fase sucesora los reemplace (suma ~52 KB) |

### 6.4 Tamaño y rotación

| ID | Síntoma | Trigger | Ubicación | Severidad | Propuesta |
|----|---------|---------|-----------|-----------|-----------|
| H-TA1 | `peticiones-estilos.md` 306,6 KB / 3 037 líneas / 313 entradas; corte natural línea 378 entre junio (25 entradas, ~37 KB) y mayo (288 entradas, ~268 KB) | Census | [`docs/codex/peticiones-estilos.md`](../peticiones-estilos.md) | **P0** | Rotar mayo a `archivo/peticiones-estilos-2026-05.md`; raíz queda en ~38 KB (−88 %) |
| H-TA2 | `orquestador/estado-fases.md` 188,5 KB / 1 441 líneas / 112 fases / 61 cerradas | Census | [`docs/codex/orquestador/estado-fases.md`](../orquestador/estado-fases.md) | **P1** | **Opción A confirmada por usuario**: rotar por dominio a `estado-fases/empleados.md`, `/nomina.md`, `/ux-comercial.md`, etc. Raíz queda como índice ligero |
| H-TA3 | `CHANGELOG.md` 62,5 KB / 27 entradas todas 2026-05 | Census | [`docs/codex/CHANGELOG.md`](../CHANGELOG.md) | P1 | Rotar bloque completo a `archivo/CHANGELOG-2026-05.md` cuando junio/julio acumulen |
| H-TA4 | 4 auditorías cerradas o sin cierre formal pesan ~125 KB en `modulos/<m>/` (debían vivir en `auditorias/`) | Census | `modulos/nomina-mensual/auditorias/auditoria-nomina-v2-2026-06.md` (33,4 KB), `modulos/parametros/auditoria-tab-valores-2026-06.md` (28,7), `modulos/nomina-mensual/auditorias/cierre-mensual-audit-post-reset-01.md` (23,2), `modulos/empleados/auditoria-flujos-empleados-2026-05-25.md` (18,6) | P2 | Mover a `auditorias/` o `archivo/` con enlace desde `estado-fases.md` |
| H-TA5 | `modulos/nomina-mensual/preparar-nomina/README.md` 31,1 KB (lista de fases aplicadas embebida) | Census | `modulos/nomina-mensual/preparar-nomina/README.md` | P3 | Adelgazar moviendo la lista de fases aplicadas a `modulos/nomina-mensual/cambios.md` |

### 6.5 Assets (PNG/SVG/SQL)

| ID | Síntoma | Trigger | Ubicación | Severidad | Propuesta |
|----|---------|---------|-----------|-----------|-----------|
| H-AS1 | 105 PNG huérfanos en 14 carpetas `assets/parametros-tab*-*` y `parametros-tablas-observacion` (~12 MB = 70 % del peso total `docs/codex`) | Cruce filename vs referencias `.md` | `docs/codex/assets/parametros-tabs-*/` (14 carpetas) | **P0** | Borrar las 14 carpetas; solo `assets/parametros-tabs/` está referenciado |
| H-AS2 | 4 SVG en `modulos/nomina-mensual/preparar-nomina/imagenes/` todas referenciadas | Cruce | — | OK | Mantener |
| H-AS3 | 2 SQL: `modulos/parametros/permisos-bd-ejemplo.sql` vivo + `temas/parametros-permisos-bd-ejemplo.sql` stub | Cruce | — | OK | Mantener (forma parte de política `temas/` ↔ `modulos/`) |
| H-AS4 | 17 PNG vivos en `modulos/nomina-mensual/preparar-nomina/imagenes/` (3 en `actual/` + 14 en `paso-a-paso/`) | Cruce | — | OK | Mantener |

### 6.6 Frescura

> Disclaimer: `LastWriteTime` muestra clusters `2026-05-29 17:05` y `2026-06-02 10:44` por operación de masa (checkout). No es indicativo de edición real. Para análisis preciso por archivo, usar `git log`.

| ID | Síntoma | Trigger | Ubicación | Severidad | Propuesta |
|----|---------|---------|-----------|-----------|-----------|
| H-FR1 | Ninguna carpeta >90 días sin actividad filesystem | Census | n/a | OK | Sin acción |
| H-FR2 | 11 carpetas con `LastWriteTime` máximo en `2026-05-29 17:05` (cluster sin edición real posterior): `estilos/`, `fases/liquidaciones`, `fases/nomina`, `fases/ux-comercial`, `infra/`, `modulos/auth`, `modulos/conceptos-remuneracion`, `modulos/haberes-descuentos`, `modulos/liquidaciones-oficiales`, `modulos/lre`, `normativa/`, `prompts-cursor/`, `temas/`, `ux-comercial/` | Census | varias | P2 | Validar por `git log` cuáles están realmente congelados; los que sí, marcar como "completados" en README del módulo |
| H-FR3 | `context-packs/` última edición 2026-05-16 (~18 días sin tocar) | Census | `docs/codex/context-packs/` | P3 | Generables por `scripts/build-context-pack.ps1`. Confirmar si la generación está vigente |
| H-FR4 | 0 docs autodeclarados WIP / Borrador / TODO / FIXME (todos los matches son lenguaje de producto, no estado del doc) | Regex sobre todos los `.md` | n/a | OK | Sin acción |

### 6.7 Naming

| ID | Síntoma | Trigger | Ubicación | Severidad | Propuesta |
|----|---------|---------|-----------|-----------|-----------|
| H-NA1 | 5 convenciones de naming coexisten sin política escrita: `kebab-case-descriptivo.md`, `MAYUSCULAS-CON-GUION.md` (IDs de fase como nombres de archivo), `prefijo-numerico-NN-tema.md`, `fecha-embebida-YYYY-MM-DD.md`, `nombre-con-camelCase-mid-name.md` | Audit subagente 1 | varias | **P1** | Declarar convención en `mapa-documentacion.md §0`: kebab-case obligatorio; fecha solo en `archivo/`; IDs de fase solo en metadata interna, no en filename |
| H-NA2 | `mapa-documentacion.md` no declara convención de naming pese a coexistir 5 patrones | Inspección | [`docs/codex/orquestador/mapa-documentacion.md`](../orquestador/mapa-documentacion.md) | P1 | Agregar sección "Convención de naming" |
| H-NA3 | Algunos IDs de fase usan ortografía mixta: `EMP-FICHA-SUSTENTABLE-00`, `emp-ficha-sustentable-00.md` (archivo) | Audit subagente 1 | varios | P3 | Confirmar convención: ID de fase en MAYUS, filename en kebab-case lowercase |

## 7. Plan iterativo por lote (declarado, no ejecutado)

| Lote | Foco | Hallazgos cubiertos | Archivos principales | Riesgo |
|------|------|---------------------|----------------------|--------|
| **L0 — Quick wins** | Reparar links rotos en hubs, agregar `auth`/`empresas`/`lre`/`liquidaciones-oficiales` a tabla de módulos, completar `auditorias/README.md`, corregir ruta en `auditoria-nomina-v2-2026-06.md`, marcar `LRE-CONCEPT-RULES-01` y `EMP-PERFIL-LABORAL-SQL-01` como "Parcial" | H-ES1, H-ES4, H-ES6, H-CO2, H-CO7 | `README.md`, `auditorias/README.md`, `modulos/auth/README.md`, `modulos/nomina-mensual/auditorias/auditoria-nomina-v2-2026-06.md`, `orquestador/estado-fases.md` | nulo |
| **L1 — Borrado masivo de assets huérfanos + duplicados** | Eliminar 14 carpetas `assets/parametros-tab*-*` (105 PNG, ~12 MB), borrar 4 duplicados raíz (`prevalidaciones-9-5A/B.md`, `tests-empleados.md`, `tests-parametros.md`), borrar `estilos/observaciones.md` | H-AS1, H-DU1, H-DU2, H-DU4 | `assets/parametros-tabs-*/` (delete), raíz (delete 4 archivos) | bajo |
| **L2 — Consolidación trivial (D2 + D3 + duplicado en estado-fases)** | Unificar `prompts-cursor/` en `prompts/` (D2), validar 13 stubs `temas/` (D3), borrar duplicado `NOM-MODALES-PERIODO-REVISION-COPY-03` en `estado-fases.md` | H-CO8, D2, D3 + H-DU11 | `prompts/`, `prompts-cursor/`, `temas/`, `estado-fases.md` | bajo |
| **L3 — Rotar `peticiones-estilos.md`** (D4) | Rotar mayo a `archivo/peticiones-estilos-2026-05.md`, dejar índice ligero | H-TA1, D4 | `peticiones-estilos.md`, `archivo/peticiones-estilos-2026-05.md` (nuevo) | bajo |
| **L4 — Rotar `estado-fases.md` por dominio** (Opción A confirmada) | Crear `estado-fases/empleados.md`, `/nomina.md`, `/ux-comercial.md`, `/parametros.md`, `/erp-shell.md`, `/auditorias.md`, `/movimientos.md`; raíz queda como índice + activas | H-TA2 | `estado-fases.md`, `estado-fases/*` (nuevos) | **medio** (links cruzados desde toda la doc) |
| **L5 — Subagrupar `modulos/nomina-mensual/`** (D1 + segregación V1/V2) | Subcarpetas `motor-calculo/`, `flow/`, `modales-periodo/`, `prevalidaciones/`, `workspace/`, `vision/`, `revisiones/` + segregación V1/V2 (`v1/`, `v2/`, `shared/` o etiquetado en frontmatter) | H-CO1, D1, H-DU6, H-DU7, H-DU8 | `modulos/nomina-mensual/**` | **medio** (≈70 archivos movidos + links cruzados) |
| **L6 — Coherencia con código + READMEs faltantes** | Crear `diseno/README.md`, `modulos/lre/README.md`, stubs `modulos/<feature-aislada>/README.md` para asistente-preguntor / licencias-medicas / reportes / dashboard; aclarar `modulos/auth` vs `core/auth`; renombrar `modulos/parametros/` → `modulos/parametros-generales/` o documentar equivalencia | H-CO3, H-CO4, H-CO6, H-ES2, H-ES3 | `diseno/`, `modulos/lre/`, `modulos/auth/`, `modulos/parametros/` | bajo |
| **L7 — Naming + cierre fase** | Declarar convención de naming en `mapa-documentacion.md §0`; renombrar archivos inconsistentes; rotar 4 snapshots con fecha en nombre a `archivo/`; rotar `CHANGELOG.md` a `archivo/CHANGELOG-2026-05.md`; mover 4 auditorías mal ubicadas a `auditorias/`; consolidar clusters de iteraciones (D2-NomFlow, ModalesRevision, BitacoraV3, ReformaGradualidad); crear entrada `DOCS-AUDIT-02` en estado-fases (formato L4) | H-NA1, H-NA2, H-NA3, H-DU12, H-TA3, H-TA4, H-DU6, H-DU7, H-DU9, H-DU3, H-CO9, H-CO10, H-CO11 | varias | bajo |

### Criterio de cierre por lote

- Cada lote produce un commit lógico independiente.
- Cada lote actualiza este documento con su sección "L# cerrado" + tabla de hallazgos resueltos.
- Sin tocar `angular.json`, `src/styles*.css`, `src/styles/*`, código de la app, `bd/`, motor, RPCs, SQL.
- Sin reescribir contratos vivos (`AGENTS.md`, `noia-ui-manual.md`, READMEs de módulo salvo agregar fila/sección).
- Validación post-lote: re-contar archivos (`Get-ChildItem docs/codex -Recurse | Measure-Object`), verificar links rotos en hubs, build Angular development verde si se tocó algo referenciado desde reglas Cursor.

## 8. Lo que NO está en alcance

- Reescribir contratos vivos: `docs/codex/AGENTS.md`, `docs/codex/diseno/noia-ui-manual.md`, `manual-base-proyecto.md`, READMEs de módulo (solo agregar filas/secciones).
- Tocar código de la app (`src/`), `bd/`, motor, RPCs, SQL.
- Tocar las reglas `.cursor/rules/*.mdc` salvo enlaces rotos detectados.
- Renombrar la convención de IDs de fase (`EMP-*`, `NOMINA-V2-*`, etc.).
- Validar contra `git log` (audit hizo cruces filesystem; el clúster `2026-05-29 17:05` es operación de masa, no edición real).
- Auditar `bd/base/v11/partes/*.bak` (fuera de `docs/codex`).
- Cualquier cambio en `src/styles*` o `angular.json` aunque algún doc lo mencione.

## 9. Estado

- **Fase 0 cerrada (2026-06-03)**: este documento. 332 `.md` + 139 assets revisados read-only; 10 hallazgos top + 38 hallazgos categorizados en 6 dimensiones; plan iterativo L0–L7 declarado.
- **Lotes L0–L7**: pendientes de aprobación lote por lote. El usuario decide qué ejecutar y en qué orden tras leer estos hallazgos.
- **Pendientes opcionales heredados de DOCS-AUDIT-01**: D1 (cubierto en L5), D2 (en L2), D3 (en L2), D4 (en L3) absorbidos por este plan. D5 y D6 ya hechos.

## 10. Anexo · Métricas y método

### 10.1 Subagentes ejecutados

| Subagente | Foco | Hallazgos producidos |
|-----------|------|---------------------|
| 1 | Estructura + naming | Tabla de 32 carpetas, naming inconsistente, índices declarados vs reales, stubs `temas/` (14 vivos + 5 reales + 1 SQL) |
| 2 | Coherencia código + frescura | Tabla módulos doc vs feature (11 filas), 127 fases mapeadas en `estado-fases.md`, 30+ docs antiguos, frescura por subcarpeta, marcadores WIP (0 encontrados), referencias SQL/RPC (top 10) |
| 3 | Duplicidad + tamaño | Tabla maestra basenames repetidos, 105 PNG huérfanos en 14 carpetas, top 30 por tamaño, esquema de rotación para `peticiones-estilos.md` y `estado-fases.md`, clusters `nomina-mensual/` |

### 10.2 Herramientas usadas

- `Get-ChildItem -Recurse -File -Filter "*.md"` para inventario.
- `Sort-Object LastWriteTime` para frescura (con disclaimer de cluster).
- `Group-Object Extension` para tipos de archivo.
- `Test-Path` sobre los enlaces declarados de cada fase (muestra crítica).
- `Read` sobre hubs (`README.md`, `mapa-documentacion.md`, `contexto-rapido.md`, `auditoria-docs-2026-06.md`, `estado-fases.md`, `app.routes.ts`).
- `Grep` (rg) sobre patrones WIP/borrador/TODO/FIXME en todos los `.md`.
- `Grep` sobre RPCs/tablas con regex agrupada y conteo por archivo.
- `Compare-Object` por hash MD5 para detectar duplicados byte-equivalentes (`prevalidaciones-9-5A/B.md`).

### 10.3 Limitaciones reconocidas

- No se usó `git log`: dos clusters de timestamps (`2026-05-29 17:05`, `2026-06-02 10:44`) son operación de masa (checkout/clone/restore), no indican edición real. Para frescura precisa por archivo, usar `git log --format='%ai %an %s' <file>`.
- La detección de duplicidad fina (basenames similares con contenido distinto) se hizo por muestreo. Pueden quedar duplicados sutiles en clusters `*-NN.md` no inspeccionados línea a línea.
- La verificación de links rotos cubrió hubs principales (`README.md`, `mapa-documentacion.md`, `contexto-rapido.md`, `auditorias/README.md`, `temas/README.md`, READMEs de los 11 módulos). Links internos cruzados en docs profundos no se verificaron al 100 %; quedaría como trabajo de L0 si se decide ejecutarlo.
