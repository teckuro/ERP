import { describe, expect, it } from 'vitest';

import type { PasoNominaStepperView } from '../models/nomina-stepper-trazabilidad.models';
import { MENSAJE_CALCULO_NO_VIGENTE } from '../containers/nomina-mensual-v2-container/facade/nomina-mensual-v2-navegacion';
import { tooltipPasoStepper } from './nomina-stepper-trazabilidad.presenter';

function vistaBase(partial: Partial<PasoNominaStepperView> = {}): PasoNominaStepperView {
  return {
    numero: 1,
    clave: 'parameters',
    titulo: 'Parámetros',
    accion: 'Revisar',
    estado: 'pendiente',
    integridad: 'noDisponible',
    tieneTrazabilidad: false,
    ...partial,
  };
}

describe('tooltipPasoStepper', () => {
  const opts = {
    congelado: false,
    noAccesible: false,
    tooltipCongelado: () => 'Próximamente',
    tooltipNoAccesible: () => 'Completa el paso anterior',
  };

  it('prioriza bloqueo por paso no accesible', () => {
    expect(
      tooltipPasoStepper(vistaBase({ ultimoEvento: 'Parámetros validados' }), {
        ...opts,
        noAccesible: true,
      }),
    ).toBe('Completa el paso anterior');
  });

  it('expone mensaje de cálculo no vigente en advertencia', () => {
    expect(
      tooltipPasoStepper(vistaBase({ clave: 'calculation', estado: 'advertencia' }), opts),
    ).toBe(MENSAJE_CALCULO_NO_VIGENTE);
  });

  it('muestra última acción cuando hay trazabilidad', () => {
    expect(
      tooltipPasoStepper(
        vistaBase({ tieneTrazabilidad: true, ultimoEvento: 'Dotación confirmada' }),
        opts,
      ),
    ).toBe('Dotación confirmada');
  });
});
