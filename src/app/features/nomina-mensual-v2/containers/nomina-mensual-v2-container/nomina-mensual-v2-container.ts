import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnDestroy,
  OnInit,
  ViewEncapsulation,
  computed,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { bindShellPageContext } from '../../../../layout/shell-page-context.binding';
import type { ShellPageContext } from '../../../../layout/shell-page-context.service';
import { MessageBoxComponent } from '../../../../shared/components/ui/feedback/message-box/message-box.component';
import { WorkspaceLoadingComponent } from '../../../../shared/components/ui/feedback/workspace-loading/workspace-loading.component';
import { PeriodoActivoService } from '../../../../core/services/periodo-activo.service';
import { mensajeErrorParaUsuario } from '../../../../core/errors/erp-supabase-user-message';
import { NominaPeriodoService } from '../../../nomina-mensual/services/nomina-periodo.service';
import { NominaMensualCapabilitiesService } from '../../../nomina-mensual/services/nomina-mensual-capabilities.service';
import type { NominaPeriodo } from '../../../nomina-mensual/models/nomina-periodo.models';
import { payrollSteps } from '../../data/nomina-mensual-v2.steps';
import type { PayrollStepId } from '../../models/nomina-mensual-v2.models';

import { NominaMensualV2OverlaysComponent } from './components/nomina-mensual-v2-overlays/nomina-mensual-v2-overlays.component';
import { NominaMensualV2PasoCalculoComponent } from './components/nomina-mensual-v2-paso-calculo/nomina-mensual-v2-paso-calculo.component';
import { NominaMensualV2PasoCierreComponent } from './components/nomina-mensual-v2-paso-cierre/nomina-mensual-v2-paso-cierre.component';
import { NominaMensualV2PasoDotacionComponent } from './components/nomina-mensual-v2-paso-dotacion/nomina-mensual-v2-paso-dotacion.component';
import { NominaMensualV2PasoMovimientosComponent } from './components/nomina-mensual-v2-paso-movimientos/nomina-mensual-v2-paso-movimientos.component';
import { NominaMensualV2PasoParametrosComponent } from './components/nomina-mensual-v2-paso-parametros/nomina-mensual-v2-paso-parametros.component';
import { NominaMensualV2StepperComponent } from './components/nomina-mensual-v2-stepper/nomina-mensual-v2-stepper.component';
import {
  ORDEN_PASOS_NOMINA,
  RAZON_CIERRE_MODAL_PENDIENTE,
  RAZON_VALIDACION_MODAL_PENDIENTE,
  ejecutarAvancePaso,
  esAvanceHaciaAdelante,
  esPasoCongelado,
  esRetrocesoAPaso,
  indiceMaximoPasoAccesibleEfectivo,
  obtenerEtiquetaAccionPrincipal,
  obtenerEtiquetaBrevePaso,
  obtenerSubtituloPaso,
  obtenerTituloPaso,
  pasoExcluidoAutoPersistenciaCompletado,
  puedeContinuarPaso,
  type PasoNominaPort,
  type ResultadoAvancePaso,
} from './facade/nomina-mensual-v2-navegacion';
import { NominaMensualV2TrazabilidadService } from '../../services/nomina-mensual-v2-trazabilidad.service';
import { NominaMensualV2SesionService } from '../../services/nomina-mensual-v2-sesion.service';
import { NominaParametrosBaseAccesoService } from '../../services/nomina-parametros-base-acceso.service';
import { NominaMensualV2OrquestadorPort } from './facade/nomina-mensual-v2-orquestador.port';
import { NominaMensualV2TrazabilidadDrawerComponent } from './components/nomina-mensual-v2-trazabilidad-drawer/nomina-mensual-v2-trazabilidad-drawer.component';
import { NominaMensualV2TrazabilidadModalComponent } from './components/nomina-mensual-v2-trazabilidad-modal/nomina-mensual-v2-trazabilidad-modal.component';
import type { NominaCabeceraCambiadaEvent } from '../../models/nomina-cabecera-cambiada.models';
import { construirContextoGeneradorNomina } from '../../presenters/nomina-generador-context.presenter';
import { ErpPermisosRemuneracionesService } from '../../../../core/auth/erp-permisos-remuneraciones.service';

