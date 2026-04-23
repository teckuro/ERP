import { Injectable } from '@angular/core';

import { Tables } from '../../../core/models/database.types';
import { injectSupabase } from '../../../core/services/supabase.service';
import { EmpleadoFormCatalogos } from '../models/empleado-catalogos.model';
import {
  EmpleadoEstado,
  EmpleadoFichaDetalle,
  EmpleadoHistorialCambio,
  EmpleadoListado,
} from '../models/empleado-listado.model';
import { CrearEmpleadoPayload } from '../models/empleado-payload.model';
import {
  mapCatalog,
  mapDepartamentosCatalog,
  mapSaludCatalog,
  pickLatestTramosCarga,
} from '../mappers/empleado-catalogos.mapper';
import {
  formatDate,
  mapEmpleadoEstadoToEstadoFicha,
  mapEmpleadoEstadoToPersonaEstado,
  mapPersonaFactorToEmpleado,
} from '../mappers/empleado-listado.mapper';
import {
  buildApvInsert,
  buildContratoCentroCostoInsert,
  buildContratoInsert,
  buildCuenta2AfpInsert,
  buildCuentaBancariaInsert,
  buildPersonaActivacionUpdate,
  buildPersonaBasicaInsert,
  buildPersonaInsert,
  buildPrevisionInsert,
  buildRemuneracionInsert,
  buildSaludTrabajadorInsert,
  buildSemanaCorridaInsert,
  buildZonaExtremaInsert,
} from '../mappers/empleado-write.mapper';
import { formatRutParts, RutParts } from '../utils/empleado-rut';
import {
  buildForeignKeyError,
  buildRepositoryError,
  EmpleadoReferenciaInvalidaError,
  EmpleadoRutDuplicadoError,
  isUniqueConstraintError,
} from '../utils/empleados-repository-errors';

type PersonaFactorRow = Tables<'vw_persona_factores'>;
type PersonaRow = Tables<'persona'>;
type ContratoRow = Tables<'contrato'>;
type RemuneracionRow = Tables<'remuneracion'>;
type PrevisionRow = Tables<'prevision'>;
type SaludTrabajadorRow = Tables<'salud_trabajador'>;
type CuentaBancariaRow = Tables<'cuenta_bancaria'>;
type SemanaCorridaRow = Tables<'semana_corrida'>;
type ZonaExtremaRow = Tables<'zona_extrema'>;
type ApvRow = Tables<'apv'>;
type Cuenta2AfpRow = Tables<'cuenta2_afp'>;
type CentroCostoRow = Tables<'centro_costo'>;
type EmpleadoHistorialRow = Tables<'empleado_historial'>;

interface CentroCostoLookupRow {
  id_contrato: number;
  centro_costo: Pick<CentroCostoRow, 'nombre'> | null;
}

export { EmpleadoReferenciaInvalidaError, EmpleadoRutDuplicadoError };

@Injectable({
  providedIn: 'root',
})
export class EmpleadosRepository {
  private readonly supabase = injectSupabase();

  async obtenerCatalogosFormulario(): Promise<EmpleadoFormCatalogos> {
    const [
      comunasResult,
      paisesResult,
      centrosCostoResult,
      sucursalesResult,
      departamentosResult,
      tiposTrabajadorResult,
      tiposJornadaResult,
      regimenesResult,
      afpsResult,
      saludResult,
      monedasResult,
      tramosCargaResult,
      institucionesApvResult,
      formasPagoApvResult,
      bancosResult,
      tiposCuentaResult,
    ] = await Promise.all([
      this.supabase
        .from('comuna')
        .select('id_comuna,nombre')
        .eq('activo', true)
        .order('nombre', { ascending: true }),
      this.supabase
        .from('pais')
        .select('id_pais,nombre')
        .eq('activo', true)
        .order('nombre', { ascending: true }),
      this.supabase
        .from('centro_costo')
        .select('id_centro_costo,nombre')
        .order('nombre', { ascending: true }),
      this.supabase
        .from('sucursal')
        .select('id_sucursal,nombre')
        .order('nombre', { ascending: true }),
      this.supabase
        .from('departamento_empresa')
        .select('id_departamento_empresa,nombre,id_sucursal')
        .order('nombre', { ascending: true }),
      this.supabase
        .from('tipo_trabajador')
        .select('id_tipo_trabajador,nombre')
        .order('nombre', { ascending: true }),
      this.supabase
        .from('tipo_jornada')
        .select('id_tipo_jornada,nombre')
        .order('nombre', { ascending: true }),
      this.supabase
        .from('regimen_previsional')
        .select('id_regimen,nombre')
        .order('nombre', { ascending: true }),
      this.supabase.from('afp').select('id_afp,nombre').order('nombre', { ascending: true }),
      this.supabase
        .from('salud')
        .select('id_salud,nombre,tipo')
        .order('nombre', { ascending: true }),
      this.supabase.from('moneda').select('id_moneda,nombre').order('nombre', { ascending: true }),
      this.supabase
        .from('tramo_carga')
        .select('id_tramo,periodo,desde,hasta,valor,tramo')
        .order('periodo', { ascending: false })
        .order('desde', { ascending: true, nullsFirst: true }),
      this.supabase
        .from('institucion_apv')
        .select('id_institucion_apv,nombre')
        .order('nombre', { ascending: true }),
      this.supabase
        .from('forma_pago_apv')
        .select('id_forma_pago_apv,nombre')
        .order('nombre', { ascending: true }),
      this.supabase.from('banco').select('id_banco,nombre').order('nombre', { ascending: true }),
      this.supabase
        .from('tipo_cuenta_bancaria')
        .select('id_tipo_cuenta_bancaria,nombre')
        .order('nombre', { ascending: true }),
    ]);

    if (comunasResult.error) {
      throw buildRepositoryError('No fue posible cargar las comunas.', comunasResult.error.message);
    }
    if (paisesResult.error) {
      throw buildRepositoryError('No fue posible cargar los paises.', paisesResult.error.message);
    }

    if (centrosCostoResult.error) {
      throw buildRepositoryError(
        'No fue posible cargar los centros de costo.',
        centrosCostoResult.error.message,
      );
    }
    if (sucursalesResult.error) {
      throw buildRepositoryError(
        'No fue posible cargar las sucursales.',
        sucursalesResult.error.message,
      );
    }
    if (departamentosResult.error) {
      throw buildRepositoryError(
        'No fue posible cargar los departamentos.',
        departamentosResult.error.message,
      );
    }

    if (tiposTrabajadorResult.error) {
      throw buildRepositoryError(
        'No fue posible cargar los tipos de trabajador.',
        tiposTrabajadorResult.error.message,
      );
    }

    if (tiposJornadaResult.error) {
      throw buildRepositoryError(
        'No fue posible cargar los tipos de jornada.',
        tiposJornadaResult.error.message,
      );
    }

    if (regimenesResult.error) {
      throw buildRepositoryError(
        'No fue posible cargar los regimenes previsionales.',
        regimenesResult.error.message,
      );
    }

    if (afpsResult.error) {
      throw buildRepositoryError('No fue posible cargar las AFP.', afpsResult.error.message);
    }

    if (saludResult.error) {
      throw buildRepositoryError(
        'No fue posible cargar las instituciones de salud.',
        saludResult.error.message,
      );
    }

    if (monedasResult.error) {
      throw buildRepositoryError('No fue posible cargar las monedas.', monedasResult.error.message);
    }
    if (tramosCargaResult.error) {
      throw buildRepositoryError(
        'No fue posible cargar los tramos de carga.',
        tramosCargaResult.error.message,
      );
    }

    if (institucionesApvResult.error) {
      throw buildRepositoryError(
        'No fue posible cargar las instituciones APVI.',
        institucionesApvResult.error.message,
      );
    }

    if (formasPagoApvResult.error) {
      throw buildRepositoryError(
        'No fue posible cargar las formas de pago APVI.',
        formasPagoApvResult.error.message,
      );
    }

    if (bancosResult.error) {
      throw buildRepositoryError('No fue posible cargar los bancos.', bancosResult.error.message);
    }

    if (tiposCuentaResult.error) {
      throw buildRepositoryError(
        'No fue posible cargar los tipos de cuenta bancaria.',
        tiposCuentaResult.error.message,
      );
    }

    return {
      comunas: mapCatalog(comunasResult.data ?? [], 'id_comuna'),
      paises: mapCatalog(paisesResult.data ?? [], 'id_pais'),
      centrosCosto: mapCatalog(centrosCostoResult.data ?? [], 'id_centro_costo'),
      sucursales: mapCatalog(sucursalesResult.data ?? [], 'id_sucursal'),
      departamentos: mapDepartamentosCatalog(departamentosResult.data ?? []),
      tiposTrabajador: mapCatalog(tiposTrabajadorResult.data ?? [], 'id_tipo_trabajador'),
      tiposJornada: mapCatalog(tiposJornadaResult.data ?? [], 'id_tipo_jornada'),
      regimenesPrevisionales: mapCatalog(regimenesResult.data ?? [], 'id_regimen'),
      afps: mapCatalog(afpsResult.data ?? [], 'id_afp'),
      entidadesSalud: mapSaludCatalog(saludResult.data ?? []),
      monedas: mapCatalog(monedasResult.data ?? [], 'id_moneda'),
      tramosCarga: pickLatestTramosCarga(tramosCargaResult.data ?? []),
      institucionesApv: mapCatalog(institucionesApvResult.data ?? [], 'id_institucion_apv'),
      formasPagoApv: mapCatalog(formasPagoApvResult.data ?? [], 'id_forma_pago_apv'),
      bancos: mapCatalog(bancosResult.data ?? [], 'id_banco'),
      tiposCuentaBancaria: mapCatalog(tiposCuentaResult.data ?? [], 'id_tipo_cuenta_bancaria'),
    };
  }

