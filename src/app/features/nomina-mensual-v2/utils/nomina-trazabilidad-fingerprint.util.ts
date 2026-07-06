/**
 * Transformación visual temporal del hash técnico leído en adapter.
 * ADVERTENCIA: solo display. No usar para comparación, aprobación, validación ni seguridad.
 * V11: el fingerprint debe venir desde backend, no derivarse en Angular.
 */
export function toFingerprintPublico(hashTecnico: string | null | undefined): string | undefined {
  if (!hashTecnico?.trim()) return undefined;
  const hex = hashTecnico.replace(/^fnv1a32:/i, '').replace(/[^a-f0-9]/gi, '');
  if (hex.length < 4) return undefined;
  const a = hex.slice(0, 4).toUpperCase();
  const b = hex.slice(-4).toUpperCase();
  return `${a}-${b}`;
}
