export type AccionNominaPeriodoId =
  | 'abrir_nomina'
  | 'descartar_nomina'
  | 'forzar_apertura'
  | 'forzar_eliminacion';

export type AccionNominaPeriodoVariante = 'normal' | 'danger' | 'admin';

export interface AccionesNominaPeriodoInput {
  tieneNominaGenerada: boolean;
  tieneNominaConfirmada: boolean;
  liquidacionesGeneradas: number;
  esAdmin: boolean;
  modoPruebas?: boolean;
}

export interface AccionNominaPeriodo {
  id: AccionNominaPeriodoId;
  label: string;
  descripcion: string;
  disponible: boolean;
  bloqueada: boolean;
  motivoBloqueo?: string;
  variante: AccionNominaPeriodoVariante;
}

export interface AccionesNominaPeriodoView {
  normales: AccionNominaPeriodo[];
  admin: AccionNominaPeriodo[];
}

const MOTIVO_LIQUIDACIONES_DESCARTAR =
  'Este período ya tiene liquidaciones generadas. Para modificar la nómina, primero se debe resolver el estado de esas liquidaciones.';

const MOTIVO_LIQUIDACIONES_ABRIR =
  'Ya existen liquidaciones generadas para el período. La corrección debe hacerse mediante un flujo de reversa o anulación.';

function conLiquidaciones(input: AccionesNominaPeriodoInput): boolean {
  return input.liquidacionesGeneradas > 0;
}

function accionAbrirNomina(input: AccionesNominaPeriodoInput): AccionNominaPeriodo {
  const bloqueada = !input.tieneNominaConfirmada || conLiquidaciones(input);
  let motivoBloqueo: string | undefined;
  if (!input.tieneNominaConfirmada) {
    motivoBloqueo = 'La nómina aún no está confirmada. Puede seguir revisando la versión guardada sin abrir de nuevo.';
  } else if (conLiquidaciones(input)) {
    motivoBloqueo = MOTIVO_LIQUIDACIONES_ABRIR;
  }
  return {
    id: 'abrir_nomina',
    label: 'Abrir nómina',
    descripcion:
      'Permite volver a revisión para corregir datos del período antes de generar liquidaciones.',
    disponible: input.tieneNominaGenerada && input.tieneNominaConfirmada && !conLiquidaciones(input),
    bloqueada,
    motivoBloqueo,
    variante: 'normal',
  };
}

function accionDescartarNomina(input: AccionesNominaPeriodoInput): AccionNominaPeriodo {
  const bloqueada = !input.tieneNominaGenerada || conLiquidaciones(input);
  return {
    id: 'descartar_nomina',
    label: 'Descartar nómina generada',
    descripcion:
      'Elimina la versión generada del período y vuelve el flujo al estado previo.',
    disponible: input.tieneNominaGenerada && !conLiquidaciones(input),
    bloqueada,
    motivoBloqueo: conLiquidaciones(input) ? MOTIVO_LIQUIDACIONES_DESCARTAR : undefined,
    variante: 'danger',
  };
}

function accionForzarApertura(input: AccionesNominaPeriodoInput): AccionNominaPeriodo {
  return {
    id: 'forzar_apertura',
    label: 'Forzar apertura de nómina',
    descripcion:
      'Acción administrativa para pruebas. El flujo productivo de reversa se definirá en una fase posterior.',
    disponible: input.tieneNominaGenerada && input.tieneNominaConfirmada,
    bloqueada: false,
    variante: 'admin',
  };
}

function accionForzarEliminacion(input: AccionesNominaPeriodoInput): AccionNominaPeriodo {
  return {
    id: 'forzar_eliminacion',
    label: 'Forzar eliminación de nómina',
    descripcion:
      'Acción administrativa para pruebas. Puede dejar el período sin nómina generada aunque existan datos relacionados.',
    disponible: input.tieneNominaGenerada,
    bloqueada: false,
    variante: 'admin',
  };
}

export function buildAccionesNominaPeriodo(input: AccionesNominaPeriodoInput): AccionesNominaPeriodoView {
  const normales = [accionAbrirNomina(input), accionDescartarNomina(input)];
  const admin =
    input.esAdmin && input.modoPruebas
      ? [accionForzarApertura(input), accionForzarEliminacion(input)]
      : [];
  return { normales, admin };
}

export function buildAccionesNominaPeriodoLista(input: AccionesNominaPeriodoInput): AccionNominaPeriodo[] {
  const view = buildAccionesNominaPeriodo(input);
  return [...view.normales, ...view.admin];
}

export function mostrarAccionesPeriodoNomina(input: AccionesNominaPeriodoInput): boolean {
  return input.tieneNominaGenerada;
}
