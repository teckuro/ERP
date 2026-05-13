export type EstadoVigenciaAsignacion =
  | 'ACTIVA'
  | 'FUTURA'
  | 'VENCIDA'
  | 'CERRADA'
  | 'INVALIDA';

export interface RangoVigenciaAsignacion {
  idAsignacion?: number | string | null;
  idPersona: number | string;
  idConcepto: number | string;
  vigenciaInicio: string | Date | null;
  vigenciaFin?: string | Date | null;
  estado?: boolean | string | null;
}

export interface ResultadoValidacionAsignacion {
  valido: boolean;
  estado: EstadoVigenciaAsignacion;
  motivos: string[];
}

export interface SolicitudCierreAsignacion extends RangoVigenciaAsignacion {
  fechaCierre: string | Date | null;
}

export interface ResultadoCierreAsignacion {
  valido: boolean;
  estadoActual: EstadoVigenciaAsignacion;
  motivos: string[];
  vigenciaFinResultante: string | null;
  estadoResultante: boolean;
}

export type EstadoVigenciaFiltro =
  | 'OPERATIVAS'
  | 'TODAS'
  | EstadoVigenciaAsignacion;

type DateRange = {
  inicio: Date | null;
  fin: Date | null;
  fechaInvalida: boolean;
};

function inicioDiaLocal(fecha: Date): Date {
  return new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate(), 0, 0, 0, 0);
}

