import type { EmpleadoListado } from '../../empleados/models/empleado-listado.model';
import type { LicenciaMedica } from '../../licencias-medicas/models/licencia-medica.model';
import type { NominaPeriodoResumen } from '../../nomina-mensual/models/nomina-periodo.models';
import type { NovedadMensual } from '../../nomina-mensual/novedades/models/novedad-mensual.model';
import { estadoNominaToBadge } from '../../nomina-mensual/containers/administrador-nominas-container/utils/admin-nominas-presentacion.util';

export type ResumenKpiTone = 'neutral' | 'info' | 'warning' | 'danger' | 'success';

export type ResumenKpiFormato = 'entero' | 'clp-entero';

export interface ResumenKpi {
  id: string;
  label: string;
  value: number | null;
  tone: ResumenKpiTone;
  ruta: string;
  icon: string;
  /** Texto de apoyo bajo el valor (p. ej. “Requieren revisión”). */
  hint?: string;
  /** 0–1 para barra de avance (nómina en curso). */
  progreso?: number | null;
  formato?: ResumenKpiFormato;
}

export type ResumenEconomicoFormato = 'clp' | 'clp-entero';

export interface ResumenEconomicoIndicador {
  id: string;
  label: string;
  value: number | null;
  formato: ResumenEconomicoFormato;
  tone: ResumenKpiTone;
  ruta: string;
  disponible: boolean;
  detalle?: string;
  /** Variación % vs período anterior (null si no hay base). */
  variacionPct: number | null;
  /** Texto corto para UI: "+0,15%", "Sin variación", "Sin base". */
  variacionLabel: string;
  tendencia: 'up' | 'down' | 'flat' | 'unknown';
}

export interface ResumenParametrosEconomicos {
  uf: number | null;
  utm: number | null;
  uta: number | null;
  sueldoMinimo: number | null;
  /** Reservado: el sistema aún no persiste dólar observado. */
  dolarObservado?: number | null;
}

export interface ResumenAtencionItem {
  id: string;
  titulo: string;
  detalle: string;
  ruta: string;
  icon: string;
  tone: 'warning' | 'danger' | 'info';
  prioridad: 'alta' | 'media' | 'critica' | 'info';
}

export interface ResumenAccionRecomendada {
  etiqueta: string;
  detalle: string;
  ruta: string;
  tone: 'primary' | 'warning';
}

export interface ResumenOperativoSnapshot {
  kpis: ResumenKpi[];
  economicos: ResumenEconomicoIndicador[];
  atencion: ResumenAtencionItem[];
  accionRecomendada: ResumenAccionRecomendada;
  estadoNominaDominante: string | null;
  empresaNombre: string | null;
  evolucion: ResumenEvolucionCosto;
  composicion: ResumenComposicionCosto;
}

export interface ResumenEvolucionPunto {
  periodoYm: string;
  etiquetaMes: string;
  valorActual: number;
  valorAnterior: number;
}

export interface ResumenEvolucionCosto {
  anioActual: number;
  anioAnterior: number;
  puntos: ResumenEvolucionPunto[];
  maxValor: number;
  variacionPct: number | null;
  hayDatos: boolean;
}

export interface ResumenComposicionSegmento {
  id: string;
  label: string;
  monto: number;
  porcentaje: number;
  color: string;
}

export interface ResumenComposicionCosto {
  total: number;
  segmentos: ResumenComposicionSegmento[];
  hayDatos: boolean;
}

export function filtrarNominasPeriodo(
  resumenes: readonly NominaPeriodoResumen[],
  periodoYm: string,
): NominaPeriodoResumen[] {
  return resumenes.filter((r) => r.periodo === periodoYm);
}

export function contarEmpleadosActivos(empleados: readonly EmpleadoListado[]): number {
  return empleados.filter((e) => e.estado === 'activo').length;
}

export function contarEmpleadosAptos(empleados: readonly EmpleadoListado[]): number {
  return empleados.filter((e) => e.aptoParaRemuneraciones).length;
}

