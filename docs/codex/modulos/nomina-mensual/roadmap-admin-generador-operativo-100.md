# Roadmap operativo 100 % — Administrador y Generador de nóminas

> ID rector: `NOM-ADMIN-GENERADOR-OPERATIVO-100`
>
> Estado: **Documentado — listo para ejecución por fases**
>
> Fecha base: **2026-06-11**
>
> Tipo: producto + dominio + datos + seguridad + cálculo + UX + calidad
>
> Alcance de este documento: **solo planificación documental**. No aplica por sí
> mismo migraciones, cambios Angular, RPC, RLS ni modificaciones al motor.

## 1. Propósito

Convertir el Administrador de nóminas y su Generador de seis pasos en el único
flujo operativo de remuneraciones, capaz de crear, preparar, calcular, validar,
aprobar, liquidar internamente, cerrar y rectificar:

- nóminas mensuales;
- anticipos semanales;
- anticipos quincenales;
- nóminas extraordinarias;
- rectificaciones diferenciales.

El resultado debe ser trazable por nómina, no solamente por mes. Dos nóminas
del mismo período deben poder coexistir sin compartir accidentalmente cálculo,
estado, incidencias o liquidaciones.

## 2. Jerarquía documental

Para ejecutar cualquier fase se debe leer, en este orden:

1. [`../../AGENTS.md`](../../AGENTS.md).
2. [`../../contexto-rapido.md`](../../contexto-rapido.md).
3. [`../../diseno/noia-ui-manual.md`](../../diseno/noia-ui-manual.md), cuando
   la fase incluya UI.
4. [`arquitectura-administrador-generador.md`](./arquitectura-administrador-generador.md).
5. Este roadmap.
6. La auditoría
   [`auditorias/auditoria-admin-generador-nomina-2026-06.md`](./auditorias/auditoria-admin-generador-nomina-2026-06.md).
7. Los archivos reales de código, migraciones y pruebas afectados por la fase.

Si un documento histórico contradice el código actual o este roadmap, se debe
registrar la diferencia y resolverla en la fase documental correspondiente. No
se debe recuperar una ruta o flujo retirado solo porque figure en documentación
anterior.

## 3. Estado real de partida

### 3.1 Flujo visible

- Ruta canónica del Administrador:
  `/remuneraciones/nominas`.
- Ruta canónica del Generador:
  `/remuneraciones/nominas/:nominaPeriodoId/generador`.
- El Generador mantiene seis pasos:
  `Parámetros / Dotación / Movimientos / Cálculo / Validación / Cierre`.
- La UI histórica de Nómina mensual fue retirada. La ruta antigua redirige al
  Administrador.
- El chip de mes del menú del Administrador fue retirado.

### 3.2 Persistencia y dominio

- `nomina_periodo` representa la cabecera operativa.
- Dotación, segmentos, movimientos, incidencias y auditoría ya tienen
  persistencia productiva.
- La creación actual carga automáticamente trabajadores aptos y genera una
  dotación general.
- La máquina de estados y la vigencia del cálculo ya cuentan con controles
  iniciales.
- La eliminación está protegida mediante RPC para estados permitidos.

### 3.3 Brechas críticas

- El cálculo todavía se conecta al motor compartido mediante `periodo` y una
  lista de trabajadores.
- Los snapshots de cálculo y las liquidaciones se consultan principalmente por
  `YYYY-MM`, no por `nominaPeriodoId`.
- La semántica semanal, quincenal y extraordinaria no está cerrada en el
  dominio productivo.
- No existe consolidación formal de anticipos o pagos extraordinarios en la
  mensual.
- No existe una rectificación diferencial inmutable vinculada a un cierre.
- Las advertencias no tienen aceptación justificada completa.
- No existen permisos específicos de nómina exigidos por servidor.
- Parte de la metadata del stepper aún proviene de un archivo `*.mock.ts`.
- La prueba E2E actual no cubre creación y ciclo completo.
- Persisten enlaces, nombres y documentación asociados al flujo retirado.

## 4. Decisiones de producto cerradas

Estas decisiones no deben volver a abrirse durante una fase técnica salvo que
aparezca una incompatibilidad legal o contable demostrable.

| Tema | Decisión |
|---|---|
| Tipos operativos | Mensual, semanal, quincenal y extraordinaria. |
| Semanal/quincenal | Son anticipos, no liquidaciones legales independientes. |
| Regla de anticipo | Porcentaje o monto fijo configurado en plantilla, con ajustes e importación. |
| Mensual | Es la liquidación legal oficial del período. |
| Extraordinaria | Tiene pago interno propio y consolida sus efectos en la mensual. |
| Dotación inicial | Preview automático de contratos que intersectan el rango. |
| Calendario | Plantillas por empresa, editables al crear la nómina. |
| Advertencias | Se resuelven o se aceptan con justificación, usuario y fecha. |
| Bloqueantes | Deben corregirse y requieren recálculo cuando afectan el resultado. |
| Permisos | Son acumulables; un usuario puede ejecutar varias etapas si posee cada permiso. |
| Cierre | Incluye liquidaciones internas; no incluye salidas externas. |
| Corrección posterior | Se crea una rectificación diferencial vinculada. |
| Inmutabilidad | La nómina cerrada y sus liquidaciones publicadas no se editan. |
| Empresa | La empresa activa de la sesión es la fuente única inicial. |

## 5. Alcance funcional objetivo

```text
Administrador
  -> Previsualizar nueva nómina
  -> Confirmar creación y dotación
  -> Abrir Generador

Generador
  1. Parámetros
  2. Dotación
  3. Movimientos
  4. Cálculo
  5. Validación y aprobación
  6. Liquidaciones internas y cierre

Después del cierre
  -> Consultar liquidaciones y auditoría
  -> Crear rectificación diferencial cuando corresponda
```

El usuario debe poder cerrar el navegador y reanudar desde otro equipo sin
perder estado, decisiones, filtros relevantes, cálculo vigente ni evidencia de
aprobación.

## 6. Fuera de alcance

Este roadmap no incluye:

