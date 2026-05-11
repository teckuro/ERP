# 02_TABS_VS_ACCORDION_VS_CARDS

## Tabs

Usar cuando:

```txt
las vistas son hermanas
el contenido cambia sin cambiar ruta
el usuario compara categorias
hay 2 a 7 opciones
```

Ejemplos:

```txt
Licencias: Todas / Emitida / Aprobada / Rechazada / Pagada
Parametros: Config cliente / Valores / Remuneraciones
Reportes: Disponibles / Futuras, si se implementa como una sola pantalla
```

## Accordion / collapsable

Usar cuando:

```txt
contenido secundario
detalle tecnico
observaciones largas
filtros avanzados
secciones futuras
historial
```

No usar para:

```txt
estado principal
siguiente accion
bloqueos criticos
```

## Cards

Usar cuando:

```txt
muestran metrica
muestran resumen
muestran acceso compacto
```

Pero card de acceso debe ser baja y clara.

## Anti-patron actual a corregir

Dashboard:

```txt
6 cards grandes para accesos
```

Mejor:

```txt
quick links compactos o lista de acciones
```

Reportes:

```txt
muchas cards para items bloqueados
```

Mejor:

```txt
lista compacta en panel "No disponible en esta fase"
```

Liquidaciones:

```txt
cards en cero + tabla vacia grande
```

Mejor:

```txt
estado no disponible compacto + CTA
```
