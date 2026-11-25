import { esPeriodoRemuneracionValido } from '../../../shared/dominio/periodo';
import { Injectable, inject } from '@angular/core';

import { primerDiaSqlDesdeYm, vigenciaIntersecaMes } from '../../../core/services/periodo-activo.service';
import { EmpleadosService } from '../../empleados/services/empleados.service';
import { HaberesDescuentosService } from '../../haberes-descuentos/services/haberes-descuentos.service';
import { MovimientosVariablesRepository } from '../data-access/movimientos-variables.repository';
import type {
  MovimientoVariable,
  MovimientoVariableActualizarPayload,
  MovimientoVariableAnularPayload,
  MovimientoVariableCrearPayload,
  MovimientoVariableEstado,
  MovimientoVariableListadoFila,
  MovimientoVariableOrigen,
  MovimientoVariableConceptoSnapshot,
} from '../models/movimiento-variable.model';
import {
  existeDuplicadoMovimientoVariable,
  puedeAnularMovimientoVariable,
  validarMovimientoVariableInput,
  type MovimientoVariableFilaDuplicado,
  type MovimientoVariableInput,
} from '../rules/movimiento-variable-validacion.rules';

const MSG_PERIODO_INVALIDO = 'El periodo debe tener formato YYYY-MM.';
const MSG_TRABAJADOR = 'Debe seleccionar un trabajador.';
const MSG_CONCEPTO = 'Debe seleccionar un concepto.';
const MSG_NO_ENCONTRADO = 'No se encontro el movimiento del mes.';
const MSG_NO_MODIFICA = 'El movimiento del mes no puede modificarse en su estado actual.';
const MSG_NO_ANULA = 'El movimiento del mes no puede anularse en su estado actual.';
const MSG_DUPLICADO = 'Ya existe un movimiento del mes operativo para este trabajador, concepto y periodo.';
const MSG_ID_MOVIMIENTO = 'Debe indicar un movimiento valido.';
const MSG_TRABAJADOR_NO_ENCONTRADO = 'No se encontro el trabajador seleccionado.';
const MSG_TRABAJADOR_NO_APTO =
  'El trabajador no esta apto para registrar movimientos del mes.';
const MSG_TRABAJADOR_NO_ACTIVO =
  'Solo trabajadores activos pueden registrar movimientos del mes en esta version.';
const MSG_CONTRATO_SIN_INGRESO =
  'El contrato del trabajador no tiene fecha de ingreso registrada.';
const MSG_CONTRATO_NO_VIGENTE_EN_PERIODO =
  'El contrato del trabajador no esta vigente en el periodo del movimiento.';

const ESTADOS_SIN_EDICION = new Set<MovimientoVariableEstado>(['ANULADO', 'BLOQUEADO', 'INCLUIDO_EN_PROCESO']);

function assertValidacion(valido: boolean, motivos: string[]): void {
  if (!valido) {
    throw new Error(motivos[0] ?? 'Los datos del movimiento no son validos.');
  }
}

function filasDuplicadoDesdeMovimientos(rows: MovimientoVariable[]): MovimientoVariableFilaDuplicado[] {
  return rows.map((r) => ({
    idPersona: r.idPersona,
    idConcepto: r.idConcepto,
    periodo: r.periodo,
    estado: r.estado,
  }));
}

function mergeParaValidacion(
  actual: MovimientoVariable,
  payload: MovimientoVariableActualizarPayload,
): MovimientoVariableInput {
  return {
    idPersona: payload.idPersona ?? actual.idPersona,
    idConcepto: payload.idConcepto ?? actual.idConcepto,
    periodo: payload.periodo ?? actual.periodo,
    monto: payload.monto ?? actual.monto,
    estado: payload.estado ?? actual.estado,
    observacion: payload.observacion !== undefined ? payload.observacion : actual.observacion ?? null,
  };
}

/** Primer instante del mes del periodo (referencia catalogo / vigencia contrato). */
function inicioMesDesdePeriodoYm(ym: string): Date {
  const sql = primerDiaSqlDesdeYm(ym.trim());
  const [y, m, d] = sql.split('-').map((x) => Number(x));
  return new Date(y, m - 1, d, 0, 0, 0, 0);
}

