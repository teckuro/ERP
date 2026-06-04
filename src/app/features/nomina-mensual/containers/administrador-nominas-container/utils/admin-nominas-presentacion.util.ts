/**
 * Utilidades de presentación del Administrador de Nóminas (F2).
 *
 * Mapeos puros estado → badge, tipo → label, fecha → texto humano y KPIs
 * operativos. Sin acceso al DOM ni a servicios; se testean en vitest.
 */

import type {
  EstadoNomina,
  NominaPeriodoResumen,
  TipoNomina,
} from '../../../models/nomina-periodo.models';

export type AdminBadgeVariant = 'neutral' | 'info' | 'warning' | 'success' | 'danger';

export interface AdminBadgeView {
  label: string;
  variant: AdminBadgeVariant;
}

const MAPA_ESTADO: Record<EstadoNomina, AdminBadgeView> = {
  borrador: { label: 'Borrador', variant: 'neutral' },
  dotacion_generada: { label: 'Dotación lista', variant: 'info' },
  en_revision: { label: 'En revisión', variant: 'info' },
  calculada: { label: 'Calculada', variant: 'info' },
  validada: { label: 'Validada', variant: 'success' },
  aprobada: { label: 'Aprobada', variant: 'success' },
  cerrada: { label: 'Cerrada', variant: 'success' },
  reabierta: { label: 'Reabierta', variant: 'warning' },
  anulada: { label: 'Anulada', variant: 'danger' },
};

const MAPA_TIPO: Record<TipoNomina, string> = {
  mensual: 'Mensual',
  quincenal: 'Quincenal',
  semanal: 'Semanal',
  extraordinaria: 'Extraordinaria',
};

export function estadoNominaToBadge(estado: EstadoNomina): AdminBadgeView {
  return MAPA_ESTADO[estado];
}

export function tipoNominaToLabel(tipo: TipoNomina): string {
  return MAPA_TIPO[tipo];
}

/**
 * Formato humano de fecha de actualización. Si la fecha cae en el mismo día,
 * muestra "Hoy"; si fue ayer, "Ayer"; si fue dentro de la semana, "Hace N
 * días"; en otro caso, formato `dd/mm/yyyy`.
 */
export function formatearActualizada(iso: string | undefined, ahora: Date = new Date()): string {
  if (!iso) return '';
  const fecha = new Date(iso);
  if (Number.isNaN(fecha.getTime())) return '';

  const diffMs = ahora.getTime() - fecha.getTime();
  const diffDias = Math.floor(diffMs / (24 * 60 * 60 * 1000));

  if (diffDias <= 0) return 'Hoy';
  if (diffDias === 1) return 'Ayer';
  if (diffDias < 7) return `Hace ${diffDias} días`;

  const dia = fecha.getDate().toString().padStart(2, '0');
  const mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
  const anio = fecha.getFullYear();
  return `${dia}/${mes}/${anio}`;
}

// ---------------------------------------------------------------------------
// KPIs operativos (sin cards decorativas, solo métricas contextuales)
// ---------------------------------------------------------------------------

export type KpiTone = 'neutral' | 'info' | 'warning' | 'danger' | 'success';

export interface KpiAdminItem {
  id: string;
  label: string;
  value: number;
  tone: KpiTone;
}

export interface KpisAdminNominas {
  total: number;
  abiertas: number;
  enCalculo: number;
  pendientesCierre: number;
  conCriticas: number;
  items: KpiAdminItem[];
}

/**
 * Estado "abierto" para el Administrador: cualquier estado que NO sea
 * `cerrada`, `aprobada` ni `anulada` (sigue requiriendo acción).
 */
function esAbierta(estado: EstadoNomina): boolean {
  return estado !== 'cerrada' && estado !== 'aprobada' && estado !== 'anulada';
}

export function calcularKpisAdminNominas(
  resumenes: readonly NominaPeriodoResumen[],
): KpisAdminNominas {
  const total = resumenes.length;
  const abiertas = resumenes.filter((r) => esAbierta(r.estado)).length;
  const enCalculo = resumenes.filter((r) => r.estado === 'calculada' || r.estado === 'validada').length;
  const pendientesCierre = resumenes.filter((r) => r.estado === 'aprobada' || r.estado === 'reabierta').length;
  const conCriticas = resumenes.filter((r) => r.totalIncidenciasCriticas > 0).length;

  const items: KpiAdminItem[] = [
    { id: 'abiertas', label: 'Abiertas', value: abiertas, tone: 'info' },
    { id: 'en-calculo', label: 'En cálculo', value: enCalculo, tone: 'neutral' },
    { id: 'pendientes-cierre', label: 'Pendientes de cierre', value: pendientesCierre, tone: 'warning' },
    { id: 'con-criticas', label: 'Con críticas', value: conCriticas, tone: conCriticas > 0 ? 'danger' : 'neutral' },
  ];

  return { total, abiertas, enCalculo, pendientesCierre, conCriticas, items };
}
