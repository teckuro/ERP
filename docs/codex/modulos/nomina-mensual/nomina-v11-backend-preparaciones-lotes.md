# V11 — Plan técnico backend para preparaciones/lotes de nómina

Fecha: 2026-05-30  
Tipo: plan técnico V11 de implementación.  
Estado: listo para ejecutar en fase posterior; no aplica SQL ni cambia código por sí mismo.

## 1. Objetivo

Implementar preparaciones/lotes persistidos de nómina como capa explícita entre período, cálculo y liquidaciones.

El cambio debe permitir múltiples preparaciones por período:

- `mensualCompleta`
- `porCentroCosto`
- `seleccionManual`
- `complementaria`
- `reproceso`
- `retroactiva`
- `finiquito`
- `especial`

La regla técnica queda:

```txt
nomina_preparacion
-> nomina_calculo_periodo
-> nomina_liquidacion_periodo
```

No se debe generar liquidación desde datos vivos ni desde una preparación sin cálculo confirmado.

Este documento no forma parte de V10.2. V10.2 queda limitado a Alcance y Trabajadores como preparación conceptual/UI, sin SQL, RPC, IDs persistentes ni cambios productivos de motor. La persistencia real de preparaciones/lotes, múltiples preparaciones por período y asociación formal con cálculo/liquidaciones corresponde a V11/backend.

## 2. Orden de implementación

### Fase 0 — Compatibilidad y orden de migración

Antes de ejecutar SQL se debe cerrar esta fase:

- resolver las FK circulares con FK tardías;
- definir `id_empresa` como `NOT NULL` para preparaciones nuevas;
- separar lectura legacy de escritura nueva;
- validar que snapshots y liquidaciones existentes no se rompen;
- confirmar que `run_all.sql` no intenta crear FK hacia tablas inexistentes.

La regla de orden es:

```txt
30_nomina_preparacion.sql
15_nomina_calculo_snapshot.sql
20_nomina_calculo_snapshot_rpc.sql
22_liquidaciones_oficiales.sql
23_liquidaciones_oficiales_rpc.sql
33_nomina_preparacion_fks.sql
31_nomina_preparacion_rls.sql
32_nomina_preparacion_rpc.sql
```

`30_nomina_preparacion.sql` crea preparación y sus tablas hijas, pero no agrega FK hacia cálculo ni liquidación. Las referencias circulares se agregan al final en `33_nomina_preparacion_fks.sql`, cuando `nomina_calculo_periodo` y `nomina_liquidacion_periodo` ya existen.

### Fase 1 — Schema base

Agregar un nuevo bloque V11:

```txt
bd/base/v11/partes/30_nomina_preparacion.sql
bd/base/v11/partes/33_nomina_preparacion_fks.sql
bd/base/v11/partes/31_nomina_preparacion_rls.sql
bd/base/v11/partes/32_nomina_preparacion_rpc.sql
```

Actualizar `bd/base/v11/run_all.sql` en este orden:

```txt
27_nomina_periodo_diagnostico.sql
30_nomina_preparacion.sql
15_nomina_calculo_snapshot.sql
20_nomina_calculo_snapshot_rpc.sql
22_liquidaciones_oficiales.sql
23_liquidaciones_oficiales_rpc.sql
33_nomina_preparacion_fks.sql
31_nomina_preparacion_rls.sql
32_nomina_preparacion_rpc.sql
```

`30_nomina_preparacion.sql` no debe declarar `id_calculo_origen -> nomina_calculo_periodo` ni `id_liquidacion_origen -> nomina_liquidacion_periodo` como FK inicial. Esas FK se agregan en `33_nomina_preparacion_fks.sql`.

### Fase 2 — Enlace con cálculo

Extender `nomina_calculo_periodo`:

```txt
id_preparacion_nomina BIGINT NULL REFERENCES nomina_preparacion(id_preparacion_nomina)
tipo_preparacion TEXT NULL
```

Regla de compatibilidad:

- snapshots antiguos pueden tener `id_preparacion_nomina = NULL`;
- desde V11, todo nuevo cálculo generado por UI debe resolver o crear preparación y guardar `id_preparacion_nomina`;
- la preparación mensual default puede crearse automáticamente al primer cálculo si no existe.
- `id_preparacion_nomina = NULL` queda permitido solo para lectura de registros históricos.

### Fase 3 — Enlace con liquidaciones

Extender `nomina_liquidacion_periodo`:

```txt
id_preparacion_nomina BIGINT NULL REFERENCES nomina_preparacion(id_preparacion_nomina)
tipo_liquidacion TEXT NOT NULL DEFAULT 'mensual'
version INTEGER NOT NULL DEFAULT 1
id_liquidacion_origen BIGINT NULL REFERENCES nomina_liquidacion_periodo(id_liquidacion_periodo)
id_liquidacion_reemplazada BIGINT NULL REFERENCES nomina_liquidacion_periodo(id_liquidacion_periodo)
```

