## EMP-PERFIL-LABORAL-SQL-01

Empleados incorpora base SQL para condiciones especiales del trabajador, sin cambios visuales todavia:

- `tipo_trabajador` queda como categoria base: Dependiente / Independiente.
- `tipo_condicion_trabajador` cataloga condiciones especiales persistibles.
- `persona_condicion_trabajador` relaciona condiciones con persona y opcionalmente contrato.
- Menor de 18, adulto 18 a 65 y mayor de 65 se derivan desde `persona.fecha_nacimiento` y periodo; no se guardan como condiciones manuales.
- `fn_obtener_perfil_laboral_persona` entrega el perfil laboral/previsional derivado para front y motor futuro.
- La UI/HTML inicial queda implementada en `EMP-PERFIL-LABORAL-UI-01`; ficha y consumo RPC por periodo quedan como fases posteriores.

## EMP-ADV-LAYOUT-CONSISTENCY-01

Creacion avanzada recibe pulido visual local sobre la base con Honorarios aplicado:

- Wizard con mayor ancho util para aprovechar mejor el espacio disponible.
- Mapa lateral mas compacto y secundario frente al formulario.
- Alturas minimas reducidas en pasos cortos para evitar aire artificial.
- `Guardar borrador` mantiene el mismo comportamiento y queda como accion secundaria destacada.
- Contrato y Bancario compactan grillas, gaps y padding solo en modo avanzado.
- No cambia flujo, pasos, validaciones, guardado, payloads, BD, creacion basica ni ficha empleado.

## EMP-ADV-HONORARIOS-UX-01

Creacion avanzada incorpora modo visual para `Boleta de honorarios`:

- `Datos personales` y `Domicilio` se mantienen como datos administrativos.
- `Contrato y organizacion` cambia el lenguaje a datos del servicio.
- `Jornada y remuneracion` muestra monto bruto de honorarios y oculta jornada laboral dependiente.
- `Asignaciones`, `Prevision/salud` y `APVI` quedan como no aplican.
- `Banco` queda como datos para pago recomendados.
- `Finalizar alta` se bloquea para evitar guardar honorarios como trabajador dependiente; se permite guardar borrador.

# Módulo Empleados — punto de entrada

## Qué documenta esta carpeta

Contratos y guías del ciclo de vida del trabajador en Angular: listado, altas (básica y avanzada), borrador, ficha, validación explícita para remuneraciones y pruebas.

| Documento | Contenido |
|-----------|-----------|
| [`contrato-general.md`](./contrato-general.md) | Estados BD, completitud, helper, defaults técnicos, matriz listado, regla de oro nómina futura |
| [`listado.md`](./listado.md) | Listado, estados visibles, CTAs |
| [`creacion-basica.md`](./creacion-basica.md) | Ruta modo básico, campos mínimos, `EN_PROCESO`, qué no persiste |
| [`creacion-avanzada.md`](./creacion-avanzada.md) | Wizard, pasos, tabs, APVI condicional, paso 9, finalizar |
| [`perfil-laboral-previsional.md`](./perfil-laboral-previsional.md) | Modelo SQL para categoria base, condiciones especiales persistidas y perfil laboral/previsional derivado |
| [`alta-coherencia-global-00.md`](./alta-coherencia-global-00.md) | Auditoría de aplicabilidad, validaciones asistidas, campos que aplican/no aplican y matriz para la fase global de coherencia |
| [`alta-diagnostico-contractual-ux-01.md`](./alta-diagnostico-contractual-ux-01.md) | Pulido UX del Resumen final: diagnóstico contractual visible, caso detectado y regla visual sin barras laterales fuertes |
| [`borrador-continuar-alta.md`](./borrador-continuar-alta.md) | Guardar borrador, `paso_alta_avanzada`, rehidratación, E2E opt-in |
| [`ficha-empleado.md`](./ficha-empleado.md) | Pestañas, bloques, panel superior, guardado, carga técnica, Playwright |
| [`validar-remuneraciones.md`](./validar-remuneraciones.md) | Opción B, condiciones del botón, persistencia, exclusiones |
| [`tests-empleados.md`](./tests-empleados.md) | Unitarios, Playwright, brechas |

**Transversal (sigue en `temas/`):** arquitectura por carpetas del feature — [`../../temas/base-angular-empleados.md`](../../temas/base-angular-empleados.md).  
**Rutas y recorrido unificado:** [`../../temas/flujos/empleados.md`](../../temas/flujos/empleados.md).

## Orden de lectura recomendado

1. [`contrato-general.md`](./contrato-general.md) — marco de negocio y datos.
2. Según la pantalla: `listado` → `creacion-basica` / `creacion-avanzada` / `borrador-continuar-alta` → `ficha-empleado` → `validar-remuneraciones`.
3. [`tests-empleados.md`](./tests-empleados.md) antes de tocar CI o E2E.

## Estado del módulo (resumen)

- **Fases 3–8 cerradas** (estados, helper, listado/ficha, selects, rehidratación borrador, validar remuneraciones). Detalle: [`../../orquestador/estado-fases.md`](../../orquestador/estado-fases.md).
- **Fase cerrada (documentación):** contratos vigentes bajo `modulos/empleados/`; los `.md` homónimos en `docs/codex/temas/` son **stubs** que apuntan aquí.

## Fase siguiente (producto)

