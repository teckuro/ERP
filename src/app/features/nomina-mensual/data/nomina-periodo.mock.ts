/**
 * Datos mock de F1 (NOM-REBUILD-NOMINA-MENSUAL-01).
 *
 * Uso permitido: tests vitest, stories (futuro), adapters mock, UI temporal F2-F5
 * mientras no exista persistencia productiva conectada.
 *
 * NO importar desde servicios productivos definitivos, repositorios reales,
 * motor de cálculo ni flujos productivos. En F7 (limpieza) se reevalúa qué
 * mocks se mantienen como fixtures de test.
 *
 * Documento rector: `docs/codex/modulos/nomina-mensual/arquitectura-administrador-generador.md`.
 */

import type {
  DetalleTrabajadorNomina,
  FilaTrabajadorNominaResumen,
  IncidenciaNomina,
  NominaPeriodo,
  NominaPeriodoResumen,
  SegmentoNomina,
} from '../models/nomina-periodo.models';
import type {
  MovimientoNomina,
  MovimientoRecurrente,
} from '../models/movimiento-nomina.models';

const FECHA_BASE = '2026-06-01T08:00:00.000Z';
const FECHA_ACTUALIZACION = '2026-06-03T18:00:00.000Z';

// ---------------------------------------------------------------------------
// Resúmenes para el Administrador.
// ---------------------------------------------------------------------------

export const NOMINAS_PERIODO_MOCK: NominaPeriodoResumen[] = [
  {
    id: 'nom-2026-06-001',
    periodo: '2026-06',
    empresaId: 'emp-001',
    empresaNombre: 'Constructora Andes Ltda.',
    tipo: 'mensual',
    estado: 'dotacion_generada',
    totalTrabajadores: 24,
    totalSegmentos: 3,
    totalHaberes: 0,
    totalDescuentos: 0,
    totalLiquido: 0,
    totalIncidenciasCriticas: 2,
    totalAdvertencias: 5,
    createdAt: FECHA_BASE,
    updatedAt: FECHA_ACTUALIZACION,
  },
  {
    id: 'nom-2026-05-001',
    periodo: '2026-05',
    empresaId: 'emp-001',
    empresaNombre: 'Constructora Andes Ltda.',
    tipo: 'mensual',
    estado: 'cerrada',
    totalTrabajadores: 22,
    totalSegmentos: 2,
    totalHaberes: 18450000,
    totalDescuentos: 5340000,
    totalLiquido: 13110000,
    totalIncidenciasCriticas: 0,
    totalAdvertencias: 1,
    fechaPago: '2026-05-30',
    createdAt: '2026-05-01T08:00:00.000Z',
    updatedAt: '2026-05-30T18:00:00.000Z',
    closedAt: '2026-05-30T18:00:00.000Z',
  },
  {
    id: 'nom-2026-04-001',
    periodo: '2026-04',
    empresaId: 'emp-001',
    empresaNombre: 'Constructora Andes Ltda.',
    tipo: 'mensual',
    estado: 'aprobada',
    totalTrabajadores: 21,
    totalSegmentos: 2,
    totalHaberes: 17800000,
    totalDescuentos: 5100000,
    totalLiquido: 12700000,
    totalIncidenciasCriticas: 0,
    totalAdvertencias: 0,
    fechaPago: '2026-04-30',
    createdAt: '2026-04-01T08:00:00.000Z',
    updatedAt: '2026-04-30T18:00:00.000Z',
  },
  {
    id: 'nom-2026-05-002',
    periodo: '2026-05',
    empresaId: 'emp-001',
    empresaNombre: 'Constructora Andes Ltda.',
    tipo: 'extraordinaria',
    estado: 'calculada',
    totalTrabajadores: 5,
    totalSegmentos: 1,
    totalHaberes: 850000,
    totalDescuentos: 90000,
    totalLiquido: 760000,
    totalIncidenciasCriticas: 0,
    totalAdvertencias: 0,
    createdAt: '2026-05-20T08:00:00.000Z',
    updatedAt: '2026-05-22T18:00:00.000Z',
  },
  {
    id: 'nom-2026-06-002',
    periodo: '2026-06',
    empresaId: 'emp-002',
    empresaNombre: 'Servicios Logística Ltda.',
    tipo: 'mensual',
    estado: 'borrador',
    totalTrabajadores: 0,
    totalSegmentos: 0,
    totalHaberes: 0,
    totalDescuentos: 0,
    totalLiquido: 0,
    totalIncidenciasCriticas: 0,
    totalAdvertencias: 0,
    createdAt: FECHA_ACTUALIZACION,
    updatedAt: FECHA_ACTUALIZACION,
  },
];

