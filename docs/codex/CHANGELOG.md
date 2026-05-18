# CHANGELOG

## 2026-05-18 - NOM-MODALES-PERIODO-INFO-02

- **UI:** modal informativo `app-proceso-mensual-informacion-modal` para errores/bloqueos post-generación; banner `errorEjecucion` condicionado; rail «Ver detalle» contextual.
- **Rules:** `proceso-mensual-informacion-periodo.rules.ts` + spec (4 tests).
- **Facade:** signal `informacionPeriodo` con sincronización y exclusión mutua respecto a confirmación y detalle operativo.
- **Deuda:** `proceso-mensual-container.spec.ts` pendiente de alinear al DOM modular.

## 2026-05-18 - NOM-MODALES-PERIODO-01

- **Nómina mensual:** matriz NOIA de overlays y modales (revisión vs MessageBox vs inline vs rail).
- **Documentación:** [`modulos/nomina-mensual/modales-periodo-01.md`](./modulos/nomina-mensual/modales-periodo-01.md) — inventario, contrato propuesto `ProcesoMensualOverlay`, entradas, prioridades y fase siguiente `NOM-MODALES-PERIODO-INFO-02`.
- **Alcance:** solo Codex; sin cambios en HTML/CSS/TS productivo, servicios, SQL, motor ni estilos globales.

## 2026-05-18 - NOM-MENSUAL-WORKSPACE-UI-01

- **Nómina mensual:** la pantalla visible deja de presentarse como `Preparar nómina` y pasa a leerse como workspace operativo del período.
- **Flujo UI:** `Generar nómina -> Revisar trabajadores -> Confirmar nómina -> Generar liquidaciones`.
- **Trazabilidad:** la experiencia refuerza que la nómina mensual confirmada es la base oficial para liquidaciones.
- **Alcance:** UI/copy/maquetación local y documentación; sin SQL/RPC/RLS, motor, servicios, persistencia, rutas, mappers, estilos globales ni liquidaciones productivas nuevas.

## 2026-05-18 - NOM-MENSUAL-CONFIRMACION-FLOW-00

- **Nómina mensual:** se documenta la regla rectora `Nómina mensual confirmada = fuente oficial para generar liquidaciones`.
- **Producto/UX:** el flujo futuro se entiende como generar nómina, revisar trabajadores, confirmar nómina y generar liquidaciones desde esa versión.
- **Liquidaciones:** se mantiene la regla de no recalcular; el lenguaje visible debe preferir `nómina mensual confirmada` sobre términos técnicos como snapshot.
- **Alcance:** fase documental; sin Angular, HTML, CSS, SQL/RPC/RLS, motor, servicios, mappers, persistencia ni estilos globales.


### ERP-NOIA-UI-GUARDRAILS-01 (bases sistema + Creación avanzada)

Fecha: 2026-05-18

- `noia-bases-sistema-referencia.md`: jerarquía documental, tokens `--form-*` / `--bitacora-*` / `payroll-*`, ejemplo canónico Creación avanzada vs Preparar nómina.
- Enlaces desde guardrails, antipatrones, tokens, prompt, README, `creacion-avanzada.md`, `bitacora-operativa-noia.md`.

### ERP-NOIA-UI-GUARDRAILS-01 (ampliación antipatrones)

Fecha: 2026-05-18

- `noia-antipatrones-ia.md`: colores extravagantes, mal uso de espacio, Tailwind improvisado, regla de reutilización.
- `noia-prompt-cursor.md`: prompt largo y corto para User/Project Rules.
- Tokens, layout, checklist y regla Cursor reforzados contra UI tipo IA/SaaS.

### ERP-NOIA-UI-GUARDRAILS-01

Fecha: 2026-05-18

- Constitución visual NOIA: guardrails, tokens, layout, componentes y checklist de revisión en `docs/codex/diseno/`.
- Regla Cursor `erp-ui-visual-guardrails.mdc` (alwaysApply en `src/**`).
- Índices actualizados: `README.md`, `contexto-rapido.md`, `estado-fases.md`, `peticiones-estilos.md`, `erp-ui-noia.mdc`.
- Sin cambios en Angular funcional, SQL, motor ni estilos globales.

### NOM-PREPARAR-NOMINA-ESTADOS-VISUALES-PREMIUM-UX-01

Fecha: 2026-05-18

- Estados visuales por etapa del flujo; riesgo sin evaluar antes de validar.
- Decisión del período como foco; bandeja RRHH agrupada por contexto/severidad.
- Acta compacta sin validación; evidencia incluida en tono neutro.
- Eliminada redundancia entre resumen, decisión, acta y bandeja.
- Bitácora conservada; sin cambios de motor, SQL, servicios ni estilos globales.

### NOM-PREPARAR-NOMINA-ACTA-DISENO-ESTRUCTURADO-UX-01

Fecha: 2026-05-18

