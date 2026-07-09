/** Variantes oficiales NOIA (+ alias legacy `error` / `confirm` / `loading`). */
export type MessageBoxVariant =
  | 'info'
  | 'success'
  | 'warning'
  | 'danger'
  | 'decision'
  | 'blocked'
  | 'loading'
  /** @deprecated Usar `danger`. */
  | 'error'
  /** @deprecated Usar `decision`. */
  | 'confirm';

export type MessageBoxVariantInput = MessageBoxVariant;

export type MessageBoxMode = 'inline' | 'modal';

export type MessageBoxWidth = 'sm' | 'md' | 'lg';

/** Tonos de bloque: solo fondos suaves, sin borde de color por variante. */
export type MessageBoxSectionTone = 'neutral' | 'attention' | 'info' | 'success';

export interface MessageBoxSection {
  title?: string;
  text?: string;
  items?: string[];
  tone?: MessageBoxSectionTone | 'warning' | 'danger';
  /** @deprecated Usar `title`. */
  label?: string;
  /** @deprecated Usar `text`. */
  body?: string;
}

export type MessageBoxActionRole = 'primary' | 'secondary' | 'danger' | 'ghost';

export interface MessageBoxAction {
  label: string;
  role?: MessageBoxActionRole;
  align?: 'left' | 'right';
  value?: string;
  disabled?: boolean;
}

export interface MessageBoxConfig {
  variant: MessageBoxVariant;
  eyebrow?: string;
  /** @deprecated Usar `eyebrow`. */
  category?: string;
  title: string;
  message?: string;
  sections?: MessageBoxSection[];
  actions?: MessageBoxAction[];
  width?: MessageBoxWidth;
  disableClose?: boolean;
  initialFocus?: 'primary' | 'secondary' | 'close';
}

export type MessageBoxResolvedVariant = Exclude<MessageBoxVariant, 'error' | 'confirm'>;
