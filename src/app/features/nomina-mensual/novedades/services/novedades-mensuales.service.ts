import { Injectable, inject } from '@angular/core';

import { HaberesDescuentosService } from '../../../haberes-descuentos/services/haberes-descuentos.service';
import { NovedadesMensualesRepository } from '../data-access/novedades-mensuales.repository';
import type {
  ActualizarNovedadMensualInput,
  CambiarEstadoNovedadMensualInput,
  CrearNovedadMensualInput,
  NovedadMensual,
} from '../models/novedad-mensual.model';
import {
  normalizarMoneda,
  puedeAnularNovedad,
  puedeAprobarNovedad,
  puedeCambiarEstadoNovedad,
  puedeEditarNovedad,
  puedeEliminarNovedad,
  requiereConceptoCatalogo,
  validarNovedadMensualInput,
  validarObservacionRechazo,
  validarPeriodoNovedad,
  type NovedadMensualValidacionInput,
  type ResultadoValidacionNovedadMensual,
} from '../rules/novedades-mensuales.rules';

const MSG_NO_ENCONTRADA = 'No se encontro la novedad mensual.';
const MSG_ID_NOVEDAD = 'Debe indicar una novedad mensual valida.';
const MSG_PERIODO = 'El periodo debe tener formato YYYY-MM.';
const MSG_PERSONA = 'Debe indicar un trabajador valido.';

function assertValidacion(resultado: ResultadoValidacionNovedadMensual): void {
  if (!resultado.valido) {
    throw new Error(resultado.errores[0]?.mensaje ?? 'La novedad mensual no es valida.');
  }
}

function assertIdNovedad(idNovedad: number): void {
  if (idNovedad == null || idNovedad <= 0) {
    throw new Error(MSG_ID_NOVEDAD);
  }
}

function assertPeriodo(periodo: string): void {
  if (!validarPeriodoNovedad(periodo)) {
    throw new Error(MSG_PERIODO);
  }
}

function assertPersona(idPersona: number): void {
  if (idPersona == null || idPersona <= 0) {
    throw new Error(MSG_PERSONA);
  }
}

function normalizarCrearInput(input: CrearNovedadMensualInput): CrearNovedadMensualInput {
  return {
    ...input,
    periodo: input.periodo.trim(),
    moneda: normalizarMoneda(input.moneda),
    origen: input.origen ?? 'manual',
    unidad: input.unidad?.trim() ? input.unidad.trim() : null,
    observacion: input.observacion?.trim() ? input.observacion.trim() : null,
    referenciaExterna: input.referenciaExterna?.trim() ? input.referenciaExterna.trim() : null,
  };
}

function mergeParaValidacion(
  actual: NovedadMensual,
  input: ActualizarNovedadMensualInput,
): NovedadMensualValidacionInput {
  return {
    periodo: input.periodo ?? actual.periodo,
    idPersona: input.idPersona ?? actual.idPersona,
    idContrato: input.idContrato !== undefined ? input.idContrato : actual.idContrato,
    idConcepto: input.idConcepto ?? actual.idConcepto,
    categoria: input.categoria ?? actual.categoria,
    tipoMovimiento: input.tipoMovimiento ?? actual.tipoMovimiento,
    cantidad: input.cantidad !== undefined ? input.cantidad : actual.cantidad,
    unidad: input.unidad !== undefined ? input.unidad : actual.unidad,
    monto: input.monto !== undefined ? input.monto : actual.monto,
    moneda: input.moneda ?? actual.moneda,
    origen: input.origen ?? actual.origen,
    fechaEvento: input.fechaEvento !== undefined ? input.fechaEvento : actual.fechaEvento,
    observacion: input.observacion !== undefined ? input.observacion : actual.observacion,
    referenciaExterna:
      input.referenciaExterna !== undefined ? input.referenciaExterna : actual.referenciaExterna,
    codigoMotivoAusencia:
      input.codigoMotivoAusencia !== undefined ? input.codigoMotivoAusencia : actual.codigoMotivoAusencia,
    idLicencia: input.idLicencia !== undefined ? input.idLicencia : actual.idLicencia,
    estado: actual.estado,
  };
}

@Injectable({ providedIn: 'root' })
export class NovedadesMensualesService {
  private readonly repository = inject(NovedadesMensualesRepository);
  private readonly haberesDescuentosService = inject(HaberesDescuentosService);

