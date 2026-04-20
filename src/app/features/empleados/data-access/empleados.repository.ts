import { Injectable } from '@angular/core';

import { Tables } from '../../../core/models/database.types';
import { injectSupabase } from '../../../core/services/supabase.service';
import { EmpleadoFormCatalogos } from '../models/empleado-catalogos.model';
import { EmpleadoEstado, EmpleadoListado } from '../models/empleado-listado.model';
import { CrearEmpleadoPayload } from '../models/empleado-payload.model';
import {
  mapCatalog,
  mapDepartamentosCatalog,
  mapSaludCatalog,
  pickLatestTramosCarga,
} from '../mappers/empleado-catalogos.mapper';
import {
  mapEmpleadoEstadoToPersonaEstado,
  mapPersonaFactorToEmpleado,
} from '../mappers/empleado-listado.mapper';
import {
  buildApvInsert,
  buildContratoCentroCostoInsert,
  buildContratoInsert,
  buildCuenta2AfpInsert,
  buildCuentaBancariaInsert,
  buildPersonaInsert,
  buildPrevisionInsert,
  buildRemuneracionInsert,
  buildSaludTrabajadorInsert,
  buildSemanaCorridaInsert,
  buildZonaExtremaInsert,
  mapCreatedEmpleado,
} from '../mappers/empleado-write.mapper';
import { formatRutParts, parseRut } from '../utils/empleado-rut';
import {
  buildForeignKeyError,
  buildRepositoryError,
  EmpleadoReferenciaInvalidaError,
  EmpleadoRutDuplicadoError,
  isUniqueConstraintError,
} from '../utils/empleados-repository-errors';

