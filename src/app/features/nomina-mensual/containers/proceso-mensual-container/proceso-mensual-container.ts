import { ChangeDetectionStrategy, Component, HostListener, computed, effect, inject, signal, untracked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';

import { PeriodoActivoService } from '../../../../core/services/periodo-activo.service';
import { MessageBoxComponent } from '../../../../shared/components/ui/message-box.component';
import {
  DataGridColumn,
  DataGridComponent,
  DataGridFilter,
} from '../../../../shared/components/ui/data-grid.component';
import type {
  BaseNominaParametrosEstado,
  BaseNominaTrabajadorEstado,
  ClasificacionParametroGrupo,
  MotorCalculoPeriodoResultado,
  MotorCalculoIssue,
  MotorCalculoEstadoTrabajador,
  MotorCalculoSeveridad,
  NominaCalculoConceptoSnapshot,
  NominaCalculoPeriodoSnapshot,
  NominaSnapshotCompletoView,
  ProcesoMensualArea,
  ProcesoMensualEstado,
  ProcesoMensualItemEstado,
  ProcesoMensualMensaje,
  ProcesoMensualPreNominaEstado,
  ProcesoMensualPreNominaPeriodo,
  ProcesoMensualPrevalidacion,
} from '../../models/proceso-mensual.model';
import { ProcesoMensualService } from '../../services/proceso-mensual.service';
import {
  RecordBreadcrumbComponent,
  type RecordBreadcrumbItem,
} from '../../../../shared/components/ui/record-breadcrumb.component';
import type { ActaOperativaPeriodoViewModel } from '../../models/acta-operativa-periodo.model';
import { validarPeriodoEntradaMensual } from '../../entradas/rules/entradas-mensuales-periodo.rules';
import { buildActaOperativaPeriodoViewModel } from '../../rules/acta-operativa-periodo.rules';
import {
  resolverEstadoOperativoProcesoMensual,
  type ProcesoMensualAccionLocal,
  type ProcesoMensualEstadoSeveridad,
  type ProcesoMensualPendienteVm,
} from '../../rules/proceso-mensual-estado-operativo.rules';

type ValidacionCalculoEstado = 'pendiente' | 'listo' | 'advertencias' | 'bloqueado';
type ValidacionOperativaSeveridad = 'bloqueo' | 'advertencia' | 'info';
type ValidacionAccionLocal = ProcesoMensualAccionLocal;
type ResultadoPreliminarEstado =
  | 'sin_resultado'
  | 'no_guardado'
  | 'guardado'
  | 'actualizado_sin_guardar'
  | 'error_guardado'
  | 'con_bloqueos';
type RevisionAprobacionEstado =
  | 'sin_resultado_guardado'
  | 'pendiente_guardado'
  | 'pendiente_revision'
  | 'actualizado_sin_guardar'
  | 'no_apto'
  | 'listo'
  | 'aprobado'
  | 'aprobado_desactualizado';
type RevisionChecklistEstado = 'Completo' | 'Pendiente' | 'Requiere atencion' | 'No aplica';
type EtapaOperativaActiva = 'base' | 'calculo' | 'resultado' | 'guardado' | 'aprobacion' | 'cierre' | 'liquidaciones';
type PasoPeriodoEstado = 'Actual' | 'Completo' | 'Pendiente' | 'Bloqueada';
type ConfirmacionProcesoMensualTipo = 'guardar_preliminar' | 'aprobar_preliminar' | 'cerrar_nomina' | 'preparar_acta';
type DetalleOperativoTab = 'resumen' | 'trabajadores' | 'parametros' | 'movimientos_recurrentes' | 'resultado';
type NominaWorkspaceTab = 'guia' | 'trabajadores' | 'detalle';
type NominaVisualFrame =
  | 'sin_generar'
  | 'generando'
  | 'en_revision'
  | 'con_pendientes'
  | 'lista_para_confirmar'
  | 'confirmada'
  | 'liquidaciones_generadas';

interface ConfirmacionProcesoMensualView {
  tipo: ConfirmacionProcesoMensualTipo;
  titulo: string;
  mensaje: string;
  detalle: string;
  puntos: string[];
  primaryLabel: string;
  secondaryLabel: string;
  advertenciasAprobacion?: string[];
  secciones?: Array<{ titulo: string; items: string[] }>;
}

interface NominaVisualFrameView {
  frame: NominaVisualFrame;
  chip: string;
  titulo: string;
  texto: string;
  info: string;
  ctaLabel: string;
  ctaDisabled: boolean;
  ctaTipo: 'local' | 'ruta' | 'ninguna';
  ctaRuta?: string;
  ctaAccion?: ValidacionAccionLocal;
  secundariaLabel?: string;
  secundariaAccion?: () => void;
}

interface NominaResumenSuperiorVm {
  trabajadores: string;
  parametros: string;
  movimientos: string;
  recurrentes: string;
  cambios: number;
  bloqueos: number;
}

interface ValidacionOperativaItemView {
  codigo: string;
  titulo: string;
  descripcion: string;
  severidad: ValidacionOperativaSeveridad;
  accionLabel?: string;
  ruta?: string;
  accionLocal?: ValidacionAccionLocal;
}

interface ValidacionCalculoPreliminarView {
  estado: ValidacionCalculoEstado;
  estadoLabel: string;
  puedeCalcular: boolean;
  razonDeshabilitado?: string;
  siguienteAccion: {
    label: string;
    descripcion: string;
    ruta?: string;
    accionLocal?: ValidacionAccionLocal;
  };
  bloqueos: ValidacionOperativaItemView[];
  advertencias: ValidacionOperativaItemView[];
  informaciones: ValidacionOperativaItemView[];
}

interface ResultadoObservacionView {
  codigo: string;
  titulo: string;
  descripcion: string;
  accionLabel?: string;
  ruta?: string;
}

interface TrabajadorResultadoPreliminarView {
  idPersona: number | string;
  trabajadorLabel: string;
  rutLabel: string;
  estadoLabel: 'Calculado' | 'Con observaciones' | 'Omitido' | 'No calculado';
  haberesLabel: string;
  descuentosLabel: string;
  liquidoLabel: string;
  observacionLabel: string;
  accionLabel?: string;
  ruta?: string;
}

interface ResultadoPreliminarView {
  estado: ResultadoPreliminarEstado;
  estadoLabel: string;
  descripcionEstado: string;
  resumen: {
    trabajadoresCalculados: number;
    trabajadoresConObservaciones: number;
    trabajadoresOmitidos: number;
    totalHaberes: number | null;
    totalDescuentos: number | null;
    totalLiquido: number | null;
    totalCostoEmpresa: number | null;
  };
  trabajadores: TrabajadorResultadoPreliminarView[];
  bloqueos: ResultadoObservacionView[];
  advertencias: ResultadoObservacionView[];
  informaciones: ResultadoObservacionView[];
  detalleTecnico: {
    versionCalculo: string;
    identificadorTecnico: string;
    generadoEn: string;
  };
  ultimoGuardado?: {
    versionLabel: string;
    fechaGuardadoLabel: string;
    versionCalculoLabel: string;
    identificadorTecnicoLabel: string;
    estadoLabel: string;
    trabajadoresCalculados: number;
    trabajadoresConObservaciones: number;
    trabajadoresOmitidos: number;
    totalLiquidoLabel: string;
    advertenciasLabel: string;
  };
  acciones: {
    puedeRecalcular: boolean;
    puedeGuardarPreliminar: boolean;
    razonNoPuedeGuardar?: string;
    helperGuardar: string;
    modoGuardadoLabel: string;
  };
}

interface RevisionAprobacionChecklistItemView {
  titulo: string;
  descripcion: string;
  estado: RevisionChecklistEstado;
}

interface RevisionAprobacionView {
  estado: RevisionAprobacionEstado;
  estadoLabel: string;
  descripcion: string;
  checklist: RevisionAprobacionChecklistItemView[];
  bloqueos: ResultadoObservacionView[];
  advertencias: ResultadoObservacionView[];
  informaciones: ResultadoObservacionView[];
  accionPrincipalLabel: string;
  puedeGuardarActualizado: boolean;
  puedeRecalcular: boolean;
  puedeAprobar: boolean;
  razonNoPuedeAprobar?: string;
  aprobacion: AprobacionOperativaRegistroView | null;
  notaAprobacion: string;
}

interface AprobacionOperativaRegistroView {
  fechaAprobacionLabel: string;
  usuarioLabel: string;
  versionCalculoLabel: string;
  identificadorTecnicoLabel: string;
  identificadorResultado: string | null;
  idCalculoPeriodo: number | null;
  trabajadoresCalculados: number;
  totalHaberesLabel: string;
  totalDescuentosLabel: string;
  totalLiquidoLabel: string;
  advertencias: string[];
}

interface CierreOperativoView {
  estadoLabel: string;
  descripcion: string;
  puedeCerrar: boolean;
  razonNoPuedeCerrar?: string;
  fechaCierreLabel?: string;
  usuarioLabel?: string;
  observacionLabel?: string;
  resumen: {
    periodo: string;
    identificadorTecnicoLabel: string;
    versionCalculoLabel: string;
    trabajadoresCalculados: number;
    totalHaberesLabel: string;
    totalDescuentosLabel: string;
    totalLiquidoLabel: string;
    advertenciasLabel: string;
  } | null;
}

interface SnapshotCompletoTrabajadorView {
  id: number | string;
  trabajadorLabel: string;
  estadoLabel: string;
  haberesLabel: string;
  descuentosLabel: string;
  liquidoLabel: string;
  conceptos: string[];
  observaciones: string[];
}

interface SnapshotCompletoObservacionView {
  codigo: string;
  nivelLabel: 'Bloqueo' | 'Advertencia' | 'Informacion';
  mensaje: string;
  trabajadorLabel: string;
}

interface SnapshotCompletoDetalleView {
  estadoLabel: string;
  descripcion: string;
  resumen: {
    periodo: string;
    fechaGeneracionLabel: string;
    versionCalculoLabel: string;
    identificadorTecnicoLabel: string;
    trabajadores: number;
    totalHaberesLabel: string;
    totalDescuentosLabel: string;
    totalLiquidoLabel: string;
    totalConceptos: number;
    totalObservaciones: number;
    totalTrazas: number;
    aprobacionLabel: string;
  };
  trabajadores: SnapshotCompletoTrabajadorView[];
  observaciones: SnapshotCompletoObservacionView[];
  trazabilidad: string[];
  advertenciaDetalleFaltante: string | null;
  reemplazoLabel: string | null;
}

interface PasoPeriodoView {
  numero: string;
  titulo: string;
  estado: PasoPeriodoEstado;
  descripcion: string;
}

type BitacoraEtapaClave = 'validar' | 'base' | 'calculo' | 'aprobar_cerrar' | 'liquidaciones';
type BitacoraSubpasoMarca = 'hecho' | 'actual' | 'pendiente';

interface BitacoraSubpasoVm {
  marca: BitacoraSubpasoMarca;
  etiqueta: string;
}

interface BitacoraEtapaVm {
  clave: BitacoraEtapaClave;
  etiqueta: string;
  resumen: string;
  activa: boolean;
  completada: boolean;
  bloqueada: boolean;
  subpasos: BitacoraSubpasoVm[];
}

interface BitacoraRailEtapaVm {
  clave: string;
  etiqueta: string;
  estadoCorto: string;
  marca: 'hecho' | 'actual' | 'pendiente' | 'bloqueado';
  activa: boolean;
}

interface AlertasPeriodoResumenVm {
  modo: 'evaluando' | 'sin-evaluar' | 'ok' | 'alertas';
  mensaje?: string;
  criticas: number;
  advertencias: number;
  mostrarDetalle: boolean;
}

interface ParaContinuarItemVm {
  titulo: string;
  detalle: string;
}

interface PayrollWorkerDetailRow {
  trabajador: string;
  rut: string;
  estado: string;
  observacion: string;
  accion: string;
}

interface PayrollMovementDetailRow {
  trabajador: string;
  concepto: string;
  tipo: string;
  monto: string;
  estado: string;
  accion: string;
}

interface PayrollRecurrentDetailRow {
  trabajador: string;
  concepto: string;
  periodicidad: string;
  monto: string;
  estado: string;
  accion: string;
}

interface PayrollObservationDetailRow {
  severidad: 'Bloqueo' | 'Advertencia' | 'Información';
  ambito: string;
  mensaje: string;
  accion: string;
}

interface PayrollResultDetailRow {
  trabajador: string;
  haberes: string;
  descuentos: string;
  liquido: string;
  estado: string;
  observacion: string;
}

interface PayrollSeguimientoItem {
  titulo: string;
  descripcion: string;
  estado: string;
  estadoClase: string;
  accion: string;
  ruta?: string;
}

@Component({
  selector: 'app-proceso-mensual-container',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterLink,
    LucideAngularModule,
    MessageBoxComponent,
    DataGridComponent,
    RecordBreadcrumbComponent,
  ],
  templateUrl: './proceso-mensual-container.html',
  styleUrl: './proceso-mensual-container.css',
})
export class ProcesoMensualContainer {
  readonly periodoActivo = inject(PeriodoActivoService);
  readonly procesoMensual = inject(ProcesoMensualService);

  readonly breadcrumbItems: readonly RecordBreadcrumbItem[] = [
    { label: 'Remuneraciones', link: '/remuneraciones' },
    { label: 'Nómina mensual' },
  ];

  readonly periodoSeleccionado = computed(() => this.periodoActivo.periodoYm());
  readonly resultado = signal<ProcesoMensualPrevalidacion | null>(null);
  readonly preNomina = signal<ProcesoMensualPreNominaPeriodo | null>(null);
  readonly calculo = signal<MotorCalculoPeriodoResultado | null>(null);
  readonly snapshotActivo = signal<NominaCalculoPeriodoSnapshot | null>(null);
  readonly validando = signal(false);
  readonly generandoPreNomina = signal(false);
  readonly calculandoPreliminar = signal(false);
  readonly guardandoSnapshot = signal(false);
  readonly consultandoSnapshot = signal(false);
  readonly consultandoSnapshotCompleto = signal(false);
  readonly errorEjecucion = signal<string | null>(null);
  readonly errorGuardadoResultado = signal<string | null>(null);
  readonly errorAprobacionOperativa = signal<string | null>(null);
  readonly errorCierreOperativo = signal<string | null>(null);
  readonly errorSnapshotCompleto = signal<string | null>(null);
  readonly exitoGuardadoResultado = signal<string | null>(null);
  readonly identificadorResultadoGuardadoActual = signal<string | null>(null);
  readonly aprobacionOperativa = signal<AprobacionOperativaRegistroView | null>(null);
  readonly aprobandoResultado = signal(false);
  readonly cerrandoNomina = signal(false);
  readonly snapshotCompleto = signal<NominaSnapshotCompletoView | null>(null);
  readonly confirmacionProceso = signal<ConfirmacionProcesoMensualView | null>(null);
  readonly detalleOperativoAbierto = signal(false);
  readonly detalleOperativoTabActivo = signal<DetalleOperativoTab>('trabajadores');
  readonly nominaWorkspaceTab = signal<NominaWorkspaceTab>('guia');
  readonly actaOperativaPreparada = signal(false);

  accionPeriodoEnCurso(): boolean {
    return (
      this.validando() ||
      this.generandoPreNomina() ||
      this.calculandoPreliminar() ||
      this.guardandoSnapshot() ||
      this.aprobandoResultado() ||
      this.cerrandoNomina()
    );
  }

  seleccionarNominaWorkspaceTab(tab: NominaWorkspaceTab): void {
    this.nominaWorkspaceTab.set(tab);
  }

  claseChipRevision(estado: string): string {
    const normalizado = estado.toLowerCase();
    if (normalizado.includes('bloque') || normalizado.includes('omitido')) {
      return 'payroll-state-chip payroll-state-chip--danger';
    }
    if (normalizado.includes('observ') || normalizado.includes('advert') || normalizado.includes('cambio')) {
      return 'payroll-state-chip payroll-state-chip--warning';
    }
    if (normalizado.includes('revis')) return 'payroll-state-chip payroll-state-chip--info';
    return 'payroll-state-chip payroll-state-chip--success';
  }

  clasePendienteVisual(severidad: ProcesoMensualEstadoSeveridad): string {
    if (severidad === 'danger') return 'payroll-state-chip payroll-state-chip--danger';
    if (severidad === 'warning') return 'payroll-state-chip payroll-state-chip--warning';
    return 'payroll-state-chip payroll-state-chip--info';
  }

  etiquetaPendienteVisual(severidad: ProcesoMensualEstadoSeveridad): string {
    if (severidad === 'danger') return 'Bloqueado';
    if (severidad === 'warning') return 'Cambio detectado';
    return 'Revisar';
  }

  readonly detalleOperativoTabs: Array<{ id: DetalleOperativoTab; label: string }> = [
    { id: 'resumen', label: 'Resumen operativo' },
    { id: 'trabajadores', label: 'Trabajadores' },
    { id: 'parametros', label: 'Parámetros' },
    { id: 'movimientos_recurrentes', label: 'Movimientos y recurrentes' },
    { id: 'resultado', label: 'Nómina generada' },
  ];

