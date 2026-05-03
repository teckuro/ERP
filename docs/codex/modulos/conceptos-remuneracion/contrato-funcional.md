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
| **Unit** | `validarPayloadConcepto`, mapeos desde Supabase, `assertConceptoPermiteAsignacionManual` (donde aplique). |
| **Integración / E2E** | Ruta `/remuneraciones/conceptos`: carga de grilla (mock o Supabase test), crear concepto mínimo, intento de borrar concepto en uso (error esperado). |
| **Visual** | Añadir `{ path: '/remuneraciones/conceptos', name: 'remuneraciones-conceptos' }` al array de `tests/dashboard.spec.ts` cuando se estabilicen datos de entorno. |

## 9. Fase 9.2A — Listado base (catálogo)

**Objetivo:** dejar **visible y filtrable** el catálogo maestro sin completar CRUD avanzado, sin RLS/JWT productivos ni UI de `regla_concepto_calculo`.

**Implementación (código):**

- Contenedor: `src/app/features/haberes-descuentos/containers/conceptos-remuneracion-container/`.
- Regla **asignable** (alineada a [`decisiones-operativas.md`](./decisiones-operativas.md) §5): `src/app/features/haberes-descuentos/rules/concepto-asignabilidad.rules.ts` (`esConceptoAsignable`, `clasificarVigenciaConcepto`).
- **Columnas:** Nombre, Código, Tipo, LRE (texto código · nombre o «LRE no asignado»), Vigencia (chip según período respecto a **hoy**: vigente / sin fechas / futuro / vencido / no vigente catálogo), Origen (Sistema / Protegido / Usuario), Cálculo (Automático / Manual), Asignable (Sí/No), Acciones (Revisar resumen, Editar, Eliminar según reglas existentes).
- **Filtros:** búsqueda nombre/código/LRE; tipo; vigencia (período); asignable; origen sistema/usuario; LRE con/sin. Panel colapsable para no saturar cabecera.
- **Vacíos:** mensajes explícitos sin nombres de tablas cuando no hay datos o no hay coincidencias con filtros.
- **Qué no entra en 9.2A:** CRUD completo nuevo, permisos reales JWT, RLS definitiva, eliminación como flujo principal (sigue excepcional), asignación a trabajadores, motor.

**Pendiente 9.2B (orientativo):** alinear modal/servicio con tipo `APORTE_EMPLEADOR` solo Admin; reforzar listado asignable en repositorio Haberes; E2E visual estable; auditoría.

## 10. Documentos hermanos

- [`contrato-general.md`](./contrato-general.md) — resumen y enlaces.
- [`../haberes-descuentos/contrato-general.md`](../haberes-descuentos/contrato-general.md) — límites del módulo asignaciones (no duplicar definición de concepto).
