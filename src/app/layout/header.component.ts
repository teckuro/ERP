import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ClipboardListIcon, LucideAngularModule } from 'lucide-angular';

import { AuthService } from '../core/auth/auth.service';
import { PeriodoActivoService } from '../core/services/periodo-activo.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="erp-shell-header">
      <div class="erp-shell-header__inner">
        <section class="erp-shell-header__context" aria-label="Contexto de trabajo">
          <div class="erp-shell-header__mark" aria-hidden="true">
            <lucide-icon [img]="clipboardListIcon"></lucide-icon>
          </div>
          <div class="erp-shell-header__copy">
            <div class="erp-shell-header__meta-row">
              <span class="erp-shell-header__eyebrow">Bitácora operativa</span>
              <span class="erp-shell-header__status">Periodo activo</span>
            </div>
            <div class="erp-shell-header__period-row">
              <label class="sr-only" for="header-periodo-anio">Año</label>
              <select
                id="header-periodo-anio"
                class="periodo-header-select periodo-header-year"
                [ngModel]="anioPeriodo()"
                (ngModelChange)="onAnioChange($event)"
                aria-label="Año del período activo"
              >
                <option *ngFor="let y of yearOptions(); trackBy: trackYear" [value]="stringYear(y)">{{ y }}</option>
              </select>
              <label class="sr-only" for="header-periodo-mes">Mes</label>
              <select
                id="header-periodo-mes"
                class="periodo-header-select periodo-header-month"
                [ngModel]="mesPeriodo()"
                (ngModelChange)="onMesChange($event)"
                aria-label="Mes del período activo"
              >
                <option *ngFor="let m of monthOptions; trackBy: trackMonth" [value]="m.value">{{ m.label }}</option>
              </select>
              <span class="erp-shell-header__period-code">{{ periodoActivo.periodoYm() }}</span>
            </div>
          </div>
        </section>

        <section class="erp-shell-header__user" aria-label="Sesión">
          <button type="button" class="erp-shell-header__icon-button" aria-label="Notificaciones">
            <lucide-icon name="bell"></lucide-icon>
            <span class="erp-shell-header__notification-dot"></span>
          </button>

          <div class="erp-shell-header__account">
            <div class="erp-shell-header__account-copy">
              <p>{{ usuarioLabel() }}</p>
              <span>Sesión activa</span>
            </div>
            <div class="erp-shell-header__avatar" aria-hidden="true">
              {{ inicialUsuario() }}
            </div>
            <button
              type="button"
              class="erp-shell-header__logout"
              [disabled]="cerrandoSesion()"
              (click)="cerrarSesion()"
            >
              <lucide-icon name="lock"></lucide-icon>
              {{ cerrandoSesion() ? 'Cerrando...' : 'Cerrar sesión' }}
            </button>
          </div>
        </section>
      </div>
    </header>
  `,
  styles: [
    `
      .erp-shell-header {
        position: fixed;
        top: 0;
        right: 0;
        left: 16rem;
        z-index: 10;
        height: 4.25rem;
        border-bottom: 1px solid #daddd6;
        background: rgba(255, 255, 255, 0.96);
        backdrop-filter: blur(8px);
      }

      .erp-shell-header__inner {
        display: flex;
        height: 100%;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
        padding: 0 1.5rem;
      }

      .erp-shell-header__context,
      .erp-shell-header__user,
      .erp-shell-header__account,
      .erp-shell-header__period-row,
      .erp-shell-header__meta-row {
        display: flex;
        align-items: center;
        min-width: 0;
      }

      .erp-shell-header__context {
        gap: 0.75rem;
        flex: 1 1 auto;
      }

      .erp-shell-header__mark {
        display: grid;
        width: 2.25rem;
        height: 2.25rem;
        flex: 0 0 2.25rem;
        place-items: center;
        border: 1px solid #c7d0c4;
        border-radius: 0.5rem;
        background: #fafaf7;
        color: #172033;
      }

      .erp-shell-header__mark lucide-icon,
      .erp-shell-header__icon-button lucide-icon,
      .erp-shell-header__logout lucide-icon {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 1rem;
        height: 1rem;
        line-height: 0;
      }

      .erp-shell-header__mark lucide-icon svg,
      .erp-shell-header__icon-button lucide-icon svg,
      .erp-shell-header__logout lucide-icon svg {
        display: block;
        width: 1rem;
        height: 1rem;
      }

      .erp-shell-header__copy {
        display: grid;
        gap: 0.25rem;
        min-width: 0;
      }

      .erp-shell-header__meta-row {
        gap: 0.5rem;
      }

      .erp-shell-header__eyebrow {
        color: #172033;
        font-size: 0.68rem;
        font-weight: 600;
        letter-spacing: 0.12em;
        line-height: 1;
        text-transform: uppercase;
      }

      .erp-shell-header__status,
      .erp-shell-header__period-code {
        display: inline-flex;
        align-items: center;
        min-height: 1.25rem;
        border: 1px solid #daddd6;
        border-radius: 999px;
        background: #fafaf7;
        padding: 0 0.5rem;
        color: #647084;
        font-size: 0.68rem;
        font-weight: 600;
        line-height: 1;
      }

      .erp-shell-header__period-row {
        flex-wrap: wrap;
        gap: 0.5rem;
      }

      .periodo-header-select {
        height: 2rem;
        border: 1px solid #daddd6;
        border-radius: 0.5rem;
        background: #ffffff;
        color: #172033;
        padding: 0 0.65rem;
        font-size: 0.8rem;
        font-weight: 600;
        line-height: 1;
        outline: none;
        transition:
          border-color 150ms ease,
          box-shadow 150ms ease,
          background-color 150ms ease;
      }

      .periodo-header-select:hover {
        border-color: #c7d0c4;
        background: #fafaf7;
      }

      .periodo-header-select:focus-visible {
        border-color: #2563eb;
        box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.14);
      }

      .periodo-header-year {
        width: 5.25rem;
        min-width: 5.25rem;
      }

      .periodo-header-month {
        min-width: 8.5rem;
      }

      .erp-shell-header__user {
        flex: 0 0 auto;
        gap: 0.75rem;
      }

      .erp-shell-header__icon-button {
        position: relative;
        display: inline-grid;
        width: 2.25rem;
        height: 2.25rem;
        place-items: center;
        border: 1px solid transparent;
        border-radius: 0.5rem;
        background: transparent;
        color: #647084;
        cursor: pointer;
        transition:
          border-color 150ms ease,
          background-color 150ms ease,
          color 150ms ease;
      }

      .erp-shell-header__icon-button:hover {
        border-color: #daddd6;
        background: #fafaf7;
        color: #172033;
      }

      .erp-shell-header__notification-dot {
        position: absolute;
        top: 0.55rem;
        right: 0.55rem;
        width: 0.45rem;
        height: 0.45rem;
        border: 1px solid #ffffff;
        border-radius: 999px;
        background: #a16207;
      }

      .erp-shell-header__account {
        gap: 0.75rem;
        border-left: 1px solid #daddd6;
        padding-left: 0.9rem;
      }

      .erp-shell-header__account-copy {
        min-width: 0;
        text-align: right;
      }

      .erp-shell-header__account-copy p {
        max-width: 13rem;
        overflow: hidden;
        margin: 0;
        color: #172033;
        font-size: 0.82rem;
        font-weight: 600;
        line-height: 1.2;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .erp-shell-header__account-copy span {
        display: block;
        margin-top: 0.1rem;
        color: #647084;
        font-size: 0.72rem;
        font-weight: 500;
      }

      .erp-shell-header__avatar {
        display: grid;
        width: 2.1rem;
        height: 2.1rem;
        place-items: center;
        border: 1px solid #bfdbfe;
        border-radius: 0.5rem;
        background: #eff6ff;
        color: #1e40af;
        font-size: 0.78rem;
        font-weight: 700;
      }

      .erp-shell-header__logout {
        display: inline-flex;
        height: 2.1rem;
        align-items: center;
        justify-content: center;
        gap: 0.4rem;
        border: 1px solid #daddd6;
        border-radius: 0.5rem;
        background: #ffffff;
        color: #4b5563;
        padding: 0 0.75rem;
        font-size: 0.76rem;
        font-weight: 600;
        cursor: pointer;
        transition:
          border-color 150ms ease,
          background-color 150ms ease,
          color 150ms ease;
      }

      .erp-shell-header__logout:hover:not(:disabled) {
        border-color: #c7d0c4;
        background: #fafaf7;
        color: #172033;
      }

      .erp-shell-header__logout:disabled {
        cursor: not-allowed;
        opacity: 0.6;
      }

      @media (max-width: 1024px) {
        .erp-shell-header {
          left: 0;
        }
      }

      @media (max-width: 760px) {
        .erp-shell-header__inner {
          padding: 0 1rem;
        }

        .erp-shell-header__status,
        .erp-shell-header__period-code,
        .erp-shell-header__icon-button,
        .erp-shell-header__account-copy,
        .erp-shell-header__logout {
          display: none;
        }

        .erp-shell-header__account {
          border-left: 0;
          padding-left: 0;
        }
      }
    `,
  ],
})
export class HeaderComponent {
  readonly clipboardListIcon = ClipboardListIcon;

  readonly periodoActivo = inject(PeriodoActivoService);
  readonly auth = inject(AuthService);
  readonly router = inject(Router);
  readonly cerrandoSesion = signal(false);

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

  readonly usuarioLabel = computed(() => this.auth.currentEmail() ?? 'Usuario conectado');

  readonly inicialUsuario = computed(() => {
    const label = this.usuarioLabel().trim();
    return label ? label[0].toUpperCase() : 'U';
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

  stringYear(y: number): string {
    return String(y);
  }

  trackYear(_index: number, y: number): number {
    return y;
  }

  trackMonth(_index: number, m: { value: string; label: string }): string {
    return m.value;
  }

  onAnioChange(raw: string): void {
    const mes = this.periodoActivo.periodoYm().slice(5, 7);
    this.periodoActivo.setPeriodoYm(`${raw}-${mes}`);
  }

  onMesChange(raw: string): void {
    const anio = this.periodoActivo.periodoYm().slice(0, 4);
    this.periodoActivo.setPeriodoYm(`${anio}-${raw}`);
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
