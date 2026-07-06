import type { EventoTrazabilidadNomina } from '../models/nomina-trazabilidad.models';

/**
 * Datos demo opcionales. Solo se inyectan si el caller pasa
 * `incluirMockSiVacio: true` a `NominaMensualV2TrazabilidadService.recomputar`.
 * El flujo productivo (orquestador V2) nunca los solicita.
 */
export function buildEventosTrazabilidadMock(periodo: string): EventoTrazabilidadNomina[] {
  const base = `${periodo}-mock`;
  return [
    {
      idEvento: `${base}-calc`,
      periodo,
      paso: 'calculation',
      tipoEvento: 'CALCULO_EJECUTADO',
      usuarioId: null,
      usuarioNombre: 'RRHH Demo',
      fechaEvento: new Date(Date.now() - 3600000).toISOString(),
      descripcion: 'Resultado de cálculo generado (demo).',
      integridad: { estadoIntegridad: 'pendiente', fingerprintPublico: 'DEMO-CALC' },
      origen: 'mock',
    },
    {
      idEvento: `${base}-val`,
      periodo,
      paso: 'closure',
      tipoEvento: 'PRENOMINA_VALIDADA',
      usuarioId: null,
      usuarioNombre: 'RRHH',
      fechaEvento: new Date(Date.now() - 1800000).toISOString(),
      descripcion: 'Prenómina validada (demo).',
      integridad: { estadoIntegridad: 'pendiente', fingerprintPublico: 'DEMO-VALD' },
      origen: 'mock',
    },
    {
      idEvento: `${base}-apr`,
      periodo,
      paso: 'closure',
      tipoEvento: 'PRENOMINA_APROBADA',
      usuarioId: null,
      usuarioNombre: '—',
      fechaEvento: new Date().toISOString(),
      descripcion: 'Aprobación pendiente (demo).',
      integridad: { estadoIntegridad: 'noDisponible' },
      origen: 'mock',
    },
  ];
}
