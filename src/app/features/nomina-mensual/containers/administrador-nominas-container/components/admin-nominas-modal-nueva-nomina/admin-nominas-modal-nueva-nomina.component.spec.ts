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
  listarTrabajadores?: ReturnType<typeof vi.fn>;
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
    listarPreviewCreacionTrabajadores: opts.listarTrabajadores ?? vi.fn().mockResolvedValue({
      filas: [{ idPersona: 1, rut: '11.111.111-1', nombre: 'Ana Pérez', cargo: 'Analista' }],
      total: 1,
    }),
    obtenerCabeceraNomina: vi.fn().mockResolvedValue(resumenMock()),
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

describe('AdminNominasModalNuevaNominaComponent (F04 — creación directa)', () => {
  beforeEach(() => {
    configurar();
  });

  it('Test 23 — inicializa con período actual, empresa preseleccionada y formulario listo', () => {
    const cmp = crearComponente();
    expect(cmp.periodo()).toMatch(/^\d{4}-(0[1-9]|1[0-2])$/);
    expect(cmp.empresaId()).toBe('7');
    expect(cmp.puedePrevisualizar()).toBe(true);
    expect(cmp.puedeConfirmar()).toBe(false);
  });

  it('Test 24 — período inválido bloquea previsualizar', () => {
    const cmp = crearComponente();
    cmp.setPeriodo('2026/06');
    expect(cmp.periodoEsValido()).toBe(false);
    expect(cmp.puedePrevisualizar()).toBe(false);
    cmp.setPeriodo('2026-06');
    expect(cmp.puedePrevisualizar()).toBe(true);
  });

  it('Test 25 — crearNomina invoca confirmación F05 tras preview y emite (creada)', async () => {
    const { servicio } = configurar();
    const cmp = crearComponente();
    cmp.setPeriodo('2026-07');
    await cmp.previsualizarDotacion();

    let emitido: NominaCreadaEvento | null = null;
    cmp.creada.subscribe((r) => { emitido = r; });
    await cmp.crearNomina();

    expect(servicio.previsualizarCreacion).toHaveBeenCalledWith({
      periodo: '2026-07',
      tipo: 'mensual',
      codigoCiclo: null,
    });
    expect(servicio.confirmarCreacion).toHaveBeenCalledWith({
      periodo: '2026-07',
      tipo: 'mensual',
      fingerprint: 'fp-abc',
      codigoCiclo: '2026-07-MES',
    });
    expect(servicio.obtenerCabeceraNomina).toHaveBeenCalledWith('nom-creado');
    expect(emitido).not.toBeNull();
    expect(emitido!.resumen.id).toBe('nom-creado');
    expect(emitido!.siguientePaso).toBe('dotacion');
    expect(emitido!.totalTrabajadoresIniciales).toBe(1);
    expect(emitido!.reutilizada).toBe(false);
  });

  it('Test 26 — cerrarModal emite (cerrar) cuando no está guardando', () => {
    const cmp = crearComponente();
    let cerrado = false;
    cmp.cerrar.subscribe(() => { cerrado = true; });
    cmp.cerrarModal();
    expect(cerrado).toBe(true);
  });

  it('Test 27 — crearNomina sin preview previo NO llama al servicio', async () => {
    const { servicio } = configurar();
    const cmp = crearComponente();
    cmp.setPeriodo('2026-07');
    await cmp.crearNomina();
    expect(servicio.confirmarCreacion).not.toHaveBeenCalled();
  });

  it('Test 28 — error del servicio en preview se expone en error()', async () => {
    const preview = vi.fn().mockRejectedValue(new Error('falla preview'));
    configurar({ preview });
    const cmp = crearComponente();
    cmp.setPeriodo('2026-07');
    await cmp.previsualizarDotacion();
    expect(cmp.error()).toContain('previsualizar la dotación');
    expect(cmp.guardando()).toBe(false);
  });

  it('Test 29 — guardando=true durante la creación bloquea cerrarModal', async () => {
    const confirmar = vi.fn().mockImplementation(() => new Promise(() => undefined));
    configurar({ confirmar });
    const cmp = crearComponente();
    cmp.setPeriodo('2026-07');
    await cmp.previsualizarDotacion();

    let cerradoCount = 0;
    cmp.cerrar.subscribe(() => { cerradoCount += 1; });

    void cmp.crearNomina();
    await Promise.resolve();
    expect(cmp.guardando()).toBe(true);
    cmp.cerrarModal();
    expect(cerradoCount).toBe(0);
  });

  it('Test 30 — preview con conflictos bloquea confirmar y muestra error', async () => {
    const preview = vi.fn().mockResolvedValue(previewMock({
      conflictos: [{ motivo: 'duplicidad_nomina', motivoHumano: 'Ya existe', detalle: null }],
      totales: { incluidos: 1, excluidos: 0, conflictos: 1 },
      puedeCrear: false,
    }));
    const confirmar = vi.fn();
    configurar({ preview, confirmar });
    const cmp = crearComponente();
    cmp.setPeriodo('2026-07');
    await cmp.previsualizarDotacion();
    expect(cmp.error()).toContain('Ya existe');
    expect(cmp.previewListo()).toBe(false);
    expect(cmp.puedeConfirmar()).toBe(false);
    await cmp.crearNomina();
    expect(confirmar).not.toHaveBeenCalled();
  });

  it('habilita previsualizar aunque empresaId aún no esté sincronizado', () => {
    configurar({ empresaSnap: null });
    const cmp = crearComponente();
    cmp.setPeriodo('2026-07');
    cmp.empresaId.set('');
    expect(cmp.periodoEsValido()).toBe(true);
    expect(cmp.puedePrevisualizar()).toBe(true);
  });

  it('expone empresas desde empresasDisponibles para el selector', () => {
    configurar({ empresaSnap: null });
    const fixture = TestBed.createComponent(AdminNominasModalNuevaNominaComponent);
    fixture.componentRef.setInput('empresasDisponibles', [
      resumenMock({ empresaId: '42', empresaNombre: 'Acme' }),
    ]);
    const cmp = fixture.componentInstance;
    expect(cmp.empresas().map((e) => e.id)).toEqual(['42']);
    cmp.setEmpresa(cmp.empresas()[0]!.id);
    expect(cmp.empresaId()).toBe('42');
  });

  it('previsualizar carga trabajadores paginados cuando detallePaginado=true', async () => {
    const listarTrabajadores = vi.fn().mockResolvedValue({
      filas: [{ idPersona: 2, rut: '22.222.222-2', nombre: 'Luis Gómez', cargo: null }],
      total: 1,
    });
    const { servicio } = configurar({ listarTrabajadores });
    const cmp = crearComponente();
    cmp.setPeriodo('2026-07');
    await cmp.previsualizarDotacion();

    expect(servicio.listarPreviewCreacionTrabajadores).toHaveBeenCalled();
    expect(cmp.filasPreview()).toHaveLength(1);
    expect(cmp.previewListo()).toBe(true);
  });

  it('detecta nómina existente en bandeja para el mismo período', () => {
    const fixture = TestBed.createComponent(AdminNominasModalNuevaNominaComponent);
    fixture.componentRef.setInput('empresasDisponibles', [
      resumenMock({ id: 'nom-existente', periodo: '2026-07', empresaId: '7', estado: 'borrador' }),
    ]);
    const cmp = fixture.componentInstance;
    cmp.setPeriodo('2026-07');
    cmp.empresaId.set('7');

    expect(cmp.avisoNominaExistente()?.title).toContain('Ya hay una nómina');
    expect(cmp.avisoNominaExistente()?.detail).toContain('reutilizará');
  });
});