// ---------------------------------------------------------------------------
// Segmentos de la nómina principal `nom-2026-06-001`.
// ---------------------------------------------------------------------------

const TRABAJADORES_PLANTA = Array.from({ length: 14 }, (_, i) => `trab-${(i + 1).toString().padStart(3, '0')}`);
const TRABAJADORES_HONORARIOS = Array.from({ length: 6 }, (_, i) => `trab-${(i + 15).toString().padStart(3, '0')}`);
const TRABAJADORES_PROYECTO = Array.from({ length: 4 }, (_, i) => `trab-${(i + 21).toString().padStart(3, '0')}`);

export const SEGMENTOS_MOCK: SegmentoNomina[] = [
  {
    id: 'seg-001',
    nominaPeriodoId: 'nom-2026-06-001',
    nombre: 'Planta',
    tipo: 'planta',
    trabajadorIds: [...TRABAJADORES_PLANTA],
    estado: 'borrador',
    totalTrabajadores: TRABAJADORES_PLANTA.length,
    totalIncidenciasCriticas: 1,
    totalAdvertencias: 3,
    ordinal: 1,
    createdAt: FECHA_BASE,
    updatedAt: FECHA_ACTUALIZACION,
  },
  {
    id: 'seg-002',
    nominaPeriodoId: 'nom-2026-06-001',
    nombre: 'Honorarios',
    tipo: 'honorarios',
    trabajadorIds: [...TRABAJADORES_HONORARIOS],
    estado: 'borrador',
    totalTrabajadores: TRABAJADORES_HONORARIOS.length,
    totalIncidenciasCriticas: 1,
    totalAdvertencias: 1,
    ordinal: 2,
    createdAt: FECHA_BASE,
    updatedAt: FECHA_ACTUALIZACION,
  },
  {
    id: 'seg-003',
    nominaPeriodoId: 'nom-2026-06-001',
    nombre: 'Proyecto Antofagasta',
    tipo: 'personalizada',
    trabajadorIds: [...TRABAJADORES_PROYECTO],
    estado: 'borrador',
    totalTrabajadores: TRABAJADORES_PROYECTO.length,
    totalIncidenciasCriticas: 0,
    totalAdvertencias: 1,
    ordinal: 3,
    createdAt: FECHA_BASE,
    updatedAt: FECHA_ACTUALIZACION,
  },
];

// ---------------------------------------------------------------------------
// Recurrentes — uno por cada criterio de segmentación (para tests 9-14).
// ---------------------------------------------------------------------------

