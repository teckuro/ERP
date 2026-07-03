# Módulo Conceptos de remuneración — punto de entrada

## Estado (Fase 9)

**Fase fuerte del producto en curso:** la **documentación** Fase 9 incluye diagnóstico, contrato funcional y **decisiones operativas** ([`decisiones-operativas.md`](./decisiones-operativas.md)). **CONC-02 núcleo cerrado** (permisos JWT, RLS, reglas en UI): [`conc-02-cierre.md`](./conc-02-cierre.md).

## Orden de lectura

1. [`diagnostico-fase-9.md`](./diagnostico-fase-9.md) — estado real del repo (UI, API, BD, pruebas).  
2. [`contrato-funcional.md`](./contrato-funcional.md) — reglas de negocio y de pantalla que deben cumplirse o extenderse.  
3. [`contrato-general.md`](./contrato-general.md) — índice y principios.  

## Documentos

| Archivo | Rol |
|---------|-----|
| [`diagnostico-fase-9.md`](./diagnostico-fase-9.md) | Diagnóstico Fase 9 |
| [`decisiones-operativas.md`](./decisiones-operativas.md) | Decisiones de producto antes de CRUD/RLS (Fase 9.2) |
| [`contrato-funcional.md`](./contrato-funcional.md) | Contrato funcional del mantenedor y del modelo |
| [`contrato-general.md`](./contrato-general.md) | Resumen e índice |

## Orquestador y flujos

- Tablero: [`../../orquestador/estado-fases.md`](../../orquestador/estado-fases.md) (fase 9).  
- Diseño operativo y prioridad del módulo: [`../../orquestador/diseno-operativo-erp.md`](../../orquestador/diseno-operativo-erp.md) §6.  
- Contexto global: [`../../orquestador/contexto-proyecto.md`](../../orquestador/contexto-proyecto.md) §10.  
- Recorrido por rutas: [`../../temas/flujos/remuneraciones-conceptos.md`](../../temas/flujos/remuneraciones-conceptos.md) (outlet `/remuneraciones/*`; ver Fase 9.3B.1 en [`../../orquestador/estado-fases.md`](../../orquestador/estado-fases.md)).

## Relación con Haberes y descuentos

El código del mantenedor comparte **`HaberesDescuentosService`** con asignaciones recurrentes. El contrato de **asignaciones** sigue en [`../haberes-descuentos/contrato-general.md`](../haberes-descuentos/contrato-general.md); las reglas del **catálogo concepto** viven en este módulo.

## Relacion con Movimientos variables

Los movimientos variables mensuales **referencian** conceptos del catalogo pero no son el mantenedor de `concepto`. Contrato, decisiones y modelo v1 (validacion opcional por snapshot sin acoplar a `concepto-asignabilidad`): [`../movimientos-variables/README.md`](../movimientos-variables/README.md), [`contrato-funcional.md`](./contrato-funcional.md) §17.

## LRE-CONCEPT-RULES-01

El modulo Conceptos incorpora metadata para tratamiento LRE:

- `estrategia_lre`
- `requiere_exportacion_lre`
- `observacion_normativa_lre`

Esto permite diferenciar conceptos directos, derivados, ambiguos, pendientes o internos sin forzar codigos LRE incorrectos.
## ERP-NOIA-BITACORA-OPERATIVA-00 - Lectura de modulo

Conceptos de remuneracion queda alineado a [`NOIA / Bitacora Operativa`](../../diseno/bitacora-operativa-noia.md) como catalogo normativo de conceptos, separado de los movimientos aplicados a trabajadores.

- `Concepto` define naturaleza, imponibilidad, tributacion, reglas y vigencia.
- `Movimiento` registra aplicacion concreta por trabajador o periodo.
- Esta separacion debe mantenerse en futuras fases UX para evitar mezclar catalogo con bitacora operacional.
- Esta referencia es documental; no cambia SQL, servicios, motor, rutas ni estilos globales.

## NOM-MOVIMIENTOS-SIMPLE-00

La decision documental vigente define `Movimientos de remuneracion` como experiencia futura que unifica `Movimientos del mes` y `Asignaciones recurrentes` desde la duracion del registro: `Solo este mes`, `Recurrente` o `En cuotas`. Documento rector: [`../remuneraciones/movimientos-remuneracion-simple.md`](../remuneraciones/movimientos-remuneracion-simple.md).

Esta fase no cambia rutas, servicios, SQL, motor ni pantallas actuales.

## NOM-MOVIMIENTOS-SIMPLE-01

La capa visible de movimientos no cambia el catalogo maestro. `Conceptos de remuneracion` sigue separado: define conceptos; `Movimientos de remuneracion` aplica conceptos a trabajadores y periodos.

## NOM-MOVIMIENTOS-POR-TRABAJADOR-01

Conceptos se mantiene como catalogo maestro. La gestion por trabajador usa conceptos existentes para movimientos mensuales o recurrentes, sin mezclar catalogo con aplicacion concreta del movimiento.
