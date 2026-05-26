import type {
  AfcParametro,
  AfpParametro,
  IsapreParametro,
  ParametroGeneral,
  TablaImpuestoUnicoParametro,
  TramoCargaParametro,
} from '../../parametros-generales/models/parametro-general.model';
import type {
  LineaLiquidacionCalculada,
  LiquidacionCalculada,
  MotorCalculoInput,
  MotorCalculoIssue,
  MotorCalculoPeriodoResultado,
  MotorCalculoSeveridad,
  MotorCalculoTrazabilidad,
  TrabajadorMotorCalculoSnapshot,
} from '../models/proceso-mensual.model';

export function generarCalculoPreliminarPeriodo(
  input: MotorCalculoInput,
  generadoEn: string,
): MotorCalculoPeriodoResultado {
  const issuesPeriodo = validarEntradaPeriodo(input);
  const liquidaciones = input.trabajadores.map((trabajador) => calcularTrabajador({ input, trabajador }));
  const issues = [...issuesPeriodo, ...liquidaciones.flatMap((l) => l.issues)];
  const totalBloqueados = liquidaciones.filter((l) => l.estado === 'con_bloqueos').length;
  const totalConAdvertencias = liquidaciones.filter((l) => l.estado === 'con_advertencias').length;
  const totalTrabajadoresCalculados = liquidaciones.filter((l) => l.estado !== 'con_bloqueos').length;

  return {
    periodo: input.periodo,
    estado: issuesPeriodo.some((i) => i.severidad === 'BLOQUEO') || totalBloqueados > 0
      ? 'con_bloqueos'
      : 'calculado_preliminar',
    generadoEn,
    resumen: {
      totalTrabajadoresCalculados,
      totalBloqueados,
      totalConAdvertencias,
      totalHaberes: sumar(liquidaciones.map((l) => l.totalHaberes)),
      totalDescuentos: sumar(liquidaciones.map((l) => l.totalDescuentos)),
      totalLiquidoPreliminar: sumar(liquidaciones.map((l) => l.liquidoAPago)),
    },
    liquidaciones,
    issues,
  };
}

