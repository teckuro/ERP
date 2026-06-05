import {
  ChangeDetectionStrategy,
  Component,
  HostBinding,
  Input,
} from '@angular/core';

export type PageFrameDensity = 'compact' | 'comfortable';
export type PageFrameTone = 'page' | 'workspace' | 'flush';

/**
 * Marco de página unificado del ERP (sistema de diseño NOIA).
 *
 * Encapsula header (eyebrow / title / subtitle / actions), barra de resumen,
 * toolbar, cuerpo y footer mediante content-projection. Define la capa de
 * tokens `--pf-*` en CSS local, mapeada a `--erp-*` / `--bitacora-*` globales.
 *
 * Slots:
 * - `[pageFrameActions]` — botones primario/secundarios del header.
 * - `[pageFrameSummary]` — barra de KPIs / contadores operativos.
 * - `[pageFrameToolbar]` — filtros / búsqueda sobria.
 * - default — cuerpo principal (grid, stepper, lista, etc.).
 * - `[pageFrameFooter]` — barra inferior opcional.
 */
@Component({
  selector: 'app-page-frame',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './page-frame.component.html',
  styleUrls: ['./page-frame.component.css'],
})
export class PageFrameComponent {
  @Input() eyebrow: string | null = null;
  @Input() title: string | null = null;
  @Input() subtitle: string | null = null;

  @Input() density: PageFrameDensity = 'compact';
  @Input() tone: PageFrameTone = 'page';

  @HostBinding('attr.data-density') get densityAttr(): PageFrameDensity {
    return this.density;
  }

  @HostBinding('attr.data-tone') get toneAttr(): PageFrameTone {
    return this.tone;
  }
}
