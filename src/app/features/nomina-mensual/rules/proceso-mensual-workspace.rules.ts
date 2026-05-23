import type {
  ProcesoMensualAccionPrincipalVm,
  ProcesoMensualEstadoClave,
  ProcesoMensualEstadoOperativoVm,
} from './proceso-mensual-estado-operativo.rules';
import type {
  AlertasPeriodoResumenVm,
  BitacoraEtapaVm,
  BitacoraRailEtapaVm,
  BitacoraSubpasoMarca,
  BitacoraSubpasoVm,
  NominaResumenSuperiorVm,
  NominaVisualFrame,
  NominaVisualFrameView,
  NominaDetalleMensualVista,
  NominaWorkspaceTab,
  NominaWorkspaceTabVisible,
} from '../containers/proceso-mensual-container/models/proceso-mensual-container.vm';

export interface NominaVisualFrameInput {
  validando: boolean;
  generandoPreNomina: boolean;
  calculandoPreliminar: boolean;
  rehidratandoPeriodo: boolean;
  estadoClave: ProcesoMensualEstadoClave;
}

function asArray<T>(value: readonly T[] | null | undefined): T[] {
  return Array.isArray(value) ? [...value] : [];
}

export function resolveNominaVisualFrame(input: NominaVisualFrameInput): NominaVisualFrame {
  if (input.validando || input.generandoPreNomina || input.calculandoPreliminar || input.rehidratandoPeriodo) {
    return 'generando';
  }

  const estado = input.estadoClave;
  if (estado === 'liquidaciones_disponibles') return 'liquidaciones_generadas';
  if (estado === 'nomina_cerrada') return 'confirmada';
  if (
    estado === 'aprobado_operativamente' ||
    estado === 'resultado_guardado' ||
    estado === 'resultado_listo_para_guardar'
  ) {
    return 'lista_para_confirmar';
  }
  if (estado === 'periodo_con_pendientes' || estado === 'resultado_con_bloqueos') return 'con_pendientes';
  if (estado === 'base_lista' || estado === 'resultado_preliminar_revisable') return 'en_revision';
  return 'sin_generar';
}

export function suggestNominaWorkspaceTab(frame: NominaVisualFrame): NominaWorkspaceTab {
  if (frame === 'con_pendientes') return 'trabajadores';
  if (frame === 'liquidaciones_generadas') return 'liquidaciones';
  if (frame === 'confirmada') return 'historial';
  if (frame === 'en_revision' || frame === 'lista_para_confirmar') return 'trabajadores';
  return 'parametros';
}

export interface NominaWorkspaceNavigationSugerida {
  tabVisible: NominaWorkspaceTabVisible;
  detalleVista: NominaDetalleMensualVista;
  legacyTab: NominaWorkspaceTab;
}

export function suggestNominaWorkspaceNavigation(frame: NominaVisualFrame): NominaWorkspaceNavigationSugerida {
  if (frame === 'con_pendientes') {
    return { tabVisible: 'detalle_mensual', detalleVista: 'pendientes', legacyTab: 'trabajadores' };
  }
  if (frame === 'liquidaciones_generadas') {
    return { tabVisible: 'detalle_mensual', detalleVista: 'liquidaciones', legacyTab: 'liquidaciones' };
  }
  if (frame === 'confirmada') {
    return { tabVisible: 'historial', detalleVista: 'todos', legacyTab: 'historial' };
  }
  if (frame === 'en_revision' || frame === 'lista_para_confirmar') {
    return { tabVisible: 'detalle_mensual', detalleVista: 'trabajadores', legacyTab: 'trabajadores' };
  }
  return { tabVisible: 'detalle_mensual', detalleVista: 'todos', legacyTab: 'parametros' };
}

export interface NominaResumenSuperiorInput {
  trabajadoresAptos: number | null;
  parametrosListos: boolean | null;
  movimientosAprobados: number;
  movimientosPendientes: number;
  asignacionesAplicables: number | null;
  advertenciasCount: number;
  bloqueosCount: number;
  snapshotTotalAdvertencias: number;
  snapshotTotalBloqueados: number;
}

