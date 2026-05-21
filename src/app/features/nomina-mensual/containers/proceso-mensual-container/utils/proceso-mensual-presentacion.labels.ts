import type {
  BaseNominaTrabajadorEstado,
  NominaCalculoPeriodoSnapshot,
} from '../../../models/proceso-mensual.model';
import { limpiarCopyTecnicoNomina } from '../../../rules/proceso-mensual-copy-limpio.rules';
import type { ProcesoMensualEstadoSeveridad } from '../../../rules/proceso-mensual-estado-operativo.rules';

export function claseChipRevision(estado: string): string {
  const normalizado = estado.toLowerCase();
  if (normalizado.includes('bloque') || normalizado.includes('omitido')) {
    return 'payroll-state-chip payroll-state-chip--danger';
  }
  if (normalizado.includes('observ') || normalizado.includes('advert') || normalizado.includes('cambio')) {
    return 'payroll-state-chip payroll-state-chip--warning';
  }
  if (normalizado.includes('revis')) return 'payroll-state-chip payroll-state-chip--info';
  return 'payroll-state-chip payroll-state-chip--success';
}

export function clasePendienteVisual(severidad: ProcesoMensualEstadoSeveridad): string {
  if (severidad === 'danger') return 'payroll-state-chip payroll-state-chip--danger';
  if (severidad === 'warning') return 'payroll-state-chip payroll-state-chip--warning';
  return 'payroll-state-chip payroll-state-chip--info';
}

export function etiquetaPendienteVisual(severidad: ProcesoMensualEstadoSeveridad): string {
  if (severidad === 'danger') return 'Bloqueado';
  if (severidad === 'warning') return 'Pendiente de revisión';
  return 'Revisar';
}

export function etiquetaEstadoBaseTrabajador(estado: BaseNominaTrabajadorEstado): string {
  switch (estado) {
    case 'listo':
      return 'Listo para calculo';
    case 'con_observaciones':
      return 'Con observaciones';
    case 'bloqueado':
      return 'Bloqueado';
    case 'excluido':
      return 'Excluido';
    default:
      return estado;
  }
}

export function ambitoDesdeCodigo(codigo: string): string {
  const normalizado = codigo.toLowerCase();
  if (normalizado.includes('param')) return 'Parámetros';
  if (normalizado.includes('mov') || normalizado.includes('entrada')) return 'Movimientos';
  if (normalizado.includes('recurrente') || normalizado.includes('haber')) return 'Recurrentes';
  if (normalizado.includes('trab') || normalizado.includes('persona')) return 'Trabajadores';
  if (normalizado.includes('cierre')) return 'Confirmación de nómina';
  return 'Período';
}

export function etiquetaConceptoEntrada(
  idConcepto: number,
  tipoMovimiento: string | null,
  categoria: string | null,
): string {
  const partes = [tipoMovimiento, categoria].filter((item): item is string => Boolean(item?.trim()));
  return partes.length ? partes.join(' · ') : `Concepto ${idConcepto}`;
}

export function etiquetaTipoEntrada(tipo: string): string {
  const labels: Record<string, string> = {
    haber: 'Haber',
    descuento: 'Descuento',
    ausencia: 'Ausencia',
    licencia: 'Licencia',
    anticipo: 'Anticipo',
    ajuste: 'Ajuste',
    retroactivo: 'Retroactivo',
    reintegro: 'Reintegro',
    otro: 'Otro',
  };
  return labels[tipo] ?? tipo;
}

export function etiquetaEstadoEntrada(estado: string): string {
  const labels: Record<string, string> = {
    borrador: 'Borrador',
    pendiente_revision: 'Pendiente de revisión',
    observada: 'Observada',
    aprobada: 'Aprobada',
    rechazada: 'Rechazada',
    incorporada_a_pre_nomina: 'Incorporada a base',
    calculada: 'Calculada',
    anulada: 'Anulada',
    legacy_validado: 'Validada',
    legacy_bloqueado: 'Bloqueada',
  };
  return labels[estado] ?? estado;
}

export function etiquetaEstadoSnapshot(estado: NominaCalculoPeriodoSnapshot['estado']): string {
  switch (estado) {
    case 'preliminar':
      return 'Preliminar';
    case 'recalculado':
      return 'Recalculado';
    case 'observado':
      return 'Observado';
    case 'listo_para_revision':
      return 'Listo para revision';
    case 'aprobado_para_liquidacion':
      return 'Aprobado para fase posterior';
    case 'anulado':
      return 'Anulado';
    case 'borrador':
    default:
      return 'Borrador';
  }
}

export function humanizarCopyOperativo(texto: string): string {
  const limpio = limpiarCopyTecnicoNomina(texto);
  return limpio || 'Revisar antes de continuar.';
}
