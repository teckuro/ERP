# Conceptos de remuneraciÃ³n â€” contrato funcional

Documento **normativo** para el mantenedor de catÃ¡logo y su relaciÃ³n con asignaciones y liquidaciÃ³n. DiagnÃ³stico factual: [`diagnostico-fase-9.md`](./diagnostico-fase-9.md). Principios globales: [`../../orquestador/diseno-operativo-erp.md`](../../orquestador/diseno-operativo-erp.md).

**Decisiones de producto (permisos, LRE, vigencias, baja):** [`decisiones-operativas.md`](./decisiones-operativas.md). Si hubiera contradicciÃ³n no resuelta entre este archivo y aquÃ©l sobre **quiÃ©n puede** o **flujo de baja**, prevalece **`decisiones-operativas.md`** hasta alinear ambos explÃ­citamente.

## 1. DefiniciÃ³n

Un **concepto de remuneraciÃ³n** es una fila del catÃ¡logo maestro `concepto` que describe **quÃ©** se liquida o se asigna (tipo, naturaleza, impacto previsional/tributario, vÃ­nculo opcional a **LRE**), **no** el monto aplicado a una persona ni el resultado de una liquidaciÃ³n cerrada.

- **AsignaciÃ³n recurrente** (`haberdescuento_persona`): instancia por trabajador que **referencia** `id_concepto`.
- **LiquidaciÃ³n** (`liquidacion_detalle`): lÃ­neas que **referencian** `id_concepto`.

## 2. Dominios de datos (contrato)

### 2.1 CatÃ¡logo LRE (`catalogo_lre`)

- Es el **maestro oficial** de cÃ³digos LRE; el concepto enlaza con `id_catalogo_lre` opcional.
- **LRE-CATALOG-01:** `catalogo_lre` se completa via `bd/base/v11/partes/24_lre_catalogo_oficial.sql`; conceptos base mapeados: `GRATIFICACION -> 2106`, `HORAS_EXTRAS -> 2102`, `IMPUESTO_RENTA -> 3161`.
- Criterios de obligatoriedad, cambio de mapeo y estado â€œsin LREâ€: ver [`decisiones-operativas.md`](./decisiones-operativas.md) Â§8. La UI debe permitir **desvincular** LRE (`null`) salvo polÃ­tica futura distinta aprobada por producto.

### 2.2 Concepto (`concepto`)

| Campo / grupo | Regla funcional |
|-----------------|-----------------|
| `codigo` | Ãšnico en BD; **inmutable** tras creaciÃ³n en la UI actual (input readonly en ediciÃ³n). |
| `codigo_motor` | Opcional; identificador para motor / integraciones. |
| `nombre` | Obligatorio; editable. |
| `tipo` | `HABER`, `DESCUENTO`, `APORTE_EMPLEADOR`. Si es `APORTE_EMPLEADOR`, la UI fuerza naturaleza no imponible y flags de imposiciÃ³n en falso (coherente con no asignar manualmente a persona). |
| `naturaleza` | `IMPONIBLE` o `NO_IMPONIBLE` (salvo aporte empleador). |
| Flags base / cotizaciones / lÃ­quido | Editables segÃºn permisos; deben reflejar negocio y, cuando exista LRE vinculado, **no contradecir** de forma silenciosa los metadatos LRE (hoy no hay validaciÃ³n cruzada automÃ¡tica en cliente). |
| `vigente` | Interruptor operativo; distinto de â€œvigencia por fechasâ€ (ver siguiente). |
| `vigencia_inicio` / `vigencia_fin` | Opcionales; si ambas existen, **fin â‰¥ inicio** (validado en UI y servicio). |
| `orden_impresion` | Entero â‰¥ 0; ordena listados e informes. |
| `calculo_automatico` | Si es verdadero: concepto **generado por liquidaciÃ³n**; la UI restringe ediciÃ³n de ese flag y del resto del registro salvo perfil admin (ver Â§4). |
| `es_sistema` | Solo lectura en formulario; fijado en **false** al crear por UI; seeds pueden traer `true`. **No eliminable** desde UI. |
| `formula_json` | Reservado a **motor**; **no** forma parte del contrato de pantalla actual hasta definir editor o migraciones controladas. |

### 2.3 Reglas de cÃ¡lculo (`regla_concepto_calculo`)

- Pertenece al dominio **motor de liquidaciÃ³n**; **fuera de alcance** del mantenedor `/remuneraciones/conceptos` en esta fase.
- Contrato futuro: quiÃ©n crea versiones, cÃ³mo se versiona con `vigencia_inicio`, y polÃ­tica de publicaciÃ³n.

