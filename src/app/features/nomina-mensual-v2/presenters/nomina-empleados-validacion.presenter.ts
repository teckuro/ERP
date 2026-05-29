import type { MessageBoxSection } from '../../../shared/components/ui/feedback/message-box/message-box.types';
import type { ChecklistItem, ChecklistStatus, SummaryMetric } from '../models/nomina-mensual-v2.models';
import type { FilaEmpleadoNomina } from './nomina-empleados-grid.presenter';

export type EstadoValidacionEmpleados = 'correcto' | 'advertencia' | 'bloqueado';

export type TipoPendienteEmpleado =
  | 'contrato'
  | 'pago'
  | 'documentacion'
  | 'afpSalud'
  | 'centroCosto'
  | 'jornada'
  | 'observaciones';

export interface ResumenEmpleadosNomina {
  totalActivos: number;
  conContratoVigente: number;
  sinContratoVigente: number;
  conDatosBancariosPendientes: number;
  conDocumentacionIncompleta: number;
  conObservaciones: number;
  conAfpSaludIncompleta: number;
  conCentroCostoAsignado: number;
  sinCentroCosto: number;
  conJornadaDefinida: number;
  sinJornada: number;
}

export interface ResultadoValidacionEmpleados {
  estado: EstadoValidacionEmpleados;
  totalEmpleados: number;
  totalBloqueos: number;
  totalAdvertencias: number;
  mensajes: string[];
  mensajesBloqueo: string[];
  mensajesAdvertencia: string[];
  puedeContinuar: boolean;
}

export type SeveridadChecklistEmpleados = 'correcto' | 'advertencia' | 'bloqueante';

export interface ItemChecklistEmpleadoNomina extends ChecklistItem {
  tipoPendiente?: TipoPendienteEmpleado;
  severidad: SeveridadChecklistEmpleados;
  etiquetaSeveridad: string;
  esAccionable: boolean;
  cantidadPendiente: number;
  total: number;
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

function etiquetaSeveridadChecklist(severidad: SeveridadChecklistEmpleados): string {
  switch (severidad) {
    case 'correcto':
      return 'Correcto';
    case 'advertencia':
      return 'Advertencia';
    case 'bloqueante':
      return 'Bloqueante';
  }
}

function severidadDesdePendientes(esBloqueante: boolean, pendientes: number): SeveridadChecklistEmpleados {
  if (pendientes === 0) return 'correcto';
  return esBloqueante ? 'bloqueante' : 'advertencia';
}

function crearItemChecklistEmpleado(
  id: string,
  title: string,
  description: string,
  tipoPendiente: TipoPendienteEmpleado,
  cantidadPendiente: number,
  total: number,
  esBloqueante: boolean,
): ItemChecklistEmpleadoNomina {
  const severidad = severidadDesdePendientes(esBloqueante, cantidadPendiente);

  return {
    id,
    title,
    description,
    status: severidad === 'correcto' ? 'success' : severidad === 'advertencia' ? 'warning' : 'error',
    tipoPendiente,
    severidad,
    etiquetaSeveridad: etiquetaSeveridadChecklist(severidad),
    esAccionable: cantidadPendiente > 0,
    cantidadPendiente,
    total,
  };
}

export function obtenerEtiquetaFiltroChecklistEmpleados(tipoPendiente: TipoPendienteEmpleado): string {
  switch (tipoPendiente) {
    case 'contrato':
      return 'Contratos pendientes';
    case 'pago':
      return 'Forma de pago pendiente';
    case 'documentacion':
      return 'Documentación incompleta';
    case 'afpSalud':
      return 'AFP/Salud pendiente';
    case 'centroCosto':
      return 'Centro de costo pendiente';
    case 'jornada':
      return 'Jornada pendiente';
    case 'observaciones':
      return 'Observaciones en nómina';
  }
}

export function obtenerPrimerTipoPendienteBloqueante(filas: FilaEmpleadoNomina[]): TipoPendienteEmpleado | null {
  const resumen = obtenerResumenEmpleadosNomina(filas);
  if (resumen.sinContratoVigente > 0) return 'contrato';
  if (resumen.conDatosBancariosPendientes > 0) return 'pago';
  if (resumen.conAfpSaludIncompleta > 0) return 'afpSalud';
  if (resumen.sinCentroCosto > 0) return 'centroCosto';
  if (resumen.sinJornada > 0) return 'jornada';
  return null;
}

export function obtenerTextoSuperiorEmpleados(filas: FilaEmpleadoNomina[]): string | null {
  const resultado = obtenerResultadoValidacionEmpleados(filas);
  if (resultado.estado === 'bloqueado') {
    return 'Hay trabajadores con datos obligatorios pendientes. Corrígelos desde la grilla o usa el checklist para filtrarlos.';
  }
  if (resultado.estado === 'advertencia') {
    return 'Hay observaciones en empleados. Revísalas desde la grilla o continúa bajo tu responsabilidad.';
  }
  if (resultado.totalEmpleados > 0) {
    return 'La base de empleados está lista para avanzar al registro de novedades.';
  }
  return null;
}

function formatearPorcentaje(valor: number, total: number): string {
  if (total <= 0) return '0% del total';
  return `${((valor / total) * 100).toFixed(1).replace('.0', '')}% del total`;
}

export function obtenerResumenEmpleadosNomina(filas: FilaEmpleadoNomina[]): ResumenEmpleadosNomina {
  const totalActivos = filas.length;
  const conContratoVigente = contarPorPredicado(filas, (fila) => fila.contrato === 'vigente');
  const conDatosBancariosPendientes = contarPorPredicado(filas, (fila) => fila.datosBancarios === 'pendiente');
  const conDocumentacionIncompleta = contarPorPredicado(filas, (fila) => fila.estadoNomina === 'pendiente');
  const conObservaciones = contarPorPredicado(filas, (fila) => fila.estadoNomina === 'observado');
  const conAfpSaludIncompleta = contarPorPredicado(filas, (fila) => !fila.afpSaludAsignada);
  const conCentroCostoAsignado = contarPorPredicado(filas, (fila) => Boolean(fila.centroCosto.trim()));
  const conJornadaDefinida = contarPorPredicado(filas, (fila) => Boolean(fila.jornada.trim()));

  return {
    totalActivos,
    conContratoVigente,
    sinContratoVigente: totalActivos - conContratoVigente,
    conDatosBancariosPendientes,
    conDocumentacionIncompleta,
    conObservaciones,
    conAfpSaludIncompleta,
    conCentroCostoAsignado,
    sinCentroCosto: totalActivos - conCentroCostoAsignado,
    conJornadaDefinida,
    sinJornada: totalActivos - conJornadaDefinida,
  };
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
    case 'afpSalud':
      return filas.filter((fila) => !fila.afpSaludAsignada);
    case 'observaciones':
      return filas.filter((fila) => fila.estadoNomina === 'observado');
    case 'centroCosto':
      return filas.filter((fila) => !fila.centroCosto.trim());
    case 'jornada':
      return filas.filter((fila) => !fila.jornada.trim());
  }
}

