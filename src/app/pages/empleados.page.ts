import { ChangeDetectionStrategy, Component, signal, computed } from '@angular/core';
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
  selector: 'app-empleados-page',
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
          <h1 class="text-2xl font-semibold text-gray-900">Gestión de Empleados</h1>
          <p class="text-sm text-gray-600 mt-1">{{ filteredEmpleados().length }} empleados registrados</p>
        </div>
        <app-button variant="primary" (click)="openNuevo()">
          <lucide-icon icon class="w-4 h-4" name="plus"></lucide-icon>
          Crear Empleado
        </app-button>
      </div>

      <!-- Search and Filters -->
      <app-card>
        <app-card-content>
          <div class="flex gap-4">
            <div class="flex-1 relative">
              <lucide-icon class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" name="search"></lucide-icon>
              <input
                type="text"
                placeholder="Buscar por nombre, RUT o cargo..."
                [(ngModel)]="searchTerm"
                class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <app-button variant="outline">
              <lucide-icon icon class="w-4 h-4" name="filter"></lucide-icon>
              Filtros
            </app-button>
            <app-button variant="outline">
              <lucide-icon icon class="w-4 h-4" name="download"></lucide-icon>
              Exportar
            </app-button>
          </div>
        </app-card-content>
      </app-card>

      <!-- Table -->
      <app-card>
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="border-b border-gray-200">
                <th class="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">RUT</th>
                <th class="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                <th class="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Cargo</th>
                <th class="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Departamento</th>
                <th class="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Sueldo Base</th>
                <th class="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                <th class="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200">
              <tr class="hover:bg-gray-50 transition-colors" *ngFor="let empleado of filteredEmpleados(); trackBy: trackByEmpleadoId">
                <td class="px-6 py-4 text-sm text-gray-900">{{ empleado.rut }}</td>
                <td class="px-6 py-4">
                  <div>
                    <p class="text-sm font-medium text-gray-900">{{ empleado.nombre }}</p>
                    <p class="text-xs text-gray-500">Ingreso: {{ empleado.fechaIngreso }}</p>
                  </div>
                </td>
                <td class="px-6 py-4 text-sm text-gray-900">{{ empleado.cargo }}</td>
                <td class="px-6 py-4 text-sm text-gray-600">{{ empleado.departamento }}</td>
                <td class="px-6 py-4 text-sm font-medium text-gray-900">
                  $ {{ empleado.sueldoBase.toLocaleString('es-CL') }}
                </td>
                <td class="px-6 py-4">
                  <app-badge [variant]="estadoBadgeVariant(empleado.estado)">
                    {{ labelEstado(empleado.estado) }}
                  </app-badge>
                </td>
                <td class="px-6 py-4">
                  <div class="flex items-center justify-end gap-2">
                    <button
                      (click)="openDetalle(empleado)"
                      class="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Ver detalles"
                    >
                      <lucide-icon class="w-4 h-4" name="eye"></lucide-icon>
                    </button>
                    <button
                      class="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
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
                </td>
              </tr>
            </tbody>
          </table>

          @if (filteredEmpleados().length === 0) {
            <div class="py-12 text-center">
              <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <lucide-icon class="w-8 h-8 text-gray-400" name="search"></lucide-icon>
              </div>
              <h3 class="text-lg font-medium text-gray-900 mb-1">No se encontraron empleados</h3>
              <p class="text-sm text-gray-600">Intenta ajustar tu búsqueda o filtros</p>
            </div>
          }
        </div>
      </app-card>

      <!-- Modal - Ficha Empleado -->
      @if (showModal()) {
        <div
          class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          (click)="closeModal()"
        >
          <div
            class="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            (click)="$event.stopPropagation()"
          >
            <div class="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 class="text-xl font-semibold text-gray-900">
                {{ selectedEmpleado() ? 'Ficha de Empleado' : 'Nuevo Empleado' }}
              </h2>
              <button (click)="closeModal()" class="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <span class="text-gray-500 text-xl">×</span>
              </button>
            </div>

            <div class="p-6">
              <app-tabs defaultValue="personales">
                <app-tabs-list className="bg-gray-100 border border-gray-200 p-1 w-full">
                  <button appTabsTrigger="personales" className="gap-2 flex-1">
                    <lucide-icon class="w-4 h-4" name="user"></lucide-icon>
                    Datos Personales
                  </button>
                  <button appTabsTrigger="previsionales" className="gap-2 flex-1">
                    <lucide-icon class="w-4 h-4" name="heart"></lucide-icon>
                    Datos Previsionales
                  </button>
                  <button appTabsTrigger="contrato" className="gap-2 flex-1">
                    <lucide-icon class="w-4 h-4" name="briefcase"></lucide-icon>
                    Datos del Contrato
                  </button>
                </app-tabs-list>

                <div class="space-y-6">
                  <!-- Tab: Datos Personales -->
                  <div appTabsContent="personales">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">RUT</label>
                        <input
                          type="text"
                          [value]="selectedEmpleado()?.rut ?? ''"
                          class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="12.345.678-9"
                        />
                      </div>
                      <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Nombre Completo</label>
                        <input
                          type="text"
                          [value]="selectedEmpleado()?.nombre ?? ''"
                          class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Juan Pérez González"
                        />
                      </div>
                      <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Email</label>
                        <input
                          type="email"
                          class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="juan.perez@empresa.cl"
                        />
                      </div>
                      <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Teléfono</label>
                        <input
                          type="tel"
                          class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="+56 9 1234 5678"
                        />
                      </div>
                      <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Dirección</label>
                        <input
                          type="text"
                          class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Av. Providencia 1234, Santiago"
                        />
                      </div>
                      <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Comuna</label>
                        <input
                          type="text"
                          class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Providencia"
                        />
                      </div>
                    </div>
                  </div>

                  <!-- Tab: Datos Previsionales -->
                  <div appTabsContent="previsionales">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">AFP</label>
                        <select class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                          <option>Capital</option>
                          <option>Cuprum</option>
                          <option>Habitat</option>
                          <option>PlanVital</option>
                          <option>Modelo</option>
                          <option>Provida</option>
                          <option>Uno</option>
                        </select>
                      </div>
                      <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Isapre / Fonasa</label>
                        <select class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                          <option>Fonasa</option>
                          <option>Banmédica</option>
                          <option>Colmena</option>
                          <option>Consalud</option>
                          <option>Cruz Blanca</option>
                          <option>Vida Tres</option>
                        </select>
                      </div>
                      <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">% Pactado Salud</label>
                        <input
                          type="number"
                          step="0.1"
                          value="7.0"
                          class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="7.0"
                        />
                      </div>
                      <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">UF Pactada Isapre</label>
                        <input
                          type="number"
                          step="0.01"
                          class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="0.00"
                        />
                      </div>
                      <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">APV (Ahorro Previsional Voluntario)</label>
                        <input
                          type="number"
                          class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Cargas Familiares</label>
                        <input
                          type="number"
                          value="0"
                          class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  <!-- Tab: Datos del Contrato -->
                  <div appTabsContent="contrato">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Cargo</label>
                        <input
                          type="text"
                          [value]="selectedEmpleado()?.cargo ?? ''"
                          class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Departamento</label>
                        <select class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                          <option>Tecnología</option>
                          <option>Finanzas</option>
                          <option>Recursos Humanos</option>
                          <option>Comercial</option>
                          <option>Operaciones</option>
                        </select>
                      </div>
                      <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Fecha Ingreso</label>
                        <input
                          type="date"
                          [value]="dateValue(selectedEmpleado()?.fechaIngreso)"
                          class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Tipo de Contrato</label>
                        <select class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                          <option>Indefinido</option>
                          <option>Plazo Fijo</option>
                          <option>Por Obra o Faena</option>
                        </select>
                      </div>
                      <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Sueldo Base</label>
                        <input
                          type="number"
                          [value]="selectedEmpleado()?.sueldoBase ?? ''"
                          class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Jornada Laboral</label>
                        <select class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                          <option>45 horas semanales</option>
                          <option>40 horas semanales</option>
                          <option>30 horas semanales</option>
                          <option>Media jornada</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </app-tabs>
            </div>

            <div class="sticky bottom-0 bg-gray-50 px-6 py-4 flex items-center justify-end gap-3 border-t border-gray-200">
              <app-button variant="outline" (click)="closeModal()">Cancelar</app-button>
              <app-button variant="primary">Guardar</app-button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
})
export class EmpleadosPage {
  searchTerm = '';

