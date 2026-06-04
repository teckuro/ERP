import { TestBed } from '@angular/core/testing';
import { signal, type WritableSignal } from '@angular/core';
import type { User } from '@supabase/supabase-js';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AuthService } from '../auth/auth.service';
import { EmpresaActivaService } from './empresa-activa.service';
import { SUPABASE_CLIENT } from './supabase.service';

interface FakeBuilder {
  select: ReturnType<typeof vi.fn>;
  eq: ReturnType<typeof vi.fn>;
  order: ReturnType<typeof vi.fn>;
  limit: ReturnType<typeof vi.fn>;
  maybeSingle: ReturnType<typeof vi.fn>;
}

function builderRetornando(data: unknown, error: unknown = null): FakeBuilder {
  const builder: FakeBuilder = {
    select: vi.fn(),
    eq: vi.fn(),
    order: vi.fn(),
    limit: vi.fn(),
    maybeSingle: vi.fn(),
  };
  builder.select.mockReturnValue(builder);
  builder.eq.mockReturnValue(builder);
  builder.order.mockReturnValue(builder);
  builder.limit.mockReturnValue(builder);
  builder.maybeSingle.mockResolvedValue({ data, error });
  return builder;
}

function fakeAuth(user: Partial<User> | null): Pick<AuthService, 'currentUser'> {
  const userSignal: WritableSignal<User | null> = signal(user as User | null);
  return { currentUser: userSignal };
}

const EMPRESA_DEMO = {
  id_empresa: 7,
  razon_social: 'Empresa Demo',
  nombre_fantasia: 'Demo',
  rut: '76123456',
  dv: 'K',
};

describe('EmpresaActivaService', () => {
  let builder: FakeBuilder;
  let supabase: { from: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    builder = builderRetornando(EMPRESA_DEMO);
    supabase = { from: vi.fn().mockReturnValue(builder) };
  });

  function crear(authUser: Partial<User> | null): EmpresaActivaService {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        EmpresaActivaService,
        { provide: SUPABASE_CLIENT, useValue: supabase },
        { provide: AuthService, useValue: fakeAuth(authUser) },
      ],
    });
    return TestBed.inject(EmpresaActivaService);
  }

  it('resuelve id_empresa desde app_metadata.id_empresa', () => {
    const service = crear({ app_metadata: { id_empresa: 42 } } as Partial<User>);
    expect(service.resolverIdEmpresaDesdeJwt()).toBe(42);
  });

  it('resuelve id_empresa desde user_metadata cuando no hay app_metadata', () => {
    const service = crear({
      app_metadata: {},
      user_metadata: { id_empresa: 99 },
    } as Partial<User>);
    expect(service.resolverIdEmpresaDesdeJwt()).toBe(99);
  });

  it('retorna null cuando el usuario no está logueado', () => {
    const service = crear(null);
    expect(service.resolverIdEmpresaDesdeJwt()).toBeNull();
  });

  it('cargar() usa filtro por id_empresa cuando viene en el JWT', async () => {
    const service = crear({ app_metadata: { id_empresa: 7 } } as Partial<User>);
    const snap = await service.cargar();

    expect(supabase.from).toHaveBeenCalledWith('empresa');
    expect(builder.eq).toHaveBeenCalledWith('id_empresa', 7);
    expect(builder.order).not.toHaveBeenCalled();
    expect(snap?.idEmpresa).toBe(7);
    expect(service.empresaActivaId()).toBe(7);
    expect(service.empresaActivaNombre()).toBe('Demo');
  });

  it('cargar() hace fallback a .limit(1) cuando no hay id_empresa en JWT', async () => {
    const service = crear({ app_metadata: {} } as Partial<User>);
    await service.cargar();

    expect(builder.order).toHaveBeenCalledWith('id_empresa', { ascending: true });
    expect(builder.limit).toHaveBeenCalledWith(1);
    expect(builder.eq).not.toHaveBeenCalled();
  });

  it('usa razon_social cuando nombre_fantasia es null', async () => {
    builder.maybeSingle.mockResolvedValueOnce({
      data: { ...EMPRESA_DEMO, nombre_fantasia: null },
      error: null,
    });
    const service = crear({ app_metadata: { id_empresa: 7 } } as Partial<User>);
    await service.cargar();
    expect(service.empresaActivaNombre()).toBe('Empresa Demo');
  });

  it('cargar() retorna null y deja state en null si la query falla', async () => {
    builder.maybeSingle.mockResolvedValueOnce({ data: null, error: { message: 'denied' } });
    const service = crear({ app_metadata: { id_empresa: 7 } } as Partial<User>);
    const snap = await service.cargar();
    expect(snap).toBeNull();
    expect(service.empresaActivaId()).toBeNull();
  });

  it('asegurarCargada() no consulta dos veces si ya está cargado', async () => {
    const service = crear({ app_metadata: { id_empresa: 7 } } as Partial<User>);
    await service.asegurarCargada();
    await service.asegurarCargada();
    expect(supabase.from).toHaveBeenCalledTimes(1);
  });

  it('asegurarCargada() comparte la misma promesa para llamadas concurrentes', async () => {
    const service = crear({ app_metadata: { id_empresa: 7 } } as Partial<User>);
    const [a, b] = await Promise.all([service.asegurarCargada(), service.asegurarCargada()]);
    expect(a?.idEmpresa).toBe(7);
    expect(b?.idEmpresa).toBe(7);
    expect(supabase.from).toHaveBeenCalledTimes(1);
  });

  it('limpiar() resetea el snapshot', async () => {
    const service = crear({ app_metadata: { id_empresa: 7 } } as Partial<User>);
    await service.cargar();
    expect(service.empresaActivaId()).toBe(7);
    service.limpiar();
    expect(service.empresaActivaId()).toBeNull();
  });
});
