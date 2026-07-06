# NOIA — prompt para Cursor (copiar y pegar)

Usar en **User Rules**, **Project Rules** o al inicio de cada tarea UI.

---

## Prompt completo

```markdown
# ERP — UI obligatoria NOIA / Bitácora Operativa

Antes de planificar, codificar o responder sobre UI (HTML, CSS, copy, layout):

## Leer con Read (obligatorio)
0. docs/codex/diseno/noia-ui-manual.md
1. docs/codex/AGENTS.md
2. docs/codex/diseno/noia-bases-sistema-referencia.md
3. docs/codex/diseno/noia-ui-guardrails.md
4. docs/codex/diseno/noia-antipatrones-ia.md
5. Documento de fase/modulo del alcance
6. Al cerrar: docs/codex/diseno/noia-ui-review-checklist.md

Si falta alcance (pantalla, solo UI vs lógica, criterio de listo), preguntar antes de implementar.

## No inventar — reutilizar
- Flujo guiado / pasos / expediente → Creación avanzada: form-empleado.css, --bitacora-*, advanced-wizard-map, employee-section-*.
- Cierre de periodo / consola -> Nomina mensual: reutilizar `payroll-*`, pero el copy visible sigue `NOM-MENSUAL-CONFIRMACION-FLOW-00` (`Generar nomina`, `Revisar trabajadores`, `Confirmar nomina`, `Generar liquidaciones`).
- Ver noia-bases-sistema-referencia.md. No importar estética SaaS ni Tailwind marketing.

## Identidad (no negociable)
- Bitácora Operativa: qué pasa, qué falta, qué está listo, qué acción sigue.
- NOIA = no parecer IA: sin dashboard genérico, sin cards por defecto, sin textos largos.
- Fuente y colores del ERP actual. Sin Google Fonts. Sin tocar src/styles/*, angular.json, tailwind.config.*.
- Densidad compacta. Títulos moderados. Una acción principal por zona. Copy RRHH.
- Breadcrumb operativo arriba a la izquierda: dominio / flujo / vista actual, con nombres de negocio y sin rutas tecnicas.

## Colores — prohibido
- Púrpura, rosa, cyan neón, verdes/naranjas saturados decorativos, gradientes, sombras fuertes.
- Varios azules compitiendo en la misma vista.
- bg-[#hex] arbitrarios o paletas nuevas en CSS local.
- Azul institucional solo en UN CTA o foco por zona. Semántica: neutro / ámbar revisión / rojo bloqueo / verde listo (fondos suaves).

## Espacio — prohibido
- padding/gap inflados (p-8, gap-12, py-12), héroes vacíos, columnas muertas.
- Scroll para ver estado + CTA principal.
- Formularios full-width sin agrupación en pantallas anchas.
- Duplicar el mismo diagnóstico en header, centro, bandeja y acta.

## Layout
- Sin cards por defecto. Franja, consola, bandeja, panel dividido, tabla, MessageBox.
- Header con breadcrumb compacto antes del titulo; no usarlo como botonera, card, badge ni CTA.
- CSS local con prefijo del módulo. No muro de utilidades Tailwind en HTML si el contenedor ya usa .css propio.

## Técnico
- Sin tablas/RPC/enums/errores crudos visibles para RRHH (detalle técnico solo en modal secundario).
- Fase solo UI: no formControlName, servicios, persistencia, rutas, SQL, motor.

## Cierre
- Autorevisar noia-ui-review-checklist.md y noia-antipatrones-ia.md.
- Cambio visual → docs/codex/peticiones-estilos.md.
- Indicar qué se contrastó con docs/codex; archivos tocados y NO tocados (globales, motor, BD).

> No improvisar. No crear “cualquier cosa”. Diseñar como Bitácora Operativa NOIA.
```

---

## Prompt corto (cada tarea)

```text
UI ERP NOIA: lee noia-ui-manual.md + noia-ui-guardrails.md + noia-antipatrones-ia.md + fase del módulo. Reutiliza patrones del repo; breadcrumb operativo arriba a la izquierda; sin colores extravagantes, sin espacio inflado, sin cards por defecto, una CTA principal, CSS local. Cierra con noia-ui-review-checklist.md.
```

---

## Reglas ya en el repo

- `.cursor/rules/erp-ui-visual-guardrails.mdc`
- `.cursor/rules/erp-ui-noia.mdc`
