# Empleados – ficha de empleado

## Objetivo

Describir la estructura de la ficha del empleado y las reglas de validacion para habilitar la opcion **Validar para remuneraciones**.

## Alcance

- Organizacion en secciones y tabs.
- Campos clave y bloqueos.
- Reglas para validar la ficha y habilitar remuneraciones.
- Fuera de alcance: flujos de creacion (ver documentos de creacion).

## Estructura general

La ficha del empleado se organiza en una **card** con tabs por tematica. 
Cada tab contiene formularios compactos siguiendo las guias de UI (`AGENTS.md`, `ui-form-guidelines.md`).

### Tabs comunes

1. **Datos personales** – identidad, datos de contacto, direccion.
2. **Contrato** – tipo de contrato, jornada, fechas, centro de costo.
3. **Prevision y salud** – AFP/Isapre, plan de salud, Mutual y CCAF.
4. **Bancario** – cuenta bancaria y forma de pago.
5. **APVI y otros** – datos de ahorro voluntario y convenios.
6. **Resumen** – campos completados, bloqueos y mensajes de negocio.

Cada seccion muestra campos con sus respectivos estados (completo/incompleto) y validaciones inline.

## Validacion de la ficha

- La ficha queda **Completada** cuando todos los campos obligatorios estan llenos y coherentes.
- La accion **Validar para remuneraciones** aparece cuando:
  - `estado_ficha = INCOMPLETO` pero no existen bloqueos de datos.
  - Aun no se ha marcado `apto_para_remuneraciones`.
- Al validar:
  - La ficha se marca como valida (`estado_ficha = VALIDO`).
  - Se establece `apto_para_remuneraciones = true`.
  - Se guarda `fecha_activacion` si no existe.

## Mensajes operativos

- **Pendiente de validacion** – aparece cuando la ficha esta completa pero aun no apta.
- **Ficha completa** – se muestra cuando no faltan campos pero falta la validacion.
- **Borrador** – se indica cuando el empleado proviene de un wizard avanzado en borrador.

## Archivos relacionados

- `contrato-general.md` – estados y flujos.
- `flujo-creacion-basica.md` y `flujo-creacion-avanzada.md`.
- `ui-form-guidelines.md` – guias de diseno de formularios.

## Pruebas/validacion

- Completar todos los campos obligatorios y validar debe activar al empleado para remuneraciones.
- No debe aparecer la accion **Validar para remuneraciones** hasta que la ficha este completa y libre de bloqueos.
- La ficha no debe activarse al guardar de forma intermedia; la validacion debe ser una accion explicita.
