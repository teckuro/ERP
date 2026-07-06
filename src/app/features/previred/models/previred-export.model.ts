import type { PreviredOrigenMapeo } from '../rules/previred-mapeo.rules';

export type PreviredTipoMovimiento = 'haber' | 'descuento' | 'cotizacion';

export interface PreviredLineaExport {
  rut: string;
  nombreTrabajador: string;
  codigoMovimiento: string;
  glosa: string;
  monto: number;
  tipo: PreviredTipoMovimiento;
  origenMapeo: PreviredOrigenMapeo;
}

export type PreviredNivelAdvertencia = 'bloqueo' | 'revision';

export interface PreviredAdvertencia {
  nivel: PreviredNivelAdvertencia;
  mensaje: string;
}

export interface PreviredBorradorExport {
  periodo: string;
  empresaNombre: string;
  idNominaPeriodo: string | null;
  idLiquidacionPeriodo: number;
  versionLiquidacion: number;
  totalTrabajadores: number;
  lineas: PreviredLineaExport[];
  advertencias: PreviredAdvertencia[];
  lineasOmitidas: number;
  conceptosSinCodigo: number;
  conceptosSinMapeoCatalogo: number;
  listoParaEnvio: boolean;
}

export type PreviredCanalExportacion = 'csv_borrador' | 'archivo_oficial_rem_v1';

export interface PreviredExportacionRegistro {
  idPreviredExportacion: number;
  idLiquidacionPeriodo: number;
  idNominaPeriodo: string | null;
  periodo: string;
  versionLiquidacion: number;
  usuarioLabel: string;
  canal: PreviredCanalExportacion;
  totalLineas: number;
  totalTrabajadores: number;
  conceptosSinMapeo: number;
  conceptosSinCodigo: number;
  exportadoEn: string;
}
