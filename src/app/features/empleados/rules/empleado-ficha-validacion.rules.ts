import type { EmpleadoEstado } from '../models/empleado-listado.model';
import type { CrearEmpleadoPayload } from '../models/empleado-payload.model';
import type { PerfilLaboralPersona } from '../models/empleado-perfil-laboral-rpc.model';
import { enriquecerSnapshotConPerfilRpc } from './empleado-perfil-laboral.rules';
import type {
  CasaParticularModalidad,
  CasaParticularRegistroDtEstado,
  CausalExclusionJornada,
  RelacionLaboral,
  TipoContrato,
  TipoRegimenPrevisional,
} from '../models/empleado.model';
import { parseRut } from '../utils/empleado-rut';

export type EmpleadoFichaValidacionSeverity = 'error' | 'warning' | 'info';
export type EmpleadoFichaValidacionTab = 'general' | 'laboral' | 'remuneracion' | 'prevision' | 'pago';
export type EmpleadoFichaValidacionFormTab = 'datosPersonales' | 'contrato' | 'previsionSalud' | 'bancario';

export interface EmpleadoFichaValidacionItem {
  id: string;
  seccion: string;
  tabFicha: EmpleadoFichaValidacionTab;
  formTab: EmpleadoFichaValidacionFormTab;
  wizardStep: number;
  severity: EmpleadoFichaValidacionSeverity;
  blocking: boolean;
  label: string;
  detalle: string;
  accion?: string;
  controlPath: string;
  complete: boolean;
  visible: boolean;
  category?: string;
  defaultCode?: string;
}

export interface EmpleadoFichaDiagnostico {
  items: EmpleadoFichaValidacionItem[];
  pendientes: EmpleadoFichaValidacionItem[];
  bloqueos: EmpleadoFichaValidacionItem[];
  advertencias: EmpleadoFichaValidacionItem[];
  aptoParaRemuneraciones: boolean;
}

export interface EmpleadoFichaValidacionSnapshot {
  origenCreacion?: 'basico' | 'avanzado';
  pasoAltaAvanzada?: number | null;
  relacionLaboral?: RelacionLaboral | null;
  estado?: EmpleadoEstado | null;
  rut?: string | null;
  pasaporte?: string | null;
  nombres?: string | null;
  apellidoPaterno?: string | null;
  fechaNacimiento?: string | null;
  sexo?: string | null;
  idPais?: number | null;
  estadoCivil?: string | null;
  email?: string | null;
  telefono?: string | null;
  direccion?: string | null;
  idComuna?: number | null;
  idSucursal?: number | null;
  idCentroCosto?: number | null;
  cargo?: string | null;
  fechaContrato?: string | null;
  tipoContrato?: TipoContrato | null;
  idTipoTrabajador?: number | null;
  idTipoJornada?: number | null;
  seguroCesantia?: boolean | null;
  excluidoLimiteJornada?: boolean | null;
  causalExclusionJornada?: CausalExclusionJornada | null;
  justificacionExclusionJornada?: string | null;
  casaParticularModalidad?: CasaParticularModalidad | null;
  casaParticularLabores?: string | null;
  casaParticularDomicilioEspecifico?: string | null;
  casaParticularAsistenciaCuidado?: boolean | null;
  casaParticularRegistroDtEstado?: CasaParticularRegistroDtEstado | null;
  casaParticularRegistroDtFecha?: string | null;
  casaParticularRegistroDtFolio?: string | null;
  fechaIngreso?: string | null;
  fechaTermino?: string | null;
  sueldoBase?: number | null;
  idMoneda?: number | null;
  horasSemanales?: number | null;
  diasSemanales?: number | null;
  distribucionJornada?: string | null;
  semanaCorridaActiva?: boolean | null;
  semanaCorridaDiasLaborables?: number[] | null;
  zonaExtremaActiva?: boolean | null;
  zonaExtremaTerritorio?: string | null;
  zonaExtremaPorcentaje?: number | null;
  cargas?: number | null;
  idTramoCarga?: number | null;
  perfilLaboralMenorEdad?: boolean | null;
  trabajadorAdolescenteProtegido?: boolean | null;
  autorizacionMenorRegistrada?: boolean | null;
  tieneCondicionesEspeciales?: boolean | null;
  respaldoRegistrado?: boolean | null;
  vigenciaInicioCondiciones?: string | null;
  observacionCondiciones?: string | null;
  observacionCondicionesValida?: boolean | null;
  tipoPrevision?: TipoRegimenPrevisional | null;
  idRegimenPrevisional?: number | null;
  idAfp?: number | null;
  idEntidadPrevisionalIps?: number | null;
  idExCajaPrevisional?: number | null;
  idRegimenExCaja?: number | null;
  nombreExCaja?: string | null;
  regimenExCaja?: string | null;
  tasaExCaja?: number | null;
  idSalud?: number | null;
  tipoSalud?: string | null;
  idMonedaPlan?: number | null;
  valorPlan?: number | null;
  adicionalAugeGes?: number | null;
  idMonedaCuenta2?: number | null;
  valorCuenta2?: number | null;
  tieneApv?: boolean | null;
  idInstitucionApv?: number | null;
  idMonedaApv?: number | null;
  montoApv?: number | null;
  idFormaPagoApv?: number | null;
  depositoConvenidoApvi?: number | null;
  idBanco?: number | null;
  idTipoCuentaBancaria?: number | null;
  numeroCuenta?: string | null;
}

interface ItemDef {
  id: string;
  seccion: string;
  tabFicha: EmpleadoFichaValidacionTab;
  formTab: EmpleadoFichaValidacionFormTab;
  wizardStep: number;
  severity: EmpleadoFichaValidacionSeverity;
  blocking: boolean;
  label: string;
  detalle?: string;
  accion?: string;
  controlPath: string;
  category?: string;
  defaultCode?: string;
  visible?: boolean;
  complete: boolean;
}

