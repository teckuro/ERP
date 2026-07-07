import { describe, expect, it } from 'vitest';

import {
  ensamblarNominaPeriodo,
  incidenciaNominaToInsert,
  movimientoNominaToInsert,
  rowToNominaPeriodoResumen,
  segmentoNominaToInsert,
  type NominaPeriodoRow,
} from './nomina-periodo.mapper';

const FILA_BASE: NominaPeriodoRow = {
  id: 'nom-1',
  id_empresa: 7,
  empresa_nombre: 'Demo',
  periodo: '2026-06',
  tipo: 'mensual',
  estado: 'en_revision',
  fecha_inicio: '2026-06-01',
  fecha_fin: '2026-06-30',
  naturaleza: 'liquidacion_legal',
  codigo_ciclo: '2026-06-MES',
  plantilla_ciclo_id: 'plantilla-mes-1',
  nomina_origen_id: null,
  version_estado: 2,
  total_trabajadores: 12,
  total_segmentos: 1,
  total_haberes: 0,
  total_descuentos: 0,
  total_liquido: 0,
  total_incidencias_criticas: 0,
  total_advertencias: 0,
  fecha_pago: null,
  closed_at: null,
  created_at: '2026-06-04T00:00:00.000Z',
  updated_at: '2026-06-04T00:00:00.000Z',
  id_calculo_periodo_vigente: null,
  version_calculo: 0,
  calculo_vigente: false,
  calculado_at: null,
  validado_at: null,
  aprobado_at: null,
  motivo_cierre: null,
  ultimo_paso_visitado: null,
  paso_visitado_at: null,
  maximo_paso_completado: null,
  maximo_paso_completado_at: null,
};

describe('rowToNominaPeriodoResumen', () => {
  it('mapea la identidad canonica y la version de estado', () => {
    const resumen = rowToNominaPeriodoResumen({ ...FILA_BASE });
    expect(resumen).toMatchObject({
      fechaInicio: '2026-06-01',
      fechaFin: '2026-06-30',
      naturaleza: 'liquidacion_legal',
      codigoCiclo: '2026-06-MES',
      plantillaCicloId: 'plantilla-mes-1',
      versionEstado: 2,
    });
  });

  it('mapea ultimoPasoVisitado a null cuando la BD trae null', () => {
    const resumen = rowToNominaPeriodoResumen({ ...FILA_BASE });
    expect(resumen.ultimoPasoVisitado).toBeNull();
    expect(resumen.pasoVisitadoAt).toBeNull();
  });

  it('mapea cada PayrollStepId válido desde la BD', () => {
    const valores = [
      'parameters',
      'dotacion',
      'movements',
      'calculation',
      'closure',
    ] as const;
    for (const v of valores) {
      const resumen = rowToNominaPeriodoResumen({
        ...FILA_BASE,
        ultimo_paso_visitado: v,
        paso_visitado_at: '2026-06-05T12:00:00.000Z',
      });
      expect(resumen.ultimoPasoVisitado).toBe(v);
      expect(resumen.pasoVisitadoAt).toBe('2026-06-05T12:00:00.000Z');
    }
  });

  it('normaliza el paso legacy validation a closure', () => {
    const resumen = rowToNominaPeriodoResumen({
      ...FILA_BASE,
      ultimo_paso_visitado: 'validation',
    });
    expect(resumen.ultimoPasoVisitado).toBe('closure');
  });

  it('degrada a null cuando la BD trae un valor desconocido (defensa frente a legacy)', () => {
    const resumen = rowToNominaPeriodoResumen({
      ...FILA_BASE,
      ultimo_paso_visitado: 'legacy-step',
    });
    expect(resumen.ultimoPasoVisitado).toBeNull();
  });

  it('ignora la cadena vacía como si fuera null', () => {
    const resumen = rowToNominaPeriodoResumen({
      ...FILA_BASE,
      ultimo_paso_visitado: '',
    });
    expect(resumen.ultimoPasoVisitado).toBeNull();
  });

  it('mapea maximoPasoCompletado y maximoPasoCompletadoAt desde la BD', () => {
    const resumen = rowToNominaPeriodoResumen({
      ...FILA_BASE,
      maximo_paso_completado: 'calculation',
      maximo_paso_completado_at: '2026-06-05T09:00:00.000Z',
    });
    expect(resumen.maximoPasoCompletado).toBe('calculation');
    expect(resumen.maximoPasoCompletadoAt).toBe('2026-06-05T09:00:00.000Z');
  });

  it('degrada maximo_paso_completado a null si la BD trae un valor desconocido', () => {
    const resumen = rowToNominaPeriodoResumen({
      ...FILA_BASE,
      maximo_paso_completado: 'legacy-step',
    });
    expect(resumen.maximoPasoCompletado).toBeNull();
  });
});

