# Módulo Nómina mensual — punto de entrada

## Estado

## NOM-MENSUAL-PERSISTENCIA-ESTADO-01 aplicado

Borrador al generar nómina persiste trabajadores, issues y metadata de verificación; rehidratación al recargar alimenta workspace y revisión completa. Documento: [`nom-mensual-persistencia-estado-01.md`](./nom-mensual-persistencia-estado-01.md).

## NOM-FLOW-REVISION-01 aplicado

Flujo RRHH: «Verificar período» antes de «Generar nómina»; bitácora en sidebar; guardado técnico del borrador en acciones `<details>`; diagnóstico persistido en BD. Documentos: [`nom-workspace-loc-maquetacion-01.md`](./nom-workspace-loc-maquetacion-01.md), [`nom-periodo-diagnostico-persist-01.md`](./nom-periodo-diagnostico-persist-01.md).

## NOM-WORKSPACE-LOC-MAQUETACION-01 aplicado

Consola con **sidebar operativo** (franja KPI, bitácora, revisión, guía) y **6 tabs** en panel derecho (sin tab Resumen). Orden único Param → Trab → Mov → Rec. Documento: [`nom-workspace-loc-maquetacion-01.md`](./nom-workspace-loc-maquetacion-01.md).

## NOM-PREVALIDACION-PARAMETROS-CTA-01 aplicado

Fix rules: CTA «Revisar parámetros» solo si `!parametrosOperativos`; prioridad a trabajadores cuando el período ya está operativo. Sin BD ni localStorage.

## NOM-PERIODO-VERIFICAR-MODAL-02 aplicado

Modal automático tras verificar el período (MessageBox): críticos, advertencias o período listo con CTA «Generar nómina». Documento: [`nom-periodo-diagnostico-persist-01.md`](./nom-periodo-diagnostico-persist-01.md).

## NOM-PERIODO-DIAGNOSTICO-PERSIST-01 aplicado

Verificación del período con diagnóstico **persistente en servidor** (`nomina_periodo_diagnostico` + RPC); rehidratación al volver sin snapshot. Documento: [`nom-periodo-diagnostico-persist-01.md`](./nom-periodo-diagnostico-persist-01.md).

## NOM-MENSUAL-MASIVO-LAYOUT-01 aplicado

Tab `Trabajadores` del modal de revision preparado para nomina masiva: resumen agregado, filtros compactos, busqueda, DataGrid paginado y detalle unico bajo demanda. Mantiene `incidenciasPeriodo()` como fuente unica; las incidencias globales permanecen en Resumen y no se duplican por trabajador. Documento: [`nom-mensual-masivo-layout-01.md`](./nom-mensual-masivo-layout-01.md).

## Handoff Figma — maquetación nómina mensual

Documento para recrear la consola en Figma (tokens, medidas, estados, modal): [`nomina-mensual-figma-maquetacion.md`](./nomina-mensual-figma-maquetacion.md).

## NOM-MENSUAL-REAPERTURA-ELIMINACION-01 aplicado

Acciones controladas para abrir o descartar la nómina generada cuando no hay liquidaciones; bloqueo RRHH con copy claro si hay liquidaciones; forzar apertura/eliminación solo admin en ambiente no productivo. Documento: [`nom-mensual-reapertura-eliminacion-01.md`](./nom-mensual-reapertura-eliminacion-01.md).

## NOM-MODALES-PERIODO-REVISION-COPY-03 aplicado

Modal de revision con copy RRHH: claves tecnicas humanizadas antes del DOM visible, resumen coherente con bloqueos globales, parametros con accion agrupada y lectura operativa de movimientos/recurrentes. Documento: [`nom-modales-periodo-revision-copy-03.md`](./nom-modales-periodo-revision-copy-03.md).

## NOM-MODALES-PERIODO-COPY-LIMPIO-05 aplicado

Modal de revisión con copy normalizado en rules (`limpiarCopyTecnicoNomina`): sin claves técnicas, snake_case ni `;` accidentales en listas visibles; `humanizarDetalleRevisionTexto` delega al helper único. Documento: [`nom-modales-periodo-copy-limpio-05.md`](./nom-modales-periodo-copy-limpio-05.md).

