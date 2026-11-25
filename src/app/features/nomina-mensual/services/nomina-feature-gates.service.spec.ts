import { TestBed } from '@angular/core/testing';
import { describe, expect, it, vi } from 'vitest';

import { provideAuthStub } from '../../../core/auth/testing/auth.stub';
import { NominaFeatureGatesRepository } from '../data-access/nomina-feature-gates.repository';
import {
  NOMINA_FEATURE_GATES_APAGADOS,
  type NominaFeatureGates,
} from '../models/nomina-feature-gates.models';
import { NominaFeatureGatesService } from './nomina-feature-gates.service';

function preparar() {
  const obtener = vi.fn();
  const auth = provideAuthStub({ id: 'usuario-a' });
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers: [
      NominaFeatureGatesService,
      auth.provider,
      { provide: NominaFeatureGatesRepository, useValue: { obtener } },
    ],
  });
  const service = TestBed.inject(NominaFeatureGatesService);
  TestBed.tick();
  return { service, obtener, usuario: auth.usuario };
}

describe('NominaFeatureGatesService', () => {
  it('publica los tipos habilitados de la sesión vigente', async () => {
    const { service, obtener } = preparar();
    const gates = { ...NOMINA_FEATURE_GATES_APAGADOS, rectificacion: true } as NominaFeatureGates;
    obtener.mockResolvedValue(gates);

    await service.cargar();

    expect(service.gates()).toEqual(gates);
  });

  it('un fallo tardío de la sesión anterior no apaga los tipos del usuario nuevo', async () => {
    const { service, obtener, usuario } = preparar();
    let fallarA!: (error: Error) => void;
    obtener.mockReturnValueOnce(new Promise((_, reject) => (fallarA = reject)));
    const cargaA = service.cargar();

    usuario.set(null);
    TestBed.tick();
    usuario.set({ id: 'usuario-b' });
    TestBed.tick();

    const gatesB = { ...NOMINA_FEATURE_GATES_APAGADOS, rectificacion: true } as NominaFeatureGates;
    obtener.mockResolvedValueOnce(gatesB);
    await service.cargar();
    expect(service.gates()).toEqual(gatesB);

    fallarA(new Error('red'));
    await cargaA;

    expect(service.gates()).toEqual(gatesB);
  });
});
