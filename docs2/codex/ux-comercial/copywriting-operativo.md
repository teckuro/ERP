# Copywriting operativo para RRHH

## Objetivo

Estandarizar el lenguaje visible del ERP para que sea claro, comercial y operativo.

## Reglas

- Usar verbos de accion.
- Evitar nombres de tablas o campos tecnicos.
- Evitar `issue`, `hash`, `payload`, `snapshot` como texto principal.
- Mantener detalle tecnico como secundario.
- Explicar consecuencias de acciones criticas.
- No prometer funciones futuras como disponibles.

## Diccionario visible

| Tecnico / antiguo | Visible recomendado |
|---|---|
| Proceso mensual | Preparar nomina |
| Motor | Calculo de nomina |
| Novedades mensuales | Movimientos del mes |
| Haberes y descuentos | Asignaciones recurrentes |
| Issues | Observaciones |
| Hash | Identificador tecnico |
| Version calculo | Version del calculo |
| Pre-nomina | Base de nomina |
| Snapshot | Resultado guardado desde BD / resultado guardado |
| id_persona | Trabajador |
| id_concepto | Concepto |

## Mensajes por estado

| Estado | Copy sugerido |
|---|---|
| Sin resultado | Calcula un resultado preliminar para revisar la nomina del periodo. |
| Guardado | El resultado preliminar esta guardado y puede revisarse antes de aprobar. |
| Aprobado | El resultado fue aprobado operativamente. Aun no corresponde a cierre legal ni liquidaciones oficiales. |
| Cerrado futuro | La nomina del periodo quedara congelada para continuar con liquidaciones oficiales. |
| Funcion futura | Esta etapa se habilitara en una fase posterior. |

## Confirmaciones

### Guardar resultado preliminar

```txt
Guardar resultado preliminar

Se guardara una version revisable del calculo de nomina.
No se emitiran liquidaciones, no se cerrara el periodo y no se generaran archivos legales.
```

### Aprobar operativamente

```txt
Aprobar resultado preliminar

Confirmas que el resultado guardado fue revisado operativamente.
Esta aprobacion no emite liquidaciones ni cierra el periodo.
```

### Cerrar nomina del periodo

```txt
Cerrar nomina del periodo

Esta accion congelara el resultado aprobado y bloqueara nuevos calculos o reemplazos mientras no exista flujo de reapertura.
No se emitiran liquidaciones oficiales ni se generaran archivos Previred, LRE, banco o PDF.
```
