/**
 * Modelos centrales de Nómina mensual.
 *
 * Creados en `NOM-REBUILD-NOMINA-MENSUAL-01` (F1, 2026-06-03).
 *
 * Documento rector: `docs/codex/modulos/nomina-mensual/arquitectura-administrador-generador.md`.
 *
 * Arquitectura: Administrador (lista N nóminas) + Generador (1 nómina por id).
 * - El Administrador consume `NominaPeriodoResumen[]` (solo resúmenes).
 * - El Generador consume `NominaPeriodo` (la nómina completa).
 * - La grilla de Dotación consume `FilaTrabajadorNominaResumen[]` (sin detalle).
 * - El detalle completo se carga bajo demanda como `DetalleTrabajadorNomina`.
 *
 * Compartido entre `nomina-mensual/` (Admin) y `nomina-mensual-v2/` (Generador).
 */

import type { MovimientoNomina } from './movimiento-nomina.models';

export type EstadoNomina =
  | 'borrador'
  | 'dotacion_generada'
  | 'en_revision'
  | 'calculada'
  | 'validada'
  | 'aprobada'
  | 'cerrada'
  | 'reabierta'
  | 'anulada';

export type TipoNomina = 'mensual' | 'quincenal' | 'semanal' | 'extraordinaria';

/**
 * Resumen que carga el Administrador (bandeja de nóminas).
 *
 * Solo totales + estado + fechas — sin detalle. Diseñado para escalar a
 * cientos de nóminas listadas sin penalizar la carga.
 */
export interface NominaPeriodoResumen {
  id: string;
  periodo: string;
  empresaId: string;
  empresaNombre: string;

  tipo: TipoNomina;
  estado: EstadoNomina;

  totalTrabajadores: number;
  totalSegmentos: number;
  totalHaberes: number;
  totalDescuentos: number;
  totalLiquido: number;

  totalIncidenciasCriticas: number;
  totalAdvertencias: number;

  fechaPago?: string;

  createdAt: string;
  updatedAt: string;
  closedAt?: string;
}

/**
 * La nómina completa que carga el Generador para 1 `nominaPeriodoId`.
 *
 * Incluye segmentos, movimientos, incidencias y trazabilidad de eventos.
 * El detalle por trabajador NO vive aquí: se carga bajo demanda con
 * `obtenerDetalleTrabajador(nominaPeriodoId, trabajadorId)`.
 */
export interface NominaPeriodo {
  id: string;
  periodo: string;
  empresaId: string;
  empresaNombre: string;

  tipo: TipoNomina;
  estado: EstadoNomina;

  segmentos: SegmentoNomina[];
  movimientos: MovimientoNomina[];
  incidencias: IncidenciaNomina[];

  trabajadorIds: string[];

  totalHaberes: number;
  totalDescuentos: number;
  totalLiquido: number;

  fechaPago?: string;

  eventosAuditoria?: EventoAuditoriaNomina[];

  createdAt: string;
  updatedAt: string;
  closedAt?: string;
}

/**
 * Grupo operativo dentro de una nómina. Reemplaza la idea de "Sub-base".
 *
 * Un trabajador NO puede estar duplicado en >1 segmento activo del mismo
 * período (regla bloqueante, validada por `validarDuplicidadTrabajadorSegmento`).
 * Antes del cálculo, los segmentos se consolidan en un único `ResultadoAlcanceNomina`.
 */
export interface SegmentoNomina {
  id: string;
  nominaPeriodoId: string;
  nombre: string;

  tipo?: 'planta' | 'honorarios' | 'centro_costo' | 'personalizada';

  trabajadorIds: string[];

  estado: 'borrador' | 'lista' | 'bloqueada';

  totalTrabajadores: number;
  totalIncidenciasCriticas: number;
  totalAdvertencias: number;

  ordinal: number;

  createdAt: string;
  updatedAt: string;
}

export interface IncidenciaNomina {
  id: string;
  nominaPeriodoId: string;

  severidad: 'critica' | 'advertencia' | 'informativa';
  tipo: string;
  mensaje: string;

  trabajadorId?: string;
  segmentoId?: string;