- `Acta operativa del periodo` se reorganiza como pieza de cierre operativo: header con estado/accion, franja compacta de contexto, panel dividido decision/evidencia y pie de alcance.
- El CTA principal queda visible en el header del acta y el estado `PREPARADA` muestra acciones secundarias.
- El contenido proyectado en `app-message-box` se ordena como confirmacion operativa con secciones y proxima accion.
- Sin cambios de logica, servicios, persistencia, rutas, motor, SQL/RPC/RLS, estilos globales ni Liquidaciones oficiales.

### NOM-PREPARAR-NOMINA-ACTA-ACCION-UX-01

Fecha: 2026-05-17

- Preparar nomina agrega `Acta operativa del periodo` dentro del acta principal, cerca de la accion recomendada.
- El acta usa componente local `app-acta-operativa-periodo` y regla pura `buildActaOperativaPeriodoViewModel`.
- El acta deriva estados locales `BLOQUEADA`, `REQUIERE_REVISION`, `LISTA` y `PREPARADA`.
- La accion abre `app-message-box` antes de marcar visualmente el acta como preparada en la sesion.
- La evidencia muestra contexto revisado, decision operativa y respaldo para Liquidaciones oficiales sin persistir actas ni generar liquidaciones.
- Sin cambios en servicios, rutas, motor, SQL/RPC/RLS, estilos globales, menu lateral ni liquidaciones productivas.

### NOM-LIQ-ACTA-GUIADA-DESIGN-00

Fecha: 2026-05-17

- Fase documental: se define el contrato de acta guiada para el flujo `Preparar nomina -> Liquidaciones oficiales`.
- Se fija la regla central: cada accion critica debe tener contexto antes y evidencia despues.
- Se documenta la matriz de actas para validar periodo, generar base, calcular preliminar, aprobar/cerrar nomina y generar/revisar liquidaciones internas.
- Sin cambios en Angular, servicios, rutas, motor, SQL/RPC/RLS, estilos globales ni DataGrid compartido.

### NOM-PREPARAR-NOMINA-ADMIN-WORKSPACE-DESIGN-00

Fecha: 2026-05-17

- Fase documental: se define la maqueta final de `Preparar nómina` como mesa administrativa del período.
- Se fija la separación de responsabilidades: pantalla principal para decidir, revisión guiada para entender, modal grande para revisar, DataGrid para listar y panel de apoyo para corregir.
- Se documentan reglas de acta, panel de apoyo, modal grande, tabs y uso selectivo de DataGrid.
- Sin cambios en Angular, servicios, rutas, motor, SQL/RPC/RLS, estilos globales ni DataGrid compartido.

### NOM-PREPARAR-NOMINA-ADMIN-WORKSPACE-UX-01

Fecha: 2026-05-17

- Preparar nómina queda ordenada como mesa administrativa: encabezado, estado del período, bitácora, acta, panel de apoyo y registro compacto.
- `Revisión guiada` abre el modal grande de revisión en tab `Guía`; el modal concentra guía, resumen operativo y tabs con DataGrid.
- Panel de apoyo separa revisar en pantalla y corregir en otros módulos con labels administrativos.
- Modal grande con header/body/footer ordenados; DataGrid solo en colecciones revisables.
- Sin cambios en servicios, rutas, motor, SQL/RPC/RLS, estilos globales ni DataGrid compartido.

### NOM-PREPARAR-NOMINA-DECISION-LAYOUT-UX-01

Fecha: 2026-05-17

- Preparar nómina: acta reorganizada como zona de decisión con cabecera, acción recomendada, CTA principal y acciones secundarias juntas.
- Revisión resumida pasa a tres accesos compactos para bloqueos, advertencias y prioridades.
- Panel de apoyo ordena detalles como botonera compacta, evitando enlaces sueltos y mejorando escaneo.
- Sin cambios en servicios, rutas, motor, SQL/RPC/RLS, estilos globales ni DataGrid compartido.

### NOM-PREPARAR-NOMINA-DETAIL-CTA-UX-01

Fecha: 2026-05-17

- Preparar nómina: resumen superior clickeable abre el detalle operativo en el tab correcto.
- Revisión resumida y panel de apoyo abren observaciones/trabajadores/movimientos/recurrentes según intención.
- La bitácora lateral se estira hasta el final útil de la pantalla en desktop.
- Sin cambios en servicios, rutas, motor, SQL/RPC/RLS, estilos globales ni DataGrid compartido.

### NOM-PREPARAR-NOMINA-BITACORA-V3-CLIENT-SAFE-DATAGRID-UX-01

Fecha: 2026-05-17

- Preparar nómina separa revisión guiada cliente-segura y detalle operativo bajo demanda.
- El detalle operativo abre en modal ancho con tabs y usa `app-data-grid` para trabajadores, movimientos, recurrentes, observaciones y resultado preliminar.
- Información interna queda cerrada por defecto; la pantalla principal conserva 5 etapas, acta, panel de apoyo y registro compacto.
- Sin cambios en DataGrid compartido, servicios, rutas, motor, SQL/RPC/RLS ni estilos globales.

### NOM-PREPARAR-NOMINA-BITACORA-V3-NONLINEAR-FLOW-UX-01

Fecha: 2026-05-17

