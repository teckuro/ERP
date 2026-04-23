import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  template: `
    <header class="fixed left-64 right-0 top-0 z-10 h-16 border-b border-gray-200 bg-white">
      <div class="flex h-full items-center justify-between px-6">
        <div class="flex items-center gap-2">
          <lucide-icon name="calendar" class="h-5 w-5 text-gray-500"></lucide-icon>
          <select
            [(ngModel)]="selectedPeriod"
            class="h-10 cursor-pointer rounded-md border border-gray-200 bg-white px-3 text-sm font-semibold text-gray-700 hover:border-gray-300 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
            aria-label="Periodo activo"
          >
            <option>Abril 2026</option>
            <option>Marzo 2026</option>
            <option>Febrero 2026</option>
            <option>Enero 2026</option>
          </select>
        </div>

        <div class="flex items-center gap-4">
          <button
            type="button"
            class="relative inline-flex h-9 w-9 items-center justify-center rounded-md border border-transparent transition-colors hover:border-gray-200 hover:bg-gray-50"
            aria-label="Notificaciones"
          >
            <lucide-icon name="bell" class="h-5 w-5 text-gray-600"></lucide-icon>
            <span class="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-600"></span>
          </button>

          <div class="flex items-center gap-3 border-l border-gray-200 pl-4">
            <div class="text-right">
              <p class="text-sm font-semibold text-gray-900">Maria Gonzalez</p>
              <p class="text-xs text-gray-500">RRHH Admin</p>
            </div>
            <div class="flex h-9 w-9 items-center justify-center rounded-md bg-blue-600">
              <span class="text-sm font-semibold text-white">MG</span>
            </div>
            <lucide-icon name="chevron-down" class="h-4 w-4 text-gray-500"></lucide-icon>
          </div>
        </div>
      </div>
    </header>
  `,
})
export class HeaderComponent {
  readonly selectedPeriodSignal = signal('Abril 2026');

  get selectedPeriod(): string {
    return this.selectedPeriodSignal();
  }

  set selectedPeriod(value: string) {
    this.selectedPeriodSignal.set(value);
  }
}
