import { importProvidersFrom } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { ArrowLeft, CheckCircle, DollarSign, FileCheck2, FileText, RefreshCw, Repeat, Send } from 'lucide-angular/src/icons';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { of } from 'rxjs';

import { PeriodoActivoService } from '../../../../core/services/periodo-activo.service';
import { LiquidacionesOficialesService } from '../../services/liquidaciones-oficiales.service';
import { NominaPeriodoService } from '../../../nomina-mensual/services/nomina-periodo.service';
import { crearNomina } from '../../../nomina-mensual/models/nomina-periodo.models';
import { LiquidacionesOficialesContainer } from './liquidaciones-oficiales-container';

describe('LiquidacionesOficialesContainer', () => {
  let fixture: ComponentFixture<LiquidacionesOficialesContainer>;
  let service: {
    consultarEstadoPeriodo: ReturnType<typeof vi.fn>;
    generarLiquidaciones: ReturnType<typeof vi.fn>;
    obtenerDetalleTrabajador: ReturnType<typeof vi.fn>;
  };
  let nominaService: {
    obtenerNomina: ReturnType<typeof vi.fn>;
    listarLiquidacionesNomina: ReturnType<typeof vi.fn>;
    generarLiquidacionesNomina: ReturnType<typeof vi.fn>;
  };

  async function configurar(queryParams: Record<string, string> = {}) {
    service = {
      consultarEstadoPeriodo: vi.fn(),
      generarLiquidaciones: vi.fn(),
      obtenerDetalleTrabajador: vi.fn().mockResolvedValue([]),
    };
    nominaService = {
      obtenerNomina: vi.fn().mockResolvedValue(null),
      listarLiquidacionesNomina: vi.fn().mockResolvedValue([]),
      generarLiquidacionesNomina: vi.fn().mockResolvedValue(undefined),
    };

    await TestBed.configureTestingModule({
      imports: [LiquidacionesOficialesContainer],
      providers: [
        provideRouter([]),
        importProvidersFrom(
          LucideAngularModule.pick({
            ArrowLeft,
            CheckCircle,
            DollarSign,
            FileCheck2,
            FileText,
            RefreshCw,
            Repeat,
            Send,
          }),
        ),
        PeriodoActivoService,
        { provide: LiquidacionesOficialesService, useValue: service },
        { provide: NominaPeriodoService, useValue: nominaService },
        {
          provide: ActivatedRoute,
          useValue: { queryParams: of(queryParams) },
        },
      ],
    }).compileComponents();

    const periodoActivo = TestBed.inject(PeriodoActivoService);
    periodoActivo.setPeriodoYm('2026-04');
    fixture = TestBed.createComponent(LiquidacionesOficialesContainer);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  it('sin nominaPeriodoId muestra acceso al administrador y no consulta por período', async () => {
    await configurar();
    expect(fixture.nativeElement.textContent).toContain('Ir al administrador de nóminas');
    expect(service.consultarEstadoPeriodo).not.toHaveBeenCalled();
  });

  it('con nominaPeriodoId carga liquidaciones internas de la nómina', async () => {
    nominaService.obtenerNomina.mockResolvedValue(
      crearNomina({ id: 'nom-99', empresaNombre: 'Acme', estado: 'aprobada', trabajadorIds: ['1'] }),
    );
    nominaService.listarLiquidacionesNomina.mockResolvedValue([
      {
        idLiquidacionPeriodo: 1,
        idNominaPeriodo: 'nom-99',
        periodo: '2026-04',
        version: 1,
        estado: 'generada',
        activo: true,
        idLiquidacionReemplazada: null,
        fechaGeneracion: '2026-04-01T00:00:00Z',
        totalTrabajadores: 2,
        totalHaberes: 100,
        totalDescuentos: 10,
        totalLiquido: 90,
      },
    ]);

    await configurar({ nominaPeriodoId: 'nom-99', periodo: '2026-04' });
    await fixture.whenStable();
    fixture.detectChanges();

    expect(nominaService.obtenerNomina).toHaveBeenCalledWith('nom-99');
    expect(nominaService.listarLiquidacionesNomina).toHaveBeenCalledWith('nom-99');
    expect(fixture.componentInstance.modoNominaInterna()).toBe(true);
    expect(fixture.nativeElement.textContent).toContain('Liquidaciones internas');
    expect(service.consultarEstadoPeriodo).not.toHaveBeenCalled();
  });
});
