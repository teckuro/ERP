import { importProvidersFrom } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { ArrowLeft, FileCheck2, RefreshCw } from 'lucide-angular/src/icons';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { PeriodoActivoService } from '../../../../core/services/periodo-activo.service';
import { LiquidacionesOficialesService } from '../../services/liquidaciones-oficiales.service';
import { LiquidacionesOficialesContainer } from './liquidaciones-oficiales-container';

describe('LiquidacionesOficialesContainer', () => {
  let fixture: ComponentFixture<LiquidacionesOficialesContainer>;
  let service: {
    consultarEstadoPeriodo: ReturnType<typeof vi.fn>;
    generarLiquidaciones: ReturnType<typeof vi.fn>;
    obtenerDetalleTrabajador: ReturnType<typeof vi.fn>;
  };
  let periodoActivo: PeriodoActivoService;

  beforeEach(async () => {
    service = {
      consultarEstadoPeriodo: vi.fn().mockResolvedValue({
      estado: 'lista_para_generar',
      periodo: '2026-04',
      snapshot: {
        idCalculoPeriodo: 15,
        totalTrabajadores: 1,
        totalHaberes: 100,
        totalDescuentos: 20,
        totalLiquido: 80,
        totalAdvertencias: 0,
        versionMotor: 'v1',
        hashSnapshot: 'abc',
        aprobadoOperativamente: true,
        cerradoOperativamente: true,
      },
      liquidacion: null,
      trabajadores: [],
      motivoNoPuedeGenerar: null,
      advertencias: [],
      }),
      generarLiquidaciones: vi.fn(),
      obtenerDetalleTrabajador: vi.fn().mockResolvedValue([]),
    };

    await TestBed.configureTestingModule({
      imports: [LiquidacionesOficialesContainer],
      providers: [
        provideRouter([]),
        importProvidersFrom(LucideAngularModule.pick({ ArrowLeft, FileCheck2, RefreshCw })),
        PeriodoActivoService,
        { provide: LiquidacionesOficialesService, useValue: service },
      ],
    }).compileComponents();

    periodoActivo = TestBed.inject(PeriodoActivoService);
    periodoActivo.setPeriodoYm('2026-04');
    fixture = TestBed.createComponent(LiquidacionesOficialesContainer);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  });

  it('muestra boton generar cuando corresponde', () => {
    expect(fixture.nativeElement.textContent).toContain('Generar liquidaciones oficiales');
    expect(fixture.componentInstance.puedeGenerar()).toBe(true);
  });

  it('consume el periodo global como contexto y no muestra selector local', () => {
    const input = fixture.nativeElement.querySelector('input[type="month"]') as HTMLInputElement | null;
    const text = fixture.nativeElement.textContent as string;
    expect(input).toBeNull();
    expect(text).toContain('Período activo:');
    expect(text).toContain('Información interna y alcance');
  });

  it('no duplica el CTA principal de generar en la botonera superior', () => {
    const actionBar = fixture.nativeElement.querySelector('.liq-actions') as HTMLElement | null;
    expect(actionBar?.textContent ?? '').not.toContain('Generar liquidaciones oficiales');
  });

  it('abre confirmacion visible antes de generar', () => {
    fixture.componentInstance.generarLiquidaciones();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Generar liquidaciones');
    expect(fixture.nativeElement.textContent).toContain('No se recalcularán montos en este paso.');
    expect(service.generarLiquidaciones).not.toHaveBeenCalled();
  });

  it('genera despues de confirmar en modal', async () => {
    service.generarLiquidaciones.mockResolvedValue({
      estado: 'generadas',
      periodo: '2026-04',
      snapshot: {
        idCalculoPeriodo: 15,
        totalTrabajadores: 1,
        totalHaberes: 100,
        totalDescuentos: 20,
        totalLiquido: 80,
        totalAdvertencias: 0,
        versionMotor: 'v1',
        hashSnapshot: 'abc',
        aprobadoOperativamente: true,
        cerradoOperativamente: true,
      },
      liquidacion: {
        idLiquidacionPeriodo: 1,
        periodo: '2026-04',
        estado: 'generada',
        totalTrabajadores: 0,
        totalHaberes: 0,
        totalDescuentos: 0,
        totalLiquido: 0,
        fechaGeneracion: '2026-04-30T12:00:00.000Z',
      },
      trabajadores: [],
      motivoNoPuedeGenerar: 'Las liquidaciones oficiales ya fueron generadas para este periodo.',
      advertencias: [],
    });

    fixture.componentInstance.generarLiquidaciones();
    fixture.componentInstance.confirmarGeneracionLiquidaciones();
    await fixture.whenStable();

    expect(service.generarLiquidaciones).toHaveBeenCalledWith('2026-04');
  });

  it('al cambiar periodo global consulta nuevo periodo y limpia detalle', async () => {
    fixture.componentInstance.trabajadorSeleccionado.set({
      idLiquidacionTrabajador: 99,
      idPersona: 10,
      idContrato: null,
      rut: '11.111.111-1',
      nombreTrabajador: 'Ana Perez',
      cargo: null,
      centroCosto: null,
      fechaIngreso: null,
      diasTrabajados: null,
      baseImponible: 100,
      baseTributable: 100,
      totalHaberes: 100,
      totalDescuentos: 20,
      totalAportesEmpleadorReferencia: 0,
      liquidoPagar: 80,
      estado: 'generada',
      observaciones: [],
      metadata: {},
    });
    fixture.componentInstance.conceptosDetalle.set([
      {
        idLiquidacionConcepto: 1,
        idLiquidacionTrabajador: 99,
        idConcepto: 20,
        codigo: 'BONO',
        codigoLre: null,
        nombre: 'Bono',
        tipo: 'HABER',
        clasificacion: null,
        cantidad: null,
        base: null,
        tasa: null,
        monto: 100,
        orden: 1,
        metadata: {},
      },
    ]);

    periodoActivo.setPeriodoYm('2026-06');
    await fixture.whenStable();

    expect(service.consultarEstadoPeriodo).toHaveBeenCalledWith('2026-06');
    expect(fixture.componentInstance.trabajadorSeleccionado()).toBeNull();
    expect(fixture.componentInstance.conceptosDetalle()).toEqual([]);
  });
});
