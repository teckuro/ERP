import { Tables } from '../../../core/models/database.types';

export type { EmpleadoEstado, EmpleadoListado as Empleado } from './empleado-listado.model';

export type EmpleadoSexo = 'M' | 'F' | 'O';
export type TipoContrato = NonNullable<Tables<'contrato'>['codigo_tipo_contrato']>;
export type TipoGratificacion = Tables<'remuneracion'>['tipo_gratificacion'];
export type TipoEstadoCivil = NonNullable<Tables<'persona'>['estado_civil']>;
export type TipoRegimenPrevisional = Tables<'prevision'>['tipo_prevision'];
export type RelacionLaboral = 'CONTRATO' | 'HONORARIOS';
