import type { LiquidacionTrabajador } from '../../liquidaciones-oficiales/models/liquidacion-oficial.model';
import type { PreviredAdvertencia } from '../models/previred-export.model';
import { descomponerRutPrevired } from './previred-archivo-105-posicion.rules';
import {
  parsearNombreCompletoLiquidacion,
  type PreviredTrabajadorEnriquecido,
} from './previred-trabajador-datos.rules';

export interface EvaluarAptitudPreviredTrabajadorInput {
  trabajador: LiquidacionTrabajador;
  enriquecido: PreviredTrabajadorEnriquecido | null;
}

export interface AptitudPreviredTrabajadorResult {
  apto: boolean;
  bloqueos: string[];
  revisiones: string[];
  advertencias: PreviredAdvertencia[];
}

const PLACEHOLDER_NOMBRE = /^[\s—\-–]*$/;

function esPlaceholderNombre(valor: string | null | undefined): boolean {
  if (!valor?.trim()) return true;
  return PLACEHOLDER_NOMBRE.test(valor.trim()) || valor.trim() === '—';
}

function rutValidoPrevired(
  trabajador: LiquidacionTrabajador,
  enriquecido: PreviredTrabajadorEnriquecido | null,
): boolean {
  const rutRaw = enriquecido?.rut ?? trabajador.rut;
  if (!rutRaw?.trim()) return false;
  if (enriquecido?.rut && enriquecido.dv) {
    return descomponerRutPrevired(`${enriquecido.rut}-${enriquecido.dv}`) !== null;
  }
  const normalizado = rutRaw.replace(/\./g, '').trim();
  if (normalizado.includes('-')) {
    return descomponerRutPrevired(normalizado) !== null;
  }
  return false;
}

export function evaluarAptitudPreviredTrabajador(
  input: EvaluarAptitudPreviredTrabajadorInput,
): AptitudPreviredTrabajadorResult {
  const { trabajador, enriquecido } = input;
  const nombre = trabajador.nombreTrabajador?.trim() || 'Trabajador';
  const bloqueos: string[] = [];
  const revisiones: string[] = [];

  if (trabajador.idPersona == null) {
    bloqueos.push(`${nombre}: sin persona vinculada en la liquidación.`);
  }

  if (!enriquecido) {
    bloqueos.push(`${nombre}: ficha no disponible para Previred. Complete datos personales y previsionales.`);
  }

  if (!rutValidoPrevired(trabajador, enriquecido)) {
    bloqueos.push(`${nombre}: RUT no válido para el archivo Previred.`);
  }

  const parsed = parsearNombreCompletoLiquidacion(trabajador.nombreTrabajador);
  const apellidoPaterno = enriquecido?.apellidoPaterno ?? parsed.apellidoPaterno;
  const nombres = enriquecido?.nombres ?? parsed.nombres;

  if (esPlaceholderNombre(apellidoPaterno)) {
    bloqueos.push(`${nombre}: falta apellido paterno en ficha.`);
  }
  if (esPlaceholderNombre(nombres)) {
    bloqueos.push(`${nombre}: faltan nombres en ficha.`);
  }

  if (!enriquecido?.sexo) {
    bloqueos.push(`${nombre}: falta sexo registral en ficha.`);
  }

  const regimen = enriquecido?.regimenPrevisional ?? 'AFP';
  if (regimen === 'AFP' && (!enriquecido?.codigoAfp || enriquecido.codigoAfp === '00')) {
    bloqueos.push(`${nombre}: AFP no reconocida. Revise previsión en ficha.`);
  }

  if (!enriquecido?.saludTipo) {
    bloqueos.push(`${nombre}: falta institución de salud en ficha.`);
  } else if (!enriquecido.codigoSalud || enriquecido.codigoSalud === '00') {
    bloqueos.push(`${nombre}: salud no reconocida para Previred. Revise ficha.`);
  }

  if (enriquecido && enriquecido.tipoTrabajador === 0) {
    revisiones.push(`${nombre}: revise tipo de trabajador en contrato.`);
  }

  const advertencias: PreviredAdvertencia[] = [
    ...bloqueos.map((mensaje) => ({ nivel: 'bloqueo' as const, mensaje })),
    ...revisiones.map((mensaje) => ({ nivel: 'revision' as const, mensaje })),
  ];

  return {
    apto: bloqueos.length === 0,
    bloqueos,
    revisiones,
    advertencias,
  };
}

export function resumenAptitudPreviredLote(
  resultados: readonly AptitudPreviredTrabajadorResult[],
): { listos: number; noAptos: number; total: number } {
  const noAptos = resultados.filter((r) => !r.apto).length;
  return {
    total: resultados.length,
    listos: resultados.length - noAptos,
    noAptos,
  };
}
