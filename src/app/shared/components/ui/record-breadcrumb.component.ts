import { CommonModule } from '@angular/common';
import { Component, Input, Output } from '@angular/core';
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
      <nav class="record-breadcrumb" aria-label="Navegacion secundaria">
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
        grid-template-columns: 1fr auto 1fr;
        align-items: center;
      }

      .record-breadcrumb {
        justify-self: start;
      }

      .header-title {
        justify-self: center;
        text-align: center;
      }

      .header-right {
        justify-self: end;
      }
      .record-breadcrumb {
        display: flex;
        width: 100%;
        min-height: 1.5rem;
        min-width: 0;
        align-items: center;
        gap: 0.35rem;
        color: #64748b;
        font-size: 0.78rem;
        font-weight: 500;
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
        color: #475569;
        text-decoration: none;
      }

      .record-breadcrumb-home {
        display: grid;
        width: 1.5rem;
        flex: 0 0 1.5rem;
        place-items: center;
        line-height: 0;
      }

      .record-breadcrumb-home lucide-icon {
        display: grid;
        place-items: center;
        width: 1rem;
        height: 1rem;
      }

      .record-breadcrumb-home lucide-icon ::ng-deep svg {
        display: block;
        width: 1rem;
        height: 1rem;
      }

      .record-breadcrumb-link,
      .record-breadcrumb-current {
        display: inline-flex;
      }

      .record-breadcrumb-link:hover,
      .record-breadcrumb-home:hover {
        color: #1d4ed8;
      }

      .record-breadcrumb-link {
        max-width: 14rem;
        overflow: hidden;
        line-height: 1.5rem;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .record-breadcrumb-link:hover {
        text-decoration: underline;
        text-underline-offset: 0.18rem;
      }

      .record-breadcrumb-separator {
        width: 0.9rem;
        height: 1.5rem;
        color: #94a3b8;
        flex: 0 0 auto;
      }

      .record-breadcrumb-current {
        max-width: 18rem;
        overflow: hidden;
        color: #1d4ed8;
        font-weight: 600;
        line-height: 1.5rem;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    `,
  ],
})
export class RecordBreadcrumbComponent {
  @Input() homeLink: string | readonly string[] = '/';
  @Input() items: readonly RecordBreadcrumbItem[] = [];
  @Input() title: string = '';

}
