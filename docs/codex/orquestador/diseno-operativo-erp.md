# Diseño operativo del ERP

## 1. Propósito

Fijar **cómo debe sentirse y comportarse** la aplicación para el usuario operativo: prioridad de información, acciones y límites, alineado a [`contexto-proyecto.md`](./contexto-proyecto.md) y a las guías UI (`AGENTS.md`, `ui-form-guidelines.md`). No sustituye contratos por módulo en [`../modulos/`](../modulos/empleados/README.md).

## 2. Principio central

Cada pantalla debe ayudar a responder, **en este orden**:

1. **Estado** - en qué situación está el contexto o el registro.
2. **Qué falta** - pocos pendientes claros (no listas interminables).
3. **Acción siguiente** - un CTA coherente con el estado.
4. **Detalle bajo demanda** - pestañas, paneles o enlaces; no exponer todo a la vez.

## 3. Qué evitar en UI operativa

- Sensación de **planilla infinita** o formulario sin jerarquía.
- Nombres de **tablas, columnas o errores crudos** de motor en copy para el usuario final.
- **Defaults técnicos** presentados como si fueran decisiones del usuario (p. ej. autoselección del primer ítem de catálogo).
- Mensajes genéricos de “sin datos” cuando en realidad **solo falta carga mensual u otra capa** (período vs vigencia vs catálogo; ver [`../modulos/parametros/periodo-vigencia-catalogo.md`](../modulos/parametros/periodo-vigencia-catalogo.md)).

## 4. Qué favorecer

- **Panel de estado** y pendientes principales visibles antes del detalle.
- **Acción siguiente** explícita; deshabilitar u ocultar lo que aún no corresponde.
- **Empty states** concretos al dominio (empleados, parámetros, etc.).
- Tablas con el estándar DataGrid del proyecto cuando aplique ([`../ui-tables.md`](../ui-tables.md)).

## 5. Coherencia con fases cerradas

Reglas ya ancladas en producto (resumen; detalle en `modulos/empleados` y [`estado-fases.md`](./estado-fases.md)):

- **Aptitud para remuneraciones** en ficha: validación **explícita** (opción B), no aptitud automática solo por completar secciones.
- **Borrador de alta avanzada** y **rehidratación**: no tratar placeholders como datos reales para completitud o aptitud.

## 6. Siguiente fase fuerte de producto

La **siguiente fase oficial** es **SEG-01 - Roles, permisos, JWT/RLS base**. Antes de seguir endureciendo modulos productivos, debe quedar definida la matriz de roles, acciones permitidas, acciones bloqueadas y separacion entre permisos UI y permisos BD/JWT/RLS.

Despues de SEG-01, la fase fuerte de producto es **CONC-02 - Conceptos gobernados para motor**: catalogo maestro gobernado (LRE, vigencias, reglas de edicion), fuente para haberes, descuentos, aportes y liquidaciones, sin mezclar con asignaciones por trabajador.

- SEG-01: [`matriz-roles-permisos.md`](./matriz-roles-permisos.md).
- CONC-02: [`../modulos/conceptos-remuneracion/README.md`](../modulos/conceptos-remuneracion/README.md).
- Roadmap y dependencias: [`roadmap-operativo.md`](./roadmap-operativo.md), [`dependencias-fases.md`](./dependencias-fases.md).
- Tablero de fases: [`estado-fases.md`](./estado-fases.md).

Hasta cerrar **SEG-01** y avanzar razonablemente en **CONC-02**, no forzar alcance de motor de liquidacion productivo ni nomina end-to-end. **MOTOR-00** debe cerrarse antes de cualquier implementacion de motor.

## 7. Documentos relacionados

Navegación del dominio **Remuneraciones** en la app: rutas operativas bajo `/remuneraciones/*` (conceptos, haberes y descuentos, **movimientos variables**, proceso mensual, liquidaciones); rutas antiguas en raíz solo como redirects temporales (ver [`estado-fases.md`](./estado-fases.md), Fase 9.3B.1). **Proceso mensual** (`/remuneraciones/proceso-mensual`): tras **PARAM-CHILE-01** la UI no muestra cifras normativas demo como datos del periodo; tras **9.5A** y **9.5B** la pantalla ejecuta **prevalidaciones** por periodo (parametros con grupos minimos y catalogos, empleados, conceptos, **haberes recurrentes** filtrados al mes, movimientos variables) sin motor ni liquidaciones (ver [`../modulos/nomina-mensual/prevalidaciones-9-5A.md`](../modulos/nomina-mensual/prevalidaciones-9-5A.md), [`../modulos/nomina-mensual/prevalidaciones-9-5B.md`](../modulos/nomina-mensual/prevalidaciones-9-5B.md), [`../auditorias/param-chile-01-parametros-y-demo-proceso.md`](../auditorias/param-chile-01-parametros-y-demo-proceso.md)).

| Documento | Uso |
|-----------|-----|
| [`contexto-proyecto.md`](./contexto-proyecto.md) | Visión, módulos, camino oficial |
| [`estado-fases.md`](./estado-fases.md) | Qué está cerrado y qué sigue |
| [`mapa-documentacion.md`](./mapa-documentacion.md) | Índice de fuentes en `docs/codex` |

## 8. Cadena funcional remuneraciones (referencia)

Orden conceptual del producto (cada eslabon tiene su modulo o fase; no implica que todo este implementado):

```txt
SEG-01 -> CONC-02 -> Haberes recurrentes -> Movimientos variables -> Proceso mensual -> MOTOR-00 -> MOTOR-01 -> Liquidaciones -> Previred/LRE
```

- **SEG-01:** roles, permisos, JWT/RLS base y restricciones por rol.
- **CONC-02:** catalogo maestro gobernado.
- **Haberes recurrentes:** asignaciones por trabajador con vigencia en el tiempo.
- **Movimientos variables:** lineas puntuales por trabajador, concepto y periodo `YYYY-MM` (contrato: [`../modulos/movimientos-variables/README.md`](../modulos/movimientos-variables/README.md); **9.4B** modelo TS/reglas; **9.4C** tabla + repository; **9.4D** `MovimientosVariablesService`; **9.4E** pantalla `/remuneraciones/movimientos-variables` para listado y carga manual; **CHILE-FIX-01** validacion servidor catalogo + aptitud/contrato: [`../modulos/movimientos-variables/hardening-chile-fix-01.md`](../modulos/movimientos-variables/hardening-chile-fix-01.md)).
- **Proceso mensual / MOTOR-00 / Motor / Liquidaciones / Previred:** etapas posteriores segun [`roadmap-operativo.md`](./roadmap-operativo.md), [`dependencias-fases.md`](./dependencias-fases.md) y [`estado-fases.md`](./estado-fases.md).

<!-- ARQ-ERP-01-INTEGRACION -->

## Decision operativa integrada 2026-05-07

El flujo operativo canonico queda:

```txt
Empleados aptos
  -> Parametros reconciliados
  -> Conceptos gobernados
  -> Asignaciones recurrentes vigentes
  -> Novedades mensuales aprobadas
  -> Entradas mensuales canonicas
  -> Proceso mensual / Pre-nomina
  -> Motor
  -> Liquidacion oficial / snapshot cerrado
  -> Previred / LRE
  -> Reportes
```

Movimientos variables se conserva como antecedente/legacy y no debe ser el flujo principal para nuevas funcionalidades.
