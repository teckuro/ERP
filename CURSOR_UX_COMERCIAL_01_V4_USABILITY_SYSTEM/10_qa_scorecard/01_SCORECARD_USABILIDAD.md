# 01_SCORECARD_USABILIDAD

Puntuar 0-10.

## Dimensiones

```txt
1. Orientacion: se donde estoy.
2. Estado: se en que estado esta el proceso.
3. Siguiente accion: se que hacer.
4. Prevencion de error: no puedo hacer acciones incorrectas.
5. Recuperacion: si algo falta, se como resolver.
6. Claridad de datos: veo resumen antes que detalle.
7. Empty states: me guian.
8. Honestidad: no promete futuro activo.
9. Consistencia: patron comun.
10. Demo-ready: no se ve roto.
```

## Minimos

```txt
Preparar nomina >= 8
Liquidaciones oficiales >= 8
Detalle liquidacion >= 8
Dashboard/reportes >= 7
Movimientos/asignaciones >= 7
Shell/header >= 7
```

## Rechazo automatico

```txt
Detalle liquidacion vacio sin CTA.
Boton activo Previred/LRE/banco/PDF si no existe.
Boton deshabilitado sin motivo.
Preparar nomina sin siguiente accion.
Liquidaciones sin explicar cierre.
```

## Resultado ejecucion 2026-05-10

```txt
Preparar nomina: 9/10
Liquidaciones oficiales: 9/10
Detalle liquidacion: 8/10
Dashboard/reportes: 8/10
Movimientos/asignaciones: 8/10
Shell/header: 8/10
```

Notas:

- Dashboard y Reportes separan capacidades futuras y no muestran acciones activas de salidas externas.
- Detalle vacio incluye CTA de regreso y CTA hacia Preparar nomina.
- Movimientos/asignaciones explican impacto en nomina y condicion de accion principal.
- Validacion automatica: `npx ng test --watch=false` OK, 43 archivos / 434 tests; `npm run build` OK con warnings CSS conocidos.