Regla:

- liquidaciones antiguas mantienen `id_preparacion_nomina = NULL`;
- desde V11, liquidaciones nuevas siempre copian `id_preparacion_nomina` desde el cálculo;
- si el cálculo nuevo no tiene preparación, la generación debe bloquearse;
- `complementaria`, `reproceso`, `retroactiva`, `finiquito` y `especial` deben guardar `tipo_liquidacion`.

### Fase 4 — Repositorios y servicios Angular

Crear:

```txt
src/app/features/nomina-mensual/models/nomina-preparacion.model.ts
src/app/features/nomina-mensual/data-access/nomina-preparacion.repository.ts
src/app/features/nomina-mensual/services/nomina-preparacion.service.ts
src/app/features/nomina-mensual/rules/nomina-preparacion.rules.ts
```

Integrar en `ProcesoMensualPeriodoStore` solo después de que existan RPC y tests de repositorio.

### Fase 5 — UI V2

Agregar en Nómina mensual:

- selector de preparación activa del período;
- botón `Nueva preparación`;
- pantalla/drawer para tipo, alcance y trabajadores incluidos;
- lectura compacta de preparación activa en header/workspace;
- detalle de liquidaciones por preparación.

No se debe ocultar la nómina mensual actual: la preparación `mensualCompleta / todaEmpresa` es la default.

## 3. Schema propuesto

### `nomina_preparacion`

Campos:

```txt
id_preparacion_nomina BIGSERIAL PK
periodo_pago TEXT NOT NULL
periodo_origen TEXT NULL
id_empresa INT NOT NULL REFERENCES empresa(id_empresa)
tipo_preparacion TEXT NOT NULL
metodo_alcance TEXT NOT NULL
estado TEXT NOT NULL DEFAULT 'borrador'
id_preparacion_origen BIGINT NULL REFERENCES nomina_preparacion(id_preparacion_nomina)
id_calculo_origen INT NULL
id_liquidacion_origen BIGINT NULL
modo_reproceso TEXT NULL
motivo TEXT NULL
metadata JSONB NOT NULL DEFAULT '{}'::JSONB
activo BOOLEAN NOT NULL DEFAULT TRUE
created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
created_by UUID NULL
created_by_label TEXT NULL
updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
confirmada_at TIMESTAMPTZ NULL
confirmada_by UUID NULL
cerrada_at TIMESTAMPTZ NULL
cerrada_by UUID NULL
anulada_at TIMESTAMPTZ NULL
anulada_by UUID NULL
motivo_anulacion TEXT NULL
```

Checks:

```txt
periodo_pago ~ YYYY-MM
periodo_origen IS NULL OR periodo_origen ~ YYYY-MM
tipo_preparacion IN (...)
metodo_alcance IN (...)
estado IN (...)
modo_reproceso IS NULL OR modo_reproceso IN ('corrige', 'reemplaza')
```

Índices:

```txt
idx_nomina_preparacion_periodo(periodo_pago, activo)
idx_nomina_preparacion_tipo(periodo_pago, tipo_preparacion)
idx_nomina_preparacion_origen(id_preparacion_origen)
```

Único parcial:

```txt
Una sola mensualCompleta activa por período y empresa.

CREATE UNIQUE INDEX ...
ON nomina_preparacion (periodo_pago, id_empresa)
WHERE tipo_preparacion = 'mensualCompleta'
  AND activo = true;
```

`id_empresa` debe ser `NOT NULL` porque el ERP opera por empresa. No se debe permitir una preparación nueva sin empresa: en PostgreSQL, `NULL` rompe la expectativa de unicidad parcial porque los `NULL` no se consideran iguales.

### `33_nomina_preparacion_fks.sql`

Responsabilidad única: agregar FK tardías desde `nomina_preparacion` hacia tablas que se crean después de `30_nomina_preparacion.sql`.

```txt
nomina_preparacion.id_calculo_origen
-> nomina_calculo_periodo.id_calculo_periodo

nomina_preparacion.id_liquidacion_origen
-> nomina_liquidacion_periodo.id_liquidacion_periodo
```

El archivo debe ser idempotente. En PostgreSQL no existe `ADD CONSTRAINT IF NOT EXISTS`, por lo que debe validar existencia en `pg_constraint` antes de ejecutar cada `ALTER TABLE`.

### `nomina_preparacion_trabajador`

Campos:

```txt
id_preparacion_trabajador BIGSERIAL PK
id_preparacion_nomina BIGINT NOT NULL REFERENCES nomina_preparacion ON DELETE CASCADE
id_persona INT NOT NULL REFERENCES persona(id_persona)
id_contrato INT NULL
estado TEXT NOT NULL
motivo TEXT NULL
metadata JSONB NOT NULL DEFAULT '{}'::JSONB
created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
```

