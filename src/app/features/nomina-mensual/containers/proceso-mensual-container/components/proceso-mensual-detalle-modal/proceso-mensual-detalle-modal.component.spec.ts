import { importProvidersFrom } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import {
  AlertCircle,
  ArrowDownUp,
  ArrowLeftRight,
  BadgeDollarSign,
  Calculator,
  Calendar,
  CalendarCheck,
  Check,
  CheckCircle,
  ChevronRight,
  Circle,
  CircleAlert,
  CircleDot,
  Minus,
  FileCheck,
  FileCheck2,
  FileClock,
  FileSpreadsheet,
  FileText,
  History,
  Home,
  Info,
  ListChecks,
  Lock,
  Receipt,
  Repeat,
  RefreshCw,
  ShieldCheck,
  Sliders,
  SlidersHorizontal,
  Upload,
  UserCheck,
  Users,
  UserX,
  X,
} from 'lucide-angular/src/icons';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { PeriodoActivoService } from '../../../../../../core/services/periodo-activo.service';
import { DETALLE_REVISION_MODAL_TITULO } from '../../../../rules/proceso-mensual-detalle-modal.rules';
import { ProcesoMensualService } from '../../../../services/proceso-mensual.service';
import { ProcesoMensualContainer } from '../../proceso-mensual-container';
import {
  expectTexto,
  expectTextoNo,
  montarContainer,
  provideNominaMensualCapabilitiesMock,
  storeDe,
  textoIncluye,
} from '../../proceso-mensual-container.spec.helpers';

const PERIODO_TEST = '2026-05';
const rehidratarPeriodo = vi.fn().mockResolvedValue(null);
const obtenerSnapshotActivo = vi.fn().mockResolvedValue(null);
const obtenerSnapshotCompletoActivo = vi.fn().mockResolvedValue(null);
const ejecutarPrevalidaciones = vi.fn().mockResolvedValue(null);

function prevalidacionConBloqueoParametros(codigo: string, texto: string) {
  return {
    periodo: PERIODO_TEST,
    estado: 'BLOQUEADO',
    resumen: {
      periodo: PERIODO_TEST,
      hayBloqueos: true,
      hayAdvertencias: false,
      conteoMovimientosPorEstado: {},
      trabajadoresActivosAptos: 0,
      trabajadoresActivosNoAptos: 0,
      parametrosOperativos: false,
      parametrosGrupos: [{ id: 'mensuales_uf_utm_sueldo', clasificacion: 'FALTANTE' }],
      recurrentesAplicablesAlPeriodo: 0,
      recurrentesInvalidas: 0,
      recurrentesCerradas: 0,
      recurrentesFueraDelMes: 0,
    },
    bloqueos: [{
      codigo,
      area: 'PARAMETROS',
      severidad: 'BLOQUEO',
      texto,
    }],
    advertencias: [],
    informaciones: [],
    items: [],
  };
}

async function esperarPrevalidacion(fixture: Awaited<ReturnType<typeof montarContainer>>): Promise<void> {
  await vi.waitFor(() => expect(storeDe(fixture).validando()).toBe(false), {
    timeout: 3000,
    interval: 20,
  });
  await fixture.whenStable();
  fixture.detectChanges();
}

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

function snapshotCompletoConTrabajadores(total: number) {
  const base = snapshotCompletoGuardado();
  return {
    ...base,
    cabecera: { ...base.cabecera, totalTrabajadores: total },
    trabajadores: Array.from({ length: total }, (_item, index) => {
      const id = index + 1;
      const estado = index === 1 ? 'con_advertencias' : index === 2 ? 'con_bloqueos' : 'calculado_preliminar';
      return {
        ...base.trabajadores[0],
        idCalculoTrabajador: 10 + id,
        idPersona: id,
        rut: `${id}${id}.${id}${id}${id}.${id}${id}${id}-${id}`,
        nombreCompletoSnapshot: `Trabajador Masivo ${id}`,
        estado,
        totalHaberesImponibles: 700000 + id,
        totalHaberesNoImponibles: 0,
        totalDescuentosLegales: 100000 + id,
        totalDescuentosVoluntarios: 0,
        liquidoPreliminar: 600000 + id,
        issues: estado === 'con_advertencias'
          ? [{
              codigo: 'TRAB-OBS',
              severidad: 'ADVERTENCIA',
              mensaje: 'Revisar antecedente del trabajador',
              origen: 'trabajador',
              entidadId: id,
              campo: null,
            }]
          : estado === 'con_bloqueos'
            ? [{
                codigo: 'TRAB-BLOQ',
                severidad: 'BLOQUEO',
                mensaje: 'Ficha bloqueada',
                origen: 'trabajador',
                entidadId: id,
                campo: null,
              }]
            : [],
      };
    }),
  };
}

