import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import {
  CardComponent,
  CardContentComponent,
  CardHeaderComponent,
} from '../shared/components/ui/card.component';
import { BadgeComponent } from '../shared/components/ui/badge.component';
import { ButtonComponent } from '../shared/components/ui/button.component';
import {
  TabsComponent,
  TabsContentDirective,
  TabsListComponent,
  TabsTriggerDirective,
} from '../shared/components/ui/tabs.component';

@Component({
  selector: 'app-detalle-liquidacion-page',
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
    TabsComponent,
    TabsListComponent,
    TabsTriggerDirective,
    TabsContentDirective,
  ],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-4">
          <a
            class="inline-flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-700"
            routerLink="/liquidaciones"
          >
            <lucide-icon class="w-4 h-4" name="arrow-left"></lucide-icon>
            Volver
          </a>
          <div>
            <h1 class="text-2xl font-semibold text-gray-900">Detalle de Liquidación</h1>
            <p class="text-sm text-gray-600 mt-1">Juan Pérez González - Abril 2026</p>
          </div>
        </div>
        <div class="flex gap-2">
          <app-button variant="outline" size="sm">
            <lucide-icon icon class="w-4 h-4" name="mail"></lucide-icon>
            Enviar Email
          </app-button>
          <app-button variant="outline" size="sm">
            <lucide-icon icon class="w-4 h-4" name="printer"></lucide-icon>
            Imprimir
          </app-button>
        </div>
      </div>

      <!-- Info del Empleado -->
      <app-card>
        <app-card-content>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p class="text-xs text-gray-500">RUT</p>
              <p class="text-sm font-medium text-gray-900">12.345.678-9</p>
            </div>
            <div>
              <p class="text-xs text-gray-500">Cargo</p>
              <p class="text-sm font-medium text-gray-900">Desarrollador Senior</p>
            </div>
            <div>
              <p class="text-xs text-gray-500">Departamento</p>
              <p class="text-sm font-medium text-gray-900">Tecnología</p>
            </div>
            <div>
              <p class="text-xs text-gray-500">AFP</p>
              <p class="text-sm font-medium text-gray-900">Capital</p>
            </div>
          </div>
        </app-card-content>
      </app-card>

      <!-- Tabs de Liquidación -->
      <app-tabs defaultValue="resumen" className="space-y-6">
        <app-tabs-list className="bg-white border border-gray-200 p-1">
          <button appTabsTrigger="resumen" className="gap-2">
            <lucide-icon class="w-4 h-4" name="file-text"></lucide-icon>
            Resumen
          </button>
          <button appTabsTrigger="haberes" className="gap-2">
            <lucide-icon class="w-4 h-4" name="trending-up"></lucide-icon>
            Haberes
          </button>
          <button appTabsTrigger="descuentos" className="gap-2">
            <lucide-icon class="w-4 h-4" name="trending-down"></lucide-icon>
            Descuentos
          </button>
          <button appTabsTrigger="acciones" className="gap-2">
            <lucide-icon class="w-4 h-4" name="file-check"></lucide-icon>
            Acciones
          </button>
        </app-tabs-list>

        <!-- Resumen -->
        <div appTabsContent="resumen" className="space-y-6">
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <!-- HABERES -->
            <app-card>
              <app-card-header className="bg-green-50 border-b-2 border-green-200">
                <div class="flex items-center justify-between">
                  <h3 class="font-semibold text-green-900">Haberes</h3>
                  <app-badge variant="success">Ingresos</app-badge>
                </div>
              </app-card-header>
              <app-card-content className="p-0">
                <div class="divide-y divide-gray-200">
                  @for (haber of haberes(); track haber.codigo) {
                    <div class="p-4 hover:bg-gray-50 transition-colors">
                      <div class="flex items-start justify-between">
                        <div class="flex-1">
                          <div class="flex items-center gap-2">
                            <p class="text-sm font-medium text-gray-900">{{ haber.concepto }}</p>
                            @if (haber.imponible) { <app-badge variant="info" size="sm">Imponible</app-badge> }
                            @if (haber.tributable) { <app-badge variant="default" size="sm">Tributable</app-badge> }
                          </div>
                          <p class="text-xs text-gray-500 mt-1">Código: {{ haber.codigo }}</p>
                        </div>
                        <p class="text-base font-semibold text-green-600">
                          +$ {{ haber.monto.toLocaleString('es-CL') }}
                        </p>
                      </div>
                    </div>
                  }

                  <div class="bg-gray-50 p-4 space-y-2">
                    <div class="flex justify-between text-sm">
                      <span class="text-gray-600">Total Imponible:</span>
                      <span class="font-medium text-gray-900">$ {{ totalImponible().toLocaleString('es-CL') }}</span>
                    </div>
                    <div class="flex justify-between text-sm">
                      <span class="text-gray-600">Total Tributable:</span>
                      <span class="font-medium text-gray-900">$ {{ totalTributable().toLocaleString('es-CL') }}</span>
                    </div>
                    <div class="flex justify-between text-sm">
                      <span class="text-gray-600">Total No Imponible:</span>
                      <span class="font-medium text-gray-900">$ {{ totalNoImponible().toLocaleString('es-CL') }}</span>
                    </div>
                    <div class="pt-2 border-t-2 border-gray-300 flex justify-between">
                      <span class="font-semibold text-gray-900">TOTAL HABERES:</span>
                      <span class="font-bold text-green-600 text-lg">$ {{ totalHaberes().toLocaleString('es-CL') }}</span>
                    </div>
                  </div>
                </div>
              </app-card-content>
            </app-card>

            <!-- DESCUENTOS -->
            <app-card>
              <app-card-header className="bg-red-50 border-b-2 border-red-200">
                <div class="flex items-center justify-between">
                  <h3 class="font-semibold text-red-900">Descuentos Legales</h3>
                  <app-badge variant="error">Deducciones</app-badge>
                </div>
              </app-card-header>
              <app-card-content className="p-0">
                <div class="divide-y divide-gray-200">
                  @for (descuento of descuentos(); track descuento.codigo) {
                    <div class="p-4 hover:bg-gray-50 transition-colors">
                      <div class="flex items-start justify-between">
                        <div class="flex-1">
                          <p class="text-sm font-medium text-gray-900">{{ descuento.concepto }}</p>
                          <p class="text-xs text-gray-500 mt-1">Código: {{ descuento.codigo }}</p>
                          @if (descuento.detalle) {
                            <div class="mt-2 flex items-start gap-2 text-xs text-gray-600">
                              <lucide-icon class="w-4 h-4 text-gray-400 mt-0.5" name="info"></lucide-icon>
                              <p>{{ descuento.detalle }}</p>
                            </div>
                          }
                        </div>
                        <div class="text-right">
                          <p class="text-base font-semibold text-red-600">-$ {{ descuento.monto.toLocaleString('es-CL') }}</p>
                          @if (descuento.base && descuento.tasa) {
                            <p class="text-xs text-gray-500 mt-1">{{ descuento.tasa }} sobre $ {{ descuento.base.toLocaleString('es-CL') }}</p>
                          }
                        </div>
                      </div>
                    </div>
                  }
                  <div class="bg-gray-50 p-4">
                    <div class="pt-2 border-t-2 border-gray-300 flex justify-between">
                      <span class="font-semibold text-gray-900">TOTAL DESCUENTOS:</span>
                      <span class="font-bold text-red-600 text-lg">$ {{ totalDescuentos().toLocaleString('es-CL') }}</span>
                    </div>
                  </div>
                </div>
              </app-card-content>
            </app-card>
          </div>

          <!-- Líquido -->
          <div class="bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
            <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <p class="text-sm text-blue-800 font-medium">LÍQUIDO A PAGAR</p>
                <p class="text-3xl font-bold text-blue-600 mt-1">$ {{ liquido().toLocaleString('es-CL') }}</p>
              </div>
              <div class="flex gap-2">
                <app-button variant="outline">
                  <lucide-icon icon class="w-4 h-4" name="download"></lucide-icon>
                  Descargar PDF
                </app-button>
                <app-button variant="primary" [disabled]="firmaEnProceso()" (click)="firmar()">
                  <lucide-icon icon class="w-4 h-4" name="file-signature"></lucide-icon>
                  {{ firmaEnProceso() ? 'Firmando...' : 'Firmar Electrónicamente' }}
                </app-button>
              </div>
            </div>
          </div>
        </div>

        <!-- Haberes -->
        <div appTabsContent="haberes">
          <app-card>
            <app-card-header className="bg-green-50 border-b-2 border-green-200">
              <div class="flex items-center justify-between">
                <h3 class="font-semibold text-green-900">Detalle de Haberes</h3>
                <app-badge variant="success">Ingresos</app-badge>
              </div>
            </app-card-header>
            <app-card-content className="p-0">
              <div class="divide-y divide-gray-200">
                @for (haber of haberes(); track haber.codigo) {
                  <div class="p-4 hover:bg-gray-50 transition-colors">
                    <div class="flex items-start justify-between">
                      <div class="flex-1">
                        <div class="flex items-center gap-2">
                          <p class="text-sm font-medium text-gray-900">{{ haber.concepto }}</p>
                          @if (haber.imponible) { <app-badge variant="info" size="sm">Imponible</app-badge> }
                          @if (haber.tributable) { <app-badge variant="default" size="sm">Tributable</app-badge> }
                        </div>
                        <p class="text-xs text-gray-500 mt-1">Código: {{ haber.codigo }}</p>
                      </div>
                      <p class="text-base font-semibold text-green-600">+$ {{ haber.monto.toLocaleString('es-CL') }}</p>
                    </div>
                  </div>
                }
              </div>
            </app-card-content>
          </app-card>
        </div>

        <!-- Descuentos -->
        <div appTabsContent="descuentos">
          <app-card>
            <app-card-header className="bg-red-50 border-b-2 border-red-200">
              <div class="flex items-center justify-between">
                <h3 class="font-semibold text-red-900">Detalle de Descuentos Legales</h3>
                <app-badge variant="error">Deducciones</app-badge>
              </div>
            </app-card-header>
            <app-card-content className="p-0">
              <div class="divide-y divide-gray-200">
                @for (descuento of descuentos(); track descuento.codigo) {
                  <div class="p-4 hover:bg-gray-50 transition-colors">
                    <div class="flex items-start justify-between">
                      <div class="flex-1">
                        <p class="text-sm font-medium text-gray-900">{{ descuento.concepto }}</p>
                        @if (descuento.tasa && descuento.base) {
                          <p class="text-xs text-gray-500 mt-1">
                            {{ descuento.tasa }} de $ {{ descuento.base.toLocaleString('es-CL') }}
                          </p>
                        }
                        @if (descuento.detalle) {
                          <div class="flex items-center gap-1 mt-1">
                            <lucide-icon class="w-3 h-3 text-gray-400" name="info"></lucide-icon>
                            <p class="text-xs text-gray-500">{{ descuento.detalle }}</p>
                          </div>
                        }
                      </div>
                      <p class="text-base font-semibold text-red-600">-$ {{ descuento.monto.toLocaleString('es-CL') }}</p>
                    </div>
                  </div>
                }
              </div>
            </app-card-content>
          </app-card>
        </div>

        <!-- Acciones -->
        <div appTabsContent="acciones" className="space-y-6">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <app-card className="bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-200">
              <app-card-content className="p-6">
                <div class="flex items-center gap-4">
                  <div class="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <lucide-icon class="w-6 h-6 text-white" name="file-signature"></lucide-icon>
                  </div>
                  <div class="flex-1">
                    <h4 class="font-semibold text-purple-900 mb-1">Firma Electrónica</h4>
                    <p class="text-sm text-purple-700">Firma digitalmente para validar la recepción de esta liquidación</p>
                  </div>
                </div>
                <app-button variant="primary" className="w-full mt-4 bg-purple-600 hover:bg-purple-700" [disabled]="firmaEnProceso()" (click)="firmar()">
                  <lucide-icon icon class="w-4 h-4" name="file-signature"></lucide-icon>
                  {{ firmaEnProceso() ? 'Procesando firma...' : 'Firmar Electrónicamente' }}
                </app-button>
              </app-card-content>
            </app-card>

            <app-card className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200">
              <app-card-content className="p-6">
                <div class="flex items-center gap-4">
                  <div class="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <lucide-icon class="w-6 h-6 text-white" name="download"></lucide-icon>
                  </div>
                  <div class="flex-1">
                    <h4 class="font-semibold text-blue-900 mb-1">Descargar PDF</h4>
                    <p class="text-sm text-blue-700">Obtén una copia en PDF de tu liquidación para tus registros</p>
                  </div>
                </div>
                <app-button variant="primary" className="w-full mt-4">
                  <lucide-icon icon class="w-4 h-4" name="download"></lucide-icon>
                  Descargar PDF
                </app-button>
              </app-card-content>
            </app-card>
          </div>

          <app-card className="border-2 border-blue-200">
            <app-card-content className="p-6">
              <div class="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-6 border-2 border-blue-300">
                <div class="flex items-center justify-between">
                  <div>
                    <p class="text-sm font-medium text-blue-900 mb-1">SUELDO LÍQUIDO A PAGAR</p>
                    <p class="text-xs text-blue-700">Monto neto después de descuentos legales</p>
                  </div>
                  <p class="text-3xl font-bold text-blue-900">$ {{ liquido().toLocaleString('es-CL') }}</p>
                </div>
              </div>
            </app-card-content>
          </app-card>
        </div>
      </app-tabs>

      <app-card className="bg-gray-50">
        <app-card-content>
          <p class="text-xs text-gray-600 text-center">
            Este documento constituye comprobante de pago de remuneraciones según el Código del Trabajo de Chile.
            <br />
            Generado el {{ today }} • Sistema de Remuneraciones PYME
          </p>
        </app-card-content>
      </app-card>
    </div>
  `,
})
export class DetalleLiquidacionPage {
  readonly firmaEnProceso = signal(false);

  readonly haberes = signal<HaberItem[]>([
    { codigo: '001', concepto: 'Sueldo Base', monto: 1500000, imponible: true, tributable: true },
    { codigo: '002', concepto: 'Gratificación Legal Art. 50', monto: 375000, imponible: true, tributable: true },
    { codigo: '003', concepto: 'Bono Productividad', monto: 200000, imponible: true, tributable: true },
    { codigo: '004', concepto: 'Asignación Colación', monto: 40000, imponible: false, tributable: false },
    { codigo: '005', concepto: 'Asignación Movilización', monto: 30000, imponible: false, tributable: false },
  ]);

  readonly descuentos = signal<DescuentoItem[]>([
    { codigo: '101', concepto: 'AFP Capital', base: 2075000, tasa: '11.44%', monto: 237380, detalle: 'Cotización + SIS (1.44%)' },
    { codigo: '102', concepto: 'Salud Fonasa', base: 2075000, tasa: '7.0%', monto: 145250, detalle: 'Cotización legal obligatoria' },
    { codigo: '103', concepto: 'Seguro de Cesantía', base: 2075000, tasa: '0.6%', monto: 12450, detalle: 'AFC - Trabajador' },
    { codigo: '104', concepto: 'Impuesto Único', monto: 89500, detalle: 'Según tabla SII 2026' },
  ]);

  readonly totalHaberes = computed(() => this.haberes().reduce((sum, item) => sum + item.monto, 0));
  readonly totalImponible = computed(() => this.haberes().filter((h) => h.imponible).reduce((sum, item) => sum + item.monto, 0));
  readonly totalTributable = computed(() => this.haberes().filter((h) => h.tributable).reduce((sum, item) => sum + item.monto, 0));
  readonly totalNoImponible = computed(() => this.haberes().filter((h) => !h.imponible).reduce((sum, item) => sum + item.monto, 0));
  readonly totalDescuentos = computed(() => this.descuentos().reduce((sum, item) => sum + item.monto, 0));
  readonly liquido = computed(() => this.totalHaberes() - this.totalDescuentos());
  readonly today = new Date().toLocaleDateString('es-CL');

  firmar() {
    this.firmaEnProceso.set(true);
    window.setTimeout(() => {
      this.firmaEnProceso.set(false);
      window.alert('Liquidación firmada electrónicamente');
    }, 2000);
  }
}

type HaberItem = {
  codigo: string;
  concepto: string;
  monto: number;
  imponible: boolean;
  tributable: boolean;
};

type DescuentoItem = {
  codigo: string;
  concepto: string;
  base?: number;
  tasa?: string;
  monto: number;
  detalle?: string;
};
