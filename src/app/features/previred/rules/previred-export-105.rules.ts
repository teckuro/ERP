import type { LiquidacionConcepto, LiquidacionTrabajador } from '../../liquidaciones-oficiales/models/liquidacion-oficial.model';
import type { NovedadMensual } from '../../nomina-mensual/novedades/models/novedad-mensual.model';
import type { PreviredAdvertencia } from '../models/previred-export.model';
import {
  type Previred105ArchivoGenerado,
  type Previred105ValoresCampo,
  construirRegistro105Minimo,
  descomponerRutPrevired,
  generarArchivoPrevired105,
  nombreArchivoPrevired105,
} from './previred-archivo-105-posicion.rules';
import {
  agregarConceptosACamposPrevired,
  aplicarRentasImponiblesPrevired,
  calcularExpectativaVidaPrevired,
  type CatalogoCampoArchivoEntrada,
} from './previred-campo-archivo.rules';
import {
  calcularRimaPrevired,
  resolverMovimientoPersonalPrevired,
} from './previred-movimiento-personal.rules';
import {
  claveTrabajadorPrevired,
  parsearNombreCompletoLiquidacion,
  type PreviredParametrosEmpresa,
  type PreviredTrabajadorEnriquecido,
} from './previred-trabajador-datos.rules';

export interface PreviredTrabajadorLiquidacionInput {
  trabajador: LiquidacionTrabajador;
  conceptos: readonly LiquidacionConcepto[];
  enriquecido: PreviredTrabajadorEnriquecido | null;
  novedades: readonly NovedadMensual[];
  rentaImponibleMesAnterior: number | null;
}

export interface ConstruirArchivo105PreviredInput {
  periodo: string;
  trabajadores: readonly PreviredTrabajadorLiquidacionInput[];
  catalogoCampoArchivo: readonly CatalogoCampoArchivoEntrada[];
  parametrosEmpresa: PreviredParametrosEmpresa;
}

export interface PreviredArchivo105Export {
  formato: Previred105ArchivoGenerado['formato'];
  periodo: string;
  contenido: string;
  totalTrabajadores: number;
  totalLineas: number;
  advertencias: PreviredAdvertencia[];
  conceptosSinCampoArchivo: number;
  trabajadoresSinDatos: number;
  listoParaEnvio105: boolean;
}

export function construirRegistro105DesdeLiquidacion(input: {
  periodo: string;
  trabajador: LiquidacionTrabajador;
  conceptos: readonly LiquidacionConcepto[];
  enriquecido: PreviredTrabajadorEnriquecido | null;
  novedades: readonly NovedadMensual[];
  rentaImponibleMesAnterior: number | null;
  catalogoCampoArchivo: readonly CatalogoCampoArchivoEntrada[];
  parametrosEmpresa: PreviredParametrosEmpresa;
}): {
  registro: Previred105ValoresCampo | null;
  conceptosSinCampo: number;
  advertencias: PreviredAdvertencia[];
} {
  const advertencias: PreviredAdvertencia[] = [];
  const enriquecido = input.enriquecido;
  const parsedNombre = parsearNombreCompletoLiquidacion(input.trabajador.nombreTrabajador);

  const rutRaw = enriquecido?.rut ?? input.trabajador.rut;
  const rutDescompuesto =
    rutRaw && enriquecido?.dv
      ? { rut: rutRaw.replace(/\D/g, ''), dv: enriquecido.dv }
      : rutRaw
        ? descomponerRutPrevired(rutRaw.includes('-') ? rutRaw : `${rutRaw}-${enriquecido?.dv ?? ''}`)
        : null;

  if (!rutDescompuesto) {
    advertencias.push({
      nivel: 'revision',
      mensaje: `${input.trabajador.nombreTrabajador}: RUT no válido para archivo Previred.`,
    });
    return { registro: null, conceptosSinCampo: 0, advertencias };
  }

  const saludTipo = enriquecido?.saludTipo ?? null;
  const regimen = enriquecido?.regimenPrevisional ?? 'AFP';
  const tipoTrabajador = enriquecido?.tipoTrabajador ?? 0;
  const baseImponible = Math.max(0, Math.round(input.trabajador.baseImponible));
  const diasTrabajados = Math.min(
    30,
    Math.max(0, Math.round(Number(input.trabajador.diasTrabajados ?? 30))),
  );

  const agregacion = agregarConceptosACamposPrevired({
    conceptos: input.conceptos,
    catalogo: input.catalogoCampoArchivo,
    saludTipo,
    incluirAportesEmpleador: true,
  });

  let montosPorCampo = aplicarRentasImponiblesPrevired({
    montosPorCampo: agregacion.montosPorCampo,
    baseImponible,
    regimenPrevisional: regimen,
    saludTipo,
    seguroCesantia: enriquecido?.seguroCesantia ?? false,
    ccafCodigoPrevired: input.parametrosEmpresa.codigoCcaf,
    mutualCodigoPrevired: input.parametrosEmpresa.codigoMutual,
  });

  const movimiento = resolverMovimientoPersonalPrevired(input.novedades);
  const rima = calcularRimaPrevired({
    movimientoPersonal: movimiento.codigoMovimientoPersonal,
    diasLicencia: movimiento.diasLicencia,
    rentaImponibleMesAnterior: input.rentaImponibleMesAnterior,
  });

  const expectativaVida = calcularExpectativaVidaPrevired({
    baseImponible,
    regimenPrevisional: regimen,
    tipoTrabajador,
    montoConcepto: montosPorCampo[94] ?? null,
    tasaParametro: input.parametrosEmpresa.tasaExpectativaVida,
  });
  montosPorCampo[94] = expectativaVida;

  if (enriquecido?.codigoSalud && enriquecido.codigoSalud !== '00') {
    montosPorCampo[75] = Number(enriquecido.codigoSalud);
  }

  if (input.parametrosEmpresa.codigoCcaf !== '00') {
    montosPorCampo[83] = Number(input.parametrosEmpresa.codigoCcaf);
  }

  if (input.parametrosEmpresa.codigoMutual !== '00') {
    montosPorCampo[96] = Number(input.parametrosEmpresa.codigoMutual);
    montosPorCampo[98] = montosPorCampo[98] ?? 0;
  }

  if (montosPorCampo[22] == null && agregacion.montosPorCampo[22] != null) {
    montosPorCampo[22] = agregacion.montosPorCampo[22];
  }

  const sexo = enriquecido?.sexo;
  if (!sexo) {
    advertencias.push({
      nivel: 'revision',
      mensaje: `${input.trabajador.nombreTrabajador}: falta sexo en ficha para archivo Previred.`,
    });
  }

  const registro = construirRegistro105Minimo({
    rut: rutDescompuesto.rut,
    dv: rutDescompuesto.dv,
    apellidoPaterno: enriquecido?.apellidoPaterno ?? parsedNombre.apellidoPaterno,
    apellidoMaterno: enriquecido?.apellidoMaterno ?? parsedNombre.apellidoMaterno,
    nombres: enriquecido?.nombres ?? parsedNombre.nombres,
    sexo: sexo ?? 'M',
    nacionalidad: enriquecido?.nacionalidad ?? 0,
    periodo: input.periodo,
    regimenPrevisional: regimen,
    tipoTrabajador,
    diasTrabajados,
    tipoJornada: enriquecido?.tipoJornada ?? 1,
    codigoAfp: enriquecido?.codigoAfp ?? '00',
    rentaImponibleAfp: montosPorCampo[27] ?? 0,
    cotizacionObligatoriaAfp: montosPorCampo[28] ?? 0,
    cotizacionSis: montosPorCampo[29] ?? 0,
    cotizacionExpectativaVida: expectativaVida,
    montosPorCampo: {
      ...montosPorCampo,
      15: movimiento.codigoMovimientoPersonal,
      16: movimiento.fechaDesde,
      17: movimiento.fechaHasta,
      18: enriquecido?.tramoAsignacionFamiliar ?? 'D',
      19: enriquecido?.cargasSimples ?? 0,
      20: enriquecido?.cargasMaternales ?? 0,
      21: enriquecido?.cargasInvalidas ?? 0,
      92: rima,
      105: input.trabajador.centroCosto ?? enriquecido?.centroCosto ?? '',
    },
  });

  return {
    registro,
    conceptosSinCampo: agregacion.conceptosSinCampo,
    advertencias,
  };
}

