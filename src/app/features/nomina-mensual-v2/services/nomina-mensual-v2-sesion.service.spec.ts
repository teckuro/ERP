import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { PeriodoActivoService } from '../../../core/services/periodo-activo.service';
import { NominaCalculoSnapshotRepository } from '../../nomina-mensual/data-access/nomina-calculo-snapshot.repository';
import { NominaPeriodoRepository } from '../../nomina-mensual/data-access/nomina-periodo.repository';
import { NominaParametrosBaseService } from './nomina-parametros-base.service';
import { NominaParametrosResumenService } from './nomina-parametros-resumen.service';
import { NominaMensualV2SesionService } from './nomina-mensual-v2-sesion.service';
import type { NominaPeriodoResumen } from '../../nomina-mensual/models/nomina-periodo.models';
import { crearNominaResumen } from '../../nomina-mensual/models/nomina-periodo.models';

const ESTADO_BASE_VACIO = {
  estado: 'pendiente' as const,
  idCalculoPeriodoBase: null,
  fechaBaseGuardada: null,
  comparacion: null,
};

function resumenParametrosMock() {
  return {
    periodo: '2026-06',
    completitud: 0,
    completitudSecciones: 0,
    seccionesTotales: 0,
    seccionesListas: 0,
    controlesTotales: 0,
    controlesVerificados: 0,
    totalParametros: 0,
    parametrosConfigurados: 0,
    bloqueos: 0,
    requiereRevision: 0,
    bloqueosPreparacion: 0,
    advertenciasOficiales: 0,
    completos: 0,
    puedeContinuar: false,
    puedePreparar: false,
    ultimaActualizacion: null,
    areas: [],
    bloqueosActuales: [],
    pendientesPreparacion: [],
    advertenciasNoBloqueantes: [],
    accesos: [],
  };
}

function cabeceraMock(overrides: Partial<NominaPeriodoResumen> = {}): NominaPeriodoResumen {
  return crearNominaResumen({
    id: 'nom-1',
    periodo: '2026-06',
    empresaId: '7',
    empresaNombre: 'Demo',
    tipo: 'mensual',
    estado: 'en_revision',
    totalTrabajadores: 5,
    totalSegmentos: 1,
    totalHaberes: 0,
    totalDescuentos: 0,
    totalLiquido: 0,
    totalIncidenciasCriticas: 0,
    totalAdvertencias: 0,
    createdAt: '2026-06-04T00:00:00.000Z',
    updatedAt: '2026-06-04T00:00:00.000Z',
    ultimoPasoVisitado: null,
    pasoVisitadoAt: null,
    maximoPasoCompletado: null,
    maximoPasoCompletadoAt: null,
    ...overrides,
  });
}

