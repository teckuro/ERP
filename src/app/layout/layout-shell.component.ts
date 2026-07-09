import { Component, inject } from '@angular/core';
import { NavigationEnd, NavigationStart, Router, RouterOutlet } from '@angular/router';
import { ErpPermisosRemuneracionesService } from '../core/auth/erp-permisos-remuneraciones.service';
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
  private readonly permisos = inject(ErpPermisosRemuneracionesService);

  constructor() {
    // Ajustes finos del perfil de acceso (ADMIN-01); silencioso si no hay perfil.
    void this.permisos.asegurarPermisosPerfil();

    // Fallback inicial (sin navegación previa, no hay dueño todavía).
    this.shellContext.applyRouteFallback(this.router.url);

    this.router.events.subscribe((event) => {
      if (event instanceof NavigationStart) {
        // Marcamos al dueño actual; si nadie nuevo reclama durante la
        // navegación, el servicio lo liberará al cerrar la transición.
        this.shellContext.beginNavigationTransition();
      } else if (event instanceof NavigationEnd) {
        // El servicio decide: si el container nuevo ya reclamó propiedad,
        // respeta su contexto; si no, libera al stale y aplica el fallback
        // de breadcrumbs de la ruta nueva.
        this.shellContext.resolveNavigationTransition(event.urlAfterRedirects);
      }
    });
  }
}
