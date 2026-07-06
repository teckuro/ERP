import { describe, expect, it } from 'vitest';

import { crearNomina } from '../../nomina-mensual/models/nomina-periodo.models';
import {
  construirContextoGeneradorNomina,
  tonoEstadoNominaShell,
} from './nomina-generador-context.presenter';

describe('nomina-generador-context.presenter', () => {
  it('devuelve contexto vacío sin nómina cargada', () => {
    const ctx = construirContextoGeneradorNomina(null);
    expect(ctx.items).toHaveLength(0);
    expect(ctx.resumenLinea).toBe('');
  });

  it('expone empresa, período, estado y versión para nómina mensual', () => {
    const nomina = crearNomina({
      empresaNombre: 'Demo SpA',
      periodo: '2026-06',
      estado: 'calculada',
      evidenciaCalculo: { versionCalculo: 2, calculoVigente: true },
    });
    const ctx = construirContextoGeneradorNomina(nomina);
    expect(ctx.items.map((i) => i.id)).toEqual([
      'empresa',
      'periodo',
      'rango',
      'estado',
      'version',
    ]);
    expect(ctx.resumenLinea).toContain('Demo SpA');
    expect(ctx.resumenLinea).toContain('Calculada');
    expect(ctx.resumenLinea).toContain('v2');
  });

  it('incluye meta de rectificación cuando aplica', () => {
    const nomina = crearNomina({
      naturaleza: 'rectificacion',
      estado: 'borrador',
    });
    const ctx = construirContextoGeneradorNomina(nomina);
    expect(ctx.items.some((i) => i.id === 'meta' && i.value === 'Rectificación')).toBe(true);
  });

  it('mapea tono de chip por estado', () => {
    expect(tonoEstadoNominaShell('cerrada')).toBe('success');
    expect(tonoEstadoNominaShell('anulada')).toBe('danger');
    expect(tonoEstadoNominaShell('validada')).toBe('warning');
  });
});
