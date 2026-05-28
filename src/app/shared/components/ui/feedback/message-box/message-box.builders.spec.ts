import { describe, expect, it } from 'vitest';

import {
  buildMsgboxDecisionCompacta,
  buildMsgboxDecisionGuiada,
  buildMsgboxDiagnostico,
  buildMsgboxErrorSimple,
  buildMsgboxFeedbackSimple,
} from './message-box.builders';

describe('message-box.builders', () => {
  it('representa feedback simple sin bloques', () => {
    expect(buildMsgboxFeedbackSimple()).toEqual([]);
  });

  it('representa error simple con cero o un bloque', () => {
    expect(buildMsgboxErrorSimple({})).toEqual([]);
    expect(buildMsgboxErrorSimple({ accion: 'Reintentar.' })).toEqual([
      { title: 'Acción recomendada', text: 'Reintentar.', tone: 'attention' },
    ]);
  });

  it('representa decisión compacta con dos bloques', () => {
    const sections = buildMsgboxDecisionCompacta({
      principal: 'Se procesarán los registros seleccionados.',
      accion: 'Confirmar solo si la selección es correcta.',
    });

    expect(sections.map((section) => section.title)).toEqual(['Principal', 'Acción']);
  });

  it('representa decisión guiada con máximo tres bloques', () => {
    const sections = buildMsgboxDecisionGuiada({
      pendiente: 'Validar cierre.',
      impacto: 'Congela el período.',
      accion: 'Confirmar después de revisar.',
    });

    expect(sections.map((section) => section.title)).toEqual([
      'Pendiente principal',
      'Impacto operativo',
      'Acción recomendada',
    ]);
  });

  it('representa diagnóstico con máximo tres bloques', () => {
    const sections = buildMsgboxDiagnostico({
      diagnostico: 'Existen diferencias.',
      detalle: 'Hay valores oficiales distintos.',
      accion: 'Conciliar parámetros.',
      items: ['UF', 'SANNA', 'Mutual', 'Sueldo mínimo', 'Extra'],
    });

    expect(sections).toHaveLength(3);
    expect(sections[0].items).toHaveLength(4);
  });
});
