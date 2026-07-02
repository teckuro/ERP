import { TestBed } from '@angular/core/testing';
import { describe, expect, it, beforeEach, vi } from 'vitest';

import type {
  FilaTrabajadorMovimientos,
  ItemMovimientoTrabajador,
} from '../../../../../nomina-mensual/models/movimiento-nomina.models';
import type { FilaTrabajadorNominaResumen } from '../../../../../nomina-mensual/models/nomina-periodo.models';
import { NominaPeriodoService } from '../../../../../nomina-mensual/services/nomina-periodo.service';
import { NominaMensualV2PasoMovimientosComponent } from './nomina-mensual-v2-paso-movimientos.component';

function dotacionMock(parcial: Partial<FilaTrabajadorNominaResumen> = {}): FilaTrabajadorNominaResumen {
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

function itemMock(parcial: Partial<ItemMovimientoTrabajador> = {}): ItemMovimientoTrabajador {
  return {
    itemId: 'cfg::tr-1::rec-1::BONO',
    origen: 'configurado',
    estado: 'pendiente',
    concepto: 'BONO',
    categoria: 'haber',
    monto: 1000,
    recurrenteId: 'rec-1',
    ...parcial,
  };
}

function filaMock(parcial: Partial<FilaTrabajadorMovimientos> = {}): FilaTrabajadorMovimientos {
  return {
    trabajadorId: 'tr-1',
    nombre: 'Carlos Soto',
    rut: '17.222.333-4',
    cargo: 'Operario',
    centroCosto: 'CC',
    totalHaberes: 0,
    totalDescuentos: 0,
    cuentaAusencias: 0,
    cuentaInformativos: 0,
    cuentaPendientes: 0,
    cuentaAplicados: 0,
    cuentaOmitidos: 0,
    cuentaManualesAplicados: 0,
    items: [],
    ...parcial,
  };
}

function configurarTestBed(servicio: Record<string, unknown>): void {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers: [{ provide: NominaPeriodoService, useValue: servicio }],
  });
}

