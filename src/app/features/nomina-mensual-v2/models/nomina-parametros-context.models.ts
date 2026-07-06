import type { TipoNomina } from '../../nomina-mensual/models/nomina-periodo.models';

/** Contexto de parámetros atado a una nómina concreta (F06). */
export type NominaParametrosContext = {
  nominaPeriodoId: string;
  periodo: string;
  fechaInicio: string;
  fechaFin: string;
  idEmpresa: number | null;
  tipoNomina: TipoNomina;
};

export type AdvertenciaRangoParametrosNomina = {
  id: string;
  titulo: string;
  detalle: string;
  severidad: 'revision' | 'bloqueo';
};
