import type { EmpleadoListado } from '../../empleados/models/empleado-listado.model';
import type { LicenciaMedica } from '../../licencias-medicas/models/licencia-medica.model';
import type { NominaPeriodoResumen } from '../../nomina-mensual/models/nomina-periodo.models';
import type { NovedadMensual } from '../../nomina-mensual/novedades/models/novedad-mensual.model';
import { estadoNominaToBadge } from '../../nomina-mensual/containers/administrador-nominas-container/utils/admin-nominas-presentacion.util';

export type ResumenKpiTone = 'neutral' | 'info' | 'warning' | 'danger' | 'success';

export interface ResumenKpi {
  id: string;
  label: string;
  value: number | null;
  tone: ResumenKpiTone;
  ruta: string;
  icon: string;
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
): ResumenEconomicoIndicador[] {
  const ruta = '/parametros';
  const uf = parametros?.uf ?? null;
  const utm = parametros?.utm ?? null;
  const uta = parametros?.uta ?? null;
  const sueldoMinimo = parametros?.sueldoMinimo ?? null;
  const dolar = parametros?.dolarObservado ?? null;

  return [
    {
      id: 'uf',
      label: 'UF',
      value: uf,
      formato: 'clp',
      tone: uf == null ? 'warning' : 'info',
      ruta,
      disponible: uf != null,
      detalle: uf == null ? 'Sin valor en parámetros del período' : undefined,
    },
    {
      id: 'utm',
      label: 'UTM',
      value: utm,
      formato: 'clp-entero',
      tone: utm == null ? 'warning' : 'neutral',
      ruta,
      disponible: utm != null,
      detalle: utm == null ? 'Sin valor en parámetros del período' : undefined,
    },
    {
      id: 'uta',
      label: 'UTA',
      value: uta,
      formato: 'clp-entero',
      tone: uta == null ? 'warning' : 'neutral',
      ruta,
      disponible: uta != null,
      detalle: uta == null ? 'Sin valor en parámetros del período' : undefined,
    },
    {
      id: 'sueldo-minimo',
      label: 'Sueldo mínimo',
      value: sueldoMinimo,
      formato: 'clp-entero',
      tone: sueldoMinimo == null ? 'warning' : 'success',
      ruta,
      disponible: sueldoMinimo != null,
      detalle: sueldoMinimo == null ? 'Sin valor en parámetros del período' : undefined,
    },
    {
      id: 'dolar',
      label: 'Dólar observado',
      value: dolar,
      formato: 'clp',
      tone: 'warning',
      ruta,
      disponible: dolar != null,
      detalle:
        dolar == null
          ? 'Aún no está cargado en parámetros del sistema'
          : undefined,
    },
  ];
}