@Component({
  selector: 'app-nomina-mensual-v2-container',
  standalone: true,
  imports: [
    MessageBoxComponent,
    WorkspaceLoadingComponent,
    NominaMensualV2StepperComponent,
    NominaMensualV2PasoParametrosComponent,
    NominaMensualV2PasoDotacionComponent,
    NominaMensualV2PasoMovimientosComponent,
    NominaMensualV2PasoCalculoComponent,
    NominaMensualV2PasoCierreComponent,
    NominaMensualV2OverlaysComponent,
    NominaMensualV2TrazabilidadModalComponent,
    NominaMensualV2TrazabilidadDrawerComponent,
  ],
  providers: [NominaMensualV2OrquestadorPort],
  templateUrl: './nomina-mensual-v2-container.html',
  styleUrl: './nomina-mensual-v2-container.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class NominaMensualV2Container implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly periodoActivo = inject(PeriodoActivoService);
  private readonly trazabilidadService = inject(NominaMensualV2TrazabilidadService);
  private readonly sesionService = inject(NominaMensualV2SesionService);
  private readonly nominaPeriodoService = inject(NominaPeriodoService);
  readonly orquestador = inject(NominaMensualV2OrquestadorPort);
  private readonly accesoBaseService = inject(NominaParametrosBaseAccesoService);
  private readonly nominaCapabilities = inject(NominaMensualCapabilitiesService);
  private readonly permisosRemuneraciones = inject(ErpPermisosRemuneracionesService);

  /** false = perfil de solo consulta: recorre los pasos sin acciones que modifiquen la nómina. */
  readonly puedeEscribirNomina = computed(() => this.permisosRemuneraciones.puedeEscribirNomina());

  private readonly pasoParametros = viewChild(NominaMensualV2PasoParametrosComponent);
  private readonly pasoDotacion = viewChild(NominaMensualV2PasoDotacionComponent);
  private readonly pasoMovimientos = viewChild(NominaMensualV2PasoMovimientosComponent);
  private readonly pasoCalculo = viewChild(NominaMensualV2PasoCalculoComponent);
  private readonly pasoCierre = viewChild(NominaMensualV2PasoCierreComponent);
  private tokenInicializacionPeriodo = 0;
  private ultimoPeriodoInicializado: string | null = null;
  private ultimoNominaIdCargado: string | null = null;

  readonly steps = payrollSteps;
  readonly currentStep = signal<PayrollStepId>('parameters');
  readonly nominaPeriodoId = signal<string | null>(null);
  readonly nominaCargada = signal<NominaPeriodo | null>(null);
  readonly nominaCargaEstado = signal<'idle' | 'loading' | 'ready' | 'not_found' | 'error'>('idle');

  /**
   * Apertura desde administrador (flecha): mantiene un solo overlay hasta que
   * la cabecera, la rehidratación y la carga inicial del paso activo terminen.
   */
  private readonly preparacionInicialActiva = signal(false);

  /** Cabecera de nómina en curso, antes de montar pasos. */
  readonly generadorEnCargaCabecera = computed(
    () => this.nominaCargaEstado() === 'loading' && !!this.nominaPeriodoId(),
  );

  readonly generadorPreparando = computed(() => {
    if (this.generadorEnCargaCabecera()) return true;
    if (!this.preparacionInicialActiva()) return false;
    if (this.nominaCargaEstado() !== 'ready') return true;
    if (!this.pasoVisitadoRehidratado()) return true;
    return this.pasoActivoEnCargaInicial();
  });

  /** Overlay sobre el workspace ya montado (fase 2 de la apertura). */
  readonly preparacionOverlayActiva = computed(
    () => this.generadorPreparando() && this.nominaCargaEstado() === 'ready',
  );

  /** Trabajador a abrir en detalle al saltar desde Validación → Dotación. */
  readonly trabajadorDetalleDotacion = signal<string | null>(null);

  /**
   * Banner contextual mostrado tras crear/reabrir una nómina desde el
   * Administrador. Se completa con `?from=create&paso=...&dotacion=...` en la
   * URL y se descarta al primer cambio de paso para no ensuciar la sesión.
   */
  readonly bannerHandoff = signal<{
    mensaje: string;
    tono: 'info' | 'success';
  } | null>(null);
  private pasoForzadoCreacion: PayrollStepId | null = null;
  private handoffCreacionConsumido = false;

  /**
   * Marca que la rehidratación del último paso visitado para la nómina actual
   * ya se aplicó (o se intentó). Mientras es `false`, el effect de guardado
   * NO escribe, evitando pisar el paso visitado con `parameters` justo
   * después de entrar.
   */
  private readonly pasoVisitadoRehidratado = signal(false);
  readonly rehidratacionError = signal<string | null>(null);

  readonly contextoNomina = computed(() => construirContextoGeneradorNomina(this.nominaCargada()));

  readonly pageTitle = computed(() => obtenerTituloPaso(this.currentStep()));
  readonly pageSubtitle = computed(() => {
    const pasoSub = obtenerSubtituloPaso(this.currentStep());
    const resumen = this.contextoNomina().resumenLinea;
    if (!resumen) return pasoSub;
    return `${resumen} — ${pasoSub}`;
  });
  readonly primaryActionLabel = computed(() => obtenerEtiquetaAccionPrincipal(this.currentStep()));

  readonly parametrosPasoOcupado = computed(() => {
    if (this.currentStep() !== 'parameters') return false;
    const paso = this.pasoParametros();
    return (paso?.parametrosLoading() ?? false) || (paso?.parametrosValidando() ?? false);
  });

  /**
   * Diagnóstico de "completitud" del paso activo. Para `parameters` se
   * deriva de la bandera del orquestador (`parametrosPreparados`); para los
   * pasos 2-5 se delega en el `PasoNominaPort.puedeContinuar()` del
   * ViewChild correspondiente.
   *
   * Si el ViewChild aún no está montado, devuelve `{ok:false}` con razón
   * neutra: el CTA queda deshabilitado durante el render inicial.
   */
  readonly pasoActualCompleto = computed<ResultadoAvancePaso>(() => {
    const paso = this.currentStep();
    if (paso === 'parameters') {
      const componente = this.pasoParametros();
      if (!componente) return { ok: false, razon: 'Cargando parámetros.' };
      if (this.parametrosPasoOcupado()) {
        return { ok: false, razon: 'Procesando parámetros.' };
      }
      if (!this.orquestador.parametrosPreparados()) {
        return {
          ok: false,
          razon: 'Completa los parámetros del período antes de continuar.',
        };
      }
      return { ok: true };
    }
    return puedeContinuarPaso(this.obtenerPasoActivoConComando());
  });

  /**
   * Índice del paso más alto que el cliente considera "completo" según el
   * criterio UI. Combina dos fuentes:
   *  - El paso activo: si su `puedeContinuar()` responde `ok`, su índice cae
   *    en el conjunto.
   *  - El persistido server-side (`maximoPasoCompletado` en la nómina
   *    cargada).
   *
   * Devuelve `-1` si nada está completo (escenario raro: nómina nueva con
   * usuario en `parameters` y parámetros aún no preparados).
   */
  readonly indiceMaximoCompletadoPorContenido = computed(() => {
    const indices: number[] = [];
    const persistido = this.nominaCargada()?.maximoPasoCompletado ?? null;
    if (persistido) {
      const idx = ORDEN_PASOS_NOMINA.indexOf(persistido);
      if (idx >= 0) indices.push(idx);
    }
    if (this.pasoActualCompleto().ok) {
      const paso = this.currentStep();
      if (!pasoExcluidoAutoPersistenciaCompletado(paso)) {
        const idx = ORDEN_PASOS_NOMINA.indexOf(paso);
        if (idx >= 0) indices.push(idx);
      }
    }
    if (this.nominaCargada()?.estado === 'cerrada') {
      const idxCierre = ORDEN_PASOS_NOMINA.indexOf('closure');
      if (idxCierre >= 0) indices.push(idxCierre);
    }
    return indices.length > 0 ? Math.max(...indices) : -1;
  });

  /**
   * Índice máximo al que el usuario puede navegar combinando el techo
   * server-side (`indiceMaximoPasoAccesible(estado)`) con el contenido
   * cliente (`indiceMaximoCompletadoPorContenido + 1`). Es la fuente de
   * verdad que consume el stepper para bloquear pasos no accesibles.
   */
  readonly indiceMaximoAccesibleEfectivo = computed(() =>
    indiceMaximoPasoAccesibleEfectivo(
      this.nominaCargada()?.estado ?? null,
      this.indiceMaximoCompletadoPorContenido(),
    ),
  );

  /**
   * Etiqueta breve del paso activo, útil para mensajes y tooltips que el
   * container construye sin acceder al stepper.
   */
  readonly etiquetaPasoActual = computed(() => obtenerEtiquetaBrevePaso(this.currentStep()));

  constructor() {
    // Effect en constructor para que se limpie con DestroyRef al cerrar el
    // container. Importante: `bindShellPageContext` ya crea su propio effect
    // que reacciona a los signals leídos por `computeShellContext()`.
    effect(() => {
      const periodo = this.periodoActivo.periodoYm();
      void this.onPeriodoActivoCambiado(periodo);
    });

    // Rehidratación del último paso visitado: corre una sola vez por id de
    // nómina. Al limpiarse el id (salida del generador o cambio de nómina),
    // se reinicia el flag para que la próxima entrada vuelva a rehidratar.
    effect(() => {
      const id = this.nominaPeriodoId();
      if (!id) {
        this.pasoVisitadoRehidratado.set(false);
        this.preparacionInicialActiva.set(false);
        return;
      }
      if (this.pasoVisitadoRehidratado()) return;
      void this.aplicarRehidratacionPasoVisitado(id);
    }, { allowSignalWrites: true });

    effect(() => {
      if (!this.preparacionInicialActiva()) return;
      if (this.generadorPreparando()) return;
      this.preparacionInicialActiva.set(false);
    }, { allowSignalWrites: true });

    // Guardado del paso al cambiar. Sólo escribe después de que la
    // rehidratación se haya aplicado, evitando pisar el paso visitado con el
    // valor que el container tenía antes de leer la cabecera.
    effect(() => {
      const paso = this.currentStep();
      const id = this.nominaPeriodoId();
      if (!id) return;
      if (!this.pasoVisitadoRehidratado()) return;
      void this.nominaPeriodoService.registrarPasoVisitado(id, paso);
    });

    // Registro de máximo paso completado: cuando el paso activo está
    // "poblado correctamente" (criterio UI), persistimos su índice. El
    // service tiene dedupe monótono — solo escribe si supera al último
    // registrado.
    effect(() => {
      const id = this.nominaPeriodoId();
      if (!id) return;
      if (!this.pasoVisitadoRehidratado()) return;
      const completitud = this.pasoActualCompleto();
      if (!completitud.ok) return;
      const paso = this.currentStep();
      if (pasoExcluidoAutoPersistenciaCompletado(paso)) return;
      void this.nominaPeriodoService.registrarPasoCompletado(id, paso);
    });

    bindShellPageContext(this.destroyRef, () => this.computeShellContext(), {
      onPrimaryAction: () => {
        void this.ejecutarAccionPrincipalPasoActual();
      },
    });
  }

  private async aplicarRehidratacionPasoVisitado(nominaPeriodoId: string): Promise<void> {
    this.rehidratacionError.set(null);
    try {
      this.sincronizarHandoffDesdeQueryParams(this.route.snapshot.queryParamMap);
      const periodo = this.periodoActivo.periodoYm();
      const sesion = await this.sesionService.resolverEstadoSesion(periodo, nominaPeriodoId);
      // Si el handoff desde el Administrador (F05) trae paso explícito, lo
      // respetamos: el usuario acaba de crear y debe aterrizar ahí, no en el
      // paso visitado de una sesión previa.
      const pasoForzado = this.pasoForzadoCreacion;
      this.pasoForzadoCreacion = null;
      const pasoTarget = pasoForzado ?? sesion.pasoVisitadoSugerido ?? sesion.pasoInicial;
      this.orquestador.estadoParametrosBase.set(sesion.estadoBase);
      if (sesion.contextoTrazabilidad) {
        this.orquestador.actualizarContextoTrazabilidad(sesion.contextoTrazabilidad);
      }
      if (sesion.origenBase && sesion.idCalculoPeriodoBase) {
        this.orquestador.registrarOrigenBaseAlAvanzar(sesion.origenBase, sesion.idCalculoPeriodoBase);
      }
      if (pasoTarget !== this.currentStep()) {
        this.currentStep.set(pasoTarget);
        this.orquestador.pasoActual.set(pasoTarget);
      }
      if (sesion.pasoVisitadoSugerido) {
        // Pre-hidrata el cache de dedupe del service para que el effect de
        // guardado, al dispararse con el mismo paso, no provoque un RPC
        // redundante.
        void this.nominaPeriodoService.registrarPasoVisitado(
          nominaPeriodoId,
          sesion.pasoVisitadoSugerido,
        );
      }
    } catch (error) {
      console.warn('[Nómina V2] Rehidratación de paso visitado falló', error);
      this.rehidratacionError.set(
        'No fue posible reanudar el último paso visitado. Revisa el avance desde Parámetros o vuelve al administrador.',
      );
    } finally {
      this.pasoVisitadoRehidratado.set(true);
    }
  }

  ngOnInit(): void {
    // Reinicio defensivo: si quedó residuo de una sesión anterior, lo limpiamos
    // antes de que `bindShellPageContext` empiece a publicar contexto.
    this.currentStep.set('parameters');
    this.ultimoPeriodoInicializado = null;
    this.ultimoNominaIdCargado = null;
    this.orquestador.vincularTrazabilidadService(this.trazabilidadService);
    this.sincronizarHandoffDesdeQueryParams(this.route.snapshot.queryParamMap);

    const idInicial = this.route.snapshot.paramMap.get('nominaPeriodoId');
    if (idInicial) {
      this.nominaPeriodoId.set(idInicial);
      this.nominaCargaEstado.set('loading');
      this.preparacionInicialActiva.set(true);
    }

    this.route.paramMap.subscribe((params) => {
      const id = params.get('nominaPeriodoId');
      this.nominaPeriodoId.set(id);
      if (!id) {
        this.nominaCargaEstado.set('idle');
        this.nominaCargada.set(null);
        this.preparacionInicialActiva.set(false);
        return;
      }
      if (id !== this.ultimoNominaIdCargado) {
        this.ultimoNominaIdCargado = id;
        this.nominaCargada.set(null);
        this.nominaCargaEstado.set('loading');
        this.preparacionInicialActiva.set(true);
        void this.cargarNominaProductiva(id);
      }
    });

    this.route.queryParamMap.subscribe((qp) => {
      this.sincronizarHandoffDesdeQueryParams(qp);
    });
  }

  private sincronizarHandoffDesdeQueryParams(qp: { get: (key: string) => string | null }): void {
    const from = qp.get('from');
    const pasoRaw = qp.get('paso');
    const dotacionRaw = qp.get('dotacion');
    const reutilizadaRaw = qp.get('reutilizada');
    const hayHandoffKeys =
      from != null || pasoRaw != null || dotacionRaw != null || reutilizadaRaw != null;

    // Query ya limpia: no tocar `pasoForzadoCreacion` (lo consume la rehidratación).
    if (!hayHandoffKeys) {
      return;
    }

    if (from === 'create') {
      const pasoCreate =
        pasoRaw === 'parameters' || pasoRaw === 'dotacion' ? pasoRaw : null;
      const dotacion = Number(dotacionRaw ?? '0');
      const reutilizada = reutilizadaRaw === '1';
      if (pasoCreate) {
        this.pasoForzadoCreacion = pasoCreate;
        this.currentStep.set(pasoCreate);
        this.orquestador.pasoActual.set(pasoCreate);
      }
      this.bannerHandoff.set(this.componerBannerHandoff(dotacion, reutilizada));
      if (!this.handoffCreacionConsumido) {
        this.handoffCreacionConsumido = true;
        this.limpiarQueryHandoff();
      }
      return;
    }

    const pasoCanonico = normalizarPasoQuery(pasoRaw);
    if (pasoCanonico) {
      this.pasoForzadoCreacion = pasoCanonico;
      this.currentStep.set(pasoCanonico);
      this.orquestador.pasoActual.set(pasoCanonico);
    }

    this.limpiarQueryHandoff();
  }

  private limpiarQueryHandoff(): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        from: null,
        paso: null,
        dotacion: null,
        reutilizada: null,
      },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  private componerBannerHandoff(
    dotacion: number,
    reutilizada: boolean,
  ): { mensaje: string; tono: 'info' | 'success' } {
    if (reutilizada) {
      const cuerpo = dotacion === 1
        ? '1 trabajador en dotación'
        : `${dotacion} trabajadores en dotación`;
      return {
        mensaje: `Continuamos con la nómina existente · ${cuerpo}.`,
        tono: 'info',
      };
    }
    const cuerpo = dotacion === 1
      ? '1 trabajador en dotación inicial'
      : `${dotacion} trabajadores en dotación inicial`;
    return {
      mensaje: `Nómina creada · ${cuerpo}.`,
      tono: 'success',
    };
  }

  /**
   * Limpia el banner contextual del handoff. Se invoca al cambiar de paso
   * para que no acompañe al usuario más allá del aterrizaje inicial.
   */
  cerrarBannerHandoff(): void {
    this.bannerHandoff.set(null);
  }

  /**
   * Reacciona al cambio del periodo activo del shell. Mientras estás dentro
   * del generador, el periodo viene fijado por la nómina cargada (URL). Si el
   * usuario cambia el mes desde el shell:
   *
   * 1. Si todavía no hay nómina cargada (carga inicial) → seguimos el flujo
   *    normal `inicializarSesionPeriodo`.
   * 2. Si hay nómina cargada y su periodo coincide con el nuevo → idem (caso
   *    típico de `cargarNominaProductiva` sincronizando el shell).
   * 3. Si hay nómina cargada y su periodo difiere del nuevo → buscamos en los
   *    resúmenes de la empresa activa la nómina del nuevo periodo. Si existe,
   *    navegamos a su generador (mantenemos al usuario en la misma fase del
   *    flujo, pero con datos coherentes); si no existe, volvemos al Admin con
   *    el nuevo periodo activo.
   */
  private async onPeriodoActivoCambiado(periodo: string): Promise<void> {
    const nominaActual = this.nominaCargada();
    if (nominaActual && nominaActual.periodo && nominaActual.periodo !== periodo) {
      await this.redirigirAlNuevoPeriodo(periodo);
      return;
    }
    await this.inicializarSesionPeriodo(periodo);
  }

  private async redirigirAlNuevoPeriodo(periodo: string): Promise<void> {
    // Limpieza inmediata: el container se va a destruir o re-inicializar; sin
    // esto, el effect que sincroniza el shell podría dispararse con la nómina
    // vieja antes de que el router termine de navegar.
    const actual = this.nominaCargada();
    this.nominaCargada.set(null);
    this.ultimoNominaIdCargado = null;
    this.ultimoPeriodoInicializado = null;
    try {
      const resumenes = await this.nominaPeriodoService.listarResumenes();
      const candidatas = resumenes.filter((r) => {
        if (r.periodo !== periodo) return false;
        if (actual?.tipo && r.tipo !== actual.tipo) return false;
        if (actual?.naturaleza && r.naturaleza !== actual.naturaleza) return false;
        if (actual?.empresaId && r.empresaId !== actual.empresaId) return false;
        return true;
      });
      if (candidatas.length === 1) {
        await this.router.navigate(['/remuneraciones/nominas', candidatas[0]!.id]);
        return;
      }
    } catch (error) {
      console.error('[Nómina V2] No fue posible localizar la nómina del nuevo periodo', error);
    }
    await this.router.navigate(['/remuneraciones/nominas']);
  }

  private async cargarNominaProductiva(nominaPeriodoId: string): Promise<void> {
    this.nominaCargaEstado.set('loading');
    try {
      const nomina = await this.nominaPeriodoService.obtenerNomina(nominaPeriodoId);
      if (!nomina) {
        this.nominaCargada.set(null);
        this.nominaCargaEstado.set('not_found');
        return;
      }
      this.nominaCargada.set(nomina);
      this.nominaCargaEstado.set('ready');
      const contextoPrevio = this.orquestador.contextoTrazabilidad();
      this.orquestador.actualizarContextoTrazabilidad({
        ...(contextoPrevio ?? { periodo: nomina.periodo }),
        periodo: nomina.periodo,
        nominaPeriodoId: nomina.id,
      });
      if (nomina.periodo && nomina.periodo !== this.periodoActivo.getPeriodo()) {
        this.periodoActivo.setPeriodoYm(nomina.periodo);
      }
    } catch (error) {
      console.error('[Nómina V2] No fue posible cargar la nómina', error);
      this.nominaCargada.set(null);
      this.nominaCargaEstado.set('error');
    }
  }

  async manejarNominaCabeceraCambiada(event: NominaCabeceraCambiadaEvent = {}): Promise<void> {
    if (event.trazabilidad) {
      this.registrarTrazabilidadCabecera(event.trazabilidad);
    }
    const id = this.nominaPeriodoId();
    if (!id) return;
    await this.refrescarNominaCargada(id);
    if (event.registrarPasoCompletado) {
      await this.marcarPasoCompletadoYRefrescarNomina(event.registrarPasoCompletado);
    }
    if (
      event.trazabilidad?.tipo === 'reapertura'
      && this.currentStep() === 'closure'
    ) {
      this.irAPaso('calculation');
    }
  }

  manejarVerEnDotacion(trabajadorId: string): void {
    this.trabajadorDetalleDotacion.set(trabajadorId);
    this.intentarIrAPaso('dotacion');
  }

  limpiarTrabajadorDetalleDotacion(): void {
    this.trabajadorDetalleDotacion.set(null);
  }

  volverAdministrador(): void {
    void this.router.navigate(['/remuneraciones/nominas']);
  }

  private async inicializarSesionPeriodo(periodo: string): Promise<void> {
    const token = ++this.tokenInicializacionPeriodo;
    const cambioPeriodo = this.ultimoPeriodoInicializado !== periodo;
    this.ultimoPeriodoInicializado = periodo;

    // Cuando hay nómina cargada, el effect de rehidratación se encarga del
    // `currentStep` (puede aplicar `pasoVisitadoSugerido` además del
    // `pasoInicial`). Si no hay nómina, mantenemos el comportamiento
    // histórico de arrancar en `parameters` y luego ajustar al `pasoInicial`
    // según el estado de parámetros.
    const sinNomina = !this.nominaPeriodoId();

    if (cambioPeriodo) {
      if (sinNomina) {
        this.currentStep.set('parameters');
        this.orquestador.pasoActual.set('parameters');
      }
      this.orquestador.reiniciarPorCambioPeriodo(periodo);
    }
    try {
      const sesion = await this.sesionService.resolverEstadoSesion(periodo, this.nominaPeriodoId());
      if (token !== this.tokenInicializacionPeriodo) return;
      this.orquestador.estadoParametrosBase.set(sesion.estadoBase);
      if (sesion.contextoTrazabilidad) {
        this.orquestador.actualizarContextoTrazabilidad(sesion.contextoTrazabilidad);
      }
      if (sesion.origenBase && sesion.idCalculoPeriodoBase) {
        this.orquestador.registrarOrigenBaseAlAvanzar(sesion.origenBase, sesion.idCalculoPeriodoBase);
      }
      if (cambioPeriodo && sinNomina) {
        this.currentStep.set(sesion.pasoInicial);
        this.orquestador.pasoActual.set(sesion.pasoInicial);
      }
    } catch (error) {
      if (token !== this.tokenInicializacionPeriodo) return;
      console.error('[Nómina V2] No fue posible restaurar la sesión del período', error);
      if (cambioPeriodo && sinNomina) {
        this.currentStep.set('parameters');
        this.orquestador.pasoActual.set('parameters');
      }
    } finally {
      if (token !== this.tokenInicializacionPeriodo) return;
      await this.orquestador.recomputarTrazabilidad(false);
    }
  }

  ngOnDestroy(): void {
    // El helper `bindShellPageContext` libera el contexto del shell vía
    // DestroyRef, sin race con el container siguiente.
    this.orquestador.limpiarAccionPrincipal();
    this.ultimoPeriodoInicializado = null;
  }

  intentarIrAPaso(destinoPaso: PayrollStepId): void {
    if (destinoPaso === this.currentStep()) return;
    if (esPasoCongelado(destinoPaso)) return;
    // Bloqueo por accesibilidad efectiva: si el destino supera el techo
    // (estado server ∩ contenido cliente), ignoramos el click. El stepper
    // pinta el icono lock y el tooltip; aquí blindamos la lógica.
    const indiceDestino = ORDEN_PASOS_NOMINA.indexOf(destinoPaso);
    if (indiceDestino > this.indiceMaximoAccesibleEfectivo()) return;
    if (
      destinoPaso === 'parameters'
      && esRetrocesoAPaso(this.currentStep(), destinoPaso)
      && this.debeConfirmarReingresoParametros()
    ) {
      const periodo = this.orquestador.contextoTrazabilidad()?.periodo ?? this.periodoActivo.periodoYm();
      this.orquestador.modalRevisarParametros.set({
        periodo,
        periodoEtiqueta: this.sesionService.etiquetaPeriodo(periodo),
      });
      return;
    }
    if (
      destinoPaso !== 'parameters'
      && esRetrocesoAPaso(this.currentStep(), destinoPaso)
    ) {
      // Pasos 2..5 hacia atrás: modal uniforme de confirmación.
      this.orquestador.modalConfirmarRetroceso.set({
        destino: destinoPaso,
        etiquetaDestino: obtenerEtiquetaBrevePaso(destinoPaso),
      });
      return;
    }
    if (this.currentStep() === 'parameters' && esAvanceHaciaAdelante(this.currentStep(), destinoPaso)) {
      void this.ejecutarAccionPrincipalPasoActual();
      return;
    }
    this.irAPaso(destinoPaso);
  }

  /**
   * Handler de la confirmación del modal "Volver atrás". Navega al destino
   * registrado en el modal y limpia el estado.
   */
  confirmarRetrocesoAPaso(): void {
    const modal = this.orquestador.modalConfirmarRetroceso();
    this.orquestador.modalConfirmarRetroceso.set(null);
    if (!modal) return;
    this.orquestador.registrarEventoTrazabilidad(
      this.trazabilidadService.crearEventoInvalidacion(
        modal.destino,
        `Revisión en ${modal.etiquetaDestino}: puede invalidar pasos posteriores.`,
      ),
    );
    this.irAPaso(modal.destino);
  }

  cerrarModalConfirmarRetroceso(): void {
    this.orquestador.modalConfirmarRetroceso.set(null);
  }

  manejarAvanceDesdeParametros(destinoPaso: PayrollStepId): void {
    void this.persistirAvanceDesdeParametros(destinoPaso);
  }

  private async persistirAvanceDesdeParametros(destinoPaso: PayrollStepId): Promise<void> {
    await this.persistirCabeceraTrasParametros();
    await this.marcarPasoCompletadoYRefrescarNomina('parameters');
    this.orquestador.registrarEventoTrazabilidad(
      this.trazabilidadService.crearEventoLocal({
        paso: 'parameters',
        tipoEvento: 'PARAMETROS_VALIDADOS',
        descripcion: 'Parámetros del período listos para dotación.',
        integridad: { estadoIntegridad: 'registrado' },
      }),
    );
    this.irAPaso(destinoPaso);
  }

  private async persistirCabeceraTrasParametros(): Promise<void> {
    const nominaId = this.nominaPeriodoId();
    if (!nominaId) return;
    try {
      await this.nominaPeriodoService.guardarParametrosNomina(nominaId, { estado: 'borrador' });
    } catch (error) {
      console.error('[Nómina V2] No fue posible persistir cabecera tras parámetros', error);
    }
  }

  confirmarAvanceConRevision(): void {
    this.pasoParametros()?.confirmarAvanceConRevision();
  }

  confirmarGuardarBaseYContinuar(): void {
    void this.pasoParametros()?.confirmarGuardarBaseYContinuar();
  }

  confirmarMantenerBaseYContinuar(): void {
    void this.pasoParametros()?.confirmarMantenerBaseYContinuar();
  }

  solicitarActualizarBase(): void {
    this.pasoParametros()?.solicitarActualizarBase();
  }

  confirmarActualizarBaseYContinuar(): void {
    void this.pasoParametros()?.confirmarActualizarBaseYContinuar();
  }

  irAPendientesParametros(): void {
    this.pasoParametros()?.irAPendientesParametros();
  }

  confirmarReingresoParametros(): void {
    this.orquestador.modalRevisarParametros.set(null);
    this.irAPaso('parameters');
  }

  confirmarRecargaBaseParametros(): void {
    this.pasoParametros()?.confirmarRecargaBaseParametrosAdmin();
  }

  cerrarModalAccesoBaseParametros(): void {
    this.pasoParametros()?.cerrarModalAccesoBaseParametros();
  }

  cerrarModalRevisarParametros(): void {
    this.orquestador.modalRevisarParametros.set(null);
  }

  /**
   * Devuelve la referencia tipada al paso activo que implementa
   * {@link PasoNominaPort}. `null` si el paso no expone comando único
   * (`parameters` se maneja por separado vía `orquestador.ejecutarAccionPrincipal`).
   */
  private obtenerPasoActivoConComando(): PasoNominaPort | null {
    switch (this.currentStep()) {
      case 'dotacion':
        return this.pasoDotacion() ?? null;
      case 'movements':
        return this.pasoMovimientos() ?? null;
      case 'calculation':
        return this.pasoCalculo() ?? null;
      case 'closure':
        return this.pasoCierre() ?? null;
      default:
        return null;
    }
  }

  /**
   * Builder puro del contexto del shell. Lo invoca el effect que registra
   * `bindShellPageContext`; cualquier signal leído aquí dispara la próxima
   * publicación. El handler primario va por la opción `onPrimaryAction` del
   * helper (no se registra aquí).
   */
  private computeShellContext(): ShellPageContext {
    const paso = this.currentStep();
    const parametrosValidando = paso === 'parameters' && (this.pasoParametros()?.parametrosValidando() ?? false);
    const parametrosLoading = paso === 'parameters' && (this.pasoParametros()?.parametrosLoading() ?? false);
    const hayBaseGuardada = !!this.orquestador.estadoParametrosBase()?.idCalculoPeriodoBase;
    const hayDiferencias =
      this.orquestador.estadoParametrosBase()?.comparacion?.hayDiferencias === true
      || this.orquestador.estadoParametrosBase()?.estado === 'conDiferencias';
    const accionParametros = paso === 'parameters'
      ? this.accesoBaseService.resolverAccionShellParametros({
          hayBaseGuardada,
          validando: parametrosValidando,
          loading: parametrosLoading,
          hayDiferencias,
        })
      : null;
    const currentIndex = ORDEN_PASOS_NOMINA.indexOf(paso);
    const ctxNomina = this.contextoNomina();

    // Para los pasos 2..5 (`PasoNominaPort`) el CTA queda deshabilitado con
    // tooltip cuando el paso no está poblado correctamente. Parámetros
    // mantiene su rama propia (modales de acceso/diferencias) y la matriz
    // `accesoBaseService.resolverAccionShellParametros` ya define su
    // `disabled`.
    const completitud = this.pasoActualCompleto();
    const nominaCargando = this.generadorPreparando();
    const sinPermisoCierre = paso === 'closure' && !this.nominaCapabilities.puedeAccionesAdminNomina();
    const disabledPorContenido = paso !== 'parameters' && !completitud.ok;
    const tooltipPorContenido = sinPermisoCierre
      ? 'El cierre requiere rol de administración de remuneraciones.'
      : paso !== 'parameters' && !completitud.ok
        ? (completitud.razon ?? null)
        : null;
    const operacionEnCurso = this.pasoOperacionEnCurso();

    return {
      breadcrumbs: [
        { label: 'Remuneraciones', path: '/remuneraciones/nominas' },
        { label: 'Administrador de nóminas', path: '/remuneraciones/nominas' },
        { label: this.pageTitle() },
      ],
      pageTitle: this.pageTitle(),
      pageSubtitle: this.pageSubtitle(),
      statusChip: ctxNomina.estadoLabel
        ? {
            label: `${ctxNomina.estadoLabel} · Paso ${currentIndex + 1}/${ORDEN_PASOS_NOMINA.length}`,
            tone: ctxNomina.estadoTone,
          }
        : {
            label: `Paso ${currentIndex + 1} de ${ORDEN_PASOS_NOMINA.length}`,
            tone: 'neutral',
          },
      primaryAction: !this.puedeEscribirNomina() ? undefined : {
        label: accionParametros?.label ?? this.primaryActionLabel(),
        disabled: (accionParametros?.disabled ?? false)
          || disabledPorContenido
          || nominaCargando
          || sinPermisoCierre,
        loading: nominaCargando
          || (paso === 'parameters' ? parametrosValidando : operacionEnCurso),
        actionId: `nomina-mensual-v2-${paso}`,
        tooltip: tooltipPorContenido,
      },
    };
  }

  private pasoActivoEnCargaInicial(): boolean {
    const paso = this.currentStep();
    switch (paso) {
      case 'parameters': {
        const componente = this.pasoParametros();
        if (!componente) return true;
        return componente.parametrosLoading() || componente.parametrosValidando();
      }
      case 'dotacion': {
        const componente = this.pasoDotacion();
        if (!componente) return true;
        return componente.loading();
      }
      case 'movements': {
        const componente = this.pasoMovimientos();
        if (!componente) return true;
        return componente.loading() && componente.filasTrabajadores().length === 0;
      }
      case 'calculation': {
        const componente = this.pasoCalculo();
        if (!componente) return true;
        return componente.cargando() && !componente.calculoDisponible();
      }
      case 'closure': {
        const componente = this.pasoCierre();
        if (!componente) return true;
        return componente.cargando();
      }
      default:
        return false;
    }
  }

  private pasoOperacionEnCurso(): boolean {
    const paso = this.currentStep();
    switch (paso) {
      case 'dotacion':
        return this.pasoDotacion()?.confirmando() ?? false;
      case 'movements':
        return this.pasoMovimientos()?.aplicando() ?? false;
      case 'calculation':
        return this.pasoCalculo()?.calculando() ?? false;
      case 'closure':
        return this.pasoCierre()?.ejecutando() ?? false;
      default:
        return false;
    }
  }

  /**
   * Handler del CTA del shell (AG-NAV-03). Para `parameters` mantiene el flujo
   * existente vía orquestador (modales de acceso/diferencias). Para los pasos
   * 2 a 5 delega en `ejecutarAvancePaso` (función pura del facade) que invoca
   * `avanzar()` del paso activo. Si el comando responde `{ok:true}` y existe
   * un paso siguiente, navega; si responde `{ok:false}` publica la razón en
   * `ayudaAvance`. `closure` no navega (paso terminal).
   */
  async ejecutarAccionPrincipalPasoActual(): Promise<void> {
    const pasoActivo = this.currentStep();
    if (esPasoCongelado(pasoActivo)) return;
    if (pasoActivo === 'parameters') {
      if (this.parametrosPasoOcupado()) return;
      this.orquestador.ejecutarAccionPrincipal();
      return;
    }
    if (pasoActivo === 'closure') {
      const paso = this.obtenerPasoActivoConComando();
      const { resultado } = await ejecutarAvancePaso(pasoActivo, paso);
      if (!resultado.ok) {
        const tono = resultado.razon === RAZON_CIERRE_MODAL_PENDIENTE
          || resultado.razon === RAZON_VALIDACION_MODAL_PENDIENTE
          ? 'revision'
          : 'bloqueo';
        this.orquestador.establecerAyudaAvance(resultado.razon, tono);
        return;
      }
      this.orquestador.establecerAyudaAvance(null);
      return;
    }
    const paso = this.obtenerPasoActivoConComando();
    const { resultado, siguientePaso } = await ejecutarAvancePaso(pasoActivo, paso);
    if (!resultado.ok) {
      this.orquestador.establecerAyudaAvance(resultado.razon, 'bloqueo');
      return;
    }
    this.orquestador.establecerAyudaAvance(null);
    if (pasoActivo === 'dotacion') {
      this.orquestador.registrarEventoTrazabilidad(
        this.trazabilidadService.crearEventoLocal({
          paso: 'dotacion',
          tipoEvento: 'EMPLEADOS_VALIDADOS',
          descripcion: 'Dotación confirmada para el período.',
          integridad: { estadoIntegridad: 'registrado' },
        }),
      );
    } else if (pasoActivo === 'movements') {
      this.orquestador.registrarEventoTrazabilidad(
        this.trazabilidadService.crearEventoLocal({
          paso: 'movements',
          tipoEvento: 'NOVEDADES_REGISTRADAS',
          descripcion: 'Movimientos del período listos para cálculo.',
          integridad: { estadoIntegridad: 'registrado' },
        }),
      );
    }
    if (pasoActivo === 'calculation' && siguientePaso === 'closure') {
      const autoValidacion = await this.autoValidarAntesDeCierre();
      if (!autoValidacion.ok) {
        this.orquestador.establecerAyudaAvance(autoValidacion.razon, 'bloqueo');
        return;
      }
    }
    await this.marcarPasoCompletadoYRefrescarNomina(pasoActivo);
    if (siguientePaso) {
      this.irAPaso(siguientePaso);
    }
  }

  /**
   * Transición calculada → validada al pasar de Cálculo a Cierre.
   * Si hay incidencias pendientes, igual permite entrar a Cierre para resolverlas.
   */
  private async autoValidarAntesDeCierre(): Promise<ResultadoAvancePaso> {
    const id = this.nominaPeriodoId();
    if (!id) {
      return { ok: false, razon: 'No hay nómina activa.' };
    }
    const nomina = this.nominaCargada();
    if (!nomina) {
      return { ok: false, razon: 'Cargando la nómina.' };
    }
    if (['validada', 'aprobada', 'liquidada', 'cerrada'].includes(nomina.estado)) {
      return { ok: true };
    }
    if (nomina.estado !== 'calculada') {
      return { ok: false, razon: 'La nómina no está lista para cerrar.' };
    }
    try {
      const resumen = await this.nominaPeriodoService.obtenerResumenValidacionNomina(id);
      if (!resumen.puedeValidar) {
        // RRHH resuelve en el panel de incidencias del paso Cierre.
        return { ok: true };
      }
      await this.nominaPeriodoService.validarNomina(id);
      this.orquestador.registrarEventoTrazabilidad(
        this.trazabilidadService.crearEventoLocal({
          paso: 'closure',
          tipoEvento: 'PRENOMINA_VALIDADA',
          descripcion: 'Pre-nómina validada para cierre.',
          integridad: { estadoIntegridad: 'registrado' },
        }),
      );
      await this.refrescarNominaCargada(id);
      return { ok: true };
    } catch (error) {
      const mensaje = mensajeErrorParaUsuario(error, 'validar la nómina');
      // Aun con error de validación, permitir Cierre para ver/resolver incidencias.
      this.orquestador.establecerAyudaAvance(mensaje, 'bloqueo');
      return { ok: true };
    }
  }

  /**
   * Persiste el paso recién completado (monótono) y refresca la cabecera de la
   * nómina para que el stepper derive `completed` desde `estado` +
   * `maximoPasoCompletado` sin esperar un reload manual.
   */
  private async marcarPasoCompletadoYRefrescarNomina(paso: PayrollStepId): Promise<void> {
    const id = this.nominaPeriodoId();
    if (!id) return;
    await this.nominaPeriodoService.registrarPasoCompletado(id, paso);
    await this.refrescarNominaCargada(id, paso);
  }

  private async refrescarNominaCargada(
    nominaPeriodoId: string,
    pasoCompletadoFallback?: PayrollStepId,
  ): Promise<void> {
    try {
      const nomina = await this.nominaPeriodoService.obtenerNomina(nominaPeriodoId);
      if (nomina) {
        this.nominaCargada.set(nomina);
        return;
      }
    } catch (error) {
      console.warn('[Nómina V2] No fue posible refrescar cabecera tras avance', error);
    }

    if (!pasoCompletadoFallback) return;
    const actual = this.nominaCargada();
    if (!actual) return;
    const idxNuevo = ORDEN_PASOS_NOMINA.indexOf(pasoCompletadoFallback);
    const idxActual = actual.maximoPasoCompletado
      ? ORDEN_PASOS_NOMINA.indexOf(actual.maximoPasoCompletado)
      : -1;
    if (idxNuevo > idxActual) {
      this.nominaCargada.set({ ...actual, maximoPasoCompletado: pasoCompletadoFallback });
    }
  }

  private debeConfirmarReingresoParametros(): boolean {
    const idxActual = ORDEN_PASOS_NOMINA.indexOf(this.currentStep());
    const idxParametros = ORDEN_PASOS_NOMINA.indexOf('parameters');
    if (idxActual <= idxParametros) return false;
    return this.orquestador.parametrosPreparados();
  }

  private irAPaso(destinoPaso: PayrollStepId): void {
    this.orquestador.limpiarModalesAvance();
    if (destinoPaso !== 'parameters' && destinoPaso !== 'dotacion') {
      this.orquestador.establecerAyudaAvance(null);
    }
    if (this.bannerHandoff() && destinoPaso !== this.currentStep()) {
      this.bannerHandoff.set(null);
      this.pasoForzadoCreacion = null;
    }
    this.currentStep.set(destinoPaso);
    this.orquestador.pasoActual.set(destinoPaso);
  }

  private registrarTrazabilidadCabecera(
    evento: NonNullable<NominaCabeceraCambiadaEvent['trazabilidad']>,
  ): void {
    if (evento.tipo === 'cierre') {
      this.orquestador.registrarEventoTrazabilidad(
        this.trazabilidadService.crearEventoLocal({
          paso: 'closure',
          tipoEvento: 'PRENOMINA_APROBADA',
          descripcion: evento.motivo.trim() || 'Nómina cerrada operativamente.',
          integridad: { estadoIntegridad: 'registrado' },
        }),
      );
      return;
    }
    if (evento.tipo === 'aprobacion' || evento.tipo === 'validacion' || evento.tipo === 'liquidaciones') {
      this.orquestador.registrarEventoTrazabilidad(
        this.trazabilidadService.crearEventoLocal({
          paso: 'closure',
          tipoEvento: evento.tipo === 'validacion' ? 'PRENOMINA_VALIDADA' : 'PRENOMINA_APROBADA',
          descripcion: evento.motivo.trim() || 'Cabecera de nómina actualizada.',
          integridad: { estadoIntegridad: 'registrado' },
        }),
      );
      return;
    }
    this.orquestador.registrarEventoTrazabilidad(
      this.trazabilidadService.crearEventoInvalidacion(
        'closure',
        evento.motivo.trim() || 'Nómina reabierta para edición.',
      ),
    );
  }
}

/** Normaliza query `paso` a id canónico del stepper (alias `cierre` → `closure`). */
function normalizarPasoQuery(raw: string | null): PayrollStepId | null {
  if (!raw) return null;
  const alias = raw === 'cierre' ? 'closure' : raw;
  return (ORDEN_PASOS_NOMINA as readonly string[]).includes(alias)
    ? (alias as PayrollStepId)
    : null;
}
