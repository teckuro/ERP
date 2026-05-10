# AUTH-BASE-01 - Autenticacion base y sesion de desarrollo

## Objetivo

Permitir que las rutas internas del ERP operen con sesion Supabase `authenticated` y un login base suficiente para validar flujos reales.

## Alcance

- `/login` publico.
- Servicio de autenticacion.
- Guards para rutas internas.
- Header con usuario y cierre de sesion.
- E2E de nomina capaz de iniciar sesion por UI.

## Fuera de alcance

- Roles avanzados.
- Modulo completo de usuarios.
- Permisos finos por empresa.
- Auditoria avanzada de sesiones.

## Estado actual

**Estado:** `implementada`  
**Tipo:** `funcional`  
**Modulo:** `Auth`

La autenticacion base esta implementada y documentada. El E2E real de nomina ya se ejecuto con usuario authenticated.

## Dependencias

- Cliente Supabase existente.
- Configuracion publica de Supabase.
- Variables E2E locales sin credenciales versionadas.

## Evidencia

- `npx ng test --watch=false` en fases posteriores.
- E2E real de nomina consolidado en `NOM-E2E-CLOSE-01`.

## Reglas funcionales

- No usar `service_role` desde frontend.
- No loggear tokens ni passwords.
- Mantener `/login` como pantalla publica simple; modulos ERP deben ir en `features/`.

## Flujo resumido

```txt
abrir /login
-> ingresar credenciales E2E
-> crear sesion Supabase
-> entrar a rutas protegidas
-> cerrar sesion desde header
```

## Archivos relacionados

- `modulos/auth/README.md`
- `modulos/auth/contrato-general.md`
- `orquestador/estado-fases.md`

## Validacion esperada

- Tests unitarios auth.
- Build Angular.
- E2E real de nomina con login.

## Criterios de cierre

- Login funcional.
- Rutas internas protegidas.
- E2E puede autenticarse.

## Pendientes

- Roles avanzados.
- Modulo administracion usuarios.
- Permisos por empresa/rol.

## Relacion con fases siguientes

Base para `ENV-E2E-01`, `AUTH-SEED-01` y flujos reales authenticated.
