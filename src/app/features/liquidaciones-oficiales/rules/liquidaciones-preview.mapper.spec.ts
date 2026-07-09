import { describe, expect, it } from 'vitest';

import {
  mapDocumentoExtrasDesdeLiquidacionOficial,
  mapLiquidacionOficialAPreview,
  mapTrabajadorMetaDesdeLiquidacionOficial,
} from './liquidaciones-preview.mapper';
import type { LiquidacionConcepto, LiquidacionTrabajador } from '../models/liquidacion-oficial.model';

describe('liquidaciones-preview.mapper', () => {
  it('clasifica conceptos materializados en secciones del preview', () => {
    const trabajador = trabajadorMock();
    const conceptos: LiquidacionConcepto[] = [
      concepto({ nombre: 'Sueldo base', tipo: 'haber', clasificacion: 'haber_imponible_tributable', monto: 900_000 }),
      concepto({ nombre: 'Colación', tipo: 'haber', clasificacion: 'haber_no_imponible', monto: 20_000 }),
      concepto({ nombre: 'Cotización AFP', tipo: 'descuento', clasificacion: 'descuento', monto: 100_000 }),
      concepto({ nombre: 'Anticipo', tipo: 'descuento', clasificacion: 'descuento', monto: 50_000 }),
      concepto({ nombre: 'SIS empleador', tipo: 'cotizacion', clasificacion: 'aporte_referencia', monto: 12_000 }),
    ];

    const preview = mapLiquidacionOficialAPreview({ trabajador, conceptos, periodo: '2026-06' });

    expect(preview.haberesImponibles).toHaveLength(1);
    expect(preview.haberesNoImponibles).toHaveLength(1);
    expect(preview.descuentosLegales).toHaveLength(1);
    expect(preview.descuentosVoluntarios).toHaveLength(1);
    expect(preview.liquidoAPago).toBe(770_000);
    expect(preview.nombreCompleto).toBe('Ana Pérez');
    expect(preview.cotizacionSis).toBe(12_000);
  });

  it('arma metadatos del trabajador desde metadata materializada', () => {
    const trabajador = trabajadorMock();
    trabajador.metadata = {
      afp: 'Cuprum',
      salud: 'Fonasa',
      tipoContrato: 'Indefinido',
      sueldoBase: 900_000,
    };
    const meta = mapTrabajadorMetaDesdeLiquidacionOficial(trabajador);
    expect(meta.afp).toBe('Cuprum');
    expect(meta.salud).toBe('Fonasa');
    expect(meta.tipoContrato).toBe('Indefinido');
    expect(meta.sueldoBase).toBe(900_000);
    expect(meta.cargo).toBe('Analista');
  });

  it('incluye tasa en descripción de conceptos cuando existe', () => {
    const trabajador = trabajadorMock();
    const conceptos: LiquidacionConcepto[] = [
      concepto({
        nombre: 'Cotización AFP',
        tipo: 'descuento',
        clasificacion: 'descuento',
        monto: 100_000,
        tasa: 11.45,
      }),
    ];

    const preview = mapLiquidacionOficialAPreview({ trabajador, conceptos, periodo: '2026-06' });

    expect(preview.descuentosLegales[0]?.descripcion).toContain('11,45%');
  });

  it('delega enriquecimiento con ficha y catálogos al mapper compartido', () => {
    const trabajador = trabajadorMock();
    trabajador.cargo = null;
    trabajador.metadata = { sueldoBase: 900_000, cotizacionAfp: 100_000 };

    const extras = mapDocumentoExtrasDesdeLiquidacionOficial({
      trabajador,
      conceptos: [
        concepto({ nombre: 'Cotizacion AFP trabajador', tipo: 'descuento', monto: 100_000 }),
      ],
      periodo: '2026-06',
      ficha: {
        id: 5,
        idContrato: 1,
        rut: '1-9',
        nombre: 'Ana Pérez',
        cargo: 'Analista',
        departamento: 'Operaciones',
        fechaIngreso: '2020-01-01',
        sueldoBase: 900_000,
        monedaContrato: 'CLP',
        estado: 'activo',
        estadoFicha: 'VALIDO',
        aptoParaRemuneraciones: true,
        pasoAltaAvanzada: null,
        historial: [],
        formValue: {
          datosPersonales: {},
          contacto: { email: 'ana@empresa.cl' },
          contrato: {
            cargo: 'Analista',
            fechaIngreso: '2020-01-01',
            tipoContrato: 'INDEFINIDO',
            cargas: 1,
          },
          perfilLaboral: {},
          previsionSalud: { idAfp: 1, idSalud: 2, tipoSalud: 'FONASA' },
          bancario: {},
        },
      },
      catalogos: {
        afp: [
          {
            idAfp: 1,
            codigo: 'CUP',
            nombre: 'Cuprum',
            periodo: '2026-06',
            tasaObligatoria: 10,
            comision: 1.44,
            sis: null,
            tasaEmpleador: null,
            vigente: true,
            vigenciaInicio: null,
            vigenciaFin: null,
          },
        ],
        isapres: [],
        saludInstituciones: [
          {
            idSalud: 2,
            codigo: 'FON',
            nombre: 'Fonasa',
            tipo: 'FONASA',
            porcentajeCotizacion: 7,
            periodo: null,
            vigente: true,
            vigenciaInicio: null,
            vigenciaFin: null,
          },
        ],
        tramosCarga: [],
        tramosImpuesto: [],
        tablaImpuestoUnico: [],
        reformaPensiones: [],
        trabajosPesados: [],
        reformaPrevisional: [],
        ley16744Parametros: [],
        organismosLey16744: [],
        ccafEntidades: [],
        apvInstituciones: [],
        apvFormasPago: [],
        afcParametros: [],
      },
    });

    expect(extras.trabajadorMeta.cargo).toBe('Analista');
    expect(extras.trabajadorMeta.email).toBe('ana@empresa.cl');
    expect(extras.trabajadorMeta.afp).toBe('Cuprum');
    expect(extras.detalle.cargas).toBe(1);
    expect(extras.numeroDocumento).toBe('S-0010-26');
  });
});

function trabajadorMock(): LiquidacionTrabajador {
  return {
    idLiquidacionTrabajador: 10,
    idPersona: 5,
    idContrato: null,
    rut: '12.345.678-9',
    nombreTrabajador: 'Ana Pérez',
    cargo: 'Analista',
    centroCosto: null,
    fechaIngreso: null,
    diasTrabajados: 30,
    baseImponible: 900_000,
    baseTributable: 800_000,
    totalHaberes: 920_000,
    totalDescuentos: 150_000,
    totalAportesEmpleadorReferencia: 12_000,
    liquidoPagar: 770_000,
    estado: 'generada',
    observaciones: [],
    metadata: { cotizacionAfp: 100_000, cotizacionSalud: 40_000 },
  };
}

function concepto(parcial: Partial<LiquidacionConcepto>): LiquidacionConcepto {
  return {
    idLiquidacionConcepto: 1,
    idLiquidacionTrabajador: 10,
    idConcepto: null,
    codigo: null,
    codigoLre: null,
    nombre: 'Concepto',
    tipo: 'haber',
    clasificacion: null,
    cantidad: null,
    base: null,
    tasa: null,
    monto: 0,
    orden: 1,
    metadata: {},
    ...parcial,
  };
}
