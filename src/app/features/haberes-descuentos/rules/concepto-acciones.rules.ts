import type { ConceptoMantenimientoFila } from '../models/haber-descuento-asignacion.model';
import { esConceptoAsignable, type ConceptoAsignableInput } from './concepto-asignabilidad.rules';

export interface ConceptoAccionesPermitidas {
  puedeRevisar: boolean;
  puedeEditar: boolean;
  puedeEliminar: boolean;
  /** Asignación manual recurrente en Haberes/descuentos (regla de producto; no abre ese flujo). */
  puedeAsignar: boolean;
  /** Alta desde el catálogo (modal existente). */
  puedeCrear: boolean;
  /** Motivos de bloqueo para tooltips y panel de detalle (sin nombres de tablas). */
  motivosBloqueo: string[];
}

export type ConceptoAccionesInput = Pick<
  ConceptoMantenimientoFila,
  'tipo' | 'esSistema' | 'calculoAutomatico' | 'vigente' | 'vigenciaInicio' | 'vigenciaFin'
>;

function pushMotivoUnico(list: string[], msg: string): void {
  if (!list.includes(msg)) {
    list.push(msg);
  }
}

/** Acciones permitidas y motivos de bloqueo para blindaje de botonera y detalle (Fase 9.2B / CONC-02). */
export function evaluarConceptoAccionesPermitidas(
  row: ConceptoAccionesInput,
  ref: Date,
  opciones: { puedeEditarModoAdmin: boolean; esAdministrador: boolean },
): ConceptoAccionesPermitidas {
  const motivosBloqueo: string[] = [];
  const protegido = row.esSistema || row.calculoAutomatico;

  const puedeRevisar = true;
  const puedeAsignar = esConceptoAsignable(row as ConceptoAsignableInput, ref);
  const puedeCrear = opciones.esAdministrador;

  const puedeEditarBase = !protegido || opciones.puedeEditarModoAdmin;
  const puedeEditar =
    puedeEditarBase && (row.tipo !== 'APORTE_EMPLEADOR' || opciones.esAdministrador);
  if (!puedeEditar && row.tipo === 'APORTE_EMPLEADOR' && !opciones.esAdministrador) {
    pushMotivoUnico(
      motivosBloqueo,
      'Los aportes empleador solo pueden editarse con perfil administrador de remuneraciones.',
    );
  } else if (!puedeEditar) {
    pushMotivoUnico(
      motivosBloqueo,
      'Edición bloqueada: concepto de sistema o marcado como automático en liquidación, sin perfil administrador.',
    );
  }

  /** Fase 9.2B: sin eliminación física desde UI; flujo normativo: baja por vigencia o desactivación (decisiones §7). */
  const puedeEliminar = false;

  return {
    puedeRevisar,
    puedeEditar,
    puedeEliminar,
    puedeAsignar,
    puedeCrear,
    motivosBloqueo,
  };
}

export function tituloAccionConcepto(
  acciones: ConceptoAccionesPermitidas,
  accion: 'editar' | 'eliminar' | 'crear',
): string {
  if (accion === 'crear') {
    return acciones.puedeCrear ? 'Nuevo concepto' : 'Alta no habilitada en esta fase';
  }
  if (accion === 'editar') {
    if (acciones.puedeEditar) {
      return 'Editar concepto';
    }
    return acciones.motivosBloqueo.find((m) => m.startsWith('Edición')) ?? 'Edición no disponible';
  }
  return acciones.puedeEliminar ? 'Eliminar concepto' : 'Eliminación no habilitada en esta fase';
}
