import { describe, expect, it } from 'vitest';

import {
  plantillaNuevaToInsert,
  rowToNominaPlantillaCiclo,
  rowToPreviewCorte,
  type NominaPlantillaCicloRow,
} from './nomina-plantilla-ciclo.mapper';
import type { NominaPlantillaCicloNueva } from '../models/nomina-plantilla-ciclo.models';

const FILA_BASE: NominaPlantillaCicloRow = {
  id: 'plant-1',
  id_empresa: 7,
  codigo: 'MES',
  nombre: 'Mes calendario',
  tipo: 'mensual',
  naturaleza: 'liquidacion_legal',
  configuracion: {},
  regla_fecha_pago: { tipo: 'ultimo_dia_habil' },
  politica_fin_semana: 'adelantar',
  regla_anticipo: null,
  descripcion: 'Plantilla por defecto del mes',
  activo: true,
  version: 1,
  created_at: '2026-06-11T20:00:00.000Z',
  updated_at: '2026-06-11T20:00:00.000Z',
};

describe('rowToNominaPlantillaCiclo', () => {
  it('mapea una plantilla MES estándar con regla y política', () => {
    const plantilla = rowToNominaPlantillaCiclo({ ...FILA_BASE });
    expect(plantilla).toMatchObject({
      id: 'plant-1',
      empresaId: '7',
      codigo: 'MES',
      tipo: 'mensual',
      naturaleza: 'liquidacion_legal',
      reglaFechaPago: { tipo: 'ultimo_dia_habil' },
      politicaFinSemana: 'adelantar',
      reglaAnticipo: null,
      activo: true,
      version: 1,
    });
  });

  it('mapea una plantilla de anticipo con regla porcentaje', () => {
    const plantilla = rowToNominaPlantillaCiclo({
      ...FILA_BASE,
      codigo: 'MES-ANT-15',
      naturaleza: 'anticipo',
      regla_fecha_pago: { tipo: 'dia_fijo', dia: 15 },
      regla_anticipo: { modo: 'porcentaje', valor: 50 },
    });
    expect(plantilla.reglaFechaPago).toEqual({ tipo: 'dia_fijo', dia: 15 });
    expect(plantilla.reglaAnticipo).toEqual({ modo: 'porcentaje', valor: 50 });
  });

  it('reemplaza política inválida por adelantar (defensa contra BD)', () => {
    const plantilla = rowToNominaPlantillaCiclo({
      ...FILA_BASE,
      politica_fin_semana: 'invalida',
    });
    expect(plantilla.politicaFinSemana).toBe('adelantar');
  });

  it('lanza si la regla_fecha_pago en BD está corrupta', () => {
    expect(() =>
      rowToNominaPlantillaCiclo({
        ...FILA_BASE,
        regla_fecha_pago: { tipo: 'no_existe' },
      }),
    ).toThrow(/regla_fecha_pago inválida/);
  });

  it('lanza si la regla_anticipo es incoherente', () => {
    expect(() =>
      rowToNominaPlantillaCiclo({
        ...FILA_BASE,
        naturaleza: 'anticipo',
        regla_anticipo: { modo: 'porcentaje', valor: 200 },
      }),
    ).toThrow(/regla_anticipo inválida/);
  });
});

describe('plantillaNuevaToInsert', () => {
  it('convierte empresaId string a number y omite regla_anticipo cuando naturaleza no es anticipo', () => {
    const nueva: NominaPlantillaCicloNueva = {
      empresaId: '7',
      codigo: 'QUIN',
      nombre: 'Quincenas',
      tipo: 'quincenal',
      naturaleza: 'liquidacion_legal',
      reglaFechaPago: { tipo: 'dia_fijo', dia: 15 },
      politicaFinSemana: 'mantener',
      reglaAnticipo: { modo: 'porcentaje', valor: 50 },
    };
    const insert = plantillaNuevaToInsert(nueva);
    expect(insert.id_empresa).toBe(7);
    expect(insert.regla_anticipo).toBeNull();
    expect(insert.activo).toBe(true);
    expect(insert.version).toBe(1);
  });

  it('preserva regla_anticipo cuando la naturaleza es anticipo', () => {
    const nueva: NominaPlantillaCicloNueva = {
      empresaId: '7',
      codigo: 'MES-ANT-15',
      nombre: 'Anticipo 50%',
      tipo: 'mensual',
      naturaleza: 'anticipo',
      reglaFechaPago: { tipo: 'dia_fijo', dia: 15 },
      politicaFinSemana: 'adelantar',
      reglaAnticipo: { modo: 'porcentaje', valor: 50 },
    };
    const insert = plantillaNuevaToInsert(nueva);
    expect(insert.regla_anticipo).toEqual({ modo: 'porcentaje', valor: 50 });
  });
});

describe('rowToPreviewCorte', () => {
  it('mapea un corte con ajuste de fin de semana válido', () => {
    const corte = rowToPreviewCorte({
      numero_corte: 1,
      codigo_ciclo: '2026-01-MES',
      fecha_inicio: '2026-01-01',
      fecha_fin: '2026-01-31',
      fecha_pago_calendario: '2026-01-31',
      fecha_pago_propuesta: '2026-01-30',
      ajuste_fds: 'adelantar',
      notas: null,
    } as never);

    expect(corte).toEqual({
      numeroCorte: 1,
      codigoCiclo: '2026-01-MES',
      fechaInicio: '2026-01-01',
      fechaFin: '2026-01-31',
      fechaPagoCalendario: '2026-01-31',
      fechaPagoPropuesta: '2026-01-30',
      ajusteFds: 'adelantar',
      notas: null,
    });
  });

  it('descarta ajuste_fds inválido como null', () => {
    const corte = rowToPreviewCorte({
      numero_corte: 2,
      codigo_ciclo: '2026-02-MES',
      fecha_inicio: '2026-02-01',
      fecha_fin: '2026-02-28',
      fecha_pago_calendario: '2026-02-27',
      fecha_pago_propuesta: '2026-02-27',
      ajuste_fds: 'no-existente',
      notas: 'corte febrero',
    } as never);
    expect(corte.ajusteFds).toBeNull();
    expect(corte.notas).toBe('corte febrero');
  });
});
