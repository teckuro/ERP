import type { MessageBoxAction, MessageBoxSection } from '../../../shared/components/ui/feedback/message-box/message-box.types';
import type {
  ConfirmacionProcesoMensualTipo,
  ConfirmacionProcesoMensualView,
} from '../containers/proceso-mensual-container/models/proceso-mensual-container.vm';

export type MsgboxNoiaPattern =
  | 'loading'
  | 'feedback-simple'
  | 'error-simple'
  | 'decision-compacta'
  | 'decision-guiada'
  | 'diagnostico';

interface SimpleInput {
  detalle?: string | null;
  accion?: string | null;
}

interface DecisionCompactaInput {
  principal: string;
  accion: string;
  items?: readonly string[];
  attention?: boolean;
}

interface DecisionGuiadaInput {
  pendiente: string;
  impacto?: string | null;
  accion: string;
  itemsPendiente?: readonly string[];
  itemsImpacto?: readonly string[];
  attention?: boolean;
}

interface DiagnosticoInput {
  diagnostico: string;
  detalle?: string | null;
  accion?: string | null;
  items?: readonly string[];
}

const TIPOS_ACCION_DESTRUCTIVA = new Set<ConfirmacionProcesoMensualTipo>([
  'abrir_nomina',
  'descartar_nomina',
  'forzar_apertura',
  'forzar_eliminacion',
]);

const TIPOS_DECISION_COMPACTA = new Set<ConfirmacionProcesoMensualTipo>([
  'guardar_preliminar',
  'aprobar_preliminar',
]);

export function buildMsgboxFeedbackSimple(): MessageBoxSection[] {
  return [];
}

export function buildMsgboxErrorSimple(input: SimpleInput): MessageBoxSection[] {
  const text = firstText(input.accion, input.detalle);
  return text ? [{ title: 'Acción recomendada', text, tone: 'attention' }] : [];
}

export function buildMsgboxDecisionCompacta(input: DecisionCompactaInput): MessageBoxSection[] {
  const sections: MessageBoxSection[] = [
    {
      title: 'Principal',
      text: input.principal,
      items: compactItems(input.items ?? []).slice(0, 2),
      tone: input.attention ? 'attention' : 'neutral',
    },
    {
      title: 'Acción',
      text: input.accion,
      tone: 'info',
    },
  ];
  return sections.filter(hasSectionContent);
}

export function buildMsgboxDecisionGuiada(input: DecisionGuiadaInput): MessageBoxSection[] {
  const sections: MessageBoxSection[] = [
    {
      title: 'Pendiente principal',
      text: input.pendiente,
      items: compactItems(input.itemsPendiente ?? []).slice(0, 3),
      tone: input.attention ? 'attention' : 'neutral',
    },
  ];

  const impactoItems = compactItems(input.itemsImpacto ?? []).slice(0, 3);
  if (input.impacto?.trim() || impactoItems.length) {
    sections.push({
      title: 'Impacto operativo',
      text: input.impacto?.trim() ?? '',
      items: impactoItems,
      tone: 'neutral',
    });
  }

  sections.push({
    title: 'Acción recomendada',
    text: input.accion,
    tone: 'info',
  });

  return sections.filter(hasSectionContent).slice(0, 3);
}

export function buildMsgboxDiagnostico(input: DiagnosticoInput): MessageBoxSection[] {
  const sections: MessageBoxSection[] = [
    {
      title: 'Diagnóstico',
      text: input.diagnostico,
      items: compactItems(input.items ?? []).slice(0, 4),
      tone: 'attention',
    },
  ];

  if (input.detalle?.trim()) {
    sections.push({
      title: 'Detalle',
      text: input.detalle.trim(),
      tone: 'neutral',
    });
  }

  if (input.accion?.trim()) {
    sections.push({
      title: 'Acción recomendada',
      text: input.accion.trim(),
      tone: 'info',
    });
  }

  return sections.filter(hasSectionContent).slice(0, 3);
}

