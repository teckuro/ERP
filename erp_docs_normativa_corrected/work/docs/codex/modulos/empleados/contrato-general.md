# Empleados – contrato general

## Objetivo

Definir el contrato de negocio para los estados del modulo Empleados, la completitud de la ficha y la aptitud para remuneraciones. Este documento separa claramente los flujos de alta (basica y avanzada) de la ficha y de la validacion para remuneraciones.

## Alcance

- Define los estados visuales y su derivacion a partir de campos de negocio.
- Establece reglas para creacion basica, avanzada, guardado de borrador, continuacion y completitud de la ficha.
- No incluye calculos de liquidaciones ni procesos de nomina mensual.

## Estados visuales

| Condicion principal | Estado visual | Accion principal | Flujo |
|---------------------|---------------|------------------|-------|
| `paso_alta_avanzada` **≠** `null` | **Borrador** | Continuar alta | Wizard avanzado |
| `paso_alta_avanzada = null` y `estado_ficha = INCOMPLETO` | **En proceso** | Completar ficha | Ficha empleado |
| `estado_ficha = VALIDO` y `apto_para_remuneraciones = true` | **Activo/Apto** | Ver ficha | Ficha empleado |
| Estado operativo en `persona.estado` distinto (Suspendido, Inactivo, Desvinculado, Bloqueado) | **Estado operativo** | Ver ficha | Ficha empleado |

Los estados no deben derivarse de textos libres; se basan en los campos `persona.estado`, `persona.estado_ficha`, `persona.apto_para_remuneraciones` y `persona.paso_alta_avanzada`.

## Reglas de flujos

### Creacion basica

- Acceso desde el listado.
- Crea solamente la persona y deja la ficha incompleta (`estado = EN_PROCESO`, `estado_ficha = INCOMPLETO`, `apto_para_remuneraciones = false`, `paso_alta_avanzada = null`).
- La accion posterior es **Completar ficha**.

### Creacion avanzada

- Acceso desde el listado.
- Wizard con multiples pasos (Datos personales, Contrato, Prevision y salud, Bancario, APVI, Resumen).
- En cada paso se validan los campos correspondientes y se ofrece la accion **Guardar borrador**.
- Al guardar un borrador: se crea o actualiza la persona con `estado = BORRADOR`, `estado_ficha = INCOMPLETO`, `apto_para_remuneraciones = false` y `paso_alta_avanzada` con el paso actual. La accion principal sera **Continuar alta**.
- Al completar todos los pasos y confirmar: la persona se activa (`estado = ACTIVO`) y la ficha queda valida (`estado_ficha = VALIDO`, `apto_para_remuneraciones = true`), se limpia `paso_alta_avanzada`.

### Guardar borrador y continuar alta

- **Guardar borrador** almacena el paso actual y conserva la persona en estado `BORRADOR`.
- **Continuar alta** carga el borrador existente y rehidrata el wizard avanzado para seguir desde el paso guardado.

### Completar ficha

- Aplica a fichas creadas en modo basico o incompletas (sin `paso_alta_avanzada`).
- La ficha se organiza en secciones (datos personales, contrato, prevision, salud, bancario).
- Muestra bloqueos y faltantes; no debe permitir validacion hasta que se cumpla la matriz minima de aptitud.

## Matriz de acciones por estado

| Estado | Estado ficha | Apto para remuneraciones | Paso alta avanzada | Accion | Ruta |
|--------|--------------|--------------------------|--------------------|--------|------|
| BORRADOR | INCOMPLETO | false | numero | Continuar alta | `/empleados/nuevo?idPersona=<id>` |
| EN_PROCESO | INCOMPLETO | false | null | Completar ficha | `/empleados/<id>` |
| ACTIVO | VALIDO | true | null | Ver ficha | `/empleados/<id>` |
| ACTIVO | INCOMPLETO | false | null | Completar ficha | `/empleados/<id>` |
| SUSPENDIDO/INACTIVO/DESVINCULADO/BLOQUEADO | Cualquiera | Cualquiera | null | Ver ficha | `/empleados/<id>` |

## Archivos relacionados

- `flujo-creacion-basica.md` – detalle del flujo de alta basica.
- `flujo-creacion-avanzada.md` – detalle del wizard avanzado y manejo de borradores.
- `ficha-empleado.md` – estructura de la ficha y reglas de validacion.
- `orquestador/estado-fases.md` – resumen de las fases cerradas para Empleados.
 - `../normativa-remuneraciones.md` – resumen legal que define remuneración, ingreso mínimo, jornada y gratificación; la ficha de empleado debe manejar el sueldo base de acuerdo con el IMM vigente y respetar las exclusiones señaladas.

## Pruebas/validacion

Las pruebas unitarias y E2E se describen en los archivos de tests del repositorio (`tests-empleados.md`). 
Las reglas aqui descritas deben reflejarse en las pruebas de completitud y aptitud.

## Criterios de cierre

El modulo Empleados se considera **cerrado** cuando:

- Se implementan las reglas de estados y flujos descritas.
- Se ofrecen flujos de creacion basica y avanzada con persistencia de borradores.
- La ficha de empleado se puede completar y validar para remuneraciones.
- Todas las pruebas unitarias y E2E pasan sin errores.