Estados:

```txt
incluido
excluido
bloqueado
listo
advertencia
calculado
omitido
```

Índices:

```txt
idx_nomina_preparacion_trabajador_preparacion(id_preparacion_nomina)
idx_nomina_preparacion_trabajador_persona(id_persona)
unique(id_preparacion_nomina, id_persona)
```

### `nomina_preparacion_evento`

Campos:

```txt
id_preparacion_evento BIGSERIAL PK
id_preparacion_nomina BIGINT NOT NULL REFERENCES nomina_preparacion ON DELETE CASCADE
evento TEXT NOT NULL
estado_anterior TEXT NULL
estado_nuevo TEXT NULL
usuario_id UUID NULL
usuario_label TEXT NULL
metadata JSONB NOT NULL DEFAULT '{}'::JSONB
created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
```

Eventos:

```txt
PREPARACION_CREADA
ALCANCE_DEFINIDO
TRABAJADORES_VALIDADOS
CALCULO_EJECUTADO
CALCULO_BLOQUEADO
PREPARACION_CONFIRMADA
LIQUIDACIONES_GENERADAS
PREPARACION_CERRADA
PREPARACION_REABIERTA
PREPARACION_ANULADA
LIQUIDACION_REEMPLAZADA
```

## 4. RPC mínimos

### `crear_nomina_preparacion`

Entrada:

```txt
p_periodo_pago TEXT
p_tipo_preparacion TEXT
p_metodo_alcance TEXT
p_periodo_origen TEXT DEFAULT NULL
p_motivo TEXT DEFAULT NULL
p_metadata JSONB DEFAULT '{}'
```

Valida:

- período válido;
- tipo y método soportados;
- motivo obligatorio para `seleccionManual`, `complementaria`, `reproceso`, `retroactiva`, `finiquito`, `especial`;
- `retroactiva` requiere `periodo_origen`;
- una sola `mensualCompleta` activa por período y empresa.

Retorna:

```txt
nomina_preparacion
```

### `definir_alcance_nomina_preparacion`

Entrada:

```txt
p_id_preparacion_nomina BIGINT
p_trabajadores JSONB
```

`p_trabajadores` contiene:

```txt
id_persona
id_contrato
estado
motivo
metadata
```

Valida:

- preparación en `borrador` o `alcance_definido`;
- al menos un trabajador incluido/listo;
- trabajadores existen;
- no duplica persona dentro de la preparación.

Efecto:

- reemplaza alcance de la preparación antes de cálculo;
- registra evento `ALCANCE_DEFINIDO`;
- deja estado `alcance_definido`.

### `confirmar_nomina_preparacion`

Entrada:

```txt
p_id_preparacion_nomina BIGINT
```

Valida:

- existe cálculo asociado;
- no hay bloqueos;
- estado calculada/lista;
- no está anulada/cerrada.

Efecto:

- estado `confirmada`;
- registra evento `PREPARACION_CONFIRMADA`.

### `anular_nomina_preparacion`

Entrada:

```txt
p_id_preparacion_nomina BIGINT
p_motivo TEXT
```

Valida:

- motivo obligatorio;
- si tiene liquidaciones, solo permite anulación cuando el flujo de liquidaciones lo soporte.

Efecto:

- estado `anulada`;
- `activo = false`;
- registra evento `PREPARACION_ANULADA`.

## 5. Integración con RPC existentes

### `guardar_nomina_calculo_snapshot`

Agregar parámetro:

```txt
p_id_preparacion_nomina BIGINT DEFAULT NULL
```

Reglas:

- si la llamada viene desde UI V11 y `p_id_preparacion_nomina` es `NULL`, crear o resolver preparación default `mensualCompleta/todaEmpresa` antes de guardar;
- si no se puede resolver preparación para escritura nueva, bloquear el cálculo;
- validar que preparación no esté `cerrada` ni `anulada`;
- guardar `id_preparacion_nomina` y `tipo_preparacion` en `nomina_calculo_periodo`;
- registrar evento `CALCULO_EJECUTADO` o `CALCULO_BLOQUEADO`.
- tratar `id_preparacion_nomina = NULL` solo como compatibilidad de lectura para snapshots históricos.

### `generar_liquidaciones_oficiales`

Reglas:

- obtener preparación desde `nomina_calculo_periodo.id_preparacion_nomina`;
- copiar `id_preparacion_nomina` a `nomina_liquidacion_periodo`;
- resolver `tipo_liquidacion` según `tipo_preparacion`;
- bloquear si preparación no está confirmada;
- bloquear generación nueva si el cálculo no tiene `id_preparacion_nomina`;
- nunca generar liquidaciones nuevas desde datos vivos ni desde cálculo sin preparación;
- registrar evento `LIQUIDACIONES_GENERADAS`.