  private readonly empleados = signal<Empleado[]>([
    {
      id: 1,
      rut: '12.345.678-9',
      nombre: 'Juan Pérez González',
      cargo: 'Desarrollador Senior',
      departamento: 'Tecnología',
      fechaIngreso: '15/01/2023',
      sueldoBase: 1500000,
      estado: 'activo',
    },
    {
      id: 2,
      rut: '23.456.789-0',
      nombre: 'María Rodríguez Silva',
      cargo: 'Contador',
      departamento: 'Finanzas',
      fechaIngreso: '10/03/2022',
      sueldoBase: 1200000,
      estado: 'activo',
    },
    {
      id: 3,
      rut: '34.567.890-1',
      nombre: 'Carlos López Muñoz',
      cargo: 'Gerente Ventas',
      departamento: 'Comercial',
      fechaIngreso: '20/06/2021',
      sueldoBase: 2000000,
      estado: 'activo',
    },
    {
      id: 4,
      rut: '45.678.901-2',
      nombre: 'Ana Martínez Torres',
      cargo: 'Diseñadora UX',
      departamento: 'Tecnología',
      fechaIngreso: '05/09/2023',
      sueldoBase: 1100000,
      estado: 'licencia',
    },
    {
      id: 5,
      rut: '56.789.012-3',
      nombre: 'Pedro Sánchez Rojas',
      cargo: 'Analista RRHH',
      departamento: 'Recursos Humanos',
      fechaIngreso: '12/02/2024',
      sueldoBase: 950000,
      estado: 'activo',
    },
    {
      id: 6,
      rut: '17.234.890-5',
      nombre: 'Daniela Fuentes Araya',
      cargo: 'Encargada de Nómina',
      departamento: 'Recursos Humanos',
      fechaIngreso: '03/11/2020',
      sueldoBase: 1350000,
      estado: 'activo',
    },
    {
      id: 7,
      rut: '21.654.321-8',
      nombre: 'Ricardo Mella Soto',
      cargo: 'Técnico Soporte TI',
      departamento: 'Tecnología',
      fechaIngreso: '22/07/2024',
      sueldoBase: 980000,
      estado: 'licencia',
    },
    {
      id: 8,
      rut: '10.987.654-2',
      nombre: 'Carolina Sepúlveda Díaz',
      cargo: 'Asistente Contable',
      departamento: 'Finanzas',
      fechaIngreso: '14/08/2022',
      sueldoBase: 890000,
      estado: 'activo',
    },
    {
      id: 9,
      rut: '19.321.456-7',
      nombre: 'Felipe Contreras Vega',
      cargo: 'Ejecutivo Comercial',
      departamento: 'Comercial',
      fechaIngreso: '09/04/2021',
      sueldoBase: 1250000,
      estado: 'inactivo',
    },
    {
      id: 10,
      rut: '15.111.222-3',
      nombre: 'Katherine Loyola Espinoza',
      cargo: 'Analista de Datos',
      departamento: 'Tecnología',
      fechaIngreso: '18/01/2025',
      sueldoBase: 1420000,
      estado: 'activo',
    },
    {
      id: 11,
      rut: '24.765.889-1',
      nombre: 'Jorge Navarro Salinas',
      cargo: 'Supervisor Operaciones',
      departamento: 'Operaciones',
      fechaIngreso: '27/05/2019',
      sueldoBase: 1680000,
      estado: 'activo',
    },
    {
      id: 12,
      rut: '13.444.777-6',
      nombre: 'Pamela Riquelme Torres',
      cargo: 'Prevencionista de Riesgos',
      departamento: 'Operaciones',
      fechaIngreso: '30/09/2023',
      sueldoBase: 1180000,
      estado: 'activo',
    },
  ]);

