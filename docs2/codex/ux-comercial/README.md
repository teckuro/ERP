# UX Comercial - Indice canonico

## Objetivo

Esta carpeta define la capa de diseno usable, dinamica y comercial del ERP de remuneraciones.

No reemplaza las guias UI existentes. Las complementa con una vision de producto vendible para la etapa posterior a `LIQ-OFICIAL-01`.

```txt
flujo funcional correcto
-> liquidaciones oficiales
-> experiencia comercial clara
-> demo vendible
-> luego Previred/LRE/banco/contabilidad
```

## Estado

| Area | Estado | Nota |
|---|---|---|
| Preparar nomina | Validado hasta aprobacion operativa persistida | E2E real authenticated consolidado. |
| Cierre operativo | En diseno | `NOM-CIERRE-DESIGN-01`. |
| Liquidaciones oficiales | Futura | Antes de UX comercial fuerte. |
| UX comercial | Futura prioritaria despues de liquidaciones | No iniciar antes de tener flujo demostrable. |
| Previred/LRE/Banco/Contabilidad | Futuras | No son prioridad inmediata. |

## Documentos de esta carpeta

| Documento | Proposito |
|---|---|
| `contrato-diseno-comercial.md` | Principios visuales y de experiencia para el ERP vendible. |
| `patrones-pantallas-erp.md` | Estructura recomendada de pantallas, cards, headers, estados y acciones. |
| `sistema-estados-acciones.md` | Reglas de estados, bloqueos, advertencias, siguiente accion y CTA. |
| `dashboard-comercial-remuneraciones.md` | Propuesta de dashboard comercial/operativo posterior a liquidaciones. |
| `copywriting-operativo.md` | Lenguaje visible para RRHH, evitando jerga tecnica. |
| `checklist-cursor-ux.md` | Tips concretos para Cursor antes de tocar UI. |
| `anti-patrones-ui.md` | Errores visuales y de UX que Cursor debe evitar. |

## Lectura obligatoria antes de cambios visuales

```txt
1. docs/codex/AGENTS.md
2. docs/codex/ui-form-guidelines.md
3. docs/codex/ui-button-guidelines.md
4. docs/codex/ui-tables.md
5. docs/codex/estilos/README.md
6. docs/codex/peticiones-estilos.md
7. docs/codex/ux-comercial/contrato-diseno-comercial.md
8. docs/codex/ux-comercial/checklist-cursor-ux.md
```

## Regla de oro

```txt
No hacer la UI bonita a costa de perder trazabilidad, estados, bloqueos o acciones claras.
```

La interfaz debe ser:

```txt
simple por fuera
trazable por dentro
guiada por estados
orientada a la siguiente accion
lista para demo comercial
```
