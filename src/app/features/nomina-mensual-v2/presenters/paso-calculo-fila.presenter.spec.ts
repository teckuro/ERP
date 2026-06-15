import { describe, expect, it } from 'vitest';

import type { LiquidacionCalculada } from '../../nomina-mensual/models/proceso-mensual.model';
import {
  calcularStatsCalculo,
  construirFiltrosCalculo,
  COLUMNAS_GRILLA_CALCULO,
  presentarFilaCalculo,
  presentarEstadoChip,
} from './paso-calculo-fila.presenter';

function liquidacionMock(parcial: Partial<LiquidacionCalculada> = {}): LiquidacionCalculada {
  return {
    periodo: '2026-05',
    idPersona: 2,
    rut: '25050001',
    nombreCompleto: 'Dependiente Activo Auditoria',
    haberesImponibles: [
      {
        codigo: 'SUELDO_BASE',
        descripcion: 'Sueldo base',
        monto: 900000,
        origen: 'contrato',
        imponible: true,
        tributable: true,
      },
      {
        codigo: 'GRATIFICACION_ART_50',
        descripcion: 'Gratificacion legal art. 50',
        monto: 159157,
        origen: 'motor_gratificacion_art_50',
        imponible: true,
        tributable: true,
      },
    ],
    haberesNoImponibles: [],
    descuentosLegales: [
      { codigo: 'AFP', descripcion: 'Cotizacion AFP trabajador', monto: 121168, origen: 'afp_vigencia' },
      { codigo: 'SALUD', descripcion: 'Cotizacion salud Fonasa', monto: 74141, origen: 'salud' },
      { codigo: 'AFC', descripcion: 'Seguro de cesantia trabajador', monto: 6355, origen: 'afc_parametro' },
    ],
    descuentosVoluntarios: [],
    baseImponiblePrevisional: 1059157,
    baseTributable: 857493,
    gratificacionLegal: 159157,
    asignacionFamiliar: 0,
    cotizacionAfp: 121168,
    cotizacionSalud: 74141,
    cotizacionAfc: 6355,
    cotizacionSis: 17158,
    cotizacionSanna: 31775,
    cotizacionLey16744: 9850,
    impuestoUnico: 0,
    totalHaberes: 1059157,
    totalDescuentos: 201664,
    liquidoAPago: 857493,
    issues: [],
    trazabilidad: [],
    estado: 'calculado_preliminar',
    ...parcial,
  };
}

describe('presentarFilaCalculo', () => {
  it('mapea identidad y totales desde la liquidación', () => {
    const liq = liquidacionMock();
    const fila = presentarFilaCalculo(liq, { afp: 'Cuprum', salud: 'Fonasa', tipoContrato: 'Indefinido' });

    expect(fila.trabajadorId).toBe('2');
    expect(fila.idPersona).toBe(2);
    expect(fila.rut).toBe('25050001');
    expect(fila.nombre).toBe('Dependiente Activo Auditoria');
    expect(fila.afp).toBe('Cuprum');
    expect(fila.salud).toBe('Fonasa');
    expect(fila.tipoContrato).toBe('Indefinido');
    expect(fila.sueldoBase).toBe(900000);
    expect(fila.totalHaberes).toBe(1059157);
    expect(fila.totalDescuentos).toBe(201664);
    expect(fila.liquidoAPago).toBe(857493);
  });

  it('calcula la tasa implícita de AFP/Salud/AFC sobre la base imponible previsional', () => {
    const fila = presentarFilaCalculo(liquidacionMock());
    const afp = fila.descuentosLegales.find((d) => d.codigo === 'AFP');
    const salud = fila.descuentosLegales.find((d) => d.codigo === 'SALUD');
    const afc = fila.descuentosLegales.find((d) => d.codigo === 'AFC');

    expect(afp?.tasa).toBeCloseTo(121168 / 1059157, 4);
    expect(afp?.base).toBe(1059157);
    expect(salud?.tasa).toBeCloseTo(74141 / 1059157, 4);
    expect(salud?.base).toBe(1059157);
    expect(afc?.tasa).toBeCloseTo(6355 / 1059157, 4);
    expect(afc?.base).toBe(1059157);
  });

  it('marca cada haber con su etiqueta de imponibilidad', () => {
    const fila = presentarFilaCalculo(
      liquidacionMock({
        haberesImponibles: [
          { codigo: 'SUELDO_BASE', descripcion: 'Sueldo base', monto: 900000, origen: 'contrato', imponible: true, tributable: true },
        ],
        haberesNoImponibles: [
          { codigo: 'COLACION', descripcion: 'Colacion', monto: 20000, origen: 'haber_recurrente', imponible: false, tributable: false },
        ],
      }),
    );
    const sueldo = fila.haberes.find((h) => h.codigo === 'SUELDO_BASE');
    const colacion = fila.haberes.find((h) => h.codigo === 'COLACION');

    expect(sueldo?.etiqueta).toBe('imponible');
    expect(colacion?.etiqueta).toBe('no_tributable');
  });

  it('propaga bases legales y cargos del empleador', () => {
    const fila = presentarFilaCalculo(liquidacionMock());
    expect(fila.bases.baseImponiblePrevisional).toBe(1059157);
    expect(fila.bases.baseTributable).toBe(857493);
    expect(fila.cargosEmpleador.sis).toBe(17158);
    expect(fila.cargosEmpleador.sanna).toBe(31775);
    expect(fila.cargosEmpleador.ley16744).toBe(9850);
  });

  it('clasifica el estado con etiqueta humana', () => {
    const ok = presentarFilaCalculo(liquidacionMock({ estado: 'calculado_preliminar' }));
    const aviso = presentarFilaCalculo(liquidacionMock({ estado: 'con_advertencias' }));
    const bloqueo = presentarFilaCalculo(liquidacionMock({ estado: 'con_bloqueos' }));

    expect(ok.estado).toEqual({ variant: 'ok', label: 'Calculado' });
    expect(aviso.estado).toEqual({ variant: 'aviso', label: 'Con advertencias' });
    expect(bloqueo.estado).toEqual({ variant: 'bloqueo', label: 'Con bloqueos' });
    expect(ok.tieneAdvertencias).toBe(false);
    expect(aviso.tieneAdvertencias).toBe(true);
    expect(bloqueo.tieneBloqueos).toBe(true);
  });

  it('cuenta issues del motor', () => {
    const fila = presentarFilaCalculo(
      liquidacionMock({
        issues: [
          { codigo: 'X', severidad: 'ADVERTENCIA', mensaje: 'm', origen: 'o' },
          { codigo: 'Y', severidad: 'INFO', mensaje: 'm', origen: 'o' },
        ],
      }),
    );
    expect(fila.cuentaIssues).toBe(2);
  });

  it('cuando el contrato es CASA_PARTICULAR no calcula tasa para AFC porque su monto es 0', () => {
    const fila = presentarFilaCalculo(
      liquidacionMock({
        descuentosLegales: [
          { codigo: 'AFP', descripcion: 'AFP', monto: 121168, origen: 'afp_vigencia' },
          { codigo: 'SALUD', descripcion: 'Fonasa', monto: 74141, origen: 'salud' },
        ],
        cotizacionAfc: 0,
        totalDescuentos: 195309,
        liquidoAPago: 863848,
      }),
      { tipoContrato: 'Casa particular' },
    );
    const afc = fila.descuentosLegales.find((d) => d.codigo === 'AFC');
    expect(afc).toBeUndefined();
    expect(fila.tipoContrato).toBe('Casa particular');
    expect(fila.liquidoAPago).toBe(863848);
  });
});

