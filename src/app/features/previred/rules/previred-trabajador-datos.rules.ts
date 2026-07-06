export interface PreviredTrabajadorEnriquecido {
  idPersona: number;
  idContrato: number | null;
  rut: string | null;
  dv: string | null;
  apellidoPaterno: string;
  apellidoMaterno: string;
  nombres: string;
  sexo: 'M' | 'F' | null;
  nacionalidad: 0 | 1;
  regimenPrevisional: 'AFP' | 'INP' | 'IPS' | 'SIP' | 'NINGUNA';
  tipoTrabajador: number;
  tipoJornada: 1 | 2;
  codigoAfp: string;
  saludTipo: 'FONASA' | 'ISAPRE' | null;
  codigoSalud: string;
  seguroCesantia: boolean;
  cargasSimples: number;
  cargasMaternales: number;
  cargasInvalidas: number;
  tramoAsignacionFamiliar: string;
  centroCosto: string | null;
}

export interface PreviredParametrosEmpresa {
  codigoCcaf: string;
  codigoMutual: string;
  tasaExpectativaVida: number | null;
}

export interface PreviredDatosPersonaFactoresRow {
  id_persona: number | null;
  id_contrato: number | null;
  rut: string | null;
  dv: string | null;
  apellido_paterno: string | null;
  apellido_materno: string | null;
  nombres: string | null;
  sexo: string | null;
  id_pais: number | null;
  pais: string | null;
  tipo_prevision: string | null;
  regimen_previsional_nombre: string | null;
  afp_nombre: string | null;
  tipo_jornada_nombre: string | null;
  tipo_trabajador_nombre: string | null;
  salud_tipo: string | null;
  salud_nombre_full: string | null;
  seguro_cesantia: boolean | null;
  cargas: number | null;
}

const MAPEO_AFP_NOMBRE: Readonly<Record<string, string>> = {
  cuprum: '03',
  habitat: '05',
  provida: '08',
  planvital: '29',
  capital: '33',
  modelo: '34',
  uno: '35',
};

const MAPEO_SALUD_NOMBRE: Readonly<Record<string, string>> = {
  banmedica: '01',
  banmédica: '01',
  consalud: '02',
  vidatres: '03',
  'vida tres': '03',
  colmena: '04',
  'cruz blanca': '05',
  fonasa: '07',
  'nueva masvida': '10',
  masvida: '10',
  isalud: '11',
  fundacion: '12',
  'cruz del norte': '25',
  esencial: '28',
};

const MAPEO_CCAF_ERP_PREVIRED: Readonly<Record<string, string>> = {
  LOS_ANDES: '01',
  LA_ARAUCANA: '02',
  LOS_HEROES: '03',
  '18_SEPTIEMBRE': '04',
};

const MAPEO_MUTUAL_ERP_PREVIRED: Readonly<Record<string, string>> = {
  ACHS: '01',
  MUSEG: '02',
  IST: '03',
  ISL: '00',
};

export function mapearCodigoAfpDesdeNombre(nombre: string | null | undefined): string {
  if (!nombre?.trim()) return '00';
  const clave = normalizarClave(nombre);
  for (const [fragmento, codigo] of Object.entries(MAPEO_AFP_NOMBRE)) {
    if (clave.includes(fragmento)) return codigo;
  }
  return '00';
}

export function mapearCodigoSaludDesdeNombre(
  nombre: string | null | undefined,
  saludTipo: 'FONASA' | 'ISAPRE' | null,
): string {
  if (saludTipo === 'FONASA') return '07';
  if (!nombre?.trim()) return '00';
  const clave = normalizarClave(nombre);
  for (const [fragmento, codigo] of Object.entries(MAPEO_SALUD_NOMBRE)) {
    if (clave.includes(fragmento)) return codigo;
  }
  return '00';
}

export function mapearCodigoCcafPrevired(codigoErp: string | null | undefined): string {
  if (!codigoErp?.trim()) return '00';
  return MAPEO_CCAF_ERP_PREVIRED[codigoErp.trim().toUpperCase()] ?? '00';
}

export function mapearCodigoMutualPrevired(codigoErp: string | null | undefined): string {
  if (!codigoErp?.trim()) return '00';
  return MAPEO_MUTUAL_ERP_PREVIRED[codigoErp.trim().toUpperCase()] ?? '00';
}

