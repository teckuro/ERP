# Prioridad canonica 2026-05-10

Secuencia vigente:

```txt
NOM-CIERRE-01
-> LIQ-DESIGN-01
-> LIQ-OFICIAL-01
-> UX-COMERCIAL-01
-> PREVIRED-DESIGN-01 / LRE-DESIGN-01 / BANCO-DESIGN-01 / CONTABILIDAD-DESIGN-01
```

No dejar Previred, LRE, banco ni contabilidad como prioridad inmediata antes de cierre, liquidaciones oficiales y UX comercial.

---

# Roadmap maestro de pendientes, fases y mejoras

Estado: **Documento puente**.

Destino sugerido:

```txt
docs/codex/orquestador/roadmap-maestro-pendientes-fases.md
```

Este documento no reemplaza al tablero vivo ni a los contratos por modulo. Su objetivo es servir como insumo unico para ordenar el roadmap oficial del ERP antes de implementar nuevas fases.

## 1. Objetivo

Ordenar todo lo que falta en el ERP de remuneraciones chileno: fases, mejoras, bloqueadores, dependencias, prioridades, criterios de cierre y documentos que deben actualizarse.

Este documento debe ayudar a que Cursor/Codex cree o actualice un roadmap bien estructurado sin decidir el camino por intuicion.

Regla central:

```txt
El roadmap decide el camino.
Cursor/Codex solo ordena documentos o ejecuta fases acotadas cuando el alcance esta definido.
```

## 2. Alcance

Este documento cubre:

- Inventario macro del estado actual.
- Fases cerradas, parciales, pendientes y bloqueadas.
- Mejoras pendientes por area.
- Dependencias entre fases.
- Orden recomendado de avance.
- Criterios de cierre por fase.
- Documentos que deben crearse o actualizarse.
- Instrucciones para que un agente estructure el roadmap oficial.

## 3. Fuera de alcance

Este documento no incluye:

- Codigo Angular.
- SQL.
- Migraciones.
- Python.
- RLS/JWT real.
- Motor de calculo.
- Liquidaciones reales.
- Cierre mensual real.
- Exportacion Previred.
- LRE.
- Redisenos visuales.
- Tests nuevos.

No debe usarse para implementar. Debe usarse para ordenar.

## 4. Documentos fuente a leer antes de tocar el roadmap

| Documento | Rol |
|-----------|-----|
| `docs/codex/orquestador/README.md` | Define rol del orquestador y orden de lectura. |
| `docs/codex/orquestador/contexto-proyecto.md` | Contexto macro del ERP. |
| `docs/codex/orquestador/estado-fases.md` | Tablero vivo de fases. |
| `docs/codex/orquestador/mapa-documentacion.md` | Inventario oficial de documentos. |
| `docs/codex/orquestador/roadmap-operativo.md` | Roadmap operativo actual. |
| `docs/codex/orquestador/dependencias-fases.md` | Dependencias y bloqueadores actuales. |
| `docs/codex/orquestador/criterios-cierre-fases.md` | Estados y criterios de cierre. |
| `docs/codex/orquestador/orden-prioridades.md` | Prioridad alta, media y baja. |
| `docs/codex/orquestador/diseno-operativo-erp.md` | Diseno operativo y siguiente fase fuerte. |
| `docs/codex/orquestador/matriz-roles-permisos.md` | Placeholder o contrato futuro de SEG-01. |
| `docs/codex/modulos/*/README.md` | Punto de entrada por modulo. |
| `docs/codex/AGENTS.md` | Contrato del agente y checklist. |
| `docs/codex/ui-form-guidelines.md` | Formularios si la fase toca UI. |
| `docs/codex/estilos/README.md` | Layout si la fase toca UI. |

## 5. Estado macro actual

