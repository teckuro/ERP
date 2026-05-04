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
    <aside class="fixed left-0 top-0 flex h-screen w-64 flex-col border-r border-gray-200 bg-white">
      <div class="flex h-16 items-center border-b border-gray-200 px-6">
        <div class="flex items-center gap-3">
          <div class="flex h-8 w-8 items-center justify-center rounded-md bg-blue-600">
            <lucide-icon name="receipt" class="h-5 w-5 text-white"></lucide-icon>
          </div>
          <div>
            <h1 class="text-sm font-semibold text-gray-900">Remuneraciones</h1>
            <p class="text-xs text-gray-500">Sistema PYME</p>
          </div>
        </div>
      </div>

      <nav class="flex-1 overflow-y-auto py-4">
        <ul class="space-y-1 px-3">
          @for (item of menuItems; track item.path) {
            <li>
              <a
                [routerLink]="item.path"
                routerLinkActive="is-active bg-blue-50 text-blue-700 font-semibold"
                [routerLinkActiveOptions]="{ exact: item.exact ?? false }"
                #rla="routerLinkActive"
                class="sidebar-link flex items-center gap-3 rounded-md px-3 py-2.5 transition-colors duration-150"
                [class.text-blue-700]="rla.isActive"
                [class.bg-blue-50]="rla.isActive"
                [class.font-semibold]="rla.isActive"
                [class.text-gray-700]="!rla.isActive"
                [class.hover:bg-gray-50]="!rla.isActive"
                [class.hover:text-gray-900]="!rla.isActive"
              >
                <lucide-icon
                  [name]="item.icon"
                  [class]="'h-5 w-5 ' + (rla.isActive ? 'text-blue-600' : 'text-gray-500')"
                ></lucide-icon>
                <span class="text-sm">{{ item.label }}</span>
              </a>
            </li>
          }
        </ul>
      </nav>

      <div class="border-t border-gray-200 p-4">
        <div class="rounded-md border border-blue-100 bg-blue-50 p-3">
          <p class="text-xs font-semibold text-blue-900">Necesitas ayuda?</p>
          <p class="mt-1 text-xs text-blue-700">Contacta a soporte</p>
        </div>
      </div>
    </aside>
  `,
  styles: [
    `
      .sidebar-link {
        position: relative;
        overflow: hidden;
      }

      .sidebar-link::before {
        content: '';
        position: absolute;
        top: 8px;
        bottom: 8px;
        left: 0;
        width: 3px;
        border-radius: 6px;
        background: #2563eb;
        opacity: 0;
        transform: scaleY(0.5);
        transition:
          opacity 150ms ease,
          transform 150ms ease;
      }

      .sidebar-link.is-active::before {
        opacity: 1;
        transform: scaleY(1);
      }

      .sidebar-link lucide-icon {
        transition: color 150ms ease;
      }

      @media (prefers-reduced-motion: reduce) {
        .sidebar-link,
        .sidebar-link::before,
        .sidebar-link lucide-icon {
          transition: none;
        }
      }
    `,
  ],
})
export class SidebarComponent {
  readonly menuItems: MenuItem[] = [
    { path: '/', label: 'Dashboard', icon: 'layout-dashboard', exact: true },
    { path: '/empleados', label: 'Empleados', icon: 'users' },
    { path: '/remuneraciones/conceptos', label: 'Conceptos de remuneración', icon: 'tags', exact: true },
    { path: '/remuneraciones/haberes-descuentos', label: 'Haberes y descuentos', icon: 'dollar-sign' },
    { path: '/remuneraciones/movimientos-variables', label: 'Movimientos variables', icon: 'sliders' },
    { path: '/remuneraciones/proceso-mensual', label: 'Proceso mensual', icon: 'file-text' },
    { path: '/remuneraciones/liquidaciones', label: 'Liquidaciones', icon: 'receipt' },
    { path: '/licencias-medicas', label: 'Licencias Medicas', icon: 'heart-pulse' },
    { path: '/reportes', label: 'Reportes', icon: 'bar-chart-3' },
    { path: '/parametros', label: 'Parametros', icon: 'settings' },
  ];
}
