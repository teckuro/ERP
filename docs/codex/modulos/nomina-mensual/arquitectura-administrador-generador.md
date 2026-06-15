# Arquitectura Administrador + Generador — Nómina mensual

> **Documento rector** creado en `NOM-REBUILD-NOMINA-MENSUAL-01` (2026-06-03).

> **Actualización rectora 2026-06-11:** este documento conserva la arquitectura
> de origen y el historial F0-F7. La planificación vigente para completar el
> flujo productivo está dividida en 25 fases ejecutables (F01–F21 más F15b y
> F18a/b/c/d) en
> [`roadmap-admin-generador-operativo-100.md`](./roadmap-admin-generador-operativo-100.md).
> La UI histórica de `/remuneraciones/proceso-mensual` ya fue retirada; el motor
> y contratos internos compartidos que aún dependen de `periodo` se consideran
> compatibilidad técnica pendiente, no un segundo flujo visible.
>
> **F01 cerrada (2026-06-11):** los cimientos canónicos del contrato y la
> persistencia se aplicaron a Supabase PROD (`mjrckxodzrfkyqjkyjkn`) en commits
> `a77a572` (BD) y `2cc42be` (Angular), con 1027/1027 tests verdes. Detalle del
> modelo extendido en la sección "Modelo de datos extendido (NOM-ADMIN-OPS-F01)"
> más abajo.
>
> **F02 cerrada (2026-06-11):** los cimientos de auditoría base y el aislamiento
> multi-tenant se aplicaron a Supabase PROD vía
> `supabase/migrations/20260611220000_nomina_f02_auditoria_y_rls_cimientos.sql`,
> con regresión 1027/1027 tests verdes y smoke postflight OK
> (`bd/scripts/validar-nomina-f02-cimientos.sql`). Detalle en la sección
> "Cimientos de auditoría y RLS (NOM-ADMIN-OPS-F02)" más abajo.

## Modelo de datos extendido (NOM-ADMIN-OPS-F01)

> Aplicado en commit `a77a572` el 2026-06-11. Sustenta la fase F01 del
> [roadmap operativo](./roadmap-admin-generador-operativo-100.md). Migraciones:
> `supabase/migrations/20260611210000_nomina_f01_cimientos_canonicos.sql`,
> `20260611211500_nomina_f01_lint_snapshot_temporal.sql`,
> `20260611212500_nomina_f01_lint_snapshot_nombre_runtime.sql`.

### Cambios en `nomina_periodo`

| Campo | Tipo | Propósito |
|---|---|---|
| `fecha_inicio`, `fecha_fin`, `fecha_pago` | `date` | Rango inclusivo y fecha de pago canónica. La mensual cubre el período legal completo; anticipos y extraordinarias pueden cubrir subrangos. |
| `naturaleza` | `text` | Rol contable de la nómina: `liquidacion_legal`, `anticipo`, `pago_extraordinario`, `rectificacion`. Separa la frecuencia visible (`tipo`) del rol contable. |
| `version_calculo` | `integer` | Versión vigente del cálculo, creciente por intento exitoso. |
| `ciclo_id` | `uuid` | Identificador del corte temporal dentro de un período legal (p. ej. anticipo 1). |
| `plantilla_ciclo_id` | `uuid` | Referencia a la plantilla que congeló fechas y regla de anticipo en la creación. |
| `nomina_origen_id` | `uuid` | Vínculo a la nómina cerrada que rectifica esta entrada (solo para `naturaleza='rectificacion'`). |

Los rangos son inclusivos y la intersección contractual se evalúa como:

```text
inicioContrato <= fechaFinNomina
AND
(finContrato IS NULL OR finContrato >= fechaInicioNomina)
```

### Tablas nuevas

- **`nomina_plantilla_ciclo`**: configuración reutilizable por empresa para
  proponer fechas y regla de anticipo (porcentaje o monto fijo, excluyentes).
  Versionada por `(id_empresa, codigo, version)`. Solo una versión activa por
  `codigo` (índice parcial `ux_nomina_plantilla_ciclo_activa`).
- **`nomina_consolidacion`**: vínculo explícito entre nómina origen (anticipo
  o extraordinaria) y mensual consolidadora. No se infiere relación productiva
  por compartir mes calendario.

### Reglas de duplicidad y solapamiento

- Una mensual ordinaria activa por empresa y período legal (índice único
  parcial).
- Múltiples anticipos dentro del período, identificados por `ciclo_id`.
- Múltiples extraordinarias, cada una con identidad propia.
- Una rectificación apunta siempre a la nómina cerrada original
  (`nomina_origen_id`), no a una rectificación previa. El acumulado se calcula
  sumando todas las diferencias contra el original.
- No se permite cambiar rango, tipo o naturaleza después del primer cálculo
  sin invalidación explícita.

