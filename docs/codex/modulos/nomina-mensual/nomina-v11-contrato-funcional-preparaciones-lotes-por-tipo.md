# V11 — Contrato funcional para preparaciones/lotes de nómina por tipo

Fecha: 2026-05-30  
Tipo: contrato funcional futuro previo a backend, motor y UI.  
Estado: documento rector; no implementa SQL, repositorios, motor ni pantallas.

## 1. Propósito

Este documento define las reglas funcionales mínimas para implementar múltiples preparaciones/lotes de nómina por período sin inventar comportamiento en código.

Este contrato pertenece al alcance V11/backend. V10.2 queda como fase conceptual/UI: Alcance y Trabajadores comparten el universo de nómina mensual, sin SQL/RPC ni preparaciones persistidas reales.

El objetivo futuro es que un período pueda contener varias ejecuciones controladas:

```txt
Mayo 2026 — Nómina mensual completa
Mayo 2026 — Centro de costo Operaciones
Mayo 2026 — Selección manual
Mayo 2026 — Complementaria por bono
Mayo 2026 — Reproceso de trabajadores
Mayo 2026 — Retroactiva
Mayo 2026 — Finiquito
Mayo 2026 — Especial
```

La regla rectora se mantiene:

```txt
Las liquidaciones no nacen desde datos vivos.
Las liquidaciones se generan desde una preparación calculada y confirmada.
```

En el repo actual, la fuente técnica equivalente es `nomina_calculo_periodo` y liquidaciones oficiales se generan desde `id_calculo_periodo`. La implementación futura debe enlazar la preparación persistida con ese cálculo, no reemplazar silenciosamente el snapshot actual.

Lenguaje NOIA:

- en la UI principal se mantiene `Nómina mensual`, `Generar nómina`, `Confirmar nómina`, `Trabajadores incluidos` y `Liquidaciones`;
- `preparación` o `lote` puede usarse como contexto técnico-operativo, selector avanzado o documentación;
- `preparación` o `lote` no reemplaza el título principal del flujo RRHH.

## 2. Separación obligatoria de conceptos

### Preparación o lote persistido

Representa la intención y alcance de una ejecución de nómina dentro de un período.

Debe guardar:

- período de pago;
- tipo de preparación;
- método de alcance;
- estado de la preparación;
- trabajadores incluidos, excluidos y bloqueados;
- parámetros base usados o referencia al snapshot de parámetros;
- relación con preparación, cálculo o liquidación origen cuando aplique;
- usuario y fecha de creación, confirmación, anulación o cierre.

### Cálculo

Representa el resultado numérico generado para una preparación concreta.

Debe guardar:

- `id_preparacion_nomina`;
- `id_calculo_periodo` o equivalente técnico actual;
- trabajadores calculados;
- conceptos, observaciones, trazabilidad y totales;
- estado de cálculo.

No se debe calcular sobre un período completo sin conocer la preparación activa.

### Liquidación generada

Representa el documento interno materializado desde una preparación calculada y confirmada.

Debe guardar:

- `id_preparacion_nomina`;
- `id_calculo_periodo`;
- tipo de liquidación;
- versión;
- vínculo a liquidación origen o reemplazada cuando aplique;
- estado: borrador, generada, emitida, anulada, reemplazada.

### Cierre, anulación y reapertura

Estas acciones pertenecen a la preparación, no al período completo, salvo cuando se cierre explícitamente el período mensual.

Reglas:

- Una preparación calculada no modifica su alcance sin reapertura explícita.
- Una preparación confirmada no se sobrescribe; se corrige con reproceso, complementaria, retroactiva o anulación controlada.
- Una liquidación emitida no se reemplaza sin vínculo trazable.
- Cerrar una preparación no cierra necesariamente el período.
- Cerrar el período bloquea la creación, edición o cálculo de nuevas preparaciones ordinarias.
- Tras el cierre del período, solo se permiten flujos autorizados como retroactiva o reproceso con permiso especial y vínculo trazable.

## 3. Estados mínimos

Estados de preparación:

