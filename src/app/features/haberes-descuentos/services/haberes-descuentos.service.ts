import { Injectable, inject } from '@angular/core';

import { HaberesDescuentosRepository } from '../data-access/haberes-descuentos.repository';
import {
  ConceptoListado,
  HaberDescuentoAsignacionListado,
  HaberDescuentoAsignacionPayload,
} from '../models/haber-descuento-asignacion.model';

@Injectable({ providedIn: 'root' })
export class HaberesDescuentosService {
  private readonly repository = inject(HaberesDescuentosRepository);

  listarConceptos(): Promise<ConceptoListado[]> {
    return this.repository.listarConceptosAsignables();
  }

  listarPorPersona(idPersona: number): Promise<HaberDescuentoAsignacionListado[]> {
    return this.repository.listarAsignacionesPorPersona(idPersona);
  }

  async crear(payload: HaberDescuentoAsignacionPayload): Promise<void> {
    this.validarPayload(payload);
    const dup = await this.repository.existeActivaMismoConcepto(
      payload.idPersona,
      payload.idConcepto,
    );
    if (dup && payload.estado) {
      throw new Error('Ya existe una asignacion activa para este concepto y trabajador.');
    }
    await this.repository.crearAsignacion(payload);
  }

  async actualizar(
    idAsignacion: number,
    payload: HaberDescuentoAsignacionPayload,
  ): Promise<void> {
    this.validarPayload(payload);
    const dup = await this.repository.existeActivaMismoConcepto(
      payload.idPersona,
      payload.idConcepto,
      idAsignacion,
    );
    if (dup && payload.estado) {
      throw new Error('Ya existe una asignacion activa para este concepto y trabajador.');
    }
    await this.repository.actualizarAsignacion(idAsignacion, payload);
  }

  desactivar(idAsignacion: number): Promise<void> {
    return this.repository.desactivarAsignacion(idAsignacion);
  }

  private validarPayload(payload: HaberDescuentoAsignacionPayload): void {
    if (!payload.idPersona || !payload.idConcepto) {
      throw new Error('Trabajador y concepto son obligatorios.');
    }
    if (payload.tipoValor === 'FIJO') {
      if (payload.monto == null || payload.monto < 0) {
        throw new Error('El monto debe ser mayor o igual a 0.');
      }
    } else if (payload.tipoValor === 'PORCENTAJE') {
      if (payload.porcentaje == null || payload.porcentaje < 0 || payload.porcentaje > 100) {
        throw new Error('El porcentaje debe estar entre 0 y 100.');
      }
    } else {
      throw new Error('Tipo de valor invalido.');
    }
  }
}
