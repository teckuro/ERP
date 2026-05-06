import type {
  ParametroGeneral,
  ParametrosGeneralesCatalogos,
  ParametrosGeneralesClienteConfig,
  PeriodoRemuneracionEstadoInfo,
} from '../models/parametro-general.model';

import { evaluarCompletitudParametrosMensual } from './parametros-completitud.rules';

describe('parametros-completitud.rules', () => {
  const periodo = '2026-05';

  it('marca cerrado solo cuando oficiales, configuracion, vigencias y consistencia estan completos', () => {
    const resultado = evaluarCompletitudParametrosMensual({
      periodo,
      periodoRemuneracion: periodoInfo('cerrado'),
      oficial: parametroOficial(),
      clienteConfig: clienteConfig(),
      catalogos: catalogosCompletos(),
    });

    expect(resultado.estadoCalculado).toBe('cerrado');
    expect(resultado.porcentaje).toBe(100);
    expect(resultado.pendientes).toEqual([]);
    expect(resultado.diferencias).toEqual([]);
  });

  it('queda parcial si existen datos oficiales pero falta configuracion cliente', () => {
    const resultado = evaluarCompletitudParametrosMensual({
      periodo,
      periodoRemuneracion: periodoInfo('cargado'),
      oficial: parametroOficial(),
      clienteConfig: null,
      catalogos: catalogosCompletos(),
    });

    expect(resultado.estadoCalculado).toBe('parcial');
    expect(resultado.grupos.configuracionCliente.completo).toBe(false);
    expect(resultado.pendientes).toContain('Falta configuracion cliente del periodo.');
  });

  it('queda pendiente si no hay datos oficiales mensuales aunque exista configuracion cliente', () => {
    const resultado = evaluarCompletitudParametrosMensual({
      periodo,
      periodoRemuneracion: periodoInfo('parcial'),
      oficial: null,
      clienteConfig: clienteConfig(),
      catalogos: catalogosCompletos(),
    });

    expect(resultado.estadoCalculado).toBe('pendiente');
    expect(resultado.grupos.oficialesMensuales.completo).toBe(false);
    expect(resultado.pendientes).toContain('Faltan datos oficiales mensuales del periodo.');
  });

  it('valida trabajo pesado por solape de vigencia y no por fila mensual exacta', () => {
    const catalogos = catalogosCompletos();
    catalogos.trabajosPesados = [
      {
        ...catalogos.trabajosPesados[0],
        periodo: '2026-04',
        vigenciaInicio: '2026-04-15',
        vigenciaFin: '2026-06-30',
      },
    ];

    const resultado = evaluarCompletitudParametrosMensual({
      periodo,
      periodoRemuneracion: periodoInfo('cargado'),
      oficial: parametroOficial(),
      clienteConfig: clienteConfig(),
      catalogos,
    });

    expect(resultado.grupos.vigencias.completo).toBe(true);
    expect(resultado.pendientes).not.toContain('Falta vigencia aplicable de trabajo pesado.');
  });

  it('queda parcial si no existe vigencia aplicable de trabajo pesado', () => {
    const catalogos = catalogosCompletos();
    catalogos.trabajosPesados = [
      {
        ...catalogos.trabajosPesados[0],
        vigenciaInicio: '2026-01-01',
        vigenciaFin: '2026-04-30',
      },
    ];

    const resultado = evaluarCompletitudParametrosMensual({
      periodo,
      periodoRemuneracion: periodoInfo('cargado'),
      oficial: parametroOficial(),
      clienteConfig: clienteConfig(),
      catalogos,
    });

    expect(resultado.estadoCalculado).toBe('parcial');
    expect(resultado.grupos.vigencias.completo).toBe(false);
    expect(resultado.pendientes).toContain('Falta vigencia aplicable de trabajo pesado.');
  });

  it('detecta diferencias oficial cliente y no marca cerrado', () => {
    const resultado = evaluarCompletitudParametrosMensual({
      periodo,
      periodoRemuneracion: periodoInfo('cerrado'),
      oficial: parametroOficial(),
      clienteConfig: clienteConfig({ uf: 40000 }),
      catalogos: catalogosCompletos(),
    });

    expect(resultado.estadoCalculado).toBe('cargado');
    expect(resultado.grupos.consistencia.completo).toBe(false);
    expect(resultado.diferencias).toEqual([
      { campo: 'uf', oficial: 38000, cliente: 40000 },
    ]);
    expect(resultado.advertencias).toContain(
      'Existen diferencias pendientes entre valores oficiales y configuracion cliente.',
    );
  });

  it('prioriza estado error ante falla tecnica o error de carga', () => {
    const resultado = evaluarCompletitudParametrosMensual({
      periodo,
      periodoRemuneracion: periodoInfo('cargado'),
      oficial: parametroOficial(),
      clienteConfig: clienteConfig(),
      catalogos: catalogosCompletos(),
      errorTecnico: true,
    });

    expect(resultado.estadoCalculado).toBe('error');
    expect(resultado.grupos.tecnico.completo).toBe(false);
    expect(resultado.errores).toContain('Existe una falla tecnica o error de carga asociado al periodo.');
  });
});