## NOM-MODALES-PERIODO-INCIDENCIAS-QA-05 aplicado

Candado QA post-INCIDENCIAS-04: tests de regresión en rules/component (dedupe, indicadores, expediente, seguimiento, orden severidad, copy) y checklist manual del modal en doc de fase. Documento: [`nom-modales-periodo-revision-incidencias-qa-05.md`](./nom-modales-periodo-revision-incidencias-qa-05.md).

## NOM-MODALES-PERIODO-INCIDENCIAS-04 aplicado

Modal de revision con registro unico de incidencias: `buildIncidenciasPeriodo`, Resumen «Pendientes del periodo», tabs con enlace «Ver en resumen (N)» sin repetir listas paralelas; conteos desde fuente deduplicada. Documento: [`nom-modales-periodo-revision-incidencias-04.md`](./nom-modales-periodo-revision-incidencias-04.md).

## NOM-MODALES-PERIODO-REVISION-IA-02 aplicado

Modal de revision reordenado por arquitectura de informacion: expediente oficial y CTA solo en Resumen; observaciones unificadas sin DataGrid; tabs de trabajadores, parametros, movimientos/recurrentes y resultado con lead local, lista, grid o empty segun datos. Documento: [`nom-modales-periodo-revision-ia-02.md`](./nom-modales-periodo-revision-ia-02.md).

## NOM-MODALES-PERIODO-REVISION-UX-01 aplicado

Modal de revisión con pestañas que señalan pendientes, grillas por área (movimientos, recurrentes, resultado, observaciones), CTA del expediente en franja interna y enlace «Ver revisión completa» contextual. Documento: [`nom-modales-periodo-revision-ux-01.md`](./nom-modales-periodo-revision-ux-01.md).

## NOM-MENSUAL-FACADE-SLIM-01 aplicado

Refactor interno del facade de presentación: view models pesados en `rules/` (`resultado-preliminar`, `revision-aprobacion`, `payroll-seguimiento`) y labels en `utils/proceso-mensual-presentacion.labels.ts`. Sin cambio de copy, HTML, CSS ni contratos de store/servicios. Documento: [`nom-mensual-facade-slim-01.md`](./nom-mensual-facade-slim-01.md).

## NOM-MENSUAL-INTEGRIDAD-REGISTRO-01 aplicado

Expediente del período consultable desde BD: view model `expedienteNominaPeriodo`, carga al abrir revisión, modal y tab Detalle con estados explícitos (cargando / error / sin detalle / versión guardada o confirmada). Sin cambio SQL en esta fase. Documento: [`nom-mensual-integridad-registro-01.md`](./nom-mensual-integridad-registro-01.md).

## NOM-MODALES-PERIODO-DETALLE-POLISH-01 aplicado

Modal de revisión (`app-proceso-mensual-detalle-modal`): footer sin duplicar CTA del workspace, copy operativo, CSS local y sin bloque técnico visible. Documento: [`nom-modales-periodo-detalle-polish-01.md`](./nom-modales-periodo-detalle-polish-01.md).

## NOM-CONTAINER-SPEC-REPARO aplicado

Specs de integración del contenedor alineados al shell modular (workspace + overlays): sin `describe.skip` legacy; helpers `proceso-mensual-container.spec.helpers.ts`; cobertura equivalente vía rules existentes + ~31 tests container. Documento: [`nom-mensual-container-spec-reparo-01.md`](./nom-mensual-container-spec-reparo-01.md).

## NOM-MENSUAL-PERSISTENCIA-ESTADO-01 aplicado

Al entrar o cambiar de periodo, si existe version revisable activa en BD, el store rehidrata cabecera y detalle sin vaciar el snapshot antes del fetch; la facade infiere prevalidacion, base y calculo desde el snapshot para bitacora, franja y estado operativo. Sin guardar version revisable, la pantalla sigue en «Generar nomina». Documento: [`nom-mensual-persistencia-estado-01.md`](./nom-mensual-persistencia-estado-01.md).

## NOM-MENSUAL-WORKSPACE-UI-01 aplicado

La pantalla principal se orienta como **Nomina mensual** y workspace operativo de RRHH. El flujo visible prioriza:

