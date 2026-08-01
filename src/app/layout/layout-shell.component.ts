import { Component, HostListener, inject } from '@angular/core';
import { NavigationEnd, NavigationStart, Router, RouterOutlet } from '@angular/router';
import { ErpPermisosRemuneracionesService } from '../core/auth/erp-permisos-remuneraciones.service';
import { SidebarComponent } from './sidebar.component';
import { HeaderComponent } from './header.component';
import { ShellPageContextService } from './shell-page-context.service';
import { ShellNavUiService } from './shell-nav-ui.service';
import { SHELL_HEADER_HEIGHT_PX, SHELL_NAV_WIDTH_PX } from './shell-navigation.config';

@Component({
  selector: 'app-layout-shell',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent, HeaderComponent],
  template: `
    <div class="erp-shell-layout">
      <app-sidebar></app-sidebar>
      @if (navUi.mobileNavOpen()) {
        <button
          type="button"
          class="erp-shell-nav-backdrop"
          aria-label="Cerrar menú de navegación"
          (click)="navUi.closeNav()"
        ></button>
      }
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
        --erp-shell-nav-width: ${SHELL_NAV_WIDTH_PX}px;
        --erp-shell-header-height: ${SHELL_HEADER_HEIGHT_PX}px;
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

      .erp-shell-nav-backdrop {
        display: none;
      }

      @media (max-width: 1024px) {
        .erp-shell-main {
          margin-left: 0;
          padding-top: ${SHELL_HEADER_HEIGHT_PX}px;
        }

        .erp-shell-scroll {
          padding: 0;
        }

        .erp-shell-nav-backdrop {
          display: block;
          position: fixed;
          inset: 0;
          z-index: 35;
          border: 0;
          margin: 0;
          padding: 0;
          background: rgba(15, 23, 42, 0.35);
          cursor: pointer;
        }
      }
    `,
  ],
})
export class LayoutShellComponent {
  private readonly router = inject(Router);
  private readonly shellContext = inject(ShellPageContextService);
  private readonly permisos = inject(ErpPermisosRemuneracionesService);
  readonly navUi = inject(ShellNavUiService);

  constructor() {
    void this.permisos.asegurarPermisosPerfil();

    this.shellContext.applyRouteFallback(this.router.url);

    this.router.events.subscribe((event) => {
      if (event instanceof NavigationStart) {
        this.shellContext.beginNavigationTransition();
      } else if (event instanceof NavigationEnd) {
        this.navUi.closeNav();
        this.shellContext.resolveNavigationTransition(event.urlAfterRedirects);
      }
    });
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.navUi.mobileNavOpen()) {
      this.navUi.closeNav();
    }
  }
}
