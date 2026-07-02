import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { EmpresaActivaService } from '../../../../../../core/services/empresa-activa.service';
import { NominaPeriodoService } from '../../../../services/nomina-periodo.service';
import type { NominaPeriodoResumen } from '../../../../models/nomina-periodo.models';
import { crearNominaResumen } from '../../../../models/nomina-periodo.models';
import type { NominaCreatePreview } from '../../../../models/nomina-creacion-preview.models';
import {
  AdminNominasModalNuevaNominaComponent,
  type NominaCreadaEvento,
} from './admin-nominas-modal-nueva-nomina.component';

function resumenMock(overrides: Partial<NominaPeriodoResumen> = {}): NominaPeriodoResumen {
  return crearNominaResumen({
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
  });
}

function previewMock(overrides: Partial<NominaCreatePreview> = {}): NominaCreatePreview {
  return {
    periodo: '2026-07',
    tipo: 'mensual',
    naturaleza: 'liquidacion_legal',
    idEmpresa: 7,
    empresaNombre: 'Demo',
    codigoCiclo: '2026-07-MES',
    fechaInicio: '2026-07-01',
    fechaFin: '2026-07-31',
    plantillaCicloId: 'pl-1',
    incluidos: [],
    excluidos: [],
    conflictos: [],
    totales: { incluidos: 1, excluidos: 0, conflictos: 0 },
    puedeCrear: true,
    fingerprint: 'fp-abc',
    generadoEn: '2026-07-15T12:00:00Z',
    detallePaginado: true,
    ...overrides,
  };
}