export function obtenerResultadoValidacionEmpleados(filas: FilaEmpleadoNomina[]): ResultadoValidacionEmpleados {
  const resumen = obtenerResumenEmpleadosNomina(filas);
  const mensajesBloqueo: string[] = [];
  const mensajesAdvertencia: string[] = [];

  if (resumen.totalActivos === 0) {
    mensajesBloqueo.push('No hay trabajadores activos para el período seleccionado.');
  }
  if (resumen.sinContratoVigente > 0) {
    mensajesBloqueo.push(`${resumen.sinContratoVigente} trabajador${resumen.sinContratoVigente === 1 ? '' : 'es'} sin contrato vigente.`);
  }
  if (resumen.conDatosBancariosPendientes > 0) {
    mensajesBloqueo.push(
      `${resumen.conDatosBancariosPendientes} trabajador${resumen.conDatosBancariosPendientes === 1 ? '' : 'es'} sin datos bancarios.`,
    );
  }
  if (resumen.conAfpSaludIncompleta > 0) {
    mensajesBloqueo.push(
      `${resumen.conAfpSaludIncompleta} trabajador${resumen.conAfpSaludIncompleta === 1 ? '' : 'es'} sin AFP/Salud asignada.`,
    );
  }
  if (resumen.sinCentroCosto > 0) {
    mensajesBloqueo.push(`${resumen.sinCentroCosto} trabajador${resumen.sinCentroCosto === 1 ? '' : 'es'} sin centro de costo.`);
  }
  if (resumen.sinJornada > 0) {
    mensajesBloqueo.push(`${resumen.sinJornada} trabajador${resumen.sinJornada === 1 ? '' : 'es'} sin jornada definida.`);
  }
  if (resumen.conDocumentacionIncompleta > 0) {
    mensajesAdvertencia.push(
      `${resumen.conDocumentacionIncompleta} trabajador${resumen.conDocumentacionIncompleta === 1 ? '' : 'es'} con documentación incompleta.`,
    );
  }
  if (resumen.conObservaciones > 0) {
    mensajesAdvertencia.push(
      `${resumen.conObservaciones} trabajador${resumen.conObservaciones === 1 ? '' : 'es'} con observaciones en nómina.`,
    );
  }

  const totalBloqueos = mensajesBloqueo.length;
  const totalAdvertencias = mensajesAdvertencia.length;
  let estado: EstadoValidacionEmpleados = 'correcto';

  if (totalBloqueos > 0) {
    estado = 'bloqueado';
  } else if (totalAdvertencias > 0) {
    estado = 'advertencia';
  }

  return {
    estado,
    totalEmpleados: resumen.totalActivos,
    totalBloqueos,
    totalAdvertencias,
    mensajes: [...mensajesBloqueo, ...mensajesAdvertencia],
    mensajesBloqueo,
    mensajesAdvertencia,
    puedeContinuar: estado !== 'bloqueado',
  };
}