export const MOVIMIENTOS_RECURRENTES_MOCK: MovimientoRecurrente[] = [
  {
    id: 'rec-001',
    empresaId: 'emp-001',
    trabajadorId: 'trab-001',
    tipo: 'bono-gerencia',
    categoria: 'haber',
    monto: 250000,
    unidad: 'pesos',
    frecuencia: 'mensual',
    activoDesde: '2026-01-01',
    estado: 'activo',
    glosa: 'Bono permanencia gerencia',
    createdAt: FECHA_BASE,
    updatedAt: FECHA_BASE,
  },
  {
    id: 'rec-002',
    empresaId: 'emp-001',
    segmentoId: 'seg-002',
    tipo: 'descuento-mutual',
    categoria: 'descuento',
    monto: 15000,
    unidad: 'pesos',
    frecuencia: 'mensual',
    activoDesde: '2026-01-01',
    estado: 'activo',
    glosa: 'Aporte mutual honorarios',
    createdAt: FECHA_BASE,
    updatedAt: FECHA_BASE,
  },
  {
    id: 'rec-003',
    empresaId: 'emp-001',
    centroCostoId: 'cc-norte',
    tipo: 'asignacion-zona',
    categoria: 'haber',
    monto: 80000,
    unidad: 'pesos',
    frecuencia: 'mensual',
    activoDesde: '2026-01-01',
    estado: 'activo',
    glosa: 'Asignación de zona norte',
    createdAt: FECHA_BASE,
    updatedAt: FECHA_BASE,
  },
  {
    id: 'rec-004',
    empresaId: 'emp-001',
    cargoId: 'cargo-supervisor',
    tipo: 'asignacion-supervision',
    categoria: 'haber',
    monto: 120000,
    unidad: 'pesos',
    frecuencia: 'mensual',
    activoDesde: '2026-01-01',
    estado: 'activo',
    glosa: 'Asignación supervisión',
    createdAt: FECHA_BASE,
    updatedAt: FECHA_BASE,
  },
  {
    id: 'rec-005',
    empresaId: 'emp-001',
    tipoContratoId: 'contrato-plazo-fijo',
    tipo: 'gratificacion-art50',
    categoria: 'haber',
    monto: 100000,
    unidad: 'pesos',
    frecuencia: 'mensual',
    activoDesde: '2026-01-01',
    estado: 'activo',
    glosa: 'Gratificación art. 50',
    createdAt: FECHA_BASE,
    updatedAt: FECHA_BASE,
  },
  {
    id: 'rec-006',
    empresaId: 'emp-001',
    grupoId: 'grupo-sindicato',
    tipo: 'descuento-sindical',
    categoria: 'descuento',
    monto: 10000,
    unidad: 'pesos',
    frecuencia: 'mensual',
    activoDesde: '2026-01-01',
    estado: 'activo',
    glosa: 'Cuota sindical mensual',
    createdAt: FECHA_BASE,
    updatedAt: FECHA_BASE,
  },
];

// ---------------------------------------------------------------------------
// Movimientos ya aplicados / manuales / omitidos en la nómina principal.
// ---------------------------------------------------------------------------

export const MOVIMIENTOS_NOMINA_MOCK: MovimientoNomina[] = [
  {
    id: 'mov-001',
    nominaPeriodoId: 'nom-2026-06-001',
    trabajadorId: 'trab-001',
    segmentoId: 'seg-001',
    tipo: 'bono-gerencia',
    categoria: 'haber',
    monto: 250000,
    unidad: 'pesos',
    origen: 'recurrente',
    recurrenteId: 'rec-001',
    estado: 'aplicado',
    glosa: 'Bono permanencia gerencia',
    createdAt: FECHA_ACTUALIZACION,
    updatedAt: FECHA_ACTUALIZACION,
  },
  {
    id: 'mov-002',
    nominaPeriodoId: 'nom-2026-06-001',
    trabajadorId: 'trab-002',
    segmentoId: 'seg-001',
    tipo: 'horas-extra',
    categoria: 'haber',
    cantidad: 12,
    unidad: 'horas',
    origen: 'manual',
    estado: 'aplicado',
    glosa: 'Horas extras mayo',
    createdAt: FECHA_ACTUALIZACION,
    updatedAt: FECHA_ACTUALIZACION,
  },
  {
    id: 'mov-003',
    nominaPeriodoId: 'nom-2026-06-001',
    trabajadorId: 'trab-003',
    segmentoId: 'seg-001',
    tipo: 'descuento-mutual',
    categoria: 'descuento',
    monto: 15000,
    unidad: 'pesos',
    origen: 'recurrente',
    recurrenteId: 'rec-002',
    estado: 'omitido',
    glosa: 'Omitido manualmente este mes',
    createdAt: FECHA_ACTUALIZACION,
    updatedAt: FECHA_ACTUALIZACION,
  },
];

// ---------------------------------------------------------------------------
// Incidencias mezcla críticas / advertencias / informativas.
// ---------------------------------------------------------------------------

