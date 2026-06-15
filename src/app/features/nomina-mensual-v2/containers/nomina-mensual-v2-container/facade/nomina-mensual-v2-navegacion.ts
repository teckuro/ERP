import { payrollSteps } from '../../../data/nomina-mensual-v2.mock';
import type { PayrollStepId, PayrollStepStatus } from '../../../models/nomina-mensual-v2.models';
import type {
  EstadoNomina,
  NominaPeriodo,
} from '../../../../nomina-mensual/models/nomina-periodo.models';

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
export type ResultadoAvancePaso = { ok: true } | { ok: false; razon: string };

/**
 * Contrato que cada paso del generador debe cumplir para que el CTA del shell
 * funcione como comando único de avance.
 *
 * `puedeContinuar()` es PURO: no produce side-effects. Lo consultan el CTA del
 * shell (para deshabilitarse con razón visible) y el stepper (para bloquear
 * pasos no accesibles). Debe ser barato de invocar — típicamente lee signals.
 *
 * `avanzar()` es TERMINAL: invoca primero `puedeContinuar()` y, si pasa,
 * ejecuta la acción real del paso (confirmarDotacion, validarYAprobar, abrir
 * modal de cierre, etc.).
 */
export interface PasoNominaPort {
  puedeContinuar(): ResultadoAvancePaso;
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
  const siguientePaso = indice >= 0 ? (ORDEN_PASOS_NOMINA[indice + 1] ?? null) : null;
  return { resultado, siguientePaso };
}

/**
 * Devuelve el paso inmediatamente anterior en `ORDEN_PASOS_NOMINA`, o
 * `null` si el paso activo es el primero (no hay retroceso posible). Lo
 * usa el stepper para el botón "Volver al paso anterior" y mantener un
 * único punto de retroceso fuera del cuerpo de cada paso.
 */
export function pasoAnteriorDe(pasoActual: PayrollStepId | null): PayrollStepId | null {
  if (!pasoActual) return null;
  const indice = ORDEN_PASOS_NOMINA.indexOf(pasoActual);
  if (indice <= 0) return null;
  return ORDEN_PASOS_NOMINA[indice - 1] ?? null;
}

/**
 * Consulta pura de "completitud" del paso activo. Devuelve `{ok:true}` si el
 * paso considera que puede avanzar (es decir, su contenido está poblado
 * correctamente según el criterio UI del paso). Si el paso no expone comando
 * (`parameters`, que sigue rama propia), se asume `ok:true` y la rama de
 * parámetros gestiona su propio bloqueo vía `accesoBaseService`.
 */
export function puedeContinuarPaso(paso: PasoNominaPort | null): ResultadoAvancePaso {
  if (!paso) {
    return { ok: false, razon: 'No hay un paso activo.' };
  }
  return paso.puedeContinuar();
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
  return indiceUltimoPasoCompletadoPorEstado(nomina.estado);
}

/**
 * Variante por `estado` para callers que sólo tienen el resumen (sin segmentos
 * ni movimientos). Misma matriz que `indiceUltimoPasoCompletado` para evitar
 * derivas. Útil para validar accesibilidad del `ultimoPasoVisitado` al
 * rehidratar el container desde una cabecera ligera.
 */
export function indiceUltimoPasoCompletadoPorEstado(estado: EstadoNomina | null): number {
  if (!estado) return -1;
  switch (estado) {
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
    case 'liquidada':
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
 * Devuelve el índice del paso máximo al que el usuario PUEDE NAVEGAR según el
 * estado de la nómina. A diferencia de `indiceUltimoPasoCompletado`, este
 * incluye los pasos en curso (no completados) que están abiertos para
 * edición. Ejemplo: en `en_revision` el cálculo aún no se hizo pero el paso
 * `calculation` es accesible para iniciarlo.
 *
 * Se usa para validar `ultimoPasoVisitado` al rehidratar: si el paso visitado
 * excede este máximo, significa que la nómina retrocedió (p. ej. invalidación
 * de cálculo) y el paso ya no es alcanzable.
 */
export function indiceMaximoPasoAccesible(estado: EstadoNomina | null): number {
  if (!estado) return 0;
  switch (estado) {
    case 'borrador':
      return ORDEN_PASOS_NOMINA.indexOf('parameters');
    case 'dotacion_generada':
      return ORDEN_PASOS_NOMINA.indexOf('dotacion');
    case 'en_revision':
      return ORDEN_PASOS_NOMINA.indexOf('calculation');
    case 'calculada':
    case 'validada':
      return ORDEN_PASOS_NOMINA.indexOf('validation');
    case 'aprobada':
    case 'liquidada':
    case 'cerrada':
    case 'reabierta':
      return ORDEN_PASOS_NOMINA.indexOf('closure');
    case 'anulada':
      return -1;
  }
}

/**
 * Devuelve el índice máximo al que el usuario puede navegar combinando dos
 * gates:
 *
 *  1. Estado server-side: la matriz `indiceMaximoPasoAccesible(estado)`. Es
 *     el techo absoluto: si la nómina está en `borrador`, no hay forma de
 *     entrar a `dotacion` aunque el cliente lo crea.
 *  2. Contenido cliente: `indiceMaxCompletadoContenido`, el último paso que
 *     el cliente considera "poblado correctamente" según el criterio UI
 *     (`puedeContinuar()` de cada paso). El primer paso pendiente (max+1)
 *     está abierto para trabajar.
 *
 * El resultado es el mínimo de ambos: gana el más restrictivo. Si el
 * contenido aún no se completó, el techo cae para impedir saltarse pasos.
 */
export function indiceMaximoPasoAccesibleEfectivo(
  estado: EstadoNomina | null,
  indiceMaxCompletadoContenido: number,
): number {
  const techoEstado = indiceMaximoPasoAccesible(estado);
  if (techoEstado < 0) return techoEstado;
  // `indiceMaxCompletadoContenido` puede ser -1 cuando nada está completo
  // todavía; en ese caso el primer paso accesible es el `0` (parameters).
  const techoContenido = Math.max(0, indiceMaxCompletadoContenido + 1);
  return Math.min(techoEstado, techoContenido);
}

/**
 * Etiqueta breve por paso, pensada para tooltips y mensajes operativos
 * (versión recortada de `obtenerTituloPaso`, que produce títulos largos).
 */
export function obtenerEtiquetaBrevePaso(paso: PayrollStepId): string {
  switch (paso) {
    case 'parameters':
      return 'Parámetros';
    case 'dotacion':
      return 'Dotación';
    case 'movements':
      return 'Movimientos';
    case 'calculation':
      return 'Cálculo';
    case 'validation':
      return 'Validación';
    case 'closure':
      return 'Cierre';
  }
}

/**
 * Tooltip humano para un paso no accesible. Identifica el paso anterior que
 * el usuario debe completar para desbloquearlo. Si `stepId` es el primer
 * paso del flujo (sin anterior), devuelve un mensaje genérico.
 */
export function tooltipPasoNoAccesible(stepId: PayrollStepId): string {
  const indice = ORDEN_PASOS_NOMINA.indexOf(stepId);
  if (indice <= 0) {
    return 'Completa el paso actual para continuar.';
  }
  const anterior = ORDEN_PASOS_NOMINA[indice - 1];
  return `Completa ${obtenerEtiquetaBrevePaso(anterior)} para continuar.`;
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

export function esAvanceHaciaAdelante(
  pasoActual: PayrollStepId,
  destinoPaso: PayrollStepId,
): boolean {
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