```txt
Generar nomina
-> Revisar trabajadores
-> Confirmar nomina
-> Generar liquidaciones
```

La UI refuerza que la nomina mensual confirmada es la base oficial para liquidaciones. Esta fase solo ajusta UI/copy/maquetacion local y documentacion; no implementa persistencia nueva, motor, SQL/RPC/RLS, servicios ni liquidaciones productivas. Documento: [`../../diseno/nom-mensual-workspace-ui-01.md`](../../diseno/nom-mensual-workspace-ui-01.md).

## NOM-MENSUAL-CONFIRMACION-FLOW-00 aplicado

Se documenta la decision rectora del modulo:

```txt
Nómina mensual confirmada = fuente oficial para generar liquidaciones.
```

La experiencia futura debe entenderse como `Nómina mensual`: generar nómina, revisar trabajadores, confirmar la versión oficial y generar liquidaciones desde esa versión. `Preparar nómina` puede seguir existiendo como ruta/componente por compatibilidad, pero deja de ser el concepto principal de producto para nuevas fases. Documento rector: [`nomina-mensual-confirmacion-flow.md`](./nomina-mensual-confirmacion-flow.md).

**Prevalidaciones 9.5A + 9.5B** implementadas (sin motor ni liquidaciones): recurrentes por mes, grupos minimos de parametros + catalogos, resumen en UI. Proceso productivo end-to-end sigue **pendiente**. Vision de producto: [`vision-futura.md`](./vision-futura.md); orquestador: [`../../orquestador/estado-fases.md`](../../orquestador/estado-fases.md).

## REM-MOV-UNIFY-01 aplicado

El nombre visible oficial del flujo de hechos puntuales del periodo es **Movimientos del mes**. La ruta canonica visible se mantiene en `/remuneraciones/novedades-mensuales` por compatibilidad tecnica, pero RRHH no debe ver `Novedades mensuales`, `Movimientos variables` ni `Entradas mensuales` como nombres equivalentes del flujo.

La pantalla usa `PeriodoActivoService.periodoYm()` como fuente unica, muestra resumen por estado, formulario guiado y listado operativo. Los movimientos aprobados del periodo son los que se consideran al preparar nomina; borradores y pendientes quedan fuera hasta su aprobacion.

## REM-MOV-MODAL-01 aplicado

La accion **Registrar movimiento** abre un modal grande responsive dentro de `Movimientos del mes`. El periodo activo global se muestra solo como contexto del registro y no puede editarse desde el modal.

El modal mantiene header y footer estables, scroll interno para el formulario, accion primaria unica **Guardar movimiento** y accion secundaria **Cancelar**. Cancelar descarta directo si no hay cambios; con cambios sin guardar solicita confirmacion con el patron `app-message-box`.

## NOM-MOVIMIENTOS-MODAL-MENSUAL-UX-01 aplicado

El modal visible se titula **Registrar movimiento del mes** y queda enfocado solo en movimientos puntuales del periodo activo. No contiene duracion, recurrentes ni cuotas; las cuotas pertenecen al flujo recurrente de Haberes y descuentos.

La estructura queda compacta y vertical: bloque Movimiento, Detalle administrativo opcional y Resumen inferior antes del footer.

## NOM-MENSUAL-WORKSPACE-LAYOUT-POLISH-01 aplicado

Pulido de maquetación del workspace (franja, rail, focus, tabs, responsive). Documento: [`nom-mensual-workspace-layout-polish-01.md`](./nom-mensual-workspace-layout-polish-01.md).

## NOM-MODALES-PERIODO-STATE-03 aplicado

Overlay unificado: `ProcesoMensualOverlay`, signal `overlay`, host `app-proceso-mensual-overlays`, `cerrarOverlay()`. Documento: [`modales-periodo-state-03.md`](./modales-periodo-state-03.md).

## NOM-MODALES-PERIODO-INFO-02 aplicado

Información guiada post-generación: rules `proceso-mensual-informacion-periodo`, signal `informacionPeriodo`, modal `app-proceso-mensual-informacion-modal`, banner condicionado y rail contextual. Documento: [`modales-periodo-info-02.md`](./modales-periodo-info-02.md).

