# NOM-SAVE-DIAG-01 - Diagnosticar fallo real de guardado RPC del resultado preliminar

## Objetivo

Convertir un fallo generico de guardado en error real, causa raiz y correccion minima verificable.

## Alcance

- Captura error Supabase/Postgres sanitizado.
- Diagnostico payload/RPC.
- Normalizacion de vigencias en trazabilidad.
- E2E real reejecutado.

## Fuera de alcance

- SQL/RPC/RLS.
- Formulas legales.
- Cierre/liquidaciones.

## Estado actual

**Estado:** `implementada`  
**Tipo:** `saneamiento`  
**Modulo:** `Nomina mensual`

Fallo `22007 invalid input syntax for type date: "2026-04"` cerrado normalizando `YYYY-MM` a `YYYY-MM-01` para columnas `DATE`.

## Dependencias

- NOM-E2E-02.
- RPC real aplicada.

## Evidencia

- Error real sanitizado.
- E2E real OK.
- Snapshot activo `id_calculo_periodo=11`.

## Reglas funcionales

- Mantener mensaje visible seguro.
- Log dev/E2E sanitizado.
- No exponer secrets.

## Flujo resumido

```txt
fallo generico
-> capturar error real
-> identificar fecha YYYY-MM
-> normalizar payload
-> E2E OK
```

## Archivos relacionados

- `modulos/nomina-mensual/README.md`
- `modulos/nomina-mensual/contrato-general.md`
- `modulos/nomina-mensual/motor-calculo-persistencia-03B.md`
- `orquestador/estado-fases.md`

## Validacion esperada

- `npx ng test --watch=false`: 415 tests.
- `npm run build`.
- E2E nomina OK.

## Criterios de cierre

- Causa raiz documentada.
- No requiere reaplicar SQL.

## Pendientes

- Cierre operativo.

## Relacion con fases siguientes

`NOM-E2E-CLOSE-01`.