  readonly payrollWorkerDetailColumns: DataGridColumn<PayrollWorkerDetailRow>[] = [
    { id: 'trabajador', header: 'Trabajador', field: 'trabajador', sortable: true, priorityResponsive: 'primary' },
    { id: 'rut', header: 'RUT', field: 'rut', sortable: true, priorityResponsive: 'secondary' },
    { id: 'estado', header: 'Estado', field: 'estado', sortable: true },
    { id: 'observacion', header: 'Observación', field: 'observacion' },
    { id: 'accion', header: 'Acción sugerida', field: 'accion' },
  ];

  readonly payrollWorkerDetailFilters: DataGridFilter<PayrollWorkerDetailRow>[] = [
    { id: 'estado', label: 'Estado', field: 'estado', type: 'select', emptyLabel: 'Todos los estados' },
    { id: 'trabajador', label: 'Buscar trabajador', field: 'trabajador', type: 'text', matchMode: 'tokens' },
  ];

  readonly payrollMovementDetailColumns: DataGridColumn<PayrollMovementDetailRow>[] = [
    { id: 'trabajador', header: 'Trabajador', field: 'trabajador', sortable: true, priorityResponsive: 'primary' },
    { id: 'concepto', header: 'Concepto', field: 'concepto', sortable: true },
    { id: 'tipo', header: 'Tipo', field: 'tipo', sortable: true },
    { id: 'monto', header: 'Monto', field: 'monto', align: 'right' },
    { id: 'estado', header: 'Estado', field: 'estado', sortable: true },
    { id: 'accion', header: 'Acción', field: 'accion' },
  ];

  readonly payrollMovementDetailFilters: DataGridFilter<PayrollMovementDetailRow>[] = [
    { id: 'estado', label: 'Estado', field: 'estado', type: 'select', emptyLabel: 'Todos los estados' },
    { id: 'tipo', label: 'Tipo', field: 'tipo', type: 'select', emptyLabel: 'Todos los tipos' },
    { id: 'trabajador', label: 'Buscar trabajador/concepto', field: 'trabajador', type: 'text', matchMode: 'tokens' },
  ];

  readonly payrollRecurrentDetailColumns: DataGridColumn<PayrollRecurrentDetailRow>[] = [
    { id: 'trabajador', header: 'Trabajador', field: 'trabajador', sortable: true, priorityResponsive: 'primary' },
    { id: 'concepto', header: 'Concepto', field: 'concepto', sortable: true },
    { id: 'periodicidad', header: 'Periodicidad', field: 'periodicidad' },
    { id: 'monto', header: 'Monto', field: 'monto', align: 'right' },
    { id: 'estado', header: 'Estado', field: 'estado', sortable: true },
    { id: 'accion', header: 'Acción', field: 'accion' },
  ];

  readonly payrollRecurrentDetailFilters: DataGridFilter<PayrollRecurrentDetailRow>[] = [
    { id: 'estado', label: 'Estado', field: 'estado', type: 'select', emptyLabel: 'Todos los estados' },
    { id: 'trabajador', label: 'Buscar trabajador/concepto', field: 'trabajador', type: 'text', matchMode: 'tokens' },
  ];

  readonly payrollObservationDetailColumns: DataGridColumn<PayrollObservationDetailRow>[] = [
    { id: 'severidad', header: 'Severidad', field: 'severidad', sortable: true, priorityResponsive: 'primary' },
    { id: 'ambito', header: 'Ámbito', field: 'ambito', sortable: true },
    { id: 'mensaje', header: 'Mensaje', field: 'mensaje' },
    { id: 'accion', header: 'Acción sugerida', field: 'accion' },
  ];

  readonly payrollObservationDetailFilters: DataGridFilter<PayrollObservationDetailRow>[] = [
    { id: 'severidad', label: 'Severidad', field: 'severidad', type: 'select', emptyLabel: 'Todas' },
    { id: 'ambito', label: 'Ámbito', field: 'ambito', type: 'select', emptyLabel: 'Todos los ámbitos' },
  ];

  readonly payrollResultDetailColumns: DataGridColumn<PayrollResultDetailRow>[] = [
    { id: 'trabajador', header: 'Trabajador', field: 'trabajador', sortable: true, priorityResponsive: 'primary' },
    { id: 'haberes', header: 'Haberes', field: 'haberes', align: 'right' },
    { id: 'descuentos', header: 'Descuentos', field: 'descuentos', align: 'right' },
    { id: 'liquido', header: 'Líquido preliminar', field: 'liquido', align: 'right' },
    { id: 'estado', header: 'Estado', field: 'estado', sortable: true },
    { id: 'observacion', header: 'Observación', field: 'observacion' },
  ];

  readonly payrollResultDetailFilters: DataGridFilter<PayrollResultDetailRow>[] = [
    { id: 'estado', label: 'Estado', field: 'estado', type: 'select', emptyLabel: 'Todos los estados' },
    { id: 'trabajador', label: 'Buscar trabajador', field: 'trabajador', type: 'text', matchMode: 'tokens' },
  ];

  constructor() {
    effect(() => {
      this.periodoSeleccionado();
      untracked(() => {
        this.resetearEstadoPeriodo();
        this.verSnapshotActivo();
      });
    });
  }

  readonly baseNominaTrazabilidad = computed(() => this.preNomina()?.trazabilidad ?? null);

  readonly cierreOperativo = computed<CierreOperativoView>(() => {
    const snapshot = this.snapshotActivo();
    const cierre = snapshot?.cierreOperativo ?? null;
    const resumen = snapshot ? {
      periodo: snapshot.periodo,
      identificadorTecnicoLabel: snapshot.hashSnapshot || 'Referencia interna no disponible',
      versionCalculoLabel: snapshot.versionMotor || 'Version no disponible',
      trabajadoresCalculados: snapshot.totalTrabajadores,
      totalHaberesLabel: this.formatoMonto(snapshot.totalHaberes),
      totalDescuentosLabel: this.formatoMonto(snapshot.totalDescuentos),
      totalLiquidoLabel: this.formatoMonto(snapshot.totalLiquido),
      advertenciasLabel: snapshot.totalAdvertencias > 0
        ? `${snapshot.totalAdvertencias} advertencia(s) visibles quedaran registradas en la trazabilidad interna.`
        : 'Sin advertencias visibles al cierre.',
    } : null;

    if (cierre) {
      return {
        estadoLabel: 'Nómina confirmada',
        descripcion: 'La nómina mensual quedó confirmada como base oficial del período.',
        puedeCerrar: false,
        razonNoPuedeCerrar: 'La nómina mensual ya está confirmada.',
        fechaCierreLabel: this.formatoFechaHora(cierre.fecha),
        usuarioLabel: cierre.usuarioLabel,
        observacionLabel: cierre.observacion ?? undefined,
        resumen,
      };
    }

    const razonNoPuedeCerrar = this.motivoNoPuedeCerrarNomina();
    return {
      estadoLabel: razonNoPuedeCerrar ? 'Confirmación no disponible' : 'Lista para confirmar',
      descripcion: 'La confirmación congela esta versión como base oficial para generar liquidaciones.',
      puedeCerrar: !razonNoPuedeCerrar,
      razonNoPuedeCerrar,
      resumen,
    };
  });

  readonly snapshotCompletoDetalle = computed<SnapshotCompletoDetalleView | null>(() => {
    const completo = this.snapshotCompleto();
    if (!completo) return null;
    const trabajadorPorId = new Map(
      completo.trabajadores.map((t) => [
        t.idCalculoTrabajador,
        `${t.nombreCompletoSnapshot?.trim() || 'Trabajador sin ficha visible'} · ${t.rut?.trim() || 'RUT no disponible'}`,
      ]),
    );
    const trabajadores = completo.trabajadores.slice(0, 8).map<SnapshotCompletoTrabajadorView>((trabajador) => ({
      id: trabajador.idCalculoTrabajador ?? trabajador.idPersona,
      trabajadorLabel: `${trabajador.nombreCompletoSnapshot?.trim() || 'Trabajador sin ficha visible'} · ${trabajador.rut?.trim() || 'RUT no disponible'}`,
      estadoLabel: this.etiquetaEstadoSnapshotTrabajador(trabajador.estado),
      haberesLabel: this.formatoMonto(trabajador.totalHaberesImponibles + trabajador.totalHaberesNoImponibles),
      descuentosLabel: this.formatoMonto(trabajador.totalDescuentosLegales + trabajador.totalDescuentosVoluntarios),
      liquidoLabel: this.formatoMonto(trabajador.liquidoPreliminar),
      conceptos: trabajador.conceptos.slice(0, 4).map((concepto) => this.etiquetaConceptoSnapshot(concepto)),
      observaciones: trabajador.issues.slice(0, 3).map((issue) => issue.mensaje),
    }));
    const observaciones = completo.observaciones.slice(0, 8).map<SnapshotCompletoObservacionView>((obs) => ({
      codigo: String(obs.idIssue ?? obs.codigo),
      nivelLabel: this.etiquetaNivelObservacion(obs.severidad),
      mensaje: obs.mensaje,
      trabajadorLabel: obs.idCalculoTrabajador == null
        ? 'Resultado completo'
        : trabajadorPorId.get(obs.idCalculoTrabajador) ?? 'Trabajador sin ficha visible',
    }));
    return {
      estadoLabel: completo.resumen.esActivoVigente
        ? 'Resultado guardado vigente'
        : 'Resultado reemplazado',
      descripcion: completo.aprobacionOperativa
        ? 'Resultado guardado aprobado operativamente.'
        : 'Resultado guardado pendiente de aprobacion operativa.',
      resumen: {
        periodo: completo.cabecera.periodo,
        fechaGeneracionLabel: this.formatoFechaHora(completo.cabecera.fechaGeneracion),
        versionCalculoLabel: completo.cabecera.versionMotor || 'Version no disponible',
        identificadorTecnicoLabel: completo.cabecera.hashSnapshot || 'Referencia interna no disponible',
        trabajadores: completo.trabajadores.length,
        totalHaberesLabel: this.formatoMonto(completo.cabecera.totalHaberes),
        totalDescuentosLabel: this.formatoMonto(completo.cabecera.totalDescuentos),
        totalLiquidoLabel: this.formatoMonto(completo.cabecera.totalLiquido),
        totalConceptos: completo.resumen.totalConceptos,
        totalObservaciones: completo.resumen.totalObservaciones,
        totalTrazas: completo.resumen.totalTrazas,
        aprobacionLabel: completo.aprobacionOperativa ? 'Aprobado operativamente' : 'Pendiente de aprobación',
      },
      trabajadores,
      observaciones,
      trazabilidad: completo.trazabilidad.slice(0, 5).map((traza) =>
        `${traza.codigo}: ${traza.observacion || traza.formula || traza.origen}`,
      ),
      advertenciaDetalleFaltante: completo.trabajadores.length === 0
        ? 'El resultado guardado tiene cabecera, pero no se encontraron detalles asociados.'
        : null,
      reemplazoLabel: completo.resumen.fueReemplazado
        ? 'Este resultado fue reemplazado por un resultado posterior.'
        : null,
    };
  });

  readonly resultadoPreliminar = computed<ResultadoPreliminarView>(() => {
    const calculo = this.calculo();
    const base = this.baseNominaTrazabilidad();
    const snapshot = this.snapshotActivo();

    if (!calculo) {
      const guardado = snapshot != null;
      const estado: ResultadoPreliminarEstado = this.errorGuardadoResultado()
        ? 'error_guardado'
        : guardado
          ? 'guardado'
          : 'sin_resultado';
      return {
        estado,
        estadoLabel: this.etiquetaResultadoPreliminar(estado),
        descripcionEstado: this.descripcionEstadoGuardado(estado),
        resumen: {
          trabajadoresCalculados: snapshot?.totalTrabajadores ?? 0,
          trabajadoresConObservaciones: snapshot?.totalAdvertencias ?? 0,
          trabajadoresOmitidos: snapshot?.totalBloqueados ?? 0,
          totalHaberes: snapshot?.totalHaberes ?? null,
          totalDescuentos: snapshot?.totalDescuentos ?? null,
          totalLiquido: snapshot?.totalLiquido ?? null,
          totalCostoEmpresa: null,
        },
        trabajadores: [],
        bloqueos: [],
        advertencias: [],
        informaciones: guardado
          ? [{
              codigo: 'RESULTADO_GUARDADO',
              titulo: 'Resultado preliminar guardado',
              descripcion: 'Existe un resultado preliminar activo para revisar.',
            }]
          : [],
        detalleTecnico: {
          versionCalculo: snapshot?.versionMotor ?? 'Version no disponible',
          identificadorTecnico: snapshot?.hashSnapshot ?? 'Referencia interna no disponible',
          generadoEn: snapshot?.fechaGeneracion ?? 'Fecha no disponible',
        },
        ultimoGuardado: snapshot ? this.ultimoGuardadoDesdeSnapshot(snapshot) : undefined,
        acciones: {
          puedeRecalcular: this.validacionCalculo().puedeCalcular,
          puedeGuardarPreliminar: false,
          razonNoPuedeGuardar: guardado
            ? 'No hay cambios para guardar. El resultado preliminar actual ya esta guardado.'
            : 'Primero calcula preliminarmente la nómina.',
          helperGuardar: 'Guarda una versión revisable del cálculo. No emite liquidaciones ni cierra el período.',
          modoGuardadoLabel: 'Al guardar, se reemplazara el resultado preliminar activo del periodo.',
        },
      };
    }

    const bloqueos = this.observacionesResultado(calculo, 'BLOQUEO');
    const advertencias = this.observacionesResultado(calculo, 'ADVERTENCIA');
    const trabajadoresCalculadosIds = new Set(calculo.liquidaciones.map((liq) => liq.idPersona));
    const omitidosBase = (base?.trabajadores ?? [])
      .filter((trabajador) => !trabajadoresCalculadosIds.has(trabajador.idPersona) || trabajador.estado === 'bloqueado' || trabajador.estado === 'excluido')
      .map<TrabajadorResultadoPreliminarView>((trabajador) => ({
        idPersona: `omitido-${trabajador.idPersona}`,
        trabajadorLabel: trabajador.trabajadorLabel || 'Trabajador sin ficha visible',
        rutLabel: trabajador.rutLabel || 'RUT no disponible',
        estadoLabel: 'Omitido',
        haberesLabel: 'Monto no disponible',
        descuentosLabel: 'Monto no disponible',
        liquidoLabel: 'Monto no disponible',
        observacionLabel: trabajador.observacion || 'No calculado en el resultado preliminar.',
        accionLabel: 'Revisar trabajadores',
      }));
    const trabajadores = [
      ...calculo.liquidaciones.map<TrabajadorResultadoPreliminarView>((liq) => {
        const estadoLabel = this.estadoResultadoTrabajador(liq.estado);
        return {
          idPersona: liq.idPersona,
          trabajadorLabel: liq.nombreCompleto?.trim() || 'Trabajador sin ficha visible',
          rutLabel: liq.rut?.trim() || 'RUT no disponible',
          estadoLabel,
          haberesLabel: this.formatoMonto(liq.totalHaberes),
          descuentosLabel: this.formatoMonto(liq.totalDescuentos),
          liquidoLabel: this.formatoMonto(liq.liquidoAPago),
          observacionLabel: liq.issues.length ? liq.issues.map((issue) => issue.mensaje).join('; ') : 'Sin observaciones',
          ...this.accionResultadoDesdeIssues(liq.issues),
        };
      }),
      ...omitidosBase,
    ];
    for (const omitido of omitidosBase) {
      bloqueos.push({
        codigo: String(omitido.idPersona),
        titulo: 'Trabajador omitido del calculo',
        descripcion: omitido.observacionLabel,
        accionLabel: 'Revisar trabajadores',
      });
    }

    const trabajadoresConObservaciones = trabajadores.filter((t) => t.estadoLabel === 'Con observaciones').length;
    const trabajadoresOmitidos = trabajadores.filter((t) => t.estadoLabel === 'Omitido' || t.estadoLabel === 'No calculado').length;
    const estado: ResultadoPreliminarEstado = this.resolverEstadoGuardadoResultado(calculo, bloqueos);
    const puedeGuardarPreliminar = this.puedeGuardarSnapshot();

    return {
      estado,
      estadoLabel: this.etiquetaResultadoPreliminar(estado),
      descripcionEstado: this.descripcionEstadoGuardado(estado),
      resumen: {
        trabajadoresCalculados: calculo.resumen.totalTrabajadoresCalculados,
        trabajadoresConObservaciones,
        trabajadoresOmitidos,
        totalHaberes: calculo.resumen.totalHaberes,
        totalDescuentos: calculo.resumen.totalDescuentos,
        totalLiquido: calculo.resumen.totalLiquidoPreliminar,
        totalCostoEmpresa: null,
      },
      trabajadores,
      bloqueos,
      advertencias,
      informaciones: [{
        codigo: 'RESULTADO_GENERADO',
        titulo: 'Resultado preliminar generado',
        descripcion: 'Revisa trabajadores, observaciones y totales antes de guardar.',
      }],
      detalleTecnico: {
        versionCalculo: snapshot?.versionMotor ?? 'Version no disponible',
        identificadorTecnico: snapshot?.hashSnapshot ?? 'Referencia interna no disponible',
        generadoEn: calculo.generadoEn,
      },
      ultimoGuardado: snapshot ? this.ultimoGuardadoDesdeSnapshot(snapshot) : undefined,
      acciones: {
        puedeRecalcular: this.validacionCalculo().puedeCalcular,
        puedeGuardarPreliminar,
        razonNoPuedeGuardar: puedeGuardarPreliminar
          ? undefined
          : this.razonNoPuedeGuardarResultado(bloqueos),
        helperGuardar: 'Guarda una versión revisable del cálculo. No emite liquidaciones ni cierra el período.',
        modoGuardadoLabel: 'Al guardar, se reemplazara el resultado preliminar activo del periodo.',
      },
    };
  });

