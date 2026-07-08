import type { Tables } from '../../../core/models/database.types';
import type {
  GuardarLicenciaMedicaInput,
  LicenciaMedica,
  LicenciaMedicaIngresoCorreo,
} from '../models/licencia-medica.model';

export type LicenciaMedicaRow = Tables<'licencia_medica'> & {
  id_empresa?: number | null;
  id_ingreso?: number | null;
  origen?: string | null;
  persona?: {
    rut?: string | null;
    nombres?: string | null;
    apellido_paterno?: string | null;
    apellido_materno?: string | null;
  } | null;
};

export type LicenciaIngresoRow = {
  id_ingreso: number;
  id_empresa: number;
  remitente: string;
  asunto: string | null;
  cuerpo_texto: string | null;
  cuerpo_html: string | null;
  adjuntos: unknown;
  message_id: string | null;
  recibido_en: string;
  id_licencia: number | null;
  estado: string;
  fecha_creacion: string;
};

function nombrePersona(row: LicenciaMedicaRow): string | null {
  const p = row.persona;
  if (!p) {
    return null;
  }
  const partes = [p.nombres, p.apellido_paterno, p.apellido_materno]
    .map((v) => (v ?? '').trim())
    .filter(Boolean);
  return partes.length ? partes.join(' ') : null;
}

export function mapRowToLicenciaMedica(row: LicenciaMedicaRow): LicenciaMedica {
  return {
    idLicencia: row.id_licencia,
    idEmpresa: row.id_empresa ?? null,
    idPersona: row.id_persona ?? null,
    idContrato: row.id_contrato ?? null,
    folio: row.folio ?? null,
    tipo: (row.tipo as LicenciaMedica['tipo']) ?? null,
    fechaInicio: row.fecha_inicio ?? null,
    fechaTermino: row.fecha_termino ?? null,
    dias: row.dias == null ? null : Number(row.dias),
    estado: row.estado,
    montoSubsidio: row.monto_subsidio == null ? null : Number(row.monto_subsidio),
    observacion: row.observacion ?? null,
    origen: (row.origen === 'correo' ? 'correo' : 'manual') as LicenciaMedica['origen'],
    idIngreso: row.id_ingreso ?? null,
    fechaCreacion: row.fecha_creacion,
    nombreTrabajador: nombrePersona(row),
    rutTrabajador: row.persona?.rut ?? null,
  };
}

export function mapRowToLicenciaIngreso(row: LicenciaIngresoRow): LicenciaMedicaIngresoCorreo {
  return {
    idIngreso: row.id_ingreso,
    idEmpresa: row.id_empresa,
    remitente: row.remitente,
    asunto: row.asunto,
    cuerpoTexto: row.cuerpo_texto,
    cuerpoHtml: row.cuerpo_html,
    adjuntos: Array.isArray(row.adjuntos) ? row.adjuntos : [],
    messageId: row.message_id,
    recibidoEn: row.recibido_en,
    idLicencia: row.id_licencia,
    estado: row.estado,
    fechaCreacion: row.fecha_creacion,
  };
}

export function mapGuardarLicenciaToRpc(input: GuardarLicenciaMedicaInput): Record<string, unknown> {
  return {
    p_id_licencia: input.idLicencia ?? null,
    p_id_persona: input.idPersona ?? null,
    p_id_contrato: input.idContrato ?? null,
    p_folio: input.folio ?? null,
    p_tipo: input.tipo ?? null,
    p_fecha_inicio: input.fechaInicio ?? null,
    p_fecha_termino: input.fechaTermino ?? null,
    p_dias: input.dias ?? null,
    p_estado: input.estado ?? null,
    p_monto_subsidio: input.montoSubsidio ?? null,
    p_observacion: input.observacion ?? null,
    p_origen: input.origen ?? 'manual',
    p_id_ingreso: input.idIngreso ?? null,
  };
}
