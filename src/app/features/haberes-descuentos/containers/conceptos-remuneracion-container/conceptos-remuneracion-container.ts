import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { Edit, Eye } from 'lucide-angular/src/icons';

import {
  DataGridCellDirective,
  DataGridColumn,
  DataGridComponent,
  DataGridFilter,
} from '../../../../shared/components/ui/data-grid';
import { MessageBoxComponent, MessageBoxVariant } from '../../../../shared/components/ui/feedback/message-box/message-box.component';
import { SearchSelectComponent, SearchSelectOption } from '../../../../shared/components/ui/forms/search-select.component';
import { ErpPermisosRemuneracionesService } from '../../../../core/auth/erp-permisos-remuneraciones.service';
import { HaberesDescuentosService } from '../../services/haberes-descuentos.service';
import {
  CatalogoLreOpcion,
  ConceptoMantenimientoFila,
  ConceptoMantenimientoPayload,
  ReglaConceptoCalculoFila,
} from '../../models/haber-descuento-asignacion.model';
import {
  clasificarVigenciaConcepto,
  esConceptoAsignable,
  etiquetaVigenciaConcepto,
  motivosNoAsignableConcepto,
  resumenAsignabilidadConcepto,
  type VigenciaConceptoPeriodo,
} from '../../rules/concepto-asignabilidad.rules';
import {
  evaluarConceptoAccionesPermitidas,
  tituloAccionConcepto,
  type ConceptoAccionesPermitidas,
} from '../../rules/concepto-acciones.rules';

type CatalogoGridRow = ConceptoMantenimientoFila & {
  busquedaCatalogo: string;
  /** Vigencia respecto a la fecha de referencia del listado (filtro). */
  filtroVigenciaPeriodo: VigenciaConceptoPeriodo;
  filtroAsignable: 'SI' | 'NO';
  filtroOrigen: 'SISTEMA' | 'USUARIO';
  filtroLre: 'CON' | 'SIN';
  esAsignableCatalogo: boolean;
};

function etiquetaTipoConcepto(tipo: string | null): string {
  if (tipo === 'HABER') {
    return 'Haber';
  }
  if (tipo === 'DESCUENTO') {
    return 'Descuento';
  }
  if (tipo === 'APORTE_EMPLEADOR') {
    return 'Aporte empleador';
  }
  return tipo?.trim() ? tipo : '—';
}

function etiquetaNaturalezaFn(n: string | null): string {
  if (n === 'IMPONIBLE') {
    return 'Imponible';
  }
  if (n === 'NO_IMPONIBLE') {
    return 'No imponible';
  }
  return n?.trim() ? n : '—';
}

