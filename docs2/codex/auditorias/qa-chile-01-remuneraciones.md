# QA-CHILE-01 - Auditoria funcional de remuneraciones chilenas

Fecha auditoria: 2026-05-03. Alcance: lectura de `docs/codex`, rutas Angular relevantes y reglas/servicios bajo `src/app/features/*` y `src/app/pages/*` relacionados a remuneraciones. **No** se altero codigo de negocio, SQL, Python, Supabase remoto, ni se ejecutaron migraciones. **No** se ejecutaron tests automatizados (fase documental de auditoria).

---

## 1. Resumen ejecutivo

El repositorio **separa bien en documentacion y en gran parte en codigo** el rol del catalogo `concepto`, las asignaciones recurrentes (Haberes y descuentos) y los movimientos variables mensuales (`YYYY-MM`). La regla central `esConceptoAsignable` bloquea `APORTE_EMPLEADOR`, tipos distintos de `HABER`/`DESCUENTO`, conceptos sistema, automaticos y vigencias no operativas para **asignacion recurrente**.

Riesgos **antes de un motor chileno productivo**: (1) politicas **RLS/JWT** todavia no alineadas a produccion segun documentacion de Conceptos; (2) ~~`MovimientosVariablesService.crear` omitia snapshot de concepto~~ **mitigado CHILE-FIX-01**; (3) ~~sin validacion aptitud/contrato~~ **mitigado CHILE-FIX-01**; (4) ~~Proceso mensual con cifras normativas demo~~ **mitigado PARAM-CHILE-01** (UI neutra; parametros en `/parametros`); (5) **Liquidaciones** y **Previred/LRE** siguen **placeholder** sin contrato de snapshot en UI.

Siguiente fase recomendada: **9.5A** (proceso mensual con prevalidaciones y lectura real de parametros) y cierre de brechas de seguridad Conceptos; **PARAM-CHILE-01** y **CHILE-FIX-01** quedaron aplicados (secciones 17-18 y docs de modulo).

---

## 2. Alcance revisado

| Area | Profundidad |
|------|-------------|
| Orquestador (`contexto-proyecto`, `estado-fases`, `diseno-operativo-erp`, `mapa-documentacion`) | Lectura |
| Conceptos (README, `contrato-funcional`, `decisiones-operativas`, reglas asignabilidad) | Lectura + muestreo codigo |
| Haberes recurrentes (README, `contrato-general`, servicio/repositorio muestreado) | Lectura + muestreo codigo |
| Movimientos variables (README, contrato, decisiones, modelo 9.4B, persistencia 9.4C, service 9.4D, ui 9.4E, reglas TS) | Lectura + muestreo codigo |
| Empleados (README, contrato aptitud/validacion - muestreo) | Lectura parcial |
| Parametros (`periodo-vigencia-catalogo` muestreado, rutas parametros) | Lectura |
| Nomina mensual (`nomina-mensual/README`, `vision-futura`) | Lectura |
| Liquidaciones (`liquidaciones.page.ts` muestreado) | Muestreo UI |
| Proceso mensual (`proceso-remuneraciones.page.ts`) | Muestreo UI |
| BD v11 README | No lectura completa del monolito SQL |
| Python parametros | Solo referencias en documentacion |

---

## 3. Fuentes consultadas

- Repositorio: `docs/codex/**`, `src/app/features/haberes-descuentos/rules/concepto-asignabilidad.rules.ts`, `src/app/features/movimientos-variables/rules/movimiento-variable-validacion.rules.ts`, `src/app/features/movimientos-variables/services/movimientos-variables.service.ts`, `src/app/pages/proceso-remuneraciones.page.ts`, `src/app/pages/liquidaciones.page.ts`, contenedor movimientos variables (sin `Repository` inyectado).
- Fuentes externas del brief (DT, SII, Previred, etc.): **no** verificadas online en esta corrida; no se copiaron textos normativos.

---

## 4. Matriz de hallazgos

Resumen por severidad (IDs en secciones 5-8):

| Severidad | Cantidad |
|-----------|----------|
| CRITICO | 1 |
| ALTO | 5 |
| MEDIO | 4 |
| BAJO | 3 |