| Area | Estado | Lectura operativa |
|------|--------|-------------------|
| Contrato `docs/codex` | Cerrada | La estructura documental existe y manda el trabajo del agente. |
| Parametros | Cerrada | Periodo, vigencias, catalogos, UI y Python v6.11 estan documentados. |
| Python / BD v11 | Cerrada base | Existen pendientes no bloqueantes; no abrir salvo fase especifica. |
| Empleados | Cerrada | Alta, borrador, continuar alta, ficha, estado y aptitud. |
| Haberes recurrentes | Cerrada base | Recurrentes por trabajador y vigencia; no mezclar con variables. |
| Movimientos variables | Parcial avanzado | Base manual cerrada; faltan permisos, edicion/importacion y cierre por periodo. |
| Proceso mensual | Parcial | 9.5A y 9.5B cerradas como prevalidaciones; sin motor. |
| Conceptos | Parcial | Falta gobierno final, roles/permisos, reglas de uso para motor y LRE. |
| Seguridad / RLS / JWT | Pendiente | Debe ordenarse antes de endurecer modulos productivos. |
| Motor de calculo | Pendiente | No implementar sin contrato `MOTOR-00`. |
| Liquidaciones | Pendiente real | No usar UI demo como productiva. |
| Cierre mensual | Pendiente | Depende de liquidaciones reales. |
| Previred | Pendiente | Depende de liquidaciones y cierre/pre-cierre. |
| LRE | Pendiente | Depende de conceptos mapeados y liquidaciones. |
| Reportes / auditoria | Pendiente | Depende de cierre, snapshots y trazabilidad. |
| Pulido visual final | Pendiente | Agrupar en fase unica posterior. |

## 6. Principio rector

Prioridad actual:

1. Funcionalidad correcta.
2. Reglas de negocio consistentes.
3. Datos confiables.
4. Seguridad y permisos.
5. Trazabilidad.
6. UI minima correcta.
7. Pulido visual final posterior.

Reglas:

- No hacer perfeccion visual en cada fase.
- No saltar a motor sin conceptos gobernados.
- No saltar a liquidaciones sin motor.
- No saltar a Previred/LRE sin liquidaciones reales.
- No mezclar recurrentes, variables, motor y exportaciones en una sola fase.
- No usar datos demo como si fueran productivos.

## 7. Cadena critica del producto

```txt
Empleados aptos
  |
  v
Parametros del periodo
  |
  v
Conceptos gobernados
  |
  v
Haberes recurrentes + movimientos variables
  |
  v
Proceso mensual validado
  |
  v
Contrato del motor
  |
  v
Motor de calculo v1
  |
  v
Liquidaciones snapshot
  |
  v
Cierre mensual
  |
  v
Previred / LRE
  |
  v
Reportes / auditoria
```

## 8. Bloqueadores principales

| Bloqueador | Impide avanzar a | Motivo |
|------------|------------------|--------|
| ORDEN-01 no integrada | SEG-01 y roadmap confiable | El tablero/mapa no reflejan el nuevo camino. |
| Matriz de roles vacia | RLS/JWT y permisos | No hay acciones por rol ni reglas productivas. |
| Conceptos parciales | Motor, LRE, liquidaciones | El motor necesita conceptos gobernados y clasificables. |
| Motor sin contrato | Motor v1 | Sin entradas/salidas se crea una funcion gigante sin control. |
| Liquidaciones demo | Cierre, Previred, LRE | No hay snapshot real ni resultado auditable. |
| Proceso mensual sin estados de cierre | Cierre mensual | No hay flujo de bloqueo/recalculo/cierre. |
| Sin mapeo LRE completo | LRE | No se puede exportar libro confiable. |
| Sin snapshots | Auditoria/reportes | No se puede explicar como se calculo un periodo. |

## 9. Fases recomendadas

| Orden | Fase | Prioridad | Tipo | Estado objetivo |
|-------|------|-----------|------|-----------------|
| 1 | ORDEN-01 - Integracion final del roadmap | Alta | Documentacion | Cerrada |
| 2 | SEG-01 - Roles, permisos, JWT/RLS base | Alta | Seguridad/documentacion | Cerrada base |
| 3 | CONC-02 - Conceptos gobernados para motor | Alta | Funcional/reglas | Cerrada |
| 4 | MOTOR-00 - Contrato del motor de calculo | Alta | Documentacion/arquitectura | Cerrada |
| 5 | MOTOR-01 - Motor de calculo v1 acotado | Alta | Funcional/calculo | Cerrada base |
| 6 | LIQ-01 - Liquidaciones snapshot | Alta | Funcional/auditoria | Cerrada base |
| 7 | CIERRE-01 - Cierre mensual | Media | Funcional/estado | Cerrada base |
| 8 | PREVIRED-01 - Base de exportacion Previred | Media | Integracion/legal | Cerrada base |
| 9 | LRE-01 - Libro de Remuneraciones Electronico | Media | Integracion/legal | Cerrada base |
| 10 | REPORTES-01 - Reportes y auditoria | Media | Reportes/auditoria | Cerrada base |
| 11 | UX-FINAL-01 - Pulido visual integral | Baja por ahora | Visual | Cerrada |

## 10. Fase ORDEN-01 - Integracion final del roadmap

