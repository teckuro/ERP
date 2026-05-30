import type { EmpleadoListado } from '../../empleados/models/empleado-listado.model';
import { evaluarCompletitudYAptitudEmpleado } from '../../empleados/utils/empleado-completitud.rules';
import type { CrearEmpleadoPayload } from '../../empleados/models/empleado-payload.model';
import { evaluarAptitudOperativaNominaTrabajador } from '../../nomina-mensual/rules/proceso-mensual-trabajadores-prevalidacion.rules';
import {
  primerDiaSqlDesdeYm,
  ultimoDiaSqlDesdeYm,
} from '../../../core/services/periodo-activo.service';
import type { TrabajadorNominaPersonal } from '../models/nomina-empleados-personal.model';
import type {
  EstadoContratoEmpleado,
  EstadoDatosBancariosEmpleado,
  EstadoDocumentacionEmpleado,
  EstadoNominaEmpleado,
  FilaEmpleadoNomina,
} from '../presenters/nomina-empleados-grid.presenter';
import {
  centroCostoAsignado,
  jornadaDefinida,
} from '../presenters/nomina-empleados-grid.presenter';

const ESTADOS_INCLUIDOS_NOMINA = new Set<EmpleadoListado['estado']>(['activo']);

export function filtrarTrabajadoresElegiblesPeriodo(
  trabajadores: readonly TrabajadorNominaPersonal[],
  periodoYm: string,
): TrabajadorNominaPersonal[] {
  const inicioPeriodo = primerDiaSqlDesdeYm(periodoYm);
  const finPeriodo = ultimoDiaSqlDesdeYm(periodoYm);

  return trabajadores.filter((trabajador) => {
    if (!ESTADOS_INCLUIDOS_NOMINA.has(trabajador.estado)) {
      return false;
    }

    const ingresoSql = normalizarFechaSql(trabajador.fechaIngreso);
    if (ingresoSql && ingresoSql > finPeriodo) {
      return false;
    }

    const retiroSql = normalizarFechaSql(trabajador.fechaRetiro);
    if (retiroSql && retiroSql < inicioPeriodo) {
      return false;
    }

    return ingresoSql == null || ingresoSql <= finPeriodo;
  });
}

export function mapearTrabajadoresAFilasNomina(trabajadores: readonly TrabajadorNominaPersonal[]): FilaEmpleadoNomina[] {
  return trabajadores.map((trabajador, indice) => mapearTrabajadorAFilaNomina(trabajador, indice));
}

/** @deprecated Usar mapearTrabajadoresAFilasNomina */
export function mapearEmpleadosListadoAFilasNomina(trabajadores: readonly EmpleadoListado[]): FilaEmpleadoNomina[] {
  return mapearTrabajadoresAFilasNomina(trabajadores.map(convertirListadoATrabajadorNomina));
}

function mapearTrabajadorAFilaNomina(trabajador: TrabajadorNominaPersonal, indice: number): FilaEmpleadoNomina {
  const listado = convertirTrabajadorNominaAListado(trabajador);
  const evaluacionCompletitud = evaluarCompletitudDesdeListado(listado);
  const aptitud = evaluarAptitudOperativaNominaTrabajador(listado);
  const centroCosto = normalizarCentroCosto(trabajador.centroCosto);
  const jornada = normalizarJornadaVisible(trabajador.jornada);
  const documentacion = obtenerEstadoDocumentacion(trabajador);
  const datosBancarios = obtenerEstadoDatosBancarios(trabajador, evaluacionCompletitud?.bloqueos ?? []);
  const contrato = obtenerEstadoContrato(trabajador);
  const afpSaludAsignada = obtenerAfpSaludAsignada(trabajador, evaluacionCompletitud?.bloqueos ?? []);
  const estadoNomina = obtenerEstadoNomina(trabajador, aptitud, documentacion, centroCosto, jornada);

  return {
    id: String(trabajador.idPersona),
    numeroFila: indice + 1,
    nombreCompleto: trabajador.nombreCompleto.trim() || 'Sin nombre',
    rut: trabajador.rut.trim() || 'Sin RUT',
    cargo: trabajador.cargo.trim() || 'Sin cargo',
    centroCosto,
    jornada,
    estadoNomina,
    etiquetaEstadoNomina: etiquetaEstadoNomina(estadoNomina),
    datosBancarios,
    etiquetaDatosBancarios: etiquetaDatosBancarios(datosBancarios),
    contrato,
    etiquetaContrato: etiquetaContrato(contrato),
    documentacion,
    etiquetaDocumentacion: etiquetaDocumentacion(documentacion),
    afpSaludAsignada,
    etiquetaAfpSalud: afpSaludAsignada ? formatearEtiquetaAfpSalud(trabajador) : 'Pendiente',
  };
}

