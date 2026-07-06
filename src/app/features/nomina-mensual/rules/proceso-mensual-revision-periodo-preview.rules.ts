import type { InformacionPeriodoResumenVerificacion } from '../containers/proceso-mensual-container/models/proceso-mensual-container.vm';
import type { ProcesoMensualPendienteVm } from './proceso-mensual-estado-operativo.rules';
import type { ValidacionCalculoPreliminarView } from '../containers/proceso-mensual-container/models/proceso-mensual-container.vm';
import type { IncidenciasPeriodoView } from './proceso-mensual-incidencias-periodo.rules';
import { limpiarCopyTecnicoNomina } from './proceso-mensual-copy-limpio.rules';

export type RevisionPeriodoEjeEstado = 'listo' | 'pendiente' | 'sin_evaluar';

export type RevisionPeriodoPreviewAccionTipo =
  | 'validar_periodo'
  | 'revisar_fichas'
  | 'generar_nomina'
  | 'pendiente';

export interface RevisionPeriodoPreviewEje {
  id: 'parametros' | 'trabajadores' | 'movimientos' | 'recurrentes';
  label: string;
  detalle: string;
  estado: RevisionPeriodoEjeEstado;
}

export interface RevisionPeriodoPreviewPendiente {
  codigo: string;
  titulo: string;
  detalle: string;
}

export interface RevisionPeriodoPreviewAccion {
  label: string;
  tipo: RevisionPeriodoPreviewAccionTipo;
  codigoPendiente?: string;
}

export interface RevisionPeriodoPreviewVm {
  visible: boolean;
  tituloSeccion: string;
  tituloModal: string;
  bajada: string;
  sinVerificar: boolean;
  metricas: InformacionPeriodoResumenVerificacion | null;
  ejes: RevisionPeriodoPreviewEje[];
  pendientes: RevisionPeriodoPreviewPendiente[];
  accionPrincipal: RevisionPeriodoPreviewAccion | null;
  accionSecundaria: RevisionPeriodoPreviewAccion | null;
}

export interface BuildRevisionPeriodoPreviewInput {
  baseGenerada: boolean;
  tienePrevalidacion: boolean;
  puedeGenerarNomina: boolean;
  prevalidacionEstado: string | null;
  queFaltaAhora: readonly ProcesoMensualPendienteVm[];
  validacionCalculo: ValidacionCalculoPreliminarView;
  dashboard: {
    parametrosListos: boolean | null;
    trabajadoresAptos: number | null;
    trabajadoresPorRevisar: number | null;
    movimientosAprobados: number;
    movimientosPendientes: number;
    asignacionesAplicables: number | null;
    asignacionesPorRevisar: number | null;
  };
  fichasPendientesCount: number;
  incidencias: IncidenciasPeriodoView;
}

const TITULO_SECCION = 'Qué falta ahora';
const TITULO_MODAL = 'Revisión del período antes de generar';

function asArray<T>(value: readonly T[] | null | undefined): T[] {
  return Array.isArray(value) ? [...value] : [];
}

function metricasPreview(input: BuildRevisionPeriodoPreviewInput): InformacionPeriodoResumenVerificacion {
  const bloqueosValidacion = asArray(input.validacionCalculo.bloqueos).filter((b) => b.codigo !== 'BLOQ-005').length;
  const bloqueosOperativos = asArray(input.queFaltaAhora).filter((p) => p.severidad === 'danger').length;
  const advertenciasValidacion = asArray(input.validacionCalculo.advertencias).length;
  const advertenciasOperativos = asArray(input.queFaltaAhora).filter((p) => p.severidad === 'warning').length;
  return {
    criticos: Math.max(bloqueosValidacion, bloqueosOperativos, input.incidencias.resumen.bloqueos),
    advertencias: Math.max(advertenciasValidacion, advertenciasOperativos, input.incidencias.resumen.advertencias),
    trabajadoresPendientes: input.fichasPendientesCount,
  };
}

function estadoParametros(parametrosListos: boolean | null, incidenciasParam: number): RevisionPeriodoEjeEstado {
  if (parametrosListos == null) return 'sin_evaluar';
  if (!parametrosListos || incidenciasParam > 0) return 'pendiente';
  return 'listo';
}

