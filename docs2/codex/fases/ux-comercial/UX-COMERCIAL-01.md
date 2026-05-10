# UX-COMERCIAL-01 - Redisenar experiencia usable, dinamica y comercial

## Objetivo

Convertir el ERP funcional hasta liquidaciones oficiales en una experiencia mas clara, vendible y atractiva para usuario final.

Esta fase debe iniciar despues de:

```txt
NOM-CIERRE-01
LIQ-DESIGN-01
LIQ-OFICIAL-01
```

## Alcance

- Dashboard comercial de remuneraciones.
- Navegacion simplificada por tareas.
- Estados visuales coherentes.
- Guiado por siguiente accion.
- Reduccion de texto tecnico visible.
- Trazabilidad secundaria ordenada.
- Empty states especificos.
- Copy operativo para RRHH.
- Mejora de pantallas demostrables.
- Checklist visual para demo comercial.

## Fuera de alcance

- Previred operativo.
- LRE operativo.
- Archivo banco.
- Contabilidad.
- Reapertura avanzada.
- Redisenar formulas o motor legal.
- Cambiar SQL/RPC/RLS sin fase tecnica propia.

## Estado actual

**Estado:** `futura`  
**Tipo:** `visual` / `producto`  
**Modulo:** `Transversal`

Futura prioritaria despues de `LIQ-OFICIAL-01` segun decision de producto.

## Dependencias

| Dependencia | Motivo |
|---|---|
| `NOM-CIERRE-01` | El flujo debe cerrar nomina antes de mostrar experiencia completa. |
| `LIQ-DESIGN-01` | Liquidacion oficial debe tener contrato antes de rediseñar. |
| `LIQ-OFICIAL-01` | El producto debe ser demostrable hasta liquidacion. |

## Evidencia

Decision de roadmap:

```txt
Llegar hasta Liquidaciones oficiales y luego enfocar el ERP en diseno usable, dinamico y comercial.
```

## Reglas funcionales

- No sacrificar trazabilidad.
- No ocultar bloqueos criticos.
- Mantener lenguaje operativo de RRHH.
- Registrar cambios visuales en `peticiones-estilos.md`.
- No marcar funciones futuras como disponibles.
- No mezclar liquidacion oficial con Previred/LRE/banco.

## Flujo resumido

```txt
flujo funcional hasta liquidaciones
-> auditoria UX
-> dashboard comercial
-> navegacion guiada
-> rediseño de pantallas clave
-> demo vendible
```

## Pantallas prioritarias

| Pantalla | Objetivo UX |
|---|---|
| Dashboard principal | Estado del mes y siguiente accion. |
| Empleados | Aptitud para remuneraciones clara. |
| Parametros | Estado oficial/cliente y pendientes del periodo. |
| Preparar nomina | Flujo guiado hasta cierre. |
| Liquidaciones oficiales | Resultado final entendible y emitible. |
| Ficha trabajador | Lectura rapida y acciones claras. |

## Archivos relacionados

- `docs/codex/ux-comercial/README.md`
- `docs/codex/ux-comercial/contrato-diseno-comercial.md`
- `docs/codex/ux-comercial/patrones-pantallas-erp.md`
- `docs/codex/ux-comercial/sistema-estados-acciones.md`
- `docs/codex/ux-comercial/checklist-cursor-ux.md`
- `ui-form-guidelines.md`
- `ui-button-guidelines.md`
- `ui-tables.md`
- `estilos/README.md`
- `peticiones-estilos.md`

## Validacion esperada

- Capturas comparativas antes/despues.
- E2E criticos no rotos.
- `npx ng test --watch=false`.
- `npm run build`.
- Registro en `peticiones-estilos.md`.

## Criterios de cierre

- Experiencia vendible.
- Flujos principales claros.
- Menos jerga tecnica.
- Dashboard y estados entendibles.
- Botones bloqueados con razon visible.
- CTA primario por pantalla.
- Trazabilidad tecnica ordenada como secundaria.

## Pendientes

- Definir alcance visual por pantalla.
- Definir capturas base.
- Definir prototipo de dashboard.
- Definir si se usara biblioteca visual adicional o solo sistema actual.

## Relacion con fases siguientes

Despues de UX comercial, reabrir diseño Previred/LRE/banco/contabilidad.
