import { describe, expect, it } from 'vitest';

import type { NominaPeriodo } from '../../../../nomina-mensual/models/nomina-periodo.models';
import { crearNomina } from '../../../../nomina-mensual/models/nomina-periodo.models';
import {
  ORDEN_PASOS_NOMINA,
  PASOS_CONGELADOS_V11,
  esCalculoNoVigente,
  ejecutarAvancePaso,
  esPasoCongelado,
  esRetrocesoAPaso,
  indiceMaximoPasoAccesible,
  indiceMaximoPasoAccesibleEfectivo,
  indiceUltimoPasoCompletado,
  indiceUltimoPasoCompletadoPorEstado,
  obtenerEstadoPaso,
  obtenerEtiquetaAccionPrincipal,
  obtenerEtiquetaBrevePaso,
  obtenerTituloPaso,
  pasoExcluidoAutoPersistenciaCompletado,
  puedeContinuarPaso,
  tooltipPasoNoAccesible,
  type PasoNominaPort,
  type ResultadoAvancePaso,
} from './nomina-mensual-v2-navegacion';

function nominaConEstado(
  estado: NominaPeriodo['estado'],
  calculoVigente = true,
): NominaPeriodo {
  return crearNomina({
    id: 'np-1',
    periodo: '2026-06',
    empresaId: '7',
    empresaNombre: 'Demo',
    tipo: 'mensual',
    estado,
    segmentos: [],
    movimientos: [],
    incidencias: [],
    trabajadorIds: [],
    totalHaberes: 0,
    totalDescuentos: 0,
    totalLiquido: 0,
    createdAt: '2026-06-01T00:00:00Z',
    updatedAt: '2026-06-01T00:00:00Z',
    evidenciaCalculo: { versionCalculo: 1, calculoVigente },
  });
}

describe('nomina-mensual-v2-navegacion (F3 fusion — 6 pasos)', () => {
  it('expone exactamente 6 pasos en el orden definido por la fase F3', () => {
    expect(ORDEN_PASOS_NOMINA).toEqual([
      'parameters',
      'dotacion',
      'movements',
      'calculation',
      'validation',
      'closure',
    ]);
  });

  it('incluye dotacion entre parameters y movements', () => {
    const indiceParametros = ORDEN_PASOS_NOMINA.indexOf('parameters');
    const indiceDotacion = ORDEN_PASOS_NOMINA.indexOf('dotacion');
    const indiceMovimientos = ORDEN_PASOS_NOMINA.indexOf('movements');

    expect(indiceDotacion).toBe(indiceParametros + 1);
    expect(indiceMovimientos).toBe(indiceDotacion + 1);
  });

  it('expone copy del paso Dotación', () => {
    expect(obtenerTituloPaso('dotacion')).toBe('Dotación del período');
    expect(obtenerEtiquetaAccionPrincipal('dotacion')).toBe('Confirmar dotación');
  });

  it('expone copy del paso Cierre', () => {
    expect(obtenerTituloPaso('closure')).toBe('Cierre y liquidaciones');
    expect(obtenerEtiquetaAccionPrincipal('closure')).toBe('Cerrar nómina');
  });

  it('expone copy navegacional del CTA en pasos puente (Movimientos y Cálculo)', () => {
    expect(obtenerEtiquetaAccionPrincipal('movements')).toBe('Continuar al cálculo');
    expect(obtenerEtiquetaAccionPrincipal('calculation')).toBe('Continuar a validación');
  });

  it('detecta retroceso al paso Parametros desde Dotación', () => {
    expect(esRetrocesoAPaso('dotacion', 'parameters')).toBe(true);
    expect(esRetrocesoAPaso('parameters', 'dotacion')).toBe(false);
  });

  it('pasoExcluidoAutoPersistenciaCompletado excluye cierre', () => {
    expect(pasoExcluidoAutoPersistenciaCompletado('closure')).toBe(true);
    expect(pasoExcluidoAutoPersistenciaCompletado('calculation')).toBe(false);
  });

  it('no congela ningún paso en F3 fusion: PASOS_CONGELADOS_V11 está vacío', () => {
    expect(PASOS_CONGELADOS_V11.size).toBe(0);
    expect(esPasoCongelado('movements')).toBe(false);
    expect(esPasoCongelado('closure')).toBe(false);
  });
});

