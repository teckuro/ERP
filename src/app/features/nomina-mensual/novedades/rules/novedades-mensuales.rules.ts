import { esPeriodoRemuneracionValido } from '../../../../shared/dominio/periodo';
import {
  NOVEDAD_MENSUAL_CATEGORIAS,
  NOVEDAD_MENSUAL_ESTADOS,
  NOVEDAD_MENSUAL_ORIGENES,
  NOVEDAD_MENSUAL_TIPOS_MOVIMIENTO,
  type CrearNovedadMensualInput,
  type NovedadMensual,
  type NovedadMensualCategoria,
  type NovedadMensualEstado,
  type NovedadMensualOrigen,
  type NovedadMensualTipoMovimiento,
} from '../models/novedad-mensual.model';
import {
  esConceptoReservadoContrato,
  motivoConceptoReservadoContrato,
  type ConceptoReservadoContratoInput,
} from '../../../haberes-descuentos/rules/concepto-contrato-reservado.rules';
import {
  esMotivoLicenciaMedicaMotor,
  esRegistroAusenciaLicencia,
  requiereFolioLicencia,
} from '../models/motivo-ausencia.model';

export const NOVEDAD_MENSUAL_ERRORES = [
  'NOVEDAD_PERIODO_INVALIDO',
  'NOVEDAD_PERSONA_REQUERIDA',
  'NOVEDAD_CONCEPTO_REQUERIDO',
  'NOVEDAD_CATEGORIA_INVALIDA',
  'NOVEDAD_ORIGEN_INVALIDO',
  'NOVEDAD_ESTADO_INVALIDO',
  'NOVEDAD_TIPO_MOVIMIENTO_INVALIDO',
  'NOVEDAD_MONTO_INVALIDO',
  'NOVEDAD_CANTIDAD_INVALIDA',
  'NOVEDAD_MONEDA_INVALIDA',
  'NOVEDAD_ESTADO_NO_EDITABLE',
  'NOVEDAD_TRANSICION_INVALIDA',
  'NOVEDAD_CANTIDAD_REQUERIDA',
  'NOVEDAD_MONTO_REQUERIDO',
  'NOVEDAD_OBSERVACION_REQUERIDA',
  'NOVEDAD_CONCEPTO_RESERVADO',
  'NOVEDAD_MOTIVO_AUSENCIA_REQUERIDO',
  'NOVEDAD_FOLIO_LICENCIA_REQUERIDO',
] as const;

export type NovedadMensualErrorCodigo = (typeof NOVEDAD_MENSUAL_ERRORES)[number];

export interface NovedadMensualError {
  codigo: NovedadMensualErrorCodigo;
  mensaje: string;
}

export interface ResultadoValidacionNovedadMensual {
  valido: boolean;
  errores: NovedadMensualError[];
}

export interface ValidarNovedadMensualOpciones {
  paraAprobacion?: boolean;
  concepto?: ConceptoReservadoContratoInput | null;
}

export type NovedadMensualValidacionInput = Partial<CrearNovedadMensualInput> & {
  estado?: NovedadMensualEstado | string | null;
};

const ESTADOS_SET = new Set<string>(NOVEDAD_MENSUAL_ESTADOS);
const CATEGORIAS_SET = new Set<string>(NOVEDAD_MENSUAL_CATEGORIAS);
const ORIGENES_SET = new Set<string>(NOVEDAD_MENSUAL_ORIGENES);
const TIPOS_SET = new Set<string>(NOVEDAD_MENSUAL_TIPOS_MOVIMIENTO);

const TRANSICIONES_PERMITIDAS: Readonly<Record<NovedadMensualEstado, readonly NovedadMensualEstado[]>> = {
  borrador: ['pendiente_revision', 'anulada'],
  pendiente_revision: ['aprobada', 'rechazada', 'anulada'],
  aprobada: ['incorporada_a_pre_nomina', 'anulada'],
  rechazada: ['borrador'],
  incorporada_a_pre_nomina: ['calculada'],
  calculada: [],
  anulada: [],
};

function error(codigo: NovedadMensualErrorCodigo, mensaje: string): NovedadMensualError {
  return { codigo, mensaje };
}

export function esEstadoNovedadMensualValido(value: string | null | undefined): value is NovedadMensualEstado {
  return value != null && ESTADOS_SET.has(value);
}

export function esCategoriaNovedadMensualValida(value: string | null | undefined): value is NovedadMensualCategoria {
  return value != null && CATEGORIAS_SET.has(value);
}

export function esOrigenNovedadMensualValido(value: string | null | undefined): value is NovedadMensualOrigen {
  return value != null && ORIGENES_SET.has(value);
}