describe('NominaMensualV2SesionService - rehidratación de paso visitado', () => {
  let obtenerCabecera: ReturnType<typeof vi.fn>;

  function setUp(opts: { cabecera?: NominaPeriodoResumen | null; obtenerCabeceraError?: Error } = {}) {
    obtenerCabecera = vi.fn();
    if (opts.obtenerCabeceraError) {
      obtenerCabecera.mockRejectedValue(opts.obtenerCabeceraError);
    } else {
      obtenerCabecera.mockResolvedValue(opts.cabecera ?? null);
    }
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        NominaMensualV2SesionService,
        {
          provide: PeriodoActivoService,
          useValue: { periodoYm: () => '2026-06' },
        },
        {
          provide: NominaParametrosBaseService,
          useValue: {
            obtenerEstadoBasePeriodo: vi.fn().mockResolvedValue(ESTADO_BASE_VACIO),
          },
        },
        {
          provide: NominaParametrosResumenService,
          useValue: {
            obtenerResumen: vi.fn().mockResolvedValue(resumenParametrosMock()),
          },
        },
        {
          provide: NominaCalculoSnapshotRepository,
          useValue: {
            obtenerSnapshotParametrosBase: vi.fn().mockResolvedValue(null),
          },
        },
        {
          provide: NominaPeriodoRepository,
          useValue: { obtenerCabecera },
        },
      ],
    });
    return TestBed.inject(NominaMensualV2SesionService);
  }

  beforeEach(() => {
    // noop
  });

  it('devuelve pasoVisitadoSugerido null cuando no se pasa nominaPeriodoId', async () => {
    const service = setUp();
    const sesion = await service.resolverEstadoSesion('2026-06');
    expect(sesion.pasoVisitadoSugerido).toBeNull();
    expect(obtenerCabecera).not.toHaveBeenCalled();
  });

  it('devuelve null cuando la cabecera no existe', async () => {
    const service = setUp({ cabecera: null });
    const sesion = await service.resolverEstadoSesion('2026-06', 'nom-1');
    expect(sesion.pasoVisitadoSugerido).toBeNull();
  });

  it('devuelve null cuando la cabecera no tiene ultimoPasoVisitado', async () => {
    const service = setUp({ cabecera: cabeceraMock({ ultimoPasoVisitado: null }) });
    const sesion = await service.resolverEstadoSesion('2026-06', 'nom-1');
    expect(sesion.pasoVisitadoSugerido).toBeNull();
  });

  it('devuelve el paso cuando es accesible según el estado y el contenido (en_revision + max calculation)', async () => {
    // en_revision permite hasta calculation (índice 3); contenido max=movements
    // (índice 2) → accesibleEfectivo = min(3, 2+1) = 3. calculation cabe.
    const service = setUp({
      cabecera: cabeceraMock({
        estado: 'en_revision',
        ultimoPasoVisitado: 'calculation',
        maximoPasoCompletado: 'movements',
      }),
    });
    const sesion = await service.resolverEstadoSesion('2026-06', 'nom-1');
    expect(sesion.pasoVisitadoSugerido).toBe('calculation');
  });

  it('cae al máximo accesible efectivo cuando el visitado excede pero hay un techo no nulo', async () => {
    // borrador → techo estado = parameters (0); contenido nulo → efectivo = 0.
    // closure (índice 5) excede → cae a parameters.
    const service = setUp({
      cabecera: cabeceraMock({ estado: 'borrador', ultimoPasoVisitado: 'closure' }),
    });
    const sesion = await service.resolverEstadoSesion('2026-06', 'nom-1');
    expect(sesion.pasoVisitadoSugerido).toBe('parameters');
  });

  it('limita el techo cuando el contenido cliente está atrás del estado (estado en_revision pero contenido en dotacion)', async () => {
    // estado en_revision → techo = calculation (3); contenido = dotacion (1) → max+1 = 2 (movements).
    // efectivo = min(3, 2) = 2. visitado calculation (3) > 2 → cae a movements.
    const service = setUp({
      cabecera: cabeceraMock({
        estado: 'en_revision',
        ultimoPasoVisitado: 'calculation',
        maximoPasoCompletado: 'dotacion',
      }),
    });
    const sesion = await service.resolverEstadoSesion('2026-06', 'nom-1');
    expect(sesion.pasoVisitadoSugerido).toBe('movements');
  });

  it('devuelve null cuando la nómina está anulada (no rehidrata)', async () => {
    const service = setUp({
      cabecera: cabeceraMock({ estado: 'anulada', ultimoPasoVisitado: 'calculation' }),
    });
    const sesion = await service.resolverEstadoSesion('2026-06', 'nom-1');
    expect(sesion.pasoVisitadoSugerido).toBeNull();
  });

  it('cuando la cabecera está cerrada, sugiere el paso visitado dentro del rango (closure es válido)', async () => {
    const service = setUp({
      cabecera: cabeceraMock({
        estado: 'cerrada',
        ultimoPasoVisitado: 'closure',
        // Para una nómina cerrada el contenido máximo debe estar al final.
        maximoPasoCompletado: 'closure',
      }),
    });
    const sesion = await service.resolverEstadoSesion('2026-06', 'nom-1');
    expect(sesion.pasoVisitadoSugerido).toBe('closure');
  });

  it('degrada a null si obtenerCabecera falla (no propaga el error)', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const service = setUp({ obtenerCabeceraError: new Error('boom') });
    const sesion = await service.resolverEstadoSesion('2026-06', 'nom-1');
    expect(sesion.pasoVisitadoSugerido).toBeNull();
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });
});