### Backfill y seed

- Backfill automático aplicado a `nomina_periodo`: `fecha_inicio`/`fecha_fin`
  derivados del `periodo` (primer y último día del mes), `naturaleza` =
  `liquidacion_legal` para mensuales existentes. Registros ambiguos (sin
  evidencia inequívoca) quedan disponibles para lectura sin asociación
  inventada.
- Seed mínimo: por cada empresa existente, plantilla `MES` activa (mensual,
  liquidación legal, sin porcentaje ni monto). Habilita F03 (plantillas) sin
  configuración manual previa.
- Snapshot temporal: las migraciones `..._lint_snapshot_temporal.sql` y
  `..._lint_snapshot_nombre_runtime.sql` agregan vistas y nombres de runtime
  para satisfacer reglas de lint sin romper consultas en producción.

### Compatibilidad

- No se eliminan columnas legacy en F01. Las consultas que aún leen por
  `periodo` siguen funcionando; los nuevos campos arrancan con defaults
  seguros y constraints estrictos solo aplican a registros nuevos.
- `database.types.ts` regenerado contra Supabase PROD; los modelos Angular se
  derivan de la BD y consumen los nuevos campos en commits `2cc42be`.

## Cimientos de auditoría y RLS (NOM-ADMIN-OPS-F02)

> Aplicado el 2026-06-11 a Supabase PROD (`mjrckxodzrfkyqjkyjkn`). Sustenta la
> fase F02 del [roadmap operativo](./roadmap-admin-generador-operativo-100.md).
> Migración: `supabase/migrations/20260611220000_nomina_f02_auditoria_y_rls_cimientos.sql`.
> Smoke postflight: `bd/scripts/validar-nomina-f02-cimientos.sql`.

### Helpers de identidad

| Función | Propósito |
|---|---|
| `public.current_user_id()` | Wrapper estable sobre `auth.uid()`. Retorna `NULL` si no hay sesión. Facilita testeo y reutilización desde SQL/RPC. |
| `public.current_user_empresa_id()` | Resuelve `id_empresa` desde el JWT (`app_metadata.id_empresa` o `user_metadata.id_empresa`). **Sin fallback a partir de F02:** una sesión sin `id_empresa` retorna `NULL` y RLS bloquea cualquier acceso. |

El endurecimiento del helper retira el fallback laxo heredado del rebuild
(devolver la primera empresa). En multi-tenant real, ese fallback rompe
aislamiento; en PROD actual (una empresa con `id_empresa` en JWT) no afecta
operación.

### RLS por empresa para tablas nuevas de F01

F01 dejó `nomina_plantilla_ciclo` y `nomina_consolidacion` con RLS habilitada
pero **sin políticas** (gap silencioso: con RLS enabled y cero policies,
solo `service_role` puede leer/escribir). F02 cierra el gap con cuatro
políticas por tabla:

- `SELECT`/`INSERT`/`UPDATE`: cerradas por `id_empresa = current_user_empresa_id()`.
- `DELETE` restringido por estado:
  - `nomina_plantilla_ciclo`: solo si `activo = false` (no se borran plantillas activas).
  - `nomina_consolidacion`: solo si `estado = 'pendiente'` (las aplicadas o anuladas conservan evidencia).

### Auditoría base reutilizable

| Cambio | Detalle |
|---|---|
| Columnas nuevas en `evento_auditoria_nomina` | `estado_previo`, `estado_nuevo`, `version_estado_esperada`, `version_estado_resultante`. Todas `text`/`integer` y nullable; aditivo. El histórico previo no se rellena: vive con NULL en esas columnas. |
| Función `registrar_evento_auditoria_nomina(...)` | `SECURITY DEFINER`. Recibe `p_id_nomina_periodo`, `p_accion`, `p_motivo`, `p_estado_previo`, `p_estado_nuevo`, `p_version_estado_esperada`, `p_version_estado_resultante`, `p_payload`. El actor (`id_usuario`) se resuelve en servidor desde `current_user_id()`: el cliente no puede falsificarlo. Pensada para uso desde toda RPC futura (F05, F06, F07, F09, F11, F12, F13, F16). |
| Trigger `tg_audit_nomina_periodo` actualizado | Consume `current_user_id()` y pobla las columnas estructuradas (`estado_previo`, `estado_nuevo`, `version_estado_esperada`, `version_estado_resultante`) además de `accion` y `id_usuario`. Mantiene compatibilidad con eventos previos. |

### Restricciones honradas

- F02 no introduce permisos finos por comando crítico (validación, aprobación,
  liquidación, cierre, rectificación, anulación). Eso es alcance de **F15b**,
  que se inserta una vez existen las RPC en F05 y siguientes.
- F02 no toca motor de cálculo, liquidaciones productivas, ficha legacy ni
  estilos globales. El código Angular productivo no cambia; solo se regeneran
  los tipos.