export function esTipoMovimientoNovedadMensualValido(
  value: string | null | undefined,
): value is NovedadMensualTipoMovimiento {
  return value != null && TIPOS_SET.has(value);
}

export function normalizarMoneda(moneda: string | null | undefined): string {
  const value = moneda?.trim().toUpperCase();
  return value ? value : 'CLP';
}

export function requiereConceptoCatalogo(
  categoria: NovedadMensualCategoria | string | null | undefined,
): boolean {
  return !esRegistroAusenciaLicencia(categoria ?? '');
}

export function requiereMotivoAusencia(
  categoria: NovedadMensualCategoria | string | null | undefined,
): boolean {
  return esRegistroAusenciaLicencia(categoria ?? '');
}

export function requiereCantidad(
  categoria: NovedadMensualCategoria | string | null | undefined,
  tipoMovimiento: NovedadMensualTipoMovimiento | string | null | undefined,
): boolean {
  if (categoria === 'tiempo_trabajado_adicional' || categoria === 'ausencia_descuento_tiempo') return true;
  return tipoMovimiento === 'informativo' && categoria === 'licencia_permiso';
}

export function requiereMonto(
  categoria: NovedadMensualCategoria | string | null | undefined,
  tipoMovimiento: NovedadMensualTipoMovimiento | string | null | undefined,
): boolean {
  if (tipoMovimiento === 'informativo') return false;
  return (
    categoria === 'haber_variable' ||
    categoria === 'anticipo_descuento_unico' ||
    categoria === 'retroactivo_reintegro' ||
    categoria === 'ajuste_manual_controlado'
  );
}

export function puedeEditarNovedad(novedad: Pick<NovedadMensual, 'estado'>): ResultadoValidacionNovedadMensual {
  if (novedad.estado === 'calculada') {
    return {
      valido: false,
      errores: [error('NOVEDAD_ESTADO_NO_EDITABLE', 'Una novedad calculada no puede editarse libremente.')],
    };
  }
  return { valido: true, errores: [] };
}

export function puedeCambiarEstadoNovedad(
  estadoActual: NovedadMensualEstado,
  estadoDestino: NovedadMensualEstado,
): ResultadoValidacionNovedadMensual {
  if (!TRANSICIONES_PERMITIDAS[estadoActual].includes(estadoDestino)) {
    return {
      valido: false,
      errores: [
        error(
          'NOVEDAD_TRANSICION_INVALIDA',
          `Transicion de novedad no permitida: ${estadoActual} -> ${estadoDestino}.`,
        ),
      ],
    };
  }
  return { valido: true, errores: [] };
}

export function puedeAprobarNovedad(novedad: NovedadMensual): ResultadoValidacionNovedadMensual {
  if (novedad.estado === 'anulada') {
    return {
      valido: false,
      errores: [error('NOVEDAD_TRANSICION_INVALIDA', 'Una novedad anulada no puede aprobarse.')],
    };
  }
  return puedeCambiarEstadoNovedad(novedad.estado, 'aprobada');
}

export function puedeAnularNovedad(novedad: Pick<NovedadMensual, 'estado'>): ResultadoValidacionNovedadMensual {
  if (novedad.estado === 'calculada' || novedad.estado === 'incorporada_a_pre_nomina' || novedad.estado === 'anulada') {
    return {
      valido: false,
      errores: [
        error(
          'NOVEDAD_TRANSICION_INVALIDA',
          'No se puede anular una novedad calculada, incorporada a pre-nomina o ya anulada.',
        ),
      ],
    };
  }
  return { valido: true, errores: [] };
}

export function puedeEliminarNovedad(novedad: Pick<NovedadMensual, 'estado'>): ResultadoValidacionNovedadMensual {
  if (novedad.estado !== 'borrador') {
    return {
      valido: false,
      errores: [error('NOVEDAD_TRANSICION_INVALIDA', 'Solo se puede eliminar fisicamente una novedad en borrador.')],
    };
  }
  return { valido: true, errores: [] };
}

