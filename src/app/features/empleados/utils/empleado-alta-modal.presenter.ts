import type { MessageBoxSection } from '../../../shared/components/ui/message-box.types';
import type {
  ItemCampoModalAccionAvanzada,
  ReglaValidacionEvaluada,
  SeveridadValidacion,
} from '../models/empleado-alta-avanzada.vm';

/** Mensajes de negocio al finalizar o listar bloqueos; no exponer detalle técnico de BD. */
export const MENSAJES_FINALIZAR_ALTA: Partial<Record<string, string>> = {
  'personal.identity':
    'Ingresa un RUT válido o un identificador extranjero válido.',
  'contract.position': 'Ingresa el cargo o función que tendrá el trabajador.',
  'honorarios.service':
    'Ingresa el servicio o función que prestará la persona a honorarios.',
  'honorarios.amount':
    'Ingresa el monto bruto pactado para la boleta de honorarios.',
  'honorarios.currency': 'Selecciona la moneda del monto bruto de honorarios.',
  'contract.branch':
    'Selecciona la sucursal u organización donde prestará servicios.',
  'contract.worker-type':
    'Selecciona el tipo de trabajador que corresponde al contrato.',
  'contract.schedule-type': 'Selecciona el tipo de jornada pactada.',
  'contract.contract-type': 'Selecciona el tipo de contrato laboral.',
  'contract.start-date': 'Ingresa la fecha de ingreso del trabajador.',
  'contract.document-date': 'Ingresa la fecha del contrato.',
  'contract.end-date':
    'Completa la fecha de término cuando el contrato no sea indefinido.',
  'contract.salary': 'Ingresa un sueldo base válido para remuneraciones.',
  'contract.currency': 'Selecciona la moneda de remuneración.',
  'contract.weekly-hours': 'Completa las horas semanales pactadas.',
  'contract.weekly-days': 'Completa los días semanales de trabajo.',
  'prevision.regime': 'Selecciona el régimen previsional del trabajador.',
  'prevision.afp': 'Selecciona la AFP cuando el régimen previsional sea AFP.',
  'prevision.health': 'Selecciona la institución de salud del trabajador.',
  'prevision.health-currency': 'Selecciona la moneda del plan de salud.',
  'prevision.health-plan': 'Ingresa el valor del plan de salud.',
  'prevision.apv-institution':
    'Selecciona la institución APVI o desactiva APVI si no corresponde.',
  'prevision.apv-currency':
    'Selecciona la moneda APVI o desactiva APVI si no corresponde.',
  'prevision.apv-amount':
    'Ingresa el monto APVI o desactiva APVI si no corresponde.',
  'prevision.apv-payment':
    'Selecciona la forma de pago APVI o desactiva APVI si no corresponde.',
  'prevision.apv-agreement':
    'Completa el depósito convenido APVI o desactiva APVI si no corresponde.',
  'prevision.ips-name': 'Ingresa la entidad o ex caja del régimen IPS.',
  'prevision.ips-regime': 'Ingresa el régimen IPS que corresponde.',
  'prevision.ips-rate': 'Ingresa la tasa IPS que corresponde.',
  'prevision.health-ges': 'Ingresa el adicional Auge o GES del plan de salud.',
  'prevision.account2-currency':
    'Completa la moneda de Cuenta 2 AFP o deja Cuenta 2 sin monto.',
  'prevision.account2-value':
    'Completa el valor de Cuenta 2 AFP o deja Cuenta 2 sin monto.',
  'bank.bank': 'Selecciona el banco para el pago por transferencia.',
  'bank.account-type': 'Selecciona el tipo de cuenta bancaria.',
  'bank.account-number':
    'Ingresa una cuenta bancaria real y reemplaza cualquier dato temporal.',
};

/** CTA primaria genérica en modales con pendientes bloqueantes (Siguiente, borrador, finalizar). */
export const ETIQUETA_ACCION_REVISAR_PRIMER_PENDIENTE = 'Revisar primer pendiente';

/** Etiquetas cortas para lista en MsgBox Siguiente (bloqueos). */
export const ETIQUETAS_CAMPO_PENDIENTE_ALTA: Partial<Record<string, string>> = {
  'personal.identity': 'RUT',
  'personal.birthdate': 'Fecha de nacimiento',
  'personal.names': 'Nombres',
  'personal.lastname': 'Apellido paterno',
  'personal.sex': 'Sexo',
  'personal.country': 'Nacionalidad',
  'personal.marital-status': 'Estado civil',
  'personal.email-empty': 'Correo',
  'personal.phone-empty': 'Teléfono',
  'contact.commune': 'Comuna',
  'contract.position': 'Cargo',
  'honorarios.service': 'Servicio o función',
  'honorarios.amount': 'Monto bruto',
  'honorarios.currency': 'Moneda',
  'contract.branch': 'Sucursal',
  'contract.worker-type': 'Tipo de trabajador',
  'contract.schedule-type': 'Tipo de jornada',
  'contract.contract-type': 'Tipo de contrato',
  'contract.start-date': 'Fecha de ingreso',
  'contract.document-date': 'Fecha del contrato',
  'contract.end-date': 'Fecha de término',
  'contract.salary': 'Sueldo base',
  'contract.currency': 'Moneda de remuneración',
  'prevision.regime': 'Régimen previsional',
  'prevision.afp': 'AFP',
  'prevision.health': 'Institución de salud',
  'bank.bank': 'Banco',
  'bank.account-type': 'Tipo de cuenta',
  'bank.account-number': 'Número de cuenta',
};