- Preparar nómina: mesa de decisión sin revisión guiada inline; detalle en modal local.
- Acta con resumen y «Ver revisión guiada»; panel de apoyo sin duplicar bloqueos/advertencias completos.
- Registro del período en una línea operativa (`registroPeriodoLinea`).
- Sin cambios de motor, servicios, SQL, rutas ni estilos globales.

### NOM-PREPARAR-NOMINA-BITACORA-V3-STEPS-FOCUS-UX-01

Fecha: 2026-05-17

- Bitácora del período enfocada: resumen por etapa, subpasos solo en etapa activa (máx. 4), marcas ✓ ● ○.
- Enlaces «Ver detalle completo» y «Ver en panel de apoyo»; etapas inactivas compactas.
- View-model `bitacoraEtapas` en contenedor (presentación); sin cambio de lógica de negocio.

### NOM-PREPARAR-NOMINA-BITACORA-V3-COPY-DENSITY-FIX-01

Fecha: 2026-05-17

- Copy visible con acentos y lenguaje RRHH en Preparar nómina (acta, panel, revisión guiada).
- Densidad visual: shell más compacto, registro del período reforzado, revisión guiada cerrada en estado inicial.
- Jerarquía acta sin duplicar label de acción; reglas de estado operativo con copy alineado.
- Sin lógica, motor, servicios, SQL, rutas ni estilos globales.

### NOM-PREPARAR-NOMINA-BITACORA-V3-POLISH-UX-01

Fecha: 2026-05-17

- Pulido visual de **Preparar nómina** (post-V3): bitácora con línea de etapas y subpasos en filas; acta operativa central; panel de apoyo compacto; franja de resumen en grilla.
- Copy visible con acentos en shell y cabeceras de revisión guiada; sin chips decorativos ni cards extra en navegación.
- Solo `proceso-mensual-container.html/css`; sin lógica, motor, servicios, SQL, rutas ni estilos globales.

### NOM-PREPARAR-NOMINA-BITACORA-V3-UX-01

Fecha: 2026-05-16

- Se reorganiza visualmente **Preparar nómina** como bitácora operativa del período en un contenedor padre único.
- Se reemplaza la navegación larga por **5 etapas principales** con subpasos progresivos solo en la etapa activa.
- Se reduce el uso de cards y chips decorativos en la navegación; acta activa + detalle progresivo + revisión guiada plegable.
- No se modifica lógica, motor, servicios, SQL, rutas ni estilos globales.

## ERP-MSGBOX-NOIA-UX-01-FIX-02 - MessageBox decisión operativa

Fecha: 2026-05-16

- `app-message-box` modal alineado a NOIA v3.1: panel neutro, header editorial, secciones compactas sin bordes de color por variante, primario `#1e3a8a`.
- Creación avanzada: borrador inválido usa `sections` (pendiente / por qué / acción) sin lista dominante de campos.
- Doc: `docs/codex/diseno/erp-msgbox-noia-ux-01.md`.
- Sin estilos globales, SQL, motor ni payloads.

## DOCS-MOVIMIENTOS-ALIGN-01 - Alineación documental Movimientos

Fecha: 2026-05-16

- Se creó [`orquestador/resumen-trabajo-movimientos-remuneracion.md`](./orquestador/resumen-trabajo-movimientos-remuneracion.md) como context pack para agentes.
- Se amplió [`modulos/remuneraciones/movimientos-de-remuneracion.md`](./modulos/remuneraciones/movimientos-de-remuneracion.md) como documento vivo del producto.
- Se actualizaron cierres de fase en `movimientos-remuneracion-simple.md`, §1.1 de `novedades-mensuales.md`, `contexto-rapido.md`, `estado-fases.md` y se redujo duplicidad en `movimientos-variables/README.md`.
- Sin cambios en `src/`, SQL, motor ni estilos globales.

## DOCS-CODEX-MERGE-PRUNE-QUALITY-01

Fecha: 2026-05-16

- Se eliminaron respaldos `.bak` del repo activo (carpeta `archivo/backups/` ya ausente).
- Se eliminaron assets antiguos pesados ya archivados (`archivo/assets-antiguos/` ya ausente).
- Se eliminaron duplicados raíz de prevalidaciones tras confirmar fuentes modulares en `modulos/nomina-mensual/`.
- Se migraron escenarios útiles de tests raíz a documentos modulares (`modulos/empleados/tests-empleados.md`, `modulos/parametros/tests-parametros.md`).
- Se corrigieron referencias internas afectadas por la poda (flujos `empleados`/`parametros`, `plan-pruebas`, índices).
- Se actualizó el mapa de documentación y la regla de lectura para Cursor.
- Se crearon `modulos/remuneraciones/README.md` y `movimientos-de-remuneracion.md` como punto de entrada del producto.
- No se tocó `src/`, `bd/`, Angular, SQL, motor, servicios ni estilos globales.

## NOM-MOVIMIENTOS-GESTION-INTEGRAL-01 - Gestión mensual y recurrente por trabajador

Fecha: 2026-05-16

