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
        gap: 0.35rem;
        text-align: center;
        border-bottom: 1px solid rgba(203, 213, 225, 0.7);
      }

      .page-title-heading {
        margin: 0;
        font-size: clamp(1.45rem, 1.2rem + 0.7vw, 1.9rem);
        font-weight: 700;
        letter-spacing: -0.035em;
        line-height: 1.15;
        color: #2f4863;
      }

      .page-title-copy {
        margin: 0;
        max-width: 48rem;
        font-size: 0.94rem;
        line-height: 1.55;
        color: #64748b;
      }
    `,
  ],
})
export class PageTitleComponent {
  @Input() title = '';
  @Input() subtitle = '';
}