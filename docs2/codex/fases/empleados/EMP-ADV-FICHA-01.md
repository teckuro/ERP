# EMP-ADV-FICHA-01 - Alinear alta avanzada, ficha empleado y aptitud real para nomina

## Objetivo

Asegurar que un trabajador creado/finalizado desde Alta avanzada y Ficha tenga datos minimos para ser calculable por Nomina.

## Alcance

- Regla central de completitud/aptitud.
- `Sin prevision` bloquea aptitud para remuneraciones.
- AFP + salud apto.
- IPS + salud apto.
- Jornada sin default tecnico 45.
- E2E de alta avanzada usa 40 horas, AFP y salud.

## Fuera de alcance

- Seeds manuales para nomina.
- Parches SQL de datos.
- Cambios al motor de nomina.
- Cambios RPC/RLS.

## Estado actual

**Estado:** `implementada`  
**Tipo:** `funcional`  
**Modulo:** `Empleados`

La fase quedo implementada. El E2E de empleados pasa 8/8 y nomina ya no falla por AFP, salud ni jornada 45.

## Dependencias

- Empleados avanzado.
- Ficha empleado.
- Reglas de nomina que bloquean AFP/salud/jornada.

## Evidencia

- `npx playwright test tests/empleados-borrador-persistencia.spec.ts --workers=1`: 8/8 OK.
- `npx ng test --watch=false`: 414 tests OK en esa fase.

## Reglas funcionales

- `Sin prevision` puede existir en borrador/en proceso, pero no deja apto para remuneraciones.
- La jornada debe ingresarse conscientemente.
- APVI no bloquea si no aplica.

## Flujo resumido

```txt
alta avanzada
-> completar contrato/jornada/prevision/salud
-> finalizar
-> ficha valida para remuneraciones
-> nomina puede considerar trabajador
```

## Archivos relacionados

- `modulos/empleados/validar-remuneraciones.md`
- `modulos/empleados/ficha-empleado.md`
- `modulos/nomina-mensual/contrato-general.md`

## Validacion esperada

- Unitarios de reglas/formulario/ficha.
- E2E empleados.
- E2E nomina deja de fallar por datos del trabajador.

## Criterios de cierre

- No hay aptitud con `Sin prevision`.
- No hay jornada default 45.
- E2E empleados OK.

## Pendientes

- Revisar nuevas reglas si se integran casos especiales previsionales.

## Relacion con fases siguientes

Permite ejecutar `NOM-E2E-02` sin parches manuales de datos.
