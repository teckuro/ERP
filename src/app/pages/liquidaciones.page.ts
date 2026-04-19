import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import {
  CardComponent,
  CardContentComponent,
  CardHeaderComponent,
} from '../shared/components/ui/card.component';
import { BadgeComponent } from '../shared/components/ui/badge.component';
import { ButtonComponent } from '../shared/components/ui/button.component';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-liquidaciones-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterLink,
    LucideAngularModule,
    CardComponent,
    CardHeaderComponent,
    CardContentComponent,
    BadgeComponent,
    ButtonComponent,
  ],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-semibold text-gray-900">Liquidaciones de Sueldo</h1>
          <p class="text-sm text-gray-600 mt-1">Periodo: Abril 2026</p>
        </div>
        <div class="flex gap-3">
          <app-button variant="outline">
            <lucide-icon icon class="w-4 h-4" name="download"></lucide-icon>
            Descargar Todas
          </app-button>
          <app-button variant="primary">
            <lucide-icon icon class="w-4 h-4" name="send"></lucide-icon>
            Envío Masivo
          </app-button>
        </div>
      </div>

      <!-- Stats -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <app-card>
          <app-card-content>
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-gray-600">Total Liquidaciones</p>
                <p class="text-2xl font-semibold text-gray-900 mt-2">{{ liquidaciones().length }}</p>
              </div>
              <div class="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                <lucide-icon class="w-6 h-6 text-blue-600" name="file-text"></lucide-icon>
              </div>
            </div>
          </app-card-content>
        </app-card>

        <app-card>
          <app-card-content>
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-gray-600">Enviadas</p>
                <p class="text-2xl font-semibold text-green-600 mt-2">{{ enviadas() }}</p>
              </div>
              <div class="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
                <lucide-icon class="w-6 h-6 text-green-600" name="mail"></lucide-icon>
              </div>
            </div>
          </app-card-content>
        </app-card>

        <app-card>
          <app-card-content>
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-gray-600">Pendientes</p>
                <p class="text-2xl font-semibold text-yellow-600 mt-2">{{ pendientes() }}</p>
              </div>
              <div class="w-12 h-12 bg-yellow-50 rounded-lg flex items-center justify-center">
                <lucide-icon class="w-6 h-6 text-yellow-600" name="file-text"></lucide-icon>
              </div>
            </div>
          </app-card-content>
        </app-card>
      </div>

      <!-- Liquidaciones List -->
      <app-card>
        <app-card-header>
          <h3 class="font-semibold text-gray-900">Listado de Liquidaciones</h3>
        </app-card-header>
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="border-b border-gray-200">
                <th class="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Empleado</th>
                <th class="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">RUT</th>
                <th class="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">Haberes</th>
                <th class="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">Descuentos</th>
                <th class="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">Líquido</th>
                <th class="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Estado</th>
                <th class="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200">
              @for (liquidacion of liquidaciones(); track liquidacion.id) {
                <tr class="hover:bg-gray-50 transition-colors">
                  <td class="px-6 py-4">
                    <p class="text-sm font-medium text-gray-900">{{ liquidacion.empleado }}</p>
                    <p class="text-xs text-gray-500">{{ liquidacion.periodo }}</p>
                  </td>
                  <td class="px-6 py-4 text-sm text-gray-900">{{ liquidacion.rut }}</td>
                  <td class="px-6 py-4 text-sm font-medium text-green-600 text-right">
                    $ {{ liquidacion.totalHaberes.toLocaleString('es-CL') }}
                  </td>
                  <td class="px-6 py-4 text-sm font-medium text-red-600 text-right">
                    $ {{ liquidacion.totalDescuentos.toLocaleString('es-CL') }}
                  </td>
                  <td class="px-6 py-4 text-sm font-semibold text-blue-600 text-right">
                    $ {{ liquidacion.liquido.toLocaleString('es-CL') }}
                  </td>
                  <td class="px-6 py-4">
                    @if (liquidacion.enviada) {
                      <div>
                        <app-badge variant="success">Enviada</app-badge>
                        <p class="text-xs text-gray-500 mt-1">{{ liquidacion.fechaEnvio }}</p>
                      </div>
                    } @else {
                      <app-badge variant="warning">Pendiente</app-badge>
                    }
                  </td>
                  <td class="px-6 py-4">
                    <div class="flex items-center justify-end gap-2">
                      <button
                        (click)="openPreview(liquidacion)"
                        class="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Ver"
                      >
                        <lucide-icon class="w-4 h-4" name="eye"></lucide-icon>
                      </button>
                      <a
                        [routerLink]="['/liquidaciones', liquidacion.id]"
                        class="p-2 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        title="Ver detalle"
                      >
                        <lucide-icon class="w-4 h-4" name="file-text"></lucide-icon>
                      </a>
                      <button
                        class="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Descargar PDF"
                      >
                        <lucide-icon class="w-4 h-4" name="download"></lucide-icon>
                      </button>
                      @if (!liquidacion.enviada) {
                        <button
                          class="p-2 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                          title="Enviar por email"
                        >
                          <lucide-icon class="w-4 h-4" name="mail"></lucide-icon>
                        </button>
                      }
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </app-card>

      <!-- Preview Modal -->
      @if (showPreview() && selectedLiquidacion()) {
        <div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" (click)="closePreview()">
          <div
            class="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            (click)="$event.stopPropagation()"
          >
            <div class="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 class="text-xl font-semibold text-gray-900">Liquidación de Sueldo</h2>
              <div class="flex gap-2">
                <app-button variant="outline" size="sm">
                  <lucide-icon icon class="w-4 h-4" name="download"></lucide-icon>
                  Descargar PDF
                </app-button>
                <button (click)="closePreview()" class="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <span class="text-gray-500 text-xl">×</span>
                </button>
              </div>
            </div>

            <div class="p-8 bg-gray-50">
              <div class="bg-white border border-gray-300 p-8 shadow-sm">
                <div class="text-center border-b border-gray-300 pb-4 mb-6">
                  <h3 class="text-xl font-bold text-gray-900">EMPRESA PYME LTDA.</h3>
                  <p class="text-sm text-gray-600">RUT: 76.123.456-7</p>
                  <p class="text-sm text-gray-600">Dirección Empresa 123, Santiago</p>
                </div>

                <h4 class="text-lg font-bold text-center text-gray-900 mb-6">LIQUIDACIÓN DE REMUNERACIONES</h4>

                <div class="grid grid-cols-2 gap-4 mb-6 text-sm">
                  <div>
                    <p class="text-gray-600"><strong>Nombre:</strong> {{ selectedLiquidacion()!.empleado }}</p>
                    <p class="text-gray-600"><strong>RUT:</strong> {{ selectedLiquidacion()!.rut }}</p>
                  </div>
                  <div>
                    <p class="text-gray-600"><strong>Periodo:</strong> {{ selectedLiquidacion()!.periodo }}</p>
                    <p class="text-gray-600"><strong>Cargo:</strong> Desarrollador Senior</p>
                  </div>
                </div>

                <div class="mb-6">
                  <h5 class="font-semibold text-gray-900 mb-3 text-sm uppercase">Haberes</h5>
                  <table class="w-full text-sm">
                    <tbody class="divide-y divide-gray-200">
                      <tr>
                        <td class="py-2 text-gray-700">Sueldo Base</td>
                        <td class="py-2 text-right font-medium text-gray-900">$1.200.000</td>
                      </tr>
                      <tr>
                        <td class="py-2 text-gray-700">Gratificación Legal</td>
                        <td class="py-2 text-right font-medium text-gray-900">$300.000</td>
                      </tr>
                      <tr>
                        <td class="py-2 text-gray-700">Horas Extra</td>
                        <td class="py-2 text-right font-medium text-gray-900">$150.000</td>
                      </tr>
                      <tr class="border-t-2 border-gray-300">
                        <td class="py-2 font-semibold text-gray-900">TOTAL HABERES</td>
                        <td class="py-2 text-right font-semibold text-green-600">
                          $ {{ selectedLiquidacion()!.totalHaberes.toLocaleString('es-CL') }}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div class="mb-6">
                  <h5 class="font-semibold text-gray-900 mb-3 text-sm uppercase">Descuentos</h5>
                  <table class="w-full text-sm">
                    <tbody class="divide-y divide-gray-200">
                      <tr>
                        <td class="py-2 text-gray-700">AFP (10%)</td>
                        <td class="py-2 text-right font-medium text-gray-900">$165.000</td>
                      </tr>
                      <tr>
                        <td class="py-2 text-gray-700">Salud (7%)</td>
                        <td class="py-2 text-right font-medium text-gray-900">$115.500</td>
                      </tr>
                      <tr>
                        <td class="py-2 text-gray-700">Seguro Cesantía (0.6%)</td>
                        <td class="py-2 text-right font-medium text-gray-900">$9.900</td>
                      </tr>
                      <tr>
                        <td class="py-2 text-gray-700">Impuesto Único</td>
                        <td class="py-2 text-right font-medium text-gray-900">$29.600</td>
                      </tr>
                      <tr class="border-t-2 border-gray-300">
                        <td class="py-2 font-semibold text-gray-900">TOTAL DESCUENTOS</td>
                        <td class="py-2 text-right font-semibold text-red-600">
                          $ {{ selectedLiquidacion()!.totalDescuentos.toLocaleString('es-CL') }}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div class="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                  <div class="flex justify-between items-center">
                    <span class="text-lg font-bold text-gray-900">LÍQUIDO A PAGAR</span>
                    <span class="text-2xl font-bold text-blue-600">
                      $ {{ selectedLiquidacion()!.liquido.toLocaleString('es-CL') }}
                    </span>
                  </div>
                </div>

                <div class="mt-8 pt-4 border-t border-gray-300 text-center">
                  <p class="text-xs text-gray-500">
                    Documento generado electrónicamente - {{ today }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      }
    </div>
  `,
})
export class LiquidacionesPage {
  readonly liquidaciones = signal<Liquidacion[]>([
    {
      id: 1,
      empleado: 'Juan Pérez González',
      rut: '12.345.678-9',
      periodo: 'Abril 2026',
      totalHaberes: 1650000,
      totalDescuentos: 320000,
      liquido: 1330000,
      enviada: true,
      fechaEnvio: '08/04/2026',
    },
    {
      id: 2,
      empleado: 'María Rodríguez Silva',
      rut: '23.456.789-0',
      periodo: 'Abril 2026',
      totalHaberes: 1280000,
      totalDescuentos: 248000,
      liquido: 1032000,
      enviada: true,
      fechaEnvio: '08/04/2026',
    },
    {
      id: 3,
      empleado: 'Carlos López Muñoz',
      rut: '34.567.890-1',
      periodo: 'Abril 2026',
      totalHaberes: 2250000,
      totalDescuentos: 456000,
      liquido: 1794000,
      enviada: false,
    },
    {
      id: 4,
      empleado: 'Ana Martínez Torres',
      rut: '45.678.901-2',
      periodo: 'Abril 2026',
      totalHaberes: 1180000,
      totalDescuentos: 228000,
      liquido: 952000,
      enviada: false,
    },
  ]);

  readonly enviadas = computed(() => this.liquidaciones().filter((l) => l.enviada).length);
  readonly pendientes = computed(() => this.liquidaciones().filter((l) => !l.enviada).length);

  readonly selectedLiquidacion = signal<Liquidacion | null>(null);
  readonly showPreview = signal(false);

  readonly today = new Date().toLocaleDateString('es-CL');

  openPreview(liq: Liquidacion) {
    this.selectedLiquidacion.set(liq);
    this.showPreview.set(true);
  }
  closePreview() {
    this.showPreview.set(false);
  }
}

type Liquidacion = {
  id: number;
  empleado: string;
  rut: string;
  periodo: string;
  totalHaberes: number;
  totalDescuentos: number;
  liquido: number;
  enviada: boolean;
  fechaEnvio?: string;
};

