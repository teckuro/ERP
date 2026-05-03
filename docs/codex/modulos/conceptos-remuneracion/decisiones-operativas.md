# Conceptos de remuneración — decisiones operativas

## 1. Objetivo

Cerrar **criterios de producto y operación** del catálogo `concepto` **antes** de la implementación **Fase 9.2** (permisos reales, alineación UI/servicio/repositorio, pruebas). Este documento **no** sustituye el contrato técnico de pantalla en [`contrato-funcional.md`](./contrato-funcional.md); lo **complementa** y, en caso de ambigüedad sobre **quién puede qué** o **flujo de baja**, **prevalece** este archivo hasta revisión explícita.

**Fuera de alcance aquí:** implementar RLS, JWT, pantallas nuevas, motor de liquidación, UI de `regla_concepto_calculo`, cambios en Python o SQL destructivo (ver §9 y §10).

---

## 2. Decisiones de permisos

Se definen **perfiles lógicos** para mapear luego a **claims/roles JWT** y a **políticas RLS** (trabajo Fase 9.2 / infra). Hoy la app no distingue estos roles en el contenedor (`PUEDE_EDITAR_CONCEPTOS_MODO_ADMIN` fijo a `false`); la **brecha** sigue documentada en [`diagnostico-fase-9.md`](./diagnostico-fase-9.md) §5 y §8.

| Perfil | Crear concepto (no sistema) | Editar concepto usuario | Editar concepto sistema / `calculo_automatico` | Desactivar (`vigente=false` / cierre vigencia) | Eliminar físico | Consulta listado |
|--------|---------------------------|-------------------------|-----------------------------------------------|-----------------------------------------------|-----------------|------------------|
| **Consulta conceptos** | No | No | No | No | No | Sí |
| **Mantenedor conceptos** | Sí (solo tipos permitidos §4) | Sí (solo no sistema y no automático, §3) | No | Sí (solo no sistema y no automático, §7) | Sí (solo si §7 permite) | Sí |
| **Admin conceptos** | Sí (incl. tipos reservados si §4) | Sí (matriz §3) | Sí (con auditoría futura recomendada) | Sí | Sí (mismas reglas §7; nunca sistema) | Sí |

**Definición de “Admin conceptos” para Conceptos:** perfil que puede **romper el candado** de edición sobre conceptos con `es_sistema` o `calculo_automatico`, **solo** para los campos explícitamente permitidos en §3 y con trazabilidad cuando el producto la implemente. No implica acceso a **liquidaciones** ni a **motor** global.

**RLS / Supabase:** **no** se aprueba en este documento un script nuevo de RLS; solo se registra la **decisión**: las políticas permisivas actuales son **inaceptables en producción** y deben reemplazarse por políticas acotadas a estos perfiles cuando exista modelo de autenticación acordado.

---

## 3. Conceptos sistema / protegidos

**“Protegido” en UI** sigue la regla ya implementada: `es_sistema === true` **o** `calculo_automatico === true` bloquea edición/eliminación salvo Admin conceptos (§2).

### 3.1 Campos inmutables (todos los conceptos)

- **`codigo`:** inmutable tras creación (identidad estable para integraciones y asignaciones).
- **`es_sistema`:** no lo crea el usuario estándar; no puede pasar de `true` a `false` desde UI.

### 3.2 Campos editables — concepto **no sistema** y **no** `calculo_automatico` (Mantenedor)

- `nombre`, `codigo_motor`, `tipo` (dentro de lo permitido §4), `naturaleza`, flags de imposición/cotizaciones/líquido, `id_catalogo_lre`, `vigente`, `vigencia_inicio` / `vigencia_fin`, `orden_impresion`.
- **`calculo_automatico`:** Mantenedor **no** puede pasar de `false` a `true` (riesgo de mezclar con motor); solo **Admin conceptos** si el negocio lo autoriza con procedimiento.

### 3.3 Concepto **sistema** (`es_sistema = true`)

- **Eliminación física:** **no** (ya en contrato funcional).
- **Desactivación (`vigente=false`) o cierre de vigencia:** solo **Admin conceptos**, y solo si el negocio valida impacto en liquidaciones/seeds; por defecto asumir **no desactivar** salvo procedimiento normativo.
- **Campos editables por Admin:** nombre visible, orden impresión, mapeo LRE y flags **solo** si no contradice normativa sellada; `codigo` y `es_sistema` **no** cambian.

### 3.4 Concepto **`calculo_automatico`** (generado por liquidación)