describe('indiceUltimoPasoCompletado / obtenerEstadoPaso desde evidencia (AG-NAV-02)', () => {
  it('sin nómina cargada, sólo el paso activo queda active; el resto pending', () => {
    expect(indiceUltimoPasoCompletado(null)).toBe(-1);
    expect(obtenerEstadoPaso('parameters', 'parameters', null)).toBe('active');
    expect(obtenerEstadoPaso('dotacion', 'parameters', null)).toBe('pending');
    expect(obtenerEstadoPaso('closure', 'parameters', null)).toBe('pending');
  });

  it('estado borrador: ningún paso queda completed', () => {
    const n = nominaConEstado('borrador');
    expect(indiceUltimoPasoCompletado(n)).toBe(-1);
    expect(obtenerEstadoPaso('parameters', 'parameters', n)).toBe('active');
    expect(obtenerEstadoPaso('dotacion', 'parameters', n)).toBe('pending');
  });

  it('estado dotacion_generada: parameters queda completed, resto pending', () => {
    const n = nominaConEstado('dotacion_generada');
    expect(indiceUltimoPasoCompletado(n)).toBe(0);
    expect(obtenerEstadoPaso('parameters', 'dotacion', n)).toBe('completed');
    expect(obtenerEstadoPaso('dotacion', 'dotacion', n)).toBe('active');
    expect(obtenerEstadoPaso('movements', 'dotacion', n)).toBe('pending');
  });

  it('estado en_revision: parameters y dotacion completed', () => {
    const n = nominaConEstado('en_revision');
    expect(indiceUltimoPasoCompletado(n)).toBe(1);
    expect(obtenerEstadoPaso('parameters', 'movements', n)).toBe('completed');
    expect(obtenerEstadoPaso('dotacion', 'movements', n)).toBe('completed');
    expect(obtenerEstadoPaso('movements', 'movements', n)).toBe('active');
    expect(obtenerEstadoPaso('calculation', 'movements', n)).toBe('pending');
  });

  it('estado calculada con cálculo vigente: calculation queda completed', () => {
    const n = nominaConEstado('calculada', true);
    expect(indiceUltimoPasoCompletado(n)).toBe(ORDEN_PASOS_NOMINA.indexOf('calculation'));
    expect(obtenerEstadoPaso('movements', 'validation', n)).toBe('completed');
    expect(obtenerEstadoPaso('calculation', 'validation', n)).toBe('completed');
  });

  it('estado validada con cálculo vigente: validation queda completed (F13)', () => {
    const n = nominaConEstado('validada', true);
    expect(indiceUltimoPasoCompletado(n)).toBe(ORDEN_PASOS_NOMINA.indexOf('validation'));
    expect(obtenerEstadoPaso('calculation', 'closure', n)).toBe('completed');
    expect(obtenerEstadoPaso('validation', 'closure', n)).toBe('completed');
    expect(obtenerEstadoPaso('closure', 'closure', n)).toBe('active');
  });

  it('estado validada con cálculo NO vigente: calculation queda warning (CAL-INV-05)', () => {
    const n = nominaConEstado('validada', false);
    expect(obtenerEstadoPaso('calculation', 'closure', n)).toBe('warning');
  });

  it('estado aprobada: validation queda completed, closure pending', () => {
    const n = nominaConEstado('aprobada', true);
    expect(indiceUltimoPasoCompletado(n)).toBe(ORDEN_PASOS_NOMINA.indexOf('validation'));
    expect(obtenerEstadoPaso('validation', 'closure', n)).toBe('completed');
    expect(obtenerEstadoPaso('closure', 'closure', n)).toBe('active');
  });

  it('estado liquidada: validation queda completed y closure pendiente', () => {
    const n = nominaConEstado('liquidada', true);
    expect(indiceUltimoPasoCompletado(n)).toBe(ORDEN_PASOS_NOMINA.indexOf('validation'));
    expect(obtenerEstadoPaso('validation', 'closure', n)).toBe('completed');
    expect(obtenerEstadoPaso('closure', 'parameters', n)).toBe('pending');
  });

  it('estado cerrada: todos los pasos quedan completed', () => {
    const n = nominaConEstado('cerrada', true);
    expect(indiceUltimoPasoCompletado(n)).toBe(ORDEN_PASOS_NOMINA.indexOf('closure'));
    for (const stepId of ORDEN_PASOS_NOMINA) {
      if (stepId === 'closure') {
        expect(obtenerEstadoPaso(stepId, 'closure', n)).toBe('active');
      } else {
        expect(obtenerEstadoPaso(stepId, 'closure', n)).toBe('completed');
      }
    }
  });

  it('estado reabierta: closure vuelve a pending (cierre deshecho)', () => {
    const n = nominaConEstado('reabierta', true);
    expect(indiceUltimoPasoCompletado(n)).toBe(ORDEN_PASOS_NOMINA.indexOf('validation'));
    expect(obtenerEstadoPaso('validation', 'parameters', n)).toBe('completed');
    expect(obtenerEstadoPaso('closure', 'parameters', n)).toBe('pending');
  });

  it('maximoPasoCompletado eleva el índice cuando el estado aún no refleja el avance UI', () => {
    const n = crearNomina({
      ...nominaConEstado('en_revision'),
      maximoPasoCompletado: 'movements',
    });
    expect(indiceUltimoPasoCompletado(n)).toBe(2);
    expect(obtenerEstadoPaso('movements', 'calculation', n)).toBe('completed');
    expect(obtenerEstadoPaso('calculation', 'calculation', n)).toBe('active');
  });

  it('borrador + maximoPasoCompletado parameters marca Parámetros como completed', () => {
    const n = crearNomina({
      ...nominaConEstado('borrador'),
      maximoPasoCompletado: 'parameters',
    });
    expect(indiceUltimoPasoCompletado(n)).toBe(0);
    expect(obtenerEstadoPaso('parameters', 'dotacion', n)).toBe('completed');
  });

  it('reabierta no revive closure aunque maximoPasoCompletado histórico sea closure', () => {
    const n = crearNomina({
      ...nominaConEstado('reabierta', true),
      maximoPasoCompletado: 'closure',
    });
    expect(indiceUltimoPasoCompletado(n)).toBe(4);
    expect(obtenerEstadoPaso('closure', 'parameters', n)).toBe('pending');
  });

  it('estado anulada: ningún paso queda completed', () => {
    const n = nominaConEstado('anulada', true);
    expect(indiceUltimoPasoCompletado(n)).toBe(-1);
    for (const stepId of ORDEN_PASOS_NOMINA) {
      if (stepId === 'parameters') {
        expect(obtenerEstadoPaso(stepId, 'parameters', n)).toBe('active');
      } else {
        expect(obtenerEstadoPaso(stepId, 'parameters', n)).toBe('pending');
      }
    }
  });
});