export function buildNominaResumenSuperior(input: NominaResumenSuperiorInput): NominaResumenSuperiorVm {
  return {
    trabajadores:
      input.trabajadoresAptos == null
        ? 'Sin evaluar'
        : `${input.trabajadoresAptos} listo${input.trabajadoresAptos === 1 ? '' : 's'}`,
    parametros:
      input.parametrosListos == null ? 'Sin evaluar' : input.parametrosListos ? 'Revisados' : 'Por revisar',
    movimientos: `${input.movimientosAprobados} aprobados · ${input.movimientosPendientes} pendientes`,
    recurrentes:
      input.asignacionesAplicables == null
        ? 'Sin evaluar'
        : `${input.asignacionesAplicables} vigente${input.asignacionesAplicables === 1 ? '' : 's'}`,
    cambios: input.advertenciasCount + input.snapshotTotalAdvertencias,
    bloqueos: input.bloqueosCount + input.snapshotTotalBloqueados,
  };
}

export interface BuildNominaFrameViewInput {
  frame: NominaVisualFrame;
  estadoClave: ProcesoMensualEstadoClave;
  accion: ProcesoMensualAccionPrincipalVm;
  periodoEtiqueta: string;
  bloqueosCount: number;
  advertenciasCount: number;
  trabajadoresCount: number;
  resumenRevisionTrabajadores: string;
  accionPeriodoEnCurso: boolean;
}

export interface ResumenRevisionTrabajadoresInput {
  listos: number;
  porRevisar: number;
  bloqueados: number;
  tieneDatos: boolean;
}

export function buildResumenRevisionTrabajadores(input: ResumenRevisionTrabajadoresInput): string {
  if (!input.tieneDatos) return 'sin observaciones disponibles';
  return `${input.listos} listos, ${input.porRevisar} por revisar y ${input.bloqueados} bloqueados`;
}

export type NominaGuiaPanelVariant = 'confirmar' | 'en_curso' | 'antes_generar';

export interface NominaGuiaPanelCopy {
  variant: NominaGuiaPanelVariant;
  titulo: string;
  parrafo?: string;
  items: string[];
  asideTitulo?: string;
  asideTexto?: string;
}

export interface NominaDetallePanelCopy {
  titulo: string;
  oficial: boolean;
  campo1: string;
  campo2: string;
  campo3: string;
  campo4: string;
  estadoOficialLabel?: string;
}

export function buildNominaGuiaPanelCopy(frame: NominaVisualFrame, periodoEtiqueta: string): NominaGuiaPanelCopy {
  if (frame === 'lista_para_confirmar') {
    return {
      variant: 'confirmar',
      titulo: 'Resumen',
      items: [],
      asideTitulo: `Confirmar nómina mensual de ${periodoEtiqueta}`,
      asideTexto: 'Esta acción dejará una versión oficial para generar liquidaciones.',
    };
  }
  if (frame === 'generando') {
    return {
      variant: 'en_curso',
      titulo: 'Proceso en curso',
      items: [
        'Revisión del período activo.',
        'Lectura de trabajadores habilitados.',
        'Cruce de movimientos y recurrentes.',
        'Preparación del borrador por trabajador.',
      ],
    };
  }
  return {
    variant: 'antes_generar',
    titulo: 'Antes de generar',
    parrafo:
      'Primero verifica el período y luego genera la nómina mensual. Después podrás revisar trabajador por trabajador antes de confirmar.',
    items: [
      'Trabajadores habilitados para el período.',
      'Parámetros mensuales.',
      'Movimientos aprobados y pendientes.',
      'Asignaciones recurrentes vigentes.',
    ],
  };
}

export function buildNominaDetallePanelCopy(frame: NominaVisualFrame): NominaDetallePanelCopy {
  if (frame === 'confirmada' || frame === 'liquidaciones_generadas') {
    return {
      titulo: 'Versión oficial del período',
      oficial: true,
      campo1: 'Versión confirmada',
      campo2: 'Trabajadores',
      campo3: 'Bloqueos críticos',
      campo4: 'Estado',
      estadoOficialLabel: 'Base oficial para liquidaciones',
    };
  }
  return {
    titulo: 'Detalle del período',
    oficial: false,
    campo1: 'Trabajadores considerados',
    campo2: 'Movimientos incluidos',
    campo3: 'Recurrentes considerados',
    campo4: 'Total líquido estimado',
  };
}