### 10.1 Objetivo

Cerrar administrativamente ORDEN-01 dentro del orquestador, integrando los documentos nuevos en el tablero vivo, mapa, README y diseno operativo.

### 10.2 Alcance

- Marcar ORDEN-01 como `Cerrada` en `estado-fases.md`.
- Agregar los documentos nuevos al `mapa-documentacion.md`.
- Actualizar el orden de lectura en `orquestador/README.md`.
- Alinear `diseno-operativo-erp.md` con el nuevo orden: `SEG-01 -> CONC-02 -> MOTOR-00`.
- Dejar `matriz-roles-permisos.md` como placeholder valido de SEG-01 si aun esta vacio.

### 10.3 Fuera de alcance

- Codigo Angular.
- SQL.
- Python.
- Cambios visuales.
- Tests nuevos.
- Implementar RLS/JWT real.

### 10.4 Dependencias

| Dependencia | Estado | Motivo |
|-------------|--------|--------|
| `roadmap-operativo.md` | Existe | Define orden recomendado. |
| `dependencias-fases.md` | Existe | Define bloqueadores. |
| `criterios-cierre-fases.md` | Existe | Define estados y cierre. |
| `orden-prioridades.md` | Existe | Define prioridades. |
| `estado-fases.md` | Parcial | Falta integrar ORDEN-01 en tabla principal. |
| `mapa-documentacion.md` | Parcial | Falta registrar docs nuevos. |
| `README.md` | Parcial | Falta nuevo orden de lectura. |
| `matriz-roles-permisos.md` | Pendiente | Esta vacio o incompleto. |

### 10.5 Reglas funcionales

- El roadmap debe quedar como fuente de orden, no como bitacora larga.
- El tablero vivo debe reflejar ORDEN-01 como cerrada.
- SEG-01 debe quedar como siguiente fase real.
- Conceptos sigue siendo fase fuerte de producto, pero no debe saltarse SEG-01.

### 10.6 Flujo resumido

```txt
roadmap creado
  |
  v
tablero actualizado
  |
  v
mapa actualizado
  |
  v
README actualizado
  |
  v
siguiente fase = SEG-01
```

### 10.7 Documentos relacionados

| Documento | Accion esperada |
|-----------|-----------------|
| `estado-fases.md` | Agregar ORDEN-01 como cerrada y actualizar orden recomendado. |
| `mapa-documentacion.md` | Agregar roadmap, dependencias, criterios, prioridades y matriz. |
| `README.md` | Actualizar orden de lectura. |
| `diseno-operativo-erp.md` | Aclarar SEG-01 antes de CONC-02. |
| `matriz-roles-permisos.md` | Agregar placeholder si esta vacio. |

### 10.8 Pruebas / validacion

Validacion documental:

- ORDEN-01 aparece en tabla principal.
- Los documentos nuevos aparecen en el mapa.
- README muestra el nuevo orden de lectura.
- `matriz-roles-permisos.md` no queda vacio.
- No se tocaron archivos fuera de `docs/codex/orquestador/`.

### 10.9 Criterios de cierre

ORDEN-01 queda cerrada si:

- `estado-fases.md` marca ORDEN-01 como **Cerrada**.
- `mapa-documentacion.md` incluye los nuevos documentos.
- El README del orquestador contiene el nuevo orden de lectura.
- `diseno-operativo-erp.md` no contradice el orden `SEG-01 -> CONC-02 -> MOTOR-00`.
- `matriz-roles-permisos.md` queda como documento pendiente de SEG-01, no vacio.

### 10.10 Relacion con fases siguientes

Desbloquea:

- `SEG-01 - Roles, permisos, JWT/RLS base`.
- `CONC-02 - Conceptos gobernados para motor`.
- `MOTOR-00 - Contrato del motor de calculo`.

No desbloquea todavia:

- `MOTOR-01`.
- `LIQ-01`.
- `PREVIRED-01`.
- `LRE-01`.

## 11. Fase SEG-01 - Roles, permisos, JWT/RLS base

### 11.1 Objetivo

Definir roles logicos, acciones permitidas, acciones bloqueadas y alcance esperado de RLS/JWT antes de endurecer modulos productivos.

### 11.2 Alcance

- Completar `matriz-roles-permisos.md`.
- Definir roles logicos del ERP.
- Definir acciones por modulo.
- Separar permisos UI de permisos BD.
- Definir que se valida ahora y que se implementa despues.
- Dejar contrato listo antes de RLS real.

### 11.3 Fuera de alcance

