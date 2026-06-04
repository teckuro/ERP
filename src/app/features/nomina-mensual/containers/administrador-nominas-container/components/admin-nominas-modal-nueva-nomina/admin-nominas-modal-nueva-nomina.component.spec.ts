import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { EmpresaActivaService } from '../../../../../../core/services/empresa-activa.service';
import { NominaPeriodoService } from '../../../../services/nomina-periodo.service';
import type { NominaPeriodoResumen } from '../../../../models/nomina-periodo.models';
import { AdminNominasModalNuevaNominaComponent } from './admin-nominas-modal-nueva-nomina.component';

function resumenMock(overrides: Partial<NominaPeriodoResumen> = {}): NominaPeriodoResumen {
  return {
    id: 'nom-creado',
    periodo: '2026-07',
    empresaId: '7',
    empresaNombre: 'Demo',
    tipo: 'mensual',
    estado: 'borrador',
    totalTrabajadores: 0,
    totalSegmentos: 0,
    totalHaberes: 0,
    totalDescuentos: 0,
    totalLiquido: 0,
    totalIncidenciasCriticas: 0,
    totalAdvertencias: 0,
    createdAt: '2026-07-01T00:00:00Z',
    updatedAt: '2026-07-01T00:00:00Z',
    ...overrides,
  };
}

function configurar(opts: {
  crear?: ReturnType<typeof vi.fn>;
  empresaSnap?: { idEmpresa: number; nombre: string; razonSocial: string; rut: string; dv: string } | null;
} = {}) {
  const empresaSnap = opts.empresaSnap === undefined
    ? { idEmpresa: 7, nombre: 'Demo', razonSocial: 'Demo S.A.', rut: '76', dv: 'K' }
    : opts.empresaSnap;
  const snapSignal = signal(empresaSnap);
  const empresaActiva = {
    empresa: () => snapSignal(),
    asegurarCargada: vi.fn().mockResolvedValue(snapSignal()),
  };
  const servicio = {
    crearNominaPeriodo: opts.crear ?? vi.fn().mockResolvedValue(resumenMock()),
  };
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers: [
      { provide: NominaPeriodoService, useValue: servicio },
      { provide: EmpresaActivaService, useValue: empresaActiva },
    ],
  });
  return { servicio, empresaActiva };
}

function crearComponente(): AdminNominasModalNuevaNominaComponent {
  const fixture = TestBed.createComponent(AdminNominasModalNuevaNominaComponent);
  return fixture.componentInstance;
}

describe('AdminNominasModalNuevaNominaComponent (F3c — servicio productivo)', () => {
  beforeEach(() => {
    configurar();
  });

  it('Test 23 — inicializa con período actual (AAAA-MM) y empresa activa preseleccionada', () => {
    const cmp = crearComponente();
    expect(cmp.periodo()).toMatch(/^\d{4}-(0[1-9]|1[0-2])$/);
    expect(cmp.empresaId()).toBe('7');
    expect(cmp.tipo()).toBe('mensual');
    expect(cmp.puedeCrear()).toBe(true);
  });

  it('Test 24 — período inválido invalida el botón crear', () => {
    const cmp = crearComponente();
    cmp.setPeriodo('2026/06');
    expect(cmp.periodoEsValido()).toBe(false);
    expect(cmp.puedeCrear()).toBe(false);
    cmp.setPeriodo('2026-06');
    expect(cmp.puedeCrear()).toBe(true);
  });

  it('Test 25 — confirmar persiste y emite (creada) con el NominaPeriodoResumen retornado', async () => {
    const { servicio } = configurar();
    const cmp = crearComponente();
    cmp.setPeriodo('2026-07');
    cmp.setTipo('extraordinaria');

    let emitido: NominaPeriodoResumen | null = null;
    cmp.creada.subscribe((r) => { emitido = r; });

    await cmp.confirmar();

    expect(servicio.crearNominaPeriodo).toHaveBeenCalledWith(
      expect.objectContaining({ periodo: '2026-07', tipo: 'extraordinaria', empresaId: '7' }),
    );
    expect(emitido).not.toBeNull();
    expect(emitido!.id).toBe('nom-creado');
  });

  it('Test 26 — cerrarModal emite (cerrar) cuando no está guardando', () => {
    const cmp = crearComponente();
    let cerrado = false;
    cmp.cerrar.subscribe(() => { cerrado = true; });
    cmp.cerrarModal();
    expect(cerrado).toBe(true);
  });

  it('Test 27 — confirmar con período inválido NO llama al servicio', async () => {
    const { servicio } = configurar();
    const cmp = crearComponente();
    cmp.setPeriodo('invalido');
    await cmp.confirmar();
    expect(servicio.crearNominaPeriodo).not.toHaveBeenCalled();
  });

  it('Test 28 — captura el error del servicio y lo expone en error()', async () => {
    const crear = vi.fn().mockRejectedValue(new Error('falla supabase'));
    configurar({ crear });
    const cmp = crearComponente();
    cmp.setPeriodo('2026-07');
    await cmp.confirmar();
    expect(cmp.error()).toBe('falla supabase');
    expect(cmp.guardando()).toBe(false);
  });

  it('Test 29 — guardando=true durante la creación bloquea cerrarModal', async () => {
    let resolverPromesa: ((r: NominaPeriodoResumen) => void) | null = null;
    const crear = vi.fn().mockImplementation(() => new Promise<NominaPeriodoResumen>((res) => {
      resolverPromesa = res;
    }));
    configurar({ crear });
    const cmp = crearComponente();
    cmp.setPeriodo('2026-07');

    let cerradoCount = 0;
    cmp.cerrar.subscribe(() => { cerradoCount += 1; });

    const promesa = cmp.confirmar();
    expect(cmp.guardando()).toBe(true);
    cmp.cerrarModal();
    expect(cerradoCount).toBe(0);

    resolverPromesa!(resumenMock());
    await promesa;
    expect(cmp.guardando()).toBe(false);
  });
});
