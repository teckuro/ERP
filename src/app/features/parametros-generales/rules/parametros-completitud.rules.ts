import type {
  ParametroGeneral,
  ParametrosGeneralesCatalogos,
  ParametrosGeneralesClienteConfig,
  ParametrosGeneralesClienteConfigUpsert,
  PeriodoRemuneracionEstado,
  PeriodoRemuneracionEstadoInfo,
} from '../models/parametro-general.model';

export type ParametrosCompletitudEstado = PeriodoRemuneracionEstado;
export type ParametrosEstadoVisual =
  | PeriodoRemuneracionEstado
  | 'editando'
  | 'pendiente_reconciliacion'
  | 'oficial_sin_config'
  | 'configuracion_parcial'
  | 'referencia_anterior'
  | 'sin_base';
export type ParametrosConfigClienteBaseOpcion = 'cero' | 'ultima' | 'referencia' | 'oficiales' | 'cancelar';
export type ParametrosCompletitudGrupoId =
  | 'oficialesMensuales'
  | 'configuracionCliente'
  | 'vigencias'
  | 'consistencia'
  | 'tecnico';

export interface ParametrosCompletitudGrupo {
  id: ParametrosCompletitudGrupoId;
  completo: boolean;
  porcentaje: number;
  total: number;
  completos: number;
}

export interface ParametrosDiferenciaCompletitud {
  campo: keyof ParametroGeneral;
  oficial: number | boolean | null;
  cliente: number | boolean | null;
}

export interface ParametrosCompletitudResultado {
  estadoCalculado: ParametrosCompletitudEstado;
  porcentaje: number;
  grupos: Record<ParametrosCompletitudGrupoId, ParametrosCompletitudGrupo>;
  pendientes: string[];
  advertencias: string[];
  errores: string[];
  diferencias: ParametrosDiferenciaCompletitud[];
  reconciliacionPendiente: boolean;
}

export interface EvaluarCompletitudParametrosInput {
  periodo: string;
  periodoRemuneracion: PeriodoRemuneracionEstadoInfo | null;
  oficial: ParametroGeneral | null;
  clienteConfig: ParametrosGeneralesClienteConfig | null;
  catalogos: ParametrosGeneralesCatalogos;
  errorTecnico?: boolean;
}

export interface ResolverEstadoVisualParametrosInput {
  estadoCalculado: ParametrosCompletitudEstado;
  oficialActual: boolean;
  clienteConfig: boolean;
  referenciaAnterior: boolean;
  diferencias: boolean;
  editando?: boolean;
  errorTecnico?: boolean;
}

export interface ResolverOpcionesBaseConfigClienteInput {
  ultimaConfigDisponible: boolean;
  referenciaAnteriorDisponible: boolean;
  oficialesActualesDisponibles: boolean;
}

const PESOS: Record<ParametrosCompletitudGrupoId, number> = {
  oficialesMensuales: 35,
  configuracionCliente: 25,
  vigencias: 25,
  consistencia: 10,
  tecnico: 5,
};

const CAMPOS_OFICIALES_OBLIGATORIOS: Array<keyof ParametroGeneral> = [
  'uf',
  'utm',
  'uta',
  'sueldoMinimo18a65',
  'sueldoMinimoMenor18Mayor65',
  'sueldoMinimoCasaParticular',
  'ingresoMinimoNoRemuneracional',
  'topeAfpUf',
  'topeAfp',
  'topeIpsUf',
  'topeIps',
  'topeCesantiaUf',
  'topeCesantia',
  'topeApvMensualUf',
  'topeApvMensual',
  'topeApvAnualUf',
  'topeApvAnual',
  'sis',
  'sanna',
  'saludObligatoria',
  'afcTrabajadorIndefinido',
  'afcEmpleadorIndefinido',
  'afcEmpleadorPlazo',
];

