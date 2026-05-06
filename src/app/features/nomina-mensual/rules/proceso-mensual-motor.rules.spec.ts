import type {
  HaberDescuentoAsignacionPrevalidacionMensualFila,
} from '../../haberes-descuentos/models/haber-descuento-asignacion.model';
import type { ParametroGeneral, ParametrosGeneralesCatalogos } from '../../parametros-generales/models/parametro-general.model';
import type { MotorCalculoInput, ProcesoMensualPrevalidacion } from '../models/proceso-mensual.model';

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
    gratificacion: false,
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
    sanna: 0.0003,
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
    empresaLey16744: {
      idEmpresaLey16744: 1,
      idEmpresa: 1,
      idOrganismoAdministradorLey16744: 1,
      tasaAdicionalDiferenciada: 0.001,
      vigenciaInicio: '2026-05-01',
      vigenciaFin: null,
    },
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
});
