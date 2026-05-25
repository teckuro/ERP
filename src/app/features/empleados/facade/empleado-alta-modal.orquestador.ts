import { Injectable, inject } from '@angular/core';

import type { BorradorValidacionIssue } from '../utils/empleado-alta-modal.presenter';
import {
  buildFieldItemsFromBorradorIssues,
  buildFieldItemsFromRules,
  buildModalSectionsBitacora,
  buildNextStepBlockingModalContent,
  buildPendientePrincipalDesdeFieldItems,
  ETIQUETA_ACCION_REVISAR_PRIMER_PENDIENTE,
} from '../utils/empleado-alta-modal.presenter';
import type {
  AccionCoherenciaAlta,
  InconsistenciaCoherenciaAlta,
} from '../rules/empleado-alta-coherencia.rules';
import type {
  AccionModalAccionAvanzada,
  ModalAccionAvanzada,
  ReglaValidacionEvaluada,
} from '../models/empleado-alta-avanzada.vm';
import { EmpleadoAltaAvanzadaPresentacionFacade } from './empleado-alta-avanzada-presentacion.facade';

/** Delegación de navegación, formulario y foco desde `FormEmpleadoComponent`. */
export interface DelegadoModalAltaEmpleado {
  pasoWizardActivo(): number;
  buscarPrimerPasoAsistenteConBloqueos(): number | null;
  etiquetaCortaPasoAsistente(indicePaso: number): string;
  esModoHonorarios(): boolean;
  cerrarModalYEnfocarPrimerPendiente(
    modal: ModalAccionAvanzada | null,
    pasoFallback: number,
  ): void;
  avanzarPasoSiguienteAsistente(): void;
  enviarModoAvanzado(): Promise<void>;
  seleccionarPasoAsistente(indicePaso: number): void;
  sincronizarPestanasCompletadasDesdeValidez(): void;
  marcarTodasPestanasValidasComoCompletadas(): void;
  obtenerPendientesValidacionFinalizacion(): readonly ReglaValidacionEvaluada[];
  aplicarAccionCoherencia(
    accion: AccionCoherenciaAlta | undefined,
    valor: boolean | number | undefined,
  ): void;
  confirmarCambioHonorariosDesdeModal(): void;
  cancelarCambioModoHonorarios(): void;
  irAListadoEmpleados(): void;
  pasoSugeridoError(mensaje: string): string | null;
  mensajeErrorNormalizado(mensaje: string): string;
  accionRecomendadaError(mensaje: string): string;
}

@Injectable()
export class EmpleadoAltaModalOrquestador {
  private readonly presentacion = inject(EmpleadoAltaAvanzadaPresentacionFacade);

  abrirModalAccionAvanzada(modal: ModalAccionAvanzada): void {
    this.presentacion.mensajeError.set(null);
    this.presentacion.rutModalRutDuplicado.set(null);
    this.presentacion.mensajeExito.set(null);
    this.presentacion.modalAccionAvanzada.set(modal);
  }

  abrirModalEsperaCatalogosBorrador(): void {
    this.abrirModalAccionAvanzada({
      kind: 'draft-catalog-wait',
      variant: 'warning',
      eyebrow: 'Revisión administrativa',
      title: 'Espera a que cargue el formulario',
      message:
        'La información base aún se está preparando. Intenta guardar el borrador en unos segundos.',
      sections: buildModalSectionsBitacora({
        pendientePrincipal:
          'Esperar a que terminen de cargar catálogos y datos base del formulario.',
        porQueImporta:
          'Sin catálogos no se puede registrar un borrador trazable en la bitácora.',
        accionRecomendada: 'Reintentar guardar el borrador cuando el formulario esté listo.',
        pendienteTone: 'info',
      }),
      primaryLabel: 'Aceptar',
      blockingItems: [],
      warningItems: [],
      infoItems: [],
      primaryAction: 'dismiss',
    });
  }

