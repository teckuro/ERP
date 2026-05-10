# AUTH-SEED-01 - Usuario Supabase Auth y periodo E2E

## Objetivo

Definir usuario y periodo de prueba para correr E2E real de nomina.

## Alcance

- Crear/usar usuario de desarrollo en Supabase Auth.
- Configurar periodo E2E local.
- Validar login manual/E2E.

## Fuera de alcance

- Credenciales en repo.
- service_role.
- Datos productivos.

## Estado actual

**Estado:** `implementada`  
**Tipo:** `E2E`  
**Modulo:** `Auth / Nomina`

El E2E real logro autenticarse y ejecutar el flujo hasta persistencia.

## Dependencias

- AUTH-BASE-01.
- ENV-E2E-01.

## Evidencia

- E2E real consolidado con periodo `2026-04`.

## Reglas funcionales

- No documentar password.
- No usar service_role en UI/tests.
- Usuario E2E debe ser de desarrollo/controlado.

## Flujo resumido

```txt
crear usuario dev
-> configurar env local
-> login por UI
-> ejecutar E2E nomina
```

## Archivos relacionados

- `modulos/auth/README.md`
- `modulos/auth/contrato-general.md`

## Validacion esperada

- Login real.
- E2E con usuario authenticated.

## Criterios de cierre

- Usuario E2E funciona.
- Periodo definido.
- No hay secrets en docs.

## Pendientes

- Roles/permisos avanzados futuros.

## Relacion con fases siguientes

Habilita `NOM-E2E-02`.
