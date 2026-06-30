import { describe, expect, it } from 'vitest';

import {
  buildAuditoriaPorPaso,
  mapSnapshotsToEventosTrazabilidad,
  mergeEventosTrazabilidad,
  resolverIntegridadDesdeSnapshot,
} from '../mappers/nomina-trazabilidad.mapper';
import { construirResumenTrazabilidadPasoActual } from '../presenters/nomina-stepper-trazabilidad.presenter';
import type { NominaCalculoPeriodoSnapshot } from '../../nomina-mensual/models/proceso-mensual.model';
import type { EventoTrazabilidadNomina } from '../models/nomina-trazabilidad.models';

function snapshotBase(partial: Partial<NominaCalculoPeriodoSnapshot> = {}): NominaCalculoPeriodoSnapshot {
  return {
    periodo: '2026-05',
    idEmpresa: null,
    estado: 'preliminar',
    fechaGeneracion: '2026-05-29T22:15:00.000Z',
    usuarioGenerador: 'RRHH',
    totalTrabajadores: 10,
    totalHaberes: 0,
    totalDescuentos: 0,
    totalLiquido: 0,
    totalBloqueados: 0,
    totalAdvertencias: 0,
    versionMotor: 'v1',
    hashSnapshot: 'fnv1a32:9f3a21c8',
    origen: 'preliminar',
    activo: true,
    reemplazadoPor: null,
    aprobacionOperativa: null,
    cierreOperativo: null,
    trabajadores: [],
    issues: [],
    trazabilidad: [],
    ...partial,
  };
}