  async listar(): Promise<EmpleadoListado[]> {
    const { data, error } = await this.supabase
      .from('vw_persona_factores')
      .select(
        'id_persona,id_contrato,rut,dv,nombres,apellido_paterno,apellido_materno,cargo,fingreso,base,estado,estado_contrato,estado_ficha,apto_para_remuneraciones',
      )
      .order('id_persona', { ascending: false });

    if (error) {
      throw buildRepositoryError('No fue posible cargar el listado de empleados.', error.message);
    }

    const rows = (data ?? []).filter(
      (row): row is PersonaFactorRow & { id_persona: number } => typeof row.id_persona === 'number',
    );

    const departamentos = await this.fetchDepartamentos(rows.map((row) => row.id_contrato));

    return rows.map((row) => mapPersonaFactorToEmpleado(row, departamentos));
  }

  async obtenerPorId(id: number): Promise<EmpleadoFichaDetalle | null> {
    const { data, error } = await this.supabase
      .from('vw_persona_factores')
      .select(
        'id_persona,id_contrato,rut,dv,nombres,apellido_paterno,apellido_materno,cargo,fingreso,base,estado,estado_contrato,estado_ficha,apto_para_remuneraciones',
      )
      .eq('id_persona', id)
      .maybeSingle();

    if (error) {
      throw buildRepositoryError('No fue posible cargar el empleado.', error.message);
    }

    if (!data?.id_persona) {
      return null;
    }

    const departamentos = await this.fetchDepartamentos([data.id_contrato]);
    const resumen = mapPersonaFactorToEmpleado(
      data as PersonaFactorRow & { id_persona: number },
      departamentos,
    );

    return this.obtenerFichaDetalle(resumen);
  }

  async guardarSeccionFicha(
    personaId: number,
    seccion: 'general' | 'laboral' | 'remuneracion' | 'prevision' | 'pago',
    payload: CrearEmpleadoPayload,
  ): Promise<EmpleadoFichaDetalle | null> {
    const contratoId =
      seccion === 'laboral' || seccion === 'remuneracion' || seccion === 'prevision'
        ? await this.ensureContratoId(personaId, payload)
        : null;

    if (seccion === 'general') {
      await this.actualizarPersonaDesdePayload(personaId, payload);
    }

    if (seccion === 'laboral' || seccion === 'remuneracion') {
      await this.actualizarContratoDesdePayload(contratoId!, payload);
      await this.upsertContratoCentroCostoDesdePayload(contratoId!, payload);
    }

    if (seccion === 'laboral' || seccion === 'remuneracion') {
      await this.upsertRemuneracionDesdePayload(contratoId!, payload);
      await this.upsertSemanaCorridaDesdePayload(contratoId!, payload);
      await this.upsertZonaExtremaDesdePayload(contratoId!, payload);
    }

    if (seccion === 'prevision') {
      await this.upsertPrevisionDesdePayload(contratoId!, payload);
      await this.upsertSaludDesdePayload(contratoId!, payload);
      await this.upsertCuenta2DesdePayload(contratoId!, payload);
      await this.upsertApvDesdePayload(contratoId!, payload);
    }

    if (seccion === 'pago') {
      await this.upsertCuentaBancariaDesdePayload(personaId, payload);
    }

    await this.recalcularEstadoFicha(personaId, payload);
    return this.obtenerPorId(personaId);
  }

