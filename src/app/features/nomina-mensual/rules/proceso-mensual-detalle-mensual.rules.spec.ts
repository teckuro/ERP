import { describe, expect, it } from 'vitest';

import {
  buildNominaDetalleMensualMovimientosRows,
  buildNominaDetalleMensualTodosRows,
  buildNominaHistorialTablaRows,
} from './proceso-mensual-detalle-mensual.rules';
import { buildIncidenciasPeriodo } from './proceso-mensual-incidencias-periodo.rules';

describe('proceso-mensual-detalle-mensual.rules', () => {
  it('buildNominaDetalleMensualMovimientosRows unifica mensual y recurrente con origen', () => {
    const rows = buildNominaDetalleMensualMovimientosRows({
      movimientos: [
        {
          trabajador: 'Juan Pérez',
          concepto: 'Bono',
          tipo: 'Haber',
          monto: '$50.000',
          estado: 'Listo',
          accion: 'Ver',
        },
      ],
      recurrentes: [
        {
          trabajador: 'Ana Soto',
          concepto: 'Colación',
          periodicidad: 'Mensual',
          monto: '$80.000',
          estado: 'Listo',
          accion: 'Ver',
        },
      ],
      periodoEtiqueta: 'Mayo 2026',
    });

    expect(rows).toHaveLength(2);
    expect(rows.map((row) => row.origenDuracion).sort()).toEqual(['Este mes', 'Recurrente']);
  });

  it('buildNominaDetalleMensualTodosRows prioriza bloqueos', () => {
    const incidencias = buildIncidenciasPeriodo({
      bloqueosOperativos: [
        {
          codigo: 'PARAM_X',
          titulo: 'Falta tabla de impuesto',
          descripcion: 'Revisar parámetros',
          severidad: 'danger',
        },
      ],
      advertenciasOperativas: [],
      resultadoBloqueos: [],
      resultadoAdvertencias: [],
    });
    const pendientes = incidencias.todas
      .filter((item) => item.severidad !== 'info')
      .map((item) => ({
        estado: 'Bloqueado',
        ambito: 'Parámetro' as const,
        trabajador: 'Período',
        situacion: item.detalle,
        accionRecomendada: 'Abrir parámetros',
        accion: 'Abrir parámetros',
        severity: 'bloqueo' as const,
      }));

    const rows = buildNominaDetalleMensualTodosRows({
      pendientes,
      movimientos: [],
      trabajadores: [],
      liquidaciones: [],
    });

    expect(rows[0]?.severity).toBe('bloqueo');
  });

  it('buildNominaDetalleMensualTodosRows no incluye filas planas de movimientos', () => {
    const rows = buildNominaDetalleMensualTodosRows({
      pendientes: [],
      movimientos: buildNominaDetalleMensualMovimientosRows({
        movimientos: [
          {
            trabajador: 'Juan',
            concepto: 'Bono',
            tipo: 'Haber',
            monto: '$1',
            estado: 'Listo',
            accion: 'Ver',
          },
        ],
        recurrentes: [],
        periodoEtiqueta: 'Mayo 2026',
      }),
      trabajadores: [],
      liquidaciones: [],
    });

    expect(rows.every((row) => row.ambito !== 'Movimiento')).toBe(true);
  });

  it('buildNominaHistorialTablaRows mapea eventos visuales', () => {
    const rows = buildNominaHistorialTablaRows([
      { hora: '10:30', texto: 'Se confirmó la nómina mensual.', destacado: true },
    ]);
    expect(rows[0]).toMatchObject({
      fecha: '10:30',
      resultado: 'Confirmado',
      detalle: 'Se confirmó la nómina mensual.',
    });
  });
});
