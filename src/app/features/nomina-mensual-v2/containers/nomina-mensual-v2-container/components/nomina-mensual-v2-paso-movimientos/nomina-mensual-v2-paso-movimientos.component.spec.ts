import { TestBed } from '@angular/core/testing';
import { describe, expect, it, beforeEach, vi } from 'vitest';

import type { FilaMovimientoConfigurado } from '../../../../../nomina-mensual/models/movimiento-nomina.models';
import type { FilaTrabajadorNominaResumen } from '../../../../../nomina-mensual/models/nomina-periodo.models';
import { NominaPeriodoService } from '../../../../../nomina-mensual/services/nomina-periodo.service';
import { NominaMensualV2PasoMovimientosComponent } from './nomina-mensual-v2-paso-movimientos.component';

function filaMock(parcial: Partial<FilaTrabajadorNominaResumen> = {}): FilaTrabajadorNominaResumen {
  return {
    trabajadorId: 'tr-1',
    nombre: 'Carlos Soto',
    rut: '17.222.333-4',
    estado: 'listo',
    totalIncidenciasCriticas: 0,
    totalAdvertencias: 0,
    totalMovimientos: 1,
    tieneDatosBancarios: true,
    tieneDatosPrevisionales: true,
    ...parcial,
  };
}

function configuradoMock(
  parcial: Partial<FilaMovimientoConfigurado> = {},
): FilaMovimientoConfigurado {
  return {
    filaId: 'tr-1::rec-1::HABER_FIJO',
    trabajadorId: 'tr-1',
    trabajadorNombre: 'Carlos Soto',
    rut: '17.222.333-4',
    recurrenteId: 'rec-1',
    concepto: 'HABER_FIJO',
    categoria: 'haber',
    monto: 120000,
    frecuencia: 'mensual',
    vigenciaDesde: '2026-01-01',
    estadoEnNomina: 'pendiente',
    ...parcial,
  };
}

function configurarTestBed(servicio: Record<string, unknown>): void {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers: [{ provide: NominaPeriodoService, useValue: servicio }],
  });
}

