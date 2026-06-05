import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { EmpresaActivaService } from '../../../core/services/empresa-activa.service';
import { SUPABASE_CLIENT } from '../../../core/services/supabase.service';
import { NominaPeriodoRepository } from '../data-access/nomina-periodo.repository';
import type {
  IncidenciaNomina,
  NominaPeriodo,
  NominaPeriodoResumen,
  SegmentoNomina,
} from '../models/nomina-periodo.models';
import type {
  MovimientoNomina,
  MovimientoRecurrente,
} from '../models/movimiento-nomina.models';
import { NominaPeriodoService } from './nomina-periodo.service';
import { EmpleadosService } from '../../empleados/services/empleados.service';

function nomina(overrides: Partial<NominaPeriodo> = {}): NominaPeriodo {
  return {
    id: 'nom-1',
    periodo: '2026-06',
    empresaId: '7',
    empresaNombre: 'Demo',
    tipo: 'mensual',
    estado: 'dotacion_generada',
    segmentos: [],
    movimientos: [],
    incidencias: [],
    trabajadorIds: ['10', '11'],
    totalHaberes: 0,
    totalDescuentos: 0,
    totalLiquido: 0,
    createdAt: '2026-06-04T00:00:00.000Z',
    updatedAt: '2026-06-04T00:00:00.000Z',
    ...overrides,
  };
}

function segmento(overrides: Partial<SegmentoNomina> = {}): SegmentoNomina {
  return {
    id: 'seg-1',
    nominaPeriodoId: 'nom-1',
    nombre: 'Planta',
    tipo: 'planta',
    trabajadorIds: ['10', '11'],
    estado: 'borrador',
    totalTrabajadores: 2,
    totalIncidenciasCriticas: 0,
    totalAdvertencias: 0,
    ordinal: 1,
    createdAt: '2026-06-04T00:00:00.000Z',
    updatedAt: '2026-06-04T00:00:00.000Z',
    ...overrides,
  };
}