---

## 5. Hallazgos criticos

ID: QA-CHILE-01-CRIT-001  
Severidad: CRITICO  
Modulo: Conceptos / infra datos  
Archivo(s): `docs/codex/modulos/conceptos-remuneracion/decisiones-operativas.md` (seccion permisos RLS), `diagnostico-fase-9.md` referenciado alli  
Descripcion: Para **produccion Chile**, politicas RLS permisivas y ausencia de modelo JWT/roles acordado exponen riesgo de integridad y confidencialidad sobre catalogo y datos sensibles de remuneraciones.  
Evidencia: Documento de decisiones indica politicas permisivas **inaceptables en produccion** y trabajo pendiente en Fase 9.2.  
Riesgo Chile: Alteracion o lectura no autorizada de conceptos y datos ligados a cotizaciones y remuneraciones.  
Regla esperada: RLS y autenticacion acotadas a perfiles operativos antes de go-live.  
Accion sugerida: Cerrar fase de seguridad de datos (RLS + JWT) con pruebas.  
Fase sugerida: Conceptos 9.2 / infra seguridad.

---

## 6. Hallazgos altos

ID: QA-CHILE-01-ALTO-001  
Severidad: ALTO  
Modulo: Movimientos variables  
Archivo(s): `src/app/features/movimientos-variables/rules/movimiento-variable-validacion.rules.ts` (`concepto != null` ramifica validacion tipo), `src/app/features/movimientos-variables/services/movimientos-variables.service.ts` (`crear` usa `payload.concepto ?? null`)  
Descripcion: Si el llamador **omite** `concepto` en el payload, **no** se valida que el concepto sea `HABER`/`DESCUENTO`, ni bloqueo de `calculoAutomatico` / `esSistema` / tipo aporte en reglas puras.  
Evidencia: Comentario en reglas: validacion de catalogo condicionada al snapshot; service no exige snapshot.  
Riesgo Chile: Ingreso manual de lineas no previstas (p. ej. tipo no haber/descuento) si existe otro cliente o llamada futura sin UI.  
Regla esperada: Toda creacion debe validar concepto contra catalogo o exigir snapshot no opcional en capa service.  
Accion sugerida: Hacer obligatorio `concepto` en `crear` o resolver tipo desde repositorio de conceptos antes de validar.  
Fase sugerida: CHILE-FIX-01 / 9.4x hardening.

Mitigacion (2026-05-04, CHILE-FIX-01): `MovimientosVariablesService` llama a `HaberesDescuentosService.resolverSnapshotConceptoParaMovimientoVariableManual` antes de `validarMovimientoVariableInput`; el payload `concepto` no gobierna candados. Informe tecnico: [`../modulos/movimientos-variables/hardening-chile-fix-01.md`](../modulos/movimientos-variables/hardening-chile-fix-01.md).

ID: QA-CHILE-01-ALTO-002  
Severidad: ALTO  
Modulo: Movimientos variables + Empleados  
Archivo(s): `src/app/features/movimientos-variables/services/movimientos-variables.service.ts` (sin grep de apto), `docs/codex/modulos/movimientos-variables/contrato-general.md` (regla futura trabajador apto)  
Descripcion: Alta de movimiento variable **no** verifica `apto_para_remuneraciones`, estado persona, ni contrato vigente.  
Evidencia: Service solo valida ids y reglas 9.4B sobre input; contrato documental menciona regla futura de aptitud.  
Riesgo Chile: Lineas variables para trabajadores no aptos o fuera de relacion vigente.  
Regla esperada: Alineacion con proceso mensual: solo trabajadores elegibles por reglas de negocio.  
Accion sugerida: Anadir validacion opcional tras definicion de producto o bloquear en UI hasta tener helper compartido.  
Fase sugerida: 9.5A prevalidaciones o CHILE-FIX-01.

Mitigacion (2026-05-04, CHILE-FIX-01): `crear` y `actualizar` llaman a `EmpleadosService.obtenerPorId` y exigen apto, activo y `vigenciaIntersecaMes` entre `formValue.contrato` y el periodo. Detalle: [`../modulos/movimientos-variables/hardening-chile-fix-01.md`](../modulos/movimientos-variables/hardening-chile-fix-01.md).