function convertirTrabajadorNominaAListado(trabajador: TrabajadorNominaPersonal): EmpleadoListado {
  return {
    id: trabajador.idPersona,
    idContrato: trabajador.idContrato,
    rut: trabajador.rut,
    nombre: trabajador.nombreCompleto,
    cargo: trabajador.cargo,
    departamento: trabajador.centroCosto ?? 'Sin centro de costo',
    fechaIngreso: formatearFechaListado(trabajador.fechaIngreso),
    sueldoBase: 0,
    monedaContrato: null,
    estado: trabajador.estado,
    estadoFicha: trabajador.estadoFicha,
    aptoParaRemuneraciones: trabajador.aptoParaRemuneraciones,
    pasoAltaAvanzada: trabajador.pasoAltaAvanzada,
  };
}

function convertirListadoATrabajadorNomina(empleado: EmpleadoListado): TrabajadorNominaPersonal {
  return {
    idPersona: empleado.id,
    idContrato: empleado.idContrato,
    rut: empleado.rut,
    nombreCompleto: empleado.nombre,
    cargo: empleado.cargo,
    centroCosto: empleado.departamento === 'Sin centro de costo' ? null : empleado.departamento,
    jornada: null,
    horasSemanales: null,
    fechaIngreso: normalizarFechaSql(empleado.fechaIngreso),
    fechaRetiro: null,
    estado: empleado.estado,
    estadoFicha: empleado.estadoFicha,
    aptoParaRemuneraciones: empleado.aptoParaRemuneraciones,
    pasoAltaAvanzada: empleado.pasoAltaAvanzada,
    estadoContrato: null,
    afpNombre: null,
    saludNombre: null,
    idAfp: null,
    idSalud: null,
    numeroCuentaBancaria: null,
    idBanco: null,
  };
}

function normalizarFechaSql(fecha: string | null | undefined): string | null {
  if (!fecha) {
    return null;
  }
  const texto = fecha.trim();
  if (!texto || texto.toLowerCase() === 'sin fecha') {
    return null;
  }
  if (/^\d{4}-\d{2}-\d{2}/.test(texto)) {
    return texto.slice(0, 10);
  }
  const formatoChileno = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(texto);
  if (formatoChileno) {
    return `${formatoChileno[3]}-${formatoChileno[2]}-${formatoChileno[1]}`;
  }
  return null;
}

function formatearFechaListado(fecha: string | null): string {
  const sql = normalizarFechaSql(fecha);
  if (!sql) {
    return 'Sin fecha';
  }
  const [year, month, day] = sql.split('-');
  return `${day}/${month}/${year}`;
}

function normalizarCentroCosto(centroCosto: string | null | undefined): string {
  const texto = centroCosto?.trim() ?? '';
  if (!texto || texto.toLowerCase() === 'sin centro de costo') {
    return 'Sin asignar';
  }
  return texto;
}

function normalizarJornadaVisible(jornada: string | null | undefined): string {
  const texto = jornada?.trim() ?? '';
  return texto || 'Sin jornada';
}

function obtenerEstadoDocumentacion(trabajador: TrabajadorNominaPersonal): EstadoDocumentacionEmpleado {
  if (trabajador.estadoFicha === 'BORRADOR') {
    return 'pendiente';
  }
  if (trabajador.estadoFicha === 'INCOMPLETO' || !trabajador.aptoParaRemuneraciones) {
    return 'incompleta';
  }
  return 'completa';
}

function obtenerEstadoContrato(trabajador: TrabajadorNominaPersonal): EstadoContratoEmpleado {
  const estadoContrato = trabajador.estadoContrato?.trim().toUpperCase() ?? '';
  if (trabajador.idContrato == null) {
    return 'pendiente';
  }
  if (estadoContrato === 'TERMINADO' || trabajador.estado === 'desvinculado') {
    return 'vencido';
  }
  if (estadoContrato === 'ACTIVO' || trabajador.estado === 'activo') {
    return 'vigente';
  }
  if (estadoContrato === 'SUSPENDIDO') {
    return 'pendiente';
  }
  return 'pendiente';
}

function obtenerEstadoDatosBancarios(
  trabajador: TrabajadorNominaPersonal,
  bloqueos: readonly string[],
): EstadoDatosBancariosEmpleado {
  if (bloqueos.some((bloqueo) => textoIndicaPendienteBancario(bloqueo))) {
    return 'pendiente';
  }
  if (cuentaBancariaCompleta(trabajador)) {
    return 'completo';
  }
  return 'pendiente';
}

function obtenerAfpSaludAsignada(
  trabajador: TrabajadorNominaPersonal,
  bloqueos: readonly string[],
): boolean {
  if (bloqueos.some((bloqueo) => textoIndicaPendientePrevision(bloqueo))) {
    return false;
  }
  if (trabajador.idAfp != null && trabajador.idSalud != null) {
    return true;
  }
  if (trabajador.afpNombre && trabajador.saludNombre) {
    return true;
  }
  return trabajador.estadoFicha === 'VALIDO' && trabajador.aptoParaRemuneraciones;
}

function cuentaBancariaCompleta(trabajador: TrabajadorNominaPersonal): boolean {
  const numero = trabajador.numeroCuentaBancaria?.trim() ?? '';
  if (!numero || esCuentaBorrador(numero)) {
    return false;
  }
  return typeof trabajador.idBanco === 'number' && trabajador.idBanco > 0;
}

