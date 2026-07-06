function normalizarCodigoMoneda(moneda: string | null | undefined): string {
  return (moneda ?? 'CLP').trim().toUpperCase() || 'CLP';
}

export function formatoMontoNomina(
  valor: number | null | undefined,
  moneda: string | null | undefined = 'CLP',
): string {
  if (typeof valor !== 'number' || !Number.isFinite(valor)) return 'Monto no disponible';
  const codigo = normalizarCodigoMoneda(moneda);
  if (codigo === 'UF') {
    return `UF ${new Intl.NumberFormat('es-CL', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(valor)}`;
  }
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: codigo === 'CLP' || codigo.length !== 3 ? 'CLP' : codigo,
    maximumFractionDigits: 0,
  }).format(valor);
}

export function formatoFechaHoraNomina(valor: string | null | undefined): string {
  if (!valor) return 'Fecha no disponible';
  const fecha = new Date(valor);
  if (Number.isNaN(fecha.getTime())) return valor;
  return new Intl.DateTimeFormat('es-CL', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(fecha);
}

export function horaCortaNomina(valor: string | null | undefined): string {
  if (!valor) return '--:--';
  const fecha = new Date(valor);
  if (Number.isNaN(fecha.getTime())) return '--:--';
  return new Intl.DateTimeFormat('es-CL', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(fecha);
}
