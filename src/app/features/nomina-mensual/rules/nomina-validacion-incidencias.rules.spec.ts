import { describe, expect, it } from 'vitest';

import type { IncidenciaNomina } from '../models/nomina-periodo.models';
import {
  advertenciaPendiente,
  construirResumenValidacionDesdeIncidencias,
  evaluarPuedeValidarNomina,
  incidenciaCriticaPendiente,
} from './nomina-validacion-incidencias.rules';

function incidencia(
  override: Partial<IncidenciaNomina> & Pick<IncidenciaNomina, 'severidad'>,
): IncidenciaNomina {
  return {
    id: 'inc-1',
    nominaPeriodoId: 'nom-1',
    tipo: 'dotacion',
    mensaje: 'Revisar',
    bloqueante: override.severidad === 'critica',
    estadoDecision: 'pendiente',
    ...override,
  };
}

describe('nomina-validacion-incidencias.rules', () => {
  it('bloquea validación con crítica pendiente', () => {
    expect(
      evaluarPuedeValidarNomina({
        estado: 'calculada',
        calculoVigente: true,
        incidencias: [incidencia({ severidad: 'critica' })],
      }),
    ).toBe(false);
    expect(incidenciaCriticaPendiente(incidencia({ severidad: 'critica' }))).toBe(true);
  });

  it('bloquea validación con advertencia pendiente', () => {
    expect(
      evaluarPuedeValidarNomina({
        estado: 'calculada',
        calculoVigente: true,
        incidencias: [incidencia({ severidad: 'advertencia' })],
      }),
    ).toBe(false);
    expect(advertenciaPendiente(incidencia({ severidad: 'advertencia' }))).toBe(true);
  });

  it('permite validación cuando decisiones están cerradas', () => {
    expect(
      evaluarPuedeValidarNomina({
        estado: 'calculada',
        calculoVigente: true,
        incidencias: [
          incidencia({ severidad: 'critica', estadoDecision: 'resuelta' }),
          incidencia({ severidad: 'advertencia', estadoDecision: 'aceptada_justificada' }),
        ],
      }),
    ).toBe(true);
  });

  it('construye resumen con advertencias pendientes', () => {
    const resumen = construirResumenValidacionDesdeIncidencias({
      totalTrabajadores: 3,
      estado: 'calculada',
      calculoVigente: true,
      conMovimientosEspeciales: 0,
      incidencias: [
        incidencia({ severidad: 'advertencia', trabajadorId: '10' }),
        incidencia({
          severidad: 'advertencia',
          trabajadorId: '11',
          estadoDecision: 'aceptada_justificada',
        }),
      ],
    });
    expect(resumen.advertenciasPendientes).toBe(1);
    expect(resumen.puedeValidar).toBe(false);
  });
});
