/**
 * Utilidades de presentación del Administrador de Nóminas (F2).
 *
 * Mapeos puros estado → badge, tipo → label, fecha → texto humano y KPIs
 * operativos. Sin acceso al DOM ni a servicios; se testean en vitest.
 */

import type {
  EstadoNomina,
  NaturalezaNomina,
  NominaPeriodoResumen,
  TipoNomina,
} from '../../../models/nomina-periodo.models';
import type { PayrollStepId } from '../../../../nomina-mensual-v2/models/nomina-mensual-v2.models';

const ETIQUETA_PROXIMO_PASO: Record<string, string> = {
  parametros: 'Completar parámetros',
  dotacion: 'Revisar dotación',
  movimientos: 'Revisar movimientos',
  calculo: 'Calcular nómina',
  validacion: 'Resolver incidencias en cierre',
  cierre: 'Cerrar nómina',
  liquidaciones: 'Generar liquidaciones',
  sin_accion: 'Sin acción',
};

/**
 * Mapa de paso del flujo → nombre de icono lucide (kebab-case).
 *
 * Se usa en la celda "Siguiente acción" para reforzar visualmente la naturaleza
 * del paso sin agregar otra columna. Iconos registrados en `lucide/admin-nominas-lucide.icons.ts`
 * e integrados en `app.config.ts` vía `LucideAngularModule.pick`.
 */
const ICONO_PROXIMO_PASO: Record<string, string> = {
  parametros: 'settings',
  dotacion: 'users',
  movimientos: 'repeat',
  calculo: 'calculator',
  validacion: 'shield-check',
  cierre: 'lock',
  liquidaciones: 'receipt',
  sin_accion: 'minus',
};

export type AdminBadgeVariant = 'neutral' | 'info' | 'warning' | 'success' | 'danger';

export interface AdminBadgeView {
  label: string;
  variant: AdminBadgeVariant;
}

const MAPA_ESTADO: Record<EstadoNomina, AdminBadgeView> = {
  borrador: { label: 'Borrador', variant: 'neutral' },
  dotacion_generada: { label: 'Dotación lista', variant: 'info' },
  en_revision: { label: 'En revisión', variant: 'info' },
  calculada: { label: 'Calculada', variant: 'info' },
  validada: { label: 'Validada', variant: 'success' },
  aprobada: { label: 'Aprobada', variant: 'success' },
  liquidada: { label: 'Liquidada', variant: 'success' },
  cerrada: { label: 'Cerrada', variant: 'success' },
  reabierta: { label: 'Reabierta', variant: 'warning' },
  anulada: { label: 'Anulada', variant: 'danger' },
};

const MAPA_TIPO: Record<TipoNomina, string> = {
  mensual: 'Mensual',
  quincenal: 'Quincenal',
  semanal: 'Semanal',
  extraordinaria: 'Extraordinaria',
};

const MAPA_NATURALEZA: Record<NaturalezaNomina, string> = {
  liquidacion_legal: 'Liquidación legal',
  anticipo: 'Anticipo',
  pago_extraordinario: 'Pago extraordinario',
  rectificacion: 'Rectificación',
};

export function estadoNominaToBadge(estado: EstadoNomina): AdminBadgeView {
  return MAPA_ESTADO[estado];
}

export function tipoNominaToLabel(tipo: TipoNomina): string {
  return MAPA_TIPO[tipo];
}

export function naturalezaNominaToLabel(naturaleza: NaturalezaNomina): string {
  return MAPA_NATURALEZA[naturaleza];
}

/**
 * Meta compacta bajo el período cuando la nómina no es mensual legal estándar.
 * Ej.: "Rectificación", "Anticipo · Quincenal".
 */
export function etiquetaMetaNomina(fila: Pick<NominaPeriodoResumen, 'tipo' | 'naturaleza'>): string {
  const partes: string[] = [];
  if (fila.naturaleza !== 'liquidacion_legal') {
    partes.push(naturalezaNominaToLabel(fila.naturaleza));
  }
  if (fila.tipo !== 'mensual') {
    partes.push(tipoNominaToLabel(fila.tipo));
  }
  return partes.join(' · ');
}