function periodoInfo(estado: PeriodoRemuneracionEstadoInfo['estado']): PeriodoRemuneracionEstadoInfo {
  return {
    codigo: '2026-05',
    estado,
    fechaInicio: '2026-05-01',
    fechaFin: '2026-05-31',
  };
}

function parametroOficial(overrides: Partial<ParametroGeneral> = {}): ParametroGeneral {
  return {
    periodo: '2026-05',
    uf: 38000,
    utm: 69000,
    uta: 828000,
    sueldoMinimo: 529000,
    sueldoMinimo18a65: 529000,
    sueldoMinimoMenor18Mayor65: 394622,
    sueldoMinimoCasaParticular: 529000,
    ingresoMinimoNoRemuneracional: 340988,
    topeAfpUf: 87.8,
    topeAfp: 3336400,
    topeIpsUf: 60,
    topeIps: 2280000,
    topeCesantiaUf: 131.9,
    topeCesantia: 5012200,
    topeApvMensualUf: 50,
    topeApvMensual: 1900000,
    topeApvAnualUf: 600,
    topeApvAnual: 22800000,
    topeDepositoConvenidoAnualUf: 900,
    topeDepositoConvenidoAnual: 34200000,
    topeAfpVoluntario: 1900000,
    sis: 1.49,
    sanna: 0.03,
    seguroSocialExpectativaVida: 0.1,
    aporteEmpleadorAfp: 1,
    saludObligatoria: 7,
    saludCcaf: 0.6,
    saludFonasaConCcaf: 6.4,
    descuentosBasePorDia: false,
    afcTrabajadorIndefinido: 0.6,
    afcEmpleadorIndefinido: 2.4,
    afcEmpleadorPlazo: 3,
    afcEmpleadorIndefinidoOnceAnosMas: 0.8,
    afcEmpleadorCasaParticular: 3,
    trabajoPesadoEmpleador: 2,
    trabajoPesadoTrabajador: 2,
    trabajoMenosPesadoEmpleador: 1,
    trabajoMenosPesadoTrabajador: 1,
    gratificacion: true,
    immGratificacion: 4.75,
    fechaActualizacion: '2026-05-01T00:00:00',
    ...overrides,
  };
}

function clienteConfig(
  overrides: Partial<ParametrosGeneralesClienteConfig> = {},
): ParametrosGeneralesClienteConfig {
  const base = parametroOficial();
  return {
    ...base,
    periodo: '2026-05',
    descuentosBasePorDia: false,
    gratificacion: true,
    immGratificacion: 4.75,
    idCcafEntidad: 1,
    idOrganismoAdministradorLey16744: 1,
    fechaActualizacion: '2026-05-01T00:00:00',
    ...overrides,
  };
}

