# Fase 9.5B - Proceso mensual: recurrentes por mes y grupos mínimos de parámetros

## 1. Alcance (cerrado)

- **Haberes recurrentes** leídos por `YYYY-MM` con la misma semántica de vigencia que Haberes (intersección con el mes, clasificación `ACTIVA` / `FUTURA` / `VENCIDA` / `CERRADA` / `INVALIDA`).
- **Parámetros** además de la fila mensual y el estado de calendario (9.5A): clasificación por **grupos mínimos** usando `ParametrosGeneralesService.listarCatalogos(periodo)` + `revisarGruposParametrosMinimos` (sin mostrar valores normativos en UI).
- Sin **motor**, sin **liquidaciones**, sin Previred/LRE.

## 2. Haberes recurrentes

### 2.1 Orquestación

`ProcesoMensualService` llama `HaberesDescuentosService.listarAsignacionesParaPrevalidacionMensual(periodo)`, que parte de `listarTodasAsignacionesConConcepto()` y filtra por intersección del mes (`vigenciaIntersecaMes` + inicio de mes local).

### 2.2 Conteos en resumen

| Campo resumen | Significado |
|---------------|-------------|
| `recurrentesAplicablesAlPeriodo` | Asignaciones cuya vigencia **cruza** el mes seleccionado y no están cerradas ni fuera de operación para ese corte. |
| `recurrentesInvalidas` | Vigencia incoherente (`INVALIDA`). |
| `recurrentesCerradas` | Estado cerrado / no operativa para el corte. |
| `recurrentesFueraDelMes` | Vigencia válida pero **sin** intersección con el `YYYY-MM` (histórico / futuro respecto del mes). |

### 2.3 Severidad

- Error de lectura → **BLOQUEO** (`RECURRENTES_LECTURA_ERROR`).
- `recurrentesInvalidas > 0` → **BLOQUEO** (`RECURRENTES_INVALIDAS`).
- El área **Haberes recurrentes** en la tabla de ítems refleja LISTO / CON_PROBLEMAS según bloqueos; no se usa `PENDIENTE_INTEGRACION` para este bloque.

### 2.4 Diagrama (flujo de datos)

```txt
  listarTodasAsignacionesConConcepto()
              |
              v
  filtrar por periodo YYYY-MM (interseccion mes)
              |
              +---> contar por bucket (aplicables / invalidas / cerradas / fueraDelMes)
              |
              v
  proceso-mensual-prevalidacion.rules (bloqueos si invalidas o error lectura)
```

## 3. Parámetros por grupos mínimos

### 3.1 Entrada de la regla pura

`revisarGruposParametrosMinimos({ periodo, fila, lecturaFila, catalogos, lecturaCatalogos })`.

- Si el periodo es inválido, el servicio **no** llama catálogos ni recurrentes (9.5A se mantiene).
- Si la lectura de catálogos falla, los grupos que dependen de catálogo pueden quedar `PENDIENTE_INTEGRACION` o reflejar error según implementación; **no** se fuerza `OK` sin datos.

### 3.2 Identificadores de grupo (`id`)

```txt
parametros_generales_lectura   (solo si error al leer fila)
mensuales_uf_utm_sueldo
topes_base
catalogos_afp_impuesto
afc_catalogo
sis_fila_mensual
salud_catalogo
mutualidad_ley16744_ccaf
reforma_previsional
```

### 3.3 Clasificación (`clasificacion`)

Valores: `OK` | `FALTANTE` | `PARCIAL` | `PENDIENTE_INTEGRACION` | `NO_APLICA_AUN`.

### 3.4 Efecto en mensajes de prevalidación

```txt
  revisarGruposParametrosMinimos
              |
              +-- FALTANTE o PARCIAL --> ADVERTENCIA (codigo PARAM_MIN_<id>)
              +-- PENDIENTE_INTEGRACION --> INFO (no sube a CON_ADVERTENCIAS por severidad INFO)
              +-- OK / NO_APLICA_AUN --> sin mensaje extra por ese grupo
```

### 3.5 Resumen UI

`ProcesoMensualResumen.parametrosGrupos` lista pares `id=clasificacion` en copy compacto tras validar (sin valores UF/UTM/sueldo).

## 4. Archivos de código

- `src/app/features/haberes-descuentos/data-access/haberes-descuentos.repository.ts` - `listarTodasAsignacionesConConcepto`.
- `src/app/features/haberes-descuentos/services/haberes-descuentos.service.ts` - `listarAsignacionesParaPrevalidacionMensual`.
- `src/app/features/nomina-mensual/rules/proceso-mensual-parametros-minimos.rules.ts` + spec.
- `src/app/features/nomina-mensual/rules/proceso-mensual-recurrentes.rules.ts` + spec.
- `src/app/features/nomina-mensual/rules/proceso-mensual-prevalidacion.rules.ts` + spec.
- `src/app/features/nomina-mensual/services/proceso-mensual.service.ts` + spec.
- Contenedor: resumen de recurrentes y línea de grupos de parámetros.

## 5. Pruebas

- `proceso-mensual-parametros-minimos.rules.spec.ts`
- `proceso-mensual-recurrentes.rules.spec.ts`
- `proceso-mensual-prevalidacion.rules.spec.ts`
- `proceso-mensual.service.spec.ts`
- `haberes-descuentos.service.spec.ts` (bloque `listarAsignacionesParaPrevalidacionMensual`)
- `proceso-mensual-container.spec.ts`

Comando: `npx ng test --watch=false`

## 6. Relación con 9.5A

9.5A define periodo, fila PG, calendario, empleados, conceptos y movimientos variables. **9.5B** sustituye el INFO de “haberes recurrentes pendientes” por lectura real y añade la capa de **grupos** de parámetros. Contrato base sigue en [`prevalidaciones-9-5A.md`](./prevalidaciones-9-5A.md) y [`contrato-general.md`](./contrato-general.md).
