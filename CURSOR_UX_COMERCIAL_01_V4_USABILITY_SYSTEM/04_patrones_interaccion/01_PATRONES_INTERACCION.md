# 01_PATRONES_INTERACCION

## Patron: Next Best Action

Cada pantalla operativa debe tener una accion recomendada.

Formato:

```txt
Titulo: Siguiente accion
Accion: Verbo + objeto
Motivo: por que corresponde
Boton: accion primaria
Links: acciones relacionadas
Bloqueo: motivo visible
```

## Patron: Progressive Disclosure

Mostrar primero:

```txt
estado
totales
accion
```

Mostrar despues:

```txt
detalle
observaciones
tecnico
```

## Patron: Estado + Motivo + Accion

Para bloqueos:

```txt
No se puede calcular.
Motivo: faltan parametros obligatorios.
Accion: Revisar parametros.
```

## Patron: Confirmacion segura

Para acciones importantes:

```txt
Que hara
Que no hara
Consecuencia
Cancelar
Confirmar
```

Ejemplo:

```txt
Generar liquidaciones oficiales
Usara la nomina cerrada.
No recalcula montos.
No genera PDF ni salidas legales.
```

## Patron: Futuro no activo

Futuro:

```txt
Disponible en fase posterior
```

No:

```txt
boton azul activo
```

## Patron: Trazabilidad secundaria

Mostrar como:

```txt
Detalle tecnico
```

con menor jerarquia.
