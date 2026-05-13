import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

import { SUPABASE_CLIENT } from '../../../core/services/supabase.service';
import { NominaCalculoSnapshotRepository } from './nomina-calculo-snapshot.repository';

const baseRow = {
  id_calculo_periodo: 1,
  periodo: '2026-05',
  id_empresa: null,
  estado: 'preliminar',
  fecha_generacion: '2026-05-05T10:00:00.000Z',
  usuario_generador: null,
  total_trabajadores: 1,
  total_haberes: 800000,
  total_descuentos: 150000,
  total_liquido: 650000,
  total_bloqueados: 0,
  total_advertencias: 0,
  version_motor: 'MOTOR-03B',
  hash_snapshot: 'fnv1a32:12345678',
  origen: 'preliminar',
  activo: true,
  reemplazado_por: null,
  observacion_anulacion: null,
  created_at: '2026-05-05T10:00:00.000Z',
  updated_at: '2026-05-05T10:00:00.000Z',
  aprobacion_operativa_estado: null,
  aprobacion_operativa_fecha: null,
  aprobacion_operativa_usuario_id: null,
  aprobacion_operativa_usuario_label: null,
  aprobacion_operativa_advertencias: [],
  aprobacion_operativa_metadata: {},
  cierre_operativo_estado: null,
  cierre_operativo_fecha: null,
  cierre_operativo_usuario_id: null,
  cierre_operativo_usuario_label: null,
  cierre_operativo_observacion: null,
  cierre_operativo_metadata: {},
};

const trabajadorRow = {
  id_calculo_trabajador: 10,
  id_calculo_periodo: 1,
  id_persona: 1,
  rut: '11.111.111-1',
  nombre_completo_snapshot: 'Ana Perez',
  estado: 'calculado_preliminar',
  sueldo_base: 800000,
  base_imponible_previsional: 800000,
  base_tributable: 800000,
  total_haberes_imponibles: 800000,
  total_haberes_no_imponibles: 0,
  total_descuentos_legales: 150000,
  total_descuentos_voluntarios: 0,
  impuesto_unico: 0,
  liquido_preliminar: 650000,
  cotizacion_afp: 0,
  cotizacion_salud: 0,
  cotizacion_afc: 0,
  cotizacion_sis: 0,
  cotizacion_sanna: 0,
  cotizacion_ley_16744_empleador: 0,
  created_at: '2026-05-05T10:00:00.000Z',
  updated_at: '2026-05-05T10:00:00.000Z',
};

const conceptoRow = {
  id_calculo_concepto: 20,
  id_calculo_trabajador: 10,
  id_concepto: null,
  tipo: 'haber',
  nombre_concepto_snapshot: 'Sueldo base',
  codigo_lre_snapshot: 'HAB001',
  monto: 800000,
  imponible: true,
  tributable: true,
  afecta_liquido: true,
  origen: 'contrato',
  trazabilidad_json: { fuente: 'contrato' },
  created_at: '2026-05-05T10:00:00.000Z',
};

const issueRow = {
  id_issue: 30,
  id_calculo_periodo: 1,
  id_calculo_trabajador: 10,
  codigo: 'INFO_RESULTADO',
  severidad: 'INFO',
  origen: 'calculo',
  mensaje: 'Informacion guardada.',
  campo: null,
  entidad_id: null,
  created_at: '2026-05-05T10:00:00.000Z',
};

const trazaRow = {
  id_trazabilidad: 40,
  id_calculo_periodo: 1,
  id_calculo_trabajador: 10,
  codigo: 'LIQUIDO_PRELIMINAR',
  origen: 'calculo',
  tabla_fuente: 'resultado',
  campo_fuente: 'liquido',
  vigencia_inicio: null,
  vigencia_fin: null,
  valor_entrada: 800000,
  formula: 'haberes - descuentos',
  valor_resultado: 650000,
  observacion: 'Liquido calculado.',
  created_at: '2026-05-05T10:00:00.000Z',
};

