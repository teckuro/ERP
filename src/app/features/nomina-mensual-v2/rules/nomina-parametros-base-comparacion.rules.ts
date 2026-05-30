import type { NominaCalculoParametroSnapshot } from '../../nomina-mensual/models/proceso-mensual.model';
import { calcularHashParametros } from '../../nomina-mensual/rules/proceso-mensual-snapshot.rules';
import type { NominaParametrosResumen } from '../models/nomina-parametros-resumen.models';
import type {
  DiferenciaParametroBase,
  EstadoBaseParametrosPeriodoView,
  OrigenBaseParametrosAlAvanzar,
  RamaAccionPreparacionParametros,
  ResultadoComparacionParametrosBase,
  SeveridadDiferenciaParametroBase,
} from '../models/nomina-parametros-base.models';

const CLAVES_CRITICAS = new Set([
  'uf',
  'utm',
  'uta',
  'sueldoMinimo',
  'sueldoMinimo18a65',
  'topeAfp',
  'topeAfpUf',
  'gratificacion',
]);

const CLAVES_RELEVANTES = new Set([
  'topeIps',
  'topeIpsUf',
  'topeCesantia',
  'topeCesantiaUf',
  'immGratificacion',
  'ingresoMinimoNoRemuneracional',
]);

export function resolverRamaAccionPreparacion(input: {
  resumen: NominaParametrosResumen;
  estadoBase: EstadoBaseParametrosPeriodoView;
}): RamaAccionPreparacionParametros {
  const { resumen, estadoBase } = input;
  // V10.1: Preparar nómina congela la base; no bloquea por validación del paso (eso aplica en Cálculo).

  if (!estadoBase.idCalculoPeriodoBase || estadoBase.estado === 'pendiente') {
    return { tipo: 'guardar', resumen };
  }

  const comparacion = estadoBase.comparacion;
  if (comparacion?.hayDiferencias) {
    return {
      tipo: 'diferencias',
      resumen,
      idCalculoPeriodoBase: estadoBase.idCalculoPeriodoBase,
      diferencias: comparacion.diferencias,
    };
  }

  return {
    tipo: 'continuar',
    origen: 'existenteSinDiferencias',
    idCalculoPeriodoBase: estadoBase.idCalculoPeriodoBase,
  };
}

export function compararParametrosCongelados(
  base: readonly NominaCalculoParametroSnapshot[],
  actual: readonly NominaCalculoParametroSnapshot[],
): ResultadoComparacionParametrosBase {
  const hashBase = base.length > 0 ? calcularHashParametros(base) : null;
  const hashActual = actual.length > 0 ? calcularHashParametros(actual) : null;
  if (hashBase && hashActual && hashBase === hashActual) {
    return { hayDiferencias: false, diferencias: [], hashBase, hashActual };
  }

  const mapBase = new Map(base.map((p) => [claveParametro(p), p]));
  const mapActual = new Map(actual.map((p) => [claveParametro(p), p]));
  const claves = new Set([...mapBase.keys(), ...mapActual.keys()]);
  const diferencias: DiferenciaParametroBase[] = [];

  for (const clave of [...claves].sort()) {
    const filaBase = mapBase.get(clave);
    const filaActual = mapActual.get(clave);
    const valorBase = normalizarValorParametro(filaBase);
    const valorActual = normalizarValorParametro(filaActual);
    if (valorBase === valorActual) continue;
    const partes = clave.split('::');
    diferencias.push({
      grupo: partes[0] ?? 'parametros_generales',
      clave: partes[1] ?? clave,
      etiqueta: formatearEtiquetaClave(partes[1] ?? clave),
      valorBase,
      valorActual,
      severidad: resolverSeveridadDiferencia(partes[1] ?? clave),
    });
  }

  return {
    hayDiferencias: diferencias.length > 0,
    diferencias,
    hashBase,
    hashActual,
  };
}

export function resolverOrigenTrasAccionDiferencias(
  accion: 'mantener' | 'actualizar',
): OrigenBaseParametrosAlAvanzar {
  return accion === 'mantener'
    ? 'existenteMantenidaConDiferencias'
    : 'actualizadaExplicitamente';
}

function claveParametro(parametro: NominaCalculoParametroSnapshot): string {
  return `${parametro.grupo}::${parametro.clave}`;
}

function normalizarValorParametro(
  parametro: NominaCalculoParametroSnapshot | undefined,
): string | null {
  if (!parametro) return null;
  if (parametro.valorNumerico != null && Number.isFinite(parametro.valorNumerico)) {
    return String(parametro.valorNumerico);
  }
  return parametro.valor;
}

function resolverSeveridadDiferencia(clave: string): SeveridadDiferenciaParametroBase {
  if (CLAVES_CRITICAS.has(clave)) return 'critica';
  if (CLAVES_RELEVANTES.has(clave)) return 'relevante';
  return 'informativa';
}

function formatearEtiquetaClave(clave: string): string {
  return clave
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (c) => c.toUpperCase())
    .trim();
}