  abrirModalExitoBasico(idEmpleado: number): void {
    this.presentacion.flujoExito.set('basico');
    this.presentacion.idEmpleadoCreado.set(idEmpleado);
    this.abrirModalAccionAvanzada({
      kind: 'basic-success',
      variant: 'success',
      eyebrow: 'Registro actualizado',
      title: 'Empleado registrado correctamente',
      message:
        'La ficha quedó en estado «En proceso». Puedes completar contrato, previsión y banco desde la ficha del empleado.',
      sections: buildModalSectionsBitacora({
        pendientePrincipal:
          'La creación básica quedó registrada con los datos personales y de contacto ingresados.',
        detailItems: [`Ficha N° ${idEmpleado}`],
        porQueImporta:
          'El alta parcial queda trazable; hasta completar contrato y previsión la ficha no está lista para liquidar.',
        accionRecomendada:
          'Ir al listado para continuar con otras fichas o abrir la ficha del empleado para completar datos laborales.',
        pendienteTone: 'success',
      }),
      primaryLabel: 'Ir al listado',
      blockingItems: [],
      warningItems: [],
      infoItems: [],
      primaryAction: 'go-to-list',
    });
  }

  abrirModalErrorBasico(delegado: DelegadoModalAltaEmpleado, mensaje: string): void {
    const pasoSugerido = delegado.pasoSugeridoError(mensaje);
    this.abrirModalAccionAvanzada({
      kind: 'basic-error',
      variant: 'danger',
      eyebrow: 'Error de guardado',
      title: 'No fue posible registrar la ficha',
      message:
        'El registro no se completó. Revisa el detalle y vuelve a intentarlo.',
      sections: buildModalSectionsBitacora({
        pendientePrincipal: delegado.mensajeErrorNormalizado(mensaje),
        detailItems: pasoSugerido ? [`Revisar: ${pasoSugerido}`] : undefined,
        porQueImporta:
          'Sin corregir el problema no se puede dejar la ficha registrada en el sistema.',
        accionRecomendada: delegado.accionRecomendadaError(mensaje),
      }),
      primaryLabel: 'Cerrar',
      blockingItems: [],
      warningItems: [],
      infoItems: [],
      primaryAction: 'dismiss',
    });
  }

  abrirModalRutDuplicadoBasico(rut: string): void {
    this.abrirModalAccionAvanzada({
      kind: 'basic-duplicate-rut',
      variant: 'danger',
      eyebrow: 'Revisión administrativa',
      title: 'Ficha ya registrada',
      message: `Ya existe un empleado registrado con el RUT ${rut}.`,
      sections: buildModalSectionsBitacora({
        pendientePrincipal:
          'No se puede crear una nueva ficha con un RUT ya registrado en el sistema.',
        detailItems: [`RUT ${rut}`],
        porQueImporta:
          'Evita duplicar la identificación del trabajador y mantiene coherencia en nómina y remuneraciones.',
        accionRecomendada:
          'Revisar el listado de empleados o editar la ficha existente antes de intentar de nuevo.',
      }),
      primaryLabel: 'Cerrar',
      blockingItems: [],
      warningItems: [],
      infoItems: [],
      primaryAction: 'dismiss',
    });
  }

  abrirModalEsperaCatalogosBasico(): void {
    this.abrirModalAccionAvanzada({
      kind: 'basic-catalog-wait',
      variant: 'warning',
      eyebrow: 'Revisión administrativa',
      title: 'Formulario en preparación',
      message:
        'Los catálogos y datos base aún se están cargando. Espera unos segundos e intenta guardar de nuevo.',
      sections: buildModalSectionsBitacora({
        pendientePrincipal:
          'Esperar a que termine la carga de catálogos antes de registrar la ficha.',
        porQueImporta:
          'Sin catálogos no se puede validar ni guardar datos personales de forma trazable.',
        accionRecomendada:
          'Reintentar el guardado cuando el formulario muestre los datos listos.',
        pendienteTone: 'info',
      }),
      primaryLabel: 'Cerrar',
      blockingItems: [],
      warningItems: [],
      infoItems: [],
      primaryAction: 'dismiss',
    });
  }

