import type { ProcesoMensualPendienteVm } from './proceso-mensual-estado-operativo.rules';
import type {
  DetalleOperativoTab,
  InformacionPeriodoDestino,
  InformacionPeriodoView,
  NominaVisualFrame,
  ValidacionAccionLocal,
  ValidacionCalculoPreliminarView,
} from '../containers/proceso-mensual-container/models/proceso-mensual-container.vm';

export interface BuildInformacionPeriodoInput {
  errorEjecucion: string | null;
  validacionCalculo: ValidacionCalculoPreliminarView;
  paraContinuar: Array<{ titulo: string; detalle: string }>;
  bloqueosOperativos: ProcesoMensualPendienteVm[];
  advertenciasOperativas: ProcesoMensualPendienteVm[];
  nominaFrame: NominaVisualFrame;
  tienePreNomina: boolean;
  tieneCalculo: boolean;
  tieneResultado: boolean;
}

export interface ResolveDetalleTabInput {
  errorEjecucion: string | null;
  validacionCalculo: ValidacionCalculoPreliminarView;
  bloqueosOperativos: ProcesoMensualPendienteVm[];
  advertenciasOperativas: ProcesoMensualPendienteVm[];
}

export function humanizarErrorEjecucion(texto: string): string {
  const limpio = texto
    .replace(/\bFALTANTE\b/gi, '')
    .replace(/\bis_null\b/gi, '')
    .replace(/sis_fila_mensual/gi, '')
    .replace(/\b(rpc_|tbl_|sis_)[a-z0-9_]+\b/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
  return limpio || 'Revisar antes de continuar.';
}

export function mapDestinoToDetalleTab(destino: InformacionPeriodoDestino): DetalleOperativoTab | null {
  switch (destino) {
    case 'parametros':
      return 'parametros';
    case 'trabajadores':
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
  const pendiente = input.bloqueosOperativos[0] ?? input.advertenciasOperativas[0];
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
  if (accionLocal === 'calcularPreliminar' || accionLocal === 'guardarResultado') return 'resultado';
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

  return null;
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
    case 'movimientos':
      return 'Revisar movimientos';
    case 'asignaciones':
      return 'Revisar recurrentes';
    case 'resultado':
      return 'Revisar resultado';
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
