/**
 * Casos numéricos del motor preliminar (sin BD).
 * Antes de pruebas manuales en un período, limpiar snapshots:
 *   psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -v periodo=2026-05 -f bd/scripts/limpiar-nominas-mensuales.sql
 */
import type {
  HaberDescuentoAsignacionPrevalidacionMensualFila,
} from '../../haberes-descuentos/models/haber-descuento-asignacion.model';
import type { ParametroGeneral, ParametrosGeneralesCatalogos } from '../../parametros-generales/models/parametro-general.model';
import type { MotorCalculoInput, ProcesoMensualPrevalidacion } from '../models/proceso-mensual.model';

import {
  calcularTrabajador,
  generarCalculoPreliminarPeriodo,
  normalizarTasaNomina,
} from './proceso-mensual-motor.rules';

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
    afp: [{
      idAfp: 1,
      codigo: 'AFP',
      nombre: 'AFP Uno',
      periodo: '2026-05',
      tasaObligatoria: 0.1,
      comision: 0.011,
      sis: null,
      tasaEmpleador: null,
      vigente: true,
      vigenciaInicio: '2026-05-01',
      vigenciaFin: null,
    }],
    isapres: [],
    saludInstituciones: [{
      idSalud: 1,
      codigo: 'FONASA',
      nombre: 'Fonasa',
      tipo: 'FONASA',
      porcentajeCotizacion: 0.07,
      periodo: null,
      vigente: true,
      vigenciaInicio: null,
      vigenciaFin: null,
    }],
    tramosCarga: [],
    tramosImpuesto: [],
    tablaImpuestoUnico: [{
      id: 1,
      tramo: 1,
      desde: 0,
      hasta: 99999999,
      factor: 0,
      rebaja: 0,
      vigenciaInicio: '2026-05-01',
      vigenciaFin: null,
    }],
    reformaPensiones: [],
    trabajosPesados: [],
    reformaPrevisional: [],
    ley16744Parametros: [{
      idLey16744Parametro: 1,
      codigo: 'BASE',
      periodo: '2026-05',
      cotizacionBasicaEmpleador: 0.009,
      descripcionTasaAdicional: null,
      fuenteFinanciamiento: null,
      fuenteOrganismos: null,
      vigente: true,
      vigenciaInicio: '2026-05-01',
      vigenciaFin: null,
    }],
    organismosLey16744: [],
    ccafEntidades: [],
    apvInstituciones: [],
    apvFormasPago: [],
    afcParametros: [{
      idAfcParametro: 1,
      codigoTipoContrato: 'INDEFINIDO',
      aplicaSeguro: true,
      aplicaTrabajador: true,
      tasaTrabajador: 0.006,
      tasaEmpleador: 0.024,
      periodo: '2026-05',
      vigenciaInicio: '2026-05-01',
      vigenciaFin: null,
      observacion: null,
    }],
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

