import { importProvidersFrom } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import {
  AlertCircle,
  Calculator,
  Check,
  CheckCircle,
  ChevronRight,
  Circle,
  CircleAlert,
  CircleDot,
  Home,
  Minus,
  FileCheck2,
  FileSpreadsheet,
  FileText,
  Info,
  ListChecks,
  Lock,
  Receipt,
  Repeat,
  RefreshCw,
  Sliders,
  Upload,
  Users,
} from 'lucide-angular/src/icons';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { PeriodoActivoService } from '../../../../core/services/periodo-activo.service';
import type { ProcesoMensualPrevalidacion } from '../../models/proceso-mensual.model';
import type { EntradaMensualPeriodo } from '../../entradas/models/entrada-mensual-periodo.model';
import type { NominaMasivaFiltro } from '../../rules/proceso-mensual-masivo-layout.rules';
import { ProcesoMensualService } from '../../services/proceso-mensual.service';
import { ProcesoMensualContainer } from './proceso-mensual-container';
import {
  PERIODO_TEST,
  avanzarFlujo,
  botonPorTexto,
  confirmarOverlayDecision,
  esperarRehidratacion,
  esperarSnapshotActivo,
  expectTexto,
  expectTextoNo,
  fijarPeriodoActivo,
  invocarCtaShell,
  montarContainer,
  provideNominaMensualCapabilitiesMock,
  storeDe,
  textoIncluye,
} from './proceso-mensual-container.spec.helpers';
import { ShellPageContextService } from '../../../../layout/shell-page-context.service';

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
    trabajadoresPendientesRevision: [],
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

