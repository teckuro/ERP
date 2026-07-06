import type {
  NominaCreatePreview,
  SiguientePasoCreacion,
  TotalesCreacionPreview,
} from '../models/nomina-creacion-preview.models';
import type { NominaPeriodoResumen, TipoNomina } from '../models/nomina-periodo.models';
import {
  estadoNominaToBadge,
  proximoPasoToIcon,
  proximoPasoToLabel,
} from '../containers/administrador-nominas-container/utils/admin-nominas-presentacion.util';
import type { PasoSiguienteNomina } from '../models/nomina-periodo.models';

export type TabCreacionPreview = 'incluidos' | 'excluidos' | 'conflictos';

export interface CreacionPreviewEmptyVm {
  kicker: string;
  title: string;
  description: string;
  icon: 'users' | 'user-x' | 'alert-triangle';
}

export interface AvisoNominaExistenteVm {
  title: string;
  message: string;
  detail: string;
  estadoLabel: string;
}

export interface HandoffCreacionPreviewVm {
  texto: string;
  icono: string;
}

const PASO_CREACION_A_BANDEJA: Record<SiguientePasoCreacion, PasoSiguienteNomina> = {
  parameters: 'parametros',
  dotacion: 'dotacion',
};

export function etiquetaPeriodoLegible(periodo: string): string {
  const match = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(periodo);
  if (!match) return periodo;
  const fecha = new Date(Number(match[1]), Number(match[2]) - 1, 1);
  return fecha.toLocaleDateString('es-CL', { month: 'long', year: 'numeric' });
}

export function buscarNominaCoincidenteBandeja(
  resumenes: readonly NominaPeriodoResumen[],
  periodo: string,
  empresaId: string,
  tipo: TipoNomina,
): NominaPeriodoResumen | null {
  if (!periodo || !empresaId) return null;
  return resumenes.find(
    (fila) => fila.periodo === periodo
      && fila.empresaId === empresaId
      && fila.tipo === tipo
      && fila.estado !== 'anulada',
  ) ?? null;
}

export function construirAvisoNominaExistente(fila: NominaPeriodoResumen): AvisoNominaExistenteVm {
  const estado = estadoNominaToBadge(fila.estado);
  return {
    title: 'Ya hay una nómina para este período',
    message: `${fila.empresaNombre} · ${etiquetaPeriodoLegible(fila.periodo)} · ${estado.label}`,
    detail: 'Si confirma, se reutilizará la nómina existente sin crear un duplicado.',
    estadoLabel: estado.label,
  };
}

export function inferirSiguientePasoPreview(
  preview: Pick<NominaCreatePreview, 'totales'>,
): SiguientePasoCreacion {
  return preview.totales.incluidos > 0 ? 'dotacion' : 'parameters';
}

export function construirHandoffCreacionPreview(
  preview: Pick<NominaCreatePreview, 'totales'>,
): HandoffCreacionPreviewVm {
  const paso = inferirSiguientePasoPreview(preview);
  const pasoBandeja = PASO_CREACION_A_BANDEJA[paso];
  const n = preview.totales.incluidos;
  const trabajadores = n === 1 ? '1 trabajador incluido' : `${n} trabajadores incluidos`;
  return {
    texto: `${trabajadores} · siguiente paso: ${proximoPasoToLabel(pasoBandeja)}`,
    icono: proximoPasoToIcon(pasoBandeja),
  };
}

export function construirEmptyCreacionPreview(
  tab: TabCreacionPreview,
  totales: TotalesCreacionPreview,
  opciones?: { busquedaActiva?: boolean },
): CreacionPreviewEmptyVm {
  if (opciones?.busquedaActiva) {
    return {
      kicker: 'Sin coincidencias',
      title: 'No hay resultados para la búsqueda',
      description: 'Pruebe con otro nombre o RUT, o limpie el filtro para ver la dotación completa.',
      icon: tab === 'excluidos' ? 'user-x' : 'users',
    };
  }

  if (tab === 'incluidos') {
    return {
      kicker: 'Dotación inicial',
      title: 'Sin trabajadores incluidos',
      description:
        'Verifique contratos vigentes y fichas aptas en Empleados antes de confirmar la creación.',
      icon: 'users',
    };
  }

  if (tab === 'excluidos') {
    return {
      kicker: 'Exclusiones',
      title: 'Sin exclusiones registradas',
      description: 'Todos los trabajadores evaluados cumplen los criterios para la dotación inicial.',
      icon: 'user-x',
    };
  }

  if (totales.conflictos > 0) {
    return {
      kicker: 'Bloqueantes',
      title: 'Revise los conflictos',
      description: 'Resuelva los bloqueantes listados antes de confirmar la creación de la nómina.',
      icon: 'alert-triangle',
    };
  }

  return {
    kicker: 'Conflictos',
    title: 'Sin conflictos detectados',
    description: 'No hay bloqueantes que impidan crear la nómina con la configuración actual.',
    icon: 'alert-triangle',
  };
}
