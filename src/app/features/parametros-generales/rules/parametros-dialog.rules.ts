import type { ParametroGeneral } from '../models/parametro-general.model';
import type {
  ConfigClienteDraftSource,
  ParametrosDialogAction,
  ParametrosDialogState,
} from '../models/parametros-workspace.vm';
import type { ParametrosDiferenciaCompletitud } from './parametros-completitud.rules';

export interface ParametrosConfigClienteActionVm {
  label: string;
  action: ParametrosDialogAction;
}

export function buildParametrosFormularioInvalidoDialog(): ParametrosDialogState {
  return {
    kind: 'alerta',
    variant: 'warning',
    title: 'Faltan datos por completar',
    message: 'Revisa los campos marcados antes de guardar los parámetros.',
    detail: 'Hay campos obligatorios o con formato inválido.',
    primaryLabel: 'Aceptar',
  };
}

export function buildParametrosPeriodoDuplicadoDialog(periodo: string): ParametrosDialogState {
  return {
    kind: 'alerta',
    variant: 'warning',
    title: 'Período ya registrado',
    message: `Ya existen parámetros registrados para el período ${periodo}.`,
    detail: 'Puedes modificar el registro existente en lugar de crear uno nuevo.',
    primaryLabel: 'Aceptar',
  };
}

export function buildParametrosExitoGuardadoDialog(periodo: string): ParametrosDialogState {
  return {
    kind: 'alerta',
    variant: 'success',
    title: 'Parámetros guardados',
    message: 'Los parámetros del período fueron guardados correctamente.',
    detail: `Período: ${periodo}`,
    primaryLabel: 'Aceptar',
  };
}

export function buildParametrosExitoActualizacionDialog(periodo: string): ParametrosDialogState {
  return {
    kind: 'alerta',
    variant: 'success',
    title: 'Parámetros actualizados',
    message: 'Los parámetros del período fueron actualizados correctamente.',
    detail: `Período: ${periodo}`,
    primaryLabel: 'Aceptar',
  };
}

export function buildParametrosExitoClienteConfigDialog(
  periodo: string,
  source: ConfigClienteDraftSource = 'existente',
  sourcePeriodo: string | null = null,
): ParametrosDialogState {
  const detail =
    source === 'referencia' && sourcePeriodo
      ? `Configuración creada desde referencia ${sourcePeriodo}.`
      : source === 'oficiales'
        ? 'Configuración actualizada con valores oficiales.'
        : source === 'ultima' && sourcePeriodo
          ? `Configuración creada desde última configuración disponible (${sourcePeriodo}).`
          : `Período: ${periodo}`;

  return {
    kind: 'alerta',
    variant: 'success',
    title: 'Configuración guardada',
    message: `Configuración de ${periodo} guardada.`,
    detail,
    primaryLabel: 'Aceptar',
  };
}

export function buildParametrosErrorGuardadoDialog(mensajeError: string): ParametrosDialogState {
  return {
    kind: 'alerta',
    variant: 'error',
    title: 'No se pudieron guardar los parámetros',
    message: 'Ocurrió un problema al intentar guardar los parámetros del período.',
    detail: mensajeError || 'Error desconocido.',
    primaryLabel: 'Aceptar',
  };
}

export function buildParametrosErrorActualizacionDialog(mensajeError: string): ParametrosDialogState {
  return {
    kind: 'alerta',
    variant: 'error',
    title: 'No se pudieron actualizar los parámetros',
    message: 'Ocurrió un problema al intentar actualizar los parámetros del período.',
    detail: mensajeError || 'Error desconocido.',
    primaryLabel: 'Aceptar',
  };
}

export function buildParametrosErrorClienteConfigDialog(mensajeError: string): ParametrosDialogState {
  return {
    kind: 'alerta',
    variant: 'error',
    title: 'No se pudo guardar la configuración',
    message: 'Ocurrió un problema al guardar la configuración del cliente.',
    detail: mensajeError || 'Error desconocido.',
    primaryLabel: 'Aceptar',
  };
}

export function buildParametrosSoloConfigClienteEditableDialog(): ParametrosDialogState {
  return {
    kind: 'alerta',
    variant: 'info',
    title: 'Solo lectura',
    message: 'Los datos oficiales mensuales se cargan por el flujo oficial.',
    detail: 'Desde Parámetros solo se puede modificar la configuración cliente del período.',
    primaryLabel: 'Aceptar',
  };
}

export function buildParametrosPeriodoInexistenteConfigDialog(periodo: string): ParametrosDialogState {
  return {
    kind: 'alerta',
    variant: 'warning',
    title: 'Período no habilitado',
    message: 'No se puede guardar configuración cliente para un período inexistente.',
    detail: `Primero debe existir el período ${periodo} en remuneraciones.`,
    primaryLabel: 'Aceptar',
  };
}

export function buildParametrosPeriodoCerradoSoloLecturaDialog(): ParametrosDialogState {
  return {
    kind: 'alerta',
    variant: 'warning',
    title: 'Período cerrado',
    message: 'El período está cerrado y queda en modo solo lectura.',
    detail: 'Cualquier cambio debe pasar por reapertura o un flujo de corrección auditado.',
    primaryLabel: 'Aceptar',
  };
}

