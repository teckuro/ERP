import type { MessageBoxSection } from '../../../shared/components/ui/feedback/message-box/message-box.types';
import type {
  PreviredArchivo105Resumen,
  PreviredAdvertencia,
  PreviredBorradorExport,
  PreviredConceptoObservacion,
} from '../models/previred-export.model';

export interface PreviredExportacionModalPresentacionInput {
  borrador: PreviredBorradorExport | null;
  archivo105: PreviredArchivo105Resumen | null;
  errorCarga: string | null;
  avisoFaseBd: string | null;
  feedbackDescarga: string | null;
  bloqueos: readonly PreviredAdvertencia[];
  revisiones: readonly PreviredAdvertencia[];
  puedeDescargar: boolean;
  tieneBloqueo: boolean;
}

function cantidadTexto(cantidad: number, singular: string, plural: string): string {
  return `${cantidad} ${cantidad === 1 ? singular : plural}`;
}

function tituloCantidad(cantidad: number, singular: string, plural: string): string {
  return cantidad === 1 ? singular : `${cantidad} ${plural}`;
}

function formatearPeriodo(periodo: string): string {
  const [anio, mes] = periodo.split('-');
  if (!anio || !mes) return periodo;
  return `${mes}/${anio}`;
}

function formatearMonto(monto: number): string {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(Math.round(monto));
}

function lineaConceptoObservacion(concepto: PreviredConceptoObservacion): string {
  const lre = concepto.codigoLre ? ` · LRE ${concepto.codigoLre}` : '';
  const codigo = concepto.codigoConcepto ? ` · ${concepto.codigoConcepto}` : '';
  return `${concepto.nombreTrabajador} · ${concepto.nombreConcepto}${codigo}${lre} · ${formatearMonto(concepto.monto)} · ${concepto.motivo}`;
}

export function etiquetaVerDetalleConceptos(cantidad: number): string | null {
  if (cantidad <= 0) return null;
  return cantidad === 1 ? 'Ver concepto afectado' : `Ver ${cantidad} conceptos afectados`;
}

export function seccionesDetalleConceptosObservacion(
  conceptos: readonly PreviredConceptoObservacion[],
): MessageBoxSection[] {
  if (!conceptos.length) return [];

  const sinCodigo = conceptos.filter((c) => c.tipo === 'sin_codigo_previred');
  const provisionales = conceptos.filter((c) => c.tipo === 'mapeo_provisional');
  const secciones: MessageBoxSection[] = [];

  if (sinCodigo.length) {
    secciones.push({
      title: tituloCantidad(sinCodigo.length, 'Sin código Previred', 'sin código Previred'),
      text: 'Estos conceptos no se incluirán en el archivo oficial.',
      items: sinCodigo.map(lineaConceptoObservacion).slice(0, 8),
      tone: 'attention',
    });
  }

  if (provisionales.length) {
    secciones.push({
      title: tituloCantidad(provisionales.length, 'Mapeo provisional', 'mapeos provisionales'),
      text: 'Revise el catálogo Previred si el código no corresponde.',
      items: provisionales.map(lineaConceptoObservacion).slice(0, 8),
      tone: 'neutral',
    });
  }

  return secciones.slice(0, 2);
}

export function mensajeDetalleConceptosObservacion(cantidad: number): string {
  return cantidad === 1
    ? 'Detalle del concepto que quedará fuera del archivo Previred.'
    : `Detalle de los ${cantidad} conceptos que quedarán fuera o con mapeo provisional.`;
}

export function tituloModalPreviredExportacion(
  input: Pick<PreviredExportacionModalPresentacionInput, 'errorCarga' | 'tieneBloqueo' | 'puedeDescargar'>,
): string {
  if (input.errorCarga) return 'No se pudo preparar';
  if (input.tieneBloqueo) return 'Exportación bloqueada';
  if (input.puedeDescargar) return 'Descargar archivo Previred';
  return 'Revisar exportación Previred';
}

