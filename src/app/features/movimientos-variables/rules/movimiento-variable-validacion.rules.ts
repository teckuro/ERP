import type { MovimientoVariableConceptoSnapshot, MovimientoVariableEstado } from '../models/movimiento-variable.model';
import { MOVIMIENTO_VARIABLE_ESTADOS } from '../models/movimiento-variable.model';
import {
  esConceptoReservadoContrato,
  motivoConceptoReservadoContrato,
} from '../../haberes-descuentos/rules/concepto-contrato-reservado.rules';

export interface MovimientoVariableInput {
  idPersona: number | null;
  idConcepto: number | null;
  periodo: string | null;
  monto: number | null;
  estado?: MovimientoVariableEstado | null;
  observacion?: string | null;
}

export interface ResultadoValidacionMovimientoVariable {
  valido: boolean;
  motivos: string[];
}

/** Estados que participan en regla de duplicado (v1: ANULADO no bloquea nuevo registro). */
export const ESTADOS_MOVIMIENTO_DUPLICADO_OPERATIVOS: readonly MovimientoVariableEstado[] = [
  'BORRADOR',
  'VALIDADO',
  'OBSERVADO',
  'BLOQUEADO',
  'INCLUIDO_EN_PROCESO',
];

const ESTADO_SET = new Set<string>(MOVIMIENTO_VARIABLE_ESTADOS);

export function esEstadoMovimientoVariableValido(valor: string | null | undefined): boolean {
  return valor != null && ESTADO_SET.has(valor);
}

/**
 * Formato periodo remuneracion YYYY-MM (mes 01-12, anio razonable).
 * No consulta periodo cerrado (fase futura).
 */
export function esPeriodoRemuneracionValido(periodo: string | null | undefined): boolean {
  if (periodo == null || typeof periodo !== 'string') {
    return false;
  }
  const t = periodo.trim();
  if (!/^\d{4}-\d{2}$/.test(t)) {
    return false;
  }
  const [, mm] = t.split('-');
  const mes = Number(mm);
  if (mes < 1 || mes > 12) {
    return false;
  }
  const anio = Number(t.slice(0, 4));
  return anio >= 2000 && anio <= 2100;
}

function esMontoMovimientoVariableValido(monto: number | null): boolean {
  if (monto == null || typeof monto !== 'number') {
    return false;
  }
  if (!Number.isFinite(monto) || Number.isNaN(monto)) {
    return false;
  }
  return monto > 0;
}

/**
 * Validacion de campos minimos sin Supabase.
 * Regla de concepto: si se pasa `concepto`, se aplican filtros v1 (HABER/DESCUENTO, no aporte, no automatico).
 * `MovimientosVariablesService` siempre pasa snapshot resuelto en servidor (CHILE-FIX-01); sin `concepto` no hay motivos por tipo.
 */
export function validarMovimientoVariableInput(
  input: MovimientoVariableInput,
  concepto?: MovimientoVariableConceptoSnapshot | null,
): ResultadoValidacionMovimientoVariable {
  const motivos: string[] = [];

  if (input.idPersona == null || input.idPersona <= 0) {
    motivos.push('Debe indicar un trabajador valido (idPersona).');
  }
  if (input.idConcepto == null || input.idConcepto <= 0) {
    motivos.push('Debe indicar un concepto valido (idConcepto).');
  }
  if (!esPeriodoRemuneracionValido(input.periodo)) {
    motivos.push('El periodo debe tener formato YYYY-MM y ser un mes valido.');
  }
  if (!esMontoMovimientoVariableValido(input.monto)) {
    motivos.push('El monto debe ser un numero finito mayor que cero.');
  }

  const estado = input.estado ?? 'BORRADOR';
  if (!esEstadoMovimientoVariableValido(estado)) {
    motivos.push('El estado del movimiento no es valido.');
  }

  if (concepto != null) {
    const tipo = (concepto.tipo ?? '').trim().toUpperCase();
    if (tipo !== 'HABER' && tipo !== 'DESCUENTO') {
      motivos.push('El concepto debe ser tipo HABER o DESCUENTO para movimiento puntual v1.');
    }
    if (concepto.calculoAutomatico === true) {
      motivos.push('No se permiten conceptos con calculo automatico para movimiento puntual manual en v1.');
    }
    if (concepto.esSistema === true) {
      motivos.push('No se permiten conceptos de sistema para movimiento puntual manual en v1.');
    }
    if (
      esConceptoReservadoContrato({
        codigo: concepto.codigo ?? '',
        nombre: concepto.nombre ?? '',
        esSistema: concepto.esSistema ?? false,
      })
    ) {
      motivos.push(motivoConceptoReservadoContrato({
        codigo: concepto.codigo ?? '',
        nombre: concepto.nombre ?? '',
        esSistema: concepto.esSistema ?? false,
      }));
    }
  }

  return { valido: motivos.length === 0, motivos };
}

export interface MovimientoVariableFilaDuplicado {
  idPersona: number;
  idConcepto: number;
  periodo: string;
  estado: MovimientoVariableEstado;
}

/**
 * Duplicado v1: mismo trabajador + concepto + periodo con estado operativo.
 * Filas ANULADO no bloquean un nuevo registro (decision v1 documentada).
 */
export function existeDuplicadoMovimientoVariable(
  candidato: MovimientoVariableInput,
  existentes: readonly MovimientoVariableFilaDuplicado[],
): boolean {
  if (
    candidato.idPersona == null ||
    candidato.idConcepto == null ||
    !esPeriodoRemuneracionValido(candidato.periodo)
  ) {
    return false;
  }
  const per = candidato.periodo!.trim();
  const st = (candidato.estado ?? 'BORRADOR') as MovimientoVariableEstado;
  const estadosCandidatoOperativo = ESTADOS_MOVIMIENTO_DUPLICADO_OPERATIVOS.includes(st);

  for (const row of existentes) {
    if (!ESTADOS_MOVIMIENTO_DUPLICADO_OPERATIVOS.includes(row.estado)) {
      continue;
    }
    if (
      row.idPersona === candidato.idPersona &&
      row.idConcepto === candidato.idConcepto &&
      row.periodo.trim() === per
    ) {
      if (estadosCandidatoOperativo) {
        return true;
      }
    }
  }
  return false;
}

/** Transicion a ANULADO: no permitida desde BLOQUEADO o INCLUIDO_EN_PROCESO (v1 documental). */
export function puedeAnularMovimientoVariable(estadoActual: MovimientoVariableEstado): ResultadoValidacionMovimientoVariable {
  if (estadoActual === 'ANULADO') {
    return { valido: false, motivos: ['El movimiento ya esta anulado.'] };
  }
  if (estadoActual === 'BLOQUEADO' || estadoActual === 'INCLUIDO_EN_PROCESO') {
    return {
      valido: false,
      motivos: ['No se puede anular un movimiento bloqueado o ya incluido en proceso.'],
    };
  }
  return { valido: true, motivos: [] };
}
