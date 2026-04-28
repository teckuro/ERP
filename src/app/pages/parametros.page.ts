import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, ViewEncapsulation, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';

import {
  AfpParametro,
  ApvApvcFormaPago,
  ApvApvcInstitucion,
  CcafEntidad,
  IsapreParametro,
  Ley16744Parametro,
  OrganismoLey16744,
  ParametroGeneral,
  ParametroLegal,
  ParametrosGeneralesCatalogos,
  ParametrosTabId,
  ReformaPrevisionalParametro,
  TablaImpuestoUnicoParametro,
  TrabajoPesadoParametro,
  TramoCargaParametro,
  TramoImpuestoParametro,
} from '../features/parametros-generales/models/parametro-general.model';
import { ParametrosGeneralesService } from '../features/parametros-generales/services/parametros-generales.service';
import { ButtonComponent } from '../shared/components/ui/button.component';
import { DataGridColumn } from '../shared/components/ui/data-grid.component';
import { CardComponent, CardContentComponent } from '../shared/components/ui/card.component';
import { MessageBoxComponent } from '../shared/components/ui/message-box.component';
import { PageActionsComponent } from '../shared/components/ui/page-actions.component';
import {
  RecordBreadcrumbComponent,
  RecordBreadcrumbItem,
} from '../shared/components/ui/record-breadcrumb.component';
import { ParametrosRemuneracionesTabComponent } from '../features/parametros-generales/components/tabs/parametros-remuneraciones-tab.component';
import { ParametrosValoresTabComponent } from '../features/parametros-generales/components/tabs/parametros-valores-tab.component';
import { ParametrosAfpTabComponent } from '../features/parametros-generales/components/tabs/parametros-afp-tab.component';
import { ParametrosCcafMutualesTabComponent } from '../features/parametros-generales/components/tabs/parametros-ccaf-mutuales-tab.component';
import { ParametrosIsapreTabComponent } from '../features/parametros-generales/components/tabs/parametros-isapre-tab.component';
import { ParametrosReformaTabComponent } from '../features/parametros-generales/components/tabs/parametros-reforma-tab.component';
import { ParametrosTramosCargaTabComponent } from '../features/parametros-generales/components/tabs/parametros-tramos-carga-tab.component';
import { ParametrosTramosRentaTabComponent } from '../features/parametros-generales/components/tabs/parametros-tramos-renta-tab.component';

interface ParametrosTab {
  id: ParametrosTabId;
  label: string;
}

interface MonthOption {
  value: string;
  label: string;
}

