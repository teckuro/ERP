import { CommonModule } from '@angular/common';
import { Component, HostBinding, Input } from '@angular/core';

@Component({
  selector: 'app-tabbar-folder',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="folder-shell">
      <div class="folder-header">
        <ng-content select="[tabbarHeader]"></ng-content>
      </div>

      <div class="folder-body">
        <ng-content select="[tabbarBody]"></ng-content>
      </div>
    </section>
  `,
  styles: [
    `
      :host {
        display: block;
        width: 100%;
      }

      .folder-shell {
        position: relative;
        width: 100%;
      }

      .folder-header {
        position: relative;
      }

      .folder-body {
        position: relative;
        z-index: 1;
        margin-top: -1px;
        min-height: 22rem;
        padding: 1.25rem;
        border: 1px solid rgba(203, 213, 225, 0.95);
        border-radius: 0 1.25rem 1.25rem 1.25rem;
        background:
          linear-gradient(180deg, rgba(248, 250, 252, 0.96), rgba(255, 255, 255, 0.98)),
          repeating-linear-gradient(
            0deg,
            rgba(148, 163, 184, 0.04) 0,
            rgba(148, 163, 184, 0.04) 1px,
            transparent 1px,
            transparent 36px
          );
        box-shadow:
          0 18px 38px rgba(15, 23, 42, 0.06),
          inset 0 1px 0 rgba(255, 255, 255, 0.9);
      }

      @media (min-width: 768px) {
        .folder-body {
          padding: 1.5rem;
        }
      }
    `,
  ],
})
export class TabbarFolderComponent {
  @Input() className = '';

  @HostBinding('class')
  get hostClass(): string {
    return this.className;
  }
}