- Crear RLS real en SQL si no esta aprobado.
- Cambiar autenticacion.
- Cambiar codigo Angular.
- Tocar Supabase remoto.
- Bloquear usuarios reales sin validacion.

### 11.4 Dependencias

| Dependencia | Estado | Motivo |
|-------------|--------|--------|
| ORDEN-01 | Debe estar cerrada | Define camino y no mezclar fases. |
| `AGENTS.md` | Vigente | Contrato general del agente. |
| Modulos actuales | Vigentes | Definen flujos y acciones reales. |

### 11.5 Roles preliminares

| Rol | Uso esperado |
|-----|--------------|
| `ADMIN_SISTEMA` | Administracion global, configuracion critica y seguridad. |
| `ADMIN_REMUNERACIONES` | Gestion funcional de remuneraciones, conceptos, parametros y cierre. |
| `OPERADOR_REMUNERACIONES` | Operacion diaria: recurrentes, variables, validaciones y proceso mensual. |
| `CONSULTA_REMUNERACIONES` | Solo lectura autorizada. |

### 11.6 Modulos a cubrir

- Empleados.
- Parametros.
- Conceptos.
- Haberes recurrentes.
- Movimientos variables.
- Proceso mensual.
- Motor.
- Liquidaciones.
- Cierre mensual.
- Previred.
- LRE.
- Reportes.

### 11.7 Criterios de cierre

SEG-01 queda cerrada base si:

- Existen roles definidos.
- Existe matriz por modulo y accion.
- Se separa permiso UI de permiso BD.
- Se define que acciones son solo admin.
- Se define que acciones quedan bloqueadas hasta futuras fases.
- Queda claro si RLS real se implementa ahora o en una fase posterior.

## 12. Fase CONC-02 - Conceptos gobernados para motor

### 12.1 Objetivo

Dejar `Conceptos de remuneracion` como catalogo confiable para haberes, descuentos, aportes, motor, liquidaciones y LRE.

### 12.2 Alcance

- Cerrar reglas de asignabilidad.
- Separar conceptos manuales, automaticos y de sistema.
- Definir si un concepto se puede usar en recurrentes.
- Definir si un concepto se puede usar en movimientos variables.
- Definir aportes empleador y reglas de edicion.
- Revisar mapeo LRE minimo.
- Documentar restricciones por rol segun SEG-01.

### 12.3 Fuera de alcance

- Asignar conceptos a trabajadores.
- Calcular montos.
- Generar liquidaciones.
- Exportar LRE.
- Redisenar visualmente la pantalla completa.

### 12.4 Dependencias

| Dependencia | Estado | Motivo |
|-------------|--------|--------|
| SEG-01 | Necesaria | Conceptos requiere permisos claros. |
| `modulos/conceptos-remuneracion/contrato-general.md` | Vigente | Contrato del modulo. |
| `modulos/conceptos-remuneracion/contrato-funcional.md` | Vigente/parcial | Reglas funcionales. |
| `modulos/haberes-descuentos/contrato-general.md` | Vigente | Relacion con recurrentes. |
| `modulos/movimientos-variables/contrato-general.md` | Vigente | Relacion con variables. |

### 12.5 Reglas funcionales

- Concepto no es asignacion.
- Recurrentes asignan conceptos a trabajadores con vigencia.
- Movimientos variables asignan conceptos por periodo.
- Conceptos automaticos no deben editarse como conceptos manuales comunes.
- Aportes empleador deben tener regla de permisos estricta.
- Conceptos con impacto LRE deben quedar clasificados antes de exportar.

### 12.6 Criterios de cierre

CONC-02 queda cerrada si:

- El modulo define conceptos editables y no editables.
- Existen reglas de uso en recurrentes y variables.
- Queda claro que consume el motor.
- Queda claro que necesita LRE.
- Quedan documentados permisos o restricciones por rol.
- No se mezcla con asignaciones por trabajador.

## 13. Fase MOTOR-00 - Contrato del motor de calculo

### 13.1 Objetivo

Documentar el contrato del motor antes de implementarlo.

### 13.2 Alcance

- Definir entradas del motor.
- Definir salidas del motor.
- Definir calculos incluidos en v1.
- Definir calculos excluidos de v1.
- Definir snapshots.
- Definir errores, bloqueos y advertencias.
- Definir relacion con proceso mensual.

### 13.3 Fuera de alcance

- Implementar motor.
- Generar liquidaciones.
- Crear Previred.
- Crear LRE.
- Optimizar UI.