describe('ensamblarNominaPeriodo', () => {
  it('incluye ultimoPasoVisitado y pasoVisitadoAt de la cabecera', () => {
    const nomina = ensamblarNominaPeriodo({
      cabecera: {
        ...FILA_BASE,
        ultimo_paso_visitado: 'calculation',
        paso_visitado_at: '2026-06-05T08:30:00.000Z',
      },
      segmentos: [],
      movimientos: [],
      incidencias: [],
    });
    expect(nomina.ultimoPasoVisitado).toBe('calculation');
    expect(nomina.pasoVisitadoAt).toBe('2026-06-05T08:30:00.000Z');
  });

  it('cuando la cabecera no tiene paso visitado, deja null', () => {
    const nomina = ensamblarNominaPeriodo({
      cabecera: { ...FILA_BASE },
      segmentos: [],
      movimientos: [],
      incidencias: [],
    });
    expect(nomina.ultimoPasoVisitado).toBeNull();
    expect(nomina.pasoVisitadoAt).toBeNull();
    expect(nomina.maximoPasoCompletado).toBeNull();
    expect(nomina.maximoPasoCompletadoAt).toBeNull();
  });

  it('incluye maximoPasoCompletado/maximoPasoCompletadoAt de la cabecera', () => {
    const nomina = ensamblarNominaPeriodo({
      cabecera: {
        ...FILA_BASE,
        maximo_paso_completado: 'validation',
        maximo_paso_completado_at: '2026-06-05T10:00:00.000Z',
      },
      segmentos: [],
      movimientos: [],
      incidencias: [],
    });
    expect(nomina.maximoPasoCompletado).toBe('closure');
    expect(nomina.maximoPasoCompletadoAt).toBe('2026-06-05T10:00:00.000Z');
  });
});

// ---------------------------------------------------------------------------
// Guardrail: insert mappers para registros NUEVOS NUNCA deben mandar `id`.
// La BD lo genera con `default gen_random_uuid()`. Si el frontend envía
// `id: ''` (o `id: null`) postgrest-js dispara el NOT NULL constraint.
// ---------------------------------------------------------------------------
describe('mappers · contrato de inserción sin id explícito', () => {
  it('movimientoNominaToInsert omite la clave `id` por completo', () => {
    const insert = movimientoNominaToInsert(
      {
        nominaPeriodoId: 'nom-1',
        trabajadorId: '42',
        tipo: 'haber',
        categoria: 'haber',
        origen: 'manual',
        estado: 'aplicado',
      },
      7,
    );
    expect(Object.prototype.hasOwnProperty.call(insert, 'id')).toBe(false);
    expect(insert.id_nomina_periodo).toBe('nom-1');
    expect(insert.id_persona).toBe(42);
  });

  it('segmentoNominaToInsert omite `id` cuando el segmento es nuevo', () => {
    const insert = segmentoNominaToInsert(
      {
        nominaPeriodoId: 'nom-1',
        nombre: 'Planta',
        estado: 'borrador',
        trabajadorIds: ['1', '2'],
        totalTrabajadores: 2,
        totalIncidenciasCriticas: 0,
        totalAdvertencias: 0,
        ordinal: 1,
      },
      7,
    );
    expect(Object.prototype.hasOwnProperty.call(insert, 'id')).toBe(false);
    expect(insert.trabajador_ids).toEqual([1, 2]);
  });

  it('segmentoNominaToInsert mantiene `id` cuando el segmento ya existe (upsert update)', () => {
    const insert = segmentoNominaToInsert(
      {
        id: 'seg-existente',
        nominaPeriodoId: 'nom-1',
        nombre: 'Planta',
        estado: 'borrador',
        trabajadorIds: [],
        totalTrabajadores: 0,
        totalIncidenciasCriticas: 0,
        totalAdvertencias: 0,
        ordinal: 1,
        createdAt: '2026-06-04T00:00:00.000Z',
        updatedAt: '2026-06-04T00:00:00.000Z',
      },
      7,
    );
    expect(insert.id).toBe('seg-existente');
  });

  it('incidenciaNominaToInsert omite `id` cuando la incidencia es nueva', () => {
    const insert = incidenciaNominaToInsert({
      nominaPeriodoId: 'nom-1',
      severidad: 'critica',
      tipo: 'falta_dato',
      mensaje: 'Sin contrato vigente',
      bloqueante: true,
    });
    expect(Object.prototype.hasOwnProperty.call(insert, 'id')).toBe(false);
    expect(insert.severidad).toBe('critica');
  });
});