describe('NominaMensualV2PasoMovimientosComponent (UI unificada)', () => {
  let servicio: Record<string, unknown>;

  const RESUMEN_VACIO = {
    trabajadoresConMovimientos: 0,
    trabajadoresConPendientes: 0,
    totalHaberes: 0,
    totalDescuentos: 0,
    totalPendientes: 0,
    totalAplicados: 0,
  };

  beforeEach(() => {
    servicio = {
      filtrarMovimientosPorTrabajador: vi.fn().mockResolvedValue({ filas: [], total: 0 }),
      obtenerResumenMovimientos: vi.fn().mockResolvedValue(RESUMEN_VACIO),
      listarItemsMovimientosDeTrabajador: vi.fn().mockResolvedValue([]),
      filtrarDotacion: vi.fn().mockResolvedValue({
        filas: [
          dotacionMock({ trabajadorId: 'tr-1', nombre: 'Carlos Soto', rut: '17.222.333-4' }),
          dotacionMock({ trabajadorId: 'tr-2', nombre: 'María Rojas', rut: '18.444.555-6' }),
        ],
        total: 2,
      }),
      aplicarRecurrentesANomina: vi.fn().mockResolvedValue([]),
      aplicarRecurrentesDeTrabajador: vi.fn().mockResolvedValue([]),
      aplicarRecurrenteIndividual: vi.fn().mockResolvedValue(null),
      omitirMovimiento: vi.fn().mockResolvedValue(undefined),
      aplicarMovimiento: vi.fn().mockResolvedValue(undefined),
      eliminarMovimientoManual: vi.fn().mockResolvedValue(undefined),
      agregarMovimientoManual: vi.fn().mockResolvedValue(undefined),
    };
  });

  it('cargar() hidrata filasTrabajadores y stats desde el servidor (BKL-02)', async () => {
    const filas = [
      filaMock({ trabajadorId: 'tr-1', cuentaPendientes: 2, itemsCargados: false, cuentaItems: 2 }),
      filaMock({ trabajadorId: 'tr-2', nombre: 'María Rojas', totalHaberes: 5000, cuentaAplicados: 1 }),
    ];
    (servicio['filtrarMovimientosPorTrabajador'] as ReturnType<typeof vi.fn>).mockResolvedValue({
      filas,
      total: 2,
    });
    (servicio['obtenerResumenMovimientos'] as ReturnType<typeof vi.fn>).mockResolvedValue({
      ...RESUMEN_VACIO,
      trabajadoresConPendientes: 1,
      totalHaberes: 5000,
      totalPendientes: 2,
      totalAplicados: 1,
    });

    configurarTestBed(servicio);
    const fixture = TestBed.createComponent(NominaMensualV2PasoMovimientosComponent);
    fixture.componentRef.setInput('nominaPeriodoId', 'np-1');
    const cmp = fixture.componentInstance;

    await cmp.cargar();

    expect(servicio['filtrarMovimientosPorTrabajador']).toHaveBeenCalledWith(
      'np-1',
      {},
      expect.objectContaining({ page: 1, pageSize: 25 }),
    );
    expect(cmp.filasTrabajadores()).toEqual(filas);
    expect(cmp.totalFiltrado()).toBe(2);
    expect(cmp.statsGlobales().trabajadoresConPendientes).toBe(1);
    expect(cmp.statsGlobales().totalHaberes).toBe(5000);
  });

  it('CTA "Cargar todos los pendientes" deshabilitado cuando no hay pendientes', async () => {
    configurarTestBed(servicio);
    const fixture = TestBed.createComponent(NominaMensualV2PasoMovimientosComponent);
    fixture.componentRef.setInput('nominaPeriodoId', 'np-1');
    const cmp = fixture.componentInstance;
    await cmp.cargar();

    expect(cmp.hayPendientesGlobales()).toBe(false);
    expect(cmp.statsGlobales().totalPendientes).toBe(0);
  });

  it('manejarConsultaServidor traduce filtros de grilla y recarga la página', async () => {
    configurarTestBed(servicio);
    const fixture = TestBed.createComponent(NominaMensualV2PasoMovimientosComponent);
    fixture.componentRef.setInput('nominaPeriodoId', 'np-1');
    const cmp = fixture.componentInstance;

    await cmp.manejarConsultaServidor({
      page: 2,
      pageSize: 50,
      filterValues: { estado: 'con-pendientes', buscar: ' ana ' },
    });

    expect(servicio['filtrarMovimientosPorTrabajador']).toHaveBeenLastCalledWith(
      'np-1',
      { estado: 'con-pendientes', busqueda: 'ana' },
      expect.objectContaining({ page: 2, pageSize: 50 }),
    );
  });

  it('expandir una fila sin items hidrata el detalle vía listarItemsMovimientosDeTrabajador', async () => {
    const fila = filaMock({ trabajadorId: 'tr-1', itemsCargados: false, cuentaItems: 1 });
    (servicio['filtrarMovimientosPorTrabajador'] as ReturnType<typeof vi.fn>).mockResolvedValue({
      filas: [fila],
      total: 1,
    });
    const items = [itemMock({ estado: 'aplicado', movimientoNominaId: 'mov-1' })];
    (servicio['listarItemsMovimientosDeTrabajador'] as ReturnType<typeof vi.fn>).mockResolvedValue(items);

    configurarTestBed(servicio);
    const fixture = TestBed.createComponent(NominaMensualV2PasoMovimientosComponent);
    fixture.componentRef.setInput('nominaPeriodoId', 'np-1');
    const cmp = fixture.componentInstance;
    await cmp.cargar();

    await cmp.manejarExpansionFila({ row: cmp.filasTrabajadores()[0], expanded: true });

    expect(servicio['listarItemsMovimientosDeTrabajador']).toHaveBeenCalledWith('np-1', 'tr-1');
    const actualizada = cmp.filasTrabajadores()[0];
    expect(actualizada.items).toEqual(items);
    expect(actualizada.itemsCargados).toBe(true);
  });

  it('cargarPendientesGlobales delega en aplicarRecurrentesANomina y compone mensaje humano', async () => {
    (servicio['aplicarRecurrentesANomina'] as ReturnType<typeof vi.fn>).mockResolvedValue([
      { id: 'a', estado: 'aplicado' },
      { id: 'b', estado: 'aplicado' },
    ]);
    configurarTestBed(servicio);
    const fixture = TestBed.createComponent(NominaMensualV2PasoMovimientosComponent);
    fixture.componentRef.setInput('nominaPeriodoId', 'np-1');
    const cmp = fixture.componentInstance;

    await cmp.cargarPendientesGlobales();

    expect(servicio['aplicarRecurrentesANomina']).toHaveBeenCalledWith('np-1');
    expect(cmp.mensaje()).toMatch(/Se cargaron 2 movimientos/);
    expect(cmp.error()).toBeNull();
  });

  it('cargarPendientesGlobales muestra "sin pendientes" cuando no aplica nada', async () => {
    (servicio['aplicarRecurrentesANomina'] as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    configurarTestBed(servicio);
    const fixture = TestBed.createComponent(NominaMensualV2PasoMovimientosComponent);
    fixture.componentRef.setInput('nominaPeriodoId', 'np-1');
    const cmp = fixture.componentInstance;

    await cmp.cargarPendientesGlobales();
    expect(cmp.mensaje()).toBe('No había pendientes por cargar.');
  });

  it('cargarPendientesDeTrabajador llama al servicio con el trabajadorId correcto', async () => {
    (servicio['aplicarRecurrentesDeTrabajador'] as ReturnType<typeof vi.fn>).mockResolvedValue([
      { id: 'a', estado: 'aplicado' },
    ]);
    configurarTestBed(servicio);
    const fixture = TestBed.createComponent(NominaMensualV2PasoMovimientosComponent);
    fixture.componentRef.setInput('nominaPeriodoId', 'np-1');
    const cmp = fixture.componentInstance;

    await cmp.cargarPendientesDeTrabajador('tr-77');

    expect(servicio['aplicarRecurrentesDeTrabajador']).toHaveBeenCalledWith('np-1', 'tr-77');
    expect(cmp.mensaje()).toMatch(/Se cargaron 1 movimientos al trabajador/);
  });

  describe('acciones por item', () => {
    it('cargarItem llama aplicarRecurrenteIndividual con (nominaId, trabajadorId, recurrenteId)', async () => {
      configurarTestBed(servicio);
      const fixture = TestBed.createComponent(NominaMensualV2PasoMovimientosComponent);
      fixture.componentRef.setInput('nominaPeriodoId', 'np-1');
      const cmp = fixture.componentInstance;
      const item = itemMock({ estado: 'pendiente', recurrenteId: 'rec-9' });

      await cmp.cargarItem(item, 'tr-3');

      expect(servicio['aplicarRecurrenteIndividual']).toHaveBeenCalledWith('np-1', 'tr-3', 'rec-9');
    });

    it('cargarItem ignora items que no están pendientes', async () => {
      configurarTestBed(servicio);
      const fixture = TestBed.createComponent(NominaMensualV2PasoMovimientosComponent);
      fixture.componentRef.setInput('nominaPeriodoId', 'np-1');
      const cmp = fixture.componentInstance;
      const item = itemMock({ estado: 'aplicado', movimientoNominaId: 'mov-1' });

      await cmp.cargarItem(item, 'tr-1');
      expect(servicio['aplicarRecurrenteIndividual']).not.toHaveBeenCalled();
    });

    it('omitirItem llama omitirMovimiento con el movimientoNominaId', async () => {
      configurarTestBed(servicio);
      const fixture = TestBed.createComponent(NominaMensualV2PasoMovimientosComponent);
      const cmp = fixture.componentInstance;
      await cmp.omitirItem(itemMock({ estado: 'aplicado', movimientoNominaId: 'mov-1' }));
      expect(servicio['omitirMovimiento']).toHaveBeenCalledWith('mov-1');
    });

    it('reaplicarItem llama aplicarMovimiento', async () => {
      configurarTestBed(servicio);
      const fixture = TestBed.createComponent(NominaMensualV2PasoMovimientosComponent);
      const cmp = fixture.componentInstance;
      await cmp.reaplicarItem(itemMock({ estado: 'omitido', movimientoNominaId: 'mov-2' }));
      expect(servicio['aplicarMovimiento']).toHaveBeenCalledWith('mov-2');
    });

    it('eliminarItemManual solo opera con items manuales', async () => {
      configurarTestBed(servicio);
      const fixture = TestBed.createComponent(NominaMensualV2PasoMovimientosComponent);
      const cmp = fixture.componentInstance;

      await cmp.eliminarItemManual(
        itemMock({ origen: 'manual', estado: 'aplicado', movimientoNominaId: 'mov-3' }),
      );
      expect(servicio['eliminarMovimientoManual']).toHaveBeenCalledWith('mov-3');

      (servicio['eliminarMovimientoManual'] as ReturnType<typeof vi.fn>).mockClear();

      await cmp.eliminarItemManual(
        itemMock({ origen: 'configurado', estado: 'aplicado', movimientoNominaId: 'mov-4' }),
      );
      expect(servicio['eliminarMovimientoManual']).not.toHaveBeenCalled();
    });
  });

  describe('modal manual', () => {
    it('abrirModalManual marca el flag y preselecciona trabajador opcional', () => {
      configurarTestBed(servicio);
      const fixture = TestBed.createComponent(NominaMensualV2PasoMovimientosComponent);
      const cmp = fixture.componentInstance;

      cmp.abrirModalManual('tr-99');
      expect(cmp.modalManualAbierto()).toBe(true);
      expect(cmp.borradorManual().trabajadorId).toBe('tr-99');

      cmp.cerrarModalManual();
      expect(cmp.modalManualAbierto()).toBe(false);
    });

    it('crearMovimientoManual recarga al servicio agregar + cargar y cierra el modal', async () => {
      configurarTestBed(servicio);
      const fixture = TestBed.createComponent(NominaMensualV2PasoMovimientosComponent);
      fixture.componentRef.setInput('nominaPeriodoId', 'np-1');
      const cmp = fixture.componentInstance;
      cmp.abrirModalManual('tr-1');
      cmp.actualizarTipoManual('BONO');
      cmp.actualizarMontoManual(5000);

      await cmp.crearMovimientoManual();

      expect(servicio['agregarMovimientoManual']).toHaveBeenCalledWith(
        expect.objectContaining({
          nominaPeriodoId: 'np-1',
          trabajadorId: 'tr-1',
          tipo: 'BONO',
          categoria: 'haber',
          monto: 5000,
          estado: 'aplicado',
        }),
      );
      expect(cmp.modalManualAbierto()).toBe(false);
      expect(cmp.mensaje()).toMatch(/manual/);
    });

    it('crearMovimientoManual no llama al servicio si no hay trabajadorId', async () => {
      configurarTestBed(servicio);
      const fixture = TestBed.createComponent(NominaMensualV2PasoMovimientosComponent);
      fixture.componentRef.setInput('nominaPeriodoId', 'np-1');
      const cmp = fixture.componentInstance;
      cmp.abrirModalManual();

      await cmp.crearMovimientoManual();
      expect(servicio['agregarMovimientoManual']).not.toHaveBeenCalled();
    });
  });

  describe('puedeContinuar() / avanzar()', () => {
    it('retorna ok:false sin movimientos aplicados', () => {
      configurarTestBed(servicio);
      const fixture = TestBed.createComponent(NominaMensualV2PasoMovimientosComponent);
      const r = fixture.componentInstance.puedeContinuar();
      expect(r.ok).toBe(false);
    });

    it('retorna ok:true cuando el resumen global reporta aplicados', async () => {
      (servicio['obtenerResumenMovimientos'] as ReturnType<typeof vi.fn>).mockResolvedValue({
        ...RESUMEN_VACIO,
        totalAplicados: 1,
      });
      configurarTestBed(servicio);
      const fixture = TestBed.createComponent(NominaMensualV2PasoMovimientosComponent);
      fixture.componentRef.setInput('nominaPeriodoId', 'np-1');
      const cmp = fixture.componentInstance;
      await cmp.cargar();
      expect(cmp.puedeContinuar()).toEqual({ ok: true });
    });

    it('avanzar() devuelve el mismo resultado que puedeContinuar()', async () => {
      configurarTestBed(servicio);
      const fixture = TestBed.createComponent(NominaMensualV2PasoMovimientosComponent);
      const cmp = fixture.componentInstance;
      cmp.aplicando.set(true);

      const r = await cmp.avanzar();
      expect(r).toEqual({ ok: false, razon: 'Hay movimientos aplicándose.' });
    });
  });

  describe('cache de identidades (compat con specs previos)', () => {
    it('hidrata cache al cargar', async () => {
      (servicio['filtrarMovimientosPorTrabajador'] as ReturnType<typeof vi.fn>).mockResolvedValue({
        filas: [
          filaMock({ trabajadorId: 'tr-1', nombre: 'Carlos Soto', rut: '17.222.333-4' }),
          filaMock({ trabajadorId: 'tr-2', nombre: 'María Rojas', rut: '18.444.555-6' }),
        ],
        total: 2,
      });
      configurarTestBed(servicio);
      const fixture = TestBed.createComponent(NominaMensualV2PasoMovimientosComponent);
      fixture.componentRef.setInput('nominaPeriodoId', 'np-1');
      const cmp = fixture.componentInstance;

      await cmp.cargar();
      expect(cmp.nombreTrabajador('tr-1')).toBe('Carlos Soto');
      expect(cmp.rutTrabajador('tr-2')).toBe('18.444.555-6');
    });

    it('fallback explícito cuando el trabajador no está en cache', () => {
      configurarTestBed(servicio);
      const fixture = TestBed.createComponent(NominaMensualV2PasoMovimientosComponent);
      const cmp = fixture.componentInstance;

      expect(cmp.nombreTrabajador('tr-no-cargado')).toBe('Trabajador sin identificar');
      expect(cmp.rutTrabajador('tr-no-cargado')).toBe('');
    });
  });
});
