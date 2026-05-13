## EMP-PERFIL-LABORAL-SQL-01 - Condiciones especiales del trabajador en BD

Fecha: 2026-05-12

- Se agrega base SQL para modelar condiciones especiales del trabajador sin convertir `tipo_trabajador` en un select gigante.
- `tipo_trabajador` se mantiene como categoria base (`DEPENDIENTE` / `INDEPENDIENTE`).
- Se crean `tipo_condicion_trabajador` y `persona_condicion_trabajador` para persistir condiciones como pensionado, invalidez parcial/total, exencion de cotizacion de pension, trabajador adolescente protegido, autorizacion de menor, tecnico extranjero exento y discapacidad.
- Se crea `fn_obtener_perfil_laboral_persona(p_id_persona, p_periodo)` para derivar edad laboral, tramo de ingreso minimo y banderas previsionales desde `persona.fecha_nacimiento`, periodo y condiciones vigentes.
- Menor de 18, adulto 18 a 65 y mayor de 65 no se guardan como condiciones manuales; se derivan por fecha de nacimiento y periodo.
- Se agrega RLS/permisos locales para las nuevas tablas y `GRANT EXECUTE` de la funcion, porque la parte 26 corre despues de `08_seguridad_rls.sql`.
- Se actualizan `run_all.sql`, monolito integrado, validaciones v11, diccionario canonico y documentacion de Empleados.
- Alcance respetado: sin HTML, CSS, TypeScript de UI, servicios Angular, motor, liquidaciones, LRE, Previred, creacion basica, ficha empleado ni enums de contrato.

## EMP-ADV-LAYOUT-CONSISTENCY-01 - Pulido visual local de Creacion avanzada

Fecha: 2026-05-12

- Se aplica pulido visual local sobre Creacion avanzada usando la base con Honorarios ya implementado.
- Se amplia el ancho util del wizard y se reduce el peso visual del mapa lateral para que el formulario sea el bloque protagonista.
- `Guardar borrador` pasa a clase local `advanced-draft-button` y mantiene comportamiento, data-testid y accion existente como secundaria destacada.
- Se reducen alturas minimas artificiales en pasos cortos y se compacta el resumen final para evitar espacio vacio innecesario.
- Se compactan paddings, gaps y grillas locales de Contrato y Bancario solo cuando se usan en modo avanzado.
- Se respeta la tipografia del ERP mediante `--erp-font-sans`; no se agregan fuentes, paletas ni estilos globales.
- Alcance respetado: sin cambios de flujo, pasos, validaciones, guardado, payloads, mappers, SQL/RPC/RLS/BD, creacion basica, ficha empleado ni remuneraciones.

## EMP-ADV-HONORARIOS-UX-01 - Modo boleta de honorarios en Creacion avanzada

Fecha: 2026-05-12

- Se agrega modo visual/controlado para `Boleta de honorarios` en Creacion avanzada sin persistencia final de honorarios.
- Al seleccionar honorarios se muestra MsgBox administrativo de confirmacion y se aclara que no corresponde trabajador dependiente.
- Se ocultan o marcan como no aplicables jornada laboral, gratificacion, prevision/salud dependiente, APVI, cargas, zona extrema y semana corrida.
- El paso de remuneracion cambia a `Monto de honorarios` usando el monto bruto como dato administrativo.
- Bancario pasa a `Datos para pago` recomendados y no se trata como cuenta de remuneraciones.
- Finalizar alta queda bloqueado para honorarios con MsgBox y accion para guardar borrador.
- Alcance respetado: sin SQL/RPC/RLS/BD, sin payload final de honorarios, sin motor, sin formulas, sin liquidaciones, sin LRE/Previred/banco/PDF/firma/envio.

## REM-UX-FLOWS-01 V3 - Visibilidad cliente vs aplicacion

Fecha: 2026-05-11

