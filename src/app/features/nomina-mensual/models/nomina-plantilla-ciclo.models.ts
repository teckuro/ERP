/**
 * Modelos de Plantillas de ciclos de nómina.
 *
 * Creados en `NOM-ADMIN-OPS-F03` (2026-06-11).
 *
 * Documento rector:
 *   `docs/codex/modulos/nomina-mensual/roadmap-admin-generador-operativo-100.md` §F03.
 *
 * Las plantillas configuran calendarios repetibles (mensual, quincenal,
 * semanal, anticipos) y reducen errores al crear nóminas. Una plantilla
 * propone fechas; la nómina creada congela esas fechas. Cambiar una
 * plantilla no muta nóminas existentes (se versiona).
 */

import type { NaturalezaNomina, TipoNomina } from './nomina-periodo.models';

export type PoliticaFinSemana = 'adelantar' | 'atrasar' | 'mantener';

export type TipoReglaFechaPago =
  | 'dia_fijo'
  | 'dia_habil_n'
  | 'ultimo_dia_habil'
  | 'ultimo_dia_corrido'
  | 'siguiente_mes_dia_fijo';

export interface ReglaFechaPagoBase {
  readonly tipo: TipoReglaFechaPago;
}

export interface ReglaFechaPagoDiaFijo extends ReglaFechaPagoBase {
  readonly tipo: 'dia_fijo';
  readonly dia: number;
}

export interface ReglaFechaPagoDiaHabilN extends ReglaFechaPagoBase {
  readonly tipo: 'dia_habil_n';
  readonly n_habil: number;
}

export interface ReglaFechaPagoUltimoDiaHabil extends ReglaFechaPagoBase {
  readonly tipo: 'ultimo_dia_habil';
}

export interface ReglaFechaPagoUltimoDiaCorrido extends ReglaFechaPagoBase {
  readonly tipo: 'ultimo_dia_corrido';
}

export interface ReglaFechaPagoSiguienteMesDiaFijo extends ReglaFechaPagoBase {
  readonly tipo: 'siguiente_mes_dia_fijo';
  readonly dia: number;
}

export type ReglaFechaPago =
  | ReglaFechaPagoDiaFijo
  | ReglaFechaPagoDiaHabilN
  | ReglaFechaPagoUltimoDiaHabil
  | ReglaFechaPagoUltimoDiaCorrido
  | ReglaFechaPagoSiguienteMesDiaFijo;

export type ModoReglaAnticipo = 'porcentaje' | 'monto_fijo';

export interface ReglaAnticipo {
  readonly modo: ModoReglaAnticipo;
  readonly valor: number;
}

/**
 * Plantilla de ciclo persistida.
 */
export interface NominaPlantillaCiclo {
  readonly id: string;
  readonly empresaId: string;
  readonly codigo: string;
  readonly nombre: string;
  readonly tipo: TipoNomina;
  readonly naturaleza: NaturalezaNomina;
  readonly reglaFechaPago: ReglaFechaPago;
  readonly politicaFinSemana: PoliticaFinSemana;
  readonly reglaAnticipo: ReglaAnticipo | null;
  readonly descripcion: string | null;
  readonly activo: boolean;
  readonly version: number;
  readonly createdAt: string;
  readonly updatedAt: string;
}

/**
 * Datos mínimos para crear una nueva plantilla (versión 1).
 */
export interface NominaPlantillaCicloNueva {
  readonly empresaId: string;
  readonly codigo: string;
  readonly nombre: string;
  readonly tipo: TipoNomina;
  readonly naturaleza: NaturalezaNomina;
  readonly reglaFechaPago: ReglaFechaPago;
  readonly politicaFinSemana: PoliticaFinSemana;
  readonly reglaAnticipo?: ReglaAnticipo | null;
  readonly descripcion?: string | null;
}

/**
 * Parámetros para `crear_version_plantilla` RPC. Todos opcionales: campos
 * no especificados se copian de la versión anterior. Si `activar=true`
 * (default), la versión anterior queda inactiva.
 */