export const INCIDENCIAS_MOCK: IncidenciaNomina[] = [
  {
    id: 'inc-001',
    nominaPeriodoId: 'nom-2026-06-001',
    severidad: 'critica',
    tipo: 'datos-bancarios-incompletos',
    mensaje: 'Datos bancarios incompletos',
    trabajadorId: 'trab-005',
    segmentoId: 'seg-001',
    bloqueante: true,
  },
  {
    id: 'inc-002',
    nominaPeriodoId: 'nom-2026-06-001',
    severidad: 'critica',
    tipo: 'contrato-vencido',
    mensaje: 'Contrato a plazo fijo vencido sin renovación',
    trabajadorId: 'trab-017',
    segmentoId: 'seg-002',
    bloqueante: true,
  },
  {
    id: 'inc-003',
    nominaPeriodoId: 'nom-2026-06-001',
    severidad: 'advertencia',
    tipo: 'sin-afp',
    mensaje: 'AFP no asignada — revisar',
    trabajadorId: 'trab-008',
    segmentoId: 'seg-001',
    bloqueante: false,
  },
  {
    id: 'inc-004',
    nominaPeriodoId: 'nom-2026-06-001',
    severidad: 'advertencia',
    tipo: 'sin-centro-costo',
    mensaje: 'Centro de costo no definido',
    trabajadorId: 'trab-021',
    segmentoId: 'seg-003',
    bloqueante: false,
  },
  {
    id: 'inc-005',
    nominaPeriodoId: 'nom-2026-06-001',
    severidad: 'advertencia',
    tipo: 'jornada-sin-definir',
    mensaje: 'Jornada sin definir',
    trabajadorId: 'trab-009',
    segmentoId: 'seg-001',
    bloqueante: false,
  },
  {
    id: 'inc-006',
    nominaPeriodoId: 'nom-2026-06-001',
    severidad: 'advertencia',
    tipo: 'documentacion-incompleta',
    mensaje: 'Documentación incompleta',
    trabajadorId: 'trab-018',
    segmentoId: 'seg-002',
    bloqueante: false,
  },
  {
    id: 'inc-007',
    nominaPeriodoId: 'nom-2026-06-001',
    severidad: 'advertencia',
    tipo: 'estado-nomina-observado',
    mensaje: 'Estado de nómina observado por revisión RRHH',
    trabajadorId: 'trab-011',
    segmentoId: 'seg-001',
    bloqueante: false,
  },
  {
    id: 'inc-008',
    nominaPeriodoId: 'nom-2026-06-001',
    severidad: 'informativa',
    tipo: 'feriado-en-periodo',
    mensaje: 'Hay feriado en el período — revisar horas',
    bloqueante: false,
  },
];

// ---------------------------------------------------------------------------
// Dotación: 24 filas resumen para validar paginación.
// ---------------------------------------------------------------------------

function buildFilaTrabajador(
  i: number,
  overrides: Partial<FilaTrabajadorNominaResumen> = {},
): FilaTrabajadorNominaResumen {
  const trabajadorId = `trab-${i.toString().padStart(3, '0')}`;
  let segmentoId: string;
  if (i <= 14) segmentoId = 'seg-001';
  else if (i <= 20) segmentoId = 'seg-002';
  else segmentoId = 'seg-003';

  return {
    trabajadorId,
    nombre: `Trabajador ${i.toString().padStart(3, '0')}`,
    rut: `1${i.toString().padStart(7, '0')}-K`,
    cargo: i <= 14 ? 'Operario' : i <= 20 ? 'Profesional honorarios' : 'Supervisor obra',
    centroCosto: i <= 14 ? 'cc-planta' : i <= 20 ? 'cc-administracion' : 'cc-norte',
    segmentoId,
    estado: 'listo',
    totalIncidenciasCriticas: 0,
    totalAdvertencias: 0,
    totalMovimientos: 0,
    tieneDatosBancarios: true,
    tieneDatosPrevisionales: true,
    ...overrides,
  };
}