- `Movimientos de remuneración` queda como menú único para gestionar movimientos puntuales del período y recurrentes por trabajador.
- La grilla por trabajador se mantiene como entrada principal: contadores de movimientos, recurrentes y revisión abren detalle contextual sin navegar fuera de la pantalla.
- `Gestionar` abre un modal del trabajador con secciones separadas: movimientos del mes, recurrentes y pendientes de revisión.
- `Agregar movimiento del mes` abre el modal mensual puntual. `Agregar recurrente` abre un modal recurrente separado dentro de la misma pantalla.
- Las cuotas se muestran solo dentro del flujo recurrente como capacidad preparada, sin cambiar SQL, motor, payloads ni persistencia crítica.
- Se eliminan navegaciones externas innecesarias hacia recurrentes desde este flujo y se usan acciones locales soportadas por los servicios actuales: crear, editar y finalizar recurrente.
- Alcance respetado: sin SQL/RPC/RLS, sin motor, sin liquidaciones productivas, sin estilos globales y sin tests nuevos.

## NOM-MOVIMIENTOS-MODAL-MENSUAL-UX-01 - Modal mensual compacto

Fecha: 2026-05-16

- Se pule el modal `Registrar movimiento del mes` dentro de `Movimientos de remuneración`.
- El modal queda enfocado solo en movimientos puntuales del período activo: trabajador, concepto, tipo, monto, fecha de referencia y detalle administrativo opcional.
- Se elimina la columna lateral `Antes de guardar`; el resumen queda como bloque inferior antes del footer.
- Se mantiene fuera del modal mensual cualquier duración, recurrente o cuota. Las cuotas siguen perteneciendo al flujo recurrente.
- Alcance local: contenedor de novedades mensuales, copy visible relacionado y documentación. Sin SQL, motor, persistencia crítica ni estilos globales.
## NOM-MOVIMIENTOS-SIMPLE-00 - Unificacion documental de movimientos

Fecha: 2026-05-15

- Se crea el documento rector `docs/codex/modulos/remuneraciones/movimientos-remuneracion-simple.md`.
- Se define que `Movimientos del mes` y `Asignaciones recurrentes` deben evolucionar a la experiencia visible `Movimientos de remuneracion`.
- Se fijan tres duraciones visibles: `Solo este mes`, `Recurrente` y `En cuotas`.
- Se documenta auditoria actual: `nomina_novedad_mensual`, `movimiento_variable_mensual` legacy, `haberdescuento_persona`, `concepto` y `EntradasMensualesPeriodoService`.
- Alcance respetado: fase documental, sin Angular, SQL/RPC/RLS, rutas, motor, liquidaciones, servicios productivos, mappers, payloads ni estilos globales.

## ERP-NOIA-DECISION-SYSTEM-01 - Sistema de decisiones de diseno NOIA

Fecha: 2026-05-15

- Se crea un sistema documental para que Cursor/Codex evalue tipo de pantalla, fuente de verdad, accion principal, riesgo y patron visual antes de modificar UI.
- Se define la regla anti-card: no resolver pantallas con cards por defecto.
- Se documentan patrones alternativos: franja operativa, registro de bitacora, panel dividido, linea de estado, lista de revision, bloque editorial, tabla contextual, MessageBox, disclosure y card justificada.
- Se agregan arquetipos de pantalla y recetas de componentes.
- No se toca Angular funcional, HTML/CSS de pantallas, SQL/RPC/RLS, Python, wrapper, motor, nomina, liquidaciones, servicios, mappers ni estilos globales protegidos.

## PARAM-BITACORA-LAYOUT-ALIGN-01 - Parametros alineado a Bitacora Operativa

Fecha: 2026-05-15

- v2 ejecuta la lectura obligatoria NOIA/Parametros, explicita la matriz de decision y refuerza cierre normativo como protagonista visual.
- Se ordena visualmente la pantalla Parametros para alinearla al patron `Bitacora Operativa / NOIA`.
- La cabecera del periodo refuerza la lectura normativa: periodo, estado mensual, detalle operativo y accion recomendada.
- Se ajusta la lectura visual de tabs principales como navegacion normativa compacta, sin cambiar su logica.
- Se agrega contexto local de la seccion activa y se reduce el peso visual de filtros del DataGrid.
- `Configurar cliente` queda conectado al estado del periodo y `Modificar configuracion` se mantiene asociado a configuracion cliente, no a datos oficiales.
- No se crea flujo nuevo, no se cambia reconciliacion oficial/cliente, no se toca Python, wrapper, SQL, servicios, motor, nomina, liquidaciones ni estilos globales protegidos.

## ERP-CONTEXT-OPTIMIZATION-01 - Contexto liviano para Cursor/Codex

Fecha: 2026-05-15

