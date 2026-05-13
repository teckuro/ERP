import { RelacionLaboral, TipoContrato, TipoRegimenPrevisional } from '../models/empleado.model';

export type AltaCoherenciaArea =
  | 'seguroCesantia'
  | 'jornada'
  | 'prevision'
  | 'condicionesEspeciales';

export type AltaCoherenciaSeverity = 'info' | 'warning';

export type AltaCoherenciaAction =
  | 'activarSeguroCesantia'
  | 'desactivarSeguroCesantia'
  | 'ajustarHorasSemanales'
  | 'marcarTrabajadorAdolescenteProtegido'
  | 'marcarExentoCotizacionPension';

export type AltaCoherenciaTone = 'ok' | 'info' | 'warning' | 'review';

export interface AltaCoherenciaCondicionesInput {
  pensionado: boolean;
  pensionadoInvalidezParcial: boolean;
  pensionadoInvalidezTotal: boolean;
  exentoCotizacionPension: boolean;
  trabajadorAdolescenteProtegido: boolean;
  autorizacionMenorRegistrada: boolean;
  tecnicoExtranjeroExento: boolean;
  discapacidad: boolean;
  respaldoRegistrado: boolean;
}

export interface AltaCoherenciaInput {
  relacionLaboral: RelacionLaboral;
  tipoContrato: TipoContrato | null;
  tipoJornadaLabel: string;
  fechaNacimiento: string;
  fechaIngreso: string;
  horasSemanales: number | null;
  seguroCesantia: boolean;
  tipoRegimenPrevisional: TipoRegimenPrevisional | null;
  condiciones: AltaCoherenciaCondicionesInput;
}

export interface AltaCoherenciaIssue {
  id: string;
  area: AltaCoherenciaArea;
  stepIndex: number;
  severity: AltaCoherenciaSeverity;
  title: string;
  detail: string;
  summary: string;
  recommendedActionLabel?: string;
  action?: AltaCoherenciaAction;
  actionValue?: boolean | number;
}

export interface AltaCoherenciaDerivedStatus {
  label: string;
  detail: string;
  tone: AltaCoherenciaTone;
}

export interface AltaCoherenciaState {
  issues: AltaCoherenciaIssue[];
  seguroCesantia: AltaCoherenciaDerivedStatus;
  jornada: AltaCoherenciaDerivedStatus;
  prevision: AltaCoherenciaDerivedStatus;
}

const JORNADA_ORDINARIA_MAX_2026 = 42;
const JORNADA_ESPECIAL_MAX_30 = 30;