export interface CrearVersionPlantillaPayload {
  readonly plantillaId: string;
  readonly nombre?: string;
  readonly reglaFechaPago?: ReglaFechaPago;
  readonly politicaFinSemana?: PoliticaFinSemana;
  readonly reglaAnticipo?: ReglaAnticipo;
  readonly descripcion?: string;
  readonly activar?: boolean;
}

/**
 * Corte proyectado por `previsualizar_cortes_plantilla` RPC.
 */
export interface PreviewCorte {
  readonly numeroCorte: number;
  readonly codigoCiclo: string;
  readonly fechaInicio: string;
  readonly fechaFin: string;
  readonly fechaPagoPropuesta: string;
  readonly fechaPagoCalendario: string;
  readonly ajusteFds: PoliticaFinSemana | null;
  readonly notas: string | null;
}

/**
 * Verifica que `valor` es una `ReglaFechaPago` válida en runtime. Útil
 * para defender mappers contra payloads JSON malformados.
 */
export function esReglaFechaPagoValida(valor: unknown): valor is ReglaFechaPago {
  if (!valor || typeof valor !== 'object') return false;
  const r = valor as Record<string, unknown>;
  const tipo = r['tipo'];
  if (typeof tipo !== 'string') return false;

  switch (tipo) {
    case 'dia_fijo':
    case 'siguiente_mes_dia_fijo':
      return typeof r['dia'] === 'number' && r['dia'] >= 1 && r['dia'] <= 31;
    case 'dia_habil_n':
      return typeof r['n_habil'] === 'number' && r['n_habil'] >= 1 && r['n_habil'] <= 23;
    case 'ultimo_dia_habil':
    case 'ultimo_dia_corrido':
      return true;
    default:
      return false;
  }
}

/**
 * Verifica que `valor` es una `ReglaAnticipo` válida.
 */
export function esReglaAnticipoValida(valor: unknown): valor is ReglaAnticipo {
  if (!valor || typeof valor !== 'object') return false;
  const r = valor as Record<string, unknown>;
  const modo = r['modo'];
  const v = r['valor'];
  if (modo !== 'porcentaje' && modo !== 'monto_fijo') return false;
  if (typeof v !== 'number' || v <= 0) return false;
  if (modo === 'porcentaje' && v > 100) return false;
  return true;
}

/**
 * Describe una `ReglaFechaPago` en lenguaje humano (RRHH, no técnico).
 * Útil para la UI de plantillas y el preview de cortes.
 */
export function describirReglaFechaPago(regla: ReglaFechaPago): string {
  switch (regla.tipo) {
    case 'dia_fijo':
      return `Día ${regla.dia} del mes`;
    case 'siguiente_mes_dia_fijo':
      return `Día ${regla.dia} del mes siguiente`;
    case 'dia_habil_n':
      return `Día hábil ${regla.n_habil} del mes`;
    case 'ultimo_dia_habil':
      return 'Último día hábil del mes';
    case 'ultimo_dia_corrido':
      return 'Último día calendario del mes';
  }
}

/**
 * Describe una `PoliticaFinSemana` en lenguaje humano.
 */
export function describirPoliticaFinSemana(politica: PoliticaFinSemana): string {
  switch (politica) {
    case 'adelantar':
      return 'Adelantar al viernes anterior';
    case 'atrasar':
      return 'Atrasar al lunes siguiente';
    case 'mantener':
      return 'Mantener fecha calendario';
  }
}

/**
 * Describe una `ReglaAnticipo` en lenguaje humano. Null se traduce a
 * texto vacío (la plantilla no aplica).
 */
export function describirReglaAnticipo(regla: ReglaAnticipo | null): string {
  if (regla === null) return '';
  if (regla.modo === 'porcentaje') {
    return `${regla.valor}% del líquido proyectado`;
  }
  return `$${regla.valor.toLocaleString('es-CL')} fijo`;
}
