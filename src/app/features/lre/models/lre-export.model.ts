export interface LreLineaExport {
  rut: string;
  nombreTrabajador: string;
  codigoLre: string;
  nombreConcepto: string;
  monto: number;
  tipo: string;
}

export interface LreBorradorExport {
  periodo: string;
  empresaNombre: string;
  idNominaPeriodo: string | null;
  idLiquidacionPeriodo: number;
  versionLiquidacion: number;
  totalTrabajadores: number;
  lineas: LreLineaExport[];
  conceptosSinCodigoLre: number;
  listoParaEnvio: boolean;
}

export type LreCanalExportacion = 'csv_borrador' | 'formato_dt_v1';

export interface LreExportacionRegistro {
  idLreExportacion: number;
  idLiquidacionPeriodo: number;
  idNominaPeriodo: string | null;
  periodo: string;
  versionLiquidacion: number;
  usuarioLabel: string;
  canal: LreCanalExportacion;
  totalLineas: number;
  totalTrabajadores: number;
  conceptosSinCodigo: number;
  exportadoEn: string;
}
