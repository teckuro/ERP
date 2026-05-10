# Mapa global de fases

## Proposito

Vista canonica y rapida del avance del ERP. Complementa `estado-fases.md`, que conserva el detalle historico.

## Estados permitidos

```txt
pendiente
en_diseno
implementada
cerrada_documentalmente
bloqueada
requiere_revision
futura
historica
```

## Tipos permitidos

```txt
funcional
visual
persistencia
E2E
documental
saneamiento
normativa
arquitectura
futura
```

## Mapa global

| Codigo | Fase | Modulo | Estado | Tipo | Dependencias | Evidencia / docs | Fuera de alcance | Siguiente |
|---|---|---|---|---|---|---|---|---|
| AUTH-BASE-01 | Autenticacion base y sesion de desarrollo | Auth | implementada | funcional | Supabase client existente | `modulos/auth/README.md`, `modulos/auth/contrato-general.md` | roles avanzados, usuarios completos | E2E authenticated |
| ENV-E2E-01 | Preparacion de entorno E2E nomina | Auth/Nomina | implementada | E2E | Auth base, variables locales | `modulos/auth/README.md`, `modulos/nomina-mensual/README.md` | credenciales en repo, service_role | AUTH-SEED-01 / NOM-E2E-02 |
| AUTH-SEED-01 | Usuario Supabase Auth y periodo E2E | Auth/Nomina | implementada | E2E | ENV-E2E-01 | `orquestador/estado-fases.md` | service_role, datos productivos | NOM-E2E-02 |
| EMP-ADV-FICHA-01 | Alinear alta avanzada, ficha y aptitud real para nomina | Empleados | implementada | funcional | Auth base, Empleados avanzado | `modulos/empleados/validar-remuneraciones.md`, `fases/empleados/EMP-ADV-FICHA-01.md` | seeds manuales, motor nomina | NOM-E2E-02 |
| NOM-PERSIST-01 | Persistencia formal de aprobacion operativa | Nomina | implementada | persistencia | USAB-NOM-09, snapshot preliminar | `modulos/nomina-mensual/motor-calculo-persistencia-03B.md`, `fases/nomina/NOM-PERSIST-01.md` | cierre, liquidaciones | NOM-SNAPSHOT-01 |
| NOM-SNAPSHOT-01 | Snapshot completo consultable desde BD | Nomina | implementada | persistencia | NOM-PERSIST-01 | `fases/nomina/NOM-SNAPSHOT-01.md` | recalculo con datos actuales | NOM-ATOMIC-01 |
| NOM-ATOMIC-01 | Reemplazo atomico transaccional del resultado guardado | Nomina | implementada | persistencia | NOM-SNAPSHOT-01 | `bd/base/v11/partes/20_nomina_calculo_snapshot_rpc.sql`, `fases/nomina/NOM-ATOMIC-01.md` | cierre, liquidaciones | NOM-DB-APPLY-01 |
| NOM-DB-APPLY-01 | Aplicacion y validacion SQL/RPC en BD real | Nomina | implementada | persistencia | NOM-ATOMIC-01 | SQL remoto controlado, `fases/nomina/NOM-DB-APPLY-01.md` | UI manual completa en esa fase | NOM-E2E-02 |
| NOM-E2E-02 | Ejecucion real de flujo nomina authenticated | Nomina/Auth | cerrada_documentalmente | E2E | Auth, empleados aptos, RPC real | E2E `2026-04`, `fases/nomina/NOM-E2E-02.md` | cierre, liquidaciones | NOM-E2E-CLOSE-01 |
| NOM-SAVE-DIAG-01 | Diagnostico de fallo real guardado RPC | Nomina | implementada | saneamiento | NOM-E2E-02 | Error `22007`, E2E OK, `fases/nomina/NOM-SAVE-DIAG-01.md` | SQL/RPC/RLS, formulas | NOM-E2E-CLOSE-01 |
| NOM-E2E-CLOSE-01 | Cierre documental E2E real de nomina | Nomina | cerrada_documentalmente | documental | NOM-SAVE-DIAG-01 | E2E OK 1 passed / 1 skipped, `id_calculo_periodo=11`, `fases/nomina/NOM-E2E-CLOSE-01.md` | codigo, SQL/RPC/RLS | NOM-CIERRE-DESIGN-01 |
| NOM-CIERRE-DESIGN-01 | Diseno funcional y tecnico del cierre operativo | Nomina | en_diseno | arquitectura | E2E real validado | `fases/nomina/NOM-CIERRE-DESIGN-01.md` | implementacion, liquidaciones | NOM-CIERRE-01 |
| NOM-CIERRE-01 | Implementar cierre operativo controlado | Nomina | futura | funcional | NOM-CIERRE-DESIGN-01 aprobado | `fases/nomina/NOM-CIERRE-01.md` | liquidaciones, Previred, LRE, banco | LIQ-DESIGN-01 |
| LIQ-DESIGN-01 | Diseno funcional y tecnico de liquidaciones oficiales | Liquidaciones | futura | arquitectura | Cierre operativo | `fases/nomina/LIQ-DESIGN-01.md`, `modulos/liquidaciones-oficiales/README.md` | Previred/LRE/banco | LIQ-OFICIAL-01 |
| LIQ-OFICIAL-01 | Implementar liquidaciones oficiales | Liquidaciones | futura | funcional | LIQ-DESIGN-01 aprobado | `fases/nomina/LIQ-OFICIAL-01.md` | Previred, LRE, banco, contabilidad | UX-COMERCIAL-01 |
| UX-COMERCIAL-01 | Experiencia usable, dinamica y comercial | Transversal | futura | visual | Liquidaciones oficiales | `fases/ux-comercial/UX-COMERCIAL-01.md` | salidas legales avanzadas | PREVIRED/LRE/BANCO futuro |
| PREVIRED-DESIGN-01 | Diseno futuro de Previred | Previred | futura | normativa | UX comercial priorizada | `fases/futuras/PREVIRED-DESIGN-01.md` | implementacion inmediata | definir cuando sea prioridad |
| LRE-DESIGN-01 | Diseno futuro LRE | LRE | futura | normativa | UX comercial priorizada | `modulos/lre/contrato-general.md`, `fases/futuras/LRE-DESIGN-01.md` | salida operativa actual | definir cuando sea prioridad |
| BANCO-DESIGN-01 | Diseno futuro archivo banco | Banco | futura | futura | UX comercial priorizada | `fases/futuras/BANCO-DESIGN-01.md` | implementacion actual | definir cuando sea prioridad |
| CONTABILIDAD-DESIGN-01 | Diseno futuro contabilidad | Contabilidad | futura | futura | UX comercial priorizada | `fases/futuras/CONTABILIDAD-DESIGN-01.md` | implementacion actual | definir cuando sea prioridad |

## Regla de lectura

- Para saber **que sigue**, leer este mapa y `roadmap-operativo.md`.
- Para saber **que se valido**, leer `estado-fases.md` y el archivo de fase.
- Para saber **que no tocar**, leer el contrato del modulo correspondiente.
