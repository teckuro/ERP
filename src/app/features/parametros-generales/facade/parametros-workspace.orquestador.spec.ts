import { ChangeDetectorRef, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it, vi } from 'vitest';

import { PeriodoActivoService } from '../../../core/services/periodo-activo.service';
import { ParametrosGeneralesService } from '../services/parametros-generales.service';
import { ParametrosPresentacionFacade } from './parametros-presentacion.facade';
import { ParametrosWorkspaceOrquestador } from './parametros-workspace.orquestador';

describe('ParametrosWorkspaceOrquestador', () => {
  const setPeriodoYm = vi.fn();

  function crearOrquestador(periodo = '2026-05') {
    TestBed.configureTestingModule({
      providers: [
        ParametrosPresentacionFacade,
        ParametrosWorkspaceOrquestador,
        {
          provide: ParametrosGeneralesService,
          useValue: {
            listarPeriodos: vi.fn().mockResolvedValue([]),
            listarPeriodosConDatosMensuales: vi.fn().mockResolvedValue([]),
          },
        },
        {
          provide: PeriodoActivoService,
          useValue: { periodoYm: signal(periodo), setPeriodoYm },
        },
        {
          provide: ChangeDetectorRef,
          useValue: { markForCheck: vi.fn(), detectChanges: vi.fn() },
        },
      ],
    });

    const orq = TestBed.inject(ParametrosWorkspaceOrquestador);
    const presentacion = TestBed.inject(ParametrosPresentacionFacade);
    presentacion.seleccionarPeriodo(periodo);
    return orq;
  }

  it('gridPersistenceKey incluye el periodo seleccionado', () => {
    const orq = crearOrquestador('2026-03');
    expect(orq.gridPersistenceKey('parametros.ccaf')).toBe('parametros.ccaf.2026-03');
  });

  it('seleccionarPeriodo sincroniza el periodo global', async () => {
    setPeriodoYm.mockClear();
    const orq = crearOrquestador('2025-11');
    await orq.seleccionarPeriodo('2026-01');
    expect(setPeriodoYm).toHaveBeenCalledWith('2026-01');
  });

  it('seleccionarTab delega en presentacion', () => {
    const orq = crearOrquestador();
    const presentacion = TestBed.inject(ParametrosPresentacionFacade);
    orq.seleccionarTab('salud');
    expect(presentacion.activeTab()).toBe('salud');
    expect(presentacion.activeArea()).toBe('catalogosVigencias');
  });

  it('inicia en area Cierre del periodo', () => {
    const orq = crearOrquestador();
    expect(orq.activeArea()).toBe('cierrePeriodo');
  });

  it('money y decimal formatean valores nulos como guion', () => {
    const orq = crearOrquestador();
    expect(orq.money(null)).toBe('—');
    expect(orq.decimal(null)).toBe('—');
  });
});
