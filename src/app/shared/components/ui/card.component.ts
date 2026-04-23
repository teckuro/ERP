import { Component, HostBinding, Input } from '@angular/core';

@Component({
  selector: 'app-card',
  standalone: true,
  template: ` <ng-content /> `,
})
export class CardComponent {
  @Input() className = '';
  @Input() hover = false;

  @HostBinding('class')
  get hostClass(): string {
    return `block rounded-lg border border-gray-200 bg-white ${
      this.hover ? 'transition-colors duration-150 hover:border-gray-300' : ''
    } ${this.className}`.trim();
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
    return `block border-b border-gray-200 px-4 py-3 ${this.className}`.trim();
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