function entradaMensualAprobada(overrides: Partial<EntradaMensualPeriodo> = {}): EntradaMensualPeriodo {
  return {
    idEntrada: 'novedad:1',
    origen: 'novedad_mensual',
    origenId: 1,
    periodo: '2026-05',
    idPersona: 1,
    idContrato: 10,
    idConcepto: 1,
    tipoEntrada: 'haber',
    categoria: 'haber_variable',
    tipoMovimiento: 'haber',
    cantidad: null,
    unidad: null,
    monto: 1000,
    moneda: 'CLP',
    estado: 'aprobada',
    fechaEvento: null,
    observacion: null,
    referenciaExterna: null,
    requiereRevision: false,
    bloqueaProceso: false,
    warnings: [],
    metadata: {},
    ...overrides,
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
  const guardarBaseNominaBorrador = vi.fn();
  const guardarSnapshotPreliminar = vi.fn();
  const reemplazarSnapshotPreliminar = vi.fn();
  const aprobarResultadoPreliminarOperativamente = vi.fn();
  const cerrarNominaOperativamente = vi.fn();
  const obtenerResultadoCalculoPeriodo = vi.fn();
  const obtenerSnapshotActivo = vi.fn();
  const obtenerSnapshotCompletoActivo = vi.fn();
  const obtenerSnapshotCompletoPorId = vi.fn();
  const rehidratarPeriodo = vi.fn();

  beforeEach(async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    ejecutarPrevalidaciones.mockReset();
    generarPreNominaPeriodo.mockReset();
    generarCalculoPeriodo.mockReset();
    guardarBaseNominaBorrador.mockReset();
    guardarSnapshotPreliminar.mockReset();
    reemplazarSnapshotPreliminar.mockReset();
    aprobarResultadoPreliminarOperativamente.mockReset();
    cerrarNominaOperativamente.mockReset();
    obtenerResultadoCalculoPeriodo.mockReset();
    obtenerSnapshotActivo.mockReset();
    obtenerSnapshotCompletoActivo.mockReset();
    obtenerSnapshotCompletoPorId.mockReset();
    rehidratarPeriodo.mockReset();
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
      trabajadoresPendientesRevision: [],
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
    guardarBaseNominaBorrador.mockResolvedValue({
      ok: true,
      snapshot: snapshotGuardado({
        idCalculoPeriodo: 77,
        estado: 'borrador',
        totalHaberes: 0,
        totalDescuentos: 0,
        totalLiquido: 0,
        hashSnapshot: null,
      }),
      reemplazoSnapshotAnterior: false,
      hashSnapshot: null,
      issues: [],
    });
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
        provideNominaMensualCapabilitiesMock(),
        {
          provide: ProcesoMensualService,
          useValue: {
            ejecutarPrevalidaciones,
            generarPreNominaPeriodo,
            generarCalculoPeriodo,
            guardarBaseNominaBorrador,
            guardarSnapshotPreliminar,
            reemplazarSnapshotPreliminar,
            aprobarResultadoPreliminarOperativamente,
            cerrarNominaOperativamente,
            obtenerResultadoCalculoPeriodo,
            obtenerSnapshotActivo,
            obtenerSnapshotCompletoActivo,
            obtenerSnapshotCompletoPorId,
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
            Circle,
            CircleAlert,
            CircleDot,
            Home,
            Minus,
            FileCheck2,
            FileSpreadsheet,
            FileText,
            Info,
            ListChecks,
            Lock,
            Receipt,
            Repeat,
            RefreshCw,
            Sliders,
            Upload,
            Users,
          }),
        ),
      ],
    }).compileComponents();

    fijarPeriodoActivo();
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

    it('renderiza workspace con focus operativo pulido', () => {
      expect(fixture.nativeElement.querySelector('.payroll-console')).toBeTruthy();
      expect(fixture.nativeElement.querySelector('.payroll-focus--operativo')).toBeTruthy();
      expect(fixture.nativeElement.querySelector('.payroll-focus--prototype')).toBeNull();
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

    it('tras validacion exitosa abre modal de revision del periodo', async () => {
      ejecutarPrevalidaciones.mockResolvedValueOnce(prevalidacionLista());
      const c = fixture.componentInstance;
      c.validarPeriodo();
      await fixture.whenStable();
      fixture.detectChanges();

      expect(c.overlay().kind).toBe('informacion');
      expect(c.informacionPeriodo()?.titulo).toBe('Período listo para generar');
      expect(fixture.nativeElement.querySelector('.payroll-verificacion-periodo-modal')).toBeTruthy();
    });

    it('tras verificar con trabajadores pendientes lista nominal y navega a ficha', async () => {
      ejecutarPrevalidaciones.mockResolvedValueOnce(
        prevalidacionLista({
          estado: 'CON_ADVERTENCIAS',
          resumen: {
            periodo: '2026-05',
            hayBloqueos: false,
            hayAdvertencias: true,
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
            trabajadoresActivosAptos: 1,
            trabajadoresActivosNoAptos: 1,
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
          advertencias: [
            {
              codigo: 'EMPLEADOS_ACTIVOS_NO_APTOS',
              area: 'TRABAJADORES',
              severidad: 'ADVERTENCIA',
              texto: 'Hay trabajadores activos con ficha pendiente.',
            },
          ],
          trabajadoresPendientesRevision: [
            {
              idPersona: 7,
              nombre: 'María López',
              rut: '12.345.678-9',
              motivo: 'Ficha incompleta',
              detalleCorreccion: 'Revisar datos personales, contrato, remuneración, previsión y pago.',
              estadoFicha: 'INCOMPLETO',
              aptoParaRemuneraciones: false,
            },
          ],
        }),
      );
      const c = fixture.componentInstance;
      const router = TestBed.inject(Router);
      const navigateSpy = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);

      c.validarPeriodo();
      await fixture.whenStable();
      fixture.detectChanges();

      expect(c.overlay().kind).toBe('informacion');
      expect(c.informacionPeriodo()?.trabajadoresPendientes?.[0]?.nombre).toBe('María López');
      expect(c.informacionPeriodo()?.bajada).toContain('1 trabajador');
      expect(c.informacionPeriodo()?.resumenVerificacion?.trabajadoresPendientes).toBe(1);
      expect(fixture.nativeElement.textContent).toContain('Fichas por corregir');
      expect(fixture.nativeElement.textContent).toContain('Trabajadores a corregir');
      const irCorregir = fixture.nativeElement.querySelector(
        '.payroll-verificacion-periodo-modal__accion-fila',
      ) as HTMLButtonElement | null;
      expect(irCorregir?.textContent?.trim()).toBe('Ir a corregir');
      irCorregir?.click();
      fixture.detectChanges();
      expect(navigateSpy).toHaveBeenCalledWith('/empleados/7');
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
      expect(fixture.nativeElement.querySelector('.payroll-verificacion-periodo-modal')).toBeTruthy();
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
      expect(c.overlay().kind).toBe('cerrado');
      expect(c.nominaWorkspaceTabVisible()).toBe('detalle_mensual');
      expect(c.nominaDetalleMensualVista()).toBe('pendientes');
    });

    it('abrirDetalleOperativo trabajadores abre panel sin modal revision', () => {
      const c = fixture.componentInstance;
      c.abrirDetalleOperativo('trabajadores');
      expect(c.detalleOperativoAbierto()).toBe(false);
      expect(c.nominaWorkspaceTabVisible()).toBe('detalle_mensual');
      expect(c.nominaDetalleMensualVista()).toBe('trabajadores');
    });

    it('mostrarResumenAmpliadoEnRail solo con base generada y vista trabajadores', async () => {
      const c = fixture.componentInstance;
      c.seleccionarNominaDetalleMensualVista('trabajadores');
      expect(c.mostrarResumenAmpliadoEnRail()).toBe(false);

      generarPreNominaPeriodo.mockResolvedValueOnce(baseNominaLista());
      c.generarPreNomina();
      await fixture.whenStable();
      fixture.detectChanges();
      expect(c.contextoOperativoPeriodo().baseGenerada).toBe(true);
      expect(c.mostrarResumenAmpliadoEnRail()).toBe(true);

      c.seleccionarNominaDetalleMensualVista('pendientes');
      expect(c.mostrarResumenAmpliadoEnRail()).toBe(false);
    });

    it('seleccionarRevisionDesdeModal trabajadores cierra modal y abre panel', () => {
      const c = fixture.componentInstance;
      c.abrirDetalleOperativo('resumen');
      expect(c.detalleOperativoAbierto()).toBe(true);
      c.seleccionarRevisionDesdeModal('trabajadores');
      expect(c.detalleOperativoAbierto()).toBe(false);
      expect(c.nominaDetalleMensualVista()).toBe('trabajadores');
    });

    it('abrirDetalleExpedienteRow con idPersona preselecciona en revision masiva', () => {
      const c = fixture.componentInstance;
      c.abrirDetalleExpedienteRow({
        estado: 'Revisar',
        ambito: 'Trabajador',
        trabajador: 'Ana Soto',
        conceptoSituacion: 'Observación',
        origenDuracion: '—',
        vigencia: 'Período activo',
        monto: '—',
        accion: 'Revisar',
        severity: 'atencion',
        detalleTab: 'trabajadores',
        idPersona: 99,
      });
      expect(c.nominaMasivaTrabajadorSeleccionadoId()).toBe(99);
      expect(c.nominaDetalleMensualVista()).toBe('trabajadores');
      expect(c.detalleOperativoAbierto()).toBe(false);
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

    it('confirmar overlay guardar resultado llama guardarSnapshotPreliminar', async () => {
      ejecutarPrevalidaciones.mockResolvedValueOnce(prevalidacionLista());
      generarPreNominaPeriodo.mockResolvedValueOnce(baseNominaLista());
      const localFixture = await montarContainer();
      await avanzarFlujo(localFixture, 'calculo');
      localFixture.componentInstance.guardarSnapshotPreliminar();
      localFixture.detectChanges();
      expect(localFixture.componentInstance.overlay().kind).toBe('decision');
      await confirmarOverlayDecision(localFixture);
      expect(guardarSnapshotPreliminar).toHaveBeenCalledWith(PERIODO_TEST);
    });

    it('prepararActaOperativaPeriodo abre overlay decision', async () => {
      ejecutarPrevalidaciones.mockResolvedValueOnce(prevalidacionLista());
      const localFixture = await montarContainer();
      await avanzarFlujo(localFixture, 'prevalidado');
      localFixture.componentInstance.prepararActaOperativaPeriodo();
      localFixture.detectChanges();
      expect(localFixture.componentInstance.overlay().kind).toBe('decision');
      expectTexto(localFixture.nativeElement.textContent as string, 'Preparar acta operativa del periodo');
    });
  });

  describe('rehidratacion periodo (NOM-MENSUAL-PERSISTENCIA-ESTADO-01)', () => {
    it('con snapshot activo al montar no queda en sin_generar', async () => {
      obtenerSnapshotActivo.mockResolvedValue(snapshotGuardado());
      obtenerSnapshotCompletoActivo.mockResolvedValue(snapshotCompletoGuardado());
      const localFixture = await montarContainer();
      await esperarSnapshotActivo(localFixture);

      const c = localFixture.componentInstance;
      expect(rehidratarPeriodo).toHaveBeenCalled();
      expect(c.snapshotActivo()).not.toBeNull();
      expect(c.nominaVisualFrame()).not.toBe('sin_generar');
      expect(c.estadoOperativo().estadoClave).not.toBe('pendiente_validacion');
    });

    it('snapshot cerrado resuelve nomina_cerrada tras rehidratar', async () => {
      obtenerSnapshotActivo.mockResolvedValue(
        snapshotGuardado({
          cierreOperativo: {
            estado: 'cerrado_operativamente',
            fecha: '2026-05-06T10:00:00.000Z',
            usuarioId: null,
            usuarioLabel: 'RRHH',
            observacion: null,
            metadata: {},
          },
        }),
      );
      obtenerSnapshotCompletoActivo.mockResolvedValue(snapshotCompletoGuardado());
      const localFixture = await montarContainer();
      await esperarSnapshotActivo(localFixture);

      expect(localFixture.componentInstance.estadoOperativo().estadoClave).toBe('nomina_cerrada');
      expect(localFixture.componentInstance.nominaVisualFrame()).toBe('confirmada');
    });

    it('sin snapshot mantiene pendiente_validacion', async () => {
      obtenerSnapshotActivo.mockResolvedValue(null);
      obtenerSnapshotCompletoActivo.mockResolvedValue(null);
      const localFixture = await montarContainer();
      await esperarRehidratacion(localFixture);

      const c = localFixture.componentInstance;
      expect(c.snapshotActivo()).toBeNull();
      expect(c.estadoOperativo().estadoClave).toBe('pendiente_validacion');
      expect(c.nominaVisualFrame()).toBe('sin_generar');
    });

    it('muestra detalle oficial y trabajadores tras snapshot completo desde BD', async () => {
      obtenerSnapshotActivo.mockResolvedValue(
        snapshotGuardado({
          cierreOperativo: {
            estado: 'cerrado_operativamente',
            fecha: '2026-05-06T10:00:00.000Z',
            usuarioId: null,
            usuarioLabel: 'RRHH',
            observacion: null,
            metadata: {},
          },
        }),
      );
      obtenerSnapshotCompletoActivo.mockResolvedValue(snapshotCompletoGuardado());
      const localFixture = await montarContainer();
      await esperarSnapshotActivo(localFixture);

      expect(obtenerSnapshotCompletoActivo).toHaveBeenCalledWith(PERIODO_TEST);
      expect(generarCalculoPeriodo).not.toHaveBeenCalled();
      localFixture.componentInstance.seleccionarNominaWorkspaceTab('trabajadores');
      localFixture.detectChanges();

      const text = localFixture.nativeElement.textContent as string;
      const c = localFixture.componentInstance;
      expectTexto(text, 'Ana Perez');
      expect(c.snapshotCompleto()?.trabajadores[0]?.nombreCompletoSnapshot).toBe('Ana Perez');
    });

    it('abrir revision tras rehidratar muestra trabajador en modal', async () => {
      obtenerSnapshotActivo.mockResolvedValue(snapshotGuardado());
      obtenerSnapshotCompletoActivo.mockResolvedValue(snapshotCompletoGuardado());
      const localFixture = await montarContainer();
      await esperarSnapshotActivo(localFixture);

      localFixture.componentInstance.abrirOverlayRevision('trabajadores');
      localFixture.detectChanges();

      expect(obtenerSnapshotCompletoActivo).toHaveBeenCalled();
      expectTexto(localFixture.nativeElement.textContent as string, 'Ana Perez');
    });

    it('aprobacion persistida deshabilita aprobar de nuevo', async () => {
      obtenerSnapshotActivo.mockResolvedValue(
        snapshotGuardado({
          aprobacionOperativa: {
            estado: 'aprobado_operativamente',
            fecha: '2026-05-05T11:00:00.000Z',
            usuarioId: null,
            usuarioLabel: 'rrhh@empresa.cl',
            advertencias: [],
            metadata: { idCalculoPeriodo: 1, periodo: PERIODO_TEST },
          },
        }),
      );
      obtenerSnapshotCompletoActivo.mockResolvedValue(snapshotCompletoGuardado());
      const localFixture = await montarContainer();
      await esperarSnapshotActivo(localFixture);

      const c = localFixture.componentInstance;
      expect(c.snapshotActivo()?.aprobacionOperativa?.usuarioLabel).toBe('rrhh@empresa.cl');
      expect(c.revisionAprobacion().puedeAprobar).toBe(false);
    });
  });

  describe('shell y workspace (NOM-CONTAINER-SPEC-REPARO)', () => {
    it('muestra lead operativo sin cabecera duplicada de pagina', () => {
      const text = fixture.nativeElement.textContent as string;
      expect(fixture.nativeElement.querySelector('.payroll-head')).toBeNull();
      expectTexto(text, 'Generar nomina');
    });

    it('no muestra selector de periodo local editable en la pagina', () => {
      const input = fixture.nativeElement.querySelector('input[type="month"]');
      expect(input).toBeNull();
    });

    it('renderiza workspace con sidebar operativo y tabbar visible', () => {
      const el = fixture.nativeElement;
      expect(el.querySelector('.payroll-console')).toBeTruthy();
      expect(el.querySelector('.payroll-franja-operativa')).toBeTruthy();
      expect(el.querySelector('.payroll-workspace-sidebar')).toBeTruthy();
      expect(el.querySelectorAll('.payroll-operational-tabs button').length).toBe(2);
      expectTexto(el.textContent as string, 'Detalle mensual');
      expectTexto(el.textContent as string, 'Historial');
    });

    it('bitacora en tab resumen usa etiquetas del flujo mensual', () => {
      fixture.componentInstance.seleccionarNominaWorkspaceTab('resumen');
      fixture.detectChanges();
      const text = fixture.nativeElement.textContent as string;
      expectTexto(text, 'Generar nomina');
      expectTexto(text, 'Revisar trabajadores');
      expectTexto(text, 'Confirmar nomina');
      expectTexto(text, 'Generar liquidaciones');
    });

    it('estado inicial muestra focus sin_generar y CTA verificar periodo', () => {
      const c = fixture.componentInstance;
      expect(c.nominaVisualFrame()).toBe('sin_generar');
      expectTexto(c.estadoOperativo().accionPrincipal.label, 'Verificar período');
    });

    it('no muestra labels tecnicos en copy visible del shell', () => {
      const text = fixture.nativeElement.textContent as string;
      const lowerText = text.toLowerCase();
      expectTextoNo(text, 'Pre-nomina');
      expectTextoNo(text, 'Payload');
      expect(lowerText).not.toContain('idpersona');
    });

    it('modal detalle no expone bloque tecnico interno', () => {
      fixture.componentInstance.abrirOverlayRevision('resumen');
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.payroll-operational-internal')).toBeNull();
      const text = (fixture.nativeElement.textContent as string).toLowerCase();
      expect(text).not.toContain('versioncalculo');
    });
  });

  describe('flujo periodo integracion (NOM-CONTAINER-SPEC-REPARO)', () => {
    it('validarPeriodo llama ejecutarPrevalidaciones', async () => {
      const localFixture = await montarContainer();
      localFixture.componentInstance.validarPeriodo();
      await localFixture.whenStable();
      expect(ejecutarPrevalidaciones).toHaveBeenCalledWith(PERIODO_TEST);
    });

    it('tras prevalidacion apta deja resultado en store', async () => {
      ejecutarPrevalidaciones.mockResolvedValueOnce(prevalidacionLista());
      const localFixture = await montarContainer();
      await avanzarFlujo(localFixture, 'prevalidado');
      expect(localFixture.componentInstance.resultado()).not.toBeNull();
      expect(localFixture.componentInstance.contextoOperativoPeriodo().tienePrevalidacion).toBe(true);
    });

    it('generarPreNomina llama servicio tras validar', async () => {
      ejecutarPrevalidaciones.mockResolvedValueOnce(prevalidacionLista());
      const localFixture = await montarContainer();
      await avanzarFlujo(localFixture, 'base');
      expect(generarPreNominaPeriodo).toHaveBeenCalledWith(PERIODO_TEST);
      expect(localFixture.componentInstance.preNomina()).not.toBeNull();
    });

    it('generarPreNomina sin advertencias persiste base borrador', async () => {
      ejecutarPrevalidaciones.mockResolvedValueOnce(prevalidacionLista());
      generarPreNominaPeriodo.mockResolvedValueOnce(baseNominaLista());
      const localFixture = await montarContainer();
      await avanzarFlujo(localFixture, 'base');
      await vi.waitFor(() => expect(guardarBaseNominaBorrador).toHaveBeenCalled());

      expect(localFixture.componentInstance.snapshotActivo()?.estado).toBe('borrador');
      expect(localFixture.componentInstance.contextoOperativoPeriodo().baseGenerada).toBe(true);
      expect(localFixture.componentInstance.contextoOperativoPeriodo().resultadoGuardado).toBe(false);
    });

    it('rehidrata borrador como base_lista y no vuelve a pedir generar nomina', async () => {
      obtenerSnapshotActivo.mockResolvedValue(snapshotGuardado({
        idCalculoPeriodo: 77,
        estado: 'borrador',
        totalHaberes: 0,
        totalDescuentos: 0,
        totalLiquido: 0,
        hashSnapshot: null,
      }));
      obtenerSnapshotCompletoActivo.mockResolvedValue(null);
      const localFixture = await montarContainer();
      await esperarSnapshotActivo(localFixture);

      expect(localFixture.componentInstance.estadoOperativo().estadoClave).toBe('base_lista');
      expect(localFixture.componentInstance.estadoOperativo().accionPrincipal.label).toBe('Revisar trabajadores');
      expect(localFixture.componentInstance.estadoOperativo().accionPrincipal.label).not.toBe('Generar nómina');
    });

    it('generarPreNomina con advertencias persiste borrador y permite guardar base revisada', async () => {
      ejecutarPrevalidaciones.mockResolvedValueOnce(prevalidacionLista({
        estado: 'CON_ADVERTENCIAS',
        resumen: {
          ...prevalidacionLista().resumen,
          hayAdvertencias: true,
        },
        advertencias: [{
          codigo: 'ADV_MOV',
          area: 'ENTRADAS_MENSUALES',
          severidad: 'ADVERTENCIA',
          texto: 'Hay movimientos por revisar.',
        }],
      }));
      generarPreNominaPeriodo.mockResolvedValueOnce({
        ...baseNominaLista(),
        estado: 'GENERADA_CON_ADVERTENCIAS',
        codigosAdvertencia: ['ADV_MOV'],
      });
      const localFixture = await montarContainer();
      await avanzarFlujo(localFixture, 'base');

      await vi.waitFor(() => expect(guardarBaseNominaBorrador).toHaveBeenCalled());
      expect(localFixture.componentInstance.snapshotActivo()?.estado).toBe('borrador');
      expect(localFixture.componentInstance.puedeGuardarBaseNominaRevisada()).toBe(false);
    });

    it('calcularPreliminar llama servicio tras base', async () => {
      ejecutarPrevalidaciones.mockResolvedValueOnce(prevalidacionLista());
      generarPreNominaPeriodo.mockResolvedValueOnce(baseNominaLista());
      const localFixture = await montarContainer();
      await avanzarFlujo(localFixture, 'calculo');
      expect(generarCalculoPeriodo).toHaveBeenCalledWith(PERIODO_TEST);
      expect(localFixture.componentInstance.calculo()).not.toBeNull();
    });

    it('guardarSnapshot llama servicio tras calculo', async () => {
      ejecutarPrevalidaciones.mockResolvedValueOnce(prevalidacionLista());
      generarPreNominaPeriodo.mockResolvedValueOnce(baseNominaLista());
      const localFixture = await montarContainer();
      await avanzarFlujo(localFixture, 'guardado');
      expect(guardarSnapshotPreliminar).toHaveBeenCalledWith(PERIODO_TEST);
      expect(localFixture.componentInstance.snapshotActivo()).not.toBeNull();
    });

    it('con bloqueos de prevalidacion muestra frame con_pendientes', async () => {
      const localFixture = await montarContainer();
      await avanzarFlujo(localFixture, 'prevalidado');
      expect(localFixture.componentInstance.nominaVisualFrame()).toBe('con_pendientes');
    });

    it('aprobarResultado llama servicio tras guardar', async () => {
      ejecutarPrevalidaciones.mockResolvedValueOnce(prevalidacionLista());
      generarPreNominaPeriodo.mockResolvedValueOnce(baseNominaLista());
      const localFixture = await montarContainer();
      await avanzarFlujo(localFixture, 'aprobado');
      expect(aprobarResultadoPreliminarOperativamente).toHaveBeenCalled();
    });

    it('muestra acciones del periodo cuando hay snapshot sin liquidaciones', async () => {
      obtenerSnapshotActivo.mockResolvedValue(snapshotGuardado());
      obtenerSnapshotCompletoActivo.mockResolvedValue(snapshotCompletoGuardado());
      const localFixture = await montarContainer();
      await esperarSnapshotActivo(localFixture);

      localFixture.detectChanges();
      const texto = localFixture.nativeElement.textContent as string;
      expect(texto).toContain('Acciones del período');
      expect(texto).toContain('Descartar nómina generada');
      expect(texto).not.toContain('Forzar eliminación');
    });

    it('falla aprobacion muestra error sin marcar aprobado en copy', async () => {
      aprobarResultadoPreliminarOperativamente.mockRejectedValueOnce(new Error('RLS'));
      ejecutarPrevalidaciones.mockResolvedValueOnce(prevalidacionLista());
      generarPreNominaPeriodo.mockResolvedValueOnce(baseNominaLista());
      const localFixture = await montarContainer();
      await avanzarFlujo(localFixture, 'guardado');
      storeDe(localFixture).ejecutarAprobacionOperativa([]);
      await localFixture.whenStable();
      localFixture.detectChanges();
      expect(localFixture.componentInstance.errorAprobacionOperativa()).toContain(
        'No se pudo registrar la aprobacion operativa',
      );
    });
  });

  describe('flujo completo RRHH (integración)', () => {
    it('cadena feliz: verificar → generar → calcular → guardar → aprobar invoca servicios en orden', async () => {
      ejecutarPrevalidaciones.mockResolvedValue(prevalidacionLista());
      generarPreNominaPeriodo.mockResolvedValue(baseNominaLista());
      generarCalculoPeriodo.mockResolvedValue(calculoConObservacionesYOmitidos());
      const localFixture = await montarContainer();
      const c = localFixture.componentInstance;

      expect(c.estadoOperativo().accionPrincipal.label).toMatch(/Verificar período/i);

      await avanzarFlujo(localFixture, 'prevalidado');
      expectTexto(c.estadoOperativo().accionPrincipal.label, 'Generar nómina');

      await avanzarFlujo(localFixture, 'base');
      expect(generarPreNominaPeriodo).toHaveBeenCalled();
      expect(c.contextoOperativoPeriodo().baseGenerada).toBe(true);

      await avanzarFlujo(localFixture, 'calculo');
      expect(generarCalculoPeriodo).toHaveBeenCalled();

      await avanzarFlujo(localFixture, 'guardado');
      expect(guardarSnapshotPreliminar).toHaveBeenCalled();

      await avanzarFlujo(localFixture, 'aprobado');
      expect(aprobarResultadoPreliminarOperativamente).toHaveBeenCalled();
    });

    it('tras borrador con trabajadores listos CTA shell no es Generar nomina', async () => {
      ejecutarPrevalidaciones.mockResolvedValueOnce(prevalidacionLista());
      generarPreNominaPeriodo.mockResolvedValueOnce(baseNominaLista());
      const localFixture = await montarContainer();
      await avanzarFlujo(localFixture, 'base');

      const c = localFixture.componentInstance;
      const resumen = c.nominaMasivaResumen();
      expect(resumen.totalTrabajadores).toBeGreaterThan(0);
      expect(resumen.bloqueados).toBe(0);
      expect(resumen.conObservaciones).toBe(0);

      expectTexto(c.estadoOperativo().accionPrincipal.label, 'Confirmar revisión');
      expectTextoNo(c.estadoOperativo().accionPrincipal.label, 'Generar nómina');

      const shell = TestBed.inject(ShellPageContextService);
      expect(shell.primaryAction()?.label).toMatch(/Confirmar revisión/i);
    });

    it('shell revisar trabajadores abre vista trabajadores y preselecciona fila', async () => {
      ejecutarPrevalidaciones.mockResolvedValueOnce(
        prevalidacionLista({
          advertencias: [{
            codigo: 'ADV-003',
            area: 'TRABAJADORES',
            severidad: 'ADVERTENCIA',
            texto: 'Trabajador con observacion.',
          }],
        }),
      );
      generarPreNominaPeriodo.mockResolvedValueOnce(baseNominaLista());
      const localFixture = await montarContainer();
      await avanzarFlujo(localFixture, 'prevalidado');
      await avanzarFlujo(localFixture, 'base');

      const c = localFixture.componentInstance;
      c.revisarBloqueosOperativos();
      localFixture.detectChanges();

      expect(c.nominaWorkspaceTabVisible()).toBe('detalle_mensual');
      expect(c.nominaDetalleMensualVista()).toBe('trabajadores');
      expect(c.nominaMasivaTrabajadorSeleccionadoId()).not.toBeNull();
      expect(localFixture.nativeElement.querySelector('.payroll-revision-trabajadores')).toBeTruthy();
    });

    it('revision masiva muestra titulo contextual para cada filtro', async () => {
      ejecutarPrevalidaciones.mockResolvedValueOnce(prevalidacionLista({
        entradasMensuales: [entradaMensualAprobada()],
      }));
      generarPreNominaPeriodo.mockResolvedValueOnce(baseNominaLista());
      const localFixture = await montarContainer();
      await avanzarFlujo(localFixture, 'base');

      const c = localFixture.componentInstance;
      c.seleccionarNominaDetalleMensualVista('trabajadores');

      const resumen = c.nominaMasivaResumen();
      const casos: Array<[NominaMasivaFiltro, string, number]> = [
        ['todos', 'Total', resumen.totalTrabajadores],
        ['listos', 'Listos', resumen.listos],
        ['observaciones', 'Con observaciones', resumen.conObservaciones],
        ['bloqueados', 'Bloqueados', resumen.bloqueados],
        ['con_movimientos', 'Con movimientos', resumen.conMovimientos],
        ['con_recurrentes', 'Con recurrentes', resumen.conRecurrentes],
        ['sin_movimientos', 'Sin movimientos', resumen.sinMovimientos],
      ];

      for (const [filtro, etiqueta, cantidad] of casos) {
        c.seleccionarFiltroNominaMasiva(filtro);
        localFixture.detectChanges();
        expectTexto(c.nominaMasivaTituloContexto() ?? '', `${etiqueta} · ${c.etiquetaCantidadTrabajadores(cantidad)}`);
      }
    });

    it('revision masiva sincroniza seleccion al cambiar filtros y busqueda', async () => {
      ejecutarPrevalidaciones.mockResolvedValueOnce(prevalidacionLista({
        entradasMensuales: [entradaMensualAprobada()],
      }));
      generarPreNominaPeriodo.mockResolvedValueOnce(baseNominaLista());
      const localFixture = await montarContainer();
      await avanzarFlujo(localFixture, 'base');

      const c = localFixture.componentInstance;
      c.seleccionarNominaDetalleMensualVista('trabajadores');
      c.seleccionarFiltroNominaMasiva('todos');
      localFixture.detectChanges();

      c.seleccionarTrabajadorNominaMasiva(3);
      c.seleccionarFiltroNominaMasiva('con_movimientos');
      localFixture.detectChanges();
      expect(c.nominaMasivaFilasFiltradas().length).toBeGreaterThan(0);
      expect(c.nominaMasivaTrabajadorSeleccionadoId()).toBe(c.nominaMasivaFilasFiltradas()[0].idPersona);

      const seleccionVisible = c.nominaMasivaTrabajadorSeleccionadoId();
      c.seleccionarFiltroNominaMasiva('todos');
      localFixture.detectChanges();
      expect(c.nominaMasivaTrabajadorSeleccionadoId()).toBe(seleccionVisible);

      c.nominaMasivaTrabajadorSeleccionadoId.set(null);
      c.seleccionarFiltroNominaMasiva('listos');
      localFixture.detectChanges();
      expect(c.nominaMasivaTrabajadorSeleccionadoId()).toBe(c.nominaMasivaFilasFiltradas()[0].idPersona);

      c.actualizarBusquedaNominaMasiva('sin coincidencias visibles');
      localFixture.detectChanges();
      expect(c.nominaMasivaFilasFiltradas()).toHaveLength(0);
      expect(c.nominaMasivaTrabajadorSeleccionadoId()).toBeNull();
    });

    it('invocar CTA shell con confirmar revision ejecuta calculo preliminar', async () => {
      ejecutarPrevalidaciones.mockResolvedValueOnce(prevalidacionLista());
      generarPreNominaPeriodo.mockResolvedValueOnce(baseNominaLista());
      const localFixture = await montarContainer();
      await avanzarFlujo(localFixture, 'base');

      const c = localFixture.componentInstance;
      expectTexto(c.estadoOperativo().accionPrincipal.label, 'Confirmar revisión');

      await invocarCtaShell(localFixture);
      await vi.waitFor(() => expect(c.calculandoPreliminar()).toBe(false), { timeout: 3000, interval: 20 });
      expect(generarCalculoPeriodo).toHaveBeenCalled();
    });

    it('rail preparar confirmacion dispara calculo preliminar', async () => {
      ejecutarPrevalidaciones.mockResolvedValueOnce(prevalidacionLista());
      generarPreNominaPeriodo.mockResolvedValueOnce(baseNominaLista());
      const localFixture = await montarContainer();
      await avanzarFlujo(localFixture, 'base');

      const c = localFixture.componentInstance;
      expectTexto(c.revisionRailCta().label, 'Preparar confirmación');

      c.ejecutarRevisionRailPrincipal();
      await vi.waitFor(() => expect(c.calculandoPreliminar()).toBe(false), { timeout: 3000, interval: 20 });
      expect(generarCalculoPeriodo).toHaveBeenCalled();
    });

    it('tras calculo sin bloqueos CTA apunta a guardar resultado', async () => {
      ejecutarPrevalidaciones.mockResolvedValueOnce(prevalidacionLista());
      generarPreNominaPeriodo.mockResolvedValueOnce(baseNominaLista());
      generarCalculoPeriodo.mockResolvedValueOnce({
        periodo: PERIODO_TEST,
        estado: 'calculado_preliminar',
        generadoEn: '2026-05-05T10:00:00.000Z',
        resumen: {
          totalTrabajadoresCalculados: 2,
          totalBloqueados: 0,
          totalConAdvertencias: 0,
          totalHaberes: 900000,
          totalDescuentos: 180000,
          totalLiquidoPreliminar: 720000,
        },
        liquidaciones: [{
          periodo: PERIODO_TEST,
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
          issues: [],
          trazabilidad: [],
          estado: 'calculado_preliminar',
        }],
        issues: [],
      });
      const localFixture = await montarContainer();
      await avanzarFlujo(localFixture, 'calculo');

      const c = localFixture.componentInstance;
      expect(c.estadoOperativo().estadoClave).toBe('resultado_listo_para_guardar');
      expectTexto(c.estadoOperativo().accionPrincipal.label, 'Confirmar revisión');
      expect(c.estadoOperativo().accionPrincipal.accionLocal).toBe('guardarResultado');
    });
  });
});
