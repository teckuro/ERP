import type {
  MotorCalculoIssue,
  MotorCalculoPeriodoResultado,
  NominaCalculoPeriodoSnapshot,
  NominaSnapshotCompletoView,
  ProcesoMensualPreNominaPeriodo,
} from '../models/proceso-mensual.model';
import {
  formatoFechaHoraNomina,
  formatoMontoNomina,
} from '../containers/proceso-mensual-container/utils/proceso-mensual-presentacion.formato';
import { etiquetaEstadoSnapshot } from '../containers/proceso-mensual-container/utils/proceso-mensual-presentacion.labels';
import type {
  ResultadoObservacionView,
  ResultadoPreliminarEstado,
  ResultadoPreliminarView,
  TrabajadorResultadoPreliminarView,
} from '../containers/proceso-mensual-container/models/proceso-mensual-container.vm';

export interface BuildResultadoPreliminarInput {
  calculo: MotorCalculoPeriodoResultado | null;
  base: ProcesoMensualPreNominaPeriodo['trazabilidad'] | null;
  snapshotActivo: NominaCalculoPeriodoSnapshot | null;
  snapshotCompleto: NominaSnapshotCompletoView | null;
  errorGuardadoResultado: string | null;
  identificadorResultadoGuardadoActual: string | null;
  puedeCalcular: boolean;
  puedeGuardarPreliminar: boolean;
  periodoValido: boolean;
  nominaCerradaOperativamente: boolean;
  errorEjecucion: string | null;
  guardandoSnapshot: boolean;
}

