import { DOCUMENT, NgClass } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  HostBinding,
  HostListener,
  Input,
  OnDestroy,
  Output,
  QueryList,
  ViewChild,
  ViewChildren,
  inject,
} from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import {
  LoaderCircle,
  X as XIcon,
  Info as InfoIcon,
  CheckCircle as CheckCircleIcon,
  AlertTriangle as AlertTriangleIcon,
  AlertCircle as AlertCircleIcon,
  HelpCircle as HelpCircleIcon,
  Lock as LockIcon,
} from 'lucide-angular/src/icons';

import type {
  MessageBoxAction,
  MessageBoxMode,
  MessageBoxResolvedVariant,
  MessageBoxSection,
  MessageBoxSectionTone,
  MessageBoxVariant,
  MessageBoxVariantInput,
  MessageBoxWidth,
} from './message-box.types';

export type {
  MessageBoxAction,
  MessageBoxConfig,
  MessageBoxMode,
  MessageBoxSection,
  MessageBoxSectionTone,
  MessageBoxVariant,
  MessageBoxVariantInput,
  MessageBoxWidth,
} from './message-box.types';

const DEFAULT_EYEBROW: Record<MessageBoxResolvedVariant, string> = {
  info: 'Información',
  success: 'Registro actualizado',
  warning: 'Revisión administrativa',
  danger: 'Error de guardado',
  decision: 'Decisión requerida',
  blocked: 'Bloqueo operativo',
  loading: 'Procesando',
};

interface NormalizedMessageBoxSection {
  title: string;
  text: string;
  items: string[];
  tone: MessageBoxSectionTone;
}

@Component({
  selector: 'app-message-box',
  standalone: true,
  imports: [LucideAngularModule, NgClass],
  templateUrl: './message-box.component.html',
  styleUrl: './message-box.component.css',
})
export class MessageBoxComponent implements AfterViewInit, OnDestroy {
  private static nextId = 0;

  private readonly doc = inject(DOCUMENT);

  readonly instanceId = MessageBoxComponent.nextId++;
  readonly titleId = `erp-message-box-title-${this.instanceId}`;
  readonly messageId = `erp-message-box-message-${this.instanceId}`;
  readonly closeIcon = XIcon;
  readonly loadingIcon = LoaderCircle;

  private triggerElement: HTMLElement | null = null;

  @Input() variant: MessageBoxVariantInput = 'info';
  @Input() mode: MessageBoxMode = 'inline';
  @Input() eyebrow = '';
  /** @deprecated Usar `eyebrow`. */
  @Input() category = '';
  @Input() title = '';
  @Input() message = '';
  @Input() detail = '';
  @Input() sections: readonly MessageBoxSection[] = [];
  @Input() actions: MessageBoxAction[] = [];
  @Input() width: MessageBoxWidth = 'md';
  @Input() disableClose = false;
  @Input() initialFocus: 'primary' | 'secondary' | 'close' = 'primary';

  @Input() actionLabel = '';
  @Input() primaryLabel = '';
  @Input() secondaryLabel = '';
  @Input() tertiaryLabel = '';
  @Input() fourthLabel = '';
  @Input() dismissible = false;
  @Input() dismissLabel = 'Cerrar';
  /** @deprecated Sin efecto visual. */
  @Input() modalHeadlineSplit = false;

  @Output() readonly action = new EventEmitter<void>();
  @Output() readonly secondary = new EventEmitter<void>();
  @Output() readonly tertiary = new EventEmitter<void>();
  @Output() readonly fourth = new EventEmitter<void>();
  @Output() readonly dismiss = new EventEmitter<void>();
  @Output() readonly actionSelect = new EventEmitter<string>();

  @ViewChild('dialogPanel') private dialogPanel?: ElementRef<HTMLElement>;
  @ViewChild('closeBtn') private closeBtn?: ElementRef<HTMLButtonElement>;
  @ViewChildren('actionBtn') private actionButtons?: QueryList<ElementRef<HTMLButtonElement>>;

  @HostBinding('class.message-box-host-modal')
  get isModal(): boolean {
    return this.mode === 'modal';
  }

