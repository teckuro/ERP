import type {
  DiffCalculoVersionResultado,
  DiffCampoCalculoVersion,
} from '../../nomina-mensual/rules/nomina-calculo-version-diff.rules';

export interface CampoDiffRecalculoView {
  id: string;
  label: string;
  anterior: string;
  actual: string;
  delta: string;
  deltaPositivo: boolean;
}

export interface DiffRecalculoView {
  id: string;
  titulo: string;
  campos: CampoDiffRecalculoView[];
}

const ETIQUETAS_CAMPO: Record<DiffCampoCalculoVersion['campo'], string> = {
  totalTrabajadores: 'Trabajadores',
  totalHaberes: 'Haberes',
  totalDescuentos: 'Descuentos',
  totalLiquido: 'Líquido',
};

function formatearValor(campo: DiffCampoCalculoVersion['campo'], valor: number): string {
  if (campo === 'totalTrabajadores') return String(valor);
  return `$${Math.round(valor).toLocaleString('es-CL')}`;
}

function formatearDelta(campo: DiffCampoCalculoVersion['campo'], delta: number): string {
  if (campo === 'totalTrabajadores') {
    const prefijo = delta > 0 ? '+' : '';
    return `${prefijo}${delta}`;
  }
  const prefijo = delta > 0 ? '+' : delta < 0 ? '−' : '';
  return `${prefijo}$${Math.abs(Math.round(delta)).toLocaleString('es-CL')}`;
}

export function presentarDiffRecalculo(diff: DiffCalculoVersionResultado): DiffRecalculoView | null {
  if (!diff.hayCambios) return null;
  return {
    id: `${diff.versionAnterior}-${diff.versionActual}`,
    titulo: `Cambios entre recálculo v${diff.versionAnterior} y v${diff.versionActual}`,
    campos: diff.campos.map((campo) => ({
      id: campo.campo,
      label: ETIQUETAS_CAMPO[campo.campo],
      anterior: formatearValor(campo.campo, campo.anterior),
      actual: formatearValor(campo.campo, campo.actual),
      delta: formatearDelta(campo.campo, campo.delta),
      deltaPositivo: campo.delta > 0,
    })),
  };
}

export function presentarDiffsRecalculo(
  diffs: readonly DiffCalculoVersionResultado[],
): DiffRecalculoView[] {
  return diffs
    .map(presentarDiffRecalculo)
    .filter((v): v is DiffRecalculoView => v != null);
}

/** Resumen compacto del último recálculo (el diff más reciente con cambios). */
export function ultimoDiffRecalculoConCambios(
  diffs: readonly DiffCalculoVersionResultado[],
): DiffRecalculoView | null {
  const vistas = presentarDiffsRecalculo(diffs);
  return vistas.length > 0 ? vistas[vistas.length - 1]! : null;
}
