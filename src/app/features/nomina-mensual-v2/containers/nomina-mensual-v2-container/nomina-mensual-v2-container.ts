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
import { PeriodoActivoService } from '../../../../core/services/periodo-activo.service';
import { NominaPeriodoService } from '../../../nomina-mensual/services/nomina-periodo.service';
import type { NominaPeriodo } from '../../../nomina-mensual/models/nomina-periodo.models';
import { payrollSteps } from '../../data/nomina-mensual-v2.mock';
import type { PayrollStepId } from '../../models/nomina-mensual-v2.models';
import type { TipoPendienteEmpleado } from '../../presenters/nomina-empleados-validacion.presenter';

import { NominaMensualV2OverlaysComponent } from './components/nomina-mensual-v2-overlays/nomina-mensual-v2-overlays.component';
import { NominaMensualV2PasoAlcanceComponent } from './components/nomina-mensual-v2-paso-alcance/nomina-mensual-v2-paso-alcance.component';
import { NominaMensualV2PasoCalculoComponent } from './components/nomina-mensual-v2-paso-calculo/nomina-mensual-v2-paso-calculo.component';
import { NominaMensualV2PasoCierreComponent } from './components/nomina-mensual-v2-paso-cierre/nomina-mensual-v2-paso-cierre.component';
import { NominaMensualV2PasoDotacionComponent } from './components/nomina-mensual-v2-paso-dotacion/nomina-mensual-v2-paso-dotacion.component';
import { NominaMensualV2PasoMovimientosComponent } from './components/nomina-mensual-v2-paso-movimientos/nomina-mensual-v2-paso-movimientos.component';
import { NominaMensualV2PasoValidacionComponent } from './components/nomina-mensual-v2-paso-validacion/nomina-mensual-v2-paso-validacion.component';
import { NominaMensualV2PasoEmpleadosComponent } from './components/nomina-mensual-v2-paso-empleados/nomina-mensual-v2-paso-empleados.component';
import { NominaMensualV2PasoParametrosComponent } from './components/nomina-mensual-v2-paso-parametros/nomina-mensual-v2-paso-parametros.component';
import { NominaMensualV2StepperComponent } from './components/nomina-mensual-v2-stepper/nomina-mensual-v2-stepper.component';
import {
  ORDEN_PASOS_NOMINA,
  ejecutarAvancePaso,
  esAvanceHaciaAdelante,
  esPasoCongelado,
  esRetrocesoAPaso,
  obtenerEtiquetaAccionPrincipal,
  obtenerSubtituloPaso,
  obtenerTituloPaso,
  type PasoNominaPort,
} from './facade/nomina-mensual-v2-navegacion';
import { NominaMensualV2TrazabilidadService } from '../../services/nomina-mensual-v2-trazabilidad.service';
import { NominaMensualV2SesionService } from '../../services/nomina-mensual-v2-sesion.service';
import { NominaParametrosBaseAccesoService } from '../../services/nomina-parametros-base-acceso.service';
import { NominaMensualV2OrquestadorPort } from './facade/nomina-mensual-v2-orquestador.port';
import { NominaMensualV2TrazabilidadDrawerComponent } from './components/nomina-mensual-v2-trazabilidad-drawer/nomina-mensual-v2-trazabilidad-drawer.component';
import { NominaMensualV2TrazabilidadModalComponent } from './components/nomina-mensual-v2-trazabilidad-modal/nomina-mensual-v2-trazabilidad-modal.component';

