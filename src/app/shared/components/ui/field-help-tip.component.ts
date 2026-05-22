import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  Input,
  OnDestroy,
  ViewChild,
  inject,
} from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { Asterisk, CircleHelp } from 'lucide-angular/src/icons';
import {
  arrow,
  autoUpdate,
  computePosition,
  flip,
  offset,
  shift,
  type Placement,
  type Side,
} from '@floating-ui/dom';

/** Ancho de la base del triángulo (punta ↔ base). */
const ARROW_WIDTH_PX = 12;
/** Altura del triángulo (cuánto sobresale del popover). */
const ARROW_HEIGHT_PX = 6;
const ARROW_EDGE_PADDING = 8;

@Component({
  selector: 'app-field-help-tip',
  standalone: true,
  imports: [LucideAngularModule],
  template: `
    <button
      #trigger
      type="button"
      class="erp-field-help-tip__trigger"
      [class.erp-field-help-tip__trigger--required]="mode === 'required'"
      [attr.aria-label]="ariaLabel"
      [attr.aria-describedby]="open && positioned ? tipId : null"
      (mouseenter)="show()"
      (mouseleave)="scheduleHide()"
      (focus)="show()"
      (blur)="scheduleHide()"
    >
      @if (mode === 'required') {
        <lucide-icon
          [img]="requiredIcon"
          [size]="iconPx"
          class="erp-field-help-tip__icon erp-field-help-tip__icon--required"
        ></lucide-icon>
      } @else {
        <lucide-icon [img]="helpIcon" [size]="iconPx" class="erp-field-help-tip__icon"></lucide-icon>
      }
    </button>

    @if (open) {
      <div
        #popover
        class="erp-field-help-tip__popover"
        [class.erp-field-help-tip__popover--ready]="positioned"
        [id]="tipId"
        role="tooltip"
        [attr.data-placement]="placement"
      >
        <span class="erp-field-help-tip__text">{{ text }}</span>
        <span #arrowEl class="erp-field-help-tip__arrow" aria-hidden="true"></span>
      </div>
    }
  `,
  styles: [
    `
      :host {
        display: inline-flex;
        flex: 0 0 auto;
        width: auto;
        max-width: none;
        align-items: center;
        align-self: center;
        vertical-align: middle;
        line-height: 0;
      }

      .erp-field-help-tip__trigger {
        display: grid;
        place-items: center;
        box-sizing: border-box;
        width: var(--erp-field-help-tip-hit, 0.875rem);
        height: var(--erp-field-help-tip-hit, 0.875rem);
        margin: 0;
        padding: 0;
        border: 0;
        border-radius: 999px;
        background: transparent;
        color: var(--erp-field-help-tip-muted, #6b7280);
        cursor: help;
        line-height: 0;
      }

      .erp-field-help-tip__trigger:focus-visible {
        outline: none;
        box-shadow: 0 0 0 2px var(--erp-field-help-tip-focus-ring, #eff6ff);
        color: var(--erp-field-help-tip-focus, #2563eb);
      }

      .erp-field-help-tip__trigger--required {
        color: var(--form-error, #dc2626);
        cursor: default;
      }

      .erp-field-help-tip__trigger--required:focus-visible {
        box-shadow: 0 0 0 2px color-mix(in srgb, var(--form-error, #dc2626) 18%, transparent);
        color: var(--form-error, #dc2626);
      }

      .erp-field-help-tip__icon--required svg {
        stroke-width: 2.75;
      }

      .erp-field-help-tip__icon {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: var(--erp-field-help-tip-icon, 0.6875rem);
        height: var(--erp-field-help-tip-icon, 0.6875rem);
        line-height: 0;
      }

      .erp-field-help-tip__icon svg {
        display: block;
        width: var(--erp-field-help-tip-icon, 0.6875rem);
        height: var(--erp-field-help-tip-icon, 0.6875rem);
        margin: 0;
      }

      .erp-field-help-tip__popover {
        --erp-field-help-tip-bg: #ffffff;
        --erp-field-help-tip-border: var(--erp-field-help-tip-border-color, #e5e7eb);
        position: fixed;
        top: 0;
        left: 0;
        z-index: var(--erp-floating-ui-z, var(--nm-floating-ui-z, var(--employee-floating-ui-z, 11060)));
        box-sizing: border-box;
        width: max-content;
        max-width: min(var(--erp-field-help-tip-max-width, 13.5rem), calc(100vw - 1.5rem));
        padding: 0.3125rem 0.4375rem;
        border: 1px solid var(--erp-field-help-tip-border);
        border-radius: 6px;
        background: var(--erp-field-help-tip-bg);
        color: var(--erp-field-help-tip-text, #111827);
        font-family: inherit;
        font-size: var(--erp-text-xs, 0.665rem);
        font-weight: 500;
        line-height: 1.35;
        text-align: left;
        box-shadow: 0 4px 12px rgba(15, 23, 42, 0.1);
        pointer-events: none;
        visibility: hidden;
        opacity: 0;
      }

      .erp-field-help-tip__popover--ready {
        visibility: visible;
        opacity: 1;
      }

      .erp-field-help-tip__text {
        display: block;
      }

      /* Triángulo con borde (como el ejemplo): doble capa ::before / ::after */
      .erp-field-help-tip__arrow {
        position: absolute;
        width: ${ARROW_WIDTH_PX}px;
        height: ${ARROW_HEIGHT_PX}px;
        pointer-events: none;
      }

      .erp-field-help-tip__arrow::before,
      .erp-field-help-tip__arrow::after {
        content: '';
        position: absolute;
        left: 50%;
        width: 0;
        height: 0;
        border-style: solid;
        transform: translateX(-50%);
      }

      /* Tooltip debajo del icono → flecha arriba del cuadro, punta hacia el ? */
      .erp-field-help-tip__popover[data-placement^='bottom'] .erp-field-help-tip__arrow::before {
        top: 0;
        border-left: 6px solid transparent;
        border-right: 6px solid transparent;
        border-bottom: 6px solid var(--erp-field-help-tip-border);
      }

      .erp-field-help-tip__popover[data-placement^='bottom'] .erp-field-help-tip__arrow::after {
        top: 1px;
        border-left: 5px solid transparent;
        border-right: 5px solid transparent;
        border-bottom: 5px solid var(--erp-field-help-tip-bg);
      }

      /* Tooltip arriba del icono → flecha abajo del cuadro, punta hacia el ? */
      .erp-field-help-tip__popover[data-placement^='top'] .erp-field-help-tip__arrow::before {
        bottom: 0;
        border-left: 6px solid transparent;
        border-right: 6px solid transparent;
        border-top: 6px solid var(--erp-field-help-tip-border);
      }

      .erp-field-help-tip__popover[data-placement^='top'] .erp-field-help-tip__arrow::after {
        bottom: 1px;
        border-left: 5px solid transparent;
        border-right: 5px solid transparent;
        border-top: 5px solid var(--erp-field-help-tip-bg);
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FieldHelpTipComponent implements OnDestroy {
  private static nextId = 0;

  private readonly cdr = inject(ChangeDetectorRef);
  private readonly doc = inject(DOCUMENT);
  private readonly host = inject(ElementRef<HTMLElement>);

  @Input({ required: true }) text!: string;
  @Input() ariaLabel = 'Ayuda del campo';
  @Input() preferredPlacement: 'auto' | 'top' | 'bottom' = 'auto';
  @Input() mode: 'help' | 'required' = 'help';

  readonly helpIcon = CircleHelp;
  readonly requiredIcon = Asterisk;
  readonly iconPx = 11;
  readonly tipId = `erp-field-help-tip-${FieldHelpTipComponent.nextId++}`;

  @ViewChild('trigger', { read: ElementRef })
  private triggerRef?: ElementRef<HTMLButtonElement>;

  @ViewChild('popover', { read: ElementRef })
  private popoverRef?: ElementRef<HTMLElement>;

  @ViewChild('arrowEl', { read: ElementRef })
  private arrowRef?: ElementRef<HTMLElement>;

  open = false;
  positioned = false;
  placement: Placement = 'bottom';

  private disposeAutoUpdate?: () => void;
  private hideTimer?: ReturnType<typeof setTimeout>;
  private popoverPortaled = false;

  ngOnDestroy(): void {
    this.detachPositioning();
    this.clearHideTimer();
    this.removePopoverFromBody();
  }

  show(): void {
    this.clearHideTimer();
    if (this.open) {
      return;
    }
    this.open = true;
    this.positioned = false;
    this.cdr.markForCheck();
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (this.open) {
          this.attachPositioning();
        }
      });
    });
  }

  scheduleHide(): void {
    this.clearHideTimer();
    this.hideTimer = setTimeout(() => {
      this.hide();
    }, 80);
  }

  private hide(): void {
    this.open = false;
    this.positioned = false;
    this.detachPositioning();
    this.removePopoverFromBody();
    this.cdr.markForCheck();
  }

  private clearHideTimer(): void {
    if (this.hideTimer) {
      clearTimeout(this.hideTimer);
      this.hideTimer = undefined;
    }
  }

  private attachPositioning(): void {
    const trigger = this.triggerRef?.nativeElement;
    const popover = this.popoverRef?.nativeElement;
    const arrowEl = this.arrowRef?.nativeElement;

    if (!trigger || !popover || !arrowEl || !this.open) {
      return;
    }

    this.portalPopover(popover);
    this.detachPositioning();
    this.disposeAutoUpdate = autoUpdate(trigger, popover, () => {
      void this.updatePosition();
    });
    void this.updatePosition();
  }

  private detachPositioning(): void {
    this.disposeAutoUpdate?.();
    this.disposeAutoUpdate = undefined;
  }

  private portalPopover(popover: HTMLElement): void {
    if (popover.parentElement === this.doc.body) {
      this.popoverPortaled = true;
      return;
    }
    this.doc.body.appendChild(popover);
    this.popoverPortaled = true;
  }

  private removePopoverFromBody(): void {
    const popover = this.popoverRef?.nativeElement;
    if (!popover || !this.popoverPortaled) {
      return;
    }
    if (popover.parentElement === this.doc.body) {
      this.host.nativeElement.appendChild(popover);
    }
    this.popoverPortaled = false;
  }

  private async updatePosition(): Promise<void> {
    const trigger = this.triggerRef?.nativeElement;
    const popover = this.popoverRef?.nativeElement;
    const arrowEl = this.arrowRef?.nativeElement;

    if (!trigger || !popover || !arrowEl || !this.open) {
      return;
    }

    const preferred: Placement[] =
      this.preferredPlacement === 'top'
        ? ['top', 'bottom']
        : this.preferredPlacement === 'bottom'
          ? ['bottom', 'top']
          : ['bottom', 'top'];

    const mainAxisGap = ARROW_HEIGHT_PX + 4;

    const result = await computePosition(trigger, popover, {
      placement: preferred[0],
      strategy: 'fixed',
      middleware: [
        offset(mainAxisGap),
        flip({ fallbackPlacements: preferred, padding: 6 }),
        shift({ padding: 8 }),
        arrow({ element: arrowEl, padding: ARROW_EDGE_PADDING }),
      ],
    });

    const { x, y, placement } = result;
    popover.style.position = 'fixed';
    popover.style.transform = 'none';
    popover.style.left = `${Math.round(x)}px`;
    popover.style.top = `${Math.round(y)}px`;
    popover.style.right = 'auto';
    popover.style.bottom = 'auto';

    this.placement = placement;
    popover.dataset['placement'] = placement;

    this.applyArrowPosition(placement, trigger, popover, arrowEl);

    if (!this.positioned) {
      this.positioned = true;
    }

    this.cdr.markForCheck();
  }

  /** Centra la punta del triángulo sobre el centro del icono ?. */
  private applyArrowPosition(
    placement: Placement,
    trigger: HTMLElement,
    popover: HTMLElement,
    arrowEl: HTMLElement,
  ): void {
    const side = placement.split('-')[0] as Side;
    const staticSide: Record<Side, 'top' | 'right' | 'bottom' | 'left'> = {
      top: 'bottom',
      right: 'left',
      bottom: 'top',
      left: 'right',
    };
    const anchorSide = staticSide[side];
    const half = ARROW_WIDTH_PX / 2;

    const triggerRect = trigger.getBoundingClientRect();
    const popoverRect = popover.getBoundingClientRect();

    let arrowX = triggerRect.left + triggerRect.width / 2 - popoverRect.left - half;
    const maxX = popoverRect.width - ARROW_WIDTH_PX - ARROW_EDGE_PADDING;
    arrowX = Math.max(ARROW_EDGE_PADDING, Math.min(maxX, arrowX));

    for (const edge of ['top', 'right', 'bottom', 'left'] as const) {
      arrowEl.style[edge] = '';
    }

    arrowEl.style.left = `${Math.round(arrowX)}px`;
    /* Solapa 1px el borde del popover para que el triángulo se vea continuo */
    arrowEl.style[anchorSide] = `${-(ARROW_HEIGHT_PX - 1)}px`;
  }
}
