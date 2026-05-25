import type { HaberDescuentoAsignacionPrevalidacionMensualFila } from '../../haberes-descuentos/models/haber-descuento-asignacion.model';
import type { MovimientoVariableEstado, MovimientoVariableListadoFila } from '../../movimientos-variables/models/movimiento-variable.model';
import type {
  ParametroGeneral,
  PeriodoRemuneracionEstadoInfo,
} from '../../parametros-generales/models/parametro-general.model';
import type { ParametrosEstadoVisual } from '../../parametros-generales/rules/parametros-completitud.rules';
import type { EntradaMensualEstado, EntradaMensualPeriodo } from '../entradas/models/entrada-mensual-periodo.model';
import {
  construirResumenEntradas,
  entradaBloqueaProceso,
  entradaRequiereRevision,
  validarPeriodoEntradaMensual,
} from '../entradas/rules/entradas-mensuales-periodo.rules';

import type {
  ProcesoMensualArea,
  ProcesoMensualEstado,
  ProcesoMensualGrupoParametro,
  ProcesoMensualItem,
  ProcesoMensualMensaje,
  ProcesoMensualPrevalidacion,
  ProcesoMensualRecurrentesConteo,
  ProcesoMensualResumen,
  TrabajadorPendienteRevisionPeriodo,
} from '../models/proceso-mensual.model';

type ItemEstado = ProcesoMensualItem['estado'];

function asArray<T>(value: readonly T[] | null | undefined): T[] {
  return Array.isArray(value) ? [...value] : [];
}

export function contarRecurrentesParaPrevalidacionMensual(
  filas: readonly HaberDescuentoAsignacionPrevalidacionMensualFila[],
): Pick<ProcesoMensualRecurrentesConteo, 'aplicables' | 'invalidas' | 'cerradas' | 'fueraDelMes'> {
  let aplicables = 0;
  let invalidas = 0;
  let cerradas = 0;
  let fueraDelMes = 0;
  for (const f of asArray(filas)) {
    const cerrada = f.asignacion.estado === false;
    if (cerrada) {
      cerradas += 1;
      continue;
    }
    if (f.estadoVigencia === 'INVALIDA') {
      invalidas += 1;
      continue;
    }
    if (!f.intersectaPeriodo) {
      fueraDelMes += 1;
      continue;
    }
    aplicables += 1;
  }
  return { aplicables, invalidas, cerradas, fueraDelMes };
}

/** Hechos ya recolectados (I/O fuera de esta funcion). */
export interface ProcesoMensualHechosPrevalidacion {
  periodo: string;
  ultimoPg: ParametroGeneral | null;
  lecturaUltimoPg: 'ok' | 'error';
  errorUltimoPg?: string;
  periodoRem: PeriodoRemuneracionEstadoInfo | null;
  lecturaPeriodoRem: 'ok' | 'error';
  errorPeriodoRem?: string;
  parametrosEstadoVisual?: ParametrosEstadoVisual;
  parametrosEstadoDetalle?: string;
  parametrosOperativos?: boolean;
  parametrosGrupos: ProcesoMensualGrupoParametro[];
  empleadosActivosAptos: number;
  empleadosActivosNoAptos: number;
  trabajadoresPendientesRevision: TrabajadorPendienteRevisionPeriodo[];
  lecturaEmpleados: 'ok' | 'error';
  errorEmpleados?: string;
  totalConceptosMantenimiento: number;
  lecturaConceptos: 'ok' | 'error';
  errorConceptos?: string;
  alertaConceptosMotorFuturo: boolean;
  recurrentesConteo: ProcesoMensualRecurrentesConteo;
  entradasMensuales: EntradaMensualPeriodo[];
  lecturaEntradasMensuales: 'ok' | 'error';
  errorEntradasMensuales?: string;
  /** Alias legacy de transicion derivado de entradasMensuales. */
  movimientos: MovimientoVariableListadoFila[];
  lecturaMovimientos: 'ok' | 'error';
  errorMovimientos?: string;
}

