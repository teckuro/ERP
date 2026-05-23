import { describe, expect, it } from 'vitest';
import {
  evaluarDiagnosticoFichaEmpleado,
  snapshotValidacionDesdePayload,
} from './empleado-diagnostico.rules';
import { fichaSaveTargetForTab, FICHA_EMPLEADO_TABS } from '../models/ficha-empleado-tabs.config';

describe('empleado-diagnostico.rules', () => {
  it('reexporta evaluarDiagnosticoFichaEmpleado', () => {
    const snapshot = snapshotValidacionDesdePayload(
      {
        origenCreacion: 'avanzado',
        rut: '11.111.111-1',
        nombres: 'Ana',
        apellidoPaterno: 'Perez',
        apellidoMaterno: null,
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
        estado: 'EN_PROCESO',
        idTramoCarga: null,
        condicionesTrabajador: [],
        tipoPrevision: 'NINGUNA',
        idRegimenPrevisional: null,
        idAfp: null,
        idMonedaCuenta2: null,
        valorCuenta2: null,
        idEntidadPrevisionalIps: null,
        idExCajaPrevisional: null,
        idRegimenExCaja: null,
        nombreExCaja: null,
        regimenExCaja: null,
        tasaExCaja: null,
        idSalud: null,
        tipoSalud: null,
        idMonedaPlan: null,
        valorPlan: null,
        adicionalAugeGes: null,
        tieneApv: false,
        idInstitucionApv: null,
        idMonedaApv: null,
        montoApv: null,
        idFormaPagoApv: null,
        depositoConvenidoApvi: null,
        idBanco: 1,
        idTipoCuentaBancaria: 1,
        numeroCuenta: '123',
      },
      null,
    );
    const diagnostico = evaluarDiagnosticoFichaEmpleado(snapshot);
    expect(diagnostico).toHaveProperty('aptoParaRemuneraciones');
  });
});

describe('ficha-empleado-tabs.config', () => {
  it('expone 7 tabs en orden de etiquetas', () => {
    expect(FICHA_EMPLEADO_TABS).toHaveLength(7);
    expect(FICHA_EMPLEADO_TABS[0]?.id).toBe('general');
  });

  it('saveTarget solo en tabs operativas', () => {
    expect(fichaSaveTargetForTab('general')).toBe('general');
    expect(fichaSaveTargetForTab('historial')).toBeNull();
  });
});
