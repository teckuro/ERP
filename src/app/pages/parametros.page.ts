import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  effect,
  isDevMode,
  OnInit,
  ViewEncapsulation,
  computed,
  inject,
  signal,
} from '@angular/core';
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
  PARAMETROS_CATALOGO_ARRAY_KEYS,
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
import { SearchSelectValue } from '../shared/components/ui/search-select.component';
import { DataGridColumn } from '../shared/components/ui/data-grid.component';
import { CardComponent, CardContentComponent } from '../shared/components/ui/card.component';
import {
  MessageBoxComponent,
  MessageBoxVariant,
} from '../shared/components/ui/message-box.component';
import { PageActionsComponent } from '../shared/components/ui/page-actions.component';
import {
  RecordBreadcrumbComponent,
  RecordBreadcrumbItem,
} from '../shared/components/ui/record-breadcrumb.component';
import { ParametrosRemuneracionesTabComponent } from '../features/parametros-generales/components/tabs/parametros-remuneraciones-tab.component';
import { ParametrosValoresTabComponent } from '../features/parametros-generales/components/tabs/parametros-valores-tab.component';
import { ParametrosAfpTabComponent } from '../features/parametros-generales/components/tabs/parametros-afp-tab.component';
import {
  CcafMutualSubId,
  ParametrosCcafMutualesTabComponent,
} from '../features/parametros-generales/components/tabs/parametros-ccaf-mutuales-tab.component';
import { ParametrosSaludTabComponent } from '../features/parametros-generales/components/tabs/parametros-salud-tab.component';
import { ParametrosReformaTabComponent } from '../features/parametros-generales/components/tabs/parametros-reforma-tab.component';
import { ParametrosTramosCargaTabComponent } from '../features/parametros-generales/components/tabs/parametros-tramos-carga-tab.component';
import { ParametrosTramosRentaTabComponent } from '../features/parametros-generales/components/tabs/parametros-tramos-renta-tab.component';
import { PeriodoActivoService } from '../core/services/periodo-activo.service';

interface ParametrosTab {
  id: ParametrosTabId;
  label: string;
}

interface MonthOption {
  value: string;
  label: string;
}

type ParametrosDialogKind = 'alerta' | 'confirmar-guardado' | 'confirmar-crear-parametros';
type PeriodoCargaEstado = 'pendiente' | 'parcial' | 'completo' | 'editando' | 'error';

