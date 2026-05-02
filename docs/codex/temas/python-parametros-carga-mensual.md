# Python - contrato de carga de parametros v6.11

Fecha de revision Codex: 2026-05-01.

## Regla general

Los scripts Python de parametros no deben tratar todo como carga mensual del periodo. El periodo `YYYY-MM` es obligatorio para snapshots mensuales, pero solo es contexto para vigencias, seeds normativos, catalogos globales y configuracion empresa.

Esta guia complementa `docs/codex/temas/parametros-vigencia-y-periodo.md`.

## Inventario de scripts revisados

| Script | Proposito | Fuente | Destino | Periodo | Salida | Riesgo |
|--------|-----------|--------|---------|---------|--------|--------|
| `00_ejecutar_flujo_parametros_v611.py` | Orquesta seed, carga mensual, normativa, IPS, logs y aplicacion opcional. | Scripts `01`, `03`, `04`, `05`, `06`; opcional `psql`. | `out_v611_seed`, `runs/<periodo>/mensual`, `normativa_base`, `ips_tasas`, `logs`. | Requiere `--periodo`. | Logs y rutas por periodo. | Seguro sin `--aplicar-*`; con aplicacion revisar DSN/ambiente. |
| `01_scrape_semillas_v611.py` | Scraping y normalizacion de seed estructural. | SPensiones, PreviRed, Supersalud y catalogos internos. | `afp`, `afp_vigencia`, `salud`, `entidad_previsional_ips`, movimientos, inasistencias, conceptos. | Opcional `--periodo`; usa `vigencia_inicio` comun. | `seed_v611.json`, `seed_v611.sql`. | Incluye `TRUNCATE TABLE`; tratar como bootstrap, no mensual. |
| `02_normativa_base_v611.py` | Normativa y maestros faltantes. | SPensiones, Hacienda, ChileAtiende, SUSESO, PreviRed. | `trabajo_pesado_parametro`, SANNA, `reforma_previsional_parametro`, Ley 16.744, CCAF, APV. | Puede anclar salida por periodo, pero la semantica es vigencia/catalogo. | JSON y SQL normativo. | Usa `CREATE/ALTER IF NOT EXISTS` y `ON CONFLICT`; no debe duplicar gradualidad. |
| `03_scrape_parametros_mensuales_v611_json.py` | Obtiene indicadores mensuales y arma JSON del periodo. | PDF PreviRed mensual, SII, seed base. | `periodo_remuneracion`, `parametros_generales_compat`, `parametros_legales`, `afc_parametro`, `tramo_carga`, impuesto, `afp_vigencia_updates`. | Requiere `--periodo`. | JSON mensual y manifest. | Mezcla mensuales y vigencias de origen mensual; el render debe mantener categorias. |
| `04_render_parametros_mensuales_v611_sql_full.py` | Renderiza SQL final desde JSON mensual enriquecido. | JSON de `03`/`05`. | Mensuales, vigencias, catalogos normativos, gradualidad, IPS. | Lee periodo desde JSON. | SQL final por periodo. | `DELETE` solo para periodo/vigencia mensual directa; catalogos y gradualidad por `ON CONFLICT`. |
| `05_build_parametros_mensuales_v611_full.py` | Wrapper completo: `03`, merge normativa `02`, merge IPS `06`, render `04`. | Scripts locales y seed base. | JSON/SQL mensual enriquecido. | Requiere `--periodo`. | JSON, SQL y manifest. | Puede usar red si no se opera offline/sin validar web. |
| `06_scrape_ips_tasas_v611.py` | Genera matriz IPS/ex cajas. | IPS web; fallback local. | `ips_ex_caja_tasa_basica` via `ips_tasa_basica`. | Requiere `--periodo`; `vigencia_inicio` = inicio de mes. | JSON IPS. | No aplica SQL directo. |
| `test_reforma_previsional_gradualidad_v611.py` | Valida gradualidad 8,5 %. | `02_normativa_base_v611.py`. | No escribe tablas. | Prueba periodos clave. | Consola. | Debe pasar antes de aceptar cambios de gradualidad. |
| `v611_parametros_generales_schema.py` | Metadatos de `parametros_generales`. | Definicion local. | Render SQL. | No aplica. | Import. | Mantener sincronizado con v11. |

## Contrato oficial por categoria

### CARGA_MENSUAL

Datos cuya clave natural incluye `periodo` `YYYY-MM`.

- `periodo_remuneracion`
- `parametros_generales`
- `tramo_carga`
- `tramo_impuesto`
- `ley_16744_parametros`

Reglas:

- Se ejecuta por periodo.
- La salida vive bajo `Python/runs/<YYYY-MM>/...`.
- Reejecutar reemplaza o upsertea solo ese periodo.
- No borra catalogos globales ni historicos completos.
- La UI puede decir "sin datos del periodo" solo para estas tablas.

### CARGA_VIGENCIA

Datos versionados por `vigencia_inicio` / `vigencia_fin`. El periodo activo sirve para resolver la fila aplicable, no para duplicar registros por mes.

- `parametros_legales`
- `afc_parametro`
- `tabla_impuesto_unico`
- `afp_vigencia`
- `salud`
- `salud_plan`
- `reforma_previsional_parametro`
- `ips_ex_caja_tasa_basica`