export function calcularTrabajador(args: {
  input: MotorCalculoInput;
  trabajador: TrabajadorMotorCalculoSnapshot;
}): LiquidacionCalculada {
  const { input, trabajador } = args;
  const issues: MotorCalculoIssue[] = [];
  const trazabilidad: MotorCalculoTrazabilidad[] = [];
  const haberesImponibles: LineaLiquidacionCalculada[] = [];
  const haberesNoImponibles: LineaLiquidacionCalculada[] = [];
  const descuentosLegales: LineaLiquidacionCalculada[] = [];
  const descuentosVoluntarios: LineaLiquidacionCalculada[] = [];

  if (!trabajador.aptoParaRemuneraciones || trabajador.estado !== 'activo') {
    pushIssue(issues, 'TRABAJADOR_NO_CALCULABLE', 'BLOQUEO', 'Trabajador no calculable segun pre-nomina.', 'pre_nomina', trabajador.idPersona, 'estado');
  }
  if (!trabajador.idContrato || !trabajador.tipoContrato) {
    pushIssue(issues, 'FALTA_CONTRATO', 'BLOQUEO', 'Falta contrato vigente o tipo de contrato.', 'empleados', trabajador.idPersona, 'contrato');
  }
  if (trabajador.sueldoBase == null || trabajador.sueldoBase <= 0) {
    pushIssue(issues, 'FALTA_SUELDO_BASE', 'BLOQUEO', 'Falta sueldo base del trabajador.', 'empleados', trabajador.idPersona, 'sueldoBase');
  }
  if (!input.parametrosPeriodo) {
    pushIssue(issues, 'FALTA_PARAMETROS_GENERALES', 'BLOQUEO', 'Falta fila de parametros_generales para el periodo.', 'parametros_generales', input.periodo, 'periodo');
  }

  const sueldoBase = trabajador.sueldoBase ?? 0;
  if (sueldoBase > 0) {
    haberesImponibles.push({ codigo: 'SUELDO_BASE', descripcion: 'Sueldo base', monto: sueldoBase, origen: 'contrato', imponible: true, tributable: true });
    pushTraza(trazabilidad, 'SUELDO_BASE', 'empleados', 'contrato', 'sueldoBase', sueldoBase, 'sueldoBase', sueldoBase);
  }

  const recurrentesTrabajador = input.recurrentes.filter(
    (r) => r.asignacion.idPersona === trabajador.idPersona && r.intersectaPeriodo && r.asignacion.estado,
  );
  for (const r of recurrentesTrabajador) {
    const a = r.asignacion;
    const tipo = normalizar(a.tipoConcepto);
    const naturaleza = normalizar(a.naturalezaConcepto);
    if (!tipo || (tipo === 'HABER' && !naturaleza)) {
      pushIssue(issues, 'CONCEPTO_SIN_CLASIFICACION', 'BLOQUEO', 'Concepto recurrente sin tipo o naturaleza para motor.', 'concepto', a.idConcepto, 'tipo/naturaleza');
      continue;
    }
    const monto = resolverMontoAsignacion(a.monto, a.porcentaje, a.tipoValor, sueldoBase);
    if (tipo === 'HABER') {
      const linea = {
        codigo: a.codigoConcepto,
        descripcion: a.nombreConcepto,
        monto,
        origen: 'haber_recurrente',
        imponible: a.imponible,
        tributable: a.tributable,
      };
      if (a.imponible || naturaleza === 'IMPONIBLE') {
        haberesImponibles.push(linea);
        pushTraza(trazabilidad, 'HABER_IMPONIBLE_SUMADO', 'haber_recurrente', 'concepto', 'imponible', a.imponible ? 'true' : naturaleza, 'suma haber imponible', monto, a.vigenciaInicio, a.vigenciaFin);
      } else if (naturaleza === 'NO_IMPONIBLE') {
        haberesNoImponibles.push(linea);
        pushTraza(trazabilidad, 'HABER_NO_IMPONIBLE_SUMADO', 'haber_recurrente', 'concepto', 'naturaleza', naturaleza, 'suma haber no imponible', monto, a.vigenciaInicio, a.vigenciaFin);
      } else {
        pushIssue(issues, 'CONCEPTO_SIN_CLASIFICACION', 'BLOQUEO', 'Haber recurrente sin clasificacion imponible/no imponible.', 'concepto', a.idConcepto, 'naturaleza');
      }
    } else if (tipo === 'DESCUENTO') {
      descuentosVoluntarios.push({ codigo: a.codigoConcepto, descripcion: a.nombreConcepto, monto, origen: 'descuento_recurrente' });
    }
  }

  validarImmJornada(input.periodo, input.parametrosPeriodo, trabajador, issues, trazabilidad);

  const gratificacionRecurrente = sumar(
    [...haberesImponibles, ...haberesNoImponibles]
      .filter((h) => esConceptoGratificacion(h.codigo, h.descripcion))
      .map((h) => h.monto),
  );
  const gratificacionAutomatica = gratificacionRecurrente > 0
    ? 0
    : calcularGratificacionArticulo50(input.parametrosPeriodo, trabajador, haberesImponibles, issues, trazabilidad);
  if (gratificacionAutomatica > 0) {
    haberesImponibles.push({
      codigo: 'GRATIFICACION_ART_50',
      descripcion: 'Gratificacion legal art. 50',
      monto: gratificacionAutomatica,
      origen: 'motor_gratificacion_art_50',
      imponible: true,
      tributable: true,
    });
    pushTraza(trazabilidad, 'HABER_IMPONIBLE_SUMADO', 'motor', 'concepto', 'GRATIFICACION_ART_50', gratificacionAutomatica, 'gratificacion_art_50', gratificacionAutomatica);
  }
  const gratificacionLegal = redondear(gratificacionRecurrente + gratificacionAutomatica);

  const asignacionFamiliar = calcularAsignacionFamiliar(input.catalogos.tramosCarga, trabajador, issues, trazabilidad);
  if (asignacionFamiliar > 0) {
    haberesNoImponibles.push({
      codigo: 'ASIGNACION_FAMILIAR',
      descripcion: 'Asignacion familiar',
      monto: asignacionFamiliar,
      origen: 'tramo_carga',
      imponible: false,
      tributable: false,
    });
    pushTraza(trazabilidad, 'HABER_NO_IMPONIBLE_SUMADO', 'parametros', 'tramo_carga', 'valor', asignacionFamiliar, 'cargasFamiliares * valor tramo', asignacionFamiliar);
  }

  const baseImponibleSinTope = sumar(haberesImponibles.map((h) => h.monto));
  const topePrevisional = resolverTopePesos(input.parametrosPeriodo, 'afp');
  if (topePrevisional == null) {
    pushIssue(issues, 'TOPE_IMPONIBLE_NO_DISPONIBLE', 'ADVERTENCIA', 'No hay tope previsional claro en parametros_generales; no se hardcodea limite.', 'parametros_generales', input.periodo, 'topeAfp/topeAfpUf');
  }
  const baseImponiblePrevisional = topePrevisional == null
    ? baseImponibleSinTope
    : redondear(Math.min(baseImponibleSinTope, topePrevisional.valor));
  if (topePrevisional != null && baseImponiblePrevisional < baseImponibleSinTope) {
    pushIssue(issues, 'TOPE_IMPONIBLE_APLICADO', 'INFO', 'Base imponible previsional limitada por tope disponible en parametros_generales.', 'parametros_generales', input.periodo, topePrevisional.campo);
    pushTraza(trazabilidad, 'TOPE_IMPONIBLE_APLICADO', 'parametros', 'parametros_generales', topePrevisional.campo, topePrevisional.valor, 'min(baseImponibleSinTope, tope)', baseImponiblePrevisional, input.parametrosPeriodo?.periodo ?? null, null);
  }
  pushTraza(trazabilidad, 'BASE_IMPONIBLE_PREVISIONAL', 'motor', 'resultado', 'haberesImponibles', baseImponibleSinTope, 'min(sum(haberesImponibles), topePrevisionalDisponible)', baseImponiblePrevisional);

  const afp = resolverAfp(input.catalogos.afp, trabajador.idAfp);
  const tasaAfp = tasaAfpTrabajador(afp);
  if (!trabajador.idAfp || !afp) {
    pushIssue(issues, 'FALTA_AFP_VIGENTE', 'BLOQUEO', 'Falta AFP vigente del trabajador para el periodo.', 'afp_vigencia', trabajador.idPersona, 'idAfp');
  } else if (tasaAfp == null) {
    pushIssue(issues, 'FALTA_AFP_TASA', 'BLOQUEO', 'Falta tasa obligatoria o comision AFP vigente.', 'afp_vigencia', afp.idAfp, 'tasa_obligatoria/comision');
  }
  const cotizacionAfp = tasaAfp == null ? 0 : redondear(baseImponiblePrevisional * tasaAfp);
  if (tasaAfp != null) {
    descuentosLegales.push({ codigo: 'AFP', descripcion: 'Cotizacion AFP trabajador', monto: cotizacionAfp, origen: 'afp_vigencia' });
    pushTraza(trazabilidad, 'AFP_TASA_APLICADA', 'parametros', 'afp_vigencia', 'tasa_obligatoria+comision', tasaAfp, 'baseImponiblePrevisional * tasa', cotizacionAfp, afp?.vigenciaInicio, afp?.vigenciaFin);
  }

  const tasaSis = normalizarTasa(input.parametrosPeriodo?.sis ?? afp?.sis ?? null);
  if (tasaSis == null) {
    pushIssue(issues, 'FALTA_SIS', 'BLOQUEO', 'Falta SIS confirmado en parametros_generales.sis o afp_vigencia.sis.', 'parametros_generales', input.periodo, 'sis');
  }
  const cotizacionSis = tasaSis == null ? 0 : redondear(baseImponiblePrevisional * tasaSis);
  if (tasaSis != null) {
    pushTraza(trazabilidad, 'SIS_PARAMETRO_APLICADO', 'parametros', input.parametrosPeriodo?.sis != null ? 'parametros_generales' : 'afp_vigencia', 'sis', tasaSis, 'baseImponiblePrevisional * sis', cotizacionSis, input.parametrosPeriodo?.periodo ?? afp?.vigenciaInicio, afp?.vigenciaFin);
  }

  const salud = resolverSalud(input.catalogos.saludInstituciones, input.catalogos.isapres, trabajador.idSalud);
  const saludCalc = calcularSalud(baseImponiblePrevisional, salud, trabajador, input.parametrosPeriodo?.saludObligatoria ?? null, issues);
  if (saludCalc.monto > 0) {
    descuentosLegales.push({ codigo: 'SALUD', descripcion: saludCalc.descripcion, monto: saludCalc.monto, origen: saludCalc.origen });
    pushTraza(trazabilidad, 'SALUD_PARAMETRO_APLICADO', 'parametros', saludCalc.origenTabla, saludCalc.campo, saludCalc.valorEntrada, saludCalc.formula, saludCalc.monto, salud?.vigenciaInicio, salud?.vigenciaFin);
  }

  const afc = resolverAfc(input.catalogos.afcParametros, trabajador.tipoContrato);
  if (!trabajador.tipoContrato || !afc) {
    pushIssue(issues, 'FALTA_AFC', 'BLOQUEO', 'Falta tipo de contrato o tasa AFC aplicable.', 'afc_parametro', trabajador.idPersona, 'codigo_tipo_contrato');
  }
  const tasaAfc = afc ? normalizarTasa(afc.tasaTrabajador) : null;
  const topeAfc = resolverTopePesos(input.parametrosPeriodo, 'cesantia');
  const baseAfc = topeAfc == null ? baseImponiblePrevisional : redondear(Math.min(baseImponibleSinTope, topeAfc.valor));
  const cotizacionAfc = tasaAfc == null ? 0 : redondear(baseAfc * tasaAfc);
  if (cotizacionAfc > 0) {
    descuentosLegales.push({ codigo: 'AFC', descripcion: 'Seguro de cesantia trabajador', monto: cotizacionAfc, origen: 'afc_parametro' });
    pushTraza(trazabilidad, 'AFC_PARAMETRO_APLICADO', 'parametros', 'afc_parametro', 'tasa_trabajador', tasaAfc, 'baseAfc * tasaTrabajador', cotizacionAfc, afc?.vigenciaInicio, afc?.vigenciaFin);
  }

  const tasaSanna = normalizarTasa(input.parametrosPeriodo?.sanna ?? null);
  if (tasaSanna == null) {
    pushIssue(issues, 'SANNA_NO_DEFINIDO', 'ADVERTENCIA', 'SANNA no definido en parametros_generales.sanna; queda pendiente sin afectar liquido trabajador.', 'parametros_generales', input.periodo, 'sanna');
  }
  const cotizacionSanna = tasaSanna == null ? 0 : redondear(baseImponiblePrevisional * tasaSanna);
  if (tasaSanna != null) {
    pushTraza(trazabilidad, 'SANNA_PARAMETRO_APLICADO', 'parametros', 'parametros_generales', 'sanna', tasaSanna, 'baseImponiblePrevisional * sanna', cotizacionSanna);
  }

  const ley = input.catalogos.ley16744Parametros.find((l) => l.vigente) ?? input.catalogos.ley16744Parametros[0] ?? null;
  let tasaLey = normalizarTasa(ley?.cotizacionBasicaEmpleador ?? null);
  if (!ley) {
    pushIssue(issues, 'LEY_16744_INCOMPLETA', 'ADVERTENCIA', 'No hay ley_16744_parametros para calcular cargo empleador.', 'ley_16744_parametros', input.periodo, 'cotizacion_basica_empleador');
    tasaLey = null;
  } else {
    const tasaAdicionalEmpresa = input.empresaLey16744
      ? normalizarTasa(input.empresaLey16744.tasaAdicionalDiferenciada)
      : null;
    if (tasaAdicionalEmpresa != null) {
      tasaLey = (tasaLey ?? 0) + tasaAdicionalEmpresa;
    }
  }
  const cotizacionLey16744 = tasaLey == null ? 0 : redondear(baseImponiblePrevisional * tasaLey);
  if (tasaLey != null) {
    pushTraza(trazabilidad, 'LEY_16744_PARAMETRO_APLICADO', 'parametros', 'ley_16744_parametros/empresa', 'cotizacion_basica_empleador+tasa_adicional_diferenciada', tasaLey, 'baseImponiblePrevisional * tasa empleador', cotizacionLey16744, ley?.vigenciaInicio, ley?.vigenciaFin, 'Cargo empleador separado de descuentos trabajador');
  }

  const haberesTributables = sumar([...haberesImponibles, ...haberesNoImponibles].filter((h) => h.tributable !== false).map((h) => h.monto));
  const descuentosLegalesTributarios = cotizacionAfp + saludCalc.monto + cotizacionAfc;
  const baseTributable = redondear(Math.max(0, haberesTributables - descuentosLegalesTributarios));
  pushTraza(trazabilidad, 'BASE_TRIBUTABLE', 'motor', 'resultado', 'haberesTributables-descuentosLegales', `${haberesTributables}-${descuentosLegalesTributarios}`, 'max(0, haberes tributables - AFP - salud - AFC)', baseTributable);

  const impuesto = calcularImpuestoUnico(baseTributable, input.catalogos.tablaImpuestoUnico);
  if (impuesto.issue) {
    issues.push(impuesto.issue);
  } else {
    pushIssue(issues, 'IMPUESTO_CALCULADO', 'INFO', 'Impuesto unico calculado con tabla_impuesto_unico vigente.', 'tabla_impuesto_unico', input.periodo, 'factor/rebaja');
  }
  if (impuesto.monto > 0) {
    descuentosLegales.push({ codigo: 'IMPUESTO_UNICO', descripcion: 'Impuesto unico preliminar', monto: impuesto.monto, origen: 'tabla_impuesto_unico' });
  }
  if (impuesto.tramo) {
    pushTraza(trazabilidad, 'IMPUESTO_UNICO_TRAMO', 'parametros', 'tabla_impuesto_unico', 'desde/hasta', `${impuesto.tramo.desde}/${impuesto.tramo.hasta ?? 'sin_tope'}`, 'baseTributable dentro de tramo', impuesto.tramo.tramo, impuesto.tramo.vigenciaInicio, impuesto.tramo.vigenciaFin);
    pushTraza(trazabilidad, 'IMPUESTO_UNICO_FACTOR', 'parametros', 'tabla_impuesto_unico', 'factor', impuesto.tramo.factor, 'baseTributable * factor', redondear(baseTributable * impuesto.tramo.factor), impuesto.tramo.vigenciaInicio, impuesto.tramo.vigenciaFin);
    pushTraza(trazabilidad, 'IMPUESTO_UNICO_REBAJA', 'parametros', 'tabla_impuesto_unico', 'rebaja', impuesto.tramo.rebaja, '(baseTributable * factor) - rebaja', impuesto.monto, impuesto.tramo.vigenciaInicio, impuesto.tramo.vigenciaFin);
    pushTraza(trazabilidad, 'IMPUESTO_UNICO_RESULTADO', 'parametros', 'tabla_impuesto_unico', 'factor/rebaja', `${impuesto.tramo.factor}/${impuesto.tramo.rebaja}`, 'max(0, baseTributable * factor - rebaja)', impuesto.monto, impuesto.tramo.vigenciaInicio, impuesto.tramo.vigenciaFin);
  }

  const totalHaberes = sumar([...haberesImponibles, ...haberesNoImponibles].map((h) => h.monto));
  const totalDescuentos = sumar([...descuentosLegales, ...descuentosVoluntarios].map((d) => d.monto));
  const liquidoAPago = redondear(totalHaberes - totalDescuentos);
  pushTraza(trazabilidad, 'LIQUIDO_PRELIMINAR', 'motor', 'resultado', 'totalHaberes-totalDescuentos', `${totalHaberes}-${totalDescuentos}`, 'totalHaberes - totalDescuentos', liquidoAPago);

  const estado = issues.some((i) => i.severidad === 'BLOQUEO')
    ? 'con_bloqueos'
    : issues.some((i) => i.severidad === 'ADVERTENCIA')
      ? 'con_advertencias'
      : 'calculado_preliminar';

  return {
    periodo: input.periodo,
    idPersona: trabajador.idPersona,
    rut: trabajador.rut,
    nombreCompleto: trabajador.nombreCompleto,
    haberesImponibles,
    haberesNoImponibles,
    descuentosLegales,
    descuentosVoluntarios,
    baseImponiblePrevisional,
    baseTributable,
    gratificacionLegal,
    asignacionFamiliar,
    cotizacionAfp,
    cotizacionSalud: saludCalc.monto,
    cotizacionAfc,
    cotizacionSis,
    cotizacionSanna,
    cotizacionLey16744,
    impuestoUnico: impuesto.monto,
    totalHaberes,
    totalDescuentos,
    liquidoAPago,
    issues,
    trazabilidad,
    estado,
  };
}