  readonly revisionAprobacion = computed<RevisionAprobacionView>(() => {
    const resultado = this.resultadoPreliminar();
    const validacion = this.validacionCalculo();
    const guardado = resultado.ultimoGuardado;
    const hayResultadoActual = this.calculo() != null;
    const hayGuardado = guardado != null;
    const actualizadoSinGuardar = resultado.estado === 'actualizado_sin_guardar';
    const bloqueos = [
      ...resultado.bloqueos,
      ...validacion.bloqueos.map((item) => this.observacionDesdeValidacion(item)),
    ];
    const advertencias = [
      ...resultado.advertencias,
      ...validacion.advertencias.map((item) => this.observacionDesdeValidacion(item)),
    ];
    const informaciones: ResultadoObservacionView[] = [
      ...resultado.informaciones,
      ...validacion.informaciones.map((item) => this.observacionDesdeValidacion(item)),
    ];

    let estado: RevisionAprobacionEstado;
    if ((hayResultadoActual || hayGuardado) && (bloqueos.length > 0 || (guardado?.trabajadoresOmitidos ?? 0) > 0)) {
      estado = 'no_apto';
    } else if (!hayGuardado) {
      estado = hayResultadoActual ? 'pendiente_guardado' : 'sin_resultado_guardado';
    } else if (actualizadoSinGuardar) {
      estado = 'actualizado_sin_guardar';
    } else if (advertencias.length > 0 || (guardado?.trabajadoresConObservaciones ?? 0) > 0) {
      estado = 'pendiente_revision';
    } else {
      estado = 'listo';
    }

    const aprobacion = this.aprobacionOperativa();
    const aprobacionVigente =
      !!aprobacion &&
      hayGuardado &&
      !actualizadoSinGuardar &&
      aprobacion.identificadorResultado === (this.snapshotActivo()?.hashSnapshot ?? null);
    if (aprobacion) {
      estado = aprobacionVigente ? 'aprobado' : 'aprobado_desactualizado';
    }

    const puedeAprobar =
      hayGuardado &&
      !actualizadoSinGuardar &&
      bloqueos.length === 0 &&
      (guardado?.trabajadoresOmitidos ?? 0) === 0 &&
      validarPeriodoEntradaMensual(this.periodoSeleccionado()) &&
      !this.guardandoSnapshot() &&
      !this.aprobandoResultado() &&
      !this.nominaEstaCerradaOperativamente();

    return {
      estado,
      estadoLabel: this.etiquetaRevisionAprobacion(estado),
      descripcion: this.descripcionRevisionAprobacion(estado),
      checklist: this.checklistRevisionAprobacion({
        hayGuardado,
        guardado,
        actualizadoSinGuardar,
        hayResultadoActual,
        bloqueos,
        advertencias,
      }),
      bloqueos,
      advertencias,
      informaciones,
      accionPrincipalLabel: actualizadoSinGuardar || estado === 'pendiente_guardado'
        ? 'Guardar resultado actualizado'
        : hayGuardado
          ? 'Revisar resultado guardado'
          : 'Calcular preliminar',
      puedeGuardarActualizado: resultado.acciones.puedeGuardarPreliminar,
      puedeRecalcular: resultado.acciones.puedeRecalcular,
      puedeAprobar: puedeAprobar && !aprobacionVigente,
      razonNoPuedeAprobar: this.razonNoPuedeAprobar({
        hayResultadoActual,
        hayGuardado,
        actualizadoSinGuardar,
        bloqueos,
        omitidos: guardado?.trabajadoresOmitidos ?? 0,
        aprobacionVigente,
      }),
      aprobacion,
      notaAprobacion: 'Esta aprobación es interna y no reemplaza el cierre del período ni la emisión de liquidaciones oficiales.',
    };
  });

  readonly validacionCalculo = computed<ValidacionCalculoPreliminarView>(() => {
    const periodo = this.periodoSeleccionado();
    const resultado = this.resultado();
    const preNomina = this.preNomina();
    const base = this.baseNominaTrazabilidad();
    const bloqueos: ValidacionOperativaItemView[] = [];
    const advertencias: ValidacionOperativaItemView[] = [];
    const informaciones: ValidacionOperativaItemView[] = [];

    if (!validarPeriodoEntradaMensual(periodo)) {
      bloqueos.push({
        codigo: 'BLOQ-001',
        titulo: 'Período inválido',
        descripcion: 'Selecciona un período válido antes de generar la nómina mensual.',
        severidad: 'bloqueo',
        accionLabel: 'Seleccionar período válido',
      });
    }

    if (this.nominaEstaCerradaOperativamente()) {
      bloqueos.push({
        codigo: 'BLOQ-CIERRE-OPERATIVO',
        titulo: 'Nómina confirmada',
        descripcion: 'La nómina mensual está confirmada. Para modificarla, será necesario reabrir el período en una fase posterior.',
        severidad: 'bloqueo',
        accionLabel: 'Consultar resultado guardado',
      });
    }

    if (this.errorEjecucion()) {
      bloqueos.push({
        codigo: 'BLOQ-002',
        titulo: 'No fue posible cargar la información',
        descripcion: this.errorEjecucion() ?? 'Reintenta la validación del período.',
        severidad: 'bloqueo',
        accionLabel: 'Generar nómina',
        accionLocal: 'validarPeriodo',
      });
    }

    if (!resultado) {
      return this.buildValidacionCalculo({
        bloqueos,
        advertencias,
        informaciones,
        estadoForzado: bloqueos.length ? 'bloqueado' : 'pendiente',
        razonDeshabilitado: bloqueos.length
          ? bloqueos[0].descripcion
          : 'Genera la nómina mensual para revisar trabajadores.',
        siguienteAccion: bloqueos.length
          ? {
              label: bloqueos[0].accionLabel ?? 'Generar nómina',
              descripcion: bloqueos[0].descripcion,
              accionLocal: bloqueos[0].accionLocal,
            }
          : {
              label: 'Generar nómina',
              descripcion: 'Revisa trabajadores, parámetros, movimientos y recurrentes para generar la nómina mensual.',
              accionLocal: 'validarPeriodo',
            },
      });
    }

    for (const bloqueo of resultado.bloqueos) {
      bloqueos.push(this.itemDesdeMensaje(bloqueo, 'bloqueo'));
    }

    const faltantesMinimos = resultado.resumen.parametrosGrupos.filter((g) => this.parametroMinimoBloqueante(g.id, g.clasificacion));
    if (faltantesMinimos.length > 0 && !bloqueos.some((b) => b.codigo === 'BLOQ-004')) {
      bloqueos.push({
        codigo: 'BLOQ-004',
        titulo: 'Faltan parámetros mínimos para calcular',
        descripcion: 'Revisa los parámetros obligatorios del período antes de calcular preliminarmente.',
        severidad: 'bloqueo',
        accionLabel: 'Revisar parámetros',
        ruta: '/parametros',
      });
    }

    if (!preNomina) {
      bloqueos.push({
        codigo: 'BLOQ-005',
        titulo: 'Nómina mensual no generada',
        descripcion: 'Genera la nómina mensual para revisar trabajadores y entradas consideradas.',
        severidad: 'bloqueo',
        accionLabel: 'Generar nómina',
        accionLocal: 'generarBase',
      });
    } else if ((base?.trabajadoresConsiderados ?? preNomina.trabajadoresIncluidos) === 0) {
      bloqueos.push({
        codigo: 'BLOQ-003',
        titulo: 'No hay trabajadores considerados',
        descripcion: 'La nómina mensual no tiene trabajadores para revisar.',
        severidad: 'bloqueo',
        accionLabel: 'Actualizar nómina',
        accionLocal: 'actualizarBase',
      });
    }

    if (base?.bloqueados && base.bloqueados > 0) {
      bloqueos.push({
        codigo: 'BLOQ-006',
        titulo: 'Hay trabajadores bloqueados',
        descripcion: 'Revisa los trabajadores bloqueados antes de confirmar.',
        severidad: 'bloqueo',
        accionLabel: 'Revisar trabajadores',
      });
    }

    for (const advertencia of resultado.advertencias) {
      if (!this.parametroMinimoBloqueanteDesdeCodigo(advertencia.codigo)) {
        advertencias.push(this.itemDesdeMensaje(advertencia, 'advertencia'));
      }
    }

    const resumenEntradas = resultado.resumen.resumenEntradasMensuales;
    const totalMovimientosMes =
      (resumenEntradas?.novedadesMensuales ?? 0) + (resumenEntradas?.legacyMovimientos ?? 0);
    if (totalMovimientosMes === 0) {
      advertencias.push({
        codigo: 'ADV-001',
        titulo: 'No hay movimientos del periodo registrados',
        descripcion: 'Puedes continuar si este periodo no requiere bonos, descuentos, anticipos o ajustes.',
        severidad: 'advertencia',
        accionLabel: 'Revisar movimientos',
        ruta: '/remuneraciones/novedades-mensuales',
      });
    }

    if (resultado.resumen.recurrentesAplicablesAlPeriodo === 0) {
      advertencias.push({
        codigo: 'ADV-002',
        titulo: 'No hay movimientos recurrentes activos',
        descripcion: 'Puedes continuar si no aplican movimientos recurrentes para este periodo.',
        severidad: 'advertencia',
        accionLabel: 'Revisar recurrentes',
        ruta: '/remuneraciones/haberes-descuentos',
      });
    }

    if (base?.conObservaciones && base.conObservaciones > 0) {
      advertencias.push({
        codigo: 'ADV-003',
        titulo: 'Hay trabajadores con observaciones',
        descripcion: 'Las observaciones no bloqueantes deben revisarse antes de guardar un resultado.',
        severidad: 'advertencia',
        accionLabel: 'Revisar trabajadores',
      });
    }

    const parametrosOpcionales = resultado.resumen.parametrosGrupos.filter((g) => this.parametroOpcionalAdvertencia(g.id, g.clasificacion));
    if (parametrosOpcionales.length > 0) {
      advertencias.push({
        codigo: 'ADV-004',
        titulo: 'Hay parametros opcionales pendientes',
        descripcion: 'Puedes calcular preliminarmente; estos datos quedan para cierre o reconciliacion.',
        severidad: 'advertencia',
        accionLabel: 'Revisar parámetros',
        ruta: '/parametros',
      });
    }

    if (preNomina) {
      informaciones.push({
        codigo: 'INFO-001',
        titulo: 'Base de nomina generada',
        descripcion: 'La base esta disponible para revisar antes del calculo preliminar.',
        severidad: 'info',
      });
    }
    if (resultado.resumen.parametrosOperativos && faltantesMinimos.length === 0) {
      informaciones.push({
        codigo: 'INFO-002',
        titulo: 'Parametros minimos disponibles',
        descripcion: 'Los parametros necesarios para el calculo preliminar estan disponibles.',
        severidad: 'info',
      });
    }
    if (totalMovimientosMes > 0) {
      informaciones.push({
        codigo: 'INFO-003',
        titulo: 'Movimientos del periodo cargados',
        descripcion: 'Hay movimientos de remuneracion disponibles para la revision del periodo.',
        severidad: 'info',
      });
    }
    if (resultado.resumen.recurrentesAplicablesAlPeriodo > 0) {
      informaciones.push({
        codigo: 'INFO-004',
        titulo: 'Movimientos recurrentes cargados',
        descripcion: 'Hay movimientos recurrentes vigentes considerados para el periodo.',
        severidad: 'info',
      });
    }

    return this.buildValidacionCalculo({ bloqueos, advertencias, informaciones });
  });

  readonly dashboardResumen = computed(() => {
    const resultado = this.resultado();
    const preNomina = this.preNomina();
    const calculo = this.calculo();
    const snapshot = this.snapshotActivo();
    const resumen = resultado?.resumen;
    const conteoEstados = resumen?.conteoEntradasPorEstado ?? {};
    const movimientosAprobados =
      (conteoEstados['aprobada'] ?? 0) +
      (conteoEstados['incorporada_a_pre_nomina'] ?? 0) +
      (conteoEstados['calculada'] ?? 0) +
      (resumen?.conteoMovimientosPorEstado['VALIDADO'] ?? 0);
    const movimientosPendientes =
      (conteoEstados['borrador'] ?? 0) +
      (conteoEstados['pendiente_revision'] ?? 0) +
      (resumen?.conteoMovimientosPorEstado['BORRADOR'] ?? 0);

    return {
      estadoPeriodo: resultado?.estado ?? null,
      trabajadoresAptos: resumen?.trabajadoresActivosAptos ?? null,
      trabajadoresPorRevisar: resumen?.trabajadoresActivosNoAptos ?? null,
      parametrosListos: resumen?.parametrosOperativos ?? null,
      movimientosAprobados,
      movimientosPendientes,
      asignacionesAplicables: resumen?.recurrentesAplicablesAlPeriodo ?? null,
      asignacionesPorRevisar: resumen ? resumen.recurrentesInvalidas + resumen.recurrentesFueraDelMes : null,
      resultadoPreliminar: snapshot
        ? 'Guardado para revision'
        : calculo
          ? 'Calculado preliminar'
          : preNomina
            ? 'Base generada'
            : 'Sin calculo',
    };
  });

  readonly estadoOperativo = computed(() => {
    const validacion = this.validacionCalculo();
    const resultado = this.resultadoPreliminar();
    const revision = this.revisionAprobacion();
    return resolverEstadoOperativoProcesoMensual({
      periodoValido: validarPeriodoEntradaMensual(this.periodoSeleccionado()),
      tienePrevalidacion: this.resultado() != null,
      bloqueosPrevalidacion: validacion.bloqueos.map((item) => this.pendienteDesdeValidacion(item)),
      advertenciasPrevalidacion: validacion.advertencias.map((item) => this.pendienteDesdeValidacion(item, 'warning')),
      informacionesPrevalidacion: validacion.informaciones.map((item) => this.pendienteDesdeValidacion(item, 'info')),
      baseGenerada: this.preNomina() != null,
      calculoGenerado: this.calculo() != null,
      calculoConBloqueos: resultado.bloqueos.length > 0 || this.calculo()?.estado === 'con_bloqueos',
      calculoConAdvertencias: resultado.advertencias.length > 0,
      bloqueosCalculo: resultado.bloqueos.map((item) => this.pendienteDesdeResultado(item, 'danger')),
      advertenciasCalculo: resultado.advertencias.map((item) => this.pendienteDesdeResultado(item, 'warning')),
      resultadoGuardado: this.snapshotActivo() != null,
      aprobadoOperativamente: this.aprobacionOperativa() != null,
      cerradoOperativamente: this.nominaEstaCerradaOperativamente(),
      liquidacionesDisponibles: false,
      puedeGenerarBase: this.puedeGenerarPreNomina(),
      puedeCalcular: this.puedeCalcularPreliminar(),
      puedeGuardarResultado: resultado.acciones.puedeGuardarPreliminar,
      puedeAprobar: revision.puedeAprobar,
      puedeCerrar: this.puedeCerrarNominaOperativa(),
      razonNoPuedeGuardar: resultado.acciones.razonNoPuedeGuardar,
      razonNoPuedeAprobar: revision.razonNoPuedeAprobar,
      razonNoPuedeCerrar: this.cierreOperativo().razonNoPuedeCerrar,
    });
  });

  readonly nominaResumenSuperior = computed<NominaResumenSuperiorVm>(() => {
    const resumen = this.dashboardResumen();
    const snapshot = this.snapshotActivo();
    return {
      trabajadores:
        resumen.trabajadoresAptos == null
          ? 'Sin evaluar'
          : `${resumen.trabajadoresAptos} incluido${resumen.trabajadoresAptos === 1 ? '' : 's'}`,
      parametros:
        resumen.parametrosListos == null ? 'Sin evaluar' : resumen.parametrosListos ? 'Revisados' : 'Por revisar',
      movimientos: `${resumen.movimientosAprobados} aprobados · ${resumen.movimientosPendientes} pendientes`,
      recurrentes:
        resumen.asignacionesAplicables == null
          ? 'Sin evaluar'
          : `${resumen.asignacionesAplicables} vigente${resumen.asignacionesAplicables === 1 ? '' : 's'}`,
      cambios: this.estadoOperativo().advertencias.length + (snapshot?.totalAdvertencias ?? 0),
      bloqueos: this.estadoOperativo().bloqueos.length + (snapshot?.totalBloqueados ?? 0),
    };
  });

