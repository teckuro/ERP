import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { CardComponent, CardContentComponent } from '../shared/components/ui/card.component';
import { BadgeComponent } from '../shared/components/ui/badge.component';
import { ButtonComponent } from '../shared/components/ui/button.component';

@Component({
  selector: 'app-proceso-remuneraciones-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, LucideAngularModule, CardComponent, CardContentComponent, BadgeComponent, ButtonComponent],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div>
        <h1 class="text-2xl font-semibold text-gray-900">Proceso de Cierre Mensual</h1>
        <p class="text-sm text-gray-600 mt-1">Periodo: Abril 2026</p>
      </div>

      <!-- Stepper Mejorado -->
      <app-card>
        <app-card-content className="p-6">
          <div class="flex items-center justify-between">
            @for (step of steps; track step.number; let i = $index) {
              <div class="flex items-center flex-1">
                <div class="flex flex-col items-center gap-2">
                  <div
                    class="w-14 h-14 rounded-full flex items-center justify-center transition-all"
                    [class.bg-blue-600]="currentStep() === step.number"
                    [class.text-white]="currentStep() === step.number"
                    [class.ring-4]="currentStep() === step.number"
                    [class.ring-blue-100]="currentStep() === step.number"
                    [class.scale-110]="currentStep() === step.number"
                    [class.bg-green-600]="currentStep() > step.number"
                    [class.text-white]="currentStep() > step.number"
                    [class.bg-gray-200]="currentStep() < step.number"
                    [class.text-gray-600]="currentStep() < step.number"
                  >
                    @if (currentStep() > step.number) {
                      <lucide-icon class="w-6 h-6" name="check"></lucide-icon>
                    } @else {
                      <lucide-icon class="w-6 h-6" [name]="step.icon"></lucide-icon>
                    }
                  </div>
                  <div class="text-center">
                    <p class="text-sm font-medium" [class.text-blue-600]="currentStep() === step.number" [class.text-gray-700]="currentStep() !== step.number">
                      {{ step.title }}
                    </p>
                    <p class="text-xs text-gray-600 mt-1">{{ step.description }}</p>
                  </div>
                </div>
                @if (i < steps.length - 1) {
                  <div class="flex-1 h-0.5 mx-4 mt-[-40px]" [class.bg-green-600]="currentStep() > step.number" [class.bg-gray-200]="currentStep() <= step.number"></div>
                }
              </div>
            }
          </div>
        </app-card-content>
      </app-card>

      <!-- Step Content -->
      <app-card>
        <app-card-content className="p-6">
      @if (currentStep() === 1) {
        <div class="space-y-6">
          @if (!parametrosActualizados()) {
            <div class="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg">
              <div class="flex items-start gap-3">
                <lucide-icon class="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" name="alert-triangle"></lucide-icon>
                <div class="flex-1">
                  <h4 class="font-medium text-yellow-900">Parámetros Desactualizados Detectados</h4>
                  <p class="text-sm text-yellow-800 mt-1">Se han detectado cambios en los siguientes valores:</p>
                  <ul class="mt-2 space-y-1 text-sm text-yellow-800 list-disc list-inside">
                    <li>UF actualizada: $37.245,23 (10/04/2026)</li>
                    <li>Sueldo Mínimo vigente desde 01/04/2026: $500.000</li>
                    <li>Tabla Impuesto Único 2026 disponible</li>
                  </ul>
                  <app-button variant="outline" size="sm" className="mt-3 border-yellow-400 text-yellow-900 hover:bg-yellow-100" (click)="parametrosActualizados.set(true)">
                    <lucide-icon icon class="w-4 h-4" name="refresh-cw"></lucide-icon>
                    Actualizar Parámetros Ahora
                  </app-button>
                </div>
              </div>
            </div>
          }

          <div class="flex items-center justify-between">
            <h3 class="font-semibold text-gray-900">Incidencias del Periodo</h3>
            <div class="flex gap-2">
              <app-badge [variant]="incidenciasPendientes() > 0 ? 'warning' : 'success'">
                {{ incidenciasPendientes() }} pendientes
              </app-badge>
              <app-button variant="outline" size="sm">
                <lucide-icon icon class="w-4 h-4" name="chevron-right"></lucide-icon>
                Agregar Incidencia
              </app-button>
            </div>
          </div>

          <app-card>
            <div class="overflow-x-auto">
              <table class="w-full">
                <thead>
                  <tr class="border-b border-gray-200 bg-gray-50">
                    <th class="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Empleado</th>
                    <th class="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Tipo</th>
                    <th class="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Descripción</th>
                    <th class="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">Impacto</th>
                    <th class="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase">Estado</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-200">
                  @for (incidencia of incidencias(); track incidencia.empleadoId) {
                    <tr class="hover:bg-gray-50 transition-colors">
                      <td class="px-6 py-4 text-sm text-gray-900">{{ incidencia.empleado }}</td>
                      <td class="px-6 py-4">
                        <app-badge [variant]="badgeTipo(incidencia.tipo)">
                          {{ labelTipo(incidencia.tipo) }}
                        </app-badge>
                      </td>
                      <td class="px-6 py-4 text-sm text-gray-900">{{ incidencia.descripcion }}</td>
                      <td class="px-6 py-4 text-sm font-medium text-right"
                        [class.text-green-600]="incidencia.valor >= 0"
                        [class.text-red-600]="incidencia.valor < 0"
                      >
                        {{ incidencia.valor >= 0 ? '+' : '' }}$ {{ abs(incidencia.valor).toLocaleString('es-CL') }}
                      </td>
                      <td class="px-6 py-4 text-center">
                        @if (incidencia.validada) {
                          <app-badge variant="success">Validada</app-badge>
                        } @else {
                          <app-button variant="outline" size="sm">Validar</app-button>
                        }
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </app-card>

          @if (!incidenciasValidadas()) {
            <div class="flex justify-center">
              <app-button
                variant="primary"
                size="lg"
                [disabled]="!parametrosActualizados()"
                (click)="incidenciasValidadas.set(true)"
              >
                Validar Todas las Incidencias
              </app-button>
            </div>
          } @else {
            <div class="bg-green-50 border border-green-200 rounded-lg p-4 transition-all">
              <div class="flex items-center gap-3">
                <lucide-icon class="w-6 h-6 text-green-600" name="check-circle"></lucide-icon>
                <div>
                  <p class="font-medium text-green-900">Todas las incidencias han sido validadas</p>
                  <p class="text-sm text-green-700">Puedes continuar con el cálculo masivo</p>
                </div>
              </div>
            </div>
          }
        </div>
      } @else if (currentStep() === 2) {
        <div class="space-y-6">
          <div class="text-center py-8">
            @if (calculoRealizado()) {
              <div class="space-y-4">
                <div class="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto">
                  <lucide-icon class="w-10 h-10 text-green-600" name="check-circle"></lucide-icon>
                </div>
                <h3 class="text-xl font-semibold text-gray-900">Cálculo Completado</h3>
                <p class="text-gray-600">Las remuneraciones han sido calculadas exitosamente</p>

                <div class="grid grid-cols-3 gap-4 max-w-3xl mx-auto mt-6">
                  <app-card className="border-green-200">
                    <app-card-content>
                      <p class="text-sm text-gray-600">Procesados</p>
                      <p class="text-3xl font-semibold text-green-600 mt-2">42</p>
                      <p class="text-xs text-gray-500 mt-1">empleados</p>
                    </app-card-content>
                  </app-card>
                  <app-card className="border-red-200">
                    <app-card-content>
                      <p class="text-sm text-gray-600">Con Errores</p>
                      <p class="text-3xl font-semibold text-red-600 mt-2">0</p>
                      <p class="text-xs text-gray-500 mt-1">liquidaciones</p>
                    </app-card-content>
                  </app-card>
                  <app-card className="border-blue-200">
                    <app-card-content>
                      <p class="text-sm text-gray-600">Total Nómina</p>
                      <p class="text-2xl font-semibold text-blue-600 mt-2">$ 16.2M</p>
                      <p class="text-xs text-gray-500 mt-1">líquido a pagar</p>
                    </app-card-content>
                  </app-card>
                </div>

                <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-2xl mx-auto mt-6">
                  <h4 class="font-medium text-blue-900 mb-3">Resumen del Cálculo</h4>
                  <div class="grid grid-cols-2 gap-4 text-sm">
                    <div class="flex justify-between">
                      <span class="text-blue-800">Total Haberes:</span>
                      <span class="font-medium text-blue-900">$ 22.450.000</span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-blue-800">Total Descuentos:</span>
                      <span class="font-medium text-blue-900">$ 6.250.000</span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-blue-800">Costo Empresa:</span>
                      <span class="font-medium text-blue-900">$ 20.800.000</span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-blue-800">Incidencias Aplicadas:</span>
                      <span class="font-medium text-blue-900">{{ incidencias().length }}</span>
                    </div>
                  </div>
                </div>

                <app-button variant="outline" (click)="calculoRealizado.set(false)">Recalcular</app-button>
              </div>
            } @else {
              <div class="space-y-4">
                <div class="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto">
                  <lucide-icon class="w-10 h-10 text-blue-600" name="calculator"></lucide-icon>
                </div>
                <h3 class="text-xl font-semibold text-gray-900">Calcular Remuneraciones Masivamente</h3>
                <p class="text-gray-600">Se procesarán las remuneraciones de 42 empleados activos</p>

                <div class="bg-gray-50 border border-gray-200 rounded-lg p-6 max-w-md mx-auto">
                  <div class="text-sm text-gray-700 text-left space-y-2">
                    <p class="font-medium text-gray-900 mb-3">El cálculo incluirá:</p>
                    <div class="space-y-2">
                      <div class="flex items-center gap-2"><lucide-icon class="w-4 h-4 text-green-600" name="check"></lucide-icon><span>Haberes fijos y variables del periodo</span></div>
                      <div class="flex items-center gap-2"><lucide-icon class="w-4 h-4 text-green-600" name="check"></lucide-icon><span>Descuentos legales (AFP, Salud, AFC)</span></div>
                      <div class="flex items-center gap-2"><lucide-icon class="w-4 h-4 text-green-600" name="check"></lucide-icon><span>Impuesto único según tabla 2026</span></div>
                      <div class="flex items-center gap-2"><lucide-icon class="w-4 h-4 text-green-600" name="check"></lucide-icon><span>Incidencias validadas ({{ incidencias().length }})</span></div>
                      <div class="flex items-center gap-2"><lucide-icon class="w-4 h-4 text-green-600" name="check"></lucide-icon><span>Gratificación legal Art. 50</span></div>
                    </div>
                  </div>
                </div>

                <app-button
                  variant="primary"
                  size="lg"
                  [disabled]="!incidenciasValidadas()"
                  (click)="calculoRealizado.set(true)"
                >
                  <lucide-icon icon class="w-5 h-5" name="calculator"></lucide-icon>
                  Calcular Remuneraciones
                </app-button>
              </div>
            }
          </div>
        </div>
      } @else if (currentStep() === 3) {
        <div class="space-y-6">
          <div class="text-center mb-6">
            <h3 class="text-xl font-semibold text-gray-900">Generación de Archivos de Exportación</h3>
            <p class="text-gray-600 mt-1">Descarga los archivos necesarios para el cierre del periodo</p>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <app-card className="border-2 border-purple-200 hover:shadow-lg transition-shadow">
              <app-card-content className="p-6">
                <div class="flex flex-col items-center text-center">
                  <div class="w-16 h-16 bg-purple-50 rounded-full flex items-center justify-center mb-4">
                    <lucide-icon class="w-8 h-8 text-purple-600" name="upload"></lucide-icon>
                  </div>
                  <h4 class="font-semibold text-gray-900 mb-2">Archivo PREVIRED</h4>
                  <p class="text-sm text-gray-600 mb-4">Archivo TXT para carga de cotizaciones previsionales</p>
                  <div class="bg-purple-50 rounded-lg p-3 mb-4 w-full">
                    <p class="text-xs text-purple-900"><strong>Vencimiento:</strong> 10/05/2026</p>
                    <p class="text-xs text-purple-700 mt-1">Formato: .TXT</p>
                  </div>
                  <app-button
                    variant="primary"
                    className="w-full bg-purple-600 hover:bg-purple-700"
                    (click)="archivosGenerados.set(true)"
                  >
                    <lucide-icon icon class="w-4 h-4" name="download"></lucide-icon>
                    Descargar TXT
                  </app-button>
                </div>
              </app-card-content>
            </app-card>

            <app-card className="border-2 border-green-200 hover:shadow-lg transition-shadow">
              <app-card-content className="p-6">
                <div class="flex flex-col items-center text-center">
                  <div class="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mb-4">
                    <lucide-icon class="w-8 h-8 text-green-600" name="file-spreadsheet"></lucide-icon>
                  </div>
                  <h4 class="font-semibold text-gray-900 mb-2">Carga Bancaria</h4>
                  <p class="text-sm text-gray-600 mb-4">Archivo CSV para pago de nómina en banco</p>
                  <div class="bg-green-50 rounded-lg p-3 mb-4 w-full">
                    <p class="text-xs text-green-900"><strong>Total:</strong> $ 16.200.000</p>
                    <p class="text-xs text-green-700 mt-1">42 pagos incluidos</p>
                  </div>
                  <app-button
                    variant="primary"
                    className="w-full bg-green-600 hover:bg-green-700"
                    (click)="archivosGenerados.set(true)"
                  >
                    <lucide-icon icon class="w-4 h-4" name="download"></lucide-icon>
                    Descargar CSV
                  </app-button>
                </div>
              </app-card-content>
            </app-card>

            <app-card className="border-2 border-blue-200 hover:shadow-lg transition-shadow">
              <app-card-content className="p-6">
                <div class="flex flex-col items-center text-center">
                  <div class="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                    <lucide-icon class="w-8 h-8 text-blue-600" name="file-text"></lucide-icon>
                  </div>
                  <h4 class="font-semibold text-gray-900 mb-2">Libro de Remuneraciones</h4>
                  <p class="text-sm text-gray-600 mb-4">LRE - Documento legal obligatorio mensual</p>
                  <div class="bg-blue-50 rounded-lg p-3 mb-4 w-full">
                    <p class="text-xs text-blue-900"><strong>Periodo:</strong> Abril 2026</p>
                    <p class="text-xs text-blue-700 mt-1">Formato: PDF</p>
                  </div>
                  <app-button variant="primary" className="w-full" (click)="archivosGenerados.set(true)">
                    <lucide-icon icon class="w-4 h-4" name="download"></lucide-icon>
                    Descargar PDF
                  </app-button>
                </div>
              </app-card-content>
            </app-card>
          </div>

          @if (archivosGenerados()) {
            <div class="bg-green-50 border border-green-200 rounded-lg p-4">
              <div class="flex items-center gap-3">
                <lucide-icon class="w-6 h-6 text-green-600" name="check-circle"></lucide-icon>
                <div>
                  <p class="font-medium text-green-900">Archivos generados correctamente</p>
                  <p class="text-sm text-green-700">Todos los archivos están listos para su uso</p>
                </div>
              </div>
            </div>
          }

          <app-card className="bg-gray-50">
            <app-card-content>
              <div class="flex items-start gap-3">
                <lucide-icon class="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" name="alert-circle"></lucide-icon>
                <div class="text-sm text-gray-700">
                  <p class="font-medium text-gray-900 mb-2">Recordatorios importantes:</p>
                  <ul class="space-y-1 list-disc list-inside">
                    <li>El archivo PREVIRED debe cargarse antes del día 10 del mes siguiente</li>
                    <li>La carga bancaria debe procesarse según los plazos de tu institución financiera</li>
                    <li>El Libro de Remuneraciones debe mantenerse disponible para fiscalización</li>
                  </ul>
                </div>
              </div>
            </app-card-content>
          </app-card>
        </div>
      } @else {
        <div class="space-y-6">
          <div class="text-center py-12">
            <div class="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <lucide-icon class="w-10 h-10 text-blue-600" name="lock"></lucide-icon>
            </div>
            <h3 class="text-xl font-semibold text-gray-900">Cerrar Periodo Abril 2026</h3>
            <p class="text-gray-600 mt-2">Finaliza el proceso y bloquea el periodo para modificaciones</p>

            <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4 max-w-md mx-auto mt-6">
              <div class="flex gap-3">
                <lucide-icon class="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" name="alert-circle"></lucide-icon>
                <div class="text-sm text-gray-700 text-left">
                  <p class="font-medium text-yellow-900 mb-2">Antes de cerrar, verifica:</p>
                  <ul class="space-y-1 list-disc list-inside text-yellow-800">
                    <li>Todas las liquidaciones han sido generadas</li>
                    <li>Los archivos PREVIRED y bancarios están descargados</li>
                    <li>El Libro de Remuneraciones ha sido emitido</li>
                    <li>No hay incidencias pendientes de validar</li>
                  </ul>
                  <p class="mt-3 font-medium text-yellow-900">
                    Una vez cerrado, no podrás realizar modificaciones al periodo.
                  </p>
                </div>
              </div>
            </div>

            <div class="max-w-md mx-auto mt-6 space-y-3">
              <div class="flex items-center justify-between p-3 bg-white rounded-lg border">
                <span class="text-sm text-gray-700">Liquidaciones generadas</span>
                <lucide-icon class="w-5 h-5 text-green-600" name="check-circle"></lucide-icon>
              </div>
              <div class="flex items-center justify-between p-3 bg-white rounded-lg border">
                <span class="text-sm text-gray-700">Archivos descargados</span>
                <lucide-icon class="w-5 h-5 text-green-600" name="check-circle"></lucide-icon>
              </div>
              <div class="flex items-center justify-between p-3 bg-white rounded-lg border">
                <span class="text-sm text-gray-700">Incidencias validadas</span>
                <lucide-icon class="w-5 h-5 text-green-600" name="check-circle"></lucide-icon>
              </div>
            </div>

            <app-button variant="primary" size="lg" className="mt-8" [disabled]="!archivosGenerados()">
              <lucide-icon icon class="w-5 h-5" name="lock"></lucide-icon>
              Cerrar Periodo Abril 2026
            </app-button>
          </div>
        </div>
      }
        </app-card-content>
      </app-card>

      <!-- Navigation -->
      <div class="flex items-center justify-between">
        <app-button variant="outline" [disabled]="currentStep() === 1" (click)="prevStep()">
          Anterior
        </app-button>
        <div class="text-sm text-gray-600">Paso {{ currentStep() }} de {{ steps.length }}</div>
        <app-button variant="primary" [disabled]="currentStep() === 4" (click)="nextStep()">
          Siguiente
        </app-button>
      </div>
    </div>
  `,
})
export class ProcesoRemuneracionesPage {
  readonly currentStep = signal<Step>(1);
  readonly incidenciasValidadas = signal(false);
  readonly calculoRealizado = signal(false);
  readonly archivosGenerados = signal(false);
  readonly parametrosActualizados = signal(false);

  readonly steps = [
    { number: 1 as const, title: 'Validación de Incidencias', icon: 'alert-circle', description: 'Licencias, faltas y extras' },
    { number: 2 as const, title: 'Cálculo Masivo', icon: 'calculator', description: 'Procesamiento automático' },
    { number: 3 as const, title: 'Generación de Archivos', icon: 'file-text', description: 'TXT, CSV y PDF' },
    { number: 4 as const, title: 'Cierre de Periodo', icon: 'lock', description: 'Finalización y bloqueo' },
  ];

  readonly incidencias = signal<Incidencia[]>([
    { empleadoId: 1, empleado: 'Juan Pérez', tipo: 'horaExtra', descripcion: '15 horas extra (50%)', valor: 120000, validada: true },
    { empleadoId: 2, empleado: 'María Rodríguez', tipo: 'bono', descripcion: 'Bono productividad', valor: 80000, validada: true },
    { empleadoId: 3, empleado: 'Ana Martínez', tipo: 'licencia', descripcion: 'Licencia médica 7 días', valor: -245000, validada: false },
    { empleadoId: 4, empleado: 'Carlos López', tipo: 'falta', descripcion: '2 días de inasistencia', valor: -133333, validada: false },
  ]);

  readonly incidenciasPendientes = computed(() => this.incidencias().filter((i) => !i.validada).length);

  prevStep() {
    this.currentStep.update((s) => (Math.max(1, s - 1) as Step));
  }

  nextStep() {
    this.currentStep.update((s) => (Math.min(4, s + 1) as Step));
  }

  abs(v: number) {
    return Math.abs(v);
  }

  badgeTipo(tipo: Incidencia['tipo']): 'warning' | 'error' | 'info' | 'default' {
    if (tipo === 'licencia') return 'warning';
    if (tipo === 'falta') return 'error';
    if (tipo === 'horaExtra') return 'info';
    if (tipo === 'bono') return 'info';
    return 'default';
  }

  labelTipo(tipo: Incidencia['tipo']): string {
    if (tipo === 'horaExtra') return 'Hora Extra';
    if (tipo === 'licencia') return 'Licencia';
    if (tipo === 'falta') return 'Falta';
    return 'Bono';
  }
}

type Step = 1 | 2 | 3 | 4;

type Incidencia = {
  empleadoId: number;
  empleado: string;
  tipo: 'licencia' | 'falta' | 'horaExtra' | 'bono';
  descripcion: string;
  valor: number;
  validada: boolean;
};
