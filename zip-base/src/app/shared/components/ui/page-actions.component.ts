import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  LucideAngularModule,
  ArrowLeftIcon,
  DownloadIcon,
  UploadIcon,
  PencilIcon,
  SaveIcon,
} from 'lucide-angular';

import { ButtonComponent } from './button.component';

export type PageActionType = 'back' | 'save' | 'edit' | 'export' | 'import';
@Component({
  selector: 'app-page-actions',
  standalone: true,
  imports: [CommonModule, RouterLink, LucideAngularModule, ButtonComponent],
  template: `
    <div class="page-actions-toolbar">
      @if (hasAction('back')) {
        @if (backLink) {
          <a
            [routerLink]="backLink"
            [class]="actionClass('back')"
          >
            <lucide-icon class="h-4 w-4" [img]="ArrowLeftIcon"></lucide-icon>
            {{ backLabel }}
          </a>
        } @else {
          <app-button variant="outline" size="md" [className]="actionClass('back')" (click)="backClick.emit()">
            <lucide-icon class="h-4 w-4" [img]="ArrowLeftIcon"></lucide-icon>
            {{ backLabel }}
          </app-button>
        }
      }

      @if (hasAction('import')) {
        <app-button
          variant="outline"
          size="md"
          [className]="actionClass('import')"
          [disabled]="importDisabled"
          (click)="importClick.emit()"
        >
          <lucide-icon class="h-4 w-4" [img]="DownloadIcon"></lucide-icon>
          {{ importLabel }}
        </app-button>
      }

      @if (hasAction('export')) {
        <app-button
          variant="outline"
          size="md"
          [className]="actionClass('export')"
          [disabled]="exportDisabled"
          (click)="exportClick.emit()"
        >
          <lucide-icon class="h-4 w-4" [img]="UploadIcon"></lucide-icon>
          {{ exportLabel }}
        </app-button>
      }

      @if (hasAction('edit')) {
        <span class="inline-flex max-w-full" [attr.title]="editTooltip.trim() ? editTooltip : null">
          <app-button
            variant="outline"
            size="md"
            [className]="actionClass('edit')"
            [disabled]="editDisabled"
            (click)="editClick.emit()"
          >
            <lucide-icon class="h-4 w-4" [img]="PencilIcon"></lucide-icon>
            {{ editLabel }}
          </app-button>
        </span>
      }

      @if (hasAction('save')) {
        <app-button
          variant="primary"
          size="md"
          [className]="actionClass('save')"
          [disabled]="saveDisabled"
          (click)="saveClick.emit()"
        >
          <lucide-icon class="h-4 w-4" [img]="SaveIcon"></lucide-icon>
          {{ saveLabel }}
        </app-button>
      }
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .page-actions-toolbar {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: end;
        gap: 8px;
        width: 100%;
      }
    `,
  ],
})
export class PageActionsComponent {
  @Input() backLink: string | readonly string[] | null = null;
  @Input() visibleActions: readonly PageActionType[] = [];

  @Input() showBack = true;
  @Input() showSave = false;
  @Input() showEdit = false;
  @Input() showExport = false;
  @Input() showImport = false;

  @Input() saveDisabled = false;
  @Input() editDisabled = false;
  @Input() exportDisabled = false;
  @Input() importDisabled = false;

  @Input() backLabel = 'Volver';
  @Input() saveLabel = 'Guardar';
  @Input() editLabel = 'Modificar';
  /** Texto nativo (tooltip) al pasar el mouse sobre Modificar; opcional. */
  @Input() editTooltip = '';
  @Input() exportLabel = 'Exportar';
  @Input() importLabel = 'Importar';

  @Output() readonly backClick = new EventEmitter<void>();
  @Output() readonly saveClick = new EventEmitter<void>();
  @Output() readonly editClick = new EventEmitter<void>();
  @Output() readonly exportClick = new EventEmitter<void>();
  @Output() readonly importClick = new EventEmitter<void>();

  readonly ArrowLeftIcon = ArrowLeftIcon;
  readonly DownloadIcon = DownloadIcon;
  readonly UploadIcon = UploadIcon;
  readonly PencilIcon = PencilIcon;
  readonly SaveIcon = SaveIcon;

  actionClass(action: PageActionType): string {
    const base =
      'erp-toolbar-button erp-action-button';

    if (action === 'save') {
      return `${base} border-blue-600 bg-blue-600 text-white hover:border-blue-700 hover:bg-blue-700`;
    }

    if (action === 'back') {
      return `${base} border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-900`;
    }

    return `${base} border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-900`;
  }

  hasAction(action: PageActionType): boolean {
    if (this.visibleActions.length > 0) {
      return this.visibleActions.includes(action);
    }

    switch (action) {
      case 'back':
        return this.showBack;
      case 'save':
        return this.showSave;
      case 'edit':
        return this.showEdit;
      case 'export':
        return this.showExport;
      case 'import':
        return this.showImport;
    }
  }
}
