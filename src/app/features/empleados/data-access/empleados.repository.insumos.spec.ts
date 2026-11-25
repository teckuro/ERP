import { TestBed } from '@angular/core/testing';
import { describe, expect, it, vi } from 'vitest';

import { EmpresaActivaService } from '../../../core/services/empresa-activa.service';
import { SUPABASE_CLIENT } from '../../../core/services/supabase.service';
import { EmpleadosRepository } from './empleados.repository';

/** Filas de un trabajador tal como las devuelve la base (datos ficticios). */
const FILAS = {
  vw_persona_factores: {
    id_persona: 2,
    id_contrato: 20,
    rut: '11111111',
    dv: '1',
    nombres: 'Ana',
    apellido_paterno: 'Rojas',
    apellido_materno: 'Soto',
    cargo: 'Analista',
    fingreso: '2024-01-15',
    base: 900000,
    estado: 'activo',
    estado_contrato: 'VIGENTE',
    estado_ficha: 'VALIDO',
    apto_para_remuneraciones: true,
  },
  persona: {
    id_persona: 2,
    rut: '11111111',
    dv: '1',
    nombres: 'Ana',
    apellido_paterno: 'Rojas',
    apellido_materno: 'Soto',
    fecha_nacimiento: '1990-03-02',
    sexo: 'F',
    id_estado_civil: 1,
    id_nacionalidad: 1,
    email: 'ana@example.test',
    paso_alta_avanzada: null,
  },
  contrato: {
    id_contrato: 20,
    id_persona: 2,
    id_empresa: 1,
    fecha_inicio: '2024-01-15',
    fecha_termino: null,
    cargo: 'Analista',
    id_tipo_contrato: 1,
    id_tipo_jornada: 1,
    relacion_laboral: 'DEPENDIENTE',
  },
  cuenta_bancaria: { id_cuenta: 7, id_persona: 2, id_banco: 1, id_tipo_cuenta: 1, numero_cuenta: '123' },
  remuneracion: { id_remuneracion: 30, id_contrato: 20, sueldo_base: 900000, tipo_gratificacion: 'ART_50' },
  prevision: { id_prevision: 40, id_contrato: 20, id_afp: 3, id_regimen: 1 },
  salud_trabajador: { id_salud_trabajador: 50, id_contrato: 20, id_institucion_salud: 1, plan_uf: null },
  contrato_centro_costo: { id_contrato_centro_costo: 60, id_contrato: 20, id_centro_costo: 4 },
  semana_corrida: { id_semana_corrida: 70, id_contrato: 20, aplica: false },
  zona_extrema: null,
  apv: null,
  cuenta2_afp: null,
  condicion: {
    id_tipo_condicion_trabajador: 9,
    vigencia_inicio: '2025-01-01',
    vigencia_fin: null,
    respaldo_registrado: true,
    observacion: 'Turno noche',
  },
};

/** Builder encadenable mínimo: `maybeSingle()` da la primera fila; `await` da todas. */
function crearSupabaseFalso(tablas: Record<string, unknown[]>, rpc = vi.fn()) {
  const from = (tabla: string) => {
    const filas = tablas[tabla] ?? [];
    const builder: Record<string, unknown> = {};
    for (const metodo of ['select', 'eq', 'in', 'order', 'limit', 'not', 'is', 'or']) {
      builder[metodo] = () => builder;
    }
    builder['maybeSingle'] = async () => ({ data: filas[0] ?? null, error: null });
    builder['then'] = (ok: (v: unknown) => unknown, fallo: (e: unknown) => unknown) =>
      Promise.resolve({ data: filas, error: null }).then(ok, fallo);
    return builder;
  };
  return { from, rpc };
}

function crearRepositorio(cliente: unknown): EmpleadosRepository {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers: [
      EmpleadosRepository,
      { provide: SUPABASE_CLIENT, useValue: cliente },
      { provide: EmpresaActivaService, useValue: {} },
    ],
  });
  return TestBed.inject(EmpleadosRepository);
}

describe('EmpleadosRepository: insumos congelados (NOM-INSUMOS-01)', () => {
  it('arma la misma ficha desde los insumos congelados que desde la lectura en vivo', async () => {
    const enVivo = crearRepositorio(
      crearSupabaseFalso({
        vw_persona_factores: [FILAS.vw_persona_factores],
        persona: [FILAS.persona],
        contrato: [FILAS.contrato],
        cuenta_bancaria: [FILAS.cuenta_bancaria],
        remuneracion: [FILAS.remuneracion],
        prevision: [FILAS.prevision],
        salud_trabajador: [FILAS.salud_trabajador],
        contrato_centro_costo: [{ ...FILAS.contrato_centro_costo, centro_costo: { nombre: 'Operaciones' } }],
        semana_corrida: [FILAS.semana_corrida],
        persona_condicion_trabajador: [FILAS.condicion],
        tipo_condicion_trabajador: [{ id_tipo_condicion_trabajador: 9, codigo: 'NOCTURNO' }],
        empleado_historial: [],
      }),
    );
    const fichaEnVivo = await enVivo.obtenerPorId(2);

    const rpc = vi.fn().mockResolvedValue({
      data: [
        {
          id_persona: 2,
          datos: {
            resumen: FILAS.vw_persona_factores,
            departamento: 'Operaciones',
            persona: FILAS.persona,
            contrato: FILAS.contrato,
            cuenta_bancaria: FILAS.cuenta_bancaria,
            remuneracion: FILAS.remuneracion,
            prevision: FILAS.prevision,
            salud_trabajador: FILAS.salud_trabajador,
            contrato_centro_costo: FILAS.contrato_centro_costo,
            semana_corrida: FILAS.semana_corrida,
            zona_extrema: null,
            apv: null,
            cuenta2_afp: null,
            condiciones: [
              {
                codigo: 'NOCTURNO',
                vigencia_inicio: FILAS.condicion.vigencia_inicio,
                vigencia_fin: FILAS.condicion.vigencia_fin,
                respaldo_registrado: FILAS.condicion.respaldo_registrado,
                observacion: FILAS.condicion.observacion,
              },
            ],
          },
        },
      ],
      error: null,
    });
    const congelado = crearRepositorio(crearSupabaseFalso({}, rpc));
    const fichasCongeladas = await congelado.congelarFichasNomina('nom-1');

    expect(rpc).toHaveBeenCalledWith('congelar_insumos_nomina', { p_nomina_periodo_id: 'nom-1' });
    expect(fichaEnVivo).not.toBeNull();
    expect(fichasCongeladas).toEqual([{ ...fichaEnVivo!, historial: [] }]);
  });

  it('descarta insumos sin persona o sin resumen', async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: [{ id_persona: 3, datos: { resumen: null, persona: null } }],
      error: null,
    });
    const repository = crearRepositorio(crearSupabaseFalso({}, rpc));

    await expect(repository.congelarFichasNomina('nom-1')).resolves.toEqual([]);
  });

  it('propaga un error de la RPC', async () => {
    const rpc = vi.fn().mockResolvedValue({ data: null, error: { message: 'boom' } });
    const repository = crearRepositorio(crearSupabaseFalso({}, rpc));

    await expect(repository.congelarFichasNomina('nom-1')).rejects.toThrow(
      /No fue posible congelar los datos de los trabajadores de la nómina/,
    );
  });
});
