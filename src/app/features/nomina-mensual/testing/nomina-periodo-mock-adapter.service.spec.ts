import { describe, expect, it } from 'vitest';

import type {
  AccionMasivaTrabajadores,
  MovimientoNomina,
} from '../models/movimiento-nomina.models';
import type {
  FilaTrabajadorNominaResumen,
  FiltroRapidoDotacion,
} from '../models/nomina-periodo.models';
import { NominaPeriodoMockAdapterService } from './nomina-periodo-mock-adapter.service';

const NOMINA_ID = 'nom-2026-06-001';

function nuevoAdapter(): NominaPeriodoMockAdapterService {
  return new NominaPeriodoMockAdapterService();
}

describe('NominaPeriodoMockAdapterService — Aplicación de recurrentes', () => {
  it('Test 6 — aplicarRecurrentesANomina aplica los recurrentes activos', () => {
    const adapter = nuevoAdapter();

    const movimientosGenerados = adapter.aplicarRecurrentesANomina(NOMINA_ID);

    expect(movimientosGenerados.length).toBeGreaterThan(0);
    expect(movimientosGenerados.every((m) => m.origen === 'recurrente')).toBe(true);
    expect(movimientosGenerados.every((m) => m.estado === 'aplicado')).toBe(true);
    expect(movimientosGenerados.every((m) => !!m.recurrenteId)).toBe(true);
  });

  it('Test 7 — aplicarRecurrentesANomina dos veces NO duplica MovimientoNomina (idempotencia)', () => {
    const adapter = nuevoAdapter();

    const primera = adapter.aplicarRecurrentesANomina(NOMINA_ID);
    const totalDespuesPrimera = primera.length;

    const nominaTrasPrimera = adapter.obtenerNomina(NOMINA_ID)!;
    const totalMovsTrasPrimera = nominaTrasPrimera.movimientos.length;

    const segunda = adapter.aplicarRecurrentesANomina(NOMINA_ID);
    const nominaTrasSegunda = adapter.obtenerNomina(NOMINA_ID)!;

    expect(segunda.length).toBe(totalDespuesPrimera);
    expect(nominaTrasSegunda.movimientos.length).toBe(totalMovsTrasPrimera);
  });

  it('Test 8 — aplicarRecurrentesANomina NO reaplica un recurrente con estado="omitido"', () => {
    const adapter = nuevoAdapter();
    const nomina = adapter.obtenerNomina(NOMINA_ID)!;

    const movOmitido: MovimientoNomina = {
      id: 'mov-omitido-test',
      nominaPeriodoId: NOMINA_ID,
      trabajadorId: 'trab-001',
      segmentoId: 'seg-001',
      tipo: 'bono-gerencia',
      categoria: 'haber',
      monto: 250000,
      unidad: 'pesos',
      origen: 'recurrente',
      recurrenteId: 'rec-001',
      estado: 'omitido',
      createdAt: '2026-06-01T00:00:00.000Z',
      updatedAt: '2026-06-01T00:00:00.000Z',
    };
    nomina.movimientos = nomina.movimientos.filter((m) => m.recurrenteId !== 'rec-001');
    nomina.movimientos.push(movOmitido);

    adapter.aplicarRecurrentesANomina(NOMINA_ID);

    const tras = adapter.obtenerNomina(NOMINA_ID)!;
    const movsRec001ParaTrab001 = tras.movimientos.filter(
      (m) => m.recurrenteId === 'rec-001' && m.trabajadorId === 'trab-001',
    );
    expect(movsRec001ParaTrab001.length).toBe(1);
    expect(movsRec001ParaTrab001[0]!.estado).toBe('omitido');
  });
});