@Component({
  selector: 'app-nomina-mensual-v2-container',
  standalone: true,
  imports: [
    NominaMensualV2StepperComponent,
    NominaMensualV2PasoParametrosComponent,
    NominaMensualV2PasoDotacionComponent,
    NominaMensualV2PasoMovimientosComponent,
    NominaMensualV2PasoCalculoComponent,
    NominaMensualV2PasoValidacionComponent,
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

  private readonly pasoParametros = viewChild(NominaMensualV2PasoParametrosComponent);
  private readonly pasoAlcance = viewChild(NominaMensualV2PasoAlcanceComponent);
  private readonly pasoEmpleados = viewChild(NominaMensualV2PasoEmpleadosComponent);
  private readonly pasoDotacion = viewChild(NominaMensualV2PasoDotacionComponent);
  private readonly pasoMovimientos = viewChild(NominaMensualV2PasoMovimientosComponent);
  private readonly pasoCalculo = viewChild(NominaMensualV2PasoCalculoComponent);
  private readonly pasoValidacion = viewChild(NominaMensualV2PasoValidacionComponent);
  private readonly pasoCierre = viewChild(NominaMensualV2PasoCierreComponent);
  private tokenInicializacionPeriodo = 0;
  private ultimoPeriodoInicializado: string | null = null;
  private ultimoNominaIdCargado: string | null = null;

  readonly steps = payrollSteps;
  readonly currentStep = signal<PayrollStepId>('parameters');
  readonly nominaPeriodoId = signal<string | null>(null);
  readonly nominaCargada = signal<NominaPeriodo | null>(null);

  readonly pageTitle = computed(() => obtenerTituloPaso(this.currentStep()));
  readonly pageSubtitle = computed(() => obtenerSubtituloPaso(this.currentStep()));
  readonly primaryActionLabel = computed(() => obtenerEtiquetaAccionPrincipal(this.currentStep()));

  readonly parametrosPasoOcupado = computed(() => {
    if (this.currentStep() !== 'parameters') return false;
    const paso = this.pasoParametros();
    return (paso?.parametrosLoading() ?? false) || (paso?.parametrosValidando() ?? false);
  });

  constructor() {
    // Effect en constructor para que se limpie con DestroyRef al cerrar el
    // container. Importante: `bindShellPageContext` ya crea su propio effect
    // que reacciona a los signals leídos por `computeShellContext()`.
    effect(() => {
      const periodo = this.periodoActivo.periodoYm();
      void this.onPeriodoActivoCambiado(periodo);
    });

    bindShellPageContext(this.destroyRef, () => this.computeShellContext(), {
      onPrimaryAction: () => {
        void this.ejecutarAccionPrincipalPasoActual();
      },
    });
  }

  ngOnInit(): void {
    // Reinicio defensivo: si quedó residuo de una sesión anterior, lo limpiamos
    // antes de que `bindShellPageContext` empiece a publicar contexto.
    this.currentStep.set('parameters');
    this.ultimoPeriodoInicializado = null;
    this.ultimoNominaIdCargado = null;
    this.orquestador.vincularTrazabilidadService(this.trazabilidadService);
    this.route.paramMap.subscribe((params) => {
      const id = params.get('nominaPeriodoId');
      this.nominaPeriodoId.set(id);
      if (id && id !== this.ultimoNominaIdCargado) {
        this.ultimoNominaIdCargado = id;
        void this.cargarNominaProductiva(id);
      }
    });
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
    this.nominaCargada.set(null);
    this.ultimoNominaIdCargado = null;
    this.ultimoPeriodoInicializado = null;
    try {
      const resumenes = await this.nominaPeriodoService.listarResumenes();
      const equivalente = resumenes.find((r) => r.periodo === periodo);
      if (equivalente) {
        await this.router.navigate(['/remuneraciones/nominas', equivalente.id, 'generador']);
        return;
      }
    } catch (error) {
      console.error('[Nómina V2] No fue posible localizar la nómina del nuevo periodo', error);
    }
    await this.router.navigate(['/remuneraciones/nominas']);
  }

  private async cargarNominaProductiva(nominaPeriodoId: string): Promise<void> {
    try {
      const nomina = await this.nominaPeriodoService.obtenerNomina(nominaPeriodoId);
      if (!nomina) {
        this.nominaCargada.set(null);
        return;
      }
      this.nominaCargada.set(nomina);
      if (nomina.periodo && nomina.periodo !== this.periodoActivo.getPeriodo()) {
        this.periodoActivo.setPeriodoYm(nomina.periodo);
      }
    } catch (error) {
      console.error('[Nómina V2] No fue posible cargar la nómina', error);
      this.nominaCargada.set(null);
    }
  }

  private async inicializarSesionPeriodo(periodo: string): Promise<void> {
    const token = ++this.tokenInicializacionPeriodo;
    const cambioPeriodo = this.ultimoPeriodoInicializado !== periodo;
    this.ultimoPeriodoInicializado = periodo;

    if (cambioPeriodo) {
      this.currentStep.set('parameters');
      this.orquestador.pasoActual.set('parameters');
      this.orquestador.reiniciarPorCambioPeriodo(periodo);
    }
    try {
      const sesion = await this.sesionService.resolverEstadoSesion(periodo);
      if (token !== this.tokenInicializacionPeriodo) return;
      this.orquestador.estadoParametrosBase.set(sesion.estadoBase);
      if (sesion.contextoTrazabilidad) {
        this.orquestador.actualizarContextoTrazabilidad(sesion.contextoTrazabilidad);
      }
      if (sesion.origenBase && sesion.idCalculoPeriodoBase) {
        this.orquestador.registrarOrigenBaseAlAvanzar(sesion.origenBase, sesion.idCalculoPeriodoBase);
      }
      if (cambioPeriodo) {
        this.currentStep.set(sesion.pasoInicial);
        this.orquestador.pasoActual.set(sesion.pasoInicial);
      }
    } catch (error) {
      if (token !== this.tokenInicializacionPeriodo) return;
      console.error('[Nómina V2] No fue posible restaurar la sesión del período', error);
      if (cambioPeriodo) {
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
    if (this.currentStep() === 'parameters' && esAvanceHaciaAdelante(this.currentStep(), destinoPaso)) {
      void this.ejecutarAccionPrincipalPasoActual();
      return;
    }
    this.irAPaso(destinoPaso);
  }

  manejarAvanceDesdeParametros(destinoPaso: PayrollStepId): void {
    void this.persistirCabeceraTrasParametros();
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

  manejarAvanceDesdeAlcance(): void {
    this.irAPaso('movements');
  }

  irAPasoAlcance(): void {
    this.irAPaso('dotacion');
  }

  manejarAvanceDesdeEmpleados(): void {
    this.irAPaso('movements');
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

  confirmarAvanceConAdvertenciaAlcance(): void {
    this.pasoAlcance()?.confirmarAvanceConAdvertencia();
  }

  confirmarAvanceConAdvertenciaEmpleados(): void {
    this.pasoEmpleados()?.confirmarAvanceConAdvertencia();
  }

  verEnGrillaEmpleados(tipo: TipoPendienteEmpleado): void {
    this.pasoEmpleados()?.aplicarFiltroChecklistEmpleados(tipo);
  }

  reintentarValidacionEmpleados(): void {
    this.pasoEmpleados()?.ejecutarAccionPrincipal();
  }

  irAPendientesEmpleados(): void {
    this.pasoEmpleados()?.irAPendientesEmpleados();
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
      case 'validation':
        return this.pasoValidacion() ?? null;
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
    const accionParametros = paso === 'parameters'
      ? this.accesoBaseService.resolverAccionShellParametros({
          hayBaseGuardada,
          validando: parametrosValidando,
          loading: parametrosLoading,
        })
      : null;
    const currentIndex = ORDEN_PASOS_NOMINA.indexOf(paso);

    return {
      breadcrumbs: [
        { label: 'Nómina', path: '/remuneraciones/proceso-mensual' },
        { label: paso === 'parameters' ? 'Parámetros' : this.pageTitle() },
      ],
      pageTitle: this.pageTitle(),
      pageSubtitle: this.pageSubtitle(),
      statusChip: {
        label: `Paso ${currentIndex + 1} de ${ORDEN_PASOS_NOMINA.length}`,
        tone: 'neutral',
      },
      primaryAction: {
        label: accionParametros?.label ?? this.primaryActionLabel(),
        disabled: accionParametros?.disabled ?? false,
        loading: paso === 'parameters' ? parametrosValidando : false,
        actionId: `nomina-mensual-v2-${paso}`,
      },
    };
  }

  /**
   * Handler del CTA del shell (AG-NAV-03). Para `parameters` mantiene el flujo
   * existente vía orquestador (modales de acceso/diferencias). Para los pasos
   * 2 a 6 delega en `ejecutarAvancePaso` (función pura del facade) que invoca
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
    const paso = this.obtenerPasoActivoConComando();
    const { resultado, siguientePaso } = await ejecutarAvancePaso(pasoActivo, paso);
    if (!resultado.ok) {
      this.orquestador.establecerAyudaAvance(resultado.razon, 'bloqueo');
      return;
    }
    this.orquestador.establecerAyudaAvance(null);
    if (siguientePaso) {
      this.irAPaso(siguientePaso);
    }
  }

  goLegacy(): void {
    void this.router.navigate(['/remuneraciones/proceso-mensual']);
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
    this.currentStep.set(destinoPaso);
    this.orquestador.pasoActual.set(destinoPaso);
  }
}
