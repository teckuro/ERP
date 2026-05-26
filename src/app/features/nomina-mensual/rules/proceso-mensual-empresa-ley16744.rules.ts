import type { EmpresaLey16744CalculoSnapshot } from '../models/proceso-mensual.model';

export type EmpresaLey16744Row = {
  id_empresa: number;
  id_organismo_administrador_ley_16744: number | null;
  tasa_adicional_diferenciada: number | null;
  vigencia_inicio: string | null;
  vigencia_fin: string | null;
};

function parsePeriodoYmd(periodo: string): { inicio: string; fin: string } | null {
  const match = /^(\d{4})-(\d{2})$/.exec(periodo.trim());
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  if (!Number.isFinite(year) || !Number.isFinite(month) || month < 1 || month > 12) return null;
  const inicio = `${match[1]}-${match[2]}-01`;
  const ultimoDia = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const fin = `${match[1]}-${match[2]}-${String(ultimoDia).padStart(2, '0')}`;
  return { inicio, fin };
}

/** Vigencia de empresa aplicable al período de nómina (YYYY-MM). Sin fechas = vigente siempre. */
export function empresaVigenteEnPeriodo(
  row: Pick<EmpresaLey16744Row, 'vigencia_inicio' | 'vigencia_fin'>,
  periodo: string,
): boolean {
  const rango = parsePeriodoYmd(periodo);
  if (!rango) return true;
  if (row.vigencia_inicio && row.vigencia_inicio > rango.fin) return false;
  if (row.vigencia_fin && row.vigencia_fin < rango.inicio) return false;
  return true;
}

export function mapEmpresaRowToLey16744Snapshot(row: EmpresaLey16744Row): EmpresaLey16744CalculoSnapshot {
  return {
    idEmpresa: row.id_empresa,
    idOrganismoAdministradorLey16744: row.id_organismo_administrador_ley_16744,
    tasaAdicionalDiferenciada: row.tasa_adicional_diferenciada,
    vigenciaInicio: row.vigencia_inicio,
    vigenciaFin: row.vigencia_fin,
  };
}

/** Ya no se muestra: el cargo empleador usa tasa básica de parámetros aunque falte tasa adicional en empresa. */
export function incidenciaLey16744EmpresaObsoleta(codigo: string): boolean {
  return normalizarCodigoIncidenciaLey16744(codigo) === 'LEY_16744_EMPRESA_INCOMPLETA';
}

function normalizarCodigoIncidenciaLey16744(codigo: string): string {
  return (codigo ?? '').trim().toUpperCase().replace(/-/g, '_');
}
