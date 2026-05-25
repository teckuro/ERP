import type { EmpleadoFormCatalogos } from '../models/empleado-catalogos.model';
import type { EmpleadoFormGroup } from '../models/empleado-form.model';
import type { EmpleadoFichaValidacionSnapshot } from './empleado-ficha-validacion.rules';

export interface EntradaConstruirSnapshotValidacionFicha {
  form: EmpleadoFormGroup;
  catalogos: EmpleadoFormCatalogos;
  esModoBasico: boolean;
  esModoAvanzado: boolean;
  esModoHonorarios: boolean;
  pasoWizardActivo: number;
  perfilLaboralMenorEdad: boolean;
  tieneCondicionesEspeciales: boolean;
  observacionCondicionesValida: boolean;
}

export function construirSnapshotValidacionFicha(
  entrada: EntradaConstruirSnapshotValidacionFicha,
): EmpleadoFichaValidacionSnapshot {
  const raw = entrada.form.getRawValue();
  const salud = entrada.catalogos.entidadesSalud.find(
    (item) => item.value === raw.previsionSalud.idSalud,
  );

  return {
    origenCreacion: entrada.esModoBasico ? 'basico' : 'avanzado',
    pasoAltaAvanzada: entrada.esModoAvanzado ? entrada.pasoWizardActivo : null,
    relacionLaboral: entrada.esModoHonorarios
      ? 'HONORARIOS'
      : raw.contrato.relacionLaboral,
    estado: raw.contrato.estado,
    rut: raw.datosPersonales.rut,
    pasaporte: raw.datosPersonales.pasaporte,
    nombres: raw.datosPersonales.nombres,
    apellidoPaterno: raw.datosPersonales.apellidoPaterno,
    fechaNacimiento: raw.datosPersonales.fechaNacimiento,
    sexo: raw.datosPersonales.sexo,
    idPais: raw.datosPersonales.idPais,
    estadoCivil: raw.datosPersonales.estadoCivil,
    email: raw.contacto.email,
    telefono: raw.contacto.telefono,
    idComuna: raw.contacto.idComuna,
    idSucursal: raw.contrato.idSucursal,
    idCentroCosto: raw.contrato.idCentroCosto,
    cargo: raw.contrato.cargo,
    fechaContrato: raw.contrato.fechaContrato,
    tipoContrato: raw.contrato.tipoContrato,
    idTipoTrabajador: raw.contrato.idTipoTrabajador,
    idTipoJornada: raw.contrato.idTipoJornada,
    seguroCesantia: raw.contrato.seguroCesantia,
    excluidoLimiteJornada: raw.contrato.excluidoLimiteJornada,
    causalExclusionJornada: raw.contrato.causalExclusionJornada,
    justificacionExclusionJornada: raw.contrato.justificacionExclusionJornada,
    casaParticularModalidad: raw.contrato.casaParticularModalidad,
    casaParticularLabores: raw.contrato.casaParticularLabores,
    casaParticularDomicilioEspecifico: raw.contrato.casaParticularDomicilioEspecifico,
    casaParticularAsistenciaCuidado: raw.contrato.casaParticularAsistenciaCuidado,
    casaParticularRegistroDtEstado: raw.contrato.casaParticularRegistroDtEstado,
    casaParticularRegistroDtFecha: raw.contrato.casaParticularRegistroDtFecha,
    casaParticularRegistroDtFolio: raw.contrato.casaParticularRegistroDtFolio,
    fechaIngreso: raw.contrato.fechaIngreso,
    fechaTermino: raw.contrato.fechaTermino,
    sueldoBase: raw.contrato.sueldoBase,
    idMoneda: raw.contrato.idMoneda,
    horasSemanales: raw.contrato.horasSemanales,
    diasSemanales: raw.contrato.diasSemanales,
    distribucionJornada: raw.contrato.distribucionJornada,
    semanaCorridaActiva: raw.contrato.semanaCorridaActiva,
    semanaCorridaDiasLaborables: raw.contrato.semanaCorridaDiasLaborables,
    zonaExtremaActiva: raw.contrato.zonaExtremaActiva,
    zonaExtremaTerritorio: raw.contrato.zonaExtremaTerritorio,
    zonaExtremaPorcentaje: raw.contrato.zonaExtremaPorcentaje,
    cargas: raw.contrato.cargas,
    idTramoCarga: raw.contrato.idTramoCarga,
    perfilLaboralMenorEdad: entrada.perfilLaboralMenorEdad,
    trabajadorAdolescenteProtegido: raw.perfilLaboral.trabajadorAdolescenteProtegido,
    autorizacionMenorRegistrada: raw.perfilLaboral.autorizacionMenorRegistrada,
    tieneCondicionesEspeciales: entrada.tieneCondicionesEspeciales,
    respaldoRegistrado: raw.perfilLaboral.respaldoRegistrado,
    vigenciaInicioCondiciones: raw.perfilLaboral.vigenciaInicio,
    observacionCondiciones: raw.perfilLaboral.observacion,
    observacionCondicionesValida: entrada.observacionCondicionesValida,
    tipoPrevision: raw.previsionSalud.tipoRegimenPrevisional,
    idRegimenPrevisional: null,
    idAfp: raw.previsionSalud.idAfp,
    idEntidadPrevisionalIps: raw.previsionSalud.idEntidadPrevisionalIps,
    idExCajaPrevisional: raw.previsionSalud.idExCajaPrevisional,
    idRegimenExCaja: raw.previsionSalud.idRegimenExCaja,
    nombreExCaja: raw.previsionSalud.nombreExCaja,
    regimenExCaja: raw.previsionSalud.regimenExCaja,
    tasaExCaja: raw.previsionSalud.tasaExCaja,
    idSalud: raw.previsionSalud.idSalud,
    tipoSalud: salud?.tipo ?? null,
    idMonedaPlan: raw.previsionSalud.idMonedaPlan,
    valorPlan: raw.previsionSalud.valorPlan,
    adicionalAugeGes: raw.previsionSalud.adicionalAugeGes,
    idMonedaCuenta2: raw.previsionSalud.idMonedaCuenta2,
    valorCuenta2: raw.previsionSalud.valorCuenta2,
    tieneApv: raw.previsionSalud.tieneApv,
    idInstitucionApv: raw.previsionSalud.idInstitucionApv,
    idMonedaApv: raw.previsionSalud.idMonedaApv,
    montoApv: raw.previsionSalud.montoApv,
    idFormaPagoApv: raw.previsionSalud.idFormaPagoApv,
    depositoConvenidoApvi: raw.previsionSalud.depositoConvenidoApvi,
    idBanco: raw.bancario.idBanco,
    idTipoCuentaBancaria: raw.bancario.idTipoCuentaBancaria,
    numeroCuenta: raw.bancario.numeroCuenta,
  };
}
