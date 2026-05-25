import { validarPeriodoEntradaMensual } from '../entradas/rules/entradas-mensuales-periodo.rules';
import type {
  BaseNominaTrazabilidad,
  ClasificacionParametroGrupo,
  ProcesoMensualArea,
  ProcesoMensualMensaje,
  ProcesoMensualPreNominaPeriodo,
  ProcesoMensualPrevalidacion,
} from '../models/proceso-mensual.model';
import type {
  ValidacionCalculoEstado,
  ValidacionCalculoPreliminarView,
  ValidacionOperativaItemView,
  ValidacionOperativaSeveridad,
} from '../containers/proceso-mensual-container/models/proceso-mensual-container.vm';

export interface ValidacionCalculoPreliminarInput {
  periodo: string;
  resultado: ProcesoMensualPrevalidacion | null;
  preNomina: ProcesoMensualPreNominaPeriodo | null;
  base: BaseNominaTrazabilidad | null;
  errorEjecucion: string | null;
  nominaCerradaOperativamente: boolean;
  tieneSnapshotPersistido?: boolean;
  tieneBasePersistida?: boolean;
}

function asArray<T>(value: readonly T[] | null | undefined): T[] {
  return Array.isArray(value) ? [...value] : [];
}

export function buildValidacionCalculoPreliminarView(
  input: ValidacionCalculoPreliminarInput,
): ValidacionCalculoPreliminarView {
  const { periodo, resultado, preNomina, base, errorEjecucion, nominaCerradaOperativamente, tieneSnapshotPersistido, tieneBasePersistida } =
    input;
  const bloqueos: ValidacionOperativaItemView[] = [];
  const advertencias: ValidacionOperativaItemView[] = [];
  const informaciones: ValidacionOperativaItemView[] = [];

  if (!validarPeriodoEntradaMensual(periodo)) {
    bloqueos.push({
      codigo: 'BLOQ-001',
      titulo: 'Período inválido',
      descripcion: 'Selecciona un período válido antes de generar la nómina mensual.',
      severidad: 'bloqueo',
      accionLabel: 'Seleccionar período válido',
    });
  }

  if (nominaCerradaOperativamente) {
    bloqueos.push({
      codigo: 'BLOQ-CIERRE-OPERATIVO',
      titulo: 'Nómina confirmada',
      descripcion:
        'La nómina mensual está confirmada. Para modificarla, será necesario reabrir el período en una fase posterior.',
      severidad: 'bloqueo',
      accionLabel: 'Consultar resultado guardado',
    });
  }

  if (errorEjecucion) {
    bloqueos.push({
      codigo: 'BLOQ-002',
      titulo: 'No fue posible cargar la información',
      descripcion: errorEjecucion ?? 'Reintenta la validación del período.',
      severidad: 'bloqueo',
      accionLabel: 'Generar nómina',
      accionLocal: 'validarPeriodo',
    });
  }

  if (!resultado && tieneBasePersistida) {
    informaciones.push({
      codigo: 'INFO-BASE-PERSISTIDA',
      titulo: 'Base de nómina generada',
      descripcion: 'La base del período está guardada. Puedes continuar con la revisión de trabajadores.',
      severidad: 'info',
    });
    return assembleValidacionCalculo({ bloqueos, advertencias, informaciones });
  }

  if (!resultado) {
    return assembleValidacionCalculo({
      bloqueos,
      advertencias,
      informaciones,
      estadoForzado: bloqueos.length ? 'bloqueado' : 'pendiente',
      razonDeshabilitado: bloqueos.length
        ? bloqueos[0].descripcion
        : 'Verifica el período para revisar trabajadores y datos del mes.',
      siguienteAccion: bloqueos.length
        ? {
            label: bloqueos[0].accionLabel ?? 'Verificar período',
            descripcion: bloqueos[0].descripcion,
            accionLocal: bloqueos[0].accionLocal,
          }
        : {
            label: 'Verificar período',
            descripcion:
              'Revisa trabajadores, parámetros, movimientos y recurrentes del período activo.',
            accionLocal: 'validarPeriodo',
          },
    });
  }

  const bloqueosResultado = asArray(resultado.bloqueos);
  const advertenciasResultado = asArray(resultado.advertencias);
  const parametrosGrupos = asArray(resultado.resumen?.parametrosGrupos);

  for (const bloqueo of bloqueosResultado) {
    bloqueos.push(itemDesdeMensaje(bloqueo, 'bloqueo'));
  }

  const faltantesMinimos = parametrosGrupos.filter((g) =>
    parametroMinimoBloqueante(g.id, g.clasificacion),
  );
  if (
    !resultado.resumen.parametrosOperativos &&
    faltantesMinimos.length > 0 &&
    !bloqueos.some((b) => b.codigo === 'BLOQ-004')
  ) {
    bloqueos.push({
      codigo: 'BLOQ-004',
      titulo: 'Parámetros del período pendientes',
      descripcion: 'Revisa la fila oficial, configuración cliente, vigencias, calendario o reconciliación antes de calcular.',
      severidad: 'bloqueo',
      accionLabel: 'Revisar parámetros',
      ruta: '/parametros',
    });
  }

  if (!preNomina && !tieneSnapshotPersistido) {
    bloqueos.push({
      codigo: 'BLOQ-005',
      titulo: 'Nómina mensual no generada',
      descripcion: 'Genera la nómina mensual para revisar trabajadores y entradas consideradas.',
      severidad: 'bloqueo',
      accionLabel: 'Generar nómina',
      accionLocal: 'generarBase',
    });
  } else if (preNomina && (base?.trabajadoresConsiderados ?? preNomina.trabajadoresIncluidos) === 0) {
    bloqueos.push({
      codigo: 'BLOQ-003',
      titulo: 'No hay trabajadores considerados',
      descripcion: 'La nómina mensual no tiene trabajadores para revisar.',
      severidad: 'bloqueo',
      accionLabel: 'Actualizar nómina',
      accionLocal: 'actualizarBase',
    });
  }

  if (base?.bloqueados && base.bloqueados > 0) {
    bloqueos.push({
      codigo: 'BLOQ-006',
      titulo: 'Hay trabajadores bloqueados',
      descripcion: 'Revisa los trabajadores bloqueados antes de confirmar.',
      severidad: 'bloqueo',
      accionLabel: 'Revisar trabajadores',
    });
  }

  for (const advertencia of advertenciasResultado) {
    if (!parametroMinimoBloqueanteDesdeCodigo(advertencia.codigo)) {
      advertencias.push(itemDesdeMensaje(advertencia, 'advertencia'));
    }
  }

  const resumenEntradas = resultado.resumen.resumenEntradasMensuales;
  const totalMovimientosMes =
    (resumenEntradas?.novedadesMensuales ?? 0) + (resumenEntradas?.legacyMovimientos ?? 0);
  if (totalMovimientosMes === 0) {
    advertencias.push({
      codigo: 'ADV-001',
      titulo: 'No hay movimientos del período registrados',
      descripcion: 'Puedes continuar si este período no requiere bonos, descuentos, anticipos o ajustes.',
      severidad: 'advertencia',
      accionLabel: 'Revisar movimientos',
      ruta: '/remuneraciones/novedades-mensuales',
    });
  }

  if (resultado.resumen.recurrentesAplicablesAlPeriodo === 0) {
    advertencias.push({
      codigo: 'ADV-002',
      titulo: 'No hay movimientos recurrentes activos',
      descripcion: 'Puedes continuar si no aplican movimientos recurrentes para este período.',
      severidad: 'advertencia',
      accionLabel: 'Revisar recurrentes',
      ruta: '/remuneraciones/haberes-descuentos',
    });
  }

  if (base?.conObservaciones && base.conObservaciones > 0) {
    advertencias.push({
      codigo: 'ADV-003',
      titulo: 'Hay trabajadores con observaciones',
      descripcion: 'Las observaciones no bloqueantes deben revisarse antes de guardar un resultado.',
      severidad: 'advertencia',
      accionLabel: 'Revisar trabajadores',
    });
  }

  const parametrosOpcionales = parametrosGrupos.filter((g) =>
    parametroOpcionalAdvertencia(g.id, g.clasificacion),
  );
  if (parametrosOpcionales.length > 0) {
    advertencias.push({
      codigo: 'ADV-004',
      titulo: 'Hay parámetros opcionales pendientes',
      descripcion: 'Puedes calcular preliminarmente; estos datos quedan para cierre o reconciliación.',
      severidad: 'advertencia',
      accionLabel: 'Revisar parámetros',
      ruta: '/parametros',
    });
  }

  if (preNomina) {
    informaciones.push({
      codigo: 'INFO-001',
      titulo: 'Base de nómina generada',
      descripcion: 'La base está disponible para revisar antes del cálculo preliminar.',
      severidad: 'info',
    });
  }
  if (resultado.resumen.parametrosOperativos && faltantesMinimos.length === 0) {
    informaciones.push({
      codigo: 'INFO-002',
      titulo: 'Parámetros del período operativos',
      descripcion: 'Los parámetros necesarios para el cálculo preliminar están disponibles.',
      severidad: 'info',
    });
  }
  if (totalMovimientosMes > 0) {
    informaciones.push({
      codigo: 'INFO-003',
      titulo: 'Movimientos del período cargados',
      descripcion: 'Hay movimientos de remuneración disponibles para la revisión del período.',
      severidad: 'info',
    });
  }
  if (resultado.resumen.recurrentesAplicablesAlPeriodo > 0) {
    informaciones.push({
      codigo: 'INFO-004',
      titulo: 'Movimientos recurrentes cargados',
      descripcion: 'Hay movimientos recurrentes vigentes considerados para el período.',
      severidad: 'info',
    });
  }

  return assembleValidacionCalculo({ bloqueos, advertencias, informaciones });
}

