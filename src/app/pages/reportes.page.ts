import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';

import { PeriodoActivoService } from '../core/services/periodo-activo.service';
import { BadgeComponent } from '../shared/components/ui/badge.component';
import { CardComponent, CardContentComponent, CardHeaderComponent } from '../shared/components/ui/card.component';

@Component({
  selector: 'app-reportes-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterLink, LucideAngularModule, CardComponent, CardContentComponent, CardHeaderComponent, BadgeComponent],
  template: `
    <div class="space-y-4">
      <header class="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <nav class="text-xs text-gray-500">Inicio / Reportes</nav>
          <h1 class="text-xl font-semibold text-gray-900">Reportes</h1>
          <p class="mt-1 text-sm text-gray-600">
            Consulta operativa del periodo {{ periodoActivo.etiqueta() }}. Las salidas formales quedan deshabilitadas
            hasta una fase dedicada.
          </p>
        </div>
        <a routerLink="/remuneraciones/liquidaciones" class="report-link report-link--primary">
          <lucide-icon class="h-4 w-4" name="file-search"></lucide-icon>
          Ver liquidaciones internas
        </a>
      </header>

      <app-card>
        <app-card-content>
          <div class="flex items-start gap-3">
            <lucide-icon class="mt-0.5 h-5 w-5 shrink-0 text-slate-500" name="calendar"></lucide-icon>
            <div class="text-sm text-gray-700">
              <p class="font-medium text-gray-900">Periodo activo: {{ periodoActivo.etiqueta() }}</p>
              <p class="mt-1">Cambia el periodo desde la cabecera global. Esta pantalla no duplica selector ni genera archivos.</p>
            </div>
          </div>
        </app-card-content>
      </app-card>

      <div class="report-tabbar" role="tablist" aria-label="Secciones de reportes">
        <button
          type="button"
          role="tab"
          id="report-tab-disponibles"
          aria-controls="report-panel-disponibles"
          [attr.aria-selected]="activeTab() === 'disponibles'"
          [class.is-active]="activeTab() === 'disponibles'"
          (click)="activeTab.set('disponibles')"
          (keydown)="onTabKeydown($event)"
        >
          Disponibles
        </button>
        <button
          type="button"
          role="tab"
          id="report-tab-futuros"
          aria-controls="report-panel-futuros"
          [attr.aria-selected]="activeTab() === 'futuros'"
          [class.is-active]="activeTab() === 'futuros'"
          (click)="activeTab.set('futuros')"
          (keydown)="onTabKeydown($event)"
        >
          No disponible en esta fase
        </button>
      </div>

      @if (activeTab() === 'disponibles') {
        <app-card>
          <div id="report-panel-disponibles" role="tabpanel" aria-labelledby="report-tab-disponibles">
          <app-card-header>
            <div class="flex items-center justify-between gap-2">
              <h2 class="text-sm font-semibold text-gray-900">Vistas disponibles</h2>
              <app-badge variant="info" size="sm">Consulta</app-badge>
            </div>
          </app-card-header>
          <app-card-content className="space-y-3 p-4">
            <a routerLink="/remuneraciones/proceso-mensual" class="report-tile">
              <strong>Preparar nomina</strong>
              <span>Estado del periodo, bloqueos, advertencias y trazabilidad operativa.</span>
            </a>
            <a routerLink="/remuneraciones/liquidaciones" class="report-tile">
              <strong>Liquidaciones oficiales internas</strong>
              <span>Listado y detalle interno generado desde una nomina cerrada.</span>
            </a>
            <a routerLink="/remuneraciones/novedades-mensuales" class="report-tile">
              <strong>Movimientos del mes</strong>
              <span>Bonos, descuentos, anticipos y ajustes que impactan el periodo.</span>
            </a>
            <a routerLink="/remuneraciones/haberes-descuentos" class="report-tile">
              <strong>Asignaciones recurrentes</strong>
              <span>Haberes, descuentos y aportes vigentes por trabajador.</span>
            </a>
          </app-card-content>
          </div>
        </app-card>
      } @else {

        <app-card>
          <div id="report-panel-futuros" role="tabpanel" aria-labelledby="report-tab-futuros">
          <app-card-header>
            <div class="flex items-center justify-between gap-2">
              <h2 class="text-sm font-semibold text-gray-900">No disponible en esta fase</h2>
              <app-badge variant="default" size="sm">Bloqueado</app-badge>
            </div>
          </app-card-header>
          <app-card-content className="space-y-3 p-4">
            <div class="report-future-list">
            <div class="report-future">
              <strong>Libro de remuneraciones</strong>
              <span>Requiere una fase especifica de salida formal y validacion normativa.</span>
            </div>
            <div class="report-future">
              <strong>Previred</strong>
              <span>No hay generacion ni envio habilitado en esta fase UX.</span>
            </div>
            <div class="report-future">
              <strong>Archivo de pago</strong>
              <span>La integracion de pagos no forma parte del alcance actual.</span>
            </div>
            <div class="report-future">
              <strong>Centralizacion contable</strong>
              <span>Queda separada hasta definir reglas contables y revision propia.</span>
            </div>
            <div class="report-future">
              <strong>Descargas documentales</strong>
              <span>No se habilitan descargas formales ni paquetes desde esta pantalla.</span>
            </div>
            <div class="report-future">
              <strong>Programacion de envios</strong>
              <span>El sistema no agenda ni ejecuta envios en esta etapa.</span>
            </div>
            </div>
          </app-card-content>
          </div>
        </app-card>
      }

      <app-card>
        <app-card-content className="p-4">
          <div class="flex items-start gap-3">
            <lucide-icon class="mt-0.5 h-5 w-5 shrink-0 text-amber-600" name="circle-alert"></lucide-icon>
            <div>
              <h2 class="text-sm font-semibold text-gray-900">Acciones deshabilitadas</h2>
              <p class="mt-1 text-sm text-gray-600">
                Esta pantalla no descarga paquetes, no agenda envios y no crea archivos externos. Primero se conserva el
                circuito validado: preparar nomina, cerrar operativamente y consultar liquidaciones internas.
              </p>
            </div>
          </div>
        </app-card-content>
      </app-card>
    </div>
  `,
  styles: [
    `
      .report-link,
      .report-tile {
        text-decoration: none;
      }

      .report-link {
        display: inline-flex;
        height: 2.25rem;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        border: 1px solid #e5e7eb;
        border-radius: 0.375rem;
        background: #fff;
        padding: 0 0.75rem;
        color: #1f2937;
        font-size: 0.875rem;
        font-weight: 700;
      }

      .report-link:hover,
      .report-tile:hover {
        border-color: #93c5fd;
        background: #eff6ff;
      }

      .report-tile,
      .report-future {
        display: block;
        border: 1px solid #e5e7eb;
        border-radius: 0.375rem;
        padding: 0.75rem;
      }

      .report-tile {
        background: #fff;
      }

      .report-future {
        background: #f9fafb;
      }

      .report-tabbar {
        display: flex;
        gap: 1rem;
        overflow-x: auto;
        border-bottom: 1px solid #e5e7eb;
      }

      .report-tabbar button {
        min-height: 2.5rem;
        border: 0;
        border-bottom: 2px solid transparent;
        background: transparent;
        color: #4b5563;
        font-size: 0.875rem;
        font-weight: 700;
        padding: 0 0.25rem;
        white-space: nowrap;
      }

      .report-tabbar button.is-active {
        border-bottom-color: #2563eb;
        color: #111827;
      }

      .report-future-list {
        display: grid;
        gap: 0;
      }

      .report-future {
        border-width: 0 0 1px;
        border-radius: 0;
        padding: 0.6rem 0;
      }

      .report-tile strong,
      .report-future strong {
        display: block;
        color: #111827;
        font-size: 0.875rem;
        font-weight: 700;
        line-height: 1.25;
      }

      .report-tile span,
      .report-future span {
        display: block;
        margin-top: 0.25rem;
        color: #4b5563;
        font-size: 0.75rem;
        line-height: 1.45;
      }
    `,
  ],
})
export class ReportesPage {
  readonly periodoActivo = inject(PeriodoActivoService);
  readonly activeTab = signal<'disponibles' | 'futuros'>('disponibles');

  onTabKeydown(event: KeyboardEvent): void {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const next = event.key === 'ArrowLeft' || event.key === 'Home' ? 'disponibles' : 'futuros';
    this.activeTab.set(next);
    queueMicrotask(() => {
      const id = next === 'disponibles' ? 'report-tab-disponibles' : 'report-tab-futuros';
      document.getElementById(id)?.focus();
    });
  }
}