describe('NominaPeriodoMockAdapterService — Aplicación por criterio', () => {
  it('Test 9 — aplicarRecurrentePorCriterio por trabajador afecta solo a ese trabajador', () => {
    const adapter = nuevoAdapter();
    const generados = adapter.aplicarRecurrentePorCriterio(
      { tipo: 'trabajador', trabajadorId: 'trab-007' },
      NOMINA_ID,
      'rec-003',
    );
    expect(generados).toHaveLength(1);
    expect(generados[0]!.trabajadorId).toBe('trab-007');
    expect(generados[0]!.recurrenteId).toBe('rec-003');
  });

  it('Test 10 — aplicarRecurrentePorCriterio por segmento afecta a todos los del segmento', () => {
    const adapter = nuevoAdapter();
    const nomina = adapter.obtenerNomina(NOMINA_ID)!;
    const segmento = nomina.segmentos.find((s) => s.id === 'seg-002')!;
    const previos = nomina.movimientos.filter(
      (m) => m.recurrenteId === 'rec-002' && m.estado === 'aplicado',
    ).length;

    const generados = adapter.aplicarRecurrentePorCriterio(
      { tipo: 'segmento', segmentoId: 'seg-002' },
      NOMINA_ID,
      'rec-002',
    );

    expect(generados.length + previos).toBe(segmento.trabajadorIds.length);
    expect(generados.every((m) => segmento.trabajadorIds.includes(m.trabajadorId))).toBe(true);
  });

  it('Test 11 — aplicarRecurrentePorCriterio por centro de costo filtra por centroCosto', () => {
    const adapter = nuevoAdapter();
    const generados = adapter.aplicarRecurrentePorCriterio(
      { tipo: 'centro-costo', centroCostoId: 'cc-norte' },
      NOMINA_ID,
      'rec-003',
    );
    expect(generados.length).toBeGreaterThan(0);
    expect(generados.every((m) => !!m.trabajadorId)).toBe(true);
  });

  it('Test 12 — aplicarRecurrentePorCriterio por cargo filtra por cargo', () => {
    const adapter = nuevoAdapter();
    const generados = adapter.aplicarRecurrentePorCriterio(
      { tipo: 'cargo', cargoId: 'Supervisor obra' },
      NOMINA_ID,
      'rec-004',
    );
    expect(generados.length).toBeGreaterThan(0);
    expect(generados.every((m) => m.recurrenteId === 'rec-004')).toBe(true);
  });

  it('Test 13 — aplicarRecurrentePorCriterio por tipo de contrato es exhaustivo (mock vacío)', () => {
    const adapter = nuevoAdapter();
    const generados = adapter.aplicarRecurrentePorCriterio(
      { tipo: 'tipo-contrato', tipoContratoId: 'contrato-plazo-fijo' },
      NOMINA_ID,
      'rec-005',
    );
    expect(generados).toEqual([]);
  });

  it('Test 14 — aplicarRecurrentePorCriterio por grupo es exhaustivo (mock vacío)', () => {
    const adapter = nuevoAdapter();
    const generados = adapter.aplicarRecurrentePorCriterio(
      { tipo: 'grupo', grupoId: 'grupo-sindicato' },
      NOMINA_ID,
      'rec-006',
    );
    expect(generados).toEqual([]);
  });
});

describe('NominaPeriodoMockAdapterService — Filtros y paginación de Dotación', () => {
  it('Test 15 — filtrarDotacion con conIncidencias=true retorna solo trabajadores con incidencias', () => {
    const adapter = nuevoAdapter();
    const { filas } = adapter.filtrarDotacion(
      NOMINA_ID,
      { conIncidencias: true },
      { page: 1, pageSize: 100, total: 0 },
    );
    expect(filas.length).toBeGreaterThan(0);
    expect(
      filas.every((f) => f.totalIncidenciasCriticas + f.totalAdvertencias > 0),
    ).toBe(true);
  });

  it('Test 16 — filtrarDotacion paginación: pageSize 10 limita filas y total refleja sin paginar', () => {
    const adapter = nuevoAdapter();
    const { filas, total } = adapter.filtrarDotacion(
      NOMINA_ID,
      {},
      { page: 1, pageSize: 10, total: 0 },
    );
    expect(filas.length).toBe(10);
    expect(total).toBe(24);

    const segundaPagina = adapter.filtrarDotacion(
      NOMINA_ID,
      {},
      { page: 2, pageSize: 10, total: 0 },
    );
    expect(segundaPagina.filas.length).toBe(10);
    expect(segundaPagina.total).toBe(24);

    const terceraPagina = adapter.filtrarDotacion(
      NOMINA_ID,
      {},
      { page: 3, pageSize: 10, total: 0 },
    );
    expect(terceraPagina.filas.length).toBe(4);
    expect(terceraPagina.total).toBe(24);
  });

  it('Test 17 — filtrarDotacion NO retorna detalle completo (shape de FilaTrabajadorNominaResumen)', () => {
    const adapter = nuevoAdapter();
    const { filas } = adapter.filtrarDotacion(
      NOMINA_ID,
      {},
      { page: 1, pageSize: 5, total: 0 },
    );
    const fila = filas[0]!;
    const clavesPermitidas: Array<keyof FilaTrabajadorNominaResumen> = [
      'trabajadorId',
      'nombre',
      'rut',
      'cargo',
      'centroCosto',
      'segmentoId',
      'estado',
      'totalIncidenciasCriticas',
      'totalAdvertencias',
      'totalMovimientos',
      'tieneDatosBancarios',
      'tieneDatosPrevisionales',
    ];
    for (const clave of Object.keys(fila) as Array<keyof FilaTrabajadorNominaResumen>) {
      expect(clavesPermitidas).toContain(clave);
    }
    expect((fila as unknown as Record<string, unknown>)['movimientos']).toBeUndefined();
    expect((fila as unknown as Record<string, unknown>)['incidencias']).toBeUndefined();
    expect((fila as unknown as Record<string, unknown>)['datosBancarios']).toBeUndefined();
  });
});

