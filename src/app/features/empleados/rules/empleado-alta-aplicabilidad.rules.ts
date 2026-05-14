import { RelacionLaboral, TipoContrato, TipoRegimenPrevisional } from '../models/empleado.model';

export type AltaAplicabilidadEstado =
  | 'required'
  | 'optional'
  | 'derived'
  | 'not_applicable'
  | 'review'
  | 'warning'
  | 'blocked';

export type AltaAplicabilidadDominio =
  | 'relacionLaboral'
  | 'contrato'
  | 'jornada'
  | 'remuneracion'
  | 'asignaciones'
  | 'prevision'
  | 'banco'
  | 'condicionesEspeciales'
  | 'resumen';

export type AltaAplicabilidadCampo =
  | 'relacionLaboral'
  | 'tipoTrabajador'
  | 'cargoServicio'
  | 'tipoContrato'
  | 'fechaContrato'
  | 'fechaIngreso'
  | 'fechaTermino'
  | 'centroCosto'
  | 'jornadaLaboral'
  | 'horasSemanales'
  | 'diasSemanales'
  | 'sueldoBase'
  | 'montoHonorarios'
  | 'monedaRemuneracion'
  | 'gratificacion'
  | 'seguroCesantia'
  | 'cargasFamiliares'
  | 'zonaExtrema'
  | 'semanaCorrida'
  | 'regimenPrevisional'
  | 'saludDependiente'
  | 'apvi'
  | 'banco'
  | 'condicionesEspeciales'
  | 'resumenFinal';

export type AltaAplicabilidadPasoEstado =
  | 'required'
  | 'optional'
  | 'not_applicable'
  | 'review'
  | 'warning'
  | 'blocked';

export interface AltaAplicabilidadInput {
  relacionLaboral: RelacionLaboral;
  tipoContrato: TipoContrato | null;
  tipoRegimenPrevisional: TipoRegimenPrevisional | null;
  tieneApv: boolean;
  tieneCondicionesEspeciales: boolean;
  tieneRespaldoCondiciones: boolean;
  esMenorEdad: boolean;
  esMayor65: boolean;
}

export interface AltaAplicabilidadItem {
  campo: AltaAplicabilidadCampo;
  dominio: AltaAplicabilidadDominio;
  stepIndex: number;
  estado: AltaAplicabilidadEstado;
  label: string;
  motivo: string;
}

export interface AltaAplicabilidadStepSummary {
  stepIndex: number;
  estado: AltaAplicabilidadPasoEstado;
  label: string;
  motivo: string;
  items: readonly AltaAplicabilidadItem[];
}

export interface AltaAplicabilidadState {
  relacionLaboral: RelacionLaboral;
  items: Record<AltaAplicabilidadCampo, AltaAplicabilidadItem>;
  steps: readonly AltaAplicabilidadStepSummary[];
  resumen: {
    required: number;
    optional: number;
    derived: number;
    notApplicable: number;
    review: number;
    warning: number;
    blocked: number;
  };
}

const FIELD_WEIGHT: Record<AltaAplicabilidadEstado, number> = {
  blocked: 60,
  warning: 50,
  review: 40,
  required: 30,
  derived: 20,
  optional: 10,
  not_applicable: 0,
};

const STEP_LABELS: Record<number, string> = {
  0: 'Datos personales',
  1: 'Domicilio particular',
  2: 'Contrato y organización',
  3: 'Jornada y remuneración',
  4: 'Asignaciones laborales',
  5: 'Previsión y salud',
  6: 'APVI',
  7: 'Bancario',
  8: 'Condiciones especiales',
  9: 'Resumen final',
};

const STEP_MOTIVO_BASE: Record<AltaAplicabilidadPasoEstado, string> = {
  blocked: 'Tiene una regla bloqueante para revisar antes de cerrar el alta.',
  warning: 'Tiene advertencias administrativas que conviene revisar.',
  review: 'Tiene datos que requieren confirmación de RRHH.',
  required: 'Tiene datos requeridos para completar el alta.',
  optional: 'Puede completarse si la empresa necesita el dato.',
  not_applicable: 'No corresponde al flujo seleccionado.',
};

