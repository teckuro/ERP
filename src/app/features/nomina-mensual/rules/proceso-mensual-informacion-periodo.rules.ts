import type { ProcesoMensualPendienteVm } from './proceso-mensual-estado-operativo.rules';
import type {
  DetalleOperativoTab,
  InformacionPeriodoDestino,
  InformacionPeriodoView,
  NominaVisualFrame,
  TrabajadorPendienteInformacionPeriodoView,
  ValidacionAccionLocal,
  ValidacionCalculoPreliminarView,
} from '../containers/proceso-mensual-container/models/proceso-mensual-container.vm';
import type { TrabajadorPendienteRevisionPeriodo } from '../models/proceso-mensual.model';
import { limpiarCopyTecnicoNomina } from './proceso-mensual-copy-limpio.rules';
import type { InformacionPeriodoResumenVerificacion } from '../containers/proceso-mensual-container/models/proceso-mensual-container.vm';
import { buildItemsTrabajadoresPendientesModal } from './proceso-mensual-trabajadores-prevalidacion.rules';

export interface BuildInformacionPeriodoInput {
  errorEjecucion: string | null;
  validacionCalculo: ValidacionCalculoPreliminarView;
  paraContinuar: Array<{ titulo: string; detalle: string }>;
  bloqueosOperativos: ProcesoMensualPendienteVm[];
  advertenciasOperativas: ProcesoMensualPendienteVm[];
  nominaFrame: NominaVisualFrame;
  tienePrevalidacion: boolean;
  puedeGenerarNomina: boolean;
  tienePreNomina: boolean;
  tieneCalculo: boolean;
  tieneResultado: boolean;
  trabajadoresPendientesRevision: TrabajadorPendienteRevisionPeriodo[];
  prevalidacionEstado?: string | null;
}

export interface ResolveDetalleTabInput {
  errorEjecucion: string | null;
  validacionCalculo: ValidacionCalculoPreliminarView;
  bloqueosOperativos: ProcesoMensualPendienteVm[];
  advertenciasOperativas: ProcesoMensualPendienteVm[];
  /** Parámetros en estado listo/revisados: no priorizar tab parámetros por pendientes leves. */
  parametrosListos?: boolean;
}

function primerPendienteRevision(input: ResolveDetalleTabInput): ProcesoMensualPendienteVm | undefined {
  for (const pendiente of [...input.bloqueosOperativos, ...input.advertenciasOperativas]) {
    if (input.parametrosListos && resolveDetalleTabFromPendiente(pendiente) === 'parametros') {
      continue;
    }
    return pendiente;
  }
  return undefined;
}

export function humanizarErrorEjecucion(texto: string): string {
  const limpio = limpiarCopyTecnicoNomina(texto);
  return limpio || 'Revisar antes de continuar.';
}

export function mapDestinoToDetalleTab(destino: InformacionPeriodoDestino): DetalleOperativoTab | null {
  switch (destino) {
    case 'parametros':
      return 'parametros';
    case 'trabajadores':
    case 'trabajadores_fichas':
      return 'trabajadores';
    case 'movimientos':
    case 'asignaciones':
      return 'movimientos_recurrentes';
    case 'resultado':
      return 'resultado';
    case 'reintentar':
    case 'cerrar':
      return null;
    default:
      return null;
  }
}

export function resolveDetalleTabForRevision(input: ResolveDetalleTabInput): DetalleOperativoTab {
  const pendiente = primerPendienteRevision(input);
  if (pendiente) {
    return resolveDetalleTabFromPendiente(pendiente);
  }

  const bloqueoValidacion = input.validacionCalculo.bloqueos[0];
  if (bloqueoValidacion) {
    return resolveDetalleTabFromCodigo(bloqueoValidacion.codigo, bloqueoValidacion.accionLocal);
  }

  if (input.errorEjecucion) {
    return 'trabajadores';
  }

  return 'trabajadores';
}

export function resolveDetalleTabFromPendiente(pendiente: ProcesoMensualPendienteVm): DetalleOperativoTab {
  return resolveDetalleTabFromCodigo(pendiente.codigo, pendiente.accionLocal);
}

