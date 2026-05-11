# NOM-01 - Novedades mensuales

> Nombre visible en UI: `Movimientos del mes`.
> Nombre tecnico/documental: `Novedades mensuales`.
> Tabla canonica: `novedad_remuneracion_periodo`.
> USAB-NOM-02: la UI visible no debe pedir `idPersona`, `idContrato` ni `idConcepto` manualmente; RRHH selecciona trabajador, concepto y contrato por lenguaje operativo, manteniendo esos IDs solo en el payload interno.

## 1. Objetivo

Las novedades mensuales registran hechos del periodo que afectan la remuneracion. En la UI se presentan como `Movimientos del mes`. No son recurrentes por defecto y no calculan la liquidacion.

Este documento define que datos manejan, que estados funcionales tienen, como se relacionan con conceptos de remuneracion, como entran al proceso mensual y que queda fuera de alcance. No implementa codigo, SQL, tablas, UI, motor, liquidacion, Previred ni LRE.

## 2. Definicion funcional

Una novedad mensual es un hecho, importe, cantidad o ajuste asociado a un trabajador y a un periodo especifico.

Ejemplos:

- horas extra;
- comisiones;
- bono puntual;
- ausencia;
- atraso;
- licencia medica;
- permiso sin goce;
- anticipo puntual;
- descuento unico;
- retroactivo;
- reintegro.

Principio rector:

Si se repite o queda pactado, vive en Haberes y descuentos recurrentes.  
Si ocurre solo en un periodo, vive en Novedades mensuales.  
Si define el comportamiento, vive en Conceptos.  
Si calcula, vive en el Motor.

## 3. Que NO es una novedad mensual

No confundir con:

- Concepto de remuneracion.
- Haber/descuento recurrente.
- Parametro.
- Resultado de liquidacion.
- Salida legal.

Ejemplos:

- "Bono responsabilidad mensual pactado" no es novedad, es recurrente.
- "Horas extra de mayo" si es novedad.
- "Colacion fija mensual" no es novedad, es recurrente.
- "Bono especial de mayo" si es novedad.
- "AFP" no es novedad, es descuento legal calculado.
- "Liquido a pago" no es novedad, es resultado.

## 4. Relacion con conceptos de remuneracion

Toda novedad debe referenciar un concepto existente cuando corresponda.

El concepto define:

- si es haber o descuento;
- si es imponible;
- si es tributable;
- si afecta liquido;
- si requiere cantidad;
- si requiere monto;
- si se calcula automaticamente;
- si requiere codigo LRE.

La novedad registra:

- trabajador;
- periodo;
- cantidad;
- monto;
- origen;
- observacion;
- estado.

La novedad no redefine el comportamiento del concepto. Solo aporta el dato del periodo que el proceso mensual y el motor deben considerar.

## 5. Categorias de novedades

| Categoria | Ejemplos | Tipo |
|---|---|---|
| Haberes variables | comision, bono puntual, produccion | haber |
| Tiempo trabajado adicional | horas extra, recargo | haber |
| Ausencias y descuentos de tiempo | inasistencia, atraso, permiso sin goce | descuento/ajuste |
| Licencias y permisos | licencia medica, permiso legal | informativo/ajuste |
| Anticipos y descuentos unicos | anticipo, descuento puntual | descuento |
| Retroactivos y reintegros | retroactivo sueldo, reintegro descuento | haber/descuento |
| Ajustes manuales controlados | ajuste autorizado | haber/descuento |

Estas categorias son funcionales. No crean tablas ni obligan una implementacion tecnica en esta fase.

## 6. Campos logicos sugeridos

Campos logicos definidos en NOM-01. NOM-01B materializa una base SQL inicial sin agregar UI, motor ni liquidacion:

- id_novedad;
- periodo;
- id_persona;
- id_contrato si aplica;
- id_concepto;
- categoria;
- tipo_movimiento;
- cantidad;
- unidad;
- monto;
- moneda;
- origen;
- fecha_evento;
- estado;
- observacion;
- creado_por;
- aprobado_por;
- fecha_aprobacion;
- referencia_externa si aplica.

## 7. Estados sugeridos

Estados funcionales:

- borrador;
- pendiente_revision;
- aprobada;
- rechazada;
- incorporada_a_pre_nomina;
- calculada;
- anulada.

Reglas:

- Solo novedades aprobadas deben entrar al proceso mensual.
- Una novedad calculada no debe editarse libremente.
- Si se modifica despues del calculo, debe generar reapertura, anulacion o nueva version segun fase futura.