- Se crea `docs/codex/contexto-rapido.md` como resumen oficial corto para iniciar fases sin arrastrar todo el historial.
- Se agregan reglas persistentes Cursor: `.cursor/rules/erp-ui-noia.mdc` y `.cursor/rules/erp-protected-files.mdc`.
- Se agrega `.cursorignore` para excluir artefactos pesados, dependencias, logs, zips, entornos locales y resultados de pruebas sin ocultar `docs/codex`, `.cursor`, `src/app`, `bd` ni `scripts`.
- Se crea `scripts/build-context-pack.ps1` para generar ZIPs pequeños de contexto por módulo o fase.
- Se documenta la fase en `docs/codex/diseno/erp-context-optimization-01.md`.
- Alcance respetado: sin Angular funcional, sin HTML/CSS visual de pantallas, sin estilos globales protegidos, sin SQL/RPC/RLS, sin motor, sin nómina, sin liquidaciones, sin servicios, sin mappers, sin payloads y sin dependencias nuevas.

## EMP-ADV-CSS-BUDGET-REDUCE-01 - Reduccion de presupuesto CSS en Creacion avanzada

Fecha: 2026-05-15

- Se reduce y segmenta el CSS local de `app-form-empleado` en tres hojas encapsuladas por el mismo componente: base, wizard/resumen y feedback/diagnosticos.
- El build productivo deja de fallar por `form-empleado.css`: antes reportaba 36.37 kB contra presupuesto de 24.00 kB; ahora no emite error de componente.
- Se eliminaron selectores locales sin uso y duplicaciones de overrides Bitacora sin cambiar el diseno ni mover reglas a estilos globales.
- Se mantiene el warning existente de `contrato.css` en 23.26 kB, fuera del alcance de esta fase y bajo el umbral de error.
- Alcance respetado: sin `angular.json`, sin estilos globales protegidos, sin Tailwind/PostCSS, sin SQL/RPC/RLS, sin motor, nomina, liquidaciones, servicios, mappers, rutas, reglas ni payloads.

## EMP-ALTA-MSGBOX-ERROR-UX-01 - Mensajes de error estructurados

Fecha: 2026-05-14

- El modal de error de guardado usa el mismo patrón visual del éxito (`modalHeadlineSplit` + paneles de detalle) para evitar mensajes planos o técnicos.
- Se agregan bloques `Qué revisar`, `Acción recomendada` y `Paso sugerido` cuando el error permite inferirlo.
- El caso `Sin previsión` se presenta con copy administrativo y recomienda volver a `Previsión y salud` para seleccionar AFP o IPS si el trabajador quedará habilitado para remuneraciones.
- Se normalizan acentos en mensajes visibles conocidos (`opción`, `previsión`, `cálculo`, `nómina`, `información`).
- Alcance respetado: sin SQL/RPC/RLS, sin motor, nómina, liquidaciones, ficha empleado, creación básica funcional ni estilos globales.

## EMP-ALTA-DIAGNOSTICO-CONTRACTUAL-UX-01 - Diagnóstico contractual en Resumen final

Fecha: 2026-05-14

- El bloque visible `Matriz de aplicabilidad` pasa a `Diagnóstico contractual`, manteniendo la matriz como lógica interna.
- El resumen final muestra `Caso detectado` con edad laboral y relación contractual para que RRHH lea el contexto antes de finalizar.
- Los estados técnicos se traducen a copy operativo (`Definido por sistema`, `Necesario`, `Revisar`) sin exponer la matriz como concepto técnico.
- Se elimina el patrón visual `border-left` fuerte en los bloques de diagnóstico/coherencia y en la razón de condiciones detectadas; se mantienen fondos suaves y bordes completos coherentes con el ERP.
- Alcance respetado: sin SQL/RPC/RLS, sin motor, nómina, liquidaciones, LRE/Previred, ficha empleado, creación básica ni persistencia final de honorarios.

## EMP-ALTA-COHERENCIA-GLOBAL-01 - Matriz única de aplicabilidad y coherencia

Fecha: 2026-05-14

- Se implementa la regla pura `empleado-alta-aplicabilidad.rules.ts` para centralizar estados `required`, `optional`, `derived`, `not_applicable`, `review`, `warning` y `blocked` en Creación avanzada.
- La matriz cubre relación laboral, `tipo_trabajador`, contrato, jornada, remuneración/honorarios, Seguro de Cesantía, asignaciones, previsión/salud, APVI, banco, condiciones especiales y resumen final.
- El wizard consume la matriz para estados claros de `No aplica` y `Opcional`, evitando depender solo de condiciones sueltas repartidas en el componente.
- El resumen final agrega el bloque `Matriz de aplicabilidad`, separado de `Coherencia administrativa`, para distinguir qué corresponde exigir/mostrar versus qué combinación requiere revisión RRHH.
- Se agregan tests unitarios de aplicabilidad para contrato dependiente, honorarios, fecha término, previsión `NINGUNA` y menor de edad.
- Alcance respetado: sin SQL/RPC/RLS, sin motor, nómina, liquidaciones, LRE/Previred, ficha empleado, creación básica, persistencia final de honorarios ni estilos globales.

## EMP-ALTA-COHERENCIA-GLOBAL-00 - Auditoría de coherencia del alta avanzada

Fecha: 2026-05-13