const CAMPOS_CLIENTE_OPERATIVOS: Array<keyof ParametroGeneral> = [
  'uf',
  'utm',
  'uta',
  'sueldoMinimo18a65',
  'sueldoMinimoMenor18Mayor65',
  'sueldoMinimoCasaParticular',
  'ingresoMinimoNoRemuneracional',
  'topeAfpUf',
  'topeAfp',
  'topeIpsUf',
  'topeIps',
  'topeCesantiaUf',
  'topeCesantia',
  'topeApvMensualUf',
  'topeApvMensual',
  'topeApvAnualUf',
  'topeApvAnual',
  'sis',
  'sanna',
  'saludObligatoria',
  'afcTrabajadorIndefinido',
  'afcEmpleadorIndefinido',
  'afcEmpleadorPlazo',
  'trabajoPesadoEmpleador',
  'trabajoPesadoTrabajador',
  'trabajoMenosPesadoEmpleador',
  'trabajoMenosPesadoTrabajador',
];

const CAMPOS_COMPARABLES: Array<keyof ParametroGeneral> = [
  ...CAMPOS_OFICIALES_OBLIGATORIOS,
  'trabajoPesadoEmpleador',
  'trabajoPesadoTrabajador',
  'trabajoMenosPesadoEmpleador',
  'trabajoMenosPesadoTrabajador',
];

export function evaluarCompletitudParametrosMensual(
  input: EvaluarCompletitudParametrosInput,
): ParametrosCompletitudResultado {
  const pendientes: string[] = [];
  const advertencias: string[] = [];
  const errores: string[] = [];

  const oficiales = evaluarOficiales(input, pendientes);
  const config = evaluarConfigCliente(input, pendientes);
  const vigencias = evaluarVigencias(input, pendientes);
  const diferencias = compararOficialCliente(input.oficial, input.clienteConfig);
  const reconciliacionPendiente = diferencias.length > 0 && requiereReconciliacionOficial(input.clienteConfig);
  const consistencia = grupo('consistencia', reconciliacionPendiente ? 0 : 1, 1);
  if (reconciliacionPendiente) {
    advertencias.push('Existen diferencias pendientes entre valores oficiales y configuracion cliente.');
  }

  const tecnicoCompleto = !input.errorTecnico && input.periodoRemuneracion?.estado !== 'error';
  const tecnico = grupo('tecnico', tecnicoCompleto ? 1 : 0, 1);
  if (!tecnicoCompleto) {
    errores.push('Existe una falla tecnica o error de carga asociado al periodo.');
  }

  const grupos = {
    oficialesMensuales: oficiales,
    configuracionCliente: config,
    vigencias,
    consistencia,
    tecnico,
  };

  const porcentaje = Math.min(100, Math.round(
    (Object.entries(grupos) as Array<[ParametrosCompletitudGrupoId, ParametrosCompletitudGrupo]>).reduce(
      (acc, [id, g]) => acc + (g.porcentaje * PESOS[id]) / 100,
      0,
    ),
  ));

  return {
    estadoCalculado: resolverEstado(input.periodoRemuneracion?.estado ?? null, grupos, errores, reconciliacionPendiente),
    porcentaje,
    grupos,
    pendientes,
    advertencias,
    errores,
    diferencias,
    reconciliacionPendiente,
  };
}

function evaluarOficiales(
  input: EvaluarCompletitudParametrosInput,
  pendientes: string[],
): ParametrosCompletitudGrupo {
  let total = 4 + CAMPOS_OFICIALES_OBLIGATORIOS.length;
  let completos = 0;

  if (input.oficial) {
    completos += 1;
  } else {
    pendientes.push('Faltan datos oficiales mensuales del periodo.');
  }

  completos += contarCampos(input.oficial, CAMPOS_OFICIALES_OBLIGATORIOS, pendientes, 'Falta dato oficial');
  completos += sumaArray(input.catalogos.tramosCarga, 'Faltan tramos de carga familiar.', pendientes);
  completos += sumaArray(input.catalogos.tramosImpuesto, 'Faltan tramos de impuesto unico.', pendientes);
  completos += sumaArray(input.catalogos.tablaImpuestoUnico, 'Falta tabla de impuesto unico del periodo.', pendientes);

  return grupo('oficialesMensuales', completos, total);
}

