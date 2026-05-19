import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import {
  CalendarIcon,
  ClockIcon,
  HomeIcon,
  LucideAngularModule,
  PlayIcon,
} from 'lucide-angular';

import { AuthService } from '../core/auth/auth.service';
import { PeriodoActivoService } from '../core/services/periodo-activo.service';
import { SHELL_NAV_WIDTH_PX } from './shell-navigation.config';
import { ShellPageContextService, type ShellStatusChipTone } from './shell-page-context.service';

const HEADER_HEIGHT_PX = 52;

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, LucideAngularModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="erp-shell-header" [style.left.px]="navWidth" [style.height.px]="headerHeight">
      <div class="erp-shell-header__inner">
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

        <div class="erp-shell-header__actions">
          @if (statusChip(); as chip) {
            <span class="erp-shell-header__chip" [class]="chipClass(chip.tone)">
              <lucide-icon [img]="clockIcon" aria-hidden="true"></lucide-icon>
              <span>{{ chip.label }}</span>
            </span>
          }

          <div class="erp-shell-header__period">
            <span class="erp-shell-header__chip erp-shell-header__chip--period">
              <lucide-icon [img]="calendarIcon" aria-hidden="true"></lucide-icon>
              <span>{{ periodoActivo.etiqueta() }}</span>
            </span>
            <details class="erp-shell-header__period-edit">
              <summary class="sr-only">Cambiar período activo</summary>
              <div class="erp-shell-header__period-controls">
                <label class="sr-only" for="header-periodo-anio">Año</label>
                <select
                  id="header-periodo-anio"
                  class="periodo-header-select periodo-header-year"
                  [ngModel]="anioPeriodo()"
                  (ngModelChange)="onAnioChange($event)"
                >
                  @for (y of yearOptions(); track y) {
                    <option [value]="stringYear(y)">{{ y }}</option>
                  }
                </select>
                <label class="sr-only" for="header-periodo-mes">Mes</label>
                <select
                  id="header-periodo-mes"
                  class="periodo-header-select periodo-header-month"
                  [ngModel]="mesPeriodo()"
                  (ngModelChange)="onMesChange($event)"
                >
                  @for (m of monthOptions; track m.value) {
                    <option [value]="m.value">{{ m.label }}</option>
                  }
                </select>
              </div>
            </details>
          </div>

          @if (primaryAction(); as action) {
            <button
              type="button"
              class="erp-shell-header__cta"
              [disabled]="action.disabled || action.loading"
              (click)="onPrimaryAction()"
            >
              <lucide-icon [img]="playIcon" aria-hidden="true"></lucide-icon>
              <span>{{ action.loading ? 'Procesando...' : action.label }}</span>
            </button>
          }

          <div class="erp-shell-header__user" aria-label="Sesión">
            <span class="erp-shell-header__avatar" aria-hidden="true">{{ inicialUsuario() }}</span>
            <button
              type="button"
              class="erp-shell-header__logout"
              [disabled]="cerrandoSesion()"
              (click)="cerrarSesion()"
            >
              {{ cerrandoSesion() ? 'Cerrando...' : 'Salir' }}
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
        border-bottom: 1px solid #e2e8f0;
        background: #ffffff;
      }

      .erp-shell-header__inner {
        display: flex;
        height: 100%;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        padding: 0 20px;
      }

      .erp-shell-header__breadcrumb {
        display: flex;
        min-width: 0;
        flex: 1 1 auto;
        align-items: center;
        gap: 6px;
        overflow: hidden;
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

      .erp-shell-header__period {
        display: flex;
        align-items: center;
        gap: 4px;
      }

      .erp-shell-header__period-edit {
        position: relative;
      }

      .erp-shell-header__period-edit summary {
        list-style: none;
        cursor: pointer;
      }

      .erp-shell-header__period-edit summary::-webkit-details-marker {
        display: none;
      }

      .erp-shell-header__period-controls {
        position: absolute;
        top: calc(100% + 6px);
        right: 0;
        z-index: 20;
        display: flex;
        gap: 6px;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        background: #ffffff;
        padding: 8px;
        box-shadow: 0 8px 24px rgba(15, 23, 42, 0.08);
      }

      .periodo-header-select {
        height: 32px;
        border: 1px solid #e2e8f0;
        border-radius: 6px;
        background: #ffffff;
        padding: 0 8px;
        color: #0f172a;
        font-size: 12px;
        font-weight: 500;
      }

      .periodo-header-year {
        width: 5rem;
      }

      .periodo-header-month {
        min-width: 7.5rem;
      }

      .erp-shell-header__cta {
        display: inline-flex;
        min-height: 34px;
        align-items: center;
        gap: 6px;
        border: 0;
        border-radius: 8px;
        background: #0c447c;
        padding: 8px 16px;
        color: #ffffff;
        font-size: 13px;
        font-weight: 500;
        cursor: pointer;
        transition: background-color 120ms ease, transform 80ms ease;
      }

      .erp-shell-header__cta:hover:not(:disabled) {
        background: #185fa5;
      }

      .erp-shell-header__cta:active:not(:disabled) {
        transform: scale(0.98);
      }

      .erp-shell-header__cta:disabled {
        cursor: not-allowed;
        opacity: 0.55;
      }

      .erp-shell-header__cta lucide-icon {
        width: 13px;
        height: 13px;
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

      @media (max-width: 1024px) {
        .erp-shell-header {
          left: 0 !important;
        }
      }

      @media (max-width: 760px) {
        .erp-shell-header__period-edit,
        .erp-shell-header__logout {
          display: none;
        }
      }
    `,
  ],
})
export class HeaderComponent {
  readonly homeIcon = HomeIcon;
  readonly clockIcon = ClockIcon;
  readonly calendarIcon = CalendarIcon;
  readonly playIcon = PlayIcon;
  readonly navWidth = SHELL_NAV_WIDTH_PX;
  readonly headerHeight = HEADER_HEIGHT_PX;

  readonly periodoActivo = inject(PeriodoActivoService);
  readonly shellContext = inject(ShellPageContextService);
  readonly auth = inject(AuthService);
  readonly router = inject(Router);
  readonly cerrandoSesion = signal(false);

  readonly breadcrumbs = this.shellContext.breadcrumbs;
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
    this.periodoActivo.setPeriodoYm(`${raw}-${mes}`);
  }

  onMesChange(raw: string): void {
    const anio = this.periodoActivo.periodoYm().slice(0, 4);
    this.periodoActivo.setPeriodoYm(`${anio}-${raw}`);
  }

  onPrimaryAction(): void {
    this.shellContext.invokePrimaryAction();
  }

  async cerrarSesion(): Promise<void> {
    this.cerrandoSesion.set(true);
    try {
      await this.auth.logout();
      await this.router.navigateByUrl('/login');
    } finally {
      this.cerrandoSesion.set(false);
    }
  }
}