type PersonaFactorRow = Tables<'vw_persona_factores'>;
type CentroCostoRow = Tables<'centro_costo'>;

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
      this.supabase.from('comuna').select('id_comuna,nombre').order('nombre', { ascending: true }),
      this.supabase.from('pais').select('id_pais,nombre').order('nombre', { ascending: true }),
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
        'id_persona,id_contrato,rut,dv,nombres,apellido_paterno,apellido_materno,cargo,fingreso,base,estado,estado_contrato',
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

  async obtenerPorId(id: number): Promise<EmpleadoListado | null> {
    const { data, error } = await this.supabase
      .from('vw_persona_factores')
      .select(
        'id_persona,id_contrato,rut,dv,nombres,apellido_paterno,apellido_materno,cargo,fingreso,base,estado,estado_contrato',
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

    return mapPersonaFactorToEmpleado(
      data as PersonaFactorRow & { id_persona: number },
      departamentos,
    );
  }

  async actualizarEstadoPersonas(ids: number[], estado: EmpleadoEstado): Promise<number[]> {
    const normalizedIds = [...new Set(ids)].filter((id) => Number.isInteger(id));

    if (normalizedIds.length === 0) {
      return [];
    }

    const { data, error } = await this.supabase
      .from('persona')
      .update({ estado: mapEmpleadoEstadoToPersonaEstado(estado) })
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

  async crear(payload: CrearEmpleadoPayload): Promise<EmpleadoListado> {
    const rut = parseRut(payload.rut);
    const empresaId = await this.fetchEmpresaId();

    let personaId: number | null = null;
    let contratoId: number | null = null;

    try {
      const { data: persona, error: personaError } = await this.supabase
        .from('persona')
        .insert(buildPersonaInsert(payload, rut))
        .select('id_persona')
        .single();

      if (personaError) {
        if (isUniqueConstraintError(personaError, 'persona_rut_key')) {
          throw new EmpleadoRutDuplicadoError(formatRutParts(rut));
        }

        const foreignKeyError = buildForeignKeyError(
          personaError,
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

        throw buildRepositoryError(
          'No fue posible crear la persona en Supabase.',
          personaError.message,
        );
      }

      personaId = persona.id_persona;

      const { data: contrato, error: contratoError } = await this.supabase
        .from('contrato')
        .insert(buildContratoInsert(payload, personaId, empresaId))
        .select('id_contrato')
        .single();

      if (contratoError) {
        const foreignKeyError = buildForeignKeyError(
          contratoError,
          {
            contrato_id_persona_fkey:
              'No fue posible asociar el contrato a la ficha del colaborador.',
            contrato_id_empresa_fkey: 'La empresa configurada para el contrato no esta disponible.',
            contrato_id_sucursal_fkey: 'La sucursal seleccionada no esta disponible.',
            contrato_id_departamento_empresa_fkey:
              'El departamento seleccionado no esta disponible.',
            contrato_id_tipo_trabajador_fkey:
              'El tipo de trabajador seleccionado no esta disponible.',
            contrato_id_tipo_jornada_fkey: 'El tipo de jornada seleccionado no esta disponible.',
          },
          'No fue posible validar los datos laborales seleccionados para la ficha.',
        );

        if (foreignKeyError) {
          throw foreignKeyError;
        }

        throw buildRepositoryError(
          'No fue posible crear el contrato en Supabase.',
          contratoError.message,
        );
      }

      contratoId = contrato.id_contrato;

      const { error: remuneracionError } = await this.supabase
        .from('remuneracion')
        .insert(buildRemuneracionInsert(payload, contratoId));

      if (remuneracionError) {
        const foreignKeyError = buildForeignKeyError(
          remuneracionError,
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
          remuneracionError.message,
        );
      }

      const { error: previsionError } = await this.supabase
        .from('prevision')
        .insert(buildPrevisionInsert(payload, contratoId));

      if (previsionError) {
        const foreignKeyError = buildForeignKeyError(
          previsionError,
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
          previsionError.message,
        );
      }

      const saludTrabajadorInsert = buildSaludTrabajadorInsert(payload, contratoId);
      if (saludTrabajadorInsert) {
        const { error: saludError } = await this.supabase
          .from('salud_trabajador')
          .insert(saludTrabajadorInsert);

        if (saludError) {
          const foreignKeyError = buildForeignKeyError(
            saludError,
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

          throw buildRepositoryError(
            'No fue posible registrar la salud del empleado.',
            saludError.message,
          );
        }
      }

      const cuenta2Insert = buildCuenta2AfpInsert(payload, contratoId);
      if (cuenta2Insert) {
        const { error: cuenta2Error } = await this.supabase
          .from('cuenta2_afp')
          .insert(cuenta2Insert);

        if (cuenta2Error) {
          const foreignKeyError = buildForeignKeyError(
            cuenta2Error,
            {
              cuenta2_afp_id_contrato_fkey:
                'No fue posible asociar la Cuenta 2 al contrato del colaborador.',
              cuenta2_afp_id_moneda_fkey:
                'La moneda seleccionada para Cuenta 2 no esta disponible.',
            },
            'No fue posible validar los datos de Cuenta 2 seleccionados.',
          );

          if (foreignKeyError) {
            throw foreignKeyError;
          }

          throw buildRepositoryError(
            'No fue posible registrar la Cuenta 2 del empleado.',
            cuenta2Error.message,
          );
        }
      }

      const semanaCorridaInsert = buildSemanaCorridaInsert(payload, contratoId);
      if (semanaCorridaInsert) {
        const { error: semanaCorridaError } = await this.supabase
          .from('semana_corrida')
          .insert(semanaCorridaInsert);

        if (semanaCorridaError) {
          const foreignKeyError = buildForeignKeyError(
            semanaCorridaError,
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
            semanaCorridaError.message,
          );
        }
      }

      const zonaExtremaInsert = buildZonaExtremaInsert(payload, contratoId);
      if (zonaExtremaInsert) {
        const { error: zonaExtremaError } = await this.supabase
          .from('zona_extrema')
          .insert(zonaExtremaInsert);

        if (zonaExtremaError) {
          const foreignKeyError = buildForeignKeyError(
            zonaExtremaError,
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
            zonaExtremaError.message,
          );
        }
      }

      const apvInsert = buildApvInsert(payload, contratoId);
      if (apvInsert) {
        const { error: apvError } = await this.supabase.from('apv').insert(apvInsert);

        if (apvError) {
          const foreignKeyError = buildForeignKeyError(
            apvError,
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

          throw buildRepositoryError(
            'No fue posible registrar el APVI del empleado.',
            apvError.message,
          );
        }
      }

      const { error: cuentaBancariaError } = await this.supabase
        .from('cuenta_bancaria')
        .insert(buildCuentaBancariaInsert(payload, personaId));

      if (cuentaBancariaError) {
        const foreignKeyError = buildForeignKeyError(
          cuentaBancariaError,
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
          cuentaBancariaError.message,
        );
      }

      const centroCostoInsert = buildContratoCentroCostoInsert(payload, contratoId);
      if (centroCostoInsert) {
        const { error: centroCostoError } = await this.supabase
          .from('contrato_centro_costo')
          .insert(centroCostoInsert);

        if (centroCostoError) {
          const foreignKeyError = buildForeignKeyError(
            centroCostoError,
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
            centroCostoError.message,
          );
        }
      }

      const departamento = await this.fetchCentroCostoNombre(payload.idCentroCosto);

      return mapCreatedEmpleado(payload, personaId!, rut, departamento);
    } catch (error) {
      await this.rollbackCreate(contratoId, personaId);
      throw error;
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

  private async fetchEmpresaId(): Promise<number> {
    const { data, error } = await this.supabase
      .from('empresa')
      .select('id_empresa')
      .order('id_empresa', { ascending: true })
      .limit(1)
      .single();

    if (error || !data) {
      throw buildRepositoryError(
        'No se encontro una empresa configurada para crear contratos.',
        error?.message,
      );
    }

    return data.id_empresa;
  }

  private async fetchCentroCostoNombre(id: number | null): Promise<string | null> {
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

  private async rollbackCreate(contratoId: number | null, personaId: number | null): Promise<void> {
    if (contratoId !== null) {
      await this.supabase.from('contrato').delete().eq('id_contrato', contratoId);
    }

    if (personaId !== null) {
      await this.supabase.from('persona').delete().eq('id_persona', personaId);
    }
  }
}
