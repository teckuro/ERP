import type { EntradaMensualPeriodo } from '../entradas/models/entrada-mensual-periodo.model';
import type { EntradaMensualMotor } from '../models/proceso-mensual.model';
import {
  DIAS_BASE_MES,
  aplicarClasificacionConceptos,
  calcularDiasAusenciaEntradas,
  calcularDiasCalendarioTrabajados,
  calcularDiasLicenciaMedicaEntradas,
  calcularDiasPagablesBase30,
  calcularDiasTrabajados,
  clasificarEntradaMensualMotor,
  construirEntradasMensualesMotor,
  diasEnMes,
  entradaMensualAptaParaMotor,
  mapEntradaMensualMotor,
} from './proceso-mensual-motor-entradas.rules';

function entradaMotor(over: Partial<EntradaMensualMotor> = {}): EntradaMensualMotor {
  return {
    idEntrada: 'novedad:1',
    origen: 'novedad_mensual',
    origenId: 1,
    periodo: '2026-05',
    idPersona: 1,
    idContrato: 10,
    idConcepto: 20,
    tipoEntrada: 'haber',
    categoria: 'haber_variable',
    tipoMovimiento: 'haber',
    cantidad: null,
    unidad: null,
    monto: 50000,
    moneda: 'CLP',
    estado: 'aprobada',
    afectaBase: null,
    metadata: {},
    ...over,
  };
}

function entrada(over: Partial<EntradaMensualPeriodo> = {}): EntradaMensualPeriodo {
  return {
    idEntrada: 'novedad:1',
    origen: 'novedad_mensual',
    origenId: 1,
    periodo: '2026-05',
    idPersona: 1,
    idContrato: 10,
    idConcepto: 20,
    tipoEntrada: 'haber',
    categoria: 'haber_variable',
    tipoMovimiento: 'haber',
    cantidad: null,
    unidad: null,
    monto: 50000,
    moneda: 'CLP',
    estado: 'aprobada',
    fechaEvento: null,
    observacion: null,
    referenciaExterna: null,
    requiereRevision: false,
    bloqueaProceso: false,
    warnings: [],
    metadata: { origenTecnico: 'novedad_remuneracion_periodo' },
    ...over,
  };
}

describe('proceso-mensual-motor-entradas.rules', () => {
  it('mapea entrada aprobada al contrato del motor', () => {
    const result = mapEntradaMensualMotor(entrada({ cantidad: 2, unidad: 'horas' }));

    expect(result.idEntrada).toBe('novedad:1');
    expect(result.origen).toBe('novedad_mensual');
    expect(result.origenId).toBe(1);
    expect(result.periodo).toBe('2026-05');
    expect(result.idPersona).toBe(1);
    expect(result.idContrato).toBe(10);
    expect(result.idConcepto).toBe(20);
    expect(result.cantidad).toBe(2);
    expect(result.unidad).toBe('horas');
    expect(result.monto).toBe(50000);
    expect(result.metadata['contratoMotor']).toBe('MOTOR-04_PREPARATORIO');
  });

  it('solo entradas aprobadas o aptas entran al contrato calculable', () => {
    const result = construirEntradasMensualesMotor([
      entrada({ idEntrada: 'ok', estado: 'aprobada' }),
      entrada({ idEntrada: 'borrador', estado: 'borrador', requiereRevision: true }),
      entrada({ idEntrada: 'pendiente', estado: 'pendiente_revision', requiereRevision: true }),
      entrada({ idEntrada: 'observada', estado: 'observada', requiereRevision: true }),
      entrada({ idEntrada: 'rechazada', estado: 'rechazada' }),
      entrada({ idEntrada: 'anulada', estado: 'anulada' }),
    ]);

    expect(result.map((item) => item.idEntrada)).toEqual(['ok']);
  });

  it('borrador no entra', () => {
    expect(entradaMensualAptaParaMotor(entrada({ estado: 'borrador' }))).toBe(false);
  });

  it('pendiente_revision no entra', () => {
    expect(entradaMensualAptaParaMotor(entrada({ estado: 'pendiente_revision' }))).toBe(false);
  });

  it('observada no entra', () => {
    expect(entradaMensualAptaParaMotor(entrada({ estado: 'observada' }))).toBe(false);
  });

  it('rechazada no entra', () => {
    expect(entradaMensualAptaParaMotor(entrada({ estado: 'rechazada' }))).toBe(false);
  });

  it('anulada no entra', () => {
    expect(entradaMensualAptaParaMotor(entrada({ estado: 'anulada' }))).toBe(false);
  });

  it('legacy validado normalizado entra como transicion', () => {
    const result = construirEntradasMensualesMotor([
      entrada({
        idEntrada: 'legacy_movimiento:1',
        origen: 'legacy_movimiento_variable',
        origenId: 1,
        estado: 'aprobada',
        categoria: 'legacy_movimiento_variable',
        metadata: { origenTecnico: 'movimiento_variable_mensual', estadoLegacy: 'VALIDADO' },
      }),
    ]);

    expect(result).toHaveLength(1);
    expect(result[0].origen).toBe('legacy_movimiento_variable');
    expect(result[0].metadata['estadoLegacy']).toBe('VALIDADO');
  });

  it('legacy bloqueado no entra', () => {
    const result = construirEntradasMensualesMotor([
      entrada({
        idEntrada: 'legacy_movimiento:2',
        origen: 'legacy_movimiento_variable',
        estado: 'legacy_bloqueado',
        bloqueaProceso: true,
        metadata: { estadoLegacy: 'BLOQUEADO' },
      }),
    ]);

    expect(result).toEqual([]);
  });

  it('lee imponible/tributable desde metadata al mapear', () => {
    const result = mapEntradaMensualMotor(entrada({ metadata: { imponible: false, tributable: false } }));

    expect(result.imponible).toBe(false);
    expect(result.tributable).toBe(false);
  });
});

