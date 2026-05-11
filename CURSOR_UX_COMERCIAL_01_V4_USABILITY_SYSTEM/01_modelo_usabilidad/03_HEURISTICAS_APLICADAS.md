# 03_HEURISTICAS_APLICADAS

## 1. Visibilidad del estado del sistema

Aplicacion:

```txt
Periodo visible.
Estado de nomina visible.
Estado de cierre visible.
Estado de liquidaciones visible.
```

## 2. Lenguaje del usuario

Usar:

```txt
Resultado guardado
Observaciones
Liquidaciones generadas
Cerrado operativamente
```

Evitar:

```txt
snapshot
issues
RPC
hash
```

## 3. Control y libertad

Permitir volver:

```txt
Volver a Preparar nomina
Volver a Liquidaciones oficiales
Revisar movimientos
Revisar asignaciones
```

## 4. Consistencia

Mismo patron:

```txt
Header
Estado
Resumen
Siguiente accion
Contenido
Trazabilidad
```

## 5. Prevencion de errores

No permitir:

```txt
generar liquidaciones sin cierre
mostrar botones futuros activos
ejecutar acciones irreversibles sin confirmacion
```

## 6. Reconocimiento antes que memoria

Mostrar pasos:

```txt
Base -> Calculo -> Aprobacion -> Cierre -> Liquidaciones
```

## 7. Flexibilidad

Accesos directos:

```txt
Revisar parametros
Revisar movimientos
Revisar asignaciones
Ver liquidaciones
```

## 8. Minimalismo

No mostrar columnas/IDs tecnicos en primer nivel.

## 9. Recuperacion de errores

Cada error debe decir:

```txt
que paso
que no se hizo
que puede hacer el usuario
```

## 10. Ayuda contextual

Empty states y paneles deben explicar como avanzar.