function validarEntradaPeriodo(input: MotorCalculoInput): MotorCalculoIssue[] {
  const issues: MotorCalculoIssue[] = [];
  if (!input.periodo?.trim()) {
    pushIssue(issues, 'PERIODO_INVALIDO', 'BLOQUEO', 'Periodo invalido para motor.', 'proceso_mensual', null, 'periodo');
  }
  if (input.preNomina.estado === 'NO_GENERABLE' || input.preNomina.codigosBloqueo.length > 0) {
    pushIssue(issues, 'PRE_NOMINA_BLOQUEADA', 'BLOQUEO', 'La pre-nomina tiene bloqueos y no puede calcularse.', 'pre_nomina', input.periodo, 'estado');
  }
  if (input.preNomina.estado === 'GENERADA_CON_ADVERTENCIAS' || input.preNomina.codigosAdvertencia.length > 0) {
    pushIssue(issues, 'PRE_NOMINA_CON_ADVERTENCIAS', 'ADVERTENCIA', 'La pre-nomina trae advertencias previas.', 'pre_nomina', input.periodo, 'estado');
  }
  for (const b of input.prevalidacion.bloqueos) {
    pushIssue(issues, `PRE_${b.codigo}`, 'BLOQUEO', b.texto, b.area, input.periodo, b.codigo);
  }
  for (const a of input.prevalidacion.advertencias) {
    pushIssue(issues, `PRE_${a.codigo}`, 'ADVERTENCIA', a.texto, a.area, input.periodo, a.codigo);
  }
  if (!input.parametrosPeriodo) {
    pushIssue(issues, 'FALTA_PARAMETROS_GENERALES', 'BLOQUEO', 'Faltan parametros legales minimos.', 'parametros_generales', input.periodo, 'periodo');
  }
  return issues;
}

