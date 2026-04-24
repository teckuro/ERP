import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { CardComponent, CardContentComponent } from '../shared/components/ui/card.component';
import { BadgeComponent } from '../shared/components/ui/badge.component';
import { ButtonComponent } from '../shared/components/ui/button.component';
import {
  TabsComponent,
  TabsContentDirective,
  TabsListComponent,
  TabsTriggerDirective,
} from '../shared/components/ui/tabs.component';

@Component({
  selector: 'app-haberes-descuentos-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    LucideAngularModule,
    CardComponent,
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
        <div>
          <h1 class="text-xl font-semibold text-gray-900">Haberes y Descuentos</h1>
          <p class="text-sm text-gray-600 mt-1">
            {{ haberesCount() }} haberes • {{ descuentosCount() }} descuentos configurados
          </p>
        </div>
        <app-button variant="primary" (click)="openNuevo()">
          <lucide-icon icon class="w-4 h-4" name="plus"></lucide-icon>
          Crear Concepto
        </app-button>
      </div>

      <!-- Stats Cards -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <app-card [hover]="true">
          <app-card-content>
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-gray-600">Total Conceptos</p>
                <p class="text-xl font-semibold text-gray-900 mt-2">{{ conceptos().length }}</p>
              </div>
              <div class="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                <lucide-icon class="w-6 h-6 text-blue-600" name="list"></lucide-icon>
              </div>
            </div>
          </app-card-content>
        </app-card>

        <app-card [hover]="true">
          <app-card-content>
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-gray-600">Haberes</p>
                <p class="text-xl font-semibold text-gray-900 mt-2">{{ haberesCount() }}</p>
              </div>
              <div class="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
                <lucide-icon class="w-6 h-6 text-green-600" name="dollar-sign"></lucide-icon>
              </div>
            </div>
          </app-card-content>
        </app-card>

        <app-card [hover]="true">
          <app-card-content>
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-gray-600">Descuentos</p>
                <p class="text-xl font-semibold text-gray-900 mt-2">{{ descuentosCount() }}</p>
              </div>
              <div class="w-12 h-12 bg-red-50 rounded-lg flex items-center justify-center">
                <lucide-icon class="w-6 h-6 text-red-600" name="percent"></lucide-icon>
              </div>
            </div>
          </app-card-content>
        </app-card>
      </div>

      <!-- Tabs de Conceptos -->
      <app-tabs defaultValue="todos" className="space-y-6">
        <app-tabs-list className="bg-white border border-gray-200 p-1">
          <button appTabsTrigger="todos" className="gap-2">
            <lucide-icon class="w-4 h-4" name="list"></lucide-icon>
            Todos
          </button>
          <button appTabsTrigger="haber" className="gap-2">
            <lucide-icon class="w-4 h-4" name="dollar-sign"></lucide-icon>
            Haberes
          </button>
          <button appTabsTrigger="descuento" className="gap-2">
            <lucide-icon class="w-4 h-4" name="percent"></lucide-icon>
            Descuentos
          </button>
        </app-tabs-list>

        <div appTabsContent="todos">
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
            @for (concepto of conceptos(); track concepto.id) {
              <app-card [hover]="true">
                <app-card-content className="p-4">
                  <div class="flex items-start justify-between">
                    <div class="flex-1">
                      <div class="flex items-center gap-3 mb-2">
                        <div
                          class="w-10 h-10 rounded-lg flex items-center justify-center"
                          [class.bg-green-50]="concepto.tipo === 'haber'"
                          [class.bg-red-50]="concepto.tipo === 'descuento'"
                        >
                          <lucide-icon
                            class="w-5 h-5"
                            [class.text-green-600]="concepto.tipo === 'haber'"
                            [class.text-red-600]="concepto.tipo === 'descuento'"
                            name="dollar-sign"
                          ></lucide-icon>
                        </div>
                        <div class="flex-1">
                          <h3 class="font-medium text-gray-900">{{ concepto.nombre }}</h3>
                          <p class="text-xs text-gray-500">Código: {{ concepto.codigo }}</p>
                        </div>
                      </div>

                      <div class="flex flex-wrap gap-2 mt-3">
                        <app-badge [variant]="concepto.tipo === 'haber' ? 'success' : 'error'">
                          {{ concepto.tipo === 'haber' ? 'Haber' : 'Descuento' }}
                        </app-badge>
                        <app-badge [variant]="concepto.categoria === 'fijo' ? 'info' : 'default'">
                          {{ concepto.categoria === 'fijo' ? 'Fijo' : 'Variable' }}
                        </app-badge>
                        @if (concepto.imponible) { <app-badge variant="default">Imponible</app-badge> }
                        @if (concepto.tributable) { <app-badge variant="default">Tributable</app-badge> }
                        @if (concepto.afc) { <app-badge variant="info">AFC</app-badge> }
                      </div>

                      @if (concepto.monto) {
                        <div class="mt-3 pt-3 border-t border-gray-200">
                          <p class="text-sm text-gray-600">Monto fijo:</p>
                          <p class="text-lg font-semibold text-gray-900">
                            $ {{ concepto.monto.toLocaleString('es-CL') }}
                          </p>
                        </div>
                      }
                    </div>

                    <div class="flex flex-col gap-2 ml-4">
                      <button
                        (click)="openEditar(concepto)"
                        class="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <lucide-icon class="w-4 h-4" name="edit"></lucide-icon>
                      </button>
                      <button
                        class="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Eliminar"
                      >
                        <lucide-icon class="w-4 h-4" name="trash-2"></lucide-icon>
                      </button>
                    </div>
                  </div>
                </app-card-content>
              </app-card>
            }
          </div>
        </div>

        <div appTabsContent="haber">
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
            @for (concepto of conceptosHaberes(); track concepto.id) {
              <ng-container *ngTemplateOutlet="conceptoCard; context: { $implicit: concepto }"></ng-container>
            }
          </div>
        </div>

        <div appTabsContent="descuento">
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
            @for (concepto of conceptosDescuentos(); track concepto.id) {
              <ng-container *ngTemplateOutlet="conceptoCard; context: { $implicit: concepto }"></ng-container>
            }
          </div>
        </div>

        <ng-template #conceptoCard let-concepto>
          <app-card [hover]="true">
            <app-card-content className="p-4">
              <div class="flex items-start justify-between">
                <div class="flex-1">
                  <div class="flex items-center gap-3 mb-2">
                    <div
                      class="w-10 h-10 rounded-lg flex items-center justify-center"
                      [class.bg-green-50]="concepto.tipo === 'haber'"
                      [class.bg-red-50]="concepto.tipo === 'descuento'"
                    >
                      <lucide-icon
                        class="w-5 h-5"
                        [class.text-green-600]="concepto.tipo === 'haber'"
                        [class.text-red-600]="concepto.tipo === 'descuento'"
                        name="dollar-sign"
                      ></lucide-icon>
                    </div>
                    <div class="flex-1">
                      <h3 class="font-medium text-gray-900">{{ concepto.nombre }}</h3>
                      <p class="text-xs text-gray-500">Código: {{ concepto.codigo }}</p>
                    </div>
                  </div>
                  <div class="flex flex-wrap gap-2 mt-3">
                    <app-badge [variant]="concepto.tipo === 'haber' ? 'success' : 'error'">
                      {{ concepto.tipo === 'haber' ? 'Haber' : 'Descuento' }}
                    </app-badge>
                    <app-badge [variant]="concepto.categoria === 'fijo' ? 'info' : 'default'">
                      {{ concepto.categoria === 'fijo' ? 'Fijo' : 'Variable' }}
                    </app-badge>
                    @if (concepto.imponible) { <app-badge variant="default">Imponible</app-badge> }
                    @if (concepto.tributable) { <app-badge variant="default">Tributable</app-badge> }
                    @if (concepto.afc) { <app-badge variant="info">AFC</app-badge> }
                  </div>
                  @if (concepto.monto) {
                    <div class="mt-3 pt-3 border-t border-gray-200">
                      <p class="text-sm text-gray-600">Monto fijo:</p>
                      <p class="text-lg font-semibold text-gray-900">$ {{ concepto.monto.toLocaleString('es-CL') }}</p>
                    </div>
                  }
                </div>
                <div class="flex flex-col gap-2 ml-4">
                  <button
                    (click)="openEditar(concepto)"
                    class="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Editar"
                  >
                    <lucide-icon class="w-4 h-4" name="edit"></lucide-icon>
                  </button>
                  <button
                    class="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Eliminar"
                  >
                    <lucide-icon class="w-4 h-4" name="trash-2"></lucide-icon>
                  </button>
                </div>
              </div>
            </app-card-content>
          </app-card>
        </ng-template>
      </app-tabs>

      <!-- Modal - Crear/Editar Concepto -->
      @if (showModal()) {
        <div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" (click)="closeModal()">
          <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full" (click)="$event.stopPropagation()">
            <div class="border-b border-gray-200 px-6 py-4">
              <h2 class="text-lg font-semibold text-gray-900">
                {{ selectedConcepto() ? 'Editar Concepto' : 'Nuevo Concepto' }}
              </h2>
            </div>

            <div class="p-6 space-y-4">
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Código</label>
                  <input
                    type="text"
                    [value]="selectedConcepto()?.codigo ?? ''"
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="001"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Tipo</label>
                  <select
                    [value]="selectedConcepto()?.tipo ?? ''"
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="haber">Haber</option>
                    <option value="descuento">Descuento</option>
                  </select>
                </div>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Nombre del Concepto</label>
                <input
                  type="text"
                  [value]="selectedConcepto()?.nombre ?? ''"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Sueldo Base"
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Categoría</label>
                <select
                  [value]="selectedConcepto()?.categoria ?? ''"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="fijo">Fijo</option>
                  <option value="variable">Variable</option>
                </select>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Monto Fijo (opcional, solo para conceptos fijos)
                </label>
                <input
                  type="number"
                  [value]="selectedConcepto()?.monto ?? ''"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0"
                />
              </div>

              <div class="space-y-3 pt-2">
                <label class="flex items-center gap-2">
                  <input type="checkbox" class="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500" />
                  <span class="text-sm text-gray-700">Imponible (afecto a AFP y Salud)</span>
                </label>
                <label class="flex items-center gap-2">
                  <input type="checkbox" class="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500" />
                  <span class="text-sm text-gray-700">Tributable (afecto a impuesto único)</span>
                </label>
                <label class="flex items-center gap-2">
                  <input type="checkbox" class="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500" />
                  <span class="text-sm text-gray-700">AFC (Seguro de Cesantía)</span>
                </label>
              </div>
            </div>

            <div class="bg-gray-50 px-6 py-4 flex items-center justify-end gap-3 border-t border-gray-200">
              <app-button variant="outline" (click)="closeModal()">Cancelar</app-button>
              <app-button variant="primary">Guardar</app-button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
})
export class HaberesDescuentosPage {
  readonly conceptos = signal<Concepto[]>([
    { id: 1, codigo: '001', nombre: 'Sueldo Base', tipo: 'haber', categoria: 'fijo', imponible: true, tributable: true, afc: false },
    { id: 2, codigo: '002', nombre: 'Gratificación Legal', tipo: 'haber', categoria: 'variable', imponible: true, tributable: true, afc: false },
    { id: 3, codigo: '003', nombre: 'Horas Extra', tipo: 'haber', categoria: 'variable', imponible: true, tributable: true, afc: false },
    { id: 4, codigo: '004', nombre: 'Bono Productividad', tipo: 'haber', categoria: 'variable', imponible: true, tributable: true, afc: false },
    { id: 5, codigo: '005', nombre: 'Asignación Colación', tipo: 'haber', categoria: 'fijo', imponible: false, tributable: false, afc: false, monto: 40000 },
    { id: 6, codigo: '006', nombre: 'Asignación Movilización', tipo: 'haber', categoria: 'fijo', imponible: false, tributable: false, afc: false, monto: 30000 },
    { id: 7, codigo: '101', nombre: 'AFP', tipo: 'descuento', categoria: 'variable', imponible: true, tributable: false, afc: false },
    { id: 8, codigo: '102', nombre: 'Salud (Isapre/Fonasa)', tipo: 'descuento', categoria: 'variable', imponible: true, tributable: false, afc: false },
    { id: 9, codigo: '103', nombre: 'Seguro Cesantía AFC', tipo: 'descuento', categoria: 'variable', imponible: false, tributable: false, afc: true },
    { id: 10, codigo: '104', nombre: 'Impuesto Único', tipo: 'descuento', categoria: 'variable', imponible: false, tributable: true, afc: false },
  ]);

  readonly haberesCount = computed(() => this.conceptos().filter((c) => c.tipo === 'haber').length);
  readonly descuentosCount = computed(() => this.conceptos().filter((c) => c.tipo === 'descuento').length);
  readonly conceptosHaberes = computed(() => this.conceptos().filter((c) => c.tipo === 'haber'));
  readonly conceptosDescuentos = computed(() => this.conceptos().filter((c) => c.tipo === 'descuento'));

  readonly showModal = signal(false);
  readonly selectedConcepto = signal<Concepto | null>(null);

  openNuevo() {
    this.selectedConcepto.set(null);
    this.showModal.set(true);
  }
  openEditar(concepto: Concepto) {
    this.selectedConcepto.set(concepto);
    this.showModal.set(true);
  }
  closeModal() {
    this.showModal.set(false);
  }
}

type Concepto = {
  id: number;
  codigo: string;
  nombre: string;
  tipo: 'haber' | 'descuento';
  categoria: 'fijo' | 'variable';
  imponible: boolean;
  tributable: boolean;
  afc: boolean;
  monto?: number;
};