describe('NominaPeriodoMockAdapterService — Detalle bajo demanda', () => {
  it('Test 18 — obtenerDetalleTrabajador carga el detalle bajo demanda', () => {
    const adapter = nuevoAdapter();
    const detalle = adapter.obtenerDetalleTrabajador(NOMINA_ID, 'trab-001');
    expect(detalle).toBeDefined();
    expect(detalle!.trabajadorId).toBe('trab-001');
    expect(Array.isArray(detalle!.movimientos)).toBe(true);
    expect(Array.isArray(detalle!.incidencias)).toBe(true);
    expect(detalle!.datosBancarios).toBeDefined();

    const desconocido = adapter.obtenerDetalleTrabajador(NOMINA_ID, 'trab-no-existe');
    expect(desconocido).toBeUndefined();
  });
});

describe('NominaPeriodoMockAdapterService — Resumen de validación', () => {
  it('Test 19 — obtenerResumenValidacionNomina calcula totales correctamente', () => {
    const adapter = nuevoAdapter();
    const resumen = adapter.obtenerResumenValidacionNomina(NOMINA_ID);
    expect(resumen.totalTrabajadores).toBe(24);
    expect(resumen.conIncidenciasCriticas).toBe(2);
    expect(resumen.conAdvertencias).toBeGreaterThanOrEqual(5);
    expect(resumen.incidenciasCriticas.every((i) => i.severidad === 'critica')).toBe(true);
    expect(resumen.advertencias.every((i) => i.severidad === 'advertencia')).toBe(true);
  });

  it('Test 20 — puedeCalcular === false cuando hay incidencia crítica bloqueante', () => {
    const adapter = nuevoAdapter();
    const resumen = adapter.obtenerResumenValidacionNomina(NOMINA_ID);
    expect(resumen.puedeCalcular).toBe(false);
  });

  it('Test 21 — puedeCerrar === false cuando hay incidencia crítica bloqueante', () => {
    const adapter = nuevoAdapter();
    const resumen = adapter.obtenerResumenValidacionNomina(NOMINA_ID);
    expect(resumen.puedeCerrar).toBe(false);
  });

  it('Test 22 — puedeCerrar === true cuando NO hay críticas bloqueantes (advertencias permiten continuar)', () => {
    const adapter = nuevoAdapter();
    const nomina = adapter.obtenerNomina(NOMINA_ID)!;
    nomina.incidencias = nomina.incidencias.filter((i) => i.severidad !== 'critica');

    const resumen = adapter.obtenerResumenValidacionNomina(NOMINA_ID);
    expect(resumen.puedeCalcular).toBe(true);
    expect(resumen.puedeCerrar).toBe(true);
    expect(resumen.advertencias.length).toBeGreaterThan(0);
  });
});

describe('NominaPeriodoMockAdapterService — Puente al motor', () => {
  it('Test 23 — consolidarSegmentosParaCalculo retorna ResultadoAlcanceNomina compatible con orquestador', () => {
    const adapter = nuevoAdapter();
    const resultado = adapter.consolidarSegmentosParaCalculo(NOMINA_ID);
    expect(resultado.tipo).toBe('empresaCompleta');
    expect(['listo', 'bloqueado', 'sinConfigurar', 'conAdvertencias']).toContain(
      resultado.estado,
    );
    expect(Array.isArray(resultado.idsTrabajadoresIncluidos)).toBe(true);
    expect(resultado.idsTrabajadoresIncluidos.length).toBe(24);
    expect(resultado.resumen).toBeDefined();
    expect(resultado.resumen.totalTrabajadores).toBe(24);
  });
});

