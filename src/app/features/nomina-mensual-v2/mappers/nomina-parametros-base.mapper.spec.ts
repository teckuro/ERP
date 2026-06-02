import { describe, expect, it } from 'vitest';

import {
  buildMetadataMantenerBaseConDiferencias,
  buildSnapshotParametrosBasePayload,
  esSnapshotParametrosBase,
  copyOrigenBaseAlAvanzar,
  leerMetadataParametrosBase,
  resolverOrigenBaseDesdeSnapshot,
} from './nomina-parametros-base.mapper';
import { VERSION_MOTOR_PARAMETROS_BASE, TIPO_SNAPSHOT_PARAMETROS_BASE } from '../models/nomina-parametros-base.models';
import type { NominaParametrosResumen } from '../models/nomina-parametros-resumen.models';

function resumenMinimo(): NominaParametrosResumen {
  return {
    periodo: '2026-05',
    completitud: 100,
    completitudSecciones: 100,
    seccionesTotales: 5,
    seccionesListas: 5,
    controlesTotales: 10,
    controlesVerificados: 10,
    totalParametros: 10,
    parametrosConfigurados: 10,
    bloqueos: 0,
    requiereRevision: 0,
    bloqueosPreparacion: 0,
    advertenciasOficiales: 0,
    completos: 10,
    puedeContinuar: true,
    puedePreparar: true,
    ultimaActualizacion: null,
    areas: [],
    bloqueosActuales: [],
    pendientesPreparacion: [],
    advertenciasNoBloqueantes: [],
    accesos: [],
  };
}

describe('nomina-parametros-base.mapper', () => {
  it('identifica snapshot parametrosBase por versionMotor', () => {
    expect(
      esSnapshotParametrosBase({
        versionMotor: VERSION_MOTOR_PARAMETROS_BASE,
      } as never),
    ).toBe(true);
    expect(
      esSnapshotParametrosBase({
        versionMotor: 'MOTOR-03B',
      } as never),
    ).toBe(false);
  });

  it('construye payload marcado parametrosBase sin trabajadores', () => {
    const resumen = resumenMinimo();
    const snapshot = buildSnapshotParametrosBasePayload({
      periodo: '2026-05',
      parametros: { periodo: '2026-05', uf: 39000 } as never,
      resumen,
      fechaGeneracion: '2026-05-29T12:00:00.000Z',
    });
    expect(snapshot.versionMotor).toBe(VERSION_MOTOR_PARAMETROS_BASE);
    expect(snapshot.totalTrabajadores).toBe(0);
    expect(snapshot.parametros?.length).toBeGreaterThan(0);
    expect(snapshot.trazabilidad?.[0]?.valorEntrada).toMatchObject({
      tipoSnapshot: TIPO_SNAPSHOT_PARAMETROS_BASE,
    });
  });

  it('expone copy legible del origen al avanzar', () => {
    expect(copyOrigenBaseAlAvanzar('recienGuardada')).toContain('recién guardada');
    expect(copyOrigenBaseAlAvanzar('existenteMantenidaConDiferencias')).toContain('mantenida');
  });

  it('lee metadata de base guardada en servidor', () => {
    const meta = leerMetadataParametrosBase({
      tipoSnapshot: 'parametrosBase',
      origenAlGuardar: 'actualizadaExplicitamente',
      resumenParametrosBase: {
        seccionesListas: 3,
        seccionesTotales: 5,
        controlesVerificados: 8,
        bloqueos: 0,
        requiereRevision: 1,
      },
    });
    expect(meta?.origenAlGuardar).toBe('actualizadaExplicitamente');
    expect(meta?.resumen?.seccionesListas).toBe(3);
  });

  it('resuelve origen por defecto si metadata incompleta', () => {
    const origen = resolverOrigenBaseDesdeSnapshot({
      metadataOperativa: { tipoSnapshot: 'parametrosBase' },
    } as never);
    expect(origen).toBe('existenteSinDiferencias');
  });

  it('arma metadata al mantener base con diferencias sin perder tipoSnapshot', () => {
    const resumen = resumenMinimo();
    const merged = buildMetadataMantenerBaseConDiferencias(
      resumen,
      {
        tipoSnapshot: 'parametrosBase',
        origenAlGuardar: 'recienGuardada',
        hashParametros: 'hash-previo',
      },
      { id: 'u-1', nombre: 'RRHH Test' },
      { hashBase: 'base-hash', hashActual: 'live-hash' },
    );
    expect(merged['tipoSnapshot']).toBe('parametrosBase');
    expect(merged['origenAlGuardar']).toBe('existenteMantenidaConDiferencias');
    expect(merged['fechaDecisionMantener']).toBeTruthy();
    expect(merged['hashParametrosBaseAlMantener']).toBe('base-hash');
    expect(merged['hashParametrosActualAlMantener']).toBe('live-hash');
    const leido = leerMetadataParametrosBase(merged as Record<string, unknown>);
    expect(leido?.origenAlGuardar).toBe('existenteMantenidaConDiferencias');
    expect(leido?.resumen?.origenAlGuardar).toBe('existenteMantenidaConDiferencias');
  });
});
