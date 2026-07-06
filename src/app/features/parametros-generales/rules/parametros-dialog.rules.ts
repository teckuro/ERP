import type { ParametroGeneral } from '../models/parametro-general.model';
import type {
  ConfigClienteDraftSource,
  ParametrosDialogAction,
  ParametrosDialogState,
} from '../models/parametros-workspace.vm';
import { formatearPeriodoMesAnio } from '../utils/parametros-workspace-tabs.presenter';
import {
  diferenciasConDesviacionExtrema,
  type ParametrosDiferenciaCompletitud,
} from './parametros-completitud.rules';

export interface ParametrosConfigClienteActionVm {
  label: string;
  action: ParametrosDialogAction;
}

function etiquetaPeriodo(periodo: string): string {
  const raw = formatearPeriodoMesAnio(periodo);
  const [mesUpper, ...resto] = raw.split(' ');
  if (!mesUpper) {
    return raw;
  }
  const mes = mesUpper.charAt(0) + mesUpper.slice(1).toLowerCase();
  return [mes, ...resto].join(' ');
}

function envolverDetalleTecnico(detalle: string | null | undefined): string {
  const limpio = (detalle ?? '').trim();
  if (!limpio) {
    return '';
  }
  return `Código técnico (uso interno): ${limpio}`;
}

export function buildParametrosFormularioInvalidoDialog(
  camposPendientes: readonly string[] = [],
): ParametrosDialogState {
  const detalle = camposPendientes.length > 0
    ? `Campos pendientes: ${camposPendientes.join(', ')}.`
    : 'Hay campos obligatorios o con formato inválido.';

  return {
    kind: 'alerta',
    variant: 'warning',
    title: 'Faltan datos por completar',
    message: 'Revisa los campos marcados antes de guardar.',
    detail: detalle,
    primaryLabel: 'Aceptar',
  };
}

export function buildParametrosPeriodoDuplicadoDialog(periodo: string): ParametrosDialogState {
  return {
    kind: 'alerta',
    variant: 'warning',
    title: 'Período ya registrado',
    message: `Ya hay parámetros guardados para ${etiquetaPeriodo(periodo)}.`,
    detail: 'Puedes modificar el registro existente desde el botón "Modificar".',
    primaryLabel: 'Aceptar',
  };
}

export function buildParametrosExitoGuardadoDialog(periodo: string): ParametrosDialogState {
  return {
    kind: 'alerta',
    variant: 'success',
    title: 'Parámetros guardados',
    message: `Parámetros guardados para ${etiquetaPeriodo(periodo)}.`,
    detail: 'Continúa con la configuración del cliente para cerrar el período.',
    primaryLabel: 'Aceptar',
  };
}

export function buildParametrosExitoActualizacionDialog(periodo: string): ParametrosDialogState {
  return {
    kind: 'alerta',
    variant: 'success',
    title: 'Parámetros actualizados',
    message: `Cambios guardados para ${etiquetaPeriodo(periodo)}.`,
    detail: 'Revisa los pendientes desde el resumen de cierre del período.',
    primaryLabel: 'Aceptar',
  };
}

export function buildParametrosExitoClienteConfigDialog(
  periodo: string,
  source: ConfigClienteDraftSource = 'existente',
  sourcePeriodo: string | null = null,
): ParametrosDialogState {
  const periodoLabel = etiquetaPeriodo(periodo);
  const detail = (() => {
    if (source === 'referencia' && sourcePeriodo) {
      return `Base utilizada: referencia de ${etiquetaPeriodo(sourcePeriodo)}.`;
    }
    if (source === 'oficiales') {
      return 'Base utilizada: valores oficiales del período.';
    }
    if (source === 'ultima' && sourcePeriodo) {
      return `Base utilizada: última configuración disponible (${etiquetaPeriodo(sourcePeriodo)}).`;
    }
    if (source === 'cero') {
      return 'Base utilizada: configuración creada desde cero.';
    }
    return `Período: ${periodoLabel}.`;
  })();

  return {
    kind: 'alerta',
    variant: 'success',
    title: 'Configuración guardada',
    message: `Configuración del cliente guardada para ${periodoLabel}.`,
    detail,
    primaryLabel: 'Aceptar',
  };
}

