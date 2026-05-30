import type { EmpleadoListado } from '../../empleados/models/empleado-listado.model';
import type { TrabajadorNominaPersonal } from '../models/nomina-empleados-personal.model';
import {
  filtrarTrabajadoresElegiblesPeriodo,
  mapearTrabajadoresAFilasNomina,
} from './nomina-empleados-personal.mapper';

function trabajador(overrides: Partial<TrabajadorNominaPersonal> = {}): TrabajadorNominaPersonal {
  return {
    idPersona: 1,
    idContrato: 10,
    rut: '12.345.678-9',
    nombreCompleto: 'Ana Pérez',
    cargo: 'Analista',
    centroCosto: 'Administración',
    jornada: 'Completa (45h)',
    horasSemanales: 45,
    fechaIngreso: '2024-01-01',
    fechaRetiro: null,
    estado: 'activo',
    estadoFicha: 'VALIDO',
    aptoParaRemuneraciones: true,
    pasoAltaAvanzada: null,
    estadoContrato: 'ACTIVO',
    afpNombre: 'Provida',
    saludNombre: 'Fonasa',
    idAfp: 1,
    idSalud: 2,
    numeroCuentaBancaria: '123456789',
    idBanco: 1,
    ...overrides,
  };
}

describe('nomina-empleados-personal.mapper', () => {
  it('filtra activos del periodo respetando fecha de retiro', () => {
    const listado = [
      trabajador({ idPersona: 1, estado: 'activo', fechaIngreso: '2024-01-01', fechaRetiro: null }),
      trabajador({ idPersona: 2, estado: 'inactivo', fechaIngreso: '2024-01-01' }),
      trabajador({ idPersona: 3, estado: 'activo', fechaIngreso: '2026-06-01' }),
      trabajador({ idPersona: 4, estado: 'activo', fechaIngreso: '2024-01-01', fechaRetiro: '2026-04-15' }),
    ];

    const elegibles = filtrarTrabajadoresElegiblesPeriodo(listado, '2026-05');

    expect(elegibles.map((item) => item.idPersona)).toEqual([1]);
  });

  it('mapea jornada, centro de costo, afp/salud y bancarios desde datos reales', () => {
    const filas = mapearTrabajadoresAFilasNomina([trabajador()]);

    expect(filas[0].centroCosto).toBe('Administración');
    expect(filas[0].jornada).toBe('Completa (45h)');
    expect(filas[0].datosBancarios).toBe('completo');
    expect(filas[0].afpSaludAsignada).toBeTruthy();
  });

  it('marca pendientes cuando faltan datos reales', () => {
    const filas = mapearTrabajadoresAFilasNomina([
      trabajador({
        centroCosto: null,
        jornada: null,
        estadoFicha: 'INCOMPLETO',
        aptoParaRemuneraciones: false,
        idAfp: null,
        idSalud: null,
        afpNombre: null,
        saludNombre: null,
        numeroCuentaBancaria: 'DRAFT-001',
        idBanco: 1,
      }),
    ]);

    expect(filas[0].centroCosto).toBe('Sin asignar');
    expect(filas[0].jornada).toBe('Sin jornada');
    expect(filas[0].documentacion).toBe('incompleta');
    expect(filas[0].datosBancarios).toBe('pendiente');
    expect(filas[0].afpSaludAsignada).toBeFalsy();
  });
});