function evaluarConfigCliente(
  input: EvaluarCompletitudParametrosInput,
  pendientes: string[],
): ParametrosCompletitudGrupo {
  let total = 6 + CAMPOS_CLIENTE_OPERATIVOS.length;
  let completos = 0;
  const cfg = input.clienteConfig;

  if (cfg) {
    completos += 1;
  } else {
    pendientes.push('Falta configuracion cliente del periodo.');
  }

  completos += cfg?.gratificacion !== null && cfg?.gratificacion !== undefined ? 1 : 0;
  if (cfg?.gratificacion === null || cfg?.gratificacion === undefined) {
    pendientes.push('Falta definir gratificacion.');
  }

  if (cfg?.gratificacion === true) {
    completos += tieneValor(cfg.immGratificacion) ? 1 : 0;
    if (!tieneValor(cfg.immGratificacion)) {
      pendientes.push('Falta IMM de gratificacion.');
    }
  } else {
    completos += 1;
  }

  completos += cfg?.descuentosBasePorDia !== null && cfg?.descuentosBasePorDia !== undefined ? 1 : 0;
  if (cfg?.descuentosBasePorDia === null || cfg?.descuentosBasePorDia === undefined) {
    pendientes.push('Falta metodo de descuento por ausencias.');
  }

  const requiereCcaf = input.catalogos.ccafEntidades.length > 0;
  completos += !requiereCcaf || cfg?.idCcafEntidad ? 1 : 0;
  if (requiereCcaf && !cfg?.idCcafEntidad) {
    pendientes.push('Falta CCAF seleccionada.');
  }

  const requiereOrganismoLey16744 = input.catalogos.organismosLey16744.length > 0;
  completos += !requiereOrganismoLey16744 || cfg?.idOrganismoAdministradorLey16744 ? 1 : 0;
  if (requiereOrganismoLey16744 && !cfg?.idOrganismoAdministradorLey16744) {
    pendientes.push('Falta mutual seleccionada.');
  }

  completos += contarCampos(cfg, CAMPOS_CLIENTE_OPERATIVOS, pendientes, 'Falta configuracion cliente');
  return grupo('configuracionCliente', completos, total);
}

function evaluarVigencias(
  input: EvaluarCompletitudParametrosInput,
  pendientes: string[],
): ParametrosCompletitudGrupo {
  const checks = [
    { ok: input.catalogos.afp.length > 0, pendiente: 'Falta vigencia aplicable de AFP.' },
    {
      ok: input.catalogos.isapres.length > 0 || input.catalogos.saludInstituciones.length > 0,
      pendiente: 'Falta vigencia aplicable de salud.',
    },
    { ok: input.catalogos.afcParametros.length > 0, pendiente: 'Falta vigencia aplicable de AFC.' },
    {
      ok: tieneVigenciaAplicable(input.catalogos.reformaPrevisional, input.periodo),
      pendiente: 'Falta reforma previsional aplicable al periodo.',
    },
    {
      ok: tieneVigenciaAplicable(input.catalogos.trabajosPesados, input.periodo),
      pendiente: 'Falta vigencia aplicable de trabajo pesado.',
    },
    {
      ok: input.catalogos.reformaPensiones.length > 0,
      pendiente: 'Faltan parametros legales vigentes para el periodo.',
    },
  ];

  let completos = 0;
  for (const check of checks) {
    if (check.ok) {
      completos += 1;
    } else {
      pendientes.push(check.pendiente);
    }
  }

  return grupo('vigencias', completos, checks.length);
}

function compararOficialCliente(
  oficial: ParametroGeneral | null,
  cliente: ParametrosGeneralesClienteConfig | null,
): ParametrosDiferenciaCompletitud[] {
  if (!oficial || !cliente) {
    return [];
  }

  return CAMPOS_COMPARABLES.flatMap((campo) => {
    const oficialValue = normalizable(oficial[campo]) ? oficial[campo] : null;
    const clienteValue = normalizable(cliente[campo]) ? cliente[campo] : null;
    if (!tieneValor(oficialValue) || !tieneValor(clienteValue) || sonEquivalentes(oficialValue, clienteValue)) {
      return [];
    }
    return [{ campo, oficial: oficialValue, cliente: clienteValue }];
  });
}