@Component({
  selector: 'app-parametros-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    LucideAngularModule,
    ButtonComponent,
    PageActionsComponent,
    MessageBoxComponent,
    RecordBreadcrumbComponent,
    CardComponent,
    CardContentComponent,
    ParametrosValoresTabComponent,
    ParametrosRemuneracionesTabComponent,
    ParametrosCcafMutualesTabComponent,
    ParametrosTramosCargaTabComponent,
    ParametrosTramosRentaTabComponent,
    ParametrosIsapreTabComponent,
    ParametrosAfpTabComponent,
    ParametrosReformaTabComponent,
  ],
  template: `
    <section class="parametros-page" aria-label="Mantenedor de parametros">
      <header class="parametros-header">
        <app-record-breadcrumb [items]="breadcrumbItems" title="Parametros del sistema"></app-record-breadcrumb>
      </header>

      <app-card className="parametros-shell">
        <app-card-content className="parametros-frame">
          <div class="parametros-viewhead">
        <div class="parametros-toolbar" aria-label="Acciones de parametros">
          @if (!hasAnySyncedData()) {
            <app-button
              variant="outline"
              size="md"
              className="erp-toolbar-button erp-action-button"
              [disabled]="isLoading() || isSaving()"
              (click)="sincronizar()"
            >
              <lucide-icon icon class="h-4 w-4" name="refresh-cw"></lucide-icon>
              Sincronizar
            </app-button>
          }

          @if (generalesEditando()) {
            <app-page-actions
              [visibleActions]="['back', 'save']"
              backLabel="Volver"
              [saveLabel]="saveLabel()"
              backLink="/"
              [saveDisabled]="isSaving() || isLoading() || form.invalid"
              (saveClick)="guardar()"
              (backClick)="volverParametrosAction()"
            ></app-page-actions>
          } @else {
            <app-page-actions
              [visibleActions]="['edit']"
              editLabel="Modificar"
              [editDisabled]="isLoading() || isSaving() || !isConfigurableTab()"
              (editClick)="editarParametros()"
            ></app-page-actions>
          }
        </div>

        <div class="period-row" aria-label="Periodo">
          <span class="period-label">Periodo</span>
          <div class="period-controls">
            <button
              type="button"
              class="period-arrow"
              aria-label="Periodo anterior"
              [disabled]="isLoading() || isSaving()"
              (click)="moverPeriodo(-1)"
            >
              <lucide-icon class="h-4 w-4" name="arrow-left"></lucide-icon>
            </button>

            <select
              class="param-select period-year"
              [ngModel]="selectedYear()"
              (ngModelChange)="seleccionarAnioValue($event)"
            >
              @for (year of yearOptions(); track year) {
                <option [value]="asString(year)">{{ year }}</option>
              }
            </select>

            <select
              class="param-select period-month"
              [ngModel]="selectedMonth()"
              (ngModelChange)="seleccionarMesValue($event)"
            >
              @for (month of monthOptions; track month.value) {
                <option [value]="month.value">{{ month.label }}</option>
              }
            </select>

            <button
              type="button"
              class="period-arrow"
              aria-label="Periodo siguiente"
              [disabled]="isLoading() || isSaving()"
              (click)="moverPeriodo(1)"
            >
              <lucide-icon class="h-4 w-4" name="chevron-right"></lucide-icon>
            </button>
          </div>

          <span class="period-status">
            {{ hasSelectedInRows() ? 'Periodo cargado' : 'Periodo sin registro' }} · {{ selectedPeriodo() }}
          </span>
        </div>
          </div>

      <div class="parametros-content">
        @if (isLoading()) {
          <app-message-box
            variant="loading"
            mode="modal"
            title="Cargando parametros"
            message="Obteniendo parametros mensuales y cargas externas."
          ></app-message-box>
        }

        @if (errorMessage()) {
          <app-message-box
            variant="error"
            title="No fue posible completar la operacion"
            [message]="errorMessage() ?? ''"
            [dismissible]="true"
            (dismiss)="errorMessage.set(null)"
          ></app-message-box>
        }

        @if (successMessage()) {
          <app-message-box
            variant="success"
            title="Parametros actualizados"
            [message]="successMessage() ?? ''"
            [dismissible]="true"
            (dismiss)="successMessage.set(null)"
          ></app-message-box>
        }

        <nav class="folder-tabs" aria-label="Secciones de parametros">
          @for (tab of tabs; track tab.id) {
            <button
              type="button"
              class="folder-tab"
              [class.folder-tab--active]="activeTab() === tab.id"
              [attr.aria-current]="activeTab() === tab.id ? 'page' : null"
              (click)="seleccionarTab(tab.id)"
            >
              {{ tab.label }}
            </button>
          }
        </nav>

        @switch (activeTab()) {
          @case ('valores') {
            <app-parametros-valores-tab
              [form]="form"
              [editable]="generalesEditando()"
              [fechaActualizacionLabel]="fechaActualizacionLabel()"
              [bloquearSiLectura]="bloquearSiLectura.bind(this)"
              [setDescuentosBaseFn]="setDescuentosBase.bind(this)"
              [onSubmit]="guardar.bind(this)"
            ></app-parametros-valores-tab>
          }

          @case ('remuneraciones') {
            <app-parametros-remuneraciones-tab
              [form]="form"
              [editable]="generalesEditando()"
              [fechaActualizacionLabel]="fechaActualizacionLabel()"
              [onSubmit]="guardar.bind(this)"
            >
              <div class="parametros-form-projection" [formGroup]="form">
                <section class="param-group" aria-labelledby="sis-title">
                  <h2 id="sis-title">Cotizaciones Empleador</h2>
                  <div class="field-grid field-grid--sis">
                    <label class="param-field">
                      <span>SIS</span>
                      <span class="unit-field unit-field--suffix" data-unit="%">
                        <input class="param-input text-right" type="number" step="0.001" formControlName="sis" [readonly]="!generalesEditando()" />
                      </span>
                    </label>

                  <label class="param-field">
                    <span>SANNA</span>
                    <span class="unit-field unit-field--suffix" data-unit="%">
                      <input class="param-input text-right" type="number" step="0.001" formControlName="sanna" [readonly]="!generalesEditando()" />
                    </span>
                  </label>

                  <label class="param-field">
                    <span>Seguro social expectativa de vida</span>
                    <span class="unit-field unit-field--suffix" data-unit="%">
                      <input
                        class="param-input text-right"
                        type="number"
                        step="0.001"
                        formControlName="seguroSocialExpectativaVida"
                        [readonly]="!generalesEditando()"
                      />
                    </span>
                  </label>

                  <label class="param-field">
                    <span>Aporte empleador AFP</span>
                    <span class="unit-field unit-field--suffix" data-unit="%">
                      <input
                        class="param-input text-right"
                        type="number"
                        step="0.001"
                        formControlName="aporteEmpleadorAfp"
                        [readonly]="!generalesEditando()"
                      />
                    </span>
                  </label>
                  </div>
                </section>

                <section class="param-group" aria-labelledby="topes-title">
                  <h2 id="topes-title">Topes</h2>
                  <div class="field-grid field-grid--topes">
                    <label class="param-field">
                      <span>AFP UF</span>
                      <span class="unit-field unit-field--suffix" data-unit="UF">
                        <input class="param-input text-right" type="number" step="0.01" formControlName="topeAfpUf" [readonly]="!generalesEditando()" />
                      </span>
                    </label>

                  <label class="param-field">
                    <span>AFP pesos</span>
                    <span class="unit-field unit-field--suffix" data-unit="$">
                      <input class="param-input text-right" type="number" step="1" formControlName="topeAfp" [readonly]="!generalesEditando()" />
                    </span>
                  </label>

                  <label class="param-field">
                    <span>IPS UF</span>
                    <span class="unit-field unit-field--suffix" data-unit="UF">
                      <input class="param-input text-right" type="number" step="0.01" formControlName="topeIpsUf" [readonly]="!generalesEditando()" />
                    </span>
                  </label>

                  <label class="param-field">
                    <span>IPS pesos</span>
                    <span class="unit-field unit-field--suffix" data-unit="$">
                      <input class="param-input text-right" type="number" step="1" formControlName="topeIps" [readonly]="!generalesEditando()" />
                    </span>
                  </label>

                  <label class="param-field">
                    <span>Cesantia UF</span>
                    <span class="unit-field unit-field--suffix" data-unit="UF">
                      <input
                        class="param-input text-right"
                        type="number"
                        step="0.01"
                        formControlName="topeCesantiaUf"
                        [readonly]="!generalesEditando()"
                      />
                    </span>
                  </label>

                  <label class="param-field">
                    <span>Cesantia pesos</span>
                    <span class="unit-field unit-field--suffix" data-unit="$">
                      <input
                        class="param-input text-right"
                        type="number"
                        step="1"
                        formControlName="topeCesantia"
                        [readonly]="!generalesEditando()"
                      />
                    </span>
                  </label>

                  <label class="param-field">
                    <span>APV mensual UF</span>
                    <span class="unit-field unit-field--suffix" data-unit="UF">
                      <input
                        class="param-input text-right"
                        type="number"
                        step="0.01"
                        formControlName="topeApvMensualUf"
                        [readonly]="!generalesEditando()"
                      />
                    </span>
                  </label>

                  <label class="param-field">
                    <span>APV mensual pesos</span>
                    <span class="unit-field unit-field--suffix" data-unit="$">
                      <input
                        class="param-input text-right"
                        type="number"
                        step="1"
                        formControlName="topeApvMensual"
                        [readonly]="!generalesEditando()"
                      />
                    </span>
                  </label>

                  <label class="param-field">
                    <span>APV anual UF</span>
                    <span class="unit-field unit-field--suffix" data-unit="UF">
                      <input
                        class="param-input text-right"
                        type="number"
                        step="0.01"
                        formControlName="topeApvAnualUf"
                        [readonly]="!generalesEditando()"
                      />
                    </span>
                  </label>

                  <label class="param-field">
                    <span>APV anual pesos</span>
                    <span class="unit-field unit-field--suffix" data-unit="$">
                      <input
                        class="param-input text-right"
                        type="number"
                        step="1"
                        formControlName="topeApvAnual"
                        [readonly]="!generalesEditando()"
                      />
                    </span>
                  </label>

                  <label class="param-field">
                    <span>Deposito convenido anual UF</span>
                    <span class="unit-field unit-field--suffix" data-unit="UF">
                      <input
                        class="param-input text-right"
                        type="number"
                        step="0.01"
                        formControlName="topeDepositoConvenidoAnualUf"
                        [readonly]="!generalesEditando()"
                      />
                    </span>
                  </label>

                  <label class="param-field">
                    <span>Deposito convenido anual pesos</span>
                    <span class="unit-field unit-field--suffix" data-unit="$">
                      <input
                        class="param-input text-right"
                        type="number"
                        step="1"
                        formControlName="topeDepositoConvenidoAnual"
                        [readonly]="!generalesEditando()"
                      />
                    </span>
                  </label>
                  </div>
                </section>
              </div>
            </app-parametros-remuneraciones-tab>
          }

          @case ('ccafConfig') {
            <app-parametros-ccaf-mutuales-tab
              mode="config"
              [catalogos]="catalogos()"
              [ccafColumns]="ccafColumns"
              [organismosLeyColumns]="organismosLeyColumns"
              [ley16744Columns]="ley16744Columns"
              [loading]="isLoading()"
              [selectedCcafId]="selectedCcafId()"
              [selectedMutualId]="selectedMutualId()"
              [percentLabel]="decimal(selectedLey16744Rate(), 2)"
              [seleccionarCcaf]="seleccionarCcaf.bind(this)"
              [seleccionarMutual]="seleccionarMutual.bind(this)"
              [refresh]="cargar.bind(this)"
            ></app-parametros-ccaf-mutuales-tab>
          }

          @case ('ccafLista') {
            <app-parametros-ccaf-mutuales-tab
              mode="ccafLista"
              [catalogos]="catalogos()"
              [ccafColumns]="ccafColumns"
              [organismosLeyColumns]="organismosLeyColumns"
              [ley16744Columns]="ley16744Columns"
              [loading]="isLoading()"
              [selectedCcafId]="selectedCcafId()"
              [selectedMutualId]="selectedMutualId()"
              [percentLabel]="decimal(selectedLey16744Rate(), 2)"
              [seleccionarCcaf]="seleccionarCcaf.bind(this)"
              [seleccionarMutual]="seleccionarMutual.bind(this)"
              [refresh]="cargar.bind(this)"
            ></app-parametros-ccaf-mutuales-tab>
          }

          @case ('mutualesLey') {
            <app-parametros-ccaf-mutuales-tab
              mode="mutualesLey"
              [catalogos]="catalogos()"
              [ccafColumns]="ccafColumns"
              [organismosLeyColumns]="organismosLeyColumns"
              [ley16744Columns]="ley16744Columns"
              [loading]="isLoading()"
              [selectedCcafId]="selectedCcafId()"
              [selectedMutualId]="selectedMutualId()"
              [percentLabel]="decimal(selectedLey16744Rate(), 2)"
              [seleccionarCcaf]="seleccionarCcaf.bind(this)"
              [seleccionarMutual]="seleccionarMutual.bind(this)"
              [refresh]="cargar.bind(this)"
            ></app-parametros-ccaf-mutuales-tab>
          }

          @case ('tramosCarga') {
            <app-parametros-tramos-carga-tab
              [rows]="catalogos().tramosCarga"
              [columns]="tramosCargaColumns"
              [loading]="isLoading()"
              [refresh]="cargar.bind(this)"
            ></app-parametros-tramos-carga-tab>
          }

          @case ('tramosRenta') {
            <app-parametros-tramos-renta-tab
              [tablaRows]="catalogos().tablaImpuestoUnico"
              [tablaColumns]="tablaImpuestoColumns"
              [tramosRows]="catalogos().tramosImpuesto"
              [tramosColumns]="tramosImpuestoColumns"
              [loading]="isLoading()"
              [refresh]="cargar.bind(this)"
            ></app-parametros-tramos-renta-tab>
          }

          @case ('isapre') {
            <app-parametros-isapre-tab
              [rows]="catalogos().isapres"
              [columns]="isapreColumns"
              [loading]="isLoading()"
              [refresh]="cargar.bind(this)"
            ></app-parametros-isapre-tab>
          }

          @case ('afp') {
            <app-parametros-afp-tab
              [rows]="catalogos().afp"
              [columns]="afpColumns"
              [loading]="isLoading()"
              [refresh]="cargar.bind(this)"
            ></app-parametros-afp-tab>
          }

          @case ('reforma') {
            <app-parametros-reforma-tab
              [reformaPensiones]="catalogos().reformaPensiones"
              [reformaPrevisional]="catalogos().reformaPrevisional"
              [trabajosPesados]="catalogos().trabajosPesados"
              [apvInstituciones]="catalogos().apvInstituciones"
              [apvFormasPago]="catalogos().apvFormasPago"
              [parametrosLegalesColumns]="parametrosLegalesColumns"
              [reformaPrevisionalColumns]="reformaPrevisionalColumns"
              [trabajosPesadosColumns]="trabajosPesadosColumns"
              [apvInstitucionesColumns]="apvInstitucionesColumns"
              [apvFormasPagoColumns]="apvFormasPagoColumns"
              [loading]="isLoading()"
              [refresh]="cargar.bind(this)"
            ></app-parametros-reforma-tab>
          }
        }
      </div>
        </app-card-content>
      </app-card>
    </section>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .parametros-page {
        --prm-ink: #111827;
        --prm-muted: #6b7280;
        --prm-line: #e5e7eb;
        --prm-soft: #f8fafc;
        --prm-panel: #ffffff;
        --prm-blue: #2563eb;
        --prm-blue-hover: #1d4ed8;
        --prm-blue-soft: #eff6ff;
        display: grid;
        min-width: 0;
        gap: 12px;
        width: 100%;
      }

      .parametros-viewhead {
        display: grid;
        gap: 12px;
        padding: 4px 0 8px;
        background: #f9fafb;
      }

      .parametros-viewhead::after {
        content: '';
        position: absolute;
        right: 0;
        bottom: 0;
        left: 0;
        height: 1px;
        background: transparent;
      }

      .parametros-toolbar {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        gap: 12px;
        flex-wrap: wrap;
      }

      /* Mantiene la botonera fija a la derecha aunque se oculte el botón de sincronizar */
      .parametros-toolbar app-page-actions {
        margin-left: auto;
      }

      .parametros-toolbar app-button {
        white-space: nowrap;
      }

      .parametros-toolbar__main {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }

      .param-select,
      .param-input {
        height: var(--erp-control-height, 23px);
        min-height: var(--erp-control-height, 23px);
        width: 100%;
        max-width: 100%;
        box-sizing: border-box;
        min-width: 0;
        border: 1px solid #d1d5db;
        border-radius: 6px;
        background: #ffffff;
        padding: 0 6px;
        color: #111827;
        font-size: 0.78rem;
        font-weight: 600;
        line-height: 1;
        outline: none;
      }

      .param-select:focus,
      .param-input:focus {
        border-color: #2563eb;
        box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.14);
      }

      .param-input[readonly] {
        background: #f8fafc;
        color: #111827;
      }

      /* Selects: evitar que el texto empuje el layout */
      .param-select,
      select.param-input {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .parametros-content {
        display: grid;
        min-width: 0;
        overflow: hidden;
        border: 1px solid var(--prm-line, #e5e7eb);
        border-radius: 8px;
        background: var(--prm-panel, #ffffff);
        position: relative;
      }

      .folder-tabs {
        display: flex;
        min-width: 0;
        overflow-x: auto;
        border-bottom: 1px solid var(--prm-line, #e5e7eb);
        background: var(--prm-soft, #f8fafc);
        padding: 10px 12px 0;
        gap: 6px;
        position: sticky;
        top: 0;
        z-index: 10;
        overscroll-behavior-x: contain;
        scrollbar-width: thin;
      }

      .folder-tab {
        position: relative;
        min-width: 150px;
        min-height: 34px;
        flex: 0 0 auto;
        border: 1px solid transparent;
        border-bottom: 0;
        border-radius: 8px 8px 0 0;
        background: transparent;
        padding: 0 12px;
        color: #475569;
        cursor: pointer;
        font-size: 0.78rem;
        font-weight: 600;
        line-height: 1.15;
        text-align: center;
        transition:
          background 160ms ease,
          border-color 160ms ease,
          color 160ms ease;
      }

      .folder-tab:hover:not(.folder-tab--active) {
        border-color: #cbd5e1;
        background: var(--prm-soft, #f8fafc);
        color: var(--prm-ink, #111827);
      }

      .folder-tab:focus-visible {
        outline: none;
        box-shadow: 0 0 0 3px var(--prm-blue-soft, #eff6ff);
      }

      @media (max-width: 760px) {
        .folder-tabs {
          padding: 10px 10px 0;
        }

        .folder-tab {
          min-width: 132px;
          font-size: 0.76rem;
          padding: 0 10px;
        }
      }

      .folder-tab--active {
        z-index: 2;
        border-color: var(--prm-line, #e5e7eb);
        border-top-color: var(--prm-blue, #2563eb);
        background: var(--prm-panel, #ffffff);
        color: var(--prm-ink, #111827);
      }

      .folder-tab--active::after {
        content: '';
        position: absolute;
        right: 12px;
        bottom: 6px;
        left: 12px;
        height: 2px;
        border-radius: 999px;
        background: var(--prm-blue, #2563eb);
      }

      .tab-panel {
        display: grid;
        min-height: 0;
        gap: 12px;
        background: #ffffff;
        padding: 12px;
      }

      .tab-panel--compact {
        gap: 8px;
        padding: 10px;
      }

      .tab-panel--viewport {
        max-height: calc(100vh - 240px);
        overflow: auto;
      }

      @media (max-width: 760px) {
        .tab-panel {
          padding: 10px;
          gap: 10px;
          min-height: 0;
        }
      }

      .parametros-form {
        align-content: start;
        gap: 14px;
      }

      .parametros-form-projection {
        display: contents;
      }

      .param-group {
        display: grid;
        min-width: 0;
        overflow: hidden;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        background: #ffffff;
      }

      .param-group h2,
      .catalog-section h2 {
        margin: 0;
        border-bottom: 1px solid var(--prm-line, #e5e7eb);
        background: var(--prm-soft, #f8fafc);
        padding: 10px 12px;
        color: var(--prm-ink, #111827);
        font-size: 0.86rem;
        font-weight: 700;
        line-height: 1.2;
      }

      .field-grid {
        display: grid;
        align-items: end;
        row-gap: var(--erp-field-row-gap, 3px);
        column-gap: var(--erp-field-col-gap, 2px);
        padding: 12px;
        justify-content: start;
      }

      /* Grillas RRHH: columnas uniformes (valores/remuneraciones/topes/gratificación) */
      .field-grid--values,
      .field-grid--rentas,
      .field-grid--afc,
      .field-grid--topes,
      .field-grid--gratificacion {
        /* Layout compacto: 2 columnas de ancho término medio */
        grid-template-columns: repeat(
          2,
          minmax(var(--erp-field-min-width, 190px), var(--erp-field-max-width, 260px))
        );
        justify-content: start;
      }

      .field-grid--values {
        /* columnas definidas por regla uniforme */
      }

      .field-grid--gratificacion {
        /* columnas definidas por regla uniforme */
      }

      .field-grid--rentas {
        /* columnas definidas por regla uniforme */
      }

      .field-grid--afc {
        /* columnas definidas por regla uniforme */
      }

      .field-grid--sis {
        grid-template-columns: repeat(
          2,
          minmax(var(--erp-field-min-width, 190px), var(--erp-field-max-width, 260px))
        );
        justify-content: start;
      }

      @media (max-width: 760px) {
        .field-grid,
        .field-grid--values,
        .field-grid--gratificacion,
        .field-grid--rentas,
        .field-grid--afc,
        .field-grid--sis,
        .field-grid--topes,
        .field-grid--ccaf {
          grid-template-columns: 1fr;
          padding: 12px;
          gap: 10px;
        }
      }

      .field-grid--topes {
        /* columnas definidas por regla uniforme */
      }

      .field-grid--ccaf {
        grid-template-columns: repeat(
          2,
          minmax(var(--erp-field-min-width, 190px), var(--erp-field-max-width, 260px))
        );
        justify-content: start;
        align-items: end;
      }

      .param-field,
      .param-check,
      .radio-row label {
        display: grid;
        min-width: 0;
        gap: 3px;
        color: #374151;
        font-size: 0.74rem;
        font-weight: 700;
        line-height: 1.05;
        justify-items: start;
        text-align: left;
      }

      /* Labels compactos */
      .param-field > span:first-child,
      .param-check > span:first-child,
      .radio-row label > span:first-child {
        min-height: 1.65em;
        display: flex;
        align-items: flex-end;
      }

      .param-field--wide {
        width: 100%;
        grid-column: 1 / -1;
      }

      .param-check {
      }

      .param-check span,
      .radio-row label span {
        text-align: left;
      }

      .param-check input,
      .radio-row input {
        width: 16px;
        height: 16px;
        accent-color: #2563eb;
      }

      .unit-field {
        position: relative;
        display: block;
        min-width: 0;
      }

      .unit-field::after {
        content: attr(data-unit);
        position: absolute;
        top: 50%;
        transform: translateY(-50%);
        display: inline-flex;
        align-items: center;
        justify-content: center;
        height: var(--erp-unit-badge-height, 16px);
        min-width: var(--erp-unit-badge-min-width, 18px);
        padding: 0 var(--erp-unit-badge-padding-x, 5px);
        border: 1px solid #e5e7eb;
        border-radius: 999px;
        background: #f8fafc;
        color: #64748b;
        font-size: var(--erp-unit-badge-font-size, 0.66rem);
        font-weight: 750;
        line-height: 1;
        pointer-events: none;
        opacity: 0.95;
      }

      .unit-field--suffix::after {
        right: var(--erp-unit-offset-x, 6px);
      }

      .unit-field--prefix::after {
        /* Mantener compatibilidad: aunque se use "prefix", el badge va a la derecha */
        right: var(--erp-unit-offset-x, 6px);
        left: auto;
      }

      .unit-field--suffix .param-input {
        padding-right: var(--erp-unit-input-padding, 34px);
      }

      .unit-field--prefix .param-input {
        /* Mantener compatibilidad: aunque se use "prefix", el badge va a la derecha */
        padding-right: var(--erp-unit-input-padding, 34px);
        padding-left: 6px;
      }

      .text-right {
        text-align: right;
      }

      .radio-row {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(var(--erp-field-min-width, 190px), var(--erp-field-max-width, 260px)));
        justify-content: start;
        row-gap: var(--erp-field-row-gap, 3px);
        column-gap: var(--erp-field-col-gap, 2px);
        padding: 12px;
      }

      .tab-footnote {
        padding: 0 4px 6px;
        color: #6b7280;
        font-size: 0.74rem;
        font-weight: 600;
      }

      .catalog-section {
        display: grid;
        min-width: 0;
        gap: 10px;
        overflow: hidden;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        background: #ffffff;
      }

      .catalog-grid {
        display: grid;
        gap: 12px;
        padding: 12px;
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }

      .catalog-grid app-data-grid {
        min-width: 0;
      }

      @media (max-width: 980px) {
        .catalog-grid {
          grid-template-columns: 1fr;
        }
      }

      .catalog-section + .catalog-section {
        margin-top: 0;
      }

      .catalog-section--split {
        grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
      }

      .catalog-section--split h2 {
        grid-column: 1 / -1;
      }

      @media (max-width: 1060px) {
        .field-grid--values,
        .field-grid--gratificacion,
        .field-grid--rentas,
        .field-grid--afc,
        .field-grid--topes,
        .field-grid--ccaf,
        .catalog-section--split {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
      }

      @media (max-width: 720px) {
        .parametros-toolbar,
        .period-row {
          align-items: stretch;
          grid-template-columns: 1fr;
        }

        .parametros-toolbar {
          flex-direction: column;
        }

        .parametros-toolbar__main,
        .period-controls {
          width: 100%;
        }

        .period-month,
        .period-year {
          width: 100%;
        }

        .field-grid--values,
        .field-grid--gratificacion,
        .field-grid--rentas,
        .field-grid--afc,
        .field-grid--sis,
        .field-grid--topes,
        .field-grid--ccaf,
        .radio-row,
        .catalog-section--split {
          grid-template-columns: 1fr;
        }

        .folder-tab {
          min-width: 150px;
        }
      }
    `,
  ],
})
export class ParametrosPage implements OnInit {
  private readonly service = inject(ParametrosGeneralesService);
  private readonly fb = inject(FormBuilder);

