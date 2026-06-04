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

  function setSupabase(handler: (tabla: string) => FakeBuilder) {
    from = vi.fn().mockImplementation(handler);
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        NominaPeriodoRepository,
        { provide: SUPABASE_CLIENT, useValue: { from } },
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

  it('crear inserta la cabecera y retorna el resumen mapeado', async () => {
    const builder = makeBuilder({ data: FILA_NOMINA, error: null });
    setSupabase(() => builder);

    const creado = await repo.crear({
      empresaId: '7',
      empresaNombre: 'Demo',
      periodo: '2026-06',
      tipo: 'mensual',
    });

    expect(builder.insert).toHaveBeenCalledWith({
      id_empresa: 7,
      empresa_nombre: 'Demo',
      periodo: '2026-06',
      tipo: 'mensual',
      estado: 'borrador',
    });
    expect(creado.id).toBe('nom-uuid-1');
  });

  it('actualizarEstado escribe closed_at cuando cierra', async () => {
    const builder = makeBuilder({ data: null, error: null });
    setSupabase(() => builder);

    await repo.actualizarEstado('nom-uuid-1', 'cerrada');

    expect(builder.update).toHaveBeenCalled();
    const argUpdate = builder.update.mock.calls[0][0] as Record<string, unknown>;
    expect(argUpdate['estado']).toBe('cerrada');
    expect(typeof argUpdate['closed_at']).toBe('string');
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

  it('listarIncidencias filtra por id_nomina_periodo y resuelta_at null', async () => {
    const builder = makeBuilder({ data: [], error: null });
    setSupabase(() => builder);
    await repo.listarIncidencias('nom-uuid-1');
    expect(builder.eq).toHaveBeenCalledWith('id_nomina_periodo', 'nom-uuid-1');
    expect(builder.is).toHaveBeenCalledWith('resuelta_at', null);
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
});
