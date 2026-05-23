import { CommonModule } from "@angular/common";
import {
  Component,
  DestroyRef,
  ElementRef,
  OnInit,
  inject,
  signal,
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import {
  AbstractControl,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { LucideAngularModule } from "lucide-angular";

import { BancarioComponent } from "../secciones/bancario/bancario";
import { ContratoComponent } from "../secciones/contrato/contrato";
import { DatosPersonalesComponent } from "../secciones/datos-personales/datos-personales";
import { ContactoComponent } from "../secciones/contacto/contacto";
import { PrevisionSaludComponent } from "../secciones/prevision-salud/prevision-salud";
import { PerfilLaboralComponent } from "../secciones/perfil-laboral/perfil-laboral";
import {
  mapEmpleadoFormToPayload,
  mapEmpleadoFormToPayloadBasico,
  mapEmpleadoFormToPayloadBorrador,
} from "../../mappers/empleado-form.mapper";
import { validateBorradorAvanzadoFormMinimo } from "../../utils/empleado-borrador-form.validation";
import { normalizarBorradorAvanzadoParaFormulario } from "../../utils/empleado-borrador-hidratacion";
import {
  EMPTY_EMPLEADO_FORM_CATALOGOS,
  EmpleadoFormCatalogos,
} from "../../models/empleado-catalogos.model";
import {
  EMPLEADO_ADVANCED_WIZARD_LABELS,
  EMPLEADO_ADVANCED_WIZARD_STEP_COUNT,
  EMPLEADO_FORM_STEP_BLOCK_IDS,
  EMPLEADO_FORM_TAB_ORDER,
  EmpleadoFormTabId,
} from "../../models/empleado-form.manifest";
import { EmpleadoFormGroup } from "../../models/empleado-form.model";
import {
  CONDICIONES_TRABAJADOR_UI,
  CondicionTrabajadorControlName,
} from "../../models/empleado-perfil-laboral.model";
import { RelacionLaboral } from "../../models/empleado.model";
import {
  buscarTipoTrabajadorBase,
  tipoTrabajadorBaseParaRelacion,
} from "../../rules/empleado-tipo-trabajador-flow.rules";
import {
  AltaAplicabilidadCampo,
  AltaAplicabilidadItem,
  EstadoAplicabilidadAlta,
  altaAplicabilidadStep,
  evaluarAltaAplicabilidad,
} from "../../rules/empleado-alta-aplicabilidad.rules";
import {
  AccionCoherenciaAlta,
  InconsistenciaCoherenciaAlta,
  EstadoCoherenciaAlta,
  evaluarAltaCoherencia,
} from "../../rules/empleado-alta-coherencia.rules";
import {
  evaluarDiagnosticoFichaEmpleado,
  type EmpleadoFichaValidacionSnapshot,
} from "../../rules/empleado-ficha-validacion.rules";
import { EmpleadosFormOrchestratorService } from "../../services/empleados-form-orchestrator.service";
import { EmpleadosCatalogosService } from "../../services/empleados-catalogos.service";
import {
  EmpleadoReferenciaInvalidaError,
  EmpleadoRutDuplicadoError,
  EmpleadosService,
} from "../../services/empleados.service";
import {
  CardComponent,
  CardContentComponent,
} from "../../../../shared/components/ui/card.component";
import {
  MessageBoxComponent,
  MessageBoxSection,
  MessageBoxVariant,
} from "../../../../shared/components/ui/message-box.component";
import { PageActionsComponent } from "../../../../shared/components/ui/page-actions.component";
import { bindShellPageContext } from "../../../../layout/shell-page-context.binding";

type TabId = EmpleadoFormTabId;
type WizardStepUiKind =
  | "actual"
  | "completo"
  | "pendiente"
  | "errores"
  | "opcional"
  | "no-aplica";
type ValidationStepId = TabId;
type ValidationSeverity = "error" | "warning" | "info";
type StepValidationStatus = "pending" | "in-progress" | "invalid" | "complete";
type FormEmpleadoModo = "basico" | "avanzado";

type AdvancedActionModalKind =
  | "next-step-review"
  | "coherence-decision"
  | "draft-invalid"
  | "draft-success"
  | "finish-invalid"
  | "finish-confirm"
  | "honorarios-confirm"
  | "honorarios-finish-blocked"
  | "basic-success"
  | "basic-error"
  | "basic-duplicate-rut"
  | "basic-catalog-wait";
type AdvancedActionModalAction =
  | "dismiss"
  | "go-to-list"
  | "apply-coherence-suggestion"
  | "keep-coherence-review"
  | "continue-next"
  | "focus-current-step"
  | "focus-draft-minimum"
  | "focus-first-blocking"
  | "execute-finish"
  | "confirm-honorarios"
  | "cancel-honorarios"
  | "save-honorarios-draft";

interface AdvancedActionModal {
  kind: AdvancedActionModalKind;
  variant: MessageBoxVariant;
  eyebrow?: string;
  title: string;
  message: string;
  sections?: readonly MessageBoxSection[];
  primaryLabel: string;
  secondaryLabel?: string;
  blockingItems: readonly string[];
  warningItems: readonly string[];
  infoItems: readonly string[];
  fieldItems?: readonly AdvancedActionModalFieldItem[];
  targetStep?: number;
  primaryAction: AdvancedActionModalAction;
  secondaryAction?: AdvancedActionModalAction;
}

interface AdvancedActionModalFieldItem {
  id: string;
  sectionTitle: string;
  fieldLabel: string;
  detail: string;
  actionLabel: string;
  wizardStep: number;
  controlPath: string;
  severity: ValidationSeverity;
}

interface ValidationRule {
  id: string;
  stepId: ValidationStepId;
  label: string;
  severity: ValidationSeverity;
  blocking: boolean;
  sourcePath: string;
  category?: string;
  isApplicable: () => boolean;
  isComplete: () => boolean;
  isVisible?: () => boolean;
}

interface PerfilLaboralAutoDetection {
  controlName: CondicionTrabajadorControlName;
  reason: string;
}

interface EvaluatedValidationRule {
  id: string;
  stepId: ValidationStepId;
  wizardStep: number;
  sectionTitle: string;
  label: string;
  detail: string;
  actionLabel?: string;
  severity: ValidationSeverity;
  blocking: boolean;
  complete: boolean;
  visible: boolean;
  sourcePath: string;
  category?: string;
}

interface StepValidationSummary {
  stepId: ValidationStepId;
  pending: number;
  blockingPending: number;
  warningsPending: number;
  complete: number;
  applicable: number;
  status: StepValidationStatus;
}

interface GlobalValidationSummary {
  blockingPending: number;
  warningsPending: number;
  completeSteps: number;
  invalidSteps: number;
  pendingTotal: number;
}

interface WizardMapGroup {
  title: string;
  description: string;
  stepIndexes: readonly number[];
}

const TAB_ORDER: readonly TabId[] = [...EMPLEADO_FORM_TAB_ORDER];

/** Mensajes de negocio al intentar finalizar con bloqueos (paso 9); no exponer detalle técnico de BD. */
const MENSAJES_FINALIZAR_ALTA: Partial<Record<string, string>> = {
  "personal.identity":
    "Ingresa un RUT válido o un identificador extranjero válido.",
  "contract.position": "Ingresa el cargo o función que tendrá el trabajador.",
  "honorarios.service":
    "Ingresa el servicio o función que prestará la persona a honorarios.",
  "honorarios.amount":
    "Ingresa el monto bruto pactado para la boleta de honorarios.",
  "honorarios.currency": "Selecciona la moneda del monto bruto de honorarios.",
  "contract.branch":
    "Selecciona la sucursal u organización donde prestará servicios.",
  "contract.worker-type":
    "Selecciona el tipo de trabajador que corresponde al contrato.",
  "contract.schedule-type": "Selecciona el tipo de jornada pactada.",
  "contract.contract-type": "Selecciona el tipo de contrato laboral.",
  "contract.start-date": "Ingresa la fecha de ingreso del trabajador.",
  "contract.document-date": "Ingresa la fecha del contrato.",
  "contract.end-date":
    "Completa la fecha de término cuando el contrato no sea indefinido.",
  "contract.salary": "Ingresa un sueldo base válido para remuneraciones.",
  "contract.currency": "Selecciona la moneda de remuneración.",
  "contract.weekly-hours": "Completa las horas semanales pactadas.",
  "contract.weekly-days": "Completa los días semanales de trabajo.",
  "prevision.regime": "Selecciona el régimen previsional del trabajador.",
  "prevision.afp": "Selecciona la AFP cuando el régimen previsional sea AFP.",
  "prevision.health": "Selecciona la institución de salud del trabajador.",
  "prevision.health-currency": "Selecciona la moneda del plan de salud.",
  "prevision.health-plan": "Ingresa el valor del plan de salud.",
  "prevision.apv-institution":
    "Selecciona la institución APVI o desactiva APVI si no corresponde.",
  "prevision.apv-currency":
    "Selecciona la moneda APVI o desactiva APVI si no corresponde.",
  "prevision.apv-amount":
    "Ingresa el monto APVI o desactiva APVI si no corresponde.",
  "prevision.apv-payment":
    "Selecciona la forma de pago APVI o desactiva APVI si no corresponde.",
  "prevision.apv-agreement":
    "Completa el depósito convenido APVI o desactiva APVI si no corresponde.",
  "prevision.ips-name": "Ingresa la entidad o ex caja del régimen IPS.",
  "prevision.ips-regime": "Ingresa el régimen IPS que corresponde.",
  "prevision.ips-rate": "Ingresa la tasa IPS que corresponde.",
  "prevision.health-ges": "Ingresa el adicional Auge o GES del plan de salud.",
  "prevision.account2-currency":
    "Completa la moneda de Cuenta 2 AFP o deja Cuenta 2 sin monto.",
  "prevision.account2-value":
    "Completa el valor de Cuenta 2 AFP o deja Cuenta 2 sin monto.",
  "bank.bank": "Selecciona el banco para el pago por transferencia.",
  "bank.account-type": "Selecciona el tipo de cuenta bancaria.",
  "bank.account-number":
    "Ingresa una cuenta bancaria real y reemplaza cualquier dato temporal.",
};

@Component({
  selector: "app-form-empleado",
  imports: [
    CommonModule,
    ReactiveFormsModule,
    LucideAngularModule,
    CardComponent,
    CardContentComponent,
    PageActionsComponent,
    MessageBoxComponent,
    DatosPersonalesComponent,
    ContactoComponent,
    ContratoComponent,
    PerfilLaboralComponent,
    PrevisionSaludComponent,
    BancarioComponent,
  ],
  templateUrl: "./form-empleado.html",
  styleUrls: [
    "./form-empleado.css",
    "./form-empleado.wizard.css",
    "./form-empleado.feedback.css",
  ],
})
export class FormEmpleadoComponent implements OnInit {
  private readonly empleadosService = inject(EmpleadosService);
  private readonly empleadosCatalogosService = inject(
    EmpleadosCatalogosService,
  );
  private readonly empleadosFormService = inject(
    EmpleadosFormOrchestratorService,
  );
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly hostElement = inject<ElementRef<HTMLElement>>(ElementRef);
  private suppressRelacionLaboralModal = false;
  private previousRelacionLaboral: RelacionLaboral = "CONTRATO";

  readonly modo = signal<FormEmpleadoModo>(this.resolveModo());
  /** Creacion avanzada: indice de etapa 0..9 (10 pasos). */
  readonly pasoWizardActivo = signal(0);
  readonly isSaving = signal(false);
  readonly attemptedSave = signal(false);
  readonly errorMessage = signal<string | null>(null);
  /** RUT duplicado: modal estructurado (mismo layout que éxito básico, variante error). */
  readonly duplicateRutModalRut = signal<string | null>(null);

  advancedStatusBadgeLabel(): string {
    return "Bitácora laboral";
  }
  readonly successMessage = signal<string | null>(null);
  /** Flujo que originó el último guardado exitoso (para el modal, sin depender solo de la ruta). */
  readonly successFlow = signal<FormEmpleadoModo | null>(null);
  readonly createdEmployeeId = signal<number | null>(null);
  /** Creación avanzada: id persona al actualizar borrador o null si es alta nueva. */
  readonly borradorPersonaId = signal<number | null>(null);
  readonly isSavingBorrador = signal(false);
  readonly borradorFeedback = signal<string | null>(null);
  readonly advancedActionModal = signal<AdvancedActionModal | null>(null);
  readonly catalogos = signal<EmpleadoFormCatalogos>(
    EMPTY_EMPLEADO_FORM_CATALOGOS,
  );
  readonly perfilLaboralAutoDetections = signal<
    readonly PerfilLaboralAutoDetection[]
  >([]);
  readonly decisionCoherenciaPendiente = signal<{
    issue: InconsistenciaCoherenciaAlta;
    context: "next" | "finish";
  } | null>(null);
  readonly idsInconsistenciasCoherenciaReconocidas = signal<ReadonlySet<string>>(
    new Set(),
  );
  readonly isLoadingCatalogs = signal(true);
  readonly catalogosError = signal<string | null>(null);
  readonly completedTabs = signal<ReadonlySet<TabId>>(new Set());
  readonly attemptedTabs = signal<ReadonlySet<TabId>>(new Set());
  readonly visitedWizardSteps = signal<ReadonlySet<number>>(new Set([0]));
  readonly attemptedWizardSteps = signal<ReadonlySet<number>>(new Set());
  readonly form: EmpleadoFormGroup = this.empleadosFormService.createForm();
  readonly totalSteps = EMPLEADO_ADVANCED_WIZARD_STEP_COUNT;
  readonly advancedWizardLabels = [...EMPLEADO_ADVANCED_WIZARD_LABELS];
  readonly advancedWizardShortLabels: readonly string[] = [
    "Datos personales",
    "Domicilio",
    "Contrato",
    "Jornada",
    "Asignaciones",
    "Previsión y salud",
    "APVI",
    "Banco",
    "Condiciones",
    "Resumen",
  ] as const;

  readonly advancedWizardStepDescriptions: readonly string[] = [
    "Información legal mínima para abrir la ficha laboral y reconocer al colaborador.",
    "Dirección particular y datos territoriales usados para mantener la ficha actualizada.",
    "Vínculo contractual, fechas y organización donde quedará asociado el trabajador.",
    "Jornada pactada y base de remuneración que alimentará los cálculos posteriores.",
    "Beneficios o condiciones laborales que solo se registran cuando correspondan.",
    "Régimen previsional e institución de salud que respaldan los descuentos del trabajador.",
    "Registro APVI solo cuando el régimen previsional y la declaración del trabajador lo requieren.",
    "Cuenta de abono que se usará para preparar pagos futuros.",
    "Control administrativo de situaciones especiales antes de cerrar el alta.",
    "Acta de revisión con datos principales, decisiones registradas y pendientes de cierre.",
  ] as const;

  readonly wizardMapGroups: readonly WizardMapGroup[] = [
    {
      title: "Identidad",
      description: "Apertura de ficha",
      stepIndexes: [0, 1],
    },
    {
      title: "Relación laboral",
      description: "Contrato y jornada",
      stepIndexes: [2, 3, 4],
    },
    {
      title: "Pago y previsión",
      description: "Cotizaciones y abono",
      stepIndexes: [5, 6, 7],
    },
    {
      title: "Revisión",
      description: "Control y cierre",
      stepIndexes: [8, 9],
    },
  ] as const;

  /** Inventario de bloques por paso (manifest); referencia unica frente a templates de seccion. */
  readonly stepBlockIds = EMPLEADO_FORM_STEP_BLOCK_IDS;

  constructor() {
    bindShellPageContext(
      this.destroyRef,
      () => ({
        breadcrumbs: [
          { label: "Empleados", path: "/empleados" },
          { label: this.pageTitle() },
        ],
        primaryAction: this.isAdvancedMode()
          ? {
              label: this.shellPrimaryActionLabel(),
              disabled: this.shellPrimaryActionDisabled(),
              loading: this.shellPrimaryActionLoading(),
              actionId: "empleado-alta-avanzada-guardar",
            }
          : undefined,
      }),
      {
        onPrimaryAction: () => this.ejecutarShellPrimaryAction(),
      },
    );
  }

  async ngOnInit(): Promise<void> {
    const modo = this.resolveModo();
    this.modo.set(modo);
    if (modo === "avanzado") {
      this.form.controls.contacto.controls.idComuna.addValidators(
        Validators.required,
      );
      this.form.controls.contacto.controls.idComuna.updateValueAndValidity({
        emitEvent: false,
      });
    }
    this.empleadosFormService.configureFormBehavior(
      this.form,
      this.destroyRef,
      () => this.catalogos(),
    );
    this.configureRelacionLaboralUx();
    this.configureTipoTrabajadorFlow();
    this.configurePerfilLaboralAutodetection();
    await this.loadCatalogos();
    if (this.modo() === "avanzado") {
      const rawId = this.route.snapshot.queryParamMap.get("idPersona");
      const idPersona = rawId ? Number(rawId) : NaN;
      const debeHidratarBorrador =
        Number.isInteger(idPersona) && idPersona >= 1;
      if (debeHidratarBorrador) {
        this.isLoadingCatalogs.set(true);
      }
      try {
        await this.loadContinuacionBorradorSiAplica();
        this.syncTipoTrabajadorConRelacionLaboral();
        this.applyPerfilLaboralAutodetection();
      } finally {
        if (debeHidratarBorrador) {
          this.isLoadingCatalogs.set(false);
        }
      }
    }
  }

  async onGuardarBorrador(): Promise<void> {
    if (!this.isAdvancedMode() || this.isSavingBorrador() || this.isSaving()) {
      return;
    }

    this.advancedActionModal.set(null);

    if (this.isLoadingCatalogs()) {
      this.borradorFeedback.set(null);
      this.openAdvancedActionModal({
        kind: "draft-invalid",
        variant: "warning",
        eyebrow: "Revisión administrativa",
        title: "Espera a que cargue el formulario",
        message:
          "La información base aún se está preparando. Intenta guardar el borrador en unos segundos.",
        sections: this.buildBitacoraMsgboxSections({
          pendientePrincipal:
            "Esperar a que terminen de cargar catálogos y datos base del formulario.",
          porQueImporta:
            "Sin catálogos no se puede registrar un borrador trazable en la bitácora.",
          accionRecomendada: "Reintentar guardar el borrador cuando el formulario esté listo.",
          pendienteTone: "info",
        }),
        primaryLabel: "Aceptar",
        blockingItems: [],
        warningItems: [],
        infoItems: [],
        primaryAction: "dismiss",
      });
      return;
    }

    const err = validateBorradorAvanzadoFormMinimo(this.form);
    if (err) {
      this.borradorFeedback.set(null);
      this.openDraftInvalidModal(err);
      return;
    }

    this.errorMessage.set(null);
    this.duplicateRutModalRut.set(null);
    this.successMessage.set(null);
    this.borradorFeedback.set(null);
    this.isSavingBorrador.set(true);
    const prevId = this.borradorPersonaId();

    try {
      const payload = mapEmpleadoFormToPayloadBorrador(
        this.form,
        this.catalogos(),
      );
      const resumen = await this.empleadosService.guardarBorradorAvanzado(
        prevId,
        payload,
        this.pasoWizardActivo(),
      );
      this.borradorPersonaId.set(resumen.id);
      this.borradorFeedback.set(
        prevId === null
          ? "Borrador guardado correctamente."
          : "Borrador actualizado.",
      );
      this.form.markAsPristine();
      void this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { idPersona: resumen.id },
        queryParamsHandling: "merge",
        replaceUrl: true,
      });
      this.openDraftSuccessModal(prevId === null);
    } catch (error) {
      if (error instanceof EmpleadoRutDuplicadoError) {
        this.duplicateRutModalRut.set(error.rut);
      } else {
        this.errorMessage.set(
          error instanceof Error
            ? error.message
            : "No fue posible guardar el borrador.",
        );
      }
    } finally {
      this.isSavingBorrador.set(false);
    }
  }

  selectWizardStep(index: number): void {
    if (index < 0 || index >= EMPLEADO_ADVANCED_WIZARD_STEP_COUNT) {
      return;
    }

    this.syncCompletedTabsFromValidity();
    this.pasoWizardActivo.set(index);
    this.markWizardStepVisited(index);
    this.scrollToCurrentStepStart({ focusFirstField: true });
  }

  wizardStepShortLabel(stepIndex: number): string {
    if (this.isHonorariosMode()) {
      const honorariosLabels: Record<number, string> = {
        2: "Servicio",
        3: "Honorarios",
        7: "Datos para pago",
        8: "Condiciones",
        9: "Resumen honorarios",
      };
      if ([4, 5, 6, this.perfilLaboralWizardStepIndex()].includes(stepIndex)) {
        return this.advancedWizardShortLabels[stepIndex] ?? "";
      }
      return (
        honorariosLabels[stepIndex] ??
        this.advancedWizardShortLabels[stepIndex] ??
        ""
      );
    }

    return (
      this.advancedWizardShortLabels[stepIndex] ??
      this.advancedWizardLabels[stepIndex] ??
      ""
    );
  }

  wizardStepFullLabel(stepIndex: number): string {
    if (this.isHonorariosMode()) {
      const honorariosLabels: Record<number, string> = {
        2: "Datos del servicio",
        3: "Monto de honorarios",
        4: "Asignaciones laborales",
        5: "Previsión y salud",
        6: "APVI",
        7: "Datos para pago",
        8: "Condiciones",
        9: "Resumen de honorarios",
      };
      return (
        honorariosLabels[stepIndex] ??
        this.advancedWizardLabels[stepIndex] ??
        ""
      );
    }

    return this.advancedWizardLabels[stepIndex] ?? "";
  }

  wizardStepDescription(stepIndex: number): string {
    if (this.isHonorariosMode()) {
      const honorariosDescriptions: Record<number, string> = {
        2: "Registra el servicio, fecha de inicio y ubicación administrativa del prestador a honorarios.",
        3: "Informa el monto bruto pactado para la boleta. No corresponde jornada laboral dependiente.",
        4: "Las asignaciones laborales no aplican para boleta de honorarios en esta alta.",
        5: "Previsión y salud no se capturan como trabajador dependiente en este flujo.",
        6: "APVI no aplica dentro de la alta de prestador a honorarios.",
        7: "Registra datos de pago del prestador si se usará transferencia.",
        8: "Las condiciones especiales de trabajadores dependientes no se declaran para honorarios en esta fase.",
        9: "Revisa que este registro queda como borrador de honorarios y no como trabajador dependiente.",
      };
      return (
        honorariosDescriptions[stepIndex] ??
        this.advancedWizardStepDescriptions[stepIndex] ??
        ""
      );
    }

    return this.advancedWizardStepDescriptions[stepIndex] ?? "";
  }

  wizardProgressPercent(): number {
    return Math.round(((this.pasoWizardActivo() + 1) / this.totalSteps) * 100);
  }

  async loadCatalogos(): Promise<void> {
    this.catalogosError.set(null);
    this.isLoadingCatalogs.set(true);

    try {
      const catalogos =
        await this.empleadosCatalogosService.obtenerFormulario();
      this.catalogos.set(catalogos);
      this.empleadosFormService.applyCatalogDefaults(this.form, catalogos);
      this.syncTipoTrabajadorConRelacionLaboral();
      this.applyPerfilLaboralAutodetection();
    } catch {
      this.catalogosError.set(
        "No fue posible preparar la informacion requerida para el formulario. Intenta nuevamente.",
      );
    } finally {
      this.isLoadingCatalogs.set(false);
    }
  }

  handleFormSubmit(event: SubmitEvent): void {
    event.preventDefault();
    event.stopPropagation();
    if (
      this.isAdvancedMode() &&
      this.pasoWizardActivo() !== this.summaryWizardStepIndex()
    ) {
      return;
    }
    void this.onSubmit();
  }

  isWizardStepActive(index: number): boolean {
    return this.pasoWizardActivo() === index;
  }

  /** Secuencia de indices al usar Siguiente / Anterior (omite APVI si no aplica). */
  linearWizardSequence(): readonly number[] {
    if (this.isHonorariosMode()) {
      return [0, 1, 2, 3, 7, this.summaryWizardStepIndex()] as const;
    }

    const base = [0, 1, 2, 3, 4, 5] as const;
    const p = this.form.controls.previsionSalud.controls;
    const incluyeApvi =
      p.tipoRegimenPrevisional.value === "AFP" && p.tieneApv.value === true;
    if (incluyeApvi) {
      return [
        ...base,
        6,
        7,
        this.perfilLaboralWizardStepIndex(),
        this.summaryWizardStepIndex(),
      ];
    }
    return [
      ...base,
      7,
      this.perfilLaboralWizardStepIndex(),
      this.summaryWizardStepIndex(),
    ];
  }

  async onSubmit(): Promise<void> {
    if (this.isSaving()) {
      return;
    }

    this.advancedActionModal.set(null);
    this.attemptedSave.set(true);
    if (this.isBasicMode()) {
      this.attemptBasicGroups();
    } else {
      this.attemptAllTabs();
    }
    this.errorMessage.set(null);
    this.duplicateRutModalRut.set(null);
    this.successMessage.set(null);
    this.successFlow.set(null);
    this.createdEmployeeId.set(null);
    this.markSubmitControlsAsTouched();

    if (this.isLoadingCatalogs()) {
      if (this.isBasicMode()) {
        this.openBasicCatalogWaitModal();
      } else {
        this.errorMessage.set(
          "La informacion base del formulario aun se esta cargando. Espera unos segundos e intenta nuevamente.",
        );
      }
      return;
    }

    if (this.isBasicMode()) {
      if (this.isBasicFormInvalid()) {
        this.focusFirstInvalidControl();
        return;
      }

      await this.submitBasicMode();
      return;
    }

    if (this.isHonorariosMode()) {
      this.syncCompletedTabsFromValidity();
      this.openHonorariosFinishBlockedModal();
      return;
    }

    const firstBadStep = this.findFirstWizardStepWithBlockingIssues();

    if (firstBadStep !== null || this.form.invalid) {
      this.syncCompletedTabsFromValidity();
      this.openFinishInvalidModal(firstBadStep ?? 0);
      return;
    }

    const coherenceIssue = this.primeraDecisionCoherenciaSinReconocer();
    if (coherenceIssue) {
      this.syncCompletedTabsFromValidity();
      this.openCoherenceDecisionModal(coherenceIssue, "finish");
      return;
    }

    this.markAllValidTabsAsCompleted();
    this.openFinishConfirmModal();
  }

  private async submitAdvancedMode(): Promise<void> {
    if (this.isSaving()) {
      return;
    }

    this.markAllValidTabsAsCompleted();
    this.isSaving.set(true);
    this.errorMessage.set(null);
    this.duplicateRutModalRut.set(null);
    this.successMessage.set(null);
    this.successFlow.set(null);
    this.createdEmployeeId.set(null);

    try {
      const borradorId = this.borradorPersonaId();
      if (borradorId !== null) {
        await this.empleadosService.finalizarAltaAvanzadaExistente(
          borradorId,
          mapEmpleadoFormToPayload(this.form, this.catalogos()),
        );
        this.successMessage.set(
          "La ficha avanzada fue guardada correctamente y el empleado quedó listo para operar.",
        );
        this.successFlow.set("avanzado");
        this.createdEmployeeId.set(borradorId);
        this.borradorPersonaId.set(null);
        this.form.markAsPristine();
        void this.router.navigate(["/empleados/nuevo"], { replaceUrl: true });
      } else {
        const created = await this.empleadosService.crear(
          mapEmpleadoFormToPayload(this.form, this.catalogos()),
        );

        this.successMessage.set(
          "La ficha avanzada fue guardada correctamente y el empleado quedó listo para operar.",
        );
        this.successFlow.set("avanzado");
        this.createdEmployeeId.set(created.id);
        this.form.markAsPristine();
      }
    } catch (error) {
      if (error instanceof EmpleadoRutDuplicadoError) {
        this.duplicateRutModalRut.set(error.rut);
      } else {
        this.errorMessage.set(this.resolveSaveErrorMessage(error));
      }
    } finally {
      this.isSaving.set(false);
    }
  }

  dismissErrorMessage(): void {
    this.errorMessage.set(null);
    this.duplicateRutModalRut.set(null);
  }

  errorModalTitle(): string {
    return this.isBasicMode()
      ? "No fue posible registrar la ficha"
      : "No fue posible registrar el empleado";
  }

  errorModalMessage(): string {
    return this.isBasicMode()
      ? "El registro no se completó. Revisa el detalle y vuelve a intentarlo."
      : "La ficha avanzada no se guardó porque hay una condición que debe revisarse antes de finalizar.";
  }

  normalizedErrorMessage(message: string): string {
    return message
      .replace(/Sin prevision/g, "Sin previsión")
      .replace(/sin prevision/g, "sin previsión")
      .replace(/opcion/g, "opción")
      .replace(/calculo/g, "cálculo")
      .replace(/nomina/g, "nómina")
      .replace(/informacion/g, "información");
  }

  errorRecommendedAction(message: string): string {
    const normalizedMessage =
      this.normalizedErrorMessage(message).toLowerCase();

    if (
      normalizedMessage.includes("sin previsión") &&
      normalizedMessage.includes("afp")
    ) {
      return "Vuelve al paso Previsión y salud. Selecciona AFP o IPS si el trabajador quedará habilitado para remuneraciones, o mantén el caso como revisión administrativa si corresponde a una excepción respaldada.";
    }

    if (
      normalizedMessage.includes("rut") &&
      normalizedMessage.includes("existe")
    ) {
      return "Revisa el listado de empleados antes de crear una nueva ficha. Si corresponde, continúa la ficha existente.";
    }

    if (
      normalizedMessage.includes("rls") ||
      normalizedMessage.includes("supabase")
    ) {
      return "Revisa la configuración de base de datos y permisos antes de intentar guardar nuevamente.";
    }

    return "Revisa el paso indicado o la información marcada como pendiente. Luego intenta guardar nuevamente.";
  }

  errorSuggestedStep(message: string): string | null {
    const normalizedMessage =
      this.normalizedErrorMessage(message).toLowerCase();

    if (
      normalizedMessage.includes("sin previsión") ||
      normalizedMessage.includes("afp") ||
      normalizedMessage.includes("ips")
    ) {
      return "Previsión y salud";
    }

    if (normalizedMessage.includes("rut")) {
      return "Datos personales";
    }

    if (
      normalizedMessage.includes("banco") ||
      normalizedMessage.includes("cuenta")
    ) {
      return "Banco";
    }

    if (
      normalizedMessage.includes("contrato") ||
      normalizedMessage.includes("cesantía")
    ) {
      return "Contrato";
    }

    return this.isAdvancedMode() ? "Acta de revisión" : null;
  }

  goToEmployeeList(): void {
    this.successMessage.set(null);
    this.successFlow.set(null);
    this.createdEmployeeId.set(null);
    void this.router.navigate(["/empleados"]);
  }

  handleSuccessAction(): void {
    this.goToEmployeeList();
  }

  handleAdvancedActionModalPrimary(): void {
    this.handleAdvancedActionModalAction(
      this.advancedActionModal()?.primaryAction ?? "dismiss",
    );
  }

  handleAdvancedActionModalSecondary(): void {
    this.handleAdvancedActionModalAction(
      this.advancedActionModal()?.secondaryAction ?? "dismiss",
    );
  }

  handleAdvancedModalFieldItem(item: AdvancedActionModalFieldItem): void {
    this.advancedActionModal.set(null);
    this.markWizardStepTouched(item.wizardStep);
    this.selectWizardStep(item.wizardStep);
    this.focusControlPath(item.controlPath);
  }

  dismissAdvancedActionModal(): void {
    this.decisionCoherenciaPendiente.set(null);
    this.advancedActionModal.set(null);
  }

  private handleAdvancedActionModalAction(
    action: AdvancedActionModalAction,
  ): void {
    const modal = this.advancedActionModal();

    switch (action) {
      case "apply-coherence-suggestion":
        this.applyPendingCoherenceSuggestion();
        break;
      case "keep-coherence-review":
        this.keepPendingCoherenceReview();
        break;
      case "continue-next":
        this.advancedActionModal.set(null);
        this.advanceToNextWizardStep();
        break;
      case "focus-current-step":
        this.advancedActionModal.set(null);
        this.markWizardStepTouched(this.pasoWizardActivo());
        this.focusFirstPendingControl(this.pasoWizardActivo());
        break;
      case "focus-draft-minimum":
        this.advancedActionModal.set(null);
        this.showInvalidWizardStep(0);
        break;
      case "focus-first-blocking":
        this.advancedActionModal.set(null);
        this.showInvalidWizardStep(
          modal?.targetStep ??
            this.findFirstWizardStepWithBlockingIssues() ??
            0,
        );
        break;
      case "execute-finish":
        this.advancedActionModal.set(null);
        void this.submitAdvancedMode();
        break;
      case "confirm-honorarios":
        this.advancedActionModal.set(null);
        this.confirmHonorariosMode();
        break;
      case "cancel-honorarios":
        this.advancedActionModal.set(null);
        this.cancelHonorariosModeChange();
        break;
      case "save-honorarios-draft":
        this.advancedActionModal.set(null);
        void this.onGuardarBorrador();
        break;
      case "go-to-list":
        this.advancedActionModal.set(null);
        this.goToEmployeeList();
        break;
      case "dismiss":
      default:
        this.advancedActionModal.set(null);
        break;
    }
  }

  isBasicMode(): boolean {
    return this.modo() === "basico";
  }

  isAdvancedMode(): boolean {
    return this.modo() === "avanzado";
  }

  isHonorariosMode(): boolean {
    return (
      this.form.controls.contrato.controls.relacionLaboral.value ===
      "HONORARIOS"
    );
  }

  pageTitle(): string {
    return "Crear empleado";
  }

  saveActionLabel(): string {
    return this.isBasicMode()
      ? "Guardar ficha básica"
      : "Crear empleado activo";
  }

  finalWizardActionLabel(): string {
    if (this.isSaving()) {
      return this.isHonorariosMode()
        ? "Guardando borrador..."
        : "Guardando ficha...";
    }

    return this.isHonorariosMode() ? "Guardar borrador" : "Finalizar alta";
  }

  shellPrimaryActionLabel(): string {
    if (!this.isAdvancedMode()) {
      return this.saveActionLabel();
    }
    if (this.pasoWizardActivo() === this.summaryWizardStepIndex()) {
      return this.finalWizardActionLabel();
    }
    return this.isSavingBorrador() ? "Guardando borrador..." : "Guardar borrador";
  }

  shellPrimaryActionLoading(): boolean {
    return this.isSaving() || this.isSavingBorrador();
  }

  shellPrimaryActionDisabled(): boolean {
    return this.isLoadingCatalogs() || this.isSaving() || this.isSavingBorrador();
  }

  ejecutarShellPrimaryAction(): void {
    if (!this.isAdvancedMode() || this.shellPrimaryActionDisabled()) {
      return;
    }
    if (this.pasoWizardActivo() === this.summaryWizardStepIndex() && !this.isHonorariosMode()) {
      void this.onSubmit();
      return;
    }
    void this.onGuardarBorrador();
  }

  /** Avanzada: guardado en el pie. Básica: Volver + Guardar en cabecera (modo-basico / sin duplicar pie). */
  headerVisibleActions(): readonly ("back" | "save")[] {
    return this.isBasicMode()
      ? (["back", "save"] as const)
      : (["back"] as const);
  }

  /** Modal de exito: titulo (solo copia distinta en creacion basica). */
  successModalTitle(): string {
    return this.successFlow() === "basico"
      ? "Empleado registrado correctamente"
      : "Empleado registrado correctamente";
  }

  /** Modal de exito: texto del boton principal. */
  successModalPrimaryLabel(): string {
    return "Ir al listado";
  }

  goToPreviousTab(): void {
    const seq = this.linearWizardSequence();
    let idx = seq.indexOf(this.pasoWizardActivo());
    if (idx === -1) {
      const cur = this.pasoWizardActivo();
      const candidates = seq.filter((s) => s < cur);
      const prev = candidates.length
        ? candidates[candidates.length - 1]!
        : seq[0]!;
      this.syncCompletedTabsFromValidity();
      this.pasoWizardActivo.set(prev);
      this.markWizardStepVisited(prev);
      this.scrollToCurrentStepStart({ focusFirstField: true });
      return;
    }
    if (idx > 0) {
      this.syncCompletedTabsFromValidity();
      const previous = seq[idx - 1]!;
      this.pasoWizardActivo.set(previous);
      this.markWizardStepVisited(previous);
      this.scrollToCurrentStepStart({ focusFirstField: true });
    }
  }

  goToNextTab(): void {
    if (!this.isAdvancedMode()) {
      this.advanceToNextWizardStep();
      return;
    }

    const currentStep = this.pasoWizardActivo();
    this.markWizardStepAttempted(currentStep);
    this.markWizardStepTouched(currentStep);
    this.syncCompletedTabsFromValidity();

    const coherenceIssue = this.primeraDecisionCoherenciaPorPaso(currentStep);
    if (coherenceIssue) {
      this.openCoherenceDecisionModal(coherenceIssue, "next");
      return;
    }

    const pending = this.pendingValidationItemsForWizardStep(currentStep);
    if (pending.length > 0) {
      this.openNextStepReviewModal(currentStep, pending);
      return;
    }

    this.advanceToNextWizardStep();
  }

  private advanceToNextWizardStep(): void {
    const seq = this.linearWizardSequence();
    let idx = seq.indexOf(this.pasoWizardActivo());
    if (idx === -1) {
      const cur = this.pasoWizardActivo();
      const next = seq.find((s) => s > cur);
      if (next !== undefined) {
        this.syncCompletedTabsFromValidity();
        this.pasoWizardActivo.set(next);
        this.markWizardStepVisited(next);
        this.scrollToCurrentStepStart({ focusFirstField: true });
      }
      return;
    }
    if (idx < seq.length - 1) {
      this.syncCompletedTabsFromValidity();
      const next = seq[idx + 1]!;
      this.pasoWizardActivo.set(next);
      this.markWizardStepVisited(next);
      this.scrollToCurrentStepStart({ focusFirstField: true });
    }
  }

  isFirstTab(): boolean {
    const seq = this.linearWizardSequence();
    const idx = seq.indexOf(this.pasoWizardActivo());
    if (idx === -1) {
      return this.pasoWizardActivo() <= seq[0]!;
    }
    return idx === 0;
  }

  isLastTab(): boolean {
    const seq = this.linearWizardSequence();
    return this.pasoWizardActivo() === seq[seq.length - 1]!;
  }

  isNextDisabled(): boolean {
    return false;
  }

  activeStepNumber(): number {
    return this.pasoWizardActivo() + 1;
  }

  summaryWizardStepIndex(): number {
    return this.totalSteps - 1;
  }

  perfilLaboralWizardStepIndex(): number {
    return this.totalSteps - 2;
  }

  completedStepCount(): number {
    let n = 0;
    for (let i = 0; i < EMPLEADO_ADVANCED_WIZARD_STEP_COUNT; i++) {
      if (this.getWizardStepValidationSummary(i).status === "complete") {
        n++;
      }
    }
    return n;
  }

  pendingValidationCount(): number {
    return this.pendingValidationPanelItems().length;
  }

  validationPanelItems(): EvaluatedValidationRule[] {
    return this.evaluateValidationRules().filter(
      (item) => item.visible && item.wizardStep === this.pasoWizardActivo(),
    );
  }

  pendingValidationPanelItems(): EvaluatedValidationRule[] {
    return this.validationPanelItems().filter((item) => !item.complete);
  }

  blockingValidationPanelItems(): EvaluatedValidationRule[] {
    return this.pendingValidationPanelItems().filter(
      (item) => item.severity === "error",
    );
  }

  warningValidationPanelItems(): EvaluatedValidationRule[] {
    return this.pendingValidationPanelItems().filter(
      (item) => item.severity === "warning",
    );
  }

  getStepValidationSummary(stepId: ValidationStepId): StepValidationSummary {
    if (!this.isAdvancedMode()) {
      const evaluated = this.evaluateValidationRules().filter(
        (item) => item.stepId === stepId && item.visible,
      );
      const pending = evaluated.filter((item) => !item.complete);
      const blockingPending = pending.filter((item) => item.blocking).length;
      const warningsPending = pending.filter(
        (item) => item.severity === "warning",
      ).length;
      const wasAttempted =
        this.attemptedTabs().has(stepId) || this.attemptedSave();
      const hasInteraction = this.hasStepInteraction(stepId);

      let status: StepValidationStatus = "pending";

      if (blockingPending > 0 && wasAttempted) {
        status = "invalid";
      } else if (blockingPending === 0 && evaluated.length > 0) {
        status = "complete";
      } else if (hasInteraction || pending.length > 0) {
        status = "in-progress";
      }

      return {
        stepId,
        pending: pending.length,
        blockingPending,
        warningsPending,
        complete: evaluated.length - pending.length,
        applicable: evaluated.length,
        status,
      };
    }

    const indices = this.wizardStepsForTab(stepId);
    const parts = indices.map((i) => this.computeWizardStepValidationCore(i));
    const pending = parts.reduce((sum, p) => sum + p.pending, 0);
    const blockingPending = parts.reduce(
      (sum, p) => sum + p.blockingPending,
      0,
    );
    const warningsPending = parts.reduce(
      (sum, p) => sum + p.warningsPending,
      0,
    );
    const applicable = parts.reduce((sum, p) => sum + p.applicable, 0);
    const complete = parts.reduce((sum, p) => sum + p.complete, 0);
    const wasAttempted =
      this.attemptedSave() ||
      indices.some((i) => this.attemptedWizardSteps().has(i));
    const hasInteraction = indices.some((i) =>
      this.hasWizardStepInteraction(i),
    );

    let status: StepValidationStatus = "pending";

    if (blockingPending > 0 && wasAttempted) {
      status = "invalid";
    } else if (blockingPending === 0 && applicable > 0 && pending === 0) {
      status = "complete";
    } else if (hasInteraction || pending > 0) {
      status = "in-progress";
    }

    return {
      stepId,
      pending,
      blockingPending,
      warningsPending,
      complete,
      applicable,
      status,
    };
  }

  getWizardStepValidationSummary(
    wizardStepIndex: number,
  ): StepValidationSummary {
    if (wizardStepIndex === this.summaryWizardStepIndex()) {
      const blockingUpstream =
        Array.from({ length: this.summaryWizardStepIndex() }, (_, i) => i).some(
          (i) => this.computeWizardStepValidationCore(i).blockingPending > 0,
        ) || this.form.invalid;
      const wasAttempted = this.attemptedSave();
      let status: StepValidationStatus = "pending";

      if (!blockingUpstream) {
        status = "complete";
      } else if (wasAttempted) {
        status = "invalid";
      } else {
        status = "in-progress";
      }

      return {
        stepId: "bancario",
        pending: blockingUpstream ? 1 : 0,
        blockingPending: blockingUpstream ? 1 : 0,
        warningsPending: 0,
        complete: !blockingUpstream ? 1 : 0,
        applicable: 1,
        status,
      };
    }

    return this.computeWizardStepValidationCore(wizardStepIndex);
  }

  wizardStepUiKind(stepIndex: number): WizardStepUiKind {
    const isActive = this.isWizardStepActive(stepIndex);
    const stepWasAttempted = this.wizardStepWasAttempted(stepIndex);

    if (stepIndex === this.summaryWizardStepIndex()) {
      const summary = this.getWizardStepValidationSummary(stepIndex);
      if (summary.blockingPending > 0 && this.attemptedSave()) {
        return "errores";
      }
      if (isActive) {
        return "actual";
      }
      if (summary.blockingPending === 0) {
        return "completo";
      }
      return "pendiente";
    }

    const aplicabilidadStep = altaAplicabilidadStep(
      this.altaAplicabilidadState(),
      stepIndex,
    );

    if (aplicabilidadStep.estado === "not_applicable") {
      return "no-aplica";
    }

    if (aplicabilidadStep.estado === "optional") {
      return "opcional";
    }

    const summary = this.getWizardStepValidationSummary(stepIndex);
    /** Respeta la secuencia lineal (p. ej. paso 7 no “pasó” el 6 si APVI está fuera del flujo). */
    const stepRelevantForUi = this.wizardStepShownAsProgressed(stepIndex);

    if (summary.blockingPending > 0 && stepWasAttempted) {
      return "errores";
    }

    if (isActive) {
      return "actual";
    }

    if (summary.blockingPending === 0 && summary.status === "complete") {
      if (!stepRelevantForUi) {
        return "pendiente";
      }
      return "completo";
    }

    if (
      aplicabilidadStep.estado === "review" ||
      aplicabilidadStep.estado === "warning"
    ) {
      return "pendiente";
    }

    return "pendiente";
  }

  wizardStepUiLabel(kind: WizardStepUiKind): string {
    switch (kind) {
      case "actual":
        return "En edición";
      case "completo":
        return "Listo";
      case "pendiente":
        return "Requiere datos";
      case "errores":
        return "Revisar";
      case "opcional":
        return "Solo si aplica";
      case "no-aplica":
        return "No requerido";
    }
  }

  wizardStepNumberLabel(stepIndex: number): string {
    return String(stepIndex + 1).padStart(2, "0");
  }

  wizardStepStageLabel(stepIndex: number): string {
    if (this.isHonorariosMode()) {
      const honorariosStages: Record<number, string> = {
        2: "Registro del servicio",
        3: "Registro de honorarios",
        7: "Registro de pago",
        9: "Acta de honorarios",
      };
      return honorariosStages[stepIndex] ?? "Registro administrativo";
    }

    if (stepIndex <= 1) {
      return "Registro de identidad";
    }
    if (stepIndex <= 4) {
      return "Registro laboral";
    }
    if (stepIndex <= 7) {
      return "Registro de pago y previsión";
    }
    if (stepIndex === this.summaryWizardStepIndex()) {
      return "Acta de revisión";
    }
    return "Registro de revisión";
  }

  wizardStepDecisionLabel(stepIndex: number): string {
    const kind = this.wizardStepUiKind(stepIndex);
    switch (kind) {
      case "actual":
        return "Registro abierto";
      case "completo":
        return "Registro listo";
      case "errores":
        return "Requiere corrección";
      case "opcional":
        return "Registrar solo si corresponde";
      case "no-aplica":
        return "Fuera de este caso";
      case "pendiente":
      default:
        return "Pendiente de datos";
    }
  }

  advancedReviewRows(): {
    stepIndex: number;
    label: string;
    kind: WizardStepUiKind;
  }[] {
    return this.advancedWizardLabels.map((_, stepIndex) => ({
      stepIndex,
      label: this.wizardStepFullLabel(stepIndex),
      kind: this.reviewStepUiKind(stepIndex),
    }));
  }

  /**
   * Paso 9: pendientes en lenguaje de negocio tras intentar finalizar (reglas bloqueantes).
   */
  resumenPendientesNegocio(): string[] {
    if (
      !this.isAdvancedMode() ||
      this.pasoWizardActivo() !== this.summaryWizardStepIndex() ||
      !this.attemptedSave()
    ) {
      return [];
    }

    const seen = new Set<string>();
    const out: string[] = [];
    let blockingSinMensaje = 0;

    for (const item of this.evaluateValidationRules()) {
      if (
        !item.visible ||
        item.complete ||
        !item.blocking ||
        item.severity !== "error"
      ) {
        continue;
      }

      const msg = MENSAJES_FINALIZAR_ALTA[item.id];
      if (msg) {
        if (!seen.has(item.id)) {
          seen.add(item.id);
          out.push(msg);
        }
      } else {
        blockingSinMensaje += 1;
      }
    }

    if (out.length === 0 && blockingSinMensaje > 0) {
      out.push(
        "Revisa las etapas con pendientes o errores antes de finalizar.",
      );
    }

    return out.slice(0, 10);
  }

  reviewRowDescription(row: {
    stepIndex: number;
    kind: WizardStepUiKind;
  }): string {
    switch (row.kind) {
      case "errores":
        return "Corrige este registro antes de cerrar la ficha.";
      case "pendiente":
        return "Faltan datos o revisión administrativa en este registro.";
      case "opcional":
        return "Se completa solo si corresponde al caso laboral.";
      case "no-aplica":
        return "Registro no requerido para la configuración actual.";
      default:
        return "";
    }
  }

  hasReviewBlockingStates(): boolean {
    return this.advancedReviewRows().some((row) =>
      ["pendiente", "errores"].includes(row.kind),
    );
  }

  identificacionResumen(): string {
    const rut = this.form.controls.datosPersonales.controls.rut.value.trim();
    const pas =
      this.form.controls.datosPersonales.controls.pasaporte.value.trim();
    if (rut) {
      return rut;
    }
    if (pas) {
      return `Pasaporte ${pas}`;
    }
    return "Sin información";
  }

  getGlobalValidationSummary(): GlobalValidationSummary {
    const summaries = TAB_ORDER.map((stepId) =>
      this.getStepValidationSummary(stepId),
    );

    return {
      blockingPending: summaries.reduce(
        (total, summary) => total + summary.blockingPending,
        0,
      ),
      warningsPending: summaries.reduce(
        (total, summary) => total + summary.warningsPending,
        0,
      ),
      completeSteps: summaries.filter(
        (summary) => summary.status === "complete",
      ).length,
      invalidSteps: summaries.filter((summary) => summary.status === "invalid")
        .length,
      pendingTotal: summaries.reduce(
        (total, summary) => total + summary.pending,
        0,
      ),
    };
  }

  wizardMapPendingCount(): number {
    return this.advancedWizardLabels.filter(
      (_, index) => this.wizardStepUiKind(index) === "pendiente",
    ).length;
  }

  wizardMapOptionalCount(): number {
    return this.advancedWizardLabels.filter(
      (_, index) => this.wizardStepUiKind(index) === "opcional",
    ).length;
  }

  wizardMapErrorCount(): number {
    return this.advancedWizardLabels.filter(
      (_, index) => this.wizardStepUiKind(index) === "errores",
    ).length;
  }

  wizardMapNotApplicableCount(): number {
    return this.advancedWizardLabels.filter(
      (_, index) => this.wizardStepUiKind(index) === "no-aplica",
    ).length;
  }

  wizardMapSummaryLabel(): string {
    const errors = this.wizardMapErrorCount();
    const pending = this.wizardMapPendingCount();
    const optional = this.wizardMapOptionalCount();
    const notApplicable = this.wizardMapNotApplicableCount();
    const parts: string[] = [];

    if (errors > 0) {
      parts.push(`Revisión: ${errors}`);
    }

    if (pending > 0) {
      parts.push(`Pendientes: ${pending}`);
    }

    if (optional > 0) {
      parts.push(`Condicionales: ${optional}`);
    }

    if (errors === 0 && notApplicable > 0) {
      parts.push(`No requeridos: ${notApplicable}`);
    }

    return parts.length
      ? parts.join(" · ")
      : "Bitácora sin pendientes visibles";
  }

  private resolveWizardStep(rule: ValidationRule): number {
    if (rule.sourcePath === "contacto.idComuna") {
      return 1;
    }

    if (rule.stepId === "datosPersonales") {
      return 0;
    }

    if (rule.stepId === "bancario") {
      return 7;
    }

    if (rule.stepId === "previsionSalud") {
      return rule.category === "APVI" ? 6 : 5;
    }

    if (rule.stepId === "contrato") {
      const cat = rule.category ?? "";
      if (cat === "Perfil laboral" || cat === "Condiciones especiales") {
        return this.perfilLaboralWizardStepIndex();
      }
      if (
        cat === "Zona extrema" ||
        cat === "Cargas" ||
        cat === "Semana corrida"
      ) {
        return 4;
      }
      if (cat === "Jornada" || cat === "Remuneracion") {
        return 3;
      }
      return 2;
    }

    return 0;
  }

  private wizardStepsForTab(tabId: TabId): number[] {
    switch (tabId) {
      case "datosPersonales":
        return [0, 1];
      case "contrato":
        return [2, 3, 4, this.perfilLaboralWizardStepIndex()];
      case "previsionSalud":
        return [5, 6];
      case "bancario":
        return [7];
    }
  }

  private primaryTabForWizardStep(step: number): TabId {
    if (step <= 1) {
      return "datosPersonales";
    }
    if (step <= 4 || step === this.perfilLaboralWizardStepIndex()) {
      return "contrato";
    }
    if (step <= 6) {
      return "previsionSalud";
    }
    return "bancario";
  }

  private hasWizardStepInteraction(wizardStepIndex: number): boolean {
    if (this.attemptedSave()) {
      return true;
    }
    if (this.attemptedWizardSteps().has(wizardStepIndex)) {
      return true;
    }
    const tab = this.primaryTabForWizardStep(wizardStepIndex);
    return this.attemptedTabs().has(tab) || this.completedTabs().has(tab);
  }

  private markWizardStepVisited(step: number): void {
    this.visitedWizardSteps.update((prev) => new Set([...prev, step]));
  }

  private markWizardStepAttempted(step: number): void {
    this.markWizardStepVisited(step);
    this.attemptedWizardSteps.update((prev) => new Set([...prev, step]));
  }

  private wizardStepWasAttempted(stepIndex: number): boolean {
    return this.attemptedSave() || this.attemptedWizardSteps().has(stepIndex);
  }

  /**
   * Indica si el paso ya cuenta como “alcanzado” en el flujo lineal (para pintar completo/errores).
   * Evita marcar el paso 7 como “pasó” el 6 cuando APVI no está en `linearWizardSequence()`.
   */
  private wizardStepShownAsProgressed(stepIndex: number): boolean {
    if (this.attemptedSave() || this.attemptedWizardSteps().has(stepIndex)) {
      return true;
    }
    if (this.visitedWizardSteps().has(stepIndex)) {
      return true;
    }
    const seq = this.linearWizardSequence();
    const active = this.pasoWizardActivo();
    const iAct = seq.indexOf(active);
    const iStep = seq.indexOf(stepIndex);

    if (iAct === -1) {
      return stepIndex === active;
    }
    if (iStep === -1) {
      return false;
    }
    return iStep <= iAct;
  }

  private computeWizardStepValidationCore(
    wizardStepIndex: number,
  ): StepValidationSummary {
    const evaluated = this.evaluateValidationRules().filter(
      (item) => item.wizardStep === wizardStepIndex && item.visible,
    );
    const pending = evaluated.filter((item) => !item.complete);
    const blockingPending = pending.filter((item) => item.blocking).length;
    const warningsPending = pending.filter(
      (item) => item.severity === "warning",
    ).length;
    const wasAttempted =
      this.attemptedWizardSteps().has(wizardStepIndex) || this.attemptedSave();
    const hasInteraction = this.hasWizardStepInteraction(wizardStepIndex);

    let status: StepValidationStatus = "pending";

    if (blockingPending > 0 && wasAttempted) {
      status = "invalid";
    } else if (
      blockingPending === 0 &&
      evaluated.length > 0 &&
      pending.length === 0
    ) {
      status = "complete";
    } else if (hasInteraction || pending.length > 0) {
      status = "in-progress";
    }

    return {
      stepId: this.primaryTabForWizardStep(wizardStepIndex),
      pending: pending.length,
      blockingPending,
      warningsPending,
      complete: evaluated.length - pending.length,
      applicable: evaluated.length,
      status,
    };
  }

  private findFirstWizardStepWithBlockingIssues(): number | null {
    for (let s = 0; s < this.summaryWizardStepIndex(); s++) {
      if (this.computeWizardStepValidationCore(s).blockingPending > 0) {
        return s;
      }
    }

    return this.form.invalid ? 0 : null;
  }

  private showInvalidWizardStep(step: number): void {
    this.pasoWizardActivo.set(step);
    this.attemptedWizardSteps.update((prev) => new Set([...prev, step]));
    this.attemptAllTabs();
    this.markWizardStepTouched(step);
    this.focusFirstInvalidControl(step);
  }

  private markWizardStepTouched(step: number): void {
    switch (step) {
      case 0:
        this.markControlAsTouched(this.form.controls.datosPersonales);
        this.form.controls.contacto.controls.email.markAsTouched();
        this.form.controls.contacto.controls.telefono.markAsTouched();
        break;
      case 1:
        this.markControlAsTouched(this.form.controls.contacto);
        break;
      case 2:
      case 3:
      case 4:
        this.markControlAsTouched(this.form.controls.contrato);
        break;
      case 8:
        this.markControlAsTouched(this.form.controls.perfilLaboral);
        break;
      case 5:
      case 6:
        this.markControlAsTouched(this.form.controls.previsionSalud);
        break;
      case 7:
        this.markControlAsTouched(this.form.controls.bancario);
        break;
      default:
        this.form.markAllAsTouched();
    }
  }

  private resolveModo(): FormEmpleadoModo {
    return this.route.snapshot.queryParamMap.get("modo") === "basico"
      ? "basico"
      : "avanzado";
  }

  private async loadContinuacionBorradorSiAplica(): Promise<void> {
    const raw = this.route.snapshot.queryParamMap.get("idPersona");
    const id = raw ? Number(raw) : NaN;
    if (!Number.isInteger(id) || id < 1) {
      return;
    }

    try {
      const detalle = await this.empleadosService.obtenerPorId(id);
      if (!detalle) {
        this.catalogosError.set(
          "No se encontro la ficha indicada para continuar el alta.",
        );
        return;
      }
      if (
        detalle.pasoAltaAvanzada === null ||
        detalle.pasoAltaAvanzada === undefined
      ) {
        this.catalogosError.set(
          "Esta ficha no tiene un borrador de creacion avanzada guardado. Usa la ficha del empleado para completar por secciones.",
        );
        return;
      }

      const paso = Math.min(
        Math.max(0, detalle.pasoAltaAvanzada),
        this.totalSteps - 1,
      );
      const formValue = normalizarBorradorAvanzadoParaFormulario(
        detalle.formValue,
        paso,
      );
      this.borradorPersonaId.set(id);
      this.form.patchValue(formValue as never);
      this.pasoWizardActivo.set(paso);
      this.visitedWizardSteps.update((prev) => new Set([...prev, paso]));
      this.form.markAsPristine();
    } catch {
      this.catalogosError.set(
        "No fue posible cargar el borrador para continuar el alta.",
      );
    }
  }

  private markSubmitControlsAsTouched(): void {
    if (!this.isBasicMode()) {
      this.form.markAllAsTouched();
      return;
    }

    this.form.controls.datosPersonales.markAllAsTouched();
    this.form.controls.contacto.markAllAsTouched();
  }

  private attemptBasicGroups(): void {
    this.attemptedTabs.set(new Set<TabId>(["datosPersonales"]));
  }

  private isBasicFormInvalid(): boolean {
    return (
      this.form.controls.datosPersonales.invalid ||
      this.form.controls.contacto.invalid
    );
  }

  private async submitBasicMode(): Promise<void> {
    this.isSaving.set(true);

    try {
      const created = await this.empleadosService.crearBasico(
        mapEmpleadoFormToPayloadBasico(this.form),
      );

      this.form.markAsPristine();
      this.openBasicSuccessModal(created.id);
    } catch (error) {
      if (error instanceof EmpleadoRutDuplicadoError) {
        this.openBasicDuplicateRutModal(error.rut);
      } else {
        this.openBasicErrorModal(this.resolveSaveErrorMessage(error));
      }
    } finally {
      this.isSaving.set(false);
    }
  }

  private openBasicSuccessModal(employeeId: number): void {
    this.successFlow.set("basico");
    this.createdEmployeeId.set(employeeId);
    this.openAdvancedActionModal({
      kind: "basic-success",
      variant: "success",
      eyebrow: "Registro actualizado",
      title: "Empleado registrado correctamente",
      message:
        'La ficha quedó en estado «En proceso». Puedes completar contrato, previsión y banco desde la ficha del empleado.',
      sections: this.buildBitacoraMsgboxSections({
        pendientePrincipal:
          "La creación básica quedó registrada con los datos personales y de contacto ingresados.",
        detailItems: [`Ficha N° ${employeeId}`],
        porQueImporta:
          "El alta parcial queda trazable; hasta completar contrato y previsión la ficha no está lista para liquidar.",
        accionRecomendada:
          "Ir al listado para continuar con otras fichas o abrir la ficha del empleado para completar datos laborales.",
        pendienteTone: "success",
      }),
      primaryLabel: "Ir al listado",
      blockingItems: [],
      warningItems: [],
      infoItems: [],
      primaryAction: "go-to-list",
    });
  }

  private openBasicErrorModal(message: string): void {
    const suggestedStep = this.errorSuggestedStep(message);
    this.openAdvancedActionModal({
      kind: "basic-error",
      variant: "danger",
      eyebrow: "Error de guardado",
      title: "No fue posible registrar la ficha",
      message:
        "El registro no se completó. Revisa el detalle y vuelve a intentarlo.",
      sections: this.buildBitacoraMsgboxSections({
        pendientePrincipal: this.normalizedErrorMessage(message),
        detailItems: suggestedStep ? [`Revisar: ${suggestedStep}`] : undefined,
        porQueImporta:
          "Sin corregir el problema no se puede dejar la ficha registrada en el sistema.",
        accionRecomendada: this.errorRecommendedAction(message),
      }),
      primaryLabel: "Cerrar",
      blockingItems: [],
      warningItems: [],
      infoItems: [],
      primaryAction: "dismiss",
    });
  }

  private openBasicDuplicateRutModal(rut: string): void {
    this.openAdvancedActionModal({
      kind: "basic-duplicate-rut",
      variant: "danger",
      eyebrow: "Revisión administrativa",
      title: "Ficha ya registrada",
      message: `Ya existe un empleado registrado con el RUT ${rut}.`,
      sections: this.buildBitacoraMsgboxSections({
        pendientePrincipal:
          "No se puede crear una nueva ficha con un RUT ya registrado en el sistema.",
        detailItems: [`RUT ${rut}`],
        porQueImporta:
          "Evita duplicar la identificación del trabajador y mantiene coherencia en nómina y remuneraciones.",
        accionRecomendada:
          "Revisar el listado de empleados o editar la ficha existente antes de intentar de nuevo.",
      }),
      primaryLabel: "Cerrar",
      blockingItems: [],
      warningItems: [],
      infoItems: [],
      primaryAction: "dismiss",
    });
  }

  private openBasicCatalogWaitModal(): void {
    this.openAdvancedActionModal({
      kind: "basic-catalog-wait",
      variant: "warning",
      eyebrow: "Revisión administrativa",
      title: "Formulario en preparación",
      message:
        "Los catálogos y datos base aún se están cargando. Espera unos segundos e intenta guardar de nuevo.",
      sections: this.buildBitacoraMsgboxSections({
        pendientePrincipal:
          "Esperar a que termine la carga de catálogos antes de registrar la ficha.",
        porQueImporta:
          "Sin catálogos no se puede validar ni guardar datos personales de forma trazable.",
        accionRecomendada:
          "Reintentar el guardado cuando el formulario muestre los datos listos.",
        pendienteTone: "info",
      }),
      primaryLabel: "Cerrar",
      blockingItems: [],
      warningItems: [],
      infoItems: [],
      primaryAction: "dismiss",
    });
  }

  private getAllValidationRules(): ValidationRule[] {
    const personalGroup = this.form.controls.datosPersonales;
    const personal = personalGroup.controls;
    const contacto = this.form.controls.contacto.controls;
    const contrato = this.form.controls.contrato.controls;
    const perfilLaboral = this.form.controls.perfilLaboral.controls;
    const prevision = this.form.controls.previsionSalud.controls;
    const bancario = this.form.controls.bancario.controls;
    const esHonorarios = this.isHonorariosMode();
    const esContratoDependiente = !esHonorarios;
    const hasCuenta2 =
      prevision.tipoRegimenPrevisional.value === "AFP" &&
      (prevision.idMonedaCuenta2.value !== null ||
        prevision.valorCuenta2.value !== null);
    const requiereSalud =
      prevision.tipoRegimenPrevisional.value !== null &&
      prevision.tipoRegimenPrevisional.value !== "NINGUNA";
    const hayCondicionesPerfil =
      this.hasPerfilLaboralCondicionesSeleccionadas();
    const perfilMenorEdad = this.perfilLaboralEdadResumen().kind === "menor";
    const requiereRevisionMenor =
      perfilMenorEdad &&
      !perfilLaboral.trabajadorAdolescenteProtegido.value &&
      !perfilLaboral.autorizacionMenorRegistrada.value;

    return [
      this.rule(
        "personal.identity",
        "datosPersonales",
        "Ingresa un RUT válido o un identificador extranjero válido",
        "error",
        true,
        "datosPersonales.rut",
        "Identificacion legal",
        () =>
          !personalGroup.hasError("rutOrPassport") &&
          personal.rut.valid &&
          personal.pasaporte.valid,
      ),
      this.rule(
        "personal.birthdate",
        "datosPersonales",
        "Ingresa la fecha de nacimiento del trabajador",
        "error",
        true,
        "datosPersonales.fechaNacimiento",
        "Identificacion legal",
        () => personal.fechaNacimiento.valid,
      ),
      this.rule(
        "personal.names",
        "datosPersonales",
        "Ingresa los nombres del trabajador",
        "error",
        true,
        "datosPersonales.nombres",
        "Nombre del empleado",
        () => personal.nombres.valid,
      ),
      this.rule(
        "personal.lastname",
        "datosPersonales",
        "Ingresa el apellido paterno",
        "error",
        true,
        "datosPersonales.apellidoPaterno",
        "Nombre del empleado",
        () => personal.apellidoPaterno.valid,
      ),
      this.rule(
        "personal.sex",
        "datosPersonales",
        "Selecciona el sexo registral para la ficha laboral",
        "error",
        true,
        "datosPersonales.sexo",
        "Identificacion legal",
        () => personal.sexo.valid,
      ),
      this.rule(
        "personal.country",
        "datosPersonales",
        "Selecciona país o nacionalidad",
        "error",
        true,
        "datosPersonales.idPais",
        "Informacion base",
        () => personal.idPais.valid,
      ),
      this.rule(
        "personal.marital-status",
        "datosPersonales",
        "Selecciona el estado civil",
        "error",
        true,
        "datosPersonales.estadoCivil",
        "Informacion base",
        () => personal.estadoCivil.valid,
      ),
      this.rule(
        "personal.email-format",
        "datosPersonales",
        "Corrige el formato del correo electrónico",
        "error",
        true,
        "contacto.email",
        "Informacion base",
        () => contacto.email.valid,
        () => Boolean(contacto.email.value.trim()),
      ),
      this.rule(
        "personal.phone-format",
        "datosPersonales",
        "Corrige el formato del teléfono",
        "error",
        true,
        "contacto.telefono",
        "Informacion base",
        () => contacto.telefono.valid,
        () => Boolean(contacto.telefono.value.trim()),
      ),
      this.rule(
        "personal.email-empty",
        "datosPersonales",
        "Agrega correo de contacto si la empresa lo usará para comunicaciones laborales",
        "warning",
        false,
        "contacto.email",
        "Informacion base",
        () => Boolean(contacto.email.value.trim()),
      ),
      this.rule(
        "personal.phone-empty",
        "datosPersonales",
        "Agrega teléfono de contacto si la empresa lo usará para comunicaciones laborales",
        "warning",
        false,
        "contacto.telefono",
        "Informacion base",
        () => Boolean(contacto.telefono.value.trim()),
      ),
      this.rule(
        "personal.passport-review",
        "datosPersonales",
        "Revisa la identificación extranjera antes de finalizar la contratación",
        "warning",
        false,
        "datosPersonales.pasaporte",
        "Identificacion legal",
        () => Boolean(personal.rut.value.trim()),
        () =>
          Boolean(personal.pasaporte.value.trim()) &&
          !Boolean(personal.rut.value.trim()),
      ),
      this.rule(
        "contact.commune",
        "datosPersonales",
        "Selecciona la comuna del domicilio contractual",
        "error",
        true,
        "contacto.idComuna",
        "Domicilio",
        () => contacto.idComuna.valid,
        () => this.isAdvancedMode() && esContratoDependiente,
      ),
      this.rule(
        "contact.commune-honorarios",
        "datosPersonales",
        "Agrega comuna del prestador si se usará como dato administrativo de contacto",
        "warning",
        false,
        "contacto.idComuna",
        "Domicilio",
        () => contacto.idComuna.valid,
        () => this.isAdvancedMode() && esHonorarios,
      ),

      this.rule(
        esHonorarios ? "honorarios.service" : "contract.position",
        "contrato",
        esHonorarios
          ? "Ingresa el servicio o función del prestador"
          : "Ingresa el cargo o función del trabajador",
        "error",
        true,
        "contrato.cargo",
        esHonorarios ? "Honorarios" : "Contrato",
        () =>
          contrato.cargo.valid && !this.isTechnicalCargo(contrato.cargo.value),
      ),
      this.rule(
        "contract.branch",
        "contrato",
        "Selecciona sucursal u organización",
        "error",
        true,
        "contrato.idSucursal",
        "Contrato",
        () => contrato.idSucursal.value !== null,
        () => esContratoDependiente,
      ),
      this.rule(
        "honorarios.cost-center",
        "contrato",
        "Selecciona sucursal o centro de costo si necesitas imputar internamente el servicio",
        "warning",
        false,
        "contrato.idSucursal",
        "Honorarios",
        () =>
          contrato.idSucursal.value !== null ||
          contrato.idCentroCosto.value !== null,
        () => esHonorarios,
      ),
      this.rule(
        "contract.worker-type",
        "contrato",
        "Selecciona el tipo de trabajador",
        "error",
        true,
        "contrato.idTipoTrabajador",
        "Contrato",
        () => contrato.idTipoTrabajador.valid,
        () => esContratoDependiente,
      ),
      this.rule(
        "contract.schedule-type",
        "contrato",
        "Selecciona el tipo de jornada",
        "error",
        true,
        "contrato.idTipoJornada",
        "Jornada",
        () => contrato.idTipoJornada.valid,
        () => esContratoDependiente,
      ),
      this.rule(
        "contract.contract-type",
        "contrato",
        "Selecciona el tipo de contrato",
        "error",
        true,
        "contrato.tipoContrato",
        "Contrato",
        () => contrato.tipoContrato.valid,
        () => esContratoDependiente,
      ),
      this.rule(
        "contract.start-date",
        "contrato",
        "Ingresa la fecha de ingreso",
        "error",
        true,
        "contrato.fechaIngreso",
        "Fechas",
        () => contrato.fechaIngreso.valid,
      ),
      this.rule(
        "contract.document-date",
        "contrato",
        "Ingresa la fecha del contrato",
        "error",
        true,
        "contrato.fechaContrato",
        "Fechas",
        () => contrato.fechaContrato.valid,
        () => esContratoDependiente,
      ),
      this.rule(
        "contract.end-date",
        "contrato",
        "Ingresa la fecha de término del contrato",
        "error",
        true,
        "contrato.fechaTermino",
        "Fechas",
        () => contrato.fechaTermino.valid,
        () =>
          esContratoDependiente &&
          contrato.tipoContrato.value !== null &&
          contrato.tipoContrato.value !== "INDEFINIDO",
      ),
      this.rule(
        esHonorarios ? "honorarios.amount" : "contract.salary",
        "contrato",
        esHonorarios
          ? "Ingresa el monto bruto de honorarios"
          : "Ingresa sueldo base válido",
        "error",
        true,
        "contrato.sueldoBase",
        esHonorarios ? "Honorarios" : "Remuneracion",
        () => contrato.sueldoBase.valid,
      ),
      this.rule(
        esHonorarios ? "honorarios.currency" : "contract.currency",
        "contrato",
        esHonorarios
          ? "Selecciona la moneda del monto bruto de honorarios"
          : "Selecciona la moneda de remuneración",
        "error",
        true,
        "contrato.idMoneda",
        esHonorarios ? "Honorarios" : "Remuneracion",
        () => contrato.idMoneda.value !== null,
      ),
      this.rule(
        "contract.weekly-hours",
        "contrato",
        "Completa las horas semanales pactadas",
        "error",
        true,
        "contrato.horasSemanales",
        "Jornada",
        () => contrato.horasSemanales.valid,
        () => esContratoDependiente,
      ),
      this.rule(
        "contract.weekly-days",
        "contrato",
        "Completa los días semanales de trabajo",
        "error",
        true,
        "contrato.diasSemanales",
        "Jornada",
        () => contrato.diasSemanales.valid,
        () => esContratoDependiente,
      ),
      this.rule(
        "contract.week-run",
        "contrato",
        "Completa los días laborables para semana corrida",
        "error",
        true,
        "contrato.semanaCorridaDiasLaborables",
        "Semana corrida",
        () => contrato.semanaCorridaDiasLaborables.valid,
        () => esContratoDependiente && contrato.semanaCorridaActiva.value,
      ),
      this.rule(
        "contract.extreme-zone-area",
        "contrato",
        "Selecciona el territorio asociado a zona extrema",
        "error",
        true,
        "contrato.zonaExtremaTerritorio",
        "Zona extrema",
        () => contrato.zonaExtremaTerritorio.valid,
        () => esContratoDependiente && contrato.zonaExtremaActiva.value,
      ),
      this.rule(
        "contract.extreme-zone-rate",
        "contrato",
        "Ingresa el porcentaje de zona extrema",
        "error",
        true,
        "contrato.zonaExtremaPorcentaje",
        "Zona extrema",
        () => contrato.zonaExtremaPorcentaje.valid,
        () => esContratoDependiente && contrato.zonaExtremaActiva.value,
      ),
      this.rule(
        "contract.family-allowance",
        "contrato",
        "Confirma el tramo de cargas familiares antes de usar la asignación en remuneraciones",
        "warning",
        false,
        "contrato.idTramoCarga",
        "Cargas",
        () => contrato.idTramoCarga.value !== null,
        () => esContratoDependiente && Number(contrato.cargas.value ?? 0) > 0,
      ),

      this.rule(
        "profile-laboral.minor-review",
        "contrato",
        "Menor de 18 detectado: revisa si corresponde trabajador adolescente protegido o autorización de menor",
        "warning",
        false,
        "perfilLaboral.trabajadorAdolescenteProtegido",
        "Condiciones especiales",
        () => !requiereRevisionMenor,
        () => esContratoDependiente && perfilMenorEdad,
      ),
      this.rule(
        "profile-laboral.support",
        "contrato",
        "Marca respaldo administrativo registrado para las condiciones especiales seleccionadas",
        "warning",
        false,
        "perfilLaboral.respaldoRegistrado",
        "Condiciones especiales",
        () => perfilLaboral.respaldoRegistrado.value,
        () => esContratoDependiente && hayCondicionesPerfil,
      ),
      this.rule(
        "profile-laboral.valid-from",
        "contrato",
        "Completa la vigencia de inicio de las condiciones especiales",
        "error",
        true,
        "perfilLaboral.vigenciaInicio",
        "Condiciones especiales",
        () => perfilLaboral.vigenciaInicio.valid,
        () => esContratoDependiente && hayCondicionesPerfil,
      ),
      this.rule(
        "profile-laboral.observation-length",
        "contrato",
        "Reduce la observación interna de condiciones especiales",
        "error",
        true,
        "perfilLaboral.observacion",
        "Condiciones especiales",
        () => perfilLaboral.observacion.valid,
        () =>
          esContratoDependiente &&
          Boolean(perfilLaboral.observacion.value.trim()),
      ),

      this.rule(
        "prevision.regime",
        "previsionSalud",
        "Selecciona el régimen previsional",
        "error",
        true,
        "previsionSalud.tipoRegimenPrevisional",
        "Prevision",
        () => prevision.tipoRegimenPrevisional.valid,
        () => esContratoDependiente,
      ),
      this.rule(
        "prevision.afp",
        "previsionSalud",
        "Selecciona la AFP del trabajador",
        "error",
        true,
        "previsionSalud.idAfp",
        "Prevision",
        () => prevision.idAfp.valid,
        () =>
          esContratoDependiente &&
          prevision.tipoRegimenPrevisional.value === "AFP",
      ),
      this.rule(
        "prevision.ips-name",
        "previsionSalud",
        "Ingresa la entidad o ex caja IPS",
        "error",
        true,
        "previsionSalud.nombreExCaja",
        "IPS",
        () => prevision.nombreExCaja.valid,
        () =>
          esContratoDependiente &&
          prevision.tipoRegimenPrevisional.value === "IPS",
      ),
      this.rule(
        "prevision.ips-regime",
        "previsionSalud",
        "Ingresa el régimen IPS",
        "error",
        true,
        "previsionSalud.regimenExCaja",
        "IPS",
        () => prevision.regimenExCaja.valid,
        () =>
          esContratoDependiente &&
          prevision.tipoRegimenPrevisional.value === "IPS",
      ),
      this.rule(
        "prevision.ips-rate",
        "previsionSalud",
        "Ingresa la tasa IPS",
        "error",
        true,
        "previsionSalud.tasaExCaja",
        "IPS",
        () => prevision.tasaExCaja.valid,
        () =>
          esContratoDependiente &&
          prevision.tipoRegimenPrevisional.value === "IPS",
      ),
      this.rule(
        "prevision.health",
        "previsionSalud",
        "Selecciona la institución de salud",
        "error",
        true,
        "previsionSalud.idSalud",
        "Salud",
        () => prevision.idSalud.valid,
        () => esContratoDependiente && requiereSalud,
      ),
      this.rule(
        "prevision.health-currency",
        "previsionSalud",
        "Selecciona la moneda del plan de salud",
        "error",
        true,
        "previsionSalud.idMonedaPlan",
        "Salud",
        () => prevision.idMonedaPlan.valid,
        () => esContratoDependiente && requiereSalud,
      ),
      this.rule(
        "prevision.health-plan",
        "previsionSalud",
        "Ingresa el valor del plan de salud",
        "error",
        true,
        "previsionSalud.valorPlan",
        "Salud",
        () => prevision.valorPlan.valid,
        () => esContratoDependiente && requiereSalud,
      ),
      this.rule(
        "prevision.health-ges",
        "previsionSalud",
        "Ingresa el adicional Auge o GES",
        "error",
        true,
        "previsionSalud.adicionalAugeGes",
        "Salud",
        () => prevision.adicionalAugeGes.valid,
        () => esContratoDependiente && requiereSalud,
      ),
      this.rule(
        "prevision.account2-currency",
        "previsionSalud",
        "Selecciona la moneda de Cuenta 2 AFP",
        "error",
        true,
        "previsionSalud.idMonedaCuenta2",
        "Cuenta 2",
        () => prevision.idMonedaCuenta2.valid,
        () => esContratoDependiente && hasCuenta2,
      ),
      this.rule(
        "prevision.account2-value",
        "previsionSalud",
        "Ingresa el valor de Cuenta 2 AFP",
        "error",
        true,
        "previsionSalud.valorCuenta2",
        "Cuenta 2",
        () => prevision.valorCuenta2.valid,
        () => esContratoDependiente && hasCuenta2,
      ),
      this.rule(
        "prevision.apv-institution",
        "previsionSalud",
        "Selecciona la institución APVI",
        "error",
        true,
        "previsionSalud.idInstitucionApv",
        "APVI",
        () => prevision.idInstitucionApv.valid,
        () =>
          esContratoDependiente &&
          prevision.tipoRegimenPrevisional.value === "AFP" &&
          prevision.tieneApv.value,
      ),
      this.rule(
        "prevision.apv-currency",
        "previsionSalud",
        "Selecciona la moneda APVI",
        "error",
        true,
        "previsionSalud.idMonedaApv",
        "APVI",
        () => prevision.idMonedaApv.valid,
        () =>
          esContratoDependiente &&
          prevision.tipoRegimenPrevisional.value === "AFP" &&
          prevision.tieneApv.value,
      ),
      this.rule(
        "prevision.apv-amount",
        "previsionSalud",
        "Ingresa el monto APVI",
        "error",
        true,
        "previsionSalud.montoApv",
        "APVI",
        () => prevision.montoApv.valid,
        () =>
          esContratoDependiente &&
          prevision.tipoRegimenPrevisional.value === "AFP" &&
          prevision.tieneApv.value,
      ),
      this.rule(
        "prevision.apv-payment",
        "previsionSalud",
        "Selecciona la forma de pago APVI",
        "error",
        true,
        "previsionSalud.idFormaPagoApv",
        "APVI",
        () => prevision.idFormaPagoApv.valid,
        () =>
          esContratoDependiente &&
          prevision.tipoRegimenPrevisional.value === "AFP" &&
          prevision.tieneApv.value,
      ),
      this.rule(
        "prevision.apv-agreement",
        "previsionSalud",
        "Completa el depósito convenido APVI",
        "error",
        true,
        "previsionSalud.depositoConvenidoApvi",
        "APVI",
        () => prevision.depositoConvenidoApvi.valid,
        () =>
          esContratoDependiente &&
          prevision.tipoRegimenPrevisional.value === "AFP" &&
          prevision.tieneApv.value,
      ),

      this.rule(
        "bank.bank",
        "bancario",
        "Selecciona el banco para la transferencia",
        "error",
        true,
        "bancario.idBanco",
        "Bancario",
        () => bancario.idBanco.valid,
        () => esContratoDependiente,
      ),
      this.rule(
        "bank.account-type",
        "bancario",
        "Selecciona el tipo de cuenta bancaria",
        "error",
        true,
        "bancario.idTipoCuentaBancaria",
        "Bancario",
        () => bancario.idTipoCuentaBancaria.valid,
        () => esContratoDependiente,
      ),
      this.rule(
        "bank.account-number",
        "bancario",
        "Ingresa una cuenta bancaria real",
        "error",
        true,
        "bancario.numeroCuenta",
        "Bancario",
        () =>
          bancario.numeroCuenta.valid &&
          !this.isDraftAccount(bancario.numeroCuenta.value),
        () => esContratoDependiente,
      ),
      this.rule(
        "honorarios.bank-data",
        "bancario",
        "Agrega datos de pago si el prestador recibirá transferencia",
        "warning",
        false,
        "bancario.idBanco",
        "Honorarios",
        () =>
          bancario.idBanco.value !== null &&
          bancario.idTipoCuentaBancaria.value !== null &&
          Boolean(bancario.numeroCuenta.value.trim()) &&
          !this.isDraftAccount(bancario.numeroCuenta.value),
        () => esHonorarios,
      ),
    ];
  }

  private evaluateValidationRules(): EvaluatedValidationRule[] {
    return evaluarDiagnosticoFichaEmpleado(this.buildFichaValidacionSnapshot())
      .items
      .map((item) => ({
        id: item.id,
        stepId: item.formTab,
        wizardStep: item.wizardStep,
        sectionTitle: item.category ?? item.seccion,
        label: item.label,
        detail: item.detalle,
        actionLabel: item.accion,
        severity: item.severity,
        blocking: item.blocking,
        complete: item.complete,
        visible: item.visible,
        sourcePath: item.controlPath,
        category: item.category,
      }));
  }

  private buildFichaValidacionSnapshot(): EmpleadoFichaValidacionSnapshot {
    const raw = this.form.getRawValue();
    const salud = this.catalogos().entidadesSalud.find(
      (item) => item.value === raw.previsionSalud.idSalud,
    );
    const edadResumen = this.perfilLaboralEdadResumen();
    const tieneCondicionesEspeciales = this.hasPerfilLaboralCondicionesSeleccionadas();

    return {
      origenCreacion: this.isBasicMode() ? "basico" : "avanzado",
      pasoAltaAvanzada: null,
      relacionLaboral: raw.contrato.relacionLaboral,
      estado: raw.contrato.estado,
      rut: raw.datosPersonales.rut,
      pasaporte: raw.datosPersonales.pasaporte,
      nombres: raw.datosPersonales.nombres,
      apellidoPaterno: raw.datosPersonales.apellidoPaterno,
      fechaNacimiento: raw.datosPersonales.fechaNacimiento,
      sexo: raw.datosPersonales.sexo,
      idPais: raw.datosPersonales.idPais,
      estadoCivil: raw.datosPersonales.estadoCivil,
      email: raw.contacto.email,
      telefono: raw.contacto.telefono,
      idComuna: raw.contacto.idComuna,
      idSucursal: raw.contrato.idSucursal,
      idCentroCosto: raw.contrato.idCentroCosto,
      cargo: raw.contrato.cargo,
      fechaContrato: raw.contrato.fechaContrato,
      tipoContrato: raw.contrato.tipoContrato,
      idTipoTrabajador: raw.contrato.idTipoTrabajador,
      idTipoJornada: raw.contrato.idTipoJornada,
      seguroCesantia: raw.contrato.seguroCesantia,
      fechaIngreso: raw.contrato.fechaIngreso,
      fechaTermino: raw.contrato.fechaTermino,
      sueldoBase: raw.contrato.sueldoBase,
      idMoneda: raw.contrato.idMoneda,
      horasSemanales: raw.contrato.horasSemanales,
      diasSemanales: raw.contrato.diasSemanales,
      semanaCorridaActiva: raw.contrato.semanaCorridaActiva,
      semanaCorridaDiasLaborables: raw.contrato.semanaCorridaDiasLaborables,
      zonaExtremaActiva: raw.contrato.zonaExtremaActiva,
      zonaExtremaTerritorio: raw.contrato.zonaExtremaTerritorio,
      zonaExtremaPorcentaje: raw.contrato.zonaExtremaPorcentaje,
      cargas: raw.contrato.cargas,
      idTramoCarga: raw.contrato.idTramoCarga,
      perfilLaboralMenorEdad: edadResumen.kind === "menor",
      trabajadorAdolescenteProtegido: raw.perfilLaboral.trabajadorAdolescenteProtegido,
      autorizacionMenorRegistrada: raw.perfilLaboral.autorizacionMenorRegistrada,
      tieneCondicionesEspeciales,
      respaldoRegistrado: raw.perfilLaboral.respaldoRegistrado,
      vigenciaInicioCondiciones: raw.perfilLaboral.vigenciaInicio,
      observacionCondiciones: raw.perfilLaboral.observacion,
      observacionCondicionesValida: this.form.controls.perfilLaboral.controls.observacion.valid,
      tipoPrevision: raw.previsionSalud.tipoRegimenPrevisional,
      idRegimenPrevisional: null,
      idAfp: raw.previsionSalud.idAfp,
      idEntidadPrevisionalIps: raw.previsionSalud.idEntidadPrevisionalIps,
      idExCajaPrevisional: raw.previsionSalud.idExCajaPrevisional,
      idRegimenExCaja: raw.previsionSalud.idRegimenExCaja,
      nombreExCaja: raw.previsionSalud.nombreExCaja,
      regimenExCaja: raw.previsionSalud.regimenExCaja,
      tasaExCaja: raw.previsionSalud.tasaExCaja,
      idSalud: raw.previsionSalud.idSalud,
      tipoSalud: salud?.tipo ?? null,
      idMonedaPlan: raw.previsionSalud.idMonedaPlan,
      valorPlan: raw.previsionSalud.valorPlan,
      adicionalAugeGes: raw.previsionSalud.adicionalAugeGes,
      idMonedaCuenta2: raw.previsionSalud.idMonedaCuenta2,
      valorCuenta2: raw.previsionSalud.valorCuenta2,
      tieneApv: raw.previsionSalud.tieneApv,
      idInstitucionApv: raw.previsionSalud.idInstitucionApv,
      idMonedaApv: raw.previsionSalud.idMonedaApv,
      montoApv: raw.previsionSalud.montoApv,
      idFormaPagoApv: raw.previsionSalud.idFormaPagoApv,
      depositoConvenidoApvi: raw.previsionSalud.depositoConvenidoApvi,
      idBanco: raw.bancario.idBanco,
      idTipoCuentaBancaria: raw.bancario.idTipoCuentaBancaria,
      numeroCuenta: raw.bancario.numeroCuenta,
    };
  }

  altaCoherenciaState(): EstadoCoherenciaAlta {
    const contrato = this.form.controls.contrato.controls;
    const personal = this.form.controls.datosPersonales.controls;
    const prevision = this.form.controls.previsionSalud.controls;
    const perfil = this.form.controls.perfilLaboral.controls;

    return evaluarAltaCoherencia({
      relacionLaboral: contrato.relacionLaboral.value,
      tipoContrato: contrato.tipoContrato.value,
      tipoJornadaLabel: this.selectedTipoJornadaLabel(),
      fechaNacimiento: personal.fechaNacimiento.value,
      fechaIngreso: contrato.fechaIngreso.value,
      horasSemanales: contrato.horasSemanales.value,
      seguroCesantia: contrato.seguroCesantia.value,
      tipoRegimenPrevisional: prevision.tipoRegimenPrevisional.value,
      condiciones: {
        pensionado: perfil.pensionado.value,
        pensionadoInvalidezParcial: perfil.pensionadoInvalidezParcial.value,
        pensionadoInvalidezTotal: perfil.pensionadoInvalidezTotal.value,
        exentoCotizacionPension: perfil.exentoCotizacionPension.value,
        trabajadorAdolescenteProtegido:
          perfil.trabajadorAdolescenteProtegido.value,
        autorizacionMenorRegistrada: perfil.autorizacionMenorRegistrada.value,
        tecnicoExtranjeroExento: perfil.tecnicoExtranjeroExento.value,
        discapacidad: perfil.discapacidad.value,
        respaldoRegistrado: perfil.respaldoRegistrado.value,
      },
    });
  }

  altaAplicabilidadState(): EstadoAplicabilidadAlta {
    const contrato = this.form.controls.contrato.controls;
    const prevision = this.form.controls.previsionSalud.controls;
    const perfil = this.form.controls.perfilLaboral.controls;
    const edadResumen = this.perfilLaboralEdadResumen();

    return evaluarAltaAplicabilidad({
      relacionLaboral: contrato.relacionLaboral.value,
      tipoContrato: contrato.tipoContrato.value,
      tipoRegimenPrevisional: prevision.tipoRegimenPrevisional.value,
      tieneApv: prevision.tieneApv.value,
      tieneCondicionesEspeciales:
        this.hasPerfilLaboralCondicionesSeleccionadas(),
      tieneRespaldoCondiciones: perfil.respaldoRegistrado.value,
      esMenorEdad: edadResumen.kind === "menor",
      esMayor65: edadResumen.kind === "mayor",
    });
  }

  aplicabilidadItem(campo: AltaAplicabilidadCampo): AltaAplicabilidadItem {
    return this.altaAplicabilidadState().campos[campo];
  }

  aplicabilidadStepMotivo(stepIndex: number): string {
    return altaAplicabilidadStep(this.altaAplicabilidadState(), stepIndex)
      .motivo;
  }

  diagnosticoContractualRows(): readonly {
    label: string;
    estado: string;
    motivo: string;
    tone: string;
  }[] {
    const estado = this.altaAplicabilidadState();
    const campos: readonly AltaAplicabilidadCampo[] = this.isHonorariosMode()
      ? ["tipoTrabajador", "montoHonorarios", "banco", "resumenFinal"]
      : [
          "tipoTrabajador",
          "jornadaLaboral",
          "seguroCesantia",
          "regimenPrevisional",
          "condicionesEspeciales",
        ];

    return campos.map((campo) => {
      const item = estado.campos[campo];
      return {
        label: item.label,
        estado: this.diagnosticoEstadoLabel(item.estado),
        motivo: item.motivo,
        tone: item.estado,
      };
    });
  }

  diagnosticoContractualBadge(): string {
    const bloqueos = this.altaAplicabilidadState().resumen.blocked;
    const revisiones = this.inconsistenciasCoherencia().length;

    if (bloqueos > 0) {
      return `${bloqueos} bloqueo(s) de fase`;
    }

    if (revisiones > 0) {
      return `${revisiones} punto(s) a revisar`;
    }

    if (this.isHonorariosMode()) {
      return "Borrador disponible";
    }

    return "Alta coherente";
  }

  diagnosticoContractualDescripcion(): string {
    const bloqueos = this.altaAplicabilidadState().resumen.blocked;
    const revisiones = this.inconsistenciasCoherencia().length;

    if (this.isHonorariosMode()) {
      return "El sistema identificó un alta a honorarios y separó los datos de pago de los campos laborales dependientes.";
    }

    if (bloqueos > 0) {
      return "Hay una restricción de fase que impide finalizar con el flujo actual.";
    }

    if (revisiones > 0) {
      return "Hay revisiones administrativas que deben decidirse antes de finalizar o quedar mantenidas bajo revisión.";
    }

    return "El sistema revisó contrato, jornada, previsión y condiciones especiales según la relación seleccionada.";
  }

  diagnosticoContractualCasoLabel(): string {
    const edad = this.perfilLaboralEdadResumen().label;

    if (this.isHonorariosMode()) {
      return `${edad} · Prestador a honorarios / independiente`;
    }

    return `${edad} · Trabajador dependiente / ${this.tipoContratoResumenLabel()}`;
  }

  private diagnosticoEstadoLabel(
    estado: AltaAplicabilidadItem["estado"],
  ): string {
    switch (estado) {
      case "required":
        return "Aplica";
      case "optional":
        return "Solo si aplica";
      case "derived":
        return "Definido por sistema";
      case "not_applicable":
        return "No requerido";
      case "review":
        return "Revisión RRHH";
      case "warning":
        return "Revisión RRHH";
      case "blocked":
        return "Bloqueado";
    }
  }

  private tipoContratoResumenLabel(): string {
    switch (this.form.controls.contrato.controls.tipoContrato.value) {
      case "INDEFINIDO":
        return "contrato indefinido";
      case "PLAZO_FIJO":
        return "contrato a plazo fijo";
      case "OBRA_SERVICIO":
        return "contrato por obra o servicio";
      case "CASA_PARTICULAR":
        return "contrato de casa particular";
      default:
        return "contrato pendiente";
    }
  }

  inconsistenciasCoherencia(): readonly InconsistenciaCoherenciaAlta[] {
    return this.altaCoherenciaState().inconsistencias;
  }

  inconsistenciasCoherenciaPasoActivo(): readonly InconsistenciaCoherenciaAlta[] {
    return this.inconsistenciasCoherenciaPorPaso(this.pasoWizardActivo());
  }

  inconsistenciasCoherenciaPorPaso(stepIndex: number): readonly InconsistenciaCoherenciaAlta[] {
    return this.inconsistenciasCoherencia().filter(
      (issue) => issue.stepIndex === stepIndex,
    );
  }

  coherenciaResumenItems(): readonly string[] {
    return this.inconsistenciasCoherencia()
      .map((issue) => issue.summary)
      .slice(0, 6);
  }

  coherenciaResumenBadge(): string {
    const inconsistencias = this.inconsistenciasCoherencia();

    if (inconsistencias.length === 0) {
      return "Sin revisiones";
    }

    const porDecidir = inconsistencias.filter(
      (issue) =>
        issue.action && !this.idsInconsistenciasCoherenciaReconocidas().has(issue.id),
    ).length;

    if (porDecidir > 0) {
      return `${porDecidir} por decidir`;
    }

    return `${inconsistencias.length} mantenida(s) bajo revisión`;
  }

  coherenciaStatusRows(): readonly {
    label: string;
    detail: string;
    tone: string;
  }[] {
    const estado = this.altaCoherenciaState();
    return [
      {
        label: `Seguro de Cesantía: ${estado.seguroCesantia.label}`,
        detail: estado.seguroCesantia.detail,
        tone: estado.seguroCesantia.tone,
      },
      {
        label: `Jornada: ${estado.jornada.label}`,
        detail: estado.jornada.detail,
        tone: estado.jornada.tone,
      },
      {
        label: `Previsión: ${estado.prevision.label}`,
        detail: estado.prevision.detail,
        tone: estado.prevision.tone,
      },
    ];
  }

  private primeraDecisionCoherenciaPorPaso(
    stepIndex: number,
  ): InconsistenciaCoherenciaAlta | null {
    return (
      this.inconsistenciasCoherenciaPorPaso(stepIndex).find(
        (issue) =>
          issue.action && !this.idsInconsistenciasCoherenciaReconocidas().has(issue.id),
      ) ?? null
    );
  }

  private primeraDecisionCoherenciaSinReconocer(): InconsistenciaCoherenciaAlta | null {
    return (
      this.inconsistenciasCoherencia().find(
        (issue) =>
          issue.action && !this.idsInconsistenciasCoherenciaReconocidas().has(issue.id),
      ) ?? null
    );
  }

  private pendingValidationItemsForWizardStep(
    wizardStep: number,
  ): EvaluatedValidationRule[] {
    return this.evaluateValidationRules()
      .filter(
        (item) =>
          item.visible && item.wizardStep === wizardStep && !item.complete,
      )
      .sort(
        (a, b) => this.validationSortWeight(a) - this.validationSortWeight(b),
      );
  }

  private pendingValidationItemsForFinalization(): EvaluatedValidationRule[] {
    return this.evaluateValidationRules()
      .filter((item) => item.visible && !item.complete)
      .sort((a, b) => {
        const byStep = a.wizardStep - b.wizardStep;
        return byStep !== 0
          ? byStep
          : this.validationSortWeight(a) - this.validationSortWeight(b);
      });
  }

  private openAdvancedActionModal(modal: AdvancedActionModal): void {
    this.errorMessage.set(null);
    this.duplicateRutModalRut.set(null);
    this.successMessage.set(null);
    this.advancedActionModal.set(modal);
  }

  private openCoherenceDecisionModal(
    issue: InconsistenciaCoherenciaAlta,
    context: "next" | "finish",
  ): void {
    this.decisionCoherenciaPendiente.set({ issue, context });
    this.openAdvancedActionModal({
      kind: "coherence-decision",
      variant: "warning",
      eyebrow: "Revisión administrativa",
      title: issue.title,
      message:
        context === "finish"
          ? "Antes de finalizar conviene decidir esta combinación en la bitácora."
          : "Antes de seguir conviene decidir esta combinación en la bitácora.",
      sections: this.buildBitacoraMsgboxSections({
        pendientePrincipal: issue.detail,
        porQueImporta:
          "La decisión queda visible en la bitácora y en el resumen hasta que la cierres o apliques la corrección.",
        accionRecomendada:
          context === "finish"
            ? "Aplicar la corrección sugerida o mantener bajo revisión y revisar el resumen antes de finalizar."
            : "Aplicar la corrección sugerida o mantener bajo revisión y continuar el recorrido.",
      }),
      primaryLabel:
        issue.recommendedActionLabel ?? "Aplicar corrección sugerida",
      secondaryLabel:
        context === "finish" ? "Mantener y finalizar" : "Mantener y continuar",
      blockingItems: [],
      warningItems: [],
      infoItems: [],
      targetStep: issue.stepIndex,
      primaryAction: "apply-coherence-suggestion",
      secondaryAction: "keep-coherence-review",
    });
  }

  private applyPendingCoherenceSuggestion(): void {
    const pending = this.decisionCoherenciaPendiente();
    if (!pending) {
      this.advancedActionModal.set(null);
      return;
    }

    this.applyCoherenceAction(pending.issue.action, pending.issue.actionValue);
    this.decisionCoherenciaPendiente.set(null);
    this.advancedActionModal.set(null);
    this.idsInconsistenciasCoherenciaReconocidas.update((prev) => {
      const next = new Set(prev);
      next.delete(pending.issue.id);
      return next;
    });
    this.syncCompletedTabsFromValidity();
    this.selectWizardStep(pending.issue.stepIndex);
  }

  private keepPendingCoherenceReview(): void {
    const pending = this.decisionCoherenciaPendiente();
    if (!pending) {
      this.advancedActionModal.set(null);
      return;
    }

    this.idsInconsistenciasCoherenciaReconocidas.update(
      (prev) => new Set([...prev, pending.issue.id]),
    );
    this.decisionCoherenciaPendiente.set(null);
    this.advancedActionModal.set(null);
    this.syncCompletedTabsFromValidity();

    if (pending.context === "finish") {
      this.markAllValidTabsAsCompleted();
      this.openFinishConfirmModal();
      return;
    }

    this.advanceToNextWizardStep();
  }

  private applyCoherenceAction(
    action: AccionCoherenciaAlta | undefined,
    value: boolean | number | undefined,
  ): void {
    const contrato = this.form.controls.contrato.controls;
    const perfil = this.form.controls.perfilLaboral.controls;

    switch (action) {
      case "activarSeguroCesantia":
      case "desactivarSeguroCesantia":
        contrato.seguroCesantia.setValue(Boolean(value));
        contrato.seguroCesantia.markAsDirty();
        contrato.seguroCesantia.markAsTouched();
        break;
      case "ajustarHorasSemanales":
        contrato.horasSemanales.setValue(
          typeof value === "number" ? value : null,
        );
        contrato.horasSemanales.markAsDirty();
        contrato.horasSemanales.markAsTouched();
        break;
      case "marcarTrabajadorAdolescenteProtegido":
        perfil.trabajadorAdolescenteProtegido.setValue(true);
        perfil.trabajadorAdolescenteProtegido.markAsDirty();
        perfil.trabajadorAdolescenteProtegido.markAsTouched();
        break;
      case "marcarExentoCotizacionPension":
        perfil.exentoCotizacionPension.setValue(true);
        perfil.exentoCotizacionPension.markAsDirty();
        perfil.exentoCotizacionPension.markAsTouched();
        this.selectWizardStep(this.perfilLaboralWizardStepIndex());
        break;
      default:
        break;
    }
  }

  private openNextStepReviewModal(
    step: number,
    pending: readonly EvaluatedValidationRule[],
  ): void {
    const blocking = pending.filter(
      (item) => item.blocking && item.severity === "error",
    );
    const warnings = pending.filter((item) => item.severity === "warning");
    const label = this.wizardStepShortLabel(step);
    const hasBlocking = blocking.length > 0;
    const fieldItems = hasBlocking
      ? this.validationModalFieldItems(blocking)
      : [];
    const detailItems = hasBlocking
      ? []
      : this.validationModalLabels(warnings, 6);

    this.openAdvancedActionModal({
      kind: "next-step-review",
      variant: hasBlocking ? "warning" : "info",
      eyebrow: "Revisión administrativa",
      title: hasBlocking
        ? "Datos pendientes en este registro"
        : "Advertencias de revisión",
      message: hasBlocking
        ? `El registro «${label}» aún tiene datos obligatorios. Puedes corregirlos ahora o continuar y volver antes de finalizar.`
        : `El registro «${label}» tiene revisiones que no bloquean el avance, pero conviene dejarlas claras.`,
      sections: this.buildBitacoraMsgboxSections({
        pendientePrincipal: hasBlocking
          ? `Completar ${fieldItems.length || blocking.length} dato${(fieldItems.length || blocking.length) === 1 ? "" : "s"} obligatorio${(fieldItems.length || blocking.length) === 1 ? "" : "s"} del registro «${label}».`
          : `Revisar las advertencias administrativas del registro «${label}».`,
        detailItems,
        porQueImporta:
          "Cada pendiente queda trazado en la bitácora laboral hasta que lo cierres o decidas continuar con revisión pendiente.",
        accionRecomendada: hasBlocking
          ? "Corregir ahora el primer campo pendiente o continuar y volver a este registro desde la bitácora."
          : "Aclarar las revisiones ahora o continuar; el resumen final mantendrá lo pendiente.",
        pendienteTone: hasBlocking ? "attention" : "info",
      }),
      primaryLabel: "Continuar",
      secondaryLabel: "Corregir ahora",
      blockingItems: [],
      warningItems: [],
      infoItems: [],
      fieldItems,
      targetStep: step,
      primaryAction: "continue-next",
      secondaryAction: "focus-current-step",
    });
  }

  private openDraftInvalidModal(_message: string): void {
    this.openAdvancedActionModal({
      kind: "draft-invalid",
      variant: "warning",
      eyebrow: "Revisión administrativa",
      title: "No se puede guardar el borrador",
      message:
        "Faltan datos mínimos para identificar al trabajador. Completa el primer pendiente y vuelve a guardar.",
      sections: [
        {
          title: "Pendiente principal",
          text: "Completar los datos mínimos de identificación del trabajador antes de guardar el borrador.",
          tone: "attention",
        },
        {
          title: "Por qué importa",
          text: "El borrador necesita una identificación mínima para quedar trazable en la bitácora laboral.",
          tone: "neutral",
        },
        {
          title: "Acción recomendada",
          text: "Ir al primer campo pendiente, completar la información mínima y volver a guardar.",
          tone: "info",
        },
      ],
      primaryLabel: "Ir al primer pendiente",
      secondaryLabel: "Cerrar",
      blockingItems: [],
      warningItems: [],
      infoItems: [],
      targetStep: 0,
      primaryAction: "focus-draft-minimum",
      secondaryAction: "dismiss",
    });
  }

  private openDraftSuccessModal(isNewDraft: boolean): void {
    this.openAdvancedActionModal({
      kind: "draft-success",
      variant: "success",
      eyebrow: "Registro actualizado",
      title: isNewDraft ? "Borrador guardado" : "Borrador actualizado",
      message:
        "La ficha quedó guardada. Puedes seguir completando la bitácora ahora o retomarla más tarde.",
      sections: this.buildBitacoraMsgboxSections({
        pendientePrincipal: isNewDraft
          ? "El borrador quedó registrado con los datos mínimos ingresados hasta ahora."
          : "Los cambios del borrador quedaron actualizados en la bitácora laboral.",
        porQueImporta:
          "El avance parcial queda trazable para retomar la creación avanzada sin perder lo ya registrado.",
        accionRecomendada:
          "Continuar completando los registros de la bitácora o volver al listado de empleados.",
        pendienteTone: "success",
      }),
      primaryLabel: "Aceptar",
      blockingItems: [],
      warningItems: [],
      infoItems: [],
      primaryAction: "dismiss",
    });
  }

  private openFinishInvalidModal(firstBadStep: number): void {
    const pending = this.pendingValidationItemsForFinalization();
    const blocking = pending.filter(
      (item) => item.blocking && item.severity === "error",
    );
    const fieldItems = this.validationModalFieldItems(blocking);

    this.openAdvancedActionModal({
      kind: "finish-invalid",
      variant: "error",
      eyebrow: "Revisión administrativa",
      title: "La ficha no está lista para finalizar",
      message:
        "Aún hay registros de la bitácora con datos obligatorios pendientes. Ciérralos antes de finalizar el alta.",
      sections: this.buildBitacoraMsgboxSections({
        pendientePrincipal:
          `Completar ${fieldItems.length || blocking.length} dato${(fieldItems.length || blocking.length) === 1 ? "" : "s"} obligatorio${(fieldItems.length || blocking.length) === 1 ? "" : "s"} en los registros pendientes de la bitácora laboral.`,
        porQueImporta:
          "Sin esos datos la ficha no puede quedar lista para remuneraciones ni cerrarse en la bitácora.",
        accionRecomendada:
          "Ir al primer registro con bloqueo, completar lo pendiente o guardar borrador y retomar después.",
      }),
      primaryLabel: "Ir al primer pendiente",
      secondaryLabel: "Cerrar",
      blockingItems: [],
      warningItems: [],
      infoItems: [],
      fieldItems,
      targetStep: firstBadStep,
      primaryAction: "focus-first-blocking",
      secondaryAction: "dismiss",
    });
  }

  private openFinishConfirmModal(): void {
    this.openAdvancedActionModal({
      kind: "finish-confirm",
      variant: "success",
      eyebrow: "Decisión requerida",
      title: "Finalizar alta del trabajador",
      message:
        "La bitácora laboral está lista para cerrar el alta. Revisa que la información sea correcta antes de confirmar.",
      sections: this.buildBitacoraMsgboxSections({
        pendientePrincipal:
          "Confirmar el cierre del alta con los registros de la bitácora en estado listo.",
        porQueImporta:
          "Al finalizar, la ficha queda habilitada para procesos administrativos y de remuneraciones.",
        accionRecomendada:
          "Finalizar el alta si los datos son correctos, o cancelar para revisar algún registro de la bitácora.",
        pendienteTone: "success",
      }),
      primaryLabel: "Finalizar alta",
      secondaryLabel: "Cancelar",
      blockingItems: [],
      warningItems: [],
      infoItems: [],
      primaryAction: "execute-finish",
      secondaryAction: "dismiss",
    });
  }

  private openHonorariosConfirmModal(): void {
    this.openAdvancedActionModal({
      kind: "honorarios-confirm",
      variant: "warning",
      eyebrow: "Decisión requerida",
      title: "Cambiar a boleta de honorarios",
      message:
        "El registro pasará a prestador de servicios. Los pasos laborales dependientes quedarán como no aplicables en la bitácora.",
      sections: this.buildBitacoraMsgboxSections({
        pendientePrincipal:
          "Confirmar el cambio a boleta de honorarios y ocultar datos de relación laboral dependiente.",
        detailItems: [
          "Jornada, gratificación, previsión, salud, APVI y asignaciones laborales: no aplicables.",
          "La ficha podrá guardarse como borrador; no se finaliza como trabajador dependiente.",
        ],
        porQueImporta:
          "La bitácora debe reflejar la modalidad correcta para no solicitar datos que no corresponden al prestador.",
        accionRecomendada:
          "Confirmar el cambio si la modalidad es correcta, o cancelar y mantener relación laboral dependiente.",
      }),
      primaryLabel: "Confirmar cambio",
      secondaryLabel: "Cancelar",
      blockingItems: [],
      warningItems: [],
      infoItems: [],
      primaryAction: "confirm-honorarios",
      secondaryAction: "cancel-honorarios",
    });
  }

  private openHonorariosFinishBlockedModal(): void {
    this.openAdvancedActionModal({
      kind: "honorarios-finish-blocked",
      variant: "warning",
      eyebrow: "Revisión administrativa",
      title: "Guardar borrador de honorarios",
      message:
        "La ficha está en modalidad honorarios. Puedes guardar borrador; la finalización como dependiente no está disponible.",
      sections: this.buildBitacoraMsgboxSections({
        pendientePrincipal:
          "Conservar el avance como borrador de prestador a honorarios.",
        detailItems: [
          "La persistencia final de honorarios aún no está habilitada.",
          "No se generará contrato laboral dependiente ni liquidación de sueldo.",
        ],
        porQueImporta:
          "La bitácora debe cerrarse solo con flujos habilitados; el alta dependiente queda pendiente de otra fase.",
        accionRecomendada:
          "Guardar como borrador y completar retención, datos tributarios y pago cuando el flujo esté disponible.",
      }),
      primaryLabel: "Guardar como borrador",
      secondaryLabel: "Cerrar",
      blockingItems: [],
      warningItems: [],
      infoItems: [],
      targetStep: 8,
      primaryAction: "save-honorarios-draft",
      secondaryAction: "dismiss",
    });
  }

  private configureTipoTrabajadorFlow(): void {
    const relacion = this.form.controls.contrato.controls.relacionLaboral;

    relacion.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.syncTipoTrabajadorConRelacionLaboral());
  }

  private syncTipoTrabajadorConRelacionLaboral(): void {
    const contrato = this.form.controls.contrato.controls;
    const base = tipoTrabajadorBaseParaRelacion(contrato.relacionLaboral.value);
    const option = buscarTipoTrabajadorBase(
      this.catalogos().tiposTrabajador,
      base,
    );

    if (!option) {
      contrato.idTipoTrabajador.setValue(null, { emitEvent: false });
      contrato.idTipoTrabajador.updateValueAndValidity({ emitEvent: false });
      return;
    }

    if (contrato.idTipoTrabajador.value !== option.value) {
      contrato.idTipoTrabajador.setValue(option.value, { emitEvent: false });
    }
    contrato.idTipoTrabajador.markAsPristine();
    contrato.idTipoTrabajador.updateValueAndValidity({ emitEvent: false });
  }

  selectedTipoTrabajadorLabel(): string {
    const selectedId =
      this.form.controls.contrato.controls.idTipoTrabajador.value;
    const option = this.catalogos().tiposTrabajador.find(
      (item) => item.value === selectedId,
    );

    return option?.label ?? "Tipo trabajador pendiente";
  }

  selectedTipoJornadaLabel(): string {
    const selectedId = this.form.controls.contrato.controls.idTipoJornada.value;
    const option = this.catalogos().tiposJornada.find(
      (item) => item.value === selectedId,
    );

    return option?.label ?? "Jornada pendiente";
  }

  private configurePerfilLaboralAutodetection(): void {
    const personal = this.form.controls.datosPersonales.controls;
    const contrato = this.form.controls.contrato.controls;
    const prevision = this.form.controls.previsionSalud.controls;

    const sources: AbstractControl[] = [
      personal.fechaNacimiento,
      contrato.fechaIngreso,
      contrato.relacionLaboral,
      prevision.tipoRegimenPrevisional,
    ];

    sources.forEach((control) => {
      control.valueChanges
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(() => this.applyPerfilLaboralAutodetection());
    });
  }

  private applyPerfilLaboralAutodetection(): void {
    if (
      this.form.controls.contrato.controls.relacionLaboral.value ===
      "HONORARIOS"
    ) {
      this.perfilLaboralAutoDetections.set([]);
      return;
    }

    const detections = this.detectPerfilLaboralConditions();
    this.perfilLaboralAutoDetections.set(detections);
    this.syncAutoDetectedPerfilControls(detections);
  }

  private detectPerfilLaboralConditions(): readonly PerfilLaboralAutoDetection[] {
    const detections = new Map<CondicionTrabajadorControlName, string>();
    const edadResumen = this.perfilLaboralEdadResumen();
    const regimenPrevisional =
      this.form.controls.previsionSalud.controls.tipoRegimenPrevisional.value;

    if (edadResumen.kind === "menor") {
      detections.set(
        "trabajadorAdolescenteProtegido",
        "Detectado por fecha de nacimiento y fecha de ingreso.",
      );
    }

    if (regimenPrevisional === "NINGUNA") {
      detections.set(
        "exentoCotizacionPension",
        "Detectado desde el régimen previsional informado como sin AFP/IPS.",
      );
    }

    return Array.from(detections.entries()).map(([controlName, reason]) => ({
      controlName,
      reason,
    }));
  }

  private syncAutoDetectedPerfilControls(
    detections: readonly PerfilLaboralAutoDetection[],
  ): void {
    const perfil = this.form.controls.perfilLaboral.controls;

    for (const detection of detections) {
      const control = perfil[detection.controlName];
      if (!control.value) {
        control.setValue(true, { emitEvent: false });
      }
    }

    if (detections.length > 0 && !perfil.vigenciaInicio.value) {
      const fechaIngreso =
        this.form.controls.contrato.controls.fechaIngreso.value;
      perfil.vigenciaInicio.setValue(
        fechaIngreso || new Date().toISOString().slice(0, 10),
        {
          emitEvent: false,
        },
      );
    }
  }

  private normalizeCatalogLabel(value: string): string {
    return value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();
  }

  private configureRelacionLaboralUx(): void {
    const control = this.form.controls.contrato.controls.relacionLaboral;
    this.previousRelacionLaboral = control.value;

    control.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => {
        if (this.suppressRelacionLaboralModal) {
          this.previousRelacionLaboral = value;
          return;
        }

        if (
          value === "HONORARIOS" &&
          this.previousRelacionLaboral !== "HONORARIOS"
        ) {
          this.openHonorariosConfirmModal();
          return;
        }

        this.previousRelacionLaboral = value;
      });
  }

  private confirmHonorariosMode(): void {
    this.previousRelacionLaboral = "HONORARIOS";
    this.applyHonorariosVisualState();
    this.moveHonorariosFlowToApplicableStep();
    this.syncCompletedTabsFromValidity();
  }

  private cancelHonorariosModeChange(): void {
    this.suppressRelacionLaboralModal = true;
    this.form.controls.contrato.controls.relacionLaboral.setValue(
      this.previousRelacionLaboral,
      {
        emitEvent: true,
      },
    );
    this.suppressRelacionLaboralModal = false;
    this.syncCompletedTabsFromValidity();
  }

  private applyHonorariosVisualState(): void {
    const contrato = this.form.controls.contrato.controls;
    const prevision = this.form.controls.previsionSalud.controls;

    this.syncTipoTrabajadorConRelacionLaboral();

    contrato.tipoContrato.setValue(null, { emitEvent: false });
    contrato.fechaContrato.setValue("", { emitEvent: false });
    contrato.fechaTermino.setValue("", { emitEvent: false });
    contrato.idTipoJornada.setValue(null, { emitEvent: false });
    contrato.horasSemanales.setValue(null, { emitEvent: false });
    contrato.diasSemanales.setValue(null, { emitEvent: false });
    contrato.distribucionJornada.setValue("", { emitEvent: false });
    contrato.tiempoColacionMinutos.setValue(null, { emitEvent: false });
    contrato.tipoGratificacion.setValue(null, { emitEvent: false });
    contrato.seguroCesantia.setValue(false, { emitEvent: false });
    contrato.sueldoVariable.setValue(false, { emitEvent: false });
    contrato.semanaCorridaActiva.setValue(false, { emitEvent: false });
    contrato.semanaCorridaDiasLaborables.setValue([], { emitEvent: false });
    contrato.zonaExtremaActiva.setValue(false, { emitEvent: false });
    contrato.zonaExtremaTerritorio.setValue("", { emitEvent: false });
    contrato.zonaExtremaPorcentaje.setValue(null, { emitEvent: false });
    contrato.cargas.setValue(0, { emitEvent: false });
    contrato.idTramoCarga.setValue(null, { emitEvent: false });

    prevision.tipoRegimenPrevisional.setValue(null, { emitEvent: false });
    prevision.tieneApv.setValue(false, { emitEvent: false });
  }

  private moveHonorariosFlowToApplicableStep(): void {
    if ([4, 5, 6].includes(this.pasoWizardActivo())) {
      this.pasoWizardActivo.set(7);
      this.markWizardStepVisited(7);
      this.scrollToCurrentStepStart({ focusFirstField: true });
    }
  }

  private buildBitacoraMsgboxSections(options: {
    pendientePrincipal: string;
    detailItems?: readonly string[];
    porQueImporta: string;
    accionRecomendada: string;
    pendienteTone?: MessageBoxSection["tone"];
  }): readonly MessageBoxSection[] {
    const items = options.detailItems?.filter((item) => item.trim());
    return [
      {
        title: "Pendiente principal",
        text: options.pendientePrincipal,
        items: items?.length ? [...items] : undefined,
        tone: options.pendienteTone ?? "attention",
      },
      {
        title: "Por qué importa",
        text: options.porQueImporta,
        tone: "neutral",
      },
      {
        title: "Acción recomendada",
        text: options.accionRecomendada,
        tone: "info",
      },
    ];
  }

  private validationModalLabels(
    items: readonly EvaluatedValidationRule[],
    max: number,
  ): readonly string[] {
    const seen = new Set<string>();
    const out: string[] = [];

    for (const item of items) {
      const text = this.validationModalLabel(item);
      if (seen.has(text)) {
        continue;
      }
      seen.add(text);
      out.push(text);
      if (out.length >= max) {
        break;
      }
    }

    const remaining = Math.max(0, items.length - out.length);
    if (remaining > 0) {
      out.push(
        `Además hay ${remaining} dato${remaining === 1 ? "" : "s"} pendiente${remaining === 1 ? "" : "s"} adicional${remaining === 1 ? "" : "es"}.`,
      );
    }

    return out;
  }

  private validationModalFieldItems(
    items: readonly EvaluatedValidationRule[],
  ): readonly AdvancedActionModalFieldItem[] {
    const seen = new Set<string>();
    const out: AdvancedActionModalFieldItem[] = [];

    for (const item of items) {
      if (seen.has(item.id)) {
        continue;
      }
      seen.add(item.id);
      out.push({
        id: item.id,
        sectionTitle: item.sectionTitle || this.wizardStepShortLabel(item.wizardStep),
        fieldLabel: item.label,
        detail: this.ensureSentence(item.detail || this.validationModalLabel(item)),
        actionLabel: item.actionLabel || "Completar campo",
        wizardStep: item.wizardStep,
        controlPath: item.sourcePath,
        severity: item.severity,
      });
    }

    return out;
  }

  private validationModalLabel(item: EvaluatedValidationRule): string {
    const negocio = MENSAJES_FINALIZAR_ALTA[item.id];
    if (negocio) {
      return negocio;
    }

    return this.ensureSentence(item.label);
  }

  private ensureSentence(text: string): string {
    const clean = text.trim();
    if (!clean) {
      return clean;
    }

    return /[.!?]$/.test(clean) ? clean : `${clean}.`;
  }

  private draftMinimumPendingLabels(): readonly string[] {
    const dp = this.form.controls.datosPersonales.controls;
    const pending: string[] = [];

    if (dp.rut.invalid) {
      pending.push(
        "Ingresa un RUT válido o un identificador extranjero válido.",
      );
    }
    if (!String(dp.nombres.value || "").trim()) {
      pending.push("Nombres del trabajador.");
    }
    if (!String(dp.apellidoPaterno.value || "").trim()) {
      pending.push("Apellido paterno.");
    }
    if (!String(dp.fechaNacimiento.value || "").trim()) {
      pending.push("Fecha de nacimiento.");
    }
    if (dp.idPais.value === null || dp.idPais.value < 1) {
      pending.push("País o nacionalidad.");
    }
    if (dp.sexo.value === null) {
      pending.push("Sexo registral.");
    }
    if (dp.estadoCivil.value === null) {
      pending.push("Estado civil.");
    }

    return pending.length > 0
      ? pending
      : ["Revisa los datos personales mínimos."];
  }

  private rule(
    id: string,
    stepId: ValidationStepId,
    label: string,
    severity: ValidationSeverity,
    blocking: boolean,
    sourcePath: string,
    category: string,
    isComplete: () => boolean,
    isApplicable: () => boolean = () => true,
    isVisible?: () => boolean,
  ): ValidationRule {
    return {
      id,
      stepId,
      label,
      severity,
      blocking,
      sourcePath,
      category,
      isApplicable,
      isComplete,
      isVisible,
    };
  }

  private validationSortWeight(item: EvaluatedValidationRule): number {
    if (item.complete) {
      return 30;
    }

    if (item.severity === "error" && item.blocking) {
      return 0;
    }

    if (item.severity === "warning") {
      return 10;
    }

    return 20;
  }

  fullNameVisible(): string {
    const { nombres, apellidoPaterno, apellidoMaterno } =
      this.form.controls.datosPersonales.controls;
    const fullName = [
      nombres.value,
      apellidoPaterno.value,
      apellidoMaterno.value,
    ]
      .map((value) => value.trim())
      .filter(Boolean)
      .join(" ");

    if (fullName) {
      return fullName;
    }

    return "Sin información";
  }

  rutVisible(): string {
    return (
      this.form.controls.datosPersonales.controls.rut.value.trim() || "Sin RUT"
    );
  }

  cargoVisible(): string {
    const cargo = this.form.controls.contrato.controls.cargo.value.trim();
    return cargo && !this.isTechnicalCargo(cargo) ? cargo : "Sin informacion";
  }

  sucursalVisible(): string {
    const selectedId = this.form.controls.contrato.controls.idSucursal.value;
    const sucursal = this.catalogos().sucursales.find(
      (option) => option.value === selectedId,
    );

    return sucursal?.label || "Sin información";
  }

  perfilLaboralResumenLabel(): string {
    const resumen = this.perfilLaboralEdadResumen();
    return `${resumen.label} · ${this.isHonorariosMode() ? "Independiente / honorarios" : "Dependiente / contrato"}`;
  }

  condicionesPerfilResumenLabel(): string {
    const selected = CONDICIONES_TRABAJADOR_UI.filter(
      (condition) =>
        this.form.controls.perfilLaboral.controls[condition.controlName].value,
    ).map((condition) => condition.label);

    if (selected.length === 0) {
      return "Sin condiciones especiales declaradas";
    }

    if (selected.length <= 3) {
      return selected.join(", ");
    }

    return `${selected.slice(0, 3).join(", ")} y ${selected.length - 3} más`;
  }

  private hasPerfilLaboralCondicionesSeleccionadas(): boolean {
    return CONDICIONES_TRABAJADOR_UI.some(
      (condition) =>
        this.form.controls.perfilLaboral.controls[condition.controlName].value,
    );
  }

  private perfilLaboralEdadResumen(): {
    label: string;
    kind: "pendiente" | "menor" | "adulto" | "mayor";
  } {
    const nacimiento = this.parseIsoDate(
      this.form.controls.datosPersonales.controls.fechaNacimiento.value,
    );
    const referencia =
      this.parseIsoDate(
        this.form.controls.contrato.controls.fechaIngreso.value,
      ) ?? new Date();

    if (!nacimiento || nacimiento > referencia) {
      return { label: "Edad laboral pendiente", kind: "pendiente" };
    }

    let edad = referencia.getFullYear() - nacimiento.getFullYear();
    const monthDelta = referencia.getMonth() - nacimiento.getMonth();
    const dayDelta = referencia.getDate() - nacimiento.getDate();

    if (monthDelta < 0 || (monthDelta === 0 && dayDelta < 0)) {
      edad -= 1;
    }

    if (edad < 18) {
      return { label: `Menor de 18 años (${edad})`, kind: "menor" };
    }

    if (edad > 65) {
      return { label: `Mayor de 65 años (${edad})`, kind: "mayor" };
    }

    return { label: `Adulto 18 a 65 años (${edad})`, kind: "adulto" };
  }

  private parseIsoDate(value: string): Date | null {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return null;
    }

    const [year, month, day] = value.split("-").map(Number);
    const parsed = new Date(year, month - 1, day);

    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  checklistStatusClass(kind: WizardStepUiKind): string {
    switch (kind) {
      case "completo":
        return "is-complete";
      case "errores":
        return "is-error";
      case "opcional":
        return "is-optional";
      case "no-aplica":
        return "is-na";
      default:
        return "is-pending";
    }
  }

  private reviewStepUiKind(stepIndex: number): WizardStepUiKind {
    const kind = this.wizardStepUiKind(stepIndex);
    if (kind !== "actual") {
      return kind;
    }

    const summary = this.getWizardStepValidationSummary(stepIndex);
    if (summary.blockingPending > 0 && this.attemptedSave()) {
      return "errores";
    }
    if (summary.blockingPending === 0 && summary.status === "complete") {
      return "completo";
    }
    return "pendiente";
  }

  private focusFirstPendingControl(
    wizardStep: number = this.pasoWizardActivo(),
  ): void {
    window.setTimeout(() => {
      const sorted = [...this.evaluateValidationRules()].sort(
        (a, b) => this.validationSortWeight(a) - this.validationSortWeight(b),
      );
      const firstPendingRule = sorted.find(
        (item) =>
          item.visible && item.wizardStep === wizardStep && !item.complete,
      );
      const control =
        this.findControlForRule(firstPendingRule) ??
        this.findFirstNgInvalidControl();

      if (!control) {
        return;
      }

      control.scrollIntoView({ behavior: "smooth", block: "center" });
      control.focus({ preventScroll: true });
    });
  }

  private focusFirstInvalidControl(
    wizardStep: number = this.pasoWizardActivo(),
  ): void {
    window.setTimeout(() => {
      const sorted = [...this.evaluateValidationRules()].sort(
        (a, b) => this.validationSortWeight(a) - this.validationSortWeight(b),
      );
      const firstPendingRule = sorted.find(
        (item) =>
          item.visible &&
          item.wizardStep === wizardStep &&
          item.blocking &&
          !item.complete,
      );
      const firstInvalidControl =
        this.findControlForRule(firstPendingRule) ??
        this.findFirstNgInvalidControl();

      if (!firstInvalidControl) {
        return;
      }

      firstInvalidControl.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
      firstInvalidControl.focus({ preventScroll: true });
    });
  }

  private findControlForRule(
    rule: EvaluatedValidationRule | undefined,
  ): HTMLElement | null {
    if (!rule) {
      return null;
    }

    return this.findControlForPath(rule.sourcePath);
  }

  private focusControlPath(controlPath: string): void {
    window.setTimeout(() => {
      const control = this.findControlForPath(controlPath);
      if (!control) {
        this.scrollToCurrentStepStart({ focusFirstField: true });
        return;
      }

      control.scrollIntoView({ behavior: "smooth", block: "center" });
      control.focus({ preventScroll: true });
    });
  }

  private findControlForPath(controlPath: string | undefined): HTMLElement | null {
    const controlName = controlPath?.split(".").at(-1);
    if (!controlName) {
      return null;
    }

    const controlHost =
      this.hostElement.nativeElement.querySelector<HTMLElement>(
        `.step-panel [formControlName="${controlName}"], .step-panel [formcontrolname="${controlName}"]`,
      );
    return this.getFocusableField(controlHost);
  }

  private findFirstNgInvalidControl(): HTMLElement | null {
    const invalidHost =
      this.hostElement.nativeElement.querySelector<HTMLElement>(
        '.step-panel input.ng-invalid:not([type="hidden"]), .step-panel select.ng-invalid, .step-panel textarea.ng-invalid, .step-panel [formControlName].ng-invalid, .step-panel [formcontrolname].ng-invalid',
      );

    return this.getFocusableField(invalidHost);
  }

  private getFocusableField(
    controlHost: HTMLElement | null,
  ): HTMLElement | null {
    if (!controlHost) {
      return null;
    }

    if (this.isFocusableFormField(controlHost)) {
      return controlHost;
    }

    return controlHost.querySelector<HTMLElement>(
      'input:not([type="hidden"]):not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), [tabindex]:not([tabindex="-1"])',
    );
  }

  private isFocusableFormField(element: HTMLElement): boolean {
    return (
      element.matches('input:not([type="hidden"]):not([disabled])') ||
      element.matches("select:not([disabled])") ||
      element.matches("textarea:not([disabled])") ||
      element.matches("button:not([disabled])") ||
      element.matches('[tabindex]:not([tabindex="-1"])')
    );
  }

  private scrollToPageStart(): void {
    window.setTimeout(() => {
      const formStart =
        this.hostElement.nativeElement.querySelector<HTMLElement>(
          ".form-page-head",
        ) ?? this.hostElement.nativeElement;

      formStart.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  private scrollToCurrentStepStart(options: {
    focusFirstField: boolean;
  }): void {
    const run = (): void => {
      const host = this.hostElement.nativeElement;
      const stepHeader = host.querySelector<HTMLElement>(
        ".advanced-step-header",
      );
      const stepPanel = host.querySelector<HTMLElement>(
        ".advanced-wizard-step .step-panel",
      );
      const target =
        stepHeader ??
        stepPanel ??
        host.querySelector<HTMLElement>(".advanced-wizard-content");

      if (!target) {
        return;
      }

      // Mantener el cambio de paso estable: sube al inicio útil del paso.
      target.scrollIntoView({ behavior: "auto", block: "start" });

      // En desktop, opcionalmente enfocar el primer campo habilitado para dejar el cursor listo.
      // En mobile/tablet evitamos enfocar para no abrir el teclado automáticamente.
      if (
        !options.focusFirstField ||
        window.matchMedia?.("(max-width: 1024px)").matches
      ) {
        return;
      }

      const firstField = stepPanel?.querySelector<HTMLElement>(
        'input:not([type="hidden"]):not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );

      firstField?.focus({ preventScroll: true });
    };

    requestAnimationFrame(() => requestAnimationFrame(run));
  }

  isTabInvalid(tabId: TabId): boolean {
    return this.getStepValidationSummary(tabId).blockingPending > 0;
  }

  private markControlAsTouched(control: AbstractControl): void {
    control.markAllAsTouched();
    control.updateValueAndValidity({ emitEvent: false });
  }

  private attemptAllTabs(): void {
    this.attemptedTabs.set(new Set(TAB_ORDER));
    this.attemptedWizardSteps.set(
      new Set(Array.from({ length: this.totalSteps }, (_, index) => index)),
    );
  }

  private syncCompletedTabsFromValidity(): void {
    this.completedTabs.update((tabs) => {
      const next = new Set(tabs);

      for (const tabId of TAB_ORDER) {
        if (this.isTabInvalid(tabId)) {
          next.delete(tabId);
        } else {
          next.add(tabId);
        }
      }

      return next;
    });
  }

  private markAllValidTabsAsCompleted(): void {
    this.completedTabs.set(
      new Set(TAB_ORDER.filter((tabId) => !this.isTabInvalid(tabId))),
    );
  }

  private markTabAsCompleted(tabId: TabId): void {
    this.completedTabs.update((tabs) => new Set([...tabs, tabId]));
  }

  private removeCompletedTab(tabId: TabId): void {
    this.completedTabs.update((tabs) => {
      const next = new Set(tabs);
      next.delete(tabId);
      return next;
    });
  }

  private resolveSaveErrorMessage(error: unknown): string {
    if (
      error instanceof EmpleadoRutDuplicadoError ||
      error instanceof EmpleadoReferenciaInvalidaError
    ) {
      return error.message;
    }

    if (error instanceof Error) {
      if (error.message.toLowerCase().includes("row-level security")) {
        return "Supabase bloqueo la escritura por politicas RLS. Ejecuta bd/base/v11/run_all.sql (esquema por partes) o el monolito crear_sql_v6_11_integrada.sql y vuelve a intentar.";
      }

      return error.message;
    }

    return "No fue posible registrar la ficha. Revisa la informacion e intenta nuevamente.";
  }

  private getSection(tabId: TabId) {
    switch (tabId) {
      case "datosPersonales":
        return this.form.controls.datosPersonales;
      case "contrato":
        return this.form.controls.contrato;
      case "previsionSalud":
        return this.form.controls.previsionSalud;
      case "bancario":
        return this.form.controls.bancario;
    }
  }

  private isFormSectionInvalid(tabId: TabId): boolean {
    return tabId === "datosPersonales"
      ? this.getPersonalSectionState().invalid
      : this.getSection(tabId).invalid;
  }

  private hasStepInteraction(tabId: TabId): boolean {
    if (
      this.completedTabs().has(tabId) ||
      this.attemptedTabs().has(tabId) ||
      this.attemptedSave()
    ) {
      return true;
    }

    if (tabId === "datosPersonales") {
      const personal = this.getPersonalSectionState();
      return personal.dirty || personal.touched;
    }

    const section = this.getSection(tabId);
    return section.dirty || section.touched;
  }

  private getPersonalSectionState() {
    const datosPersonales = this.form.controls.datosPersonales;
    const contacto = this.form.controls.contacto;

    return {
      invalid: datosPersonales.invalid || contacto.invalid,
      valid: datosPersonales.valid && contacto.valid,
      dirty: datosPersonales.dirty || contacto.dirty,
      touched: datosPersonales.touched || contacto.touched,
    };
  }

  private isTechnicalCargo(value: string): boolean {
    return (
      this.normalizeTechnicalText(value) ===
      this.normalizeTechnicalText("Sin cargo")
    );
  }

  private isDraftAccount(value: string): boolean {
    return value.trim().toUpperCase().startsWith("DRAFT-");
  }

  private normalizeTechnicalText(value: string): string {
    return value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim()
      .toLowerCase();
  }
}
