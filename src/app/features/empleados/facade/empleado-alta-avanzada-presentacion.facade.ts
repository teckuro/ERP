import { Injectable, signal } from '@angular/core';

import { EMPTY_EMPLEADO_FORM_CATALOGOS, type EmpleadoFormCatalogos } from '../models/empleado-catalogos.model';
import type { InconsistenciaCoherenciaAlta } from '../rules/empleado-alta-coherencia.rules';
import type {
  ModalAccionAvanzada,
  FormEmpleadoModo,
  DeteccionAutomaticaPerfilLaboral,
  IdPestana,
} from '../models/empleado-alta-avanzada.vm';

@Injectable()
export class EmpleadoAltaAvanzadaPresentacionFacade {
  readonly modo = signal<FormEmpleadoModo>('basico');
  readonly pasoWizardActivo = signal(0);
  readonly guardando = signal(false);
  readonly intentoGuardado = signal(false);
  readonly mensajeError = signal<string | null>(null);
  readonly rutModalRutDuplicado = signal<string | null>(null);
  readonly mensajeExito = signal<string | null>(null);
  readonly flujoExito = signal<FormEmpleadoModo | null>(null);
  readonly idEmpleadoCreado = signal<number | null>(null);
  readonly borradorPersonaId = signal<number | null>(null);
  readonly guardandoBorrador = signal(false);
  readonly retroalimentacionBorrador = signal<string | null>(null);
  readonly modalAccionAvanzada = signal<ModalAccionAvanzada | null>(null);
  readonly catalogos = signal<EmpleadoFormCatalogos>(EMPTY_EMPLEADO_FORM_CATALOGOS);
  readonly deteccionesAutomaticasPerfilLaboral = signal<readonly DeteccionAutomaticaPerfilLaboral[]>([]);
  readonly decisionCoherenciaPendiente = signal<{
    issue: InconsistenciaCoherenciaAlta;
    context: 'next' | 'finish';
  } | null>(null);
  readonly idsInconsistenciasCoherenciaReconocidas = signal<ReadonlySet<string>>(new Set());
  readonly consolaExpandRequest = signal(0);
  readonly cargandoCatalogos = signal(true);
  readonly catalogosError = signal<string | null>(null);
  readonly pestanasCompletadas = signal<ReadonlySet<IdPestana>>(new Set());
  readonly pestanasIntentadas = signal<ReadonlySet<IdPestana>>(new Set());
  readonly pasosAsistenteVisitados = signal<ReadonlySet<number>>(new Set([0]));
  readonly pasosAsistenteIntentados = signal<ReadonlySet<number>>(new Set());

  setModo(modo: FormEmpleadoModo): void {
    this.modo.set(modo);
  }

  seleccionarPasoAsistente(step: number): void {
    this.pasoWizardActivo.set(step);
    this.marcarPasoAsistenteVisitado(step);
  }

  marcarPasoAsistenteVisitado(step: number): void {
    this.pasosAsistenteVisitados.update((prev) => new Set([...prev, step]));
  }

  marcarPasoAsistenteIntentado(step: number): void {
    this.marcarPasoAsistenteVisitado(step);
    this.pasosAsistenteIntentados.update((prev) => new Set([...prev, step]));
  }
}
