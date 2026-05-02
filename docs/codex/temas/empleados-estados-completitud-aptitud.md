# Empleados - estados, completitud y aptitud para remuneraciones

## 1. Objetivo

Este documento define el contrato oficial de negocio para los estados del modulo
Empleados, la completitud de la ficha y la aptitud para remuneraciones.

El objetivo es separar con claridad tres flujos que no deben mezclarse:

- alta avanzada en borrador;
- ficha creada en modo basico o incompleta;
- ficha validada y apta para procesos de remuneraciones.

Este contrato complementa:

- [`modo-basico-empleado.md`](./modo-basico-empleado.md)
- [`flujo-edicion-ficha-empleado.md`](./flujo-edicion-ficha-empleado.md)
- [`creacion-avanzada-borrador-tests.md`](./creacion-avanzada-borrador-tests.md)
- [`../ui-form-guidelines.md`](../ui-form-guidelines.md)

No habilita calculo de liquidaciones ni nomina mensual.

## 2. Estados visuales

Los estados visuales deben derivarse de los campos de negocio, no de textos libres
ni de inferencias por datos parciales.

| Condicion principal | Estado visual | Accion principal | Flujo |
|---------------------|---------------|------------------|-------|
| `paso_alta_avanzada !== null` | Borrador | Continuar alta | Wizard avanzado |
| `paso_alta_avanzada === null` y `estado_ficha === 'INCOMPLETO'` | En proceso | Completar ficha | Ficha empleado |
| `estado_ficha === 'VALIDO'` y `apto_para_remuneraciones === true` | Activo / Apto | Ver ficha | Ficha empleado |
| `estado` suspendido, inactivo, desvinculado o bloqueado | Estado operativo correspondiente | Ver ficha | Ficha empleado |

Regla principal:

- si existe `paso_alta_avanzada`, manda el flujo de alta avanzada;
- si no existe `paso_alta_avanzada` y la ficha esta incompleta, manda la ficha por secciones;
- si la ficha esta valida y apta, puede participar en procesos de remuneraciones.

## 3. Campos BD relacionados

| Campo | Origen | Rol oficial |
|-------|--------|-------------|
| `persona.estado` | BD | Estado operativo de la persona: `BORRADOR`, `EN_PROCESO`, `ACTIVO`, `SUSPENDIDO`, `INACTIVO`, `DESVINCULADO`, `BLOQUEADO`. |
| `persona.estado_ficha` | BD | Estado de completitud de la ficha: `BORRADOR`, `INCOMPLETO`, `VALIDO`. |
| `persona.apto_para_remuneraciones` | BD | Indicador final para habilitar procesos de remuneraciones. |
| `persona.paso_alta_avanzada` | BD | Paso guardado del wizard avanzado. Si no es null, la accion principal es continuar alta. |
| `persona.fecha_activacion` | BD | Respaldo de activacion cuando la ficha queda valida. |
| `contrato.estado` | BD | Estado contractual: debe ser compatible con aptitud. |

Los estados visuales de tabs, bloques, badges o porcentajes son derivados de UI.
No reemplazan estos campos.

## 4. Flujo creacion basica

Entrada:

```text
Listado -> Crear empleado -> Creacion basica
```

Resultado obligatorio:

```text
persona.estado = EN_PROCESO
persona.estado_ficha = INCOMPLETO
persona.apto_para_remuneraciones = false
persona.paso_alta_avanzada = null
```

Contrato:

- crea solo la persona;
- no crea el alta laboral completa;
- no debe crear contrato, remuneracion, prevision, salud, banco o APVI como datos definitivos;
- no deja la ficha apta para liquidar;
- la accion posterior es `Completar ficha`;
- la ruta posterior de completitud es `/empleados/:id`.

## 5. Flujo creacion avanzada

Entrada:

```text
Listado -> Crear empleado -> Creacion avanzada
```

Si el usuario finaliza en el paso final del wizard:

```text
persona.estado = ACTIVO
persona.estado_ficha = VALIDO
persona.apto_para_remuneraciones = true
persona.paso_alta_avanzada = null
```

Contrato:

- finalizar alta solo ocurre en el ultimo paso del wizard;
- la persona queda activada solo si cumple la matriz minima de aptitud;
- APVI se exige solo cuando corresponde;
- no debe quedar ningun default tecnico bloqueante;
- la accion posterior es `Ver ficha`.

## 6. Flujo guardar borrador

Entrada:

```text
Wizard avanzado -> Guardar borrador
```

Resultado obligatorio:

