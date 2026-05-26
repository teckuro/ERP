import { parseRut } from '../../empleados/utils/empleado-rut';
import type { EmpresaFormPayload, EmpresaFormValidation } from '../models/empresa.model';

export function validarEmpresaForm(payload: EmpresaFormPayload, rutCompleto: string): EmpresaFormValidation {
  const errores: string[] = [];
  const erroresCampo: EmpresaFormValidation['erroresCampo'] = {};

  const razonSocial = payload.razonSocial?.trim();
  if (!razonSocial) {
    errores.push('Indica la razón social.');
    erroresCampo.razonSocial = 'Requerido';
  }

  try {
    const rut = parseRut(rutCompleto);
    if (rut.rut !== payload.rut || rut.dv !== payload.dv) {
      payload.rut = rut.rut;
      payload.dv = rut.dv;
    }
  } catch {
    errores.push('Revisa el RUT de la empresa.');
    erroresCampo.rutCompleto = 'Formato inválido';
  }

  if (payload.representanteLegalRut?.trim() || payload.representanteLegalDv?.trim()) {
    try {
      parseRut(`${payload.representanteLegalRut}${payload.representanteLegalDv}`);
    } catch {
      errores.push('Revisa el RUT del representante legal.');
      erroresCampo.representanteLegalRut = 'Formato inválido';
    }
  }

  if (payload.aplicaMutual) {
    if (!payload.idOrganismoMutual) {
      errores.push('Selecciona el organismo mutual.');
      erroresCampo.idOrganismoMutual = 'Requerido';
    }
    if (payload.vigenciaInicio && payload.vigenciaFin && payload.vigenciaFin < payload.vigenciaInicio) {
      errores.push('La vigencia de mutual no puede terminar antes de iniciar.');
      erroresCampo.vigenciaFin = 'Revisa fechas';
    }
    if (payload.tasaAdicionalDiferenciada != null && payload.tasaAdicionalDiferenciada < 0) {
      errores.push('La tasa adicional no puede ser negativa.');
      erroresCampo.tasaAdicionalDiferenciada = 'Valor inválido';
    }
  }

  return {
    valido: errores.length === 0,
    errores,
    erroresCampo,
  };
}

export function crearEmpresaFormVacio(): EmpresaFormPayload {
  return {
    rut: '',
    dv: '',
    razonSocial: '',
    nombreFantasia: null,
    giro: null,
    actividadEconomica: null,
    representanteLegalNombre: null,
    representanteLegalRut: null,
    representanteLegalDv: null,
    representanteLegalEmail: null,
    representanteLegalTelefono: null,
    emailContacto: null,
    telefonoContacto: null,
    direccionLinea1: null,
    direccionLinea2: null,
    comuna: null,
    ciudad: null,
    region: null,
    codigoPostal: null,
    aplicaMutual: false,
    idOrganismoMutual: null,
    tasaAdicionalDiferenciada: null,
    fuenteResolucionOCertificado: null,
    vigenciaInicio: null,
    vigenciaFin: null,
  };
}

export function mapDetalleToFormPayload(
  detalle: Omit<import('../models/empresa.model').EmpresaDetalle, 'idEmpresa'>,
): EmpresaFormPayload {
  return {
    rut: detalle.rut,
    dv: detalle.dv,
    razonSocial: detalle.razonSocial,
    nombreFantasia: detalle.nombreFantasia,
    giro: detalle.giro,
    actividadEconomica: detalle.actividadEconomica,
    representanteLegalNombre: detalle.representanteLegalNombre,
    representanteLegalRut: detalle.representanteLegalRut,
    representanteLegalDv: detalle.representanteLegalDv,
    representanteLegalEmail: detalle.representanteLegalEmail,
    representanteLegalTelefono: detalle.representanteLegalTelefono,
    emailContacto: detalle.emailContacto,
    telefonoContacto: detalle.telefonoContacto,
    direccionLinea1: detalle.direccionLinea1,
    direccionLinea2: detalle.direccionLinea2,
    comuna: detalle.comuna,
    ciudad: detalle.ciudad,
    region: detalle.region,
    codigoPostal: detalle.codigoPostal,
    aplicaMutual: detalle.aplicaMutual,
    idOrganismoMutual: detalle.idOrganismoMutual,
    tasaAdicionalDiferenciada: detalle.tasaAdicionalDiferenciada,
    fuenteResolucionOCertificado: detalle.fuenteResolucionOCertificado,
    vigenciaInicio: detalle.vigenciaInicio,
    vigenciaFin: detalle.vigenciaFin,
  };
}