function validarImmJornada(
  periodo: string,
  parametros: ParametroGeneral | null,
  trabajador: TrabajadorMotorCalculoSnapshot,
  issues: MotorCalculoIssue[],
  trazabilidad: MotorCalculoTrazabilidad[],
): void {
  const imm = parametros?.sueldoMinimo18a65 ?? parametros?.sueldoMinimo ?? null;
  const sueldoBase = trabajador.sueldoBase ?? 0;
  const horas = trabajador.horasSemanales;
  if (imm == null || imm <= 0 || sueldoBase <= 0 || horas == null || horas <= 0) {
    return;
  }
  const jornadaMaxima = jornadaMaximaLegalPeriodo(periodo);
  if (horas > jornadaMaxima) {
    pushIssue(issues, 'JORNADA_SUPERA_MAXIMO_LEGAL', 'BLOQUEO', 'Jornada semanal supera el maximo legal del periodo.', 'empleados', trabajador.idPersona, 'horasSemanales');
    return;
  }
  if (horas <= 30) {
    const immProporcional = redondear((imm * horas) / jornadaMaxima);
    pushIssue(issues, 'IMM_PROPORCIONAL_APLICADO', 'INFO', 'Jornada parcial permite validar IMM proporcional.', 'parametros_generales', trabajador.idPersona, 'sueldoMinimo');
    pushTraza(trazabilidad, 'IMM_PROPORCIONAL_JORNADA_PARCIAL', 'parametros', 'parametros_generales', 'sueldo_minimo/horasSemanales', `${imm}/${horas}`, 'IMM * horasSemanales / jornadaMaximaPeriodo', immProporcional, parametros?.periodo ?? null, null);
    if (sueldoBase < immProporcional) {
      pushIssue(issues, 'SUELDO_BASE_BAJO_IMM_PROPORCIONAL', 'BLOQUEO', 'Sueldo base menor al IMM proporcional para jornada parcial.', 'empleados', trabajador.idPersona, 'sueldoBase');
    }
    return;
  }
  if (sueldoBase < imm) {
    pushIssue(issues, 'SUELDO_BASE_BAJO_IMM', 'BLOQUEO', 'Jornada superior a 30 horas exige IMM completo.', 'empleados', trabajador.idPersona, 'sueldoBase');
  }
}