function tieneVigenciaAplicable(
  rows: Array<{ vigenciaInicio: string | null; vigenciaFin: string | null }>,
  periodo: string,
): boolean {
  const { inicio, fin } = periodoRango(periodo);
  return rows.some((row) => {
    const vigenciaInicio = row.vigenciaInicio ?? '';
    const vigenciaFin = row.vigenciaFin ?? null;
    return vigenciaInicio <= fin && (vigenciaFin === null || vigenciaFin >= inicio);
  });
}

function periodoRango(periodo: string): { inicio: string; fin: string } {
  const [yearRaw, monthRaw] = periodo.split('-');
  const year = Number(yearRaw);
  const month = Number(monthRaw);
  const lastDay = Number.isFinite(year) && Number.isFinite(month) ? new Date(year, month, 0).getDate() : 28;
  return { inicio: `${periodo}-01`, fin: `${periodo}-${String(lastDay).padStart(2, '0')}` };
}

function contarCampos<T extends Partial<Record<keyof ParametroGeneral, unknown>>>(
  source: T | null,
  fields: Array<keyof ParametroGeneral>,
  pendientes: string[],
  prefix: string,
): number {
  let out = 0;
  for (const field of fields) {
    if (tieneValor(source?.[field])) {
      out += 1;
    } else {
      pendientes.push(`${prefix}: ${String(field)}.`);
    }
  }
  return out;
}

function sumaArray(rows: unknown[], pendiente: string, pendientes: string[]): number {
  if (rows.length > 0) {
    return 1;
  }
  pendientes.push(pendiente);
  return 0;
}

function resolverEstado(
  estadoPeriodo: PeriodoRemuneracionEstado | null,
  grupos: Record<ParametrosCompletitudGrupoId, ParametrosCompletitudGrupo>,
  errores: string[],
  reconciliacionPendiente: boolean,
): ParametrosCompletitudEstado {
  if (errores.length > 0) {
    return 'error';
  }
  if (!grupos.oficialesMensuales.completo && grupos.oficialesMensuales.porcentaje < 50) {
    return 'pendiente';
  }
  if (!grupos.oficialesMensuales.completo || !grupos.configuracionCliente.completo || !grupos.vigencias.completo) {
    return 'parcial';
  }
  // Diferencias se permiten sin bloquear (se manejan en UI)
  // El estado del mes respeta siempre periodo_remuneracion.estado si es cerrado/corregido
  if (reconciliacionPendiente) {
    return 'cargado';
  }
  if (estadoPeriodo === 'cerrado' || estadoPeriodo === 'corregido') {
    return estadoPeriodo;
  }
  return 'cargado';
}

function requiereReconciliacionOficial(cliente: ParametrosGeneralesClienteConfig | null): boolean {
  return cliente?.estadoReconciliacionOficial !== 'cliente_confirmado'
    && cliente?.estadoReconciliacionOficial !== 'actualizado_con_oficiales'
    && cliente?.estadoReconciliacionOficial !== 'revisar_despues';
}

export function resolverEstadoVisualParametros(input: ResolverEstadoVisualParametrosInput): ParametrosEstadoVisual {
  if (input.errorTecnico) {
    return 'error';
  }
  if (input.editando) {
    return 'editando';
  }
  if (input.oficialActual && input.clienteConfig && input.diferencias) {
    return 'pendiente_reconciliacion';
  }
  if (input.oficialActual && !input.clienteConfig) {
    return 'oficial_sin_config';
  }
  if (!input.oficialActual && input.clienteConfig) {
    return 'configuracion_parcial';
  }
  if (!input.oficialActual && input.referenciaAnterior) {
    return 'referencia_anterior';
  }
  if (!input.oficialActual) {
    return 'sin_base';
  }
  return input.estadoCalculado;
}

export function resolverOpcionesBaseConfigCliente(
  input: ResolverOpcionesBaseConfigClienteInput,
): ParametrosConfigClienteBaseOpcion[] {
  const opciones: ParametrosConfigClienteBaseOpcion[] = ['cero'];
  if (input.ultimaConfigDisponible) {
    opciones.push('ultima');
  }
  if (input.referenciaAnteriorDisponible) {
    opciones.push('referencia');
  }
  if (input.oficialesActualesDisponibles) {
    opciones.push('oficiales');
  }
  opciones.push('cancelar');
  return opciones;
}