describe('indiceUltimoPasoCompletadoPorEstado (variante para caller ligero)', () => {
  it('devuelve -1 cuando el estado es null', () => {
    expect(indiceUltimoPasoCompletadoPorEstado(null)).toBe(-1);
  });

  it('coincide con la variante completa para cada estado', () => {
    const estados: NominaPeriodo['estado'][] = [
      'borrador',
      'dotacion_generada',
      'en_revision',
      'calculada',
      'validada',
      'aprobada',
      'liquidada',
      'cerrada',
      'reabierta',
      'anulada',
    ];
    for (const estado of estados) {
      const n = nominaConEstado(estado);
      expect(indiceUltimoPasoCompletadoPorEstado(estado)).toBe(
        indiceUltimoPasoCompletado(n),
      );
    }
  });
});

describe('indiceMaximoPasoAccesible — restringe rehidratación a pasos alcanzables', () => {
  it('borrador permite solo parameters', () => {
    expect(indiceMaximoPasoAccesible('borrador')).toBe(ORDEN_PASOS_NOMINA.indexOf('parameters'));
  });

  it('dotacion_generada permite hasta dotacion', () => {
    expect(indiceMaximoPasoAccesible('dotacion_generada')).toBe(ORDEN_PASOS_NOMINA.indexOf('dotacion'));
  });

  it('en_revision permite hasta calculation (paso en curso es accesible)', () => {
    expect(indiceMaximoPasoAccesible('en_revision')).toBe(ORDEN_PASOS_NOMINA.indexOf('calculation'));
  });

  it('calculada/validada permiten hasta validation', () => {
    expect(indiceMaximoPasoAccesible('calculada')).toBe(ORDEN_PASOS_NOMINA.indexOf('validation'));
    expect(indiceMaximoPasoAccesible('validada')).toBe(ORDEN_PASOS_NOMINA.indexOf('validation'));
  });

  it('aprobada/liquidada/cerrada/reabierta permiten hasta closure', () => {
    const max = ORDEN_PASOS_NOMINA.indexOf('closure');
    expect(indiceMaximoPasoAccesible('aprobada')).toBe(max);
    expect(indiceMaximoPasoAccesible('liquidada')).toBe(max);
    expect(indiceMaximoPasoAccesible('cerrada')).toBe(max);
    expect(indiceMaximoPasoAccesible('reabierta')).toBe(max);
  });

  it('anulada devuelve -1 (ninguno)', () => {
    expect(indiceMaximoPasoAccesible('anulada')).toBe(-1);
  });
});

