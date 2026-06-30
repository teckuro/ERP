import type { NominaPeriodo, NominaPeriodoResumen } from '../../nomina-mensual/models/nomina-periodo.models';
import { derivarIdentidadNominaMensual } from '../../nomina-mensual/models/nomina-periodo.models';
import type {
  AdvertenciaRangoParametrosNomina,
  NominaParametrosContext,
} from '../models/nomina-parametros-context.models';

export function buildNominaParametrosContext(
  nomina: Pick<
    NominaPeriodo | NominaPeriodoResumen,
    'id' | 'periodo' | 'fechaInicio' | 'fechaFin' | 'empresaId' | 'tipo'
  >,
): NominaParametrosContext {
  return {
    nominaPeriodoId: nomina.id,
    periodo: nomina.periodo,
    fechaInicio: nomina.fechaInicio,
    fechaFin: nomina.fechaFin,
    idEmpresa: parseEmpresaId(nomina.empresaId),
    tipoNomina: nomina.tipo,
  };
}

/** Período YYYY-MM usado para consultar catálogos y parametros_generales. */
export function resolverPeriodoConsultaParametros(context: NominaParametrosContext): string {
  return context.periodo;
}

/**
 * Detecta rangos legales que no cubren el mes calendario completo o cruzan meses.
 * La mensual legal completa no genera advertencias; anticipos/subrangos sí.
 */
export function evaluarAdvertenciasRangoParametros(
  context: NominaParametrosContext,
): AdvertenciaRangoParametrosNomina[] {
  const advertencias: AdvertenciaRangoParametrosNomina[] = [];
  const inicioMes = context.periodo.length === 7 ? `${context.periodo}-01` : null;
  const finMes = inicioMes ? ultimoDiaMesYm(context.periodo) : null;

  if (inicioMes && finMes) {
    const esMesCompleto = context.fechaInicio === inicioMes && context.fechaFin === finMes;
    if (context.tipoNomina === 'mensual' && !esMesCompleto) {
      advertencias.push({
        id: 'rango_parcial_mensual',
        titulo: 'Rango legal distinto al mes calendario',
        detalle:
          'Esta nómina mensual no cubre el mes completo. Revisa que los parámetros aplicables correspondan al subrango legal.',
        severidad: 'revision',
      });
    }
  }

  const mesInicio = periodoYmDesdeFecha(context.fechaInicio);
  const mesFin = periodoYmDesdeFecha(context.fechaFin);
  if (mesInicio && mesFin && mesInicio !== mesFin) {
    advertencias.push({
      id: 'rango_cruza_meses',
      titulo: 'El rango legal cruza dos meses',
      detalle:
        'Hay vigencias normativas que pueden cambiar dentro del rango. El motor segmentará en una fase posterior; por ahora revisa manualmente.',
      severidad: 'revision',
    });
  }

  if (context.fechaFin < context.fechaInicio) {
    advertencias.push({
      id: 'rango_invalido',
      titulo: 'Rango legal inconsistente',
      detalle: 'La fecha fin es anterior a la fecha inicio. Corrige la nómina antes de preparar parámetros.',
      severidad: 'bloqueo',
    });
  }

  return advertencias;
}

export function esContextoParametrosCompleto(
  partial: Partial<NominaParametrosContext> | null | undefined,
): partial is NominaParametrosContext {
  return !!partial?.nominaPeriodoId
    && !!partial.periodo
    && !!partial.fechaInicio
    && !!partial.fechaFin;
}

export function identidadMensualEsperada(periodo: string): { fechaInicio: string; fechaFin: string } {
  const identidad = derivarIdentidadNominaMensual(periodo);
  return { fechaInicio: identidad.fechaInicio, fechaFin: identidad.fechaFin };
}

function parseEmpresaId(raw: string): number | null {
  const id = Number(raw);
  return Number.isFinite(id) ? id : null;
}

function periodoYmDesdeFecha(fecha: string): string | null {
  const match = /^(\d{4}-\d{2})-\d{2}$/.exec(fecha.trim());
  return match?.[1] ?? null;
}

function ultimoDiaMesYm(periodo: string): string | null {
  const match = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(periodo);
  if (!match) return null;
  const anio = Number(match[1]);
  const mes = Number(match[2]);
  const ultimo = new Date(Date.UTC(anio, mes, 0)).getUTCDate();
  return `${periodo}-${String(ultimo).padStart(2, '0')}`;
}