- transferencias bancarias;
- Previred;
- Libro de Remuneraciones Electrónico;
- centralización contable;
- firma electrónica;
- envío por correo o portal del trabajador;
- generación de PDF como requisito del cierre;
- cambios normativos no relacionados con la identidad y ciclo de la nómina;
- selector multiempresa en la misma sesión.

Estas salidas podrán consumir una nómina cerrada en fases posteriores, pero no
deben bloquear el objetivo interno de este roadmap.

## 7. Arquitectura objetivo

### 7.1 Identidad

`nominaPeriodoId` será la identidad canónica para:

- cabecera;
- dotación;
- segmentos;
- movimientos;
- incidencias;
- cálculo y sus versiones;
- validación y aprobación;
- liquidaciones internas;
- cierre;
- consolidaciones;
- rectificaciones;
- auditoría.

`periodo` seguirá existiendo como dimensión de búsqueda y normativa, pero no
será suficiente para identificar un resultado productivo.

### 7.2 Rangos

Toda nómina operativa tendrá:

- `fechaInicio`;
- `fechaFin`;
- `fechaPago`;
- `periodoLegal`, cuando corresponda;
- `zonaHoraria = America/Santiago`.

Los rangos son inclusivos. La intersección contractual se evalúa con:

```text
inicioContrato <= fechaFinNomina
AND
(finContrato IS NULL OR finContrato >= fechaInicioNomina)
```

La mensual debe cubrir el período legal completo. Los anticipos y
extraordinarias pueden cubrir subrangos o fechas específicas dentro de ese
período.

### 7.3 Naturaleza de la nómina

Se separará la frecuencia visible de la naturaleza contable:

| Campo | Valores iniciales |
|---|---|
| `tipo` | `mensual`, `quincenal`, `semanal`, `extraordinaria` |
| `naturaleza` | `liquidacion_legal`, `anticipo`, `pago_extraordinario`, `rectificacion` |

La rectificación no se presentará como una frecuencia adicional. Será una
naturaleza vinculada a una nómina cerrada.

### 7.4 Versionado

- Cada cálculo tendrá número de versión creciente dentro de una nómina.
- Solo una versión podrá estar vigente.
- Cambios en parámetros, dotación, movimientos o consolidaciones invalidarán
  la versión vigente.
- Una liquidación interna deberá indicar la versión exacta de cálculo usada.
- El cierre congelará la versión de cálculo y la versión de liquidaciones.

### 7.5 Consolidación

La relación entre nóminas se almacenará explícitamente:

- anticipo -> mensual consolidadora;
- extraordinaria -> mensual consolidadora;
- rectificación -> nómina cerrada rectificada.

No se inferirá una relación productiva únicamente porque las nóminas tengan el
mismo mes.

## 8. Estados y transiciones objetivo

### 8.1 Estados principales

```text
borrador
-> dotacion_generada
-> en_revision
-> calculada
-> validada
-> aprobada
-> liquidada
-> cerrada

Estados terminales o excepcionales:
anulada
```

`reabierta` se retirará como mecanismo de corrección posterior al cierre. Una
nómina no cerrada puede volver a revisión mediante invalidación controlada. Una
nómina cerrada se corrige mediante rectificación.

### 8.2 Invariantes

- `calculada` exige cálculo vigente.
- `validada` exige cero bloqueantes pendientes.
- `aprobada` exige advertencias resueltas o aceptadas.
- `liquidada` exige liquidaciones internas asociadas a la versión vigente.
- `cerrada` exige cálculo y liquidaciones congelados.
- `cerrada` y `anulada` son inmutables.
- Una rectificación exige una nómina origen cerrada.
- La mensual no puede aprobarse con consolidaciones pendientes o descuadradas.

## 9. Permisos objetivo

| Permiso | Capacidades |
|---|---|
| `nomina.operar` | Crear, editar parámetros operativos, dotación y movimientos; calcular. |
| `nomina.validar` | Resolver o aceptar incidencias y registrar validación. |
| `nomina.aprobar` | Aprobar una versión validada. |
| `nomina.liquidar` | Generar o regenerar liquidaciones antes del cierre. |
| `nomina.cerrar` | Congelar liquidaciones y cerrar. |
| `nomina.rectificar` | Crear y procesar una rectificación. |
| `nomina.anular` | Anular una nómina dentro de los estados permitidos. |

Los permisos son acumulables. La UI puede ocultar o deshabilitar acciones, pero
la autorización definitiva se ejecutará en RPC/RLS. Cada comando crítico debe
registrar `auth.uid()`, fecha, versión esperada y motivo cuando corresponda.

## 10. Contratos públicos propuestos

Los nombres finales deberán confirmarse contra las convenciones del código en
la fase correspondiente. El comportamiento sí es obligatorio.

### 10.1 Preview de creación

```ts
interface NominaCreatePreviewRequest {
  tipo: TipoNomina;
  plantillaCicloId?: string;
  fechaInicio: string;
  fechaFin: string;
  fechaPago: string;
  reglaAnticipo?: ReglaAnticipoInput;
}

interface NominaCreatePreview {
  incluidos: TrabajadorPreviewNomina[];
  excluidos: TrabajadorExcluidoPreview[];
  conflictos: ConflictoCreacionNomina[];
  totales: {
    incluidos: number;
    excluidos: number;
    bloqueantes: number;
    advertencias: number;
  };
  puedeCrear: boolean;
  fingerprint: string;
}
```

El `fingerprint` impedirá confirmar un preview obsoleto si cambió la dotación o
el calendario entre previsualización y creación.

### 10.2 Contexto de cálculo

```ts
interface NominaCalculoContext {
  nominaPeriodoId: string;
  versionEsperada: number;
  tipo: TipoNomina;
  naturaleza: NaturalezaNomina;
  fechaInicio: string;
  fechaFin: string;
  fechaPago: string;
  parametrosSnapshotId: string;
  trabajadores: TrabajadorCalculoNomina[];
  movimientos: MovimientoCalculoNomina[];
  consolidaciones: ConsolidacionCalculoNomina[];
}
```

### 10.3 Decisión de incidencia

```ts
type EstadoDecisionIncidencia =
  | 'pendiente'
  | 'resuelta'
  | 'aceptada_justificada';

interface IncidenciaDecision {
  incidenciaId: string;
  estado: EstadoDecisionIncidencia;
  justificacion?: string;
  versionCalculo?: number;
}
```

