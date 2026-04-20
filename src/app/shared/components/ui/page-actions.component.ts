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
        gap: 0.2rem;
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
      'inline-flex h-10 min-w-[8.25rem] items-center justify-center gap-2 rounded-lg border px-4 text-sm font-semibold transition-colors duration-200';

    if (action === 'save') {
      return `${base} border-blue-700 bg-blue-700 text-white hover:border-blue-800 hover:bg-blue-800`;
    }

    if (action === 'back') {
      return `${base} border-slate-300 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50 hover:text-slate-900`;
    }

    return `${base} border-slate-300 bg-slate-50 text-slate-700 hover:border-slate-400 hover:bg-slate-100 hover:text-slate-900`;
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