function jornadaMaximaLegalPeriodo(periodo: string): number {
  if (periodo >= '2028-04') return 40;
  if (periodo >= '2026-04') return 42;
  if (periodo >= '2024-04') return 44;
  return 45;
}

function calcularGratificacionArticulo50(
  parametros: ParametroGeneral | null,
  trabajador: TrabajadorMotorCalculoSnapshot,
  haberesImponibles: LineaLiquidacionCalculada[],
  issues: MotorCalculoIssue[],
  trazabilidad: MotorCalculoTrazabilidad[],
): number {
  const modalidad = normalizar(trabajador.tipoGratificacion);
  const habilitada = trabajador.gratificacionProporcional === true
    || modalidad.includes('ART_50')
    || modalidad.includes('ART50')
    || modalidad.includes('25')
    || modalidad.includes('LEGAL_ARTICULO_50');
  if (!habilitada) {
    pushIssue(issues, 'GRATIFICACION_SIN_CONFIGURACION', 'ADVERTENCIA', 'Gratificacion automatica pendiente de configuracion; no se inventa monto.', 'empleados', trabajador.idPersona, 'tipoGratificacion');
    return 0;
  }
  const imm = parametros?.immGratificacion ?? parametros?.sueldoMinimo18a65 ?? parametros?.sueldoMinimo ?? null;
  if (imm == null || imm <= 0) {
    pushIssue(issues, 'GRATIFICACION_SIN_CONFIGURACION', 'ADVERTENCIA', 'No hay IMM suficiente para calcular gratificacion art. 50.', 'parametros_generales', parametros?.periodo ?? null, 'immGratificacion/sueldoMinimo');
    return 0;
  }
  const base = sumar(haberesImponibles.filter((h) => !esConceptoGratificacion(h.codigo, h.descripcion)).map((h) => h.monto));
  const topeMensual = redondear((imm * 4.75) / 12);
  const resultado = redondear(Math.min(base * 0.25, topeMensual));
  const periodoParametro = parametros?.periodo ?? null;
  const campoImm = parametros?.immGratificacion != null ? 'immGratificacion' : 'sueldoMinimo';
  pushTraza(trazabilidad, 'GRATIFICACION_ART_50_BASE', 'motor', 'resultado', 'haberesImponiblesRemuneracionales', base, 'sum(haberes imponibles sin gratificacion)', base, periodoParametro, null);
  pushTraza(trazabilidad, 'GRATIFICACION_ART_50_TOPE', 'parametros', 'parametros_generales', campoImm, imm, 'IMM * 4.75 / 12', topeMensual, periodoParametro, null);
  pushTraza(trazabilidad, 'GRATIFICACION_ART_50_RESULTADO', 'motor', 'resultado', 'base/tope', `${base}/${topeMensual}`, 'min(base * 0.25, topeMensual)', resultado, periodoParametro, null);
  if (resultado === topeMensual && base * 0.25 > topeMensual) {
    pushIssue(issues, 'GRATIFICACION_TOPE_APLICADO', 'INFO', 'Gratificacion art. 50 limitada por tope mensual 4,75 IMM / 12.', 'parametros_generales', periodoParametro, 'sueldoMinimo');
  }
  return resultado;
}

