export interface NovedadesBreadcrumbModalInput {
  trabajador: string;
  accion: 'mensual' | 'recurrente';
  editando: boolean;
}

export interface NovedadesLeyendaEstado {
  etiqueta: string;
  hint: string;
}

export function breadcrumbGestionModalHijo(input: NovedadesBreadcrumbModalInput): string {
  const accion =
    input.accion === 'mensual'
      ? input.editando
        ? 'Editar movimiento del mes'
        : 'Registrar movimiento del mes'
      : input.editando
        ? 'Editar recurrente'
        : 'Registrar recurrente';
  return `Gestionar · ${input.trabajador} · ${accion}`;
}

export function leyendaEstadosGestion(): NovedadesLeyendaEstado[] {
  return [
    { etiqueta: 'Borrador', hint: 'Editable; aún no entra a revisión.' },
    { etiqueta: 'Pendiente revisión', hint: 'Espera aprobación u observación.' },
    { etiqueta: 'Aprobada', hint: 'Lista para el cálculo del mes.' },
    { etiqueta: 'Observada', hint: 'Requiere corrección antes de aprobar.' },
  ];
}

export function mensajeAccionBloqueadaMensual(estadoEtiqueta: string): string {
  const normalizado = estadoEtiqueta.toLowerCase();
  if (normalizado.includes('aprobada') || normalizado.includes('pre-nómina') || normalizado.includes('calculada')) {
    return 'Solo consulta: el movimiento ya está listo o calculado.';
  }
  if (normalizado.includes('anulada')) {
    return 'Movimiento anulado; no admite cambios.';
  }
  if (normalizado.includes('rechazada') || normalizado.includes('observ')) {
    return 'Corrija el movimiento desde Editar si aún está permitido.';
  }
  return 'No hay acciones disponibles para este estado.';
}

export function mensajeAccionBloqueadaRecurrente(): string {
  return 'Recurrente vigente sin acciones en este filtro.';
}

export function mensajeAccionBloqueadaCorto(
  estadoEtiqueta: string,
  ambito: 'mensual' | 'recurrente',
): string {
  if (ambito === 'recurrente') {
    return 'Vigente';
  }
  const normalizado = estadoEtiqueta.toLowerCase();
  if (normalizado.includes('aprobada') || normalizado.includes('pre-nómina') || normalizado.includes('calculada')) {
    return 'Solo consulta';
  }
  if (normalizado.includes('anulada')) {
    return 'Anulado';
  }
  return 'Sin acciones';
}
