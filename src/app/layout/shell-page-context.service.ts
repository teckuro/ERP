import { Injectable, computed, signal } from '@angular/core';

import { resolveShellRouteBreadcrumbs } from './shell-route-context.config';

export type ShellStatusChipTone = 'neutral' | 'warning' | 'success' | 'danger';

export type ShellBreadcrumbItem = {
  label: string;
  path?: string;
};

export type ShellPageContext = {
  breadcrumbs: ShellBreadcrumbItem[];
  pageTitle?: string;
  pageSubtitle?: string;
  statusChip?: { label: string; tone: ShellStatusChipTone };
  primaryAction?: {
    label: string;
    disabled?: boolean;
    loading?: boolean;
    actionId: string;
  };
};

export type ShellPrimaryActionHandler = () => void;

const EMPTY_CONTEXT: ShellPageContext = { breadcrumbs: [] };

@Injectable({ providedIn: 'root' })
export class ShellPageContextService {
  private readonly contextState = signal<ShellPageContext>(EMPTY_CONTEXT);
  private primaryHandler: ShellPrimaryActionHandler | null = null;
  private bindingActive = false;

  readonly context = this.contextState.asReadonly();

  readonly breadcrumbs = computed(() => this.contextState().breadcrumbs);
  readonly pageTitle = computed(() => this.contextState().pageTitle);
  readonly pageSubtitle = computed(() => this.contextState().pageSubtitle);
  readonly statusChip = computed(() => this.contextState().statusChip);
  readonly primaryAction = computed(() => this.contextState().primaryAction);

  setContext(context: ShellPageContext): void {
    this.contextState.set(context);
  }

  patchContext(partial: Partial<ShellPageContext>): void {
    this.contextState.update((current) => ({ ...current, ...partial }));
  }

  clearContext(): void {
    this.contextState.set(EMPTY_CONTEXT);
    this.primaryHandler = null;
  }

  setBindingActive(active: boolean): void {
    this.bindingActive = active;
  }

  isBindingActive(): boolean {
    return this.bindingActive;
  }

  applyRouteFallback(url: string): void {
    if (this.bindingActive) {
      return;
    }
    const breadcrumbs = resolveShellRouteBreadcrumbs(url);
    if (breadcrumbs.length) {
      this.setContext({ breadcrumbs });
    } else {
      this.clearContext();
    }
  }

  registerPrimaryActionHandler(handler: ShellPrimaryActionHandler | null): void {
    this.primaryHandler = handler;
  }

  invokePrimaryAction(): void {
    this.primaryHandler?.();
  }
}