export function evaluarAltaCoherencia(input: AltaCoherenciaInput): AltaCoherenciaState {
  const issues: AltaCoherenciaIssue[] = [];
  const edad = calcularEdad(input.fechaNacimiento, input.fechaIngreso);
  const esHonorarios = input.relacionLaboral === 'HONORARIOS';
  const esMenor = edad !== null && edad < 18;
  const esJornadaParcial = normalizarTexto(input.tipoJornadaLabel).includes('parcial');
  const condiciones = input.condiciones;
  const esPensionado = condiciones.pensionado || condiciones.pensionadoInvalidezTotal;
  const esPensionadoParcial = condiciones.pensionadoInvalidezParcial;

  let seguro: AltaCoherenciaDerivedStatus = {
    label: 'Pendiente',
    detail: 'Selecciona tipo de contrato para evaluar Seguro de Cesantía.',
    tone: 'review',
  };
  let jornada: AltaCoherenciaDerivedStatus = {
    label: 'Pendiente',
    detail: 'Completa jornada y fecha de ingreso para evaluar coherencia laboral.',
    tone: 'review',
  };
  let prevision: AltaCoherenciaDerivedStatus = {
    label: 'Pendiente',
    detail: 'Selecciona régimen previsional para revisar coherencia administrativa.',
    tone: 'review',
  };

  if (esHonorarios) {
    seguro = {
      label: 'No aplica',
      detail: 'Boleta de honorarios no corresponde a Seguro de Cesantía de trabajador dependiente.',
      tone: 'info',
    };
    jornada = {
      label: 'No aplica',
      detail: 'Boleta de honorarios no usa jornada laboral dependiente en esta alta.',
      tone: 'info',
    };
    prevision = {
      label: 'No aplica',
      detail: 'Previsión y salud dependiente no se capturan en el flujo de honorarios actual.',
      tone: 'info',
    };

    if (input.seguroCesantia) {
      issues.push({
        id: 'coh.seguro.honorarios-activo',
        area: 'seguroCesantia',
        stepIndex: 3,
        severity: 'warning',
        title: 'Seguro de Cesantía no aplica para honorarios',
        detail: 'El registro está como boleta de honorarios, pero el seguro quedó activo.',
        summary: 'Seguro de Cesantía activo en registro de honorarios.',
        recommendedActionLabel: 'Desactivar seguro de cesantía',
        action: 'desactivarSeguroCesantia',
        actionValue: false,
      });
    }

    return { issues, seguroCesantia: seguro, jornada, prevision };
  }

  if (esMenor) {
    seguro = {
      label: 'No aplica / revisar',
      detail: 'Menor de 18 años detectado. RRHH debe revisar Seguro de Cesantía y respaldo de menor.',
      tone: 'warning',
    };
    if (input.seguroCesantia) {
      issues.push({
        id: 'coh.seguro.menor-activo',
        area: 'seguroCesantia',
        stepIndex: 3,
        severity: 'warning',
        title: 'Seguro de Cesantía activo en menor de 18',
        detail: 'El sistema detectó menor de 18 años. La recomendación administrativa es desactivar el seguro y dejar revisión RRHH.',
        summary: 'Seguro de Cesantía activo con menor de 18 años.',
        recommendedActionLabel: 'Desactivar seguro de cesantía',
        action: 'desactivarSeguroCesantia',
        actionValue: false,
      });
    }
  } else if (esPensionado && !esPensionadoParcial) {
    seguro = {
      label: 'Revisión pensionado',
      detail: 'Pensionado detectado. Revisa si corresponde excluir Seguro de Cesantía.',
      tone: 'warning',
    };
    if (input.seguroCesantia) {
      issues.push({
        id: 'coh.seguro.pensionado-activo',
        area: 'seguroCesantia',
        stepIndex: 3,
        severity: 'warning',
        title: 'Seguro de Cesantía activo con pensionado',
        detail: 'La condición pensionado requiere revisión. Si no corresponde invalidez parcial, la recomendación es desactivar el seguro.',
        summary: 'Seguro de Cesantía activo con pensionado en revisión.',
        recommendedActionLabel: 'Desactivar seguro de cesantía',
        action: 'desactivarSeguroCesantia',
        actionValue: false,
      });
    }
  } else if (input.tipoContrato === 'INDEFINIDO') {
    seguro = {
      label: 'Aplica',
      detail: 'Contrato indefinido. Distribución AFC: trabajador y empleador.',
      tone: input.seguroCesantia ? 'ok' : 'warning',
    };
    if (!input.seguroCesantia) {
      issues.push({
        id: 'coh.seguro.indefinido-inactivo',
        area: 'seguroCesantia',
        stepIndex: 3,
        severity: 'warning',
        title: 'Seguro de Cesantía desactivado en contrato indefinido',
        detail: 'Para contrato indefinido normalmente aplica Seguro de Cesantía con aporte trabajador y empleador.',
        summary: 'Seguro de Cesantía desactivado en contrato indefinido.',
        recommendedActionLabel: 'Activar seguro de cesantía',
        action: 'activarSeguroCesantia',
        actionValue: true,
      });
    }
  } else if (input.tipoContrato === 'PLAZO_FIJO' || input.tipoContrato === 'OBRA_SERVICIO') {
    seguro = {
      label: 'Aplica',
      detail: 'Contrato a plazo, obra o servicio. El aporte AFC es de cargo del empleador.',
      tone: input.seguroCesantia ? 'ok' : 'warning',
    };
    if (!input.seguroCesantia) {
      issues.push({
        id: 'coh.seguro.plazo-obra-inactivo',
        area: 'seguroCesantia',
        stepIndex: 3,
        severity: 'warning',
        title: 'Seguro de Cesantía desactivado en contrato no indefinido',
        detail: 'Para plazo fijo, obra o servicio normalmente aplica Seguro de Cesantía y el costo es de cargo del empleador.',
        summary: 'Seguro de Cesantía desactivado en plazo fijo, obra o servicio.',
        recommendedActionLabel: 'Activar seguro de cesantía',
        action: 'activarSeguroCesantia',
        actionValue: true,
      });
    }
  } else if (input.tipoContrato === 'CASA_PARTICULAR') {
    seguro = {
      label: 'Revisión requerida',
      detail: 'Casa particular requiere tratamiento previsional/AFC específico. Mantén revisión administrativa.',
      tone: 'review',
    };
  }

  if (condiciones.tecnicoExtranjeroExento && !input.seguroCesantia && !esMenor && !esPensionado) {
    issues.push({
      id: 'coh.seguro.tecnico-extranjero-inactivo',
      area: 'seguroCesantia',
      stepIndex: 3,
      severity: 'warning',
      title: 'Técnico extranjero exento no exime Seguro de Cesantía',
      detail: 'La exención previsional de técnico extranjero no debe apagar por sí sola el Seguro de Cesantía.',
      summary: 'Técnico extranjero exento con Seguro de Cesantía desactivado.',
      recommendedActionLabel: 'Activar seguro de cesantía',
      action: 'activarSeguroCesantia',
      actionValue: true,
    });
  }

  const maxHoras = esMenor || esJornadaParcial ? JORNADA_ESPECIAL_MAX_30 : JORNADA_ORDINARIA_MAX_2026;
  const motivoJornada = esMenor
    ? 'Menor de 18 años. Jornada máxima administrativa: 30 horas semanales.'
    : esJornadaParcial
      ? 'Jornada parcial detectada. Máximo administrativo: 30 horas semanales.'
      : 'Jornada ordinaria vigente. Máximo administrativo: 42 horas semanales.';
  jornada = {
    label: input.horasSemanales === null ? 'Pendiente' : input.horasSemanales <= maxHoras ? 'OK' : 'Revisión requerida',
    detail: motivoJornada,
    tone: input.horasSemanales === null ? 'review' : input.horasSemanales <= maxHoras ? 'ok' : 'warning',
  };

  if (input.horasSemanales !== null && input.horasSemanales > maxHoras) {
    issues.push({
      id: esMenor ? 'coh.jornada.menor-sobre-30' : esJornadaParcial ? 'coh.jornada.parcial-sobre-30' : 'coh.jornada.ordinaria-sobre-42',
      area: 'jornada',
      stepIndex: 3,
      severity: 'warning',
      title: esMenor ? 'Jornada sobre 30 horas en menor de edad' : esJornadaParcial ? 'Jornada parcial sobre 30 horas' : 'Jornada sobre 42 horas semanales',
      detail: `${motivoJornada} Actualmente hay ${input.horasSemanales} horas informadas.`,
      summary: `Jornada semanal sobre el máximo administrativo sugerido (${maxHoras} horas).`,
      recommendedActionLabel: `Ajustar a ${maxHoras} horas`,
      action: 'ajustarHorasSemanales',
      actionValue: maxHoras,
    });
  }

  if (esMenor && !condiciones.trabajadorAdolescenteProtegido && !condiciones.autorizacionMenorRegistrada) {
    issues.push({
      id: 'coh.condiciones.menor-sin-condicion',
      area: 'condicionesEspeciales',
      stepIndex: 8,
      severity: 'warning',
      title: 'Menor de edad sin condición administrativa confirmada',
      detail: 'El sistema detectó menor de 18 años. Revisa trabajador adolescente protegido y respaldo/autorización de menor.',
      summary: 'Menor de 18 años sin condición especial o autorización registrada.',
      recommendedActionLabel: 'Marcar trabajador adolescente protegido',
      action: 'marcarTrabajadorAdolescenteProtegido',
      actionValue: true,
    });
  }

  const tieneCondicionPrevisionalEspecial =
    condiciones.exentoCotizacionPension ||
    condiciones.tecnicoExtranjeroExento ||
    condiciones.pensionado ||
    condiciones.pensionadoInvalidezParcial ||
    condiciones.pensionadoInvalidezTotal;

  if (input.tipoRegimenPrevisional === 'NINGUNA') {
    prevision = {
      label: 'Revisión requerida',
      detail: 'Régimen sin AFP/IPS exige condición especial y respaldo administrativo.',
      tone: 'warning',
    };
    if (!tieneCondicionPrevisionalEspecial) {
      issues.push({
        id: 'coh.prevision.ninguna-sin-condicion',
        area: 'prevision',
        stepIndex: 5,
        severity: 'warning',
        title: 'Régimen previsional Ninguna sin condición especial',
        detail: 'Si el trabajador no cotizará pensión, RRHH debe declarar una condición especial con respaldo.',
        summary: 'Régimen Ninguna sin condición previsional especial declarada.',
        recommendedActionLabel: 'Marcar exento cotización pensión',
        action: 'marcarExentoCotizacionPension',
        actionValue: true,
      });
    }
  } else if (input.tipoRegimenPrevisional === 'AFP' || input.tipoRegimenPrevisional === 'IPS') {
    prevision = {
      label: 'OK',
      detail: input.tipoRegimenPrevisional === 'AFP' ? 'Régimen AFP informado.' : 'Régimen IPS informado.',
      tone: 'ok',
    };
  }

  return { issues, seguroCesantia: seguro, jornada, prevision };
}

function calcularEdad(fechaNacimiento: string, fechaReferencia: string): number | null {
  const nacimiento = parseIsoDate(fechaNacimiento);
  const referencia = parseIsoDate(fechaReferencia) ?? new Date();

  if (!nacimiento || nacimiento > referencia) {
    return null;
  }

  let edad = referencia.getFullYear() - nacimiento.getFullYear();
  const monthDelta = referencia.getMonth() - nacimiento.getMonth();
  const dayDelta = referencia.getDate() - nacimiento.getDate();

  if (monthDelta < 0 || (monthDelta === 0 && dayDelta < 0)) {
    edad -= 1;
  }

  return edad;
}

function parseIsoDate(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }

  const [year, month, day] = value.split('-').map(Number);
  const parsed = new Date(year, month - 1, day);

  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function normalizarTexto(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}
