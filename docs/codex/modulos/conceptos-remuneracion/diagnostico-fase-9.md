# Diagnóstico - Fase 9 (Conceptos de remuneración)

Fecha de referencia del inventario: alineado al código y esquema **v11** del repo. Complementa el contrato en [`contrato-funcional.md`](./contrato-funcional.md).

## 1. Rutas y capa UI

| Ruta | Componente |
|------|----------------|
| `/remuneraciones` | Redirige a `conceptos` (`src/app/app.routes.ts`). |
| `/remuneraciones/conceptos` | `ConceptosRemuneracionPage` → `ConceptosRemuneracionContainer` (`src/app/pages/conceptos-remuneracion.page.ts`, `features/haberes-descuentos/containers/conceptos-remuneracion-container/`). |

**Observación:** el mantenedor vive bajo el feature **`haberes-descuentos`** (comparten servicio y repositorio). Es coherente técnicamente, pero implica que cualquier refactor del módulo “Conceptos” debe coordinarse con asignaciones `haberdescuento_persona`.

## 2. Qué hace hoy la pantalla

- **DataGrid** de catálogo `concepto` con filtros (búsqueda, tipo, estado vigente/no vigente), acciones **Nuevo**, **Editar**, **Eliminar**, **Refrescar**.
- **Modal** de alta/edición por bloques: identificación, clasificación (tipo / naturaleza), **catálogo LRE** (`app-search-select` sobre `catalogo_lre`), vigencia y flags de imponibilidad / cotizaciones / líquido / **“Generado por liquidación”** (`calculo_automatico`).
- **Protección en UI:** `es_sistema` o `calculo_automatico` bloquean edición/eliminación salvo **`PUEDE_EDITAR_CONCEPTOS_MODO_ADMIN`** (hoy constante **`false`** en `conceptos-remuneracion-container.ts`).
- **Eliminación:** el servicio valida uso en `liquidacion_detalle` y `haberdescuento_persona` antes de borrar; conceptos de sistema no se eliminan.

## 3. Backend de aplicación (Angular → Supabase)

- **`HaberesDescuentosService` / `HaberesDescuentosRepository`:** `listarConceptosMantenimiento`, `listarCatalogoLreVigentes`, `crearConcepto`, `actualizarConcepto`, `eliminarConcepto`, `contarUsoConcepto`, `obtenerConceptoFlags`.
- **Asignaciones a persona** (`listarConceptosAsignables`): solo conceptos `tipo IN ('HABER','DESCUENTO')`, `calculo_automatico = false`, `es_sistema = false`. Los **aportes empleador** no aparecen en el selector de asignación manual (coherente con `assertConceptoPermiteAsignacionManual`).

## 4. Modelo de datos (PostgreSQL v11)

Definiciones relevantes en `bd/base/v11/partes/02_tablas.sql`:

| Objeto | Rol |
|--------|-----|
| **`catalogo_lre`** | Maestro de códigos LRE (único `codigo_lre`), con flags imponible/tributable/afecta_líquido y vigencias propias. |
| **`concepto`** | Catálogo interno: `codigo` único, `tipo` (`HABER`, `DESCUENTO`, `APORTE_EMPLEADOR`), `naturaleza`, flags de base y cotizaciones, `id_catalogo_lre` opcional, `es_sistema`, `vigente`, `vigencia_inicio`/`vigencia_fin`, `orden_impresion`, `calculo_automatico`, **`formula_json`** (no expuesto en el mantenedor actual). |
| **`regla_concepto_calculo`** | Reglas por concepto (orden, fórmula SQL, vigencias). **RLS:** solo `SELECT` para `anon`/`authenticated`; escritura vía migraciones/service_role (comentario en `08_seguridad_rls.sql`). **Sin UI** en esta fase. |
| **`haberdescuento_persona`** | Asignación trabajador + concepto; FK a `concepto`. |
| **`liquidacion_detalle`** | Líneas de liquidación con `id_concepto`. |
| **`movimiento`** | Referencia opcional a `id_concepto` (movimientos variables / futuro). |

**Propuesta histórica** (no ejecutada como migración en el fragmento leído): `bd/base/v11/partes/PROPUESTA_MIGRACION_LRE_concepto_haberdescuento.sql` documenta evolución LRE / flags automáticos - útil como contexto, no como fuente normativa de la app hasta que se adopte.

## 5. Seguridad (RLS)

En `08_seguridad_rls.sql`, tablas `concepto` y `haberdescuento_persona` tienen políticas **abiertas** (`USING (true)`) para `anon` y `authenticated`, en la misma línea que otros mantenedores hasta existan **roles JWT** dedicados.

**Riesgo:** cualquier cliente con anon key puede mutar catálogo si RLS no se endurece en despliegue real.

## 6. Python / seeds

En el workspace **Python**, `01_scrape_semillas_v611.py` incluye **`MANUAL_CONCEPTOS`** y genera `INSERT`/`UPDATE` sobre `concepto` (semilla controlada). No sustituye al mantenedor Angular, pero explica origen de datos en entornos recién sembrados.

## 7. Pruebas automatizadas

- **`tests/dashboard.spec.ts`:** el bucle de rutas con snapshot **no incluye** `/remuneraciones/conceptos` (sí hay otras rutas como `/remuneraciones/haberes-descuentos`, `/parametros`). **Brecha** documentada para una fase posterior.

## 8. Resumen de brechas (prioridad sugerida)

1. **Permisos:** RLS permisivo + flag admin en código (`PUEDE_EDITAR_CONCEPTOS_MODO_ADMIN`) sin integración a rol real.
2. **Motor / reglas:** `regla_concepto_calculo` y `formula_json` sin UI ni contrato de edición en app.
3. **Trazabilidad:** sin bitácora de cambios de concepto en BD (si el producto la exige, definir en fase siguiente).
4. **E2E / visual:** falta ruta en `dashboard.spec` (u otro spec dedicado).
5. **Separación conceptual docs:** el código comparte feature con haberes-descuentos; el contrato funcional debe dejar explícito qué toca cada módulo para evitar duplicar reglas en [`../haberes-descuentos/contrato-general.md`](../haberes-descuentos/contrato-general.md).

## 9. Referencias de código (ancla)

- Contenedor: `src/app/features/haberes-descuentos/containers/conceptos-remuneracion-container/`
- Servicio / repositorio: `src/app/features/haberes-descuentos/services/haberes-descuentos.service.ts`, `data-access/haberes-descuentos.repository.ts`
- Modelos: `src/app/features/haberes-descuentos/models/haber-descuento-asignacion.model.ts`
