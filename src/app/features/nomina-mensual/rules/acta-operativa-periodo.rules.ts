import type {
  ActaOperativaDato,
  ActaOperativaEstado,
  ActaOperativaEvidencia,
  ActaOperativaPeriodoViewModel,
  ActaOperativaTone,
} from '../models/acta-operativa-periodo.model';

export interface BuildActaOperativaPeriodoInput {
  periodoLabel: string;
  periodoValido: boolean;
  tieneValidacionMinima: boolean;
  actaPreparadaEnSesion: boolean;
  estadoPeriodoLabel: string;
  parametrosLabel?: string | null;
  trabajadoresLabel?: string | null;
  movimientosLabel?: string | null;
  asignacionesLabel?: string | null;
  resultadoPreliminarLabel?: string | null;
  resultadoGuardado: boolean;
  bloqueos: string[];
  advertencias: string[];
  pendientes: string[];
}

export function buildActaOperativaPeriodoViewModel(input: BuildActaOperativaPeriodoInput): ActaOperativaPeriodoViewModel {
  const bloqueos = compactUnique(input.bloqueos);
  const advertencias = compactUnique(input.advertencias);
  const pendientes = compactUnique([...bloqueos, ...advertencias, ...input.pendientes]).slice(0, 4);
  const estado = resolveEstado(input, bloqueos, advertencias);
  const observaciones = compactUnique([...bloqueos, ...advertencias]);
  const modoCompacto = !input.tieneValidacionMinima && estado === 'BLOQUEADA';

  return {
    estado,
    modoCompacto,
    titulo: modoCompacto ? 'Acta operativa del período' : tituloEstado(estado),
    descripcion: modoCompacto
      ? 'Disponible después de validar el período. La evidencia se preparará cuando existan datos revisados.'
      : descripcionEstado(estado),
    notaCompacta: modoCompacto ? 'Primero valida el período para habilitar el respaldo operativo.' : undefined,
    periodoLabel: input.periodoLabel || 'No disponible en esta fase',
    estadoLabel: etiquetaEstado(estado),
    estadoTone: toneEstado(estado),
    accionLabel: estado === 'REQUIERE_REVISION' ? 'Preparar acta con revision' : 'Preparar acta para liquidaciones',
    accionDisponible: estado === 'REQUIERE_REVISION' || estado === 'LISTA',
    preparada: estado === 'PREPARADA',
    contexto: modoCompacto ? [] : buildContexto(input),
    decision: {
      titulo: modoCompacto ? 'Respaldo operativo' : 'Decision operativa',
      descripcion: modoCompacto
        ? 'El acta respalda la evidencia cuando el período ya fue revisado.'
        : decisionEstado(estado),
    },
    evidencia: modoCompacto ? [] : buildEvidencia(input, observaciones),
    pendientes: modoCompacto
      ? ['Primero valida el período para habilitar el respaldo operativo.']
      : pendientes.length
        ? pendientes
        : ['Sin pendientes visibles en esta revision.'],
    observaciones,
    alcance: estado === 'PREPARADA'
      ? 'Acta preparada en esta sesion. La generacion formal se implementara en Liquidaciones oficiales.'
      : 'Vista preparatoria sin persistencia formal en esta fase.',
  };
}

function resolveEstado(
  input: BuildActaOperativaPeriodoInput,
  bloqueos: string[],
  advertencias: string[],
): ActaOperativaEstado {
  if (input.actaPreparadaEnSesion) return 'PREPARADA';
  if (!input.periodoValido || !input.tieneValidacionMinima || bloqueos.length > 0) return 'BLOQUEADA';
  if (advertencias.length > 0 || input.pendientes.length > 0) return 'REQUIERE_REVISION';
  return 'LISTA';
}

function buildContexto(input: BuildActaOperativaPeriodoInput): ActaOperativaDato[] {
  return [
    { label: 'Periodo', valor: input.periodoLabel || 'No disponible en esta fase', estado: input.periodoValido ? 'listo' : 'pendiente' },
    { label: 'Estado periodo', valor: input.estadoPeriodoLabel || 'Pendiente de validacion', estado: input.tieneValidacionMinima ? 'listo' : 'pendiente' },
    { label: 'Parametros', valor: input.parametrosLabel || 'Pendiente de validacion', estado: estadoDato(input.parametrosLabel) },
    { label: 'Trabajadores', valor: input.trabajadoresLabel || 'Pendiente de validacion', estado: estadoDato(input.trabajadoresLabel) },
    { label: 'Movimientos', valor: input.movimientosLabel || 'No disponible en esta fase', estado: estadoDato(input.movimientosLabel) },
    { label: 'Asignaciones', valor: input.asignacionesLabel || 'Pendiente de validacion', estado: estadoDato(input.asignacionesLabel) },
    { label: 'Resultado preliminar', valor: input.resultadoPreliminarLabel || 'No disponible en esta fase', estado: input.resultadoGuardado ? 'listo' : 'pendiente' },
  ];
}

