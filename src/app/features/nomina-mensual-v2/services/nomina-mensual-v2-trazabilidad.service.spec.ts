import { TestBed } from '@angular/core/testing';
import { describe, expect, it, vi } from 'vitest';

import { AuthService } from '../../../core/auth/auth.service';
import { PeriodoActivoService } from '../../../core/services/periodo-activo.service';
import { LiquidacionesOficialesRepository } from '../../liquidaciones-oficiales/data-access/liquidaciones-oficiales.repository';
import { NominaCalculoSnapshotRepository } from '../../nomina-mensual/data-access/nomina-calculo-snapshot.repository';
import { NominaMensualV2TrazabilidadService } from './nomina-mensual-v2-trazabilidad.service';

describe('NominaMensualV2TrazabilidadService', () => {
  it('reconstruye liquidaciones generadas desde BD al recargar', async () => {
    TestBed.configureTestingModule({
      providers: [
        NominaMensualV2TrazabilidadService,
        {
          provide: NominaCalculoSnapshotRepository,
          useValue: {
            listarSnapshotsPeriodo: vi.fn().mockResolvedValue([]),
            obtenerSnapshotActivo: vi.fn().mockResolvedValue({
              idCalculoPeriodo: 15,
              periodo: '2026-05',
              estado: 'preliminar',
              fechaGeneracion: '2026-05-10T09:00:00.000Z',
              usuarioGenerador: 'rrhh@empresa.cl',
              hashSnapshot: 'fnv1a32:12345678',
              activo: true,
              reemplazadoPor: null,
              trabajadores: [],
              issues: [],
              trazabilidad: [],
            }),
          },
        },
        {
          provide: LiquidacionesOficialesRepository,
          useValue: {
            obtenerLiquidacionPeriodo: vi.fn().mockResolvedValue({
              idLiquidacionPeriodo: 7,
              idCalculoPeriodo: 15,
              periodo: '2026-05',
              estado: 'generada',
              fechaGeneracion: '2026-05-10T10:00:00.000Z',
              usuarioGeneracionId: null,
              usuarioGeneracionLabel: null,
              totalTrabajadores: 2,
              totalHaberes: 100,
              totalDescuentos: 20,
              totalLiquido: 80,
              metadata: {
                usuarioResponsable: {
                  id: '00000000-0000-0000-0000-000000000007',
                  nombre: 'liquidador@empresa.cl',
                },
              },
            }),
          },
        },
        {
          provide: PeriodoActivoService,
          useValue: { periodoYm: () => '2026-05' },
        },
        {
          provide: AuthService,
          useValue: { currentUser: () => null },
        },
      ],
    });

    const service = TestBed.inject(NominaMensualV2TrazabilidadService);
    const eventos = await service.cargarEventosServidor('2026-05');
    const liquidacion = eventos.find((evento) => evento.tipoEvento === 'LIQUIDACIONES_GENERADAS');

    expect(liquidacion?.usuarioId).toBe('00000000-0000-0000-0000-000000000007');
    expect(liquidacion?.usuarioNombre).toBe('liquidador@empresa.cl');
    expect(liquidacion?.origen).toBe('servidor');
  });

  it('prefiere la trazabilidad guardada en BD sobre eventos locales equivalentes', async () => {
    TestBed.configureTestingModule({
      providers: [
        NominaMensualV2TrazabilidadService,
        {
          provide: NominaCalculoSnapshotRepository,
          useValue: {
            listarSnapshotsPeriodo: vi.fn().mockResolvedValue([
              {
                idCalculoPeriodo: 21,
                periodo: '2026-05',
                estado: 'borrador',
                fechaGeneracion: '2026-05-10T09:00:00.000Z',
                usuarioGenerador: '00000000-0000-0000-0000-000000000021',
                versionMotor: 'PARAMETROS-BASE-01',
                hashSnapshot: 'fnv1a32:param',
                activo: true,
                reemplazadoPor: null,
                trabajadores: [],
                issues: [],
                trazabilidad: [],
                parametros: [],
                metadataOperativa: {
                  tipoSnapshot: 'parametrosBase',
                  origenAlGuardar: 'recienGuardada',
                  resumenParametrosBase: { seccionesListas: 2, seccionesTotales: 2 },
                  usuarioResponsable: {
                    id: '00000000-0000-0000-0000-000000000021',
                    nombre: 'responsable.bd@empresa.cl',
                  },
                },
              },
            ]),
            obtenerSnapshotActivo: vi.fn().mockResolvedValue(null),
            listarParametrosSnapshot: vi.fn().mockResolvedValue([]),
          },
        },
        {
          provide: LiquidacionesOficialesRepository,
          useValue: {
            obtenerLiquidacionPeriodo: vi.fn().mockResolvedValue(null),
          },
        },
        {
          provide: PeriodoActivoService,
          useValue: { periodoYm: () => '2026-05' },
        },
        {
          provide: AuthService,
          useValue: { currentUser: () => null },
        },
      ],
    });

    const service = TestBed.inject(NominaMensualV2TrazabilidadService);
    const local = service.crearEventoLocal({
      periodo: '2026-05',
      paso: 'parameters',
      tipoEvento: 'PARAMETROS_CONGELADOS',
      descripcion: 'Registro temporal del flujo feliz',
      integridad: { estadoIntegridad: 'pendiente' },
    });

    const resultado = await service.recomputar({
      eventosLocales: [{ ...local, fechaEvento: '2026-05-10T10:00:00.000Z' }],
      incluirMockSiVacio: false,
    });

    const eventosParametros = resultado.eventos.filter((evento) => evento.paso === 'parameters');

    expect(eventosParametros).toHaveLength(1);
    expect(eventosParametros[0].origen).toBe('servidor');
    expect(resultado.auditoriaPorPaso.parameters?.usuarioNombre).toBe('responsable.bd@empresa.cl');
    expect(resultado.auditoriaPorPaso.parameters?.accionPrincipal).toBe('Base de parámetros recién guardada');
  });

  it('no inyecta eventos mock cuando servidor y locales están vacíos (por defecto)', async () => {
    TestBed.configureTestingModule({
      providers: [
        NominaMensualV2TrazabilidadService,
        {
          provide: NominaCalculoSnapshotRepository,
          useValue: {
            listarSnapshotsPeriodo: vi.fn().mockResolvedValue([]),
            obtenerSnapshotActivo: vi.fn().mockResolvedValue(null),
          },
        },
        {
          provide: LiquidacionesOficialesRepository,
          useValue: { obtenerLiquidacionPeriodo: vi.fn().mockResolvedValue(null) },
        },
        { provide: PeriodoActivoService, useValue: { periodoYm: () => '2026-05' } },
        { provide: AuthService, useValue: { currentUser: () => null } },
      ],
    });

    const service = TestBed.inject(NominaMensualV2TrazabilidadService);
    const resultado = await service.recomputar({ eventosLocales: [] });

    expect(resultado.eventos).toHaveLength(0);
    expect(resultado.eventos.some((e) => e.origen === 'mock')).toBe(false);
  });

  it('carga trazabilidad scoped por nominaPeriodoId sin mezclar otras nóminas del mes', async () => {
    const listarSnapshotsNomina = vi.fn().mockResolvedValue([
      {
        idCalculoPeriodo: 31,
        nominaPeriodoId: 'nom-a',
        periodo: '2026-05',
        estado: 'borrador',
        fechaGeneracion: '2026-05-11T09:00:00.000Z',
        usuarioGenerador: '00000000-0000-0000-0000-000000000031',
        versionMotor: 'PARAMETROS-BASE-01',
        hashSnapshot: 'fnv1a32:a',
        activo: true,
        reemplazadoPor: null,
        trabajadores: [],
        issues: [],
        trazabilidad: [],
        parametros: [{ grupo: 'g', clave: 'uf', valor: '1', valorNumerico: null, vigencia: null, origen: 'pg' }],
        metadataOperativa: {
          tipoSnapshot: 'parametrosBase',
          origenAlGuardar: 'recienGuardada',
          resumenParametrosBase: { seccionesListas: 2, seccionesTotales: 2 },
        },
      },
    ]);
    TestBed.configureTestingModule({
      providers: [
        NominaMensualV2TrazabilidadService,
        {
          provide: NominaCalculoSnapshotRepository,
          useValue: {
            listarSnapshotsNomina,
            listarSnapshotsPeriodo: vi.fn(),
            obtenerSnapshotActivo: vi.fn(),
            listarParametrosSnapshot: vi.fn(),
          },
        },
        {
          provide: LiquidacionesOficialesRepository,
          useValue: { obtenerLiquidacionPeriodo: vi.fn().mockResolvedValue(null) },
        },
        { provide: PeriodoActivoService, useValue: { periodoYm: () => '2026-05' } },
        { provide: AuthService, useValue: { currentUser: () => null } },
      ],
    });

    const service = TestBed.inject(NominaMensualV2TrazabilidadService);
    const eventos = await service.cargarEventosServidor('2026-05', 'nom-a');

    expect(listarSnapshotsNomina).toHaveBeenCalledWith('nom-a');
    expect(eventos.some((e) => e.tipoEvento === 'PARAMETROS_CONGELADOS')).toBe(true);
    expect(eventos.every((e) => e.periodo === '2026-05')).toBe(true);
  });
});
