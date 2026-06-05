import { payrollSteps } from '../../../data/nomina-mensual-v2.mock';
import type { PayrollStepId, PayrollStepStatus } from '../../../models/nomina-mensual-v2.models';
import type { NominaPeriodo } from '../../../../nomina-mensual/models/nomina-periodo.models';

/**
 * Orden de pasos del Generador definitivo (NOM-REBUILD-NOMINA-MENSUAL-01 / F3 fusion).
 * Reemplaza el set de 8 pasos por 6 pasos.
 */
export const ORDEN_PASOS_NOMINA: PayrollStepId[] = [
  'parameters',
  'dotacion',
  'movements',
  'calculation',
  'validation',
  'closure',
];

/**
 * Resultado tipado del comando único de avance por paso (AG-NAV-03).
 *
 * El CTA del shell delega en `avanzar()` del paso activo. Si el paso considera
 * que puede continuar (operación terminal ejecutada con éxito o estado
 * navegacional cumplido) retorna `{ ok: true }`. Si no, retorna `{ ok: false }`
 * con la razón humana que el container publica como `ayudaAvance`.
 *
 * Híbrido acotado:
 *  - Dotación / Validación / Cierre: terminal — `avanzar()` ejecuta la acción
 *    real (confirmar / aprobar / abrir modal de cierre).
 *  - Movimientos / Cálculo: navegacional — `avanzar()` sólo valida que el paso
 *    esté en estado vigente; las acciones operativas (`Aplicar recurrentes`,
 *    `Calcular nómina`) permanecen como botones inline.
 */
export type ResultadoAvancePaso =
  | { ok: true }
  | { ok: false; razon: string };

/**
 * Contrato que cada paso del generador debe cumplir para que el CTA del shell
 * funcione como comando único de avance.
 */
export interface PasoNominaPort {
  avanzar(): Promise<ResultadoAvancePaso>;
}

/**
 * Resultado de la delegación: combina el resultado del paso con el siguiente
 * destino a navegar (si corresponde). `closure` es el paso terminal: aunque
 * `avanzar()` retorne `ok:true`, `siguientePaso` queda en `null`.
 */
export interface ResultadoDelegacionAvance {
  resultado: ResultadoAvancePaso;
  siguientePaso: PayrollStepId | null;
}

/**
 * Función pura que el container invoca para delegar el comando único de avance
 * (AG-NAV-03). Aislada del container para que sea testable sin TestBed.
 *
 * Si `paso` es `null` (el ViewChild no existe todavía), retorna
 * `{ ok: false, razon: 'No hay un paso activo.' }`.
 *
 * El container es responsable de:
 *  - Publicar `resultado.razon` como `ayudaAvance` cuando `ok === false`.
 *  - Navegar a `siguientePaso` cuando es no nulo.
 *  - Manejar el caso `parameters` por su rama propia (orquestador de
 *    parámetros con sus modales) antes de invocar esta función.
 */
export async function ejecutarAvancePaso(
  pasoActual: PayrollStepId,
  paso: PasoNominaPort | null,
): Promise<ResultadoDelegacionAvance> {
  if (!paso) {
    return {
      resultado: { ok: false, razon: 'No hay un paso activo.' },
      siguientePaso: null,
    };
  }
  const resultado = await paso.avanzar();
  if (!resultado.ok) {
    return { resultado, siguientePaso: null };
  }
  const indice = ORDEN_PASOS_NOMINA.indexOf(pasoActual);
  const siguientePaso = indice >= 0 ? ORDEN_PASOS_NOMINA[indice + 1] ?? null : null;
  return { resultado, siguientePaso };
}

export const PASOS_NOMINA = payrollSteps;

/**
 * Pasos sin lógica productiva todavía (placeholder hasta F6 motor productivo).
 * En F3 fusion todos los pasos están funcionales operativamente; el conjunto
 * queda vacío. Se preserva la API por compatibilidad con stepper / overlays.
 */
export const PASOS_CONGELADOS_V11: ReadonlySet<PayrollStepId> = new Set();

export function esPasoCongelado(stepId: PayrollStepId): boolean {
  return PASOS_CONGELADOS_V11.has(stepId);
}

export function tooltipPasoCongelado(): string {
  return 'Disponible al conectar el motor productivo final.';
}

export type AyudaAvanceTono = 'bloqueo' | 'revision' | null;

/**
 * Devuelve el índice del último paso completado según el estado persistido
 * de la nómina (AG-NAV-02). Los pasos cuyo índice es `<= indiceUltimoCompletado`
 * se consideran completados; el resto queda como pendiente o activo.
 *
 * Caveats:
 *  - `reabierta` regresa al estado pre-cierre: la nómina volvió a ser
 *    editable, por lo que el cierre vuelve a `pending`.
 *  - `anulada` pierde toda vigencia operativa: ningún paso se considera
 *    completado.
 *  - `calculation` necesita además que `evidenciaCalculo.calculoVigente` sea
 *    `true` para considerarse completado (la excepción se aplica fuera de
 *    esta función para mantenerla pura).
 */