function assembleValidacionCalculo(input: {
  bloqueos: ValidacionOperativaItemView[];
  advertencias: ValidacionOperativaItemView[];
  informaciones: ValidacionOperativaItemView[];
  estadoForzado?: ValidacionCalculoEstado;
  razonDeshabilitado?: string;
  siguienteAccion?: ValidacionCalculoPreliminarView['siguienteAccion'];
}): ValidacionCalculoPreliminarView {
  const estado =
    input.estadoForzado ??
    (input.bloqueos.length > 0 ? 'bloqueado' : input.advertencias.length > 0 ? 'advertencias' : 'listo');
  const puedeCalcular = estado === 'listo' || estado === 'advertencias';
  const razonDeshabilitado = puedeCalcular
    ? undefined
    : (input.razonDeshabilitado ?? input.bloqueos[0]?.descripcion);
  return {
    estado,
    estadoLabel: etiquetaValidacionCalculo(estado),
    puedeCalcular,
    razonDeshabilitado,
    siguienteAccion: input.siguienteAccion ?? resolverSiguienteAccion(input.bloqueos, input.advertencias),
    bloqueos: input.bloqueos,
    advertencias: input.advertencias,
    informaciones: input.informaciones,
  };
}

function etiquetaValidacionCalculo(estado: ValidacionCalculoEstado): string {
  switch (estado) {
    case 'listo':
      return 'Listo para revisar nómina';
    case 'advertencias':
      return 'Con advertencias';
    case 'bloqueado':
      return 'Bloqueado';
    case 'pendiente':
    default:
      return 'Pendiente de validar';
  }
}

