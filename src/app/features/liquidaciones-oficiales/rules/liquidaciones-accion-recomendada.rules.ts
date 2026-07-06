/**
 * Franja «Acción recomendada» en Liquidaciones (patrón Paso Cierre).
 */

import type { EstadoNomina } from '../../nomina-mensual/models/nomina-periodo.models';
import {
  esLiquidacionesSoloLectura,
  puedeRegenerarDesdePantallaLiquidaciones,
} from '../../nomina-mensual/rules/nomina-liquidaciones-internas-ui.rules';
import type { LiquidacionAccionUiResumen } from './liquidaciones-acciones-ui.rules';

export type LiquidacionAccionRecomendadaTono =
  | 'info'
  | 'pendiente'
  | 'listo'
  | 'warning'
  | 'cerrada'
  | 'bloqueo';

export type LiquidacionAccionRecomendadaTipo =
  | 'elegir_nomina'
  | 'continuidad_cierre'
  | 'revisar_pendientes_autorizar'
  | 'revisar_pendientes_pago'
  | 'revisar_pendientes_documento'
  | 'exportar_previred'
  | 'solo_consulta'
  | 'regenerar_reabierta'
  | 'sin_comprobantes'
  | 'revision_completa';

export interface LiquidacionAccionRecomendadaVm {
  kicker: string;
  titulo: string;
  detalle: string;
  tono: LiquidacionAccionRecomendadaTono;
  tipo: LiquidacionAccionRecomendadaTipo;
  ejecutable: boolean;
  accionLabel?: string;
  /** Estado de revisión para filtrar la grilla de trabajadores. */
  filtroEstadoRevision?: string;
}

export interface ConstruirAccionRecomendadaLiquidacionesParams {
  tieneNominaSeleccionada: boolean;
  nominasElegiblesCount: number;
  origenDesdeCierre: boolean;
  estadoNomina: EstadoNomina | null;
  calculoVigente: boolean;
  hayVersionesMaterializadas: boolean;
  resumenEstados: LiquidacionAccionUiResumen;
  puedeExportarPrevired: boolean;
  trabajadoresSinLiquidacion: number;
}

