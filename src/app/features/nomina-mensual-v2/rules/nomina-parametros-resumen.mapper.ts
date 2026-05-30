import type { ClasificacionParametroGrupo, ProcesoMensualGrupoParametro } from '../../nomina-mensual/models/proceso-mensual.model';
import type { ParametrosCompletitudResultado } from '../../parametros-generales/rules/parametros-completitud.rules';
import type {
  NominaParametrosResumen,
  ParametroResumenAcceso,
  ParametroResumenArea,
  ParametroResumenBloqueo,
  ParametroResumenEstado,
  ParametroResumenItem,
  ParametroResumenItemEstado,
  ParametrosMantenedorDestino,
} from '../models/nomina-parametros-resumen.models';

type BuildResumenInput = {
  periodo: string;
  gruposMinimos: ProcesoMensualGrupoParametro[];
  completitud?: ParametrosCompletitudResultado | null;
  ultimaActualizacion?: string | null;
};

const ACCESOS: ParametroResumenAcceso[] = [
  { id: 'datosOficiales', label: 'Datos oficiales', icono: 'trending-up', mantenedor: { area: 'datosOficiales', tab: 'valores' } },
  { id: 'afpSalud', label: 'AFP / Salud', icono: 'heart-pulse', mantenedor: { area: 'catalogosVigencias', tab: 'prevision' } },
  { id: 'ccafMutual', label: 'CCAF / Mutual', icono: 'users', mantenedor: { area: 'catalogosVigencias', tab: 'ccafMutual' } },
  { id: 'reglasCalculo', label: 'Reglas de cálculo', icono: 'calculator', mantenedor: { area: 'datosOficiales', tab: 'remuneraciones' } },
];

const GRUPO_LABELS: Record<string, string> = {
  mensuales_uf_utm_sueldo: 'UF / UTM / IPC',
  topes_base: 'Topes imponibles',
  catalogos_afp_impuesto: 'AFP e impuesto único',
  afc_catalogo: 'AFC',
  sis_fila_mensual: 'SIS / SANNA',
  salud_catalogo: 'Salud',
  mutualidad_ley16744_ccaf: 'CCAF / Mutual',
  reforma_previsional: 'Reforma previsional',
  parametros_generales_lectura: 'Lectura de parámetros',
};

const DETALLES: Record<string, string> = {
  sin_fila: 'No existe fila oficial para el período seleccionado.',
  topes_incompletos: 'Faltan topes base para cotizaciones.',
  afp_o_impuesto_vacio: 'Faltan registros de AFP o impuesto único.',
  sin_filas_afc: 'No hay parámetros AFC vigentes.',
  sis_null: 'Falta fila SIS mensual.',
  sin_isapre: 'No hay instituciones de salud vigentes.',
  sin_ley16744_ni_ccaf: 'No hay CCAF ni mutual configurada.',
  sin_reforma: 'No hay registro de reforma previsional.',
  lectura_fila_error: 'No fue posible leer la fila de parámetros.',
};

const CONFIG_CLIENTE_CHECKS: Array<{ label: string; pendiente: string }> = [
  { label: 'Configuración del período', pendiente: 'Falta configuracion cliente del periodo.' },
  { label: 'Gratificación', pendiente: 'Falta definir gratificacion.' },
  { label: 'IMM gratificación', pendiente: 'Falta IMM de gratificacion.' },
  { label: 'Descuentos por ausencias', pendiente: 'Falta metodo de descuento por ausencias.' },
  { label: 'CCAF', pendiente: 'Falta CCAF seleccionada.' },
  { label: 'Mutual Ley 16.744', pendiente: 'Falta mutual seleccionada.' },
];

