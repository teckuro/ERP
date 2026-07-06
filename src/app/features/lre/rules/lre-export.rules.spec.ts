import { construirBorradorLre, generarCsvLre, mapearTrabajadorALre, puedeDescargarLre } from './lre-export.rules';

describe('lre-export.rules', () => {
  const trabajadorBase = {
    idLiquidacionTrabajador: 1,
    rut: '11.111.111-1',
    nombreTrabajador: 'Ana Pérez',
  } as never;

  it('construye borrador con códigos LRE oficiales', () => {
    const borrador = construirBorradorLre({
      periodo: '2026-06',
      empresaNombre: 'Demo',
      idLiquidacionPeriodo: 1,
      versionLiquidacion: 1,
      trabajadores: [
        {
          trabajador: trabajadorBase,
          conceptos: [
            { codigoLre: '2101', nombre: 'Sueldo', monto: 800000, tipo: 'haber' } as never,
            { codigoLre: '3141', nombre: 'AFP', monto: 80000, tipo: 'descuento' } as never,
            { codigoLre: '3143', nombre: 'Salud', monto: 56000, tipo: 'descuento' } as never,
            { codigoLre: '3161', nombre: 'Impuesto', monto: 10000, tipo: 'impuesto' } as never,
            { codigoLre: null, nombre: 'Sin código', monto: 50, tipo: 'haber' } as never,
          ],
        },
      ],
    });

    expect(borrador.lineas).toHaveLength(4);
    expect(borrador.conceptosSinCodigoLre).toBe(1);
    expect(borrador.listoParaEnvio).toBe(false);
    expect(puedeDescargarLre(borrador)).toBe(true);
    expect(generarCsvLre(borrador)).toContain('2101');
    expect(generarCsvLre(borrador)).toContain('3141');
    expect(generarCsvLre(borrador)).not.toContain('1101');
  });

  it('omite cotizaciones de referencia empleador', () => {
    const { lineas, sinCodigo } = mapearTrabajadorALre({
      trabajador: trabajadorBase,
      conceptos: [
        { codigoLre: '2101', nombre: 'Sueldo', monto: 500000, tipo: 'haber' } as never,
        { codigoLre: '4155', nombre: 'SIS empleador', monto: 12000, tipo: 'cotizacion', clasificacion: 'aporte_referencia' } as never,
        { codigoLre: '4151', nombre: 'AFC empleador', monto: 9000, tipo: 'cotizacion' } as never,
      ],
    });

    expect(lineas).toHaveLength(1);
    expect(lineas[0].codigoLre).toBe('2101');
    expect(sinCodigo).toBe(0);
  });

  it('marca listo para envío cuando todos los conceptos exportables tienen código', () => {
    const borrador = construirBorradorLre({
      periodo: '2026-06',
      empresaNombre: 'Demo',
      idLiquidacionPeriodo: 2,
      versionLiquidacion: 1,
      trabajadores: [
        {
          trabajador: trabajadorBase,
          conceptos: [
            { codigoLre: '2101', nombre: 'Sueldo', monto: 100, tipo: 'haber' } as never,
            { codigoLre: '3141', nombre: 'AFP', monto: 10, tipo: 'descuento' } as never,
          ],
        },
      ],
    });

    expect(borrador.listoParaEnvio).toBe(true);
    expect(borrador.conceptosSinCodigoLre).toBe(0);
  });

  it('no permite descargar borrador vacío', () => {
    const borrador = construirBorradorLre({
      periodo: '2026-06',
      empresaNombre: 'Demo',
      idLiquidacionPeriodo: 3,
      versionLiquidacion: 1,
      trabajadores: [
        {
          trabajador: trabajadorBase,
          conceptos: [
            { codigoLre: null, nombre: 'Pendiente', monto: 100, tipo: 'haber' } as never,
          ],
        },
      ],
    });

    expect(borrador.lineas).toHaveLength(0);
    expect(puedeDescargarLre(borrador)).toBe(false);
  });
});
