# UNIF-NOM - Plan de transicion Novedades mensuales / Movimientos variables

## 1. Objetivo

Este documento integra la transicion entre el flujo historico de **Movimientos variables** y el flujo canonico de **Novedades mensuales** sin borrar archivos, tablas ni historia documental.

## 2. Decision

| Concepto | Decision |
|---|---|
| Nombre visible oficial para RRHH | Movimientos del mes |
| Nombre tecnico/documental | Novedades mensuales |
| Tabla canonica futura | `novedad_remuneracion_periodo` |
| Termino historico/tecnico | Movimientos variables |
| Tabla legacy | `movimiento_variable_mensual` |
| UI final recomendada | Solo Movimientos del mes sobre el flujo tecnico de Novedades mensuales |
| UI legacy | Mantener temporalmente, ocultar o redirigir en fase futura |

Decision USAB-NOM-01:

- `Movimientos del mes` es el nombre visible oficial del flujo canonico.
- `Novedades mensuales` queda como nombre tecnico/documental interno asociado a `novedad_remuneracion_periodo`.
- `Movimientos variables` queda como modulo legacy/transicion y no debe promoverse en el menu principal.

## 3. Por que no borrar ahora

No se borra `movimiento_variable_mensual`, sus documentos ni su feature porque:

- puede haber datos existentes;
- Proceso mensual consumia `MovimientosVariablesService` directamente antes de UNIF-NOM-03;
- hay fases 9.4B-9.4E documentadas que explican decisiones historicas;
- borrar ahora rompe trazabilidad y puede romper flujo actual.

## 4. Como debe avanzar el proyecto

### Fase 1 - Consolidacion documental

Estado: documentada en `estructura-canonica-erp.md`.

Resultado:

- Novedades mensuales queda como canonico.
- Movimientos variables queda como legacy/transicion.

### Fase 2 - Permisos/RLS de novedades

Verificar e implementar reglas para `novedad_remuneracion_periodo` antes de usarla productivamente.

### Fase 3 - Entradas mensuales canonicas

Crear `EntradasMensualesPeriodoService` para unificar:

- asignaciones recurrentes;
- novedades mensuales aprobadas;
- movimientos variables legacy durante transicion.

Estado UNIF-NOM-02: **cerrada base**.

Resultado:

- se crea `EntradaMensualPeriodo`;
- se crean reglas puras de normalizacion y resumen;
- se crea `EntradasMensualesPeriodoService`;
- se leen fuentes actuales sin cambiar sus datos ni estados;
- `VALIDADO` legacy se normaliza como `aprobada` para compatibilidad de transicion;
- `BLOQUEADO` legacy se normaliza como `legacy_bloqueado` y bloquea proceso.

No incluido:

- adaptar `ProcesoMensualService`;
- migrar datos;
- reemplazar `MovimientosVariablesService`;
- ocultar rutas legacy;
- tocar UI, SQL, motor, liquidaciones, Previred/LRE o Python.

### Fase 4 - Proceso mensual

Adaptar Proceso mensual para consumir entradas normalizadas, no `MovimientosVariablesService` directamente.

Estado UNIF-NOM-03: **cerrada base**.

Resultado:

- `ProcesoMensualService` consume `EntradasMensualesPeriodoService`;
- deja de inyectar `MovimientosVariablesService` directamente;
- Novedades mensuales aprobadas entran al resumen/prevalidacion mediante entradas canonicas;
- movimientos variables siguen disponibles como origen `legacy_movimiento_variable` durante transicion;
- se mantienen alias de conteos legacy para compatibilidad temporal de UI/pre-nomina;
- no se escriben estados fuente ni se modifica `novedad_remuneracion_periodo` o `movimiento_variable_mensual`;
- no se toca motor, liquidaciones, cierre, SQL, Python, Previred/LRE, rutas ni sidebar.

### Fase 5 - UI

Dejar Novedades mensuales como pantalla principal y tratar Movimientos variables como legacy.

Estado NOM-UX-01: **cerrada base**.

Resultado:

- Novedades mensuales queda visible en el sidebar como flujo principal de RRHH.
- Movimientos variables sale del menu principal y se conserva por ruta legacy `/remuneraciones/movimientos-variables`.
- No se borra modulo, service, tabla ni documentacion historica.
- No se migran datos y no se modifica SQL/RLS.
- No se modifica motor, contrato de entrada del motor, formulas legales, liquidaciones, Previred/LRE ni Python.

### Fase 6 - Migracion/archivado

Solo despues de validar datos reales, definir si:

- se migran registros legacy;
- se mantiene historico de solo lectura;
- se elimina ruta legacy;
- se conserva tabla por auditoria.

### Fase 7 - Contrato de entrada del motor

Estado MOTOR-04: **cerrada base**.

Resultado:

- `MotorCalculoInput` incorpora `entradasMensuales`.
- Las entradas se mapean desde `EntradaMensualPeriodo` a `EntradaMensualMotor`.
- Solo entran al contrato del motor las entradas aptas para pre-nomina.
- Legacy validado puede entrar como transicion si ya fue normalizado como aprobado.
- Borrador, pendiente_revision, observada, rechazada, anulada y legacy bloqueado quedan excluidas.
- Decision: Opcion A contrato preparatorio; no se cambian formulas ni resultados legales.

No incluido:

- calculo de entradas mensuales sobre bases;
- cambio de AFP, salud, AFC, SIS, SANNA, impuesto unico o Ley 16.744;
- liquidacion oficial;
- cierre;
- SQL/RLS;
- Python;
- Previred/LRE.

## 5. Reglas durante la transicion

- No crear nuevas mejoras sobre Movimientos variables salvo bugs criticos.
- No crear nuevos motores leyendo `movimiento_variable_mensual` directamente.
- No duplicar carga manual en ambas pantallas.
- Novedades mensuales entra al proceso mensual solo por `EntradasMensualesPeriodoService`; no por lecturas directas desde el motor ni por duplicar fuentes.
- No mezclar estados legacy con estados canonicos sin mapper.

## 6. Mapeo conceptual de estados

| Legacy movimientos | Canonico novedades | Comentario |
|---|---|---|
| `BORRADOR` | `borrador` | Editable / no aprobado. |
| `VALIDADO` | `aprobada` | Listo para pre-nomina. |
| `OBSERVADO` | `observada` o `pendiente_revision` | Se recomienda agregar/soportar `observada` si el flujo necesita correccion sin rechazo. |
| `ANULADO` | `anulada` | No entra al proceso. |
| `BLOQUEADO` | bloqueo por validacion/periodo | Mejor como condicion derivada, no necesariamente estado principal. |
| `INCLUIDO_EN_PROCESO` | `incorporada_a_pre_nomina` | Tomado por pre-nomina. |

## 7. Pendientes tecnicos

| Pendiente | Riesgo si no se resuelve |
|---|---|
| RLS de `novedad_remuneracion_periodo` | UI puede fallar o exponer permisos incorrectos. |
| Mapper legacy -> canonico | Proceso mensual puede duplicar u omitir entradas. |
| Cerrar transicion visual completa | NOM-UX-01 oculta la entrada legacy del sidebar, pero la ruta legacy sigue disponible para compatibilidad. |
| Definir efecto calculable de entradas mensuales | MOTOR-04 ya entrega entradas aptas al contrato; falta definir como afectan bases, liquido y trazabilidad calculada sin romper formulas legales. |
| Definicion LIQ-00 | Snapshots y liquidacion final pueden divergir. |

## 8. Criterio de cierre de la transicion

La transicion se considera cerrada cuando:

- Proceso mensual consume entradas canonicas;
- Novedades mensuales es la unica UI productiva para hechos del periodo;
- Movimientos variables queda solo lectura/oculto/migrado;
- motor recibe novedades aprobadas desde contrato de entrada;
- una fase posterior define el efecto calculable definitivo sobre haberes, descuentos y bases;
- documentacion no invita a mejorar el modulo legacy.