### 10.4 Selección masiva

Las acciones masivas aceptarán una de dos formas excluyentes:

- IDs explícitos;
- criterio filtrado inmutable con exclusiones.

El preview y la ejecución deberán usar la misma huella del filtro para evitar
que una acción afecte un universo distinto al mostrado.

## 11. Reglas generales de ejecución

1. Ejecutar una fase funcional por commit.
2. No mezclar migración, UI y limpieza no relacionada en el mismo commit.
3. Toda migración debe ser aditiva antes de retirar compatibilidad.
4. Toda RPC crítica debe ser transaccional e idempotente.
5. No editar manualmente datos productivos para completar una prueba.
6. No avanzar si la fase introduce tests rojos.
7. Registrar deuda preexistente separada de cualquier regresión nueva.
8. Actualizar este roadmap y `estado-fases` al cerrar cada fase.
9. No retirar compatibilidad hasta tener equivalencia demostrada.
10. Mantener copy RRHH; IDs, enums y nombres de tabla no deben llegar a UI.

## 12. Secuencia y dependencias

```text
F00
 -> F01
 -> F02
 -> F03
 -> F04
 -> F05
 -> F06
 -> F07
 -> F08
 -> F09
 -> F10
 -> F11
 -> F12
 -> F13
 -> F14
 -> F15
 -> F16
 -> F17
 -> F18
 -> F19
 -> F20
 -> F21
 -> F22
```

F03 puede desarrollarse en paralelo con F04-F05 después de estabilizar F02,
pero debe estar cerrado antes de habilitar aprobación, liquidación o cierre.

F08 y F09 pueden avanzar en paralelo después de F07, siempre que ambos respeten
el contrato de invalidación definido en F01-F02.

## 13. Fases detalladas

---

### F00 — Línea base verificable

**ID:** `NOM-ADMIN-OPS-F00`

**Objetivo**

Obtener una fotografía reproducible del flujo antes de cambiar contratos
productivos.

**Dependencias**

- Ninguna.

**Alcance**

- Inventariar rutas canónicas y redirects.
- Registrar migraciones locales y remotas aplicadas.
- Identificar tablas, vistas, triggers, RPC y políticas RLS de nómina.
- Mapear servicios que todavía consultan por `periodo`.
- Listar imports runtime desde `*.mock.ts`.
- Registrar suites unitarias, integración y E2E existentes.
- Medir estado de build y errores preexistentes.
- Identificar datos históricos que podrían ser ambiguos al vincular por nómina.

**Entregables**

- Auditoría técnica fechada.
- Matriz `acción -> servicio -> RPC/tabla -> prueba`.
- Listado de deuda preexistente.
- Dataset de prueba controlado y no productivo.

**Pruebas**

- `tsc` de aplicación y specs.
- Suite específica de Administrador/Generador.
- Build de desarrollo y productivo.
- E2E no destructivo actual.
- Consulta de migraciones aplicadas.

**Criterio de cierre**

La misma línea base puede repetirse y distingue claramente fallos previos de
regresiones futuras.

**Fuera de fase**

- Cambios de dominio.
- Reparaciones funcionales.
- Nuevas migraciones.

**Commit esperado**

`docs(nomina): registrar linea base operativa admin generador`

---

### F01 — Contrato canónico de nómina

**ID:** `NOM-ADMIN-OPS-F01`

**Objetivo**

Definir en modelos y reglas puras la identidad, rangos, naturaleza,
consolidación, versionado e invariantes de cada nómina.

**Dependencias**

- F00 cerrada.

**Alcance**

- Extender el modelo de `NominaPeriodo`.
- Separar `tipo` y `naturaleza`.
- Definir rango inclusivo y período legal.
- Definir vínculo de consolidación y rectificación.
- Formalizar estados `liquidada` y cierre inmutable.
- Definir motivos de invalidación de cálculo.
- Definir reglas de duplicidad y solapamiento.
- Reemplazar supuestos implícitos de una nómina por mes en reglas puras.

**Reglas mínimas**

- Una mensual ordinaria activa por empresa y período legal.
- Múltiples anticipos dentro del período, identificados por ciclo.
- Múltiples extraordinarias, cada una con identidad propia.
- Una rectificación puede tener otras rectificaciones posteriores, pero cada
  una debe apuntar a la versión cerrada que corrige.
- No se permite cambiar rango, tipo o naturaleza después del primer cálculo
  sin invalidación explícita.

**Pruebas**

- Matriz completa de transiciones.
- Rangos válidos e inválidos.
- Solapamientos por tipo.
- Creación de rectificación.
- Inmutabilidad de cerradas.
- Invalidación por cada mutación relevante.

**Criterio de cierre**

El dominio puede decidir sin consultar UI si una operación es válida y qué
evidencia invalida.

**Fuera de fase**

- Persistencia SQL.
- Cálculo real.
- Cambios visuales.

**Commit esperado**

`feat(nomina): definir contrato canonico por nomina`

---

### F02 — Persistencia aditiva y backfill

**ID:** `NOM-ADMIN-OPS-F02`

**Objetivo**

Persistir el contrato canónico sin perder ni reinterpretar silenciosamente
datos existentes.

**Dependencias**

- F01 cerrada.

**Alcance**

- Agregar rango, naturaleza, ciclo y versión donde corresponda.
- Crear relaciones explícitas entre nóminas.
- Agregar `nominaPeriodoId` a cálculos y liquidaciones.
- Crear índices únicos parciales y checks.
- Incorporar control optimista en comandos críticos.
- Backfill automático solo cuando empresa + período + evidencia produzcan una
  asociación única.
- Marcar registros ambiguos como históricos pendientes de asociación.
- Mantener lecturas compatibles durante la transición.

**Migración**

Se ejecutará en tres pasos:

1. columnas y tablas nuevas, inicialmente compatibles;
2. backfill y reporte de ambigüedades;
3. constraints estrictos para registros nuevos.

No se eliminarán columnas legacy en esta fase.

**Verificaciones**

- Conteos antes y después.
- Registros huérfanos.
- Duplicados por índice objetivo.
- Planes de consulta de Admin, cálculo y liquidaciones.
- RLS de empresa en cada objeto nuevo.

