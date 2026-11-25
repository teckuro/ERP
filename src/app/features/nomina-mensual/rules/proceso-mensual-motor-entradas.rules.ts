import type { EntradaMensualPeriodo } from '../entradas/models/entrada-mensual-periodo.model';
import { puedeEntrarAPreNomina } from '../entradas/rules/entradas-mensuales-periodo.rules';
import type { EntradaMensualMotor } from '../models/proceso-mensual.model';

/**
 * Dias base del mes para prorrateo de remuneraciones (convencion chilena: mes comercial de 30 dias).
 * Se centraliza aqui para no hardcodearlo disperso en el motor.
 */
export const DIAS_BASE_MES = 30;

export type EntradaMotorClase =
  | 'HABER_IMPONIBLE'
  | 'HABER_NO_IMPONIBLE'
  | 'DESCUENTO_VOLUNTARIO'
  | 'DESCUENTO_LEGAL'
  | 'ANTICIPO'
  | 'AUSENCIA'
  | 'NO_SOPORTADO';

export interface EntradaMotorClasificada {
  clase: EntradaMotorClase;
  imponible: boolean;
  tributable: boolean;
  codigo: string;
  descripcion: string;
}

function up(v: string | null | undefined): string {
  return (v ?? '').trim().toUpperCase();
}

function leerBandera(valor: unknown): boolean | null {
  return typeof valor === 'boolean' ? valor : null;
}

/** Imponibilidad resuelta: campo explicito > afectaBase > metadata > fallback por categoria. */
function resolverImponible(entrada: EntradaMensualMotor): boolean {
  if (typeof entrada.imponible === 'boolean') return entrada.imponible;
  if (typeof entrada.afectaBase === 'boolean') return entrada.afectaBase;
  const metaImponible = leerBandera(entrada.metadata?.['imponible']);
  if (metaImponible != null) return metaImponible;
  // Fallback: haberes variables y tiempo trabajado adicional son imponibles por defecto.
  return true;
}

function resolverTributable(entrada: EntradaMensualMotor, imponible: boolean): boolean {
  if (typeof entrada.tributable === 'boolean') return entrada.tributable;
  const metaTributable = leerBandera(entrada.metadata?.['tributable']);
  if (metaTributable != null) return metaTributable;
  return imponible;
}

function etiquetaPorCategoria(categoria: string, tipoEntrada: string): { codigo: string; descripcion: string } {
  if (categoria.includes('TIEMPO_TRABAJADO') || categoria.includes('HORA')) {
    return { codigo: 'HORA_EXTRA', descripcion: 'Horas extra' };
  }
  if (categoria.includes('ANTICIPO')) {
    return { codigo: 'ANTICIPO', descripcion: 'Anticipo' };
  }
  if (categoria.includes('AUSENCIA')) {
    return { codigo: 'AUSENCIA', descripcion: 'Ausencia' };
  }
  if (categoria.includes('LICENCIA')) {
    return { codigo: 'LICENCIA', descripcion: 'Licencia o permiso' };
  }
  if (categoria.includes('HABER')) {
    return { codigo: 'BONO', descripcion: 'Bono o haber variable' };
  }
  return { codigo: up(tipoEntrada) || 'ENTRADA', descripcion: 'Entrada mensual' };
}

/**
 * Clasifica una entrada mensual segun su tipo/categoria para que el motor la procese.
 * No inventa montos: solo determina como debe sumarse o descontarse.
 */
export function clasificarEntradaMensualMotor(entrada: EntradaMensualMotor): EntradaMotorClasificada {
  const tipoEntrada = up(entrada.tipoEntrada);
  const categoria = up(entrada.categoria);
  const tipoMovimiento = up(entrada.tipoMovimiento);
  const { codigo, descripcion } = etiquetaPorCategoria(categoria, tipoEntrada);

  if (tipoEntrada === 'ANTICIPO' || categoria.includes('ANTICIPO')) {
    return { clase: 'ANTICIPO', imponible: false, tributable: false, codigo: 'ANTICIPO', descripcion: 'Anticipo de remuneracion' };
  }
  if (tipoEntrada === 'AUSENCIA' || categoria.includes('AUSENCIA')) {
    return { clase: 'AUSENCIA', imponible: false, tributable: false, codigo: 'AUSENCIA', descripcion: 'Ausencia (afecta dias trabajados)' };
  }
  if (tipoEntrada === 'LICENCIA' || categoria.includes('LICENCIA')) {
    return { clase: 'NO_SOPORTADO', imponible: false, tributable: false, codigo: 'LICENCIA', descripcion: 'Licencia o permiso' };
  }
  if (tipoEntrada === 'DESCUENTO' || tipoMovimiento === 'DESCUENTO') {
    const esLegal = leerBandera(entrada.metadata?.['descuentoLegal']) === true;
    return {
      clase: esLegal ? 'DESCUENTO_LEGAL' : 'DESCUENTO_VOLUNTARIO',
      imponible: false,
      tributable: false,
      codigo,
      descripcion,
    };
  }
  if (tipoEntrada === 'HABER' || tipoMovimiento === 'HABER') {
    const imponible = resolverImponible(entrada);
    const tributable = resolverTributable(entrada, imponible);
    return {
      clase: imponible ? 'HABER_IMPONIBLE' : 'HABER_NO_IMPONIBLE',
      imponible,
      tributable,
      codigo,
      descripcion,
    };
  }
  // ajuste, retroactivo, reintegro, otro, informativo: aun no soportados en el motor.
  return { clase: 'NO_SOPORTADO', imponible: false, tributable: false, codigo, descripcion };
}

