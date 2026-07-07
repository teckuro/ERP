import type { NominaPeriodoResumen } from '../../nomina-mensual/models/nomina-periodo.models';

type NominaExportPrevired = Pick<NominaPeriodoResumen, 'estado'> & {
  totalTrabajadores?: number;
  trabajadorIds?: readonly string[];
};

/** Nómina visible en liquidaciones con comprobantes materializados. */
export function puedeExportarPreviredNomina(nomina: NominaExportPrevired): boolean {
  if (nomina.estado !== 'liquidada' && nomina.estado !== 'cerrada') return false;
  const trabajadores = nomina.totalTrabajadores ?? nomina.trabajadorIds?.length ?? 0;
  return trabajadores > 0;
}
