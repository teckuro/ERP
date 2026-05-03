# Conceptos de remuneración — contrato general (índice)

## Rol del módulo

Catálogo maestro **`concepto`** enlazado opcionalmente a **`catalogo_lre`**, fuente para **asignaciones** (`haberdescuento_persona`), **liquidación** (`liquidacion_detalle`) y, en evolución, **motor** (`regla_concepto_calculo`, `formula_json`). **No** es la ficha del empleado ni el monto recurrente por sí solo.

## Documentos del módulo (Fase 9)

| Documento | Contenido |
|-----------|------------|
| [`diagnostico-fase-9.md`](./diagnostico-fase-9.md) | Inventario rutas, UI, servicios, BD v11, RLS, Python, brechas |
| [`contrato-funcional.md`](./contrato-funcional.md) | Reglas de negocio, permisos, UI, pruebas y dependencias |
| [`decisiones-operativas.md`](./decisiones-operativas.md) | Permisos, sistema/usuario, asignables, vigencias, LRE, baja; base Fase 9.2 |
| Código `esConceptoAsignable` | `concepto-asignabilidad.rules.ts`; uso en Haberes: `HaberesDescuentosService` (Fase 9.2C, [`contrato-funcional.md`](./contrato-funcional.md) §11) |
| [`README.md`](./README.md) | Punto de entrada y orden de lectura |

## Orden de lectura

1. [`diagnostico-fase-9.md`](./diagnostico-fase-9.md) — qué hay implementado hoy.  
2. [`decisiones-operativas.md`](./decisiones-operativas.md) — quién puede qué, asignables, LRE, vigencias y baja (prevalece en ambigüedad con el funcional hasta alinear).  
3. [`contrato-funcional.md`](./contrato-funcional.md) — cómo debe comportarse el producto y qué queda explícitamente fuera de alcance.  
4. Orquestador: [`../../orquestador/contexto-proyecto.md`](../../orquestador/contexto-proyecto.md) §10 y §12, [`../../orquestador/diseno-operativo-erp.md`](../../orquestador/diseno-operativo-erp.md) §6.

## Principios que no se renegocian aquí

- **No** mezclar concepto maestro con asignación por trabajador.
- **No** tratar conceptos **sistema** o **cálculo automático** como editables por el mismo perfil que edita conceptos manuales, salvo **política admin** explícita (ver [`decisiones-operativas.md`](./decisiones-operativas.md) §2–§3 y contrato funcional §4).
- Respetar el **camino oficial** hacia remuneraciones completas en `contexto-proyecto` (conceptos antes de motor productivo fuerte).
