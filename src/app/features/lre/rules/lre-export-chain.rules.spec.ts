import type { LiquidacionConcepto } from '../../liquidaciones-oficiales/models/liquidacion-oficial.model';
import type { MotorCalculoPeriodoResultado, NominaCalculoConceptoSnapshot } from '../../nomina-mensual/models/proceso-mensual.model';
import { mapResultadoMotorToSnapshotPayload } from '../../nomina-mensual/rules/proceso-mensual-snapshot.rules';
import { construirBorradorLre } from './lre-export.rules';
import { resolverCodigoLreConcepto } from './lre-codigo-concepto.rules';

function resultadoMotorBase(): MotorCalculoPeriodoResultado {
  return {
    periodo: '2026-06',
    estado: 'calculado_preliminar',
    generadoEn: '2026-06-05T10:00:00.000Z',
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
      rut: '27.000.000-1',
      nombreCompleto: 'Apto Uno Productivo',
      haberesImponibles: [
        { codigo: 'SUELDO_BASE', descripcion: 'Sueldo base', monto: 800000, origen: 'contrato', imponible: true, tributable: true },
        { codigo: 'BONO', descripcion: 'Bono variable', monto: 100000, origen: 'haber_recurrente', imponible: true, tributable: true },
      ],
      haberesNoImponibles: [
        { codigo: 'MOVILIZACION', descripcion: 'Movilización', monto: 50000, origen: 'contrato', imponible: false, tributable: false },
      ],
      descuentosLegales: [
        { codigo: 'AFP', descripcion: 'Cotización AFP', monto: 90000, origen: 'afp_vigencia' },
        { codigo: 'SALUD', descripcion: 'Cotización salud', monto: 63000, origen: 'salud' },
        { codigo: 'IMPUESTO_UNICO', descripcion: 'Impuesto único', monto: 12000, origen: 'tabla_impuesto_unico' },
      ],
      descuentosVoluntarios: [
        { codigo: 'ANTICIPO', descripcion: 'Anticipo', monto: 15000, origen: 'entrada_mensual' },
      ],
      baseImponiblePrevisional: 900000,
      baseTributable: 720000,
      gratificacionLegal: 0,
      asignacionFamiliar: 0,
      cotizacionAfp: 90000,
      cotizacionSalud: 63000,
      cotizacionAfc: 0,
      cotizacionSis: 12000,
      cotizacionSanna: 300,
      cotizacionLey16744: 9000,
      impuestoUnico: 12000,
      totalHaberes: 950000,
      totalDescuentos: 180000,
      liquidoAPago: 770000,
      issues: [],
      trazabilidad: [],
      estado: 'calculado_preliminar',
    }],
    issues: [],
  };
}

function conceptoLiquidacionDesdeSnapshot(concepto: NominaCalculoConceptoSnapshot): LiquidacionConcepto {
  return {
    idLiquidacionConcepto: 0,
    idLiquidacionTrabajador: 1,
    idConcepto: concepto.idConcepto,
    codigo: typeof concepto.trazabilidadJson?.['codigo'] === 'string' ? concepto.trazabilidadJson['codigo'] : null,
    codigoLre: concepto.codigoLreSnapshot,
    nombre: concepto.nombreConceptoSnapshot,
    tipo: concepto.tipo,
    clasificacion: concepto.tipo === 'cotizacion' ? 'aporte_referencia' : null,
    cantidad: null,
    base: null,
    tasa: null,
    monto: concepto.monto,
    orden: 0,
    metadata: {},
  };
}

describe('lre-export-chain (motor → snapshot → LRE)', () => {
  it('propaga códigos LRE oficiales desde el motor hasta el borrador CSV', () => {
    const snapshot = mapResultadoMotorToSnapshotPayload({
      resultado: resultadoMotorBase(),
      fechaGeneracion: '2026-06-05T10:00:00.000Z',
    });

    const conceptos = snapshot.trabajadores[0].conceptos;
    const sueldo = conceptos.find((c) => c.nombreConceptoSnapshot === 'Sueldo base');
    const afp = conceptos.find((c) => c.nombreConceptoSnapshot === 'Cotización AFP');
    const sis = conceptos.find((c) => c.tipo === 'cotizacion' && c.nombreConceptoSnapshot.includes('SIS'));

    expect(sueldo?.codigoLreSnapshot).toBe('2101');
    expect(afp?.codigoLreSnapshot).toBe('3141');
    expect(resolverCodigoLreConcepto('BONO')).toBe('2113');
    expect(sis?.codigoLreSnapshot).toBeNull();

    const conceptosConLreCatalogo = conceptos.map((c) => ({
      ...conceptoLiquidacionDesdeSnapshot(c),
      codigoLre: c.nombreConceptoSnapshot === 'Bono variable' ? '2111' : c.codigoLreSnapshot,
    }));

    const borrador = construirBorradorLre({
      periodo: snapshot.periodo,
      empresaNombre: 'Empresa demo',
      idLiquidacionPeriodo: 99,
      versionLiquidacion: 1,
      trabajadores: [{
        trabajador: {
          idLiquidacionTrabajador: 1,
          rut: snapshot.trabajadores[0].rut,
          nombreTrabajador: snapshot.trabajadores[0].nombreCompletoSnapshot,
        } as never,
        conceptos: conceptosConLreCatalogo,
      }],
    });

    const codigos = borrador.lineas.map((l) => l.codigoLre).sort();
    expect(codigos).toContain('2101');
    expect(codigos).toContain('2111');
    expect(codigos).toContain('3141');
    expect(borrador.listoParaEnvio).toBe(true);
  });

  it('prioriza codigoLre del catálogo sobre mapa estático en snapshot', () => {
    const snapshot = mapResultadoMotorToSnapshotPayload({
      resultado: {
        ...resultadoMotorBase(),
        liquidaciones: [{
          ...resultadoMotorBase().liquidaciones[0],
          haberesImponibles: [
            {
              codigo: 'BONO',
              descripcion: 'Bono',
              monto: 100000,
              origen: 'haber_recurrente',
              imponible: true,
              tributable: true,
              codigoLre: '2111',
              idConcepto: 5,
            },
          ],
        }],
      },
      fechaGeneracion: '2026-06-05T10:00:00.000Z',
    });
    const bono = snapshot.trabajadores[0].conceptos.find((c) => c.nombreConceptoSnapshot === 'Bono');
    expect(bono?.codigoLreSnapshot).toBe('2111');
  });
});
