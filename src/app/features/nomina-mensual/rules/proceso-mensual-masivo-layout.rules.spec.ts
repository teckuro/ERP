import { describe, expect, it } from 'vitest';

import type { BaseNominaTrazabilidad } from '../models/proceso-mensual.model';
import type { ExpedienteNominaPeriodoView } from './proceso-mensual-expediente-periodo.rules';
import type { IncidenciaPeriodo } from './proceso-mensual-incidencias-periodo.rules';
import type { ResultadoPreliminarView } from '../containers/proceso-mensual-container/models/proceso-mensual-container.vm';
import {
  buildAccionRecomendadaTrabajador,
  buildDetalleMasivoTrabajador,
  buildFilasMasivasTrabajadores,
  buildMovimientosPanelPorTrabajador,
  buildResumenMasivoDesdeFilas,
  buildResumenMasivoNomina,
  filtrarFilasMasivasTrabajadores,
  type BuildNominaMasivaInput,
} from './proceso-mensual-masivo-layout.rules';

const resultadoTrabajadores: ResultadoPreliminarView['trabajadores'] = [
  {
    idPersona: 1,
    trabajadorLabel: 'Ana Perez',
    rutLabel: '11.111.111-1',
    estadoLabel: 'Calculado',
    haberesLabel: '$800.000',
    descuentosLabel: '$150.000',
    liquidoLabel: '$650.000',
    observacionLabel: 'Sin observaciones',
  },
  {
    idPersona: 2,
    trabajadorLabel: 'Bruno Soto',
    rutLabel: '22.222.222-2',
    estadoLabel: 'Con observaciones',
    haberesLabel: '$900.000',
    descuentosLabel: '$200.000',
    liquidoLabel: '$700.000',
    observacionLabel: 'Revisar descuento',
  },
  {
    idPersona: 'omitido-3',
    trabajadorLabel: 'Carla Diaz',
    rutLabel: '33.333.333-3',
    estadoLabel: 'Omitido',
    haberesLabel: 'Monto no disponible',
    descuentosLabel: 'Monto no disponible',
    liquidoLabel: 'Monto no disponible',
    observacionLabel: 'Ficha incompleta',
  },
];

const expedienteTrabajadores: ExpedienteNominaPeriodoView['trabajadores'] = [
  {
    idPersona: 4,
    nombre: 'Daniel Rojas',
    rut: '44.444.444-4',
    estado: 'listo',
    totalHaberes: 700000,
    totalDescuentos: 100000,
    totalLiquido: 600000,
    observaciones: [],
  },
];

const baseTrabajadores: BaseNominaTrazabilidad['trabajadores'] = [
  {
    idPersona: 5,
    trabajadorLabel: 'Elena Vera',
    rutLabel: '55.555.555-5',
    contratoLabel: 'Contrato',
    estado: 'excluido',
    asignacionesRecurrentes: 0,
    movimientosDelMes: 0,
    observacion: 'Sin calculo',
  },
];

const incidencias: IncidenciaPeriodo[] = [
  {
    id: 'TRAB-2',
    severidad: 'advertencia',
    ambito: 'trabajadores',
    titulo: 'Revisar trabajador',
    detalle: 'Revisar ficha',
    origen: 'trabajador',
    prioridad: 20,
    idPersona: 2,
  },
  {
    id: 'TRAB-3',
    severidad: 'bloqueo',
    ambito: 'trabajadores',
    titulo: 'Trabajador bloqueado',
    detalle: 'Ficha incompleta',
    origen: 'trabajador',
    prioridad: 20,
    idPersona: 3,
  },
  {
    id: 'PARAM-UF',
    severidad: 'bloqueo',
    ambito: 'parametros',
    titulo: 'Parametro global',
    detalle: 'No debe repetirse en trabajador',
    origen: 'prevalidacion',
    prioridad: 10,
  },
];

function input(overrides: Partial<BuildNominaMasivaInput> = {}): BuildNominaMasivaInput {
  return {
    resultadoTrabajadores,
    expedienteTrabajadores,
    baseTrabajadores,
    montosOficialesDisponibles: true,
    filasMovimientos: [
      {
        trabajador: 'Ana Perez',
        concepto: 'Bono',
        tipo: 'Haber',
        monto: '$50.000',
        estado: 'Aprobado',
        accion: 'Sin accion pendiente',
      },
    ],
    filasRecurrentes: [
      {
        trabajador: 'Bruno Soto',
        concepto: 'Asignacion',
        periodicidad: 'Mensual',
        monto: '$25.000',
        estado: 'Considerada',
        accion: 'Sin accion pendiente',
      },
    ],
    incidencias,
    ...overrides,
  };
}

