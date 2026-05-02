# Pruebas — Guardar borrador / Continuar alta (creación avanzada)

Documenta la **fase 1** (UI y unitarios) y la **fase 2** (E2E con persistencia Supabase). Complementa [`creacion-avanzada-formulario-campos.md`](./creacion-avanzada-formulario-campos.md).

---

## 1. Estado de cobertura

### Fase 1 — sin Supabase obligatorio

| Capa | Qué cubre | Dónde |
|------|-----------|--------|
| Unitarios | Payload borrador, validación mínima, reglas previsión borrador, meta BORRADOR | `src/app/features/empleados/mappers/empleado-form.mapper.borrador.spec.ts`, `empleado-borrador-form.validation.spec.ts`, `empleado-borrador.rules.spec.ts` |
| Componente | CTA «Continuar alta» + `idPersona` | `tabla-empleados.spec.ts` |
| E2E UI | Botón borrador solo avanzado, básico sin borrador, error `idPersona`, validación RUT, layout ~900px | `tests/empleados-borrador.spec.ts` |

### Fase 2 — persistencia (Supabase local / dev)

**Archivo:** `tests/empleados-borrador-persistencia.spec.ts`  
**Activación:** variable de entorno `E2E_EMPLEADOS_BORRADOR` con valor truthy: `1`, `true`, `yes` u `on` (sin distinguir mayúsculas). Puede definirse en el archivo **`.env`** en la raíz del proyecto (se carga al arrancar Playwright y al importar el spec). Si no está activa, la suite usa `test.describe.skip` (no se ejecutan casos; no son tests verdes falsos).

| Caso | Descripción |
|------|-------------|
| Serial | Guardar borrador mínimo → listado (filtro estado Borrador + RUT) → «Continuar alta» desde grilla → segundo guardado → una fila con nombre actualizado |
| APVI | AFP sin APVI: desde paso previsión, «Siguiente» llega a «Cuenta de abono» |
| APVI | AFP con APVI: «Siguiente» muestra bloque APVI |
| IPS | «Siguiente» desde previsión llega a banco (sin paso APVI) |
| RUT duplicado | Segundo alta nuevo con mismo RUT que borrador ya guardado → modal «Ficha ya registrada» |
| Finalizar | Borrador mínimo → completar pasos 1–5 y 7 con previsión «Sin prevision» → paso 9 «Finalizar alta» → mensaje de éxito |

**Helpers:** `tests/helpers/empleados-borrador-e2e.ts` (RUT único ficticio, `app-search-select`, filtros grilla, pasos wizard). Las fechas usan `fillCalendarInputByHostId` (`app-calendar-input` duplica `id` en host e input). Los combos usan `button.select-field#…` como trigger (`app-search-select` + botón comparten `id`). Tras guardar borrador, `waitGuardarBorradorTerminado` espera el fin del request (texto del botón); el aviso verde dura ~4,5 s y no debe ser la única aserción si Supabase es lento.

**SQL manual:** `tests/empleados-borrador-verificacion-sql.md`.

---

## 2. Por qué la fase 2 es opt‑in

| Motivo | Detalle |
|--------|---------|
| Supabase | Sin instancia alineada al esquema (p. ej. `paso_alta_avanzada`) los fallos son de infraestructura. |
| Catálogos | AFP/IPS/banco/comuna dependen de datos reales en BD; los tests usan «primera opción» o etiquetas conocidas (`AFP`, `Sin prevision`, etc.) — un seed distinto puede exigir ajustar selectores. |
| Datos | Solo RUTs y nombres generados en test (ficticios). |
| Calidad | Sin mocks que simulen persistencia; sin relajar validaciones finales. |

---

## 3. Cómo ejecutar fase 2

**Requisitos:** Supabase local o proyecto de **desarrollo/pruebas** (nunca producción), migraciones v11, catálogos mínimos, `ng serve` en `4200` (o `reuseExistingServer` según `playwright.config.ts`).

**Recomendado (`.env` en la raíz de `angular-erp`):**

```env
E2E_EMPLEADOS_BORRADOR=1
```

Luego:

```bash
npm run test:e2e:empleados-borrador
```

Equivale a `playwright test tests/empleados-borrador-persistencia.spec.ts --workers=1` con la variable ya cargada desde `.env`.

**PowerShell (solo sesión actual, sin editar `.env`):**

```powershell
$env:E2E_EMPLEADOS_BORRADOR='1'
npm run test:visual -- tests/empleados-borrador-persistencia.spec.ts
```

**Junto con fase 1 UI:**

```powershell
$env:E2E_EMPLEADOS_BORRADOR='1'
npm run test:visual -- tests/empleados-borrador.spec.ts tests/empleados-borrador-persistencia.spec.ts
```

---

## 4. Reglas de calidad

- No relajar validaciones para que pasen tests.
- No usar datos reales de trabajadores.
- No apuntar E2E a producción.
- Si falla un paso de finalización o catálogo, corregir causa (RLS, seed, campo obligatorio) antes de debilitar aserciones.

---

## 5. Enlaces

- [`../../SUPABASE_SETUP.md`](../../SUPABASE_SETUP.md)
- [`../../bd/base/v11/README.md`](../../bd/base/v11/README.md)
