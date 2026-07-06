# Conceptos de remuneración — contrato funcional

Documento **normativo** para el mantenedor de catálogo y su relación con asignaciones y liquidación. Diagnóstico factual: [`diagnostico-fase-9.md`](./diagnostico-fase-9.md). Principios globales: [`../../orquestador/diseno-operativo-erp.md`](../../orquestador/diseno-operativo-erp.md).

**Decisiones de producto (permisos, LRE, vigencias, baja):** [`decisiones-operativas.md`](./decisiones-operativas.md). Si hubiera contradicción no resuelta entre este archivo y aquél sobre **quién puede** o **flujo de baja**, prevalece **`decisiones-operativas.md`** hasta alinear ambos explícitamente.

## 1. Definición

Un **concepto de remuneración** es una fila del catálogo maestro `concepto` que describe **qué** se liquida o se asigna (tipo, naturaleza, impacto previsional/tributario, vínculo opcional a **LRE**), **no** el monto aplicado a una persona ni el resultado de una liquidación cerrada.

- **Asignación recurrente** (`haberdescuento_persona`): instancia por trabajador que **referencia** `id_concepto`.
- **Liquidación** (`liquidacion_detalle`): líneas que **referencian** `id_concepto`.

## 2. Dominios de datos (contrato)

### 2.1 Catálogo LRE (`catalogo_lre`)

- Es el **maestro oficial** de códigos LRE; el concepto enlaza con `id_catalogo_lre` opcional.
- Criterios de obligatoriedad, cambio de mapeo y estado “sin LRE”: ver [`decisiones-operativas.md`](./decisiones-operativas.md) §8. La UI debe permitir **desvincular** LRE (`null`) salvo política futura distinta aprobada por producto.

### 2.2 Concepto (`concepto`)

| Campo / grupo | Regla funcional |
|-----------------|-----------------|
| `codigo` | Único en BD; **inmutable** tras creación en la UI actual (input readonly en edición). |
| `codigo_motor` | Opcional; identificador para motor / integraciones. |
| `nombre` | Obligatorio; editable. |
| `tipo` | `HABER`, `DESCUENTO`, `APORTE_EMPLEADOR`. Si es `APORTE_EMPLEADOR`, la UI fuerza naturaleza no imponible y flags de imposición en falso (coherente con no asignar manualmente a persona). |
| `naturaleza` | `IMPONIBLE` o `NO_IMPONIBLE` (salvo aporte empleador). |
| Flags base / cotizaciones / líquido | Editables según permisos; deben reflejar negocio y, cuando exista LRE vinculado, **no contradecir** de forma silenciosa los metadatos LRE (hoy no hay validación cruzada automática en cliente). |
| `vigente` | Interruptor operativo; distinto de “vigencia por fechas” (ver siguiente). |
| `vigencia_inicio` / `vigencia_fin` | Opcionales; si ambas existen, **fin ≥ inicio** (validado en UI y servicio). |
| `orden_impresion` | Entero ≥ 0; ordena listados e informes. |
| `calculo_automatico` | Si es verdadero: concepto **generado por liquidación**; la UI restringe edición de ese flag y del resto del registro salvo perfil admin (ver §4). |
| `es_sistema` | Solo lectura en formulario; fijado en **false** al crear por UI; seeds pueden traer `true`. **No eliminable** desde UI. |
| `formula_json` | Reservado a **motor**; **no** forma parte del contrato de pantalla actual hasta definir editor o migraciones controladas. |

### 2.3 Reglas de cálculo (`regla_concepto_calculo`)

- Pertenece al dominio **motor de liquidación**; **fuera de alcance** del mantenedor `/remuneraciones/conceptos` en esta fase.
- Contrato futuro: quién crea versiones, cómo se versiona con `vigencia_inicio`, y política de publicación.

## 3. Reglas de negocio — mantenedor

### 3.1 Crear

- Usuario con permiso de **Mantenedor conceptos** (perfil en [`decisiones-operativas.md`](./decisiones-operativas.md) §2) puede crear conceptos **no sistema** (`es_sistema = false` en inserción), con tipos permitidos según §4 de ese documento.
- Código y nombre obligatorios; resto según defaults del modal.

