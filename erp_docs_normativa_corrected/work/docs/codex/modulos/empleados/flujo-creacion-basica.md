# Empleados – flujo de creacion basica

## Objetivo

Describir el flujo de alta basica de un empleado. Este proceso crea una persona con un minimo de datos y deja la ficha en estado incompleto, permitiendo al usuario completar la informacion posteriormente.

## Alcance

- Ruta de acceso y acciones del usuario.
- Campos requeridos y reglas principales.
- Estado resultante del empleado.
- Fuera de alcance: wizard avanzado, validacion para remuneraciones y calculo de liquidaciones.

## Flujo resumido

```
Listado → Crear empleado → Creacion basica
```

1. El usuario accede al listado de empleados y selecciona **Crear empleado** en modo basico.
2. El sistema presenta un formulario con los campos minimos: identidad, contrato inicial y datos basicos de contacto.
3. Al guardar, el sistema crea la persona con los siguientes valores por defecto:

```
persona.estado = EN_PROCESO
persona.estado_ficha = INCOMPLETO
persona.apto_para_remuneraciones = false
persona.paso_alta_avanzada = null
```

4. La aplicacion muestra la accion **Completar ficha** para que el usuario continue en `/empleados/<id>` cuando desee completar la informacion.

## Campos minimos

| Campo | Descripcion | Obligatorio | Validaciones |
|------|-------------|-------------|-------------|
| RUT / Identidad | Identificacion fiscal de la persona. | Si | Formato valido, digito verificador. |
| Nombre completo | Nombre y apellidos. | Si | — |
| Tipo de contrato | Tipo de contrato laboral (Indefinido, Plazo fijo, etc.). | Si | Seleccion valida de catalogo. |
| Fecha de inicio | Fecha de inicio del contrato. | Si | No puede ser futura al periodo activo. |
| Email de contacto | Correo electronico. | Opcional | Formato valido. |

## Archivos relacionados

- `contrato-general.md` – definicion completa de estados y reglas.
- `flujo-creacion-avanzada.md` – wizard de alta avanzada.
- `ficha-empleado.md` – estructura de la ficha.

## Pruebas/validacion

- Crear empleado en modo basico deja la persona en estado `EN_PROCESO` y muestra la accion **Completar ficha**.
- No se deben crear datos de prevision, salud, banco o APVI como definitivos en este flujo.
