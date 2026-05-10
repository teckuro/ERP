# NOM-DB-APPLY-01 - Aplicacion y validacion SQL/RPC en BD real

## Objetivo

Aplicar y validar los scripts de snapshot/RPC en Supabase remoto controlado.

## Alcance

- Aplicar scripts 15, 16 y 20.
- Validar columnas.
- Validar permisos RPC.
- Probar transaccion con rollback.

## Fuera de alcance

- E2E UI completo en esa fase.
- Cierre/liquidaciones.

## Estado actual

**Estado:** `implementada`  
**Tipo:** `persistencia`  
**Modulo:** `Nomina mensual`

BD real quedo alineada con SQL versionado; permisos `authenticated=true`, `anon=false`.

## Dependencias

- NOM-ATOMIC-01.
- SUPABASE_DB_URL local.

## Evidencia

- SQL remoto controlado.
- Prueba `2099-12` con rollback.
- Sin datos permanentes de prueba.

## Reglas funcionales

- No exponer connection string.
- No abrir `anon`.
- No usar service_role desde frontend.

## Flujo resumido

```txt
aplicar SQL
-> verificar columnas/RPC/permisos
-> prueba transaccional
-> rollback
```

## Archivos relacionados

- `bd/base/v11/partes/15_nomina_calculo_snapshot.sql`
- `bd/base/v11/partes/16_nomina_calculo_snapshot_rls.sql`
- `bd/base/v11/partes/20_nomina_calculo_snapshot_rpc.sql`
- `modulos/nomina-mensual/README.md`
- `modulos/nomina-mensual/contrato-general.md`
- `modulos/nomina-mensual/motor-calculo-persistencia-03B.md`
- `orquestador/estado-fases.md`

## Validacion esperada

- Consultas SQL de permisos/constraints.
- Unitarios/build.

## Criterios de cierre

- RPC existe y compila.
- anon sin execute.
- rollback probado.

## Pendientes

- E2E real UI.

## Relacion con fases siguientes

Habilita `NOM-E2E-02`.
