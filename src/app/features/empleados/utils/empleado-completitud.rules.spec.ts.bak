import { CrearEmpleadoPayload } from '../models/empleado-payload.model';
import { evaluarCompletitudYAptitudEmpleado } from './empleado-completitud.rules';

function payloadCompleto(overrides: Partial<CrearEmpleadoPayload> = {}): CrearEmpleadoPayload {
  return {
    origenCreacion: 'avanzado',
    rut: '12.345.678-5',
    nombres: 'Ana Maria',
    apellidoPaterno: 'Perez',
    apellidoMaterno: 'Soto',
    fechaNacimiento: '1990-01-01',
    sexo: 'F',
    estadoCivil: 'SOLTERO',
    pasaporte: null,
    cargas: 0,
    email: 'ana@empresa.cl',
    telefono: '56912345678',
    direccion: 'Av. Principal',
    numeroDireccion: '123',
    departamentoDireccion: null,
    observacionesDireccion: null,
    idComuna: 1,
    idPais: 1,
    idSucursal: 1,
    idDepartamentoEmpresa: 1,
    idCentroCosto: 1,
    cargo: 'Analista',
    fechaContrato: '2024-01-01',
    tipoContrato: 'INDEFINIDO',
    idTipoTrabajador: 1,
    idTipoJornada: 1,
    seguroCesantia: true,
    fechaIngreso: '2024-01-01',
    fechaTermino: null,
    sueldoBase: 750000,
    idMoneda: 1,
    sueldoVariable: false,
    horasSemanales: 44,
    diasSemanales: 5,
    distribucionJornada: 'Lunes a viernes',
    tiempoColacionMinutos: 60,
    tipoGratificacion: 'LEGAL_ART_50',
    gratificacionProporcional: false,
    semanaCorridaActiva: false,
    semanaCorridaDiasLaborables: [],
    zonaExtremaActiva: false,
    zonaExtremaTerritorio: null,
    zonaExtremaPorcentaje: null,
    estado: 'activo',
    idTramoCarga: null,
    tipoPrevision: 'AFP',
    idRegimenPrevisional: 1,
    idAfp: 1,
    idMonedaCuenta2: null,
    valorCuenta2: null,
    idEntidadPrevisionalIps: null,
    idExCajaPrevisional: null,
    idRegimenExCaja: null,
    nombreExCaja: null,
    regimenExCaja: null,
    tasaExCaja: null,
    idSalud: 1,
    idMonedaPlan: 1,
    valorPlan: 4.2,
    adicionalAugeGes: 0,
    tieneApv: false,
    idInstitucionApv: null,
    idMonedaApv: null,
    montoApv: null,
    idFormaPagoApv: null,
    depositoConvenidoApvi: null,
    idBanco: 1,
    idTipoCuentaBancaria: 1,
    numeroCuenta: '123456789',
    ...overrides,
  };
}