export function evaluarAltaAplicabilidad(input: AltaAplicabilidadInput): AltaAplicabilidadState {
  const esHonorarios = input.relacionLaboral === 'HONORARIOS';
  const contratoNoIndefinido =
    input.tipoContrato !== null && input.tipoContrato !== 'INDEFINIDO';
  const requiereSalud =
    !esHonorarios &&
    input.tipoRegimenPrevisional !== null &&
    input.tipoRegimenPrevisional !== 'NINGUNA';
  const regimenNinguna = !esHonorarios && input.tipoRegimenPrevisional === 'NINGUNA';
  const requiereApvi = !esHonorarios && input.tipoRegimenPrevisional === 'AFP' && input.tieneApv;
  const apviDisponible = !esHonorarios && input.tipoRegimenPrevisional === 'AFP';
  const condicionesEnRevision =
    !esHonorarios &&
    (input.esMenorEdad || input.esMayor65 || input.tieneCondicionesEspeciales || regimenNinguna);

  const items = toItems([
    item('relacionLaboral', 'relacionLaboral', 2, 'required', 'Relación laboral', 'Define si la ficha sigue flujo de contrato dependiente o boleta de honorarios.'),
    item(
      'tipoTrabajador',
      'relacionLaboral',
      2,
      'derived',
      'Tipo trabajador',
      esHonorarios
        ? 'Se deriva como INDEPENDIENTE desde boleta de honorarios.'
        : 'Se deriva como DEPENDIENTE desde contrato laboral.',
    ),
    item(
      'cargoServicio',
      'contrato',
      2,
      'required',
      esHonorarios ? 'Servicio o función' : 'Cargo o función',
      esHonorarios
        ? 'Identifica el servicio pactado para el prestador.'
        : 'Identifica el cargo laboral del trabajador.',
    ),
    item(
      'tipoContrato',
      'contrato',
      2,
      esHonorarios ? 'not_applicable' : 'required',
      'Tipo de contrato',
      esHonorarios
        ? 'No corresponde contrato laboral dependiente en boleta de honorarios.'
        : 'Define indefinido, plazo fijo, obra/servicio u otro tratamiento laboral.',
    ),
    item(
      'fechaContrato',
      'contrato',
      2,
      esHonorarios ? 'not_applicable' : 'required',
      'Fecha contrato',
      esHonorarios
        ? 'No se exige fecha de contrato laboral para honorarios.'
        : 'Fecha del instrumento laboral dependiente.',
    ),
    item(
      'fechaIngreso',
      'contrato',
      2,
      'required',
      esHonorarios ? 'Inicio del servicio' : 'Fecha ingreso',
      esHonorarios
        ? 'Fecha de inicio administrativo del servicio.'
        : 'Fecha base para antigüedad, condiciones y validaciones.',
    ),
    item(
      'fechaTermino',
      'contrato',
      2,
      esHonorarios ? 'not_applicable' : contratoNoIndefinido ? 'required' : 'not_applicable',
      'Fecha término',
      esHonorarios
        ? 'No se exige término contractual laboral en honorarios.'
        : contratoNoIndefinido
          ? 'Requerida para contratos no indefinidos.'
          : 'No aplica cuando el contrato es indefinido.',
    ),
    item(
      'centroCosto',
      'contrato',
      2,
      esHonorarios ? 'optional' : 'required',
      esHonorarios ? 'Imputación interna' : 'Sucursal / organización',
      esHonorarios
        ? 'Puede usarse para imputación administrativa del servicio.'
        : 'Ubica al trabajador dentro de la organización.',
    ),
    item(
      'jornadaLaboral',
      'jornada',
      3,
      esHonorarios ? 'not_applicable' : input.esMenorEdad ? 'review' : 'required',
      'Jornada laboral',
      esHonorarios
        ? 'Honorarios no usa jornada laboral dependiente en esta fase.'
        : input.esMenorEdad
          ? 'Menor de edad requiere revisión de jornada y autorización.'
          : 'Dato requerido para el contrato dependiente.',
    ),
    item(
      'horasSemanales',
      'jornada',
      3,
      esHonorarios ? 'not_applicable' : input.esMenorEdad ? 'review' : 'required',
      'Horas semanales',
      esHonorarios
        ? 'No aplica para boleta de honorarios.'
        : input.esMenorEdad
          ? 'Revisar máximo administrativo de 30 horas.'
          : 'Revisar máximo administrativo vigente según jornada.',
    ),
    item(
      'diasSemanales',
      'jornada',
      3,
      esHonorarios ? 'not_applicable' : 'required',
      'Días semanales',
      esHonorarios ? 'No aplica para boleta de honorarios.' : 'Dato requerido para jornada dependiente.',
    ),
    item(
      'sueldoBase',
      'remuneracion',
      3,
      esHonorarios ? 'not_applicable' : 'required',
      'Sueldo base',
      esHonorarios ? 'Se reemplaza visualmente por monto de honorarios.' : 'Base de remuneración dependiente.',
    ),
    item(
      'montoHonorarios',
      'remuneracion',
      3,
      esHonorarios ? 'required' : 'not_applicable',
      'Monto de honorarios',
      esHonorarios ? 'Monto bruto pactado para la boleta.' : 'No aplica en contrato laboral dependiente.',
    ),
    item('monedaRemuneracion', 'remuneracion', 3, 'required', 'Moneda', 'Moneda del sueldo base o monto de honorarios.'),
    item(
      'gratificacion',
      'remuneracion',
      3,
      esHonorarios ? 'not_applicable' : 'required',
      'Gratificación',
      esHonorarios ? 'No aplica en boleta de honorarios.' : 'Dato requerido para contrato dependiente.',
    ),
    item(
      'seguroCesantia',
      'jornada',
      3,
      esHonorarios ? 'not_applicable' : input.esMenorEdad ? 'review' : 'derived',
      'Seguro de Cesantía',
      esHonorarios
        ? 'No aplica en boleta de honorarios.'
        : input.esMenorEdad
          ? 'Menor de edad requiere decisión RRHH.'
          : 'Se explica desde tipo de contrato y condiciones administrativas.',
    ),
    item(
      'cargasFamiliares',
      'asignaciones',
      4,
      esHonorarios ? 'not_applicable' : 'optional',
      'Cargas familiares',
      esHonorarios ? 'No aplica en honorarios.' : 'Se declara solo si corresponde.',
    ),
    item(
      'zonaExtrema',
      'asignaciones',
      4,
      esHonorarios ? 'not_applicable' : 'optional',
      'Zona extrema',
      esHonorarios ? 'No aplica en honorarios.' : 'Se declara solo si corresponde al territorio.',
    ),
    item(
      'semanaCorrida',
      'asignaciones',
      4,
      esHonorarios ? 'not_applicable' : 'optional',
      'Semana corrida',
      esHonorarios ? 'No aplica en honorarios.' : 'Se activa solo si corresponde a la remuneración pactada.',
    ),
    item(
      'regimenPrevisional',
      'prevision',
      5,
      esHonorarios ? 'not_applicable' : regimenNinguna ? 'review' : 'required',
      'Régimen previsional',
      esHonorarios
        ? 'No se captura previsión dependiente en honorarios.'
        : regimenNinguna
          ? 'Debe tener motivo administrativo y respaldo.'
          : 'Dato requerido para trabajador dependiente.',
    ),
    item(
      'saludDependiente',
      'prevision',
      5,
      esHonorarios ? 'not_applicable' : requiereSalud ? 'required' : regimenNinguna ? 'review' : 'optional',
      'Salud dependiente',
      esHonorarios
        ? 'No se captura salud dependiente en honorarios.'
        : requiereSalud
          ? 'Dato requerido con AFP o IPS.'
          : regimenNinguna
            ? 'Revisar que la ausencia de AFP/IPS no oculte una obligación de salud.'
            : 'Queda pendiente hasta seleccionar régimen.',
    ),
    item(
      'apvi',
      'prevision',
      6,
      esHonorarios ? 'not_applicable' : requiereApvi ? 'required' : apviDisponible ? 'optional' : 'not_applicable',
      'APVI',
      esHonorarios
        ? 'No aplica en honorarios.'
        : requiereApvi
          ? 'Campos APVI requeridos porque fue activado.'
          : apviDisponible
            ? 'Disponible si RRHH activa APVI.'
            : 'Solo aplica cuando el régimen previsional es AFP.',
    ),
    item(
      'banco',
      'banco',
      7,
      esHonorarios ? 'optional' : 'required',
      esHonorarios ? 'Datos para pago' : 'Cuenta bancaria',
      esHonorarios
        ? 'Recomendado para transferencia, pero la fase mantiene honorarios como borrador.'
        : 'Dato requerido para pago de remuneraciones.',
    ),
    item(
      'condicionesEspeciales',
      'condicionesEspeciales',
      8,
      esHonorarios ? 'not_applicable' : condicionesEnRevision ? input.tieneCondicionesEspeciales && input.tieneRespaldoCondiciones ? 'review' : 'warning' : 'optional',
      'Condiciones especiales',
      esHonorarios
        ? 'No se declaran condiciones dependientes en honorarios en esta fase.'
        : condicionesEnRevision
          ? 'Revisión administrativa según edad, previsión o condiciones declaradas.'
          : 'Solo se declara si aplica.',
    ),
    item(
      'resumenFinal',
      'resumen',
      9,
      esHonorarios ? 'blocked' : 'required',
      'Resumen final',
      esHonorarios
        ? 'Honorarios solo permite guardar borrador hasta definir persistencia final.'
        : 'Revisión final antes de crear ficha activa o en proceso.',
    ),
  ]);

  return {
    relacionLaboral: input.relacionLaboral,
    items,
    steps: buildStepSummaries(items),
    resumen: buildResumen(items),
  };
}