export function buildNominaParametrosResumen(input: BuildResumenInput): NominaParametrosResumen {
  const grupos = indexarGrupos(input.gruposMinimos);
  const areas = buildAreas(grupos, input.completitud);
  const items = areas.flatMap((area) => area.items.map((item) => ({ ...item, area })));
  const completos = items.filter((item) => item.estado === 'ok').length;
  const bloqueos = items.filter((item) => item.estado === 'bloqueo').length;
  const requiereRevision = items.filter((item) => item.estado === 'revisar').length;
  const totalParametros = items.length;
  const seccionesTotales = areas.length;
  const seccionesListas = areas.filter((area) => area.estado === 'completo').length;
  const completitudSecciones =
    seccionesTotales === 0 ? 0 : Math.round((seccionesListas / seccionesTotales) * 100);
  const bloqueosActuales = buildBloqueos(areas);

  return {
    periodo: input.periodo,
    completitud: input.completitud?.porcentaje ?? completitudSecciones,
    completitudSecciones,
    seccionesTotales,
    seccionesListas,
    controlesTotales: totalParametros,
    controlesVerificados: completos,
    totalParametros,
    parametrosConfigurados: completos,
    bloqueos,
    requiereRevision,
    completos,
    puedeContinuar: bloqueos === 0,
    ultimaActualizacion: input.ultimaActualizacion ?? null,
    areas,
    bloqueosActuales,
    accesos: ACCESOS,
  };
}

function indexarGrupos(grupos: ProcesoMensualGrupoParametro[]): Map<string, ProcesoMensualGrupoParametro> {
  return new Map(grupos.map((grupo) => [grupo.id, grupo]));
}

function buildAreas(
  grupos: Map<string, ProcesoMensualGrupoParametro>,
  completitud?: ParametrosCompletitudResultado | null,
): ParametroResumenArea[] {
  return [
    createArea({
      id: 'configuracionCliente',
      titulo: 'Configuración cliente',
      descripcion: 'Gratificación · CCAF · Mutual · Reconciliación',
      icono: 'building-2',
      mantenedor: { area: 'configuracionCliente', tab: 'configCliente' },
      items: buildConfigClienteItems(completitud),
    }),
    createArea({
      id: 'datosOficiales',
      titulo: 'Datos oficiales',
      descripcion: 'UF · UTM · Sueldo mínimo · Topes imponibles',
      icono: 'trending-up',
      mantenedor: { area: 'datosOficiales', tab: 'valores' },
      items: [
        itemFromGrupo(grupos.get('mensuales_uf_utm_sueldo'), 'UF / UTM / sueldo mínimo'),
        itemFromGrupo(grupos.get('topes_base'), 'Topes imponibles'),
      ],
    }),
    createArea({
      id: 'catalogosPrevisionales',
      titulo: 'Catálogos previsionales',
      descripcion: 'AFP · Impuesto · Salud · CCAF / Mutual',
      icono: 'heart-pulse',
      mantenedor: { area: 'catalogosVigencias', tab: 'prevision' },
      items: [
        itemFromGrupo(grupos.get('catalogos_afp_impuesto'), 'AFP e impuesto único'),
        itemFromGrupo(grupos.get('salud_catalogo'), 'Salud'),
        itemFromGrupo(grupos.get('mutualidad_ley16744_ccaf'), 'CCAF / Mutual'),
      ],
    }),
    createArea({
      id: 'reglasCalculo',
      titulo: 'Reglas de cálculo',
      descripcion: 'AFC · SIS · Parámetros de remuneraciones',
      icono: 'calculator',
      mantenedor: { area: 'datosOficiales', tab: 'remuneraciones' },
      items: [
        itemFromGrupo(grupos.get('afc_catalogo'), 'AFC'),
        itemFromGrupo(grupos.get('sis_fila_mensual'), 'SIS mensual'),
      ],
    }),
    createArea({
      id: 'observacionNormativa',
      titulo: 'Observación normativa',
      descripcion: 'Reforma previsional · Trazabilidad',
      icono: 'file-text',
      mantenedor: { area: 'observacionNormativa', tab: 'reforma' },
      items: [
        itemFromGrupo(grupos.get('reforma_previsional'), 'Reforma previsional'),
        {
          label: 'Trazabilidad normativa',
          estado: completitud?.errores.length ? 'revisar' : 'ok',
          detalle: completitud?.errores[0],
        },
      ],
    }),
  ];
}