/** Formato corto del rango legal para subtítulo de celda período. */
export function formatearRangoLegal(fechaInicio: string, fechaFin: string): string {
  const inicio = parseIsoLocal(fechaInicio);
  const fin = parseIsoLocal(fechaFin);
  if (!inicio || !fin) return '';

  const ddIni = inicio.dia.toString().padStart(2, '0');
  const mmIni = inicio.mes.toString().padStart(2, '0');
  const ddFin = fin.dia.toString().padStart(2, '0');
  const mmFin = fin.mes.toString().padStart(2, '0');

  if (inicio.anio === fin.anio) {
    if (inicio.mes === fin.mes) {
      return `${ddIni}–${ddFin}/${mmFin}/${fin.anio}`;
    }
    return `${ddIni}/${mmIni} – ${ddFin}/${mmFin}/${fin.anio}`;
  }
  return `${ddIni}/${mmIni}/${inicio.anio} – ${ddFin}/${mmFin}/${fin.anio}`;
}

function parseIsoLocal(iso: string): { dia: number; mes: number; anio: number } | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!match) return null;
  return {
    anio: Number(match[1]),
    mes: Number(match[2]),
    dia: Number(match[3]),
  };
}

export function proximoPasoToLabel(paso: NominaPeriodoResumen['proximoPaso']): string {
  return ETIQUETA_PROXIMO_PASO[paso ?? 'sin_accion'] ?? 'Continuar revisión';
}

/**
 * Nombre del icono lucide asociado al paso. Fallback `minus` si el paso no se
 * reconoce (estado defensivo para migraciones tardías).
 */
export function proximoPasoToIcon(paso: NominaPeriodoResumen['proximoPaso']): string {
  return ICONO_PROXIMO_PASO[paso ?? 'sin_accion'] ?? 'minus';
}

// ---------------------------------------------------------------------------
// Sub-renglón "Avance: X" (máximo paso completado dentro del Generador).
// ---------------------------------------------------------------------------

/**
 * Etiqueta humana administrativa para cada paso del Generador. Se usa en el
 * sub-renglón de la celda "Siguiente acción".
 */
const ETIQUETA_PASO_COMPLETADO: Record<PayrollStepId, string> = {
  parameters: 'Parámetros',
  dotacion: 'Dotación',
  movements: 'Movimientos',
  calculation: 'Cálculo',
  closure: 'Cierre',
};

/**
 * Mapeo `PayrollStepId` (canónico del Generador) → `PasoSiguienteNomina`
 * (etiqueta del próximo paso en la bandeja). Permite comparar si el paso
 * completado coincide con el paso anterior al próximo paso recomendado para
 * no mostrar redundancia.
 */
const STEP_A_PROXIMO: Record<PayrollStepId, NominaPeriodoResumen['proximoPaso']> = {
  parameters: 'parametros',
  dotacion: 'dotacion',
  movements: 'movimientos',
  calculation: 'calculo',
  closure: 'cierre',
};

/**
 * Devuelve la etiqueta humana del máximo paso completado. Cadena vacía si
 * es nulo, para que el binding no pinte nada (en lugar de mostrar
 * "Avance: ").
 */
export function etiquetaMaximoPasoCompletado(paso: PayrollStepId | null | undefined): string {
  if (!paso) return '';
  return ETIQUETA_PASO_COMPLETADO[paso] ?? '';
}

/**
 * Define si la fila debe mostrar el sub-renglón "Avance: X" en la celda
 * "Siguiente acción". Sólo se muestra cuando:
 *
 *  - La fila tiene `maximoPasoCompletado` registrado.
 *  - Ese paso no coincide con el `proximoPaso` derivado del estado (evita
 *    redundancia: si el próximo paso ya es "Cálculo" no agregamos
 *    "Avance: Cálculo").
 */
export function mostrarEnCurso(fila: NominaPeriodoResumen): boolean {
  const completado = fila.maximoPasoCompletado;
  if (!completado) return false;
  const equivalente = STEP_A_PROXIMO[completado];
  return equivalente !== fila.proximoPaso;
}

/**
 * Tooltip de la fila completa: combina avance máximo y resumen de
 * incidencias. Devuelve cadena vacía si no hay nada relevante para evitar
 * tooltips vacíos. NOIA-ADM-NOM-BANDEJA-02.
 */
export function tooltipAvanceFila(fila: NominaPeriodoResumen): string {
  const partes: string[] = [];
  if (mostrarEnCurso(fila)) {
    const avance = etiquetaMaximoPasoCompletado(fila.maximoPasoCompletado);
    if (avance) partes.push(`Avance: ${avance}`);
  }
  const desglose = desgloseIncidencias(fila);
  if (desglose) partes.push(desglose);
  return partes.join(' · ');
}

/**
 * Resumen humano de incidencias para tooltips, sin exponer enums.
 *
 * Devuelve cadena vacía si la fila no tiene ni críticas ni avisos, para no
 * mostrar un `title` redundante con la celda "Sin observaciones".
 */