describe('clasificarEntradaMensualMotor', () => {
  it('clasifica bono imponible por defecto', () => {
    const c = clasificarEntradaMensualMotor(entradaMotor({ categoria: 'haber_variable', tipoMovimiento: 'haber' }));
    expect(c.clase).toBe('HABER_IMPONIBLE');
    expect(c.codigo).toBe('BONO');
    expect(c.imponible).toBe(true);
  });

  it('clasifica bono no imponible cuando imponible=false', () => {
    const c = clasificarEntradaMensualMotor(entradaMotor({ categoria: 'haber_variable', imponible: false }));
    expect(c.clase).toBe('HABER_NO_IMPONIBLE');
    expect(c.imponible).toBe(false);
  });

  it('clasifica horas extra como haber imponible', () => {
    const c = clasificarEntradaMensualMotor(entradaMotor({ categoria: 'tiempo_trabajado_adicional', tipoMovimiento: 'haber' }));
    expect(c.clase).toBe('HABER_IMPONIBLE');
    expect(c.codigo).toBe('HORA_EXTRA');
  });

  it('clasifica anticipo', () => {
    const c = clasificarEntradaMensualMotor(entradaMotor({ tipoEntrada: 'anticipo', categoria: 'anticipo_descuento_unico', tipoMovimiento: 'descuento' }));
    expect(c.clase).toBe('ANTICIPO');
  });

  it('clasifica ausencia', () => {
    const c = clasificarEntradaMensualMotor(entradaMotor({ tipoEntrada: 'ausencia', categoria: 'ausencia_descuento_tiempo', tipoMovimiento: 'descuento' }));
    expect(c.clase).toBe('AUSENCIA');
  });

  it('clasifica descuento voluntario', () => {
    const c = clasificarEntradaMensualMotor(entradaMotor({ tipoEntrada: 'descuento', categoria: 'ajuste_manual_controlado', tipoMovimiento: 'descuento' }));
    expect(c.clase).toBe('DESCUENTO_VOLUNTARIO');
  });

  it('clasifica licencia como no soportada aun', () => {
    const c = clasificarEntradaMensualMotor(entradaMotor({ tipoEntrada: 'licencia', categoria: 'licencia_permiso', tipoMovimiento: 'informativo' }));
    expect(c.clase).toBe('NO_SOPORTADO');
  });

  it('suma dias de ausencia desde cantidad', () => {
    const dias = calcularDiasAusenciaEntradas([
      entradaMotor({ tipoEntrada: 'ausencia', categoria: 'ausencia_descuento_tiempo', cantidad: 2, unidad: 'dias', monto: null }),
      entradaMotor({ tipoEntrada: 'ausencia', categoria: 'ausencia_descuento_tiempo', cantidad: 1, unidad: 'dias', monto: null }),
      entradaMotor({ categoria: 'haber_variable', monto: 1000 }),
    ]);
    expect(dias).toBe(3);
  });

  it('suma dias de licencia medica desde metadata licenciaMedica', () => {
    const dias = calcularDiasLicenciaMedicaEntradas([
      entradaMotor({
        tipoEntrada: 'licencia',
        categoria: 'licencia_permiso',
        cantidad: 4,
        unidad: 'dias',
        monto: null,
        metadata: { licenciaMedica: true },
      }),
    ]);
    expect(dias).toBe(4);
  });

  it('expone dias base mes 30', () => {
    expect(DIAS_BASE_MES).toBe(30);
  });
});

