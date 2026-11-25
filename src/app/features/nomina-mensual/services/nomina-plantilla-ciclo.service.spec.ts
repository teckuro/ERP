import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { provideAuthStub } from '../../../core/auth/testing/auth.stub';
import { NominaPlantillaCicloRepository } from '../data-access/nomina-plantilla-ciclo.repository';
import { NominaPlantillaCicloService } from './nomina-plantilla-ciclo.service';
import type {
  NominaPlantillaCiclo,
  PreviewCorte,
} from '../models/nomina-plantilla-ciclo.models';

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
  activo: false,
  version: 0,
};

function configurar(): {
  service: NominaPlantillaCicloService;
  usuario: ReturnType<typeof provideAuthStub>['usuario'];
  repo: {
    listar: ReturnType<typeof vi.fn>;
    obtenerPorId: ReturnType<typeof vi.fn>;
    crearPlantillaNueva: ReturnType<typeof vi.fn>;
    desactivar: ReturnType<typeof vi.fn>;
    reactivar: ReturnType<typeof vi.fn>;
    eliminarInactiva: ReturnType<typeof vi.fn>;
    previsualizarCortes: ReturnType<typeof vi.fn>;
    crearVersion: ReturnType<typeof vi.fn>;
  };
} {
  const repo = {
    listar: vi.fn().mockResolvedValue([PLANTILLA_MES]),
    obtenerPorId: vi.fn().mockResolvedValue(PLANTILLA_MES),
    crearPlantillaNueva: vi.fn().mockResolvedValue(PLANTILLA_MES),
    desactivar: vi.fn().mockResolvedValue(undefined),
    reactivar: vi.fn().mockResolvedValue(undefined),
    eliminarInactiva: vi.fn().mockResolvedValue(undefined),
    previsualizarCortes: vi.fn().mockResolvedValue([] as PreviewCorte[]),
    crearVersion: vi.fn().mockResolvedValue('nuevo-id'),
  };
  const auth = provideAuthStub();
  TestBed.configureTestingModule({
    providers: [
      { provide: NominaPlantillaCicloRepository, useValue: repo },
      auth.provider,
      NominaPlantillaCicloService,
    ],
  });
  return { service: TestBed.inject(NominaPlantillaCicloService), repo, usuario: auth.usuario };
}

describe('NominaPlantillaCicloService', () => {
  beforeEach(() => {
    TestBed.resetTestingModule();
  });

  it('vacía las plantillas de la sesión anterior al cerrar sesión', async () => {
    const { service, usuario } = configurar();
    TestBed.tick();
    await service.refrescar();
    expect(service.plantillas().length).toBe(1);

    usuario.set(null);
    TestBed.tick();

    expect(service.plantillas()).toEqual([]);
  });

  it('refrescar pobla el signal plantillas y resetea error', async () => {
    const { service, repo } = configurar();
    const result = await service.refrescar();
    expect(result).toHaveLength(1);
    expect(service.plantillas()).toEqual([PLANTILLA_MES]);
    expect(service.error()).toBeNull();
    expect(repo.listar).toHaveBeenCalledWith({});
  });

  it('plantillasActivas filtra inactivas', async () => {
    const { service, repo } = configurar();
    repo.listar.mockResolvedValue([PLANTILLA_MES, PLANTILLA_INACTIVA]);
    await service.refrescar();
    expect(service.plantillasActivas()).toHaveLength(1);
    expect(service.plantillasActivas()[0].activo).toBe(true);
  });

  it('refrescar setea error en signal y lo propaga', async () => {
    const { service, repo } = configurar();
    repo.listar.mockRejectedValue(new Error('rls denied'));
    await expect(service.refrescar()).rejects.toThrow(/rls denied/);
    expect(service.error()).toBe('rls denied');
    expect(service.cargando()).toBe(false);
  });

  it('crearPlantilla refresca después de crear', async () => {
    const { service, repo } = configurar();
    await service.crearPlantilla({
      empresaId: '7',
      codigo: 'MES',
      nombre: 'Mes',
      tipo: 'mensual',
      naturaleza: 'liquidacion_legal',
      reglaFechaPago: { tipo: 'ultimo_dia_habil' },
      politicaFinSemana: 'adelantar',
    });
    expect(repo.crearPlantillaNueva).toHaveBeenCalledTimes(1);
    expect(repo.listar).toHaveBeenCalledTimes(1);
  });

  it('crearNuevaVersion devuelve el id y refresca', async () => {
    const { service, repo } = configurar();
    const id = await service.crearNuevaVersion({
      plantillaId: 'plant-1',
      politicaFinSemana: 'atrasar',
    });
    expect(id).toBe('nuevo-id');
    expect(repo.crearVersion).toHaveBeenCalledWith({
      plantillaId: 'plant-1',
      politicaFinSemana: 'atrasar',
    });
    expect(repo.listar).toHaveBeenCalled();
  });

  it('desactivar y reactivar delegan al repo y refrescan', async () => {
    const { service, repo } = configurar();
    await service.desactivar('plant-1');
    expect(repo.desactivar).toHaveBeenCalledWith('plant-1');
    await service.reactivar('plant-1');
    expect(repo.reactivar).toHaveBeenCalledWith('plant-1');
  });

  it('eliminarInactiva delega al repo', async () => {
    const { service, repo } = configurar();
    await service.eliminarInactiva('plant-old');
    expect(repo.eliminarInactiva).toHaveBeenCalledWith('plant-old');
  });

  it('previsualizarCortes pasa los argumentos al repo', async () => {
    const { service, repo } = configurar();
    await service.previsualizarCortes('plant-1', 2026, 6);
    expect(repo.previsualizarCortes).toHaveBeenCalledWith('plant-1', 2026, 6);
  });
});
