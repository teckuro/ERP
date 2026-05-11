# 01_MODELO_MENTAL_USUARIO

## Usuario principal

RRHH / administrativo PYME.

No piensa en:

```txt
RPC
snapshot
hash
id_calculo_periodo
tablas
migraciones
```

Piensa en:

```txt
trabajadores
periodo
pendientes
calculo
aprobacion
cierre
liquidaciones
```

## Modelo mental objetivo

```txt
1. Tengo un periodo activo.
2. Debo revisar si los trabajadores estan aptos.
3. Debo revisar parametros, movimientos y asignaciones.
4. Puedo preparar la nomina.
5. El sistema me muestra si hay bloqueos.
6. Genero resultado preliminar.
7. Lo guardo.
8. Lo apruebo.
9. Lo cierro.
10. Genero liquidaciones internas.
```

## Objetivo de la UI

La UI debe transformar complejidad legal/tecnica en una secuencia guiada.

## Principios

```txt
mostrar estado antes que datos
mostrar accion antes que detalle
mostrar motivo antes que error tecnico
mostrar trazabilidad despues, no antes
```

## Fallos de usabilidad a evitar

```txt
usuario no sabe si puede avanzar
usuario ve boton deshabilitado sin razon
usuario cree que puede generar Previred/PDF cuando no puede
usuario entra a detalle vacio y no sabe que hacer
usuario ve tabla vacia sin contexto
```