export function validarNovedadMensualInput(
  input: NovedadMensualValidacionInput,
  options: ValidarNovedadMensualOpciones = {},
): ResultadoValidacionNovedadMensual {
  const errores: NovedadMensualError[] = [];
  const categoria = input.categoria;
  const tipoMovimiento = input.tipoMovimiento;
  const origen = input.origen ?? 'manual';
  const estado = input.estado ?? 'borrador';
  const moneda = normalizarMoneda(input.moneda);

  if (!esPeriodoRemuneracionValido(input.periodo)) {
    errores.push(error('NOVEDAD_PERIODO_INVALIDO', 'El periodo debe tener formato YYYY-MM.'));
  }
  if (input.idPersona == null || input.idPersona <= 0) {
    errores.push(error('NOVEDAD_PERSONA_REQUERIDA', 'Debe indicar un trabajador valido.'));
  }
  const requiereConcepto = esCategoriaNovedadMensualValida(categoria) && requiereConceptoCatalogo(categoria);
  if (requiereConcepto && (input.idConcepto == null || input.idConcepto <= 0)) {
    errores.push(error('NOVEDAD_CONCEPTO_REQUERIDO', 'Debe indicar un concepto valido.'));
  }
  if (
    esCategoriaNovedadMensualValida(categoria)
    && requiereMotivoAusencia(categoria)
    && !input.codigoMotivoAusencia?.trim()
  ) {
    errores.push(error('NOVEDAD_MOTIVO_AUSENCIA_REQUERIDO', 'Debe indicar el motivo de ausencia o licencia.'));
  }
  if (
    esCategoriaNovedadMensualValida(categoria)
    && requiereMotivoAusencia(categoria)
    && requiereFolioLicencia(input.codigoMotivoAusencia)
    && !input.referenciaExterna?.trim()
  ) {
    errores.push(error('NOVEDAD_FOLIO_LICENCIA_REQUERIDO', 'Debe indicar el folio de la licencia medica.'));
  }
  if (
    esCategoriaNovedadMensualValida(categoria)
    && requiereMotivoAusencia(categoria)
    && (input.cantidad == null || input.cantidad <= 0)
  ) {
    errores.push(error('NOVEDAD_CANTIDAD_REQUERIDA', 'Debe indicar la cantidad de dias.'));
  }
  if (options.concepto && input.idConcepto != null && esConceptoReservadoContrato(options.concepto)) {
    errores.push(error('NOVEDAD_CONCEPTO_RESERVADO', motivoConceptoReservadoContrato(options.concepto)));
  }
  if (!esCategoriaNovedadMensualValida(categoria)) {
    errores.push(error('NOVEDAD_CATEGORIA_INVALIDA', 'La categoria de la novedad no es valida.'));
  }
  if (!esTipoMovimientoNovedadMensualValido(tipoMovimiento)) {
    errores.push(error('NOVEDAD_TIPO_MOVIMIENTO_INVALIDO', 'El tipo de movimiento no es valido.'));
  }
  if (!esOrigenNovedadMensualValido(origen)) {
    errores.push(error('NOVEDAD_ORIGEN_INVALIDO', 'El origen de la novedad no es valido.'));
  }
  if (!esEstadoNovedadMensualValido(estado)) {
    errores.push(error('NOVEDAD_ESTADO_INVALIDO', 'El estado de la novedad no es valido.'));
  }
  if (input.cantidad != null && (!Number.isFinite(input.cantidad) || input.cantidad <= 0)) {
    errores.push(error('NOVEDAD_CANTIDAD_INVALIDA', 'La cantidad debe ser mayor que cero cuando se informa.'));
  }
  if (input.monto != null && (!Number.isFinite(input.monto) || input.monto < 0)) {
    errores.push(error('NOVEDAD_MONTO_INVALIDO', 'El monto debe ser mayor o igual a cero cuando se informa.'));
  }
  if (!/^[A-Z]{3}$/.test(moneda)) {
    errores.push(error('NOVEDAD_MONEDA_INVALIDA', 'La moneda debe usar codigo ISO de tres letras.'));
  }

  if (options.paraAprobacion && esCategoriaNovedadMensualValida(categoria) && esTipoMovimientoNovedadMensualValido(tipoMovimiento)) {
    if (requiereCantidad(categoria, tipoMovimiento) && input.cantidad == null) {
      errores.push(error('NOVEDAD_CANTIDAD_REQUERIDA', 'La novedad requiere cantidad antes de aprobarse.'));
    }
    if (requiereMonto(categoria, tipoMovimiento) && input.monto == null) {
      errores.push(error('NOVEDAD_MONTO_REQUERIDO', 'La novedad requiere monto antes de aprobarse.'));
    }
    if (requiereMotivoAusencia(categoria) && esMotivoLicenciaMedicaMotor(input.codigoMotivoAusencia) && !input.referenciaExterna?.trim()) {
      errores.push(error('NOVEDAD_FOLIO_LICENCIA_REQUERIDO', 'La licencia medica requiere folio antes de aprobarse.'));
    }
  }

  return { valido: errores.length === 0, errores };
}

export function validarObservacionRechazo(observacion: string | null | undefined): ResultadoValidacionNovedadMensual {
  if (!observacion?.trim()) {
    return {
      valido: false,
      errores: [error('NOVEDAD_OBSERVACION_REQUERIDA', 'Debe indicar una observacion para rechazar la novedad.')],
    };
  }
  return { valido: true, errores: [] };
}