export function contarFichasIncompletas(empleados: readonly EmpleadoListado[]): number {
  return empleados.filter((e) => e.estadoFicha !== 'VALIDO' || !e.aptoParaRemuneraciones).length;
}

export function contarNominasEnCurso(nominasPeriodo: readonly NominaPeriodoResumen[]): number {
  return nominasPeriodo.filter((n) => n.estado !== 'cerrada' && n.estado !== 'anulada').length;
}

export function contarNominasCriticas(nominasPeriodo: readonly NominaPeriodoResumen[]): number {
  return nominasPeriodo.filter((n) => n.totalIncidenciasCriticas > 0).length;
}

export function contarMovimientosRevision(novedades: readonly NovedadMensual[]): number {
  return novedades.filter((n) => n.estado === 'pendiente_revision').length;
}

export function estadoNominaPrincipal(
  nominasPeriodo: readonly NominaPeriodoResumen[],
): string | null {
  if (!nominasPeriodo.length) {
    return 'Sin nómina del período';
  }
  const prioritaria =
    nominasPeriodo.find((n) => n.totalIncidenciasCriticas > 0)
    ?? nominasPeriodo.find((n) => n.estado !== 'cerrada' && n.estado !== 'anulada')
    ?? nominasPeriodo[0];
  return estadoNominaToBadge(prioritaria.estado).label;
}

export function empresaDesdeNominas(nominasPeriodo: readonly NominaPeriodoResumen[]): string | null {
  const nombre = nominasPeriodo.find((n) => n.empresaNombre?.trim())?.empresaNombre?.trim();
  return nombre || null;
}

export function construirIndicadoresEconomicos(
  parametros: ResumenParametrosEconomicos | null,
  parametrosAnterior: ResumenParametrosEconomicos | null = null,
): ResumenEconomicoIndicador[] {
  const ruta = '/parametros';

  const build = (
    id: string,
    label: string,
    value: number | null,
    prev: number | null,
    formato: ResumenEconomicoFormato,
    toneOk: ResumenKpiTone,
    sinValorDetalle: string,
  ): ResumenEconomicoIndicador => {
    const disponible = value != null;
    const variacion = calcularVariacionEconomica(value, prev);
    return {
      id,
      label,
      value,
      formato,
      tone: disponible ? toneOk : 'warning',
      ruta,
      disponible,
      detalle: disponible ? undefined : sinValorDetalle,
      variacionPct: variacion.pct,
      variacionLabel: disponible ? variacion.label : 'Sin valor',
      tendencia: disponible ? variacion.tendencia : 'unknown',
    };
  };

  return [
    build(
      'uf',
      'UF',
      parametros?.uf ?? null,
      parametrosAnterior?.uf ?? null,
      'clp',
      'info',
      'Sin valor en parámetros del período',
    ),
    build(
      'utm',
      'UTM',
      parametros?.utm ?? null,
      parametrosAnterior?.utm ?? null,
      'clp-entero',
      'neutral',
      'Sin valor en parámetros del período',
    ),
    build(
      'uta',
      'UTA',
      parametros?.uta ?? null,
      parametrosAnterior?.uta ?? null,
      'clp-entero',
      'neutral',
      'Sin valor en parámetros del período',
    ),
    build(
      'sueldo-minimo',
      'Sueldo mínimo',
      parametros?.sueldoMinimo ?? null,
      parametrosAnterior?.sueldoMinimo ?? null,
      'clp-entero',
      'success',
      'Sin valor en parámetros del período',
    ),
    build(
      'dolar',
      'Dólar observado',
      parametros?.dolarObservado ?? null,
      parametrosAnterior?.dolarObservado ?? null,
      'clp',
      'info',
      'Aún no está cargado en parámetros del sistema',
    ),
  ];
}

