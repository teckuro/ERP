import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';

import { AuthService } from '../core/auth/auth.service';
import { PeriodoActivoService } from '../core/services/periodo-activo.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="fixed left-64 right-0 top-0 z-10 h-16 border-b border-gray-200 bg-white">
      <div class="flex h-full items-center justify-between px-6">
        <div class="flex min-w-0 flex-1 items-center gap-3">
          <lucide-icon name="calendar" class="h-5 w-5 shrink-0 text-gray-500"></lucide-icon>
          <div class="flex min-w-0 flex-col gap-0.5">
            <span class="text-[10px] font-semibold uppercase tracking-wide text-gray-500">Período activo</span>
            <div class="periodo-header-dual flex flex-wrap items-center gap-2">
              <label class="sr-only" for="header-periodo-anio">Año</label>
              <select
                id="header-periodo-anio"
                class="periodo-header-select periodo-header-year"
                [ngModel]="anioPeriodo()"
                (ngModelChange)="onAnioChange($event)"
                aria-label="Año del período activo"
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
                aria-label="Mes del período activo"
              >
                @for (m of monthOptions; track m.value) {
                  <option [value]="m.value">{{ m.label }}</option>
                }
              </select>
            </div>
          </div>
        </div>

        <div class="flex items-center gap-4">
          <button
            type="button"
            class="relative inline-flex h-9 w-9 items-center justify-center rounded-md border border-transparent transition-colors hover:border-gray-200 hover:bg-gray-50"
            aria-label="Notificaciones"
          >
            <lucide-icon name="bell" class="h-5 w-5 text-gray-600"></lucide-icon>
            <span class="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-600"></span>
          </button>

          <div class="flex items-center gap-3 border-l border-gray-200 pl-4">
            <div class="text-right">
              <p class="max-w-52 truncate text-sm font-semibold text-gray-900">{{ usuarioLabel() }}</p>
              <p class="text-xs text-gray-500">Sesion activa</p>
            </div>
            <div class="flex h-9 w-9 items-center justify-center rounded-md bg-blue-600">
              <span class="text-sm font-semibold text-white">{{ inicialUsuario() }}</span>
            </div>
            <button
              type="button"
              class="inline-flex h-9 items-center gap-2 rounded-md border border-gray-200 px-3 text-xs font-semibold text-gray-700 transition-colors hover:bg-gray-50"
              [disabled]="cerrandoSesion()"
              (click)="cerrarSesion()"
            >
              <lucide-icon name="lock" class="h-4 w-4 text-gray-500"></lucide-icon>
              {{ cerrandoSesion() ? 'Cerrando...' : 'Cerrar sesion' }}
            </button>
          </div>
        </div>
      </div>
    </header>
  `,
  styles: [
    `
      .periodo-header-select {
        height: 2.35rem;
        border-radius: 0.375rem;
        border: 1px solid #e5e7eb;
        padding: 0 0.65rem;
        font-size: 0.875rem;
        font-weight: 600;
        color: #111827;
        background: #fff;
      }

      .periodo-header-select:focus-visible {
        outline: none;
        border-color: #3b82f6;
        box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
      }

      .periodo-header-year {
        width: 5.25rem;
        min-width: 5.25rem;
      }

      .periodo-header-month {
        min-width: 8.5rem;
      }
    `,
  ],
})
export class HeaderComponent {
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

  readonly anioPeriodo = computed(() => this.periodoActivo.periodoYm().slice(0, 4));

  readonly mesPeriodo = computed(() => this.periodoActivo.periodoYm().slice(5, 7));

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
