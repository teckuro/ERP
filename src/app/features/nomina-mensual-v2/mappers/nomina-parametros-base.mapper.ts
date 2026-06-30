import type { Json } from '../../../core/models/database.types';
import type { ParametroGeneral } from '../../parametros-generales/models/parametro-general.model';
import type {
  NominaCalculoParametroSnapshot,
  NominaCalculoPeriodoSnapshot,
  NominaCalculoTrazabilidadSnapshot,
} from '../../nomina-mensual/models/proceso-mensual.model';
import {
  calcularHashParametros,
  calcularSnapshotHash,
  construirParametrosCongelados,
} from '../../nomina-mensual/rules/proceso-mensual-snapshot.rules';
import type { NominaParametrosResumen } from '../models/nomina-parametros-resumen.models';
import {
  CODIGO_TRAZA_PARAMETROS_BASE,
  TIPO_SNAPSHOT_PARAMETROS_BASE,
  VERSION_MOTOR_PARAMETROS_BASE,
  type OrigenBaseParametrosAlAvanzar,
  type ParametroBaseCongeladoDetalle,
  type ResumenParametrosBaseMetadata,
  type VistaPreviaParametrosBase,
} from '../models/nomina-parametros-base.models';

export function esSnapshotParametrosBase(cabecera: NominaCalculoPeriodoSnapshot): boolean {
  if (cabecera.versionMotor === VERSION_MOTOR_PARAMETROS_BASE) {
    return true;
  }
  return cabecera.trazabilidad?.some((t) => t.codigo === CODIGO_TRAZA_PARAMETROS_BASE) ?? false;
}

export function buildVistaPreviaParametrosBase(
  resumen: NominaParametrosResumen,
  totalParametrosCongelados: number,
): VistaPreviaParametrosBase {
  return {
    periodo: resumen.periodo,
    periodoEtiqueta: formatearPeriodoEtiqueta(resumen.periodo),
    seccionesListas: resumen.seccionesListas,
    seccionesTotales: resumen.seccionesTotales,
    controlesVerificados: resumen.controlesVerificados,
    bloqueos: resumen.bloqueos,
    requiereRevision: resumen.requiereRevision,
    totalParametrosCongelados,
  };
}

export function buildResumenParametrosBaseMetadata(
  resumen: NominaParametrosResumen,
): ResumenParametrosBaseMetadata {
  return {
    seccionesListas: resumen.seccionesListas,
    seccionesTotales: resumen.seccionesTotales,
    controlesVerificados: resumen.controlesVerificados,
    bloqueos: resumen.bloqueos,
    requiereRevision: resumen.requiereRevision,
  };
}

export function buildSnapshotParametrosBasePayload(args: {
  periodo: string;
  parametros: ParametroGeneral | null;
  resumen: NominaParametrosResumen;
  fechaGeneracion: string;
  usuarioGenerador?: string | null;
  idEmpresa?: number | null;
  nominaPeriodoId?: string | null;
  fechaInicioRango?: string | null;
  fechaFinRango?: string | null;
}): NominaCalculoPeriodoSnapshot {
  const parametrosCongelados = construirParametrosCongelados(args.parametros);
  const hashParametros = calcularHashParametros(parametrosCongelados);
  const trazabilidad = buildTrazabilidadParametrosBase(args.resumen, {
    fechaInicio: args.fechaInicioRango ?? args.resumen.fechaInicioRango,
    fechaFin: args.fechaFinRango ?? args.resumen.fechaFinRango,
  });
  const snapshotSinHash: NominaCalculoPeriodoSnapshot = {
    periodo: args.periodo,
    nominaPeriodoId: args.nominaPeriodoId ?? args.resumen.nominaPeriodoId ?? null,
    idEmpresa: args.idEmpresa ?? null,
    estado: 'borrador',
    fechaGeneracion: args.fechaGeneracion,
    usuarioGenerador: args.usuarioGenerador ?? null,
    totalTrabajadores: 0,
    totalHaberes: 0,
    totalDescuentos: 0,
    totalLiquido: 0,
    totalBloqueados: 0,
    totalAdvertencias: args.resumen.requiereRevision,
    versionMotor: VERSION_MOTOR_PARAMETROS_BASE,
    hashSnapshot: null,
    hashParametros,
    hashEntradas: null,
    origen: 'manual',
    activo: true,
    reemplazadoPor: null,
    aprobacionOperativa: null,
    cierreOperativo: null,
    trabajadores: [],
    issues: [],
    trazabilidad,
    parametros: parametrosCongelados,
  };

  return {
    ...snapshotSinHash,
    hashSnapshot: calcularSnapshotHash({
      tipoSnapshot: TIPO_SNAPSHOT_PARAMETROS_BASE,
      versionMotor: VERSION_MOTOR_PARAMETROS_BASE,
      periodo: args.periodo,
      hashParametros,
      totalParametros: parametrosCongelados.length,
    }),
  };
}

