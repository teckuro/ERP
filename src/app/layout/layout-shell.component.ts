import { Component, inject } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs/operators';
import { SidebarComponent } from './sidebar.component';
import { HeaderComponent } from './header.component';
import { ShellPageContextService } from './shell-page-context.service';
import { SHELL_HEADER_HEIGHT_PX, SHELL_NAV_WIDTH_PX } from './shell-navigation.config';

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
        margin-left: ${SHELL_NAV_WIDTH_PX}px;
        height: 100vh;
        overflow: hidden;
        padding-top: ${SHELL_HEADER_HEIGHT_PX}px;
      }

        .erp-shell-scroll {
          display: flex;
          flex-direction: column;
          height: 100%;
          width: 100%;
          min-height: 0;
          overflow-y: auto;
          overflow-x: hidden;
          scrollbar-color: #c7d0c4 #eef1ec;
          scrollbar-width: thin;
      }

      .erp-shell-scroll > :not(router-outlet) {
        display: flex;
        flex-direction: column;
        flex: 1 1 auto;
        width: 100%;
        min-width: 0;
        min-height: 0;
        align-self: stretch;
      }

        @media (max-width: 1024px) {
          .erp-shell-main {
            margin-left: 0;
            padding-top: ${SHELL_HEADER_HEIGHT_PX}px;
          }

          .erp-shell-scroll {
            padding: 0;
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
