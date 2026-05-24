import { CommonModule } from "@angular/common";
import {
  Component,
  DestroyRef,
  ElementRef,
  OnInit,
  inject,
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
import { AltaBitacoraConsoleComponent } from "../creacion-avanzada/alta-bitacora-console/alta-bitacora-console.component";
import {
  mapEmpleadoFormToPayload,
  mapEmpleadoFormToPayloadBasico,
  mapEmpleadoFormToPayloadBorrador,
} from "../../mappers/empleado-form.mapper";
import { validateBorradorAvanzadoFormMinimo } from "../../utils/empleado-borrador-form.validation";
import { normalizarBorradorAvanzadoParaFormulario } from "../../utils/empleado-borrador-hidratacion";
import {
  etiquetasAsistenteAvanzadoEmpleado,
  cantidadPasosAsistenteAvanzadoEmpleado,
  idsBloquesPasoFormularioEmpleado,
  ordenPestanasFormularioEmpleado,
} from "../../models/empleado-form.manifest";
import { EmpleadoFormGroup } from "../../models/empleado-form.model";
import {
  CONDICIONES_TRABAJADOR_UI,
  CondicionTrabajadorControlName,
} from "../../models/empleado-perfil-laboral.model";
import type {
  ModalAccionAvanzada,
  AccionModalAccionAvanzada,
  ItemCampoModalAccionAvanzada,
  ReglaValidacionEvaluada,
  FormEmpleadoModo,
  ResumenValidacionGlobal,
  DeteccionAutomaticaPerfilLaboral,
  EstadoValidacionPaso,
  ResumenValidacionPaso,
  IdPestana,
  ReglaValidacion,
  SeveridadValidacion,
  IdPasoValidacion,
  VmConsolaBitacoraAlta,
  RevisionNormativaBitacoraAlta,
  GrupoMapaAsistente,
  TipoUiPasoAsistente,
} from "../../models/empleado-alta-avanzada.vm";
import { RelacionLaboral } from "../../models/empleado.model";
import { EmpleadoAltaAvanzadaPresentacionFacade } from "../../facade/empleado-alta-avanzada-presentacion.facade";
import {
  buscarTipoTrabajadorBase,
  tipoTrabajadorBaseParaRelacion,
} from "../../rules/empleado-tipo-trabajador-flow.rules";
import {
  calcularPorcentajeProgresoAsistenteAlta,
  esPrimerPasoAsistenteAlta,
  esUltimoPasoAsistenteAlta,
  estaPasoAsistenteAltaEnRango,
  resolverPasoSiguienteAsistenteAlta,
  resolverPasoAnteriorAsistenteAlta,
} from "../../rules/empleado-alta-wizard.rules";
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
  buildAltaResumenEstadoPanel,
  evaluarDiagnosticoFichaEmpleado,
  mapDiagnosticoItemsToEvaluatedRules,
  wizardStepDesdeFaltanteAlta,
  type EmpleadoFichaValidacionSnapshot,
} from '../../rules/empleado-alta-diagnostico.rules';
import {
  buildRevisionesNormativasConsola,
  evaluarAltaValidacionesDesdeDiagnostico,
} from '../../rules/empleado-alta-validacion-input';
import type { AltaValidacionVisible } from '../../rules/empleado-alta-validaciones.rules';
import type { FaltanteFichaEmpleado, FichaEstadoPanelVm } from '../../models/ficha-empleado.vm';
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
} from "../../../../shared/components/ui/message-box.component";
import { WorkspaceLoadingComponent } from "../../../../shared/components/ui/workspace-loading.component";
import { bindShellPageContext } from "../../../../layout/shell-page-context.binding";

