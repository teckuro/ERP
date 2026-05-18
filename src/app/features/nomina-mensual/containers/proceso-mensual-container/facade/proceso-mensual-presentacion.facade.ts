import { HostListener, Injectable, computed, effect, inject, signal, untracked } from '@angular/core';
import { PeriodoActivoService } from '../../../../../core/services/periodo-activo.service';
import type {
  BaseNominaParametrosEstado,
  BaseNominaTrabajadorEstado,
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
} from '../../../models/proceso-mensual.model';
import { type RecordBreadcrumbItem } from '../../../../../shared/components/ui/record-breadcrumb.component';
import type { ActaOperativaPeriodoViewModel } from '../../../models/acta-operativa-periodo.model';
import { ProcesoMensualPeriodoStore } from '../store/proceso-mensual-periodo.store';
import { formatoFechaHoraNomina, formatoMontoNomina, horaCortaNomina } from '../utils/proceso-mensual-presentacion.formato';
import { validarPeriodoEntradaMensual } from '../../../entradas/rules/entradas-mensuales-periodo.rules';
import { buildActaOperativaPeriodoViewModel } from '../../../rules/acta-operativa-periodo.rules';
import {
  resolverEstadoOperativoProcesoMensual,
  type ProcesoMensualAccionLocal,
  type ProcesoMensualEstadoSeveridad,
  type ProcesoMensualPendienteVm,
} from '../../../rules/proceso-mensual-estado-operativo.rules';
import { buildValidacionCalculoPreliminarView } from '../../../rules/proceso-mensual-validacion-calculo.rules';
import {
  buildAlertasPeriodoResumen,
  buildBitacoraEtapas,
  buildNominaFrameView,
  buildNominaResumenSuperior,
  mapBitacoraRailEtapas,
  resolveNominaVisualFrame,
  suggestNominaWorkspaceTab,
} from '../../../rules/proceso-mensual-workspace.rules';
import {
  DETALLE_OPERATIVO_TABS,
  PAYROLL_MOVEMENT_DETAIL_COLUMNS,
  PAYROLL_MOVEMENT_DETAIL_FILTERS,
  PAYROLL_OBSERVATION_DETAIL_COLUMNS,
  PAYROLL_OBSERVATION_DETAIL_FILTERS,
  PAYROLL_RECURRENT_DETAIL_COLUMNS,
  PAYROLL_RECURRENT_DETAIL_FILTERS,
  PAYROLL_RESULT_DETAIL_COLUMNS,
  PAYROLL_RESULT_DETAIL_FILTERS,
  PAYROLL_WORKER_DETAIL_COLUMNS,
  PAYROLL_WORKER_DETAIL_FILTERS,
} from '../models/proceso-mensual-grid.config';
import type {
  AlertasPeriodoResumenVm,
  AprobacionOperativaRegistroView,
  BitacoraEtapaVm,
  BitacoraRailEtapaVm,
  CierreOperativoView,
  ConfirmacionProcesoMensualView,
  DetalleOperativoTab,
  EtapaOperativaActiva,
  NominaResumenSuperiorVm,
  NominaVisualFrame,
  NominaVisualFrameView,
  NominaWorkspaceTab,
  ParaContinuarItemVm,
  PasoPeriodoEstado,
  PasoPeriodoView,
  PayrollMovementDetailRow,
  PayrollObservationDetailRow,
  PayrollRecurrentDetailRow,
  PayrollResultDetailRow,
  PayrollSeguimientoItem,
  PayrollWorkerDetailRow,
  ResultadoObservacionView,
  ResultadoPreliminarEstado,
  ResultadoPreliminarView,
  RevisionAprobacionChecklistItemView,
  RevisionAprobacionEstado,
  RevisionAprobacionView,
  RevisionChecklistEstado,
  ValidacionCalculoEstado,
  SnapshotCompletoDetalleView,
  SnapshotCompletoObservacionView,
  SnapshotCompletoTrabajadorView,
  TrabajadorResultadoPreliminarView,
  ValidacionAccionLocal,
  ValidacionCalculoPreliminarView,
  ValidacionOperativaItemView,
} from '../models/proceso-mensual-container.vm';