export function buildParametrosErrorCargaDialog(detalleTecnico: string, periodo: string): ParametrosDialogState {
  return {
    kind: 'alerta',
    variant: 'error',
    title: 'No fue posible completar la operación',
    message: 'No fue posible cargar los parámetros del sistema.',
    detail: detalleTecnico ? `${detalleTecnico}\n\nPeríodo seleccionado: ${periodo}` : `Período seleccionado: ${periodo}`,
    primaryLabel: 'Aceptar',
  };
}

export function buildParametrosPeriodoNoCoincideDialog(periodoDatos: string, periodoSeleccionado: string): ParametrosDialogState {
  return {
    kind: 'alerta',
    variant: 'error',
    title: 'No se pudieron actualizar los parámetros',
    message: 'Los datos recibidos no coinciden con el período seleccionado.',
    detail: `Período en datos: ${periodoDatos}. Período seleccionado: ${periodoSeleccionado}.`,
    primaryLabel: 'Aceptar',
  };
}

export function buildParametrosExitoSincronizacionDialog(refresco: boolean): ParametrosDialogState {
  return {
    kind: 'alerta',
    variant: 'success',
    title: refresco ? 'Datos refrescados' : 'Datos sincronizados',
    message: refresco
      ? 'Los parámetros se actualizaron desde la base de datos.'
      : 'Los parámetros se sincronizaron correctamente desde la base de datos.',
    primaryLabel: 'Aceptar',
  };
}

export function buildParametrosErrorSincronizacionSinDatosDialog(): ParametrosDialogState {
  return {
    kind: 'alerta',
    variant: 'warning',
    title: 'Sin datos para sincronizar',
    message: 'No hay parámetros disponibles en la base de datos para sincronizar.',
    primaryLabel: 'Aceptar',
  };
}

export function buildParametrosConfirmacionModificacionDialog(periodo: string): ParametrosDialogState {
  return {
    kind: 'confirmar-guardado',
    variant: 'warning',
    title: 'Confirmar modificación',
    message: 'Revisa el impacto antes de actualizar la configuración cliente.',
    sections: [
      {
        title: 'Principal',
        text: `Se actualizarán los parámetros del período ${periodo}.`,
        tone: 'attention',
      },
      {
        title: 'Acción',
        text: 'Confirmar solo si los valores corresponden al cierre del período.',
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
  return {
    kind: 'confirmar-config-cliente-extendido',
    variant: 'confirm',
    title: 'Configurar período',
    message: 'No existe configuración cliente para este período.',
    detail: `Período: ${periodo}\nSelecciona una base para continuar. Se creará solo al guardar.`,
    primaryLabel: 'Crear desde cero',
    secondaryLabel: actions[0]?.label,
    secondaryAction: actions[0]?.action,
    tertiaryLabel: actions[1]?.label,
    tertiaryAction: actions[1]?.action,
  };
}

export function buildParametrosSinConfigClienteAnteriorDialog(periodo: string): ParametrosDialogState {
  return {
    kind: 'config-cliente-sin-base',
    variant: 'info',
    title: 'Sin configuración anterior',
    message: 'No hay una configuración cliente anterior disponible para usar como base.',
    detail: `Período: ${periodo}`,
    primaryLabel: 'Crear desde cero',
    secondaryLabel: 'Cancelar',
  };
}

const ETIQUETAS_CAMPO_DIFERENCIA: Partial<Record<keyof ParametroGeneral, string>> = {
  uf: 'UF',
  utm: 'UTM',
  uta: 'UTA',
  sueldoMinimo: 'Sueldo mínimo',
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

export function detalleDiferenciasOficialesCliente(
  periodo: string,
  diferencias: readonly ParametrosDiferenciaCompletitud[],
): string {
  if (diferencias.length === 0) {
    return `Período ${periodo}. Puede mantener su configuración, alinearla con los oficiales o revisar las diferencias más tarde.`;
  }

  const lineas = diferencias.map((d) => {
    const etiqueta = ETIQUETAS_CAMPO_DIFERENCIA[d.campo] ?? String(d.campo);
    return `· ${etiqueta}: oficial ${formatearValorDiferencia(d.oficial)} · su configuración ${formatearValorDiferencia(d.cliente)}`;
  });

  return [`Período ${periodo}`, '', 'Campos distintos:', ...lineas].join('\n');
}

export function buildParametrosReconciliacionDiferenciasDialog(
  periodo: string,
  diferencias: readonly ParametrosDiferenciaCompletitud[] = [],
): ParametrosDialogState {
  return {
    kind: 'reconciliacion-diferencias',
    variant: 'warning',
    title: 'Configuración distinta a los parámetros oficiales del mes',
    message:
      'Los datos guardados para este período no coinciden con la carga oficial del mes. No se actualizará nada automáticamente.',
    detail: detalleDiferenciasOficialesCliente(periodo, diferencias),
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