**Reversión**

- Revertir lectura de aplicación a contratos anteriores.
- Mantener columnas nuevas sin utilizarlas.
- No ejecutar rollback destructivo sobre datos ya vinculados.

**Criterio de cierre**

Toda nómina nueva puede persistir su identidad completa y los datos históricos
siguen disponibles sin asociaciones inventadas.

**Commit esperado**

`feat(db): agregar identidad canonica y vinculos de nomina`

---

### F03 — Permisos y auditoría de servidor

**ID:** `NOM-ADMIN-OPS-F03`

**Objetivo**

Proteger cada operación crítica con permisos específicos y evidencia
auditable.

**Dependencias**

- F02 cerrada.

**Alcance**

- Persistir asignación de permisos por usuario y empresa o integrar el
  mecanismo de roles vigente si ya existe uno equivalente.
- Resolver permisos efectivos mediante función SQL estable.
- Proteger RPC de validación, aprobación, liquidación, cierre, rectificación y
  anulación.
- Registrar actor, fecha, estado previo, estado nuevo, versión esperada,
  versión resultante y motivo.
- Exponer permisos efectivos al frontend.
- Definir mensajes humanos para autorización insuficiente.

**Reglas**

- Los permisos son acumulables.
- Tener acceso a la empresa no implica permiso de cierre.
- La autorización se evalúa en servidor en cada comando.
- La auditoría no acepta un `usuarioId` enviado por el cliente como fuente de
  verdad; usa `auth.uid()`.

**Pruebas**

- Matriz permiso/acción.
- Usuario sin rol.
- Usuario de otra empresa.
- Permisos acumulados.
- Intento de alterar actor desde cliente.
- Auditoría ante éxito, conflicto optimista y rechazo.

**Criterio de cierre**

Ninguna acción crítica puede ejecutarse mediante llamada directa a Supabase sin
el permiso requerido.

**Commit esperado**

`feat(nomina): aplicar permisos y auditoria de servidor`

---

### F04 — Plantillas de ciclos por empresa

**ID:** `NOM-ADMIN-OPS-F04`

**Objetivo**

Configurar calendarios repetibles para reducir errores al crear nóminas.

**Dependencias**

- F02 cerrada.

**Alcance**

- Crear plantillas mensual, semanal y quincenal.
- Configurar regla de fecha de pago.
- Configurar porcentaje o monto fijo por defecto para anticipos.
- Permitir activar, pausar y versionar plantillas.
- Previsualizar cortes futuros sin crear nóminas.
- Mantener edición de fechas en la creación.

**Reglas**

- La plantilla propone; la nómina creada congela sus fechas.
- Cambiar una plantilla no modifica nóminas existentes.
- Una plantilla de anticipo debe declarar porcentaje o monto fijo.
- Porcentaje y monto fijo son excluyentes a nivel de regla base.
- Los ajustes por trabajador se aplican después del valor propuesto.

**Pruebas**

- Meses de 28, 29, 30 y 31 días.
- Cambio de año.
- Fecha de pago en fin de semana según política configurada.
- Plantilla inactiva.
- Versionado sin mutar nóminas ya creadas.

**Criterio de cierre**

El sistema puede proponer ciclos válidos para todo un año y cada propuesta
explica sus fechas y regla de anticipo.

**Commit esperado**

`feat(nomina): incorporar plantillas de ciclos`

---

### F05 — Preview automático de creación

**ID:** `NOM-ADMIN-OPS-F05`

**Objetivo**

Mostrar exactamente qué se creará antes de persistir una nómina.

**Dependencias**

- F01, F02 y F04 cerradas.

**Alcance**

- Implementar preview en servidor.
- Resolver trabajadores por intersección contractual.
- Separar incluidos y excluidos.
- Informar motivos de exclusión.
- Detectar conflictos de calendario y duplicidad.
- Calcular propuesta de anticipo cuando corresponda.
- Emitir `fingerprint` del universo evaluado.

**Motivos mínimos de exclusión**

- contrato fuera del rango;
- trabajador inactivo;
- ficha no apta para remuneraciones;
- empresa distinta;
- datos previsionales críticos incompletos;
- exclusión administrativa explícita.

**UX**

- Resumen total.
- Tabs o filtros `Incluidos / Excluidos / Conflictos`.
- Explicación humana por fila.
- Confirmación deshabilitada ante bloqueantes.
- Sin selector de empresa alternativo a la empresa activa.

**Pruebas**

- Contrato inicia o termina en los límites.
- Contratos consecutivos.
- Trabajador con más de un contrato relevante.
- Cambio de datos entre preview y confirmación.
- Nómina duplicada.
- 1.000+ trabajadores con paginación.

**Criterio de cierre**

El usuario conoce el universo y los conflictos antes de crear; confirmar un
preview obsoleto es rechazado.

**Commit esperado**

`feat(nomina): agregar preview de creacion y dotacion`

---

### F06 — Creación transaccional

**ID:** `NOM-ADMIN-OPS-F06`

**Objetivo**

Crear cabecera, dotación inicial, segmento general y auditoría como una sola
operación idempotente.

**Dependencias**

- F03 y F05 cerradas.

**Alcance**

- RPC de creación basada en preview vigente.
- Clave de idempotencia por intento.
- Congelado de fechas, regla de anticipo y empresa.
- Inserción paginada o set-based de dotación.
- Registro de incluidos, excluidos y motivos.
- Evento de auditoría `creada`.
- Respuesta con siguiente acción y ruta canónica.

**Fallos controlados**

- fingerprint vencido;
- duplicidad por carrera;
- pérdida de permiso;
- trabajador modificado;
- error de inserción parcial;
- reintento de una petición ya confirmada.

**Pruebas**

- Doble clic.
- Dos usuarios creando el mismo ciclo.
- Timeout seguido de reintento.
- Rollback completo ante error.
- Empresa activa distinta a la solicitada.

**Criterio de cierre**

No existe cabecera sin dotación inicial ni dotación sin cabecera por un fallo
parcial de creación.

**Commit esperado**

`feat(nomina): crear nomina y dotacion en transaccion`