const MSG_PERIODO_INVALIDO = 'El periodo debe tener formato YYYY-MM.';

function conteosPorEstadoMv(
  filas: MovimientoVariableListadoFila[],
): Partial<Record<MovimientoVariableEstado, number>> {
  const o: Partial<Record<MovimientoVariableEstado, number>> = {};
  for (const f of filas) {
    o[f.estado] = (o[f.estado] ?? 0) + 1;
  }
  return o;
}

function conteosPorEstadoEntrada(
  entradas: readonly EntradaMensualPeriodo[],
): Partial<Record<EntradaMensualEstado, number>> {
  const o: Partial<Record<EntradaMensualEstado, number>> = {};
  for (const entrada of entradas) {
    o[entrada.estado] = (o[entrada.estado] ?? 0) + 1;
  }
  return o;
}

function estadoPeriodoRemuneracionOperativo(estado: PeriodoRemuneracionEstadoInfo['estado']): boolean {
  return estado === 'cargado' || estado === 'corregido' || estado === 'cerrado';
}

function pushMsg(
  dest: ProcesoMensualMensaje[],
  codigo: string,
  area: ProcesoMensualArea,
  severidad: ProcesoMensualMensaje['severidad'],
  texto: string,
): void {
  dest.push({ codigo, area, severidad, texto });
}

/** Solo parámetros del período impiden generar la nómina tras verificar. */
const CODIGOS_BLOQUEO_GENERACION_NOMINA = new Set([
  'PERIODO_FORMATO_INVALIDO',
  'PARAMETROS_LECTURA_ERROR',
  'PARAMETROS_SIN_FILA',
  'PARAMETROS_CALENDARIO_LECTURA',
  'PARAMETROS_ESTADO_PERIODO_INOPERATIVO',
  'PARAMETROS_CONFIG_CLIENTE_INCOMPLETA',
  'PARAMETROS_COMPLETITUD_PENDIENTE',
  'PARAMETROS_RECONCILIACION_PENDIENTE',
  'TRABAJADORES_BLOQUEADOS_NOMINA',
  'EMPLEADOS_SIN_ACTIVOS_APTOS',
  'ENTRADAS_BLOQUEANTES',
]);

export function mensajeBloqueaGeneracionNomina(mensaje: ProcesoMensualMensaje): boolean {
  return mensaje.severidad === 'BLOQUEO' && CODIGOS_BLOQUEO_GENERACION_NOMINA.has(mensaje.codigo);
}

function separarBloqueosGeneracionNomina(bloqueos: ProcesoMensualMensaje[]): {
  bloqueosGeneracion: ProcesoMensualMensaje[];
  advertenciasDesdeBloqueo: ProcesoMensualMensaje[];
} {
  const bloqueosGeneracion: ProcesoMensualMensaje[] = [];
  const advertenciasDesdeBloqueo: ProcesoMensualMensaje[] = [];
  for (const bloqueo of bloqueos) {
    if (mensajeBloqueaGeneracionNomina(bloqueo)) {
      bloqueosGeneracion.push(bloqueo);
      continue;
    }
    advertenciasDesdeBloqueo.push({
      ...bloqueo,
      severidad: 'ADVERTENCIA',
    });
  }
  return { bloqueosGeneracion, advertenciasDesdeBloqueo };
}

function mergeEstadoFinal(bloqueos: ProcesoMensualMensaje[], advertencias: ProcesoMensualMensaje[]): ProcesoMensualEstado {
  if (bloqueos.length > 0) {
    return 'BLOQUEADO';
  }
  if (advertencias.some((a) => a.severidad === 'ADVERTENCIA')) {
    return 'CON_ADVERTENCIAS';
  }
  return 'LISTO_PARA_CALCULO';
}

/**
 * Construye el resultado de prevalidacion a partir de hechos ya leidos.
 * Sin calculos de remuneraciones ni liquidaciones.
 */