export function mensajeModalPreviredExportacion(
  input: Pick<
    PreviredExportacionModalPresentacionInput,
    'errorCarga' | 'tieneBloqueo' | 'puedeDescargar' | 'borrador' | 'archivo105' | 'revisiones'
  >,
): string {
  if (input.errorCarga) return input.errorCarga;

  const resumen = resumenAptitudArchivo105(input.borrador, input.archivo105);
  if (input.tieneBloqueo) {
    if (resumen && resumen.incompletos > 0) {
      return `${cantidadTexto(resumen.incompletos, 'trabajador incompleto', 'trabajadores incompletos')}. Complete la ficha antes de descargar.`;
    }
    return 'Corrija los bloqueos antes de descargar el archivo para el portal.';
  }

  if (input.puedeDescargar) {
    if (input.revisiones.length > 0) {
      return 'Puede descargar el archivo. Revise las observaciones antes de subirlo al portal Previred.';
    }
    return 'Archivo listo para importar en el portal Previred.';
  }

  return 'El archivo oficial aún no cumple las condiciones para descargar.';
}

export function resumenAptitudArchivo105(
  borrador: PreviredBorradorExport | null,
  archivo105: PreviredArchivo105Resumen | null,
): { total: number; listos: number; incompletos: number } | null {
  if (!borrador || !archivo105) return null;
  const incompletos = archivo105.trabajadoresSinDatos;
  const listos = archivo105.totalTrabajadores;
  const total = listos + incompletos || borrador.totalTrabajadores;
  return { total, listos, incompletos };
}

export function seccionesModalPreviredExportacion(
  input: PreviredExportacionModalPresentacionInput,
): MessageBoxSection[] {
  const secciones: MessageBoxSection[] = [];

  if (input.tieneBloqueo && input.bloqueos.length) {
    secciones.push({
      title: tituloCantidad(input.bloqueos.length, 'Trabajador incompleto', 'trabajadores incompletos'),
      text: 'Complete datos personales y previsionales en la ficha del empleado.',
      items: input.bloqueos.map((advertencia) => advertencia.mensaje).slice(0, 6),
      tone: 'attention',
    });
    secciones.push({
      title: 'Acción recomendada',
      text: 'Revise cada ficha en Empleados y vuelva a exportar desde Liquidaciones.',
      tone: 'info',
    });
  } else if (input.borrador) {
    const resumen = resumenAptitudArchivo105(input.borrador, input.archivo105);
    const archivo = input.archivo105;
    const periodo = formatearPeriodo(input.borrador.periodo);

    if (resumen && archivo) {
      const lineaTrabajadores =
        resumen.incompletos > 0
          ? `${cantidadTexto(resumen.listos, 'trabajador listo', 'trabajadores listos')} de ${resumen.total} liquidados.`
          : `${cantidadTexto(resumen.listos, 'trabajador incluido', 'trabajadores incluidos')} en el archivo.`;

      secciones.push({
        title: 'Archivo para Previred',
        text: lineaTrabajadores,
        items: [
          `Período ${periodo} · formato 105 campos`,
          archivo.listoParaEnvio105
            ? 'Estado: listo para descarga'
            : `${cantidadTexto(archivo.totalTrabajadores, 'registro exportable', 'registros exportables')}`,
        ],
        tone: archivo.listoParaEnvio105 ? 'success' : 'neutral',
      });
    }

    if (input.revisiones.length) {
      const tieneDetalleConceptos = (input.borrador?.conceptosObservacion.length ?? 0) > 0;
      secciones.push({
        title: tituloCantidad(input.revisiones.length, 'Observación', 'observaciones'),
        text: tieneDetalleConceptos
          ? 'No impiden la descarga. Use «Ver conceptos afectados» para revisar trabajador, concepto y monto.'
          : 'No impiden la descarga, pero conviene revisarlas antes de subir el archivo.',
        items: tieneDetalleConceptos
          ? []
          : input.revisiones.map((advertencia) => advertencia.mensaje).slice(0, 4),
        tone: 'attention',
      });
    }
  }

  if (input.avisoFaseBd) {
    secciones.push({
      title: 'Servidor',
      text: input.avisoFaseBd,
      tone: 'attention',
    });
  }

  if (input.feedbackDescarga) {
    secciones.push({
      title: 'Descarga',
      text: input.feedbackDescarga,
      tone: 'attention',
    });
  }

  return secciones.slice(0, 3);
}
