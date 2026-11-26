import { describe, expect, it } from 'vitest';

import type { LiquidacionCalculada, NominaSnapshotCompletoView } from '../models/proceso-mensual.model';
import { generarCalculoRectificacionPeriodo } from './proceso-mensual-motor-rectificacion.rules';

function linea(codigo: string, monto: number) {
  return {
    codigo,
    descripcion: codigo,
    monto,
    origen: 'test',
    imponible: true,
    tributable: true,
  };
}

function liquidacion(partial: Partial<LiquidacionCalculada> & Pick<LiquidacionCalculada, 'idPersona'>): LiquidacionCalculada {
  return {
    periodo: '2026-06',
    rut: '1-9',
    nombreCompleto: 'Test',
    haberesImponibles: [],
    haberesNoImponibles: [],
    descuentosLegales: [],
    descuentosVoluntarios: [],
    baseImponiblePrevisional: 0,
    baseTributable: 0,
    gratificacionLegal: 0,
    asignacionFamiliar: 0,
    cotizacionAfp: 0,
    cotizacionSalud: 0,
    cotizacionAfc: 0,
    cotizacionAfcEmpleador: 0,
    cotizacionSis: 0,
    cotizacionSanna: 0,
    cotizacionLey16744: 0,
    impuestoUnico: 0,
    totalHaberes: 0,
    totalDescuentos: 0,
    liquidoAPago: 0,
    issues: [],
    trazabilidad: [],
    estado: 'calculado_preliminar',
    ...partial,
  };
}

function snapshotOrigen(trabajadores: LiquidacionCalculada[]): NominaSnapshotCompletoView {
  return {
    cabecera: {} as NominaSnapshotCompletoView['cabecera'],
    trabajadores: trabajadores.map((t) => ({
      idPersona: t.idPersona,
      rut: t.rut,
      nombreCompletoSnapshot: t.nombreCompleto,
      sueldoBase: 0,
      baseImponiblePrevisional: t.baseImponiblePrevisional,
      baseTributable: t.baseTributable,
      totalHaberesImponibles: t.totalHaberes,
      totalHaberesNoImponibles: 0,
      totalDescuentosLegales: t.totalDescuentos,
      totalDescuentosVoluntarios: 0,
      liquidoPreliminar: t.liquidoAPago,
      cotizacionAfp: 0,
      cotizacionSalud: 0,
      cotizacionAfc: 0,
      cotizacionAfcEmpleador: 0,
      cotizacionSis: 0,
      cotizacionSanna: 0,
      cotizacionLey16744Empleador: 0,
      impuestoUnico: 0,
      conceptos: t.haberesImponibles.map((l) => ({
        tipo: 'haber' as const,
        codigoConceptoSnapshot: l.codigo,
        nombreConceptoSnapshot: l.descripcion,
        monto: l.monto,
        origen: l.origen,
        imponible: true,
        tributable: true,
      })),
      issues: [],
      trazabilidad: [],
      estado: 'calculado_preliminar',
    })),
    conceptos: [],
    observaciones: [],
    trazabilidad: [],
    aprobacionOperativa: null,
    cierreOperativo: null,
    resumen: {} as NominaSnapshotCompletoView['resumen'],
  } as unknown as NominaSnapshotCompletoView;
}

describe('proceso-mensual-motor-rectificacion.rules', () => {
  it('emite diferencia positiva por concepto', () => {
    const orig = liquidacion({
      idPersona: 1,
      haberesImponibles: [linea('SUELDO', 1_000_000)],
      totalHaberes: 1_000_000,
      liquidoAPago: 800_000,
    });
    const rect = liquidacion({
      idPersona: 1,
      haberesImponibles: [linea('SUELDO', 1_050_000)],
      totalHaberes: 1_050_000,
      liquidoAPago: 840_000,
    });

    const resultado = generarCalculoRectificacionPeriodo({
      periodo: '2026-06',
      snapshotOrigen: snapshotOrigen([orig]),
      resultadoRectificado: {
        periodo: '2026-06',
        estado: 'calculado_preliminar',
        generadoEn: '2026-06-01',
        resumen: {
          totalTrabajadoresCalculados: 1,
          totalBloqueados: 0,
          totalConAdvertencias: 0,
          totalHaberes: 1_050_000,
          totalDescuentos: 0,
          totalLiquidoPreliminar: 840_000,
        },
        liquidaciones: [rect],
        issues: [],
      },
      nominaOrigenId: 'origen-1',
      versionCalculoOrigen: 2,
      generadoEn: '2026-06-02',
    });

    expect(resultado.liquidaciones).toHaveLength(1);
    expect(resultado.liquidaciones[0]?.haberesImponibles[0]?.monto).toBe(50_000);
    expect(resultado.liquidaciones[0]?.liquidoAPago).toBe(40_000);
  });

  it('omite trabajador cuando la diferencia es cero', () => {
    const base = liquidacion({
      idPersona: 2,
      haberesImponibles: [linea('SUELDO', 500_000)],
      totalHaberes: 500_000,
      liquidoAPago: 400_000,
    });

    const resultado = generarCalculoRectificacionPeriodo({
      periodo: '2026-06',
      snapshotOrigen: snapshotOrigen([base]),
      resultadoRectificado: {
        periodo: '2026-06',
        estado: 'calculado_preliminar',
        generadoEn: '2026-06-01',
        resumen: {
          totalTrabajadoresCalculados: 1,
          totalBloqueados: 0,
          totalConAdvertencias: 0,
          totalHaberes: 500_000,
          totalDescuentos: 0,
          totalLiquidoPreliminar: 400_000,
        },
        liquidaciones: [base],
        issues: [],
      },
      nominaOrigenId: 'origen-1',
      versionCalculoOrigen: 1,
      generadoEn: '2026-06-02',
    });

    expect(resultado.liquidaciones).toHaveLength(0);
  });

  it('bloquea trabajador no presente en origen', () => {
    const rect = liquidacion({ idPersona: 99, liquidoAPago: 10_000, totalHaberes: 10_000 });

    const resultado = generarCalculoRectificacionPeriodo({
      periodo: '2026-06',
      snapshotOrigen: snapshotOrigen([]),
      resultadoRectificado: {
        periodo: '2026-06',
        estado: 'calculado_preliminar',
        generadoEn: '2026-06-01',
        resumen: {
          totalTrabajadoresCalculados: 1,
          totalBloqueados: 0,
          totalConAdvertencias: 0,
          totalHaberes: 10_000,
          totalDescuentos: 0,
          totalLiquidoPreliminar: 10_000,
        },
        liquidaciones: [rect],
        issues: [],
      },
      nominaOrigenId: 'origen-1',
      versionCalculoOrigen: 1,
      generadoEn: '2026-06-02',
    });

    expect(resultado.estado).toBe('con_bloqueos');
    expect(resultado.liquidaciones[0]?.issues.some((i) => i.codigo === 'TRABAJADOR_NO_EN_ORIGEN')).toBe(true);
  });
});