### Modo de adopción

Las nuevas RPC que se construyan en F05 en adelante deben:

1. Resolver el actor con `current_user_id()` (no recibirlo por parámetro).
2. Confiar en RLS para aislar `id_empresa` (no replicar el filtro en la
   función salvo razón fundada).
3. Registrar cada transición de estado con `registrar_evento_auditoria_nomina(...)`
   pasando `estado_previo`, `estado_nuevo`, `version_estado_esperada`,
   `version_estado_resultante` y, opcionalmente, `payload` con el contexto
   específico (p. ej. fingerprint de snapshot, huella del cálculo).

## Plantillas de ciclos (NOM-ADMIN-OPS-F03)

> Aplicado el 2026-06-11 a Supabase PROD (`mjrckxodzrfkyqjkyjkn`). Sustenta la
> fase F03 del [roadmap operativo](./roadmap-admin-generador-operativo-100.md).
> Migración: `supabase/migrations/20260611230000_nomina_f03_plantillas_ciclos.sql`.
> Smoke postflight: `bd/scripts/validar-nomina-f03-plantillas-ciclos.sql`.

### Extensión de `nomina_plantilla_ciclo`

| Columna | Tipo | Nota |
|---|---|---|
| `regla_fecha_pago` | `jsonb` NOT NULL | Objeto `{ tipo, ... }`. Tipos soportados: `dia_fijo` (con `dia`), `dia_habil_n` (con `n_habil`), `ultimo_dia_habil`, `ultimo_dia_corrido`, `siguiente_mes_dia_fijo` (con `dia`). |
| `politica_fin_semana` | `text` NOT NULL (default `adelantar`) | `adelantar` (viernes anterior), `atrasar` (lunes siguiente) o `mantener`. |
| `regla_anticipo` | `jsonb` NULL | Solo para `naturaleza='anticipo'`: `{ modo: 'porcentaje' \| 'monto_fijo', valor }`. XOR con no-anticipos vía constraint. |
| `descripcion` | `text` NULL | Texto humano. Aparece como subtítulo en la grilla. |

### Helpers SQL y RPC

| Símbolo | Rol |
|---|---|
| `fn_ultimo_dia_corrido(date)` | Último día calendario del mes. |
| `fn_ultimo_dia_habil(date)` | Último lun-vie del mes (sin feriados oficiales). |
| `fn_dia_habil_n(date, n)` | N-ésimo lun-vie del mes. |
| `fn_aplicar_politica_fds(date, text)` | Ajusta fechas que caen en sábado o domingo según política. |
| `fn_calcular_fecha_pago(jsonb, date, text)` | Combina los anteriores; resuelve la fecha de pago propuesta. |
| `previsualizar_cortes_plantilla(uuid, integer, integer)` | `SECURITY INVOKER`. Proyecta cortes para mensual (liquidación legal + anticipo + pago extraordinario), quincenal y semanal. Extraordinaria retorna vacío. No escribe. |
| `crear_version_plantilla(uuid, text, jsonb, text, jsonb, text, boolean)` | `SECURITY INVOKER`. Crea la siguiente versión copiando lo no especificado; si `p_activar=true` (default), desactiva la versión anterior. Retorna `uuid` (id de la nueva fila). |

> **Día hábil = lun-vie sin calendario de feriados.** Es una heurística
> conservadora. Cuando se integre un calendario oficial (CL), `fn_ultimo_dia_habil`
> y `fn_dia_habil_n` se podrán reemplazar en una migración aditiva sin tocar la
> RPC ni la UI.

### Reglas de versionado

- El **código** (`codigo`) y la **identidad de empresa** (`id_empresa`) no
  cambian entre versiones. La versión nueva se inserta con `version = max + 1`.
- Solo puede existir una versión `activo=true` por `(id_empresa, codigo)`
  (índice único parcial `ux_nomina_plantilla_ciclo_activa`).
- `crear_version_plantilla(..., p_activar=true)` desactiva la versión anterior
  dentro de la misma transacción.
- Las nóminas existentes no se ven afectadas por una nueva versión: la
  relación es por `plantilla_ciclo_id` puntual (F01).

### Capa Angular

| Pieza | Ubicación |
|---|---|
| Modelos | `src/app/features/nomina-mensual/models/nomina-plantilla-ciclo.models.ts` |
| Mapper BD ↔ TS | `src/app/features/nomina-mensual/mappers/nomina-plantilla-ciclo.mapper.ts` |
| Repository | `src/app/features/nomina-mensual/data-access/nomina-plantilla-ciclo.repository.ts` |
| Service | `src/app/features/nomina-mensual/services/nomina-plantilla-ciclo.service.ts` |
| Presenter de la grilla | `src/app/features/nomina-mensual/presenters/admin-plantillas.presenter.ts` |
| Container | `src/app/features/nomina-mensual/containers/administrador-plantillas-container/` |
| Modal editor | `…/components/admin-plantillas-modal-editor/` |
| Modal preview | `…/components/admin-plantillas-modal-preview/` |
| Ruta | `/remuneraciones/plantillas-ciclos` |
| Menú lateral | Sección **Gestión** → "Plantillas de ciclos" (`calendar-days`) |