function resolverSiguienteAccion(
  bloqueos: readonly ValidacionOperativaItemView[],
  advertencias: readonly ValidacionOperativaItemView[],
): ValidacionCalculoPreliminarView['siguienteAccion'] {
  const prioridad = ['BLOQ-001', 'BLOQ-004', 'BLOQ-005', 'BLOQ-003', 'BLOQ-006'];
  const bloqueo =
    prioridad.map((codigo) => bloqueos.find((b) => b.codigo === codigo)).find((b): b is ValidacionOperativaItemView => !!b) ??
    bloqueos[0];
  if (bloqueo) {
    return {
      label: bloqueo.accionLabel ?? 'Resolver bloqueo',
      descripcion: bloqueo.descripcion,
      ruta: bloqueo.ruta,
      accionLocal: bloqueo.accionLocal,
    };
  }
  const advRequiereRevisionTrabajador = advertencias.some(
    (adv) => adv.codigo === 'ADV-003' || (adv.accionLabel ?? '').toLowerCase().includes('trabajador'),
  );
  if (advRequiereRevisionTrabajador) {
    return {
      label: 'Revisar trabajadores',
      descripcion: `La nómina mensual puede revisarse con ${advertencias.length} advertencia(s) no bloqueante(s).`,
      accionLocal: 'calcularPreliminar',
    };
  }
  const baseGenerada = !bloqueos.some((item) => item.codigo === 'BLOQ-005');
  return {
    label: baseGenerada ? 'Confirmar nómina' : 'Generar nómina',
    descripcion: baseGenerada
      ? 'La revisión del período está al día. Continúa hacia la confirmación de la nómina mensual.'
      : 'El período está listo para armar la nómina mensual del período.',
    accionLocal: baseGenerada ? 'confirmarNomina' : 'generarBase',
  };
}