function buildEvidencia(input: BuildActaOperativaPeriodoInput, observaciones: string[]): ActaOperativaEvidencia[] {
  return [
    { label: 'Periodo revisado', detalle: input.periodoLabel || 'No disponible en esta fase', estado: input.periodoValido ? 'incluida' : 'pendiente' },
    { label: 'Estado de validaciones', detalle: input.estadoPeriodoLabel || 'Pendiente de validacion', estado: input.tieneValidacionMinima ? 'incluida' : 'pendiente' },
    { label: 'Resumen de trabajadores', detalle: input.trabajadoresLabel || 'Pendiente de validacion', estado: input.trabajadoresLabel ? 'incluida' : 'pendiente' },
    { label: 'Movimientos y asignaciones', detalle: `${input.movimientosLabel || 'No disponible en esta fase'} / ${input.asignacionesLabel || 'Pendiente de validacion'}`, estado: 'incluida' },
    {
      label: observaciones.length ? 'Observaciones pendientes' : 'Sin observaciones bloqueantes visibles',
      detalle: observaciones.length ? observaciones.slice(0, 2).join('; ') : undefined,
      estado: observaciones.length ? 'revision' : 'incluida',
    },
    {
      label: input.resultadoGuardado ? 'Resultado preliminar guardado' : 'Resultado preliminar pendiente',
      detalle: input.resultadoPreliminarLabel || undefined,
      estado: input.resultadoGuardado ? 'incluida' : 'pendiente',
    },
  ];
}

function estadoDato(value?: string | null): ActaOperativaDato['estado'] {
  if (!value) return 'pendiente';
  const normalizado = value.toLowerCase();
  if (normalizado.includes('revisar') || normalizado.includes('pendiente')) return 'revision';
  if (normalizado.includes('no disponible')) return 'no-disponible';
  return 'listo';
}

function tituloEstado(estado: ActaOperativaEstado): string {
  switch (estado) {
    case 'PREPARADA':
      return 'Acta preparada';
    case 'LISTA':
      return 'Lista para preparar acta';
    case 'REQUIERE_REVISION':
      return 'Preparar acta con observaciones';
    case 'BLOQUEADA':
    default:
      return 'Aun no se puede preparar el acta';
  }
}

function descripcionEstado(estado: ActaOperativaEstado): string {
  switch (estado) {
    case 'PREPARADA':
      return 'La evidencia operativa quedo preparada en esta sesion. La persistencia y consulta formal se implementaran en la fase de Liquidaciones oficiales.';
    case 'LISTA':
      return 'El periodo tiene contexto suficiente para preparar la evidencia que acompanara la generacion de liquidaciones oficiales.';
    case 'REQUIERE_REVISION':
      return 'El periodo tiene revisiones pendientes. Puedes dejar el acta preparada como respaldo operativo, indicando que liquidaciones debe revisar estas observaciones.';
    case 'BLOQUEADA':
    default:
      return 'Corrige los bloqueos críticos antes de preparar evidencia para liquidaciones.';
  }
}

function decisionEstado(estado: ActaOperativaEstado): string {
  switch (estado) {
    case 'PREPARADA':
      return 'El periodo ya cuenta con una evidencia visual preparada para continuar la revision en Liquidaciones oficiales.';
    case 'LISTA':
      return 'El periodo esta listo para preparar el respaldo operativo previo a liquidaciones.';
    case 'REQUIERE_REVISION':
      return 'El periodo puede avanzar con respaldo visual, pero las observaciones deben quedar visibles para revision.';
    case 'BLOQUEADA':
    default:
      return 'El periodo aun necesita validacion antes de preparar evidencia para liquidaciones.';
  }
}

function etiquetaEstado(estado: ActaOperativaEstado): string {
  switch (estado) {
    case 'PREPARADA':
      return 'Preparada';
    case 'LISTA':
      return 'Lista';
    case 'REQUIERE_REVISION':
      return 'Requiere revision';
    case 'BLOQUEADA':
    default:
      return 'Bloqueada';
  }
}

function toneEstado(estado: ActaOperativaEstado): ActaOperativaTone {
  switch (estado) {
    case 'PREPARADA':
      return 'success';
    case 'LISTA':
      return 'info';
    case 'REQUIERE_REVISION':
      return 'warning';
    case 'BLOQUEADA':
      return 'error';
    default:
      return 'neutral';
  }
}

function compactUnique(items: string[]): string[] {
  return items.map((item) => item.trim()).filter((item, index, all) => item.length > 0 && all.indexOf(item) === index);
}