---

### F07 — Parámetros por rango y snapshot

**ID:** `NOM-ADMIN-OPS-F07`

**Objetivo**

Resolver los parámetros aplicables a la nómina por su rango y congelar la
evidencia usada por el cálculo.

**Dependencias**

- F02 y F06 cerradas.

**Alcance**

- Consultar parámetros normativos por vigencia.
- Consultar configuración de empresa aplicable.
- Detectar rangos que cruzan una vigencia normativa.
- Crear snapshot de parámetros por nómina y versión.
- Registrar faltantes críticos y advertencias.
- Rehidratar el paso sin depender del mes global de UI.

**Reglas**

- La mensual usa el período legal correspondiente.
- Un anticipo puede usar una regla simplificada, pero conserva referencias para
  su consolidación posterior.
- Si el rango cruza una vigencia incompatible, se bloquea o se segmenta según
  la capacidad real del motor; no se elige silenciosamente una tasa.
- Recalcular parámetros invalida cálculo posterior.

**Pruebas**

- Vigencia inicia a mitad de mes.
- Parámetro oficial ausente.
- Configuración cliente pendiente.
- Rehidratación.
- Cambio de parámetros después de calcular.

**Criterio de cierre**

Cada cálculo puede demostrar exactamente qué parámetros normativos y de empresa
utilizó.

**Commit esperado**

`feat(nomina): resolver parametros por rango y snapshot`

---

### F08 — Dotación escalable

**ID:** `NOM-ADMIN-OPS-F08`

**Objetivo**

Operar nóminas grandes por excepción, sin descargar todo el universo al
cliente.

**Dependencias**

- F06 cerrada.

**Alcance**

- Paginación, búsqueda, orden y filtros en servidor.
- Selección por IDs o por universo filtrado.
- Preview masivo inmutable.
- Segmentación por trabajador, centro de costo, cargo, tipo de contrato y
  grupo.
- Inclusión, exclusión, cambio de segmento y marcado de revisión.
- Detalle bajo demanda.
- Conteos agregados sin cargar filas.

**Reglas**

- La selección visual de una página no implica seleccionar todas.
- Seleccionar el universo filtrado debe mostrarse explícitamente.
- Toda mutación de dotación invalida cálculo.
- Un trabajador no puede quedar activo en dos segmentos excluyentes.
- La exclusión exige motivo.

**Pruebas**

- 1.000, 10.000 y volumen objetivo acordado.
- Cambio de página con selección.
- Filtro cambia después del preview.
- Acción parcial fallida.
- Duplicidad de segmento.
- Permisos y empresa.

**Criterio de cierre**

Las acciones masivas afectan exactamente el universo confirmado y la UI no
depende de cargar todos los trabajadores.

**Commit esperado**

`feat(nomina): escalar dotacion y acciones masivas`

---

### F09 — Catálogo y movimientos consistentes

**ID:** `NOM-ADMIN-OPS-F09`

**Objetivo**

Eliminar tipos libres de movimiento y asegurar que todo concepto tenga reglas
de cálculo, vigencia y consolidación conocidas.

**Dependencias**

- F07 cerrada.
- Catálogo de conceptos operativo.

**Alcance**

- Reemplazar `MovimientoTipo = string` en entradas productivas.
- Seleccionar concepto desde catálogo autorizado.
- Validar categoría, unidad, imponibilidad, tributación y vigencia.
- Completar criterios de recurrentes.
- Soportar manual, recurrente, importado y sistema.
- Definir importación con preview, errores por fila e idempotencia.
- Mantener omisiones explícitas.

**Reglas**

- Un concepto inactivo no se agrega a una nómina nueva.
- Un movimiento ya aplicado conserva el snapshot del concepto utilizado.
- La importación nunca crea conceptos nuevos.
- Reaplicar recurrentes no duplica.
- Modificar, omitir o eliminar un movimiento invalida cálculo.

**Pruebas**

- Concepto vencido.
- Concepto de otra empresa.
- Monto y cantidad incompatibles.
- Importación duplicada.
- Recurrente omitido.
- Todos los criterios de segmentación.

**Criterio de cierre**

No se puede introducir al cálculo un tipo arbitrario o un concepto sin reglas
vigentes.

**Commit esperado**

`feat(nomina): integrar catalogo productivo de movimientos`

---

### F10 — Contrato del motor por nómina

**ID:** `NOM-ADMIN-OPS-F10`

**Objetivo**

Desacoplar la ejecución del cálculo de la clave `YYYY-MM`.

**Dependencias**

- F07, F08 y F09 cerradas.

**Alcance**

- Construir `NominaCalculoContext`.
- Resolver todo input mediante `nominaPeriodoId`.
- Mantener adaptador temporal hacia reglas compartidas existentes.
- Separar preparación de input, ejecución y persistencia.
- Normalizar errores del motor.
- Registrar huella de entrada para detectar cambios.

**Compatibilidad**

El motor matemático existente puede reutilizarse, pero no decidirá qué nómina,
dotación o movimientos cargar. Esa responsabilidad será del orquestador por
nómina.

**Pruebas**

- Dos nóminas del mismo mes con dotaciones distintas.
- Misma dotación con movimientos distintos.
- Entrada determinista.
- Error de parámetros.
- Error individual por trabajador.
- Comparación contra fixture conocido del motor actual.

**Criterio de cierre**

El cálculo de una nómina no lee ni sobrescribe datos de otra nómina del mismo
mes.

**Commit esperado**

`refactor(nomina): ejecutar motor con contexto por nomina`

---

### F11 — Snapshot y rehidratación por nómina

**ID:** `NOM-ADMIN-OPS-F11`

**Objetivo**

Persistir resultados versionados, recuperables y vinculados a la nómina.

**Dependencias**

- F02 y F10 cerradas.

**Alcance**

- Crear versión de cálculo por intento exitoso.
- Persistir cabecera, detalle por trabajador y conceptos.
- Marcar una única versión vigente.
- Rehidratar resumen y detalle al recargar.
- Mostrar diferencias respecto de la versión anterior.
- Registrar quién calculó y con qué huella.
- Invalidar sin borrar versiones históricas.

**Reglas**

