import type { RolRemuneracionesLogico } from '../../../core/auth/erp-rol-remuneraciones.models';

export interface ConceptoPermisosUi {
  puedeEditarCatalogo: boolean;
  puedeEditarAporteEmpleador: boolean;
  puedeCrearConcepto: boolean;
  esSoloConsulta: boolean;
}

/** CONC-02: permisos UI alineados a matriz JWT (sin exponer nombres técnicos). */
export function resolverConceptoPermisosUi(rol: RolRemuneracionesLogico): ConceptoPermisosUi {
  const esAdmin = rol === 'admin_remuneraciones';
  const esConsulta = rol === 'consulta_remuneraciones' || rol === 'sin_sesion';
  return {
    puedeEditarCatalogo: !esConsulta,
    puedeEditarAporteEmpleador: esAdmin,
    puedeCrearConcepto: esAdmin,
    esSoloConsulta: esConsulta,
  };
}

export function puedeEditarTipoConcepto(
  tipo: string | null | undefined,
  permisos: ConceptoPermisosUi,
): boolean {
  if (!permisos.puedeEditarCatalogo) return false;
  if (tipo === 'APORTE_EMPLEADOR') return permisos.puedeEditarAporteEmpleador;
  return true;
}
