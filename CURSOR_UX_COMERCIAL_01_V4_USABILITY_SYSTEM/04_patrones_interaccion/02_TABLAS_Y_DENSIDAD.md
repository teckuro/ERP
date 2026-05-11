# 02_TABLAS_Y_DENSIDAD

## Reglas para grillas

Una tabla debe tener:

```txt
titulo
contador
filtros utiles
columnas minimas
accion clara
empty state
paginacion
```

## Columnas principales

Liquidaciones:

```txt
Trabajador
RUT
Estado
Haberes
Descuentos
Liquido
Accion
```

Detalles secundarios:

```txt
id
metadata
trazabilidad
```

van fuera de la tabla principal.

## Densidad

Evitar:

```txt
tablas con muchas columnas tecnicas
acciones comprimidas sin label
grillas dentro de cards demasiado estrechas
```

## Acciones

Iconos solos solo si son obvios. Preferir:

```txt
Ver detalle
Editar
Revisar
```

## Empty state de tabla

Debe incluir:

```txt
titulo
descripcion
CTA
```