- Un cálculo fallido no desplaza la versión vigente anterior.
- Invalidar no elimina evidencia.
- La UI no obliga a recalcular si existe una versión vigente compatible.
- El cierre referencia una versión concreta.

**Pruebas**

- Recarga del navegador.
- Dos cálculos consecutivos.
- Fallo durante persistencia.
- Invalidación por cada origen.
- Consulta histórica.
- Control optimista.

**Criterio de cierre**

Una nómina calculada puede reabrirse en UI y mostrar el mismo resultado sin
ejecutar nuevamente el motor.

**Commit esperado**

`feat(nomina): versionar y rehidratar calculos por nomina`

---

### F12 — Anticipos semanales y quincenales

**ID:** `NOM-ADMIN-OPS-F12`

**Objetivo**

Procesar anticipos internos con reglas configurables y evidencia del pago a
descontar en la mensual.

**Dependencias**

- F04, F09, F10 y F11 cerradas.

**Alcance**

- Proponer monto por porcentaje o monto fijo.
- Permitir ajuste individual.
- Importar montos con preview.
- Excluir trabajadores con justificación.
- Calcular total de anticipo y líquido interno.
- Generar movimiento de consolidación pendiente hacia la mensual.
- Identificar anticipo pagado, anulado o pendiente.

**Reglas**

- El anticipo no duplica haberes imponibles mensuales.
- El monto pagado se descuenta del líquido mensual.
- Un anticipo anulado no se consolida.
- No se puede consolidar dos veces el mismo pago.
- Ajustes sobre la regla propuesta quedan auditados.

**Pruebas**

- Porcentaje.
- Monto fijo.
- Ajuste por trabajador.
- Importación.
- Trabajador excluido.
- Anticipo pagado y no pagado.
- Idempotencia de consolidación.

**Criterio de cierre**

El anticipo produce una salida interna trazable y un único descuento futuro
identificable en la mensual.

**Commit esperado**

`feat(nomina): operar anticipos semanales y quincenales`

---

### F13 — Nómina extraordinaria

**ID:** `NOM-ADMIN-OPS-F13`

**Objetivo**

Procesar pagos extraordinarios con salida interna propia y efectos mensuales
explícitos.

**Dependencias**

- F09, F10 y F11 cerradas.

**Alcance**

- Clasificar conceptos extraordinarios.
- Calcular pago interno.
- Registrar bases imponibles y tributables que deben consolidarse.
- Registrar descuentos y montos previamente pagados.
- Vincular una mensual consolidadora.
- Bloquear conceptos sin política de consolidación.

**Reglas**

- Cada concepto declara si afecta bases mensuales.
- El pago extraordinario ya realizado se descuenta del líquido mensual cuando
  corresponda.
- No se incorporan dos veces bases o pagos.
- La extraordinaria cerrada permanece inmutable.

**Pruebas**

- Bono imponible.
- Haber no imponible.
- Descuento extraordinario.
- Pago previo.
- Concepto sin política.
- Varias extraordinarias en el mismo mes.

**Criterio de cierre**

Para cada extraordinaria es posible explicar qué se pagó y qué efecto exacto
queda pendiente para la mensual.

**Commit esperado**

`feat(nomina): operar pagos extraordinarios consolidables`

---

### F14 — Consolidación mensual

**ID:** `NOM-ADMIN-OPS-F14`

**Objetivo**

Incorporar anticipos y extraordinarias en la liquidación legal mensual sin
duplicar bases ni pagos.

**Dependencias**

- F12 y F13 cerradas.

**Alcance**

- Descubrir relaciones pendientes del período legal.
- Vincular o desvincular antes de aprobar.
- Incorporar bases extraordinarias.
- Descontar anticipos y pagos previos.
- Mostrar conciliación por nómina origen y trabajador.
- Persistir estado de consolidación.
- Bloquear aprobación ante diferencias.

**Cuadraturas mínimas**

- origen cerrado o en estado permitido;
- trabajador presente o tratamiento explícito de ausencia;
- monto origen = monto consolidado;
- cada origen consolidado una sola vez;
- diferencia global igual a cero;
- conceptos con política compatible.

**Pruebas**

- Dos anticipos y una extraordinaria.
- Trabajador termina contrato antes de la mensual.
- Trabajador fuera de dotación mensual.
- Origen anulado.
- Consolidación parcial.
- Reintento y concurrencia.

**Criterio de cierre**

La mensual explica por trabajador los pagos previos y no puede aprobarse con
una conciliación incompleta.

**Commit esperado**

`feat(nomina): consolidar anticipos y extraordinarias`

---

### F15 — Incidencias y validación

**ID:** `NOM-ADMIN-OPS-F15`

**Objetivo**

Transformar la validación en un registro de decisiones persistidas y no en una
lista informativa.

**Dependencias**

- F03, F11 y F14 cerradas.

**Alcance**

- Persistir estado de decisión.
- Resolver bloqueantes.
- Aceptar advertencias con justificación.
- Registrar usuario, fecha y versión de cálculo.
- Agrupar por origen, severidad, trabajador y concepto.
- Navegar a la corrección con foco contextual.
- Reabrir incidencias cuando una mutación invalide su decisión.

**Reglas**

- Un bloqueante no puede aceptarse.
- Una advertencia aceptada exige justificación no vacía.
- Una decisión asociada a una versión inválida no habilita aprobación.
- Corregir una incidencia puede invalidar cálculo.
- Incidencias informativas no bloquean.

**Pruebas**

- Resolver bloqueante.
- Intentar aceptar bloqueante.
- Aceptar warning sin motivo.
- Invalidación posterior.
- Navegación a Dotación o Movimientos.
- Permisos.

**Criterio de cierre**

Toda incidencia que habilita la aprobación tiene una decisión válida,
versionada y atribuible.

**Commit esperado**

`feat(nomina): persistir validacion e incidencias`

---

### F16 — Aprobación versionada

**ID:** `NOM-ADMIN-OPS-F16`

**Objetivo**

Registrar una aprobación explícita sobre una versión exacta del cálculo.

**Dependencias**

- F03 y F15 cerradas.

**Alcance**