## NOM-MODALES-PERIODO-01 aplicado (documental)

Matriz NOIA de overlays y modales para la pantalla modular (`proceso-mensual-workspace`, `proceso-mensual-detalle-modal`, `app-message-box`, banner `errorEjecucion`). Define contrato propuesto `ProcesoMensualOverlay` y fase siguiente **NOM-MODALES-PERIODO-INFO-02** (errores/bloqueos post-generación). Sin cambios en UI productiva en esta fase. Documento: [`modales-periodo-01.md`](./modales-periodo-01.md).

## Documentos

| Archivo | Rol |
|---------|-----|
| [`nom-modales-periodo-revision-incidencias-04.md`](./nom-modales-periodo-revision-incidencias-04.md) | Registro único incidencias, dedupe y Resumen índice (planeada) |
| [`nom-modales-periodo-revision-copy-03.md`](./nom-modales-periodo-revision-copy-03.md) | Copy RRHH modal revisión; límite explícito vs INCIDENCIAS-04 |
| [`modales-periodo-01.md`](./modales-periodo-01.md) | Matriz overlays/modales NOIA, inventario, contrato propuesto, entradas y prioridades (NOM-MODALES-PERIODO-01) |
| [`nom-mensual-container-modular-01.md`](./nom-mensual-container-modular-01.md) | Refactor contenedor modular fases 1-5 (store, facade, hijos) |
| [`contrato-general.md`](./contrato-general.md) | Objetivo, alcance, relaciones con Parametros, empleados, conceptos, MV, motor futuro |
| [`nomina-mensual-confirmacion-flow.md`](./nomina-mensual-confirmacion-flow.md) | Define nómina mensual confirmada como fuente oficial para generar liquidaciones |
| [`nomina-mensual-diseno-visual-pruebas-unitarias-2026-05-18.md`](./nomina-mensual-diseno-visual-pruebas-unitarias-2026-05-18.md) | Diseno visual actual respaldado por pruebas unitarias y de componente |
| [`nomina-mensual-fases-casos-uso-2026-05-18.md`](./nomina-mensual-fases-casos-uso-2026-05-18.md) | Estado actual por fases y casos de uso de Nomina mensual |
| [`nomina-mensual-premium-design-mejoras-ux-2026-05-18.md`](./nomina-mensual-premium-design-mejoras-ux-2026-05-18.md) | Diseno premium y mejoras premium propuestas para Nomina mensual |
| [`prevalidaciones-9-5A.md`](./prevalidaciones-9-5A.md) | Reglas base 9.5A (periodo, fila PG, calendario, empleados, conceptos, MV) |
| [`prevalidaciones-9-5B.md`](./prevalidaciones-9-5B.md) | Recurrentes por `YYYY-MM`, grupos minimos de parametros, archivos y pruebas 9.5B |
| [`vision-futura.md`](./vision-futura.md) | Checklist orientativo y relación con otros módulos |

## Relación con flujos documentados

Pantalla **Proceso mensual**: **`/remuneraciones/proceso-mensual`** (redirect desde `/proceso-remuneraciones`). UI: `src/app/features/nomina-mensual/containers/proceso-mensual-container/`; pagina `src/app/pages/proceso-remuneraciones.page.ts` wrapper (`docs/codex/arquitectura/frontend-interfaces.md`). Servicio: `ProcesoMensualService`; reglas: `proceso-mensual-prevalidacion.rules.ts`. Limpieza demo previa: [`../../auditorias/param-chile-01-parametros-y-demo-proceso.md`](../../auditorias/param-chile-01-parametros-y-demo-proceso.md).

[`../../temas/flujos/proceso-remuneraciones.md`](../../temas/flujos/proceso-remuneraciones.md) y [`../../orquestador/contexto-proyecto.md`](../../orquestador/contexto-proyecto.md) §11–§15.

**Movimientos variables** (entrada del proceso): [`../movimientos-variables/README.md`](../movimientos-variables/README.md), [`../movimientos-variables/ui-9-4E.md`](../movimientos-variables/ui-9-4E.md).

<!-- UX-COMERCIAL-01-NOMINA -->

## Hito funcional y siguiente foco UX

