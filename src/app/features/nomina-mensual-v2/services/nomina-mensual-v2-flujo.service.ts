import { inject, Injectable } from '@angular/core';

import { NominaCalculoSnapshotRepository } from '../../nomina-mensual/data-access/nomina-calculo-snapshot.repository';
import type {
  NominaCalculoIssueSnapshot,
  NominaCalculoPeriodoSnapshot,
  NominaSnapshotCompletoView,
} from '../../nomina-mensual/models/proceso-mensual.model';
import { ProcesoMensualService } from '../../nomina-mensual/services/proceso-mensual.service';
import type { EntradaMensualPeriodo } from '../../nomina-mensual/entradas/models/entrada-mensual-periodo.model';
import { LiquidacionesOficialesService } from '../../liquidaciones-oficiales/services/liquidaciones-oficiales.service';
import type { LiquidacionTrabajador } from '../../liquidaciones-oficiales/models/liquidacion-oficial.model';
import type {
  PayrollCalculationRow,
  PayrollMovementRow,
  PayslipRow,
  StatusChip,
  SummaryMetric,
  ValidationRow,
} from '../models/nomina-mensual-v2.models';

export type NominaMensualV2FlujoRealView = {
  periodo: string;
  snapshot: NominaCalculoPeriodoSnapshot | null;
  snapshotCompleto: NominaSnapshotCompletoView | null;
  movimientos: PayrollMovementRow[];
  calculoMetricas: SummaryMetric[];
  calculoFilas: PayrollCalculationRow[];
  validacionMetricas: SummaryMetric[];
  validacionFilas: ValidationRow[];
  aprobacionMetricas: SummaryMetric[];
  liquidacionMetricas: SummaryMetric[];
  liquidacionFilas: PayslipRow[];
  liquidacionesGeneradas: number;
  estadoLectura: 'real' | 'sin_snapshot' | 'error';
  mensaje: string | null;
};

@Injectable({ providedIn: 'root' })
export class NominaMensualV2FlujoService {
  private readonly procesoMensual = inject(ProcesoMensualService);
  private readonly snapshots = inject(NominaCalculoSnapshotRepository);
  private readonly liquidaciones = inject(LiquidacionesOficialesService);

  async cargar(periodo: string): Promise<NominaMensualV2FlujoRealView> {
    const p = periodo.trim();
    try {
      const [rehidratado, entradas, estadoLiquidaciones] = await Promise.all([
        this.procesoMensual.rehidratarPeriodo(p),
        this.procesoMensual.listarEntradasMensualesPeriodo(p),
        this.liquidaciones.consultarEstadoPeriodo(p),
      ]);
      const snapshot = rehidratado.snapshot;
      const completo = rehidratado.completo;
      const liquidacionesGeneradas = estadoLiquidaciones.liquidacion ? 1 : 0;
      return {
        periodo: p,
        snapshot,
        snapshotCompleto: completo,
        movimientos: entradas.map(mapEntradaMovimiento),
        calculoMetricas: buildCalculoMetricas(snapshot),
        calculoFilas: buildCalculoFilas(completo),
        validacionMetricas: buildValidacionMetricas(completo, snapshot),
        validacionFilas: buildValidacionFilas(completo),
        aprobacionMetricas: buildAprobacionMetricas(snapshot),
        liquidacionMetricas: buildLiquidacionMetricas(estadoLiquidaciones.trabajadores),
        liquidacionFilas: estadoLiquidaciones.trabajadores.map(mapLiquidacionFila),
        liquidacionesGeneradas,
        estadoLectura: snapshot ? 'real' : 'sin_snapshot',
        mensaje: snapshot
          ? null
          : 'Todavia no existe una nomina guardada para este periodo. Procesa el calculo para ver datos reales.',
      };
    } catch (error) {
      return buildEstadoError(p, error);
    }
  }

  async procesarCalculo(periodo: string): Promise<NominaMensualV2FlujoRealView> {
    await this.procesoMensual.generarCalculoPeriodo(periodo);
    await this.procesoMensual.guardarSnapshotPreliminar(periodo);
    return this.cargar(periodo);
  }

  async validarPrenomina(periodo: string): Promise<{
    ok: boolean;
    bloqueos: { codigo: string; mensaje: string }[];
    advertencias: { codigo: string; mensaje: string }[];
  }> {
    const snapshot = await this.procesoMensual.obtenerSnapshotActivo(periodo);
    if (!snapshot?.idCalculoPeriodo) {
      throw new Error('Primero procesa y guarda el calculo de nomina.');
    }
    return this.snapshots.validarPrenomina({
      idCalculoPeriodo: snapshot.idCalculoPeriodo,
      periodo,
      hashSnapshot: snapshot.hashSnapshot,
      hashParametros: snapshot.hashParametros,
      hashEntradas: snapshot.hashEntradas,
    });
  }

