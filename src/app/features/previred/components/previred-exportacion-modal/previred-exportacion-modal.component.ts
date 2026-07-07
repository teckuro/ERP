import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';

import { MessageBoxComponent } from '../../../../shared/components/ui/feedback/message-box/message-box.component';
import {
  etiquetaVerDetalleConceptos,
  mensajeDetalleConceptosObservacion,
  mensajeModalPreviredExportacion,
  resumenAptitudArchivo105,
  seccionesDetalleConceptosObservacion,
  seccionesModalPreviredExportacion,
  tituloModalPreviredExportacion,
} from '../../presenters/previred-exportacion-modal.presenter';
import { WorkspaceLoadingComponent } from '../../../../shared/components/ui/feedback/workspace-loading/workspace-loading.component';
import { mensajeErrorSupabaseParaUsuario } from '../../../../core/errors/erp-supabase-user-message';
import type {
  PreviredArchivo105Resumen,
  PreviredBorradorExport,
} from '../../models/previred-export.model';
import {
  PreviredExportService,
  descargarArchivo105Previred,
  puedeDescargarArchivo105Previred,
} from '../../services/previred-export.service';

@Component({
  selector: 'app-previred-exportacion-modal',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MessageBoxComponent, WorkspaceLoadingComponent],
  templateUrl: './previred-exportacion-modal.component.html',
  styleUrl: './previred-exportacion-modal.component.css',
})
export class PreviredExportacionModalComponent {
  private readonly service = inject(PreviredExportService);

  readonly abierto = input(false);
  readonly nominaPeriodoId = input<string | null>(null);
  readonly etiquetaNomina = input('');

  readonly cerrar = output<void>();
  readonly descargado = output<void>();

  readonly cargando = signal(false);
  readonly registrando = signal(false);
  readonly errorCarga = signal<string | null>(null);
  readonly avisoFaseBd = signal<string | null>(null);
  readonly borrador = signal<PreviredBorradorExport | null>(null);
  readonly archivo105 = signal<PreviredArchivo105Resumen | null>(null);
  readonly feedbackDescarga = signal<string | null>(null);
  readonly detalleConceptosAbierto = signal(false);

  readonly conceptosObservacion = computed(
    () => this.borrador()?.conceptosObservacion ?? [],
  );

  readonly advertenciasConsolidadas = computed(() => {
    const borrador = this.borrador();
    const archivo = this.archivo105();
    return [...(borrador?.advertencias ?? []), ...(archivo?.advertencias ?? [])];
  });

  readonly resumenAptitud = computed(() =>
    resumenAptitudArchivo105(this.borrador(), this.archivo105()),
  );

  readonly revisionesPrevired = computed(() =>
    this.advertenciasConsolidadas().filter((advertencia) => advertencia.nivel === 'revision'),
  );

  readonly bloqueosPrevired = computed(() =>
    this.advertenciasConsolidadas().filter((advertencia) => advertencia.nivel === 'bloqueo'),
  );

  readonly totalAdvertencias = computed(() => this.advertenciasConsolidadas().length);

  readonly tieneBloqueoExportacion = computed(() =>
    this.advertenciasConsolidadas().some((advertencia) => advertencia.nivel === 'bloqueo'),
  );

  readonly puedeDescargar = computed(() =>
    puedeDescargarArchivo105Previred(this.archivo105()),
  );

  readonly seccionesModal = computed(() =>
    seccionesModalPreviredExportacion({
      borrador: this.borrador(),
      archivo105: this.archivo105(),
      errorCarga: this.errorCarga(),
      avisoFaseBd: this.avisoFaseBd(),
      feedbackDescarga: this.feedbackDescarga(),
      bloqueos: this.bloqueosPrevired(),
      revisiones: this.revisionesPrevired(),
      puedeDescargar: this.puedeDescargar(),
      tieneBloqueo: this.tieneBloqueoExportacion(),
    }),
  );

  readonly tituloModal = computed(() =>
    tituloModalPreviredExportacion({
      errorCarga: this.errorCarga(),
      tieneBloqueo: this.tieneBloqueoExportacion(),
      puedeDescargar: this.puedeDescargar(),
    }),
  );

