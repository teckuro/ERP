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
  hayDiferencias?: boolean;
}): AccionPrincipalShellParametros {
  if (input.validando) {
    return { label: 'Preparando...', disabled: true };
  }
  if (input.loading) {
    return { label: 'Cargando parámetros...', disabled: true };
  }
  if (input.hayBaseGuardada) {
    if (input.hayDiferencias) {
      return { label: 'Revisar y continuar', disabled: false };
    }
    return { label: 'Continuar a dotación', disabled: false };
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
      ? 'Hay diferencias con la configuración guardada. Puedes mantenerla o actualizarla con los valores actuales.'
      : 'Hay diferencias con la configuración guardada. Puedes mantenerla para continuar. Actualizarla requiere administración.';
  }
  return 'La configuración del período está preparada. Usa «Continuar a dotación» para seguir.';
}