  bloqueante: boolean;
}

/**
 * Resumen pre-cálculo y pre-cierre.
 *
 * Doble guardia:
 * - `puedeCalcular === false` si hay al menos 1 incidencia bloqueante.
 * - `puedeCerrar === false` si hay al menos 1 incidencia bloqueante.
 *
 * Las advertencias permiten continuar pero quedan visibles.
 */
export interface ResumenValidacionNomina {
  totalTrabajadores: number;
  listosParaCalculo: number;
  conIncidenciasCriticas: number;
  conAdvertencias: number;
  conMovimientosEspeciales: number;

  puedeCalcular: boolean;
  puedeCerrar: boolean;

  incidenciasCriticas: IncidenciaNomina[];
  advertencias: IncidenciaNomina[];
}

export type EstadoTrabajadorNomina =
  | 'listo'
  | 'advertencia'
  | 'critico'
  | 'editado'
  | 'omitido'
  | 'bloqueado';

/**
 * Lo que carga la grilla de Dotación.
 *
 * Campos resumidos + contadores, SIN detalle. Diseñado para escalar a miles
 * de trabajadores con paginación y filtros del lado servidor (cuando se
 * conecte productivo).
 */
export interface FilaTrabajadorNominaResumen {
  trabajadorId: string;
  nombre: string;
  rut: string;

  cargo?: string;
  centroCosto?: string;
  segmentoId?: string;

  estado: EstadoTrabajadorNomina;

  totalIncidenciasCriticas: number;
  totalAdvertencias: number;
  totalMovimientos: number;

  tieneDatosBancarios: boolean;
  tieneDatosPrevisionales: boolean;
}

/**
 * Detalle completo de 1 trabajador. Se carga bajo demanda al abrir fila /
 * modal / drawer. NUNCA se carga junto a la grilla.
 */
export interface DetalleTrabajadorNomina {
  trabajadorId: string;

  contrato?: unknown;
  datosBancarios?: unknown;
  datosPrevisionales?: unknown;

  movimientos: MovimientoNomina[];
  incidencias: IncidenciaNomina[];
}

export interface FiltroRapidoDotacion {
  estado?: EstadoTrabajadorNomina;
  segmentoId?: string;
  conIncidencias?: boolean;
  conMovimientos?: boolean;
  busqueda?: string;
}

export interface PaginacionGrilla {
  page: number;
  pageSize: number;
  total: number;
}

/**
 * Trazabilidad de eventos críticos sobre la nómina (cierre, reapertura, etc.).
 *
 * Declarado en F1 como TODO para reservar el campo en `NominaPeriodo`.
 * La emisión real (registro automático al disparar la acción) se implementa
 * en F2 (Administrador) + F3 (Generador) cuando existan las UI.
 *
 * Sin trazabilidad, cerrar/reabrir nóminas es peligroso porque pierde la razón
 * de la decisión.
 */
export interface EventoAuditoriaNomina {
  id: string;
  nominaPeriodoId: string;

  accion:
    | 'creada'
    | 'calculada'
    | 'validada'
    | 'aprobada'
    | 'cerrada'
    | 'reabierta'
    | 'anulada';

  usuarioId?: string;
  motivo?: string;

  createdAt: string;
}

// ---------------------------------------------------------------------------
// Helpers de creación (factories puras para tests y stories).
// ---------------------------------------------------------------------------

/** Crea un `NominaPeriodoResumen` con valores por defecto razonables. */
export function crearNominaResumen(
  overrides: Partial<NominaPeriodoResumen> = {},
): NominaPeriodoResumen {
  const ahora = new Date().toISOString();
  return {
    id: 'nom-mock-001',
    periodo: '2026-06',
    empresaId: 'emp-001',
    empresaNombre: 'Empresa de prueba',
    tipo: 'mensual',
    estado: 'dotacion_generada',
    totalTrabajadores: 0,
    totalSegmentos: 0,
    totalHaberes: 0,
    totalDescuentos: 0,
    totalLiquido: 0,
    totalIncidenciasCriticas: 0,
    totalAdvertencias: 0,
    createdAt: ahora,
    updatedAt: ahora,
    ...overrides,
  };
}