const ordenPestanas: readonly IdPestana[] = [...ordenPestanasFormularioEmpleado];

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
    MessageBoxComponent,
    WorkspaceLoadingComponent,
    DatosPersonalesComponent,
    ContactoComponent,
    ContratoComponent,
    PerfilLaboralComponent,
    PrevisionSaludComponent,
    BancarioComponent,
    AltaBitacoraConsoleComponent,
  ],
  templateUrl: "./form-empleado.html",
  styleUrls: [
    "../../styles/empleado-expediente-tokens.css",
    "./form-empleado.css",
    "./form-empleado.wizard.css",
    "./form-empleado.feedback.css",
  ],
  providers: [EmpleadoAltaAvanzadaPresentacionFacade],
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
  private readonly presentacion = inject(EmpleadoAltaAvanzadaPresentacionFacade);
  private suppressRelacionLaboralModal = false;
  private previousRelacionLaboral: RelacionLaboral = "CONTRATO";

  readonly modo = this.presentacion.modo;
  /** Creacion avanzada: indice de etapa 0..9 (10 pasos). */
  readonly pasoWizardActivo = this.presentacion.pasoWizardActivo;
  readonly guardando = this.presentacion.guardando;
  readonly intentoGuardado = this.presentacion.intentoGuardado;
  readonly mensajeError = this.presentacion.mensajeError;
  /** RUT duplicado: modal estructurado (mismo layout que éxito básico, variante error). */
  readonly rutModalRutDuplicado = this.presentacion.rutModalRutDuplicado;

  etiquetaEstadoAvanzado(): string {
    return "Bitácora laboral";
  }
  readonly mensajeExito = this.presentacion.mensajeExito;
  /** Flujo que originó el último guardado exitoso (para el modal, sin depender solo de la ruta). */
  readonly flujoExito = this.presentacion.flujoExito;
  readonly idEmpleadoCreado = this.presentacion.idEmpleadoCreado;
  /** Creación avanzada: id persona al actualizar borrador o null si es alta nueva. */
  readonly borradorPersonaId = this.presentacion.borradorPersonaId;
  readonly guardandoBorrador = this.presentacion.guardandoBorrador;
  readonly retroalimentacionBorrador = this.presentacion.retroalimentacionBorrador;
  readonly modalAccionAvanzada = this.presentacion.modalAccionAvanzada;
  readonly catalogos = this.presentacion.catalogos;
  readonly deteccionesAutomaticasPerfilLaboral = this.presentacion.deteccionesAutomaticasPerfilLaboral;
  readonly decisionCoherenciaPendiente = this.presentacion.decisionCoherenciaPendiente;
  readonly idsInconsistenciasCoherenciaReconocidas = this.presentacion.idsInconsistenciasCoherenciaReconocidas;
  readonly consolaExpandRequest = this.presentacion.consolaExpandRequest;
  readonly cargandoCatalogos = this.presentacion.cargandoCatalogos;
  readonly catalogosError = this.presentacion.catalogosError;
  readonly pestanasCompletadas = this.presentacion.pestanasCompletadas;
  readonly pestanasIntentadas = this.presentacion.pestanasIntentadas;
  readonly pasosAsistenteVisitados = this.presentacion.pasosAsistenteVisitados;
  readonly pasosAsistenteIntentados = this.presentacion.pasosAsistenteIntentados;
  readonly form: EmpleadoFormGroup = this.empleadosFormService.createForm();
  readonly totalPasos = cantidadPasosAsistenteAvanzadoEmpleado;
  readonly etiquetasAsistenteAvanzado = [...etiquetasAsistenteAvanzadoEmpleado];
  readonly etiquetasCortasAsistenteAvanzado: readonly string[] = [
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

  readonly descripcionesPasosAsistenteAvanzado: readonly string[] = [
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

  readonly gruposMapaAsistente: readonly GrupoMapaAsistente[] = [
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
  readonly idsBloquesPaso = idsBloquesPasoFormularioEmpleado;

  constructor() {
    bindShellPageContext(
      this.destroyRef,
      () => ({
        breadcrumbs: [
          { label: "Empleados", path: "/empleados" },
          { label: this.tituloPagina() },
        ],
        statusChip: this.esModoBasico()
          ? { label: "Ficha en proceso", tone: "neutral" }
          : undefined,
        primaryAction: {
          label: this.etiquetaAccionPrimariaShell(),
          disabled: this.accionPrimariaShellDeshabilitada(),
          loading: this.cargandoAccionPrimariaShell(),
          actionId: this.esModoBasico()
            ? "empleado-alta-basica-guardar-borrador"
            : "empleado-alta-avanzada-guardar",
        },
      }),
      {
        onPrimaryAction: () => this.ejecutarShellPrimaryAction(),
      },
    );
  }

  async ngOnInit(): Promise<void> {
    const modo = this.resolverModo();
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
    this.configurarUxRelacionLaboral();
    this.configurarFlujoTipoTrabajador();
    this.configurarAutodeteccionPerfilLaboral();
    await this.loadCatalogos();
    if (this.modo() === "avanzado") {
      const rawId = this.route.snapshot.queryParamMap.get("idPersona");
      const idPersona = rawId ? Number(rawId) : NaN;
      const debeHidratarBorrador =
        Number.isInteger(idPersona) && idPersona >= 1;
      if (debeHidratarBorrador) {
        this.cargandoCatalogos.set(true);
      }
      try {
        await this.cargarContinuacionBorradorSiAplica();
        this.syncTipoTrabajadorConRelacionLaboral();
        this.aplicarAutodeteccionPerfilLaboral();
      } finally {
        if (debeHidratarBorrador) {
          this.cargandoCatalogos.set(false);
        }
      }
    }
  }

  async onGuardarBorrador(): Promise<void> {
    if (!this.esModoAvanzado() || this.guardandoBorrador() || this.guardando()) {
      return;
    }

    this.modalAccionAvanzada.set(null);

    if (this.cargandoCatalogos()) {
      this.retroalimentacionBorrador.set(null);
      this.abrirModalAccionAvanzada({
        kind: "draft-invalid",
        variant: "warning",
        eyebrow: "Revisión administrativa",
        title: "Espera a que cargue el formulario",
        message:
          "La información base aún se está preparando. Intenta guardar el borrador en unos segundos.",
        sections: this.construirSeccionesMsgboxBitacora({
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
      this.retroalimentacionBorrador.set(null);
      this.openDraftInvalidModal(err);
      return;
    }

    this.mensajeError.set(null);
    this.rutModalRutDuplicado.set(null);
    this.mensajeExito.set(null);
    this.retroalimentacionBorrador.set(null);
    this.guardandoBorrador.set(true);
    const prevId = this.borradorPersonaId();

    try {
      const payload = mapEmpleadoFormToPayloadBorrador(
        this.form,
        this.catalogos(),
      );
      const pasoBorrador = this.resolverPasoBorradorParaPersistir();
      const resumen = await this.empleadosService.guardarBorradorAvanzado(
        prevId,
        payload,
        pasoBorrador,
      );
      this.borradorPersonaId.set(resumen.id);
      this.retroalimentacionBorrador.set(
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
        this.rutModalRutDuplicado.set(error.rut);
      } else {
        this.mensajeError.set(
          error instanceof Error
            ? error.message
            : "No fue posible guardar el borrador.",
        );
      }
    } finally {
      this.guardandoBorrador.set(false);
    }
  }

  seleccionarPasoAsistente(index: number): void {
    if (!estaPasoAsistenteAltaEnRango(index, cantidadPasosAsistenteAvanzadoEmpleado)) {
      return;
    }

    this.sincronizarPestanasCompletadasDesdeValidez();
    this.presentacion.seleccionarPasoAsistente(index);
    this.desplazarAInicioPasoActual({ focusFirstField: true });
  }

  etiquetaCortaPasoAsistente(stepIndex: number): string {
    if (this.esModoHonorarios()) {
      const honorariosLabels: Record<number, string> = {
        2: "Servicio",
        3: "Honorarios",
        7: "Datos para pago",
        8: "Condiciones",
        9: "Resumen honorarios",
      };
      if ([4, 5, 6, this.perfilLaboralWizardStepIndex()].includes(stepIndex)) {
        return this.etiquetasCortasAsistenteAvanzado[stepIndex] ?? "";
      }
      return (
        honorariosLabels[stepIndex] ??
        this.etiquetasCortasAsistenteAvanzado[stepIndex] ??
        ""
      );
    }

    return (
      this.etiquetasCortasAsistenteAvanzado[stepIndex] ??
      this.etiquetasAsistenteAvanzado[stepIndex] ??
      ""
    );
  }

  etiquetaCompletaPasoAsistente(stepIndex: number): string {
    if (this.esModoHonorarios()) {
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
        this.etiquetasAsistenteAvanzado[stepIndex] ??
        ""
      );
    }

    return this.etiquetasAsistenteAvanzado[stepIndex] ?? "";
  }

  descripcionPasoAsistente(stepIndex: number): string {
    if (this.esModoHonorarios()) {
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
        this.descripcionesPasosAsistenteAvanzado[stepIndex] ??
        ""
      );
    }

    return this.descripcionesPasosAsistenteAvanzado[stepIndex] ?? "";
  }

  porcentajeProgresoAsistente(): number {
    return calcularPorcentajeProgresoAsistenteAlta(this.pasoWizardActivo(), this.totalPasos);
  }

  async loadCatalogos(): Promise<void> {
    this.catalogosError.set(null);
    this.cargandoCatalogos.set(true);

    try {
      const catalogos =
        await this.empleadosCatalogosService.obtenerFormulario();
      this.catalogos.set(catalogos);
      this.empleadosFormService.applyCatalogDefaults(this.form, catalogos);
      this.syncTipoTrabajadorConRelacionLaboral();
      this.aplicarAutodeteccionPerfilLaboral();
    } catch {
      this.catalogosError.set(
        "No fue posible preparar la informacion requerida para el formulario. Intenta nuevamente.",
      );
    } finally {
      this.cargandoCatalogos.set(false);
    }
  }

  manejarEnvioFormulario(event: SubmitEvent): void {
    event.preventDefault();
    event.stopPropagation();
    if (
      this.esModoAvanzado() &&
      this.pasoWizardActivo() !== this.indicePasoResumenAsistente()
    ) {
      return;
    }
    void this.enviarFormulario();
  }

  esPasoAsistenteActivo(index: number): boolean {
    return this.pasoWizardActivo() === index;
  }

  /** Secuencia de indices al usar Siguiente / Anterior (omite APVI si no aplica). */
  secuenciaLinealAsistente(): readonly number[] {
    if (this.esModoHonorarios()) {
      return [0, 1, 2, 3, 7, this.indicePasoResumenAsistente()] as const;
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
        this.indicePasoResumenAsistente(),
      ];
    }
    return [
      ...base,
      7,
      this.perfilLaboralWizardStepIndex(),
      this.indicePasoResumenAsistente(),
    ];
  }

  async enviarFormulario(): Promise<void> {
    if (this.guardando()) {
      return;
    }

    this.modalAccionAvanzada.set(null);
    this.intentoGuardado.set(true);
    if (this.esModoBasico()) {
      this.intentarGruposBasicos();
    } else {
      this.intentarTodasPestanas();
    }
    this.mensajeError.set(null);
    this.rutModalRutDuplicado.set(null);
    this.mensajeExito.set(null);
    this.flujoExito.set(null);
    this.idEmpleadoCreado.set(null);
    this.marcarControlesEnvioComoTocados();

    if (this.cargandoCatalogos()) {
      if (this.esModoBasico()) {
        this.abrirModalEsperaCatalogosBasico();
      } else {
        this.mensajeError.set(
          "La informacion base del formulario aun se esta cargando. Espera unos segundos e intenta nuevamente.",
        );
      }
      return;
    }

    if (this.esModoBasico()) {
      if (this.esFormularioBasicoInvalido()) {
        this.enfocarPrimerControlInvalido();
        return;
      }

      await this.enviarModoBasico();
      return;
    }

    if (this.esModoHonorarios()) {
      this.sincronizarPestanasCompletadasDesdeValidez();
      this.openHonorariosFinishBlockedModal();
      return;
    }

    const firstBadStep = this.buscarPrimerPasoAsistenteConBloqueos();

    if (firstBadStep !== null || this.form.invalid) {
      this.sincronizarPestanasCompletadasDesdeValidez();
      this.openFinishInvalidModal(firstBadStep ?? 0);
      return;
    }

    const coherenceIssue = this.primeraDecisionCoherenciaSinReconocer();
    if (coherenceIssue) {
      this.sincronizarPestanasCompletadasDesdeValidez();
      this.openCoherenceDecisionModal(coherenceIssue, "finish");
      return;
    }

    this.marcarTodasPestanasValidasComoCompletadas();
    this.openFinishConfirmModal();
  }

  private async submitAdvancedMode(): Promise<void> {
    if (this.guardando()) {
      return;
    }

    this.marcarTodasPestanasValidasComoCompletadas();
    this.guardando.set(true);
    this.mensajeError.set(null);
    this.rutModalRutDuplicado.set(null);
    this.mensajeExito.set(null);
    this.flujoExito.set(null);
    this.idEmpleadoCreado.set(null);

    try {
      const borradorId = this.borradorPersonaId();
      if (borradorId !== null) {
        await this.empleadosService.finalizarAltaAvanzadaExistente(
          borradorId,
          mapEmpleadoFormToPayload(this.form, this.catalogos()),
        );
        this.mensajeExito.set(
          "La ficha avanzada fue guardada correctamente y el empleado quedó listo para operar.",
        );
        this.flujoExito.set("avanzado");
        this.idEmpleadoCreado.set(borradorId);
        this.borradorPersonaId.set(null);
        this.form.markAsPristine();
        void this.router.navigate(["/empleados/nuevo"], { replaceUrl: true });
      } else {
        const created = await this.empleadosService.crear(
          mapEmpleadoFormToPayload(this.form, this.catalogos()),
        );

        this.mensajeExito.set(
          "La ficha avanzada fue guardada correctamente y el empleado quedó listo para operar.",
        );
        this.flujoExito.set("avanzado");
        this.idEmpleadoCreado.set(created.id);
        this.form.markAsPristine();
      }
    } catch (error) {
      if (error instanceof EmpleadoRutDuplicadoError) {
        this.rutModalRutDuplicado.set(error.rut);
      } else {
        this.mensajeError.set(this.resolverMensajeErrorGuardado(error));
      }
    } finally {
      this.guardando.set(false);
    }
  }

  cerrarMensajeError(): void {
    this.mensajeError.set(null);
    this.rutModalRutDuplicado.set(null);
  }

  tituloModalError(): string {
    return this.esModoBasico()
      ? "No fue posible registrar la ficha"
      : "No fue posible registrar el empleado";
  }

  mensajeModalError(): string {
    return this.esModoBasico()
      ? "El registro no se completó. Revisa el detalle y vuelve a intentarlo."
      : "La ficha avanzada no se guardó porque hay una condición que debe revisarse antes de finalizar.";
  }

  mensajeErrorNormalizado(message: string): string {
    return message
      .replace(/Sin prevision/g, "Sin previsión")
      .replace(/sin prevision/g, "sin previsión")
      .replace(/opcion/g, "opción")
      .replace(/calculo/g, "cálculo")
      .replace(/nomina/g, "nómina")
      .replace(/informacion/g, "información");
  }

  accionRecomendadaError(message: string): string {
    const normalizedMessage =
      this.mensajeErrorNormalizado(message).toLowerCase();

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

  pasoSugeridoError(message: string): string | null {
    const normalizedMessage =
      this.mensajeErrorNormalizado(message).toLowerCase();

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

    return this.esModoAvanzado() ? "Acta de revisión" : null;
  }

  irAListadoEmpleados(): void {
    this.mensajeExito.set(null);
    this.flujoExito.set(null);
    this.idEmpleadoCreado.set(null);
    void this.router.navigate(["/empleados"]);
  }

  manejarAccionExito(): void {
    this.irAListadoEmpleados();
  }

  manejarPrimariaModalAccionAvanzada(): void {
    this.manejarAccionModalAccionAvanzada(
      this.modalAccionAvanzada()?.primaryAction ?? "dismiss",
    );
  }

  manejarSecundariaModalAccionAvanzada(): void {
    this.manejarAccionModalAccionAvanzada(
      this.modalAccionAvanzada()?.secondaryAction ?? "dismiss",
    );
  }

  manejarItemCampoModalAvanzada(item: ItemCampoModalAccionAvanzada): void {
    this.modalAccionAvanzada.set(null);
    this.marcarPasoAsistenteTocado(item.wizardStep);
    this.seleccionarPasoAsistente(item.wizardStep);
    this.enfocarRutaControl(item.controlPath);
  }

  cerrarModalAccionAvanzada(): void {
    this.decisionCoherenciaPendiente.set(null);
    this.modalAccionAvanzada.set(null);
  }

  private manejarAccionModalAccionAvanzada(
    action: AccionModalAccionAvanzada,
  ): void {
    const modal = this.modalAccionAvanzada();

    switch (action) {
      case "apply-coherence-suggestion":
        this.applyPendingCoherenceSuggestion();
        break;
      case "keep-coherence-review":
        this.keepPendingCoherenceReview();
        break;
      case "continue-next":
        this.modalAccionAvanzada.set(null);
        this.avanzarPasoSiguienteAsistente();
        break;
      case "focus-current-step":
        this.modalAccionAvanzada.set(null);
        this.marcarPasoAsistenteTocado(this.pasoWizardActivo());
        this.enfocarPrimerControlPendiente(this.pasoWizardActivo());
        break;
      case "focus-draft-minimum":
        this.modalAccionAvanzada.set(null);
        this.mostrarPasoAsistenteInvalido(0);
        break;
      case "focus-first-blocking":
        this.modalAccionAvanzada.set(null);
        this.mostrarPasoAsistenteInvalido(
          modal?.targetStep ??
            this.buscarPrimerPasoAsistenteConBloqueos() ??
            0,
        );
        break;
      case "execute-finish":
        this.modalAccionAvanzada.set(null);
        void this.submitAdvancedMode();
        break;
      case "confirm-honorarios":
        this.modalAccionAvanzada.set(null);
        this.confirmarModoHonorarios();
        break;
      case "cancel-honorarios":
        this.modalAccionAvanzada.set(null);
        this.cancelarCambioModoHonorarios();
        break;
      case "save-honorarios-draft":
        this.modalAccionAvanzada.set(null);
        void this.onGuardarBorrador();
        break;
      case "go-to-list":
        this.modalAccionAvanzada.set(null);
        this.irAListadoEmpleados();
        break;
      case "dismiss":
      default:
        this.modalAccionAvanzada.set(null);
        break;
    }
  }

  esModoBasico(): boolean {
    return this.modo() === "basico";
  }

  esModoAvanzado(): boolean {
    return this.modo() === "avanzado";
  }

  esModoHonorarios(): boolean {
    return (
      this.form.controls.contrato.controls.relacionLaboral.value ===
      "HONORARIOS"
    );
  }

  tituloPagina(): string {
    return "Crear empleado";
  }

  etiquetaAccionGuardar(): string {
    return this.esModoBasico()
      ? "Guardar ficha básica"
      : "Crear empleado activo";
  }

  etiquetaAccionPrimariaShellBasico(): string {
    return "Guardar borrador";
  }

  etiquetaAccionFinalAsistente(): string {
    if (this.guardando()) {
      return this.esModoHonorarios()
        ? "Guardando borrador..."
        : "Guardando ficha...";
    }

    return this.esModoHonorarios() ? "Guardar borrador" : "Finalizar alta";
  }

  etiquetaAccionPrimariaShell(): string {
    if (this.esModoBasico()) {
      return this.etiquetaAccionPrimariaShellBasico();
    }
    if (this.pasoWizardActivo() === this.indicePasoResumenAsistente()) {
      return this.etiquetaAccionFinalAsistente();
    }
    return this.guardandoBorrador() ? "Guardando borrador..." : "Guardar borrador";
  }

  cargandoAccionPrimariaShell(): boolean {
    return this.guardando() || this.guardandoBorrador();
  }

  accionPrimariaShellDeshabilitada(): boolean {
    return this.cargandoCatalogos() || this.guardando() || this.guardandoBorrador();
  }

  ejecutarShellPrimaryAction(): void {
    if (this.accionPrimariaShellDeshabilitada()) {
      return;
    }
    if (this.esModoBasico()) {
      void this.enviarFormulario();
      return;
    }
    if (this.pasoWizardActivo() === this.indicePasoResumenAsistente() && !this.esModoHonorarios()) {
      void this.enviarFormulario();
      return;
    }
    void this.onGuardarBorrador();
  }

  /** Modal de exito: titulo (solo copia distinta en creacion basica). */
  tituloModalExito(): string {
    return this.flujoExito() === "basico"
      ? "Empleado registrado correctamente"
      : "Empleado registrado correctamente";
  }

  /** Modal de exito: texto del boton principal. */
  etiquetaPrimariaModalExito(): string {
    return "Ir al listado";
  }

  irAPestanaAnterior(): void {
    const seq = this.secuenciaLinealAsistente();
    const previous = resolverPasoAnteriorAsistenteAlta(seq, this.pasoWizardActivo());
    if (previous !== null) {
      this.sincronizarPestanasCompletadasDesdeValidez();
      this.presentacion.seleccionarPasoAsistente(previous);
      this.desplazarAInicioPasoActual({ focusFirstField: true });
    }
  }

  irAPestanaSiguiente(): void {
    if (!this.esModoAvanzado()) {
      this.avanzarPasoSiguienteAsistente();
      return;
    }

    const currentStep = this.pasoWizardActivo();
    this.marcarPasoAsistenteIntentado(currentStep);
    this.marcarPasoAsistenteTocado(currentStep);
    this.sincronizarPestanasCompletadasDesdeValidez();

    const coherenceIssue = this.primeraDecisionCoherenciaPorPaso(currentStep);
    if (coherenceIssue) {
      this.openCoherenceDecisionModal(coherenceIssue, "next");
      return;
    }

    const pending = [
      ...this.pendingValidationItemsForWizardStep(currentStep),
      ...this.aplicabilidadReviewsAsValidationRules(currentStep),
    ];
    if (pending.length > 0) {
      this.openNextStepReviewModal(currentStep, pending);
      return;
    }

    this.avanzarPasoSiguienteAsistente();
  }

  private avanzarPasoSiguienteAsistente(): void {
    const seq = this.secuenciaLinealAsistente();
    const next = resolverPasoSiguienteAsistenteAlta(seq, this.pasoWizardActivo());
    if (next !== null) {
      this.sincronizarPestanasCompletadasDesdeValidez();
      this.presentacion.seleccionarPasoAsistente(next);
      this.desplazarAInicioPasoActual({ focusFirstField: true });
    }
  }

  esPrimeraPestana(): boolean {
    return esPrimerPasoAsistenteAlta(this.secuenciaLinealAsistente(), this.pasoWizardActivo());
  }

  esUltimaPestana(): boolean {
    return esUltimoPasoAsistenteAlta(this.secuenciaLinealAsistente(), this.pasoWizardActivo());
  }

  siguienteDeshabilitado(): boolean {
    return false;
  }

  numeroPasoActivo(): number {
    return this.pasoWizardActivo() + 1;
  }

  indicePasoResumenAsistente(): number {
    return this.totalPasos - 1;
  }

  altaResumenEstadoPanel(): FichaEstadoPanelVm {
    const snapshot = this.buildFichaValidacionSnapshot();
    const diagnostico = evaluarDiagnosticoFichaEmpleado(snapshot);
    const estado = this.form.controls.contrato.controls.estado.value ?? 'en_proceso';
    return buildAltaResumenEstadoPanel({
      diagnostico,
      pasoAltaAvanzada: this.esModoAvanzado() ? this.pasoWizardActivo() : null,
      estadoFicha: 'INCOMPLETO',
      estadoLaboral: estado,
      aptoParaRemuneracionesRegistro: false,
    });
  }

  altaResumenFaltantes(): FaltanteFichaEmpleado[] {
    return this.altaResumenEstadoPanel().faltantes;
  }

  irAlFaltanteResumenAlta(issue: FaltanteFichaEmpleado): void {
    const diagnostico = evaluarDiagnosticoFichaEmpleado(this.buildFichaValidacionSnapshot());
    this.seleccionarPasoAsistente(wizardStepDesdeFaltanteAlta(issue, diagnostico.items));
  }

  altaBitacoraConsoleVm(): VmConsolaBitacoraAlta {
    const panel = this.altaResumenEstadoPanel();
    const faltantes = panel.faltantes;
    const revisionesNormativas = buildRevisionesNormativasConsola(
      this.altaValidacionesVisiblesMotor(),
      this.inconsistenciasCoherencia(),
      this.idsInconsistenciasCoherenciaReconocidas(),
    );
    const registrosPendientes = this.filasRevisionAvanzada()
      .filter((row) => row.kind === 'pendiente' || row.kind === 'errores')
      .map((row) => ({
        stepIndex: row.stepIndex,
        label: row.label,
        kind: row.kind,
        stateLabel: this.etiquetaUiPasoAsistente(row.kind),
      }));
    const pendientesCierre = this.resumenPendientesNegocio();
    const totalVisible =
      faltantes.length +
      revisionesNormativas.length +
      registrosPendientes.length +
      pendientesCierre.length;
    const onSummary = this.pasoWizardActivo() === this.indicePasoResumenAsistente();

    return {
      visible: this.esModoAvanzado() && totalVisible > 0,
      expandedByDefault: onSummary && totalVisible > 0,
      collapsedLabel:
        totalVisible === 1 ? '1 pendiente · Bitácora' : `${totalVisible} pendientes · Bitácora`,
      motivoPrincipal: panel.motivoPrincipal,
      faltantes,
      revisionesNormativas,
      registrosPendientes,
      pendientesCierre,
      totalVisible,
    };
  }

  abrirGuiaNormativa(): void {
    this.consolaExpandRequest.update((n) => n + 1);
  }

  franjaGuiaNormativaPasoActivo(): { mensaje: string } | null {
    if (!this.esModoAvanzado()) {
      return null;
    }
    const paso = this.pasoWizardActivo();
    const pasosConFranja = new Set([2, 3, 4, 5, 6, 8]);
    if (!pasosConFranja.has(paso)) {
      return null;
    }
    const revisiones = buildRevisionesNormativasConsola(
      this.altaValidacionesVisiblesMotor(),
      this.inconsistenciasCoherencia(),
      this.idsInconsistenciasCoherenciaReconocidas(),
    ).filter((r) => r.stepIndex === paso && !r.bajoRevision);
    if (revisiones.length > 0) {
      const primera = revisiones[0];
      return {
        mensaje:
          revisiones.length === 1
            ? primera.detalle
            : `${revisiones.length} revisiones normativas en este registro. ${primera.titulo}.`,
      };
    }
    return null;
  }

  onAplicarRevisionNormativa(rev: RevisionNormativaBitacoraAlta): void {
    if (rev.origen !== 'coherencia' || !rev.coherenciaIssueId) {
      this.seleccionarPasoAsistente(rev.stepIndex);
      return;
    }
    const issue = this.inconsistenciasCoherencia().find(
      (i) => i.id === rev.coherenciaIssueId,
    );
    if (!issue?.action) {
      this.seleccionarPasoAsistente(rev.stepIndex);
      return;
    }
    this.applyCoherenceAction(issue.action, issue.actionValue);
    this.idsInconsistenciasCoherenciaReconocidas.update((prev) => {
      const next = new Set(prev);
      next.delete(issue.id);
      return next;
    });
    this.sincronizarPestanasCompletadasDesdeValidez();
    this.seleccionarPasoAsistente(issue.stepIndex);
  }

  onMantenerRevisionNormativa(rev: RevisionNormativaBitacoraAlta): void {
    if (rev.coherenciaIssueId) {
      this.idsInconsistenciasCoherenciaReconocidas.update(
        (prev) => new Set([...prev, rev.coherenciaIssueId!]),
      );
      this.sincronizarPestanasCompletadasDesdeValidez();
    }
  }

  private altaValidacionesVisiblesMotor(): readonly AltaValidacionVisible[] {
    const snapshot = this.buildFichaValidacionSnapshot();
    const diagnostico = evaluarDiagnosticoFichaEmpleado(snapshot);
    const aplicabilidad = this.altaAplicabilidadState();
    return evaluarAltaValidacionesDesdeDiagnostico({
      diagnostico,
      aplicabilidadItems: Object.values(aplicabilidad.campos),
      inconsistenciasCoherencia: this.inconsistenciasCoherencia(),
    });
  }

  perfilLaboralWizardStepIndex(): number {
    return this.totalPasos - 2;
  }

  cantidadPasosCompletados(): number {
    let n = 0;
    for (let i = 0; i < cantidadPasosAsistenteAvanzadoEmpleado; i++) {
      if (this.obtenerResumenValidacionPasoAsistente(i).status === "complete") {
        n++;
      }
    }
    return n;
  }

  cantidadValidacionesPendientes(): number {
    return this.itemsValidacionPendientesPanel().length;
  }

  itemsPanelValidacion(): ReglaValidacionEvaluada[] {
    return this.evaluateValidationRules().filter(
      (item) => item.visible && item.wizardStep === this.pasoWizardActivo(),
    );
  }

  itemsValidacionPendientesPanel(): ReglaValidacionEvaluada[] {
    return this.itemsPanelValidacion().filter((item) => !item.complete);
  }

  itemsValidacionBloqueantesPanel(): ReglaValidacionEvaluada[] {
    return this.itemsValidacionPendientesPanel().filter(
      (item) => item.severity === "error",
    );
  }

  itemsAdvertenciaValidacionPanel(): ReglaValidacionEvaluada[] {
    return this.itemsValidacionPendientesPanel().filter(
      (item) => item.severity === "warning",
    );
  }

  obtenerResumenValidacionPaso(stepId: IdPasoValidacion): ResumenValidacionPaso {
    if (!this.esModoAvanzado()) {
      const evaluated = this.evaluateValidationRules().filter(
        (item) => item.stepId === stepId && item.visible,
      );
      const pending = evaluated.filter((item) => !item.complete);
      const blockingPending = pending.filter((item) => item.blocking).length;
      const warningsPending = pending.filter(
        (item) => item.severity === "warning",
      ).length;
      const wasAttempted =
        this.pestanasIntentadas().has(stepId) || this.intentoGuardado();
      const hasInteraction = this.tieneInteraccionPaso(stepId);

      let status: EstadoValidacionPaso = "pending";

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

    const indices = this.pasosAsistenteParaPestana(stepId);
    const parts = indices.map((i) => this.calcularNucleoValidacionPasoAsistente(i));
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
      this.intentoGuardado() ||
      indices.some((i) => this.pasosAsistenteIntentados().has(i));
    const hasInteraction = indices.some((i) =>
      this.tieneInteraccionPasoAsistente(i),
    );

    let status: EstadoValidacionPaso = "pending";

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

  obtenerResumenValidacionPasoAsistente(
    wizardStepIndex: number,
  ): ResumenValidacionPaso {
    if (wizardStepIndex === this.indicePasoResumenAsistente()) {
      const blockingUpstream =
        Array.from({ length: this.indicePasoResumenAsistente() }, (_, i) => i).some(
          (i) => this.calcularNucleoValidacionPasoAsistente(i).blockingPending > 0,
        ) || this.form.invalid;
      const wasAttempted = this.intentoGuardado();
      let status: EstadoValidacionPaso = "pending";

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

    return this.calcularNucleoValidacionPasoAsistente(wizardStepIndex);
  }

  tipoUiPasoAsistente(stepIndex: number): TipoUiPasoAsistente {
    const isActive = this.esPasoAsistenteActivo(stepIndex);
    const stepWasAttempted = this.pasoAsistenteFueIntentado(stepIndex);

    if (stepIndex === this.indicePasoResumenAsistente()) {
      const summary = this.obtenerResumenValidacionPasoAsistente(stepIndex);
      if (summary.blockingPending > 0 && this.intentoGuardado()) {
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

    const summary = this.obtenerResumenValidacionPasoAsistente(stepIndex);
    /** Respeta la secuencia lineal (p. ej. paso 7 no “pasó” el 6 si APVI está fuera del flujo). */
    const stepRelevantForUi = this.pasoAsistenteMostradoComoAvanzado(stepIndex);

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

  etiquetaUiPasoAsistente(kind: TipoUiPasoAsistente): string {
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

  etiquetaNumeroPasoAsistente(stepIndex: number): string {
    return String(stepIndex + 1).padStart(2, "0");
  }

  etiquetaEtapaPasoAsistente(stepIndex: number): string {
    if (this.esModoHonorarios()) {
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
    if (stepIndex === this.indicePasoResumenAsistente()) {
      return "Acta de revisión";
    }
    return "Registro de revisión";
  }

  etiquetaDecisionPasoAsistente(stepIndex: number): string {
    const kind = this.tipoUiPasoAsistente(stepIndex);
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

  filasRevisionAvanzada(): {
    stepIndex: number;
    label: string;
    kind: TipoUiPasoAsistente;
  }[] {
    return this.etiquetasAsistenteAvanzado.map((_, stepIndex) => ({
      stepIndex,
      label: this.etiquetaCompletaPasoAsistente(stepIndex),
      kind: this.tipoUiPasoRevision(stepIndex),
    }));
  }

  /**
   * Paso 9: pendientes en lenguaje de negocio tras intentar finalizar (reglas bloqueantes).
   */
  resumenPendientesNegocio(): string[] {
    if (
      !this.esModoAvanzado() ||
      this.pasoWizardActivo() !== this.indicePasoResumenAsistente() ||
      !this.intentoGuardado()
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

  descripcionFilaRevision(row: {
    stepIndex: number;
    kind: TipoUiPasoAsistente;
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

  tieneEstadosBloqueantesRevision(): boolean {
    return this.filasRevisionAvanzada().some((row) =>
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

  obtenerResumenValidacionGlobal(): ResumenValidacionGlobal {
    const summaries = ordenPestanas.map((stepId) =>
      this.obtenerResumenValidacionPaso(stepId),
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

  cantidadPendientesMapaAsistente(): number {
    return this.etiquetasAsistenteAvanzado.filter(
      (_, index) => this.tipoUiPasoAsistente(index) === "pendiente",
    ).length;
  }

  cantidadOpcionalesMapaAsistente(): number {
    return this.etiquetasAsistenteAvanzado.filter(
      (_, index) => this.tipoUiPasoAsistente(index) === "opcional",
    ).length;
  }

  cantidadErroresMapaAsistente(): number {
    return this.etiquetasAsistenteAvanzado.filter(
      (_, index) => this.tipoUiPasoAsistente(index) === "errores",
    ).length;
  }

  cantidadNoAplicanMapaAsistente(): number {
    return this.etiquetasAsistenteAvanzado.filter(
      (_, index) => this.tipoUiPasoAsistente(index) === "no-aplica",
    ).length;
  }

  etiquetaResumenMapaAsistente(): string {
    const errors = this.cantidadErroresMapaAsistente();
    const pending = this.cantidadPendientesMapaAsistente();
    const optional = this.cantidadOpcionalesMapaAsistente();
    const notApplicable = this.cantidadNoAplicanMapaAsistente();
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

  private resolverPasoAsistente(rule: ReglaValidacion): number {
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

  private pasosAsistenteParaPestana(tabId: IdPestana): number[] {
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

  private pestanaPrincipalParaPasoAsistente(step: number): IdPestana {
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

  private tieneInteraccionPasoAsistente(wizardStepIndex: number): boolean {
    if (this.intentoGuardado()) {
      return true;
    }
    if (this.pasosAsistenteIntentados().has(wizardStepIndex)) {
      return true;
    }
    const tab = this.pestanaPrincipalParaPasoAsistente(wizardStepIndex);
    return this.pestanasIntentadas().has(tab) || this.pestanasCompletadas().has(tab);
  }

  private marcarPasoAsistenteVisitado(step: number): void {
    this.presentacion.marcarPasoAsistenteVisitado(step);
  }

  private marcarPasoAsistenteIntentado(step: number): void {
    this.presentacion.marcarPasoAsistenteIntentado(step);
  }

  private pasoAsistenteFueIntentado(stepIndex: number): boolean {
    return this.intentoGuardado() || this.pasosAsistenteIntentados().has(stepIndex);
  }

  /**
   * Indica si el paso ya cuenta como “alcanzado” en el flujo lineal (para pintar completo/errores).
   * Evita marcar el paso 7 como “pasó” el 6 cuando APVI no está en `secuenciaLinealAsistente()`.
   */
  private pasoAsistenteMostradoComoAvanzado(stepIndex: number): boolean {
    if (this.intentoGuardado() || this.pasosAsistenteIntentados().has(stepIndex)) {
      return true;
    }
    if (this.pasosAsistenteVisitados().has(stepIndex)) {
      return true;
    }
    const seq = this.secuenciaLinealAsistente();
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

  private calcularNucleoValidacionPasoAsistente(
    wizardStepIndex: number,
  ): ResumenValidacionPaso {
    const evaluated = this.evaluateValidationRules().filter(
      (item) => item.wizardStep === wizardStepIndex && item.visible,
    );
    const pending = evaluated.filter((item) => !item.complete);
    const blockingPending = pending.filter((item) => item.blocking).length;
    const warningsPending = pending.filter(
      (item) => item.severity === "warning",
    ).length;
    const wasAttempted =
      this.pasosAsistenteIntentados().has(wizardStepIndex) || this.intentoGuardado();
    const hasInteraction = this.tieneInteraccionPasoAsistente(wizardStepIndex);

    let status: EstadoValidacionPaso = "pending";

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
      stepId: this.pestanaPrincipalParaPasoAsistente(wizardStepIndex),
      pending: pending.length,
      blockingPending,
      warningsPending,
      complete: evaluated.length - pending.length,
      applicable: evaluated.length,
      status,
    };
  }

  private buscarPrimerPasoAsistenteConBloqueos(): number | null {
    for (let s = 0; s < this.indicePasoResumenAsistente(); s++) {
      if (this.calcularNucleoValidacionPasoAsistente(s).blockingPending > 0) {
        return s;
      }
    }

    return this.form.invalid ? 0 : null;
  }

  private mostrarPasoAsistenteInvalido(step: number): void {
    this.presentacion.marcarPasoAsistenteIntentado(step);
    this.pasoWizardActivo.set(step);
    this.intentarTodasPestanas();
    this.marcarPasoAsistenteTocado(step);
    this.enfocarPrimerControlInvalido(step);
  }

  private marcarPasoAsistenteTocado(step: number): void {
    switch (step) {
      case 0:
        this.marcarControlComoTocado(this.form.controls.datosPersonales);
        this.form.controls.contacto.controls.email.markAsTouched();
        this.form.controls.contacto.controls.telefono.markAsTouched();
        break;
      case 1:
        this.marcarControlComoTocado(this.form.controls.contacto);
        break;
      case 2:
      case 3:
      case 4:
        this.marcarControlComoTocado(this.form.controls.contrato);
        break;
      case 8:
        this.marcarControlComoTocado(this.form.controls.perfilLaboral);
        break;
      case 5:
      case 6:
        this.marcarControlComoTocado(this.form.controls.previsionSalud);
        break;
      case 7:
        this.marcarControlComoTocado(this.form.controls.bancario);
        break;
      default:
        this.form.markAllAsTouched();
    }
  }

  private resolverModo(): FormEmpleadoModo {
    return this.route.snapshot.queryParamMap.get("modo") === "basico"
      ? "basico"
      : "avanzado";
  }

  private async cargarContinuacionBorradorSiAplica(): Promise<void> {
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
        this.totalPasos - 1,
      );
      const formValue = normalizarBorradorAvanzadoParaFormulario(
        detalle.formValue,
        paso,
      );
      this.borradorPersonaId.set(id);
      this.form.patchValue(formValue as never);
      this.presentacion.seleccionarPasoAsistente(paso);
      this.form.markAsPristine();
    } catch {
      this.catalogosError.set(
        "No fue posible cargar el borrador para continuar el alta.",
      );
    }
  }

  private resolverPasoBorradorParaPersistir(): number {
    const visitedSteps = [...this.pasosAsistenteVisitados()].filter((step) =>
      estaPasoAsistenteAltaEnRango(step, this.totalPasos),
    );
    const maxVisited =
      visitedSteps.length > 0 ? Math.max(...visitedSteps) : this.pasoWizardActivo();

    return Math.max(this.pasoWizardActivo(), maxVisited);
  }

  private marcarControlesEnvioComoTocados(): void {
    if (!this.esModoBasico()) {
      this.form.markAllAsTouched();
      return;
    }

    this.form.controls.datosPersonales.markAllAsTouched();
    this.form.controls.contacto.markAllAsTouched();
  }

  private intentarGruposBasicos(): void {
    this.pestanasIntentadas.set(new Set<IdPestana>(["datosPersonales"]));
  }

  private esFormularioBasicoInvalido(): boolean {
    return (
      this.form.controls.datosPersonales.invalid ||
      this.form.controls.contacto.invalid
    );
  }

  private async enviarModoBasico(): Promise<void> {
    this.guardando.set(true);

    try {
      const created = await this.empleadosService.crearBasico(
        mapEmpleadoFormToPayloadBasico(this.form),
      );

      this.form.markAsPristine();
      this.abrirModalExitoBasico(created.id);
    } catch (error) {
      if (error instanceof EmpleadoRutDuplicadoError) {
        this.abrirModalRutDuplicadoBasico(error.rut);
      } else {
        this.abrirModalErrorBasico(this.resolverMensajeErrorGuardado(error));
      }
    } finally {
      this.guardando.set(false);
    }
  }

  private abrirModalExitoBasico(employeeId: number): void {
    this.flujoExito.set("basico");
    this.idEmpleadoCreado.set(employeeId);
    this.abrirModalAccionAvanzada({
      kind: "basic-success",
      variant: "success",
      eyebrow: "Registro actualizado",
      title: "Empleado registrado correctamente",
      message:
        'La ficha quedó en estado «En proceso». Puedes completar contrato, previsión y banco desde la ficha del empleado.',
      sections: this.construirSeccionesMsgboxBitacora({
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

  private abrirModalErrorBasico(message: string): void {
    const suggestedStep = this.pasoSugeridoError(message);
    this.abrirModalAccionAvanzada({
      kind: "basic-error",
      variant: "danger",
      eyebrow: "Error de guardado",
      title: "No fue posible registrar la ficha",
      message:
        "El registro no se completó. Revisa el detalle y vuelve a intentarlo.",
      sections: this.construirSeccionesMsgboxBitacora({
        pendientePrincipal: this.mensajeErrorNormalizado(message),
        detailItems: suggestedStep ? [`Revisar: ${suggestedStep}`] : undefined,
        porQueImporta:
          "Sin corregir el problema no se puede dejar la ficha registrada en el sistema.",
        accionRecomendada: this.accionRecomendadaError(message),
      }),
      primaryLabel: "Cerrar",
      blockingItems: [],
      warningItems: [],
      infoItems: [],
      primaryAction: "dismiss",
    });
  }

  private abrirModalRutDuplicadoBasico(rut: string): void {
    this.abrirModalAccionAvanzada({
      kind: "basic-duplicate-rut",
      variant: "danger",
      eyebrow: "Revisión administrativa",
      title: "Ficha ya registrada",
      message: `Ya existe un empleado registrado con el RUT ${rut}.`,
      sections: this.construirSeccionesMsgboxBitacora({
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

  private abrirModalEsperaCatalogosBasico(): void {
    this.abrirModalAccionAvanzada({
      kind: "basic-catalog-wait",
      variant: "warning",
      eyebrow: "Revisión administrativa",
      title: "Formulario en preparación",
      message:
        "Los catálogos y datos base aún se están cargando. Espera unos segundos e intenta guardar de nuevo.",
      sections: this.construirSeccionesMsgboxBitacora({
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

  private evaluateValidationRules(): ReglaValidacionEvaluada[] {
    return mapDiagnosticoItemsToEvaluatedRules(
      evaluarDiagnosticoFichaEmpleado(this.buildFichaValidacionSnapshot()),
    );
  }

  private buildFichaValidacionSnapshot(): EmpleadoFichaValidacionSnapshot {
    const raw = this.form.getRawValue();
    const salud = this.catalogos().entidadesSalud.find(
      (item) => item.value === raw.previsionSalud.idSalud,
    );
    const edadResumen = this.perfilLaboralEdadResumen();
    const tieneCondicionesEspeciales = this.hasPerfilLaboralCondicionesSeleccionadas();

    return {
      origenCreacion: this.esModoBasico() ? "basico" : "avanzado",
      pasoAltaAvanzada: this.esModoAvanzado() ? this.pasoWizardActivo() : null,
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
      excluidoLimiteJornada: raw.contrato.excluidoLimiteJornada,
      causalExclusionJornada: raw.contrato.causalExclusionJornada,
      justificacionExclusionJornada: raw.contrato.justificacionExclusionJornada,
      casaParticularModalidad: raw.contrato.casaParticularModalidad,
      casaParticularLabores: raw.contrato.casaParticularLabores,
      casaParticularDomicilioEspecifico: raw.contrato.casaParticularDomicilioEspecifico,
      casaParticularAsistenciaCuidado: raw.contrato.casaParticularAsistenciaCuidado,
      casaParticularRegistroDtEstado: raw.contrato.casaParticularRegistroDtEstado,
      casaParticularRegistroDtFecha: raw.contrato.casaParticularRegistroDtFecha,
      casaParticularRegistroDtFolio: raw.contrato.casaParticularRegistroDtFolio,
      fechaIngreso: raw.contrato.fechaIngreso,
      fechaTermino: raw.contrato.fechaTermino,
      sueldoBase: raw.contrato.sueldoBase,
      idMoneda: raw.contrato.idMoneda,
      horasSemanales: raw.contrato.horasSemanales,
      diasSemanales: raw.contrato.diasSemanales,
      distribucionJornada: raw.contrato.distribucionJornada,
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
      tipoJornadaLabel: this.etiquetaTipoJornadaSeleccionada(),
      jornadaParcial: this.esJornadaParcialSeleccionada(),
      fechaNacimiento: personal.fechaNacimiento.value,
      fechaIngreso: contrato.fechaIngreso.value,
      fechaTermino: contrato.fechaTermino.value,
      horasSemanales: contrato.horasSemanales.value,
      excluidoLimiteJornada: contrato.excluidoLimiteJornada.value,
      causalExclusionJornada: contrato.causalExclusionJornada.value,
      casaParticularModalidad: contrato.casaParticularModalidad.value,
      casaParticularRegistroDtEstado: contrato.casaParticularRegistroDtEstado.value,
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
    const campos: readonly AltaAplicabilidadCampo[] = this.esModoHonorarios()
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

    if (this.esModoHonorarios()) {
      return "Borrador disponible";
    }

    return "Alta coherente";
  }

  diagnosticoContractualDescripcion(): string {
    const bloqueos = this.altaAplicabilidadState().resumen.blocked;
    const revisiones = this.inconsistenciasCoherencia().length;

    if (this.esModoHonorarios()) {
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

    if (this.esModoHonorarios()) {
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
  ): ReglaValidacionEvaluada[] {
    return this.evaluateValidationRules()
      .filter(
        (item) =>
          item.visible && item.wizardStep === wizardStep && !item.complete,
      )
      .sort(
        (a, b) => this.pesoOrdenValidacion(a) - this.pesoOrdenValidacion(b),
      );
  }

  private pendingValidationItemsForFinalization(): ReglaValidacionEvaluada[] {
    return this.evaluateValidationRules()
      .filter((item) => item.visible && !item.complete)
      .sort((a, b) => {
        const byStep = a.wizardStep - b.wizardStep;
        return byStep !== 0
          ? byStep
          : this.pesoOrdenValidacion(a) - this.pesoOrdenValidacion(b);
      });
  }

  private abrirModalAccionAvanzada(modal: ModalAccionAvanzada): void {
    this.mensajeError.set(null);
    this.rutModalRutDuplicado.set(null);
    this.mensajeExito.set(null);
    this.modalAccionAvanzada.set(modal);
  }

  private openCoherenceDecisionModal(
    issue: InconsistenciaCoherenciaAlta,
    context: "next" | "finish",
  ): void {
    this.decisionCoherenciaPendiente.set({ issue, context });
    this.abrirModalAccionAvanzada({
      kind: "coherence-decision",
      variant: "warning",
      eyebrow: "Revisión administrativa",
      title: issue.title,
      message:
        context === "finish"
          ? "Antes de finalizar conviene decidir esta combinación en la bitácora."
          : "Antes de seguir conviene decidir esta combinación en la bitácora.",
      sections: this.construirSeccionesMsgboxBitacora({
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
      this.modalAccionAvanzada.set(null);
      return;
    }

    this.applyCoherenceAction(pending.issue.action, pending.issue.actionValue);
    this.decisionCoherenciaPendiente.set(null);
    this.modalAccionAvanzada.set(null);
    this.idsInconsistenciasCoherenciaReconocidas.update((prev) => {
      const next = new Set(prev);
      next.delete(pending.issue.id);
      return next;
    });
    this.sincronizarPestanasCompletadasDesdeValidez();
    this.seleccionarPasoAsistente(pending.issue.stepIndex);
  }

  private keepPendingCoherenceReview(): void {
    const pending = this.decisionCoherenciaPendiente();
    if (!pending) {
      this.modalAccionAvanzada.set(null);
      return;
    }

    this.idsInconsistenciasCoherenciaReconocidas.update(
      (prev) => new Set([...prev, pending.issue.id]),
    );
    this.decisionCoherenciaPendiente.set(null);
    this.modalAccionAvanzada.set(null);
    this.sincronizarPestanasCompletadasDesdeValidez();

    if (pending.context === "finish") {
      this.marcarTodasPestanasValidasComoCompletadas();
      this.openFinishConfirmModal();
      return;
    }

    this.avanzarPasoSiguienteAsistente();
  }

  private aplicabilidadReviewsAsValidationRules(
    wizardStep: number,
  ): ReglaValidacionEvaluada[] {
    return this.altaValidacionesVisiblesMotor()
      .filter(
        (item) =>
          item.paso === wizardStep &&
          item.id.startsWith('aplicabilidad.') &&
          (item.tipo === 'review' || item.tipo === 'warning'),
      )
      .map((item) => ({
        id: item.id,
        stepId: 'contrato',
        wizardStep: item.paso,
        sectionTitle: item.area,
        label: item.titulo,
        detail: item.detalle,
        severity: item.tipo === 'warning' ? 'warning' : 'info',
        blocking: false,
        complete: false,
        visible: true,
        sourcePath: item.controlPath ?? '',
      }));
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
        this.seleccionarPasoAsistente(this.perfilLaboralWizardStepIndex());
        break;
      default:
        break;
    }
  }

  private openNextStepReviewModal(
    step: number,
    pending: readonly ReglaValidacionEvaluada[],
  ): void {
    const blocking = pending.filter(
      (item) => item.blocking && item.severity === "error",
    );
    const warnings = pending.filter((item) => item.severity === "warning");
    const label = this.etiquetaCortaPasoAsistente(step);
    const hasBlocking = blocking.length > 0;
    const fieldItems = hasBlocking
      ? this.itemsCampoModalValidacion(blocking)
      : [];
    const detailItems = hasBlocking
      ? []
      : this.etiquetasModalValidacion(warnings, 6);

    this.abrirModalAccionAvanzada({
      kind: "next-step-review",
      variant: hasBlocking ? "warning" : "info",
      eyebrow: "Revisión administrativa",
      title: hasBlocking
        ? "Datos pendientes en este registro"
        : "Advertencias de revisión",
      message: hasBlocking
        ? `El registro «${label}» aún tiene datos obligatorios. Puedes corregirlos ahora o continuar y volver antes de finalizar.`
        : `El registro «${label}» tiene revisiones que no bloquean el avance, pero conviene dejarlas claras.`,
      sections: this.construirSeccionesMsgboxBitacora({
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
    this.abrirModalAccionAvanzada({
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
    this.abrirModalAccionAvanzada({
      kind: "draft-success",
      variant: "success",
      eyebrow: "Registro actualizado",
      title: isNewDraft ? "Borrador guardado" : "Borrador actualizado",
      message:
        "La ficha quedó guardada. Puedes seguir completando la bitácora ahora o retomarla más tarde.",
      sections: this.construirSeccionesMsgboxBitacora({
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
    const fieldItems = this.itemsCampoModalValidacion(blocking);

    this.abrirModalAccionAvanzada({
      kind: "finish-invalid",
      variant: "error",
      eyebrow: "Revisión administrativa",
      title: "La ficha no está lista para finalizar",
      message:
        "Aún hay registros de la bitácora con datos obligatorios pendientes. Ciérralos antes de finalizar el alta.",
      sections: this.construirSeccionesMsgboxBitacora({
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
    this.abrirModalAccionAvanzada({
      kind: "finish-confirm",
      variant: "success",
      eyebrow: "Decisión requerida",
      title: "Finalizar alta del trabajador",
      message:
        "La bitácora laboral está lista para cerrar el alta. Revisa que la información sea correcta antes de confirmar.",
      sections: this.construirSeccionesMsgboxBitacora({
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
    this.abrirModalAccionAvanzada({
      kind: "honorarios-confirm",
      variant: "warning",
      eyebrow: "Decisión requerida",
      title: "Cambiar a boleta de honorarios",
      message:
        "El registro pasará a prestador de servicios. Los pasos laborales dependientes quedarán como no aplicables en la bitácora.",
      sections: this.construirSeccionesMsgboxBitacora({
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
    this.abrirModalAccionAvanzada({
      kind: "honorarios-finish-blocked",
      variant: "warning",
      eyebrow: "Revisión administrativa",
      title: "Guardar borrador de honorarios",
      message:
        "La ficha está en modalidad honorarios. Puedes guardar borrador; la finalización como dependiente no está disponible.",
      sections: this.construirSeccionesMsgboxBitacora({
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

  private configurarFlujoTipoTrabajador(): void {
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

  etiquetaTipoTrabajadorSeleccionado(): string {
    const selectedId =
      this.form.controls.contrato.controls.idTipoTrabajador.value;
    const option = this.catalogos().tiposTrabajador.find(
      (item) => item.value === selectedId,
    );

    return option?.label ?? "Tipo trabajador pendiente";
  }

  etiquetaTipoJornadaSeleccionada(): string {
    const selectedId = this.form.controls.contrato.controls.idTipoJornada.value;
    const option = this.catalogos().tiposJornada.find(
      (item) => item.value === selectedId,
    );

    return option?.label ?? "Jornada pendiente";
  }

  private esJornadaParcialSeleccionada(): boolean {
    const label = this.etiquetaTipoJornadaSeleccionada();
    return label
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .includes("parcial");
  }

  private configurarAutodeteccionPerfilLaboral(): void {
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
        .subscribe(() => this.aplicarAutodeteccionPerfilLaboral());
    });
  }

  private aplicarAutodeteccionPerfilLaboral(): void {
    if (
      this.form.controls.contrato.controls.relacionLaboral.value ===
      "HONORARIOS"
    ) {
      this.deteccionesAutomaticasPerfilLaboral.set([]);
      return;
    }

    const detections = this.detectarCondicionesPerfilLaboral();
    this.deteccionesAutomaticasPerfilLaboral.set(detections);
    this.sincronizarControlesPerfilAutodetectados(detections);
  }

  private detectarCondicionesPerfilLaboral(): readonly DeteccionAutomaticaPerfilLaboral[] {
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

  private sincronizarControlesPerfilAutodetectados(
    detections: readonly DeteccionAutomaticaPerfilLaboral[],
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

  private normalizarEtiquetaCatalogo(value: string): string {
    return value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();
  }

  private configurarUxRelacionLaboral(): void {
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

  private confirmarModoHonorarios(): void {
    this.previousRelacionLaboral = "HONORARIOS";
    this.aplicarEstadoVisualHonorarios();
    this.moverFlujoHonorariosAPasoAplicable();
    this.sincronizarPestanasCompletadasDesdeValidez();
  }

  private cancelarCambioModoHonorarios(): void {
    this.suppressRelacionLaboralModal = true;
    this.form.controls.contrato.controls.relacionLaboral.setValue(
      this.previousRelacionLaboral,
      {
        emitEvent: true,
      },
    );
    this.suppressRelacionLaboralModal = false;
    this.sincronizarPestanasCompletadasDesdeValidez();
  }

  private aplicarEstadoVisualHonorarios(): void {
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
    contrato.excluidoLimiteJornada.setValue(false, { emitEvent: false });
    contrato.causalExclusionJornada.setValue(null, { emitEvent: false });
    contrato.justificacionExclusionJornada.setValue("", { emitEvent: false });
    contrato.casaParticularModalidad.setValue(null, { emitEvent: false });
    contrato.casaParticularLabores.setValue("", { emitEvent: false });
    contrato.casaParticularDomicilioEspecifico.setValue("", { emitEvent: false });
    contrato.casaParticularAsistenciaCuidado.setValue(false, { emitEvent: false });
    contrato.casaParticularRegistroDtEstado.setValue(null, { emitEvent: false });
    contrato.casaParticularRegistroDtFecha.setValue("", { emitEvent: false });
    contrato.casaParticularRegistroDtFolio.setValue("", { emitEvent: false });
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

  private moverFlujoHonorariosAPasoAplicable(): void {
    if ([4, 5, 6].includes(this.pasoWizardActivo())) {
      this.presentacion.seleccionarPasoAsistente(7);
      this.desplazarAInicioPasoActual({ focusFirstField: true });
    }
  }

  private construirSeccionesMsgboxBitacora(options: {
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

  private etiquetasModalValidacion(
    items: readonly ReglaValidacionEvaluada[],
    max: number,
  ): readonly string[] {
    const seen = new Set<string>();
    const out: string[] = [];

    for (const item of items) {
      const text = this.etiquetaModalValidacion(item);
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

  private itemsCampoModalValidacion(
    items: readonly ReglaValidacionEvaluada[],
  ): readonly ItemCampoModalAccionAvanzada[] {
    const seen = new Set<string>();
    const out: ItemCampoModalAccionAvanzada[] = [];

    for (const item of items) {
      if (seen.has(item.id)) {
        continue;
      }
      seen.add(item.id);
      out.push({
        id: item.id,
        sectionTitle: item.sectionTitle || this.etiquetaCortaPasoAsistente(item.wizardStep),
        fieldLabel: item.label,
        detail: this.asegurarOracion(item.detail || this.etiquetaModalValidacion(item)),
        actionLabel: item.actionLabel || "Completar campo",
        wizardStep: item.wizardStep,
        controlPath: item.sourcePath,
        severity: item.severity,
      });
    }

    return out;
  }

  private etiquetaModalValidacion(item: ReglaValidacionEvaluada): string {
    const negocio = MENSAJES_FINALIZAR_ALTA[item.id];
    if (negocio) {
      return negocio;
    }

    return this.asegurarOracion(item.label);
  }

  private asegurarOracion(text: string): string {
    const clean = text.trim();
    if (!clean) {
      return clean;
    }

    return /[.!?]$/.test(clean) ? clean : `${clean}.`;
  }

  private etiquetasPendientesMinimosBorrador(): readonly string[] {
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
    stepId: IdPasoValidacion,
    label: string,
    severity: SeveridadValidacion,
    blocking: boolean,
    sourcePath: string,
    category: string,
    isComplete: () => boolean,
    isApplicable: () => boolean = () => true,
    isVisible?: () => boolean,
  ): ReglaValidacion {
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

  private pesoOrdenValidacion(item: ReglaValidacionEvaluada): number {
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

  nombreCompletoVisible(): string {
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
    return cargo && !this.esCargoTecnico(cargo) ? cargo : "Sin informacion";
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
    return `${resumen.label} · ${this.esModoHonorarios() ? "Independiente / honorarios" : "Dependiente / contrato"}`;
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

  claseEstadoListaChequeo(kind: TipoUiPasoAsistente): string {
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

  private tipoUiPasoRevision(stepIndex: number): TipoUiPasoAsistente {
    const kind = this.tipoUiPasoAsistente(stepIndex);
    if (kind !== "actual") {
      return kind;
    }

    const summary = this.obtenerResumenValidacionPasoAsistente(stepIndex);
    if (summary.blockingPending > 0 && this.intentoGuardado()) {
      return "errores";
    }
    if (summary.blockingPending === 0 && summary.status === "complete") {
      return "completo";
    }
    return "pendiente";
  }

  private enfocarPrimerControlPendiente(
    wizardStep: number = this.pasoWizardActivo(),
  ): void {
    window.setTimeout(() => {
      const sorted = [...this.evaluateValidationRules()].sort(
        (a, b) => this.pesoOrdenValidacion(a) - this.pesoOrdenValidacion(b),
      );
      const firstPendingRule = sorted.find(
        (item) =>
          item.visible && item.wizardStep === wizardStep && !item.complete,
      );
      const control =
        this.buscarControlParaRegla(firstPendingRule) ??
        this.buscarPrimerControlNgInvalido();

      if (!control) {
        return;
      }

      control.scrollIntoView({ behavior: "smooth", block: "center" });
      control.focus({ preventScroll: true });
    });
  }

  private enfocarPrimerControlInvalido(
    wizardStep: number = this.pasoWizardActivo(),
  ): void {
    window.setTimeout(() => {
      const sorted = [...this.evaluateValidationRules()].sort(
        (a, b) => this.pesoOrdenValidacion(a) - this.pesoOrdenValidacion(b),
      );
      const firstPendingRule = sorted.find(
        (item) =>
          item.visible &&
          item.wizardStep === wizardStep &&
          item.blocking &&
          !item.complete,
      );
      const firstInvalidControl =
        this.buscarControlParaRegla(firstPendingRule) ??
        this.buscarPrimerControlNgInvalido();

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

  private buscarControlParaRegla(
    rule: ReglaValidacionEvaluada | undefined,
  ): HTMLElement | null {
    if (!rule) {
      return null;
    }

    return this.buscarControlPorRuta(rule.sourcePath);
  }

  private enfocarRutaControl(controlPath: string): void {
    window.setTimeout(() => {
      const control = this.buscarControlPorRuta(controlPath);
      if (!control) {
        this.desplazarAInicioPasoActual({ focusFirstField: true });
        return;
      }

      control.scrollIntoView({ behavior: "smooth", block: "center" });
      control.focus({ preventScroll: true });
    });
  }

  domicilioReferenciaCasaParticular(): string | null {
    const contacto = this.form.controls.contacto.controls;
    const partes = [
      contacto.direccion.value,
      contacto.numeroDireccion.value,
      this.catalogos().comunas.find((item) => item.value === contacto.idComuna.value)?.label ?? '',
    ]
      .map((value) => value?.trim())
      .filter(Boolean);

    return partes.length ? partes.join(', ') : null;
  }

  private buscarControlPorRuta(controlPath: string | undefined): HTMLElement | null {
    const controlName = controlPath?.split(".").at(-1);
    if (!controlName) {
      return null;
    }

    const controlHost =
      this.hostElement.nativeElement.querySelector<HTMLElement>(
        `.step-panel [formControlName="${controlName}"], .step-panel [formcontrolname="${controlName}"]`,
      );
    return this.obtenerCampoEnfocable(controlHost);
  }

  private buscarPrimerControlNgInvalido(): HTMLElement | null {
    const invalidHost =
      this.hostElement.nativeElement.querySelector<HTMLElement>(
        '.step-panel input.ng-invalid:not([type="hidden"]), .step-panel select.ng-invalid, .step-panel textarea.ng-invalid, .step-panel [formControlName].ng-invalid, .step-panel [formcontrolname].ng-invalid',
      );

    return this.obtenerCampoEnfocable(invalidHost);
  }

  private obtenerCampoEnfocable(
    controlHost: HTMLElement | null,
  ): HTMLElement | null {
    if (!controlHost) {
      return null;
    }

    if (this.esCampoFormularioEnfocable(controlHost)) {
      return controlHost;
    }

    return controlHost.querySelector<HTMLElement>(
      'input:not([type="hidden"]):not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), [tabindex]:not([tabindex="-1"])',
    );
  }

  private esCampoFormularioEnfocable(element: HTMLElement): boolean {
    return (
      element.matches('input:not([type="hidden"]):not([disabled])') ||
      element.matches("select:not([disabled])") ||
      element.matches("textarea:not([disabled])") ||
      element.matches("button:not([disabled])") ||
      element.matches('[tabindex]:not([tabindex="-1"])')
    );
  }

  private desplazarAInicioPagina(): void {
    window.setTimeout(() => {
      const formStart =
        this.hostElement.nativeElement.querySelector<HTMLElement>(
          ".form-page-head",
        ) ?? this.hostElement.nativeElement;

      formStart.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  private desplazarAInicioPasoActual(options: {
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

  esPestanaInvalida(tabId: IdPestana): boolean {
    return this.obtenerResumenValidacionPaso(tabId).blockingPending > 0;
  }

  private marcarControlComoTocado(control: AbstractControl): void {
    control.markAllAsTouched();
    control.updateValueAndValidity({ emitEvent: false });
  }

  private intentarTodasPestanas(): void {
    this.pestanasIntentadas.set(new Set(ordenPestanas));
    this.pasosAsistenteIntentados.set(
      new Set(Array.from({ length: this.totalPasos }, (_, index) => index)),
    );
  }

  private sincronizarPestanasCompletadasDesdeValidez(): void {
    this.pestanasCompletadas.update((tabs) => {
      const next = new Set(tabs);

      for (const tabId of ordenPestanas) {
        if (this.esPestanaInvalida(tabId)) {
          next.delete(tabId);
        } else {
          next.add(tabId);
        }
      }

      return next;
    });
  }

  private marcarTodasPestanasValidasComoCompletadas(): void {
    this.pestanasCompletadas.set(
      new Set(ordenPestanas.filter((tabId) => !this.esPestanaInvalida(tabId))),
    );
  }

  private marcarPestanaComoCompletada(tabId: IdPestana): void {
    this.pestanasCompletadas.update((tabs) => new Set([...tabs, tabId]));
  }

  private quitarPestanaCompletada(tabId: IdPestana): void {
    this.pestanasCompletadas.update((tabs) => {
      const next = new Set(tabs);
      next.delete(tabId);
      return next;
    });
  }

  private resolverMensajeErrorGuardado(error: unknown): string {
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

  private obtenerSeccion(tabId: IdPestana) {
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

  private esSeccionFormularioInvalida(tabId: IdPestana): boolean {
    return tabId === "datosPersonales"
      ? this.obtenerEstadoSeccionPersonal().invalid
      : this.obtenerSeccion(tabId).invalid;
  }

  private tieneInteraccionPaso(tabId: IdPestana): boolean {
    if (
      this.pestanasCompletadas().has(tabId) ||
      this.pestanasIntentadas().has(tabId) ||
      this.intentoGuardado()
    ) {
      return true;
    }

    if (tabId === "datosPersonales") {
      const personal = this.obtenerEstadoSeccionPersonal();
      return personal.dirty || personal.touched;
    }

    const section = this.obtenerSeccion(tabId);
    return section.dirty || section.touched;
  }

  private obtenerEstadoSeccionPersonal() {
    const datosPersonales = this.form.controls.datosPersonales;
    const contacto = this.form.controls.contacto;

    return {
      invalid: datosPersonales.invalid || contacto.invalid,
      valid: datosPersonales.valid && contacto.valid,
      dirty: datosPersonales.dirty || contacto.dirty,
      touched: datosPersonales.touched || contacto.touched,
    };
  }

  private esCargoTecnico(value: string): boolean {
    return (
      this.normalizarTextoTecnico(value) ===
      this.normalizarTextoTecnico("Sin cargo")
    );
  }

  private esCuentaBorrador(value: string): boolean {
    return value.trim().toUpperCase().startsWith("DRAFT-");
  }

  private normalizarTextoTecnico(value: string): string {
    return value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim()
      .toLowerCase();
  }
}

