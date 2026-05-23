import { describe, expect, it } from 'vitest';
import { mapDiagnosticoItemsToEvaluatedRules, evaluacionCompletitudDesdeDiagnostico } from './empleado-alta-diagnostico.rules';
import { evaluarDiagnosticoFichaEmpleado } from './empleado-diagnostico.rules';
import { wizardStepDesdeClaveTab } from '../models/ficha-empleado-tabs.config';

describe('empleado-alta-diagnostico.rules', () => {
  it('mapea items del kernel a reglas evaluadas del wizard', () => {
    const diagnostico = evaluarDiagnosticoFichaEmpleado({
      origenCreacion: 'avanzado',
      pasoAltaAvanzada: 0,
      rut: '',
      nombres: '',
      apellidoPaterno: '',
    } as never);
    const rules = mapDiagnosticoItemsToEvaluatedRules(diagnostico);
    expect(Array.isArray(rules)).toBe(true);
  });

  it('evaluacion completitud coherente con diagnostico', () => {
    const diagnostico = { aptoParaRemuneraciones: false, bloqueos: [], advertencias: [], items: [], pendientes: [] };
    const evaluacion = evaluacionCompletitudDesdeDiagnostico(diagnostico as never);
    expect(evaluacion.estadoFicha).toBe('INCOMPLETO');
  });

  it('wizardStepDesdeClaveTab usa fallback', () => {
    expect(wizardStepDesdeClaveTab('pago', [])).toBe(7);
  });
});
