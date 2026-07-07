import { describe, expect, it } from 'vitest';

import type { PreviredArchivo105Resumen, PreviredBorradorExport } from '../models/previred-export.model';
import {
  mensajeModalPreviredExportacion,
  seccionesDetalleConceptosObservacion,
  seccionesModalPreviredExportacion,
  tituloModalPreviredExportacion,
} from './previred-exportacion-modal.presenter';

function borrador(overrides: Partial<PreviredBorradorExport> = {}): PreviredBorradorExport {
  return {
    periodo: '2026-07',
    empresaNombre: 'Empresa QA',
    idNominaPeriodo: 'nom-1',
    idLiquidacionPeriodo: 1,
    versionLiquidacion: 1,
    totalTrabajadores: 3,
    lineas: Array.from({ length: 16 }, (_, index) => ({
      rut: '1-9',
      nombreTrabajador: 'Test',
      codigoMovimiento: 'HAB',
      glosa: 'Haber',
      monto: 1000,
      tipo: 'haber',
      origenMapeo: 'catalogo_previred',
    })),
    advertencias: [],
    conceptosObservacion: [
      {
        nombreTrabajador: 'Test',
        rut: '1-9',
        nombreConcepto: 'Bono',
        codigoConcepto: 'BONO',
        codigoLre: null,
        monto: 50_000,
        tipo: 'sin_codigo_previred',
        motivo: 'Sin código LRE en la liquidación.',
      },
    ],
    lineasOmitidas: 0,
    conceptosSinCodigo: 1,
    conceptosSinMapeoCatalogo: 0,
    listoParaEnvio: true,
    ...overrides,
  };
}

function archivo105(overrides: Partial<PreviredArchivo105Resumen> = {}): PreviredArchivo105Resumen {
  return {
    formato: '105_posicion',
    periodo: '2026-07',
    contenido: '',
    totalTrabajadores: 3,
    totalLineas: 3,
    listoParaEnvio105: true,
    conceptosSinCampoArchivo: 0,
    trabajadoresSinDatos: 0,
    advertencias: [],
    ...overrides,
  };
}

describe('previred-exportacion-modal.presenter', () => {
  it('agrupa archivo y observaciones en secciones apiladas (no mezcla borrador interno)', () => {
    const secciones = seccionesModalPreviredExportacion({
      borrador: borrador(),
      archivo105: archivo105(),
      errorCarga: null,
      avisoFaseBd: null,
      feedbackDescarga: null,
      bloqueos: [],
      revisiones: [
        {
          nivel: 'revision',
          mensaje: '1 concepto con monto no tiene código Previred y no se incluirá en el archivo.',
        },
      ],
      puedeDescargar: true,
      tieneBloqueo: false,
    });

    expect(secciones).toHaveLength(2);
    expect(secciones[0].title).toBe('Archivo para Previred');
    expect(secciones[0].text).toContain('3 trabajadores incluidos');
    expect(secciones[0].items?.some((item) => item.includes('Período 07/2026'))).toBe(true);
    expect(secciones[1].title).toBe('Observación');
    expect(secciones[1].text).toContain('Ver conceptos afectados');
    expect(secciones[0].items?.some((item) => item.includes('movimiento'))).toBe(false);
  });

  it('detalle lista concepto con trabajador, nombre y monto', () => {
    const secciones = seccionesDetalleConceptosObservacion([
      {
        nombreTrabajador: 'Ana Pérez',
        rut: '11.111.111-1',
        nombreConcepto: 'Bono sin código',
        codigoConcepto: 'BONO',
        codigoLre: null,
        monto: 50_000,
        tipo: 'sin_codigo_previred',
        motivo: 'Sin código LRE en la liquidación.',
      },
    ]);

    expect(secciones[0].items?.[0]).toContain('Ana Pérez');
    expect(secciones[0].items?.[0]).toContain('Bono sin código');
    expect(secciones[0].items?.[0]).toContain('BONO');
  });

  it('bloqueo muestra incompletos y acción recomendada', () => {
    const secciones = seccionesModalPreviredExportacion({
      borrador: borrador(),
      archivo105: archivo105({ trabajadoresSinDatos: 1, totalTrabajadores: 2, listoParaEnvio105: false }),
      errorCarga: null,
      avisoFaseBd: null,
      feedbackDescarga: null,
      bloqueos: [{ nivel: 'bloqueo', mensaje: 'Ana Pérez: falta sexo registral en ficha.' }],
      revisiones: [],
      puedeDescargar: false,
      tieneBloqueo: true,
    });

    expect(secciones[0].title).toBe('Trabajador incompleto');
    expect(secciones[1].title).toBe('Acción recomendada');
  });

  it('mensaje listo con observaciones distingue descarga de revisión', () => {
    const mensaje = mensajeModalPreviredExportacion({
      errorCarga: null,
      tieneBloqueo: false,
      puedeDescargar: true,
      borrador: borrador(),
      archivo105: archivo105(),
      revisiones: [{ nivel: 'revision', mensaje: 'Observación' }],
    });

    expect(mensaje).toContain('Revise las observaciones');
  });

  it('título refleja bloqueo', () => {
    expect(
      tituloModalPreviredExportacion({ errorCarga: null, tieneBloqueo: true, puedeDescargar: false }),
    ).toBe('Exportación bloqueada');
  });
});
