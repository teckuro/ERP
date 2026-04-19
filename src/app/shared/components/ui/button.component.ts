import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'app-button',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button
      type="button"
      [disabled]="disabled"
      class="inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors duration-200"
      [class.bg-blue-600]="variant === 'primary'"
      [class.text-white]="variant === 'primary' || variant === 'secondary' || variant === 'danger'"
      [class.hover:bg-blue-700]="variant === 'primary'"
      [class.active:bg-blue-800]="variant === 'primary'"
      [class.bg-gray-600]="variant === 'secondary'"
      [class.hover:bg-gray-700]="variant === 'secondary'"
      [class.active:bg-gray-800]="variant === 'secondary'"
      [class.bg-white]="variant === 'outline'"
      [class.border]="variant === 'outline'"
      [class.border-gray-300]="variant === 'outline'"
      [class.text-gray-700]="variant === 'outline' || variant === 'ghost'"
      [class.hover:bg-gray-50]="variant === 'outline'"
      [class.bg-red-600]="variant === 'danger'"
      [class.hover:bg-red-700]="variant === 'danger'"
      [class.active:bg-red-800]="variant === 'danger'"
      [class.bg-transparent]="variant === 'ghost'"
      [class.hover:bg-gray-100]="variant === 'ghost'"
      [class.px-3]="size === 'sm'"
      [class.py-1.5]="size === 'sm'"
      [class.px-4]="size === 'md'"
      [class.py-2]="size === 'md'"
      [class.px-6]="size === 'lg'"
      [class.py-3]="size === 'lg'"
      [class.text-sm]="size === 'sm' || size === 'md'"
      [class.text-base]="size === 'lg'"
      [class.opacity-50]="disabled"
      [class.cursor-not-allowed]="disabled"
      [class.cursor-pointer]="!disabled"
      [class]="className"
    >
      <ng-content select="[icon]" />
      <ng-content />
    </button>
  `,
})
export class ButtonComponent {
  @Input() variant: ButtonVariant = 'primary';
  @Input() size: ButtonSize = 'md';
  @Input() disabled = false;
  @Input() className = '';
}

