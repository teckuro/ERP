import { CrearEmpleadoPayload } from '../models/empleado-payload.model';
import {
  buildPersonaMetaBorradorUpdate,
  puedePersistirPrevisionBorrador,
} from './empleado-borrador.rules';

function basePayload(over: Partial<CrearEmpleadoPayload> = {}): CrearEmpleadoPayload {
  return {
    origenCreacion: 'avanzado',
    rut: '1-9',
    nombres: 'N',
    apellidoPaterno: 'P',
    apellidoMaterno: '',
    fechaNacimiento: '1990-01-01',
    sexo: 'F',
    estadoCivil: 'SOLTERO',
    pasaporte: null,
    cargas: 0,
    email: 'a@b.cl',
    telefono: '569',
    direccion: 'Dir',
    numeroDireccion: null,
    departamentoDireccion: null,
    observacionesDireccion: null,
    idComuna: 1,
    idPais: 1,
    idSucursal: null,
    idDepartamentoEmpresa: null,
    idCentroCosto: null,
    cargo: 'C',
    fechaContrato: '2024-01-01',
    tipoContrato: 'INDEFINIDO',
    idTipoTrabajador: 1,
    idTipoJornada: 1,
    seguroCesantia: false,
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
    sueldoBase: 0,
    idMoneda: null,
    sueldoVariable: false,
    horasSemanales: 45,
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
    estado: 'borrador',
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
    numeroCuenta: '1',
    ...over,
  };
}

describe('puedePersistirPrevisionBorrador', () => {
  it('NINGUNA: true (repositorio puede invocar upserts del bloque con payload tolerante)', () => {
    expect(puedePersistirPrevisionBorrador(basePayload({ tipoPrevision: 'NINGUNA' }))).toBe(true);
  });

  it('AFP sin datos suficientes: no persiste bloque previsional', () => {
    expect(
      puedePersistirPrevisionBorrador(
        basePayload({
          tipoPrevision: 'AFP',
          idRegimenPrevisional: 1,
          idAfp: null,
        }),
      ),
    ).toBe(false);
  });

  it('AFP con AFP y regimen: permite persistir aunque APVI este incompleto', () => {
    expect(
      puedePersistirPrevisionBorrador(
        basePayload({
          tipoPrevision: 'AFP',
          idRegimenPrevisional: 1,
          idAfp: 99,
          tieneApv: true,
          idInstitucionApv: null,
          montoApv: null,
        }),
      ),
    ).toBe(true);
  });

  it('IPS sin minimos: no persiste', () => {
    expect(
      puedePersistirPrevisionBorrador(
        basePayload({
          tipoPrevision: 'IPS',
          idRegimenPrevisional: null,
        }),
      ),
    ).toBe(false);
  });

  it('IPS con entidad y ex-caja: persiste', () => {
    expect(
      puedePersistirPrevisionBorrador(
        basePayload({
          tipoPrevision: 'IPS',
          idRegimenPrevisional: 2,
          idEntidadPrevisionalIps: 1,
          idExCajaPrevisional: 2,
        }),
      ),
    ).toBe(true);
  });

  it('IPS con datos manuales ex-caja: persiste sin APVI', () => {
    expect(
      puedePersistirPrevisionBorrador(
        basePayload({
          tipoPrevision: 'IPS',
          idRegimenPrevisional: 2,
          nombreExCaja: 'X',
          regimenExCaja: 'Y',
          tasaExCaja: 1,
        }),
      ),
    ).toBe(true);
  });
});

describe('buildPersonaMetaBorradorUpdate', () => {
  it('deja meta BORRADOR, INCOMPLETO, no apto y paso wizard', () => {
    const u = buildPersonaMetaBorradorUpdate(4);
    expect(u.estado).toBe('BORRADOR');
    expect(u.estado_ficha).toBe('INCOMPLETO');
    expect(u.apto_para_remuneraciones).toBe(false);
    expect(u.paso_alta_avanzada).toBe(4);
  });
});