function recurrente(overrides: Partial<MovimientoRecurrente> = {}): MovimientoRecurrente {
  return {
    id: 'rec-1',
    empresaId: '7',
    tipo: 'BONO_FIJO',
    categoria: 'haber',
    monto: 50000,
    unidad: 'pesos',
    frecuencia: 'mensual',
    activoDesde: '2026-01-01',
    estado: 'activo',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

function fakeEmpresaActiva(idEmpresa: number | null) {
  const snap = idEmpresa != null
    ? signal({ idEmpresa, nombre: 'Demo', razonSocial: 'Demo S.A.', rut: '76', dv: 'K' })
    : signal(null);
  return {
    empresa: () => snap(),
    asegurarCargada: vi.fn().mockResolvedValue(snap()),
  } as unknown as EmpresaActivaService;
}

interface RepoMock {
  listarResumenes: ReturnType<typeof vi.fn>;
  obtenerCabecera: ReturnType<typeof vi.fn>;
  obtenerNominaCompleta: ReturnType<typeof vi.fn>;
  crear: ReturnType<typeof vi.fn>;
  actualizarEstado: ReturnType<typeof vi.fn>;
  transicionarEstado: ReturnType<typeof vi.fn>;
  invalidarCalculo: ReturnType<typeof vi.fn>;
  actualizarTotales: ReturnType<typeof vi.fn>;
  eliminarBorrador: ReturnType<typeof vi.fn>;
  listarSegmentos: ReturnType<typeof vi.fn>;
  obtenerSegmento: ReturnType<typeof vi.fn>;
  upsertSegmento: ReturnType<typeof vi.fn>;
  eliminarSegmento: ReturnType<typeof vi.fn>;
  listarRecurrentes: ReturnType<typeof vi.fn>;
  listarRecurrentesActivos: ReturnType<typeof vi.fn>;
  listarMovimientos: ReturnType<typeof vi.fn>;
  obtenerMovimiento: ReturnType<typeof vi.fn>;
  insertarMovimientos: ReturnType<typeof vi.fn>;
  actualizarEstadoMovimiento: ReturnType<typeof vi.fn>;
  listarIncidencias: ReturnType<typeof vi.fn>;
  reemplazarIncidencias: ReturnType<typeof vi.fn>;
  listarEventosAuditoria: ReturnType<typeof vi.fn>;
  registrarEventoAuditoria: ReturnType<typeof vi.fn>;
  listarDotacionPaginada: ReturnType<typeof vi.fn>;
}

function repoMock(): RepoMock {
  return {
    listarResumenes: vi.fn().mockResolvedValue([]),
    obtenerCabecera: vi.fn().mockResolvedValue(null),
    obtenerNominaCompleta: vi.fn().mockResolvedValue(null),
    crear: vi.fn(),
    actualizarEstado: vi.fn().mockResolvedValue(undefined),
    transicionarEstado: vi.fn().mockResolvedValue({}),
    invalidarCalculo: vi.fn().mockResolvedValue(undefined),
    actualizarTotales: vi.fn().mockResolvedValue(undefined),
    eliminarBorrador: vi.fn().mockResolvedValue(undefined),
    listarSegmentos: vi.fn().mockResolvedValue([]),
    obtenerSegmento: vi.fn().mockResolvedValue(null),
    upsertSegmento: vi.fn(),
    eliminarSegmento: vi.fn().mockResolvedValue(undefined),
    listarRecurrentes: vi.fn().mockResolvedValue([]),
    listarRecurrentesActivos: vi.fn().mockResolvedValue([]),
    listarMovimientos: vi.fn().mockResolvedValue([]),
    obtenerMovimiento: vi.fn().mockResolvedValue(null),
    insertarMovimientos: vi.fn().mockResolvedValue([]),
    actualizarEstadoMovimiento: vi.fn().mockResolvedValue(undefined),
    listarIncidencias: vi.fn().mockResolvedValue([]),
    reemplazarIncidencias: vi.fn().mockResolvedValue(undefined),
    listarEventosAuditoria: vi.fn().mockResolvedValue([]),
    registrarEventoAuditoria: vi.fn(),
    listarDotacionPaginada: vi.fn().mockResolvedValue({ filas: [], total: 0 }),
  };
}

function configurar(opts: {
  repo: RepoMock;
  empresaId?: number | null;
  supabase?: unknown;
}): NominaPeriodoService {
  const supabase = opts.supabase ?? {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        in: vi.fn().mockResolvedValue({ data: [], error: null }),
      }),
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ data: null, error: null }),
      }),
    }),
  };
  TestBed.resetTestingModule();
  const empresaId = opts.empresaId === undefined ? 7 : opts.empresaId;
  TestBed.configureTestingModule({
    providers: [
      NominaPeriodoService,
      { provide: NominaPeriodoRepository, useValue: opts.repo },
      { provide: EmpresaActivaService, useValue: fakeEmpresaActiva(empresaId) },
      { provide: SUPABASE_CLIENT, useValue: supabase },
      { provide: EmpleadosService, useValue: { listar: vi.fn().mockResolvedValue([]) } },
    ],
  });
  return TestBed.inject(NominaPeriodoService);
}