describe('NominaPeriodoMockAdapterService — Preview de acciones masivas', () => {
  it('Test 24 — previsualizarAccionMasiva retorna preview correcto y NO modifica la nómina', () => {
    const adapter = nuevoAdapter();
    const antes = adapter.obtenerNomina(NOMINA_ID)!;
    const movsAntes = antes.movimientos.length;

    const accion: AccionMasivaTrabajadores = {
      tipo: 'agregar-movimiento',
      movimiento: {
        tipo: 'bono-asistencia',
        categoria: 'haber',
        monto: 30000,
        unidad: 'pesos',
      },
    };

    const preview = adapter.previsualizarAccionMasiva(
      NOMINA_ID,
      ['trab-001', 'trab-002', 'trab-006'],
      accion,
    );

    expect(preview.totalTrabajadoresAfectados).toBe(3);
    expect(preview.montoTotalEstimado).toBe(90000);
    expect(preview.mensajes.length).toBeGreaterThan(0);
    expect(preview.accion).toBe(accion);

    const despues = adapter.obtenerNomina(NOMINA_ID)!;
    expect(despues.movimientos.length).toBe(movsAntes);
  });

  it('Test 25 — previsualizarAccionMasiva.puedeAplicar === false cuando hay críticas bloqueantes', () => {
    const adapter = nuevoAdapter();
    const accion: AccionMasivaTrabajadores = { tipo: 'marcar-revisado' };

    const previewConCritica = adapter.previsualizarAccionMasiva(
      NOMINA_ID,
      ['trab-005'],
      accion,
    );
    expect(previewConCritica.puedeAplicar).toBe(false);
    expect(previewConCritica.totalIncidenciasCriticas).toBeGreaterThan(0);

    const previewSinCritica = adapter.previsualizarAccionMasiva(
      NOMINA_ID,
      ['trab-002'],
      accion,
    );
    expect(previewSinCritica.puedeAplicar).toBe(true);
  });
});

describe('NominaPeriodoMockAdapterService — Listado para Administrador', () => {
  it('listarResumenes retorna NominaPeriodoResumen[] (no detalle) y permite N nóminas por período', () => {
    const adapter = nuevoAdapter();
    const resumenes = adapter.listarResumenes();
    expect(resumenes.length).toBeGreaterThanOrEqual(5);

    const filaJunio = resumenes.filter((r) => r.periodo === '2026-06');
    expect(filaJunio.length).toBeGreaterThan(1);

    const cualquiera = resumenes[0]!;
    expect((cualquiera as unknown as Record<string, unknown>)['segmentos']).toBeUndefined();
    expect((cualquiera as unknown as Record<string, unknown>)['movimientos']).toBeUndefined();
    expect((cualquiera as unknown as Record<string, unknown>)['incidencias']).toBeUndefined();
  });
});

describe('NominaPeriodoMockAdapterService — Validación de duplicidad', () => {
  it('validarDuplicidadTrabajadorSegmento detecta trabajadores en >1 segmento', () => {
    const adapter = nuevoAdapter();
    const nomina = adapter.obtenerNomina(NOMINA_ID)!;
    nomina.segmentos[1]!.trabajadorIds.push('trab-001');

    const incidencias = adapter.validarDuplicidadTrabajadorSegmento(NOMINA_ID);
    expect(incidencias.length).toBeGreaterThan(0);
    expect(incidencias[0]!.severidad).toBe('critica');
    expect(incidencias[0]!.bloqueante).toBe(true);
    expect(incidencias[0]!.trabajadorId).toBe('trab-001');
  });
});

describe('NominaPeriodoMockAdapterService — Filtro de búsqueda', () => {
  it('filtrarDotacion respeta búsqueda case-insensitive sobre nombre/rut/cargo/centroCosto', () => {
    const adapter = nuevoAdapter();
    const filtro: FiltroRapidoDotacion = { busqueda: 'planta' };
    const { filas } = adapter.filtrarDotacion(
      NOMINA_ID,
      filtro,
      { page: 1, pageSize: 100, total: 0 },
    );
    expect(filas.length).toBeGreaterThan(0);
    expect(filas.every((f) => f.centroCosto?.toLowerCase().includes('planta'))).toBe(true);
  });
});