### 13.4 Entradas minimas

| Entrada | Fuente esperada |
|---------|-----------------|
| Periodo `YYYY-MM` | Proceso mensual / periodo activo. |
| Trabajadores aptos | Empleados. |
| Contrato vigente | Empleados/contrato. |
| Parametros del periodo | Parametros. |
| Conceptos gobernados | Conceptos. |
| Haberes recurrentes vigentes | Haberes recurrentes. |
| Movimientos variables validados | Movimientos variables. |

### 13.5 Salidas minimas

| Salida | Uso futuro |
|--------|------------|
| Resultado por trabajador | Base de liquidacion. |
| Lineas de haberes | Liquidacion y LRE. |
| Lineas de descuentos | Liquidacion y Previred/LRE. |
| Lineas de aportes empleador | Previred/reportes. |
| Totales | Liquidacion y reportes. |
| Bloqueos/advertencias | Proceso mensual. |
| Snapshot de parametros | Auditoria. |

### 13.6 Criterios de cierre

MOTOR-00 queda cerrada si:

- Existe documento de contrato del motor.
- Se declaran entradas y salidas.
- Se separa v1 de futuras versiones.
- Se define snapshot minimo.
- Se define como interactua con proceso mensual.
- Se define que no se calculara todavia.

## 14. Fase MOTOR-01 - Motor de calculo v1 acotado

### 14.1 Objetivo

Implementar una primera version acotada del motor usando solo lo definido en `MOTOR-00`.

### 14.2 Alcance preliminar

- Calculo por periodo.
- Trabajadores aptos.
- Haberes recurrentes vigentes.
- Movimientos variables validados.
- Conceptos gobernados.
- Parametros minimos.
- Resultado interno calculado.

### 14.3 Fuera de alcance

- Liquidacion PDF/final.
- Previred.
- LRE.
- Cierre definitivo.
- Casos legales avanzados no documentados.
- UI visual compleja.

### 14.4 Criterios de cierre

MOTOR-01 queda cerrada base si:

- Calcula un resultado interno por trabajador.
- No usa datos demo.
- Entrega lineas y totales trazables.
- Tiene tests de reglas puras.
- No genera liquidacion final aun.
- No muta datos productivos sin contrato.

## 15. Fase LIQ-01 - Liquidaciones snapshot

### 15.1 Objetivo

Generar liquidaciones reales a partir del resultado del motor, con snapshot de parametros, conceptos y lineas.

### 15.2 Alcance preliminar

- Crear modelo de liquidacion snapshot.
- Guardar resultado por trabajador.
- Guardar lineas de haberes, descuentos y aportes.
- Mostrar liquidacion real, no demo.
- Definir estados: borrador, generada, revisada, cerrada/anulada si aplica.

### 15.3 Fuera de alcance

- Previred.
- LRE.
- Cierre mensual definitivo.
- PDF legal final si no esta definido.
- Firma o distribucion masiva.

### 15.4 Criterios de cierre

LIQ-01 queda cerrada base si:

- La liquidacion viene del motor.
- Los datos quedan congelados.
- No depende de recalcular en pantalla.
- Se puede auditar que parametros se usaron.
- Se separa liquidacion de cierre mensual.

## 16. Fase CIERRE-01 - Cierre mensual

### 16.1 Objetivo

Definir y aplicar estados de cierre para un periodo de remuneraciones.

### 16.2 Alcance preliminar

- Estados de periodo.
- Bloqueos por periodo cerrado.
- Reglas de recalculo.
- Reglas de reapertura si aplica.
- Validaciones antes de cierre.

### 16.3 Fuera de alcance

- Exportaciones legales finales si no existen liquidaciones cerradas.
- Cambios contables avanzados.
- Conciliacion bancaria.

### 16.4 Criterios de cierre

CIERRE-01 queda cerrada base si:

- Existe flujo de cierre.
- Existen bloqueos de modificacion.
- Existe trazabilidad de quien cerro y cuando si aplica.
- Se define si el periodo se puede reabrir.

## 17. Fase PREVIRED-01 - Base de exportacion Previred

### 17.1 Objetivo

Preparar exportacion Previred desde liquidaciones reales y datos previsionales completos.

### 17.2 Alcance preliminar

- Definir contrato de datos Previred.
- Mapear AFP/IPS/salud/AFC/SIS/SANNA/mutualidad si aplica.
- Usar topes y parametros del periodo.
- Validar trabajadores con datos incompletos.

### 17.3 Fuera de alcance