export function snapshotValidacionDesdePayload(
  payload: CrearEmpleadoPayload,
  pasoAltaAvanzada: number | null = null,
  perfilRpc: PerfilLaboralPersona | null = null,
): EmpleadoFichaValidacionSnapshot {
  const codigosCondiciones = new Set(
    (payload.condicionesTrabajador ?? []).map((item) => item.codigo),
  );
  const menorEdad = calcularEdad(payload.fechaNacimiento, payload.fechaIngreso) < 18;
  const respaldoCondiciones =
    payload.condicionesTrabajador.length === 0 ||
    payload.condicionesTrabajador.every((item) => item.respaldoRegistrado);

  const snapshot: EmpleadoFichaValidacionSnapshot = {
    ...payload,
    relacionLaboral: payload.relacionLaboral ?? 'CONTRATO',
    pasoAltaAvanzada,
    pasaporte: payload.pasaporte,
    perfilLaboralMenorEdad: menorEdad,
    trabajadorAdolescenteProtegido: codigosCondiciones.has('TRABAJADOR_ADOLESCENTE_PROTEGIDO'),
    autorizacionMenorRegistrada: codigosCondiciones.has('AUTORIZACION_MENOR_REGISTRADA'),
    tieneCondicionesEspeciales: (payload.condicionesTrabajador ?? []).length > 0,
    respaldoRegistrado: respaldoCondiciones,
    vigenciaInicioCondiciones: payload.fechaIngreso,
    observacionCondicionesValida: true,
  };

  return enriquecerSnapshotConPerfilRpc(snapshot, perfilRpc);
}

export function evaluarDiagnosticoFichaEmpleado(
  snapshot: EmpleadoFichaValidacionSnapshot,
): EmpleadoFichaDiagnostico {
  const items = buildItems(snapshot)
    .filter((item) => item.visible)
    .map((item) => ({ ...item, detalle: item.detalle ?? item.label }));
  const pendientes = items.filter((item) => !item.complete);
  const bloqueos = pendientes.filter((item) => item.blocking && item.severity === 'error');
  const advertencias = pendientes.filter((item) => item.severity === 'warning');

  return {
    items,
    pendientes,
    bloqueos,
    advertencias,
    aptoParaRemuneraciones: bloqueos.length === 0,
  };
}

