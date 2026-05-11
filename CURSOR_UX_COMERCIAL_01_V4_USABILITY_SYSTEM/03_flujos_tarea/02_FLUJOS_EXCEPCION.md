# 02_FLUJOS_EXCEPCION

## Sin periodo validado

Mostrar:

```txt
Valida el periodo para revisar trabajadores, parametros y movimientos.
```

CTA:

```txt
Validar periodo
```

## Con bloqueos

Mostrar:

```txt
No puedes calcular todavia.
```

Cada bloqueo:

```txt
motivo
impacto
accion sugerida
```

## Sin movimientos

No bloquear por defecto.

Mostrar:

```txt
No hay movimientos del mes.
Puedes continuar si no existen bonos, descuentos o anticipos para este periodo.
```

## Sin asignaciones

No bloquear por defecto.

Mostrar:

```txt
No hay asignaciones recurrentes registradas para este trabajador/periodo.
```

## Sin cierre

Liquidaciones:

```txt
Aun no puedes generar liquidaciones oficiales.
Primero debes cerrar operativamente la nomina.
```

## Liquidaciones ya generadas

No regenerar sin flujo futuro.

Mostrar:

```txt
Las liquidaciones ya fueron generadas. Puedes revisar el detalle por trabajador.
```

## Detalle inexistente

Mostrar empty state con CTA. No pantalla blanca.