export function buildNominaFrameView(input: BuildNominaFrameViewInput): NominaVisualFrameView {
  const {
    frame,
    estadoClave,
    accion,
    periodoEtiqueta,
    bloqueosCount,
    advertenciasCount,
    trabajadoresCount,
    resumenRevisionTrabajadores,
  } = input;

  const base = (
    data: Omit<NominaVisualFrameView, 'frame' | 'ctaLabel' | 'ctaDisabled' | 'ctaTipo' | 'ctaRuta' | 'ctaAccion'>,
  ): NominaVisualFrameView => ({
    frame,
    ...data,
    ctaLabel: accion.label,
    ctaDisabled: !!accion.disabled || input.accionPeriodoEnCurso,
    ctaTipo: accion.tipo,
    ctaRuta: accion.ruta,
    ctaAccion: accion.accionLocal,
  });

  switch (frame) {
    case 'generando':
      return base({
        chip: 'Generando',
        titulo: 'Estamos preparando la nómina mensual.',
        texto:
          'Estamos revisando trabajadores, parámetros, movimientos y recurrentes para armar el borrador del período.',
        info: 'Este paso genera una versión de trabajo; todavía no es la base oficial.',
      });
    case 'en_revision': {
      const esBorrador = estadoClave === 'base_lista';
      return base({
        chip: esBorrador ? 'Borrador generado' : 'En revisión',
        titulo: esBorrador ? 'Borrador de nómina mensual generado.' : 'Nómina en revisión.',
        texto: esBorrador
          ? 'Revisa trabajadores listos para nomina, movimientos y recurrentes antes de continuar.'
          : 'Revisa trabajadores con cambios, advertencias o bloqueos antes de confirmar la nómina mensual.',
        info: `Hay ${trabajadoresCount} trabajadores en revision: ${resumenRevisionTrabajadores}.`,
      });
    }
    case 'con_pendientes':
      return base({
        chip: 'Con pendientes',
        titulo: 'Hay trabajadores con datos obligatorios pendientes.',
        texto: 'Resuelve los bloqueos críticos antes de confirmar la nómina mensual del período.',
        info:
          bloqueosCount > 0
            ? `${bloqueosCount} bloqueo${bloqueosCount === 1 ? '' : 's'} crítico${bloqueosCount === 1 ? '' : 's'} requiere${bloqueosCount === 1 ? '' : 'n'} revisión.`
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
        info: 'Si cambian datos posteriores, se requerirá una nueva versión o una revisión explícita.',
      });
    case 'liquidaciones_generadas':
      return base({
        chip: 'Liquidaciones disponibles',
        titulo: 'Liquidaciones generadas desde la nómina confirmada.',
        texto: 'Las liquidaciones del período ya fueron emitidas usando la versión oficial de la nómina mensual.',
        info: `La trazabilidad queda asociada a la versión confirmada de ${periodoEtiqueta}.`,
      });
    case 'sin_generar':
    default:
      return base({
        chip: 'Sin generar',
        titulo: `Todavía no existe una nómina mensual para ${periodoEtiqueta}.`,
        texto: 'Verifica el período y genera la nómina para revisar trabajadores, parámetros, movimientos y recurrentes antes de confirmar.',
        info:
          advertenciasCount > 0
            ? `El período tiene ${advertenciasCount} advertencia${advertenciasCount === 1 ? '' : 's'} revisable${advertenciasCount === 1 ? '' : 's'} antes de generar.`
            : 'La nómina confirmada será la base oficial para generar liquidaciones.',
      });
  }
}

export function buildAlertasPeriodoResumen(input: {
  validando: boolean;
  tieneResultado: boolean;
  bloqueosCount: number;
  advertenciasCount: number;
}): AlertasPeriodoResumenVm {
  if (input.validando) {
    return {
      modo: 'evaluando',
      mensaje: 'Preparando revisión del período...',
      criticas: 0,
      advertencias: 0,
      mostrarDetalle: false,
    };
  }

  if (!input.tieneResultado) {
    return {
      modo: 'sin-evaluar',
      mensaje: 'Verifica el período o genera la nómina para ver trabajadores que requieren revisión.',
      criticas: 0,
      advertencias: 0,
      mostrarDetalle: false,
    };
  }

  if (!input.bloqueosCount && !input.advertenciasCount) {
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
    criticas: input.bloqueosCount,
    advertencias: input.advertenciasCount,
    mostrarDetalle: true,
  };
}

export interface BitacoraEtapasInput {
  estado: ProcesoMensualEstadoOperativoVm;
  tieneResultado: boolean;
  tienePreNomina: boolean;
  tieneCalculo: boolean;
  tieneSnapshot: boolean;
  tieneAprobacion: boolean;
  nominaCerrada: boolean;
}