function buildItems(s: EmpleadoFichaValidacionSnapshot): EmpleadoFichaValidacionItem[] {
  const esHonorarios = s.relacionLaboral === 'HONORARIOS';
  const esContratoDependiente = !esHonorarios;
  const tipoPrevision = s.tipoPrevision ?? null;
  const requiereSalud = tipoPrevision != null && tipoPrevision !== 'NINGUNA';
  const esFonasa = normalize(s.tipoSalud ?? '').includes('fonasa');
  const hasCuenta2 = tipoPrevision === 'AFP' && (s.idMonedaCuenta2 != null || s.valorCuenta2 != null);
  const tieneApv = tipoPrevision === 'AFP' && s.tieneApv === true;
  const requiereRevisionMenor =
    s.perfilLaboralMenorEdad === true
    && s.trabajadorAdolescenteProtegido !== true
    && s.autorizacionMenorRegistrada !== true;
  const esCasaParticular = esContratoDependiente && s.tipoContrato === 'CASA_PARTICULAR';
  const casaPuertasAdentro = esCasaParticular && s.casaParticularModalidad === 'PUERTAS_ADENTRO';
  const jornadaExcluida = esContratoDependiente && s.excluidoLimiteJornada === true;
  const aplicaLimiteHoras = esContratoDependiente && !jornadaExcluida && !casaPuertasAdentro;

  const out: EmpleadoFichaValidacionItem[] = [];
  const add = (item: ItemDef): void => {
    out.push({
      detalle: item.detalle ?? item.label,
      accion: item.accion,
      visible: item.visible ?? true,
      category: item.category,
      defaultCode: item.defaultCode,
      ...item,
    });
  };

  add({
    id: 'alta.basica',
    seccion: 'alta basica',
    tabFicha: 'general',
    formTab: 'datosPersonales',
    wizardStep: 0,
    severity: 'error',
    blocking: true,
    label: 'Completa la ficha por secciones antes de habilitar remuneraciones.',
    controlPath: 'datosPersonales.rut',
    visible: s.origenCreacion === 'basico',
    complete: s.origenCreacion !== 'basico',
  });
  add({
    id: 'alta.avanzada',
    seccion: 'alta avanzada',
    tabFicha: 'general',
    formTab: 'datosPersonales',
    wizardStep: 9,
    severity: 'error',
    blocking: true,
    label: 'Continua el alta avanzada antes de validar la ficha para remuneraciones.',
    controlPath: 'datosPersonales.rut',
    visible: s.pasoAltaAvanzada != null,
    complete: s.pasoAltaAvanzada == null,
  });
  add({
    id: 'employee.status',
    seccion: 'estado',
    tabFicha: 'laboral',
    formTab: 'contrato',
    wizardStep: 2,
    severity: 'error',
    blocking: true,
    label: 'La ficha debe quedar activa antes de habilitar remuneraciones.',
    controlPath: 'contrato.estado',
    complete: s.estado === 'activo',
  });

  add({
    id: 'personal.identity',
    seccion: 'identidad',
    tabFicha: 'general',
    formTab: 'datosPersonales',
    wizardStep: 0,
    severity: 'error',
    blocking: true,
    label: 'Ingresa un RUT valido o un identificador extranjero valido',
    detalle: 'Ingresa un RUT valido antes de activar la ficha.',
    controlPath: 'datosPersonales.rut',
    category: 'Identificacion legal',
    complete: rutValido(s.rut) || hasText(s.pasaporte),
  });
  add({
    id: 'personal.birthdate',
    seccion: 'identidad',
    tabFicha: 'general',
    formTab: 'datosPersonales',
    wizardStep: 0,
    severity: 'error',
    blocking: true,
    label: 'Ingresa la fecha de nacimiento del trabajador',
    detalle: 'Ingresa la fecha de nacimiento antes de activar la ficha.',
    controlPath: 'datosPersonales.fechaNacimiento',
    category: 'Identificacion legal',
    complete: hasText(s.fechaNacimiento),
  });
  add({
    id: 'personal.names',
    seccion: 'identidad',
    tabFicha: 'general',
    formTab: 'datosPersonales',
    wizardStep: 0,
    severity: 'error',
    blocking: true,
    label: 'Ingresa los nombres del trabajador',
    detalle: 'Ingresa los nombres antes de activar la ficha.',
    controlPath: 'datosPersonales.nombres',
    category: 'Nombre del empleado',
    complete: hasText(s.nombres),
  });
  add({
    id: 'personal.lastname',
    seccion: 'identidad',
    tabFicha: 'general',
    formTab: 'datosPersonales',
    wizardStep: 0,
    severity: 'error',
    blocking: true,
    label: 'Ingresa el apellido paterno',
    detalle: 'Ingresa el apellido paterno antes de activar la ficha.',
    controlPath: 'datosPersonales.apellidoPaterno',
    category: 'Nombre del empleado',
    complete: hasText(s.apellidoPaterno),
  });
  add({
    id: 'personal.sex',
    seccion: 'identidad',
    tabFicha: 'general',
    formTab: 'datosPersonales',
    wizardStep: 0,
    severity: 'error',
    blocking: true,
    label: 'Selecciona el sexo registral para la ficha laboral',
    controlPath: 'datosPersonales.sexo',
    category: 'Identificacion legal',
    complete: hasText(s.sexo),
  });
  add({
    id: 'personal.country',
    seccion: 'identidad',
    tabFicha: 'general',
    formTab: 'datosPersonales',
    wizardStep: 0,
    severity: 'error',
    blocking: true,
    label: 'Selecciona pais o nacionalidad',
    detalle: 'Selecciona el pais antes de activar la ficha.',
    controlPath: 'datosPersonales.idPais',
    category: 'Informacion base',
    complete: isPositiveId(s.idPais),
  });
  add({
    id: 'personal.marital-status',
    seccion: 'identidad',
    tabFicha: 'general',
    formTab: 'datosPersonales',
    wizardStep: 0,
    severity: 'error',
    blocking: true,
    label: 'Selecciona el estado civil',
    controlPath: 'datosPersonales.estadoCivil',
    category: 'Informacion base',
    complete: hasText(s.estadoCivil),
  });
  add({
    id: 'personal.email-empty',
    seccion: 'identidad',
    tabFicha: 'general',
    formTab: 'datosPersonales',
    wizardStep: 0,
    severity: 'warning',
    blocking: false,
    label: 'Agrega correo de contacto si la empresa lo usara para comunicaciones laborales',
    controlPath: 'contacto.email',
    category: 'Informacion base',
    complete: hasText(s.email),
  });
  add({
    id: 'personal.phone-empty',
    seccion: 'identidad',
    tabFicha: 'general',
    formTab: 'datosPersonales',
    wizardStep: 0,
    severity: 'warning',
    blocking: false,
    label: 'Agrega telefono de contacto si la empresa lo usara para comunicaciones laborales',
    controlPath: 'contacto.telefono',
    category: 'Informacion base',
    complete: hasText(s.telefono),
  });
  add({
    id: 'contact.commune',
    seccion: 'identidad',
    tabFicha: 'general',
    formTab: 'datosPersonales',
    wizardStep: 1,
    severity: 'error',
    blocking: true,
    label: 'Selecciona la comuna del domicilio contractual',
    controlPath: 'contacto.idComuna',
    category: 'Domicilio',
    visible: esContratoDependiente,
    complete: isPositiveId(s.idComuna),
  });
  add({
    id: 'contact.commune-honorarios',
    seccion: 'identidad',
    tabFicha: 'general',
    formTab: 'datosPersonales',
    wizardStep: 1,
    severity: 'warning',
    blocking: false,
    label: 'Agrega comuna del prestador si se usara como dato administrativo de contacto',
    controlPath: 'contacto.idComuna',
    category: 'Domicilio',
    visible: esHonorarios,
    complete: isPositiveId(s.idComuna),
  });

  add({
    id: esHonorarios ? 'honorarios.service' : 'contract.position',
    seccion: 'contrato',
    tabFicha: 'laboral',
    formTab: 'contrato',
    wizardStep: 2,
    severity: 'error',
    blocking: true,
    label: esHonorarios ? 'Ingresa el servicio o funcion del prestador' : 'Ingresa el cargo o funcion del trabajador',
    detalle: esHonorarios ? 'Ingresa el servicio o funcion que prestara la persona a honorarios.' : 'Define un cargo real antes de activar la ficha.',
    controlPath: 'contrato.cargo',
    category: esHonorarios ? 'Honorarios' : 'Contrato',
    defaultCode: normalize(s.cargo ?? '') === normalize('Sin cargo') ? 'cargo:sin-cargo' : undefined,
    complete: hasText(s.cargo) && normalize(s.cargo ?? '') !== normalize('Sin cargo'),
  });
  add({
    id: 'contract.branch',
    seccion: 'contrato',
    tabFicha: 'laboral',
    formTab: 'contrato',
    wizardStep: 2,
    severity: 'error',
    blocking: true,
    label: 'Selecciona sucursal u organizacion',
    controlPath: 'contrato.idSucursal',
    category: 'Contrato',
    visible: esContratoDependiente,
    complete: isPositiveId(s.idSucursal),
  });
  add({
    id: 'honorarios.cost-center',
    seccion: 'contrato',
    tabFicha: 'laboral',
    formTab: 'contrato',
    wizardStep: 2,
    severity: 'warning',
    blocking: false,
    label: 'Selecciona sucursal o centro de costo si necesitas imputar internamente el servicio',
    controlPath: 'contrato.idSucursal',
    category: 'Honorarios',
    visible: esHonorarios,
    complete: isPositiveId(s.idSucursal) || isPositiveId(s.idCentroCosto),
  });
  add({
    id: 'contract.worker-type',
    seccion: 'jornada',
    tabFicha: 'laboral',
    formTab: 'contrato',
    wizardStep: 2,
    severity: 'error',
    blocking: true,
    label: 'Selecciona el tipo de trabajador',
    detalle: 'Selecciona un tipo de trabajador real antes de activar la ficha.',
    controlPath: 'contrato.idTipoTrabajador',
    category: 'Contrato',
    defaultCode: 'tipo-trabajador:default',
    visible: esContratoDependiente,
    complete: isPositiveId(s.idTipoTrabajador),
  });
  add({
    id: 'contract.schedule-type',
    seccion: 'jornada',
    tabFicha: 'laboral',
    formTab: 'contrato',
    wizardStep: 3,
    severity: 'error',
    blocking: true,
    label: 'Selecciona el tipo de jornada',
    detalle: 'Selecciona un tipo de jornada real antes de activar la ficha.',
    controlPath: 'contrato.idTipoJornada',
    category: 'Jornada',
    defaultCode: 'tipo-jornada:default',
    visible: esContratoDependiente,
    complete: isPositiveId(s.idTipoJornada),
  });
  add({
    id: 'contract.contract-type',
    seccion: 'contrato',
    tabFicha: 'laboral',
    formTab: 'contrato',
    wizardStep: 2,
    severity: 'error',
    blocking: true,
    label: 'Selecciona el tipo de contrato laboral',
    controlPath: 'contrato.tipoContrato',
    category: 'Contrato',
    visible: esContratoDependiente,
    complete: hasText(s.tipoContrato),
  });
  add({
    id: 'contract.start-date',
    seccion: 'contrato',
    tabFicha: 'laboral',
    formTab: 'contrato',
    wizardStep: 2,
    severity: 'error',
    blocking: true,
    label: 'Ingresa la fecha de ingreso',
    detalle: 'Ingresa una fecha de ingreso real antes de activar la ficha.',
    controlPath: 'contrato.fechaIngreso',
    category: 'Fechas',
    complete: hasText(s.fechaIngreso),
  });
  add({
    id: 'contract.document-date',
    seccion: 'contrato',
    tabFicha: 'laboral',
    formTab: 'contrato',
    wizardStep: 2,
    severity: 'error',
    blocking: true,
    label: 'Ingresa la fecha del contrato',
    detalle: 'Ingresa una fecha de contrato real antes de activar la ficha.',
    controlPath: 'contrato.fechaContrato',
    category: 'Fechas',
    visible: esContratoDependiente,
    complete: hasText(s.fechaContrato),
  });
  add({
    id: 'contract.household.modality',
    seccion: 'contrato casa particular',
    tabFicha: 'laboral',
    formTab: 'contrato',
    wizardStep: 2,
    severity: 'error',
    blocking: true,
    label: 'Selecciona modalidad de casa particular',
    detalle: 'Indica si el contrato de casa particular es puertas afuera o puertas adentro.',
    controlPath: 'contrato.casaParticularModalidad',
    category: 'Casa particular',
    visible: esCasaParticular,
    complete: s.casaParticularModalidad === 'PUERTAS_AFUERA' || s.casaParticularModalidad === 'PUERTAS_ADENTRO',
  });
  add({
    id: 'contract.household.duties',
    seccion: 'contrato casa particular',
    tabFicha: 'laboral',
    formTab: 'contrato',
    wizardStep: 2,
    severity: 'error',
    blocking: true,
    label: 'Describe las labores especificas de casa particular',
    controlPath: 'contrato.casaParticularLabores',
    category: 'Casa particular',
    visible: esCasaParticular,
    complete: hasText(s.casaParticularLabores),
  });
  add({
    id: 'contract.household.work-address',
    seccion: 'contrato casa particular',
    tabFicha: 'laboral',
    formTab: 'contrato',
    wizardStep: 2,
    severity: 'error',
    blocking: true,
    label: 'Ingresa el domicilio especifico donde se prestaran labores',
    controlPath: 'contrato.casaParticularDomicilioEspecifico',
    category: 'Casa particular',
    visible: esCasaParticular,
    complete: hasText(s.casaParticularDomicilioEspecifico),
  });
  add({
    id: 'contract.household.dt-status',
    seccion: 'contrato casa particular',
    tabFicha: 'laboral',
    formTab: 'contrato',
    wizardStep: 2,
    severity: 'error',
    blocking: true,
    label: 'Selecciona el estado del registro DT del contrato',
    controlPath: 'contrato.casaParticularRegistroDtEstado',
    category: 'Casa particular',
    visible: esCasaParticular,
    complete:
      s.casaParticularRegistroDtEstado === 'PENDIENTE' ||
      s.casaParticularRegistroDtEstado === 'REGISTRADO' ||
      s.casaParticularRegistroDtEstado === 'NO_APLICA',
  });
  add({
    id: 'contract.household.dt-date',
    seccion: 'contrato casa particular',
    tabFicha: 'laboral',
    formTab: 'contrato',
    wizardStep: 2,
    severity: 'error',
    blocking: true,
    label: 'Ingresa la fecha de registro DT',
    controlPath: 'contrato.casaParticularRegistroDtFecha',
    category: 'Casa particular',
    visible: esCasaParticular && s.casaParticularRegistroDtEstado === 'REGISTRADO',
    complete: hasText(s.casaParticularRegistroDtFecha),
  });
  add({
    id: 'contract.household.dt-folio',
    seccion: 'contrato casa particular',
    tabFicha: 'laboral',
    formTab: 'contrato',
    wizardStep: 2,
    severity: 'error',
    blocking: true,
    label: 'Ingresa folio o comprobante del registro DT',
    controlPath: 'contrato.casaParticularRegistroDtFolio',
    category: 'Casa particular',
    visible: esCasaParticular && s.casaParticularRegistroDtEstado === 'REGISTRADO',
    complete: hasText(s.casaParticularRegistroDtFolio),
  });
  add({
    id: 'contract.end-date',
    seccion: 'contrato',
    tabFicha: 'laboral',
    formTab: 'contrato',
    wizardStep: 2,
    severity: 'error',
    blocking: true,
    label: 'Ingresa la fecha de termino del contrato',
    controlPath: 'contrato.fechaTermino',
    category: 'Fechas',
    visible:
      esContratoDependiente &&
      hasText(s.tipoContrato) &&
      s.tipoContrato !== 'INDEFINIDO' &&
      s.tipoContrato !== 'CASA_PARTICULAR',
    complete: hasText(s.fechaTermino),
  });
  add({
    id: 'contract.end-date-after-start',
    seccion: 'contrato',
    tabFicha: 'laboral',
    formTab: 'contrato',
    wizardStep: 2,
    severity: 'error',
    blocking: true,
    label: 'La fecha de termino debe ser posterior o igual a la fecha de ingreso',
    controlPath: 'contrato.fechaTermino',
    category: 'Fechas',
    visible:
      esContratoDependiente &&
      hasText(s.tipoContrato) &&
      s.tipoContrato !== 'INDEFINIDO' &&
      s.tipoContrato !== 'CASA_PARTICULAR' &&
      hasText(s.fechaTermino),
    complete: fechaNoAnterior(s.fechaTermino, s.fechaIngreso),
  });
  add({
    id: 'contract.fixed-term-max-two-years',
    seccion: 'contrato',
    tabFicha: 'laboral',
    formTab: 'contrato',
    wizardStep: 2,
    severity: 'error',
    blocking: true,
    label: 'El contrato a plazo fijo no puede superar dos anos',
    detalle: 'La excepcion maxima para gerentes o personas con titulo profesional o tecnico es de dos anos; sobre ese limite no debe finalizarse el alta.',
    controlPath: 'contrato.fechaTermino',
    category: 'Plazo fijo',
    visible: esContratoDependiente && s.tipoContrato === 'PLAZO_FIJO' && hasText(s.fechaTermino) && hasText(s.fechaIngreso),
    complete: fechaDentroDeAnos(s.fechaTermino, s.fechaIngreso, 2),
  });
  add({
    id: 'contract.fixed-term-over-one-year-review',
    seccion: 'contrato',
    tabFicha: 'laboral',
    formTab: 'contrato',
    wizardStep: 2,
    severity: 'warning',
    blocking: false,
    label: 'Plazo fijo sobre un ano requiere excepcion documentada',
    detalle: 'El plazo fijo general no debe exceder un ano; solo puede llegar hasta dos anos en casos excepcionales como gerentes o personas con titulo profesional o tecnico.',
    controlPath: 'contrato.fechaTermino',
    category: 'Plazo fijo',
    visible: esContratoDependiente && s.tipoContrato === 'PLAZO_FIJO' && hasText(s.fechaTermino) && hasText(s.fechaIngreso),
    complete: fechaDentroDeAnos(s.fechaTermino, s.fechaIngreso, 1),
  });
  add({
    id: esHonorarios ? 'honorarios.amount' : 'contract.salary',
    seccion: 'remuneracion',
    tabFicha: 'remuneracion',
    formTab: 'contrato',
    wizardStep: 3,
    severity: 'error',
    blocking: true,
    label: esHonorarios ? 'Ingresa el monto bruto de honorarios' : 'Ingresa sueldo base valido',
    detalle: esHonorarios ? 'Ingresa el monto bruto pactado para la boleta de honorarios.' : 'Ingresa una remuneracion base valida antes de activar la ficha.',
    controlPath: 'contrato.sueldoBase',
    category: esHonorarios ? 'Honorarios' : 'Remuneracion',
    defaultCode: esHonorarios ? undefined : 'sueldo-base:invalido',
    complete: isPositiveNumber(s.sueldoBase),
  });
  add({
    id: esHonorarios ? 'honorarios.currency' : 'contract.currency',
    seccion: 'remuneracion',
    tabFicha: 'remuneracion',
    formTab: 'contrato',
    wizardStep: 3,
    severity: 'error',
    blocking: true,
    label: esHonorarios ? 'Selecciona la moneda del monto bruto de honorarios' : 'Selecciona la moneda de remuneracion',
    controlPath: 'contrato.idMoneda',
    category: esHonorarios ? 'Honorarios' : 'Remuneracion',
    complete: isPositiveId(s.idMoneda),
  });
  add({
    id: 'contract.weekly-hours',
    seccion: 'jornada',
    tabFicha: 'laboral',
    formTab: 'contrato',
    wizardStep: 3,
    severity: 'error',
    blocking: true,
    label: 'Completa las horas semanales pactadas',
    detalle: 'Ingresa una jornada semanal valida antes de activar la ficha.',
    controlPath: 'contrato.horasSemanales',
    category: 'Jornada',
    visible: esContratoDependiente,
    complete: isPositiveNumber(s.horasSemanales),
  });
  add({
    id: 'contract.weekly-hours-current-limit',
    seccion: 'jornada',
    tabFicha: 'laboral',
    formTab: 'contrato',
    wizardStep: 3,
    severity: 'error',
    blocking: true,
    label: 'La jornada ordinaria no puede superar 42 horas semanales',
    detalle: 'Desde el 26 de abril de 2026 el maximo ordinario vigente es 42 horas semanales. Si corresponde una excepcion, debe modelarse antes de cerrar el alta.',
    controlPath: 'contrato.horasSemanales',
    category: 'Jornada',
    visible: aplicaLimiteHoras && isPositiveNumber(s.horasSemanales),
    complete: Number(s.horasSemanales) <= 42,
  });
  add({
    id: 'contract.weekly-hours-exclusion-warning',
    seccion: 'jornada',
    tabFicha: 'laboral',
    formTab: 'contrato',
    wizardStep: 3,
    severity: 'warning',
    blocking: false,
    label: 'La jornada informada supera 42 horas y queda respaldada por excepcion declarada',
    detalle: 'Mantener respaldo contractual y documental de la exclusion de limite de jornada.',
    controlPath: 'contrato.excluidoLimiteJornada',
    category: 'Jornada',
    visible: jornadaExcluida && isPositiveNumber(s.horasSemanales) && Number(s.horasSemanales) > 42,
    complete: false,
  });
  add({
    id: 'contract.schedule-exclusion-causal',
    seccion: 'jornada',
    tabFicha: 'laboral',
    formTab: 'contrato',
    wizardStep: 3,
    severity: 'error',
    blocking: true,
    label: 'Selecciona la causal de exclusion de limite de jornada',
    controlPath: 'contrato.causalExclusionJornada',
    category: 'Jornada',
    visible: jornadaExcluida,
    complete:
      s.causalExclusionJornada === 'ALTA_RESPONSABILIDAD' ||
      s.causalExclusionJornada === 'SIN_FISCALIZACION_SUPERIOR_INMEDIATA',
  });
  add({
    id: 'contract.schedule-exclusion-justification',
    seccion: 'jornada',
    tabFicha: 'laboral',
    formTab: 'contrato',
    wizardStep: 3,
    severity: 'error',
    blocking: true,
    label: 'Justifica la exclusion de limite de jornada',
    detalle: 'Describe por que el cargo queda fuera de limite de jornada y donde se respalda contractualmente.',
    controlPath: 'contrato.justificacionExclusionJornada',
    category: 'Jornada',
    visible: jornadaExcluida,
    complete: hasText(s.justificacionExclusionJornada),
  });
  add({
    id: 'contract.household.live-in-distribution',
    seccion: 'jornada',
    tabFicha: 'laboral',
    formTab: 'contrato',
    wizardStep: 3,
    severity: 'error',
    blocking: true,
    label: 'Describe distribucion y descansos de puertas adentro',
    detalle: 'Para casa particular puertas adentro registra distribucion de jornada y descansos pactados.',
    controlPath: 'contrato.distribucionJornada',
    category: 'Casa particular',
    visible: casaPuertasAdentro,
    complete: hasText(s.distribucionJornada),
  });
  add({
    id: 'contract.weekly-days',
    seccion: 'jornada',
    tabFicha: 'laboral',
    formTab: 'contrato',
    wizardStep: 3,
    severity: 'error',
    blocking: true,
    label: 'Completa los dias semanales de trabajo',
    detalle: 'Ingresa dias semanales validos antes de activar la ficha.',
    controlPath: 'contrato.diasSemanales',
    category: 'Jornada',
    visible: esContratoDependiente,
    complete: isPositiveNumber(s.diasSemanales),
  });
  add({
    id: 'contract.weekly-days-limit',
    seccion: 'jornada',
    tabFicha: 'laboral',
    formTab: 'contrato',
    wizardStep: 3,
    severity: 'error',
    blocking: true,
    label: 'La distribucion semanal no debe superar 6 dias',
    controlPath: 'contrato.diasSemanales',
    category: 'Jornada',
    visible: aplicaLimiteHoras && isPositiveNumber(s.diasSemanales),
    complete: Number(s.diasSemanales) <= 6,
  });
  add({
    id: 'contract.week-run',
    seccion: 'remuneracion',
    tabFicha: 'remuneracion',
    formTab: 'contrato',
    wizardStep: 4,
    severity: 'error',
    blocking: true,
    label: 'Completa los dias laborables para semana corrida',
    controlPath: 'contrato.semanaCorridaDiasLaborables',
    category: 'Semana corrida',
    visible: esContratoDependiente && s.semanaCorridaActiva === true,
    complete: Array.isArray(s.semanaCorridaDiasLaborables) && s.semanaCorridaDiasLaborables.length > 0,
  });
  add({
    id: 'contract.extreme-zone-area',
    seccion: 'remuneracion',
    tabFicha: 'remuneracion',
    formTab: 'contrato',
    wizardStep: 4,
    severity: 'error',
    blocking: true,
    label: 'Selecciona el territorio asociado a zona extrema',
    controlPath: 'contrato.zonaExtremaTerritorio',
    category: 'Zona extrema',
    visible: esContratoDependiente && s.zonaExtremaActiva === true,
    complete: hasText(s.zonaExtremaTerritorio),
  });
  add({
    id: 'contract.extreme-zone-rate',
    seccion: 'remuneracion',
    tabFicha: 'remuneracion',
    formTab: 'contrato',
    wizardStep: 4,
    severity: 'error',
    blocking: true,
    label: 'Ingresa el porcentaje de zona extrema',
    controlPath: 'contrato.zonaExtremaPorcentaje',
    category: 'Zona extrema',
    visible: esContratoDependiente && s.zonaExtremaActiva === true,
    complete: isPositiveNumber(s.zonaExtremaPorcentaje),
  });
  add({
    id: 'contract.family-allowance',
    seccion: 'remuneracion',
    tabFicha: 'remuneracion',
    formTab: 'contrato',
    wizardStep: 4,
    severity: 'warning',
    blocking: false,
    label: 'Confirma el tramo de cargas familiares antes de usar la asignacion en remuneraciones',
    controlPath: 'contrato.idTramoCarga',
    category: 'Cargas',
    visible: esContratoDependiente && Number(s.cargas ?? 0) > 0,
    complete: isPositiveId(s.idTramoCarga),
  });
  add({
    id: 'profile-laboral.minor-review',
    seccion: 'contrato',
    tabFicha: 'laboral',
    formTab: 'contrato',
    wizardStep: 8,
    severity: 'error',
    blocking: true,
    label: 'Menor de 18 detectado: registra trabajador adolescente protegido o autorizacion de menor',
    controlPath: 'perfilLaboral.trabajadorAdolescenteProtegido',
    category: 'Condiciones especiales',
    visible: esContratoDependiente && s.perfilLaboralMenorEdad === true,
    complete: !requiereRevisionMenor,
  });
  add({
    id: 'profile-laboral.support',
    seccion: 'contrato',
    tabFicha: 'laboral',
    formTab: 'contrato',
    wizardStep: 8,
    severity: 'warning',
    blocking: false,
    label: 'Marca respaldo administrativo registrado para las condiciones especiales seleccionadas',
    controlPath: 'perfilLaboral.respaldoRegistrado',
    category: 'Condiciones especiales',
    visible: esContratoDependiente && s.tieneCondicionesEspeciales === true,
    complete: s.respaldoRegistrado === true,
  });
  add({
    id: 'profile-laboral.valid-from',
    seccion: 'contrato',
    tabFicha: 'laboral',
    formTab: 'contrato',
    wizardStep: 8,
    severity: 'error',
    blocking: true,
    label: 'Completa la vigencia de inicio de las condiciones especiales',
    controlPath: 'perfilLaboral.vigenciaInicio',
    category: 'Condiciones especiales',
    visible: esContratoDependiente && s.tieneCondicionesEspeciales === true,
    complete: hasText(s.vigenciaInicioCondiciones),
  });
  add({
    id: 'profile-laboral.observation-length',
    seccion: 'contrato',
    tabFicha: 'laboral',
    formTab: 'contrato',
    wizardStep: 8,
    severity: 'error',
    blocking: true,
    label: 'Reduce la observacion interna de condiciones especiales',
    controlPath: 'perfilLaboral.observacion',
    category: 'Condiciones especiales',
    visible: esContratoDependiente && hasText(s.observacionCondiciones),
    complete: s.observacionCondicionesValida !== false,
  });

  addPrevisionItems(out, add, s, esContratoDependiente, requiereSalud, esFonasa, hasCuenta2, tieneApv);
  return out;
}