- Exportar sin liquidacion real.
- Inventar datos previsionales.
- Forzar compatibilidad final sin archivo oficial validado.

### 17.4 Criterios de cierre

PREVIRED-01 queda cerrada base si:

- Existe contrato de datos.
- Se sabe que campos faltan.
- Se generan errores claros por trabajador.
- La salida depende de liquidaciones reales.

## 18. Fase LRE-01 - Libro de Remuneraciones Electronico

### 18.1 Objetivo

Preparar LRE desde conceptos mapeados y liquidaciones reales.

### 18.2 Alcance preliminar

- Definir campos LRE requeridos.
- Mapear conceptos a clasificacion LRE.
- Usar lineas de liquidacion.
- Validar conceptos sin codigo o clasificacion.

### 18.3 Fuera de alcance

- Exportar LRE sin liquidaciones.
- Exportar conceptos sin mapeo.
- Mezclar LRE con Previred.

### 18.4 Criterios de cierre

LRE-01 queda cerrada base si:

- Existe mapeo minimo.
- Se detectan brechas por concepto.
- Usa liquidaciones snapshot.
- No recalcula en la exportacion.

## 19. Fase REPORTES-01 - Reportes y auditoria

### 19.1 Objetivo

Definir reportes operativos y auditoria basica desde datos cerrados o trazables.

### 19.2 Alcance preliminar

- Reporte por periodo.
- Reporte por trabajador.
- Reporte de totales por concepto.
- Reporte de errores/bloqueos.
- Auditoria de calculo y snapshots.

### 19.3 Fuera de alcance

- BI avanzado.
- Dashboards esteticos.
- Exportaciones secundarias no prioritarias.

### 19.4 Criterios de cierre

REPORTES-01 queda cerrada base si:

- Usa datos reales.
- No recalcula lo que debe venir de snapshots.
- Tiene filtros minimos.
- Tiene validacion manual.

## 20. Fase UX-FINAL-01 - Pulido visual integral

### 20.1 Objetivo

Realizar pulido visual transversal cuando las fases funcionales principales esten estables.

### 20.2 Alcance preliminar

- Consistencia visual entre modulos.
- Espaciados.
- Empty states.
- Headers.
- Footers.
- Formularios.
- DataGrid.
- Acciones primarias/secundarias.

### 20.3 Fuera de alcance

- Cambiar reglas de negocio.
- Cambiar SQL.
- Cambiar calculos.
- Mezclar con motor/liquidaciones.

### 20.4 Criterios de cierre

UX-FINAL-01 queda cerrada si:

- Los cambios visuales estan registrados en `peticiones-estilos.md`.
- No cambian reglas funcionales.
- No rompen layout base.
- Hay validacion visual minima.

## 21. Mejoras pendientes por area

### 21.1 Orquestador

| Mejora | Prioridad | Fase sugerida |
|--------|-----------|---------------|
| Integrar ORDEN-01 en `estado-fases.md` | Alta | ORDEN-01 |
| Agregar nuevos documentos al `mapa-documentacion.md` | Alta | ORDEN-01 |
| Actualizar orden de lectura del README | Alta | ORDEN-01 |
| Completar placeholder de matriz roles | Alta | ORDEN-01 / SEG-01 |
| Evitar contradiccion Conceptos vs SEG-01 | Alta | ORDEN-01 |

### 21.2 Seguridad

| Mejora | Prioridad | Fase sugerida |
|--------|-----------|---------------|
| Definir roles logicos | Alta | SEG-01 |
| Definir acciones por modulo | Alta | SEG-01 |
| Separar permiso UI vs BD | Alta | SEG-01 |
| Documentar RLS esperado | Alta | SEG-01 |
| Implementar RLS real | Media/Alta | SEG-02 |

### 21.3 Conceptos

| Mejora | Prioridad | Fase sugerida |
|--------|-----------|---------------|
| Cerrar reglas de asignabilidad | Alta | CONC-02 |
| Separar automatico/sistema/manual | Alta | CONC-02 |
| Definir aportes empleador | Alta | CONC-02 |
| Revisar mapeo LRE minimo | Alta | CONC-02 |
| Endurecer permisos por rol | Alta | CONC-02 |
| Corregir mojibake documental si existe | Media | DOC-HIGIENE-01 |

### 21.4 Haberes recurrentes

| Mejora | Prioridad | Fase sugerida |
|--------|-----------|---------------|
| Revisar permisos por rol | Alta | SEG-01 / SEG-02 |
| Confirmar bloqueo por periodo cerrado | Media | CIERRE-01 |
| Mejorar auditoria de cambios | Media | REPORTES-01 / AUD-01 |