@Component({
  selector: 'app-conceptos-remuneracion-container',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LucideAngularModule,
    DataGridComponent,
    DataGridCellDirective,
    MessageBoxComponent,
    SearchSelectComponent,
  ],
  templateUrl: './conceptos-remuneracion-container.html',
  styleUrl: './conceptos-remuneracion-container.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConceptosRemuneracionContainer implements OnInit {
  private readonly haberesDescuentosService = inject(HaberesDescuentosService);
  private readonly permisosRemuneraciones = inject(ErpPermisosRemuneracionesService);

  readonly editIcon = Edit;
  readonly eyeIcon = Eye;

  readonly catalogLoading = signal(false);
  /** Fecha civil de referencia para vigencia y asignable (hoy). */
  private readonly fechaReferenciaListado = (): Date => new Date();

  readonly catalogoFilas = signal<CatalogoGridRow[]>([]);
  readonly catalogoLreOpciones = signal<CatalogoLreOpcion[]>([]);
  readonly catalogoLreSearchOptions = signal<SearchSelectOption<number>[]>([]);

  readonly catalogDialogAbierto = signal(false);
  readonly catalogEditId = signal<number | null>(null);
  readonly catalogRowSnapshot = signal<ConceptoMantenimientoFila | null>(null);
  readonly catCodigo = signal('');
  readonly catCodigoMotor = signal('');
  readonly catNombre = signal('');
  readonly catTipo = signal<'HABER' | 'DESCUENTO' | 'APORTE_EMPLEADOR'>('HABER');
  readonly catNaturaleza = signal<string | null>('IMPONIBLE');
  readonly catIdCatalogoLre = signal<number | null>(null);
  readonly catImponible = signal(true);
  readonly catTributable = signal(true);
  readonly catAfectaAfp = signal(true);
  readonly catAfectaSalud = signal(true);
  readonly catAfectaAfc = signal(true);
  readonly catAfectaSis = signal(false);
  readonly catAfectaLiquido = signal(true);
  readonly catVigente = signal(true);
  readonly catVigenciaInicio = signal<string>('');
  readonly catVigenciaFin = signal<string>('');
  readonly catOrdenImpresion = signal(100);
  readonly catCalculoAutomatico = signal(false);

  /** Detalle 9.2B (modal de solo lectura). */
  readonly detalleConceptoFila = signal<CatalogoGridRow | null>(null);
  readonly reglasCalculoDetalle = signal<ReglaConceptoCalculoFila[]>([]);
  readonly cargandoReglasDetalle = signal(false);

  readonly modalMsg = signal<{
    variant: MessageBoxVariant;
    title: string;
    message: string;
    detail?: string;
  } | null>(null);

  readonly lreCatalogoSeleccionado = computed(() => {
    const id = this.catIdCatalogoLre();
    if (id == null) {
      return null;
    }
    return this.catalogoLreOpciones().find((o) => o.idCatalogoLre === id) ?? null;
  });

  readonly detalleAcciones = computed((): ConceptoAccionesPermitidas | null => {
    const r = this.detalleConceptoFila();
    return r ? this.accionesConcepto(r) : null;
  });

  readonly puedeEditarConceptoCatalogo = computed(
    () => this.permisosRemuneraciones.esAdministradorRemuneraciones(),
  );

  private opcionesAccionesConcepto() {
    return {
      puedeEditarModoAdmin: this.puedeEditarConceptoCatalogo(),
      esAdministrador: this.permisosRemuneraciones.esAdministradorRemuneraciones(),
    };
  }

  readonly catalogColumns: DataGridColumn<CatalogoGridRow>[] = [
    {
      id: 'nombre',
      header: 'Nombre',
      field: 'nombre',
      type: 'text',
      sortable: true,
      priorityResponsive: 'primary',
      filterable: false,
    },
    {
      id: 'codigo',
      header: 'Código',
      field: 'codigo',
      type: 'text',
      sortable: true,
      priorityResponsive: 'primary',
      filterable: false,
    },
    {
      id: 'tipo',
      header: 'Tipo',
      field: 'tipo',
      type: 'text',
      sortable: true,
      filterable: false,
    },
    {
      id: 'lreCelda',
      header: 'LRE',
      field: 'busquedaCatalogo',
      type: 'text',
      sortable: false,
      filterable: false,
    },
    {
      id: 'vigenciaPeriodo',
      header: 'Vigencia',
      field: 'filtroVigenciaPeriodo',
      type: 'text',
      sortable: true,
      filterable: false,
    },
    {
      id: 'origenCatalogo',
      header: 'Origen',
      field: 'filtroOrigen',
      type: 'text',
      sortable: true,
      filterable: false,
    },
    {
      id: 'calculoAutomatico',
      header: 'Cálculo',
      field: 'calculoAutomatico',
      type: 'text',
      sortable: true,
      filterable: false,
    },
    {
      id: 'asignable',
      header: 'Asignable',
      field: 'filtroAsignable',
      type: 'text',
      sortable: true,
      filterable: false,
    },
    {
      id: 'acciones',
      header: 'Acciones',
      align: 'center',
      sortable: false,
      hideable: false,
    },
  ];

  readonly catalogFilters: DataGridFilter<CatalogoGridRow>[] = [
    {
      id: 'busquedaCatalogo',
      label: 'Buscar',
      field: 'busquedaCatalogo',
      type: 'text',
      operator: 'contains',
      placeholder: 'Nombre, códigos o LRE',
    },
    {
      id: 'tipo',
      label: 'Tipo',
      field: 'tipo',
      type: 'select',
      operator: 'equals',
      emptyLabel: 'Todos',
      options: [
        { label: 'Haber', value: 'HABER' },
        { label: 'Descuento', value: 'DESCUENTO' },
        { label: 'Aporte empleador', value: 'APORTE_EMPLEADOR' },
      ],
    },
    {
      id: 'filtroVigenciaPeriodo',
      label: 'Vigencia',
      field: 'filtroVigenciaPeriodo',
      type: 'select',
      operator: 'equals',
      emptyLabel: 'Todos',
      options: [
        { label: 'Vigente (período)', value: 'VIGENTE_PERIODO' },
        { label: 'Sin fechas', value: 'SIN_FECHAS' },
        { label: 'Futuro', value: 'FUTURO' },
        { label: 'Vencido', value: 'VENCIDO' },
        { label: 'No vigente (catálogo)', value: 'NO_OPERATIVO' },
      ],
    },
    {
      id: 'filtroAsignable',
      label: 'Asignable',
      field: 'filtroAsignable',
      type: 'select',
      operator: 'equals',
      emptyLabel: 'Todos',
      options: [
        { label: 'Sí', value: 'SI' },
        { label: 'No', value: 'NO' },
      ],
    },
    {
      id: 'filtroOrigen',
      label: 'Origen',
      field: 'filtroOrigen',
      type: 'select',
      operator: 'equals',
      emptyLabel: 'Todos',
      options: [
        { label: 'Sistema', value: 'SISTEMA' },
        { label: 'Usuario', value: 'USUARIO' },
      ],
    },
    {
      id: 'filtroLre',
      label: 'LRE',
      field: 'filtroLre',
      type: 'select',
      operator: 'equals',
      emptyLabel: 'Todos',
      options: [
        { label: 'Con LRE', value: 'CON' },
        { label: 'Sin LRE', value: 'SIN' },
      ],
    },
  ];

  readonly trackCatalogo = (_i: number, row: CatalogoGridRow): number => row.idConcepto;

  etiquetaTipo = etiquetaTipoConcepto;
  etiquetaNaturaleza = etiquetaNaturalezaFn;

  ngOnInit(): void {
    void this.cargarCatalogoLre();
    void this.cargarCatalogo();
  }

  async refrescar(): Promise<void> {
    await this.cargarCatalogoLre();
    await this.cargarCatalogo();
  }

  async cargarCatalogoLre(): Promise<void> {
    try {
      const opts = await this.haberesDescuentosService.listarCatalogoLre();
      this.catalogoLreOpciones.set(opts);
      this.catalogoLreSearchOptions.set(
        opts.map((o) => ({
          value: o.idCatalogoLre,
          label: `${o.codigoLre} — ${o.nombreLre}`,
          description: o.moduloLre,
        })),
      );
    } catch {
      this.catalogoLreOpciones.set([]);
      this.catalogoLreSearchOptions.set([]);
    }
  }

  async cargarCatalogo(): Promise<void> {
    this.catalogLoading.set(true);
    try {
      const rows = await this.haberesDescuentosService.listarConceptosMantenimiento();
      const ref = this.fechaReferenciaListado();
      this.catalogoFilas.set(
        rows.map((r) => {
          const periodo = clasificarVigenciaConcepto(r, ref);
          const asignable = esConceptoAsignable(r, ref);
          return {
            ...r,
            filtroVigenciaPeriodo: periodo,
            filtroAsignable: asignable ? 'SI' : 'NO',
            filtroOrigen: r.esSistema ? 'SISTEMA' : 'USUARIO',
            filtroLre: r.idCatalogoLre == null ? 'SIN' : 'CON',
            esAsignableCatalogo: asignable,
            busquedaCatalogo: [r.nombre, r.codigo, r.codigoMotor ?? '', r.codigoLre ?? '', r.nombreLre ?? '']
              .join(' ')
              .toLowerCase(),
          };
        }),
      );
    } finally {
      this.catalogLoading.set(false);
    }
  }

  etiquetaVigenciaChip(row: CatalogoGridRow): string {
    return etiquetaVigenciaConcepto(row.filtroVigenciaPeriodo);
  }

  accionesConcepto(row: CatalogoGridRow): ConceptoAccionesPermitidas {
    return evaluarConceptoAccionesPermitidas(row, this.fechaReferenciaListado(), this.opcionesAccionesConcepto());
  }

  tituloAccion(row: CatalogoGridRow, accion: 'editar' | 'eliminar'): string {
    return tituloAccionConcepto(this.accionesConcepto(row), accion);
  }

  motivosNoAsignableDetalle(row: CatalogoGridRow): string[] {
    return motivosNoAsignableConcepto(row, this.fechaReferenciaListado());
  }

  resumenAsignacionDetalle(row: CatalogoGridRow): string {
    return resumenAsignabilidadConcepto(row, this.fechaReferenciaListado());
  }

  revisarConceptoRow(row: CatalogoGridRow): void {
    this.detalleConceptoFila.set(row);
    this.reglasCalculoDetalle.set([]);
    this.cargandoReglasDetalle.set(true);
    void this.haberesDescuentosService.listarReglasCalculoConcepto(row.idConcepto)
      .then((reglas) => this.reglasCalculoDetalle.set(reglas))
      .catch(() => this.reglasCalculoDetalle.set([]))
      .finally(() => this.cargandoReglasDetalle.set(false));
  }

  cerrarDetalleConcepto(): void {
    this.detalleConceptoFila.set(null);
    this.reglasCalculoDetalle.set([]);
  }

  onCatLreChange(id: number | null): void {
    this.catIdCatalogoLre.set(id);
  }

  onCatTipoChange(raw: string): void {
    const t = raw as 'HABER' | 'DESCUENTO' | 'APORTE_EMPLEADOR';
    this.catTipo.set(t);
    if (t === 'APORTE_EMPLEADOR') {
      this.catNaturaleza.set('NO_IMPONIBLE');
      this.catImponible.set(false);
      this.catTributable.set(false);
      this.catAfectaAfp.set(false);
      this.catAfectaSalud.set(false);
      this.catAfectaAfc.set(false);
      this.catAfectaSis.set(false);
    }
  }

  abrirNuevoConcepto(): void {
    this.modalMsg.set({
      variant: 'info',
      title: 'Alta no disponible',
      message:
        'El alta de conceptos no está habilitada en esta fase del producto. Se prioriza trazabilidad del catálogo y alineación de perfiles.',
    });
  }

  editarConceptoRow(row: CatalogoGridRow): void {
    const acc = this.accionesConcepto(row);
    if (!acc.puedeEditar) {
      this.modalMsg.set({
        variant: 'warning',
        title: 'Edición no disponible',
        message: acc.motivosBloqueo[0] ?? 'No puede editarse este concepto con el perfil actual.',
      });
      return;
    }
    this.catalogEditId.set(row.idConcepto);
    this.catalogRowSnapshot.set(row);
    this.catCodigo.set(row.codigo);
    this.catCodigoMotor.set(row.codigoMotor ?? '');
    this.catNombre.set(row.nombre);
    this.catTipo.set((row.tipo as 'HABER' | 'DESCUENTO' | 'APORTE_EMPLEADOR') ?? 'HABER');
    this.catNaturaleza.set(row.naturaleza);
    this.catIdCatalogoLre.set(row.idCatalogoLre);
    this.catImponible.set(row.imponible);
    this.catTributable.set(row.tributable);
    this.catAfectaAfp.set(row.afectaAfp);
    this.catAfectaSalud.set(row.afectaSalud);
    this.catAfectaAfc.set(row.afectaAfc);
    this.catAfectaSis.set(row.afectaSis);
    this.catAfectaLiquido.set(row.afectaLiquido);
    this.catVigente.set(row.vigente);
    this.catVigenciaInicio.set(row.vigenciaInicio?.slice(0, 10) ?? '');
    this.catVigenciaFin.set(row.vigenciaFin?.slice(0, 10) ?? '');
    this.catOrdenImpresion.set(row.ordenImpresion);
    this.catCalculoAutomatico.set(row.calculoAutomatico);
    this.catalogDialogAbierto.set(true);
  }

  cerrarCatalogDialog(): void {
    this.catalogDialogAbierto.set(false);
  }

  pedirEliminarConcepto(_row: CatalogoGridRow): void {
    this.modalMsg.set({
      variant: 'info',
      title: 'Eliminación no disponible',
      message:
        'La eliminación desde el listado no está habilitada en esta fase. Prefiera desactivar el concepto o cerrar su vigencia cuando el flujo esté disponible en catálogo.',
    });
  }

  private armarPayloadConcepto(): ConceptoMantenimientoPayload {
    const tipo = this.catTipo();
    let naturaleza = this.catNaturaleza();
    if (tipo === 'APORTE_EMPLEADOR') {
      naturaleza = 'NO_IMPONIBLE';
    }
    const calculoAutomatico = this.catCalculoAutomatico();

    return {
      codigo: this.catCodigo().trim(),
      codigoMotor: this.catCodigoMotor().trim() || null,
      nombre: this.catNombre().trim(),
      tipo,
      naturaleza,
      idCatalogoLre: this.catIdCatalogoLre(),
      imponible: this.catImponible(),
      tributable: this.catTributable(),
      afectaAfp: this.catAfectaAfp(),
      afectaSalud: this.catAfectaSalud(),
      afectaAfc: this.catAfectaAfc(),
      afectaSis: this.catAfectaSis(),
      afectaLiquido: this.catAfectaLiquido(),
      vigente: this.catVigente(),
      vigenciaInicio: this.catVigenciaInicio().trim() || null,
      vigenciaFin: this.catVigenciaFin().trim() || null,
      ordenImpresion: Math.max(0, Math.round(Number(this.catOrdenImpresion()))),
      calculoAutomatico,
    };
  }

  async guardarCatalogDialog(): Promise<void> {
    const editId = this.catalogEditId();
    if (!this.catCodigo().trim() || !this.catNombre().trim()) {
      this.mostrarErrorValidacion('Código y nombre son obligatorios.');
      return;
    }
    const snap = this.catalogRowSnapshot();
    if (
      snap?.calculoAutomatico &&
      !this.puedeEditarConceptoCatalogo &&
      this.catCalculoAutomatico() !== snap.calculoAutomatico
    ) {
      this.mostrarErrorValidacion('No puede modificarse el modo de cálculo de este concepto.');
      return;
    }
    if (this.catVigenciaInicio().trim() && this.catVigenciaFin().trim()) {
      if (this.catVigenciaFin().trim() < this.catVigenciaInicio().trim()) {
        this.mostrarErrorValidacion('La vigencia fin debe ser mayor o igual a la vigencia inicio.');
        return;
      }
    }
    const payload = this.armarPayloadConcepto();
    try {
      if (editId == null) {
        await this.haberesDescuentosService.crearConcepto(payload);
        this.modalMsg.set({
          variant: 'success',
          title: 'Concepto creado',
          message: 'El concepto fue registrado correctamente.',
          detail: payload.nombre,
        });
      } else {
        await this.haberesDescuentosService.actualizarConcepto(editId, payload);
        this.modalMsg.set({
          variant: 'success',
          title: 'Concepto actualizado',
          message: 'Los cambios fueron guardados correctamente.',
          detail: payload.nombre,
        });
      }
      this.catalogDialogAbierto.set(false);
      await this.cargarCatalogo();
    } catch (err) {
      const detalle =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message?: unknown }).message ?? '')
          : '';
      this.modalMsg.set({
        variant: 'error',
        title: 'No se pudo guardar',
        message: 'Ocurrió un problema al guardar el concepto.',
        detail: detalle,
      });
    }
  }

  cerrarModalMsg(): void {
    this.modalMsg.set(null);
  }

  private mostrarErrorValidacion(detail: string): void {
    this.modalMsg.set({
      variant: 'warning',
      title: 'Datos incompletos',
      message: detail,
    });
  }

  formatFechaDetalle(value: unknown): string {
    return this.formatDate(value);
  }

  private formatDate(value: unknown): string {
    if (value == null || value === '') {
      return '—';
    }
    const date = new Date(`${String(value).slice(0, 10)}T00:00:00`);
    if (!Number.isFinite(date.getTime())) {
      return String(value);
    }
    return new Intl.DateTimeFormat('es-CL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
      .format(date)
      .replaceAll('/', '-');
  }
}