  readonly mensajeModal = computed(() =>
    mensajeModalPreviredExportacion({
      errorCarga: this.errorCarga(),
      tieneBloqueo: this.tieneBloqueoExportacion(),
      puedeDescargar: this.puedeDescargar(),
      borrador: this.borrador(),
      archivo105: this.archivo105(),
      revisiones: this.revisionesPrevired(),
    }),
  );

  readonly etiquetaDetalleConceptos = computed(() =>
    etiquetaVerDetalleConceptos(this.conceptosObservacion().length),
  );

  readonly seccionesDetalleConceptos = computed(() =>
    seccionesDetalleConceptosObservacion(this.conceptosObservacion()),
  );

  readonly mensajeDetalleConceptos = computed(() =>
    mensajeDetalleConceptosObservacion(this.conceptosObservacion().length),
  );

  readonly variantModal = computed(() => {
    if (this.errorCarga()) return 'danger' as const;
    if (this.tieneBloqueoExportacion()) return 'blocked' as const;
    if (this.puedeDescargar() && this.totalAdvertencias() > 0) return 'decision' as const;
    if (this.puedeDescargar()) return 'success' as const;
    return 'warning' as const;
  });

  constructor() {
    effect(() => {
      const abierto = this.abierto();
      const nominaId = this.nominaPeriodoId();
      if (!abierto || !nominaId) {
        this.limpiarEstado();
        return;
      }
      void this.cargarBorrador(nominaId);
    });
  }

  onCerrar(): void {
    this.detalleConceptosAbierto.set(false);
    this.cerrar.emit();
  }

  onAbrirDetalleConceptos(): void {
    if (this.conceptosObservacion().length) {
      this.detalleConceptosAbierto.set(true);
    }
  }

  onCerrarDetalleConceptos(): void {
    this.detalleConceptosAbierto.set(false);
  }

  onAccionPrincipal(): void {
    if (this.puedeDescargar() && !this.tieneBloqueoExportacion()) {
      void this.confirmarDescarga();
      return;
    }
    this.onCerrar();
  }

  async confirmarDescarga(): Promise<void> {
    const borrador = this.borrador();
    const archivo = this.archivo105();
    if (!borrador || !archivo || !this.puedeDescargar()) return;

    this.registrando.set(true);
    this.feedbackDescarga.set(null);
    try {
      await this.service.registrarDescarga(borrador, 'archivo_oficial_105_posicion', { archivo105: archivo });
      descargarArchivo105Previred(archivo);
      this.descargado.emit();
      this.onCerrar();
    } catch {
      this.feedbackDescarga.set(
        'El archivo se descargó, pero no se pudo registrar la exportación en el servidor.',
      );
      descargarArchivo105Previred(archivo);
      this.descargado.emit();
    } finally {
      this.registrando.set(false);
    }
  }

  private limpiarEstado(): void {
    this.cargando.set(false);
    this.registrando.set(false);
    this.errorCarga.set(null);
    this.avisoFaseBd.set(null);
    this.borrador.set(null);
    this.archivo105.set(null);
    this.feedbackDescarga.set(null);
    this.detalleConceptosAbierto.set(false);
  }

  private async cargarBorrador(nominaPeriodoId: string): Promise<void> {
    this.limpiarEstado();
    this.cargando.set(true);
    try {
      const resultado = await this.service.construirBorradorDesdeNomina(nominaPeriodoId);
      if (!resultado) {
        this.errorCarga.set(
          'No hay liquidación oficial disponible para esta nómina. Genere liquidaciones antes de exportar.',
        );
        return;
      }
      this.borrador.set(resultado.borrador);
      this.archivo105.set(resultado.archivo105);
      this.avisoFaseBd.set(
        resultado.fasePreviredDesplegada
          ? null
          : 'La fase Previred aún no está desplegada en el servidor. El borrador usa mapeo provisional y puede no registrar la exportación.',
      );
    } catch (error) {
      this.errorCarga.set(
        mensajeErrorSupabaseParaUsuario(error, 'preparar el archivo Previred'),
      );
    } finally {
      this.cargando.set(false);
    }
  }
}