function addPrevisionItems(
  _out: EmpleadoFichaValidacionItem[],
  add: (item: ItemDef) => void,
  s: EmpleadoFichaValidacionSnapshot,
  esContratoDependiente: boolean,
  requiereSalud: boolean,
  esFonasa: boolean,
  hasCuenta2: boolean,
  tieneApv: boolean,
): void {
  add({
    id: 'prevision.regime',
    seccion: 'prevision y salud',
    tabFicha: 'prevision',
    formTab: 'previsionSalud',
    wizardStep: 5,
    severity: 'error',
    blocking: true,
    label: 'Selecciona el regimen previsional',
    detalle: s.tipoPrevision === 'NINGUNA'
      ? 'La opcion "Sin prevision" no habilita calculo de nomina. Selecciona AFP o IPS antes de validar para remuneraciones.'
      : 'Selecciona el regimen previsional antes de activar la ficha.',
    controlPath: 'previsionSalud.tipoRegimenPrevisional',
    category: 'Prevision',
    visible: esContratoDependiente,
    complete: hasText(s.tipoPrevision) && s.tipoPrevision !== 'NINGUNA',
  });
  add({
    id: 'prevision.afp',
    seccion: 'prevision y salud',
    tabFicha: 'prevision',
    formTab: 'previsionSalud',
    wizardStep: 5,
    severity: 'error',
    blocking: true,
    label: 'Selecciona la AFP del trabajador',
    detalle: 'Selecciona la AFP antes de activar la ficha.',
    controlPath: 'previsionSalud.idAfp',
    category: 'Prevision',
    visible: esContratoDependiente && s.tipoPrevision === 'AFP',
    complete: isPositiveId(s.idAfp),
  });
  const ipsCompletoCatalogo = isPositiveId(s.idEntidadPrevisionalIps) && isPositiveId(s.idExCajaPrevisional) && isPositiveId(s.idRegimenExCaja);
  const ipsCompletoManual = hasText(s.nombreExCaja) && hasText(s.regimenExCaja) && isPositiveNumber(s.tasaExCaja);
  add({
    id: 'prevision.ips-data',
    seccion: 'prevision y salud',
    tabFicha: 'prevision',
    formTab: 'previsionSalud',
    wizardStep: 5,
    severity: 'error',
    blocking: true,
    label: 'Completa la informacion IPS o Ex-Caja',
    detalle: 'Completa la informacion IPS o Ex-Caja antes de activar la ficha.',
    controlPath: 'previsionSalud.idEntidadPrevisionalIps',
    category: 'IPS',
    visible: esContratoDependiente && s.tipoPrevision === 'IPS',
    complete: ipsCompletoCatalogo || ipsCompletoManual,
  });
  add({
    id: 'prevision.health',
    seccion: 'prevision y salud',
    tabFicha: 'prevision',
    formTab: 'previsionSalud',
    wizardStep: 5,
    severity: 'error',
    blocking: true,
    label: 'Selecciona la institucion de salud',
    detalle: 'Selecciona la institucion de salud antes de activar la ficha.',
    controlPath: 'previsionSalud.idSalud',
    category: 'Salud',
    visible: esContratoDependiente && requiereSalud,
    complete: isPositiveId(s.idSalud),
  });
  add({
    id: 'prevision.health-currency',
    seccion: 'prevision y salud',
    tabFicha: 'prevision',
    formTab: 'previsionSalud',
    wizardStep: 5,
    severity: 'error',
    blocking: true,
    label: 'Selecciona la moneda del plan de salud',
    detalle: 'Selecciona la moneda del plan de salud antes de activar la ficha.',
    controlPath: 'previsionSalud.idMonedaPlan',
    category: 'Salud',
    visible: esContratoDependiente && requiereSalud,
    complete: isPositiveId(s.idMonedaPlan),
  });
  add({
    id: 'prevision.health-plan',
    seccion: 'prevision y salud',
    tabFicha: 'prevision',
    formTab: 'previsionSalud',
    wizardStep: 5,
    severity: 'error',
    blocking: true,
    label: 'Ingresa el valor del plan de salud',
    detalle: 'Ingresa un valor de plan de salud valido antes de activar la ficha.',
    controlPath: 'previsionSalud.valorPlan',
    category: 'Salud',
    visible: esContratoDependiente && requiereSalud && !esFonasa,
    complete: isNonNegativeNumber(s.valorPlan),
  });
  add({
    id: 'prevision.health-ges',
    seccion: 'prevision y salud',
    tabFicha: 'prevision',
    formTab: 'previsionSalud',
    wizardStep: 5,
    severity: 'error',
    blocking: true,
    label: 'Ingresa el adicional Auge o GES',
    detalle: 'Ingresa el adicional Auge/GES antes de activar la ficha.',
    controlPath: 'previsionSalud.adicionalAugeGes',
    category: 'Salud',
    visible: esContratoDependiente && requiereSalud && !esFonasa,
    complete: isNonNegativeNumber(s.adicionalAugeGes),
  });
  add({
    id: 'prevision.account2-currency',
    seccion: 'prevision y salud',
    tabFicha: 'prevision',
    formTab: 'previsionSalud',
    wizardStep: 5,
    severity: 'error',
    blocking: true,
    label: 'Selecciona la moneda de Cuenta 2 AFP',
    controlPath: 'previsionSalud.idMonedaCuenta2',
    category: 'Cuenta 2',
    visible: esContratoDependiente && hasCuenta2,
    complete: isPositiveId(s.idMonedaCuenta2),
  });
  add({
    id: 'prevision.account2-value',
    seccion: 'prevision y salud',
    tabFicha: 'prevision',
    formTab: 'previsionSalud',
    wizardStep: 5,
    severity: 'error',
    blocking: true,
    label: 'Ingresa el valor de Cuenta 2 AFP',
    controlPath: 'previsionSalud.valorCuenta2',
    category: 'Cuenta 2',
    visible: esContratoDependiente && hasCuenta2,
    complete: isPositiveNumber(s.valorCuenta2),
  });
  add({
    id: 'prevision.apv-institution',
    seccion: 'APVI',
    tabFicha: 'prevision',
    formTab: 'previsionSalud',
    wizardStep: 6,
    severity: 'error',
    blocking: true,
    label: 'Selecciona la institucion APVI',
    detalle: 'Completa APVI o desactiva la opcion Tiene APVI.',
    controlPath: 'previsionSalud.idInstitucionApv',
    category: 'APVI',
    defaultCode: 'apvi:incompleto',
    visible: esContratoDependiente && tieneApv,
    complete: isPositiveId(s.idInstitucionApv),
  });
  add({
    id: 'prevision.apv-currency',
    seccion: 'APVI',
    tabFicha: 'prevision',
    formTab: 'previsionSalud',
    wizardStep: 6,
    severity: 'error',
    blocking: true,
    label: 'Selecciona la moneda APVI',
    detalle: 'Completa APVI o desactiva la opcion Tiene APVI.',
    controlPath: 'previsionSalud.idMonedaApv',
    category: 'APVI',
    defaultCode: 'apvi:incompleto',
    visible: esContratoDependiente && tieneApv,
    complete: isPositiveId(s.idMonedaApv),
  });
  add({
    id: 'prevision.apv-amount',
    seccion: 'APVI',
    tabFicha: 'prevision',
    formTab: 'previsionSalud',
    wizardStep: 6,
    severity: 'error',
    blocking: true,
    label: 'Ingresa el monto APVI',
    detalle: 'Completa APVI o desactiva la opcion Tiene APVI.',
    controlPath: 'previsionSalud.montoApv',
    category: 'APVI',
    defaultCode: 'apvi:incompleto',
    visible: esContratoDependiente && tieneApv,
    complete: isPositiveNumber(s.montoApv),
  });
  add({
    id: 'prevision.apv-payment',
    seccion: 'APVI',
    tabFicha: 'prevision',
    formTab: 'previsionSalud',
    wizardStep: 6,
    severity: 'error',
    blocking: true,
    label: 'Selecciona la forma de pago APVI',
    detalle: 'Completa APVI o desactiva la opcion Tiene APVI.',
    controlPath: 'previsionSalud.idFormaPagoApv',
    category: 'APVI',
    defaultCode: 'apvi:incompleto',
    visible: esContratoDependiente && tieneApv,
    complete: isPositiveId(s.idFormaPagoApv),
  });
  add({
    id: 'prevision.apv-agreement',
    seccion: 'APVI',
    tabFicha: 'prevision',
    formTab: 'previsionSalud',
    wizardStep: 6,
    severity: 'error',
    blocking: true,
    label: 'Completa el deposito convenido APVI',
    detalle: 'Completa APVI o desactiva la opcion Tiene APVI.',
    controlPath: 'previsionSalud.depositoConvenidoApvi',
    category: 'APVI',
    defaultCode: 'apvi:incompleto',
    visible: esContratoDependiente && tieneApv,
    complete: isNonNegativeNumber(s.depositoConvenidoApvi),
  });
  add({
    id: 'bank.bank',
    seccion: 'pago',
    tabFicha: 'pago',
    formTab: 'bancario',
    wizardStep: 7,
    severity: 'error',
    blocking: true,
    label: 'Selecciona el banco para la transferencia',
    detalle: 'Selecciona un banco real antes de activar la ficha.',
    controlPath: 'bancario.idBanco',
    category: 'Bancario',
    defaultCode: 'banco:default',
    visible: esContratoDependiente,
    complete: isPositiveId(s.idBanco),
  });
  add({
    id: 'bank.account-type',
    seccion: 'pago',
    tabFicha: 'pago',
    formTab: 'bancario',
    wizardStep: 7,
    severity: 'error',
    blocking: true,
    label: 'Selecciona el tipo de cuenta bancaria',
    detalle: 'Selecciona un tipo de cuenta real antes de activar la ficha.',
    controlPath: 'bancario.idTipoCuentaBancaria',
    category: 'Bancario',
    defaultCode: 'tipo-cuenta:default',
    visible: esContratoDependiente,
    complete: isPositiveId(s.idTipoCuentaBancaria),
  });
  add({
    id: 'bank.account-number',
    seccion: 'pago',
    tabFicha: 'pago',
    formTab: 'bancario',
    wizardStep: 7,
    severity: 'error',
    blocking: true,
    label: 'Ingresa una cuenta bancaria real',
    detalle: esCuentaBorrador(s.numeroCuenta)
      ? 'Reemplaza la cuenta bancaria temporal antes de finalizar.'
      : 'Ingresa una cuenta bancaria real antes de activar la ficha.',
    controlPath: 'bancario.numeroCuenta',
    category: 'Bancario',
    defaultCode: esCuentaBorrador(s.numeroCuenta) ? 'cuenta-bancaria:draft' : undefined,
    visible: esContratoDependiente,
    complete: hasText(s.numeroCuenta) && !esCuentaBorrador(s.numeroCuenta),
  });
  add({
    id: 'honorarios.bank-data',
    seccion: 'pago',
    tabFicha: 'pago',
    formTab: 'bancario',
    wizardStep: 7,
    severity: 'warning',
    blocking: false,
    label: 'Agrega datos de pago si el prestador recibira transferencia',
    controlPath: 'bancario.idBanco',
    category: 'Honorarios',
    visible: !esContratoDependiente,
    complete: isPositiveId(s.idBanco) && isPositiveId(s.idTipoCuentaBancaria) && hasText(s.numeroCuenta) && !esCuentaBorrador(s.numeroCuenta),
  });
}

