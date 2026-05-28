import type { ProcesoMensualGrupoParametro } from '../models/proceso-mensual.model';
import {
  extraerCamposOficialesPendientes,
  humanizarPendienteActa,
  mensajeCampoOficialPendiente,
  tituloCampoOficialPendiente,
} from './proceso-mensual-copy-limpio.rules';
import {
  etiquetaClasificacionGrupoParametro,
  etiquetaGrupoParametroUi,
} from './proceso-mensual-parametros-refresh.rules';
import type {
  InformacionPeriodoDestino,
  InformacionPeriodoResumenVerificacion,
  InformacionPeriodoView,
} from '../containers/proceso-mensual-container/models/proceso-mensual-container.vm';
import type { BitacoraRailEtapaVm } from '../containers/proceso-mensual-container/models/proceso-mensual-container.vm';
import type { ProcesoMensualAccionPrincipalVm } from './proceso-mensual-estado-operativo.rules';
import type { ValidacionCalculoPreliminarView } from '../containers/proceso-mensual-container/models/proceso-mensual-container.vm';

export type ActaPreparacionEstadoResultado =
  | 'pendiente'
  | 'verificando'
  | 'listo'
  | 'bloqueado'
  | 'advertencias';

export interface ActaPreparacionContextoPeriodoVm {
  periodoEtiqueta: string;
  trabajadoresAptos: number;
  movimientosLabel: string;
  recurrentesLabel: string;
}

export interface ActaPreparacionAccionSecundariaVm {
  label: string;
  destino: InformacionPeriodoDestino;
}

export interface ActaPreparacionPendienteVm {
  severidad: 'bloqueo' | 'advertencia';
  titulo: string;
  descripcion: string;
  accionLabel: string | null;
  destino: InformacionPeriodoDestino | null;
  idPersona?: number;
}

export interface ActaPreparacionCentralVm {
  etapa: string;
  estadoEtapa: string;
  titulo: string;
  descripcion: string;
  previewLinea: string | null;
  estadoResultado: ActaPreparacionEstadoResultado;
  resumenVerificacion: InformacionPeriodoResumenVerificacion | null;
  contextoPeriodo: ActaPreparacionContextoPeriodoVm | null;
  alertasTotal: number;
  alertasEtiqueta: string | null;
  pendientes: readonly ActaPreparacionPendienteVm[];
  ctaLabel: string;
  ctaDisabled: boolean;
  ctaDisabledReason: string | null;
  ctaLoading: boolean;
  accionSecundaria: ActaPreparacionAccionSecundariaVm | null;
  accionCorreccion: ActaPreparacionAccionSecundariaVm | null;
  mensajeEstado: string | null;
  /** Aclara configuración cliente vs datos oficiales cuando aplica. */
  notaFuentesParametros: string | null;
}

export const LABEL_VERIFICAR_Y_GENERAR = 'Verificar y generar nómina';
export const LABEL_ABRIR_PARAMETROS = 'Abrir parámetros';

export const NOTA_DOS_FUENTES_PARAMETROS =
  'La configuración del cliente y los datos oficiales del período se revisan por separado en Parámetros. '
  + 'Hasta cargar los datos oficiales, la nómina se preparará con la información vigente disponible.';
export const LABEL_PREPARACION_NOMINA_EN_CURSO = 'Verificando y generando nómina';

export function mensajePreparacionNominaEnCurso(): string {
  return LABEL_PREPARACION_NOMINA_EN_CURSO;
}

export function ctaLabelPreparacionNominaEnCurso(): string {
  return `${LABEL_PREPARACION_NOMINA_EN_CURSO}…`;
}

export function previewTrabajadoresPreparacion(input: {
  trabajadoresAptos: number | null;
  trabajadoresPorRevisar: number | null;
}): string | null {
  const aptos = input.trabajadoresAptos ?? 0;
  const porRevisar = input.trabajadoresPorRevisar ?? 0;

  if (aptos > 0) {
    return `${aptos} trabajador${aptos === 1 ? '' : 'es'} listo${aptos === 1 ? '' : 's'} para nómina.`;
  }
  if (porRevisar > 0) {
    return `${porRevisar} trabajador${porRevisar === 1 ? '' : 'es'} por revisar antes de generar.`;
  }
  return null;
}