export function construirChecklistEmpleadosNomina(filas: FilaEmpleadoNomina[]): ItemChecklistEmpleadoNomina[] {
  const resumen = obtenerResumenEmpleadosNomina(filas);
  const total = resumen.totalActivos;
  const conAfpSalud = total - resumen.conAfpSaludIncompleta;

  const items: ItemChecklistEmpleadoNomina[] = [
    crearItemChecklistEmpleado(
      'contracts',
      'Contratos activos',
      `${resumen.conContratoVigente} de ${total} con contrato vigente`,
      'contrato',
      resumen.sinContratoVigente,
      total,
      true,
    ),
    crearItemChecklistEmpleado(
      'payment',
      'Forma de pago',
      resumen.conDatosBancariosPendientes === 0
        ? `${total} de ${total} con datos bancarios`
        : `${resumen.conDatosBancariosPendientes} trabajador${resumen.conDatosBancariosPendientes === 1 ? '' : 'es'} sin datos bancarios`,
      'pago',
      resumen.conDatosBancariosPendientes,
      total,
      true,
    ),
    crearItemChecklistEmpleado(
      'health',
      'AFP/Salud asignada',
      resumen.conAfpSaludIncompleta === 0
        ? `${total} de ${total} con asignación válida`
        : `${conAfpSalud} de ${total} con asignación válida`,
      'afpSalud',
      resumen.conAfpSaludIncompleta,
      total,
      true,
    ),
    crearItemChecklistEmpleado(
      'costCenter',
      'Centro de costo',
      `${resumen.conCentroCostoAsignado} de ${total} asignados`,
      'centroCosto',
      resumen.sinCentroCosto,
      total,
      true,
    ),
    crearItemChecklistEmpleado(
      'schedule',
      'Jornada',
      `${resumen.conJornadaDefinida} de ${total} con jornada definida`,
      'jornada',
      resumen.sinJornada,
      total,
      true,
    ),
  ];

  if (resumen.conDocumentacionIncompleta > 0) {
    items.push(
      crearItemChecklistEmpleado(
        'documentation',
        'Documentación incompleta',
        `${resumen.conDocumentacionIncompleta} trabajador${resumen.conDocumentacionIncompleta === 1 ? '' : 'es'} con documentación incompleta`,
        'documentacion',
        resumen.conDocumentacionIncompleta,
        total,
        false,
      ),
    );
  }

  if (resumen.conObservaciones > 0) {
    items.push(
      crearItemChecklistEmpleado(
        'observations',
        'Observaciones en nómina',
        `${resumen.conObservaciones} trabajador${resumen.conObservaciones === 1 ? '' : 'es'} con observaciones`,
        'observaciones',
        resumen.conObservaciones,
        total,
        false,
      ),
    );
  }

  return items;
}

export function construirMetricasEmpleadosNomina(filas: FilaEmpleadoNomina[]): SummaryMetric[] {
  const resumen = obtenerResumenEmpleadosNomina(filas);
  const total = resumen.totalActivos;

  return [
    { id: 'active', label: 'Activos', value: total, helperText: 'Trabajadores activos', tone: 'green' },
    {
      id: 'contracts',
      label: 'Con contrato vigente',
      value: resumen.conContratoVigente,
      helperText: formatearPorcentaje(resumen.conContratoVigente, total),
      tone: 'blue',
    },
    {
      id: 'bank',
      label: 'Datos bancarios pendientes',
      value: resumen.conDatosBancariosPendientes,
      helperText: formatearPorcentaje(resumen.conDatosBancariosPendientes, total),
      tone: 'amber',
    },
    {
      id: 'docs',
      label: 'Documentación incompleta',
      value: resumen.conDocumentacionIncompleta,
      helperText: formatearPorcentaje(resumen.conDocumentacionIncompleta, total),
      tone: 'red',
    },
  ];
}

export function construirSeccionesMsgBoxBloqueoEmpleados(resultado: ResultadoValidacionEmpleados): MessageBoxSection[] {
  const secciones: MessageBoxSection[] = [];

  if (resultado.mensajesBloqueo.length > 0) {
    secciones.push({
      title: 'Pendientes detectados',
      items: resultado.mensajesBloqueo,
      tone: 'attention',
    });
  }

  secciones.push({
    title: 'Qué revisar',
    text: 'Usa el checklist lateral para filtrar trabajadores con pendientes obligatorios.',
    tone: 'neutral',
  });

  return secciones;
}

export function construirSeccionesMsgBoxAdvertenciaEmpleados(resultado: ResultadoValidacionEmpleados): MessageBoxSection[] {
  const secciones: MessageBoxSection[] = [];

  if (resultado.mensajesAdvertencia.length > 0) {
    secciones.push({
      title: 'Observaciones detectadas',
      items: resultado.mensajesAdvertencia,
      tone: 'attention',
    });
  }

  secciones.push({
    title: 'Por qué importa',
    text: 'Hay trabajadores con observaciones que conviene revisar antes de avanzar.',
    tone: 'attention',
  });

  return secciones;
}
