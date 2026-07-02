/**
 * Modelos de movimientos para Nómina mensual.
 *
 * Creados en `NOM-REBUILD-NOMINA-MENSUAL-01` (F1, 2026-06-03).
 *
 * Documento rector: `docs/codex/modulos/nomina-mensual/arquitectura-administrador-generador.md`.
 *
 * Separación clara:
 * - `MovimientoRecurrente` = regla permanente (vive en el catálogo de Recurrentes).
 * - `MovimientoNomina`     = movimiento aplicado a una nómina específica.
 *
 * Idempotencia de recurrentes: la clave lógica para detectar duplicación es
 * `nominaPeriodoId + trabajadorId + recurrenteId + tipo`. Si esa clave ya existe
 * con `estado='omitido'`, el sistema NO debe reaplicar el recurrente (respeta la
 * decisión manual del usuario).
 */

/**
 * Tipo de movimiento. Union string abierta — se cierra a un enum literal cuando
 * el módulo `Conceptos de remuneración` exponga su catálogo definitivo.
 */
export type MovimientoTipo = string;

export type MovimientoCategoria = 'haber' | 'descuento' | 'ausencia' | 'informativo';

export type MovimientoUnidad = 'pesos' | 'horas' | 'dias' | 'porcentaje';

export type MovimientoFrecuencia = 'mensual' | 'quincenal' | 'semanal';

export type EstadoMovimientoRecurrente = 'activo' | 'pausado' | 'finalizado';

export type EstadoMovimientoNomina =
  | 'borrador'
  | 'aplicado'
  | 'observado'
  | 'omitido'
  | 'anulado';

export type OrigenMovimientoNomina = 'manual' | 'recurrente' | 'importado' | 'sistema';

/**
 * Regla permanente que se aplica automáticamente a las nóminas mientras esté
 * activa. Se aplica al match de cualquiera de los criterios de segmentación
 * definidos: trabajador / segmento / centro de costo / cargo / tipo de contrato
 * / grupo.
 *
 * Si NO se define ningún criterio de segmentación, el recurrente aplica a TODOS
 * los trabajadores de la empresa (cuidado al definir).
 */
export interface MovimientoRecurrente {
  id: string;

  empresaId: string;

  trabajadorId?: string;
  segmentoId?: string;
  centroCostoId?: string;
  cargoId?: string;
  tipoContratoId?: string;
  grupoId?: string;

  tipo: MovimientoTipo;
  categoria: MovimientoCategoria;

  monto?: number;
  cantidad?: number;
  unidad?: MovimientoUnidad;

  frecuencia: MovimientoFrecuencia;

  activoDesde: string;
  activoHasta?: string;

  estado: EstadoMovimientoRecurrente;

  glosa?: string;

  createdAt: string;
  updatedAt: string;
}

/**
 * Movimiento aplicado a una nómina específica. Puede provenir de:
 * - `manual`: el usuario lo agregó manualmente este mes.
 * - `recurrente`: se aplicó automáticamente desde un `MovimientoRecurrente`
 *   activo. En este caso, `recurrenteId` apunta a la regla origen.
 * - `importado`: vino de una carga masiva (fase futura).
 * - `sistema`: lo generó el motor de cálculo o una regla automática.
 *
 * Estados:
 * - `borrador`: en construcción, no entra al cálculo.
 * - `aplicado`: vigente, entra al cálculo.
 * - `observado`: aplicado pero con advertencia.
 * - `omitido`: el usuario decidió omitirlo este mes. `aplicarRecurrentesANomina`
 *   NO debe reaplicarlo automáticamente.
 * - `anulado`: descartado del cálculo.
 */
export interface MovimientoNomina {
  id: string;

  nominaPeriodoId: string;
  trabajadorId: string;
  segmentoId?: string;

  tipo: MovimientoTipo;
  categoria: MovimientoCategoria;

  monto?: number;
  cantidad?: number;
  unidad?: MovimientoUnidad;

  origen: OrigenMovimientoNomina;
  recurrenteId?: string;

  estado: EstadoMovimientoNomina;

  fechaDesde?: string;
  fechaHasta?: string;

  glosa?: string;

  createdAt: string;
  updatedAt: string;
}

/**
 * Movimiento aún no existente en BD. La columna `id` la genera la propia
 * tabla (`default gen_random_uuid()`); el frontend nunca debe inventar un
 * UUID ni mandar `id: ''`. Usar este tipo en todas las rutas de inserción.
 */
