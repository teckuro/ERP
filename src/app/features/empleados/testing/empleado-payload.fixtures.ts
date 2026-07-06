import { CrearEmpleadoPayload } from '../models/empleado-payload.model';

/** Trabajador dependiente con ficha completa y apta para remuneraciones (valores de formulario válidos). */
export function payloadUsuarioDependienteCompleto(
  overrides: Partial<CrearEmpleadoPayload> = {},
): CrearEmpleadoPayload {
  return {
    origenCreacion: 'avanzado',
    rut: '12.345.678-5',
    nombres: 'Camila Andrea',
    apellidoPaterno: 'Soto',
    apellidoMaterno: 'Rojas',
    fechaNacimiento: '1990-03-15',
    sexo: 'F',
    estadoCivil: 'SOLTERO',
    pasaporte: null,
    cargas: 0,
    email: 'camila.soto@empresa.cl',
    telefono: '+56 9 1234 5678',
    direccion: 'Av. Libertador',
    numeroDireccion: '1234',
    departamentoDireccion: '502',
    observacionesDireccion: null,
    idComuna: 1,
    idPais: 1,
    idSucursal: 1,
    idDepartamentoEmpresa: 1,
    idCentroCosto: 1,
    relacionLaboral: 'CONTRATO',
    cargo: 'Analista de remuneraciones',
    fechaContrato: '2024-01-02',
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
    fechaIngreso: '2024-01-02',
    fechaTermino: null,
    sueldoBase: 850000,
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
    numeroCuenta: '123456789012',
    ...overrides,
  };
}

/** Casa particular con datos normativos y nombres con apóstrofe/guión permitidos. */
export function payloadUsuarioCasaParticular(
  overrides: Partial<CrearEmpleadoPayload> = {},
): CrearEmpleadoPayload {
  return payloadUsuarioDependienteCompleto({
    nombres: "María José",
    apellidoPaterno: "O'Connor",
    apellidoMaterno: 'Del-Río',
    tipoContrato: 'CASA_PARTICULAR',
    casaParticularModalidad: 'PUERTAS_ADENTRO',
    casaParticularLabores: 'Limpieza y cuidado',
    casaParticularDomicilioEspecifico: 'Calle Los Aromos 45',
    casaParticularAsistenciaCuidado: true,
    casaParticularRegistroDtEstado: 'PENDIENTE',
    casaParticularRegistroDtFecha: null,
    casaParticularRegistroDtFolio: null,
    ...overrides,
  });
}

/** Honorarios: sin bloques previsionales dependientes. */
export function payloadUsuarioHonorarios(
  overrides: Partial<CrearEmpleadoPayload> = {},
): CrearEmpleadoPayload {
  return payloadUsuarioDependienteCompleto({
    relacionLaboral: 'HONORARIOS',
    tipoPrevision: 'NINGUNA',
    idAfp: null,
    idRegimenPrevisional: null,
    idSalud: null,
    tipoSalud: null,
    idMonedaPlan: null,
    valorPlan: null,
    adicionalAugeGes: null,
    tieneApv: false,
    seguroCesantia: false,
    ...overrides,
  });
}

/** Exclusión art. 22 con causal y justificación. */
export function payloadUsuarioExclusionJornada(
  overrides: Partial<CrearEmpleadoPayload> = {},
): CrearEmpleadoPayload {
  return payloadUsuarioDependienteCompleto({
    excluidoLimiteJornada: true,
    causalExclusionJornada: 'ALTA_RESPONSABILIDAD',
    justificacionExclusionJornada: 'Cargo de confianza documentado en anexo.',
    ...overrides,
  });
}
