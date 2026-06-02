import {
  ChangeDetectionStrategy,
  Component,
  Injector,
  OnDestroy,
  OnInit,
  ViewEncapsulation,
  computed,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { Router } from '@angular/router';

import { ShellPageContextService } from '../../../../layout/shell-page-context.service';
import { PeriodoActivoService } from '../../../../core/services/periodo-activo.service';
import { payrollSteps } from '../../data/nomina-mensual-v2.mock';
import type { PayrollStepId } from '../../models/nomina-mensual-v2.models';
import type { TipoPendienteEmpleado } from '../../presenters/nomina-empleados-validacion.presenter';

import { NominaMensualV2OverlaysComponent } from './components/nomina-mensual-v2-overlays/nomina-mensual-v2-overlays.component';
import { NominaMensualV2PasoAlcanceComponent } from './components/nomina-mensual-v2-paso-alcance/nomina-mensual-v2-paso-alcance.component';
import { NominaMensualV2PasoEmpleadosComponent } from './components/nomina-mensual-v2-paso-empleados/nomina-mensual-v2-paso-empleados.component';
import { NominaMensualV2PasoParametrosComponent } from './components/nomina-mensual-v2-paso-parametros/nomina-mensual-v2-paso-parametros.component';
import { NominaMensualV2PasosDemostracionComponent } from './components/nomina-mensual-v2-pasos-demostracion/nomina-mensual-v2-pasos-demostracion.component';
import { NominaMensualV2StepperComponent } from './components/nomina-mensual-v2-stepper/nomina-mensual-v2-stepper.component';
import {
  ORDEN_PASOS_NOMINA,
  esAvanceHaciaAdelante,
  esRetrocesoAPaso,
  obtenerEtiquetaAccionPrincipal,
  obtenerSubtituloPaso,
  obtenerTituloPaso,
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
    NominaMensualV2PasoAlcanceComponent,
    NominaMensualV2PasoEmpleadosComponent,
    NominaMensualV2PasosDemostracionComponent,
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
  private readonly injector = inject(Injector);
  private readonly router = inject(Router);
  private readonly shellContext = inject(ShellPageContextService);
  private readonly periodoActivo = inject(PeriodoActivoService);
  private readonly trazabilidadService = inject(NominaMensualV2TrazabilidadService);
  private readonly sesionService = inject(NominaMensualV2SesionService);
  readonly orquestador = inject(NominaMensualV2OrquestadorPort);
  private readonly accesoBaseService = inject(NominaParametrosBaseAccesoService);

  private readonly pasoParametros = viewChild(NominaMensualV2PasoParametrosComponent);
  private readonly pasoAlcance = viewChild(NominaMensualV2PasoAlcanceComponent);
  private readonly pasoEmpleados = viewChild(NominaMensualV2PasoEmpleadosComponent);
  private tokenInicializacionPeriodo = 0;
  private ultimoPeriodoInicializado: string | null = null;

  readonly steps = payrollSteps;
  readonly currentStep = signal<PayrollStepId>('parameters');

  readonly pageTitle = computed(() => obtenerTituloPaso(this.currentStep()));
  readonly pageSubtitle = computed(() => obtenerSubtituloPaso(this.currentStep()));
  readonly primaryActionLabel = computed(() => obtenerEtiquetaAccionPrincipal(this.currentStep()));
  readonly parametrosPasoOcupado = computed(() => {
    if (this.currentStep() !== 'parameters') return false;
    const paso = this.pasoParametros();
    return (paso?.parametrosLoading() ?? false) || (paso?.parametrosValidando() ?? false);
  });

  ngOnInit(): void {
    this.shellContext.setBindingActive(true);
    this.orquestador.vincularTrazabilidadService(this.trazabilidadService);
    effect(() => {
      const periodo = this.periodoActivo.periodoYm();
      void this.inicializarSesionPeriodo(periodo);
    }, { injector: this.injector });
    effect(() => {
      this.currentStep();
      this.orquestador.estadoParametrosBase();
      this.pasoParametros()?.parametrosLoading();
      this.pasoParametros()?.parametrosValidando();
      this.syncShellContext();
    }, { injector: this.injector });
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
    this.syncShellContext();
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
      this.syncShellContext();
    }
  }

  ngOnDestroy(): void {
    this.shellContext.setBindingActive(false);
    this.shellContext.clearContext();
    this.orquestador.limpiarAccionPrincipal();
    this.ultimoPeriodoInicializado = null;
  }

  intentarIrAPaso(destinoPaso: PayrollStepId): void {
    if (destinoPaso === this.currentStep()) return;
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
      this.ejecutarAccionPrincipalPasoActual();
      return;
    }
    if (this.currentStep() === 'scope' && esAvanceHaciaAdelante(this.currentStep(), destinoPaso)) {
      if (destinoPaso === 'employees') {
        this.ejecutarAccionPrincipalPasoActual();
      } else {
        this.irAPaso(destinoPaso);
      }
      return;
    }
    this.irAPaso(destinoPaso);
  }

  manejarAvanceDesdeParametros(destinoPaso: PayrollStepId): void {
    this.irAPaso(destinoPaso);
  }

  manejarAvanceDesdeAlcance(): void {
    this.irAPaso('employees');
  }

  irAPasoAlcance(): void {
    this.irAPaso('scope');
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

  nextStep(): void {
    const index = ORDEN_PASOS_NOMINA.indexOf(this.currentStep());
    if (index < ORDEN_PASOS_NOMINA.length - 1) {
      this.intentarIrAPaso(ORDEN_PASOS_NOMINA[index + 1]);
    }
  }

  syncShellContext(): void {
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

    this.shellContext.setContext({
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
    });

    this.shellContext.registerPrimaryActionHandler(() => {
      this.ejecutarAccionPrincipalPasoActual();
    });
  }

  ejecutarAccionPrincipalPasoActual(): void {
    const pasoActivo = this.currentStep();
    if (pasoActivo === 'parameters') {
      if (this.parametrosPasoOcupado()) return;
      this.orquestador.ejecutarAccionPrincipal();
      return;
    }
    if (pasoActivo === 'scope' || pasoActivo === 'employees') {
      this.orquestador.ejecutarAccionPrincipal();
      return;
    }
    if (pasoActivo === 'calculation' || pasoActivo === 'validation' || pasoActivo === 'approval' || pasoActivo === 'payslips') {
      this.orquestador.ejecutarAccionPrincipal();
      return;
    }
    this.nextStep();
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
    if (destinoPaso !== 'parameters' && destinoPaso !== 'scope' && destinoPaso !== 'employees') {
      this.orquestador.establecerAyudaAvance(null);
    }
    this.currentStep.set(destinoPaso);
    this.orquestador.pasoActual.set(destinoPaso);
    this.syncShellContext();
  }
}
