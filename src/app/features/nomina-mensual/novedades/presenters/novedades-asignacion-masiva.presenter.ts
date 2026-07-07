import type { DataGridBulkActionOption } from '../../../../shared/components/ui/data-grid';
import type { TrabajadorMovimientoSeleccionable } from '../rules/novedades-asignacion-masiva.rules';

export const ACCIONES_MASIVAS_TRABAJADORES_MOVIMIENTOS: DataGridBulkActionOption[] = [
  {
    id: 'asignar-movimiento-mes',
    label: 'Asignar movimiento del mes',
    tone: 'success',
    skipConfirm: true,
  },
];

export function tituloModalAsignacionMasiva(cantidad: number): string {
  return cantidad === 1 ? 'Asignar movimiento del mes' : `Asignar movimiento del mes (${cantidad})`;
}

export function etiquetaTrabajadoresSeleccionados(cantidad: number): string {
  return cantidad === 1 ? '1 trabajador seleccionado' : `${cantidad} trabajadores seleccionados`;
}

export function ordenarTrabajadoresSeleccionadosMasivo<T extends TrabajadorMovimientoSeleccionable>(
  trabajadores: readonly T[],
): T[] {
  return [...trabajadores].sort((a, b) => a.trabajador.localeCompare(b.trabajador, 'es'));
}