  abrirModalDecisionCoherencia(
    inconsistencia: InconsistenciaCoherenciaAlta,
    contexto: 'next' | 'finish',
  ): void {
    this.presentacion.decisionCoherenciaPendiente.set({
      issue: inconsistencia,
      context: contexto,
    });
    this.abrirModalAccionAvanzada({
      kind: 'coherence-decision',
      variant: 'warning',
      eyebrow: 'Revisión administrativa',
      title: inconsistencia.title,
      message:
        contexto === 'finish'
          ? 'Antes de finalizar conviene decidir esta combinación en la bitácora.'
          : 'Antes de seguir conviene decidir esta combinación en la bitácora.',
      sections: buildModalSectionsBitacora({
        pendientePrincipal: inconsistencia.detail,
        porQueImporta:
          'La decisión queda visible en la bitácora y en el resumen hasta que la cierres o apliques la corrección.',
        accionRecomendada:
          contexto === 'finish'
            ? 'Aplicar la corrección sugerida o mantener bajo revisión y revisar el resumen antes de finalizar.'
            : 'Aplicar la corrección sugerida o mantener bajo revisión y continuar el recorrido.',
      }),
      primaryLabel:
        inconsistencia.recommendedActionLabel ?? 'Aplicar corrección sugerida',
      secondaryLabel:
        contexto === 'finish' ? 'Mantener y finalizar' : 'Mantener y continuar',
      blockingItems: [],
      warningItems: [],
      infoItems: [],
      targetStep: inconsistencia.stepIndex,
      primaryAction: 'apply-coherence-suggestion',
      secondaryAction: 'keep-coherence-review',
    });
  }

  abrirModalRevisionPasoSiguiente(
    delegado: DelegadoModalAltaEmpleado,
    indicePaso: number,
    pendientes: readonly ReglaValidacionEvaluada[],
  ): void {
    const bloqueantes = pendientes.filter(
      (item) => item.blocking && item.severity === 'error',
    );
    const etiqueta = delegado.etiquetaCortaPasoAsistente(indicePaso);
    const hayBloqueantes = bloqueantes.length > 0;
    const soloNormativa =
      !hayBloqueantes &&
      pendientes.length > 0 &&
      pendientes.every((item) => item.id.startsWith('aplicabilidad.'));
    const origenCampos = hayBloqueantes ? bloqueantes : pendientes;
    const fieldItems = buildFieldItemsFromRules(origenCampos, {
      shortStepLabelFor: (wizardStep) =>
        delegado.etiquetaCortaPasoAsistente(wizardStep),
    });

    if (hayBloqueantes) {
      const contenido = buildNextStepBlockingModalContent(etiqueta, fieldItems);
      this.abrirModalAccionAvanzada({
        kind: 'next-step-review',
        variant: 'warning',
        title: contenido.title,
        message: contenido.message,
        sections: contenido.sections,
        primaryLabel: ETIQUETA_ACCION_REVISAR_PRIMER_PENDIENTE,
        secondaryLabel: 'Continuar con pendiente',
        blockingItems: [],
        warningItems: [],
        infoItems: [],
        fieldItems,
        targetStep: fieldItems[0]?.wizardStep ?? indicePaso,
        primaryAction: 'focus-current-step',
        secondaryAction: 'continue-next',
      });
      return;
    }

    const principal = soloNormativa
      ? `Revisar la revisión normativa del registro «${etiqueta}».`
      : `Revisar las advertencias administrativas del registro «${etiqueta}».`;

    this.abrirModalAccionAvanzada({
      kind: 'next-step-review',
      variant: 'info',
      eyebrow: 'Revisión administrativa',
      title: soloNormativa
        ? 'Revisión normativa en este registro'
        : 'Advertencias de revisión',
      message: `El registro «${etiqueta}» tiene revisiones que no bloquean el avance, pero conviene dejarlas claras.`,
      sections: buildModalSectionsBitacora({
        pendientePrincipal: principal,
        porQueImporta:
          'Cada pendiente queda trazado en la bitácora laboral hasta que lo cierres o decidas continuar con revisión pendiente.',
        accionRecomendada:
          'Aclarar las revisiones ahora o continuar. El resumen final mantendrá lo pendiente.',
        pendienteTone: 'info',
      }),
      primaryLabel: 'Continuar',
      secondaryLabel: 'Corregir ahora',
      blockingItems: [],
      warningItems: [],
      infoItems: [],
      fieldItems,
      targetStep: fieldItems[0]?.wizardStep ?? indicePaso,
      primaryAction: 'continue-next',
      secondaryAction: 'focus-current-step',
    });
  }