function resolveDetalleTabFromCodigo(codigo: string, accionLocal?: ValidacionAccionLocal): DetalleOperativoTab {
  const normalizado = codigo.toUpperCase();
  if (normalizado.includes('PARAM')) return 'parametros';
  if (normalizado.includes('TRABAJ')) return 'trabajadores';
  if (normalizado.includes('MOVIMIENTO') || normalizado.includes('RECURREN') || normalizado.includes('ENTRADA')) {
    return 'movimientos_recurrentes';
  }
  if (normalizado.includes('RESULT') || normalizado.includes('CALCUL') || normalizado.includes('GUARD')) {
    return 'resultado';
  }
  if (accionLocal === 'revisarBloqueos') return 'trabajadores';
  if (accionLocal === 'calcularPreliminar' || accionLocal === 'guardarResultado' || accionLocal === 'confirmarNomina') return 'resultado';
  return 'parametros';
}

export function buildInformacionPeriodoView(input: BuildInformacionPeriodoInput): InformacionPeriodoView | null {
  const {
    errorEjecucion,
    validacionCalculo,
    paraContinuar,
    bloqueosOperativos,
    advertenciasOperativas,
    nominaFrame,
    tienePrevalidacion,
    puedeGenerarNomina,
    tienePreNomina,
    tieneCalculo,
    tieneResultado,
  } = input;

  if (errorEjecucion) {
    const reintentar = validacionCalculo.siguienteAccion.accionLocal ?? 'validarPeriodo';
    return {
      tone: 'danger',
      titulo: 'No fue posible completar la operación',
      bajada: humanizarErrorEjecucion(errorEjecucion),
      puntos: paraContinuar.length
        ? paraContinuar.map((item) => `${item.titulo}: ${item.detalle}`)
        : ['Revisa el período y vuelve a intentar la acción recomendada.'],
      accionPrincipal: {
        label: validacionCalculo.siguienteAccion.label || 'Reintentar',
        destino: 'reintentar',
      },
      accionSecundaria: { label: 'Cerrar', destino: 'cerrar' },
      reintentarAccion: reintentar,
    };
  }

  const hayActividad = tienePreNomina || tieneCalculo || tieneResultado;
  const bloqueos = [
    ...validacionCalculo.bloqueos,
    ...bloqueosOperativos.map((item) => ({
      codigo: item.codigo,
      titulo: item.titulo,
      descripcion: item.descripcion,
      severidad: 'bloqueo' as const,
      accionLabel: item.accionLabel,
      accionLocal: item.accionLocal,
    })),
  ];

  if (hayActividad && bloqueos.length > 0) {
    const tabDestino = resolveDetalleTabFromCodigo(
      bloqueos[0].codigo,
      bloqueos[0].accionLocal as ValidacionAccionLocal | undefined,
    );
    const destinoRevision = mapDetalleTabToDestino(tabDestino);
    return {
      tone: 'warning',
      titulo: nominaFrame === 'con_pendientes' ? 'Nómina generada con pendientes' : 'Revisión requerida antes de continuar',
      bajada: 'Hay puntos del período que debes revisar antes de confirmar o guardar.',
      secciones: [
        {
          titulo: 'Qué revisar',
          items: bloqueos.slice(0, 5).map((item) => `${item.titulo}: ${humanizarErrorEjecucion(item.descripcion)}`),
        },
        ...(paraContinuar.length
          ? [{ titulo: 'Para continuar', items: paraContinuar.map((item) => item.titulo) }]
          : []),
      ],
      accionPrincipal: {
        label: labelDestinoRevision(destinoRevision),
        destino: destinoRevision,
      },
      accionSecundaria: { label: 'Cerrar por ahora', destino: 'cerrar' },
    };
  }

  if (hayActividad && advertenciasOperativas.length > 0 && nominaFrame === 'con_pendientes') {
    const destino = mapDetalleTabToDestino(resolveDetalleTabFromPendiente(advertenciasOperativas[0]));
    return {
      tone: 'info',
      titulo: 'Nómina generada con advertencias',
      bajada: 'Puedes continuar revisando trabajadores y movimientos del período.',
      secciones: [
        {
          titulo: 'Advertencias visibles',
          items: advertenciasOperativas.slice(0, 4).map((item) => item.titulo),
        },
      ],
      accionPrincipal: {
        label: labelDestinoRevision(destino),
        destino,
      },
      accionSecundaria: { label: 'Cerrar', destino: 'cerrar' },
    };
  }

  const verificacion = buildVerificacionPeriodoInformacionView({
    tienePrevalidacion,
    puedeGenerarNomina,
    hayActividad,
    validacionCalculo,
    trabajadoresPendientesRevision: input.trabajadoresPendientesRevision,
    prevalidacionEstado: input.prevalidacionEstado,
  });
  if (verificacion) {
    return verificacion;
  }

  return null;
}