### 3.2 Editar

- No se puede cambiar `codigo` tras creación (evita romper referencias externas y documentación).
- Concepto **protegido** (`es_sistema` **o** `calculo_automatico`): sin perfil administrador documentado, **no** se abre edición útil (solo mensaje de advertencia).
- Si el concepto tiene `calculo_automatico` y el usuario **no** es admin, **no** puede cambiar ese flag (validación en `guardarCatalogDialog` + servicio).

### 3.3 Eliminar

- **Prohibido** si `es_sistema`.
- **Prohibido** si existe uso en `liquidacion_detalle` o `haberdescuento_persona` (validación en servicio antes de `DELETE`).
- Mensaje de confirmación en UI debe mantenerse alineado al riesgo (borrado físico).

### 3.4 Asignación manual a trabajador (fuera de esta pantalla, pero regla global)

- Criterio completo (incl. `vigente` y vigencias): [`decisiones-operativas.md`](./decisiones-operativas.md) §5.
- Hoy el repositorio filtra por tipo `HABER`/`DESCUENTO`, `es_sistema = false` y `calculo_automatico = false`; Fase 9.2 debe alinear con §5 (p. ej. `vigente`).
- **APORTE_EMPLEADOR** y conceptos sistema / automáticos: **no** asignables manualmente (`HaberesDescuentosService`).

## 4. Perfil administrador (contrato técnico pendiente de productizar)

- Constante **`PUEDE_EDITAR_CONCEPTOS_MODO_ADMIN`** en el contenedor: hoy **`false`**.
- **Contrato:** cuando exista rol o claim en JWT (o política de empresa), sustituir por comprobación real y permitir:
  - editar conceptos con `calculo_automatico` o `es_sistema` solo si la política de negocio lo autoriza (matriz a definir con legal/operaciones);
  - nunca eliminar `es_sistema` desde UI sin migración explícita.

Hasta entonces, el comportamiento vigente es el descrito en §3.2–3.3.

## 5. UI/UX (alineación `AGENTS` / `ui-form-guidelines`)

- **Cabecera:** breadcrumb + título + lead (ya presente).
- **Listado:** `app-data-grid` con filtros colapsables según estándar del proyecto; chips por tipo y por modo manual/automático.
- **Mensajes:** `MessageBox` para éxito, validación, error y confirmación de borrado; textos de negocio, sin detalle técnico de motor salvo modo diagnóstico acordado.
- **Empty state:** cuando no hay filas, copy específico de catálogo vacío.

## 6. Seguridad y despliegue

- El contrato de **producción** debe reemplazar RLS permisivo por políticas acotadas (rol aplicación, separación anon/authenticated, o `service_role` solo para batch).
- Documentar en despliegue: quién puede ejecutar seeds Python que tocan `concepto`.

## 7. Dependencias con otras fases

- **Haberes y descuentos:** las asignaciones deben referenciar conceptos **vigentes** para el uso operativo; reglas finas de “vigente en período X” pueden reforzarse cuando exista **período de liquidación** acoplado en UI.
- **Motor / liquidaciones:** consumen `concepto`, `regla_concepto_calculo` y eventualmente `formula_json`; no avanzar motor productivo sin cerrar gobernanza de conceptos automáticos y sistema (ver [`../../orquestador/contexto-proyecto.md`](../../orquestador/contexto-proyecto.md) §15).

## 8. Pruebas (definición de listo incremental)

| Nivel | Qué debe cubrir |
|-------|------------------|
| **Unit** | `concepto-asignabilidad.rules`, `concepto-acciones.rules`, `haberes-descuentos.service` (filtro asignable / assert), mapeos desde Supabase, validaciones de payload donde existan. |
| **Integración / E2E** | Ruta `/remuneraciones/conceptos`: carga de grilla; detalle «Revisar»; smoke `tests/conceptos-remuneracion-listado.spec.ts`. |
| **Visual / E2E** | Opcional: captura en `tests/dashboard.spec.ts` cuando se estabilicen datos de entorno. |