```txt
borrador
alcance_definido
empleados_validados
lista_para_calculo
calculada
con_bloqueos
confirmada
liquidaciones_generadas
cerrada
anulada
```

Avance permitido:

```txt
borrador
-> alcance_definido
-> empleados_validados
-> lista_para_calculo
-> calculada
-> confirmada
-> liquidaciones_generadas
-> cerrada
```

Estados terminales:

- `cerrada`;
- `anulada`.

Una preparación en `con_bloqueos` puede volver a `alcance_definido`, `empleados_validados` o `lista_para_calculo` según el bloqueo corregido, siempre antes de confirmarse.

## 4. Reglas de convivencia

Una misma persona no puede tener dos preparaciones activas incompatibles para el mismo período, tipo y origen sin regla de convivencia explícita.

Reglas:

- no permitir que un trabajador esté simultáneamente en dos `mensualCompleta` activas para el mismo período y empresa;
- si una `mensualCompleta` ya está confirmada, la corrección debe modelarse como `reproceso`, `complementaria` o `retroactiva`, no como otra mensual paralela;
- una preparación parcial puede convivir con mensual completa solo si su tipo declara si complementa, corrige, reemplaza o referencia la liquidación anterior;
- la convivencia debe resolverse antes del cálculo, no al emitir liquidaciones.

## 5. Tipos de preparación

Tipos funcionales definidos para planificación backend futura:

```txt
mensualCompleta
porCentroCosto
seleccionManual
complementaria
reproceso
retroactiva
finiquito
especial
```

Métodos de alcance:

```txt
todaEmpresa
centroCosto
grupo
seleccionManual
contrato
trabajadorUnico
```

Tipos de liquidación esperados:

```txt
mensual
complementaria
reproceso
retroactiva
finiquito
especial
```

## 6. Matriz de disponibilidad inicial

| Tipo | Estado inicial | Motivo |
|---|---|---|
| `mensualCompleta` | Operable | Usa motor mensual actual. |
| `porCentroCosto` | Condicionado | Requiere fuente confiable de centro de costo vigente por trabajador. |
| `seleccionManual` | Operable parcial | Usa motor mensual filtrado por trabajadores explícitos. |
| `complementaria` | Bloqueada hasta adaptador | Requiere reglas de conceptos complementarios. |
| `reproceso` | Bloqueada hasta adaptador | Requiere comparación contra cálculo/liquidación origen. |
| `retroactiva` | Bloqueada hasta adaptador | Requiere cálculo de diferencias entre período origen y período de pago. |
| `finiquito` | Bloqueada hasta adaptador | Requiere motor y validación legal especial. |
| `especial` | Solo borrador | No calcula sin adaptador declarado, motivo obligatorio y metadata revisable. |

La matriz evita que el sistema invente cálculo para tipos que aún no tienen adaptador. Un tipo bloqueado puede crearse como borrador documental si cumple datos mínimos, pero no puede pasar a cálculo ni liquidación.

## 7. Reglas por tipo

### 7.1 `mensualCompleta`

Objetivo:

```txt
Generar la nómina normal del período para todos los trabajadores elegibles.
```

Cuándo se puede crear:

- existe período de pago válido `YYYY-MM`;
- parámetros del período están operativos;
- no existe otra preparación `mensualCompleta` activa para el mismo período y empresa;
- el período no está cerrado.

Datos requeridos:

- período de pago;
- empresa, si aplica;
- parámetros base del período;
- trabajadores elegibles del período;
- movimientos del mes aprobados;
- asignaciones recurrentes vigentes.

Reglas de alcance:

- método recomendado: `todaEmpresa`;
- incluye trabajadores con contrato vigente o con días trabajados dentro del período;
- excluye trabajadores fuera del período, contratos no elegibles o trabajadores anulados;
- bloquea trabajadores con datos obligatorios incompletos.

Reglas de cálculo:

- usa el motor mensual actual como base;
- calcula haberes, descuentos, cotizaciones, impuestos y líquido del período;
- considera movimientos aprobados y recurrentes vigentes;
- no toma borradores ni movimientos pendientes de aprobación.