export function indiceUltimoPasoCompletado(nomina: NominaPeriodo | null): number {
  if (!nomina) return -1;
  switch (nomina.estado) {
    case 'borrador':
      return -1;
    case 'dotacion_generada':
      return 0;
    case 'en_revision':
      return 1;
    case 'calculada':
      return 2;
    case 'validada':
      return 3;
    case 'aprobada':
      return 4;
    case 'cerrada':
      return 5;
    case 'reabierta':
      return 4;
    case 'anulada':
      return -1;
  }
}

/**
 * Calcula el estado visual de un paso del stepper a partir del paso activo y
 * la evidencia persistida de la nómina (AG-NAV-02). Reemplaza la heurística
 * por posición visitada por una derivación basada en `nomina.estado` +
 * `evidenciaCalculo.calculoVigente`.
 *
 * Reglas:
 *  - El paso activo siempre es `active`.
 *  - Un paso es `completed` si su índice es `<= indiceUltimoPasoCompletado`.
 *  - Excepción `calculation`: además del índice, requiere
 *    `evidenciaCalculo.calculoVigente === true`; si el snapshot dejó de ser
 *    vigente vuelve a `pending`.
 *  - Si no se cumplen las condiciones anteriores, queda `pending`.
 */
export function obtenerEstadoPaso(
  stepId: PayrollStepId,
  pasoActual: PayrollStepId,
  nomina: NominaPeriodo | null = null,
): PayrollStepStatus {
  if (stepId === pasoActual) return 'active';
  const indicePaso = ORDEN_PASOS_NOMINA.indexOf(stepId);
  const ultimoCompletado = indiceUltimoPasoCompletado(nomina);
  if (indicePaso > ultimoCompletado) return 'pending';
  if (stepId === 'calculation' && !(nomina?.evidenciaCalculo?.calculoVigente ?? false)) {
    return 'pending';
  }
  return 'completed';
}

export function esAvanceHaciaAdelante(pasoActual: PayrollStepId, destinoPaso: PayrollStepId): boolean {
  return ORDEN_PASOS_NOMINA.indexOf(destinoPaso) > ORDEN_PASOS_NOMINA.indexOf(pasoActual);
}

export function esRetrocesoAPaso(pasoActual: PayrollStepId, destinoPaso: PayrollStepId): boolean {
  return ORDEN_PASOS_NOMINA.indexOf(destinoPaso) < ORDEN_PASOS_NOMINA.indexOf(pasoActual);
}

export function obtenerTituloPaso(paso: PayrollStepId): string {
  switch (paso) {
    case 'parameters':
      return 'Parámetros de nómina';
    case 'dotacion':
      return 'Dotación del período';
    case 'movements':
      return 'Movimientos del período';
    case 'calculation':
      return 'Cálculo de la nómina';
    case 'validation':
      return 'Validación previa al cierre';
    case 'closure':
      return 'Cierre y liquidaciones';
  }
}

export function obtenerSubtituloPaso(paso: PayrollStepId): string {
  switch (paso) {
    case 'parameters':
      return 'Configuración normativa y operativa requerida antes de generar la dotación.';
    case 'dotacion':
      return 'Trabajadores incluidos en este período. Trabaja por excepción: incidencias, segmentos y datos faltantes.';
    case 'movements':
      return 'Recurrentes aplicados, movimientos manuales y omisiones del mes.';
    case 'calculation':
      return 'Procesa el cálculo y revisa el snapshot antes de validar.';
    case 'validation':
      return 'Resumen de incidencias y guardias antes de cerrar la nómina.';
    case 'closure':
      return 'Aprueba el cierre operativo y genera las liquidaciones del período.';
  }
}

export function obtenerEtiquetaAccionPrincipal(paso: PayrollStepId): string {
  switch (paso) {
    case 'parameters':
      return 'Guardar parámetros';
    case 'dotacion':
      return 'Confirmar dotación';
    case 'movements':
      return 'Continuar al cálculo';
    case 'calculation':
      return 'Continuar a validación';
    case 'validation':
      return 'Aprobar para cierre';
    case 'closure':
      return 'Cerrar nómina';
  }
}

export function obtenerIconoPaso(stepId: PayrollStepId): string {
  switch (stepId) {
    case 'parameters':
      return 'settings-2';
    case 'dotacion':
      return 'users';
    case 'movements':
      return 'list-plus';
    case 'calculation':
      return 'calculator';
    case 'validation':
      return 'shield-check';
    case 'closure':
      return 'lock';
  }
}
