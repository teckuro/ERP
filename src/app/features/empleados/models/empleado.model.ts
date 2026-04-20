import { Enums } from '../../../core/models/database.types';

export type { EmpleadoEstado, EmpleadoListado as Empleado } from './empleado-listado.model';

export type EmpleadoSexo = 'M' | 'F' | 'O';
export type TipoContrato = Enums<'tipo_contrato_enum'>;
export type TipoGratificacion = Enums<'tipo_gratificacion_enum'>;
export type TipoEstadoCivil = Enums<'tipo_estado_civil_enum'>;
export type TipoRegimenPrevisional = Enums<'tipo_prevision_enum'>;
export type RelacionLaboral = 'CONTRATO' | 'HONORARIOS';