Relación con nómina previa:

- no requiere nómina previa;
- si ya existe mensual completa confirmada, una nueva ejecución debe ser reapertura controlada o reproceso, no reemplazo silencioso.

Liquidación esperada:

- tipo `mensual`;
- una liquidación normal por trabajador calculado;
- no reemplaza liquidaciones anteriores salvo reapertura/anulación explícita.

Bloqueos antes de cálculo:

- parámetros no operativos;
- trabajador sin contrato elegible;
- datos previsionales obligatorios faltantes;
- datos de remuneración base faltantes;
- movimientos bloqueantes del período.

### 7.2 `porCentroCosto`

Objetivo:

```txt
Generar nómina para un centro de costo, área o unidad operativa específica.
```

Cuándo se puede crear:

- existe período válido;
- parámetros operativos;
- existe fuente confiable de centro de costo vigente por trabajador;
- centro de costo seleccionado tiene al menos un trabajador elegible;
- no hay preparación activa equivalente para el mismo período, empresa y centro de costo.

Datos requeridos:

- período de pago;
- identificador y nombre de centro de costo;
- fuente de asignación vigente por trabajador;
- trabajadores elegibles del centro;
- movimientos y recurrentes aplicables a esos trabajadores.

Reglas de alcance:

- método: `centroCosto`;
- incluye solo trabajadores asignados al centro en el período;
- si un trabajador cambia de centro durante el período, la regla inicial es usar el centro vigente al cierre del período, salvo que exista distribución por días documentada;
- bloquea si el centro de costo del trabajador es ambiguo o inexistente.

Reglas de cálculo:

- usa las mismas fórmulas de la nómina mensual;
- filtra entradas y trabajadores al centro de costo;
- no prorratea por centro salvo que exista regla de distribución aprobada.

Relación con nómina previa:

- puede existir antes de una mensual completa solo si la organización opera por unidades separadas;
- si ya existe mensual completa confirmada para el período, esta preparación debe ser complementaria, reproceso o especial, no una mensual parcial paralela.

Liquidación esperada:

- tipo `mensual` si forma parte de la nómina mensual formal;
- tipo `especial` si se usa como ejecución extraordinaria controlada;
- debe registrar centro de costo en metadata.

Bloqueos antes de cálculo:

- centro de costo sin fuente vigente;
- trabajador con múltiples centros sin regla de resolución;
- preparación mensual completa cerrada sin autorización de proceso parcial.

### 7.3 `seleccionManual`

Objetivo:

```txt
Generar una nómina parcial para trabajadores elegidos explícitamente.
```

Cuándo se puede crear:

- existe período válido;
- parámetros operativos;
- el usuario selecciona al menos un trabajador;
- cada trabajador seleccionado tiene motivo o contexto administrativo.

Datos requeridos:

- período de pago;
- lista explícita de trabajadores incluidos;
- motivo de selección;
- movimientos/recurrentes aplicables;
- usuario responsable.

Reglas de alcance:

- método: `seleccionManual`;
- incluye solo trabajadores seleccionados;
- excluye todo trabajador no seleccionado, aunque sea elegible para el período;
- registra motivo por preparación y, si aplica, por trabajador.

Reglas de cálculo:

- usa fórmulas mensuales para los trabajadores seleccionados;
- no calcula trabajadores no incluidos;
- no infiere alcance desde filtros temporales.

Relación con nómina previa:

- puede ser preparación independiente previa a confirmación mensual;
- si corrige una nómina confirmada, debe clasificarse como `reproceso`, no como selección manual genérica.

Liquidación esperada:

- tipo `mensual` si es la nómina formal de ese grupo;
- tipo `especial` si responde a un caso administrativo no periódico.

Bloqueos antes de cálculo:

- lista vacía;
- trabajador inexistente o sin vínculo elegible;
- falta motivo obligatorio;
- trabajador ya incluido en preparación confirmada incompatible.

### 7.4 `complementaria`

