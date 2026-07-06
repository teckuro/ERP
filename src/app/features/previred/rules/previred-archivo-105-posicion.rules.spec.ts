import { describe, expect, it } from 'vitest';
import {
  PREVIRED_105_LONGITUD_LINEA,
  construirRegistro105Minimo,
  descomponerRutPrevired,
  formatearCampoAlfanumericoPrevired105,
  formatearCampoNumericoPrevired105,
  formatearCampoTasaPrevired105,
  generarArchivoPrevired105,
  generarLineaPrevired105,
  periodoErpAPrevired105,
  validarDefinicionCamposPrevired105,
  validarLongitudLineaPrevired105,
} from './previred-archivo-105-posicion.rules';

describe('previred-archivo-105-posicion.rules', () => {
  it('valida tabla de 105 campos y longitud 861', () => {
    expect(validarDefinicionCamposPrevired105()).toBe(true);
  });

  it('formatea numéricos y alfanuméricos según PDF', () => {
    expect(formatearCampoNumericoPrevired105(500_000, 8)).toBe('00500000');
    expect(formatearCampoAlfanumericoPrevired105('Ana', 30)).toBe('Ana                           ');
    expect(formatearCampoTasaPrevired105(4.11, 5)).toBe('04,11');
  });

  it('convierte período ERP a mmaaaa', () => {
    expect(periodoErpAPrevired105('2026-08')).toBe('082026');
  });

  it('descompone RUT chileno', () => {
    expect(descomponerRutPrevired('11.111.111-1')).toEqual({ rut: '11111111', dv: '1' });
  });

  it('genera línea de 861 caracteres con campos reforma', () => {
    const registro = construirRegistro105Minimo({
      rut: '11111111',
      dv: '1',
      apellidoPaterno: 'Pérez',
      apellidoMaterno: 'López',
      nombres: 'Ana',
      sexo: 'F',
      periodo: '2026-08',
      diasTrabajados: 30,
      tipoJornada: 1,
      codigoAfp: '33',
      rentaImponibleAfp: 1_500_000,
      cotizacionObligatoriaAfp: 165_000,
      cotizacionSis: 27_000,
      cotizacionExpectativaVida: 13_500,
    });

    const linea = generarLineaPrevired105(registro);
    expect(linea.longitud).toBe(PREVIRED_105_LONGITUD_LINEA);
    expect(validarLongitudLineaPrevired105(linea.contenido)).toBe(true);
    expect(linea.contenido.slice(174, 182)).toBe('01500000');
    expect(linea.contenido.slice(182, 190)).toBe('00165000');
    expect(linea.contenido.slice(748, 756)).toBe('00000001');
    expect(linea.contenido.slice(756, 764)).toBe('00013500');
  });

  it('genera archivo multilínea CRLF', () => {
    const archivo = generarArchivoPrevired105({
      periodo: '2026-08',
      registros: [
        construirRegistro105Minimo({
          rut: '11111111',
          dv: '1',
          apellidoPaterno: 'Pérez',
          nombres: 'Ana',
          sexo: 'F',
          periodo: '2026-08',
          diasTrabajados: 30,
        }),
      ],
    });
    expect(archivo.lineas).toHaveLength(1);
    expect(archivo.contenido.endsWith('\r\n')).toBe(true);
  });
});
