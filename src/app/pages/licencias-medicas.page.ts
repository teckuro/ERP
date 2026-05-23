import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { CardComponent, CardContentComponent } from '../shared/components/ui/card.component';
import { BadgeComponent } from '../shared/components/ui/badge.component';
import { ButtonComponent } from '../shared/components/ui/button.component';
import { bindShellPageContext } from '../layout/shell-page-context.binding';

@Component({
  selector: 'app-licencias-medicas-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    LucideAngularModule,
    CardComponent,
    CardContentComponent,
    BadgeComponent,
    ButtonComponent,
  ],
  template: `
    <section class="erp-fullscreen-page licencias-page" aria-label="Licencias médicas">
      <div class="erp-fullscreen-frame licencias-frame">
      <header class="erp-fullscreen-header licencias-head">
        <p class="text-sm text-gray-600">{{ licencias().length }} licencias registradas</p>
      </header>

      <div class="erp-fullscreen-scroll licencias-content">

      <!-- Stats -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
        <app-card [hover]="true">
          <app-card-content>
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-gray-600">Total Licencias</p>
                <p class="text-xl font-semibold text-gray-900 mt-2">{{ licencias().length }}</p>
              </div>
              <div class="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                <lucide-icon class="w-6 h-6 text-blue-600" name="file-text"></lucide-icon>
              </div>
            </div>
          </app-card-content>
        </app-card>

        <app-card [hover]="true">
          <app-card-content>
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-gray-600">Emitidas</p>
                <p class="text-xl font-semibold text-blue-600 mt-2">{{ emitidas() }}</p>
              </div>
              <div class="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                <lucide-icon class="w-6 h-6 text-blue-600" name="calendar"></lucide-icon>
              </div>
            </div>
          </app-card-content>
        </app-card>

        <app-card [hover]="true">
          <app-card-content>
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-gray-600">Aprobadas</p>
                <p class="text-xl font-semibold text-green-600 mt-2">{{ aprobadas() }}</p>
              </div>
              <div class="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
                <lucide-icon class="w-6 h-6 text-green-600" name="calendar"></lucide-icon>
              </div>
            </div>
          </app-card-content>
        </app-card>

        <app-card [hover]="true">
          <app-card-content>
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-gray-600">Pagadas</p>
                <p class="text-xl font-semibold text-gray-600 mt-2">{{ pagadas() }}</p>
              </div>
              <div class="w-12 h-12 bg-gray-50 rounded-lg flex items-center justify-center">
                <lucide-icon class="w-6 h-6 text-gray-600" name="calendar"></lucide-icon>
              </div>
            </div>
          </app-card-content>
        </app-card>
      </div>

      <!-- Filter Tabs -->
      <div class="flex gap-2 border-b border-gray-200">
        @for (estado of estados; track estado) {
          <button
            type="button"
            (click)="filter.set(estado)"
            class="px-4 py-2 text-sm font-medium transition-colors"
            [class.text-blue-600]="filter() === estado"
            [class.border-b-2]="filter() === estado"
            [class.border-blue-600]="filter() === estado"
            [class.text-gray-600]="filter() !== estado"
            [class.hover:text-gray-900]="filter() !== estado"
          >
            {{ labelEstado(estado) }}
          </button>
        }
      </div>

      <!-- Licencias Table -->
      <app-card>
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="border-b border-gray-200">
                <th class="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Empleado</th>
                <th class="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Tipo</th>
                <th class="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Periodo</th>
                <th class="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase">Días</th>
                <th class="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Folio</th>
                <th class="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">Subsidio</th>
                <th class="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Estado</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200">
              @for (licencia of filteredLicencias(); track licencia.id) {
                <tr class="hover:bg-gray-50 transition-colors">
                  <td class="px-6 py-4">
                    <p class="text-sm font-medium text-gray-900">{{ licencia.empleado }}</p>
                    <p class="text-xs text-gray-500">{{ licencia.rut }}</p>
                  </td>
                  <td class="px-6 py-4">
                    <app-badge [variant]="tipoBadgeVariant(licencia.tipo)">
                      {{ labelTipo(licencia.tipo) }}
                    </app-badge>
                  </td>
                  <td class="px-6 py-4 text-sm text-gray-900">
                    <div>
                      <p>{{ licencia.fechaInicio }}</p>
                      <p class="text-xs text-gray-500">al {{ licencia.fechaTermino }}</p>
                    </div>
                  </td>
                  <td class="px-6 py-4 text-sm font-medium text-center text-gray-900">{{ licencia.dias }}</td>
                  <td class="px-6 py-4 text-sm text-gray-900">{{ licencia.folio }}</td>
                  <td class="px-6 py-4 text-sm font-medium text-right text-gray-900">
                    $ {{ licencia.montoSubsidio.toLocaleString('es-CL') }}
                  </td>
                  <td class="px-6 py-4">
                    <app-badge [variant]="estadoBadgeVariant(licencia.estado)">{{ labelEstado(licencia.estado) }}</app-badge>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </app-card>

      <!-- Info Box -->
      <app-card>
        <app-card-content>
          <div class="flex gap-4">
            <div class="flex-shrink-0">
              <div class="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                <lucide-icon class="w-5 h-5 text-blue-600" name="alert-circle"></lucide-icon>
              </div>
            </div>
            <div>
              <h3 class="font-medium text-gray-900 mb-1">Impacto en Remuneraciones</h3>
              <p class="text-sm text-gray-600">
                Las licencias médicas afectan el cálculo de remuneraciones. Los subsidios son pagados por la
                mutual o isapre y deben ser descontados del costo empresa. Asegúrate de registrar todas las
                licencias antes de cerrar el periodo.
              </p>
            </div>
          </div>
        </app-card-content>
      </app-card>

      <!-- Modal - Registrar Licencia -->
      @if (showModal()) {
        <div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" (click)="showModal.set(false)">
          <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full" (click)="$event.stopPropagation()">
            <div class="border-b border-gray-200 px-6 py-4">
              <h2 class="text-lg font-semibold text-gray-900">Registrar Licencia Médica</h2>
            </div>

            <div class="p-6 space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Empleado</label>
                <select
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option>Seleccionar empleado...</option>
                  <option>Juan Pérez González</option>
                  <option>María Rodríguez Silva</option>
                  <option>Carlos López Muñoz</option>
                </select>
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Tipo de Licencia</label>
                  <select
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="reposo">Reposo</option>
                    <option value="maternal">Maternal</option>
                    <option value="paternal">Paternal</option>
                  </select>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Folio</label>
                  <input
                    type="text"
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="LM-2026-001238"
                  />
                </div>
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Fecha Inicio</label>
                  <input
                    type="date"
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Fecha Término</label>
                  <input
                    type="date"
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Días Totales</label>
                  <input
                    type="number"
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Monto Subsidio</label>
                  <input
                    type="number"
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0"
                  />
                </div>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Estado</label>
                <select class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="emitida">Emitida</option>
                  <option value="aprobada">Aprobada</option>
                  <option value="rechazada">Rechazada</option>
                  <option value="pagada">Pagada</option>
                </select>
              </div>
            </div>

            <div class="bg-gray-50 px-6 py-4 flex items-center justify-end gap-3 border-t border-gray-200">
              <app-button variant="outline" (click)="showModal.set(false)">Cancelar</app-button>
              <app-button variant="primary">Guardar</app-button>
            </div>
          </div>
        </div>
      }
      </div>
      </div>
    </section>
  `,
  styles: [
    `
      .licencias-content {
        display: grid;
        gap: 1rem;
        padding: 12px;
        align-content: start;
      }
    `,
  ],
})
export class LicenciasMedicasPage {
  constructor() {
    bindShellPageContext(
      inject(DestroyRef),
      () => ({
        breadcrumbs: [{ label: 'Licencias médicas' }],
        primaryAction: {
          label: 'Registrar licencia',
          actionId: 'registrar-licencia',
        },
      }),
      {
        onPrimaryAction: () => this.showModal.set(true),
      },
    );
  }