```text
persona.estado = BORRADOR
persona.estado_ficha = INCOMPLETO
persona.apto_para_remuneraciones = false
persona.paso_alta_avanzada = paso actual
```

Contrato:

- `BORRADOR` es exclusivo del flujo de creacion avanzada;
- representa avance parcial del wizard;
- no debe entrar a nomina ni liquidaciones;
- no debe usar Ficha empleado como flujo principal de continuacion;
- se completa con `Continuar alta`;
- la ruta oficial de continuacion es `/empleados/nuevo?idPersona=<id_persona>`.

## 7. Flujo continuar alta

Entrada:

```text
Listado -> Continuar alta
```

Condicion:

```text
persona.paso_alta_avanzada !== null
```

Ruta:

```text
/empleados/nuevo?idPersona=<id_persona>
```

Contrato:

- carga la persona existente;
- hidrata el wizard avanzado;
- vuelve al paso guardado;
- no crea una persona nueva;
- no abre Ficha empleado como flujo principal;
- al finalizar debe limpiar `paso_alta_avanzada`.

## 8. Flujo completar ficha

Entrada:

```text
Listado -> Completar ficha
```

Condicion:

```text
persona.paso_alta_avanzada === null
persona.estado_ficha === INCOMPLETO
```

Ruta:

```text
/empleados/:id
```

Contrato:

- aplica a fichas creadas en modo basico o incompletas;
- se completa por secciones dentro de Ficha empleado;
- no usa el wizard avanzado;
- debe mostrar faltantes y bloqueos;
- cuando cumple requisitos reales, puede validarse para remuneraciones;
- activar o dejar apta la ficha debe ser resultado de validacion de negocio, no de un guardado parcial accidental.

## 9. Matriz de acciones por estado

| `estado` | `estado_ficha` | `apto_para_remuneraciones` | `paso_alta_avanzada` | Accion principal | Ruta |
|----------|----------------|----------------------------|----------------------|------------------|------|
| `BORRADOR` | `INCOMPLETO` | `false` | numero | Continuar alta | `/empleados/nuevo?idPersona=<id>` |
| `EN_PROCESO` | `INCOMPLETO` | `false` | `null` | Completar ficha | `/empleados/:id` |
| `ACTIVO` | `VALIDO` | `true` | `null` | Ver ficha | `/empleados/:id` |
| `ACTIVO` | `INCOMPLETO` | `false` | `null` | Completar ficha | `/empleados/:id` |
| `SUSPENDIDO` | cualquiera | cualquiera | `null` | Ver ficha | `/empleados/:id` |
| `INACTIVO` | cualquiera | cualquiera | `null` | Ver ficha | `/empleados/:id` |
| `DESVINCULADO` | cualquiera | cualquiera | `null` | Ver ficha | `/empleados/:id` |
| `BLOQUEADO` | cualquiera | cualquiera | `null` | Ver ficha | `/empleados/:id` |

Prioridad:

1. `paso_alta_avanzada !== null` tiene prioridad sobre el resto para accion principal.
2. `estado_ficha === 'INCOMPLETO'` y sin paso avanzado implica completar ficha.
3. `estado_ficha === 'VALIDO'` y `apto_para_remuneraciones === true` implica ficha apta.

## 10. Matriz de aptitud minima

Una persona solo puede entrar a procesos de remuneraciones si cumple todo lo
siguiente:

| Bloque | Requisito minimo |
|--------|------------------|
| Estado de ficha | `estado_ficha = 'VALIDO'`. |
| Aptitud | `apto_para_remuneraciones = true`. |
| Alta avanzada | `paso_alta_avanzada = null`. |
| Persona | RUT valido, nombres y apellido principal reales. |
| Contrato | Contrato vigente o activo, fecha de inicio real, tipo de contrato y cargo real. |
| Jornada | Tipo de trabajador y jornada reales, no implicitos. |
| Remuneracion | Sueldo base valido y mayor que cero, moneda y configuracion minima de liquidacion. |
| Prevision | Regimen previsional valido o regla explicita para no cotizar. |
| Salud | Institucion/regla de salud valida cuando corresponda. |
| APVI | Si `tieneApv = true`, institucion, moneda, monto y forma de pago completos. |
| Pago | Banco, tipo de cuenta y numero real si el pago requiere transferencia. |
| Defaults tecnicos | Ningun valor tecnico bloqueante pendiente. |

`apto_para_remuneraciones = true` no debe derivarse solo de que existan filas en
tablas relacionadas. Debe representar datos reales, coherentes y suficientes.