  async aprobarNomina(periodo: string): Promise<NominaMensualV2FlujoRealView> {
    const snapshot = await this.procesoMensual.obtenerSnapshotActivo(periodo);
    if (!snapshot?.idCalculoPeriodo) {
      throw new Error('Primero procesa y guarda el calculo de nomina.');
    }
    await this.procesoMensual.aprobarResultadoPreliminarOperativamente({
      periodo,
      idCalculoPeriodo: snapshot.idCalculoPeriodo,
      advertencias: [],
    });
    return this.cargar(periodo);
  }

  async generarLiquidaciones(periodo: string): Promise<NominaMensualV2FlujoRealView> {
    await this.liquidaciones.generarLiquidaciones(periodo);
    return this.cargar(periodo);
  }
}

function buildEstadoError(periodo: string, error: unknown): NominaMensualV2FlujoRealView {
  const mensaje = error instanceof Error ? error.message : 'No fue posible leer el flujo real de nomina.';
  return {
    periodo,
    snapshot: null,
    snapshotCompleto: null,
    movimientos: [],
    calculoMetricas: buildCalculoMetricas(null),
    calculoFilas: [],
    validacionMetricas: buildValidacionMetricas(null, null),
    validacionFilas: [],
    aprobacionMetricas: buildAprobacionMetricas(null),
    liquidacionMetricas: buildLiquidacionMetricas([]),
    liquidacionFilas: [],
    liquidacionesGeneradas: 0,
    estadoLectura: 'error',
    mensaje,
  };
}

function mapEntradaMovimiento(entrada: EntradaMensualPeriodo): PayrollMovementRow {
  const monto = entrada.monto ?? 0;
  return {
    worker: `Trabajador ${entrada.idPersona}`,
    rut: entrada.idContrato == null ? 'Contrato no disponible' : `Contrato ${entrada.idContrato}`,
    type: tipoMovimientoChip(entrada),
    concept: entrada.categoria ?? entrada.tipoMovimiento ?? `Concepto ${entrada.idConcepto}`,
    date: entrada.fechaEvento ? formatDate(entrada.fechaEvento) : entrada.periodo,
    amount: formatCurrency(monto),
    origin: origenEntradaLabel(entrada.origen),
    status: estadoEntradaChip(entrada.estado),
  };
}

function tipoMovimientoChip(entrada: EntradaMensualPeriodo): StatusChip {
  if (entrada.tipoEntrada === 'descuento' || entrada.tipoEntrada === 'anticipo') {
    return { label: 'Descuento', tone: 'red' };
  }
  if (entrada.tipoEntrada === 'licencia' || entrada.tipoEntrada === 'ausencia') {
    return { label: 'Licencia', tone: 'purple' };
  }
  return { label: 'Haber', tone: 'green' };
}

function origenEntradaLabel(origen: EntradaMensualPeriodo['origen']): string {
  switch (origen) {
    case 'recurrente':
      return 'Recurrente';
    case 'novedad_mensual':
      return 'Novedad mensual';
    case 'legacy_movimiento_variable':
      return 'Movimiento legacy';
  }
}

function estadoEntradaChip(estado: string): StatusChip {
  switch (estado) {
    case 'aprobada':
    case 'legacy_validado':
    case 'incorporada_a_pre_nomina':
      return { label: 'Validado', tone: 'green' };
    case 'observada':
      return { label: 'Observado', tone: 'amber' };
    case 'rechazada':
    case 'anulada':
      return { label: 'Anulado', tone: 'gray' };
    case 'legacy_bloqueado':
      return { label: 'Bloqueado', tone: 'red' };
    default:
      return { label: 'Pendiente', tone: 'amber' };
  }
}

function buildCalculoMetricas(snapshot: NominaCalculoPeriodoSnapshot | null): SummaryMetric[] {
  return [
    {
      id: 'processed',
      label: 'Trabajadores procesados',
      value: snapshot?.totalTrabajadores ?? 0,
      helperText: snapshot ? 'Snapshot vigente' : 'Sin calculo guardado',
      tone: snapshot ? 'blue' : 'gray',
    },
    { id: 'earnings', label: 'Haberes', value: formatCurrency(snapshot?.totalHaberes ?? 0), tone: 'green' },
    { id: 'deductions', label: 'Descuentos', value: formatCurrency(snapshot?.totalDescuentos ?? 0), tone: 'red' },
    { id: 'net', label: 'Liquido estimado', value: formatCurrency(snapshot?.totalLiquido ?? 0), tone: 'purple' },
  ];
}

function buildCalculoFilas(completo: NominaSnapshotCompletoView | null): PayrollCalculationRow[] {
  return (completo?.trabajadores ?? []).slice(0, 12).map((trabajador) => ({
    worker: trabajador.nombreCompletoSnapshot,
    area: trabajador.rut,
    earnings: formatCurrency(trabajador.totalHaberesImponibles + trabajador.totalHaberesNoImponibles),
    deductions: formatCurrency(trabajador.totalDescuentosLegales + trabajador.totalDescuentosVoluntarios),
    taxable: formatCurrency(trabajador.baseTributable),
    net: formatCurrency(trabajador.liquidoPreliminar),
    status: estadoTrabajadorChip(trabajador.estado),
  }));
}