function descripcionActaDesdeEtapa(clave: string, fallback: string): string {
  switch (clave) {
    case 'validar':
      return 'Revise parámetros, movimientos y recurrentes del período. Si todo está en orden, se generará el borrador de nómina.';
    case 'base':
      return 'Genere el borrador para revisar trabajador por trabajador antes de confirmar.';
    case 'calculo':
      return 'Revise trabajadores con cambios, advertencias o bloqueos en el período.';
    default:
      return fallback;
  }
}

function buildResumenVerificacion(
  criticos: number,
  advertencias: number,
  trabajadoresPendientes: number,
): InformacionPeriodoResumenVerificacion {
  return { criticos, advertencias, trabajadoresPendientes };
}

/** Alinea métricas del acta con la lista expandida de pendientes (p. ej. varios datos oficiales). */
export function mergeResumenVerificacionActa(
  base: InformacionPeriodoResumenVerificacion,
  pendientes: readonly ActaPreparacionPendienteVm[],
): InformacionPeriodoResumenVerificacion {
  const criticosPendientes = pendientes.filter((item) => item.severidad === 'bloqueo').length;
  const advertenciasPendientes = pendientes.filter((item) => item.severidad === 'advertencia').length;
  const fichasPendientes = pendientes.filter((item) => item.idPersona != null).length;
  return {
    criticos: Math.max(base.criticos, criticosPendientes),
    advertencias: Math.max(base.advertencias, advertenciasPendientes),
    trabajadoresPendientes: Math.max(base.trabajadoresPendientes, fichasPendientes),
  };
}

function resolveCtaLabel(input: {
  tienePrevalidacion: boolean;
  accionPrincipal: ProcesoMensualAccionPrincipalVm;
  validando: boolean;
  generandoPreNomina: boolean;
  preparacionNominaUnificada: boolean;
}): string {
  if (
    input.preparacionNominaUnificada
    && (input.validando || input.generandoPreNomina)
  ) {
    return ctaLabelPreparacionNominaEnCurso();
  }
  if (!input.tienePrevalidacion || input.accionPrincipal.accionLocal === 'validarPeriodo' || input.accionPrincipal.accionLocal === 'generarBase') {
    return LABEL_VERIFICAR_Y_GENERAR;
  }
  return input.accionPrincipal.label;
}

function resolveEstadoResultado(input: {
  validando: boolean;
  generandoPreNomina: boolean;
  preparacionNominaUnificada: boolean;
  tienePrevalidacion: boolean;
  criticos: number;
  fichasPendientes: number;
  advertencias: number;
}): ActaPreparacionEstadoResultado {
  if (
    input.preparacionNominaUnificada
    && (input.validando || input.generandoPreNomina)
  ) {
    return 'verificando';
  }
  if (!input.tienePrevalidacion) {
    return 'pendiente';
  }
  if (input.criticos > 0) {
    return 'bloqueado';
  }
  if (input.fichasPendientes > 0 || input.advertencias > 0) {
    return 'advertencias';
  }
  return 'listo';
}

function severidadDesdeTituloSeccion(titulo: string): 'bloqueo' | 'advertencia' {
  const normalizado = titulo.toLowerCase();
  if (normalizado.includes('crít') || normalizado.includes('crit')) {
    return 'bloqueo';
  }
  return 'advertencia';
}

function destinoDesdeRutaPendiente(ruta?: string): InformacionPeriodoDestino | null {
  const limpia = ruta?.trim();
  if (!limpia) {
    return null;
  }
  if (limpia === '/parametros') {
    return 'parametros_app';
  }
  if (limpia.includes('novedades') || limpia.includes('movimiento')) {
    return 'movimientos';
  }
  if (limpia.includes('liquidacion')) {
    return 'resultado';
  }
  return null;
}

