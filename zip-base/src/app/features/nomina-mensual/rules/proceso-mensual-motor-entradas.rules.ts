import type { EntradaMensualPeriodo } from '../entradas/models/entrada-mensual-periodo.model';
import { puedeEntrarAPreNomina } from '../entradas/rules/entradas-mensuales-periodo.rules';
import type { EntradaMensualMotor } from '../models/proceso-mensual.model';

export function entradaMensualAptaParaMotor(entrada: EntradaMensualPeriodo): boolean {
  return puedeEntrarAPreNomina(entrada);
}

export function mapEntradaMensualMotor(entrada: EntradaMensualPeriodo): EntradaMensualMotor {
  return {
    idEntrada: entrada.idEntrada,
    origen: entrada.origen,
    origenId: entrada.origenId,
    periodo: entrada.periodo,
    idPersona: entrada.idPersona,
    idContrato: entrada.idContrato,
    idConcepto: entrada.idConcepto,
    tipoEntrada: entrada.tipoEntrada,
    categoria: entrada.categoria,
    tipoMovimiento: entrada.tipoMovimiento,
    cantidad: entrada.cantidad,
    unidad: entrada.unidad,
    monto: entrada.monto,
    moneda: entrada.moneda,
    estado: entrada.estado,
    afectaBase: null,
    metadata: {
      ...entrada.metadata,
      contratoMotor: 'MOTOR-04_PREPARATORIO',
      estadoNormalizado: entrada.estado,
      origenEntradaMensual: entrada.origen,
      idEntradaMensual: entrada.idEntrada,
    },
  };
}

export function construirEntradasMensualesMotor(
  entradas: readonly EntradaMensualPeriodo[],
): EntradaMensualMotor[] {
  return entradas.filter(entradaMensualAptaParaMotor).map(mapEntradaMensualMotor);
}
