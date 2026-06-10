import { Injectable } from '@angular/core';

import { Tables } from '../../../core/models/database.types';
import { injectSupabase } from '../../../core/services/supabase.service';
import {
  mapEstadoFichaDbToEmpleadoEstadoFicha,
  mapPersonaFactorToEmpleado,
  type PersonaFactorEmpleadoRow,
} from '../../empleados/mappers/empleado-listado.mapper';
import type { TrabajadorNominaPersonal } from '../models/nomina-empleados-personal.model';

type PersonaFactorNominaRow = PersonaFactorEmpleadoRow & {
  tipo_jornada_nombre?: string | null;
  horas_semanales?: number | null;
  fretiro?: string | null;
  afp_nombre?: string | null;
  salud_nombre_full?: string | null;
  id_afp?: number | null;
  id_salud?: number | null;
};

type CentroCostoLookupRow = {
  id_contrato: number;
  centro_costo: { nombre: string | null } | null;
};

type CuentaBancariaLookupRow = Pick<
  Tables<'cuenta_bancaria'>,
  'id_persona' | 'numero_cuenta' | 'id_banco' | 'activa' | 'es_principal'
>;

const SELECT_TRABAJADORES_NOMINA = [
  'id_persona',
  'id_contrato',
  'rut',
  'dv',
  'nombres',
  'apellido_paterno',
  'apellido_materno',
  'cargo',
  'fingreso',
  'fretiro',
  'base',
  'estado',
  'estado_contrato',
  'estado_ficha',
  'apto_para_remuneraciones',
  'tipo_jornada_nombre',
  'horas_semanales',
  'afp_nombre',
  'salud_nombre_full',
  'id_afp',
  'id_salud',
].join(',');

@Injectable({ providedIn: 'root' })
export class NominaEmpleadosPersonalRepository {
  private readonly supabase = injectSupabase();

  async listarTrabajadoresNomina(): Promise<TrabajadorNominaPersonal[]> {
    const { data, error } = await this.supabase
      .from('vw_persona_factores')
      .select(SELECT_TRABAJADORES_NOMINA)
      .order('id_persona', { ascending: false });

    if (error) {
      throw new Error('No fue posible cargar los trabajadores para nómina.');
    }

    const filas = ((data ?? []) as unknown as PersonaFactorNominaRow[]).filter(
      (row): row is PersonaFactorNominaRow & { id_persona: number } =>
        typeof row.id_persona === 'number',
    );

    if (filas.length === 0) {
      return [];
    }

    const idsPersona = filas.map((row) => row.id_persona);
    const idsContrato = filas.map((row) => row.id_contrato);

    const [centrosCosto, pasosAlta, cuentasBancarias] = await Promise.all([
      this.obtenerCentrosCostoPorContrato(idsContrato),
      this.obtenerPasosAltaAvanzada(idsPersona),
      this.obtenerCuentasBancariasPrincipales(idsPersona),
    ]);

    return filas.map((row) =>
      this.mapearTrabajadorNomina(
        row,
        centrosCosto,
        pasosAlta.get(row.id_persona) ?? null,
        cuentasBancarias.get(row.id_persona) ?? null,
      ),
    );
  }

  private mapearTrabajadorNomina(
    row: PersonaFactorNominaRow & { id_persona: number },
    centrosCosto: Map<number, string>,
    pasoAltaAvanzada: number | null,
    cuentaBancaria: CuentaBancariaLookupRow | null,
  ): TrabajadorNominaPersonal {
    const resumen = mapPersonaFactorToEmpleado(
      { ...row, paso_alta_avanzada: pasoAltaAvanzada },
      centrosCosto,
    );

    return {
      idPersona: row.id_persona,
      idContrato: row.id_contrato ?? null,
      rut: resumen.rut,
      nombreCompleto: resumen.nombre,
      cargo: resumen.cargo,
      centroCosto: resumen.idContrato == null ? null : (centrosCosto.get(resumen.idContrato) ?? null),
      jornada: normalizarJornada(row.tipo_jornada_nombre, row.horas_semanales),
      horasSemanales: row.horas_semanales ?? null,
      fechaIngreso: row.fingreso ?? null,
      fechaRetiro: row.fretiro ?? null,
      estado: resumen.estado,
      estadoFicha: mapEstadoFichaDbToEmpleadoEstadoFicha(row.estado_ficha),
      aptoParaRemuneraciones: resumen.aptoParaRemuneraciones,
      pasoAltaAvanzada,
      estadoContrato: row.estado_contrato ?? null,
      afpNombre: row.afp_nombre?.trim() || null,
      saludNombre: row.salud_nombre_full?.trim() || null,
      idAfp: row.id_afp ?? null,
      idSalud: row.id_salud ?? null,
      numeroCuentaBancaria: cuentaBancaria?.numero_cuenta?.trim() || null,
      idBanco: cuentaBancaria?.id_banco ?? null,
    };
  }

