import { describe, expect, it } from 'vitest';

import { buildLiquidacionPreviewTrabajador } from './proceso-mensual-liquidacion-preview-trabajador.rules';
import type { MotorCalculoPeriodoResultado } from '../models/proceso-mensual.model';

describe('buildLiquidacionPreviewTrabajador', () => {
  const calculoBase: MotorCalculoPeriodoResultado = {
    periodo: '2026-05',
    estado: 'calculado_preliminar',
    generadoEn: '2026-05-01T12:00:00Z',
    resumen: {
      totalTrabajadoresCalculados: 1,
      totalBloqueados: 0,
      totalConAdvertencias: 0,
      totalHaberes: 1_810_002,
      totalDescuentos: 1_419_765,
      totalLiquidoPreliminar: 390_236,
    },
    liquidaciones: [
      {
        periodo: '2026-05',
        idPersona: 1,
        rut: '33.772.972-K',
        nombreCompleto: 'Prueba Borrador',
        haberesImponibles: [
          { codigo: 'SUELDO_BASE', descripcion: 'Sueldo base', monto: 1_500_000, origen: 'contrato', imponible: true, tributable: true },
        ],
        haberesNoImponibles: [
          { codigo: 'COLACION', descripcion: 'Colación', monto: 310_002, origen: 'recurrente', imponible: false, tributable: false },
        ],
        descuentosLegales: [
          { codigo: 'AFP', descripcion: 'Cotización AFP', monto: 200_000, origen: 'motor', imponible: false, tributable: false },
          { codigo: 'AFC', descripcion: 'Seguro de cesantia trabajador', monto: 4_800, origen: 'afc_parametro', imponible: false, tributable: false },
        ],
        descuentosVoluntarios: [
          { codigo: 'IMPUESTO_UNICO', descripcion: 'Impuesto único', monto: 1_219_765, origen: 'motor', imponible: false, tributable: false },
        ],
        baseImponiblePrevisional: 1_500_000,
        baseTributable: 1_200_000,
        gratificacionLegal: 0,
        asignacionFamiliar: 0,
        cotizacionAfp: 200_000,
        cotizacionSalud: 0,
        cotizacionAfc: 0,
        cotizacionSis: 0,
        cotizacionSanna: 0,
        cotizacionLey16744: 0,
        impuestoUnico: 1_219_765,
        totalHaberes: 1_810_002,
        totalDescuentos: 1_424_565,
        liquidoAPago: 390_236,
        issues: [],
        trazabilidad: [
          {
            codigo: 'BASE_IMPONIBLE_PREVISIONAL',
            origen: 'motor',
            tabla: 'resultado',
            campo: 'haberesImponibles',
            valorEntrada: 1_500_000,
            formula: 'suma haberes imponibles',
            valorResultado: 1_500_000,
            observacion: null,
          },
        ],
        estado: 'calculado_preliminar',
      },
    ],
    issues: [],
  };

  it('arma secciones de haberes y descuentos desde liquidación en memoria', () => {
    const vm = buildLiquidacionPreviewTrabajador({
      idPersona: 1,
      periodo: '2026-05',
      estadoLabel: 'Listo',
      haberes: null,
      descuentos: null,
      liquido: null,
      calculo: calculoBase,
      snapshotCompleto: null,
      incidenciasInfo: [],
    });

    expect(vm.visible).toBe(true);
    expect(vm.secciones).toHaveLength(2);
    expect(vm.secciones[0]?.titulo).toBe('Haberes');
    expect(vm.secciones[0]?.lineas.some((l) => l.etiqueta.includes('Sueldo'))).toBe(true);
    expect(vm.totales.liquido).toContain('390');
    expect(vm.referencias.some((r) => r.titulo.toLowerCase().includes('imponible'))).toBe(true);
    const afc = vm.secciones
      .find((s) => s.titulo === 'Descuentos')
      ?.lineas.find((l) => l.etiqueta.toLowerCase().includes('cesant'));
    expect(afc?.monto).toContain('4');
    expect(afc?.monto).not.toContain('1.086');
  });

  it('no expone cuando no hay datos de cálculo', () => {
    const vm = buildLiquidacionPreviewTrabajador({
      idPersona: 99,
      periodo: '2026-05',
      estadoLabel: 'No calculado',
      haberes: null,
      descuentos: null,
      liquido: null,
      calculo: null,
      snapshotCompleto: null,
      incidenciasInfo: [],
    });

    expect(vm.visible).toBe(false);
    expect(vm.secciones).toHaveLength(0);
  });
});
