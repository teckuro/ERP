import type {
  PermisosFinosPerfil,
} from '../../../core/auth/erp-permisos-modulos.rules';
import type { RolRemuneracionesLogico } from '../../../core/auth/erp-rol-remuneraciones.models';

export type RolBasePerfil = Exclude<RolRemuneracionesLogico, 'sin_sesion'>;

export interface PerfilAcceso {
  idPerfil: number;
  idEmpresa: number;
  nombre: string;
  descripcion: string | null;
  rolBase: RolBasePerfil;
  permisos: PermisosFinosPerfil;
  activo: boolean;
  fechaCreacion: string;
}

export interface GuardarPerfilAccesoInput {
  idPerfil?: number | null;
  nombre?: string;
  descripcion?: string | null;
  rolBase?: RolBasePerfil;
  permisos?: PermisosFinosPerfil;
  activo?: boolean;
}

export interface UsuarioErp {
  id: string;
  email: string | null;
  nombre: string | null;
  rol: string | null;
  idPerfil: number | null;
  desactivado: boolean;
  ultimoAcceso: string | null;
  creadoEn: string | null;
}

export interface CrearUsuarioInput {
  email: string;
  password: string;
  nombre: string;
  idPerfil: number;
}

export interface ConfigDocumentoLiquidacion {
  logoUrl: string | null;
  mostrarRut: boolean;
  mostrarDireccion: boolean;
  mostrarRepresentante: boolean;
  textoPie: string | null;
  nombreFirmaEmpleador: string | null;
}

export const CONFIG_DOCUMENTO_DEFECTO: ConfigDocumentoLiquidacion = {
  logoUrl: null,
  mostrarRut: true,
  mostrarDireccion: true,
  mostrarRepresentante: false,
  textoPie: null,
  nombreFirmaEmpleador: null,
};