- Se agrega documento de auditoría para unificar reglas de aplicabilidad, validación y coherencia administrativa del alta avanzada.
- Se inventarian campos por relación laboral `CONTRATO` / `HONORARIOS`, distinguiendo datos requeridos, derivados, no aplicables y bajo revisión.
- Se consolida matriz de comportamiento para `tipo_trabajador`, contrato, jornada, Seguro de Cesantía, previsión/salud, APVI, banco y condiciones especiales.
- Se documenta qué falta, qué sobra y qué debe alimentar la futura regla pura `empleado-alta-aplicabilidad.rules.ts`.
- Alcance respetado: fase documental, sin cambios funcionales en Angular, sin SQL/RPC/RLS, sin motor, nómina, liquidaciones, LRE, Previred, ficha empleado ni estilos globales.

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
- El formulario ya no usa `Tipo trabajador` para detectar pensionado/invalidez/extranjero/discapacidad; `tipo_trabajador` se mantiene como categoria base y esas situaciones quedan en Condiciones especiales.
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


## EMP-TIPO-TRABAJADOR-FLOW-01 - Categoria base derivada

Fecha: 2026-05-13

- Se integra el flujo correcto de `tipo_trabajador` en Creacion avanzada: `CONTRATO` deriva `DEPENDIENTE` y `HONORARIOS` deriva `INDEPENDIENTE`.
- El campo deja de operar como selector manual de condiciones y se muestra como dato derivado en el paso Contrato/Datos del servicio.
- Se elimina la autodeteccion de pensionado, invalidez, tecnico extranjero y discapacidad desde texto de `tipo_trabajador`; esas situaciones se mantienen como Condiciones especiales declaradas por RRHH.
- La autodeteccion actual queda limitada a fuentes reales del flujo: menor de 18 por fechas y regimen previsional `NINGUNA` como exencion de pension a revisar.
- Alcance respetado: sin SQL/RPC/RLS, sin motor, sin nomina, sin liquidaciones, sin creacion basica, sin ficha empleado y sin estilos globales.

## ERP-AUDIT-REPAIR-UX-01 - Auditoria controlada UX/UI

Fecha: 2026-05-15

- Se acota la reparacion a Nomina mensual / Preparar nomina por hallazgo real: confirmaciones criticas aun usaban `window.confirm`.
- Guardar resultado preliminar, aprobar resultado preliminar y cerrar nomina ahora usan `app-message-box` modal con motivo, alcance, puntos de revision RRHH y acciones claras.
- Las acciones de servicio se ejecutan solo despues de confirmar en el modal; cancelar no persiste cambios.
- Se actualiza el spec del contenedor para cubrir que no guarda, aprueba ni cierra antes de la confirmacion.
- Alcance respetado: sin SQL/RPC/RLS, sin motor, sin cambios de liquidaciones, sin estilos globales ni configuracion Angular/Tailwind/PostCSS.

## EMP-ADV-BITACORA-LABORAL-UX-01 - Bitácora Laboral en Creación avanzada

Fecha: 2026-05-15

- Creación avanzada adopta el patrón visual local `Bitácora laboral`: alta del trabajador como ficha en construcción, registros agrupados, decisiones visibles y cierre como acta.
- El mapa lateral se agrupa en `Identidad`, `Relación laboral`, `Pago y previsión` y `Revisión`; los pasos pasan a numeración de registro `01`, `02`, etc.
- Se ajusta el lenguaje visible de estados para RRHH: `En edición`, `Listo`, `Requiere datos`, `Revisar`, `Solo si aplica` y `No requerido`.
- El header del paso muestra el tipo de registro (`Registro de identidad`, `Registro laboral`, `Registro de pago y previsión`, `Registro de revisión`, `Acta de revisión`) y separa título/copy con jerarquía más editorial.
- APVI no requerido/opcional se presenta como tarjeta de decisión con contexto y siguiente acción, evitando alertas genéricas vacías.
- `Resumen final` pasa a `Acta de revisión de la ficha`; `Estado por etapa` pasa a `Registros de la bitácora`; `Coherencia administrativa` pasa a `Revisión guiada`.
- Se agregan variables CSS locales scoped a `.advanced-create-shell` para un tono de papel técnico administrativo, sin tocar estilos globales ni cargar fuentes nuevas.
- Alcance respetado: sin SQL/RPC/RLS, sin motor, sin nómina, sin liquidaciones, sin persistencia crítica, sin mappers, sin creación básica, sin ficha empleado y sin estilos globales protegidos.
- Validaciones: `npm ci --ignore-scripts` OK; `npx tsc -p tsconfig.app.json --noEmit` OK; `npx tsc -p tsconfig.spec.json --noEmit` OK; `npm run build -- --configuration development` OK con warning preexistente de `@import` en `src/styles/tailwind.css`; `npx vitest run` de reglas empleados OK, 18 tests. `npm test -- --watch=false` quedó en timeout de sandbox durante la ejecución completa.

## ERP-NOIA-BITACORA-OPERATIVA-00 - Identidad global NOIA / Bitacora Operativa

Fecha: 2026-05-15