### Restricciones honradas

- Sin tocar motor de cálculo, liquidaciones productivas, ficha legacy ni
  estilos globales.
- Sin dependencias nuevas. Patrón visual heredado del Administrador de
  nóminas (`bindShellPageContext` + `app-data-grid` + `app-message-box`).
- Las plantillas activas no pueden eliminarse: la política `DELETE` de RLS
  (vigente desde F02) exige `activo = false`.

### Lo que F03 no entrega todavía

- No integra todavía el preview en el modal de **Nueva nómina** (eso lo hace
  F04 — Preview automático de creación).
- No expone "duplicar plantilla" como atajo. El equivalente operativo es
  crear una nueva plantilla con otro código.
- No implementa calendario oficial de feriados (heurística lun-vie). Deuda
  para una fase propia o anexo.

## Aprovisionamiento del JWT (NOM-ADMIN-OPS-F03b)

> Aplicado el 2026-06-11. Corrección post-F02 que desbloquea el INSERT real en
> `nomina_plantilla_ciclo` (y cualquier tabla con policy
> `id_empresa = current_user_empresa_id()`).
> Migración: `supabase/migrations/20260611240000_nomina_f03b_seed_id_empresa_jwt.sql`.
> Smoke E2E: `bd/scripts/validar-nomina-f03b-rls-insert.sql`.

### Por qué fue necesario

F02 endureció `public.current_user_empresa_id()` para leer **solo** del JWT
(`auth.jwt() -> app_metadata` o `user_metadata` con clave `id_empresa`).
La policy F02 de `nomina_plantilla_ciclo` exige `id_empresa = current_user_empresa_id()`
en `WITH CHECK` (INSERT) y `USING` (SELECT/UPDATE/DELETE).

El usuario `prueba@erp.cl` tenía `raw_app_meta_data = {"role":"admin",...}` sin
`id_empresa`. La función resolvía a `NULL` y toda comparación
`id_empresa = NULL` devuelve falso → INSERT rechazado en runtime (la grid
también se mostraba vacía aunque la BD tuviera plantillas).

### Qué hace F03b

1. **Backfill puntual**, idempotente: si `count(empresa) = 1` y el usuario
   no trae `id_empresa` ni en `raw_app_meta_data` ni en `raw_user_meta_data`,
   se setea `raw_app_meta_data.id_empresa` = id de esa empresa.
2. **Trigger BEFORE INSERT** sobre `auth.users`
   (`tg_auth_users_seed_id_empresa` → `public.tg_seed_id_empresa_jwt()`,
   `SECURITY DEFINER`, `search_path public, auth`). Aplica la misma regla a
   usuarios nuevos mientras exista una sola empresa. Cuando haya
   multi-empresa real, el trigger queda inerte y el aprovisionamiento debe
   formalizarse en el flujo de invitación.

No toca `current_user_empresa_id()` ni las policies RLS.

### Refresco del JWT

Los cambios en `raw_app_meta_data` se reflejan en el JWT cuando se emite un
token nuevo (signOut + signIn o refresh natural). Tras aplicar F03b, los
usuarios con sesión activa deben **cerrar sesión y volver a entrar** una vez
para que el cliente envíe `id_empresa` en el JWT.

### Cómo verificarlo

`bd/scripts/validar-nomina-f03b-rls-insert.sql` simula la sesión del usuario
(`set_config('request.jwt.claims', ...)`, `role authenticated`), llama a
`current_user_empresa_id()` (debe devolver el id de empresa) e intenta un
`INSERT` real en `nomina_plantilla_ciclo`. Reporta por `NOTICE`:
`current_user_empresa_id() resuelve a: <n>` + `INSERT como authenticated
aceptado por RLS`. El smoke termina con `ROLLBACK` para no persistir la fila.

## Actualización 2026-06-05 - ciclo consistente y cálculo vigente

`NOM-ADMIN-ABIERTAS-CICLO-CONSISTENTE-01` completa la coherencia operativa:

- Las transiciones se validan en dominio y mediante `transicionar_nomina_periodo`.
- `nomina_periodo` guarda el snapshot V1 vigente, versión y fechas de cálculo, validación y aprobación.
- Cambiar dotación o movimientos invalida el cálculo y devuelve la nómina a revisión.
- `nomina-periodo-calculo-adapter.service.ts` calcula solo los trabajadores de la nómina seleccionada.
- El cierre exige estado aprobado, cálculo vigente y ausencia de bloqueos.
- Dotación usa consulta SQL paginada y las liquidaciones se habilitan solo desde una nómina cerrada y trazable.

