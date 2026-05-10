# CURSOR-UX-COMERCIAL-REVIEW-01 - Revision visual y comercial guiada

## Uso

Usar este prompt cuando se quiera que Cursor revise una pantalla desde perspectiva UX/comercial sin cambiar logica.

## Prompt base

```txt
IMPORTANTE
Antes de modificar, aplicar el contrato ERP UI/documental del proyecto.

Leer primero:
- .cursor/skills/erp-codex-docs/SKILL.md
- .cursor/rules/erp-codex-contract.mdc
- docs/codex/AGENTS.md
- docs/codex/ui-form-guidelines.md
- docs/codex/ui-button-guidelines.md
- docs/codex/ui-tables.md
- docs/codex/estilos/README.md
- docs/codex/peticiones-estilos.md
- docs/codex/ux-comercial/README.md
- docs/codex/ux-comercial/contrato-diseno-comercial.md
- docs/codex/ux-comercial/patrones-pantallas-erp.md
- docs/codex/ux-comercial/sistema-estados-acciones.md
- docs/codex/ux-comercial/checklist-cursor-ux.md

Aplicar flujo:
Aclarar -> Identificar -> Read -> Implementar -> Autorevisar -> Responder.

OBJETIVO
Mejorar la jerarquia visual, lenguaje operativo y claridad comercial de la pantalla [NOMBRE_PANTALLA], sin cambiar logica de negocio.

ALCANCE
Tocar solo:
- [archivo .html]
- [archivo .css/.scss]
- [archivo .ts solo si es necesario para view-model visual, no para negocio]
- documentacion en docs/codex/peticiones-estilos.md

NO TOCAR
- SQL/RPC/RLS
- motor de nomina
- formulas legales
- servicios de persistencia
- modelos de dominio
- rutas publicas
- package.json
- configuracion

REGLAS UX
Aplicar esta jerarquia:
1. Estado principal.
2. Siguiente accion recomendada.
3. Resumen ejecutivo.
4. Bloqueos / advertencias / informacion.
5. Detalle operativo.
6. Trazabilidad tecnica secundaria.

CRITERIOS
- Un CTA primario visible.
- Razon visible si un boton esta deshabilitado.
- Copy en lenguaje RRHH.
- No IDs/hash como contenido principal.
- Empty states especificos.
- No prometer funciones futuras como disponibles.

VALIDACION
Ejecutar:
- npx ng test --watch=false
- npm run build

RESPUESTA FINAL
Indicar:
- que cambio visual se hizo
- que no se toco
- tests/build
- si se actualizo peticiones-estilos.md
- capturas si se generaron
```