  ngAfterViewInit(): void {
    if (this.mode === 'modal') {
      this.triggerElement = this.doc.activeElement as HTMLElement | null;
      queueMicrotask(() => this.applyInitialFocus());
    }
  }

  ngOnDestroy(): void {
    this.restoreFocus();
  }

  @HostListener('document:keydown.escape', ['$event'])
  onEscape(event: Event): void {
    if (this.mode !== 'modal' || this.disableClose) {
      return;
    }
    event.preventDefault();
    this.onDismiss();
  }

  readonly infoIcon = InfoIcon;
  readonly successIcon = CheckCircleIcon;
  readonly warningIcon = AlertTriangleIcon;
  readonly dangerIcon = AlertCircleIcon;
  readonly decisionIcon = HelpCircleIcon;
  readonly blockedIcon = LockIcon;

  variantIcon(): any {
    const v = this.resolvedVariant();
    if (v === 'info') return this.infoIcon;
    if (v === 'success') return this.successIcon;
    if (v === 'warning') return this.warningIcon;
    if (v === 'danger') return this.dangerIcon;
    if (v === 'decision') return this.decisionIcon;
    if (v === 'blocked') return this.blockedIcon;
    return null;
  }

  resolvedVariant(): MessageBoxResolvedVariant {
    if (this.variant === 'error') {
      return 'danger';
    }
    if (this.variant === 'confirm') {
      return 'decision';
    }
    return this.variant as MessageBoxResolvedVariant;
  }

  panelClasses(): string[] {
    const classes: string[] = [];
    classes.push(`noia-msgbox--${this.resolvedVariant()}`);
    if (this.mode === 'modal') {
      classes.push(`noia-msgbox--${this.resolvedWidth()}`);
      if (this.resolvedVariant() === 'loading') {
        classes.push('noia-msgbox--loading');
      }
    }
    return classes;
  }

  resolvedWidth(): MessageBoxWidth {
    if (this.width) {
      return this.width;
    }
    if (this.normalizedSections().length > 2) {
      return 'lg';
    }
    if (!this.message && !this.normalizedSections().length) {
      return 'sm';
    }
    return 'md';
  }

  resolvedEyebrow(): string {
    const custom = (this.eyebrow || this.category)?.trim();
    if (custom) {
      return custom;
    }
    if (this.mode === 'inline') {
      return '';
    }
    return DEFAULT_EYEBROW[this.resolvedVariant()] ?? '';
  }

  normalizedSections(): NormalizedMessageBoxSection[] {
    return (this.sections ?? [])
      .map((section) => this.normalizeSection(section))
      .filter((section) => section.title || section.text || section.items.length)
      .slice(0, 3);
  }

  hasStructuredSections(): boolean {
    return this.normalizedSections().length > 0;
  }

  hasBodyContent(): boolean {
    return !!(this.detail || this.hasStructuredSections());
  }

  sectionToneClass(tone: MessageBoxSectionTone): string {
    return tone === 'neutral' ? 'noia-msgbox__section--neutral' : `noia-msgbox__section--${tone}`;
  }

  sectionTrack(section: NormalizedMessageBoxSection): string {
    return `${section.title}|${section.text}|${section.items.join(',')}`;
  }

  describedByIds(): string | null {
    return this.message ? this.messageId : null;
  }

  liveRole(): 'status' | 'alert' {
    const v = this.resolvedVariant();
    return v === 'danger' || v === 'warning' || v === 'blocked' ? 'alert' : 'status';
  }

  liveRegion(): 'polite' | 'assertive' {
    return this.liveRole() === 'alert' ? 'assertive' : 'polite';
  }

  showClose(): boolean {
    return this.mode === 'modal' && !this.disableClose;
  }

  primaryActionLabel(): string {
    return this.primaryLabel || this.actionLabel;
  }

