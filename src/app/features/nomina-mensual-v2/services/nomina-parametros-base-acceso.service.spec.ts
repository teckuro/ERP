import { TestBed } from '@angular/core/testing';
import { describe, expect, it, vi, beforeEach } from 'vitest';

import { NominaMensualCapabilitiesService } from '../../nomina-mensual/services/nomina-mensual-capabilities.service';
import { NominaParametrosBaseAccesoService } from './nomina-parametros-base-acceso.service';

describe('NominaParametrosBaseAccesoService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        NominaParametrosBaseAccesoService,
        {
          provide: NominaMensualCapabilitiesService,
          useValue: { esAdmin: vi.fn(() => false) },
        },
      ],
    });
  });

  it('expone Continuar a alcance en shell cuando hay base', () => {
    const service = TestBed.inject(NominaParametrosBaseAccesoService);
    const accion = service.resolverAccionShellParametros({
      hayBaseGuardada: true,
      validando: false,
      loading: false,
    });
    expect(accion.label).toBe('Continuar a alcance');
    expect(accion.disabled).toBe(false);
  });

  it('bloquea recarga para no admin con base', () => {
    const service = TestBed.inject(NominaParametrosBaseAccesoService);
    const evaluacion = service.evaluarIntentoRecarga(true, '2026-05');
    expect(evaluacion.accion).toBe('bloquear');
  });
});
