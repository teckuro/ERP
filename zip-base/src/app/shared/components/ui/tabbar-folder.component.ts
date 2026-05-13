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
        border-radius: 0 8px 8px 8px;
        background: #ffffff;
        box-shadow: none;
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
