import type {
  HaberDescuentoAsignacionPrevalidacionMensualFila,
} from '../../haberes-descuentos/models/haber-descuento-asignacion.model';
import type { ParametroGeneral, ParametrosGeneralesCatalogos } from '../../parametros-generales/models/parametro-general.model';
import type { EntradaMensualMotor, MotorCalculoInput, ProcesoMensualPrevalidacion } from '../models/proceso-mensual.model';

import { generarCalculoPreliminarPeriodo } from './proceso-mensual-motor.rules';

function parametros(over: Partial<ParametroGeneral> = {}): ParametroGeneral {
  return {
    periodo: '2026-05',
    uf: 38000,
    utm: 60000,
    uta: null,
    sueldoMinimo: 539000,
    sueldoMinimo18a65: null,
    sueldoMinimoMenor18Mayor65: null,
    sueldoMinimoCasaParticular: null,
    ingresoMinimoNoRemuneracional: null,
    topeAfpUf: null,
    gratificacion: true,
    immGratificacion: null,
    topeAfp: null,
    topeIpsUf: null,
    topeIps: null,
    topeCesantiaUf: null,
    topeCesantia: null,
    topeApvMensualUf: null,
    topeApvMensual: null,
    topeApvAnualUf: null,
    topeApvAnual: null,
    topeDepositoConvenidoAnualUf: null,
    topeDepositoConvenidoAnual: null,
    topeAfpVoluntario: null,
    sis: 0.015,
    sanna: 0.03, // porcentaje (0,03 %), como en parametros_generales
    seguroSocialExpectativaVida: null,
    aporteEmpleadorAfp: null,
    saludObligatoria: 0.07,
    saludCcaf: null,
    saludFonasaConCcaf: null,
    descuentosBasePorDia: false,
    afcTrabajadorIndefinido: null,
    afcEmpleadorIndefinido: null,
    afcEmpleadorPlazo: null,
    afcEmpleadorIndefinidoOnceAnosMas: null,
    afcEmpleadorCasaParticular: null,
    trabajoPesadoEmpleador: null,
    trabajoPesadoTrabajador: null,
    trabajoMenosPesadoEmpleador: null,
    trabajoMenosPesadoTrabajador: null,
    fechaActualizacion: null,
    ...over,
  };
}

function catalogos(over: Partial<ParametrosGeneralesCatalogos> = {}): ParametrosGeneralesCatalogos {
  return {
    afp: [{ idAfp: 1, codigo: 'AFP', nombre: 'AFP Uno', periodo: '2026-05', tasaObligatoria: 0.1, comision: 0.011, sis: null, tasaEmpleador: null, vigente: true, vigenciaInicio: '2026-05-01', vigenciaFin: null }],
    isapres: [],
    saludInstituciones: [{ idSalud: 1, codigo: 'FONASA', nombre: 'Fonasa', tipo: 'FONASA', porcentajeCotizacion: 0.07, periodo: null, vigente: true, vigenciaInicio: null, vigenciaFin: null }],
    tramosCarga: [],
    tramosImpuesto: [],
    tablaImpuestoUnico: [{ id: 1, tramo: 1, desde: 0, hasta: 9999999, factor: 0, rebaja: 0, vigenciaInicio: '2026-05-01', vigenciaFin: null }],
    reformaPensiones: [],
    trabajosPesados: [],
    reformaPrevisional: [],
    ley16744Parametros: [{ idLey16744Parametro: 1, codigo: 'BASE', periodo: '2026-05', cotizacionBasicaEmpleador: 0.009, descripcionTasaAdicional: null, fuenteFinanciamiento: null, fuenteOrganismos: null, vigente: true, vigenciaInicio: '2026-05-01', vigenciaFin: null }],
    organismosLey16744: [],
    ccafEntidades: [],
    apvInstituciones: [],
    apvFormasPago: [],
    afcParametros: [{ idAfcParametro: 1, codigoTipoContrato: 'INDEFINIDO', aplicaSeguro: true, aplicaTrabajador: true, tasaTrabajador: 0.006, tasaEmpleador: 0.024, periodo: '2026-05', vigenciaInicio: '2026-05-01', vigenciaFin: null, observacion: null }],
    ...over,
  };
}

function prevalidacion(over: Partial<ProcesoMensualPrevalidacion> = {}): ProcesoMensualPrevalidacion {
  return {
    periodo: '2026-05',
    estado: 'LISTO_PARA_CALCULO',
    resumen: {
      periodo: '2026-05',
      hayBloqueos: false,
      hayAdvertencias: false,
      conteoMovimientosPorEstado: {},
      trabajadoresActivosAptos: 1,
      trabajadoresActivosNoAptos: 0,
      parametrosOperativos: true,
      parametrosGrupos: [],
      recurrentesAplicablesAlPeriodo: 0,
      recurrentesInvalidas: 0,
      recurrentesCerradas: 0,
      recurrentesFueraDelMes: 0,
    },
    bloqueos: [],
    advertencias: [],
    informaciones: [],
    items: [],
    trabajadoresPendientesRevision: [],
    ...over,
  };
}

