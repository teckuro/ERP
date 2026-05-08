import type { HaberDescuentoAsignacionPrevalidacionMensualFila } from '../../../haberes-descuentos/models/haber-descuento-asignacion.model';
import type {
  MovimientoVariableEstado,
  MovimientoVariableListadoFila,
} from '../../../movimientos-variables/models/movimiento-variable.model';
import type { NovedadMensual, NovedadMensualEstado } from '../../novedades/models/novedad-mensual.model';
import type {
  EntradaMensualEstado,
  EntradaMensualPeriodo,
  EntradaMensualTipo,
  ResumenEntradasMensualesPeriodo,
} from '../models/entrada-mensual-periodo.model';

export function validarPeriodoEntradaMensual(periodo: string | null | undefined): boolean {
  if (typeof periodo !== 'string') return false;
  const value = periodo.trim();
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(value)) return false;
  const anio = Number(value.slice(0, 4));
  return anio >= 2000 && anio <= 2100;
}

export function normalizarEstadoNovedadMensual(estado: NovedadMensualEstado | string): EntradaMensualEstado {
  switch (estado) {
    case 'borrador':
    case 'pendiente_revision':
    case 'aprobada':
    case 'rechazada':
    case 'incorporada_a_pre_nomina':
    case 'calculada':
    case 'anulada':
      return estado;
    default:
      return 'pendiente_revision';
  }
}

export function normalizarEstadoMovimientoLegacy(estado: MovimientoVariableEstado | string): EntradaMensualEstado {
  switch (estado) {
    case 'BORRADOR':
      return 'borrador';
    case 'VALIDADO':
      return 'aprobada';
    case 'OBSERVADO':
      return 'observada';
    case 'ANULADO':
      return 'anulada';
    case 'BLOQUEADO':
      return 'legacy_bloqueado';
    case 'INCLUIDO_EN_PROCESO':
      return 'incorporada_a_pre_nomina';
    default:
      return 'pendiente_revision';
  }
}

function normalizarTipoDesdeCategoria(categoria: string | null | undefined, tipoMovimiento: string | null | undefined): EntradaMensualTipo {
  switch (categoria) {
    case 'haber_variable':
    case 'tiempo_trabajado_adicional':
      return 'haber';
    case 'ausencia_descuento_tiempo':
      return 'ausencia';
    case 'licencia_permiso':
      return 'licencia';
    case 'anticipo_descuento_unico':
      return 'anticipo';
    case 'retroactivo_reintegro':
      return 'retroactivo';
    case 'ajuste_manual_controlado':
      return 'ajuste';
    default:
      return tipoMovimiento === 'haber' || tipoMovimiento === 'descuento' || tipoMovimiento === 'ajuste'
        ? tipoMovimiento
        : 'otro';
  }
}

function normalizarTipoDesdeConcepto(tipoConcepto: string | null | undefined): EntradaMensualTipo {
  const value = tipoConcepto?.trim().toUpperCase();
  if (value === 'HABER') return 'haber';
  if (value === 'DESCUENTO') return 'descuento';
  return 'otro';
}

export function entradaBloqueaProceso(entrada: Pick<EntradaMensualPeriodo, 'estado' | 'bloqueaProceso'>): boolean {
  return entrada.bloqueaProceso || entrada.estado === 'legacy_bloqueado';
}

export function entradaRequiereRevision(entrada: Pick<EntradaMensualPeriodo, 'estado' | 'requiereRevision'>): boolean {
  return (
    entrada.requiereRevision ||
    entrada.estado === 'borrador' ||
    entrada.estado === 'pendiente_revision' ||
    entrada.estado === 'observada' ||
    entrada.estado === 'legacy_bloqueado'
  );
}

export function puedeEntrarAPreNomina(entrada: EntradaMensualPeriodo): boolean {
  if (entradaBloqueaProceso(entrada)) return false;
  return entrada.estado === 'aprobada' || entrada.estado === 'legacy_validado';
}

export function normalizarEntradaNovedadMensual(novedad: NovedadMensual): EntradaMensualPeriodo {
  const estado = normalizarEstadoNovedadMensual(novedad.estado);
  return {
    idEntrada: `novedad:${novedad.idNovedad}`,
    origen: 'novedad_mensual',
    origenId: novedad.idNovedad,
    periodo: novedad.periodo,
    idPersona: novedad.idPersona,
    idContrato: novedad.idContrato,
    idConcepto: novedad.idConcepto,
    tipoEntrada: normalizarTipoDesdeCategoria(novedad.categoria, novedad.tipoMovimiento),
    categoria: novedad.categoria,
    tipoMovimiento: novedad.tipoMovimiento,
    cantidad: novedad.cantidad,
    unidad: novedad.unidad,
    monto: novedad.monto,
    moneda: novedad.moneda,
    estado,
    fechaEvento: novedad.fechaEvento,
    observacion: novedad.observacion,
    referenciaExterna: novedad.referenciaExterna,
    requiereRevision: estado === 'borrador' || estado === 'pendiente_revision',
    bloqueaProceso: false,
    warnings: [],
    metadata: {
      origenTecnico: 'novedad_remuneracion_periodo',
      origenNovedad: novedad.origen,
      fechaAprobacion: novedad.fechaAprobacion,
    },
  };
}