describe('proceso-mensual-masivo-layout.rules', () => {
  it('construye resumen masivo con totales por estado y actividad', () => {
    expect(buildResumenMasivoNomina(input())).toEqual({
      totalTrabajadores: 5,
      listos: 2,
      conObservaciones: 1,
      bloqueados: 1,
      conMovimientos: 1,
      sinMovimientos: 4,
      conRecurrentes: 1,
    });
  });

  it('genera filas compactas sin detalle expandido y conserva montos faltantes como null', () => {
    const filas = buildFilasMasivasTrabajadores(input());
    const carla = filas.find((fila) => fila.trabajador === 'Carla Diaz');

    expect(filas).toHaveLength(5);
    expect(carla?.haberes).toBeNull();
    expect(carla).not.toHaveProperty('incidencias');
    expect(carla).not.toHaveProperty('movimientos');
    expect(carla?.movimientosCount).toBe(0);
    expect(carla?.incidenciasCount).toBe(1);
  });

  it('expone conteos de movimientos e incidencias por trabajador', () => {
    const ana = buildFilasMasivasTrabajadores(input()).find((fila) => fila.trabajador === 'Ana Perez');
    const bruno = buildFilasMasivasTrabajadores(input()).find((fila) => fila.trabajador === 'Bruno Soto');

    expect(ana?.movimientosCount).toBe(1);
    expect(bruno?.movimientosCount).toBe(1);
    expect(bruno?.incidenciasCount).toBe(1);
  });

  it('filtra por todos los estados operativos', () => {
    const filas = buildFilasMasivasTrabajadores(input());

    expect(filtrarFilasMasivasTrabajadores(filas, 'todos', '')).toHaveLength(5);
    expect(filtrarFilasMasivasTrabajadores(filas, 'bloqueados', '').map((fila) => fila.trabajador)).toEqual(['Carla Diaz']);
    expect(filtrarFilasMasivasTrabajadores(filas, 'observaciones', '').map((fila) => fila.trabajador)).toEqual(['Bruno Soto']);
    expect(filtrarFilasMasivasTrabajadores(filas, 'listos', '').map((fila) => fila.trabajador)).toEqual(['Ana Perez', 'Daniel Rojas']);
    expect(filtrarFilasMasivasTrabajadores(filas, 'con_movimientos', '').map((fila) => fila.trabajador)).toEqual(['Ana Perez']);
    expect(filtrarFilasMasivasTrabajadores(filas, 'sin_movimientos', '')).toHaveLength(4);
    expect(filtrarFilasMasivasTrabajadores(filas, 'con_recurrentes', '').map((fila) => fila.trabajador)).toEqual(['Bruno Soto']);
  });

  it('filtra por busqueda de nombre y RUT', () => {
    const filas = buildFilasMasivasTrabajadores(input());

    expect(filtrarFilasMasivasTrabajadores(filas, 'todos', 'ana').map((fila) => fila.trabajador)).toEqual(['Ana Perez']);
    expect(filtrarFilasMasivasTrabajadores(filas, 'todos', '22222222').map((fila) => fila.trabajador)).toEqual(['Bruno Soto']);
  });

  it('no convierte totales cero del borrador en montos visibles antes del calculo', () => {
    const filas = buildFilasMasivasTrabajadores(input({
      montosOficialesDisponibles: false,
      resultadoTrabajadores: [],
      baseTrabajadores: [{
        idPersona: 9,
        trabajadorLabel: 'Finalizar Alta Prueba Borrador',
        rutLabel: '33.772.972-K',
        contratoLabel: 'Contrato vigente',
        estado: 'listo',
        asignacionesRecurrentes: 1,
        movimientosDelMes: 1,
        observacion: 'Sin observaciones',
      }],
      expedienteTrabajadores: [{
        idPersona: 9,
        nombre: 'Finalizar Alta Prueba Borrador',
        rut: '33.772.972-K',
        estado: 'listo',
        totalHaberes: 0,
        totalDescuentos: 0,
        totalLiquido: 0,
        observaciones: [],
      }],
    }));

    expect(filas).toHaveLength(1);
    expect(filas[0]?.haberes).toBeNull();
    expect(filas[0]?.descuentos).toBeNull();
    expect(filas[0]?.liquidoEstimado).toBeNull();
  });

  it('estima montos desde entradas cuando la base borrador aun no calcula', () => {
    const filas = buildFilasMasivasTrabajadores(input({
      montosOficialesDisponibles: false,
      resultadoTrabajadores: [],
      baseTrabajadores: [{
        idPersona: 9,
        trabajadorLabel: 'Finalizar Alta Prueba Borrador',
        rutLabel: '33.772.972-K',
        contratoLabel: 'Contrato vigente',
        estado: 'listo',
        asignacionesRecurrentes: 1,
        movimientosDelMes: 2,
        observacion: 'Sin observaciones',
      }],
      expedienteTrabajadores: [{
        idPersona: 9,
        nombre: 'Finalizar Alta Prueba Borrador',
        rut: '33.772.972-K',
        estado: 'listo',
        totalHaberes: 0,
        totalDescuentos: 0,
        totalLiquido: 0,
        observaciones: [],
      }],
      entradasMensuales: [{
        idEntrada: 'novedad:1',
        origen: 'novedad_mensual',
        origenId: 1,
        periodo: '2026-05',
        idPersona: 9,
        idContrato: 10,
        idConcepto: 1,
        tipoEntrada: 'haber',
        categoria: 'haber_variable',
        tipoMovimiento: 'haber',
        cantidad: null,
        unidad: null,
        monto: 500000,
        moneda: 'CLP',
        estado: 'aprobada',
        fechaEvento: null,
        observacion: null,
        referenciaExterna: null,
        requiereRevision: false,
        bloqueaProceso: false,
        warnings: [],
        metadata: {},
      }, {
        idEntrada: 'novedad:2',
        origen: 'novedad_mensual',
        origenId: 2,
        periodo: '2026-05',
        idPersona: 9,
        idContrato: 10,
        idConcepto: 2,
        tipoEntrada: 'descuento',
        categoria: 'descuento_variable',
        tipoMovimiento: 'descuento',
        cantidad: null,
        unidad: null,
        monto: 50000,
        moneda: 'CLP',
        estado: 'aprobada',
        fechaEvento: null,
        observacion: null,
        referenciaExterna: null,
        requiereRevision: false,
        bloqueaProceso: false,
        warnings: [],
        metadata: {},
      }],
    }));

    expect(filas).toHaveLength(1);
    expect(filas[0]?.montosEstimadosDesdeEntradas).toBe(true);
    expect(filas[0]?.haberes).toBe(500000);
    expect(filas[0]?.descuentos).toBe(50000);
    expect(filas[0]?.liquidoEstimado).toBe(450000);
  });

  it('construye detalle solo para el trabajador seleccionado', () => {
    const detalle = buildDetalleMasivoTrabajador({ ...input(), idPersona: 1 });

    expect(detalle?.trabajador).toBe('Ana Perez');
    expect(detalle?.movimientos).toHaveLength(1);
    expect(detalle?.recurrentes).toHaveLength(0);
  });

  it('filtra incidencias por idPersona y no duplica incidencias globales', () => {
    const detalle = buildDetalleMasivoTrabajador({ ...input(), idPersona: 2 });

    expect(detalle?.incidencias).toHaveLength(1);
    expect(detalle?.incidencias[0].id).toBe('TRAB-2');
    expect(detalle?.incidencias.some((incidencia) => incidencia.id === 'PARAM-UF')).toBe(false);
  });

  it('buildMovimientosPanelPorTrabajador unifica movimientos del detalle', () => {
    const detalle = buildDetalleMasivoTrabajador({ ...input(), idPersona: 2 });
    expect(detalle).not.toBeNull();
    const rows = buildMovimientosPanelPorTrabajador(detalle!, 'Mayo 2026');
    expect(rows.some((row) => row.origenDuracion === 'Recurrente')).toBe(true);
  });

  it('buildResumenMasivoDesdeFilas cuenta filas mergeadas (regresión pre-borrador)', () => {
    const resumen = buildResumenMasivoDesdeFilas([
      {
        idPersona: 99,
        trabajador: 'Pendiente Ficha',
        rut: '9.999.999-9',
        estado: 'bloqueado',
        haberes: null,
        descuentos: null,
        liquidoEstimado: null,
        pendientes: 1,
        incidenciasCount: 1,
        movimientosCount: 0,
        tieneMovimientos: false,
        tieneRecurrentes: false,
      },
    ]);
    expect(resumen.totalTrabajadores).toBe(1);
    expect(resumen.bloqueados).toBe(1);
  });

  it('buildAccionRecomendadaTrabajador prioriza bloqueos', () => {
    const detalle = buildDetalleMasivoTrabajador({ ...input(), idPersona: 2 });
    expect(detalle).not.toBeNull();
    const accion = buildAccionRecomendadaTrabajador(detalle!.incidencias, detalle!.estado);
    expect(accion.tono).toBe('atencion');
    expect(accion.titulo).toBe('Pendiente de revisión');
  });
});
