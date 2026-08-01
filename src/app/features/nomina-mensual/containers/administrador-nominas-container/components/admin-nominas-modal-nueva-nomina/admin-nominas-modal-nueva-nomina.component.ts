/**
 * Modal "Nueva nómina" del Administrador (F04 + F05 + BKL-10).
 *
 * Configuración en un solo paso: período y empresa.
 * La previsualización RPC muestra totales y grilla de trabajadores incluidos
 * antes de confirmar la creación.
 */

import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';

import {
  DataGridCellDirective,
  DataGridComponent,
  type DataGridServerQuery,
} from '../../../../../../shared/components/ui/data-grid';
import { MessageBoxComponent } from '../../../../../../shared/components/ui/feedback/message-box/message-box.component';
import { PeriodoMensualInputComponent } from '../../../../../../shared/components/ui/forms/periodo-mensual-input/periodo-mensual-input.component';
import { EmpresaActivaService } from '../../../../../../core/services/empresa-activa.service';
import { mensajeErrorSupabaseParaUsuario } from '../../../../../../core/errors/erp-supabase-user-message';
import { NominaPeriodoService } from '../../../../services/nomina-periodo.service';
import type { NominaPeriodoResumen } from '../../../../models/nomina-periodo.models';
import {
  buscarNominaCoincidenteBandeja,
  construirAvisoNominaExistente,
  etiquetaPeriodoLegible,
} from '../../../../rules/nomina-creacion-ui.rules';
import type {
  ConfirmarCreacionResultado,
  NominaCreatePreview,
  SiguientePasoCreacion,
  TrabajadorIncluidoPreview,
} from '../../../../models/nomina-creacion-preview.models';
import {
  COLUMNAS_PREVIEW_CREACION_TRABAJADORES,
  mapearFilasPreviewCreacion,
  type FilaPreviewCreacionTrabajador,
} from '../../../../presenters/admin-nominas-creacion-preview.presenter';

interface OpcionEmpresa {
  id: string;
  nombre: string;
}

export interface NominaCreadaEvento {
  resumen: NominaPeriodoResumen;
  siguientePaso: SiguientePasoCreacion;
  totalTrabajadoresIniciales: number;
  reutilizada: boolean;
}

function periodoActual(): string {
  const hoy = new Date();
  const anio = hoy.getFullYear();
  const mes = (hoy.getMonth() + 1).toString().padStart(2, '0');
  return `${anio}-${mes}`;
}

function mensajeBloqueoPreview(preview: NominaCreatePreview): string {
  if (preview.totales.conflictos > 0) {
    const primero = preview.conflictos[0]?.motivoHumano;
    return primero
      ? `No se puede crear todavía. ${primero}`
      : 'No se puede crear todavía. Revisa los conflictos del período.';
  }
  return 'Sin trabajadores incluidos. Verifica contratos vigentes y fichas aptas en Empleados.';
}

