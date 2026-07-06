import type { HaberDescuentoAsignacionPrevalidacionMensualFila } from '../../haberes-descuentos/models/haber-descuento-asignacion.model';
import type { EntradaMensualPeriodo, EntradaMensualTipo } from '../entradas/models/entrada-mensual-periodo.model';
import type { MovimientoNomina } from '../models/movimiento-nomina.models';

const ESTADOS_OMITIDOS = new Set(['omitido', 'anulado']);
const ESTADOS_APLICADOS = new Set(['aplicado', 'observado']);

export function esMovimientoOmitidoEnNomina(movimiento: MovimientoNomina): boolean {
  return ESTADOS_OMITIDOS.has(movimiento.estado);
}

export function esMovimientoAplicadoAlMotor(movimiento: MovimientoNomina): boolean {
  return ESTADOS_APLICADOS.has(movimiento.estado);
}

function claveAsignacionRecurrente(idPersona: number, idConcepto: number): string {
  return `${idPersona}:${idConcepto}`;
}

export function claveDedupeEntradaMensual(entrada: EntradaMensualPeriodo): string {
  const montoCentavos = Math.round((entrada.monto ?? 0) * 100);
  return `${entrada.idPersona}:${entrada.idConcepto}:${montoCentavos}`;
}

/**
 * Excluye asignaciones recurrentes cuyo par trabajador×concepto fue omitido en movimiento_nomina.
 */
export function filtrarRecurrentesPorMovimientos(
  recurrentes: readonly HaberDescuentoAsignacionPrevalidacionMensualFila[],
  movimientos: readonly MovimientoNomina[],
): HaberDescuentoAsignacionPrevalidacionMensualFila[] {
  if (movimientos.length === 0) {
    return [...recurrentes];
  }

  const omitidas = new Set<string>();
  for (const movimiento of movimientos) {
    if (!esMovimientoOmitidoEnNomina(movimiento)) continue;
    const idPersona = Number(movimiento.trabajadorId);
    if (!Number.isFinite(idPersona) || movimiento.conceptoId == null) continue;
    omitidas.add(claveAsignacionRecurrente(idPersona, movimiento.conceptoId));
  }

  return recurrentes.filter(
    ({ asignacion }) =>
      !omitidas.has(claveAsignacionRecurrente(asignacion.idPersona, asignacion.idConcepto)),
  );
}

function mapCategoriaATipoEntrada(categoria: MovimientoNomina['categoria']): EntradaMensualTipo {
  switch (categoria) {
    case 'descuento':
      return 'descuento';
    case 'ausencia':
      return 'ausencia';
    case 'informativo':
      return 'otro';
    default:
      return 'haber';
  }
}

function mapCategoriaMotor(categoria: MovimientoNomina['categoria']): string {
  switch (categoria) {
    case 'descuento':
      return 'DESCUENTO';
    case 'ausencia':
      return 'AUSENCIA';
    case 'informativo':
      return 'INFORMATIVO';
    case 'haber':
    default:
      return categoria === 'haber' ? 'HABER' : 'HABER';
  }
}

/**
 * Convierte movimientos manuales aplicados de la nómina en entradas mensuales para el motor.
 * Los movimientos con origen recurrente no se convierten (llegan vía input.recurrentes).
 */
export function construirEntradasDesdeMovimientosManuales(
  movimientos: readonly MovimientoNomina[],
  periodo: string,
): EntradaMensualPeriodo[] {
  const salida: EntradaMensualPeriodo[] = [];

  for (const movimiento of movimientos) {
    if (movimiento.origen !== 'manual') continue;
    if (!esMovimientoAplicadoAlMotor(movimiento)) continue;
    if (movimiento.categoria === 'informativo') continue;

    const idPersona = Number(movimiento.trabajadorId);
    if (!Number.isFinite(idPersona)) continue;

    const tipoEntrada = mapCategoriaATipoEntrada(movimiento.categoria);
    const categoriaMotor = mapCategoriaMotor(movimiento.categoria);

    salida.push({
      idEntrada: `movimiento_nomina:${movimiento.id}`,
      origen: 'movimiento_nomina',
      origenId: movimiento.id,
      periodo,
      idPersona,
      idContrato: null,
      idConcepto: movimiento.conceptoId ?? 0,
      tipoEntrada,
      categoria: categoriaMotor,
      tipoMovimiento: categoriaMotor,
      cantidad: movimiento.cantidad ?? null,
      unidad: movimiento.unidad ?? null,
      monto: movimiento.monto ?? null,
      moneda: 'CLP',
      estado: 'aprobada',
      fechaEvento: null,
      observacion: movimiento.glosa ?? null,
      referenciaExterna: null,
      requiereRevision: false,
      bloqueaProceso: false,
      warnings: [],
      metadata: {
        origenMovimientoNomina: true,
        movimientoNominaId: movimiento.id,
        categoriaMovimiento: movimiento.categoria,
        descuentoLegal: false,
      },
    });
  }

  return salida;
}

/**
 * Prioriza novedades/asignaciones canónicas: descarta manuales duplicados (persona+concepto+monto).
 */
export function deduplicarEntradasManualesContraCanonicas(
  entradasCanonicas: readonly EntradaMensualPeriodo[],
  entradasManuales: readonly EntradaMensualPeriodo[],
): EntradaMensualPeriodo[] {
  const clavesCanonicas = new Set(entradasCanonicas.map(claveDedupeEntradaMensual));
  return entradasManuales.filter(
    (entrada) => !clavesCanonicas.has(claveDedupeEntradaMensual(entrada)),
  );
}

export function fusionarEntradasConMovimientosNomina(args: {
  periodo: string;
  entradasCanonicas: readonly EntradaMensualPeriodo[];
  movimientos: readonly MovimientoNomina[];
}): EntradaMensualPeriodo[] {
  const manuales = construirEntradasDesdeMovimientosManuales(args.movimientos, args.periodo);
  const manualesSinDuplicar = deduplicarEntradasManualesContraCanonicas(args.entradasCanonicas, manuales);
  return [...args.entradasCanonicas, ...manualesSinDuplicar];
}

export function aplicarMovimientosNominaAlMotor(args: {
  periodo: string;
  entradasCanonicas: readonly EntradaMensualPeriodo[];
  recurrentes: readonly HaberDescuentoAsignacionPrevalidacionMensualFila[];
  movimientos: readonly MovimientoNomina[];
}): {
  entradasFusionadas: EntradaMensualPeriodo[];
  recurrentesFiltrados: HaberDescuentoAsignacionPrevalidacionMensualFila[];
} {
  return {
    entradasFusionadas: fusionarEntradasConMovimientosNomina({
      periodo: args.periodo,
      entradasCanonicas: args.entradasCanonicas,
      movimientos: args.movimientos,
    }),
    recurrentesFiltrados: filtrarRecurrentesPorMovimientos(args.recurrentes, args.movimientos),
  };
}