export function etiquetaCampoPendienteLista(
  item: ItemCampoModalAccionAvanzada,
): string {
  return ETIQUETAS_CAMPO_PENDIENTE_ALTA[item.id] ?? item.fieldLabel;
}

export function etiquetasCampoPendienteDesdeFieldItems(
  items: readonly ItemCampoModalAccionAvanzada[],
): readonly string[] {
  return items.map((item) => etiquetaCampoPendienteLista(item));
}

export function buildNextStepBlockingModalContent(
  stepLabel: string,
  fieldItems: readonly ItemCampoModalAccionAvanzada[],
): {
  title: string;
  message: string;
  sections: readonly MessageBoxSection[];
} {
  const n = fieldItems.length;
  const conteo = `${n} campo${n === 1 ? '' : 's'} obligatorio${n === 1 ? '' : 's'} pendiente${n === 1 ? '' : 's'}`;

  return {
    title: 'Faltan datos obligatorios',
    message: `El registro «${stepLabel}» tiene ${conteo}.\n\nCompleta los campos marcados en rojo para finalizar correctamente el alta del trabajador.`,
    sections: [
      {
        title: 'Campos pendientes',
        items: [...etiquetasCampoPendienteDesdeFieldItems(fieldItems)],
        tone: 'attention',
      },
      {
        text: 'Podrás continuar, pero este registro quedará pendiente hasta que completes los datos obligatorios.',
        tone: 'info',
      },
    ],
  };
}

export interface GrupoCamposModalAlta {
  wizardStep: number;
  stepLabel: string;
  items: readonly ItemCampoModalAccionAvanzada[];
}

export interface BorradorValidacionIssue {
  id: string;
  message: string;
  controlPath: string;
  wizardStep: number;
  sectionTitle: string;
  fieldLabel: string;
}

export function pesoOrdenValidacion(item: ReglaValidacionEvaluada): number {
  if (item.complete) {
    return 30;
  }
  if (item.severity === 'error' && item.blocking) {
    return 0;
  }
  if (item.severity === 'warning') {
    return 10;
  }
  return 20;
}

export function asegurarOracion(text: string): string {
  const clean = text.trim();
  if (!clean) {
    return clean;
  }
  return /[.!?]$/.test(clean) ? clean : `${clean}.`;
}

export function mensajeNegocioRegla(item: ReglaValidacionEvaluada): string {
  const negocio = MENSAJES_FINALIZAR_ALTA[item.id];
  if (negocio) {
    return negocio;
  }
  return asegurarOracion(item.label);
}

export function etiquetaModalValidacion(item: ReglaValidacionEvaluada): string {
  return mensajeNegocioRegla(item);
}

export function sortReglasValidacion(
  items: readonly ReglaValidacionEvaluada[],
): ReglaValidacionEvaluada[] {
  return [...items].sort((a, b) => {
    const byStep = a.wizardStep - b.wizardStep;
    return byStep !== 0 ? byStep : pesoOrdenValidacion(a) - pesoOrdenValidacion(b);
  });
}

export function buildFieldItemsFromRules(
  items: readonly ReglaValidacionEvaluada[],
  options?: {
    stepLabelFor?: (wizardStep: number) => string;
    shortStepLabelFor?: (wizardStep: number) => string;
  },
): readonly ItemCampoModalAccionAvanzada[] {
  const seen = new Set<string>();
  const out: ItemCampoModalAccionAvanzada[] = [];
  const sorted = sortReglasValidacion(items);

  sorted.forEach((item, index) => {
    const key =
      item.id ||
      item.sourcePath ||
      `${item.wizardStep}-${item.sectionTitle}-${item.label}-${index}`;
    if (seen.has(key)) {
      return;
    }
    seen.add(key);
    const stepLabel =
      options?.shortStepLabelFor?.(item.wizardStep) ??
      options?.stepLabelFor?.(item.wizardStep) ??
      `Paso ${item.wizardStep + 1}`;
    out.push({
      id: key,
      sectionTitle: item.sectionTitle || stepLabel,
      fieldLabel: item.label,
      detail: asegurarOracion(item.detail || mensajeNegocioRegla(item)),
      actionLabel: item.actionLabel || 'Ir al campo',
      wizardStep: item.wizardStep,
      controlPath: item.sourcePath,
      severity: item.severity,
    });
  });

  return out;
}

