import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { LucideAngularModule, ReceiptTextIcon } from 'lucide-angular';

type MenuItem = {
  path: string;
  label: string;
  icon: string;
  exact?: boolean;
  hint?: string;
};

type MenuSection = {
  label?: string;
  items: MenuItem[];
};

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, LucideAngularModule],
  template: `
    <aside class="erp-sidebar" aria-label="Navegación principal">
      <div class="erp-sidebar__brand">
        <div class="erp-sidebar__brand-mark" aria-hidden="true">
          <lucide-icon [img]="receiptTextIcon"></lucide-icon>
        </div>
        <div class="erp-sidebar__brand-copy">
          <h1>Remuneraciones</h1>
          <p>Bitácora operativa</p>
        </div>
      </div>

      <nav class="erp-sidebar__nav">
        <ul class="erp-sidebar__sections">
          <li *ngFor="let section of menuSections; trackBy: trackSection" class="erp-sidebar__section">
            <p *ngIf="section.label" class="erp-sidebar__section-label">{{ section.label }}</p>
            <ul class="erp-sidebar__items">
              <li *ngFor="let item of section.items; trackBy: trackItem">
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
                  <span class="erp-sidebar__item-copy">
                    <span class="erp-sidebar__item-label">{{ item.label }}</span>
                    <span *ngIf="item.hint" class="erp-sidebar__item-hint">{{ item.hint }}</span>
                  </span>
                  <span class="erp-sidebar__active-dot" aria-hidden="true"></span>
                </a>
              </li>
            </ul>
          </li>
        </ul>
      </nav>

      <div class="erp-sidebar__footer">
        <div class="erp-sidebar__note">
          <span class="erp-sidebar__note-label">Criterio NOIA</span>
          <p>Estado, pendiente y acción antes que decoración.</p>
        </div>
      </div>
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
        width: 16rem;
        height: 100vh;
        flex-direction: column;
        border-right: 1px solid #daddd6;
        background: #ffffff;
        color: #172033;
      }

      .erp-sidebar__brand {
        display: flex;
        min-height: 4.25rem;
        align-items: center;
        gap: 0.75rem;
        border-bottom: 1px solid #daddd6;
        padding: 0 1rem;
        background: #fafaf7;
      }

      .erp-sidebar__brand-mark {
        display: grid;
        width: 2.25rem;
        height: 2.25rem;
        flex: 0 0 2.25rem;
        place-items: center;
        border: 1px solid #bfdbfe;
        border-radius: 0.5rem;
        background: #eff6ff;
        color: #1e40af;
      }

      .erp-sidebar__brand-mark lucide-icon,
      .erp-sidebar__icon lucide-icon {
        display: grid;
        width: 1rem;
        height: 1rem;
        place-items: center;
      }

      .erp-sidebar__brand-copy {
        min-width: 0;
      }

      .erp-sidebar__brand-copy h1,
      .erp-sidebar__brand-copy p,
      .erp-sidebar__note p,
      .erp-sidebar__section-label {
        margin: 0;
      }

      .erp-sidebar__brand-copy h1 {
        color: #172033;
        font-size: 0.9rem;
        font-weight: 650;
        line-height: 1.15;
      }

      .erp-sidebar__brand-copy p {
        margin-top: 0.15rem;
        color: #647084;
        font-size: 0.72rem;
        font-weight: 500;
        line-height: 1.2;
      }

      .erp-sidebar__nav {
        min-height: 0;
        flex: 1 1 auto;
        overflow-y: auto;
        padding: 0.85rem 0.75rem;
        scrollbar-color: #c7d0c4 #eef1ec;
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
        gap: 1rem;
      }

      .erp-sidebar__section {
        display: grid;
        gap: 0.35rem;
      }

      .erp-sidebar__section-label {
        padding: 0 0.55rem;
        color: #8a94a6;
        font-size: 0.66rem;
        font-weight: 650;
        letter-spacing: 0.12em;
        line-height: 1.2;
        text-transform: uppercase;
      }

      .erp-sidebar__items {
        display: grid;
        gap: 0.25rem;
      }

      .erp-sidebar__link {
        position: relative;
        display: flex;
        min-height: 2.65rem;
        align-items: flex-start;
        gap: 0.65rem;
        overflow: hidden;
        border: 1px solid transparent;
        border-radius: 0.55rem;
        padding: 0.55rem 0.65rem;
        color: #4b5563;
        text-decoration: none;
        transition:
          background-color 150ms ease,
          border-color 150ms ease,
          color 150ms ease;
      }

      .erp-sidebar__link:hover {
        border-color: #daddd6;
        background: #fafaf7;
        color: #172033;
      }

      .erp-sidebar__link.is-active {
        border-color: #bfdbfe;
        background: #eff6ff;
        color: #1e40af;
      }

      .erp-sidebar__icon {
        display: grid;
        width: 1.25rem;
        height: 1.25rem;
        flex: 0 0 1.25rem;
        place-items: center;
        color: #647084;
        transition: color 150ms ease;
      }

      .erp-sidebar__link.is-active .erp-sidebar__icon {
        color: #2563eb;
      }

      .erp-sidebar__item-copy {
        display: grid;
        min-width: 0;
        gap: 0.15rem;
      }

      .erp-sidebar__item-label {
        overflow: hidden;
        color: inherit;
        font-size: 0.82rem;
        font-weight: 600;
        line-height: 1.25;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .erp-sidebar__item-hint {
        display: -webkit-box;
        overflow: hidden;
        color: #647084;
        font-size: 0.68rem;
        font-weight: 500;
        line-height: 1.25;
        -webkit-box-orient: vertical;
        -webkit-line-clamp: 2;
      }

      .erp-sidebar__link.is-active .erp-sidebar__item-hint {
        color: #1e40af;
      }

      .erp-sidebar__active-dot {
        position: absolute;
        top: 0.65rem;
        right: 0.65rem;
        width: 0.38rem;
        height: 0.38rem;
        border-radius: 999px;
        background: #2563eb;
        opacity: 0;
        transform: scale(0.7);
        transition:
          opacity 150ms ease,
          transform 150ms ease;
      }

      .erp-sidebar__link.is-active .erp-sidebar__active-dot {
        opacity: 1;
        transform: scale(1);
      }

      .erp-sidebar__footer {
        border-top: 1px solid #daddd6;
        padding: 0.85rem;
        background: #fafaf7;
      }

      .erp-sidebar__note {
        border: 1px solid #daddd6;
        border-radius: 0.55rem;
        background: #ffffff;
        padding: 0.75rem;
      }

      .erp-sidebar__note-label {
        display: block;
        color: #172033;
        font-size: 0.68rem;
        font-weight: 650;
        letter-spacing: 0.1em;
        line-height: 1;
        text-transform: uppercase;
      }

      .erp-sidebar__note p {
        margin-top: 0.45rem;
        color: #647084;
        font-size: 0.72rem;
        font-weight: 500;
        line-height: 1.35;
      }

      @media (max-width: 1024px) {
        .erp-sidebar {
          display: none;
        }
      }

      @media (prefers-reduced-motion: reduce) {
        .erp-sidebar__link,
        .erp-sidebar__icon,
        .erp-sidebar__active-dot {
          transition: none;
        }
      }
    `,
  ],
})
export class SidebarComponent {
  readonly receiptTextIcon = ReceiptTextIcon;

