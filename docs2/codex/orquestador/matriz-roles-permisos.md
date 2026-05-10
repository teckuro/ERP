# Matriz de roles y permisos

Estado: **SEG-01 en definicion**.

Este documento es la fuente base para la fase **SEG-01 - Roles, permisos, JWT/RLS base**.

No implementa permisos reales por si mismo. Define las reglas que despues deben guiar UI, servicios, guards, JWT/RLS, tests y documentacion tecnica.

## 1. Objetivo

Definir roles logicos, acciones permitidas, acciones bloqueadas y alcance esperado de permisos UI vs permisos BD/JWT/RLS antes de endurecer modulos productivos.

El objetivo no es crear seguridad perfecta en una sola fase. El objetivo es dejar una matriz clara para que Cursor/Codex implemente codigo sin decidir reglas de negocio.

## 2. Alcance

Esta fase cubre:

- Definicion de roles base.
- Definicion de acciones por modulo.
- Separacion entre permiso UI y permiso BD/JWT/RLS.
- Identificacion de acciones criticas.
- Identificacion de acciones solo admin.
- Identificacion de acciones bloqueadas hasta fases futuras.
- Criterios de cierre de SEG-01.
- Base para futuras implementaciones de guards, helpers, policies y tests.

## 3. Fuera de alcance

Esta fase no incluye:

- Motor de calculo.
- Liquidaciones reales.
- Cierre mensual real.
- Previred.
- LRE.
- Reportes finales.
- Rediseno visual.
- Refactor global de autenticacion.
- Implementacion completa de RLS si no se define como subfase tecnica.
- Migraciones destructivas.
- Cambios en calculos.

Tambien queda fuera cualquier cambio visual salvo ocultar, mostrar o deshabilitar acciones segun permisos.

## 4. Roles base

| Rol | Uso esperado | Nivel |
| --- | ------------ | ----- |
| `ADMIN_SISTEMA` | Administracion global, configuracion critica, seguridad y soporte tecnico. | Critico |
| `ADMIN_REMUNERACIONES` | Gestion funcional de remuneraciones, parametros operativos, conceptos, procesos y cierre. | Alto |
| `OPERADOR_REMUNERACIONES` | Operacion diaria: empleados, recurrentes, movimientos variables y validaciones. | Medio |
| `CONSULTA_REMUNERACIONES` | Solo lectura autorizada. No modifica datos operativos. | Bajo |

## 5. Regla de permisos

La seguridad debe separarse en capas:

| Capa | Objetivo | Ejemplo |
| ---- | -------- | ------- |
| UI | Mostrar, ocultar o deshabilitar acciones. | Ocultar boton `Cerrar periodo`. |
| Service | Evitar operaciones invalidas desde Angular. | Rechazar `crearMovimiento` sin permiso. |
| BD/JWT/RLS | Proteger datos aunque alguien salte la UI. | Policy para impedir `insert/update/delete`. |
| Auditoria | Registrar acciones criticas. | Registrar cierre de periodo o exportacion. |

Regla central:

```txt
Ocultar un boton no es seguridad.
```

Toda accion critica debe quedar protegida, como minimo, en una capa de negocio y en una capa de datos cuando exista implementacion real de BD/JWT/RLS.

## 6. Estados de decision

| Estado | Uso |
| ------ | --- |
| `PERMITIDO` | El rol puede ejecutar la accion cuando se cumplan reglas funcionales del modulo. |
| `SOLO_LECTURA` | El rol puede ver datos autorizados, sin crear, editar, anular, cerrar ni exportar. |
| `SOLO_ADMIN` | Accion reservada a `ADMIN_SISTEMA` o `ADMIN_REMUNERACIONES` segun modulo. |
| `BLOQUEADO_FASE_FUTURA` | Accion no debe implementarse todavia porque depende de una fase posterior. |
| `NO_APLICA` | La accion no corresponde al modulo o rol. |
| `A_DEFINIR` | Falta detalle tecnico o legal; no habilitar hasta cerrar definicion. |

Regla practica:

```txt
Ante duda, documentar A_DEFINIR y no habilitar la accion.
```

## 7. Acciones transversales

