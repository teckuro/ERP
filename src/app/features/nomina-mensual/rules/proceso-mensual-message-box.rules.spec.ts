import { describe, expect, it } from 'vitest';

import {
  buildConfirmacionProcesoMensualActions,
  buildMsgboxDecisionCompacta,
  buildMsgboxDecisionGuiada,
  buildMsgboxDiagnostico,
  buildMsgboxErrorSimple,
  buildMsgboxFeedbackSimple,
  mapConfirmacionProcesoMensualToSections,
} from './proceso-mensual-message-box.rules';

describe('proceso-mensual-message-box.rules', () => {
  it('builders devuelven 0, 1, 2 o 3 bloques según patrón', () => {
    expect(buildMsgboxFeedbackSimple()).toHaveLength(0);
    expect(buildMsgboxErrorSimple({ accion: 'Reintentar guardado.' })).toHaveLength(1);
    expect(
      buildMsgboxDecisionCompacta({
        principal: 'Se guardará el borrador.',
        accion: 'Continuar revisión.',
      }),
    ).toHaveLength(2);
    expect(
      buildMsgboxDecisionGuiada({
        pendiente: 'Aprobar nómina.',
        impacto: 'Congela el período.',
        accion: 'Generar liquidaciones.',
      }),
    ).toHaveLength(3);
    expect(
      buildMsgboxDiagnostico({
        diagnostico: 'Existen diferencias previsionales.',
        detalle: 'Hay tasas distintas a la referencia.',
        accion: 'Conciliar parámetros.',
      }),
    ).toHaveLength(3);
  });

  it('guardar revisión queda como decisión compacta de dos bloques', () => {
    const sections = mapConfirmacionProcesoMensualToSections({
      tipo: 'guardar_preliminar',
      variant: 'decision',
      mensaje: 'Guardar revisión del período.',
      detalle: 'No es la confirmación oficial.',
      puntos: ['Versión revisada disponible.'],
      proximaAccion: 'Aprobar nómina.',
      mostrarProximaAccion: true,
      primaryLabel: 'Guardar revisión',
    });

    expect(sections.map((section) => section.title)).toEqual(['Principal', 'Acción']);
  });

  it('aprobar nómina usa decisión guiada cuando hay impacto operativo', () => {
    const sections = mapConfirmacionProcesoMensualToSections({
      tipo: 'cerrar_nomina',
      variant: 'warning',
      mensaje: 'Aprobar nómina.',
      detalle: 'La versión revisada quedará lista para emitir liquidaciones.',
      puntosTitulo: 'Qué cambia al aprobar',
      puntos: ['No emite liquidaciones en este paso.', 'Queda lista para generar liquidaciones oficiales.'],
      proximaAccion: 'Generar liquidaciones desde la nómina aprobada.',
      mostrarProximaAccion: true,
      primaryLabel: 'Aprobar nómina',
    });

    expect(sections.map((section) => section.title)).toEqual([
      'Pendiente principal',
      'Impacto operativo',
      'Acción recomendada',
    ]);
    expect(sections[1].items?.length).toBeLessThanOrEqual(3);
  });

  it('marca acciones destructivas con rol danger', () => {
    const actions = buildConfirmacionProcesoMensualActions({
      tipo: 'descartar_nomina',
      primaryLabel: 'Descartar nómina',
      secondaryLabel: 'Cancelar',
    });

    expect(actions[0]).toMatchObject({ value: 'secondary', role: 'secondary', align: 'left' });
    expect(actions[1]).toMatchObject({ value: 'primary', role: 'danger', align: 'right' });
  });
});
