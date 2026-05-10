# Parametros - periodo activo, vigencia y catalogos

## Objetivo

Explicar como se clasifica la informacion del modulo Parametros segun el periodo `YYYY-MM`, la vigencia (`vigencia_inicio`/`vigencia_fin`) y los catalogos globales. Esta clasificacion guia la UI y las reglas de negocio.

## Clasificacion de tipos

| Tipo | Descripcion | Ejemplo | UI |
|------|-------------|---------|----|
| **PERIODO_MENSUAL** | Registros cuya clave incluye `periodo` y representan un snapshot del mes. | `parametros_generales`, `tramo_carga` | Empty state: “No hay datos cargados para {YYYY-MM}”. La accion sugerida es realizar carga mensual. |
| **VIGENCIA** | Filas versionadas por fechas (`vigencia_inicio`/`vigencia_fin`); el periodo activo solo sirve para resolver que fila esta vigente. | `parametros_legales`, `afc_parametro`, `tabla_impuesto_unico` | Mostrar “vigentes al periodo activo {YYYY-MM}” y filtrar por solape. |
| **CATALOGO_GLOBAL** | Catalogos que no dependen del periodo activo; el campo `periodo` puede ser nulo para trazabilidad. | `ccaf_entidad`, `organismo_administrador_ley_16744` | Mostrar “catalogo general”; no culpar al periodo si el catalogo esta vacio. |
| **CONFIG_EMPRESA** | Preferencias del cliente almacenadas en snapshots mensuales o tablas propias. | CCAF y Mutual seleccionada en `parametros_generales` | “Configuracion aplicable al periodo activo”. |

## Estado del periodo

La tabla `periodo_remuneracion` almacena el estado operativo del periodo. Los estados validos y sus transiciones se documentan en `contrato-general.md`.

## Mensajes UI

1. **PERIODO_MENSUAL** - “Datos cargados para {YYYY-MM}.” / vacio: “No hay … cargados para {YYYY-MM}.”
2. **VIGENCIA** - “Vigentes al periodo activo {YYYY-MM}.” / vacio: “No hay registros vigentes para el periodo activo.”
3. **CATALOGO_GLOBAL** - “Catalogo general.” / vacio: “Sin registros en catalogo.”
4. **CONFIG_EMPRESA** - “Configuracion aplicable al periodo activo.”.

## Pendientes

- Validar constraint SQL para evitar solapamientos de vigencia.
- Ajustar copy de tablas que mezclan vigencia y periodo (`trabajo_pesado_parametro`, etc.).
