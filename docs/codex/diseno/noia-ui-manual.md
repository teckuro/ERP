# NOIA UI Manual - fuente unica de decision

Fase: `ERP-NOIA-DOCS-CIERRE-01`

Este documento ordena la base UI NOIA del ERP. Su objetivo no es duplicar todos los tokens ni todos los ejemplos, sino definir que documento manda, que documento sirve de referencia y que debe revisar un agente antes de crear o cambiar una pantalla.

## Regla madre

La UI del ERP se disena como **Bitacora Operativa**:

- que pasa;
- que falta;
- que esta listo;
- que accion sigue.

NOIA significa no parecer IA: sin dashboard SaaS generico, sin cards por defecto, sin espacio inflado, sin colores extravagantes, sin textos largos y sin detalles tecnicos expuestos a RRHH.

## Jerarquia de decision

Si hay conflicto, gana el documento de menor numero.

| Prioridad | Documento | Rol |
|-----------|-----------|-----|
| 1 | `docs/codex/diseno/noia-ui-manual.md` | Fuente unica de decision UI NOIA: jerarquia, flujo de trabajo, que crear y que no hacer |
| 2 | `docs/codex/AGENTS.md` | Contrato del agente: restricciones tecnicas, alcance, disciplina de cambios |
| 3 | `docs/codex/diseno/noia-ui-guardrails.md` | Reglas visuales obligatorias: anti-card, breadcrumb, CTA, copy RRHH, densidad |
| 4 | `docs/codex/ui-form-guidelines.md` | Tokens, formularios, MessageBox, loading, inputs, botones y grillas de captura |
| 5 | `docs/codex/diseno/noia-bases-sistema-referencia.md` | Ejemplos canonicos del repo que se deben copiar segun arquetipo |
| 6 | `docs/codex/diseno/noia-antipatrones-ia.md` | Lista de rechazo: colores, espacio, cards, Tailwind improvisado, ruido SaaS |
| 7 | Documento de modulo/fase | Reglas del flujo concreto y decisiones funcionales del alcance |
| 8 | `docs/codex/diseno/noia-ui-review-checklist.md` | Cierre obligatorio antes de responder |

`noia-prompt-cursor.md` es solo una ayuda operativa. Los antiguos auxiliares de tokens, layout, componentes, recetas y arquetipos fueron consolidados en este manual para evitar reglas paralelas.

## Regla modulo Nomina mensual

Para Nomina mensual aplica la decision `NOM-MENSUAL-CONFIRMACION-FLOW-00`: la pantalla visible debe entenderse como `Nomina mensual`, con accion inicial `Generar nomina`, revision trabajador por trabajador, confirmacion de nomina y generacion de liquidaciones desde la nomina confirmada.

`Preparar nomina` queda como referencia historica y tecnica del contenedor/patron `payroll-*`, no como concepto principal visible para RRHH.

Regla de trazabilidad:

```txt
Liquidaciones no se generan desde datos vivos.
Liquidaciones se generan desde nomina_mensual_confirmada o equivalente tecnico confirmado.
```

Documento rector: [`../modulos/nomina-mensual/nomina-mensual-confirmacion-flow.md`](../modulos/nomina-mensual/nomina-mensual-confirmacion-flow.md).

## Flujo obligatorio para una tarea UI

1. Leer este manual.
2. Leer `AGENTS.md`.
3. Leer `noia-ui-guardrails.md`.
4. Leer `noia-antipatrones-ia.md`.
5. Leer `noia-bases-sistema-referencia.md` y escoger arquetipo.
6. Leer el documento de modulo/fase.
7. Implementar con CSS local y prefijo del modulo.
8. Cerrar con `noia-ui-review-checklist.md`.
9. Si hubo cambio visual, registrar en `docs/codex/peticiones-estilos.md`.

Si falta pantalla, alcance, solo UI vs logica o criterio de listo, preguntar antes de implementar.

## Decision minima antes de tocar UI

Antes de codificar, completar mentalmente o en la respuesta:

```txt
Esta pantalla es un(a) __________.
La usa __________.
Su fuente de verdad es __________.
El usuario puede __________.
No debe __________.
Su estado principal es __________.
La accion recomendada es __________.
El riesgo principal es __________.
El patron visual correcto es __________.
```

