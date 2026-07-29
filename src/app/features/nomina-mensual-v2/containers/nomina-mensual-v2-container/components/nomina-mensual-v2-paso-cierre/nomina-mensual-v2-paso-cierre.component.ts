/**
 * Paso Cierre — F3 fusion (F3e-6) + F12/F14/F15/F16.
 *
 * Checklist operativa: parámetros, dotación, movimientos, cálculo, validación,
 * aprobación, conciliación (mensual), liquidaciones y cierre transaccional.
 */

import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { MessageBoxComponent } from '../../../../../../shared/components/ui/message-box.component';
import { WorkspaceLoadingComponent } from '../../../../../../shared/components/ui/feedback/workspace-loading/workspace-loading.component';

import type {
  IncidenciaNomina,
  NominaPeriodo,
  ResumenValidacionNomina,
} from '../../../../../nomina-mensual/models/nomina-periodo.models';
import type {
  NominaConsolidacion,
  NominaLiquidacionResumen,
} from '../../../../../nomina-mensual/models/nomina-consolidacion.models';
import { NominaPeriodoService } from '../../../../../nomina-mensual/services/nomina-periodo.service';
import { NominaMensualCapabilitiesService } from '../../../../../nomina-mensual/services/nomina-mensual-capabilities.service';
import { estadoNominaToLabel } from '../../../../../nomina-mensual/presenters/admin-nominas.presenter';
import {
  advertenciaPendiente,
  etiquetaEstadoDecisionIncidencia,
  incidenciaCriticaPendiente,
} from '../../../../../nomina-mensual/rules/nomina-validacion-incidencias.rules';
import type {
  PasoNominaPort,
  ResultadoAvancePaso,
} from '../../facade/nomina-mensual-v2-navegacion';
import {
  MENSAJE_CALCULO_NO_VIGENTE,
  RAZON_CIERRE_MODAL_PENDIENTE,
  esCalculoNoVigente,
} from '../../facade/nomina-mensual-v2-navegacion';
import type { NominaCabeceraCambiadaEvent } from '../../../../models/nomina-cabecera-cambiada.models';
import {
  formatearFechaLiquidacion,
  liquidacionReferenciaCobertura,
  liquidacionVigente,
  prepararFilasLiquidacionesInternas,
} from '../../../../../nomina-mensual/presenters/nomina-liquidaciones-internas.presenter';
import {
  calcularTrabajadoresSinLiquidacion,
  esLiquidacionesSoloLectura,
  puedeRegenerarLiquidacionesInternas,
} from '../../../../../nomina-mensual/rules/nomina-liquidaciones-internas-ui.rules';

interface ChecklistItem {
  id: string;
  label: string;
  cumplido: boolean;
  detalle: string;
}

type TonoFranjaCierre = 'listo' | 'pendiente' | 'bloqueo' | 'cerrada' | 'warning';

type TipoAccionRecomendadaCierre =
  | 'aprobar'
  | 'liquidaciones'
  | 'conciliacion'
  | 'cierre_shell'
  | 'reabrir'
  | 'recalcular'
  | 'resolver_incidencias'
  | 'espera'
  | 'ninguna';

type FiltroSeveridadIncidencia = 'todas' | 'critica' | 'advertencia';

interface VistaAccionRecomendadaCierre {
  kicker: string;
  titulo: string;
  detalle: string;
  tono: TonoFranjaCierre;
  tipo: TipoAccionRecomendadaCierre;
  ejecutable: boolean;
}

const ETIQUETAS_TIPO_INCIDENCIA: Record<string, string> = {
  datos_incompletos: 'Datos incompletos',
  prevision: 'Previsión',
  bancario: 'Datos bancarios',
  movimiento: 'Movimiento',
  calculo: 'Cálculo',
  dotacion: 'Dotación',
  'dotacion-vacia': 'Dotación',
  'trabajador-duplicado-en-segmentos': 'Dotación',
};

function etiquetaTipoIncidencia(tipo: string): string {
  return ETIQUETAS_TIPO_INCIDENCIA[tipo] ?? 'Revisión requerida';
}