export function construirPrevalidacionMensual(hechos: ProcesoMensualHechosPrevalidacion): ProcesoMensualPrevalidacion {
  const periodo = hechos.periodo.trim();
  const periodoFormatoValido = validarPeriodoEntradaMensual(periodo);
  const parametrosGrupos = asArray(hechos.parametrosGrupos);
  const trabajadoresPendientesRevision = asArray(hechos.trabajadoresPendientesRevision);
  const entradasMensuales = asArray(hechos.entradasMensuales);
  const movimientos = asArray(hechos.movimientos);

  const bloqueos: ProcesoMensualMensaje[] = [];
  const advertencias: ProcesoMensualMensaje[] = [];
  const informaciones: ProcesoMensualMensaje[] = [];
  const items: ProcesoMensualItem[] = [];

  if (!periodoFormatoValido) {
    pushMsg(bloqueos, 'PERIODO_FORMATO_INVALIDO', 'PARAMETROS', 'BLOQUEO', MSG_PERIODO_INVALIDO);
    items.push({
      area: 'PARAMETROS',
      etiqueta: 'Parámetros',
      estado: 'CON_PROBLEMAS',
      detalle: MSG_PERIODO_INVALIDO,
    });
    const resumen: ProcesoMensualResumen = {
      periodo,
      hayBloqueos: true,
      hayAdvertencias: false,
      totalEntradasMensuales: 0,
      resumenEntradasMensuales: construirResumenEntradas([]),
      conteoEntradasPorEstado: {},
      conteoMovimientosPorEstado: {},
      trabajadoresActivosAptos: 0,
      trabajadoresActivosNoAptos: 0,
      parametrosOperativos: false,
      parametrosGrupos: [],
      recurrentesAplicablesAlPeriodo: 0,
      recurrentesInvalidas: 0,
      recurrentesCerradas: 0,
      recurrentesFueraDelMes: 0,
    };
    return {
      periodo,
      estado: 'BLOQUEADO',
      resumen,
      bloqueos,
      advertencias,
      informaciones,
      items: completarItemsVacios(items),
      entradasMensuales: [],
      trabajadoresPendientesRevision,
    };
  }

  /* --- Parametros --- */
  let itemParametros: ItemEstado = 'LISTO';
  let detalleParam: string | undefined;
  let parametrosOperativos = hechos.parametrosOperativos ?? estadoParametrosOperativoFallback(hechos, periodo);
  const estadoVisualParametros = hechos.parametrosEstadoVisual;
  const detalleEstadoParametros = hechos.parametrosEstadoDetalle?.trim();

  if (hechos.lecturaUltimoPg === 'error') {
    pushMsg(
      bloqueos,
      'PARAMETROS_LECTURA_ERROR',
      'PARAMETROS',
      'BLOQUEO',
      hechos.errorUltimoPg ?? 'No fue posible leer los parámetros oficiales del período.',
    );
    itemParametros = 'CON_PROBLEMAS';
    detalleParam = 'Error de lectura';
  } else if (!hechos.ultimoPg) {
    pushMsg(
      bloqueos,
      'PARAMETROS_SIN_FILA',
      'PARAMETROS',
      'BLOQUEO',
      detalleEstadoParametros ?? 'Parámetros del período pendientes: falta la fila oficial del período.',
    );
    itemParametros = 'CON_PROBLEMAS';
    detalleParam = 'Sin fila oficial del período';
  } else if (hechos.ultimoPg.periodo !== periodo) {
    pushMsg(
      bloqueos,
      'PARAMETROS_SIN_FILA',
      'PARAMETROS',
      'BLOQUEO',
      detalleEstadoParametros ??
        `Parámetros del período pendientes: existe referencia ${hechos.ultimoPg.periodo}, pero falta la fila oficial ${periodo}.`,
    );
    itemParametros = 'CON_PROBLEMAS';
    detalleParam = `Referencia anterior: ${hechos.ultimoPg.periodo}`;
  }

  if (hechos.lecturaPeriodoRem === 'error') {
    pushMsg(
      bloqueos,
      'PARAMETROS_CALENDARIO_LECTURA',
      'PARAMETROS',
      'BLOQUEO',
      hechos.errorPeriodoRem ?? 'No fue posible leer el calendario de remuneración del período.',
    );
    itemParametros = 'CON_PROBLEMAS';
  } else if (!hechos.periodoRem) {
    if (hechos.ultimoPg && !parametrosOperativos) {
      pushMsg(
        bloqueos,
        'PARAMETROS_COMPLETITUD_PENDIENTE',
        'PARAMETROS',
        'BLOQUEO',
        detalleEstadoParametros ?? 'Parámetros del período pendientes: falta calendario de remuneración.',
      );
      if (itemParametros === 'LISTO') {
        itemParametros = 'CON_PROBLEMAS';
        detalleParam = 'Sin calendario del período';
      }
    }
  } else if (!parametrosOperativos && (hechos.periodoRem.estado === 'pendiente' || hechos.periodoRem.estado === 'error')) {
    pushMsg(
      bloqueos,
      'PARAMETROS_ESTADO_PERIODO_INOPERATIVO',
      'PARAMETROS',
      'BLOQUEO',
      detalleEstadoParametros ??
        `Parámetros del período pendientes: el calendario está en estado ${hechos.periodoRem.estado}.`,
    );
    itemParametros = 'CON_PROBLEMAS';
    detalleParam = `Estado período: ${hechos.periodoRem.estado}`;
  } else if (!parametrosOperativos && hechos.periodoRem.estado === 'parcial') {
    pushMsg(
      bloqueos,
      'PARAMETROS_COMPLETITUD_PENDIENTE',
      'PARAMETROS',
      'BLOQUEO',
      detalleEstadoParametros ?? 'Parámetros del período pendientes: la configuración está parcial.',
    );
    if (itemParametros === 'LISTO') {
      itemParametros = 'CON_PROBLEMAS';
    }
  }

  if (!parametrosOperativos && itemParametros === 'LISTO') {
    pushMsg(
      bloqueos,
      codigoBloqueoEstadoParametros(estadoVisualParametros),
      'PARAMETROS',
      'BLOQUEO',
      detalleEstadoParametros ?? 'Parámetros del período pendientes.',
    );
    itemParametros = 'CON_PROBLEMAS';
    detalleParam = detalleEstadoParametros ?? 'Parámetros pendientes';
  }

  for (const g of parametrosGrupos) {
    if (g.clasificacion === 'FALTANTE' || g.clasificacion === 'PARCIAL') {
      if (!parametrosOperativos) {
        pushMsg(
          advertencias,
          `PARAM_MIN_${g.id}`,
          'PARAMETROS',
          'ADVERTENCIA',
          textoGrupoParametro(g),
        );
        itemParametros = 'CON_PROBLEMAS';
      }
    } else if (g.clasificacion === 'PENDIENTE_INTEGRACION') {
      pushMsg(
        informaciones,
        `PARAM_MIN_${g.id}`,
        'PARAMETROS',
        'INFO',
        `Parámetros del período: ${etiquetaGrupoParametro(g.id)} pendiente de integración.`,
      );
    }
  }

  items.push({
    area: 'PARAMETROS',
    etiqueta: 'Parámetros',
    estado: itemParametros,
    detalle: detalleParam,
  });

  /* --- Trabajadores --- */
  let itemTrab: ItemEstado = 'LISTO';
  let detalleTrab: string | undefined;
  if (hechos.lecturaEmpleados === 'error') {
    pushMsg(
      bloqueos,
      'EMPLEADOS_LECTURA_ERROR',
      'TRABAJADORES',
      'BLOQUEO',
      hechos.errorEmpleados ?? 'Error al leer trabajadores.',
    );
    itemTrab = 'CON_PROBLEMAS';
    detalleTrab = 'Error de lectura';
  } else {
    if (hechos.empleadosActivosAptos === 0) {
      pushMsg(
        bloqueos,
        'EMPLEADOS_SIN_ACTIVOS_APTOS',
        'TRABAJADORES',
        'BLOQUEO',
        'No hay trabajadores listos para nómina en el período.',
      );
      itemTrab = 'CON_PROBLEMAS';
      detalleTrab = 'Sin trabajadores listos';
    }
    if (hechos.empleadosActivosNoAptos > 0) {
      pushMsg(
        bloqueos,
        'TRABAJADORES_BLOQUEADOS_NOMINA',
        'TRABAJADORES',
        'BLOQUEO',
        'Existen trabajadores activos con datos críticos pendientes para la nómina mensual.',
      );
      if (itemTrab === 'LISTO') {
        itemTrab = 'CON_PROBLEMAS';
      }
      detalleTrab = `${hechos.empleadosActivosNoAptos} trabajador(es) bloqueado(s)`;
    }
  }
  items.push({
    area: 'TRABAJADORES',
    etiqueta: 'Trabajadores',
    estado: itemTrab,
    detalle: detalleTrab,
  });

  /* --- Conceptos --- */
  let itemConc: ItemEstado = 'LISTO';
  let detalleConc: string | undefined;
  if (hechos.lecturaConceptos === 'error') {
    pushMsg(
      advertencias,
      'CONCEPTOS_LECTURA',
      'CONCEPTOS',
      'ADVERTENCIA',
      hechos.errorConceptos ?? 'No se pudo leer el catálogo de conceptos.',
    );
    itemConc = 'CON_PROBLEMAS';
  } else if (hechos.totalConceptosMantenimiento === 0) {
    pushMsg(
      advertencias,
      'CONCEPTOS_VACIO',
      'CONCEPTOS',
      'ADVERTENCIA',
      'No hay filas en mantenimiento de conceptos; el cálculo de nómina requerirá catálogo.',
    );
    itemConc = 'CON_PROBLEMAS';
    detalleConc = 'Catálogo vacío';
  } else if (hechos.alertaConceptosMotorFuturo) {
    pushMsg(
      advertencias,
      'CONCEPTOS_CLASIFICACION_FUTURA',
      'CONCEPTOS',
      'ADVERTENCIA',
      'Hay conceptos vigentes sin tipo o naturaleza; revisar antes del cálculo de nómina.',
    );
    itemConc = 'CON_PROBLEMAS';
    detalleConc = 'Clasificación incompleta en algún concepto';
  }
  items.push({
    area: 'CONCEPTOS',
    etiqueta: 'Conceptos',
    estado: itemConc,
    detalle: detalleConc,
  });

  /* --- Haberes recurrentes --- */
  let itemRec: ItemEstado = 'LISTO';
  let detalleRec: string | undefined;
  const rc = hechos.recurrentesConteo;
  if (rc.lectura === 'error') {
    pushMsg(
      bloqueos,
      'RECURRENTES_LECTURA_ERROR',
      'HABERES_RECURRENTES',
      'BLOQUEO',
      rc.error ?? 'Error al leer asignaciones recurrentes.',
    );
    itemRec = 'CON_PROBLEMAS';
    detalleRec = 'Error de lectura';
  } else {
    const partes: string[] = [];
    if (rc.invalidas > 0) {
      pushMsg(
        bloqueos,
        'RECURRENTES_INVALIDAS',
        'HABERES_RECURRENTES',
        'BLOQUEO',
        'Existen asignaciones recurrentes con vigencia inválida; corrige antes del cálculo.',
      );
      itemRec = 'CON_PROBLEMAS';
      partes.push(`${rc.invalidas} invalida(s)`);
    }
    partes.push(`${rc.aplicables} aplicable(s) al mes`);
    partes.push(`${rc.fueraDelMes} abierta(s) fuera del mes`);
    partes.push(`${rc.cerradas} cerrada(s)`);
    detalleRec = partes.join('; ');
  }
  items.push({
    area: 'HABERES_RECURRENTES',
    etiqueta: 'Haberes recurrentes',
    estado: itemRec,
    detalle: detalleRec,
  });

  /* --- Entradas mensuales canonicas --- */
  const entradas = entradasMensuales;
  const resumenEntradas = construirResumenEntradas(entradas);
  const conteosEntradas = conteosPorEstadoEntrada(entradas);
  const conteos = conteosPorEstadoMv(movimientos);
  let itemEntradas: ItemEstado = 'LISTO';
  let detalleEntradas: string | undefined;

  if (hechos.lecturaEntradasMensuales === 'error') {
    pushMsg(
      bloqueos,
      'ENTRADAS_LECTURA_ERROR',
      'ENTRADAS_MENSUALES',
      'BLOQUEO',
      hechos.errorEntradasMensuales ?? 'Error al leer entradas mensuales del período.',
    );
    itemEntradas = 'CON_PROBLEMAS';
    detalleEntradas = 'Error de lectura';
  } else {
    const partes: string[] = [];

    if (resumenEntradas.bloqueantes > 0 || entradas.some(entradaBloqueaProceso)) {
      pushMsg(
        bloqueos,
        'ENTRADAS_BLOQUEANTES',
        'ENTRADAS_MENSUALES',
        'BLOQUEO',
        'Existen entradas mensuales bloqueantes para el período.',
      );
      itemEntradas = 'CON_PROBLEMAS';
      partes.push(`${resumenEntradas.bloqueantes} bloqueante(s)`);
    }
    if (resumenEntradas.pendientesRevision > 0) {
      pushMsg(
        advertencias,
        'ENTRADAS_PENDIENTES_REVISION',
        'ENTRADAS_MENSUALES',
        'ADVERTENCIA',
        'Existen entradas mensuales en borrador o pendientes de revisión para el período.',
      );
      if (itemEntradas === 'LISTO') {
        itemEntradas = 'CON_PROBLEMAS';
      }
      partes.push(`${resumenEntradas.pendientesRevision} pendiente(s)`);
    }
    if (resumenEntradas.observadas > 0 || entradas.some(entradaRequiereRevision)) {
      pushMsg(
        advertencias,
        'ENTRADAS_OBSERVADAS',
        'ENTRADAS_MENSUALES',
        'ADVERTENCIA',
        'Existen entradas mensuales observadas o que requieren revisión para el período.',
      );
      if (itemEntradas === 'LISTO') {
        itemEntradas = 'CON_PROBLEMAS';
      }
      partes.push(`${resumenEntradas.observadas} observada(s)`);
    }
    partes.push(`${resumenEntradas.aptasPreNomina} apta(s) para prenómina`);
    partes.push(`${resumenEntradas.legacyMovimientos} legacy`);
    detalleEntradas = partes.join('; ');
  }

  items.push({
    area: 'ENTRADAS_MENSUALES',
    etiqueta: 'Entradas mensuales',
    estado: itemEntradas,
    detalle: detalleEntradas,
  });

  /* --- Proceso / liquidaciones futuras --- */
  pushMsg(
    informaciones,
    'PROCESO_LIQUIDACIONES_FUTURO',
    'PROCESO',
    'INFO',
    'Liquidaciones oficiales son una fase futura; este módulo prepara y revisa el cálculo preliminar.',
  );
  items.push({
    area: 'PROCESO',
    etiqueta: 'Liquidaciones futuras',
    estado: 'PENDIENTE_INTEGRACION',
    detalle: 'Snapshot e inmutabilidad: fase futura (p. ej. LIQ-CHILE-01)',
  });

  const { bloqueosGeneracion, advertenciasDesdeBloqueo } = separarBloqueosGeneracionNomina(bloqueos);
  const advertenciasFinales = [...advertencias, ...advertenciasDesdeBloqueo];
  const estado = mergeEstadoFinal(bloqueosGeneracion, advertenciasFinales);

  const resumen: ProcesoMensualResumen = {
    periodo,
    hayBloqueos: bloqueosGeneracion.length > 0,
    hayAdvertencias: advertenciasFinales.length > 0,
    totalEntradasMensuales: resumenEntradas.total,
    resumenEntradasMensuales: resumenEntradas,
    conteoEntradasPorEstado: conteosEntradas,
    conteoMovimientosPorEstado: conteos,
    trabajadoresActivosAptos: hechos.empleadosActivosAptos,
    trabajadoresActivosNoAptos: hechos.empleadosActivosNoAptos,
    parametrosOperativos,
    parametrosGrupos,
    recurrentesAplicablesAlPeriodo: hechos.recurrentesConteo.aplicables,
    recurrentesInvalidas: hechos.recurrentesConteo.invalidas,
    recurrentesCerradas: hechos.recurrentesConteo.cerradas,
    recurrentesFueraDelMes: hechos.recurrentesConteo.fueraDelMes,
  };

  return {
    periodo,
    estado,
    resumen,
    bloqueos: bloqueosGeneracion,
    advertencias: advertenciasFinales,
    informaciones,
    items,
    entradasMensuales: entradas,
    trabajadoresPendientesRevision,
  };
}

