import { describe, expect, it } from 'vitest';

import type { NominaMasivaFila } from './proceso-mensual-masivo-layout.rules';
import { buildRevisionRailCta, resolveWorkspaceTargetFromDetalleTab } from './proceso-mensual-flow-nav.rules';
import { buildIncidenciasPeriodo } from './proceso-mensual-incidencias-periodo.rules';
import {
  filtroInicialRevisionTrabajadores,
  idPersonaPreseleccionRevision,
  refineRevisionRailCta,
  resolveAccionCorreccionDesdeFranjaArea,
  resolveAccionCorreccionDesdeFrameCta,
  resolveAccionCorreccionDesdeIncidencia,
  resolveAccionCorreccionDesdeModalItem,
  resolveAccionCorreccionDesdePendienteVm,
  resolveAccionCorreccionFilaMasiva,
} from './proceso-mensual-correccion.rules';
import type { IncidenciaPeriodo } from './proceso-mensual-incidencias-periodo.rules';

function filaBase(overrides: Partial<NominaMasivaFila> = {}): NominaMasivaFila {
  return {
    idPersona: 42,
    trabajador: 'Ana Soto',
    rut: '11.111.111-1',
    estado: 'observacion',
    haberes: null,
    descuentos: null,
    liquidoEstimado: null,
    pendientes: 1,
    incidenciasCount: 1,
    movimientosCount: 0,
    tieneMovimientos: false,
    tieneRecurrentes: false,
    ...overrides,
  };
}