function aListadoFila(m: MovimientoVariable): MovimientoVariableListadoFila {
  if (m.idMovimiento == null) {
    throw new Error('Datos inconsistentes: falta el identificador del movimiento.');
  }
  return {
    idMovimiento: m.idMovimiento,
    idPersona: m.idPersona,
    idConcepto: m.idConcepto,
    periodo: m.periodo,
    monto: m.monto,
    estado: m.estado,
    origen: (m.origen ?? 'MANUAL') as MovimientoVariableOrigen,
    observacion: m.observacion ?? null,
  };
}

/** Capa fina de negocio: validaciones 9.4B, mensajes claros, delegación al repositorio 9.4C. Sin UI. */
@Injectable({ providedIn: 'root' })
export class MovimientosVariablesService {
  private readonly repository = inject(MovimientosVariablesRepository);
  private readonly haberesDescuentosService = inject(HaberesDescuentosService);
  private readonly empleadosService = inject(EmpleadosService);

  private assertIdPersona(idPersona: number): void {
    if (idPersona == null || idPersona <= 0) {
      throw new Error(MSG_TRABAJADOR);
    }
  }

  private assertIdConcepto(idConcepto: number): void {
    if (idConcepto == null || idConcepto <= 0) {
      throw new Error(MSG_CONCEPTO);
    }
  }

  private assertPeriodoListado(periodo: string | null | undefined): void {
    if (!esPeriodoRemuneracionValido(periodo)) {
      throw new Error(MSG_PERIODO_INVALIDO);
    }
  }

  private assertIdMovimiento(idMovimiento: number): void {
    if (idMovimiento == null || idMovimiento <= 0) {
      throw new Error(MSG_ID_MOVIMIENTO);
    }
  }

  private stripConceptoDeCrear(payload: MovimientoVariableCrearPayload): MovimientoVariableCrearPayload {
    const { concepto: _omit, ...rest } = payload;
    void _omit;
    return rest;
  }

  private stripConceptoDeActualizar(payload: MovimientoVariableActualizarPayload): MovimientoVariableActualizarPayload {
    const { concepto: _omit, ...rest } = payload;
    void _omit;
    return rest;
  }

  private async assertPersonaAptaMovimientoVariable(idPersona: number, periodo: string): Promise<void> {
    const emp = await this.empleadosService.obtenerPorId(idPersona);
    if (!emp) {
      throw new Error(MSG_TRABAJADOR_NO_ENCONTRADO);
    }
    if (!emp.aptoParaRemuneraciones) {
      throw new Error(MSG_TRABAJADOR_NO_APTO);
    }
    if (emp.estado !== 'activo') {
      throw new Error(MSG_TRABAJADOR_NO_ACTIVO);
    }
    const contrato = emp.formValue.contrato as Record<string, unknown>;
    const fechaIngresoRaw = contrato['fechaIngreso'];
    const fechaIngreso =
      typeof fechaIngresoRaw === 'string' && fechaIngresoRaw.trim() !== '' ? fechaIngresoRaw.trim() : '';
    if (!fechaIngreso) {
      throw new Error(MSG_CONTRATO_SIN_INGRESO);
    }
    const fechaTerminoRaw = contrato['fechaTermino'];
    const fechaTermino =
      typeof fechaTerminoRaw === 'string' && fechaTerminoRaw.trim() !== '' ? fechaTerminoRaw.trim() : null;
    const per = periodo.trim();
    if (!vigenciaIntersecaMes(fechaIngreso, fechaTermino, per)) {
      throw new Error(MSG_CONTRATO_NO_VIGENTE_EN_PERIODO);
    }
  }

  private async resolverSnapshotConceptoConfiable(
    idConcepto: number,
    periodo: string,
  ): Promise<MovimientoVariableConceptoSnapshot> {
    const ref = inicioMesDesdePeriodoYm(periodo);
    return this.haberesDescuentosService.resolverSnapshotConceptoParaMovimientoVariableManual(idConcepto, ref);
  }

  /**
   * Listado base por periodo (filas con `idMovimiento` obligatorio).
   */
  async listarPorPeriodo(periodo: string): Promise<MovimientoVariableListadoFila[]> {
    this.assertPeriodoListado(periodo);
    const rows = await this.repository.listarPorPeriodo(periodo);
    return rows.map((r) => aListadoFila(r));
  }