/** Suma los dias de ausencia declarados en las entradas (cantidad en dias). */
export function calcularDiasAusenciaEntradas(entradas: readonly EntradaMensualMotor[]): number {
  let dias = 0;
  for (const entrada of entradas) {
    const { clase } = clasificarEntradaMensualMotor(entrada);
    if (clase !== 'AUSENCIA') continue;
    const cantidad = entrada.cantidad;
    if (cantidad != null && Number.isFinite(cantidad) && cantidad > 0) {
      dias += cantidad;
    }
  }
  return dias;
}

/**
 * Suma los dias de licencia medica declarados en las entradas (cantidad en dias).
 * Paridad con fn_calcular_dias_trabajados: solo la licencia medica (INASISTENCIA + LICENCIA_MEDICA)
 * descuenta dias trabajados. Licencias/permisos genericos no reducen dias en esta funcion.
 */
export function calcularDiasLicenciaMedicaEntradas(entradas: readonly EntradaMensualMotor[]): number {
  let dias = 0;
  for (const entrada of entradas) {
    const categoria = up(entrada.categoria);
    const tipoEntrada = up(entrada.tipoEntrada);
    const esLicencia = tipoEntrada === 'LICENCIA' || categoria.includes('LICENCIA');
    const esMedica = categoria.includes('MEDICA') || leerBandera(entrada.metadata?.['licenciaMedica']) === true;
    if (!esLicencia || !esMedica) continue;
    const cantidad = entrada.cantidad;
    if (cantidad != null && Number.isFinite(cantidad) && cantidad > 0) {
      dias += cantidad;
    }
  }
  return dias;
}

interface AnioMesPartes {
  anio: number;
  /** Mes 1-based (1 = enero). */
  mes: number;
}

function parseAnioMes(anioMes: string | null | undefined): AnioMesPartes | null {
  const match = /^(\d{4})-(\d{2})$/.exec((anioMes ?? '').trim());
  if (!match) return null;
  const anio = Number(match[1]);
  const mes = Number(match[2]);
  if (!Number.isInteger(anio) || mes < 1 || mes > 12) return null;
  return { anio, mes };
}

function fechaADiaUtc(fecha: string | null | undefined): number | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec((fecha ?? '').trim());
  if (!match) return null;
  const anio = Number(match[1]);
  const mes = Number(match[2]);
  const dia = Number(match[3]);
  if (mes < 1 || mes > 12 || dia < 1 || dia > 31) return null;
  return Date.UTC(anio, mes - 1, dia);
}

const MILISEGUNDOS_POR_DIA = 86_400_000;

/** Dias calendario del mes del periodo ('YYYY-MM'): 28/29/30/31. */
export function diasEnMes(anioMes: string): number {
  const partes = parseAnioMes(anioMes);
  if (!partes) return 0;
  // Dia 0 del mes siguiente (1-based) = ultimo dia del mes actual.
  return new Date(Date.UTC(partes.anio, partes.mes, 0)).getUTCDate();
}

/**
 * Dias calendario trabajados dentro del periodo, acotados por ingreso y retiro.
 * Mirror del CTE dias_base de fn_calcular_dias_trabajados (inclusivo, sin descontar licencia).
 */
export function calcularDiasCalendarioTrabajados(
  anioMes: string,
  fechaIngreso?: string | null,
  fechaRetiro?: string | null,
): number {
  const partes = parseAnioMes(anioMes);
  if (!partes) return 0;
  const inicioMes = Date.UTC(partes.anio, partes.mes - 1, 1);
  const finMes = Date.UTC(partes.anio, partes.mes - 1, diasEnMes(anioMes));
  const ingresoUtc = fechaADiaUtc(fechaIngreso);
  const retiroUtc = fechaADiaUtc(fechaRetiro);
  const fechaInicio = Math.max(inicioMes, ingresoUtc ?? inicioMes);
  const fechaFin = Math.min(finMes, retiroUtc ?? finMes);
  if (fechaFin < fechaInicio) return 0;
  return Math.floor((fechaFin - fechaInicio) / MILISEGUNDOS_POR_DIA) + 1;
}