export function buildParametrosErrorGuardadoDialog(mensajeError: string): ParametrosDialogState {
  return {
    kind: 'alerta',
    variant: 'error',
    title: 'No se pudo guardar',
    message: 'No se pudo guardar el período. Reintenta en unos segundos.',
    detail: envolverDetalleTecnico(mensajeError) || 'Si el problema continúa, contacta a soporte.',
    primaryLabel: 'Aceptar',
  };
}

export function buildParametrosErrorActualizacionDialog(mensajeError: string): ParametrosDialogState {
  return {
    kind: 'alerta',
    variant: 'error',
    title: 'No se pudo actualizar',
    message: 'No se pudo actualizar el período. Reintenta en unos segundos.',
    detail: envolverDetalleTecnico(mensajeError) || 'Si el problema continúa, contacta a soporte.',
    primaryLabel: 'Aceptar',
  };
}

export function buildParametrosErrorClienteConfigDialog(mensajeError: string): ParametrosDialogState {
  return {
    kind: 'alerta',
    variant: 'error',
    title: 'No se pudo guardar la configuración',
    message: 'No se pudo guardar la configuración del cliente. Reintenta en unos segundos.',
    detail: envolverDetalleTecnico(mensajeError) || 'Si el problema continúa, contacta a soporte.',
    primaryLabel: 'Aceptar',
  };
}

export function buildParametrosSoloConfigClienteEditableDialog(): ParametrosDialogState {
  return {
    kind: 'alerta',
    variant: 'info',
    title: 'Datos oficiales en solo lectura',
    message: 'Los datos oficiales se cargan desde el proceso normativo del mes.',
    detail: 'Desde Parámetros sólo se edita la configuración del cliente para el período.',
    primaryLabel: 'Aceptar',
  };
}

export function buildParametrosPeriodoInexistenteConfigDialog(periodo: string): ParametrosDialogState {
  return {
    kind: 'alerta',
    variant: 'warning',
    title: 'Período no habilitado',
    message: 'Falta crear el período en Remuneraciones antes de configurarlo.',
    detail: `Crea el período ${etiquetaPeriodo(periodo)} en Remuneraciones para continuar.`,
    primaryLabel: 'Aceptar',
  };
}

export function buildParametrosPeriodoCerradoSoloLecturaDialog(): ParametrosDialogState {
  return {
    kind: 'alerta',
    variant: 'warning',
    title: 'Período cerrado',
    message: 'El período está cerrado y queda en sólo lectura.',
    detail: 'Cualquier cambio requiere reapertura desde el flujo de corrección auditado.',
    primaryLabel: 'Aceptar',
  };
}

export function buildParametrosErrorCargaDialog(detalleTecnico: string, periodo: string): ParametrosDialogState {
  const periodoLabel = etiquetaPeriodo(periodo);
  const detalleEnvuelto = envolverDetalleTecnico(detalleTecnico);
  const detail = detalleEnvuelto
    ? `${detalleEnvuelto}\nPeríodo seleccionado: ${periodoLabel}.`
    : `Período seleccionado: ${periodoLabel}.`;

  return {
    kind: 'alerta',
    variant: 'error',
    title: 'No se pudieron cargar los parámetros',
    message: `No se pudieron cargar los parámetros para ${periodoLabel}. Reintenta en unos segundos.`,
    detail,
    primaryLabel: 'Aceptar',
  };
}

export function buildParametrosPeriodoNoCoincideDialog(periodoDatos: string, periodoSeleccionado: string): ParametrosDialogState {
  return {
    kind: 'alerta',
    variant: 'error',
    title: 'Datos del período no coinciden',
    message: `Los datos cargados no corresponden a ${etiquetaPeriodo(periodoSeleccionado)}.`,
    detail: `Período en datos: ${etiquetaPeriodo(periodoDatos)}. Vuelve a seleccionar el período para forzar la recarga.`,
    primaryLabel: 'Aceptar',
  };
}

export function buildParametrosExitoSincronizacionDialog(refresco: boolean): ParametrosDialogState {
  return {
    kind: 'alerta',
    variant: 'success',
    title: refresco ? 'Datos refrescados' : 'Datos sincronizados',
    message: refresco
      ? 'Los parámetros del período se actualizaron desde la base de datos.'
      : 'Los parámetros del período se sincronizaron correctamente.',
    detail: 'Continúa con la revisión del cierre del período.',
    primaryLabel: 'Aceptar',
  };
}