  readonly menuSections: MenuSection[] = [
    {
      label: 'Inicio',
      items: [{ path: '/', label: 'Dashboard', icon: 'layout-dashboard', exact: true, hint: 'Mesa del periodo' }],
    },
    {
      label: 'Personas',
      items: [
        { path: '/empleados', label: 'Empleados', icon: 'users', hint: 'Registro laboral y expedientes' },
        { path: '/licencias-medicas', label: 'Licencias médicas', icon: 'heart-pulse', hint: 'Control de ausencias' },
      ],
    },
    {
      label: 'Remuneraciones',
      items: [
        {
          path: '/remuneraciones/proceso-mensual',
          label: 'Preparar nómina',
          icon: 'file-text',
          hint: 'Bitácora del periodo',
        },
        {
          path: '/remuneraciones/novedades-mensuales',
          label: 'Movimientos',
          icon: 'calendar-plus',
          hint: 'Del mes, recurrentes y cuotas',
        },
        {
          path: '/remuneraciones/liquidaciones',
          label: 'Liquidaciones oficiales',
          icon: 'file-check-2',
          hint: 'Acta de salida interna',
        },
        {
          path: '/remuneraciones/conceptos',
          label: 'Conceptos de remuneración',
          icon: 'tags',
          exact: true,
          hint: 'Catálogo maestro',
        },
      ],
    },
    {
      label: 'Administración',
      items: [
        { path: '/reportes', label: 'Reportes', icon: 'bar-chart-3', hint: 'Vistas operativas' },
        { path: '/parametros', label: 'Parámetros', icon: 'settings', hint: 'Registro normativo' },
      ],
    },
  ];

  trackSection(index: number, section: MenuSection): string {
    return section.label ?? `principal-${index}`;
  }

  trackItem(_index: number, item: MenuItem): string {
    return item.path;
  }
}
