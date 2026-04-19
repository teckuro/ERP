import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import {
  CardComponent,
  CardContentComponent,
  CardHeaderComponent,
} from '../shared/components/ui/card.component';
import { ButtonComponent } from '../shared/components/ui/button.component';
import {
  TabsComponent,
  TabsContentDirective,
  TabsListComponent,
  TabsTriggerDirective,
} from '../shared/components/ui/tabs.component';

@Component({
  selector: 'app-parametros-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    LucideAngularModule,
    CardComponent,
    CardHeaderComponent,
    CardContentComponent,
    ButtonComponent,
    TabsComponent,
    TabsListComponent,
    TabsTriggerDirective,
    TabsContentDirective,
  ],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-semibold text-gray-900">Parámetros del Sistema</h1>
          <p class="text-sm text-gray-600 mt-1">Configuración de tasas e indicadores económicos</p>
        </div>
        <app-button variant="primary">
          <lucide-icon icon class="w-4 h-4" name="save"></lucide-icon>
          Guardar Cambios
        </app-button>
      </div>

      <app-tabs defaultValue="indicadores" className="space-y-6">
        <app-tabs-list className="bg-white border border-gray-200 p-1">
          <button appTabsTrigger="indicadores" className="gap-2">
            <lucide-icon class="w-4 h-4" name="trending-up"></lucide-icon>
            Indicadores
          </button>
          <button appTabsTrigger="afp" className="gap-2">
            <lucide-icon class="w-4 h-4" name="dollar-sign"></lucide-icon>
            AFP
          </button>
          <button appTabsTrigger="tasas" className="gap-2">
            <lucide-icon class="w-4 h-4" name="percent"></lucide-icon>
            Tasas Previsionales
          </button>
          <button appTabsTrigger="impuestos" className="gap-2">
            <lucide-icon class="w-4 h-4" name="file-text"></lucide-icon>
            Impuesto Único
          </button>
          <button appTabsTrigger="configuracion" className="gap-2">
            <lucide-icon class="w-4 h-4" name="sliders"></lucide-icon>
            Configuración
          </button>
        </app-tabs-list>

        <!-- Indicadores -->
        <div appTabsContent="indicadores">
          <app-card>
            <app-card-header>
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <lucide-icon class="w-5 h-5 text-blue-600" name="trending-up"></lucide-icon>
                  <h3 class="font-semibold text-gray-900">Indicadores Económicos</h3>
                </div>
                <app-button variant="outline" size="sm">
                  <lucide-icon icon class="w-4 h-4" name="refresh-cw"></lucide-icon>
                  Actualizar desde SII
                </app-button>
              </div>
            </app-card-header>
            <app-card-content>
              <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">UF (Unidad de Fomento)</label>
                  <input
                    type="text"
                    [(ngModel)]="uf"
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p class="text-xs text-gray-500 mt-1">Valor al 10/04/2026</p>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">UTM (Unidad Tributaria Mensual)</label>
                  <input
                    type="text"
                    [(ngModel)]="utm"
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p class="text-xs text-gray-500 mt-1">Valor abril 2026</p>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">IPC (Índice Precios)</label>
                  <input
                    type="text"
                    [(ngModel)]="ipc"
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p class="text-xs text-gray-500 mt-1">Variación mensual %</p>
                </div>
              </div>
            </app-card-content>
          </app-card>
        </div>

        <!-- AFP -->
        <div appTabsContent="afp">
          <app-card>
            <app-card-header>
              <div class="flex items-center gap-2">
                <lucide-icon class="w-5 h-5 text-blue-600" name="dollar-sign"></lucide-icon>
                <h3 class="font-semibold text-gray-900">Tasas AFP</h3>
              </div>
            </app-card-header>
            <app-card-content>
              <div class="overflow-x-auto">
                <table class="w-full">
                  <thead>
                    <tr class="border-b border-gray-200">
                      <th class="text-left px-4 py-3 text-sm font-medium text-gray-700">AFP</th>
                      <th class="text-right px-4 py-3 text-sm font-medium text-gray-700">Tasa (%)</th>
                      <th class="text-right px-4 py-3 text-sm font-medium text-gray-700">SIS (%)</th>
                      <th class="text-right px-4 py-3 text-sm font-medium text-gray-700">Total (%)</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-gray-200">
                    @for (afp of afps; track afp.nombre) {
                      <tr class="hover:bg-gray-50">
                        <td class="px-4 py-3 text-sm text-gray-900">{{ afp.nombre }}</td>
                        <td class="px-4 py-3 text-sm text-gray-900 text-right">
                          <input
                            type="text"
                            [value]="afp.tasa"
                            class="w-20 px-2 py-1 border border-gray-300 rounded text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </td>
                        <td class="px-4 py-3 text-sm text-gray-900 text-right">
                          <input
                            type="text"
                            [value]="afp.sis"
                            class="w-20 px-2 py-1 border border-gray-300 rounded text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </td>
                        <td class="px-4 py-3 text-sm font-medium text-gray-900 text-right">{{ afp.total }}</td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </app-card-content>
          </app-card>
        </div>

        <!-- Tasas -->
        <div appTabsContent="tasas">
          <app-card>
            <app-card-header>
              <div class="flex items-center gap-2">
                <lucide-icon class="w-5 h-5 text-blue-600" name="percent"></lucide-icon>
                <h3 class="font-semibold text-gray-900">Otras Tasas Previsionales</h3>
              </div>
            </app-card-header>
            <app-card-content>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Seguro Cesantía (AFC)</label>
                  <div class="space-y-3">
                    <div class="flex items-center justify-between">
                      <span class="text-sm text-gray-600">Trabajador (%)</span>
                      <input class="w-24 px-3 py-2 border border-gray-300 rounded-lg text-right focus:ring-2 focus:ring-blue-500" value="0.6" />
                    </div>
                    <div class="flex items-center justify-between">
                      <span class="text-sm text-gray-600">Empleador Plazo Fijo (%)</span>
                      <input class="w-24 px-3 py-2 border border-gray-300 rounded-lg text-right focus:ring-2 focus:ring-blue-500" value="3.0" />
                    </div>
                    <div class="flex items-center justify-between">
                      <span class="text-sm text-gray-600">Empleador Indefinido (%)</span>
                      <input class="w-24 px-3 py-2 border border-gray-300 rounded-lg text-right focus:ring-2 focus:ring-blue-500" value="2.4" />
                    </div>
                  </div>
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Salud (Fonasa)</label>
                  <div class="space-y-3">
                    <div class="flex items-center justify-between">
                      <span class="text-sm text-gray-600">Cotización Legal (%)</span>
                      <input class="w-24 px-3 py-2 border border-gray-300 rounded-lg text-right focus:ring-2 focus:ring-blue-500" value="7.0" />
                    </div>
                  </div>
                </div>
              </div>
            </app-card-content>
          </app-card>
        </div>

        <!-- Impuestos -->
        <div appTabsContent="impuestos">
          <app-card>
            <app-card-header>
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <lucide-icon class="w-5 h-5 text-blue-600" name="file-text"></lucide-icon>
                  <h3 class="font-semibold text-gray-900">Tabla Impuesto Único (Año 2026)</h3>
                </div>
                <app-button variant="outline" size="sm">
                  <lucide-icon icon class="w-4 h-4" name="refresh-cw"></lucide-icon>
                  Actualizar desde SII
                </app-button>
              </div>
            </app-card-header>
            <app-card-content>
              <div class="overflow-x-auto">
                <table class="w-full">
                  <thead>
                    <tr class="border-b border-gray-200">
                      <th class="text-left px-4 py-3 text-sm font-medium text-gray-700">Desde (UF)</th>
                      <th class="text-left px-4 py-3 text-sm font-medium text-gray-700">Hasta (UF)</th>
                      <th class="text-right px-4 py-3 text-sm font-medium text-gray-700">Factor (%)</th>
                      <th class="text-right px-4 py-3 text-sm font-medium text-gray-700">Deducir (UF)</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-gray-200">
                    @for (tramo of tramos; track tramo.desde) {
                      <tr class="hover:bg-gray-50">
                        <td class="px-4 py-3 text-sm text-gray-900">{{ tramo.desde }}</td>
                        <td class="px-4 py-3 text-sm text-gray-900">{{ tramo.hasta }}</td>
                        <td class="px-4 py-3 text-sm text-gray-900 text-right">{{ tramo.factor }}</td>
                        <td class="px-4 py-3 text-sm text-gray-900 text-right">{{ tramo.deducir }}</td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </app-card-content>
          </app-card>
        </div>

        <!-- Configuración -->
        <div appTabsContent="configuracion">
          <app-card>
            <app-card-header>
              <div class="flex items-center gap-2">
                <lucide-icon class="w-5 h-5 text-gray-600" name="settings"></lucide-icon>
                <h3 class="font-semibold text-gray-900">Configuración General</h3>
              </div>
            </app-card-header>
            <app-card-content>
              <div class="space-y-4">
                <label class="flex items-center gap-3">
                  <input type="checkbox" checked class="w-4 h-4 text-blue-600 rounded" />
                  <div>
                    <p class="text-sm font-medium text-gray-900">Calcular gratificación legal automáticamente</p>
                    <p class="text-xs text-gray-500">Aplica el 25% del sueldo base con tope de 4.75 IMM</p>
                  </div>
                </label>

                <label class="flex items-center gap-3">
                  <input type="checkbox" checked class="w-4 h-4 text-blue-600 rounded" />
                  <div>
                    <p class="text-sm font-medium text-gray-900">Aplicar tope imponible AFP</p>
                    <p class="text-xs text-gray-500">Tope de 83.3 UF mensuales</p>
                  </div>
                </label>

                <label class="flex items-center gap-3">
                  <input type="checkbox" class="w-4 h-4 text-blue-600 rounded" />
                  <div>
                    <p class="text-sm font-medium text-gray-900">Redondear líquido a pagar</p>
                    <p class="text-xs text-gray-500">Redondea el monto líquido al entero más cercano</p>
                  </div>
                </label>
              </div>
            </app-card-content>
          </app-card>
        </div>
      </app-tabs>
    </div>
  `,
})
export class ParametrosPage {
  uf = '37.245,23';
  utm = '65.443';
  ipc = '0,3';

  readonly afps = [
    { nombre: 'Capital', tasa: '11.44', sis: '1.44', total: '12.88' },
    { nombre: 'Cuprum', tasa: '11.44', sis: '1.26', total: '12.70' },
    { nombre: 'Habitat', tasa: '11.27', sis: '1.27', total: '12.54' },
    { nombre: 'PlanVital', tasa: '11.16', sis: '1.16', total: '12.32' },
    { nombre: 'Modelo', tasa: '10.77', sis: '0.77', total: '11.54' },
    { nombre: 'Provida', tasa: '11.45', sis: '1.45', total: '12.90' },
    { nombre: 'Uno', tasa: '10.69', sis: '0.69', total: '11.38' },
  ];

  readonly tramos = [
    { desde: '0', hasta: '13.5', factor: '0', deducir: '0' },
    { desde: '13.5', hasta: '30', factor: '4', deducir: '0.54' },
    { desde: '30', hasta: '50', factor: '8', deducir: '1.74' },
    { desde: '50', hasta: '70', factor: '13.5', deducir: '4.49' },
    { desde: '70', hasta: '90', factor: '23', deducir: '11.14' },
    { desde: '90', hasta: '120', factor: '30.4', deducir: '17.80' },
    { desde: '120', hasta: '∞', factor: '35', deducir: '23.32' },
  ];
}
