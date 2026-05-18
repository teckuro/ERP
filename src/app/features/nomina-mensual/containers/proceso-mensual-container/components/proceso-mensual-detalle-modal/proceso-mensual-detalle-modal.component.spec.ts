import { importProvidersFrom } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import {
  AlertCircle,
  Calculator,
  Check,
  CheckCircle,
  ChevronRight,
  Home,
  FileSpreadsheet,
  FileText,
  Info,
  Lock,
  Upload,
} from 'lucide-angular/src/icons';
import { vi } from 'vitest';

import { PeriodoActivoService } from '../../../../../../core/services/periodo-activo.service';
import { DETALLE_REVISION_MODAL_TITULO } from '../../../../rules/proceso-mensual-detalle-modal.rules';
import { ProcesoMensualService } from '../../../../services/proceso-mensual.service';
import { ProcesoMensualContainer } from '../../proceso-mensual-container';
import {
  expectTexto,
  expectTextoNo,
  montarContainer,
  textoIncluye,
} from '../../proceso-mensual-container.spec.helpers';

const rehidratarPeriodo = vi.fn().mockResolvedValue(null);

describe('ProcesoMensualDetalleModalComponent', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    rehidratarPeriodo.mockResolvedValue(null);

    await TestBed.configureTestingModule({
      imports: [ProcesoMensualContainer],
      providers: [
        provideRouter([]),
        PeriodoActivoService,
        {
          provide: ProcesoMensualService,
          useValue: {
            ejecutarPrevalidaciones: vi.fn(),
            generarPreNominaPeriodo: vi.fn(),
            generarCalculoPeriodo: vi.fn(),
            guardarSnapshotPreliminar: vi.fn(),
            reemplazarSnapshotPreliminar: vi.fn(),
            aprobarResultadoPreliminarOperativamente: vi.fn(),
            cerrarNominaOperativamente: vi.fn(),
            obtenerResultadoCalculoPeriodo: vi.fn().mockReturnValue(null),
            obtenerSnapshotActivo: vi.fn().mockResolvedValue(null),
            obtenerSnapshotCompletoActivo: vi.fn().mockResolvedValue(null),
            obtenerSnapshotCompletoPorId: vi.fn().mockResolvedValue(null),
            rehidratarPeriodo,
          },
        },
        importProvidersFrom(
          LucideAngularModule.pick({
            AlertCircle,
            Calculator,
            Check,
            CheckCircle,
            ChevronRight,
            Home,
            FileSpreadsheet,
            FileText,
            Info,
            Lock,
            Upload,
          }),
        ),
      ],
    }).compileComponents();
  });

  function textoModal(fixture: Awaited<ReturnType<typeof montarContainer>>): string {
    return fixture.nativeElement.querySelector('app-proceso-mensual-detalle-modal')?.textContent ?? '';
  }

  it('muestra titulo de revision y lead operativo', async () => {
    const fixture = await montarContainer();
    fixture.componentInstance.abrirOverlayRevision('resumen');
    fixture.detectChanges();

    const dialog = fixture.nativeElement.querySelector('.payroll-operational-detail-overlay');
    expect(dialog).toBeTruthy();
    expectTexto(textoModal(fixture), DETALLE_REVISION_MODAL_TITULO);
    expectTexto(textoModal(fixture), 'Revise trabajadores');
  });

  it('footer no repite CTA global del workspace', async () => {
    const fixture = await montarContainer();
    const ctaFocus = fixture.nativeElement.querySelector('.payroll-focus__primary')?.textContent ?? '';
    fixture.componentInstance.abrirOverlayRevision('resumen');
    fixture.detectChanges();

    const footer = fixture.nativeElement.querySelector('.payroll-operational-detail-modal__footer');
    const footerText = footer?.textContent ?? '';
    if (ctaFocus.trim()) {
      expect(textoIncluye(footerText, ctaFocus.trim())).toBe(false);
    }
    expectTexto(footerText, 'Cerrar');
    expectTexto(footerText, 'Ver trabajadores');
  });

  it('accion contextual en tab trabajadores vuelve a consola', async () => {
    const fixture = await montarContainer();
    fixture.componentInstance.abrirOverlayRevision('trabajadores');
    fixture.detectChanges();
    expectTexto(textoModal(fixture), 'Volver a la consola');
  });

  it('no expone disclosure tecnico ni versionCalculo', async () => {
    const fixture = await montarContainer();
    fixture.componentInstance.abrirOverlayRevision('resumen');
    fixture.detectChanges();
    const text = textoModal(fixture).toLowerCase();
    expectTextoNo(text, 'Informacion interna');
    expect(text).not.toContain('versioncalculo');
    expect(fixture.nativeElement.querySelector('.payroll-operational-internal')).toBeNull();
  });
});
