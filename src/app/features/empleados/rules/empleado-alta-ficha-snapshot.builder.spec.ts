import { FormBuilder, Validators } from '@angular/forms';
import { describe, expect, it } from 'vitest';

import { EMPTY_EMPLEADO_FORM_CATALOGOS } from '../models/empleado-catalogos.model';
import { EmpleadosFormOrchestratorService } from '../services/empleados-form-orchestrator.service';
import { construirSnapshotValidacionFicha } from './empleado-alta-ficha-snapshot.builder';

describe('construirSnapshotValidacionFicha', () => {
  it('mapea RUT y paso de alta avanzada', () => {
    const orchestrator = new EmpleadosFormOrchestratorService();
    const form = orchestrator.createForm();
    form.controls.datosPersonales.patchValue({
      rut: '12.345.678-5',
      nombres: 'Ana',
    });

    const snapshot = construirSnapshotValidacionFicha({
      form,
      catalogos: EMPTY_EMPLEADO_FORM_CATALOGOS,
      esModoBasico: false,
      esModoAvanzado: true,
      esModoHonorarios: false,
      pasoWizardActivo: 2,
      perfilLaboralMenorEdad: false,
      tieneCondicionesEspeciales: false,
      observacionCondicionesValida: true,
    });

    expect(snapshot.rut).toBe('12.345.678-5');
    expect(snapshot.pasoAltaAvanzada).toBe(2);
    expect(snapshot.origenCreacion).toBe('avanzado');
  });
});