function calcularAsignacionFamiliar(
  tramos: TramoCargaParametro[],
  trabajador: TrabajadorMotorCalculoSnapshot,
  issues: MotorCalculoIssue[],
  trazabilidad: MotorCalculoTrazabilidad[],
): number {
  const cargas = trabajador.cargasFamiliares ?? 0;
  if (cargas <= 0) return 0;
  const tramo = trabajador.idTramoCarga == null
    ? null
    : tramos.find((t) => t.idTramo === trabajador.idTramoCarga) ?? null;
  if (!tramo || tramo.valor == null) {
    pushIssue(issues, 'ASIGNACION_FAMILIAR_SIN_TRAMO', 'ADVERTENCIA', 'Trabajador con cargas sin tramo_carga suficiente; no se inventa monto.', 'tramo_carga', trabajador.idPersona, 'idTramoCarga');
    return 0;
  }
  const monto = redondear(cargas * tramo.valor);
  pushTraza(trazabilidad, 'ASIGNACION_FAMILIAR_TRAMO', 'parametros', 'tramo_carga', 'valor', tramo.valor, 'cargasFamiliares * valor', monto, tramo.periodo, null);
  return monto;
}

function resolverTopePesos(parametros: ParametroGeneral | null, tipo: 'afp' | 'cesantia'): { valor: number; campo: string } | null {
  if (!parametros) return null;
  if (tipo === 'afp') {
    if (parametros.topeAfp != null && parametros.topeAfp > 0) return { valor: parametros.topeAfp, campo: 'topeAfp' };
    if (parametros.topeAfpUf != null && parametros.topeAfpUf > 0 && parametros.uf != null && parametros.uf > 0) {
      return { valor: redondear(parametros.topeAfpUf * parametros.uf), campo: 'topeAfpUf*uf' };
    }
    return null;
  }
  if (parametros.topeCesantia != null && parametros.topeCesantia > 0) return { valor: parametros.topeCesantia, campo: 'topeCesantia' };
  if (parametros.topeCesantiaUf != null && parametros.topeCesantiaUf > 0 && parametros.uf != null && parametros.uf > 0) {
    return { valor: redondear(parametros.topeCesantiaUf * parametros.uf), campo: 'topeCesantiaUf*uf' };
  }
  return null;
}

