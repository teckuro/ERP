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
    return `block bg-white rounded-lg border border-gray-200 ${
      this.hover ? 'hover:shadow-md transition-shadow duration-200' : ''
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
    return `block px-6 py-4 border-b border-gray-200 ${this.className}`.trim();
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
    return `block p-6 ${this.className}`.trim();
  }
}