El flujo de nomina queda validado hasta liquidaciones internas:

```txt
Preparar nomina
-> Resultado preliminar
-> Aprobacion operativa
-> Cierre operativo
-> Liquidaciones oficiales internas
```

**NOM-PREPARAR-NOMINA-BITACORA-V3-NONLINEAR-FLOW-UX-01 (2026-05-17):** mesa operativa no lineal — revisión guiada en modal; acta y panel livianos. Ver [`../../diseno/nom-preparar-nomina-bitacora-v3-nonlinear-flow-ux-01.md`](../../diseno/nom-preparar-nomina-bitacora-v3-nonlinear-flow-ux-01.md).

**NOM-PREPARAR-NOMINA-BITACORA-V3-STEPS-FOCUS-UX-01 (2026-05-17):** bitácora de etapas enfocada (resumen + subpasos solo activos). Ver [`../../diseno/nom-preparar-nomina-bitacora-v3-steps-focus-ux-01.md`](../../diseno/nom-preparar-nomina-bitacora-v3-steps-focus-ux-01.md).

**NOM-PREPARAR-NOMINA-BITACORA-V3-COPY-DENSITY-FIX-01 (2026-05-17):** acentos, copy RRHH y densidad en bitácora V3. Ver [`../../diseno/nom-preparar-nomina-bitacora-v3-copy-density-fix-01.md`](../../diseno/nom-preparar-nomina-bitacora-v3-copy-density-fix-01.md).

**NOM-PREPARAR-NOMINA-BITACORA-V3-POLISH-UX-01 (2026-05-17):** pulido visual post-V3 — timeline de etapas, acta del período, panel de apoyo, resumen en grilla. Ver [`../../diseno/nom-preparar-nomina-bitacora-v3-polish-ux-01.md`](../../diseno/nom-preparar-nomina-bitacora-v3-polish-ux-01.md).

**NOM-PREPARAR-NOMINA-BITACORA-V3-UX-01 (2026-05-16):** bitácora V3 — padre único, 5 etapas + subpasos, acta activa y detalle progresivo. Ver [`preparar-nomina/05-bitacora-v3-ux.md`](preparar-nomina/05-bitacora-v3-ux.md).

**NOM-PREPARAR-NOMINA-NOIA-LAYOUT-UX-01 (2026-05-16):** layout bitácora operativa — franja del período, workspace `Mesa de preparación` + `Siguiente acción`, disclosure de alcance. Ver [`diseno/nom-preparar-nomina-noia-layout-ux-01.md`](../../diseno/nom-preparar-nomina-noia-layout-ux-01.md).

Para fases siguientes de UI, `Preparar nomina` debe presentarse como tablero operativo/comercial del periodo:

```txt
estado principal
resumen ejecutivo
siguiente accion
bloqueos/advertencias
resultado guardado
cierre
liquidaciones
trazabilidad secundaria
```

No agregar Previred, LRE, banco, contabilidad, PDF ni firma en esta etapa.

**NOM-PREPARAR-NOMINA-BITACORA-V3-CLIENT-SAFE-DATAGRID-UX-01 (2026-05-17):** revisión guiada cliente-segura y detalle operativo con `app-data-grid` en modal ancho. Ver [`../../diseno/nom-preparar-nomina-bitacora-v3-client-safe-datagrid-ux-01.md`](../../diseno/nom-preparar-nomina-bitacora-v3-client-safe-datagrid-ux-01.md).

**NOM-PREPARAR-NOMINA-ADMIN-WORKSPACE-UX-01 (2026-05-17):** mesa administrativa del período; `Revisión guiada` abre el modal grande en tab Guía; panel de apoyo separado entre revisar en pantalla y corregir en otros módulos. Ver [`../../diseno/nom-preparar-nomina-admin-workspace-ux-01.md`](../../diseno/nom-preparar-nomina-admin-workspace-ux-01.md).

**NOM-PREPARAR-NOMINA-ADMIN-WORKSPACE-DESIGN-00 (2026-05-17):** maqueta documental cerrada para `Preparar nómina`: pantalla principal decide, guía explica, modal revisa, DataGrid lista y panel corrige. Ver [`../../diseno/nom-preparar-nomina-admin-workspace-design-00.md`](../../diseno/nom-preparar-nomina-admin-workspace-design-00.md).

