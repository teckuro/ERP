import { describe, expect, it } from 'vitest';
import type { EmpleadoListado } from '../../empleados/models/empleado-listado.model';
import type { EntradaMensualPeriodo } from '../entradas/models/entrada-mensual-periodo.model';
import {
  buildDetalleCorreccionFicha,
  buildFilasMasivasDesdePendientesRevision,
  buildIncidenciasFichaPendiente,
  buildItemsTrabajadoresPendientesModal,
  buildTrabajadoresPendientesRevision,
  CODIGO_INCIDENCIA_FICHA_PENDIENTE,
  evaluarAptitudOperativaNominaTrabajador,
  formatTrabajadorPendienteRevisionLinea,
  humanizarBloqueoCompletitudFicha,
  mergeFilasMasivasConPendientesRevision,
  motivoTrabajadorPendienteRevision,
} from './proceso-mensual-trabajadores-prevalidacion.rules';

function empleado(over: Partial<EmpleadoListado> = {}): EmpleadoListado {
  return {
    id: 1,
    idContrato: 10,
    rut: '12.345.678-9',
    nombre: 'Ana Perez',
    cargo: 'Analista',
    departamento: 'RRHH',
    fechaIngreso: '2024-01-01',
    sueldoBase: 1_000_000,
    monedaContrato: null,
    estado: 'activo',
    estadoFicha: 'VALIDO',
    aptoParaRemuneraciones: true,
    pasoAltaAvanzada: null,
    ...over,
  };
}

function entradaBloqueante(over: Partial<EntradaMensualPeriodo> = {}): EntradaMensualPeriodo {
  return {
    idEntrada: 'novedad:1',
    origen: 'novedad_mensual',
    origenId: 1,
    periodo: '2026-05',
    idPersona: 1,
    idContrato: 10,
    idConcepto: 1,
    tipoEntrada: 'haber',
    categoria: 'haber_variable',
    tipoMovimiento: 'haber',
    cantidad: null,
    unidad: null,
    monto: 1000,
    moneda: 'CLP',
    estado: 'observada',
    fechaEvento: null,
    observacion: null,
    referenciaExterna: null,
    requiereRevision: true,
    bloqueaProceso: true,
    warnings: ['Bloquea proceso'],
    metadata: {},
    ...over,
  };
}