function recurrente(over: Partial<HaberDescuentoAsignacionPrevalidacionMensualFila['asignacion']>): HaberDescuentoAsignacionPrevalidacionMensualFila {
  return {
    estadoVigencia: 'ACTIVA',
    intersectaPeriodo: true,
    asignacion: {
      idAsignacion: 1,
      idPersona: 1,
      idConcepto: 1,
      idContrato: 10,
      codigoConcepto: 'BONO',
      nombreConcepto: 'Bono',
      tipoConcepto: 'HABER',
      naturalezaConcepto: 'IMPONIBLE',
      codigoLre: null,
      esSistemaConcepto: false,
      calculoAutomaticoConcepto: false,
      imponible: true,
      tributable: true,
      monto: 100000,
      porcentaje: null,
      tipoValor: 'FIJO',
      tipohaber: null,
      periodicidad: 'MENSUAL',
      vigenciaInicio: '2026-05-01',
      vigenciaFin: null,
      observacion: null,
      estado: true,
      ...over,
    },
  };
}

function input(over: Partial<MotorCalculoInput> = {}): MotorCalculoInput {
  const pv = prevalidacion();
  return {
    periodo: '2026-05',
    prevalidacion: pv,
    preNomina: {
      periodo: '2026-05',
      estado: 'GENERADA',
      generadoEn: '2026-05-05T10:00:00.000Z',
      trabajadoresIncluidos: 1,
      recurrentesIncluidos: 0,
      movimientosVariablesValidados: 0,
      movimientosVariablesBorrador: 0,
      parametrosOperativos: true,
      codigosBloqueo: [],
      codigosAdvertencia: [],
      origenPrevalidacion: 'LISTO_PARA_CALCULO',
    },
    parametrosPeriodo: parametros(),
    catalogos: catalogos(),
    trabajadores: [{
      idPersona: 1,
      idContrato: 10,
      rut: '11.111.111-1',
      nombreCompleto: 'Ana Perez',
      estado: 'activo',
      aptoParaRemuneraciones: true,
      sueldoBase: 800000,
      tipoContrato: 'INDEFINIDO',
      idAfp: 1,
      idSalud: 1,
      valorPlanSalud: null,
      horasSemanales: 42,
      cargasFamiliares: 0,
      idTramoCarga: null,
      tipoGratificacion: null,
      gratificacionProporcional: null,
    }],
    recurrentes: [],
    entradasMensuales: [],
    empresaLey16744: {
      idEmpresa: 1,
      idOrganismoAdministradorLey16744: 1,
      tasaAdicionalDiferenciada: 0.001,
      vigenciaInicio: '2026-05-01',
      vigenciaFin: null,
    },
    ...over,
  };
}

