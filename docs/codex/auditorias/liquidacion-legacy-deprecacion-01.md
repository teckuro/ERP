# Liquidación legacy — deprecación y aislamiento de uso (LIQ-00)

**Fecha:** 2026-05-28  
**Alcance:** Documentación y comentarios únicamente. Sin borrado SQL, sin migración de datos, sin cambio del motor TS ni del flujo activo.

## Objetivos

Marcar como **legacy/deprecado** los objetos de liquidación SQL históricos, dejar explícito el reemplazo por el flujo prenómina + emisión oficial, y registrar dependencias residuales para no romper compatibilidad.

## Objetos deprecados

| Objeto | Rol legacy | Reemplazo activo |
|--------|------------|------------------|
| `fn_generar_liquidacion` | Motor SQL monolítico; escribe `liquidacion` / `liquidacion_detalle` | Motor TS → `nomina_calculo_*` → `generar_liquidaciones_oficiales` → `nomina_liquidacion_*` |
| `fn_validar_liquidacion` | Validador companion del motor SQL legacy | `fn_validar_prenomina_periodo`, hashes y estados en `nomina_calculo_periodo` |
| `liquidacion` | Cabecera de liquidación generada por SQL legacy | `nomina_liquidacion_periodo`, `nomina_liquidacion_trabajador` |
| `liquidacion_detalle` | Líneas de detalle del motor SQL legacy | `nomina_liquidacion_concepto` |

## Mapa de referencias

### SQL (definición y uso interno)

- **Definición:** `bd/base/v11/partes/04_funciones.sql` (`fn_generar_liquidacion`, `fn_validar_liquidacion`), `bd/base/v11/partes/02_tablas.sql` (`liquidacion`, `liquidacion_detalle`).
- **Índices:** `bd/base/v11/partes/03_indices.sql`.
- **Reset:** `bd/base/v11/partes/00_reset.sql` (DROP conservado para rebuild local).
- **Ejemplo comentado (no activo):** `bd/base/v11/partes/07_triggers.sql`.
- **Sin caller activo en RPCs de nómina:** `generar_liquidaciones_oficiales` (`23_liquidaciones_oficiales_rpc.sql`) solo toca tablas `nomina_*`.

### TypeScript / Angular

| Archivo | Uso | ¿Flujo mensual activo? |
|---------|-----|------------------------|
| `src/app/core/models/database.types.ts` | Tipos generados PostgREST | No (tipos) |
| `src/app/features/liquidaciones-oficiales/data-access/liquidaciones-oficiales.repository.ts` | RPC `generar_liquidaciones_oficiales` | Sí — **no** usa legacy |
| `src/app/features/haberes-descuentos/data-access/haberes-descuentos.repository.ts` | `contarUsoConcepto()` → COUNT en `liquidacion_detalle` | No — guard de borrado de concepto |
| UI / motor nómina mensual | Sin `.rpc('fn_generar_liquidacion')` ni `.from('liquidacion')` | No |

### Tooling / tests / docs

- `scripts/lib/empleados-cleanup.mjs`, `tests/empleados-nomina-error-fixtures.spec.ts`, `src/app/supabase/rutas.txt`, `docs/codex/orquestador/diccionario-tablas-canonicas.md`.

## Evaluación de riesgo

| Riesgo | Nivel | Notas |
|--------|-------|-------|
| Flujo mensual deja de liquidar | **Ninguno** | El flujo activo ya usa `nomina_liquidacion_*`. |
| Borrar tablas legacy rompe app | **Alto si se borra** | `contarUsoConcepto` sigue leyendo `liquidacion_detalle`. |
| Marcar deprecado en comentarios | **Nulo** | Sin cambio de DDL ni lógica. |
| Datos históricos en `liquidacion` | **Medio a futuro** | Requiere fase aparte si se migran o archivan. |

## Decisión

1. **No eliminar** `fn_generar_liquidacion`, `fn_validar_liquidacion`, `liquidacion` ni `liquidacion_detalle`.
2. **No migrar datos** en esta fase.
3. **Documentar** con banners `-- [LEGACY/DEPRECADO]` en `partes/` y cerrar LIQ-00 en el diccionario canónico.
4. **Aislar uso:** el único punto de app que toca legacy es el guard de conceptos; documentado con JSDoc. Una fase futura podría contar también `nomina_liquidacion_concepto` sin quitar el legacy de inmediato.

## Archivos tocados en esta fase

- `bd/base/v11/partes/04_funciones.sql` — comentarios sobre funciones legacy.
- `bd/base/v11/partes/02_tablas.sql` — comentarios sobre tablas legacy.
- `src/app/features/haberes-descuentos/data-access/haberes-descuentos.repository.ts` — JSDoc en `contarUsoConcepto`.
- `docs/codex/orquestador/diccionario-tablas-canonicas.md` — LIQ-00 cerrado.
- `docs/codex/auditorias/liquidacion-legacy-deprecacion-01.md` — este documento.

## Explícitamente no cambiado

- Firmas o cuerpos de funciones SQL; DDL de tablas; índices; RLS.
- `database.types.ts`, `crear_sql_v6_11_integrada.sql`, `bd/base/historico/*`.
- Motor TS, UI, estilos globales, `angular.json`, lógica de repositorios (solo comentario JSDoc).

## Flujo activo (referencia)

```
Motor TS (prenómina)
  → nomina_calculo_* (snapshot + hashes)
  → fn_aprobar_prenomina_periodo
  → generar_liquidaciones_oficiales
  → nomina_liquidacion_*
```

Legacy (no usar en producto):

```
fn_generar_liquidacion → liquidacion + liquidacion_detalle
fn_validar_liquidacion → lectura de liquidacion / liquidacion_detalle
```
