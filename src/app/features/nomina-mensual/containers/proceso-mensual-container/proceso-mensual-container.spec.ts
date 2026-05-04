import { importProvidersFrom } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import {
  AlertCircle,
  Calculator,
  Check,
  CheckCircle,
  FileSpreadsheet,
  FileText,
  Info,
  Lock,
  Upload,
} from 'lucide-angular/src/icons';
import { vi } from 'vitest';

import { PeriodoActivoService } from '../../../../core/services/periodo-activo.service';
import type { ProcesoMensualPrevalidacion } from '../../models/proceso-mensual.model';
import { ProcesoMensualService } from '../../services/proceso-mensual.service';
import { ProcesoMensualContainer } from './proceso-mensual-container';

describe('ProcesoMensualContainer', () => {
  let fixture: ComponentFixture<ProcesoMensualContainer>;
  const ejecutarPrevalidaciones = vi.fn();

  beforeEach(async () => {
    ejecutarPrevalidaciones.mockResolvedValue({
      periodo: '2026-05',
      estado: 'BLOQUEADO',
      resumen: {
        periodo: '2026-05',
        hayBloqueos: true,
        hayAdvertencias: false,
        conteoMovimientosPorEstado: {},
        trabajadoresActivosAptos: 0,
        trabajadoresActivosNoAptos: 0,
        parametrosOperativos: false,
        parametrosGrupos: [{ id: 'mensuales_uf_utm_sueldo', clasificacion: 'OK' }],
        recurrentesAplicablesAlPeriodo: 2,
        recurrentesInvalidas: 0,
        recurrentesCerradas: 1,
        recurrentesFueraDelMes: 0,
      },
      bloqueos: [
        {
          codigo: 'PARAMETROS_SIN_FILA',
          area: 'PARAMETROS',
          severidad: 'BLOQUEO',
          texto: 'No se encontraron parametros reales validados para este periodo.',
        },
      ],
      advertencias: [],
      informaciones: [],
      items: [{ area: 'PARAMETROS', etiqueta: 'Parametros', estado: 'CON_PROBLEMAS' }],
    } as ProcesoMensualPrevalidacion);

    await TestBed.configureTestingModule({
      imports: [ProcesoMensualContainer],
      providers: [
        provideRouter([]),
        PeriodoActivoService,
        { provide: ProcesoMensualService, useValue: { ejecutarPrevalidaciones } },
        importProvidersFrom(
          LucideAngularModule.pick({
            AlertCircle,
            Calculator,
            Check,
            CheckCircle,
            FileSpreadsheet,
            FileText,
            Info,
            Lock,
            Upload,
          }),
        ),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProcesoMensualContainer);
    fixture.detectChanges();
  });

  it('crea la vista y muestra titulo proceso mensual', () => {
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Proceso mensual');
  });

  it('muestra selector de periodo (input month)', () => {
    const input = fixture.nativeElement.querySelector('input[type="month"]') as HTMLInputElement | null;
    expect(input).toBeTruthy();
  });

  it('al pulsar Validar periodo llama al servicio de prevalidacion', async () => {
    const buttons = [...fixture.nativeElement.querySelectorAll('button')] as HTMLButtonElement[];
    const btn = buttons.find((b) => (b.textContent ?? '').includes('Validar periodo'));
    expect(btn).toBeTruthy();
    btn!.click();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(ejecutarPrevalidaciones).toHaveBeenCalled();
  });

  it('tras validar muestra texto de bloqueos', async () => {
    const buttons = [...fixture.nativeElement.querySelectorAll('button')] as HTMLButtonElement[];
    buttons.find((b) => (b.textContent ?? '').includes('Validar periodo'))!.click();
    await fixture.whenStable();
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('No se encontraron parametros reales validados para este periodo.');
  });

  it('no muestra valores normativos tipo UF demo en el copy base', () => {
    const text = fixture.nativeElement.textContent as string;
    expect(text).not.toMatch(/UF\s*[:=]\s*[0-9]/i);
  });

  it('tras validar muestra resumen de recurrentes y grupos de parametros', async () => {
    const buttons = [...fixture.nativeElement.querySelectorAll('button')] as HTMLButtonElement[];
    buttons.find((b) => (b.textContent ?? '').includes('Validar periodo'))!.click();
    await fixture.whenStable();
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Recurrentes aplicables al mes:');
    expect(text).toContain('Parametros (grupos):');
  });
});