describe('proceso-mensual-trabajadores-prevalidacion.rules', () => {
  it('devuelve lista vacia sin activos pendientes', () => {
    expect(buildTrabajadoresPendientesRevision([empleado(), empleado({ id: 2, estado: 'inactivo' })])).toEqual([]);
  });

  it('incluye activo no apto con motivo legible', () => {
    const lista = buildTrabajadoresPendientesRevision([
      empleado({ id: 2, nombre: 'Luis Gomez', aptoParaRemuneraciones: false }),
    ]);
    expect(lista).toHaveLength(1);
    expect(lista[0].motivo).toBe('No apto para remuneraciones');
    expect(lista[0].detalleCorreccion).toBe('Completar la ficha para habilitar remuneraciones.');
    expect(formatTrabajadorPendienteRevisionLinea(lista[0])).toContain('Luis Gomez');
  });

  it('humaniza bloqueo de alta avanzada y arma detalle en pendiente', () => {
    expect(
      humanizarBloqueoCompletitudFicha(
        'Continua el alta avanzada antes de validar la ficha para remuneraciones.',
      ),
    ).toBe('Continuar alta avanzada.');
    expect(buildDetalleCorreccionFicha(empleado({ pasoAltaAvanzada: 2 }))).toBe('Continuar alta avanzada.');
  });

  it('ordena no aptos antes que ficha incompleta y luego por nombre', () => {
    const lista = buildTrabajadoresPendientesRevision([
      empleado({ id: 2, nombre: 'Zoe Vega', estadoFicha: 'INCOMPLETO', aptoParaRemuneraciones: true }),
      empleado({ id: 3, nombre: 'Ana Norte', aptoParaRemuneraciones: false }),
      empleado({ id: 4, nombre: 'Bruno Sur', estadoFicha: 'BORRADOR', aptoParaRemuneraciones: true }),
    ]);
    expect(lista.map((t) => t.nombre)).toEqual(['Ana Norte', 'Bruno Sur', 'Zoe Vega']);
  });

  it('combina motivos de ficha y aptitud', () => {
    expect(
      motivoTrabajadorPendienteRevision(
        empleado({ estadoFicha: 'INCOMPLETO', aptoParaRemuneraciones: false }),
      ),
    ).toBe('Ficha incompleta · No apto para remuneraciones');
  });

  it('limita items del modal y agrega desborde', () => {
    const trabajadores = buildTrabajadoresPendientesRevision(
      Array.from({ length: 10 }, (_, i) =>
        empleado({ id: i + 1, nombre: `Trabajador ${i + 1}`, aptoParaRemuneraciones: false }),
      ),
    );
    const items = buildItemsTrabajadoresPendientesModal(trabajadores, 8);
    expect(items).toHaveLength(9);
    expect(items[8]).toBe('... y 2 mas en la pestaña Trabajadores');
  });

  it('arma filas masivas bloqueadas sin montos', () => {
    const pendientes = buildTrabajadoresPendientesRevision([
      empleado({ id: 5, aptoParaRemuneraciones: false }),
    ]);
    const filas = buildFilasMasivasDesdePendientesRevision(pendientes);
    expect(filas[0].estado).toBe('bloqueado');
    expect(filas[0].liquidoEstimado).toBeNull();
    expect(filas[0].incidenciasCount).toBe(1);
  });

  it('arma incidencia bloqueante de ficha con ruta a empleados', () => {
    const pendientes = buildTrabajadoresPendientesRevision([
      empleado({ id: 9, estadoFicha: 'INCOMPLETO' }),
    ]);
    const inc = buildIncidenciasFichaPendiente(pendientes)[0];
    expect(inc.id).toBe(CODIGO_INCIDENCIA_FICHA_PENDIENTE);
    expect(inc.severidad).toBe('bloqueo');
    expect(inc.detalle).toContain('Ficha incompleta');
    expect(inc.detalle).toContain('Revisar datos personales');
    expect(inc.accion?.label).toBe('Completar ficha');
    expect(inc.accion?.destino).toBe('/empleados/9');
  });

  it('merge prioriza fila pendiente sobre base con mismo id', () => {
    const merged = mergeFilasMasivasConPendientesRevision(
      [
        {
          idPersona: 1,
          trabajador: 'Base',
          rut: '1-1',
          estado: 'listo',
          haberes: 100,
          descuentos: 0,
          liquidoEstimado: 100,
          pendientes: 0,
          incidenciasCount: 0,
          movimientosCount: 1,
          tieneMovimientos: true,
          tieneRecurrentes: false,
        },
      ],
      buildFilasMasivasDesdePendientesRevision(
        buildTrabajadoresPendientesRevision([empleado({ aptoParaRemuneraciones: false })]),
      ),
    );
    expect(merged).toHaveLength(1);
    expect(merged[0].estado).toBe('bloqueado');
  });

  it('bloquea trabajador apto de ficha si la ficha esta incompleta', () => {
    const aptitud = evaluarAptitudOperativaNominaTrabajador(
      empleado({ estadoFicha: 'INCOMPLETO', aptoParaRemuneraciones: true }),
    );

    expect(aptitud.aptoFicha).toBe(false);
    expect(aptitud.listoParaNomina).toBe(false);
    expect(aptitud.bloqueadoParaNomina).toBe(true);
  });

  it('bloquea trabajador apto de ficha si no tiene contrato', () => {
    const aptitud = evaluarAptitudOperativaNominaTrabajador(empleado({ idContrato: null }));

    expect(aptitud.aptoFicha).toBe(true);
    expect(aptitud.listoParaNomina).toBe(false);
    expect(aptitud.motivo).toContain('Contrato no disponible');
  });

  it('bloquea trabajador apto de ficha con entradas bloqueantes del periodo', () => {
    const lista = buildTrabajadoresPendientesRevision(
      [empleado({ id: 7, idContrato: 10, aptoParaRemuneraciones: true, estadoFicha: 'VALIDO' })],
      [entradaBloqueante({ idPersona: 7 })],
    );

    expect(lista).toHaveLength(1);
    expect(lista[0].aptoFicha).toBe(true);
    expect(lista[0].listoParaNomina).toBe(false);
    expect(lista[0].bloqueanteParaNomina).toBe(true);
    expect(lista[0].motivo).toContain('entrada(s) bloqueante(s)');
  });

  it('tolera entradas y listados ausentes en runtime', () => {
    expect(buildTrabajadoresPendientesRevision(undefined as any, undefined as any)).toEqual([]);
    expect(buildItemsTrabajadoresPendientesModal(undefined as any)).toEqual([]);
    expect(buildFilasMasivasDesdePendientesRevision(undefined as any)).toEqual([]);
    expect(buildIncidenciasFichaPendiente(undefined as any)).toEqual([]);
    expect(mergeFilasMasivasConPendientesRevision(undefined as any, undefined as any)).toEqual([]);
  });
});
