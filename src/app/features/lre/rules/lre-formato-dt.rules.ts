import type { LreBorradorExport } from '../models/lre-export.model';

/** Identificador de formato DT operativo v1 (Dirección del Trabajo). */
export const LRE_FORMATO_DT_V1 = 'LRE-DT-v1';

/**
 * Genera archivo LRE formato DT v1 (CSV delimitado por `;`).
 * Columnas operativas para carga/validación previa al portal DT.
 * No sustituye el envío oficial; es el canal `formato_dt_v1` de LRE-01b.
 */
export function generarFormatoDtLre(borrador: LreBorradorExport): string {
  const headers = [
    'periodo',
    'rut_trabajador',
    'nombre_trabajador',
    'codigo_lre',
    'glosa_concepto',
    'tipo',
    'monto',
    'version_liquidacion',
  ];
  const filas = borrador.lineas.map((l) =>
    [
      escaparCampoDt(borrador.periodo),
      escaparCampoDt(l.rut),
      escaparCampoDt(l.nombreTrabajador),
      escaparCampoDt(l.codigoLre),
      escaparCampoDt(l.nombreConcepto),
      escaparCampoDt(l.tipo),
      String(l.monto),
      String(borrador.versionLiquidacion),
    ].join(';'),
  );
  return [headers.join(';'), ...filas].join('\r\n');
}

export function descargarFormatoDtLre(borrador: LreBorradorExport): void {
  const contenido = generarFormatoDtLre(borrador);
  const blob = new Blob(['\ufeff', contenido], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `lre-dt-v1-${borrador.periodo.replace(/[^0-9-]/g, '')}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function escaparCampoDt(valor: string): string {
  const texto = (valor ?? '').trim();
  if (texto.includes(';') || texto.includes('"') || texto.includes('\n') || texto.includes('\r')) {
    return `"${texto.replace(/"/g, '""')}"`;
  }
  return texto;
}