- Se ajusta `Preparar nomina` para priorizar lectura de usuario: periodo activo, estado final visible, accion principal, que falta ahora, informacion final y trazabilidad secundaria.
- El avance visible pasa de pasos internos (`Validar`, `Base`, `Calculo`, `Guardar`) a etapas de negocio: `Preparacion`, `Revision`, `Aprobacion y cierre`, `Liquidaciones`.
- Se renombran textos visibles tecnicos: `Resultado guardado desde BD` pasa a `Detalle del resultado guardado`; `Identificador tecnico` y `Version del calculo` pasan a `Referencia interna` y `Version interna`.
- En `Liquidaciones oficiales`, la trazabilidad deja de aparecer dentro de `Que falta ahora` y queda al final como detalle secundario.
- Alcance respetado: sin SQL/RPC/RLS/BD, sin formulas legales ni motor, sin PDF/firma/envio, sin Previred/LRE/banco/contabilidad.

## REM-UX-FLOWS-01 V2 - Periodo global y accion unica en Remuneraciones

Fecha: 2026-05-10

- Se aplica el patron transversal: periodo activo global -> estado del flujo -> accion principal -> que falta ahora -> detalle -> trazabilidad.
- Preparar nomina deja de mostrar un selector local editable y elimina el boton duplicado Validar periodo del header; la validacion usa el periodo activo global y queda como CTA principal por estado.
- Liquidaciones oficiales consume el periodo activo global, retira el selector local editable y deja Generar liquidaciones oficiales solo como accion principal del bloque operativo.
- Flujos revisados: Preparar nomina, Liquidaciones oficiales, Movimientos del mes, Asignaciones recurrentes, Conceptos de remuneracion, Reportes y Dashboard.
- Deuda documentada: Movimientos del mes mantiene selector local por consulta historica/listado por periodo; no debe competir con el periodo activo del cierre mensual.
- Alcance respetado: sin SQL/RPC/RLS/BD, sin formulas legales ni motor, sin PDF/firma/envio, sin Previred/LRE/banco/contabilidad.

## UX-COMERCIAL-01 - Base documental para redisenio usable, dinamico y comercial

Fecha: 2026-05-10

- Objetivo: preparar la fase de redisenio usable/comercial sobre el flujo funcional ya validado: Empleado/Ficha apta -> Preparar nomina -> Resultado preliminar -> Aprobacion operativa -> Cierre operativo -> Liquidaciones oficiales internas.
- Se agregan contratos UX: `ux-comercial/README.md`, `contrato-diseno-comercial.md`, `patrones-pantallas-erp.md`, `sistema-estados-acciones.md`, `dashboard-comercial-remuneraciones.md`, `copywriting-operativo.md`, `checklist-cursor-ux.md` y `anti-patrones-ui.md`.
- Se agrega fase canonica `docs/codex/fases/ux-comercial/UX-COMERCIAL-01.md` y prompt operativo `docs/codex/prompts-cursor/CURSOR-UX-COMERCIAL-01.md`.
- Alcance futuro inmediato: mejorar navegacion, Preparar nomina, Liquidaciones oficiales, estados, siguiente accion, copy y trazabilidad secundaria.
- Fuera de alcance: SQL/RPC/RLS, formulas, motor, Previred, LRE, banco, contabilidad, PDF, firma, envio, reapertura y rectificacion.

## UX-COMERCIAL-01 V4 - Usabilidad transversal T00-T09

Fecha: 2026-05-10

- Se ejecuto el runbook `CURSOR_UX_COMERCIAL_01_V4_USABILITY_SYSTEM` para tickets T00 a T09.
- Dashboard y Reportes dejan de mostrar montos demo, vencimientos inventados y acciones activas de salidas futuras; ahora separan vistas operativas reales de capacidades de fase posterior.
- Preparar nomina incorpora avance visible del cierre mensual y mantiene siguiente accion, resumen, bloqueos y trazabilidad como patron principal.
- Detalle de liquidacion vacio ahora explica el motivo y ofrece CTAs a Liquidaciones oficiales y Preparar nomina.
- Movimientos del mes y Asignaciones recurrentes refuerzan empty states con impacto en nomina, accion primaria y motivo visible de boton deshabilitado.
- Documentacion actualizada: estado de fases, roadmap, modulos de nomina/liquidaciones, fase UX y peticiones de estilos.
- Alcance respetado: sin SQL/RPC/RLS/BD, sin formulas ni motor, sin Previred/LRE/banco/contabilidad, sin PDF/firma/envio.

