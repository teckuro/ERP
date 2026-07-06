import { CommonModule } from "@angular/common";
import {
  Component,
  DestroyRef,
  ElementRef,
  Injector,
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
import {
  collectBorradorAvanzadoIssues,
} from "../../utils/empleado-borrador-form.validation";
import {
  buildFieldItemsFromRules,
  mensajesNegocioDesdeReglas,
  pesoOrdenValidacion,
  sortReglasValidacion,
} from "../../utils/empleado-alta-modal.presenter";
import { normalizarBorradorAvanzadoParaFormulario } from "../../utils/empleado-borrador-hidratacion";
import {
  buscarControlPorRuta,
  buscarPrimerControlNgInvalido,
  enfocarElemento,
  enfocarRutaControl as enfocarRutaControlDom,
} from "../../utils/empleado-alta-foco.util";
import {
  etiquetasAsistenteAvanzadoEmpleado,
  cantidadPasosAsistenteAvanzadoEmpleado,
  etiquetaPasoHonorarios,
  idsBloquesPasoFormularioEmpleado,
  ordenPestanasFormularioEmpleado,
} from "../../models/empleado-form.manifest";
import { construirSnapshotValidacionFicha } from "../../rules/empleado-alta-ficha-snapshot.builder";
import {
  EmpleadoAltaModalOrquestador,
  type DelegadoModalAltaEmpleado,
} from "../../facade/empleado-alta-modal.orquestador";
import { EmpleadoFormGroup } from "../../models/empleado-form.model";
import {
  CONDICIONES_TRABAJADOR_UI,
  CondicionTrabajadorControlName,
} from "../../models/empleado-perfil-laboral.model";
import type {
  ModalAccionAvanzada,
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
  diagnosticoItemDesdeFaltanteAlta,
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
} from "../../../../shared/components/ui/primitives/card.component";
import { MessageBoxComponent } from "../../../../shared/components/ui/feedback/message-box/message-box.component";
import type { MessageBoxSection } from "../../../../shared/components/ui/feedback/message-box/message-box.component";
import {
  buildMsgboxDiagnostico,
  buildMsgboxErrorSimple,
} from "../../../../shared/components/ui/feedback/message-box/message-box.builders";
import { WorkspaceLoadingComponent } from "../../../../shared/components/ui/feedback/workspace-loading/workspace-loading.component";
import { bindShellPageContext } from "../../../../layout/shell-page-context.binding";

const ordenPestanas: readonly IdPestana[] = [...ordenPestanasFormularioEmpleado];

/** Reglas de ficha ya cumplidas al cerrar el alta avanzada (estado activo y paso borrador). */
const REGLAS_VALIDACION_EXCLUIDAS_AL_FINALIZAR_ALTA_AVANZADA = new Set([
  "alta.basica",
  "alta.avanzada",
  "employee.status",
]);

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
  providers: [EmpleadoAltaAvanzadaPresentacionFacade, EmpleadoAltaModalOrquestador],
})
export class FormEmpleadoComponent implements OnInit, DelegadoModalAltaEmpleado {
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
  private readonly injector = inject(Injector);
  private readonly presentacion = inject(EmpleadoAltaAvanzadaPresentacionFacade);
  private readonly modalOrquestador = inject(EmpleadoAltaModalOrquestador);
  private suppressRelacionLaboralModal = false;
  private previousRelacionLaboral: RelacionLaboral = "CONTRATO";
  private relacionLaboralRevertirHonorarios: RelacionLaboral = "CONTRATO";

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
      this.modalOrquestador.abrirModalEsperaCatalogosBorrador();
      return;
    }

    const borradorIssues = collectBorradorAvanzadoIssues(this.form);
    if (borradorIssues.length > 0) {
      this.retroalimentacionBorrador.set(null);
      this.modalOrquestador.abrirModalBorradorInvalido(borradorIssues);
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
      this.modalOrquestador.abrirModalBorradorExito(prevId === null);
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
    this.navegarPasoAsistente(index, { focusFirstField: true });
  }

  /** Cambia de paso sin robar foco al primer campo genérico (p. ej. tras MsgBox). */
  private navegarPasoAsistente(
    index: number,
    options: { focusFirstField: boolean },
  ): void {
    if (!estaPasoAsistenteAltaEnRango(index, cantidadPasosAsistenteAvanzadoEmpleado)) {
      return;
    }

    this.sincronizarPestanasCompletadasDesdeValidez();
    this.presentacion.seleccionarPasoAsistente(index);
    this.desplazarAInicioPasoActual(options);
  }

  private opcionesEtiquetaPasoHonorarios() {
    return {
      indicePasoPerfilLaboral: this.perfilLaboralWizardStepIndex(),
      etiquetasCortasAsistente: this.etiquetasCortasAsistenteAvanzado,
      etiquetasLargasAsistente: this.etiquetasAsistenteAvanzado,
      descripcionesPasosAsistente: this.descripcionesPasosAsistenteAvanzado,
    };
  }

  etiquetaCortaPasoAsistente(stepIndex: number): string {
    if (this.esModoHonorarios()) {
      return etiquetaPasoHonorarios(stepIndex, "corta", this.opcionesEtiquetaPasoHonorarios());
    }

    return (
      this.etiquetasCortasAsistenteAvanzado[stepIndex] ??
      this.etiquetasAsistenteAvanzado[stepIndex] ??
      ""
    );
  }

  etiquetaCompletaPasoAsistente(stepIndex: number): string {
    if (this.esModoHonorarios()) {
      return etiquetaPasoHonorarios(stepIndex, "larga", this.opcionesEtiquetaPasoHonorarios());
    }

    return this.etiquetasAsistenteAvanzado[stepIndex] ?? "";
  }

  descripcionPasoAsistente(stepIndex: number): string {
    if (this.esModoHonorarios()) {
      return etiquetaPasoHonorarios(
        stepIndex,
        "descripcion",
        this.opcionesEtiquetaPasoHonorarios(),
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
        this.modalOrquestador.abrirModalEsperaCatalogosBasico();
      } else {
        this.mensajeError.set(
          "La informacion base del formulario aun se esta cargando. Espera unos segundos e intenta nuevamente.",
        );
      }
      return;
    }

    if (this.esModoBasico()) {
      if (this.esFormularioBasicoInvalido()) {
        this.enfocarPrimerControlEnPaso(this.pasoWizardActivo(), {
          soloBloqueantes: true,
        });
        return;
      }

      await this.enviarModoBasico();
      return;
    }

    const firstBadStep = this.buscarPrimerPasoAsistenteConBloqueos();

    if (firstBadStep !== null || this.form.invalid) {
      this.sincronizarPestanasCompletadasDesdeValidez();
      this.modalOrquestador.abrirModalFinalizarInvalido(this, firstBadStep ?? 0);
      return;
    }

    const coherenceIssue = this.primeraDecisionCoherenciaSinReconocer();
    if (coherenceIssue) {
      this.sincronizarPestanasCompletadasDesdeValidez();
      this.modalOrquestador.abrirModalDecisionCoherencia(coherenceIssue, "finish");
      return;
    }

    this.marcarTodasPestanasValidasComoCompletadas();
    this.modalOrquestador.abrirModalConfirmarFinalizar(this);
  }

  async enviarModoAvanzado(): Promise<void> {
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
    const detalle = this.mensajeError()?.trim();
    if (detalle) {
      return this.mensajeErrorNormalizado(detalle);
    }
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

  seccionesRutDuplicado(rut: string): MessageBoxSection[] {
    return buildMsgboxErrorSimple({
      accion: `Revisa el listado o edita la ficha existente antes de crear una nueva. RUT ${rut}.`,
    });
  }

  seccionesErrorGuardado(message: string): MessageBoxSection[] {
    const suggestedStep = this.pasoSugeridoError(message);
    return buildMsgboxDiagnostico({
      diagnostico: this.mensajeErrorNormalizado(message),
      detalle: suggestedStep ? `Revisar: ${suggestedStep}` : null,
      accion: this.accionRecomendadaError(message),
    });
  }

  seccionesExitoAlta(): MessageBoxSection[] {
    const fichaId = this.idEmpleadoCreado();
    const items = fichaId ? [`Ficha N° ${fichaId}`] : [];
    if (this.flujoExito() === "basico") {
      return [
        {
          title: "Acción recomendada",
          text: "Completa contrato, previsión, salud, banco y remuneración desde la ficha del empleado cuando corresponda.",
          items,
          tone: "info",
        },
      ];
    }

    return [
      {
        title: "Acción recomendada",
        text: "Puedes revisar o completar información adicional desde la ficha del empleado.",
        items,
        tone: "info",
      },
    ];
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
    this.modalOrquestador.manejarAccion(
      this,
      this.modalAccionAvanzada()?.primaryAction ?? "dismiss",
    );
  }

  manejarSecundariaModalAccionAvanzada(): void {
    this.modalOrquestador.manejarAccion(
      this,
      this.modalAccionAvanzada()?.secondaryAction ?? "dismiss",
    );
  }

  manejarItemCampoModalAvanzada(item: ItemCampoModalAccionAvanzada): void {
    this.modalAccionAvanzada.set(null);
    this.enfocarPrimerItemModalAvanzada(item, () => {
      this.mostrarPasoAsistenteInvalido(item.wizardStep);
    });
  }

  cerrarModalAccionAvanzada(): void {
    this.decisionCoherenciaPendiente.set(null);
    this.modalAccionAvanzada.set(null);
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
        ? "Finalizando honorarios..."
        : "Guardando ficha...";
    }

    return this.esModoHonorarios() ? "Finalizar honorarios" : "Finalizar alta";
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
    if (this.pasoWizardActivo() === this.indicePasoResumenAsistente()) {
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

    const seq = this.secuenciaLinealAsistente();
    const nextStep = resolverPasoSiguienteAsistenteAlta(seq, currentStep);
    if (nextStep === this.indicePasoResumenAsistente()) {
      this.avanzarPasoSiguienteAsistente();
      return;
    }

    const coherenceIssue = this.primeraDecisionCoherenciaPorPaso(currentStep);
    if (coherenceIssue) {
      this.modalOrquestador.abrirModalDecisionCoherencia(coherenceIssue, "next");
      return;
    }

    const pending = [
      ...this.pendingValidationItemsForWizardStep(currentStep),
      ...this.aplicabilidadReviewsAsValidationRules(currentStep),
    ];
    if (pending.length > 0) {
      this.modalOrquestador.abrirModalRevisionPasoSiguiente(this, currentStep, pending);
      return;
    }

    this.avanzarPasoSiguienteAsistente();
  }

  avanzarPasoSiguienteAsistente(): void {
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
    const diagItem = diagnosticoItemDesdeFaltanteAlta(issue, diagnostico.items);

    if (diagItem?.controlPath) {
      this.enfocarPrimerItemModalAvanzada(
        {
          id: diagItem.id,
          sectionTitle: diagItem.category ?? diagItem.seccion,
          fieldLabel: diagItem.label,
          detail: diagItem.detalle,
          actionLabel: diagItem.accion ?? 'Ir al campo',
          wizardStep: diagItem.wizardStep,
          controlPath: diagItem.controlPath,
          severity: diagItem.severity,
        },
        () => {
          const step = wizardStepDesdeFaltanteAlta(issue, diagnostico.items);
          this.mostrarPasoAsistenteInvalido(step);
        },
      );
      return;
    }

    const step = wizardStepDesdeFaltanteAlta(issue, diagnostico.items);
    this.mostrarPasoAsistenteInvalido(step);
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
    this.aplicarAccionCoherencia(issue.action, issue.actionValue);
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
      return etiquetaPasoHonorarios(stepIndex, "etapa", this.opcionesEtiquetaPasoHonorarios());
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

    const rules = this.evaluateValidationRules().filter(
      (item) =>
        item.visible &&
        this.reglaValidacionCuentaEnFlujoAltaAvanzada(item),
    );
    return [...mensajesNegocioDesdeReglas(rules)];
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

  private reglaValidacionCuentaEnFlujoAltaAvanzada(
    item: ReglaValidacionEvaluada,
  ): boolean {
    if (!this.esModoAvanzado()) {
      return true;
    }

    return !REGLAS_VALIDACION_EXCLUIDAS_AL_FINALIZAR_ALTA_AVANZADA.has(item.id);
  }

  private calcularNucleoValidacionPasoAsistente(
    wizardStepIndex: number,
  ): ResumenValidacionPaso {
    const evaluated = this.evaluateValidationRules().filter(
      (item) =>
        item.wizardStep === wizardStepIndex &&
        item.visible &&
        this.reglaValidacionCuentaEnFlujoAltaAvanzada(item),
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

  buscarPrimerPasoAsistenteConBloqueos(): number | null {
    for (let s = 0; s < this.indicePasoResumenAsistente(); s++) {
      if (this.calcularNucleoValidacionPasoAsistente(s).blockingPending > 0) {
        return s;
      }
    }

    if (this.esModoHonorarios()) {
      return null;
    }

    return this.form.invalid ? 0 : null;
  }

  private mostrarPasoAsistenteInvalido(step: number): void {
    this.presentacion.marcarPasoAsistenteIntentado(step);
    this.pasoWizardActivo.set(step);
    this.intentarTodasPestanas();
    this.marcarPasoAsistenteTocado(step);
    this.enfocarPrimerControlEnPaso(step, { soloBloqueantes: true });
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
      this.modalOrquestador.abrirModalExitoBasico(created.id);
    } catch (error) {
      if (error instanceof EmpleadoRutDuplicadoError) {
        this.modalOrquestador.abrirModalRutDuplicadoBasico(error.rut);
      } else {
        this.modalOrquestador.abrirModalErrorBasico(
          this,
          this.resolverMensajeErrorGuardado(error),
        );
      }
    } finally {
      this.guardando.set(false);
    }
  }

  private evaluateValidationRules(): ReglaValidacionEvaluada[] {
    return mapDiagnosticoItemsToEvaluatedRules(
      evaluarDiagnosticoFichaEmpleado(this.buildFichaValidacionSnapshot()),
    );
  }

  private buildFichaValidacionSnapshot(): EmpleadoFichaValidacionSnapshot {
    const edadResumen = this.perfilLaboralEdadResumen();
    return construirSnapshotValidacionFicha({
      form: this.form,
      catalogos: this.catalogos(),
      esModoBasico: this.esModoBasico(),
      esModoAvanzado: this.esModoAvanzado(),
      esModoHonorarios: this.esModoHonorarios(),
      pasoWizardActivo: this.pasoWizardActivo(),
      perfilLaboralMenorEdad: edadResumen.kind === "menor",
      tieneCondicionesEspeciales: this.hasPerfilLaboralCondicionesSeleccionadas(),
      observacionCondicionesValida:
        this.form.controls.perfilLaboral.controls.observacion.valid,
    });
  }

  confirmarCambioHonorariosDesdeModal(): void {
    this.previousRelacionLaboral = "HONORARIOS";
  }

  aplicarAccionCoherencia(
    accion: AccionCoherenciaAlta | undefined,
    valor: boolean | number | undefined,
  ): void {
    const contrato = this.form.controls.contrato.controls;
    const perfil = this.form.controls.perfilLaboral.controls;

    switch (accion) {
      case "activarSeguroCesantia":
      case "desactivarSeguroCesantia":
        contrato.seguroCesantia.setValue(Boolean(valor));
        contrato.seguroCesantia.markAsDirty();
        contrato.seguroCesantia.markAsTouched();
        break;
      case "ajustarHorasSemanales":
        contrato.horasSemanales.setValue(
          typeof valor === "number" ? valor : null,
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
      return "Finalizable";
    }

    return "Alta coherente";
  }

  diagnosticoContractualDescripcion(): string {
    const bloqueos = this.altaAplicabilidadState().resumen.blocked;
    const revisiones = this.inconsistenciasCoherencia().length;

    if (this.esModoHonorarios()) {
      return "Modalidad honorarios: completa servicio, monto y pago.";
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
    return sortReglasValidacion(
      this.evaluateValidationRules().filter(
        (item) =>
          item.visible && item.wizardStep === wizardStep && !item.complete,
      ),
    );
  }

  obtenerPendientesValidacionFinalizacion(): ReglaValidacionEvaluada[] {
    return sortReglasValidacion(
      this.evaluateValidationRules().filter(
        (item) =>
          item.visible &&
          !item.complete &&
          this.reglaValidacionCuentaEnFlujoAltaAvanzada(item),
      ),
    );
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
          this.relacionLaboralRevertirHonorarios = this.previousRelacionLaboral;
          this.confirmarModoHonorarios({ lockPrevious: false });
          this.modalOrquestador.abrirModalConfirmarHonorarios();
          return;
        }

        this.previousRelacionLaboral = value;
      });
  }

  private confirmarModoHonorarios(options?: { lockPrevious?: boolean }): void {
    this.aplicarEstadoVisualHonorarios();
    this.empleadosFormService.sincronizarValidadoresPorRelacionLaboral(
      this.form,
      this.catalogos(),
    );
    this.moverFlujoHonorariosAPasoAplicable();
    this.sincronizarPestanasCompletadasDesdeValidez();
    if (options?.lockPrevious !== false) {
      this.previousRelacionLaboral = "HONORARIOS";
    }
  }

  cancelarCambioModoHonorarios(): void {
    this.suppressRelacionLaboralModal = true;
    this.form.controls.contrato.controls.relacionLaboral.setValue(
      this.relacionLaboralRevertirHonorarios,
      {
        emitEvent: true,
      },
    );
    this.previousRelacionLaboral = this.relacionLaboralRevertirHonorarios;
    this.suppressRelacionLaboralModal = false;
    this.sincronizarControlesNoAplicablesHonorarios(false);
    this.empleadosFormService.sincronizarValidadoresPorRelacionLaboral(
      this.form,
      this.catalogos(),
    );
    this.sincronizarPestanasCompletadasDesdeValidez();
  }

  private sincronizarControlesNoAplicablesHonorarios(
    deshabilitarDependiente: boolean,
  ): void {
    const opts = { emitEvent: false } as const;
    const contrato = this.form.controls.contrato.controls;
    const contratoNa: AbstractControl[] = [
      contrato.tipoContrato,
      contrato.fechaContrato,
      contrato.fechaTermino,
      contrato.idTipoJornada,
      contrato.horasSemanales,
      contrato.diasSemanales,
      contrato.distribucionJornada,
      contrato.tiempoColacionMinutos,
      contrato.tipoGratificacion,
      contrato.cargas,
      contrato.idTramoCarga,
      contrato.casaParticularModalidad,
      contrato.casaParticularLabores,
      contrato.casaParticularDomicilioEspecifico,
      contrato.casaParticularAsistenciaCuidado,
      contrato.casaParticularRegistroDtEstado,
      contrato.casaParticularRegistroDtFecha,
      contrato.casaParticularRegistroDtFolio,
      contrato.semanaCorridaActiva,
      contrato.semanaCorridaDiasLaborables,
      contrato.zonaExtremaActiva,
      contrato.zonaExtremaTerritorio,
      contrato.zonaExtremaPorcentaje,
    ];

    for (const control of contratoNa) {
      if (deshabilitarDependiente) {
        control.disable(opts);
      } else {
        control.enable(opts);
      }
    }

    const gruposNa = [
      this.form.controls.previsionSalud,
      this.form.controls.perfilLaboral,
    ];
    for (const grupo of gruposNa) {
      if (deshabilitarDependiente) {
        grupo.disable(opts);
      } else {
        grupo.enable(opts);
      }
    }

    this.form.updateValueAndValidity(opts);
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

    prevision.tipoRegimenPrevisional.setValue("NINGUNA", { emitEvent: false });
    prevision.tieneApv.setValue(false, { emitEvent: false });

    this.sincronizarControlesNoAplicablesHonorarios(true);
  }

  private moverFlujoHonorariosAPasoAplicable(): void {
    if ([4, 5, 6].includes(this.pasoWizardActivo())) {
      this.presentacion.seleccionarPasoAsistente(7);
      this.desplazarAInicioPasoActual({ focusFirstField: true });
    }
  }

  cerrarModalYEnfocarPrimerPendiente(
    modal: ModalAccionAvanzada | null,
    pasoFallback: number,
  ): void {
    this.modalAccionAvanzada.set(null);
    const first = modal?.fieldItems?.[0];
    this.enfocarPrimerItemModalAvanzada(first, () => {
      this.mostrarPasoAsistenteInvalido(
        first?.wizardStep ?? modal?.targetStep ?? pasoFallback,
      );
    });
  }

  enfocarPrimerItemModalAvanzada(
    item: ItemCampoModalAccionAvanzada | undefined,
    fallback: () => void,
  ): void {
    if (!item?.controlPath) {
      fallback();
      return;
    }

    this.presentacion.marcarPasoAsistenteIntentado(item.wizardStep);
    this.intentarTodasPestanas();
    this.marcarPasoAsistenteTocado(item.wizardStep);
    this.navegarPasoAsistente(item.wizardStep, { focusFirstField: false });
    this.enfocarRutaControl(item.controlPath);
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

  private enfocarPrimerControlEnPaso(
    wizardStep: number = this.pasoWizardActivo(),
    options?: { soloBloqueantes?: boolean },
  ): void {
    window.setTimeout(() => {
      const host = this.hostElement.nativeElement;
      const sorted = [...this.evaluateValidationRules()].sort(
        (a, b) => pesoOrdenValidacion(a) - pesoOrdenValidacion(b),
      );
      const firstPendingRule = sorted.find(
        (item) =>
          item.visible &&
          item.wizardStep === wizardStep &&
          !item.complete &&
          (!options?.soloBloqueantes || item.blocking),
      );
      const control =
        (firstPendingRule
          ? buscarControlPorRuta(host, firstPendingRule.sourcePath)
          : null) ?? buscarPrimerControlNgInvalido(host);

      if (!control) {
        return;
      }

      enfocarElemento(control);
    });
  }

  private enfocarRutaControl(controlPath: string): void {
    enfocarRutaControlDom(
      this.injector,
      this.hostElement.nativeElement,
      controlPath,
      {
        onFallback: () =>
          this.desplazarAInicioPasoActual({ focusFirstField: true }),
      },
    );
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

  sincronizarPestanasCompletadasDesdeValidez(): void {
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

  marcarTodasPestanasValidasComoCompletadas(): void {
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