export function calcularVariacionEconomica(
  actual: number | null,
  anterior: number | null,
): { pct: number | null; label: string; tendencia: 'up' | 'down' | 'flat' | 'unknown' } {
  if (actual == null || anterior == null) {
    return { pct: null, label: 'Sin base', tendencia: 'unknown' };
  }
  if (anterior === 0) {
    if (actual === 0) {
      return { pct: 0, label: 'Sin variación', tendencia: 'flat' };
    }
    return { pct: null, label: 'Sin base', tendencia: 'unknown' };
  }
  const pct = ((actual - anterior) / Math.abs(anterior)) * 100;
  if (Math.abs(pct) < 0.005) {
    return { pct: 0, label: 'Sin variación', tendencia: 'flat' };
  }
  const redondeado = Math.round(pct * 100) / 100;
  const texto = `${redondeado > 0 ? '+' : ''}${redondeado.toFixed(2).replace('.', ',')}%`;
  return {
    pct: redondeado,
    label: texto,
    tendencia: redondeado > 0 ? 'up' : 'down',
  };
}

export function periodoAnteriorYm(periodoYm: string): string {
  return restarMesesYm(periodoYm, 1);
}

export function construirResumenOperativo(input: {
  periodoYm: string;
  nominas: NominaPeriodoResumen[] | null;
  empleados: EmpleadoListado[] | null;
  licenciasPendientes: LicenciaMedica[] | null;
  novedades: NovedadMensual[] | null;
  parametros?: ResumenParametrosEconomicos | null;
  parametrosAnterior?: ResumenParametrosEconomicos | null;
}): ResumenOperativoSnapshot {
  const nominasPeriodo = input.nominas ? filtrarNominasPeriodo(input.nominas, input.periodoYm) : [];
  const empleados = input.empleados ?? [];
  const empleadosCargados = input.empleados != null;
  const nominasCargadas = input.nominas != null;
  const licenciasCargadas = input.licenciasPendientes != null;
  const novedadesCargadas = input.novedades != null;

  const activos = empleadosCargados ? contarEmpleadosActivos(empleados) : null;
  const aptos = empleadosCargados ? contarEmpleadosAptos(empleados) : null;
  const nominasCurso = nominasCargadas ? contarNominasEnCurso(nominasPeriodo) : null;
  const fichasIncompletas = empleadosCargados ? contarFichasIncompletas(empleados) : null;
  const criticas = nominasCargadas ? contarNominasCriticas(nominasPeriodo) : null;
  const licenciasCount = licenciasCargadas ? (input.licenciasPendientes?.length ?? 0) : null;
  const movimientosCount = novedadesCargadas ? contarMovimientosRevision(input.novedades ?? []) : null;
  const economicos = construirIndicadoresEconomicos(
    input.parametros ?? null,
    input.parametrosAnterior ?? null,
  );

  const costoEsperado = nominasCargadas ? sumarCostoEsperado(nominasPeriodo) : null;
  const progresoNomina = nominasCargadas ? progresoNominaPeriodo(nominasPeriodo) : null;
  const pctAptos =
    activos != null && aptos != null && activos > 0
      ? Math.round((aptos / activos) * 100)
      : activos === 0
        ? 0
        : null;

  const evolucion = construirEvolucionCosto(input.periodoYm, input.nominas ?? []);
  const composicion = construirComposicionCosto(nominasPeriodo);

  const kpis: ResumenKpi[] = [
    {
      id: 'empleados-activos',
      label: 'Empleados activos',
      value: activos,
      tone: 'info',
      ruta: '/empleados',
      icon: 'users',
      hint: 'Dotación del período',
    },
    {
      id: 'aptos-nomina',
      label: 'Aptos para nómina',
      value: aptos,
      tone: 'success',
      ruta: '/empleados?filtro=aptas',
      icon: 'badge-check',
      hint: pctAptos != null ? `${pctAptos}% del total` : 'Sin datos',
    },
    {
      id: 'nominas-curso',
      label: 'Nómina en curso',
      value: nominasCurso,
      tone: nominasCurso && nominasCurso > 0 ? 'warning' : 'neutral',
      ruta: '/remuneraciones/nominas',
      icon: 'clipboard-list',
      hint: progresoNomina != null ? `Etapa ${progresoNomina.etapa} de ${progresoNomina.total}` : 'Sin nómina abierta',
      progreso: progresoNomina?.ratio ?? null,
    },
    {
      id: 'licencias-pendientes',
      label: 'Licencias pendientes',
      value: licenciasCount,
      tone: licenciasCount && licenciasCount > 0 ? 'danger' : 'neutral',
      ruta: '/licencias-medicas',
      icon: 'heart-pulse',
      hint: licenciasCount && licenciasCount > 0 ? 'Requieren revisión' : 'Sin pendientes',
    },
    {
      id: 'costo-esperado',
      label: 'Costo esperado',
      value: costoEsperado,
      tone: 'info',
      ruta: '/remuneraciones/nominas',
      icon: 'circle-dollar-sign',
      hint: 'Este período',
      formato: 'clp-entero',
    },
  ];

  const atencion: ResumenAtencionItem[] = [];
  if (licenciasCount && licenciasCount > 0) {
    atencion.push({
      id: 'licencias',
      titulo: 'Licencias médicas por revisar',
      detalle: `${licenciasCount} licencia${licenciasCount === 1 ? '' : 's'} esperan confirmación antes de impactar nómina.`,
      ruta: '/licencias-medicas',
      icon: 'clipboard-plus',
      tone: 'warning',
      prioridad: 'alta',
    });
  }
  if (movimientosCount && movimientosCount > 0) {
    atencion.push({
      id: 'movimientos',
      titulo: 'Movimientos del mes por aprobar',
      detalle: `${movimientosCount} movimiento${movimientosCount === 1 ? '' : 's'} en revisión para el período.`,
      ruta: '/remuneraciones/novedades-mensuales',
      icon: 'list-checks',
      tone: 'warning',
      prioridad: 'alta',
    });
  }
  if (criticas && criticas > 0) {
    atencion.push({
      id: 'nominas-criticas',
      titulo: 'Nóminas con incidencias críticas',
      detalle: `${criticas} nómina${criticas === 1 ? '' : 's'} del período requieren revisión inmediata.`,
      ruta: '/remuneraciones/nominas',
      icon: 'shield-alert',
      tone: 'danger',
      prioridad: 'critica',
    });
  }
  if (fichasIncompletas && fichasIncompletas > 0) {
    atencion.push({
      id: 'fichas',
      titulo: 'Fichas de empleados incompletas',
      detalle: `${fichasIncompletas} trabajador${fichasIncompletas === 1 ? '' : 'es'} con datos pendientes para remuneraciones.`,
      ruta: '/empleados?filtro=incompletas',
      icon: 'user-round',
      tone: 'info',
      prioridad: 'media',
    });
  }

  const faltantesEconomicos = economicos.filter(
    (item) => item.id !== 'dolar' && !item.disponible,
  );
  if (faltantesEconomicos.length > 0) {
    atencion.push({
      id: 'parametros-economicos',
      titulo: 'Indicadores económicos incompletos',
      detalle: `Faltan ${faltantesEconomicos.map((item) => item.label).join(', ')} en parámetros del período.`,
      ruta: '/parametros',
      icon: 'settings-2',
      tone: 'warning',
      prioridad: 'media',
    });
  }

  atencion.sort((a, b) => ordenPrioridadAtencion(a.prioridad) - ordenPrioridadAtencion(b.prioridad));

  const accionRecomendada = resolverAccionRecomendada({
    licenciasCount: licenciasCount ?? 0,
    movimientosCount: movimientosCount ?? 0,
    criticas: criticas ?? 0,
    fichasIncompletas: fichasIncompletas ?? 0,
    nominasCurso: nominasCurso ?? 0,
  });

  return {
    kpis,
    economicos,
    atencion,
    accionRecomendada,
    estadoNominaDominante: nominasCargadas ? estadoNominaPrincipal(nominasPeriodo) : null,
    empresaNombre: nominasCargadas ? empresaDesdeNominas(nominasPeriodo) : null,
    evolucion,
    composicion,
  };
}

