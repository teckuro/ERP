# NOM-02A - Benchmark funcional de novedades y pre-nomina

## 1. Objetivo

Definir la experiencia funcional recomendada para Novedades mensuales y Pre-nomina antes de ampliar UI o motor.

La conclusion base es que RRHH no necesita una tabla tecnica de movimientos, sino un flujo mensual claro: cargar, revisar, aprobar, prevalidar y preparar calculo.

## 2. Por que no basta un CRUD

Un CRUD simple permite crear registros, pero no resuelve preguntas operativas:

- que novedades faltan revisar;
- que trabajadores tienen pendientes;
- que conceptos no son validos;
- que novedades duplican una recurrente;
- que entra a pre-nomina;
- que queda bloqueado por periodo cerrado;
- que ya fue calculado.

## 3. Opciones de UI evaluadas

| Opcion | Ventaja | Riesgo | Recomendacion |
|---|---|---|---|
| CRUD simple | Rapido, facil de probar. | Muy tecnico; no refleja trabajo real de RRHH. | Usar solo como base inicial. |
| Planilla mensual | Familiar para RRHH, rapida para carga masiva. | Mayor complejidad, requiere validaciones robustas. | Fase posterior. |
| Flujo mixto | Equilibra claridad y velocidad. | Requiere buen diseno de estados y mensajes. | Recomendado. |

## 4. Flujo MVP recomendado

Novedades mensuales debe organizarse asi:

```txt
Novedades mensuales
  -> Resumen del periodo
  -> Carga rapida / nueva novedad
  -> Listado filtrable
  -> Revision y aprobacion
  -> Prevalidaciones basicas
  -> Preparar pre-nomina
```

## 5. Informacion que RRHH debe ver primero

- Periodo seleccionado.
- Total de novedades.
- Borradores.
- Pendientes de revision.
- Aprobadas.
- Observadas/rechazadas.
- Incorporadas a pre-nomina.
- Bloqueos del periodo.

## 6. Copy recomendado

Usar lenguaje funcional:

- Novedades mensuales.
- Registrar novedad.
- Enviar a revision.
- Aprobar.
- Observar.
- Rechazar.
- Anular.
- Preparar pre-nomina.

Evitar como texto principal:

- Movimiento variable tecnico.
- Ejecutar motor.
- Recalcular liquidacion.
- Sincronizar Previred.

## 7. Acciones principales

| Estado | Acciones recomendadas |
|---|---|
| Borrador | editar, enviar a revision, anular/eliminar si aplica. |
| Pendiente revision | aprobar, observar, rechazar, anular. |
| Observada | corregir, reenviar, anular. |
| Aprobada | incorporar a pre-nomina, anular si periodo abierto. |
| Incorporada a pre-nomina | ver detalle, bloquear edicion libre. |
| Calculada | solo lectura; correccion por reapertura/version. |
| Anulada | solo lectura. |

## 8. Regla de experiencia

La pantalla no debe preguntar al usuario donde cargar un mismo dato.

Si hay dos rutas durante la transicion, la ruta legacy debe indicar que no es el flujo canonico o debe ocultarse cuando Novedades mensuales quede productiva.

## 9. Relacion con proceso mensual

Proceso mensual debe tomar novedades aprobadas por una capa de entradas normalizadas. No debe leer directamente componentes UI ni tablas legacy.

## 10. Decision recomendada

Siguiente fase despues de consolidacion:

```txt
UNIF-NOM-02 - EntradasMensualesPeriodoService
```

Luego:

```txt
NOM-UX-01 - UI canonica de Novedades mensuales
```

La UI final debe ser flujo mixto, no solo CRUD.