  legacyActions(): MessageBoxAction[] {
    const items: MessageBoxAction[] = [];
    if (this.secondaryLabel) {
      items.push({ label: this.secondaryLabel, value: 'secondary', role: 'secondary', align: 'left' });
    }
    if (this.tertiaryLabel) {
      items.push({ label: this.tertiaryLabel, value: 'tertiary', role: 'secondary', align: 'left' });
    }
    if (this.fourthLabel) {
      items.push({ label: this.fourthLabel, value: 'fourth', role: 'secondary', align: 'left' });
    }
    if (this.primaryActionLabel()) {
      items.push({
        label: this.primaryActionLabel(),
        value: 'primary',
        role: 'primary',
        align: 'right',
      });
    }
    return items;
  }

  allActions(): MessageBoxAction[] {
    return this.actions?.length ? this.actions : this.legacyActions();
  }

  leftActions(): MessageBoxAction[] {
    return this.allActions().filter((a) => (a.align ?? 'right') === 'left');
  }

  rightActions(): MessageBoxAction[] {
    return this.allActions().filter((a) => (a.align ?? 'right') === 'right');
  }

  hasActions(): boolean {
    return this.resolvedVariant() !== 'loading' && this.allActions().length > 0;
  }

  actionClass(action: MessageBoxAction): Record<string, boolean> {
    return {
      'noia-msgbox__action--primary': action.role === 'primary',
      'noia-msgbox__action--danger': action.role === 'danger',
      'noia-msgbox__action--ghost': action.role === 'ghost',
    };
  }

  actionTrack(action: MessageBoxAction, index: number): string {
    return action.value ?? `${action.role ?? 'action'}-${index}-${action.label}`;
  }

  onConfigAction(action: MessageBoxAction, index: number): void {
    const value = action.value ?? this.defaultActionValue(action, index);
    this.actionSelect.emit(value);
    switch (value) {
      case 'primary':
        this.action.emit();
        break;
      case 'secondary':
        this.secondary.emit();
        break;
      case 'tertiary':
        this.tertiary.emit();
        break;
      case 'fourth':
        this.fourth.emit();
        break;
      default:
        if (action.role === 'primary') {
          this.action.emit();
        } else if (action.role === 'secondary' || action.role === 'ghost') {
          this.secondary.emit();
        }
        break;
    }
  }

  onDismiss(): void {
    this.dismiss.emit();

    if (this.mode === 'modal') {
      if (this.secondaryLabel || this.leftActions().length > 0) {
        this.secondary.emit();
      } else if (this.primaryActionLabel()) {
        this.action.emit();
      }
    }

    this.restoreFocus();
  }

  private normalizeSection(section: MessageBoxSection): NormalizedMessageBoxSection {
    const title = (section.title ?? section.label ?? '').trim();
    const text = (section.text ?? section.body ?? '').trim();
    const items = section.items?.map((item) => item.trim()).filter(Boolean) ?? [];
    return {
      title,
      text,
      items,
      tone: this.normalizeSectionTone(section.tone),
    };
  }

  private normalizeSectionTone(tone?: MessageBoxSection['tone'] | string): MessageBoxSectionTone {
    if (tone === 'attention' || tone === 'info' || tone === 'success' || tone === 'neutral') {
      return tone;
    }
    if (tone === 'warning' || tone === 'danger') {
      return 'attention';
    }
    return 'neutral';
  }

  private defaultActionValue(action: MessageBoxAction, index: number): string {
    if (action.role === 'primary') {
      return 'primary';
    }
    if (action.role === 'secondary' || action.role === 'ghost') {
      return 'secondary';
    }
    return `action-${index}`;
  }

  private applyInitialFocus(): void {
    if (this.initialFocus === 'close' && this.closeBtn) {
      this.closeBtn.nativeElement.focus();
      return;
    }
    const primary = this.actionButtons?.first;
    if (this.initialFocus === 'primary' && primary) {
      primary.nativeElement.focus();
      return;
    }
    if (this.closeBtn && this.showClose()) {
      this.closeBtn.nativeElement.focus();
    }
  }

  private restoreFocus(): void {
    if (this.triggerElement && typeof this.triggerElement.focus === 'function') {
      this.triggerElement.focus();
      this.triggerElement = null;
    }
  }
}
