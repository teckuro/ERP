import { importProvidersFrom } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { ArrowLeft, FileCheck2, RefreshCw } from 'lucide-angular/src/icons';
import { vi } from 'vitest';

import { LiquidacionesOficialesService } from '../../services/liquidaciones-oficiales.service';
import { LiquidacionesOficialesContainer } from './liquidaciones-oficiales-container';

describe('LiquidacionesOficialesContainer', () => {
  let fixture: ComponentFixture<LiquidacionesOficialesContainer>;
  let service: {
    consultarEstadoPeriodo: ReturnType<typeof vi.fn>;
    generarLiquidaciones: ReturnType<typeof vi.fn>;
    obtenerDetalleTrabajador: ReturnType<typeof vi.fn>;
  };

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
        { provide: LiquidacionesOficialesService, useValue: service },
      ],
    }).compileComponents();

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
    expect(text).toContain('Periodo activo:');
    expect(text).toContain('Cambialo desde el selector superior.');
  });

  it('no duplica el CTA principal de generar en la botonera superior', () => {
    const actionBar = fixture.nativeElement.querySelector('.liq-actions') as HTMLElement | null;
    expect(actionBar?.textContent ?? '').not.toContain('Generar liquidaciones oficiales');
  });

  it('abre confirmacion visible antes de generar', () => {
    fixture.componentInstance.generarLiquidaciones();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Generar liquidaciones');
    expect(fixture.nativeElement.textContent).toContain('No se recalcularan montos.');
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
});