  readonly breadcrumbItems: readonly RecordBreadcrumbItem[] = [{ label: 'Parametros' }];
  readonly tabs: readonly ParametrosTab[] = [
    { id: 'valores', label: 'Informacion de Valores' },
    { id: 'remuneraciones', label: 'Informacion de Remuneraciones' },
    { id: 'ccafConfig', label: 'Configuracion CCAF y Mutual' },
    { id: 'ccafLista', label: 'Lista CCAF' },
    { id: 'mutualesLey', label: 'Mutuales y Ley 16.744' },
    { id: 'tramosCarga', label: 'Tramos Cargas Familiares' },
    { id: 'tramosRenta', label: 'Tramos Impuesto a la Renta' },
    { id: 'isapre', label: 'ISAPRE' },
    { id: 'afp', label: 'Informacion AFP' },
    { id: 'reforma', label: 'Reforma de Pensiones' },
  ];

  readonly monthOptions: readonly MonthOption[] = [
    { value: '01', label: 'ENERO' },
    { value: '02', label: 'FEBRERO' },
    { value: '03', label: 'MARZO' },
    { value: '04', label: 'ABRIL' },
    { value: '05', label: 'MAYO' },
    { value: '06', label: 'JUNIO' },
    { value: '07', label: 'JULIO' },
    { value: '08', label: 'AGOSTO' },
    { value: '09', label: 'SEPTIEMBRE' },
    { value: '10', label: 'OCTUBRE' },
    { value: '11', label: 'NOVIEMBRE' },
    { value: '12', label: 'DICIEMBRE' },
  ];