function fechaCivilIso(fecha: Date): string {
  const y = fecha.getFullYear();
  const m = String(fecha.getMonth() + 1).padStart(2, '0');
  const d = String(fecha.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function parseFechaCivil(value: string | Date | null | undefined): Date | null | 'INVALIDA' {
  if (value == null || value === '') {
    return null;
  }

  if (value instanceof Date) {
    return Number.isFinite(value.getTime()) ? inicioDiaLocal(value) : 'INVALIDA';
  }

  const raw = String(value).trim();
  if (!raw) {
    return null;
  }

  const s = raw.slice(0, 10);
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!match) {
    return 'INVALIDA';
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const parsed = new Date(year, month - 1, day, 0, 0, 0, 0);
  if (
    parsed.getFullYear() !== year ||
    parsed.getMonth() !== month - 1 ||
    parsed.getDate() !== day
  ) {
    return 'INVALIDA';
  }
  return parsed;
}

function normalizarRango(
  asignacion: Pick<RangoVigenciaAsignacion, 'vigenciaInicio' | 'vigenciaFin'>,
): DateRange {
  const inicio = parseFechaCivil(asignacion.vigenciaInicio);
  const fin = parseFechaCivil(asignacion.vigenciaFin);
  return {
    inicio: inicio === 'INVALIDA' ? null : inicio,
    fin: fin === 'INVALIDA' ? null : fin,
    fechaInvalida: inicio === 'INVALIDA' || fin === 'INVALIDA',
  };
}

function estaCerrada(asignacion: Pick<RangoVigenciaAsignacion, 'estado'>): boolean {
  if (asignacion.estado === false) {
    return true;
  }
  if (typeof asignacion.estado === 'string') {
    const estado = asignacion.estado.trim().toUpperCase();
    return ['CERRADA', 'CERRADO', 'INACTIVA', 'INACTIVO', 'DESACTIVADA', 'DESACTIVADO'].includes(
      estado,
    );
  }
  return false;
}

function mismoRegistro(
  a: Pick<RangoVigenciaAsignacion, 'idAsignacion'>,
  b: Pick<RangoVigenciaAsignacion, 'idAsignacion'>,
): boolean {
  if (a.idAsignacion == null || b.idAsignacion == null) {
    return false;
  }
  return String(a.idAsignacion) === String(b.idAsignacion);
}

function mismoTrabajadorConcepto(a: RangoVigenciaAsignacion, b: RangoVigenciaAsignacion): boolean {
  return String(a.idPersona) === String(b.idPersona) && String(a.idConcepto) === String(b.idConcepto);
}

function finComparacion(fin: Date | null): number {
  return fin?.getTime() ?? Number.POSITIVE_INFINITY;
}

function rangosSeSolapan(a: DateRange, b: DateRange): boolean {
  if (!a.inicio || !b.inicio) {
    return false;
  }
  return a.inicio.getTime() <= finComparacion(b.fin) && b.inicio.getTime() <= finComparacion(a.fin);
}

export function etiquetaEstadoVigenciaAsignacion(estado: EstadoVigenciaAsignacion): string {
  switch (estado) {
    case 'ACTIVA':
      return 'Activa';
    case 'FUTURA':
      return 'Futura';
    case 'VENCIDA':
      return 'Vencida';
    case 'CERRADA':
      return 'Cerrada';
    case 'INVALIDA':
      return 'Invalida';
    default:
      return 'Invalida';
  }
}

export function filtrarAsignacionesPorEstadoVigencia<T extends { estadoVigencia: EstadoVigenciaAsignacion }>(
  rows: readonly T[],
  filtro: EstadoVigenciaFiltro,
): T[] {
  if (filtro === 'TODAS') {
    return [...rows];
  }
  if (filtro === 'OPERATIVAS') {
    return rows.filter((row) => row.estadoVigencia === 'ACTIVA' || row.estadoVigencia === 'FUTURA');
  }
  return rows.filter((row) => row.estadoVigencia === filtro);
}

export function clasificarVigenciaAsignacion(
  asignacion: Pick<RangoVigenciaAsignacion, 'vigenciaInicio' | 'vigenciaFin' | 'estado'>,
  fechaReferencia: Date = new Date(),
): EstadoVigenciaAsignacion {
  if (estaCerrada(asignacion)) {
    return 'CERRADA';
  }

  const rango = normalizarRango(asignacion);
  if (rango.fechaInvalida || !rango.inicio) {
    return 'INVALIDA';
  }
  if (rango.fin && rango.fin.getTime() < rango.inicio.getTime()) {
    return 'INVALIDA';
  }

  const ref = inicioDiaLocal(fechaReferencia);
  if (rango.inicio.getTime() > ref.getTime()) {
    return 'FUTURA';
  }
  if (rango.fin && rango.fin.getTime() < ref.getTime()) {
    return 'VENCIDA';
  }
  return 'ACTIVA';
}

export function validarRangoAsignacionRecurrente(
  candidata: RangoVigenciaAsignacion,
  existentes: RangoVigenciaAsignacion[],
  fechaReferencia: Date = new Date(),
): ResultadoValidacionAsignacion {
  const estado = clasificarVigenciaAsignacion(candidata, fechaReferencia);
  const motivos: string[] = [];
  const rangoCandidata = normalizarRango(candidata);

  if (rangoCandidata.fechaInvalida || !rangoCandidata.inicio) {
    motivos.push('Debe informar una fecha de inicio valida para la asignacion recurrente.');
  }
  if (
    rangoCandidata.inicio &&
    rangoCandidata.fin &&
    rangoCandidata.fin.getTime() < rangoCandidata.inicio.getTime()
  ) {
    motivos.push('La fecha de termino no puede ser anterior a la fecha de inicio.');
  }

  if (motivos.length > 0 || estado === 'CERRADA') {
    return { valido: motivos.length === 0, estado, motivos };
  }

  const comparables = existentes.filter(
    (existente) =>
      mismoTrabajadorConcepto(candidata, existente) &&
      !mismoRegistro(candidata, existente) &&
      !estaCerrada(existente),
  );

  const hayDuplicadoActivo = comparables.some(
    (existente) => clasificarVigenciaAsignacion(existente, fechaReferencia) === 'ACTIVA',
  );
  if (estado === 'ACTIVA' && hayDuplicadoActivo) {
    motivos.push('Ya existe una asignacion vigente para este concepto en el trabajador.');
  }

  const haySolapamiento = comparables.some((existente) => {
    const rangoExistente = normalizarRango(existente);
    if (rangoExistente.fechaInvalida || !rangoExistente.inicio) {
      return false;
    }
    if (
      rangoExistente.fin &&
      rangoExistente.fin.getTime() < rangoExistente.inicio.getTime()
    ) {
      return false;
    }
    return rangosSeSolapan(rangoCandidata, rangoExistente);
  });

  if (haySolapamiento && !motivos.includes('Ya existe una asignacion vigente para este concepto en el trabajador.')) {
    motivos.push('El rango de vigencia se superpone con una asignacion existente del mismo concepto.');
  }

  return {
    valido: motivos.length === 0,
    estado,
    motivos,
  };
}

export function validarCierreAsignacion(
  solicitud: SolicitudCierreAsignacion,
  fechaReferencia: Date = new Date(),
): ResultadoCierreAsignacion {
  const estadoActual = clasificarVigenciaAsignacion(solicitud, fechaReferencia);
  const motivos: string[] = [];
  const rango = normalizarRango(solicitud);
  const fechaCierreRaw = parseFechaCivil(solicitud.fechaCierre);
  const fechaCierre = fechaCierreRaw === 'INVALIDA' ? null : fechaCierreRaw;
  const fechaCierreInvalida = fechaCierreRaw === 'INVALIDA';
  const ref = inicioDiaLocal(fechaReferencia);

  if (estadoActual === 'CERRADA') {
    motivos.push('La asignacion ya se encuentra cerrada.');
  }

  if (estadoActual === 'VENCIDA') {
    motivos.push('La asignacion ya se encuentra vencida o cerrada.');
  }

  if (rango.fechaInvalida || !rango.inicio) {
    motivos.push('No se puede cerrar la asignacion porque no tiene fecha de inicio valida.');
  }

  if (rango.inicio && rango.fin && rango.fin.getTime() < rango.inicio.getTime()) {
    motivos.push('No se puede cerrar la asignacion porque su vigencia actual es incoherente.');
  }

  if (fechaCierreInvalida || !fechaCierre) {
    motivos.push('Debe informar una fecha de cierre valida.');
  }

  if (fechaCierre && fechaCierre.getTime() > ref.getTime()) {
    motivos.push('La fecha de cierre no puede ser futura.');
  }

  const cierreAnteriorAInicio =
    !!rango.inicio && !!fechaCierre && fechaCierre.getTime() < rango.inicio.getTime();
  if (cierreAnteriorAInicio && estadoActual !== 'FUTURA') {
    motivos.push('La fecha de cierre no puede ser anterior a la fecha de inicio.');
  }

  if (motivos.length > 0) {
    return {
      valido: false,
      estadoActual,
      motivos,
      vigenciaFinResultante: solicitud.vigenciaFin ? String(solicitud.vigenciaFin).slice(0, 10) : null,
      estadoResultante: false,
    };
  }

  const vigenciaFinResultante = cierreAnteriorAInicio
    ? solicitud.vigenciaFin == null
      ? null
      : String(solicitud.vigenciaFin).slice(0, 10)
    : fechaCivilIso(fechaCierre as Date);

  return {
    valido: true,
    estadoActual,
    motivos,
    vigenciaFinResultante,
    estadoResultante: false,
  };
}