interface BuildVerificacionPeriodoInput {
  tienePrevalidacion: boolean;
  puedeGenerarNomina: boolean;
  hayActividad: boolean;
  validacionCalculo: ValidacionCalculoPreliminarView;
  trabajadoresPendientesRevision: TrabajadorPendienteRevisionPeriodo[];
  prevalidacionEstado?: string | null;
}

export function mapTrabajadoresPendientesInformacionView(
  trabajadores: readonly TrabajadorPendienteRevisionPeriodo[],
): TrabajadorPendienteInformacionPeriodoView[] {
  return trabajadores.map((t) => ({
    idPersona: t.idPersona,
    nombre: t.nombre,
    rut: t.rut,
    motivo: t.motivo,
    detalleCorreccion: t.detalleCorreccion,
  }));
}

function buildResumenVerificacionPeriodo(
  criticos: number,
  advertencias: number,
  trabajadoresPendientes: number,
): InformacionPeriodoResumenVerificacion {
  return {
    criticos,
    advertencias,
    trabajadoresPendientes,
  };
}

function seccionesSinListaNominalTrabajadores(
  secciones: Array<{ titulo: string; items: string[] }>,
): Array<{ titulo: string; items: string[] }> {
  return secciones.filter((s) => !s.titulo.startsWith('Trabajadores a corregir'));
}

function bajadaConConteoTrabajadoresPendientes(cantidad: number, parametrosListos = true): string {
  const conteo =
    cantidad === 1
      ? 'Hay 1 trabajador con ficha pendiente.'
      : `Hay ${cantidad} trabajadores con ficha pendiente.`;
  if (parametrosListos) {
    return `${conteo} Parámetros del período están listos para generar.`;
  }
  return conteo;
}

function buildVerificacionPeriodoInformacionView(
  input: BuildVerificacionPeriodoInput,
): InformacionPeriodoView | null {
  if (!input.tienePrevalidacion || input.hayActividad) {
    return null;
  }

  const bloqueos = input.validacionCalculo.bloqueos.filter((item) => item.codigo !== 'BLOQ-005');
  const advertencias = input.validacionCalculo.advertencias;
  const pendientes = input.trabajadoresPendientesRevision;
  const trabajadoresVm =
    pendientes.length > 0 ? mapTrabajadoresPendientesInformacionView(pendientes) : undefined;
  const resumen = buildResumenVerificacionPeriodo(
    bloqueos.length,
    advertencias.length,
    pendientes.length,
  );

  if (bloqueos.length === 0 && advertencias.length === 0) {
    if (pendientes.length > 0) {
      const puedeGenerarConAdvertencias =
        input.puedeGenerarNomina
        && (input.prevalidacionEstado === 'CON_ADVERTENCIAS'
          || input.validacionCalculo.estado === 'advertencias');
      return {
        tone: 'info',
        titulo: 'Revisión del período antes de generar',
        bajada: bajadaConConteoTrabajadoresPendientes(pendientes.length),
        resumenVerificacion: resumen,
        trabajadoresPendientes: trabajadoresVm,
        accionPrincipal: { label: 'Revisar fichas', destino: 'trabajadores_fichas' },
        accionSecundaria: puedeGenerarConAdvertencias
          ? { label: 'Generar nómina de todos modos', destino: 'generar_nomina' }
          : { label: 'Cerrar por ahora', destino: 'cerrar' },
      };
    }
    return {
      tone: 'success',
      titulo: 'Período listo para generar',
      bajada: 'No hay bloqueos críticos. Puedes generar la nómina mensual del período.',
      resumenVerificacion: resumen,
      accionPrincipal: input.puedeGenerarNomina
        ? { label: 'Generar nómina', destino: 'generar_nomina' }
        : undefined,
      accionSecundaria: { label: 'Cerrar', destino: 'cerrar' },
    };
  }

  const secciones: Array<{ titulo: string; items: string[] }> = [];
  if (bloqueos.length > 0) {
    secciones.push({
      titulo: 'Críticos',
      items: bloqueos.slice(0, 6).map((item) => `${item.titulo}: ${humanizarErrorEjecucion(item.descripcion)}`),
    });
  }
  if (advertencias.length > 0) {
    secciones.push({
      titulo: 'Advertencias',
      items: advertencias.slice(0, 6).map((item) => `${item.titulo}: ${humanizarErrorEjecucion(item.descripcion)}`),
    });
  }

  if (bloqueos.length > 0) {
    const tabDestino = resolveDetalleTabFromCodigo(
      bloqueos[0].codigo,
      bloqueos[0].accionLocal,
    );
    const destinoRevision = mapDetalleTabToDestino(tabDestino);
    const bajadaCriticos = 'Corrige los puntos críticos antes de generar la nómina mensual.';
    return {
      tone: 'warning',
      titulo: 'Revisión del período antes de generar',
      bajada:
        pendientes.length > 0
          ? `${bajadaConConteoTrabajadoresPendientes(pendientes.length, false)} ${bajadaCriticos}`
          : bajadaCriticos,
      secciones: seccionesSinListaNominalTrabajadores(secciones),
      resumenVerificacion: resumen,
      trabajadoresPendientes: trabajadoresVm,
      accionPrincipal: {
        label: 'Corregir pendientes',
        destino: destinoRevision,
      },
      accionSecundaria: pendientes.length > 0
        ? { label: 'Revisar fichas', destino: 'trabajadores_fichas' }
        : { label: 'Cerrar por ahora', destino: 'cerrar' },
    };
  }

  if (pendientes.length > 0) {
    const puedeGenerarConAdvertencias =
      input.puedeGenerarNomina
      && (input.prevalidacionEstado === 'CON_ADVERTENCIAS'
        || input.validacionCalculo.estado === 'advertencias');
    return {
      tone: 'info',
      titulo: 'Revisión del período antes de generar',
      bajada: bajadaConConteoTrabajadoresPendientes(pendientes.length),
      secciones: seccionesSinListaNominalTrabajadores(secciones),
      resumenVerificacion: resumen,
      trabajadoresPendientes: trabajadoresVm,
      accionPrincipal: { label: 'Revisar fichas', destino: 'trabajadores_fichas' },
      accionSecundaria: puedeGenerarConAdvertencias
        ? { label: 'Generar nómina de todos modos', destino: 'generar_nomina' }
        : { label: 'Cerrar por ahora', destino: 'cerrar' },
    };
  }

  const destinoAdvertencia = mapDetalleTabToDestino(
    resolveDetalleTabFromCodigo(advertencias[0].codigo, advertencias[0].accionLocal),
  );
  return {
    tone: 'info',
    titulo: 'Revisión del período antes de generar',
    bajada: input.puedeGenerarNomina
      ? 'Hay advertencias que puedes revisar o continuar para generar la nómina.'
      : 'Revisa las advertencias del período antes de continuar.',
    secciones,
    accionPrincipal: input.puedeGenerarNomina
      ? { label: 'Generar nómina', destino: 'generar_nomina' }
      : {
          label: labelDestinoRevision(destinoAdvertencia),
          destino: destinoAdvertencia,
        },
    accionSecundaria: { label: 'Cerrar por ahora', destino: 'cerrar' },
  };
}

