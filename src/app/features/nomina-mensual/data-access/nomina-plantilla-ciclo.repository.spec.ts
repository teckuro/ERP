import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { SUPABASE_CLIENT } from '../../../core/services/supabase.service';
import { NominaPlantillaCicloRepository } from './nomina-plantilla-ciclo.repository';
import type { NominaPlantillaCicloRow } from '../mappers/nomina-plantilla-ciclo.mapper';

interface FakeBuilder {
  select: ReturnType<typeof vi.fn>;
  insert: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
  eq: ReturnType<typeof vi.fn>;
  order: ReturnType<typeof vi.fn>;
  maybeSingle: ReturnType<typeof vi.fn>;
  single: ReturnType<typeof vi.fn>;
  then: ReturnType<typeof vi.fn>;
}

function makeBuilder(opts: { data?: unknown; error?: unknown } = { data: [], error: null }): FakeBuilder {
  const b: FakeBuilder = {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    eq: vi.fn(),
    order: vi.fn(),
    maybeSingle: vi.fn(),
    single: vi.fn(),
    then: vi.fn(),
  };
  b.select.mockReturnValue(b);
  b.insert.mockReturnValue(b);
  b.update.mockReturnValue(b);
  b.delete.mockReturnValue(b);
  b.eq.mockReturnValue(b);
  b.order.mockReturnValue(b);
  b.maybeSingle.mockResolvedValue(opts);
  b.single.mockResolvedValue(opts);
  b.then.mockImplementation((onFulfilled: (v: { data: unknown; error: unknown }) => unknown) =>
    Promise.resolve(onFulfilled({ data: opts.data ?? [], error: opts.error ?? null })),
  );
  return b;
}

const FILA_MES: NominaPlantillaCicloRow = {
  id: 'plant-1',
  id_empresa: 7,
  codigo: 'MES',
  nombre: 'Mes calendario',
  tipo: 'mensual',
  naturaleza: 'liquidacion_legal',
  configuracion: {},
  regla_fecha_pago: { tipo: 'ultimo_dia_habil' },
  politica_fin_semana: 'adelantar',
  regla_anticipo: null,
  descripcion: null,
  activo: true,
  version: 1,
  created_at: '2026-06-11T20:00:00.000Z',
  updated_at: '2026-06-11T20:00:00.000Z',
};

interface FakeClient {
  from: ReturnType<typeof vi.fn>;
  rpc: ReturnType<typeof vi.fn>;
}

function makeClient(builder: FakeBuilder, rpcResult: { data?: unknown; error?: unknown } = { data: null, error: null }): FakeClient {
  return {
    from: vi.fn().mockReturnValue(builder),
    rpc: vi.fn().mockResolvedValue(rpcResult),
  };
}

function configurar(builder: FakeBuilder, rpcResult?: { data?: unknown; error?: unknown }): NominaPlantillaCicloRepository {
  const client = makeClient(builder, rpcResult);
  TestBed.configureTestingModule({
    providers: [
      { provide: SUPABASE_CLIENT, useValue: client },
      NominaPlantillaCicloRepository,
    ],
  });
  return TestBed.inject(NominaPlantillaCicloRepository);
}

