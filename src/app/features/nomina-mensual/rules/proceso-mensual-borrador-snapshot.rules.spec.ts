import { describe, expect, it } from 'vitest';

import type {
  BaseNominaTrazabilidad,
  ProcesoMensualPreNominaPeriodo,
  ProcesoMensualPrevalidacion,
} from '../models/proceso-mensual.model';
import {
  buildBorradorSnapshotFromPreNomina,
  extractBorradorPersistContext,
  mapSnapshotCompletoToBaseTrazabilidad,
} from './proceso-mensual-borrador-snapshot.rules';

const trazabilidadBase: BaseNominaTrazabilidad = {
  trabajadores: [
    {
      idPersona: 1,
      trabajadorLabel: 'Ana Perez',
      rutLabel: '11.111.111-1',
      contratoLabel: 'Indefinido',
      estado: 'listo',
      asignacionesRecurrentes: 2,
      movimientosDelMes: 1,
      observacion: '',
    },
    {
      idPersona: 2,
      trabajadorLabel: 'Luis Gomez',
      rutLabel: '22.222.222-2',
      contratoLabel: 'Plazo fijo',
      estado: 'con_observaciones',
      asignacionesRecurrentes: 0,
      movimientosDelMes: 3,
      observacion: 'Falta revisar contrato',
    },
  ],
  trabajadoresConsiderados: 2,
  listosParaCalculo: 1,
  conObservaciones: 1,
  bloqueados: 0,
  excluidos: 0,
  asignacionesRecurrentesIncluidas: 2,
  movimientosDelMesIncluidos: 4,
  parametrosEstado: 'listos',
  observacionParametros: '',
};

const preNominaBase: ProcesoMensualPreNominaPeriodo = {
  periodo: '2026-05',
  estado: 'GENERADA',
  generadoEn: '2026-05-18T10:00:00.000Z',
  trabajadoresIncluidos: 2,
  recurrentesIncluidos: 1,
  movimientosVariablesValidados: 4,
  movimientosVariablesBorrador: 0,
  parametrosOperativos: true,
  codigosBloqueo: [],
  codigosAdvertencia: ['ADV_TEST'],
  origenPrevalidacion: 'CON_ADVERTENCIAS',
  trazabilidad: trazabilidadBase,
};

const prevalidacionBase: ProcesoMensualPrevalidacion = {
  periodo: '2026-05',
  estado: 'CON_ADVERTENCIAS',
  resumen: {
    periodo: '2026-05',
    hayBloqueos: false,
    hayAdvertencias: true,
    conteoMovimientosPorEstado: {},
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
  advertencias: [
    {
      codigo: 'ADV_MOV',
      area: 'ENTRADAS_MENSUALES',
      severidad: 'ADVERTENCIA',
      texto: 'Hay movimientos por revisar.',
    },
  ],
  informaciones: [],
  trabajadoresPendientesRevision: [],
  items: [],
  entradasMensuales: [],
};

describe('proceso-mensual-borrador-snapshot.rules', () => {
  it('mapea preNomina a snapshot con trabajadores e issues', () => {
    const { snapshot, borradorPersist } = buildBorradorSnapshotFromPreNomina({
      periodo: '2026-05',
      preNomina: preNominaBase,
      prevalidacion: prevalidacionBase,
      fechaGeneracion: '2026-05-18T10:00:00.000Z',
      totalAdvertencias: 2,
    });

    expect(snapshot.estado).toBe('borrador');
    expect(snapshot.trabajadores).toHaveLength(2);
    expect(snapshot.trabajadores[0]?.estado).toBe('calculado_preliminar');
    expect(snapshot.trabajadores[1]?.issues[0]?.mensaje).toBe('Falta revisar contrato');
    expect(snapshot.issues.some((i) => i.codigo === 'ADV_MOV')).toBe(true);
    expect(snapshot.issues.some((i) => i.codigo === 'ADV_TEST')).toBe(true);
    expect(borradorPersist.resumenPrevalidacion?.periodo).toBe('2026-05');
  });

  it('extrae contexto de metadata persistida', () => {
    const context = extractBorradorPersistContext({
      borradorPersist: {
        entradasMensuales: [],
        resumenPrevalidacion: prevalidacionBase.resumen,
        prevalidacionEstado: 'LISTO_PARA_CALCULO',
      },
    });
    expect(context?.prevalidacionEstado).toBe('LISTO_PARA_CALCULO');
  });

  it('reconstruye trazabilidad base desde snapshot completo', () => {
    const trazabilidad = mapSnapshotCompletoToBaseTrazabilidad({
      cabecera: {
        periodo: '2026-05',
        idEmpresa: null,
        estado: 'borrador',
        fechaGeneracion: '2026-05-18T10:00:00.000Z',
        usuarioGenerador: null,
        totalTrabajadores: 1,
        totalHaberes: 0,
        totalDescuentos: 0,
        totalLiquido: 0,
        totalBloqueados: 0,
        totalAdvertencias: 0,
        versionMotor: 'BASE-NOMINA-01',
        hashSnapshot: null,
        origen: 'preliminar',
        activo: true,
        reemplazadoPor: null,
        aprobacionOperativa: null,
        cierreOperativo: null,
        trabajadores: [],
        issues: [],
        trazabilidad: [],
      },
      trabajadores: [
        {
          idPersona: 9,
          rut: '9.999.999-9',
          nombreCompletoSnapshot: 'Pedro Rios',
          estado: 'calculado_preliminar',
          sueldoBase: 0,
          baseImponiblePrevisional: 0,
          baseTributable: 0,
          totalHaberesImponibles: 0,
          totalHaberesNoImponibles: 0,
          totalDescuentosLegales: 0,
          totalDescuentosVoluntarios: 0,
          impuestoUnico: 0,
          liquidoPreliminar: 0,
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
      observaciones: [],
      trazabilidad: [],
      aprobacionOperativa: null,
      cierreOperativo: null,
      resumen: {
        totalConceptos: 0,
        totalObservaciones: 0,
        totalTrazas: 0,
        totalTrabajadoresSinDetalle: 0,
        esActivoVigente: true,
        fueReemplazado: false,
      },
    });

    expect(trazabilidad?.trabajadores).toHaveLength(1);
    expect(trazabilidad?.trabajadores[0]?.trabajadorLabel).toBe('Pedro Rios');
  });
});
