/**
 * Presenter de contexto fijo del Generador (F18b — AG-CTX-04).
 *
 * Centraliza etiquetas RRHH visibles para empresa, rango, tipo/naturaleza,
 * estado y versión de cálculo. Reutiliza mapeos del Administrador.
 */

import type { ShellStatusChipTone } from '../../../layout/shell-page-context.service';
import {
  etiquetaMetaNomina,
  formatearRangoLegal,
} from '../../nomina-mensual/containers/administrador-nominas-container/utils/admin-nominas-presentacion.util';
import { estadoNominaToLabel } from '../../nomina-mensual/presenters/admin-nominas.presenter';
import type {
  EstadoNomina,
  NominaPeriodo,
} from '../../nomina-mensual/models/nomina-periodo.models';

export interface ContextoGeneradorNominaItem {
  id: string;
  label: string;
  value: string;
}

export interface ContextoGeneradorNomina {
  items: ContextoGeneradorNominaItem[];
  resumenLinea: string;
  estadoLabel: string;
  estadoTone: ShellStatusChipTone;
}

const TONO_ESTADO: Record<EstadoNomina, ShellStatusChipTone> = {
  borrador: 'neutral',
  dotacion_generada: 'neutral',
  en_revision: 'neutral',
  calculada: 'neutral',
  validada: 'warning',
  aprobada: 'warning',
  liquidada: 'success',
  cerrada: 'success',
  reabierta: 'warning',
  anulada: 'danger',
};

export function tonoEstadoNominaShell(estado: EstadoNomina): ShellStatusChipTone {
  return TONO_ESTADO[estado] ?? 'neutral';
}

/**
 * Construye la franja de contexto fijo del Generador. Devuelve lista vacía
 * si aún no hay nómina cargada.
 */
export function construirContextoGeneradorNomina(
  nomina: NominaPeriodo | null | undefined,
): ContextoGeneradorNomina {
  if (!nomina) {
    return {
      items: [],
      resumenLinea: '',
      estadoLabel: '',
      estadoTone: 'neutral',
    };
  }

  const meta = etiquetaMetaNomina(nomina);
  const rango = formatearRangoLegal(nomina.fechaInicio, nomina.fechaFin);
  const estadoLabel = estadoNominaToLabel(nomina.estado);
  const version = nomina.evidenciaCalculo?.versionCalculo ?? 0;

  const items: ContextoGeneradorNominaItem[] = [
    { id: 'empresa', label: 'Empresa', value: nomina.empresaNombre },
    { id: 'periodo', label: 'Período', value: nomina.periodo },
  ];

  if (rango) {
    items.push({ id: 'rango', label: 'Rango legal', value: rango });
  }
  if (meta) {
    items.push({ id: 'meta', label: 'Tipo', value: meta });
  }
  items.push({ id: 'estado', label: 'Estado', value: estadoLabel });
  if (version > 0) {
    items.push({ id: 'version', label: 'Versión cálculo', value: String(version) });
  }

  const partesResumen = [
    nomina.empresaNombre,
    nomina.periodo,
    meta || null,
    estadoLabel,
    version > 0 ? `v${version}` : null,
  ].filter(Boolean);

  return {
    items,
    resumenLinea: partesResumen.join(' · '),
    estadoLabel,
    estadoTone: tonoEstadoNominaShell(nomina.estado),
  };
}
