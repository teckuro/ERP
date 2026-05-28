import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';

import { RecordBreadcrumbComponent } from '../../../../shared/components/ui/layout/record-breadcrumb.component';
import { MessageBoxComponent } from '../../../../shared/components/ui/feedback/message-box/message-box.component';
import {
  NOMINA_MSGBOX_LAB_TABS,
  type NominaMsgboxLabExample,
  type NominaMsgboxLabTabId,
  buildNominaMsgboxLabExamples,
} from '../../rules/nomina-msgbox-lab.rules';

/** Mapa de color para el badge de variante en la lista lateral. */
const VARIANT_BADGE: Record<string, { label: string; cls: string }> = {
  decision: { label: 'Decisión',  cls: 'badge--decision'  },
  warning:  { label: 'Aviso',     cls: 'badge--warning'   },
  blocked:  { label: 'Bloqueo',   cls: 'badge--blocked'   },
  loading:  { label: 'Cargando',  cls: 'badge--loading'   },
  info:     { label: 'Info',      cls: 'badge--info'      },
  success:  { label: 'Éxito',     cls: 'badge--success'   },
  danger:   { label: 'Error',     cls: 'badge--danger'    },
};

@Component({
  selector: 'app-nomina-msgbox-lab-container',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RecordBreadcrumbComponent, MessageBoxComponent],
  templateUrl: './nomina-msgbox-lab-container.html',
  styleUrl: './nomina-msgbox-lab-container.css',
})
export class NominaMsgboxLabContainer {
  readonly breadcrumbItems = [
    { label: 'Remuneraciones', route: '/remuneraciones/proceso-mensual' },
    { label: 'Guía MessageBox' },
  ];

  readonly tabs = NOMINA_MSGBOX_LAB_TABS;
  readonly examples = buildNominaMsgboxLabExamples();

  readonly activeTab = signal<NominaMsgboxLabTabId>('referencia');
  readonly selectedExampleId = signal<string>('parametros-carga');
  readonly previewOpen = signal(false);

  readonly filteredExamples = computed(() =>
    this.examples.filter((example) => example.tab === this.activeTab()),
  );

  readonly selectedExample = computed(() =>
    this.examples.find((example) => example.id === this.selectedExampleId()) ?? this.examples[0],
  );

  /** Conteo de ejemplos por tab para mostrar en la etiqueta de la pestaña. */
  tabCount(tabId: NominaMsgboxLabTabId): number {
    return this.examples.filter((e) => e.tab === tabId).length;
  }

  /** Badge visual por variante. */
  variantBadge(variant: string): { label: string; cls: string } {
    return VARIANT_BADGE[variant] ?? { label: variant, cls: 'badge--info' };
  }

  decisionText(example: NominaMsgboxLabExample): string {
    const section = example.sections?.find((item) =>
      item.title === 'Principal' ||
      item.title === 'Decisión requerida' ||
      item.title === 'Pendiente principal' ||
      item.title === 'Diagnóstico',
    );
    return section?.text || example.detail || example.message;
  }

  impactoText(example: NominaMsgboxLabExample): string {
    const section =
      example.sections?.find((item) => item.title === 'Impacto operativo') ??
      example.sections?.find((item) => item.title === 'Detalle') ??
      example.sections?.find((item) => item.title === 'Principal') ??
      example.sections?.find((item) => item.title === 'Diagnóstico');
    if (section?.text) {
      return section.text;
    }
    if (section?.items?.length) {
      return section.items.join(' ');
    }
    return example.descripcion;
  }

  accionPrincipal(example: NominaMsgboxLabExample): string {
    return example.primaryLabel ?? example.actions?.find((action) => action.value === 'primary')?.label ?? 'Aceptar';
  }

  technicalSummary(example: NominaMsgboxLabExample): string {
    const width = example.width ?? 'md';
    const sections = example.sections?.length ?? 0;
    return `${this.patternLabel(example.patron)} · ${this.variantBadge(example.variant).label} · ${width} · ${
      sections ? `${sections} bloques` : 'sin bloques'
    }`;
  }

  patternLabel(pattern: NominaMsgboxLabExample['patron']): string {
    const labels: Record<NominaMsgboxLabExample['patron'], string> = {
      loading: 'Cargando',
      'feedback-simple': 'Feedback simple',
      'error-simple': 'Error simple',
      'decision-compacta': 'Decisión compacta',
      'decision-guiada': 'Decisión guiada',
      diagnostico: 'Diagnóstico',
    };
    return labels[pattern];
  }

  seleccionarTab(tab: NominaMsgboxLabTabId): void {
    this.activeTab.set(tab);
    const first = this.examples.find((example) => example.tab === tab);
    if (first) {
      this.selectedExampleId.set(first.id);
    }
    this.previewOpen.set(false);
  }

  seleccionarEjemplo(example: NominaMsgboxLabExample): void {
    this.selectedExampleId.set(example.id);
    this.previewOpen.set(false);
  }

  abrirPreview(): void {
    this.previewOpen.set(true);
  }

  cerrarPreview(): void {
    this.previewOpen.set(false);
  }

  onPreviewPrimary(): void {
    this.cerrarPreview();
  }

  onPreviewSecondary(): void {
    this.cerrarPreview();
  }

  onPreviewTertiary(): void {
    this.cerrarPreview();
  }
}
