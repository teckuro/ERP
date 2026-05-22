import type { EmpleadoEstado } from '../models/empleado-listado.model';
import type { CrearEmpleadoPayload } from '../models/empleado-payload.model';
import type { RelacionLaboral, TipoContrato, TipoRegimenPrevisional } from '../models/empleado.model';
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
  idComuna?: number | null;
  idSucursal?: number | null;
  idCentroCosto?: number | null;
  cargo?: string | null;
  fechaContrato?: string | null;
  tipoContrato?: TipoContrato | null;
  idTipoTrabajador?: number | null;
  idTipoJornada?: number | null;
  seguroCesantia?: boolean | null;
  fechaIngreso?: string | null;
  fechaTermino?: string | null;
  sueldoBase?: number | null;
  idMoneda?: number | null;
  horasSemanales?: number | null;
  diasSemanales?: number | null;
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
): EmpleadoFichaValidacionSnapshot {
  return {
    ...payload,
    relacionLaboral: 'CONTRATO',
    pasoAltaAvanzada,
    pasaporte: payload.pasaporte,
    perfilLaboralMenorEdad: false,
    trabajadorAdolescenteProtegido: true,
    autorizacionMenorRegistrada: true,
    tieneCondicionesEspeciales: (payload.condicionesTrabajador ?? []).length > 0,
    respaldoRegistrado: true,
    vigenciaInicioCondiciones: payload.fechaIngreso,
    observacionCondicionesValida: true,
  };
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
    visible: esContratoDependiente && hasText(s.tipoContrato) && s.tipoContrato !== 'INDEFINIDO',
    complete: hasText(s.fechaTermino),
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
    severity: 'warning',
    blocking: false,
    label: 'Menor de 18 detectado: revisa si corresponde trabajador adolescente protegido o autorizacion de menor',
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
    detalle: isDraftAccount(s.numeroCuenta)
      ? 'Reemplaza la cuenta bancaria temporal antes de finalizar.'
      : 'Ingresa una cuenta bancaria real antes de activar la ficha.',
    controlPath: 'bancario.numeroCuenta',
    category: 'Bancario',
    defaultCode: isDraftAccount(s.numeroCuenta) ? 'cuenta-bancaria:draft' : undefined,
    visible: esContratoDependiente,
    complete: hasText(s.numeroCuenta) && !isDraftAccount(s.numeroCuenta),
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
    complete: isPositiveId(s.idBanco) && isPositiveId(s.idTipoCuentaBancaria) && hasText(s.numeroCuenta) && !isDraftAccount(s.numeroCuenta),
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

function isDraftAccount(value: string | null | undefined): boolean {
  return typeof value === 'string' && value.trim().toUpperCase().startsWith('DRAFT-');
}

function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}