## UX-QA-01-FIX V5 - Tabs, collapsables y densidad

Fecha: 2026-05-10

- Se ejecuto `CURSOR_UX_TABS_COLLAPSE_POLISH_V5` para tickets T00 a T07.
- Dashboard usa status strip, quick links compactos y disclosure para salidas futuras.
- Reportes incorpora tabbar real para separar vistas disponibles de capacidades no disponibles en esta fase.
- Preparar nomina compacta el timeline de 6 pasos y metricas superiores.
- Liquidaciones oficiales reduce estado no disponible, evita resumen sin datos y compacta empty state de trabajadores.
- Asignaciones recurrentes usa collapsable para ayuda contextual y mantiene motivo visible en accion deshabilitada.
- Alcance respetado: sin SQL/RPC/RLS/BD, sin formulas ni motor, sin salidas externas activas.

## LIQ-DB-APPLY-01 - Aplicacion y validacion de liquidaciones oficiales en BD real controlada

Fecha: 2026-05-10

- Objetivo: validar en BD real/controlada la persistencia y generacion de liquidaciones oficiales internas.
- Periodo probado: `2026-04`.
- Snapshot nomina: `id_calculo_periodo=1`, aprobado y cerrado operativamente.
- Liquidacion generada: `id_liquidacion_periodo=1`, 1 trabajador, 8 conceptos.
- Totales cabecera = detalle: haberes `750001.88`, descuentos `588301.48`, liquido `161700.40`.
- Duplicados activos: 0.
- Pruebas: `npx playwright test tests/nomina-mensual.e2e.spec.ts --workers=1` OK, 1 passed / 1 skipped; `npx playwright test tests/liquidaciones-oficiales.e2e.spec.ts --workers=1 --timeout=120000` OK, 1 passed; `npm run build` OK con warnings CSS conocidos; `npx ng test --watch=false` OK, 43 archivos / 433 tests.
- Regla corregida: `23_liquidaciones_oficiales_rpc.sql` persiste totales de cabecera desde el snapshot cerrado, respetando `no recalcula`.
- Hito funcional: Empleado/Ficha apta -> Preparar nomina -> Resultado preliminar -> Aprobacion operativa -> Cierre operativo -> Liquidaciones oficiales internas.

## LIQ-OFICIAL-01 - Liquidaciones oficiales internas v1

Fecha: 2026-05-10

- Objetivo: implementar liquidaciones oficiales internas desde nomina cerrada.
- SQL versionado: `22_liquidaciones_oficiales.sql`, `23_liquidaciones_oficiales_rpc.sql`, `run_all.sql`.
- Tablas: `nomina_liquidacion_periodo`, `nomina_liquidacion_trabajador`, `nomina_liquidacion_concepto`.
- RPC: `generar_liquidaciones_oficiales`, `SECURITY INVOKER`, solo `authenticated`, `anon/PUBLIC` revocados.
- Frontend: `src/app/features/liquidaciones-oficiales/` con models, rules, data-access, services, container y componentes de resumen/grilla/detalle.
- Ruta: `/remuneraciones/liquidaciones-oficiales`.
- Fuera de alcance respetado: sin PDF, firma, envio, Previred, LRE, banco ni contabilidad.

## EMP-ADV-MSGCOPY-01 - Copy administrativo en MsgBox de alta avanzada

Fecha: 2026-05-11

