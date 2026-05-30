import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  EventEmitter,
  OnInit,
  Output,
  computed,
  ViewEncapsulation,
  effect,
  inject,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';

import { MessageBoxComponent } from '../../../../../../shared/components/ui/feedback/message-box/message-box.component';
import type { PayrollStepId } from '../../../../models/nomina-mensual-v2.models';
import type { OrigenBaseParametrosAlAvanzar } from '../../../../models/nomina-parametros-base.models';
import type {
  NominaParametrosResumen,
  ParametroBloqueoSeveridad,
  ParametroResumenAreaId,
  ParametroResumenItem,
  ParametroResumenEstado,
  ParametroResumenItemEstado,
  ParametrosMantenedorDestino,
} from '../../../../models/nomina-parametros-resumen.models';
import { NominaParametrosBaseService } from '../../../../services/nomina-parametros-base.service';
import { NominaParametrosResumenService } from '../../../../services/nomina-parametros-resumen.service';
import { NominaMensualV2TrazabilidadService } from '../../../../services/nomina-mensual-v2-trazabilidad.service';
import { debeInvalidarPorRevalidacionParametros } from '../../../../rules/nomina-trazabilidad-invalidacion.rules';
import { NominaMensualV2OrquestadorPort } from '../../facade/nomina-mensual-v2-orquestador.port';
type DonutTonoPresentacion = 'exito' | 'revision' | 'bloqueo' | 'neutral';

type ParametrosCargaOverlayPresentacion = {
  titulo: string;
  mensaje: string;
};

type ResultadoValidacionPaso = 'permitido' | 'advertencia' | 'bloqueado';

interface EstadoPendientesPasoParametros {
  tieneBloqueos: boolean;
  tieneRevisiones: boolean;
  puedeContinuar: boolean;
  resultado: ResultadoValidacionPaso;
}

const coloresDonutPorTono: Record<DonutTonoPresentacion, string> = {
  exito: '#3d6b4f',
  revision: '#d97706',
  bloqueo: '#9a5555',
  neutral: '#64748b',
};

