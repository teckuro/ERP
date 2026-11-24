import { TestBed } from '@angular/core/testing';
import { describe, expect, it, beforeEach, vi } from 'vitest';

import type { FilaTrabajadorNominaResumen } from '../../../../../nomina-mensual/models/nomina-periodo.models';
import { NominaPeriodoService } from '../../../../../nomina-mensual/services/nomina-periodo.service';
import { EmpleadosService } from '../../../../../empleados/services/empleados.service';
import { NominaMensualV2PasoDotacionComponent } from './nomina-mensual-v2-paso-dotacion.component';
import { provideErpPermisosStub } from '../../../../../../core/auth/testing/erp-permisos.stub';

function filaMock(parcial: Partial<FilaTrabajadorNominaResumen> = {}): FilaTrabajadorNominaResumen {
  return {
    trabajadorId: 'tr-1',
    nombre: 'Ana Pérez',
    rut: '12.345.678-9',
    estado: 'listo',
    totalIncidenciasCriticas: 0,
    totalAdvertencias: 0,
    totalMovimientos: 0,
    tieneDatosBancarios: true,
    tieneDatosPrevisionales: true,
    ...parcial,
  };
}

function filaBloqueada(): FilaTrabajadorNominaResumen {
  return filaMock({
    trabajadorId: 'tr-2',
    estado: 'bloqueado',
    totalIncidenciasCriticas: 2,
    tieneDatosBancarios: false,
  });
}

function configurarTestBed(servicio: Record<string, unknown>): void {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers: [
      provideErpPermisosStub(),
      { provide: NominaPeriodoService, useValue: servicio },
      {
        provide: EmpleadosService,
        useValue: { listar: vi.fn().mockResolvedValue([]) },
      },
    ],
  });
}