function query(result: unknown) {
  const chain = {
    select: vi.fn(() => chain),
    eq: vi.fn(() => chain),
    in: vi.fn(() => chain),
    is: vi.fn(() => chain),
    insert: vi.fn(() => chain),
    update: vi.fn(() => chain),
    limit: vi.fn(() => chain),
    order: vi.fn(() => chain),
    maybeSingle: vi.fn(() => Promise.resolve({ data: result, error: null })),
    single: vi.fn(() => Promise.resolve({ data: result, error: null })),
    then: vi.fn((resolve: (value: { data: unknown; error: null }) => unknown) =>
      Promise.resolve({ data: result, error: null }).then(resolve),
    ),
  };
  return chain;
}

function snapshotParaGuardar(overrides: Record<string, unknown> = {}) {
  return {
    idCalculoPeriodo: null,
    periodo: '2026-05',
    idEmpresa: null,
    estado: 'preliminar',
    fechaGeneracion: '2026-05-05T10:00:00.000Z',
    usuarioGenerador: null,
    totalTrabajadores: 1,
    totalHaberes: 800000,
    totalDescuentos: 150000,
    totalLiquido: 650000,
    totalBloqueados: 0,
    totalAdvertencias: 1,
    versionMotor: 'MOTOR-03B',
    hashSnapshot: 'fnv1a32:nuevo',
    origen: 'preliminar',
    activo: true,
    reemplazadoPor: null,
    aprobacionOperativa: {
      estado: 'aprobado_operativamente',
      fecha: '2026-05-05T11:00:00.000Z',
      usuarioId: null,
      usuarioLabel: 'rrhh@empresa.cl',
      advertencias: ['No debe copiarse'],
      metadata: { idCalculoPeriodo: 1 },
    },
    trabajadores: [{
      idPersona: 1,
      rut: '11.111.111-1',
      nombreCompletoSnapshot: 'Ana Perez',
      estado: 'calculado_preliminar',
      sueldoBase: 800000,
      baseImponiblePrevisional: 800000,
      baseTributable: 800000,
      totalHaberesImponibles: 800000,
      totalHaberesNoImponibles: 0,
      totalDescuentosLegales: 150000,
      totalDescuentosVoluntarios: 0,
      impuestoUnico: 0,
      liquidoPreliminar: 650000,
      cotizacionAfp: 0,
      cotizacionSalud: 0,
      cotizacionAfc: 0,
      cotizacionSis: 0,
      cotizacionSanna: 0,
      cotizacionLey16744Empleador: 0,
      conceptos: [{
        idConcepto: null,
        tipo: 'haber',
        nombreConceptoSnapshot: 'Sueldo base',
        codigoLreSnapshot: 'HAB001',
        monto: 800000,
        imponible: true,
        tributable: true,
        afectaLiquido: true,
        origen: 'contrato',
        trazabilidadJson: { fuente: 'contrato' },
      }],
      issues: [{
        codigo: 'INFO_RESULTADO',
        severidad: 'INFO',
        origen: 'calculo',
        mensaje: 'Informacion guardada.',
        campo: null,
        entidadId: null,
      }],
      trazabilidad: [{
        codigo: 'LIQUIDO_PRELIMINAR',
        origen: 'calculo',
        tablaFuente: 'resultado',
        campoFuente: 'liquido',
        vigenciaInicio: null,
        vigenciaFin: null,
        valorEntrada: 800000,
        formula: 'haberes - descuentos',
        valorResultado: 650000,
        observacion: 'Liquido calculado.',
      }],
    }],
    issues: [],
    trazabilidad: [],
    ...overrides,
  } as any;
}