@Component({
  selector: 'app-admin-nominas-modal-nueva-nomina',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LucideAngularModule,
    MessageBoxComponent,
    PeriodoMensualInputComponent,
    DataGridComponent,
    DataGridCellDirective,
  ],
  templateUrl: './admin-nominas-modal-nueva-nomina.component.html',
  styleUrl: './admin-nominas-modal-nueva-nomina.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class AdminNominasModalNuevaNominaComponent {
  private readonly servicio = inject(NominaPeriodoService);
  private readonly empresaActiva = inject(EmpresaActivaService);

  readonly empresasDisponibles = input<readonly NominaPeriodoResumen[]>([]);
  readonly periodoInicial = input<string | null>(null);
  readonly creada = output<NominaCreadaEvento>();
  readonly cerrar = output<void>();

  readonly columnasPreview = COLUMNAS_PREVIEW_CREACION_TRABAJADORES;
  readonly persistenceKeyPreview = 'admin-nom-creacion-preview-trabajadores';

  readonly periodo = signal(periodoActual());
  readonly empresaId = signal('');
  readonly guardando = signal(false);
  readonly previsualizando = signal(false);
  readonly error = signal<string | null>(null);
  readonly preview = signal<NominaCreatePreview | null>(null);
  readonly filasPreview = signal<FilaPreviewCreacionTrabajador[]>([]);
  readonly totalPreview = signal(0);
  readonly paginaPreview = signal(1);
  readonly pageSizePreview = signal(25);
  readonly busquedaPreview = signal('');
  readonly avisoDescartado = signal(false);

  readonly empresas = computed<OpcionEmpresa[]>(() => {
    const fuente = this.empresasDisponibles();
    const mapa = new Map<string, string>();
    for (const r of fuente) {
      if (!mapa.has(r.empresaId)) {
        mapa.set(r.empresaId, r.empresaNombre);
      }
    }
    const empresaActivaSnap = this.empresaActiva.empresa();
    if (empresaActivaSnap) {
      const id = String(empresaActivaSnap.idEmpresa);
      if (!mapa.has(id)) {
        mapa.set(id, empresaActivaSnap.nombre || empresaActivaSnap.razonSocial);
      }
    }
    return [...mapa.entries()]
      .map(([id, nombre]) => ({ id, nombre }))
      .sort((a, b) => a.nombre.localeCompare(b.nombre));
  });

  readonly periodoEsValido = computed(() => /^\d{4}-(0[1-9]|1[0-2])$/.test(this.periodo()));

  readonly empresaSeleccionadaNombre = computed(() => {
    const id = this.empresaId();
    return this.empresas().find((e) => e.id === id)?.nombre ?? '';
  });

  readonly multiplesEmpresas = computed(() => this.empresas().length > 1);
  readonly empresaContexto = computed(() => this.empresaSeleccionadaNombre());
  readonly etiquetaPeriodo = computed(() => etiquetaPeriodoLegible(this.periodo()));

  readonly puedePrevisualizar = computed(() => {
    return !this.guardando()
      && !this.previsualizando()
      && this.periodoEsValido();
  });

  readonly puedeConfirmar = computed(() => {
    const snap = this.preview();
    return !this.guardando() && !!snap?.puedeCrear && !!snap.fingerprint;
  });

  readonly previewListo = computed(() => {
    const snap = this.preview();
    return snap !== null && snap.puedeCrear;
  });
  readonly previewUsaServidor = computed(() => this.preview()?.detallePaginado === true);

  readonly avisoNominaExistente = computed(() => {
    const fila = buscarNominaCoincidenteBandeja(
      this.empresasDisponibles(),
      this.periodo(),
      this.empresaId(),
      'mensual',
    );
    return fila ? construirAvisoNominaExistente(fila) : null;
  });

  readonly subtituloConfiguracion = computed(() => {
    if (this.periodoEsValido()) {
      return `Período ${etiquetaPeriodoLegible(this.periodo())}. La fecha de pago y el cierre se configuran en la nómina.`;
    }
    return 'Indica el período a procesar. La fecha de pago y el cierre se configuran en la nómina.';
  });

  readonly resumenPreview = computed(() => {
    const snap = this.preview();
    if (!snap) return null;
    return {
      incluidos: snap.totales.incluidos,
      excluidos: snap.totales.excluidos,
      conflictos: snap.totales.conflictos,
    };
  });

  constructor() {
    effect(() => {
      const inicial = this.periodoInicial();
      if (inicial && /^\d{4}-(0[1-9]|1[0-2])$/.test(inicial)) {
        this.periodo.set(inicial);
      }
    }, { allowSignalWrites: true });

    // Empresa puede llegar después (resúmenes / JWT). Sin esto el botón queda
    // deshabilitado para siempre si el constructor corrió con lista vacía.
    effect(() => {
      const list = this.empresas();
      if (list.length === 0) {
        return;
      }
      const actual = this.empresaId();
      if (!actual || !list.some((e) => e.id === actual)) {
        this.empresaId.set(list[0].id);
      }
    }, { allowSignalWrites: true });

    effect(() => {
      this.periodo();
      this.empresaId();
      this.invalidarPreview();
      this.avisoDescartado.set(false);
    }, { allowSignalWrites: true });

    const primera = this.empresas()[0];
    if (primera) {
      this.empresaId.set(primera.id);
    }
  }

  setPeriodo(valor: string): void {
    this.periodo.set(valor);
  }

  setEmpresa(valor: string): void {
    this.empresaId.set(valor);
  }

  cerrarModal(): void {
    if (this.guardando()) return;
    this.cerrar.emit();
  }

  cerrarError(): void {
    this.error.set(null);
  }

  descartarAvisoExistente(): void {
    this.avisoDescartado.set(true);
  }

  onEscape(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.cerrarModal();
    }
  }

  trackFilaPreview = (_index: number, fila: FilaPreviewCreacionTrabajador): string => fila.id;

  private invalidarPreview(): void {
    this.preview.set(null);
    this.filasPreview.set([]);
    this.totalPreview.set(0);
    this.paginaPreview.set(1);
    this.busquedaPreview.set('');
    this.error.set(null);
  }

  async previsualizarDotacion(): Promise<void> {
    if (!this.puedePrevisualizar()) return;
    this.previsualizando.set(true);
    this.error.set(null);
    try {
      await this.empresaActiva.asegurarCargada();
      const resultado = await this.servicio.previsualizarCreacion({
        periodo: this.periodo(),
        tipo: 'mensual',
        codigoCiclo: null,
      });
      if (!resultado.puedeCrear) {
        this.preview.set(null);
        this.filasPreview.set([]);
        this.totalPreview.set(0);
        this.error.set(mensajeBloqueoPreview(resultado));
        return;
      }
      this.preview.set(resultado);
      try {
        await this.cargarFilasPreview(resultado, 1, this.pageSizePreview(), '');
      } catch (errFilas) {
        // Mantener el resumen del preview; el detalle es secundario.
        this.filasPreview.set([]);
        this.totalPreview.set(resultado.totales.incluidos);
        this.error.set(mensajeErrorSupabaseParaUsuario(errFilas, 'cargar trabajadores del preview'));
      }
    } catch (err) {
      this.preview.set(null);
      this.filasPreview.set([]);
      this.totalPreview.set(0);
      this.error.set(mensajeErrorSupabaseParaUsuario(err, 'previsualizar la dotación'));
    } finally {
      this.previsualizando.set(false);
    }
  }

  async manejarConsultaPreview(consulta: DataGridServerQuery): Promise<void> {
    const snap = this.preview();
    if (!snap?.detallePaginado) return;
    this.paginaPreview.set(consulta.page);
    this.pageSizePreview.set(consulta.pageSize);
    const busqueda = String(consulta.filterValues?.['busqueda'] ?? '').trim();
    this.busquedaPreview.set(busqueda);
    await this.cargarFilasPreview(snap, consulta.page, consulta.pageSize, busqueda);
  }

  private async cargarFilasPreview(
    snap: NominaCreatePreview,
    page: number,
    pageSize: number,
    busqueda: string,
  ): Promise<void> {
    if (snap.detallePaginado) {
      const pagina = await this.servicio.listarPreviewCreacionTrabajadores(
        this.periodo(),
        'mensual',
        'incluidos',
        { page, pageSize, total: 0 },
        busqueda || undefined,
        snap.codigoCiclo ?? null,
      );
      this.filasPreview.set(mapearFilasPreviewCreacion(pagina.filas as TrabajadorIncluidoPreview[]));
      this.totalPreview.set(pagina.total);
      return;
    }

    const filas = mapearFilasPreviewCreacion(snap.incluidos);
    const termino = busqueda.trim().toLowerCase();
    const filtradas = termino
      ? filas.filter((fila) =>
          [fila.rut, fila.nombre, fila.cargo ?? ''].join(' ').toLowerCase().includes(termino),
        )
      : filas;
    const inicio = Math.max(0, (page - 1) * pageSize);
    this.filasPreview.set(filtradas.slice(inicio, inicio + pageSize));
    this.totalPreview.set(filtradas.length);
  }

  async crearNomina(): Promise<void> {
    if (!this.puedeConfirmar()) return;
    const snap = this.preview();
    if (!snap) return;

    this.guardando.set(true);
    this.error.set(null);
    try {
      const resultado: ConfirmarCreacionResultado = await this.servicio.confirmarCreacion({
        periodo: this.periodo(),
        tipo: 'mensual',
        fingerprint: snap.fingerprint,
        codigoCiclo: snap.codigoCiclo ?? null,
      });

      let resumen = resultado.idNominaPeriodo
        ? await this.servicio.obtenerCabeceraNomina(resultado.idNominaPeriodo)
        : null;
      if (!resumen) {
        const resumenes = await this.servicio.listarResumenes();
        resumen = resumenes.find(
          (r) => r.id === resultado.idNominaPeriodo
            || (r.periodo === this.periodo() && r.tipo === 'mensual'),
        ) ?? null;
      }
      if (!resumen) {
        throw new Error('No fue posible recuperar la nómina recién creada.');
      }
      this.creada.emit({
        resumen,
        siguientePaso: resultado.siguientePaso,
        totalTrabajadoresIniciales: resultado.totalTrabajadores,
        reutilizada: resultado.reutilizada,
      });
    } catch (err) {
      this.error.set(mensajeErrorSupabaseParaUsuario(err, 'crear la nómina'));
    } finally {
      this.guardando.set(false);
    }
  }
}