function esConceptoGratificacion(codigo: string, descripcion: string): boolean {
  const v = normalizar(`${codigo} ${descripcion}`);
  return v.includes('GRATIFIC');
}

function resolverAfp(afps: AfpParametro[], idAfp: number | null): AfpParametro | null {
  return idAfp == null ? null : afps.find((a) => a.idAfp === idAfp && a.vigente) ?? null;
}

function tasaAfpTrabajador(afp: AfpParametro | null): number | null {
  if (!afp || afp.tasaObligatoria == null || afp.comision == null) {
    return null;
  }
  return normalizarTasa(afp.tasaObligatoria)! + normalizarTasa(afp.comision)!;
}

function resolverSalud(instituciones: IsapreParametro[], isapres: IsapreParametro[], idSalud: number | null): IsapreParametro | null {
  if (idSalud == null) return null;
  return [...instituciones, ...isapres].find((s) => s.idSalud === idSalud && s.vigente) ?? null;
}

function calcularSalud(
  base: number,
  salud: IsapreParametro | null,
  trabajador: TrabajadorMotorCalculoSnapshot,
  tasaLegalParametro: number | null,
  issues: MotorCalculoIssue[],
): { monto: number; descripcion: string; origen: string; origenTabla: string; campo: string; valorEntrada: number | string | null; formula: string } {
  if (!salud) {
    pushIssue(issues, 'FALTA_SALUD', 'BLOQUEO', 'Falta institucion de salud vigente del trabajador.', 'salud', trabajador.idPersona, 'idSalud');
    return { monto: 0, descripcion: 'Salud', origen: 'salud', origenTabla: 'salud', campo: 'id_salud', valorEntrada: null, formula: 'sin calculo' };
  }
  const tipo = normalizar(`${salud.tipo ?? ''} ${salud.codigo ?? ''} ${salud.nombre}`);
  const tasaLegal = normalizarTasa(tasaLegalParametro ?? salud.porcentajeCotizacion ?? 0.07) ?? 0.07;
  const legal = redondear(base * tasaLegal);
  if (tipo.includes('FONASA')) {
    return { monto: legal, descripcion: 'Cotizacion salud Fonasa', origen: 'salud', origenTabla: 'salud/parametros_generales', campo: 'porcentaje_cotizacion/salud_obligatoria', valorEntrada: tasaLegal, formula: 'baseImponiblePrevisional * tasa legal salud' };
  }
  if (trabajador.valorPlanSalud == null || trabajador.valorPlanSalud <= 0) {
    pushIssue(issues, 'SALUD_PLAN_INSUFICIENTE', 'BLOQUEO', 'Isapre sin valor de plan suficiente; no se inventa cotizacion.', 'salud_plan', trabajador.idPersona, 'valorPlan');
    return { monto: 0, descripcion: 'Cotizacion salud Isapre', origen: 'salud_plan', origenTabla: 'salud_plan', campo: 'valor_referencia', valorEntrada: null, formula: 'sin calculo' };
  }
  return { monto: Math.max(legal, trabajador.valorPlanSalud), descripcion: 'Cotizacion salud Isapre', origen: 'salud_plan', origenTabla: 'salud_plan', campo: 'valor_referencia', valorEntrada: trabajador.valorPlanSalud, formula: 'max(7% legal, plan pactado)' };
}

