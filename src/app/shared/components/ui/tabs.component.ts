import {
  Component,
  Directive,
  HostBinding,
  HostListener,
  Input,
  InjectionToken,
  signal,
  WritableSignal,
  computed,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';

type TabsContext = {
  value: WritableSignal<string>;
};

const TABS_CTX = new InjectionToken<TabsContext>('TABS_CTX');

@Directive({
  selector: '[appTabsTrigger]',
  standalone: true,
})
export class TabsTriggerDirective {
  @Input('appTabsTrigger') value = '';
  @Input() className = '';

  private readonly ctx = inject(TABS_CTX) as TabsContext;

  readonly isActive = computed(() => this.ctx.value() === this.value);

  @HostBinding('attr.type')
  type = 'button';

  @HostBinding('attr.role')
  role = 'tab';

  @HostBinding('attr.aria-selected')
  get ariaSelected(): string {
    return this.isActive() ? 'true' : 'false';
  }

  @HostBinding('attr.tabindex')
  get tabIndex(): number {
    return this.isActive() ? 0 : -1;
  }

  @HostBinding('attr.data-state')
  get dataState(): string {
    return this.isActive() ? 'active' : 'inactive';
  }

  @HostBinding('class')
  get hostClass(): string {
    const base =
      "data-[state=active]:bg-white data-[state=active]:border-blue-200 data-[state=active]:text-slate-950 dark:data-[state=active]:text-foreground focus-visible:border-blue-200 focus-visible:ring-blue-100/80 focus-visible:outline-blue-200 dark:data-[state=active]:border-input dark:data-[state=active]:bg-input/30 text-slate-700 dark:text-muted-foreground inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-1.5 rounded-md border border-transparent px-3 py-1 text-sm font-medium whitespace-nowrap transition-[color,box-shadow,background,border-color] focus-visible:ring-[3px] focus-visible:outline-1 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4";
    return `${base} ${this.className}`.trim();
  }

  @HostListener('click')
  handleClick() {
    this.ctx.value.set(this.value);
  }
}

@Directive({
  selector: '[appTabsContent]',
  standalone: true,
})
export class TabsContentDirective {
  @Input('appTabsContent') value = '';
  @Input() className = '';

  private readonly ctx = inject(TABS_CTX) as TabsContext;
  readonly isActive = computed(() => this.ctx.value() === this.value);

  @HostBinding('class')
  get hostClass(): string {
    return `flex-1 outline-none ${this.className}`.trim();
  }

  @HostBinding('style.display')
  get display(): string {
    return this.isActive() ? '' : 'none';
  }
}

@Component({
  selector: 'app-tabs',
  standalone: true,
  imports: [CommonModule],
  providers: [
    {
      provide: TABS_CTX,
      useFactory: () => ({ value: signal('') }),
    },
  ],
  template: `<ng-content />`,
})
export class TabsComponent {
  @Input() defaultValue = '';
  @Input() className = '';

  private readonly ctx = inject(TABS_CTX) as TabsContext;

  ngOnInit() {
    if (this.defaultValue) this.ctx.value.set(this.defaultValue);
  }

  @HostBinding('class')
  get hostClass(): string {
    return `flex flex-col gap-2 ${this.className}`.trim();
  }
}

@Component({
  selector: 'app-tabs-list',
  standalone: true,
  template: `<ng-content />`,
})
export class TabsListComponent {
  @Input() className = '';

  @HostBinding('class')
  get hostClass(): string {
    return `bg-slate-50 text-slate-600 inline-flex h-9 w-fit items-center justify-center rounded-md border border-slate-200 p-[3px] flex ${this.className}`.trim();
  }
}