@Injectable()
export class ProcesoMensualPresentacionFacade {
  readonly store = inject(ProcesoMensualPeriodoStore);
  readonly periodoActivo = inject(PeriodoActivoService);

  readonly breadcrumbItems: readonly RecordBreadcrumbItem[] = [
    { label: 'Remuneraciones', link: '/remuneraciones' },
    { label: 'Nómina mensual' },
  ];

  readonly periodoSeleccionado = this.store.periodoSeleccionado;
  readonly resultado = this.store.resultado;
  readonly preNomina = this.store.preNomina;
  readonly calculo = this.store.calculo;
  readonly snapshotActivo = this.store.snapshotActivo;
  readonly validando = this.store.validando;
  readonly generandoPreNomina = this.store.generandoPreNomina;
  readonly calculandoPreliminar = this.store.calculandoPreliminar;
  readonly guardandoSnapshot = this.store.guardandoSnapshot;
  readonly consultandoSnapshot = this.store.consultandoSnapshot;
  readonly consultandoSnapshotCompleto = this.store.consultandoSnapshotCompleto;
  readonly errorEjecucion = this.store.errorEjecucion;
  readonly errorGuardadoResultado = this.store.errorGuardadoResultado;
  readonly errorAprobacionOperativa = this.store.errorAprobacionOperativa;
  readonly errorCierreOperativo = this.store.errorCierreOperativo;
  readonly errorSnapshotCompleto = this.store.errorSnapshotCompleto;
  readonly exitoGuardadoResultado = this.store.exitoGuardadoResultado;
  readonly identificadorResultadoGuardadoActual = this.store.identificadorResultadoGuardadoActual;
  readonly aprobacionOperativa = this.store.aprobacionOperativa;
  readonly aprobandoResultado = this.store.aprobandoResultado;
  readonly cerrandoNomina = this.store.cerrandoNomina;
  readonly snapshotCompleto = this.store.snapshotCompleto;
  readonly confirmacionProceso = signal<ConfirmacionProcesoMensualView | null>(null);
  readonly detalleOperativoAbierto = signal(false);
  readonly detalleOperativoTabActivo = signal<DetalleOperativoTab>('trabajadores');
  readonly nominaWorkspaceTab = signal<NominaWorkspaceTab>('guia');
  readonly actaOperativaPreparada = signal(false);