describe('DIAS-TS paridad con fn_calcular_dias_trabajados', () => {
  it('diasEnMes resuelve largo calendario por mes', () => {
    expect(diasEnMes('2026-01')).toBe(31);
    expect(diasEnMes('2026-04')).toBe(30);
    expect(diasEnMes('2026-02')).toBe(28);
    expect(diasEnMes('2024-02')).toBe(29);
  });

  // Caso 1: mes completo sin ingreso/retiro/ausencias -> dias calendario del mes (SQL es calendario).
  it('caso 1: mes completo sin ingreso/retiro devuelve dias calendario', () => {
    expect(calcularDiasTrabajados({ anioMes: '2026-01' })).toBe(31);
    expect(calcularDiasTrabajados({ anioMes: '2026-04' })).toBe(30);
  });

  // Caso 2: ingreso al inicio del mes -> mes completo (GREATEST acota al inicio del periodo).
  it('caso 2: ingreso al inicio del mes equivale a mes completo', () => {
    expect(calcularDiasTrabajados({ anioMes: '2026-01', fechaIngreso: '2026-01-01' })).toBe(31);
    // Ingreso previo al periodo: se acota al inicio del mes (no suma dias anteriores).
    expect(calcularDiasTrabajados({ anioMes: '2026-01', fechaIngreso: '2025-12-15' })).toBe(31);
  });

  // Caso 3: ingreso a mitad de mes -> dias inclusivos desde el ingreso al fin de mes.
  it('caso 3: ingreso a mitad de mes acota dias trabajados', () => {
    // 16..31 enero = 16 dias.
    expect(calcularDiasTrabajados({ anioMes: '2026-01', fechaIngreso: '2026-01-16' })).toBe(16);
  });

  // Caso 4: retiro a mitad de mes -> dias inclusivos desde el inicio al retiro.
  it('caso 4: retiro a mitad de mes acota dias trabajados', () => {
    // 1..15 enero = 15 dias.
    expect(calcularDiasTrabajados({ anioMes: '2026-01', fechaRetiro: '2026-01-15' })).toBe(15);
  });

  // Caso 5: ingreso y retiro dentro del mismo mes -> ventana acotada inclusiva.
  it('caso 5: ingreso y retiro en el mismo mes acotan la ventana', () => {
    // 10..20 enero = 11 dias.
    expect(calcularDiasTrabajados({ anioMes: '2026-01', fechaIngreso: '2026-01-10', fechaRetiro: '2026-01-20' })).toBe(11);
    // Retiro anterior al ingreso -> 0 (ventana vacia).
    expect(calcularDiasTrabajados({ anioMes: '2026-01', fechaIngreso: '2026-01-20', fechaRetiro: '2026-01-10' })).toBe(0);
  });

  // Caso 6: licencia medica parcial descuenta dias (mirror de diainasist).
  it('caso 6: licencia medica parcial descuenta dias', () => {
    // 30 dias - 5 licencia = 25.
    expect(calcularDiasTrabajados({ anioMes: '2026-04', diasLicencia: 5 })).toBe(25);
    // Licencia mayor a los dias trabajados -> piso 0.
    expect(calcularDiasTrabajados({ anioMes: '2026-04', diasLicencia: 40 })).toBe(0);
  });

  // Caso 7: ausencia parcial -> fn_calcular_dias_trabajados NO descuenta ausencias genericas (solo licencia medica).
  it('caso 7: ausencia parcial no altera el mirror del SQL (solo base 30 descuenta ausencias)', () => {
    expect(calcularDiasTrabajados({ anioMes: '2026-04' })).toBe(30);
    // En base 30 la ausencia si descuenta dias pagables.
    expect(calcularDiasPagablesBase30({ anioMes: '2026-04', diasAusencia: 3 })).toBe(27);
  });

  // Caso 8: mes de 31 dias calendario pero base 30.
  it('caso 8: mes de 31 dias devuelve 31 en mirror y 30 en base 30', () => {
    expect(calcularDiasTrabajados({ anioMes: '2026-01' })).toBe(31);
    expect(calcularDiasPagablesBase30({ anioMes: '2026-01' })).toBe(30);
  });

  // Caso 9: febrero -> mirror devuelve dias calendario reales; base 30 paga 30 si el mes fue completo.
  it('caso 9: febrero mantiene base 30 en mes completo', () => {
    expect(calcularDiasTrabajados({ anioMes: '2026-02' })).toBe(28);
    expect(calcularDiasTrabajados({ anioMes: '2024-02' })).toBe(29);
    expect(calcularDiasPagablesBase30({ anioMes: '2026-02' })).toBe(30);
    expect(calcularDiasPagablesBase30({ anioMes: '2024-02' })).toBe(30);
    // Febrero con ingreso a mitad: mirror calendario y base 30 acotada.
    expect(calcularDiasTrabajados({ anioMes: '2026-02', fechaIngreso: '2026-02-15' })).toBe(14);
    expect(calcularDiasPagablesBase30({ anioMes: '2026-02', fechaIngreso: '2026-02-15' })).toBe(14);
  });

  // Caso 10: combinacion ingreso + retiro + licencia (soportado por el SQL).
  it('caso 10: combinacion ingreso + retiro + licencia', () => {
    // Ingreso 05, retiro 24 enero -> 5..24 = 20 dias calendario; menos 3 licencia = 17.
    expect(
      calcularDiasTrabajados({ anioMes: '2026-01', fechaIngreso: '2026-01-05', fechaRetiro: '2026-01-24', diasLicencia: 3 }),
    ).toBe(17);
    // Base 30: 20 dias calendario acotados a 30 -> 20; menos 3 licencia = 17.
    expect(
      calcularDiasPagablesBase30({ anioMes: '2026-01', fechaIngreso: '2026-01-05', fechaRetiro: '2026-01-24', diasLicencia: 3 }),
    ).toBe(17);
  });

  it('calcularDiasCalendarioTrabajados expone el CTE dias_base sin licencia', () => {
    expect(calcularDiasCalendarioTrabajados('2026-01')).toBe(31);
    expect(calcularDiasCalendarioTrabajados('2026-01', '2026-01-16')).toBe(16);
    // Ingreso posterior al fin de mes -> 0.
    expect(calcularDiasCalendarioTrabajados('2026-01', '2026-02-05')).toBe(0);
  });

  it('base 30 combina ausencia y licencia sobre mes completo', () => {
    // Mes completo (30 base) menos 4 ausencia menos 2 licencia = 24.
    expect(calcularDiasPagablesBase30({ anioMes: '2026-04', diasAusencia: 4, diasLicencia: 2 })).toBe(24);
  });

  it('calcularDiasLicenciaMedicaEntradas suma solo licencia medica', () => {
    const dias = calcularDiasLicenciaMedicaEntradas([
      entradaMotor({ tipoEntrada: 'licencia', categoria: 'licencia_medica', cantidad: 5, unidad: 'dias', monto: null }),
      entradaMotor({ tipoEntrada: 'licencia', categoria: 'licencia_permiso', cantidad: 3, unidad: 'dias', monto: null }),
      entradaMotor({ categoria: 'haber_variable', monto: 1000 }),
    ]);
    expect(dias).toBe(5);
  });
});