export const DOTACION_MOCK: FilaTrabajadorNominaResumen[] = Array.from({ length: 24 }, (_, idx) => {
  const i = idx + 1;
  const base = buildFilaTrabajador(i);

  if (i === 1) {
    return { ...base, totalMovimientos: 1, estado: 'editado' };
  }
  if (i === 2) {
    return { ...base, totalMovimientos: 1, estado: 'editado' };
  }
  if (i === 5) {
    return {
      ...base,
      tieneDatosBancarios: false,
      totalIncidenciasCriticas: 1,
      estado: 'critico',
    };
  }
  if (i === 17) {
    return { ...base, totalIncidenciasCriticas: 1, estado: 'critico' };
  }
  if (i === 3) {
    return { ...base, totalMovimientos: 1, estado: 'omitido' };
  }
  if (i === 8 || i === 9 || i === 11) {
    return { ...base, totalAdvertencias: 1, estado: 'advertencia' };
  }
  if (i === 18 || i === 21) {
    return { ...base, totalAdvertencias: 1, estado: 'advertencia' };
  }
  return base;
});

// ---------------------------------------------------------------------------
// Detalle por trabajador — bajo demanda.
// ---------------------------------------------------------------------------

export const DETALLES_TRABAJADORES_MOCK: Record<string, DetalleTrabajadorNomina> = {
  'trab-001': {
    trabajadorId: 'trab-001',
    contrato: { tipo: 'indefinido', fechaInicio: '2022-03-01' },
    datosBancarios: { banco: 'Banco Estado', cuenta: '****-1234' },
    datosPrevisionales: { afp: 'Modelo', salud: 'Fonasa' },
    movimientos: MOVIMIENTOS_NOMINA_MOCK.filter((m) => m.trabajadorId === 'trab-001'),
    incidencias: INCIDENCIAS_MOCK.filter((i) => i.trabajadorId === 'trab-001'),
  },
  'trab-005': {
    trabajadorId: 'trab-005',
    contrato: { tipo: 'indefinido', fechaInicio: '2023-07-15' },
    datosBancarios: undefined,
    datosPrevisionales: { afp: 'Modelo', salud: 'Fonasa' },
    movimientos: [],
    incidencias: INCIDENCIAS_MOCK.filter((i) => i.trabajadorId === 'trab-005'),
  },
  'trab-017': {
    trabajadorId: 'trab-017',
    contrato: { tipo: 'plazo-fijo', fechaInicio: '2025-12-01', fechaTermino: '2026-05-31' },
    datosBancarios: { banco: 'BancoEstado', cuenta: '****-9999' },
    datosPrevisionales: { afp: 'Habitat', salud: 'Banmédica' },
    movimientos: [],
    incidencias: INCIDENCIAS_MOCK.filter((i) => i.trabajadorId === 'trab-017'),
  },
};

// ---------------------------------------------------------------------------
// Nómina completa armada — el adapter la usa para `consolidarSegmentosParaCalculo`,
// `obtenerResumenValidacionNomina`, etc.
// ---------------------------------------------------------------------------

export function construirNominaMockPrincipal(): NominaPeriodo {
  const resumen = NOMINAS_PERIODO_MOCK[0]!;
  return {
    id: resumen.id,
    periodo: resumen.periodo,
    empresaId: resumen.empresaId,
    empresaNombre: resumen.empresaNombre,
    tipo: resumen.tipo,
    estado: resumen.estado,
    segmentos: SEGMENTOS_MOCK.map((s) => ({
      ...s,
      trabajadorIds: [...s.trabajadorIds],
    })),
    movimientos: MOVIMIENTOS_NOMINA_MOCK.map((m) => ({ ...m })),
    incidencias: INCIDENCIAS_MOCK.map((i) => ({ ...i })),
    trabajadorIds: SEGMENTOS_MOCK.flatMap((s) => s.trabajadorIds),
    totalHaberes: 0,
    totalDescuentos: 0,
    totalLiquido: 0,
    createdAt: resumen.createdAt,
    updatedAt: resumen.updatedAt,
  };
}