### 21.5 Movimientos variables

| Mejora | Prioridad | Fase sugerida |
|--------|-----------|---------------|
| Permisos por rol | Alta | SEG-01 / SEG-02 |
| Edicion controlada | Media | MV-02 |
| Importacion masiva | Baja por ahora | MV-03 |
| Bloqueo por periodo cerrado | Media | CIERRE-01 |
| Auditoria de anulacion | Media | AUD-01 |

### 21.6 Proceso mensual

| Mejora | Prioridad | Fase sugerida |
|--------|-----------|---------------|
| Conectar contrato del motor | Alta | MOTOR-00 |
| Agregar estado calculable/no calculable | Alta | MOTOR-00 / MOTOR-01 |
| Separar prevalidacion de calculo | Alta | MOTOR-00 |
| Evitar textos demo | Cerrado base | PARAM-CHILE-01 |
| Bloqueos por cierre | Media | CIERRE-01 |

### 21.7 Motor

| Mejora | Prioridad | Fase sugerida |
|--------|-----------|---------------|
| Crear contrato del motor | Alta | MOTOR-00 |
| Definir entrada/salida | Alta | MOTOR-00 |
| Definir snapshot | Alta | MOTOR-00 |
| Implementar v1 acotado | Alta | MOTOR-01 |
| Tests de reglas puras | Alta | MOTOR-01 |

### 21.8 Liquidaciones

| Mejora | Prioridad | Fase sugerida |
|--------|-----------|---------------|
| Eliminar dependencia de demo | Alta | LIQ-01 |
| Crear snapshot real | Alta | LIQ-01 |
| Estados de liquidacion | Alta | LIQ-01 |
| Vista detalle real | Media | LIQ-02 |
| PDF o salida formal | Media/Baja | LIQ-03 |

### 21.9 Previred

| Mejora | Prioridad | Fase sugerida |
|--------|-----------|---------------|
| Contrato de datos Previred | Media | PREVIRED-01 |
| Validacion previsional por trabajador | Media | PREVIRED-01 |
| Archivo exportable | Media | PREVIRED-02 |

### 21.10 LRE

| Mejora | Prioridad | Fase sugerida |
|--------|-----------|---------------|
| Mapeo conceptos LRE | Alta | CONC-02 / LRE-01 |
| Validacion conceptos sin clasificacion | Media | LRE-01 |
| Exportacion LRE | Media | LRE-02 |

### 21.11 Visual

| Mejora | Prioridad | Fase sugerida |
|--------|-----------|---------------|
| Pulido visual transversal | Baja por ahora | UX-FINAL-01 |
| Normalizar headers y footers | Baja por ahora | UX-FINAL-01 |
| Revisar DataGrid | Baja por ahora | UX-FINAL-01 |
| Revisar formularios | Baja por ahora | UX-FINAL-01 |

## 22. Documentos que el agente debe crear o actualizar

### 22.1 Actualizar ahora

| Documento | Accion |
|-----------|--------|
| `docs/codex/orquestador/estado-fases.md` | Integrar ORDEN-01 como cerrada y actualizar siguientes fases. |
| `docs/codex/orquestador/mapa-documentacion.md` | Agregar roadmap, dependencias, criterios, prioridades y matriz. |
| `docs/codex/orquestador/README.md` | Actualizar orden recomendado de lectura. |
| `docs/codex/orquestador/diseno-operativo-erp.md` | Alinear siguiente fase fuerte con SEG-01 antes de CONC-02. |
| `docs/codex/orquestador/matriz-roles-permisos.md` | Completar placeholder minimo de SEG-01 si esta vacio. |

### 22.2 Crear despues

| Documento | Fase | Rol |
|-----------|------|-----|
| `docs/codex/orquestador/matriz-roles-permisos.md` | SEG-01 | Matriz completa de roles y acciones. |
| `docs/codex/orquestador/contrato-motor-calculo.md` | MOTOR-00 | Contrato del motor. |
| `docs/codex/modulos/nomina-mensual/motor-00-contrato.md` | MOTOR-00 | Version por modulo si se decide ubicarlo en nomina mensual. |
| `docs/codex/modulos/nomina-mensual/motor-01-v1.md` | MOTOR-01 | Cierre de implementacion v1. |
| `docs/codex/modulos/nomina-mensual/liquidaciones-01-snapshot.md` | LIQ-01 | Contrato de liquidaciones snapshot. |
| `docs/codex/modulos/nomina-mensual/cierre-01.md` | CIERRE-01 | Contrato de cierre mensual. |
| `docs/codex/modulos/nomina-mensual/previred-01.md` | PREVIRED-01 | Base de exportacion Previred. |
| `docs/codex/modulos/nomina-mensual/lre-01.md` | LRE-01 | Base de LRE. |

