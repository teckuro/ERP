import type { EvaluacionCompletitudEmpleado } from '../utils/empleado-completitud.rules';

export type ClaveTabFichaEmpleado =
  | 'general'
  | 'laboral'
  | 'remuneracion'
  | 'prevision'
  | 'pago'
  | 'documentos'
  | 'historial';

export type EstadoNavegacionFichaEmpleado = 'listo' | 'pendiente' | 'critico' | 'en-curso';

export type EstadoTabFichaEmpleado = 'complete' | 'pending' | 'warning' | 'blocking';

export interface ItemNavegacionFichaEmpleado {
  clave: ClaveTabFichaEmpleado;
  etiqueta: string;
  estado: EstadoNavegacionFichaEmpleado;
  estaActivo: boolean;
}

export interface FaltanteFichaEmpleado {
  claveBloque: ClaveTabFichaEmpleado;
  etiquetaBloque: string;
  mensaje: string;
  severidad: 'critico' | 'revision';
}

export const FICHA_BLOQUES_OPERATIVOS: readonly ClaveTabFichaEmpleado[] = [
  'general',
  'laboral',
  'remuneracion',
  'prevision',
  'pago',
] as const;

export const TOTAL_BLOQUES_OPERATIVOS_FICHA = FICHA_BLOQUES_OPERATIVOS.length;

export type FichaShellTone = 'neutral' | 'warning' | 'success' | 'danger';

export interface FichaVisorEstado {
  label: string;
  tone: FichaShellTone;
}

export interface FichaEstadoPanelVm {
  porcentajeAvance: number;
  bloquesOperativosCompletos: number;
  totalBloquesOperativos: typeof TOTAL_BLOQUES_OPERATIVOS_FICHA;
  visorLabel: string;
  shellTone: FichaShellTone;
  remuneracionesLabel: string;
  faltantes: FaltanteFichaEmpleado[];
  motivoPrincipal: string;
  mostrarAccion: boolean;
  puedeValidarRemuneraciones: boolean;
  etiquetaAccionPrincipalEvaluada: string;
  etiquetaAccion: string;
  ayudaAccion: string;
}

export const ETIQUETAS_TAB_FICHA_EMPLEADO: Record<ClaveTabFichaEmpleado, string> = {
  general: 'General',
  laboral: 'Laboral',
  remuneracion: 'Remuneración',
  prevision: 'Previsión y salud',
  pago: 'Pago',
  documentos: 'Documentos',
  historial: 'Historial',
};