- Se pulen los mensajes de `app-message-box` en Creación avanzada con tono administrativo para RRHH.
- Se reemplaza `Continuar de todos modos` por `Continuar`, evitando que la acción suene riesgosa o culposa.
- Se reemplaza `Ir al primer bloqueo` por `Ir al primer pendiente`, manteniendo el comportamiento de navegación y foco.
- Las secciones del modal quedan como `Datos obligatorios pendientes`, `Advertencias de revisión` e `Información útil`.
- Los listados del MsgBox usan guion visual y frases completas con punto final para mejorar lectura.
- Se eliminan punto y coma de textos visibles del flujo.
- Alcance respetado: sin SQL/RPC/RLS/BD, sin payloads/mappers, sin motor, sin creación básica, sin ficha empleado ni remuneraciones.

## EMP-ADV-VALIDATION-CL-02 - Validaciones chilenas accionadas por MsgBox

Fecha: 2026-05-11

- Se ajusta Creacion avanzada para que las validaciones chilenas no se muestren como tarjeta fija por paso.
- `Siguiente` sigue siendo flexible: si el paso tiene bloqueos o advertencias, abre `app-message-box` modal con `Corregir ahora` o `Continuar`.
- `Guardar borrador` mantiene validacion minima y muestra `app-message-box` cuando faltan datos base; el exito de borrador tambien usa MsgBox.
- `Finalizar alta` concentra la exigencia: abre MsgBox con bloqueos/advertencias y solo navega al primer pendiente cuando el usuario lo pide.
- Se mantiene mapa de ficha como resumen permanente; no se duplica una tarjeta de validaciones dentro del contenido.
- Alcance respetado: sin SQL/RPC/RLS/BD, sin payloads/mappers, sin reglas de motor, sin creacion basica, sin ficha empleado ni remuneraciones.
- Validacion local: `npx tsc -p tsconfig.app.json --noEmit` OK y `npx tsc -p tsconfig.spec.json --noEmit` OK. `npm run build` no cierra en sandbox Linux por `node_modules` Windows (`@esbuild/win32-x64` / `lightningcss`).

## EMP-PERFIL-LABORAL-UI-01 - Perfil laboral y condiciones especiales en Creacion avanzada

Fecha: 2026-05-12

- Se agrega bloque visual `Perfil laboral y previsional` en Creacion avanzada; el pulido posterior lo separa como paso propio antes del resumen.
- La UI deriva el tramo de edad laboral desde fecha de nacimiento y fecha de ingreso: menor de 18, adulto 18 a 65 y mayor de 65 no son checks manuales.
- Se habilita seleccion de condiciones especiales reales: pensionado, invalidez parcial/total, exento cotizacion pension, trabajador adolescente protegido, autorizacion de menor, tecnico extranjero exento y discapacidad.
- Se agrega vigencia, respaldo administrativo registrado y observacion interna para las condiciones seleccionadas.
- El resumen final muestra perfil laboral detectado y condiciones especiales declaradas.
- Se conecta el payload y repositorio para reemplazar condiciones en `persona_condicion_trabajador` usando el catalogo `tipo_condicion_trabajador`, sin crear SQL nuevo.
- Se mantiene Honorarios fuera de este bloque: el paso sigue marcado como no aplicable y la finalizacion de honorarios continua bloqueada hasta su fase de persistencia propia.
- Alcance respetado: sin estilos globales, sin cambios de motor, nomina, liquidaciones, LRE, Previred, SQL/RPC/RLS, creacion basica ni formulas legales.
- Validaciones: `npx tsc -p tsconfig.app.json --noEmit` OK; `npx tsc -p tsconfig.spec.json --noEmit` OK; `unzip -t` OK. `ng build --configuration development` queda no cerrado en sandbox por timeout.



## EMP-PERFIL-LABORAL-UI-01-POLISH - Paso propio y maqueta alineada

Fecha: 2026-05-12