@Component({
  selector: 'app-nomina-mensual-v2-paso-cierre',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, MessageBoxComponent, WorkspaceLoadingComponent],
  templateUrl: './nomina-mensual-v2-paso-cierre.component.html',
  styleUrl: './nomina-mensual-v2-paso-cierre.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NominaMensualV2PasoCierreComponent implements PasoNominaPort {
  private readonly servicio = inject(NominaPeriodoService);
  private readonly capabilities = inject(NominaMensualCapabilitiesService);
  private readonly router = inject(Router);

  readonly estadoLabel = estadoNominaToLabel;
  readonly formatearFechaLiquidacion = formatearFechaLiquidacion;

  readonly nominaPeriodoId = input<string | null>(null);
  readonly preparacionExterna = input(false);
  readonly nominaCabeceraCambiada = output<NominaCabeceraCambiadaEvent>();
  readonly verEnDotacionSolicitado = output<string>();

  readonly nomina = signal<NominaPeriodo | null>(null);
  readonly resumen = signal<ResumenValidacionNomina | null>(null);
  readonly consolidaciones = signal<readonly NominaConsolidacion[]>([]);
  readonly liquidaciones = signal<readonly NominaLiquidacionResumen[]>([]);
  readonly cargando = signal(false);
  readonly ejecutando = signal(false);
  readonly error = signal<string | null>(null);
  readonly mensaje = signal<string | null>(null);
  readonly motivoCierre = signal('');
  readonly motivoReapertura = signal('');
  readonly mostrarReabrir = signal(false);
  readonly confirmarCierreVisible = signal(false);
  readonly confirmarAprobacionVisible = signal(false);
  readonly confirmarGeneracionLiquidacionesVisible = signal(false);
  readonly filtroSeveridad = signal<FiltroSeveridadIncidencia>('todas');
  readonly busquedaIncidencia = signal('');
  readonly procesandoDecision = signal<string | null>(null);
  readonly justificaciones = signal<Record<string, string>>({});
  readonly etiquetaTipoIncidencia = etiquetaTipoIncidencia;
  readonly etiquetaEstadoDecision = etiquetaEstadoDecisionIncidencia;

  readonly esMensualConsolidadora = computed(() => {
    const n = this.nomina();
    return n?.tipo === 'mensual' && n.naturaleza === 'liquidacion_legal';
  });

  readonly checklist = computed<ChecklistItem[]>(() => {
    const n = this.nomina();
    const r = this.resumen();
    if (!n || !r) return [];

    const items: ChecklistItem[] = [
      {
        id: 'parametros',
        label: 'Parámetros guardados',
        cumplido: n.estado !== 'borrador',
        detalle: 'Los parámetros base del período están confirmados.',
      },
      {
        id: 'dotacion',
        label: 'Dotación lista',
        cumplido: n.trabajadorIds.length > 0,
        detalle: `${n.trabajadorIds.length} trabajadores en la nómina.`,
      },
      {
        id: 'movimientos',
        label: 'Movimientos aplicados',
        cumplido: n.estado !== 'dotacion_generada',
        detalle: 'Recurrentes y manuales registrados.',
      },
      {
        id: 'calculo',
        label: 'Cálculo realizado',
        cumplido: (n.evidenciaCalculo?.calculoVigente ?? false) && !!n.evidenciaCalculo?.idCalculoPeriodo,
        detalle: 'El cálculo del período está guardado y vigente.',
      },
      {
        id: 'validacion',
        label: 'Incidencias resueltas',
        cumplido:
          ['validada', 'aprobada', 'liquidada', 'cerrada'].includes(n.estado)
          || (r.puedeValidar === true && (r.conIncidenciasCriticas ?? 0) === 0
            && (r.advertenciasPendientes ?? r.conAdvertencias ?? 0) === 0),
        detalle:
          (r.conIncidenciasCriticas ?? 0) > 0 || (r.advertenciasPendientes ?? 0) > 0
            ? 'Resuelve críticas y acepta advertencias pendientes.'
            : n.estado === 'calculada'
              ? 'Sin bloqueos; la validación se confirma al avanzar desde Cálculo.'
              : 'Decisiones de validación registradas.',
      },
      {
        id: 'aprobacion',
        label: 'Aprobación registrada',
        cumplido: ['aprobada', 'liquidada', 'cerrada'].includes(n.estado),
        detalle: n.estado === 'validada'
          ? 'Pendiente de aprobación para continuar con liquidaciones.'
          : n.estado === 'calculada'
            ? 'Resuelve incidencias y valida antes de aprobar.'
            : 'Aprobación operativa registrada.',
      },
    ];

    if (this.esMensualConsolidadora()) {
      const pendientes = this.consolidaciones().length;
      items.push({
        id: 'conciliacion',
        label: 'Conciliación multi-tipo',
        cumplido: pendientes === 0,
        detalle: pendientes === 0
          ? 'Anticipos y extraordinarias conciliados.'
          : `${pendientes} origen(es) pendiente(s) de aplicar.`,
      });
    }

    items.push({
      id: 'liquidaciones',
      label: 'Liquidaciones generadas',
      cumplido: this.liquidaciones().length > 0,
      detalle: this.liquidaciones().length > 0
        ? `${this.liquidaciones().length} lote(s) persistido(s).`
        : 'Genera liquidaciones desde el cálculo aprobado.',
    });

    return items;
  });

  readonly todoCumplido = computed(() => this.checklist().every((c) => c.cumplido));
  readonly cerrada = computed(() => this.nomina()?.estado === 'cerrada');
  readonly puedeAprobar = computed(
    () =>
      this.capabilities.puedeAprobarNomina()
      && this.nomina()?.estado === 'validada'
      && !this.calculoNoVigente(),
  );
  readonly puedeAccionesAdmin = this.capabilities.puedeAccionesAdminNomina;
  readonly puedeCerrar = this.capabilities.puedeCerrarNomina;
  readonly puedeConsolidar = this.capabilities.puedeConsolidarNomina;
  readonly puedeGenerarLiquidaciones = this.capabilities.puedeGenerarLiquidaciones;

  readonly calculoNoVigente = computed(() => esCalculoNoVigente(this.nomina()?.evidenciaCalculo));
  readonly versionCalculo = computed(() => this.nomina()?.evidenciaCalculo?.versionCalculo ?? 0);
  readonly mensajeCalculoNoVigente = MENSAJE_CALCULO_NO_VIGENTE;

  readonly filasLiquidaciones = computed(() =>
    prepararFilasLiquidacionesInternas(
      this.liquidaciones(),
      this.nomina()?.estado ?? 'borrador',
    ),
  );
  readonly liquidacionVigente = computed(() => liquidacionVigente(this.filasLiquidaciones()));
  readonly soloLecturaLiquidaciones = computed(() =>
    esLiquidacionesSoloLectura(this.nomina()?.estado ?? 'borrador'),
  );
  readonly puedeRegenerarLiquidaciones = computed(() =>
    puedeRegenerarLiquidacionesInternas(
      this.nomina()?.estado ?? 'borrador',
      !this.calculoNoVigente(),
    ) && this.puedeGenerarLiquidaciones(),
  );
  readonly trabajadoresSinLiquidacion = computed(() => {
    const filas = this.filasLiquidaciones();
    const referencia = liquidacionReferenciaCobertura(filas);
    const dotacionIds = this.nomina()?.trabajadorIds.length ?? 0;
    const totalNomina = dotacionIds > 0
      ? dotacionIds
      : (this.resumen()?.totalTrabajadores ?? referencia?.totalTrabajadores ?? 0);
    return calcularTrabajadoresSinLiquidacion(
      totalNomina,
      referencia?.totalTrabajadores,
      { hayLotesMaterializados: filas.length > 0 },
    );
  });
  readonly etiquetaAccionLiquidaciones = computed(() =>
    this.liquidaciones().length > 0 ? 'Regenerar liquidaciones' : 'Generar liquidaciones',
  );

  readonly metricasCierre = computed(() => {
    const items = this.checklist();
    const cumplidos = items.filter((i) => i.cumplido).length;
    const r = this.resumen();
    return {
      cumplidos,
      total: items.length,
      pendientes: items.length - cumplidos,
      liquidaciones: this.filasLiquidaciones().length,
      sinLiquidacion: this.trabajadoresSinLiquidacion(),
      trabajadores: this.nomina()?.trabajadorIds.length ?? this.resumen()?.totalTrabajadores ?? 0,
      criticasPendientes: r?.conIncidenciasCriticas ?? 0,
      advertenciasPendientes: r?.advertenciasPendientes ?? r?.conAdvertencias ?? 0,
    };
  });

  readonly incidenciasFiltradas = computed<IncidenciaNomina[]>(() => {
    const resumen = this.resumen();
    if (!resumen) return [];
    const filtro = this.filtroSeveridad();
    const busqueda = this.busquedaIncidencia().trim().toLowerCase();
    const todas = [...resumen.incidenciasCriticas, ...resumen.advertencias];

    return todas.filter((inc) => {
      if (filtro !== 'todas' && inc.severidad !== filtro) return false;
      if (busqueda && !inc.mensaje.toLowerCase().includes(busqueda)) return false;
      return true;
    });
  });

  readonly hayIncidenciasPanel = computed(() => {
    const r = this.resumen();
    if (!r) return false;
    return r.incidenciasCriticas.length + r.advertencias.length > 0
      || this.nomina()?.estado === 'calculada';
  });

  readonly hayIncidenciasPendientesDecision = computed(() => {
    const r = this.resumen();
    if (!r) return false;
    return (r.conIncidenciasCriticas ?? 0) > 0 || (r.advertenciasPendientes ?? 0) > 0;
  });

  readonly checklistPendientes = computed(() => this.checklist().filter((item) => !item.cumplido));

  readonly progresoChecklist = computed(() => {
    const { cumplidos, total } = this.metricasCierre();
    if (total <= 0) return 0;
    return Math.round((cumplidos / total) * 100);
  });

  readonly accionRecomendada = computed((): VistaAccionRecomendadaCierre | null => {
    const n = this.nomina();
    if (!n) return null;

    if (this.cerrada()) {
      return {
        kicker: '',
        titulo: 'Nómina cerrada',
        detalle: this.puedeAccionesAdmin()
          ? 'Reabrir con motivo para editar de nuevo.'
          : 'Reapertura reservada a administración.',
        tono: 'cerrada',
        tipo: this.puedeAccionesAdmin() ? 'reabrir' : 'ninguna',
        ejecutable: this.puedeAccionesAdmin(),
      };
    }

    if (this.calculoNoVigente()) {
      return {
        kicker: '',
        titulo: 'Recalcula en el paso Cálculo',
        detalle: this.mensajeCalculoNoVigente,
        tono: 'warning',
        tipo: 'recalcular',
        ejecutable: false,
      };
    }

    if (this.hayIncidenciasPendientesDecision()) {
      return {
        kicker: '',
        titulo: 'Resolver incidencias',
        detalle: 'Cierra críticas y acepta advertencias antes de aprobar.',
        tono: 'bloqueo',
        tipo: 'resolver_incidencias',
        ejecutable: false,
      };
    }

    if (this.esMensualConsolidadora() && this.consolidaciones().length > 0) {
      return {
        kicker: '',
        titulo: `Conciliar ${this.consolidaciones().length} origen(es)`,
        detalle: 'Anticipos o extraordinarias pendientes.',
        tono: 'pendiente',
        tipo: 'conciliacion',
        ejecutable: this.puedeConsolidar(),
      };
    }

    if (n.estado === 'validada' && this.puedeAprobar()) {
      return {
        kicker: '',
        titulo: 'Aprobar nómina',
        detalle: 'Antes de generar liquidaciones.',
        tono: 'pendiente',
        tipo: 'aprobar',
        ejecutable: true,
      };
    }

    if (
      ['aprobada', 'liquidada'].includes(n.estado)
      && this.liquidaciones().length === 0
      && this.puedeRegenerarLiquidaciones()
    ) {
      return {
        kicker: '',
        titulo: 'Generar liquidaciones',
        detalle: 'Desde el cálculo aprobado.',
        tono: 'pendiente',
        tipo: 'liquidaciones',
        ejecutable: true,
      };
    }

    if (this.todoCumplido()) {
      if (!this.puedeCerrar()) {
        return {
          kicker: '',
          titulo: 'Sin permiso de cierre',
          detalle: 'Requisitos listos; rol sin cierre operativo.',
          tono: 'bloqueo',
          tipo: 'ninguna',
          ejecutable: false,
        };
      }
      return {
        kicker: '',
        titulo: 'Listo para cerrar',
        detalle: 'Usa Cerrar nómina en la cabecera.',
        tono: 'listo',
        tipo: 'cierre_shell',
        ejecutable: false,
      };
    }

    const pendiente = this.checklistPendientes()[0];
    if (pendiente) {
      return {
        kicker: '',
        titulo: pendiente.label,
        detalle: pendiente.detalle,
        tono: 'pendiente',
        tipo: 'espera',
        ejecutable: false,
      };
    }

    return null;
  });

  readonly checklistVista = computed(() => {
    const items = this.checklist();
    const pendientes = items.filter((item) => !item.cumplido);
    if (pendientes.length === 0 && items.length > 0) {
      return [{ id: 'resumen', label: `${items.length} requisitos listos`, cumplido: true, detalle: '' }];
    }
    return pendientes;
  });

  readonly resumenAprobacionSections = computed(() => {
    const n = this.nomina();
    const r = this.resumen();
    const version = this.versionCalculo();
    const trabajadores = n?.trabajadorIds.length ?? r?.totalTrabajadores ?? 0;
    const criticas = r?.conIncidenciasCriticas ?? 0;
    const avisos = r?.advertenciasPendientes ?? r?.conAdvertencias ?? 0;
    const validadoAt = n?.evidenciaCalculo?.validadoAt;
    return [
      {
        title: 'Cálculo a aprobar',
        text: `Versión ${version || '—'}. ${trabajadores} trabajadores en dotación.`,
        tone: 'info' as const,
      },
      {
        title: 'Revisión',
        text:
          (criticas + avisos) === 0
            ? 'Sin incidencias críticas ni advertencias pendientes.'
            : `${criticas} críticas y ${avisos} advertencias pendientes de decisión.`,
        tone: criticas > 0 ? ('attention' as const) : ('neutral' as const),
      },
      {
        title: 'Responsable',
        text: validadoAt
          ? `Validación registrada: ${formatearFechaLiquidacion(validadoAt)}. La aprobación queda a tu nombre en auditoría.`
          : 'La aprobación queda a tu nombre en auditoría del período.',
        tone: 'neutral' as const,
      },
    ];
  });

  readonly resumenReaperturaSections = computed(() => {
    const liquidos = this.liquidaciones().filter((l) => l.activo);
    const version = this.versionCalculo();
    const items = liquidos.slice(0, 5).map(
      (l) =>
        `v${l.version} · ${l.totalTrabajadores} trabajadores · $${l.totalLiquido.toLocaleString('es-CL')}`,
    );
    return [
      {
        title: 'Qué pierde vigencia',
        text: `El cálculo (versión ${version || '—'}) quedará no vigente y deberás recalcular.`,
        tone: 'attention' as const,
      },
      {
        title: 'Liquidaciones afectadas',
        text:
          liquidos.length === 0
            ? 'No hay liquidaciones internas activas en esta nómina.'
            : `${liquidos.length} lote(s) activo(s) se marcarán como no vigentes.`,
        items: items.length > 0 ? items : undefined,
        tone: liquidos.length > 0 ? ('attention' as const) : ('neutral' as const),
      },
      {
        title: 'Consecuencia',
        text: 'Tras reabrir, revisa dotación/movimientos, recalcula y regenera liquidaciones si corresponde.',
        tone: 'info' as const,
      },
    ];
  });

  iconoAccionRecomendada(tipo: TipoAccionRecomendadaCierre): string {
    switch (tipo) {
      case 'aprobar':
        return 'badge-check';
      case 'liquidaciones':
        return 'receipt';
      case 'conciliacion':
        return 'layers';
      case 'cierre_shell':
        return 'lock';
      case 'reabrir':
        return 'lock-open';
      case 'recalcular':
        return 'calculator';
      case 'resolver_incidencias':
        return 'triangle-alert';
      case 'espera':
        return 'circle-dashed';
      default:
        return 'info';
    }
  }

  iconoChecklistItem(id: string): string {
    switch (id) {
      case 'parametros':
        return 'settings-2';
      case 'dotacion':
        return 'users';
      case 'movimientos':
        return 'list-plus';
      case 'calculo':
        return 'calculator';
      case 'validacion':
        return 'shield-check';
      case 'aprobacion':
        return 'badge-check';
      case 'conciliacion':
        return 'layers';
      case 'liquidaciones':
        return 'receipt';
      case 'resumen':
        return 'circle-check';
      default:
        return 'circle';
    }
  }

  iconoEstadoChecklist(cumplido: boolean): string {
    return cumplido ? 'circle-check' : 'circle-dashed';
  }

  etiquetaBotonAccionRecomendada(): string {
    const accion = this.accionRecomendada();
    if (!accion) return 'Continuar';
    switch (accion.tipo) {
      case 'aprobar':
        return this.ejecutando() ? '…' : 'Aprobar';
      case 'liquidaciones':
        return this.ejecutando() ? '…' : (this.liquidaciones().length > 0 ? 'Regenerar' : 'Generar');
      case 'conciliacion':
        return this.ejecutando() ? '…' : 'Conciliar';
      case 'reabrir':
        return 'Reabrir';
      default:
        return 'Continuar';
    }
  }

  ejecutarAccionRecomendada(): void {
    const accion = this.accionRecomendada();
    if (!accion?.ejecutable) return;
    switch (accion.tipo) {
      case 'aprobar':
        this.solicitarAprobacion();
        break;
      case 'liquidaciones':
        this.solicitarGeneracionLiquidaciones();
        break;
      case 'conciliacion':
        void this.aplicarConsolidaciones();
        break;
      case 'reabrir':
        this.abrirReaperturaModal();
        break;
    }
  }

  constructor() {
    effect(() => {
      const id = this.nominaPeriodoId();
      if (id) void this.cargar(id);
    });
  }

  private async cargar(nominaPeriodoId: string): Promise<void> {
    this.cargando.set(true);
    this.error.set(null);
    try {
      const nomina = await this.servicio.obtenerNomina(nominaPeriodoId);
      const [resumen, consolidaciones, liquidaciones] = await Promise.all([
        this.servicio.obtenerResumenValidacionNomina(nominaPeriodoId),
        nomina?.tipo === 'mensual' && nomina.naturaleza === 'liquidacion_legal'
          ? this.servicio.listarConsolidacionesPendientes(nominaPeriodoId)
          : Promise.resolve([]),
        this.servicio.listarLiquidacionesNomina(nominaPeriodoId),
      ]);
      this.nomina.set(nomina);
      this.resumen.set(resumen);
      this.consolidaciones.set(consolidaciones);
      this.liquidaciones.set(liquidaciones);
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Error desconocido';
      this.error.set(`No fue posible cargar el resumen de cierre: ${msg}`);
    } finally {
      this.cargando.set(false);
    }
  }

  recargar(): void {
    const id = this.nominaPeriodoId();
    if (id && !this.cargando()) void this.cargar(id);
  }

  cambiarFiltroSeveridad(value: FiltroSeveridadIncidencia): void {
    this.filtroSeveridad.set(value);
  }

  setJustificacion(incidenciaId: string, value: string): void {
    this.justificaciones.update((actual) => ({ ...actual, [incidenciaId]: value }));
  }

  incidenciaCriticaPendiente(inc: IncidenciaNomina): boolean {
    return incidenciaCriticaPendiente(inc);
  }

  advertenciaPendiente(inc: IncidenciaNomina): boolean {
    return advertenciaPendiente(inc);
  }

  emitirVerEnDotacion(trabajadorId: string | undefined): void {
    if (trabajadorId) this.verEnDotacionSolicitado.emit(trabajadorId);
  }

  async marcarResuelta(inc: IncidenciaNomina): Promise<void> {
    this.procesandoDecision.set(inc.id);
    this.error.set(null);
    try {
      await this.servicio.registrarDecisionIncidencia(inc.id, 'resolver');
      this.recargar();
      const id = this.nominaPeriodoId();
      if (id && this.nomina()?.estado === 'calculada') {
        const resumen = await this.servicio.obtenerResumenValidacionNomina(id);
        if (resumen.puedeValidar) {
          await this.servicio.validarNomina(id);
          await this.cargar(id);
          this.nominaCabeceraCambiada.emit({
            trazabilidad: { tipo: 'validacion', motivo: 'Incidencias resueltas; nómina validada.' },
          });
        }
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Error desconocido';
      this.error.set(`No fue posible registrar la resolución: ${msg}`);
    } finally {
      this.procesandoDecision.set(null);
    }
  }

  async aceptarAdvertencia(inc: IncidenciaNomina): Promise<void> {
    const justificacion = this.justificaciones()[inc.id]?.trim() ?? '';
    if (!justificacion) {
      this.error.set('Indica una justificación antes de aceptar la advertencia.');
      return;
    }
    this.procesandoDecision.set(inc.id);
    this.error.set(null);
    try {
      await this.servicio.registrarDecisionIncidencia(inc.id, 'aceptar', justificacion);
      this.recargar();
      const id = this.nominaPeriodoId();
      if (id && this.nomina()?.estado === 'calculada') {
        const resumen = await this.servicio.obtenerResumenValidacionNomina(id);
        if (resumen.puedeValidar) {
          await this.servicio.validarNomina(id);
          await this.cargar(id);
          this.nominaCabeceraCambiada.emit({
            trazabilidad: { tipo: 'validacion', motivo: 'Advertencias aceptadas; nómina validada.' },
          });
        }
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Error desconocido';
      this.error.set(`No fue posible aceptar la advertencia: ${msg}`);
    } finally {
      this.procesandoDecision.set(null);
    }
  }

  async aprobarNomina(): Promise<void> {
    const id = this.nominaPeriodoId();
    if (!id) return;
    this.confirmarAprobacionVisible.set(false);
    this.ejecutando.set(true);
    this.error.set(null);
    try {
      await this.servicio.aprobarNomina(id);
      this.mensaje.set('Nómina aprobada. Ya puedes generar liquidaciones.');
      await this.cargar(id);
      this.nominaCabeceraCambiada.emit({ trazabilidad: { tipo: 'aprobacion', motivo: 'Nómina aprobada.' } });
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Error desconocido';
      this.error.set(`No fue posible aprobar la nómina: ${msg}`);
    } finally {
      this.ejecutando.set(false);
    }
  }

  solicitarAprobacion(): void {
    if (this.puedeAprobar()) this.confirmarAprobacionVisible.set(true);
  }

  async aplicarConsolidaciones(): Promise<void> {
    const id = this.nominaPeriodoId();
    if (!id || !this.esMensualConsolidadora()) return;
    this.ejecutando.set(true);
    this.error.set(null);
    try {
      const resultado = await this.servicio.aplicarConsolidaciones(id);
      this.mensaje.set(
        `Conciliación aplicada: ${resultado.aplicadas} origen(es) incorporados.`,
      );
      await this.cargar(id);
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Error desconocido';
      this.error.set(`No fue posible aplicar la conciliación: ${msg}`);
    } finally {
      this.ejecutando.set(false);
    }
  }

  async generarLiquidaciones(): Promise<void> {
    const id = this.nominaPeriodoId();
    if (!id) return;
    this.confirmarGeneracionLiquidacionesVisible.set(false);
    this.ejecutando.set(true);
    this.error.set(null);
    try {
      await this.servicio.generarLiquidacionesNomina(id);
      this.mensaje.set(
        this.liquidaciones().length > 0
          ? 'Liquidaciones regeneradas. La versión anterior queda como superada.'
          : 'Liquidaciones generadas correctamente.',
      );
      await this.cargar(id);
      this.nominaCabeceraCambiada.emit({
        trazabilidad: { tipo: 'liquidaciones', motivo: 'Liquidaciones generadas.' },
      });
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Error desconocido';
      this.error.set(`No fue posible generar liquidaciones: ${msg}`);
    } finally {
      this.ejecutando.set(false);
    }
  }

  solicitarGeneracionLiquidaciones(): void {
    if (!this.puedeRegenerarLiquidaciones()) return;
    this.confirmarGeneracionLiquidacionesVisible.set(true);
  }

  verLiquidacionesCompletas(): void {
    const id = this.nominaPeriodoId();
    if (!id) return;
    const nomina = this.nomina();
    const idCalculo = nomina?.evidenciaCalculo?.idCalculoPeriodo;
    const periodo = nomina?.periodo ?? this.liquidacionVigente()?.periodo;
    void this.router.navigate(['/remuneraciones/liquidaciones'], {
      queryParams: {
        nominaPeriodoId: id,
        ...(periodo ? { periodo } : {}),
        ...(idCalculo != null ? { idCalculoPeriodo: idCalculo } : {}),
      },
    });
  }

  async cerrarNomina(): Promise<void> {
    const id = this.nominaPeriodoId();
    if (!id || !this.todoCumplido()) return;
    this.confirmarCierreVisible.set(false);
    this.ejecutando.set(true);
    this.error.set(null);
    try {
      await this.servicio.cerrarNomina(id, { motivo: this.motivoCierre().trim() || undefined });
      this.mensaje.set('Nómina cerrada correctamente.');
      const refrescada = await this.servicio.obtenerNomina(id);
      this.nomina.set(refrescada);
      this.nominaCabeceraCambiada.emit({
        registrarPasoCompletado: 'closure',
        trazabilidad: {
          tipo: 'cierre',
          motivo: this.motivoCierre().trim() || 'Nómina cerrada operativamente.',
        },
      });
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Error desconocido';
      this.error.set(`No fue posible cerrar la nómina: ${msg}`);
    } finally {
      this.ejecutando.set(false);
    }
  }

  solicitarCierre(): void {
    if (this.todoCumplido()) this.confirmarCierreVisible.set(true);
  }

  puedeContinuar(): ResultadoAvancePaso {
    if (this.cerrada()) {
      return { ok: false, razon: 'La nómina ya está cerrada.' };
    }
    if (!this.puedeCerrar()) {
      return {
        ok: false,
        razon: 'El cierre requiere rol de administración de remuneraciones.',
      };
    }
    if (this.ejecutando()) {
      return { ok: false, razon: 'Cierre en curso.' };
    }
    if (this.cargando()) {
      return { ok: false, razon: 'Cargando el resumen de cierre.' };
    }
    if (!this.todoCumplido()) {
      return { ok: false, razon: 'Aún hay ítems pendientes en la checklist de cierre.' };
    }
    return { ok: true };
  }

  async avanzar(): Promise<ResultadoAvancePaso> {
    const diagnostico = this.puedeContinuar();
    if (!diagnostico.ok) return diagnostico;
    this.solicitarCierre();
    return { ok: false, razon: RAZON_CIERRE_MODAL_PENDIENTE };
  }

  abrirReaperturaModal(): void {
    this.motivoReapertura.set('');
    this.error.set(null);
    this.mostrarReabrir.set(true);
  }

  cancelarReapertura(): void {
    if (this.ejecutando()) return;
    this.mostrarReabrir.set(false);
    this.motivoReapertura.set('');
    this.error.set(null);
  }

  async reabrirNomina(): Promise<void> {
    if (this.ejecutando()) return;
    const id = this.nominaPeriodoId();
    const motivo = this.motivoReapertura().trim();
    if (!id || !motivo) {
      this.error.set('Debes ingresar un motivo para reabrir la nómina.');
      return;
    }
    this.ejecutando.set(true);
    this.error.set(null);
    try {
      await this.servicio.reabrirNomina(id, { motivo });
      this.mensaje.set('Nómina reabierta para edición.');
      const refrescada = await this.servicio.obtenerNomina(id);
      this.nomina.set(refrescada);
      this.nominaCabeceraCambiada.emit({
        trazabilidad: { tipo: 'reapertura', motivo },
      });
      this.mostrarReabrir.set(false);
      this.motivoReapertura.set('');
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Error desconocido';
      this.error.set(`No fue posible reabrir la nómina: ${msg}`);
    } finally {
      this.ejecutando.set(false);
    }
  }

  etiquetaTipoConsolidacion(tipo: string): string {
    return tipo === 'anticipo' ? 'Anticipo' : 'Extraordinaria';
  }
}
