import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from './sidebar.component';
import { HeaderComponent } from './header.component';

@Component({
  selector: 'app-layout-shell',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent, HeaderComponent],
  template: `
    <div class="h-screen overflow-hidden bg-gray-50">
      <app-sidebar></app-sidebar>
      <app-header></app-header>
      <main class="ml-64 h-screen overflow-hidden pt-16">
        <div class="h-full overflow-hidden p-6">
          <router-outlet></router-outlet>
        </div>
      </main>
    </div>
  `,
})
export class LayoutShellComponent {}

