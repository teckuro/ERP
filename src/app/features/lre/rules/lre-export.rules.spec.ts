import { construirBorradorLre, generarCsvLre, puedeDescargarLre } from './lre-export.rules';

describe('lre-export.rules', () => {
  it('construye borrador con codigo_lre', () => {
    const borrador = construirBorradorLre({
      periodo: '2026-06',
      empresaNombre: 'Demo',
      idLiquidacionPeriodo: 1,
      versionLiquidacion: 1,
      trabajadores: [
        {
          trabajador: {
            idLiquidacionTrabajador: 1,
            rut: '11.111.111-1',
            nombreTrabajador: 'Ana',
          } as never,
          conceptos: [
            { codigoLre: '1101', nombre: 'Sueldo', monto: 100, tipo: 'haber' } as never,
            { codigoLre: null, nombre: 'Sin código', monto: 50, tipo: 'haber' } as never,
          ],
        },
      ],
    });
    expect(borrador.lineas).toHaveLength(1);
    expect(borrador.conceptosSinCodigoLre).toBe(1);
    expect(borrador.listoParaEnvio).toBe(false);
    expect(puedeDescargarLre(borrador)).toBe(true);
    expect(generarCsvLre(borrador)).toContain('1101');
  });
});
