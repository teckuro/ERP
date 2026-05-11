# Roadmap UX comercial v2 - 2026-05-10

Nota NOM-CIERRE-DB-APPLY-01:

`NOM-CIERRE-01` ya tiene SQL/RPC aplicado y validado en BD real/controlada. El cierre real fue ejecutado con `E2E_NOMINA_CIERRE_REAL=1` para `2026-04`, quedo persistido en el snapshot activo `id_calculo_periodo=15` y fue recuperado desde UI/E2E. La siguiente fase recomendada es `LIQ-DESIGN-01 - Diseno funcional y tecnico de liquidaciones oficiales`.

Este ajuste no cambia la prioridad funcional: primero cierre y liquidaciones oficiales. Agrega una capa clara para que Cursor no haga mejoras visuales aisladas sin patron.

Estado actualizado NOM-CIERRE-01: el cierre operativo controlado queda implementado en SQL versionado y frontend. La siguiente fase es `LIQ-DESIGN-01 - Diseno funcional y tecnico de liquidaciones oficiales`.

| Orden | Fase | Tipo | Estado | Resultado esperado |
|---|---|---|---|---|
| 1 | `NOM-CIERRE-DESIGN-01` | diseno funcional | cerrada_documental | Cierre operativo definido. |
| 2 | `NOM-CIERRE-01` | funcional/persistencia | implementada_pendiente_bd_e2e | Nomina cerrada operativamente. |
| 3 | `LIQ-DESIGN-01` | diseño funcional | futura | Contrato de liquidacion oficial. |
| 4 | `LIQ-OFICIAL-01` | funcional | futura | Liquidacion oficial interna. |
| 5 | `UX-COMERCIAL-01` | UX/producto | futura | Experiencia vendible y dinamica. |
| 6 | `PREVIRED-DESIGN-01` | futura | futura | Salida previsional posterior. |
| 7 | `LRE-DESIGN-01` | futura | futura | Libro remuneraciones posterior. |
| 8 | `BANCO-DESIGN-01` | futura | futura | Archivo banco posterior. |
| 9 | `CONTABILIDAD-DESIGN-01` | futura | futura | Contabilidad posterior. |

Documentos UX nuevos:

- `docs/codex/ux-comercial/README.md`
- `docs/codex/ux-comercial/contrato-diseno-comercial.md`
- `docs/codex/ux-comercial/checklist-cursor-ux.md`
- `docs/codex/prompts-cursor/CURSOR-UX-COMERCIAL-REVIEW-01.md`

---

# Roadmap canonico 2026-05-10

Prioridad vigente definida por producto:

| Orden | Fase | Estado | Objetivo |
|---|---|---|---|
| 1 | `NOM-CIERRE-DESIGN-01` | cerrada_documental | Definir cierre operativo antes de implementar. |
| 2 | `NOM-CIERRE-01` | implementada_pendiente_bd_e2e | Implementar cierre operativo controlado. |
| 3 | `LIQ-DESIGN-01` | siguiente | Disenar liquidaciones oficiales desde nomina cerrada. |
| 4 | `LIQ-OFICIAL-01` | futura | Implementar liquidaciones oficiales internas. |
| 5 | `UX-COMERCIAL-01` | futura | Mejorar experiencia usable, dinamica y comercial. |
| 6 | `PREVIRED-DESIGN-01` | futura | Salida Previred posterior. |
| 7 | `LRE-DESIGN-01` | futura | Salida LRE posterior. |
| 8 | `BANCO-DESIGN-01` | futura | Archivo banco posterior. |
| 9 | `CONTABILIDAD-DESIGN-01` | futura | Integracion contable posterior. |

Regla: despues de liquidaciones oficiales, el foco principal cambia a UX comercial antes de avanzar a salidas legales/financieras avanzadas.

---

# Roadmap operativo ERP Remuneraciones Chile

## 1. Proposito

Este documento ordena el avance funcional del ERP de remuneraciones chileno.

Su objetivo es evitar avanzar por intuicion, por UI o por presion de implementar rapido sin cerrar dependencias criticas.

Cursor/Codex no decide el camino del proyecto. Cursor/Codex solo puede ejecutar fases cuando este roadmap define alcance, limites, dependencias y criterios de cierre.

## 2. Principio rector

Prioridad actual:

1. Funcionalidad correcta.
2. Reglas de negocio consistentes.
3. Datos confiables.
4. Seguridad y permisos.
5. Trazabilidad.
6. UI minima correcta.
7. Pulido visual final posterior.

No se debe hacer perfeccion visual en cada fase.

## 3. Estado macro

| Area                  | Estado           | Observacion                                                                                     |
| --------------------- | ---------------- | ----------------------------------------------------------------------------------------------- |
| Orquestador / roadmap | Cerrada          | ORDEN-01 integrada; SEG-01 queda como siguiente fase oficial                                    |
| Empleados             | Cerrado          | Alta, borrador, continuar alta, aptitud para remuneraciones                                     |
| Parametros            | Cerrado          | Periodo, vigencias, catalogos, carga mensual                                                    |
| Seguridad / permisos  | En definicion    | SEG-01 documenta roles, permisos, JWT/RLS base y acciones bloqueadas antes de endurecer modulos |
| Conceptos             | Parcial          | CONC-02 queda despues de SEG-01; faltan reglas finales para motor                               |
| Haberes recurrentes   | Cerrado base     | Asignaciones recurrentes por periodo                                                            |
| Movimientos variables | Legacy/transicion oculto del menu principal | Existe base manual historica; la ruta legacy se conserva, pero no se impulsa como flujo visible principal |
| Proceso mensual       | Parcial          | UNIF-NOM-03 cerrado: prevalidacion consume entradas canonicas, sin cambiar motor ni liquidacion  |
| Motor de calculo      | Preliminar con contrato de entradas | MOTOR-04 agrega entradas mensuales al input sin cambiar formulas; falta definir efecto calculable |
| Liquidaciones         | Pendiente real   | No usar UI demo como productiva                                                                 |
| Previred              | Pendiente        | Depende de liquidaciones reales                                                                 |
| LRE                   | Pendiente        | Depende de conceptos mapeados y liquidaciones                                                   |
| Reportes              | Pendiente        | Depende de cierre/liquidaciones                                                                 |
| Pulido visual final   | Pendiente        | Agrupar en fase posterior                                                                       |

