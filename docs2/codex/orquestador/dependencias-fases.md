# Dependencias entre fases

## 1. Cadena critica

DOC-04 documentacion integrada`r`n-> DB-01 tablas canonicas confirmadas`r`n-> Empleados aptos
-> Parametros del periodo
-> Roles y permisos base
-> Conceptos gobernados
-> Haberes recurrentes
-> Movimientos variables
-> Proceso mensual validado
-> Motor de calculo
-> Contrato de persistencia de snapshots
-> Persistencia controlada de snapshots preliminares
-> Validacion/aplicacion controlada de migracion
-> RLS y permisos de snapshots
-> Liquidaciones snapshot
-> Cierre mensual
-> Previred / LRE
-> Reportes / auditoria

## 2. Dependencias principales

| Fase        | Depende de                                      | Por que                                             |
| ----------- | ----------------------------------------------- | --------------------------------------------------- |
| ORDEN-01    | Roadmap maestro integrado                       | Deja el camino oficial y evita contradicciones      |
| SEG-01      | ORDEN-01, docs actuales                         | Define permisos antes de endurecer modulos          |
| CONC-02     | SEG-01                                          | Conceptos necesita reglas por rol                   |
| MOTOR-00    | DB-01, 9.5C, Parametros, Empleados, Recurrentes, MV | Define que datos consume el motor y no implementa calculos |
| MOTOR-01    | MOTOR-00                                        | Implementa solo lo ya contratado                    |
| MOTOR-02    | MOTOR-01                                        | Fortalece calculo preliminar antes de persistir     |
| MOTOR-03A   | MOTOR-02                                        | Define contrato de persistencia antes de crear tablas, migraciones o servicios de escritura |
| MOTOR-03B   | MOTOR-03A                                       | Implementa persistencia real solo despues del contrato documental |
| MOTOR-03C   | MOTOR-03B                                       | Aplica migracion y valida contra Supabase local/remoto de forma controlada |
| SEG-NOMINA  | MOTOR-03C                                       | Define RLS y permisos antes de usar snapshots en flujos productivos |
| LIQ-01      | MOTOR-03C, SEG-NOMINA                          | La liquidacion debe venir de un snapshot preliminar controlado o aprobado, validado en BD y con permisos definidos |
| CIERRE-01   | LIQ-01                                          | No se cierra un periodo sin liquidaciones generadas |
| PREVIRED-01 | LIQ-01, CIERRE-01                               | Previred necesita datos consolidados                |
| LRE-01      | LIQ-01, Conceptos LRE                           | LRE depende del mapeo legal de conceptos            |
| UX-FINAL-01 | Fases funcionales principales                   | El pulido visual no debe bloquear funcionalidad     |

## 3. Bloqueadores del motor

Antes de implementar motor debe existir:

- ORDEN-01 cerrada.
- SEG-01 cerrada base.
- Conceptos gobernados.
- Parametros minimos por periodo.
- DOC-04 documentacion integrada`r`n-> DB-01 tablas canonicas confirmadas`r`n-> Empleados aptos para remuneraciones.
- Haberes recurrentes filtrables por periodo.
- Movimientos variables validados por periodo.
- Proceso mensual con prevalidaciones reales.
- Contrato del motor documentado en `docs/codex/modulos/nomina-mensual/motor-calculo-contrato.md`, `motor-calculo-orden-operaciones.md`, `motor-calculo-entradas-salidas.md` y `motor-calculo-casos-prueba.md`.

MOTOR-00 es obligatorio antes de cualquier implementacion de motor. Ninguna fase puede crear calculo productivo, liquidacion o snapshot real saltandose ese contrato.

## 3.1 MOTOR-00 cerrado

MOTOR-00 queda cerrado como fase documental si:

- no modifica codigo funcional;
- define `MotorCalculoInput`;
- define `LiquidacionCalculada`;
- define orden de operaciones;
- define bloqueos previos;
- aplica tablas canonicas DB-01;
- deja casos de prueba para MOTOR-01;
- declara fuera de alcance Previred, LRE, PDF, cierre y contabilidad.

## 3.2 MOTOR-03A cerrado

MOTOR-03A queda cerrado como fase documental si:

