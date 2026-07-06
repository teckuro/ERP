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
  idLiquidacionPeriodo: number;
  versionLiquidacion: number;
  totalTrabajadores: number;
  lineas: LreLineaExport[];
  conceptosSinCodigoLre: number;
  listoParaEnvio: boolean;
}
