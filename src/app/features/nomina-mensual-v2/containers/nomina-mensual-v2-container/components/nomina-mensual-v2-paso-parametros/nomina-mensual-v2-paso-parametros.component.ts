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
import type { MessageBoxSection } from '../../../../../../shared/components/ui/feedback/message-box/message-box.types';
import { PeriodoActivoService } from '../../../../../../core/services/periodo-activo.service';
import type { PayrollStepId } from '../../../../models/nomina-mensual-v2.models';
import type {
  OrigenBaseParametrosAlAvanzar,
} from '../../../../models/nomina-parametros-base.models';
import type {
  NominaParametrosResumen,
  ParametroBloqueoSeveridad,
  ParametroResumenBloqueo,
  ParametroResumenAreaId,
  ParametroResumenItem,
  ParametroResumenEstado,
  ParametroResumenItemEstado,
  ParametrosMantenedorDestino,
} from '../../../../models/nomina-parametros-resumen.models';
import { NominaParametrosBaseService } from '../../../../services/nomina-parametros-base.service';
import { NominaParametrosResumenService } from '../../../../services/nomina-parametros-resumen.service';
import { NominaMensualV2OrquestadorPort } from '../../facade/nomina-mensual-v2-orquestador.port';
type DonutTonoPresentacion = 'exito' | 'revision' | 'bloqueo' | 'neutral';

type ParametrosCargaOverlayPresentacion = {
  titulo: string;
  mensaje: string;
};

