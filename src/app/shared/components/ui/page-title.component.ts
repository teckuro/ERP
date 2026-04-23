import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-page-title',
  standalone: true,
  imports: [CommonModule],
  template: `
    <header class="page-title-shell">
      @if (title.trim()) {
        <h1 class="page-title-heading">{{ title }}</h1>
      }

      @if (subtitle.trim()) {
        <p class="page-title-copy">{{ subtitle }}</p>
      }
    </header>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .page-title-shell {
        display: grid;
        justify-items: center;
        gap: 4px;
        text-align: center;
        border-bottom: 1px solid #e5e7eb;
      }

      .page-title-heading {
        margin: 0;
        color: #111827;
        font-size: 1.5rem;
        font-weight: 800;
        letter-spacing: 0;
        line-height: 1.2;
      }

      .page-title-copy {
        margin: 0;
        max-width: 48rem;
        color: #6b7280;
        font-size: 0.9rem;
        line-height: 1.45;
      }
    `,
  ],
})
export class PageTitleComponent {
  @Input() title = '';
  @Input() subtitle = '';
}