Los estados anteriores son contrato funcional futuro. La implementacion actual puede tener nombres tecnicos previos en el dominio de movimientos variables; este documento no cambia codigo ni datos.

## 8. Origen de la novedad

Origenes posibles:

- manual;
- asistencia;
- importacion;
- integracion externa;
- ajuste administrativo;
- regularizacion;
- sistema.

Regla: el origen ayuda a auditar, no cambia por si solo el calculo.

## 9. Validaciones basicas

Validaciones esperadas:

- periodo valido;
- trabajador activo o con contrato aplicable al periodo;
- concepto vigente;
- cantidad requerida cuando el concepto la necesite;
- monto requerido cuando el concepto sea manual;
- no duplicar novedades incompatibles;
- no permitir novedades en periodo cerrado;
- no permitir editar novedad ya calculada sin flujo de reapertura.

Estas validaciones pertenecen al contrato funcional de Novedades mensuales y a fases posteriores de implementacion. NOM-01 no implementa esas reglas.

## 10. Relacion con proceso mensual

El proceso mensual debe consumir novedades aprobadas del periodo.

Desde UNIF-NOM-03, `ProcesoMensualService` no lee `MovimientosVariablesService` directamente para prevalidar hechos del periodo. Lee `EntradasMensualesPeriodoService`, que normaliza:

- asignaciones recurrentes;
- novedades mensuales canonicas;
- movimientos variables legacy durante la transicion.

Las novedades mensuales aprobadas son visibles para pre-nomina mediante esa capa canonica. Los estados fuente no se modifican desde proceso mensual.

Flujo:

1. Usuario ingresa o importa novedades.
2. RRHH revisa.
3. Se aprueban.
4. Proceso mensual las toma.
5. Prevalidaciones detectan errores o pendientes.
6. Motor las calcula.
7. Liquidacion congela el resultado.

El proceso mensual valida y prepara. No calcula la liquidacion final.

## 11. Relacion con motor

El motor no debe buscar novedades libremente.

Debe recibir una entrada preparada por proceso mensual.

La novedad no calcula por si sola la liquidacion. Solo informa cantidad, monto o hecho.

## 12. Relacion con liquidacion

Cuando la liquidacion se genera, la novedad queda reflejada en el detalle calculado.

La liquidacion debe guardar snapshot del resultado.

La novedad original no debe cambiar silenciosamente el resultado ya congelado.

## 13. Reglas de no mezcla

- Novedad mensual no es concepto.
- Novedad mensual no es asignacion recurrente.
- Novedad mensual no es parametro.
- Novedad mensual no es liquidacion.
- Novedad mensual no calcula por si sola.
- Novedad mensual no se repite automaticamente.
- Novedad mensual debe pertenecer a un periodo.

## 14. Casos de ejemplo

### Horas extra

Periodo: 2026-05  
Trabajador: Juan Perez  
Concepto: Horas extra 50%  
Cantidad: 5  
Unidad: horas  
Estado: aprobada

### Bono puntual

Periodo: 2026-05  
Trabajador: Maria Soto  
Concepto: Bono puntual  
Monto: 80000  
Estado: aprobada

### Ausencia

Periodo: 2026-05  
Trabajador: Pedro Rojas  
Concepto: Ausencia injustificada  
Cantidad: 1  
Unidad: dia  
Estado: aprobada

### Anticipo puntual

Periodo: 2026-05  
Trabajador: Ana Lopez  
Concepto: Anticipo  
Monto: 50000  
Estado: aprobada

## 15. Fuera de alcance de NOM-01

No implementar:

- tablas;
- UI;
- formularios;
- importadores;
- motor;
- calculo;
- liquidacion;
- Previred/LRE;
- cierre.

## 16. Pendientes para fases futuras

- NOM-01B: modelo SQL de novedades mensuales.
- NOM-01C: capa Angular base de modelos, repository, service y reglas.
- NOM-01D: UI base de ingreso, listado y revision simple.
- NOM-01E: importacion masiva.
- NOM-02: prevalidaciones del proceso mensual.
- NOM-04: integracion de novedades al proceso mensual.
- NOM-05: contrato de entrada al motor.

## 17. NOM-01B - Modelo SQL de novedades mensuales

NOM-01B crea la tabla base `novedad_remuneracion_periodo` en `bd/base/v11/partes/18_novedades_mensuales.sql`.

Responsabilidad:

- registrar hechos del periodo asociados a trabajador, concepto y periodo;
- distinguir categoria, tipo de movimiento, cantidad, monto, origen y estado;
- servir como base futura para ingreso, revision, aprobacion e integracion al proceso mensual.

No es responsabilidad de esta tabla:

- definir conceptos;
- crear asignaciones recurrentes;
- calcular remuneraciones;
- guardar resultados calculados de liquidacion;
- cerrar periodos;
- generar Previred o LRE.

Campos principales:

- `id_novedad_remuneracion_periodo`;
- `periodo`;
- `id_persona`;
- `id_contrato`;
- `id_concepto`;
- `categoria`;
- `tipo_movimiento`;
- `cantidad`;
- `unidad`;
- `monto`;
- `moneda`;
- `origen`;
- `fecha_evento`;
- `estado`;
- `observacion`;
- `referencia_externa`;
- `creado_por`;
- `aprobado_por`;
- `fecha_aprobacion`;
- `fecha_creacion`;
- `fecha_actualizacion`.

Estados SQL permitidos:

- `borrador`;
- `pendiente_revision`;
- `aprobada`;
- `rechazada`;
- `incorporada_a_pre_nomina`;
- `calculada`;
- `anulada`.

Categorias SQL permitidas:

- `haber_variable`;
- `tiempo_trabajado_adicional`;
- `ausencia_descuento_tiempo`;
- `licencia_permiso`;
- `anticipo_descuento_unico`;
- `retroactivo_reintegro`;
- `ajuste_manual_controlado`.

Origenes SQL permitidos:

- `manual`;
- `asistencia`;
- `importacion`;
- `integracion_externa`;
- `ajuste_administrativo`;
- `regularizacion`;
- `sistema`.

Restricciones minimas:

- periodo con formato `YYYY-MM` y FK a `periodo_remuneracion(codigo)`;
- FK a `persona(id_persona)`;
- FK opcional a `contrato(id_contrato)`;
- FK a `concepto(id_concepto)`;
- `monto >= 0` cuando exista monto;
- `cantidad > 0` cuando exista cantidad;
- `moneda` con codigo ISO de tres letras;
- aprobacion requerida para estados `aprobada`, `incorporada_a_pre_nomina` y `calculada`.

Indices creados:

- `idx_novedad_remuneracion_periodo_periodo`;
- `idx_novedad_remuneracion_periodo_persona`;
- `idx_novedad_remuneracion_periodo_contrato`;
- `idx_novedad_remuneracion_periodo_concepto`;
- `idx_novedad_remuneracion_periodo_estado`;
- `idx_novedad_remuneracion_periodo_periodo_persona`;
- `idx_novedad_remuneracion_periodo_periodo_estado`.

Fuera de alcance de NOM-01B:

- UI de ingreso o revision;
- servicios Angular;
- importadores;
- integracion al proceso mensual;
- motor;
- liquidacion;
- cierre;
- Previred/LRE;
- RLS productivo.

Relacion con fases futuras:

- NOM-01C debe definir la capa Angular base.
- NOM-01D debe definir UI de ingreso y revision.
- NOM-01E debe definir importacion masiva.
- NOM-02 debe validar novedades dentro del proceso mensual.
- NOM-04 debe integrar solo novedades aprobadas al proceso mensual.
- NOM-05 debe definir como llegan al contrato de entrada del motor.

## 18. NOM-01C - Capa Angular base

NOM-01C crea la capa Angular base para trabajar con `novedad_remuneracion_periodo`, sin implementar pantalla completa ni integracion con motor.

Archivos de aplicacion:

- `src/app/features/nomina-mensual/novedades/models/novedad-mensual.model.ts`;
- `src/app/features/nomina-mensual/novedades/data-access/novedades-mensuales.mapper.ts`;
- `src/app/features/nomina-mensual/novedades/data-access/novedades-mensuales.repository.ts`;
- `src/app/features/nomina-mensual/novedades/services/novedades-mensuales.service.ts`;
- `src/app/features/nomina-mensual/novedades/rules/novedades-mensuales.rules.ts`.

Responsabilidad de la capa:

- modelar `NovedadMensual` en TypeScript;
- mapear filas Supabase `snake_case` a dominio `camelCase`;
- listar novedades por periodo y por trabajador;
- obtener una novedad por id;
- crear borradores;
- actualizar campos editables antes de estado `calculada`;
- cambiar estados mediante transiciones simples;
- validar datos minimos con reglas puras.

Estados y transiciones implementadas:

