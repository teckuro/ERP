import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, OnInit } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { Building2Icon, LucideAngularModule, SettingsIcon } from 'lucide-angular';

import { AuthService } from '../core/auth/auth.service';
import { ErpPermisosRemuneracionesService } from '../core/auth/erp-permisos-remuneraciones.service';
import { etiquetaRolRemuneraciones } from '../core/auth/erp-permisos-remuneraciones.rules';
import { mesCortoDesdeYm, PeriodoActivoService } from '../core/services/periodo-activo.service';
import {
  SHELL_NAV_FOOTER_CONFIG,
  SHELL_NAV_SECTIONS,
  SHELL_HEADER_HEIGHT_PX,
  SHELL_NAV_WIDTH_PX,
  SHELL_STRIP_PADDING_X_PX,
  type ShellNavItem,
  type ShellNavSection,
} from './shell-navigation.config';
import { ShellNavUiService } from './shell-nav-ui.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, LucideAngularModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <aside
      id="erp-shell-nav"
      class="erp-sidebar"
      [class.erp-sidebar--open]="navUi.mobileNavOpen()"
      [style.width.px]="navWidth"
      aria-label="Navegación principal"
    >
      <div class="erp-sidebar__brand">
        <div class="erp-sidebar__brand-mark" aria-hidden="true">
          <lucide-icon [img]="buildingIcon"></lucide-icon>
        </div>
        <div class="erp-sidebar__brand-copy">
          <span class="erp-sidebar__brand-title">Empresa ERP</span>
          <span class="erp-sidebar__brand-sub">Remuneraciones</span>
        </div>
      </div>

      <nav class="erp-sidebar__nav">
        <ul class="erp-sidebar__sections">
          @for (section of menuSections(); track section.label) {
            <li class="erp-sidebar__section">
              <p class="erp-sidebar__section-label">{{ section.label }}</p>
              <ul class="erp-sidebar__items">
                @for (item of section.items; track item.path) {
                  <li>
                    <a
                      [routerLink]="item.path"
                      routerLinkActive="is-active"
                      [routerLinkActiveOptions]="{ exact: item.exact ?? false }"
                      #rla="routerLinkActive"
                      class="erp-sidebar__link"
                      [attr.aria-current]="rla.isActive ? 'page' : null"
                    >
                      <span class="erp-sidebar__icon" aria-hidden="true">
                        <lucide-icon [name]="item.icon"></lucide-icon>
                      </span>
                      <span class="erp-sidebar__item-label">{{ item.label }}</span>
                      @if (badgeFor(item); as badge) {
                        <span class="erp-sidebar__badge">{{ badge }}</span>
                      }
                    </a>
                  </li>
                }
              </ul>
            </li>
          }
        </ul>
      </nav>

      <footer class="erp-sidebar__footer">
        @if (footerConfig.configuracionPath && mostrarFooterLink()) {
          <a [routerLink]="footerConfig.configuracionPath" class="erp-sidebar__footer-link">
            <lucide-icon [img]="settingsIcon"></lucide-icon>
            <span>{{ footerConfig.configuracionLabel }}</span>
          </a>
        }
        <div class="erp-sidebar__user" aria-label="Usuario conectado">
          <span class="erp-sidebar__user-avatar" aria-hidden="true">{{ inicialesUsuario() }}</span>
          <span class="erp-sidebar__user-copy">
            <span class="erp-sidebar__user-name">{{ nombreUsuario() }}</span>
            <span class="erp-sidebar__user-role">{{ rolUsuario() }}</span>
          </span>
        </div>
      </footer>
    </aside>
  `,
  styles: [
    `
      .erp-sidebar {
        position: fixed;
        top: 0;
        left: 0;
        z-index: 20;
        display: flex;
        height: 100vh;
        flex-direction: column;
        border-right: 1px solid #e2e8f0;
        background: #ffffff;
        color: #334155;
        font-family: var(--erp-font-sans, Inter, system-ui, sans-serif);
      }

      .erp-sidebar__brand {
        display: flex;
        height: ${SHELL_HEADER_HEIGHT_PX}px;
        flex: 0 0 ${SHELL_HEADER_HEIGHT_PX}px;
        align-items: center;
        gap: 10px;
        border-bottom: 1px solid #e2e8f0;
        padding: 0 ${SHELL_STRIP_PADDING_X_PX}px;
        box-sizing: border-box;
      }

      .erp-sidebar__brand-mark {
        display: grid;
        width: 28px;
        height: 28px;
        flex: 0 0 28px;
        place-items: center;
        border-radius: 6px;
        background: #0c447c;
        color: #ffffff;
      }

      .erp-sidebar__brand-mark lucide-icon {
        display: inline-flex;
        width: 16px;
        height: 16px;
      }

      .erp-sidebar__brand-copy {
        display: grid;
        min-width: 0;
        gap: 2px;
      }

      .erp-sidebar__brand-title {
        overflow: hidden;
        color: #0f172a;
        font-size: 13px;
        font-weight: 500;
        line-height: 1.2;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .erp-sidebar__brand-sub {
        color: #64748b;
        font-size: 11px;
        line-height: 1.2;
      }

      .erp-sidebar__nav {
        min-height: 0;
        flex: 1 1 auto;
        overflow-y: auto;
        padding: 20px 0 12px;
        scrollbar-width: thin;
      }

      .erp-sidebar__sections,
      .erp-sidebar__items {
        list-style: none;
        margin: 0;
        padding: 0;
      }

      .erp-sidebar__sections {
        display: grid;
        gap: 14px;
      }

      .erp-sidebar__section:first-child {
        margin-top: 0;
      }

      .erp-sidebar__section-label {
        margin: 0 0 6px;
        padding: 0 16px 0 16px;
        color: #64748b;
        font-size: 10px;
        font-weight: 650;
        letter-spacing: 0.08em;
        line-height: 1.2;
        text-transform: uppercase;
      }

      .erp-sidebar__items {
        display: grid;
        gap: 2px;
      }

      .erp-sidebar__link {
        display: flex;
        min-height: 36px;
        align-items: center;
        gap: 9px;
        margin: 0 8px;
        border: 0.5px solid transparent;
        border-radius: 8px;
        padding: 0 10px;
        color: #64748b;
        font-size: 13px;
        font-weight: 500;
        text-decoration: none;
        transition:
          background-color 120ms ease,
          border-color 120ms ease,
          color 120ms ease;
      }

      .erp-sidebar__link:hover {
        background: #ffffff;
        color: #0f172a;
      }

      .erp-sidebar__link.is-active {
        border-color: #cbd5e1;
        background: #ffffff;
        color: #0c447c;
        font-weight: 500;
      }

      .erp-sidebar__icon {
        display: inline-flex;
        width: 15px;
        height: 15px;
        flex: 0 0 15px;
        color: currentColor;
      }

      .erp-sidebar__item-label {
        flex: 1 1 auto;
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .erp-sidebar__badge {
        flex: 0 0 auto;
        border-radius: 999px;
        background: #e6f1fb;
        padding: 2px 7px;
        color: #0c447c;
        font-size: 10px;
        font-weight: 600;
        line-height: 1.2;
      }

      .erp-sidebar__footer {
        display: grid;
        gap: 10px;
        margin-top: auto;
        border-top: 1px solid #e2e8f0;
        padding: 12px 8px 14px;
      }

      .erp-sidebar__footer-link {
        display: flex;
        min-height: 36px;
        align-items: center;
        gap: 9px;
        border-radius: 8px;
        padding: 0 10px;
        color: #64748b;
        font-size: 13px;
        font-weight: 500;
        text-decoration: none;
      }

      .erp-sidebar__footer-link:hover {
        background: #f8fafc;
        color: #0f172a;
      }

      .erp-sidebar__footer-link lucide-icon {
        width: 15px;
        height: 15px;
      }

      .erp-sidebar__user {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 4px 10px 0;
      }

      .erp-sidebar__user-avatar {
        display: grid;
        width: 26px;
        height: 26px;
        flex: 0 0 26px;
        place-items: center;
        border-radius: 999px;
        background: #e6f1fb;
        color: #0c447c;
        font-size: 11px;
        font-weight: 600;
      }

      .erp-sidebar__user-copy {
        display: grid;
        min-width: 0;
        gap: 1px;
      }

      .erp-sidebar__user-name {
        overflow: hidden;
        color: #0f172a;
        font-size: 12px;
        font-weight: 500;
        line-height: 1.2;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .erp-sidebar__user-role {
        color: #64748b;
        font-size: 10px;
        line-height: 1.2;
      }

      @media (max-width: 1024px) {
        .erp-sidebar {
          z-index: 40;
          transform: translateX(-100%);
          transition: transform 180ms ease;
          box-shadow: none;
          visibility: visible;
          pointer-events: none;
        }

        .erp-sidebar--open {
          transform: translateX(0);
          pointer-events: auto;
          box-shadow: 2px 0 12px rgba(15, 23, 42, 0.12);
        }
      }

      @media (prefers-reduced-motion: reduce) {
        .erp-sidebar {
          transition: none;
        }
      }
    `,
  ],
})
export class SidebarComponent implements OnInit {
  readonly buildingIcon = Building2Icon;
  readonly settingsIcon = SettingsIcon;
  readonly navWidth = SHELL_NAV_WIDTH_PX;
  readonly footerConfig = SHELL_NAV_FOOTER_CONFIG;

  private readonly auth = inject(AuthService);
  private readonly permisosRemuneraciones = inject(ErpPermisosRemuneracionesService);
  private readonly periodoActivo = inject(PeriodoActivoService);
  readonly navUi = inject(ShellNavUiService);

  readonly menuSections = computed(() => {
    const permisos = this.permisosRemuneraciones.permisosModulos();
    return SHELL_NAV_SECTIONS.map((section) => ({
      ...section,
      items: section.items.filter(
        (item) => !item.modulo || permisos[item.modulo]?.ver === true,
      ),
    })).filter((section) => section.items.length > 0);
  });

  ngOnInit(): void {
    void this.permisosRemuneraciones.asegurarPermisosPerfil();
  }

  readonly mesPeriodoBadge = computed(() => mesCortoDesdeYm(this.periodoActivo.periodoYm()));

  readonly inicialesUsuario = computed(() => {
    const user = this.auth.currentUser();
    const meta = user?.user_metadata as Record<string, unknown> | undefined;
    const nombre = typeof meta?.['full_name'] === 'string' ? meta['full_name'] : this.auth.currentEmail() ?? 'U';
    const parts = nombre.trim().split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return (parts[0]?.[0] ?? 'U').toUpperCase();
  });

  readonly nombreUsuario = computed(() => {
    const user = this.auth.currentUser();
    const meta = user?.user_metadata as Record<string, unknown> | undefined;
    if (typeof meta?.['full_name'] === 'string' && meta['full_name'].trim()) {
      return meta['full_name'].trim();
    }
    const email = this.auth.currentEmail();
    if (email) {
      return email.split('@')[0] ?? 'Usuario';
    }
    return 'Usuario';
  });

  readonly rolUsuario = computed(() =>
    etiquetaRolRemuneraciones(this.permisosRemuneraciones.rol()),
  );

  readonly mostrarFooterLink = computed(() =>
    this.footerConfig.soloAdminSistema
      ? this.permisosRemuneraciones.rol() === 'admin_sistema'
      : true,
  );

  badgeFor(item: ShellNavItem): string | null {
    if (item.badgeKey === 'periodoMes') {
      return this.mesPeriodoBadge();
    }
    return null;
  }
}
