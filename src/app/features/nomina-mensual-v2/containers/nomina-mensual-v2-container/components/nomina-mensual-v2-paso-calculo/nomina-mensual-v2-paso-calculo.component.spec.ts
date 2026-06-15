import { TestBed } from '@angular/core/testing';
import { describe, expect, it, beforeEach, vi } from 'vitest';

import type { NominaPeriodo } from '../../../../../nomina-mensual/models/nomina-periodo.models';
import { crearNomina } from '../../../../../nomina-mensual/models/nomina-periodo.models';
import type {
  LiquidacionCalculada,
  MotorCalculoPeriodoResultado,
} from '../../../../../nomina-mensual/models/proceso-mensual.model';
import { NominaPeriodoCalculoAdapterService } from '../../../../../nomina-mensual/services/nomina-periodo-calculo-adapter.service';
import { NominaPeriodoService } from '../../../../../nomina-mensual/services/nomina-periodo.service';
import { NominaMensualV2PasoCalculoComponent } from './nomina-mensual-v2-paso-calculo.component';

function nominaMock(parcial: Partial<NominaPeriodo> = {}): NominaPeriodo {
  return crearNomina({
    id: 'np-1',
    periodo: '2026-06',
    empresaId: '7',
    empresaNombre: 'Demo',
    tipo: 'mensual',
    estado: 'calculada',
    segmentos: [],
    movimientos: [],
    incidencias: [],
    trabajadorIds: [],
    totalHaberes: 0,
    totalDescuentos: 0,
    totalLiquido: 0,
    createdAt: '2026-06-01T00:00:00Z',
    updatedAt: '2026-06-01T00:00:00Z',
    ...parcial,
  });
}

function liquidacionMock(parcial: Partial<LiquidacionCalculada> = {}): LiquidacionCalculada {
  return {
    periodo: '2026-05',
    idPersona: 2,
    rut: '25050001',
    nombreCompleto: 'Dependiente Activo Auditoria',
    haberesImponibles: [
      { codigo: 'SUELDO_BASE', descripcion: 'Sueldo base', monto: 900000, origen: 'contrato', imponible: true, tributable: true },
    ],
    haberesNoImponibles: [],
    descuentosLegales: [
      { codigo: 'AFP', descripcion: 'Cotizacion AFP Cuprum', monto: 124600, origen: 'afp_vigencia' },
      { codigo: 'SALUD', descripcion: 'Cotizacion salud Fonasa', monto: 76241, origen: 'salud' },
    ],
    descuentosVoluntarios: [],
    baseImponiblePrevisional: 1089157,
    baseTributable: 901782,
    gratificacionLegal: 189157,
    asignacionFamiliar: 0,
    cotizacionAfp: 124600,
    cotizacionSalud: 76241,
    cotizacionAfc: 0,
    cotizacionSis: 17645,
    cotizacionSanna: 32674,
    cotizacionLey16744: 10128,
    impuestoUnico: 0,
    totalHaberes: 1089157,
    totalDescuentos: 200841,
    liquidoAPago: 888316,
    issues: [],
    trazabilidad: [],
    estado: 'calculado_preliminar',
    ...parcial,
  };
}

function resultadoMock(
  liquidaciones: LiquidacionCalculada[] = [liquidacionMock()],
): MotorCalculoPeriodoResultado {
  const totalHaberes = liquidaciones.reduce((acc, l) => acc + l.totalHaberes, 0);
  const totalDescuentos = liquidaciones.reduce((acc, l) => acc + l.totalDescuentos, 0);
  const totalLiquido = liquidaciones.reduce((acc, l) => acc + l.liquidoAPago, 0);
  return {
    periodo: '2026-05',
    estado: 'calculado_preliminar',
    generadoEn: '2026-06-01T00:00:00Z',
    resumen: {
      totalTrabajadoresCalculados: liquidaciones.length,
      totalBloqueados: liquidaciones.filter((l) => l.estado === 'con_bloqueos').length,
      totalConAdvertencias: liquidaciones.filter((l) => l.estado === 'con_advertencias').length,
      totalHaberes,
      totalDescuentos,
      totalLiquidoPreliminar: totalLiquido,
    },
    liquidaciones,
    issues: [],
  };
}

function configurarTestBed(): void {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers: [
      {
        provide: NominaPeriodoService,
        useValue: {
          obtenerNomina: vi.fn().mockResolvedValue(null),
          obtenerResumenValidacionNomina: vi.fn().mockResolvedValue(null),
          registrarEventoAuditoria: vi.fn().mockResolvedValue(undefined),
        },
      },
      {
        provide: NominaPeriodoCalculoAdapterService,
        useValue: { calcular: vi.fn().mockResolvedValue({ resultado: null }) },
      },
    ],
  });
}

