import type { MessageBoxAction, MessageBoxSection } from '../../../shared/components/ui/feedback/message-box/message-box.types';
import {
  buildMsgboxDecisionCompacta,
  buildMsgboxDecisionGuiada,
} from '../../../shared/components/ui/feedback/message-box/message-box.builders';
export {
  buildMsgboxDecisionCompacta,
  buildMsgboxDecisionGuiada,
  buildMsgboxDiagnostico,
  buildMsgboxErrorSimple,
  buildMsgboxFeedbackSimple,
  type MsgboxNoiaPattern,
} from '../../../shared/components/ui/feedback/message-box/message-box.builders';
import type {
  ConfirmacionProcesoMensualTipo,
  ConfirmacionProcesoMensualView,
} from '../containers/proceso-mensual-container/models/proceso-mensual-container.vm';

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