function rutValido(value: string | null | undefined): boolean {
  if (!hasText(value)) return false;
  try {
    parseRut(value ?? '');
    return true;
  } catch {
    return false;
  }
}

function hasText(value: string | null | undefined): boolean {
  return typeof value === 'string' && value.trim().length > 0;
}

function isPositiveId(value: number | null | undefined): boolean {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

function isPositiveNumber(value: number | null | undefined): boolean {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

function isNonNegativeNumber(value: number | null | undefined): boolean {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}

function esCuentaBorrador(value: string | null | undefined): boolean {
  return typeof value === 'string' && value.trim().toUpperCase().startsWith('DRAFT-');
}

function fechaNoAnterior(
  fecha: string | null | undefined,
  referencia: string | null | undefined,
): boolean {
  const actual = parseYmd(fecha);
  const base = parseYmd(referencia);
  if (!actual || !base) {
    return true;
  }
  return actual.getTime() >= base.getTime();
}

function fechaDentroDeAnos(
  fecha: string | null | undefined,
  referencia: string | null | undefined,
  anos: number,
): boolean {
  const actual = parseYmd(fecha);
  const base = parseYmd(referencia);
  if (!actual || !base) {
    return true;
  }
  const limite = new Date(base);
  limite.setFullYear(limite.getFullYear() + anos);
  return actual.getTime() <= limite.getTime();
}

function calcularEdad(
  fechaNacimiento: string | null | undefined,
  fechaReferencia: string | null | undefined,
): number {
  const nacimiento = parseYmd(fechaNacimiento);
  const referencia = parseYmd(fechaReferencia) ?? new Date();
  if (!nacimiento || nacimiento > referencia) {
    return Number.POSITIVE_INFINITY;
  }

  let edad = referencia.getFullYear() - nacimiento.getFullYear();
  const monthDelta = referencia.getMonth() - nacimiento.getMonth();
  const dayDelta = referencia.getDate() - nacimiento.getDate();
  if (monthDelta < 0 || (monthDelta === 0 && dayDelta < 0)) {
    edad -= 1;
  }
  return edad;
}

function parseYmd(value: string | null | undefined): Date | null {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }
  const [year, month, day] = value.split('-').map(Number);
  const parsed = new Date(year, month - 1, day);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}
