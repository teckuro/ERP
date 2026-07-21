# Modulo Auth - punto de entrada

> AUTH-BASE-01: autenticacion base con Supabase Auth para sesion `authenticated`, rutas internas protegidas y logout visible. No implementa roles avanzados, modulo de usuarios ni permisos finos.

## Estado

**AUTH-BASE-01** implementado como base minima de sesion de desarrollo.

Incluye:

- rutas publicas `/login`, `/recuperar-contrasena` y `/actualizar-contrasena`;
- recuperacion self-service con `resetPasswordForEmail` + evento `PASSWORD_RECOVERY` + `updateUser`;
- `AuthService` sobre el cliente Supabase existente;
- `authGuard`/`authChildGuard` para rutas internas;
- usuario conectado y accion `Cerrar sesion` en el header;
- soporte E2E para login real con variables locales;
- documentacion de usuario de prueba sin credenciales.

## Validacion NOM-E2E-02

El 2026-05-09 se ejecuto la fase NOM-E2E-02 en este checkout. Esa primera validacion real quedo bloqueada porque el entorno no tenia `E2E_NOMINA_REAL`, credenciales Supabase Auth, periodo E2E ni `SUPABASE_DB_URL`.

Resultado local:

- no se pudo validar un login real authenticated ni el flujo real de nomina contra BD;
- el E2E quedo en modo seguro con 1 caso omitido y 1 caso OK;
- no se crearon usuarios, snapshots ni datos de prueba;
- no se uso `service_role` ni se documentaron secretos.

Estado actualizado por NOM-E2E-CLOSE-01:

- el flujo real authenticated de nomina queda validado documentalmente para `2026-04`;
- se uso login real por Supabase Auth sin exponer credenciales;
- el E2E cubre guardado RPC, consulta BD, aprobacion operativa y recuperacion tras recargar;
- evidencia consolidada: `npx playwright test tests/nomina-mensual.e2e.spec.ts --workers=1` OK, 1 passed / 1 skipped.

## Preparacion ENV-E2E-01

ENV-E2E-01 confirma el ambiente Supabase remoto/controlado usado por el frontend y la conexion SQL disponible en `.env` local. Tambien agrega placeholders seguros en `.env.example` para las variables E2E de nomina.

Estado:

- `SUPABASE_DB_URL` esta disponible localmente para validaciones SQL post-E2E;
- la RPC `guardar_nomina_calculo_snapshot` mantiene `authenticated=true` y `anon=false`;
- para repetir el E2E en otro ambiente siguen siendo requeridos usuario Supabase Auth de desarrollo, password local y `E2E_NOMINA_PERIODO`;
- el hito E2E real de nomina queda cerrado por NOM-E2E-CLOSE-01, sin commitear secretos.

## Documentos

| Archivo | Rol |
|---|---|
| [`contrato-general.md`](./contrato-general.md) | Alcance, seguridad, rutas protegidas, E2E y fuera de alcance de AUTH-BASE-01 |
| [`plantilla-correo-recuperacion.md`](./plantilla-correo-recuperacion.md) | Asunto + HTML de Reset password (Dashboard / local) |

## Relacion con Nomina

`Preparar nomina` queda detras de sesion Supabase `authenticated`. El guardado RPC `guardar_nomina_calculo_snapshot`, la lectura de snapshot completo y la aprobacion operativa se ejecutan con la sesion activa del usuario.

La fase no cambia motor, formulas legales, cierre, liquidaciones oficiales, Previred, LRE ni banco.


## Estado canonico 2026-05-10

Auth base esta implementado y fue suficiente para validar el E2E real authenticated de nomina.

Incluye:

- Login base.
- Rutas internas protegidas.
- Sesion Supabase `authenticated`.
- Logout visible.
- E2E real de nomina con login.

Fuera de alcance vigente:

- Roles avanzados.
- Modulo completo de usuarios.
- Permisos finos por empresa.
- Uso de `service_role` desde frontend.

Fases relacionadas:

- `AUTH-BASE-01`, `ENV-E2E-01`, `AUTH-SEED-01`: registradas en [`../../orquestador/estado-fases.md`](../../orquestador/estado-fases.md). El detalle operativo vive en este README y en [`contrato-general.md`](./contrato-general.md). No hay carpeta `fases/auth/` separada porque AUTH-BASE-01 sirve como contrato canónico.
