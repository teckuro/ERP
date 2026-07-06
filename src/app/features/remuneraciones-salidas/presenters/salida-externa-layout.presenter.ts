import { etiquetaPeriodoDesdeYm } from '../../../core/services/periodo-activo.service';
import type { NominaPeriodoResumen } from '../../nomina-mensual/models/nomina-periodo.models';
import { ETIQUETAS_ESTADO_NOMINA } from '../../nomina-mensual/presenters/admin-nominas.presenter';
import { estadoNominaToBadge } from '../../nomina-mensual/containers/administrador-nominas-container/utils/admin-nominas-presentacion.util';

export const PERSISTENCIA_SELECCION_NOMINA_PREVIRED = 'previred-seleccion-nomina-grid-v1';
export const PERSISTENCIA_SELECCION_NOMINA_LRE = 'lre-seleccion-nomina-grid-v1';

export interface MetricaSalidaExterna {
  label: string;
  value: string;
}

export interface ContextoOrigenSalidaExterna {
  eyebrow: string;
  titulo: string;
  estadoLabel: string;
  estadoVariant: string;
  versionLabel: string;
  nota: string;
  metricas: MetricaSalidaExterna[];
}

export function etiquetaNominaActivaSalidaExport(
  nominas: readonly NominaPeriodoResumen[],
  nominaId: string | null,
  sinSeleccion = 'Seleccionar nómina',
): string {
  if (!nominaId) return sinSeleccion;
  const nomina = nominas.find((n) => n.id === nominaId);
  if (!nomina) return sinSeleccion;
  const periodo = etiquetaPeriodoDesdeYm(nomina.periodo);
  const estado = ETIQUETAS_ESTADO_NOMINA[nomina.estado] ?? nomina.estado;
  return `${periodo} · ${nomina.empresaNombre} (${estado})`;
}

export function construirContextoOrigenSalidaExterna(input: {
  borrador: {
    periodo: string;
    empresaNombre: string;
    versionLiquidacion: number;
    totalTrabajadores: number;
    lineasCount: number;
  };
  nomina?: NominaPeriodoResumen | null;
}): ContextoOrigenSalidaExterna {
  const badge = estadoNominaToBadge(input.nomina?.estado ?? 'liquidada');
  return {
    eyebrow: 'Origen · Liquidación oficial',
    titulo: `${input.borrador.empresaNombre} · ${etiquetaPeriodoDesdeYm(input.borrador.periodo)}`,
    estadoLabel: badge.label,
    estadoVariant: badge.variant,
    versionLabel: `v${input.borrador.versionLiquidacion}`,
    nota: 'Materializado desde liquidación oficial. Sin recálculo.',
    metricas: [
      { label: 'Trabajadores', value: String(input.borrador.totalTrabajadores) },
      { label: 'Líneas exportables', value: String(input.borrador.lineasCount) },
      { label: 'Versión', value: `v${input.borrador.versionLiquidacion}` },
    ],
  };
}

export function rutaLiquidacionesNomina(nominaId: string | null): { path: string; queryParams?: Record<string, string> } {
  if (!nominaId) {
    return { path: '/remuneraciones/liquidaciones' };
  }
  return {
    path: '/remuneraciones/liquidaciones',
    queryParams: { nominaPeriodoId: nominaId },
  };
}

export function rutaPreviredNomina(nominaId: string | null): { path: string; queryParams?: Record<string, string> } {
  if (!nominaId) {
    return { path: '/remuneraciones/previred' };
  }
  return {
    path: '/remuneraciones/previred',
    queryParams: { nominaPeriodoId: nominaId },
  };
}