ID: QA-CHILE-01-ALTO-003  
Severidad: ALTO  
Modulo: Conceptos + Movimientos variables  
Archivo(s): `docs/codex/modulos/movimientos-variables/decisiones-operativas.md` seccion 6  
Descripcion: Pendiente producto: flag **solo variable / solo recurrente / ambos** en catalogo; hoy la UI variable usa `listarConceptos` alineado a asignabilidad recurrente, pero **no** existe distincion explicita en datos.  
Evidencia: Texto "Pendiente producto" en decisiones.  
Riesgo Chile: Deuda funcional para separar cargas puntuales vs recurrentes cuando el catalogo crezca.  
Regla esperada: Catalogo gobierna donde puede aplicarse cada concepto.  
Accion sugerida: Modelar flag y reglas; actualizar listados.  
Fase sugerida: Conceptos hardening + CHILE-FIX-01.

ID: QA-CHILE-01-ALTO-004  
Severidad: ALTO  
Modulo: Proceso mensual (UI placeholder)  
Archivo(s): `src/app/pages/proceso-remuneraciones.page.ts` (lineas con UF y sueldo minimo literales en template)  
Descripcion: La pantalla muestra **valores normativos de ejemplo** como si fueran hallazgos del periodo (UF, sueldo minimo, tabla 2026 en copy).  
Evidencia: Grep sobre archivo; strings numericos literales en UI.  
Riesgo Chile: Operador asume datos oficiales cargados; decisiones de cotizacion/impuesto podrian basarse en demo.  
Regla esperada: Parametros reales desde BD/Python o estado "demo" explicito sin cifras normativas falsas.  
Accion sugerida: Sustituir por datos de `Parametros` o texto neutro sin cifras hasta integracion.  
Fase sugerida: 9.5A o UX cleanup.

Mitigacion (2026-05-03, PARAM-CHILE-01): se retiraron cifras y textos demo normativos de la pagina; aviso de no calculo y enlace a `/parametros`. Informe: [`param-chile-01-parametros-y-demo-proceso.md`](./param-chile-01-parametros-y-demo-proceso.md). La integracion lectura parametros en proceso queda para 9.5A.

ID: QA-CHILE-01-ALTO-005  
Severidad: ALTO  
Modulo: Liquidaciones (UI)  
Archivo(s): `src/app/pages/liquidaciones.page.ts` (estructura demo)  
Descripcion: Liquidaciones es **mock** de listado/tarjetas; **no** hay modelo documentado en codigo de snapshot inmutable, totales imponibles, cotizaciones, ni bloqueo de edicion.  
Evidencia: Lectura inicial del componente: patron placeholder.  
Riesgo Chile: Expectativa de producto cerrado sin trazabilidad legal.  
Regla esperada: Liquidacion = resultado congelado + snapshots + sin edicion libre.  
Accion sugerida: Sustituir por empty state honesto o documentar "no productivo" en UI.  
Fase sugerida: Fase liquidaciones futura.

---

## 7. Hallazgos medios

ID: QA-CHILE-01-MED-001  
Severidad: MEDIO  
Modulo: Documentacion movimientos variables  
Archivo(s): `docs/codex/modulos/movimientos-variables/decisiones-operativas.md` seccion 7 (ruta "planificada") vs `ui-9-4E.md` y rutas reales  
Descripcion: Deriva documental post-9.4E: texto aun habla de ruta planificada sin actualizar estado.  
Evidencia: Comparacion lectura.  
Riesgo Chile: Bajo impacto normativo; confunde implementadores.  
Accion sugerida: Editar parrafo a "implementada" con enlace a ui-9-4E.  
Fase sugerida: Doc cleanup.

ID: QA-CHILE-01-MED-002  
Severidad: MEDIO  
Modulo: Nomina mensual  
Archivo(s): `docs/codex/modulos/nomina-mensual/README.md`, `vision-futura.md`  
Descripcion: Vision y checklist a alto nivel; **no** hay `contrato-general.md` del modulo nomina en carpeta.  
Evidencia: Listado de archivos modulo.  
Riesgo Chile: Brecha de trazabilidad entre vision y requisitos cerrados para proceso chileno.  
Accion sugerida: Crear contrato funcional de proceso mensual (ASCII) cuando se abra fase.  
Fase sugerida: Opcion B 9.5A.