Migración: `supabase/migrations/20260605120000_nomina_periodo_ciclo_consistente.sql`.
>
> **Sustituye** y absorbe: `NOM-ADMIN-GENERADOR-01` (plan v2.2 intermedio, nunca implementado), `NOM-GRILLA-BASE-01` (plan v2.1 intermedio), `NOM-MULTI-NOMINA-01` (propuesta abierta el 2026-06-03).

## Decisión rectora 2026-06-04 — F3 fusion (BD real + Generador V2 renovado)

A partir de 2026-06-04 la fase F3 se ejecutó como una **fusion** de F3 + F4 + F5: el Generador V2 se renueva en sitio para operar con 6 pasos y se conecta a Supabase con tablas, RLS y triggers nuevos. El motor V1 (`/remuneraciones/proceso-mensual`) sigue intacto: se mantiene la coexistencia por capas (`nomina_periodo` cabecera operativa + `nomina_calculo_*` snapshot del motor V1, unidos por `periodo + id_empresa`).

- Se levanta de forma controlada la restricción "BD/SQL/RPC/RLS bloqueado" SOLO para esta fase. Se documenta en `migracion-bd-nomina-rebuild.md`.
- Se introduce `EmpresaActivaService` (resuelve `id_empresa` por JWT o fallback) y `NominaPeriodoService` productivo que reemplaza al mock adapter en producción (el mock queda para tests).
- Los pasos `scope`, `employees`, `approval`, `payslips` desaparecen del modelo `PayrollStepId`. Quedan: `parameters`, `dotacion`, `movements`, `calculation`, `validation`, `closure`.
- El motor productivo nuevo (F6) y la migración histórica `nomina_calculo_*` → `nomina_periodo` NO entran en F3 fusion.

## 1. Decisión rectora

Reconstruir Nómina mensual como módulo definitivo bajo dos roles separados:

| Módulo de hoy | Rol futuro | Propósito |
|---------------|------------|-----------|
| `Nómina mensual` (`proceso-mensual`) | **Administrador de Nóminas** | Bandeja de todas las nóminas del año. Lista resúmenes, crea/abre nóminas, navega al Generador. |
| `Nómina mensual V2` (`nomina-mensual-v2`) | **Generador de Nómina** | Trabaja **una** nómina por `:nominaPeriodoId`. Stepper de 6 pasos. |
| `Recurrentes` (módulo nuevo) | Reglas permanentes | Catálogo de `MovimientoRecurrente` aplicables a nóminas. |
| `Movimientos` | Vista transversal | `MovimientoNomina` globales y por nómina. |
| `Conceptos` | Catálogo base | Tipos de movimiento (haber, descuento, ausencia, informativo). |
| `Liquidaciones oficiales` | Salida posterior | Generadas desde una nómina confirmada. |

La reconstrucción se ejecuta por fases controladas (F0-F7). Esta primera iteración cubre solo **F0 (documentación)** y **F1 (modelos centrales + adapter mock + tests)**.

## 2. Naming definitivo

| Concepto | Término correcto | Términos prohibidos |
|----------|------------------|---------------------|
| Paso del generador que revisa trabajadores | **`Dotación`** | `Alcance + Empleados` (pasos separados antiguos) |
| Grupo operativo dentro de una nómina | **`SegmentoNomina`** | `SubBase`, `Base`, `SubBaseNomina`, `Sub-nómina` |
| Estado tras crear la nómina | **`dotacion_generada`** | `base_generada` |
| Servicio de F1 | **`nomina-periodo-mock-adapter.service.ts`** | `nomina-periodo-adapter.service.ts` (ambiguo) |
| Servicio puente al motor (F6) | **`nomina-periodo-calculo-adapter.service.ts`** | — |
| Servicio productivo (futuro) | **`nomina-periodo.repository.ts`** / **`.service.ts`** | — |

El sufijo `mock-adapter` y `calculo-adapter` es obligatorio para evitar confusión con servicios productivos.

**Razón del cambio**: el código actual ya tiene `fechaBaseGuardada`, `idCalculoPeriodoBase`, "Parámetros base" con significado distinto (período anterior). Reusar la palabra `Base` o `Sub-base` produciría colisión cognitiva.

## 3. Stepper definitivo del Generador

```txt
1. Parámetros
2. Dotación
3. Movimientos
4. Cálculo
5. Validación
6. Cierre
```

Reemplaza los 8 pasos actuales (`parameters / scope / employees / movements / calculation / validation / approval / payslips`). La unificación `scope + employees → Dotación` y la eliminación de `approval / payslips` (absorbidos por `Validación / Cierre`) se aplica en **F3**, no en F1.

