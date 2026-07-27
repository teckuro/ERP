import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import type { ElementRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import {
  CalendarIcon,
  ChevronDownIcon,
  ClockIcon,
  HomeIcon,
  LucideAngularModule,
  PlayIcon,
} from 'lucide-angular';

import { AuthService } from '../core/auth/auth.service';
import { EmpresaActivaService } from '../core/services/empresa-activa.service';
import { PeriodoActivoService } from '../core/services/periodo-activo.service';
import {
  SHELL_HEADER_HEIGHT_PX,
  SHELL_NAV_WIDTH_PX,
  SHELL_STRIP_PADDING_X_PX,
} from './shell-navigation.config';
import { ShellPageContextService, type ShellStatusChipTone } from './shell-page-context.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, LucideAngularModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header
      class="erp-shell-header"
      [class.erp-shell-header--with-title]="!!pageTitle()"
      [style.left.px]="navWidth"
      [style.height.px]="headerHeight"
    >
      <div class="erp-shell-header__inner" [class.erp-shell-header__inner--with-title]="!!pageTitle()">
        <nav class="erp-shell-header__breadcrumb" aria-label="Ruta actual">
          <a routerLink="/" class="erp-shell-header__crumb-home" aria-label="Inicio">
            <lucide-icon [img]="homeIcon"></lucide-icon>
          </a>
          @for (crumb of breadcrumbs(); track crumb.label; let last = $last) {
            <span class="erp-shell-header__crumb-sep" aria-hidden="true">/</span>
            @if (!last && crumb.path) {
              <a [routerLink]="crumb.path" class="erp-shell-header__crumb">{{ crumb.label }}</a>
            } @else {
              <span class="erp-shell-header__crumb erp-shell-header__crumb--current">{{ crumb.label }}</span>
            }
          }
        </nav>

        @if (pageTitle(); as title) {
          <div class="erp-shell-header__title">
            <h1>{{ title }}</h1>
            @if (pageSubtitle()) {
              <p>{{ pageSubtitle() }}</p>
            }
          </div>
        }

        <div class="erp-shell-header__actions">
          @if (statusChip(); as chip) {
            <span class="erp-shell-header__chip" [class]="chipClass(chip.tone)">
              <lucide-icon [img]="clockIcon" aria-hidden="true"></lucide-icon>
              <span>{{ chip.label }}</span>
            </span>
          }

          <details #periodPicker class="erp-shell-header__period-edit">
            <summary
              class="erp-shell-header__period-trigger"
              title="Cambiar período activo"
              [attr.aria-label]="'Cambiar período activo. Actual: ' + periodoActivo.etiqueta()"
            >
              <span class="erp-shell-header__chip erp-shell-header__chip--period">
                <lucide-icon [img]="calendarIcon" aria-hidden="true"></lucide-icon>
                <span>{{ periodoActivo.etiqueta() }}</span>
                <lucide-icon
                  [img]="chevronDownIcon"
                  class="erp-shell-header__period-chevron"
                  aria-hidden="true"
                ></lucide-icon>
              </span>
            </summary>
            <div class="erp-shell-header__period-panel">
              <p class="erp-shell-header__period-hint">
                Período de trabajo del ERP. Las pantallas usarán este mes.
              </p>
              <div class="erp-shell-header__period-controls">
                <label class="erp-shell-header__period-field" for="header-periodo-mes">
                  <span>Mes</span>
                  <select
                    id="header-periodo-mes"
                    class="periodo-header-select"
                    [ngModel]="mesPeriodo()"
                    (ngModelChange)="onMesChange($event)"
                  >
                    @for (m of monthOptions; track m.value) {
                      <option [value]="m.value">{{ m.label }}</option>
                    }
                  </select>
                </label>
                <label class="erp-shell-header__period-field" for="header-periodo-anio">
                  <span>Año</span>
                  <select
                    id="header-periodo-anio"
                    class="periodo-header-select"
                    [ngModel]="anioPeriodo()"
                    (ngModelChange)="onAnioChange($event)"
                  >
                    @for (y of yearOptions(); track y) {
                      <option [value]="stringYear(y)">{{ y }}</option>
                    }
                  </select>
                </label>
              </div>
            </div>
          </details>

          @if (primaryAction(); as action) {
            <button
              type="button"
              class="erp-shell-header__cta"
              [attr.data-testid]="action.actionId"
              [attr.title]="action.tooltip ?? null"
              [attr.aria-label]="action.tooltip ?? null"
              [attr.aria-busy]="action.loading"
              [disabled]="action.disabled || action.loading"
              (click)="onPrimaryAction()"
            >
              @if (action.loading) {
                <span class="erp-shell-header__btn-spinner" aria-hidden="true"></span>
              } @else {
                <lucide-icon [img]="playIcon" aria-hidden="true"></lucide-icon>
              }
              <span>{{ action.label }}</span>
            </button>
          }

          <div class="erp-shell-header__user" aria-label="Sesión">
            <span class="erp-shell-header__avatar" aria-hidden="true">{{ inicialUsuario() }}</span>
            <button
              type="button"
              class="erp-shell-header__logout"
              [disabled]="cerrandoSesion()"
              [attr.aria-busy]="cerrandoSesion()"
              (click)="cerrarSesion()"
            >
              @if (cerrandoSesion()) {
                <span class="erp-shell-header__btn-spinner" aria-hidden="true"></span>
              }
              Salir
            </button>
          </div>
        </div>
      </div>
    </header>
  `,
  styles: [
    `
      .erp-shell-header {
        position: fixed;
        top: 0;
        right: 0;
        z-index: 10;
        box-sizing: border-box;
        border-bottom: 1px solid #e2e8f0;
        background: #ffffff;
      }

      .erp-shell-header__inner {
        display: flex;
        height: 100%;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        padding: 0 ${SHELL_STRIP_PADDING_X_PX}px;
      }

      .erp-shell-header__inner--with-title {
        display: grid;
        grid-template-columns: minmax(0, 1fr) minmax(0, 2fr) auto;
        align-items: center;
        gap: 10px 14px;
      }

      .erp-shell-header__breadcrumb {
        display: flex;
        min-width: 0;
        flex: 1 1 auto;
        align-items: center;
        gap: 6px;
        overflow: hidden;
      }

      .erp-shell-header__inner--with-title .erp-shell-header__breadcrumb {
        flex: none;
        justify-self: start;
      }

      .erp-shell-header__title {
        min-width: 0;
        justify-self: center;
        text-align: center;
      }

      .erp-shell-header__title h1 {
        margin: 0;
        overflow: hidden;
        color: #0f172a;
        font-size: 13px;
        font-weight: 600;
        line-height: 1.2;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .erp-shell-header__title p {
        margin: 1px 0 0;
        overflow: hidden;
        color: #64748b;
        font-size: 10.5px;
        line-height: 1.2;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .erp-shell-header__inner--with-title .erp-shell-header__actions {
        flex: none;
        justify-self: end;
        width: max-content;
        max-width: 100%;
        min-width: 0;
        flex-wrap: nowrap;
      }

      .erp-shell-header__crumb-home {
        display: inline-flex;
        color: #94a3b8;
        text-decoration: none;
      }

      .erp-shell-header__crumb-home lucide-icon {
        width: 14px;
        height: 14px;
      }

      .erp-shell-header__crumb-sep {
        color: #cbd5e1;
        font-size: 13px;
      }

      .erp-shell-header__crumb {
        overflow: hidden;
        color: #64748b;
        font-size: 13px;
        line-height: 1.2;
        text-decoration: none;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .erp-shell-header__crumb:hover {
        color: #0f172a;
      }

      .erp-shell-header__crumb--current {
        color: #0f172a;
        font-weight: 500;
        pointer-events: none;
      }

      .erp-shell-header__actions {
        display: flex;
        flex: 0 0 auto;
        align-items: center;
        gap: 8px;
      }

      .erp-shell-header__chip {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        border-radius: 999px;
        padding: 4px 10px;
        font-size: 12px;
        font-weight: 500;
        line-height: 1.2;
        white-space: nowrap;
      }

      .erp-shell-header__chip lucide-icon {
        width: 13px;
        height: 13px;
      }

      .erp-shell-header__chip--warning {
        border: 0.5px solid #ef9f27;
        background: #faeeda;
        color: #633806;
      }

      .erp-shell-header__chip--success {
        border: 0.5px solid #86efac;
        background: #ecfdf5;
        color: #065f46;
      }

      .erp-shell-header__chip--danger {
        border: 0.5px solid #fecaca;
        background: #fef2f2;
        color: #991b1b;
      }

      .erp-shell-header__chip--neutral,
      .erp-shell-header__chip--period {
        border: 0.5px solid #e2e8f0;
        background: #f8fafc;
        color: #64748b;
      }

      .erp-shell-header__period-edit {
        position: relative;
      }

      .erp-shell-header__period-trigger {
        list-style: none;
        cursor: pointer;
      }

      .erp-shell-header__period-trigger::-webkit-details-marker {
        display: none;
      }

      .erp-shell-header__period-trigger:hover .erp-shell-header__chip--period {
        border-color: #cbd5e1;
        background: #ffffff;
        color: #0f172a;
      }

      .erp-shell-header__period-chevron {
        width: 12px;
        height: 12px;
        opacity: 0.7;
        transition: transform 120ms ease;
      }

      .erp-shell-header__period-edit[open] .erp-shell-header__period-chevron {
        transform: rotate(180deg);
      }

      .erp-shell-header__period-panel {
        position: absolute;
        top: calc(100% + 6px);
        right: 0;
        z-index: 20;
        display: grid;
        gap: 10px;
        width: min(16.5rem, calc(100vw - 24px));
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        background: #ffffff;
        padding: 12px;
        box-shadow: 0 4px 14px rgba(15, 23, 42, 0.06);
      }

      .erp-shell-header__period-hint {
        margin: 0;
        color: #64748b;
        font-size: 0.75rem;
        line-height: 1.4;
      }

      .erp-shell-header__period-controls {
        display: grid;
        grid-template-columns: 1.35fr 0.9fr;
        gap: 8px;
        align-items: end;
      }

      .erp-shell-header__period-field {
        display: grid;
        gap: 4px;
        min-width: 0;
        color: #64748b;
        font-size: 0.6875rem;
        font-weight: 600;
      }

      .periodo-header-select {
        width: 100%;
        height: 32px;
        box-sizing: border-box;
        border: 1px solid #e2e8f0;
        border-radius: 6px;
        background: #ffffff;
        padding: 0 8px;
        color: #0f172a;
        font-size: 12px;
        font-weight: 500;
      }

      .erp-shell-header__cta {
        display: inline-flex;
        flex: 0 0 auto;
        height: 28px;
        align-items: center;
        gap: 5px;
        border: 0.5px solid var(--erp-primary);
        border-radius: 6px;
        background: var(--erp-primary);
        padding: 0 10px;
        color: #ffffff;
        font-size: 12px;
        font-weight: 500;
        line-height: 1;
        white-space: nowrap;
        cursor: pointer;
        transition:
          background-color 150ms ease,
          border-color 150ms ease,
          transform 80ms ease;
      }

      .erp-shell-header__cta:hover:not(:disabled) {
        border-color: var(--erp-primary-hover);
        background: var(--erp-primary-hover);
      }

      .erp-shell-header__cta:active:not(:disabled) {
        transform: scale(0.98);
      }

      .erp-shell-header__cta:disabled {
        cursor: not-allowed;
        opacity: 0.55;
      }

      .erp-shell-header__cta lucide-icon {
        width: 12px;
        height: 12px;
        flex: 0 0 12px;
      }

      .erp-shell-header__user {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-left: 4px;
        padding-left: 8px;
        border-left: 1px solid #e2e8f0;
      }

      .erp-shell-header__avatar {
        display: grid;
        width: 28px;
        height: 28px;
        place-items: center;
        border-radius: 999px;
        background: #e6f1fb;
        color: #0c447c;
        font-size: 11px;
        font-weight: 600;
      }

      .erp-shell-header__logout {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        border: 0;
        background: transparent;
        padding: 0;
        color: #64748b;
        font-size: 12px;
        font-weight: 500;
        cursor: pointer;
      }

      .erp-shell-header__logout:hover:not(:disabled) {
        color: #0f172a;
      }

      .erp-shell-header__logout:disabled {
        cursor: wait;
        opacity: 0.7;
      }

      .erp-shell-header__btn-spinner {
        flex: 0 0 auto;
        width: 12px;
        height: 12px;
        border: 1.5px solid #cbd5e1;
        border-top-color: #2563eb;
        border-radius: 999px;
        animation: erp-shell-header-spin 0.7s linear infinite;
      }

      .erp-shell-header__cta .erp-shell-header__btn-spinner {
        border-color: rgba(255, 255, 255, 0.45);
        border-top-color: #ffffff;
      }

      @keyframes erp-shell-header-spin {
        to {
          transform: rotate(1turn);
        }
      }

      @media (max-width: 1024px) {
        .erp-shell-header {
          left: 0 !important;
        }
      }

      @media (max-width: 760px) {
        .erp-shell-header__logout {
          display: none;
        }

        .erp-shell-header__period-panel {
          right: auto;
          left: 0;
        }

        .erp-shell-header__title p {
          display: none;
        }

        .erp-shell-header__inner--with-title {
          grid-template-columns: minmax(0, 1fr) minmax(0, 1.4fr) auto;
        }

        .erp-shell-header__inner--with-title .erp-shell-header__title {
          text-align: left;
        }
      }

      @media (prefers-reduced-motion: reduce) {
        .erp-shell-header__cta {
          transition: none;
        }

        .erp-shell-header__cta:active:not(:disabled) {
          transform: none;
        }
      }
    `,
  ],
})
export class HeaderComponent {
  readonly homeIcon = HomeIcon;
  readonly clockIcon = ClockIcon;
  readonly calendarIcon = CalendarIcon;
  readonly chevronDownIcon = ChevronDownIcon;
  readonly playIcon = PlayIcon;

  private readonly periodPicker = viewChild<ElementRef<HTMLDetailsElement>>('periodPicker');
  readonly navWidth = SHELL_NAV_WIDTH_PX;
  readonly headerHeight = SHELL_HEADER_HEIGHT_PX;

  readonly periodoActivo = inject(PeriodoActivoService);
  readonly shellContext = inject(ShellPageContextService);
  readonly auth = inject(AuthService);
  private readonly empresaActiva = inject(EmpresaActivaService);
  readonly router = inject(Router);
  readonly cerrandoSesion = signal(false);

  readonly breadcrumbs = this.shellContext.breadcrumbs;
  readonly pageTitle = this.shellContext.pageTitle;
  readonly pageSubtitle = this.shellContext.pageSubtitle;
  readonly statusChip = this.shellContext.statusChip;
  readonly primaryAction = this.shellContext.primaryAction;

  readonly monthOptions: readonly { value: string; label: string }[] = [
    { value: '01', label: 'Enero' },
    { value: '02', label: 'Febrero' },
    { value: '03', label: 'Marzo' },
    { value: '04', label: 'Abril' },
    { value: '05', label: 'Mayo' },
    { value: '06', label: 'Junio' },
    { value: '07', label: 'Julio' },
    { value: '08', label: 'Agosto' },
    { value: '09', label: 'Septiembre' },
    { value: '10', label: 'Octubre' },
    { value: '11', label: 'Noviembre' },
    { value: '12', label: 'Diciembre' },
  ];

  readonly anioPeriodo = computed(() => {
    const raw = this.periodoActivo.periodoYm();
    const year = raw.slice(0, 4);
    return /^\d{4}$/.test(year) ? year : String(new Date().getFullYear());
  });

  readonly mesPeriodo = computed(() => {
    const raw = this.periodoActivo.periodoYm();
    const month = raw.slice(5, 7).padStart(2, '0');
    return /^(0[1-9]|1[0-2])$/.test(month) ? month : String(new Date().getMonth() + 1).padStart(2, '0');
  });

  readonly inicialUsuario = computed(() => {
    const label = this.auth.currentEmail() ?? 'U';
    return label.trim() ? label[0].toUpperCase() : 'U';
  });

  readonly yearOptions = computed(() => {
    const ym = this.periodoActivo.periodoYm();
    const ySel = Number.parseInt(ym.slice(0, 4), 10);
    const nowY = new Date().getFullYear();
    const s = new Set<number>();
    for (let y = nowY - 10; y <= nowY + 3; y++) {
      s.add(y);
    }
    if (Number.isFinite(ySel)) {
      s.add(ySel);
    }
    return [...s].sort((a, b) => b - a);
  });

  chipClass(tone: ShellStatusChipTone): string {
    return `erp-shell-header__chip--${tone}`;
  }

  stringYear(y: number): string {
    return String(y);
  }

  onAnioChange(raw: string): void {
    const mes = this.periodoActivo.periodoYm().slice(5, 7);
    this.aplicarPeriodoYm(`${raw}-${mes}`);
  }

  onMesChange(raw: string): void {
    const anio = this.periodoActivo.periodoYm().slice(0, 4);
    this.aplicarPeriodoYm(`${anio}-${raw}`);
  }

  private aplicarPeriodoYm(ym: string): void {
    this.periodoActivo.setPeriodoYm(ym);
    this.cerrarSelectorPeriodo();
  }

  private cerrarSelectorPeriodo(): void {
    const el = this.periodPicker()?.nativeElement;
    if (el) {
      el.open = false;
    }
  }

  onPrimaryAction(): void {
    this.shellContext.invokePrimaryAction();
  }

  async cerrarSesion(): Promise<void> {
    this.cerrandoSesion.set(true);
    try {
      await this.auth.logout();
      this.empresaActiva.limpiar();
      await this.router.navigateByUrl('/login');
    } finally {
      this.cerrandoSesion.set(false);
    }
  }
}
