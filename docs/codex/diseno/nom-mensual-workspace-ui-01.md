# NOM-MENSUAL-WORKSPACE-UI-01 - Nomina mensual como workspace operativo

Fecha: 2026-05-18

## Problema visual anterior

La pantalla de proceso mensual todavia se entendia como preparacion tecnica del periodo: validar datos, construir base, calcular, aprobar y cerrar. Ese lenguaje dejaba el diagnostico tecnico por sobre el ciclo real de RRHH y debilitaba la decision documentada en `NOM-MENSUAL-CONFIRMACION-FLOW-00`.

## Nueva orientacion

La pantalla principal debe leerse como **Nomina mensual** del periodo:

```txt
Generar nomina
-> Revisar trabajadores
-> Confirmar nomina
-> Generar liquidaciones
```

La nomina mensual confirmada se expresa como base oficial para liquidaciones. La implementacion mantiene la logica existente de prevalidacion, calculo, version revisable y cierre operativo, pero el copy visible prioriza el flujo operativo de RRHH.

## Decisiones UI aplicadas

- Header compacto con titulo `Nomina mensual`, periodo activo y estado operativo.
- Rail izquierdo con bitacora del periodo arriba y resumen de revision abajo.
- Area principal derecha con estado actual, descripcion breve y una CTA principal segun estado.
- Acciones tecnicas quedan como soporte o detalle secundario.
- Confirmacion y liquidaciones se muestran como continuidad del flujo sin inventar persistencia nueva.

## Que se cambio

- `Preparar nomina` deja de ser el titulo visible principal.
- Los estados y CTAs visibles pasan a `Sin generar`, `Borrador generado`, `En revision`, `Lista para confirmar`, `Nomina confirmada` y `Liquidaciones disponibles`.
- La bitacora visible usa `Generar nomina`, `Revisar trabajadores`, `Resolver pendientes`, `Confirmar nomina` y `Generar liquidaciones`.
- El copy principal evita `construir base`, `aprobacion/cierre` y diagnostico tecnico como lenguaje dominante.
- El disclosure interno declara que la nomina confirmada sera la base oficial para liquidaciones.

## Que no se toco

- Sin SQL/RPC/RLS.
- Sin motor de remuneraciones.
- Sin servicios ni persistencia nueva.
- Sin rutas, mappers ni payloads.
- Sin estilos globales.
- Sin confirmacion real nueva ni generacion productiva nueva de liquidaciones.

## Validaciones ejecutadas

```bash
npm ci --ignore-scripts --no-audit --no-fund
# No completo: Windows bloqueo unlink de lightningcss.win32-x64-msvc.node.

npm install --ignore-scripts --no-audit --no-fund
# Completo con warnings de cleanup por binarios nativos bloqueados.

npx tsc -p tsconfig.app.json --noEmit
# OK

npx tsc -p tsconfig.spec.json --noEmit
# OK

npm run build -- --configuration development
# OK
```

## Restricciones respetadas

- Se reutiliza el patron existente `payroll-*`: header, franja compacta, rail izquierdo, foco principal y detalle secundario.
- No se agregan cards genericas, gradientes, sombras fuertes, colores nuevos ni espacio inflado.
- Se conserva una accion principal por estado.
- La revision se expresa por trabajadores y pendientes operativos.
- La regla `Nomina mensual confirmada = fuente oficial para generar liquidaciones` queda reforzada en UI y documentacion, sin implementar persistencia nueva.