  /**
   * Listado base por trabajador y periodo.
   */
  async listarPorPersonaYPeriodo(idPersona: number, periodo: string): Promise<MovimientoVariableListadoFila[]> {
    this.assertIdPersona(idPersona);
    this.assertPeriodoListado(periodo);
    const rows = await this.repository.listarPorPersonaYPeriodo(idPersona, periodo);
    return rows.map((r) => aListadoFila(r));
  }

  async obtenerPorId(idMovimiento: number): Promise<MovimientoVariable | null> {
    this.assertIdMovimiento(idMovimiento);
    return this.repository.obtenerPorId(idMovimiento);
  }

  async crear(payload: MovimientoVariableCrearPayload): Promise<MovimientoVariable> {
    this.assertIdPersona(payload.idPersona);
    this.assertIdConcepto(payload.idConcepto);
    this.assertPeriodoListado(payload.periodo);

    await this.assertPersonaAptaMovimientoVariable(payload.idPersona, payload.periodo);
    const snapshot = await this.resolverSnapshotConceptoConfiable(payload.idConcepto, payload.periodo);
    const input: MovimientoVariableInput = {
      idPersona: payload.idPersona,
      idConcepto: payload.idConcepto,
      periodo: payload.periodo,
      monto: payload.monto,
      estado: payload.estado ?? 'BORRADOR',
      observacion: payload.observacion ?? null,
    };

    const v = validarMovimientoVariableInput(input, snapshot);
    assertValidacion(v.valido, v.motivos);

    const dupRows = await this.repository.listarDuplicadosOperativos(
      payload.idPersona,
      payload.idConcepto,
      payload.periodo,
    );
    if (existeDuplicadoMovimientoVariable(input, filasDuplicadoDesdeMovimientos(dupRows))) {
      throw new Error(MSG_DUPLICADO);
    }

    return this.repository.crear(this.stripConceptoDeCrear(payload));
  }

  async actualizar(idMovimiento: number, payload: MovimientoVariableActualizarPayload): Promise<MovimientoVariable> {
    this.assertIdMovimiento(idMovimiento);
    if (payload.idMovimiento !== idMovimiento) {
      throw new Error('El identificador del movimiento no coincide con la solicitud.');
    }

    const actual = await this.repository.obtenerPorId(idMovimiento);
    if (!actual) {
      throw new Error(MSG_NO_ENCONTRADO);
    }

    if (ESTADOS_SIN_EDICION.has(actual.estado)) {
      throw new Error(MSG_NO_MODIFICA);
    }

    if (payload.estado === 'ANULADO') {
      throw new Error('Para anular debe usar la operación de anulación.');
    }

    const merged = mergeParaValidacion(actual, payload);
    await this.assertPersonaAptaMovimientoVariable(merged.idPersona!, merged.periodo!);
    const snapshot = await this.resolverSnapshotConceptoConfiable(merged.idConcepto!, merged.periodo!);
    const v = validarMovimientoVariableInput(merged, snapshot);
    assertValidacion(v.valido, v.motivos);

    const dupRows = await this.repository.listarDuplicadosOperativos(
      merged.idPersona!,
      merged.idConcepto!,
      merged.periodo!,
      idMovimiento,
    );
    if (existeDuplicadoMovimientoVariable(merged, filasDuplicadoDesdeMovimientos(dupRows))) {
      throw new Error(MSG_DUPLICADO);
    }

    return this.repository.actualizar(idMovimiento, this.stripConceptoDeActualizar(payload));
  }

  async anular(idMovimiento: number, payload: MovimientoVariableAnularPayload): Promise<MovimientoVariable> {
    this.assertIdMovimiento(idMovimiento);
    if (payload.idMovimiento !== idMovimiento) {
      throw new Error('El identificador del movimiento no coincide con la solicitud.');
    }

    const actual = await this.repository.obtenerPorId(idMovimiento);
    if (!actual) {
      throw new Error(MSG_NO_ENCONTRADO);
    }

    const p = puedeAnularMovimientoVariable(actual.estado);
    if (!p.valido) {
      throw new Error(p.motivos[0] ?? MSG_NO_ANULA);
    }

    return this.repository.anular(idMovimiento, payload);
  }
}