  readonly nominaVisualFrame = computed<NominaVisualFrame>(() => {
    if (this.validando() || this.generandoPreNomina() || this.calculandoPreliminar()) return 'generando';

    const estado = this.estadoOperativo().estadoClave;
    if (estado === 'liquidaciones_disponibles') return 'liquidaciones_generadas';
    if (estado === 'nomina_cerrada') return 'confirmada';
    if (estado === 'aprobado_operativamente' || estado === 'resultado_guardado' || estado === 'resultado_listo_para_guardar') {
      return 'lista_para_confirmar';
    }
    if (estado === 'periodo_con_pendientes' || estado === 'resultado_con_bloqueos') return 'con_pendientes';
    if (estado === 'base_lista' || estado === 'resultado_preliminar_revisable') return 'en_revision';
    return 'sin_generar';
  });

  readonly nominaWorkspaceTabSugerida = computed<NominaWorkspaceTab>(() => {
    const frame = this.nominaVisualFrame();
    if (frame === 'en_revision' || frame === 'con_pendientes') return 'trabajadores';
    if (frame === 'confirmada' || frame === 'liquidaciones_generadas') return 'detalle';
    return 'guia';
  });

  private readonly syncNominaWorkspaceTab = effect(() => {
    const tab = this.nominaWorkspaceTabSugerida();
    untracked(() => this.nominaWorkspaceTab.set(tab));
  });

  readonly nominaFrame = computed<NominaVisualFrameView>(() => {
    const frame = this.nominaVisualFrame();
    const accion = this.estadoOperativo().accionPrincipal;
    const periodo = this.periodoActivo.etiqueta();
    const bloqueos = this.estadoOperativo().bloqueos.length;
    const advertencias = this.estadoOperativo().advertencias.length;
    const trabajadores = this.dashboardResumen().trabajadoresAptos ?? this.snapshotActivo()?.totalTrabajadores ?? 0;

    const base = (data: Omit<NominaVisualFrameView, 'frame' | 'ctaLabel' | 'ctaDisabled' | 'ctaTipo' | 'ctaRuta' | 'ctaAccion'>): NominaVisualFrameView => ({
      frame,
      ...data,
      ctaLabel: accion.label,
      ctaDisabled: !!accion.disabled || this.accionPeriodoEnCurso(),
      ctaTipo: accion.tipo,
      ctaRuta: accion.ruta,
      ctaAccion: accion.accionLocal,
    });

    switch (frame) {
      case 'generando':
        return base({
          chip: 'Generando',
          titulo: 'Estamos preparando la nómina mensual.',
          texto: 'El sistema está revisando trabajadores, parámetros, movimientos y recurrentes para construir el borrador del período.',
          info: 'Este paso genera una versión preliminar, todavía no oficial.',
        });
      case 'en_revision':
        return base({
          chip: 'En revisión',
          titulo: 'Nómina preliminar generada.',
          texto: 'Revisa trabajadores con cambios, advertencias o bloqueos antes de confirmar la nómina mensual.',
          info: `Hay ${trabajadores} trabajadores incluidos: ${this.resumenRevisionTrabajadores()}.`,
        });
      case 'con_pendientes':
        return base({
          chip: 'Con pendientes',
          titulo: 'Hay trabajadores con datos obligatorios pendientes.',
          texto: 'Resuelve los bloqueos críticos antes de confirmar la nómina mensual del período.',
          info: bloqueos > 0
            ? `${bloqueos} bloqueo${bloqueos === 1 ? '' : 's'} crítico${bloqueos === 1 ? '' : 's'} requiere${bloqueos === 1 ? '' : 'n'} revisión.`
            : 'Los cambios no confirmados quedarán registrados en el historial operativo.',
        });
      case 'lista_para_confirmar':
        return base({
          chip: 'Lista para confirmar',
          titulo: 'La nómina mensual está lista para confirmar.',
          texto: 'Todos los bloqueos críticos fueron resueltos. Puedes confirmar esta versión como base oficial del período.',
          info: 'Al confirmar, las liquidaciones se generarán desde esta versión y no desde datos vivos.',
        });
      case 'confirmada':
        return base({
          chip: 'Confirmada',
          titulo: 'Nómina mensual confirmada.',
          texto: 'Esta versión quedó bloqueada como base oficial para generar liquidaciones del período.',
          info: 'Si cambian datos posteriores, se requerirá una nueva versión o recálculo explícito.',
        });
      case 'liquidaciones_generadas':
        return base({
          chip: 'Liquidaciones generadas',
          titulo: 'Liquidaciones generadas desde la nómina confirmada.',
          texto: 'Las liquidaciones del período ya fueron emitidas usando la versión oficial de la nómina mensual.',
          info: `La trazabilidad queda asociada al snapshot confirmado de ${periodo}.`,
        });
      case 'sin_generar':
      default:
        return base({
          chip: 'Sin generar',
          titulo: `Todavía no existe una nómina mensual para ${periodo}.`,
          texto: 'Genera una versión preliminar para revisar trabajadores, parámetros, movimientos y recurrentes antes de confirmar.',
          info: advertencias > 0
            ? `El período tiene ${advertencias} advertencia${advertencias === 1 ? '' : 's'} revisable${advertencias === 1 ? '' : 's'} antes de generar.`
            : 'La nómina confirmada será la base oficial para generar liquidaciones.',
        });
    }
  });

  readonly nominaPendientesVisuales = computed<ProcesoMensualPendienteVm[]>(() => {
    const pendientes = [
      ...this.estadoOperativo().bloqueos,
      ...this.estadoOperativo().advertencias,
    ];
    if (pendientes.length) return pendientes.slice(0, 5);

    return this.payrollWorkerDetailRows()
      .filter((row) => row.estado !== 'Listo' && row.estado !== 'Calculado')
      .slice(0, 5)
      .map((row) => ({
        codigo: row.trabajador,
        titulo: row.trabajador,
        descripcion: row.observacion,
        severidad: row.estado === 'Bloqueado' || row.estado === 'Omitido' ? 'danger' : 'warning',
        accionLabel: row.accion,
      }));
  });

  readonly nominaHistorialVisual = computed(() => {
    const snapshot = this.snapshotActivo();
    const cierre = snapshot?.cierreOperativo;
    const items: Array<{ hora: string; texto: string; destacado: boolean }> = [];
    if (this.preNomina()) items.push({ hora: this.horaCorta(this.preNomina()?.generadoEn), texto: 'Se generó nómina mensual preliminar.', destacado: false });
    if (snapshot) items.push({ hora: this.horaCorta(snapshot.fechaGeneracion), texto: 'Se guardó una versión revisable del período.', destacado: false });
    if (snapshot?.aprobacionOperativa) items.push({ hora: this.horaCorta(snapshot.aprobacionOperativa.fecha), texto: 'Se revisó la nómina mensual.', destacado: false });
    if (cierre) items.push({ hora: this.horaCorta(cierre.fecha), texto: 'Se confirmó la nómina mensual.', destacado: true });
    if (!items.length) {
      items.push({ hora: '--:--', texto: 'Aún no hay eventos del período.', destacado: false });
    }
    return items;
  });

  readonly etapaOperativaActiva = computed<EtapaOperativaActiva>(() => {
    return this.estadoOperativo().disclosureActivo;
  });

  readonly bitacoraEtapas = computed<BitacoraEtapaVm[]>(() => {
    const estado = this.estadoOperativo();
    const etapaActiva = estado.etapaActiva;
    const validado = this.resultado() != null;
    const baseLista = this.preNomina() != null;
    const calculoListo = this.calculo() != null;
    const guardado = this.snapshotActivo() != null;
    const aprobado = this.aprobacionOperativa() != null;
    const cerrada = this.nominaEstaCerradaOperativamente();
    const advertencias = estado.advertencias.length;
    const bloqueos = estado.bloqueos.length;

    const marca = (hecho: boolean, actual: boolean): BitacoraSubpasoMarca =>
      hecho ? 'hecho' : actual ? 'actual' : 'pendiente';

    const etapaCalculoActiva = etapaActiva === 'calculo' || etapaActiva === 'guardar';
    const calculoBloqueada = estado.estadoClave === 'resultado_con_bloqueos';

    const resumenValidar = (): string => {
      if (validado && etapaActiva !== 'validar') return 'Periodo revisado';
      if (etapaActiva === 'validar') return validado ? 'Periodo revisado' : 'Generacion de nomina en curso';
      return 'Sin generar';
    };

    const resumenBase = (): string => {
      if (baseLista) return 'Borrador generado';
      if (etapaActiva === 'base') return 'Generar nomina mensual';
      return validado ? 'Pendiente de nomina' : 'Requiere revision previa';
    };

    const resumenCalculo = (): string => {
      if (calculoBloqueada) return bloqueos === 1 ? '1 bloqueo por resolver' : `${bloqueos} bloqueos por resolver`;
      if (guardado && !etapaCalculoActiva) return 'Version revisable guardada';
      if (advertencias && (calculoListo || etapaCalculoActiva)) {
        return advertencias === 1 ? '1 advertencia revisable' : `${advertencias} advertencias revisables`;
      }
      if (calculoListo) return 'Trabajadores en revision';
      if (etapaCalculoActiva) return 'Revision de trabajadores en curso';
      return baseLista ? 'Pendiente de revision' : 'Requiere nomina generada';
    };

    const resumenAprobar = (): string => {
      if (cerrada) return 'Nomina confirmada';
      if (aprobado) return 'Lista para confirmar';
      if (guardado) return 'Pendiente de confirmacion';
      if (etapaActiva === 'aprobar_cerrar') return 'Confirmacion en curso';
      return 'Pendiente de version revisable';
    };

    const resumenLiquidaciones = (): string => {
      if (estado.estadoClave === 'liquidaciones_disponibles') return 'Liquidaciones generadas';
      if (cerrada) return 'Listas para generar';
      if (etapaActiva === 'liquidaciones') return 'Generacion disponible';
      return 'Disponible al confirmar nomina';
    };

    const subpasosValidar = (): BitacoraSubpasoVm[] => {
      if (etapaActiva !== 'validar') return [];
      return [
        { marca: marca(validado, !validado), etiqueta: 'Generar nomina' },
        { marca: 'pendiente', etiqueta: 'Revisar trabajadores' },
        { marca: 'pendiente', etiqueta: 'Revisar parametros' },
        { marca: 'pendiente', etiqueta: 'Movimientos y recurrentes' },
      ];
    };

    const subpasosBase = (): BitacoraSubpasoVm[] => {
      if (etapaActiva !== 'base') return [];
      return [
        { marca: marca(baseLista, !baseLista), etiqueta: 'Armar borrador' },
        { marca: marca(false, baseLista), etiqueta: 'Revisar trabajadores' },
      ];
    };

    const subpasosCalculo = (): BitacoraSubpasoVm[] => {
      if (!etapaCalculoActiva) return [];
      return [
        { marca: marca(calculoListo, !calculoListo), etiqueta: 'Revisar trabajadores' },
        {
          marca: marca(guardado, calculoListo && !guardado),
          etiqueta: 'Revisar totales',
        },
        {
          marca: !advertencias ? 'hecho' : calculoListo ? 'actual' : 'pendiente',
          etiqueta: 'Resolver advertencias',
        },
        { marca: marca(guardado, calculoListo && !guardado && !advertencias), etiqueta: 'Guardar version revisable' },
      ];
    };

    const subpasosAprobar = (): BitacoraSubpasoVm[] => {
      if (etapaActiva !== 'aprobar_cerrar') return [];
      return [
        { marca: marca(aprobado, !aprobado), etiqueta: 'Confirmar revision' },
        { marca: marca(cerrada, aprobado && !cerrada), etiqueta: 'Confirmar nomina' },
      ];
    };

    const subpasosLiquidaciones = (): BitacoraSubpasoVm[] => {
      if (etapaActiva !== 'liquidaciones') return [];
      return [
        { marca: marca(cerrada, !cerrada), etiqueta: 'Generar liquidaciones' },
        { marca: 'pendiente', etiqueta: 'Ver liquidaciones' },
      ];
    };

    return [
      {
        clave: 'validar',
        etiqueta: 'Generar nómina',
        resumen: resumenValidar(),
        activa: etapaActiva === 'validar',
        completada: validado && etapaActiva !== 'validar',
        bloqueada: false,
        subpasos: subpasosValidar(),
      },
      {
        clave: 'base',
        etiqueta: 'Revisar trabajadores',
        resumen: resumenBase(),
        activa: etapaActiva === 'base',
        completada: baseLista && etapaActiva !== 'validar' && etapaActiva !== 'base',
        bloqueada: false,
        subpasos: subpasosBase(),
      },
      {
        clave: 'calculo',
        etiqueta: 'Resolver pendientes',
        resumen: resumenCalculo(),
        activa: etapaCalculoActiva,
        completada: guardado && !etapaCalculoActiva,
        bloqueada: calculoBloqueada,
        subpasos: subpasosCalculo(),
      },
      {
        clave: 'aprobar_cerrar',
        etiqueta: 'Confirmar nómina',
        resumen: resumenAprobar(),
        activa: etapaActiva === 'aprobar_cerrar',
        completada: cerrada,
        bloqueada: false,
        subpasos: subpasosAprobar(),
      },
      {
        clave: 'liquidaciones',
        etiqueta: 'Generar liquidaciones',
        resumen: resumenLiquidaciones(),
        activa: etapaActiva === 'liquidaciones',
        completada: estado.estadoClave === 'liquidaciones_disponibles',
        bloqueada: false,
        subpasos: subpasosLiquidaciones(),
      },
    ];
  });

  readonly registroPeriodoLinea = computed(() => {
    const partes = [
      this.resultado() ? 'periodo revisado' : 'nomina sin generar',
      this.preNomina() ? 'borrador generado' : 'borrador pendiente',
      this.calculo() ? 'trabajadores revisados' : 'revision pendiente',
      this.snapshotActivo() ? 'version revisable guardada' : 'version revisable pendiente',
    ];
    if (this.nominaEstaCerradaOperativamente()) {
      partes.push('nomina confirmada');
    } else if (this.aprobacionOperativa()) {
      partes.push('lista para confirmar');
    } else if (this.snapshotActivo()) {
      partes.push('confirmacion pendiente');
    }
    return partes.join(' · ');
  });

  readonly bitacoraRailEtapas = computed<BitacoraRailEtapaVm[]>(() =>
    this.bitacoraEtapas().map((etapa) => ({
      clave: etapa.clave,
      etiqueta: etapa.etiqueta,
      estadoCorto: etapa.bloqueada
        ? 'Bloqueado'
        : etapa.completada && !etapa.activa
          ? 'Listo'
          : etapa.activa
            ? 'En curso'
            : 'Pendiente',
      marca: etapa.bloqueada
        ? 'bloqueado'
        : etapa.completada && !etapa.activa
          ? 'hecho'
          : etapa.activa
            ? 'actual'
            : 'pendiente',
      activa: etapa.activa,
    })),
  );

  readonly alertasPeriodoResumen = computed<AlertasPeriodoResumenVm>(() => {
    if (this.validando()) {
      return {
        modo: 'evaluando',
        mensaje: 'Generando revisión del período...',
        criticas: 0,
        advertencias: 0,
        mostrarDetalle: false,
      };
    }

    const estado = this.estadoOperativo();
    const criticas = estado.bloqueos.length;
    const advertencias = estado.advertencias.length;

    if (this.resultado() == null) {
      return {
        modo: 'sin-evaluar',
        mensaje: 'Genera la nómina mensual para ver trabajadores que requieren revisión.',
        criticas: 0,
        advertencias: 0,
        mostrarDetalle: false,
      };
    }

    if (!criticas && !advertencias) {
      return {
        modo: 'ok',
        mensaje: 'Sin bloqueos críticos para confirmar.',
        criticas: 0,
        advertencias: 0,
        mostrarDetalle: false,
      };
    }

    return {
      modo: 'alertas',
      criticas,
      advertencias,
      mostrarDetalle: true,
    };
  });

  readonly paraContinuarLista = computed<ParaContinuarItemVm[]>(() =>
    this.estadoOperativo()
      .queFaltaAhora.slice(0, 6)
      .map((item) => ({
        titulo: this.humanizarCopyOperativo(item.titulo),
        detalle: this.humanizarCopyOperativo(item.descripcion),
      }))
      .filter((item) => item.titulo.length > 0),
  );