function motorInput(over: Partial<MotorCalculoInput> = {}): MotorCalculoInput {
  return {
    periodo: '2026-05',
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
    prevalidacion: prevalidacion(),
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

describe('normalizarTasaNomina', () => {
  it.each([
    { entrada: 0.07, esperado: 0.07, nota: 'decimal 7%' },
    { entrada: 7, esperado: 0.07, nota: 'porcentaje 7' },
    { entrada: 0.006, esperado: 0.006, nota: 'decimal 0,6%' },
    { entrada: 0.6, esperado: 0.006, nota: 'porcentaje 0,6 (AFC típico)' },
    { entrada: 0.1, esperado: 0.1, nota: 'decimal 10%' },
    { entrada: 10, esperado: 0.1, nota: 'porcentaje 10' },
    { entrada: 1.1, esperado: 0.011, nota: 'porcentaje 1,1 comisión AFP' },
    { entrada: 0.011, esperado: 0.011, nota: 'decimal 1,1%' },
    { entrada: 1.5, esperado: 0.015, nota: 'porcentaje 1,5 SIS' },
    { entrada: 0.015, esperado: 0.015, nota: 'decimal 1,5%' },
  ])('$nota: $entrada → $esperado', ({ entrada, esperado }) => {
    expect(normalizarTasaNomina(entrada)).toBeCloseTo(esperado, 8);
  });
});

describe('motor — desglose legal previsional (casos concretos)', () => {
  const base = 800_000;
  const tasaAfp = 0.1 + 0.011;
  const tasaSalud = 0.07;
  const tasaAfc = 0.006;

  function liqEstandar(over: Partial<MotorCalculoInput> = {}) {
    return generarCalculoPreliminarPeriodo(motorInput(over), '2026-05-28T12:00:00Z').liquidaciones[0];
  }

  it('escenario base 800.000: AFP, salud y AFC en montos esperados', () => {
    const liq = liqEstandar();

    expect(liq.baseImponiblePrevisional).toBe(base);
    expect(liq.cotizacionAfp).toBe(Math.round(base * tasaAfp * 100) / 100);
    expect(liq.cotizacionSalud).toBe(Math.round(base * tasaSalud * 100) / 100);
    expect(liq.cotizacionAfc).toBe(Math.round(base * tasaAfc * 100) / 100);
    expect(liq.cotizacionAfp).toBe(88_800);
    expect(liq.cotizacionSalud).toBe(56_000);
    expect(liq.cotizacionAfc).toBe(4_800);
  });

  it('escenario revisión ~1.810.002 imponible: AFC ~0,6% no millones', () => {
    const imponible = 1_810_002;
    const liq = liqEstandar({
      trabajadores: [{
        ...motorInput().trabajadores[0],
        sueldoBase: imponible,
      }],
    });

    expect(liq.baseImponiblePrevisional).toBe(imponible);
    expect(liq.cotizacionAfc).toBe(Math.round(imponible * tasaAfc * 100) / 100);
    expect(liq.cotizacionAfc).toBe(10_860.01);
    expect(liq.cotizacionAfc).toBeLessThan(20_000);
    expect(liq.descuentosLegales.find((d) => d.descripcion.includes('cesantia'))?.monto).toBe(10_860.01);
  });

  it('AFC con tasa 0.6 en catálogo coincide con tasa 0.006 decimal', () => {
    const desdeDecimal = liqEstandar({
      catalogos: catalogos({
        afcParametros: [{ ...catalogos().afcParametros[0], tasaTrabajador: 0.006 }],
      }),
    });
    const desdePorcentaje = liqEstandar({
      catalogos: catalogos({
        afcParametros: [{ ...catalogos().afcParametros[0], tasaTrabajador: 0.6 }],
      }),
    });

    expect(desdeDecimal.cotizacionAfc).toBe(desdePorcentaje.cotizacionAfc);
    expect(desdeDecimal.cotizacionAfc).toBe(4_800);
  });

  it('AFP acepta tasas en formato porcentaje (10 + 1,1)', () => {
    const liq = liqEstandar({
      catalogos: catalogos({
        afp: [{
          ...catalogos().afp[0],
          tasaObligatoria: 10,
          comision: 1.1,
        }],
      }),
    });

    expect(liq.cotizacionAfp).toBe(88_800);
  });

  it('salud acepta 7 como porcentaje y 0.07 como decimal', () => {
    const decimal = liqEstandar({
      parametrosPeriodo: parametros({ saludObligatoria: 0.07 }),
      catalogos: catalogos({
        saludInstituciones: [{ ...catalogos().saludInstituciones[0], porcentajeCotizacion: 0.07 }],
      }),
    });
    const porcentaje = liqEstandar({
      parametrosPeriodo: parametros({ saludObligatoria: 7 }),
      catalogos: catalogos({
        saludInstituciones: [{ ...catalogos().saludInstituciones[0], porcentajeCotizacion: 7 }],
      }),
    });

    expect(decimal.cotizacionSalud).toBe(56_000);
    expect(porcentaje.cotizacionSalud).toBe(56_000);
  });

  it('base tributable = haberes tributables − AFP − salud − AFC', () => {
    const liq = liqEstandar();
    const esperada = liq.totalHaberes
      - liq.cotizacionAfp
      - liq.cotizacionSalud
      - liq.cotizacionAfc;

    expect(liq.baseTributable).toBe(Math.round(esperada * 100) / 100);
    expect(liq.baseTributable).toBe(650_400);
  });

  it('líquido = haberes − descuentos legales y voluntarios', () => {
    const liq = liqEstandar({
      recurrentes: [recurrenteDescuento(50_000)],
    });

    expect(liq.totalDescuentos).toBe(
      liq.cotizacionAfp + liq.cotizacionSalud + liq.cotizacionAfc + liq.impuestoUnico + 50_000,
    );
    expect(liq.liquidoAPago).toBe(liq.totalHaberes - liq.totalDescuentos);
    expect(liq.liquidoAPago).toBe(600_400);
  });

  it('tope imponible AFP reduce cotizaciones proporcionalmente', () => {
    const liq = liqEstandar({ parametrosPeriodo: parametros({ topeAfp: 500_000 }) });

    expect(liq.baseImponiblePrevisional).toBe(500_000);
    expect(liq.cotizacionAfp).toBe(55_500);
    expect(liq.cotizacionSalud).toBe(35_000);
    expect(liq.cotizacionAfc).toBe(3_000);
  });

  it('tope cesantía limita base AFC sin inflar descuento', () => {
    const liq = liqEstandar({
      parametrosPeriodo: parametros({ topeCesantia: 500_000 }),
    });

    expect(liq.cotizacionAfc).toBe(3_000);
    expect(liq.cotizacionAfc).toBeLessThan(liq.baseImponiblePrevisional * 0.01);
  });

  it('Ley 16.744 no entra en descuentos del trabajador', () => {
    const liq = liqEstandar();

    expect(liq.cotizacionLey16744).toBe(8_000);
    const sumaDescuentosLineas = liq.descuentosLegales.reduce((a, d) => a + d.monto, 0)
      + liq.descuentosVoluntarios.reduce((a, d) => a + d.monto, 0);
    expect(liq.totalDescuentos).toBe(sumaDescuentosLineas);
    expect(liq.descuentosLegales.some((d) => d.descripcion.toLowerCase().includes('mutual'))).toBe(false);
  });

  it('haber imponible recurrente eleva base y cotizaciones', () => {
    const liq = liqEstandar({
      recurrentes: [recurrenteHaber(100_000)],
    });

    expect(liq.baseImponiblePrevisional).toBe(900_000);
    expect(liq.cotizacionAfp).toBe(99_900);
    expect(liq.cotizacionAfc).toBe(5_400);
  });

  it('calcularTrabajador aislado coincide con liquidación del período', () => {
    const input = motorInput();
    const desdePeriodo = generarCalculoPreliminarPeriodo(input, 't').liquidaciones[0];
    const desdeDirecto = calcularTrabajador({ input, trabajador: input.trabajadores[0] });

    expect(desdeDirecto.cotizacionAfc).toBe(desdePeriodo.cotizacionAfc);
    expect(desdeDirecto.liquidoAPago).toBe(desdePeriodo.liquidoAPago);
  });
});

function recurrenteHaber(monto: number): HaberDescuentoAsignacionPrevalidacionMensualFila {
  return {
    estadoVigencia: 'ACTIVA',
    intersectaPeriodo: true,
    asignacion: {
      idAsignacion: 1,
      idPersona: 1,
      idConcepto: 1,
      idContrato: 10,
      codigoConcepto: 'BONO',
      nombreConcepto: 'Bono imponible',
      tipoConcepto: 'HABER',
      naturalezaConcepto: 'IMPONIBLE',
      codigoLre: null,
      esSistemaConcepto: false,
      calculoAutomaticoConcepto: false,
      imponible: true,
      tributable: true,
      monto,
      porcentaje: null,
      tipoValor: 'FIJO',
      tipohaber: null,
      periodicidad: 'MENSUAL',
      vigenciaInicio: '2026-05-01',
      vigenciaFin: null,
      observacion: null,
      estado: true,
    },
  };
}

function recurrenteDescuento(monto: number): HaberDescuentoAsignacionPrevalidacionMensualFila {
  return {
    estadoVigencia: 'ACTIVA',
    intersectaPeriodo: true,
    asignacion: {
      idAsignacion: 2,
      idPersona: 1,
      idConcepto: 2,
      idContrato: 10,
      codigoConcepto: 'ANTICIPO',
      nombreConcepto: 'Anticipo',
      tipoConcepto: 'DESCUENTO',
      naturalezaConcepto: 'NO_IMPONIBLE',
      codigoLre: null,
      esSistemaConcepto: false,
      calculoAutomaticoConcepto: false,
      imponible: false,
      tributable: false,
      monto,
      porcentaje: null,
      tipoValor: 'FIJO',
      tipohaber: null,
      periodicidad: 'MENSUAL',
      vigenciaInicio: '2026-05-01',
      vigenciaFin: null,
      observacion: null,
      estado: true,
    },
  };
}