**Conceptos de remuneración** (catálogo maestro); no mezclar con asignaciones por trabajador. Ver [`../../orquestador/contexto-proyecto.md`](../../orquestador/contexto-proyecto.md) §10 y §12.

## Actualizacion 2026-05-11 - Creacion avanzada: validaciones por accion

- Creacion avanzada mantiene el mapa de ficha como resumen permanente.
- Las validaciones chilenas de cada paso se muestran al actuar, no como tarjeta fija:
  - `Siguiente`: MsgBox informativo/flexible con opcion `Continuar`.
  - `Guardar borrador`: MsgBox si faltan datos minimos o confirmacion de borrador guardado.
  - `Finalizar alta`: MsgBox con datos obligatorios pendientes y advertencias. Solo desde ahi se navega al primer pendiente.
- Guardar borrador sigue flexible; finalizar alta sigue estricto.

## Actualizacion 2026-05-11 - Copy administrativo en validaciones

- Los MsgBox de creacion avanzada usan lenguaje administrativo y frases breves.
- Los listados se muestran con guion visual y punto final.
- No se usan punto y coma en textos visibles del flujo.
- `Continuar de todos modos` queda reemplazado por `Continuar`.
- `Ir al primer bloqueo` queda reemplazado por `Ir al primer pendiente`.

## EMP-PERFIL-LABORAL-UI-01

Creacion avanzada incorpora un paso propio de perfil laboral/previsional despues de Banco y antes de Resumen final. El paso detecta edad laboral por fecha, permite condiciones especiales respaldables y muestra el resultado en resumen final. Las condiciones seleccionadas se guardan en `persona_condicion_trabajador` usando el catalogo existente. No cambia Honorarios, creacion basica, motor, nomina ni estilos globales.



## EMP-PERFIL-LABORAL-UI-01-POLISH

El perfil laboral deja de estar mezclado con asignaciones laborales y queda como paso independiente antes del resumen. La UI usa el mismo patrón visual local del wizard avanzado y muestra vigencia/respaldo solo cuando hay condiciones seleccionadas.

## EMP-CONDICIONES-ESPECIALES-UX-01

Creacion avanzada ajusta el paso posterior a Banco para que el usuario lo entienda como control administrativo de RRHH y no como formulario tecnico:

- El paso visible queda como `Condiciones especiales`.
- La primera tarjeta se comunica como `Revision administrativa`, con situacion detectada por edad, tipo de relacion y fecha de referencia.
- Si no hay condiciones seleccionadas, el estado muestra `Trabajador estandar` o la revision sugerida correspondiente.
- La grilla de condiciones se presenta como `Solo si aplica`; para trabajadores normales no obliga captura adicional.
- `Vigencia y respaldo` sigue apareciendo solo cuando RRHH selecciona una condicion especial.
- El resumen final mantiene lectura compacta como revision, sin duplicar el formulario.
## EMP-ALTA-COHERENCIA-GLOBAL-00

Se documenta la matriz global de coherencia del alta avanzada para unir relación laboral, `tipo_trabajador`, contrato, jornada, Seguro de Cesantía, previsión/salud, banco, condiciones especiales y resumen final.

La fase no cambia código funcional: deja definido qué aplica, qué no aplica, qué se deriva, qué debe validar el formulario, qué debe abrir `app-message-box` y qué queda como revisión administrativa para una futura `EMP-ALTA-COHERENCIA-GLOBAL-01`.


## EMP-ALTA-COHERENCIA-GLOBAL-01

Se implementa la matriz única de aplicabilidad definida en `EMP-ALTA-COHERENCIA-GLOBAL-00`.

La regla pura `empleado-alta-aplicabilidad.rules.ts` centraliza estados de campos y pasos para Creación avanzada:

- `required`: obligatorio;
- `optional`: opcional;
- `derived`: derivado por el sistema;
- `not_applicable`: no aplica al flujo;
- `review`: requiere confirmación RRHH;
- `warning`: advertencia administrativa;
- `blocked`: bloqueado por fase.

La UI usa la matriz para el estado del wizard y agrega `Matriz de aplicabilidad` en el resumen final. La coherencia administrativa sigue separada y mantiene `app-message-box` para decisiones RRHH.

## EMP-ALTA-DIAGNOSTICO-CONTRACTUAL-UX-01

El Resumen final deja de presentar la matriz como concepto técnico visible y muestra `Diagnóstico contractual`.

La matriz de aplicabilidad sigue como fuente interna, pero RRHH ve:

- caso detectado;
- datos definidos por sistema;
- puntos necesarios;
- revisiones pendientes;
- coherencia administrativa separada.

Regla visual: no usar `border-left` decorativo fuerte en estos bloques; mantener fondos suaves de información/advertencia y bordes completos locales.


## EMP-ALTA-MSGBOX-ERROR-UX-01

El error de guardado de la ficha ya no se presenta como texto plano. Usa el mismo patrón visual del éxito:

- título claro;
- mensaje principal breve;
- panel `Qué revisar`;
- panel `Acción recomendada`;
- `Paso sugerido` cuando se pueda inferir.

Caso relevante: `Sin previsión` recomienda revisar el paso `Previsión y salud` y seleccionar AFP o IPS si el trabajador quedará habilitado para remuneraciones.

Restricciones mantenidas: sin SQL/RPC/RLS, sin motor, sin nómina, sin ficha empleado, sin creación básica funcional ni estilos globales.
