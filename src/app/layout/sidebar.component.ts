import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';

type MenuItem = {
  path: string;
  label: string;
  icon: string;
  exact?: boolean;
};

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, LucideAngularModule],
  template: `
    <aside class="w-64 bg-white border-r border-gray-200 flex flex-col h-screen fixed left-0 top-0">
      <!-- Logo -->
      <div class="h-16 flex items-center px-6 border-b border-gray-200">
        <div class="flex items-center gap-3">
          <div
            class="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center"
          >
            <lucide-icon name="receipt" class="w-5 h-5 text-white"></lucide-icon>
          </div>
          <div>
            <h1 class="font-semibold text-gray-900 text-sm">Remuneraciones</h1>
            <p class="text-xs text-gray-500">Sistema PYME</p>
          </div>
        </div>
      </div>

      <!-- Navigation -->
      <nav class="flex-1 overflow-y-auto py-4">
        <ul class="space-y-1 px-3">
          @for (item of menuItems; track item.path) {
            <li>
              <a
                [routerLink]="item.path"
                routerLinkActive="bg-blue-50 text-blue-700 font-medium"
                [routerLinkActiveOptions]="{ exact: item.exact ?? false }"
                #rla="routerLinkActive"
                [class]="
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ' +
                  (rla.isActive
                    ? 'bg-blue-50 text-blue-700 font-medium'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900')
                "
              >
                <lucide-icon
                  [name]="item.icon"
                  [class]="'w-5 h-5 ' + (rla.isActive ? 'text-blue-600' : 'text-gray-500')"
                ></lucide-icon>
                <span class="text-sm">{{ item.label }}</span>
              </a>
            </li>
          }
        </ul>
      </nav>

      <!-- Footer -->
      <div class="p-4 border-t border-gray-200">
        <div class="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-3">
          <p class="text-xs font-medium text-blue-900">¿Necesitas ayuda?</p>
          <p class="text-xs text-blue-700 mt-1">Contacta a soporte</p>
        </div>
      </div>
    </aside>
  `,
})
export class SidebarComponent {
  readonly menuItems: MenuItem[] = [
    { path: '/', label: 'Dashboard', icon: 'layout-dashboard', exact: true },
    { path: '/empleados', label: 'Empleados', icon: 'users' },
    { path: '/haberes-descuentos', label: 'Haberes y Descuentos', icon: 'dollar-sign' },
    { path: '/proceso-remuneraciones', label: 'Proceso Remuneraciones', icon: 'file-text' },
    { path: '/liquidaciones', label: 'Liquidaciones', icon: 'receipt' },
    { path: '/licencias-medicas', label: 'Licencias Médicas', icon: 'heart-pulse' },
    { path: '/reportes', label: 'Reportes', icon: 'bar-chart-3' },
    { path: '/parametros', label: 'Parámetros', icon: 'settings' },
  ];
}

