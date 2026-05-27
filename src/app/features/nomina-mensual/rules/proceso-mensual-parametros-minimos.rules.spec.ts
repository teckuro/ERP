import type { ParametroGeneral, ParametrosGeneralesCatalogos } from '../../parametros-generales/models/parametro-general.model';
import { describe, expect, it } from 'vitest';

import { revisarGruposParametrosMinimos } from './proceso-mensual-parametros-minimos.rules';

describe('proceso-mensual-parametros-minimos.rules', () => {
  const filaOk = {
    periodo: '2026-05',
    uf: 38000,
    utm: 60000,
    sueldoMinimo: 500000,
    topeAfp: 100,
    topeIps: 100,
    topeCesantia: 100,
    sis: 0.0145,
  } as ParametroGeneral;

  const catalogosMin: ParametrosGeneralesCatalogos = {
    afp: [{ idAfp: 1, codigo: 'X', nombre: 'A', periodo: null, tasaObligatoria: 0.1, comision: 0, sis: 0, tasaEmpleador: 0, vigente: true, vigenciaInicio: null, vigenciaFin: null }],
    isapres: [{ idSalud: 1, codigo: 'Y', nombre: 'I', tipo: null, porcentajeCotizacion: null, periodo: null, vigente: true, vigenciaInicio: null, vigenciaFin: null }],
    saludInstituciones: [],
    tramosCarga: [],
    tramosImpuesto: [{ idTramo: 1, periodo: '2026-05', desde: 0, hasta: 1, factor: 1, rebaja: 0 }],
    tablaImpuestoUnico: [
      { id: 1, tramo: 1, desde: 0, hasta: 999999, factor: 0, rebaja: 0, vigenciaInicio: '2026-05-01', vigenciaFin: null },
    ],
    reformaPensiones: [],
    trabajosPesados: [],
    reformaPrevisional: [
      {
        idReformaPrevisionalParametro: 1,
        periodo: null,
        vigenciaInicio: '2026-01-01',
        vigenciaFin: null,
        aporteEmpleadorTotal: 0,
        cuentaCapitalizacionIndividual: 0,
        cotizacionRentabilidadProtegida: 0,
        seguroSocialSisCev: 0,
        fappSeguroSocial: 0,
        fuente: null,
      },
    ],
    ley16744Parametros: [
      {
        idLey16744Parametro: 1,
        codigo: 'L',
        periodo: '2026-05',
        cotizacionBasicaEmpleador: 0,
        descripcionTasaAdicional: null,
        fuenteFinanciamiento: null,
        fuenteOrganismos: null,
        vigente: true,
        vigenciaInicio: '2026-05-01',
        vigenciaFin: null,
      },
    ],
    organismosLey16744: [],
    ccafEntidades: [{ idCcafEntidad: 1, codigo: 'C', nombre: 'C', periodo: null, vigente: true, fuente: null }],
    apvInstituciones: [],
    apvFormasPago: [],
    afcParametros: [
      {
        idAfcParametro: 1,
        codigoTipoContrato: 'I',
        aplicaSeguro: true,
        aplicaTrabajador: true,
        tasaTrabajador: 0.006,
        tasaEmpleador: 0.002,
        periodo: null,
        vigenciaInicio: '2020-01-01',
        vigenciaFin: null,
        observacion: null,
      },
    ],
  };

  it('fila exacta con valores y catalogos -> grupos OK en nucleo', () => {
    const grupos = revisarGruposParametrosMinimos({
      periodo: '2026-05',
      fila: filaOk,
      lecturaFila: 'ok',
      catalogos: catalogosMin,
      lecturaCatalogos: 'ok',
    });
    const ids = grupos.map((g) => g.id);
    expect(ids).toContain('mensuales_uf_utm_sueldo');
    expect(grupos.find((g) => g.id === 'mensuales_uf_utm_sueldo')?.clasificacion).toBe('OK');
    expect(grupos.find((g) => g.id === 'catalogos_afp_impuesto')?.clasificacion).toBe('OK');
  });

  it('fila exacta con uf null -> mensuales PARCIAL', () => {
    const grupos = revisarGruposParametrosMinimos({
      periodo: '2026-05',
      fila: { ...filaOk, uf: null },
      lecturaFila: 'ok',
      catalogos: catalogosMin,
      lecturaCatalogos: 'ok',
    });
    expect(grupos.find((g) => g.id === 'mensuales_uf_utm_sueldo')?.clasificacion).toBe('PARCIAL');
  });

  it('sin fila -> mensuales y topes FALTANTE', () => {
    const grupos = revisarGruposParametrosMinimos({
      periodo: '2026-05',
      fila: null,
      lecturaFila: 'ok',
      catalogos: null,
      lecturaCatalogos: 'omitido',
    });
    expect(grupos.find((g) => g.id === 'mensuales_uf_utm_sueldo')?.clasificacion).toBe('FALTANTE');
  });

  it('lectura catalogos error -> catalogos PENDIENTE_INTEGRACION', () => {
    const grupos = revisarGruposParametrosMinimos({
      periodo: '2026-05',
      fila: filaOk,
      lecturaFila: 'ok',
      catalogos: null,
      lecturaCatalogos: 'error',
      errorCatalogos: 'timeout',
    });
    expect(grupos.find((g) => g.id === 'catalogos_afp_impuesto')?.clasificacion).toBe('PENDIENTE_INTEGRACION');
  });
});
