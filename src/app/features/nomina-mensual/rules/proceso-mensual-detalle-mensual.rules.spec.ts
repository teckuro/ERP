import { describe, expect, it } from 'vitest';

import {
  buildNominaDetalleMensualMovimientosRows,
  buildAlertasExpedienteInformacionView,
  buildExpedienteCabeceraAlertas,
  buildNominaDetalleMensualPendientesRows,
  buildNominaDetalleMensualSituacion,
  buildNominaDetalleMensualTodosRows,
  normalizeDetalleMensualVistaExpediente,
  resolveDetalleMensualAccionUi,
  buildNominaDetalleMensualTrabajadorRows,
  buildNominaHistorialTablaRows,
  movimientoRowsAExpediente,
  trabajadorRowsAExpediente,
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

  it('buildNominaDetalleMensualTodosRows no incluye movimientos ni trabajadores', () => {
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
    const trabajadores = buildNominaDetalleMensualTrabajadorRows({
      workers: [
        {
          trabajador: 'Ana Soto',
          rut: '1-1',
          estado: 'Listo',
          observacion: 'OK',
          accion: 'Ver',
        },
      ],
      resultados: [],
      idPersonaPorNombre: idMap,
    });
    const rows = buildNominaDetalleMensualTodosRows({
      pendientes: [],
      movimientos,
      trabajadores,
      liquidaciones: [
        {
          estado: 'Generada',
          ambito: 'Liquidación',
          trabajador: 'Período',
          conceptoSituacion: 'Liq',
          origenDuracion: '—',
          vigencia: '—',
          monto: '—',
          accion: 'Ver',
          severity: 'listo',
          detalleTab: 'resultado',
        },
      ],
    });

    expect(rows.every((row) => row.ambito !== 'Movimiento')).toBe(true);
    expect(rows.every((row) => row.ambito !== 'Trabajador')).toBe(true);
    expect(rows.every((row) => row.ambito !== 'Liquidación')).toBe(true);
  });

  it('resolveDetalleMensualAccionUi asigna icono y title por tipo de accion', () => {
    expect(resolveDetalleMensualAccionUi('Generar nómina')).toMatchObject({
      label: 'Generar nómina',
      title: 'Generar nómina',
      icon: 'file-spreadsheet',
    });
    expect(resolveDetalleMensualAccionUi('Abrir parámetros')?.icon).toBe('sliders-horizontal');
    expect(resolveDetalleMensualAccionUi('Revisar fichas')?.icon).toBe('users');
    expect(resolveDetalleMensualAccionUi(null)).toBeNull();
  });

  it('buildNominaDetalleMensualSituacion separa bloqueos y por revisar', () => {
    const situacion = buildNominaDetalleMensualSituacion([
      {
        estado: 'Bloqueado',
        ambito: 'Parámetro',
        trabajador: 'Período',
        situacion: 'Falta UF',
        accionRecomendada: 'Abrir parámetros',
        accion: 'Abrir parámetros',
        severity: 'bloqueo',
      },
      {
        estado: 'Revisar',
        ambito: 'Trabajador',
        trabajador: 'Período',
        situacion: 'Fichas pendientes',
        accionRecomendada: 'Revisar fichas',
        accion: 'Revisar fichas',
        severity: 'atencion',
      },
    ]);

    expect(situacion.bloqueos).toHaveLength(1);
    expect(situacion.porRevisar).toHaveLength(1);
    expect(situacion.totalAlertas).toBe(2);
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
      {
        hora: '10:30',
        etapa: 'Confirmación',
        usuario: 'rrhh@demo.cl',
        resultado: 'Confirmada',
        texto: 'Se confirmó la nómina mensual.',
        destacado: true,
      },
    ]);
    expect(rows[0]).toMatchObject({
      fecha: '10:30',
      resultado: 'Confirmada',
      detalle: 'Se confirmó la nómina mensual.',
    });
  });

  it('normalizeDetalleMensualVistaExpediente siempre devuelve trabajadores', () => {
    expect(normalizeDetalleMensualVistaExpediente('todos')).toBe('trabajadores');
    expect(normalizeDetalleMensualVistaExpediente('pendientes')).toBe('trabajadores');
  });

  it('buildExpedienteCabeceraAlertas cuenta bloqueos y advertencias', () => {
    const situacion = buildNominaDetalleMensualSituacion([
      {
        estado: 'Bloqueo',
        ambito: 'Trabajador',
        trabajador: 'A',
        situacion: 'x',
        accionRecomendada: 'Revisar',
        accion: 'Revisar trabajador',
        severity: 'bloqueo',
      },
      {
        estado: 'Revisar',
        ambito: 'Trabajador',
        trabajador: 'B',
        situacion: 'y',
        accionRecomendada: 'Revisar',
        accion: 'Revisar trabajador',
        severity: 'atencion',
      },
    ]);
    expect(buildExpedienteCabeceraAlertas(situacion)).toEqual({
      bloqueos: 1,
      advertencias: 1,
      total: 2,
      tieneAlertas: true,
    });
  });

  it('buildNominaDetalleMensualPendientesRows omite sin observaciones', () => {
    const rows = buildNominaDetalleMensualPendientesRows(
      buildIncidenciasPeriodo({
        bloqueosOperativos: [],
        advertenciasOperativas: [],
        resultadoBloqueos: [],
        resultadoAdvertencias: [],
        expedienteProblemas: [{
          severidad: 'advertencia',
          titulo: 'TRAB-189',
          detalle: 'Sin observaciones',
        }],
      }),
    );
    expect(rows).toHaveLength(0);
  });

  it('buildAlertasExpedienteInformacionView arma modal de alertas', () => {
    const situacion = buildNominaDetalleMensualSituacion([
      {
        estado: 'Revisar',
        ambito: 'Trabajador',
        trabajador: 'Periodo',
        situacion: 'TRAB-189',
        accionRecomendada: 'Revisar trabajador',
        accion: 'Revisar trabajador',
        severity: 'atencion',
      },
    ]);
    const vm = buildAlertasExpedienteInformacionView(situacion);
    expect(vm.soloAlertasExpediente).toBe(true);
    expect(vm.titulo).toBe('Alertas del período');
    expect(vm.alertasExpediente).toHaveLength(1);
  });
});