Objetivo:

```txt
Pagar conceptos adicionales posteriores a una nómina mensual ya calculada o confirmada.
```

Cuándo se puede crear:

- existe período de pago válido;
- existe nómina mensual base calculada o confirmada, salvo complemento excepcional aprobado;
- se identifica el concepto o grupo de conceptos complementarios;
- hay trabajadores afectados.

Datos requeridos:

- período de pago;
- preparación o cálculo base referenciado;
- trabajadores afectados;
- conceptos complementarios;
- motivo;
- relación con liquidación mensual si existe.

Reglas de alcance:

- método recomendado: `seleccionManual` o `centroCosto`;
- incluye solo trabajadores con complemento;
- no incluye trabajadores sin monto complementario.

Reglas de cálculo:

- calcula solo los conceptos complementarios definidos;
- recalcula descuentos/impuestos asociados únicamente si el concepto los afecta;
- no recalcula sueldo base mensual completo salvo regla explícita del concepto;
- conserva referencia al cálculo base para auditoría.

Relación con nómina previa:

- complementa, no reemplaza;
- debe referenciar preparación/cálculo/liquidación base cuando exista;
- no puede anular la mensual base.

Liquidación esperada:

- tipo `complementaria`;
- documento complementario o anexo;
- no reemplaza la liquidación mensual;
- metadata debe indicar motivo y origen.

Bloqueos antes de cálculo:

- falta concepto complementario;
- trabajador sin monto complementario;
- no existe base cuando el complemento depende de una mensual previa;
- concepto sin reglas de imponibilidad/tributabilidad.

### 7.5 `reproceso`

Objetivo:

```txt
Corregir trabajadores específicos por error, ajuste o cambio posterior a una nómina calculada, confirmada o liquidada.
```

Cuándo se puede crear:

- existe preparación/cálculo/liquidación origen;
- se identifican trabajadores afectados;
- se define modo de reproceso: `corrige` o `reemplaza`;
- existe motivo obligatorio.

Datos requeridos:

- período de pago;
- id de preparación/cálculo origen;
- liquidación origen si ya fue emitida;
- trabajadores afectados;
- motivo;
- campos o conceptos que cambian;
- modo: corrección o reemplazo.

Reglas de alcance:

- método: `seleccionManual`;
- incluye solo trabajadores afectados;
- no permite incluir trabajadores sin vínculo con el origen salvo aprobación de caso especial.

Reglas de cálculo:

- calcula diferencia o nuevo resultado según modo:
  - `corrige`: genera monto de ajuste y referencia el resultado original;
  - `reemplaza`: genera nueva versión completa para el trabajador;
- debe comparar contra el cálculo origen;
- no altera el registro original sin vínculo de reemplazo.

Relación con nómina previa:

- siempre requiere origen;
- puede reemplazar liquidación anterior solo si se declara explícitamente;
- debe dejar origen y reemplazo consultables.

Liquidación esperada:

- tipo `reproceso`;
- si corrige, genera documento de ajuste;
- si reemplaza, genera nueva versión y marca la anterior como reemplazada cuando el flujo lo permita.

Bloqueos antes de cálculo:

- falta origen;
- falta modo de reproceso;
- trabajador no pertenece al cálculo/liquidación origen;
- liquidación origen cerrada sin permiso de reemplazo;
- motivo vacío.

### 7.6 `retroactiva`

Objetivo:

```txt
Pagar diferencias asociadas a uno o más períodos anteriores en un período de pago actual.
```

Cuándo se puede crear:

- existe período de pago actual;
- se informa período origen o rango de origen;
- se identifican trabajadores afectados;
- se informa causa retroactiva.

Datos requeridos:

- período de pago;
- período origen o rango de origen;
- trabajadores afectados;
- conceptos o diferencias a pagar/descontar;
- motivo;
- referencia documental si existe.

Reglas de alcance:

- método recomendado: `seleccionManual`;
- incluye solo trabajadores con diferencia retroactiva;
- no incluye trabajadores sin monto o causa retroactiva.

