import type { NovedadMensualCategoria, NovedadMensualTipoMovimiento } from './novedad-mensual.model';

export const CODIGOS_MOTIVO_AUSENCIA = [
  'LICENCIA_MEDICA',
  'LICENCIA_ACCIDENTE',
  'AUSENCIA_INJUSTIFICADA',
  'PERMISO_LEGAL',
  'PERMISO_SIN_GOCE',
] as const;

export type CodigoMotivoAusencia = (typeof CODIGOS_MOTIVO_AUSENCIA)[number];

export interface MotivoAusenciaOpcion {
  codigo: CodigoMotivoAusencia;
  etiqueta: string;
  esLicenciaMedica: boolean;
}

export const MOTIVOS_AUSENCIA_OPCIONES: readonly MotivoAusenciaOpcion[] = [
  { codigo: 'LICENCIA_MEDICA', etiqueta: 'Licencia médica', esLicenciaMedica: true },
  { codigo: 'LICENCIA_ACCIDENTE', etiqueta: 'Licencia por accidente del trabajo', esLicenciaMedica: true },
  { codigo: 'AUSENCIA_INJUSTIFICADA', etiqueta: 'Ausencia injustificada', esLicenciaMedica: false },
  { codigo: 'PERMISO_LEGAL', etiqueta: 'Permiso legal', esLicenciaMedica: false },
  { codigo: 'PERMISO_SIN_GOCE', etiqueta: 'Permiso sin goce de sueldo', esLicenciaMedica: false },
];

export function esCodigoMotivoAusencia(value: string | null | undefined): value is CodigoMotivoAusencia {
  return CODIGOS_MOTIVO_AUSENCIA.includes(value as CodigoMotivoAusencia);
}

export function esRegistroAusenciaLicencia(categoria: NovedadMensualCategoria | string): boolean {
  return categoria === 'ausencia_descuento_tiempo' || categoria === 'licencia_permiso';
}

export function requiereFolioLicencia(codigo: string | null | undefined): boolean {
  return codigo === 'LICENCIA_MEDICA' || codigo === 'LICENCIA_ACCIDENTE';
}

export function esMotivoLicenciaMedicaMotor(codigo: string | null | undefined): boolean {
  return codigo === 'LICENCIA_MEDICA' || codigo === 'LICENCIA_ACCIDENTE';
}

export function resolverCategoriaDesdeMotivo(codigo: CodigoMotivoAusencia): {
  categoria: NovedadMensualCategoria;
  tipoMovimiento: NovedadMensualTipoMovimiento;
} {
  if (codigo === 'AUSENCIA_INJUSTIFICADA') {
    return { categoria: 'ausencia_descuento_tiempo', tipoMovimiento: 'descuento' };
  }
  return { categoria: 'licencia_permiso', tipoMovimiento: 'informativo' };
}

export function etiquetaMotivoAusencia(codigo: string | null | undefined): string {
  if (!codigo) {
    return '';
  }
  return MOTIVOS_AUSENCIA_OPCIONES.find((item) => item.codigo === codigo)?.etiqueta ?? codigo;
}