## 4. Routing definitivo

```txt
/remuneraciones/nominas                                  → Administrador (lista)
/remuneraciones/nominas/:nominaPeriodoId/generador       → Generador (1 nómina)
```

Reemplaza progresivamente `/remuneraciones/nomina-mensual-v2`. El cambio se aplica en **F3**, no en F1.

## 5. Principio rector — Trabajo por excepción

El flujo debe escalar a cientos o miles de trabajadores. **El usuario no revisa todos los trabajadores; revisa solo los que tienen incidencias, cambios o movimientos especiales.**

Las 10 reglas que gobiernan toda la arquitectura:

1. **Generación automática**: la dotación se construye desde trabajadores activos al crear la nómina.
2. **Recurrentes idempotentes**: ejecutar `aplicarRecurrentesANomina` dos veces NO duplica movimientos. Clave lógica: `nominaPeriodoId + trabajadorId + recurrenteId + tipo`.
3. **Respeto de omitidos**: si un movimiento con esa misma clave tiene `estado='omitido'`, NO se reaplica automáticamente (preserva la decisión manual del usuario).
4. **Segmentación de recurrentes**: trabajador / segmento / centro de costo / cargo / tipo de contrato / grupo.
5. **Grilla del Administrador**: solo carga `NominaPeriodoResumen[]`. Sin detalle.
6. **Grilla de Dotación**: solo carga `FilaTrabajadorNominaResumen[]`. Sin detalle.
7. **Detalle bajo demanda**: `DetalleTrabajadorNomina` se carga solo al abrir fila/modal/drawer.
8. **Acciones masivas con preview**: `PreviewAccionMasivaTrabajadores` muestra afectados + monto + advertencias + `puedeAplicar` antes de aplicar.
9. **Guardia de cálculo**: bloquear cálculo si hay incidencia crítica bloqueante.
10. **Guardia de cierre**: bloquear cierre si hay incidencia crítica bloqueante.

## 6. Modelos centrales (F1)

Ubicación: `src/app/features/nomina-mensual/models/`. Conviven con los modelos productivos existentes (`proceso-mensual.model.ts`, `acta-operativa-periodo.model.ts`).

### 6.1 `nomina-periodo.models.ts`

| Tipo | Propósito |
|------|-----------|
| `EstadoNomina` | `borrador` → `dotacion_generada` → `en_revision` → `calculada` → `validada` → `aprobada` → `cerrada` (con `reabierta` y `anulada` adicionales). |
| `NominaPeriodoResumen` | Lo que carga el Administrador. Solo totales + estado + fechas. |
| `NominaPeriodo` | La nómina completa: incluye `segmentos[]`, `movimientos[]`, `incidencias[]`, `eventosAuditoria?[]`. |
| `SegmentoNomina` | Grupo operativo: `tipo: 'planta' \| 'honorarios' \| 'centro_costo' \| 'personalizada'`, `estado: 'borrador' \| 'lista' \| 'bloqueada'`, `trabajadorIds[]`, `ordinal`. |
| `IncidenciaNomina` | `severidad: 'critica' \| 'advertencia' \| 'informativa'`, `bloqueante: boolean`, ref opcional a `trabajadorId` / `segmentoId`. |
| `ResumenValidacionNomina` | Resumen pre-cálculo: `puedeCalcular` Y `puedeCerrar` + listas separadas de críticas / advertencias. |
| `EstadoTrabajadorNomina` | `listo / advertencia / critico / editado / omitido / bloqueado`. |
| `FilaTrabajadorNominaResumen` | Lo que carga la grilla de Dotación. Contadores + estado, **sin detalle**. |
| `DetalleTrabajadorNomina` | Detalle bajo demanda: movimientos, incidencias, datos bancarios/previsionales. |
| `FiltroRapidoDotacion` | Filtros rápidos: `estado?`, `segmentoId?`, `conIncidencias?`, `conMovimientos?`, `busqueda?`. |
| `PaginacionGrilla` | `page`, `pageSize`, `total`. Base de la grilla con paginación. |
| `EventoAuditoriaNomina` | TODO declarado: `accion: 'creada' \| 'calculada' \| 'validada' \| 'aprobada' \| 'cerrada' \| 'reabierta' \| 'anulada'` + `usuarioId?` + `motivo?`. La emisión real se implementa en F2+F3. |

### 6.2 `movimiento-nomina.models.ts`