function estadoParametrosOperativoFallback(hechos: ProcesoMensualHechosPrevalidacion, periodo: string): boolean {
  return Boolean(
    hechos.ultimoPg &&
    hechos.ultimoPg.periodo === periodo &&
    hechos.periodoRem &&
    estadoPeriodoRemuneracionOperativo(hechos.periodoRem.estado),
  );
}

function codigoBloqueoEstadoParametros(estado: ParametrosEstadoVisual | undefined): string {
  switch (estado) {
    case 'error':
      return 'PARAMETROS_LECTURA_ERROR';
    case 'oficial_sin_config':
    case 'configuracion_parcial':
      return 'PARAMETROS_CONFIG_CLIENTE_INCOMPLETA';
    case 'pendiente_reconciliacion':
      return 'PARAMETROS_RECONCILIACION_PENDIENTE';
    case 'sin_base':
    case 'referencia_anterior':
      return 'PARAMETROS_SIN_FILA';
    default:
      return 'PARAMETROS_COMPLETITUD_PENDIENTE';
  }
}

function etiquetaGrupoParametro(id: string): string {
  switch (id) {
    case 'mensuales_uf_utm_sueldo':
      return 'valores UF, UTM y sueldos mínimos';
    case 'topes_base':
      return 'topes imponibles y APV';
    case 'tasas_cotizacion':
      return 'tasas previsionales y de salud';
    case 'catalogos_afp_impuesto':
      return 'vigencias de AFP, salud e impuesto único';
    case 'ley_16744':
      return 'parámetros Ley 16.744';
    default:
      return id.replace(/_/g, ' ');
  }
}