export function buildFieldItemsFromBorradorIssues(
  issues: readonly BorradorValidacionIssue[],
): readonly ItemCampoModalAccionAvanzada[] {
  return issues.map((issue) => ({
    id: issue.id,
    sectionTitle: issue.sectionTitle,
    fieldLabel: issue.fieldLabel,
    detail: asegurarOracion(issue.message),
    actionLabel: 'Ir al campo',
    wizardStep: issue.wizardStep,
    controlPath: issue.controlPath,
    severity: 'error' as SeveridadValidacion,
  }));
}

export function groupFieldItemsByStep(
  items: readonly ItemCampoModalAccionAvanzada[] | null | undefined,
  stepLabelFor: (wizardStep: number) => string,
): readonly GrupoCamposModalAlta[] {
  const grupos = new Map<number, ItemCampoModalAccionAvanzada[]>();
  for (const item of items ?? []) {
    const actuales = grupos.get(item.wizardStep) ?? [];
    actuales.push(item);
    grupos.set(item.wizardStep, actuales);
  }

  return sortFieldGroupsByStep(
    Array.from(grupos.entries()).map(([wizardStep, groupedItems]) => ({
      wizardStep,
      stepLabel: stepLabelFor(wizardStep),
      items: groupedItems,
    })),
  );
}

export function sortFieldGroupsByStep(
  groups: readonly GrupoCamposModalAlta[],
): readonly GrupoCamposModalAlta[] {
  return [...groups].sort((a, b) => a.wizardStep - b.wizardStep);
}

export function primerPasoDesdeFieldItems(
  items: readonly ItemCampoModalAccionAvanzada[] | null | undefined,
  stepLabelFor: (wizardStep: number) => string,
): string {
  const first = items?.[0];
  return first ? stepLabelFor(first.wizardStep) : 'Sin pendientes';
}

export function buildPendientePrincipalDesdeFieldItems(
  items: readonly ItemCampoModalAccionAvanzada[],
  contextLabel?: string,
): string {
  const n = items.length;
  if (n === 0) {
    return contextLabel
      ? `Revisar los datos pendientes del registro «${contextLabel}».`
      : 'Revisar los datos pendientes antes de continuar.';
  }
  const datos = `${n} dato${n === 1 ? '' : 's'} obligatorio${n === 1 ? '' : 's'}`;
  return contextLabel
    ? `Completar ${datos} del registro «${contextLabel}».`
    : `Completar ${datos} en los registros pendientes de la bitácora laboral.`;
}

export function buildModalSectionsBitacora(options: {
  pendientePrincipal: string;
  detailItems?: readonly string[];
  porQueImporta: string;
  accionRecomendada: string;
  pendienteTone?: MessageBoxSection['tone'];
  /** Si hay fieldItems, no duplicar conteo en el texto principal. */
  omitCountInPrincipal?: boolean;
}): readonly MessageBoxSection[] {
  const items = options.detailItems?.filter((item) => item.trim());
  return [
    {
      title: 'Pendiente principal',
      text: options.pendientePrincipal,
      items: items?.length ? [...items] : undefined,
      tone: options.pendienteTone ?? 'attention',
    },
    {
      title: 'Por qué importa',
      text: options.porQueImporta,
      tone: 'neutral',
    },
    {
      title: 'Acción recomendada',
      text: options.accionRecomendada,
      tone: 'info',
    },
  ];
}

/** Etiquetas de negocio para resumen/consola (máx. 10, sin duplicar id). */
export function mensajesNegocioDesdeReglas(
  rules: readonly ReglaValidacionEvaluada[],
  max = 10,
): readonly string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  let sinMensaje = 0;

  for (const item of sortReglasValidacion(rules)) {
    if (!item.visible || item.complete || !item.blocking || item.severity !== 'error') {
      continue;
    }
    const msg = MENSAJES_FINALIZAR_ALTA[item.id];
    if (msg) {
      if (!seen.has(item.id)) {
        seen.add(item.id);
        out.push(msg);
      }
    } else {
      sinMensaje += 1;
    }
    if (out.length >= max) {
      break;
    }
  }

  if (out.length === 0 && sinMensaje > 0) {
    out.push('Revisa las etapas con pendientes o errores antes de finalizar.');
  }

  return out.slice(0, max);
}

export function etiquetasModalValidacionLimitadas(
  items: readonly ReglaValidacionEvaluada[],
  max: number,
): readonly string[] {
  const seen = new Set<string>();
  const out: string[] = [];

  for (const item of items) {
    const text = etiquetaModalValidacion(item);
    if (seen.has(text)) {
      continue;
    }
    seen.add(text);
    out.push(text);
    if (out.length >= max) {
      break;
    }
  }

  const remaining = Math.max(0, items.length - out.length);
  if (remaining > 0) {
    out.push(
      `Además hay ${remaining} dato${remaining === 1 ? '' : 's'} pendiente${remaining === 1 ? '' : 'es'} adicional${remaining === 1 ? '' : 'es'}.`,
    );
  }

  return out;
}