| Tipo | Propósito |
|------|-----------|
| `MovimientoTipo` | Union string abierta. Se cierra cuando se conecte al catálogo de Conceptos. |
| `MovimientoCategoria` | `haber / descuento / ausencia / informativo`. |
| `MovimientoRecurrente` | Regla permanente. Segmentación por `trabajadorId? / segmentoId? / centroCostoId? / cargoId? / tipoContratoId? / grupoId?`. `frecuencia: 'mensual' \| 'quincenal' \| 'semanal'`. `estado: 'activo' \| 'pausado' \| 'finalizado'`. |
| `MovimientoNomina` | Movimiento aplicado a una nómina específica. `origen: 'manual' \| 'recurrente' \| 'importado' \| 'sistema'` + `recurrenteId?` para idempotencia. `estado: 'borrador' \| 'aplicado' \| 'observado' \| 'omitido' \| 'anulado'`. |
| `CriterioAplicacionRecurrente` | Discriminated union por `tipo`: `trabajador / segmento / centro-costo / cargo / tipo-contrato / grupo`. Usado por `aplicarRecurrentePorCriterio`. |
| `AccionMasivaTrabajadores` | Discriminated union: `agregar-movimiento / mover-segmento / marcar-revisado / excluir-nomina`. |
| `PreviewAccionMasivaTrabajadores` | Modelo del preview obligatorio antes de aplicar: `totalTrabajadoresAfectados`, `montoTotalEstimado?`, `totalIncidenciasCriticas`, `totalAdvertencias`, `mensajes[]`, `puedeAplicar`. |

## 7. Adapter mock (F1)

`features/nomina-mensual/services/nomina-periodo-mock-adapter.service.ts` expone 8 stubs (retornan mock, no conectan BD ni motor):

| Método | Contrato |
|--------|----------|
| `consolidarSegmentosParaCalculo(nominaPeriodoId)` | Consolida todos los segmentos en un único `ResultadoAlcanceNomina` compatible con orquestador V2 actual (puente para F6). |
| `aplicarRecurrentesANomina(nominaPeriodoId)` | Aplica recurrentes activos. **Idempotente**: clave `nominaPeriodoId + trabajadorId + recurrenteId + tipo`. **Respeta omitidos**: si la clave ya existe con `estado='omitido'`, NO crea uno nuevo. |
| `aplicarRecurrentePorCriterio(criterio, nominaPeriodoId)` | Helper para acciones masivas. Aplica un recurrente solo a los trabajadores que matchean el criterio. |
| `validarDuplicidadTrabajadorSegmento(nominaPeriodoId)` | Detecta trabajadores en >1 segmento activo (`bloqueante=true`). |
| `obtenerResumenValidacionNomina(nominaPeriodoId)` | Resumen pre-cálculo. `puedeCalcular=false` y `puedeCerrar=false` si hay críticas bloqueantes. |
| `filtrarDotacion(nominaPeriodoId, filtro, paginacion)` | Aplica filtros + paginación al conjunto. Retorna `{ filas: FilaTrabajadorNominaResumen[]; total: number }`. Sin detalle. |
| `obtenerDetalleTrabajador(nominaPeriodoId, trabajadorId)` | Detalle bajo demanda al abrir fila. |
| `previsualizarAccionMasiva(nominaPeriodoId, trabajadorIds, accion)` | Preview obligatorio antes de aplicar acción masiva. NO modifica la nómina. |

## 8. Reglas de uso de mocks

- Los archivos `*-mock.ts` y `*-mock-adapter.service.ts` **solo se importan desde**: tests vitest, stories (futuro), adapters mock, componentes UI de fases F2-F5 antes de conectar productivo.
- **Prohibido** importarlos desde servicios productivos definitivos, repositorios reales, motor de cálculo o flujos productivos.
- Cabecera obligatoria:

  ```ts
  /**
   * Datos mock de F1 (NOM-REBUILD-NOMINA-MENSUAL-01).
   * Uso permitido: tests, stories, adapters mock, UI temporal F2-F5.
   * NO importar desde servicios productivos definitivos.
   */
  ```

- En F7 (limpieza) se reevalúa qué mocks se mantienen como fixtures de test.

## 9. Tests obligatorios de F1 (25 tests)

Resumen del contrato. Detalle completo en el spec.

| # | Categoría | Test |
|---|-----------|------|
| 1-5 | Modelos | Helpers de creación, no duplicidad entre segmentos, mover trabajador sin perder movimientos. |
| 6 | Recurrentes | Aplicación básica. |
| **7** | **Recurrentes** | **`aplicarRecurrentesANomina` dos veces NO duplica (idempotencia)**. |
| **8** | **Recurrentes** | **Recurrente con `estado='omitido'` NO se reaplica**. |
| 9-14 | Recurrentes por criterio | 6 criterios: trabajador / segmento / centro-costo / cargo / tipo-contrato / grupo. |
| 15-17 | Dotación | Filtro por incidencia, paginación, NO retorna detalle completo. |
| 18 | Detalle | Carga bajo demanda. |
| 19-22 | Validación | Totales correctos, `puedeCalcular`, `puedeCerrar` (con y sin críticas). |
| 23 | Puente motor | `consolidarSegmentosParaCalculo` compatible con orquestador. |
| 24-25 | Preview masivo | Preview no modifica nómina, `puedeAplicar` reacciona a críticas. |