## 3. Reglas de negocio â€” mantenedor

### 3.1 Crear

- Usuario con permiso de **Mantenedor conceptos** (perfil en [`decisiones-operativas.md`](./decisiones-operativas.md) Â§2) puede crear conceptos **no sistema** (`es_sistema = false` en inserciÃ³n), con tipos permitidos segÃºn Â§4 de ese documento.
- CÃ³digo y nombre obligatorios; resto segÃºn defaults del modal.

### 3.2 Editar

- No se puede cambiar `codigo` tras creaciÃ³n (evita romper referencias externas y documentaciÃ³n).
- Concepto **protegido** (`es_sistema` **o** `calculo_automatico`): sin perfil administrador documentado, **no** se abre ediciÃ³n Ãºtil (solo mensaje de advertencia).
- Si el concepto tiene `calculo_automatico` y el usuario **no** es admin, **no** puede cambiar ese flag (validaciÃ³n en `guardarCatalogDialog` + servicio).

### 3.3 Eliminar

- **Prohibido** si `es_sistema`.
- **Prohibido** si existe uso en `liquidacion_detalle` o `haberdescuento_persona` (validaciÃ³n en servicio antes de `DELETE`).
- Mensaje de confirmaciÃ³n en UI debe mantenerse alineado al riesgo (borrado fÃ­sico).

### 3.4 AsignaciÃ³n manual a trabajador (fuera de esta pantalla, pero regla global)

- Criterio completo (incl. `vigente` y vigencias): [`decisiones-operativas.md`](./decisiones-operativas.md) Â§5.
- Hoy el repositorio filtra por tipo `HABER`/`DESCUENTO`, `es_sistema = false` y `calculo_automatico = false`; Fase 9.2 debe alinear con Â§5 (p. ej. `vigente`).
- **APORTE_EMPLEADOR** y conceptos sistema / automÃ¡ticos: **no** asignables manualmente (`HaberesDescuentosService`).

## 4. Perfil administrador (contrato tÃ©cnico pendiente de productizar)

- Constante **`PUEDE_EDITAR_CONCEPTOS_MODO_ADMIN`** en el contenedor: hoy **`false`**.
- **Contrato:** cuando exista rol o claim en JWT (o polÃ­tica de empresa), sustituir por comprobaciÃ³n real y permitir:
  - editar conceptos con `calculo_automatico` o `es_sistema` solo si la polÃ­tica de negocio lo autoriza (matriz a definir con legal/operaciones);
  - nunca eliminar `es_sistema` desde UI sin migraciÃ³n explÃ­cita.

Hasta entonces, el comportamiento vigente es el descrito en Â§3.2â€“3.3.

## 5. UI/UX (alineaciÃ³n `AGENTS` / `ui-form-guidelines`)

- **Cabecera:** breadcrumb + tÃ­tulo + lead (ya presente).
- **Listado:** `app-data-grid` con filtros colapsables segÃºn estÃ¡ndar del proyecto; chips por tipo y por modo manual/automÃ¡tico.
- **Mensajes:** `MessageBox` para Ã©xito, validaciÃ³n, error y confirmaciÃ³n de borrado; textos de negocio, sin detalle tÃ©cnico de motor salvo modo diagnÃ³stico acordado.
- **Empty state:** cuando no hay filas, copy especÃ­fico de catÃ¡logo vacÃ­o.

## 6. Seguridad y despliegue

- El contrato de **producciÃ³n** debe reemplazar RLS permisivo por polÃ­ticas acotadas (rol aplicaciÃ³n, separaciÃ³n anon/authenticated, o `service_role` solo para batch).
- Documentar en despliegue: quiÃ©n puede ejecutar seeds Python que tocan `concepto`.

## 7. Dependencias con otras fases

- **Haberes y descuentos:** las asignaciones deben referenciar conceptos **vigentes** para el uso operativo; reglas finas de â€œvigente en perÃ­odo Xâ€ pueden reforzarse cuando exista **perÃ­odo de liquidaciÃ³n** acoplado en UI.
- **Motor / liquidaciones:** consumen `concepto`, `regla_concepto_calculo` y eventualmente `formula_json`; no avanzar motor productivo sin cerrar gobernanza de conceptos automÃ¡ticos y sistema (ver [`../../orquestador/contexto-proyecto.md`](../../orquestador/contexto-proyecto.md) Â§15).

## 8. Pruebas (definiciÃ³n de listo incremental)