describe('NominaPlantillaCicloRepository', () => {
  beforeEach(() => {
    TestBed.resetTestingModule();
  });

  it('listar devuelve plantillas mapeadas', async () => {
    const builder = makeBuilder({ data: [FILA_MES], error: null });
    const repo = configurar(builder);

    const result = await repo.listar();
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ codigo: 'MES', activo: true, version: 1 });
  });

  it('listar con soloActivas=true filtra por activo', async () => {
    const builder = makeBuilder({ data: [FILA_MES], error: null });
    const repo = configurar(builder);

    await repo.listar({ soloActivas: true });
    expect(builder.eq).toHaveBeenCalledWith('activo', true);
  });

  it('listar con codigo filtra por código', async () => {
    const builder = makeBuilder({ data: [FILA_MES], error: null });
    const repo = configurar(builder);

    await repo.listar({ codigo: 'MES' });
    expect(builder.eq).toHaveBeenCalledWith('codigo', 'MES');
  });

  it('obtenerPorId devuelve plantilla cuando existe', async () => {
    const builder = makeBuilder({ data: FILA_MES, error: null });
    const repo = configurar(builder);

    const plantilla = await repo.obtenerPorId('plant-1');
    expect(plantilla?.codigo).toBe('MES');
  });

  it('obtenerPorId devuelve null cuando no existe', async () => {
    const builder = makeBuilder({ data: null, error: null });
    const repo = configurar(builder);

    const plantilla = await repo.obtenerPorId('no-existe');
    expect(plantilla).toBeNull();
  });

  it('crearPlantillaNueva delega al insert y devuelve la fila creada', async () => {
    const builder = makeBuilder({ data: FILA_MES, error: null });
    const repo = configurar(builder);

    const creada = await repo.crearPlantillaNueva({
      empresaId: '7',
      codigo: 'MES',
      nombre: 'Mes calendario',
      tipo: 'mensual',
      naturaleza: 'liquidacion_legal',
      reglaFechaPago: { tipo: 'ultimo_dia_habil' },
      politicaFinSemana: 'adelantar',
    });
    expect(builder.insert).toHaveBeenCalled();
    expect(creada.codigo).toBe('MES');
  });

  it('previsualizarCortes pasa los argumentos al RPC y mapea las filas', async () => {
    const builder = makeBuilder();
    const rpcRows = [
      {
        numero_corte: 1,
        codigo_ciclo: '2026-01-MES',
        fecha_inicio: '2026-01-01',
        fecha_fin: '2026-01-31',
        fecha_pago_calendario: '2026-01-31',
        fecha_pago_propuesta: '2026-01-30',
        ajuste_fds: 'adelantar',
        notas: null,
      },
    ];
    const client = makeClient(builder, { data: rpcRows, error: null });
    TestBed.configureTestingModule({
      providers: [
        { provide: SUPABASE_CLIENT, useValue: client },
        NominaPlantillaCicloRepository,
      ],
    });
    const repo = TestBed.inject(NominaPlantillaCicloRepository);

    const cortes = await repo.previsualizarCortes('plant-1', 2026);
    expect(client.rpc).toHaveBeenCalledWith('previsualizar_cortes_plantilla', {
      p_plantilla_id: 'plant-1',
      p_anio: 2026,
    });
    expect(cortes).toHaveLength(1);
    expect(cortes[0].codigoCiclo).toBe('2026-01-MES');
  });

  it('crearVersion construye los args y devuelve el nuevo id', async () => {
    const builder = makeBuilder();
    const client = makeClient(builder, { data: 'nuevo-id', error: null });
    TestBed.configureTestingModule({
      providers: [
        { provide: SUPABASE_CLIENT, useValue: client },
        NominaPlantillaCicloRepository,
      ],
    });
    const repo = TestBed.inject(NominaPlantillaCicloRepository);

    const nuevoId = await repo.crearVersion({
      plantillaId: 'plant-1',
      politicaFinSemana: 'atrasar',
      activar: true,
    });
    expect(client.rpc).toHaveBeenCalledWith('crear_version_plantilla', {
      p_plantilla_id: 'plant-1',
      p_politica_fin_semana: 'atrasar',
      p_activar: true,
    });
    expect(nuevoId).toBe('nuevo-id');
  });

  it('crearVersion lanza si el RPC devuelve error', async () => {
    const builder = makeBuilder();
    const client = makeClient(builder, { data: null, error: { message: 'boom' } });
    TestBed.configureTestingModule({
      providers: [
        { provide: SUPABASE_CLIENT, useValue: client },
        NominaPlantillaCicloRepository,
      ],
    });
    const repo = TestBed.inject(NominaPlantillaCicloRepository);

    await expect(
      repo.crearVersion({ plantillaId: 'plant-1' }),
    ).rejects.toThrow(/No se pudo crearVersionPlantilla\./);
  });

  it('listar lanza si supabase devuelve error', async () => {
    const builder = makeBuilder({ data: null, error: { message: 'rls denied' } });
    const repo = configurar(builder);

    await expect(repo.listar()).rejects.toThrow(/No se pudo listarPlantillasCiclo\./);
  });
});