  readonly actaPreparacion = computed<ActaOperativaPeriodoViewModel>(() => {
    const estadoOperativo = this.estadoOperativo();
    const resumen = this.dashboardResumen();
    const resultado = this.resultadoPreliminar();
    const snapshot = this.snapshotActivo();
    const bloqueos = [
      ...estadoOperativo.bloqueos.map((item) => item.titulo),
      ...resultado.bloqueos.map((item) => item.titulo),
    ];
    const advertencias = [
      ...estadoOperativo.advertencias.map((item) => item.titulo),
      ...resultado.advertencias.map((item) => item.titulo),
    ];
    const tieneValidacionMinima = validarPeriodoEntradaMensual(this.periodoSeleccionado()) && (
      this.resultado() != null || this.preNomina() != null || this.calculo() != null || snapshot != null
    );
    return buildActaOperativaPeriodoViewModel({
      periodoLabel: this.periodoActivo.etiqueta() || this.periodoSeleccionado(),
      periodoValido: validarPeriodoEntradaMensual(this.periodoSeleccionado()),
      tieneValidacionMinima,
      actaPreparadaEnSesion: this.actaOperativaPreparada(),
      estadoPeriodoLabel: estadoOperativo.titulo,
      parametrosLabel: resumen.parametrosListos == null ? 'Pendiente de validacion' : resumen.parametrosListos ? 'Listos' : 'Por revisar',
      trabajadoresLabel: resumen.trabajadoresAptos == null
        ? 'Pendiente de validacion'
        : `${resumen.trabajadoresAptos} apto${resumen.trabajadoresAptos === 1 ? '' : 's'} / ${resumen.trabajadoresPorRevisar} por revisar`,
      movimientosLabel: `${resumen.movimientosAprobados} aprobados / ${resumen.movimientosPendientes} pendientes`,
      asignacionesLabel: resumen.asignacionesAplicables == null
        ? 'Pendiente de validacion'
        : `${resumen.asignacionesAplicables} aplicables / ${resumen.asignacionesPorRevisar} por revisar`,
      resultadoPreliminarLabel: resumen.resultadoPreliminar,
      resultadoGuardado: snapshot != null,
      bloqueos,
      advertencias,
      pendientes: estadoOperativo.queFaltaAhora.map((item) => item.titulo),
    });
  });

  readonly payrollWorkerDetailRows = computed<PayrollWorkerDetailRow[]>(() => {
    const base = this.baseNominaTrazabilidad();
    if (base?.trabajadores.length) {
      return base.trabajadores.map((trabajador) => ({
        trabajador: trabajador.trabajadorLabel || 'Trabajador sin ficha visible',
        rut: trabajador.rutLabel || 'RUT no disponible',
        estado: this.etiquetaEstadoBaseTrabajador(trabajador.estado),
        observacion: trabajador.observacion || 'Sin observaciones',
        accion: trabajador.estado === 'bloqueado' || trabajador.estado === 'excluido'
          ? 'Revisar ficha del trabajador'
          : trabajador.estado === 'con_observaciones'
            ? 'Revisar antes de calcular'
            : 'Sin acción pendiente',
      }));
    }

    return this.resultadoPreliminar().trabajadores.map((trabajador) => ({
      trabajador: trabajador.trabajadorLabel,
      rut: trabajador.rutLabel,
      estado: trabajador.estadoLabel,
      observacion: trabajador.observacionLabel,
      accion: trabajador.accionLabel ?? 'Sin acción pendiente',
    }));
  });

  readonly payrollMovementDetailRows = computed<PayrollMovementDetailRow[]>(() => {
    const trabajadorPorId = this.trabajadorLabelPorId();
    return (this.resultado()?.entradasMensuales ?? [])
      .filter((entrada) => entrada.origen !== 'recurrente')
      .map((entrada) => ({
        trabajador: trabajadorPorId.get(entrada.idPersona) ?? 'Trabajador por revisar',
        concepto: this.etiquetaConceptoEntrada(entrada.idConcepto, entrada.tipoMovimiento, entrada.categoria),
        tipo: this.etiquetaTipoEntrada(entrada.tipoEntrada),
        monto: this.formatoMonto(entrada.monto),
        estado: this.etiquetaEstadoEntrada(entrada.estado),
        accion: entrada.bloqueaProceso || entrada.requiereRevision ? 'Revisar movimiento del mes' : 'Sin acción pendiente',
      }));
  });

  readonly payrollRecurrentDetailRows = computed<PayrollRecurrentDetailRow[]>(() => {
    const trabajadorPorId = this.trabajadorLabelPorId();
    const recurrentesDesdeEntradas = (this.resultado()?.entradasMensuales ?? [])
      .filter((entrada) => entrada.origen === 'recurrente')
      .map<PayrollRecurrentDetailRow>((entrada) => ({
        trabajador: trabajadorPorId.get(entrada.idPersona) ?? 'Trabajador por revisar',
        concepto: this.etiquetaConceptoEntrada(entrada.idConcepto, entrada.tipoMovimiento, entrada.categoria),
        periodicidad: 'Mensual',
        monto: this.formatoMonto(entrada.monto),
        estado: this.etiquetaEstadoEntrada(entrada.estado),
        accion: entrada.bloqueaProceso || entrada.requiereRevision ? 'Revisar asignación recurrente' : 'Sin acción pendiente',
      }));

    if (recurrentesDesdeEntradas.length) {
      return recurrentesDesdeEntradas;
    }

    return (this.baseNominaTrazabilidad()?.trabajadores ?? [])
      .filter((trabajador) => trabajador.asignacionesRecurrentes > 0)
      .map((trabajador) => ({
        trabajador: trabajador.trabajadorLabel || 'Trabajador sin ficha visible',
        concepto: `${trabajador.asignacionesRecurrentes} asignación(es) recurrente(s)`,
        periodicidad: 'Mensual',
        monto: 'Ver detalle en recurrentes',
        estado: trabajador.estado === 'bloqueado' ? 'Por revisar' : 'Considerada',
        accion: 'Ir a asignaciones recurrentes',
      }));
  });

  readonly payrollObservationDetailRows = computed<PayrollObservationDetailRow[]>(() => {
    const estado = this.estadoOperativo();
    const rows: PayrollObservationDetailRow[] = [
      ...estado.bloqueos.map((item) => this.observacionGridDesdePendiente(item, 'Bloqueo')),
      ...estado.advertencias.map((item) => this.observacionGridDesdePendiente(item, 'Advertencia')),
      ...estado.informaciones.map((item) => this.observacionGridDesdePendiente(item, 'Información')),
    ];

    for (const item of this.resultadoPreliminar().bloqueos) {
      rows.push(this.observacionGridDesdeResultado(item, 'Bloqueo'));
    }
    for (const item of this.resultadoPreliminar().advertencias) {
      rows.push(this.observacionGridDesdeResultado(item, 'Advertencia'));
    }
    return rows;
  });

  readonly payrollParametroSeguimientoItems = computed<PayrollSeguimientoItem[]>(() => {
    const estado = this.estadoOperativo();
    const items = [...estado.bloqueos, ...estado.advertencias, ...estado.informaciones]
      .filter((item) => item.ruta === '/parametros' || this.ambitoDesdeCodigo(item.codigo) === 'Parámetros')
      .map((item) => ({
        titulo: item.titulo,
        descripcion: item.descripcion,
        estado: this.etiquetaPendienteVisual(item.severidad),
        estadoClase: this.clasePendienteVisual(item.severidad),
        accion: item.accionLabel ?? 'Revisar parámetros',
        ruta: item.ruta ?? '/parametros',
      }));

    if (items.length) return items;

    const parametrosListos = this.dashboardResumen().parametrosListos;
    return [{
      titulo: parametrosListos ? 'Parámetros revisados' : 'Parámetros del período',
      descripcion: parametrosListos == null
        ? 'Genera la nómina mensual para evaluar parámetros del período.'
        : parametrosListos
          ? 'Los parámetros mínimos del período están disponibles para la nómina.'
          : 'Hay parámetros del período que requieren revisión antes de confirmar.',
      estado: parametrosListos ? 'Revisados' : parametrosListos == null ? 'Sin evaluar' : 'Revisar',
      estadoClase: parametrosListos ? 'payroll-state-chip payroll-state-chip--success' : 'payroll-state-chip payroll-state-chip--warning',
      accion: 'Abrir parámetros',
      ruta: '/parametros',
    }];
  });

  readonly payrollMovimientoRecurrenteSeguimientoItems = computed<PayrollSeguimientoItem[]>(() => {
    const movimientos = this.payrollMovementDetailRows().map((row) => ({
      titulo: row.concepto,
      descripcion: `${row.trabajador} · ${row.tipo} · ${row.monto}`,
      estado: row.estado,
      estadoClase: this.claseChipRevision(row.estado),
      accion: row.accion === 'Sin acción pendiente' ? 'Ver movimientos' : row.accion,
      ruta: '/remuneraciones/novedades-mensuales',
    }));
    const recurrentes = this.payrollRecurrentDetailRows().map((row) => ({
      titulo: row.concepto,
      descripcion: `${row.trabajador} · ${row.periodicidad} · ${row.monto}`,
      estado: row.estado,
      estadoClase: this.claseChipRevision(row.estado),
      accion: row.accion === 'Sin acción pendiente' ? 'Ver recurrentes' : row.accion,
      ruta: '/remuneraciones/haberes-descuentos',
    }));
    const items = [...movimientos, ...recurrentes].slice(0, 12);
    if (items.length) return items;

    return [{
      titulo: 'Movimientos y recurrentes',
      descripcion: 'No hay movimientos del mes ni asignaciones recurrentes aplicables visibles para este período.',
      estado: 'Sin movimientos',
      estadoClase: 'payroll-state-chip payroll-state-chip--info',
      accion: 'Abrir movimientos',
      ruta: '/remuneraciones/novedades-mensuales',
    }];
  });

  readonly payrollResultadoSeguimientoItems = computed<PayrollSeguimientoItem[]>(() => {
    const resultado = this.resultadoPreliminar();
    const snapshot = this.snapshotActivo();
    return [
      {
        titulo: 'Trabajadores calculados',
        descripcion: `${resultado.resumen.trabajadoresCalculados} trabajadores calculados, ${resultado.resumen.trabajadoresConObservaciones} con observaciones y ${resultado.resumen.trabajadoresOmitidos} omitidos.`,
        estado: resultado.estadoLabel,
        estadoClase: this.claseChipRevision(resultado.estadoLabel),
        accion: 'Revisar trabajadores',
      },
      {
        titulo: 'Totales preliminares',
        descripcion: `Haberes ${this.formatoMonto(resultado.resumen.totalHaberes)} · Descuentos ${this.formatoMonto(resultado.resumen.totalDescuentos)} · Líquido ${this.formatoMonto(resultado.resumen.totalLiquido)}.`,
        estado: resultado.resumen.totalLiquido == null ? 'Sin resultado' : 'Calculado',
        estadoClase: resultado.resumen.totalLiquido == null ? 'payroll-state-chip payroll-state-chip--info' : 'payroll-state-chip payroll-state-chip--success',
        accion: 'Ver resumen',
      },
      {
        titulo: 'Versión revisable',
        descripcion: snapshot ? `Guardada el ${this.formatoFechaHora(snapshot.fechaGeneracion)}.` : 'Aún no existe una versión revisable guardada para confirmar.',
        estado: snapshot ? 'Guardada' : 'Pendiente',
        estadoClase: snapshot ? 'payroll-state-chip payroll-state-chip--success' : 'payroll-state-chip payroll-state-chip--warning',
        accion: snapshot ? 'Ver detalle' : 'Generar nómina',
      },
    ];
  });

  readonly payrollResultDetailRows = computed<PayrollResultDetailRow[]>(() => {
    return this.resultadoPreliminar().trabajadores.map((trabajador) => ({
      trabajador: trabajador.trabajadorLabel,
      haberes: trabajador.haberesLabel,
      descuentos: trabajador.descuentosLabel,
      liquido: trabajador.liquidoLabel,
      estado: trabajador.estadoLabel,
      observacion: trabajador.observacionLabel,
    }));
  });

  mostrarDetalleOperativo(etapa: EtapaOperativaActiva): boolean {
    const estado = this.estadoOperativo().estadoClave;
    const orden: Record<EtapaOperativaActiva, number> = {
      base: 1,
      calculo: 2,
      resultado: 2,
      guardado: 3,
      aprobacion: 4,
      cierre: 5,
      liquidaciones: 6,
    };
    const etapaPorEstado: Record<string, number> = {
      pendiente_validacion: 0,
      periodo_con_pendientes: 1,
      listo_para_generar_base: 1,
      base_lista: 2,
      resultado_con_bloqueos: 2,
      resultado_preliminar_revisable: 2,
      resultado_listo_para_guardar: 2,
      resultado_guardado: 4,
      aprobado_operativamente: 5,
      nomina_cerrada: 6,
      liquidaciones_disponibles: 6,
    };
    const maxEtapa = etapaPorEstado[estado] ?? 0;
    return orden[etapa] <= maxEtapa && maxEtapa > 0;
  }

  readonly pasosPeriodo = computed<PasoPeriodoView[]>(() => {
    return this.estadoOperativo().timeline;
  });

  readonly siguienteAccion = computed(() => {
    const accion = this.validacionCalculo().siguienteAccion;
    const calculo = this.calculo();
    const snapshot = this.snapshotActivo();

    if (!calculo) {
      return `${accion.label}: ${accion.descripcion}`;
    }
    if (!snapshot) {
      return 'Guarda el resultado preliminar para revision.';
    }
    return 'Resultado preliminar disponible para revision.';
  });

  validarPeriodo(): void {
    const p = this.periodoSeleccionado();
    this.validando.set(true);
    this.errorEjecucion.set(null);
    void this.procesoMensual
      .ejecutarPrevalidaciones(p)
      .then((r) => {
        this.resultado.set(r);
        this.preNomina.set(null);
        this.calculo.set(null);
        this.snapshotActivo.set(null);
        this.errorGuardadoResultado.set(null);
        this.errorAprobacionOperativa.set(null);
        this.errorCierreOperativo.set(null);
        this.exitoGuardadoResultado.set(null);
        this.identificadorResultadoGuardadoActual.set(null);
        this.aprobacionOperativa.set(null);
        this.snapshotCompleto.set(null);
        this.errorSnapshotCompleto.set(null);
        return this.cargarSnapshotActivo(p);
      })
      .catch((e: unknown) => {
        this.resultado.set(null);
        this.errorEjecucion.set(e instanceof Error ? e.message : String(e));
      })
      .finally(() => {
        this.validando.set(false);
      });
  }

  generarPreNomina(): void {
    const p = this.periodoSeleccionado();
    this.generandoPreNomina.set(true);
    this.errorEjecucion.set(null);
    void this.procesoMensual
      .generarPreNominaPeriodo(p)
      .then((r) => {
        this.preNomina.set(r);
        this.calculo.set(null);
        this.snapshotActivo.set(null);
        this.errorGuardadoResultado.set(null);
        this.errorAprobacionOperativa.set(null);
        this.errorCierreOperativo.set(null);
        this.exitoGuardadoResultado.set(null);
        this.identificadorResultadoGuardadoActual.set(null);
        this.aprobacionOperativa.set(null);
        this.snapshotCompleto.set(null);
        this.errorSnapshotCompleto.set(null);
      })
      .catch((e: unknown) => {
        this.preNomina.set(null);
        this.errorEjecucion.set(e instanceof Error ? e.message : String(e));
      })
      .finally(() => {
        this.generandoPreNomina.set(false);
      });
  }

  calcularPreliminar(): void {
    if (!this.puedeCalcularPreliminar()) return;
    const p = this.periodoSeleccionado();
    this.calculandoPreliminar.set(true);
    this.errorEjecucion.set(null);
    void this.procesoMensual
      .generarCalculoPeriodo(p)
      .then((r) => {
        this.calculo.set(r);
        this.errorGuardadoResultado.set(null);
        this.errorAprobacionOperativa.set(null);
        this.exitoGuardadoResultado.set(null);
        this.identificadorResultadoGuardadoActual.set(null);
        this.snapshotCompleto.set(null);
        this.errorSnapshotCompleto.set(null);
      })
      .catch((e: unknown) => {
        this.calculo.set(null);
        this.errorEjecucion.set(e instanceof Error ? e.message : String(e));
      })
      .finally(() => {
        this.calculandoPreliminar.set(false);
      });
  }

  guardarSnapshotPreliminar(): void {
    this.confirmacionProceso.set({
      tipo: 'guardar_preliminar',
      titulo: 'Guardar versión revisable',
      mensaje: 'Se guardara una version revisable de la nomina mensual para este periodo.',
      detalle: 'No emite liquidaciones, no confirma la nomina y no genera archivos legales.',
      puntos: [
        'Quedara disponible para revision y confirmacion operativa.',
        'Si cambias datos del periodo, deberas calcular y guardar una nueva version.',
      ],
      primaryLabel: 'Guardar version',
      secondaryLabel: 'Cancelar',
    });
  }

