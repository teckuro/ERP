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

const PERIODO_TEST = '2026-05';
const rehidratarPeriodo = vi.fn().mockResolvedValue(null);
const obtenerSnapshotActivo = vi.fn().mockResolvedValue(null);
const obtenerSnapshotCompletoActivo = vi.fn().mockResolvedValue(null);

function snapshotGuardado() {
  return {
    idCalculoPeriodo: 1,
    periodo: PERIODO_TEST,
    estado: 'preliminar_guardado',
    fechaGeneracion: '2026-05-05T10:00:00.000Z',
    usuarioGenerador: 'RRHH',
    versionMotor: 'v1',
    hashSnapshot: 'abc',
    totalTrabajadores: 1,
    totalBloqueados: 0,
    totalAdvertencias: 0,
    totalHaberes: 800000,
    totalDescuentos: 150000,
    totalLiquido: 650000,
    aprobacionOperativa: null,
    cierreOperativo: null,
  };
}

function snapshotCompletoGuardado() {
  const cabecera = snapshotGuardado();
  const trabajador = {
    idCalculoTrabajador: 10,
    idCalculoPeriodo: 1,
    idPersona: 1,
    rut: '11.111.111-1',
    nombreCompletoSnapshot: 'Ana Perez',
    estado: 'calculado_preliminar',
    sueldoBase: 800000,
    baseImponiblePrevisional: 800000,
    baseTributable: 800000,
    totalHaberesImponibles: 800000,
    totalHaberesNoImponibles: 0,
    totalDescuentosLegales: 150000,
    totalDescuentosVoluntarios: 0,
    impuestoUnico: 0,
    liquidoPreliminar: 650000,
    cotizacionAfp: 0,
    cotizacionSalud: 0,
    cotizacionAfc: 0,
    cotizacionSis: 0,
    cotizacionSanna: 0,
    cotizacionLey16744Empleador: 0,
    conceptos: [],
    issues: [],
    trazabilidad: [],
  };
  return {
    cabecera,
    trabajadores: [trabajador],
    conceptos: [],
    observaciones: [],
    trazabilidad: [],
    aprobacionOperativa: null,
    resumen: {
      totalConceptos: 0,
      totalObservaciones: 0,
      totalTrazas: 0,
      totalTrabajadoresSinDetalle: 0,
      esActivoVigente: true,
      fueReemplazado: false,
    },
  };
}

describe('ProcesoMensualDetalleModalComponent', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    rehidratarPeriodo.mockImplementation(async (periodo: string) => {
      const snapshot = await obtenerSnapshotActivo(periodo);
      if (!snapshot) return null;
      return { snapshot, completo: await obtenerSnapshotCompletoActivo(periodo) };
    });
    obtenerSnapshotActivo.mockResolvedValue(null);
    obtenerSnapshotCompletoActivo.mockResolvedValue(null);

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
            obtenerSnapshotActivo,
            obtenerSnapshotCompletoActivo,
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

  it('con snapshot completo muestra trabajador en tab trabajadores', async () => {
    obtenerSnapshotActivo.mockResolvedValue(snapshotGuardado());
    obtenerSnapshotCompletoActivo.mockResolvedValue(snapshotCompletoGuardado());
    const fixture = await montarContainer();
    await fixture.whenStable();
    fixture.detectChanges();

    fixture.componentInstance.abrirOverlayRevision('trabajadores');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expectTexto(textoModal(fixture), 'Ana Perez');
    expectTexto(textoModal(fixture), 'Version guardada para revision');
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
