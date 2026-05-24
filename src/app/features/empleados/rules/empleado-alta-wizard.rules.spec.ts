import { describe, expect, it } from 'vitest';

import {
  calculateAltaWizardProgressPercent,
  isAltaWizardFirstStep,
  isAltaWizardLastStep,
  isAltaWizardStepInRange,
  resolveAltaWizardNextStep,
  resolveAltaWizardPreviousStep,
} from './empleado-alta-wizard.rules';

describe('empleado-alta-wizard.rules', () => {
  const sequence = [0, 1, 2, 3, 7, 9] as const;

  it('resuelve paso anterior en secuencia lineal', () => {
    expect(resolveAltaWizardPreviousStep(sequence, 7)).toBe(3);
    expect(resolveAltaWizardPreviousStep(sequence, 0)).toBeNull();
  });

  it('resuelve paso anterior cuando el paso activo fue omitido', () => {
    expect(resolveAltaWizardPreviousStep(sequence, 6)).toBe(3);
  });

  it('resuelve paso siguiente en secuencia lineal', () => {
    expect(resolveAltaWizardNextStep(sequence, 3)).toBe(7);
    expect(resolveAltaWizardNextStep(sequence, 9)).toBeNull();
  });

  it('resuelve paso siguiente cuando el paso activo fue omitido', () => {
    expect(resolveAltaWizardNextStep(sequence, 6)).toBe(7);
  });

  it('calcula bordes y progreso', () => {
    expect(isAltaWizardFirstStep(sequence, 0)).toBe(true);
    expect(isAltaWizardLastStep(sequence, 9)).toBe(true);
    expect(calculateAltaWizardProgressPercent(4, 10)).toBe(50);
    expect(isAltaWizardStepInRange(9, 10)).toBe(true);
    expect(isAltaWizardStepInRange(10, 10)).toBe(false);
  });
});