ID: QA-CHILE-01-MED-003  
Severidad: MEDIO  
Modulo: Previred / LRE  
Archivo(s): Documentacion orquestador + modulos (sin implementacion)  
Descripcion: Salidas legales reconocidas como futuras; **no** hay verificacion de formato SII/DT en repo en esta auditoria.  
Evidencia: Contratos dicen "fases posteriores".  
Riesgo Chile: Deuda esperada; riesgo si se promete fecha sin diseno.  
Accion sugerida: Mantener fuera de alcance hasta motor estable.  
Fase sugerida: Roadmap post motor.

ID: QA-CHILE-01-MED-004  
Severidad: MEDIO  
Modulo: Parametros  
Archivo(s): `docs/codex/modulos/parametros/periodo-vigencia-catalogo.md`  
Descripcion: Modelo de datos y Python **documentados** para UF, topes, impuesto unico, etc.; riesgo residual es **cumplimiento operativo** (carga mensual parcial) ya descrito en doc.  
Evidencia: Tabla de diagnostico en documento.  
Riesgo Chile: Proceso con `parcial` sin snapshots mensuales.  
Accion sugerida: UI proceso mensual debe enlazar bloqueos a estado `parametros_generales` real (futuro).  
Fase sugerida: 9.5A.

---

## 8. Hallazgos bajos

ID: QA-CHILE-01-BAJ-001  
Severidad: BAJO  
Modulo: Docs cruzados  
Descripcion: URLs normativas en brief QA no fueron re-validadas hoy (posible desactualizacion).  
Accion sugerida: Revisar enlaces al abrir fase legal.  
Fase sugerida: PARAM-CHILE-01.

ID: QA-CHILE-01-BAJ-002  
Severidad: BAJO  
Modulo: Menu / copy  
Descripcion: Titulos mezclan "Proceso de Cierre Mensual" vs dominio "Remuneraciones" en distintas pantallas; coherencia mejorable.  
Fase sugerida: UX copy.

ID: QA-CHILE-01-BAJ-003  
Severidad: BAJO  
Modulo: Auditorias  
Descripcion: Primera auditoria en carpeta `auditorias/`; patron de IDs y severidad a mantener en siguientes QA.  
Fase sugerida: N/A.

---

## 9. Modulos revisados

- `empleados` (contrato y fases en orquestador; no auditoria profunda de cada seccion de ficha).
- `parametros` (documento vigencia/catalogo; no todas las tabs UI).
- `conceptos-remuneracion` (decisiones + reglas asignabilidad).
- `haberes-descuentos` (contrato + reglas asignables).
- `movimientos-variables` (contrato, decisiones, reglas, service, UI 9.4E, sin repository en contenedor).
- `nomina-mensual` (solo vision).
- `liquidaciones` (pagina demo).
- `proceso-remuneraciones` (pagina demo con literales).

---

## 10. Checklist Chile

Referencias: cumplido **C**, parcial **P**, no **N**, no aplica aun **NA**.

### Conceptos

| Item | Estado | Nota |
|------|--------|------|
| Existe tipo de concepto | C | `ConceptoMantenimientoFila.tipo` |
| HABER / DESCUENTO / APORTE_EMPLEADOR | C | Modelo TS + reglas |
| Sistema / usuario | C | `esSistema` |
| Automatico / manual | C | `calculoAutomatico` |
| Vigente / vigencia | C | Reglas vigencia concepto |
| LRE o marca | C | Campos LRE en modelo |
| Imponible / tributable | C | Banderas en modelo |
| APORTE no asignable manual recurrente | C | `esConceptoAsignable` |
| Automaticos no asignables recurrentes | C | misma regla |
| Trazabilidad motivos no asignable | C | `motivosNoAsignableConcepto` |

### Haberes recurrentes