- **Mantenedor:** no edita el registro (comportamiento actual).
- **Admin conceptos:** puede ajustar campos **no** estructurales (p. ej. nombre para leyenda, orden impresión, LRE) según política interna; **no** apagar `calculo_automatico` sin revisión de motor.
- **Si existen filas en `regla_concepto_calculo`:** cualquier cambio que afecte cálculo debe considerarse **cambio de motor**; hasta tener UI/contrato de reglas, solo **Admin** vía **migración controlada** o herramienta batch, no Mantenedor desde pantalla.

---

## 4. Conceptos de usuario (empresa)

- **Tipos que puede crear el Mantenedor conceptos:** **`HABER`** y **`DESCUENTO`** por defecto.
- **`APORTE_EMPLEADOR`:** **reservado** a **Admin conceptos** o a **carga normativa** (semillas Python / migraciones). Motivo: riesgo normativo y de imposición; el selector de asignaciones **no** permite aportes manuales a persona (coherente con [`contrato-funcional.md`](./contrato-funcional.md) §3.4).
- **“Conceptos informativos”:** el modelo v11 actual **no** tiene un `tipo` distinto para “solo informativo”. **Decisión v1:** no crear tipo nuevo en este documento; los informáticos pasan por **motor/LRE** o futuras extensiones. Si el producto los necesita antes, abrir **fase de modelo** aparte (no 9.2 UI sola).

**Brecha de implementación:** el modal actual permite elegir `APORTE_EMPLEADOR` para cualquier usuario que abra “Nuevo concepto”. Fase 9.2 debe **alinear** el formulario y el servicio con la matriz anterior (deshabilitar u ocultar tipo según rol).

---

## 5. Conceptos asignables (Haberes y descuentos)

**Regla oficial** para aparecer en el selector de **asignación recurrente** a trabajador:

1. `tipo` ∈ **`HABER`**, **`DESCUENTO`**.
2. `es_sistema = false`.
3. `calculo_automatico = false`.
4. **`vigente = true`** (decisión explícita; hoy el repositorio puede no filtrarlo — **brecha** Fase 9.2).
5. **Vigencia por fechas:** si `vigencia_inicio` / `vigencia_fin` están informadas, la fecha de **contexto de asignación** (hoy: operación manual; mañana: período de liquidación) debe caer dentro del rango; hasta existir período acoplado en UI, **Mantenedor** no debe asignar conceptos claramente fuera de vigencia (validación suave en 9.2 mínimo: si `vigencia_fin` es anterior a la fecha actual, no listar).

**“Protegido”** en el sentido §3: si `es_sistema` o `calculo_automatico`, **no** es asignable (ya cubierto por 2–3).

**Impacto en Haberes/descuentos:** el contrato de asignaciones debe referenciar esta sección como fuente; actualizar enlace en [`../haberes-descuentos/contrato-general.md`](../haberes-descuentos/contrato-general.md).

---

## 6. Vigencias (`vigencia_inicio`, `vigencia_fin`, `vigente`)

### Relacion con Haberes y descuentos - Fase 9.3A

Conceptos sigue siendo la fuente para decidir si un concepto es asignable manualmente. Haberes y descuentos agrega una regla propia, separada, para validar que la asignacion recurrente por trabajador no tenga duplicados activos ni rangos de vigencia superpuestos para el mismo trabajador y concepto.

### Relacion con Haberes y descuentos - Fase 9.3B

El cierre de una asignacion recurrente historica no depende de que el concepto siga siendo asignable hoy. La regla de Conceptos aplica para crear o actualizar asignaciones; el cierre controlado pertenece a Haberes y descuentos y conserva historial sin delete fisico.

### Relacion con Haberes y descuentos - Fase 9.3C

La vista historica y los filtros por estado de vigencia son responsabilidad de Haberes y descuentos. Conceptos no duplica esos estados: solo mantiene la regla de asignabilidad para altas/ediciones. Las asignaciones VENCIDA, CERRADA e INVALIDA pueden consultarse como historial aunque el concepto ya no sea asignable.

- **`vigente`:** interruptor operativo **inmediato** (“sigue activo en catálogo”). Un concepto puede tener `vigente=true` y luego ajustar fechas para planificar baja.
- **`vigencia_inicio` / `vigencia_fin`:** opcionales; si ambas existen, **fin ≥ inicio** (ya validado en cliente/servicio).
- **Nueva versión normativa del “mismo” concepto:** como `codigo` es **único**, no hay dos filas con el mismo código. **Decisión:** una nueva versión normativa requiere **nuevo `codigo`** interno (p. ej. `BONO_MOV_2027`) o **procedimiento admin** que archive el anterior y cree el nuevo; no se autoriza “solape” de dos filas **mismo código** con distintas vigencias.
- **Corrección de concepto vigente:** edición permitida según §3; si el error es de fechas, ajustar `vigencia_*` sin crear duplicado.
- **Cierre de vigencia:** establecer `vigencia_fin` y, si corresponde, `vigente=false` al cumplirse el cierre (job manual o futura tarea programada fuera de 9.2 mínimo).

