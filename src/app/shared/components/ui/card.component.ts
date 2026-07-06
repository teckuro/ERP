import { Component, HostBinding, Input } from '@angular/core';

@Component({
  selector: 'app-card',
  standalone: true,
  template: ` <ng-content /> `,
  styles: [
    `
      :host {
        border-color: #daddd6;
        box-shadow: none;
        color: #172033;
      }

      :host(.erp-card--hover) {
        transition:
          border-color 150ms ease,
          background-color 150ms ease;
      }

      :host(.erp-card--hover:hover) {
        border-color: #c7d0c4;
        background: #fafaf7;
      }
    `,
  ],
})
export class CardComponent {
  @Input() className = '';
  @Input() hover = false;

  @HostBinding('class')
  get hostClass(): string {
    return `erp-card block rounded-md border border-gray-200 bg-white ${this.hover ? 'erp-card--hover' : ''} ${
      this.className
    }`.trim();
  }
}

@Component({
  selector: 'app-card-header',
  standalone: true,
  template: ` <ng-content /> `,
})
export class CardHeaderComponent {
  @Input() className = '';

  @HostBinding('class')
  get hostClass(): string {
    return `block border-b border-gray-200 bg-[#fafaf7] px-4 py-3 ${this.className}`.trim();
  }
}

@Component({
  selector: 'app-card-content',
  standalone: true,
  template: ` <ng-content /> `,
})
export class CardContentComponent {
  @Input() className = '';

  @HostBinding('class')
  get hostClass(): string {
    return `block p-4 ${this.className}`.trim();
  }
}