describe('ejecutarAvancePaso — delegación del CTA del shell (AG-NAV-03)', () => {
  function paso(resultado: ResultadoAvancePaso, completable: ResultadoAvancePaso = { ok: true }): PasoNominaPort {
    return {
      puedeContinuar: () => completable,
      avanzar: () => Promise.resolve(resultado),
    };
  }

  it('retorna ok:false y siguientePaso:null cuando no hay paso activo (ViewChild no instanciado)', async () => {
    const r = await ejecutarAvancePaso('dotacion', null);
    expect(r.resultado.ok).toBe(false);
    expect(r.siguientePaso).toBeNull();
  });

  it('cuando el paso retorna ok:true, expone el siguiente paso del orden definido', async () => {
    expect((await ejecutarAvancePaso('dotacion', paso({ ok: true }))).siguientePaso).toBe('movements');
    expect((await ejecutarAvancePaso('movements', paso({ ok: true }))).siguientePaso).toBe('calculation');
    expect((await ejecutarAvancePaso('calculation', paso({ ok: true }))).siguientePaso).toBe('validation');
    expect((await ejecutarAvancePaso('validation', paso({ ok: true }))).siguientePaso).toBe('closure');
  });

  it('en closure (paso terminal), ok:true no expone siguientePaso', async () => {
    const r = await ejecutarAvancePaso('closure', paso({ ok: true }));
    expect(r.resultado).toEqual({ ok: true });
    expect(r.siguientePaso).toBeNull();
  });

  it('propaga ok:false con la razón del paso y siguientePaso queda null', async () => {
    const r = await ejecutarAvancePaso('dotacion', paso({ ok: false, razon: 'Hay incidencias.' }));
    expect(r.resultado).toEqual({ ok: false, razon: 'Hay incidencias.' });
    expect(r.siguientePaso).toBeNull();
  });
});

