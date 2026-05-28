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

function asArray<T>(value: readonly T[] | null | undefined): T[] {
  return Array.isArray(value) ? [...value] : [];
}

function etiquetaRevisionAprobacion(estado: RevisionAprobacionEstado): string {
  switch (estado) {
    case 'aprobado':
      return 'Nómina revisada';
    case 'aprobado_desactualizado':
      return 'Confirmación desactualizada';
    case 'pendiente_guardado':
      return 'Pendiente de guardado';
    case 'pendiente_revision':
      return 'Lista para confirmar con advertencias';
    case 'actualizado_sin_guardar':
      return 'Resultado actualizado sin guardar';
    case 'no_apto':
      return 'Bloqueada para nómina';
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
      return 'La revisión de nómina está lista para la confirmación oficial.';
    case 'aprobado_desactualizado':
      return 'La confirmación anterior quedó desactualizada porque existe un resultado posterior. Guarda y confirma nuevamente el resultado actualizado.';
    case 'pendiente_guardado':
      return 'El resultado calculado debe guardarse antes de confirmar la nómina.';
    case 'pendiente_revision':
      return 'La version revisable esta lista para confirmacion de RRHH, con advertencias visibles.';
    case 'actualizado_sin_guardar':
      return 'Hay una revisión de nómina más reciente que la última guardada. Guarda la versión actual antes de confirmarla.';
    case 'no_apto':
      return 'Existen bloqueos que impiden confirmar este resultado.';
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
  return [
    {
      titulo: 'Nómina mensual revisada guardada',
      descripcion: input.hayGuardado
        ? 'Existe una versión revisable activa para este período.'
        : input.hayResultadoActual
          ? 'Guarda la revisión de la nómina para que quede disponible.'
          : 'Primero revisa y guarda una nómina mensual.',
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
      estado: input.bloqueos.length ? 'Requiere atencion' : input.hayGuardado ? 'Completo' : 'Pendiente',
    },
    {
      titulo: 'Advertencias visibles para decision RRHH',
      descripcion: input.advertencias.length
        ? 'Las advertencias quedan visibles para decidir si se corrigen o se aceptan operativamente.'
        : 'No hay advertencias pendientes en la version revisada.',
      estado: !input.hayGuardado ? 'Pendiente' : input.advertencias.length ? 'Requiere atencion' : 'Completo',
    },
    {
      titulo: 'Nómina revisada por RRHH',
      descripcion: input.tieneAprobacionOperativa
        ? 'RRHH registró la revisión interna para la nómina mensual.'
        : 'Pendiente de revisión interna por RRHH.',
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
  aprobacionVigente: boolean;
  nominaCerradaOperativamente: boolean;
  periodoValido: boolean;
}): string | undefined {
  if (input.aprobacionVigente) return 'La nómina mensual revisada ya está lista para confirmarse.';
  if (input.nominaCerradaOperativamente) {
    return 'La nómina del período está confirmada. Para modificarla, será necesario reabrir el período en una fase posterior.';
  }
  if (!input.periodoValido) return 'El periodo no es valido para confirmar la nómina.';
  if (!input.hayResultadoActual && !input.hayGuardado) return 'Primero revisa la nómina mensual.';
  if (!input.hayGuardado) return 'Primero guarda la nómina mensual revisada.';
  if (input.actualizadoSinGuardar) return 'Hay un resultado actualizado sin guardar.';
  if (input.bloqueos.length > 0) return 'Existen bloqueos operativos pendientes.';
  return undefined;
}

export function buildRevisionAprobacionView(input: BuildRevisionAprobacionInput): RevisionAprobacionView {
  const resultado = input.resultadoPreliminar;
  const validacion = input.validacionCalculo;
  const guardado = resultado.ultimoGuardado;
  const hayResultadoActual = input.hayResultadoActual;
  const hayGuardado = guardado != null;
  const actualizadoSinGuardar = resultado.estado === 'actualizado_sin_guardar';
  const resultadoBloqueos = asArray(resultado.bloqueos);
  const resultadoAdvertencias = asArray(resultado.advertencias);
  const resultadoInformaciones = asArray(resultado.informaciones);
  const validacionBloqueos = asArray(validacion.bloqueos);
  const validacionAdvertencias = asArray(validacion.advertencias);
  const validacionInformaciones = asArray(validacion.informaciones);
  const bloqueos = [
    ...resultadoBloqueos,
    ...validacionBloqueos.map((item) => observacionDesdeValidacion(item)),
  ];
  const advertencias = [
    ...resultadoAdvertencias,
    ...validacionAdvertencias.map((item) => observacionDesdeValidacion(item)),
  ];
  const informaciones: ResultadoObservacionView[] = [
    ...resultadoInformaciones,
    ...validacionInformaciones.map((item) => observacionDesdeValidacion(item)),
  ];

  let estado: RevisionAprobacionEstado;
  if ((hayResultadoActual || hayGuardado) && bloqueos.length > 0) {
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
      ? 'Guardar revisión actualizada'
      : hayGuardado
        ? 'Confirmar nómina'
        : 'Revisar trabajadores',
    puedeGuardarActualizado: resultado.acciones.puedeGuardarPreliminar,
    puedeRecalcular: resultado.acciones.puedeRecalcular,
    puedeAprobar: puedeAprobar && !aprobacionVigente,
    razonNoPuedeAprobar: razonNoPuedeAprobar({
      hayResultadoActual,
      hayGuardado,
      actualizadoSinGuardar,
      bloqueos,
      aprobacionVigente,
      nominaCerradaOperativamente: input.nominaCerradaOperativamente,
      periodoValido: input.periodoValido,
    }),
    aprobacion,
    notaAprobacion: 'Esta revisión interna queda como respaldo antes de confirmar la nómina y generar liquidaciones oficiales.',
  };
}
