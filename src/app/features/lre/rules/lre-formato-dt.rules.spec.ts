import { generarFormatoDtLre, LRE_FORMATO_DT_V1 } from './lre-formato-dt.rules';
import type { LreBorradorExport } from '../models/lre-export.model';

describe('lre-formato-dt.rules', () => {
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
        nombreTrabajador: 'Ana; Pérez',
        codigoLre: '2101',
        nombreConcepto: 'Sueldo',
        monto: 800000,
        tipo: 'haber',
      },
    ],
  };

  it('genera CSV DT con delimitador punto y coma y escape', () => {
    const csv = generarFormatoDtLre(borrador);
    expect(LRE_FORMATO_DT_V1).toBe('LRE-DT-v1');
    expect(csv).toContain('periodo;rut_trabajador;nombre_trabajador');
    expect(csv).toContain('2026-06;11.111.111-1;"Ana; Pérez";2101');
    expect(csv).toContain(';800000;2');
  });
});
