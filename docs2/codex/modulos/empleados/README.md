# Módulo Empleados - punto de entrada

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

**Transversal (sigue en `temas/`):** arquitectura por carpetas del feature - [`../../temas/base-angular-empleados.md`](../../temas/base-angular-empleados.md).  
**Rutas y recorrido unificado:** [`../../temas/flujos/empleados.md`](../../temas/flujos/empleados.md).

## Orden de lectura recomendado

1. [`contrato-general.md`](./contrato-general.md) - marco de negocio y datos.
2. Según la pantalla: `listado` → `creacion-basica` / `creacion-avanzada` / `borrador-continuar-alta` → `ficha-empleado` → `validar-remuneraciones`.
3. [`tests-empleados.md`](./tests-empleados.md) antes de tocar CI o E2E.

## Estado del módulo (resumen)

- **Fases 3-8 cerradas** (estados, helper, listado/ficha, selects, rehidratación borrador, validar remuneraciones). Detalle: [`../../orquestador/estado-fases.md`](../../orquestador/estado-fases.md).
- **Fase cerrada (documentación):** contratos vigentes bajo `modulos/empleados/`; los `.md` homónimos en `docs/codex/temas/` son **stubs** que apuntan aquí.

## Fase siguiente (producto)

**Conceptos de remuneración** (catálogo maestro); no mezclar con asignaciones por trabajador. Ver [`../../orquestador/contexto-proyecto.md`](../../orquestador/contexto-proyecto.md) §10 y §12.
