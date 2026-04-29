import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
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
import {
  SearchSelectComponent,
  SearchSelectOption,
} from '../shared/components/ui/search-select.component';

@Component({
  selector: 'app-reportes-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    LucideAngularModule,
    CardComponent,
    CardContentComponent,
    CardHeaderComponent,
    ButtonComponent,
    TabsComponent,
    TabsListComponent,
    TabsTriggerDirective,
    TabsContentDirective,
    SearchSelectComponent,
  ],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div>
        <h1 class="text-xl font-semibold text-gray-900">Reportes</h1>
        <p class="text-sm text-gray-600 mt-1">Genera y exporta reportes del sistema</p>
      </div>

      <!-- Period Selector -->
      <app-card>
        <app-card-content>
          <div class="flex items-center gap-4">
            <lucide-icon class="w-5 h-5 text-gray-500" name="calendar"></lucide-icon>
            <div class="flex-1">
              <label class="block text-sm font-medium text-gray-700 mb-2">Periodo a Generar</label>
              <app-search-select
                class="reportes-periodo-select w-full max-w-xs"
                [(ngModel)]="periodo"
                [options]="periodoOpcionesReportes"
                searchPlaceholder="Buscar periodo"
                placeholder="Periodo"
              ></app-search-select>
            </div>
          </div>
        </app-card-content>
      </app-card>

      <!-- Tabs -->
      <app-tabs defaultValue="legal" className="space-y-6">
        <app-tabs-list className="bg-white border border-gray-200 p-1">
          <button appTabsTrigger="legal" className="gap-2">
            <lucide-icon class="w-4 h-4" name="scale"></lucide-icon>
            Reportes Legales
          </button>
          <button appTabsTrigger="previred" className="gap-2">
            <lucide-icon class="w-4 h-4" name="building-2"></lucide-icon>
            PREVIRED
          </button>
          <button appTabsTrigger="interno" className="gap-2">
            <lucide-icon class="w-4 h-4" name="folder-open"></lucide-icon>
            Reportes Internos
          </button>
        </app-tabs-list>

        <div appTabsContent="legal">
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
            @for (reporte of reportesLegales(); track reporte.id) {
              <app-card [hover]="true">
                <app-card-content className="p-6">
                  <div class="flex gap-4">
                    <div class="flex-shrink-0 w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                      <lucide-icon class="w-6 h-6 text-blue-600" [name]="reporte.icon"></lucide-icon>
                    </div>
                    <div class="flex-1 min-w-0">
                      <h3 class="font-medium text-gray-900 mb-1">{{ reporte.nombre }}</h3>
                      <p class="text-sm text-gray-600 mb-3">{{ reporte.descripcion }}</p>
                      <div class="flex flex-wrap gap-2">
                        @for (formato of reporte.formatos; track formato) {
                          <app-button variant="outline" size="sm">
                            <lucide-icon
                              icon
                              class="w-4 h-4"
                              [name]="formato === 'PDF' ? 'file-text' : 'file-spreadsheet'"
                            ></lucide-icon>
                            Descargar {{ formato }}
                          </app-button>
                        }
                      </div>
                    </div>
                  </div>
                </app-card-content>
              </app-card>
            }
          </div>
        </div>

        <div appTabsContent="previred">
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
            @for (reporte of reportesPrevired(); track reporte.id) {
              <app-card [hover]="true">
                <app-card-content className="p-6">
                  <div class="flex gap-4">
                    <div class="flex-shrink-0 w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
                      <lucide-icon class="w-6 h-6 text-green-600" [name]="reporte.icon"></lucide-icon>
                    </div>
                    <div class="flex-1 min-w-0">
                      <h3 class="font-medium text-gray-900 mb-1">{{ reporte.nombre }}</h3>
                      <p class="text-sm text-gray-600 mb-3">{{ reporte.descripcion }}</p>
                      <div class="flex flex-wrap gap-2">
                        @for (formato of reporte.formatos; track formato) {
                          <app-button variant="outline" size="sm">
                            <lucide-icon
                              icon
                              class="w-4 h-4"
                              [name]="formato === 'PDF' ? 'file-text' : 'file-spreadsheet'"
                            ></lucide-icon>
                            Descargar {{ formato }}
                          </app-button>
                        }
                      </div>
                    </div>
                  </div>
                </app-card-content>
              </app-card>
            }
          </div>
        </div>

        <div appTabsContent="interno">
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
            @for (reporte of reportesInternos(); track reporte.id) {
              <app-card [hover]="true">
                <app-card-content className="p-6">
                  <div class="flex gap-4">
                    <div class="flex-shrink-0 w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center">
                      <lucide-icon class="w-6 h-6 text-purple-600" [name]="reporte.icon"></lucide-icon>
                    </div>
                    <div class="flex-1 min-w-0">
                      <h3 class="font-medium text-gray-900 mb-1">{{ reporte.nombre }}</h3>
                      <p class="text-sm text-gray-600 mb-3">{{ reporte.descripcion }}</p>
                      <div class="flex flex-wrap gap-2">
                        @for (formato of reporte.formatos; track formato) {
                          <app-button variant="outline" size="sm">
                            <lucide-icon
                              icon
                              class="w-4 h-4"
                              [name]="formato === 'PDF' ? 'file-text' : 'file-spreadsheet'"
                            ></lucide-icon>
                            Descargar {{ formato }}
                          </app-button>
                        }
                      </div>
                    </div>
                  </div>
                </app-card-content>
              </app-card>
            }
          </div>
        </div>
      </app-tabs>

      <!-- Quick Actions -->
      <app-card>
        <app-card-header>
          <h3 class="font-semibold text-gray-900">Acciones Rápidas</h3>
        </app-card-header>
        <app-card-content>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <app-button variant="primary" className="w-full">
              <lucide-icon icon class="w-4 h-4" name="download"></lucide-icon>
              Descargar Todo (ZIP)
            </app-button>
            <app-button variant="outline" className="w-full">
              <lucide-icon icon class="w-4 h-4" name="file-text"></lucide-icon>
              Programar Envío
            </app-button>
            <app-button variant="outline" className="w-full">
              <lucide-icon icon class="w-4 h-4" name="calendar"></lucide-icon>
              Historial de Reportes
            </app-button>
          </div>
        </app-card-content>
      </app-card>

      <!-- Info Box -->
      <app-card>
        <app-card-content>
          <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 class="font-medium text-blue-900 mb-2">Información Importante</h4>
            <ul class="text-sm text-blue-800 space-y-1 list-disc list-inside">
              <li>El archivo PREVIRED debe ser enviado antes del día 10 de cada mes</li>
              <li>El Libro de Remuneraciones es obligatorio mantenerlo actualizado mensualmente</li>
              <li>Los certificados anuales deben emitirse antes del 28 de febrero</li>
              <li>Todos los reportes se generan con los datos del periodo seleccionado</li>
            </ul>
          </div>
        </app-card-content>
      </app-card>
    </div>
  `,
})
export class ReportesPage {
  periodo = 'Abril 2026';

  readonly periodoOpcionesReportes: SearchSelectOption<string>[] = [
    { value: 'Abril 2026', label: 'Abril 2026' },
    { value: 'Marzo 2026', label: 'Marzo 2026' },
    { value: 'Febrero 2026', label: 'Febrero 2026' },
    { value: 'Enero 2026', label: 'Enero 2026' },
  ];

  private readonly reportes = signal<Reporte[]>([
    {
      id: 1,
      nombre: 'Libro de Remuneraciones',
      descripcion: 'Registro mensual obligatorio de todas las remuneraciones pagadas',
      icon: 'file-text',
      formatos: ['PDF', 'Excel'],
      categoria: 'legal',
    },
    {
      id: 2,
      nombre: 'Archivo PREVIRED',
      descripcion: 'Archivo TXT para envío de cotizaciones previsionales',
      icon: 'file-spreadsheet',
      formatos: ['PDF', 'CSV'],
      categoria: 'previred',
    },
    {
      id: 3,
      nombre: 'Certificado de Renta Anual',
      descripcion: 'Certificado para declaración de impuestos (Formulario 1887)',
      icon: 'file-text',
      formatos: ['PDF'],
      categoria: 'legal',
    },
    {
      id: 4,
      nombre: 'Resumen de Costos',
      descripcion: 'Análisis de costos totales de remuneraciones por periodo',
      icon: 'file-spreadsheet',
      formatos: ['PDF', 'Excel'],
      categoria: 'interno',
    },
    {
      id: 5,
      nombre: 'Planilla de Haberes',
      descripcion: 'Detalle de haberes pagados por empleado',
      icon: 'file-spreadsheet',
      formatos: ['Excel', 'CSV'],
      categoria: 'interno',
    },
    {
      id: 6,
      nombre: 'Planilla de Descuentos',
      descripcion: 'Detalle de descuentos aplicados por empleado',
      icon: 'file-spreadsheet',
      formatos: ['Excel', 'CSV'],
      categoria: 'interno',
    },
    {
      id: 7,
      nombre: 'Centralización Contable',
      descripcion: 'Asientos contables generados por remuneraciones',
      icon: 'file-text',
      formatos: ['PDF', 'Excel'],
      categoria: 'interno',
    },
    {
      id: 8,
      nombre: 'Reporte de AFP',
      descripcion: 'Detalle de cotizaciones por AFP',
      icon: 'file-spreadsheet',
      formatos: ['Excel', 'CSV'],
      categoria: 'previred',
    },
    {
      id: 9,
      nombre: 'Reporte de Isapres',
      descripcion: 'Detalle de cotizaciones de salud',
      icon: 'file-spreadsheet',
      formatos: ['Excel', 'CSV'],
      categoria: 'previred',
    },
    {
      id: 10,
      nombre: 'Finiquitos del Periodo',
      descripcion: 'Listado de finiquitos procesados',
      icon: 'file-text',
      formatos: ['PDF', 'Excel'],
      categoria: 'legal',
    },
    {
      id: 11,
      nombre: 'Licencias Médicas',
      descripcion: 'Resumen de licencias médicas y subsidios',
      icon: 'file-text',
      formatos: ['PDF', 'Excel'],
      categoria: 'interno',
    },
    {
      id: 12,
      nombre: 'Vacaciones Pendientes',
      descripcion: 'Reporte de vacaciones acumuladas por empleado',
      icon: 'file-spreadsheet',
      formatos: ['Excel', 'CSV'],
      categoria: 'interno',
    },
  ]);

  readonly reportesLegales = computed(() => this.reportes().filter((r) => r.categoria === 'legal'));
  readonly reportesPrevired = computed(() => this.reportes().filter((r) => r.categoria === 'previred'));
  readonly reportesInternos = computed(() => this.reportes().filter((r) => r.categoria === 'interno'));
}

type Reporte = {
  id: number;
  nombre: string;
  descripcion: string;
  icon: string;
  formatos: Array<'PDF' | 'Excel' | 'CSV'>;
  categoria: 'legal' | 'interno' | 'previred';
};