## 4. Orden recomendado

## USAB-NOM-01 - Alineacion de lenguaje visible y navegacion

Objetivo: ordenar la experiencia mensual antes de seguir con calculo productivo, cierre, Previred o LRE.

Decisiones visibles:

- Proceso mensual -> Preparar nomina.
- Novedades mensuales -> Movimientos del mes.
- Haberes y descuentos -> Asignaciones recurrentes.
- Motor/Calculo tecnico -> Calculo de nomina.

Fuera de alcance: SQL, RLS, formulas legales, snapshots, liquidaciones oficiales, Previred y LRE.

1. ORDEN-01 - Integracion final del roadmap (**Cerrada**)
2. SEG-01 - Roles, permisos, JWT/RLS base (**En definicion**)
3. CONC-02 - Conceptos gobernados para motor
4. MOTOR-00 - Contrato del motor de calculo
5. MOTOR-01 - Motor de calculo v1 acotado
6. LIQ-01 - Liquidaciones snapshot
7. CIERRE-01 - Cierre mensual
8. PREVIRED-01 - Base exportacion Previred
9. LRE-01 - Libro de Remuneraciones Electronico
10. REPORTES-01 - Reportes y auditoria
11. UX-FINAL-01 - Pulido visual integral

Regla de orden:

- CONC-02 no debe ejecutarse antes de SEG-01.
- MOTOR-00 debe cerrarse antes de cualquier implementacion de motor.
- MOTOR-01, liquidaciones, cierre, Previred y LRE quedan bloqueados hasta cumplir sus dependencias.

## 5. Regla de avance

Una fase solo puede comenzar si:

- Tiene objetivo claro.
- Tiene alcance claro.
- Tiene que no tocar.
- Tiene dependencias cerradas.
- Tiene criterios de aceptacion.
- Tiene validacion manual o automatica.
- Tiene documentacion a actualizar.

## 6. Fase actual: SEG-01

SEG-01 es la fase actual de ordenamiento documental de seguridad y permisos.

Objetivo:

- Definir roles base.
- Definir acciones por modulo.
- Separar permisos UI, service y BD/JWT/RLS.
- Definir acciones criticas.
- Definir acciones bloqueadas por fases futuras.
- Definir que queda `A_DEFINIR` para subfase posterior.

Documento principal:

- [`matriz-roles-permisos.md`](./matriz-roles-permisos.md)

Estado esperado al cierre documental:

`Cerrada base`

Despues de SEG-01, la siguiente fase oficial es:

`CONC-02 - Conceptos gobernados para motor`

Regla:

- No avanzar a `CONC-02` sin matriz de roles/permisos revisada.
- No avanzar a `MOTOR-00` sin `CONC-02`.
- No implementar motor, liquidaciones, cierre, Previred ni LRE desde SEG-01.

<!-- ARQ-ERP-01-INTEGRACION -->

## Roadmap corregido 2026-05-07 - consolidacion Nomina

La prioridad inmediata no es crear mas UI ni ampliar motor, sino consolidar fuentes canonicas.

Orden recomendado:

1. **UNIF-NOM-02 - EntradasMensualesPeriodoService**: cerrado base; normaliza recurrentes, novedades mensuales y legacy si aplica, sin cambiar consumidores actuales.
2. **UNIF-NOM-03 - Proceso mensual con entradas canonicas**: cerrado base; `ProcesoMensualService` consume `EntradasMensualesPeriodoService` y mantiene movimientos variables solo como origen legacy/transicion.
3. **SEG-NOV-02 - RLS/permisos de novedades**: cerrada aplicada; `novedad_remuneracion_periodo` queda con RLS y permisos minimos.
4. **NOM-UX-01 - UI canonica de Novedades mensuales**: cerrada base; Novedades mensuales queda visible en sidebar y Movimientos variables queda fuera del menu principal como legacy por ruta directa.
5. **MOTOR-04 - Integrar novedades aprobadas al contrato de entrada del motor**: cerrada base; contrato preparatorio sin cambiar formulas ni resultados legales.
6. **MOTOR-05 - Definir efecto calculable de entradas mensuales**: pendiente; requiere reglas de Conceptos para saber si cada entrada afecta base imponible, tributable, liquido y trazabilidad.
7. **LIQ-00 - Definir liquidacion oficial vs snapshots preliminares**.
8. **CIERRE-01 - Cierre mensual y reapertura controlada**.
9. **Previred/LRE** sobre liquidaciones cerradas.

Regla: no impulsar mejoras nuevas sobre Movimientos variables salvo correcciones criticas mientras se transiciona a Novedades mensuales.
