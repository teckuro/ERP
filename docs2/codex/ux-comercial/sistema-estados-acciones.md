# Sistema de estados y acciones

## Objetivo

Estandarizar como el ERP muestra estados, bloqueos, advertencias, informacion y acciones recomendadas.

## Modelo base

Cada modulo operativo debe poder entregar:

```txt
estado_actual
severidad
resumen
bloqueos[]
advertencias[]
informaciones[]
siguiente_accion
acciones_disponibles[]
acciones_bloqueadas[]
```

## Separacion de severidades

| Severidad | Bloquea | Uso |
|---|---:|---|
| bloqueo | Si | Impide avanzar o guardar. |
| advertencia | No por defecto | Permite avanzar con criterio. |
| informacion | No | Contexto o trazabilidad. |

## Reglas

- Un bloqueo siempre debe tener accion sugerida.
- Una advertencia debe decir impacto posible.
- Una informacion no debe ocupar visualmente el lugar de un bloqueo.
- Si un boton esta deshabilitado, debe existir una razon visible.
- No usar `issues` como texto visible principal. Usar `observaciones`, `bloqueos`, `advertencias` o `informacion`.

## Estados canonicos por flujo mensual

| Momento | Estado visible | CTA primario |
|---|---|---|
| Sin periodo | Selecciona un periodo | Seleccionar periodo |
| Periodo validado | Periodo listo para revisar | Generar base |
| Base generada | Base de nomina lista | Calcular preliminar |
| Resultado calculado | Resultado preliminar disponible | Guardar resultado preliminar |
| Resultado guardado | Resultado guardado desde BD | Aprobar operativamente |
| Resultado aprobado | Resultado aprobado operativamente | Cerrar nomina del periodo |
| Nomina cerrada | Nomina cerrada operativamente | Ver liquidaciones / Generar liquidaciones si existe fase |

## Estados futuros

No mostrar como implementado:

```txt
liquidaciones oficiales
Previred
LRE
banco
contabilidad
```

Si se muestran en UI, deben aparecer como:

```txt
fase futura
no disponible todavia
requiere cierre/liquidacion previa
```

## Mensajes de bloqueo recomendados

| Caso | Mensaje |
|---|---|
| No hay snapshot | Guarda un resultado preliminar antes de continuar. |
| No aprobado | Aprueba operativamente el resultado guardado antes de cerrar. |
| Hay cambios sin guardar | Guarda el resultado actualizado antes de aprobar o cerrar. |
| Periodo cerrado | La nomina del periodo esta cerrada operativamente. Para modificarla se requiere flujo de reapertura. |
| Falta ficha trabajador | Completa la ficha del trabajador antes de incluirlo en nomina. |
| Falta parametro critico | Completa los parametros minimos del periodo antes de calcular. |

## Reglas para Cursor

Cursor debe revisar estados antes de tocar visual:

```txt
1. donde se calcula estado
2. que bloquea accion
3. que texto ve el usuario
4. si hay razon visible para boton deshabilitado
5. si hay test asociado
```
