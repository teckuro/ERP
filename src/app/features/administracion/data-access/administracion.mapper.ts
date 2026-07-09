import { normalizarPermisosFinos } from '../../../core/auth/erp-permisos-modulos.rules';
import type { Tables } from '../../../core/models/database.types';
import type {
  ConfigDocumentoLiquidacion,
  GuardarPerfilAccesoInput,
  PerfilAcceso,
  RolBasePerfil,
} from '../models/administracion.model';

export type PerfilAccesoRow = Tables<'perfil_acceso'>;
export type ConfigDocumentoRow = Tables<'empresa_config_documento'>;

const ROLES_BASE: readonly RolBasePerfil[] = [
  'admin_sistema',
  'admin_remuneraciones',
  'operador_remuneraciones',
  'consulta_remuneraciones',
];

export function mapRowToPerfilAcceso(row: PerfilAccesoRow): PerfilAcceso {
  const rolBase = ROLES_BASE.includes(row.rol_base as RolBasePerfil)
    ? (row.rol_base as RolBasePerfil)
    : 'consulta_remuneraciones';
  return {
    idPerfil: row.id_perfil,
    idEmpresa: row.id_empresa,
    nombre: row.nombre,
    descripcion: row.descripcion ?? null,
    rolBase,
    permisos: normalizarPermisosFinos(row.permisos),
    activo: row.activo,
    fechaCreacion: row.fecha_creacion,
  };
}

export function mapGuardarPerfilToRpc(input: GuardarPerfilAccesoInput): Record<string, unknown> {
  return {
    p_id_perfil: input.idPerfil ?? null,
    p_nombre: input.nombre ?? null,
    p_descripcion: input.descripcion ?? null,
    p_rol_base: input.rolBase ?? null,
    p_permisos: input.permisos ?? null,
    p_activo: input.activo ?? null,
  };
}

export function mapRowToConfigDocumento(row: ConfigDocumentoRow): ConfigDocumentoLiquidacion {
  return {
    logoUrl: row.logo_url ?? null,
    mostrarRut: row.mostrar_rut,
    mostrarDireccion: row.mostrar_direccion,
    mostrarRepresentante: row.mostrar_representante,
    textoPie: row.texto_pie ?? null,
    nombreFirmaEmpleador: row.nombre_firma_empleador ?? null,
  };
}