- Separar comando de validar y aprobar.
- Mostrar resumen de alcance y montos.
- Confirmar mediante `app-message-box`.
- Registrar versión aprobada.
- Exigir permiso `nomina.aprobar`.
- Invalidar aprobación ante cambios.

**Reglas**

- Validar no aprueba.
- Aprobar no recalcula.
- La aprobación incluye totales y huella de cálculo.
- Un usuario puede operar y aprobar si posee ambos permisos.
- La UI debe mostrar claramente la identidad del aprobador.

**Pruebas**

- Aprobar cálculo vigente.
- Cálculo invalidado entre confirmación y RPC.
- Permiso insuficiente.
- Doble aprobación.
- Mutación posterior.

**Criterio de cierre**

Existe una evidencia inequívoca de quién aprobó qué versión y con qué totales.

**Commit esperado**

`feat(nomina): separar y versionar aprobacion`

---

### F17 — Liquidaciones internas por nómina

**ID:** `NOM-ADMIN-OPS-F17`

**Objetivo**

Generar, consultar y versionar liquidaciones internas desde una nómina
aprobada.

**Dependencias**

- F02, F11 y F16 cerradas.

**Alcance**

- Consultar por `nominaPeriodoId`.
- Generar desde la versión aprobada.
- Persistir liquidación por trabajador.
- Mostrar resumen, errores y trabajadores sin liquidación.
- Permitir regenerar antes del cierre cuando cambie la versión aprobada.
- Registrar versión y actor.

**Reglas**

- No generar desde período ambiguo.
- No generar desde cálculo no aprobado.
- Una liquidación identifica nómina, cálculo y trabajador.
- Regenerar antes del cierre conserva historial o reemplaza mediante versión,
  nunca mediante actualización silenciosa.

**Pruebas**

- Dos nóminas del mismo mes.
- Regeneración.
- Fallo parcial.
- Trabajador sin datos requeridos.
- Permisos.
- Rehidratación y consulta histórica.

**Criterio de cierre**

Cada liquidación interna puede rastrearse hasta una nómina y versión de cálculo
específicas.

**Commit esperado**

`feat(nomina): generar liquidaciones internas por nomina`

---

### F18 — Cierre inmutable

**ID:** `NOM-ADMIN-OPS-F18`

**Objetivo**

Congelar el expediente completo y convertirlo en fuente interna oficial.

**Dependencias**

- F03 y F17 cerradas.

**Alcance**

- Checklist de cierre basado en evidencias persistidas.
- Confirmación crítica.
- Transición transaccional a `cerrada`.
- Congelar cálculo, liquidaciones, consolidaciones y decisiones.
- Bloquear edición y eliminación.
- Exponer acta y auditoría.

**Checklist mínimo**

- parámetros vigentes;
- dotación confirmada;
- movimientos consolidados;
- cálculo vigente;
- cero bloqueantes;
- advertencias tratadas;
- aprobación vigente;
- liquidaciones completas;
- conciliación en cero.

**Pruebas**

- Cierre exitoso.
- Liquidación faltante.
- Cálculo invalidado durante confirmación.
- Intento de edición posterior.
- Intento de reapertura.
- Permiso y concurrencia.

**Criterio de cierre**

Una nómina cerrada no cambia y todo su expediente puede reconstruirse desde
datos persistidos.

**Commit esperado**

`feat(nomina): cerrar y congelar expediente`

---

### F19 — Rectificación diferencial

**ID:** `NOM-ADMIN-OPS-F19`

**Objetivo**

Corregir una nómina cerrada sin modificarla ni reemplazar su evidencia.

**Dependencias**

- F18 cerrada.

**Alcance**

- Crear rectificación desde nómina origen.
- Seleccionar trabajadores y causa.
- Copiar únicamente contexto necesario.
- Calcular diferencias por concepto.
- Generar liquidación diferencial.
- Vincular cadena de rectificaciones.
- Mostrar acumulado original + diferencias.

**Reglas**

- La nómina origen debe estar cerrada.
- La rectificación exige motivo.
- Solo persiste diferencias, no una copia completa mutable.
- Una diferencia cero no produce línea de liquidación.
- La rectificación tiene su propio ciclo de validación, aprobación y cierre.
- El original nunca cambia de versión ni estado.

**Pruebas**

- Haber omitido.
- Descuento incorrecto.
- Cambio previsional retroactivo.
- Diferencia positiva, negativa y cero.
- Segunda rectificación.
- Trabajador no presente en el original.

**Criterio de cierre**

El sistema puede demostrar resultado original, cada ajuste y resultado
acumulado sin sobrescribir historia.

**Commit esperado**

`feat(nomina): incorporar rectificacion diferencial`

---

### F20 — Integración UX del ciclo completo

**ID:** `NOM-ADMIN-OPS-F20`

**Objetivo**

Presentar todos los contratos productivos como un flujo RRHH coherente,
compacto y guiado.

**Dependencias**

- F05-F19 cerradas en backend o disponibles tras feature gate.

**Alcance Administrador**

- Crear mediante preview.
- Filtros por tipo, estado, rango y acción requerida.
- Acciones permitidas por estado y permiso.
- Indicadores mutuamente excluyentes.
- Acceso a liquidaciones, auditoría y rectificación.

**Alcance Generador**

- Rehidratación completa.
- Siguiente acción única.
- Contexto fijo de empresa, rango, tipo, estado y versión.
- Deep links entre incidencias y origen.
- Estados de carga, vacío, error y conflicto.
- Consecuencias visibles antes de invalidar.
- Cierre y evidencia sin controles editables posteriores.

**Reglas NOIA**

- Una acción primaria por zona.
- Trabajo por excepción.
- Sin IDs ni enums técnicos visibles.
- Sin cards decorativas.
- MessageBox para decisiones críticas.
- Responsive validado en 1440, 1280, 1024 y 768 px.

**Pruebas**

- Specs de presenters y rules.
- Componentes por estado.
- Accesibilidad.
- Screenshots por paso.
- E2E de reanudación.
- Matriz de permisos visible.

**Criterio de cierre**

Un usuario puede completar el ciclo sin conocer tablas, versiones técnicas ni
rutas internas, y siempre entiende qué falta y qué acción sigue.

**Commit esperado**