describe('ProcesoMensualDetalleModalComponent', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    rehidratarPeriodo.mockImplementation(async (periodo: string) => {
      const snapshot = await obtenerSnapshotActivo(periodo);
      if (!snapshot) {
        return { snapshot: null, completo: null, liquidacionesGeneradas: 0, prevalidacionDiagnostico: null };
      }
      return {
        snapshot,
        completo: await obtenerSnapshotCompletoActivo(periodo),
        liquidacionesGeneradas: 0,
        prevalidacionDiagnostico: null,
      };
    });
    obtenerSnapshotActivo.mockResolvedValue(null);
    obtenerSnapshotCompletoActivo.mockResolvedValue(null);
    ejecutarPrevalidaciones.mockResolvedValue(null);

    await TestBed.configureTestingModule({
      imports: [ProcesoMensualContainer],
      providers: [
        provideRouter([]),
        PeriodoActivoService,
        provideNominaMensualCapabilitiesMock(),
        {
          provide: ProcesoMensualService,
          useValue: {
            ejecutarPrevalidaciones,
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
            ArrowDownUp,
            ArrowLeftRight,
            BadgeDollarSign,
            Calculator,
            Calendar,
            CalendarCheck,
            Check,
            CheckCircle,
            ChevronRight,
            Circle,
            CircleAlert,
            CircleDot,
            Minus,
            FileCheck,
            FileCheck2,
            FileClock,
            FileSpreadsheet,
            FileText,
            History,
            Home,
            Info,
            ListChecks,
            Lock,
            Receipt,
            Repeat,
            RefreshCw,
            ShieldCheck,
            Sliders,
            SlidersHorizontal,
            Upload,
            UserCheck,
            Users,
            UserX,
            X,
          }),
        ),
      ],
    }).compileComponents();
  });

  function textoModal(fixture: Awaited<ReturnType<typeof montarContainer>>): string {
    return fixture.nativeElement.querySelector('app-proceso-mensual-detalle-modal')?.textContent ?? '';
  }

  function textoBodyModal(fixture: Awaited<ReturnType<typeof montarContainer>>): string {
    return fixture.nativeElement.querySelector('.payroll-operational-detail-modal__body')?.textContent ?? '';
  }

  it('muestra titulo de revision y lead operativo', async () => {
    const fixture = await montarContainer();
    fixture.componentInstance.abrirOverlayRevision('resumen');
    fixture.detectChanges();

    const dialog = fixture.nativeElement.querySelector('.payroll-operational-detail-overlay');
    expect(dialog).toBeTruthy();
    expectTexto(textoModal(fixture), DETALLE_REVISION_MODAL_TITULO);
    expectTexto(textoModal(fixture), 'Revise la');
  });

  it('muestra preview de que falta ahora en resumen antes de generar base', async () => {
    ejecutarPrevalidaciones.mockResolvedValue(prevalidacionConBloqueoParametros('PARAM_UF', 'Falta valor UF del período'));
    const fixture = await montarContainer();
    fixture.componentInstance.validarPeriodo();
    await esperarPrevalidacion(fixture);

    fixture.componentInstance.abrirOverlayRevision('resumen');
    fixture.detectChanges();

    const modal = fixture.nativeElement.querySelector('app-proceso-mensual-detalle-modal') as HTMLElement | null;
    const preview = modal?.querySelector('app-proceso-mensual-revision-periodo-preview') as HTMLElement | null;
    expect(preview).toBeTruthy();
    expectTexto(preview?.textContent ?? '', 'Qué falta ahora');
    expectTexto(preview?.textContent ?? '', 'Revisión del período antes de generar');
    expectTexto(preview?.textContent ?? '', 'Críticos');
    expectTexto(preview?.textContent ?? '', 'Parámetros');
    expectTexto(preview?.textContent ?? '', 'Pendientes');
  });

  it('accion principal del preview ejecuta la verificacion del periodo', async () => {
    const fixture = await montarContainer();
    fixture.componentInstance.abrirOverlayRevision('resumen');
    fixture.detectChanges();

    const preview = fixture.nativeElement.querySelector('app-proceso-mensual-revision-periodo-preview') as HTMLElement | null;
    const accion = preview?.querySelector('.payroll-revision-preview__accion--primary') as HTMLButtonElement | null;
    expect(accion).toBeTruthy();
    accion?.click();
    fixture.detectChanges();
    await esperarPrevalidacion(fixture);

    expect(ejecutarPrevalidaciones).toHaveBeenCalledWith(PERIODO_TEST);
  });

  it('no muestra preview en modal cuando ya existe base generada', async () => {
    obtenerSnapshotActivo.mockResolvedValue(snapshotGuardado());
    obtenerSnapshotCompletoActivo.mockResolvedValue(snapshotCompletoGuardado());
    const fixture = await montarContainer();
    await fixture.whenStable();

    fixture.componentInstance.abrirOverlayRevision('resumen');
    fixture.detectChanges();

    const modal = fixture.nativeElement.querySelector('app-proceso-mensual-detalle-modal') as HTMLElement | null;
    expect(modal?.querySelector('app-proceso-mensual-revision-periodo-preview')).toBeNull();
    expectTextoNo(textoModal(fixture), 'Qué falta ahora');
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
    expect(fixture.nativeElement.querySelector('.payroll-modal-close')).toBeTruthy();
    expect(textoIncluye(footerText, 'Cerrar')).toBe(false);
    expectTexto(footerText, 'Ver trabajadores');
  });

  it('accion contextual en tab trabajadores lleva al panel del periodo', async () => {
    const fixture = await montarContainer();
    fixture.componentInstance.abrirOverlayRevision('trabajadores');
    fixture.detectChanges();
    expectTexto(textoModal(fixture), 'Ir al detalle del período');
    expectTexto(textoModal(fixture), 'La corrección por trabajador se hace en el panel del período');
  });

  it('con snapshot completo muestra resumen agregado sin grilla masiva en tab trabajadores', async () => {
    obtenerSnapshotActivo.mockResolvedValue(snapshotGuardado());
    obtenerSnapshotCompletoActivo.mockResolvedValue(snapshotCompletoGuardado());
    const fixture = await montarContainer();
    await fixture.whenStable();
    fixture.detectChanges();

    fixture.componentInstance.abrirOverlayRevision('trabajadores');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const body = fixture.nativeElement.querySelector('.payroll-operational-detail-modal__body');
    expectTexto(body?.textContent ?? '', 'Total');
    expectTexto(body?.textContent ?? '', 'Ir al detalle del período');
    expectTextoNo(body?.textContent ?? '', 'Listado de trabajadores');
    expect(body?.querySelector('.payroll-mass-review__resumen')).toBeTruthy();
    expect(body?.querySelector('input[placeholder="Buscar por nombre o RUT"]')).toBeNull();
    expect(fixture.nativeElement.querySelector('.payroll-expediente-franja')).toBeNull();
  });

  it('con mas de 5 trabajadores muestra resumen agregado sin grilla operativa duplicada', async () => {
    obtenerSnapshotActivo.mockResolvedValue({ ...snapshotGuardado(), totalTrabajadores: 8 });
    obtenerSnapshotCompletoActivo.mockResolvedValue(snapshotCompletoConTrabajadores(8));
    const fixture = await montarContainer();
    await fixture.whenStable();

    fixture.componentInstance.abrirOverlayRevision('trabajadores');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const body = fixture.nativeElement.querySelector('.payroll-operational-detail-modal__body');
    expectTexto(body?.textContent ?? '', 'Total');
    expectTexto(body?.textContent ?? '', 'Bloqueados');
    expectTexto(body?.textContent ?? '', 'Con observaciones');
    expectTexto(body?.textContent ?? '', 'Sin movimientos');
    expectTextoNo(body?.textContent ?? '', 'Listado de trabajadores');
    expectTextoNo(body?.textContent ?? '', 'Ver detalle');
    expect(body?.querySelector('input[placeholder="Buscar por nombre o RUT"]')).toBeNull();
    expect(body?.querySelector('.payroll-mass-layout')).toBeNull();
    expect(body?.querySelectorAll('.payroll-follow-row').length).toBe(0);
  });

  it('footer tab trabajadores abre panel en consola', async () => {
    obtenerSnapshotActivo.mockResolvedValue({ ...snapshotGuardado(), totalTrabajadores: 6 });
    obtenerSnapshotCompletoActivo.mockResolvedValue(snapshotCompletoConTrabajadores(6));
    const fixture = await montarContainer();
    await fixture.whenStable();

    const c = fixture.componentInstance;
    c.abrirOverlayRevision('trabajadores');
    fixture.detectChanges();

    const footerBtn = (fixture.nativeElement as HTMLElement).querySelector(
      '.payroll-operational-detail-modal__footer .payroll-modal-primary',
    ) as HTMLButtonElement | null;
    expect(footerBtn?.textContent).toContain('Ir al detalle del período');
    footerBtn?.click();
    fixture.detectChanges();

    expect(c.detalleOperativoAbierto()).toBe(false);
    expect(c.nominaDetalleMensualVista()).toBe('trabajadores');
  });

  it('no muestra CTA de liquidaciones fuera de resumen', async () => {
    const snapshot = {
      ...snapshotGuardado(),
      aprobacionOperativa: { estado: 'aprobado_operativamente', fecha: '2026-05-06T10:00:00.000Z', usuarioLabel: 'RRHH' },
      cierreOperativo: { estado: 'cerrado_operativamente', fecha: '2026-05-07T10:00:00.000Z', usuarioLabel: 'RRHH' },
    };
    obtenerSnapshotActivo.mockResolvedValue(snapshot);
    obtenerSnapshotCompletoActivo.mockResolvedValue({
      ...snapshotCompletoGuardado(),
      cabecera: snapshot,
    });
    const fixture = await montarContainer();
    await fixture.whenStable();

    fixture.componentInstance.abrirOverlayRevision('trabajadores');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expectTextoNo(textoModal(fixture), 'Generar liquidaciones');
  });

  it('no renderiza data-grid para observaciones del resumen', async () => {
    obtenerSnapshotActivo.mockResolvedValue(snapshotGuardado());
    obtenerSnapshotCompletoActivo.mockResolvedValue({
      ...snapshotCompletoGuardado(),
      observaciones: [{
        severidad: 'ADVERTENCIA',
        ambito: 'Parametros',
        mensaje: 'Falta revisar valor del periodo',
        accion: 'Revisar',
      }],
    });
    const fixture = await montarContainer();
    await fixture.whenStable();

    fixture.componentInstance.abrirOverlayRevision('resumen');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const modal = fixture.nativeElement.querySelector('app-proceso-mensual-detalle-modal');
    expect(modal?.querySelector('app-data-grid')).toBeNull();
  });

  it('no duplica incidencia por codigo en resumen del modal', async () => {
    const detalle = 'Valor UF del período pendiente de registrar';
    obtenerSnapshotActivo.mockResolvedValue(snapshotGuardado());
    obtenerSnapshotCompletoActivo.mockResolvedValue({
      ...snapshotCompletoGuardado(),
      observaciones: [{
        codigo: 'PARAM_UF',
        severidad: 'BLOQUEO',
        origen: 'validacion',
        mensaje: detalle,
        campo: null,
        entidadId: null,
        idCalculoTrabajador: null,
      }],
    });
    ejecutarPrevalidaciones.mockResolvedValue(prevalidacionConBloqueoParametros('PARAM_UF', detalle));

    const fixture = await montarContainer();
    await fixture.whenStable();
    fixture.componentInstance.validarPeriodo();
    await esperarPrevalidacion(fixture);

    fixture.componentInstance.abrirOverlayRevision('resumen');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const body = textoBodyModal(fixture);
    expect(body.split(detalle).length - 1).toBe(1);
    expectTexto(body, 'Pendientes del período');
    expectTextoNo(body, 'Observaciones del período');
  });

  it('resumen y tab parametros sin claves tecnicas con flujo real de incidencias', async () => {
    obtenerSnapshotActivo.mockResolvedValue(snapshotGuardado());
    obtenerSnapshotCompletoActivo.mockResolvedValue({
      ...snapshotCompletoGuardado(),
      observaciones: [{
        codigo: 'parametros_generales',
        severidad: 'BLOQUEO',
        origen: 'validacion',
        mensaje: 'FALTANTE sis_fila_mensual sis_null',
        campo: null,
        entidadId: null,
        idCalculoTrabajador: null,
      }],
    });
    ejecutarPrevalidaciones.mockResolvedValue(
      prevalidacionConBloqueoParametros('PARAM_UF', 'Falta valor UF del período'),
    );

    const fixture = await montarContainer();
    await fixture.whenStable();
    fixture.componentInstance.validarPeriodo();
    await esperarPrevalidacion(fixture);

    fixture.componentInstance.abrirOverlayRevision('resumen');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const bodyResumen = textoBodyModal(fixture);
    expectTextoNo(bodyResumen, 'parametros_generales');
    expectTextoNo(bodyResumen, 'sis_null');
    expectTextoNo(bodyResumen, 'sis_fila_mensual');
    expectTextoNo(bodyResumen, 'FALTANTE');

    fixture.componentInstance.abrirOverlayRevision('parametros');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const bodyParametros = textoBodyModal(fixture);
    expectTexto(bodyParametros, 'Ver en resumen');
    expectTextoNo(bodyParametros, 'parametros_generales');
    expectTextoNo(bodyParametros, 'sis_null');
    expectTextoNo(bodyParametros, 'FALTANTE');
    expectTextoNo(bodyParametros, 'Parámetros del período por revisar');
  });

  it('muestra indicador en tabs de revision', async () => {
    obtenerSnapshotActivo.mockResolvedValue(snapshotGuardado());
    obtenerSnapshotCompletoActivo.mockResolvedValue({
      ...snapshotCompletoGuardado(),
      observaciones: [
        {
          codigo: 'parametros_generales',
          severidad: 'BLOQUEO',
          origen: 'validacion',
          mensaje: 'Pendiente de revisión',
          campo: null,
          entidadId: null,
          idCalculoTrabajador: null,
        },
      ],
      resumen: {
        ...snapshotCompletoGuardado().resumen,
        totalObservaciones: 1,
      },
    });
    const fixture = await montarContainer();
    await fixture.whenStable();
    fixture.componentInstance.abrirOverlayRevision('resumen');
    fixture.detectChanges();

    const tabs = fixture.nativeElement.querySelectorAll('.payroll-operational-tab__indicador');
    expect(tabs.length).toBeGreaterThan(0);
  });

  function textoListasRevision(fixture: Awaited<ReturnType<typeof montarContainer>>): string {
    const nodos = fixture.nativeElement.querySelectorAll(
      '.payroll-revision-lista, .payroll-follow-row',
    );
    return [...nodos].map((node) => node.textContent ?? '').join(' ');
  }

  it('no expone copy tecnico ni snake_case en listas del modal', async () => {
    obtenerSnapshotActivo.mockResolvedValue(snapshotGuardado());
    obtenerSnapshotCompletoActivo.mockResolvedValue({
      ...snapshotCompletoGuardado(),
      observaciones: [
        {
          codigo: 'parametros_generales',
          severidad: 'BLOQUEO',
          origen: 'validacion',
          mensaje: 'parametros_generales; sis_null; FALTANTE',
          campo: null,
          entidadId: null,
          idCalculoTrabajador: null,
        },
        {
          codigo: 'base_calculo_sis',
          severidad: 'ADVERTENCIA',
          origen: 'validacion',
          mensaje: 'base_calculo_sis revisar',
          campo: null,
          entidadId: null,
          idCalculoTrabajador: null,
        },
      ],
    });
    ejecutarPrevalidaciones.mockResolvedValue(
      prevalidacionConBloqueoParametros('PARAM_UF', 'periodo_remuneracion; FALTANTE'),
    );

    const fixture = await montarContainer();
    await fixture.whenStable();
    fixture.componentInstance.validarPeriodo();
    await esperarPrevalidacion(fixture);

    fixture.componentInstance.abrirOverlayRevision('resumen');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const body = textoBodyModal(fixture);
    const listas = textoListasRevision(fixture);

    expect(body).not.toContain('parametros_generales');
    expect(body).not.toContain('periodo_remuneracion');
    expect(body).not.toContain('sis_fila_mensual');
    expect(body).not.toContain('sis_null');
    expect(body).not.toContain('FALTANTE');
    expect(body).not.toMatch(/[a-z0-9]+_[a-z0-9_]+/i);
    expect(listas).not.toContain(';');
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