| Nivel | QuÃ© debe cubrir |
|-------|------------------|
| **Unit** | `concepto-asignabilidad.rules`, `concepto-acciones.rules`, `haberes-descuentos.service` (filtro asignable / assert), mapeos desde Supabase, validaciones de payload donde existan. |
| **IntegraciÃ³n / E2E** | Ruta `/remuneraciones/conceptos`: carga de grilla; detalle Â«RevisarÂ»; smoke `tests/conceptos-remuneracion-listado.spec.ts`. |
| **Visual / E2E** | Opcional: captura en `tests/dashboard.spec.ts` cuando se estabilicen datos de entorno. |

## 9. Fase 9.2A â€” Listado base (catÃ¡logo)

**Objetivo:** dejar **visible y filtrable** el catÃ¡logo maestro sin completar CRUD avanzado, sin RLS/JWT productivos ni UI de `regla_concepto_calculo`.

**ImplementaciÃ³n (cÃ³digo):**

- Contenedor: `src/app/features/haberes-descuentos/containers/conceptos-remuneracion-container/`.
- Regla **asignable** (alineada a [`decisiones-operativas.md`](./decisiones-operativas.md) Â§5): `src/app/features/haberes-descuentos/rules/concepto-asignabilidad.rules.ts` (`esConceptoAsignable`, `clasificarVigenciaConcepto`).
- **Columnas:** Nombre, CÃ³digo, Tipo, LRE (texto cÃ³digo Â· nombre o Â«LRE no asignadoÂ»), Vigencia (chip segÃºn perÃ­odo respecto a **hoy**: vigente / sin fechas / futuro / vencido / no vigente catÃ¡logo), Origen (Sistema / Protegido / Usuario), CÃ¡lculo (AutomÃ¡tico / Manual), Asignable (SÃ­/No), Acciones (Revisar resumen, Editar, Eliminar segÃºn reglas existentes).
- **Filtros:** bÃºsqueda nombre/cÃ³digo/LRE; tipo; vigencia (perÃ­odo); asignable; origen sistema/usuario; LRE con/sin. Panel colapsable para no saturar cabecera.
- **VacÃ­os:** mensajes explÃ­citos sin nombres de tablas cuando no hay datos o no hay coincidencias con filtros.
- **QuÃ© no entra en 9.2A:** CRUD completo nuevo, permisos reales JWT, RLS definitiva, eliminaciÃ³n como flujo principal (sigue excepcional), asignaciÃ³n a trabajadores, motor.

## 10. Fase 9.2B â€” Detalle, trazabilidad y blindaje

**Objetivo:** que el usuario **entienda** cada concepto (asignable o no, vigencia, LRE, protecciÃ³n) y vea **quÃ© acciones** estÃ¡n permitidas antes de actuar; sin completar CRUD nuevo ni RLS/JWT.

**ImplementaciÃ³n (cÃ³digo):**

- Modal de **detalle** (solo lectura) al usar Â«RevisarÂ»: identificaciÃ³n, clasificaciÃ³n operativa, vigencia (incl. estado **invÃ¡lido** si fechas incoherentes), resumen de asignabilidad con **motivos** si no aplica, y lista de acciones permitidas/bloqueadas.
- `src/app/features/haberes-descuentos/rules/concepto-acciones.rules.ts`: `evaluarConceptoAccionesPermitidas`, `tituloAccionConcepto` (alta deshabilitada en UI, eliminaciÃ³n desde listado deshabilitada en esta fase; ediciÃ³n solo si no protegido o con modo admin).
- `concepto-asignabilidad.rules.ts`: `motivosNoAsignableConcepto`, `resumenAsignabilidadConcepto`, vigencia `INVALIDO`.
- Listado: tooltips en editar/eliminar segÃºn bloqueos; botÃ³n alta oculto (`primaryActionLabel` vacÃ­o); eliminar deshabilitado.

## 11. Fase 9.2C â€” Haberes: asignables alineados a regla central

**Objetivo:** que **Haberes y descuentos** no permita asignar un concepto que en **Conceptos** figura como no asignable (`esConceptoAsignable` + fecha de referencia **hoy**, misma regla que el listado del catÃ¡logo).

**ImplementaciÃ³n (cÃ³digo):**

- `HaberesDescuentosService.listarConceptos()` filtra sobre `listarConceptosMantenimiento()` con `esConceptoAsignable`; se eliminÃ³ el listado SQL parcial del repositorio.
- `assertConceptoPermiteAsignacionManual` reutiliza la misma regla y mensajes vÃ­a `motivosNoAsignableConcepto`.
- UI mÃ­nima: texto de ayuda en cabecera Haberes; al editar, si el concepto ya no es asignable, aparece una opciÃ³n de solo lectura en el selector para no perder contexto.

**Pendiente posterior:** `APORTE_EMPLEADOR` solo Admin; auditorÃ­a; JWT/RLS.

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

