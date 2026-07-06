import type { MessageBoxSection } from './message-box.types';

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

function compactItems(items: readonly string[]): string[] {
  return items.map((item) => item.trim()).filter(Boolean);
}

function firstText(...values: Array<string | null | undefined>): string {
  return values.map((value) => value?.trim() ?? '').find(Boolean) ?? '';
}

function hasSectionContent(section: MessageBoxSection): boolean {
  return Boolean(section.title?.trim() || section.text?.trim() || section.items?.length);
}