| Desde | Hacia |
|---|---|
| `borrador` | `pendiente_revision`, `anulada` |
| `pendiente_revision` | `aprobada`, `rechazada`, `anulada` |
| `aprobada` | `incorporada_a_pre_nomina`, `anulada` |
| `rechazada` | `borrador` |
| `incorporada_a_pre_nomina` | `calculada` |
| `calculada` | sin transiciones en esta fase |
| `anulada` | sin transiciones en esta fase |

Reglas implementadas:

- periodo `YYYY-MM`;
- trabajador requerido;
- concepto requerido;
- categoria valida;
- origen valido;
- estado valido;
- tipo de movimiento valido;
- cantidad mayor que cero cuando se informa;
- monto mayor o igual a cero cuando se informa;
- moneda normalizada a `CLP` por defecto;
- novedad `calculada` no editable libremente;
- aprobacion bloqueada para novedades anuladas o sin datos requeridos por categoria.

Fuera de alcance de NOM-01C:

- pantalla final;
- formulario visual;
- modal;
- importacion masiva;
- integracion real con proceso mensual;
- motor;
- liquidacion;
- Previred/LRE;
- permisos complejos;
- auditoria avanzada.

Relacion con fases futuras:

- NOM-01D debe construir UI de ingreso y revision sobre esta capa.
- NOM-02 debe consumir reglas para prevalidaciones del proceso mensual.
- NOM-04 debe integrar solo novedades aprobadas al proceso mensual.
- NOM-05 debe definir el contrato de entrada al motor.

## 19. NOM-01D - UI base de novedades mensuales

NOM-01D crea la primera pantalla funcional para administrar novedades mensuales del periodo sobre la capa Angular de NOM-01C.

Pantalla/seccion creada:

- ruta funcional: `/remuneraciones/novedades-mensuales`;
- wrapper: `src/app/pages/novedades-mensuales.page.ts`;
- contenedor: `src/app/features/nomina-mensual/novedades/containers/novedades-mensuales-container/`.

Acciones disponibles:

- listar novedades por periodo;
- crear novedad como borrador;
- editar novedades editables;
- enviar borrador a revision;
- aprobar novedades pendientes;
- rechazar novedades pendientes con observacion;
- anular novedades permitidas por reglas;
- eliminar solo borradores cuando el service lo permite.

Estados visibles:

| Estado tecnico | Etiqueta UI |
|---|---|
| `borrador` | Borrador |
| `pendiente_revision` | Pendiente revision |
| `aprobada` | Aprobada |
| `rechazada` | Rechazada |
| `incorporada_a_pre_nomina` | En pre-nomina |
| `calculada` | Calculada |
| `anulada` | Anulada |

Validaciones usadas:

- periodo `YYYY-MM`;
- trabajador requerido;
- concepto requerido;
- categoria, origen, estado y tipo de movimiento controlados;
- cantidad mayor que cero cuando se informa;
- monto mayor o igual a cero cuando se informa;
- transiciones de estado permitidas por NOM-01C;
- novedad `calculada` sin edicion libre en la UI.

Responsabilidad de esta UI:

- administrar hechos del periodo;
- guardar en `novedad_remuneracion_periodo` mediante `NovedadesMensualesService`;
- mostrar diferencias de estado con badges claros;
- dejar trazabilidad basica de observacion para rechazos o anulaciones.

Fuera de alcance de NOM-01D:

- pantalla final avanzada;
- importacion masiva;
- permisos y roles reales de aprobacion;
- integracion real con proceso mensual;
- calculo de liquidaciones;
- cierre mensual;
- Previred/LRE;
- auditoria avanzada;
- reemplazo de haberes/descuentos recurrentes.

Relacion con fases futuras:

- NOM-01E debe cubrir importacion masiva.
- UNIF-NOM-03 ya consume novedades aprobadas dentro de prevalidaciones mediante entradas canonicas.
- Una fase posterior debe integrar esas entradas al contrato de entrada del motor.
- NOM-05 debe definir como viajan al contrato de entrada del motor.

## 20. UNIF-NOM-02 - Entradas mensuales canonicas

UNIF-NOM-02 agrega `EntradasMensualesPeriodoService` como capa de lectura y normalizacion. Su objetivo es preparar una vista unificada de:

- novedades mensuales canonicas (`novedad_remuneracion_periodo`);
- asignaciones recurrentes (`haberdescuento_persona`);
- movimientos variables legacy (`movimiento_variable_mensual`) mientras dure la transicion.

