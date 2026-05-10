# MOTOR-00 - Entradas y salidas del motor

Este documento describe tipos conceptuales. No crear interfaces TypeScript todavia.

## MotorCalculoInput

```ts
type MotorCalculoInput = {
  periodo: string;
  empresa: EmpresaCalculoSnapshot;
  parametrosPeriodo: ParametrosPeriodoSnapshot;
  trabajadoresPreNomina: TrabajadorPreNominaSnapshot[];
  contratosVigentes: ContratoVigenteSnapshot[];
  haberesRecurrentes: MovimientoRemuneracionSnapshot[];
  descuentosRecurrentes: MovimientoRemuneracionSnapshot[];
  movimientosVariables: MovimientoVariableSnapshot[];
  parametrosLegales: ParametrosLegalesSnapshot;
  configuracionLey16744: ConfiguracionLey16744Snapshot;
  tablaImpuestoUnico: TramoImpuestoUnicoSnapshot[];
  reglasCalculo: ReglasCalculoSnapshot;
};
```

## MOTOR-04 - Entradas mensuales canonicas

MOTOR-04 agrega al contrato TypeScript real un arreglo preparatorio:

```ts
type MotorCalculoInput = {
  entradasMensuales: EntradaMensualMotor[];
};

type EntradaMensualMotor = {
  idEntrada: string | number;
  origen: 'recurrente' | 'novedad_mensual' | 'legacy_movimiento_variable';
  origenId: string | number | null;
  periodo: string;
  idPersona: number;
  idContrato: number | null;
  idConcepto: number;
  tipoEntrada: string;
  categoria: string | null;
  tipoMovimiento: string | null;
  cantidad: number | null;
  unidad: string | null;
  monto: number | null;
  moneda: string | null;
  estado: string;
  afectaBase: boolean | null;
  metadata: Record<string, unknown>;
};
```

Decision: contrato preparatorio. El motor recibe estas entradas, pero no las suma todavia a haberes, descuentos, bases, impuestos ni liquido.

Solo llegan entradas aptas para pre-nomina: aprobadas y sin bloqueo critico. Borrador, pendiente_revision, observada, rechazada, anulada y legacy bloqueado quedan excluidas. Legacy validado puede entrar como transicion si ya fue normalizado como aprobado.

No se modifican formulas previsionales, tributarias ni legales en MOTOR-04.

## Parametros legales minimos

| Grupo | Fuente canonica |
|---|---|
| IMM, UF, UTM, UTA, topes, SIS, SANNA | `parametros_generales` |
| AFP | `afp`, `afp_vigencia` |
| Salud | `salud`, `salud_plan` |
| AFC | `afc_parametro` |
| Asignacion familiar | `tramo_carga` |
| Ley 16.744 | `ley_16744_parametros`, `empresa_ley_16744`, `organismo_administrador_ley_16744` |
| Impuesto unico | `tabla_impuesto_unico` |
| Reforma previsional | `reforma_previsional_parametro` |

## LiquidacionCalculada

```ts
type LiquidacionCalculada = {
  periodo: string;
  trabajador: TrabajadorLiquidacionSnapshot;
  haberesImponibles: LineaLiquidacionCalculada[];
  haberesNoImponibles: LineaLiquidacionCalculada[];
  descuentosLegales: LineaLiquidacionCalculada[];
  descuentosVoluntarios: LineaLiquidacionCalculada[];
  baseImponiblePrevisional: number;
  baseTributable: number;
  cotizacionAfp: LineaLiquidacionCalculada;
  cotizacionSalud: LineaLiquidacionCalculada;
  cotizacionAfc: LineaLiquidacionCalculada | null;
  cotizacionSis: LineaLiquidacionCalculada;
  cotizacionSanna: LineaLiquidacionCalculada | null;
  cotizacionLey16744: LineaLiquidacionCalculada;
  impuestoUnico: LineaLiquidacionCalculada;
  totalHaberes: number;
  totalDescuentos: number;
  liquidoAPago: number;
  issues: MotorCalculoIssue[];
  trazabilidad: MotorCalculoTrazabilidad[];
};
```

## Issues

Cada issue debe identificar:

- `codigo`;
- `severidad`: `BLOQUEO`, `ADVERTENCIA` o `INFO`;
- `trabajador` si aplica;
- `origen`;
- `mensaje`;
- `accionSugerida`.

## Trazabilidad

Cada linea calculada debe poder responder:

- que fuente normativa aplica;
- que tabla canonica se uso;
- que vigencia se uso;
- que valor fue aplicado;
- que formula se aplico;
- que resultado produjo;
- que issue se genero si hubo advertencia o bloqueo.

## Snapshot preliminar persistible (MOTOR-03A)

MOTOR-03A define solo el contrato documental de persistencia. No crea interfaces TypeScript ni tablas.

El resultado en memoria de `LiquidacionCalculada` puede transformarse en un snapshot preliminar futuro con estas capas:

```ts
type NominaCalculoPeriodoSnapshot = {
  idCalculoPeriodo: number;
  periodo: string;
  estado:
    | 'borrador'
    | 'preliminar'
    | 'recalculado'
    | 'observado'
    | 'listo_para_revision'
    | 'aprobado_para_liquidacion'
    | 'anulado';
  fechaGeneracion: string;
  usuarioGenerador: string | null;
  resumen: MotorCalculoResumenPeriodo;
  versionMotor: string;
  hashSnapshot: string;
  origen: 'preliminar' | 'manual' | 'recalculo';
  trabajadores: NominaCalculoTrabajadorSnapshot[];
  issues: MotorCalculoIssue[];
  trazabilidad: MotorCalculoTrazabilidad[];
};
```

Relaciones conceptuales:

- `NominaCalculoPeriodoSnapshot` congela el resumen del periodo.
- `NominaCalculoTrabajadorSnapshot` congela totales y bases por trabajador.
- `NominaCalculoConceptoSnapshot` congela lineas de haberes, descuentos, cotizaciones e impuesto.
- `MotorCalculoIssue` y `MotorCalculoTrazabilidad` deben persistirse sin perder codigo, severidad, fuente, formula ni vigencia.

Estados excluidos en esta capa: `cerrado`, `enviado_previred`, `enviado_lre` y `contabilizado`.

Documento de detalle: [`motor-calculo-persistencia-03A.md`](./motor-calculo-persistencia-03A.md).
