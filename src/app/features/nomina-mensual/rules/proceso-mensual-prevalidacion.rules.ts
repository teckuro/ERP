import type { HaberDescuentoAsignacionPrevalidacionMensualFila } from '../../haberes-descuentos/models/haber-descuento-asignacion.model';
import type { MovimientoVariableEstado, MovimientoVariableListadoFila } from '../../movimientos-variables/models/movimiento-variable.model';
import type {
  ParametroGeneral,
  PeriodoRemuneracionEstadoInfo,
} from '../../parametros-generales/models/parametro-general.model';
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
} from '../models/proceso-mensual.model';

type ItemEstado = ProcesoMensualItem['estado'];

export function contarRecurrentesParaPrevalidacionMensual(
  filas: readonly HaberDescuentoAsignacionPrevalidacionMensualFila[],
): Pick<ProcesoMensualRecurrentesConteo, 'aplicables' | 'invalidas' | 'cerradas' | 'fueraDelMes'> {
  let aplicables = 0;
  let invalidas = 0;
  let cerradas = 0;
  let fueraDelMes = 0;
  for (const f of filas) {
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
  parametrosGrupos: ProcesoMensualGrupoParametro[];
  empleadosActivosAptos: number;
  empleadosActivosNoAptos: number;
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

  const bloqueos: ProcesoMensualMensaje[] = [];
  const advertencias: ProcesoMensualMensaje[] = [];
  const informaciones: ProcesoMensualMensaje[] = [];
  const items: ProcesoMensualItem[] = [];

  if (!periodoFormatoValido) {
    pushMsg(bloqueos, 'PERIODO_FORMATO_INVALIDO', 'PARAMETROS', 'BLOQUEO', MSG_PERIODO_INVALIDO);
    items.push({
      area: 'PARAMETROS',
      etiqueta: 'Parametros',
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
    };
  }

  /* --- Parametros --- */
  let itemParametros: ItemEstado = 'LISTO';
  let detalleParam: string | undefined;
  let parametrosOperativos = false;

  if (hechos.lecturaUltimoPg === 'error') {
    pushMsg(
      bloqueos,
      'PARAMETROS_LECTURA_ERROR',
      'PARAMETROS',
      'BLOQUEO',
      hechos.errorUltimoPg ?? 'Error al leer parametros generales del periodo.',
    );
    itemParametros = 'CON_PROBLEMAS';
    detalleParam = 'Error de lectura';
  } else if (!hechos.ultimoPg) {
    pushMsg(
      bloqueos,
      'PARAMETROS_SIN_FILA',
      'PARAMETROS',
      'BLOQUEO',
      'No se encontraron parametros reales validados para este periodo.',
    );
    itemParametros = 'CON_PROBLEMAS';
    detalleParam = 'Sin fila de parametros generales';
  } else if (hechos.ultimoPg.periodo !== periodo) {
    pushMsg(
      advertencias,
      'PARAMETROS_FILA_NO_EXACTA',
      'PARAMETROS',
      'ADVERTENCIA',
      'La fila vigente de parametros generales corresponde a otro periodo que el seleccionado.',
    );
    itemParametros = 'CON_PROBLEMAS';
    detalleParam = `Ultimo registro: ${hechos.ultimoPg.periodo}`;
  }

  if (hechos.lecturaPeriodoRem === 'error') {
    pushMsg(
      bloqueos,
      'PARAMETROS_CALENDARIO_LECTURA',
      'PARAMETROS',
      'BLOQUEO',
      hechos.errorPeriodoRem ?? 'Error al leer calendario de remuneracion del periodo.',
    );
    itemParametros = 'CON_PROBLEMAS';
  } else if (!hechos.periodoRem) {
    if (hechos.ultimoPg) {
      pushMsg(
        advertencias,
        'PARAMETROS_CALENDARIO_AUSENTE',
        'PARAMETROS',
        'ADVERTENCIA',
        'El periodo no tiene fila en periodo_remuneracion; revise calendario en base de datos.',
      );
      if (itemParametros === 'LISTO') {
        itemParametros = 'CON_PROBLEMAS';
        detalleParam = 'Sin periodo_remuneracion';
      }
    }
  } else if (hechos.periodoRem.estado === 'pendiente' || hechos.periodoRem.estado === 'error') {
    pushMsg(
      bloqueos,
      'PARAMETROS_ESTADO_PERIODO_INOPERATIVO',
      'PARAMETROS',
      'BLOQUEO',
      `El periodo en calendario de remuneracion esta en estado "${hechos.periodoRem.estado}" y no admite proceso.`,
    );
    itemParametros = 'CON_PROBLEMAS';
    detalleParam = `Estado periodo: ${hechos.periodoRem.estado}`;
  } else if (hechos.periodoRem.estado === 'parcial') {
    pushMsg(
      advertencias,
      'PARAMETROS_ESTADO_PARCIAL',
      'PARAMETROS',
      'ADVERTENCIA',
      'Los parametros del periodo estan marcados como parciales en calendario de remuneracion.',
    );
    if (itemParametros === 'LISTO') {
      itemParametros = 'CON_PROBLEMAS';
    }
  }

  if (
    itemParametros === 'LISTO' &&
    hechos.ultimoPg &&
    hechos.ultimoPg.periodo === periodo &&
    hechos.periodoRem &&
    estadoPeriodoRemuneracionOperativo(hechos.periodoRem.estado)
  ) {
    parametrosOperativos = true;
  }

  for (const g of hechos.parametrosGrupos) {
    if (g.clasificacion === 'FALTANTE' || g.clasificacion === 'PARCIAL') {
      pushMsg(
        advertencias,
        `PARAM_MIN_${g.id}`,
        'PARAMETROS',
        'ADVERTENCIA',
        `Parametros grupo ${g.id}: ${g.clasificacion}${g.detalle ? ` (${g.detalle})` : ''}.`,
      );
      if (itemParametros === 'LISTO') {
        itemParametros = 'CON_PROBLEMAS';
      }
    } else if (g.clasificacion === 'PENDIENTE_INTEGRACION') {
      pushMsg(
        informaciones,
        `PARAM_MIN_${g.id}`,
        'PARAMETROS',
        'INFO',
        `Parametros grupo ${g.id}: pendiente integracion.`,
      );
    }
  }

  items.push({
    area: 'PARAMETROS',
    etiqueta: 'Parametros',
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
        advertencias,
        'EMPLEADOS_SIN_ACTIVOS_APTOS',
        'TRABAJADORES',
        'ADVERTENCIA',
        'No hay trabajadores activos aptos para remuneraciones.',
      );
      itemTrab = 'CON_PROBLEMAS';
      detalleTrab = 'Sin activos aptos';
    }
    if (hechos.empleadosActivosNoAptos > 0) {
      pushMsg(
        advertencias,
        'EMPLEADOS_ACTIVOS_NO_APTOS',
        'TRABAJADORES',
        'ADVERTENCIA',
        'Existen trabajadores activos no aptos para remuneraciones; revisar fichas.',
      );
      if (itemTrab === 'LISTO') {
        itemTrab = 'CON_PROBLEMAS';
      }
      detalleTrab = `${hechos.empleadosActivosNoAptos} activo(s) no apto(s)`;
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
      hechos.errorConceptos ?? 'No se pudo leer el catalogo de conceptos.',
    );
    itemConc = 'CON_PROBLEMAS';
  } else if (hechos.totalConceptosMantenimiento === 0) {
    pushMsg(
      advertencias,
      'CONCEPTOS_VACIO',
      'CONCEPTOS',
      'ADVERTENCIA',
      'No hay filas en mantenimiento de conceptos; el motor futuro requerira catalogo.',
    );
    itemConc = 'CON_PROBLEMAS';
    detalleConc = 'Catalogo vacio';
  } else if (hechos.alertaConceptosMotorFuturo) {
    pushMsg(
      advertencias,
      'CONCEPTOS_CLASIFICACION_FUTURA',
      'CONCEPTOS',
      'ADVERTENCIA',
      'Hay conceptos vigentes sin tipo o naturaleza; revisar antes del motor de calculo.',
    );
    itemConc = 'CON_PROBLEMAS';
    detalleConc = 'Clasificacion incompleta en algun concepto';
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
        'Existen asignaciones recurrentes con vigencia invalida; corrija antes del calculo.',
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
  const entradas = hechos.entradasMensuales;
  const resumenEntradas = construirResumenEntradas(entradas);
  const conteosEntradas = conteosPorEstadoEntrada(entradas);
  const conteos = conteosPorEstadoMv(hechos.movimientos);
  let itemEntradas: ItemEstado = 'LISTO';
  let detalleEntradas: string | undefined;

  if (hechos.lecturaEntradasMensuales === 'error') {
    pushMsg(
      bloqueos,
      'ENTRADAS_LECTURA_ERROR',
      'ENTRADAS_MENSUALES',
      'BLOQUEO',
      hechos.errorEntradasMensuales ?? 'Error al leer entradas mensuales del periodo.',
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
        'Existen entradas mensuales bloqueantes para el periodo.',
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
        'Existen entradas mensuales en borrador o pendientes de revision para el periodo.',
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
        'Existen entradas mensuales observadas o que requieren revision para el periodo.',
      );
      if (itemEntradas === 'LISTO') {
        itemEntradas = 'CON_PROBLEMAS';
      }
      partes.push(`${resumenEntradas.observadas} observada(s)`);
    }
    partes.push(`${resumenEntradas.aptasPreNomina} apta(s) para pre-nomina`);
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
    'Liquidaciones y motor son fases futuras; este modulo no calcula ni genera liquidaciones.',
  );
  items.push({
    area: 'PROCESO',
    etiqueta: 'Liquidaciones futuras',
    estado: 'PENDIENTE_INTEGRACION',
    detalle: 'Snapshot e inmutabilidad: fase futura (p. ej. LIQ-CHILE-01)',
  });

  const estado = mergeEstadoFinal(bloqueos, advertencias);

  const resumen: ProcesoMensualResumen = {
    periodo,
    hayBloqueos: bloqueos.length > 0,
    hayAdvertencias: advertencias.length > 0,
    totalEntradasMensuales: resumenEntradas.total,
    resumenEntradasMensuales: resumenEntradas,
    conteoEntradasPorEstado: conteosEntradas,
    conteoMovimientosPorEstado: conteos,
    trabajadoresActivosAptos: hechos.empleadosActivosAptos,
    trabajadoresActivosNoAptos: hechos.empleadosActivosNoAptos,
    parametrosOperativos,
    parametrosGrupos: hechos.parametrosGrupos,
    recurrentesAplicablesAlPeriodo: hechos.recurrentesConteo.aplicables,
    recurrentesInvalidas: hechos.recurrentesConteo.invalidas,
    recurrentesCerradas: hechos.recurrentesConteo.cerradas,
    recurrentesFueraDelMes: hechos.recurrentesConteo.fueraDelMes,
  };

  return {
    periodo,
    estado,
    resumen,
    bloqueos,
    advertencias,
    informaciones,
    items,
    entradasMensuales: entradas,
  };
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
    PARAMETROS: 'Parametros',
    TRABAJADORES: 'Trabajadores',
    CONCEPTOS: 'Conceptos',
    HABERES_RECURRENTES: 'Haberes recurrentes',
    ENTRADAS_MENSUALES: 'Entradas mensuales',
    MOVIMIENTOS_VARIABLES: 'Movimientos variables',
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
