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
  elementos: readonly AltaAplicabilidadItem[];
}

export interface EstadoAplicabilidadAlta {
  relacionLaboral: RelacionLaboral;
  campos: Record<AltaAplicabilidadCampo, AltaAplicabilidadItem>;
  pasos: readonly AltaAplicabilidadStepSummary[];
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

export function evaluarAltaAplicabilidad(input: AltaAplicabilidadInput): EstadoAplicabilidadAlta {
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

  const campos = construirCamposAplicabilidad([
    construirElementoAplicabilidad('relacionLaboral', 'relacionLaboral', 2, 'required', 'Relación laboral', 'Define si la ficha sigue flujo de contrato dependiente o boleta de honorarios.'),
    construirElementoAplicabilidad(
      'tipoTrabajador',
      'relacionLaboral',
      2,
      'derived',
      'Tipo trabajador',
      esHonorarios
        ? 'Se deriva como INDEPENDIENTE desde boleta de honorarios.'
        : 'Se deriva como DEPENDIENTE desde contrato laboral.',
    ),
    construirElementoAplicabilidad(
      'cargoServicio',
      'contrato',
      2,
      'required',
      esHonorarios ? 'Servicio o función' : 'Cargo o función',
      esHonorarios
        ? 'Identifica el servicio pactado para el prestador.'
        : 'Identifica el cargo laboral del trabajador.',
    ),
    construirElementoAplicabilidad(
      'tipoContrato',
      'contrato',
      2,
      esHonorarios ? 'not_applicable' : 'required',
      'Tipo de contrato',
      esHonorarios
        ? 'No corresponde contrato laboral dependiente en boleta de honorarios.'
        : 'Define indefinido, plazo fijo, obra/servicio u otro tratamiento laboral.',
    ),
    construirElementoAplicabilidad(
      'fechaContrato',
      'contrato',
      2,
      esHonorarios ? 'not_applicable' : 'required',
      'Fecha contrato',
      esHonorarios
        ? 'No se exige fecha de contrato laboral para honorarios.'
        : 'Fecha del instrumento laboral dependiente.',
    ),
    construirElementoAplicabilidad(
      'fechaIngreso',
      'contrato',
      2,
      'required',
      esHonorarios ? 'Inicio del servicio' : 'Fecha ingreso',
      esHonorarios
        ? 'Fecha de inicio administrativo del servicio.'
        : 'Fecha base para antigüedad, condiciones y validaciones.',
    ),
    construirElementoAplicabilidad(
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
    construirElementoAplicabilidad(
      'centroCosto',
      'contrato',
      2,
      esHonorarios ? 'optional' : 'required',
      esHonorarios ? 'Imputación interna' : 'Sucursal / organización',
      esHonorarios
        ? 'Puede usarse para imputación administrativa del servicio.'
        : 'Ubica al trabajador dentro de la organización.',
    ),
    construirElementoAplicabilidad(
      'jornadaLaboral',
      'jornada',
      3,
      esHonorarios ? 'not_applicable' : input.esMenorEdad ? 'review' : 'required',
      'Jornada laboral',
      esHonorarios
        ? 'Honorarios no usa jornada laboral dependiente.'
        : input.esMenorEdad
          ? 'Menor de edad requiere revisión de jornada y autorización.'
          : 'Dato requerido para el contrato dependiente.',
    ),
    construirElementoAplicabilidad(
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
    construirElementoAplicabilidad(
      'diasSemanales',
      'jornada',
      3,
      esHonorarios ? 'not_applicable' : 'required',
      'Días semanales',
      esHonorarios ? 'No aplica para boleta de honorarios.' : 'Dato requerido para jornada dependiente.',
    ),
    construirElementoAplicabilidad(
      'sueldoBase',
      'remuneracion',
      3,
      esHonorarios ? 'not_applicable' : 'required',
      'Sueldo base',
      esHonorarios ? 'Se reemplaza visualmente por monto de honorarios.' : 'Base de remuneración dependiente.',
    ),
    construirElementoAplicabilidad(
      'montoHonorarios',
      'remuneracion',
      3,
      esHonorarios ? 'required' : 'not_applicable',
      'Monto de honorarios',
      esHonorarios ? 'Monto bruto pactado para la boleta.' : 'No aplica en contrato laboral dependiente.',
    ),
    construirElementoAplicabilidad('monedaRemuneracion', 'remuneracion', 3, 'required', 'Moneda', 'Moneda del sueldo base o monto de honorarios.'),
    construirElementoAplicabilidad(
      'gratificacion',
      'remuneracion',
      3,
      esHonorarios ? 'not_applicable' : 'required',
      'Gratificación',
      esHonorarios ? 'No aplica en boleta de honorarios.' : 'Dato requerido para contrato dependiente.',
    ),
    construirElementoAplicabilidad(
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
    construirElementoAplicabilidad(
      'cargasFamiliares',
      'asignaciones',
      4,
      esHonorarios ? 'not_applicable' : 'optional',
      'Cargas familiares',
      esHonorarios ? 'No aplica en honorarios.' : 'Se declara solo si corresponde.',
    ),
    construirElementoAplicabilidad(
      'zonaExtrema',
      'asignaciones',
      4,
      esHonorarios ? 'not_applicable' : 'optional',
      'Zona extrema',
      esHonorarios ? 'No aplica en honorarios.' : 'Se declara solo si corresponde al territorio.',
    ),
    construirElementoAplicabilidad(
      'semanaCorrida',
      'asignaciones',
      4,
      esHonorarios ? 'not_applicable' : 'optional',
      'Semana corrida',
      esHonorarios ? 'No aplica en honorarios.' : 'Se activa solo si corresponde a la remuneración pactada.',
    ),
    construirElementoAplicabilidad(
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
    construirElementoAplicabilidad(
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
    construirElementoAplicabilidad(
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
    construirElementoAplicabilidad(
      'banco',
      'banco',
      7,
      esHonorarios ? 'optional' : 'required',
      esHonorarios ? 'Datos para pago' : 'Cuenta bancaria',
      esHonorarios
        ? 'Requerido para transferencia administrativa.'
        : 'Dato requerido para pago de remuneraciones.',
    ),
    construirElementoAplicabilidad(
      'condicionesEspeciales',
      'condicionesEspeciales',
      8,
      esHonorarios ? 'not_applicable' : condicionesEnRevision ? input.tieneCondicionesEspeciales && input.tieneRespaldoCondiciones ? 'review' : 'warning' : 'optional',
      'Condiciones especiales',
      esHonorarios
        ? 'No se declaran condiciones dependientes en honorarios.'
        : condicionesEnRevision
          ? 'Revisión administrativa según edad, previsión o condiciones declaradas.'
          : 'Solo se declara si aplica.',
    ),
    construirElementoAplicabilidad(
      'resumenFinal',
      'resumen',
      9,
      'required',
      'Resumen final',
      esHonorarios
        ? 'Finaliza la ficha administrativa de honorarios.'
        : 'Revisión final antes de crear ficha activa o en proceso.',
    ),
  ]);

  return {
    relacionLaboral: input.relacionLaboral,
    campos,
    pasos: construirResumenesPaso(campos),
    resumen: construirResumen(campos),
  };
}

export function altaAplicabilidadItem(
  estado: EstadoAplicabilidadAlta,
  campo: AltaAplicabilidadCampo,
): AltaAplicabilidadItem {
  return estado.campos[campo];
}

export function altaAplicabilidadStep(
  estado: EstadoAplicabilidadAlta,
  stepIndex: number,
): AltaAplicabilidadStepSummary {
  return (
    estado.pasos.find((step) => step.stepIndex === stepIndex) ?? {
      stepIndex,
      estado: 'required',
      label: STEP_LABELS[stepIndex] ?? `Paso ${stepIndex + 1}`,
      motivo: STEP_MOTIVO_BASE.required,
      elementos: [],
    }
  );
}

export function altaAplicabilidadEsNoAplicable(
  estado: EstadoAplicabilidadAlta,
  campo: AltaAplicabilidadCampo,
): boolean {
  return altaAplicabilidadItem(estado, campo).estado === 'not_applicable';
}

export function altaAplicabilidadEsRequerido(
  estado: EstadoAplicabilidadAlta,
  campo: AltaAplicabilidadCampo,
): boolean {
  return altaAplicabilidadItem(estado, campo).estado === 'required';
}

function construirElementoAplicabilidad(
  campo: AltaAplicabilidadCampo,
  dominio: AltaAplicabilidadDominio,
  stepIndex: number,
  estado: AltaAplicabilidadEstado,
  label: string,
  motivo: string,
): AltaAplicabilidadItem {
  return { campo, dominio, stepIndex, estado, label, motivo };
}

function construirCamposAplicabilidad(items: readonly AltaAplicabilidadItem[]): Record<AltaAplicabilidadCampo, AltaAplicabilidadItem> {
  return items.reduce((acc, current) => {
    acc[current.campo] = current;
    return acc;
  }, {} as Record<AltaAplicabilidadCampo, AltaAplicabilidadItem>);
}

function construirResumenesPaso(
  camposPorClave: Record<AltaAplicabilidadCampo, AltaAplicabilidadItem>,
): readonly AltaAplicabilidadStepSummary[] {
  const porPaso = new Map<number, AltaAplicabilidadItem[]>();

  Object.values(camposPorClave).forEach((elemento) => {
    const actuales = porPaso.get(elemento.stepIndex) ?? [];
    actuales.push(elemento);
    porPaso.set(elemento.stepIndex, actuales);
  });

  return Array.from({ length: 10 }, (_, stepIndex) => {
    const elementos = porPaso.get(stepIndex) ?? [];
    const estado = resolveStepEstado(elementos);
    return {
      stepIndex,
      estado,
      label: STEP_LABELS[stepIndex] ?? `Paso ${stepIndex + 1}`,
      motivo: resolveStepMotivo(estado, elementos),
      elementos,
    };
  });
}

function resolveStepEstado(elementos: readonly AltaAplicabilidadItem[]): AltaAplicabilidadPasoEstado {
  if (elementos.length === 0) {
    return 'required';
  }

  if (elementos.every((item) => item.estado === 'not_applicable')) {
    return 'not_applicable';
  }

  if (elementos.some((item) => item.estado === 'blocked')) {
    return 'blocked';
  }

  if (elementos.some((item) => item.estado === 'warning')) {
    return 'warning';
  }

  if (elementos.some((item) => item.estado === 'review')) {
    return 'review';
  }

  if (elementos.some((item) => item.estado === 'required')) {
    return 'required';
  }

  if (elementos.some((item) => item.estado === 'derived')) {
    return 'required';
  }

  return 'optional';
}

function resolveStepMotivo(
  estado: AltaAplicabilidadPasoEstado,
  elementos: readonly AltaAplicabilidadItem[],
): string {
  if (estado === 'not_applicable') {
    return STEP_MOTIVO_BASE.not_applicable;
  }

  const mayorPrioridad = [...elementos].sort((a, b) => FIELD_WEIGHT[b.estado] - FIELD_WEIGHT[a.estado])[0];
  return mayorPrioridad?.motivo ?? STEP_MOTIVO_BASE[estado];
}

function construirResumen(camposPorClave: Record<AltaAplicabilidadCampo, AltaAplicabilidadItem>): EstadoAplicabilidadAlta['resumen'] {
  const base = {
    required: 0,
    optional: 0,
    derived: 0,
    notApplicable: 0,
    review: 0,
    warning: 0,
    blocked: 0,
  };

  return Object.values(camposPorClave).reduce((acc, elemento) => {
    switch (elemento.estado) {
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