Reglas de cálculo:

- calcula diferencias entre valor origen y valor corregido;
- el devengo corresponde al período origen;
- el pago corresponde al período de pago;
- no modifica la liquidación original salvo que se combine con reproceso explícito.

Relación con nómina previa:

- referencia períodos anteriores;
- puede existir aunque el período origen esté cerrado;
- no reabre automáticamente el período origen.

Liquidación esperada:

- tipo `retroactiva`;
- debe mostrar período origen y período de pago;
- debe separar diferencias de la remuneración mensual normal.

Bloqueos antes de cálculo:

- falta período origen;
- período origen igual al período de pago sin motivo válido;
- trabajador sin diferencia calculable;
- concepto sin regla de diferencia;
- falta motivo.

### 7.7 `finiquito`

Objetivo:

```txt
Generar una preparación especial de término laboral para uno o más trabajadores.
```

Cuándo se puede crear:

- existe trabajador con término laboral informado o decisión administrativa registrada;
- existe fecha de término;
- se define causal o motivo administrativo;
- el período de pago es válido.

Datos requeridos:

- período de pago;
- trabajador;
- contrato o relación laboral;
- fecha de término;
- causal/motivo;
- haberes y descuentos pendientes;
- feriados, indemnizaciones u otros conceptos si el motor los soporta;
- usuario responsable.

Reglas de alcance:

- método: `trabajadorUnico` o `seleccionManual`;
- normalmente un trabajador por preparación;
- si se agrupan varios, cada trabajador mantiene cálculo y causal trazable.

Reglas de cálculo:

- no usa el cálculo mensual normal como única fuente;
- debe usar un adaptador de finiquito;
- calcula días trabajados del período, pendientes y conceptos de término según reglas implementadas;
- si el adaptador legal no cubre un concepto requerido, bloquea el cálculo en vez de inventar monto.

Relación con nómina previa:

- puede coexistir con nómina mensual;
- no debe mezclarse visualmente con liquidación mensual normal;
- si ya existe liquidación mensual del período, debe definir si el finiquito incluye o descuenta montos ya pagados.

Liquidación esperada:

- tipo `finiquito`;
- documento especial de término laboral;
- no se presenta como liquidación mensual común.

Bloqueos antes de cálculo:

- falta fecha de término;
- falta causal/motivo;
- falta contrato o vínculo laboral;
- existe finiquito activo para el mismo trabajador y contrato;
- concepto de término requerido sin regla de cálculo disponible.

### 7.8 `especial`

Objetivo:

```txt
Resolver un caso controlado que no cae en los tipos anteriores.
```

Cuándo se puede crear:

- existe motivo obligatorio;
- usuario con permiso administrativo;
- se declara alcance y comportamiento esperado;
- no hay tipo específico más adecuado.

Datos requeridos:

- período de pago;
- motivo;
- trabajadores incluidos;
- tipo de salida esperada;
- metadata revisable;
- aprobación administrativa previa si el sistema lo exige.

Reglas de alcance:

- método: `seleccionManual`, `centroCosto` o `grupo`;
- nunca alcance implícito sin explicación;
- debe registrar motivo visible para auditoría.

Reglas de cálculo:

- usa un adaptador declarado:
  - mensual filtrado;
  - complementario;
  - retroactivo;
  - manual controlado;
- si no existe adaptador, la preparación puede quedar en borrador, pero no se calcula.

Relación con nómina previa:

- debe declarar si es independiente, complementaria o correctiva;
- si afecta una liquidación previa, debe registrar origen.

Liquidación esperada:

- tipo `especial`;
- metadata debe explicar motivo y alcance;
- no reemplaza liquidaciones salvo decisión explícita.

Bloqueos antes de cálculo:

- motivo vacío;
- alcance vacío;
- adaptador no declarado;
- intenta reemplazar liquidación sin origen;
- falta aprobación administrativa si aplica.

## 8. Eventos de trazabilidad

Eventos mínimos:

