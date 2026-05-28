import { describe, expect, it } from 'vitest';

import {
  buildNominaMsgboxLabExamples,
  mapConfirmacionNominaToSections,
} from './nomina-msgbox-lab.rules';

describe('nomina-msgbox-lab.rules', () => {
  it('expone ejemplo de referencia de parámetros con tres acciones', () => {
    const ejemplo = buildNominaMsgboxLabExamples().find((e) => e.id === 'parametros-reconciliacion');
    expect(ejemplo?.tab).toBe('referencia');
    expect(ejemplo?.tertiaryLabel).toBe('Revisar después');
    expect(ejemplo?.title).toContain('parámetros oficiales');
  });

  it('mapea confirmación de nómina a sections sin superar tres bloques', () => {
    const sections = mapConfirmacionNominaToSections({
      detalle: 'No es la confirmación oficial.',
      puntosTitulo: 'Qué queda registrado',
      puntos: ['Versión revisada disponible.'],
      proximaAccion: 'Registrar revisión RRHH.',
      mostrarProximaAccion: true,
    });

    expect(sections.length).toBeLessThanOrEqual(3);
    expect(sections.some((s) => s.title === 'Próxima acción')).toBe(true);
  });

  it('propuesto guardar revisión no usa legacyActa', () => {
    const ejemplo = buildNominaMsgboxLabExamples().find((e) => e.id === 'nomina-guardar-revision-propuesto');
    expect(ejemplo?.legacyActa).toBeUndefined();
    expect((ejemplo?.sections ?? []).length).toBeGreaterThan(0);
  });
});
