# Contrato general - Liquidaciones oficiales

## Definicion

La liquidacion oficial interna v1 es el comprobante persistido por trabajador generado desde una nomina cerrada operativamente.

## Fuente de verdad

```txt
snapshot cerrado de nomina
```

## NOM-MENSUAL-CONFIRMACION-FLOW-00 - Entrada oficial

Para usuario final, la fuente de entrada debe comunicarse como:

```txt
nómina mensual confirmada
```

La nocion tecnica de `snapshot cerrado de nomina` sigue siendo valida internamente, pero no debe dominar el copy visible. Liquidaciones oficiales materializa la nómina mensual confirmada y no recalcula parametros, movimientos, recurrentes ni datos vivos.


No usa parametros vivos para recalcular.

## Persistencia

Tablas:

```txt
nomina_liquidacion_periodo
nomina_liquidacion_trabajador
nomina_liquidacion_concepto
```

RPC:

```txt
generar_liquidaciones_oficiales
```

## Seguridad

```txt
SECURITY INVOKER
authenticated puede ejecutar
anon/PUBLIC revocados
sin service_role desde frontend
```

## Precondiciones

```txt
snapshot activo
snapshot aprobado operativamente
snapshot cerrado operativamente
snapshot no reemplazado
trabajadores existentes
sin duplicado activo por id_calculo_periodo
usuario authenticated
```

## Salida visible

```txt
resumen periodo
total trabajadores
total haberes
total descuentos
liquido total
grilla trabajadores
detalle conceptos por trabajador
```

## Regla UX de periodo

La pantalla consume el periodo activo global del header/padre. No debe mostrar un segundo selector editable local salvo una futura vista historica explicitamente documentada. El periodo se presenta como contexto compacto y la accion principal depende del estado: volver a Preparar nomina, generar liquidaciones oficiales o revisar liquidaciones existentes.

## Fuera de alcance

```txt
PDF
firma
envio
Previred
LRE
banco
contabilidad
reapertura
anulacion
rectificacion
reliquidacion
```

## Regla de no recalculo

La RPC y la UI deben conservar esta regla:

```txt
Liquidaciones oficiales no recalcula; persiste totales desde el snapshot cerrado.
```

## REM-PERIOD-GLOBAL-01 / REM-NAV-IA-01 - Ruta visible y periodo global

La ruta visible principal del modulo es:

```txt
/remuneraciones/liquidaciones
```

`/remuneraciones/liquidaciones-oficiales` queda como redirect compatible para no romper enlaces antiguos. El detalle canonico es `/remuneraciones/liquidaciones/:id`.

La pantalla debe mostrar una sola referencia fuerte al periodo activo, limpiar trabajador/detalle al cambiar el periodo global y dejar `Informacion interna y alcance` al final. No debe usar la trazabilidad como titulo principal.
