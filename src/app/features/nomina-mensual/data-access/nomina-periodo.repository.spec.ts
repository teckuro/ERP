import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { SUPABASE_CLIENT } from '../../../core/services/supabase.service';
import { NominaPeriodoRepository } from './nomina-periodo.repository';

interface FakeBuilder {
  select: ReturnType<typeof vi.fn>;
  insert: ReturnType<typeof vi.fn>;
  upsert: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
  eq: ReturnType<typeof vi.fn>;
  is: ReturnType<typeof vi.fn>;
  in: ReturnType<typeof vi.fn>;
  order: ReturnType<typeof vi.fn>;
  maybeSingle: ReturnType<typeof vi.fn>;
  single: ReturnType<typeof vi.fn>;
  then: ReturnType<typeof vi.fn>;
  __resolved?: { data?: unknown; error?: unknown };
}

function makeBuilder(opts: { data?: unknown; error?: unknown } = { data: [], error: null }): FakeBuilder {
  const b: FakeBuilder = {
    select: vi.fn(),
    insert: vi.fn(),
    upsert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    eq: vi.fn(),
    is: vi.fn(),
    in: vi.fn(),
    order: vi.fn(),
    maybeSingle: vi.fn(),
    single: vi.fn(),
    then: vi.fn(),
  };
  b.__resolved = opts;
  b.select.mockReturnValue(b);
  b.insert.mockReturnValue(b);
  b.upsert.mockReturnValue(b);
  b.update.mockReturnValue(b);
  b.delete.mockReturnValue(b);
  b.eq.mockReturnValue(b);
  b.is.mockReturnValue(b);
  b.in.mockReturnValue(b);
  b.order.mockReturnValue(b);
  b.maybeSingle.mockResolvedValue(opts);
  b.single.mockResolvedValue(opts);
  b.then.mockImplementation((onFulfilled: (v: { data: unknown; error: unknown }) => unknown) =>
    Promise.resolve(onFulfilled({ data: opts.data ?? [], error: opts.error ?? null })),
  );
  return b;
}

const FILA_NOMINA = {
  id: 'nom-uuid-1',
  id_empresa: 7,
  empresa_nombre: 'Demo',
  periodo: '2026-06',
  tipo: 'mensual',
  estado: 'borrador',
  fecha_inicio: '2026-06-01',
  fecha_fin: '2026-06-30',
  naturaleza: 'liquidacion_legal',
  codigo_ciclo: '2026-06-MES',
  plantilla_ciclo_id: null,
  nomina_origen_id: null,
  version_estado: 0,
  total_trabajadores: 12,
  total_segmentos: 1,
  total_haberes: 0,
  total_descuentos: 0,
  total_liquido: 0,
  total_incidencias_criticas: 0,
  total_advertencias: 0,
  fecha_pago: null,
  closed_at: null,
  created_at: '2026-06-04T00:00:00.000Z',
  updated_at: '2026-06-04T00:00:00.000Z',
};