function itemDesdeMensaje(
  mensaje: ProcesoMensualMensaje,
  severidad: ValidacionOperativaSeveridad,
): ValidacionOperativaItemView {
  const accion = accionArea(mensaje.area);
  return {
    codigo: mensaje.codigo,
    titulo: tituloMensajeOperativo(mensaje),
    descripcion: mensaje.texto,
    severidad,
    accionLabel: accion?.label,
    ruta: accion?.route,
  };
}

function tituloMensajeOperativo(mensaje: ProcesoMensualMensaje): string {
  if (mensaje.area === 'PARAMETROS') return 'Parámetros del período por revisar';
  if (mensaje.area === 'TRABAJADORES') return 'Trabajadores por revisar';
  if (mensaje.area === 'HABERES_RECURRENTES') return 'Movimientos recurrentes por revisar';
  if (mensaje.area === 'ENTRADAS_MENSUALES' || mensaje.area === 'MOVIMIENTOS_VARIABLES') {
    return 'Movimientos del periodo por revisar';
  }
  if (mensaje.area === 'CONCEPTOS') return 'Conceptos de remuneracion por revisar';
  return 'Nomina mensual por revisar';
}

function accionArea(area: ProcesoMensualArea): { label: string; route: string } | null {
  switch (area) {
    case 'PARAMETROS':
      return { label: 'Revisar parámetros', route: '/parametros' };
    case 'CONCEPTOS':
      return { label: 'Revisar conceptos', route: '/remuneraciones/conceptos' };
    case 'HABERES_RECURRENTES':
      return { label: 'Revisar recurrentes', route: '/remuneraciones/haberes-descuentos' };
    case 'ENTRADAS_MENSUALES':
    case 'MOVIMIENTOS_VARIABLES':
      return { label: 'Revisar movimientos', route: '/remuneraciones/novedades-mensuales' };
    case 'TRABAJADORES':
      return { label: 'Revisar trabajadores', route: '/empleados' };
    default:
      return null;
  }
}

const GRUPOS_PARAMETRO_OBLIGATORIO = new Set([
  'mensuales_uf_utm_sueldo',
  'topes_base',
  'catalogos_afp_impuesto',
]);

function parametroMinimoBloqueante(id: string, clasificacion: ClasificacionParametroGrupo): boolean {
  return GRUPOS_PARAMETRO_OBLIGATORIO.has(id) && (clasificacion === 'FALTANTE' || clasificacion === 'PARCIAL');
}

function parametroMinimoBloqueanteDesdeCodigo(codigo: string): boolean {
  return ['PARAM_MIN_mensuales_uf_utm_sueldo', 'PARAM_MIN_topes_base', 'PARAM_MIN_catalogos_afp_impuesto'].some(
    (prefix) => codigo.startsWith(prefix),
  );
}

function parametroOpcionalAdvertencia(id: string, clasificacion: ClasificacionParametroGrupo): boolean {
  return !parametroMinimoBloqueante(id, clasificacion) && (clasificacion === 'FALTANTE' || clasificacion === 'PARCIAL');
}