function parseItemSeccionPendiente(item: string): { titulo: string; descripcion: string } {
  const separador = item.indexOf(': ');
  if (separador <= 0) {
    return humanizarPendienteActa(item.trim(), item.trim());
  }
  return humanizarPendienteActa(
    item.slice(0, separador).trim(),
    item.slice(separador + 2).trim(),
  );
}

function pendienteActaDesdeCopy(input: {
  severidad: 'bloqueo' | 'advertencia';
  titulo: string;
  descripcion: string;
  accionLabel: string | null;
  destino: InformacionPeriodoDestino | null;
  idPersona?: number;
}): ActaPreparacionPendienteVm {
  const copy = humanizarPendienteActa(input.titulo, input.descripcion);
  return {
    severidad: input.severidad,
    titulo: copy.titulo,
    descripcion: copy.descripcion,
    accionLabel: input.accionLabel,
    destino: input.destino,
    idPersona: input.idPersona,
  };
}

function esPendienteParametrosGenerico(item: ActaPreparacionPendienteVm): boolean {
  const titulo = item.titulo.toLowerCase();
  const descripcion = item.descripcion.toLowerCase();
  if (/falta el valor|no puede quedar en cero|datos oficiales del período/i.test(descripcion)) {
    return true;
  }
  return titulo.includes('parámetros del período')
    || titulo.includes('datos oficiales del período');
}

function severidadDesdeClasificacionGrupo(
  clasificacion: ProcesoMensualGrupoParametro['clasificacion'],
): 'bloqueo' | 'advertencia' {
  return clasificacion === 'FALTANTE' ? 'bloqueo' : 'advertencia';
}

function buildPendientesParametrosDesdeGrupos(
  grupos: readonly ProcesoMensualGrupoParametro[],
): ActaPreparacionPendienteVm[] {
  const out: ActaPreparacionPendienteVm[] = [];
  for (const grupo of grupos) {
    if (grupo.clasificacion === 'OK' || grupo.clasificacion === 'NO_APLICA_AUN') {
      continue;
    }
    const detalle = grupo.detalle?.trim()
      || `${etiquetaClasificacionGrupoParametro(grupo.clasificacion)} en ${etiquetaGrupoParametroUi(grupo.id)}.`;
    out.push(
      pendienteActaDesdeCopy({
        severidad: severidadDesdeClasificacionGrupo(grupo.clasificacion),
        titulo: etiquetaGrupoParametroUi(grupo.id),
        descripcion: detalle,
        accionLabel: null,
        destino: 'parametros_app',
      }),
    );
  }
  return out;
}

function buildPendientesCamposOficialesDesdeTexto(textos: readonly string[]): ActaPreparacionPendienteVm[] {
  const campos = new Map<string, 'falta' | 'cero'>();
  for (const texto of textos) {
    for (const item of extraerCamposOficialesPendientes(texto)) {
      const previo = campos.get(item.campo);
      if (!previo || item.motivo === 'cero') {
        campos.set(item.campo, item.motivo);
      }
    }
  }
  return [...campos.entries()].map(([campo, motivo]) =>
    pendienteActaDesdeCopy({
      severidad: 'bloqueo',
      titulo: tituloCampoOficialPendiente(campo),
      descripcion: mensajeCampoOficialPendiente(campo, motivo),
      accionLabel: null,
      destino: 'parametros_app',
    }),
  );
}