export function construirAccionRecomendadaLiquidaciones(
  params: ConstruirAccionRecomendadaLiquidacionesParams,
): LiquidacionAccionRecomendadaVm | null {
  if (!params.tieneNominaSeleccionada) {
    if (params.nominasElegiblesCount <= 0) return null;
    return {
      kicker: 'Acción recomendada',
      titulo: 'Elija la nómina a revisar',
      detalle:
        params.nominasElegiblesCount === 1
          ? 'Hay 1 nómina con comprobantes. Selecciónela en la grilla.'
          : `Hay ${params.nominasElegiblesCount} nóminas con comprobantes. Seleccione una fila.`,
      tono: 'info',
      tipo: 'elegir_nomina',
      ejecutable: false,
    };
  }

  if (params.origenDesdeCierre && params.hayVersionesMaterializadas) {
    const pend = params.resumenEstados.pendientesAutorizar;
    if (pend > 0) {
      return {
        kicker: 'Comprobantes generados',
        titulo: 'Revise las liquidaciones pendientes',
        detalle: `${pend} trabajador(es) aún pendientes de autorizar.`,
        tono: 'pendiente',
        tipo: 'continuidad_cierre',
        ejecutable: true,
        accionLabel: 'Ver pendientes',
        filtroEstadoRevision: 'pendiente_autorizar',
      };
    }
  }

  if (params.estadoNomina && esLiquidacionesSoloLectura(params.estadoNomina)) {
    return {
      kicker: 'Nómina cerrada',
      titulo: 'Solo consulta e impresión',
      detalle: 'Los comprobantes quedaron congelados. No se modifican estados ni montos.',
      tono: 'cerrada',
      tipo: 'solo_consulta',
      ejecutable: false,
    };
  }

  if (!params.hayVersionesMaterializadas) {
    return {
      kicker: 'Sin comprobantes',
      titulo: 'Aún no hay liquidaciones guardadas',
      detalle: 'Genere los comprobantes en el paso Cierre del generador de nómina.',
      tono: 'warning',
      tipo: 'sin_comprobantes',
      ejecutable: true,
      accionLabel: 'Ir al generador',
    };
  }

  if (
    params.estadoNomina
    && puedeRegenerarDesdePantallaLiquidaciones(params.estadoNomina, params.calculoVigente)
  ) {
    return {
      kicker: 'Nómina reabierta',
      titulo: 'Puede regenerar comprobantes',
      detalle: 'La nómina fue reabierta. Confirme antes de crear una nueva versión.',
      tono: 'warning',
      tipo: 'regenerar_reabierta',
      ejecutable: true,
      accionLabel: 'Regenerar liquidaciones',
    };
  }

  const { resumenEstados } = params;
  if (resumenEstados.pendientesAutorizar > 0) {
    return {
      kicker: 'Acción recomendada',
      titulo: `Faltan ${resumenEstados.pendientesAutorizar} por autorizar`,
      detalle: 'Revise totales y marque cada liquidación como autorizada.',
      tono: 'pendiente',
      tipo: 'revisar_pendientes_autorizar',
      ejecutable: true,
      accionLabel: 'Ver pendientes',
      filtroEstadoRevision: 'pendiente_autorizar',
    };
  }

  if (resumenEstados.autorizadas > 0) {
    return {
      kicker: 'Acción recomendada',
      titulo: `Faltan ${resumenEstados.autorizadas} pago(s) por registrar`,
      detalle: 'Marque el pago cuando la liquidación haya sido pagada.',
      tono: 'pendiente',
      tipo: 'revisar_pendientes_pago',
      ejecutable: true,
      accionLabel: 'Ver pendientes de pago',
      filtroEstadoRevision: 'autorizada',
    };
  }

  if (resumenEstados.pagosRegistrados > 0) {
    return {
      kicker: 'Acción recomendada',
      titulo: `Faltan ${resumenEstados.pagosRegistrados} documento(s) por marcar`,
      detalle: 'Indique cuando el trabajador recibió su liquidación.',
      tono: 'pendiente',
      tipo: 'revisar_pendientes_documento',
      ejecutable: true,
      accionLabel: 'Ver pendientes de entrega',
      filtroEstadoRevision: 'pago_registrado',
    };
  }

  if (params.puedeExportarPrevired) {
    return {
      kicker: 'Revisión completa',
      titulo: 'Listo para exportar a Previred',
      detalle: 'Todos los trabajadores revisados. Continúe con la salida externa.',
      tono: 'listo',
      tipo: 'exportar_previred',
      ejecutable: true,
      accionLabel: 'Exportar Previred',
    };
  }

  if (resumenEstados.rectificacionesSolicitadas > 0) {
    return {
      kicker: 'Atención',
      titulo: `${resumenEstados.rectificacionesSolicitadas} rectificación(es) solicitada(s)`,
      detalle: 'Corrija desde Nómina mensual antes de emitir una nueva versión.',
      tono: 'warning',
      tipo: 'revision_completa',
      ejecutable: false,
    };
  }

  if (params.trabajadoresSinLiquidacion > 0) {
    return {
      kicker: 'Cobertura incompleta',
      titulo: `${params.trabajadoresSinLiquidacion} trabajador(es) sin liquidación`,
      detalle: 'Hay dotación sin comprobante en la versión vigente. Revise en el generador.',
      tono: 'warning',
      tipo: 'sin_comprobantes',
      ejecutable: true,
      accionLabel: 'Ir al generador',
    };
  }

  return {
    kicker: 'Revisión',
    titulo: 'Liquidaciones revisadas',
    detalle: 'No hay pendientes de autorización, pago o entrega en esta versión.',
    tono: 'listo',
    tipo: 'revision_completa',
    ejecutable: false,
  };
}

export function iconoAccionRecomendadaLiquidacion(tipo: LiquidacionAccionRecomendadaTipo): string {
  switch (tipo) {
    case 'elegir_nomina':
      return 'search';
    case 'continuidad_cierre':
    case 'revisar_pendientes_autorizar':
    case 'revisar_pendientes_pago':
    case 'revisar_pendientes_documento':
      return 'list-checks';
    case 'exportar_previred':
      return 'upload';
    case 'solo_consulta':
      return 'lock';
    case 'regenerar_reabierta':
      return 'refresh-cw';
    case 'sin_comprobantes':
      return 'calculator';
    case 'revision_completa':
      return 'check-circle';
    default:
      return 'info';
  }
}