## 10. Fases declaradas (no se ejecutan en F1)

| Fase | Alcance | Tocará |
|------|---------|--------|
| **F0** ✓ | Documentación (este archivo + estado-fases + contexto). | Solo `docs/codex/`. |
| **F1** ✓ | Modelos + adapter mock + tests. | `features/nomina-mensual/models/ + services/ + data/`. Aditivo. |
| **F2** ✓ | UI Administrador (KPIs operativos, grilla `app-data-grid`, modal nueva nómina, modal resumen, acción "Abrir generador"). | `features/nomina-mensual/containers/administrador-nominas-container/`, `pages/administrador-nominas.page.ts`, `presenters/admin-nominas.presenter.ts`, `rules/admin-nominas.rules.ts`, ruta `/remuneraciones/nominas`, menú + breadcrumbs. Sin tocar V1 ni V2. |
| **F3** | Generador definitivo (6 pasos, nueva ruta). | Routing, menú, stepper, orquestador V2. |
| **F4** | Dotación escalable (segmentos, filtros, paginación, acciones masivas, detalle bajo demanda). | Pasos `scope` + `employees` actuales (reemplazados por `Dotación`). |
| **F5** | Movimientos integrados (recurrentes aplicados, manuales, omitir, editar este mes). | Paso `movements` actual. |
| **F6** | Cálculo / motor (adapter `Segmentos + movimientos → base consolidada → motor actual`). | `services/` (puente). El motor productivo NO se rehace. |
| **F7** | Limpieza (ruta antigua, stepper antiguo, mocks obsoletos, código sin uso). | Eliminación controlada. |

## 11. Restricciones LEVANTADAS (a partir de F2)

A partir de F2, las restricciones del plan v2.2 se levantan. SE PERMITE tocar:

- Routing del módulo, menú lateral, stepper V2, orquestador V2.
- Modelos / mocks actuales.
- Componentes de alcance, empleados, movimientos.
- Servicios puente, navegación entre Nómina mensual y V2.
- Pantalla actual de Nómina mensual.
- Flujo actual de V2.

**F0 + F1 son aditivas**: no tocan ninguno de estos elementos. Las restricciones se levantan a partir de F2.

## 12. Restricciones que SIGUEN VIGENTES (todas las fases)

- BD productiva, SQL / RPC / RLS.
- Previred, LRE, Reportes, Licencias médicas.
- Liquidaciones productivas profundas (excepto navegación o lectura).
- Motor productivo de cálculo (excepto adapter / controlador puente en F6).
- `angular.json`, `postcss.config.json`, `src/styles/*`, fuentes globales.

## 13. Reglas de oro (todas las fases)

- No dejar tests rojos.
- No romper build.
- No borrar código anterior sin reemplazo funcional.
- No mezclar todas las fases en una sola pasada.
- No tocar Reportes ni Licencias médicas todavía.
- No modificar BD / SQL / RPC / RLS sin una fase específica.

## 14. Decisiones absorbidas

| Decisión anterior | Resuelta por |
|-------------------|--------------|
| `NOM-ADMIN-GENERADOR-01` (plan v2.2: Admin + Generador con `SubNomina`). | Naming corregido a `SegmentoNomina + Dotación` y plan ampliado a F0-F7. |
| `NOM-GRILLA-BASE-01` (plan v2.1: paso "Base" unificado). | Paso renombrado a `Dotación` e integrado al stepper de 6 pasos. |
| `NOM-MULTI-NOMINA-01` (propuesta 2026-06-03: múltiples nóminas del mismo período). | Resuelta por el modelo `NominaPeriodo.tipo: 'mensual' \| 'quincenal' \| 'semanal' \| 'extraordinaria'` + el Administrador maneja N nóminas por período. |

## 15. Referencias

- Prompt rector: [`prompt_reconstruccion_controlada_nomina_mensual.md` (Downloads)](file:///c:/Users/PC/Downloads/prompt_reconstruccion_controlada_nomina_mensual.md).
- Stepper actual: [`v2/nomina-v11-contrato-funcional-preparaciones-lotes-por-tipo.md`](./v2/nomina-v11-contrato-funcional-preparaciones-lotes-por-tipo.md).
- Auditoría V2 base: [`auditorias/auditoria-nomina-v2-2026-06.md`](./auditorias/auditoria-nomina-v2-2026-06.md).
- Modelos productivos existentes: `src/app/features/nomina-mensual/models/proceso-mensual.model.ts`, `acta-operativa-periodo.model.ts`.
