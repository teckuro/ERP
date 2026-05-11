# ARQ-ERP-01 - Estructura canonica del ERP y mapa legacy

## 1. Objetivo

Este documento integra la base documental existente sin borrar historia ni fases previas. Define el mapa canonico del ERP de remuneraciones, separando:

- dominios productivos canonicos;
- tablas canonicas;
- tablas legacy o de transicion;
- decisiones de nomenclatura;
- limites entre Parametros, Conceptos, Asignaciones recurrentes, Novedades mensuales, Proceso mensual, Motor, Liquidacion y salidas legales.

La finalidad es evitar que el proyecto siga creciendo con dos fuentes de verdad para el mismo dato.

## 2. Principio rector

Cada dato debe tener:

- un lugar claro;
- un proposito claro;
- una fuente de verdad;
- un momento dentro del flujo;
- un responsable funcional;
- una relacion explicita con las fases siguientes.

Regla de lectura:

```txt
Si identifica al trabajador -> Maestros RRHH.
Si regula el calculo -> Parametros.
Si define un item -> Conceptos de remuneracion.
Si se repite o queda pactado -> Asignaciones recurrentes.
Si ocurre solo en el periodo -> Novedades mensuales.
Si valida y prepara -> Proceso mensual / Pre-nomina.
Si calcula -> Motor.
Si congela resultado -> Liquidacion / snapshot oficial futuro.
Si reporta legalmente -> Previred / LRE.
```

## 3. Mapa funcional canonico

| Dominio canonico | Responsabilidad | Fuente actual / futura | Estado recomendado |
|---|---|---|---|
| Empleados / Maestros RRHH | Identificar trabajadores, contratos y condiciones base. | `persona`, `contrato`, previsional, salud, banco, centro costo. | Canonico. |
| Parametros | Regular valores oficiales, configuracion cliente, referencia anterior y reconciliacion. | `parametros_generales`, `parametros_generales_cliente`, tablas mensuales y vigencias. | Canonico consolidado. |
| Conceptos de remuneracion | Definir items que pueden aparecer en remuneracion. | `concepto`, `catalogo_lre` y reglas de uso. | Canonico parcial; requiere gobierno final. |
| Asignaciones recurrentes | Asignar conceptos pactados o repetitivos a trabajadores. | `haberdescuento_persona`. | Canonico base. |
| Novedades mensuales | Registrar hechos del periodo: horas extra, bonos puntuales, ausencias, anticipos, comisiones, ajustes. | `novedad_remuneracion_periodo`. | Canonico futuro / nuevo. |
| Movimientos variables | Termino tecnico historico para hechos del periodo. | `movimiento_variable_mensual`. | Legacy / transicion. |
| Proceso mensual / Pre-nomina | Validar y preparar entradas antes del motor. | `ProcesoMensualService` + futura capa de entradas canonicas. | Parcial; debe desacoplarse de legacy. |
| Motor de calculo | Calcular remuneracion a partir de contrato de entrada limpio. | Servicios de motor preliminar y snapshots. | Preliminar; no productivo final. |
| Liquidacion | Congelar resultado oficial. | `liquidacion`, `liquidacion_detalle` o modelo futuro derivado de snapshots. | Pendiente de decision oficial. |
| Previred / LRE | Reportar resultados validados. | Documentacion LRE y salidas futuras. | Pendiente. |
| Reportes / auditoria | Explotar resultados cerrados y trazabilidad. | Snapshots, liquidaciones y logs futuros. | Pendiente. |

## 4. Tablas canonicas

