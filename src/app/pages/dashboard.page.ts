import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';

import { PeriodoActivoService } from '../core/services/periodo-activo.service';
import { BadgeComponent } from '../shared/components/ui/badge.component';
import { CardComponent, CardContentComponent, CardHeaderComponent } from '../shared/components/ui/card.component';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [CommonModule, RouterLink, LucideAngularModule, CardComponent, CardHeaderComponent, CardContentComponent, BadgeComponent],
  template: `
    <div class="space-y-4">
      <header class="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <nav class="text-xs text-gray-500">Inicio / Dashboard</nav>
          <h1 class="text-xl font-semibold text-gray-900">Dashboard operativo</h1>
          <p class="mt-1 text-sm text-gray-600">
            Vista de entrada para operar el periodo {{ periodoActivo.etiqueta() }} sin mezclar salidas futuras.
          </p>
        </div>
        <a
          routerLink="/remuneraciones/proceso-mensual"
          class="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-blue-600 bg-blue-600 px-3 text-sm font-semibold text-white hover:bg-blue-700"
        >
          <lucide-icon class="h-4 w-4" name="calculator"></lucide-icon>
          Preparar nomina
        </a>
      </header>

      <section class="dashboard-status-strip" aria-label="Estado operativo del periodo">
        <div>
          <strong>Periodo {{ periodoActivo.etiqueta() }}</strong>
          <span>Siguiente accion: validar y preparar nomina</span>
        </div>
        <a routerLink="/remuneraciones/proceso-mensual">Ir a preparar nomina</a>
      </section>

      <section>
        <app-card>
          <app-card-content className="p-4">
            <div class="mb-4 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 class="text-sm font-semibold text-gray-900">Flujo validado del periodo</h2>
                <p class="text-xs text-gray-500">Usa estas pantallas para avanzar y revisar el estado real.</p>
              </div>
              <app-badge variant="info">Operativo</app-badge>
            </div>

            <div class="dashboard-quick-links">
              <a routerLink="/remuneraciones/proceso-mensual" class="dashboard-tile">
                <span>
                  <strong>Preparar nomina</strong>
                  <small>Valida trabajadores, parametros y movimientos de remuneracion del periodo.</small>
                </span>
                <lucide-icon class="h-4 w-4 shrink-0 text-gray-400" name="arrow-up-right"></lucide-icon>
              </a>
              <a routerLink="/remuneraciones/liquidaciones" class="dashboard-tile">
                <span>
                  <strong>Liquidaciones oficiales</strong>
                  <small>Revisa la salida interna generada desde una nomina cerrada operativamente.</small>
                </span>
                <lucide-icon class="h-4 w-4 shrink-0 text-gray-400" name="arrow-up-right"></lucide-icon>
              </a>
              <a routerLink="/remuneraciones/novedades-mensuales" class="dashboard-tile">
                <span>
                  <strong>Movimientos</strong>
                  <small>Registra bonos, descuentos, anticipos y recurrentes del período.</small>
                </span>
                <lucide-icon class="h-4 w-4 shrink-0 text-gray-400" name="arrow-up-right"></lucide-icon>
              </a>
              <a routerLink="/empleados" class="dashboard-tile">
                <span>
                  <strong>Empleados</strong>
                  <small>Completa fichas y datos necesarios antes de preparar el periodo.</small>
                </span>
                <lucide-icon class="h-4 w-4 shrink-0 text-gray-400" name="arrow-up-right"></lucide-icon>
              </a>
              <a routerLink="/parametros" class="dashboard-tile">
                <span>
                  <strong>Parametros</strong>
                  <small>Revisa valores del sistema que habilitan la preparacion mensual.</small>
                </span>
                <lucide-icon class="h-4 w-4 shrink-0 text-gray-400" name="arrow-up-right"></lucide-icon>
              </a>
            </div>
          </app-card-content>
        </app-card>
      </section>

      <section class="grid gap-4 lg:grid-cols-2">
        <app-card>
          <app-card-header>
            <h2 class="text-sm font-semibold text-gray-900">Accesos implementados</h2>
          </app-card-header>
          <app-card-content className="p-4">
            <div class="grid gap-2 sm:grid-cols-2">
              <a routerLink="/empleados" class="dashboard-link">Empleados</a>
              <a routerLink="/parametros" class="dashboard-link">Parametros</a>
              <a routerLink="/remuneraciones/conceptos" class="dashboard-link">Conceptos de remuneracion</a>
              <a routerLink="/reportes" class="dashboard-link">Reportes</a>
            </div>
          </app-card-content>
        </app-card>

        <details class="dashboard-disclosure">
          <summary>
            <span>Salidas futuras no disponibles</span>
            <app-badge variant="default" size="sm">4</app-badge>
          </summary>
          <div class="space-y-2 p-3">
              <div class="dashboard-future">
                <div><strong>Previred</strong><app-badge variant="default" size="sm">Fase posterior</app-badge></div>
                <p>No hay generacion ni descarga activa desde el dashboard.</p>
              </div>
              <div class="dashboard-future">
                <div><strong>Libro de remuneraciones</strong><app-badge variant="default" size="sm">Fase posterior</app-badge></div>
                <p>Queda separado de la operacion actual hasta una fase dedicada.</p>
              </div>
              <div class="dashboard-future">
                <div><strong>Archivo banco</strong><app-badge variant="default" size="sm">Fase posterior</app-badge></div>
                <p>No se ofrece como accion activa mientras no exista el flujo validado.</p>
              </div>
              <div class="dashboard-future">
                <div><strong>Centralizacion contable</strong><app-badge variant="default" size="sm">Fase posterior</app-badge></div>
                <p>Se reserva para una fase posterior con reglas y revision propias.</p>
              </div>
          </div>
        </details>
      </section>

      <app-card>
        <app-card-content className="p-4">
          <div class="flex items-start gap-3">
            <lucide-icon class="mt-0.5 h-5 w-5 shrink-0 text-slate-500" name="info"></lucide-icon>
            <div>
              <h2 class="text-sm font-semibold text-gray-900">Actividad del dashboard</h2>
              <p class="mt-1 text-sm text-gray-600">
                Esta vista no inventa montos, vencimientos ni eventos. La trazabilidad detallada queda en Preparar nomina
                y Liquidaciones oficiales.
              </p>
            </div>
          </div>
        </app-card-content>
      </app-card>
    </div>
  `,
  styles: [
    `
      .dashboard-tile {
        display: flex;
        min-height: 4rem;
        align-items: flex-start;
        justify-content: space-between;
        gap: 0.75rem;
        border: 1px solid #e2e8f0;
        border-radius: 0.375rem;
        background: #fff;
        padding: 0.65rem 0.75rem;
        text-decoration: none;
        transition:
          border-color 150ms ease,
          background 150ms ease;
      }

      .dashboard-status-strip {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: space-between;
        gap: 0.75rem;
        border: 1px solid #bfdbfe;
        border-radius: 0.375rem;
        background: #eff6ff;
        padding: 0.65rem 0.75rem;
      }

      .dashboard-status-strip strong,
      .dashboard-status-strip span {
        color: #1f2937;
        font-size: 0.875rem;
      }

      .dashboard-status-strip span {
        margin-left: 0.75rem;
        color: #4b5563;
      }

      .dashboard-status-strip a {
        color: #1d4ed8;
        font-size: 0.875rem;
        font-weight: 700;
        text-decoration: underline;
      }

      .dashboard-quick-links {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 0.5rem;
      }

      .dashboard-tile:hover {
        border-color: #93c5fd;
        background: #eff6ff;
      }

      .dashboard-tile strong,
      .dashboard-future strong {
        display: block;
        color: #111827;
        font-size: 0.875rem;
        font-weight: 700;
        line-height: 1.25;
      }

      .dashboard-tile small,
      .dashboard-future p {
        display: block;
        margin-top: 0.25rem;
        color: #4b5563;
        font-size: 0.75rem;
        line-height: 1.45;
      }

      .dashboard-link {
        display: inline-flex;
        min-height: 2.75rem;
        align-items: center;
        justify-content: space-between;
        border: 1px solid #e5e7eb;
        border-radius: 0.375rem;
        padding: 0.5rem 0.75rem;
        color: #1f2937;
        font-size: 0.875rem;
        font-weight: 600;
        text-decoration: none;
      }

      .dashboard-link:hover {
        border-color: #93c5fd;
        background: #eff6ff;
      }

      .dashboard-future {
        border-bottom: 1px solid #e5e7eb;
        padding: 0.45rem 0;
      }

      .dashboard-future > div {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: space-between;
        gap: 0.5rem;
      }

      .dashboard-disclosure {
        border: 1px solid #e5e7eb;
        border-radius: 0.375rem;
        background: #fff;
      }

      .dashboard-disclosure summary {
        display: flex;
        min-height: 2.75rem;
        cursor: pointer;
        align-items: center;
        justify-content: space-between;
        gap: 0.75rem;
        padding: 0 0.75rem;
        color: #111827;
        font-size: 0.875rem;
        font-weight: 700;
      }

      @media (max-width: 980px) {
        .dashboard-quick-links {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
      }

      @media (max-width: 640px) {
        .dashboard-quick-links {
          grid-template-columns: 1fr;
        }

        .dashboard-status-strip span {
          display: block;
          margin-left: 0;
          margin-top: 0.15rem;
        }
      }
    `,
  ],
})
export class DashboardPage {
  readonly periodoActivo = inject(PeriodoActivoService);
}