function esCuentaBorrador(value: string): boolean {
  return value.trim().toUpperCase().startsWith('DRAFT-');
}

function formatearEtiquetaAfpSalud(trabajador: TrabajadorNominaPersonal): string {
  const afp = trabajador.afpNombre?.trim();
  const salud = trabajador.saludNombre?.trim();
  if (afp && salud) {
    return 'Asignada';
  }
  if (afp || salud) {
    return 'Parcial';
  }
  return 'Asignada';
}

function obtenerEstadoNomina(
  trabajador: TrabajadorNominaPersonal,
  aptitud: ReturnType<typeof evaluarAptitudOperativaNominaTrabajador>,
  documentacion: EstadoDocumentacionEmpleado,
  centroCosto: string,
  jornada: string,
): EstadoNominaEmpleado {
  if (aptitud.listoParaNomina && centroCostoAsignado(centroCosto) && jornadaDefinida(jornada)) {
    return 'listo';
  }

  if (
    trabajador.estado === 'activo' &&
    documentacion === 'completa' &&
    (aptitud.motivo.trim().length > 0 || !centroCostoAsignado(centroCosto) || !jornadaDefinida(jornada))
  ) {
    return 'observado';
  }

  return 'pendiente';
}

function evaluarCompletitudDesdeListado(trabajador: EmpleadoListado) {
  if (trabajador.pasoAltaAvanzada === null) {
    return undefined;
  }

  const payloadMinimo = {
    estado: 'activo',
    origenCreacion: 'avanzado',
    rut: trabajador.rut ?? '',
    nombres: trabajador.nombre ?? '',
    apellidoPaterno: '',
    apellidoMaterno: '',
    fechaNacimiento: '',
    sexo: 'no_informa',
    estadoCivil: 'soltero',
    pasaporte: null,
    cargas: 0,
    email: '',
    telefono: '',
    direccion: '',
    numeroDireccion: null,
    departamentoDireccion: null,
    observacionesDireccion: null,
    idComuna: null,
    idPais: 0,
    idSucursal: null,
    idDepartamentoEmpresa: null,
    idCentroCosto: null,
    cargo: trabajador.cargo ?? '',
    fechaContrato: trabajador.fechaIngreso ?? '',
    tipoContrato: 'indefinido',
    idTipoTrabajador: 0,
    idTipoJornada: 0,
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
    fechaIngreso: trabajador.fechaIngreso ?? '',
    fechaTermino: null,
    sueldoBase: trabajador.sueldoBase ?? 0,
    idMoneda: null,
    sueldoVariable: false,
    horasSemanales: 0,
    diasSemanales: 0,
    distribucionJornada: null,
    tiempoColacionMinutos: null,
    tipoGratificacion: 'legal',
    gratificacionProporcional: false,
    semanaCorridaActiva: false,
    semanaCorridaDiasLaborables: [],
    zonaExtremaActiva: false,
    zonaExtremaTerritorio: null,
    zonaExtremaPorcentaje: null,
    idTramoCarga: null,
    condicionesTrabajador: [],
    tipoPrevision: 'afp',
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
    idBanco: 0,
    idTipoCuentaBancaria: 0,
    numeroCuenta: '',
  } as unknown as CrearEmpleadoPayload;

  return evaluarCompletitudYAptitudEmpleado({
    payload: payloadMinimo,
    pasoAltaAvanzada: trabajador.pasoAltaAvanzada,
  });
}

function textoIndicaPendienteBancario(texto: string): boolean {
  const normalizado = texto.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
  return (
    normalizado.includes('banco') ||
    normalizado.includes('cuenta bancaria') ||
    normalizado.includes('cuenta real') ||
    normalizado.includes('draft') ||
    normalizado.includes('temporal')
  );
}

function textoIndicaPendientePrevision(texto: string): boolean {
  const normalizado = texto.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
  return (
    normalizado.includes('previsional') ||
    normalizado.includes('prevision') ||
    normalizado.includes('afp') ||
    normalizado.includes('salud') ||
    normalizado.includes('regimen') ||
    normalizado.includes('institucion de salud')
  );
}

function etiquetaEstadoNomina(estado: EstadoNominaEmpleado): string {
  switch (estado) {
    case 'listo':
      return 'Listo';
    case 'observado':
      return 'Observado';
    case 'pendiente':
      return 'Pendiente';
  }
}

function etiquetaDatosBancarios(estado: EstadoDatosBancariosEmpleado): string {
  return estado === 'completo' ? 'Completo' : 'Pendiente';
}

function etiquetaContrato(estado: EstadoContratoEmpleado): string {
  switch (estado) {
    case 'vigente':
      return 'Vigente';
    case 'vencido':
      return 'Vencido';
    case 'pendiente':
      return 'Pendiente';
  }
}

function etiquetaDocumentacion(estado: EstadoDocumentacionEmpleado): string {
  switch (estado) {
    case 'completa':
      return 'Completa';
    case 'incompleta':
      return 'Incompleta';
    case 'pendiente':
      return 'Pendiente';
  }
}
