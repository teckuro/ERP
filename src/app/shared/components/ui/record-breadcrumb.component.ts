import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';

export interface RecordBreadcrumbItem {
  label: string;
  link?: string | readonly string[];
}

@Component({
  selector: 'app-record-breadcrumb',
  standalone: true,
  imports: [CommonModule, RouterLink, LucideAngularModule],
  template: `
    <div class="header">
      <nav class="record-breadcrumb" aria-label="Navegación secundaria">
        <a class="record-breadcrumb-home" [routerLink]="homeLink" aria-label="Inicio">
          <lucide-icon name="home" aria-hidden="true"></lucide-icon>
        </a>

        @for (item of items; track item.label; let last = $last) {
          <lucide-icon class="record-breadcrumb-separator" name="chevron-right" aria-hidden="true"></lucide-icon>

          @if (!last && item.link) {
            <a class="record-breadcrumb-link" [routerLink]="item.link">{{ item.label }}</a>
          } @else {
            <span class="record-breadcrumb-current" [attr.aria-current]="last ? 'page' : null">
              {{ item.label }}
            </span>
          }
        }
      </nav>
      <div class="header-title">
        <h1>{{ title || 'Sin título' }}</h1>
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .header {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
        align-items: center;
        gap: 1rem;
        min-width: 0;
      }

      .record-breadcrumb {
        justify-self: start;
      }

      .header-title {
        justify-self: center;
        min-width: 0;
        text-align: center;
      }

      .header-title h1 {
        overflow: hidden;
        margin: 0;
        color: #172033;
        font-size: 1.2rem;
        font-weight: 650;
        letter-spacing: -0.01em;
        line-height: 1.25;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .record-breadcrumb {
        display: flex;
        width: 100%;
        min-height: 1.5rem;
        min-width: 0;
        align-items: center;
        gap: 0.35rem;
        color: #647084;
        font-size: 0.76rem;
        font-weight: 550;
        line-height: 1.25rem;
      }

      .record-breadcrumb-home,
      .record-breadcrumb-link,
      .record-breadcrumb-current {
        height: 1.5rem;
        min-width: 0;
        align-items: center;
        justify-content: center;
      }

      .record-breadcrumb-home,
      .record-breadcrumb-link {
        color: #647084;
        text-decoration: none;
      }

      .record-breadcrumb-home {
        display: grid;
        width: 1.5rem;
        flex: 0 0 1.5rem;
        place-items: center;
        border: 1px solid #daddd6;
        border-radius: 0.45rem;
        background: #fafaf7;
        line-height: 0;
        transition:
          border-color 150ms ease,
          background-color 150ms ease,
          color 150ms ease;
      }

      .record-breadcrumb-home lucide-icon {
        display: grid;
        width: 0.9rem;
        height: 0.9rem;
        place-items: center;
      }

      .record-breadcrumb-link,
      .record-breadcrumb-current {
        display: inline-flex;
      }

      .record-breadcrumb-link:hover,
      .record-breadcrumb-home:hover {
        border-color: #c7d0c4;
        background: #ffffff;
        color: #172033;
      }

      .record-breadcrumb-link {
        max-width: 14rem;
        overflow: hidden;
        border-radius: 0.4rem;
        padding: 0 0.15rem;
        line-height: 1.5rem;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .record-breadcrumb-separator {
        width: 0.8rem;
        height: 1.5rem;
        color: #a5adba;
        flex: 0 0 auto;
      }

      .record-breadcrumb-current {
        max-width: 18rem;
        overflow: hidden;
        color: #172033;
        font-weight: 650;
        line-height: 1.5rem;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      @media (max-width: 760px) {
        .header {
          grid-template-columns: 1fr;
          gap: 0.5rem;
        }

        .header-title,
        .record-breadcrumb {
          justify-self: start;
          text-align: left;
        }
      }
    `,
  ],
})
export class RecordBreadcrumbComponent {
  @Input() homeLink: string | readonly string[] = '/';
  @Input() items: readonly RecordBreadcrumbItem[] = [];
  @Input() title = '';
}
