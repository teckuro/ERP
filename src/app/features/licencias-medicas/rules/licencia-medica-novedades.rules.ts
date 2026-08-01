import { calcularDiasAusenciaEnPeriodo } from '../../nomina-mensual/novedades/utils/novedades-ausencia-rango.util';
import type { LicenciaMedicaTipo } from '../models/licencia-medica.model';

const MILISEGUNDOS_POR_DIA = 86_400_000;

export function licenciaMedicaEstadoEsFinal(estado: string | null | undefined): boolean {
  return estado === 'vinculada_nomina' || estado === 'rechazada';
}

export function licenciaMedicaPermiteEdicion(estado: string | null | undefined): boolean {
  return !licenciaMedicaEstadoEsFinal(estado);
}

export function licenciaMedicaListaParaVincular(input: {
  idPersona: number | null;
  folio: string;
  fechaInicio: string;
  fechaTermino: string;
  dias: number | null;
}): boolean {
  return (
    input.idPersona != null &&
    input.folio.trim().length > 0 &&
    input.fechaInicio.trim().length > 0 &&
    input.fechaTermino.trim().length > 0 &&
    input.dias != null &&
    input.dias > 0
  );
}

/** Borrador manual vacío (sin folio ni trabajador ni vigencia). No debe alertar al entrar. */
export function licenciaMedicaEsBorradorVacio(input: {
  origen?: string | null;
  folio?: string | null;
  idPersona?: number | null;
  fechaInicio?: string | null;
  fechaTermino?: string | null;
}): boolean {
  if (input.origen === 'correo') {
    return false;
  }
  const sinFolio = !(input.folio ?? '').trim();
  const sinPersona = input.idPersona == null;
  const sinVigencia = !(input.fechaInicio ?? '').trim() && !(input.fechaTermino ?? '').trim();
  return sinFolio && sinPersona && sinVigencia;
}

/** Pendiente que sí debe pedir atención a RRHH (correo o con datos cargados). */
export function licenciaMedicaRequiereAtencion(input: {
  estado?: string | null;
  origen?: string | null;
  folio?: string | null;
  idPersona?: number | null;
  fechaInicio?: string | null;
  fechaTermino?: string | null;
}): boolean {
  if (input.estado !== 'pendiente_revision') {
    return false;
  }
  return !licenciaMedicaEsBorradorVacio(input);
}

export function pendientesRevisionLicencia(
  input: {
    idPersona: number | null;
    folio: string;
    tipo: string | null;
    fechaInicio: string;
    fechaTermino: string;
    dias: number | null;
  },
): string[] {
  const faltantes: string[] = [];
  if (input.idPersona == null) {
    faltantes.push('Trabajador');
  }
  if (!input.folio.trim()) {
    faltantes.push('Folio de la licencia');
  }
  if (!(input.tipo ?? '').trim()) {
    faltantes.push('Tipo de licencia');
  }
  if (!input.fechaInicio.trim()) {
    faltantes.push('Inicio de vigencia');
  }
  if (!input.fechaTermino.trim()) {
    faltantes.push('Término de vigencia');
  }
  if (input.dias == null || input.dias <= 0) {
    faltantes.push('Días de reposo');
  }
  if (
    input.fechaInicio.trim() &&
    input.fechaTermino.trim() &&
    input.fechaTermino.trim() < input.fechaInicio.trim()
  ) {
    faltantes.push('La fecha de término debe ser igual o posterior al inicio');
  }
  return faltantes;
}

function parseSqlDate(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value.trim());
  if (!match) {
    return null;
  }
  return new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
}