export function mapearRegimenPrevisional(
  tipoPrevision: string | null | undefined,
  nombreRegimen: string | null | undefined,
): PreviredTrabajadorEnriquecido['regimenPrevisional'] {
  const tipo = (tipoPrevision ?? '').toUpperCase();
  const nombre = normalizarClave(nombreRegimen ?? '');
  if (tipo.includes('AFP') || nombre.includes('afp')) return 'AFP';
  if (nombre.includes('ips') || nombre.includes('inp')) return 'IPS';
  if (tipo.includes('SIP')) return 'SIP';
  if (tipo.includes('NINGUNA') || nombre.includes('sin institucion')) return 'NINGUNA';
  return 'AFP';
}

export function mapearTipoTrabajadorPrevired(
  nombreTipo: string | null | undefined,
): number {
  const clave = normalizarClave(nombreTipo ?? '');
  if (clave.includes('pensionado') && clave.includes('cotiza')) return 1;
  if (clave.includes('pensionado') && clave.includes('no cotiza')) return 2;
  if (clave.includes('mayor') && clave.includes('65')) return 3;
  if (clave.includes('exento')) return 8;
  return 0;
}

export function mapearTipoJornadaPrevired(
  nombreJornada: string | null | undefined,
): 1 | 2 {
  const clave = normalizarClave(nombreJornada ?? '');
  if (clave.includes('parcial') || clave.includes('part')) return 2;
  return 1;
}

export function mapearNacionalidadPrevired(
  idPais: number | null | undefined,
  nombrePais: string | null | undefined,
): 0 | 1 {
  if (idPais === 1) return 0;
  const pais = normalizarClave(nombrePais ?? '');
  if (pais.includes('chile') || pais.includes('chilena')) return 0;
  if (!idPais && !nombrePais) return 0;
  return 1;
}

export function parsearNombreCompletoLiquidacion(nombreCompleto: string): {
  apellidoPaterno: string;
  apellidoMaterno: string;
  nombres: string;
} {
  const partes = nombreCompleto.trim().split(/\s+/).filter(Boolean);
  if (partes.length >= 3) {
    return {
      apellidoPaterno: partes[0],
      apellidoMaterno: partes[1],
      nombres: partes.slice(2).join(' '),
    };
  }
  if (partes.length === 2) {
    return { apellidoPaterno: partes[0], apellidoMaterno: '', nombres: partes[1] };
  }
  const unico = partes[0] ?? '—';
  return { apellidoPaterno: unico, apellidoMaterno: '', nombres: unico };
}

export function mapearFilaPersonaFactores(
  row: PreviredDatosPersonaFactoresRow,
  fallbackNombreCompleto?: string | null,
): PreviredTrabajadorEnriquecido | null {
  if (row.id_persona == null) return null;

  const parsedFallback = fallbackNombreCompleto
    ? parsearNombreCompletoLiquidacion(fallbackNombreCompleto)
    : null;

  const saludTipo =
    row.salud_tipo === 'FONASA'
      ? 'FONASA'
      : row.salud_tipo === 'ISAPRE'
        ? 'ISAPRE'
        : null;

  const sexoRaw = (row.sexo ?? '').trim().toUpperCase();
  const sexo: 'M' | 'F' | null = sexoRaw === 'M' || sexoRaw === 'F' ? sexoRaw : null;

  return {
    idPersona: row.id_persona,
    idContrato: row.id_contrato,
    rut: row.rut,
    dv: row.dv,
    apellidoPaterno: row.apellido_paterno?.trim() || parsedFallback?.apellidoPaterno || '—',
    apellidoMaterno: row.apellido_materno?.trim() || parsedFallback?.apellidoMaterno || '',
    nombres: row.nombres?.trim() || parsedFallback?.nombres || '—',
    sexo,
    nacionalidad: mapearNacionalidadPrevired(row.id_pais, row.pais),
    regimenPrevisional: mapearRegimenPrevisional(row.tipo_prevision, row.regimen_previsional_nombre),
    tipoTrabajador: mapearTipoTrabajadorPrevired(row.tipo_trabajador_nombre),
    tipoJornada: mapearTipoJornadaPrevired(row.tipo_jornada_nombre),
    codigoAfp: mapearCodigoAfpDesdeNombre(row.afp_nombre),
    saludTipo,
    codigoSalud: mapearCodigoSaludDesdeNombre(row.salud_nombre_full, saludTipo),
    seguroCesantia: row.seguro_cesantia === true,
    cargasSimples: Math.min(13, Math.max(0, Number(row.cargas ?? 0))),
    cargasMaternales: 0,
    cargasInvalidas: 0,
    tramoAsignacionFamiliar: 'D',
    centroCosto: null,
  };
}

function normalizarClave(valor: string): string {
  return valor
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export function claveTrabajadorPrevired(idPersona: number, idContrato: number | null): string {
  return `${idPersona}:${idContrato ?? 'null'}`;
}