- no modifica codigo funcional ni servicios;
- no crea SQL, migraciones, RLS ni tablas reales;
- define que es un snapshot preliminar y que no es liquidacion oficial;
- define estados permitidos del snapshot sin usar estados futuros de cierre, Previred, LRE o contabilizacion;
- propone tablas candidatas sin crearlas;
- define reglas de reemplazo, recalculo, historico, `version_motor` y `hash_snapshot`;
- define trazabilidad e issues persistibles;
- define relacion con `periodo_remuneracion` sin cerrar periodo;
- define relacion con liquidacion oficial futura;
- deja casos de prueba futuros para MOTOR-03B.

## 3.3 Bloqueadores de MOTOR-03B

Antes de implementar persistencia real de snapshots preliminares debe existir:

- MOTOR-03A cerrado y versionado.
- Decision tecnica sobre migraciones y RLS.
- Modelo SQL revisado contra DB-01 y convenciones reales del proyecto.
- Regla de snapshot activo unico por periodo y empresa.
- Politica de historico/anulacion de snapshots previos.
- Servicio de escritura acotado a calculos preliminares, sin cierre de periodo.
- Tests unitarios y de service para guardar, reemplazar, consultar y auditar snapshots.

## 3.4 MOTOR-03B cerrado

MOTOR-03B queda cerrado si:

- crea SQL local incremental sin aplicarlo a Supabase remoto;
- implementa mapping y hash deterministico simple de snapshot;
- implementa servicio/repository para guardar, consultar, listar, anular y recalcular/reemplazar;
- no guarda calculos con bloqueos;
- no borra fisicamente snapshots anteriores;
- no modifica estado de periodo;
- no genera liquidacion oficial, PDF, Previred, LRE ni contabilidad;
- deja documentacion y pruebas actualizadas.

## 3.5 Bloqueadores de MOTOR-03C

Antes de aplicar migracion o validar contra Supabase debe existir:

- SQL MOTOR-03B revisado.
- Decision de ambiente local/remoto y respaldo.
- Regeneracion de tipos Supabase planificada despues de aplicar SQL.
- Validacion de RLS minima o decision explicita de fase SEG-NOMINA.

## 3.6 MOTOR-03C cerrado

MOTOR-03C queda cerrado si:

- revisa el SQL de snapshots de MOTOR-03B;
- confirma PK/FK contra el esquema v11 existente;
- incluye `partes/15_nomina_calculo_snapshot.sql` en `bd/base/v11/run_all.sql`;
- documenta si la migracion fue aplicada local/remota o no;
- documenta si los tipos Supabase fueron regenerados o quedan pendientes;
- mantiene repository/servicio sin nuevas reglas de calculo;
- no cierra periodo;
- no genera liquidacion oficial, PDF, Previred, LRE ni contabilidad;
- deja como siguiente fase `SEG-NOMINA - RLS y permisos de snapshots de nomina`.

## 4. Bloqueadores de liquidaciones

Antes de implementar liquidaciones reales debe existir:

- Motor v1.
- Resultado calculado por trabajador.
- Lineas de haberes/descuentos/aportes.
- Snapshot de parametros usados.
- Estado de proceso mensual.
- Reglas de recalculo o bloqueo.

## 5. Bloqueadores de Previred

Antes de Previred debe existir:

- Liquidacion real.
- Datos previsionales completos.
- AFP / IPS / salud.
- Topes imponibles.
- SIS, AFC, SANNA, mutualidad si aplica.
- Contrato y tipo trabajador.
- Periodo cerrado o pre-cerrado.

## 6. Bloqueadores de LRE

Antes de LRE debe existir:

- Liquidaciones reales.
- Conceptos mapeados a LRE.
- Clasificacion imponible / tributable / informativa.
- Haberes, descuentos y aportes separados.
- Totales auditables.


## 7. Bloqueador documental DOC-04

Despues de DOC-04, la siguiente fase recomendada es **DB-01 - Confirmar tablas canonicas contra Supabase/PostgreSQL**. No implementar consultas, mappers, SQL ni servicios nuevos con nombres de tablas de parametros legales sin validar primero el diccionario canonico contra la BD real.
