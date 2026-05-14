import { describe, expect, it } from 'vitest';

import { evaluarAltaAplicabilidad } from './empleado-alta-aplicabilidad.rules';
import { evaluarAltaCoherencia } from './empleado-alta-coherencia.rules';
import { evaluarAltaValidacionesVisibles } from './empleado-alta-validaciones.rules';
import { TipoContrato } from '../models/empleado.model';

const aplicabilidadBase = {
  relacionLaboral: 'CONTRATO' as const,
  tipoContrato: 'INDEFINIDO' as TipoContrato,
  tipoRegimenPrevisional: 'AFP' as const,
  tieneApv: false,
  tieneCondicionesEspeciales: false,
  tieneRespaldoCondiciones: false,
  esMenorEdad: false,
  esMayor65: false,
};

const coherenciaBase = {
  relacionLaboral: 'CONTRATO' as const,
  tipoContrato: 'INDEFINIDO' as TipoContrato,
  tipoJornadaLabel: 'Jornada ordinaria',
  fechaNacimiento: '1990-01-01',
  fechaIngreso: '2026-05-01',
  horasSemanales: 42,
  seguroCesantia: true,
  tipoRegimenPrevisional: 'AFP' as const,
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
};

describe('evaluarAltaValidacionesVisibles', () => {
  it('traduce pendientes obligatorios a mensajes visibles sin exponer estados tecnicos', () => {
    const state = evaluarAltaAplicabilidad(aplicabilidadBase);
    const result = evaluarAltaValidacionesVisibles({
      aplicabilidadItems: Object.values(state.items),
      coherenciaIssues: [],
      pendientes: [
        {
          id: 'contract.start-date',
          paso: 2,
          area: 'Fechas',
          label: 'Ingresa la fecha de ingreso',
          controlPath: 'contrato.fechaIngreso',
          blocking: true,
          severity: 'error',
        },
      ],
    });

    const pendiente = result.find((item) => item.id === 'pendiente.contract.start-date');
    expect(pendiente?.tipo).toBe('missing_required');
    expect(pendiente?.titulo).toBe('Dato necesario pendiente');
    expect(pendiente?.pasoSugerido).toBe('Contrato y organización');
  });

  it('marca tipo trabajador como definido por sistema', () => {
    const state = evaluarAltaAplicabilidad(aplicabilidadBase);
    const result = evaluarAltaValidacionesVisibles({
      aplicabilidadItems: Object.values(state.items),
      coherenciaIssues: [],
      pendientes: [],
    });

    expect(result).toContainEqual(
      expect.objectContaining({
        id: 'aplicabilidad.tipoTrabajador',
        tipo: 'derived',
        titulo: 'Tipo trabajador: definido por sistema',
      }),
    );
  });

  it('orienta regimen Ninguna con copy administrativo y paso sugerido', () => {
    const state = evaluarAltaAplicabilidad({
      ...aplicabilidadBase,
      tipoRegimenPrevisional: 'NINGUNA',
      tieneCondicionesEspeciales: true,
    });
    const result = evaluarAltaValidacionesVisibles({
      aplicabilidadItems: Object.values(state.items),
      coherenciaIssues: [],
      pendientes: [],
    });

    expect(result).toContainEqual(
      expect.objectContaining({
        id: 'aplicabilidad.regimenPrevisional',
        tipo: 'review',
        pasoSugerido: 'Previsión y salud',
        detalle: expect.stringContaining('Sin previsión'),
      }),
    );
  });

  it('para honorarios separa no aplica y bloqueo de finalizacion', () => {
    const state = evaluarAltaAplicabilidad({
      ...aplicabilidadBase,
      relacionLaboral: 'HONORARIOS',
      tipoContrato: null,
      tipoRegimenPrevisional: null,
    });
    const result = evaluarAltaValidacionesVisibles({
      aplicabilidadItems: Object.values(state.items),
      coherenciaIssues: [],
      pendientes: [],
    });

    expect(result).toContainEqual(
      expect.objectContaining({ id: 'aplicabilidad.jornadaLaboral', tipo: 'not_applicable' }),
    );
    expect(result).toContainEqual(
      expect.objectContaining({ id: 'aplicabilidad.resumenFinal', tipo: 'blocked' }),
    );
  });

  it('expone coherencia corregible como revision asistida', () => {
    const app = evaluarAltaAplicabilidad(aplicabilidadBase);
    const coh = evaluarAltaCoherencia({ ...coherenciaBase, seguroCesantia: false });
    const result = evaluarAltaValidacionesVisibles({
      aplicabilidadItems: Object.values(app.items),
      coherenciaIssues: coh.issues,
      pendientes: [],
    });

    expect(result).toContainEqual(
      expect.objectContaining({
        id: 'coherencia.coh.seguro.indefinido-inactivo',
        tipo: 'review',
        puedeCorregir: true,
      }),
    );
  });
});