  accionPeriodoEnCurso(): boolean {
    return this.store.accionPeriodoEnCurso();
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

  readonly detalleOperativoTabs = DETALLE_OPERATIVO_TABS;
  readonly payrollWorkerDetailColumns = PAYROLL_WORKER_DETAIL_COLUMNS;
  readonly payrollWorkerDetailFilters = PAYROLL_WORKER_DETAIL_FILTERS;
  readonly payrollMovementDetailColumns = PAYROLL_MOVEMENT_DETAIL_COLUMNS;
  readonly payrollMovementDetailFilters = PAYROLL_MOVEMENT_DETAIL_FILTERS;
  readonly payrollRecurrentDetailColumns = PAYROLL_RECURRENT_DETAIL_COLUMNS;
  readonly payrollRecurrentDetailFilters = PAYROLL_RECURRENT_DETAIL_FILTERS;
  readonly payrollObservationDetailColumns = PAYROLL_OBSERVATION_DETAIL_COLUMNS;
  readonly payrollObservationDetailFilters = PAYROLL_OBSERVATION_DETAIL_FILTERS;
  readonly payrollResultDetailColumns = PAYROLL_RESULT_DETAIL_COLUMNS;
  readonly payrollResultDetailFilters = PAYROLL_RESULT_DETAIL_FILTERS;

  readonly baseNominaTrazabilidad = computed(() => this.store.preNomina()?.trazabilidad ?? null);

  readonly cierreOperativo = computed<CierreOperativoView>(() => {
    const snapshot = this.store.snapshotActivo();
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
    const completo = this.store.snapshotCompleto();
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
    const calculo = this.store.calculo();
    const base = this.baseNominaTrazabilidad();
    const snapshot = this.store.snapshotActivo();

    if (!calculo) {
      const guardado = snapshot != null;
      const estado: ResultadoPreliminarEstado = this.store.errorGuardadoResultado()
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
    const hayResultadoActual = this.store.calculo() != null;
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

    const aprobacion = this.store.aprobacionOperativa();
    const aprobacionVigente =
      !!aprobacion &&
      hayGuardado &&
      !actualizadoSinGuardar &&
      aprobacion.identificadorResultado === (this.store.snapshotActivo()?.hashSnapshot ?? null);
    if (aprobacion) {
      estado = aprobacionVigente ? 'aprobado' : 'aprobado_desactualizado';
    }

    const puedeAprobar =
      hayGuardado &&
      !actualizadoSinGuardar &&
      bloqueos.length === 0 &&
      (guardado?.trabajadoresOmitidos ?? 0) === 0 &&
      validarPeriodoEntradaMensual(this.store.periodoSeleccionado()) &&
      !this.store.guardandoSnapshot() &&
      !this.store.aprobandoResultado() &&
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

  readonly validacionCalculo = computed<ValidacionCalculoPreliminarView>(() =>
    buildValidacionCalculoPreliminarView({
      periodo: this.store.periodoSeleccionado(),
      resultado: this.store.resultado(),
      preNomina: this.store.preNomina(),
      base: this.baseNominaTrazabilidad(),
      errorEjecucion: this.store.errorEjecucion(),
      nominaCerradaOperativamente: this.nominaEstaCerradaOperativamente(),
    }),
  );

  readonly dashboardResumen = computed(() => {
    const resultado = this.store.resultado();
    const preNomina = this.store.preNomina();
    const calculo = this.store.calculo();
    const snapshot = this.store.snapshotActivo();
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
      periodoValido: validarPeriodoEntradaMensual(this.store.periodoSeleccionado()),
      tienePrevalidacion: this.store.resultado() != null,
      bloqueosPrevalidacion: validacion.bloqueos.map((item) => this.pendienteDesdeValidacion(item)),
      advertenciasPrevalidacion: validacion.advertencias.map((item) => this.pendienteDesdeValidacion(item, 'warning')),
      informacionesPrevalidacion: validacion.informaciones.map((item) => this.pendienteDesdeValidacion(item, 'info')),
      baseGenerada: this.store.preNomina() != null,
      calculoGenerado: this.store.calculo() != null,
      calculoConBloqueos: resultado.bloqueos.length > 0 || this.store.calculo()?.estado === 'con_bloqueos',
      calculoConAdvertencias: resultado.advertencias.length > 0,
      bloqueosCalculo: resultado.bloqueos.map((item) => this.pendienteDesdeResultado(item, 'danger')),
      advertenciasCalculo: resultado.advertencias.map((item) => this.pendienteDesdeResultado(item, 'warning')),
      resultadoGuardado: this.store.snapshotActivo() != null,
      aprobadoOperativamente: this.store.aprobacionOperativa() != null,
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
    const snapshot = this.store.snapshotActivo();
    const estado = this.estadoOperativo();
    return buildNominaResumenSuperior({
      trabajadoresAptos: resumen.trabajadoresAptos,
      parametrosListos: resumen.parametrosListos,
      movimientosAprobados: resumen.movimientosAprobados,
      movimientosPendientes: resumen.movimientosPendientes,
      asignacionesAplicables: resumen.asignacionesAplicables,
      advertenciasCount: estado.advertencias.length,
      bloqueosCount: estado.bloqueos.length,
      snapshotTotalAdvertencias: snapshot?.totalAdvertencias ?? 0,
      snapshotTotalBloqueados: snapshot?.totalBloqueados ?? 0,
    });
  });

  readonly nominaVisualFrame = computed<NominaVisualFrame>(() =>
    resolveNominaVisualFrame({
      validando: this.store.validando(),
      generandoPreNomina: this.store.generandoPreNomina(),
      calculandoPreliminar: this.store.calculandoPreliminar(),
      estadoClave: this.estadoOperativo().estadoClave,
    }),
  );

  readonly nominaWorkspaceTabSugerida = computed<NominaWorkspaceTab>(() =>
    suggestNominaWorkspaceTab(this.nominaVisualFrame()),
  );

  private readonly syncNominaWorkspaceTab = effect(() => {
    const tab = this.nominaWorkspaceTabSugerida();
    untracked(() => this.nominaWorkspaceTab.set(tab));
  });

  readonly nominaFrame = computed<NominaVisualFrameView>(() => {
    const estado = this.estadoOperativo();
    return buildNominaFrameView({
      frame: this.nominaVisualFrame(),
      accion: estado.accionPrincipal,
      periodoEtiqueta: this.periodoActivo.etiqueta(),
      bloqueosCount: estado.bloqueos.length,
      advertenciasCount: estado.advertencias.length,
      trabajadoresCount: this.dashboardResumen().trabajadoresAptos ?? this.store.snapshotActivo()?.totalTrabajadores ?? 0,
      resumenRevisionTrabajadores: this.resumenRevisionTrabajadores(),
      accionPeriodoEnCurso: this.accionPeriodoEnCurso(),
    });
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
    const snapshot = this.store.snapshotActivo();
    const cierre = snapshot?.cierreOperativo;
    const items: Array<{ hora: string; texto: string; destacado: boolean }> = [];
    if (this.store.preNomina()) items.push({ hora: this.horaCorta(this.store.preNomina()?.generadoEn), texto: 'Se generó nómina mensual preliminar.', destacado: false });
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

  readonly bitacoraEtapas = computed<BitacoraEtapaVm[]>(() =>
    buildBitacoraEtapas({
      estado: this.estadoOperativo(),
      tieneResultado: this.store.resultado() != null,
      tienePreNomina: this.store.preNomina() != null,
      tieneCalculo: this.store.calculo() != null,
      tieneSnapshot: this.store.snapshotActivo() != null,
      tieneAprobacion: this.store.aprobacionOperativa() != null,
      nominaCerrada: this.nominaEstaCerradaOperativamente(),
    }),
  );

  readonly registroPeriodoLinea = computed(() => {
    const partes = [
      this.store.resultado() ? 'periodo revisado' : 'nomina sin generar',
      this.store.preNomina() ? 'borrador generado' : 'borrador pendiente',
      this.store.calculo() ? 'trabajadores revisados' : 'revision pendiente',
      this.store.snapshotActivo() ? 'version revisable guardada' : 'version revisable pendiente',
    ];
    if (this.nominaEstaCerradaOperativamente()) {
      partes.push('nomina confirmada');
    } else if (this.store.aprobacionOperativa()) {
      partes.push('lista para confirmar');
    } else if (this.store.snapshotActivo()) {
      partes.push('confirmacion pendiente');
    }
    return partes.join(' · ');
  });

  readonly bitacoraRailEtapas = computed<BitacoraRailEtapaVm[]>(() => mapBitacoraRailEtapas(this.bitacoraEtapas()));

  readonly alertasPeriodoResumen = computed<AlertasPeriodoResumenVm>(() => {
    const estado = this.estadoOperativo();
    return buildAlertasPeriodoResumen({
      validando: this.store.validando(),
      tieneResultado: this.store.resultado() != null,
      bloqueosCount: estado.bloqueos.length,
      advertenciasCount: estado.advertencias.length,
    });
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
    const snapshot = this.store.snapshotActivo();
    const bloqueos = [
      ...estadoOperativo.bloqueos.map((item) => item.titulo),
      ...resultado.bloqueos.map((item) => item.titulo),
    ];
    const advertencias = [
      ...estadoOperativo.advertencias.map((item) => item.titulo),
      ...resultado.advertencias.map((item) => item.titulo),
    ];
    const tieneValidacionMinima = validarPeriodoEntradaMensual(this.store.periodoSeleccionado()) && (
      this.store.resultado() != null || this.store.preNomina() != null || this.store.calculo() != null || snapshot != null
    );
    return buildActaOperativaPeriodoViewModel({
      periodoLabel: this.periodoActivo.etiqueta() || this.store.periodoSeleccionado(),
      periodoValido: validarPeriodoEntradaMensual(this.store.periodoSeleccionado()),
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
    return (this.store.resultado()?.entradasMensuales ?? [])
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
    const recurrentesDesdeEntradas = (this.store.resultado()?.entradasMensuales ?? [])
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
    const snapshot = this.store.snapshotActivo();
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
    const calculo = this.store.calculo();
    const snapshot = this.store.snapshotActivo();

    if (!calculo) {
      return `${accion.label}: ${accion.descripcion}`;
    }
    if (!snapshot) {
      return 'Guarda el resultado preliminar para revision.';
    }
    return 'Resultado preliminar disponible para revision.';
  });

  validarPeriodo(): void {
    this.store.validarPeriodo();
  }

  generarPreNomina(): void {
    this.store.generarPreNomina();
  }

  calcularPreliminar(): void {
    if (!this.puedeCalcularPreliminar()) return;
    this.store.calcularPreliminar();
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
    this.store.ejecutarGuardarSnapshotPreliminar();
  }

  verSnapshotActivo(): void {
    this.store.verSnapshotActivo();
  }

  consultarDetalleResultadoGuardado(): void {
    this.store.consultarDetalleResultadoGuardado();
  }

  private resetearEstadoPeriodo(): void {
    this.store.resetearEstadoPeriodo();
    this.confirmacionProceso.set(null);
    this.actaOperativaPreparada.set(false);
  }

  recalcularYReemplazarSnapshot(): void {
    this.store.recalcularYReemplazarSnapshot();
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
    const r = this.store.resultado();
    return !!r && r.estado !== 'BLOQUEADO' && !this.nominaEstaCerradaOperativamente() && !this.store.validando() && !this.store.generandoPreNomina();
  }

  puedeCalcularPreliminar(): boolean {
    return this.validacionCalculo().puedeCalcular && !this.nominaEstaCerradaOperativamente() && !this.store.validando() && !this.store.generandoPreNomina() && !this.store.calculandoPreliminar();
  }

  aprobarResultadoPreliminar(): void {
    const revision = this.revisionAprobacion();
    const snapshot = this.store.snapshotActivo();
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
    this.store.ejecutarAprobacionOperativa(advertenciasAprobacion);
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
    const calc = this.store.calculo();
    if (!validarPeriodoEntradaMensual(this.store.periodoSeleccionado())) return false;
    if (this.nominaEstaCerradaOperativamente()) return false;
    if (!calc || this.store.errorEjecucion()) return false;
    if (this.store.guardandoSnapshot()) return false;
    if (calc.estado === 'con_bloqueos' || calc.issues.some((i) => i.severidad === 'BLOQUEO')) return false;
    const snapshot = this.store.snapshotActivo();
    return !snapshot || this.store.identificadorResultadoGuardadoActual() !== snapshot.hashSnapshot;
  }

  nominaEstaCerradaOperativamente(): boolean {
    return this.store.nominaEstaCerradaOperativamente();
  }

  puedeCerrarNominaOperativa(): boolean {
    return !this.motivoNoPuedeCerrarNomina();
  }

  motivoNoPuedeCerrarNomina(): string | undefined {
    const snapshot = this.store.snapshotActivo();
    if (!validarPeriodoEntradaMensual(this.store.periodoSeleccionado())) return 'El periodo seleccionado no es valido.';
    if (!snapshot?.idCalculoPeriodo) return 'Primero debe existir una version revisable guardada vigente.';
    if (snapshot.cierreOperativo?.estado === 'cerrado_operativamente') return 'La nomina mensual ya esta confirmada.';
    if (snapshot.aprobacionOperativa?.estado !== 'aprobado_operativamente') return 'La revision debe estar confirmada antes de confirmar la nomina.';
    if (this.resultadoPreliminar().estado === 'actualizado_sin_guardar') return 'Hay una version actualizada sin guardar.';
    if (snapshot.totalBloqueados > 0) return 'Existen trabajadores bloqueados pendientes en la version guardada.';
    if (this.store.guardandoSnapshot() || this.store.aprobandoResultado() || this.store.cerrandoNomina()) return 'Hay una operacion en curso.';
    return undefined;
  }

  abrirConfirmacionCierreNominaOperativa(): void {
    this.confirmacionProceso.set({
      tipo: 'cerrar_nomina',
      titulo: 'Confirmar nómina mensual',
      mensaje: `Vas a confirmar la nomina mensual de ${this.store.periodoSeleccionado()}.`,
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
    const snapshot = this.store.snapshotActivo();
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
            `Periodo ${this.periodoActivo.etiqueta() || this.store.periodoSeleccionado()}.`,
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
    if (!this.puedeCerrarNominaOperativa()) return;
    this.store.ejecutarCierreNominaOperativa();
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
        descripcion: this.store.aprobacionOperativa()
          ? 'RRHH registro una aprobacion operativa interna para el resultado preliminar.'
          : 'Pendiente de aprobacion operativa interna por RRHH.',
        estado: this.store.aprobacionOperativa() ? 'Completo' : input.hayGuardado ? 'Pendiente' : 'No aplica',
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
    if (this.store.errorGuardadoResultado()) return 'error_guardado';
    if (calculo.estado === 'con_bloqueos' || bloqueos.length > 0) return 'con_bloqueos';
    const snapshot = this.store.snapshotActivo();
    if (!snapshot) return 'no_guardado';
    return this.store.identificadorResultadoGuardadoActual() === snapshot.hashSnapshot
      ? 'guardado'
      : 'actualizado_sin_guardar';
  }

  private razonNoPuedeGuardarResultado(bloqueos: ResultadoObservacionView[]): string {
    if (!validarPeriodoEntradaMensual(this.store.periodoSeleccionado())) return 'El periodo seleccionado no es valido.';
    if (this.nominaEstaCerradaOperativamente()) return 'La nómina del período está cerrada. Para modificarla, será necesario reabrir el período en una fase posterior.';
    if (!this.store.calculo()) return 'Primero calcula preliminarmente la nómina.';
    if (this.store.errorEjecucion()) return 'Hay un error tecnico activo que debes resolver antes de guardar.';
    if (bloqueos.length > 0) return 'El resultado tiene bloqueos que deben revisarse.';
    const snapshot = this.store.snapshotActivo();
    if (snapshot && this.store.identificadorResultadoGuardadoActual() === snapshot.hashSnapshot) {
      return 'No hay cambios para guardar. El resultado preliminar actual ya esta guardado.';
    }
    if (this.store.guardandoSnapshot()) return 'El guardado del resultado preliminar esta en curso.';
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
    if (!validarPeriodoEntradaMensual(this.store.periodoSeleccionado())) return 'El periodo no es valido para aprobacion operativa.';
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
    return formatoMontoNomina(valor);
  }

  private formatoFechaHora(valor: string | null | undefined): string {
    return formatoFechaHoraNomina(valor);
  }

  private horaCorta(valor: string | null | undefined): string {
    return horaCortaNomina(valor);
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
