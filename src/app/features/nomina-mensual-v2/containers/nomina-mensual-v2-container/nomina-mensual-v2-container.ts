import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  ViewEncapsulation,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { Router } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';

import { ShellPageContextService } from '../../../../layout/shell-page-context.service';
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
  obtenerEtiquetaAccionPrincipal,
  obtenerSubtituloPaso,
  obtenerTituloPaso,
} from './facade/nomina-mensual-v2-navegacion';
import { NominaMensualV2TrazabilidadService } from '../../services/nomina-mensual-v2-trazabilidad.service';
import { NominaMensualV2OrquestadorPort } from './facade/nomina-mensual-v2-orquestador.port';
import { NominaMensualV2TrazabilidadDrawerComponent } from './components/nomina-mensual-v2-trazabilidad-drawer/nomina-mensual-v2-trazabilidad-drawer.component';
import { NominaMensualV2TrazabilidadModalComponent } from './components/nomina-mensual-v2-trazabilidad-modal/nomina-mensual-v2-trazabilidad-modal.component';

@Component({
  selector: 'app-nomina-mensual-v2-container',
  standalone: true,
  imports: [
    LucideAngularModule,
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
  private readonly router = inject(Router);
  private readonly shellContext = inject(ShellPageContextService);
  private readonly trazabilidadService = inject(NominaMensualV2TrazabilidadService);
  readonly orquestador = inject(NominaMensualV2OrquestadorPort);

  private readonly pasoParametros = viewChild(NominaMensualV2PasoParametrosComponent);
  private readonly pasoAlcance = viewChild(NominaMensualV2PasoAlcanceComponent);
  private readonly pasoEmpleados = viewChild(NominaMensualV2PasoEmpleadosComponent);

  readonly steps = payrollSteps;
  readonly currentStep = signal<PayrollStepId>('parameters');

  readonly pageTitle = computed(() => obtenerTituloPaso(this.currentStep()));
  readonly pageSubtitle = computed(() => obtenerSubtituloPaso(this.currentStep()));
  readonly primaryActionLabel = computed(() => obtenerEtiquetaAccionPrincipal(this.currentStep()));

  ngOnInit(): void {
    this.shellContext.setBindingActive(true);
    this.orquestador.pasoActual.set(this.currentStep());
    this.orquestador.vincularTrazabilidadService(this.trazabilidadService);
    void this.orquestador.recomputarTrazabilidad();
    this.syncShellContext();
  }

  abrirTrazabilidadCompleta(): void {
    this.orquestador.abrirTrazabilidadCompleta();
  }

  ngOnDestroy(): void {
    this.shellContext.setBindingActive(false);
    this.shellContext.clearContext();
    this.orquestador.limpiarAccionPrincipal();
  }

  intentarIrAPaso(destinoPaso: PayrollStepId): void {
    if (destinoPaso === this.currentStep()) return;
    if (this.currentStep() === 'parameters' && esAvanceHaciaAdelante(this.currentStep(), destinoPaso)) {
      this.pasoParametros()?.evaluarAvance(destinoPaso);
      return;
    }
    if (this.currentStep() === 'scope' && esAvanceHaciaAdelante(this.currentStep(), destinoPaso)) {
      if (destinoPaso === 'employees') {
        this.pasoAlcance()?.ejecutarAccionPrincipal();
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

  irAPendientesParametros(): void {
    this.pasoParametros()?.irAPendientesParametros();
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
    const pasoParametros = this.pasoParametros();
    const parametrosValidando = paso === 'parameters' && (pasoParametros?.parametrosValidando() ?? false);
    const parametrosLoading = paso === 'parameters' && (pasoParametros?.parametrosLoading() ?? false);
    const currentIndex = ORDEN_PASOS_NOMINA.indexOf(paso);
    const isValidationBlocked = paso === 'validation';

    this.shellContext.setContext({
      breadcrumbs: [
        { label: 'Nómina', path: '/remuneraciones/proceso-mensual' },
        { label: paso === 'parameters' ? 'Parámetros' : this.pageTitle() },
      ],
      pageTitle: this.pageTitle(),
      pageSubtitle: this.pageSubtitle(),
      statusChip: {
        label: `Paso ${currentIndex + 1} de ${ORDEN_PASOS_NOMINA.length}`,
        tone: isValidationBlocked ? 'warning' : 'neutral',
      },
      primaryAction: {
        label: paso === 'parameters' && parametrosValidando ? 'Validando...' : this.primaryActionLabel(),
        disabled: isValidationBlocked || parametrosValidando || parametrosLoading,
        loading: paso === 'parameters' ? parametrosValidando : false,
        actionId: `nomina-mensual-v2-${paso}`,
      },
    });

    this.shellContext.registerPrimaryActionHandler(() => {
      if (paso === 'parameters' || paso === 'scope' || paso === 'employees') {
        this.orquestador.ejecutarAccionPrincipal();
        return;
      }
      if (paso === 'validation' || paso === 'payslips') return;
      this.nextStep();
    });
  }

  goLegacy(): void {
    void this.router.navigate(['/remuneraciones/proceso-mensual']);
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