**NOM-LIQ-ACTA-GUIADA-DESIGN-00 (2026-05-17):** contrato documental del flujo `Preparar nomina -> Liquidaciones oficiales`: cada accion critica debe tener contexto antes y evidencia despues. Ver [`../../diseno/nom-liq-acta-guiada-design-00.md`](../../diseno/nom-liq-acta-guiada-design-00.md).

**NOM-PREPARAR-NOMINA-ACTA-ACCION-UX-01 (2026-05-17):** `Acta operativa del periodo` en Preparar nomina; muestra contexto revisado, decision y evidencia local antes de Liquidaciones oficiales. Ver [`nom-preparar-nomina-acta-accion-ux-01.md`](nom-preparar-nomina-acta-accion-ux-01.md).

**NOM-PREPARAR-NOMINA-ESTADOS-VISUALES-PREMIUM-UX-01 (2026-05-18):** estados visuales, anti-redundancia, acta compacta, bandeja por contexto. Ver [`nom-preparar-nomina-estados-visuales-premium-ux-01.md`](nom-preparar-nomina-estados-visuales-premium-ux-01.md).

**NOM-PREPARAR-NOMINA-ESTADOS-VISUALES-PREMIUM-UX-01 (2026-05-18):** estados visuales, anti-redundancia, acta compacta, bandeja por contexto. Ver [`nom-preparar-nomina-estados-visuales-premium-ux-01.md`](nom-preparar-nomina-estados-visuales-premium-ux-01.md).

**NOM-PREPARAR-NOMINA-ACTA-DISENO-ESTRUCTURADO-UX-01 (2026-05-18):** refinamiento visual del acta como pieza de cierre operativo, sin cambios de logica ni persistencia. Ver [`nom-preparar-nomina-acta-diseno-estructurado-ux-01.md`](nom-preparar-nomina-acta-diseno-estructurado-ux-01.md).

## UX-COMERCIAL-01 V4 aplicado

`Preparar nomina` mantiene el patron:

```txt
header operativo
avanzar cierre mensual
resumen ejecutivo
siguiente accion
bloqueos / advertencias / informacion
resultado y cierre
trazabilidad secundaria
```

Tambien se reforzaron entradas del flujo:

- Movimientos del mes explica impacto en nomina y guia el empty state hacia registrar bonos, descuentos, anticipos o ajustes.
- Asignaciones recurrentes muestra motivo visible cuando no se puede crear sin trabajador seleccionado.
- Dashboard y Reportes ya no presentan salidas futuras como acciones disponibles.

## REM-UX-FLOWS-01 V2 aplicado

`Preparar nomina` consume el periodo activo global expuesto por el header/padre. La pantalla ya no muestra un segundo selector editable de periodo ni duplica el boton `Validar periodo` en el header.

La prioridad visual queda:

```txt
Periodo activo global
-> Estado del flujo
-> Siguiente accion recomendada
-> Que falta ahora
-> Detalle operativo
-> Trazabilidad secundaria
```

Para cambiar el periodo se usa el selector superior global. La pantalla hija solo muestra el periodo como contexto y ejecuta sus acciones sobre esa fuente.

## REM-UX-FLOWS-01 V3 aplicado

`Preparar nomina` separa lectura de cliente y trazabilidad interna:

```txt
Periodo activo global
-> Estado visible del periodo
-> Siguiente accion recomendada
-> Que falta ahora
-> Resumen final visible
-> Detalle y trazabilidad secundaria
```

El avance visible usa etapas de negocio: `Preparacion`, `Revision`, `Aprobacion y cierre`, `Liquidaciones`. Los pasos internos de validacion, base, calculo, guardado y persistencia quedan dentro del detalle operativo secundario.

## REM-UX-FLOWS-02 aplicado

`Preparar nomina` queda como hub operativo guiado por estado:

```txt
estado del periodo
accion principal unica
resumen minimo
pendientes / bloqueos / advertencias
revision operativa del periodo
informacion interna y alcance
```