| Dominio | Tabla canonica | Rol | Observacion |
|---|---|---|---|
| Personas | `persona` | Trabajador/persona base. | Canonica. |
| Contratos | `contrato` | Relacion laboral y datos de contrato. | Canonica. |
| Parametros oficiales | `parametros_generales` | Snapshot oficial mensual. | No editar desde UI normal. |
| Configuracion cliente | `parametros_generales_cliente` | Configuracion editable del cliente. | Guarda reconciliacion oficial/cliente. |
| Conceptos | `concepto` | Catalogo maestro de items. | Debe gobernar uso recurrente/mensual/motor/LRE. |
| LRE catalogo | `catalogo_lre` | Mapeo legal LRE. | Canonica para salidas LRE. |
| Asignaciones recurrentes | `haberdescuento_persona` | Conceptos pactados o repetitivos por trabajador. | No usar para novedades puntuales. |
| Novedades mensuales | `novedad_remuneracion_periodo` | Hechos del periodo. | Tabla canonica futura para reemplazar funcionalmente movimientos variables. |
| Snapshot periodo | `nomina_calculo_periodo` | Snapshot preliminar de calculo por periodo. | Preliminar; no liquidacion oficial. |
| Snapshot trabajador | `nomina_calculo_trabajador` | Resultado preliminar por trabajador. | Preliminar. |
| Snapshot conceptos | `nomina_calculo_concepto` | Detalle preliminar por concepto calculado. | Preliminar. |
| Issues calculo | `nomina_calculo_issue` | Bloqueos/advertencias del calculo. | Preliminar. |
| Trazabilidad calculo | `nomina_calculo_trazabilidad` | Evidencia de fuentes usadas. | Preliminar. |

## 5. Tablas legacy / transicion

| Dominio | Tabla legacy | Motivo | Accion futura |
|---|---|---|---|
| Hechos del periodo | `movimiento_variable_mensual` | Fue la primera implementacion de movimientos variables y aun puede estar conectada a Proceso mensual. | Mantener por compatibilidad; no agregar mejoras nuevas; migrar/adaptar hacia `novedad_remuneracion_periodo`. |
| Movimiento generico | `movimiento` | Nombre amplio/no canonico para el flujo actual. | No usar como fuente nueva sin decision. |
| Liquidacion legacy | `liquidacion` | Puede representar modelo historico/base vieja o UI demo. | Revisar en LIQ-00 antes de declararla oficial. |
| Detalle liquidacion legacy | `liquidacion_detalle` | Igual que anterior. | Revisar en LIQ-00. |

No borrar ninguna tabla en esta fase. El objetivo es ordenar y transicionar.

## 6. Decision canonica: Novedades mensuales vs Movimientos variables

Decision:

```txt
Novedades mensuales = nombre funcional oficial para RRHH.
novedad_remuneracion_periodo = tabla canonica futura.
Movimientos variables = termino historico/legacy/tecnico de transicion.
movimiento_variable_mensual = tabla legacy de transicion.
```

Reglas:

- No deben existir dos pantallas productivas finales para cargar el mismo hecho del periodo.
- Cualquier funcionalidad nueva debe avanzar sobre Novedades mensuales.
- Movimientos variables no se borra aun porque puede sostener flujo actual o datos existentes.
- Si hay UI legacy, debe quedar marcada como transicion o redirigirse en una fase futura.
- Si Proceso mensual consume legacy, debe adaptarse con una capa intermedia antes de apagarlo.

## 7. Decision sobre Entradas mensuales

Para evitar que `ProcesoMensualService` lea tablas sueltas o legacy, se recomienda una capa futura:

```txt
EntradasMensualesPeriodoService
```

Responsabilidad:

- normalizar asignaciones recurrentes vigentes;
- normalizar novedades mensuales aprobadas;
- leer legacy movimientos variables solo durante la transicion, si corresponde;
- entregar un contrato unico a Proceso mensual.

Contrato conceptual:

```ts
interface EntradaMensualPeriodo {
  idEntrada: string | number;
  origen: 'recurrente' | 'novedad_mensual' | 'legacy_movimiento_variable';
  periodo: string;
  idPersona: string | number;
  idContrato: string | number | null;
  idConcepto: string | number;
  cantidad: number | null;
  monto: number | null;
  estado: string;
}
```

## 8. Decision sobre Proceso mensual