describe('evaluarCompletitudYAptitudEmpleado', () => {
  it('creacion basica queda incompleta y no apta', () => {
    const evaluacion = evaluarCompletitudYAptitudEmpleado({
      payload: payloadCompleto({
        origenCreacion: 'basico',
        estado: 'en_proceso',
        cargo: 'Sin cargo',
        sueldoBase: 0,
        idBanco: 0,
        idTipoCuentaBancaria: 0,
        numeroCuenta: '',
        tipoPrevision: 'NINGUNA',
        idRegimenPrevisional: null,
        idAfp: null,
        idSalud: null,
        idMonedaPlan: null,
        valorPlan: null,
        adicionalAugeGes: null,
      }),
    });

    expect(evaluacion.estadoFicha).toBe('INCOMPLETO');
    expect(evaluacion.aptoParaRemuneraciones).toBe(false);
    expect(evaluacion.seccionesPendientes).toContain('alta basica');
  });

  it('borrador avanzado con paso guardado queda incompleto y no apto', () => {
    const evaluacion = evaluarCompletitudYAptitudEmpleado({
      payload: payloadCompleto({ estado: 'borrador' }),
      pasoAltaAvanzada: 4,
    });

    expect(evaluacion.estadoFicha).toBe('INCOMPLETO');
    expect(evaluacion.aptoParaRemuneraciones).toBe(false);
    expect(evaluacion.seccionesPendientes).toContain('alta avanzada');
  });

  it('alta avanzada completa queda valida y apta', () => {
    const evaluacion = evaluarCompletitudYAptitudEmpleado({ payload: payloadCompleto() });

    expect(evaluacion.estadoFicha).toBe('VALIDO');
    expect(evaluacion.aptoParaRemuneraciones).toBe(true);
    expect(evaluacion.bloqueos).toEqual([]);
  });

  it('cuenta DRAFT bloquea aptitud y se informa como default tecnico', () => {
    const evaluacion = evaluarCompletitudYAptitudEmpleado({
      payload: payloadCompleto({ numeroCuenta: 'DRAFT-ABC123' }),
    });

    expect(evaluacion.aptoParaRemuneraciones).toBe(false);
    expect(evaluacion.defaultsTecnicosDetectados).toContain('cuenta-bancaria:draft');
  });

  it('cargo Sin cargo bloquea aptitud', () => {
    const evaluacion = evaluarCompletitudYAptitudEmpleado({
      payload: payloadCompleto({ cargo: 'Sin cargo' }),
    });

    expect(evaluacion.aptoParaRemuneraciones).toBe(false);
    expect(evaluacion.defaultsTecnicosDetectados).toContain('cargo:sin-cargo');
  });

  it('sueldo base cero bloquea aptitud', () => {
    const evaluacion = evaluarCompletitudYAptitudEmpleado({
      payload: payloadCompleto({ sueldoBase: 0 }),
    });

    expect(evaluacion.aptoParaRemuneraciones).toBe(false);
    expect(evaluacion.defaultsTecnicosDetectados).toContain('sueldo-base:invalido');
  });

  it('AFP con APVI incompleto bloquea aptitud', () => {
    const evaluacion = evaluarCompletitudYAptitudEmpleado({
      payload: payloadCompleto({
        tieneApv: true,
        idInstitucionApv: null,
        idMonedaApv: 1,
        montoApv: 10000,
        idFormaPagoApv: 1,
        depositoConvenidoApvi: 0,
      }),
    });

    expect(evaluacion.aptoParaRemuneraciones).toBe(false);
    expect(evaluacion.defaultsTecnicosDetectados).toContain('apvi:incompleto');
  });

  it('AFP sin APVI no exige datos APVI', () => {
    const evaluacion = evaluarCompletitudYAptitudEmpleado({
      payload: payloadCompleto({
        tieneApv: false,
        idInstitucionApv: null,
        idMonedaApv: null,
        montoApv: null,
        idFormaPagoApv: null,
        depositoConvenidoApvi: null,
      }),
    });

    expect(evaluacion.aptoParaRemuneraciones).toBe(true);
  });

  it('Sin prevision bloquea aptitud para remuneraciones', () => {
    const evaluacion = evaluarCompletitudYAptitudEmpleado({
      payload: payloadCompleto({
        tipoPrevision: 'NINGUNA',
        idRegimenPrevisional: null,
        idAfp: null,
        idSalud: null,
        idMonedaPlan: null,
        valorPlan: null,
        adicionalAugeGes: null,
      }),
    });

    expect(evaluacion.aptoParaRemuneraciones).toBe(false);
    expect(evaluacion.estadoFicha).toBe('INCOMPLETO');
    expect(
      evaluacion.bloqueos.some(
        (bloqueo) =>
          bloqueo.includes('Sin prevision') || bloqueo.includes('AFP') || bloqueo.includes('IPS'),
      ),
    ).toBe(true);
    expect(evaluacion.seccionesPendientes).toContain('prevision y salud');
  });

  it('AFP con salud completa queda apta', () => {
    const evaluacion = evaluarCompletitudYAptitudEmpleado({
      payload: payloadCompleto({
        tipoPrevision: 'AFP',
        idRegimenPrevisional: 1,
        idAfp: 1,
        idSalud: 1,
        idMonedaPlan: 1,
        valorPlan: 4.2,
        adicionalAugeGes: 0,
        tieneApv: false,
      }),
    });

    expect(evaluacion.aptoParaRemuneraciones).toBe(true);
    expect(evaluacion.estadoFicha).toBe('VALIDO');
  });

  it('IPS con salud completa queda apta y no exige APVI', () => {
    const evaluacion = evaluarCompletitudYAptitudEmpleado({
      payload: payloadCompleto({
        tipoPrevision: 'IPS',
        idRegimenPrevisional: 2,
        idAfp: null,
        idEntidadPrevisionalIps: 1,
        idExCajaPrevisional: 1,
        idRegimenExCaja: 1,
        tieneApv: false,
      }),
    });

    expect(evaluacion.aptoParaRemuneraciones).toBe(true);
  });

  it('borrador con NINGUNA sigue siendo persistible como borrador, pero no apto', () => {
    const evaluacion = evaluarCompletitudYAptitudEmpleado({
      payload: payloadCompleto({
        estado: 'borrador',
        tipoPrevision: 'NINGUNA',
        idRegimenPrevisional: null,
        idAfp: null,
        idSalud: null,
        idMonedaPlan: null,
        valorPlan: null,
        adicionalAugeGes: null,
      }),
      pasoAltaAvanzada: 5,
    });

    expect(evaluacion.aptoParaRemuneraciones).toBe(false);
    expect(evaluacion.estadoFicha).toBe('INCOMPLETO');
    expect(evaluacion.seccionesPendientes).toContain('alta avanzada');
    expect(evaluacion.seccionesPendientes).toContain('prevision y salud');
  });

  it('paso_alta_avanzada distinto de null bloquea aptitud aunque los datos esten completos', () => {
    const evaluacion = evaluarCompletitudYAptitudEmpleado({
      payload: payloadCompleto(),
      pasoAltaAvanzada: 8,
    });

    expect(evaluacion.estadoFicha).toBe('INCOMPLETO');
    expect(evaluacion.aptoParaRemuneraciones).toBe(false);
  });
});
