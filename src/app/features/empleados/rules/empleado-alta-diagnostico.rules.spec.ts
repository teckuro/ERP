import { describe, expect, it } from 'vitest';
import {
  diagnosticoItemDesdeFaltanteAlta,
  mapDiagnosticoItemsToEvaluatedRules,
  evaluacionCompletitudDesdeDiagnostico,
  wizardStepDesdeFaltanteAlta,
} from './empleado-alta-diagnostico.rules';
import { evaluarDiagnosticoFichaEmpleado } from './empleado-diagnostico.rules';
import { wizardStepDesdeClaveTab } from '../models/ficha-empleado-tabs.config';
import type { EmpleadoFichaValidacionItem } from './empleado-diagnostico.rules';

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

  it('wizardStepDesdeClaveTab prioriza el paso mas bajo con pendientes en el bloque', () => {
    const items: EmpleadoFichaValidacionItem[] = [
      {
        id: 'alta.avanzada',
        seccion: 'alta',
        tabFicha: 'general',
        formTab: 'datosPersonales',
        wizardStep: 9,
        severity: 'error',
        blocking: true,
        label: 'Resumen',
        detalle: 'Continua el alta',
        controlPath: 'datosPersonales.rut',
        complete: false,
        visible: true,
      },
      {
        id: 'personal.identity',
        seccion: 'identidad',
        tabFicha: 'general',
        formTab: 'datosPersonales',
        wizardStep: 0,
        severity: 'error',
        blocking: true,
        label: 'RUT',
        detalle: 'Ingresa un RUT valido antes de activar la ficha.',
        controlPath: 'datosPersonales.rut',
        complete: false,
        visible: true,
      },
    ];
    expect(wizardStepDesdeClaveTab('general', items)).toBe(0);
    const faltante = {
      claveBloque: 'general' as const,
      etiquetaBloque: 'General',
      mensaje: 'Ingresa un RUT valido antes de activar la ficha.',
      severidad: 'critico' as const,
    };
    expect(wizardStepDesdeFaltanteAlta(faltante, items)).toBe(0);
    expect(diagnosticoItemDesdeFaltanteAlta(faltante, items)?.controlPath).toBe(
      'datosPersonales.rut',
    );
  });
});