function textoGrupoParametro(g: ProcesoMensualGrupoParametro): string {
  const base = `Parámetros del período: revisar ${etiquetaGrupoParametro(g.id)}`;
  if (g.detalle?.trim()) {
    return `${base}. ${g.detalle.trim()}.`;
  }
  return `${base}.`;
}

function completarItemsVacios(parcial: ProcesoMensualItem[]): ProcesoMensualItem[] {
  const areas: ProcesoMensualArea[] = [
    'TRABAJADORES',
    'CONCEPTOS',
    'HABERES_RECURRENTES',
    'ENTRADAS_MENSUALES',
    'PROCESO',
  ];
  const labels: Record<ProcesoMensualArea, string> = {
    PARAMETROS: 'Parámetros',
    TRABAJADORES: 'Trabajadores',
    CONCEPTOS: 'Conceptos',
    HABERES_RECURRENTES: 'Haberes recurrentes',
    ENTRADAS_MENSUALES: 'Entradas mensuales',
    MOVIMIENTOS_VARIABLES: 'Movimientos del mes',
    PROCESO: 'Liquidaciones futuras',
  };
  const out = [...parcial];
  for (const a of areas) {
    if (!out.some((i) => i.area === a)) {
      out.push({ area: a, etiqueta: labels[a], estado: 'NO_EVALUADO' });
    }
  }
  return out;
}
