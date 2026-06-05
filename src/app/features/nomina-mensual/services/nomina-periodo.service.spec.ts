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
  actualizarUltimoPasoVisitado: ReturnType<typeof vi.fn>;
  actualizarMaximoPasoCompletado: ReturnType<typeof vi.fn>;
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
    actualizarUltimoPasoVisitado: vi.fn().mockResolvedValue(undefined),
    actualizarMaximoPasoCompletado: vi.fn().mockResolvedValue(undefined),
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

  describe('registrarPasoVisitado', () => {
    it('persiste el paso vía repo en la primera llamada', async () => {
      const service = configurar({ repo });
      await service.registrarPasoVisitado('nom-1', 'calculation');
      expect(repo.actualizarUltimoPasoVisitado).toHaveBeenCalledTimes(1);
      expect(repo.actualizarUltimoPasoVisitado).toHaveBeenCalledWith('nom-1', 'calculation');
    });

    it('hace dedupe: dos llamadas consecutivas con el mismo paso solo invocan el RPC una vez', async () => {
      const service = configurar({ repo });
      await service.registrarPasoVisitado('nom-1', 'movements');
      await service.registrarPasoVisitado('nom-1', 'movements');
      expect(repo.actualizarUltimoPasoVisitado).toHaveBeenCalledTimes(1);
    });

    it('vuelve a invocar el RPC si cambia el paso', async () => {
      const service = configurar({ repo });
      await service.registrarPasoVisitado('nom-1', 'movements');
      await service.registrarPasoVisitado('nom-1', 'calculation');
      expect(repo.actualizarUltimoPasoVisitado).toHaveBeenCalledTimes(2);
    });

    it('mantiene el dedupe por nómina (cada id tiene su propio último paso)', async () => {
      const service = configurar({ repo });
      await service.registrarPasoVisitado('nom-1', 'movements');
      await service.registrarPasoVisitado('nom-2', 'movements');
      expect(repo.actualizarUltimoPasoVisitado).toHaveBeenCalledTimes(2);
    });

    it('traga errores del repo y no rompe la promesa', async () => {
      repo.actualizarUltimoPasoVisitado.mockRejectedValueOnce(new Error('RPC missing'));
      const service = configurar({ repo });
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
      await expect(
        service.registrarPasoVisitado('nom-1', 'closure'),
      ).resolves.toBeUndefined();
      expect(warnSpy).toHaveBeenCalled();
      warnSpy.mockRestore();
    });

    it('al fallar permite reintentar con el mismo paso (no queda el dedupe pegado)', async () => {
      repo.actualizarUltimoPasoVisitado.mockRejectedValueOnce(new Error('boom'));
      const service = configurar({ repo });
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
      await service.registrarPasoVisitado('nom-1', 'closure');
      await service.registrarPasoVisitado('nom-1', 'closure');
      expect(repo.actualizarUltimoPasoVisitado).toHaveBeenCalledTimes(2);
      warnSpy.mockRestore();
    });

    it('ignora invocaciones con nominaId o paso vacíos', async () => {
      const service = configurar({ repo });
      await service.registrarPasoVisitado('', 'movements');
      await service.registrarPasoVisitado('nom-1', '' as never);
      expect(repo.actualizarUltimoPasoVisitado).not.toHaveBeenCalled();
    });
  });

  describe('registrarPasoCompletado (monótono creciente)', () => {
    it('persiste el paso vía repo en la primera llamada', async () => {
      const service = configurar({ repo });
      await service.registrarPasoCompletado('nom-1', 'calculation');
      expect(repo.actualizarMaximoPasoCompletado).toHaveBeenCalledTimes(1);
      expect(repo.actualizarMaximoPasoCompletado).toHaveBeenCalledWith('nom-1', 'calculation');
    });

    it('dedupe monótono: si el paso es igual o menor al último registrado, no invoca el RPC', async () => {
      const service = configurar({ repo });
      await service.registrarPasoCompletado('nom-1', 'movements');
      await service.registrarPasoCompletado('nom-1', 'movements');
      await service.registrarPasoCompletado('nom-1', 'dotacion');
      expect(repo.actualizarMaximoPasoCompletado).toHaveBeenCalledTimes(1);
    });

    it('vuelve a invocar el RPC cuando el paso avanza', async () => {
      const service = configurar({ repo });
      await service.registrarPasoCompletado('nom-1', 'movements');
      await service.registrarPasoCompletado('nom-1', 'calculation');
      await service.registrarPasoCompletado('nom-1', 'closure');
      expect(repo.actualizarMaximoPasoCompletado).toHaveBeenCalledTimes(3);
    });

    it('mantiene el dedupe por nómina (cada id tiene su propio máximo)', async () => {
      const service = configurar({ repo });
      await service.registrarPasoCompletado('nom-1', 'calculation');
      await service.registrarPasoCompletado('nom-2', 'dotacion');
      expect(repo.actualizarMaximoPasoCompletado).toHaveBeenCalledTimes(2);
    });

    it('traga errores del repo y no rompe la promesa', async () => {
      repo.actualizarMaximoPasoCompletado.mockRejectedValueOnce(new Error('RPC missing'));
      const service = configurar({ repo });
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
      await expect(
        service.registrarPasoCompletado('nom-1', 'closure'),
      ).resolves.toBeUndefined();
      expect(warnSpy).toHaveBeenCalled();
      warnSpy.mockRestore();
    });

    it('al fallar permite reintentar con el mismo paso (no queda el dedupe pegado)', async () => {
      repo.actualizarMaximoPasoCompletado.mockRejectedValueOnce(new Error('boom'));
      const service = configurar({ repo });
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
      await service.registrarPasoCompletado('nom-1', 'closure');
      await service.registrarPasoCompletado('nom-1', 'closure');
      expect(repo.actualizarMaximoPasoCompletado).toHaveBeenCalledTimes(2);
      warnSpy.mockRestore();
    });

    it('ignora invocaciones con nominaId o paso vacíos', async () => {
      const service = configurar({ repo });
      await service.registrarPasoCompletado('', 'movements');
      await service.registrarPasoCompletado('nom-1', '' as never);
      expect(repo.actualizarMaximoPasoCompletado).not.toHaveBeenCalled();
    });
  });

  describe('agregarTrabajadoresANomina', () => {
    it('agrega ids al segmento principal y deduplica los existentes', async () => {
      repo.obtenerNominaCompleta.mockResolvedValue(
        nomina({
          estado: 'dotacion_generada',
          segmentos: [
            segmento({ id: 'seg-1', trabajadorIds: ['10', '11'], ordinal: 1 }),
            segmento({ id: 'seg-2', trabajadorIds: ['12'], ordinal: 2 }),
          ],
        }),
      );
      repo.upsertSegmento.mockImplementation((s: SegmentoNomina) =>
        Promise.resolve(s),
      );
      const service = configurar({ repo });

      const resultado = await service.agregarTrabajadoresANomina('nom-1', [
        '10',
        '20',
        '21',
      ]);

      expect(resultado.agregados.sort()).toEqual(['20', '21']);
      expect(resultado.yaEstaban).toEqual(['10']);
      expect(repo.upsertSegmento).toHaveBeenCalledTimes(1);
      const segmentoUpsertado = repo.upsertSegmento.mock.calls[0][0] as SegmentoNomina;
      expect(segmentoUpsertado.id).toBe('seg-1');
      expect(segmentoUpsertado.trabajadorIds.sort()).toEqual([
        '10',
        '11',
        '20',
        '21',
      ]);
      expect(repo.actualizarTotales).toHaveBeenCalledWith('nom-1', {
        totalTrabajadores: 5,
      });
    });

    it('crea un segmento "Dotación principal" si no hay segmentos', async () => {
      repo.obtenerNominaCompleta.mockResolvedValue(
        nomina({ estado: 'borrador', segmentos: [], trabajadorIds: [] }),
      );
      repo.upsertSegmento.mockImplementation((s: SegmentoNomina) =>
        Promise.resolve(s),
      );
      const service = configurar({ repo });

      await service.agregarTrabajadoresANomina('nom-1', ['30', '31']);

      expect(repo.upsertSegmento).toHaveBeenCalledTimes(1);
      const segmentoCreado = repo.upsertSegmento.mock.calls[0][0] as SegmentoNomina;
      expect(segmentoCreado.id).toBe('');
      expect(segmentoCreado.nombre).toBe('Dotación principal');
      expect(segmentoCreado.trabajadorIds.sort()).toEqual(['30', '31']);
      expect(repo.transicionarEstado).toHaveBeenCalledWith('nom-1', {
        estadoEsperado: 'borrador',
        estadoDestino: 'dotacion_generada',
      });
    });

    it('no toca el repo si todos los ids ya estaban en la nómina', async () => {
      repo.obtenerNominaCompleta.mockResolvedValue(
        nomina({
          estado: 'dotacion_generada',
          segmentos: [
            segmento({ id: 'seg-1', trabajadorIds: ['10', '11'], ordinal: 1 }),
          ],
        }),
      );
      const service = configurar({ repo });

      const resultado = await service.agregarTrabajadoresANomina('nom-1', ['10', '11']);

      expect(resultado).toEqual({ agregados: [], yaEstaban: ['10', '11'] });
      expect(repo.upsertSegmento).not.toHaveBeenCalled();
      expect(repo.actualizarTotales).not.toHaveBeenCalled();
    });

    it('devuelve estructura vacía si la lista está vacía', async () => {
      const service = configurar({ repo });
      const resultado = await service.agregarTrabajadoresANomina('nom-1', []);
      expect(resultado).toEqual({ agregados: [], yaEstaban: [] });
      expect(repo.obtenerNominaCompleta).not.toHaveBeenCalled();
    });

    it('lanza si no hay empresa activa', async () => {
      const service = configurar({ repo, empresaId: null });
      await expect(
        service.agregarTrabajadoresANomina('nom-1', ['10']),
      ).rejects.toThrow(/empresa activa/i);
    });

    it('invalida el cálculo si la nómina ya tenía un cálculo vigente', async () => {
      repo.obtenerNominaCompleta.mockResolvedValue(
        nomina({
          estado: 'calculada',
          segmentos: [segmento({ id: 'seg-1', trabajadorIds: ['10'], ordinal: 1 })],
          evidenciaCalculo: {
            idCalculoPeriodo: 1,
            versionCalculo: 1,
            calculoVigente: true,
          },
        }),
      );
      repo.upsertSegmento.mockImplementation((s: SegmentoNomina) =>
        Promise.resolve(s),
      );
      const service = configurar({ repo });

      await service.agregarTrabajadoresANomina('nom-1', ['20']);

      expect(repo.invalidarCalculo).toHaveBeenCalledWith('nom-1');
      // No re-transiciona a dotacion_generada si ya estaba en calculada (solo
      // cambia a en_revision como efecto de invalidarCalculoPorCambio).
      const transicionesADotacion = (repo.transicionarEstado.mock.calls as unknown[][]).filter(
        (call) => {
          const arg = call[1] as { estadoDestino?: string } | undefined;
          return arg?.estadoDestino === 'dotacion_generada';
        },
      );
      expect(transicionesADotacion).toHaveLength(0);
    });
  });
});