  abrirModalBorradorInvalido(issues: readonly BorradorValidacionIssue[]): void {
    const fieldItems = buildFieldItemsFromBorradorIssues(issues);
    const primero = fieldItems[0];
    const principal =
      primero?.detail ?? 'Completar los datos mínimos antes de guardar el borrador.';

    this.abrirModalAccionAvanzada({
      kind: 'draft-invalid',
      variant: 'warning',
      eyebrow: 'Revisión administrativa',
      title: 'No se puede guardar el borrador',
      message: principal,
      sections: buildModalSectionsBitacora({
        pendientePrincipal: principal,
        porQueImporta:
          'El borrador necesita identificación y contacto mínimos para quedar trazable en la bitácora laboral.',
        accionRecomendada:
          'Ir al primer campo pendiente, completar la información mínima y volver a guardar.',
      }),
      primaryLabel: ETIQUETA_ACCION_REVISAR_PRIMER_PENDIENTE,
      secondaryLabel: 'Cerrar',
      blockingItems: [],
      warningItems: [],
      infoItems: [],
      fieldItems,
      targetStep: primero?.wizardStep ?? 0,
      primaryAction: 'focus-draft-minimum',
      secondaryAction: 'dismiss',
    });
  }

  abrirModalBorradorExito(esBorradorNuevo: boolean): void {
    this.abrirModalAccionAvanzada({
      kind: 'draft-success',
      variant: 'success',
      eyebrow: 'Registro actualizado',
      title: esBorradorNuevo ? 'Borrador guardado' : 'Borrador actualizado',
      message:
        'La ficha quedó guardada. Puedes seguir completando la bitácora ahora o retomarla más tarde.',
      sections: buildModalSectionsBitacora({
        pendientePrincipal: esBorradorNuevo
          ? 'El borrador quedó registrado con los datos mínimos ingresados hasta ahora.'
          : 'Los cambios del borrador quedaron actualizados en la bitácora laboral.',
        porQueImporta:
          'El avance parcial queda trazable para retomar la creación avanzada sin perder lo ya registrado.',
        accionRecomendada:
          'Continuar completando los registros de la bitácora o volver al listado de empleados.',
        pendienteTone: 'success',
      }),
      primaryLabel: 'Aceptar',
      blockingItems: [],
      warningItems: [],
      infoItems: [],
      primaryAction: 'dismiss',
    });
  }

  abrirModalFinalizarInvalido(
    delegado: DelegadoModalAltaEmpleado,
    primerPasoConError: number,
  ): void {
    const pendientes = delegado.obtenerPendientesValidacionFinalizacion();
    const bloqueantes = pendientes.filter(
      (item) => item.blocking && item.severity === 'error',
    );
    const fieldItems = buildFieldItemsFromRules(bloqueantes, {
      shortStepLabelFor: (wizardStep) =>
        delegado.etiquetaCortaPasoAsistente(wizardStep),
    });
    const pasoDestino = fieldItems[0]?.wizardStep ?? primerPasoConError;

    this.abrirModalAccionAvanzada({
      kind: 'finish-invalid',
      variant: 'error',
      eyebrow: 'Revisión administrativa',
      title: 'La ficha no está lista para finalizar',
      message:
        'Aún hay registros de la bitácora con datos obligatorios pendientes. Ciérralos antes de finalizar el alta.',
      sections: buildModalSectionsBitacora({
        pendientePrincipal: buildPendientePrincipalDesdeFieldItems(fieldItems),
        porQueImporta:
          'Sin esos datos la ficha no puede quedar lista para remuneraciones ni cerrarse en la bitácora.',
        accionRecomendada:
          'Ir al primer registro con bloqueo, completar lo pendiente o guardar borrador y retomar después.',
      }),
      primaryLabel: ETIQUETA_ACCION_REVISAR_PRIMER_PENDIENTE,
      secondaryLabel: 'Cerrar',
      blockingItems: [],
      warningItems: [],
      infoItems: [],
      fieldItems,
      targetStep: pasoDestino,
      primaryAction: 'focus-first-blocking',
      secondaryAction: 'dismiss',
    });
  }