export function buildMetadataPersistenciaParametrosBase(
  resumen: NominaParametrosResumen,
): Record<string, Json> {
  return {
    tipoSnapshot: TIPO_SNAPSHOT_PARAMETROS_BASE,
    resumenParametrosBase: buildResumenParametrosBaseMetadata(resumen) as unknown as Json,
    ...(resumen.nominaPeriodoId ? { nominaPeriodoId: resumen.nominaPeriodoId } : {}),
    ...(resumen.fechaInicioRango && resumen.fechaFinRango
      ? {
          rangoLegal: {
            fechaInicio: resumen.fechaInicioRango,
            fechaFin: resumen.fechaFinRango,
          } as unknown as Json,
        }
      : {}),
    notaAlcance: 'Base de parámetros para preparación de nómina. El cálculo ocurre en el paso Cálculo.',
  };
}

/** Overlay al elegir «Mantener» con diferencias: no re-congela filas, solo registra la decisión en BD. */
export function buildMetadataMantenerBaseConDiferencias(
  resumen: NominaParametrosResumen,
  metadataExistente: Record<string, unknown> | null | undefined,
  usuario: { id: string | null; nombre: string | null },
  comparacion: { hashBase: string | null; hashActual: string | null } | null,
): Record<string, Json> {
  const previo = metadataExistente && metadataExistente['tipoSnapshot'] === TIPO_SNAPSHOT_PARAMETROS_BASE
    ? metadataExistente
    : buildMetadataPersistenciaParametrosBase(resumen);
  const resumenMeta = {
    ...buildResumenParametrosBaseMetadata(resumen),
    origenAlGuardar: 'existenteMantenidaConDiferencias' as const,
    ...(usuario.nombre || usuario.id
      ? { usuarioResponsable: { id: usuario.id, nombre: usuario.nombre ?? 'Usuario no disponible' } }
      : {}),
  };
  return {
    ...previo,
    tipoSnapshot: TIPO_SNAPSHOT_PARAMETROS_BASE,
    origenAlGuardar: 'existenteMantenidaConDiferencias',
    fechaDecisionMantener: new Date().toISOString(),
    resumenParametrosBase: resumenMeta as unknown as Json,
    ...(comparacion?.hashBase != null ? { hashParametrosBaseAlMantener: comparacion.hashBase } : {}),
    ...(comparacion?.hashActual != null ? { hashParametrosActualAlMantener: comparacion.hashActual } : {}),
    notaAlcance:
      'Base de parámetros mantenida pese a diferencias con parámetros vigentes. El cálculo ocurre en el paso Cálculo.',
  };
}

export function mapParametroRowToSnapshot(row: {
  grupo: string;
  clave: string;
  valor: string | null;
  valor_numerico: number | null;
  vigencia: string | null;
  origen: string;
}): NominaCalculoParametroSnapshot {
  return {
    grupo: row.grupo,
    clave: row.clave,
    valor: row.valor,
    valorNumerico: row.valor_numerico,
    vigencia: row.vigencia,
    origen: row.origen,
  };
}

export function buildDetalleParametrosBaseCongelados(
  parametros: readonly NominaCalculoParametroSnapshot[],
): ParametroBaseCongeladoDetalle[] {
  return parametros.map((parametro) => ({
    grupo: parametro.grupo,
    clave: parametro.clave,
    valor: parametro.valorNumerico != null
      ? String(parametro.valorNumerico)
      : parametro.valor ?? 'Sin valor',
    vigencia: parametro.vigencia ?? null,
    origen: parametro.origen || 'No informado',
  }));
}

export function copyOrigenBaseAlAvanzar(
  origen: OrigenBaseParametrosAlAvanzar,
): string {
  switch (origen) {
    case 'recienGuardada':
      return 'Base de parámetros recién guardada';
    case 'existenteSinDiferencias':
      return 'Base existente sin diferencias';
    case 'existenteMantenidaConDiferencias':
      return 'Base mantenida pese a diferencias';
    case 'actualizadaExplicitamente':
      return 'Base actualizada por decisión explícita';
  }
}