  readonly showModal = signal(false);
  readonly estados = ['todas', 'emitida', 'aprobada', 'rechazada', 'pagada'] as const;
  readonly filter = signal<(typeof this.estados)[number]>('todas');

  readonly licencias = signal<Licencia[]>([
    { id: 1, empleado: 'Ana Martínez Torres', rut: '45.678.901-2', tipo: 'reposo', fechaInicio: '05/04/2026', fechaTermino: '12/04/2026', dias: 7, folio: 'LM-2026-001234', estado: 'aprobada', montoSubsidio: 245000 },
    { id: 2, empleado: 'Pedro Sánchez Rojas', rut: '56.789.012-3', tipo: 'reposo', fechaInicio: '01/04/2026', fechaTermino: '03/04/2026', dias: 3, folio: 'LM-2026-001235', estado: 'pagada', montoSubsidio: 105000 },
    { id: 3, empleado: 'Laura Fernández Mora', rut: '67.890.123-4', tipo: 'maternal', fechaInicio: '15/03/2026', fechaTermino: '15/09/2026', dias: 180, folio: 'LM-2026-001236', estado: 'aprobada', montoSubsidio: 3200000 },
    { id: 4, empleado: 'Roberto Silva Cortés', rut: '78.901.234-5', tipo: 'reposo', fechaInicio: '08/04/2026', fechaTermino: '10/04/2026', dias: 2, folio: 'LM-2026-001237', estado: 'emitida', montoSubsidio: 70000 },
  ]);

  readonly filteredLicencias = computed(() => {
    const f = this.filter();
    return this.licencias().filter((lic) => (f === 'todas' ? true : lic.estado === f));
  });

  readonly emitidas = computed(() => this.licencias().filter((l) => l.estado === 'emitida').length);
  readonly aprobadas = computed(() => this.licencias().filter((l) => l.estado === 'aprobada').length);
  readonly pagadas = computed(() => this.licencias().filter((l) => l.estado === 'pagada').length);

  estadoBadgeVariant(estado: Licencia['estado']): 'info' | 'success' | 'error' | 'default' {
    switch (estado) {
      case 'emitida':
        return 'info';
      case 'aprobada':
        return 'success';
      case 'rechazada':
        return 'error';
      case 'pagada':
        return 'default';
      default:
        return 'default';
    }
  }

  tipoBadgeVariant(tipo: Licencia['tipo']): 'warning' | 'success' | 'info' | 'default' {
    switch (tipo) {
      case 'reposo':
        return 'warning';
      case 'maternal':
        return 'success';
      case 'paternal':
        return 'info';
      default:
        return 'default';
    }
  }

  labelTipo(tipo: Licencia['tipo']): string {
    if (tipo === 'reposo') return 'Reposo';
    if (tipo === 'maternal') return 'Maternal';
    return 'Paternal';
  }

  labelEstado(estado: (typeof this.estados)[number] | Licencia['estado']): string {
    return estado.charAt(0).toUpperCase() + estado.slice(1);
  }
}

type Licencia = {
  id: number;
  empleado: string;
  rut: string;
  tipo: 'reposo' | 'maternal' | 'paternal';
  fechaInicio: string;
  fechaTermino: string;
  dias: number;
  folio: string;
  estado: 'emitida' | 'aprobada' | 'rechazada' | 'pagada';
  montoSubsidio: number;
};