  abrirModalConfirmarFinalizar(delegado: DelegadoModalAltaEmpleado): void {
    if (delegado.esModoHonorarios()) {
      this.abrirModalAccionAvanzada({
        kind: 'finish-confirm',
        variant: 'success',
        eyebrow: 'Decisión requerida',
        title: 'Finalizar boleta de honorarios',
        message:
          'La bitácora del prestador está lista para cerrar. Revisa servicio, monto y datos de pago antes de confirmar.',
        sections: buildModalSectionsBitacora({
          pendientePrincipal:
            'Confirmar el cierre del registro a honorarios con la bitácora en estado listo.',
          porQueImporta:
            'Al finalizar, la ficha queda activa para administración del prestador. No ingresa a nómina dependiente.',
          accionRecomendada:
            'Finalizar honorarios si los datos son correctos, o cancelar para revisar algún registro de la bitácora.',
          pendienteTone: 'success',
        }),
        primaryLabel: 'Finalizar honorarios',
        secondaryLabel: 'Cancelar',
        blockingItems: [],
        warningItems: [],
        infoItems: [],
        primaryAction: 'execute-finish',
        secondaryAction: 'dismiss',
      });
      return;
    }

    this.abrirModalAccionAvanzada({
      kind: 'finish-confirm',
      variant: 'success',
      eyebrow: 'Decisión requerida',
      title: 'Finalizar alta del trabajador',
      message:
        'La bitácora laboral está lista para cerrar el alta. Revisa que la información sea correcta antes de confirmar.',
      sections: buildModalSectionsBitacora({
        pendientePrincipal:
          'Confirmar el cierre del alta con los registros de la bitácora en estado listo.',
        porQueImporta:
          'Al finalizar, la ficha queda habilitada para procesos administrativos y de remuneraciones.',
        accionRecomendada:
          'Finalizar el alta si los datos son correctos, o cancelar para revisar algún registro de la bitácora.',
        pendienteTone: 'success',
      }),
      primaryLabel: 'Finalizar alta',
      secondaryLabel: 'Cancelar',
      blockingItems: [],
      warningItems: [],
      infoItems: [],
      primaryAction: 'execute-finish',
      secondaryAction: 'dismiss',
    });
  }

  abrirModalConfirmarHonorarios(): void {
    this.abrirModalAccionAvanzada({
      kind: 'honorarios-confirm',
      variant: 'warning',
      eyebrow: 'Decisión requerida',
      title: 'Cambiar a boleta de honorarios',
      message:
        'El registro pasará a prestador de servicios. Los pasos laborales dependientes quedarán como no aplicables en la bitácora.',
      sections: buildModalSectionsBitacora({
        pendientePrincipal:
          'Confirmar el cambio a boleta de honorarios y ocultar datos de relación laboral dependiente.',
        detailItems: [
          'Jornada, gratificación, previsión, salud, APVI y asignaciones laborales: no aplicables.',
          'Este registro no participa en nómina dependiente.',
        ],
        porQueImporta:
          'La bitácora debe reflejar la modalidad correcta para no solicitar datos que no corresponden al prestador.',
        accionRecomendada:
          'Confirmar el cambio si la modalidad es correcta, o cancelar y mantener relación laboral dependiente.',
      }),
      primaryLabel: 'Confirmar cambio',
      secondaryLabel: 'Cancelar',
      blockingItems: [],
      warningItems: [],
      infoItems: [],
      primaryAction: 'confirm-honorarios',
      secondaryAction: 'cancel-honorarios',
      disableClose: true,
    });
  }