Para Novedades mensuales, la capa solo lee mediante `NovedadesMensualesService` y normaliza estados a `EntradaMensualPeriodo`. No aprueba, rechaza, edita ni cambia registros fuente.

UNIF-NOM-03 conecta esta capa al Proceso mensual para prevalidacion y pre-nomina, sin escribir estados fuente ni cambiar motor/liquidacion.

<!-- ARQ-ERP-01-INTEGRACION -->

## Integracion canonica 2026-05-07

Novedades mensuales queda como dominio funcional oficial para hechos del periodo.

Tabla canonica futura:

```txt
novedad_remuneracion_periodo
```

Termino legacy relacionado:

```txt
Movimientos variables / movimiento_variable_mensual
```

Reglas adicionales:

- No duplicar carga entre Novedades mensuales y Movimientos variables.
- No considerar que una novedad entra a Proceso mensual hasta que exista adaptacion canonica.
- No usar `novedad_remuneracion_periodo` productivamente sin confirmar RLS/permisos.
- No calcular liquidaciones desde la UI de novedades.

## 21. SEG-NOV-02 - RLS y permisos de novedades mensuales

SEG-NOV-02 agrega `bd/base/v11/partes/19_novedades_mensuales_rls.sql` para proteger la tabla canonica `novedad_remuneracion_periodo`.

Resultado:

- RLS queda habilitado con `ALTER TABLE ... ENABLE ROW LEVEL SECURITY`.
- `authenticated` recibe `SELECT`, `INSERT` y `UPDATE`.
- `anon` no recibe permisos nuevos y se revocan permisos directos sobre esta tabla en el script.
- `DELETE` directo no queda habilitado; el contrato funcional sigue prefiriendo anulacion logica mediante estado `anulada`.
- Las policies usan `auth.role() = 'authenticated'`.
- No se modifica estructura de la tabla, datos, motor, liquidaciones, cierre, Previred/LRE ni Python.

Validacion aplicada: el script se ejecuto con `psql` usando `SUPABASE_DB_URL` del `.env`. La verificacion posterior confirmo `rls_enabled=true`, tres policies para `authenticated`, `anon_select=false` y `authenticated_delete=false`.

Limitacion vigente: no existe todavia un modelo de roles finos/JWT por area de remuneraciones; se replica el patron minimo ya usado para snapshots de nomina.

## 22. NOM-UX-01 - Consolidacion visual de Novedades mensuales

NOM-UX-01 deja Novedades mensuales como flujo visible principal para RRHH.

Resultado:

- El sidebar muestra Novedades mensuales como opcion principal para cargar hechos del periodo.
- Movimientos variables deja de aparecer como opcion productiva equivalente en el menu principal.
- La ruta legacy `/remuneraciones/movimientos-variables` se conserva para transicion y compatibilidad.
- El copy visible aclara que las novedades aprobadas forman parte de las entradas mensuales que revisa Proceso mensual antes del calculo.
- No se borra codigo legacy, no se migran datos, no se modifica SQL/RLS y no se cambia motor, liquidaciones, Previred/LRE ni Python.

Regla de producto:

- RRHH debe cargar nuevos hechos del periodo en Novedades mensuales.
- Movimientos variables queda como legacy/transicion, no como camino principal para nuevas mejoras funcionales.

## 23. MOTOR-04 - Contrato de entradas mensuales para el motor

MOTOR-04 prepara la llegada de novedades mensuales aprobadas al contrato del motor.

Resultado:

- `MotorCalculoInput` recibe `entradasMensuales`.
- Las entradas se construyen desde `EntradaMensualPeriodo`, no desde la UI ni desde tablas sueltas.
- Solo llegan entradas aptas para pre-nomina: aprobadas y sin bloqueo critico.
- Borrador, pendiente_revision, observada, rechazada, anulada y legacy bloqueado quedan fuera del arreglo calculable.
- Legacy validado puede entrar solo como transicion si ya fue normalizado como aprobado.

Decision de fase:

- Se aplica Opcion A: contrato preparatorio.
- El motor conserva las entradas en el input, pero no cambia formulas ni resultados legales todavia.
- No se marca ninguna novedad como calculada.
- No se escribe en `novedad_remuneracion_periodo` ni en `movimiento_variable_mensual`.
- No se generan liquidaciones oficiales, no se cierra periodo y no se toca Previred/LRE.

Pendiente: una fase posterior debe definir como las entradas aprobadas afectan haberes, descuentos, bases, liquido y trazabilidad calculada segun el gobierno de Conceptos.