Reglas:

- No duplicar una misma norma en todos los meses.
- Validar `vigencia_inicio <= vigencia_fin` si existe fin.
- Validar solapes por clave natural.
- Usar estado vigente, futuro o historico contra el periodo activo.

### SEED_NORMATIVO

Datos normativos estables o versionados por fuente legal.

- Gradualidad cotizacion empleador 8,5 %.
- Parametros base de reforma previsional.
- Ley SANNA.
- Trabajo pesado normativo.

Reglas:

- Debe tener fuente y referencia/fecha de revision.
- Debe ser idempotente.
- Debe conservar historico por vigencia.
- No calcula liquidaciones ni descuentos finales.

### CATALOGO_GLOBAL

Maestros que no dependen del periodo seleccionado.

- `ccaf_entidad`
- `organismo_administrador_ley_16744`
- `institucion_apv`
- `forma_pago_apv`
- AFP, salud e IPS cuando se usan como catalogo base.

Reglas:

- No mostrarlos como faltantes del periodo.
- Usar `codigo` o nombre normalizado como clave natural.
- Pueden tener `vigente` o `activo`, pero no deben requerir `YYYY-MM`.

### CONFIG_EMPRESA

Configuracion propia del cliente/empresa, separada de los catalogos.

- CCAF seleccionada para la empresa.
- Mutual seleccionada para la empresa.
- Configuracion Previred empresa.

Reglas:

- Puede ser mensual o por vigencia segun modelo.
- En v11 actual, CCAF/Mutual visible en Parametros se toma como configuracion aplicable al periodo desde `parametros_generales`.
- No mezclar seleccion de empresa con catalogo global.

## Gradualidad 8,5 %

Decision: `SEED_NORMATIVO` + `CARGA_VIGENCIA`.

- `02_normativa_base_v611.py` genera los nueve tramos versionados.
- `04_render_parametros_mensuales_v611_sql_full.py` hace UPSERT en `reforma_previsional_parametro` por `vigencia_inicio`.
- No se genera un registro mensual por cada periodo.
- El periodo activo solo determina estado UI: vigente al periodo, futuro o historico.

Validaciones obligatorias:

- `cuenta_capitalizacion_individual + cotizacion_rentabilidad_protegida + seguro_social_sis_cev = aporte_empleador_total`.
- No hay solapamiento de rangos.
- `2025-08` resuelve `1,00 %`.
- `2026-08` resuelve `3,50 %`.
- `2033-08` resuelve `8,50 %`.

## Trabajo pesado

Decision actual: mantener `trabajo_pesado_parametro` como hibrido controlado.

- Dimension de carga/auditoria: `periodo`.
- Dimension normativa: `vigencia_inicio` / `vigencia_fin`.
- El render SQL upsertea por `(codigo, periodo)`.
- La UI puede resolver por solape de vigencia mientras no se cambie el modelo.

Si producto decide que trabajo pesado debe ser puramente por vigencia, requiere migracion y ajuste de claves en una fase SQL propia.

## AFP vs AFP_VIGENCIA

Decision actual:

- `afp` es catalogo maestro visible/operativo.
- `afp_vigencia` guarda tasas, SIS, topes y vigencias.
- `03_scrape_parametros_mensuales_v611_json.py` genera `afp_vigencia_updates` desde seed base e indicadores del periodo.
- `04_render_parametros_mensuales_v611_sql_full.py` crea o actualiza la vigencia AFP mensual tomando como base la ultima vigencia disponible.

Pendiente recomendado: converger la UI de Prevision para mostrar explicitamente la fuente de tasas desde `afp_vigencia` o documentar que `afp` es vista resumida.

## Salidas esperadas

```txt
Python/
  out_v611_seed/
    seed_v611.json
    seed_v611.sql
  runs/
    2026-05/
      mensual/
        parametros_mensuales_2026-05_v611.json
        parametros_mensuales_2026-05_v611.sql
        manifest_parametros_mensuales_2026-05_v611.json
      normativa_base/
      ips_tasas/
      logs/
```

## Validaciones ejecutables

Desde la raiz `angular-erp`, usando la carpeta hermana `Python`:

```powershell
python -B ..\Python\test_reforma_previsional_gradualidad_v611.py
python -B ..\Python\00_ejecutar_flujo_parametros_v611.py --help
python -B ..\Python\03_scrape_parametros_mensuales_v611_json.py --help
python -B ..\Python\04_render_parametros_mensuales_v611_sql_full.py --help
python -B ..\Python\05_build_parametros_mensuales_v611_full.py --help
python -B ..\Python\06_scrape_ips_tasas_v611.py --help
```

No ejecutar `--apply`, `--aplicar-seed` ni `--aplicar-mensual` contra bases reales desde esta fase.

## Pendientes

1. Mover o versionar formalmente la carpeta `Python` si los cambios de scripts deben entrar en el mismo flujo Git que Angular.
2. Agregar una validacion unica de contrato que revise secciones del JSON mensual sin red.
3. Resolver producto/BD para `trabajo_pesado_parametro` si deja de ser hibrido.
4. Resolver convergencia UI para `afp` vs `afp_vigencia`.
