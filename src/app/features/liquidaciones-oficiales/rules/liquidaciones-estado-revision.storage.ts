import type { LiquidacionAccionUiEstado } from './liquidaciones-acciones-ui.rules';

const STORAGE_KEY = 'liq-estado-revision-v1';

type EstadosPorVersion = Record<number, Record<number, LiquidacionAccionUiEstado>>;

function leerAlmacen(): EstadosPorVersion {
  if (typeof localStorage === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as EstadosPorVersion;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function escribirAlmacen(data: EstadosPorVersion): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function leerEstadosRevisionLiquidacion(
  idLiquidacionPeriodo: number,
): Record<number, LiquidacionAccionUiEstado> {
  const almacen = leerAlmacen();
  return { ...(almacen[idLiquidacionPeriodo] ?? {}) };
}

export function guardarEstadoRevisionLiquidacion(
  idLiquidacionPeriodo: number,
  idLiquidacionTrabajador: number,
  estado: LiquidacionAccionUiEstado,
): void {
  const almacen = leerAlmacen();
  const version = { ...(almacen[idLiquidacionPeriodo] ?? {}) };
  version[idLiquidacionTrabajador] = estado;
  almacen[idLiquidacionPeriodo] = version;
  escribirAlmacen(almacen);
}

export function limpiarEstadosRevisionLiquidacion(idLiquidacionPeriodo: number): void {
  const almacen = leerAlmacen();
  if (!(idLiquidacionPeriodo in almacen)) return;
  delete almacen[idLiquidacionPeriodo];
  escribirAlmacen(almacen);
}

export function fusionarEstadosRevisionLiquidacion(
  idLiquidacionPeriodo: number,
  estadosIniciales: Record<number, LiquidacionAccionUiEstado>,
): Record<number, LiquidacionAccionUiEstado> {
  void idLiquidacionPeriodo;
  // LIQ-AUDIT-01: la BD es fuente de verdad; localStorage queda solo como respaldo de escritura offline.
  return { ...estadosIniciales };
}