  private async obtenerCentrosCostoPorContrato(
    contractIds: Array<number | null>,
  ): Promise<Map<number, string>> {
    const normalizedIds = contractIds.filter((id): id is number => typeof id === 'number');
    if (normalizedIds.length === 0) {
      return new Map<number, string>();
    }

    const { data, error } = await this.supabase
      .from('contrato_centro_costo')
      .select('id_contrato, centro_costo!contrato_centro_costo_id_centro_costo_fkey(nombre)')
      .in('id_contrato', normalizedIds);

    if (error) {
      // Propagamos el detalle de Supabase para que sea posible distinguir
      // schema-cache stale (PGRST200), permisos (42501) o ambigüedad de FK
      // (PGRST201) en lugar de mostrar un texto genérico.
      const detalle = [error.code, error.message].filter(Boolean).join(' ').trim();
      throw new Error(
        detalle
          ? `No fue posible cargar los centros de costo de los trabajadores: ${detalle}`
          : 'No fue posible cargar los centros de costo de los trabajadores.',
      );
    }

    const centros = new Map<number, string>();
    for (const row of (data ?? []) as CentroCostoLookupRow[]) {
      if (!centros.has(row.id_contrato) && row.centro_costo?.nombre) {
        centros.set(row.id_contrato, row.centro_costo.nombre);
      }
    }
    return centros;
  }

  private async obtenerPasosAltaAvanzada(ids: number[]): Promise<Map<number, number | null>> {
    const map = new Map<number, number | null>();
    const normalized = [...new Set(ids)].filter((id) => Number.isInteger(id));
    for (const id of normalized) {
      map.set(id, null);
    }
    if (normalized.length === 0) {
      return map;
    }

    const { data, error } = await this.supabase
      .from('persona')
      .select('id_persona, paso_alta_avanzada')
      .in('id_persona', normalized);

    if (error) {
      throw new Error('No fue posible leer el paso de alta avanzada.');
    }

    for (const row of data ?? []) {
      if (typeof row.id_persona === 'number') {
        map.set(
          row.id_persona,
          typeof row.paso_alta_avanzada === 'number' ? row.paso_alta_avanzada : null,
        );
      }
    }
    return map;
  }

  private async obtenerCuentasBancariasPrincipales(
    idsPersona: number[],
  ): Promise<Map<number, CuentaBancariaLookupRow>> {
    const normalized = [...new Set(idsPersona)].filter((id) => Number.isInteger(id));
    const map = new Map<number, CuentaBancariaLookupRow>();
    if (normalized.length === 0) {
      return map;
    }

    const { data, error } = await this.supabase
      .from('cuenta_bancaria')
      .select('id_persona, numero_cuenta, id_banco, activa, es_principal')
      .in('id_persona', normalized)
      .eq('activa', true);

    if (error) {
      throw new Error('No fue posible cargar las cuentas bancarias de los trabajadores.');
    }

    const porPersona = new Map<number, CuentaBancariaLookupRow[]>();
    for (const row of (data ?? []) as CuentaBancariaLookupRow[]) {
      const actuales = porPersona.get(row.id_persona) ?? [];
      actuales.push(row);
      porPersona.set(row.id_persona, actuales);
    }

    for (const [idPersona, cuentas] of porPersona) {
      const principal = cuentas.find((cuenta) => cuenta.es_principal) ?? cuentas[0];
      if (principal) {
        map.set(idPersona, principal);
      }
    }

    return map;
  }
}

function normalizarJornada(nombre: string | null | undefined, horas: number | null | undefined): string | null {
  const etiqueta = nombre?.trim();
  if (!etiqueta) {
    return null;
  }
  if (typeof horas === 'number' && Number.isFinite(horas) && horas > 0) {
    return `${etiqueta} (${horas}h)`;
  }
  return etiqueta;
}