function configurar(opts: {
  confirmar?: ReturnType<typeof vi.fn>;
  listar?: ReturnType<typeof vi.fn>;
  preview?: ReturnType<typeof vi.fn>;
  previewPagina?: ReturnType<typeof vi.fn>;
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
    confirmarCreacion: opts.confirmar ?? vi.fn().mockResolvedValue({
      idNominaPeriodo: 'nom-creado',
      estado: 'dotacion_generada',
      versionEstado: 1,
      codigoCiclo: '2026-07-MES',
      fechaInicio: '2026-07-01',
      fechaFin: '2026-07-31',
      totalTrabajadores: 1,
      siguientePaso: 'dotacion',
      reutilizada: false,
    }),
    previsualizarCreacion: opts.preview ?? vi.fn().mockResolvedValue(previewMock()),
    listarPreviewCreacionTrabajadores: opts.previewPagina ?? vi.fn().mockResolvedValue({
      filas: [{ idPersona: 10, rut: '1-1', nombre: 'Ana Pérez', cargo: 'Analista' }],
      total: 1,
    }),
    listarResumenes: opts.listar ?? vi.fn().mockResolvedValue([resumenMock()]),
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

describe('AdminNominasModalNuevaNominaComponent (F04 — wizard 2 pasos)', () => {
  beforeEach(() => {
    configurar();
  });

  it('Test 23 — inicializa con período actual, empresa preseleccionada y paso configuración', () => {
    const cmp = crearComponente();
    expect(cmp.periodo()).toMatch(/^\d{4}-(0[1-9]|1[0-2])$/);
    expect(cmp.empresaId()).toBe('7');
    expect(cmp.tipo()).toBe('mensual');
    expect(cmp.paso()).toBe('configuracion');
    expect(cmp.puedeAvanzarPreview()).toBe(true);
  });

  it('Test 24 — período inválido bloquea avanzar al preview', () => {
    const cmp = crearComponente();
    cmp.setPeriodo('2026/06');
    expect(cmp.periodoEsValido()).toBe(false);
    expect(cmp.puedeAvanzarPreview()).toBe(false);
    cmp.setPeriodo('2026-06');
    expect(cmp.puedeAvanzarPreview()).toBe(true);
  });

  it('Test 25a — generarPreview invoca el servicio y avanza al paso preview', async () => {
    const { servicio } = configurar();
    const cmp = crearComponente();
    cmp.setPeriodo('2026-07');
    await cmp.generarPreview();
    expect(servicio.previsualizarCreacion).toHaveBeenCalledWith({
      periodo: '2026-07',
      tipo: 'mensual',
    });
    expect(cmp.paso()).toBe('preview');
    expect(cmp.preview()?.totales.incluidos).toBe(1);
  });

  it('Test 25b — confirmar usa RPC F05 (fingerprint) y emite (creada)', async () => {
    const { servicio } = configurar();
    const cmp = crearComponente();
    cmp.setPeriodo('2026-07');
    await cmp.generarPreview();

    let emitido: NominaCreadaEvento | null = null;
    cmp.creada.subscribe((r) => { emitido = r; });
    await cmp.confirmar();

    expect(servicio.confirmarCreacion).toHaveBeenCalledWith({
      periodo: '2026-07',
      tipo: 'mensual',
      fingerprint: 'fp-abc',
    });
    expect(emitido).not.toBeNull();
    expect(emitido!.resumen.id).toBe('nom-creado');
    expect(emitido!.siguientePaso).toBe('dotacion');
    expect(emitido!.totalTrabajadoresIniciales).toBe(1);
    expect(emitido!.reutilizada).toBe(false);
  });

  it('expone solo el tipo mensual durante F01/F04', () => {
    const cmp = crearComponente();
    expect(cmp.tiposNomina.map((tipo) => tipo.id)).toEqual(['mensual']);
    cmp.setTipo('semanal');
    expect(cmp.puedeAvanzarPreview()).toBe(false);
  });

  it('Test 26 — cerrarModal emite (cerrar) cuando no está guardando ni cargando', () => {
    const cmp = crearComponente();
    let cerrado = false;
    cmp.cerrar.subscribe(() => { cerrado = true; });
    cmp.cerrarModal();
    expect(cerrado).toBe(true);
  });

  it('Test 27 — generarPreview con período inválido NO llama al servicio', async () => {
    const { servicio } = configurar();
    const cmp = crearComponente();
    cmp.setPeriodo('invalido');
    await cmp.generarPreview();
    expect(servicio.previsualizarCreacion).not.toHaveBeenCalled();
  });

  it('Test 28 — error del servicio en preview se expone en error()', async () => {
    const preview = vi.fn().mockRejectedValue(new Error('falla preview'));
    configurar({ preview });
    const cmp = crearComponente();
    cmp.setPeriodo('2026-07');
    await cmp.generarPreview();
    expect(cmp.error()).toBe('falla preview');
    expect(cmp.cargandoPreview()).toBe(false);
    expect(cmp.paso()).toBe('configuracion');
  });

  it('Test 29 — guardando=true durante la creación bloquea cerrarModal', async () => {
    let resolverPromesa: ((r: unknown) => void) | null = null;
    const confirmar = vi.fn().mockImplementation(() => new Promise<unknown>((res) => {
      resolverPromesa = res;
    }));
    configurar({ confirmar });
    const cmp = crearComponente();
    cmp.setPeriodo('2026-07');
    await cmp.generarPreview();

    let cerradoCount = 0;
    cmp.cerrar.subscribe(() => { cerradoCount += 1; });

    const promesa = cmp.confirmar();
    expect(cmp.guardando()).toBe(true);
    cmp.cerrarModal();
    expect(cerradoCount).toBe(0);

    resolverPromesa!({
      idNominaPeriodo: 'nom-creado',
      estado: 'dotacion_generada',
      versionEstado: 1,
      codigoCiclo: '2026-07-MES',
      fechaInicio: '2026-07-01',
      fechaFin: '2026-07-31',
      totalTrabajadores: 1,
      siguientePaso: 'parameters',
      reutilizada: false,
    });
    await promesa;
    expect(cmp.guardando()).toBe(false);
  });

  it('Test 30 — preview con conflictos bloquea confirmar y abre tab Conflictos', async () => {
    const preview = vi.fn().mockResolvedValue(previewMock({
      conflictos: [{ motivo: 'duplicidad_nomina', motivoHumano: 'Ya existe', detalle: null }],
      totales: { incluidos: 1, excluidos: 0, conflictos: 1 },
      puedeCrear: false,
    }));
    configurar({ preview });
    const cmp = crearComponente();
    cmp.setPeriodo('2026-07');
    await cmp.generarPreview();
    expect(cmp.tabActiva()).toBe('conflictos');
    expect(cmp.puedeConfirmar()).toBe(false);
  });

  it('Test 31 — cambiar período en paso preview vuelve a configuración y limpia preview', async () => {
    const cmp = crearComponente();
    cmp.setPeriodo('2026-07');
    await cmp.generarPreview();
    expect(cmp.paso()).toBe('preview');
    cmp.setPeriodo('2026-08');
    expect(cmp.paso()).toBe('configuracion');
    expect(cmp.preview()).toBeNull();
  });
});