  readonly filteredEmpleados = computed(() => {
    const term = this.searchTerm.toLowerCase();
    return this.empleados().filter(
      (emp) =>
        emp.nombre.toLowerCase().includes(term) ||
        emp.rut.includes(this.searchTerm) ||
        emp.cargo.toLowerCase().includes(term),
    );
  });

  readonly selectedEmpleado = signal<Empleado | null>(null);
  readonly showModal = signal(false);

  openDetalle(emp: Empleado) {
    this.selectedEmpleado.set(emp);
    this.showModal.set(true);
  }
  openNuevo() {
    this.selectedEmpleado.set(null);
    this.showModal.set(true);
  }
  closeModal() {
    this.showModal.set(false);
  }

  estadoBadgeVariant(estado: Empleado['estado']): 'success' | 'warning' | 'error' | 'default' {
    switch (estado) {
      case 'activo':
        return 'success';
      case 'licencia':
        return 'warning';
      case 'inactivo':
        return 'error';
      default:
        return 'default';
    }
  }

  labelEstado(estado: Empleado['estado']): string {
    return estado.charAt(0).toUpperCase() + estado.slice(1);
  }

  dateValue(ddmmyyyy?: string): string {
    if (!ddmmyyyy) return '';
    const parts = ddmmyyyy.split('/');
    if (parts.length !== 3) return '';
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }

  trackByEmpleadoId(_index: number, empleado: Empleado): number {
    return empleado.id;
  }
}

type Empleado = {
  id: number;
  rut: string;
  nombre: string;
  cargo: string;
  departamento: string;
  fechaIngreso: string;
  sueldoBase: number;
  estado: 'activo' | 'inactivo' | 'licencia';
};

