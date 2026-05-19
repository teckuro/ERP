import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

import { PeriodoActivoService } from '../../../../../core/services/periodo-activo.service';
import { ProcesoMensualService } from '../../../services/proceso-mensual.service';
import { ProcesoMensualPeriodoStore } from './proceso-mensual-periodo.store';

describe('ProcesoMensualPeriodoStore rehidratacion', () => {
  const rehidratarPeriodo = vi.fn();

  beforeEach(() => {
    rehidratarPeriodo.mockReset();
    rehidratarPeriodo.mockResolvedValue({ snapshot: null, completo: null, liquidacionesGeneradas: 0 });

    TestBed.configureTestingModule({
      providers: [
        ProcesoMensualPeriodoStore,
        PeriodoActivoService,
        {
          provide: ProcesoMensualService,
          useValue: { rehidratarPeriodo },
        },
      ],
    });

    TestBed.inject(PeriodoActivoService).setPeriodoYm('2026-05');
  });

  async function storeTrasHidratacionInicial(): Promise<ProcesoMensualPeriodoStore> {
    const store = TestBed.inject(ProcesoMensualPeriodoStore);
    await vi.waitFor(() => expect(store.rehidratandoPeriodo()).toBe(false));
    rehidratarPeriodo.mockClear();
    return store;
  }

  it('rehidratarPeriodoActivo aplica snapshot sin limpiar antes de la respuesta', async () => {
    const store = await storeTrasHidratacionInicial();
    const snapshot = {
      idCalculoPeriodo: 9,
      periodo: '2026-05',
      idEmpresa: null,
      estado: 'preliminar' as const,
      fechaGeneracion: '2026-05-05T10:00:00.000Z',
      usuarioGenerador: null,
      totalTrabajadores: 2,
      totalHaberes: 1,
      totalDescuentos: 0,
      totalLiquido: 1,
      totalBloqueados: 0,
      totalAdvertencias: 0,
      versionMotor: 'MOTOR',
      hashSnapshot: 'hash-9',
      origen: 'preliminar' as const,
      activo: true,
      reemplazadoPor: null,
      aprobacionOperativa: null,
      cierreOperativo: null,
      trabajadores: [],
      issues: [],
      trazabilidad: [],
    };

    rehidratarPeriodo.mockImplementation(async (periodo: string) =>
      periodo === '2026-05'
        ? { snapshot, completo: null, liquidacionesGeneradas: 0 }
        : { snapshot: null, completo: null, liquidacionesGeneradas: 0 },
    );
    store.rehidratarPeriodoActivo('2026-05');
    await vi.waitFor(() => expect(store.snapshotActivo()?.hashSnapshot).toBe('hash-9'));

    expect(store.resultado()).toBeNull();
    expect(store.preNomina()).toBeNull();
  });

  it('sin snapshot limpia señales volátiles', async () => {
    TestBed.inject(PeriodoActivoService).setPeriodoYm('2026-06');
    const store = await storeTrasHidratacionInicial();

    rehidratarPeriodo.mockResolvedValueOnce({ snapshot: null, completo: null, liquidacionesGeneradas: 0 });
    store.rehidratarPeriodoActivo('2026-06');
    await vi.waitFor(() => expect(store.rehidratandoPeriodo()).toBe(false));

    expect(store.snapshotActivo()).toBeNull();
    expect(store.resultado()).toBeNull();
  });

  it('respuesta de período distinto no aplica snapshot', async () => {
    const store = await storeTrasHidratacionInicial();
    const periodo = TestBed.inject(PeriodoActivoService);
    let resolveLate: (value: { snapshot: unknown; completo: null }) => void = () => undefined;

    rehidratarPeriodo.mockImplementation((p: string) => {
      if (p === '2026-05') {
        return new Promise((resolve) => {
          resolveLate = resolve;
        });
      }
      return Promise.resolve({ snapshot: null, completo: null, liquidacionesGeneradas: 0 });
    });

    store.rehidratarPeriodoActivo('2026-05');
    periodo.setPeriodoYm('2026-06');
    await vi.waitFor(() => expect(store.rehidratandoPeriodo()).toBe(false));

    resolveLate({
      snapshot: {
        periodo: '2026-05',
        hashSnapshot: 'stale',
      },
      completo: null,
    });
    await Promise.resolve();

    expect(store.snapshotActivo()).toBeNull();
  });
});