## 11. Defaults tecnicos bloqueantes

Estos valores pueden existir para persistir avances parciales, pero no pueden
habilitar aptitud:

| Default tecnico | Bloquea aptitud porque |
|-----------------|------------------------|
| `DRAFT-*` en cuenta bancaria | No es una cuenta real. |
| `Sin cargo` | No acredita cargo laboral real. |
| Fecha de ingreso tecnica no confirmada | Puede falsear vigencia laboral. |
| Banco default | Puede asignar institucion incorrecta. |
| Tipo de cuenta default | Puede asignar forma de pago incorrecta. |
| Tipo trabajador default implicito | Puede alterar reglas de jornada/cotizacion. |
| Jornada default implicita | Puede alterar calculo y cumplimiento laboral. |
| Sueldo base `0`, vacio o no confirmado | Impide calcular remuneracion base confiable. |
| `tipoPrevision = NINGUNA` usado como default | No es eleccion previsional explicita. |
| APVI incompleto con `tieneApv = true` | Falta dato necesario para descuento/aporte. |

Mientras exista cualquiera de estos bloqueos:

```text
persona.estado_ficha = INCOMPLETO
persona.apto_para_remuneraciones = false
```

## 12. Que no debe pasar

- No mostrar `Completar ficha` como accion principal si `paso_alta_avanzada !== null`.
- No enviar un borrador avanzado a Ficha empleado como flujo principal.
- No marcar `apto_para_remuneraciones = true` con defaults tecnicos.
- No marcar `estado_ficha = VALIDO` si falta un bloque minimo.
- No crear una nueva persona al finalizar alta desde borrador.
- No tratar una ficha basica como borrador avanzado.
- No activar una persona como efecto lateral de guardar una seccion incompleta.
- No habilitar nomina mensual con personas en `BORRADOR`, `EN_PROCESO` o `INCOMPLETO`.

## 13. Checklist antes de implementar

Antes de tocar codigo para aplicar este contrato:

- [ ] Confirmar que el listado prioriza `paso_alta_avanzada !== null` para `Continuar alta`.
- [ ] Confirmar que creacion basica deja `EN_PROCESO`, `INCOMPLETO`, no apta y sin paso avanzado.
- [ ] Confirmar que guardar borrador deja `BORRADOR`, `INCOMPLETO`, no apta y con paso avanzado.
- [ ] Confirmar que finalizar alta avanzada limpia `paso_alta_avanzada`.
- [ ] Definir una funcion central para evaluar bloqueos de aptitud.
- [ ] Detectar defaults tecnicos y bloquear aptitud mientras existan.
- [ ] Separar estados visuales de tabs/bloques de estados persistidos.
- [ ] Agregar pruebas para basico, borrador, continuar alta, finalizar desde borrador y completar ficha.
- [ ] No tocar liquidaciones ni nomina mensual hasta cerrar este contrato.

## 14. Helper central implementado

La regla central vive en:

```text
src/app/features/empleados/utils/empleado-completitud.rules.ts
```

Funcion principal:

```ts
evaluarCompletitudYAptitudEmpleado({
  payload,
  pasoAltaAvanzada,
})
```

Salida:

```ts
{
  estadoFicha: 'BORRADOR' | 'INCOMPLETO' | 'VALIDO',
  aptoParaRemuneraciones: boolean,
  bloqueos: string[],
  advertencias: string[],
  defaultsTecnicosDetectados: string[],
  seccionesPendientes: string[],
}
```

Uso obligatorio:

- antes de finalizar alta avanzada nueva;
- antes de finalizar alta avanzada desde borrador;
- como base reutilizable para Ficha empleado en fases posteriores.

No se usa para endurecer:

- creacion basica;
- guardar borrador avanzado;
- persistencia parcial del wizard.

## 15. Bloqueos implementados

La regla bloquea aptitud cuando detecta:

- RUT invalido;
- nombres, apellido paterno, fecha de nacimiento o pais faltantes;
- fecha de ingreso o contrato faltante;
- tipo de contrato faltante;
- cargo vacio o `Sin cargo`;
- tipo trabajador o jornada no reales (`0`, null o valores no positivos);
- horas o dias semanales invalidos;
- sueldo base `0`, vacio o invalido;
- moneda de remuneracion faltante;
- regimen previsional faltante;
- AFP sin AFP seleccionada;
- AFP/IPS sin salud valida cuando corresponde;
- IPS sin entidad/ex-caja de catalogo ni datos manuales completos;
- APVI incompleto cuando `tieneApv = true`;
- banco o tipo cuenta no reales;
- cuenta bancaria vacia o `DRAFT-*`;
- `paso_alta_avanzada !== null`.

