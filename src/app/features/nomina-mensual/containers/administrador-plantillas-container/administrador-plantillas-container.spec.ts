import { TestBed } from '@angular/core/testing';
import { importProvidersFrom } from '@angular/core';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LucideAngularModule } from 'lucide-angular';
import {
  CalendarDays,
  Pause,
  Pencil,
  Play,
  Trash2,
  X,
} from 'lucide-angular/src/icons';

import type { NominaPlantillaCiclo } from '../../models/nomina-plantilla-ciclo.models';
import { NominaPlantillaCicloService } from '../../services/nomina-plantilla-ciclo.service';
import { AdministradorPlantillasContainer } from './administrador-plantillas-container';

const PLANTILLA_MES: NominaPlantillaCiclo = {
  id: 'plant-1',
  empresaId: '7',
  codigo: 'MES',
  nombre: 'Mes calendario',
  tipo: 'mensual',
  naturaleza: 'liquidacion_legal',
  reglaFechaPago: { tipo: 'ultimo_dia_habil' },
  politicaFinSemana: 'adelantar',
  reglaAnticipo: null,
  descripcion: null,
  activo: true,
  version: 1,
  createdAt: '2026-06-11T20:00:00.000Z',
  updatedAt: '2026-06-11T20:00:00.000Z',
};

const PLANTILLA_INACTIVA: NominaPlantillaCiclo = {
  ...PLANTILLA_MES,
  id: 'plant-old',
  codigo: 'OBSOLETA',
  nombre: 'Obsoleta',
  activo: false,
  version: 1,
};

function configurar(): {
  servicio: {
    plantillas: () => readonly NominaPlantillaCiclo[];
    cargando: () => boolean;
    error: () => string | null;
    refrescar: ReturnType<typeof vi.fn>;
    desactivar: ReturnType<typeof vi.fn>;
    reactivar: ReturnType<typeof vi.fn>;
    eliminarInactiva: ReturnType<typeof vi.fn>;
  };
} {
  const data: NominaPlantillaCiclo[] = [PLANTILLA_MES, PLANTILLA_INACTIVA];
  const servicio = {
    plantillas: () => data,
    cargando: () => false,
    error: () => null,
    refrescar: vi.fn().mockResolvedValue(data),
    desactivar: vi.fn().mockResolvedValue(undefined),
    reactivar: vi.fn().mockResolvedValue(undefined),
    eliminarInactiva: vi.fn().mockResolvedValue(undefined),
  };

  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers: [
      importProvidersFrom(
        LucideAngularModule.pick({
          CalendarDays,
          Pause,
          Pencil,
          Play,
          Trash2,
          X,
        }),
      ),
      { provide: NominaPlantillaCicloService, useValue: servicio },
    ],
  });

  return { servicio };
}

describe('AdministradorPlantillasContainer (smoke F03)', () => {
  beforeEach(() => {
    TestBed.resetTestingModule();
  });

  it('se instancia y dispara refrescar al iniciar', () => {
    const { servicio } = configurar();
    const fixture = TestBed.createComponent(AdministradorPlantillasContainer);
    fixture.detectChanges();
    expect(servicio.refrescar).toHaveBeenCalled();
    expect(fixture.componentInstance.plantillas().length).toBe(2);
  });

  it('ordena plantillas con activas primero', () => {
    configurar();
    const fixture = TestBed.createComponent(AdministradorPlantillasContainer);
    fixture.detectChanges();
    const orden = fixture.componentInstance.plantillasOrdenadas().map((p) => p.id);
    expect(orden).toEqual(['plant-1', 'plant-old']);
  });

  it('abrirCrear pone modoEditor en "crear" y limpia plantillaEnEdicion', () => {
    configurar();
    const fixture = TestBed.createComponent(AdministradorPlantillasContainer);
    const cmp = fixture.componentInstance;
    cmp.plantillaEnEdicion.set(PLANTILLA_MES);
    cmp.abrirCrear();
    expect(cmp.modoEditor()).toBe('crear');
    expect(cmp.plantillaEnEdicion()).toBeNull();
  });

  it('abrirEditar setea modoEditor=editar con la plantilla seleccionada', () => {
    configurar();
    const fixture = TestBed.createComponent(AdministradorPlantillasContainer);
    const cmp = fixture.componentInstance;
    cmp.abrirEditar(PLANTILLA_MES);
    expect(cmp.modoEditor()).toBe('editar');
    expect(cmp.plantillaEnEdicion()?.id).toBe('plant-1');
  });

  it('cerrarEditor resetea modo y plantilla en edición', () => {
    configurar();
    const fixture = TestBed.createComponent(AdministradorPlantillasContainer);
    const cmp = fixture.componentInstance;
    cmp.abrirEditar(PLANTILLA_MES);
    cmp.cerrarEditor();
    expect(cmp.modoEditor()).toBeNull();
    expect(cmp.plantillaEnEdicion()).toBeNull();
  });

  it('abrirPreview / cerrarPreview controlan la plantilla a previsualizar', () => {
    configurar();
    const fixture = TestBed.createComponent(AdministradorPlantillasContainer);
    const cmp = fixture.componentInstance;
    cmp.abrirPreview(PLANTILLA_MES);
    expect(cmp.plantillaPreview()?.id).toBe('plant-1');
    cmp.cerrarPreview();
    expect(cmp.plantillaPreview()).toBeNull();
  });

  it('alternarActivo llama desactivar si la plantilla está activa', async () => {
    const { servicio } = configurar();
    const fixture = TestBed.createComponent(AdministradorPlantillasContainer);
    await fixture.componentInstance.alternarActivo(PLANTILLA_MES);
    expect(servicio.desactivar).toHaveBeenCalledWith('plant-1');
    expect(servicio.reactivar).not.toHaveBeenCalled();
  });

  it('alternarActivo llama reactivar si la plantilla está inactiva', async () => {
    const { servicio } = configurar();
    const fixture = TestBed.createComponent(AdministradorPlantillasContainer);
    await fixture.componentInstance.alternarActivo(PLANTILLA_INACTIVA);
    expect(servicio.reactivar).toHaveBeenCalledWith('plant-old');
    expect(servicio.desactivar).not.toHaveBeenCalled();
  });

  it('solicitarEliminar bloquea cuando la plantilla está activa', () => {
    configurar();
    const fixture = TestBed.createComponent(AdministradorPlantillasContainer);
    const cmp = fixture.componentInstance;
    cmp.solicitarEliminar(PLANTILLA_MES);
    expect(cmp.eliminarPendiente()).toBeNull();
    expect(cmp.errorAccion()).toMatch(/Desactiva/);
  });

  it('solicitarEliminar acepta plantillas inactivas y confirmar las elimina', async () => {
    const { servicio } = configurar();
    const fixture = TestBed.createComponent(AdministradorPlantillasContainer);
    const cmp = fixture.componentInstance;
    cmp.solicitarEliminar(PLANTILLA_INACTIVA);
    expect(cmp.eliminarPendiente()?.plantilla.id).toBe('plant-old');
    await cmp.confirmarEliminar();
    expect(servicio.eliminarInactiva).toHaveBeenCalledWith('plant-old');
    expect(cmp.eliminarPendiente()).toBeNull();
  });

  it('subtitulo informa total y activas', () => {
    configurar();
    const fixture = TestBed.createComponent(AdministradorPlantillasContainer);
    const subtitulo = fixture.componentInstance.subtitulo();
    expect(subtitulo).toContain('2 plantillas');
    expect(subtitulo).toContain('1 activa');
  });
});