export function altaAplicabilidadItem(
  state: AltaAplicabilidadState,
  campo: AltaAplicabilidadCampo,
): AltaAplicabilidadItem {
  return state.items[campo];
}

export function altaAplicabilidadStep(
  state: AltaAplicabilidadState,
  stepIndex: number,
): AltaAplicabilidadStepSummary {
  return (
    state.steps.find((step) => step.stepIndex === stepIndex) ?? {
      stepIndex,
      estado: 'required',
      label: STEP_LABELS[stepIndex] ?? `Paso ${stepIndex + 1}`,
      motivo: STEP_MOTIVO_BASE.required,
      items: [],
    }
  );
}

export function altaAplicabilidadEsNoAplicable(
  state: AltaAplicabilidadState,
  campo: AltaAplicabilidadCampo,
): boolean {
  return altaAplicabilidadItem(state, campo).estado === 'not_applicable';
}

export function altaAplicabilidadEsRequerido(
  state: AltaAplicabilidadState,
  campo: AltaAplicabilidadCampo,
): boolean {
  return altaAplicabilidadItem(state, campo).estado === 'required';
}

function item(
  campo: AltaAplicabilidadCampo,
  dominio: AltaAplicabilidadDominio,
  stepIndex: number,
  estado: AltaAplicabilidadEstado,
  label: string,
  motivo: string,
): AltaAplicabilidadItem {
  return { campo, dominio, stepIndex, estado, label, motivo };
}