`feat(nomina): integrar experiencia operativa completa`

---

### F21 — Retiro de compatibilidad y mocks runtime

**ID:** `NOM-ADMIN-OPS-F21`

**Objetivo**

Eliminar dependencias heredadas una vez demostrada la equivalencia funcional.

**Dependencias**

- F20 cerrada.
- E2E completo verde.

**Alcance**

- Mover metadata productiva fuera de `*.mock.ts`.
- Eliminar adaptadores que cargan cálculo o liquidación solo por período.
- Retirar enlaces residuales a `/remuneraciones/proceso-mensual`.
- Eliminar servicios, modelos y componentes sin consumidores.
- Mantener fixtures deterministas bajo rutas de test.
- Actualizar documentación histórica con avisos de obsolescencia.
- Evaluar columnas legacy después de una ventana de observación.

**Guardias**

- Búsqueda de imports antes de borrar.
- Comparación de resultados contra fixtures.
- Redirect legacy conservado durante la ventana acordada.
- Eliminación SQL en migración separada y posterior, no implícita.

**Pruebas**

- Cero imports runtime desde mocks.
- Cero enlaces visibles a ruta retirada.
- Build y suites completas.
- Smoke de redirects.
- Consulta histórica.

**Criterio de cierre**

El flujo productivo depende solo de contratos por nómina y los restos legacy
son fixtures, redirects controlados o historia documental explícita.

**Commit esperado**

`refactor(nomina): retirar compatibilidad mensual legacy`

---

### F22 — Certificación y despliegue

**ID:** `NOM-ADMIN-OPS-F22`

**Objetivo**

Demostrar que el ciclo es operable y recuperable antes de declararlo listo para
producción.

**Dependencias**

- F00-F21 cerradas.

**Matriz E2E obligatoria**

1. Mensual sin anticipos.
2. Mensual con anticipo semanal.
3. Mensual con dos anticipos quincenales.
4. Mensual con extraordinaria imponible.
5. Mensual con anticipos y extraordinaria.
6. Advertencia aceptada con justificación.
7. Bloqueante corregido y recalculado.
8. Usuario con permisos parciales.
9. Reanudación después de recarga.
10. Dos nóminas del mismo mes sin contaminación.
11. Cierre inmutable.
12. Rectificación diferencial.
13. Reintento por timeout.
14. Concurrencia entre dos usuarios.

**Validaciones técnicas**

- TypeScript app y specs.
- Unitarios de dominio.
- Integración repositorio/RPC.
- Tests RLS por empresa y permiso.
- Suite Angular específica y completa.
- Build productivo.
- Playwright.
- Smoke contra entorno objetivo.
- Verificación de migraciones y conteos.

**Despliegue**

1. Aplicar migraciones aditivas.
2. Verificar backfill.
3. Desplegar lectura dual compatible.
4. Habilitar escritura por nómina.
5. Ejecutar smoke controlado.
6. Habilitar tipos adicionales gradualmente.
7. Observar errores y auditoría.
8. Retirar compatibilidad solo después del gate.

**Criterio de cierre**

Todos los escenarios críticos están verdes, no existen diferencias no
explicadas en consolidación y el equipo puede diagnosticar y revertir una
activación sin modificar datos manualmente.

**Commit esperado**

`test(nomina): certificar flujo operativo completo`

## 14. Matriz de aceptación global

| Capacidad | Evidencia mínima |
|---|---|
| Crear | Preview vigente + RPC idempotente + auditoría. |
| Parámetros | Snapshot por nómina y versión. |
| Dotación | Consulta y selección en servidor. |
| Movimientos | Conceptos de catálogo e idempotencia. |
| Calcular | Contexto por `nominaPeriodoId`. |
| Rehidratar | Resultado vigente visible tras recarga. |
| Anticipos | Pago interno + descuento mensual único. |
| Extraordinarias | Pago propio + bases/pagos consolidables. |
| Validar | Bloqueantes resueltos y warnings justificados. |
| Aprobar | Actor y versión exacta. |
| Liquidar | Liquidaciones por nómina y cálculo. |
| Cerrar | Expediente congelado e inmutable. |
| Rectificar | Diferencias vinculadas sin alterar origen. |
| Seguridad | RPC/RLS por empresa y permiso. |
| Escala | Operación por excepción con 1.000+ trabajadores. |
| Calidad | Unitarios, integración, E2E, build y smoke verdes. |

## 15. Riesgos transversales

| Riesgo | Mitigación |
|---|---|
| Asociar históricos a una nómina incorrecta | Backfill solo inequívoco; ambiguos quedan en lectura. |
| Duplicar pagos al consolidar | Vínculo único, estado de consolidación e idempotencia. |
| Duplicar bases imponibles | Política por concepto y cuadratura por trabajador. |
| Aprobar una versión obsoleta | Control optimista y huella de cálculo. |
| Acción masiva sobre universo distinto | Fingerprint de filtro y preview obligatorio. |
| Permisos solo visuales | Validación obligatoria en RPC/RLS. |
| Cerrar con liquidaciones incompletas | Checklist persistido y transacción de cierre. |
| Corregir destruyendo historia | Rectificación diferencial; cierre inmutable. |
| Retirar compatibilidad demasiado pronto | Gate F21 posterior a E2E y observación. |
| Documentación nuevamente obsoleta | Actualización obligatoria al cierre de cada fase. |

## 16. Convención de cierre de fase

Al terminar cada fase se debe agregar una entrada a
[`../../orquestador/estado-fases/nomina-mensual.md`](../../orquestador/estado-fases/nomina-mensual.md)
con:

- estado y fecha;
- alcance implementado;
- archivos y migraciones principales;
- pruebas ejecutadas y resultados;
- restricciones respetadas;
- deuda detectada;
- siguiente fase habilitada.

La fase no se considera cerrada solo porque compile. Debe cumplir su criterio
de cierre, pruebas y actualización documental.

## 17. Próximo paso autorizado

El siguiente paso, después de aprobar este documento, es ejecutar únicamente
`NOM-ADMIN-OPS-F00`. F00 no modifica contratos productivos: confirma la línea
base y prepara la evidencia necesaria para comenzar F01 sin depender de
suposiciones.
