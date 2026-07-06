import { TestBed } from '@angular/core/testing';
import { describe, expect, it, vi } from 'vitest';

import type { DelegadoModalAltaEmpleado } from './empleado-alta-modal.orquestador';
import { EmpleadoAltaModalOrquestador } from './empleado-alta-modal.orquestador';
import { EmpleadoAltaAvanzadaPresentacionFacade } from './empleado-alta-avanzada-presentacion.facade';

function crearDelegadoMock(): DelegadoModalAltaEmpleado {
  return {
    pasoWizardActivo: () => 0,
    buscarPrimerPasoAsistenteConBloqueos: () => null,
    etiquetaCortaPasoAsistente: () => 'Datos personales',
    esModoHonorarios: () => false,
    cerrarModalYEnfocarPrimerPendiente: vi.fn(),
    avanzarPasoSiguienteAsistente: vi.fn(),
    enviarModoAvanzado: vi.fn().mockResolvedValue(undefined),
    seleccionarPasoAsistente: vi.fn(),
    sincronizarPestanasCompletadasDesdeValidez: vi.fn(),
    marcarTodasPestanasValidasComoCompletadas: vi.fn(),
    obtenerPendientesValidacionFinalizacion: () => [],
    aplicarAccionCoherencia: vi.fn(),
    confirmarCambioHonorariosDesdeModal: vi.fn(),
    cancelarCambioModoHonorarios: vi.fn(),
    irAListadoEmpleados: vi.fn(),
    pasoSugeridoError: () => null,
    mensajeErrorNormalizado: (m) => m,
    accionRecomendadaError: () => 'Revisar',
  };
}

describe('EmpleadoAltaModalOrquestador', () => {
  it('manejarAccion focus-current-step delega foco al componente', () => {
    TestBed.configureTestingModule({
      providers: [EmpleadoAltaAvanzadaPresentacionFacade, EmpleadoAltaModalOrquestador],
    });
    const orquestador = TestBed.inject(EmpleadoAltaModalOrquestador);
    const presentacion = TestBed.inject(EmpleadoAltaAvanzadaPresentacionFacade);
    const delegado = crearDelegadoMock();

    presentacion.modalAccionAvanzada.set({
      kind: 'next-step-review',
      variant: 'warning',
      title: 'Faltan datos',
      message: 'msg',
      primaryLabel: 'Revisar',
      blockingItems: [],
      warningItems: [],
      infoItems: [],
      fieldItems: [
        {
          id: 'personal.identity',
          sectionTitle: 'Identificacion',
          fieldLabel: 'RUT',
          detail: 'd',
          actionLabel: 'Ir',
          wizardStep: 0,
          controlPath: 'datosPersonales.rut',
          severity: 'error',
        },
      ],
      primaryAction: 'focus-current-step',
    });

    orquestador.manejarAccion(delegado, 'focus-current-step');

    expect(delegado.cerrarModalYEnfocarPrimerPendiente).toHaveBeenCalledWith(
      expect.objectContaining({ kind: 'next-step-review' }),
      0,
    );
  });

  it('abrirModalBorradorInvalido usa accion focus-draft-minimum', () => {
    TestBed.configureTestingModule({
      providers: [EmpleadoAltaAvanzadaPresentacionFacade, EmpleadoAltaModalOrquestador],
    });
    const orquestador = TestBed.inject(EmpleadoAltaModalOrquestador);
    const presentacion = TestBed.inject(EmpleadoAltaAvanzadaPresentacionFacade);

    orquestador.abrirModalBorradorInvalido([
      {
        id: 'borrador.rut',
        message: 'Ingresa RUT',
        controlPath: 'datosPersonales.rut',
        wizardStep: 0,
        sectionTitle: 'Identificacion',
        fieldLabel: 'RUT',
      },
    ]);

    expect(presentacion.modalAccionAvanzada()?.primaryAction).toBe('focus-draft-minimum');
    expect(presentacion.modalAccionAvanzada()?.fieldItems?.[0]?.controlPath).toBe(
      'datosPersonales.rut',
    );
  });
});