function etiquetaResultadoPreliminar(estado: ResultadoPreliminarEstado): string {
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

function descripcionEstadoGuardado(estado: ResultadoPreliminarEstado): string {
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

function estadoResultadoTrabajador(estado: string): TrabajadorResultadoPreliminarView['estadoLabel'] {
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

function accionResultadoDesdeIssues(
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

function observacionesResultado(
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
      ...accionResultadoDesdeIssues([issue]),
    }));
}

function resolverEstadoGuardadoResultado(
  input: BuildResultadoPreliminarInput,
  calculo: MotorCalculoPeriodoResultado,
  bloqueos: ResultadoObservacionView[],
): ResultadoPreliminarEstado {
  if (input.errorGuardadoResultado) return 'error_guardado';
  if (calculo.estado === 'con_bloqueos' || bloqueos.length > 0) return 'con_bloqueos';
  const snapshot = input.snapshotActivo;
  if (!snapshot) return 'no_guardado';
  return input.identificadorResultadoGuardadoActual === snapshot.hashSnapshot
    ? 'guardado'
    : 'actualizado_sin_guardar';
}

function razonNoPuedeGuardarResultado(
  input: BuildResultadoPreliminarInput,
  bloqueos: ResultadoObservacionView[],
): string {
  if (!input.periodoValido) return 'El periodo seleccionado no es valido.';
  if (input.nominaCerradaOperativamente) {
    return 'La nómina del período está cerrada. Para modificarla, será necesario reabrir el período en una fase posterior.';
  }
  if (!input.calculo) return 'Primero calcula preliminarmente la nómina.';
  if (input.errorEjecucion) return 'Hay un error tecnico activo que debes resolver antes de guardar.';
  if (bloqueos.length > 0) return 'El resultado tiene bloqueos que deben revisarse.';
  const snapshot = input.snapshotActivo;
  if (snapshot && input.identificadorResultadoGuardadoActual === snapshot.hashSnapshot) {
    return 'No hay cambios para guardar. El resultado preliminar actual ya esta guardado.';
  }
  if (input.guardandoSnapshot) return 'El guardado del resultado preliminar esta en curso.';
  return 'Genera un resultado preliminar sin bloqueos antes de guardar.';
}

function ultimoGuardadoDesdeSnapshot(
  snapshot: NominaCalculoPeriodoSnapshot,
): ResultadoPreliminarView['ultimoGuardado'] {
  const advertencias = snapshot.totalAdvertencias ?? 0;
  return {
    versionLabel: snapshot.idCalculoPeriodo
      ? `Disponible como referencia interna ${snapshot.idCalculoPeriodo}`
      : 'Version numerica no disponible en esta etapa.',
    fechaGuardadoLabel: formatoFechaHoraNomina(snapshot.fechaGeneracion),
    versionCalculoLabel: snapshot.versionMotor || 'Version no disponible',
    identificadorTecnicoLabel: snapshot.hashSnapshot || 'Referencia interna no disponible',
    estadoLabel: etiquetaEstadoSnapshot(snapshot.estado),
    trabajadoresCalculados: snapshot.totalTrabajadores,
    trabajadoresConObservaciones: advertencias,
    trabajadoresOmitidos: snapshot.totalBloqueados,
    totalLiquidoLabel: formatoMontoNomina(snapshot.totalLiquido),
    advertenciasLabel: advertencias > 0
      ? `Este resultado se guardo con ${advertencias} advertencia(s) no bloqueante(s).`
      : 'Resultado guardado sin advertencias.',
  };
}

function trabajadoresDesdeSnapshotGuardado(
  snapshotCompleto: NominaSnapshotCompletoView | null,
): TrabajadorResultadoPreliminarView[] {
  if (!snapshotCompleto?.trabajadores.length) {
    return [];
  }
  return snapshotCompleto.trabajadores.map((trabajador) => {
    const estadoLabel = estadoResultadoTrabajador(trabajador.estado);
    return {
      idPersona: trabajador.idPersona,
      trabajadorLabel: trabajador.nombreCompletoSnapshot?.trim() || 'Trabajador sin ficha visible',
      rutLabel: trabajador.rut?.trim() || 'RUT no disponible',
      estadoLabel,
      haberesLabel: formatoMontoNomina(trabajador.totalHaberesImponibles + trabajador.totalHaberesNoImponibles),
      descuentosLabel: formatoMontoNomina(trabajador.totalDescuentosLegales + trabajador.totalDescuentosVoluntarios),
      liquidoLabel: formatoMontoNomina(trabajador.liquidoPreliminar),
      observacionLabel: trabajador.issues.length
        ? trabajador.issues.map((issue) => issue.mensaje).join('; ')
        : 'Sin observaciones',
      accionLabel:
        estadoLabel === 'Omitido' || estadoLabel === 'No calculado'
          ? 'Revisar trabajadores'
          : estadoLabel === 'Con observaciones'
            ? 'Revisar antes de confirmar'
            : 'Sin acción pendiente',
    };
  });
}

export function buildResultadoPreliminarView(input: BuildResultadoPreliminarInput): ResultadoPreliminarView {
  const { calculo, base, snapshotActivo: snapshot } = input;

  if (!calculo) {
    const guardado = snapshot != null;
    const estado: ResultadoPreliminarEstado = input.errorGuardadoResultado
      ? 'error_guardado'
      : guardado
        ? 'guardado'
        : 'sin_resultado';
    return {
      estado,
      estadoLabel: etiquetaResultadoPreliminar(estado),
      descripcionEstado: descripcionEstadoGuardado(estado),
      resumen: {
        trabajadoresCalculados: snapshot?.totalTrabajadores ?? 0,
        trabajadoresConObservaciones: snapshot?.totalAdvertencias ?? 0,
        trabajadoresOmitidos: snapshot?.totalBloqueados ?? 0,
        totalHaberes: snapshot?.totalHaberes ?? null,
        totalDescuentos: snapshot?.totalDescuentos ?? null,
        totalLiquido: snapshot?.totalLiquido ?? null,
        totalCostoEmpresa: null,
      },
      trabajadores: trabajadoresDesdeSnapshotGuardado(input.snapshotCompleto),
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
      ultimoGuardado: snapshot ? ultimoGuardadoDesdeSnapshot(snapshot) : undefined,
      acciones: {
        puedeRecalcular: input.puedeCalcular,
        puedeGuardarPreliminar: false,
        razonNoPuedeGuardar: guardado
          ? 'No hay cambios para guardar. El resultado preliminar actual ya esta guardado.'
          : 'Primero calcula preliminarmente la nómina.',
        helperGuardar: 'Guarda una versión revisable del cálculo. No emite liquidaciones ni cierra el período.',
        modoGuardadoLabel: 'Al guardar, se reemplazara el resultado preliminar activo del periodo.',
      },
    };
  }

  const bloqueos = observacionesResultado(calculo, 'BLOQUEO');
  const advertencias = observacionesResultado(calculo, 'ADVERTENCIA');
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
      const estadoLabel = estadoResultadoTrabajador(liq.estado);
      return {
        idPersona: liq.idPersona,
        trabajadorLabel: liq.nombreCompleto?.trim() || 'Trabajador sin ficha visible',
        rutLabel: liq.rut?.trim() || 'RUT no disponible',
        estadoLabel,
        haberesLabel: formatoMontoNomina(liq.totalHaberes),
        descuentosLabel: formatoMontoNomina(liq.totalDescuentos),
        liquidoLabel: formatoMontoNomina(liq.liquidoAPago),
        observacionLabel: liq.issues.length ? liq.issues.map((issue) => issue.mensaje).join('; ') : 'Sin observaciones',
        ...accionResultadoDesdeIssues(liq.issues),
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
  const estado = resolverEstadoGuardadoResultado(input, calculo, bloqueos);
  const puedeGuardarPreliminar = input.puedeGuardarPreliminar;

  return {
    estado,
    estadoLabel: etiquetaResultadoPreliminar(estado),
    descripcionEstado: descripcionEstadoGuardado(estado),
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
    ultimoGuardado: snapshot ? ultimoGuardadoDesdeSnapshot(snapshot) : undefined,
    acciones: {
      puedeRecalcular: input.puedeCalcular,
      puedeGuardarPreliminar,
      razonNoPuedeGuardar: puedeGuardarPreliminar
        ? undefined
        : razonNoPuedeGuardarResultado(input, bloqueos),
      helperGuardar: 'Guarda una versión revisable del cálculo. No emite liquidaciones ni cierra el período.',
      modoGuardadoLabel: 'Al guardar, se reemplazara el resultado preliminar activo del periodo.',
    },
  };
}
