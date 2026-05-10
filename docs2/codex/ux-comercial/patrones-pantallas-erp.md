# Patrones de pantallas ERP

## Objetivo

Definir estructuras reutilizables para que Cursor mejore pantallas sin redisenar cada modulo desde cero.

## Patron base de pantalla operativa

```txt
page-shell
  breadcrumb / modulo
  titulo + descripcion corta
  actions-toolbar
  estado-principal-card
  siguiente-accion-card
  grid-resumen
  bloqueos-advertencias-info
  detalle-operativo
  trazabilidad-tecnica
```

## Header recomendado

Debe contener:

```txt
- modulo o breadcrumb
- titulo claro
- periodo activo si aplica
- accion primaria
- acciones secundarias agrupadas
```

Ejemplo:

```txt
Preparar nomina
Periodo 2026-04
Estado: Resultado aprobado operativamente
[ Cerrar nomina del periodo ] [ Revisar resultado ]
```

## Card de estado principal

Debe responder:

```txt
que esta pasando
si se puede avanzar
que falta
cual es la siguiente accion
```

Estructura:

```txt
Titulo de estado
Descripcion de 1 linea
Indicadores clave
CTA primario
Razon visible si CTA esta deshabilitado
```

## Siguiente accion

Regla:

```txt
Si la pantalla tiene muchas acciones, Cursor debe destacar solo la siguiente accion recomendada.
```

Ejemplo:

| Estado | Siguiente accion |
|---|---|
| Sin periodo | Seleccionar periodo. |
| Periodo con pendientes | Revisar bloqueos. |
| Resultado calculado | Guardar resultado preliminar. |
| Resultado guardado | Aprobar operativamente. |
| Aprobado | Cerrar nomina del periodo. |
| Cerrado | Consultar liquidaciones / generar liquidaciones si existe fase. |

## Grillas

Las grillas deben:

```txt
mostrar columnas humanas primero
ocultar tecnico al final o secundario
usar empty state distinto para sin datos vs filtros vs error
mantener acciones por fila claras
```

Orden de columnas recomendado:

```txt
estado
nombre / entidad
rut o identificador humano
monto o dato principal
observaciones
accion sugerida
tecnico secundario
```

## Formularios

Mantener:

```txt
secciones cortas
labels claros
helper si el campo afecta nomina
validacion visible cerca del campo
resumen lateral o inferior para formularios largos
footer estable
```

## Empty states

Cada empty state debe decir:

```txt
que no hay
por que importa
que accion tomar
```

Ejemplos:

```txt
No hay movimientos del mes.
Puedes calcular la nomina si no existen bonos, descuentos o ajustes variables para este periodo.
[ Registrar movimiento ]
```

```txt
No hay resultado guardado.
Calcula y guarda un resultado preliminar antes de aprobar la nomina.
[ Calcular preliminar ]
```

## Trazabilidad tecnica

Debe existir, pero no arriba.

Ubicacion recomendada:

```txt
al final
acordeon
card secundaria
texto menor
```

Contenido permitido:

```txt
version calculo
identificador tecnico
hash
id_calculo_periodo
fecha generacion
fuente de datos
```

## Anti-regla

No usar una tabla gigante como unica experiencia de pantalla si el flujo necesita decision.