describe('NominaMensualV2PasoCalculoComponent (CAL-INV-05)', () => {
  beforeEach(() => {
    configurarTestBed();
  });

  it('no marca cálculo no vigente si la nómina no tiene evidencia', () => {
    const fixture = TestBed.createComponent(NominaMensualV2PasoCalculoComponent);
    const cmp = fixture.componentInstance;

    cmp.nomina.set(nominaMock({ evidenciaCalculo: undefined }));
    expect(cmp.calculoNoVigente()).toBe(false);
    expect(cmp.versionCalculo()).toBe(0);
  });

  it('no marca cálculo no vigente si versionCalculo es 0 (aún sin calcular)', () => {
    const fixture = TestBed.createComponent(NominaMensualV2PasoCalculoComponent);
    const cmp = fixture.componentInstance;

    cmp.nomina.set(
      nominaMock({ evidenciaCalculo: { versionCalculo: 0, calculoVigente: false } }),
    );
    expect(cmp.calculoNoVigente()).toBe(false);
  });

  it('no marca cálculo no vigente si calculoVigente es true', () => {
    const fixture = TestBed.createComponent(NominaMensualV2PasoCalculoComponent);
    const cmp = fixture.componentInstance;

    cmp.nomina.set(
      nominaMock({ evidenciaCalculo: { versionCalculo: 3, calculoVigente: true } }),
    );
    expect(cmp.calculoNoVigente()).toBe(false);
  });

  it('activa la banda de cálculo no vigente con version > 0 y calculoVigente = false', () => {
    const fixture = TestBed.createComponent(NominaMensualV2PasoCalculoComponent);
    const cmp = fixture.componentInstance;

    cmp.nomina.set(
      nominaMock({ evidenciaCalculo: { versionCalculo: 3, calculoVigente: false } }),
    );
    expect(cmp.calculoNoVigente()).toBe(true);
    expect(cmp.versionCalculo()).toBe(3);
  });

  describe('avanzar() — comando único (AG-NAV-03)', () => {
    it('retorna ok:false si no hay resultado de cálculo', async () => {
      const fixture = TestBed.createComponent(NominaMensualV2PasoCalculoComponent);
      const cmp = fixture.componentInstance;
      cmp.resultado.set(null);

      const resultado = await cmp.avanzar();

      expect(resultado).toEqual({
        ok: false,
        razon: 'Procesa el cálculo antes de continuar.',
      });
    });

    it('retorna ok:false si el cálculo no está vigente', async () => {
      const fixture = TestBed.createComponent(NominaMensualV2PasoCalculoComponent);
      const cmp = fixture.componentInstance;
      cmp.nomina.set(
        nominaMock({ evidenciaCalculo: { versionCalculo: 2, calculoVigente: false } }),
      );

      const resultado = await cmp.avanzar();

      expect(resultado.ok).toBe(false);
      if (!resultado.ok) {
        expect(resultado.razon).toMatch(/no está vigente/i);
      }
    });

    it('retorna ok:true cuando hay resultado y el cálculo está vigente', async () => {
      const fixture = TestBed.createComponent(NominaMensualV2PasoCalculoComponent);
      const cmp = fixture.componentInstance;
      cmp.nomina.set(
        nominaMock({ evidenciaCalculo: { versionCalculo: 3, calculoVigente: true } }),
      );
      cmp.resultado.set(resultadoMock());

      const resultado = await cmp.avanzar();

      expect(resultado).toEqual({ ok: true });
    });
  });

  describe('puedeContinuar() — validación pura', () => {
    it('retorna ok:false sin resultado', () => {
      const fixture = TestBed.createComponent(NominaMensualV2PasoCalculoComponent);
      const cmp = fixture.componentInstance;
      cmp.resultado.set(null);
      const r = cmp.puedeContinuar();
      expect(r.ok).toBe(false);
    });

    it('retorna ok:false si el cálculo no está vigente', () => {
      const fixture = TestBed.createComponent(NominaMensualV2PasoCalculoComponent);
      const cmp = fixture.componentInstance;
      cmp.nomina.set(
        nominaMock({ evidenciaCalculo: { versionCalculo: 2, calculoVigente: false } }),
      );
      const r = cmp.puedeContinuar();
      expect(r.ok).toBe(false);
    });
  });

  describe('rediseño NOIA-CALC-DESGLOSE-01', () => {
    it('renderiza el header con título, subtítulo y mini-stats en el aside', () => {
      const fixture = TestBed.createComponent(NominaMensualV2PasoCalculoComponent);
      const cmp = fixture.componentInstance;
      cmp.resultado.set(resultadoMock());
      fixture.detectChanges();

      const el = fixture.nativeElement as HTMLElement;
      const head = el.querySelector('.paso-calc__head');
      const stats = el.querySelector('.paso-calc__stats');
      expect(head?.textContent ?? '').toContain('Cálculo de la nómina');
      expect(head?.textContent ?? '').toContain('Paso 4 · Cálculo');
      expect(stats?.textContent ?? '').toContain('Trabajadores calculados');
      expect(stats?.textContent ?? '').toContain('Líquido total');
      // 4 stats fijas (calculados + haberes + descuentos + líquido). Advertencias y bloqueos son opcionales.
      expect(stats?.querySelectorAll('.paso-calc__stat').length).toBe(4);
    });

    it('expone filas presentadas ordenadas por líquido descendente', () => {
      const fixture = TestBed.createComponent(NominaMensualV2PasoCalculoComponent);
      const cmp = fixture.componentInstance;
      cmp.resultado.set(
        resultadoMock([
          liquidacionMock({ idPersona: 1, liquidoAPago: 700000 }),
          liquidacionMock({ idPersona: 2, liquidoAPago: 900000 }),
          liquidacionMock({ idPersona: 3, liquidoAPago: 800000 }),
        ]),
      );

      const filas = cmp.filasGrilla();
      expect(filas.map((f) => f.idPersona)).toEqual([2, 3, 1]);
    });

    it('infiere el nombre de la AFP desde la descripción del descuento legal', () => {
      const fixture = TestBed.createComponent(NominaMensualV2PasoCalculoComponent);
      const cmp = fixture.componentInstance;
      cmp.resultado.set(resultadoMock());

      const fila = cmp.filasGrilla()[0];
      expect(fila.afp).toBe('Cuprum');
      expect(fila.salud).toBe('Fonasa');
    });

    it('agrega stats de cabecera coherentes con las liquidaciones', () => {
      const fixture = TestBed.createComponent(NominaMensualV2PasoCalculoComponent);
      const cmp = fixture.componentInstance;
      cmp.resultado.set(
        resultadoMock([
          liquidacionMock({ idPersona: 1, totalHaberes: 1000000, totalDescuentos: 200000, liquidoAPago: 800000 }),
          liquidacionMock({ idPersona: 2, totalHaberes: 2000000, totalDescuentos: 400000, liquidoAPago: 1600000 }),
        ]),
      );

      const stats = cmp.statsCabecera();
      expect(stats.trabajadoresCalculados).toBe(2);
      expect(stats.totalHaberes).toBe(3000000);
      expect(stats.totalDescuentos).toBe(600000);
      expect(stats.totalLiquido).toBe(2400000);
    });

    it('abre y cierra la previsualización al invocar abrirPreview/cerrarPreview', () => {
      const fixture = TestBed.createComponent(NominaMensualV2PasoCalculoComponent);
      const cmp = fixture.componentInstance;
      cmp.resultado.set(resultadoMock());

      expect(cmp.filaPreviewAbierta()).toBeNull();
      expect(cmp.liquidacionPreview()).toBeNull();

      const fila = cmp.filasGrilla()[0];
      cmp.abrirPreview(fila);
      expect(cmp.filaPreviewAbierta()).toBe(fila.trabajadorId);
      expect(cmp.liquidacionPreview()?.idPersona).toBe(fila.idPersona);
      expect(cmp.filaPreview()?.trabajadorId).toBe(fila.trabajadorId);

      cmp.cerrarPreview();
      expect(cmp.filaPreviewAbierta()).toBeNull();
      expect(cmp.liquidacionPreview()).toBeNull();
    });

    it('muestra el estado vacío cuando no hay resultado y no está cargando', () => {
      const fixture = TestBed.createComponent(NominaMensualV2PasoCalculoComponent);
      const cmp = fixture.componentInstance;
      cmp.cargando.set(false);
      cmp.resultado.set(null);
      fixture.detectChanges();

      const html = (fixture.nativeElement as HTMLElement).textContent ?? '';
      expect(html).toContain('Aún no has procesado el cálculo');
    });

    it('renderiza la grilla del paso cuando hay resultado', () => {
      const fixture = TestBed.createComponent(NominaMensualV2PasoCalculoComponent);
      const cmp = fixture.componentInstance;
      cmp.resultado.set(resultadoMock());
      fixture.detectChanges();

      const grid = (fixture.nativeElement as HTMLElement).querySelector('app-data-grid');
      expect(grid).not.toBeNull();
    });

    it('cambia el texto del CTA según el estado (Calcular nómina / Recalcular / Calculando…)', () => {
      const fixture = TestBed.createComponent(NominaMensualV2PasoCalculoComponent);
      const cmp = fixture.componentInstance;

      expect(cmp.textoCtaCalculo()).toBe('Calcular nómina');

      cmp.resultado.set(resultadoMock());
      expect(cmp.textoCtaCalculo()).toBe('Recalcular');

      cmp.calculando.set(true);
      expect(cmp.textoCtaCalculo()).toBe('Calculando…');
    });
  });
});