export type MovimientoNominaNuevo = Omit<MovimientoNomina, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * Estado de una plantilla recurrente respecto a una nómina concreta.
 *
 * - `pendiente`: el recurrente aplica al trabajador pero aún NO se materializó
 *   en `movimiento_nomina` para este período. Cargable.
 * - `ya-cargado`: existe el `movimiento_nomina` correspondiente con
 *   `estado='aplicado'` (o `'observado'`). No se vuelve a cargar.
 * - `omitido-este-mes`: existe el `movimiento_nomina` con `estado='omitido'`.
 *   El usuario decidió no aplicarlo este mes — la idempotencia respeta esa
 *   decisión y NO lo reaplica.
 */
export type EstadoMovimientoConfiguradoEnNomina =
  | 'pendiente'
  | 'ya-cargado'
  | 'omitido-este-mes';

/**
 * Vista derivada para la grilla "Movimientos configurados" del paso Movimientos.
 *
 * Una fila representa un par `(trabajador × plantilla recurrente)` aplicable a
 * la nómina en curso. NO se persiste — se calcula on-the-fly cruzando los
 * recurrentes activos con la dotación y los movimientos del período. El
 * `filaId` se construye determinísticamente para soportar `trackBy` estable
 * en la grilla y el set de filas expandidas del data-grid.
 *
 * @deprecated Reemplazado por la vista por trabajador `FilaTrabajadorMovimientos`
 * + `ItemMovimientoTrabajador`. Conservado por compatibilidad temporal hasta
 * eliminar `listarMovimientosConfigurados`.
 */
export interface FilaMovimientoConfigurado {
  /** Identidad estable de la fila: `${trabajadorId}::${recurrenteId}::${tipo}`. */
  filaId: string;

  trabajadorId: string;
  trabajadorNombre: string;
  rut: string;
  cargo?: string;
  centroCosto?: string;

  recurrenteId: string;
  concepto: MovimientoTipo;
  categoria: MovimientoCategoria;
  monto?: number;
  cantidad?: number;
  unidad?: MovimientoUnidad;
  frecuencia: MovimientoFrecuencia;
  vigenciaDesde: string;
  vigenciaHasta?: string;
  glosa?: string;

  estadoEnNomina: EstadoMovimientoConfiguradoEnNomina;
  /**
   * Si la fila ya tiene un `movimiento_nomina` asociado (estados `ya-cargado`
   * y `omitido-este-mes`), apunta a su id. En `pendiente` es `undefined`.
   */
  movimientoNominaId?: string;
}

// -----------------------------------------------------------------------------
// Vista unificada del paso Movimientos (fila = trabajador)
// -----------------------------------------------------------------------------

/**
 * Origen lógico de un item del paso Movimientos.
 * - `configurado`: viene de un `MovimientoRecurrente` vigente cruzado con la
 *   dotación. Puede estar pendiente, aplicado u omitido este mes.
 * - `manual`: lo agregó el usuario manualmente este período. No tiene
 *   `recurrenteId`. No proviene del catálogo permanente.
 */
export type OrigenMovimientoTrabajador = 'configurado' | 'manual';

/**
 * Estado del item respecto a la nómina actual. Resume los 5 estados de
 * `MovimientoNomina` a los 3 que el usuario realmente debe ver:
 * - `pendiente`: configurado pero aún NO materializado en `movimiento_nomina`.
 * - `aplicado`: existe el `movimiento_nomina` con `estado='aplicado'` u
 *   `'observado'`. Entra al cálculo.
 * - `omitido`: existe el `movimiento_nomina` con `estado='omitido'`. NO entra
 *   al cálculo, no se reaplica automáticamente.
 */
export type EstadoItemMovimiento = 'pendiente' | 'aplicado' | 'omitido';

/**
 * Item individual del expandible de un trabajador en la grilla de Movimientos.
 *
 * Es la representación plana de un movimiento (configurado o manual) listo
 * para mostrar y operar fila a fila desde el detalle del trabajador.
 */
export interface ItemMovimientoTrabajador {
  /** Identidad estable del item (`trackBy`):
   *  - Configurado pendiente: `cfg::${trabajadorId}::${recurrenteId}::${tipo}`.
   *  - Materializado: `mov::${movimientoNominaId}`.
   */
  itemId: string;

  origen: OrigenMovimientoTrabajador;
  estado: EstadoItemMovimiento;

  /** Texto del concepto (codigo del catálogo legacy o etiqueta libre del manual). */
  concepto: MovimientoTipo;
  categoria: MovimientoCategoria;

  monto?: number;
  cantidad?: number;
  unidad?: MovimientoUnidad;

  /** Solo presente en items con origen `configurado`. */
  frecuencia?: MovimientoFrecuencia;
  vigenciaDesde?: string;
  vigenciaHasta?: string;

  glosa?: string;

  /** Referencia a la regla recurrente que originó el item (solo `configurado`). */
  recurrenteId?: string;
  /** Referencia al `movimiento_nomina`. `undefined` si el item está `pendiente`. */
  movimientoNominaId?: string;
}