export interface CalcularDiasTrabajadosParams {
  /** Periodo en formato 'YYYY-MM'. */
  anioMes: string;
  fechaIngreso?: string | null;
  fechaRetiro?: string | null;
  /** Dias de licencia medica (mirror de diainasist sumado en SQL). */
  diasLicencia?: number | null;
}

/**
 * Paridad exacta con SQL fn_calcular_dias_trabajados.
 * Dias calendario trabajados (acotados por ingreso/retiro) menos licencia medica, con piso 0.
 * Es calendario: un mes completo de 31 dias devuelve 31, febrero 28/29. No aplica base 30 aqui.
 */
export function calcularDiasTrabajados(params: CalcularDiasTrabajadosParams): number {
  const diasBase = calcularDiasCalendarioTrabajados(params.anioMes, params.fechaIngreso, params.fechaRetiro);
  const diasLicencia = Math.max(0, params.diasLicencia ?? 0);
  return Math.max(0, diasBase - diasLicencia);
}

export interface CalcularDiasPagablesParams extends CalcularDiasTrabajadosParams {
  /** Dias de ausencia declarados por entradas (concepto propio del motor TS). */
  diasAusencia?: number | null;
}

/**
 * Dias pagables en convencion chilena base 30, reutilizando la resolucion de bordes del SQL.
 * Un mes trabajado completo (cualquier largo calendario) paga 30 dias; los meses parciales
 * usan los dias calendario del SQL acotados a 30. Licencia medica y ausencias descuentan dias.
 * No reemplaza la base 30 global ni introduce prorrateo distinto al de fn_calcular_dias_trabajados.
 */
export function calcularDiasPagablesBase30(params: CalcularDiasPagablesParams): number {
  const diasMes = diasEnMes(params.anioMes);
  if (diasMes <= 0) return 0;
  const diasCalendario = calcularDiasCalendarioTrabajados(params.anioMes, params.fechaIngreso, params.fechaRetiro);
  const trabajoMesCompleto = diasCalendario >= diasMes;
  const diasBase = trabajoMesCompleto ? DIAS_BASE_MES : Math.min(diasCalendario, DIAS_BASE_MES);
  const reduccion = Math.max(0, params.diasAusencia ?? 0) + Math.max(0, params.diasLicencia ?? 0);
  return Math.max(0, diasBase - reduccion);
}

/**
 * Las asignaciones recurrentes no entran al motor como entradas mensuales: el motor
 * ya las recibe por `input.recurrentes` (con su naturaleza y los omitidos de la
 * nómina). Como entrada se sumaban dos veces. Siguen en las entradas del período
 * para la prevalidación y sus conteos.
 */
export function entradaMensualAptaParaMotor(entrada: EntradaMensualPeriodo): boolean {
  return entrada.origen !== 'recurrente' && puedeEntrarAPreNomina(entrada);
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
    imponible: leerBandera(entrada.metadata?.['imponible']),
    tributable: leerBandera(entrada.metadata?.['tributable']),
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

/** Clasificación tributaria de un concepto del catálogo de haberes y descuentos. */
export interface ClasificacionConcepto {
  idConcepto: number;
  naturaleza: string | null;
  imponible: boolean;
  tributable: boolean;
}

/**
 * Completa `metadata.imponible` / `metadata.tributable` de las entradas (novedades y
 * movimientos manuales de la nómina) desde el catálogo de conceptos. Sin esto,
 * `resolverImponible` cae en su fallback "imponible" aunque el concepto sea no
 * imponible (colación, movilización, viáticos…) e infla la base de cotizaciones e
 * impuesto. Mismo criterio que los haberes recurrentes: imponible si el concepto lo
 * marca o su naturaleza es IMPONIBLE. Una entrada que ya trae la bandera no se toca.
 */
export function aplicarClasificacionConceptos(
  entradas: readonly EntradaMensualPeriodo[],
  conceptos: readonly ClasificacionConcepto[],
): EntradaMensualPeriodo[] {
  if (conceptos.length === 0) return [...entradas];
  const porId = new Map(conceptos.map((concepto) => [concepto.idConcepto, concepto]));

  return entradas.map((entrada) => {
    const concepto = porId.get(entrada.idConcepto);
    if (!concepto) return entrada;

    const metadata = entrada.metadata ?? {};
    const imponible =
      leerBandera(metadata['imponible']) ??
      (concepto.imponible === true || up(concepto.naturaleza) === 'IMPONIBLE');
    const tributable = leerBandera(metadata['tributable']) ?? concepto.tributable === true;

    return { ...entrada, metadata: { ...metadata, imponible, tributable } };
  });
}
