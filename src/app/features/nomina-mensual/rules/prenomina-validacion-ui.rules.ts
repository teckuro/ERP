/**
 * Maps RPC / store error text to RRHH-facing copy (no PRENOMINA_* codes visible).
 */
export function mensajeErrorPrenominaParaUsuario(raw: string | null | undefined): string | null {
  if (!raw?.trim()) return null;
  const texto = raw.trim();
  const lower = texto.toLowerCase();

  if (lower.includes('hash') && (lower.includes('coincid') || lower.includes('distint'))) {
    return 'Los datos del período cambiaron. Guarde de nuevo la revisión antes de aprobar.';
  }
  if (lower.includes('prenomina_hash')) {
    return 'La versión guardada no coincide con el cálculo actual. Guarde de nuevo la revisión.';
  }
  if (lower.includes('primero emite las liquidaciones') || lower.includes('primero emite')) {
    return 'Primero emite las liquidaciones del período antes de cerrar el proceso mensual.';
  }
  if (lower.includes('primero aprueba')) {
    return 'Primero aprueba la nómina del período.';
  }
  if (lower.includes('ya está cerrado') || lower.includes('ya esta cerrado')) {
    return 'El proceso mensual ya está cerrado.';
  }

  const sinPrefijoTecnico = texto.replace(/^No se pudo [^:]+:\s*/i, '').trim();
  if (sinPrefijoTecnico && sinPrefijoTecnico !== texto && !sinPrefijoTecnico.toLowerCase().startsWith('no se pudo')) {
    return sinPrefijoTecnico;
  }

  if (texto.startsWith('No se pudo ')) {
    return texto.replace(/^No se pudo [^:]+:\s*/i, '').trim() || texto;
  }

  return texto;
}