export function buildPendientesActaPreparacion(
  info: InformacionPeriodoView | null,
  extras?: {
    parametrosGrupos?: readonly ProcesoMensualGrupoParametro[];
    textosDetalleParametros?: readonly string[];
  },
): ActaPreparacionPendienteVm[] {
  if (!info && !extras?.parametrosGrupos?.length && !extras?.textosDetalleParametros?.length) {
    return [];
  }

  const out: ActaPreparacionPendienteVm[] = [];
  const textosRawParaCampos: string[] = [...(extras?.textosDetalleParametros ?? [])];

  for (const seccion of info?.secciones ?? []) {
    const severidad = severidadDesdeTituloSeccion(seccion.titulo);
    if (seccion.detalles?.length) {
      for (const detalle of seccion.detalles) {
        out.push(
          pendienteActaDesdeCopy({
            severidad,
            titulo: detalle.titulo,
            descripcion: detalle.descripcion,
            accionLabel: detalle.accionLabel ?? null,
            destino: destinoDesdeRutaPendiente(detalle.ruta),
          }),
        );
      }
      continue;
    }
    for (const item of seccion.items) {
      const parsed = parseItemSeccionPendiente(item);
      out.push(
        pendienteActaDesdeCopy({
          severidad,
          titulo: parsed.titulo,
          descripcion: parsed.descripcion,
          accionLabel: null,
          destino: null,
        }),
      );
    }
  }

  for (const trabajador of info?.trabajadoresPendientes ?? []) {
    const copy = humanizarPendienteActa(
      trabajador.nombre,
      trabajador.detalleCorreccion?.trim() || trabajador.motivo,
    );
    out.push(
      pendienteActaDesdeCopy({
        severidad: 'advertencia',
        titulo: copy.titulo,
        descripcion: copy.descripcion,
        accionLabel: 'Revisar ficha',
        destino: 'trabajadores_fichas',
        idPersona: trabajador.idPersona,
      }),
    );
  }

  const expandidos = [
    ...buildPendientesParametrosDesdeGrupos(extras?.parametrosGrupos ?? []),
    ...buildPendientesCamposOficialesDesdeTexto(textosRawParaCampos),
  ];

  const baseFiltrada = expandidos.length > 0
    ? out.filter((item) => !esPendienteParametrosGenerico(item))
    : out;

  const merged = [...baseFiltrada, ...expandidos];

  const vistos = new Set<string>();
  return merged.filter((item) => {
    const clave = `${item.severidad}|${item.titulo}|${item.descripcion}`;
    if (vistos.has(clave)) {
      return false;
    }
    vistos.add(clave);
    return true;
  }).slice(0, 8);
}

export function labelAccionParametrosActa(destino: InformacionPeriodoDestino | null | undefined): string {
  if (destino === 'parametros_app' || destino === 'parametros') {
    return LABEL_ABRIR_PARAMETROS;
  }
  if (destino === 'trabajadores_fichas') {
    return 'Revisar trabajadores';
  }
  return 'Revisar parámetros';
}

function resolveMensajeEstado(
  estado: ActaPreparacionEstadoResultado,
  tienePrevalidacion: boolean,
  pendientesCount: number,
): string | null {
  if (pendientesCount > 0) {
    return null;
  }
  if (!tienePrevalidacion) {
    return 'Use la acción principal para revisar el período y, si no hay bloqueos, generar la nómina automáticamente.';
  }
  switch (estado) {
    case 'listo':
      return 'No hay bloqueos críticos. Puede generar la nómina del período.';
    case 'bloqueado':
      return 'Corrija los puntos críticos antes de generar la nómina.';
    case 'advertencias':
      return 'Revise advertencias o fichas pendientes antes de continuar.';
    default:
      return null;
  }
}

export function informacionDebeAbrirModalEnPreparacion(
  view: InformacionPeriodoView | null,
  actaVisible: boolean,
): boolean {
  if (!view) {
    return false;
  }
  if (!actaVisible) {
    return true;
  }
  if (view.consultando || view.soloVerificacionParametros || view.soloAlertasExpediente) {
    return true;
  }
  if (view.tone === 'danger') {
    return true;
  }
  if (
    view.titulo === 'Período listo para generar'
    || view.titulo === 'Revisión del período antes de generar'
    || view.titulo === 'Revisión requerida antes de continuar'
  ) {
    return false;
  }
  if (view.secciones?.length) {
    const totalItems = view.secciones.reduce((n, s) => n + s.items.length, 0);
    return totalItems > 6;
  }
  if ((view.trabajadoresPendientes?.length ?? 0) > 3) {
    return true;
  }
  return false;
}

