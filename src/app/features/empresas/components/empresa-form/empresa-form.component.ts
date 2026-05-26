import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { SearchSelectComponent, SearchSelectOption } from '../../../../shared/components/ui/forms/search-select.component';
import type { EmpresaFormPayload, EmpresaFormValidation, OrganismoMutualCatalogo } from '../../models/empresa.model';

@Component({
  selector: 'app-empresa-form',
  standalone: true,
  imports: [CommonModule, FormsModule, SearchSelectComponent],
  templateUrl: './empresa-form.component.html',
  styleUrl: './empresa-form.component.css',
})
export class EmpresaFormComponent {
  @Input({ required: true }) model!: EmpresaFormPayload;
  @Input() rutCompleto = '';
  @Input() organismos: OrganismoMutualCatalogo[] = [];
  @Input() validacion: EmpresaFormValidation | null = null;
  @Input() readonlyMode = false;

  @Output() modelChange = new EventEmitter<EmpresaFormPayload>();
  @Output() rutCompletoChange = new EventEmitter<string>();

  get organismoOptions(): SearchSelectOption<number>[] {
    return this.organismos.map((organismo) => ({
      value: organismo.idOrganismoMutual,
      label: `${organismo.codigo} · ${organismo.nombre}`,
      searchText: `${organismo.codigo} ${organismo.nombre} ${organismo.tipo}`,
    }));
  }

  patch(partial: Partial<EmpresaFormPayload>): void {
    this.modelChange.emit({ ...this.model, ...partial });
  }

  onRutChange(value: string): void {
    this.rutCompletoChange.emit(value);
  }

  onAplicaMutualChange(checked: boolean): void {
    if (!checked) {
      this.modelChange.emit({
        ...this.model,
        aplicaMutual: false,
        idOrganismoMutual: null,
        tasaAdicionalDiferenciada: null,
        fuenteResolucionOCertificado: null,
        vigenciaInicio: null,
        vigenciaFin: null,
      });
      return;
    }
    this.patch({ aplicaMutual: true });
  }

  errorCampo(campo: keyof EmpresaFormPayload | 'rutCompleto'): string | null {
    return this.validacion?.erroresCampo?.[campo] ?? null;
  }
}