## 9. Fase 9.2A — Listado base (catálogo)

**Objetivo:** dejar **visible y filtrable** el catálogo maestro sin completar CRUD avanzado, sin RLS/JWT productivos ni UI de `regla_concepto_calculo`.

**Implementación (código):**

- Contenedor: `src/app/features/haberes-descuentos/containers/conceptos-remuneracion-container/`.
- Regla **asignable** (alineada a [`decisiones-operativas.md`](./decisiones-operativas.md) §5): `src/app/features/haberes-descuentos/rules/concepto-asignabilidad.rules.ts` (`esConceptoAsignable`, `clasificarVigenciaConcepto`).
- **Columnas:** Nombre, Código, Tipo, LRE (texto código · nombre o «LRE no asignado»), Vigencia (chip según período respecto a **hoy**: vigente / sin fechas / futuro / vencido / no vigente catálogo), Origen (Sistema / Protegido / Usuario), Cálculo (Automático / Manual), Asignable (Sí/No), Acciones (Revisar resumen, Editar, Eliminar según reglas existentes).
- **Filtros:** búsqueda nombre/código/LRE; tipo; vigencia (período); asignable; origen sistema/usuario; LRE con/sin. Panel colapsable para no saturar cabecera.
- **Vacíos:** mensajes explícitos sin nombres de tablas cuando no hay datos o no hay coincidencias con filtros.
- **Qué no entra en 9.2A:** CRUD completo nuevo, permisos reales JWT, RLS definitiva, eliminación como flujo principal (sigue excepcional), asignación a trabajadores, motor.

## 10. Fase 9.2B — Detalle, trazabilidad y blindaje

**Objetivo:** que el usuario **entienda** cada concepto (asignable o no, vigencia, LRE, protección) y vea **qué acciones** están permitidas antes de actuar; sin completar CRUD nuevo ni RLS/JWT.

**Implementación (código):**

- Modal de **detalle** (solo lectura) al usar «Revisar»: identificación, clasificación operativa, vigencia (incl. estado **inválido** si fechas incoherentes), resumen de asignabilidad con **motivos** si no aplica, y lista de acciones permitidas/bloqueadas.
- `src/app/features/haberes-descuentos/rules/concepto-acciones.rules.ts`: `evaluarConceptoAccionesPermitidas`, `tituloAccionConcepto` (alta deshabilitada en UI, eliminación desde listado deshabilitada en esta fase; edición solo si no protegido o con modo admin).
- `concepto-asignabilidad.rules.ts`: `motivosNoAsignableConcepto`, `resumenAsignabilidadConcepto`, vigencia `INVALIDO`.
- Listado: tooltips en editar/eliminar según bloqueos; botón alta oculto (`primaryActionLabel` vacío); eliminar deshabilitado.

## 11. Fase 9.2C — Haberes: asignables alineados a regla central

**Objetivo:** que **Haberes y descuentos** no permita asignar un concepto que en **Conceptos** figura como no asignable (`esConceptoAsignable` + fecha de referencia **hoy**, misma regla que el listado del catálogo).

**Implementación (código):**

- `HaberesDescuentosService.listarConceptos()` filtra sobre `listarConceptosMantenimiento()` con `esConceptoAsignable`; se eliminó el listado SQL parcial del repositorio.
- `assertConceptoPermiteAsignacionManual` reutiliza la misma regla y mensajes vía `motivosNoAsignableConcepto`.
- UI mínima: texto de ayuda en cabecera Haberes; al editar, si el concepto ya no es asignable, aparece una opción de solo lectura en el selector para no perder contexto.

**Pendiente posterior:** `APORTE_EMPLEADOR` solo Admin; auditoría; JWT/RLS.

## 12. Documentos hermanos

- [`contrato-general.md`](./contrato-general.md) - resumen y enlaces.
- [`../haberes-descuentos/contrato-general.md`](../haberes-descuentos/contrato-general.md) - limites del modulo asignaciones (no duplicar definicion de concepto).

