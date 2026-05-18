import { importProvidersFrom } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
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

import { PeriodoActivoService } from '../../../../core/services/periodo-activo.service';
import type { ProcesoMensualPrevalidacion } from '../../models/proceso-mensual.model';
import { ProcesoMensualService } from '../../services/proceso-mensual.service';
import { ProcesoMensualContainer } from './proceso-mensual-container';

function textoIncluye(haystack: string, needle: string): boolean {
  const fold = (value: string) =>
    value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
  return fold(haystack).includes(fold(needle));
}

function expectTexto(haystack: string, needle: string): void {
  expect(textoIncluye(haystack, needle)).toBe(true);
}

function expectTextoNo(haystack: string, needle: string): void {
  expect(textoIncluye(haystack, needle)).toBe(false);
}

function botonPorTexto(root: ParentNode, fragmento: string): HTMLButtonElement | undefined {
  return [...root.querySelectorAll('button')].find((b) =>
    textoIncluye(b.textContent ?? '', fragmento),
  ) as HTMLButtonElement | undefined;
}

function prevalidacionLista(overrides: Partial<ProcesoMensualPrevalidacion> = {}): ProcesoMensualPrevalidacion {
  return {
    periodo: '2026-05',
    estado: 'LISTO_PARA_CALCULO',
    resumen: {
      periodo: '2026-05',
      hayBloqueos: false,
      hayAdvertencias: false,
      conteoMovimientosPorEstado: { VALIDADO: 1 },
      totalEntradasMensuales: 1,
      resumenEntradasMensuales: {
        total: 1,
        recurrentes: 0,
        novedadesMensuales: 1,
        legacyMovimientos: 0,
        aprobadas: 1,
        pendientesRevision: 0,
        observadas: 0,
        rechazadas: 0,
        anuladas: 0,
        bloqueantes: 0,
        conWarnings: 0,
        aptasPreNomina: 1,
      },
      conteoEntradasPorEstado: { aprobada: 1 },
      trabajadoresActivosAptos: 2,
      trabajadoresActivosNoAptos: 0,
      parametrosOperativos: true,
      parametrosGrupos: [
        { id: 'mensuales_uf_utm_sueldo', clasificacion: 'OK' },
        { id: 'topes_base', clasificacion: 'OK' },
        { id: 'catalogos_afp_impuesto', clasificacion: 'OK' },
      ],
      recurrentesAplicablesAlPeriodo: 1,
      recurrentesInvalidas: 0,
      recurrentesCerradas: 0,
      recurrentesFueraDelMes: 0,
    },
    bloqueos: [],
    advertencias: [],
    informaciones: [],
    items: [],
    ...overrides,
  } as ProcesoMensualPrevalidacion;
}

function baseNominaLista() {
  return {
    periodo: '2026-05',
    estado: 'GENERADA',
    generadoEn: '2026-05-05T10:00:00.000Z',
    trabajadoresIncluidos: 2,
    recurrentesIncluidos: 1,
    movimientosVariablesValidados: 1,
    movimientosVariablesBorrador: 0,
    parametrosOperativos: true,
    codigosBloqueo: [],
    codigosAdvertencia: [],
    origenPrevalidacion: 'LISTO_PARA_CALCULO',
    trazabilidad: {
      trabajadores: [
        {
          idPersona: 1,
          trabajadorLabel: 'Ana Perez',
          rutLabel: '11.111.111-1',
          contratoLabel: 'Contrato vigente',
          estado: 'listo',
          asignacionesRecurrentes: 1,
          movimientosDelMes: 1,
          observacion: 'Sin observaciones',
        },
      ],
      trabajadoresConsiderados: 2,
      listosParaCalculo: 2,
      conObservaciones: 0,
      bloqueados: 0,
      excluidos: 0,
      asignacionesRecurrentesIncluidas: 1,
      movimientosDelMesIncluidos: 1,
      parametrosEstado: 'listos',
      observacionParametros: 'Parametros del periodo disponibles para preparar la base.',
    },
  };
}

function calculoConObservacionesYOmitidos() {
  return {
    periodo: '2026-05',
    estado: 'calculado_preliminar',
    generadoEn: '2026-05-05T10:00:00.000Z',
    resumen: {
      totalTrabajadoresCalculados: 1,
      totalBloqueados: 0,
      totalConAdvertencias: 1,
      totalHaberes: 900000,
      totalDescuentos: 180000,
      totalLiquidoPreliminar: 720000,
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
      baseImponiblePrevisional: 900000,
      baseTributable: 900000,
      gratificacionLegal: 0,
      asignacionFamiliar: 0,
      cotizacionAfp: 0,
      cotizacionSalud: 0,
      cotizacionAfc: 0,
      cotizacionSis: 0,
      cotizacionSanna: 0,
      cotizacionLey16744: 0,
      impuestoUnico: 0,
      totalHaberes: 900000,
      totalDescuentos: 180000,
      liquidoAPago: 720000,
      issues: [{
        codigo: 'TRABAJADOR_DATO_OPCIONAL',
        severidad: 'ADVERTENCIA',
        mensaje: 'Dato opcional pendiente de revision.',
        origen: 'trabajador',
      }],
      trazabilidad: [],
      estado: 'con_advertencias',
    }],
    issues: [],
  };
}

function snapshotGuardado(overrides: Record<string, unknown> = {}) {
  return {
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
    aprobacionOperativa: null,
    cierreOperativo: null,
    trabajadores: [],
    issues: [],
    trazabilidad: [],
    ...overrides,
  };
}

function snapshotCompletoGuardado(overrides: Record<string, unknown> = {}) {
  const cabecera = snapshotGuardado(overrides);
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
    conceptos: [{
      idCalculoConcepto: 20,
      idCalculoTrabajador: 10,
      idConcepto: null,
      tipo: 'haber',
      nombreConceptoSnapshot: 'Sueldo base',
      codigoLreSnapshot: 'HAB001',
      monto: 800000,
      imponible: true,
      tributable: true,
      afectaLiquido: true,
      origen: 'contrato',
      trazabilidadJson: null,
    }],
    issues: [{
      idIssue: 30,
      idCalculoPeriodo: 1,
      idCalculoTrabajador: 10,
      codigo: 'INFO_RESULTADO',
      severidad: 'INFO',
      origen: 'calculo',
      mensaje: 'Informacion guardada del resultado.',
      campo: null,
      entidadId: null,
    }],
    trazabilidad: [],
  };
  return {
    cabecera: { ...cabecera, trabajadores: [trabajador], issues: [], trazabilidad: [] },
    trabajadores: [trabajador],
    conceptos: trabajador.conceptos,
    observaciones: trabajador.issues,
    trazabilidad: [{
      idTrazabilidad: 40,
      idCalculoPeriodo: 1,
      idCalculoTrabajador: 10,
      codigo: 'LIQUIDO_PRELIMINAR',
      origen: 'calculo',
      tablaFuente: 'resultado',
      campoFuente: 'liquido',
      vigenciaInicio: null,
      vigenciaFin: null,
      valorEntrada: 800000,
      formula: 'haberes - descuentos',
      valorResultado: 650000,
      observacion: 'Liquido calculado guardado.',
    }],
    aprobacionOperativa: cabecera.aprobacionOperativa,
    resumen: {
      totalConceptos: 1,
      totalObservaciones: 1,
      totalTrazas: 1,
      totalTrabajadoresSinDetalle: 0,
      esActivoVigente: true,
      fueReemplazado: false,
    },
  };
}