  private ejecutarGuardarSnapshotPreliminar(): void {
    const p = this.periodoSeleccionado();
    this.guardandoSnapshot.set(true);
    this.errorEjecucion.set(null);
    this.errorGuardadoResultado.set(null);
    this.errorCierreOperativo.set(null);
    this.exitoGuardadoResultado.set(null);
    void this.procesoMensual
      .guardarSnapshotPreliminar(p)
      .then((r) => {
        if (!r.ok || !r.snapshot) {
          const msg = r.issues.map((i) => i.mensaje).join(' ') || 'No se pudo guardar la version revisable.';
          throw new Error(msg);
        }
        this.aplicarSnapshotActivo(r.snapshot);
        this.identificadorResultadoGuardadoActual.set(r.snapshot.hashSnapshot ?? null);
        this.errorAprobacionOperativa.set(null);
        this.errorCierreOperativo.set(null);
        void this.cargarSnapshotCompletoActivo(p);
        this.exitoGuardadoResultado.set('Version revisable guardada correctamente. Revisa y confirma la nomina cuando corresponda.');
      })
      .catch((e: unknown) => {
        this.errorGuardadoResultado.set(e instanceof Error ? e.message : String(e));
      })
      .finally(() => {
        this.guardandoSnapshot.set(false);
      });
  }

  verSnapshotActivo(): void {
    const p = this.periodoSeleccionado();
    this.consultandoSnapshot.set(true);
    this.errorEjecucion.set(null);
    void this.procesoMensual
      .obtenerSnapshotActivo(p)
      .then((snapshot) => {
        if (this.periodoSeleccionado() !== p) {
          return null;
        }
        this.aplicarSnapshotActivo(snapshot);
        this.errorGuardadoResultado.set(null);
        this.errorAprobacionOperativa.set(null);
        this.errorCierreOperativo.set(null);
        this.exitoGuardadoResultado.set(null);
        return this.cargarSnapshotCompletoActivo(p);
      })
      .catch((e: unknown) => {
        if (this.periodoSeleccionado() !== p) {
          return;
        }
        this.errorEjecucion.set(e instanceof Error ? e.message : String(e));
      })
      .finally(() => {
        this.consultandoSnapshot.set(false);
      });
  }

  consultarDetalleResultadoGuardado(): void {
    void this.cargarSnapshotCompletoActivo(this.periodoSeleccionado());
  }

  private resetearEstadoPeriodo(): void {
    this.resultado.set(null);
    this.preNomina.set(null);
    this.calculo.set(null);
    this.snapshotActivo.set(null);
    this.snapshotCompleto.set(null);
    this.errorEjecucion.set(null);
    this.errorGuardadoResultado.set(null);
    this.errorAprobacionOperativa.set(null);
    this.errorCierreOperativo.set(null);
    this.errorSnapshotCompleto.set(null);
    this.exitoGuardadoResultado.set(null);
    this.identificadorResultadoGuardadoActual.set(null);
    this.aprobacionOperativa.set(null);
    this.confirmacionProceso.set(null);
    this.actaOperativaPreparada.set(false);
  }

  recalcularYReemplazarSnapshot(): void {
    const p = this.periodoSeleccionado();
    this.guardandoSnapshot.set(true);
    this.errorEjecucion.set(null);
    this.errorGuardadoResultado.set(null);
    this.exitoGuardadoResultado.set(null);
    void this.procesoMensual
      .reemplazarSnapshotPreliminar(p)
      .then((r) => {
        if (!r.ok || !r.snapshot) {
          const msg = r.issues.map((i) => i.mensaje).join(' ') || 'No se pudo reemplazar la version revisable.';
          throw new Error(msg);
        }
        this.aplicarSnapshotActivo(r.snapshot);
        this.calculo.set(this.procesoMensual.obtenerResultadoCalculoPeriodo(p));
        this.identificadorResultadoGuardadoActual.set(r.snapshot.hashSnapshot ?? null);
        this.errorAprobacionOperativa.set(null);
        void this.cargarSnapshotCompletoActivo(p);
        this.exitoGuardadoResultado.set('Version revisable guardada correctamente. Revisa y confirma la nomina cuando corresponda.');
      })
      .catch((e: unknown) => {
        this.errorGuardadoResultado.set(e instanceof Error ? e.message : String(e));
      })
      .finally(() => {
        this.guardandoSnapshot.set(false);
      });
  }

  etiquetaEstadoGlobal(estado: ProcesoMensualEstado | null): string {
    switch (estado) {
      case 'LISTO_PARA_CALCULO':
        return 'Listo para calcular';
      case 'CON_ADVERTENCIAS':
        return 'Con advertencias';
      case 'BLOQUEADO':
        return 'Bloqueado';
      case 'SIN_EVALUAR':
      default:
        return 'Sin evaluar';
    }
  }

  badgeVariantEstado(estado: ProcesoMensualEstado | null): 'success' | 'warning' | 'error' | 'default' {
    switch (estado) {
      case 'LISTO_PARA_CALCULO':
        return 'success';
      case 'CON_ADVERTENCIAS':
        return 'warning';
      case 'BLOQUEADO':
        return 'error';
      default:
        return 'default';
    }
  }

  etiquetaEstadoPreNomina(estado: ProcesoMensualPreNominaEstado | null): string {
    switch (estado) {
      case 'GENERADA':
        return 'Nomina mensual generada';
      case 'GENERADA_CON_ADVERTENCIAS':
        return 'Nomina generada con advertencias';
      case 'NO_GENERABLE':
        return 'Nomina no generable';
      default:
        return 'Sin generar';
    }
  }

  badgeVariantPreNomina(estado: ProcesoMensualPreNominaEstado | null): 'success' | 'warning' | 'error' | 'default' {
    switch (estado) {
      case 'GENERADA':
        return 'success';
      case 'GENERADA_CON_ADVERTENCIAS':
        return 'warning';
      case 'NO_GENERABLE':
        return 'error';
      default:
        return 'default';
    }
  }

  puedeGenerarPreNomina(): boolean {
    const r = this.resultado();
    return !!r && r.estado !== 'BLOQUEADO' && !this.nominaEstaCerradaOperativamente() && !this.validando() && !this.generandoPreNomina();
  }

  puedeCalcularPreliminar(): boolean {
    return this.validacionCalculo().puedeCalcular && !this.nominaEstaCerradaOperativamente() && !this.validando() && !this.generandoPreNomina() && !this.calculandoPreliminar();
  }

  aprobarResultadoPreliminar(): void {
    const revision = this.revisionAprobacion();
    const snapshot = this.snapshotActivo();
    if (!revision.puedeAprobar || !snapshot) return;
    const advertenciasAprobacion = revision.advertencias.map((advertencia) => advertencia.descripcion);
    if (advertenciasAprobacion.length === 0 && snapshot.totalAdvertencias > 0) {
      advertenciasAprobacion.push(`Resultado guardado con ${snapshot.totalAdvertencias} advertencia(s) no bloqueante(s).`);
    }
    this.confirmacionProceso.set({
      tipo: 'aprobar_preliminar',
      titulo: 'Confirmar revisión de nómina',
      mensaje: 'Marca la version revisable como confirmada por RRHH antes de confirmar la nomina oficial.',
      detalle: 'No emite liquidaciones, no confirma la nomina oficial y no genera archivos legales.',
      puntos: advertenciasAprobacion.length > 0
        ? [
            'Existen advertencias visibles que quedaran registradas como observaciones de revision.',
            'RRHH puede continuar si las advertencias no bloquean el proceso.',
          ]
        : [
            'La version revisable pasara a la etapa de confirmacion de nomina.',
            'Esta revision no reemplaza la confirmacion oficial del periodo.',
          ],
      primaryLabel: 'Confirmar revision',
      secondaryLabel: 'Cancelar',
      advertenciasAprobacion,
    });
  }

  private ejecutarAprobacionOperativa(advertenciasAprobacion: string[]): void {
    const snapshot = this.snapshotActivo();
    if (!snapshot?.idCalculoPeriodo) return;
    this.aprobandoResultado.set(true);
    this.errorAprobacionOperativa.set(null);
    void this.procesoMensual
      .aprobarResultadoPreliminarOperativamente({
        idCalculoPeriodo: snapshot.idCalculoPeriodo!,
        periodo: this.periodoSeleccionado(),
        advertencias: advertenciasAprobacion,
      })
      .then((persistido) => {
        this.aplicarSnapshotActivo(persistido);
      })
      .catch(() => {
        this.errorAprobacionOperativa.set('No se pudo registrar la aprobacion operativa. Intenta nuevamente o revisa la conexion.');
      })
      .finally(() => {
        this.aprobandoResultado.set(false);
      });
  }

