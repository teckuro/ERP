import {
  LRE_FORMATO_OFICIAL_DT,
  generarFormatoOficialLre,
  nombreArchivoOficialLre,
  normalizarRutLre,
} from './lre-formato-oficial.rules';
import { LRE_COLUMNAS_OFICIALES } from './lre-columnas-oficiales';
import type { LreBorradorExport } from '../models/lre-export.model';

describe('lre-formato-oficial.rules', () => {
  const borrador: LreBorradorExport = {
    periodo: '2026-06',
    empresaNombre: 'Demo',
    idNominaPeriodo: 'nom-1',
    idLiquidacionPeriodo: 10,
    versionLiquidacion: 2,
    totalTrabajadores: 1,
    conceptosSinCodigoLre: 0,
    listoParaEnvio: true,
    lineas: [
      {
        rut: '11.111.111-1',
        nombreTrabajador: 'Ana Pérez',
        codigoLre: '2101',
        nombreConcepto: 'Sueldo',
        monto: 800000,
        tipo: 'haber',
      },
      {
        rut: '11.111.111-1',
        nombreTrabajador: 'Ana Pérez',
        codigoLre: '3141',
        nombreConcepto: 'AFP',
        monto: 80000,
        tipo: 'descuento',
      },
      {
        rut: '11.111.111-1',
        nombreTrabajador: 'Ana Pérez',
        codigoLre: '3161',
        nombreConcepto: 'Impuesto',
        monto: 20000,
        tipo: 'descuento',
      },
    ],
  };

  it('genera headers oficiales y una fila por trabajador con ;', () => {
    const csv = generarFormatoOficialLre(borrador);
    const lineas = csv.split('\r\n');
    expect(LRE_FORMATO_OFICIAL_DT).toBe('LRE-OFICIAL-DT-v1');
    expect(lineas[0]).toBe(LRE_COLUMNAS_OFICIALES.join(';'));
    expect(lineas).toHaveLength(2);
    expect(lineas[0].split(';')).toHaveLength(LRE_COLUMNAS_OFICIALES.length);

    const cols = lineas[1].split(';');
    const idx = (codigo: string) => LRE_COLUMNAS_OFICIALES.indexOf(codigo);
    expect(cols[idx('1101')]).toBe('11111111-1');
    expect(cols[idx('2101')]).toBe('800000');
    expect(cols[idx('3141')]).toBe('80000');
    expect(cols[idx('3161')]).toBe('20000');
    expect(cols[idx('5210')]).toBe('800000');
    expect(cols[idx('5201')]).toBe('800000');
    expect(cols[idx('5341')]).toBe('80000');
    expect(cols[idx('5361')]).toBe('20000');
    expect(cols[idx('5301')]).toBe('100000');
    expect(cols[idx('5501')]).toBe('700000');
  });

  it('nombra el archivo rutempleador_aaaamm', () => {
    expect(nombreArchivoOficialLre('2026-06', '76.123.456-7')).toBe('76123456-7_202606.csv');
    expect(normalizarRutLre('11.111.111-1')).toBe('11111111-1');
  });
});