export function normalizarMensajeFicha(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export function tabDesdeSeccion(section: string): ClaveTabFichaEmpleado {
  const normalized = normalizarMensajeFicha(section);

  if (normalized.includes('identidad') || normalized.includes('alta basica')) {
    return 'general';
  }
  if (normalized.includes('contrato') || normalized.includes('jornada') || normalized.includes('estado')) {
    return 'laboral';
  }
  if (normalized.includes('remuneracion')) {
    return 'remuneracion';
  }
  if (normalized.includes('prevision') || normalized.includes('salud') || normalized.includes('apvi')) {
    return 'prevision';
  }
  if (normalized.includes('pago')) {
    return 'pago';
  }

  return 'general';
}

export function mapearEstadoTabAEstadoNavegacion(
  estadoTab: EstadoTabFichaEmpleado,
  estaActivo: boolean,
): EstadoNavegacionFichaEmpleado {
  if (estaActivo) {
    return 'en-curso';
  }
  switch (estadoTab) {
    case 'complete':
      return 'listo';
    case 'blocking':
      return 'critico';
    case 'warning':
    case 'pending':
    default:
      return 'pendiente';
  }
}

export function etiquetaEstadoNavegacion(estado: EstadoNavegacionFichaEmpleado): string {
  switch (estado) {
    case 'listo':
      return 'Listo';
    case 'critico':
      return 'Crítico';
    case 'en-curso':
      return 'En curso';
    case 'pendiente':
    default:
      return 'Pendiente';
  }
}

function bloqueoCorrespondeATab(bloqueo: string, claveTab: ClaveTabFichaEmpleado): boolean {
  const normalized = normalizarMensajeFicha(bloqueo);

  switch (claveTab) {
    case 'general':
      return (
        normalized.includes('rut')
        || normalized.includes('nombres')
        || normalized.includes('apellido')
        || normalized.includes('pais')
        || normalized.includes('identidad')
        || normalized.includes('alta basica')
      );
    case 'laboral':
      return (
        normalized.includes('contrato')
        || normalized.includes('fecha de ingreso')
        || normalized.includes('cargo')
        || normalized.includes('jornada')
        || normalized.includes('trabajador')
        || normalized.includes('estado')
      );
    case 'remuneracion':
      return normalized.includes('remuneracion') || normalized.includes('sueldo');
    case 'prevision':
      return (
        normalized.includes('previsional')
        || normalized.includes('prevision')
        || normalized.includes('afp')
        || normalized.includes('salud')
        || normalized.includes('regimen')
        || normalized.includes('apvi')
        || normalized.includes('institucion de salud')
      );
    case 'pago':
      return (
        normalized.includes('banco')
        || normalized.includes('cuenta')
        || normalized.includes('draft')
        || normalized.includes('temporal')
        || normalized.includes('pago')
      );
    default:
      return false;
  }
}

export function resolveBloqueoForTab(
  evaluacion: EvaluacionCompletitudEmpleado,
  claveTab: ClaveTabFichaEmpleado,
): string | null {
  const match = evaluacion.bloqueos.find((bloqueo) => bloqueoCorrespondeATab(bloqueo, claveTab));
  return match ?? null;
}

export interface BuildFaltantesDedupInput {
  evaluacion: EvaluacionCompletitudEmpleado;
  humanizeBloqueo: (bloqueo: string) => string;
  maximoElementos?: number;
}

export function buildFaltantesCriticosDedup(input: BuildFaltantesDedupInput): FaltanteFichaEmpleado[] {
  const { evaluacion, humanizeBloqueo, maximoElementos = 5 } = input;

  if (evaluacion.bloqueos.length === 0) {
    return [];
  }

  const seen = new Set<string>();
  const faltantes: FaltanteFichaEmpleado[] = [];

  for (const section of evaluacion.seccionesPendientes) {
    const claveBloque = tabDesdeSeccion(section);
    const bloqueo =
      resolveBloqueoForTab(evaluacion, claveBloque)
      ?? evaluacion.bloqueos.find((item) => !faltantes.some((i) => i.mensaje === humanizeBloqueo(item)))
      ?? evaluacion.bloqueos[0];
    const mensaje = humanizeBloqueo(bloqueo);
    const dedupeKey = `${claveBloque}|${normalizarMensajeFicha(mensaje)}`;

    if (seen.has(dedupeKey)) {
      continue;
    }
    seen.add(dedupeKey);

    faltantes.push({
      claveBloque,
      etiquetaBloque: ETIQUETAS_TAB_FICHA_EMPLEADO[claveBloque],
      mensaje,
      severidad: claveBloque === 'pago' || claveBloque === 'remuneracion' || claveBloque === 'prevision' ? 'critico' : 'revision',
    });

    if (faltantes.length >= maximoElementos) {
      break;
    }
  }

  if (faltantes.length === 0) {
    for (const bloqueo of evaluacion.bloqueos) {
      const mensaje = humanizeBloqueo(bloqueo);
      const claveBloque = inferirTabDesdeBloqueo(bloqueo);
      const dedupeKey = `${claveBloque}|${normalizarMensajeFicha(mensaje)}`;
      if (seen.has(dedupeKey)) {
        continue;
      }
      seen.add(dedupeKey);
      faltantes.push({
        claveBloque,
        etiquetaBloque: ETIQUETAS_TAB_FICHA_EMPLEADO[claveBloque],
        mensaje,
        severidad: 'critico',
      });
      if (faltantes.length >= maximoElementos) {
        break;
      }
    }
  }

  return faltantes;
}

function inferirTabDesdeBloqueo(bloqueo: string): ClaveTabFichaEmpleado {
  const keys: ClaveTabFichaEmpleado[] = ['pago', 'remuneracion', 'prevision', 'laboral', 'general'];
  for (const key of keys) {
    if (bloqueoCorrespondeATab(bloqueo, key)) {
      return key;
    }
  }
  return 'general';
}

export interface BuildMotivoPrincipalInput {
  evaluacion: EvaluacionCompletitudEmpleado;
  faltantes: readonly FaltanteFichaEmpleado[];
  aptoParaRemuneraciones: boolean;
  estadoFichaValido: boolean;
}

export function buildMotivoPrincipal(input: BuildMotivoPrincipalInput): string {
  const { evaluacion, faltantes, aptoParaRemuneraciones, estadoFichaValido } = input;

  if (estadoFichaValido && aptoParaRemuneraciones) {
    return 'Ficha apta para procesos de remuneraciones.';
  }

  if (evaluacion.aptoParaRemuneraciones) {
    return 'La ficha no tiene pendientes bloqueantes. Valídela para incluirla en nómina mensual.';
  }

  const faltantePago = faltantes.find((issue) => issue.claveBloque === 'pago');
  if (faltantePago) {
    return 'Pago impide incluir al trabajador en nómina mensual.';
  }

  const first = faltantes[0];
  if (first) {
    return `${first.etiquetaBloque} impide incluir al trabajador en nómina mensual.`;
  }

  if (evaluacion.bloqueos.length > 0) {
    return 'Hay datos pendientes antes de habilitar remuneraciones.';
  }

  return 'Revise los bloques del expediente antes de continuar.';
}

export function resolveAccionPrincipalTab(
  faltantes: readonly FaltanteFichaEmpleado[],
  evaluacion: EvaluacionCompletitudEmpleado,
): ClaveTabFichaEmpleado {
  const pago = faltantes.find((i) => i.claveBloque === 'pago');
  if (pago) {
    return 'pago';
  }

  const primeraSeccion = evaluacion.seccionesPendientes[0];
  if (primeraSeccion) {
    return tabDesdeSeccion(primeraSeccion);
  }

  return 'general';
}

export function buildExpedienteNavItems(input: {
  tabs: ReadonlyArray<{ id: ClaveTabFichaEmpleado; label: string }>;
  tabActivo: ClaveTabFichaEmpleado;
  estadoTab: (idTab: ClaveTabFichaEmpleado) => EstadoTabFichaEmpleado;
}): ItemNavegacionFichaEmpleado[] {
  return input.tabs.map((tab) => {
    const estaActivo = tab.id === input.tabActivo;
    const estado = mapearEstadoTabAEstadoNavegacion(input.estadoTab(tab.id), estaActivo);
    return {
      clave: tab.id,
      etiqueta: tab.label,
      estado,
      estaActivo,
    };
  });
}

export interface BuildFichaOperativeProgressInput {
  evaluacion: EvaluacionCompletitudEmpleado;
  pasoAltaAvanzada: number | null;
  estadoFicha: string;
  estadoTab: (idTab: ClaveTabFichaEmpleado) => EstadoTabFichaEmpleado;
}

export function buildFichaOperativeProgress(
  input: BuildFichaOperativeProgressInput,
): Pick<FichaEstadoPanelVm, 'porcentajeAvance' | 'bloquesOperativosCompletos' | 'totalBloquesOperativos'> {
  const totalBloquesOperativos = TOTAL_BLOQUES_OPERATIVOS_FICHA;

  if (input.evaluacion.aptoParaRemuneraciones) {
    return {
      porcentajeAvance: 100,
      bloquesOperativosCompletos: totalBloquesOperativos,
      totalBloquesOperativos,
    };
  }

  const bloquesOperativosCompletos = FICHA_BLOQUES_OPERATIVOS.filter(
    (idTab) => input.estadoTab(idTab) === 'complete',
  ).length;

  let porcentajeAvance = Math.round((bloquesOperativosCompletos / totalBloquesOperativos) * 100);

  if (input.pasoAltaAvanzada !== null || input.estadoFicha === 'BORRADOR') {
    porcentajeAvance = Math.max(20, porcentajeAvance);
  }

  return {
    porcentajeAvance,
    bloquesOperativosCompletos,
    totalBloquesOperativos,
  };
}

export interface BuildVisorEstadoFichaInput {
  evaluacion: EvaluacionCompletitudEmpleado;
  pasoAltaAvanzada: number | null;
  estadoFicha: string;
  estadoLaboral: string;
  aptoParaRemuneracionesRegistro: boolean;
}

export function buildVisorEstadoFicha(input: BuildVisorEstadoFichaInput): FichaVisorEstado {
  if (input.estadoLaboral === 'bloqueado') {
    return { label: 'Bloqueado', tone: 'danger' };
  }

  if (input.estadoLaboral === 'desvinculado') {
    return { label: 'Desvinculado', tone: 'danger' };
  }

  if (input.pasoAltaAvanzada !== null || input.estadoFicha === 'BORRADOR') {
    return { label: 'En proceso', tone: 'warning' };
  }

  if (input.estadoFicha === 'VALIDO' && input.aptoParaRemuneracionesRegistro) {
    return { label: 'Listo', tone: 'success' };
  }

  if (input.evaluacion.bloqueos.length > 0) {
    return { label: 'En curso', tone: 'warning' };
  }

  if (input.estadoLaboral === 'en_proceso') {
    return { label: 'En proceso', tone: 'warning' };
  }

  if (input.estadoLaboral === 'activo') {
    return { label: 'Con pendientes', tone: 'warning' };
  }

  return { label: 'En proceso', tone: 'warning' };
}

export function buildRemuneracionesPanelLabel(input: {
  estadoFicha: string;
  aptoParaRemuneracionesRegistro: boolean;
  puedeValidarRemuneraciones: boolean;
}): string {
  if (input.estadoFicha === 'VALIDO' && input.aptoParaRemuneracionesRegistro) {
    return 'Apta para remuneraciones';
  }

  if (input.puedeValidarRemuneraciones) {
    return 'Pendiente de validación';
  }

  return 'No apta para remuneraciones';
}

export function construirPuedeValidarRemuneraciones(input: {
  evaluacion: EvaluacionCompletitudEmpleado;
  pasoAltaAvanzada: number | null;
  estadoLaboral: string;
  estadoFicha: string;
  aptoParaRemuneracionesRegistro: boolean;
}): boolean {
  return (
    input.pasoAltaAvanzada === null
    && input.estadoLaboral !== 'borrador'
    && input.estadoFicha !== 'BORRADOR'
    && (input.estadoFicha !== 'VALIDO' || !input.aptoParaRemuneracionesRegistro)
    && (input.estadoLaboral === 'en_proceso' || input.estadoLaboral === 'activo')
    && input.evaluacion.bloqueos.length === 0
    && input.evaluacion.defaultsTecnicosDetectados.length === 0
    && input.evaluacion.seccionesPendientes.length === 0
  );
}

export function construirEtiquetaAccionPrincipalEvaluada(input: {
  pasoAltaAvanzada: number | null;
  puedeValidarRemuneraciones: boolean;
  estadoFicha: string;
  aptoParaRemuneracionesRegistro: boolean;
  estadoLaboral: string;
}): string {
  if (input.pasoAltaAvanzada !== null) {
    return 'Continuar alta';
  }

  if (input.puedeValidarRemuneraciones) {
    return 'Validar para remuneraciones';
  }

  if (input.estadoFicha === 'VALIDO' && input.aptoParaRemuneracionesRegistro) {
    return 'Ver datos / Editar ficha';
  }

  return input.estadoLaboral === 'activo' ? 'Revisar pendientes' : 'Completar ficha';
}

export function construirEtiquetaAccionPanel(input: {
  faltantes: readonly FaltanteFichaEmpleado[];
  evaluacion: EvaluacionCompletitudEmpleado;
  etiquetaAccionPrincipalEvaluada: string;
}): string {
  const tab = resolveAccionPrincipalTab(input.faltantes, input.evaluacion);

  if (tab === 'pago' && input.faltantes.some((issue) => issue.claveBloque === 'pago')) {
    return 'Completar datos de pago';
  }

  return input.etiquetaAccionPrincipalEvaluada;
}

export function construirAyudaAccionPanel(etiquetaAccion: string): string {
  if (etiquetaAccion === 'Completar datos de pago') {
    return 'Complete los datos de pago para habilitar la ficha en nómina.';
  }

  return 'Continúe con el bloque que requiere atención.';
}

export function construirVisibilidadAccionPanel(input: {
  pasoAltaAvanzada: number | null;
  puedeValidarRemuneraciones: boolean;
  bloqueosCount: number;
  estadoLaboral: string;
}): boolean {
  return (
    input.pasoAltaAvanzada !== null
    || input.puedeValidarRemuneraciones
    || input.bloqueosCount > 0
    || input.estadoLaboral === 'activo'
  );
}

export interface BuildFichaEstadoPanelVmInput {
  evaluacion: EvaluacionCompletitudEmpleado;
  pasoAltaAvanzada: number | null;
  estadoFicha: string;
  estadoLaboral: string;
  aptoParaRemuneracionesRegistro: boolean;
  estadoTab: (idTab: ClaveTabFichaEmpleado) => EstadoTabFichaEmpleado;
  humanizeBloqueo: (bloqueo: string) => string;
}

export function buildFichaEstadoPanelVm(input: BuildFichaEstadoPanelVmInput): FichaEstadoPanelVm {
  const faltantes = buildFaltantesCriticosDedup({
    evaluacion: input.evaluacion,
    humanizeBloqueo: input.humanizeBloqueo,
  });

  const puedeValidarRemuneraciones = construirPuedeValidarRemuneraciones({
    evaluacion: input.evaluacion,
    pasoAltaAvanzada: input.pasoAltaAvanzada,
    estadoLaboral: input.estadoLaboral,
    estadoFicha: input.estadoFicha,
    aptoParaRemuneracionesRegistro: input.aptoParaRemuneracionesRegistro,
  });

  const etiquetaAccionPrincipalEvaluada = construirEtiquetaAccionPrincipalEvaluada({
    pasoAltaAvanzada: input.pasoAltaAvanzada,
    puedeValidarRemuneraciones,
    estadoFicha: input.estadoFicha,
    aptoParaRemuneracionesRegistro: input.aptoParaRemuneracionesRegistro,
    estadoLaboral: input.estadoLaboral,
  });

  const etiquetaAccion = construirEtiquetaAccionPanel({
    faltantes,
    evaluacion: input.evaluacion,
    etiquetaAccionPrincipalEvaluada,
  });

  const visor = buildVisorEstadoFicha({
    evaluacion: input.evaluacion,
    pasoAltaAvanzada: input.pasoAltaAvanzada,
    estadoFicha: input.estadoFicha,
    estadoLaboral: input.estadoLaboral,
    aptoParaRemuneracionesRegistro: input.aptoParaRemuneracionesRegistro,
  });

  const progress = buildFichaOperativeProgress({
    evaluacion: input.evaluacion,
    pasoAltaAvanzada: input.pasoAltaAvanzada,
    estadoFicha: input.estadoFicha,
    estadoTab: input.estadoTab,
  });

  const estadoFichaValido =
    input.estadoFicha === 'VALIDO' && input.aptoParaRemuneracionesRegistro;

  return {
    ...progress,
    visorLabel: visor.label,
    shellTone: visor.tone,
    remuneracionesLabel: buildRemuneracionesPanelLabel({
      estadoFicha: input.estadoFicha,
      aptoParaRemuneracionesRegistro: input.aptoParaRemuneracionesRegistro,
      puedeValidarRemuneraciones,
    }),
    faltantes,
    motivoPrincipal: buildMotivoPrincipal({
      evaluacion: input.evaluacion,
      faltantes,
      aptoParaRemuneraciones: input.evaluacion.aptoParaRemuneraciones,
      estadoFichaValido,
    }),
    mostrarAccion: construirVisibilidadAccionPanel({
      pasoAltaAvanzada: input.pasoAltaAvanzada,
      puedeValidarRemuneraciones,
      bloqueosCount: input.evaluacion.bloqueos.length,
      estadoLaboral: input.estadoLaboral,
    }),
    puedeValidarRemuneraciones,
    etiquetaAccionPrincipalEvaluada,
    etiquetaAccion,
    ayudaAccion: construirAyudaAccionPanel(etiquetaAccion),
  };
}