  revisarBaseNomina(): void {
    document.querySelector('#base-nomina')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  revisarBloqueosOperativos(): void {
    this.abrirRevisionGuiada();
  }

  abrirRevisionGuiada(): void {
    this.abrirDetalleOperativo('trabajadores');
  }

  abrirDetalleOperativo(tab: DetalleOperativoTab = 'trabajadores'): void {
    this.detalleOperativoTabActivo.set(tab);
    this.detalleOperativoAbierto.set(true);
  }

  cerrarDetalleOperativo(): void {
    this.detalleOperativoAbierto.set(false);
  }

  seleccionarDetalleOperativoTab(tab: DetalleOperativoTab): void {
    this.detalleOperativoTabActivo.set(tab);
  }

  @HostListener('document:keydown.escape')
  cerrarModalesConEscape(): void {
    if (this.detalleOperativoAbierto()) {
      this.cerrarDetalleOperativo();
      return;
    }
  }

  enfocarPanelApoyo(): void {
    document.querySelector('#payroll-support-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  puedeGuardarSnapshot(): boolean {
    const calc = this.calculo();
    if (!validarPeriodoEntradaMensual(this.periodoSeleccionado())) return false;
    if (this.nominaEstaCerradaOperativamente()) return false;
    if (!calc || this.errorEjecucion()) return false;
    if (this.guardandoSnapshot()) return false;
    if (calc.estado === 'con_bloqueos' || calc.issues.some((i) => i.severidad === 'BLOQUEO')) return false;
    const snapshot = this.snapshotActivo();
    return !snapshot || this.identificadorResultadoGuardadoActual() !== snapshot.hashSnapshot;
  }

  nominaEstaCerradaOperativamente(): boolean {
    return this.snapshotActivo()?.cierreOperativo?.estado === 'cerrado_operativamente';
  }

  puedeCerrarNominaOperativa(): boolean {
    return !this.motivoNoPuedeCerrarNomina();
  }

  motivoNoPuedeCerrarNomina(): string | undefined {
    const snapshot = this.snapshotActivo();
    if (!validarPeriodoEntradaMensual(this.periodoSeleccionado())) return 'El periodo seleccionado no es valido.';
    if (!snapshot?.idCalculoPeriodo) return 'Primero debe existir una version revisable guardada vigente.';
    if (snapshot.cierreOperativo?.estado === 'cerrado_operativamente') return 'La nomina mensual ya esta confirmada.';
    if (snapshot.aprobacionOperativa?.estado !== 'aprobado_operativamente') return 'La revision debe estar confirmada antes de confirmar la nomina.';
    if (this.resultadoPreliminar().estado === 'actualizado_sin_guardar') return 'Hay una version actualizada sin guardar.';
    if (snapshot.totalBloqueados > 0) return 'Existen trabajadores bloqueados pendientes en la version guardada.';
    if (this.guardandoSnapshot() || this.aprobandoResultado() || this.cerrandoNomina()) return 'Hay una operacion en curso.';
    return undefined;
  }

  abrirConfirmacionCierreNominaOperativa(): void {
    this.confirmacionProceso.set({
      tipo: 'cerrar_nomina',
      titulo: 'Confirmar nómina mensual',
      mensaje: `Vas a confirmar la nomina mensual de ${this.periodoSeleccionado()}.`,
      detalle: 'La version revisada quedara congelada como base oficial para liquidaciones mientras no exista un flujo de reapertura.',
      puntos: [
        'Bloquea nuevos calculos o reemplazos para el periodo.',
        'No emite liquidaciones oficiales.',
        'No genera archivos Previred, LRE, banco ni PDF.',
      ],
      primaryLabel: 'Confirmar nomina',
      secondaryLabel: 'Cancelar',
    });
  }

  badgeVariantPasoPeriodo(estado: PasoPeriodoEstado): 'success' | 'warning' | 'error' | 'default' | 'info' {
    switch (estado) {
      case 'Completo':
        return 'success';
      case 'Actual':
        return 'info';
      case 'Bloqueada':
        return 'error';
      default:
        return 'default';
    }
  }

  badgeVariantEstadoOperativo(severidad: ProcesoMensualEstadoSeveridad): 'success' | 'warning' | 'error' | 'default' | 'info' {
    switch (severidad) {
      case 'success':
        return 'success';
      case 'warning':
        return 'warning';
      case 'danger':
        return 'error';
      case 'info':
        return 'info';
      case 'neutral':
      default:
        return 'default';
    }
  }

  cerrarNominaOperativa(): void {
    const snapshot = this.snapshotActivo();
    if (!snapshot?.idCalculoPeriodo || !this.puedeCerrarNominaOperativa()) return;
    this.abrirConfirmacionCierreNominaOperativa();
  }

  prepararActaOperativaPeriodo(): void {
    const acta = this.actaPreparacion();
    if (!acta.accionDisponible) return;
    const tieneObservaciones = acta.estado === 'REQUIERE_REVISION';
    this.confirmacionProceso.set({
      tipo: 'preparar_acta',
      titulo: 'Preparar acta operativa del periodo',
      mensaje: 'Se dejara preparada una evidencia visual del contexto revisado para continuar hacia Liquidaciones oficiales.',
      detalle: 'No genera liquidaciones, no cierra el periodo, no guarda un acta definitiva y no exporta PDF.',
      puntos: [
        'Periodo, estado de validacion y resumen de trabajadores.',
        'Movimientos del mes, asignaciones recurrentes y observaciones visibles.',
        'Proxima accion: revisar Liquidaciones oficiales con este contexto como respaldo.',
      ],
      secciones: [
        {
          titulo: 'Que se incluye',
          items: [
            `Periodo ${this.periodoActivo.etiqueta() || this.periodoSeleccionado()}.`,
            `Estado actual: ${this.estadoOperativo().titulo}.`,
            this.dashboardResumen().trabajadoresAptos == null
              ? 'Resumen de trabajadores pendiente de validacion.'
              : `Resumen de trabajadores: ${this.dashboardResumen().trabajadoresAptos} aptos y ${this.dashboardResumen().trabajadoresPorRevisar} por revisar.`,
            `Movimientos y asignaciones: ${this.dashboardResumen().movimientosAprobados} movimientos aprobados y ${this.dashboardResumen().asignacionesAplicables ?? 0} recurrentes aplicables.`,
            tieneObservaciones ? 'Observaciones visibles para revision.' : 'Sin observaciones bloqueantes visibles.',
          ],
        },
        {
          titulo: 'Que no hace todavia',
          items: [
            'No genera liquidaciones.',
            'No cierra el periodo.',
            'No guarda un acta definitiva.',
            'No exporta PDF.',
          ],
        },
      ],
      primaryLabel: tieneObservaciones ? 'Preparar con observaciones' : 'Preparar acta',
      secondaryLabel: 'Cancelar',
    });
  }

  verEvidenciaActaOperativa(): void {
    this.abrirDetalleOperativo('resumen');
  }

  private ejecutarCierreNominaOperativa(): void {
    const snapshot = this.snapshotActivo();
    if (!snapshot?.idCalculoPeriodo || !this.puedeCerrarNominaOperativa()) return;
    this.cerrandoNomina.set(true);
    this.errorCierreOperativo.set(null);
    void this.procesoMensual
      .cerrarNominaOperativamente({
        idCalculoPeriodo: snapshot.idCalculoPeriodo,
        periodo: this.periodoSeleccionado(),
      })
      .then((persistido) => {
        this.aplicarSnapshotActivo(persistido);
        void this.cargarSnapshotCompletoActivo(this.periodoSeleccionado());
      })
      .catch(() => {
        this.errorCierreOperativo.set('No se pudo cerrar operativamente la nomina. No se realizaron cambios parciales.');
      })
      .finally(() => {
        this.cerrandoNomina.set(false);
      });
  }

  confirmarAccionProceso(): void {
    const confirmacion = this.confirmacionProceso();
    if (!confirmacion) return;
    this.confirmacionProceso.set(null);
    switch (confirmacion.tipo) {
      case 'guardar_preliminar':
        this.ejecutarGuardarSnapshotPreliminar();
        break;
      case 'aprobar_preliminar':
        this.ejecutarAprobacionOperativa(confirmacion.advertenciasAprobacion ?? []);
        break;
      case 'cerrar_nomina':
        this.ejecutarCierreNominaOperativa();
        break;
      case 'preparar_acta':
        this.actaOperativaPreparada.set(true);
        break;
    }
  }

  cancelarAccionProceso(): void {
    this.confirmacionProceso.set(null);
  }

  etiquetaArea(area: ProcesoMensualArea, fallback?: string): string {
    switch (area) {
      case 'PARAMETROS':
        return 'Parametros';
      case 'TRABAJADORES':
        return 'Trabajadores';
      case 'CONCEPTOS':
        return 'Conceptos de remuneracion';
      case 'HABERES_RECURRENTES':
        return 'Movimientos recurrentes';
      case 'ENTRADAS_MENSUALES':
      case 'MOVIMIENTOS_VARIABLES':
        return 'Movimientos del periodo';
      case 'PROCESO':
        return 'Nomina mensual';
      default:
        return fallback ?? area;
    }
  }

  etiquetaItemEstado(estado: ProcesoMensualItemEstado): string {
    switch (estado) {
      case 'LISTO':
        return 'Listo';
      case 'CON_PROBLEMAS':
        return 'Revisar';
      case 'PENDIENTE_INTEGRACION':
        return 'Pendiente de integracion';
      case 'NO_EVALUADO':
      default:
        return 'Sin evaluar';
    }
  }

  badgeVariantItemEstado(estado: ProcesoMensualItemEstado): 'success' | 'warning' | 'error' | 'info' | 'default' {
    switch (estado) {
      case 'LISTO':
        return 'success';
      case 'CON_PROBLEMAS':
        return 'error';
      case 'PENDIENTE_INTEGRACION':
        return 'info';
      default:
        return 'default';
    }
  }

  accionArea(area: ProcesoMensualArea): { label: string; route: string } | null {
    switch (area) {
      case 'PARAMETROS':
        return { label: 'Revisar parámetros', route: '/parametros' };
      case 'CONCEPTOS':
        return { label: 'Revisar conceptos', route: '/remuneraciones/conceptos' };
      case 'HABERES_RECURRENTES':
        return { label: 'Revisar recurrentes', route: '/remuneraciones/haberes-descuentos' };
      case 'ENTRADAS_MENSUALES':
      case 'MOVIMIENTOS_VARIABLES':
        return { label: 'Revisar movimientos', route: '/remuneraciones/novedades-mensuales' };
      default:
        return null;
    }
  }

  referenciaTecnica(mensaje: ProcesoMensualMensaje): string {
    return `Referencia tecnica: ${mensaje.codigo}`;
  }

  etiquetaEstadoTrabajador(estado: string): string {
    switch (estado) {
      case 'calculado_preliminar':
        return 'Calculado preliminar';
      case 'con_advertencias':
        return 'Con advertencias';
      case 'con_bloqueos':
        return 'Con bloqueos';
      default:
        return estado;
    }
  }

  badgeVariantResultadoPreliminar(estado: ResultadoPreliminarEstado): 'success' | 'warning' | 'error' | 'info' | 'default' {
    switch (estado) {
      case 'no_guardado':
      case 'guardado':
        return 'success';
      case 'actualizado_sin_guardar':
        return 'warning';
      case 'error_guardado':
      case 'con_bloqueos':
        return 'error';
      case 'sin_resultado':
      default:
        return 'default';
    }
  }

  badgeVariantRevisionAprobacion(estado: RevisionAprobacionEstado): 'success' | 'warning' | 'error' | 'info' | 'default' {
    switch (estado) {
      case 'listo':
      case 'aprobado':
        return 'success';
      case 'aprobado_desactualizado':
      case 'pendiente_revision':
      case 'actualizado_sin_guardar':
        return 'warning';
      case 'no_apto':
        return 'error';
      case 'pendiente_guardado':
        return 'info';
      case 'sin_resultado_guardado':
      default:
        return 'default';
    }
  }

  badgeVariantRevisionChecklist(estado: RevisionChecklistEstado): 'success' | 'warning' | 'error' | 'info' | 'default' {
    switch (estado) {
      case 'Completo':
        return 'success';
      case 'Pendiente':
        return 'warning';
      case 'Requiere atencion':
        return 'error';
      case 'No aplica':
      default:
        return 'default';
    }
  }

  badgeVariantEstadoResultadoTrabajador(
    estado: TrabajadorResultadoPreliminarView['estadoLabel'],
  ): 'success' | 'warning' | 'error' | 'info' | 'default' {
    switch (estado) {
      case 'Calculado':
        return 'success';
      case 'Con observaciones':
        return 'warning';
      case 'Omitido':
      case 'No calculado':
        return 'error';
      default:
        return 'default';
    }
  }

  etiquetaEstadoBaseTrabajador(estado: BaseNominaTrabajadorEstado): string {
    switch (estado) {
      case 'listo':
        return 'Listo para calculo';
      case 'con_observaciones':
        return 'Con observaciones';
      case 'bloqueado':
        return 'Bloqueado';
      case 'excluido':
        return 'Excluido';
      default:
        return estado;
    }
  }

  badgeVariantEstadoBaseTrabajador(
    estado: BaseNominaTrabajadorEstado,
  ): 'success' | 'warning' | 'error' | 'info' | 'default' {
    switch (estado) {
      case 'listo':
        return 'success';
      case 'con_observaciones':
        return 'warning';
      case 'bloqueado':
        return 'error';
      case 'excluido':
        return 'default';
      default:
        return 'default';
    }
  }

  etiquetaParametrosBase(estado: BaseNominaParametrosEstado): string {
    switch (estado) {
      case 'listos':
        return 'Listos';
      case 'con_observaciones':
        return 'Con observaciones';
      case 'por_revisar':
        return 'Por revisar';
      case 'sin_evaluar':
      default:
        return 'Sin evaluar';
    }
  }

  badgeVariantParametrosBase(estado: BaseNominaParametrosEstado): 'success' | 'warning' | 'error' | 'info' | 'default' {
    switch (estado) {
      case 'listos':
        return 'success';
      case 'con_observaciones':
        return 'warning';
      case 'por_revisar':
        return 'error';
      default:
        return 'default';
    }
  }

  badgeVariantValidacionCalculo(estado: ValidacionCalculoEstado): 'success' | 'warning' | 'error' | 'info' | 'default' {
    switch (estado) {
      case 'listo':
        return 'success';
      case 'advertencias':
        return 'warning';
      case 'bloqueado':
        return 'error';
      case 'pendiente':
      default:
        return 'default';
    }
  }

  ejecutarAccionValidacion(accion: ValidacionAccionLocal): void {
    switch (accion) {
      case 'validarPeriodo':
        this.validarPeriodo();
        break;
      case 'generarBase':
      case 'actualizarBase':
        this.generarPreNomina();
        break;
      case 'calcularPreliminar':
        this.calcularPreliminar();
        break;
      case 'guardarResultado':
        this.guardarSnapshotPreliminar();
        break;
      case 'aprobarResultado':
        this.aprobarResultadoPreliminar();
        break;
      case 'cerrarNomina':
        this.cerrarNominaOperativa();
        break;
      case 'revisarBloqueos':
        this.revisarBloqueosOperativos();
        break;
    }
  }

  private etiquetaRevisionAprobacion(estado: RevisionAprobacionEstado): string {
    switch (estado) {
      case 'aprobado':
        return 'Aprobado operativamente';
      case 'aprobado_desactualizado':
        return 'Aprobacion desactualizada';
      case 'pendiente_guardado':
        return 'Pendiente de guardado';
      case 'pendiente_revision':
        return 'Lista para confirmar con advertencias';
      case 'actualizado_sin_guardar':
        return 'Resultado actualizado sin guardar';
      case 'no_apto':
        return 'No apto para aprobacion';
      case 'listo':
        return 'Lista para confirmar';
      case 'sin_resultado_guardado':
      default:
        return 'Sin resultado guardado';
    }
  }

  private descripcionRevisionAprobacion(estado: RevisionAprobacionEstado): string {
    switch (estado) {
      case 'aprobado':
        return 'Revision de nomina confirmada.';
      case 'aprobado_desactualizado':
        return 'La aprobacion operativa anterior quedo desactualizada porque existe un resultado posterior. Guarda y aprueba nuevamente el resultado actualizado.';
      case 'pendiente_guardado':
        return 'El resultado calculado debe guardarse antes de revisarlo para aprobacion.';
      case 'pendiente_revision':
        return 'La version revisable esta lista para confirmacion de RRHH, con advertencias visibles.';
      case 'actualizado_sin_guardar':
        return 'Hay un calculo preliminar mas reciente que el ultimo guardado. Guarda la version actual antes de revisarla.';
      case 'no_apto':
        return 'Existen bloqueos que impiden aprobar operativamente este resultado.';
      case 'listo':
        return 'La version revisable esta lista para confirmacion de RRHH.';
      case 'sin_resultado_guardado':
      default:
        return 'Guarda una version revisable antes de confirmar la nomina.';
    }
  }

  private checklistRevisionAprobacion(input: {
    hayGuardado: boolean;
    guardado: ResultadoPreliminarView['ultimoGuardado'];
    actualizadoSinGuardar: boolean;
    hayResultadoActual: boolean;
    bloqueos: ResultadoObservacionView[];
    advertencias: ResultadoObservacionView[];
  }): RevisionAprobacionChecklistItemView[] {
    const totalCalculados = input.guardado?.trabajadoresCalculados ?? 0;
    const omitidos = input.guardado?.trabajadoresOmitidos ?? 0;
    return [
      {
        titulo: 'Resultado preliminar guardado',
        descripcion: input.hayGuardado
          ? 'Existe una version preliminar activa para este periodo.'
          : input.hayResultadoActual
            ? 'Guarda el calculo preliminar para que quede disponible para revision.'
            : 'Primero calcula y guarda un resultado preliminar.',
        estado: input.hayGuardado ? 'Completo' : 'Pendiente',
      },
      {
        titulo: 'Resultado guardado vigente',
        descripcion: input.actualizadoSinGuardar
          ? 'El calculo actual es mas reciente que la version guardada.'
          : input.hayGuardado
            ? 'La version guardada coincide con el ultimo resultado disponible.'
            : 'Se evaluara despues del guardado.',
        estado: !input.hayGuardado ? 'Pendiente' : input.actualizadoSinGuardar ? 'Requiere atencion' : 'Completo',
      },
      {
        titulo: 'Trabajadores calculados revisables',
        descripcion: input.hayGuardado
          ? `${totalCalculados} trabajador(es) calculado(s) en el resultado guardado.`
          : 'Aun no hay trabajadores guardados para revisar.',
        estado: !input.hayGuardado ? 'Pendiente' : totalCalculados > 0 ? 'Completo' : 'Requiere atencion',
      },
      {
        titulo: 'Sin bloqueos operativos',
        descripcion: input.bloqueos.length
          ? 'Hay bloqueos que requieren correccion antes de avanzar.'
          : 'No hay bloqueos visibles en la revision operativa.',
        estado: input.bloqueos.length || omitidos > 0 ? 'Requiere atencion' : input.hayGuardado ? 'Completo' : 'Pendiente',
      },
      {
        titulo: 'Advertencias visibles para decision RRHH',
        descripcion: input.advertencias.length
          ? 'Las advertencias quedan visibles para decidir si se corrigen o se aceptan operativamente.'
          : 'No hay advertencias pendientes en la version revisada.',
        estado: !input.hayGuardado ? 'Pendiente' : input.advertencias.length ? 'Requiere atencion' : 'Completo',
      },
      {
        titulo: 'Resultado aprobado operativamente',
        descripcion: this.aprobacionOperativa()
          ? 'RRHH registro una aprobacion operativa interna para el resultado preliminar.'
          : 'Pendiente de aprobacion operativa interna por RRHH.',
        estado: this.aprobacionOperativa() ? 'Completo' : input.hayGuardado ? 'Pendiente' : 'No aplica',
      },
      {
        titulo: 'Acciones legales pendientes para fase posterior',
        descripcion: 'Liquidaciones oficiales, cierre, Previred, LRE y bancos no se ejecutan en esta revision.',
        estado: 'No aplica',
      },
    ];
  }

  private observacionDesdeValidacion(item: ValidacionOperativaItemView): ResultadoObservacionView {
    return {
      codigo: item.codigo,
      titulo: item.titulo,
      descripcion: item.descripcion,
      accionLabel: item.accionLabel,
      ruta: item.ruta,
    };
  }

  private pendienteDesdeValidacion(
    item: ValidacionOperativaItemView,
    severidad: ProcesoMensualEstadoSeveridad = item.severidad === 'bloqueo' ? 'danger' : item.severidad === 'advertencia' ? 'warning' : 'info',
  ): ProcesoMensualPendienteVm {
    return {
      codigo: item.codigo,
      titulo: item.titulo,
      descripcion: item.descripcion,
      severidad,
      ruta: item.ruta,
      accionLocal: item.accionLocal,
      accionLabel: item.accionLabel,
    };
  }

  private pendienteDesdeResultado(
    item: ResultadoObservacionView,
    severidad: ProcesoMensualEstadoSeveridad,
  ): ProcesoMensualPendienteVm {
    return {
      codigo: item.codigo,
      titulo: item.titulo,
      descripcion: item.descripcion,
      severidad,
      ruta: item.ruta,
      accionLabel: item.accionLabel,
    };
  }

  private buildValidacionCalculo(input: {
    bloqueos: ValidacionOperativaItemView[];
    advertencias: ValidacionOperativaItemView[];
    informaciones: ValidacionOperativaItemView[];
    estadoForzado?: ValidacionCalculoEstado;
    razonDeshabilitado?: string;
    siguienteAccion?: ValidacionCalculoPreliminarView['siguienteAccion'];
  }): ValidacionCalculoPreliminarView {
    const estado =
      input.estadoForzado ??
      (input.bloqueos.length > 0 ? 'bloqueado' : input.advertencias.length > 0 ? 'advertencias' : 'listo');
    const puedeCalcular = estado === 'listo' || estado === 'advertencias';
    const razonDeshabilitado = puedeCalcular ? undefined : input.razonDeshabilitado ?? input.bloqueos[0]?.descripcion;
    return {
      estado,
      estadoLabel: this.etiquetaValidacionCalculo(estado),
      puedeCalcular,
      razonDeshabilitado,
      siguienteAccion: input.siguienteAccion ?? this.resolverSiguienteAccion(input.bloqueos, input.advertencias),
      bloqueos: input.bloqueos,
      advertencias: input.advertencias,
      informaciones: input.informaciones,
    };
  }

  private etiquetaValidacionCalculo(estado: ValidacionCalculoEstado): string {
    switch (estado) {
      case 'listo':
        return 'Listo para calcular';
      case 'advertencias':
        return 'Con advertencias';
      case 'bloqueado':
        return 'Bloqueado';
      case 'pendiente':
      default:
        return 'Pendiente de validar';
    }
  }

  private resolverSiguienteAccion(
    bloqueos: readonly ValidacionOperativaItemView[],
    advertencias: readonly ValidacionOperativaItemView[],
  ): ValidacionCalculoPreliminarView['siguienteAccion'] {
    const prioridad = ['BLOQ-001', 'BLOQ-004', 'BLOQ-005', 'BLOQ-003', 'BLOQ-006'];
    const bloqueo = prioridad.map((codigo) => bloqueos.find((b) => b.codigo === codigo)).find((b): b is ValidacionOperativaItemView => !!b) ?? bloqueos[0];
    if (bloqueo) {
      return {
        label: bloqueo.accionLabel ?? 'Resolver bloqueo',
        descripcion: bloqueo.descripcion,
        ruta: bloqueo.ruta,
        accionLocal: bloqueo.accionLocal,
      };
    }
    if (advertencias.length > 0) {
      return {
        label: 'Revisar trabajadores',
        descripcion: `La nomina mensual puede revisarse con ${advertencias.length} advertencia(s) no bloqueante(s).`,
        accionLocal: 'calcularPreliminar',
      };
    }
    return {
      label: 'Revisar trabajadores',
      descripcion: 'La nómina mensual está lista para revisar trabajadores.',
      accionLocal: 'calcularPreliminar',
    };
  }

  private itemDesdeMensaje(
    mensaje: ProcesoMensualMensaje,
    severidad: ValidacionOperativaSeveridad,
  ): ValidacionOperativaItemView {
    const accion = this.accionArea(mensaje.area);
    return {
      codigo: mensaje.codigo,
      titulo: this.tituloMensajeOperativo(mensaje),
      descripcion: mensaje.texto,
      severidad,
      accionLabel: accion?.label,
      ruta: accion?.route,
    };
  }

  private tituloMensajeOperativo(mensaje: ProcesoMensualMensaje): string {
    if (mensaje.area === 'PARAMETROS') return 'Parámetros del período por revisar';
    if (mensaje.area === 'TRABAJADORES') return 'Trabajadores por revisar';
    if (mensaje.area === 'HABERES_RECURRENTES') return 'Movimientos recurrentes por revisar';
    if (mensaje.area === 'ENTRADAS_MENSUALES' || mensaje.area === 'MOVIMIENTOS_VARIABLES') return 'Movimientos del periodo por revisar';
    if (mensaje.area === 'CONCEPTOS') return 'Conceptos de remuneracion por revisar';
    return 'Nomina mensual por revisar';
  }

  private parametroMinimoBloqueante(id: string, clasificacion: ClasificacionParametroGrupo): boolean {
    const obligatorios = new Set(['mensuales_uf_utm_sueldo', 'topes_base', 'catalogos_afp_impuesto']);
    return obligatorios.has(id) && (clasificacion === 'FALTANTE' || clasificacion === 'PARCIAL');
  }

  private parametroMinimoBloqueanteDesdeCodigo(codigo: string): boolean {
    return ['PARAM_MIN_mensuales_uf_utm_sueldo', 'PARAM_MIN_topes_base', 'PARAM_MIN_catalogos_afp_impuesto']
      .some((prefix) => codigo.startsWith(prefix));
  }

  private parametroOpcionalAdvertencia(id: string, clasificacion: ClasificacionParametroGrupo): boolean {
    return !this.parametroMinimoBloqueante(id, clasificacion) && (clasificacion === 'FALTANTE' || clasificacion === 'PARCIAL');
  }

  private etiquetaResultadoPreliminar(estado: ResultadoPreliminarEstado): string {
    switch (estado) {
      case 'no_guardado':
        return 'Resultado no guardado';
      case 'guardado':
        return 'Resultado guardado';
      case 'actualizado_sin_guardar':
        return 'Resultado actualizado sin guardar';
      case 'error_guardado':
        return 'No se pudo guardar';
      case 'con_bloqueos':
        return 'Resultado con bloqueos';
      case 'sin_resultado':
      default:
        return 'Sin resultado';
    }
  }

  private descripcionEstadoGuardado(estado: ResultadoPreliminarEstado): string {
    switch (estado) {
      case 'no_guardado':
        return 'Revisa el calculo preliminar y guardalo como version revisable si corresponde.';
      case 'guardado':
        return 'Este resultado preliminar quedo guardado como version revisable. No emite liquidaciones ni cierra el periodo.';
      case 'actualizado_sin_guardar':
        return 'Volviste a calcular despues del ultimo guardado. Guarda esta nueva version si quieres conservarla.';
      case 'error_guardado':
        return 'No se pudo guardar el resultado preliminar. Intenta nuevamente o revisa las observaciones del resultado.';
      case 'con_bloqueos':
        return 'No puedes guardar este resultado preliminar. Hay bloqueos del resultado que deben resolverse.';
      case 'sin_resultado':
      default:
        return 'Primero calcula preliminarmente la nomina para revisar montos y observaciones antes de guardar.';
    }
  }

  private resolverEstadoGuardadoResultado(
    calculo: MotorCalculoPeriodoResultado,
    bloqueos: ResultadoObservacionView[],
  ): ResultadoPreliminarEstado {
    if (this.errorGuardadoResultado()) return 'error_guardado';
    if (calculo.estado === 'con_bloqueos' || bloqueos.length > 0) return 'con_bloqueos';
    const snapshot = this.snapshotActivo();
    if (!snapshot) return 'no_guardado';
    return this.identificadorResultadoGuardadoActual() === snapshot.hashSnapshot
      ? 'guardado'
      : 'actualizado_sin_guardar';
  }

  private razonNoPuedeGuardarResultado(bloqueos: ResultadoObservacionView[]): string {
    if (!validarPeriodoEntradaMensual(this.periodoSeleccionado())) return 'El periodo seleccionado no es valido.';
    if (this.nominaEstaCerradaOperativamente()) return 'La nómina del período está cerrada. Para modificarla, será necesario reabrir el período en una fase posterior.';
    if (!this.calculo()) return 'Primero calcula preliminarmente la nómina.';
    if (this.errorEjecucion()) return 'Hay un error tecnico activo que debes resolver antes de guardar.';
    if (bloqueos.length > 0) return 'El resultado tiene bloqueos que deben revisarse.';
    const snapshot = this.snapshotActivo();
    if (snapshot && this.identificadorResultadoGuardadoActual() === snapshot.hashSnapshot) {
      return 'No hay cambios para guardar. El resultado preliminar actual ya esta guardado.';
    }
    if (this.guardandoSnapshot()) return 'El guardado del resultado preliminar esta en curso.';
    return 'Genera un resultado preliminar sin bloqueos antes de guardar.';
  }

  private ultimoGuardadoDesdeSnapshot(snapshot: NominaCalculoPeriodoSnapshot): ResultadoPreliminarView['ultimoGuardado'] {
    const advertencias = snapshot.totalAdvertencias ?? 0;
    return {
      versionLabel: snapshot.idCalculoPeriodo
        ? `Disponible como referencia interna ${snapshot.idCalculoPeriodo}`
        : 'Version numerica no disponible en esta etapa.',
      fechaGuardadoLabel: this.formatoFechaHora(snapshot.fechaGeneracion),
      versionCalculoLabel: snapshot.versionMotor || 'Version no disponible',
      identificadorTecnicoLabel: snapshot.hashSnapshot || 'Referencia interna no disponible',
      estadoLabel: this.etiquetaEstadoSnapshot(snapshot.estado),
      trabajadoresCalculados: snapshot.totalTrabajadores,
      trabajadoresConObservaciones: advertencias,
      trabajadoresOmitidos: snapshot.totalBloqueados,
      totalLiquidoLabel: this.formatoMonto(snapshot.totalLiquido),
      advertenciasLabel: advertencias > 0
        ? `Este resultado se guardo con ${advertencias} advertencia(s) no bloqueante(s).`
        : 'Resultado guardado sin advertencias.',
    };
  }

  private cargarSnapshotActivo(periodo: string): Promise<void> {
    return this.procesoMensual.obtenerSnapshotActivo(periodo)
      .then((snapshot) => {
        this.aplicarSnapshotActivo(snapshot);
        return this.cargarSnapshotCompletoActivo(periodo);
      });
  }

  private cargarSnapshotCompletoActivo(periodo: string): Promise<void> {
    this.consultandoSnapshotCompleto.set(true);
    this.errorSnapshotCompleto.set(null);
    return this.procesoMensual.obtenerSnapshotCompletoActivo(periodo)
      .then((snapshot) => {
        if (this.periodoSeleccionado() !== periodo) {
          return;
        }
        this.snapshotCompleto.set(snapshot);
      })
      .catch(() => {
        if (this.periodoSeleccionado() !== periodo) {
          return;
        }
        this.snapshotCompleto.set(null);
        this.errorSnapshotCompleto.set('No se pudo cargar el detalle del resultado guardado. Intenta nuevamente o revisa la conexion.');
      })
      .finally(() => {
        this.consultandoSnapshotCompleto.set(false);
      });
  }

  private aplicarSnapshotActivo(snapshot: NominaCalculoPeriodoSnapshot | null): void {
    this.snapshotActivo.set(snapshot);
    this.aprobacionOperativa.set(snapshot ? this.aprobacionDesdeSnapshot(snapshot) : null);
  }

  private aprobacionDesdeSnapshot(snapshot: NominaCalculoPeriodoSnapshot): AprobacionOperativaRegistroView | null {
    const aprobacion = snapshot.aprobacionOperativa;
    if (!aprobacion) return null;
    return {
      fechaAprobacionLabel: this.formatoFechaHora(aprobacion.fecha),
      usuarioLabel: aprobacion.usuarioLabel || 'Usuario no disponible en esta sesion',
      versionCalculoLabel: snapshot.versionMotor || 'Version no disponible',
      identificadorTecnicoLabel: snapshot.hashSnapshot || 'Referencia interna no disponible',
      identificadorResultado: snapshot.hashSnapshot ?? null,
      idCalculoPeriodo: snapshot.idCalculoPeriodo ?? null,
      trabajadoresCalculados: snapshot.totalTrabajadores,
      totalHaberesLabel: this.formatoMonto(snapshot.totalHaberes),
      totalDescuentosLabel: this.formatoMonto(snapshot.totalDescuentos),
      totalLiquidoLabel: this.formatoMonto(snapshot.totalLiquido),
      advertencias: aprobacion.advertencias,
    };
  }

  private etiquetaEstadoSnapshotTrabajador(estado: MotorCalculoEstadoTrabajador): string {
    switch (estado) {
      case 'calculado_preliminar':
        return 'Calculado';
      case 'con_advertencias':
        return 'Con observaciones';
      case 'con_bloqueos':
        return 'Con bloqueos';
      default:
        return 'No calculado';
    }
  }

  private etiquetaConceptoSnapshot(concepto: NominaCalculoConceptoSnapshot): string {
    const nombre = concepto.nombreConceptoSnapshot?.trim() || 'Concepto no disponible';
    const codigo = concepto.codigoLreSnapshot?.trim();
    return `${nombre}${codigo ? ` (${codigo})` : ''}: ${this.formatoMonto(concepto.monto)}`;
  }

  private etiquetaNivelObservacion(severidad: MotorCalculoSeveridad): SnapshotCompletoObservacionView['nivelLabel'] {
    switch (severidad) {
      case 'BLOQUEO':
        return 'Bloqueo';
      case 'ADVERTENCIA':
        return 'Advertencia';
      case 'INFO':
      default:
        return 'Informacion';
    }
  }

  private etiquetaEstadoSnapshot(estado: NominaCalculoPeriodoSnapshot['estado']): string {
    switch (estado) {
      case 'preliminar':
        return 'Preliminar';
      case 'recalculado':
        return 'Recalculado';
      case 'observado':
        return 'Observado';
      case 'listo_para_revision':
        return 'Listo para revision';
      case 'aprobado_para_liquidacion':
        return 'Aprobado para fase posterior';
      case 'anulado':
        return 'Anulado';
      case 'borrador':
      default:
        return 'Borrador';
    }
  }

  private razonNoPuedeAprobar(input: {
    hayResultadoActual: boolean;
    hayGuardado: boolean;
    actualizadoSinGuardar: boolean;
    bloqueos: ResultadoObservacionView[];
    omitidos: number;
    aprobacionVigente: boolean;
  }): string | undefined {
    if (input.aprobacionVigente) return 'El resultado preliminar guardado ya esta aprobado operativamente.';
    if (this.nominaEstaCerradaOperativamente()) return 'La nómina del período está cerrada. Para modificarla, será necesario reabrir el período en una fase posterior.';
    if (!validarPeriodoEntradaMensual(this.periodoSeleccionado())) return 'El periodo no es valido para aprobacion operativa.';
    if (!input.hayResultadoActual && !input.hayGuardado) return 'Primero calcula el resultado preliminar.';
    if (!input.hayGuardado) return 'Primero guarda el resultado preliminar.';
    if (input.actualizadoSinGuardar) return 'Hay un resultado actualizado sin guardar.';
    if (input.bloqueos.length > 0 || input.omitidos > 0) return 'Existen bloqueos operativos pendientes.';
    return undefined;
  }

  private estadoResultadoTrabajador(estado: string): TrabajadorResultadoPreliminarView['estadoLabel'] {
    switch (estado) {
      case 'calculado_preliminar':
        return 'Calculado';
      case 'con_advertencias':
        return 'Con observaciones';
      case 'con_bloqueos':
        return 'Omitido';
      default:
        return 'No calculado';
    }
  }

  private observacionesResultado(
    calculo: MotorCalculoPeriodoResultado,
    severidad: MotorCalculoIssue['severidad'],
  ): ResultadoObservacionView[] {
    return [
      ...calculo.issues,
      ...calculo.liquidaciones.flatMap((liq) => liq.issues),
    ]
      .filter((issue) => issue.severidad === severidad)
      .map((issue) => ({
        codigo: issue.codigo,
        titulo: severidad === 'BLOQUEO' ? 'Bloqueo del resultado' : 'Advertencia del resultado',
        descripcion: issue.mensaje,
        ...this.accionResultadoDesdeIssues([issue]),
      }));
  }

  private accionResultadoDesdeIssues(
    issues: readonly MotorCalculoIssue[],
  ): Pick<ResultadoObservacionView, 'accionLabel' | 'ruta'> {
    const origen = issues.map((issue) => `${issue.origen} ${issue.codigo}`.toLowerCase()).join(' ');
    if (origen.includes('entrada') || origen.includes('movimiento')) {
      return { accionLabel: 'Revisar movimientos', ruta: '/remuneraciones/novedades-mensuales' };
    }
    if (origen.includes('recurrente') || origen.includes('haber')) {
      return { accionLabel: 'Revisar recurrentes', ruta: '/remuneraciones/haberes-descuentos' };
    }
    return { accionLabel: 'Revisar trabajadores' };
  }

  private trabajadorLabelPorId(): Map<number, string> {
    const trabajadores = new Map<number, string>();
    for (const trabajador of this.baseNominaTrazabilidad()?.trabajadores ?? []) {
      trabajadores.set(trabajador.idPersona, trabajador.trabajadorLabel || 'Trabajador sin ficha visible');
    }
    for (const trabajador of this.resultadoPreliminar().trabajadores) {
      if (typeof trabajador.idPersona === 'number') {
        trabajadores.set(trabajador.idPersona, trabajador.trabajadorLabel);
      }
    }
    return trabajadores;
  }

  private observacionGridDesdePendiente(
    item: ProcesoMensualPendienteVm,
    severidad: PayrollObservationDetailRow['severidad'],
  ): PayrollObservationDetailRow {
    return {
      severidad,
      ambito: this.ambitoDesdeCodigo(item.codigo),
      mensaje: item.descripcion || item.titulo,
      accion: item.accionLabel ?? (item.ruta ? 'Revisar origen' : 'Revisar en el período'),
    };
  }

  private observacionGridDesdeResultado(
    item: ResultadoObservacionView,
    severidad: PayrollObservationDetailRow['severidad'],
  ): PayrollObservationDetailRow {
    return {
      severidad,
      ambito: this.ambitoDesdeCodigo(item.codigo),
      mensaje: item.descripcion || item.titulo,
      accion: item.accionLabel ?? 'Revisar resultado preliminar',
    };
  }

  private ambitoDesdeCodigo(codigo: string): string {
    const normalizado = codigo.toLowerCase();
    if (normalizado.includes('param')) return 'Parámetros';
    if (normalizado.includes('mov') || normalizado.includes('entrada')) return 'Movimientos';
    if (normalizado.includes('recurrente') || normalizado.includes('haber')) return 'Recurrentes';
    if (normalizado.includes('trab') || normalizado.includes('persona')) return 'Trabajadores';
    if (normalizado.includes('cierre')) return 'Confirmación de nómina';
    return 'Período';
  }

  private etiquetaConceptoEntrada(idConcepto: number, tipoMovimiento: string | null, categoria: string | null): string {
    const partes = [tipoMovimiento, categoria].filter((item): item is string => Boolean(item?.trim()));
    return partes.length ? partes.join(' · ') : `Concepto ${idConcepto}`;
  }

  private etiquetaTipoEntrada(tipo: string): string {
    const labels: Record<string, string> = {
      haber: 'Haber',
      descuento: 'Descuento',
      ausencia: 'Ausencia',
      licencia: 'Licencia',
      anticipo: 'Anticipo',
      ajuste: 'Ajuste',
      retroactivo: 'Retroactivo',
      reintegro: 'Reintegro',
      otro: 'Otro',
    };
    return labels[tipo] ?? tipo;
  }

  private etiquetaEstadoEntrada(estado: string): string {
    const labels: Record<string, string> = {
      borrador: 'Borrador',
      pendiente_revision: 'Pendiente de revisión',
      observada: 'Observada',
      aprobada: 'Aprobada',
      rechazada: 'Rechazada',
      incorporada_a_pre_nomina: 'Incorporada a base',
      calculada: 'Calculada',
      anulada: 'Anulada',
      legacy_validado: 'Validada',
      legacy_bloqueado: 'Bloqueada',
    };
    return labels[estado] ?? estado;
  }

  formatoMonto(valor: number | null | undefined): string {
    if (typeof valor !== 'number' || !Number.isFinite(valor)) return 'Monto no disponible';
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      maximumFractionDigits: 0,
    }).format(valor);
  }

