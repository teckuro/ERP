export type NovedadesAccionPeriodoRecomendada = 'revisar_pendientes' | null;

export interface NovedadesPeriodoEstadoInput {
  periodoEtiqueta: string;
  totalTrabajadores: number;
  conMovimientos: number;
  conRecurrentes: number;
  porRevisar: number;
  listosNomina: number;
  desdeFlowNomina: boolean;
}

export interface NovedadesMetricaPeriodo {
  label: string;
  total: number;
  tono: 'neutral' | 'info' | 'ok' | 'review';
}

export interface NovedadesPeriodoEstadoPresentacion {
  linea: string;
  metricas: NovedadesMetricaPeriodo[];
  accionRecomendada: {
    tipo: NovedadesAccionPeriodoRecomendada;
    etiqueta: string;
  };
  bannerFlowNomina: string | null;
}

function cantidadTexto(cantidad: number, singular: string, plural: string): string {
  return `${cantidad} ${cantidad === 1 ? singular : plural}`;
}

export function presentarEstadoPeriodoNovedades(
  input: NovedadesPeriodoEstadoInput,
): NovedadesPeriodoEstadoPresentacion {
  const {
    totalTrabajadores,
    conMovimientos,
    conRecurrentes,
    porRevisar,
    listosNomina,
    desdeFlowNomina,
  } = input;

  const metricas: NovedadesMetricaPeriodo[] = [
    { label: 'Trabajadores', total: totalTrabajadores, tono: 'neutral' },
    { label: 'Con mov. mes', total: conMovimientos, tono: 'info' },
    { label: 'Recurrentes', total: conRecurrentes, tono: 'ok' },
    { label: 'Por revisar', total: porRevisar, tono: 'review' },
  ];

  let accionRecomendada: NovedadesPeriodoEstadoPresentacion['accionRecomendada'] = {
    tipo: null,
    etiqueta: '',
  };
  let linea: string;

  if (porRevisar > 0) {
    accionRecomendada = {
      tipo: 'revisar_pendientes',
      etiqueta: 'Revisar pendientes',
    };
    linea = `${cantidadTexto(porRevisar, 'revisión pendiente', 'revisiones pendientes')} en el período.`;
  } else if (conMovimientos === 0 && conRecurrentes === 0 && totalTrabajadores > 0) {
    linea = 'Sin movimientos registrados en el período.';
  } else if (listosNomina > 0) {
    linea = `${cantidadTexto(listosNomina, 'movimiento listo', 'movimientos listos')} para nómina.`;
  } else if (conMovimientos > 0 || conRecurrentes > 0) {
    linea = 'Movimientos registrados — revise y apruebe si corresponde.';
  } else {
    linea = 'Período sin trabajadores activos con movimientos.';
  }

  const bannerFlowNomina = desdeFlowNomina
    ? `Está revisando movimientos de ${input.periodoEtiqueta} antes de continuar la nómina.`
    : null;

  return { linea, metricas, accionRecomendada, bannerFlowNomina };
}