  async actualizarEstadoPersonas(ids: number[], estado: EmpleadoEstado): Promise<number[]> {
    const normalizedIds = [...new Set(ids)].filter((id) => Number.isInteger(id));

    if (normalizedIds.length === 0) {
      return [];
    }

    const { data, error } = await this.supabase
      .from('persona')
      .update({
        estado: mapEmpleadoEstadoToPersonaEstado(estado),
        estado_ficha: mapEmpleadoEstadoToEstadoFicha(estado),
        apto_para_remuneraciones: estado === 'activo',
        fecha_activacion: estado === 'activo' ? new Date().toISOString() : null,
      })
      .in('id_persona', normalizedIds)
      .select('id_persona');

    if (error) {
      throw buildRepositoryError(
        'No fue posible actualizar el estado de los empleados.',
        error.message,
      );
    }

    return (data ?? []).map((row) => row.id_persona);
  }

  async obtenerEmpresaIdParaContrato(): Promise<number> {
    const { data, error } = await this.supabase
      .from('empresa')
      .select('id_empresa')
      .order('id_empresa', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (error || !data) {
      throw buildRepositoryError(
        'No se encontro una empresa configurada para crear contratos.',
        error?.message ??
          'La tabla empresa no devolvio registros visibles para la clave publica de Supabase.',
      );
    }

    return data.id_empresa;
  }

  async insertarPersona(payload: CrearEmpleadoPayload, rut: RutParts): Promise<number> {
    const { data, error } = await this.supabase
      .from('persona')
      .insert(buildPersonaInsert(payload, rut))
      .select('id_persona')
      .single();

    if (error) {
      if (isUniqueConstraintError(error, 'persona_rut_key')) {
        throw new EmpleadoRutDuplicadoError(formatRutParts(rut));
      }

      const foreignKeyError = buildForeignKeyError(
        error,
        {
          persona_id_comuna_fkey:
            'La comuna seleccionada no esta disponible para registrar la ficha.',
          persona_id_tramo_carga_fkey:
            'El tramo de carga seleccionado no esta disponible para registrar la ficha.',
        },
        'No fue posible validar los datos personales seleccionados para la ficha.',
      );

      if (foreignKeyError) {
        throw foreignKeyError;
      }

      throw buildRepositoryError('No fue posible crear la persona en Supabase.', error.message);
    }

    return data.id_persona;
  }

  async insertarPersonaBasica(payload: CrearEmpleadoPayload, rut: RutParts): Promise<number> {
    const { data, error } = await this.supabase
      .from('persona')
      .insert(buildPersonaBasicaInsert(payload, rut))
      .select('id_persona')
      .single();

    if (error) {
      if (isUniqueConstraintError(error, 'persona_rut_key')) {
        throw new EmpleadoRutDuplicadoError(formatRutParts(rut));
      }

      const foreignKeyError = buildForeignKeyError(
        error,
        {
          persona_id_comuna_fkey:
            'La comuna seleccionada no esta disponible para registrar la ficha.',
          persona_id_tramo_carga_fkey:
            'El tramo de carga seleccionado no esta disponible para registrar la ficha.',
        },
        'No fue posible validar los datos personales seleccionados para la ficha.',
      );

      if (foreignKeyError) {
        throw foreignKeyError;
      }

      throw buildRepositoryError('No fue posible crear la persona en Supabase.', error.message);
    }

    return data.id_persona;
  }

  async activarPersonaCreada(payload: CrearEmpleadoPayload, personaId: number): Promise<void> {
    const { error } = await this.supabase
      .from('persona')
      .update(buildPersonaActivacionUpdate(payload, new Date().toISOString()))
      .eq('id_persona', personaId);

    if (error) {
      throw buildRepositoryError(
        'No fue posible activar la ficha creada en Supabase.',
        error.message,
      );
    }
  }

  async insertarContrato(
    payload: CrearEmpleadoPayload,
    personaId: number,
    empresaId: number,
  ): Promise<number> {
    const { data, error } = await this.supabase
      .from('contrato')
      .insert(buildContratoInsert(payload, personaId, empresaId))
      .select('id_contrato')
      .single();

    if (error) {
      const foreignKeyError = buildForeignKeyError(
        error,
        {
          contrato_id_persona_fkey:
            'No fue posible asociar el contrato a la ficha del colaborador.',
          contrato_id_empresa_fkey: 'La empresa configurada para el contrato no esta disponible.',
          contrato_id_sucursal_fkey: 'La sucursal seleccionada no esta disponible.',
          contrato_id_departamento_empresa_fkey: 'El departamento seleccionado no esta disponible.',
          contrato_id_tipo_trabajador_fkey:
            'El tipo de trabajador seleccionado no esta disponible.',
          contrato_id_tipo_jornada_fkey: 'El tipo de jornada seleccionado no esta disponible.',
        },
        'No fue posible validar los datos laborales seleccionados para la ficha.',
      );

      if (foreignKeyError) {
        throw foreignKeyError;
      }

      throw buildRepositoryError('No fue posible crear el contrato en Supabase.', error.message);
    }

    return data.id_contrato;
  }

  async insertarRemuneracion(payload: CrearEmpleadoPayload, contratoId: number): Promise<void> {
    const { error } = await this.supabase
      .from('remuneracion')
      .insert(buildRemuneracionInsert(payload, contratoId));

    if (error) {
      const foreignKeyError = buildForeignKeyError(
        error,
        {
          remuneracion_id_contrato_fkey:
            'No fue posible asociar la remuneracion al contrato del colaborador.',
          remuneracion_id_moneda_fkey:
            'La moneda seleccionada para la remuneracion no esta disponible.',
        },
        'No fue posible validar los datos de remuneracion seleccionados.',
      );

      if (foreignKeyError) {
        throw foreignKeyError;
      }

      throw buildRepositoryError(
        'No fue posible registrar la remuneracion del empleado.',
        error.message,
      );
    }
  }

  async insertarPrevision(payload: CrearEmpleadoPayload, contratoId: number): Promise<void> {
    const { error } = await this.supabase
      .from('prevision')
      .insert(buildPrevisionInsert(payload, contratoId));

    if (error) {
      const foreignKeyError = buildForeignKeyError(
        error,
        {
          prevision_id_contrato_fkey:
            'No fue posible asociar la prevision al contrato del colaborador.',
          prevision_id_afp_fkey: 'La AFP seleccionada no esta disponible.',
          prevision_id_regimen_previsional_fkey:
            'El regimen previsional seleccionado no esta disponible.',
        },
        'No fue posible validar los datos previsionales seleccionados.',
      );

      if (foreignKeyError) {
        throw foreignKeyError;
      }

      throw buildRepositoryError(
        'No fue posible registrar la prevision del empleado.',
        error.message,
      );
    }
  }

  async insertarSaludTrabajador(payload: CrearEmpleadoPayload, contratoId: number): Promise<void> {
    const saludTrabajadorInsert = buildSaludTrabajadorInsert(payload, contratoId);

    if (!saludTrabajadorInsert) {
      return;
    }

    const { error } = await this.supabase.from('salud_trabajador').insert(saludTrabajadorInsert);

    if (error) {
      const foreignKeyError = buildForeignKeyError(
        error,
        {
          salud_trabajador_id_contrato_fkey:
            'No fue posible asociar la salud al contrato del colaborador.',
          salud_trabajador_id_salud_fkey:
            'La institucion de salud seleccionada no esta disponible.',
          salud_trabajador_id_moneda_plan_fkey:
            'La moneda seleccionada para el plan de salud no esta disponible.',
        },
        'No fue posible validar los datos de salud seleccionados.',
      );

      if (foreignKeyError) {
        throw foreignKeyError;
      }

      throw buildRepositoryError('No fue posible registrar la salud del empleado.', error.message);
    }
  }

  async insertarCuenta2Afp(payload: CrearEmpleadoPayload, contratoId: number): Promise<void> {
    const cuenta2Insert = buildCuenta2AfpInsert(payload, contratoId);

    if (!cuenta2Insert) {
      return;
    }

    const { error } = await this.supabase.from('cuenta2_afp').insert(cuenta2Insert);

    if (error) {
      const foreignKeyError = buildForeignKeyError(
        error,
        {
          cuenta2_afp_id_contrato_fkey:
            'No fue posible asociar la Cuenta 2 al contrato del colaborador.',
          cuenta2_afp_id_moneda_fkey: 'La moneda seleccionada para Cuenta 2 no esta disponible.',
        },
        'No fue posible validar los datos de Cuenta 2 seleccionados.',
      );

      if (foreignKeyError) {
        throw foreignKeyError;
      }

      throw buildRepositoryError(
        'No fue posible registrar la Cuenta 2 del empleado.',
        error.message,
      );
    }
  }

  async insertarSemanaCorrida(payload: CrearEmpleadoPayload, contratoId: number): Promise<void> {
    const semanaCorridaInsert = buildSemanaCorridaInsert(payload, contratoId);

    if (!semanaCorridaInsert) {
      return;
    }

    const { error } = await this.supabase.from('semana_corrida').insert(semanaCorridaInsert);

    if (error) {
      const foreignKeyError = buildForeignKeyError(
        error,
        {
          semana_corrida_id_contrato_fkey:
            'No fue posible asociar la semana corrida al contrato del colaborador.',
        },
        'No fue posible validar la configuracion de semana corrida.',
      );

      if (foreignKeyError) {
        throw foreignKeyError;
      }

      throw buildRepositoryError(
        'No fue posible registrar la configuracion de semana corrida del empleado.',
        error.message,
      );
    }
  }

  async insertarZonaExtrema(payload: CrearEmpleadoPayload, contratoId: number): Promise<void> {
    const zonaExtremaInsert = buildZonaExtremaInsert(payload, contratoId);

    if (!zonaExtremaInsert) {
      return;
    }

    const { error } = await this.supabase.from('zona_extrema').insert(zonaExtremaInsert);

    if (error) {
      const foreignKeyError = buildForeignKeyError(
        error,
        {
          zona_extrema_id_contrato_fkey:
            'No fue posible asociar la zona extrema al contrato del colaborador.',
        },
        'No fue posible validar la configuracion de zona extrema.',
      );

      if (foreignKeyError) {
        throw foreignKeyError;
      }

      throw buildRepositoryError(
        'No fue posible registrar la configuracion de zona extrema del empleado.',
        error.message,
      );
    }
  }

  async insertarApv(payload: CrearEmpleadoPayload, contratoId: number): Promise<void> {
    const apvInsert = buildApvInsert(payload, contratoId);

    if (!apvInsert) {
      return;
    }

    const { error } = await this.supabase.from('apv').insert(apvInsert);

    if (error) {
      const foreignKeyError = buildForeignKeyError(
        error,
        {
          apv_id_contrato_fkey: 'No fue posible asociar el APVI al contrato del colaborador.',
          apv_id_institucion_apv_fkey: 'La institucion APVI seleccionada no esta disponible.',
          apv_id_moneda_fkey: 'La moneda seleccionada para APVI no esta disponible.',
          apv_id_forma_pago_apv_fkey: 'La forma de pago APVI seleccionada no esta disponible.',
        },
        'No fue posible validar los datos APVI seleccionados.',
      );

      if (foreignKeyError) {
        throw foreignKeyError;
      }

      throw buildRepositoryError('No fue posible registrar el APVI del empleado.', error.message);
    }
  }

  async insertarCuentaBancaria(payload: CrearEmpleadoPayload, personaId: number): Promise<void> {
    const { error } = await this.supabase
      .from('cuenta_bancaria')
      .insert(buildCuentaBancariaInsert(payload, personaId));

    if (error) {
      const foreignKeyError = buildForeignKeyError(
        error,
        {
          cuenta_bancaria_id_persona_fkey:
            'No fue posible asociar la cuenta bancaria a la ficha del colaborador.',
          cuenta_bancaria_id_banco_fkey: 'El banco seleccionado no esta disponible.',
          cuenta_bancaria_id_tipo_cuenta_bancaria_fkey:
            'El tipo de cuenta bancaria seleccionado no esta disponible.',
        },
        'No fue posible validar los datos bancarios seleccionados.',
      );

      if (foreignKeyError) {
        throw foreignKeyError;
      }

      throw buildRepositoryError(
        'No fue posible registrar la cuenta bancaria del empleado.',
        error.message,
      );
    }
  }

  async insertarContratoCentroCosto(
    payload: CrearEmpleadoPayload,
    contratoId: number,
  ): Promise<void> {
    const centroCostoInsert = buildContratoCentroCostoInsert(payload, contratoId);

    if (!centroCostoInsert) {
      return;
    }

    const { error } = await this.supabase.from('contrato_centro_costo').insert(centroCostoInsert);

    if (error) {
      const foreignKeyError = buildForeignKeyError(
        error,
        {
          contrato_centro_costo_id_contrato_fkey:
            'No fue posible asociar el centro de costo al contrato del colaborador.',
          contrato_centro_costo_id_centro_costo_fkey:
            'El centro de costo seleccionado no esta disponible.',
        },
        'No fue posible validar el centro de costo seleccionado.',
      );

      if (foreignKeyError) {
        throw foreignKeyError;
      }

      throw buildRepositoryError(
        'No fue posible vincular el contrato al centro de costo seleccionado.',
        error.message,
      );
    }
  }

  async obtenerCentroCostoNombre(id: number | null): Promise<string | null> {
    if (id === null) {
      return null;
    }

    const { data, error } = await this.supabase
      .from('centro_costo')
      .select('nombre')
      .eq('id_centro_costo', id)
      .maybeSingle();

    if (error) {
      return null;
    }

    return data?.nombre ?? null;
  }

  async rollbackCreacion(contratoId: number | null, personaId: number | null): Promise<void> {
    if (contratoId !== null) {
      await this.supabase.from('contrato').delete().eq('id_contrato', contratoId);
    }

    if (personaId !== null) {
      await this.supabase.from('persona').delete().eq('id_persona', personaId);
    }
  }

  private async obtenerFichaDetalle(resumen: EmpleadoListado): Promise<EmpleadoFichaDetalle> {
    const [
      personaResult,
      contratoResult,
      cuentaResult,
    ] = await Promise.all([
      this.supabase.from('persona').select('*').eq('id_persona', resumen.id).maybeSingle(),
      this.supabase
        .from('contrato')
        .select('*')
        .eq('id_persona', resumen.id)
        .order('id_contrato', { ascending: false })
        .limit(1)
        .maybeSingle(),
      this.supabase
        .from('cuenta_bancaria')
        .select('*')
        .eq('id_persona', resumen.id)
        .order('id_cuenta', { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    if (personaResult.error || !personaResult.data) {
      throw buildRepositoryError(
        'No fue posible cargar los datos personales de la ficha.',
        personaResult.error?.message ?? 'La persona no fue encontrada.',
      );
    }

    if (contratoResult.error) {
      throw buildRepositoryError(
        'No fue posible cargar los datos laborales de la ficha.',
        contratoResult.error.message,
      );
    }

    if (cuentaResult.error) {
      throw buildRepositoryError(
        'No fue posible cargar los datos bancarios de la ficha.',
        cuentaResult.error.message,
      );
    }

    const contrato = contratoResult.data;
    const contratoId = contrato?.id_contrato ?? null;
    const [
      remuneracion,
      prevision,
      salud,
      centroCosto,
      semanaCorrida,
      zonaExtrema,
      apv,
      cuenta2,
      historial,
    ] = contratoId
      ? await Promise.all([
          this.fetchLatestByContrato('remuneracion', contratoId, 'id_remuneracion'),
          this.fetchLatestByContrato('prevision', contratoId, 'id_prevision'),
          this.fetchLatestByContrato('salud_trabajador', contratoId, 'id_salud_trabajador'),
          this.fetchLatestByContrato('contrato_centro_costo', contratoId, 'id_contrato_centro_costo'),
          this.fetchLatestByContrato('semana_corrida', contratoId, 'id_semana_corrida'),
          this.fetchLatestByContrato('zona_extrema', contratoId, 'id_zona_extrema'),
          this.fetchLatestByContrato('apv', contratoId, 'id_apv'),
          this.fetchLatestByContrato('cuenta2_afp', contratoId, 'id_cuenta2_afp'),
          this.obtenerHistorialFicha(resumen.id),
        ])
      : [null, null, null, null, null, null, null, null, await this.obtenerHistorialFicha(resumen.id)];

    return {
      ...resumen,
      idContrato: contratoId,
      historial,
      formValue: this.mapFichaFormValue(
        personaResult.data,
        contrato,
        remuneracion as RemuneracionRow | null,
        prevision as PrevisionRow | null,
        salud as SaludTrabajadorRow | null,
        cuentaResult.data,
        centroCosto as { id_centro_costo: number | null } | null,
        semanaCorrida as SemanaCorridaRow | null,
        zonaExtrema as ZonaExtremaRow | null,
        apv as ApvRow | null,
        cuenta2 as Cuenta2AfpRow | null,
      ),
    };
  }

  private async obtenerHistorialFicha(personaId: number): Promise<EmpleadoHistorialCambio[]> {
    const { data, error } = await this.supabase
      .from('empleado_historial')
      .select(
        'id_historial,id_persona,id_contrato,seccion,evento,tabla_origen,id_registro,operacion,campos_modificados,datos_antes,datos_despues,usuario,fecha',
      )
      .eq('id_persona', personaId)
      .order('fecha', { ascending: false })
      .limit(100);

    if (error) {
      return [];
    }

    return (data ?? []).map((row) => this.mapHistorialCambio(row));
  }

  private mapHistorialCambio(row: EmpleadoHistorialRow): EmpleadoHistorialCambio {
    const campos = row.campos_modificados ?? [];

    return {
      id: row.id_historial,
      idPersona: row.id_persona,
      idContrato: row.id_contrato,
      seccion: row.seccion,
      evento: this.historialEventoLabel(row.operacion, row.evento),
      tablaOrigen: row.tabla_origen,
      idRegistro: row.id_registro,
      operacion: row.operacion,
      camposModificados: campos,
      usuario: row.usuario?.trim() || 'Sistema',
      fecha: this.dateTimeText(row.fecha),
      detalle: this.historialDetalle(row.tabla_origen, campos),
    };
  }

  private historialEventoLabel(operacion: string, fallback: string): string {
    switch (operacion) {
      case 'INSERT':
        return 'Registro creado';
      case 'UPDATE':
        return 'Registro actualizado';
      case 'DELETE':
        return 'Registro eliminado';
      default:
        return fallback || 'Cambio registrado';
    }
  }

  private historialDetalle(tabla: string, campos: string[]): string {
    const tablaLabel = this.historialTablaLabel(tabla);

    if (campos.length === 0) {
      return tablaLabel;
    }

    const visibles = campos.slice(0, 4).map((campo) => this.historialCampoLabel(campo));
    const suffix = campos.length > visibles.length ? ` +${campos.length - visibles.length}` : '';
    return `${tablaLabel}: ${visibles.join(', ')}${suffix}`;
  }

  private historialTablaLabel(tabla: string): string {
    const labels: Record<string, string> = {
      persona: 'Datos personales',
      contrato: 'Contrato',
      contrato_centro_costo: 'Centro de costo',
      remuneracion: 'Remuneracion',
      semana_corrida: 'Semana corrida',
      zona_extrema: 'Zona extrema',
      prevision: 'Prevision',
      salud_trabajador: 'Salud',
      cuenta2_afp: 'Cuenta 2 AFP',
      apv: 'APVI',
      cuenta_bancaria: 'Cuenta bancaria',
    };

    return labels[tabla] ?? tabla;
  }

  private historialCampoLabel(campo: string): string {
    return campo
      .replace(/^id_/, '')
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  }

  private dateTimeText(value: string | null): string {
    if (!value) {
      return 'Sin fecha';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return formatDate(value);
    }

    return new Intl.DateTimeFormat('es-CL', {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(date);
  }

  private async fetchLatestByContrato(
    table:
      | 'remuneracion'
      | 'prevision'
      | 'salud_trabajador'
      | 'contrato_centro_costo'
      | 'semana_corrida'
      | 'zona_extrema'
      | 'apv'
      | 'cuenta2_afp',
    contratoId: number,
    orderColumn: string,
  ): Promise<unknown | null> {
    const { data, error } = await this.supabase
      .from(table)
      .select('*')
      .eq('id_contrato', contratoId)
      .order(orderColumn, { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      throw buildRepositoryError('No fue posible cargar un bloque de la ficha.', error.message);
    }

    return data;
  }

  private mapFichaFormValue(
    persona: PersonaRow,
    contrato: ContratoRow | null,
    remuneracion: RemuneracionRow | null,
    prevision: PrevisionRow | null,
    salud: SaludTrabajadorRow | null,
    cuenta: CuentaBancariaRow | null,
    centroCosto: { id_centro_costo: number | null } | null,
    semanaCorrida: SemanaCorridaRow | null,
    zonaExtrema: ZonaExtremaRow | null,
    apv: ApvRow | null,
    cuenta2: Cuenta2AfpRow | null,
  ): EmpleadoFichaDetalle['formValue'] {
    return {
      datosPersonales: {
        rut: formatRutParts({ rut: persona.rut, dv: persona.dv }),
        nombres: persona.nombres,
        apellidoPaterno: persona.apellido_paterno,
        apellidoMaterno: persona.apellido_materno ?? '',
        fechaNacimiento: persona.fecha_nacimiento,
        sexo: persona.sexo ?? 'F',
        pasaporte: persona.pasaporte ?? '',
        idPais: persona.id_pais,
        estadoCivil: persona.estado_civil ?? 'SOLTERO',
      },
      contacto: {
        email: persona.email ?? '',
        telefono: persona.telefono ?? '',
        direccion: persona.direccion ?? '',
        numeroDireccion: persona.numero_direccion ?? '',
        departamentoDireccion: persona.departamento_direccion ?? '',
        observacionesDireccion: persona.observaciones_direccion ?? '',
        idComuna: persona.id_comuna,
      },
      contrato: {
        relacionLaboral: 'CONTRATO',
        idSucursal: contrato?.id_sucursal ?? null,
        idDepartamentoEmpresa: contrato?.id_departamento_empresa ?? null,
        idCentroCosto: centroCosto?.id_centro_costo ?? null,
        cargo: contrato?.cargo ?? '',
        fechaContrato: contrato?.fecha_contrato ?? contrato?.fecha_inicio ?? '',
        tipoContrato: contrato?.codigo_tipo_contrato ?? 'INDEFINIDO',
        idTipoTrabajador: contrato?.id_tipo_trabajador ?? null,
        idTipoJornada: contrato?.id_tipo_jornada ?? null,
        seguroCesantia: contrato?.seguro_cesantia ?? true,
        fechaIngreso: contrato?.fecha_inicio ?? '',
        fechaTermino: contrato?.fecha_termino ?? '',
        sueldoBase: remuneracion?.sueldo_base ?? null,
        idMoneda: remuneracion?.id_moneda ?? null,
        sueldoVariable: remuneracion?.sueldo_variable ?? false,
        horasSemanales: remuneracion?.horas_semanales ?? null,
        diasSemanales: remuneracion?.dias_semanales ?? null,
        distribucionJornada: remuneracion?.distribucion_jornada ?? '',
        tiempoColacionMinutos: remuneracion?.tiempo_colacion_minutos ?? null,
        tipoGratificacion: remuneracion?.tipo_gratificacion ?? 'LEGAL_ART_50',
        gratificacionProporcional: remuneracion?.gratificacion_proporcional ?? false,
        semanaCorridaActiva: semanaCorrida?.activa ?? remuneracion?.semana_corrida_activa ?? false,
        semanaCorridaDiasLaborables: semanaCorrida?.dias_laborables ?? [],
        zonaExtremaActiva: zonaExtrema !== null || (remuneracion?.zona_extrema_activa ?? false),
        zonaExtremaTerritorio: zonaExtrema?.territorio ?? '',
        zonaExtremaPorcentaje: zonaExtrema?.porcentaje ?? null,
        estado: resumenEstadoDesdePersona(persona.estado),
        cargas: persona.cargas ?? 0,
        idTramoCarga: persona.id_tramo_carga,
      },
      previsionSalud: {
        tipoRegimenPrevisional: prevision?.tipo_prevision ?? null,
        idAfp: prevision?.id_afp ?? null,
        idMonedaCuenta2: cuenta2?.id_moneda ?? null,
        valorCuenta2: cuenta2?.monto ?? null,
        nombreExCaja: prevision?.nombre_ex_caja ?? '',
        regimenExCaja: prevision?.regimen_ex_caja ?? '',
        tasaExCaja: prevision?.tasa_ex_caja ?? null,
        idSalud: salud?.id_salud ?? null,
        idMonedaPlan: salud?.id_moneda_plan ?? null,
        valorPlan: salud?.valor_plan ?? null,
        adicionalAugeGes: salud?.adicional_auge_ges ?? null,
        tieneApv: apv !== null,
        idInstitucionApv: apv?.id_institucion_apv ?? null,
        idMonedaApv: apv?.id_moneda ?? null,
        montoApv: apv?.monto ?? null,
        idFormaPagoApv: apv?.id_forma_pago_apv ?? null,
        depositoConvenidoApvi: apv?.deposito_convenido_apvi ?? null,
      },
      bancario: {
        idBanco: cuenta?.id_banco ?? null,
        idTipoCuentaBancaria: cuenta?.id_tipo_cuenta_bancaria ?? null,
        numeroCuenta: cuenta?.numero_cuenta ?? '',
      },
    };
  }

  private async ensureContratoId(
    personaId: number,
    payload: CrearEmpleadoPayload,
  ): Promise<number> {
    const { data, error } = await this.supabase
      .from('contrato')
      .select('id_contrato')
      .eq('id_persona', personaId)
      .order('id_contrato', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      throw buildRepositoryError('No fue posible validar el contrato de la ficha.', error.message);
    }

    if (data?.id_contrato) {
      return data.id_contrato;
    }

    const empresaId = await this.obtenerEmpresaIdParaContrato();
    return this.insertarContrato(payload, personaId, empresaId);
  }

  private async actualizarPersonaDesdePayload(
    personaId: number,
    payload: CrearEmpleadoPayload,
  ): Promise<void> {
    const rut = formatRutPartsFromInput(payload.rut);
    const { error } = await this.supabase
      .from('persona')
      .update({
        rut: rut.rut,
        dv: rut.dv,
        nombres: payload.nombres.trim(),
        apellido_paterno: payload.apellidoPaterno.trim(),
        apellido_materno: payload.apellidoMaterno.trim() || null,
        fecha_nacimiento: payload.fechaNacimiento,
        sexo: payload.sexo,
        estado_civil: payload.estadoCivil,
        id_pais: payload.idPais,
        email: payload.email.trim(),
        telefono: payload.telefono.trim(),
        pasaporte: payload.pasaporte,
        id_comuna: payload.idComuna,
        direccion: payload.direccion.trim(),
        numero_direccion: payload.numeroDireccion,
        departamento_direccion: payload.departamentoDireccion,
        observaciones_direccion: payload.observacionesDireccion,
        id_tramo_carga: payload.idTramoCarga,
        cargas: payload.cargas,
      })
      .eq('id_persona', personaId);

    if (error) {
      throw buildRepositoryError('No fue posible guardar los datos generales.', error.message);
    }
  }

  private async actualizarContratoDesdePayload(
    contratoId: number,
    payload: CrearEmpleadoPayload,
  ): Promise<void> {
    const { error } = await this.supabase
      .from('contrato')
      .update({
        id_sucursal: payload.idSucursal,
        id_departamento_empresa: payload.idDepartamentoEmpresa,
        id_tipo_trabajador: payload.idTipoTrabajador,
        id_tipo_jornada: payload.idTipoJornada,
        codigo_tipo_contrato: payload.tipoContrato,
        cargo: payload.cargo.trim(),
        seguro_cesantia: payload.seguroCesantia,
        fecha_inicio: payload.fechaIngreso,
        fecha_contrato: payload.fechaContrato,
        fecha_termino: payload.fechaTermino,
      })
      .eq('id_contrato', contratoId);

    if (error) {
      throw buildRepositoryError('No fue posible guardar los datos laborales.', error.message);
    }
  }

  private async upsertRemuneracionDesdePayload(
    contratoId: number,
    payload: CrearEmpleadoPayload,
  ): Promise<void> {
    const current = (await this.fetchLatestByContrato(
      'remuneracion',
      contratoId,
      'id_remuneracion',
    )) as RemuneracionRow | null;
    const data = buildRemuneracionInsert(payload, contratoId);
    const result = current
      ? await this.supabase
          .from('remuneracion')
          .update(data)
          .eq('id_remuneracion', current.id_remuneracion)
      : await this.supabase.from('remuneracion').insert(data);

    if (result.error) {
      throw buildRepositoryError('No fue posible guardar la remuneracion.', result.error.message);
    }
  }

  private async upsertPrevisionDesdePayload(
    contratoId: number,
    payload: CrearEmpleadoPayload,
  ): Promise<void> {
    const current = (await this.fetchLatestByContrato(
      'prevision',
      contratoId,
      'id_prevision',
    )) as PrevisionRow | null;
    const data = buildPrevisionInsert(payload, contratoId);
    const result = current
      ? await this.supabase.from('prevision').update(data).eq('id_prevision', current.id_prevision)
      : await this.supabase.from('prevision').insert(data);

    if (result.error) {
      throw buildRepositoryError('No fue posible guardar la prevision.', result.error.message);
    }
  }

  private async upsertSaludDesdePayload(
    contratoId: number,
    payload: CrearEmpleadoPayload,
  ): Promise<void> {
    const data = buildSaludTrabajadorInsert(payload, contratoId);
    const current = (await this.fetchLatestByContrato(
      'salud_trabajador',
      contratoId,
      'id_salud_trabajador',
    )) as SaludTrabajadorRow | null;

    if (!data) {
      if (current) {
        await this.supabase
          .from('salud_trabajador')
          .delete()
          .eq('id_salud_trabajador', current.id_salud_trabajador);
      }
      return;
    }

    const result = current
      ? await this.supabase
          .from('salud_trabajador')
          .update(data)
          .eq('id_salud_trabajador', current.id_salud_trabajador)
      : await this.supabase.from('salud_trabajador').insert(data);

    if (result.error) {
      throw buildRepositoryError('No fue posible guardar los datos de salud.', result.error.message);
    }
  }

  private async upsertCuentaBancariaDesdePayload(
    personaId: number,
    payload: CrearEmpleadoPayload,
  ): Promise<void> {
    const { data: current, error } = await this.supabase
      .from('cuenta_bancaria')
      .select('*')
      .eq('id_persona', personaId)
      .order('id_cuenta', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      throw buildRepositoryError('No fue posible validar la cuenta bancaria.', error.message);
    }

    const data = buildCuentaBancariaInsert(payload, personaId);
    const result = current
      ? await this.supabase.from('cuenta_bancaria').update(data).eq('id_cuenta', current.id_cuenta)
      : await this.supabase.from('cuenta_bancaria').insert(data);

    if (result.error) {
      throw buildRepositoryError('No fue posible guardar los datos de pago.', result.error.message);
    }
  }

  private async upsertContratoCentroCostoDesdePayload(
    contratoId: number,
    payload: CrearEmpleadoPayload,
  ): Promise<void> {
    const current = (await this.fetchLatestByContrato(
      'contrato_centro_costo',
      contratoId,
      'id_contrato_centro_costo',
    )) as { id_contrato_centro_costo: number } | null;
    const data = buildContratoCentroCostoInsert(payload, contratoId);

    if (!data) {
      return;
    }

    const result = current
      ? await this.supabase
          .from('contrato_centro_costo')
          .update(data)
          .eq('id_contrato_centro_costo', current.id_contrato_centro_costo)
      : await this.supabase.from('contrato_centro_costo').insert(data);

    if (result.error) {
      throw buildRepositoryError('No fue posible guardar el centro de costo.', result.error.message);
    }
  }

  private async upsertSemanaCorridaDesdePayload(
    contratoId: number,
    payload: CrearEmpleadoPayload,
  ): Promise<void> {
    const data = buildSemanaCorridaInsert(payload, contratoId);
    const current = (await this.fetchLatestByContrato(
      'semana_corrida',
      contratoId,
      'id_semana_corrida',
    )) as SemanaCorridaRow | null;

    if (!data) {
      if (current) {
        await this.supabase
          .from('semana_corrida')
          .delete()
          .eq('id_semana_corrida', current.id_semana_corrida);
      }
      return;
    }

    const result = current
      ? await this.supabase
          .from('semana_corrida')
          .update(data)
          .eq('id_semana_corrida', current.id_semana_corrida)
      : await this.supabase.from('semana_corrida').insert(data);

    if (result.error) {
      throw buildRepositoryError('No fue posible guardar semana corrida.', result.error.message);
    }
  }

  private async upsertZonaExtremaDesdePayload(
    contratoId: number,
    payload: CrearEmpleadoPayload,
  ): Promise<void> {
    const data = buildZonaExtremaInsert(payload, contratoId);
    const current = (await this.fetchLatestByContrato(
      'zona_extrema',
      contratoId,
      'id_zona_extrema',
    )) as ZonaExtremaRow | null;

    if (!data) {
      if (current) {
        await this.supabase
          .from('zona_extrema')
          .delete()
          .eq('id_zona_extrema', current.id_zona_extrema);
      }
      return;
    }

    const result = current
      ? await this.supabase
          .from('zona_extrema')
          .update(data)
          .eq('id_zona_extrema', current.id_zona_extrema)
      : await this.supabase.from('zona_extrema').insert(data);

    if (result.error) {
      throw buildRepositoryError('No fue posible guardar zona extrema.', result.error.message);
    }
  }

  private async upsertCuenta2DesdePayload(
    contratoId: number,
    payload: CrearEmpleadoPayload,
  ): Promise<void> {
    const data = buildCuenta2AfpInsert(payload, contratoId);
    const current = (await this.fetchLatestByContrato(
      'cuenta2_afp',
      contratoId,
      'id_cuenta2_afp',
    )) as Cuenta2AfpRow | null;

    if (!data) {
      if (current) {
        await this.supabase.from('cuenta2_afp').delete().eq('id_cuenta2_afp', current.id_cuenta2_afp);
      }
      return;
    }

    const result = current
      ? await this.supabase
          .from('cuenta2_afp')
          .update(data)
          .eq('id_cuenta2_afp', current.id_cuenta2_afp)
      : await this.supabase.from('cuenta2_afp').insert(data);

    if (result.error) {
      throw buildRepositoryError('No fue posible guardar Cuenta 2.', result.error.message);
    }
  }

  private async upsertApvDesdePayload(contratoId: number, payload: CrearEmpleadoPayload): Promise<void> {
    const data = buildApvInsert(payload, contratoId);
    const current = (await this.fetchLatestByContrato('apv', contratoId, 'id_apv')) as ApvRow | null;

    if (!data) {
      if (current) {
        await this.supabase.from('apv').delete().eq('id_apv', current.id_apv);
      }
      return;
    }

    const result = current
      ? await this.supabase.from('apv').update(data).eq('id_apv', current.id_apv)
      : await this.supabase.from('apv').insert(data);

    if (result.error) {
      throw buildRepositoryError('No fue posible guardar APVI.', result.error.message);
    }
  }

  private async recalcularEstadoFicha(
    personaId: number,
    payload: CrearEmpleadoPayload,
  ): Promise<void> {
    const fichaCompleta = Boolean(
      payload.cargo.trim() &&
        payload.fechaIngreso &&
        payload.idTipoTrabajador &&
        payload.idTipoJornada &&
        payload.sueldoBase > 0 &&
        payload.tipoPrevision &&
        payload.idBanco &&
        payload.idTipoCuentaBancaria &&
        payload.numeroCuenta.trim(),
    );

    const { error } = await this.supabase
      .from('persona')
      .update({
        estado_ficha: fichaCompleta ? 'VALIDO' : 'INCOMPLETO',
        apto_para_remuneraciones: fichaCompleta,
      })
      .eq('id_persona', personaId);

    if (error) {
      throw buildRepositoryError('No fue posible recalcular el estado de ficha.', error.message);
    }
  }

  private async fetchDepartamentos(
    contractIds: Array<number | null>,
  ): Promise<Map<number, string>> {
    const normalizedIds = contractIds.filter((id): id is number => typeof id === 'number');

    if (normalizedIds.length === 0) {
      return new Map<number, string>();
    }

    const { data, error } = await this.supabase
      .from('contrato_centro_costo')
      .select('id_contrato, centro_costo(nombre)')
      .in('id_contrato', normalizedIds);

    if (error) {
      throw buildRepositoryError(
        'No fue posible cargar los departamentos de los empleados.',
        error.message,
      );
    }

    const departamentos = new Map<number, string>();

    for (const row of (data ?? []) as CentroCostoLookupRow[]) {
      if (!departamentos.has(row.id_contrato) && row.centro_costo?.nombre) {
        departamentos.set(row.id_contrato, row.centro_costo.nombre);
      }
    }

    return departamentos;
  }
}

function resumenEstadoDesdePersona(value: PersonaRow['estado']): EmpleadoEstado {
  switch (value) {
    case 'BORRADOR':
      return 'borrador';
    case 'ACTIVO':
      return 'activo';
    case 'SUSPENDIDO':
      return 'suspendido';
    case 'INACTIVO':
      return 'inactivo';
    case 'DESVINCULADO':
      return 'desvinculado';
    case 'BLOQUEADO':
      return 'bloqueado';
    case 'EN_PROCESO':
    default:
      return 'en_proceso';
  }
}

function formatRutPartsFromInput(value: string): RutParts {
  const clean = value.replace(/[^0-9kK]/g, '').toUpperCase();
  const dv = clean.slice(-1);
  const rut = clean.slice(0, -1);

  if (!rut || !dv) {
    throw new Error('RUT invalido.');
  }

  return { rut, dv };
}
