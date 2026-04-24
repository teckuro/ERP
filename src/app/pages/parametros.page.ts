import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';

import { TablaParametrosGeneralesComponent } from '../features/parametros-generales/components/tabla-parametros-generales/tabla-parametros-generales';
import {
  ParametroGeneral,
  ParametrosGeneralesCatalogos,
  ParametrosTabId,
} from '../features/parametros-generales/models/parametro-general.model';
import { ParametrosGeneralesService } from '../features/parametros-generales/services/parametros-generales.service';
import { ButtonComponent } from '../shared/components/ui/button.component';
import { MessageBoxComponent } from '../shared/components/ui/message-box.component';
import {
  RecordBreadcrumbComponent,
  RecordBreadcrumbItem,
} from '../shared/components/ui/record-breadcrumb.component';

interface ParametrosTab {
  id: ParametrosTabId;
  label: string;
}

interface NormativaCoverageItem {
  label: string;
  detail: string;
  covered: boolean;
  source: string;
}

@Component({
  selector: 'app-parametros-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    LucideAngularModule,
    ButtonComponent,
    MessageBoxComponent,
    RecordBreadcrumbComponent,
    TablaParametrosGeneralesComponent,
  ],
  template: `
    <section class="parametros-page" aria-label="Mantenedor de parámetros">
      <header class="parametros-header">
        <app-record-breadcrumb [items]="breadcrumbItems" title="Parámetros del sistema"></app-record-breadcrumb>
      </header>

      <div class="parametros-actions" aria-label="Acciones de parámetros">
        <app-button variant="secondary" size="md" [disabled]="isLoading() || isSaving()" (click)="sincronizar()">
          <lucide-icon icon class="h-4 w-4" name="refresh-cw"></lucide-icon>
          {{ syncButtonLabel() }}
        </app-button>

        @if (activeTab() === 'generales') {
          <app-button variant="secondary" size="md" [disabled]="isSaving()" (click)="nuevoPeriodo()">
            <lucide-icon icon class="h-4 w-4" name="plus"></lucide-icon>
            Nuevo periodo
          </app-button>
          <app-button variant="primary" size="md" [disabled]="isSaving() || form.invalid" (click)="guardar()">
            <lucide-icon icon class="h-4 w-4" name="save"></lucide-icon>
            {{ isSaving() ? 'Guardando...' : 'Guardar' }}
          </app-button>
        }
      </div>

      <div class="parametros-content">
        @if (isLoading()) {
          <app-message-box
            variant="loading"
            title="Cargando parámetros"
            message="Obteniendo periodos y catálogos vigentes."
          ></app-message-box>
        }

        @if (errorMessage()) {
          <app-message-box
            variant="error"
            title="No fue posible completar la operación"
            [message]="errorMessage() ?? ''"
            [dismissible]="true"
            (dismiss)="errorMessage.set(null)"
          ></app-message-box>
        }

        @if (successMessage()) {
          <app-message-box
            variant="success"
            title="Parámetros guardados"
            [message]="successMessage() ?? ''"
            [dismissible]="true"
            (dismiss)="successMessage.set(null)"
          ></app-message-box>
        }

        <nav class="parametros-tabs" aria-label="Secciones de parámetros">
          @for (tab of tabs; track tab.id) {
            <button
              type="button"
              class="tab-button"
              [class.tab-button-active]="activeTab() === tab.id"
              [attr.aria-current]="activeTab() === tab.id ? 'page' : null"
              (click)="activeTab.set(tab.id)"
            >
              <span>{{ tab.label }}</span>
              <span class="tab-count">{{ tabCount(tab.id) }}</span>
            </button>
          }
        </nav>

        @switch (activeTab()) {
          @case ('generales') {
            <section class="tab-panel" aria-label="Parámetros generales">
              <div class="parametros-selector">
                <label class="field field-periodo">
                  <span class="field-label">Periodo</span>
                  <select class="field-control" [value]="selectedPeriodo()" (change)="seleccionarPeriodo($event)">
                    @for (row of rows(); track row.periodo) {
                      <option [value]="row.periodo">{{ row.periodo }}</option>
                    }
                    @if (!hasSelectedInRows()) {
                      <option [value]="selectedPeriodo()">{{ selectedPeriodo() }}</option>
                    }
                  </select>
                </label>

                <div class="periodo-status">
                  <span class="status-label">Última actualización</span>
                  <span class="status-value">{{ fechaActualizacionLabel() }}</span>
                </div>
              </div>

              <form class="parametros-form" [formGroup]="form" (ngSubmit)="guardar()">
                <section class="form-section" aria-labelledby="indicadores-title">
                  <div class="section-heading">
                    <h2 id="indicadores-title">Indicadores mensuales</h2>
                    <p>Valores económicos usados por el cálculo de remuneraciones del periodo.</p>
                  </div>

                  <div class="form-grid">
                    <label class="field">
                      <span class="field-label">Periodo</span>
                      <input class="field-control" type="month" formControlName="periodo" />
                      @if (showError('periodo')) {
                        <span class="field-error">Ingresa un periodo válido.</span>
                      }
                    </label>

                    <label class="field">
                      <span class="field-label">UF</span>
                      <input class="field-control text-right" type="number" step="0.01" formControlName="uf" />
                    </label>

                    <label class="field">
                      <span class="field-label">UTM</span>
                      <input class="field-control text-right" type="number" step="1" formControlName="utm" />
                    </label>

                    <label class="field">
                      <span class="field-label">Sueldo mínimo</span>
                      <input class="field-control text-right" type="number" step="1" formControlName="sueldoMinimo" />
                    </label>

                    <label class="field">
                      <span class="field-label">Sueldo mínimo 18 a 65</span>
                      <input class="field-control text-right" type="number" step="1" formControlName="sueldoMinimo18a65" />
                    </label>

                    <label class="field">
                      <span class="field-label">IMM gratificación</span>
                      <input class="field-control text-right" type="number" step="1" formControlName="immGratificacion" />
                    </label>
                  </div>
                </section>

                <section class="form-section" aria-labelledby="topes-title">
                  <div class="section-heading">
                    <h2 id="topes-title">Topes imponibles</h2>
                    <p>Límites en UF para cotizaciones previsionales y seguro de cesantía.</p>
                  </div>

                  <div class="form-grid">
                    <label class="field">
                      <span class="field-label">Tope AFP</span>
                      <input class="field-control text-right" type="number" step="0.01" formControlName="topeAfp" />
                    </label>

                    <label class="field">
                      <span class="field-label">Tope IPS</span>
                      <input class="field-control text-right" type="number" step="0.01" formControlName="topeIps" />
                    </label>

                    <label class="field">
                      <span class="field-label">Tope cesantía</span>
                      <input class="field-control text-right" type="number" step="0.01" formControlName="topeCesantia" />
                    </label>

                    <label class="field">
                      <span class="field-label">Tope AFP voluntario</span>
                      <input class="field-control text-right" type="number" step="0.01" formControlName="topeAfpVoluntario" />
                    </label>
                  </div>
                </section>

                <section class="form-section" aria-labelledby="tasas-title">
                  <div class="section-heading">
                    <h2 id="tasas-title">Tasas previsionales</h2>
                    <p>Porcentajes base para SIS y AFC aplicados por el motor de remuneraciones.</p>
                  </div>

                  <div class="form-grid">
                    <label class="field">
                      <span class="field-label">SIS</span>
                      <input class="field-control text-right" type="number" step="0.001" formControlName="sis" />
                    </label>

                    <label class="field">
                      <span class="field-label">AFC trabajador indefinido</span>
                      <input class="field-control text-right" type="number" step="0.001" formControlName="afcTrabajadorIndefinido" />
                    </label>

                    <label class="field">
                      <span class="field-label">AFC empleador indefinido</span>
                      <input class="field-control text-right" type="number" step="0.001" formControlName="afcEmpleadorIndefinido" />
                    </label>

                    <label class="field">
                      <span class="field-label">AFC empleador plazo fijo</span>
                      <input class="field-control text-right" type="number" step="0.001" formControlName="afcEmpleadorPlazo" />
                    </label>
                  </div>
                </section>

                <section class="form-section" aria-labelledby="configuracion-title">
                  <div class="section-heading">
                    <h2 id="configuracion-title">Configuración de cálculo</h2>
                    <p>Opciones generales que modifican reglas automáticas del periodo.</p>
                  </div>

                  <div class="toggle-grid">
                    <label class="toggle-field">
                      <input type="checkbox" formControlName="gratificacion" />
                      <span>
                        <strong>Calcular gratificación legal</strong>
                        <small>Activa la regla automática de gratificación.</small>
                      </span>
                    </label>

                    <label class="toggle-field">
                      <input type="checkbox" formControlName="descuentosBasePorDia" />
                      <span>
                        <strong>Descuentos base por día</strong>
                        <small>Prorratea descuentos según días trabajados.</small>
                      </span>
                    </label>
                  </div>
                </section>
              </form>

              <section class="list-section" aria-labelledby="periodos-title">
                <div class="section-heading">
                  <h2 id="periodos-title">Periodos registrados</h2>
                  <p>Resumen de parámetros generales disponibles.</p>
                </div>

                <app-tabla-parametros-generales
                  [rows]="rows()"
                  [loading]="isLoading()"
                  [errorMessage]="tableErrorMessage()"
                ></app-tabla-parametros-generales>
              </section>
            </section>
          }

          @case ('normativa') {
            <section class="tab-panel" aria-label="Cobertura normativa chilena">
              <div class="section-heading">
                <h2>Cobertura normativa</h2>
                <p>Control de parámetros requeridos para remuneraciones en Chile, contrastado con la información disponible en la base de datos.</p>
              </div>

              <div class="coverage-grid">
                @for (item of normativaCoverage(); track item.label) {
                  <article class="coverage-card">
                    <div>
                      <h3>{{ item.label }}</h3>
                      <p>{{ item.detail }}</p>
                    </div>
                    <span class="status-pill" [class.status-pill-off]="!item.covered">
                      {{ item.covered ? 'Cubierto' : 'Falta modelar' }}
                    </span>
                    <small>{{ item.source }}</small>
                  </article>
                }
              </div>

              <app-message-box
                variant="info"
                title="Alcance de la sincronización"
                message="Sincronizar vuelve a consultar Supabase y carga los registros existentes. Los parámetros marcados como faltantes requieren columnas o tablas nuevas antes de poder persistirse."
              ></app-message-box>
            </section>
          }

          @case ('tramos') {
            <section class="tab-panel" aria-label="Tramos">
              <div class="section-heading">
                <h2>Tramos de asignación familiar</h2>
                <p>Rangos por periodo y valor asociado.</p>
              </div>

              <div class="table-wrap">
                <table class="catalog-table">
                  <thead>
                    <tr>
                      <th>Periodo</th>
                      <th>Tramo</th>
                      <th class="text-right">Desde</th>
                      <th class="text-right">Hasta</th>
                      <th class="text-right">Valor</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (row of catalogos().tramosCarga; track row.idTramo) {
                      <tr>
                        <td>{{ row.periodo }}</td>
                        <td>{{ row.tramo ?? '-' }}</td>
                        <td class="text-right">{{ money(row.desde) }}</td>
                        <td class="text-right">{{ money(row.hasta) }}</td>
                        <td class="text-right">{{ money(row.valor) }}</td>
                      </tr>
                    } @empty {
                      <tr><td colspan="5" class="empty-cell">No hay tramos cargados.</td></tr>
                    }
                  </tbody>
                </table>
              </div>

            </section>
          }

          @case ('impuestos') {
            <section class="tab-panel" aria-label="Impuestos">
              <div class="section-heading">
                <h2>Impuesto único</h2>
                <p>Tabla oficial y tramos por periodo para el cálculo tributario.</p>
              </div>

              <div class="table-wrap">
                <table class="catalog-table">
                  <thead>
                    <tr>
                      <th>Vigencia</th>
                      <th class="text-right">Tramo</th>
                      <th class="text-right">Desde UTM</th>
                      <th class="text-right">Hasta UTM</th>
                      <th class="text-right">Factor</th>
                      <th class="text-right">Rebaja UTM</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (row of catalogos().tablaImpuestoUnico; track row.id) {
                      <tr>
                        <td>{{ date(row.vigenciaInicio) }}</td>
                        <td class="text-right">{{ row.tramo }}</td>
                        <td class="text-right">{{ decimal(row.desde, 2) }}</td>
                        <td class="text-right">{{ decimal(row.hasta, 2) }}</td>
                        <td class="text-right">{{ percent(row.factor) }}</td>
                        <td class="text-right">{{ decimal(row.rebaja, 4) }}</td>
                      </tr>
                    } @empty {
                      <tr><td colspan="6" class="empty-cell">No hay tabla de impuesto único cargada.</td></tr>
                    }
                  </tbody>
                </table>
              </div>

              <div class="section-heading section-subheading">
                <h2>Tramos de impuesto por periodo</h2>
                <p>Registros mensuales usados por reglas heredadas de cálculo.</p>
              </div>

              <div class="table-wrap">
                <table class="catalog-table">
                  <thead>
                    <tr>
                      <th>Periodo</th>
                      <th class="text-right">Desde</th>
                      <th class="text-right">Hasta</th>
                      <th class="text-right">Factor</th>
                      <th class="text-right">Rebaja</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (row of catalogos().tramosImpuesto; track row.idTramo) {
                      <tr>
                        <td>{{ row.periodo }}</td>
                        <td class="text-right">{{ money(row.desde) }}</td>
                        <td class="text-right">{{ money(row.hasta) }}</td>
                        <td class="text-right">{{ percent(row.factor) }}</td>
                        <td class="text-right">{{ money(row.rebaja) }}</td>
                      </tr>
                    } @empty {
                      <tr><td colspan="5" class="empty-cell">No hay tramos de impuesto cargados.</td></tr>
                    }
                  </tbody>
                </table>
              </div>

            </section>
          }

          @case ('isapres') {
            <section class="tab-panel" aria-label="Isapres">
              <div class="section-heading">
                <h2>Isapres</h2>
                <p>Instituciones de salud privadas disponibles para ficha previsional.</p>
              </div>

              <div class="table-wrap">
                <table class="catalog-table">
                  <thead>
                    <tr>
                      <th>Código</th>
                      <th>Nombre</th>
                      <th class="text-right">Cotización</th>
                      <th>Vigencia inicio</th>
                      <th>Vigencia fin</th>
                      <th>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (row of catalogos().isapres; track row.idSalud) {
                      <tr>
                        <td>{{ row.codigo ?? '-' }}</td>
                        <td>{{ row.nombre }}</td>
                        <td class="text-right">{{ percent(row.porcentajeCotizacion) }}</td>
                        <td>{{ date(row.vigenciaInicio) }}</td>
                        <td>{{ date(row.vigenciaFin) }}</td>
                        <td><span class="status-pill" [class.status-pill-off]="!row.vigente">{{ row.vigente ? 'Vigente' : 'Inactiva' }}</span></td>
                      </tr>
                    } @empty {
                      <tr><td colspan="6" class="empty-cell">No hay isapres cargadas.</td></tr>
                    }
                  </tbody>
                </table>
              </div>

            </section>
          }

          @case ('afp') {
            <section class="tab-panel" aria-label="AFP">
              <div class="section-heading">
                <h2>AFP</h2>
                <p>Tasas previsionales por administradora.</p>
              </div>

              <div class="table-wrap">
                <table class="catalog-table">
                  <thead>
                    <tr>
                      <th>Código</th>
                      <th>Nombre</th>
                      <th class="text-right">Obligatoria</th>
                      <th class="text-right">Comisión</th>
                      <th class="text-right">SIS</th>
                      <th class="text-right">Empleador</th>
                      <th>Vigencia</th>
                      <th>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (row of catalogos().afp; track row.idAfp) {
                      <tr>
                        <td>{{ row.codigo ?? '-' }}</td>
                        <td>{{ row.nombre }}</td>
                        <td class="text-right">{{ percent(row.tasaObligatoria) }}</td>
                        <td class="text-right">{{ percent(row.comision) }}</td>
                        <td class="text-right">{{ percent(row.sis) }}</td>
                        <td class="text-right">{{ percent(row.tasaEmpleador) }}</td>
                        <td>{{ vigencia(row.vigenciaInicio, row.vigenciaFin) }}</td>
                        <td><span class="status-pill" [class.status-pill-off]="!row.vigente">{{ row.vigente ? 'Vigente' : 'Inactiva' }}</span></td>
                      </tr>
                    } @empty {
                      <tr><td colspan="8" class="empty-cell">No hay AFP cargadas.</td></tr>
                    }
                  </tbody>
                </table>
              </div>
            </section>
          }

          @case ('reforma') {
            <section class="tab-panel" aria-label="Reforma de pensiones">
              <div class="section-heading">
                <h2>Reforma de pensiones</h2>
                <p>Parámetros legales asociados a cotizaciones y topes previsionales.</p>
              </div>

              <div class="table-wrap">
                <table class="catalog-table">
                  <thead>
                    <tr>
                      <th>Parámetro</th>
                      <th class="text-right">Valor decimal</th>
                      <th class="text-right">Valor entero</th>
                      <th>Vigencia inicio</th>
                      <th>Vigencia fin</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (row of catalogos().reformaPensiones; track row.idParametro) {
                      <tr>
                        <td>{{ labelParametro(row.nombre) }}</td>
                        <td class="text-right">{{ decimal(row.valorDecimal, 4) }}</td>
                        <td class="text-right">{{ entero(row.valorEntero) }}</td>
                        <td>{{ date(row.vigenciaInicio) }}</td>
                        <td>{{ date(row.vigenciaFin) }}</td>
                      </tr>
                    } @empty {
                      <tr><td colspan="5" class="empty-cell">No hay parámetros legales cargados.</td></tr>
                    }
                  </tbody>
                </table>
              </div>
            </section>
          }

          @case ('ley16744') {
            <section class="tab-panel" aria-label="Ley 16.744">
              <div class="section-heading">
                <h2>Ley 16.744</h2>
                <p>Organismos administradores, tasa base y parametros por empresa.</p>
              </div>

              <div class="table-wrap">
                <table class="catalog-table">
                  <thead>
                    <tr>
                      <th>Codigo</th>
                      <th>Nombre</th>
                      <th>Tipo</th>
                      <th>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (row of catalogos().organismosLey16744; track row.idOrganismoAdministradorLey16744) {
                      <tr>
                        <td>{{ row.codigo }}</td>
                        <td>{{ row.nombre }}</td>
                        <td>{{ row.tipo }}</td>
                        <td><span class="status-pill" [class.status-pill-off]="!row.vigente">{{ row.vigente ? 'Vigente' : 'Inactivo' }}</span></td>
                      </tr>
                    } @empty {
                      <tr><td colspan="4" class="empty-cell">No hay organismos Ley 16.744 cargados.</td></tr>
                    }
                  </tbody>
                </table>
              </div>

              <div class="section-heading section-subheading">
                <h2>Parametros Ley 16.744</h2>
                <p>Cotizacion basica global; la tasa adicional se configura por empresa.</p>
              </div>

              <div class="table-wrap">
                <table class="catalog-table">
                  <thead>
                    <tr>
                      <th>Codigo</th>
                      <th class="text-right">Cotizacion basica</th>
                      <th>Adicional diferenciada</th>
                      <th>Vigencia</th>
                      <th>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (row of catalogos().ley16744Parametros; track row.idLey16744Parametro) {
                      <tr>
                        <td>{{ row.codigo }}</td>
                        <td class="text-right">{{ percent(row.cotizacionBasicaEmpleador) }}</td>
                        <td>{{ row.descripcionTasaAdicional ?? '-' }}</td>
                        <td>{{ vigencia(row.vigenciaInicio, row.vigenciaFin) }}</td>
                        <td><span class="status-pill" [class.status-pill-off]="!row.vigente">{{ row.vigente ? 'Vigente' : 'Inactivo' }}</span></td>
                      </tr>
                    } @empty {
                      <tr><td colspan="5" class="empty-cell">No hay parametros Ley 16.744 cargados.</td></tr>
                    }
                  </tbody>
                </table>
              </div>
            </section>
          }

          @case ('ccaf') {
            <section class="tab-panel" aria-label="CCAF">
              <div class="section-heading">
                <h2>CCAF</h2>
                <p>Cajas de compensacion disponibles para seleccion y calculo.</p>
              </div>

              <div class="table-wrap">
                <table class="catalog-table">
                  <thead>
                    <tr>
                      <th>Codigo</th>
                      <th>Nombre</th>
                      <th>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (row of catalogos().ccafEntidades; track row.idCcafEntidad) {
                      <tr>
                        <td>{{ row.codigo }}</td>
                        <td>{{ row.nombre }}</td>
                        <td><span class="status-pill" [class.status-pill-off]="!row.vigente">{{ row.vigente ? 'Vigente' : 'Inactiva' }}</span></td>
                      </tr>
                    } @empty {
                      <tr><td colspan="3" class="empty-cell">No hay CCAF cargadas.</td></tr>
                    }
                  </tbody>
                </table>
              </div>
            </section>
          }

          @case ('apv') {
            <section class="tab-panel" aria-label="APV y APVC">
              <div class="section-heading">
                <h2>APV/APVC</h2>
                <p>Instituciones y formas de pago que alimentan los selects APVI de ficha.</p>
              </div>

              <div class="table-wrap">
                <table class="catalog-table">
                  <thead>
                    <tr>
                      <th>Codigo</th>
                      <th>Institucion</th>
                      <th>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (row of catalogos().apvInstituciones; track row.idInstitucionApv) {
                      <tr>
                        <td>{{ row.codigo ?? '-' }}</td>
                        <td>{{ row.nombre }}</td>
                        <td><span class="status-pill" [class.status-pill-off]="!row.vigente">{{ row.vigente ? 'Vigente' : 'Inactiva' }}</span></td>
                      </tr>
                    } @empty {
                      <tr><td colspan="3" class="empty-cell">No hay instituciones APV/APVC cargadas.</td></tr>
                    }
                  </tbody>
                </table>
              </div>

              <div class="section-heading section-subheading">
                <h2>Formas de pago APV/APVC</h2>
              </div>

              <div class="table-wrap">
                <table class="catalog-table">
                  <thead>
                    <tr>
                      <th>Codigo</th>
                      <th>Forma</th>
                      <th>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (row of catalogos().apvFormasPago; track row.idFormaPagoApv) {
                      <tr>
                        <td>{{ row.codigo ?? '-' }}</td>
                        <td>{{ row.nombre }}</td>
                        <td><span class="status-pill" [class.status-pill-off]="!row.vigente">{{ row.vigente ? 'Vigente' : 'Inactiva' }}</span></td>
                      </tr>
                    } @empty {
                      <tr><td colspan="3" class="empty-cell">No hay formas de pago APV/APVC cargadas.</td></tr>
                    }
                  </tbody>
                </table>
              </div>
            </section>
          }
        }
      </div>
    </section>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .parametros-page {
        display: grid;
        gap: 16px;
      }

      .parametros-actions {
        display: flex;
        justify-content: flex-end;
        gap: 8px;
      }

      .parametros-content {
        display: grid;
        gap: 16px;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        background: #ffffff;
        padding: 16px;
      }

      .parametros-tabs {
        display: flex;
        gap: 4px;
        overflow-x: auto;
        border-bottom: 1px solid #e5e7eb;
        padding-bottom: 8px;
      }

      .tab-button {
        display: inline-flex;
        min-height: 32px;
        flex: 0 0 auto;
        align-items: center;
        gap: 8px;
        border: 1px solid transparent;
        border-radius: 6px;
        background: transparent;
        padding: 0 12px;
        color: #374151;
        cursor: pointer;
        font-size: 0.82rem;
        font-weight: 500;
      }

      .tab-button:hover {
        background: #f8fafc;
      }

      .tab-button-active {
        border-color: #bfdbfe;
        background: #eff6ff;
        color: #1d4ed8;
      }

      .tab-count {
        display: inline-flex;
        min-width: 22px;
        height: 20px;
        align-items: center;
        justify-content: center;
        border-radius: 999px;
        background: #f3f4f6;
        padding: 0 6px;
        color: #6b7280;
        font-size: 0.72rem;
      }

      .tab-button-active .tab-count {
        background: #dbeafe;
        color: #1d4ed8;
      }

      .tab-panel,
      .parametros-form,
      .form-section,
      .list-section {
        display: grid;
        gap: 16px;
      }

      .parametros-selector {
        display: flex;
        align-items: end;
        justify-content: space-between;
        gap: 16px;
      }

      .field {
        display: grid;
        gap: 6px;
        min-width: 0;
      }

      .field-periodo {
        width: min(100%, 220px);
      }

      .field-label,
      .status-label {
        color: #374151;
        font-size: 0.78rem;
        font-weight: 500;
      }

      .field-control {
        min-height: 40px;
        width: 100%;
        min-width: 0;
        border: 1px solid #e5e7eb;
        border-radius: 6px;
        background: #ffffff;
        padding: 0 12px;
        color: #111827;
        font-size: 0.875rem;
        outline: none;
      }

      .field-control:focus {
        border-color: #2563eb;
        box-shadow: 0 0 0 3px #eff6ff;
      }

      .field-error {
        color: #dc2626;
        font-size: 0.76rem;
        font-weight: 650;
      }

      .periodo-status {
        display: grid;
        gap: 4px;
        justify-items: end;
      }

      .status-value {
        color: #111827;
        font-size: 0.875rem;
        font-weight: 600;
      }

      .form-section + .form-section,
      .list-section,
      .section-subheading {
        border-top: 1px solid #e5e7eb;
        padding-top: 16px;
      }

      .section-heading {
        display: grid;
        gap: 4px;
      }

      .section-heading h2 {
        margin: 0;
        color: #111827;
        font-size: 0.95rem;
        font-weight: 600;
      }

      .section-heading p {
        margin: 0;
        color: #6b7280;
        font-size: 0.82rem;
        font-weight: 550;
      }

      .form-grid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 12px;
      }

      .toggle-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 12px;
      }

      .toggle-field {
        display: flex;
        min-height: 56px;
        align-items: center;
        gap: 12px;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        padding: 12px;
      }

      .toggle-field input {
        height: 16px;
        width: 16px;
        accent-color: #2563eb;
      }

      .toggle-field span {
        display: grid;
        gap: 4px;
      }

      .toggle-field strong {
        color: #111827;
        font-size: 0.86rem;
        font-weight: 600;
      }

      .toggle-field small {
        color: #6b7280;
        font-size: 0.78rem;
        font-weight: 550;
      }

      .coverage-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 12px;
      }

      .coverage-card {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        gap: 8px;
        border: 1px solid #bbf7d0;
        border-radius: 8px;
        background: #f0fdf4;
        padding: 12px;
      }

      .coverage-card h3 {
        margin: 0;
        color: #111827;
      }

      .coverage-card p,
      .coverage-card small {
        margin: 4px 0 0;
        color: #4b5563;
        font-size: 0.8rem;
        line-height: 1.4;
      }

      .coverage-card small {
        grid-column: 1 / -1;
        color: #6b7280;
        font-size: 0.74rem;
      }

      .table-wrap {
        overflow-x: auto;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
      }

      .catalog-table {
        width: 100%;
        border-collapse: collapse;
        background: #ffffff;
        font-size: 0.82rem;
      }

      .catalog-table th,
      .catalog-table td {
        border-bottom: 1px solid #e5e7eb;
        padding: 10px 12px;
        text-align: left;
        white-space: nowrap;
      }

      .catalog-table th {
        background: #f8fafc;
        color: #374151;
        font-size: 0.74rem;
        font-weight: 600;
        text-transform: uppercase;
      }

      .catalog-table td {
        color: #111827;
        font-weight: 600;
      }

      .catalog-table tr:last-child td {
        border-bottom: 0;
      }

      .text-right {
        text-align: right !important;
      }

      .empty-cell {
        color: #6b7280 !important;
        text-align: center !important;
      }

      .status-pill {
        display: inline-flex;
        min-height: 24px;
        align-items: center;
        border: 1px solid #bbf7d0;
        border-radius: 999px;
        background: #ecfdf5;
        padding: 0 8px;
        color: #166534;
        font-size: 0.74rem;
        font-weight: 500;
      }

      .status-pill-off {
        border-color: #e5e7eb;
        background: #f8fafc;
        color: #6b7280;
      }

      @media (max-width: 920px) {
        .form-grid {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
      }

      @media (max-width: 640px) {
        .parametros-actions,
        .parametros-selector {
          align-items: stretch;
          flex-direction: column;
        }

        .parametros-actions {
          justify-content: flex-start;
        }

        .periodo-status {
          justify-items: start;
        }

        .form-grid,
        .toggle-grid,
        .coverage-grid {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class ParametrosPage implements OnInit {
  private readonly service = inject(ParametrosGeneralesService);
  private readonly fb = inject(FormBuilder);

  readonly breadcrumbItems: readonly RecordBreadcrumbItem[] = [{ label: 'Parámetros' }];
  readonly tabs: readonly ParametrosTab[] = [
    { id: 'generales', label: 'Generales' },
    { id: 'normativa', label: 'Normativa' },
    { id: 'tramos', label: 'Tramos' },
    { id: 'impuestos', label: 'Impuestos' },
    { id: 'isapres', label: 'Isapres' },
    { id: 'afp', label: 'AFP' },
    { id: 'reforma', label: 'Reforma de pensiones' },
    { id: 'ley16744', label: 'Ley 16.744' },
    { id: 'ccaf', label: 'CCAF' },
    { id: 'apv', label: 'APV/APVC' },
  ];

  readonly activeTab = signal<ParametrosTabId>('generales');
  readonly rows = signal<ParametroGeneral[]>([]);
  readonly selectedPeriodo = signal(this.currentPeriodo());
  readonly catalogos = signal<ParametrosGeneralesCatalogos>(this.emptyCatalogos());
  readonly isLoading = signal(true);
  readonly isSaving = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);

  readonly tableErrorMessage = computed(() => (this.errorMessage() && this.rows().length === 0 ? this.errorMessage() ?? '' : ''));
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
      catalogos.apvFormasPago.length > 0
    );
  });
  readonly syncButtonLabel = computed(() => (this.hasDataForActiveTab() ? 'Refrescar' : 'Sincronizar'));
  readonly normativaCoverage = computed<NormativaCoverageItem[]>(() => {
    const catalogos = this.catalogos();
    const current = this.form.getRawValue();
    const hasCurrentPeriodo = this.rows().some((row) => row.periodo === this.selectedPeriodo());
    const hasFonasa = catalogos.saludInstituciones.some((row) => row.nombre.toLowerCase().includes('fonasa'));
    const legales = catalogos.reformaPensiones.map((row) => row.nombre.toLowerCase());
    const hasSanna = legales.some((nombre) => nombre.includes('sanna'));

    return [
      {
        label: 'Indicadores UF y UTM',
        detail: 'Valores del periodo usados para topes, APV e impuesto único.',
        covered: hasCurrentPeriodo && current.uf !== null && current.utm !== null,
        source: 'SII publica UTM e impuesto único; PREVIRED publica indicadores previsionales del periodo.',
      },
      {
        label: 'Ingreso mínimo mensual',
        detail: 'Mayor de 18 y hasta 65 años, menor de 18/mayor de 65 y fines no remuneracionales.',
        covered: current.sueldoMinimo !== null && current.sueldoMinimo18a65 !== null,
        source: 'Dirección del Trabajo, Ley 21.751 vigente desde 01/01/2026.',
      },
      {
        label: 'Topes imponibles AFP, IPS y AFC',
        detail: 'AFP 90 UF, IPS 60 UF y Seguro de Cesantía 135,2 UF para el periodo.',
        covered: current.topeAfp !== null && current.topeIps !== null && current.topeCesantia !== null,
        source: 'Superintendencia de Pensiones y PREVIRED.',
      },
      {
        label: 'Seguro de Invalidez y Sobrevivencia',
        detail: 'Tasa SIS vigente para cargo empleador, no aplicable a pensionados.',
        covered: current.sis !== null || catalogos.afp.some((row) => row.sis !== null),
        source: 'PREVIRED informa SIS 1,62% para remuneraciones abril 2026.',
      },
      {
        label: 'Seguro de Cesantía AFC',
        detail: 'Tasas trabajador y empleador por contrato indefinido, plazo fijo y casa particular.',
        covered:
          current.afcTrabajadorIndefinido !== null &&
          current.afcEmpleadorIndefinido !== null &&
          current.afcEmpleadorPlazo !== null,
        source: 'AFC/PREVIRED: indefinido 0,6% trabajador y 2,4% empleador; plazo fijo 3,0% empleador.',
      },
      {
        label: 'AFP por administradora',
        detail: 'Tasa obligatoria, comisión, SIS, tasa empleador y vigencia.',
        covered: catalogos.afp.length > 0,
        source: 'PREVIRED publica tasas por AFP para el periodo.',
      },
      {
        label: 'Salud mínima legal',
        detail: 'Cotización mínima 7%, FONASA/ISAPRE y distribución FONASA/CCAF cuando corresponda.',
        covered: hasFonasa && catalogos.saludInstituciones.length > 0,
        source: 'PREVIRED indica 7% salud y distribución CCAF 4,2% / FONASA 2,8%.',
      },
      {
        label: 'Asignación familiar',
        detail: 'Tramos A, B, C y D con monto y requisito de renta.',
        covered: catalogos.tramosCarga.length >= 4,
        source: 'PREVIRED/IPS publican tramos y montos de asignación familiar.',
      },
      {
        label: 'Impuesto Único de Segunda Categoría',
        detail: 'Tabla mensual con tramos, factor y rebaja.',
        covered: catalogos.tablaImpuestoUnico.length > 0 || catalogos.tramosImpuesto.length > 0,
        source: 'SII publica tabla mensual de Impuesto Único de Segunda Categoría.',
      },
      {
        label: 'APV y depósito convenido',
        detail: 'Topes APV mensual 50 UF, anual 600 UF y depósito convenido 900 UF.',
        covered:
          current.topeAfpVoluntario !== null &&
          legales.some((nombre) => nombre.includes('apv')) &&
          legales.some((nombre) => nombre.includes('deposito')) &&
          catalogos.apvInstituciones.length > 0 &&
          catalogos.apvFormasPago.length > 0,
        source: 'PREVIRED publica topes APV y depósito convenido.',
      },
      {
        label: 'Trabajos pesados',
        detail: 'Cotización adicional por trabajo pesado 2%/2% o menos pesado 1%/1%.',
        covered: catalogos.trabajosPesados.length >= 2,
        source: 'PREVIRED publica cotización para trabajos pesados.',
      },
      {
        label: 'Ley SANNA',
        detail: 'Seguro SANNA con cotizacion de cargo empleador.',
        covered: hasSanna,
        source: 'SUSESO publica Ley 21.010 / SANNA.',
      },
      {
        label: 'Ley 16.744',
        detail: 'Organismos administradores y cotizacion basica por empresa.',
        covered: catalogos.ley16744Parametros.length > 0 && catalogos.organismosLey16744.length > 0,
        source: 'SUSESO publica financiamiento y organismos administradores Ley 16.744.',
      },
      {
        label: 'CCAF',
        detail: 'Cajas de compensacion vigentes.',
        covered: catalogos.ccafEntidades.length > 0,
        source: 'SUSESO publica CCAF vigentes.',
      },
      {
        label: 'Casa particular y fines no remuneracionales',
        detail: 'Minimo casa particular y minimo para fines no remuneracionales.',
        covered: false,
        source: 'La BD actual no tiene columnas separadas para casa particular ni fines no remuneracionales.',
      },
    ];
  });

  readonly form = this.fb.group({
    periodo: [this.currentPeriodo(), [Validators.required, Validators.pattern(/^\d{4}-\d{2}$/)]],
    uf: this.fb.control<number | null>(null),
    utm: this.fb.control<number | null>(null),
    sueldoMinimo: this.fb.control<number | null>(null),
    sueldoMinimo18a65: this.fb.control<number | null>(null),
    gratificacion: this.fb.nonNullable.control(true),
    immGratificacion: this.fb.control<number | null>(null),
    topeAfp: this.fb.control<number | null>(null),
    topeIps: this.fb.control<number | null>(null),
    topeCesantia: this.fb.control<number | null>(null),
    topeAfpVoluntario: this.fb.control<number | null>(null),
    sis: this.fb.control<number | null>(null),
    descuentosBasePorDia: this.fb.nonNullable.control(false),
    afcTrabajadorIndefinido: this.fb.control<number | null>(null),
    afcEmpleadorIndefinido: this.fb.control<number | null>(null),
    afcEmpleadorPlazo: this.fb.control<number | null>(null),
    fechaActualizacion: this.fb.control<string | null>(null),
  });

  async ngOnInit(): Promise<void> {
    await this.cargar();
  }

  async cargar(): Promise<void> {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    try {
      const [rows, catalogos] = await Promise.all([this.service.listar(), this.service.listarCatalogos()]);
      this.rows.set(rows);
      this.catalogos.set(catalogos);
      this.patchForm(rows.find((row) => row.periodo === this.selectedPeriodo()) ?? rows[0] ?? this.emptyParametro());
    } catch {
      this.errorMessage.set('No fue posible cargar los parámetros del sistema.');
    } finally {
      this.isLoading.set(false);
    }
  }

  async sincronizar(): Promise<void> {
    const hadData = this.hasAnySyncedData();
    await this.cargar();

    if (!hadData && this.hasAnySyncedData()) {
      this.successMessage.set('Datos sincronizados desde la base de datos.');
      return;
    }

    if (!this.hasAnySyncedData()) {
      this.errorMessage.set('No hay parámetros disponibles en la base de datos para sincronizar.');
    }
  }

  seleccionarPeriodo(event: Event): void {
    const periodo = (event.target as HTMLSelectElement).value;
    const row = this.rows().find((item) => item.periodo === periodo);
    this.selectedPeriodo.set(periodo);
    this.patchForm(row ?? { ...this.emptyParametro(), periodo });
  }

  nuevoPeriodo(): void {
    const periodo = this.currentPeriodo();
    this.selectedPeriodo.set(periodo);
    this.patchForm({ ...this.emptyParametro(), periodo });
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
      periodo: this.form.controls.periodo.value ?? this.currentPeriodo(),
      gratificacion: this.form.controls.gratificacion.value,
      descuentosBasePorDia: this.form.controls.descuentosBasePorDia.value,
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
      this.successMessage.set(`El periodo ${saved.periodo} quedó actualizado.`);
    } catch {
      this.errorMessage.set('No fue posible guardar los parámetros generales.');
    } finally {
      this.isSaving.set(false);
    }
  }

  showError(controlName: 'periodo'): boolean {
    const control = this.form.controls[controlName];
    return control.invalid && (control.touched || control.dirty);
  }

  tabCount(tabId: ParametrosTabId): number {
    const catalogos = this.catalogos();

    switch (tabId) {
      case 'generales':
        return this.rows().length;
      case 'normativa':
        return this.normativaCoverage().filter((item) => !item.covered).length;
      case 'tramos':
        return catalogos.tramosCarga.length;
      case 'impuestos':
        return catalogos.tablaImpuestoUnico.length + catalogos.tramosImpuesto.length;
      case 'isapres':
        return catalogos.isapres.length;
      case 'afp':
        return catalogos.afp.length;
      case 'reforma':
        return catalogos.reformaPensiones.length + catalogos.reformaPrevisional.length + catalogos.trabajosPesados.length;
      case 'ley16744':
        return catalogos.ley16744Parametros.length + catalogos.organismosLey16744.length;
      case 'ccaf':
        return catalogos.ccafEntidades.length;
      case 'apv':
        return catalogos.apvInstituciones.length + catalogos.apvFormasPago.length;
    }
  }

  private hasDataForActiveTab(): boolean {
    const catalogos = this.catalogos();

    switch (this.activeTab()) {
      case 'generales':
        return this.hasSelectedInRows();
      case 'normativa':
        return this.hasAnySyncedData();
      case 'tramos':
        return catalogos.tramosCarga.length > 0;
      case 'impuestos':
        return catalogos.tablaImpuestoUnico.length > 0 || catalogos.tramosImpuesto.length > 0;
      case 'isapres':
        return catalogos.isapres.length > 0;
      case 'afp':
        return catalogos.afp.length > 0;
      case 'reforma':
        return (
          catalogos.reformaPensiones.length > 0 ||
          catalogos.reformaPrevisional.length > 0 ||
          catalogos.trabajosPesados.length > 0
        );
      case 'ley16744':
        return catalogos.ley16744Parametros.length > 0 || catalogos.organismosLey16744.length > 0;
      case 'ccaf':
        return catalogos.ccafEntidades.length > 0;
      case 'apv':
        return catalogos.apvInstituciones.length > 0 || catalogos.apvFormasPago.length > 0;
    }
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

  entero(value: number | null): string {
    return value === null ? '-' : new Intl.NumberFormat('es-CL', { maximumFractionDigits: 0 }).format(value);
  }

  percent(value: number | null): string {
    return value === null
      ? '-'
      : `${new Intl.NumberFormat('es-CL', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 4,
        }).format(value)}%`;
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

  vigencia(inicio: string | null, fin: string | null): string {
    return `${this.date(inicio)} - ${fin ? this.date(fin) : 'Actual'}`;
  }

  labelParametro(value: string): string {
    return value
      .toLowerCase()
      .split('_')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }

  private patchForm(row: ParametroGeneral): void {
    this.selectedPeriodo.set(row.periodo);
    this.form.reset({
      periodo: row.periodo,
      uf: row.uf,
      utm: row.utm,
      sueldoMinimo: row.sueldoMinimo,
      sueldoMinimo18a65: row.sueldoMinimo18a65,
      gratificacion: row.gratificacion,
      immGratificacion: row.immGratificacion,
      topeAfp: row.topeAfp,
      topeIps: row.topeIps,
      topeCesantia: row.topeCesantia,
      topeAfpVoluntario: row.topeAfpVoluntario,
      sis: row.sis,
      descuentosBasePorDia: row.descuentosBasePorDia,
      afcTrabajadorIndefinido: row.afcTrabajadorIndefinido,
      afcEmpleadorIndefinido: row.afcEmpleadorIndefinido,
      afcEmpleadorPlazo: row.afcEmpleadorPlazo,
      fechaActualizacion: row.fechaActualizacion,
    });
  }

  private emptyParametro(): ParametroGeneral {
    return {
      periodo: this.currentPeriodo(),
      uf: null,
      utm: null,
      sueldoMinimo: null,
      sueldoMinimo18a65: null,
      gratificacion: true,
      immGratificacion: null,
      topeAfp: null,
      topeIps: null,
      topeCesantia: null,
      topeAfpVoluntario: null,
      sis: null,
      descuentosBasePorDia: false,
      afcTrabajadorIndefinido: null,
      afcEmpleadorIndefinido: null,
      afcEmpleadorPlazo: null,
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
    };
  }

  private currentPeriodo(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
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
}