export function buildParametrosErrorSincronizacionSinDatosDialog(): ParametrosDialogState {
  return {
    kind: 'alerta',
    variant: 'warning',
    title: 'Sin datos para sincronizar',
    message: 'No hay parámetros normativos disponibles para este período.',
    detail: 'Verifica que el proceso normativo del mes se haya ejecutado.',
    primaryLabel: 'Aceptar',
  };
}

export function buildParametrosConfirmacionModificacionDialog(periodo: string): ParametrosDialogState {
  const periodoLabel = etiquetaPeriodo(periodo);
  return {
    kind: 'confirmar-guardado',
    variant: 'warning',
    title: 'Confirmar modificación',
    message: 'Confirma que los valores corresponden al cierre del período.',
    sections: [
      {
        title: 'Cambio principal',
        text: `Se actualizará la configuración del cliente para ${periodoLabel}.`,
        tone: 'attention',
      },
      {
        title: 'Acción',
        text: 'Esta acción sobrescribe los valores guardados. Confirma sólo si los datos están revisados.',
        tone: 'info',
      },
    ],
    primaryLabel: 'Confirmar modificación',
    secondaryLabel: 'Cancelar',
  };
}

export function buildParametrosDecisionConfigClienteDialog(
  periodo: string,
  actions: readonly ParametrosConfigClienteActionVm[],
): ParametrosDialogState {
  const periodoLabel = etiquetaPeriodo(periodo);
  return {
    kind: 'confirmar-config-cliente-extendido',
    variant: 'confirm',
    title: 'Configurar el período',
    message: `No hay configuración del cliente para ${periodoLabel}.`,
    detail: 'Elige una base para continuar. La configuración se crea sólo al guardar.',
    primaryLabel: 'Crear desde cero',
    secondaryLabel: actions[0]?.label,
    secondaryAction: actions[0]?.action,
    tertiaryLabel: actions[1]?.label,
    tertiaryAction: actions[1]?.action,
    fourthLabel: actions[2]?.label,
    fourthAction: actions[2]?.action,
  };
}

export function buildParametrosSinConfigClienteAnteriorDialog(periodo: string): ParametrosDialogState {
  return {
    kind: 'config-cliente-sin-base',
    variant: 'info',
    title: 'Sin configuración previa',
    message: 'No hay configuración del cliente anterior para reutilizar como base.',
    detail: `Período: ${etiquetaPeriodo(periodo)}. Puedes crear la configuración desde cero.`,
    primaryLabel: 'Crear desde cero',
    secondaryLabel: 'Cancelar',
  };
}

export function buildParametrosConfirmarAbandonarEdicionDialog(): ParametrosDialogState {
  return {
    kind: 'confirmar-abandonar-edicion',
    variant: 'confirm',
    title: 'Cambios sin guardar',
    message: '¿Quieres descartar los cambios y cambiar de período?',
    detail: 'Los datos editados se perderán si continúas.',
    primaryLabel: 'Descartar y cambiar',
    secondaryLabel: 'Seguir editando',
  };
}

export const ETIQUETAS_CAMPO_DIFERENCIA: Partial<Record<keyof ParametroGeneral, string>> = {
  uf: 'UF',
  utm: 'UTM',
  uta: 'UTA',
  sueldoMinimo: 'Sueldo mínimo',
  sueldoMinimo18a65: 'Sueldo mínimo 18 a 65',
  sueldoMinimoMenor18Mayor65: 'Sueldo mínimo menor 18 o mayor 65',
  sueldoMinimoCasaParticular: 'Sueldo mínimo casa particular',
  ingresoMinimoNoRemuneracional: 'Ingreso mínimo no remuneracional',
  topeAfpUf: 'Tope AFP (UF)',
  topeAfp: 'Tope AFP',
  topeIpsUf: 'Tope IPS (UF)',
  topeIps: 'Tope IPS',
  topeCesantiaUf: 'Tope cesantía (UF)',
  topeCesantia: 'Tope cesantía',
  topeApvMensualUf: 'Tope APV mensual (UF)',
  topeApvMensual: 'Tope APV mensual',
  topeApvAnualUf: 'Tope APV anual (UF)',
  topeApvAnual: 'Tope APV anual',
  topeDepositoConvenidoAnualUf: 'Tope depósito convenido anual (UF)',
  topeDepositoConvenidoAnual: 'Tope depósito convenido anual',
  topeAfpVoluntario: 'Tope AFP voluntario',
  sis: 'SIS',
  sanna: 'SANNA',
  saludObligatoria: 'Salud obligatoria',
  afcTrabajadorIndefinido: 'AFC trabajador indefinido',
  afcEmpleadorIndefinido: 'AFC empleador indefinido',
  afcEmpleadorPlazo: 'AFC empleador plazo',
  trabajoPesadoEmpleador: 'Trabajo pesado empleador',
  trabajoPesadoTrabajador: 'Trabajo pesado trabajador',
  trabajoMenosPesadoEmpleador: 'Trabajo menos pesado empleador',
  trabajoMenosPesadoTrabajador: 'Trabajo menos pesado trabajador',
};

