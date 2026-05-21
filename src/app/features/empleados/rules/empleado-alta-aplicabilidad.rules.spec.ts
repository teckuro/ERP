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
    const estado = evaluarAltaAplicabilidad({
      ...baseInput,
      relacionLaboral: 'HONORARIOS',
      tipoContrato: null,
      tipoRegimenPrevisional: null,
    });

    expect(estado.campos.tipoTrabajador.estado).toBe('derived');
    expect(estado.campos.tipoContrato.estado).toBe('not_applicable');
    expect(estado.campos.jornadaLaboral.estado).toBe('not_applicable');
    expect(estado.campos.regimenPrevisional.estado).toBe('not_applicable');
    expect(estado.campos.resumenFinal.estado).toBe('blocked');
    expect(altaAplicabilidadStep(estado, 4).estado).toBe('not_applicable');
  });

  it('mantiene contrato dependiente con tipo trabajador derivado y datos obligatorios', () => {
    const estado = evaluarAltaAplicabilidad(baseInput);

    expect(estado.campos.tipoTrabajador.estado).toBe('derived');
    expect(estado.campos.tipoContrato.estado).toBe('required');
    expect(estado.campos.jornadaLaboral.estado).toBe('required');
    expect(estado.campos.saludDependiente.estado).toBe('required');
    expect(estado.campos.apvi.estado).toBe('optional');
  });

  it('exige fecha termino solo cuando el contrato no es indefinido', () => {
    const indefinido = evaluarAltaAplicabilidad(baseInput);
    const plazo = evaluarAltaAplicabilidad({ ...baseInput, tipoContrato: 'PLAZO_FIJO' as TipoContrato });

    expect(indefinido.campos.fechaTermino.estado).toBe('not_applicable');
    expect(plazo.campos.fechaTermino.estado).toBe('required');
  });

  it('deja prevision Ninguna en revisión y conecta condiciones especiales', () => {
    const estado = evaluarAltaAplicabilidad({
      ...baseInput,
      tipoRegimenPrevisional: 'NINGUNA',
      tieneCondicionesEspeciales: true,
      tieneRespaldoCondiciones: false,
    });

    expect(estado.campos.regimenPrevisional.estado).toBe('review');
    expect(estado.campos.saludDependiente.estado).toBe('review');
    expect(estado.campos.condicionesEspeciales.estado).toBe('warning');
    expect(altaAplicabilidadStep(estado, 8).estado).toBe('warning');
  });

  it('marca menor de edad como revisión de jornada y condiciones especiales', () => {
    const estado = evaluarAltaAplicabilidad({
      ...baseInput,
      esMenorEdad: true,
      tieneCondicionesEspeciales: true,
      tieneRespaldoCondiciones: true,
    });

    expect(estado.campos.jornadaLaboral.estado).toBe('review');
    expect(estado.campos.seguroCesantia.estado).toBe('review');
    expect(estado.campos.condicionesEspeciales.estado).toBe('review');
  });
});