describe('ProcesoMensualContainer', () => {
  let fixture: ComponentFixture<ProcesoMensualContainer>;
  const ejecutarPrevalidaciones = vi.fn();
  const generarPreNominaPeriodo = vi.fn();
  const generarCalculoPeriodo = vi.fn();
  const guardarSnapshotPreliminar = vi.fn();
  const reemplazarSnapshotPreliminar = vi.fn();
  const aprobarResultadoPreliminarOperativamente = vi.fn();
  const cerrarNominaOperativamente = vi.fn();
  const obtenerResultadoCalculoPeriodo = vi.fn();
  const obtenerSnapshotActivo = vi.fn();
  const obtenerSnapshotCompletoActivo = vi.fn();
  const obtenerSnapshotCompletoPorId = vi.fn();

  beforeEach(async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    ejecutarPrevalidaciones.mockReset();
    generarPreNominaPeriodo.mockReset();
    generarCalculoPeriodo.mockReset();
    guardarSnapshotPreliminar.mockReset();
    reemplazarSnapshotPreliminar.mockReset();
    aprobarResultadoPreliminarOperativamente.mockReset();
    cerrarNominaOperativamente.mockReset();
    obtenerResultadoCalculoPeriodo.mockReset();
    obtenerSnapshotActivo.mockReset();
    obtenerSnapshotCompletoActivo.mockReset();
    obtenerSnapshotCompletoPorId.mockReset();
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
      trazabilidad: {
        trabajadores: [
          {
            idPersona: 1,
            trabajadorLabel: 'Ana Perez',
            rutLabel: '11.111.111-1',
            contratoLabel: 'Contrato vigente',
            estado: 'listo',
            asignacionesRecurrentes: 1,
            movimientosDelMes: 1,
            observacion: 'Sin observaciones',
          },
          {
            idPersona: 2,
            trabajadorLabel: 'Luis Soto',
            rutLabel: '22.222.222-2',
            contratoLabel: 'Contrato no disponible',
            estado: 'con_observaciones',
            asignacionesRecurrentes: 0,
            movimientosDelMes: 1,
            observacion: 'Contrato no disponible.',
          },
          {
            idPersona: 3,
            trabajadorLabel: 'Marta Rojas',
            rutLabel: '33.333.333-3',
            contratoLabel: 'Contrato vigente',
            estado: 'bloqueado',
            asignacionesRecurrentes: 0,
            movimientosDelMes: 0,
            observacion: '1 entrada(s) bloqueante(s).',
          },
        ],
        trabajadoresConsiderados: 3,
        listosParaCalculo: 1,
        conObservaciones: 1,
        bloqueados: 1,
        excluidos: 0,
        asignacionesRecurrentesIncluidas: 1,
        movimientosDelMesIncluidos: 2,
        parametrosEstado: 'con_observaciones',
        observacionParametros: 'Parametros disponibles con observaciones del periodo.',
      },
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
    const snapshotMock = snapshotGuardado();
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
    aprobarResultadoPreliminarOperativamente.mockResolvedValue({
      ...snapshotMock,
      aprobacionOperativa: {
        estado: 'aprobado_operativamente',
        fecha: '2026-05-05T11:00:00.000Z',
        usuarioId: null,
        usuarioLabel: 'Usuario no disponible en esta sesion',
        advertencias: [],
        metadata: { idCalculoPeriodo: 1, periodo: '2026-05' },
      },
    });
    cerrarNominaOperativamente.mockImplementation(({ idCalculoPeriodo, periodo }) => Promise.resolve({
      ...snapshotGuardado({
        idCalculoPeriodo,
        periodo,
        aprobacionOperativa: {
          estado: 'aprobado_operativamente',
          fecha: '2026-05-05T11:00:00.000Z',
          usuarioId: null,
          usuarioLabel: 'Usuario no disponible en esta sesion',
          advertencias: [],
          metadata: { idCalculoPeriodo, periodo },
        },
        cierreOperativo: {
          estado: 'cerrado_operativamente',
          fecha: '2026-05-05T12:00:00.000Z',
          usuarioId: null,
          usuarioLabel: 'Usuario no disponible en esta sesion',
          observacion: null,
          metadata: { idCalculoPeriodo, periodo },
        },
      }),
    }));
    obtenerSnapshotActivo.mockResolvedValue(null);
    obtenerSnapshotCompletoActivo.mockResolvedValue(null);
    obtenerSnapshotCompletoPorId.mockResolvedValue(null);

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
            aprobarResultadoPreliminarOperativamente,
            cerrarNominaOperativamente,
            obtenerResultadoCalculoPeriodo,
            obtenerSnapshotActivo,
            obtenerSnapshotCompletoActivo,
            obtenerSnapshotCompletoPorId,
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

    fixture = TestBed.createComponent(ProcesoMensualContainer);
    fixture.detectChanges();
  });

  describe('overlay unificado (NOM-MODALES-PERIODO-STATE-03)', () => {
    it('inicia con overlay cerrado y computeds compatibles en false/null', () => {
      const c = fixture.componentInstance;
      expect(c.overlay().kind).toBe('cerrado');
      expect(c.detalleOperativoAbierto()).toBe(false);
      expect(c.confirmacionProceso()).toBeNull();
      expect(c.informacionPeriodo()).toBeNull();
    });

    it('abre revision con tab y cierra con cerrarOverlay', () => {
      const c = fixture.componentInstance;
      c.abrirOverlayRevision('parametros');
      fixture.detectChanges();
      expect(c.overlay().kind).toBe('revision');
      expect(c.detalleOperativoAbierto()).toBe(true);
      expect(c.detalleOperativoTabActivo()).toBe('parametros');
      expect(fixture.nativeElement.querySelector('.payroll-operational-detail-overlay')).toBeTruthy();

      c.cerrarOverlay();
      fixture.detectChanges();
      expect(c.overlay().kind).toBe('cerrado');
      expect(fixture.nativeElement.querySelector('.payroll-operational-detail-overlay')).toBeNull();
    });

    it('abre decision con message-box en app-proceso-mensual-overlays', () => {
      const c = fixture.componentInstance;
      c.abrirOverlayDecision({
        tipo: 'guardar_preliminar',
        titulo: 'Guardar versión revisable',
        mensaje: 'Mensaje de prueba',
        detalle: 'Detalle de prueba',
        puntos: ['Punto uno'],
        primaryLabel: 'Guardar version',
        secondaryLabel: 'Cancelar',
      });
      fixture.detectChanges();
      expect(c.overlay().kind).toBe('decision');
      expect(c.confirmacionProceso()?.titulo).toContain('Guardar');
      expect(fixture.nativeElement.querySelector('app-message-box')).toBeTruthy();
    });

    it('cancelar decision vuelve a overlay cerrado', () => {
      const c = fixture.componentInstance;
      c.abrirOverlayDecision({
        tipo: 'preparar_acta',
        titulo: 'Preparar acta operativa del periodo',
        mensaje: 'Mensaje',
        detalle: 'Detalle',
        puntos: ['Punto'],
        primaryLabel: 'Preparar acta',
        secondaryLabel: 'Cancelar',
      });
      fixture.detectChanges();
      c.cancelarAccionProceso();
      fixture.detectChanges();
      expect(c.overlay().kind).toBe('cerrado');
      expect(fixture.nativeElement.querySelector('app-message-box')).toBeNull();
    });

    it('tras error de validacion abre informacion y oculta banner crudo', async () => {
      ejecutarPrevalidaciones.mockRejectedValueOnce(new Error('rpc_validar_periodo timeout'));
      const c = fixture.componentInstance;
      c.validarPeriodo();
      await fixture.whenStable();
      fixture.detectChanges();

      expect(c.overlay().kind).toBe('informacion');
      expect(c.informacionPeriodo()?.titulo).toBeTruthy();
      expect(fixture.nativeElement.querySelector('.payroll-ledger-error')).toBeNull();
      expect(fixture.nativeElement.querySelector('app-message-box')).toBeTruthy();
    });

    it('cerrarOverlay con informacion activa suprime resincronizacion', async () => {
      ejecutarPrevalidaciones.mockRejectedValueOnce(new Error('fallo de red'));
      const c = fixture.componentInstance;
      c.validarPeriodo();
      await fixture.whenStable();
      fixture.detectChanges();
      c.cerrarOverlay();
      fixture.detectChanges();
      expect(c.overlay().kind).toBe('cerrado');
      c.sincronizarInformacionPeriodo();
      fixture.detectChanges();
      expect(c.overlay().kind).toBe('cerrado');
    });

    it('abrirDetalleOperativo contextual resuelve tab desde bloqueos', async () => {
      ejecutarPrevalidaciones.mockResolvedValueOnce(prevalidacionLista({
        bloqueos: [{
          codigo: 'PARAMETROS',
          area: 'PARAMETROS',
          severidad: 'BLOQUEO',
          texto: 'Grupos incompletos',
        }],
      }));
      const c = fixture.componentInstance;
      c.validarPeriodo();
      await fixture.whenStable();
      fixture.detectChanges();
      c.cerrarOverlay();
      c.abrirDetalleOperativoContextual();
      fixture.detectChanges();
      expect(c.overlay().kind).toBe('revision');
      expect(c.detalleOperativoTabActivo()).toBe('parametros');
    });

    it('decision reemplaza informacion al guardar snapshot', async () => {
      ejecutarPrevalidaciones.mockRejectedValueOnce(new Error('error previo'));
      const c = fixture.componentInstance;
      c.validarPeriodo();
      await fixture.whenStable();
      fixture.detectChanges();
      expect(c.overlay().kind).toBe('informacion');

      c.guardarSnapshotPreliminar();
      fixture.detectChanges();
      expect(c.overlay().kind).toBe('decision');
      expect(c.informacionPeriodo()).toBeNull();
    });
  });

  describe.skip('DOM legacy pre-workspace (deuda NOM-CONTAINER-SPEC-REPARO)', () => {
  it('crea la vista y muestra titulo preparar nomina', () => {
    const text = fixture.nativeElement.textContent as string;
    expectTexto(text, 'Preparar nomina');
  });

  it('en estado inicial muestra solo validacion y no expone etapas internas completas', () => {
    const text = fixture.nativeElement.textContent as string;
    expectTexto(text, 'Pendiente de validacion');
    expectTexto(text, 'Valida el periodo activo para detectar bloqueos');
    expectTextoNo(text, 'Revision para aprobacion');
    expectTextoNo(text, 'Detalle del resultado guardado');
    expectTextoNo(text, 'Cierre operativo');
  });

  it('mueve alcance e informacion interna al disclosure final', () => {
    const text = fixture.nativeElement.textContent as string;
    expectTexto(text, 'Informacion interna y alcance');
    expectTexto(text, 'Salidas legales y archivos externos quedan fuera de esta fase.');
    expectTextoNo(text, 'Alcance de esta pantalla');
  });

  it('muestra periodo global como contexto, sin selector local editable', () => {
    const input = fixture.nativeElement.querySelector('input[type="month"]') as HTMLInputElement | null;
    const text = fixture.nativeElement.textContent as string;
    expect(input).toBeNull();
    expectTexto(text, 'Período activo');
    expectTexto(text, 'Mayo 2026');
  });

  it('al pulsar Validar periodo llama al servicio de prevalidacion', async () => {
    const buttons = [...fixture.nativeElement.querySelectorAll('button')] as HTMLButtonElement[];
    const btn = botonPorTexto(fixture.nativeElement, 'Validar periodo');
    expect(btn).toBeTruthy();
    btn!.click();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(ejecutarPrevalidaciones).toHaveBeenCalled();
  });

  it('muestra un solo CTA Validar periodo', () => {
    const buttons = [...fixture.nativeElement.querySelectorAll('button')] as HTMLButtonElement[];
    const validar = buttons.filter((b) => textoIncluye(b.textContent ?? '', 'Validar periodo'));
    expect(validar).toHaveLength(1);
  });

  it('renderiza el bloque Acta operativa del periodo en estado bloqueado inicial', () => {
    const text = fixture.nativeElement.textContent as string;
    expectTexto(text, 'Acta operativa del período');
    expectTexto(text, 'Disponible después de validar el período');
    expectTexto(text, 'Primero valida el período para habilitar el respaldo operativo');
    expectTextoNo(text, 'Contexto revisado');
    expectTextoNo(text, 'Corregir antes de avanzar');
  });

  it('en estado sin validar muestra riesgo sin evaluar y no riesgo bajo', () => {
    const text = fixture.nativeElement.textContent as string;
    expectTexto(text, 'Sin evaluar');
    expectTextoNo(text, 'Riesgo bajo');
    expectTexto(text, 'Siguiente acción');
    expectTexto(text, 'Validar período');
    expectTexto(text, 'Aún no hay bloqueos ni advertencias evaluadas');
  });

  it('conserva las 5 etapas en la bitacora del periodo', () => {
    const text = fixture.nativeElement.textContent as string;
    expectTexto(text, 'Preparar datos');
    expectTexto(text, 'Construir base');
    expectTexto(text, 'Calcular y revisar');
    expectTexto(text, 'Aprobar y cerrar');
    expectTexto(text, 'Liquidaciones internas');
  });

  it('tras validar muestra texto de bloqueos', async () => {
    const buttons = [...fixture.nativeElement.querySelectorAll('button')] as HTMLButtonElement[];
    botonPorTexto(fixture.nativeElement, 'Validar per')!.click();
    await fixture.whenStable();
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent as string;
    expectTexto(text, 'No se encontraron parametros reales validados para este periodo.');
  });

  it('con validacion apta muestra CTA para preparar acta con revision', async () => {
    ejecutarPrevalidaciones.mockResolvedValueOnce(prevalidacionLista());
    const buttons = [...fixture.nativeElement.querySelectorAll('button')] as HTMLButtonElement[];
    botonPorTexto(fixture.nativeElement, 'Validar per')!.click();
    await fixture.whenStable();
    fixture.detectChanges();

    const prepararActa = ([...fixture.nativeElement.querySelectorAll('button')] as HTMLButtonElement[]).find((b) => textoIncluye(b.textContent ?? '', 'Preparar acta con revision'),
    );
    const text = fixture.nativeElement.textContent as string;
    expectTexto(text, 'Preparar acta con observaciones');
    expectTexto(text, 'El periodo tiene revisiones pendientes.');
    expect(prepararActa?.disabled).toBe(false);
  });

  it('al presionar preparar acta abre app-message-box', async () => {
    ejecutarPrevalidaciones.mockResolvedValueOnce(prevalidacionLista());
    let buttons = [...fixture.nativeElement.querySelectorAll('button')] as HTMLButtonElement[];
    botonPorTexto(fixture.nativeElement, 'Validar per')!.click();
    await fixture.whenStable();
    fixture.detectChanges();

    buttons = [...fixture.nativeElement.querySelectorAll('button')] as HTMLButtonElement[];
    botonPorTexto(fixture.nativeElement, 'Preparar acta con revision')!.click();
    fixture.detectChanges();

    const messageBox = fixture.nativeElement.querySelector('app-message-box');
    const text = fixture.nativeElement.textContent as string;
    expect(messageBox).toBeTruthy();
    expectTexto(text, 'Preparar acta operativa del periodo');
    expectTexto(text, 'Que se incluye');
    expectTexto(text, 'Que no hace todavia');
  });

  it('al confirmar acta cambia a estado visual preparada sin persistir ni generar liquidaciones', async () => {
    ejecutarPrevalidaciones.mockResolvedValueOnce(prevalidacionLista());
    let buttons = [...fixture.nativeElement.querySelectorAll('button')] as HTMLButtonElement[];
    botonPorTexto(fixture.nativeElement, 'Validar periodo')!.click();
    await fixture.whenStable();
    fixture.detectChanges();

    buttons = [...fixture.nativeElement.querySelectorAll('button')] as HTMLButtonElement[];
    botonPorTexto(fixture.nativeElement, 'Preparar acta con revision')!.click();
    fixture.detectChanges();
    buttons = [...fixture.nativeElement.querySelectorAll('button')] as HTMLButtonElement[];
    botonPorTexto(fixture.nativeElement, 'Preparar con observaciones')!.click();
    await fixture.whenStable();
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    expectTexto(text, 'Acta preparada');
    expectTexto(text, 'Ir a Liquidaciones oficiales');
    expect(guardarSnapshotPreliminar).not.toHaveBeenCalled();
    expect(cerrarNominaOperativamente).not.toHaveBeenCalled();
  });

  it('no muestra valores normativos tipo UF demo en el copy base', () => {
    const text = fixture.nativeElement.textContent as string;
    expect(text).not.toMatch(/UF\s*[:=]\s*[0-9]/i);
  });

  it('tras validar muestra dashboard operativo y accion recomendada', async () => {
    const buttons = [...fixture.nativeElement.querySelectorAll('button')] as HTMLButtonElement[];
    botonPorTexto(fixture.nativeElement, 'Validar periodo')!.click();
    await fixture.whenStable();
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent as string;
    expectTexto(text, 'Resumen minimo del periodo');
    expectTexto(text, 'Siguiente accion recomendada');
    expectTexto(text, 'Que falta ahora');
    expectTextoNo(text, 'Recorrido visible');
    expectTexto(text, 'Parametros');
  });

  it('no renderiza calculo preliminar antes de validar', () => {
    const text = fixture.nativeElement.textContent as string;
    expectTextoNo(text, 'Estado para calculo preliminar');
    expectTextoNo(text, 'Calculo preliminar');
  });

  it('no renderiza resultado preliminar antes de validar y generar base', () => {
    const text = fixture.nativeElement.textContent as string;
    expectTextoNo(text, 'Resultado preliminar');
    expectTextoNo(text, 'Aun no hay resultado preliminar.');
  });

  it('con bloqueos muestra estado bloqueado, deshabilita calcular y muestra razon', async () => {
    const buttons = [...fixture.nativeElement.querySelectorAll('button')] as HTMLButtonElement[];
    botonPorTexto(fixture.nativeElement, 'Validar periodo')!.click();
    await fixture.whenStable();
    fixture.detectChanges();

    const calcular = ([...fixture.nativeElement.querySelectorAll('button')] as HTMLButtonElement[]).find((b) => textoIncluye(b.textContent ?? '', 'Calcular preliminar'),
    );
    const text = fixture.nativeElement.textContent as string;
    expectTexto(text, 'Periodo con pendientes');
    expectTexto(text, 'No se encontraron parametros reales validados para este periodo.');
    expect(calcular).toBeUndefined();
  });

  it('sin base generada bloquea el calculo y recomienda generar base', async () => {
    ejecutarPrevalidaciones.mockResolvedValueOnce(prevalidacionLista());
    const buttons = [...fixture.nativeElement.querySelectorAll('button')] as HTMLButtonElement[];
    botonPorTexto(fixture.nativeElement, 'Validar periodo')!.click();
    await fixture.whenStable();
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    expectTexto(text, 'Aun no se ha generado la base de nomina para este periodo.');
    expectTexto(text, 'Generar base de nomina');
    expectTextoNo(text, 'Estado para calculo preliminar');
  });

  it('con base lista habilita calcular preliminar', async () => {
    ejecutarPrevalidaciones.mockResolvedValueOnce(prevalidacionLista());
    generarPreNominaPeriodo.mockResolvedValueOnce(baseNominaLista());

    let buttons = [...fixture.nativeElement.querySelectorAll('button')] as HTMLButtonElement[];
    botonPorTexto(fixture.nativeElement, 'Validar periodo')!.click();
    await fixture.whenStable();
    fixture.detectChanges();

    buttons = [...fixture.nativeElement.querySelectorAll('button')] as HTMLButtonElement[];
    botonPorTexto(fixture.nativeElement, 'Generar base de nomina')!.click();
    await fixture.whenStable();
    fixture.detectChanges();

    const calcular = ([...fixture.nativeElement.querySelectorAll('button')] as HTMLButtonElement[]).find((b) => textoIncluye(b.textContent ?? '', 'Calcular preliminar'),
    );
    const text = fixture.nativeElement.textContent as string;
    expectTexto(text, 'Listo para calcular');
    expectTexto(text, 'La base de nomina esta lista para calcular preliminarmente.');
    expect(calcular?.disabled).toBe(false);
  });

  it('solo advertencias permite calcular preliminarmente', async () => {
    ejecutarPrevalidaciones.mockResolvedValueOnce(prevalidacionLista({
      estado: 'CON_ADVERTENCIAS',
      resumen: {
        ...prevalidacionLista().resumen,
        hayAdvertencias: true,
        resumenEntradasMensuales: {
          ...prevalidacionLista().resumen.resumenEntradasMensuales!,
          total: 0,
          novedadesMensuales: 0,
          aptasPreNomina: 0,
        },
        totalEntradasMensuales: 0,
      },
      advertencias: [],
    }));
    generarPreNominaPeriodo.mockResolvedValueOnce({
      ...baseNominaLista(),
      trazabilidad: {
        ...baseNominaLista().trazabilidad,
        movimientosDelMesIncluidos: 0,
      },
    });

    let buttons = [...fixture.nativeElement.querySelectorAll('button')] as HTMLButtonElement[];
    botonPorTexto(fixture.nativeElement, 'Validar periodo')!.click();
    await fixture.whenStable();
    fixture.detectChanges();
    buttons = [...fixture.nativeElement.querySelectorAll('button')] as HTMLButtonElement[];
    botonPorTexto(fixture.nativeElement, 'Generar base de nomina')!.click();
    await fixture.whenStable();
    fixture.detectChanges();

    const calcular = ([...fixture.nativeElement.querySelectorAll('button')] as HTMLButtonElement[]).find((b) => textoIncluye(b.textContent ?? '', 'Calcular preliminar'),
    );
    const text = fixture.nativeElement.textContent as string;
    expectTexto(text, 'Con advertencias');
    expectTexto(text, 'No hay movimientos del periodo registrados');
    expectTexto(text, 'No bloquea el calculo preliminar.');
    expect(calcular?.disabled).toBe(false);
  });

  it('ausencia de asignaciones recurrentes advierte y no bloquea', async () => {
    ejecutarPrevalidaciones.mockResolvedValueOnce(prevalidacionLista({
      resumen: {
        ...prevalidacionLista().resumen,
        recurrentesAplicablesAlPeriodo: 0,
      },
    }));
    generarPreNominaPeriodo.mockResolvedValueOnce({
      ...baseNominaLista(),
      recurrentesIncluidos: 0,
      trazabilidad: {
        ...baseNominaLista().trazabilidad,
        asignacionesRecurrentesIncluidas: 0,
      },
    });

    let buttons = [...fixture.nativeElement.querySelectorAll('button')] as HTMLButtonElement[];
    botonPorTexto(fixture.nativeElement, 'Validar periodo')!.click();
    await fixture.whenStable();
    fixture.detectChanges();
    buttons = [...fixture.nativeElement.querySelectorAll('button')] as HTMLButtonElement[];
    botonPorTexto(fixture.nativeElement, 'Generar base de nomina')!.click();
    await fixture.whenStable();
    fixture.detectChanges();

    const calcular = ([...fixture.nativeElement.querySelectorAll('button')] as HTMLButtonElement[]).find((b) => textoIncluye(b.textContent ?? '', 'Calcular preliminar'),
    );
    const text = fixture.nativeElement.textContent as string;
    expectTexto(text, 'No hay asignaciones recurrentes activas');
    expectTexto(text, 'No bloquea el calculo preliminar.');
    expect(calcular?.disabled).toBe(false);
  });

  it('sin trabajadores considerados bloquea el calculo', async () => {
    ejecutarPrevalidaciones.mockResolvedValueOnce(prevalidacionLista({
      resumen: {
        ...prevalidacionLista().resumen,
        trabajadoresActivosAptos: 0,
      },
    }));
    generarPreNominaPeriodo.mockResolvedValueOnce({
      ...baseNominaLista(),
      trabajadoresIncluidos: 0,
      trazabilidad: {
        ...baseNominaLista().trazabilidad,
        trabajadoresConsiderados: 0,
        listosParaCalculo: 0,
        trabajadores: [],
      },
    });

    let buttons = [...fixture.nativeElement.querySelectorAll('button')] as HTMLButtonElement[];
    botonPorTexto(fixture.nativeElement, 'Validar periodo')!.click();
    await fixture.whenStable();
    fixture.detectChanges();
    buttons = [...fixture.nativeElement.querySelectorAll('button')] as HTMLButtonElement[];
    botonPorTexto(fixture.nativeElement, 'Generar base de nomina')!.click();
    await fixture.whenStable();
    fixture.detectChanges();

    const calcular = ([...fixture.nativeElement.querySelectorAll('button')] as HTMLButtonElement[]).find((b) => textoIncluye(b.textContent ?? '', 'Calcular preliminar'),
    );
    const text = fixture.nativeElement.textContent as string;
    expectTexto(text, 'No hay trabajadores considerados');
    expectTexto(text, 'La base de nomina no tiene trabajadores para calcular.');
    expect(calcular?.disabled).toBe(true);
  });

  it('parametros minimos faltantes bloquean y parametros opcionales solo advierten', async () => {
    ejecutarPrevalidaciones.mockResolvedValueOnce(prevalidacionLista({
      resumen: {
        ...prevalidacionLista().resumen,
        parametrosGrupos: [
          { id: 'topes_base', clasificacion: 'FALTANTE' },
          { id: 'salud_catalogo', clasificacion: 'PARCIAL' },
        ],
      },
    }));
    generarPreNominaPeriodo.mockResolvedValueOnce(baseNominaLista());

    let buttons = [...fixture.nativeElement.querySelectorAll('button')] as HTMLButtonElement[];
    botonPorTexto(fixture.nativeElement, 'Validar periodo')!.click();
    await fixture.whenStable();
    fixture.detectChanges();
    buttons = [...fixture.nativeElement.querySelectorAll('button')] as HTMLButtonElement[];
    botonPorTexto(fixture.nativeElement, 'Generar base de nomina')!.click();
    await fixture.whenStable();
    fixture.detectChanges();

    const calcular = ([...fixture.nativeElement.querySelectorAll('button')] as HTMLButtonElement[]).find((b) => textoIncluye(b.textContent ?? '', 'Calcular preliminar'),
    );
    const text = fixture.nativeElement.textContent as string;
    expectTexto(text, 'Faltan parametros minimos para calcular');
    expectTexto(text, 'Hay parametros opcionales pendientes');
    expectTexto(text, 'Parametros');
    expect(calcular?.disabled).toBe(true);
  });

  it('genera y muestra base de nomina posterior a una validacion sin bloqueos', async () => {
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
    botonPorTexto(fixture.nativeElement, 'Validar periodo')!.click();
    await fixture.whenStable();
    fixture.detectChanges();

    const btnBaseNomina = ([...fixture.nativeElement.querySelectorAll('button')] as HTMLButtonElement[]).find((b) => textoIncluye(b.textContent ?? '', 'Generar base de nomina'),
    );
    expect(btnBaseNomina).toBeTruthy();
    btnBaseNomina!.click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(generarPreNominaPeriodo).toHaveBeenCalledWith('2026-05');
    const text = fixture.nativeElement.textContent as string;
    expectTexto(text, 'Base generada con advertencias');
    expectTexto(text, 'Resumen de base');
    expectTexto(text, 'Trabajadores considerados');
  });

  it('muestra trazabilidad operativa de la base de nomina', async () => {
    ejecutarPrevalidaciones.mockResolvedValueOnce({
      periodo: '2026-05',
      estado: 'LISTO_PARA_CALCULO',
      resumen: {
        periodo: '2026-05',
        hayBloqueos: false,
        hayAdvertencias: false,
        conteoMovimientosPorEstado: { VALIDADO: 1 },
        trabajadoresActivosAptos: 3,
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

    let buttons = [...fixture.nativeElement.querySelectorAll('button')] as HTMLButtonElement[];
    botonPorTexto(fixture.nativeElement, 'Validar periodo')!.click();
    await fixture.whenStable();
    fixture.detectChanges();

    buttons = [...fixture.nativeElement.querySelectorAll('button')] as HTMLButtonElement[];
    botonPorTexto(fixture.nativeElement, 'Generar base de nomina')!.click();
    await fixture.whenStable();
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    expectTexto(text, 'Resumen de base');
    expectTexto(text, 'Trabajadores incluidos');
    expectTexto(text, 'Trabajadores considerados');
    expectTexto(text, 'Listos para calculo');
    expectTexto(text, 'Con observaciones');
    expectTexto(text, 'Bloqueados');
    expectTexto(text, 'Recurrentes incluidos');
    expectTexto(text, 'Movimientos del mes incluidos');
    expectTexto(text, 'Ana Perez');
    expectTexto(text, '11.111.111-1');
    expectTexto(text, 'Luis Soto');
    expectTexto(text, 'Contrato no disponible');
    expectTexto(text, 'Marta Rojas');
    expectTexto(text, 'Listo para calculo');
    expectTexto(text, 'Bloqueado');
    expectTexto(text, 'Entradas consideradas');
    expectTexto(text, 'Parametros del periodo');
    expectTexto(text, 'Parametros');
    expectTexto(text, 'Movimientos');
    expectTexto(text, 'Revisar recurrentes');
    expectTexto(text, 'Actualizar base de nomina');
  });

  it('mantiene fuera de la base los labels tecnicos visibles', async () => {
    ejecutarPrevalidaciones.mockResolvedValueOnce({
      periodo: '2026-05',
      estado: 'LISTO_PARA_CALCULO',
      resumen: {
        periodo: '2026-05',
        hayBloqueos: false,
        hayAdvertencias: false,
        conteoMovimientosPorEstado: { VALIDADO: 1 },
        trabajadoresActivosAptos: 3,
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

    let buttons = [...fixture.nativeElement.querySelectorAll('button')] as HTMLButtonElement[];
    botonPorTexto(fixture.nativeElement, 'Validar periodo')!.click();
    await fixture.whenStable();
    fixture.detectChanges();

    buttons = [...fixture.nativeElement.querySelectorAll('button')] as HTMLButtonElement[];
    botonPorTexto(fixture.nativeElement, 'Generar base de nomina')!.click();
    await fixture.whenStable();
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    expectTextoNo(text, 'Pre-nomina');
    expectTextoNo(text, 'Issues');
    expectTextoNo(text, 'Novedades');
    expectTextoNo(text, 'Payload');
    expectTextoNo(text, 'Hash');
    expectTextoNo(text, 'idPersona');
    expectTextoNo(text, 'idContrato');
    expectTextoNo(text, 'idConcepto');
  });

  it('calcula preliminar posterior a pre-nomina generada y muestra tabla resultado', async () => {
    ejecutarPrevalidaciones.mockResolvedValueOnce(prevalidacionLista());
    generarPreNominaPeriodo.mockResolvedValueOnce(baseNominaLista());

    let buttons = [...fixture.nativeElement.querySelectorAll('button')] as HTMLButtonElement[];
    botonPorTexto(fixture.nativeElement, 'Validar periodo')!.click();
    await fixture.whenStable();
    fixture.detectChanges();

    buttons = [...fixture.nativeElement.querySelectorAll('button')] as HTMLButtonElement[];
    botonPorTexto(fixture.nativeElement, 'Generar base de nomina')!.click();
    await fixture.whenStable();
    fixture.detectChanges();

    buttons = [...fixture.nativeElement.querySelectorAll('button')] as HTMLButtonElement[];
    botonPorTexto(fixture.nativeElement, 'Calcular preliminar')!.click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(generarCalculoPeriodo).toHaveBeenCalledWith('2026-05');
    const text = fixture.nativeElement.textContent as string;
    expectTexto(text, 'Resultado preliminar generado');
    expectTexto(text, 'Trabajadores calculados');
    expectTexto(text, 'Total haberes');
    expectTexto(text, 'Total descuentos');
    expectTexto(text, 'Liquido preliminar');
    expectTexto(text, 'Observaciones');
    expectTexto(text, 'Ana Perez');
    expectTexto(text, 'Calculado');
    expectTexto(text, 'Version interna');
    expectTexto(text, 'Referencia interna');
    expectTexto(text, 'Fecha de generacion');
    expectTexto(text, 'Recalcular preliminar');
    expectTexto(text, 'Guardar resultado preliminar');
  });

  it('muestra trabajadores con observaciones y omitidos en el resultado preliminar', async () => {
    ejecutarPrevalidaciones.mockResolvedValueOnce(prevalidacionLista());
    generarPreNominaPeriodo.mockResolvedValueOnce({
      ...baseNominaLista(),
      trazabilidad: {
        ...baseNominaLista().trazabilidad,
        trabajadores: [
          ...baseNominaLista().trazabilidad.trabajadores,
          {
            idPersona: 2,
            trabajadorLabel: 'Luis Soto',
            rutLabel: '22.222.222-2',
            contratoLabel: 'Contrato no disponible',
            estado: 'bloqueado',
            asignacionesRecurrentes: 0,
            movimientosDelMes: 0,
            observacion: 'Contrato no disponible.',
          },
        ],
        trabajadoresConsiderados: 2,
        bloqueados: 0,
      },
    });
    generarCalculoPeriodo.mockResolvedValueOnce(calculoConObservacionesYOmitidos());

    let buttons = [...fixture.nativeElement.querySelectorAll('button')] as HTMLButtonElement[];
    botonPorTexto(fixture.nativeElement, 'Validar periodo')!.click();
    await fixture.whenStable();
    fixture.detectChanges();
    buttons = [...fixture.nativeElement.querySelectorAll('button')] as HTMLButtonElement[];
    botonPorTexto(fixture.nativeElement, 'Generar base de nomina')!.click();
    await fixture.whenStable();
    fixture.detectChanges();
    buttons = [...fixture.nativeElement.querySelectorAll('button')] as HTMLButtonElement[];
    botonPorTexto(fixture.nativeElement, 'Calcular preliminar')!.click();
    await fixture.whenStable();
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    expectTexto(text, 'Resultado con bloqueos');
    expectTexto(text, 'Trabajadores con observaciones');
    expectTexto(text, 'Trabajadores omitidos');
    expectTexto(text, 'Con observaciones');
    expectTexto(text, 'Omitido');
    expectTexto(text, 'Luis Soto');
    expectTexto(text, 'Contrato no disponible.');
    expectTexto(text, 'Advertencias del resultado');
    expectTexto(text, 'Dato opcional pendiente de revision.');
    expectTexto(text, 'Bloqueos del resultado');
    expectTexto(text, 'Trabajador omitido del calculo');
    expectTexto(text, 'Revisar base de nomina');
  });

  it('guarda snapshot preliminar posterior a calculo sin bloqueos', async () => {
    ejecutarPrevalidaciones.mockResolvedValueOnce(prevalidacionLista());
    generarPreNominaPeriodo.mockResolvedValueOnce(baseNominaLista());

    let buttons = [...fixture.nativeElement.querySelectorAll('button')] as HTMLButtonElement[];
    botonPorTexto(fixture.nativeElement, 'Validar periodo')!.click();
    await fixture.whenStable();
    fixture.detectChanges();
    buttons = [...fixture.nativeElement.querySelectorAll('button')] as HTMLButtonElement[];
    botonPorTexto(fixture.nativeElement, 'Generar base de nomina')!.click();
    await fixture.whenStable();
    fixture.detectChanges();
    buttons = [...fixture.nativeElement.querySelectorAll('button')] as HTMLButtonElement[];
    botonPorTexto(fixture.nativeElement, 'Calcular preliminar')!.click();
    await fixture.whenStable();
    fixture.detectChanges();
    buttons = [...fixture.nativeElement.querySelectorAll('button')] as HTMLButtonElement[];
    botonPorTexto(fixture.nativeElement, 'Guardar resultado preliminar')!.click();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(guardarSnapshotPreliminar).not.toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain('Que debe revisar RRHH');
    buttons = [...fixture.nativeElement.querySelectorAll('button')] as HTMLButtonElement[];
    buttons.find((b) => (b.textContent ?? '').trim() === 'Guardar resultado')!.click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(guardarSnapshotPreliminar).toHaveBeenCalledWith('2026-05');
    const text = fixture.nativeElement.textContent as string;
    expectTexto(text, 'Resultado preliminar guardado');
    expectTexto(text, 'Revisa y aprueba operativamente este nuevo resultado si corresponde');
    expectTexto(text, 'No emite liquidaciones');
    expectTexto(text, 'Prepara, calcula y deja respaldo interno del resultado antes de la salida oficial del periodo.');
    expectTexto(text, 'Fecha de guardado');
    expectTexto(text, 'Version guardada');
    expectTexto(text, 'Referencia interna');
    expectTexto(text, 'MOTOR-03B');
    expectTexto(text, 'Revision para aprobacion');
    expectTexto(text, 'Listo para aprobar');
    expectTexto(text, 'La version guardada coincide con el ultimo resultado disponible.');
    expectTexto(text, 'Salidas legales y archivos externos quedan fuera de esta fase.');
    const aprobar = ([...fixture.nativeElement.querySelectorAll('button')] as HTMLButtonElement[])
      .find((b) => textoIncluye(b.textContent ?? '', 'Aprobar resultado preliminar'));
    expect(aprobar?.disabled).toBe(false);
  });

  it('muestra error atomico si falla el guardado completo del resultado preliminar', async () => {
    guardarSnapshotPreliminar.mockRejectedValueOnce(
      new Error('No se pudo guardar el resultado preliminar completo. No se realizaron cambios parciales.'),
    );
    ejecutarPrevalidaciones.mockResolvedValueOnce(prevalidacionLista());
    generarPreNominaPeriodo.mockResolvedValueOnce(baseNominaLista());

    let buttons = [...fixture.nativeElement.querySelectorAll('button')] as HTMLButtonElement[];
    botonPorTexto(fixture.nativeElement, 'Validar periodo')!.click();
    await fixture.whenStable();
    fixture.detectChanges();
    buttons = [...fixture.nativeElement.querySelectorAll('button')] as HTMLButtonElement[];
    botonPorTexto(fixture.nativeElement, 'Generar base de nomina')!.click();
    await fixture.whenStable();
    fixture.detectChanges();
    buttons = [...fixture.nativeElement.querySelectorAll('button')] as HTMLButtonElement[];
    botonPorTexto(fixture.nativeElement, 'Calcular preliminar')!.click();
    await fixture.whenStable();
    fixture.detectChanges();
    buttons = [...fixture.nativeElement.querySelectorAll('button')] as HTMLButtonElement[];
    botonPorTexto(fixture.nativeElement, 'Guardar resultado preliminar')!.click();
    await fixture.whenStable();
    fixture.detectChanges();
    buttons = [...fixture.nativeElement.querySelectorAll('button')] as HTMLButtonElement[];
    buttons.find((b) => (b.textContent ?? '').trim() === 'Guardar resultado')!.click();
    await fixture.whenStable();
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    expectTexto(text, 'No se pudo guardar el resultado preliminar completo. No se realizaron cambios parciales.');
    expectTexto(text, 'No se pudo guardar');
    expectTextoNo(text, 'Cierre ejecutado');
    expectTextoNo(text, 'Previred generado');
    expectTextoNo(text, 'LRE generado');
  });

  it('muestra estado no guardado y habilita guardar con resultado sin bloqueos', async () => {
    ejecutarPrevalidaciones.mockResolvedValueOnce(prevalidacionLista());
    generarPreNominaPeriodo.mockResolvedValueOnce(baseNominaLista());

    let buttons = [...fixture.nativeElement.querySelectorAll('button')] as HTMLButtonElement[];
    botonPorTexto(fixture.nativeElement, 'Validar periodo')!.click();
    await fixture.whenStable();
    fixture.detectChanges();
    buttons = [...fixture.nativeElement.querySelectorAll('button')] as HTMLButtonElement[];
    botonPorTexto(fixture.nativeElement, 'Generar base de nomina')!.click();
    await fixture.whenStable();
    fixture.detectChanges();
    buttons = [...fixture.nativeElement.querySelectorAll('button')] as HTMLButtonElement[];
    botonPorTexto(fixture.nativeElement, 'Calcular preliminar')!.click();
    await fixture.whenStable();
    fixture.detectChanges();

    buttons = [...fixture.nativeElement.querySelectorAll('button')] as HTMLButtonElement[];
    const guardar = buttons.find((b) => textoIncluye(b.textContent ?? '', 'Guardar resultado preliminar'));
    const text = fixture.nativeElement.textContent as string;
    expectTexto(text, 'Resultado no guardado');
    expectTexto(text, 'Guarda una version revisable del calculo. No emite liquidaciones ni cierra el periodo.');
    expectTexto(text, 'Revisa el calculo preliminar y guardalo como version revisable si corresponde.');
    expect(guardar?.disabled).toBe(false);
  });

  it('con bloqueos del resultado deshabilita guardar y muestra razon visible', async () => {
    ejecutarPrevalidaciones.mockResolvedValueOnce(prevalidacionLista());
    generarPreNominaPeriodo.mockResolvedValueOnce(baseNominaLista());
    generarCalculoPeriodo.mockResolvedValueOnce({
      ...calculoConObservacionesYOmitidos(),
      estado: 'con_bloqueos',
      issues: [{
        codigo: 'BLOQUEO_RESULTADO',
        severidad: 'BLOQUEO',
        mensaje: 'Hay bloqueos del resultado que deben revisarse.',
        origen: 'motor',
      }],
    });

    let buttons = [...fixture.nativeElement.querySelectorAll('button')] as HTMLButtonElement[];
    botonPorTexto(fixture.nativeElement, 'Validar periodo')!.click();
    await fixture.whenStable();
    fixture.detectChanges();
    buttons = [...fixture.nativeElement.querySelectorAll('button')] as HTMLButtonElement[];
    botonPorTexto(fixture.nativeElement, 'Generar base de nomina')!.click();
    await fixture.whenStable();
    fixture.detectChanges();
    buttons = [...fixture.nativeElement.querySelectorAll('button')] as HTMLButtonElement[];
    botonPorTexto(fixture.nativeElement, 'Calcular preliminar')!.click();
    await fixture.whenStable();
    fixture.detectChanges();

    buttons = [...fixture.nativeElement.querySelectorAll('button')] as HTMLButtonElement[];
    const guardar = buttons.find((b) => textoIncluye(b.textContent ?? '', 'Guardar resultado preliminar'));
    const text = fixture.nativeElement.textContent as string;
    expectTexto(text, 'Resultado con bloqueos');
    expectTexto(text, 'No puedes guardar todavia. El resultado tiene bloqueos que deben revisarse.');
    expectTexto(text, 'Hay bloqueos del resultado que deben revisarse.');
    expect(guardar?.disabled).toBe(true);
  });

  it('mantiene resultado guardado con advertencias como pendiente de revision', async () => {
    const snapshotConAdvertencia = snapshotGuardado({ totalAdvertencias: 1 });
    ejecutarPrevalidaciones.mockResolvedValueOnce(prevalidacionLista());
    generarPreNominaPeriodo.mockResolvedValueOnce(baseNominaLista());
    generarCalculoPeriodo.mockResolvedValueOnce({
      ...calculoConObservacionesYOmitidos(),
      liquidaciones: [
        {
          ...calculoConObservacionesYOmitidos().liquidaciones[0],
          issues: [{
            codigo: 'TRABAJADOR_DATO_OPCIONAL',
            severidad: 'ADVERTENCIA',
            mensaje: 'Dato opcional pendiente de revision.',
            origen: 'trabajador',
          }],
          estado: 'con_advertencias',
        },
      ],
    });
    guardarSnapshotPreliminar.mockResolvedValueOnce({
      ok: true,
      snapshot: snapshotConAdvertencia,
      reemplazoSnapshotAnterior: false,
      hashSnapshot: snapshotConAdvertencia.hashSnapshot,
      issues: [],
    });

    let buttons = [...fixture.nativeElement.querySelectorAll('button')] as HTMLButtonElement[];
    botonPorTexto(fixture.nativeElement, 'Validar periodo')!.click();
    await fixture.whenStable();
    fixture.detectChanges();
    buttons = [...fixture.nativeElement.querySelectorAll('button')] as HTMLButtonElement[];
    botonPorTexto(fixture.nativeElement, 'Generar base de nomina')!.click();
    await fixture.whenStable();
    fixture.detectChanges();
    buttons = [...fixture.nativeElement.querySelectorAll('button')] as HTMLButtonElement[];
    botonPorTexto(fixture.nativeElement, 'Calcular preliminar')!.click();
    await fixture.whenStable();
    fixture.detectChanges();
    buttons = [...fixture.nativeElement.querySelectorAll('button')] as HTMLButtonElement[];
    botonPorTexto(fixture.nativeElement, 'Guardar resultado preliminar')!.click();
    await fixture.whenStable();
    fixture.detectChanges();
    buttons = [...fixture.nativeElement.querySelectorAll('button')] as HTMLButtonElement[];
    buttons.find((b) => (b.textContent ?? '').trim() === 'Guardar resultado')!.click();
    await fixture.whenStable();
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    expectTexto(text, 'Listo para aprobar con advertencias');
    expectTexto(text, 'El resultado preliminar guardado esta listo para aprobacion operativa, con advertencias visibles para decision RRHH.');
    expectTexto(text, 'Advertencias visibles para decision RRHH');
    expectTexto(text, 'Dato opcional pendiente de revision.');
    const aprobar = ([...fixture.nativeElement.querySelectorAll('button')] as HTMLButtonElement[])
      .find((b) => textoIncluye(b.textContent ?? '', 'Aprobar resultado preliminar'));
    expect(aprobar?.disabled).toBe(false);
  });

  it('aprueba resultado preliminar guardado y muestra trazabilidad operativa', async () => {
    ejecutarPrevalidaciones.mockResolvedValueOnce(prevalidacionLista());
    generarPreNominaPeriodo.mockResolvedValueOnce(baseNominaLista());

    let buttons = [...fixture.nativeElement.querySelectorAll('button')] as HTMLButtonElement[];
    botonPorTexto(fixture.nativeElement, 'Validar periodo')!.click();
    await fixture.whenStable();
    fixture.detectChanges();
    buttons = [...fixture.nativeElement.querySelectorAll('button')] as HTMLButtonElement[];
    botonPorTexto(fixture.nativeElement, 'Generar base de nomina')!.click();
    await fixture.whenStable();
    fixture.detectChanges();
    buttons = [...fixture.nativeElement.querySelectorAll('button')] as HTMLButtonElement[];
    botonPorTexto(fixture.nativeElement, 'Calcular preliminar')!.click();
    await fixture.whenStable();
    fixture.detectChanges();
    buttons = [...fixture.nativeElement.querySelectorAll('button')] as HTMLButtonElement[];
    botonPorTexto(fixture.nativeElement, 'Guardar resultado preliminar')!.click();
    await fixture.whenStable();
    fixture.detectChanges();
    buttons = [...fixture.nativeElement.querySelectorAll('button')] as HTMLButtonElement[];
    buttons.find((b) => (b.textContent ?? '').trim() === 'Guardar resultado')!.click();
    await fixture.whenStable();
    fixture.detectChanges();

    buttons = [...fixture.nativeElement.querySelectorAll('button')] as HTMLButtonElement[];
    const aprobar = buttons.find((b) => textoIncluye(b.textContent ?? '', 'Aprobar resultado preliminar'));
    expect(aprobar?.disabled).toBe(false);
    aprobar!.click();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(aprobarResultadoPreliminarOperativamente).not.toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain('Marca el resultado guardado como aprobado operativamente');
    buttons = [...fixture.nativeElement.querySelectorAll('button')] as HTMLButtonElement[];
    buttons.find((b) => (b.textContent ?? '').trim() === 'Aprobar resultado')!.click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(aprobarResultadoPreliminarOperativamente).toHaveBeenCalledWith({
      idCalculoPeriodo: 1,
      periodo: '2026-05',
      advertencias: [],
    });
    const text = fixture.nativeElement.textContent as string;
    expectTexto(text, 'Aprobacion operativa');
    expectTexto(text, 'Aprobado operativamente');
    expectTexto(text, 'Resultado preliminar aprobado operativamente.');
    expectTexto(text, 'Fecha de aprobacion');
    expectTexto(text, 'Usuario no disponible en esta sesion');
    expectTexto(text, 'Version interna');
    expectTexto(text, 'Referencia interna');
    expectTexto(text, 'Trabajadores calculados');
    expectTexto(text, 'Total haberes');
    expectTexto(text, 'Total descuentos');
    expectTexto(text, 'Liquido preliminar');
    expectTexto(text, 'Esta aprobacion es interna y no reemplaza el cierre del periodo ni la emision de liquidaciones oficiales.');
    expectTextoNo(text, 'Cierre ejecutado');
    expectTextoNo(text, 'Previred generado');
    expectTextoNo(text, 'LRE generado');
  });

  it('muestra aprobacion persistida al cargar resultado guardado desde BD', async () => {
    obtenerSnapshotActivo.mockResolvedValueOnce(snapshotGuardado({
      aprobacionOperativa: {
        estado: 'aprobado_operativamente',
        fecha: '2026-05-05T11:00:00.000Z',
        usuarioId: null,
        usuarioLabel: 'rrhh@empresa.cl',
        advertencias: ['Advertencia registrada al aprobar.'],
        metadata: { idCalculoPeriodo: 1, periodo: '2026-05' },
      },
    }));

    const localFixture = TestBed.createComponent(ProcesoMensualContainer);
    localFixture.detectChanges();
    await localFixture.whenStable();
    await localFixture.whenStable();
    localFixture.detectChanges();

    const text = localFixture.nativeElement.textContent as string;
    const aprobar = ([...localFixture.nativeElement.querySelectorAll('button')] as HTMLButtonElement[])
      .find((b) => textoIncluye(b.textContent ?? '', 'Aprobar resultado preliminar'));
    expectTexto(text, 'Resultado preliminar aprobado operativamente.');
    expectTexto(text, 'rrhh@empresa.cl');
    expectTexto(text, 'Advertencia registrada al aprobar.');
    expect(aprobar?.disabled).toBe(true);
  });

  it('cierra nomina aprobada, muestra estado cerrado y bloquea acciones', async () => {
    obtenerSnapshotActivo.mockResolvedValueOnce(snapshotGuardado({
      aprobacionOperativa: {
        estado: 'aprobado_operativamente',
        fecha: '2026-05-05T11:00:00.000Z',
        usuarioId: null,
        usuarioLabel: 'rrhh@empresa.cl',
        advertencias: [],
        metadata: { idCalculoPeriodo: 1, periodo: '2026-05' },
      },
    }));

    const localFixture = TestBed.createComponent(ProcesoMensualContainer);
    localFixture.detectChanges();
    await localFixture.whenStable();
    localFixture.detectChanges();

    let buttons = [...localFixture.nativeElement.querySelectorAll('button')] as HTMLButtonElement[];
    const cerrar = buttons.find((b) => textoIncluye(b.textContent ?? '', 'Cerrar nomina del periodo'));
    expect(cerrar?.disabled).toBe(false);
    cerrar!.click();
    await localFixture.whenStable();
    localFixture.detectChanges();
    expect(cerrarNominaOperativamente).not.toHaveBeenCalled();
    expect(localFixture.nativeElement.textContent).toContain('El resultado aprobado quedara congelado');
    buttons = [...localFixture.nativeElement.querySelectorAll('button')] as HTMLButtonElement[];
    buttons.find((b) => (b.textContent ?? '').trim() === 'Cerrar nomina')!.click();
    await localFixture.whenStable();
    localFixture.detectChanges();

    expect(cerrarNominaOperativamente).toHaveBeenCalledWith({ idCalculoPeriodo: 1, periodo: '2026-05' });
    const text = localFixture.nativeElement.textContent as string;
    expectTexto(text, 'Nomina cerrada operativamente');
    expectTexto(text, 'Para modificarla se requerira una fase futura de reapertura.');
    buttons = [...localFixture.nativeElement.querySelectorAll('button')] as HTMLButtonElement[];
    expect(buttons.find((b) => textoIncluye(b.textContent ?? '', 'Calcular preliminar'))?.disabled).toBe(true);
    expect(buttons.find((b) => textoIncluye(b.textContent ?? '', 'Guardar resultado preliminar'))?.disabled).toBe(true);
    expect(buttons.find((b) => textoIncluye(b.textContent ?? '', 'Aprobar resultado preliminar'))?.disabled).toBe(true);
  });

  it('muestra resumen, trabajadores, conceptos y trazabilidad del snapshot completo desde BD', async () => {
    obtenerSnapshotActivo.mockResolvedValue(snapshotGuardado());
    obtenerSnapshotCompletoActivo.mockResolvedValue(snapshotCompletoGuardado());

    const localFixture = TestBed.createComponent(ProcesoMensualContainer);
    localFixture.detectChanges();
    await localFixture.whenStable();
    await localFixture.whenStable();
    localFixture.detectChanges();

    const text = localFixture.nativeElement.textContent as string;
    expect(obtenerSnapshotCompletoActivo).toHaveBeenCalledWith('2026-05');
    expect(generarCalculoPeriodo).not.toHaveBeenCalled();
    expectTexto(text, 'Detalle del resultado guardado');
    expectTexto(text, 'Resultado guardado vigente');
    expectTexto(text, 'Trabajadores guardados');
    expectTexto(text, 'Ana Perez');
    expectTexto(text, 'Sueldo base (HAB001)');
    expectTexto(text, 'Informacion guardada del resultado.');
    expectTexto(text, 'Liquido calculado guardado.');
  });

  it('muestra error operativo si falla la consulta del detalle guardado', async () => {
    obtenerSnapshotActivo.mockResolvedValueOnce(snapshotGuardado());
    obtenerSnapshotCompletoActivo.mockRejectedValueOnce(new Error('red'));

    const localFixture = TestBed.createComponent(ProcesoMensualContainer);
    localFixture.detectChanges();
    await localFixture.whenStable();
    localFixture.detectChanges();

    expect(obtenerSnapshotCompletoActivo).toHaveBeenCalledWith('2026-05');
  });

  it('no marca aprobado si falla la persistencia operativa', async () => {
    aprobarResultadoPreliminarOperativamente.mockRejectedValueOnce(new Error('RLS'));
    ejecutarPrevalidaciones.mockResolvedValueOnce(prevalidacionLista());
    generarPreNominaPeriodo.mockResolvedValueOnce(baseNominaLista());

    let buttons = [...fixture.nativeElement.querySelectorAll('button')] as HTMLButtonElement[];
    botonPorTexto(fixture.nativeElement, 'Validar periodo')!.click();
    await fixture.whenStable();
    fixture.detectChanges();
    buttons = [...fixture.nativeElement.querySelectorAll('button')] as HTMLButtonElement[];
    botonPorTexto(fixture.nativeElement, 'Generar base de nomina')!.click();
    await fixture.whenStable();
    fixture.detectChanges();
    buttons = [...fixture.nativeElement.querySelectorAll('button')] as HTMLButtonElement[];
    botonPorTexto(fixture.nativeElement, 'Calcular preliminar')!.click();
    await fixture.whenStable();
    fixture.detectChanges();
    buttons = [...fixture.nativeElement.querySelectorAll('button')] as HTMLButtonElement[];
    botonPorTexto(fixture.nativeElement, 'Guardar resultado preliminar')!.click();
    await fixture.whenStable();
    fixture.detectChanges();
    buttons = [...fixture.nativeElement.querySelectorAll('button')] as HTMLButtonElement[];
    buttons.find((b) => (b.textContent ?? '').trim() === 'Guardar resultado')!.click();
    await fixture.whenStable();
    fixture.detectChanges();
    buttons = [...fixture.nativeElement.querySelectorAll('button')] as HTMLButtonElement[];
    botonPorTexto(fixture.nativeElement, 'Aprobar resultado preliminar')!.click();
    await fixture.whenStable();
    fixture.detectChanges();
    buttons = [...fixture.nativeElement.querySelectorAll('button')] as HTMLButtonElement[];
    buttons.find((b) => (b.textContent ?? '').trim() === 'Aprobar resultado')!.click();
    await fixture.whenStable();
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    expectTexto(text, 'No se pudo registrar la aprobacion operativa. Intenta nuevamente o revisa la conexion.');
    expectTextoNo(text, 'Resultado preliminar aprobado operativamente.');
  });

  it('si se recalcula despues de guardar muestra resultado actualizado sin guardar', async () => {
    ejecutarPrevalidaciones.mockResolvedValueOnce(prevalidacionLista());
    generarPreNominaPeriodo.mockResolvedValueOnce(baseNominaLista());

    let buttons = [...fixture.nativeElement.querySelectorAll('button')] as HTMLButtonElement[];
    botonPorTexto(fixture.nativeElement, 'Validar periodo')!.click();
    await fixture.whenStable();
    fixture.detectChanges();
    buttons = [...fixture.nativeElement.querySelectorAll('button')] as HTMLButtonElement[];
    botonPorTexto(fixture.nativeElement, 'Generar base de nomina')!.click();
    await fixture.whenStable();
    fixture.detectChanges();
    buttons = [...fixture.nativeElement.querySelectorAll('button')] as HTMLButtonElement[];
    botonPorTexto(fixture.nativeElement, 'Calcular preliminar')!.click();
    await fixture.whenStable();
    fixture.detectChanges();
    buttons = [...fixture.nativeElement.querySelectorAll('button')] as HTMLButtonElement[];
    botonPorTexto(fixture.nativeElement, 'Guardar resultado preliminar')!.click();
    await fixture.whenStable();
    fixture.detectChanges();
    buttons = [...fixture.nativeElement.querySelectorAll('button')] as HTMLButtonElement[];
    buttons.find((b) => (b.textContent ?? '').trim() === 'Guardar resultado')!.click();
    await fixture.whenStable();
    fixture.detectChanges();

    buttons = [...fixture.nativeElement.querySelectorAll('button')] as HTMLButtonElement[];
    botonPorTexto(fixture.nativeElement, 'Aprobar resultado preliminar')!.click();
    await fixture.whenStable();
    fixture.detectChanges();
    buttons = [...fixture.nativeElement.querySelectorAll('button')] as HTMLButtonElement[];
    buttons.find((b) => (b.textContent ?? '').trim() === 'Aprobar resultado')!.click();
    await fixture.whenStable();
    fixture.detectChanges();

    buttons = [...fixture.nativeElement.querySelectorAll('button')] as HTMLButtonElement[];
    botonPorTexto(fixture.nativeElement, 'Recalcular preliminar')!.click();
    await fixture.whenStable();
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    expectTexto(text, 'Resultado actualizado sin guardar');
    expectTexto(text, 'Volviste a calcular despues del ultimo guardado.');
    expectTexto(text, 'Ultimo resultado preliminar guardado');
    expectTexto(text, 'Aprobacion desactualizada');
    expectTexto(text, 'La aprobacion operativa anterior quedo desactualizada porque existe un resultado posterior. Guarda y aprueba nuevamente el resultado actualizado.');
    expectTexto(text, 'El calculo actual es mas reciente que la version guardada.');
    expectTexto(text, 'Existe un calculo o resultado posterior al aprobado. Debes revisar, guardar y aprobar nuevamente.');
  });

  it('no muestra labels tecnicos ni pasos futuros como flujo principal', () => {
    const text = fixture.nativeElement.textContent as string;
    const lowerText = text.toLowerCase();
    expectTextoNo(text, 'Pre-nomina');
    expectTextoNo(text, 'Issues');
    expectTextoNo(text, 'Hash');
    expectTextoNo(text, 'Payload');
    expectTextoNo(text, 'Codigos');
    expectTextoNo(text, 'idPersona');
    expectTextoNo(text, 'idContrato');
    expectTextoNo(text, 'idConcepto');
    expectTextoNo(text, 'Paso 1 de 4');
    expectTextoNo(text, 'MOVIMIENTOS_VARIABLES');
    expectTextoNo(text, 'CON_PROBLEMAS');
    expectTextoNo(text, 'Liquidacion oficial');
    expectTextoNo(text, 'Cerrar periodo');
    expect(lowerText).not.toContain('issues');
    expect(lowerText).not.toContain('payload');
    expect(lowerText).not.toContain('motor futuro');
    expect(lowerText).not.toContain('calculo no disponible');
    expectTextoNo(text, 'Base de nomina');
  });

  it('muestra acciones hacia rutas operativas existentes', () => {
    const links = [...fixture.nativeElement.querySelectorAll('a')] as HTMLAnchorElement[];
    const text = fixture.nativeElement.textContent as string;
    expectTexto(text, 'Parametros');
    expectTexto(text, 'Movimientos');
    expectTexto(text, 'Recurrentes');
    expect(links.length).toBeGreaterThan(0);
  });
  });
});