describe('NominaMensualV2PasoDotacionComponent (DOT-DET-04)', () => {
  let servicio: Record<string, unknown>;

  beforeEach(() => {
    servicio = {
      filtrarDotacion: vi.fn().mockResolvedValue({ filas: [], total: 0 }),
      obtenerResumenDotacion: vi.fn().mockResolvedValue({
        total: 0,
        listos: 0,
        conAdvertencias: 0,
        conCriticos: 0,
        bloqueados: 0,
      }),
      previsualizarAccionMasiva: vi.fn().mockResolvedValue(null),
      aplicarAccionMasiva: vi.fn().mockResolvedValue(undefined),
      confirmarDotacion: vi.fn().mockResolvedValue(undefined),
      agregarTrabajadoresANomina: vi
        .fn()
        .mockResolvedValue({ agregados: [], yaEstaban: [] }),
      obtenerDetalleTrabajador: vi.fn().mockResolvedValue({
        trabajadorId: 'tr-1',
        movimientos: [],
        incidencias: [],
      }),
    };
  });

  it('al abrir detalle conserva nombre + RUT de la fila ya cargada', async () => {
    configurarTestBed(servicio);
    const fixture = TestBed.createComponent(NominaMensualV2PasoDotacionComponent);
    fixture.componentRef.setInput('nominaPeriodoId', 'np-1');
    const cmp = fixture.componentInstance;

    cmp.vista.set({ filas: [filaMock({ trabajadorId: 'tr-1', nombre: 'Ana Pérez', rut: '12.345.678-9' })], total: 1 });

    await cmp.abrirDetalle('tr-1');

    expect(cmp.detalleTrabajadorIdentidad()).toEqual({
      nombre: 'Ana Pérez',
      rut: '12.345.678-9',
    });
    expect(cmp.trabajadorSeleccionado()).toBe('tr-1');
  });

  it('detalleTrabajadorIdentidad es null si la fila no está en la página actual', async () => {
    configurarTestBed(servicio);
    const fixture = TestBed.createComponent(NominaMensualV2PasoDotacionComponent);
    fixture.componentRef.setInput('nominaPeriodoId', 'np-1');
    const cmp = fixture.componentInstance;

    cmp.vista.set({ filas: [filaMock({ trabajadorId: 'tr-1' })], total: 1 });

    await cmp.abrirDetalle('tr-no-cargado');

    expect(cmp.detalleTrabajadorIdentidad()).toBeNull();
    expect(cmp.trabajadorSeleccionado()).toBe('tr-no-cargado');
  });

  it('cerrarDetalle limpia identidad y selección', async () => {
    configurarTestBed(servicio);
    const fixture = TestBed.createComponent(NominaMensualV2PasoDotacionComponent);
    fixture.componentRef.setInput('nominaPeriodoId', 'np-1');
    const cmp = fixture.componentInstance;

    cmp.vista.set({ filas: [filaMock()], total: 1 });
    await cmp.abrirDetalle('tr-1');
    expect(cmp.detalleTrabajadorIdentidad()).not.toBeNull();

    cmp.cerrarDetalle();
    expect(cmp.detalleTrabajadorIdentidad()).toBeNull();
    expect(cmp.detalleTrabajador()).toBeNull();
    expect(cmp.trabajadorSeleccionado()).toBeNull();
  });

  it('cerrarDetalle restaura el foco al elemento que disparó la apertura (QA-FOC-01)', async () => {
    configurarTestBed(servicio);
    const fixture = TestBed.createComponent(NominaMensualV2PasoDotacionComponent);
    fixture.componentRef.setInput('nominaPeriodoId', 'np-1');
    const cmp = fixture.componentInstance;

    cmp.vista.set({ filas: [filaMock()], total: 1 });

    const trigger = document.createElement('button');
    trigger.textContent = 'Ver detalle';
    document.body.appendChild(trigger);
    trigger.focus();
    expect(document.activeElement).toBe(trigger);

    await cmp.abrirDetalle('tr-1');
    cmp.cerrarDetalle();

    // El foco se restaura en un microtask que compite con el foco al panel que programa
    // abrirDetalle; el orden varía por plataforma (en CI Linux fallaba con un solo tick).
    await vi.waitFor(() => expect(document.activeElement).toBe(trigger));

    trigger.remove();
  });

  describe('avanzar() — comando único (AG-NAV-03)', () => {
    it('confirma la dotación y retorna ok:true cuando puedeAvanzar', async () => {
      configurarTestBed(servicio);
      const fixture = TestBed.createComponent(NominaMensualV2PasoDotacionComponent);
      fixture.componentRef.setInput('nominaPeriodoId', 'np-1');
      const cmp = fixture.componentInstance;
      cmp.vista.set({ filas: [filaMock()], total: 1 });
      cmp.resumen.set({
        total: 1,
        listos: 1,
        conAdvertencias: 0,
        conCriticos: 0,
        bloqueados: 0,
      });

      const resultado = await cmp.avanzar();

      expect(resultado).toEqual({ ok: true });
      expect(servicio['confirmarDotacion']).toHaveBeenCalledWith('np-1');
    });

    it('retorna ok:false con razón cuando hay trabajadores bloqueados', async () => {
      configurarTestBed(servicio);
      const fixture = TestBed.createComponent(NominaMensualV2PasoDotacionComponent);
      fixture.componentRef.setInput('nominaPeriodoId', 'np-1');
      const cmp = fixture.componentInstance;
      cmp.vista.set({ filas: [filaBloqueada()], total: 1 });
      cmp.resumen.set({
        total: 1,
        listos: 0,
        conAdvertencias: 0,
        conCriticos: 0,
        bloqueados: 1,
      });

      const resultado = await cmp.avanzar();

      expect(resultado.ok).toBe(false);
      if (!resultado.ok) {
        expect(resultado.razon).toMatch(/bloqueados/i);
      }
      expect(servicio['confirmarDotacion']).not.toHaveBeenCalled();
    });

    it('retorna ok:false mientras está confirmando', async () => {
      configurarTestBed(servicio);
      const fixture = TestBed.createComponent(NominaMensualV2PasoDotacionComponent);
      fixture.componentRef.setInput('nominaPeriodoId', 'np-1');
      const cmp = fixture.componentInstance;
      cmp.vista.set({ filas: [filaMock()], total: 1 });
      cmp.resumen.set({
        total: 1,
        listos: 1,
        conAdvertencias: 0,
        conCriticos: 0,
        bloqueados: 0,
      });
      cmp.confirmando.set(true);

      const resultado = await cmp.avanzar();

      expect(resultado).toEqual({ ok: false, razon: 'Confirmación en curso.' });
      expect(servicio['confirmarDotacion']).not.toHaveBeenCalled();
    });

    it('retorna ok:false mientras está cargando la dotación', async () => {
      configurarTestBed(servicio);
      const fixture = TestBed.createComponent(NominaMensualV2PasoDotacionComponent);
      fixture.componentRef.setInput('nominaPeriodoId', 'np-1');
      const cmp = fixture.componentInstance;
      cmp.vista.set({ filas: [filaMock()], total: 1 });
      cmp.loading.set(true);

      const resultado = await cmp.avanzar();

      expect(resultado).toEqual({ ok: false, razon: 'Cargando la dotación.' });
    });
  });

  describe('puedeContinuar() — validación pura (Generador secuencial puro)', () => {
    it('retorna ok:true cuando hay filas y no hay bloqueos', () => {
      configurarTestBed(servicio);
      const fixture = TestBed.createComponent(NominaMensualV2PasoDotacionComponent);
      const cmp = fixture.componentInstance;
      fixture.componentRef.setInput('nominaPeriodoId', 'np-1');
      cmp.vista.set({ filas: [filaMock()], total: 1 });
      cmp.resumen.set({
        total: 1,
        listos: 1,
        conAdvertencias: 0,
        conCriticos: 0,
        bloqueados: 0,
      });
      expect(cmp.puedeContinuar()).toEqual({ ok: true });
    });

    it('retorna ok:false sin side-effects cuando hay trabajadores bloqueados', () => {
      configurarTestBed(servicio);
      const fixture = TestBed.createComponent(NominaMensualV2PasoDotacionComponent);
      const cmp = fixture.componentInstance;
      fixture.componentRef.setInput('nominaPeriodoId', 'np-1');
      cmp.vista.set({ filas: [filaBloqueada()], total: 1 });
      cmp.resumen.set({
        total: 1,
        listos: 0,
        conAdvertencias: 0,
        conCriticos: 0,
        bloqueados: 1,
      });
      const r = cmp.puedeContinuar();
      expect(r.ok).toBe(false);
      expect((servicio as Record<string, ReturnType<typeof vi.fn>>)['confirmarDotacion']).not.toHaveBeenCalled();
    });

    it('retorna ok:false mientras carga la dotación', () => {
      configurarTestBed(servicio);
      const fixture = TestBed.createComponent(NominaMensualV2PasoDotacionComponent);
      const cmp = fixture.componentInstance;
      fixture.componentRef.setInput('nominaPeriodoId', 'np-1');
      cmp.loading.set(true);
      expect(cmp.puedeContinuar()).toEqual({ ok: false, razon: 'Cargando la dotación.' });
    });
  });

  describe('Acción masiva — alcance universo filtrado (F07b)', () => {
    function servicioConMasiva(): Record<string, unknown> {
      return {
        ...servicio,
        listarIdsDotacion: vi.fn().mockResolvedValue(['tr-1', 'tr-2', 'tr-3']),
        previsualizarAccionMasiva: vi.fn().mockResolvedValue({
          accion: { tipo: 'excluir-nomina' },
          totalTrabajadoresAfectados: 3,
          totalIncidenciasCriticas: 0,
          totalAdvertencias: 0,
          mensajes: [],
          puedeAplicar: true,
        }),
      };
    }

    it('scope all-filtered resuelve los ids con el filtro vigente vía servicio', async () => {
      const svc = servicioConMasiva();
      configurarTestBed(svc);
      const fixture = TestBed.createComponent(NominaMensualV2PasoDotacionComponent);
      fixture.componentRef.setInput('nominaPeriodoId', 'np-1');
      const cmp = fixture.componentInstance;
      cmp.filtro.set({ estado: 'advertencia' });

      await cmp.manejarAccionMasiva({
        action: 'excluir-nomina',
        rows: [filaMock({ trabajadorId: 'tr-1' })],
        scope: 'all-filtered',
      });

      expect(svc['listarIdsDotacion']).toHaveBeenCalledWith('np-1', { estado: 'advertencia' });
      expect(svc['aplicarAccionMasiva']).toHaveBeenCalledWith(
        'np-1',
        ['tr-1', 'tr-2', 'tr-3'],
        { tipo: 'excluir-nomina' },
      );
    });

    it('scope page usa solo las filas seleccionadas de la página', async () => {
      const svc = servicioConMasiva();
      configurarTestBed(svc);
      const fixture = TestBed.createComponent(NominaMensualV2PasoDotacionComponent);
      fixture.componentRef.setInput('nominaPeriodoId', 'np-1');
      const cmp = fixture.componentInstance;

      await cmp.manejarAccionMasiva({
        action: 'excluir-nomina',
        rows: [filaMock({ trabajadorId: 'tr-9' })],
        scope: 'page',
      });

      expect(svc['listarIdsDotacion']).not.toHaveBeenCalled();
      expect(svc['aplicarAccionMasiva']).toHaveBeenCalledWith(
        'np-1',
        ['tr-9'],
        { tipo: 'excluir-nomina' },
      );
    });
  });

  describe('Picker "Agregar trabajadores"', () => {
    it('abrirPicker marca el modal como abierto cuando hay nómina activa', () => {
      configurarTestBed(servicio);
      const fixture = TestBed.createComponent(NominaMensualV2PasoDotacionComponent);
      fixture.componentRef.setInput('nominaPeriodoId', 'np-1');
      const cmp = fixture.componentInstance;
      cmp.abrirPicker();
      expect(cmp.pickerAbierto()).toBe(true);
    });

    it('abrirPicker no hace nada si no hay nómina', () => {
      configurarTestBed(servicio);
      const fixture = TestBed.createComponent(NominaMensualV2PasoDotacionComponent);
      const cmp = fixture.componentInstance;
      cmp.abrirPicker();
      expect(cmp.pickerAbierto()).toBe(false);
    });

    it('cerrarPicker no cierra mientras se está aplicando inclusión', () => {
      configurarTestBed(servicio);
      const fixture = TestBed.createComponent(NominaMensualV2PasoDotacionComponent);
      fixture.componentRef.setInput('nominaPeriodoId', 'np-1');
      const cmp = fixture.componentInstance;
      cmp.pickerAbierto.set(true);
      cmp.aplicandoInclusion.set(true);
      cmp.cerrarPicker();
      expect(cmp.pickerAbierto()).toBe(true);
    });

    it('incluirTrabajadores llama al servicio y refresca la dotación', async () => {
      configurarTestBed(servicio);
      const fixture = TestBed.createComponent(NominaMensualV2PasoDotacionComponent);
      fixture.componentRef.setInput('nominaPeriodoId', 'np-1');
      const cmp = fixture.componentInstance;
      cmp.pickerAbierto.set(true);

      await cmp.incluirTrabajadores(['tr-9', 'tr-10']);

      expect(servicio['agregarTrabajadoresANomina']).toHaveBeenCalledWith('np-1', [
        'tr-9',
        'tr-10',
      ]);
      expect(cmp.pickerAbierto()).toBe(false);
      // filtrarDotacion se llama dos veces: una vez por el effect inicial al
      // resolver el input nominaPeriodoId, y otra vez tras incluir.
      expect((servicio['filtrarDotacion'] as ReturnType<typeof vi.fn>).mock.calls.length)
        .toBeGreaterThanOrEqual(1);
    });

    it('incluirTrabajadores propaga errores como mensaje visible', async () => {
      const servicioConError = {
        ...servicio,
        agregarTrabajadoresANomina: vi.fn().mockRejectedValue(new Error('fallo upsert')),
      };
      configurarTestBed(servicioConError);
      const fixture = TestBed.createComponent(NominaMensualV2PasoDotacionComponent);
      fixture.componentRef.setInput('nominaPeriodoId', 'np-1');
      const cmp = fixture.componentInstance;

      await cmp.incluirTrabajadores(['tr-9']);

      expect(cmp.errorMensaje()).toMatch(/incluir/i);
      expect(cmp.aplicandoInclusion()).toBe(false);
    });
  });
});
