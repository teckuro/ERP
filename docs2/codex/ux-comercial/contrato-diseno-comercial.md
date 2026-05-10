# Contrato de diseno comercial del ERP

## Objetivo

Definir principios de diseno para transformar el ERP de remuneraciones en una experiencia usable, dinamica y comercial sin perder rigor operativo.

Este contrato aplica especialmente despues de `LIQ-OFICIAL-01`.

## Principios

| Principio | Regla |
|---|---|
| Claridad primero | Cada pantalla debe responder: estado actual, problema y siguiente accion. |
| Complejo por dentro | La complejidad legal/tecnica queda en trazabilidad secundaria. |
| Operativo por fuera | El usuario ve lenguaje RRHH, no nombres de tabla, hash o IDs como foco. |
| Accion guiada | Un CTA primario por momento; acciones secundarias agrupadas. |
| Estados visibles | Bloqueos, advertencias e informacion deben estar separados. |
| Demo vendible | Las pantallas clave deben entenderse en menos de 30 segundos. |
| Consistencia | Headers, cards, grillas, empty states y footers deben repetir patron. |
| Sin maquillaje falso | No ocultar pendientes reales con diseño. |

## Jerarquia visual sugerida

Cada pantalla operativa debe ordenarse asi:

```txt
Contexto del periodo / modulo
-> Estado principal
-> Siguiente accion recomendada
-> Resumen ejecutivo
-> Bloqueos / advertencias / informacion
-> Detalle operativo
-> Trazabilidad tecnica secundaria
```

## Densidad visual

Evitar dos extremos:

```txt
muy tecnico: demasiadas tablas, IDs, hashes y textos largos
muy comercial: tarjetas bonitas sin trazabilidad ni detalle operativo
```

Equilibrio recomendado:

```txt
resumen arriba
acciones visibles
detalle expandible o en cards ordenadas
tecnico al final
```

## Paleta conceptual de estados

No fijar colores exactos aqui; usar tokens del proyecto.

| Estado | Intencion visual |
|---|---|
| Listo | Seguro, estable, permite avanzar. |
| Pendiente | Neutro, indica que falta completar. |
| Advertencia | Atencion, permite avanzar con criterio. |
| Bloqueo | Critico, impide accion y exige resolver. |
| Cerrado | Estado final operativo, consulta habilitada y edicion bloqueada. |
| Futuro | Deshabilitado, explicado, sin prometer funcionalidad actual. |

## Reglas de CTAs

| Tipo | Regla |
|---|---|
| CTA primario | Solo uno por bloque o pantalla. Debe representar la siguiente accion real. |
| CTA secundario | Revisar, volver, ver detalle, consultar. |
| CTA peligroso | Debe pedir confirmacion y explicar consecuencia. |
| CTA futuro | Visible solo si ayuda a entender roadmap; deshabilitado y con helper claro. |

## Reglas de demostracion comercial

Pantallas prioritarias para demo:

```txt
Dashboard principal
Empleados/listado/ficha
Parametros del periodo
Preparar nomina
Liquidaciones oficiales
Resumen gerencial del mes
```

Cada una debe tener:

```txt
estado comprensible
datos de resumen
accion siguiente
empty state correcto
mensaje de bloqueo si no puede avanzar
sin IDs como contenido principal
```

## Fuera de alcance

Este contrato no autoriza:

```txt
cambiar formulas legales
cambiar motor
cambiar SQL/RPC/RLS
ocultar errores reales
inventar datos demo como productivos
marcar Previred/LRE/banco como implementados
```
