import type { EvaluacionCompletitudEmpleado } from '../utils/empleado-completitud.rules';

export type EmployeeFichaTabKey =
  | 'general'
  | 'laboral'
  | 'remuneracion'
  | 'prevision'
  | 'pago'
  | 'documentos'
  | 'historial';

export type EmployeeFichaNavStatus = 'listo' | 'pendiente' | 'critico' | 'en-curso';

export type EmployeeFileTabStatus = 'complete' | 'pending' | 'warning' | 'blocking';

export interface EmployeeFichaNavItem {
  key: EmployeeFichaTabKey;
  label: string;
  status: EmployeeFichaNavStatus;
  isActive: boolean;
}

export interface EmployeeFichaIssue {
  blockKey: EmployeeFichaTabKey;
  blockLabel: string;
  message: string;
  severity: 'critico' | 'revision';
}

export const FICHA_BLOQUES_OPERATIVOS: readonly EmployeeFichaTabKey[] = [
  'general',
  'laboral',
  'remuneracion',
  'prevision',
  'pago',
] as const;

export const FICHA_TOTAL_OPERATIVE_BLOCKS = FICHA_BLOQUES_OPERATIVOS.length;

export type FichaShellTone = 'neutral' | 'warning' | 'success' | 'danger';

export interface FichaVisorEstado {
  label: string;
  tone: FichaShellTone;
}

export interface FichaEstadoPanelVm {
  progressPercent: number;
  completedOperativeBlocks: number;
  totalOperativeBlocks: typeof FICHA_TOTAL_OPERATIVE_BLOCKS;
  visorLabel: string;
  shellTone: FichaShellTone;
  remuneracionesLabel: string;
  issues: EmployeeFichaIssue[];
  motivoPrincipal: string;
  showAction: boolean;
  canValidateForPayroll: boolean;
  primaryActionEvaluadaLabel: string;
  actionLabel: string;
  actionHint: string;
}

export const EMPLOYEE_FICHA_TAB_LABELS: Record<EmployeeFichaTabKey, string> = {
  general: 'General',
  laboral: 'Laboral',
  remuneracion: 'Remuneración',
  prevision: 'Previsión y salud',
  pago: 'Pago',
  documentos: 'Documentos',
  historial: 'Historial',
};