| Accion | Regla base | Observacion |
| ------ | ---------- | ----------- |
| Ver listado | Permitido segun rol y alcance de datos. | `CONSULTA_REMUNERACIONES` solo lectura. |
| Ver detalle | Permitido segun rol y alcance de datos. | No implica permiso de edicion. |
| Crear | Requiere rol operativo o admin. | No disponible para consulta. |
| Editar | Requiere rol operativo o admin. | Debe respetar estado del registro y periodo. |
| Anular / cerrar | Accion critica. | Requiere confirmacion y futura auditoria. |
| Eliminar fisico | Bloqueado por defecto. | Solo permitir si una fase futura lo define explicitamente. |
| Exportar | Accion critica. | Bloqueada si depende de liquidaciones, cierre, Previred o LRE reales. |
| Administrar seguridad | Solo `ADMIN_SISTEMA`. | Incluye roles, permisos, JWT/RLS y soporte tecnico. |

## 8. Matriz base por modulo

La matriz usa decisiones de grano grueso. Cada fase tecnica posterior debe convertir estas reglas en helpers, guards, services, policies y tests sin cambiar el contrato funcional.

| Modulo | Accion | `ADMIN_SISTEMA` | `ADMIN_REMUNERACIONES` | `OPERADOR_REMUNERACIONES` | `CONSULTA_REMUNERACIONES` | Nota |
| ------ | ------ | --------------- | ----------------------- | -------------------------- | -------------------------- | ---- |
| Empleados | Ver/listar | `PERMITIDO` | `PERMITIDO` | `PERMITIDO` | `SOLO_LECTURA` | Respetar alcance de datos cuando exista RLS. |
| Empleados | Crear/editar ficha operativa | `PERMITIDO` | `PERMITIDO` | `PERMITIDO` | `NO_APLICA` | No saltar reglas de completitud y aptitud. |
| Empleados | Validar para remuneraciones | `PERMITIDO` | `PERMITIDO` | `PERMITIDO` | `NO_APLICA` | Accion funcional, no solo visual. |
| Parametros | Ver parametros | `PERMITIDO` | `PERMITIDO` | `PERMITIDO` | `SOLO_LECTURA` | No mostrar datos demo como reales. |
| Parametros | Editar parametros operativos | `PERMITIDO` | `PERMITIDO` | `A_DEFINIR` | `NO_APLICA` | Definir detalle por tipo de parametro antes de implementar. |
| Parametros | Configuracion critica | `PERMITIDO` | `A_DEFINIR` | `NO_APLICA` | `NO_APLICA` | Cambios de seguridad o estructura quedan fuera de operacion diaria. |
| Conceptos | Ver catalogo | `PERMITIDO` | `PERMITIDO` | `PERMITIDO` | `SOLO_LECTURA` | CONC-02 debe usar esta base. |
| Conceptos | Crear/editar conceptos manuales | `PERMITIDO` | `PERMITIDO` | `A_DEFINIR` | `NO_APLICA` | No cerrar CONC-02 sin detalle por rol. |
| Conceptos | Editar automaticos/sistema | `SOLO_ADMIN` | `A_DEFINIR` | `NO_APLICA` | `NO_APLICA` | Debe quedar restringido en CONC-02. |
| Conceptos | Aportes empleador | `SOLO_ADMIN` | `A_DEFINIR` | `NO_APLICA` | `SOLO_LECTURA` | Riesgo funcional alto; no habilitar sin regla explicita. |
| Haberes recurrentes | Ver asignaciones | `PERMITIDO` | `PERMITIDO` | `PERMITIDO` | `SOLO_LECTURA` | Vista operativa e historica. |
| Haberes recurrentes | Crear/editar/cerrar asignacion | `PERMITIDO` | `PERMITIDO` | `PERMITIDO` | `NO_APLICA` | Debe respetar vigencias, duplicados y periodo cerrado futuro. |
| Movimientos variables | Ver movimientos | `PERMITIDO` | `PERMITIDO` | `PERMITIDO` | `SOLO_LECTURA` | Por periodo `YYYY-MM`. |
| Movimientos variables | Crear manual | `PERMITIDO` | `PERMITIDO` | `PERMITIDO` | `NO_APLICA` | Debe validar trabajador apto, contrato y concepto. |
| Movimientos variables | Editar/importar masivo | `A_DEFINIR` | `A_DEFINIR` | `BLOQUEADO_FASE_FUTURA` | `NO_APLICA` | No mezclar con SEG-01. |
| Movimientos variables | Anular | `PERMITIDO` | `PERMITIDO` | `PERMITIDO` | `NO_APLICA` | Accion critica; requiere motivo cuando aplique. |
| Proceso mensual | Ver estado/prevalidaciones | `PERMITIDO` | `PERMITIDO` | `PERMITIDO` | `SOLO_LECTURA` | Sin motor ni liquidaciones. |
| Proceso mensual | Ejecutar prevalidacion | `PERMITIDO` | `PERMITIDO` | `PERMITIDO` | `NO_APLICA` | No calcula montos. |
| Proceso mensual | Calcular remuneraciones | `BLOQUEADO_FASE_FUTURA` | `BLOQUEADO_FASE_FUTURA` | `BLOQUEADO_FASE_FUTURA` | `NO_APLICA` | Depende de MOTOR-00 y MOTOR-01. |
| Motor | Definir contrato | `PERMITIDO` | `PERMITIDO` | `A_DEFINIR` | `SOLO_LECTURA` | Corresponde a MOTOR-00 documental. |
| Motor | Ejecutar calculo productivo | `BLOQUEADO_FASE_FUTURA` | `BLOQUEADO_FASE_FUTURA` | `BLOQUEADO_FASE_FUTURA` | `NO_APLICA` | Prohibido antes de MOTOR-00 y MOTOR-01. |
| Liquidaciones | Ver pantalla demo/existente | `PERMITIDO` | `PERMITIDO` | `PERMITIDO` | `SOLO_LECTURA` | No tratar demo como productivo. |
| Liquidaciones | Generar liquidacion real | `BLOQUEADO_FASE_FUTURA` | `BLOQUEADO_FASE_FUTURA` | `BLOQUEADO_FASE_FUTURA` | `NO_APLICA` | Depende de MOTOR-01 y LIQ-01. |
| Cierre mensual | Ver estado futuro | `A_DEFINIR` | `A_DEFINIR` | `A_DEFINIR` | `SOLO_LECTURA` | Depende de LIQ-01. |
| Cierre mensual | Cerrar/reabrir periodo | `BLOQUEADO_FASE_FUTURA` | `BLOQUEADO_FASE_FUTURA` | `NO_APLICA` | `NO_APLICA` | Depende de CIERRE-01. |
| Previred | Ver preparacion futura | `A_DEFINIR` | `A_DEFINIR` | `A_DEFINIR` | `SOLO_LECTURA` | Depende de liquidaciones reales. |
| Previred | Exportar archivo | `BLOQUEADO_FASE_FUTURA` | `BLOQUEADO_FASE_FUTURA` | `NO_APLICA` | `NO_APLICA` | Depende de PREVIRED-01/02. |
| LRE | Ver preparacion futura | `A_DEFINIR` | `A_DEFINIR` | `A_DEFINIR` | `SOLO_LECTURA` | Depende de conceptos mapeados y liquidaciones. |
| LRE | Exportar libro | `BLOQUEADO_FASE_FUTURA` | `BLOQUEADO_FASE_FUTURA` | `NO_APLICA` | `NO_APLICA` | Depende de LRE-01/02. |
| Reportes | Ver reportes operativos | `A_DEFINIR` | `A_DEFINIR` | `A_DEFINIR` | `SOLO_LECTURA` | Depende de datos reales o snapshots. |
| Reportes | Auditoria avanzada | `A_DEFINIR` | `A_DEFINIR` | `NO_APLICA` | `NO_APLICA` | Depende de REPORTES-01/AUD futura. |
| Seguridad | Administrar roles/permisos | `PERMITIDO` | `NO_APLICA` | `NO_APLICA` | `NO_APLICA` | Solo `ADMIN_SISTEMA`. |
| Seguridad | Ver matriz/documentacion | `PERMITIDO` | `PERMITIDO` | `SOLO_LECTURA` | `SOLO_LECTURA` | No implica permiso de administracion. |

