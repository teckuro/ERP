# 02_PRINCIPIOS_APLICADOS

## 1. No esconder estado critico

Nunca meter en collapsable:

```txt
bloqueos que impiden calcular
siguiente accion
estado principal
```

Se puede colapsar:

```txt
detalle tecnico
observaciones extensas
filtros avanzados
salidas futuras
historial
```

## 2. Tabs para igualdad

Tabs solo si las opciones son del mismo nivel.

Ejemplo bueno:

```txt
Todas | Emitidas | Aprobadas | Pagadas
```

Ejemplo malo:

```txt
Preparar nomina | Empleados | Parametros
```

Eso son accesos o navegacion.

## 3. Quick links para rutas

Si lleva a otra pantalla, no es tab.

Usar:

```txt
quick link
button link
nav item
```

## 4. Cards para resumen

Una card debe resumir algo:

```txt
Trabajadores: 12
Liquido total: $...
Estado: Cerrado
```

No debe parecer pestaña.

## 5. Collapsible para profundidad

El collapsable reduce peso visual, pero no debe ocultar lo necesario para decidir.

## 6. Una sola accion principal

El usuario debe saber cual boton importa.

## 7. Densidad con proposito

Reducir alto sin hacer todo pequeño. El objetivo es legibilidad compacta.

## 8. Consistencia

Mismo patron en todas las pantallas:

```txt
Page header
Status strip
Main action
Summary
Content
Secondary/detail collapsables
```
