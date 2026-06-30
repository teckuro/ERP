/**
 * Stepper definitivo del Generador (NOM-REBUILD-NOMINA-MENSUAL-01 / F3 fusion).
 *
 * Reemplaza el set original de 8 pasos por 6 pasos:
 *   - `parameters`  → configuración previa al período.
 *   - `dotacion`    → unifica el antiguo `scope` + `employees`.
 *   - `movements`   → recurrentes y manuales aplicados a la nómina.
 *   - `calculation` → llama al motor V1 (proceso-mensual) y muestra snapshot.
 *   - `validation`  → resumen pre-cierre con guardias.
 *   - `closure`     → absorbe `approval` + `payslips` en un solo cierre.
 */
export type PayrollStepId =
  | 'parameters'
  | 'dotacion'
  | 'movements'
  | 'calculation'
  | 'validation'
  | 'closure';

export type TipoAlcanceNomina =
  | 'empresaCompleta'
  | 'grupo'
  | 'contrato'
  | 'seleccionManual';

export type EstadoAlcanceNomina =
  | 'sinConfigurar'
  | 'listo'
  | 'conAdvertencias'
  | 'bloqueado';

export interface ResumenAlcanceNomina {
  totalTrabajadores: number;
  trabajadoresIncluidos: number;
  trabajadoresExcluidos: number;
  trabajadoresBloqueados: number;
  trabajadoresConAdvertencias: number;
}

export interface ResultadoAlcanceNomina {
  tipo: TipoAlcanceNomina;
  estado: EstadoAlcanceNomina;
  descripcion: string;
  idsTrabajadoresIncluidos: string[];
  centrosCostoSeleccionados?: string[];
  idsTrabajadoresManuales?: string[];
  resumen: ResumenAlcanceNomina;
}

export type PayrollStepStatus = 'completed' | 'active' | 'pending' | 'blocked' | 'warning';

export type PayrollStep = {
  id: PayrollStepId;
  number: number;
  title: string;
  subtitle: string;
};