La pantalla conserva solo el avance compacto superior y elimina el rail lateral duplicado. La revision operativa renderiza la etapa relevante segun `estadoClave` / `disclosureActivo`; en estado pendiente de validacion no expone todas las etapas internas.

`Movimientos del mes` usa el periodo activo global como fuente unica para listar y crear movimientos. Ya no muestra selector local editable de periodo ni boton `Buscar` asociado a ese selector.

## REM-PERIOD-GLOBAL-01 / REM-NAV-IA-01 aplicado

El header global es la unica fuente editable de periodo en Remuneraciones. `Preparar nomina` limpia resultado, pre-nomina, calculo, snapshot, aprobacion/cierre y mensajes al cambiar el periodo, y consulta el snapshot activo del nuevo periodo.

Rutas visibles del flujo:

```txt
/remuneraciones/proceso-mensual
/remuneraciones/novedades-mensuales
/remuneraciones/haberes-descuentos
/remuneraciones/liquidaciones
/remuneraciones/conceptos
```

`/remuneraciones/movimientos-variables` queda como redirect legacy a `novedades-mensuales`.

## ERP-AUDIT-REPAIR-UX-01 aplicado

`Preparar nomina` reemplaza confirmaciones nativas (`window.confirm`) por `app-message-box` modal en acciones criticas:

- Guardar resultado preliminar.
- Aprobar resultado preliminar.
- Cerrar nomina del periodo.

La confirmacion muestra motivo, alcance y puntos de revision RRHH. Cancelar no ejecuta persistencia. No cambia motor, SQL/RPC/RLS, liquidaciones oficiales ni salidas externas.
## ERP-NOIA-BITACORA-OPERATIVA-00 - Lectura de modulo

Nomina mensual queda alineada a [`NOIA / Bitacora Operativa`](../../diseno/bitacora-operativa-noia.md) como `Bitacora del periodo`.

- Preparar nomina debe comunicar periodo, trabajadores incluidos/excluidos, incidencias, decisiones RRHH y cierre operativo.
- Los resultados preliminares y cierres deben sentirse como registros del periodo, no como pantallas sueltas de calculo.
- Fase futura recomendada: `NOM-MOVIMIENTOS-UNIFICADOS-UX-01` para ordenar `Movimientos de remuneracion`.
- Esta referencia es documental; no cambia motor, SQL, liquidaciones, servicios ni estilos globales.

## NOM-MOVIMIENTOS-SIMPLE-00

La decision documental vigente define `Movimientos de remuneracion` como experiencia futura que unifica `Movimientos del mes` y `Asignaciones recurrentes` desde la duracion del registro: `Solo este mes`, `Recurrente` o `En cuotas`. Documento rector: [`../remuneraciones/movimientos-remuneracion-simple.md`](../remuneraciones/movimientos-remuneracion-simple.md).

Esta fase no cambia rutas, servicios, SQL, motor ni pantallas actuales.

## NOM-MOVIMIENTOS-SIMPLE-01

Preparar nomina queda alineado a la primera capa visible de `Movimientos de remuneracion`: sus accesos y textos hablan de movimientos del periodo y recurrentes como vistas de una misma gestion. No duplica edicion ni cambia el calculo, SQL, servicios, mappers o payloads.

## NOM-MOVIMIENTOS-POR-TRABAJADOR-01

Movimientos de remuneracion queda administrado por trabajador en la vista mensual. La grilla del periodo muestra contadores de movimientos del mes, recurrentes y pendientes de revision. El modal mensual queda restringido a movimientos puntuales del periodo y no muestra duracion ni cuotas.

## NOM-MOVIMIENTOS-GESTION-INTEGRAL-01

`Movimientos de remuneración` es el menú único para gestionar movimientos mensuales y recurrentes por trabajador. La pantalla mantiene la grilla de trabajadores como entrada principal y usa un modal de gestión del trabajador con tres secciones: movimientos del mes, recurrentes y pendientes de revisión.

El alta mensual y el alta recurrente son formularios separados. El modal mensual registra solo movimientos puntuales del período activo. El modal recurrente registra o edita asignaciones recurrentes y concentra la futura sección de cuotas. No se agregan tablas, SQL, motor ni payloads nuevos.
