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

  it('crea la vista y muestra titulo preparar nomina', () => {
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Preparar nomina');
  });

  it('muestra aprobacion operativa deshabilitada sin resultado guardado al iniciar', () => {
    const buttons = [...fixture.nativeElement.querySelectorAll('button')] as HTMLButtonElement[];
    const aprobar = buttons.find((b) => (b.textContent ?? '').includes('Aprobar resultado preliminar'));
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Revision para aprobacion');
    expect(text).toContain('Sin resultado guardado');
    expect(text).toContain('Guarda un resultado preliminar antes de aprobar operativamente la nomina.');
    expect(text).toContain('No puedes aprobar todavia. Primero calcula el resultado preliminar.');
    expect(text).toContain('Checklist operativo');
    expect(aprobar?.disabled).toBe(true);
  });

  it('muestra seccion de resultado guardado desde BD sin snapshot guardado', () => {
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Resultado guardado desde BD');
    expect(text).toContain('Este detalle corresponde al resultado preliminar guardado en base de datos.');
    expect(text).toContain('No hay resultado preliminar guardado para consultar.');
    expect(text).toContain('Actualizar consulta');
  });

  it('muestra Cierre operativo deshabilitado sin aprobacion', () => {
    const text = fixture.nativeElement.textContent as string;
    const cerrar = ([...fixture.nativeElement.querySelectorAll('button')] as HTMLButtonElement[])
      .find((b) => (b.textContent ?? '').includes('Cerrar nomina del periodo'));
    expect(text).toContain('Cierre operativo');
    expect(text).toContain('Cierre no disponible');
    expect(text).toContain('No puedes cerrar todavia. Primero debe existir un resultado preliminar guardado vigente.');
    expect(text).toContain('No emite liquidaciones ni genera archivos legales.');
    expect(cerrar?.disabled).toBe(true);
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

  it('tras validar muestra dashboard operativo y accion recomendada', async () => {
    const buttons = [...fixture.nativeElement.querySelectorAll('button')] as HTMLButtonElement[];
    buttons.find((b) => (b.textContent ?? '').includes('Validar periodo'))!.click();
    await fixture.whenStable();
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Resumen operativo del periodo');
    expect(text).toContain('Siguiente accion recomendada');
    expect(text).toContain('Checklist del periodo');
    expect(text).toContain('Revisar parametros');
  });

  it('renderiza estado para calculo preliminar pendiente antes de validar', () => {
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Estado para calculo preliminar');
    expect(text).toContain('Pendiente de validar');
    expect(text).toContain('No puedes calcular todavia.');
  });

  it('renderiza Resultado preliminar con empty state operativo antes de calcular', () => {
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Resultado preliminar');
    expect(text).toContain('Aun no hay resultado preliminar.');
    expect(text).toContain('Primero calcula preliminarmente la nomina para revisar montos y observaciones antes de guardar.');
    expect(text).toContain('No puedes guardar todavia. Primero calcula preliminarmente la nomina.');
  });

  it('con bloqueos muestra estado bloqueado, deshabilita calcular y muestra razon', async () => {
    const buttons = [...fixture.nativeElement.querySelectorAll('button')] as HTMLButtonElement[];
    buttons.find((b) => (b.textContent ?? '').includes('Validar periodo'))!.click();
    await fixture.whenStable();
    fixture.detectChanges();

    const calcular = ([...fixture.nativeElement.querySelectorAll('button')] as HTMLButtonElement[]).find((b) =>
      (b.textContent ?? '').includes('Calcular preliminar'),
    );
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Estado para calculo preliminar');
    expect(text).toContain('Bloqueado');
    expect(text).toContain('No puedes calcular todavia.');
    expect(text).toContain('No se encontraron parametros reales validados para este periodo.');
    expect(calcular?.disabled).toBe(true);
  });

  it('sin base generada bloquea el calculo y recomienda generar base', async () => {
    ejecutarPrevalidaciones.mockResolvedValueOnce(prevalidacionLista());
    const buttons = [...fixture.nativeElement.querySelectorAll('button')] as HTMLButtonElement[];
    buttons.find((b) => (b.textContent ?? '').includes('Validar periodo'))!.click();
    await fixture.whenStable();
    fixture.detectChanges();

    const calcular = ([...fixture.nativeElement.querySelectorAll('button')] as HTMLButtonElement[]).find((b) =>
      (b.textContent ?? '').includes('Calcular preliminar'),
    );
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Base de nomina no generada');
    expect(text).toContain('Generar base de nomina');
    expect(calcular?.disabled).toBe(true);
  });

  it('con base lista habilita calcular preliminar', async () => {
    ejecutarPrevalidaciones.mockResolvedValueOnce(prevalidacionLista());
    generarPreNominaPeriodo.mockResolvedValueOnce(baseNominaLista());

    let buttons = [...fixture.nativeElement.querySelectorAll('button')] as HTMLButtonElement[];
    buttons.find((b) => (b.textContent ?? '').includes('Validar periodo'))!.click();
    await fixture.whenStable();
    fixture.detectChanges();

    buttons = [...fixture.nativeElement.querySelectorAll('button')] as HTMLButtonElement[];
    buttons.find((b) => (b.textContent ?? '').includes('Generar base de nomina'))!.click();
    await fixture.whenStable();
    fixture.detectChanges();

    const calcular = ([...fixture.nativeElement.querySelectorAll('button')] as HTMLButtonElement[]).find((b) =>
      (b.textContent ?? '').includes('Calcular preliminar'),
    );
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Listo para calcular');
    expect(text).toContain('La base de nomina esta lista para calcular preliminarmente.');
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
    buttons.find((b) => (b.textContent ?? '').includes('Validar periodo'))!.click();
    await fixture.whenStable();
    fixture.detectChanges();
    buttons = [...fixture.nativeElement.querySelectorAll('button')] as HTMLButtonElement[];
    buttons.find((b) => (b.textContent ?? '').includes('Generar base de nomina'))!.click();
    await fixture.whenStable();
    fixture.detectChanges();

    const calcular = ([...fixture.nativeElement.querySelectorAll('button')] as HTMLButtonElement[]).find((b) =>
      (b.textContent ?? '').includes('Calcular preliminar'),
    );
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Con advertencias');
    expect(text).toContain('No hay movimientos del mes registrados');
    expect(text).toContain('No bloquea el calculo preliminar.');
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
    buttons.find((b) => (b.textContent ?? '').includes('Validar periodo'))!.click();
    await fixture.whenStable();
    fixture.detectChanges();
    buttons = [...fixture.nativeElement.querySelectorAll('button')] as HTMLButtonElement[];
    buttons.find((b) => (b.textContent ?? '').includes('Generar base de nomina'))!.click();
    await fixture.whenStable();
    fixture.detectChanges();

    const calcular = ([...fixture.nativeElement.querySelectorAll('button')] as HTMLButtonElement[]).find((b) =>
      (b.textContent ?? '').includes('Calcular preliminar'),
    );
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('No hay asignaciones recurrentes activas');
    expect(text).toContain('No bloquea el calculo preliminar.');
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
    buttons.find((b) => (b.textContent ?? '').includes('Validar periodo'))!.click();
    await fixture.whenStable();
    fixture.detectChanges();
    buttons = [...fixture.nativeElement.querySelectorAll('button')] as HTMLButtonElement[];
    buttons.find((b) => (b.textContent ?? '').includes('Generar base de nomina'))!.click();
    await fixture.whenStable();
    fixture.detectChanges();

    const calcular = ([...fixture.nativeElement.querySelectorAll('button')] as HTMLButtonElement[]).find((b) =>
      (b.textContent ?? '').includes('Calcular preliminar'),
    );
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('No hay trabajadores considerados');
    expect(text).toContain('La base de nomina no tiene trabajadores para calcular.');
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
    buttons.find((b) => (b.textContent ?? '').includes('Validar periodo'))!.click();
    await fixture.whenStable();
    fixture.detectChanges();
    buttons = [...fixture.nativeElement.querySelectorAll('button')] as HTMLButtonElement[];
    buttons.find((b) => (b.textContent ?? '').includes('Generar base de nomina'))!.click();
    await fixture.whenStable();
    fixture.detectChanges();

    const calcular = ([...fixture.nativeElement.querySelectorAll('button')] as HTMLButtonElement[]).find((b) =>
      (b.textContent ?? '').includes('Calcular preliminar'),
    );
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Faltan parametros minimos para calcular');
    expect(text).toContain('Hay parametros opcionales pendientes');
    expect(text).toContain('Revisar parametros');
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
    buttons.find((b) => (b.textContent ?? '').includes('Validar periodo'))!.click();
    await fixture.whenStable();
    fixture.detectChanges();

    const btnBaseNomina = ([...fixture.nativeElement.querySelectorAll('button')] as HTMLButtonElement[]).find((b) =>
      (b.textContent ?? '').includes('Generar base de nomina'),
    );
    expect(btnBaseNomina).toBeTruthy();
    btnBaseNomina!.click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(generarPreNominaPeriodo).toHaveBeenCalledWith('2026-05');
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Base generada con advertencias');
    expect(text).toContain('Resumen de base');
    expect(text).toContain('Trabajadores considerados');
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
    buttons.find((b) => (b.textContent ?? '').includes('Validar periodo'))!.click();
    await fixture.whenStable();
    fixture.detectChanges();

    buttons = [...fixture.nativeElement.querySelectorAll('button')] as HTMLButtonElement[];
    buttons.find((b) => (b.textContent ?? '').includes('Generar base de nomina'))!.click();
    await fixture.whenStable();
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Resumen de base');
    expect(text).toContain('Trabajadores incluidos');
    expect(text).toContain('Trabajadores considerados');
    expect(text).toContain('Listos para calculo');
    expect(text).toContain('Con observaciones');
    expect(text).toContain('Bloqueados');
    expect(text).toContain('Asignaciones recurrentes incluidas');
    expect(text).toContain('Movimientos del mes incluidos');
    expect(text).toContain('Ana Perez');
    expect(text).toContain('11.111.111-1');
    expect(text).toContain('Luis Soto');
    expect(text).toContain('Contrato no disponible');
    expect(text).toContain('Marta Rojas');
    expect(text).toContain('Listo para calculo');
    expect(text).toContain('Bloqueado');
    expect(text).toContain('Entradas consideradas');
    expect(text).toContain('Parametros del periodo');
    expect(text).toContain('Revisar parametros');
    expect(text).toContain('Revisar movimientos del mes');
    expect(text).toContain('Revisar asignaciones recurrentes');
    expect(text).toContain('Actualizar base de nomina');
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
    buttons.find((b) => (b.textContent ?? '').includes('Validar periodo'))!.click();
    await fixture.whenStable();
    fixture.detectChanges();

    buttons = [...fixture.nativeElement.querySelectorAll('button')] as HTMLButtonElement[];
    buttons.find((b) => (b.textContent ?? '').includes('Generar base de nomina'))!.click();
    await fixture.whenStable();
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    expect(text).not.toContain('Pre-nomina');
    expect(text).not.toContain('Issues');
    expect(text).not.toContain('Novedades');
    expect(text).not.toContain('Payload');
    expect(text).not.toContain('Hash');
    expect(text).not.toContain('idPersona');
    expect(text).not.toContain('idContrato');
    expect(text).not.toContain('idConcepto');
  });

  it('calcula preliminar posterior a pre-nomina generada y muestra tabla resultado', async () => {
    ejecutarPrevalidaciones.mockResolvedValueOnce(prevalidacionLista());
    generarPreNominaPeriodo.mockResolvedValueOnce(baseNominaLista());

    let buttons = [...fixture.nativeElement.querySelectorAll('button')] as HTMLButtonElement[];
    buttons.find((b) => (b.textContent ?? '').includes('Validar periodo'))!.click();
    await fixture.whenStable();
    fixture.detectChanges();

    buttons = [...fixture.nativeElement.querySelectorAll('button')] as HTMLButtonElement[];
    buttons.find((b) => (b.textContent ?? '').includes('Generar base de nomina'))!.click();
    await fixture.whenStable();
    fixture.detectChanges();

    buttons = [...fixture.nativeElement.querySelectorAll('button')] as HTMLButtonElement[];
    buttons.find((b) => (b.textContent ?? '').includes('Calcular preliminar'))!.click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(generarCalculoPeriodo).toHaveBeenCalledWith('2026-05');
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Resultado preliminar generado');
    expect(text).toContain('Trabajadores calculados');
    expect(text).toContain('Total haberes');
    expect(text).toContain('Total descuentos');
    expect(text).toContain('Liquido preliminar');
    expect(text).toContain('Observaciones');
    expect(text).toContain('Ana Perez');
    expect(text).toContain('Calculado');
    expect(text).toContain('Version del calculo');
    expect(text).toContain('Identificador tecnico');
    expect(text).toContain('Fecha de generacion');
    expect(text).toContain('Recalcular preliminar');
    expect(text).toContain('Guardar resultado preliminar');
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
    buttons.find((b) => (b.textContent ?? '').includes('Validar periodo'))!.click();
    await fixture.whenStable();
    fixture.detectChanges();
    buttons = [...fixture.nativeElement.querySelectorAll('button')] as HTMLButtonElement[];
    buttons.find((b) => (b.textContent ?? '').includes('Generar base de nomina'))!.click();
    await fixture.whenStable();
    fixture.detectChanges();
    buttons = [...fixture.nativeElement.querySelectorAll('button')] as HTMLButtonElement[];
    buttons.find((b) => (b.textContent ?? '').includes('Calcular preliminar'))!.click();
    await fixture.whenStable();
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Resultado con bloqueos');
    expect(text).toContain('Trabajadores con observaciones');
    expect(text).toContain('Trabajadores omitidos');
    expect(text).toContain('Con observaciones');
    expect(text).toContain('Omitido');
    expect(text).toContain('Luis Soto');
    expect(text).toContain('Contrato no disponible.');
    expect(text).toContain('Advertencias del resultado');
    expect(text).toContain('Dato opcional pendiente de revision.');
    expect(text).toContain('Bloqueos del resultado');
    expect(text).toContain('Trabajador omitido del calculo');
    expect(text).toContain('Revisar base de nomina');
  });

  it('guarda snapshot preliminar posterior a calculo sin bloqueos', async () => {
    ejecutarPrevalidaciones.mockResolvedValueOnce(prevalidacionLista());
    generarPreNominaPeriodo.mockResolvedValueOnce(baseNominaLista());

    let buttons = [...fixture.nativeElement.querySelectorAll('button')] as HTMLButtonElement[];
    buttons.find((b) => (b.textContent ?? '').includes('Validar periodo'))!.click();
    await fixture.whenStable();
    fixture.detectChanges();
    buttons = [...fixture.nativeElement.querySelectorAll('button')] as HTMLButtonElement[];
    buttons.find((b) => (b.textContent ?? '').includes('Generar base de nomina'))!.click();
    await fixture.whenStable();
    fixture.detectChanges();
    buttons = [...fixture.nativeElement.querySelectorAll('button')] as HTMLButtonElement[];
    buttons.find((b) => (b.textContent ?? '').includes('Calcular preliminar'))!.click();
    await fixture.whenStable();
    fixture.detectChanges();
    buttons = [...fixture.nativeElement.querySelectorAll('button')] as HTMLButtonElement[];
    buttons.find((b) => (b.textContent ?? '').includes('Guardar resultado preliminar'))!.click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(guardarSnapshotPreliminar).toHaveBeenCalledWith('2026-05');
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Resultado preliminar guardado');
    expect(text).toContain('Revisa y aprueba operativamente este nuevo resultado si corresponde');
    expect(text).toContain('No emite liquidaciones');
    expect(text).toContain('Prepara, calcula y deja trazable el resultado interno antes de la salida oficial del periodo.');
    expect(text).toContain('Fecha de guardado');
    expect(text).toContain('Version guardada');
    expect(text).toContain('Identificador tecnico');
    expect(text).toContain('MOTOR-03B');
    expect(text).toContain('Revision para aprobacion');
    expect(text).toContain('Listo para aprobar');
    expect(text).toContain('La version guardada coincide con el ultimo resultado disponible.');
    expect(text).toContain('Salidas legales y archivos externos quedan fuera de esta fase.');
    const aprobar = ([...fixture.nativeElement.querySelectorAll('button')] as HTMLButtonElement[])
      .find((b) => (b.textContent ?? '').includes('Aprobar resultado preliminar'));
    expect(aprobar?.disabled).toBe(false);
  });

  it('muestra error atomico si falla el guardado completo del resultado preliminar', async () => {
    guardarSnapshotPreliminar.mockRejectedValueOnce(
      new Error('No se pudo guardar el resultado preliminar completo. No se realizaron cambios parciales.'),
    );
    ejecutarPrevalidaciones.mockResolvedValueOnce(prevalidacionLista());
    generarPreNominaPeriodo.mockResolvedValueOnce(baseNominaLista());

    let buttons = [...fixture.nativeElement.querySelectorAll('button')] as HTMLButtonElement[];
    buttons.find((b) => (b.textContent ?? '').includes('Validar periodo'))!.click();
    await fixture.whenStable();
    fixture.detectChanges();
    buttons = [...fixture.nativeElement.querySelectorAll('button')] as HTMLButtonElement[];
    buttons.find((b) => (b.textContent ?? '').includes('Generar base de nomina'))!.click();
    await fixture.whenStable();
    fixture.detectChanges();
    buttons = [...fixture.nativeElement.querySelectorAll('button')] as HTMLButtonElement[];
    buttons.find((b) => (b.textContent ?? '').includes('Calcular preliminar'))!.click();
    await fixture.whenStable();
    fixture.detectChanges();
    buttons = [...fixture.nativeElement.querySelectorAll('button')] as HTMLButtonElement[];
    buttons.find((b) => (b.textContent ?? '').includes('Guardar resultado preliminar'))!.click();
    await fixture.whenStable();
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('No se pudo guardar el resultado preliminar completo. No se realizaron cambios parciales.');
    expect(text).toContain('Pendiente de guardado');
    expect(text).not.toContain('Cierre ejecutado');
    expect(text).not.toContain('Previred generado');
    expect(text).not.toContain('LRE generado');
  });

  it('muestra estado no guardado y habilita guardar con resultado sin bloqueos', async () => {
    ejecutarPrevalidaciones.mockResolvedValueOnce(prevalidacionLista());
    generarPreNominaPeriodo.mockResolvedValueOnce(baseNominaLista());

    let buttons = [...fixture.nativeElement.querySelectorAll('button')] as HTMLButtonElement[];
    buttons.find((b) => (b.textContent ?? '').includes('Validar periodo'))!.click();
    await fixture.whenStable();
    fixture.detectChanges();
    buttons = [...fixture.nativeElement.querySelectorAll('button')] as HTMLButtonElement[];
    buttons.find((b) => (b.textContent ?? '').includes('Generar base de nomina'))!.click();
    await fixture.whenStable();
    fixture.detectChanges();
    buttons = [...fixture.nativeElement.querySelectorAll('button')] as HTMLButtonElement[];
    buttons.find((b) => (b.textContent ?? '').includes('Calcular preliminar'))!.click();
    await fixture.whenStable();
    fixture.detectChanges();

    buttons = [...fixture.nativeElement.querySelectorAll('button')] as HTMLButtonElement[];
    const guardar = buttons.find((b) => (b.textContent ?? '').includes('Guardar resultado preliminar'));
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Resultado no guardado');
    expect(text).toContain('Guarda una version revisable del calculo. No emite liquidaciones ni cierra el periodo.');
    expect(text).toContain('Pendiente de guardado');
    expect(text).toContain('El resultado calculado debe guardarse antes de revisarlo para aprobacion.');
    expect(text).toContain('Guardar resultado actualizado');
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
    buttons.find((b) => (b.textContent ?? '').includes('Validar periodo'))!.click();
    await fixture.whenStable();
    fixture.detectChanges();
    buttons = [...fixture.nativeElement.querySelectorAll('button')] as HTMLButtonElement[];
    buttons.find((b) => (b.textContent ?? '').includes('Generar base de nomina'))!.click();
    await fixture.whenStable();
    fixture.detectChanges();
    buttons = [...fixture.nativeElement.querySelectorAll('button')] as HTMLButtonElement[];
    buttons.find((b) => (b.textContent ?? '').includes('Calcular preliminar'))!.click();
    await fixture.whenStable();
    fixture.detectChanges();

    buttons = [...fixture.nativeElement.querySelectorAll('button')] as HTMLButtonElement[];
    const guardar = buttons.find((b) => (b.textContent ?? '').includes('Guardar resultado preliminar'));
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Resultado con bloqueos');
    expect(text).toContain('No puedes guardar todavia. El resultado tiene bloqueos que deben revisarse.');
    expect(text).toContain('No apto para aprobacion');
    expect(text).toContain('Existen bloqueos que impiden aprobar operativamente este resultado.');
    expect(text).toContain('Hay bloqueos del resultado que deben revisarse.');
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
    buttons.find((b) => (b.textContent ?? '').includes('Validar periodo'))!.click();
    await fixture.whenStable();
    fixture.detectChanges();
    buttons = [...fixture.nativeElement.querySelectorAll('button')] as HTMLButtonElement[];
    buttons.find((b) => (b.textContent ?? '').includes('Generar base de nomina'))!.click();
    await fixture.whenStable();
    fixture.detectChanges();
    buttons = [...fixture.nativeElement.querySelectorAll('button')] as HTMLButtonElement[];
    buttons.find((b) => (b.textContent ?? '').includes('Calcular preliminar'))!.click();
    await fixture.whenStable();
    fixture.detectChanges();
    buttons = [...fixture.nativeElement.querySelectorAll('button')] as HTMLButtonElement[];
    buttons.find((b) => (b.textContent ?? '').includes('Guardar resultado preliminar'))!.click();
    await fixture.whenStable();
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Listo para aprobar con advertencias');
    expect(text).toContain('El resultado preliminar guardado esta listo para aprobacion operativa, con advertencias visibles para decision RRHH.');
    expect(text).toContain('Advertencias visibles para decision RRHH');
    expect(text).toContain('Dato opcional pendiente de revision.');
    const aprobar = ([...fixture.nativeElement.querySelectorAll('button')] as HTMLButtonElement[])
      .find((b) => (b.textContent ?? '').includes('Aprobar resultado preliminar'));
    expect(aprobar?.disabled).toBe(false);
  });

  it('aprueba resultado preliminar guardado y muestra trazabilidad operativa', async () => {
    ejecutarPrevalidaciones.mockResolvedValueOnce(prevalidacionLista());
    generarPreNominaPeriodo.mockResolvedValueOnce(baseNominaLista());

    let buttons = [...fixture.nativeElement.querySelectorAll('button')] as HTMLButtonElement[];
    buttons.find((b) => (b.textContent ?? '').includes('Validar periodo'))!.click();
    await fixture.whenStable();
    fixture.detectChanges();
    buttons = [...fixture.nativeElement.querySelectorAll('button')] as HTMLButtonElement[];
    buttons.find((b) => (b.textContent ?? '').includes('Generar base de nomina'))!.click();
    await fixture.whenStable();
    fixture.detectChanges();
    buttons = [...fixture.nativeElement.querySelectorAll('button')] as HTMLButtonElement[];
    buttons.find((b) => (b.textContent ?? '').includes('Calcular preliminar'))!.click();
    await fixture.whenStable();
    fixture.detectChanges();
    buttons = [...fixture.nativeElement.querySelectorAll('button')] as HTMLButtonElement[];
    buttons.find((b) => (b.textContent ?? '').includes('Guardar resultado preliminar'))!.click();
    await fixture.whenStable();
    fixture.detectChanges();

    buttons = [...fixture.nativeElement.querySelectorAll('button')] as HTMLButtonElement[];
    const aprobar = buttons.find((b) => (b.textContent ?? '').includes('Aprobar resultado preliminar'));
    expect(aprobar?.disabled).toBe(false);
    aprobar!.click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(window.confirm).toHaveBeenLastCalledWith(expect.stringContaining('Aprobar resultado preliminar'));
    expect(aprobarResultadoPreliminarOperativamente).toHaveBeenCalledWith({
      idCalculoPeriodo: 1,
      periodo: '2026-05',
      advertencias: [],
    });
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Aprobacion operativa');
    expect(text).toContain('Aprobado operativamente');
    expect(text).toContain('Resultado preliminar aprobado operativamente.');
    expect(text).toContain('Fecha de aprobacion');
    expect(text).toContain('Usuario no disponible en esta sesion');
    expect(text).toContain('Version del calculo');
    expect(text).toContain('Identificador tecnico');
    expect(text).toContain('Trabajadores calculados');
    expect(text).toContain('Total haberes');
    expect(text).toContain('Total descuentos');
    expect(text).toContain('Liquido preliminar');
    expect(text).toContain('Esta aprobacion es interna y no reemplaza el cierre del periodo ni la emision de liquidaciones oficiales.');
    expect(text).not.toContain('Cierre ejecutado');
    expect(text).not.toContain('Previred generado');
    expect(text).not.toContain('LRE generado');
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
    localFixture.detectChanges();

    const text = localFixture.nativeElement.textContent as string;
    const aprobar = ([...localFixture.nativeElement.querySelectorAll('button')] as HTMLButtonElement[])
      .find((b) => (b.textContent ?? '').includes('Aprobar resultado preliminar'));
    expect(text).toContain('Resultado preliminar aprobado operativamente.');
    expect(text).toContain('rrhh@empresa.cl');
    expect(text).toContain('Advertencia registrada al aprobar.');
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
    const cerrar = buttons.find((b) => (b.textContent ?? '').includes('Cerrar nomina del periodo'));
    expect(cerrar?.disabled).toBe(false);
    cerrar!.click();
    await localFixture.whenStable();
    localFixture.detectChanges();

    expect(window.confirm).toHaveBeenLastCalledWith(expect.stringContaining('Vas a cerrar operativamente la nomina de 2026-05.'));
    expect(cerrarNominaOperativamente).toHaveBeenCalledWith({ idCalculoPeriodo: 1, periodo: '2026-05' });
    const text = localFixture.nativeElement.textContent as string;
    expect(text).toContain('Nomina cerrada operativamente');
    expect(text).toContain('Para modificarla se requerira una fase futura de reapertura.');
    buttons = [...localFixture.nativeElement.querySelectorAll('button')] as HTMLButtonElement[];
    expect(buttons.find((b) => (b.textContent ?? '').includes('Calcular preliminar'))?.disabled).toBe(true);
    expect(buttons.find((b) => (b.textContent ?? '').includes('Guardar resultado preliminar'))?.disabled).toBe(true);
    expect(buttons.find((b) => (b.textContent ?? '').includes('Aprobar resultado preliminar'))?.disabled).toBe(true);
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
    expect(text).toContain('Resultado guardado desde BD');
    expect(text).toContain('Resultado guardado vigente');
    expect(text).toContain('Trabajadores guardados');
    expect(text).toContain('Ana Perez');
    expect(text).toContain('Sueldo base (HAB001)');
    expect(text).toContain('Informacion guardada del resultado.');
    expect(text).toContain('Liquido calculado guardado.');
  });

  it('muestra error operativo si falla la consulta del detalle guardado', async () => {
    obtenerSnapshotCompletoActivo.mockRejectedValueOnce(new Error('red'));

    const buttons = [...fixture.nativeElement.querySelectorAll('button')] as HTMLButtonElement[];
    buttons.find((b) => (b.textContent ?? '').includes('Actualizar consulta'))!.click();
    await fixture.whenStable();
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('No se pudo cargar el detalle del resultado guardado. Intenta nuevamente o revisa la conexion.');
  });

  it('no marca aprobado si falla la persistencia operativa', async () => {
    aprobarResultadoPreliminarOperativamente.mockRejectedValueOnce(new Error('RLS'));
    ejecutarPrevalidaciones.mockResolvedValueOnce(prevalidacionLista());
    generarPreNominaPeriodo.mockResolvedValueOnce(baseNominaLista());

    let buttons = [...fixture.nativeElement.querySelectorAll('button')] as HTMLButtonElement[];
    buttons.find((b) => (b.textContent ?? '').includes('Validar periodo'))!.click();
    await fixture.whenStable();
    fixture.detectChanges();
    buttons = [...fixture.nativeElement.querySelectorAll('button')] as HTMLButtonElement[];
    buttons.find((b) => (b.textContent ?? '').includes('Generar base de nomina'))!.click();
    await fixture.whenStable();
    fixture.detectChanges();
    buttons = [...fixture.nativeElement.querySelectorAll('button')] as HTMLButtonElement[];
    buttons.find((b) => (b.textContent ?? '').includes('Calcular preliminar'))!.click();
    await fixture.whenStable();
    fixture.detectChanges();
    buttons = [...fixture.nativeElement.querySelectorAll('button')] as HTMLButtonElement[];
    buttons.find((b) => (b.textContent ?? '').includes('Guardar resultado preliminar'))!.click();
    await fixture.whenStable();
    fixture.detectChanges();
    buttons = [...fixture.nativeElement.querySelectorAll('button')] as HTMLButtonElement[];
    buttons.find((b) => (b.textContent ?? '').includes('Aprobar resultado preliminar'))!.click();
    await fixture.whenStable();
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('No se pudo registrar la aprobacion operativa. Intenta nuevamente o revisa la conexion.');
    expect(text).not.toContain('Resultado preliminar aprobado operativamente.');
  });

  it('si se recalcula despues de guardar muestra resultado actualizado sin guardar', async () => {
    ejecutarPrevalidaciones.mockResolvedValueOnce(prevalidacionLista());
    generarPreNominaPeriodo.mockResolvedValueOnce(baseNominaLista());

    let buttons = [...fixture.nativeElement.querySelectorAll('button')] as HTMLButtonElement[];
    buttons.find((b) => (b.textContent ?? '').includes('Validar periodo'))!.click();
    await fixture.whenStable();
    fixture.detectChanges();
    buttons = [...fixture.nativeElement.querySelectorAll('button')] as HTMLButtonElement[];
    buttons.find((b) => (b.textContent ?? '').includes('Generar base de nomina'))!.click();
    await fixture.whenStable();
    fixture.detectChanges();
    buttons = [...fixture.nativeElement.querySelectorAll('button')] as HTMLButtonElement[];
    buttons.find((b) => (b.textContent ?? '').includes('Calcular preliminar'))!.click();
    await fixture.whenStable();
    fixture.detectChanges();
    buttons = [...fixture.nativeElement.querySelectorAll('button')] as HTMLButtonElement[];
    buttons.find((b) => (b.textContent ?? '').includes('Guardar resultado preliminar'))!.click();
    await fixture.whenStable();
    fixture.detectChanges();

    buttons = [...fixture.nativeElement.querySelectorAll('button')] as HTMLButtonElement[];
    buttons.find((b) => (b.textContent ?? '').includes('Aprobar resultado preliminar'))!.click();
    await fixture.whenStable();
    fixture.detectChanges();

    buttons = [...fixture.nativeElement.querySelectorAll('button')] as HTMLButtonElement[];
    buttons.find((b) => (b.textContent ?? '').includes('Recalcular preliminar'))!.click();
    await fixture.whenStable();
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Resultado actualizado sin guardar');
    expect(text).toContain('Volviste a calcular despues del ultimo guardado.');
    expect(text).toContain('Ultimo resultado preliminar guardado');
    expect(text).toContain('Aprobacion desactualizada');
    expect(text).toContain('La aprobacion operativa anterior quedo desactualizada porque existe un resultado posterior. Guarda y aprueba nuevamente el resultado actualizado.');
    expect(text).toContain('El calculo actual es mas reciente que la version guardada.');
    expect(text).toContain('Existe un calculo o resultado posterior al aprobado. Debes revisar, guardar y aprobar nuevamente.');
  });

  it('no muestra labels tecnicos ni pasos futuros como flujo principal', () => {
    const text = fixture.nativeElement.textContent as string;
    const lowerText = text.toLowerCase();
    expect(text).not.toContain('Pre-nomina');
    expect(text).not.toContain('Issues');
    expect(text).not.toContain('Hash');
    expect(text).not.toContain('Payload');
    expect(text).not.toContain('Codigos');
    expect(text).not.toContain('idPersona');
    expect(text).not.toContain('idContrato');
    expect(text).not.toContain('idConcepto');
    expect(text).not.toContain('Paso 1 de 4');
    expect(text).not.toContain('MOVIMIENTOS_VARIABLES');
    expect(text).not.toContain('CON_PROBLEMAS');
    expect(text).not.toContain('Liquidacion oficial');
    expect(text).not.toContain('Cerrar periodo');
    expect(lowerText).not.toContain('issues');
    expect(lowerText).not.toContain('payload');
    expect(lowerText).not.toContain('motor futuro');
    expect(lowerText).not.toContain('calculo no disponible');
    expect(text).toContain('Base de nomina');
  });

  it('muestra acciones hacia rutas operativas existentes', () => {
    const links = [...fixture.nativeElement.querySelectorAll('a')] as HTMLAnchorElement[];
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Revisar parametros');
    expect(text).toContain('Revisar movimientos');
    expect(text).toContain('Revisar asignaciones');
    expect(links.length).toBeGreaterThan(0);
  });
});
