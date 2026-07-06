import type { PreviredLineaExport } from '../models/previred-export.model';
import {
  calcularTotalesArchivoPrevired,
  generarArchivoOficialPrevired,
  puedeDescargarArchivoOficialPrevired,
  resumirTrabajadoresArchivoPrevired,
} from './previred-archivo-oficial.rules';
import { construirBorradorPrevired } from './previred-export.rules';

function linea(overrides: Partial<PreviredLineaExport> = {}): PreviredLineaExport {
  return {
    rut: '11.111.111-1',
    nombreTrabajador: 'Ana Pérez',
    codigoMovimiento: '2101',
    glosa: 'Sueldo',
    monto: 500_000,
    tipo: 'haber',
    origenMapeo: 'catalogo_previred',
    ...overrides,
  };
}

function borradorBase() {
  return construirBorradorPrevired({
    periodo: '2026-06',
    empresaNombre: 'Empresa Demo SpA',
    idNominaPeriodo: 'np-1',
    idLiquidacionPeriodo: 10,
    versionLiquidacion: 2,
    trabajadores: [],
    catalogoPrevired: [{ codigoLre: '1101', codigoPrevired: '2101', glosaPrevired: 'Sueldo' }],
  });
}

describe('previred-archivo-oficial.rules', () => {
  it('resume totales por trabajador', () => {
    const lineas = [
      linea(),
      linea({ codigoMovimiento: '3101', tipo: 'descuento', monto: 50_000, glosa: 'AFP' }),
      linea({ rut: '22.222.222-2', nombreTrabajador: 'Luis Gómez', monto: 300_000 }),
    ];
    const resumen = resumirTrabajadoresArchivoPrevired(lineas);
    expect(resumen).toHaveLength(2);
    expect(resumen.find((t) => t.nombreTrabajador === 'Ana Pérez')).toMatchObject({
      rut: '11111111-1',
      totalHaberes: 500_000,
      totalDescuentos: 50_000,
      cantidadMovimientos: 2,
    });
  });

  it('genera archivo PREVIRED-REM-v1 con encabezado, trabajadores, movimientos y control', () => {
    const borrador = {
      ...borradorBase(),
      lineas: [
        linea(),
        linea({ codigoMovimiento: '4101', tipo: 'descuento', monto: 40_000, glosa: 'Salud' }),
      ],
      conceptosSinCodigo: 0,
      conceptosSinMapeoCatalogo: 0,
      listoParaEnvio: true,
      totalTrabajadores: 1,
      lineasOmitidas: 0,
      advertencias: [],
    };

    const archivo = generarArchivoOficialPrevired(borrador);
    expect(archivo.formato).toBe('PREVIRED-REM-v1');
    expect(archivo.contenido).toContain('H|PREVIRED-REM-v1|2026-06|Empresa Demo SpA|2|1|2');
    expect(archivo.contenido).toContain('T|11111111-1|Ana Pérez|500000|40000|0|2');
    expect(archivo.contenido).toContain('M|11111111-1|2101|H|500000|Sueldo');
    expect(archivo.contenido).toContain('C|2|1|');
    expect(puedeDescargarArchivoOficialPrevired(borrador)).toBe(true);
  });

  it('calcula checksum de control', () => {
    const lineas = [linea({ monto: 100 }), linea({ tipo: 'descuento', monto: 20 })];
    const totales = calcularTotalesArchivoPrevired(lineas, resumirTrabajadoresArchivoPrevired(lineas));
    expect(totales.checksumMontos).toBe(120);
  });

  it('bloquea archivo oficial si no está listo para envío', () => {
    const borrador = {
      ...borradorBase(),
      lineas: [linea({ origenMapeo: 'fallback_lre' })],
      conceptosSinMapeoCatalogo: 1,
      listoParaEnvio: false,
      totalTrabajadores: 1,
      lineasOmitidas: 0,
      advertencias: [],
      conceptosSinCodigo: 0,
    };
    expect(puedeDescargarArchivoOficialPrevired(borrador)).toBe(false);
  });
});
