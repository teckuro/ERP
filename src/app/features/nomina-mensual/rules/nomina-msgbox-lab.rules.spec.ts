import { describe, expect, it } from 'vitest';

import {
  NOMINA_MSGBOX_LAB_TABS,
  buildNominaMsgboxLabExamples,
  mapConfirmacionNominaToSections,
} from './nomina-msgbox-lab.rules';

describe('nomina-msgbox-lab.rules', () => {
  it('expone la matriz completa de patrones', () => {
    const patterns = new Set(buildNominaMsgboxLabExamples().map((e) => e.patron));

    expect(patterns).toEqual(
      new Set([
        'loading',
        'feedback-simple',
        'error-simple',
        'decision-compacta',
        'decision-guiada',
        'diagnostico',
      ]),
    );
    expect(NOMINA_MSGBOX_LAB_TABS.map((tab) => tab.id)).toEqual(['referencia', 'nomina', 'otros-flujos']);
  });

  it('mapea confirmación simple de nómina a dos bloques compactos', () => {
    const sections = mapConfirmacionNominaToSections({
      tipo: 'guardar_preliminar',
      variant: 'decision',
      mensaje: 'Guardar revisión del período.',
      detalle: 'No es la confirmación oficial.',
      puntosTitulo: 'Qué queda registrado',
      puntos: ['Versión revisada disponible.'],
      proximaAccion: 'Aprobar nómina.',
      mostrarProximaAccion: true,
      primaryLabel: 'Guardar revisión',
    });

    expect(sections.map((section) => section.title)).toEqual(['Principal', 'Acción']);
  });

  it('incluye ejemplos de 0, 1, 2 y 3 bloques sin forzar patrón único', () => {
    const counts = new Set(buildNominaMsgboxLabExamples().map((e) => e.sections?.length ?? 0));

    expect(counts.has(0)).toBe(true);
    expect(counts.has(1)).toBe(true);
    expect(counts.has(2)).toBe(true);
    expect(counts.has(3)).toBe(true);
  });

  it('mantiene intactos los ejemplos cargando', () => {
    const examples = buildNominaMsgboxLabExamples();
    expect(examples.find((e) => e.id === 'parametros-carga')).toMatchObject({
      patron: 'loading',
      variant: 'loading',
      title: 'Obteniendo parámetros...',
      message: 'Sincronizando topes previsionales y valores de Mayo 2026.',
      width: 'sm',
    });
    expect(examples.find((e) => e.id === 'nomina-calculando-cargando')).toMatchObject({
      patron: 'loading',
      variant: 'loading',
      title: 'Calculando remuneraciones...',
      message: 'Procesando tramos de impuesto único y cotizaciones obligatorias.',
      width: 'sm',
    });
  });

  it('ejemplos no-loading usan máximo tres secciones cuando las definen', () => {
    const noLoading = buildNominaMsgboxLabExamples().filter((e) => e.variant !== 'loading');
    expect(noLoading.every((e) => (e.sections?.length ?? 0) <= 3)).toBe(true);
  });

  it('parámetros mantiene diagnóstico con tres acciones', () => {
    const ejemplo = buildNominaMsgboxLabExamples().find((e) => e.id === 'parametros-reconciliacion');
    expect(ejemplo?.tab).toBe('otros-flujos');
    expect(ejemplo?.patron).toBe('diagnostico');
    expect(ejemplo?.tertiaryLabel).toBe('Revisar después');
    expect(ejemplo?.title).toContain('parámetros oficiales');
  });
});