describe('NominaPeriodoService', () => {
  let repo: RepoMock;

  beforeEach(() => {
    repo = repoMock();
  });

  it('listarResumenes retorna lista del repo cuando hay empresa activa', async () => {
    const resumen: NominaPeriodoResumen = {
      id: 'nom-1',
      periodo: '2026-06',
      empresaId: '7',
      empresaNombre: 'Demo',
      tipo: 'mensual',
      estado: 'dotacion_generada',
      totalTrabajadores: 0,
      totalSegmentos: 0,
      totalHaberes: 0,
      totalDescuentos: 0,
      totalLiquido: 0,
      totalIncidenciasCriticas: 0,
      totalAdvertencias: 0,
      createdAt: '2026-06-04T00:00:00Z',
      updatedAt: '2026-06-04T00:00:00Z',
    };
    repo.listarResumenes.mockResolvedValue([resumen]);
    const service = configurar({ repo });
    const lista = await service.listarResumenes();
    expect(lista).toEqual([resumen]);
    expect(service.resumenes()).toEqual([resumen]);
  });

  it('listarResumenes retorna vacio cuando no hay empresa activa', async () => {
    const service = configurar({ repo, empresaId: null });
    const lista = await service.listarResumenes();
    expect(lista).toEqual([]);
    expect(repo.listarResumenes).not.toHaveBeenCalled();
  });

  it('crearNominaPeriodo delega en repo.crear con empresa activa', async () => {
    repo.crear.mockResolvedValue({ id: 'nom-1' });
    const service = configurar({ repo });
    await service.crearNominaPeriodo({ periodo: '2026-06', tipo: 'mensual' });
    expect(repo.crear).toHaveBeenCalledWith(
      expect.objectContaining({ periodo: '2026-06', tipo: 'mensual', empresaId: '7' }),
    );
  });

  it('crearNominaPeriodo lanza error si no hay empresa activa', async () => {
    const service = configurar({ repo, empresaId: null });
    await expect(
      service.crearNominaPeriodo({ periodo: '2026-06', tipo: 'mensual' }),
    ).rejects.toThrow(/empresa activa/i);
  });

  it('cerrarNomina actualiza estado y registra evento si hay motivo', async () => {
    repo.obtenerNominaCompleta.mockResolvedValue(nomina({
      estado: 'aprobada',
      evidenciaCalculo: {
        idCalculoPeriodo: 44,
        versionCalculo: 1,
        calculoVigente: true,
      },
    }));
    const service = configurar({ repo });
    await service.cerrarNomina('nom-1', { motivo: 'cierre regular' });
    expect(repo.transicionarEstado).toHaveBeenCalledWith(
      'nom-1',
      expect.objectContaining({ estadoEsperado: 'aprobada', estadoDestino: 'cerrada' }),
    );
    expect(repo.transicionarEstado).toHaveBeenCalledWith(
      'nom-1',
      expect.objectContaining({ motivo: 'cierre regular' }),
    );
  });

  it('reabrirNomina siempre registra evento (motivo obligatorio)', async () => {
    repo.obtenerNominaCompleta.mockResolvedValue(nomina({
      estado: 'cerrada',
      evidenciaCalculo: {
        idCalculoPeriodo: 44,
        versionCalculo: 1,
        calculoVigente: true,
      },
    }));
    const service = configurar({ repo });
    await service.reabrirNomina('nom-1', { motivo: 'rev externa' });
    expect(repo.transicionarEstado).toHaveBeenCalledWith(
      'nom-1',
      expect.objectContaining({ estadoEsperado: 'cerrada', estadoDestino: 'reabierta' }),
    );
    expect(repo.invalidarCalculo).toHaveBeenCalledWith('nom-1');
    expect(repo.transicionarEstado).toHaveBeenCalledWith(
      'nom-1',
      expect.objectContaining({ motivo: 'rev externa' }),
    );
  });

  it('omitirMovimiento marca el movimiento como omitido', async () => {
    repo.obtenerMovimiento.mockResolvedValue({
      id: 'mov-1',
      nominaPeriodoId: 'nom-1',
      trabajadorId: '10',
      tipo: 'BONO',
      categoria: 'haber',
      origen: 'manual',
      estado: 'aplicado',
      createdAt: '',
      updatedAt: '',
    });
    repo.obtenerNominaCompleta.mockResolvedValue(nomina({ estado: 'en_revision' }));
    const service = configurar({ repo });
    await service.omitirMovimiento('mov-1');
    expect(repo.actualizarEstadoMovimiento).toHaveBeenCalledWith('mov-1', 'omitido');
  });

  it('aplicarRecurrentesANomina respeta idempotencia (no duplica)', async () => {
    const movExistente: MovimientoNomina = {
      id: 'mov-exist',
      nominaPeriodoId: 'nom-1',
      trabajadorId: '10',
      tipo: 'BONO_FIJO',
      categoria: 'haber',
      monto: 50000,
      unidad: 'pesos',
      origen: 'recurrente',
      recurrenteId: 'rec-1',
      estado: 'aplicado',
      createdAt: '2026-06-04T00:00:00Z',
      updatedAt: '2026-06-04T00:00:00Z',
    };
    repo.obtenerNominaCompleta.mockResolvedValue(
      nomina({ trabajadorIds: ['10', '11'], movimientos: [movExistente] }),
    );
    repo.listarRecurrentesActivos.mockResolvedValue([recurrente()]);
    repo.listarMovimientos.mockResolvedValue([movExistente]);
    repo.insertarMovimientos.mockResolvedValue([]);

    const service = configurar({ repo });
    await service.aplicarRecurrentesANomina('nom-1');

    const llamada = repo.insertarMovimientos.mock.calls[0]?.[0] ?? [];
    expect(llamada).toHaveLength(1);
    expect(llamada[0].trabajadorId).toBe('11');
  });

  it('aplicarRecurrentesANomina respeta movimientos omitidos (no reaplica)', async () => {
    const movOmitido: MovimientoNomina = {
      id: 'mov-omit',
      nominaPeriodoId: 'nom-1',
      trabajadorId: '10',
      tipo: 'BONO_FIJO',
      categoria: 'haber',
      monto: 50000,
      origen: 'recurrente',
      recurrenteId: 'rec-1',
      estado: 'omitido',
      createdAt: '2026-06-04T00:00:00Z',
      updatedAt: '2026-06-04T00:00:00Z',
    };
    repo.obtenerNominaCompleta.mockResolvedValue(
      nomina({ trabajadorIds: ['10'], movimientos: [movOmitido] }),
    );
    repo.listarRecurrentesActivos.mockResolvedValue([recurrente()]);
    repo.listarMovimientos.mockResolvedValue([movOmitido]);

    const service = configurar({ repo });
    await service.aplicarRecurrentesANomina('nom-1');
    expect(repo.insertarMovimientos).not.toHaveBeenCalled();
  });

  it('obtenerResumenValidacionNomina bloquea cierre con incidencia bloqueante', async () => {
    const incidencia: IncidenciaNomina = {
      id: 'inc-1',
      nominaPeriodoId: 'nom-1',
      severidad: 'critica',
      tipo: 't',
      mensaje: 'fatal',
      trabajadorId: '10',
      bloqueante: true,
    };
    repo.obtenerNominaCompleta.mockResolvedValue(
      nomina({ trabajadorIds: ['10', '11'], incidencias: [incidencia] }),
    );
    const service = configurar({ repo });
    const resumen = await service.obtenerResumenValidacionNomina('nom-1');
    expect(resumen.puedeCalcular).toBe(false);
    expect(resumen.puedeCerrar).toBe(false);
    expect(resumen.conIncidenciasCriticas).toBe(1);
  });

  it('obtenerResumenValidacionNomina permite calcular pero no cerrar sin cálculo vigente', async () => {
    const incidencia: IncidenciaNomina = {
      id: 'inc-adv',
      nominaPeriodoId: 'nom-1',
      severidad: 'advertencia',
      tipo: 't',
      mensaje: 'leve',
      trabajadorId: '10',
      bloqueante: false,
    };
    repo.obtenerNominaCompleta.mockResolvedValue(
      nomina({ trabajadorIds: ['10'], incidencias: [incidencia] }),
    );
    const service = configurar({ repo });
    const resumen = await service.obtenerResumenValidacionNomina('nom-1');
    expect(resumen.puedeCalcular).toBe(true);
    expect(resumen.puedeCerrar).toBe(false);
  });

  it('validarDuplicidadTrabajadorSegmento detecta trabajadores en >1 segmento', async () => {
    repo.listarSegmentos.mockResolvedValue([
      segmento({ id: 'seg-1', trabajadorIds: ['10'] }),
      segmento({ id: 'seg-2', trabajadorIds: ['10', '11'] }),
    ]);
    const service = configurar({ repo });
    const incidencias = await service.validarDuplicidadTrabajadorSegmento('nom-1');
    expect(incidencias).toHaveLength(1);
    expect(incidencias[0].trabajadorId).toBe('10');
    expect(incidencias[0].bloqueante).toBe(true);
  });

  it('consolidarSegmentosParaCalculo retorna bloqueado cuando hay criticas', async () => {
    repo.obtenerNominaCompleta.mockResolvedValue(
      nomina({
        segmentos: [segmento()],
        incidencias: [{
          id: 'inc-1',
          nominaPeriodoId: 'nom-1',
          severidad: 'critica',
          tipo: 't',
          mensaje: 'm',
          bloqueante: true,
        }],
      }),
    );
    const service = configurar({ repo });
    const resultado = await service.consolidarSegmentosParaCalculo('nom-1');
    expect(resultado.estado).toBe('bloqueado');
  });
});
