import { describe, expect, it } from 'vitest';

import { evaluarAltaAplicabilidad } from './empleado-alta-aplicabilidad.rules';
import { evaluarAltaCoherencia } from './empleado-alta-coherencia.rules';
import {
  buildAltaValidacionInput,
  buildRevisionesNormativasConsola,
  evaluarAltaValidacionesDesdeDiagnostico,
} from './empleado-alta-validacion-input';
import { evaluarDiagnosticoFichaEmpleado } from './empleado-alta-diagnostico.rules';
import type { EmpleadoFichaValidacionSnapshot } from './empleado-ficha-validacion.rules';

const snapshotBase: EmpleadoFichaValidacionSnapshot = {
  origenCreacion: 'avanzado',
  relacionLaboral: 'CONTRATO',
  tipoContrato: 'INDEFINIDO',
  rut: '11.111.111-1',
  fechaIngreso: '2026-05-01',
  horasSemanales: 42,
  seguroCesantia: false,
  tipoPrevision: 'AFP',
};

describe('empleado-alta-validacion-input', () => {
  it('buildAltaValidacionInput mapea pendientes del diagnóstico', () => {
    const diagnostico = evaluarDiagnosticoFichaEmpleado({
      ...snapshotBase,
      cargo: '',
    });
    const input = buildAltaValidacionInput({
      diagnostico,
      aplicabilidadItems: [],
      inconsistenciasCoherencia: [],
    });

    expect(input.pendientes.length).toBeGreaterThan(0);
    expect(input.pendientes[0].controlPath).toBeTruthy();
  });

  it('buildRevisionesNormativasConsola expone coherencia con acción', () => {
    const coherencia = evaluarAltaCoherencia({
      relacionLaboral: 'CONTRATO',
      tipoContrato: 'INDEFINIDO',
      tipoJornadaLabel: 'Ordinaria',
      fechaNacimiento: '1990-01-01',
      fechaIngreso: '2026-05-01',
      horasSemanales: 42,
      seguroCesantia: false,
      tipoRegimenPrevisional: 'AFP',
      condiciones: {
        pensionado: false,
        pensionadoInvalidezParcial: false,
        pensionadoInvalidezTotal: false,
        exentoCotizacionPension: false,
        trabajadorAdolescenteProtegido: false,
        autorizacionMenorRegistrada: false,
        tecnicoExtranjeroExento: false,
        discapacidad: false,
        respaldoRegistrado: false,
      },
    });
    const validaciones = evaluarAltaValidacionesDesdeDiagnostico({
      diagnostico: evaluarDiagnosticoFichaEmpleado(snapshotBase),
      aplicabilidadItems: Object.values(
        evaluarAltaAplicabilidad({
          relacionLaboral: 'CONTRATO',
          tipoContrato: 'INDEFINIDO',
          tipoRegimenPrevisional: 'AFP',
          tieneApv: false,
          tieneCondicionesEspeciales: false,
          tieneRespaldoCondiciones: false,
          esMenorEdad: false,
          esMayor65: false,
        }).campos,
      ),
      inconsistenciasCoherencia: coherencia.inconsistencias,
    });

    const revisiones = buildRevisionesNormativasConsola(
      validaciones,
      coherencia.inconsistencias,
      new Set(),
    );

    expect(
      revisiones.some((r) => r.coherenciaIssueId === 'coh.seguro.indefinido-inactivo'),
    ).toBe(true);
    expect(revisiones.find((r) => r.coherenciaIssueId === 'coh.seguro.indefinido-inactivo')?.puedeAplicarCorreccion).toBe(
      true,
    );
  });
});