function sumarCostoPeriodo(nominas: readonly NominaPeriodoResumen[]): number {
  return nominas
    .filter((n) => n.estado !== 'anulada')
    .reduce((acc, n) => acc + (n.totalHaberes || 0), 0);
}

/** Orden operativo: crítica primero, luego alta, media e info. */
export function ordenPrioridadAtencion(
  prioridad: ResumenAtencionItem['prioridad'],
): number {
  switch (prioridad) {
    case 'critica':
      return 0;
    case 'alta':
      return 1;
    case 'media':
      return 2;
    case 'info':
      return 3;
    default:
      return 9;
  }
}

function sumarCostoEsperado(nominasPeriodo: readonly NominaPeriodoResumen[]): number {
  return sumarCostoPeriodo(nominasPeriodo);
}

const MESES_CORTO = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'] as const;

function restarMesesYm(periodoYm: string, meses: number): string {
  const [y, m] = periodoYm.split('-').map(Number);
  const fecha = new Date(y, m - 1 - meses, 1);
  const yy = fecha.getFullYear();
  const mm = String(fecha.getMonth() + 1).padStart(2, '0');
  return `${yy}-${mm}`;
}

function etiquetaMesCorto(periodoYm: string): string {
  const mes = Number(periodoYm.slice(5, 7));
  return MESES_CORTO[mes - 1] ?? periodoYm;
}