@Component({
  selector: 'app-nomina-mensual-v2-paso-parametros',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, MessageBoxComponent],
  templateUrl: './nomina-mensual-v2-paso-parametros.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class NominaMensualV2PasoParametrosComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly orquestador = inject(NominaMensualV2OrquestadorPort);
  private readonly parametrosResumenService = inject(NominaParametrosResumenService);
  private readonly parametrosBaseService = inject(NominaParametrosBaseService);
  private readonly trazabilidadService = inject(NominaMensualV2TrazabilidadService);

  @Output() avanceSolicitado = new EventEmitter<PayrollStepId>();
  @Output() resumenActualizado = new EventEmitter<void>();

  readonly parametrosResumen = signal<NominaParametrosResumen | null>(null);
  readonly parametrosLoading = signal(true);
  readonly parametrosValidando = signal(false);
  readonly parametrosError = signal<string | null>(null);
  readonly parametrosAreas = computed(() => this.parametrosResumen()?.areas ?? []);
  readonly parametrosBloqueosActuales = computed(() => this.parametrosResumen()?.bloqueosActuales ?? []);
  readonly parametrosPendientesSidebar = computed(() => {
    const resumen = this.parametrosResumen();
    const pendientes = resumen?.bloqueosActuales ?? [];
    if ((resumen?.bloqueos ?? 0) > 0) {
      return pendientes.filter((item) => item.severidad === 'bloqueo');
    }
    return pendientes.filter((item) => item.severidad === 'revision');
  });
  readonly parametrosAccesos = computed(() => this.parametrosResumen()?.accesos ?? []);

  readonly estadoBase = computed(() => this.orquestador.estadoParametrosBase());
  readonly hayDiferenciasBase = computed(() => this.estadoBase()?.comparacion?.hayDiferencias ?? false);
  readonly fechaBaseGuardadaTexto = computed(() =>
    this.formatoHoraActualizacion(this.estadoBase()?.fechaBaseGuardada),
  );
  readonly muestraLineaBaseGuardada = computed(() => !!this.estadoBase()?.idCalculoPeriodoBase);

  readonly parametrosCargaOverlay = computed((): ParametrosCargaOverlayPresentacion | null => {
    if (this.parametrosLoading()) {
      return {
        titulo: 'Cargando parámetros',
        mensaje: 'Consultando la configuración normativa y operativa del período.',
      };
    }
    if (this.parametrosValidando()) {
      return {
        titulo: 'Preparando nómina',
        mensaje: 'Revisando parámetros y base guardada antes de continuar.',
      };
    }
    return null;
  });

  readonly parametrosAlertaTipo = computed((): 'error' | 'bloqueo' | 'revision' | 'diferencias' | null => {
    if (this.parametrosLoading()) return null;
    if (this.parametrosError()) return 'error';
    if (this.hayDiferenciasBase()) return 'diferencias';
    const resumen = this.parametrosResumen();
    if (!resumen) return null;
    if (resumen.bloqueos > 0) return 'revision';
    if (resumen.requiereRevision > 0) return 'revision';
    return null;
  });

  readonly alertaRevisionTitulo = computed(() => {
    const resumen = this.parametrosResumen();
    const bloqueos = resumen?.bloqueos ?? 0;
    if (bloqueos > 0) {
      const etiquetaItem = bloqueos === 1 ? 'parámetro obligatorio pendiente' : 'parámetros obligatorios pendientes';
      return `Hay ${bloqueos} ${etiquetaItem}`;
    }
    const cantidad = resumen?.requiereRevision ?? 0;
    const etiquetaItem = cantidad === 1 ? 'ítem' : 'ítems';
    const etiquetaVerbo = cantidad === 1 ? 'requiere' : 'requieren';
    return `Hay ${cantidad} ${etiquetaItem} que ${etiquetaVerbo} revisión`;
  });

  readonly alertaRevisionDescripcion = computed(() => {
    const resumen = this.parametrosResumen();
    if ((resumen?.bloqueos ?? 0) > 0) {
      return 'Puedes usar «Preparar nómina» para congelar la base actual o corregirlos en Parámetros.';
    }
    const cantidad = resumen?.requiereRevision ?? 0;
    if (cantidad === 0) return '';
    return 'Puedes usar «Preparar nómina» igual; el cálculo validará más adelante.';
  });

  readonly alertaBloqueoTitulo = computed(() => {
    const cantidad = this.parametrosResumen()?.bloqueos ?? 0;
    const etiquetaItem = cantidad === 1
      ? 'parámetro obligatorio pendiente'
      : 'parámetros obligatorios pendientes';
    return `Hay ${cantidad} ${etiquetaItem}`;
  });

  readonly alertaBloqueoDescripcion = computed(() => {
    const cantidad = this.parametrosResumen()?.bloqueos ?? 0;
    const etiquetaAccion = cantidad === 1 ? 'Corrígelo' : 'Corrígelos';
    return `${etiquetaAccion} en Parámetros o usa «Preparar nómina» para congelar la base actual.`;
  });

  readonly tituloEstadoParametros = computed(() => {
    const resumen = this.parametrosResumen();
    if ((resumen?.bloqueos ?? 0) > 0) {
      return 'Bloqueos actuales';
    }
    if ((resumen?.requiereRevision ?? 0) > 0) {
      return 'Revisiones pendientes';
    }
    return 'Estado actual';
  });

  readonly parametrosEstadoCompleto = computed(() => {
    if (this.parametrosLoading() || this.parametrosValidando()) return false;
    const resumen = this.parametrosResumen();
    if (!resumen) return false;
    return resumen.bloqueos === 0 && resumen.requiereRevision === 0;
  });

  readonly donutTono = computed((): DonutTonoPresentacion => {
    if (this.parametrosLoading()) return 'neutral';
    const resumen = this.parametrosResumen();
    if (!resumen) return 'neutral';
    if (resumen.bloqueos > 0) return 'bloqueo';
    if (resumen.requiereRevision > 0) return 'revision';
    return 'exito';
  });

  readonly completitudSeccionesPct = computed(() => {
    const resumen = this.parametrosResumen();
    if (!resumen) return 0;
    return resumen.completitudSecciones;
  });

  readonly completitudSeccionesCaption = computed(() => {
    const resumen = this.parametrosResumen();
    if (!resumen) return '0 de 0 secciones listas';
    return `${resumen.seccionesListas} de ${resumen.seccionesTotales} secciones listas`;
  });

  readonly estiloArcoDonut = computed(() => {
    const porcentaje = this.completitudSeccionesPct();
    const color = coloresDonutPorTono[this.donutTono()];
    return `conic-gradient(${color} 0 ${porcentaje}%, #e2e8f0 ${porcentaje}% 100%)`;
  });

  constructor() {
    effect(() => {
      if (this.parametrosLoading() || this.parametrosValidando()) {
        this.orquestador.establecerAyudaAvance(null);
        return;
      }
      const resumen = this.parametrosResumen();
      if (!resumen) {
        this.orquestador.establecerAyudaAvance(null);
        return;
      }
      if (resumen.bloqueos > 0) {
        this.orquestador.establecerAyudaAvance(
          'Hay parámetros obligatorios pendientes. Usa «Preparar nómina» para congelar la base o corrígelos en Parámetros.',
          'revision',
        );
        return;
      }
      if (resumen.requiereRevision > 0) {
        this.orquestador.establecerAyudaAvance('Hay observaciones pendientes. Revísalas antes de continuar.', 'revision');
        return;
      }
      this.orquestador.establecerAyudaAvance(null);
    });
  }

  ngOnInit(): void {
    this.orquestador.registrarAccionPrincipal(() => void this.prepararNomina());
    this.destroyRef.onDestroy(() => {
      this.orquestador.limpiarAccionPrincipal();
      this.orquestador.establecerAyudaAvance(null);
    });
    void this.cargarParametrosResumen();
  }

  evaluarAvance(destinoPaso: PayrollStepId): void {
    const estado = this.obtenerEstadoPendientesPasoParametros();
    if (estado.resultado === 'bloqueado') {
      const resumen = this.parametrosResumen();
      this.orquestador.modalAvanceParametros.set({
        tipo: 'bloqueo',
        pendientes: (resumen?.bloqueosActuales ?? [])
          .filter((item) => item.severidad === 'bloqueo')
          .map((item) => `${item.titulo}: ${item.detalle ?? 'Pendiente'}`),
      });
      return;
    }
    if (estado.resultado === 'advertencia') {
      this.orquestador.modalAvanceParametros.set({ tipo: 'revision', destinoPaso });
      return;
    }
    this.orquestador.modalAvanceParametros.set(null);
    this.avanceSolicitado.emit(destinoPaso);
  }

  confirmarAvanceConRevision(): void {
    const modal = this.orquestador.modalAvanceParametros();
    if (modal?.tipo !== 'revision') return;
    this.orquestador.modalAvanceParametros.set(null);
    this.avanceSolicitado.emit(modal.destinoPaso);
  }

  cerrarModalAvanceParametros(): void {
    this.orquestador.modalAvanceParametros.set(null);
  }

  irAPendientesParametros(): void {
    this.orquestador.modalAvanceParametros.set(null);
    queueMicrotask(() => {
      document.getElementById('parametros-pendientes-sidebar')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
  }

  abrirTablaDiferencias(): void {
    const diferencias = this.estadoBase()?.comparacion?.diferencias ?? [];
    if (diferencias.length === 0) return;
    this.orquestador.modalTablaDiferenciasParametrosBase.set({ diferencias });
  }

  async confirmarGuardarBaseYContinuar(): Promise<void> {
    const modal = this.orquestador.modalPrepararNomina();
    if (!modal) return;
    try {
      await this.ejecutarGuardadoBase(modal.resumen, 'recienGuardada');
      this.orquestador.modalPrepararNomina.set(null);
    } catch (error) {
      console.error('[Nómina V2] Error guardando base de parámetros', error);
      this.parametrosError.set(this.mensajeErrorPersistenciaBase(error));
      this.resumenActualizado.emit();
    }
  }

  async confirmarMantenerBaseYContinuar(): Promise<void> {
    const modal = this.orquestador.modalDiferenciasParametrosBase();
    if (!modal) return;
    this.orquestador.modalDiferenciasParametrosBase.set(null);
    const origen = this.parametrosBaseService.origenTrasAccionDiferencias('mantener');
    this.orquestador.registrarOrigenBaseAlAvanzar(origen, modal.idCalculoPeriodoBase);
    this.registrarTrazabilidadBase(origen, modal.resumen, modal.idCalculoPeriodoBase);
    this.continuarHaciaAlcance(modal.resumen);
  }

  solicitarActualizarBase(): void {
    const modal = this.orquestador.modalDiferenciasParametrosBase();
    if (!modal) return;
    this.orquestador.modalDiferenciasParametrosBase.set(null);
    this.orquestador.modalActualizarParametrosBase.set({ resumen: modal.resumen });
  }

  async confirmarActualizarBaseYContinuar(): Promise<void> {
    const modal = this.orquestador.modalActualizarParametrosBase();
    if (!modal) return;
    try {
      await this.ejecutarGuardadoBase(modal.resumen, 'actualizadaExplicitamente');
      this.orquestador.modalActualizarParametrosBase.set(null);
    } catch (error) {
      console.error('[Nómina V2] Error actualizando base de parámetros', error);
      this.parametrosError.set(this.mensajeErrorPersistenciaBase(error));
      this.resumenActualizado.emit();
    }
  }

  async cargarParametrosResumen(): Promise<void> {
    this.parametrosLoading.set(true);
    this.parametrosError.set(null);
    try {
      const resumen = await this.parametrosResumenService.obtenerResumen();
      this.parametrosResumen.set(resumen);
      this.actualizarContextoTrazabilidad(resumen);
      await this.actualizarEstadoBase(resumen.periodo);
      this.resumenActualizado.emit();
    } catch (error) {
      console.error('[Nómina V2] Error cargando parámetros', error);
      this.parametrosError.set('No fue posible cargar el resumen de parámetros.');
      this.resumenActualizado.emit();
    } finally {
      this.parametrosLoading.set(false);
    }
  }

  async prepararNomina(): Promise<void> {
    this.parametrosValidando.set(true);
    this.parametrosError.set(null);
    this.resumenActualizado.emit();
    try {
      const resumen = await this.parametrosResumenService.obtenerResumen();
      this.parametrosResumen.set(resumen);
      this.actualizarContextoTrazabilidad(resumen);
      const estadoBase = await this.actualizarEstadoBase(resumen.periodo);
      this.resumenActualizado.emit();

      const rama = this.parametrosBaseService.resolverRamaAccionPreparacion(resumen, estadoBase);
      switch (rama.tipo) {
        case 'guardar': {
          const preview = await this.parametrosBaseService.construirVistaPreviaParametrosBase(resumen);
          this.orquestador.modalPrepararNomina.set({ preview, resumen });
          break;
        }
        case 'continuar':
          this.orquestador.registrarOrigenBaseAlAvanzar(rama.origen, rama.idCalculoPeriodoBase);
          this.registrarTrazabilidadBase(rama.origen, resumen, rama.idCalculoPeriodoBase);
          this.continuarHaciaAlcance(resumen);
          break;
        case 'diferencias':
          this.orquestador.modalDiferenciasParametrosBase.set({
            resumen: rama.resumen,
            idCalculoPeriodoBase: rama.idCalculoPeriodoBase,
            diferencias: rama.diferencias,
          });
          break;
      }
    } catch (error) {
      console.error('[Nómina V2] Error preparando nómina', error);
      this.parametrosError.set(this.mensajeErrorPreparacion(error));
      this.resumenActualizado.emit();
    } finally {
      this.parametrosValidando.set(false);
      this.resumenActualizado.emit();
    }
  }

  goToParametros(destino: ParametrosMantenedorDestino): void {
    void this.router.navigate(['/parametros'], {
      queryParams: {
        periodo: this.parametrosResumen()?.periodo,
        area: destino.area,
        tab: destino.tab,
      },
    });
  }

  parametroEstadoEtiqueta(estado: ParametroResumenEstado): string {
    switch (estado) {
      case 'completo': return 'Completo';
      case 'requiereRevision': return 'Requiere revisión';
      case 'bloqueo': return 'Bloqueo';
      case 'pendiente': return 'Pendiente';
    }
  }

  parametroEstadoIcono(estado: ParametroResumenEstado): string {
    switch (estado) {
      case 'completo': return 'check-circle-2';
      case 'requiereRevision': return 'triangle-alert';
      case 'bloqueo': return 'circle-alert';
      case 'pendiente': return 'clock-3';
    }
  }

  parametroEstadoClase(estado: ParametroResumenEstado): string {
    switch (estado) {
      case 'completo': return 'status-green';
      case 'requiereRevision': return 'status-amber';
      case 'bloqueo': return 'status-red';
      case 'pendiente': return 'status-gray';
    }
  }

  bloqueoSeveridadClase(severidad: ParametroBloqueoSeveridad): string {
    return severidad === 'bloqueo' ? 'status-red' : 'status-amber';
  }

  bloqueoSeveridadIcono(severidad: ParametroBloqueoSeveridad): string {
    return severidad === 'bloqueo' ? 'circle-alert' : 'triangle-alert';
  }

  bloqueoSeveridadEtiqueta(severidad: ParametroBloqueoSeveridad): string {
    return severidad === 'bloqueo' ? 'Bloqueo crítico' : 'Revisión requerida';
  }

  formatoHoraActualizacion(value: string | null | undefined): string {
    if (!value) return 'Sin registro';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return `hoy, ${date.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}`;
  }

  parametroAreaTitulo(areaId: ParametroResumenAreaId): string {
    return this.parametrosAreas().find((area) => area.id === areaId)?.titulo ?? areaId;
  }

  chipsVisiblesParametro(items: ParametroResumenItem[]): ParametroResumenItem[] {
    return items.slice(0, 5);
  }

  cantidadChipsOcultosParametro(items: ParametroResumenItem[]): number {
    return Math.max(items.length - 5, 0);
  }

  private async ejecutarGuardadoBase(
    resumen: NominaParametrosResumen,
    origen: OrigenBaseParametrosAlAvanzar,
  ): Promise<void> {
    const guardado = origen === 'actualizadaExplicitamente'
      ? await this.parametrosBaseService.actualizarSnapshotParametrosBase(resumen)
      : await this.parametrosBaseService.guardarSnapshotParametrosBase(resumen, origen);
    await this.actualizarEstadoBase(resumen.periodo);
    this.orquestador.registrarOrigenBaseAlAvanzar(origen, guardado.idCalculoPeriodoBase);
    this.registrarTrazabilidadBase(origen, resumen, guardado.idCalculoPeriodoBase);
    this.continuarHaciaAlcance(resumen);
  }

  private continuarHaciaAlcance(resumen: NominaParametrosResumen): void {
    this.registrarTrazabilidadParametros(resumen);
    this.orquestador.modalAvanceParametros.set(null);
    this.avanceSolicitado.emit('scope');
  }

  private async actualizarEstadoBase(periodo: string) {
    const estado = await this.parametrosBaseService.obtenerEstadoBasePeriodo(periodo);
    this.orquestador.estadoParametrosBase.set(estado);
    return estado;
  }

  private actualizarContextoTrazabilidad(resumen: NominaParametrosResumen): void {
    this.orquestador.actualizarContextoTrazabilidad({
      periodo: resumen.periodo,
      parametrosResumen: {
        seccionesListas: resumen.seccionesListas,
        seccionesTotal: resumen.seccionesTotales,
        controlesVerificados: resumen.controlesVerificados,
        bloqueos: resumen.bloqueos,
        advertencias: resumen.requiereRevision,
      },
      parametrosBase: this.orquestador.origenBaseParametrosAlAvanzar()
        ? {
            origen: this.orquestador.origenBaseParametrosAlAvanzar()!,
            idCalculoPeriodoBase: this.orquestador.idCalculoPeriodoBase() ?? 0,
            fechaBaseGuardada: this.orquestador.estadoParametrosBase()?.fechaBaseGuardada ?? null,
          }
        : undefined,
    });
  }

  private registrarTrazabilidadBase(
    origen: OrigenBaseParametrosAlAvanzar,
    resumen: NominaParametrosResumen,
    idCalculoPeriodoBase: number,
  ): void {
    this.orquestador.registrarEventoTrazabilidad(
      this.trazabilidadService.crearEventoLocal({
        periodo: resumen.periodo,
        paso: 'parameters',
        tipoEvento: 'PARAMETROS_CONGELADOS',
        descripcion: this.parametrosBaseService.descripcionOrigenBase(origen),
        idSnapshotRelacionado: String(idCalculoPeriodoBase),
        metadataPublica: { origenBase: origen },
        integridad: { estadoIntegridad: 'registrado' },
      }),
    );
  }

  private registrarTrazabilidadParametros(resumen: NominaParametrosResumen): void {
    const hayAlcance = this.orquestador.alcanceValidado();
    const hayEmpleados = this.orquestador.eventosTrazabilidad().some(
      (e) => e.paso === 'employees' && e.tipoEvento === 'EMPLEADOS_VALIDADOS' && e.origen === 'local',
    );
    if (debeInvalidarPorRevalidacionParametros(hayAlcance, hayEmpleados)) {
      this.orquestador.registrarEventoTrazabilidad(
        this.trazabilidadService.crearEventoInvalidacion(
          'parameters',
          'La revalidación de parámetros invalidó etapas posteriores.',
          resumen.periodo,
        ),
      );
    }

    const tipo = resumen.puedeContinuar && resumen.bloqueos === 0 ? 'PARAMETROS_CONGELADOS' : 'PARAMETROS_VALIDADOS';
    const descripcion =
      tipo === 'PARAMETROS_CONGELADOS'
        ? `Parámetros congelados · ${resumen.seccionesListas} de ${resumen.seccionesTotales} secciones listas`
        : `Parámetros validados · ${resumen.controlesVerificados} controles verificados`;

    this.orquestador.registrarEventoTrazabilidad(
      this.trazabilidadService.crearEventoLocal({
        periodo: resumen.periodo,
        paso: 'parameters',
        tipoEvento: tipo,
        descripcion,
        integridad: { estadoIntegridad: 'pendiente' },
      }),
    );
  }

  private mensajeErrorPersistenciaBase(error: unknown): string {
    const detalle = error instanceof Error ? error.message : '';
    if (/row-level security|RLS|permission denied/i.test(detalle)) {
      return 'No fue posible guardar la base de parámetros: la sesión no tiene permiso de escritura. Inicia sesión nuevamente o contacta a administración.';
    }
    return detalle || 'No fue posible guardar la base de parámetros.';
  }

  private mensajeErrorPreparacion(error: unknown): string {
    const detalle = error instanceof Error ? error.message : '';
    if (/row-level security|RLS|permission denied/i.test(detalle)) {
      return 'No fue posible consultar o guardar la base de parámetros por permisos de sesión.';
    }
    return detalle || 'No fue posible preparar la nómina con la base de parámetros.';
  }

  private obtenerEstadoPendientesPasoParametros(): EstadoPendientesPasoParametros {
    const resumen = this.parametrosResumen();
    const tieneBloqueos = (resumen?.bloqueos ?? 0) > 0;
    const tieneRevisiones = (resumen?.requiereRevision ?? 0) > 0;
    const puedeContinuar = resumen?.puedeContinuar ?? false;
    let resultado: ResultadoValidacionPaso = 'permitido';
    if (tieneBloqueos) {
      resultado = 'bloqueado';
    } else if (tieneRevisiones && !puedeContinuar) {
      resultado = 'bloqueado';
    } else if (tieneRevisiones) {
      resultado = 'advertencia';
    }
    return { tieneBloqueos, tieneRevisiones, puedeContinuar, resultado };
  }
}