  private formatoFechaHora(valor: string | null | undefined): string {
    if (!valor) return 'Fecha no disponible';
    const fecha = new Date(valor);
    if (Number.isNaN(fecha.getTime())) return valor;
    return new Intl.DateTimeFormat('es-CL', {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(fecha);
  }

  private horaCorta(valor: string | null | undefined): string {
    if (!valor) return '--:--';
    const fecha = new Date(valor);
    if (Number.isNaN(fecha.getTime())) return '--:--';
    return new Intl.DateTimeFormat('es-CL', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(fecha);
  }

  private resumenRevisionTrabajadores(): string {
    const trazabilidad = this.baseNominaTrazabilidad();
    if (trazabilidad) {
      return `${trazabilidad.listosParaCalculo} listos, ${trazabilidad.conObservaciones} por revisar y ${trazabilidad.bloqueados} bloqueados`;
    }
    const resultado = this.resultadoPreliminar();
    if (resultado.trabajadores.length) {
      return `${resultado.resumen.trabajadoresCalculados} calculados, ${resultado.resumen.trabajadoresConObservaciones} por revisar y ${resultado.resumen.trabajadoresOmitidos} bloqueados`;
    }
    return 'sin observaciones disponibles';
  }

  private humanizarCopyOperativo(texto: string): string {
    const limpio = texto
      .replace(/\bFALTANTE\b/gi, '')
      .replace(/\bis_null\b/gi, '')
      .replace(/sis_fila_mensual/gi, '')
      .replace(/\b(rpc_|tbl_|sis_)[a-z0-9_]+\b/gi, '')
      .replace(/\s{2,}/g, ' ')
      .trim();
    return limpio || 'Revisar antes de continuar.';
  }
}
