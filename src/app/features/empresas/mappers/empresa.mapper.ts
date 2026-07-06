import type { Database } from '../../../core/models/database.types';
import { formatRut } from '../../empleados/mappers/empleado-listado.mapper';
import type {
  EmpresaDetalle,
  EmpresaFormPayload,
  EmpresaListadoFila,
  OrganismoMutualCatalogo,
} from '../models/empresa.model';

type EmpresaRow = Database['public']['Tables']['empresa']['Row'];
type EmpresaInsert = Database['public']['Tables']['empresa']['Insert'];
type EmpresaUpdate = Database['public']['Tables']['empresa']['Update'];

type EmpresaListRow = EmpresaRow & {
  organismo_administrador_ley_16744?: { nombre: string } | { nombre: string }[] | null;
};

function unwrapOrganismoNombre(
  organismo: EmpresaListRow['organismo_administrador_ley_16744'],
): string | null {
  if (!organismo) {
    return null;
  }
  const row = Array.isArray(organismo) ? organismo[0] : organismo;
  return row?.nombre?.trim() || null;
}

export function mapEmpresaRowToListadoFila(row: EmpresaListRow): EmpresaListadoFila {
  return {
    idEmpresa: row.id_empresa,
    rut: row.rut,
    dv: row.dv,
    rutFormateado: formatRut(row.rut, row.dv),
    razonSocial: row.razon_social,
    nombreFantasia: row.nombre_fantasia,
    comuna: row.comuna,
    aplicaMutual: row.aplica_ley_16744,
    organismoMutualNombre: unwrapOrganismoNombre(row.organismo_administrador_ley_16744),
  };
}

export function mapEmpresaRowToDetalle(row: EmpresaRow): EmpresaDetalle {
  return {
    idEmpresa: row.id_empresa,
    rut: row.rut,
    dv: row.dv,
    razonSocial: row.razon_social,
    nombreFantasia: row.nombre_fantasia,
    giro: row.giro,
    actividadEconomica: row.actividad_economica,
    representanteLegalNombre: row.representante_legal_nombre,
    representanteLegalRut: row.representante_legal_rut,
    representanteLegalDv: row.representante_legal_dv,
    representanteLegalEmail: row.representante_legal_email,
    representanteLegalTelefono: row.representante_legal_telefono,
    emailContacto: row.email_contacto,
    telefonoContacto: row.telefono_contacto,
    direccionLinea1: row.direccion_linea_1,
    direccionLinea2: row.direccion_linea_2,
    comuna: row.comuna,
    ciudad: row.ciudad,
    region: row.region,
    codigoPostal: row.codigo_postal,
    aplicaMutual: row.aplica_ley_16744,
    idOrganismoMutual: row.id_organismo_administrador_ley_16744,
    tasaAdicionalDiferenciada: row.tasa_adicional_diferenciada,
    fuenteResolucionOCertificado: row.fuente_resolucion_o_certificado,
    vigenciaInicio: row.vigencia_inicio,
    vigenciaFin: row.vigencia_fin,
  };
}

export function mapEmpresaFormToInsert(payload: EmpresaFormPayload): EmpresaInsert {
  return mapEmpresaFormToDb(payload);
}

export function mapEmpresaFormToUpdate(payload: EmpresaFormPayload): EmpresaUpdate {
  return mapEmpresaFormToDb(payload);
}

function mapEmpresaFormToDb(payload: EmpresaFormPayload): EmpresaInsert {
  const aplicaMutual = payload.aplicaMutual;
  return {
    rut: payload.rut,
    dv: payload.dv,
    razon_social: payload.razonSocial.trim(),
    nombre_fantasia: emptyToNull(payload.nombreFantasia),
    giro: emptyToNull(payload.giro),
    actividad_economica: emptyToNull(payload.actividadEconomica),
    representante_legal_nombre: emptyToNull(payload.representanteLegalNombre),
    representante_legal_rut: emptyToNull(payload.representanteLegalRut),
    representante_legal_dv: emptyToNull(payload.representanteLegalDv),
    representante_legal_email: emptyToNull(payload.representanteLegalEmail),
    representante_legal_telefono: emptyToNull(payload.representanteLegalTelefono),
    email_contacto: emptyToNull(payload.emailContacto),
    telefono_contacto: emptyToNull(payload.telefonoContacto),
    direccion_linea_1: emptyToNull(payload.direccionLinea1),
    direccion_linea_2: emptyToNull(payload.direccionLinea2),
    comuna: emptyToNull(payload.comuna),
    ciudad: emptyToNull(payload.ciudad),
    region: emptyToNull(payload.region),
    codigo_postal: emptyToNull(payload.codigoPostal),
    aplica_ley_16744: aplicaMutual,
    id_organismo_administrador_ley_16744: aplicaMutual ? payload.idOrganismoMutual : null,
    tasa_adicional_diferenciada: aplicaMutual ? payload.tasaAdicionalDiferenciada : null,
    fuente_resolucion_o_certificado: aplicaMutual ? emptyToNull(payload.fuenteResolucionOCertificado) : null,
    vigencia_inicio: aplicaMutual ? payload.vigenciaInicio : null,
    vigencia_fin: aplicaMutual ? payload.vigenciaFin : null,
    updated_at: new Date().toISOString(),
  };
}

type OrganismoMutualRow = {
  id_organismo_administrador_ley_16744: number;
  codigo: string;
  nombre: string;
  tipo: string;
  vigente: boolean;
};

export function mapOrganismoRowToCatalogo(row: OrganismoMutualRow): OrganismoMutualCatalogo {
  return {
    idOrganismoMutual: row.id_organismo_administrador_ley_16744,
    codigo: row.codigo,
    nombre: row.nombre,
    tipo: row.tipo,
    vigente: row.vigente,
  };
}

function emptyToNull(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}
