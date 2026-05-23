import { describe, expect, it } from 'vitest';
import { CrearEmpleadoPayload } from '../models/empleado-payload.model';
import { evaluarDiagnosticoFichaEmpleado, snapshotValidacionDesdePayload } from '../rules/empleado-ficha-validacion.rules';
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
    excluidoLimiteJornada: false,
    causalExclusionJornada: null,
    justificacionExclusionJornada: null,
    casaParticularModalidad: null,
    casaParticularLabores: null,
    casaParticularDomicilioEspecifico: null,
    casaParticularAsistenciaCuidado: false,
    casaParticularRegistroDtEstado: null,
    casaParticularRegistroDtFecha: null,
    casaParticularRegistroDtFolio: null,
    fechaIngreso: '2024-01-01',
    fechaTermino: null,
    sueldoBase: 750000,
    idMoneda: 1,
    sueldoVariable: false,
    horasSemanales: 42,
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
    condicionesTrabajador: [],
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
    tipoSalud: 'ISAPRE',
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
        tipoSalud: null,
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
        tipoSalud: null,
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
        tipoSalud: 'ISAPRE',
        idMonedaPlan: 1,
        valorPlan: 4.2,
        adicionalAugeGes: 0,
        tieneApv: false,
      }),
    });

    expect(evaluacion.aptoParaRemuneraciones).toBe(true);
    expect(evaluacion.estadoFicha).toBe('VALIDO');
  });

  it('jornada sobre 42 horas bloquea aptitud final', () => {
    const evaluacion = evaluarCompletitudYAptitudEmpleado({
      payload: payloadCompleto({ horasSemanales: 44 }),
    });

    expect(evaluacion.aptoParaRemuneraciones).toBe(false);
    expect(evaluacion.bloqueos).toContain(
      'Desde el 26 de abril de 2026 el maximo ordinario vigente es 42 horas semanales. Si corresponde una excepcion, debe modelarse antes de cerrar el alta.',
    );
  });

  it('casa particular sin labores, domicilio ni registro DT bloquea aptitud', () => {
    const evaluacion = evaluarCompletitudYAptitudEmpleado({
      payload: payloadCompleto({
        tipoContrato: 'CASA_PARTICULAR',
        casaParticularModalidad: 'PUERTAS_AFUERA',
        casaParticularLabores: null,
        casaParticularDomicilioEspecifico: null,
        casaParticularRegistroDtEstado: null,
      }),
    });

    expect(evaluacion.aptoParaRemuneraciones).toBe(false);
    expect(evaluacion.seccionesPendientes).toContain('contrato casa particular');
  });

  it('casa particular completa permite finalizar si lo demas esta completo', () => {
    const evaluacion = evaluarCompletitudYAptitudEmpleado({
      payload: payloadCompleto({
        tipoContrato: 'CASA_PARTICULAR',
        casaParticularModalidad: 'PUERTAS_AFUERA',
        casaParticularLabores: 'Aseo y cocina',
        casaParticularDomicilioEspecifico: 'Av. Principal 123, Santiago',
        casaParticularRegistroDtEstado: 'PENDIENTE',
      }),
    });

    expect(evaluacion.aptoParaRemuneraciones).toBe(true);
  });

  it('articulo 22 sin causal ni justificacion bloquea aptitud', () => {
    const evaluacion = evaluarCompletitudYAptitudEmpleado({
      payload: payloadCompleto({
        excluidoLimiteJornada: true,
        causalExclusionJornada: null,
        justificacionExclusionJornada: null,
      }),
    });

    expect(evaluacion.aptoParaRemuneraciones).toBe(false);
    expect(evaluacion.seccionesPendientes).toContain('jornada');
  });

  it('articulo 22 completo permite horas sobre 42 sin bloqueo y mantiene advertencia', () => {
    const diagnostico = evaluarDiagnosticoFichaEmpleado(
      snapshotValidacionDesdePayload(
        payloadCompleto({
          horasSemanales: 45,
          excluidoLimiteJornada: true,
          causalExclusionJornada: 'ALTA_RESPONSABILIDAD',
          justificacionExclusionJornada: 'Cargo de administracion superior sin fiscalizacion inmediata.',
        }),
      ),
    );

    expect(diagnostico.aptoParaRemuneraciones).toBe(true);
    expect(diagnostico.bloqueos.map((item) => item.id)).not.toContain('contract.weekly-hours-current-limit');
    expect(diagnostico.advertencias.map((item) => item.id)).toContain('contract.weekly-hours-exclusion-warning');
  });

  it('puertas adentro no bloquea por horas pero exige distribucion y descansos descritos', () => {
    const sinDistribucion = evaluarCompletitudYAptitudEmpleado({
      payload: payloadCompleto({
        tipoContrato: 'CASA_PARTICULAR',
        casaParticularModalidad: 'PUERTAS_ADENTRO',
        casaParticularLabores: 'Cuidado de adulto mayor',
        casaParticularDomicilioEspecifico: 'Av. Principal 123, Santiago',
        casaParticularRegistroDtEstado: 'PENDIENTE',
        horasSemanales: 60,
        distribucionJornada: null,
      }),
    });
    const conDistribucion = evaluarCompletitudYAptitudEmpleado({
      payload: payloadCompleto({
        tipoContrato: 'CASA_PARTICULAR',
        casaParticularModalidad: 'PUERTAS_ADENTRO',
        casaParticularLabores: 'Cuidado de adulto mayor',
        casaParticularDomicilioEspecifico: 'Av. Principal 123, Santiago',
        casaParticularRegistroDtEstado: 'PENDIENTE',
        horasSemanales: 60,
        distribucionJornada: 'Puertas adentro con descansos pactados en contrato',
      }),
    });

    expect(sinDistribucion.aptoParaRemuneraciones).toBe(false);
    expect(conDistribucion.aptoParaRemuneraciones).toBe(true);
  });

  it('plazo fijo sobre dos anos bloquea aptitud final', () => {
    const evaluacion = evaluarCompletitudYAptitudEmpleado({
      payload: payloadCompleto({
        tipoContrato: 'PLAZO_FIJO',
        fechaIngreso: '2026-01-01',
        fechaContrato: '2026-01-01',
        fechaTermino: '2028-01-02',
      }),
    });

    expect(evaluacion.aptoParaRemuneraciones).toBe(false);
    expect(evaluacion.bloqueos).toContain(
      'La excepcion maxima para gerentes o personas con titulo profesional o tecnico es de dos anos; sobre ese limite no debe finalizarse el alta.',
    );
  });

  it('menor de edad sin condicion especial bloquea aptitud final', () => {
    const evaluacion = evaluarCompletitudYAptitudEmpleado({
      payload: payloadCompleto({
        fechaNacimiento: '2010-01-01',
        fechaIngreso: '2026-01-01',
      }),
    });

    expect(evaluacion.aptoParaRemuneraciones).toBe(false);
    expect(evaluacion.seccionesPendientes).toContain('contrato');
  });

  it('FONASA queda apta sin valor de plan manual', () => {
    const evaluacion = evaluarCompletitudYAptitudEmpleado({
      payload: payloadCompleto({
        tipoSalud: 'FONASA',
        idSalud: 1,
        idMonedaPlan: 1,
        valorPlan: 0,
        adicionalAugeGes: 0,
      }),
    });

    expect(evaluacion.aptoParaRemuneraciones).toBe(true);
    expect(evaluacion.bloqueos).toEqual([]);
  });

  it('ISAPRE bloquea si falta valor de plan', () => {
    const evaluacion = evaluarCompletitudYAptitudEmpleado({
      payload: payloadCompleto({
        tipoSalud: 'ISAPRE',
        idSalud: 1,
        idMonedaPlan: 1,
        valorPlan: null,
      }),
    });

    expect(evaluacion.aptoParaRemuneraciones).toBe(false);
    expect(evaluacion.seccionesPendientes).toContain('prevision y salud');
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
        tipoSalud: null,
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

  it('diagnostico compartido expone sueldo base con id estable para ambas vistas', () => {
    const diagnostico = evaluarDiagnosticoFichaEmpleado(
      snapshotValidacionDesdePayload(payloadCompleto({ sueldoBase: 0 })),
    );

    const item = diagnostico.bloqueos.find((bloqueo) => bloqueo.id === 'contract.salary');

    expect(item?.tabFicha).toBe('remuneracion');
    expect(item?.formTab).toBe('contrato');
    expect(item?.wizardStep).toBe(3);
    expect(item?.label).toContain('sueldo');
  });

  it('diagnostico compartido expone Sin prevision como bloqueo de prevision', () => {
    const diagnostico = evaluarDiagnosticoFichaEmpleado(
      snapshotValidacionDesdePayload(
        payloadCompleto({
          tipoPrevision: 'NINGUNA',
          idRegimenPrevisional: null,
          idAfp: null,
          idSalud: null,
          tipoSalud: null,
          idMonedaPlan: null,
          valorPlan: null,
          adicionalAugeGes: null,
        }),
      ),
    );

    const item = diagnostico.bloqueos.find((bloqueo) => bloqueo.id === 'prevision.regime');

    expect(item?.tabFicha).toBe('prevision');
    expect(item?.detalle).toContain('Sin prevision');
  });

  it('diagnostico compartido mantiene honorarios sin exigir campos dependientes', () => {
    const diagnostico = evaluarDiagnosticoFichaEmpleado({
      ...snapshotValidacionDesdePayload(payloadCompleto()),
      relacionLaboral: 'HONORARIOS',
      idTipoTrabajador: null,
      idTipoJornada: null,
      tipoContrato: null,
      tipoPrevision: null,
      idBanco: null,
      idTipoCuentaBancaria: null,
      numeroCuenta: '',
    });

    expect(diagnostico.bloqueos.map((item) => item.id)).not.toContain('contract.worker-type');
    expect(diagnostico.bloqueos.map((item) => item.id)).not.toContain('prevision.regime');
    expect(diagnostico.bloqueos.map((item) => item.id)).not.toContain('bank.bank');
  });
});