type ModalPendientesParametrosTipo = 'preparacion' | 'oficiales';

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
  private readonly periodoActivo = inject(PeriodoActivoService);
  private tokenCargaPeriodo = 0;

  @Output() avanceSolicitado = new EventEmitter<PayrollStepId>();
  @Output() resumenActualizado = new EventEmitter<void>();

  readonly parametrosResumen = signal<NominaParametrosResumen | null>(null);
  readonly modalPendientesParametros = signal<{ tipo: ModalPendientesParametrosTipo } | null>(null);
  readonly parametrosLoading = signal(true);
  readonly parametrosValidando = signal(false);
  readonly parametrosError = signal<string | null>(null);
  readonly parametrosAreas = computed(() => this.parametrosResumen()?.areas ?? []);
  readonly parametrosBloqueosActuales = computed(() => this.parametrosResumen()?.bloqueosActuales ?? []);
  readonly parametrosPendientesPreparacion = computed(() => this.parametrosResumen()?.pendientesPreparacion ?? []);
  readonly parametrosAdvertenciasNoBloqueantes = computed(() => this.parametrosResumen()?.advertenciasNoBloqueantes ?? []);
  readonly parametrosPendientesPreparacionPreview = computed(() => this.parametrosPendientesPreparacion().slice(0, 2));
  readonly parametrosPendientesPreparacionOcultos = computed(() =>
    Math.max(this.parametrosPendientesPreparacion().length - this.parametrosPendientesPreparacionPreview().length, 0),
  );
  readonly parametrosPendientesSidebar = this.parametrosPendientesPreparacion;
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

  readonly parametrosAlertaTipo = computed((): 'error' | 'bloqueo' | 'revision' | 'oficiales' | 'diferencias' | null => {
    if (this.parametrosLoading()) return null;
    if (this.parametrosError()) return 'error';
    if (this.hayDiferenciasBase()) return 'diferencias';
    const resumen = this.parametrosResumen();
    if (!resumen) return null;
    if (resumen.bloqueosPreparacion > 0) return 'bloqueo';
    if (resumen.advertenciasOficiales > 0) return 'oficiales';
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
    const cantidad = this.parametrosResumen()?.bloqueosPreparacion ?? 0;
    const etiquetaItem = cantidad === 1
      ? 'parámetro obligatorio pendiente'
      : 'parámetros obligatorios pendientes';
    return `Hay ${cantidad} ${etiquetaItem}`;
  });

  readonly alertaBloqueoDescripcion = computed(() => {
    const cantidad = this.parametrosResumen()?.bloqueosPreparacion ?? 0;
    const etiquetaAccion = cantidad === 1 ? 'Corrígelo' : 'Corrígelos';
    return `${etiquetaAccion} en Parámetros antes de preparar la nómina.`;
  });

  readonly alertaOficialesTitulo = computed(() => {
    const cantidad = this.parametrosResumen()?.advertenciasOficiales ?? 0;
    const etiquetaItem = cantidad === 1 ? 'oficial pendiente' : 'oficiales pendientes';
    return `Hay ${cantidad} ${etiquetaItem} no bloqueante`;
  });

  readonly alertaOficialesDescripcion = computed(() =>
    'Puedes preparar la nómina; estos valores oficiales mensuales se actualizarán cuando estén disponibles.',
  );

  readonly parametrosEstadoPreparacionCompleto = computed(() => {
    if (this.parametrosLoading() || this.parametrosValidando()) return false;
    const resumen = this.parametrosResumen();
    if (!resumen) return false;
    return resumen.bloqueosPreparacion === 0;
  });

  readonly tituloEstadoParametros = computed(() => {
    const resumen = this.parametrosResumen();
    if ((resumen?.bloqueosPreparacion ?? 0) > 0) {
      return 'Pendientes para preparar';
    }
    return 'Pendientes para preparar';
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
    if (resumen.bloqueosPreparacion > 0) return 'bloqueo';
    if (resumen.requiereRevision > 0 || resumen.advertenciasOficiales > 0) return 'revision';
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
      const periodo = this.periodoActivo.periodoYm();
      void this.cargarParametrosResumen(periodo);
    });
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
      if (resumen.bloqueosPreparacion > 0) {
        this.orquestador.establecerAyudaAvance(
          'Completa los pendientes no oficiales exigibles antes de preparar la nómina.',
          'bloqueo',
        );
        return;
      }
      if (resumen.advertenciasOficiales > 0) {
        this.orquestador.establecerAyudaAvance(
          'Hay oficiales mensuales pendientes. No bloquean la preparación del periodo.',
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
    const limpiarAccionPrincipal = this.orquestador.registrarAccionPrincipal(() => void this.prepararNomina());
    this.destroyRef.onDestroy(() => {
      limpiarAccionPrincipal();
      this.orquestador.establecerAyudaAvance(null);
    });
  }

  evaluarAvance(destinoPaso: PayrollStepId): void {
    const estado = this.obtenerEstadoPendientesPasoParametros();
    if (estado.resultado === 'bloqueado') {
      const resumen = this.parametrosResumen();
      this.orquestador.modalAvanceParametros.set({
        tipo: 'bloqueo',
        pendientes: (resumen?.pendientesPreparacion ?? []).map((item) => `${item.titulo}: ${item.detalle ?? 'Pendiente'}`),
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
    this.abrirModalPendientesParametros('preparacion');
  }

  abrirTablaDiferencias(): void {
    const diferencias = this.estadoBase()?.comparacion?.diferencias ?? [];
    if (diferencias.length === 0) return;
    this.orquestador.modalTablaDiferenciasParametrosBase.set({ diferencias });
  }

  abrirModalPendientesParametros(tipo: ModalPendientesParametrosTipo): void {
    this.modalPendientesParametros.set({ tipo });
  }

  cerrarModalPendientesParametros(): void {
    this.modalPendientesParametros.set(null);
  }

  tituloModalPendientesParametros(tipo: ModalPendientesParametrosTipo): string {
    return tipo === 'preparacion' ? 'Pendientes para preparar' : 'Oficiales pendientes';
  }

  mensajeModalPendientesParametros(tipo: ModalPendientesParametrosTipo): string {
    return tipo === 'preparacion'
      ? 'Completa estos datos no oficiales exigibles antes de preparar la nómina.'
      : 'Estos oficiales mensuales no bloquean la preparación del periodo.';
  }

  seccionesModalPendientesParametros(tipo: ModalPendientesParametrosTipo): MessageBoxSection[] {
    const items = tipo === 'preparacion'
      ? this.parametrosPendientesPreparacion()
      : this.parametrosAdvertenciasNoBloqueantes();
    return this.agruparPendientesParametros(items).map(([areaId, bloqueos]) => ({
      title: this.parametroAreaTitulo(areaId),
      tone: tipo === 'preparacion' ? 'attention' : 'info',
      items: bloqueos.map((bloqueo) => `${bloqueo.titulo}: ${bloqueo.detalle ?? 'Pendiente'}`),
    }));
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
    try {
      await this.parametrosBaseService.registrarMantenerBaseConDiferencias(
        modal.idCalculoPeriodoBase,
        modal.resumen,
      );
      await this.actualizarEstadoBase(modal.resumen.periodo);
      this.orquestador.registrarOrigenBaseAlAvanzar(origen, modal.idCalculoPeriodoBase);
      await this.orquestador.recomputarTrazabilidad(false);
      this.continuarHaciaAlcance(modal.resumen);
    } catch (error) {
      console.error('[Nómina V2] Error registrando mantener base con diferencias', error);
      this.parametrosError.set(this.mensajeErrorPersistenciaBase(error));
      this.resumenActualizado.emit();
    }
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

  async cargarParametrosResumen(periodo = this.periodoActivo.periodoYm()): Promise<void> {
    const token = ++this.tokenCargaPeriodo;
    this.parametrosLoading.set(true);
    this.parametrosError.set(null);
    try {
      const resumen = await this.parametrosResumenService.obtenerResumen(periodo);
      if (token !== this.tokenCargaPeriodo) return;
      this.parametrosResumen.set(resumen);
      this.actualizarContextoTrazabilidad(resumen);
      await this.actualizarEstadoBase(resumen.periodo);
      if (token !== this.tokenCargaPeriodo) return;
      this.resumenActualizado.emit();
    } catch (error) {
      if (token !== this.tokenCargaPeriodo) return;
      console.error('[Nómina V2] Error cargando parámetros', error);
      this.parametrosError.set('No fue posible cargar el resumen de parámetros.');
      this.resumenActualizado.emit();
    } finally {
      if (token !== this.tokenCargaPeriodo) return;
      this.parametrosLoading.set(false);
      this.resumenActualizado.emit();
    }
  }

  async prepararNomina(): Promise<void> {
    const periodo = this.periodoActivo.periodoYm();
    this.parametrosValidando.set(true);
    this.parametrosError.set(null);
    this.resumenActualizado.emit();
    try {
      const resumen = await this.parametrosResumenService.obtenerResumen(periodo);
      if (resumen.periodo !== this.periodoActivo.periodoYm()) return;
      this.parametrosResumen.set(resumen);
      this.actualizarContextoTrazabilidad(resumen);
      const estadoBase = await this.actualizarEstadoBase(resumen.periodo);
      if (resumen.periodo !== this.periodoActivo.periodoYm()) return;
      this.resumenActualizado.emit();

      const rama = this.parametrosBaseService.resolverRamaAccionPreparacion(resumen, estadoBase);
      switch (rama.tipo) {
        case 'bloqueado':
          this.orquestador.modalAvanceParametros.set({
            tipo: 'bloqueo',
            pendientes: rama.pendientes.map((item) => `${item.titulo}: ${item.detalle ?? 'Pendiente'}`),
          });
          break;
        case 'guardar': {
          const preview = await this.parametrosBaseService.construirVistaPreviaParametrosBase(resumen, resumen.periodo);
          this.orquestador.modalPrepararNomina.set({ preview, resumen });
          break;
        }
        case 'continuar':
          this.orquestador.registrarOrigenBaseAlAvanzar(rama.origen, rama.idCalculoPeriodoBase);
          await this.orquestador.recomputarTrazabilidad(false);
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

  goToMantenedorParametros(): void {
    void this.router.navigate(['/parametros'], {
      queryParams: {
        periodo: this.parametrosResumen()?.periodo,
        area: 'datosOficiales',
        tab: 'valores',
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
    await this.orquestador.recomputarTrazabilidad(false);
    this.continuarHaciaAlcance(resumen);
  }

  private continuarHaciaAlcance(resumen: NominaParametrosResumen): void {
    this.actualizarContextoTrazabilidad(resumen);
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
    const tieneBloqueos = (resumen?.bloqueosPreparacion ?? 0) > 0;
    const tieneRevisiones = (resumen?.requiereRevision ?? 0) > 0 || (resumen?.advertenciasOficiales ?? 0) > 0;
    const puedeContinuar = resumen?.puedePreparar ?? false;
    let resultado: ResultadoValidacionPaso = 'permitido';
    if (tieneBloqueos) {
      resultado = 'bloqueado';
    } else if (tieneRevisiones) {
      resultado = 'advertencia';
    }
    return { tieneBloqueos, tieneRevisiones, puedeContinuar, resultado };
  }

  private agruparPendientesParametros(
    bloqueos: readonly ParametroResumenBloqueo[],
  ): Array<[ParametroResumenAreaId, ParametroResumenBloqueo[]]> {
    const grupos = new Map<ParametroResumenAreaId, ParametroResumenBloqueo[]>();
    for (const bloqueo of bloqueos) {
      const grupo = grupos.get(bloqueo.areaId) ?? [];
      grupo.push(bloqueo);
      grupos.set(bloqueo.areaId, grupo);
    }
    return [...grupos.entries()];
  }
}