export function mapConfirmacionProcesoMensualToSections(
  view: Pick<
    ConfirmacionProcesoMensualView,
    | 'tipo'
    | 'variant'
    | 'mensaje'
    | 'detalle'
    | 'puntos'
    | 'puntosTitulo'
    | 'advertenciasAprobacion'
    | 'secciones'
    | 'proximaAccion'
    | 'mostrarProximaAccion'
    | 'primaryLabel'
  >,
): MessageBoxSection[] {
  const principal = firstText(view.detalle, view.mensaje);
  const impactoItems = compactItems([
    ...(view.puntos ?? []),
    ...(view.advertenciasAprobacion ?? []),
    ...itemsDesdeSecciones(view.secciones ?? []),
  ]);
  const accion = accionRecomendada(view);
  const attention = view.variant === 'warning' || TIPOS_ACCION_DESTRUCTIVA.has(view.tipo);

  if (TIPOS_DECISION_COMPACTA.has(view.tipo)) {
    return buildMsgboxDecisionCompacta({
      principal,
      items: impactoItems,
      accion,
      attention,
    });
  }

  return buildMsgboxDecisionGuiada({
    pendiente: principal || view.mensaje,
    impacto: impactoTexto(view),
    itemsImpacto: impactoItems,
    accion,
    attention,
  });
}

export function buildConfirmacionProcesoMensualActions(
  view: Pick<ConfirmacionProcesoMensualView, 'tipo' | 'primaryLabel' | 'secondaryLabel'>,
): MessageBoxAction[] {
  const actions: MessageBoxAction[] = [];

  if (view.secondaryLabel?.trim()) {
    actions.push({
      label: view.secondaryLabel.trim(),
      value: 'secondary',
      role: 'secondary',
      align: 'left',
    });
  }

  if (view.primaryLabel?.trim()) {
    actions.push({
      label: view.primaryLabel.trim(),
      value: 'primary',
      role: TIPOS_ACCION_DESTRUCTIVA.has(view.tipo) ? 'danger' : 'primary',
      align: 'right',
    });
  }

  return actions;
}

function accionRecomendada(
  view: Pick<ConfirmacionProcesoMensualView, 'mostrarProximaAccion' | 'proximaAccion' | 'primaryLabel'>,
): string {
  if (view.mostrarProximaAccion !== false && view.proximaAccion?.trim()) {
    return view.proximaAccion.trim();
  }
  if (view.primaryLabel?.trim()) {
    return `Continuar con "${view.primaryLabel.trim()}".`;
  }
  return '';
}

function impactoTexto(
  view: Pick<ConfirmacionProcesoMensualView, 'puntosTitulo' | 'tipo' | 'variant'>,
): string {
  if (view.puntosTitulo?.trim()) {
    return view.puntosTitulo.trim();
  }
  if (TIPOS_ACCION_DESTRUCTIVA.has(view.tipo)) {
    return 'La acción modifica el estado operativo del período y queda trazada para auditoría.';
  }
  if (view.variant === 'warning') {
    return 'Revisa el efecto antes de continuar con el cierre del período.';
  }
  return '';
}

function itemsDesdeSecciones(secciones: NonNullable<ConfirmacionProcesoMensualView['secciones']>): string[] {
  return secciones.flatMap((seccion) => {
    const items = compactItems(seccion.items ?? []);
    if (!items.length) {
      return [];
    }
    if (!seccion.titulo?.trim()) {
      return items;
    }
    return items.map((item) => `${seccion.titulo.trim()}: ${item}`);
  });
}

function compactItems(items: readonly string[]): string[] {
  return items.map((item) => item.trim()).filter(Boolean);
}

function firstText(...values: Array<string | null | undefined>): string {
  return values.map((value) => value?.trim() ?? '').find(Boolean) ?? '';
}

function hasSectionContent(section: MessageBoxSection): boolean {
  return Boolean(section.title?.trim() || section.text?.trim() || section.items?.length);
}