export function construirArchivo105Previred(
  input: ConstruirArchivo105PreviredInput,
): PreviredArchivo105Export {
  const registros: Previred105ValoresCampo[] = [];
  const advertencias: PreviredAdvertencia[] = [];
  let conceptosSinCampoArchivo = 0;
  let trabajadoresSinDatos = 0;

  for (const fila of input.trabajadores) {
    const resultado = construirRegistro105DesdeLiquidacion({
      periodo: input.periodo,
      trabajador: fila.trabajador,
      conceptos: fila.conceptos,
      enriquecido: fila.enriquecido,
      novedades: fila.novedades,
      rentaImponibleMesAnterior: fila.rentaImponibleMesAnterior,
      catalogoCampoArchivo: input.catalogoCampoArchivo,
      parametrosEmpresa: input.parametrosEmpresa,
    });

    advertencias.push(...resultado.advertencias);
    conceptosSinCampoArchivo += resultado.conceptosSinCampo;

    if (!resultado.registro) {
      trabajadoresSinDatos++;
      continue;
    }
    registros.push(resultado.registro);
  }

  if (registros.length === 0) {
    advertencias.unshift({
      nivel: 'bloqueo',
      mensaje:
        'No hay trabajadores exportables al formato Previred de 105 campos. Revise RUT, ficha y liquidación.',
    });
  }

  const archivo = generarArchivoPrevired105({
    periodo: input.periodo,
    registros,
  });

  const tieneBloqueo = advertencias.some((a) => a.nivel === 'bloqueo');
  const listoParaEnvio105 =
    !tieneBloqueo && registros.length > 0 && trabajadoresSinDatos === 0;

  return {
    formato: archivo.formato,
    periodo: input.periodo,
    contenido: archivo.contenido,
    totalTrabajadores: registros.length,
    totalLineas: registros.length,
    advertencias,
    conceptosSinCampoArchivo,
    trabajadoresSinDatos,
    listoParaEnvio105,
  };
}

export function puedeDescargarArchivo105Previred(
  exportacion: Pick<PreviredArchivo105Export, 'listoParaEnvio105' | 'totalLineas'> | null,
): boolean {
  return !!exportacion?.listoParaEnvio105 && exportacion.totalLineas > 0;
}

export function descargarArchivo105Previred(
  exportacion: Pick<PreviredArchivo105Export, 'contenido' | 'periodo'>,
): void {
  const blob = new Blob([exportacion.contenido], { type: 'text/plain;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = nombreArchivoPrevired105(exportacion.periodo);
  enlace.click();
  URL.revokeObjectURL(url);
}

export { claveTrabajadorPrevired };
