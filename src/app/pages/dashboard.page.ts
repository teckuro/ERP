import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import {
  CardComponent,
  CardContentComponent,
  CardHeaderComponent,
} from '../shared/components/ui/card.component';
import { BadgeComponent } from '../shared/components/ui/badge.component';
import { ButtonComponent } from '../shared/components/ui/button.component';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [
    CommonModule,
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
          <h1 class="text-2xl font-semibold text-gray-900">Dashboard de Gestión</h1>
          <p class="text-sm text-gray-600 mt-1">Centro de mando - Periodo Abril 2026</p>
        </div>
        <app-button variant="primary">
          <lucide-icon icon class="w-4 h-4" name="file-text"></lucide-icon>
          Generar Reporte
        </app-button>
      </div>

      <!-- KPI Cards - Principales -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <app-card [hover]="true" className="border-l-4 border-l-blue-600">
          <app-card-content>
            <div class="flex items-start justify-between">
              <div>
                <p class="text-sm text-gray-600 mb-1">Costo Empresa Total</p>
                <p class="text-2xl font-semibold text-gray-900">$20.800.000</p>
                <div class="flex items-center gap-1 mt-2">
                  <lucide-icon class="w-4 h-4 text-green-600" name="arrow-up-right"></lucide-icon>
                  <span class="text-sm text-green-600 font-medium">+3.5%</span>
                  <span class="text-sm text-gray-500">vs mes anterior</span>
                </div>
                <p class="text-xs text-gray-500 mt-2">Incluye leyes sociales y AFC</p>
              </div>
              <div class="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                <lucide-icon class="w-6 h-6 text-blue-600" name="dollar-sign"></lucide-icon>
              </div>
            </div>
          </app-card-content>
        </app-card>

        <app-card [hover]="true" className="border-l-4 border-l-green-600">
          <app-card-content>
            <div class="flex items-start justify-between">
              <div>
                <p class="text-sm text-gray-600 mb-1">Total Líquido a Pagar</p>
                <p class="text-2xl font-semibold text-gray-900">$16.200.000</p>
                <div class="flex items-center gap-1 mt-2">
                  <lucide-icon class="w-4 h-4 text-green-600" name="arrow-up-right"></lucide-icon>
                  <span class="text-sm text-green-600 font-medium">+3.2%</span>
                  <span class="text-sm text-gray-500">vs mes anterior</span>
                </div>
                <p class="text-xs text-gray-500 mt-2">38 de 42 liquidaciones generadas</p>
              </div>
              <div class="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
                <lucide-icon class="w-6 h-6 text-green-600" name="trending-up"></lucide-icon>
              </div>
            </div>
          </app-card-content>
        </app-card>

        <app-card [hover]="true" className="border-l-4 border-l-purple-600">
          <app-card-content>
            <div class="flex items-start justify-between">
              <div>
                <p class="text-sm text-gray-600 mb-1">Estado Previred</p>
                <p class="text-xl font-semibold text-gray-900">Sin Cargar</p>
                <div class="mt-3">
                  <app-badge variant="warning">Pendiente</app-badge>
                </div>
                <p class="text-xs text-gray-500 mt-2">Vencimiento: 10/05/2026</p>
              </div>
              <div class="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center">
                <lucide-icon class="w-6 h-6 text-purple-600" name="upload"></lucide-icon>
              </div>
            </div>
          </app-card-content>
        </app-card>

        <app-card [hover]="true" className="border-l-4 border-l-yellow-600">
          <app-card-content>
            <div class="flex items-start justify-between">
              <div>
                <p class="text-sm text-gray-600 mb-1">Días para Cierre</p>
                <p class="text-2xl font-semibold text-gray-900">{{ diasParaCierre }} días</p>
                <div class="mt-3">
                  <app-badge [variant]="badgeVariantDiasParaCierre">
                    {{ badgeLabelDiasParaCierre }}
                  </app-badge>
                </div>
                <p class="text-xs text-gray-500 mt-2">Cierre: 30/04/2026</p>
              </div>
              <div class="w-12 h-12 bg-yellow-50 rounded-lg flex items-center justify-center">
                <lucide-icon class="w-6 h-6 text-yellow-600" name="calendar"></lucide-icon>
              </div>
            </div>
          </app-card-content>
        </app-card>
      </div>

      <!-- Gráfico Comparativo y Acceso Rápido -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- “Chart” mock (para pixel perfect del layout primero) -->
        <app-card className="lg:col-span-2">
          <app-card-header>
            <h3 class="font-semibold text-gray-900">Comparativo de Costos Mensuales</h3>
            <p class="text-sm text-gray-600 mt-1">Últimos 7 meses - Costo Empresa vs Líquido a Pagar</p>
          </app-card-header>
          <app-card-content>
            <div class="w-full h-[320px] rounded-lg border border-gray-200 bg-white">
              <div class="h-full p-4 flex items-end gap-3">
                @for (item of costosComparativos; track item.mes) {
                  <div class="flex-1 flex flex-col items-center gap-2">
                    <div class="w-full flex items-end gap-1 h-56">
                      <div
                        class="flex-1 rounded-t-md bg-blue-600"
                        [style.height.%]="heightPct(item.costoEmpresa)"
                      ></div>
                      <div
                        class="flex-1 rounded-t-md bg-green-600"
                        [style.height.%]="heightPct(item.liquidoPagar)"
                      ></div>
                    </div>
                    <div class="text-xs text-gray-600">{{ item.mes }}</div>
                  </div>
                }
              </div>
            </div>
          </app-card-content>
        </app-card>

        <!-- Acceso Rápido -->
        <app-card className="bg-gradient-to-br from-blue-50 to-blue-100">
          <app-card-header>
            <h3 class="font-semibold text-blue-900">Acceso Rápido</h3>
            <p class="text-sm text-blue-700 mt-1">Archivos legales obligatorios</p>
          </app-card-header>
          <app-card-content className="space-y-3">
            <app-button
              variant="primary"
              className="w-full justify-start bg-white hover:bg-gray-50 text-blue-900 border border-blue-200"
            >
              <lucide-icon icon class="w-5 h-5" name="file-text"></lucide-icon>
              <div class="text-left flex-1">
                <p class="font-medium">Libro de Remuneraciones</p>
                <p class="text-xs text-blue-700 font-normal">LRE - Obligatorio mensual</p>
              </div>
              <lucide-icon class="w-4 h-4" name="download"></lucide-icon>
            </app-button>

            <app-button
              variant="primary"
              className="w-full justify-start bg-white hover:bg-gray-50 text-purple-900 border border-purple-200"
            >
              <lucide-icon icon class="w-5 h-5 text-purple-600" name="upload"></lucide-icon>
              <div class="text-left flex-1">
                <p class="font-medium text-purple-900">Archivo PREVIRED</p>
                <p class="text-xs text-purple-700 font-normal">TXT - Vence 10/05/2026</p>
              </div>
              <lucide-icon class="w-4 h-4 text-purple-900" name="download"></lucide-icon>
            </app-button>

            <app-button variant="outline" className="w-full justify-start">
              <lucide-icon icon class="w-5 h-5" name="file-text"></lucide-icon>
              <div class="text-left flex-1">
                <p class="font-medium">CSV Carga Bancaria</p>
                <p class="text-xs text-gray-600 font-normal">Para pago de nómina</p>
              </div>
              <lucide-icon class="w-4 h-4" name="download"></lucide-icon>
            </app-button>

            <div class="pt-3 border-t border-blue-200">
              <p class="text-xs text-blue-800"><strong>Recordatorio:</strong> Todos los archivos deben generarse antes del cierre del periodo.</p>
            </div>
          </app-card-content>
        </app-card>
      </div>

      <!-- Alertas y Actividad -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Alerts -->
        <app-card>
          <app-card-header>
            <div class="flex items-center justify-between">
              <h3 class="font-semibold text-gray-900">Alertas y Validaciones</h3>
              <app-badge variant="warning">{{ alerts.length }}</app-badge>
            </div>
          </app-card-header>
          <app-card-content className="space-y-3">
            @for (alert of alerts; track alert.id) {
              <div
                class="p-3 rounded-lg border"
                [class.bg-red-50]="alert.type === 'error'"
                [class.border-red-200]="alert.type === 'error'"
                [class.bg-yellow-50]="alert.type === 'warning'"
                [class.border-yellow-200]="alert.type === 'warning'"
                [class.bg-blue-50]="alert.type === 'info'"
                [class.border-blue-200]="alert.type === 'info'"
              >
                <div class="flex items-start gap-2">
                  @if (alert.type === 'error') {
                    <lucide-icon class="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" name="alert-triangle"></lucide-icon>
                  } @else if (alert.type === 'warning') {
                    <lucide-icon class="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" name="clock"></lucide-icon>
                  } @else {
                    <lucide-icon class="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" name="check-circle"></lucide-icon>
                  }
                  <div class="flex-1 min-w-0">
                    <p class="text-sm text-gray-900">{{ alert.message }}</p>
                    <p class="text-xs text-gray-600 mt-1">Prioridad: {{ alert.priority }}</p>
                  </div>
                </div>
              </div>
            }

            <app-button variant="outline" size="sm" className="w-full">Ver Todas las Alertas</app-button>
          </app-card-content>
        </app-card>

        <!-- Recent Activity -->
        <app-card>
          <app-card-header>
            <h3 class="font-semibold text-gray-900">Actividad Reciente</h3>
          </app-card-header>
          <app-card-content className="space-y-4">
            @for (activity of recentActivity; track activity.id) {
              <div class="flex items-start gap-3">
                <div class="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium text-gray-900">{{ activity.action }}</p>
                  <p class="text-sm text-gray-600">{{ activity.employee }}</p>
                  <p class="text-xs text-gray-500 mt-1">{{ activity.time }}</p>
                </div>
              </div>
            }
          </app-card-content>
        </app-card>
      </div>

      <!-- KPIs Secundarios -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <app-card>
          <app-card-content>
            <div class="flex items-center justify-between">
              <div>
                <p class="text-xs text-gray-600">Empleados Activos</p>
                <p class="text-xl font-semibold text-gray-900 mt-1">42</p>
              </div>
              <lucide-icon class="w-8 h-8 text-blue-600" name="users"></lucide-icon>
            </div>
          </app-card-content>
        </app-card>

        <app-card>
          <app-card-content>
            <div class="flex items-center justify-between">
              <div>
                <p class="text-xs text-gray-600">Licencias Activas</p>
                <p class="text-xl font-semibold text-gray-900 mt-1">3</p>
              </div>
              <lucide-icon class="w-8 h-8 text-yellow-600" name="file-text"></lucide-icon>
            </div>
          </app-card-content>
        </app-card>

        <app-card>
          <app-card-content>
            <div class="flex items-center justify-between">
              <div>
                <p class="text-xs text-gray-600">Promedio Sueldo</p>
                <p class="text-xl font-semibold text-gray-900 mt-1">$1.2M</p>
              </div>
              <lucide-icon class="w-8 h-8 text-green-600" name="dollar-sign"></lucide-icon>
            </div>
          </app-card-content>
        </app-card>

        <app-card>
          <app-card-content>
            <div class="flex items-center justify-between">
              <div>
                <p class="text-xs text-gray-600">Tasa Rotación</p>
                <p class="text-xl font-semibold text-gray-900 mt-1">2.4%</p>
              </div>
              <lucide-icon class="w-8 h-8 text-purple-600" name="trending-up"></lucide-icon>
            </div>
          </app-card-content>
        </app-card>
      </div>
    </div>
  `,
})
export class DashboardPage {
  readonly costosComparativos = [
    { mes: 'Oct', costoEmpresa: 18200000, liquidoPagar: 14100000 },
    { mes: 'Nov', costoEmpresa: 18800000, liquidoPagar: 14600000 },
    { mes: 'Dic', costoEmpresa: 22400000, liquidoPagar: 17800000 },
    { mes: 'Ene', costoEmpresa: 19100000, liquidoPagar: 14900000 },
    { mes: 'Feb', costoEmpresa: 19500000, liquidoPagar: 15200000 },
    { mes: 'Mar', costoEmpresa: 20100000, liquidoPagar: 15700000 },
    { mes: 'Abr', costoEmpresa: 20800000, liquidoPagar: 16200000 },
  ];

  readonly alerts = [
    { id: 1, type: 'error' as const, message: '3 empleados con errores en datos previsionales', priority: 'Alta' },
    { id: 2, type: 'warning' as const, message: '5 licencias médicas pendientes de registro', priority: 'Media' },
    { id: 3, type: 'info' as const, message: 'Actualización de UF disponible (valor 10/04: $37.245,23)', priority: 'Baja' },
  ];

  readonly recentActivity = [
    { id: 1, action: 'Liquidación generada', employee: 'Juan Pérez', time: 'Hace 2 horas' },
    { id: 2, action: 'Empleado creado', employee: 'Ana Martínez', time: 'Hace 3 horas' },
    { id: 3, action: 'Licencia médica registrada', employee: 'Carlos López', time: 'Hace 5 horas' },
    { id: 4, action: 'Proceso cerrado', employee: 'Periodo Marzo 2026', time: 'Hace 1 día' },
  ];

  get diasParaCierre(): number {
    const hoy = new Date();
    const finDeMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);
    return Math.max(0, Math.ceil((finDeMes.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24)));
  }

  get badgeVariantDiasParaCierre(): 'success' | 'warning' | 'error' {
    if (this.diasParaCierre <= 5) return 'error';
    if (this.diasParaCierre <= 10) return 'warning';
    return 'success';
  }

  get badgeLabelDiasParaCierre(): string {
    if (this.diasParaCierre <= 5) return 'Urgente';
    if (this.diasParaCierre <= 10) return 'Próximo';
    return 'En plazo';
  }

  private get maxCosto(): number {
    return Math.max(...this.costosComparativos.map((x) => x.costoEmpresa));
  }

  heightPct(value: number): number {
    const max = this.maxCosto || 1;
    return Math.max(2, Math.round((value / max) * 100));
  }
}

