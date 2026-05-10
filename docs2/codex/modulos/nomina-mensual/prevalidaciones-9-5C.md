# Fase 9.5C - Pre-nomina funcional por periodo

## 1. Alcance cerrado

- Construye una **pre-nomina funcional por periodo** a partir de la prevalidacion 9.5A/9.5B.
- Consolida conteos operativos: trabajadores aptos, haberes recurrentes aplicables y movimientos variables validados.
- Permite generar la base de control solo cuando la prevalidacion no esta bloqueada.
- Mantiene advertencias visibles si el periodo es generable con observaciones.

## 2. Fuera de alcance

- Motor de calculo.
- Montos de remuneracion, descuentos, cotizaciones o impuesto unico.
- Liquidaciones, snapshots contables, cierre real de periodo.
- Previred, LRE, archivos bancarios.
- SQL, migraciones, Supabase remoto, Python, RLS/JWT.

## 3. Reglas implementadas

La regla pura `construirPreNominaPeriodo` recibe un `ProcesoMensualPrevalidacion` y devuelve:

| Campo | Regla |
|---|---|
| `estado` | `NO_GENERABLE` si hay bloqueos; `GENERADA_CON_ADVERTENCIAS` si hay advertencias; `GENERADA` si esta lista |
| `trabajadoresIncluidos` | `resumen.trabajadoresActivosAptos` |
| `recurrentesIncluidos` | `resumen.recurrentesAplicablesAlPeriodo` |
| `movimientosVariablesValidados` | conteo de movimientos en estado `VALIDADO` |
| `movimientosVariablesBorrador` | conteo de movimientos en estado `BORRADOR` |
| `parametrosOperativos` | bandera proveniente de la prevalidacion |
| `codigosBloqueo` / `codigosAdvertencia` | trazabilidad de codigos de prevalidacion |

## 4. UI

En `/remuneraciones/proceso-mensual`, dentro del paso **Revision previa**, se agrega el bloque **Pre-nomina del periodo**:

- boton **Generar pre-nomina**;
- badge de estado;
- conteos funcionales;
- codigos de bloqueo o advertencia cuando existan.

El boton queda deshabilitado hasta validar el periodo y cuando la prevalidacion queda bloqueada.

## 5. Archivos de codigo

- `src/app/features/nomina-mensual/models/proceso-mensual.model.ts`
- `src/app/features/nomina-mensual/rules/proceso-mensual-prenomina.rules.ts`
- `src/app/features/nomina-mensual/services/proceso-mensual.service.ts`
- `src/app/features/nomina-mensual/containers/proceso-mensual-container/`

## 6. Pruebas

- `proceso-mensual-prenomina.rules.spec.ts`
- `proceso-mensual.service.spec.ts`
- `proceso-mensual-container.spec.ts`

Comando recomendado: `npm test -- --watch=false`.
