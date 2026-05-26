import { describe, expect, it } from 'vitest';

import {
  mapSnapshotActivoToBaseTrazabilidad,
  resolveBaseNominaTrazabilidad,
} from './proceso-mensual-borrador-snapshot.rules';
import { buildFilasMasivasTrabajadores } from './proceso-mensual-masivo-layout.rules';

describe('proceso-mensual revision borrador integracion rules', () => {
  it('rehidrata trabajadores desde snapshot activo cuando no hay preNomina ni completo', () => {
    const snapshot = {
      periodo: '2026-05',
      idEmpresa: null,
      estado: 'borrador' as const,
      fechaGeneracion: '2026-05-18T10:00:00.000Z',
      usuarioGenerador: null,
      totalTrabajadores: 1,
      totalHaberes: 0,
      totalDescuentos: 0,
      totalLiquido: 0,
      totalBloqueados: 0,
      totalAdvertencias: 0,
      versionMotor: 'BASE-NOMINA-01',
      hashSnapshot: null,
      origen: 'preliminar' as const,
      activo: true,
      reemplazadoPor: null,
      aprobacionOperativa: null,
      cierreOperativo: null,
      trabajadores: [{
        idPersona: 9,
        rut: '33.772.972-K',
        nombreCompletoSnapshot: 'Finalizar Alta Prueba Borrador',
        estado: 'calculado_preliminar' as const,
        sueldoBase: 0,
        baseImponiblePrevisional: 0,
        baseTributable: 0,
        totalHaberesImponibles: 0,
        totalHaberesNoImponibles: 0,
        totalDescuentosLegales: 0,
        totalDescuentosVoluntarios: 0,
        impuestoUnico: 0,
        liquidoPreliminar: 0,
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
      issues: [],
      trazabilidad: [],
    };

    const trazabilidad = resolveBaseNominaTrazabilidad({
      preNomina: null,
      snapshotActivo: snapshot,
      snapshotCompleto: null,
    });

    expect(mapSnapshotActivoToBaseTrazabilidad(snapshot)?.trabajadores).toHaveLength(1);
    expect(trazabilidad?.trabajadores[0]?.trabajadorLabel).toBe('Finalizar Alta Prueba Borrador');

    const filas = buildFilasMasivasTrabajadores({
      resultadoTrabajadores: [],
      expedienteTrabajadores: [],
      baseTrabajadores: trazabilidad?.trabajadores ?? [],
      filasMovimientos: [],
      filasRecurrentes: [],
      incidencias: [],
      montosOficialesDisponibles: false,
      entradasMensuales: [{
        idEntrada: 'novedad:1',
        origen: 'novedad_mensual',
        origenId: 1,
        periodo: '2026-05',
        idPersona: 9,
        idContrato: 10,
        idConcepto: 1,
        tipoEntrada: 'haber',
        categoria: 'haber_variable',
        tipoMovimiento: 'haber',
        cantidad: null,
        unidad: null,
        monto: 250000,
        moneda: 'CLP',
        estado: 'aprobada',
        fechaEvento: null,
        observacion: null,
        referenciaExterna: null,
        requiereRevision: false,
        bloqueaProceso: false,
        warnings: [],
        metadata: {},
      }],
    });

    expect(filas).toHaveLength(1);
    expect(filas[0]?.montosEstimadosDesdeEntradas).toBe(true);
    expect(filas[0]?.liquidoEstimado).toBe(250000);
  });
});