## 9. Acciones criticas

Estas acciones no deben depender solo de la UI:

- Administrar roles o permisos.
- Cambiar configuracion critica.
- Crear o editar conceptos de sistema.
- Cambiar aportes empleador.
- Anular movimientos o asignaciones.
- Ejecutar calculo de motor.
- Generar liquidaciones reales.
- Cerrar o reabrir periodo.
- Exportar Previred.
- Exportar LRE.
- Consultar auditoria sensible.

Cuando se implementen, deben considerar:

- Validacion en UI.
- Validacion en service/helper.
- Proteccion BD/JWT/RLS cuando exista capa tecnica.
- Auditoria si la accion cambia estado legal, monetario o de cierre.

## 10. Acciones bloqueadas hasta fases futuras

| Accion | Fase minima | Motivo |
| ------ | ----------- | ------ |
| Ejecutar motor productivo | MOTOR-01 | Requiere MOTOR-00 cerrado. |
| Generar liquidaciones reales | LIQ-01 | Requiere resultado de motor. |
| Cerrar periodo | CIERRE-01 | Requiere liquidaciones reales y reglas de cierre. |
| Exportar Previred | PREVIRED-01 | Requiere liquidaciones reales y datos previsionales. |
| Exportar LRE | LRE-01 | Requiere conceptos mapeados y liquidaciones snapshot. |
| Reportes/auditoria final | REPORTES-01 | Requiere datos cerrados o trazables. |
| Pulido visual integral | UX-FINAL-01 | No debe interrumpir fases funcionales. |

