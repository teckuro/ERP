import { TestBed } from '@angular/core/testing';
import { describe, expect, it, vi, beforeEach } from 'vitest';

import { AuthService } from '../../../core/auth/auth.service';
import { PeriodoActivoService } from '../../../core/services/periodo-activo.service';
import { NominaCalculoSnapshotRepository } from '../../nomina-mensual/data-access/nomina-calculo-snapshot.repository';
import { ParametrosGeneralesService } from '../../parametros-generales/services/parametros-generales.service';
import type { NominaParametrosResumen } from '../models/nomina-parametros-resumen.models';
import { NominaParametrosBaseService } from './nomina-parametros-base.service';

function resumenMinimo(): NominaParametrosResumen {
  return {
    periodo: '2026-05',
    completitud: 100,
    completitudSecciones: 100,
    seccionesTotales: 5,
    seccionesListas: 5,
    controlesTotales: 10,
    controlesVerificados: 10,
    totalParametros: 10,
    parametrosConfigurados: 10,
    bloqueos: 0,
    requiereRevision: 0,
    completos: 10,
    puedeContinuar: true,
    ultimaActualizacion: null,
    areas: [],
    bloqueosActuales: [],
    accesos: [],
  };
}

describe('NominaParametrosBaseService', () => {
  const obtenerSnapshotParametrosBase = vi.fn();
  const listarParametrosSnapshot = vi.fn();
  const actualizarMetadataParametrosBase = vi.fn();
  const guardarSnapshotParametrosBase = vi.fn();
  const obtenerUltimoHastaPeriodo = vi.fn();

  beforeEach(() => {
    obtenerSnapshotParametrosBase.mockReset();
    listarParametrosSnapshot.mockReset();
    actualizarMetadataParametrosBase.mockReset();
    guardarSnapshotParametrosBase.mockReset();
    obtenerUltimoHastaPeriodo.mockReset();

    obtenerSnapshotParametrosBase.mockResolvedValue({
      idCalculoPeriodo: 7,
      periodo: '2026-05',
      fechaGeneracion: '2026-05-29T10:00:00.000Z',
      metadataOperativa: { tipoSnapshot: 'parametrosBase', origenAlGuardar: 'recienGuardada' },
    });
    listarParametrosSnapshot.mockResolvedValue([
      { grupo: 'parametros_generales', clave: 'uf', valor: '39000', valorNumerico: null, vigencia: '2026-05-01', origen: 'pg' },
    ]);
    obtenerUltimoHastaPeriodo.mockResolvedValue({ periodo: '2026-05', uf: 39100 });
    actualizarMetadataParametrosBase.mockResolvedValue(undefined);
    guardarSnapshotParametrosBase.mockResolvedValue({
      snapshot: { idCalculoPeriodo: 8, fechaGeneracion: '2026-05-30T12:00:00.000Z' },
      reemplazoAnterior: true,
    });

    TestBed.configureTestingModule({
      providers: [
        NominaParametrosBaseService,
        { provide: NominaCalculoSnapshotRepository, useValue: {
          obtenerSnapshotParametrosBase,
          listarParametrosSnapshot,
          actualizarMetadataParametrosBase,
          guardarSnapshotParametrosBase,
        } },
        { provide: ParametrosGeneralesService, useValue: { obtenerUltimoHastaPeriodo } },
        { provide: PeriodoActivoService, useValue: { periodoYm: () => '2026-05' } },
        { provide: AuthService, useValue: { currentUser: () => null, getSession: vi.fn().mockResolvedValue(null) } },
      ],
    });
  });

  it('registrarMantenerBaseConDiferencias persiste metadata sin guardar snapshot nuevo', async () => {
    const service = TestBed.inject(NominaParametrosBaseService);
    await service.registrarMantenerBaseConDiferencias(7, resumenMinimo());

    expect(actualizarMetadataParametrosBase).toHaveBeenCalledTimes(1);
    expect(actualizarMetadataParametrosBase.mock.calls[0][0]).toBe(7);
    const metadata = actualizarMetadataParametrosBase.mock.calls[0][1] as Record<string, unknown>;
    expect(metadata['origenAlGuardar']).toBe('existenteMantenidaConDiferencias');
    expect(guardarSnapshotParametrosBase).not.toHaveBeenCalled();
  });

  it('registrarMantenerBaseConDiferencias falla si el id ya no es vigente', async () => {
    obtenerSnapshotParametrosBase.mockResolvedValueOnce({
      idCalculoPeriodo: 99,
      periodo: '2026-05',
      metadataOperativa: { tipoSnapshot: 'parametrosBase' },
    });
    listarParametrosSnapshot.mockResolvedValueOnce([
      { grupo: 'g', clave: 'uf', valor: '1', valorNumerico: null, vigencia: null, origen: 'pg' },
    ]);
    obtenerUltimoHastaPeriodo.mockResolvedValueOnce({ periodo: '2026-05', uf: 2 });

    const service = TestBed.inject(NominaParametrosBaseService);
    await expect(service.registrarMantenerBaseConDiferencias(7, resumenMinimo())).rejects.toThrow(
      /ya no es la vigente/,
    );
  });

  it('actualizarSnapshotParametrosBase reemplaza snapshot con origen actualizadaExplicitamente', async () => {
    const service = TestBed.inject(NominaParametrosBaseService);
    const result = await service.actualizarSnapshotParametrosBase(resumenMinimo());

    expect(guardarSnapshotParametrosBase).toHaveBeenCalledTimes(1);
    const metadata = guardarSnapshotParametrosBase.mock.calls[0][1] as Record<string, unknown>;
    expect(metadata['origenAlGuardar']).toBe('actualizadaExplicitamente');
    expect(result.idCalculoPeriodoBase).toBe(8);
  });
});