  private async assertConceptoPermiteNovedad(idConcepto: number, periodo: string): Promise<void> {
    const ref = new Date(`${periodo.trim()}-01T12:00:00`);
    await this.haberesDescuentosService.resolverSnapshotConceptoParaMovimientoVariableManual(
      idConcepto,
      ref,
    );
  }

  async listarNovedadesPeriodo(periodo: string): Promise<NovedadMensual[]> {
    assertPeriodo(periodo);
    return this.repository.listarPorPeriodo(periodo.trim());
  }

  async listarNovedadesPeriodoYPersona(periodo: string, idPersona: number): Promise<NovedadMensual[]> {
    assertPeriodo(periodo);
    assertPersona(idPersona);
    return this.repository.listarPorPeriodoYPersona(periodo.trim(), idPersona);
  }

  async obtenerNovedad(idNovedad: number): Promise<NovedadMensual | null> {
    assertIdNovedad(idNovedad);
    return this.repository.obtenerPorId(idNovedad);
  }

  validarNovedad(input: NovedadMensualValidacionInput): ResultadoValidacionNovedadMensual {
    return validarNovedadMensualInput(input);
  }

  async guardarBorrador(input: CrearNovedadMensualInput): Promise<NovedadMensual> {
    return this.crearNovedad(input);
  }

  async crearNovedad(input: CrearNovedadMensualInput): Promise<NovedadMensual> {
    const normalizado = normalizarCrearInput(input);
    assertValidacion(validarNovedadMensualInput({ ...normalizado, estado: 'borrador' }));
    if (requiereConceptoCatalogo(normalizado.categoria) && normalizado.idConcepto != null) {
      await this.assertConceptoPermiteNovedad(normalizado.idConcepto, normalizado.periodo);
    }
    return this.repository.crear(normalizado);
  }

  async actualizarNovedad(idNovedad: number, input: ActualizarNovedadMensualInput): Promise<NovedadMensual> {
    assertIdNovedad(idNovedad);
    const actual = await this.obtenerExistente(idNovedad);
    assertValidacion(puedeEditarNovedad(actual));
    const merged = mergeParaValidacion(actual, input);
    assertValidacion(validarNovedadMensualInput(merged));
    if (requiereConceptoCatalogo(merged.categoria!) && merged.idConcepto != null) {
      await this.assertConceptoPermiteNovedad(merged.idConcepto, merged.periodo!);
    }
    return this.repository.actualizar(idNovedad, input);
  }

  async enviarARevision(idNovedad: number): Promise<NovedadMensual> {
    const actual = await this.obtenerExistente(idNovedad);
    assertValidacion(puedeCambiarEstadoNovedad(actual.estado, 'pendiente_revision'));
    return this.repository.cambiarEstado(idNovedad, 'pendiente_revision');
  }

  async aprobarNovedad(idNovedad: number, usuario: string): Promise<NovedadMensual> {
    const actual = await this.obtenerExistente(idNovedad);
    assertValidacion(puedeAprobarNovedad(actual));
    assertValidacion(validarNovedadMensualInput(actual, { paraAprobacion: true }));
    return this.repository.cambiarEstado(idNovedad, 'aprobada', { aprobadoPor: usuario });
  }

  async rechazarNovedad(idNovedad: number, observacion: string): Promise<NovedadMensual> {
    const actual = await this.obtenerExistente(idNovedad);
    assertValidacion(puedeCambiarEstadoNovedad(actual.estado, 'rechazada'));
    assertValidacion(validarObservacionRechazo(observacion));
    return this.repository.cambiarEstado(idNovedad, 'rechazada', { observacion });
  }

  async anularNovedad(idNovedad: number, observacion?: string | null): Promise<NovedadMensual> {
    const actual = await this.obtenerExistente(idNovedad);
    assertValidacion(puedeAnularNovedad(actual));
    return this.repository.anular(idNovedad, observacion);
  }

  async eliminarSoloBorrador(idNovedad: number): Promise<void> {
    const actual = await this.obtenerExistente(idNovedad);
    assertValidacion(puedeEliminarNovedad(actual));
    await this.repository.eliminarSoloBorrador(idNovedad);
  }

  private async obtenerExistente(idNovedad: number): Promise<NovedadMensual> {
    assertIdNovedad(idNovedad);
    const actual = await this.repository.obtenerPorId(idNovedad);
    if (!actual) {
      throw new Error(MSG_NO_ENCONTRADA);
    }
    return actual;
  }
}