Compatibilidad:

- si cálculo antiguo no tiene preparación, tratar como `mensualCompleta` legacy solo en lectura y mantener `tipo_liquidacion = mensual`;
- el modo legacy no habilita escrituras nuevas sin preparación.

## 6. Frontend contracts

Tipos:

```ts
export type TipoPreparacionNomina =
  | 'mensualCompleta'
  | 'porCentroCosto'
  | 'seleccionManual'
  | 'complementaria'
  | 'reproceso'
  | 'retroactiva'
  | 'finiquito'
  | 'especial';

export type MetodoAlcanceNomina =
  | 'todaEmpresa'
  | 'centroCosto'
  | 'grupo'
  | 'seleccionManual'
  | 'contrato'
  | 'trabajadorUnico';

export type EstadoPreparacionNomina =
  | 'borrador'
  | 'alcance_definido'
  | 'empleados_validados'
  | 'lista_para_calculo'
  | 'calculada'
  | 'con_bloqueos'
  | 'confirmada'
  | 'liquidaciones_generadas'
  | 'cerrada'
  | 'anulada';
```

Repositorio:

```txt
listarPreparacionesPeriodo(periodo)
crearPreparacion(params)
definirAlcance(idPreparacion, trabajadores)
confirmarPreparacion(idPreparacion)
anularPreparacion(idPreparacion, motivo)
```

Store:

```txt
preparacionesPeriodo
preparacionActiva
creandoPreparacion
guardandoAlcance
errorPreparacion
```

Regla de selección:

- si hay una sola preparación activa, seleccionarla;
- si existe `mensualCompleta`, usarla como default;
- si hay varias, mostrar selector;
- si no hay ninguna y el usuario genera nómina, crear default automáticamente.

## 7. UI esperada

En `/remuneraciones/proceso-mensual`:

- selector compacto de preparación activa junto al período;
- botón `Nueva preparación`;
- drawer/modal para crear preparación;
- panel de alcance antes de grilla de trabajadores;
- badge de tipo: Mensual, Centro de costo, Manual, Complementaria, Reproceso, Retroactiva, Finiquito, Especial;
- historial por preparación.

Copy visible:

- mantener `Nómina mensual` como flujo principal;
- usar `Preparación` como selector/contexto técnico-operativo, no como reemplazo del título principal.

## 8. Tests mínimos

SQL:

- creación de preparación mensual default;
- bloqueo de segunda `mensualCompleta` activa;
- `retroactiva` sin `periodo_origen` falla;
- `reproceso` sin origen falla;
- `finiquito` sin trabajador/fecha término falla;
- `especial` sin motivo falla;
- preparación cerrada/anulada no recibe cálculo;
- liquidación copia `id_preparacion_nomina`.

Frontend:

- repositorio mapea snake_case/camelCase;
- store selecciona default;
- generar nómina crea/resuelve preparación default;
- selector aparece con múltiples preparaciones;
- liquidaciones muestran tipo correcto.

Validaciones:

- `bd/base/v11/partes/90_validaciones_v11.sql` debe sumar chequeos de preparaciones huérfanas y cálculos/liquidaciones sin preparación en registros nuevos.
- debe diferenciar registros históricos con `id_preparacion_nomina = NULL` de escrituras V11 nuevas;
- debe fallar si existe una nueva liquidación V11 cuyo `id_preparacion_nomina` no coincida con el cálculo origen;
- `npx tsc -p tsconfig.app.json --noEmit`.
- specs focalizados de repositorio/rules/store.

## 9. Riesgos y límites

- Finiquito requiere adaptador de cálculo propio; si no existe, debe quedar bloqueado antes del cálculo.
- Complementaria y retroactiva requieren reglas de conceptos/diferencias; no deben usar cálculo mensual completo sin marcarlo como adaptador.
- Reproceso debe decidir `corrige` vs `reemplaza`; no puede sobrescribir liquidaciones anteriores sin vínculo.
- La migración debe ser compatible con snapshots y liquidaciones ya existentes.
- El flujo legacy solo es lectura/compatibilidad; no debe usarse como camino de escritura nuevo.
- RLS debe revisarse antes de Supabase remoto.

## 10. Criterio de listo

La fase técnica está lista para implementación cuando:

- schema y RPC quedan idempotentes;
- cálculo y liquidación guardan `id_preparacion_nomina`;
- UI puede crear, seleccionar y consultar preparaciones;
- mensual completa legacy sigue funcionando solo como lectura/compatibilidad;
- todo nuevo cálculo generado por UI tiene `id_preparacion_nomina`;
- toda nueva liquidación copia `id_preparacion_nomina` desde cálculo;
- todos los tipos tienen bloqueo claro si no existe adaptador de cálculo;
- liquidaciones nunca se generan desde datos vivos.