export function construirEvolucionCosto(
  periodoYm: string,
  nominas: readonly NominaPeriodoResumen[],
): ResumenEvolucionCosto {
  const anioActual = Number(periodoYm.slice(0, 4));
  const anioAnterior = anioActual - 1;
  const puntos: ResumenEvolucionPunto[] = [];

  for (let i = 5; i >= 0; i -= 1) {
    const actualYm = restarMesesYm(periodoYm, i);
    const anteriorYm = `${anioAnterior}-${actualYm.slice(5, 7)}`;
    const valorActual = sumarCostoPeriodo(filtrarNominasPeriodo(nominas, actualYm));
    const valorAnterior = sumarCostoPeriodo(filtrarNominasPeriodo(nominas, anteriorYm));
    puntos.push({
      periodoYm: actualYm,
      etiquetaMes: etiquetaMesCorto(actualYm),
      valorActual,
      valorAnterior,
    });
  }

  const maxValor = Math.max(
    0,
    ...puntos.flatMap((p) => [p.valorActual, p.valorAnterior]),
  );
  const ultimo = puntos[puntos.length - 1];
  let variacionPct: number | null = null;
  if (ultimo && ultimo.valorAnterior > 0) {
    variacionPct = ((ultimo.valorActual - ultimo.valorAnterior) / ultimo.valorAnterior) * 100;
  } else if (ultimo && ultimo.valorActual === 0 && ultimo.valorAnterior === 0) {
    variacionPct = 0;
  }

  return {
    anioActual,
    anioAnterior,
    puntos,
    maxValor,
    variacionPct,
    hayDatos: maxValor > 0,
  };
}

export function construirComposicionCosto(
  nominasPeriodo: readonly NominaPeriodoResumen[],
): ResumenComposicionCosto {
  const vigentes = nominasPeriodo.filter((n) => n.estado !== 'anulada');
  const haberes = vigentes.reduce((acc, n) => acc + (n.totalHaberes || 0), 0);
  const descuentos = vigentes.reduce((acc, n) => acc + (n.totalDescuentos || 0), 0);
  const liquido = vigentes.reduce((acc, n) => acc + (n.totalLiquido || 0), 0);
  const base = haberes + descuentos;
  const pct = (monto: number) => (base > 0 ? Math.round((monto / base) * 1000) / 10 : 0);

  return {
    total: haberes,
    segmentos: [
      {
        id: 'haberes',
        label: 'Haberes',
        monto: haberes,
        porcentaje: pct(haberes),
        color: '#2563eb',
      },
      {
        id: 'descuentos',
        label: 'Descuentos',
        monto: descuentos,
        porcentaje: pct(descuentos),
        color: '#f59e0b',
      },
      {
        id: 'liquido',
        label: 'Líquido',
        monto: liquido,
        porcentaje: haberes > 0 ? Math.round((liquido / haberes) * 1000) / 10 : 0,
        color: '#22c55e',
      },
    ],
    hayDatos: base > 0,
  };
}