- Se documenta la identidad global del ERP como `Bitacora Operativa` bajo criterio NOIA: sobria, administrativa, humana, trazable y enfocada en cerrar periodos.
- Se crea `docs/codex/diseno/bitacora-operativa-noia.md` como guia rectora para pantallas y futuras fases UX.
- Se define gramatica visual por modulo: Empleados, Nomina mensual, Movimientos de remuneracion, Conceptos, Parametros, Liquidaciones y Reportes.
- Se registra la decision de evolucion futura: unificar visualmente `Movimientos del mes` y `Asignaciones recurrentes` bajo `Movimientos de remuneracion`, separando conceptos del catalogo.
- Alcance respetado: fase documental; sin Angular, HTML, CSS, SQL/RPC/RLS, rutas, servicios, motor de nomina, estilos globales ni cambios funcionales.

## ERP-SHELL-BITACORA-OPERATIVA-01 - Shell con Bitacora Operativa

Fecha: 2026-05-15

- Se aplica la identidad `NOIA / Bitacora Operativa` al marco comun: shell, header, sidebar, titulos, breadcrumbs, cards, badges, botones, tablas y empty states base.
- El header comunica `Bitacora operativa` y mantiene el periodo activo como contexto de trabajo.
- El sidebar queda agrupado por sentido operativo: Inicio, Personas, Remuneraciones y Administracion, manteniendo rutas existentes.
- `app-data-grid` adopta paleta administrativa, filtros sobrios, seleccion sin barra lateral fuerte y empty states con causa/accion.
- `app-search-select` y `app-message-box` se alinean al mismo tono: bordes completos, fondos suaves funcionales y sin sombras o barras decorativas fuertes.
- Se documenta la fase en `docs/codex/diseno/erp-shell-bitacora-operativa-01.md`.
- Alcance respetado: sin SQL/RPC/RLS, sin motor, sin servicios de negocio, sin mappers, sin persistencia critica, sin fuentes nuevas y sin unificar movimientos.

## PARAM-NOIA-CIERRE-UX-01 - Cierre operativo de Parametros

Fecha: 2026-05-15

- El modulo Parametros se reorganiza como panel normativo operativo del periodo, con lectura clara de estado, faltantes, impacto y siguiente accion.
- Se agrega `Cierre normativo del periodo`, estados por pestana y resumen de secciones listas o pendientes.
- Se aplica criterio `NOIA / Bitacora Operativa`: bordes completos, fondos funcionales, menos azul dominante y lenguaje administrativo.
- Se incorpora `PARAM-MENSUAL-OVERWRITE-GUARD-01` con wrapper `scripts/run-parametros-mensuales.ps1`.
- El wrapper genera SQL mensual, no aplica por defecto, revisa datos existentes antes de aplicar y exige `-Force` si detecta registros del periodo.
- Angular no aplica cargas mensuales full; si la carga se ejecuta desde terminal, la proteccion vive en el wrapper.
- No se toca SQL estructural, RLS/RPC, motor, nomina, liquidaciones, estilos globales protegidos ni budgets.

## PARAM-CLIENT-CONFIG-SEPARATION-AUDIT-01 - Auditoria oficial vs configuracion cliente

Fecha: 2026-05-15

- Se audita la separacion entre `parametros_generales` como snapshot oficial mensual y `parametros_generales_cliente` como configuracion cliente protegida.
- Se verifica que el flujo Python mensual no escriba ni reemplace `parametros_generales_cliente`.
- Se confirma que la UI de Parametros guarda configuracion editable en `parametros_generales_cliente` y mantiene reconciliacion frente a oficiales.
- Se revisa el wrapper `scripts/run-parametros-mensuales.ps1` para distinguir datos oficiales existentes de configuracion cliente existente antes de aplicar SQL mensual.
- Se documenta que `-Force` autoriza reemplazar/actualizar snapshot oficial del periodo, pero no debe interpretarse como permiso para pisar configuracion cliente.
- No se toca SQL estructural, RLS/RPC, motor, nomina/liquidaciones, estilos globales protegidos ni budgets.

## PARAM-CLIENT-CONFIG-SEPARATION-FIX-01 - Ajustes de guardia oficial/cliente

Fecha: 2026-05-15

- Se ajusta la guardia del wrapper para informar configuracion cliente existente sin tratarla como objetivo de reemplazo por la carga oficial.
- Se separan en consola datos oficiales existentes, configuracion cliente existente y estado operativo del periodo.
- `-Force` queda descrito como autorizacion operativa para actualizar el snapshot oficial, no para modificar `parametros_generales_cliente`.
## PARAM-RECONCILIACION-MSGBOX-FIX-01 - Ajuste de decision Revisar despues

Fecha: 2026-05-15

- Se ajusta la reconciliacion oficial/cliente en Parametros para que `Revisar despues` quede como decision explicita y no reabra el MsgBox en bucle.
- El MsgBox de diferencias mantiene la regla de no actualizar automaticamente `parametros_generales_cliente`.
- `Actualizar con oficiales` sigue copiando el snapshot oficial hacia la configuracion cliente mediante el flujo existente.
- `Mantener mi configuracion` conserva los valores cliente y registra la decision.
- `Revisar despues` conserva los valores cliente, registra la postergacion y deja la revision disponible sin interrumpir repetidamente.
- No se toca Python, wrapper, SQL estructural, RLS/RPC, motor, nomina, liquidaciones ni estilos globales protegidos.
## NOM-MOVIMIENTOS-SIMPLE-01 - Primera experiencia visible de movimientos