export function crearClienteConfigDesdeOficiales(
  oficial: ParametroGeneral,
  actual: ParametrosGeneralesClienteConfig | null,
  periodo: string,
): ParametrosGeneralesClienteConfigUpsert {
  return {
    periodo,
    uf: oficial.uf,
    utm: oficial.utm,
    uta: oficial.uta,
    sueldoMinimo: oficial.sueldoMinimo,
    sueldoMinimo18a65: oficial.sueldoMinimo18a65,
    sueldoMinimoMenor18Mayor65: oficial.sueldoMinimoMenor18Mayor65,
    sueldoMinimoCasaParticular: oficial.sueldoMinimoCasaParticular,
    ingresoMinimoNoRemuneracional: oficial.ingresoMinimoNoRemuneracional,
    topeAfpUf: oficial.topeAfpUf,
    topeAfp: oficial.topeAfp,
    topeIpsUf: oficial.topeIpsUf,
    topeIps: oficial.topeIps,
    topeCesantiaUf: oficial.topeCesantiaUf,
    topeCesantia: oficial.topeCesantia,
    topeApvMensualUf: oficial.topeApvMensualUf,
    topeApvMensual: oficial.topeApvMensual,
    topeApvAnualUf: oficial.topeApvAnualUf,
    topeApvAnual: oficial.topeApvAnual,
    topeDepositoConvenidoAnualUf: oficial.topeDepositoConvenidoAnualUf,
    topeDepositoConvenidoAnual: oficial.topeDepositoConvenidoAnual,
    topeAfpVoluntario: oficial.topeAfpVoluntario,
    sis: oficial.sis,
    sanna: oficial.sanna,
    seguroSocialExpectativaVida: oficial.seguroSocialExpectativaVida,
    aporteEmpleadorAfp: oficial.aporteEmpleadorAfp,
    saludObligatoria: oficial.saludObligatoria,
    saludCcaf: oficial.saludCcaf,
    saludFonasaConCcaf: oficial.saludFonasaConCcaf,
    afcTrabajadorIndefinido: oficial.afcTrabajadorIndefinido,
    afcEmpleadorIndefinido: oficial.afcEmpleadorIndefinido,
    afcEmpleadorPlazo: oficial.afcEmpleadorPlazo,
    afcEmpleadorIndefinidoOnceAnosMas: oficial.afcEmpleadorIndefinidoOnceAnosMas,
    afcEmpleadorCasaParticular: oficial.afcEmpleadorCasaParticular,
    trabajoPesadoEmpleador: oficial.trabajoPesadoEmpleador,
    trabajoPesadoTrabajador: oficial.trabajoPesadoTrabajador,
    trabajoMenosPesadoEmpleador: oficial.trabajoMenosPesadoEmpleador,
    trabajoMenosPesadoTrabajador: oficial.trabajoMenosPesadoTrabajador,
    descuentosBasePorDia: actual?.descuentosBasePorDia ?? false,
    gratificacion: actual?.gratificacion ?? oficial.gratificacion ?? true,
    immGratificacion: actual?.immGratificacion ?? oficial.immGratificacion,
    idCcafEntidad: actual?.idCcafEntidad ?? null,
    idOrganismoAdministradorLey16744: actual?.idOrganismoAdministradorLey16744 ?? null,
  };
}

function grupo(id: ParametrosCompletitudGrupoId, completos: number, total: number): ParametrosCompletitudGrupo {
  const safeTotal = Math.max(total, 1);
  const porcentaje = Math.round((completos / safeTotal) * 100);
  return { id, completo: completos >= safeTotal, porcentaje, total: safeTotal, completos };
}

function tieneValor(value: unknown): boolean {
  return value !== null && value !== undefined && value !== '';
}

function normalizable(value: unknown): value is number | boolean | null {
  return typeof value === 'number' || typeof value === 'boolean' || value === null || value === undefined;
}

function sonEquivalentes(left: number | boolean | null, right: number | boolean | null): boolean {
  if (typeof left === 'number' && typeof right === 'number') {
    return Math.abs(left - right) < 0.0001;
  }
  return left === right;
}