/**
 * Crea un `NominaPeriodo` con estado inicial `dotacion_generada`.
 *
 * Estado inicial: la dotación ya se generó automáticamente desde trabajadores
 * activos. El usuario aún no la revisó (`en_revision`) ni la calculó.
 */
export function crearNomina(overrides: Partial<NominaPeriodo> = {}): NominaPeriodo {
  const ahora = new Date().toISOString();
  return {
    id: 'nom-mock-001',
    periodo: '2026-06',
    empresaId: 'emp-001',
    empresaNombre: 'Empresa de prueba',
    tipo: 'mensual',
    estado: 'dotacion_generada',
    segmentos: [],
    movimientos: [],
    incidencias: [],
    trabajadorIds: [],
    totalHaberes: 0,
    totalDescuentos: 0,
    totalLiquido: 0,
    createdAt: ahora,
    updatedAt: ahora,
    ...overrides,
  };
}

/** Crea un `SegmentoNomina` con ordinal calculado o explícito. */
export function crearSegmento(
  overrides: Partial<SegmentoNomina> & { nominaPeriodoId: string } = {
    nominaPeriodoId: 'nom-mock-001',
  },
): SegmentoNomina {
  const ahora = new Date().toISOString();
  const trabajadorIds = overrides.trabajadorIds ?? [];
  return {
    id: 'seg-mock-001',
    nombre: 'Planta',
    tipo: 'planta',
    estado: 'borrador',
    totalIncidenciasCriticas: 0,
    totalAdvertencias: 0,
    ordinal: 1,
    createdAt: ahora,
    updatedAt: ahora,
    ...overrides,
    trabajadorIds,
    totalTrabajadores: trabajadorIds.length,
  };
}

/**
 * Agrega un trabajador a un segmento, rechazando si ya está en otro segmento
 * activo del mismo período (regla bloqueante de duplicidad).
 *
 * @returns `true` si se agregó. `false` si fue rechazado por duplicidad.
 */
export function agregarTrabajadorASegmento(
  nomina: NominaPeriodo,
  segmentoId: string,
  trabajadorId: string,
): boolean {
  const yaEnOtroSegmento = nomina.segmentos.some(
    (s) => s.id !== segmentoId && s.trabajadorIds.includes(trabajadorId),
  );
  if (yaEnOtroSegmento) {
    return false;
  }
  const segmento = nomina.segmentos.find((s) => s.id === segmentoId);
  if (!segmento) {
    return false;
  }
  if (segmento.trabajadorIds.includes(trabajadorId)) {
    return true;
  }
  segmento.trabajadorIds.push(trabajadorId);
  segmento.totalTrabajadores = segmento.trabajadorIds.length;
  return true;
}

/**
 * Mueve un trabajador de un segmento a otro dentro de la misma nómina,
 * preservando sus movimientos del período (los movimientos solo cambian
 * de `segmentoId`, no se eliminan).
 *
 * @returns `true` si se movió, `false` si origen o destino no existen.
 */
export function moverTrabajadorEntreSegmentos(
  nomina: NominaPeriodo,
  trabajadorId: string,
  segmentoDestinoId: string,
): boolean {
  const destino = nomina.segmentos.find((s) => s.id === segmentoDestinoId);
  if (!destino) {
    return false;
  }
  const origen = nomina.segmentos.find(
    (s) => s.id !== segmentoDestinoId && s.trabajadorIds.includes(trabajadorId),
  );
  if (!origen) {
    return false;
  }
  origen.trabajadorIds = origen.trabajadorIds.filter((id) => id !== trabajadorId);
  origen.totalTrabajadores = origen.trabajadorIds.length;
  if (!destino.trabajadorIds.includes(trabajadorId)) {
    destino.trabajadorIds.push(trabajadorId);
    destino.totalTrabajadores = destino.trabajadorIds.length;
  }
  for (const mov of nomina.movimientos) {
    if (mov.trabajadorId === trabajadorId) {
      mov.segmentoId = segmentoDestinoId;
    }
  }
  return true;
}