/**
 * Fila principal de la grilla de Movimientos: agrega por trabajador los items
 * del período y precalcula los contadores que la UI muestra antes de expandir.
 *
 * Reglas de agregación (estables, ver tests):
 * - `totalHaberes` / `totalDescuentos`: suman SOLO items con `estado='aplicado'`
 *   y `monto != null`. Refleja "lo que ya entró al cálculo", no estimaciones.
 * - `cuentaAusencias` / `cuentaInformativos`: cuentan items con
 *   `estado != 'omitido'` (incluye pendientes y aplicados).
 * - Contadores por estado (`cuentaPendientes`, `cuentaAplicados`,
 *   `cuentaOmitidos`) cuentan TODOS los items del trabajador sin importar
 *   categoría — son la base de los badges y las acciones masivas.
 * - `cuentaManualesAplicados`: items con `origen='manual'` y
 *   `estado='aplicado'`. Útil para mostrar trazabilidad del trabajo manual.
 *
 * `items` viene ordenado: pendientes primero, luego aplicados, luego omitidos.
 */
export interface FilaTrabajadorMovimientos {
  trabajadorId: string;
  nombre: string;
  rut: string;
  cargo?: string;
  centroCosto?: string;

  totalHaberes: number;
  totalDescuentos: number;
  cuentaAusencias: number;
  cuentaInformativos: number;

  cuentaPendientes: number;
  cuentaAplicados: number;
  cuentaOmitidos: number;
  cuentaManualesAplicados: number;

  items: ItemMovimientoTrabajador[];

  /**
   * BKL-02 (paginación servidor): la fila llega agregada desde RPC sin items;
   * estos se hidratan al expandir vía `listarItemsMovimientosDeTrabajador`.
   * `undefined` = flujo legacy (items ya vienen); `false` = pendiente de cargar.
   */
  itemsCargados?: boolean;
  /** Total de items reportado por el servidor (para placeholder al expandir). */
  cuentaItems?: number;
}

/** Filtros del paso Movimientos resueltos en servidor (BKL-02). */
export interface FiltroMovimientosPorTrabajador {
  busqueda?: string;
  estado?: 'con-pendientes' | 'solo-aplicados' | 'con-omitidos';
  categoria?: 'con-haberes' | 'con-descuentos' | 'con-ausencias' | 'con-informativos';
}

/** Stats globales del paso Movimientos (RPC `resumen_movimientos_nomina`). */
export interface ResumenMovimientosNomina {
  trabajadoresConMovimientos: number;
  trabajadoresConPendientes: number;
  totalHaberes: number;
  totalDescuentos: number;
  totalPendientes: number;
  totalAplicados: number;
}

/**
 * Criterio para aplicar un recurrente sobre un subconjunto de trabajadores.
 *
 * Discriminated union por `tipo`. Usado por `aplicarRecurrentePorCriterio()`
 * desde acciones masivas o desde el módulo Recurrentes.
 *
 * Exhaustividad: cuando se agreguen criterios nuevos, TypeScript fuerza el
 * actualizar todos los `switch` que consumen este tipo.
 */
export type CriterioAplicacionRecurrente =
  | { tipo: 'trabajador'; trabajadorId: string }
  | { tipo: 'segmento'; segmentoId: string }
  | { tipo: 'centro-costo'; centroCostoId: string }
  | { tipo: 'cargo'; cargoId: string }
  | { tipo: 'tipo-contrato'; tipoContratoId: string }
  | { tipo: 'grupo'; grupoId: string };

/**
 * Acción masiva ejecutable sobre una selección de trabajadores en la grilla
 * de Dotación. Toda acción masiva pasa por `previsualizarAccionMasiva()` antes
 * de aplicarse (regla operativa NO opcional).
 */
export type AccionMasivaTrabajadores =
  | { tipo: 'agregar-movimiento'; movimiento: Partial<MovimientoNomina> }
  | { tipo: 'mover-segmento'; segmentoDestinoId: string }
  | { tipo: 'marcar-revisado' }
  | { tipo: 'excluir-nomina' };

/**
 * Previsualización obligatoria antes de aplicar una acción masiva.
 *
 * Indica: cuántos trabajadores se afectarán, monto total estimado (si aplica),
 * cuántos tienen críticas/advertencias entre los afectados, mensajes operativos
 * (`"Se aplicará a 47 trabajadores"`, `"3 tienen incidencias críticas"`, etc.) y
 * la guardia `puedeAplicar` (`false` si hay críticas bloqueantes).
 */
export interface PreviewAccionMasivaTrabajadores {
  accion: AccionMasivaTrabajadores;

  totalTrabajadoresAfectados: number;
  montoTotalEstimado?: number;

  totalIncidenciasCriticas: number;
  totalAdvertencias: number;

  mensajes: string[];
  puedeAplicar: boolean;
}
