import { describe, expect, it } from 'vitest';

import { buildExpedienteNominaPeriodo } from './proceso-mensual-expediente-periodo.rules';
import { buildIncidenciasPeriodo } from './proceso-mensual-incidencias-periodo.rules';
import {
  construirFilasDetalleObservacionNomina,
  construirItemsSeguimientoParametrosNomina,
  construirFilasDetalleTrabajadorNomina,
  resolverEntradasMensualesPeriodo,
} from './proceso-mensual-payroll-seguimiento.rules';

describe('proceso-mensual-payroll-seguimiento.rules', () => {
  it('prioriza filas de base de nómina cuando existe trazabilidad', () => {
    const rows = construirFilasDetalleTrabajadorNomina({
      base: {
        trabajadores: [{
          idPersona: 1,
          trabajadorLabel: 'Ana Pérez',
          rutLabel: '11.111.111-1',
          contratoLabel: 'Contrato vigente',
          estado: 'listo',
          asignacionesRecurrentes: 0,
          movimientosDelMes: 0,
          observacion: 'Sin observaciones',
        }],
        trabajadoresConsiderados: 1,
        listosParaCalculo: 1,
        conObservaciones: 0,
        bloqueados: 0,
        excluidos: 0,
        asignacionesRecurrentesIncluidas: 0,
        movimientosDelMesIncluidos: 0,
        parametrosEstado: 'listos',
        observacionParametros: 'Parámetros listos',
      },
      expediente: buildExpedienteNominaPeriodo({
        snapshotActivo: null,
        snapshotCompleto: null,
        consultandoSnapshotCompleto: false,
        errorSnapshotCompleto: null,
        nominaCerrada: false,
        liquidacionesDisponibles: false,
      }),
      resultadoTrabajadores: [{
        idPersona: 99,
        trabajadorLabel: 'No debe usarse',
        rutLabel: '0-0',
        estadoLabel: 'Calculado',
        haberesLabel: '$0',
        descuentosLabel: '$0',
        liquidoLabel: '$0',
        observacionLabel: '—',
      }],
    });

    expect(rows).toHaveLength(1);
    expect(rows[0].trabajador).toBe('Ana Pérez');
    expect(rows[0].estado).toBe('Listo para calculo');
  });

  it('usa expediente cuando no hay base ni trazabilidad de trabajadores', () => {
    const expediente = buildExpedienteNominaPeriodo({
      snapshotActivo: {
        idCalculoPeriodo: 1,
        periodo: '2026-05',
        idEmpresa: null,
        estado: 'preliminar',
        fechaGeneracion: '2026-05-10T10:00:00.000Z',
        usuarioGenerador: 'RRHH',
        totalTrabajadores: 1,
        totalHaberes: 1000,
        totalDescuentos: 200,
        totalLiquido: 800,
        totalBloqueados: 0,
        totalAdvertencias: 0,
        versionMotor: 'v1',
        hashSnapshot: 'hash-abc',
        origen: 'preliminar',
        activo: true,
        reemplazadoPor: null,
        aprobacionOperativa: null,
        cierreOperativo: null,
        trabajadores: [],
        issues: [],
        trazabilidad: [],
      },
      snapshotCompleto: {
        cabecera: {
          idCalculoPeriodo: 1,
          periodo: '2026-05',
          idEmpresa: null,
          estado: 'preliminar',
          fechaGeneracion: '2026-05-10T10:00:00.000Z',
          usuarioGenerador: 'RRHH',
          totalTrabajadores: 1,
          totalHaberes: 1000,
          totalDescuentos: 200,
          totalLiquido: 800,
          totalBloqueados: 0,
          totalAdvertencias: 0,
          versionMotor: 'v1',
          hashSnapshot: 'hash-abc',
          origen: 'preliminar',
          activo: true,
          reemplazadoPor: null,
          aprobacionOperativa: null,
          cierreOperativo: null,
          trabajadores: [],
          issues: [],
          trazabilidad: [],
        },
        trabajadores: [{
          idCalculoTrabajador: 10,
          idCalculoPeriodo: 1,
          idPersona: 1,
          rut: '11.111.111-1',
          nombreCompletoSnapshot: 'Luis Gómez',
          estado: 'calculado_preliminar',
          sueldoBase: 500000,
          baseImponiblePrevisional: 500000,
          baseTributable: 400000,
          totalHaberesImponibles: 500000,
          totalHaberesNoImponibles: 0,
          totalDescuentosLegales: 100000,
          totalDescuentosVoluntarios: 0,
          impuestoUnico: 0,
          liquidoPreliminar: 400000,
          cotizacionAfp: 0,
          cotizacionSalud: 0,
          cotizacionAfc: 0,
          cotizacionSis: 0,
          cotizacionSanna: 0,
          cotizacionLey16744Empleador: 0,
          conceptos: [],
          issues: [],
          trazabilidad: [],
        }],
        conceptos: [],
        observaciones: [],
        trazabilidad: [],
        aprobacionOperativa: null,
        cierreOperativo: null,
        resumen: {
          totalConceptos: 0,
          totalObservaciones: 0,
          totalTrazas: 0,
          totalTrabajadoresSinDetalle: 0,
          esActivoVigente: true,
          fueReemplazado: false,
        },
      },
      consultandoSnapshotCompleto: false,
      errorSnapshotCompleto: null,
      nominaCerrada: false,
      liquidacionesDisponibles: true,
    });

    const rows = construirFilasDetalleTrabajadorNomina({
      base: null,
      expediente,
      resultadoTrabajadores: [],
    });

    expect(rows).toHaveLength(1);
    expect(rows[0].trabajador).toBe('Luis Gómez');
  });

  it('proyecta observaciones sin segunda fuente paralela', () => {
    const incidencias = buildIncidenciasPeriodo({
      bloqueosOperativos: [{
        codigo: 'PARAM_UF',
        titulo: 'UF pendiente',
        descripcion: 'Falta UF',
        severidad: 'danger',
        ruta: '/parametros',
      }],
      advertenciasOperativas: [{
        codigo: 'MV_BORRADOR',
        titulo: 'Movimiento en borrador',
        descripcion: 'Revisar',
        severidad: 'warning',
      }],
      resultadoBloqueos: [],
      resultadoAdvertencias: [],
    });

    const filas = construirFilasDetalleObservacionNomina({ incidencias: incidencias.todas });
    expect(filas).toHaveLength(2);
    expect(filas.map((fila) => fila.mensaje)).toEqual(
      expect.arrayContaining(['Falta UF', 'Revisar']),
    );
  });

  it('parametros con incidencias expone un solo item sintetico orientado al resumen', () => {
    const items = construirItemsSeguimientoParametrosNomina({
      parametrosListos: false,
      tieneIncidenciasParametros: true,
    });

    expect(items).toHaveLength(1);
    expect(items[0].descripcion).toContain('resumen');
    expect(items[0].titulo).not.toMatch(/PARAM_|bloqueo/i);
  });

  it('resolverEntradasMensualesPeriodo prioriza fuente con datos', () => {
    const vacias: never[] = [];
    const desdeMetadata = [{ idPersona: 1 } as never];
    expect(resolverEntradasMensualesPeriodo(vacias, desdeMetadata, vacias)).toBe(desdeMetadata);
    expect(resolverEntradasMensualesPeriodo(vacias, vacias, vacias)).toEqual([]);
  });
});
