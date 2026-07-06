export interface EmpresaListadoFila {
  idEmpresa: number;
  rut: string;
  dv: string;
  rutFormateado: string;
  razonSocial: string;
  nombreFantasia: string | null;
  comuna: string | null;
  aplicaMutual: boolean;
  organismoMutualNombre: string | null;
}

export interface EmpresaDetalle {
  idEmpresa: number;
  rut: string;
  dv: string;
  razonSocial: string;
  nombreFantasia: string | null;
  giro: string | null;
  actividadEconomica: string | null;
  representanteLegalNombre: string | null;
  representanteLegalRut: string | null;
  representanteLegalDv: string | null;
  representanteLegalEmail: string | null;
  representanteLegalTelefono: string | null;
  emailContacto: string | null;
  telefonoContacto: string | null;
  direccionLinea1: string | null;
  direccionLinea2: string | null;
  comuna: string | null;
  ciudad: string | null;
  region: string | null;
  codigoPostal: string | null;
  aplicaMutual: boolean;
  idOrganismoMutual: number | null;
  tasaAdicionalDiferenciada: number | null;
  fuenteResolucionOCertificado: string | null;
  vigenciaInicio: string | null;
  vigenciaFin: string | null;
}

export type EmpresaFormPayload = Omit<EmpresaDetalle, 'idEmpresa'>;

export interface OrganismoMutualCatalogo {
  idOrganismoMutual: number;
  codigo: string;
  nombre: string;
  tipo: string;
  vigente: boolean;
}

export interface EmpresaFormValidation {
  valido: boolean;
  errores: string[];
  erroresCampo: Partial<Record<keyof EmpresaFormPayload | 'rutCompleto', string>>;
}