describe('proceso-mensual-correccion.rules', () => {
  it('resolveAccionCorreccionDesdeIncidencia parametros usa overlay', () => {
    const accion = resolveAccionCorreccionDesdeIncidencia({
      id: 'P1',
      severidad: 'bloqueo',
      ambito: 'parametros',
      titulo: 'Parámetros',
      detalle: 'Falta UF',
      origen: 'prevalidacion',
      prioridad: 1,
    });
    expect(accion?.kind).toBe('overlay_parametros');
    expect(accion?.label).toBe('Abrir parámetros');
  });

  it('resolveAccionCorreccionFilaMasiva mantiene movimientos dentro del trabajador', () => {
    const incidencias: IncidenciaPeriodo[] = [
      {
        id: 'M1',
        severidad: 'advertencia',
        ambito: 'movimientos',
        titulo: 'Movimiento pendiente',
        detalle: 'Revisar bono',
        origen: 'prevalidacion',
        prioridad: 2,
        idPersona: 42,
        accion: { tipo: 'ruta', label: 'Revisar movimiento', destino: '/remuneraciones/novedades-mensuales' },
      },
    ];
    const accion = resolveAccionCorreccionFilaMasiva(filaBase(), incidencias);
    expect(accion.kind).toBe('panel_trabajador');
    expect(accion.label).toBe('Revisar trabajador');
    expect(accion.idPersona).toBe(42);
    expect(accion.filtroMasivo).toBe('con_movimientos');
  });

  it('filtroInicialRevisionTrabajadores prioriza bloqueados', () => {
    expect(filtroInicialRevisionTrabajadores({ bloqueosCount: 1, advertenciasCount: 2 })).toBe('bloqueados');
    expect(filtroInicialRevisionTrabajadores({ bloqueosCount: 0, advertenciasCount: 2 })).toBe('observaciones');
  });

  it('idPersonaPreseleccionRevision prioriza bloqueado u observacion', () => {
    const filas = [
      filaBase({ idPersona: 1, estado: 'listo' }),
      filaBase({ idPersona: 2, estado: 'observacion', trabajador: 'Bruno' }),
      filaBase({ idPersona: 3, estado: 'bloqueado', trabajador: 'Carla' }),
    ];
    expect(idPersonaPreseleccionRevision(filas)).toBe(3);
    expect(idPersonaPreseleccionRevision([filaBase({ idPersona: 9, estado: 'listo' })])).toBe(9);
    expect(idPersonaPreseleccionRevision([])).toBeNull();
  });

  it('frame revisarBloqueos resuelve panel pero CTA local debe ir por validacion', () => {
    const accion = resolveAccionCorreccionDesdeFrameCta({
      ctaTipo: 'local',
      ctaLabel: 'Revisar trabajadores',
      ctaAccion: 'revisarBloqueos',
    });
    expect(accion?.kind).toBe('panel_filtro');
    expect(accion?.detalleVista).toBe('trabajadores');
  });

  it('resolveAccionCorreccionDesdePendienteVm con ruta a parametros usa overlay', () => {
    const accion = resolveAccionCorreccionDesdePendienteVm({
      codigo: 'PARAM_X',
      titulo: 'Parámetros',
      descripcion: 'Falta dato',
      severidad: 'danger',
      ruta: '/parametros',
      accionLabel: 'Abrir parámetros',
    });
    expect(accion?.kind).toBe('overlay_parametros');
  });

  it('resolveAccionCorreccionDesdePendienteVm revisarBloqueos abre panel trabajadores', () => {
    const accion = resolveAccionCorreccionDesdePendienteVm({
      codigo: 'BLOQ',
      titulo: 'Bloqueos',
      descripcion: 'Revise',
      severidad: 'danger',
      accionLocal: 'revisarBloqueos',
      accionLabel: 'Revisar trabajadores',
    });
    expect(accion?.kind).toBe('panel_filtro');
    expect(accion?.detalleVista).toBe('trabajadores');
  });

  it('resolveAccionCorreccionDesdeFranjaArea movimientos filtra con_movimientos', () => {
    const accion = resolveAccionCorreccionDesdeFranjaArea('movimientos', {
      parametrosListos: true,
      parametrosConIncidenciaRevision: false,
    });
    expect(accion?.filtroMasivo).toBe('con_movimientos');
  });

  it('refineRevisionRailCta sustituye parametros por movimiento critico si listos', () => {
    const incidencias = buildIncidenciasPeriodo({
      bloqueosOperativos: [],
      advertenciasOperativas: [
        {
          codigo: 'MOVIMIENTO_PENDIENTE',
          titulo: 'Bono sin aprobar',
          descripcion: 'Movimiento pendiente de aprobación',
          severidad: 'warning',
          accionLabel: 'Revisar movimiento',
        },
      ],
      resultadoBloqueos: [],
      resultadoAdvertencias: [],
    });
    const destino = resolveWorkspaceTargetFromDetalleTab('parametros');
    const base = buildRevisionRailCta('parametros', destino);
    const refinado = refineRevisionRailCta(base, destino, {
      parametrosListos: true,
      parametrosConIncidenciaRevision: false,
      incidencias,
    });
    expect(refinado.label).not.toMatch(/parámetro/i);
    expect(refinado.destaqueDetalle).toMatch(/movimiento|bono/i);
    expect(refinado.accionCorreccion?.kind).toBeDefined();
  });

  it('resolveAccionCorreccionDesdeFranjaArea parametros incompletos usa overlay', () => {
    const accion = resolveAccionCorreccionDesdeFranjaArea('parametros', {
      parametrosListos: false,
      parametrosConIncidenciaRevision: false,
    });
    expect(accion?.kind).toBe('overlay_parametros');
  });

  it('resolveAccionCorreccionDesdeModalItem ruta novedades', () => {
    const accion = resolveAccionCorreccionDesdeModalItem({
      ruta: '/remuneraciones/novedades-mensuales',
      label: 'Revisar',
    });
    expect(accion?.kind).toBe('ruta');
  });

  it('resolveAccionCorreccionDesdeFrameCta local generarBase no es correccion', () => {
    expect(
      resolveAccionCorreccionDesdeFrameCta({
        ctaTipo: 'local',
        ctaLabel: 'Generar nómina',
        ctaAccion: 'generarBase',
      }),
    ).toBeNull();
  });
});