function estadoTrabajadorChip(estado: string): StatusChip {
  switch (estado) {
    case 'calculado_preliminar':
      return { label: 'Calculado', tone: 'green' };
    case 'con_bloqueos':
      return { label: 'Bloqueado', tone: 'red' };
    default:
      return { label: 'Con advertencias', tone: 'amber' };
  }
}

function buildValidacionMetricas(
  completo: NominaSnapshotCompletoView | null,
  snapshot: NominaCalculoPeriodoSnapshot | null,
): SummaryMetric[] {
  const issues = completo?.observaciones ?? [];
  const bloqueos = issues.filter((issue) => issue.severidad === 'BLOQUEO').length;
  const advertencias = issues.filter((issue) => issue.severidad === 'ADVERTENCIA').length;
  return [
    { id: 'rules', label: 'Observaciones registradas', value: issues.length, tone: 'blue' },
    { id: 'blockers', label: 'Bloqueos', value: bloqueos, tone: bloqueos ? 'red' : 'green' },
    { id: 'warnings', label: 'Advertencias', value: advertencias, tone: advertencias ? 'amber' : 'green' },
    {
      id: 'integrity',
      label: 'Integridad',
      value: snapshot?.hashSnapshot ? 'Registrada' : 'Pendiente',
      helperText: snapshot?.hashSnapshot ? 'Hash snapshot disponible' : 'Sin snapshot',
      tone: snapshot?.hashSnapshot ? 'green' : 'gray',
    },
  ];
}

function buildValidacionFilas(completo: NominaSnapshotCompletoView | null): ValidationRow[] {
  return (completo?.observaciones ?? []).slice(0, 20).map(mapIssueValidacion);
}

function mapIssueValidacion(issue: NominaCalculoIssueSnapshot): ValidationRow {
  return {
    rule: issue.codigo,
    detail: issue.mensaje,
    severity: issue.severidad === 'BLOQUEO'
      ? { label: 'Bloqueo', tone: 'red' }
      : issue.severidad === 'ADVERTENCIA'
        ? { label: 'Advertencia', tone: 'amber' }
        : { label: 'Informativo', tone: 'green' },
  };
}

function buildAprobacionMetricas(snapshot: NominaCalculoPeriodoSnapshot | null): SummaryMetric[] {
  return [
    { id: 'period', label: 'Periodo', value: snapshot?.periodo ?? '-', helperText: 'Periodo activo', tone: 'blue' },
    { id: 'workers', label: 'Trabajadores', value: snapshot?.totalTrabajadores ?? 0, helperText: 'Incluidos', tone: 'green' },
    { id: 'net', label: 'Liquido total', value: formatCurrency(snapshot?.totalLiquido ?? 0), helperText: 'A transferir', tone: 'purple' },
    {
      id: 'state',
      label: 'Estado',
      value: snapshot?.aprobacionOperativa ? 'Aprobada' : snapshot ? 'En revision' : 'Sin calculo',
      helperText: snapshot?.aprobacionOperativa?.fecha ? formatDate(snapshot.aprobacionOperativa.fecha) : undefined,
      tone: snapshot?.aprobacionOperativa ? 'green' : snapshot ? 'amber' : 'gray',
    },
  ];
}

function buildLiquidacionMetricas(trabajadores: readonly LiquidacionTrabajador[]): SummaryMetric[] {
  const total = trabajadores.length;
  const liquido = trabajadores.reduce((sum, row) => sum + row.liquidoPagar, 0);
  return [
    { id: 'issued', label: 'Liquidaciones emitidas', value: total, helperText: 'Periodo', tone: total ? 'blue' : 'gray' },
    { id: 'sent', label: 'Disponibles', value: total, helperText: 'Generadas internamente', tone: total ? 'green' : 'gray' },
    { id: 'pending', label: 'Pendientes envio', value: 0, helperText: 'Salida externa no integrada', tone: 'amber' },
    { id: 'net', label: 'Liquido total', value: formatCurrency(liquido), helperText: 'Total liquidado', tone: 'green' },
  ];
}

function mapLiquidacionFila(row: LiquidacionTrabajador): PayslipRow {
  return {
    worker: row.nombreTrabajador,
    rut: row.rut ?? 'RUT no disponible',
    role: row.cargo ?? row.centroCosto ?? 'Sin cargo',
    net: formatCurrency(row.liquidoPagar),
    documentStatus: { label: 'Generada', tone: 'green' },
    signature: { label: 'No integrada', tone: 'gray' },
    delivery: { label: 'Pendiente', tone: 'amber' },
  };
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date);
}