## 11. Reglas para implementacion futura

Cuando esta matriz se implemente en codigo:

- No cambiar reglas de negocio dentro de guards o componentes.
- Centralizar decisiones de permisos en helpers o servicios nombrados.
- Evitar permisos hardcodeados dispersos en pantallas.
- Separar `canView`, `canCreate`, `canEdit`, `canAnular`, `canCerrar`, `canExportar`.
- Mantener mensajes breves y operativos.
- No habilitar acciones con estado `A_DEFINIR` o `BLOQUEADO_FASE_FUTURA`.
- Agregar tests para acciones criticas y casos prohibidos.
- Documentar si una regla queda solo en UI temporalmente.

## 12. Dependencias

| Dependencia | Estado | Uso en SEG-01 |
| ----------- | ------ | ------------- |
| ORDEN-01 | Cerrada | Define el camino oficial. |
| `roadmap-operativo.md` | Vigente | Mantiene SEG-01 antes de CONC-02. |
| `dependencias-fases.md` | Vigente | Bloquea motor, liquidaciones, Previred y LRE hasta dependencias. |
| `criterios-cierre-fases.md` | Vigente | Define criterios de seguridad. |
| `estado-fases.md` | Vigente | Debe mantener SEG-01 en definicion hasta cierre posterior. |

## 13. Criterios de cierre SEG-01

SEG-01 puede pasar a **Cerrada base** solo si:

- La matriz por modulo y accion queda revisada.
- No quedan acciones criticas sin clasificacion.
- Queda separada la responsabilidad UI, service, BD/JWT/RLS y auditoria.
- Quedan identificadas acciones solo admin.
- Quedan identificadas acciones bloqueadas hasta fases futuras.
- Queda definido que se implementa ahora y que se pospone a una subfase tecnica.
- `estado-fases.md`, `roadmap-operativo.md`, `mapa-documentacion.md` y `criterios-cierre-fases.md` quedan alineados.

## 14. Siguiente fase logica

Cuando SEG-01 quede cerrada base, la siguiente fase oficial sigue siendo:

```txt
CONC-02 - Conceptos gobernados para motor
```

CONC-02 debe usar esta matriz para definir restricciones por rol antes de cerrar conceptos para motor, liquidaciones y LRE.

<!-- ARQ-ERP-01-INTEGRACION -->

## Nota de permisos - Novedades mensuales

Las reglas historicas de Movimientos variables deben mapearse al flujo canonico **Novedades mensuales** antes de endurecer RLS productivo.

Acciones futuras a modelar:

| Dominio | Accion | Nota |
|---|---|---|
| Novedades mensuales | Ver por periodo | Reemplaza funcionalmente lectura de movimientos variables. |
| Novedades mensuales | Crear borrador | Permitido a RRHH/administrador segun rol futuro. |
| Novedades mensuales | Enviar a revision | Requiere validaciones minimas. |
| Novedades mensuales | Aprobar/observar/rechazar | Debe ser controlado por rol. |
| Novedades mensuales | Anular | Accion critica; requiere motivo. |
| Novedades mensuales | Editar calculada | Bloqueado salvo reapertura/version futura. |

Pendiente: SEG-NOV-02 debe implementar o confirmar RLS para `novedad_remuneracion_periodo`.