function buildEjes(input: BuildRevisionPeriodoPreviewInput): RevisionPeriodoPreviewEje[] {
  const d = input.dashboard;
  const inc = input.incidencias.porAmbito;
  const paramInc = (inc.parametros ?? []).filter((i) => i.severidad !== 'info').length;
  const movInc = (inc.movimientos ?? []).filter((i) => i.severidad !== 'info').length;
  const recInc = (inc.recurrentes ?? []).filter((i) => i.severidad !== 'info').length;

  const ejes: RevisionPeriodoPreviewEje[] = [
    {
      id: 'parametros',
      label: 'Parámetros',
      detalle:
        d.parametrosListos == null
          ? 'Sin evaluar'
          : d.parametrosListos
            ? 'Listos para el período'
            : 'Por revisar',
      estado: estadoParametros(d.parametrosListos, paramInc),
    },
    {
      id: 'trabajadores',
      label: 'Trabajadores',
      detalle:
        d.trabajadoresAptos == null
          ? 'Sin evaluar'
          : input.fichasPendientesCount > 0
            ? `${input.fichasPendientesCount} ficha${input.fichasPendientesCount === 1 ? '' : 's'} por corregir`
            : `${d.trabajadoresAptos ?? 0} listos · ${d.trabajadoresPorRevisar ?? 0} bloqueados`,
      estado:
        d.trabajadoresAptos == null
          ? 'sin_evaluar'
          : input.fichasPendientesCount > 0 || (d.trabajadoresPorRevisar ?? 0) > 0
            ? 'pendiente'
            : 'listo',
    },
    {
      id: 'movimientos',
      label: 'Movimientos del mes',
      detalle: `${d.movimientosAprobados} aprobados · ${d.movimientosPendientes} pendientes`,
      estado: d.movimientosPendientes > 0 || movInc > 0 ? 'pendiente' : 'listo',
    },
    {
      id: 'recurrentes',
      label: 'Recurrentes',
      detalle:
        d.asignacionesAplicables == null
          ? 'Sin evaluar'
          : `${d.asignacionesAplicables} vigentes · ${d.asignacionesPorRevisar ?? 0} por revisar`,
      estado:
        d.asignacionesAplicables == null
          ? 'sin_evaluar'
          : (d.asignacionesPorRevisar ?? 0) > 0 || recInc > 0
            ? 'pendiente'
            : 'listo',
    },
  ];
  return ejes;
}

function pendienteDesdeVm(p: ProcesoMensualPendienteVm): RevisionPeriodoPreviewPendiente {
  return {
    codigo: p.codigo,
    titulo: limpiarCopyTecnicoNomina(p.titulo),
    detalle: limpiarCopyTecnicoNomina(p.descripcion || p.titulo),
  };
}

function buildPendientesLista(input: BuildRevisionPeriodoPreviewInput, max = 5): RevisionPeriodoPreviewPendiente[] {
  const seen = new Set<string>();
  const out: RevisionPeriodoPreviewPendiente[] = [];
  for (const p of asArray(input.queFaltaAhora)) {
    const norm = p.codigo.trim();
    if (!norm || seen.has(norm)) continue;
    seen.add(norm);
    out.push(pendienteDesdeVm(p));
    if (out.length >= max) break;
  }
  if (out.length < max && input.tienePrevalidacion) {
    for (const b of asArray(input.validacionCalculo.bloqueos)) {
      if (b.codigo === 'BLOQ-005' || seen.has(b.codigo)) continue;
      seen.add(b.codigo);
      out.push({
        codigo: b.codigo,
        titulo: limpiarCopyTecnicoNomina(b.titulo),
        detalle: limpiarCopyTecnicoNomina(b.descripcion),
      });
      if (out.length >= max) break;
    }
  }
  if (out.length < max && input.tienePrevalidacion) {
    for (const a of asArray(input.validacionCalculo.advertencias)) {
      if (seen.has(a.codigo)) continue;
      seen.add(a.codigo);
      out.push({
        codigo: a.codigo,
        titulo: limpiarCopyTecnicoNomina(a.titulo),
        detalle: limpiarCopyTecnicoNomina(a.descripcion),
      });
      if (out.length >= max) break;
    }
  }
  return out;
}

