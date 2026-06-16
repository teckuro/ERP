import { TestBed } from '@angular/core/testing';
import { describe, expect, it, vi } from 'vitest';

import { mapResultadoMotorToSnapshotPayload } from '../rules/proceso-mensual-snapshot.rules';
import { NominaPeriodoService } from './nomina-periodo.service';
import { ProcesoMensualService } from './proceso-mensual.service';
import { NominaPeriodoCalculoAdapterService } from './nomina-periodo-calculo-adapter.service';

describe('NominaPeriodoCalculoAdapterService', () => {
  it('calcula solo la dotación seleccionada, guarda snapshot y registra totales', async () => {
    const nominas = {
      obtenerNomina: vi.fn().mockResolvedValue({
        id: 'nom-1',
        periodo: '2026-06',
        trabajadorIds: ['10', '11'],
      }),
      registrarCalculo: vi.fn().mockResolvedValue(undefined),
    };
    const resultado = {
      periodo: '2026-06',
      estado: 'LISTO',
      generadoEn: '2026-06-05T00:00:00Z',
      resumen: {
        totalTrabajadoresCalculados: 2,
        totalBloqueados: 0,
        totalConAdvertencias: 0,
        totalHaberes: 200,
        totalDescuentos: 50,
        totalLiquidoPreliminar: 150,
      },
      liquidaciones: [],
      issues: [],
    };
    const motor = {
      generarCalculoPeriodo: vi.fn().mockResolvedValue(resultado),
      guardarSnapshotPreliminar: vi.fn().mockResolvedValue({
        ok: true,
        snapshot: { idCalculoPeriodo: 77 },
        issues: [],
      }),
    };
    TestBed.configureTestingModule({
      providers: [
        NominaPeriodoCalculoAdapterService,
        { provide: NominaPeriodoService, useValue: nominas },
        { provide: ProcesoMensualService, useValue: motor },
      ],
    });

    const servicio = TestBed.inject(NominaPeriodoCalculoAdapterService);
    await servicio.calcular('nom-1');

    expect(motor.generarCalculoPeriodo).toHaveBeenCalledWith('2026-06', [10, 11]);
    expect(nominas.registrarCalculo).toHaveBeenCalledWith('nom-1', {
      idCalculoPeriodo: 77,
      totalTrabajadores: 2,
      totalHaberes: 200,
      totalDescuentos: 50,
      totalLiquido: 150,
    });
  });

  it('rehidrata el resultado desde snapshot vigente sin recalcular', async () => {
    const snapshot = mapResultadoMotorToSnapshotPayload({
      resultado: {
        periodo: '2026-06',
        estado: 'calculado_preliminar',
        generadoEn: '2026-06-05T00:00:00Z',
        resumen: {
          totalTrabajadoresCalculados: 1,
          totalBloqueados: 0,
          totalConAdvertencias: 0,
          totalHaberes: 900000,
          totalDescuentos: 180000,
          totalLiquidoPreliminar: 720000,
        },
        liquidaciones: [{
          periodo: '2026-06',
          idPersona: 1,
          rut: '11.111.111-1',
          nombreCompleto: 'Ana Perez',
          haberesImponibles: [
            { codigo: 'SUELDO_BASE', descripcion: 'Sueldo base', monto: 900000, origen: 'contrato', imponible: true, tributable: true },
          ],
          haberesNoImponibles: [],
          descuentosLegales: [
            { codigo: 'AFP', descripcion: 'AFP', monto: 100000, origen: 'afp_vigencia' },
          ],
          descuentosVoluntarios: [],
          baseImponiblePrevisional: 900000,
          baseTributable: 800000,
          gratificacionLegal: 0,
          asignacionFamiliar: 0,
          cotizacionAfp: 100000,
          cotizacionSalud: 70000,
          cotizacionAfc: 0,
          cotizacionSis: 12000,
          cotizacionSanna: 300,
          cotizacionLey16744: 9000,
          impuestoUnico: 10000,
          totalHaberes: 900000,
          totalDescuentos: 100000,
          liquidoAPago: 800000,
          issues: [],
          trazabilidad: [],
          estado: 'calculado_preliminar',
        }],
        issues: [],
      },
      fechaGeneracion: '2026-06-05T00:00:00Z',
    });
    const completo = {
      cabecera: {
        ...snapshot,
        trabajadores: snapshot.trabajadores,
        issues: snapshot.issues,
        trazabilidad: snapshot.trazabilidad,
      },
      trabajadores: snapshot.trabajadores,
      conceptos: snapshot.trabajadores.flatMap((t) => t.conceptos),
      observaciones: snapshot.issues,
      trazabilidad: snapshot.trabajadores.flatMap((t) => t.trazabilidad),
      aprobacionOperativa: null,
      cierreOperativo: null,
      resumen: {
        totalConceptos: snapshot.trabajadores[0].conceptos.length,
        totalObservaciones: 0,
        totalTrazas: 0,
        totalTrabajadoresSinDetalle: 0,
        esActivoVigente: true,
        fueReemplazado: false,
      },
    };
    const nominas = {
      obtenerNomina: vi.fn().mockResolvedValue({
        id: 'nom-1',
        periodo: '2026-06',
        evidenciaCalculo: { calculoVigente: true, idCalculoPeriodo: 77, versionCalculo: 2 },
      }),
    };
    const motor = {
      obtenerSnapshotCompletoPorId: vi.fn().mockResolvedValue(completo),
      obtenerSnapshotCompletoActivo: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        NominaPeriodoCalculoAdapterService,
        { provide: NominaPeriodoService, useValue: nominas },
        { provide: ProcesoMensualService, useValue: motor },
      ],
    });

    const servicio = TestBed.inject(NominaPeriodoCalculoAdapterService);
    const resultado = await servicio.obtenerResultadoPersistido('nom-1');

    expect(motor.obtenerSnapshotCompletoPorId).toHaveBeenCalledWith(77);
    expect(motor.obtenerSnapshotCompletoActivo).not.toHaveBeenCalled();
    expect(resultado?.liquidaciones[0].liquidoAPago).toBe(800000);
  });
});
