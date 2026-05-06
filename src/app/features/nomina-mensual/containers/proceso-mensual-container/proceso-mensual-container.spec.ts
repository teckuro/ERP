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
  const generarPreNominaPeriodo = vi.fn();
  const generarCalculoPeriodo = vi.fn();
  const guardarSnapshotPreliminar = vi.fn();
  const reemplazarSnapshotPreliminar = vi.fn();
  const obtenerResultadoCalculoPeriodo = vi.fn();
  const obtenerSnapshotActivo = vi.fn();

  beforeEach(async () => {
    ejecutarPrevalidaciones.mockReset();
    generarPreNominaPeriodo.mockReset();
    generarCalculoPeriodo.mockReset();
    guardarSnapshotPreliminar.mockReset();
    reemplazarSnapshotPreliminar.mockReset();
    obtenerResultadoCalculoPeriodo.mockReset();
    obtenerSnapshotActivo.mockReset();
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
    generarPreNominaPeriodo.mockResolvedValue({
      periodo: '2026-05',
      estado: 'GENERADA_CON_ADVERTENCIAS',
      generadoEn: '2026-05-05T10:00:00.000Z',
      trabajadoresIncluidos: 2,
      recurrentesIncluidos: 1,
      movimientosVariablesValidados: 1,
      movimientosVariablesBorrador: 0,
      parametrosOperativos: true,
      codigosBloqueo: [],
      codigosAdvertencia: ['MV_BORRADOR'],
      origenPrevalidacion: 'CON_ADVERTENCIAS',
    });
    generarCalculoPeriodo.mockResolvedValue({
      periodo: '2026-05',
      estado: 'calculado_preliminar',
      generadoEn: '2026-05-05T10:00:00.000Z',
      resumen: {
        totalTrabajadoresCalculados: 1,
        totalBloqueados: 0,
        totalConAdvertencias: 0,
        totalHaberes: 800000,
        totalDescuentos: 150000,
        totalLiquidoPreliminar: 650000,
      },
      liquidaciones: [{
        periodo: '2026-05',
        idPersona: 1,
        rut: '11.111.111-1',
        nombreCompleto: 'Ana Perez',
        haberesImponibles: [],
        haberesNoImponibles: [],
        descuentosLegales: [],
        descuentosVoluntarios: [],
        baseImponiblePrevisional: 800000,
        baseTributable: 800000,
        gratificacionLegal: 0,
        asignacionFamiliar: 0,
        cotizacionAfp: 0,
        cotizacionSalud: 0,
        cotizacionAfc: 0,
        cotizacionSis: 0,
        cotizacionSanna: 0,
        cotizacionLey16744: 0,
        impuestoUnico: 0,
        totalHaberes: 800000,
        totalDescuentos: 150000,
        liquidoAPago: 650000,
        issues: [],
        trazabilidad: [],
        estado: 'calculado_preliminar',
      }],
      issues: [],
    });
    const snapshotMock = {
      idCalculoPeriodo: 1,
      periodo: '2026-05',
      idEmpresa: null,
      estado: 'preliminar',
      fechaGeneracion: '2026-05-05T10:00:00.000Z',
      usuarioGenerador: null,
      totalTrabajadores: 1,
      totalHaberes: 800000,
      totalDescuentos: 150000,
      totalLiquido: 650000,
      totalBloqueados: 0,
      totalAdvertencias: 0,
      versionMotor: 'MOTOR-03B',
      hashSnapshot: 'fnv1a32:12345678',
      origen: 'preliminar',
      activo: true,
      reemplazadoPor: null,
      trabajadores: [],
      issues: [],
      trazabilidad: [],
    };
    guardarSnapshotPreliminar.mockResolvedValue({
      ok: true,
      snapshot: snapshotMock,
      reemplazoSnapshotAnterior: false,
      hashSnapshot: snapshotMock.hashSnapshot,
      issues: [],
    });
    reemplazarSnapshotPreliminar.mockResolvedValue({
      ok: true,
      snapshot: { ...snapshotMock, estado: 'recalculado', origen: 'recalculo' },
      reemplazoSnapshotAnterior: true,
      hashSnapshot: snapshotMock.hashSnapshot,
      issues: [],
    });
    obtenerResultadoCalculoPeriodo.mockReturnValue(null);
    obtenerSnapshotActivo.mockResolvedValue(snapshotMock);

    await TestBed.configureTestingModule({
      imports: [ProcesoMensualContainer],
      providers: [
        provideRouter([]),
        PeriodoActivoService,
        {
          provide: ProcesoMensualService,
          useValue: {
            ejecutarPrevalidaciones,
            generarPreNominaPeriodo,
            generarCalculoPeriodo,
            guardarSnapshotPreliminar,
            reemplazarSnapshotPreliminar,
            obtenerResultadoCalculoPeriodo,
            obtenerSnapshotActivo,
          },
        },
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

  it('genera y muestra pre-nomina funcional posterior a una validacion sin bloqueos', async () => {
    ejecutarPrevalidaciones.mockResolvedValueOnce({
      periodo: '2026-05',
      estado: 'LISTO_PARA_CALCULO',
      resumen: {
        periodo: '2026-05',
        hayBloqueos: false,
        hayAdvertencias: false,
        conteoMovimientosPorEstado: { VALIDADO: 1 },
        trabajadoresActivosAptos: 2,
        trabajadoresActivosNoAptos: 0,
        parametrosOperativos: true,
        parametrosGrupos: [],
        recurrentesAplicablesAlPeriodo: 1,
        recurrentesInvalidas: 0,
        recurrentesCerradas: 0,
        recurrentesFueraDelMes: 0,
      },
      bloqueos: [],
      advertencias: [],
      informaciones: [],
      items: [],
    } as ProcesoMensualPrevalidacion);

    const buttons = [...fixture.nativeElement.querySelectorAll('button')] as HTMLButtonElement[];
    buttons.find((b) => (b.textContent ?? '').includes('Validar periodo'))!.click();
    await fixture.whenStable();
    fixture.detectChanges();

    const btnPreNomina = ([...fixture.nativeElement.querySelectorAll('button')] as HTMLButtonElement[]).find((b) =>
      (b.textContent ?? '').includes('Generar pre-nomina'),
    );
    expect(btnPreNomina).toBeTruthy();
    btnPreNomina!.click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(generarPreNominaPeriodo).toHaveBeenCalledWith('2026-05');
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Pre-nomina con advertencias');
    expect(text).toContain('Trabajadores incluidos');
  });

  it('calcula preliminar posterior a pre-nomina generada y muestra tabla resultado', async () => {
    ejecutarPrevalidaciones.mockResolvedValueOnce({
      periodo: '2026-05',
      estado: 'LISTO_PARA_CALCULO',
      resumen: {
        periodo: '2026-05',
        hayBloqueos: false,
        hayAdvertencias: false,
        conteoMovimientosPorEstado: { VALIDADO: 1 },
        trabajadoresActivosAptos: 1,
        trabajadoresActivosNoAptos: 0,
        parametrosOperativos: true,
        parametrosGrupos: [],
        recurrentesAplicablesAlPeriodo: 0,
        recurrentesInvalidas: 0,
        recurrentesCerradas: 0,
        recurrentesFueraDelMes: 0,
      },
      bloqueos: [],
      advertencias: [],
      informaciones: [],
      items: [],
    } as ProcesoMensualPrevalidacion);

    let buttons = [...fixture.nativeElement.querySelectorAll('button')] as HTMLButtonElement[];
    buttons.find((b) => (b.textContent ?? '').includes('Validar periodo'))!.click();
    await fixture.whenStable();
    fixture.detectChanges();

    buttons = [...fixture.nativeElement.querySelectorAll('button')] as HTMLButtonElement[];
    buttons.find((b) => (b.textContent ?? '').includes('Generar pre-nomina'))!.click();
    await fixture.whenStable();
    fixture.detectChanges();

    buttons = [...fixture.nativeElement.querySelectorAll('button')] as HTMLButtonElement[];
    buttons.find((b) => (b.textContent ?? '').includes('Calcular preliminar'))!.click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(generarCalculoPeriodo).toHaveBeenCalledWith('2026-05');
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Liquido preliminar');
    expect(text).toContain('Ana Perez');
  });

  it('guarda snapshot preliminar posterior a calculo sin bloqueos', async () => {
    ejecutarPrevalidaciones.mockResolvedValueOnce({
      periodo: '2026-05',
      estado: 'LISTO_PARA_CALCULO',
      resumen: {
        periodo: '2026-05',
        hayBloqueos: false,
        hayAdvertencias: false,
        conteoMovimientosPorEstado: { VALIDADO: 1 },
        trabajadoresActivosAptos: 1,
        trabajadoresActivosNoAptos: 0,
        parametrosOperativos: true,
        parametrosGrupos: [],
        recurrentesAplicablesAlPeriodo: 0,
        recurrentesInvalidas: 0,
        recurrentesCerradas: 0,
        recurrentesFueraDelMes: 0,
      },
      bloqueos: [],
      advertencias: [],
      informaciones: [],
      items: [],
    } as ProcesoMensualPrevalidacion);

    let buttons = [...fixture.nativeElement.querySelectorAll('button')] as HTMLButtonElement[];
    buttons.find((b) => (b.textContent ?? '').includes('Validar periodo'))!.click();
    await fixture.whenStable();
    fixture.detectChanges();
    buttons = [...fixture.nativeElement.querySelectorAll('button')] as HTMLButtonElement[];
    buttons.find((b) => (b.textContent ?? '').includes('Generar pre-nomina'))!.click();
    await fixture.whenStable();
    fixture.detectChanges();
    buttons = [...fixture.nativeElement.querySelectorAll('button')] as HTMLButtonElement[];
    buttons.find((b) => (b.textContent ?? '').includes('Calcular preliminar'))!.click();
    await fixture.whenStable();
    fixture.detectChanges();
    buttons = [...fixture.nativeElement.querySelectorAll('button')] as HTMLButtonElement[];
    buttons.find((b) => (b.textContent ?? '').includes('Guardar snapshot preliminar'))!.click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(guardarSnapshotPreliminar).toHaveBeenCalledWith('2026-05');
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Snapshot preliminar guardado');
    expect(text).toContain('MOTOR-03B');
  });
});