---

## 7. Eliminación vs desactivación

- **Flujo normal de baja:** **`vigente=false`** y/o **`vigencia_fin`** acotada; el registro **permanece** para historial, liquidaciones pasadas y trazabilidad LRE.
- **Eliminación física (`DELETE`):** **excepcional**; solo si **nunca** tuvo filas en `liquidacion_detalle` ni en `haberdescuento_persona` (regla ya en servicio) **y** el perfil es Mantenedor o Admin según política de borrado de catálogo, **y** entorno controlado (no producción sin checklist).
- **Concepto ya usado:** **no** eliminar; solo §7 flujo de baja.
- **Sistema:** nunca eliminar desde app.

---

## 8. Relación con LRE (`id_catalogo_lre`)

- **Obligatoriedad:** **no obligatorio** para que el Mantenedor cree o edite un `HABER`/`DESCUENTO` interno de empresa (permite iteración del catálogo).
- **Cambio de mapeo LRE:** permitido si el perfil puede editar el concepto; debe quedar **trazado** cuando exista bitácora (pendiente §10).
- **Conceptos sistema / semilla:** el LRE asociado se considera **parte del paquete normativo**; solo **Admin conceptos** o **normativa** lo modifica.
- **Sin mapeo LRE:** permitido en catálogo; la UI debe poder mostrar estado **“LRE no asignado”** (chip o columna) para apoyar cierre antes de exportaciones oficiales — **implementación Fase 9.2** (no bloquea guardado salvo política futura por tipo de export).
- **No** se introduce en esta fase un valor de BD “pendiente_lre”; el estado es **derivado** (`id_catalogo_lre IS NULL`).

---

## 9. Reglas de cálculo (`regla_concepto_calculo`)

- La tabla existe; **RLS** actual permite solo **lectura** a la app (`SELECT`).
- **Decisión:** **sin UI** de edición en Fase 9.2 salvo acuerdo explícito posterior; cualquier cambio sigue siendo por **migración SQL** o **service_role** con revisión de motor.
- **No** mezclar en la misma entrega la pantalla de conceptos con el **motor de liquidación** ni con `formula_json` (sigue [`contrato-funcional.md`](./contrato-funcional.md) §2.3).

---

## 10. Decisiones pendientes (posteriores a este documento)

| Tema | Qué falta |
|------|-----------|
| Nombres de roles JWT y mapeo a Supabase | Definición en auth + RLS |
| Auditoría de cambios en `concepto` | Tabla/bitácora o eventos |
| Validación automática UI vs metadatos LRE | Reglas para no contradecer LRE al vincular |
| Job de cierre `vigente` al vencer `vigencia_fin` | Producto / infra |
| Tipo “informativo” en modelo | Nueva fase de datos si aplica |

---

## 11. Impacto en implementación (Fase 9.2)

1. **Roles:** sustituir constante admin por comprobación de perfil §2; ocultar/deshabilitar acciones según perfil.
2. **Tipo APORTE:** restringir creación en UI/servicio a Admin (§4).
3. **Asignables:** la lista del selector en Haberes y la validación al guardar usan `esConceptoAsignable` sobre datos de mantenimiento (**Fase 9.2C**); ya no basta el filtro SQL parcial del repositorio legacy.
4. **Listado conceptos:** indicador **LRE no asignado** §8 (**Fase 9.2A** en UI: columna + filtros + `esConceptoAsignable` en `concepto-asignabilidad.rules.ts`).
5. **RLS:** tarea aparte con aprobación explícita de políticas; no ejecutar sin ticket.
6. **E2E:** ruta `/remuneraciones/conceptos` — spec dedicado `tests/conceptos-remuneracion-listado.spec.ts` (smoke); opcional ampliar `dashboard.spec.ts` con captura visual.
7. **Haberes/descuentos:** copiar en UI mensajes si el concepto deja de ser asignable por `vigente` o vigencia.
8. **Detalle y blindaje (Fase 9.2B):** modal desde **Revisar** con trazabilidad de reglas; `evaluarConceptoAccionesPermitidas` en `concepto-acciones.rules.ts` (sin eliminar en v1; alta no operativa); alinear con §2–§8 del contrato funcional.

**No incluido en 9.2 mínimo:** UI de `regla_concepto_calculo`, motor, liquidaciones, nómina, Parámetros, Python.