/** Meses calendario (YYYY-MM) que intersectan el rango de la licencia. */
export function periodosIntersectadosLicencia(
  fechaInicio: string,
  fechaTermino: string,
): string[] {
  const inicio = parseSqlDate(fechaInicio);
  const fin = parseSqlDate(fechaTermino);
  if (!inicio || !fin || fin.getTime() < inicio.getTime()) {
    return [];
  }

  const out: string[] = [];
  let year = inicio.getUTCFullYear();
  let month = inicio.getUTCMonth();
  const endYear = fin.getUTCFullYear();
  const endMonth = fin.getUTCMonth();

  while (year < endYear || (year === endYear && month <= endMonth)) {
    out.push(`${year}-${String(month + 1).padStart(2, '0')}`);
    month += 1;
    if (month > 11) {
      month = 0;
      year += 1;
    }
  }
  return out;
}

export function codigoMotivoDesdeTipoLicencia(tipo: LicenciaMedicaTipo | null | undefined): string {
  if (tipo === 'accidente') {
    return 'LICENCIA_ACCIDENTE';
  }
  return 'LICENCIA_MEDICA';
}

export function fechaEventoTramoEnPeriodo(
  fechaInicio: string,
  fechaTermino: string,
  periodoYm: string,
): string | null {
  const iniMes = `${periodoYm}-01`;
  const [y, m] = periodoYm.split('-').map(Number);
  const lastDay = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const finMes = `${periodoYm}-${String(lastDay).padStart(2, '0')}`;
  const clipDesde = fechaInicio > iniMes ? fechaInicio : iniMes;
  const clipHasta = fechaTermino < finMes ? fechaTermino : finMes;
  if (clipDesde > clipHasta) {
    return null;
  }
  return clipDesde;
}

export interface NovedadLicenciaPeriodoPlan {
  periodo: string;
  cantidad: number;
  fechaEvento: string;
  codigoMotivoAusencia: string;
}

export function planificarNovedadesLicencia(input: {
  fechaInicio: string;
  fechaTermino: string;
  tipo: LicenciaMedicaTipo | null;
  folio: string;
}): NovedadLicenciaPeriodoPlan[] {
  const codigo = codigoMotivoDesdeTipoLicencia(input.tipo);
  return periodosIntersectadosLicencia(input.fechaInicio, input.fechaTermino)
    .map((periodo) => {
      const cantidad = calcularDiasAusenciaEnPeriodo(input.fechaInicio, input.fechaTermino, periodo);
      const fechaEvento = fechaEventoTramoEnPeriodo(input.fechaInicio, input.fechaTermino, periodo);
      if (cantidad == null || cantidad <= 0 || !fechaEvento) {
        return null;
      }
      return {
        periodo,
        cantidad,
        fechaEvento,
        codigoMotivoAusencia: codigo,
      };
    })
    .filter((item): item is NovedadLicenciaPeriodoPlan => item !== null);
}

export function calcularDiasLicenciaInclusive(
  fechaInicio: string | null | undefined,
  fechaTermino: string | null | undefined,
): number | null {
  const inicio = fechaInicio ? parseSqlDate(fechaInicio) : null;
  const fin = fechaTermino ? parseSqlDate(fechaTermino) : null;
  if (!inicio || !fin || fin.getTime() < inicio.getTime()) {
    return null;
  }
  return Math.floor((fin.getTime() - inicio.getTime()) / MILISEGUNDOS_POR_DIA) + 1;
}

export function etiquetaEstadoLicenciaMedica(estado: string | null | undefined): string {
  switch (estado) {
    case 'pendiente_revision':
      return 'Pendiente de revisión';
    case 'registrada':
      return 'Registrada';
    case 'vinculada_nomina':
      return 'Vinculada a nómina';
    case 'rechazada':
      return 'Rechazada';
    default:
      return estado?.trim() ? estado : '—';
  }
}

export function etiquetaTipoLicenciaMedica(tipo: string | null | undefined): string {
  switch (tipo) {
    case 'comun':
      return 'Común';
    case 'accidente':
      return 'Accidente del trabajo';
    case 'maternal':
      return 'Maternal';
    case 'paternal':
      return 'Paternal';
    default:
      return tipo?.trim() ? tipo : '—';
  }
}

export function etiquetaOrigenLicenciaMedica(origen: string | null | undefined): string {
  return origen === 'correo' ? 'Correo' : 'Manual';
}
