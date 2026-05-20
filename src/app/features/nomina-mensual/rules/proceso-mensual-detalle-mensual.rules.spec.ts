import { describe, expect, it } from 'vitest';

import {
  buildNominaDetalleMensualMovimientosRows,
  buildNominaDetalleMensualTodosRows,
  buildNominaDetalleMensualTrabajadorRows,
  buildNominaHistorialTablaRows,
  movimientoRowsAExpediente,
  trabajadorRowsAExpediente,
} from './proceso-mensual-detalle-mensual.rules';
import { resolveAccionCorreccionDesdeExpedienteRow } from './proceso-mensual-correccion.rules';
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

  it('buildNominaDetalleMensualTodosRows incluye movimientos con idPersona y acción unificada', () => {
    const idMap = new Map<string, number | string>([['juan pérez', 7]]);
    const movimientos = buildNominaDetalleMensualMovimientosRows({
      movimientos: [
        {
          trabajador: 'Juan Pérez',
          concepto: 'Bono',
          tipo: 'Haber',
          monto: '$1',
          estado: 'Revisar',
          accion: 'Revisar movimiento',
        },
      ],
      recurrentes: [],
      periodoEtiqueta: 'Mayo 2026',
    });
    const rows = buildNominaDetalleMensualTodosRows({
      pendientes: [],
      movimientos,
      trabajadores: [],
      liquidaciones: [],
      idPersonaPorNombre: idMap,
    });

    const mov = rows.find((row) => row.ambito === 'Movimiento');
    expect(mov).toMatchObject({
      ambito: 'Movimiento',
      trabajador: 'Juan Pérez',
      idPersona: 7,
      detalleTab: 'movimientos_recurrentes',
    });
    const accion = resolveAccionCorreccionDesdeExpedienteRow(mov!);
    expect(accion).toMatchObject({
      kind: 'panel_trabajador',
      idPersona: 7,
      filtroMasivo: 'con_movimientos',
      label: 'Revisar movimiento',
    });
  });

  it('movimientoRowsAExpediente propaga idPersona por nombre', () => {
    const idMap = new Map<string, number | string>([['ana soto', 3]]);
    const [row] = movimientoRowsAExpediente(
      [
        {
          estado: 'Listo',
          tipo: 'Haber',
          trabajador: 'Ana Soto',
          concepto: 'Colación',
          origenDuracion: 'Recurrente',
          vigencia: 'Mayo 2026',
          monto: '$1',
          accion: 'Ver',
        },
      ],
      idMap,
    );
    expect(row?.idPersona).toBe(3);
  });

  it('buildNominaDetalleMensualTrabajadorRows propaga idPersona al expediente', () => {
    const idMap = new Map<string, number | string>([['ana soto', 42]]);
    const trabajadores = buildNominaDetalleMensualTrabajadorRows({
      workers: [
        {
          trabajador: 'Ana Soto',
          rut: '11.111.111-1',
          estado: 'Revisar',
          observacion: 'Falta dato',
          accion: 'Revisar',
        },
      ],
      resultados: [],
      idPersonaPorNombre: idMap,
    });
    const expediente = trabajadorRowsAExpediente(trabajadores);
    expect(trabajadores[0]?.idPersona).toBe(42);
    expect(expediente[0]?.idPersona).toBe(42);
    expect(expediente[0]?.ambito).toBe('Trabajador');
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
