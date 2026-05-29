import type { ChecklistItem, ChecklistStatus, SummaryMetric } from '../models/nomina-mensual-v2.models';
import type { FilaEmpleadoNomina } from './nomina-empleados-grid.presenter';

export type EstadoValidacionEmpleados = 'correcto' | 'advertencia' | 'bloqueado';

export type TipoPendienteEmpleado =
  | 'contrato'
  | 'pago'
  | 'documentacion'
  | 'centroCosto'
  | 'jornada'
  | 'observaciones';

export interface ResultadoValidacionEmpleados {
  estado: EstadoValidacionEmpleados;
  totalEmpleados: number;
  totalBloqueos: number;
  totalAdvertencias: number;
  mensajes: string[];
  puedeContinuar: boolean;
}

export interface ItemChecklistEmpleadoNomina extends ChecklistItem {
  tipoPendiente?: TipoPendienteEmpleado;
}

function contarPorPredicado(filas: FilaEmpleadoNomina[], predicado: (fila: FilaEmpleadoNomina) => boolean): number {
  return filas.filter(predicado).length;
}

function estadoChecklist(total: number, pendientes: number): ChecklistStatus {
  if (total === 0) return 'pending';
  if (pendientes === 0) return 'success';
  if (pendientes <= Math.max(1, Math.floor(total * 0.05))) return 'warning';
  return 'error';
}

export function filtrarEmpleadosConPendientes(
  filas: FilaEmpleadoNomina[],
  tipoPendiente: TipoPendienteEmpleado,
): FilaEmpleadoNomina[] {
  switch (tipoPendiente) {
    case 'contrato':
      return filas.filter((fila) => fila.contrato !== 'vigente');
    case 'pago':
      return filas.filter((fila) => fila.datosBancarios === 'pendiente');
    case 'documentacion':
      return filas.filter((fila) => fila.estadoNomina === 'pendiente');
    case 'observaciones':
      return filas.filter((fila) => fila.estadoNomina === 'observado');
    case 'centroCosto':
      return filas.filter((fila) => !fila.centroCosto.trim());
    case 'jornada':
      return filas.filter((fila) => !fila.jornada.trim());
  }
}

export function obtenerResultadoValidacionEmpleados(filas: FilaEmpleadoNomina[]): ResultadoValidacionEmpleados {
  const totalEmpleados = filas.length;
  const sinContrato = contarPorPredicado(filas, (fila) => fila.contrato !== 'vigente');
  const sinDatosBancarios = contarPorPredicado(filas, (fila) => fila.datosBancarios === 'pendiente');
  const documentacionIncompleta = contarPorPredicado(filas, (fila) => fila.estadoNomina === 'pendiente');
  const sinCentroCosto = contarPorPredicado(filas, (fila) => !fila.centroCosto.trim());
  const sinJornada = contarPorPredicado(filas, (fila) => !fila.jornada.trim());
  const observados = contarPorPredicado(filas, (fila) => fila.estadoNomina === 'observado');

  const totalBloqueos = sinContrato + sinDatosBancarios + documentacionIncompleta + sinCentroCosto + sinJornada;
  const totalAdvertencias = observados;
  const mensajes: string[] = [];

  if (sinContrato > 0) mensajes.push(`${sinContrato} trabajadores sin contrato vigente`);
  if (sinDatosBancarios > 0) mensajes.push(`${sinDatosBancarios} trabajadores sin datos bancarios`);
  if (documentacionIncompleta > 0) mensajes.push(`${documentacionIncompleta} trabajadores con documentación incompleta`);
  if (sinCentroCosto > 0) mensajes.push(`${sinCentroCosto} trabajadores sin centro de costo`);
  if (sinJornada > 0) mensajes.push(`${sinJornada} trabajadores sin jornada definida`);
  if (observados > 0) mensajes.push(`${observados} trabajadores con observaciones en nómina`);

  let estado: EstadoValidacionEmpleados = 'correcto';
  if (totalBloqueos > 0) {
    estado = 'bloqueado';
  } else if (totalAdvertencias > 0) {
    estado = 'advertencia';
  }

  return {
    estado,
    totalEmpleados,
    totalBloqueos,
    totalAdvertencias,
    mensajes,
    puedeContinuar: estado !== 'bloqueado',
  };
}

