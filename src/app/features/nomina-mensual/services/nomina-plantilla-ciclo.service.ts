/**
 * Servicio productivo de Plantillas de ciclos.
 *
 * Creado en `NOM-ADMIN-OPS-F03` (2026-06-11).
 *
 * Responsabilidades:
 *   - Exponer un signal con las plantillas conocidas (`plantillas`).
 *   - Listar, obtener, crear, versionar, activar/desactivar y eliminar.
 *   - Pre-visualizar cortes de una plantilla para un año dado.
 *
 * El servicio no contiene lógica de negocio fuerte: orquesta llamadas al
 * repositorio y normaliza errores en mensajes de usuario.
 *
 * Documento rector:
 *   `docs/codex/modulos/nomina-mensual/roadmap-admin-generador-operativo-100.md` §F03.
 */

import { Injectable, computed, inject, signal } from '@angular/core';

import { limpiarAlCambiarUsuario } from '../../../core/auth/limpiar-al-cambiar-usuario';

import {
  type ListarPlantillasFiltro,
  NominaPlantillaCicloRepository,
} from '../data-access/nomina-plantilla-ciclo.repository';
import type {
  CrearVersionPlantillaPayload,
  NominaPlantillaCiclo,
  NominaPlantillaCicloNueva,
  PreviewCorte,
} from '../models/nomina-plantilla-ciclo.models';

@Injectable({ providedIn: 'root' })
export class NominaPlantillaCicloService {
  private readonly repo = inject(NominaPlantillaCicloRepository);

  private readonly _plantillas = signal<readonly NominaPlantillaCiclo[]>([]);
  private readonly _cargando = signal(false);
  private readonly _error = signal<string | null>(null);

  readonly plantillas = this._plantillas.asReadonly();
  readonly cargando = this._cargando.asReadonly();
  readonly error = this._error.asReadonly();

  private readonly generacionSesion = limpiarAlCambiarUsuario(() => {
    this._plantillas.set([]);
    this._cargando.set(false);
    this._error.set(null);
  });
  readonly plantillasActivas = computed(() =>
    this._plantillas().filter((p) => p.activo),
  );

  async refrescar(filtro: ListarPlantillasFiltro = {}): Promise<readonly NominaPlantillaCiclo[]> {
    this._cargando.set(true);
    this._error.set(null);
    const generacion = this.generacionSesion();
    try {
      const data = await this.repo.listar(filtro);
      if (generacion === this.generacionSesion()) {
        this._plantillas.set(data);
      }
      return data;
    } catch (e) {
      if (generacion === this.generacionSesion()) {
        const msg = e instanceof Error ? e.message : 'Error desconocido al listar plantillas';
        this._error.set(msg);
      }
      throw e;
    } finally {
      // Solo la carga de la sesión vigente apaga el indicador de carga.
      if (generacion === this.generacionSesion()) {
        this._cargando.set(false);
      }
    }
  }

  async crearPlantilla(plantilla: NominaPlantillaCicloNueva): Promise<NominaPlantillaCiclo> {
    const creada = await this.repo.crearPlantillaNueva(plantilla);
    await this.refrescar();
    return creada;
  }

  async crearNuevaVersion(payload: CrearVersionPlantillaPayload): Promise<string> {
    const nuevoId = await this.repo.crearVersion(payload);
    await this.refrescar();
    return nuevoId;
  }

  async desactivar(plantillaId: string): Promise<void> {
    await this.repo.desactivar(plantillaId);
    await this.refrescar();
  }

  async reactivar(plantillaId: string): Promise<void> {
    await this.repo.reactivar(plantillaId);
    await this.refrescar();
  }

  async eliminarInactiva(plantillaId: string): Promise<void> {
    await this.repo.eliminarInactiva(plantillaId);
    await this.refrescar();
  }

  async previsualizarCortes(
    plantillaId: string,
    anio: number,
    cantidad?: number,
  ): Promise<PreviewCorte[]> {
    return this.repo.previsualizarCortes(plantillaId, anio, cantidad);
  }

  async obtenerPorId(plantillaId: string): Promise<NominaPlantillaCiclo | null> {
    return this.repo.obtenerPorId(plantillaId);
  }
}