describe('nomina-trazabilidad.mapper', () => {
  it('resuelve integridad registrada sin verificar server-side', () => {
    const integridad = resolverIntegridadDesdeSnapshot(snapshotBase());
    expect(integridad.estadoIntegridad).toBe('registrado');
    expect(integridad.fingerprintPublico).toBe('9F3A-21C8');
  });

  it('mapea snapshots a eventos servidor sin hash completo en salida', () => {
    const eventos = mapSnapshotsToEventosTrazabilidad([snapshotBase()], snapshotBase());
    expect(eventos.length).toBeGreaterThan(0);
    expect(eventos[0].origen).toBe('servidor');
    expect(JSON.stringify(eventos)).not.toContain('fnv1a32:9f3a21c8');
    expect(eventos[0].integridad.fingerprintPublico).toBe('9F3A-21C8');
  });

  it('prioriza eventos servidor sobre mock', () => {
    const servidor = mapSnapshotsToEventosTrazabilidad([snapshotBase()], snapshotBase());
    const mock = [{
      ...servidor[0],
      idEvento: 'mock-1',
      origen: 'mock' as const,
      descripcion: 'Demo',
    }];
    const merged = mergeEventosTrazabilidad(servidor, [], mock);
    expect(merged.some((e) => e.origen === 'mock')).toBe(false);
  });

  it('mantiene evento local con snapshot aunque exista resumen local del mismo minuto', () => {
    const base = mapSnapshotsToEventosTrazabilidad([snapshotBase()], null)[0];
    const eventoSnapshot = {
      ...base,
      idEvento: 'local-base',
      origen: 'local' as const,
      paso: 'parameters' as const,
      tipoEvento: 'PARAMETROS_CONGELADOS' as const,
      fechaEvento: '2026-05-29T22:15:10.000Z',
      idSnapshotRelacionado: '123',
      metadataPublica: { valoresParametrosBase: [{ grupo: 'uf_utm', clave: 'uf', valor: '39000' }] },
    };
    const eventoResumen = {
      ...eventoSnapshot,
      idEvento: 'local-resumen',
      fechaEvento: '2026-05-29T22:15:20.000Z',
      idSnapshotRelacionado: undefined,
      metadataPublica: undefined,
    };
    const merged = mergeEventosTrazabilidad([], [eventoResumen, eventoSnapshot], []);
    expect(merged).toHaveLength(2);
    expect(merged.some((e) => Array.isArray(e.metadataPublica?.['valoresParametrosBase']))).toBe(true);
  });

  it('mapea snapshot base de parámetros a evento PARAMETROS_CONGELADOS', () => {
    const eventos = mapSnapshotsToEventosTrazabilidad(
      [
        snapshotBase({
          idCalculoPeriodo: 456,
          versionMotor: 'PARAMETROS-BASE-01',
          estado: 'borrador',
          metadataOperativa: {
            tipoSnapshot: 'parametrosBase',
            origenAlGuardar: 'recienGuardada',
            resumenParametrosBase: {
              seccionesListas: 4,
              seccionesTotales: 5,
              controlesVerificados: 12,
              bloqueos: 0,
              requiereRevision: 1,
            },
          },
          parametros: [
            {
              grupo: 'uf_utm',
              clave: 'uf',
              valor: null,
              valorNumerico: 39000,
              vigencia: '2026-05-01',
              origen: 'oficial',
            },
          ],
        }),
      ],
      null,
    );
    const paramEvent = eventos.find((e) => e.paso === 'parameters');
    expect(paramEvent?.tipoEvento).toBe('PARAMETROS_CONGELADOS');
    expect(paramEvent?.origen).toBe('servidor');
    expect(paramEvent?.idSnapshotRelacionado).toBeDefined();
    expect(paramEvent?.descripcion).toContain('recién guardada');
    expect(paramEvent?.metadataPublica?.['valoresParametrosBase']).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          grupo: 'uf_utm',
          clave: 'uf',
          valor: '39000',
          vigencia: '2026-05-01',
          origen: 'oficial',
        }),
      ]),
    );
    expect(eventos.some((e) => e.paso === 'calculation')).toBe(false);
  });

  it('construye auditoría por paso con pendientes', () => {
    const auditoria = buildAuditoriaPorPaso([]);
    expect(auditoria.parameters?.estado).toBe('pendiente');
    expect(auditoria.closure?.requiereAprobacion).toBe(true);
  });

  it('marca dotación y movimientos como validados con eventos locales', () => {
    const eventos: EventoTrazabilidadNomina[] = [
      {
        idEvento: 'local-dotacion',
        periodo: '2026-05',
        paso: 'dotacion',
        tipoEvento: 'EMPLEADOS_VALIDADOS',
        usuarioId: 'u1',
        usuarioNombre: 'Ana RRHH',
        fechaEvento: '2026-05-10T10:00:00.000Z',
        descripcion: 'Dotación confirmada para el período.',
        integridad: { estadoIntegridad: 'registrado' },
        origen: 'local',
      },
      {
        idEvento: 'local-movimientos',
        periodo: '2026-05',
        paso: 'movements',
        tipoEvento: 'NOVEDADES_REGISTRADAS',
        usuarioId: 'u1',
        usuarioNombre: 'Ana RRHH',
        fechaEvento: '2026-05-10T11:00:00.000Z',
        descripcion: 'Movimientos del período listos para cálculo.',
        integridad: { estadoIntegridad: 'registrado' },
        origen: 'local',
      },
    ];
    const auditoria = buildAuditoriaPorPaso(eventos);
    expect(auditoria.dotacion?.estado).toBe('validado');
    expect(auditoria.movements?.estado).toBe('validado');
  });

  it('presenta estado vacio cuando el paso no tiene eventos', () => {
    const auditoria = buildAuditoriaPorPaso([]);
    const resumen = construirResumenTrazabilidadPasoActual('parameters', auditoria, []);
    expect(resumen.responsableNombre).toBe('Sin responsable registrado');
    expect(resumen.ultimoEvento).toBe('Registro pendiente');
    expect(resumen.integridadEstado).toBe('noDisponible');
  });

  it('usa el ultimo evento del paso cuando la auditoria aun esta pendiente', () => {
    const evento: EventoTrazabilidadNomina = {
      idEvento: 'srv-param-1',
      periodo: '2026-05',
      paso: 'parameters',
      tipoEvento: 'PARAMETROS_CONGELADOS',
      usuarioId: 'u1',
      usuarioNombre: 'responsable@empresa.cl',
      fechaEvento: '2026-05-02T10:00:00.000Z',
      descripcion: 'Base de parámetros recién guardada',
      idSnapshotRelacionado: '42',
      integridad: { estadoIntegridad: 'registrado' },
      origen: 'servidor',
    };
    const auditoria = buildAuditoriaPorPaso([evento]);
    auditoria.parameters = {
      paso: 'parameters',
      estado: 'pendiente',
      accionPrincipal: 'Pendiente de registro',
      usuarioId: null,
      usuarioNombre: '—',
      fechaAccion: null,
      integridad: { estadoIntegridad: 'noDisponible' },
      requiereAprobacion: false,
    };
    const resumen = construirResumenTrazabilidadPasoActual('parameters', auditoria, [evento]);
    expect(resumen.responsableNombre).toBe('responsable@empresa.cl');
    expect(resumen.ultimoEvento).toBe('Base de parámetros recién guardada');
    expect(resumen.integridadEstado).toBe('registrado');
  });
});
