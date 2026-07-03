/**
 * F09: resumen comparable entre versiones de cálculo de una misma nómina.
 */
export interface ResumenCalculoVersionComparable {
  idCalculoPeriodo: number;
  versionCalculo: number;
  totalTrabajadores: number;
  totalHaberes: number;
  totalDescuentos: number;
  totalLiquido: number;
}

export interface DiffCampoCalculoVersion {
  campo: keyof Omit<ResumenCalculoVersionComparable, 'idCalculoPeriodo' | 'versionCalculo'>;
  anterior: number;
  actual: number;
  delta: number;
}

export interface DiffCalculoVersionResultado {
  versionAnterior: number;
  versionActual: number;
  campos: DiffCampoCalculoVersion[];
  hayCambios: boolean;
}

const CAMPOS_DIFF: Array<keyof Omit<ResumenCalculoVersionComparable, 'idCalculoPeriodo' | 'versionCalculo'>> = [
  'totalTrabajadores',
  'totalHaberes',
  'totalDescuentos',
  'totalLiquido',
];

export function compararResumenesCalculoVersion(
  anterior: ResumenCalculoVersionComparable,
  actual: ResumenCalculoVersionComparable,
): DiffCalculoVersionResultado {
  const campos: DiffCampoCalculoVersion[] = [];
  for (const campo of CAMPOS_DIFF) {
    const valorAnterior = Number(anterior[campo] ?? 0);
    const valorActual = Number(actual[campo] ?? 0);
    if (valorAnterior !== valorActual) {
      campos.push({
        campo,
        anterior: valorAnterior,
        actual: valorActual,
        delta: valorActual - valorAnterior,
      });
    }
  }
  return {
    versionAnterior: anterior.versionCalculo,
    versionActual: actual.versionCalculo,
    campos,
    hayCambios: campos.length > 0,
  };
}

export function ordenarResumenesPorVersion(
  resumenes: readonly ResumenCalculoVersionComparable[],
): ResumenCalculoVersionComparable[] {
  return [...resumenes].sort((a, b) => a.versionCalculo - b.versionCalculo);
}

export function diffEntreVersionesConsecutivas(
  resumenes: readonly ResumenCalculoVersionComparable[],
): DiffCalculoVersionResultado[] {
  const ordenados = ordenarResumenesPorVersion(resumenes);
  const diffs: DiffCalculoVersionResultado[] = [];
  for (let i = 1; i < ordenados.length; i += 1) {
    diffs.push(compararResumenesCalculoVersion(ordenados[i - 1], ordenados[i]));
  }
  return diffs;
}

/** Excluye snapshots de parámetros F06; asigna versión secuencial por id de cálculo. */
export function esSnapshotCalculoNomina(versionMotor: string): boolean {
  return versionMotor !== 'PARAMETROS-BASE-01';
}

export interface SnapshotResumenCalculoInput {
  idCalculoPeriodo?: number;
  versionMotor: string;
  totalTrabajadores: number;
  totalHaberes: number;
  totalDescuentos: number;
  totalLiquido: number;
}

export function snapshotsAResumenesComparables(
  snapshots: readonly SnapshotResumenCalculoInput[],
): ResumenCalculoVersionComparable[] {
  const calculo = snapshots.filter(
    (s) => esSnapshotCalculoNomina(s.versionMotor) && s.idCalculoPeriodo != null,
  );
  const ordenados = [...calculo].sort(
    (a, b) => (a.idCalculoPeriodo ?? 0) - (b.idCalculoPeriodo ?? 0),
  );
  return ordenados.map((s, index) => ({
    idCalculoPeriodo: s.idCalculoPeriodo!,
    versionCalculo: index + 1,
    totalTrabajadores: Number(s.totalTrabajadores ?? 0),
    totalHaberes: Number(s.totalHaberes ?? 0),
    totalDescuentos: Number(s.totalDescuentos ?? 0),
    totalLiquido: Number(s.totalLiquido ?? 0),
  }));
}