## 13. Relacion con Haberes y descuentos - Fase 9.3A

Conceptos define si un concepto es asignable manualmente mediante `esConceptoAsignable` en `src/app/features/haberes-descuentos/rules/concepto-asignabilidad.rules.ts`.

Haberes y descuentos, ademas de respetar esa regla, valida que la asignacion recurrente no tenga duplicados activos ni rangos de vigencia superpuestos para el mismo trabajador y concepto. Esa validacion vive en `src/app/features/haberes-descuentos/rules/haber-descuento-vigencia.rules.ts` y no cambia el contrato del catalogo maestro.

## 14. Relacion con Haberes y descuentos - Fase 9.3B

Conceptos define si un concepto puede asignarse manualmente al crear o actualizar asignaciones recurrentes.

El cierre de una asignacion recurrente historica pertenece a Haberes y descuentos y no debe bloquearse solo porque el concepto ya no sea asignable hoy. Cerrar valida existencia, vigencia y estado de la asignacion; no revalida `esConceptoAsignable`.

## 15. Relacion con Haberes y descuentos - Fase 9.3C

La vista historica de Haberes y descuentos deriva estados de vigencia de asignaciones recurrentes (`ACTIVA`, `FUTURA`, `VENCIDA`, `CERRADA`, `INVALIDA`) sin cambiar el contrato del catalogo Conceptos.

Conceptos sigue definiendo asignabilidad para crear o actualizar. El filtro historico de asignaciones pertenece a Haberes y descuentos: una asignacion cerrada o vencida puede seguir visible aunque el concepto ya no sea asignable hoy.

## 16. Relacion de navegacion con Remuneraciones (Fase 9.3B.1)

Conceptos de remuneracion y Haberes y descuentos son modulos hermanos dentro del dominio **Remuneraciones**.

Rutas oficiales de aplicacion:

```txt
/remuneraciones/conceptos
/remuneraciones/haberes-descuentos
```

Conceptos mantiene el catalogo maestro. Haberes y descuentos administra asignaciones recurrentes por trabajador.

Rutas antiguas de compatibilidad temporal (redirect): ver `docs/codex/orquestador/estado-fases.md` (Fase 9.3B.1).

## 17. Movimientos variables mensuales (Fase 9.4A)

El catalogo **concepto** es la **fuente** de definiciones que luego se aplican por persona: en **asignaciones recurrentes** (Haberes y descuentos) y en **movimientos variables mensuales** (modulo aparte).

- Conceptos define tipo, vigencia de catalogo, LRE, asignabilidad recurrente, sistema/usuario, automatico/manual.
- Movimiento variable **referencia** `id_concepto` y aplica un **monto puntual** en un **periodo** `YYYY-MM` para un trabajador; no redefine el catalogo.

Contrato del modulo movimientos variables: [`../movimientos-variables/README.md`](../movimientos-variables/README.md). Persistencia local de la fila puntual (tabla `movimiento_variable_mensual`, sin RLS productivo aun): [`../movimientos-variables/persistencia-9-4C.md`](../movimientos-variables/persistencia-9-4C.md). Pendiente de producto: flag o regla **asignable recurrente vs variable vs ambos** (documentado alli; sin cambio de codigo en 9.4A).

## LRE-CONCEPT-RULES-01 - Contrato funcional

Conceptos ya no debe interpretar `id_catalogo_lre IS NULL` como error universal.

La regla funcional es:

```txt
Si estrategia_lre = DIRECTO y requiere_exportacion_lre = TRUE, debe existir id_catalogo_lre.
Si estrategia_lre <> DIRECTO, debe existir observacion_normativa_lre y una decision documentada.
```

Conceptos foco:

- `INASISTENCIA`: `DERIVA_DIAS_TRABAJADOS`.
- `ZONA_EXTREMA`: `DESCOMPONER_CONCEPTO`.
- `AFP_EMPLEADOR`: `PENDIENTE_NORMATIVO`.

No se cambian formulas ni calculos automaticos en esta fase.