## 23. Instrucciones para Cursor/Codex al usar este documento

### 23.1 Modo de trabajo

Cursor/Codex debe usar este documento para estructurar el roadmap, no para implementar codigo.

Antes de modificar, leer:

- `.cursor/skills/erp-codex-docs/SKILL.md`
- `.cursor/rules/erp-codex-contract.mdc`
- `docs/codex/AGENTS.md`
- `docs/codex/README.md`
- `docs/codex/orquestador/README.md`
- `docs/codex/orquestador/estado-fases.md`
- `docs/codex/orquestador/mapa-documentacion.md`
- Este documento

### 23.2 Accion esperada

Crear o actualizar un roadmap oficial bien estructurado, sin tocar codigo.

Debe actualizar como minimo:

- `docs/codex/orquestador/roadmap-operativo.md`
- `docs/codex/orquestador/dependencias-fases.md`
- `docs/codex/orquestador/criterios-cierre-fases.md`
- `docs/codex/orquestador/orden-prioridades.md`
- `docs/codex/orquestador/estado-fases.md`
- `docs/codex/orquestador/mapa-documentacion.md`
- `docs/codex/orquestador/README.md`

### 23.3 No tocar

- `src/`
- `bd/`
- `scripts/`
- `Python/`
- `.env`
- `public/app-config.json`
- Tests
- CSS
- Pantallas Angular

### 23.4 Resultado esperado

Al terminar, debe quedar:

- ORDEN-01 cerrada.
- SEG-01 como siguiente fase oficial.
- CONC-02 como fase fuerte de producto posterior a seguridad.
- MOTOR-00 definido como contrato previo a implementacion.
- Motor, liquidaciones, Previred y LRE bloqueados hasta sus dependencias.
- Mapa documental actualizado.
- README del orquestador con orden de lectura actualizado.

## 24. Checklist de cierre del roadmap

```txt
[ ] ORDEN-01 aparece en `estado-fases.md` como Cerrada.
[ ] `roadmap-operativo.md` contiene el orden oficial actualizado.
[ ] `dependencias-fases.md` contiene bloqueadores de motor, liquidaciones, Previred y LRE.
[ ] `criterios-cierre-fases.md` mantiene estados y reglas de cierre.
[ ] `orden-prioridades.md` separa prioridad alta, media y baja.
[ ] `mapa-documentacion.md` registra todos los documentos nuevos.
[ ] `README.md` del orquestador actualiza el orden de lectura.
[ ] `diseno-operativo-erp.md` no contradice SEG-01 antes de CONC-02.
[ ] `matriz-roles-permisos.md` no queda vacio.
[ ] No se toco codigo, SQL, Python, UI ni configuracion real.
```

## 25. Resumen ejecutivo

Estado recomendado ahora:

```txt
ORDEN-01 - Cerrada base
```

Estado esperado despues de integrar tablero, mapa, README, diseno operativo y matriz:

```txt
ORDEN-01 - Cerrada
```

Siguiente fase oficial:

```txt
SEG-01 - Roles, permisos, JWT/RLS base
```

Camino recomendado:

```txt
ORDEN-01
  |
  v
SEG-01
  |
  v
CONC-02
  |
  v
MOTOR-00
  |
  v
MOTOR-01
  |
  v
LIQ-01
  |
  v
CIERRE-01
  |
  v
PREVIRED-01 / LRE-01
  |
  v
REPORTES-01
  |
  v
UX-FINAL-01
```

<!-- ARQ-ERP-01-INTEGRACION -->

## Anexo de consolidacion 2026-05-07

Las referencias historicas a **Movimientos variables** se conservan como fases ejecutadas o documentos legacy. Para nuevas fases, usar esta lectura:

- Novedades mensuales = flujo funcional canonico.
- Movimientos variables = legado/transicion.
- Proceso mensual debe migrar a entradas canonicas.
- Motor no debe leer tablas legacy directamente.
- Liquidacion oficial queda pendiente de LIQ-00.

Siguiente bloque sugerido: UNIF-NOM-02 + UNIF-NOM-03 + SEG-NOV-02.
