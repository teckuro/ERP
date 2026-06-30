import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Output,
  ViewEncapsulation,
  computed,
  inject,
  input,
} from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';

import type { PayrollStep, PayrollStepId, PayrollStepStatus } from '../../../../models/nomina-mensual-v2.models';
import type { NominaPeriodo } from '../../../../../nomina-mensual/models/nomina-periodo.models';
import { AuthService } from '../../../../../../core/auth/auth.service';
import { TooltipComponent } from '../../../../../../shared/components/ui/tooltip/tooltip.component';
import { construirVistasStepper } from '../../../../presenters/nomina-stepper-trazabilidad.presenter';
import {
  ORDEN_PASOS_NOMINA,
  esAvanceHaciaAdelante,
  esPasoCongelado,
  obtenerEstadoPaso,
  obtenerEtiquetaBrevePaso,
  pasoAnteriorDe,
  tooltipPasoCongelado,
  tooltipPasoNoAccesible,
} from '../../facade/nomina-mensual-v2-navegacion';
import { NominaMensualV2OrquestadorPort } from '../../facade/nomina-mensual-v2-orquestador.port';

@Component({
  selector: 'app-nomina-mensual-v2-stepper',
  standalone: true,
  imports: [LucideAngularModule, TooltipComponent],
  templateUrl: './nomina-mensual-v2-stepper.component.html',
  styleUrl: './nomina-mensual-v2-stepper.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class NominaMensualV2StepperComponent {
  readonly pasoActual = input.required<PayrollStepId>();
  readonly steps = input.required<PayrollStep[]>();
  readonly avanceDesdePasoActualBloqueado = input(false);
  /**
   * Nómina persistida del período activo. Cuando está disponible, el stepper
   * deriva el estado de cada paso (`completed` / `active` / `pending`) desde
   * `nomina.estado` y `evidenciaCalculo` (AG-NAV-02). Si es `null` (carga
   * inicial o estado degradado) los pasos no-activos quedan `pending`.
   */
  readonly nomina = input<NominaPeriodo | null>(null);

  /**
   * Índice máximo accesible efectivo del flujo (estado server-side ∩
   * contenido cliente). Pasos cuyo índice supera este valor quedan
   * deshabilitados con icono `lock` y tooltip explicativo. El container
   * computa este valor con `indiceMaximoPasoAccesibleEfectivo`.
   *
   * Default `Number.MAX_SAFE_INTEGER` para no introducir regresiones en
   * usos sin migrar (ningún paso queda bloqueado por accesibilidad
   * efectiva).
   */
  readonly indiceMaximoAccesible = input<number>(Number.MAX_SAFE_INTEGER);

  @Output() pasoSeleccionado = new EventEmitter<PayrollStepId>();
  /**
   * Solicitud de retroceso al paso inmediatamente anterior según
   * `ORDEN_PASOS_NOMINA`. Reemplaza los botones "Volver a [paso N-1]" que
   * antes vivían en cada paso. El container responde llamando
   * `intentarIrAPaso` con el paso anterior.
   */
  @Output() volverPasoAnterior = new EventEmitter<PayrollStepId>();

  private readonly orquestador = inject(NominaMensualV2OrquestadorPort);
  /**
   * `AuthService` se inyecta opcional para que los tests del stepper no
   * tengan que bootstrappear Supabase. Cuando no hay sesión disponible, el
   * avatar muestra un placeholder neutro y el tooltip se queda vacío.
   */
  private readonly auth = inject(AuthService, { optional: true });

  readonly vistasStepper = computed(() =>
    construirVistasStepper(
      this.steps(),
      this.pasoActual(),
      (id) => this.estadoPaso(id),
      this.orquestador.auditoriaPorPaso(),
      this.orquestador.eventosTrazabilidad(),
    ),
  );

  /**
   * Paso inmediatamente anterior al activo según `ORDEN_PASOS_NOMINA`.
   * `null` cuando estamos en el primer paso (no hay retroceso posible) y
   * el botón "Volver" queda oculto.
   */
  readonly pasoAnterior = computed<PayrollStepId | null>(() => pasoAnteriorDe(this.pasoActual()));

  /** Etiqueta del botón de retroceso, ej. "Volver a Movimientos". */
  readonly etiquetaPasoAnterior = computed<string | null>(() => {
    const anterior = this.pasoAnterior();
    return anterior ? `Volver a ${obtenerEtiquetaBrevePaso(anterior)}` : null;
  });

  /**
   * Iniciales del usuario activo para el avatar (2 caracteres). Prioriza
   * `user.user_metadata.full_name`; si no, usa el local-part del email.
   * Devuelve `'·'` cuando no hay sesión disponible (carga inicial o test
   * sin AuthService).
   */
  readonly inicialesUsuario = computed<string>(() => {
    const user = this.auth?.currentUser() ?? null;
    if (!user) return '·';
    const metadata = (user.user_metadata ?? {}) as Record<string, unknown>;
    const fullName = typeof metadata['full_name'] === 'string' ? (metadata['full_name'] as string) : '';
    if (fullName) {
      const parts = fullName.split(/\s+/).filter(Boolean);
      if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
      return `${parts[0]![0]}${parts[parts.length - 1]![0]}`.toUpperCase();
    }
    if (user.email) {
      const localPart = user.email.split('@')[0] ?? '';
      return localPart.slice(0, 2).toUpperCase() || '·';
    }
    return '·';
  });

  /**
   * Etiqueta humana del usuario activo para el `title` del avatar.
   * Si hay `full_name` lo prepara como `<Nombre> · <correo>`; si no, solo
   * el correo. Cuando no hay sesión devuelve `null` y el avatar omite el
   * tooltip.
   */
  readonly tooltipUsuario = computed<string | null>(() => {
    const user = this.auth?.currentUser() ?? null;
    if (!user) return null;
    const metadata = (user.user_metadata ?? {}) as Record<string, unknown>;
    const fullName = typeof metadata['full_name'] === 'string' ? (metadata['full_name'] as string).trim() : '';
    const email = user.email ?? '';
    if (fullName && email) return `${fullName} · ${email}`;
    return fullName || email || null;
  });

  /** Aria-label accesible del avatar (sin formato decorativo). */
  readonly ariaLabelUsuario = computed<string>(() => {
    const tooltip = this.tooltipUsuario();
    return tooltip ? `Usuario activo: ${tooltip}` : 'Usuario activo';
  });

  readonly tooltipTrazabilidad = computed<string>(() => {
    const usuario = this.tooltipUsuario();
    return usuario
      ? `${usuario} · Ver trazabilidad del período`
      : 'Ver trazabilidad del período';
  });

  readonly ariaLabelTrazabilidad = computed<string>(() => {
    const usuario = this.tooltipUsuario();
    return usuario
      ? `Usuario activo: ${usuario}. Abrir trazabilidad del período.`
      : 'Abrir trazabilidad del período';
  });

  abrirTrazabilidadCompleta(): void {
    this.orquestador.abrirTrazabilidadCompleta();
  }

  estadoPaso(stepId: PayrollStepId): PayrollStepStatus {
    return obtenerEstadoPaso(stepId, this.pasoActual(), this.nomina());
  }

  claseEstadoPaso(estado: PayrollStepStatus): string {
    switch (estado) {
      case 'active':
        return 'nomina-step--active';
      case 'completed':
        return 'nomina-step--complete';
      case 'blocked':
        return 'nomina-step--blocked';
      case 'warning':
        return 'nomina-step--warning';
      case 'pending':
      default:
        return 'nomina-step--pending';
    }
  }

  seleccionarPaso(stepId: PayrollStepId): void {
    if (this.pasoCongelado(stepId)) return;
    if (this.pasoNoAccesible(stepId)) return;
    if (this.avanceDesdePasoActualBloqueado() && esAvanceHaciaAdelante(this.pasoActual(), stepId)) {
      return;
    }
    this.pasoSeleccionado.emit(stepId);
  }

  pasoAvanceBloqueado(stepId: PayrollStepId): boolean {
    return this.avanceDesdePasoActualBloqueado() && esAvanceHaciaAdelante(this.pasoActual(), stepId);
  }

  pasoCongelado(stepId: PayrollStepId): boolean {
    return esPasoCongelado(stepId);
  }

  /**
   * `true` si el paso queda fuera del techo `indiceMaximoAccesible`
   * (combinación de estado + contenido). El stepper lo deshabilita,
   * pinta el icono `lock` y muestra tooltip con el paso anterior a
   * completar.
   */
  pasoNoAccesible(stepId: PayrollStepId): boolean {
    const indice = ORDEN_PASOS_NOMINA.indexOf(stepId);
    if (indice < 0) return false;
    return indice > this.indiceMaximoAccesible();
  }

  tooltipPaso(stepId: PayrollStepId): string | null {
    if (this.pasoCongelado(stepId)) return tooltipPasoCongelado();
    if (this.pasoNoAccesible(stepId)) return tooltipPasoNoAccesible(stepId);
    return null;
  }

  /** Click handler del botón "Volver al paso anterior" del stepper. */
  emitirVolverPasoAnterior(): void {
    const anterior = this.pasoAnterior();
    if (!anterior) return;
    this.volverPasoAnterior.emit(anterior);
  }
}