function progresoNominaPeriodo(
  nominasPeriodo: readonly NominaPeriodoResumen[],
): { etapa: number; total: number; ratio: number } | null {
  const enCurso = nominasPeriodo.find(
    (n) => n.estado !== 'cerrada' && n.estado !== 'anulada',
  );
  if (!enCurso) {
    return null;
  }
  const orden: Record<string, number> = {
    borrador: 1,
    reabierta: 1,
    dotacion_generada: 2,
    en_revision: 3,
    calculada: 4,
    validada: 5,
    aprobada: 6,
    liquidada: 6,
  };
  const etapa = orden[enCurso.estado] ?? 1;
  const total = 6;
  return { etapa, total, ratio: etapa / total };
}

function resolverAccionRecomendada(input: {
  licenciasCount: number;
  movimientosCount: number;
  criticas: number;
  fichasIncompletas: number;
  nominasCurso: number;
}): ResumenAccionRecomendada {
  if (input.licenciasCount > 0) {
    return {
      etiqueta: 'Licencias médicas por revisar',
      detalle: `${input.licenciasCount} licencia${input.licenciasCount === 1 ? '' : 's'} esperan confirmación antes de impactar nómina.`,
      ruta: '/licencias-medicas',
      tone: 'warning',
    };
  }
  if (input.movimientosCount > 0) {
    return {
      etiqueta: 'Movimientos del mes por revisar',
      detalle: `${input.movimientosCount} movimiento${input.movimientosCount === 1 ? '' : 's'} pendiente${input.movimientosCount === 1 ? '' : 's'} de aprobación.`,
      ruta: '/remuneraciones/novedades-mensuales',
      tone: 'warning',
    };
  }
  if (input.criticas > 0) {
    return {
      etiqueta: 'Nóminas con incidencias críticas',
      detalle: 'Hay incidencias críticas en el período activo.',
      ruta: '/remuneraciones/nominas',
      tone: 'warning',
    };
  }
  if (input.fichasIncompletas > 0) {
    return {
      etiqueta: 'Fichas de empleados incompletas',
      detalle: `${input.fichasIncompletas} ficha${input.fichasIncompletas === 1 ? '' : 's'} requiere${input.fichasIncompletas === 1 ? '' : 'n'} atención.`,
      ruta: '/empleados?filtro=incompletas',
      tone: 'primary',
    };
  }
  if (input.nominasCurso > 0) {
    return {
      etiqueta: 'Continuar nómina del período',
      detalle: 'Avance el flujo operativo en el administrador de nóminas.',
      ruta: '/remuneraciones/nominas',
      tone: 'primary',
    };
  }
  return {
    etiqueta: 'Preparar nómina del período',
    detalle: 'Verifique el período y prepare la nómina mensual.',
    ruta: '/remuneraciones/nominas',
    tone: 'primary',
  };
}

export function formatearValorKpi(
  value: number | null,
  formato: ResumenKpiFormato = 'entero',
): string {
  if (value == null) {
    return '—';
  }
  if (formato === 'clp-entero') {
    return `$${new Intl.NumberFormat('es-CL', { maximumFractionDigits: 0 }).format(value)}`;
  }
  return String(value);
}

export function formatearValorEconomico(
  value: number | null,
  formato: ResumenEconomicoFormato,
): string {
  if (value == null || Number.isNaN(value)) {
    return '—';
  }
  const opciones: Intl.NumberFormatOptions =
    formato === 'clp'
      ? { minimumFractionDigits: 2, maximumFractionDigits: 2 }
      : { maximumFractionDigits: 0 };
  return new Intl.NumberFormat('es-CL', opciones).format(value);
}
