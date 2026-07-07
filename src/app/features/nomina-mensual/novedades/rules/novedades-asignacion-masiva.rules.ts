import type {
  CrearNovedadMensualInput,
  NovedadMensualCategoria,
  NovedadMensualOrigen,
  NovedadMensualTipoMovimiento,
} from '../models/novedad-mensual.model';
import { validarNovedadMensualInput } from './novedades-mensuales.rules';

export type TrabajadorMovimientoEstado = 'Listo' | 'Sin movimientos' | 'Revisar' | 'Incompleto';

export interface TrabajadorMovimientoSeleccionable {
  idPersona: number;
  trabajador: string;
  rut: string;
  estado: TrabajadorMovimientoEstado;
}

export interface EmpleadoContratoResumen {
  id: number;
  idContrato?: number | null;
}

export interface FormularioNovedadMasiva {
  idConcepto: number | null;
  categoria: NovedadMensualCategoria;
  tipoMovimiento: NovedadMensualTipoMovimiento;
  cantidad: number | null;
  unidad: string;
  monto: number | null;
  moneda: string;
  origen: NovedadMensualOrigen;
  fechaEvento: string;
  observacion: string;
  referenciaExterna: string;
}

export interface ResultadoFilaAsignacionMasiva {
  idPersona: number;
  trabajador: string;
  ok: boolean;
  mensaje?: string;
}

export interface ResumenAsignacionMasiva {
  titulo: string;
  mensaje: string;
  detalle?: string;
  exitos: number;
  fallos: number;
}

export interface FilaAsignacionMasivaPreparada {
  trabajador: TrabajadorMovimientoSeleccionable;
  input: CrearNovedadMensualInput | null;
  errorPrevio: string | null;
}

export function puedeSeleccionarTrabajadorMovimiento(row: TrabajadorMovimientoSeleccionable): boolean {
  return row.estado !== 'Incompleto';
}

export function motivoSeleccionBloqueadaTrabajador(row: TrabajadorMovimientoSeleccionable): string {
  if (row.estado === 'Incompleto') {
    return 'Complete la ficha para asignar';
  }
  return '';
}

export function resolverIdContratoMasivo(
  idPersona: number,
  empleados: readonly EmpleadoContratoResumen[],
): number | null {
  const empleado = empleados.find((item) => item.id === idPersona);
  return empleado?.idContrato ?? null;
}

export function construirInputNovedadMasiva(
  periodo: string,
  formBase: FormularioNovedadMasiva,
  idPersona: number,
  idContrato: number | null,
): CrearNovedadMensualInput {
  return {
    periodo: periodo.trim(),
    idPersona,
    idContrato,
    idConcepto: formBase.idConcepto ?? 0,
    categoria: formBase.categoria,
    tipoMovimiento: formBase.tipoMovimiento,
    cantidad: formBase.cantidad,
    unidad: formBase.unidad.trim() || null,
    monto: formBase.monto,
    moneda: formBase.moneda.trim() || 'CLP',
    origen: formBase.origen,
    fechaEvento: formBase.fechaEvento.trim() || null,
    observacion: formBase.observacion.trim() || null,
    referenciaExterna: formBase.referenciaExterna.trim() || null,
  };
}

export function prepararAsignacionMasiva(
  periodo: string,
  formBase: FormularioNovedadMasiva,
  trabajadores: readonly TrabajadorMovimientoSeleccionable[],
  empleados: readonly EmpleadoContratoResumen[],
): FilaAsignacionMasivaPreparada[] {
  return trabajadores.map((trabajador) => {
    if (!puedeSeleccionarTrabajadorMovimiento(trabajador)) {
      return {
        trabajador,
        input: null,
        errorPrevio: 'Trabajador con ficha incompleta.',
      };
    }

    const idContrato = resolverIdContratoMasivo(trabajador.idPersona, empleados);
    const input = construirInputNovedadMasiva(periodo, formBase, trabajador.idPersona, idContrato);
    const validacion = validarNovedadMensualInput({ ...input, estado: 'borrador' });

    if (!validacion.valido) {
      return {
        trabajador,
        input: null,
        errorPrevio: validacion.errores[0]?.mensaje ?? 'Datos del movimiento incompletos.',
      };
    }

    return { trabajador, input, errorPrevio: null };
  });
}

export function resumirResultadoAsignacionMasiva(
  resultados: readonly ResultadoFilaAsignacionMasiva[],
): ResumenAsignacionMasiva {
  const exitos = resultados.filter((item) => item.ok).length;
  const fallos = resultados.length - exitos;
  const detalleFallos = resultados
    .filter((item) => !item.ok)
    .map((item) => `${item.trabajador}: ${item.mensaje ?? 'No se pudo registrar'}`)
    .join('\n');

  if (exitos === 0 && fallos > 0) {
    return {
      exitos,
      fallos,
      titulo: 'No se registraron movimientos',
      mensaje: `Ninguno de los ${fallos} trabajadores seleccionados pudo recibir el movimiento.`,
      detalle: detalleFallos || undefined,
    };
  }

  if (fallos === 0) {
    const etiqueta = exitos === 1 ? 'movimiento registrado' : 'movimientos registrados';
    return {
      exitos,
      fallos,
      titulo: 'Asignación completada',
      mensaje: `${exitos} ${etiqueta} en el período.`,
    };
  }

  return {
    exitos,
    fallos,
    titulo: 'Asignación parcial',
    mensaje: `${exitos} movimientos registrados · ${fallos} no se pudieron registrar.`,
    detalle: detalleFallos || undefined,
  };
}