function resolveAcciones(input: BuildRevisionPeriodoPreviewInput): {
  principal: RevisionPeriodoPreviewAccion | null;
  secundaria: RevisionPeriodoPreviewAccion | null;
  bajada: string;
} {
  if (!input.tienePrevalidacion) {
    return {
      principal: { label: 'Verificar período', tipo: 'validar_periodo' },
      secundaria: null,
      bajada: 'Verifique el período para ver qué falta antes de generar la nómina mensual.',
    };
  }

  const metricas = metricasPreview(input);
  const bloqueos = metricas.criticos > 0;
  const fichas = input.fichasPendientesCount > 0;
  const puedeGenerarConAdvertencias =
    input.puedeGenerarNomina
    && (input.prevalidacionEstado === 'CON_ADVERTENCIAS'
      || input.validacionCalculo.estado === 'advertencias');

  if (bloqueos) {
    const primeroPendiente = asArray(input.queFaltaAhora).find((p) => p.severidad === 'danger');
    const primeroValidacion = asArray(input.validacionCalculo.bloqueos).find((b) => b.codigo !== 'BLOQ-005');
    return {
      principal: primeroPendiente
        ? {
            label: primeroPendiente.accionLabel ?? primeroPendiente.titulo,
            tipo: 'pendiente',
            codigoPendiente: primeroPendiente.codigo,
          }
        : primeroValidacion
          ? {
              label: primeroValidacion.accionLabel ?? primeroValidacion.titulo,
              tipo: 'pendiente',
              codigoPendiente: primeroValidacion.codigo,
            }
          : { label: 'Corregir pendientes', tipo: 'pendiente' },
      secundaria: fichas ? { label: 'Revisar trabajadores', tipo: 'revisar_fichas' } : null,
      bajada: fichas
        ? `Hay ${metricas.criticos} bloqueo${metricas.criticos === 1 ? '' : 's'} crítico${metricas.criticos === 1 ? '' : 's'} y fichas por corregir.`
        : 'Corrige los puntos críticos antes de generar la nómina mensual.',
    };
  }

  if (fichas) {
    return {
      principal: { label: 'Revisar trabajadores', tipo: 'revisar_fichas' },
      secundaria: puedeGenerarConAdvertencias
        ? { label: 'Generar nómina', tipo: 'generar_nomina' }
        : null,
      bajada:
        input.fichasPendientesCount === 1
          ? 'Hay 1 trabajador con ficha pendiente antes de generar.'
          : `Hay ${input.fichasPendientesCount} trabajadores con ficha pendiente antes de generar.`,
    };
  }

  if (metricas.advertencias > 0) {
    return {
      principal: input.puedeGenerarNomina
        ? { label: 'Generar nómina', tipo: 'generar_nomina' }
        : { label: 'Revisar advertencias', tipo: 'pendiente', codigoPendiente: asArray(input.validacionCalculo.advertencias)[0]?.codigo },
      secundaria: { label: 'Ver detalle del período', tipo: 'pendiente' },
      bajada: input.puedeGenerarNomina
        ? 'Hay advertencias que puede revisar o continuar para generar la nómina.'
        : 'Revise las advertencias del período antes de continuar.',
    };
  }

  return {
    principal: input.puedeGenerarNomina ? { label: 'Generar nómina', tipo: 'generar_nomina' } : null,
    secundaria: null,
    bajada: 'No hay bloqueos críticos. Puede generar la nómina mensual del período.',
  };
}

export function buildRevisionPeriodoPreview(input: BuildRevisionPeriodoPreviewInput): RevisionPeriodoPreviewVm {
  if (input.baseGenerada) {
    return {
      visible: false,
      tituloSeccion: TITULO_SECCION,
      tituloModal: TITULO_MODAL,
      bajada: '',
      sinVerificar: false,
      metricas: null,
      ejes: [],
      pendientes: [],
      accionPrincipal: null,
      accionSecundaria: null,
    };
  }

  const acciones = resolveAcciones(input);
  return {
    visible: true,
    tituloSeccion: TITULO_SECCION,
    tituloModal: TITULO_MODAL,
    bajada: acciones.bajada,
    sinVerificar: !input.tienePrevalidacion,
    metricas: input.tienePrevalidacion ? metricasPreview(input) : null,
    ejes: input.tienePrevalidacion ? buildEjes(input) : [],
    pendientes: buildPendientesLista(input),
    accionPrincipal: acciones.principal,
    accionSecundaria: acciones.secundaria,
  };
}
