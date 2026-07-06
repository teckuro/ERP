export function resolverPasoAnteriorAsistenteAlta(sequence: readonly number[], activeStep: number): number | null {
  const index = sequence.indexOf(activeStep);
  if (index === -1) {
    const candidates = sequence.filter((step) => step < activeStep);
    return candidates.length ? candidates[candidates.length - 1]! : (sequence[0] ?? null);
  }

  return index > 0 ? sequence[index - 1]! : null;
}

export function resolverPasoSiguienteAsistenteAlta(sequence: readonly number[], activeStep: number): number | null {
  const index = sequence.indexOf(activeStep);
  if (index === -1) {
    return sequence.find((step) => step > activeStep) ?? null;
  }

  return index < sequence.length - 1 ? sequence[index + 1]! : null;
}

export function esPrimerPasoAsistenteAlta(sequence: readonly number[], activeStep: number): boolean {
  const first = sequence[0];
  if (first === undefined) {
    return true;
  }

  const index = sequence.indexOf(activeStep);
  return index === -1 ? activeStep <= first : index === 0;
}

export function esUltimoPasoAsistenteAlta(sequence: readonly number[], activeStep: number): boolean {
  const last = sequence[sequence.length - 1];
  return last === undefined || activeStep === last;
}

export function calcularPorcentajeProgresoAsistenteAlta(activeStep: number, totalPasos: number): number {
  if (totalPasos <= 0) {
    return 0;
  }

  return Math.round(((activeStep + 1) / totalPasos) * 100);
}

export function estaPasoAsistenteAltaEnRango(step: number, totalPasos: number): boolean {
  return step >= 0 && step < totalPasos;
}