function catalogosCompletos(): ParametrosGeneralesCatalogos {
  return {
    afp: [
      {
        idAfp: 1,
        codigo: 'HABITAT',
        nombre: 'AFP Habitat',
        periodo: null,
        tasaObligatoria: 10,
        comision: 1.27,
        sis: 1.49,
        tasaEmpleador: 0,
        vigente: true,
        vigenciaInicio: '2026-01-01',
        vigenciaFin: null,
      },
    ],
    isapres: [
      {
        idSalud: 1,
        codigo: 'FONASA',
        nombre: 'Fonasa',
        tipo: 'FONASA',
        porcentajeCotizacion: 7,
        periodo: null,
        vigente: true,
        vigenciaInicio: '2026-01-01',
        vigenciaFin: null,
      },
    ],
    saludInstituciones: [],
    tramosCarga: [{ idTramo: 1, periodo: '2026-05', tramo: 'A', desde: 0, hasta: 100, valor: 1000 }],
    tramosImpuesto: [{ idTramo: 1, periodo: '2026-05', desde: 0, hasta: 100, factor: 0, rebaja: 0 }],
    tablaImpuestoUnico: [
      { id: 1, tramo: 1, desde: 0, hasta: 100, factor: 0, rebaja: 0, vigenciaInicio: '2026-05-01', vigenciaFin: null },
    ],
    reformaPensiones: [
      {
        idParametro: 1,
        nombre: 'seguro_social',
        valorDecimal: 0.1,
        valorEntero: null,
        periodo: null,
        vigenciaInicio: '2026-01-01',
        vigenciaFin: null,
      },
    ],
    trabajosPesados: [
      {
        idTrabajoPesadoParametro: 1,
        codigo: 'TP',
        periodo: '2026-05',
        nombre: 'Trabajo pesado',
        tasaTrabajador: 2,
        tasaEmpleador: 2,
        tasaTotal: 4,
        requiereDictamenCen: true,
        fuente: null,
        vigente: true,
        vigenciaInicio: '2026-05-01',
        vigenciaFin: null,
      },
    ],
    reformaPrevisional: [
      {
        idReformaPrevisionalParametro: 1,
        periodo: null,
        vigenciaInicio: '2026-01-01',
        vigenciaFin: null,
        aporteEmpleadorTotal: 1,
        cuentaCapitalizacionIndividual: 0.1,
        cotizacionRentabilidadProtegida: 0.1,
        seguroSocialSisCev: 0.1,
        fappSeguroSocial: 0.1,
        fuente: null,
      },
    ],
    ley16744Parametros: [
      {
        idLey16744Parametro: 1,
        codigo: 'BASE',
        periodo: '2026-05',
        cotizacionBasicaEmpleador: 0.93,
        descripcionTasaAdicional: null,
        fuenteFinanciamiento: null,
        fuenteOrganismos: null,
        vigente: true,
        vigenciaInicio: '2026-05-01',
        vigenciaFin: null,
      },
    ],
    organismosLey16744: [
      {
        idOrganismoAdministradorLey16744: 1,
        codigo: 'MUTUAL',
        nombre: 'Mutual',
        tipo: 'mutual',
        vigente: true,
        periodo: null,
      },
    ],
    ccafEntidades: [
      {
        idCcafEntidad: 1,
        codigo: 'CCAF',
        nombre: 'CCAF',
        vigente: true,
        fuente: null,
        periodo: null,
      },
    ],
    apvInstituciones: [],
    apvFormasPago: [],
    afcParametros: [
      {
        idAfcParametro: 1,
        codigoTipoContrato: 'indefinido',
        aplicaSeguro: true,
        aplicaTrabajador: true,
        tasaTrabajador: 0.6,
        tasaEmpleador: 2.4,
        periodo: null,
        vigenciaInicio: '2026-01-01',
        vigenciaFin: null,
        observacion: null,
      },
    ],
  };
}
