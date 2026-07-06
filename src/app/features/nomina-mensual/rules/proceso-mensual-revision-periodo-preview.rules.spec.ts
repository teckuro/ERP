import { describe, expect, it } from 'vitest';

import type { ValidacionCalculoPreliminarView } from '../containers/proceso-mensual-container/models/proceso-mensual-container.vm';
import type { IncidenciasPeriodoView } from './proceso-mensual-incidencias-periodo.rules';
import type { ProcesoMensualPendienteVm } from './proceso-mensual-estado-operativo.rules';
import { buildRevisionPeriodoPreview } from './proceso-mensual-revision-periodo-preview.rules';

function validacionBase(overrides: Partial<ValidacionCalculoPreliminarView> = {}): ValidacionCalculoPreliminarView {
  return {
    estado: 'listo',
    estadoLabel: 'Listo',
    puedeCalcular: true,
    siguienteAccion: {
      label: 'Generar nómina',
      descripcion: 'Valida el período.',
      accionLocal: 'validarPeriodo',
    },
    bloqueos: [],
    advertencias: [],
    informaciones: [],
    ...overrides,
  };
}

const incidenciasVacias: IncidenciasPeriodoView = {
  todas: [],
  porAmbito: {
    periodo: [],
    parametros: [],
    trabajadores: [],
    movimientos: [],
    recurrentes: [],
    calculo: [],
    resultado: [],
  },
  porDetalleTab: {
    resumen: [],
    trabajadores: [],
    parametros: [],
    movimientos_recurrentes: [],
    resultado: [],
  },
  resumen: { bloqueos: 0, advertencias: 0, infos: 0 },
};

const dashboardBase = {
  parametrosListos: true as boolean | null,
  trabajadoresAptos: 10 as number | null,
  trabajadoresPorRevisar: 0 as number | null,
  movimientosAprobados: 5,
  movimientosPendientes: 0,
  asignacionesAplicables: 3 as number | null,
  asignacionesPorRevisar: 0 as number | null,
};

describe('proceso-mensual-revision-periodo-preview.rules', () => {
  it('oculta preview cuando la base ya está generada', () => {
    const vm = buildRevisionPeriodoPreview({
      baseGenerada: true,
      tienePrevalidacion: true,
      puedeGenerarNomina: false,
      prevalidacionEstado: null,
      queFaltaAhora: [],
      validacionCalculo: validacionBase(),
      dashboard: dashboardBase,
      fichasPendientesCount: 0,
      incidencias: incidenciasVacias,
    });
    expect(vm.visible).toBe(false);
  });

  it('sin prevalidación muestra Verificar período y título Qué falta ahora', () => {
    const vm = buildRevisionPeriodoPreview({
      baseGenerada: false,
      tienePrevalidacion: false,
      puedeGenerarNomina: false,
      prevalidacionEstado: null,
      queFaltaAhora: [],
      validacionCalculo: validacionBase(),
      dashboard: dashboardBase,
      fichasPendientesCount: 0,
      incidencias: incidenciasVacias,
    });
    expect(vm.visible).toBe(true);
    expect(vm.sinVerificar).toBe(true);
    expect(vm.tituloSeccion).toBe('Qué falta ahora');
    expect(vm.tituloModal).toBe('Revisión del período antes de generar');
    expect(vm.accionPrincipal?.tipo).toBe('validar_periodo');
    expect(vm.metricas).toBeNull();
    expect(vm.ejes).toHaveLength(0);
  });

  it('prioriza queFaltaAhora en pendientes (máx. 5)', () => {
    const queFalta: ProcesoMensualPendienteVm[] = Array.from({ length: 6 }, (_, i) => ({
      codigo: `P-${i}`,
      titulo: `Pendiente ${i}`,
      descripcion: `Detalle ${i}`,
      severidad: 'warning' as const,
      accionLabel: `Ir ${i}`,
    }));
    const vm = buildRevisionPeriodoPreview({
      baseGenerada: false,
      tienePrevalidacion: true,
      puedeGenerarNomina: false,
      prevalidacionEstado: 'CON_ADVERTENCIAS',
      queFaltaAhora: queFalta,
      validacionCalculo: validacionBase(),
      dashboard: dashboardBase,
      fichasPendientesCount: 0,
      incidencias: incidenciasVacias,
    });
    expect(vm.pendientes).toHaveLength(5);
    expect(vm.pendientes[0].codigo).toBe('P-0');
  });

  it('con fichas pendientes prioriza revisar trabajadores', () => {
    const vm = buildRevisionPeriodoPreview({
      baseGenerada: false,
      tienePrevalidacion: true,
      puedeGenerarNomina: true,
      prevalidacionEstado: 'CON_ADVERTENCIAS',
      queFaltaAhora: [],
      validacionCalculo: validacionBase(),
      dashboard: dashboardBase,
      fichasPendientesCount: 2,
      incidencias: incidenciasVacias,
    });
    expect(vm.accionPrincipal?.tipo).toBe('revisar_fichas');
    expect(vm.accionPrincipal?.label).toBe('Revisar trabajadores');
    expect(vm.metricas?.trabajadoresPendientes).toBe(2);
    expect(vm.ejes.some((e) => e.id === 'trabajadores' && e.estado === 'pendiente')).toBe(true);
  });

  it('expone cuatro ejes del contrato tras verificar', () => {
    const vm = buildRevisionPeriodoPreview({
      baseGenerada: false,
      tienePrevalidacion: true,
      puedeGenerarNomina: true,
      prevalidacionEstado: 'LISTO_PARA_CALCULO',
      queFaltaAhora: [],
      validacionCalculo: validacionBase(),
      dashboard: dashboardBase,
      fichasPendientesCount: 0,
      incidencias: incidenciasVacias,
    });
    expect(vm.ejes.map((e) => e.id)).toEqual(['parametros', 'trabajadores', 'movimientos', 'recurrentes']);
    expect(vm.accionPrincipal?.tipo).toBe('generar_nomina');
  });
});
