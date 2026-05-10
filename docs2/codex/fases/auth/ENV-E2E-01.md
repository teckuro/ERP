# ENV-E2E-01 - Preparacion de entorno E2E nomina

## Objetivo

Preparar variables y contrato de entorno para ejecutar el E2E real de nomina sin secrets en repo.

## Alcance

- Variables E2E locales.
- Validacion de conexion SQL local.
- Placeholders seguros.
- Confirmacion de permisos RPC.

## Fuera de alcance

- Crear credenciales en docs.
- Usar service_role.
- Insertar datos productivos.

## Estado actual

**Estado:** `implementada`  
**Tipo:** `E2E`  
**Modulo:** `Auth / Nomina`

El entorno E2E quedo preparado y luego fue usado por el flujo real.

## Dependencias

- AUTH-BASE-01.
- Supabase remoto/controlado.
- `.env` local no versionado.

## Evidencia

- `SUPABASE_DB_URL` local disponible.
- RPC con `authenticated=true`, `anon=false`.

## Reglas funcionales

- No exponer connection string.
- No versionar password.
- E2E real se activa con variables explicitas.

## Flujo resumido

```txt
configurar variables locales
-> validar conexion
-> ejecutar E2E seguro/real segun flags
```

## Archivos relacionados

- `modulos/auth/README.md`
- `modulos/nomina-mensual/README.md`

## Validacion esperada

- E2E modo seguro pasa aunque falten variables reales.
- E2E real corre solo con flags.

## Criterios de cierre

- Variables definidas.
- Sin secrets en repo.
- Permisos RPC revisados.

## Pendientes

- Mantener credenciales fuera de Git.
- Revisar usuario E2E si cambia ambiente.

## Relacion con fases siguientes

Base para `AUTH-SEED-01` y `NOM-E2E-02`.