export function normalizarEntradaMovimientoLegacy(movimiento: MovimientoVariableListadoFila): EntradaMensualPeriodo {
  const estado = normalizarEstadoMovimientoLegacy(movimiento.estado);
  const bloqueaProceso = estado === 'legacy_bloqueado';
  return {
    idEntrada: `legacy_movimiento:${movimiento.idMovimiento}`,
    origen: 'legacy_movimiento_variable',
    origenId: movimiento.idMovimiento,
    periodo: movimiento.periodo,
    idPersona: movimiento.idPersona,
    idContrato: null,
    idConcepto: movimiento.idConcepto,
    tipoEntrada: 'otro',
    categoria: 'legacy_movimiento_variable',
    tipoMovimiento: null,
    cantidad: null,
    unidad: null,
    monto: movimiento.monto,
    moneda: 'CLP',
    estado,
    fechaEvento: null,
    observacion: movimiento.observacion ?? null,
    referenciaExterna: null,
    requiereRevision: estado === 'borrador' || estado === 'observada' || bloqueaProceso,
    bloqueaProceso,
    warnings: bloqueaProceso ? ['Movimiento variable legacy bloqueado.'] : [],
    metadata: {
      origenTecnico: 'movimiento_variable_mensual',
      estadoLegacy: movimiento.estado,
      origenLegacy: movimiento.origen,
    },
  };
}

export function normalizarEntradaRecurrente(
  fila: HaberDescuentoAsignacionPrevalidacionMensualFila,
  periodo: string,
): EntradaMensualPeriodo | null {
  const asignacion = fila.asignacion;
  if (!fila.intersectaPeriodo && fila.estadoVigencia !== 'INVALIDA') {
    return null;
  }
  if (fila.estadoVigencia === 'CERRADA' || fila.estadoVigencia === 'VENCIDA') {
    return null;
  }

  const bloqueaProceso = fila.estadoVigencia === 'INVALIDA';
  const warnings = bloqueaProceso ? ['Asignacion recurrente con vigencia invalida.'] : [];
  return {
    idEntrada: `recurrente:${asignacion.idAsignacion}`,
    origen: 'recurrente',
    origenId: asignacion.idAsignacion,
    periodo,
    idPersona: asignacion.idPersona,
    idContrato: asignacion.idContrato,
    idConcepto: asignacion.idConcepto,
    tipoEntrada: normalizarTipoDesdeConcepto(asignacion.tipoConcepto),
    categoria: 'asignacion_recurrente',
    tipoMovimiento: asignacion.tipoConcepto,
    cantidad: null,
    unidad: null,
    monto: asignacion.monto,
    moneda: 'CLP',
    estado: bloqueaProceso ? 'observada' : 'aprobada',
    fechaEvento: asignacion.vigenciaInicio,
    observacion: asignacion.observacion,
    referenciaExterna: null,
    requiereRevision: bloqueaProceso,
    bloqueaProceso,
    warnings,
    metadata: {
      origenTecnico: 'haberdescuento_persona',
      estadoVigencia: fila.estadoVigencia,
      porcentaje: asignacion.porcentaje,
      tipoValor: asignacion.tipoValor,
      periodicidad: asignacion.periodicidad,
    },
  };
}

export function construirResumenEntradas(
  entradas: readonly EntradaMensualPeriodo[],
): ResumenEntradasMensualesPeriodo {
  return entradas.reduce<ResumenEntradasMensualesPeriodo>(
    (acc, entrada) => {
      acc.total += 1;
      if (entrada.origen === 'recurrente') acc.recurrentes += 1;
      if (entrada.origen === 'novedad_mensual') acc.novedadesMensuales += 1;
      if (entrada.origen === 'legacy_movimiento_variable') acc.legacyMovimientos += 1;
      if (entrada.estado === 'aprobada' || entrada.estado === 'legacy_validado') acc.aprobadas += 1;
      if (entrada.estado === 'pendiente_revision' || entrada.estado === 'borrador') acc.pendientesRevision += 1;
      if (entrada.estado === 'observada') acc.observadas += 1;
      if (entrada.estado === 'rechazada') acc.rechazadas += 1;
      if (entrada.estado === 'anulada') acc.anuladas += 1;
      if (entradaBloqueaProceso(entrada)) acc.bloqueantes += 1;
      if (entrada.warnings.length > 0) acc.conWarnings += 1;
      return acc;
    },
    {
      total: 0,
      recurrentes: 0,
      novedadesMensuales: 0,
      legacyMovimientos: 0,
      aprobadas: 0,
      pendientesRevision: 0,
      observadas: 0,
      rechazadas: 0,
      anuladas: 0,
      bloqueantes: 0,
      conWarnings: 0,
    },
  );
}