describe('puedeContinuarPaso — consulta pura para CTA/stepper', () => {
  it('devuelve ok:false sin razón vacía cuando no hay paso activo', () => {
    const r = puedeContinuarPaso(null);
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.razon).toBeTruthy();
    }
  });

  it('delega al puedeContinuar() del paso activo', () => {
    const paso: PasoNominaPort = {
      puedeContinuar: () => ({ ok: false, razon: 'Falta cargar.' }),
      avanzar: () => Promise.resolve({ ok: true }),
    };
    expect(puedeContinuarPaso(paso)).toEqual({ ok: false, razon: 'Falta cargar.' });
  });
});

describe('indiceMaximoPasoAccesibleEfectivo — combina estado + contenido', () => {
  it('contenido limita por debajo del techo estado: en_revision con contenido en dotacion sólo da hasta movements', () => {
    // estado en_revision permite hasta `calculation` (índice 3)
    // contenido completado = dotacion (índice 1) → max+1 = 2 (movements)
    expect(indiceMaximoPasoAccesibleEfectivo('en_revision', 1)).toBe(2);
  });

  it('estado limita por debajo del contenido: borrador con contenido en movements igual da solo parameters', () => {
    expect(indiceMaximoPasoAccesibleEfectivo('borrador', 2)).toBe(
      ORDEN_PASOS_NOMINA.indexOf('parameters'),
    );
  });

  it('contenido -1 (nada completo) da el techo de estado sin cambios cuando techo <= 0', () => {
    expect(indiceMaximoPasoAccesibleEfectivo('borrador', -1)).toBe(0);
  });

  it('anulada propaga -1 sin importar el contenido', () => {
    expect(indiceMaximoPasoAccesibleEfectivo('anulada', 5)).toBe(-1);
  });

  it('estado cerrada con contenido cierre permite hasta cierre', () => {
    expect(indiceMaximoPasoAccesibleEfectivo('cerrada', 5)).toBe(
      ORDEN_PASOS_NOMINA.indexOf('closure'),
    );
  });
});

describe('tooltipPasoNoAccesible / obtenerEtiquetaBrevePaso', () => {
  it('etiqueta breve por paso', () => {
    expect(obtenerEtiquetaBrevePaso('parameters')).toBe('Parámetros');
    expect(obtenerEtiquetaBrevePaso('dotacion')).toBe('Dotación');
    expect(obtenerEtiquetaBrevePaso('movements')).toBe('Movimientos');
    expect(obtenerEtiquetaBrevePaso('calculation')).toBe('Cálculo');
    expect(obtenerEtiquetaBrevePaso('validation')).toBe('Validación');
    expect(obtenerEtiquetaBrevePaso('closure')).toBe('Cierre');
  });

  it('tooltipPasoNoAccesible cita el paso anterior', () => {
    expect(tooltipPasoNoAccesible('movements')).toBe('Completa Dotación para continuar.');
    expect(tooltipPasoNoAccesible('validation')).toBe('Completa Cálculo para continuar.');
  });

  it('tooltipPasoNoAccesible para el primer paso devuelve mensaje genérico', () => {
    expect(tooltipPasoNoAccesible('parameters')).toBe('Completa el paso actual para continuar.');
  });
});

describe('esCalculoNoVigente (CAL-INV-05)', () => {
  it('no activa sin evidencia ni resumen', () => {
    expect(esCalculoNoVigente(null)).toBe(false);
    expect(esCalculoNoVigente(undefined)).toBe(false);
  });

  it('no activa con versionCalculo 0 aunque calculoVigente sea false', () => {
    expect(esCalculoNoVigente({ versionCalculo: 0, calculoVigente: false })).toBe(false);
  });

  it('activa con versionCalculo > 0 y calculoVigente false', () => {
    expect(esCalculoNoVigente({ versionCalculo: 2, calculoVigente: false })).toBe(true);
  });

  it('activa desde resumen sin versionCalculo cuando calculoVigente es false', () => {
    expect(esCalculoNoVigente({ calculoVigente: false })).toBe(true);
  });
});
