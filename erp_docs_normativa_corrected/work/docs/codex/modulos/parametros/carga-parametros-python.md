# Parametros – carga mensual y scripts Python v6.11

## Objetivo

Definir el contrato para la carga de parametros con scripts Python v6.11. 
La carga se realiza por periodo `YYYY-MM` y se divide en preparacion parcial y carga mensual oficial. 
No todos los datos se cargan cada mes; algunos pertenecen a catalogos globales o vigencias independientes.

## Preparacion de periodo

El modo **preparar** genera un SQL con seeds y catalogos normativos sin ejecutar scraping de valores mensuales. 
Se invoca con:

```
python 00_ejecutar_flujo_parametros_v611.py --periodo YYYY-MM --modo preparar
```

Acciones:

- Crea o actualiza `periodo_remuneracion` con estado `parcial`.
- Carga catalogos normativos globales (`ccaf_entidad`, `organismo_administrador_ley_16744`, etc.).
- Genera vigencias base (`parametros_legales`, `reforma_previsional_parametro`, trabajo pesado, etc.).
- No carga `parametros_generales`, `tramo_carga`, `tramo_impuesto` ni snapshots mensuales.

Reglas:

- `parcial` indica que faltan datos mensuales oficiales.
- No se copian UF/UTM/UTA ni valores del mes anterior.
- La preparacion es idempotente y no degrada estados `cerrado` ni `corregido`.

## Carga mensual oficial

El modo **mensual** ejecuta el scraping de indicadores mensuales, integra los seeds normativos y genera el SQL final:

```
python 00_ejecutar_flujo_parametros_v611.py --periodo YYYY-MM --modo mensual
```

Acciones:

- Genera JSON mensual con UF, UTM, tramos, topes, etc.
- Renderiza el SQL final que inserta en tablas mensuales, vigencias y catalogos segun corresponda.
- Marca `periodo_remuneracion.estado = cargado` cuando todas las secciones obligatorias estan presentes.

## Categorias de datos

| Categoria | Descripcion | Ejemplos | Reglas |
|-----------|-------------|----------|--------|
| **CARGA_MENSUAL** | Datos cuya clave natural incluye `periodo`. | `parametros_generales`, `tramo_carga`, `tramo_impuesto` | Se ejecutan por periodo; la salida vive en `Python/runs/<YYYY-MM>/mensual`. |
| **CARGA_VIGENCIA** | Datos versionados por vigencia, opcionalmente alineados al periodo. | `parametros_legales`, `afc_parametro`, `tabla_impuesto_unico` | No duplicar cada mes; validar solapes y usar vigencias para resolver el periodo activo. |
| **SEED_NORMATIVO** | Catalogos normativos estables o con vigencia propia. | Gradualidad 8,5 %, Ley SANNA, trabajo pesado | Deben ser idempotentes y no dependen del periodo mensual. |
| **CATALOGO_GLOBAL** | Maestros que no dependen del periodo. | `ccaf_entidad`, `institucion_apv`, `forma_pago_apv` | Usar `codigo` o nombre normalizado como clave; pueden tener vigencia opcional. |
| **CONFIG_EMPRESA** | Configuracion del cliente almacenada en snapshots mensuales. | CCAF y Mutual del empleador | Puede ser mensual o de vigencia propia. |

## Estado del periodo

La carga actualiza `periodo_remuneracion.estado`. Valores validos y transiciones se detallan en `contrato-general.md`.

## Validaciones

- La suma de campos en gradualidad debe cuadrar con el total empleador.
- No debe haber rangos de vigencia solapados.
- Cada periodo probado debe caer en un unico tramo.
- Los scripts son idempotentes; re-ejecutar para un periodo debe actualizar solo ese periodo.

## Pendientes

- Integrar RLS/JWT para limitar quien puede ejecutar cargas.
- Exponer rutas de previsualizacion de datos mensuales antes de aplicarlos.
- Consolidar configuraciones de empresa en una fuente unica.
