import { Component, inject } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs/operators';
import { SidebarComponent } from './sidebar.component';
import { HeaderComponent } from './header.component';
import { ShellPageContextService } from './shell-page-context.service';

@Component({
  selector: 'app-layout-shell',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent, HeaderComponent],
  template: `
    <div class="erp-shell-layout">
      <app-sidebar></app-sidebar>
      <app-header></app-header>
      <main class="erp-shell-main" aria-label="Contenido operativo">
        <div class="app-outlet-scroll erp-shell-scroll">
          <router-outlet></router-outlet>
        </div>
      </main>
    </div>
  `,
  styles: [
    `
      .erp-shell-layout {
        min-height: 100vh;
        height: 100vh;
        overflow: hidden;
        background: #f6f7f4;
        color: #172033;
      }

      .erp-shell-main {
        margin-left: 220px;
        height: 100vh;
        overflow: hidden;
        padding-top: 52px;
      }

      .erp-shell-scroll {
        height: 100%;
        min-height: 0;
        overflow-y: auto;
        overflow-x: hidden;
        padding: 1.25rem 1.5rem 1.5rem;
        scrollbar-color: #c7d0c4 #eef1ec;
        scrollbar-width: thin;
      }

      @media (max-width: 1024px) {
        .erp-shell-main {
          margin-left: 0;
          padding-top: 52px;
        }

        .erp-shell-scroll {
          padding: 1rem;
        }
      }
    `,
  ],
})
export class LayoutShellComponent {
  private readonly router = inject(Router);
  private readonly shellContext = inject(ShellPageContextService);

  constructor() {
    this.shellContext.applyRouteFallback(this.router.url);
    this.router.events.pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd)).subscribe((e) => {
      this.shellContext.applyRouteFallback(e.urlAfterRedirects);
    });
  }
}
