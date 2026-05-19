import type {
  AprobacionOperativaRegistroView,
  ResultadoObservacionView,
  ResultadoPreliminarView,
  RevisionAprobacionChecklistItemView,
  RevisionAprobacionEstado,
  RevisionAprobacionView,
  ValidacionCalculoPreliminarView,
  ValidacionOperativaItemView,
} from '../containers/proceso-mensual-container/models/proceso-mensual-container.vm';

export interface BuildRevisionAprobacionInput {
  resultadoPreliminar: ResultadoPreliminarView;
  validacionCalculo: ValidacionCalculoPreliminarView;
  hayResultadoActual: boolean;
  snapshotHash: string | null;
  aprobacionOperativa: AprobacionOperativaRegistroView | null;
  guardandoSnapshot: boolean;
  aprobandoResultado: boolean;
  nominaCerradaOperativamente: boolean;
  periodoValido: boolean;
}

function observacionDesdeValidacion(item: ValidacionOperativaItemView): ResultadoObservacionView {
  return {
    codigo: item.codigo,
    titulo: item.titulo,
    descripcion: item.descripcion,
    accionLabel: item.accionLabel,
    ruta: item.ruta,
  };
}

function etiquetaRevisionAprobacion(estado: RevisionAprobacionEstado): string {
  switch (estado) {
    case 'aprobado':
      return 'Aprobado operativamente';
    case 'aprobado_desactualizado':
      return 'Aprobacion desactualizada';
    case 'pendiente_guardado':
      return 'Pendiente de guardado';
    case 'pendiente_revision':
      return 'Lista para confirmar con advertencias';
    case 'actualizado_sin_guardar':
      return 'Resultado actualizado sin guardar';
    case 'no_apto':
      return 'No apto para aprobacion';
    case 'listo':
      return 'Lista para confirmar';
    case 'sin_resultado_guardado':
    default:
      return 'Sin resultado guardado';
  }
}

function descripcionRevisionAprobacion(estado: RevisionAprobacionEstado): string {
  switch (estado) {
    case 'aprobado':
      return 'Revision de nomina confirmada.';
    case 'aprobado_desactualizado':
      return 'La aprobacion operativa anterior quedo desactualizada porque existe un resultado posterior. Guarda y aprueba nuevamente el resultado actualizado.';
    case 'pendiente_guardado':
      return 'El resultado calculado debe guardarse antes de revisarlo para aprobacion.';
    case 'pendiente_revision':
      return 'La version revisable esta lista para confirmacion de RRHH, con advertencias visibles.';
    case 'actualizado_sin_guardar':
      return 'Hay un calculo preliminar mas reciente que el ultimo guardado. Guarda la version actual antes de revisarla.';
    case 'no_apto':
      return 'Existen bloqueos que impiden aprobar operativamente este resultado.';
    case 'listo':
      return 'La version revisable esta lista para confirmacion de RRHH.';
    case 'sin_resultado_guardado':
    default:
      return 'Guarda una version revisable antes de confirmar la nomina.';
  }
}

function checklistRevisionAprobacion(input: {
  hayGuardado: boolean;
  guardado: ResultadoPreliminarView['ultimoGuardado'];
  actualizadoSinGuardar: boolean;
  hayResultadoActual: boolean;
  bloqueos: ResultadoObservacionView[];
  advertencias: ResultadoObservacionView[];
  tieneAprobacionOperativa: boolean;
}): RevisionAprobacionChecklistItemView[] {
  const totalCalculados = input.guardado?.trabajadoresCalculados ?? 0;
  const omitidos = input.guardado?.trabajadoresOmitidos ?? 0;
  return [
    {
      titulo: 'Resultado preliminar guardado',
      descripcion: input.hayGuardado
        ? 'Existe una version preliminar activa para este periodo.'
        : input.hayResultadoActual
          ? 'Guarda el calculo preliminar para que quede disponible para revision.'
          : 'Primero calcula y guarda un resultado preliminar.',
      estado: input.hayGuardado ? 'Completo' : 'Pendiente',
    },
    {
      titulo: 'Resultado guardado vigente',
      descripcion: input.actualizadoSinGuardar
        ? 'El calculo actual es mas reciente que la version guardada.'
        : input.hayGuardado
          ? 'La version guardada coincide con el ultimo resultado disponible.'
          : 'Se evaluara despues del guardado.',
      estado: !input.hayGuardado ? 'Pendiente' : input.actualizadoSinGuardar ? 'Requiere atencion' : 'Completo',
    },
    {
      titulo: 'Trabajadores calculados revisables',
      descripcion: input.hayGuardado
        ? `${totalCalculados} trabajador(es) calculado(s) en el resultado guardado.`
        : 'Aun no hay trabajadores guardados para revisar.',
      estado: !input.hayGuardado ? 'Pendiente' : totalCalculados > 0 ? 'Completo' : 'Requiere atencion',
    },
    {
      titulo: 'Sin bloqueos operativos',
      descripcion: input.bloqueos.length
        ? 'Hay bloqueos que requieren correccion antes de avanzar.'
        : 'No hay bloqueos visibles en la revision operativa.',
      estado: input.bloqueos.length || omitidos > 0 ? 'Requiere atencion' : input.hayGuardado ? 'Completo' : 'Pendiente',
    },
    {
      titulo: 'Advertencias visibles para decision RRHH',
      descripcion: input.advertencias.length
        ? 'Las advertencias quedan visibles para decidir si se corrigen o se aceptan operativamente.'
        : 'No hay advertencias pendientes en la version revisada.',
      estado: !input.hayGuardado ? 'Pendiente' : input.advertencias.length ? 'Requiere atencion' : 'Completo',
    },
    {
      titulo: 'Resultado aprobado operativamente',
      descripcion: input.tieneAprobacionOperativa
        ? 'RRHH registro una aprobacion operativa interna para el resultado preliminar.'
        : 'Pendiente de aprobacion operativa interna por RRHH.',
      estado: input.tieneAprobacionOperativa ? 'Completo' : input.hayGuardado ? 'Pendiente' : 'No aplica',
    },
    {
      titulo: 'Acciones legales pendientes para fase posterior',
      descripcion: 'Liquidaciones oficiales, cierre, Previred, LRE y bancos no se ejecutan en esta revision.',
      estado: 'No aplica',
    },
  ];
}

