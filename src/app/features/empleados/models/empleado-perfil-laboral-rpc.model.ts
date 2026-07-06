export type TramoEdadLaboral =
  | 'MENOR_18'
  | 'ADULTO_18_65'
  | 'MAYOR_65'
  | 'SIN_FECHA_NACIMIENTO';

export interface PerfilLaboralPersona {
  idPersona: number;
  periodo: string;
  edadPeriodo: number | null;
  tramoEdadLaboral: TramoEdadLaboral;
  esMenor18: boolean;
  esAdulto1865: boolean;
  esMayor65: boolean;
  esPensionado: boolean;
  esPensionadoInvalidezParcial: boolean;
  esPensionadoInvalidezTotal: boolean;
  exentoCotizacionPension: boolean;
  trabajadorAdolescenteProtegido: boolean;
  autorizacionMenorRegistrada: boolean;
  aplicaImmGeneral: boolean;
  aplicaImmMenor18Mayor65: boolean;
  requiereRevisionRrhh: boolean;
}

export type CondicionEspecialEstadoUi =
  | 'detectada'
  | 'manual'
  | 'pendiente'
  | 'confirmada'
  | 'descartada';

export interface CondicionEspecialEstadoVm {
  codigo: string;
  label: string;
  estado: CondicionEspecialEstadoUi;
  detalle: string;
}

export interface CondicionEspecialDetalleItem {
  label: string;
  value: string;
}
