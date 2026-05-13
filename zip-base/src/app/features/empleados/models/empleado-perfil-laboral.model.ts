export type CondicionTrabajadorCodigo =
  | 'PENSIONADO'
  | 'PENSIONADO_INVALIDEZ_PARCIAL'
  | 'PENSIONADO_INVALIDEZ_TOTAL'
  | 'EXENTO_COTIZACION_PENSION'
  | 'TRABAJADOR_ADOLESCENTE_PROTEGIDO'
  | 'AUTORIZACION_MENOR_REGISTRADA'
  | 'TECNICO_EXTRANJERO_EXENTO'
  | 'DISCAPACIDAD';

export type CondicionTrabajadorControlName =
  | 'pensionado'
  | 'pensionadoInvalidezParcial'
  | 'pensionadoInvalidezTotal'
  | 'exentoCotizacionPension'
  | 'trabajadorAdolescenteProtegido'
  | 'autorizacionMenorRegistrada'
  | 'tecnicoExtranjeroExento'
  | 'discapacidad';

export interface CondicionTrabajadorUiOption {
  readonly codigo: CondicionTrabajadorCodigo;
  readonly controlName: CondicionTrabajadorControlName;
  readonly label: string;
  readonly description: string;
  readonly group: string;
  readonly impact: readonly string[];
  readonly requiereRespaldo: boolean;
}

export interface CondicionTrabajadorPayload {
  codigo: CondicionTrabajadorCodigo;
  vigenciaInicio: string;
  vigenciaFin: string | null;
  respaldoRegistrado: boolean;
  observacion: string | null;
}

export const CONDICIONES_TRABAJADOR_UI: readonly CondicionTrabajadorUiOption[] = [
  {
    codigo: 'PENSIONADO',
    controlName: 'pensionado',
    label: 'Pensionado',
    description: 'Trabajador pensionado que requiere revisión previsional antes de liquidar.',
    group: 'Previsión',
    impact: ['Previsión', 'AFC'],
    requiereRespaldo: true,
  },
  {
    codigo: 'PENSIONADO_INVALIDEZ_PARCIAL',
    controlName: 'pensionadoInvalidezParcial',
    label: 'Pensionado por invalidez parcial',
    description: 'Condición especial previsional asociada a pensión de invalidez parcial.',
    group: 'Previsión',
    impact: ['Previsión', 'Salud'],
    requiereRespaldo: true,
  },
  {
    codigo: 'PENSIONADO_INVALIDEZ_TOTAL',
    controlName: 'pensionadoInvalidezTotal',
    label: 'Pensionado por invalidez total',
    description: 'Condición especial previsional asociada a pensión de invalidez total.',
    group: 'Previsión',
    impact: ['Previsión', 'Salud', 'AFC'],
    requiereRespaldo: true,
  },
  {
    codigo: 'EXENTO_COTIZACION_PENSION',
    controlName: 'exentoCotizacionPension',
    label: 'Exento de cotización de pensión',
    description: 'Caso con respaldo que puede excluir cotización obligatoria de pensión.',
    group: 'Previsión',
    impact: ['Previsión'],
    requiereRespaldo: true,
  },
  {
    codigo: 'TRABAJADOR_ADOLESCENTE_PROTEGIDO',
    controlName: 'trabajadorAdolescenteProtegido',
    label: 'Trabajador adolescente protegido',
    description: 'Aplica cuando la edad laboral detectada requiere tratamiento de menor protegido.',
    group: 'Edad laboral',
    impact: ['Contrato', 'RRHH'],
    requiereRespaldo: true,
  },
  {
    codigo: 'AUTORIZACION_MENOR_REGISTRADA',
    controlName: 'autorizacionMenorRegistrada',
    label: 'Autorización de menor registrada',
    description: 'Respaldo administrativo de autorización para trabajador menor de edad.',
    group: 'Edad laboral',
    impact: ['Contrato', 'RRHH'],
    requiereRespaldo: true,
  },
  {
    codigo: 'TECNICO_EXTRANJERO_EXENTO',
    controlName: 'tecnicoExtranjeroExento',
    label: 'Técnico extranjero exento',
    description: 'Caso de extranjero con exención previsional que debe revisarse con respaldo.',
    group: 'Extranjería',
    impact: ['Previsión', 'Contrato'],
    requiereRespaldo: true,
  },
  {
    codigo: 'DISCAPACIDAD',
    controlName: 'discapacidad',
    label: 'Discapacidad',
    description: 'Condición laboral registrada para seguimiento administrativo y trazabilidad RRHH.',
    group: 'RRHH',
    impact: ['RRHH'],
    requiereRespaldo: true,
  },
] as const;
