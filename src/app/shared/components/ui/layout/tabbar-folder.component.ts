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
        display: flex;
        flex-direction: column;
        gap: 0;
        width: 100%;
      }

      .folder-header {
        position: relative;
        z-index: 2;
        margin-bottom: -1px;
      }

      .folder-body {
        position: relative;
        z-index: 1;
        margin-top: -1px;
        min-height: 22rem;
        padding: 1rem;
        border: 1px solid #dbe2ea;
        border-radius: 0 8px 8px 8px;
        background: #ffffff;
        box-shadow: none;
      }

      @media (min-width: 768px) {
        .folder-body {
          padding: 1.15rem;
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
