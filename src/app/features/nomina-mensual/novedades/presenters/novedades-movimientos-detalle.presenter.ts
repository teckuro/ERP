import type { MessageBoxSection } from '../../../../shared/components/ui/feedback/message-box/message-box.types';

export interface NovedadesDetalleMovimientoInput {
  trabajador: string;
  rut: string;
  periodoEtiqueta: string;
  ambito: 'mensual' | 'recurrente';
  concepto: string;
  tipo: string;
  monto: string;
  vigencia: string;
  estadoEtiqueta: string;
  detalle: string;
  origen?: string;
  observacion?: string | null;
}

export function tituloDetalleMovimiento(ambito: NovedadesDetalleMovimientoInput['ambito']): string {
  return ambito === 'mensual' ? 'Detalle del movimiento del mes' : 'Detalle del recurrente';
}

export function mensajeDetalleMovimiento(input: Pick<NovedadesDetalleMovimientoInput, 'trabajador' | 'concepto'>): string {
  return `${input.trabajador} · ${input.concepto}`;
}

export function seccionesDetalleMovimiento(input: NovedadesDetalleMovimientoInput): MessageBoxSection[] {
  const secciones: MessageBoxSection[] = [
    {
      title: 'Identificación',
      text: `${input.trabajador} · ${input.rut} · ${input.periodoEtiqueta}`,
      tone: 'neutral',
    },
    {
      title: input.ambito === 'mensual' ? 'Movimiento del mes' : 'Recurrente',
      items: [
        `Concepto: ${input.concepto}`,
        `Tipo: ${input.tipo}`,
        `Monto: ${input.monto}`,
        `Ámbito: ${input.ambito === 'mensual' ? 'Mensual' : 'Recurrente'}`,
        `Vigencia / fecha: ${input.vigencia}`,
        `Estado: ${input.estadoEtiqueta}`,
      ],
      tone: 'info',
    },
  ];

  if (input.origen) {
    secciones.push({
      title: 'Origen',
      text: input.origen,
      tone: 'neutral',
    });
  }

  if (input.observacion?.trim()) {
    secciones.push({
      title: 'Observación',
      text: input.observacion.trim(),
      tone: 'attention',
    });
  }

  if (input.detalle.trim()) {
    secciones.push({
      title: 'Última acción / impacto',
      text: input.detalle,
      tone: 'neutral',
    });
  }

  return secciones.slice(0, 4);
}