export function buildBitacoraEtapas(input: BitacoraEtapasInput): BitacoraEtapaVm[] {
  const estado = input.estado;
  const etapaActiva = estado.etapaActiva;
  const validado = input.tieneResultado;
  const baseLista = input.tienePreNomina;
  const calculoListo = input.tieneCalculo;
  const guardado = input.tieneSnapshot;
  const aprobado = input.tieneAprobacion;
  const cerrada = input.nominaCerrada;
  const advertencias = asArray(estado.advertencias).length;
  const bloqueos = asArray(estado.bloqueos).length;

  const marca = (hecho: boolean, actual: boolean): BitacoraSubpasoMarca =>
    hecho ? 'hecho' : actual ? 'actual' : 'pendiente';

  const etapaCalculoActiva = etapaActiva === 'calculo' || etapaActiva === 'guardar';
  const calculoBloqueada = estado.estadoClave === 'resultado_con_bloqueos';

  const resumenValidar = (): string => {
    if (validado && etapaActiva !== 'validar') return 'Período verificado';
    if (etapaActiva === 'validar') return validado ? 'Período verificado' : 'Verificación en curso';
    return 'Sin verificar';
  };

  const resumenBase = (): string => {
    if (baseLista) return 'Borrador generado';
    if (etapaActiva === 'base') return 'Generar nómina mensual';
    return validado ? 'Pendiente de generar' : 'Requiere verificación previa';
  };

  const resumenCalculo = (): string => {
    if (calculoBloqueada) return bloqueos === 1 ? '1 bloqueo por resolver' : `${bloqueos} bloqueos por resolver`;
    if (guardado && !etapaCalculoActiva) return 'Lista para confirmar';
    if (advertencias && (calculoListo || etapaCalculoActiva)) {
      return advertencias === 1 ? '1 advertencia revisable' : `${advertencias} advertencias revisables`;
    }
    if (calculoListo) return 'Trabajadores en revisión';
    if (etapaCalculoActiva) return 'Revisión de trabajadores en curso';
    return baseLista ? 'Pendiente de revisión' : 'Requiere nómina generada';
  };

  const resumenAprobar = (): string => {
    if (cerrada) return 'Nómina confirmada';
    if (aprobado) return 'Lista para confirmar';
    if (guardado) return 'Pendiente de confirmación';
    if (etapaActiva === 'aprobar_cerrar') return 'Confirmación en curso';
    return 'Pendiente de revisión completa';
  };

  const resumenLiquidaciones = (): string => {
    if (estado.estadoClave === 'liquidaciones_disponibles') return 'Liquidaciones generadas';
    if (cerrada) return 'Listas para generar';
    if (etapaActiva === 'liquidaciones') return 'Generación disponible';
    return 'Disponible al confirmar nómina';
  };

  const subpasosValidar = (): BitacoraSubpasoVm[] => {
    if (etapaActiva !== 'validar') return [];
    return [
      { marca: marca(validado, !validado), etiqueta: 'Verificar período' },
      { marca: marca(false, validado && !baseLista), etiqueta: 'Generar nómina' },
    ];
  };

  const subpasosBase = (): BitacoraSubpasoVm[] => {
    if (etapaActiva !== 'base') return [];
    return [
      { marca: marca(baseLista, !baseLista), etiqueta: 'Generar borrador' },
      { marca: marca(false, baseLista), etiqueta: 'Revisar trabajadores' },
    ];
  };

  const subpasosCalculo = (): BitacoraSubpasoVm[] => {
    if (!etapaCalculoActiva) return [];
    return [
      { marca: marca(calculoListo, !calculoListo), etiqueta: 'Revisar trabajadores' },
      {
        marca: !advertencias ? 'hecho' : calculoListo ? 'actual' : 'pendiente',
        etiqueta: 'Resolver advertencias',
      },
      { marca: marca(guardado, calculoListo && !guardado), etiqueta: 'Confirmar nómina' },
    ];
  };

  const subpasosAprobar = (): BitacoraSubpasoVm[] => {
    if (etapaActiva !== 'aprobar_cerrar') return [];
    return [
      { marca: marca(cerrada, !cerrada), etiqueta: 'Confirmar nómina' },
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
      etiqueta: 'Verificar período',
      resumen: resumenValidar(),
      activa: etapaActiva === 'validar',
      completada: validado && etapaActiva !== 'validar',
      bloqueada: false,
      subpasos: subpasosValidar(),
    },
    {
      clave: 'base',
      etiqueta: 'Generar nómina',
      resumen: resumenBase(),
      activa: etapaActiva === 'base',
      completada: baseLista && etapaActiva !== 'validar' && etapaActiva !== 'base',
      bloqueada: false,
      subpasos: subpasosBase(),
    },
    {
      clave: 'calculo',
      etiqueta: 'Revisar trabajadores',
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
}

export function mapBitacoraRailEtapas(etapas: BitacoraEtapaVm[]): BitacoraRailEtapaVm[] {
  return etapas.map((etapa) => ({
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
  }));
}