export function leerMetadataParametrosBase(
  metadata: Record<string, unknown> | null | undefined,
): {
  origenAlGuardar?: OrigenBaseParametrosAlAvanzar;
  resumen?: ResumenParametrosBaseMetadata;
} | null {
  if (!metadata || metadata['tipoSnapshot'] !== TIPO_SNAPSHOT_PARAMETROS_BASE) {
    return null;
  }
  const origenRaw = metadata['origenAlGuardar'];
  const resumenRaw = metadata['resumenParametrosBase'];
  const usuarioResponsable = leerUsuarioResponsableMetadata(metadata);
  return {
    origenAlGuardar: esOrigenBaseValido(origenRaw) ? origenRaw : undefined,
    resumen: esResumenParametrosBaseValido(resumenRaw)
      ? { ...resumenRaw, ...(usuarioResponsable ? { usuarioResponsable } : {}) }
      : undefined,
  };
}

export function resolverOrigenBaseDesdeSnapshot(
  snapshot: NominaCalculoPeriodoSnapshot,
): OrigenBaseParametrosAlAvanzar {
  const meta = leerMetadataParametrosBase(snapshot.metadataOperativa);
  return meta?.origenAlGuardar ?? 'existenteSinDiferencias';
}

function buildTrazabilidadParametrosBase(
  resumen: NominaParametrosResumen,
  rango?: { fechaInicio?: string | null; fechaFin?: string | null },
): NominaCalculoTrazabilidadSnapshot[] {
  const vigenciaInicio = rango?.fechaInicio
    ?? resumen.fechaInicioRango
    ?? (resumen.periodo.length === 7 ? `${resumen.periodo}-01` : resumen.periodo);
  const vigenciaFin = rango?.fechaFin ?? resumen.fechaFinRango ?? null;
  return [
    {
      codigo: CODIGO_TRAZA_PARAMETROS_BASE,
      origen: 'parametros_base',
      tablaFuente: 'parametros_generales',
      campoFuente: 'snapshot',
      vigenciaInicio,
      vigenciaFin,
      valorEntrada: {
        tipoSnapshot: TIPO_SNAPSHOT_PARAMETROS_BASE,
        seccionesListas: resumen.seccionesListas,
        seccionesTotales: resumen.seccionesTotales,
        ...(resumen.nominaPeriodoId ? { nominaPeriodoId: resumen.nominaPeriodoId } : {}),
      },
      formula: '',
      valorResultado: resumen.controlesVerificados,
      observacion: 'Snapshot base de parámetros para preparación de nómina.',
    },
  ];
}

function esOrigenBaseValido(value: unknown): value is OrigenBaseParametrosAlAvanzar {
  return value === 'recienGuardada'
    || value === 'existenteSinDiferencias'
    || value === 'existenteMantenidaConDiferencias'
    || value === 'actualizadaExplicitamente';
}

function esResumenParametrosBaseValido(value: unknown): value is ResumenParametrosBaseMetadata {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  return typeof record['seccionesListas'] === 'number'
    && typeof record['seccionesTotales'] === 'number';
}

function leerUsuarioResponsableMetadata(metadata: Record<string, unknown>): ResumenParametrosBaseMetadata['usuarioResponsable'] | null {
  const nested = metadata['usuarioResponsable'];
  if (nested && typeof nested === 'object' && !Array.isArray(nested)) {
    const record = nested as Record<string, unknown>;
    const nombre = typeof record['nombre'] === 'string' && record['nombre'].trim() ? record['nombre'].trim() : null;
    if (!nombre) return null;
    return {
      id: typeof record['id'] === 'string' ? record['id'] : null,
      nombre,
    };
  }
  const nombre = typeof metadata['usuarioResponsableNombre'] === 'string' && metadata['usuarioResponsableNombre'].trim()
    ? metadata['usuarioResponsableNombre'].trim()
    : null;
  if (!nombre) return null;
  return {
    id: typeof metadata['usuarioResponsableId'] === 'string' ? metadata['usuarioResponsableId'] : null,
    nombre,
  };
}

function formatearPeriodoEtiqueta(periodo: string): string {
  const match = /^(\d{4})-(\d{2})$/.exec(periodo.trim());
  if (!match) return periodo;
  const meses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
  ];
  const mes = Number(match[2]);
  return `${meses[mes - 1] ?? match[2]} ${match[1]}`;
}