export function normalizeFichaMessage(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export function tabFromSectionKey(section: string): EmployeeFichaTabKey {
  const normalized = normalizeFichaMessage(section);

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

export function mapTabStatusToNavStatus(
  tabStatus: EmployeeFileTabStatus,
  isActive: boolean,
): EmployeeFichaNavStatus {
  if (isActive) {
    return 'en-curso';
  }
  switch (tabStatus) {
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

export function navStatusLabel(status: EmployeeFichaNavStatus): string {
  switch (status) {
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

function bloqueoMatchesTab(bloqueo: string, tabKey: EmployeeFichaTabKey): boolean {
  const normalized = normalizeFichaMessage(bloqueo);

  switch (tabKey) {
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
  tabKey: EmployeeFichaTabKey,
): string | null {
  const match = evaluacion.bloqueos.find((bloqueo) => bloqueoMatchesTab(bloqueo, tabKey));
  return match ?? null;
}

export interface BuildFaltantesDedupInput {
  evaluacion: EvaluacionCompletitudEmpleado;
  humanizeBloqueo: (bloqueo: string) => string;
  maxItems?: number;
}

export function buildFaltantesCriticosDedup(input: BuildFaltantesDedupInput): EmployeeFichaIssue[] {
  const { evaluacion, humanizeBloqueo, maxItems = 5 } = input;

  if (evaluacion.bloqueos.length === 0) {
    return [];
  }

  const seen = new Set<string>();
  const issues: EmployeeFichaIssue[] = [];

  for (const section of evaluacion.seccionesPendientes) {
    const blockKey = tabFromSectionKey(section);
    const bloqueo =
      resolveBloqueoForTab(evaluacion, blockKey)
      ?? evaluacion.bloqueos.find((item) => !issues.some((i) => i.message === humanizeBloqueo(item)))
      ?? evaluacion.bloqueos[0];
    const message = humanizeBloqueo(bloqueo);
    const dedupeKey = `${blockKey}|${normalizeFichaMessage(message)}`;

    if (seen.has(dedupeKey)) {
      continue;
    }
    seen.add(dedupeKey);

    issues.push({
      blockKey,
      blockLabel: EMPLOYEE_FICHA_TAB_LABELS[blockKey],
      message,
      severity: blockKey === 'pago' || blockKey === 'remuneracion' || blockKey === 'prevision' ? 'critico' : 'revision',
    });

    if (issues.length >= maxItems) {
      break;
    }
  }

  if (issues.length === 0) {
    for (const bloqueo of evaluacion.bloqueos) {
      const message = humanizeBloqueo(bloqueo);
      const blockKey = inferTabKeyFromBloqueo(bloqueo);
      const dedupeKey = `${blockKey}|${normalizeFichaMessage(message)}`;
      if (seen.has(dedupeKey)) {
        continue;
      }
      seen.add(dedupeKey);
      issues.push({
        blockKey,
        blockLabel: EMPLOYEE_FICHA_TAB_LABELS[blockKey],
        message,
        severity: 'critico',
      });
      if (issues.length >= maxItems) {
        break;
      }
    }
  }

  return issues;
}

function inferTabKeyFromBloqueo(bloqueo: string): EmployeeFichaTabKey {
  const keys: EmployeeFichaTabKey[] = ['pago', 'remuneracion', 'prevision', 'laboral', 'general'];
  for (const key of keys) {
    if (bloqueoMatchesTab(bloqueo, key)) {
      return key;
    }
  }
  return 'general';
}

export interface BuildMotivoPrincipalInput {
  evaluacion: EvaluacionCompletitudEmpleado;
  issues: readonly EmployeeFichaIssue[];
  aptoParaRemuneraciones: boolean;
  estadoFichaValido: boolean;
}

export function buildMotivoPrincipal(input: BuildMotivoPrincipalInput): string {
  const { evaluacion, issues, aptoParaRemuneraciones, estadoFichaValido } = input;

  if (estadoFichaValido && aptoParaRemuneraciones) {
    return 'Ficha apta para procesos de remuneraciones.';
  }

  if (evaluacion.aptoParaRemuneraciones) {
    return 'La ficha no tiene pendientes bloqueantes. Valídela para incluirla en nómina mensual.';
  }

  const pagoIssue = issues.find((issue) => issue.blockKey === 'pago');
  if (pagoIssue) {
    return 'Pago impide incluir al trabajador en nómina mensual.';
  }

  const first = issues[0];
  if (first) {
    return `${first.blockLabel} impide incluir al trabajador en nómina mensual.`;
  }

  if (evaluacion.bloqueos.length > 0) {
    return 'Hay datos pendientes antes de habilitar remuneraciones.';
  }

  return 'Revise los bloques del expediente antes de continuar.';
}

export function resolveAccionPrincipalTab(
  issues: readonly EmployeeFichaIssue[],
  evaluacion: EvaluacionCompletitudEmpleado,
): EmployeeFichaTabKey {
  const pago = issues.find((i) => i.blockKey === 'pago');
  if (pago) {
    return 'pago';
  }

  const firstSection = evaluacion.seccionesPendientes[0];
  if (firstSection) {
    return tabFromSectionKey(firstSection);
  }

  return 'general';
}

export function buildExpedienteNavItems(input: {
  tabs: ReadonlyArray<{ id: EmployeeFichaTabKey; label: string }>;
  activeTab: EmployeeFichaTabKey;
  tabStatus: (tabId: EmployeeFichaTabKey) => EmployeeFileTabStatus;
}): EmployeeFichaNavItem[] {
  return input.tabs.map((tab) => {
    const isActive = tab.id === input.activeTab;
    const status = mapTabStatusToNavStatus(input.tabStatus(tab.id), isActive);
    return {
      key: tab.id,
      label: tab.label,
      status,
      isActive,
    };
  });
}

export interface BuildFichaOperativeProgressInput {
  evaluacion: EvaluacionCompletitudEmpleado;
  pasoAltaAvanzada: number | null;
  estadoFicha: string;
  tabStatus: (tabId: EmployeeFichaTabKey) => EmployeeFileTabStatus;
}

export function buildFichaOperativeProgress(
  input: BuildFichaOperativeProgressInput,
): Pick<FichaEstadoPanelVm, 'progressPercent' | 'completedOperativeBlocks' | 'totalOperativeBlocks'> {
  const totalOperativeBlocks = FICHA_TOTAL_OPERATIVE_BLOCKS;

  if (input.evaluacion.aptoParaRemuneraciones) {
    return {
      progressPercent: 100,
      completedOperativeBlocks: totalOperativeBlocks,
      totalOperativeBlocks,
    };
  }

  const completedOperativeBlocks = FICHA_BLOQUES_OPERATIVOS.filter(
    (tabId) => input.tabStatus(tabId) === 'complete',
  ).length;

  let progressPercent = Math.round((completedOperativeBlocks / totalOperativeBlocks) * 100);

  if (input.pasoAltaAvanzada !== null || input.estadoFicha === 'BORRADOR') {
    progressPercent = Math.max(20, progressPercent);
  }

  return {
    progressPercent,
    completedOperativeBlocks,
    totalOperativeBlocks,
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
  canValidateForPayroll: boolean;
}): string {
  if (input.estadoFicha === 'VALIDO' && input.aptoParaRemuneracionesRegistro) {
    return 'Apta para remuneraciones';
  }

  if (input.canValidateForPayroll) {
    return 'Pendiente de validación';
  }

  return 'No apta para remuneraciones';
}

export function buildCanValidateForPayroll(input: {
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

export function buildPrimaryActionEvaluadaLabel(input: {
  pasoAltaAvanzada: number | null;
  canValidateForPayroll: boolean;
  estadoFicha: string;
  aptoParaRemuneracionesRegistro: boolean;
  estadoLaboral: string;
}): string {
  if (input.pasoAltaAvanzada !== null) {
    return 'Continuar alta';
  }

  if (input.canValidateForPayroll) {
    return 'Validar para remuneraciones';
  }

  if (input.estadoFicha === 'VALIDO' && input.aptoParaRemuneracionesRegistro) {
    return 'Ver datos / Editar ficha';
  }

  return input.estadoLaboral === 'activo' ? 'Revisar pendientes' : 'Completar ficha';
}

export function buildPanelActionLabel(input: {
  issues: readonly EmployeeFichaIssue[];
  evaluacion: EvaluacionCompletitudEmpleado;
  primaryActionEvaluadaLabel: string;
}): string {
  const tab = resolveAccionPrincipalTab(input.issues, input.evaluacion);

  if (tab === 'pago' && input.issues.some((issue) => issue.blockKey === 'pago')) {
    return 'Completar datos de pago';
  }

  return input.primaryActionEvaluadaLabel;
}

export function buildPanelActionHint(actionLabel: string): string {
  if (actionLabel === 'Completar datos de pago') {
    return 'Complete los datos de pago para habilitar la ficha en nómina.';
  }

  return 'Continúe con el bloque que requiere atención.';
}

export function buildPanelActionVisible(input: {
  pasoAltaAvanzada: number | null;
  canValidateForPayroll: boolean;
  bloqueosCount: number;
  estadoLaboral: string;
}): boolean {
  return (
    input.pasoAltaAvanzada !== null
    || input.canValidateForPayroll
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
  tabStatus: (tabId: EmployeeFichaTabKey) => EmployeeFileTabStatus;
  humanizeBloqueo: (bloqueo: string) => string;
}

export function buildFichaEstadoPanelVm(input: BuildFichaEstadoPanelVmInput): FichaEstadoPanelVm {
  const issues = buildFaltantesCriticosDedup({
    evaluacion: input.evaluacion,
    humanizeBloqueo: input.humanizeBloqueo,
  });

  const canValidateForPayroll = buildCanValidateForPayroll({
    evaluacion: input.evaluacion,
    pasoAltaAvanzada: input.pasoAltaAvanzada,
    estadoLaboral: input.estadoLaboral,
    estadoFicha: input.estadoFicha,
    aptoParaRemuneracionesRegistro: input.aptoParaRemuneracionesRegistro,
  });

  const primaryActionEvaluadaLabel = buildPrimaryActionEvaluadaLabel({
    pasoAltaAvanzada: input.pasoAltaAvanzada,
    canValidateForPayroll,
    estadoFicha: input.estadoFicha,
    aptoParaRemuneracionesRegistro: input.aptoParaRemuneracionesRegistro,
    estadoLaboral: input.estadoLaboral,
  });

  const actionLabel = buildPanelActionLabel({
    issues,
    evaluacion: input.evaluacion,
    primaryActionEvaluadaLabel,
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
    tabStatus: input.tabStatus,
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
      canValidateForPayroll,
    }),
    issues,
    motivoPrincipal: buildMotivoPrincipal({
      evaluacion: input.evaluacion,
      issues,
      aptoParaRemuneraciones: input.evaluacion.aptoParaRemuneraciones,
      estadoFichaValido,
    }),
    showAction: buildPanelActionVisible({
      pasoAltaAvanzada: input.pasoAltaAvanzada,
      canValidateForPayroll,
      bloqueosCount: input.evaluacion.bloqueos.length,
      estadoLaboral: input.estadoLaboral,
    }),
    canValidateForPayroll,
    primaryActionEvaluadaLabel,
    actionLabel,
    actionHint: buildPanelActionHint(actionLabel),
  };
}
