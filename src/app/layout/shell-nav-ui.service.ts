import { Injectable, signal } from '@angular/core';

/** Estado UI del menú lateral en viewport ≤1024px (drawer overlay). */
@Injectable({ providedIn: 'root' })
export class ShellNavUiService {
  private readonly open = signal(false);

  readonly mobileNavOpen = this.open.asReadonly();

  openNav(): void {
    this.open.set(true);
  }

  closeNav(): void {
    this.open.set(false);
  }

  toggleNav(): void {
    this.open.update((value) => !value);
  }
}