Si no se puede completar, no se implementa UI todavia: se lee documentacion, se propone decision o se pide alcance.

## Que crear

- Breadcrumb operativo arriba a la izquierda: dominio / flujo / vista actual.
- Header compacto con titulo moderado.
- Una accion principal clara por zona.
- Franja operativa, consola, panel dividido, bitacora lateral, lista de revision, tabla contextual o MessageBox.
- Copy RRHH: estado, pendiente, impacto y siguiente accion.
- Modal secundario solo para detalle tecnico o diagnostico extendido.
- CSS local con prefijo del modulo.
- Reutilizacion de patrones reales del repo antes de inventar clases nuevas.

## Tokens y componentes permitidos

- Fuente del ERP actual; no Google Fonts ni cambios globales de `font-family`.
- Azul institucional solo para CTA principal, foco o enlace de accion puntual.
- Neutros para estructura; verde listo; ambar revisar; rojo bloqueo/error.
- Paneles rutinarios con padding 12-16px y gaps 10-16px.
- Bordes completos de 1px y radios contenidos.
- `app-message-box` para confirmaciones, advertencias, bloqueos y decisiones guiadas.
- Tablas/DataGrid con contexto humano, filtros secundarios y empty state con causa + accion.
- Modales solo para detalle profundo, diagnostico consolidado o soporte tecnico.

## Que no hacer

- No usar cards por defecto.
- No convertir el breadcrumb en card, badge, botonera ni CTA.
- No usar rutas tecnicas, tablas, RPC, enums, flags o errores crudos en pantalla principal.
- No duplicar diagnostico en header, centro, bandeja y acta.
- No inflar espacio con `p-8`, `gap-12`, heroes, columnas vacias o min-heights decorativos.
- No crear paletas nuevas, gradientes, sombras fuertes ni colores extravagantes.
- No mover CSS a global para esquivar budgets.
- No tocar servicios, rutas, persistencia, motor, SQL o `formControlName` si la fase es solo UI.

## Patrones activos

| Patron | Usar para |
|--------|-----------|
| Franja operativa | Estado principal + impacto + accion recomendada |
| Bitacora lateral | Orientar etapas, avance o trazabilidad |
| Consola central | Estado + CTA unico + copy corto |
| Panel dividido | Comparar dos fuentes o evidencias |
| Lista de revision | Pendientes, faltantes, bloqueos y checklist |
| Tabla contextual | Registros repetitivos con filtros sobrios |
| Disclosure | Detalle tecnico o informacion secundaria |
| MessageBox | Decision critica o bloqueo administrativo |

## Como resolver el conflicto "card principal"

`AGENTS.md` y `ui-form-guidelines.md` mencionan superficie/card principal porque muchas pantallas antiguas son formularios o mantenedores. En NOIA esa regla se interpreta asi:

- Formulario o mantenedor: puede usar una superficie principal con borde.
- Mesa operativa, cierre de periodo o bitacora: usar franja, consola, panel dividido o bitacora lateral.
- Card solo si contiene una entidad, decision o resumen autonomo con accion propia.

La regla anti-card de NOIA tiene prioridad cuando la card solo agrega marco visual.

## Arquetipos de referencia

| Tipo de pantalla | Copiar de |
|------------------|-----------|
| Expediente, alta guiada, pasos | Creacion avanzada de empleados: `form-empleado.*`, `advanced-*`, `employee-*`, `--bitacora-*` |
| Mesa de periodo, cierre, diagnostico | Nomina mensual: reutilizar el patron tecnico existente de `proceso-mensual-container.*` / `payroll-*`, pero con copy visible segun `NOM-MENSUAL-CONFIRMACION-FLOW-00` |
| Listado con filtros y tabla | Listados existentes y `app-data-grid` |
| Parametros / mantenedores densos | `parametros.page.ts` y reglas de grilla documentadas |

## Cierre

Una tarea UI NOIA no esta cerrada hasta que:

- pasa por `noia-ui-review-checklist.md`;
- declara que documentos se contrastaron;
- lista archivos tocados;
- declara no tocados: globales, rutas, servicios, motor, SQL/BD y persistencia, cuando aplique.
