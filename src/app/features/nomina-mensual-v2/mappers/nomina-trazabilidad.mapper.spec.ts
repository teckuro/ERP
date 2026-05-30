import {
  buildAuditoriaPorPaso,
  mapSnapshotsToEventosTrazabilidad,
  mergeEventosTrazabilidad,
  resolverIntegridadDesdeSnapshot,
} from '../mappers/nomina-trazabilidad.mapper';
import type { NominaCalculoPeriodoSnapshot } from '../../nomina-mensual/models/proceso-mensual.model';

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

  it('mapea snapshot base de parámetros a evento PARAMETROS_CONGELADOS', () => {
    const eventos = mapSnapshotsToEventosTrazabilidad(
      [
        snapshotBase({
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
        }),
      ],
      null,
    );
    const paramEvent = eventos.find((e) => e.paso === 'parameters');
    expect(paramEvent?.tipoEvento).toBe('PARAMETROS_CONGELADOS');
    expect(paramEvent?.origen).toBe('servidor');
    expect(paramEvent?.descripcion).toContain('recién guardada');
    expect(eventos.some((e) => e.paso === 'calculation')).toBe(false);
  });

  it('construye auditoría por paso con pendientes', () => {
    const auditoria = buildAuditoriaPorPaso([]);
    expect(auditoria.parameters?.estado).toBe('pendiente');
    expect(auditoria.approval?.requiereAprobacion).toBe(true);
  });
});