function razonNoPuedeAprobar(input: {
  hayResultadoActual: boolean;
  hayGuardado: boolean;
  actualizadoSinGuardar: boolean;
  bloqueos: ResultadoObservacionView[];
  omitidos: number;
  aprobacionVigente: boolean;
  nominaCerradaOperativamente: boolean;
  periodoValido: boolean;
}): string | undefined {
  if (input.aprobacionVigente) return 'El resultado preliminar guardado ya esta aprobado operativamente.';
  if (input.nominaCerradaOperativamente) {
    return 'La nómina del período está cerrada. Para modificarla, será necesario reabrir el período en una fase posterior.';
  }
  if (!input.periodoValido) return 'El periodo no es valido para aprobacion operativa.';
  if (!input.hayResultadoActual && !input.hayGuardado) return 'Primero calcula el resultado preliminar.';
  if (!input.hayGuardado) return 'Primero guarda el resultado preliminar.';
  if (input.actualizadoSinGuardar) return 'Hay un resultado actualizado sin guardar.';
  if (input.bloqueos.length > 0 || input.omitidos > 0) return 'Existen bloqueos operativos pendientes.';
  return undefined;
}

export function buildRevisionAprobacionView(input: BuildRevisionAprobacionInput): RevisionAprobacionView {
  const resultado = input.resultadoPreliminar;
  const validacion = input.validacionCalculo;
  const guardado = resultado.ultimoGuardado;
  const hayResultadoActual = input.hayResultadoActual;
  const hayGuardado = guardado != null;
  const actualizadoSinGuardar = resultado.estado === 'actualizado_sin_guardar';
  const bloqueos = [
    ...resultado.bloqueos,
    ...validacion.bloqueos.map((item) => observacionDesdeValidacion(item)),
  ];
  const advertencias = [
    ...resultado.advertencias,
    ...validacion.advertencias.map((item) => observacionDesdeValidacion(item)),
  ];
  const informaciones: ResultadoObservacionView[] = [
    ...resultado.informaciones,
    ...validacion.informaciones.map((item) => observacionDesdeValidacion(item)),
  ];

  let estado: RevisionAprobacionEstado;
  if ((hayResultadoActual || hayGuardado) && (bloqueos.length > 0 || (guardado?.trabajadoresOmitidos ?? 0) > 0)) {
    estado = 'no_apto';
  } else if (!hayGuardado) {
    estado = hayResultadoActual ? 'pendiente_guardado' : 'sin_resultado_guardado';
  } else if (actualizadoSinGuardar) {
    estado = 'actualizado_sin_guardar';
  } else if (advertencias.length > 0 || (guardado?.trabajadoresConObservaciones ?? 0) > 0) {
    estado = 'pendiente_revision';
  } else {
    estado = 'listo';
  }

  const aprobacion = input.aprobacionOperativa;
  const aprobacionVigente =
    !!aprobacion &&
    hayGuardado &&
    !actualizadoSinGuardar &&
    aprobacion.identificadorResultado === (input.snapshotHash ?? null);
  if (aprobacion) {
    estado = aprobacionVigente ? 'aprobado' : 'aprobado_desactualizado';
  }

  const puedeAprobar =
    hayGuardado &&
    !actualizadoSinGuardar &&
    bloqueos.length === 0 &&
    (guardado?.trabajadoresOmitidos ?? 0) === 0 &&
    input.periodoValido &&
    !input.guardandoSnapshot &&
    !input.aprobandoResultado &&
    !input.nominaCerradaOperativamente;

  return {
    estado,
    estadoLabel: etiquetaRevisionAprobacion(estado),
    descripcion: descripcionRevisionAprobacion(estado),
    checklist: checklistRevisionAprobacion({
      hayGuardado,
      guardado,
      actualizadoSinGuardar,
      hayResultadoActual,
      bloqueos,
      advertencias,
      tieneAprobacionOperativa: !!aprobacion,
    }),
    bloqueos,
    advertencias,
    informaciones,
    accionPrincipalLabel: actualizadoSinGuardar || estado === 'pendiente_guardado'
      ? 'Guardar resultado actualizado'
      : hayGuardado
        ? 'Revisar resultado guardado'
        : 'Calcular preliminar',
    puedeGuardarActualizado: resultado.acciones.puedeGuardarPreliminar,
    puedeRecalcular: resultado.acciones.puedeRecalcular,
    puedeAprobar: puedeAprobar && !aprobacionVigente,
    razonNoPuedeAprobar: razonNoPuedeAprobar({
      hayResultadoActual,
      hayGuardado,
      actualizadoSinGuardar,
      bloqueos,
      omitidos: guardado?.trabajadoresOmitidos ?? 0,
      aprobacionVigente,
      nominaCerradaOperativamente: input.nominaCerradaOperativamente,
      periodoValido: input.periodoValido,
    }),
    aprobacion,
    notaAprobacion: 'Esta aprobación es interna y no reemplaza el cierre del período ni la emisión de liquidaciones oficiales.',
  };
}
