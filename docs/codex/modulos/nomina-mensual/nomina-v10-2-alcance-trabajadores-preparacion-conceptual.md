# V10.2 — Alcance y trabajadores como preparación conceptual de nómina mensual

Fecha: 2026-05-30  
Tipo: definición documental de producto, UX y arquitectura funcional.  
Estado: documentada para planificación; sin implementación productiva en esta fase.

## 1. Diagnóstico ajustado al repo actual

La dirección correcta es que un período pueda soportar más de una ejecución futura de nómina: mensual completa, complementaria, reproceso, retroactiva, finiquito o casos especiales. Esa idea evita crear períodos falsos como `Mayo 2026 A`, `Mayo 2026 B` o variantes manuales del mes.

Sin embargo, el repo actual ya tiene una decisión rectora vigente:

```txt
Nómina mensual confirmada = fuente oficial para generar liquidaciones.
```

Por eso V10.2 no debe reabrir el lenguaje visible hacia `Preparación de nómina` como concepto principal para RRHH. El usuario debe seguir entendiendo que trabaja la **Nómina mensual** del período: generar, revisar trabajadores, confirmar y generar liquidaciones desde esa versión confirmada.

La idea de `preparación/lote` queda como arquitectura conceptual para ordenar el futuro, no como obligación de persistencia ni como título visible principal de pantalla en esta fase.

## 2. Decisión principal V10.2

V10.2 define que **Alcance** y **Trabajadores** comparten un mismo contexto conceptual: el universo de trabajadores sobre el que se está construyendo la nómina mensual del período.

La fase queda acotada así:

```txt
Parámetros
-> Nómina del período
-> Trabajadores
-> Liquidaciones
-> Cierre mensual
```

Interpretación funcional:

- **Parámetros** mantiene la base normativa del período.
- **Nómina del período** comunica que existe o se generará una nómina mensual para el período activo.
- **Trabajadores** revisa el universo incluido, omitido, con advertencias o bloqueado.
- **Liquidaciones** materializa documentos desde la nómina mensual confirmada.
- **Cierre mensual** bloquea el período cuando corresponde.

No se reintroduce un wizard de 8 pasos como contrato de implementación inmediata. Si en el futuro existen `Alcance`, `Novedades`, `Cálculo`, `Validación` y `Aprobación` como pasos explícitos, deben integrarse sin contradecir el flujo visible de nómina mensual confirmada.

## 3. Lenguaje visible vs concepto técnico

### Lenguaje visible para RRHH

Usar en la pantalla principal y CTAs:

```txt
Nómina mensual
Generar nómina
Alcance
Trabajadores
Revisar trabajadores
Confirmar nómina
Generar liquidaciones
Ver liquidaciones
Cierre mensual
```

Evitar como concepto protagonista visible:

```txt
Preparación de nómina
Lote de nómina
Snapshot
idPreparacionNomina
idSnapshotParametrosBase
```

### Concepto técnico/documental

`Preparación` o `lote` puede usarse en documentación técnica para describir la evolución futura:

```txt
Un período puede contener una o más preparaciones/lotes.
La preparación default futura de la nómina mensual actual sería mensualCompleta/todaEmpresa.
```

En V10.2 ese concepto no exige tablas, RPC, IDs ni payloads nuevos.

## 4. Flujo V10.2 sin persistencia nueva

V10.2 debe operar sobre los contratos actuales:

- período activo;
- diagnóstico/prevalidación del período;
- nómina generada o snapshot activo existente;
- revisión de trabajadores;
- confirmación operativa de nómina mensual;
- liquidaciones generadas desde la nómina confirmada.

El equivalente conceptual de una preparación en V10.2 se deriva de esos datos existentes:

```txt
Tipo conceptual: mensualCompleta
Método conceptual: todaEmpresa
Período: período activo
Fuente: nómina mensual generada o confirmada existente
Universo: trabajadores incluidos/omitidos/bloqueados según diagnóstico y snapshot actual
```

No se debe guardar un `idPreparacionNomina` ficticio en frontend ni simular persistencia con `localStorage`, metadata opaca o estructuras paralelas que luego compitan con el snapshot real.

## 5. Rol de Parámetros, Alcance y Trabajadores

### Parámetros

Parámetros sigue siendo la base normativa del período:

- UF, UTM, sueldo mínimo, topes, AFP, salud, CCAF, mutual y reglas previsionales.
- Configuración cliente vigente para calcular la nómina.
- Estado de completitud que habilita o bloquea generar nómina.

En V10.2, Parámetros no crea una preparación persistida. Solo deja clara la base que habilita la generación de la nómina mensual.

### Alcance

Alcance es una lectura compacta del universo que entrará a la nómina mensual.

Debe responder:

```txt
¿Qué trabajadores entran?
¿Quiénes quedan omitidos?
¿Quiénes están bloqueados?
¿Qué criterio se está usando hoy?
¿Puedo avanzar a revisión de trabajadores?
```

La UI de Alcance no debe duplicar la grilla completa de Trabajadores. Debe mostrar resumen, criterio, conteos y una vista previa suficiente para decidir.

