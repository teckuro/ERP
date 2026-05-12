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