```txt
PREPARACION_CREADA
ALCANCE_DEFINIDO
TRABAJADORES_VALIDADOS
CALCULO_EJECUTADO
CALCULO_BLOQUEADO
PREPARACION_CONFIRMADA
LIQUIDACIONES_GENERADAS
PREPARACION_CERRADA
PREPARACION_REABIERTA
PREPARACION_ANULADA
LIQUIDACION_REEMPLAZADA
```

Cada evento debe registrar:

- `id_preparacion_nomina`;
- tipo de preparación;
- período;
- usuario;
- fecha;
- estado anterior y nuevo cuando aplique;
- metadata mínima del cambio.

La trazabilidad no debe llenar la pantalla principal. Debe estar disponible en historial, drawer o modal de soporte.

## 9. Contrato de datos futuro derivable

El schema futuro puede derivarse de estas entidades:

```txt
nomina_preparacion
nomina_preparacion_trabajador
nomina_preparacion_evento
nomina_preparacion_relacion
nomina_calculo_periodo.id_preparacion_nomina
nomina_liquidacion_periodo.id_preparacion_nomina
```

Campos mínimos de `nomina_preparacion`:

```txt
id_preparacion_nomina
periodo_pago
periodo_origen
id_empresa
tipo_preparacion
metodo_alcance
estado
id_preparacion_origen
id_calculo_origen
id_liquidacion_origen
modo_reproceso
motivo
metadata
activo
created_at
created_by
updated_at
```

Campos mínimos de `nomina_preparacion_trabajador`:

```txt
id_preparacion_trabajador
id_preparacion_nomina
id_persona
id_contrato
estado
motivo
metadata
```

Restricciones esperadas:

- una sola `mensualCompleta` activa por período y empresa;
- una preparación no puede calcularse sin trabajadores incluidos;
- `reproceso` requiere origen;
- `retroactiva` requiere período origen;
- `finiquito` requiere trabajador, contrato y fecha de término;
- `especial` requiere motivo.

## 10. Integración esperada con el repo actual

La implementación futura debe respetar estas piezas existentes:

- `nomina_calculo_periodo`: snapshot/cálculo actual.
- `guardar_nomina_calculo_snapshot`: guardado atómico de cálculo.
- `nomina_liquidacion_periodo`: materialización de liquidaciones.
- `generar_liquidaciones_oficiales`: generación desde cálculo aprobado.

Cambios esperados en una fase posterior:

- agregar `id_preparacion_nomina` a cálculo y liquidaciones;
- hacer que guardar cálculo reciba preparación activa;
- hacer que liquidaciones se generen desde cálculo asociado a preparación;
- exponer repositorio y servicio de preparaciones;
- adaptar UI para crear, seleccionar y consultar preparaciones del período.

No se debe modificar la liquidación oficial existente para recalcular desde datos vivos.

## 11. Criterios de aceptación del contrato

Este documento queda aprobado para planificar backend si:

- cada tipo tiene entrada, alcance, cálculo, bloqueos y salida definida;
- complementaria, reproceso y retroactiva no sobrescriben liquidaciones sin vínculo explícito;
- finiquito queda separado de la liquidación mensual normal;
- `especial` no permite cálculo sin motivo y adaptador declarado;
- el schema futuro se puede derivar sin inventar entidades nuevas;
- la regla `liquidaciones desde preparación calculada y confirmada` queda explícita;
- el documento no exige aplicar SQL ni motor antes de una fase técnica separada.

## 12. Fuentes contrastadas

- [`nomina-v10-2-alcance-trabajadores-preparacion-conceptual.md`](./nomina-v10-2-alcance-trabajadores-preparacion-conceptual.md)
- [`nomina-mensual-confirmacion-flow.md`](./nomina-mensual-confirmacion-flow.md)
- `bd/base/v11/partes/15_nomina_calculo_snapshot.sql`
- `bd/base/v11/partes/20_nomina_calculo_snapshot_rpc.sql`
- `bd/base/v11/partes/22_liquidaciones_oficiales.sql`
- `bd/base/v11/partes/23_liquidaciones_oficiales_rpc.sql`