function resolverAfc(afc: AfcParametro[], tipoContrato: string | null): AfcParametro | null {
  const tipo = normalizar(tipoContrato);
  if (!tipo) return null;
  return afc.find((a) => normalizar(a.codigoTipoContrato) === tipo) ?? afc.find((a) => tipo.includes(normalizar(a.codigoTipoContrato))) ?? null;
}

function calcularImpuestoUnico(base: number, tabla: TablaImpuestoUnicoParametro[]): {
  monto: number;
  tramo: TablaImpuestoUnicoParametro | null;
  issue?: MotorCalculoIssue;
} {
  if (tabla.length === 0) {
    return {
      monto: 0,
      tramo: null,
      issue: {
        codigo: 'IMPUESTO_TABLA_NO_DISPONIBLE',
        severidad: 'ADVERTENCIA',
        mensaje: 'Impuesto unico no calculado porque falta tabla_impuesto_unico vigente.',
        origen: 'tabla_impuesto_unico',
        campo: 'factor/rebaja',
      },
    };
  }
  const tramo = tabla.find((t) => base >= t.desde && (t.hasta == null || t.hasta === 0 || base <= t.hasta)) ?? null;
  if (!tramo) {
    return {
      monto: 0,
      tramo: null,
      issue: {
        codigo: 'IMPUESTO_TRAMO_NO_ENCONTRADO',
        severidad: 'ADVERTENCIA',
        mensaje: 'No se encontro tramo aplicable de impuesto unico para la base tributable.',
        origen: 'tabla_impuesto_unico',
        campo: 'desde/hasta',
      },
    };
  }
  return { monto: redondear(Math.max(0, base * tramo.factor - tramo.rebaja)), tramo };
}

function resolverMontoAsignacion(monto: number | null, porcentaje: number | null, tipoValor: string | null, base: number): number {
  if (normalizar(tipoValor) === 'PORCENTAJE') {
    return redondear(base * (normalizarTasa(porcentaje) ?? 0));
  }
  return redondear(monto ?? 0);
}

function normalizarTasa(v: number | null): number | null {
  if (v == null || !Number.isFinite(v)) return null;
  return Math.abs(v) > 1 ? v / 100 : v;
}

function sumar(values: number[]): number {
  return redondear(values.reduce((acc, v) => acc + (Number.isFinite(v) ? v : 0), 0));
}

function redondear(v: number): number {
  return Math.round((v + Number.EPSILON) * 100) / 100;
}

function normalizar(v: string | null | undefined): string {
  return (v ?? '').trim().toUpperCase();
}

function pushIssue(
  dest: MotorCalculoIssue[],
  codigo: string,
  severidad: MotorCalculoSeveridad,
  mensaje: string,
  origen: string,
  entidadId?: number | string | null,
  campo?: string | null,
): void {
  dest.push({ codigo, severidad, mensaje, origen, entidadId, campo });
}

function pushTraza(
  dest: MotorCalculoTrazabilidad[],
  codigo: string,
  origen: string,
  tabla: string,
  campo: string,
  valorEntrada: number | string | null,
  formula: string,
  valorResultado: number | string | null,
  vigenciaInicio?: string | null,
  vigenciaFin?: string | null,
  observacion?: string | null,
): void {
  dest.push({ codigo, origen, tabla, campo, valorEntrada, formula, valorResultado, vigenciaInicio, vigenciaFin, observacion });
}