describe('NominaPeriodoRepository', () => {
  let repo: NominaPeriodoRepository;
  let from: ReturnType<typeof vi.fn>;
  let rpc: ReturnType<typeof vi.fn>;

  function setSupabase(handler: (tabla: string) => FakeBuilder, rpcResult: { data?: unknown; error?: unknown } = { data: null, error: null }) {
    from = vi.fn().mockImplementation(handler);
    rpc = vi.fn().mockResolvedValue(rpcResult);
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        NominaPeriodoRepository,
        { provide: SUPABASE_CLIENT, useValue: { from, rpc } },
      ],
    });
    repo = TestBed.inject(NominaPeriodoRepository);
  }

  beforeEach(() => {
    setSupabase(() => makeBuilder({ data: [FILA_NOMINA], error: null }));
  });

  it('listarResumenes filtra por id_empresa y ordena por periodo desc', async () => {
    const builder = makeBuilder({ data: [FILA_NOMINA], error: null });
    setSupabase(() => builder);
    const resumenes = await repo.listarResumenes(7);

    expect(from).toHaveBeenCalledWith('nomina_periodo');
    expect(builder.eq).toHaveBeenCalledWith('id_empresa', 7);
    expect(builder.order).toHaveBeenCalledWith('periodo', { ascending: false });
    expect(resumenes).toHaveLength(1);
    expect(resumenes[0]).toMatchObject({ id: 'nom-uuid-1', empresaId: '7' });
  });

  it('transicionarEstado envia la version esperada a la RPC', async () => {
    setSupabase(
      () => makeBuilder({ data: null, error: null }),
      { data: FILA_NOMINA, error: null },
    );

    await repo.transicionarEstado('nom-uuid-1', {
      estadoEsperado: 'borrador',
      estadoDestino: 'dotacion_generada',
      versionEstadoEsperada: 4,
    });

    expect(rpc).toHaveBeenCalledWith(
      'transicionar_nomina_periodo',
      expect.objectContaining({ p_version_estado_esperada: 4 }),
    );
  });

  it('actualizarTotales no envia update vacio cuando no hay totales', async () => {
    const builder = makeBuilder({ data: null, error: null });
    setSupabase(() => builder);
    await repo.actualizarTotales('nom-uuid-1', {});
    expect(builder.update).not.toHaveBeenCalled();
  });

  it('obtenerNominaCompleta ensambla cabecera + segmentos + movimientos + incidencias', async () => {
    const builderCab = makeBuilder({ data: FILA_NOMINA, error: null });
    const builderSeg = makeBuilder({ data: [], error: null });
    const builderMov = makeBuilder({ data: [], error: null });
    const builderInc = makeBuilder({ data: [], error: null });

    let llamadas = 0;
    const builders = [builderCab, builderSeg, builderMov, builderInc];
    setSupabase(() => builders[llamadas++]);

    const nomina = await repo.obtenerNominaCompleta('nom-uuid-1');
    expect(nomina?.id).toBe('nom-uuid-1');
    expect(nomina?.segmentos).toEqual([]);
    expect(nomina?.trabajadorIds).toEqual([]);
  });

  it('eliminarSegmento usa delete + eq por id', async () => {
    const builder = makeBuilder({ data: null, error: null });
    setSupabase(() => builder);
    await repo.eliminarSegmento('seg-1');
    expect(builder.delete).toHaveBeenCalled();
    expect(builder.eq).toHaveBeenCalledWith('id', 'seg-1');
  });

  describe('eliminarNomina (hard-delete vía RPC eliminar_nomina_completa)', () => {
    it('invoca el RPC con el id de la nómina y no toca la tabla directamente', async () => {
      setSupabase(
        () => makeBuilder({ data: null, error: null }),
        {
          data: {
            ok: true,
            nomina_id: 'nom-uuid-1',
            empresa_id: 7,
            periodo: '2026-06',
            estado_previo: 'borrador',
            calculos_borrados: 1,
            segmentos_borrados: 2,
            movimientos_borrados: 3,
            incidencias_borradas: 0,
          },
          error: null,
        },
      );
      await repo.eliminarNomina('nom-uuid-1');
      expect(rpc).toHaveBeenCalledWith('eliminar_nomina_completa', {
        p_nomina_id: 'nom-uuid-1',
      });
      expect(from).not.toHaveBeenCalledWith('nomina_periodo');
    });

    it('propaga el mensaje humano del RPC tal cual (estado no eliminable)', async () => {
      setSupabase(
        () => makeBuilder({ data: null, error: null }),
        {
          data: null,
          error: {
            message:
              'No se puede eliminar una nómina en estado "calculada". Solo se permite eliminar borradores, nóminas con dotación generada, en revisión o anuladas. Reabre primero las cerradas para corregir.',
          },
        },
      );
      await expect(repo.eliminarNomina('nom-calc')).rejects.toThrow(
        /No se puede eliminar una n[oó]mina en estado "calculada"/i,
      );
    });

    it('propaga bloqueo por liquidaciones generadas sin agregar prefijo técnico', async () => {
      setSupabase(
        () => makeBuilder({ data: null, error: null }),
        {
          data: null,
          error: {
            message:
              'No se puede eliminar: existen liquidaciones generadas para 7 2026-06. Anula primero las liquidaciones oficiales.',
          },
        },
      );
      await expect(repo.eliminarNomina('nom-with-liq')).rejects.toThrow(
        /existen liquidaciones generadas/i,
      );
      await expect(repo.eliminarNomina('nom-with-liq')).rejects.not.toThrow(
        /^eliminarNomina:/,
      );
    });

    it('propaga bloqueo por preparaciones referenciando los cálculos', async () => {
      setSupabase(
        () => makeBuilder({ data: null, error: null }),
        {
          data: null,
          error: {
            message:
              'No se puede eliminar: existen preparaciones de nómina referenciando los cálculos de 7 2026-06.',
          },
        },
      );
      await expect(repo.eliminarNomina('nom-with-prep')).rejects.toThrow(
        /existen preparaciones de n[oó]mina/i,
      );
    });
  });

  it('listarIncidencias filtra por id_nomina_periodo y estado_decision pendiente', async () => {
    const builder = makeBuilder({ data: [], error: null });
    setSupabase(() => builder);
    await repo.listarIncidencias('nom-uuid-1');
    expect(builder.eq).toHaveBeenCalledWith('id_nomina_periodo', 'nom-uuid-1');
    expect(builder.eq).toHaveBeenCalledWith('estado_decision', 'pendiente');
  });

  it('reemplazarIncidencias borra existentes y reinserta', async () => {
    const builder = makeBuilder({ data: null, error: null });
    setSupabase(() => builder);

    await repo.reemplazarIncidencias('nom-uuid-1', [
      {
        id: 'inc-1',
        nominaPeriodoId: 'nom-uuid-1',
        severidad: 'critica',
        tipo: 't',
        mensaje: 'm',
        bloqueante: true,
        estadoDecision: 'pendiente',
      },
    ]);

    expect(builder.delete).toHaveBeenCalled();
    expect(builder.insert).toHaveBeenCalled();
  });

  it('lanza error claro cuando supabase falla', async () => {
    const builder = makeBuilder({ data: null, error: { message: 'denied' } });
    setSupabase(() => builder);
    await expect(repo.listarResumenes(7)).rejects.toThrow(/listarResumenes: denied/);
  });

  it('actualizarUltimoPasoVisitado invoca el RPC con los parámetros correctos', async () => {
    setSupabase(() => makeBuilder({ data: null, error: null }));
    await repo.actualizarUltimoPasoVisitado('nom-uuid-1', 'calculation');
    expect(rpc).toHaveBeenCalledWith('actualizar_paso_visitado_nomina', {
      p_nomina_id: 'nom-uuid-1',
      p_paso: 'calculation',
    });
  });

  it('actualizarUltimoPasoVisitado propaga el error con contexto cuando el RPC falla', async () => {
    setSupabase(() => makeBuilder({ data: null, error: null }), { data: null, error: { message: 'rpc not found' } });
    await expect(
      repo.actualizarUltimoPasoVisitado('nom-uuid-1', 'closure'),
    ).rejects.toThrow(/actualizarUltimoPasoVisitado: rpc not found/);
  });

  it('actualizarMaximoPasoCompletado invoca el RPC monótono con los parámetros correctos', async () => {
    setSupabase(() => makeBuilder({ data: null, error: null }));
    await repo.actualizarMaximoPasoCompletado('nom-uuid-1', 'calculation');
    expect(rpc).toHaveBeenCalledWith('actualizar_maximo_paso_completado_nomina', {
      p_nomina_id: 'nom-uuid-1',
      p_paso: 'calculation',
    });
  });

  it('actualizarMaximoPasoCompletado propaga el error con contexto cuando el RPC falla', async () => {
    setSupabase(() => makeBuilder({ data: null, error: null }), { data: null, error: { message: 'rpc fail' } });
    await expect(
      repo.actualizarMaximoPasoCompletado('nom-uuid-1', 'closure'),
    ).rejects.toThrow(/actualizarMaximoPasoCompletado: rpc fail/);
  });
});
