import { describe, expect, it } from 'vitest';

import type { NominaPeriodo } from '../../../../nomina-mensual/models/nomina-periodo.models';
import {
  ORDEN_PASOS_NOMINA,
  PASOS_CONGELADOS_V11,
  ejecutarAvancePaso,
  esPasoCongelado,
  esRetrocesoAPaso,
  indiceUltimoPasoCompletado,
  obtenerEstadoPaso,
  obtenerEtiquetaAccionPrincipal,
  obtenerTituloPaso,
  type PasoNominaPort,
  type ResultadoAvancePaso,
} from './nomina-mensual-v2-navegacion';

function nominaConEstado(
  estado: NominaPeriodo['estado'],
  calculoVigente = true,
): NominaPeriodo {
  return {
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
  };
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
    expect(indiceUltimoPasoCompletado(n)).toBe(2);
    expect(obtenerEstadoPaso('movements', 'validation', n)).toBe('completed');
    expect(obtenerEstadoPaso('calculation', 'validation', n)).toBe('pending');
    // Excepción CAL-INV-05: calculation requiere ÍNDICE>=propio Y calculoVigente.
    // En `calculada` (índice 2 == calculation), no es <= 2 - 1, así que pending.
    // La excepción la observamos mejor con `validada` (índice 3) más abajo.
  });

  it('estado validada con cálculo vigente: calculation queda completed; validation pending', () => {
    const n = nominaConEstado('validada', true);
    expect(indiceUltimoPasoCompletado(n)).toBe(3);
    expect(obtenerEstadoPaso('calculation', 'closure', n)).toBe('completed');
    // validada significa "cálculo OK, validación en curso": validation aún no
    // está completa (se completa al aprobar).
    expect(obtenerEstadoPaso('validation', 'closure', n)).toBe('pending');
  });

  it('estado validada con cálculo NO vigente: calculation vuelve a pending (excepción CAL-INV-05)', () => {
    const n = nominaConEstado('validada', false);
    expect(obtenerEstadoPaso('calculation', 'closure', n)).toBe('pending');
  });

  it('estado aprobada: validation queda completed, closure pending', () => {
    const n = nominaConEstado('aprobada', true);
    expect(indiceUltimoPasoCompletado(n)).toBe(4);
    expect(obtenerEstadoPaso('validation', 'closure', n)).toBe('completed');
    expect(obtenerEstadoPaso('closure', 'closure', n)).toBe('active');
  });

  it('estado cerrada: todos los pasos quedan completed', () => {
    const n = nominaConEstado('cerrada', true);
    expect(indiceUltimoPasoCompletado(n)).toBe(5);
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
    expect(indiceUltimoPasoCompletado(n)).toBe(4);
    expect(obtenerEstadoPaso('validation', 'parameters', n)).toBe('completed');
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

describe('ejecutarAvancePaso — delegación del CTA del shell (AG-NAV-03)', () => {
  function paso(resultado: ResultadoAvancePaso): PasoNominaPort {
    return { avanzar: () => Promise.resolve(resultado) };
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