| Item | Estado | Nota |
|------|--------|------|
| Requiere trabajador | C | UI + servicio |
| Concepto asignable | C | `listarConceptos` + reglas |
| Vigencia + duplicados + solape | C | Fase 9.3 documentada + codigo vigencia |
| Cierre sin delete fisico | C | Contrato haberes |
| Historial + filtros | C | UI DataGrid |
| No reemplaza variables | C | Docs + hint UI |
| No calcula liquidacion | C | Sin motor |

### Movimientos variables

| Item | Estado | Nota |
|------|--------|------|
| Periodo YYYY-MM | C | Reglas + UI month input |
| Trabajador + concepto + monto | C | |
| Estado + origen | C | Modelo + UI manual |
| Duplicados operativos | C | Reglas + repo parcial SQL |
| ANULADO fuera de proceso futuro | C | Docs decisiones |
| Sin delete fisico normal | C | Anulacion logica |
| UI usa service | C | Sin `Repository` en contenedor |
| No calcula liquidacion / Previred / LRE | C | |
| Valida siempre tipo concepto en service | N | Ver ALTO-001 |

### Parametros

| Item | Estado | Nota |
|------|--------|------|
| Periodo activo | C | `PeriodoActivoService` |
| UF/UTM/topes/sueldo minimo en modelo datos | C | Doc + BD v11 referenciados |
| No hardcode en UI productiva Parametros | P | Proceso mensual page viola espiritu (ALTO-004) |

### Empleados

| Item | Estado | Nota |
|------|--------|------|
| Estado + contrato + aptitud + validacion remuneraciones | C | Modulo empleados |
| Enlace con variables | N | ALTO-002 |

### Proceso mensual futuro

| Item | Estado | Nota |
|------|--------|------|
| Documentado en vision | P | `vision-futura.md` |
| Implementado productivo | N | Placeholder UI |

### Liquidacion futura

| Item | Estado | Nota |
|------|--------|------|
| Documentado contrato snapshot | P | Orquestador alto nivel |
| UI acorde | N | Demo |

### Previred / LRE

| Item | Estado | Nota |
|------|--------|------|
| Reconocido como salida futura | C | Docs |
| Implementacion | N | NA hoy |

---

## 11. Casos de prueba conceptuales

Resultado esperado **PASS** si el sistema cumple regla; **FAIL** si no.

| Caso | Resultado | Evidencia breve |
|------|-------------|-----------------|
| Variable valido HABER manual + snapshot | PASS | UI pasa snapshot; reglas con `concepto` |
| Variable sin periodo | PASS | Mensaje formato (service) |
| Variable APORTE_EMPLEADOR con snapshot | PASS | Motivo tipo |
| Variable concepto automatico con snapshot | PASS | Motivo automatico |
| Recurrente duplicado solapado | PASS | Reglas vigencia HD |
| Recurrente cerrado conserva historial | PASS | Contrato cierre |
| Variable ANULADO no bloquea duplicado v1 | PASS | Reglas duplicado |
| Trabajador no apto -> bloqueo variable | FAIL hoy | ALTO-002 |
| Parametro faltante bloquea calculo | NA | Sin motor |
| Concepto sin imponible/tributable en motor | NA | Motor ausente; riesgo documentado |

---

## 12. Brechas de datos

- Falta **flag** catalogo recurrente vs variable (ALTO-003).
- **RLS** productiva pendiente para integridad en datos sensibles (CRIT-001).
- Proceso mensual **sin** filas oficiales de estado de periodo en UI real (solo placeholder).

---

## 13. Brechas de proceso

- No hay **pipeline** cerrado empleados aptos -> parametros completos -> recurrentes -> variables validados -> calculo.
- **Carga mensual** oficial vs UI demo no conectadas en proceso mensual.
- **Liquidacion** sin pasos de aprobacion/cierre ni bloqueo de edicion.

---

## 14. Brechas normativas

- Sin motor **no** se puede afirmar cumplimiento SII tablas impuesto unico, DT Art 58 topes descuentos, ni cotizaciones AFP/AFC/SIS en runtime.
- **LRE/Previred**: sin generacion de archivos, sin trazabilidad a lineas calculadas.

---

## 15. Recomendaciones por fase