Fecha: 2026-05-15

- El menu de Remuneraciones simplifica el acceso visible a `Movimientos`.
- La pantalla mensual se presenta como `Movimientos de remuneracion` con vistas `Este mes`, `Recurrentes` y `Todos` preparado como pendiente.
- `Asignaciones recurrentes` queda tratada como vista `Recurrentes`, sin eliminar su ruta ni logica actual.
- Preparar nomina, Dashboard y Reportes alinean enlaces y textos hacia `Movimientos de remuneracion`.
- `En cuotas` queda explicado como duracion para prestamos, anticipos o descuentos pactados, sin implementar calculo ni persistencia nueva.
- Alcance respetado: sin SQL/RPC/RLS, sin motor, sin servicios productivos, sin mappers, sin payloads, sin persistencia critica y sin estilos globales protegidos.

## NOM-MOVIMIENTOS-SIMPLE-01-FORM-POLISH - Pulido modal Registrar movimiento

Fecha: 2026-05-15

- El modal `Registrar movimiento` queda organizado en cuatro bloques: Movimiento, Duracion del movimiento, Detalle administrativo opcional y Resumen.
- Se agrega selector visible de duracion: `Solo este mes`, `Recurrente` y `En cuotas`.
- `En cuotas` muestra campos UI para cantidad de cuotas, monto por cuota, cuota inicial, periodo de inicio y periodo estimado de termino.
- `Cantidad` administrativa queda aclarada como dato de unidad, no como cantidad de cuotas.
- El resumen operativo explica en lenguaje RRHH que se guardara, con resumen parcial si faltan trabajador, concepto o monto.
- Limite documentado: duracion/cuotas quedan como UI preparada y validacion local; no se agregan payloads, SQL, motor ni persistencia critica.

## NOM-MOVIMIENTOS-POR-TRABAJADOR-01 - Movimientos por trabajador

Fecha: 2026-05-15

- `Movimientos de remuneracion` se reordena como grilla de trabajadores del periodo.
- Cada fila muestra contadores de movimientos del mes, recurrentes y pendientes de revision.
- Los contadores mayores a cero abren detalle filtrado; los ceros quedan neutros.
- `Gestionar`/`Asignar` abre contexto del trabajador antes de formularios.
- `Agregar movimiento del mes` abre el flujo mensual con trabajador precargado.
- `Agregar recurrente` navega al flujo recurrente existente filtrado por trabajador.
- Se corrige el modal mensual: ya no pregunta duracion ni muestra cuotas; cuotas queda como variante del recurrente.
- Alcance respetado: sin SQL/RPC/RLS, sin motor, sin persistencia critica, sin servicios/mappers/payloads productivos nuevos y sin estilos globales.

## ERP-NOIA-BREADCRUMB-GUARDRAIL-01 - Breadcrumb operativo obligatorio

Fecha: 2026-05-18

- Se integra el breadcrumb operativo al manual NOIA: guardrails, antipatrones, bases del sistema, prompt para Cursor/Codex y checklist de cierre.
- Regla: toda pantalla ERP nueva o redisenada debe iniciar con breadcrumb arriba a la izquierda, en lenguaje de negocio, con segmentos anteriores navegables y vista actual como texto.
- Se prohibe usar rutas tecnicas, tablas, RPC, enums, badges/cards o peso de CTA en el breadcrumb.
- Alcance respetado: fase documental; sin Angular, HTML/CSS productivo, estilos globales, rutas, servicios, motor, SQL/RPC/RLS ni persistencia.

## ERP-NOIA-DOCS-CIERRE-01 - Manual UI NOIA unificado

Fecha: 2026-05-18

- Se crea `docs/codex/diseno/noia-ui-manual.md` como fuente unica de decision UI NOIA.
- Se ordena la jerarquia documental: manual NOIA, contrato agente, guardrails, tokens/formularios, bases canonicas, antipatrones, modulo/fase y checklist.
- Se aclara el conflicto historico de "card principal": en NOIA se interpreta como superficie segun arquetipo; card solo si tiene entidad, decision o resumen autonomo.
- Se consolidan en el manual los antiguos auxiliares NOIA de tokens, layout, componentes, recetas, arquetipos y sistema de decision; esos archivos se retiran del set activo.
- Se actualizan README, contexto rapido, AGENTS, ui-form-guidelines, guardrails, prompt, bases, antipatrones y checklist para apuntar al manual.
- `.gitignore` deja versionables solo los documentos activos de `docs/codex/diseno/` y mantiene ignorados los documentos historicos/de fase.
- Alcance respetado: fase documental; sin Angular, HTML/CSS productivo, estilos globales, rutas, servicios, motor, SQL/RPC/RLS ni persistencia.
