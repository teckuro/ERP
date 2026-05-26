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
        min-width: 0;
        border-bottom: 1px solid #daddd6;
        padding-bottom: 0.65rem;
        text-align: center;
      }

      .page-title-heading {
        margin: 0;
        color: #172033;
        font-size: 1.26rem;
        font-weight: 650;
        letter-spacing: -0.01em;
        line-height: 1.2;
      }

      .page-title-copy {
        margin: 0;
        max-width: 50rem;
        color: #647084;
        font-size: 0.84rem;
        font-weight: 450;
        line-height: 1.45;
      }
    `,
  ],
})
export class PageTitleComponent {
  @Input() title = '';
  @Input() subtitle = '';
}
