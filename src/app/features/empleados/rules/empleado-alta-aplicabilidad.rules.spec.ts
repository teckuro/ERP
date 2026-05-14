import { describe, expect, it } from 'vitest';

import { evaluarAltaAplicabilidad, altaAplicabilidadStep } from './empleado-alta-aplicabilidad.rules';
import { TipoContrato } from '../models/empleado.model';

const baseInput = {
  relacionLaboral: 'CONTRATO' as const,
  tipoContrato: 'INDEFINIDO' as TipoContrato,
  tipoRegimenPrevisional: 'AFP' as const,
  tieneApv: false,
  tieneCondicionesEspeciales: false,
  tieneRespaldoCondiciones: false,
  esMenorEdad: false,
  esMayor65: false,
};

describe('evaluarAltaAplicabilidad', () => {
  it('marca honorarios como flujo independiente con campos laborales no aplicables', () => {
    const state = evaluarAltaAplicabilidad({
      ...baseInput,
      relacionLaboral: 'HONORARIOS',
      tipoContrato: null,
      tipoRegimenPrevisional: null,
    });

    expect(state.items.tipoTrabajador.estado).toBe('derived');
    expect(state.items.tipoContrato.estado).toBe('not_applicable');
    expect(state.items.jornadaLaboral.estado).toBe('not_applicable');
    expect(state.items.regimenPrevisional.estado).toBe('not_applicable');
    expect(state.items.resumenFinal.estado).toBe('blocked');
    expect(altaAplicabilidadStep(state, 4).estado).toBe('not_applicable');
  });

  it('mantiene contrato dependiente con tipo trabajador derivado y datos obligatorios', () => {
    const state = evaluarAltaAplicabilidad(baseInput);

    expect(state.items.tipoTrabajador.estado).toBe('derived');
    expect(state.items.tipoContrato.estado).toBe('required');
    expect(state.items.jornadaLaboral.estado).toBe('required');
    expect(state.items.saludDependiente.estado).toBe('required');
    expect(state.items.apvi.estado).toBe('optional');
  });

  it('exige fecha termino solo cuando el contrato no es indefinido', () => {
    const indefinido = evaluarAltaAplicabilidad(baseInput);
    const plazo = evaluarAltaAplicabilidad({ ...baseInput, tipoContrato: 'PLAZO_FIJO' as TipoContrato });

    expect(indefinido.items.fechaTermino.estado).toBe('not_applicable');
    expect(plazo.items.fechaTermino.estado).toBe('required');
  });

  it('deja prevision Ninguna en revisión y conecta condiciones especiales', () => {
    const state = evaluarAltaAplicabilidad({
      ...baseInput,
      tipoRegimenPrevisional: 'NINGUNA',
      tieneCondicionesEspeciales: true,
      tieneRespaldoCondiciones: false,
    });

    expect(state.items.regimenPrevisional.estado).toBe('review');
    expect(state.items.saludDependiente.estado).toBe('review');
    expect(state.items.condicionesEspeciales.estado).toBe('warning');
    expect(altaAplicabilidadStep(state, 8).estado).toBe('warning');
  });

  it('marca menor de edad como revisión de jornada y condiciones especiales', () => {
    const state = evaluarAltaAplicabilidad({
      ...baseInput,
      esMenorEdad: true,
      tieneCondicionesEspeciales: true,
      tieneRespaldoCondiciones: true,
    });

    expect(state.items.jornadaLaboral.estado).toBe('review');
    expect(state.items.seguroCesantia.estado).toBe('review');
    expect(state.items.condicionesEspeciales.estado).toBe('review');
  });
});