export function puedeEncadenarGeneracionTrasVerificacion(input: {
  tienePrevalidacion: boolean;
  puedeGenerarNomina: boolean;
  prevalidacionEstado: string | null;
  validacionCalculo: ValidacionCalculoPreliminarView;
  trabajadoresPendientesCount: number;
}): boolean {
  if (!input.tienePrevalidacion || !input.puedeGenerarNomina) {
    return false;
  }
  if (input.prevalidacionEstado === 'BLOQUEADO') {
    return false;
  }
  const bloqueos = (input.validacionCalculo.bloqueos ?? []).filter((item) => item.codigo !== 'BLOQ-005');
  if (bloqueos.length > 0) {
    return false;
  }
  if (input.trabajadoresPendientesCount > 0) {
    return false;
  }
  return true;
}

export function buildActaPreparacionCentral(input: {
  etapasRail: readonly BitacoraRailEtapaVm[];
  accionPrincipal: ProcesoMensualAccionPrincipalVm;
  tienePrevalidacion: boolean;
  trabajadoresAptos: number | null;
  trabajadoresPorRevisar: number | null;
  trabajadoresPendientesRevisionCount: number;
  bloqueosCount: number;
  advertenciasCount: number;
  validacionCriticos: number;
  validacionAdvertencias: number;
  accionPeriodoEnCurso: boolean;
  validando: boolean;
  generandoPreNomina: boolean;
  preparacionNominaUnificada: boolean;
  frameTexto: string;
  periodoEtiqueta: string;
  movimientosAprobados: number;
  asignacionesAplicables: number | null;
  informacionPeriodo: InformacionPeriodoView | null;
  parametrosGrupos?: readonly ProcesoMensualGrupoParametro[];
  textosDetalleParametros?: readonly string[];
  parametrosOperativos?: boolean;
}): ActaPreparacionCentralVm {
  const activa = input.etapasRail.find((etapa) => etapa.activa)
    ?? input.etapasRail.find((etapa) => etapa.marca === 'actual')
    ?? input.etapasRail.find((etapa) => etapa.marca === 'pendiente')
    ?? input.etapasRail[0];

  const criticos = input.tienePrevalidacion ? input.validacionCriticos : 0;
  const advertencias = input.tienePrevalidacion ? input.validacionAdvertencias : 0;
  const fichasPendientes = input.tienePrevalidacion ? input.trabajadoresPendientesRevisionCount : 0;

  const estadoResultado = resolveEstadoResultado({
    validando: input.validando,
    generandoPreNomina: input.generandoPreNomina,
    preparacionNominaUnificada: input.preparacionNominaUnificada,
    tienePrevalidacion: input.tienePrevalidacion,
    criticos,
    fichasPendientes,
    advertencias,
  });

  const alertasTotal = input.bloqueosCount + input.advertenciasCount;
  const info = input.informacionPeriodo;
  const pendientes = buildPendientesActaPreparacion(info, {
    parametrosGrupos: input.parametrosGrupos,
    textosDetalleParametros: input.textosDetalleParametros,
  });
  const resumenBase = input.tienePrevalidacion
    ? (input.informacionPeriodo?.resumenVerificacion
      ?? buildResumenVerificacion(criticos, advertencias, fichasPendientes))
    : null;
  const resumenVerificacion = resumenBase
    ? mergeResumenVerificacionActa(resumenBase, pendientes)
    : null;
  const parametrosOperativos = input.parametrosOperativos ?? true;
  const notaFuentesParametros = !parametrosOperativos ? NOTA_DOS_FUENTES_PARAMETROS : null;
  const alertasEtiqueta = pendientes.length === 0 && alertasTotal > 0
    ? `Revisar ${alertasTotal} alerta${alertasTotal === 1 ? '' : 's'} del período`
    : null;
  const accionSecundaria: ActaPreparacionAccionSecundariaVm | null =
    info?.accionSecundaria && info.accionSecundaria.destino !== 'cerrar'
      ? { label: info.accionSecundaria.label, destino: info.accionSecundaria.destino }
      : null;

  const accionCorreccionDestino =
    info?.accionPrincipal
    && info.accionPrincipal.destino !== 'generar_nomina'
    && info.accionPrincipal.destino !== 'cerrar'
    && info.accionPrincipal.destino !== 'reintentar'
      ? info.accionPrincipal.destino
      : null;
  const accionCorreccion: ActaPreparacionAccionSecundariaVm | null = accionCorreccionDestino
    ? { label: labelAccionParametrosActa(accionCorreccionDestino), destino: accionCorreccionDestino }
    : null;

  const ctaEsCorreccion = accionCorreccion != null
    && (estadoResultado === 'bloqueado' || estadoResultado === 'advertencias');

  const contextoPeriodo: ActaPreparacionContextoPeriodoVm | null = input.tienePrevalidacion
    ? {
        periodoEtiqueta: input.periodoEtiqueta,
        trabajadoresAptos: input.trabajadoresAptos ?? 0,
        movimientosLabel: input.movimientosAprobados > 0
          ? `${input.movimientosAprobados} considerados`
          : 'sin registros',
        recurrentesLabel: (input.asignacionesAplicables ?? 0) > 0
          ? `${input.asignacionesAplicables} consideradas`
          : 'sin registros',
      }
    : null;

  return {
    etapa: activa?.etiqueta ?? 'Preparación del período',
    estadoEtapa: activa?.estadoCorto ?? 'En curso',
    titulo: input.tienePrevalidacion
      ? (info?.titulo && info.titulo !== 'Período listo para generar'
        ? info.titulo
        : (activa?.etiqueta ?? 'Período verificado'))
      : (activa?.etiqueta ?? input.accionPrincipal.label),
    descripcion: input.tienePrevalidacion && info?.bajada
      ? info.bajada
      : descripcionActaDesdeEtapa(activa?.clave ?? '', input.frameTexto),
    previewLinea: previewTrabajadoresPreparacion({
      trabajadoresAptos: input.trabajadoresAptos,
      trabajadoresPorRevisar: input.trabajadoresPorRevisar,
    }),
    estadoResultado,
    resumenVerificacion,
    contextoPeriodo,
    alertasTotal,
    alertasEtiqueta,
    pendientes,
    ctaLabel: ctaEsCorreccion && accionCorreccion
      ? accionCorreccion.label
      : resolveCtaLabel({
          tienePrevalidacion: input.tienePrevalidacion,
          accionPrincipal: input.accionPrincipal,
          validando: input.validando,
          generandoPreNomina: input.generandoPreNomina,
          preparacionNominaUnificada: input.preparacionNominaUnificada,
        }),
    ctaDisabled: !!input.accionPrincipal.disabled || input.accionPeriodoEnCurso,
    ctaDisabledReason: input.accionPrincipal.disabledReason ?? null,
    ctaLoading:
      input.preparacionNominaUnificada
      || input.validando
      || input.generandoPreNomina,
    accionSecundaria,
    accionCorreccion: ctaEsCorreccion ? accionCorreccion : null,
    mensajeEstado: resolveMensajeEstado(estadoResultado, input.tienePrevalidacion, pendientes.length),
    notaFuentesParametros,
  };
}

/** Oculta la CTA del shell cuando el acta ya ofrece la misma acción hacia Parámetros. */
export function shellDebeOcultarCtaParametros(acta: Pick<ActaPreparacionCentralVm, 'accionCorreccion' | 'ctaLabel'>): boolean {
  const destino = acta.accionCorreccion?.destino;
  if (destino === 'parametros_app' || destino === 'parametros') {
    return true;
  }
  return acta.ctaLabel === LABEL_ABRIR_PARAMETROS || acta.ctaLabel === 'Corregir pendientes';
}