  readonly activeTab = signal<ParametrosTabId>('valores');
  readonly rows = signal<ParametroGeneral[]>([]);
  readonly selectedPeriodo = signal(this.currentPeriodo());
  readonly catalogos = signal<ParametrosGeneralesCatalogos>(this.emptyCatalogos());
  readonly selectedCcafId = signal<number | null>(null);
  readonly selectedMutualId = signal<number | null>(null);
  readonly isLoading = signal(true);
  readonly isSaving = signal(false);
  readonly generalesEditando = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);

  readonly pageActions = computed(() => {
    if (this.generalesEditando()) {
      return ['back', 'save'] as const;
    }

    return ['edit'] as const;
  });

  readonly saveLabel = computed(() => (this.isSaving() ? 'Guardando...' : 'Guardar'));

  volverParametrosAction(): void {
    this.volverParametros();
  }

  readonly hasSelectedInRows = computed(() => this.rows().some((row) => row.periodo === this.selectedPeriodo()));
  readonly hasAnySyncedData = computed(() => {
    const catalogos = this.catalogos();

    return (
      this.rows().length > 0 ||
      catalogos.afp.length > 0 ||
      catalogos.isapres.length > 0 ||
      catalogos.saludInstituciones.length > 0 ||
      catalogos.tramosCarga.length > 0 ||
      catalogos.tramosImpuesto.length > 0 ||
      catalogos.tablaImpuestoUnico.length > 0 ||
      catalogos.reformaPensiones.length > 0 ||
      catalogos.trabajosPesados.length > 0 ||
      catalogos.reformaPrevisional.length > 0 ||
      catalogos.ley16744Parametros.length > 0 ||
      catalogos.organismosLey16744.length > 0 ||
      catalogos.ccafEntidades.length > 0 ||
      catalogos.apvInstituciones.length > 0 ||
      catalogos.apvFormasPago.length > 0 ||
      catalogos.afcParametros.length > 0
    );
  });
  readonly yearOptions = computed(() => {
    const currentYear = Number(this.currentPeriodo().slice(0, 4));
    const selectedYear = Number(this.selectedYear());
    const years = new Set<number>([currentYear - 1, currentYear, currentYear + 1, selectedYear]);

    this.rows().forEach((row) => {
      const year = Number(row.periodo.slice(0, 4));
      if (Number.isFinite(year)) {
        years.add(year);
      }
    });

    return [...years].sort((left, right) => right - left);
  });

  readonly form = this.fb.group({
    periodo: [this.currentPeriodo(), [Validators.required, Validators.pattern(/^\d{4}-\d{2}$/)]],
    uf: this.fb.control<number | null>(null, { validators: [Validators.min(0)] }),
    utm: this.fb.control<number | null>(null, { validators: [Validators.min(0)] }),
    uta: this.fb.control<number | null>(null, { validators: [Validators.min(0)] }),
    sueldoMinimo: this.fb.control<number | null>(null, { validators: [Validators.min(0)] }),
    sueldoMinimo18a65: this.fb.control<number | null>(null, { validators: [Validators.min(0)] }),
    sueldoMinimoMenor18Mayor65: this.fb.control<number | null>(null, { validators: [Validators.min(0)] }),
    sueldoMinimoCasaParticular: this.fb.control<number | null>(null, { validators: [Validators.min(0)] }),
    ingresoMinimoNoRemuneracional: this.fb.control<number | null>(null, { validators: [Validators.min(0)] }),
    gratificacion: this.fb.nonNullable.control(true),
    immGratificacion: this.fb.control<number | null>(null, { validators: [Validators.min(0)] }),
    topeAfpUf: this.fb.control<number | null>(null, { validators: [Validators.min(0)] }),
    topeAfp: this.fb.control<number | null>(null, { validators: [Validators.min(0)] }),
    topeIpsUf: this.fb.control<number | null>(null, { validators: [Validators.min(0)] }),
    topeIps: this.fb.control<number | null>(null, { validators: [Validators.min(0)] }),
    topeCesantiaUf: this.fb.control<number | null>(null, { validators: [Validators.min(0)] }),
    topeCesantia: this.fb.control<number | null>(null, { validators: [Validators.min(0)] }),
    topeApvMensualUf: this.fb.control<number | null>(null, { validators: [Validators.min(0)] }),
    topeApvMensual: this.fb.control<number | null>(null, { validators: [Validators.min(0)] }),
    topeApvAnualUf: this.fb.control<number | null>(null, { validators: [Validators.min(0)] }),
    topeApvAnual: this.fb.control<number | null>(null, { validators: [Validators.min(0)] }),
    topeDepositoConvenidoAnualUf: this.fb.control<number | null>(null, { validators: [Validators.min(0)] }),
    topeDepositoConvenidoAnual: this.fb.control<number | null>(null, { validators: [Validators.min(0)] }),
    topeAfpVoluntario: this.fb.control<number | null>(null, { validators: [Validators.min(0)] }),
    sis: this.fb.control<number | null>(null, { validators: [Validators.min(0), Validators.max(100)] }),
    sanna: this.fb.control<number | null>(null, { validators: [Validators.min(0), Validators.max(100)] }),
    seguroSocialExpectativaVida: this.fb.control<number | null>(null, { validators: [Validators.min(0), Validators.max(100)] }),
    aporteEmpleadorAfp: this.fb.control<number | null>(null, { validators: [Validators.min(0), Validators.max(100)] }),
    saludObligatoria: this.fb.control<number | null>(null, { validators: [Validators.min(0), Validators.max(100)] }),
    saludCcaf: this.fb.control<number | null>(null, { validators: [Validators.min(0), Validators.max(100)] }),
    saludFonasaConCcaf: this.fb.control<number | null>(null, { validators: [Validators.min(0), Validators.max(100)] }),
    descuentosBasePorDia: this.fb.nonNullable.control(false),
    afcTrabajadorIndefinido: this.fb.control<number | null>(null, { validators: [Validators.min(0), Validators.max(100)] }),
    afcEmpleadorIndefinido: this.fb.control<number | null>(null, { validators: [Validators.min(0), Validators.max(100)] }),
    afcEmpleadorPlazo: this.fb.control<number | null>(null, { validators: [Validators.min(0), Validators.max(100)] }),
    afcEmpleadorIndefinidoOnceAnosMas: this.fb.control<number | null>(null, { validators: [Validators.min(0), Validators.max(100)] }),
    afcEmpleadorCasaParticular: this.fb.control<number | null>(null, { validators: [Validators.min(0), Validators.max(100)] }),
    trabajoPesadoEmpleador: this.fb.control<number | null>(null, { validators: [Validators.min(0), Validators.max(100)] }),
    trabajoPesadoTrabajador: this.fb.control<number | null>(null, { validators: [Validators.min(0), Validators.max(100)] }),
    trabajoMenosPesadoEmpleador: this.fb.control<number | null>(null, { validators: [Validators.min(0), Validators.max(100)] }),
    trabajoMenosPesadoTrabajador: this.fb.control<number | null>(null, { validators: [Validators.min(0), Validators.max(100)] }),
    fechaActualizacion: this.fb.control<string | null>(null),
  });

  private formatMoneyGrid = (value: unknown): string => this.money(this.numberFromUnknown(value));

  private formatDecimal2Grid = (value: unknown): string => this.decimal(this.numberFromUnknown(value), 2);

  private formatDecimal4Grid = (value: unknown): string => this.decimal(this.numberFromUnknown(value), 4);

  private formatIntegerGrid = (value: unknown): string => {
    const numberValue = this.numberFromUnknown(value);
    return numberValue === null ? '-' : new Intl.NumberFormat('es-CL', { maximumFractionDigits: 0 }).format(numberValue);
  };

  private formatPercentGrid = (value: unknown): string => {
    const numberValue = this.numberFromUnknown(value);
    return numberValue === null
      ? '-'
      : `${new Intl.NumberFormat('es-CL', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 4,
        }).format(numberValue)}%`;
  };

  private formatDateGrid = (value: unknown): string => this.date(typeof value === 'string' ? value : null);

  private formatBooleanGrid = (value: unknown): string => (value ? 'Si' : 'No');

  private formatVigenteGrid = (value: unknown): string => (value ? 'Vigente' : 'Inactivo');

  readonly tramosCargaColumns: DataGridColumn<TramoCargaParametro>[] = [
    { id: 'periodo', header: 'Periodo', field: 'periodo', sortable: true },
    { id: 'tramo', header: 'Tramo', field: 'tramo', sortable: true },
    { id: 'desde', header: 'Desde', field: 'desde', type: 'number', sortable: true, align: 'right', format: this.formatMoneyGrid },
    { id: 'hasta', header: 'Hasta', field: 'hasta', type: 'number', sortable: true, align: 'right', format: this.formatMoneyGrid },
    { id: 'valor', header: 'Valor', field: 'valor', type: 'number', sortable: true, align: 'right', format: this.formatMoneyGrid },
  ];

  readonly tablaImpuestoColumns: DataGridColumn<TablaImpuestoUnicoParametro>[] = [
    { id: 'vigenciaInicio', header: 'Vigencia', field: 'vigenciaInicio', type: 'date', sortable: true, format: this.formatDateGrid },
    { id: 'tramo', header: 'Tramo', field: 'tramo', type: 'number', sortable: true, align: 'right' },
    { id: 'desde', header: 'Desde UTM', field: 'desde', type: 'number', sortable: true, align: 'right', format: this.formatDecimal2Grid },
    { id: 'hasta', header: 'Hasta UTM', field: 'hasta', type: 'number', sortable: true, align: 'right', format: this.formatDecimal2Grid },
    { id: 'factor', header: 'Factor', field: 'factor', type: 'number', sortable: true, align: 'right', format: this.formatPercentGrid },
    { id: 'rebaja', header: 'Rebaja UTM', field: 'rebaja', type: 'number', sortable: true, align: 'right', format: this.formatDecimal4Grid },
  ];

  readonly tramosImpuestoColumns: DataGridColumn<TramoImpuestoParametro>[] = [
    { id: 'periodo', header: 'Periodo', field: 'periodo', sortable: true },
    { id: 'desde', header: 'Desde', field: 'desde', type: 'number', sortable: true, align: 'right', format: this.formatMoneyGrid },
    { id: 'hasta', header: 'Hasta', field: 'hasta', type: 'number', sortable: true, align: 'right', format: this.formatMoneyGrid },
    { id: 'factor', header: 'Factor', field: 'factor', type: 'number', sortable: true, align: 'right', format: this.formatPercentGrid },
    { id: 'rebaja', header: 'Rebaja', field: 'rebaja', type: 'number', sortable: true, align: 'right', format: this.formatMoneyGrid },
  ];

  readonly isapreColumns: DataGridColumn<IsapreParametro>[] = [
    { id: 'codigo', header: 'Codigo', field: 'codigo', sortable: true },
    { id: 'nombre', header: 'Nombre', field: 'nombre', sortable: true },
    { id: 'tipo', header: 'Tipo', field: 'tipo', sortable: true },
    {
      id: 'porcentajeCotizacion',
      header: 'Cotizacion',
      field: 'porcentajeCotizacion',
      type: 'number',
      sortable: true,
      align: 'right',
      format: this.formatPercentGrid,
    },
    { id: 'vigenciaInicio', header: 'Inicio', field: 'vigenciaInicio', type: 'date', sortable: true, format: this.formatDateGrid },
    { id: 'vigenciaFin', header: 'Fin', field: 'vigenciaFin', type: 'date', sortable: true, format: this.formatDateGrid },
    { id: 'vigente', header: 'Estado', field: 'vigente', sortable: true, format: this.formatVigenteGrid },
  ];

  readonly afpColumns: DataGridColumn<AfpParametro>[] = [
    { id: 'codigo', header: 'Codigo', field: 'codigo', sortable: true },
    { id: 'nombre', header: 'Nombre', field: 'nombre', sortable: true },
    {
      id: 'tasaObligatoria',
      header: 'Obligatoria',
      field: 'tasaObligatoria',
      type: 'number',
      sortable: true,
      align: 'right',
      format: this.formatPercentGrid,
    },
    { id: 'comision', header: 'Comision', field: 'comision', type: 'number', sortable: true, align: 'right', format: this.formatPercentGrid },
    { id: 'sis', header: 'SIS', field: 'sis', type: 'number', sortable: true, align: 'right', format: this.formatPercentGrid },
    {
      id: 'tasaEmpleador',
      header: 'Empleador',
      field: 'tasaEmpleador',
      type: 'number',
      sortable: true,
      align: 'right',
      format: this.formatPercentGrid,
    },
    { id: 'vigenciaInicio', header: 'Inicio', field: 'vigenciaInicio', type: 'date', sortable: true, format: this.formatDateGrid },
    { id: 'vigenciaFin', header: 'Fin', field: 'vigenciaFin', type: 'date', sortable: true, format: this.formatDateGrid },
    { id: 'vigente', header: 'Estado', field: 'vigente', sortable: true, format: this.formatVigenteGrid },
  ];

  readonly ccafColumns: DataGridColumn<CcafEntidad>[] = [
    { id: 'codigo', header: 'Codigo', field: 'codigo', sortable: true },
    { id: 'nombre', header: 'Nombre', field: 'nombre', sortable: true },
    { id: 'vigente', header: 'Estado', field: 'vigente', sortable: true, format: this.formatVigenteGrid },
    { id: 'fuente', header: 'Fuente', field: 'fuente', sortable: true },
  ];

  readonly organismosLeyColumns: DataGridColumn<OrganismoLey16744>[] = [
    { id: 'codigo', header: 'Codigo', field: 'codigo', sortable: true },
    { id: 'nombre', header: 'Nombre', field: 'nombre', sortable: true },
    { id: 'tipo', header: 'Tipo', field: 'tipo', sortable: true },
    { id: 'vigente', header: 'Estado', field: 'vigente', sortable: true, format: this.formatVigenteGrid },
  ];

  readonly ley16744Columns: DataGridColumn<Ley16744Parametro>[] = [
    { id: 'codigo', header: 'Codigo', field: 'codigo', sortable: true },
    {
      id: 'cotizacionBasicaEmpleador',
      header: 'Cotizacion basica',
      field: 'cotizacionBasicaEmpleador',
      type: 'number',
      sortable: true,
      align: 'right',
      format: this.formatPercentGrid,
    },
    { id: 'descripcionTasaAdicional', header: 'Adicional diferenciada', field: 'descripcionTasaAdicional', sortable: true },
    { id: 'vigenciaInicio', header: 'Inicio', field: 'vigenciaInicio', type: 'date', sortable: true, format: this.formatDateGrid },
    { id: 'vigenciaFin', header: 'Fin', field: 'vigenciaFin', type: 'date', sortable: true, format: this.formatDateGrid },
    { id: 'vigente', header: 'Estado', field: 'vigente', sortable: true, format: this.formatVigenteGrid },
  ];

  readonly parametrosLegalesColumns: DataGridColumn<ParametroLegal>[] = [
    { id: 'nombre', header: 'Parametro', field: 'nombre', sortable: true, format: (value) => this.labelParametro(String(value ?? '')) },
    {
      id: 'valorDecimal',
      header: 'Valor decimal',
      field: 'valorDecimal',
      type: 'number',
      sortable: true,
      align: 'right',
      format: this.formatDecimal4Grid,
    },
    { id: 'valorEntero', header: 'Valor entero', field: 'valorEntero', type: 'number', sortable: true, align: 'right', format: this.formatIntegerGrid },
    { id: 'vigenciaInicio', header: 'Inicio', field: 'vigenciaInicio', type: 'date', sortable: true, format: this.formatDateGrid },
    { id: 'vigenciaFin', header: 'Fin', field: 'vigenciaFin', type: 'date', sortable: true, format: this.formatDateGrid },
  ];

  readonly reformaPrevisionalColumns: DataGridColumn<ReformaPrevisionalParametro>[] = [
    { id: 'vigenciaInicio', header: 'Inicio', field: 'vigenciaInicio', type: 'date', sortable: true, format: this.formatDateGrid },
    { id: 'vigenciaFin', header: 'Fin', field: 'vigenciaFin', type: 'date', sortable: true, format: this.formatDateGrid },
    {
      id: 'aporteEmpleadorTotal',
      header: 'Aporte empleador',
      field: 'aporteEmpleadorTotal',
      type: 'number',
      sortable: true,
      align: 'right',
      format: this.formatPercentGrid,
    },
    {
      id: 'cuentaCapitalizacionIndividual',
      header: 'Capitalizacion',
      field: 'cuentaCapitalizacionIndividual',
      type: 'number',
      sortable: true,
      align: 'right',
      format: this.formatPercentGrid,
    },
    {
      id: 'fappSeguroSocial',
      header: 'Seguro social',
      field: 'fappSeguroSocial',
      type: 'number',
      sortable: true,
      align: 'right',
      format: this.formatPercentGrid,
    },
    { id: 'fuente', header: 'Fuente', field: 'fuente', sortable: true },
  ];

  readonly trabajosPesadosColumns: DataGridColumn<TrabajoPesadoParametro>[] = [
    { id: 'codigo', header: 'Codigo', field: 'codigo', sortable: true },
    { id: 'nombre', header: 'Nombre', field: 'nombre', sortable: true },
    {
      id: 'tasaTrabajador',
      header: 'Trabajador',
      field: 'tasaTrabajador',
      type: 'number',
      sortable: true,
      align: 'right',
      format: this.formatPercentGrid,
    },
    {
      id: 'tasaEmpleador',
      header: 'Empleador',
      field: 'tasaEmpleador',
      type: 'number',
      sortable: true,
      align: 'right',
      format: this.formatPercentGrid,
    },
    { id: 'tasaTotal', header: 'Total', field: 'tasaTotal', type: 'number', sortable: true, align: 'right', format: this.formatPercentGrid },
    { id: 'requiereDictamenCen', header: 'Dictamen CEN', field: 'requiereDictamenCen', sortable: true, format: this.formatBooleanGrid },
    { id: 'vigente', header: 'Estado', field: 'vigente', sortable: true, format: this.formatVigenteGrid },
  ];

  readonly apvInstitucionesColumns: DataGridColumn<ApvApvcInstitucion>[] = [
    { id: 'codigo', header: 'Codigo', field: 'codigo', sortable: true },
    { id: 'nombre', header: 'Institucion', field: 'nombre', sortable: true },
    { id: 'vigente', header: 'Estado', field: 'vigente', sortable: true, format: this.formatVigenteGrid },
  ];

  readonly apvFormasPagoColumns: DataGridColumn<ApvApvcFormaPago>[] = [
    { id: 'codigo', header: 'Codigo', field: 'codigo', sortable: true },
    { id: 'nombre', header: 'Forma', field: 'nombre', sortable: true },
    { id: 'vigente', header: 'Estado', field: 'vigente', sortable: true, format: this.formatVigenteGrid },
  ];

  async ngOnInit(): Promise<void> {
    // Carga inicial: el periodo lo decide la BD (evita fecha local incorrecta y "saltos" a 2027).
    // Regla:
    // - Si existe el mes actual, usarlo.
    // - Si no existe, usar el último periodo disponible.
    const periodoActual = this.currentPeriodo();
    let periodoInicial = periodoActual;

    try {
      const all = await this.service.listar();
      const periodos = all.map((row) => row.periodo).filter(Boolean).sort((l, r) => r.localeCompare(l));
      const ultimo = periodos[0] ?? null;
      const existeActual = periodos.includes(periodoActual);
      periodoInicial = existeActual ? periodoActual : (ultimo ?? periodoActual);
    } catch {
      // Si falla, mantenemos periodoActual.
    }

    this.selectedPeriodo.set(periodoInicial);
    this.form.controls.periodo.setValue(periodoInicial);
    // Periodo fijo: se selecciona solo desde el selector superior.
    this.form.controls.periodo.disable({ emitEvent: false });
    await this.cargar(periodoInicial);
  }

  asString(value: number | string): string {
    return String(value);
  }

  async cargar(periodo?: string): Promise<void> {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    try {
      const selectedPeriodo = periodo ?? this.selectedPeriodo();
      const [rows, catalogos] = await Promise.all([
        // Siempre se consulta por periodo seleccionado para evitar traer todo el histórico.
        this.service.listar({ periodo: selectedPeriodo }),
        this.service.listarCatalogos(),
      ]);

      const next = [...this.rows().filter((row) => row.periodo !== selectedPeriodo), ...(rows ?? [])].sort(
        (left, right) => right.periodo.localeCompare(left.periodo),
      );
      this.rows.set(next);
      this.catalogos.set(catalogos);
      this.ensureCatalogSelection(catalogos);
      if (rows.length === 0) {
        // Mantener periodo seleccionado incluso si no hay fila para ese periodo.
        // En modo lectura mostramos como base el último periodo disponible, sin crear todavía.
        // La creación formal sigue quedando para "Modificar" + "Guardar".
        const base = await this.service.obtenerUltimoHastaPeriodo(selectedPeriodo).catch(() => null);
        this.patchForm(base ? { ...base, periodo: selectedPeriodo } : { ...this.emptyParametro(), periodo: selectedPeriodo });
        this.generalesEditando.set(false);
        return;
      }

      this.patchForm(rows.find((row) => row.periodo === selectedPeriodo) ?? rows[0]);
      this.generalesEditando.set(false);
    } catch (err) {
      const base = this.describeError(err, 'No fue posible cargar los parametros del sistema.');
      this.errorMessage.set(`${base} (Periodo seleccionado: ${this.selectedPeriodo()})`);
    } finally {
      this.isLoading.set(false);
    }
  }

  private catalogosResumen(catalogos: ParametrosGeneralesCatalogos): string {
    const parts: string[] = [];
    if (catalogos.afp.length) parts.push(`AFP ${catalogos.afp.length}`);
    if (catalogos.isapres.length) parts.push(`ISAPRE ${catalogos.isapres.length}`);
    if (catalogos.saludInstituciones.length) parts.push(`Salud ${catalogos.saludInstituciones.length}`);
    if (catalogos.tramosCarga.length) parts.push(`Tramos carga ${catalogos.tramosCarga.length}`);
    if (catalogos.tramosImpuesto.length) parts.push(`Tramos renta ${catalogos.tramosImpuesto.length}`);
    if (catalogos.tablaImpuestoUnico.length) parts.push(`Tabla impuesto ${catalogos.tablaImpuestoUnico.length}`);
    if (catalogos.reformaPensiones.length) parts.push(`Parámetros legales ${catalogos.reformaPensiones.length}`);
    if (catalogos.trabajosPesados.length) parts.push(`Trabajo pesado ${catalogos.trabajosPesados.length}`);
    if (catalogos.reformaPrevisional.length) parts.push(`Reforma previsional ${catalogos.reformaPrevisional.length}`);
    if (catalogos.ley16744Parametros.length) parts.push(`Ley 16.744 ${catalogos.ley16744Parametros.length}`);
    if (catalogos.organismosLey16744.length) parts.push(`Mutuales ${catalogos.organismosLey16744.length}`);
    if (catalogos.ccafEntidades.length) parts.push(`CCAF ${catalogos.ccafEntidades.length}`);
    if (catalogos.apvInstituciones.length) parts.push(`APV instituciones ${catalogos.apvInstituciones.length}`);
    if (catalogos.apvFormasPago.length) parts.push(`APV formas ${catalogos.apvFormasPago.length}`);
    if (catalogos.afcParametros.length) parts.push(`AFC ${catalogos.afcParametros.length}`);
    return parts.join(', ');
  }

  private describeError(err: unknown, fallback: string): string {
    if (err && typeof err === 'object' && 'message' in err) {
      const message = String((err as { message?: unknown }).message ?? '').trim();
      if (message) {
        return `${fallback} (${message})`;
      }
    }

    return fallback;
  }

  async sincronizar(): Promise<void> {
    const hadData = this.hasAnySyncedData();
    await this.cargar();

    if (this.hasAnySyncedData()) {
      this.successMessage.set(hadData ? 'Datos refrescados desde la base de datos.' : 'Datos sincronizados desde la base de datos.');
      return;
    }

    this.errorMessage.set('No hay parametros disponibles en la base de datos para sincronizar.');
  }

  seleccionarTab(tabId: ParametrosTabId): void {
    this.activeTab.set(tabId);
  }

  async seleccionarAnioValue(year: string): Promise<void> {
    await this.seleccionarPeriodo(`${year}-${this.selectedMonth()}`);
  }

  async seleccionarMesValue(month: string): Promise<void> {
    await this.seleccionarPeriodo(`${this.selectedYear()}-${month}`);
  }

  async moverPeriodo(offset: number): Promise<void> {
    const [year, month] = this.selectedPeriodo().split('-').map((value) => Number(value));
    const date = new Date(year, month - 1 + offset, 1);
    const periodo = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    await this.seleccionarPeriodo(periodo);
  }

  nuevoPeriodo(): void {
    const periodo = this.selectedPeriodo() || this.currentPeriodo();
    this.patchForm({ ...this.emptyParametro(), periodo });
    this.generalesEditando.set(true);
    this.successMessage.set(null);
    this.errorMessage.set(null);
  }

  async editarParametros(): Promise<void> {
    // “Modificar” es el flujo principal: si no hay data para el periodo, intenta traerla
    // y si sigue sin existir, deja el formulario listo para crear ese periodo.
    this.successMessage.set(null);
    this.errorMessage.set(null);

    // Intentar cargar por si el registro existe (consulta por periodo seleccionado).
    if (!this.hasSelectedInRows()) {
      await this.cargar(this.selectedPeriodo());
    }

    // Si sigue sin existir, creamos el periodo copiando el último <= seleccionado (o defaults).
    if (!this.hasSelectedInRows()) {
      await this.prepararNuevoPeriodoDesdeBase(this.selectedPeriodo());
      this.generalesEditando.set(true);
      return;
    }

    this.generalesEditando.set(true);
  }

  volverParametros(): void {
    const row = this.rows().find((item) => item.periodo === this.selectedPeriodo());
    this.patchForm(row ?? { ...this.emptyParametro(), periodo: this.selectedPeriodo() });
    this.generalesEditando.set(false);
    this.successMessage.set(null);
    this.errorMessage.set(null);
  }

  async guardar(): Promise<void> {
    this.form.markAllAsTouched();

    if (this.form.invalid || this.isSaving()) {
      return;
    }

    this.isSaving.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    const payload: ParametroGeneral = {
      ...this.form.getRawValue(),
      // Periodo fijo: el guardado siempre usa el periodo seleccionado.
      periodo: this.selectedPeriodo(),
      gratificacion: this.form.controls.gratificacion.value,
      descuentosBasePorDia: this.form.controls.descuentosBasePorDia.value,
      sueldoMinimo: this.form.controls.sueldoMinimo18a65.value,
      topeAfpVoluntario: this.form.controls.topeApvMensual.value,
      fechaActualizacion: new Date().toISOString(),
    };

    try {
      const saved = await this.service.guardar(payload);
      const nextRows = [saved, ...this.rows().filter((row) => row.periodo !== saved.periodo)].sort((left, right) =>
        right.periodo.localeCompare(left.periodo),
      );
      this.rows.set(nextRows);
      this.selectedPeriodo.set(saved.periodo);
      this.patchForm(saved);
      this.generalesEditando.set(false);
      this.successMessage.set(`El periodo ${saved.periodo} quedo actualizado.`);
    } catch {
      this.errorMessage.set('No fue posible guardar los parametros generales.');
    } finally {
      this.isSaving.set(false);
    }
  }

  bloquearSiLectura(event: Event): void {
    if (!this.generalesEditando()) {
      event.preventDefault();
    }
  }

  setDescuentosBase(value: boolean): void {
    if (!this.generalesEditando()) {
      return;
    }

    this.form.controls.descuentosBasePorDia.setValue(value);
  }

  seleccionarCcaf(event: Event): void {
    this.selectedCcafId.set(this.numberFromSelect(event));
  }

  seleccionarMutual(event: Event): void {
    this.selectedMutualId.set(this.numberFromSelect(event));
  }

  selectedYear(): string {
    return this.selectedPeriodo().slice(0, 4);
  }

  selectedMonth(): string {
    return this.selectedPeriodo().slice(5, 7);
  }

  isConfigurableTab(): boolean {
    const tab = this.activeTab();
    return tab === 'valores' || tab === 'remuneraciones' || tab === 'ccafConfig';
  }

  selectedLey16744Rate(): number | null {
    return this.catalogos().ley16744Parametros[0]?.cotizacionBasicaEmpleador ?? null;
  }

  fechaActualizacionLabel(): string {
    const value = this.form.controls.fechaActualizacion.value;
    return value ? this.formatDateTime(value) : 'Sin registro';
  }

  money(value: number | null): string {
    return value === null ? '-' : `$${new Intl.NumberFormat('es-CL', { maximumFractionDigits: 0 }).format(value)}`;
  }

  decimal(value: number | null, digits = 2): string {
    return value === null
      ? '-'
      : new Intl.NumberFormat('es-CL', {
          minimumFractionDigits: digits,
          maximumFractionDigits: digits,
        }).format(value);
  }

  date(value: string | null): string {
    if (!value) {
      return '-';
    }

    const date = new Date(`${value}T00:00:00`);

    if (!Number.isFinite(date.getTime())) {
      return value;
    }

    return new Intl.DateTimeFormat('es-CL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date);
  }

  labelParametro(value: string): string {
    return value
      .toLowerCase()
      .split('_')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }

  private async seleccionarPeriodo(periodo: string): Promise<void> {
    this.selectedPeriodo.set(periodo);
    this.generalesEditando.set(false);
    this.successMessage.set(null);
    this.errorMessage.set(null);

    // Siempre consulta el sistema (Supabase) al cambiar periodo
    await this.cargar(periodo);
  }

  private async prepararNuevoPeriodoDesdeBase(periodo: string): Promise<void> {
    try {
      const base = await this.service.obtenerUltimoHastaPeriodo(periodo);
      if (base) {
        this.patchForm({ ...base, periodo });
        return;
      }
    } catch {
      // Si falla la carga de base, usamos defaults.
    }

    this.patchForm({ ...this.emptyParametro(), periodo });
  }

  private patchForm(row: ParametroGeneral): void {
    this.form.reset({
      periodo: row.periodo,
      uf: row.uf,
      utm: row.utm,
      uta: row.uta,
      sueldoMinimo: row.sueldoMinimo,
      sueldoMinimo18a65: row.sueldoMinimo18a65,
      sueldoMinimoMenor18Mayor65: row.sueldoMinimoMenor18Mayor65,
      sueldoMinimoCasaParticular: row.sueldoMinimoCasaParticular,
      ingresoMinimoNoRemuneracional: row.ingresoMinimoNoRemuneracional,
      gratificacion: row.gratificacion,
      immGratificacion: row.immGratificacion,
      topeAfpUf: row.topeAfpUf,
      topeAfp: row.topeAfp,
      topeIpsUf: row.topeIpsUf,
      topeIps: row.topeIps,
      topeCesantiaUf: row.topeCesantiaUf,
      topeCesantia: row.topeCesantia,
      topeApvMensualUf: row.topeApvMensualUf,
      topeApvMensual: row.topeApvMensual,
      topeApvAnualUf: row.topeApvAnualUf,
      topeApvAnual: row.topeApvAnual,
      topeDepositoConvenidoAnualUf: row.topeDepositoConvenidoAnualUf,
      topeDepositoConvenidoAnual: row.topeDepositoConvenidoAnual,
      topeAfpVoluntario: row.topeAfpVoluntario,
      sis: row.sis,
      sanna: row.sanna,
      seguroSocialExpectativaVida: row.seguroSocialExpectativaVida,
      aporteEmpleadorAfp: row.aporteEmpleadorAfp,
      saludObligatoria: row.saludObligatoria,
      saludCcaf: row.saludCcaf,
      saludFonasaConCcaf: row.saludFonasaConCcaf,
      descuentosBasePorDia: row.descuentosBasePorDia,
      afcTrabajadorIndefinido: row.afcTrabajadorIndefinido,
      afcEmpleadorIndefinido: row.afcEmpleadorIndefinido,
      afcEmpleadorPlazo: row.afcEmpleadorPlazo,
      afcEmpleadorIndefinidoOnceAnosMas: row.afcEmpleadorIndefinidoOnceAnosMas,
      afcEmpleadorCasaParticular: row.afcEmpleadorCasaParticular,
      trabajoPesadoEmpleador: row.trabajoPesadoEmpleador,
      trabajoPesadoTrabajador: row.trabajoPesadoTrabajador,
      trabajoMenosPesadoEmpleador: row.trabajoMenosPesadoEmpleador,
      trabajoMenosPesadoTrabajador: row.trabajoMenosPesadoTrabajador,
      fechaActualizacion: row.fechaActualizacion,
    });
  }

  private ensureCatalogSelection(catalogos: ParametrosGeneralesCatalogos): void {
    const ccafExists = catalogos.ccafEntidades.some((row) => row.idCcafEntidad === this.selectedCcafId());
    const mutualExists = catalogos.organismosLey16744.some((row) => row.idOrganismoAdministradorLey16744 === this.selectedMutualId());

    if (!ccafExists) {
      this.selectedCcafId.set(catalogos.ccafEntidades[0]?.idCcafEntidad ?? null);
    }

    if (!mutualExists) {
      this.selectedMutualId.set(catalogos.organismosLey16744[0]?.idOrganismoAdministradorLey16744 ?? null);
    }
  }

  private emptyParametro(): ParametroGeneral {
    return {
      periodo: this.currentPeriodo(),
      uf: null,
      utm: null,
      uta: null,
      sueldoMinimo: null,
      sueldoMinimo18a65: null,
      sueldoMinimoMenor18Mayor65: null,
      sueldoMinimoCasaParticular: null,
      ingresoMinimoNoRemuneracional: null,
      gratificacion: true,
      immGratificacion: 4.75,
      topeAfpUf: null,
      topeAfp: null,
      topeIpsUf: null,
      topeIps: null,
      topeCesantiaUf: null,
      topeCesantia: null,
      topeApvMensualUf: null,
      topeApvMensual: null,
      topeApvAnualUf: null,
      topeApvAnual: null,
      topeDepositoConvenidoAnualUf: null,
      topeDepositoConvenidoAnual: null,
      topeAfpVoluntario: null,
      sis: null,
      sanna: null,
      seguroSocialExpectativaVida: null,
      aporteEmpleadorAfp: null,
      saludObligatoria: null,
      saludCcaf: null,
      saludFonasaConCcaf: null,
      descuentosBasePorDia: false,
      afcTrabajadorIndefinido: null,
      afcEmpleadorIndefinido: null,
      afcEmpleadorPlazo: null,
      afcEmpleadorIndefinidoOnceAnosMas: null,
      afcEmpleadorCasaParticular: null,
      trabajoPesadoEmpleador: null,
      trabajoPesadoTrabajador: null,
      trabajoMenosPesadoEmpleador: null,
      trabajoMenosPesadoTrabajador: null,
      fechaActualizacion: null,
    };
  }

  private emptyCatalogos(): ParametrosGeneralesCatalogos {
    return {
      afp: [],
      isapres: [],
      saludInstituciones: [],
      tramosCarga: [],
      tramosImpuesto: [],
      tablaImpuestoUnico: [],
      reformaPensiones: [],
      trabajosPesados: [],
      reformaPrevisional: [],
      ley16744Parametros: [],
      organismosLey16744: [],
      ccafEntidades: [],
      apvInstituciones: [],
      apvFormasPago: [],
      afcParametros: [],
    };
  }

  private currentPeriodo(): string {
    // Usa fecha local estable (evita desfase por TZ/UTC alrededor de medianoche).
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    return `${year}-${String(month).padStart(2, '0')}`;
  }

  private numberFromSelect(event: Event): number | null {
    const value = Number((event.target as HTMLSelectElement).value);
    return Number.isFinite(value) && value > 0 ? value : null;
  }

  private formatDateTime(value: string): string {
    const date = new Date(value);

    if (!Number.isFinite(date.getTime())) {
      return value;
    }

    return new Intl.DateTimeFormat('es-CL', {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(date);
  }

  private numberFromUnknown(value: unknown): number | null {
    if (value === null || value === undefined || value === '') {
      return null;
    }

    const numberValue = Number(value);
    return Number.isFinite(numberValue) ? numberValue : null;
  }

}