interface ParametrosDialogState {
  kind: ParametrosDialogKind;
  variant: MessageBoxVariant;
  title: string;
  message: string;
  detail?: string;
  primaryLabel?: string;
  secondaryLabel?: string;
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
    ParametrosSaludTabComponent,
    ParametrosAfpTabComponent,
    ParametrosReformaTabComponent,
  ],
  template: `
    <section class="parametros-page" aria-label="Mantenedor de parámetros">
      <header class="parametros-header">
        <app-record-breadcrumb [items]="breadcrumbItems" title="Parámetros del sistema"></app-record-breadcrumb>
      </header>

      <app-card className="parametros-shell">
        <app-card-content className="parametros-frame">
          <div class="parametros-viewhead">
        <div class="parametros-toolbar" aria-label="Acciones de parámetros">
          @if (!hasAnySyncedData()) {
            <app-button
              variant="outline"
              size="md"
              className="erp-toolbar-button erp-action-button"
              [disabled]="parametrosUiBloqueada()"
              (click)="sincronizar()"
            >
              <lucide-icon icon class="h-4 w-4" name="refresh-cw"></lucide-icon>
              Sincronizar
            </app-button>
          }

          <div class="parametros-toolbar__end">
            @if (generalesEditando()) {
              <app-page-actions
                [visibleActions]="['back', 'save']"
                backLabel="Volver"
                [saveLabel]="saveLabel()"
                backLink="/"
                [saveDisabled]="isSaving() || isLoading() || isLoadingPlantilla() || form.invalid"
                (saveClick)="guardar()"
                (backClick)="volverParametrosAction()"
              ></app-page-actions>
            } @else {
              @if (isConfigurableTab() && !hasSelectedInRows()) {
                <app-button
                  variant="outline"
                  size="md"
                  className="erp-toolbar-button erp-action-button"
                  [disabled]="crearParametrosDeshabilitado()"
                  (click)="crearParametrosParaPeriodo()"
                >
                  <lucide-icon icon class="h-4 w-4" name="plus"></lucide-icon>
                  Crear parámetros
                </app-button>
              }
              <app-page-actions
                [visibleActions]="['edit']"
                editLabel="Modificar"
                [editTooltip]="modificarTooltipConsulta()"
                [editDisabled]="modificarDeshabilitado()"
                (editClick)="editarParametros()"
              ></app-page-actions>
            }
          </div>
        </div>

        <div class="period-row" aria-label="Periodo">
          <div class="period-row__left">
            <div class="period-row__left-top">
              <span class="period-label">Parámetros del período {{ periodoGlobal.etiqueta() }}</span>
              <div class="period-controls">
                <button
                  type="button"
                  class="period-arrow"
                  aria-label="Periodo anterior"
                  [disabled]="parametrosUiBloqueada()"
                  (click)="moverPeriodo(-1)"
                >
                  <lucide-icon class="h-4 w-4" name="arrow-left"></lucide-icon>
                </button>

                <select
                  class="param-select period-year"
                  id="parametros-periodo-anio"
                  [ngModel]="selectedYear()"
                  (ngModelChange)="seleccionarAnioValue($event)"
                >
                  @for (year of yearOptions(); track year) {
                    <option [value]="asString(year)">{{ year }}</option>
                  }
                </select>

                <select
                  class="param-select period-month"
                  id="parametros-periodo-mes"
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
                  [disabled]="parametrosUiBloqueada()"
                  (click)="moverPeriodo(1)"
                >
                  <lucide-icon class="h-4 w-4" name="chevron-right"></lucide-icon>
                </button>
              </div>
            </div>
            <p class="period-sync-hint">Sincronizado con el período activo.</p>
          </div>

          <div class="period-row__right" role="region" aria-label="Estado mensual">
            <div class="period-mensual__head">
              <span class="period-mensual__title">{{ periodoEstadoTitulo() }}</span>
              <span class="period-mensual__chip" role="status" aria-label="Resumen de estado">
                <span class="period-chip" [ngClass]="periodoEstadoChipClass()">{{ periodoEstadoChip() }}</span>
              </span>
            </div>
            <p class="period-mensual__detail">{{ periodoEstadoDetalle() }}</p>
          </div>
        </div>
          </div>

      <div class="parametros-content">
        @if (isLoading()) {
          <app-message-box
            variant="loading"
            mode="modal"
            title="Cargando parámetros"
            message="Obteniendo parámetros mensuales y cargas externas."
          ></app-message-box>
        } @else if (isLoadingPlantilla()) {
          <app-message-box
            variant="loading"
            mode="modal"
            title="Obteniendo plantilla"
            message="Consultando el último período registrado para usarlo solo como base en el formulario. No se guarda nada automáticamente."
          ></app-message-box>
        }

        @if (dialogState(); as dlg) {
          <app-message-box
            [variant]="dlg.variant"
            mode="modal"
            [modalHeadlineSplit]="true"
            [title]="dlg.title"
            [message]="dlg.message"
            [detail]="dlg.detail ?? ''"
            [primaryLabel]="dlg.primaryLabel ?? 'Aceptar'"
            [secondaryLabel]="dlg.secondaryLabel ?? ''"
            (action)="onDialogoAccionPrimaria()"
            (secondary)="onDialogoAccionSecundaria()"
          ></app-message-box>
        }

        <nav class="folder-tabs" aria-label="Secciones de parámetros">
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

        <div class="parametros-tab-body" role="region" aria-label="Contenido de la sección">
        @switch (activeTab()) {
          @case ('valores') {
            <app-parametros-valores-tab
              [form]="form"
              [editable]="generalesEditando()"
              [hasPeriodoData]="hasSelectedInRows()"
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
              [hasPeriodoData]="hasSelectedInRows()"
              [fechaActualizacionLabel]="fechaActualizacionLabel()"
              [onSubmit]="guardar.bind(this)"
            >
            </app-parametros-remuneraciones-tab>
          }

          @case ('ccafMutual') {
            <app-parametros-ccaf-mutuales-tab
              [activeSub]="ccafMutualSubTab()"
              (activeSubChange)="ccafMutualSubTab.set($event)"
              [catalogos]="catalogos()"
              [ccafColumns]="ccafColumns"
              [organismosLeyColumns]="organismosLeyColumns"
              [ley16744Columns]="ley16744Columns"
              [loading]="isLoading()"
              [selectedCcafId]="selectedCcafId()"
              [selectedMutualId]="selectedMutualId()"
              [percentLabel]="decimal(selectedLey16744Rate(), 2)"
              [gridPersistenceKeyCcaf]="gridPersistenceKey('parametros.ccaf.dg')"
              [gridPersistenceKeyMutuales]="gridPersistenceKey('parametros.mutuales.dg')"
              [gridPersistenceKeyLey16744]="gridPersistenceKey('parametros.ley16744.dg')"
              [seleccionarCcaf]="seleccionarCcaf.bind(this)"
              [seleccionarMutual]="seleccionarMutual.bind(this)"
              [refresh]="cargar.bind(this)"
            ></app-parametros-ccaf-mutuales-tab>
          }

          @case ('tramosCarga') {
            <app-parametros-tramos-carga-tab
              [rows]="tramosCargaPorPeriodo()"
              [columns]="tramosCargaColumns"
              [loading]="isLoading()"
              [gridPersistenceKey]="gridPersistenceKey('parametros.tramos-carga.dg')"
              [refresh]="cargar.bind(this)"
            ></app-parametros-tramos-carga-tab>
          }

          @case ('impuestoUnico') {
            <app-parametros-tramos-renta-tab
              [tablaRows]="tablaImpuestoPorPeriodo()"
              [tablaColumns]="tablaImpuestoColumns"
              [tramosRows]="tramosImpuestoPorPeriodo()"
              [tramosColumns]="tramosImpuestoColumns"
              [loading]="isLoading()"
              [gridPersistenceKeyTabla]="gridPersistenceKey('parametros.tabla-impuesto.dg')"
              [gridPersistenceKeyTramos]="gridPersistenceKey('parametros.tramos-impuesto.dg')"
              [refresh]="cargar.bind(this)"
            ></app-parametros-tramos-renta-tab>
          }

          @case ('salud') {
            <app-parametros-salud-tab
              [isapreRows]="isapresPorPeriodo()"
              [institucionesRows]="saludOtrasInstitucionesPorPeriodo()"
              [columns]="isapreColumns"
              [loading]="isLoading()"
              [gridPersistenceKeyIsapre]="gridPersistenceKey('parametros.isapre.dg')"
              [gridPersistenceKeyInstituciones]="gridPersistenceKey('parametros.salud-instituciones.dg')"
              [refresh]="cargar.bind(this)"
            ></app-parametros-salud-tab>
          }

          @case ('prevision') {
            <app-parametros-afp-tab
              [rows]="afpPorPeriodo()"
              [columns]="afpColumns"
              [loading]="isLoading()"
              [gridPersistenceKey]="gridPersistenceKey('parametros.afp.dg')"
              [refresh]="cargar.bind(this)"
            ></app-parametros-afp-tab>
          }

          @case ('reforma') {
            <app-parametros-reforma-tab
              [reformaPensiones]="reformaPensionesPorPeriodo()"
              [reformaPrevisional]="reformaPrevisionalPorPeriodo()"
              [trabajosPesados]="trabajosPesadosPorPeriodo()"
              [apvInstituciones]="catalogos().apvInstituciones"
              [apvFormasPago]="catalogos().apvFormasPago"
              [parametrosLegalesColumns]="parametrosLegalesColumns"
              [reformaPrevisionalColumns]="reformaPrevisionalColumns"
              [trabajosPesadosColumns]="trabajosPesadosColumns"
              [apvInstitucionesColumns]="apvInstitucionesColumns"
              [apvFormasPagoColumns]="apvFormasPagoColumns"
              [loading]="isLoading()"
              [gridPersistenceKeyLegal]="gridPersistenceKey('parametros.reforma-legal.dg')"
              [gridPersistenceKeyPrevisional]="gridPersistenceKey('parametros.reforma-previsional.dg')"
              [gridPersistenceKeyTrabPesados]="gridPersistenceKey('parametros.trabajos-pesados.dg')"
              [gridPersistenceKeyApvInst]="gridPersistenceKey('parametros.apv-instituciones.dg')"
              [gridPersistenceKeyApvPago]="gridPersistenceKey('parametros.apv-formas-pago.dg')"
              [refresh]="cargar.bind(this)"
            ></app-parametros-reforma-tab>
          }
        }
        </div>
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
        --prm-chip-muted: #64748b;
        --prm-chip-line: #e5e7eb;
        --prm-chip-soft: #f1f5f9;
        --prm-unit-chip-fs: 0.625rem;
        --prm-unit-chip-gap: 6px;
        --prm-unit-chip-min-height: 17px;
        --prm-unit-chip-pad-x: 7px;
        --prm-unit-chip-ring-gap: 5px;
        --prm-field-stack-gap: 5px;
        --prm-field-row-gap: 12px;
        --prm-grid-gap-inline: 14px;
        --prm-inline-soft-ring: rgba(37, 99, 235, 0.17);
        --prm-soft-muted-zone: #f8fafc;
        --prm-input-border: #d1d5db;
        --prm-unit-gap: var(--prm-unit-chip-gap);
        --param-content-max-width: 1060px;
        display: flex;
        flex-direction: column;
        gap: 12px;
        width: 100%;
        min-width: 0;
        min-height: 0;
        box-sizing: border-box;
        height: calc(100dvh - var(--app-layout-main-chrome-y, 7rem));
        max-height: calc(100dvh - var(--app-layout-main-chrome-y, 7rem));
      }

      .parametros-page .period-chip {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-height: 18px;
        padding: 0 8px;
        border: 1px solid var(--prm-chip-line);
        border-radius: 999px;
        background: var(--prm-chip-soft);
        color: var(--prm-chip-muted);
        font-size: 0.7rem;
        font-weight: 600;
        letter-spacing: 0.02em;
        white-space: nowrap;
      }

      .parametros-page .period-chip--success {
        border-color: rgba(22, 163, 74, 0.25);
        background: #ecfdf5;
        color: #166534;
      }

      .parametros-page .period-chip--warning {
        border-color: rgba(245, 158, 11, 0.25);
        background: #fffbeb;
        color: #92400e;
      }

      .parametros-page .period-chip--error {
        border-color: rgba(220, 38, 38, 0.25);
        background: #fef2f2;
        color: #991b1b;
      }

      .parametros-page .period-chip--info {
        border-color: rgba(37, 99, 235, 0.25);
        background: var(--prm-blue-soft);
        color: #1d4ed8;
      }

      .parametros-page .period-chip--muted {
        background: #f8fafc;
        color: #64748b;
      }

      .parametros-page > header.parametros-header {
        flex: 0 0 auto;
      }

      .parametros-page app-card.parametros-shell {
        flex: 1 1 auto;
        display: flex;
        flex-direction: column;
        min-height: 0;
        width: 100%;
      }

      .parametros-page app-card.parametros-shell app-card-content.parametros-frame {
        flex: 1 1 auto;
        display: flex;
        flex-direction: column;
        min-height: 0;
        overflow: hidden;
      }

      .parametros-page .parametros-tab-body {
        flex: 1 1 auto;
        min-height: 0;
        min-width: 0;
        overflow: hidden;
        display: flex;
        flex-direction: column;
      }

      /* El scroll va en .tab-panel para no desplazar toda la tarjeta (tabs + barra de periodo). */
      .parametros-page .parametros-tab-body > * {
        flex: 1 1 auto;
        min-height: 0;
        min-width: 0;
        display: flex;
        flex-direction: column;
        box-sizing: border-box;
        overflow: hidden;
      }

      .parametros-viewhead {
        display: grid;
        gap: 6px;
        padding: 0 0 8px;
        border-radius: 8px;
        background: linear-gradient(to bottom, #f9fafb 0%, #f9fafb 88%, #f3f4f6 100%);
      }

      .parametros-toolbar {
        display: flex;
        align-items: center;
        justify-content: flex-start;
        gap: 10px 12px;
        flex-wrap: wrap;
      }

      .parametros-toolbar__end {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        flex-wrap: wrap;
        gap: 8px 12px;
        margin-left: auto;
        min-width: 0;
        max-width: 100%;
      }

      .parametros-toolbar__end app-page-actions {
        flex: 0 0 auto;
      }

      .param-toolbar-consult-inline {
        margin: 0;
        padding: 0;
        max-width: min(22rem, 100%);
        color: #94a3b8;
        font-size: 0.68rem;
        font-weight: 500;
        line-height: 1.3;
        text-align: right;
        letter-spacing: 0.01em;
      }

      @media (max-width: 520px) {
        .parametros-toolbar__end {
          flex-direction: column;
          align-items: flex-end;
        }

        .parametros-toolbar__end app-page-actions {
          order: 1;
        }

        .param-toolbar-consult-inline {
          order: 2;
          line-height: 1.3;
          max-width: 100%;
        }
      }

      .parametros-toolbar app-button {
        white-space: nowrap;
      }

      .param-subhead {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: space-between;
        gap: 8px 12px;
        margin-bottom: 8px;
      }

      .param-subhead__tabs {
        flex: 1 1 auto;
        min-width: 0;
      }

      .parametros-toolbar__main {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }

      .param-select,
      .param-input {
        height: var(--erp-control-height, 22px);
        min-height: var(--erp-control-height, 22px);
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

      /* Sin flechas nativas: no compiten con el chip de unidad ni “pegándose” al borde */
      .parametros-page input.param-input[type='number'] {
        appearance: textfield;
        -moz-appearance: textfield;
      }

      .parametros-page input.param-input[type='number']::-webkit-outer-spin-button,
      .parametros-page input.param-input[type='number']::-webkit-inner-spin-button {
        -webkit-appearance: none;
        margin: 0;
      }

      .parametros-page app-card.parametros-shell app-card-content.parametros-frame > .parametros-viewhead {
        flex: 0 0 auto;
      }

      .parametros-content {
        display: flex;
        flex-direction: column;
        flex: 1 1 auto;
        min-height: 0;
        min-width: 0;
        overflow: hidden;
        border: 1px solid var(--prm-line, #e5e7eb);
        border-radius: 8px;
        background: var(--prm-panel, #ffffff);
        position: relative;
      }

      .parametros-content::before,
      .parametros-content::after {
        content: '';
        position: absolute;
        top: 1px;
        z-index: 12;
        width: 16px;
        height: 44px;
        pointer-events: none;
      }

      .parametros-content::before {
        left: 1px;
        background: linear-gradient(to right, var(--prm-soft, #f8fafc), rgba(248, 250, 252, 0));
      }

      .parametros-content::after {
        right: 1px;
        background: linear-gradient(to left, var(--prm-soft, #f8fafc), rgba(248, 250, 252, 0));
      }

      .parametros-content > .folder-tabs {
        flex: 0 0 auto;
      }

      .folder-tabs {
        display: flex;
        min-width: 0;
        overflow-x: auto;
        border-bottom: 1px solid var(--prm-line, #e5e7eb);
        background: var(--prm-soft, #f8fafc);
        padding: 10px 24px 0;
        gap: 6px;
        z-index: 10;
        overscroll-behavior-x: contain;
        scrollbar-width: thin;
        scroll-padding-inline: 24px;
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
          padding: 10px 16px 0;
          scroll-padding-inline: 16px;
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

      .parametros-page .tab-panel {
        display: flex;
        flex-direction: column;
        flex: 1 1 auto;
        min-height: 0;
        min-width: 0;
        gap: 12px;
        background: #ffffff;
        padding: 12px 12px 16px;
        box-sizing: border-box;
        width: 100%;
        overflow-x: hidden;
        overflow-y: auto;
      }

      .tab-panel--compact {
        gap: 8px;
        padding: 10px;
      }

      .parametros-page .param-tab-subview {
        flex: 1 1 auto;
        min-height: 0;
        min-width: 0;
        display: flex;
        flex-direction: column;
      }

      .parametros-page .param-tab-subview > .catalog-section {
        flex: 1 1 auto;
        min-height: 0;
      }

      .parametros-page .param-tab-subview > .param-group {
        flex: 0 0 auto;
      }

      @media (max-width: 760px) {
        .parametros-page .tab-panel {
          padding: 10px;
          gap: 10px;
          min-height: 0;
        }
      }

      .parametros-page .tab-panel.parametros-form {
        gap: 14px;
      }

      .parametros-page .tab-panel.parametros-form > footer.tab-footnote {
        margin-top: auto;
        flex-shrink: 0;
      }

      .parametros-page .tab-panel > .param-group {
        flex: 0 0 auto;
      }

      .param-group {
        display: grid;
        width: 100%;
        max-width: none;
        min-width: 0;
        overflow: hidden;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        background: #ffffff;
        box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
        justify-items: stretch;
      }

      /* Títulos y bordes del card a todo el ancho; solo la rejilla de campos respeta el tope */
      .parametros-page .param-group .field-grid {
        box-sizing: border-box;
        width: 100%;
        max-width: min(var(--param-content-max-width), 100%);
        min-width: 0;
        justify-self: start;
      }

      .parametros-page .param-group .radio-row {
        box-sizing: border-box;
        width: 100%;
        max-width: min(var(--param-content-max-width), 100%);
        min-width: 0;
        justify-self: start;
      }

      .param-group h2,
      .catalog-section h2 {
        margin: 0;
        border-bottom: 1px solid var(--prm-line, #e5e7eb);
        background: var(--prm-soft, #f8fafc);
        padding: 10px 14px;
        color: var(--prm-ink, #111827);
        font-size: 0.86rem;
        font-weight: 700;
        line-height: 1.2;
      }

      .param-section-lead {
        margin: 0;
        padding: 8px 14px 0;
        border-bottom: 1px solid #f1f5f9;
        color: #64748b;
        font-size: 0.72rem;
        font-weight: 600;
        line-height: 1.35;
      }

      .param-subsection-title {
        grid-column: span 8;
        box-sizing: border-box;
        width: 100%;
        min-width: 0;
        justify-self: stretch;
        margin: 0;
        padding: 10px 0 4px;
        border-top: 1px solid #f1f5f9;
        color: #64748b;
        font-size: 0.72rem;
        font-weight: 750;
        letter-spacing: 0.03em;
        line-height: 1.2;
        text-transform: uppercase;
      }

      .field-grid .param-subsection-title--first {
        padding-top: 2px;
        border-top: 0;
      }

      .field-grid-slot--subsection > .param-subsection-title {
        grid-column: auto;
      }

      .param-flag-row {
        display: flex;
        flex-wrap: wrap;
        flex-direction: row;
        align-items: flex-end;
        align-content: flex-start;
        gap: 12px 24px;
        grid-column: span 8;
        box-sizing: border-box;
        width: 100%;
        max-width: 100%;
        min-width: 0;
        justify-self: stretch;
        padding: 6px 0 12px;
      }

      .param-flag-row .param-check {
        flex: 0 1 auto;
        min-width: min(100%, var(--erp-field-min-width, 190px));
        max-width: 100%;
      }

      .field-grid {
        display: grid;
        align-items: end;
        justify-items: stretch;
        row-gap: var(--prm-field-row-gap);
        column-gap: var(--prm-grid-gap-inline);
        padding: 14px 14px 16px;
        justify-content: start;
        grid-auto-flow: row;
      }

      /*
       * Rejilla maestra: 8 columnas; cada input/select = span 2 (de a dos). No hace falta llenar la fila: pueden quedar columnas libres.
       * Subtítulos (.param-subsection-title) = span 8. Radios/checks compactos en Valores = span 1.
       */
      .field-grid--values,
      .field-grid--gratificacion,
      .field-grid--rentas,
      .field-grid--afc,
      .field-grid--topes,
      .field-grid--sis,
      .field-grid--ccaf {
        grid-template-columns: repeat(8, minmax(0, 1fr));
        justify-content: start;
        align-items: end;
      }

      .field-grid > .field-grid-slot {
        grid-column: span 8;
        min-width: 0;
        justify-self: stretch;
        width: 100%;
        box-sizing: border-box;
      }

      /* Agrupa título + filas de campos con el mismo ritmo que el resto del formulario */
      .field-grid > .field-grid-slot--subsection {
        display: flex;
        flex-direction: column;
        align-items: stretch;
        gap: var(--prm-field-stack-gap);
        min-width: 0;
      }

      /* Slots anidados: hasta 3 columnas (máx.); repetir reglas sin '>' para slots dentro de subsección */
      .field-grid .field-grid-slot--3 {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: var(--prm-grid-gap-inline);
        align-items: end;
        min-width: 0;
      }

      .field-grid > .field-grid-slot--3 {
        grid-column: span 8;
      }

      .field-grid .field-grid-slot--2 {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: var(--prm-grid-gap-inline);
        align-items: end;
        min-width: 0;
      }

      .field-grid > .field-grid-slot--2 {
        grid-column: span 8;
      }

      .param-checkbox-inline {
        display: inline-flex;
        flex-direction: row;
        align-items: center;
        gap: 8px;
        min-height: var(--erp-control-height, 22px);
        margin: 0;
        font-size: 0.74rem;
        font-weight: 700;
        color: #374151;
        cursor: pointer;
        user-select: none;
      }

      .param-checkbox-inline input {
        width: 16px;
        height: 16px;
        flex-shrink: 0;
        accent-color: #2563eb;
      }

      .field-grid--gratificacion > .param-checkbox-inline span {
        line-height: 1.2;
      }

      .field-grid--values > .param-field,
      .field-grid--values > .param-check,
      .field-grid--gratificacion > .param-field,
      .field-grid--rentas > .param-field,
      .field-grid--afc > .param-field,
      .field-grid--sis > .param-field,
      .field-grid--topes > .param-field,
      .field-grid--ccaf > .param-field {
        grid-column: span 2;
        min-width: 0;
        justify-self: start;
        width: 100%;
        max-width: 100%;
      }

      /* Radios / checks: controles compactos → span 1 cada uno (excepción respecto a inputs span 2) */
      .parametros-page .field-grid--values > .erp-choice-radio {
        grid-column: span 1;
        min-width: 0;
        justify-self: start;
        width: auto;
        max-width: 100%;
        box-sizing: border-box;
        align-self: end;
      }

      .field-grid--gratificacion > .param-checkbox-inline {
        grid-column: span 1;
        min-width: 0;
        justify-self: start;
        width: auto;
        max-width: 100%;
        align-self: end;
      }

      @media (max-width: 980px) {
        .field-grid--values,
        .field-grid--gratificacion,
        .field-grid--rentas,
        .field-grid--afc,
        .field-grid--sis,
        .field-grid--topes,
        .field-grid--ccaf {
          grid-template-columns: repeat(4, minmax(0, 1fr));
        }

        .field-grid > .field-grid-slot {
          grid-column: span 4;
        }

        .field-grid .param-subsection-title,
        .field-grid .param-flag-row {
          grid-column: span 4;
        }
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

        .field-grid > .field-grid-slot {
          grid-column: span 1;
        }

        .field-grid .field-grid-slot--3,
        .field-grid > .field-grid-slot--3 {
          grid-template-columns: 1fr;
          gap: 10px;
        }

        .field-grid .field-grid-slot--2,
        .field-grid > .field-grid-slot--2 {
          grid-template-columns: 1fr;
          gap: 10px;
        }

        .parametros-page .field-grid--values > .erp-choice-radio,
        .field-grid--values > .param-field,
        .field-grid--values > .param-check,
        .field-grid--gratificacion > .param-field,
        .field-grid--gratificacion > .param-checkbox-inline,
        .field-grid--rentas > .param-field,
        .field-grid--afc > .param-field,
        .field-grid--sis > .param-field,
        .field-grid--topes > .param-field,
        .field-grid--ccaf > .param-field {
          grid-column: span 1;
        }

        .field-grid .param-subsection-title,
        .field-grid .param-flag-row {
          grid-column: span 1;
        }

        .catalog-section--split h2 {
          grid-column: span 1;
        }
      }

      .param-field,
      .param-check,
      .radio-row label {
        display: grid;
        grid-template-columns: minmax(0, 1fr);
        min-width: 0;
        gap: 6px;
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
        justify-self: start;
        max-width: 100%;
      }

      /* .param-field--wide opcional (misma huella span 2 que el resto; texto largo sólo rompe dentro de la celda) */

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

      .param-field .unit-field,
      .field-grid .param-field > .unit-field {
        width: 100%;
        max-width: 100%;
        min-width: 0;
      }

      /*
       * Campo con unidad ($ % UF IMM): un solo borde exterior, input sin borde interno,
       * chip como flex item (alineación estable; evita solapamiento con padding-right fijo).
       */
      .parametros-page .unit-field.unit-field--suffix {
        display: flex;
        flex-direction: row;
        align-items: center;
        gap: var(--prm-unit-gap);
        box-sizing: border-box;
        width: 100%;
        min-width: 0;
        min-height: var(--erp-control-height, 22px);
        height: var(--erp-control-height, 22px);
        padding: 0 6px 0 8px;
        border: 1px solid var(--prm-input-border);
        border-radius: 6px;
        background: var(--prm-panel);
        transition:
          border-color 140ms ease,
          box-shadow 140ms ease;
      }

      .parametros-page .unit-field.unit-field--suffix:focus-within {
        border-color: var(--prm-blue);
        box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.14);
      }

      .parametros-page .unit-field.unit-field--suffix:has(.param-input:is([readonly], :disabled)) {
        background: var(--prm-soft);
      }

      .parametros-page .unit-field.unit-field--suffix .param-input {
        flex: 1 1 0%;
        min-width: 0;
        height: auto;
        align-self: stretch;
        border: none !important;
        background: transparent !important;
        box-shadow: none !important;
        padding: 0 4px 0 0 !important;
      }

      .parametros-page .unit-field.unit-field--suffix .param-input:focus {
        outline: none !important;
      }

      .parametros-page .unit-field.unit-field--suffix .param-input[readonly] {
        background: transparent !important;
      }

      .parametros-page .unit-field.unit-field--suffix::after {
        content: attr(data-unit);
        position: static;
        flex-shrink: 0;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        height: var(--erp-unit-badge-height, 16px);
        min-width: var(--erp-unit-badge-min-width, 18px);
        padding: 0 var(--erp-unit-badge-padding-x, 5px);
        border: 1px solid var(--prm-line);
        border-radius: 999px;
        background: var(--prm-soft);
        color: #64748b;
        font-size: var(--erp-unit-badge-font-size, var(--prm-unit-chip-fs, 0.625rem));
        font-weight: 750;
        line-height: 1;
        pointer-events: none;
      }

      /* Prefijo legacy (no hay plantillas actuales): badge absoluto dentro del input */
      .parametros-page .unit-field.unit-field--prefix:not(.unit-field--suffix) {
        position: relative;
        display: block;
      }

      .parametros-page .unit-field.unit-field--prefix:not(.unit-field--suffix)::after {
        content: attr(data-unit);
        position: absolute;
        top: 50%;
        right: var(--erp-unit-offset-x, 6px);
        transform: translateY(-50%);
        display: inline-flex;
        align-items: center;
        justify-content: center;
        height: var(--erp-unit-badge-height, 16px);
        min-width: var(--erp-unit-badge-min-width, 18px);
        padding: 0 var(--erp-unit-badge-padding-x, 5px);
        border: 1px solid var(--prm-line);
        border-radius: 999px;
        background: var(--prm-soft);
        color: #64748b;
        font-size: var(--erp-unit-badge-font-size, 0.66rem);
        font-weight: 750;
        line-height: 1;
        pointer-events: none;
      }

      .parametros-page .unit-field.unit-field--prefix:not(.unit-field--suffix) .param-input {
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
        justify-items: start;
        align-items: end;
        row-gap: var(--erp-field-row-gap, 3px);
        column-gap: var(--erp-field-col-gap, 2px);
        padding: 12px;
        width: 100%;
        max-width: 100%;
        box-sizing: border-box;
      }

      .radio-row--spaced {
        row-gap: 8px;
        column-gap: 16px;
        padding: 12px 12px 14px;
      }

      .tab-footnote {
        padding: 0 4px 6px;
        color: #6b7280;
        font-size: 0.74rem;
        font-weight: 600;
      }

      .tab-footnote--muted {
        margin-top: 4px;
        padding: 10px 12px 8px;
        border-top: 1px solid #f1f5f9;
        color: #94a3b8;
        font-weight: 600;
      }

      .catalog-section {
        display: flex;
        flex-direction: column;
        flex: 1 1 0;
        min-height: 0;
        min-width: 0;
        width: 100%;
        gap: 10px;
        overflow: hidden;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        background: #ffffff;
        box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
      }

      .catalog-section > h2 {
        flex: 0 0 auto;
      }

      .catalog-section > app-data-grid {
        box-sizing: border-box;
        flex: 1 1 auto;
        min-height: 0;
        width: 100%;
        min-width: 0;
        padding: 0 12px 12px;
      }

      .catalog-section > .catalog-grid {
        flex: 1 1 auto;
        min-height: 0;
      }

      .catalog-grid {
        display: grid;
        width: 100%;
        min-width: 0;
        min-height: 0;
        gap: 12px;
        padding: 12px;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        grid-auto-rows: minmax(0, 1fr);
        justify-items: stretch;
        align-items: stretch;
      }

      .catalog-grid app-data-grid {
        min-width: 0;
        min-height: 0;
        height: 100%;
      }

      @media (max-width: 980px) {
        .catalog-grid {
          grid-template-columns: 1fr;
        }
      }

      .catalog-section + .catalog-section {
        margin-top: 0;
      }

      .catalog-section.catalog-section--split {
        display: grid;
        grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
        grid-template-rows: auto minmax(0, 1fr);
        flex: 1 1 0;
        min-height: 0;
      }

      .catalog-section.catalog-section--split > h2 {
        grid-column: 1 / -1;
      }

      .catalog-section.catalog-section--split > app-data-grid {
        min-height: 0;
        height: 100%;
        align-self: stretch;
      }

      @media (max-width: 1060px) {
        .catalog-section.catalog-section--split {
          grid-template-columns: 1fr;
          grid-template-rows: auto minmax(0, 1fr) minmax(0, 1fr);
        }

        .catalog-section.catalog-section--split > h2 {
          grid-column: 1;
        }

        .catalog-section.catalog-section--split > app-data-grid {
          grid-column: 1;
        }
      }

      @media (max-width: 720px) {
        .parametros-toolbar {
          align-items: stretch;
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
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly hostElement = inject<ElementRef<HTMLElement>>(ElementRef);
  readonly periodoGlobal = inject(PeriodoActivoService);

  readonly breadcrumbItems: readonly RecordBreadcrumbItem[] = [{ label: 'Parámetros' }];
  readonly tabs: readonly ParametrosTab[] = [
    { id: 'valores', label: 'Información de Valores' },
    { id: 'remuneraciones', label: 'Información de Remuneraciones' },
    { id: 'ccafMutual', label: 'CCAF y Mutual' },
    { id: 'tramosCarga', label: 'Tramos Cargas Familiares' },
    { id: 'impuestoUnico', label: 'Impuesto único' },
    { id: 'salud', label: 'Salud' },
    { id: 'prevision', label: 'Previsión' },
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
  readonly ccafMutualSubTab = signal<CcafMutualSubId>('config');
  readonly rows = signal<ParametroGeneral[]>([]);
  readonly selectedPeriodo = signal(this.periodoGlobal.periodoYm());
  readonly catalogos = signal<ParametrosGeneralesCatalogos>(this.emptyCatalogos());
  readonly periodosGeneralesCatalogo = signal<string[]>([]);
  readonly selectedCcafId = signal<number | null>(null);
  readonly selectedMutualId = signal<number | null>(null);
  readonly isLoading = signal(true);
  /** Consulta al backend solo para plantilla del último período (crear parámetros); no es guardado. */
  readonly isLoadingPlantilla = signal(false);
  readonly isSaving = signal(false);
  readonly generalesEditando = signal(false);
  /** Formulario hidratado para el periodo actual y sin error de carga pendiente. */
  readonly datosFormularioListos = signal(false);
  /** Evita doble clic mientras se prepara el modo edición (carga + copia de periodo). */
  readonly isPreparingEdit = signal(false);
  /** Refresco silencioso antes de abrir el modal «Crear parámetros» (sin overlay global). */
  readonly isPreparandoDialogoCrear = signal(false);
  /** Bloquea "Modificar" tras error de carga hasta una carga exitosa. */
  readonly cargaBloqueadaPorError = signal(false);
  readonly dialogState = signal<ParametrosDialogState | null>(null);

  private cargarDepth = 0;

  /** Bloqueo de acciones de barra / período por carga principal, plantilla o guardado. */
  readonly parametrosUiBloqueada = computed(
    () =>
      this.isLoading() ||
      this.isLoadingPlantilla() ||
      this.isSaving() ||
      this.isPreparandoDialogoCrear(),
  );

  readonly modificarDeshabilitado = computed(
    () =>
      this.isLoading() ||
      this.isLoadingPlantilla() ||
      this.isSaving() ||
      this.isPreparingEdit() ||
      !this.isConfigurableTab() ||
      !this.datosFormularioListos() ||
      this.cargaBloqueadaPorError() ||
      !this.hasSelectedInRows(),
  );

  readonly crearParametrosDeshabilitado = computed(
    () =>
      this.isLoading() ||
      this.isLoadingPlantilla() ||
      this.isSaving() ||
      this.isPreparingEdit() ||
      this.isPreparandoDialogoCrear() ||
      !this.isConfigurableTab() ||
      this.hasSelectedInRows() ||
      this.generalesEditando() ||
      this.cargaBloqueadaPorError(),
  );

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

  /** Aísla filtros/paginación del DataGrid por periodo al cambiar el selector. */
  gridPersistenceKey(baseKey: string): string {
    return `${baseKey}.${this.selectedPeriodo()}`;
  }

  readonly hasSelectedInRows = computed(() => this.rows().some((row) => row.periodo === this.selectedPeriodo()));
  readonly periodoCargaEstado = computed<PeriodoCargaEstado>(() => {
    if (this.cargaBloqueadaPorError()) {
      return 'error';
    }
    if (this.generalesEditando()) {
      return 'editando';
    }

    const seccionesMensuales = [
      this.hasSelectedInRows(),
      this.catalogos().tramosCarga.length > 0,
      this.catalogos().tramosImpuesto.length > 0,
      this.catalogos().ley16744Parametros.length > 0,
    ];
    const cargadas = seccionesMensuales.filter(Boolean).length;

    if (cargadas === 0) {
      return 'pendiente';
    }
    if (cargadas < seccionesMensuales.length) {
      return 'parcial';
    }
    return 'completo';
  });
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

  readonly periodoEstadoTitulo = computed(() => {
    switch (this.periodoCargaEstado()) {
      case 'error':
        return 'Estado mensual: Error';
      case 'editando':
        return 'Estado mensual: En edición';
      case 'completo':
        return 'Estado mensual: Completo';
      case 'parcial':
        return 'Estado mensual: Parcial';
      case 'pendiente':
      default:
        return 'Estado mensual: Pendiente';
    }
  });

  readonly periodoEstadoDetalle = computed(() => {
    switch (this.periodoCargaEstado()) {
      case 'error':
        return 'No se completó la carga mensual. Revisa el detalle de carga.';
      case 'editando':
        return 'Guarda para persistir el snapshot mensual.';
      case 'completo':
        return 'Datos mensuales cargados. Vigencias y catálogos disponibles.';
      case 'parcial':
        return 'Hay datos mensuales pendientes. Revisa antes de usar el período para cálculo.';
      case 'pendiente':
      default:
        return 'Faltan datos mensuales. Vigencias y catálogos siguen disponibles.';
    }
  });

  readonly periodoEstadoChip = computed(() => {
    switch (this.periodoCargaEstado()) {
      case 'error':
        return 'Error';
      case 'editando':
        return 'Edición';
      case 'completo':
        return 'Completo';
      case 'parcial':
        return 'Parcial';
      case 'pendiente':
      default:
        return 'Pendiente';
    }
  });

  readonly periodoEstadoChipClass = computed(() => {
    switch (this.periodoCargaEstado()) {
      case 'error':
        return 'period-chip--error';
      case 'editando':
        return 'period-chip--info';
      case 'completo':
        return 'period-chip--success';
      case 'parcial':
        return 'period-chip--info';
      case 'pendiente':
      default:
        return 'period-chip--warning';
    }
  });

  readonly yearOptions = computed(() => {
    const selectedYear = Number(this.selectedYear());
    const yearsFromBd = new Set<number>();
    for (const p of this.periodosGeneralesCatalogo()) {
      const year = Number(String(p).slice(0, 4));
      if (Number.isFinite(year)) {
        yearsFromBd.add(year);
      }
    }

    // Si la BD aún no carga, al menos no dejamos el selector vacío.
    if (yearsFromBd.size === 0) {
      const currentYear = Number(this.currentPeriodo().slice(0, 4));
      return [currentYear - 1, currentYear, currentYear + 1, selectedYear].filter((y) => Number.isFinite(y));
    }

    yearsFromBd.add(selectedYear);
    return [...yearsFromBd].sort((left, right) => right - left);
  });

  /** Catálogos aplican su política propia: periodo mensual, vigencia o catálogo global. */
  readonly tramosCargaPorPeriodo = computed(() => this.catalogos().tramosCarga);

  readonly tramosImpuestoPorPeriodo = computed(() => this.catalogos().tramosImpuesto);

  readonly tablaImpuestoPorPeriodo = computed(() => this.catalogos().tablaImpuestoUnico);

  readonly afpPorPeriodo = computed(() => this.catalogos().afp);

  readonly isapresPorPeriodo = computed(() => this.catalogos().isapres);

  readonly saludOtrasInstitucionesPorPeriodo = computed(() => this.catalogos().saludInstituciones);

  readonly reformaPensionesPorPeriodo = computed(() => this.catalogos().reformaPensiones);

  readonly reformaPrevisionalPorPeriodo = computed(() => this.catalogos().reformaPrevisional);

  readonly trabajosPesadosPorPeriodo = computed(() => this.catalogos().trabajosPesados);

  readonly form = this.fb.group({
    periodo: [this.periodoGlobal.periodoYm(), [Validators.required, Validators.pattern(/^\d{4}-\d{2}$/)]],
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

  constructor() {
    effect(() => {
      const g = this.periodoGlobal.periodoYm();
      if (g === this.selectedPeriodo()) {
        return;
      }
      void this.seleccionarPeriodo(g, { fromGlobal: true });
    });
  }

  private formatMoneyGrid = (value: unknown): string => this.money(this.numberFromUnknown(value));

  private formatDecimal2Grid = (value: unknown): string => this.decimal(this.numberFromUnknown(value), 2);

  private formatDecimal4Grid = (value: unknown): string => this.decimal(this.numberFromUnknown(value), 4);

  private formatIntegerGrid = (value: unknown): string => {
    const numberValue = this.numberFromUnknown(value);
    return numberValue === null ? '—' : new Intl.NumberFormat('es-CL', { maximumFractionDigits: 0 }).format(numberValue);
  };

  private formatPercentGrid = (value: unknown): string => {
    const numberValue = this.numberFromUnknown(value);
    return numberValue === null
      ? '—'
      : `${new Intl.NumberFormat('es-CL', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 4,
        }).format(numberValue)} %`;
  };

  private formatDateGrid = (value: unknown): string => this.date(typeof value === 'string' ? value : null);

  private formatBooleanGrid = (value: unknown): string => (value ? 'Sí' : 'No');

  private formatVigenteGrid = (value: unknown): string => (value ? 'Vigente' : 'Inactivo');

  private estadoVigenciaPeriodo(row: { vigenciaInicio: string | null; vigenciaFin: string | null }): string {
    const fechaPeriodo = `${this.selectedPeriodo()}-01`;
    const inicio = row.vigenciaInicio ?? '';
    const fin = row.vigenciaFin ?? null;

    if (inicio && inicio > fechaPeriodo) {
      return 'Futuro';
    }

    if (fin && fin < fechaPeriodo) {
      return 'Historico';
    }

    return 'Vigente al periodo';
  }

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
      id: 'cuentaCapitalizacionIndividual',
      header: 'Cuenta individual',
      field: 'cuentaCapitalizacionIndividual',
      type: 'number',
      sortable: true,
      align: 'right',
      format: this.formatPercentGrid,
    },
    {
      id: 'cotizacionRentabilidadProtegida',
      header: 'CRP',
      field: 'cotizacionRentabilidadProtegida',
      type: 'number',
      sortable: true,
      align: 'right',
      format: this.formatPercentGrid,
    },
    {
      id: 'seguroSocialSisCev',
      header: 'Seguro Social / SIS / CEV',
      field: 'seguroSocialSisCev',
      type: 'number',
      sortable: true,
      align: 'right',
      format: this.formatPercentGrid,
    },
    {
      id: 'aporteEmpleadorTotal',
      header: 'Total empleador',
      field: 'aporteEmpleadorTotal',
      type: 'number',
      sortable: true,
      align: 'right',
      format: this.formatPercentGrid,
    },
    {
      id: 'estadoPeriodo',
      header: 'Estado',
      sortable: false,
      format: (_value, row) => this.estadoVigenciaPeriodo(row),
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
    // Carga inicial: período = contexto global (cabecera). Sin sustituir por último de BD para mantener una sola fuente de verdad.
    const periodoInicial = this.periodoGlobal.periodoYm();

    try {
      const periodos = await this.service.listarPeriodos();
      this.periodosGeneralesCatalogo.set(periodos);
    } catch {
      // Si falla, seguimos con período global.
    }

    this.selectedPeriodo.set(periodoInicial);
    this.form.controls.periodo.setValue(periodoInicial);
    // Periodo fijo en formulario: edición solo vía selector de período / cabecera.
    this.form.controls.periodo.disable({ emitEvent: false });
    await Promise.all([this.cargar(periodoInicial), this.refrescarPeriodosDesdeBd()]);
  }

  asString(value: number | string): string {
    return String(value);
  }

  async cargar(periodo?: string, options?: { showLoadingOverlay?: boolean }): Promise<void> {
    const showOverlay = options?.showLoadingOverlay !== false;
    if (showOverlay) {
      this.enterCargar();
    }
    this.cargaBloqueadaPorError.set(false);
    this.datosFormularioListos.set(false);

    try {
      const selectedPeriodo = periodo ?? this.selectedPeriodo();
      const [rowsRaw, catalogos] = await Promise.all([
        // Siempre se consulta por periodo seleccionado para evitar traer todo el histórico.
        this.service.listar({ periodo: selectedPeriodo }),
        this.service.listarCatalogos(selectedPeriodo),
      ]);
      const rows = rowsRaw ?? [];

      const next = [...this.rows().filter((row) => row.periodo !== selectedPeriodo), ...rows].sort(
        (left, right) => right.periodo.localeCompare(left.periodo),
      );
      this.rows.set(next);
      this.catalogos.set(catalogos);
      this.assertCatalogosArrayShape(catalogos);
      this.ensureCatalogSelection(catalogos);
      if (!rows.length) {
        // Sin fila en parametros_generales: formulario vacío para este periodo (no reutilizar otro periodo).
        this.patchForm(this.emptyParametroForPeriodo(selectedPeriodo), selectedPeriodo);
        this.generalesEditando.set(false);
        return;
      }

      this.patchForm(rows.find((row) => row.periodo === selectedPeriodo) ?? rows[0], selectedPeriodo);
      this.generalesEditando.set(false);
    } catch (err) {
      this.cargaBloqueadaPorError.set(true);
      const detalle = this.extractErrorDetail(err);
      this.mostrarErrorCargaParametros(detalle);
    } finally {
      if (showOverlay) {
        this.leaveCargar();
      }
      this.cdr.markForCheck();
    }
  }

  /** Comprueba que every key del manifest siga siendo array (fallos tempranos ante cambios de RPC). */
  private assertCatalogosArrayShape(catalogos: ParametrosGeneralesCatalogos): void {
    if (!isDevMode()) {
      return;
    }

    for (const key of PARAMETROS_CATALOGO_ARRAY_KEYS) {
      const value = catalogos[key];

      if (!Array.isArray(value)) {
        console.error(`[Parametros] Catalogo corrupto: "${key}" no es un arreglo`, value);
      }
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

  private extractErrorDetail(err: unknown): string {
    if (err && typeof err === 'object' && 'message' in err) {
      return String((err as { message?: unknown }).message ?? '').trim();
    }
    return '';
  }

  private isDuplicatePeriodError(err: unknown): boolean {
    const msg = this.extractErrorDetail(err);
    return /duplicate|unique|23505|ya existe|violates unique/i.test(msg);
  }

  cerrarDialogo(): void {
    this.dialogState.set(null);
  }

  onDialogoAccionPrimaria(): void {
    const dlg = this.dialogState();
    if (!dlg) {
      return;
    }
    if (dlg.kind === 'confirmar-guardado') {
      this.dialogState.set(null);
      void this.ejecutarGuardarInterno();
      return;
    }
    if (dlg.kind === 'confirmar-crear-parametros') {
      this.dialogState.set(null);
      void this.finalizarCrearParametrosConBase(true);
      return;
    }
    this.dialogState.set(null);
  }

  onDialogoAccionSecundaria(): void {
    const dlg = this.dialogState();
    if (dlg?.kind === 'confirmar-crear-parametros') {
      this.dialogState.set(null);
      void this.finalizarCrearParametrosConBase(false);
      return;
    }
    this.cerrarDialogo();
  }

  private mostrarFormularioInvalido(): void {
    this.dialogState.set({
      kind: 'alerta',
      variant: 'warning',
      title: 'Faltan datos por completar',
      message: 'Revisa los campos marcados antes de guardar los parámetros.',
      detail: 'Hay campos obligatorios o con formato inválido.',
      primaryLabel: 'Aceptar',
    });
  }

  private mostrarPeriodoDuplicado(periodo: string): void {
    this.dialogState.set({
      kind: 'alerta',
      variant: 'warning',
      title: 'Periodo ya registrado',
      message: `Ya existen parámetros registrados para el periodo ${periodo}.`,
      detail: 'Puedes modificar el registro existente en lugar de crear uno nuevo.',
      primaryLabel: 'Aceptar',
    });
  }

  private mostrarExitoGuardado(periodo: string): void {
    this.dialogState.set({
      kind: 'alerta',
      variant: 'success',
      title: 'Parámetros guardados',
      message: 'Los parámetros del periodo fueron guardados correctamente.',
      detail: `Periodo: ${periodo}`,
      primaryLabel: 'Aceptar',
    });
  }

  private mostrarExitoActualizacion(periodo: string): void {
    this.dialogState.set({
      kind: 'alerta',
      variant: 'success',
      title: 'Parámetros actualizados',
      message: 'Los parámetros del periodo fueron actualizados correctamente.',
      detail: `Periodo: ${periodo}`,
      primaryLabel: 'Aceptar',
    });
  }

  private mostrarErrorGuardado(mensajeError: string): void {
    this.dialogState.set({
      kind: 'alerta',
      variant: 'error',
      title: 'No se pudieron guardar los parámetros',
      message: 'Ocurrió un problema al intentar guardar los parámetros del periodo.',
      detail: mensajeError || 'Error desconocido.',
      primaryLabel: 'Aceptar',
    });
  }

  private mostrarErrorActualizacion(mensajeError: string): void {
    this.dialogState.set({
      kind: 'alerta',
      variant: 'error',
      title: 'No se pudieron actualizar los parámetros',
      message: 'Ocurrió un problema al intentar actualizar los parámetros del periodo.',
      detail: mensajeError || 'Error desconocido.',
      primaryLabel: 'Aceptar',
    });
  }

  private mostrarErrorCargaParametros(detalleTecnico: string): void {
    this.dialogState.set({
      kind: 'alerta',
      variant: 'error',
      title: 'No fue posible completar la operación',
      message: 'No fue posible cargar los parámetros del sistema.',
      detail: detalleTecnico
        ? `${detalleTecnico}\n\nPeriodo seleccionado: ${this.selectedPeriodo()}`
        : `Periodo seleccionado: ${this.selectedPeriodo()}`,
      primaryLabel: 'Aceptar',
    });
  }

  private mostrarExitoSincronizacion(refresco: boolean): void {
    this.dialogState.set({
      kind: 'alerta',
      variant: 'success',
      title: refresco ? 'Datos refrescados' : 'Datos sincronizados',
      message: refresco
        ? 'Los parámetros se actualizaron desde la base de datos.'
        : 'Los parámetros se sincronizaron correctamente desde la base de datos.',
      primaryLabel: 'Aceptar',
    });
  }

  private mostrarErrorSincronizacionSinDatos(): void {
    this.dialogState.set({
      kind: 'alerta',
      variant: 'warning',
      title: 'Sin datos para sincronizar',
      message: 'No hay parámetros disponibles en la base de datos para sincronizar.',
      primaryLabel: 'Aceptar',
    });
  }

  private mostrarConfirmacionModificacion(): void {
    this.dialogState.set({
      kind: 'confirmar-guardado',
      variant: 'warning',
      title: 'Confirmar modificación',
      message: `Se actualizarán los parámetros del periodo ${this.selectedPeriodo()}.`,
      detail: 'Esta modificación puede afectar cálculos de remuneraciones asociados a este periodo.',
      primaryLabel: 'Confirmar modificación',
      secondaryLabel: 'Cancelar',
    });
  }

  private mostrarConfirmacionCrearParametros(): void {
    const periodo = this.selectedPeriodo();
    this.dialogState.set({
      kind: 'confirmar-crear-parametros',
      variant: 'info',
      title: 'Crear parámetros del período',
      message: 'No existen parámetros generales para el período seleccionado.',
      detail: `Puedes iniciar el formulario vacío o cargar el último período registrado como base para completar los datos.\n\nPeríodo: ${periodo}`,
      primaryLabel: 'Cargar último como base',
      secondaryLabel: 'Crear vacío',
    });
    this.cdr.markForCheck();
  }

  async sincronizar(): Promise<void> {
    const hadData = this.hasAnySyncedData();
    await this.cargar();

    if (this.hasAnySyncedData()) {
      this.mostrarExitoSincronizacion(hadData);
      return;
    }

    this.mostrarErrorSincronizacionSinDatos();
  }

  seleccionarTab(tabId: ParametrosTabId): void {
    this.activeTab.set(tabId);
    window.requestAnimationFrame(() => {
      const root = this.hostElement.nativeElement;
      const active = root.querySelector<HTMLElement>('nav.folder-tabs button.folder-tab--active');
      active?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
    });
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
    this.patchForm(this.emptyParametroForPeriodo(periodo), periodo);
    this.generalesEditando.set(true);
    this.datosFormularioListos.set(true);
    this.cerrarDialogo();
  }

  async editarParametros(): Promise<void> {
    // “Modificar” solo aplica si existe parametros_generales para el periodo seleccionado.
    this.cerrarDialogo();

    if (!this.hasSelectedInRows()) {
      return;
    }

    if (this.isPreparingEdit()) {
      return;
    }

    if (!this.datosFormularioListos()) {
      this.isPreparingEdit.set(true);
      try {
        await this.cargar(this.selectedPeriodo());
      } finally {
        this.isPreparingEdit.set(false);
      }
    }

    if (!this.hasSelectedInRows()) {
      return;
    }

    this.generalesEditando.set(true);
    this.cdr.detectChanges();
  }

  /**
   * Crea borrador para un periodo sin registro (copia del último periodo ≤ seleccionado o valores por defecto).
   * Acción explícita; no reutiliza datos de otro periodo en modo solo lectura.
   */
  async crearParametrosParaPeriodo(): Promise<void> {
    this.cerrarDialogo();

    if (this.hasSelectedInRows() || !this.isConfigurableTab() || this.generalesEditando()) {
      return;
    }

    if (this.isPreparingEdit() || this.isPreparandoDialogoCrear()) {
      return;
    }

    this.isPreparandoDialogoCrear.set(true);
    try {
      await this.cargar(this.selectedPeriodo(), { showLoadingOverlay: false });
      if (this.hasSelectedInRows()) {
        return;
      }
      this.mostrarConfirmacionCrearParametros();
    } finally {
      this.isPreparandoDialogoCrear.set(false);
      this.cdr.markForCheck();
    }
  }

  /**
   * Tras elegir en el modal: formulario vacío (solo UI) o plantilla desde último período (consulta puntual).
   * No guarda en base de datos.
   */
  private async finalizarCrearParametrosConBase(cargarUltimoRegistrado: boolean): Promise<void> {
    if (this.hasSelectedInRows() || !this.isConfigurableTab() || this.generalesEditando()) {
      return;
    }
    if (cargarUltimoRegistrado) {
      this.isLoadingPlantilla.set(true);
      try {
        await this.prepararNuevoPeriodoDesdeBase(this.selectedPeriodo());
      } finally {
        this.isLoadingPlantilla.set(false);
        this.cdr.markForCheck();
      }
    } else {
      this.patchForm(this.emptyParametroForPeriodo(this.selectedPeriodo()));
    }
    if (!this.hasSelectedInRows() && this.datosFormularioListos()) {
      this.generalesEditando.set(true);
      this.form.markAsPristine();
    }
    this.cdr.markForCheck();
  }

  volverParametros(): void {
    const row = this.rows().find((item) => item.periodo === this.selectedPeriodo());
    this.patchForm(row ?? this.emptyParametroForPeriodo(this.selectedPeriodo()), this.selectedPeriodo());
    this.generalesEditando.set(false);
    this.cerrarDialogo();
  }

  async guardar(): Promise<void> {
    this.form.markAllAsTouched();

    if (this.form.invalid || this.isSaving() || !this.datosFormularioListos()) {
      if (this.form.invalid && !this.isSaving() && this.datosFormularioListos()) {
        this.mostrarFormularioInvalido();
      }
      return;
    }

    const periodo = this.selectedPeriodo();
    const existiaRegistro = this.rows().some((row) => row.periodo === periodo);
    if (existiaRegistro) {
      this.mostrarConfirmacionModificacion();
      return;
    }

    await this.ejecutarGuardarInterno();
  }

  private async ejecutarGuardarInterno(): Promise<void> {
    if (this.form.invalid || this.isSaving() || !this.datosFormularioListos()) {
      return;
    }

    const periodo = this.selectedPeriodo();
    const existiaRegistro = this.rows().some((row) => row.periodo === periodo);

    if (!existiaRegistro && this.periodosGeneralesCatalogo().includes(periodo)) {
      this.mostrarPeriodoDuplicado(periodo);
      return;
    }

    this.isSaving.set(true);
    this.cerrarDialogo();

    const payload: ParametroGeneral = {
      ...this.form.getRawValue(),
      periodo,
      fechaActualizacion: new Date().toISOString(),
    };

    try {
      const saved = await this.service.guardar(payload);
      const nextRows = [saved, ...this.rows().filter((row) => row.periodo !== saved.periodo)].sort((left, right) =>
        right.periodo.localeCompare(left.periodo),
      );
      this.rows.set(nextRows);
      this.selectedPeriodo.set(saved.periodo);
      this.periodoGlobal.setPeriodoYm(saved.periodo);
      this.patchForm(saved);
      this.generalesEditando.set(false);
      if (existiaRegistro) {
        this.mostrarExitoActualizacion(saved.periodo);
      } else {
        this.mostrarExitoGuardado(saved.periodo);
      }
      await this.refrescarPeriodosDesdeBd();
    } catch (err) {
      if (isDevMode()) {
        console.error('[Parametros] guardar', err);
      }
      const detalle = this.extractErrorDetail(err) || 'No fue posible guardar los parámetros generales.';
      if (this.isDuplicatePeriodError(err)) {
        this.mostrarPeriodoDuplicado(periodo);
      } else if (existiaRegistro) {
        this.mostrarErrorActualizacion(detalle);
      } else {
        this.mostrarErrorGuardado(detalle);
      }
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

  seleccionarCcaf(value: SearchSelectValue): void {
    this.selectedCcafId.set(this.catalogIdFromSearchValue(value));
  }

  seleccionarMutual(value: SearchSelectValue): void {
    this.selectedMutualId.set(this.catalogIdFromSearchValue(value));
  }

  selectedYear(): string {
    return this.selectedPeriodo().slice(0, 4);
  }

  selectedMonth(): string {
    return this.selectedPeriodo().slice(5, 7);
  }

  isConfigurableTab(): boolean {
    const tab = this.activeTab();
    return (
      tab === 'valores' ||
      tab === 'remuneraciones' ||
      (tab === 'ccafMutual' && this.ccafMutualSubTab() === 'config')
    );
  }

  /** Tooltip del botón Modificar cuando la vista activa no es editable. */
  modificarTooltipConsulta(): string {
    if (this.generalesEditando()) {
      return '';
    }
    if (!this.isConfigurableTab()) {
      return 'Modificar/Guardar solo aplican a Valores, Remuneraciones y CCAF > Configuración.';
    }
    if (!this.hasSelectedInRows()) {
      return 'No hay parámetros cargados para este periodo. Use Crear parámetros si desea registrar uno nuevo.';
    }
    return '';
  }

  selectedLey16744Rate(): number | null {
    return this.catalogos().ley16744Parametros[0]?.cotizacionBasicaEmpleador ?? null;
  }

  fechaActualizacionLabel(): string {
    const value = this.form.controls.fechaActualizacion.value;
    return value ? this.formatDateTime(value) : 'Sin información';
  }

  money(value: number | null): string {
    return value === null ? '—' : `$ ${new Intl.NumberFormat('es-CL', { maximumFractionDigits: 0 }).format(value)}`;
  }

  decimal(value: number | null, digits = 2): string {
    return value === null
      ? '—'
      : new Intl.NumberFormat('es-CL', {
          minimumFractionDigits: digits,
          maximumFractionDigits: digits,
        }).format(value);
  }

  date(value: string | null): string {
    if (!value) {
      return '—';
    }

    const date = new Date(`${value}T00:00:00`);

    if (!Number.isFinite(date.getTime())) {
      return value;
    }

    return new Intl.DateTimeFormat('es-CL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
      .format(date)
      .replaceAll('/', '-');
  }

  labelParametro(value: string): string {
    return value
      .toLowerCase()
      .split('_')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }

  private puedeAbandonarEdicionAlCambiarPeriodo(): boolean {
    if (!this.generalesEditando() || !this.form.dirty) {
      return true;
    }
    return globalThis.confirm(
      'Hay cambios sin guardar. Si continúa, se descartarán. ¿Cambiar de periodo?',
    );
  }

  private async seleccionarPeriodo(
    periodo: string,
    options?: { fromGlobal?: boolean },
  ): Promise<void> {
    if (periodo === this.selectedPeriodo()) {
      return;
    }
    if (!this.puedeAbandonarEdicionAlCambiarPeriodo()) {
      if (options?.fromGlobal) {
        this.periodoGlobal.setPeriodoYm(this.selectedPeriodo());
      }
      this.cdr.markForCheck();
      return;
    }

    this.selectedPeriodo.set(periodo);
    this.form.controls.periodo.setValue(periodo, { emitEvent: false });
    this.generalesEditando.set(false);
    this.cerrarDialogo();

    await Promise.all([this.cargar(periodo), this.refrescarPeriodosDesdeBd()]);

    if (!options?.fromGlobal) {
      this.periodoGlobal.setPeriodoYm(periodo);
    }
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

    this.patchForm(this.emptyParametroForPeriodo(periodo));
  }

  private patchForm(row: ParametroGeneral, expectedPeriodo?: string): void {
    const selected = expectedPeriodo ?? this.selectedPeriodo();
    if (row.periodo !== selected) {
      this.dialogState.set({
        kind: 'alerta',
        variant: 'error',
        title: 'No se pudieron actualizar los parámetros',
        message: 'Los datos recibidos no coinciden con el periodo seleccionado.',
        detail: `Periodo en datos: ${row.periodo}. Periodo seleccionado: ${selected}.`,
        primaryLabel: 'Aceptar',
      });
      this.datosFormularioListos.set(false);
      return;
    }

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

    this.datosFormularioListos.set(true);
  }

  private enterCargar(): void {
    this.cargarDepth += 1;
    this.isLoading.set(true);
  }

  private leaveCargar(): void {
    this.cargarDepth = Math.max(0, this.cargarDepth - 1);
    if (this.cargarDepth === 0) {
      this.isLoading.set(false);
    }
  }

  private async refrescarPeriodosDesdeBd(): Promise<void> {
    try {
      const periodos = await this.service.listarPeriodos();
      this.periodosGeneralesCatalogo.set(periodos);
    } catch {
      // Mantiene el catálogo previo si falla la consulta ligera.
    }
    this.cdr.markForCheck();
  }

  private ensureCatalogSelection(catalogos: ParametrosGeneralesCatalogos): void {
    const tieneParametrosPeriodo = this.rows().some((row) => row.periodo === this.selectedPeriodo());
    if (!tieneParametrosPeriodo) {
      this.selectedCcafId.set(null);
      this.selectedMutualId.set(null);
      return;
    }

    const ccafExists = catalogos.ccafEntidades.some((row) => row.idCcafEntidad === this.selectedCcafId());
    const mutualExists = catalogos.organismosLey16744.some(
      (row) => row.idOrganismoAdministradorLey16744 === this.selectedMutualId(),
    );

    if (!ccafExists) {
      this.selectedCcafId.set(catalogos.ccafEntidades[0]?.idCcafEntidad ?? null);
    }

    if (!mutualExists) {
      this.selectedMutualId.set(catalogos.organismosLey16744[0]?.idOrganismoAdministradorLey16744 ?? null);
    }
  }

  /** Valores neutros para un periodo sin registro (sin datos de otros periodos). */
  private emptyParametroForPeriodo(periodo: string): ParametroGeneral {
    return {
      periodo,
      uf: null,
      utm: null,
      uta: null,
      sueldoMinimo: null,
      sueldoMinimo18a65: null,
      sueldoMinimoMenor18Mayor65: null,
      sueldoMinimoCasaParticular: null,
      ingresoMinimoNoRemuneracional: null,
      gratificacion: false,
      immGratificacion: null,
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

  private emptyParametro(): ParametroGeneral {
    return this.emptyParametroForPeriodo(this.currentPeriodo());
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

  private catalogIdFromSearchValue(value: SearchSelectValue): number | null {
    if (value === null || value === '' || value === undefined) {
      return null;
    }

    const n = typeof value === 'number' ? value : Number(value);
    return Number.isFinite(n) && n > 0 ? n : null;
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