describe('aplicarClasificacionConceptos (imponible/tributable desde el catálogo)', () => {
  function entradaHaber(extra: Partial<EntradaMensualPeriodo> = {}): EntradaMensualPeriodo {
    return {
      idEntrada: 'movimiento_nomina:1',
      origen: 'movimiento_nomina',
      origenId: 1,
      periodo: '2026-05',
      idPersona: 1,
      idContrato: 10,
      idConcepto: 5,
      tipoEntrada: 'haber',
      categoria: 'HABER',
      tipoMovimiento: 'HABER',
      cantidad: null,
      unidad: null,
      monto: 20000,
      moneda: 'CLP',
      estado: 'aprobada',
      fechaEvento: null,
      observacion: null,
      referenciaExterna: null,
      requiereRevision: false,
      bloqueaProceso: false,
      warnings: [],
      metadata: {},
      ...extra,
    } as EntradaMensualPeriodo;
  }

  const MOVILIZACION = { idConcepto: 5, naturaleza: 'NO_IMPONIBLE', imponible: false, tributable: false };
  const BONO = { idConcepto: 7, naturaleza: 'IMPONIBLE', imponible: true, tributable: true };

  it('un haber de concepto no imponible queda como HABER_NO_IMPONIBLE (antes caía en imponible)', () => {
    const [entrada] = aplicarClasificacionConceptos([entradaHaber()], [MOVILIZACION]);
    const clasificada = clasificarEntradaMensualMotor(mapEntradaMensualMotor(entrada));

    expect(clasificada.clase).toBe('HABER_NO_IMPONIBLE');
    expect(clasificada.tributable).toBe(false);
  });

  it('un haber de concepto imponible sigue siendo imponible y tributable', () => {
    const [entrada] = aplicarClasificacionConceptos([entradaHaber({ idConcepto: 7 })], [BONO]);
    const clasificada = clasificarEntradaMensualMotor(mapEntradaMensualMotor(entrada));

    expect(clasificada.clase).toBe('HABER_IMPONIBLE');
    expect(clasificada.tributable).toBe(true);
  });

  it('respeta las banderas que la entrada ya trae', () => {
    const [entrada] = aplicarClasificacionConceptos(
      [entradaHaber({ metadata: { imponible: true, tributable: true } })],
      [MOVILIZACION],
    );

    expect(entrada.metadata).toMatchObject({ imponible: true, tributable: true });
  });

  it('deja igual una entrada cuyo concepto no está en el catálogo', () => {
    const original = entradaHaber({ idConcepto: 999 });
    const [entrada] = aplicarClasificacionConceptos([original], [MOVILIZACION]);

    expect(entrada).toEqual(original);
  });
});
