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
import {
  arrow,
  autoUpdate,
  computePosition,
  flip,
  offset,
  shift,
  type Placement,
} from '@floating-ui/dom';

type Side = 'top' | 'right' | 'bottom' | 'left';

const ARROW_WIDTH_PX = 12;
const ARROW_HEIGHT_PX = 6;
const ARROW_EDGE_PADDING = 8;

/**
 * Tooltip genérico para acciones/botones.
 * - El trigger es el contenido proyectado (no agrega ícono extra).
 * - Se muestra en hover/focus y se posiciona con floating-ui.
 */
@Component({
  selector: 'app-tooltip',
  standalone: true,
  template: `
    <span
      #trigger
      class="erp-tooltip__trigger"
      [attr.aria-describedby]="open && positioned ? tipId : null"
      (mouseenter)="show()"
      (mouseleave)="scheduleHide()"
      (focusin)="showFromFocus()"
      (focusout)="scheduleHideFromFocus()"
    >
      <ng-content />
    </span>

    @if (open) {
      <div
        #popover
        class="erp-tooltip__popover"
        [class.erp-tooltip__popover--ready]="positioned"
        [id]="tipId"
        role="tooltip"
        [attr.data-placement]="placement"
      >
        <span class="erp-tooltip__text">{{ text }}</span>
        <span #arrowEl class="erp-tooltip__arrow" aria-hidden="true"></span>
      </div>
    }
  `,
  styles: [
    `
      :host {
        display: inline-flex;
        width: auto;
        max-width: none;
        vertical-align: middle;
      }

      .erp-tooltip__trigger {
        display: inline-flex;
        align-items: center;
        width: auto;
        max-width: none;
      }

      .erp-tooltip__popover {
        --erp-tooltip-bg: #ffffff;
        --erp-tooltip-border: var(--erp-tooltip-border-color, #e5e7eb);
        position: fixed;
        top: 0;
        left: 0;
        z-index: var(--erp-floating-ui-z, var(--nm-floating-ui-z, var(--employee-floating-ui-z, 11060)));
        box-sizing: border-box;
        width: max-content;
        max-width: min(var(--erp-tooltip-max-width, 16rem), calc(100vw - 1.5rem));
        padding: 0.3125rem 0.4375rem;
        border: 1px solid var(--erp-tooltip-border);
        border-radius: 6px;
        background: var(--erp-tooltip-bg);
        color: var(--erp-tooltip-text, #111827);
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

      .erp-tooltip__popover--ready {
        visibility: visible;
        opacity: 1;
      }

      .erp-tooltip__text {
        display: block;
      }

      .erp-tooltip__arrow {
        position: absolute;
        width: ${ARROW_WIDTH_PX}px;
        height: ${ARROW_HEIGHT_PX}px;
        pointer-events: none;
      }

      .erp-tooltip__arrow::before,
      .erp-tooltip__arrow::after {
        content: '';
        position: absolute;
        left: 50%;
        width: 0;
        height: 0;
        border-style: solid;
        transform: translateX(-50%);
      }

      .erp-tooltip__popover[data-placement^='bottom'] .erp-tooltip__arrow::before {
        top: 0;
        border-left: 6px solid transparent;
        border-right: 6px solid transparent;
        border-bottom: 6px solid var(--erp-tooltip-border);
      }

      .erp-tooltip__popover[data-placement^='bottom'] .erp-tooltip__arrow::after {
        top: 1px;
        border-left: 5px solid transparent;
        border-right: 5px solid transparent;
        border-bottom: 5px solid var(--erp-tooltip-bg);
      }

      .erp-tooltip__popover[data-placement^='top'] .erp-tooltip__arrow::before {
        bottom: 0;
        border-left: 6px solid transparent;
        border-right: 6px solid transparent;
        border-top: 6px solid var(--erp-tooltip-border);
      }

      .erp-tooltip__popover[data-placement^='top'] .erp-tooltip__arrow::after {
        bottom: 1px;
        border-left: 5px solid transparent;
        border-right: 5px solid transparent;
        border-top: 5px solid var(--erp-tooltip-bg);
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TooltipComponent implements OnDestroy {
  private static nextId = 0;

  private readonly cdr = inject(ChangeDetectorRef);
  private readonly doc = inject(DOCUMENT);
  private readonly host = inject(ElementRef<HTMLElement>);

  @Input({ required: true }) text!: string;
  @Input() preferredPlacement: 'auto' | 'top' | 'bottom' = 'auto';

  readonly tipId = `erp-tooltip-${TooltipComponent.nextId++}`;

  @ViewChild('trigger', { read: ElementRef })
  private triggerRef?: ElementRef<HTMLElement>;

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
    this.dispose();
  }

  show(): void {
    this.clearHideTimer();
    if (this.open || !this.text?.trim()) return;
    this.open = true;
    this.positioned = false;
    this.cdr.markForCheck();
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (this.open) {
          void this.setupPositioning();
        }
      });
    });
  }

  showFromFocus(): void {
    this.show();
  }

  scheduleHide(): void {
    this.clearHideTimer();
    this.hideTimer = setTimeout(() => this.hide(), 80);
  }

  scheduleHideFromFocus(): void {
    this.clearHideTimer();
    this.hideTimer = setTimeout(() => this.hide(), 0);
  }

  hide(): void {
    this.clearHideTimer();
    this.open = false;
    this.positioned = false;
    this.disposeAutoUpdate?.();
    this.disposeAutoUpdate = undefined;
    this.removePopoverFromBody();
    this.cdr.markForCheck();
  }

  private clearHideTimer(): void {
    if (this.hideTimer) {
      clearTimeout(this.hideTimer);
      this.hideTimer = undefined;
    }
  }

  private async setupPositioning(): Promise<void> {
    const trigger = this.triggerRef?.nativeElement;
    const popover = this.popoverRef?.nativeElement;
    const arrowEl = this.arrowRef?.nativeElement;
    if (!trigger || !popover || !arrowEl || !this.open) return;

    this.portalPopover(popover);

    const preferred = this.preferredPlacement;
    const placements: Placement[] =
      preferred === 'top'
        ? ['top', 'bottom']
        : preferred === 'bottom'
          ? ['bottom', 'top']
          : ['bottom', 'top'];

    const update = async () => {
      const { x, y, placement, middlewareData } = await computePosition(trigger, popover, {
        placement: placements[0],
        strategy: 'fixed',
        middleware: [
          offset(ARROW_HEIGHT_PX + 4),
          flip({ fallbackPlacements: placements, padding: 6 }),
          shift({ padding: 8 }),
          arrow({ element: arrowEl, padding: ARROW_EDGE_PADDING }),
        ],
      });

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
        this.cdr.markForCheck();
      }
    };

    this.disposeAutoUpdate?.();
    this.disposeAutoUpdate = autoUpdate(trigger, popover, update);
    await update();
  }

  /** Centra la punta del triángulo sobre el centro del trigger. */
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
    arrowEl.style[anchorSide] = `${-(ARROW_HEIGHT_PX - 1)}px`;
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

  private dispose(): void {
    this.clearHideTimer();
    this.disposeAutoUpdate?.();
    this.disposeAutoUpdate = undefined;
    this.removePopoverFromBody();
  }
}