describe('NominaMensualV2PasoMovimientosComponent (MOV-ID-03)', () => {
  let servicio: Record<string, unknown>;

  beforeEach(() => {
    servicio = {
      listarRecurrentes: vi.fn().mockResolvedValue([]),
      listarMovimientos: vi.fn().mockResolvedValue([]),
      filtrarDotacion: vi.fn().mockResolvedValue({
        filas: [
          filaMock({ trabajadorId: 'tr-1', nombre: 'Carlos Soto', rut: '17.222.333-4' }),
          filaMock({ trabajadorId: 'tr-2', nombre: 'María Rojas', rut: '18.444.555-6' }),
        ],
        total: 2,
      }),
      listarMovimientosConfigurados: vi.fn().mockResolvedValue([]),
      aplicarRecurrentesANomina: vi.fn().mockResolvedValue([]),
      omitirMovimiento: vi.fn().mockResolvedValue(undefined),
      aplicarMovimiento: vi.fn().mockResolvedValue(undefined),
      agregarMovimientoManual: vi.fn().mockResolvedValue(undefined),
    };
  });

  it('hidrata el cache de identidades al cargar la dotación', async () => {
    configurarTestBed(servicio);
    const fixture = TestBed.createComponent(NominaMensualV2PasoMovimientosComponent);
    fixture.componentRef.setInput('nominaPeriodoId', 'np-1');
    const cmp = fixture.componentInstance;

    await cmp.cargar();

    expect(cmp.nombreTrabajador('tr-1')).toBe('Carlos Soto');
    expect(cmp.rutTrabajador('tr-1')).toBe('17.222.333-4');
    expect(cmp.nombreTrabajador('tr-2')).toBe('María Rojas');
    expect(cmp.rutTrabajador('tr-2')).toBe('18.444.555-6');
  });

  it('fallback explícito cuando el trabajador no está en cache', () => {
    configurarTestBed(servicio);
    const fixture = TestBed.createComponent(NominaMensualV2PasoMovimientosComponent);
    const cmp = fixture.componentInstance;

    expect(cmp.nombreTrabajador('tr-no-cargado')).toBe('Trabajador sin identificar');
    expect(cmp.rutTrabajador('tr-no-cargado')).toBe('');
  });

  it('buscarTrabajadores mergea identidades nuevas al cache', async () => {
    (servicio['filtrarDotacion'] as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      filas: [filaMock({ trabajadorId: 'tr-1' })],
      total: 1,
    });
    configurarTestBed(servicio);
    const fixture = TestBed.createComponent(NominaMensualV2PasoMovimientosComponent);
    fixture.componentRef.setInput('nominaPeriodoId', 'np-1');
    const cmp = fixture.componentInstance;

    await cmp.cargar();

    (servicio['filtrarDotacion'] as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      filas: [filaMock({ trabajadorId: 'tr-3', nombre: 'Luis Vera', rut: '19.111.222-3' })],
      total: 1,
    });

    await cmp.buscarTrabajadores('Luis');

    expect(cmp.nombreTrabajador('tr-3')).toBe('Luis Vera');
    expect(cmp.rutTrabajador('tr-3')).toBe('19.111.222-3');
    expect(cmp.nombreTrabajador('tr-1')).toBe('Carlos Soto');
  });

  describe('avanzar() — comando único (AG-NAV-03)', () => {
    it('retorna ok:false sin movimientos aplicados (criterio Generador secuencial puro)', async () => {
      configurarTestBed(servicio);
      const fixture = TestBed.createComponent(NominaMensualV2PasoMovimientosComponent);
      const cmp = fixture.componentInstance;

      const resultado = await cmp.avanzar();

      expect(resultado.ok).toBe(false);
      if (!resultado.ok) {
        expect(resultado.razon).toBeTruthy();
      }
    });

    it('retorna ok:false mientras se aplican recurrentes', async () => {
      configurarTestBed(servicio);
      const fixture = TestBed.createComponent(NominaMensualV2PasoMovimientosComponent);
      const cmp = fixture.componentInstance;
      cmp.aplicando.set(true);

      const resultado = await cmp.avanzar();

      expect(resultado).toEqual({ ok: false, razon: 'Hay movimientos aplicándose.' });
    });

    it('retorna ok:true cuando hay al menos un movimiento aplicado', async () => {
      configurarTestBed(servicio);
      const fixture = TestBed.createComponent(NominaMensualV2PasoMovimientosComponent);
      const cmp = fixture.componentInstance;
      cmp.movimientos.set([
        {
          id: 'mov-1',
          nominaPeriodoId: 'np-1',
          trabajadorId: 'tr-1',
          tipo: 'manual',
          estado: 'aplicado',
        } as never,
      ]);
      const resultado = await cmp.avanzar();
      expect(resultado).toEqual({ ok: true });
    });
  });

  describe('Tab "Configurados" — vista derivada de recurrentes vs nómina', () => {
    it('cargar() hidrata movimientosConfigurados desde el servicio', async () => {
      const filas = [
        configuradoMock({
          filaId: 'tr-1::rec-1::HABER_FIJO',
          estadoEnNomina: 'pendiente',
        }),
        configuradoMock({
          filaId: 'tr-2::rec-1::HABER_FIJO',
          trabajadorId: 'tr-2',
          trabajadorNombre: 'María Rojas',
          rut: '18.444.555-6',
          estadoEnNomina: 'ya-cargado',
          movimientoNominaId: 'mov-x',
        }),
        configuradoMock({
          filaId: 'tr-3::rec-1::HABER_FIJO',
          trabajadorId: 'tr-3',
          trabajadorNombre: 'Luis Vera',
          rut: '19.111.222-3',
          estadoEnNomina: 'omitido-este-mes',
          movimientoNominaId: 'mov-y',
        }),
      ];
      (servicio['listarMovimientosConfigurados'] as ReturnType<typeof vi.fn>).mockResolvedValue(filas);

      configurarTestBed(servicio);
      const fixture = TestBed.createComponent(NominaMensualV2PasoMovimientosComponent);
      fixture.componentRef.setInput('nominaPeriodoId', 'np-1');
      const cmp = fixture.componentInstance;

      await cmp.cargar();

      expect(cmp.movimientosConfigurados()).toEqual(filas);
      expect(cmp.statsConfigurados()).toEqual({
        total: 3,
        pendientes: 1,
        yaCargados: 1,
        omitidos: 1,
      });
      expect(cmp.hayPendientesPorCargar()).toBe(true);
    });

    it('hayPendientesPorCargar es false cuando todas las filas están cargadas u omitidas', async () => {
      (servicio['listarMovimientosConfigurados'] as ReturnType<typeof vi.fn>).mockResolvedValue([
        configuradoMock({ estadoEnNomina: 'ya-cargado', movimientoNominaId: 'm-1' }),
        configuradoMock({
          filaId: 'tr-2::rec-1::HABER_FIJO',
          trabajadorId: 'tr-2',
          estadoEnNomina: 'omitido-este-mes',
          movimientoNominaId: 'm-2',
        }),
      ]);

      configurarTestBed(servicio);
      const fixture = TestBed.createComponent(NominaMensualV2PasoMovimientosComponent);
      fixture.componentRef.setInput('nominaPeriodoId', 'np-1');
      const cmp = fixture.componentInstance;
      await cmp.cargar();

      expect(cmp.hayPendientesPorCargar()).toBe(false);
      expect(cmp.statsConfigurados().pendientes).toBe(0);
    });

    it('movimientosConfiguradosDeTrabajador agrupa por trabajador', async () => {
      (servicio['listarMovimientosConfigurados'] as ReturnType<typeof vi.fn>).mockResolvedValue([
        configuradoMock({ filaId: 'tr-1::rec-1::A', concepto: 'A' }),
        configuradoMock({ filaId: 'tr-1::rec-2::B', concepto: 'B' }),
        configuradoMock({
          filaId: 'tr-2::rec-1::A',
          trabajadorId: 'tr-2',
          trabajadorNombre: 'María Rojas',
          concepto: 'A',
        }),
      ]);
      configurarTestBed(servicio);
      const fixture = TestBed.createComponent(NominaMensualV2PasoMovimientosComponent);
      fixture.componentRef.setInput('nominaPeriodoId', 'np-1');
      const cmp = fixture.componentInstance;
      await cmp.cargar();

      const tr1 = cmp.movimientosConfiguradosDeTrabajador('tr-1');
      const tr2 = cmp.movimientosConfiguradosDeTrabajador('tr-2');
      const trX = cmp.movimientosConfiguradosDeTrabajador('tr-x');

      expect(tr1).toHaveLength(2);
      expect(tr1.map((m) => m.concepto).sort()).toEqual(['A', 'B']);
      expect(tr2).toHaveLength(1);
      expect(trX).toHaveLength(0);
    });

    it('rowKeyConfigurado devuelve el filaId estable (apta para expandedRowKeys)', () => {
      configurarTestBed(servicio);
      const fixture = TestBed.createComponent(NominaMensualV2PasoMovimientosComponent);
      const cmp = fixture.componentInstance;
      const fila = configuradoMock({ filaId: 'tr-9::rec-9::TIPO_X' });
      expect(cmp.rowKeyConfigurado(fila)).toBe('tr-9::rec-9::TIPO_X');
      expect(cmp.trackByConfigurado(0, fila)).toBe('tr-9::rec-9::TIPO_X');
    });

    it('cargarMovimientosConfigurados delega en aplicarRecurrentesANomina y mensaje humano', async () => {
      (servicio['aplicarRecurrentesANomina'] as ReturnType<typeof vi.fn>).mockResolvedValue([
        { id: 'mov-1', estado: 'aplicado' },
        { id: 'mov-2', estado: 'aplicado' },
      ]);
      configurarTestBed(servicio);
      const fixture = TestBed.createComponent(NominaMensualV2PasoMovimientosComponent);
      fixture.componentRef.setInput('nominaPeriodoId', 'np-1');
      const cmp = fixture.componentInstance;

      await cmp.cargarMovimientosConfigurados();

      expect(servicio['aplicarRecurrentesANomina']).toHaveBeenCalledWith('np-1');
      expect(cmp.mensaje()).toMatch(/Se cargaron 2 movimientos configurados/);
      expect(cmp.error()).toBeNull();
    });

    it('cargarMovimientosConfigurados muestra mensaje "sin pendientes" cuando no se carga nada nuevo', async () => {
      (servicio['aplicarRecurrentesANomina'] as ReturnType<typeof vi.fn>).mockResolvedValue([]);
      configurarTestBed(servicio);
      const fixture = TestBed.createComponent(NominaMensualV2PasoMovimientosComponent);
      fixture.componentRef.setInput('nominaPeriodoId', 'np-1');
      const cmp = fixture.componentInstance;

      await cmp.cargarMovimientosConfigurados();

      expect(cmp.mensaje()).toBe('No había movimientos pendientes por cargar.');
    });

    it('cargarMovimientosConfigurados captura errores y los expone con copy humano', async () => {
      (servicio['aplicarRecurrentesANomina'] as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('boom'),
      );
      configurarTestBed(servicio);
      const fixture = TestBed.createComponent(NominaMensualV2PasoMovimientosComponent);
      fixture.componentRef.setInput('nominaPeriodoId', 'np-1');
      const cmp = fixture.componentInstance;

      await cmp.cargarMovimientosConfigurados();

      expect(cmp.error()).toBe('No fue posible cargar los movimientos configurados: boom');
    });

    it('arranca con tabActivo === "configurados"', () => {
      configurarTestBed(servicio);
      const fixture = TestBed.createComponent(NominaMensualV2PasoMovimientosComponent);
      expect(fixture.componentInstance.tabActivo()).toBe('configurados');
    });
  });

  describe('puedeContinuar() — validación pura', () => {
    it('retorna ok:false sin movimientos aplicados', () => {
      configurarTestBed(servicio);
      const fixture = TestBed.createComponent(NominaMensualV2PasoMovimientosComponent);
      const cmp = fixture.componentInstance;
      const r = cmp.puedeContinuar();
      expect(r.ok).toBe(false);
    });

    it('retorna ok:true cuando hay al menos un movimiento aplicado', () => {
      configurarTestBed(servicio);
      const fixture = TestBed.createComponent(NominaMensualV2PasoMovimientosComponent);
      const cmp = fixture.componentInstance;
      cmp.movimientos.set([
        {
          id: 'mov-1',
          nominaPeriodoId: 'np-1',
          trabajadorId: 'tr-1',
          tipo: 'manual',
          estado: 'aplicado',
        } as never,
      ]);
      expect(cmp.puedeContinuar()).toEqual({ ok: true });
    });
  });
});