function toItems(items: readonly AltaAplicabilidadItem[]): Record<AltaAplicabilidadCampo, AltaAplicabilidadItem> {
  return items.reduce((acc, current) => {
    acc[current.campo] = current;
    return acc;
  }, {} as Record<AltaAplicabilidadCampo, AltaAplicabilidadItem>);
}

function buildStepSummaries(
  itemsByKey: Record<AltaAplicabilidadCampo, AltaAplicabilidadItem>,
): readonly AltaAplicabilidadStepSummary[] {
  const byStep = new Map<number, AltaAplicabilidadItem[]>();

  Object.values(itemsByKey).forEach((item) => {
    const current = byStep.get(item.stepIndex) ?? [];
    current.push(item);
    byStep.set(item.stepIndex, current);
  });

  return Array.from({ length: 10 }, (_, stepIndex) => {
    const items = byStep.get(stepIndex) ?? [];
    const estado = resolveStepEstado(items);
    return {
      stepIndex,
      estado,
      label: STEP_LABELS[stepIndex] ?? `Paso ${stepIndex + 1}`,
      motivo: resolveStepMotivo(estado, items),
      items,
    };
  });
}

function resolveStepEstado(items: readonly AltaAplicabilidadItem[]): AltaAplicabilidadPasoEstado {
  if (items.length === 0) {
    return 'required';
  }

  if (items.every((item) => item.estado === 'not_applicable')) {
    return 'not_applicable';
  }

  if (items.some((item) => item.estado === 'blocked')) {
    return 'blocked';
  }

  if (items.some((item) => item.estado === 'warning')) {
    return 'warning';
  }

  if (items.some((item) => item.estado === 'review')) {
    return 'review';
  }

  if (items.some((item) => item.estado === 'required')) {
    return 'required';
  }

  if (items.some((item) => item.estado === 'derived')) {
    return 'required';
  }

  return 'optional';
}

function resolveStepMotivo(
  estado: AltaAplicabilidadPasoEstado,
  items: readonly AltaAplicabilidadItem[],
): string {
  if (estado === 'not_applicable') {
    return STEP_MOTIVO_BASE.not_applicable;
  }

  const strongest = [...items].sort((a, b) => FIELD_WEIGHT[b.estado] - FIELD_WEIGHT[a.estado])[0];
  return strongest?.motivo ?? STEP_MOTIVO_BASE[estado];
}

function buildResumen(itemsByKey: Record<AltaAplicabilidadCampo, AltaAplicabilidadItem>): AltaAplicabilidadState['resumen'] {
  const base = {
    required: 0,
    optional: 0,
    derived: 0,
    notApplicable: 0,
    review: 0,
    warning: 0,
    blocked: 0,
  };

  return Object.values(itemsByKey).reduce((acc, item) => {
    switch (item.estado) {
      case 'required':
        acc.required += 1;
        break;
      case 'optional':
        acc.optional += 1;
        break;
      case 'derived':
        acc.derived += 1;
        break;
      case 'not_applicable':
        acc.notApplicable += 1;
        break;
      case 'review':
        acc.review += 1;
        break;
      case 'warning':
        acc.warning += 1;
        break;
      case 'blocked':
        acc.blocked += 1;
        break;
    }

    return acc;
  }, base);
}