## 16. Defaults tecnicos detectados

La salida `defaultsTecnicosDetectados` usa codigos internos estables para tests y
diagnostico:

| Codigo | Significado |
|--------|-------------|
| `cargo:sin-cargo` | El cargo sigue siendo placeholder tecnico. |
| `tipo-trabajador:default` | Tipo trabajador no real. |
| `tipo-jornada:default` | Tipo jornada no real. |
| `sueldo-base:invalido` | Remuneracion base no valida. |
| `apvi:incompleto` | APVI incompleto con `tieneApv = true`. |
| `banco:default` | Banco no real. |
| `tipo-cuenta:default` | Tipo de cuenta no real. |
| `cuenta-bancaria:draft` | Cuenta bancaria temporal `DRAFT-*`. |

## 17. Brechas conocidas

El modelo actual no permite distinguir todos los defaults tecnicos de una
seleccion real del usuario. Por eso:

- `tipoPrevision = NINGUNA` genera advertencia si la ficha queda completa, porque no existe una marca que diga si fue decision explicita o default;
- fecha de ingreso igual al dia actual no se bloquea automaticamente, porque no existe una marca de "fecha tecnica no confirmada";
- banco, tipo cuenta, tipo trabajador y jornada se bloquean cuando son `0`, null o invalidos, pero no se puede saber si un valor positivo vino de "primer catalogo" o de una eleccion real.

Estas brechas deben cerrarse con metadata explicita si el negocio necesita
auditoria estricta de defaults.

## 18. Uso en Listado empleados

El listado debe leer la accion principal desde los campos persistidos de negocio
ya disponibles en la fila:

- `pasoAltaAvanzada !== null` muestra `Borrador` y accion `Continuar alta`;
- sin paso avanzado y `estadoFicha = INCOMPLETO` muestra `En proceso` y accion
  `Completar ficha`;
- `estadoFicha = VALIDO` y `aptoParaRemuneraciones = true` muestra
  `Activo / Apto` y accion `Ver ficha`;
- `estado = activo` con `aptoParaRemuneraciones = false` muestra
  `Activo / No apto` y accion `Revisar pendientes`;
- estados operativos `SUSPENDIDO`, `INACTIVO`, `DESVINCULADO` y `BLOQUEADO`
  mantienen accion `Ver ficha`.

El listado no recalcula aptitud completa porque no transporta todos los bloques
de la ficha. Usa el resultado persistido y la prioridad oficial de
`pasoAltaAvanzada`.

## 19. Uso en Ficha empleado

La ficha usa el helper central:

```ts
evaluarCompletitudYAptitudEmpleado({
  payload: mapFichaEmpleadoToEvaluacionInput(empleado),
  pasoAltaAvanzada: empleado.pasoAltaAvanzada,
})
```

La funcion `mapFichaEmpleadoToEvaluacionInput` adapta el formulario cargado en la
ficha al shape `CrearEmpleadoPayload` que espera el helper. La ficha usa la
salida para:

- estado visual de ficha;
- aptitud para remuneraciones;
- bloqueos principales;
- defaults tecnicos detectados como pendientes;
- secciones pendientes y estado de tabs.

No se crea un helper paralelo de aptitud.

## 20. Panel de estado en Ficha

La Ficha empleado muestra un panel superior compacto con:

- estado de ficha (`Borrador`, `En proceso`, `Con pendientes`,
  `Ficha completa`);
- aptitud (`Apta para remuneraciones` / `No apta para remuneraciones`);
- maximo tres pendientes principales en la lectura superior;
- accion siguiente (`Completar ficha`, `Revisar pendientes`,
  `Ver datos / Editar ficha`).

El panel lateral conserva el detalle, pero limita los faltantes a los principales
para evitar listas gigantes. Si existen defaults tecnicos, se traducen a textos
operativos, por ejemplo:

- `DRAFT-*` como `Cuenta bancaria pendiente`;
- `Sin cargo` como `Cargo pendiente`;
- sueldo base `0` como `Sueldo base pendiente`;
- banco o tipo de cuenta sin valor real como `Datos bancarios pendientes`.

La accion explicita `Validar para remuneraciones` desde ficha no queda
implementada en esta fase. La ficha solo muestra si ya esta lista o que falta;
no activa automaticamente ni cambia aptitud como efecto lateral de visualizar o
editar parcialmente.
