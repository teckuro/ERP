import { Injectable, inject } from '@angular/core';

import { HaberesDescuentosRepository } from '../data-access/haberes-descuentos.repository';
import {
  CatalogoLreOpcion,
  ConceptoListado,
  ConceptoMantenimientoFila,
  ConceptoMantenimientoPayload,
  ContratoResumenPersona,
  HaberDescuentoAsignacionListado,
  HaberDescuentoAsignacionPayload,
  PERIODICIDADES_HD,
} from '../models/haber-descuento-asignacion.model';

/** Reservado: solo con regla administrativa explícita. */
const PERMITIR_ASIGNAR_CONCEPTOS_AUTOMATICOS = false;

@Injectable({ providedIn: 'root' })
export class HaberesDescuentosService {
  private readonly repository = inject(HaberesDescuentosRepository);

  listarCatalogoLre(): Promise<CatalogoLreOpcion[]> {
    return this.repository.listarCatalogoLreVigentes();
  }

  listarContratosPersona(idPersona: number): Promise<ContratoResumenPersona[]> {
    return this.repository.listarContratosPorPersona(idPersona);
  }

  listarConceptos(): Promise<ConceptoListado[]> {
    return this.repository.listarConceptosAsignables();
  }

  listarConceptosMantenimiento(): Promise<ConceptoMantenimientoFila[]> {
    return this.repository.listarConceptosMantenimiento();
  }

  listarPorPersona(idPersona: number): Promise<HaberDescuentoAsignacionListado[]> {
    return this.repository.listarAsignacionesPorPersona(idPersona);
  }

  private async assertConceptoPermiteAsignacionManual(idConcepto: number): Promise<void> {
    const meta = await this.repository.obtenerConceptoParaAsignacion(idConcepto);
    if (!meta) {
      throw new Error('Concepto no encontrado.');
    }
    if (meta.tipo === 'APORTE_EMPLEADOR') {
      throw new Error('Los aportes empleador no se asignan manualmente al trabajador.');
    }
    if (meta.es_sistema) {
      throw new Error('Los conceptos de sistema no pueden asignarse manualmente.');
    }
    if (meta.calculo_automatico && !PERMITIR_ASIGNAR_CONCEPTOS_AUTOMATICOS) {
      throw new Error('Este concepto es calculado por el sistema y no admite asignación manual.');
    }
  }

  private async validarContratoPersona(
    idPersona: number,
    idContrato: number | null,
  ): Promise<void> {
    if (idContrato == null) {
      return;
    }
    const ok = await this.repository.contratoPerteneceAPersona(idPersona, idContrato);
    if (!ok) {
      throw new Error('El contrato seleccionado no pertenece al trabajador.');
    }
  }

  async crear(payload: HaberDescuentoAsignacionPayload): Promise<void> {
    this.validarPayloadAsignacion(payload);
    await this.validarContratoPersona(payload.idPersona, payload.idContrato);
    await this.assertConceptoPermiteAsignacionManual(payload.idConcepto);
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
    this.validarPayloadAsignacion(payload);
    await this.validarContratoPersona(payload.idPersona, payload.idContrato);
    await this.assertConceptoPermiteAsignacionManual(payload.idConcepto);
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

  async crearConcepto(payload: ConceptoMantenimientoPayload): Promise<number> {
    this.validarPayloadConcepto(payload);
    return this.repository.crearConcepto(payload);
  }

  async actualizarConcepto(idConcepto: number, payload: ConceptoMantenimientoPayload): Promise<void> {
    this.validarPayloadConcepto(payload);
    await this.repository.actualizarConcepto(idConcepto, payload);
  }

  async eliminarConcepto(idConcepto: number): Promise<void> {
    const flags = await this.repository.obtenerConceptoFlags(idConcepto);
    if (flags?.esSistema) {
      throw new Error('No se puede eliminar un concepto de sistema.');
    }
    const uso = await this.repository.contarUsoConcepto(idConcepto);
    if (uso.liquidacionDetalle > 0) {
      throw new Error('No se puede eliminar: el concepto tiene líneas en liquidaciones.');
    }
    if (uso.asignaciones > 0) {
      throw new Error('No se puede eliminar: el concepto está asignado a trabajadores.');
    }
    await this.repository.eliminarConcepto(idConcepto);
  }

  private validarPayloadAsignacion(payload: HaberDescuentoAsignacionPayload): void {
    if (!payload.idPersona || !payload.idConcepto) {
      throw new Error('Trabajador y concepto son obligatorios.');
    }
    if (payload.periodicidad != null && !PERIODICIDADES_HD.includes(payload.periodicidad)) {
      throw new Error('La periodicidad no es válida.');
    }
    if (payload.vigenciaInicio && payload.vigenciaFin) {
      if (payload.vigenciaFin < payload.vigenciaInicio) {
        throw new Error('La vigencia fin debe ser mayor o igual a la vigencia inicio.');
      }
    }
    if (!payload.vigenciaInicio && payload.vigenciaFin) {
      throw new Error('Si informa vigencia fin, debe informar vigencia inicio.');
    }
    if (payload.tipoValor === 'FIJO') {
      if (payload.monto == null || payload.monto < 0) {
        throw new Error('El monto debe ser mayor o igual a 0.');
      }
    } else if (payload.tipoValor === 'PORCENTAJE') {
      if (payload.porcentaje == null || payload.porcentaje < 0) {
        throw new Error('El porcentaje debe ser mayor o igual a 0.');
      }
      if (payload.porcentaje > 100) {
        throw new Error('El porcentaje no puede superar 100.');
      }
    } else {
      throw new Error('Tipo de valor invalido.');
    }
  }

  private validarPayloadConcepto(p: ConceptoMantenimientoPayload): void {
    if (!p.codigo?.trim()) {
      throw new Error('El código es obligatorio.');
    }
    if (!p.nombre?.trim()) {
      throw new Error('El nombre es obligatorio.');
    }
    if (!p.tipo || !['HABER', 'DESCUENTO', 'APORTE_EMPLEADOR'].includes(p.tipo)) {
      throw new Error('El tipo de concepto no es válido.');
    }
    if (p.naturaleza != null && !['IMPONIBLE', 'NO_IMPONIBLE'].includes(p.naturaleza)) {
      throw new Error('La naturaleza no es válida.');
    }
    if (p.vigenciaInicio && p.vigenciaFin && p.vigenciaFin < p.vigenciaInicio) {
      throw new Error('La vigencia fin debe ser mayor o igual a la vigencia inicio.');
    }
    if (!Number.isInteger(p.ordenImpresion) || p.ordenImpresion < 0) {
      throw new Error('Orden impresión inválido.');
    }
  }
}