- Se separa `Perfil laboral y condiciones` como paso propio de Creacion avanzada, ubicado despues de Banco y antes de Resumen final.
- El paso 4 vuelve a quedar enfocado solo en asignaciones laborales: cargas familiares, zona extrema y semana corrida.
- El componente de perfil laboral adopta la misma maqueta local de los otros pasos: bloques con cabecera neutra, borde 8px, densidad compacta, sin sombras ni cards sobredimensionadas.
- `Vigencia y respaldo` queda bajo demanda: aparece solo cuando RRHH selecciona al menos una condicion especial.
- El resumen final conserva una lectura compacta del perfil detectado y condiciones declaradas, sin duplicar el formulario.
- Alcance respetado: sin SQL/RPC/RLS, sin persistencia nueva, sin motor, sin nomina, sin liquidaciones, sin estilos globales y sin cambiar Honorarios.
- Validaciones: `npm ci --ignore-scripts` OK; `npx tsc -p tsconfig.app.json --noEmit` OK; `npx tsc -p tsconfig.spec.json --noEmit` OK. `npm run build -- --configuration development` no cerro en sandbox por timeout, sin error de codigo antes del corte.

## EMP-CONDICIONES-ESPECIALES-UX-01 - Enfoque administrativo RRHH

Fecha: 2026-05-12

- El paso visible pasa de enfoque `Perfil laboral` a `Condiciones especiales`, manteniendo su ubicacion despues de Banco y antes de Resumen final.
- La UI abre con `Revision administrativa`: situacion detectada por edad, tipo de relacion, edad al ingreso y fecha de referencia.
- La seleccion queda comunicada como `Solo si aplica`; un trabajador adulto estandar puede continuar sin marcar condiciones.
- El estado vacio deja de sentirse como bloque flotante: muestra `Trabajador estandar`, `Revision pendiente` o revision sugerida segun edad detectada.
- `Vigencia y respaldo` sigue bajo demanda solo cuando existe una condicion seleccionada.
- El resumen final cambia la fila a `Revision administrativa` y mantiene `Condiciones especiales` como lectura compacta.
- Alcance respetado: sin SQL/RPC/RLS, sin persistencia nueva, sin motor, sin nomina, sin liquidaciones, sin estilos globales y sin cambiar Honorarios.

## EMP-CONDICIONES-ESPECIALES-AUTODETECT-01 - Pre-marcado desde datos existentes

- `Condiciones especiales` en Creacion avanzada ahora separa condiciones declarables manualmente de condiciones pre-marcadas por datos ya capturados.
- El formulario pre-marca `Trabajador adolescente protegido` cuando fecha de nacimiento + fecha de ingreso detectan menor de 18 anos.
- El formulario pre-marca condiciones previsionales/administrativas cuando el `Tipo trabajador` seleccionado las informa explicitamente en su nombre: pensionado, pensionado por invalidez parcial/total, exento cotizacion pension, tecnico extranjero exento o discapacidad.
- Si el regimen previsional queda como `NINGUNA`, se pre-marca `Exento de cotizacion de pension` para que RRHH revise respaldo antes de finalizar.
- La UI muestra un bloque `pre-marcado desde pasos anteriores` y un chip `Detectada` en cada condicion sugerida; RRHH puede corregir antes de finalizar.
- No se agregan SQL/RPC/RLS, motor, nomina, liquidaciones ni reglas nuevas de persistencia.

## EMP-ALTA-REGLAS-COHERENCIA-01 - Validaciones asistidas con decision RRHH

Fecha: 2026-05-13

- Se agrega regla pura central `empleado-alta-coherencia.rules.ts` para evaluar coherencia administrativa del alta avanzada sin mezclar reglas en HTML.
- La regla detecta avisos para Seguro de Cesantia, jornada, regimen previsional `NINGUNA` y condiciones especiales derivadas de menor de edad.
- `Siguiente` y `Finalizar alta` usan `app-message-box` cuando existe una combinacion corregible: RRHH puede aplicar la recomendacion o mantener la situacion bajo revision administrativa.
- El formulario muestra avisos inline compactos por paso y un bloque de `Coherencia administrativa` en Resumen final.
- Se agregan tests unitarios de la regla y casos de componente para aplicar/mantener una decision de coherencia.
- Alcance respetado: sin SQL/RPC/RLS, sin motor, sin nomina, sin liquidaciones, sin LRE/Previred, sin creacion basica, sin ficha empleado y sin estilos globales.
