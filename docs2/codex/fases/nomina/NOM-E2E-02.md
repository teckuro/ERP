# NOM-E2E-02 - Ejecucion real de flujo nomina authenticated

## Objetivo

Validar de punta a punta el flujo real de Preparar nomina con usuario authenticated.

## Alcance

- Login real.
- Periodo E2E.
- Base de nomina.
- Calculo preliminar.
- Guardado RPC.
- Snapshot BD.
- Aprobacion.
- Recarga/recuperacion.

## Fuera de alcance

- Cierre.
- Liquidaciones.
- Previred/LRE/banco.
- Datos productivos.

## Estado actual

**Estado:** `cerrada_documentalmente`  
**Tipo:** `E2E`  
**Modulo:** `Nomina mensual / Auth`

La ejecucion quedo cerrada por `NOM-E2E-CLOSE-01` despues de corregir el fallo de fecha en `NOM-SAVE-DIAG-01`.

## Dependencias

- AUTH-BASE-01.
- EMP-ADV-FICHA-01.
- NOM-DB-APPLY-01.
- NOM-SAVE-DIAG-01.

## Evidencia

- `npx playwright test tests/nomina-mensual.e2e.spec.ts --workers=1`: OK, 1 passed / 1 skipped.
- Periodo `2026-04`.
- Snapshot `id_calculo_periodo=11`.

## Reglas funcionales

- No repetir E2E si cambia evidencia sin necesidad.
- No exponer credenciales.

## Flujo resumido

```txt
login
-> preparar nomina
-> calcular
-> guardar RPC
-> consultar BD
-> aprobar
-> recargar
-> recuperar
```

## Archivos relacionados

- `modulos/nomina-mensual/README.md`
- `modulos/nomina-mensual/contrato-general.md`
- `modulos/nomina-mensual/motor-calculo-persistencia-03B.md`
- `orquestador/estado-fases.md`

## Validacion esperada

- E2E real.
- SQL post-guardado.
- Unitarios/build.

## Criterios de cierre

- E2E real pasa hasta aprobacion recuperada.

## Pendientes

- Cierre operativo.

## Relacion con fases siguientes

`NOM-CIERRE-DESIGN-01`.