function entradaMotor(over: Partial<EntradaMensualMotor> = {}): EntradaMensualMotor {
  return {
    idEntrada: 'novedad:1',
    origen: 'novedad_mensual',
    origenId: 1,
    periodo: '2026-05',
    idPersona: 1,
    idContrato: 10,
    idConcepto: 99,
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

describe('proceso-mensual-motor.rules', () => {
  it('no calcula limpio si pre-nomina tiene bloqueo', () => {
    const r = generarCalculoPreliminarPeriodo(input({ preNomina: { ...input().preNomina, estado: 'NO_GENERABLE', codigosBloqueo: ['X'] } }), 'now');
    expect(r.estado).toBe('con_bloqueos');
    expect(r.issues.some((i) => i.codigo === 'PRE_NOMINA_BLOQUEADA')).toBe(true);
  });

  it('trabajador listo con sueldo base genera haberes imponibles', () => {
    const liq = generarCalculoPreliminarPeriodo(input(), 'now').liquidaciones[0];
    expect(liq.haberesImponibles.some((h) => h.codigo === 'SUELDO_BASE')).toBe(true);
    expect(liq.baseImponiblePrevisional).toBe(800000);
  });

  it('haber imponible recurrente suma a base imponible', () => {
    const liq = generarCalculoPreliminarPeriodo(input({ recurrentes: [recurrente({})] }), 'now').liquidaciones[0];
    expect(liq.baseImponiblePrevisional).toBe(900000);
  });

  it('haber recurrente propaga codigoLre e idConcepto del catálogo', () => {
    const liq = generarCalculoPreliminarPeriodo(
      input({ recurrentes: [recurrente({ codigoLre: '2111', idConcepto: 42 })] }),
      'now',
    ).liquidaciones[0];
    const bono = liq.haberesImponibles.find((h) => h.codigo === 'BONO');
    expect(bono?.codigoLre).toBe('2111');
    expect(bono?.idConcepto).toBe(42);
  });

  it('haber no imponible recurrente no suma a base imponible', () => {
    const liq = generarCalculoPreliminarPeriodo(input({ recurrentes: [recurrente({ imponible: false, naturalezaConcepto: 'NO_IMPONIBLE' })] }), 'now').liquidaciones[0];
    expect(liq.baseImponiblePrevisional).toBe(800000);
    expect(liq.totalHaberes).toBe(900000);
  });

  it('concepto sin clasificacion genera bloqueo', () => {
    const liq = generarCalculoPreliminarPeriodo(input({ recurrentes: [recurrente({ naturalezaConcepto: null })] }), 'now').liquidaciones[0];
    expect(liq.estado).toBe('con_bloqueos');
    expect(liq.issues.some((i) => i.codigo === 'CONCEPTO_SIN_CLASIFICACION')).toBe(true);
  });

  it('falta AFP vigente genera bloqueo', () => {
    const liq = generarCalculoPreliminarPeriodo(input({ catalogos: catalogos({ afp: [] }) }), 'now').liquidaciones[0];
    expect(liq.issues.some((i) => i.codigo === 'FALTA_AFP_VIGENTE')).toBe(true);
  });

  it('falta SIS genera bloqueo', () => {
    const liq = generarCalculoPreliminarPeriodo(input({ parametrosPeriodo: parametros({ sis: null }), catalogos: catalogos({ afp: [{ ...catalogos().afp[0], sis: null }] }) }), 'now').liquidaciones[0];
    expect(liq.issues.some((i) => i.codigo === 'FALTA_SIS')).toBe(true);
  });

  it('falta salud genera bloqueo', () => {
    const liq = generarCalculoPreliminarPeriodo(input({ trabajadores: [{ ...input().trabajadores[0], idSalud: null }] }), 'now').liquidaciones[0];
    expect(liq.issues.some((i) => i.codigo === 'FALTA_SALUD')).toBe(true);
  });

  it('SANNA faltante genera advertencia segun contrato MOTOR-01', () => {
    const liq = generarCalculoPreliminarPeriodo(input({ parametrosPeriodo: parametros({ sanna: null }) }), 'now').liquidaciones[0];
    expect(liq.issues.some((i) => i.codigo === 'SANNA_NO_DEFINIDO' && i.severidad === 'ADVERTENCIA')).toBe(true);
  });

  it('Ley 16.744 se calcula separado como cargo empleador', () => {
    const liq = generarCalculoPreliminarPeriodo(input(), 'now').liquidaciones[0];
    expect(liq.cotizacionLey16744).toBe(8000);
    expect(liq.totalDescuentos).not.toBeGreaterThan(800000);
  });

  it('SANNA 0.03 es 0,03 % (porcentaje, como se guarda y se ingresa), no 3 %', () => {
    const liq = generarCalculoPreliminarPeriodo(input({ parametrosPeriodo: parametros({ sanna: 0.03 }) }), 'now').liquidaciones[0];

    // base imponible previsional 800.000 * 0,03 % = 240 (antes: 24.000)
    expect(liq.baseImponiblePrevisional).toBe(800000);
    expect(liq.cotizacionSanna).toBe(240);
  });

  it('AFC empleador contrato indefinido: 2,4 % sobre la base AFC, como cargo empleador', () => {
    const liq = generarCalculoPreliminarPeriodo(input({
      catalogos: catalogos({
        afcParametros: [{ ...catalogos().afcParametros[0], tasaTrabajador: 0.6, tasaEmpleador: 2.4 }],
      }),
    }), 'now').liquidaciones[0];

    expect(liq.cotizacionAfcEmpleador).toBe(19200);
    // No es descuento del trabajador: el líquido no cambia por el aporte empleador.
    expect(liq.descuentosLegales.some((d) => d.codigo === 'AFC_EMPLEADOR')).toBe(false);
  });

  it('AFC empleador contrato a plazo fijo: 3 % aunque el trabajador no cotice', () => {
    const liq = generarCalculoPreliminarPeriodo(input({
      trabajadores: [{ ...input().trabajadores[0], tipoContrato: 'PLAZO_FIJO' }],
      catalogos: catalogos({
        afcParametros: [{ ...catalogos().afcParametros[0], codigoTipoContrato: 'PLAZO_FIJO', tasaTrabajador: 0, tasaEmpleador: 3 }],
      }),
    }), 'now').liquidaciones[0];

    expect(liq.cotizacionAfc).toBe(0);
    expect(liq.cotizacionAfcEmpleador).toBe(24000);
  });

  it('AFC interpreta 0.6 como 0,6% (no 60%)', () => {
    const liq = generarCalculoPreliminarPeriodo(input({
      catalogos: catalogos({
        afcParametros: [{ ...catalogos().afcParametros[0], tasaTrabajador: 0.6 }],
      }),
    }), 'now').liquidaciones[0];

    // base imponible previsional: 800.000 => 0,6% = 4.800
    expect(liq.baseImponiblePrevisional).toBe(800000);
    expect(liq.cotizacionAfc).toBe(4800);
    expect(liq.descuentosLegales.some((d) => d.codigo === 'AFC' && d.monto === 4800)).toBe(true);
  });

  it('sin datos de empresa no genera advertencia si existe tasa básica en parámetros', () => {
    const liq = generarCalculoPreliminarPeriodo(input({ empresaLey16744: null }), 'now').liquidaciones[0];
    expect(liq.cotizacionLey16744).toBeGreaterThan(0);
    expect(liq.issues.some((i) => i.codigo === 'LEY_16744_EMPRESA_INCOMPLETA')).toBe(false);
  });

  it('liquido preliminar = total haberes - descuentos trabajador', () => {
    const liq = generarCalculoPreliminarPeriodo(input(), 'now').liquidaciones[0];
    expect(liq.liquidoAPago).toBe(liq.totalHaberes - liq.totalDescuentos);
  });

  it('issues se propagan desde pre-nomina', () => {
    const pv = prevalidacion({ estado: 'CON_ADVERTENCIAS', advertencias: [{ codigo: 'MV_BORRADOR', area: 'MOVIMIENTOS_VARIABLES', severidad: 'ADVERTENCIA', texto: 'Borrador' }] });
    const r = generarCalculoPreliminarPeriodo(input({ prevalidacion: pv, preNomina: { ...input().preNomina, estado: 'GENERADA_CON_ADVERTENCIAS', codigosAdvertencia: ['MV_BORRADOR'] } }), 'now');
    expect(r.issues.some((i) => i.codigo === 'PRE_MV_BORRADOR')).toBe(true);
  });

  it('trazabilidad registra parametros usados', () => {
    const liq = generarCalculoPreliminarPeriodo(input(), 'now').liquidaciones[0];
    expect(liq.trazabilidad.some((t) => t.codigo === 'AFP_TASA_APLICADA')).toBe(true);
    expect(liq.trazabilidad.some((t) => t.codigo === 'BASE_IMPONIBLE_PREVISIONAL')).toBe(true);
  });

  it('periodo con trabajador bloqueado queda con estado con_bloqueos', () => {
    const r = generarCalculoPreliminarPeriodo(input({ trabajadores: [{ ...input().trabajadores[0], sueldoBase: null }] }), 'now');
    expect(r.estado).toBe('con_bloqueos');
  });

  it('periodo calculado sin bloqueos queda calculado_preliminar', () => {
    const r = generarCalculoPreliminarPeriodo(input(), 'now');
    expect(r.estado).toBe('calculado_preliminar');
  });

  it('gratificacion recurrente vigente se suma segun clasificacion', () => {
    const liq = generarCalculoPreliminarPeriodo(input({
      recurrentes: [recurrente({ codigoConcepto: 'GRAT', nombreConcepto: 'Gratificacion mensual', monto: 120000 })],
    }), 'now').liquidaciones[0];

    expect(liq.gratificacionLegal).toBe(120000);
    expect(liq.baseImponiblePrevisional).toBe(920000);
    expect(liq.issues.some((i) => i.codigo === 'GRATIFICACION_SIN_CONFIGURACION')).toBe(false);
  });

  it('gratificacion automatica articulo 50 aplica 25% con tope mensual si hay configuracion suficiente', () => {
    const liq = generarCalculoPreliminarPeriodo(input({
      trabajadores: [{ ...input().trabajadores[0], tipoGratificacion: 'ART_50', sueldoBase: 1200000 }],
    }), 'now').liquidaciones[0];

    expect(liq.gratificacionLegal).toBe(213354.17);
    expect(liq.haberesImponibles.some((h) => h.codigo === 'GRATIFICACION_ART_50')).toBe(true);
    expect(liq.issues.some((i) => i.codigo === 'GRATIFICACION_TOPE_APLICADO')).toBe(true);
  });

  it('gratificacion automatica sin configuracion genera advertencia y no inventa monto', () => {
    const liq = generarCalculoPreliminarPeriodo(input(), 'now').liquidaciones[0];

    expect(liq.gratificacionLegal).toBe(0);
    expect(liq.issues.some((i) => i.codigo === 'GRATIFICACION_SIN_CONFIGURACION' && i.severidad === 'ADVERTENCIA')).toBe(true);
  });

  it('tope de gratificacion queda trazado', () => {
    const liq = generarCalculoPreliminarPeriodo(input({
      trabajadores: [{ ...input().trabajadores[0], tipoGratificacion: 'ART50' }],
    }), 'now').liquidaciones[0];

    expect(liq.trazabilidad.some((t) => t.codigo === 'GRATIFICACION_ART_50_TOPE')).toBe(true);
    expect(liq.trazabilidad.some((t) => t.codigo === 'GRATIFICACION_ART_50_RESULTADO')).toBe(true);
  });

  it('impuesto unico identifica tramo correcto y calcula base por factor menos rebaja', () => {
    const liq = generarCalculoPreliminarPeriodo(input({
      parametrosPeriodo: parametros({ saludObligatoria: 0, sis: 0, sanna: 0 }),
      catalogos: catalogos({
        afp: [{ ...catalogos().afp[0], tasaObligatoria: 0, comision: 0 }],
        saludInstituciones: [{ ...catalogos().saludInstituciones[0], porcentajeCotizacion: 0 }],
        afcParametros: [{ ...catalogos().afcParametros[0], tasaTrabajador: 0 }],
        tablaImpuestoUnico: [
          { id: 1, tramo: 1, desde: 0, hasta: 500000, factor: 0, rebaja: 0, vigenciaInicio: '2026-05-01', vigenciaFin: null },
          { id: 2, tramo: 2, desde: 500001, hasta: 1000000, factor: 0.04, rebaja: 1000, vigenciaInicio: '2026-05-01', vigenciaFin: null },
        ],
      }),
    }), 'now').liquidaciones[0];

    expect(liq.baseTributable).toBe(800000);
    expect(liq.impuestoUnico).toBe(31000);
    expect(liq.trazabilidad.some((t) => t.codigo === 'IMPUESTO_UNICO_TRAMO' && t.valorResultado === 2)).toBe(true);
  });

  it('impuesto unico negativo queda en cero', () => {
    const liq = generarCalculoPreliminarPeriodo(input({
      parametrosPeriodo: parametros({ saludObligatoria: 0, sis: 0, sanna: 0 }),
      catalogos: catalogos({
        afp: [{ ...catalogos().afp[0], tasaObligatoria: 0, comision: 0 }],
        saludInstituciones: [{ ...catalogos().saludInstituciones[0], porcentajeCotizacion: 0 }],
        afcParametros: [{ ...catalogos().afcParametros[0], tasaTrabajador: 0 }],
        tablaImpuestoUnico: [{ id: 1, tramo: 1, desde: 0, hasta: 9999999, factor: 0.01, rebaja: 20000, vigenciaInicio: '2026-05-01', vigenciaFin: null }],
      }),
    }), 'now').liquidaciones[0];

    expect(liq.impuestoUnico).toBe(0);
    expect(liq.trazabilidad.some((t) => t.codigo === 'IMPUESTO_UNICO_RESULTADO')).toBe(true);
  });

  it('tabla impuesto faltante genera advertencia', () => {
    const liq = generarCalculoPreliminarPeriodo(input({ catalogos: catalogos({ tablaImpuestoUnico: [] }) }), 'now').liquidaciones[0];

    expect(liq.issues.some((i) => i.codigo === 'IMPUESTO_TABLA_NO_DISPONIBLE')).toBe(true);
  });

  it('tramo de impuesto no encontrado genera issue', () => {
    const liq = generarCalculoPreliminarPeriodo(input({
      catalogos: catalogos({ tablaImpuestoUnico: [{ id: 1, tramo: 1, desde: 1, hasta: 10, factor: 0.1, rebaja: 0, vigenciaInicio: '2026-05-01', vigenciaFin: null }] }),
    }), 'now').liquidaciones[0];

    expect(liq.issues.some((i) => i.codigo === 'IMPUESTO_TRAMO_NO_ENCONTRADO')).toBe(true);
  });

  it('si existe tope imponible limita base previsional', () => {
    const liq = generarCalculoPreliminarPeriodo(input({ parametrosPeriodo: parametros({ topeAfp: 500000 }) }), 'now').liquidaciones[0];

    expect(liq.baseImponiblePrevisional).toBe(500000);
    expect(liq.trazabilidad.some((t) => t.codigo === 'TOPE_IMPONIBLE_APLICADO')).toBe(true);
  });

  it('si no existe tope imponible genera issue sin hardcodear', () => {
    const liq = generarCalculoPreliminarPeriodo(input({ parametrosPeriodo: parametros({ topeAfp: null, topeAfpUf: null, uf: null }) }), 'now').liquidaciones[0];

    expect(liq.baseImponiblePrevisional).toBe(800000);
    expect(liq.issues.some((i) => i.codigo === 'TOPE_IMPONIBLE_NO_DISPONIBLE')).toBe(true);
  });

  it('jornada parcial <= 30 permite IMM proporcional', () => {
    const liq = generarCalculoPreliminarPeriodo(input({
      trabajadores: [{ ...input().trabajadores[0], horasSemanales: 20, sueldoBase: 300000 }],
    }), 'now').liquidaciones[0];

    expect(liq.estado).not.toBe('con_bloqueos');
    expect(liq.issues.some((i) => i.codigo === 'IMM_PROPORCIONAL_APLICADO')).toBe(true);
  });

  it('jornada > 30 exige IMM completo', () => {
    const liq = generarCalculoPreliminarPeriodo(input({
      trabajadores: [{ ...input().trabajadores[0], horasSemanales: 31, sueldoBase: 300000 }],
    }), 'now').liquidaciones[0];

    expect(liq.estado).toBe('con_bloqueos');
    expect(liq.issues.some((i) => i.codigo === 'SUELDO_BASE_BAJO_IMM')).toBe(true);
  });

  it('tramo_carga existente permite calcular monto simple por carga', () => {
    const liq = generarCalculoPreliminarPeriodo(input({
      trabajadores: [{ ...input().trabajadores[0], cargasFamiliares: 2, idTramoCarga: 1 }],
      catalogos: catalogos({ tramosCarga: [{ idTramo: 1, periodo: '2026-05', tramo: 'A', desde: 0, hasta: 1000000, valor: 22007 }] }),
    }), 'now').liquidaciones[0];

    expect(liq.asignacionFamiliar).toBe(44014);
    expect(liq.haberesNoImponibles.some((h) => h.codigo === 'ASIGNACION_FAMILIAR')).toBe(true);
  });

  it('asignacion familiar sin tramo genera issue', () => {
    const liq = generarCalculoPreliminarPeriodo(input({
      trabajadores: [{ ...input().trabajadores[0], cargasFamiliares: 1, idTramoCarga: 99 }],
    }), 'now').liquidaciones[0];

    expect(liq.asignacionFamiliar).toBe(0);
    expect(liq.issues.some((i) => i.codigo === 'ASIGNACION_FAMILIAR_SIN_TRAMO')).toBe(true);
  });

  it('regresion MOTOR-01: sueldo base simple sigue calculando liquido preliminar', () => {
    const liq = generarCalculoPreliminarPeriodo(input(), 'now').liquidaciones[0];

    expect(liq.liquidoAPago).toBeGreaterThan(0);
    expect(liq.liquidoAPago).toBe(liq.totalHaberes - liq.totalDescuentos);
  });

  it('regresion MOTOR-01: no persiste resultado fuera del objeto en memoria', () => {
    const r = generarCalculoPreliminarPeriodo(input(), 'now');

    expect(r.liquidaciones).toHaveLength(1);
    expect(r.generadoEn).toBe('now');
  });

  it('MOTOR-05: una entrada de haber imponible aumenta la base imponible (B6 corregido)', () => {
    const base = generarCalculoPreliminarPeriodo(input(), 'now').liquidaciones[0];
    const conEntradas = generarCalculoPreliminarPeriodo(input({
      entradasMensuales: [entradaMotor({ idConcepto: 99, monto: 50000, metadata: { contratoMotor: 'MOTOR-04_PREPARATORIO' } })],
    }), 'now').liquidaciones[0];

    expect(conEntradas.baseImponiblePrevisional).toBe(base.baseImponiblePrevisional + 50000);
    expect(conEntradas.haberesImponibles.some((h) => h.origen === 'entrada_mensual')).toBe(true);
    expect(conEntradas.cotizacionAfp).toBeGreaterThan(base.cotizacionAfp);
  });

  describe('gratificacion legal art. 50 (factor 4,75 y politica empresa)', () => {
    it('immGratificacion=4.75 con sueldoMinimo=539000 da tope mensual ~213354 y aplica tope', () => {
      const liq = generarCalculoPreliminarPeriodo(input({
        parametrosPeriodo: parametros({ gratificacion: true, immGratificacion: 4.75, sueldoMinimo: 539000, sueldoMinimo18a65: null }),
        trabajadores: [{ ...input().trabajadores[0], tipoGratificacion: 'LEGAL_ART_50', sueldoBase: 1200000 }],
      }), 'now').liquidaciones[0];

      expect(liq.gratificacionLegal).toBe(213354.17);
      expect(liq.issues.some((i) => i.codigo === 'GRATIFICACION_TOPE_APLICADO')).toBe(true);
    });

    it('trabajador que NO supera el tope recibe 25% de la base imponible', () => {
      const liq = generarCalculoPreliminarPeriodo(input({
        parametrosPeriodo: parametros({ gratificacion: true, immGratificacion: 4.75, sueldoMinimo: 539000, sueldoMinimo18a65: null }),
        trabajadores: [{ ...input().trabajadores[0], tipoGratificacion: 'LEGAL_ART_50', sueldoBase: 600000 }],
      }), 'now').liquidaciones[0];

      // base 600000 * 0,25 = 150000 < tope 213354,17
      expect(liq.gratificacionLegal).toBe(150000);
      expect(liq.issues.some((i) => i.codigo === 'GRATIFICACION_TOPE_APLICADO')).toBe(false);
    });

    it('el factor proviene de immGratificacion, no de un 4,75 hardcodeado', () => {
      const liq = generarCalculoPreliminarPeriodo(input({
        parametrosPeriodo: parametros({ gratificacion: true, immGratificacion: 10, sueldoMinimo: 539000, sueldoMinimo18a65: null }),
        trabajadores: [{ ...input().trabajadores[0], tipoGratificacion: 'LEGAL_ART_50', sueldoBase: 2000000 }],
      }), 'now').liquidaciones[0];

      // tope = (539000 * 10) / 12 = 449166,67 ; base 2.000.000 * 0,25 = 500.000 > tope
      expect(liq.gratificacionLegal).toBe(449166.67);
    });

    it('parametros.gratificacion=false no calcula gratificacion legal automatica', () => {
      const liq = generarCalculoPreliminarPeriodo(input({
        parametrosPeriodo: parametros({ gratificacion: false, immGratificacion: 4.75, sueldoMinimo: 539000 }),
        trabajadores: [{ ...input().trabajadores[0], tipoGratificacion: 'LEGAL_ART_50', sueldoBase: 1200000 }],
      }), 'now').liquidaciones[0];

      expect(liq.gratificacionLegal).toBe(0);
      expect(liq.issues.some((i) => i.codigo === 'GRATIFICACION_DESACTIVADA_EMPRESA')).toBe(true);
    });

    it('ausencia de sueldo minimo genera advertencia y no inventa monto', () => {
      const liq = generarCalculoPreliminarPeriodo(input({
        parametrosPeriodo: parametros({ gratificacion: true, immGratificacion: 4.75, sueldoMinimo: null, sueldoMinimo18a65: null }),
        trabajadores: [{ ...input().trabajadores[0], tipoGratificacion: 'LEGAL_ART_50', sueldoBase: 1200000 }],
      }), 'now').liquidaciones[0];

      expect(liq.gratificacionLegal).toBe(0);
      expect(liq.issues.some((i) => i.codigo === 'GRATIFICACION_SIN_CONFIGURACION' && i.severidad === 'ADVERTENCIA')).toBe(true);
    });
  });

  describe('MOTOR-05 entradas mensuales y prorrateo (B6/B7)', () => {
    it('mes completo sin entradas mensuales no prorratea ni altera base', () => {
      const liq = generarCalculoPreliminarPeriodo(input(), 'now').liquidaciones[0];

      expect(liq.baseImponiblePrevisional).toBe(800000);
      expect(liq.issues.some((i) => i.codigo === 'SUELDO_PRORRATEADO_AUSENCIA')).toBe(false);
      expect(liq.haberesImponibles.some((h) => h.origen === 'entrada_mensual')).toBe(false);
    });

    it('bono imponible suma a la base imponible', () => {
      const base = generarCalculoPreliminarPeriodo(input(), 'now').liquidaciones[0];
      const liq = generarCalculoPreliminarPeriodo(input({
        entradasMensuales: [entradaMotor({ categoria: 'haber_variable', tipoMovimiento: 'haber', monto: 50000 })],
      }), 'now').liquidaciones[0];

      expect(liq.baseImponiblePrevisional).toBe(base.baseImponiblePrevisional + 50000);
      expect(liq.haberesImponibles.some((h) => h.codigo === 'BONO' && h.monto === 50000)).toBe(true);
    });

    it('bono no imponible no afecta la base imponible pero suma a haberes', () => {
      const base = generarCalculoPreliminarPeriodo(input(), 'now').liquidaciones[0];
      const liq = generarCalculoPreliminarPeriodo(input({
        entradasMensuales: [entradaMotor({ categoria: 'haber_variable', tipoMovimiento: 'haber', monto: 40000, imponible: false })],
      }), 'now').liquidaciones[0];

      expect(liq.baseImponiblePrevisional).toBe(base.baseImponiblePrevisional);
      expect(liq.totalHaberes).toBe(base.totalHaberes + 40000);
      expect(liq.haberesNoImponibles.some((h) => h.origen === 'entrada_mensual' && h.monto === 40000)).toBe(true);
    });

    it('anticipo se descuenta del liquido sin afectar bases ni cotizaciones', () => {
      const base = generarCalculoPreliminarPeriodo(input(), 'now').liquidaciones[0];
      const liq = generarCalculoPreliminarPeriodo(input({
        entradasMensuales: [entradaMotor({ tipoEntrada: 'anticipo', categoria: 'anticipo_descuento_unico', tipoMovimiento: 'descuento', monto: 70000 })],
      }), 'now').liquidaciones[0];

      expect(liq.baseImponiblePrevisional).toBe(base.baseImponiblePrevisional);
      expect(liq.cotizacionAfp).toBe(base.cotizacionAfp);
      expect(liq.liquidoAPago).toBe(base.liquidoAPago - 70000);
      expect(liq.descuentosVoluntarios.some((d) => d.codigo === 'ANTICIPO' && d.monto === 70000)).toBe(true);
      expect(liq.issues.some((i) => i.codigo === 'ANTICIPO_DESCONTADO')).toBe(true);
    });

    it('ausencia de dias prorratea el sueldo base', () => {
      const liq = generarCalculoPreliminarPeriodo(input({
        entradasMensuales: [entradaMotor({ tipoEntrada: 'ausencia', categoria: 'ausencia_descuento_tiempo', tipoMovimiento: 'descuento', cantidad: 3, unidad: 'dias', monto: null })],
      }), 'now').liquidaciones[0];

      // 800000 * (30 - 3) / 30 = 720000
      expect(liq.baseImponiblePrevisional).toBe(720000);
      expect(liq.issues.some((i) => i.codigo === 'SUELDO_PRORRATEADO_AUSENCIA')).toBe(true);
      expect(liq.trazabilidad.some((t) => t.codigo === 'SUELDO_BASE_PRORRATEADO')).toBe(true);
    });

    it('sueldo prorrateado por media ausencia (15 dias)', () => {
      const liq = generarCalculoPreliminarPeriodo(input({
        entradasMensuales: [entradaMotor({ tipoEntrada: 'ausencia', categoria: 'ausencia_descuento_tiempo', tipoMovimiento: 'descuento', cantidad: 15, unidad: 'dias', monto: null })],
      }), 'now').liquidaciones[0];

      // 800000 * 15 / 30 = 400000
      expect(liq.baseImponiblePrevisional).toBe(400000);
    });

    it('gratificacion proporcional considera dias trabajados', () => {
      const liq = generarCalculoPreliminarPeriodo(input({
        parametrosPeriodo: parametros({ gratificacion: true, immGratificacion: 4.75, sueldoMinimo: 539000, sueldoMinimo18a65: null }),
        trabajadores: [{ ...input().trabajadores[0], gratificacionProporcional: true }],
        entradasMensuales: [entradaMotor({ tipoEntrada: 'ausencia', categoria: 'ausencia_descuento_tiempo', tipoMovimiento: 'descuento', cantidad: 6, unidad: 'dias', monto: null })],
      }), 'now').liquidaciones[0];

      // sueldo prorrateado 800000*24/30 = 640000 ; base*0,25 = 160000 ; tope prorrateado 213354,17*24/30 = 170683,34
      expect(liq.gratificacionLegal).toBe(160000);
    });

    it('horas extra imponibles suman a la base imponible', () => {
      const base = generarCalculoPreliminarPeriodo(input(), 'now').liquidaciones[0];
      const liq = generarCalculoPreliminarPeriodo(input({
        entradasMensuales: [entradaMotor({ categoria: 'tiempo_trabajado_adicional', tipoMovimiento: 'haber', cantidad: 5, unidad: 'horas', monto: 30000 })],
      }), 'now').liquidaciones[0];

      expect(liq.baseImponiblePrevisional).toBe(base.baseImponiblePrevisional + 30000);
      expect(liq.haberesImponibles.some((h) => h.codigo === 'HORA_EXTRA' && h.monto === 30000)).toBe(true);
    });

    it('combinacion bono imponible + ausencia + anticipo', () => {
      const base = generarCalculoPreliminarPeriodo(input(), 'now').liquidaciones[0];
      const liq = generarCalculoPreliminarPeriodo(input({
        entradasMensuales: [
          entradaMotor({ idEntrada: 'aus', tipoEntrada: 'ausencia', categoria: 'ausencia_descuento_tiempo', tipoMovimiento: 'descuento', cantidad: 3, unidad: 'dias', monto: null }),
          entradaMotor({ idEntrada: 'bono', categoria: 'haber_variable', tipoMovimiento: 'haber', monto: 50000 }),
          entradaMotor({ idEntrada: 'ant', tipoEntrada: 'anticipo', categoria: 'anticipo_descuento_unico', tipoMovimiento: 'descuento', monto: 70000 }),
        ],
      }), 'now').liquidaciones[0];

      // sueldo prorrateado 720000 + bono 50000 = 770000 imponible
      expect(liq.baseImponiblePrevisional).toBe(770000);
      expect(liq.haberesImponibles.some((h) => h.codigo === 'BONO' && h.monto === 50000)).toBe(true);
      expect(liq.descuentosVoluntarios.some((d) => d.codigo === 'ANTICIPO' && d.monto === 70000)).toBe(true);
      expect(liq.issues.some((i) => i.codigo === 'SUELDO_PRORRATEADO_AUSENCIA')).toBe(true);
      expect(liq.liquidoAPago).toBeLessThan(base.liquidoAPago);
    });
  });

  describe('MOTOR-06 dias trabajados por ingreso/retiro/licencia (paridad fn_calcular_dias_trabajados)', () => {
    it('mes completo (mayo 31 dias) paga base 30 sin prorratear', () => {
      const liq = generarCalculoPreliminarPeriodo(input(), 'now').liquidaciones[0];
      expect(liq.baseImponiblePrevisional).toBe(800000);
      expect(liq.issues.some((i) => i.codigo === 'SUELDO_PRORRATEADO_AUSENCIA')).toBe(false);
    });

    it('ingreso a mitad de mes prorratea el sueldo base', () => {
      const liq = generarCalculoPreliminarPeriodo(input({
        trabajadores: [{ ...input().trabajadores[0], fechaIngreso: '2026-05-16' }],
      }), 'now').liquidaciones[0];

      // 16..31 mayo = 16 dias calendario -> base 30 acotada a 16 ; 800000 * 16 / 30 = 426666,67
      expect(liq.baseImponiblePrevisional).toBe(426666.67);
      expect(liq.issues.some((i) => i.codigo === 'SUELDO_PRORRATEADO_AUSENCIA')).toBe(true);
      expect(liq.trazabilidad.some((t) => t.codigo === 'SUELDO_BASE_PRORRATEADO')).toBe(true);
    });

    it('retiro a mitad de mes prorratea el sueldo base', () => {
      const liq = generarCalculoPreliminarPeriodo(input({
        trabajadores: [{ ...input().trabajadores[0], fechaRetiro: '2026-05-15' }],
      }), 'now').liquidaciones[0];

      // 1..15 mayo = 15 dias -> 800000 * 15 / 30 = 400000
      expect(liq.baseImponiblePrevisional).toBe(400000);
      expect(liq.issues.some((i) => i.codigo === 'SUELDO_PRORRATEADO_AUSENCIA')).toBe(true);
    });

    it('ingreso despues del fin de mes deja dias trabajados en 0', () => {
      const liq = generarCalculoPreliminarPeriodo(input({
        trabajadores: [{ ...input().trabajadores[0], fechaIngreso: '2026-06-10' }],
      }), 'now').liquidaciones[0];

      expect(liq.baseImponiblePrevisional).toBe(0);
    });

    it('licencia medica parcial descuenta dias sobre base 30', () => {
      const liq = generarCalculoPreliminarPeriodo(input({
        entradasMensuales: [entradaMotor({ tipoEntrada: 'licencia', categoria: 'licencia_medica', tipoMovimiento: 'informativo', cantidad: 5, unidad: 'dias', monto: null })],
      }), 'now').liquidaciones[0];

      // 30 base - 5 licencia = 25 ; 800000 * 25 / 30 = 666666,67
      expect(liq.baseImponiblePrevisional).toBe(666666.67);
      expect(liq.issues.some((i) => i.codigo === 'SUELDO_PRORRATEADO_AUSENCIA')).toBe(true);
    });

    it('combinacion ingreso + licencia medica acota y descuenta dias', () => {
      const liq = generarCalculoPreliminarPeriodo(input({
        trabajadores: [{ ...input().trabajadores[0], fechaIngreso: '2026-05-11' }],
        entradasMensuales: [entradaMotor({ tipoEntrada: 'licencia', categoria: 'licencia_medica', tipoMovimiento: 'informativo', cantidad: 4, unidad: 'dias', monto: null })],
      }), 'now').liquidaciones[0];

      // 11..31 mayo = 21 dias calendario -> base 30 acotada a 21 ; menos 4 licencia = 17 ; 800000 * 17 / 30 = 453333,33
      expect(liq.baseImponiblePrevisional).toBe(453333.33);
    });
  });
});
