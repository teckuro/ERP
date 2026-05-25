import { describe, expect, it } from 'vitest';

import {
  evaluarDiagnosticoFichaEmpleado,
  snapshotValidacionDesdePayload,
} from './empleado-diagnostico.rules';

function snapshotBase() {
  return snapshotValidacionDesdePayload(
    {
      origenCreacion: 'avanzado',
      rut: '11.111.111-1',
      nombres: 'Ana',
      apellidoPaterno: 'Perez',
      apellidoMaterno: '',
      fechaNacimiento: '1990-01-01',
      sexo: 'F',
      estadoCivil: 'SOLTERO',
      pasaporte: null,
      idPais: 1,
      email: 'ana@test.cl',
      telefono: '912345678',
      direccion: 'Calle 1',
      numeroDireccion: null,
      departamentoDireccion: null,
      observacionesDireccion: null,
      idComuna: 1,
      idSucursal: 1,
      idDepartamentoEmpresa: null,
      idCentroCosto: 1,
      relacionLaboral: 'CONTRATO',
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
      sueldoBase: 500000,
      idMoneda: 1,
      sueldoVariable: false,
      horasSemanales: 45,
      cargas: 0,
      diasSemanales: 5,
      distribucionJornada: null,
      tiempoColacionMinutos: null,
      tipoGratificacion: 'LEGAL_ART_50',
      gratificacionProporcional: false,
      semanaCorridaActiva: false,
      semanaCorridaDiasLaborables: [],
      zonaExtremaActiva: false,
      zonaExtremaTerritorio: null,
      zonaExtremaPorcentaje: null,
      estado: 'en_proceso',
      idTramoCarga: null,
      condicionesTrabajador: [],
      tipoPrevision: 'AFP',
      idRegimenPrevisional: null,
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
      tipoSalud: 'FONASA',
      idMonedaPlan: 1,
      valorPlan: 4,
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
    },
    null,
  );
}

describe('empleado-ficha-validacion.rules — contacto bloqueante', () => {
  it('personal.email-empty es error bloqueante', () => {
    const snap = { ...snapshotBase(), email: '' };
    const d = evaluarDiagnosticoFichaEmpleado(snap);
    const item = d.bloqueos.find((i) => i.id === 'personal.email-empty');
    expect(item).toBeDefined();
    expect(item?.severity).toBe('error');
    expect(item?.blocking).toBe(true);
  });

  it('personal.phone-empty es error bloqueante', () => {
    const snap = { ...snapshotBase(), telefono: '' };
    const d = evaluarDiagnosticoFichaEmpleado(snap);
    const item = d.bloqueos.find((i) => i.id === 'personal.phone-empty');
    expect(item).toBeDefined();
    expect(item?.severity).toBe('error');
    expect(item?.blocking).toBe(true);
  });
});