function mergeSeccionTrabajadoresPendientes(
  secciones: Array<{ titulo: string; items: string[] }>,
  trabajadores: readonly TrabajadorPendienteRevisionPeriodo[],
): Array<{ titulo: string; items: string[] }> {
  const otras = secciones.filter((s) => s.titulo !== 'Trabajadores a corregir');
  const seccionTrabajadores = {
    titulo: `Trabajadores a corregir (${trabajadores.length})`,
    items: buildItemsTrabajadoresPendientesModal(trabajadores),
  };
  return [seccionTrabajadores, ...otras];
}

function mapDetalleTabToDestino(tab: DetalleOperativoTab): InformacionPeriodoDestino {
  switch (tab) {
    case 'parametros':
      return 'parametros';
    case 'trabajadores':
      return 'trabajadores';
    case 'movimientos_recurrentes':
      return 'movimientos';
    case 'resultado':
    case 'resumen':
      return 'resultado';
    default:
      return 'trabajadores';
  }
}

function labelDestinoRevision(destino: InformacionPeriodoDestino): string {
  switch (destino) {
    case 'parametros':
      return 'Revisar parámetros';
    case 'trabajadores':
      return 'Revisar trabajadores';
    case 'trabajadores_fichas':
      return 'Revisar fichas';
    case 'movimientos':
      return 'Revisar movimientos';
    case 'asignaciones':
      return 'Revisar recurrentes';
    case 'resultado':
      return 'Revisar resultado';
    case 'generar_nomina':
      return 'Generar nómina';
    case 'reintentar':
      return 'Reintentar';
    case 'cerrar':
      return 'Cerrar';
    default:
      return 'Revisar detalle';
  }
}

export function mapInformacionToneToMessageBoxVariant(
  tone: InformacionPeriodoView['tone'],
): 'info' | 'warning' | 'danger' | 'blocked' | 'success' {
  if (tone === 'danger') return 'blocked';
  return tone;
}