Proceso mensual debe validar y preparar, no calcular.

Estado actual esperado:

- Puede existir prevalidacion 9.5A/9.5B/9.5C.
- Puede existir dependencia a MovimientosVariablesService.
- Eso queda como transicion, no como arquitectura final.

Estado futuro recomendado:

```txt
ProcesoMensualService
  -> EntradasMensualesPeriodoService
      -> Asignaciones recurrentes
      -> Novedades mensuales
      -> Legacy movimientos variables si aplica durante transicion
```

## 9. Decision sobre Motor

Motor debe:

- recibir entrada preparada;
- calcular;
- no modificar fuentes;
- no leer directamente UI;
- no decidir parametros;
- no migrar legacy por si solo;
- no cerrar periodo.

Novedades aprobadas deben entrar al contrato de entrada del motor en fase futura, no por lectura directa del componente UI.

## 10. Decision sobre Liquidacion

Estado actual:

- Existen documentos y tablas de snapshots preliminares de motor.
- Pueden existir `liquidacion` y `liquidacion_detalle` como base anterior/demo.
- UI de liquidaciones/reportes puede tener datos demo.

Decision:

- No declarar liquidacion oficial hasta LIQ-00.
- Liquidacion oficial debe ser snapshot/versionado/auditable.
- No usar paginas demo como prueba de liquidacion real.
- No recalcular silenciosamente liquidaciones cerradas.

## 11. UI / menu canonico recomendado

## Lenguaje visible vs nombres tecnicos

El ERP puede mantener nombres tecnicos internos por compatibilidad, pero la UI debe usar lenguaje operativo.

| Interno/tecnico | Visible UI |
| --- | --- |
| proceso mensual | Preparar nomina |
| novedades mensuales / novedad_remuneracion_periodo | Movimientos del mes |
| haberes-descuentos / haberdescuento_persona | Asignaciones recurrentes |
| motor | Calculo de nomina |

Menu productivo final recomendado:

- Empleados
- Parametros
- Conceptos
- Asignaciones recurrentes
- Movimientos del mes
- Preparar nomina
- Liquidaciones
- Previred / LRE
- Reportes

Movimientos variables no debe quedar como modulo productivo final visible junto a Novedades mensuales. Si se mantiene temporalmente, debe marcarse como legacy/transicion.

## 12. Roadmap recomendado desde esta estructura

1. **UNIF-NOM-01** - Marcar Movimientos variables como legacy y consolidar decision canonica.
2. **SEG-NOV-01/02** - Cerrar permisos/RLS para `novedad_remuneracion_periodo`.
3. **UNIF-NOM-02** - Crear `EntradasMensualesPeriodoService`.
4. **UNIF-NOM-03** - Adaptar Proceso mensual para consumir entradas canonicas.
5. **NOM-UX-01** - Consolidar UI de Novedades mensuales y ocultar/derivar legacy.
6. **MOTOR-04** - Integrar novedades aprobadas al contrato de entrada del motor.
7. **LIQ-00** - Definir liquidacion oficial vs snapshot preliminar.
8. **CIERRE-01** - Cierre mensual, bloqueo y reapertura controlada.
9. **PREVIRED/LRE** - Salidas legales sobre liquidaciones cerradas.

## 13. Reglas de no mezcla

- Parametros no paga.
- Conceptos no asigna trabajadores.
- Asignaciones recurrentes no son novedades mensuales.
- Novedades mensuales no son recurrentes.
- Novedades mensuales no calculan.
- Proceso mensual no debe depender de tablas legacy como arquitectura final.
- Motor no modifica fuentes.
- Liquidacion congela.
- Previred/LRE reportan.
- Reportes no son fuente de verdad.

## 14. Criterios para fases futuras

Una fase futura debe declarar:

- que tabla/fuente usa;
- si toca canonico o legacy;
- si conserva compatibilidad;
- si migra datos o solo adapta lectura;
- que tests prueban que no hay doble fuente de verdad.