export function desgloseIncidencias(fila: {
  totalIncidenciasCriticas: number;
  totalAdvertencias: number;
}): string {
  const criticas = fila.totalIncidenciasCriticas;
  const avisos = fila.totalAdvertencias;
  if (criticas === 0 && avisos === 0) return '';
  const partes: string[] = [];
  if (criticas > 0) {
    partes.push(`${criticas} crítica${criticas === 1 ? '' : 's'}`);
  }
  if (avisos > 0) {
    partes.push(`${avisos} aviso${avisos === 1 ? '' : 's'}`);
  }
  return partes.join(' · ');
}

/**
 * Formato humano de fecha de actualización. Si la fecha cae en el mismo día,
 * muestra "Hoy"; si fue ayer, "Ayer"; si fue dentro de la semana, "Hace N
 * días"; en otro caso, formato `dd/mm/yyyy`.
 */
export function formatearActualizada(iso: string | undefined, ahora: Date = new Date()): string {
  if (!iso) return '';
  const fecha = new Date(iso);
  if (Number.isNaN(fecha.getTime())) return '';

  const diffMs = ahora.getTime() - fecha.getTime();
  const diffDias = Math.floor(diffMs / (24 * 60 * 60 * 1000));

  if (diffDias <= 0) return 'Hoy';
  if (diffDias === 1) return 'Ayer';
  if (diffDias < 7) return `Hace ${diffDias} días`;

  const dia = fecha.getDate().toString().padStart(2, '0');
  const mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
  const anio = fecha.getFullYear();
  return `${dia}/${mes}/${anio}`;
}

/**
 * Fecha completa para tooltip: `dd/mm/yyyy HH:mm`. Devuelve cadena vacía si
 * el ISO es nulo o inválido, para que `[title]` no quede como tooltip vacío.
 */
export function formatearActualizadaCompleta(iso: string | undefined): string {
  if (!iso) return '';
  const fecha = new Date(iso);
  if (Number.isNaN(fecha.getTime())) return '';
  const dia = fecha.getDate().toString().padStart(2, '0');
  const mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
  const anio = fecha.getFullYear();
  const hh = fecha.getHours().toString().padStart(2, '0');
  const mm = fecha.getMinutes().toString().padStart(2, '0');
  return `${dia}/${mes}/${anio} ${hh}:${mm}`;
}

// ---------------------------------------------------------------------------
// KPIs operativos (sin cards decorativas, solo métricas contextuales)
// ---------------------------------------------------------------------------

export type KpiTone = 'neutral' | 'info' | 'warning' | 'danger' | 'success';

export interface KpiAdminItem {
  id: string;
  label: string;
  value: number;
  tone: KpiTone;
}

export interface KpisAdminNominas {
  total: number;
  abiertas: number;
  enCalculo: number;
  pendientesCierre: number;
  conCriticas: number;
  items: KpiAdminItem[];
}

/**
 * Estado "abierto" para el Administrador: cualquier estado que NO sea
 * `cerrada`, `aprobada` ni `anulada` (sigue requiriendo acción).
 */
function esAbierta(estado: EstadoNomina): boolean {
  return estado !== 'cerrada' && estado !== 'aprobada' && estado !== 'anulada';
}

export function calcularKpisAdminNominas(
  resumenes: readonly NominaPeriodoResumen[],
): KpisAdminNominas {
  const total = resumenes.length;
  const abiertas = resumenes.filter((r) => esAbierta(r.estado)).length;
  const enCalculo = resumenes.filter((r) => r.estado === 'calculada' || r.estado === 'validada').length;
  const pendientesCierre = resumenes.filter(
    (r) => r.estado === 'aprobada' || r.estado === 'liquidada' || r.estado === 'reabierta',
  ).length;
  const conCriticas = resumenes.filter((r) => r.totalIncidenciasCriticas > 0).length;

  const items: KpiAdminItem[] = [
    { id: 'abiertas', label: 'Abiertas', value: abiertas, tone: 'info' },
    { id: 'en-calculo', label: 'En cálculo', value: enCalculo, tone: 'neutral' },
    { id: 'pendientes-cierre', label: 'Pendientes de cierre', value: pendientesCierre, tone: 'warning' },
    { id: 'con-criticas', label: 'Con críticas', value: conCriticas, tone: conCriticas > 0 ? 'danger' : 'neutral' },
  ];

  return { total, abiertas, enCalculo, pendientesCierre, conCriticas, items };
}