describe('NominaCalculoSnapshotRepository', () => {
  it('guarda resultado preliminar mediante RPC atomica con payload completo', async () => {
    const nuevoRow = {
      ...baseRow,
      id_calculo_periodo: 2,
      estado: 'recalculado',
      origen: 'recalculo',
      hash_snapshot: 'fnv1a32:nuevo',
      aprobacion_operativa_estado: null,
      aprobacion_operativa_fecha: null,
      aprobacion_operativa_usuario_label: null,
      aprobacion_operativa_advertencias: [],
      aprobacion_operativa_metadata: {},
    };
    const from = vi.fn()
      .mockReturnValueOnce(query(baseRow))
      .mockReturnValueOnce(query(nuevoRow))
      .mockReturnValueOnce(query([{ ...trabajadorRow, id_calculo_periodo: 2 }]))
      .mockReturnValueOnce(query([conceptoRow]))
      .mockReturnValueOnce(query([issueRow]))
      .mockReturnValueOnce(query([trazaRow]));
    const rpc = vi.fn().mockResolvedValue({ data: 2, error: null });

    TestBed.configureTestingModule({
      providers: [
        NominaCalculoSnapshotRepository,
        {
          provide: SUPABASE_CLIENT,
          useValue: {
            from,
            rpc,
            auth: { getUser: vi.fn() },
          },
        },
      ],
    });

    const repo = TestBed.inject(NominaCalculoSnapshotRepository);
    const guardado = await repo.guardarSnapshotPreliminar(snapshotParaGuardar());
    const rpcPayload = rpc.mock.calls[0][1];

    expect(rpc).toHaveBeenCalledWith('guardar_nomina_calculo_snapshot', expect.any(Object));
    expect(rpcPayload.p_periodo).toBe('2026-05');
    expect(rpcPayload.p_cabecera.version_motor).toBe('MOTOR-03B');
    expect(rpcPayload.p_cabecera.aprobacion_operativa_estado).toBeUndefined();
    expect(rpcPayload.p_trabajadores[0]).toMatchObject({ trabajador_index: 0, id_persona: 1 });
    expect(rpcPayload.p_conceptos[0]).toMatchObject({ trabajador_index: 0, nombre_concepto_snapshot: 'Sueldo base' });
    expect(rpcPayload.p_observaciones[0]).toMatchObject({ trabajador_index: 0, mensaje: 'Informacion guardada.' });
    expect(rpcPayload.p_trazabilidad[0]).toMatchObject({ trabajador_index: 0, codigo: 'LIQUIDO_PRELIMINAR' });
    expect(guardado.snapshot.idCalculoPeriodo).toBe(2);
    expect(guardado.snapshot.aprobacionOperativa).toBeNull();
    expect(guardado.reemplazoSnapshotAnterior).toBe(true);
  });

  it('propaga error controlado si falla la RPC atomica', async () => {
    const from = vi.fn(() => query(baseRow));
    const rpc = vi.fn().mockResolvedValue({ data: null, error: { message: 'violacion fk' } });

    TestBed.configureTestingModule({
      providers: [
        NominaCalculoSnapshotRepository,
        {
          provide: SUPABASE_CLIENT,
          useValue: {
            from,
            rpc,
            auth: { getUser: vi.fn() },
          },
        },
      ],
    });

    const repo = TestBed.inject(NominaCalculoSnapshotRepository);
    await expect(repo.guardarSnapshotPreliminar(snapshotParaGuardar())).rejects.toThrow(
      'No se pudo guardar el resultado preliminar completo. No se realizaron cambios parciales.',
    );
    expect(rpc).toHaveBeenCalledTimes(1);
  });

  it('mapea aprobacion operativa persistida desde nomina_calculo_periodo', async () => {
    const approvedRow = {
      ...baseRow,
      aprobacion_operativa_estado: 'aprobado_operativamente',
      aprobacion_operativa_fecha: '2026-05-05T11:00:00.000Z',
      aprobacion_operativa_usuario_label: 'rrhh@empresa.cl',
      aprobacion_operativa_advertencias: ['Advertencia visible'],
      aprobacion_operativa_metadata: { idCalculoPeriodo: 1 },
    };
    TestBed.configureTestingModule({
      providers: [
        NominaCalculoSnapshotRepository,
        {
          provide: SUPABASE_CLIENT,
          useValue: {
            from: vi.fn(() => query(approvedRow)),
            auth: { getUser: vi.fn() },
          },
        },
      ],
    });

    const repo = TestBed.inject(NominaCalculoSnapshotRepository);
    const snapshot = await repo.obtenerSnapshotActivo('2026-05');

    expect(snapshot?.aprobacionOperativa?.estado).toBe('aprobado_operativamente');
    expect(snapshot?.aprobacionOperativa?.usuarioLabel).toBe('rrhh@empresa.cl');
    expect(snapshot?.aprobacionOperativa?.advertencias).toEqual(['Advertencia visible']);
  });

  it('llama RPC cerrar_nomina_operativa con parametros correctos y mapea cierre', async () => {
    const cerradoRow = {
      ...baseRow,
      cierre_operativo_estado: 'cerrado_operativamente',
      cierre_operativo_fecha: '2026-05-05T12:00:00.000Z',
      cierre_operativo_usuario_id: '00000000-0000-0000-0000-000000000001',
      cierre_operativo_usuario_label: 'rrhh@empresa.cl',
      cierre_operativo_observacion: 'Cierre E2E',
      cierre_operativo_metadata: { periodo: '2026-05' },
    };
    const rpc = vi.fn().mockResolvedValue({ data: cerradoRow, error: null });

    TestBed.configureTestingModule({
      providers: [
        NominaCalculoSnapshotRepository,
        {
          provide: SUPABASE_CLIENT,
          useValue: {
            from: vi.fn(),
            rpc,
            auth: { getUser: vi.fn() },
          },
        },
      ],
    });

    const repo = TestBed.inject(NominaCalculoSnapshotRepository);
    const snapshot = await repo.cerrarNominaOperativa({
      idCalculoPeriodo: 1,
      periodo: '2026-05',
      observacion: 'Cierre E2E',
      metadata: { totalTrabajadores: 1 },
    });

    expect(rpc).toHaveBeenCalledWith('cerrar_nomina_operativa', {
      p_id_calculo_periodo: 1,
      p_periodo: '2026-05',
      p_observacion: 'Cierre E2E',
      p_metadata: { totalTrabajadores: 1 },
    });
    expect(snapshot.cierreOperativo?.estado).toBe('cerrado_operativamente');
    expect(snapshot.cierreOperativo?.usuarioLabel).toBe('rrhh@empresa.cl');
  });

  it('sanitiza error operativo si falla RPC de cierre', async () => {
    const rpc = vi.fn().mockResolvedValue({ data: null, error: { message: 'detalle sql sensible' } });
    TestBed.configureTestingModule({
      providers: [
        NominaCalculoSnapshotRepository,
        {
          provide: SUPABASE_CLIENT,
          useValue: {
            from: vi.fn(),
            rpc,
            auth: { getUser: vi.fn() },
          },
        },
      ],
    });

    const repo = TestBed.inject(NominaCalculoSnapshotRepository);
    await expect(repo.cerrarNominaOperativa({ idCalculoPeriodo: 1, periodo: '2026-05' })).rejects.toThrow(
      'No se pudo cerrar operativamente la nomina. No se realizaron cambios parciales.',
    );
  });

  it('persiste aprobacion por id_calculo_periodo activo y retorna la aprobacion guardada', async () => {
    const updatePayloads: unknown[] = [];
    const updatedRow = {
      ...baseRow,
      aprobacion_operativa_estado: 'aprobado_operativamente',
      aprobacion_operativa_fecha: '2026-05-05T11:00:00.000Z',
      aprobacion_operativa_usuario_id: '00000000-0000-0000-0000-000000000001',
      aprobacion_operativa_usuario_label: 'rrhh@empresa.cl',
      aprobacion_operativa_advertencias: ['Advertencia visible'],
      aprobacion_operativa_metadata: { idCalculoPeriodo: 1 },
    };
    const selectQuery = query(baseRow);
    const updateQuery = {
      ...query(updatedRow),
      update: vi.fn((payload: unknown) => {
        updatePayloads.push(payload);
        return updateQuery;
      }),
    };
    const from = vi.fn()
      .mockReturnValueOnce(selectQuery)
      .mockReturnValueOnce(updateQuery);

    TestBed.configureTestingModule({
      providers: [
        NominaCalculoSnapshotRepository,
        {
          provide: SUPABASE_CLIENT,
          useValue: {
            from,
            auth: {
              getUser: vi.fn().mockResolvedValue({
                data: { user: { id: '00000000-0000-0000-0000-000000000001', email: 'rrhh@empresa.cl' } },
                error: null,
              }),
            },
          },
        },
      ],
    });

    const repo = TestBed.inject(NominaCalculoSnapshotRepository);
    const snapshot = await repo.aprobarResultadoPreliminarOperativamente({
      idCalculoPeriodo: 1,
      periodo: '2026-05',
      advertencias: ['Advertencia visible'],
    });

    expect(from).toHaveBeenCalledWith('nomina_calculo_periodo');
    expect(updatePayloads[0]).toMatchObject({
      aprobacion_operativa_estado: 'aprobado_operativamente',
      aprobacion_operativa_usuario_id: '00000000-0000-0000-0000-000000000001',
      aprobacion_operativa_usuario_label: 'rrhh@empresa.cl',
      aprobacion_operativa_advertencias: ['Advertencia visible'],
    });
    expect(snapshot.aprobacionOperativa?.estado).toBe('aprobado_operativamente');
  });

  it('consulta snapshot completo activo por periodo sin recalcular', async () => {
    const from = vi.fn()
      .mockReturnValueOnce(query(baseRow))
      .mockReturnValueOnce(query(baseRow))
      .mockReturnValueOnce(query([trabajadorRow]))
      .mockReturnValueOnce(query([conceptoRow]))
      .mockReturnValueOnce(query([issueRow]))
      .mockReturnValueOnce(query([trazaRow]));
    TestBed.configureTestingModule({
      providers: [
        NominaCalculoSnapshotRepository,
        {
          provide: SUPABASE_CLIENT,
          useValue: {
            from,
            auth: { getUser: vi.fn() },
          },
        },
      ],
    });

    const repo = TestBed.inject(NominaCalculoSnapshotRepository);
    const completo = await repo.obtenerSnapshotCompletoActivo('2026-05');

    expect(from).toHaveBeenCalledWith('nomina_calculo_periodo');
    expect(from).toHaveBeenCalledWith('nomina_calculo_trabajador');
    expect(from).toHaveBeenCalledWith('nomina_calculo_concepto');
    expect(from).toHaveBeenCalledWith('nomina_calculo_issue');
    expect(from).toHaveBeenCalledWith('nomina_calculo_trazabilidad');
    expect(completo?.cabecera.periodo).toBe('2026-05');
    expect(completo?.trabajadores[0].nombreCompletoSnapshot).toBe('Ana Perez');
    expect(completo?.trabajadores[0].conceptos[0].nombreConceptoSnapshot).toBe('Sueldo base');
    expect(completo?.observaciones[0].mensaje).toBe('Informacion guardada.');
    expect(completo?.trazabilidad[0].codigo).toBe('LIQUIDO_PRELIMINAR');
    expect(completo?.resumen.totalConceptos).toBe(1);
  });

  it('consulta snapshot completo por id_calculo_periodo', async () => {
    const from = vi.fn()
      .mockReturnValueOnce(query(baseRow))
      .mockReturnValueOnce(query([trabajadorRow]))
      .mockReturnValueOnce(query([]))
      .mockReturnValueOnce(query([]))
      .mockReturnValueOnce(query([]));
    TestBed.configureTestingModule({
      providers: [
        NominaCalculoSnapshotRepository,
        {
          provide: SUPABASE_CLIENT,
          useValue: {
            from,
            auth: { getUser: vi.fn() },
          },
        },
      ],
    });

    const repo = TestBed.inject(NominaCalculoSnapshotRepository);
    const completo = await repo.obtenerSnapshotCompletoPorId(1);

    expect(completo?.cabecera.idCalculoPeriodo).toBe(1);
    expect(completo?.trabajadores.length).toBe(1);
  });

  it('retorna null si no existe snapshot completo por id', async () => {
    TestBed.configureTestingModule({
      providers: [
        NominaCalculoSnapshotRepository,
        {
          provide: SUPABASE_CLIENT,
          useValue: {
            from: vi.fn(() => query(null)),
            auth: { getUser: vi.fn() },
          },
        },
      ],
    });

    const repo = TestBed.inject(NominaCalculoSnapshotRepository);
    await expect(repo.obtenerSnapshotCompletoPorId(99)).resolves.toBeNull();
  });

  it('maneja error de Supabase al consultar snapshot completo', async () => {
    const failing = query(null);
    (failing as any).maybeSingle = vi.fn(() => Promise.resolve({ data: null, error: { message: 'red' } }));
    TestBed.configureTestingModule({
      providers: [
        NominaCalculoSnapshotRepository,
        {
          provide: SUPABASE_CLIENT,
          useValue: {
            from: vi.fn(() => failing),
            auth: { getUser: vi.fn() },
          },
        },
      ],
    });

    const repo = TestBed.inject(NominaCalculoSnapshotRepository);
    await expect(repo.obtenerSnapshotCompletoPorId(1)).rejects.toThrow('No fue posible consultar el resultado guardado');
  });
});
