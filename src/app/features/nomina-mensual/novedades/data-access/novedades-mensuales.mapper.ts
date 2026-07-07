import type { Tables, TablesInsert, TablesUpdate } from '../../../../core/models/database.types';
import type {
  ActualizarNovedadMensualInput,
  CrearNovedadMensualInput,
  NovedadMensual,
  NovedadMensualCategoria,
  NovedadMensualEstado,
  NovedadMensualOrigen,
  NovedadMensualTipoMovimiento,
} from '../models/novedad-mensual.model';
import { normalizarMoneda } from '../rules/novedades-mensuales.rules';

export type NovedadRemuneracionPeriodoRow = Tables<'novedad_remuneracion_periodo'>;

export function mapRowToNovedadMensual(row: NovedadRemuneracionPeriodoRow): NovedadMensual {
  return {
    idNovedad: row.id_novedad_remuneracion_periodo,
    periodo: row.periodo.trim(),
    idPersona: row.id_persona,
    idContrato: row.id_contrato ?? null,
    idConcepto: row.id_concepto ?? null,
    categoria: row.categoria as NovedadMensualCategoria,
    tipoMovimiento: row.tipo_movimiento as NovedadMensualTipoMovimiento,
    cantidad: row.cantidad == null ? null : Number(row.cantidad),
    unidad: row.unidad ?? null,
    monto: row.monto == null ? null : Number(row.monto),
    moneda: normalizarMoneda(row.moneda),
    origen: (row.origen ?? 'manual') as NovedadMensualOrigen,
    fechaEvento: row.fecha_evento ?? null,
    estado: row.estado as NovedadMensualEstado,
    observacion: row.observacion ?? null,
    referenciaExterna: row.referencia_externa ?? null,
    codigoMotivoAusencia: row.codigo_motivo_ausencia ?? null,
    idLicencia: row.id_licencia ?? null,
    creadoPor: row.creado_por ?? null,
    aprobadoPor: row.aprobado_por ?? null,
    fechaAprobacion: row.fecha_aprobacion ?? null,
    fechaCreacion: row.fecha_creacion,
    fechaActualizacion: row.fecha_actualizacion,
  };
}

export function mapCrearNovedadMensualToInsert(
  input: CrearNovedadMensualInput,
): TablesInsert<'novedad_remuneracion_periodo'> {
  return {
    periodo: input.periodo.trim(),
    id_persona: input.idPersona,
    id_contrato: input.idContrato ?? null,
    id_concepto: input.idConcepto ?? null,
    categoria: input.categoria,
    tipo_movimiento: input.tipoMovimiento,
    cantidad: input.cantidad ?? null,
    unidad: input.unidad?.trim() ? input.unidad.trim() : null,
    monto: input.monto ?? null,
    moneda: normalizarMoneda(input.moneda),
    origen: input.origen ?? 'manual',
    fecha_evento: input.fechaEvento ?? null,
    estado: 'borrador',
    observacion: input.observacion?.trim() ? input.observacion.trim() : null,
    referencia_externa: input.referenciaExterna?.trim() ? input.referenciaExterna.trim() : null,
    codigo_motivo_ausencia: input.codigoMotivoAusencia?.trim() ? input.codigoMotivoAusencia.trim() : null,
    id_licencia: input.idLicencia ?? null,
    creado_por: input.creadoPor ?? null,
  };
}

export function mapActualizarNovedadMensualToUpdate(
  input: ActualizarNovedadMensualInput,
): TablesUpdate<'novedad_remuneracion_periodo'> {
  const patch: TablesUpdate<'novedad_remuneracion_periodo'> = {
    fecha_actualizacion: new Date().toISOString(),
  };
  if (input.periodo !== undefined) patch.periodo = input.periodo.trim();
  if (input.idPersona !== undefined) patch.id_persona = input.idPersona;
  if (input.idContrato !== undefined) patch.id_contrato = input.idContrato;
  if (input.idConcepto !== undefined) patch.id_concepto = input.idConcepto;
  if (input.categoria !== undefined) patch.categoria = input.categoria;
  if (input.tipoMovimiento !== undefined) patch.tipo_movimiento = input.tipoMovimiento;
  if (input.cantidad !== undefined) patch.cantidad = input.cantidad;
  if (input.unidad !== undefined) patch.unidad = input.unidad?.trim() ? input.unidad.trim() : null;
  if (input.monto !== undefined) patch.monto = input.monto;
  if (input.moneda !== undefined) patch.moneda = normalizarMoneda(input.moneda);
  if (input.origen !== undefined) patch.origen = input.origen ?? 'manual';
  if (input.fechaEvento !== undefined) patch.fecha_evento = input.fechaEvento;
  if (input.observacion !== undefined) {
    patch.observacion = input.observacion?.trim() ? input.observacion.trim() : null;
  }
  if (input.referenciaExterna !== undefined) {
    patch.referencia_externa = input.referenciaExterna?.trim() ? input.referenciaExterna.trim() : null;
  }
  if (input.codigoMotivoAusencia !== undefined) {
    patch.codigo_motivo_ausencia = input.codigoMotivoAusencia?.trim() ? input.codigoMotivoAusencia.trim() : null;
  }
  if (input.idLicencia !== undefined) {
    patch.id_licencia = input.idLicencia;
  }
  return patch;
}