function buildConfigClienteItems(completitud?: ParametrosCompletitudResultado | null): ParametroResumenItem[] {
  const pendientes = completitud?.pendientes ?? [];
  const sinConfig = pendientes.includes('Falta configuracion cliente del periodo.');
  const operativosPendiente = pendientes.find((p) => p.startsWith('Falta configuracion cliente:'));

  const items: ParametroResumenItem[] = CONFIG_CLIENTE_CHECKS.map(({ label, pendiente }) => {
    if (pendientes.includes(pendiente)) {
      return { label, estado: 'revisar', detalle: pendiente };
    }
    if (sinConfig) {
      return { label, estado: 'pendiente' };
    }
    return { label, estado: 'ok' };
  });

  if (!sinConfig) {
    items.push(
      operativosPendiente
        ? { label: 'Valores operativos', estado: 'revisar', detalle: operativosPendiente }
        : { label: 'Valores operativos', estado: 'ok' },
    );
  }

  const consistencia = completitud?.grupos.consistencia;
  if (consistencia && consistencia.total > 0) {
    items.push({
      label: 'Reconciliación oficial/cliente',
      estado: consistencia.completo ? 'ok' : 'revisar',
      detalle: consistencia.completo
        ? undefined
        : (completitud?.advertencias.find((a) => a.includes('diferencias pendientes'))
          ?? 'Existen diferencias pendientes entre valores oficiales y configuración cliente.'),
    });
  }

  return items;
}

function createArea(input: Omit<ParametroResumenArea, 'estado'>): ParametroResumenArea {
  return {
    ...input,
    estado: worstEstado(input.items),
  };
}

function itemFromGrupo(grupo: ProcesoMensualGrupoParametro | undefined, fallbackLabel: string): ParametroResumenItem {
  if (!grupo) {
    return { label: fallbackLabel, estado: 'pendiente' };
  }
  return {
    label: GRUPO_LABELS[grupo.id] ?? fallbackLabel,
    estado: itemEstadoFromClasificacion(grupo.clasificacion),
    detalle: detalleGrupo(grupo),
  };
}

function itemEstadoFromClasificacion(clasificacion: ClasificacionParametroGrupo): ParametroResumenItemEstado {
  switch (clasificacion) {
    case 'OK':
      return 'ok';
    case 'FALTANTE':
      return 'bloqueo';
    case 'PARCIAL':
    case 'PENDIENTE_INTEGRACION':
      return 'revisar';
    case 'NO_APLICA_AUN':
      return 'pendiente';
  }
}

function estadoFromItem(estado: ParametroResumenItemEstado): ParametroResumenEstado {
  switch (estado) {
    case 'ok':
      return 'completo';
    case 'revisar':
      return 'requiereRevision';
    case 'bloqueo':
      return 'bloqueo';
    case 'pendiente':
      return 'pendiente';
  }
}

function worstEstado(items: ParametroResumenItem[]): ParametroResumenEstado {
  const estados = items.map((item) => estadoFromItem(item.estado));
  if (estados.includes('bloqueo')) return 'bloqueo';
  if (estados.includes('requiereRevision')) return 'requiereRevision';
  if (estados.includes('pendiente')) return 'pendiente';
  return 'completo';
}

function detalleGrupo(grupo: ProcesoMensualGrupoParametro): string | undefined {
  if (!grupo.detalle) return undefined;
  return DETALLES[grupo.detalle] ?? humanizeDetalle(grupo.detalle);
}

function humanizeDetalle(detalle: string): string {
  return detalle.replace(/_/g, ' ');
}

function buildBloqueos(areas: ParametroResumenArea[]): ParametroResumenBloqueo[] {
  return areas.flatMap((area) =>
    area.items
      .filter((item) => item.estado === 'bloqueo' || item.estado === 'revisar')
      .map((item, index): ParametroResumenBloqueo => ({
        id: `${area.id}-${index}-${item.label}`,
        severidad: item.estado === 'bloqueo' ? 'bloqueo' : 'revision',
        titulo: item.label,
        detalle: item.detalle ?? detalleGenerico(item.estado),
        areaId: area.id,
        mantenedor: area.mantenedor,
      })),
  ).slice(0, 5);
}

function detalleGenerico(estado: ParametroResumenItemEstado): string {
  switch (estado) {
    case 'bloqueo':
      return 'Falta completar este dato obligatorio para calcular la nómina.';
    case 'revisar':
      return 'Requiere revisión antes de continuar con el cálculo.';
    case 'pendiente':
      return 'Pendiente de validación.';
    case 'ok':
      return 'Listo.';
  }
}