export function construirResumenOperativo(input: {
  periodoYm: string;
  nominas: NominaPeriodoResumen[] | null;
  empleados: EmpleadoListado[] | null;
  licenciasPendientes: LicenciaMedica[] | null;
  novedades: NovedadMensual[] | null;
  parametros?: ResumenParametrosEconomicos | null;
}): ResumenOperativoSnapshot {
  const nominasPeriodo = input.nominas ? filtrarNominasPeriodo(input.nominas, input.periodoYm) : [];
  const empleados = input.empleados ?? [];
  const licenciasCount = input.licenciasPendientes?.length ?? null;
  const movimientosCount = input.novedades ? contarMovimientosRevision(input.novedades) : null;
  const activos = input.empleados ? contarEmpleadosActivos(empleados) : null;
  const aptos = input.empleados ? contarEmpleadosAptos(empleados) : null;
  const nominasCurso = input.nominas ? contarNominasEnCurso(nominasPeriodo) : null;
  const fichasIncompletas = input.empleados ? contarFichasIncompletas(empleados) : null;
  const criticas = input.nominas ? contarNominasCriticas(nominasPeriodo) : null;
  const economicos = construirIndicadoresEconomicos(input.parametros ?? null);

  const kpis: ResumenKpi[] = [
    {
      id: 'empleados-activos',
      label: 'Empleados activos',
      value: activos,
      tone: 'info',
      ruta: '/empleados',
      icon: 'user-round',
    },
    {
      id: 'aptos-nomina',
      label: 'Aptos para nómina',
      value: aptos,
      tone: 'success',
      ruta: '/empleados',
      icon: 'user-check',
    },
    {
      id: 'nominas-curso',
      label: 'Nóminas en curso',
      value: nominasCurso,
      tone: nominasCurso && nominasCurso > 0 ? 'warning' : 'neutral',
      ruta: '/remuneraciones/nominas',
      icon: 'clipboard-list',
    },
    {
      id: 'movimientos-revision',
      label: 'Movimientos por revisar',
      value: movimientosCount,
      tone: movimientosCount && movimientosCount > 0 ? 'warning' : 'neutral',
      ruta: '/remuneraciones/novedades-mensuales',
      icon: 'calendar-plus',
    },
    {
      id: 'licencias-pendientes',
      label: 'Licencias pendientes',
      value: licenciasCount,
      tone: licenciasCount && licenciasCount > 0 ? 'danger' : 'neutral',
      ruta: '/licencias-medicas',
      icon: 'heart-pulse',
    },
  ];

  const atencion: ResumenAtencionItem[] = [];
  if (licenciasCount && licenciasCount > 0) {
    atencion.push({
      id: 'licencias',
      titulo: 'Licencias médicas por revisar',
      detalle: `${licenciasCount} licencia${licenciasCount === 1 ? '' : 's'} esperan confirmación antes de impactar nómina.`,
      ruta: '/licencias-medicas',
      icon: 'heart-pulse',
      tone: 'warning',
    });
  }
  if (movimientosCount && movimientosCount > 0) {
    atencion.push({
      id: 'movimientos',
      titulo: 'Movimientos del mes por aprobar',
      detalle: `${movimientosCount} movimiento${movimientosCount === 1 ? '' : 's'} en revisión para el período.`,
      ruta: '/remuneraciones/novedades-mensuales',
      icon: 'calendar-plus',
      tone: 'warning',
    });
  }
  if (criticas && criticas > 0) {
    atencion.push({
      id: 'nominas-criticas',
      titulo: 'Nóminas con incidencias críticas',
      detalle: `${criticas} nómina${criticas === 1 ? '' : 's'} del período requieren revisión inmediata.`,
      ruta: '/remuneraciones/nominas',
      icon: 'alert-triangle',
      tone: 'danger',
    });
  }
  if (fichasIncompletas && fichasIncompletas > 0) {
    atencion.push({
      id: 'fichas',
      titulo: 'Fichas de empleados incompletas',
      detalle: `${fichasIncompletas} trabajador${fichasIncompletas === 1 ? '' : 'es'} con datos pendientes para remuneraciones.`,
      ruta: '/empleados',
      icon: 'user-check',
      tone: 'info',
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
    });
  }

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
    estadoNominaDominante: input.nominas ? estadoNominaPrincipal(nominasPeriodo) : null,
    empresaNombre: input.nominas ? empresaDesdeNominas(nominasPeriodo) : null,
  };
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
      etiqueta: 'Revisar licencias médicas',
      detalle: `${input.licenciasCount} licencia${input.licenciasCount === 1 ? '' : 's'} esperan revisión.`,
      ruta: '/licencias-medicas',
      tone: 'warning',
    };
  }
  if (input.movimientosCount > 0) {
    return {
      etiqueta: 'Revisar movimientos del mes',
      detalle: `${input.movimientosCount} movimiento${input.movimientosCount === 1 ? '' : 's'} pendiente${input.movimientosCount === 1 ? '' : 's'} de aprobación.`,
      ruta: '/remuneraciones/novedades-mensuales',
      tone: 'warning',
    };
  }
  if (input.criticas > 0) {
    return {
      etiqueta: 'Ir al administrador de nóminas',
      detalle: 'Hay incidencias críticas en el período activo.',
      ruta: '/remuneraciones/nominas',
      tone: 'warning',
    };
  }
  if (input.fichasIncompletas > 0) {
    return {
      etiqueta: 'Completar fichas de empleados',
      detalle: `${input.fichasIncompletas} ficha${input.fichasIncompletas === 1 ? '' : 's'} requiere${input.fichasIncompletas === 1 ? '' : 'n'} atención.`,
      ruta: '/empleados',
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
    etiqueta: 'Ir al administrador de nóminas',
    detalle: 'Verifique el período y prepare la nómina mensual.',
    ruta: '/remuneraciones/nominas',
    tone: 'primary',
  };
}

export function formatearValorKpi(value: number | null): string {
  return value == null ? '—' : String(value);
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