export function construirChecklistEmpleadosNomina(filas: FilaEmpleadoNomina[]): ItemChecklistEmpleadoNomina[] {
  const total = filas.length;
  const conContrato = contarPorPredicado(filas, (fila) => fila.contrato === 'vigente');
  const sinDatosBancarios = contarPorPredicado(filas, (fila) => fila.datosBancarios === 'pendiente');
  const conCentroCosto = contarPorPredicado(filas, (fila) => Boolean(fila.centroCosto.trim()));
  const conJornada = contarPorPredicado(filas, (fila) => Boolean(fila.jornada.trim()));
  const documentacionIncompleta = contarPorPredicado(filas, (fila) => fila.estadoNomina === 'pendiente');

  return [
    {
      id: 'contracts',
      title: 'Contratos activos',
      description: `${conContrato} de ${total} con contrato vigente`,
      status: estadoChecklist(total, total - conContrato),
      tipoPendiente: 'contrato',
    },
    {
      id: 'payment',
      title: 'Forma de pago',
      description:
        sinDatosBancarios === 0
          ? `${total} de ${total} con datos bancarios`
          : `${sinDatosBancarios} trabajador${sinDatosBancarios === 1 ? '' : 'es'} sin datos bancarios`,
      status: sinDatosBancarios === 0 ? 'success' : 'warning',
      tipoPendiente: 'pago',
    },
    {
      id: 'health',
      title: 'AFP/Salud asignada',
      description:
        documentacionIncompleta === 0
          ? `${total} de ${total} con asignación válida`
          : `${total - documentacionIncompleta} de ${total} con asignación válida`,
      status: documentacionIncompleta === 0 ? 'success' : 'warning',
      tipoPendiente: 'documentacion',
    },
    {
      id: 'costCenter',
      title: 'Centro de costo',
      description: `${conCentroCosto} de ${total} asignados`,
      status: estadoChecklist(total, total - conCentroCosto),
      tipoPendiente: 'centroCosto',
    },
    {
      id: 'schedule',
      title: 'Jornada',
      description: `${conJornada} de ${total} con jornada definida`,
      status: estadoChecklist(total, total - conJornada),
      tipoPendiente: 'jornada',
    },
  ];
}

export function construirMetricasEmpleadosNomina(filas: FilaEmpleadoNomina[]): SummaryMetric[] {
  const total = filas.length;
  const conContrato = contarPorPredicado(filas, (fila) => fila.contrato === 'vigente');
  const sinDatosBancarios = contarPorPredicado(filas, (fila) => fila.datosBancarios === 'pendiente');
  const documentacionIncompleta = contarPorPredicado(
    filas,
    (fila) => fila.estadoNomina === 'pendiente' || fila.estadoNomina === 'observado',
  );

  const pct = (valor: number) => (total > 0 ? `${((valor / total) * 100).toFixed(1).replace('.0', '')}% del total` : '0% del total');

  return [
    { id: 'active', label: 'Activos', value: total, helperText: 'Trabajadores activos', tone: 'green' },
    {
      id: 'contracts',
      label: 'Con contrato vigente',
      value: conContrato,
      helperText: pct(conContrato),
      tone: 'blue',
    },
    {
      id: 'bank',
      label: 'Datos bancarios pendientes',
      value: sinDatosBancarios,
      helperText: pct(sinDatosBancarios),
      tone: 'amber',
    },
    {
      id: 'docs',
      label: 'Documentación incompleta',
      value: documentacionIncompleta,
      helperText: pct(documentacionIncompleta),
      tone: 'red',
    },
  ];
}
