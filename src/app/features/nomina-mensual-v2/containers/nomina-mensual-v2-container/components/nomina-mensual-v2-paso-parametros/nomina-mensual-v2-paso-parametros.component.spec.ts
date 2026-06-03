import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { describe, expect, it, beforeEach, vi } from 'vitest';

import { PeriodoActivoService } from '../../../../../../core/services/periodo-activo.service';
import { NominaParametrosBaseAccesoService } from '../../../../services/nomina-parametros-base-acceso.service';
import { NominaParametrosBaseService } from '../../../../services/nomina-parametros-base.service';
import { NominaParametrosResumenService } from '../../../../services/nomina-parametros-resumen.service';
import { NominaMensualV2OrquestadorPort } from '../../facade/nomina-mensual-v2-orquestador.port';
import type { NominaParametrosResumen } from '../../../../models/nomina-parametros-resumen.models';
import { NominaMensualV2PasoParametrosComponent } from './nomina-mensual-v2-paso-parametros.component';

function resumenVacio(parcial: Partial<NominaParametrosResumen> = {}): NominaParametrosResumen {
  return {
    periodo: '2026-05',
    completitud: 100,
    completitudSecciones: 100,
    seccionesTotales: 5,
    seccionesListas: 5,
    controlesTotales: 10,
    controlesVerificados: 10,
    totalParametros: 10,
    parametrosConfigurados: 10,
    bloqueos: 0,
    requiereRevision: 0,
    bloqueosPreparacion: 0,
    advertenciasOficiales: 0,
    completos: 10,
    puedeContinuar: true,
    puedePreparar: true,
    ultimaActualizacion: null,
    areas: [],
    bloqueosActuales: [],
    pendientesPreparacion: [],
    advertenciasNoBloqueantes: [],
    accesos: [],
    ...parcial,
  };
}

function configurarTestBed(): void {
  TestBed.configureTestingModule({
    providers: [
      NominaMensualV2OrquestadorPort,
      PeriodoActivoService,
      { provide: Router, useValue: { navigate: vi.fn().mockResolvedValue(true) } },
      {
        provide: NominaParametrosResumenService,
        useValue: { obtenerResumen: vi.fn().mockResolvedValue(resumenVacio()) },
      },
      {
        provide: NominaParametrosBaseService,
        useValue: {
          obtenerEstadoBase: vi.fn().mockResolvedValue(null),
          calcularPrevisualizacionBase: vi.fn(),
          resolverRamaAccionPreparacion: vi.fn(),
          origenTrasAccionDiferencias: vi.fn(),
          registrarMantenerBaseConDiferencias: vi.fn(),
        },
      },
      {
        provide: NominaParametrosBaseAccesoService,
        useValue: {
          resolverPermisos: () => ({
            puedeRecargarBase: false,
            puedeActualizarBaseEnDiferencias: false,
          }),
          evaluarIntentoRecarga: vi.fn(),
          modalParaEvaluacion: vi.fn(),
          debeInterceptarRecarga: vi.fn().mockReturnValue(false),
        },
      },
    ],
  });
}

describe('NominaMensualV2PasoParametrosComponent (smoke)', () => {
  beforeEach(() => {
    configurarTestBed();
  });

  it('se instancia sin levantar el template', () => {
    const fixture = TestBed.createComponent(NominaMensualV2PasoParametrosComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('expone etiquetas de estado de parámetro con tildes correctas (NOIA / L6)', () => {
    const { componentInstance: cmp } = TestBed.createComponent(
      NominaMensualV2PasoParametrosComponent,
    );
    expect(cmp.parametroEstadoEtiqueta('completo')).toBe('Completo');
    expect(cmp.parametroEstadoEtiqueta('requiereRevision')).toBe('Requiere revisión');
    expect(cmp.parametroEstadoEtiqueta('bloqueo')).toBe('Bloqueo');
    expect(cmp.parametroEstadoEtiqueta('pendiente')).toBe('Pendiente');
  });

  it('expone etiquetas de severidad de bloqueo con tildes correctas (NOIA / L6)', () => {
    const { componentInstance: cmp } = TestBed.createComponent(
      NominaMensualV2PasoParametrosComponent,
    );
    expect(cmp.bloqueoSeveridadEtiqueta('bloqueo')).toBe('Bloqueo crítico');
    expect(cmp.bloqueoSeveridadEtiqueta('revision')).toBe('Revisión requerida');
  });

  it('mensaje de pendientes oficiales menciona "período" con tilde (regresión L6)', () => {
    const { componentInstance: cmp } = TestBed.createComponent(
      NominaMensualV2PasoParametrosComponent,
    );
    expect(cmp.tituloModalPendientesParametros('preparacion')).toBe('Pendientes para preparar');
    expect(cmp.tituloModalPendientesParametros('oficiales')).toBe('Oficiales pendientes');
    expect(cmp.mensajeModalPendientesParametros('oficiales')).toContain('período');
    expect(cmp.mensajeModalPendientesParametros('preparacion')).toContain('nómina');
  });

  it('alertas de cabecera no usan punto y coma en copy visible (regresión NOIA / L6)', () => {
    const { componentInstance: cmp } = TestBed.createComponent(
      NominaMensualV2PasoParametrosComponent,
    );
    cmp.parametrosLoading.set(false);
    cmp.parametrosResumen.set(resumenVacio({ requiereRevision: 1 }));

    expect(cmp.alertaRevisionDescripcion()).not.toContain(';');
    expect(cmp.alertaOficialesDescripcion()).not.toContain(';');
    expect(cmp.alertaBloqueoDescripcion()).not.toContain(';');
  });

  it('parametrosAlertaTipo refleja loading → error → bloqueo → oficiales → revisión', () => {
    const { componentInstance: cmp } = TestBed.createComponent(
      NominaMensualV2PasoParametrosComponent,
    );

    expect(cmp.parametrosAlertaTipo()).toBeNull();

    cmp.parametrosLoading.set(false);
    cmp.parametrosResumen.set(resumenVacio());
    expect(cmp.parametrosAlertaTipo()).toBeNull();

    cmp.parametrosError.set('Algo falló');
    expect(cmp.parametrosAlertaTipo()).toBe('error');
    cmp.parametrosError.set(null);

    cmp.parametrosResumen.set(resumenVacio({ bloqueosPreparacion: 2 }));
    expect(cmp.parametrosAlertaTipo()).toBe('bloqueo');

    cmp.parametrosResumen.set(resumenVacio({ advertenciasOficiales: 1 }));
    expect(cmp.parametrosAlertaTipo()).toBe('oficiales');

    cmp.parametrosResumen.set(resumenVacio({ requiereRevision: 1 }));
    expect(cmp.parametrosAlertaTipo()).toBe('revision');
  });
});
