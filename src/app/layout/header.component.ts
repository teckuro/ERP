import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  template: `
    <header class="h-16 bg-white border-b border-gray-200 fixed top-0 right-0 left-64 z-10">
      <div class="h-full px-6 flex items-center justify-between">
        <!-- Period Selector -->
        <div class="flex items-center gap-2">
          <lucide-icon name="calendar" class="w-5 h-5 text-gray-500"></lucide-icon>
          <select
            [(ngModel)]="selectedPeriod"
            class="bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer"
          >
            <option>Abril 2026</option>
            <option>Marzo 2026</option>
            <option>Febrero 2026</option>
            <option>Enero 2026</option>
          </select>
        </div>

        <!-- Right Section -->
        <div class="flex items-center gap-4">
          <!-- Notifications -->
          <button class="relative p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <lucide-icon name="bell" class="w-5 h-5 text-gray-600"></lucide-icon>
            <span class="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>

          <!-- User Menu -->
          <div class="flex items-center gap-3 pl-4 border-l border-gray-200">
            <div class="text-right">
              <p class="text-sm font-medium text-gray-900">María González</p>
              <p class="text-xs text-gray-500">RRHH Admin</p>
            </div>
            <div class="w-9 h-9 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full flex items-center justify-center">
              <span class="text-white text-sm font-medium">MG</span>
            </div>
            <lucide-icon name="chevron-down" class="w-4 h-4 text-gray-500"></lucide-icon>
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