1. ~~**CHILE-FIX-01**~~ **Hecho (2026-05-04):** ver seccion 17 y [`../modulos/movimientos-variables/hardening-chile-fix-01.md`](../modulos/movimientos-variables/hardening-chile-fix-01.md).
2. ~~**PARAM-CHILE-01** (demo proceso)~~ **Hecho (2026-05-03):** ver seccion 18 y [`param-chile-01-parametros-y-demo-proceso.md`](./param-chile-01-parametros-y-demo-proceso.md). Pendiente aparte: auditoria Python vs UI Parametros si se prioriza.
3. **9.5A**: Contrato proceso mensual chileno + prevalidaciones (periodo cerrado, aptos, parametros completos, variables VALIDADO).
4. **9.2 / infra**: RLS + JWT segun `decisiones-operativas` Conceptos.
5. **Liquidaciones**: Diseno snapshot + inmutabilidad antes de UI productiva.

---

## 16. Siguiente fase sugerida

**CHILE-FIX-01**, **PARAM-CHILE-01** y **9.5A** (prevalidaciones proceso mensual) quedaron aplicados en alcance acordado; priorizar **9.5B** / motor / **9.2** RLS-JWT en Conceptos segun roadmap.

---

## 17. Seguimiento CHILE-FIX-01

Estado: **cerrado** en alcance acordado (Angular **solo**; sin motor, liquidaciones, SQL destructivo, RLS/JWT, Previred/LRE, rediseno visual).

Entregable documental: [`../modulos/movimientos-variables/hardening-chile-fix-01.md`](../modulos/movimientos-variables/hardening-chile-fix-01.md).

Cierre QA:

- **ALTO-001:** resuelto en servicio (catalogo + misma regla `esConceptoAsignable` que recurrentes en el primer dia del mes del periodo).
- **ALTO-002:** resuelto en servicio (`aptoParaRemuneraciones`, `estado === activo`, `vigenciaIntersecaMes` con `formValue.contrato`).

Pruebas ejecutadas post-cambio: `npm test -- --watch=false` (incluye `haberes-descuentos.service.spec.ts`, `movimientos-variables.service.spec.ts`).

Tablero: [`../orquestador/estado-fases.md`](../orquestador/estado-fases.md) seccion CHILE-FIX-01.

---

## 18. Seguimiento PARAM-CHILE-01

- ALTO-004: **Cerrado** en alcance UI/copy, trazabilidad documental y arquitectura v4 (wrapper + `proceso-mensual-container`; sin motor ni lectura automatica de parametros en proceso).
- Fecha: 2026-05-03 (demo); 2026-05-04 (brief v4 / `frontend-interfaces`).
- Evidencia: [`param-chile-01-parametros-y-demo-proceso.md`](./param-chile-01-parametros-y-demo-proceso.md), `proceso-remuneraciones.page.ts`, `features/nomina-mensual/containers/proceso-mensual-container/`.
- Fase: PARAM-CHILE-01 cerrada; **9.5A** cerro prevalidaciones con lectura real vía servicios (sin motor).

---

## 19. Seguimiento fase 9.5A (proceso mensual)

- Estado: **cerrado** en alcance acordado (prevalidaciones; sin motor, liquidaciones, Previred/LRE generados).
- Entregables: [`../modulos/nomina-mensual/contrato-general.md`](../modulos/nomina-mensual/contrato-general.md), [`../modulos/nomina-mensual/prevalidaciones-9-5A.md`](../modulos/nomina-mensual/prevalidaciones-9-5A.md).
- Codigo: `ProcesoMensualService`, `proceso-mensual-prevalidacion.rules.ts`, `proceso-mensual-container` (selector periodo + Validar periodo).
- Pendiente explicito: haberes recurrentes agregados por periodo (integracion futura); motor; liquidaciones snapshot.

---

## Anexo - Conteo hallazgos

- CRITICO: 1  
- ALTO: 5  
- MEDIO: 4  
- BAJO: 3  

---

## Confirmacion metodologica

- Codigo funcional: **no tocado**  
- SQL / Supabase remoto / Python: **no tocados**  
- Tests: **no ejecutados** (auditoria lectura)  
- Bloques nuevos en este archivo: **ASCII** (sin enies, sin acentos agudos en palabras clave; guion normal `-`)
