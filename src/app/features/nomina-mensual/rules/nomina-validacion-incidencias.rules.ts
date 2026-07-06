import type {
  EstadoDecisionIncidencia,
  IncidenciaNomina,
  ResumenValidacionNomina,
} from '../models/nomina-periodo.models';

export function incidenciaEstaPendiente(inc: IncidenciaNomina): boolean {
  return (inc.estadoDecision ?? 'pendiente') === 'pendiente';
}

export function incidenciaCriticaPendiente(inc: IncidenciaNomina): boolean {
  return inc.severidad === 'critica' && incidenciaEstaPendiente(inc);
}

export function advertenciaPendiente(inc: IncidenciaNomina): boolean {
  return inc.severidad === 'advertencia' && incidenciaEstaPendiente(inc);
}

export function etiquetaEstadoDecisionIncidencia(
  estado: EstadoDecisionIncidencia,
): string {
  switch (estado) {
    case 'pendiente':
      return 'Pendiente';
    case 'resuelta':
      return 'Resuelta';
    case 'aceptada_justificada':
      return 'Aceptada con justificación';
  }
}

export function evaluarPuedeValidarNomina(input: {
  estado: string;
  calculoVigente: boolean;
  incidencias: IncidenciaNomina[];
}): boolean {
  if (input.estado !== 'calculada' || !input.calculoVigente) {
    return false;
  }
  return !input.incidencias.some(
    (inc) => incidenciaCriticaPendiente(inc) || advertenciaPendiente(inc),
  );
}

export function construirResumenValidacionDesdeIncidencias(input: {
  totalTrabajadores: number;
  estado: string;
  calculoVigente: boolean;
  incidencias: IncidenciaNomina[];
  conMovimientosEspeciales: number;
}): Pick<
  ResumenValidacionNomina,
  | 'conIncidenciasCriticas'
  | 'conAdvertencias'
  | 'advertenciasPendientes'
  | 'listosParaCalculo'
  | 'puedeCalcular'
  | 'puedeValidar'
  | 'puedeCerrar'
  | 'incidenciasCriticas'
  | 'advertencias'
> {
  const incidenciasCriticas = input.incidencias.filter((i) => i.severidad === 'critica');
  const advertencias = input.incidencias.filter((i) => i.severidad === 'advertencia');
  const criticasPendientes = incidenciasCriticas.filter(incidenciaCriticaPendiente);
  const advertenciasPendientes = advertencias.filter(advertenciaPendiente);

  const trabajadoresCriticos = new Set(
    criticasPendientes.map((i) => i.trabajadorId).filter((id): id is string => !!id),
  );
  const trabajadoresAdvertencia = new Set(
    advertencias.map((i) => i.trabajadorId).filter((id): id is string => !!id),
  );

  const hayBloqueante = input.incidencias.some((i) => i.bloqueante && incidenciaEstaPendiente(i));
  const puedeValidar = evaluarPuedeValidarNomina({
    estado: input.estado,
    calculoVigente: input.calculoVigente,
    incidencias: input.incidencias,
  });

  return {
    conIncidenciasCriticas: trabajadoresCriticos.size,
    conAdvertencias: trabajadoresAdvertencia.size,
    advertenciasPendientes: advertenciasPendientes.length,
    listosParaCalculo: input.totalTrabajadores - trabajadoresCriticos.size,
    puedeCalcular: !hayBloqueante,
    puedeValidar,
    puedeCerrar:
      !hayBloqueante
      && input.calculoVigente
      && (input.estado === 'validada' || input.estado === 'aprobada'),
    incidenciasCriticas,
    advertencias,
  };
}
