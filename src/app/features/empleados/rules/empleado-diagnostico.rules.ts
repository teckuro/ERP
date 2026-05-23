/**
 * Kernel de diagnóstico de empleado (ficha, alta, nomina, persistencia).
 * Punto de entrada unico sobre empleado-ficha-validacion.rules.
 */
export {
  evaluarDiagnosticoFichaEmpleado,
  snapshotValidacionDesdePayload,
  type EmpleadoFichaDiagnostico,
  type EmpleadoFichaValidacionItem,
  type EmpleadoFichaValidacionSeverity,
  type EmpleadoFichaValidacionTab,
  type EmpleadoFichaValidacionFormTab,
  type EmpleadoFichaValidacionSnapshot,
} from './empleado-ficha-validacion.rules';