Copy recomendado:

```txt
Alcance de la nómina mensual
Define el universo de trabajadores que se revisará antes de confirmar la nómina del período.
```

### Trabajadores

Trabajadores es la revisión detallada del universo definido por Alcance.

Debe responder:

```txt
¿Quién está listo?
¿Quién requiere revisión?
¿Quién está bloqueado?
¿Qué debe corregirse antes de confirmar?
¿Qué cambios o movimientos impactan al período?
```

Esta vista puede usar grilla, filtros y detalle por trabajador. Aquí sí corresponde revisar contrato, sueldo, jornada, previsión, salud, datos bancarios, movimientos del mes, recurrentes y bloqueos.

## 6. Reglas de avance y bloqueos

### Parámetros -> Nómina del período

Requiere parámetros operativos para el período activo. Si faltan datos obligatorios, el CTA debe llevar a corregir Parámetros, no a crear una preparación.

### Nómina del período -> Trabajadores

Requiere nómina generada o diagnóstico suficiente para mostrar el universo. Si todavía no existe nómina, la acción principal debe ser `Generar nómina`.

### Trabajadores -> Confirmar nómina

Requiere que no existan bloqueos críticos de trabajadores. Las advertencias pueden requerir confirmación explícita según reglas existentes.

### Confirmar nómina -> Liquidaciones

Requiere una nómina mensual confirmada. Liquidaciones no debe generarse desde datos vivos dispersos.

### Liquidaciones -> Cierre mensual

Requiere liquidaciones generadas o estado equivalente según el flujo vigente. El cierre no debe ocultar pendientes críticos.

## 7. Qué NO cambia en esta fase

V10.2 no cambia:

- SQL, RPC, RLS ni estructura de BD.
- Motor de cálculo.
- Servicios productivos, repositories, mappers o payloads críticos.
- Generación real de liquidaciones.
- Reglas de liquidaciones oficiales.
- Rutas públicas existentes.
- Identidad visible de `Nómina mensual` definida por NOIA.
- Contratos actuales basados en período, snapshot, cálculo y confirmación operativa.

También queda fuera de alcance exigir que cálculo o liquidaciones reciban `idPreparacionNomina`. Esa obligación pertenece a una fase backend posterior.

## 8. Puente V11: preparaciones/lotes persistidos

La evolución futura puede formalizar preparaciones/lotes persistidos cuando el backend lo permita.

Modelo conceptual futuro:

```txt
Período: Mayo 2026

Preparaciones/lotes:
- mensualCompleta / todaEmpresa
- complementaria / seleccionManual
- reproceso / seleccionManual
- retroactiva / seleccionManual
- finiquito / seleccionManual
- especial / centroCosto o grupo
```

En esa fase futura tendría sentido introducir contratos como:

```ts
type TipoPreparacionNomina =
  | 'mensualCompleta'
  | 'porCentroCosto'
  | 'seleccionManual'
  | 'complementaria'
  | 'reproceso'
  | 'retroactiva'
  | 'finiquito'
  | 'especial';

type MetodoAlcanceNomina =
  | 'todaEmpresa'
  | 'centroCosto'
  | 'grupo'
  | 'seleccionManual'
  | 'contrato';
```

Pero esos tipos no son requisito de V10.2 y no deben agregarse al modelo productivo sin persistencia real, reglas de versionado y contrato de liquidaciones.

Preparación default futura:

```txt
La nómina mensual actual equivale conceptualmente a:
tipo = mensualCompleta
método = todaEmpresa
fuente = nómina mensual generada/confirmada del período
```

Esa equivalencia permite migrar más adelante sin romper el snapshot actual ni las liquidaciones ya generadas.

## 9. Criterios de aceptación

La definición V10.2 se considera correcta si:

- El usuario sigue viendo `Nómina mensual` como concepto principal.
- `Preparación de nómina` no aparece como título visible protagonista para RRHH.
- Alcance y Trabajadores comparten contexto de universo de trabajadores.
- Alcance no duplica la grilla completa de Trabajadores.
- Trabajadores concentra la revisión detallada y las correcciones por persona.
- Liquidaciones se mantiene asociado a nómina mensual confirmada.
- No se piden SQL/RPC/RLS, IDs persistentes nuevos ni cambios de motor.
- Los tipos complementaria, reproceso, retroactiva y finiquito quedan documentados como V11/futuro.
- El documento puede usarse para planificar UI sin decidir backend.

## 10. Fuentes contrastadas

- [`noia-ui-manual.md`](../../diseno/noia-ui-manual.md): Nómina mensual debe entenderse como `Nómina mensual`, con `Generar nómina`, revisión de trabajadores, confirmación y liquidaciones desde nómina confirmada.
- [`nomina-mensual-confirmacion-flow.md`](./nomina-mensual-confirmacion-flow.md): regla rectora `Nómina mensual confirmada = fuente oficial para generar liquidaciones`.
- Documento de entrada externo: `C:\Users\PC\Downloads\nomina-v10-2-preparaciones-especificas.md`. Queda como referencia de origen; no se modifica desde esta fase.
