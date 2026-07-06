import { describe, expect, it } from 'vitest';

import type { NominaCalculoPeriodoSnapshot, NominaSnapshotCompletoView } from '../models/proceso-mensual.model';
import { buildExpedienteNominaPeriodo } from './proceso-mensual-expediente-periodo.rules';

function cabeceraBase(overrides: Partial<NominaCalculoPeriodoSnapshot> = {}): NominaCalculoPeriodoSnapshot {
  return {
    idCalculoPeriodo: 1,
    periodo: '2026-05',
    idEmpresa: null,
    estado: 'preliminar',
    fechaGeneracion: '2026-05-10T10:00:00.000Z',
    usuarioGenerador: 'RRHH Demo',
    totalTrabajadores: 2,
    totalHaberes: 1000,
    totalDescuentos: 200,
    totalLiquido: 800,
    totalBloqueados: 0,
    totalAdvertencias: 1,
    versionMotor: 'v1',
    hashSnapshot: 'hash-abc',
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

function completoConTrabajadores(): NominaSnapshotCompletoView {
  const cabecera = cabeceraBase();
  return {
    cabecera,
    trabajadores: [
      {
        idCalculoTrabajador: 10,
        idCalculoPeriodo: 1,
        idPersona: 1,
        rut: '11.111.111-1',
        nombreCompletoSnapshot: 'Ana Pérez',
        estado: 'calculado_preliminar',
        sueldoBase: 500000,
        baseImponiblePrevisional: 500000,
        baseTributable: 400000,
        totalHaberesImponibles: 500000,
        totalHaberesNoImponibles: 0,
        totalDescuentosLegales: 100000,
        totalDescuentosVoluntarios: 0,
        impuestoUnico: 0,
        liquidoPreliminar: 400000,
        cotizacionAfp: 0,
        cotizacionSalud: 0,
        cotizacionAfc: 0,
        cotizacionSis: 0,
        cotizacionSanna: 0,
        cotizacionLey16744Empleador: 0,
        conceptos: [],
        issues: [],
        trazabilidad: [],
      },
    ],
    conceptos: [],
    observaciones: [
      {
        codigo: 'ADV-01',
        severidad: 'ADVERTENCIA',
        origen: 'validacion',
        mensaje: 'Movimiento pendiente de revisión',
        campo: null,
        entidadId: null,
        idCalculoTrabajador: 10,
      },
    ],
    trazabilidad: [],
    aprobacionOperativa: null,
    cierreOperativo: null,
    resumen: {
      totalConceptos: 0,
      totalObservaciones: 1,
      totalTrazas: 0,
      totalTrabajadoresSinDetalle: 0,
      esActivoVigente: true,
      fueReemplazado: false,
    },
  };
}

describe('proceso-mensual-expediente-periodo.rules', () => {
  it('sin snapshot no muestra expediente', () => {
    const vm = buildExpedienteNominaPeriodo({
      snapshotActivo: null,
      snapshotCompleto: null,
      consultandoSnapshotCompleto: false,
      errorSnapshotCompleto: null,
      nominaCerrada: false,
      liquidacionesDisponibles: false,
    });
    expect(vm.visible).toBe(false);
    expect(vm.estado).toBe('sin_expediente');
  });

  it('snapshot completo con trabajadores arma expediente visible', () => {
    const vm = buildExpedienteNominaPeriodo({
      snapshotActivo: cabeceraBase(),
      snapshotCompleto: completoConTrabajadores(),
      consultandoSnapshotCompleto: false,
      errorSnapshotCompleto: null,
      nominaCerrada: false,
      liquidacionesDisponibles: false,
    });
    expect(vm.visible).toBe(true);
    expect(vm.estado).toBe('version_guardada');
    expect(vm.trabajadores).toHaveLength(1);
    expect(vm.trabajadores[0].nombre).toBe('Ana Pérez');
    expect(vm.problemas).toHaveLength(1);
  });

  it('cabecera sin detalle de trabajadores muestra estado explicado', () => {
    const vm = buildExpedienteNominaPeriodo({
      snapshotActivo: cabeceraBase({ totalTrabajadores: 3 }),
      snapshotCompleto: {
        ...completoConTrabajadores(),
        trabajadores: [],
        resumen: { ...completoConTrabajadores().resumen, totalTrabajadoresSinDetalle: 3 },
      },
      consultandoSnapshotCompleto: false,
      errorSnapshotCompleto: null,
      nominaCerrada: false,
      liquidacionesDisponibles: false,
    });
    expect(vm.estado).toBe('detalle_no_disponible');
    expect(vm.mensajeEstado).toContain('detalle');
    expect(vm.trabajadores).toHaveLength(0);
  });

  it('snapshot confirmado con cierre operativo', () => {
    const vm = buildExpedienteNominaPeriodo({
      snapshotActivo: cabeceraBase({
        cierreOperativo: {
          estado: 'cerrado_operativamente',
          fecha: '2026-05-11T12:00:00.000Z',
          usuarioId: null,
          usuarioLabel: 'Jefe RRHH',
          observacion: null,
          metadata: {},
        },
      }),
      snapshotCompleto: completoConTrabajadores(),
      consultandoSnapshotCompleto: false,
      errorSnapshotCompleto: null,
      nominaCerrada: true,
      liquidacionesDisponibles: false,
    });
    expect(vm.estado).toBe('confirmada');
    expect(vm.accionPrincipal?.accion).toBe('generar_liquidaciones');
  });

  it('error al cargar detalle no deja expediente vacío', () => {
    const vm = buildExpedienteNominaPeriodo({
      snapshotActivo: cabeceraBase(),
      snapshotCompleto: null,
      consultandoSnapshotCompleto: false,
      errorSnapshotCompleto: 'No se pudo cargar el detalle de la nómina.',
      nominaCerrada: false,
      liquidacionesDisponibles: false,
    });
    expect(vm.estado).toBe('error_carga');
    expect(vm.mensajeEstado).toContain('No se pudo cargar');
    expect(vm.totales?.trabajadores).toBe(2);
  });

  it('estado cargando mientras consulta snapshot completo', () => {
    const vm = buildExpedienteNominaPeriodo({
      snapshotActivo: cabeceraBase(),
      snapshotCompleto: null,
      consultandoSnapshotCompleto: true,
      errorSnapshotCompleto: null,
      nominaCerrada: false,
      liquidacionesDisponibles: false,
    });
    expect(vm.estado).toBe('cargando');
    expect(vm.mensajeEstado).toContain('Cargando');
  });

  it('rehidratación con snapshot completo expone trabajadores en expediente', () => {
    const completo = completoConTrabajadores();
    const vm = buildExpedienteNominaPeriodo({
      snapshotActivo: completo.cabecera,
      snapshotCompleto: completo,
      consultandoSnapshotCompleto: false,
      errorSnapshotCompleto: null,
      nominaCerrada: false,
      liquidacionesDisponibles: false,
    });
    expect(vm.trabajadores[0].totalLiquido).toBe(400000);
  });

  it('usa trabajadores del snapshot activo cuando completo aun no cargo', () => {
    const vm = buildExpedienteNominaPeriodo({
      snapshotActivo: cabeceraBase({
        estado: 'borrador',
        trabajadores: completoConTrabajadores().trabajadores,
      }),
      snapshotCompleto: null,
      consultandoSnapshotCompleto: false,
      errorSnapshotCompleto: null,
      nominaCerrada: false,
      liquidacionesDisponibles: false,
    });
    expect(vm.trabajadores).toHaveLength(1);
    expect(vm.trabajadores[0].nombre).toBe('Ana Pérez');
  });

  it('sin fuente de liquidaciones no inventa liquidaciones disponibles', () => {
    const vm = buildExpedienteNominaPeriodo({
      snapshotActivo: cabeceraBase({
        cierreOperativo: {
          estado: 'cerrado_operativamente',
          fecha: '2026-05-11T12:00:00.000Z',
          usuarioId: null,
          usuarioLabel: 'Jefe RRHH',
          observacion: null,
          metadata: {},
        },
      }),
      snapshotCompleto: completoConTrabajadores(),
      consultandoSnapshotCompleto: false,
      errorSnapshotCompleto: null,
      nominaCerrada: true,
      liquidacionesDisponibles: false,
    });
    expect(vm.accionPrincipal?.accion).toBe('generar_liquidaciones');
  });

  it('no agrega seccion Observaciones del periodo aunque haya problemas', () => {
    const vm = buildExpedienteNominaPeriodo({
      snapshotActivo: cabeceraBase(),
      snapshotCompleto: completoConTrabajadores(),
      consultandoSnapshotCompleto: false,
      errorSnapshotCompleto: null,
      nominaCerrada: false,
      liquidacionesDisponibles: false,
    });

    expect(vm.problemas.length).toBeGreaterThan(0);
    expect(vm.secciones.some((seccion) => seccion.titulo === 'Observaciones del período')).toBe(false);
    expect(vm.secciones.some((seccion) => seccion.titulo === 'Observaciones del periodo')).toBe(false);
  });

  it('con liquidaciones reales sugiere revisar liquidaciones', () => {
    const vm = buildExpedienteNominaPeriodo({
      snapshotActivo: cabeceraBase({
        cierreOperativo: {
          estado: 'cerrado_operativamente',
          fecha: '2026-05-11T12:00:00.000Z',
          usuarioId: null,
          usuarioLabel: 'Jefe RRHH',
          observacion: null,
          metadata: {},
        },
      }),
      snapshotCompleto: completoConTrabajadores(),
      consultandoSnapshotCompleto: false,
      errorSnapshotCompleto: null,
      nominaCerrada: true,
      liquidacionesDisponibles: true,
    });
    expect(vm.accionPrincipal?.accion).toBe('revisar_liquidaciones');
  });
});