describe('calcularStatsCalculo', () => {
  it('agrega trabajadores, haberes, descuentos y líquido', () => {
    const liqs = [
      liquidacionMock({ totalHaberes: 1000, totalDescuentos: 200, liquidoAPago: 800 }),
      liquidacionMock({ totalHaberes: 2000, totalDescuentos: 400, liquidoAPago: 1600 }),
    ];
    const stats = calcularStatsCalculo(liqs);
    expect(stats.trabajadoresCalculados).toBe(2);
    expect(stats.totalHaberes).toBe(3000);
    expect(stats.totalDescuentos).toBe(600);
    expect(stats.totalLiquido).toBe(2400);
    expect(stats.conAdvertencias).toBe(0);
    expect(stats.conBloqueos).toBe(0);
  });

  it('cuenta advertencias y bloqueos y NO incluye bloqueados en `trabajadoresCalculados`', () => {
    const stats = calcularStatsCalculo([
      liquidacionMock({ estado: 'calculado_preliminar' }),
      liquidacionMock({ estado: 'con_advertencias' }),
      liquidacionMock({ estado: 'con_bloqueos' }),
    ]);
    expect(stats.trabajadoresCalculados).toBe(2);
    expect(stats.conAdvertencias).toBe(1);
    expect(stats.conBloqueos).toBe(1);
  });
});

describe('presentarEstadoChip', () => {
  it('retorna la etiqueta humana correcta', () => {
    expect(presentarEstadoChip('calculado_preliminar').label).toBe('Calculado');
    expect(presentarEstadoChip('con_advertencias').label).toBe('Con advertencias');
    expect(presentarEstadoChip('con_bloqueos').label).toBe('Con bloqueos');
  });
});

describe('COLUMNAS_GRILLA_CALCULO', () => {
  it('declara las 8 columnas previstas en el rediseño', () => {
    expect(COLUMNAS_GRILLA_CALCULO.map((c) => c.id)).toEqual([
      'trabajador',
      'afp',
      'salud',
      'haberes',
      'descuentos',
      'liquido',
      'estado',
      'acciones',
    ]);
  });

  it('marca acciones como no ocultable ni filtrable', () => {
    const acciones = COLUMNAS_GRILLA_CALCULO.find((c) => c.id === 'acciones');
    expect(acciones?.hideable).toBe(false);
    expect(acciones?.filterable).toBe(false);
  });
});

describe('construirFiltrosCalculo', () => {
  it('expone filtros por estado y por AFP con las AFP detectadas en las filas', () => {
    const filas = [
      presentarFilaCalculo(liquidacionMock(), { afp: 'Cuprum' }),
      presentarFilaCalculo(liquidacionMock({ idPersona: 5 }), { afp: 'Modelo' }),
      presentarFilaCalculo(liquidacionMock({ idPersona: 6 }), { afp: 'Cuprum' }),
    ];
    const filtros = construirFiltrosCalculo(filas);
    expect(filtros.map((f) => f.id)).toEqual(['estado', 'afp']);
    const opcionesAfp = filtros[1].options as Array<{ label: string; value: string }>;
    const valoresAfp = opcionesAfp.map((o) => o.value);
    expect(valoresAfp).toContain('Cuprum');
    expect(valoresAfp).toContain('Modelo');
    expect(valoresAfp).toContain('');
  });
});