function formatearValorDiferencia(value: number | boolean | null): string {
  if (value === null) {
    return 'sin valor';
  }
  if (typeof value === 'boolean') {
    return value ? 'Sí' : 'No';
  }
  return String(value);
}

export interface DetalleDiferenciasOficialesOpciones {
  periodoReferenciaOficial?: string | null;
}

export function detalleDiferenciasOficialesCliente(
  periodo: string,
  diferencias: readonly ParametrosDiferenciaCompletitud[],
  opciones?: DetalleDiferenciasOficialesOpciones,
): string {
  const periodoLabel = etiquetaPeriodo(periodo);

  if (diferencias.length === 0) {
    return `Período ${periodoLabel}. Puedes mantener tu configuración, alinearla con los oficiales o revisar las diferencias más tarde.`;
  }

  const encabezado: string[] = [`Período ${periodoLabel}`];
  const periodoRef = opciones?.periodoReferenciaOficial?.trim();
  if (periodoRef && periodoRef !== periodo) {
    encabezado.push(`Comparación con referencia del período ${etiquetaPeriodo(periodoRef)}.`);
  }

  const extremas = diferenciasConDesviacionExtrema(diferencias);
  if (extremas.length > 0) {
    const etiquetas = extremas
      .map((d) => ETIQUETAS_CAMPO_DIFERENCIA[d.campo] ?? String(d.campo))
      .join(', ');
    encabezado.push(`El valor guardado se aparta mucho del oficial del mes (${etiquetas}).`);
  }

  const lineas = diferencias.map((d) => {
    const etiqueta = ETIQUETAS_CAMPO_DIFERENCIA[d.campo] ?? String(d.campo);
    return `· ${etiqueta}: oficial ${formatearValorDiferencia(d.oficial)} · tu configuración ${formatearValorDiferencia(d.cliente)}`;
  });

  return [...encabezado, '', 'Campos distintos:', ...lineas].join('\n');
}

export function buildParametrosReconciliacionDiferenciasDialog(
  periodo: string,
  diferencias: readonly ParametrosDiferenciaCompletitud[] = [],
  opciones?: DetalleDiferenciasOficialesOpciones & { contexto?: 'post-guardado' | 'apertura' },
): ParametrosDialogState {
  const esPostGuardado = opciones?.contexto === 'post-guardado';
  return {
    kind: 'reconciliacion-diferencias',
    variant: esPostGuardado ? 'success' : 'warning',
    title: esPostGuardado
      ? 'Guardado. Revisa las diferencias'
      : 'Diferencias con los datos oficiales',
    message: esPostGuardado
      ? 'La configuración del cliente quedó guardada, pero difiere de los datos oficiales del mes. No se actualizará nada automáticamente.'
      : 'Tu configuración del cliente difiere de los datos oficiales del mes. No se actualizará nada automáticamente.',
    detail: detalleDiferenciasOficialesCliente(periodo, diferencias, opciones),
    primaryLabel: 'Mantener mi configuración',
    secondaryLabel: 'Actualizar con oficiales',
    secondaryAction: 'actualizar-con-oficiales',
    tertiaryLabel: 'Revisar después',
    tertiaryAction: 'revisar-despues',
  };
}

export function buildParametrosRegistroDecisionReconciliacionDialog(
  estado: 'revisar_despues' | 'cliente_confirmado',
  message: string,
  detail: string,
): ParametrosDialogState {
  return {
    kind: 'alerta',
    variant: estado === 'cliente_confirmado' ? 'info' : 'warning',
    title: estado === 'cliente_confirmado' ? 'Configuración mantenida' : 'Revisión postergada',
    message,
    detail,
    primaryLabel: 'Aceptar',
  };
}
