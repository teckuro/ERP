# Integracion documental 2026-05-07 - Estructura canonica y transicion de Nomina

## 1. Alcance aplicado

Se integro la documentacion recibida sin borrar archivos existentes. La estrategia fue:

- conservar documentos historicos y fases previas;
- agregar documentos puente;
- anexar notas canonicas a documentos clave;
- marcar transicion donde habia duplicidad funcional;
- no eliminar historia documental.

## 2. Documentos nuevos

| Documento | Rol |
|---|---|
| `orquestador/estructura-canonica-erp.md` | Mapa canonico del ERP, tablas canonicas, tablas legacy y decisiones estructurales. |
| `orquestador/plan-transicion-novedades-movimientos.md` | Plan de transicion entre Movimientos variables y Novedades mensuales. |
| `modulos/nomina-mensual/benchmark-novedades-pre-nomina.md` | Benchmark funcional y propuesta UX para Novedades/Pre-nomina. |
| `orquestador/integracion-documental-2026-05-07.md` | Este resumen de integracion. |

## 3. Decision principal integrada

```txt
Novedades mensuales = flujo funcional oficial para RRHH.
novedad_remuneracion_periodo = tabla canonica futura.
Movimientos variables = termino legacy/tecnico de transicion.
movimiento_variable_mensual = tabla legacy de transicion.
```

## 4. Archivos existentes tocados por anexo

Se agregaron secciones de integracion, sin borrar contenido previo, en:

- `README.md`
- `orquestador/README.md`
- `orquestador/mapa-documentacion.md`
- `orquestador/diccionario-tablas-canonicas.md`
- `orquestador/estado-fases.md`
- `orquestador/roadmap-operativo.md`
- `orquestador/roadmap-maestro-pendientes-fases.md`
- `orquestador/diseno-operativo-erp.md`
- `orquestador/decisiones-pendientes.md`
- `orquestador/matriz-roles-permisos.md`
- `modulos/movimientos-variables/README.md`
- `modulos/movimientos-variables/contrato-general.md`
- `modulos/nomina-mensual/README.md`
- `modulos/nomina-mensual/contrato-general.md`
- `modulos/nomina-mensual/novedades-mensuales.md`
- `modulos/nomina-mensual/arquitectura-funcional-remuneraciones.md`
- `modulos/nomina-mensual/motor-calculo-contrato.md`
- `modulos/conceptos-remuneracion/README.md`
- `modulos/conceptos-remuneracion/contrato-funcional.md`
- `modulos/haberes-descuentos/contrato-general.md`
- `CHANGELOG.md`

## 5. Riesgos que quedan documentados

- Doble ruta productiva potencial: `/remuneraciones/movimientos-variables` y `/remuneraciones/novedades-mensuales`.
- Proceso mensual puede seguir consumiendo `MovimientosVariablesService`.
- Falta confirmar o implementar RLS para `novedad_remuneracion_periodo`.
- Motor preliminar no debe considerarse liquidacion oficial.
- Paginas demo de liquidaciones/reportes no deben tomarse como productivas.

## 6. Siguiente fase recomendada

```txt
UNIF-NOM-02 - Crear EntradasMensualesPeriodoService
```

Objetivo: entregar a Proceso mensual entradas normalizadas desde recurrentes, novedades mensuales y legacy durante transicion.
