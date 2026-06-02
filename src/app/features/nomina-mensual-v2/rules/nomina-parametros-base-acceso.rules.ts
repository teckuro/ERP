import type {
  AccionPrincipalShellParametros,
  EvaluacionIntentoRecargaBase,
  ModalAccesoBaseParametrosPort,
  PermisosRecargaBaseParametros,
} from '../models/nomina-parametros-base-acceso.models';

export function resolverPermisosRecargaBase(esAdmin: boolean): PermisosRecargaBaseParametros {
  const puedeRecargarBase = esAdmin;
  return {
    puedeRecargarBase,
    puedeActualizarBaseEnDiferencias: puedeRecargarBase,
  };
}

/** Etiqueta y estado del CTA del shell en el paso Parámetros. */
export function resolverAccionPrincipalShellParametros(input: {
  hayBaseGuardada: boolean;
  validando: boolean;
  loading: boolean;
}): AccionPrincipalShellParametros {
  if (input.validando) {
    return { label: 'Preparando...', disabled: true };
  }
  if (input.loading) {
    return { label: 'Cargando parámetros...', disabled: true };
  }
  if (input.hayBaseGuardada) {
    return { label: 'Continuar a alcance', disabled: false };
  }
  return { label: 'Preparar nómina', disabled: false };
}

/**
 * Evalúa solo intentos de **recargar** la base (actualizar snapshot), no el avance normal.
 */
export function evaluarIntentoRecargaBase(input: {
  hayBaseGuardada: boolean;
  esAdmin: boolean;
  periodoEtiqueta: string;
}): EvaluacionIntentoRecargaBase {
  if (!input.hayBaseGuardada) {
    return { accion: 'permitir' };
  }
  if (!input.esAdmin) {
    return {
      accion: 'bloquear',
      modal: modalSinPermisoRecargaBase(),
    };
  }
  return {
    accion: 'confirmar',
    modal: modalConfirmarRecargaBase(input.periodoEtiqueta),
  };
}

export function modalSinPermisoRecargaBase(): ModalAccesoBaseParametrosPort {
  return { tipo: 'sinPermiso' };
}

export function modalConfirmarRecargaBase(periodoEtiqueta: string): ModalAccesoBaseParametrosPort {
  return { tipo: 'confirmarRecargaBase', periodoEtiqueta };
}

export function ayudaAvanceParametrosConBase(input: {
  esAdmin: boolean;
  hayDiferencias: boolean;
}): string {
  if (input.hayDiferencias) {
    return input.esAdmin
      ? 'Hay diferencias con la base guardada. Puedes mantenerla o actualizarla con los valores actuales.'
      : 'Hay diferencias con la base guardada. Puedes mantener la base para continuar; actualizar requiere administración.';
  }
  return 'La base del período está preparada. Usa «Continuar a alcance» para seguir.';
}