  manejarAccion(
    delegado: DelegadoModalAltaEmpleado,
    accion: AccionModalAccionAvanzada,
  ): void {
    const modal = this.presentacion.modalAccionAvanzada();

    switch (accion) {
      case 'apply-coherence-suggestion':
        this.aplicarSugerenciaCoherenciaPendiente(delegado);
        break;
      case 'keep-coherence-review':
        this.mantenerRevisionCoherenciaPendiente(delegado);
        break;
      case 'continue-next':
        this.presentacion.modalAccionAvanzada.set(null);
        delegado.avanzarPasoSiguienteAsistente();
        break;
      case 'focus-current-step':
        delegado.cerrarModalYEnfocarPrimerPendiente(modal, delegado.pasoWizardActivo());
        break;
      case 'focus-draft-minimum':
        delegado.cerrarModalYEnfocarPrimerPendiente(modal, 0);
        break;
      case 'focus-first-blocking':
        delegado.cerrarModalYEnfocarPrimerPendiente(
          modal,
          modal?.targetStep ??
            delegado.buscarPrimerPasoAsistenteConBloqueos() ??
            0,
        );
        break;
      case 'execute-finish':
        this.presentacion.modalAccionAvanzada.set(null);
        void delegado.enviarModoAvanzado();
        break;
      case 'confirm-honorarios':
        delegado.confirmarCambioHonorariosDesdeModal();
        this.presentacion.modalAccionAvanzada.set(null);
        break;
      case 'cancel-honorarios':
        this.presentacion.modalAccionAvanzada.set(null);
        delegado.cancelarCambioModoHonorarios();
        break;
      case 'go-to-list':
        this.presentacion.modalAccionAvanzada.set(null);
        delegado.irAListadoEmpleados();
        break;
      case 'dismiss':
      default:
        this.presentacion.modalAccionAvanzada.set(null);
        break;
    }
  }

  private aplicarSugerenciaCoherenciaPendiente(
    delegado: DelegadoModalAltaEmpleado,
  ): void {
    const pendiente = this.presentacion.decisionCoherenciaPendiente();
    if (!pendiente) {
      this.presentacion.modalAccionAvanzada.set(null);
      return;
    }

    delegado.aplicarAccionCoherencia(
      pendiente.issue.action,
      pendiente.issue.actionValue,
    );
    this.presentacion.decisionCoherenciaPendiente.set(null);
    this.presentacion.modalAccionAvanzada.set(null);
    this.presentacion.idsInconsistenciasCoherenciaReconocidas.update((prev) => {
      const next = new Set(prev);
      next.delete(pendiente.issue.id);
      return next;
    });
    delegado.sincronizarPestanasCompletadasDesdeValidez();
    delegado.seleccionarPasoAsistente(pendiente.issue.stepIndex);
  }

  private mantenerRevisionCoherenciaPendiente(
    delegado: DelegadoModalAltaEmpleado,
  ): void {
    const pendiente = this.presentacion.decisionCoherenciaPendiente();
    if (!pendiente) {
      this.presentacion.modalAccionAvanzada.set(null);
      return;
    }

    this.presentacion.idsInconsistenciasCoherenciaReconocidas.update(
      (prev) => new Set([...prev, pendiente.issue.id]),
    );
    this.presentacion.decisionCoherenciaPendiente.set(null);
    this.presentacion.modalAccionAvanzada.set(null);
    delegado.sincronizarPestanasCompletadasDesdeValidez();

    if (pendiente.context === 'finish') {
      delegado.marcarTodasPestanasValidasComoCompletadas();
      this.abrirModalConfirmarFinalizar(delegado);
      return;
    }

    delegado.avanzarPasoSiguienteAsistente();
  }
}
