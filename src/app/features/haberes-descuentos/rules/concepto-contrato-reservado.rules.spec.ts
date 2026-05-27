import { describe, expect, it } from 'vitest';

import {
  esConceptoReservadoContrato,
  esNombreDuplicaSueldoBaseContrato,
  filtrarConceptosPermitidosMovimientoManual,
  motivoConceptoReservadoContrato,
} from './concepto-contrato-reservado.rules';

describe('concepto-contrato-reservado.rules', () => {
  it('reserva SUELDO_BASE de sistema', () => {
    expect(
      esConceptoReservadoContrato({
        codigo: 'SUELDO_BASE',
        nombre: 'Sueldo base',
        esSistema: true,
      }),
    ).toBe(true);
  });

  it('bloquea concepto usuario con nombre sueldo base', () => {
    expect(
      esConceptoReservadoContrato({
        codigo: 'SB_EMPLEADO',
        nombre: 'Sueldo Base Empleado',
        esSistema: false,
      }),
    ).toBe(true);
  });

  it('permite bono usuario', () => {
    expect(
      esConceptoReservadoContrato({
        codigo: 'BONO_RESP',
        nombre: 'Bono responsabilidad',
        esSistema: false,
      }),
    ).toBe(false);
  });

  it('filtra reservados del selector manual', () => {
    const filtrados = filtrarConceptosPermitidosMovimientoManual([
      { codigo: 'BONO', nombre: 'Bono', esSistema: false },
      { codigo: 'SB', nombre: 'Sueldo base extra', esSistema: false },
    ]);
    expect(filtrados).toHaveLength(1);
    expect(filtrados[0]?.codigo).toBe('BONO');
  });

  it('expone copy RRHH', () => {
    expect(motivoConceptoReservadoContrato({
      codigo: 'SB',
      nombre: 'Sueldo base',
      esSistema: false,
    })).toContain('ficha del trabajador');
  });

  it('detecta nombre sueldo basico', () => {
    expect(esNombreDuplicaSueldoBaseContrato('Sueldo básico', false)).toBe(true);
  });
});
