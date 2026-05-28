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
  readonly selectedExampleId = signal<string>('parametros-reconciliacion');
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
