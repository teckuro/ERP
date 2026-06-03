import { TestBed } from '@angular/core/testing';
import { describe, expect, it, beforeEach, vi } from 'vitest';

import { PeriodoActivoService } from '../../../../../../core/services/periodo-activo.service';
import { NominaEmpleadosCargaService } from '../../../../services/nomina-empleados-carga.service';
import { NominaMensualV2OrquestadorPort } from '../../facade/nomina-mensual-v2-orquestador.port';
import { NominaMensualV2PasoAlcanceComponent } from './nomina-mensual-v2-paso-alcance.component';

function configurarTestBed(): void {
  TestBed.configureTestingModule({
    providers: [
      NominaMensualV2OrquestadorPort,
      PeriodoActivoService,
      {
        provide: NominaEmpleadosCargaService,
        useValue: {
          cargarFilasEmpleadosNomina: vi.fn().mockResolvedValue([]),
        },
      },
    ],
  });
}

describe('NominaMensualV2PasoAlcanceComponent (smoke)', () => {
  beforeEach(() => {
    configurarTestBed();
  });

  it('se instancia sin levantar el template', () => {
    const fixture = TestBed.createComponent(NominaMensualV2PasoAlcanceComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('expone las cuatro opciones de alcance del presenter', () => {
    const { componentInstance: cmp } = TestBed.createComponent(
      NominaMensualV2PasoAlcanceComponent,
    );
    const ids = cmp.opcionesAlcance.map((opcion) => opcion.id);
    expect(ids).toEqual(['empresaCompleta', 'grupo', 'contrato', 'seleccionManual']);
    expect(cmp.opcionesAlcance).toHaveLength(4);
  });

  it('seleccionarTipoAlcance ignora opciones deshabilitadas o ya preparadas', () => {
    const { componentInstance: cmp } = TestBed.createComponent(
      NominaMensualV2PasoAlcanceComponent,
    );
    cmp.tipoAlcanceSeleccionado.set(null);

    cmp.seleccionarTipoAlcance('contrato', 'deshabilitado');
    expect(cmp.tipoAlcanceSeleccionado()).toBeNull();

    cmp.seleccionarTipoAlcance('grupo', 'preparado');
    expect(cmp.tipoAlcanceSeleccionado()).toBeNull();

    cmp.seleccionarTipoAlcance('grupo', 'disponible');
    expect(cmp.tipoAlcanceSeleccionado()).toBe('grupo');
  });

  it('alternarCentroCosto agrega y quita centros manteniendo el tipo "grupo"', () => {
    const { componentInstance: cmp } = TestBed.createComponent(
      NominaMensualV2PasoAlcanceComponent,
    );

    cmp.alternarCentroCosto('CC-1');
    expect(cmp.tipoAlcanceSeleccionado()).toBe('grupo');
    expect(cmp.centrosCostoSeleccionados()).toEqual(['CC-1']);
    expect(cmp.centroCostoActivo('CC-1')).toBe(true);

    cmp.alternarCentroCosto('CC-2');
    expect(cmp.centrosCostoSeleccionados()).toEqual(['CC-1', 'CC-2']);

    cmp.alternarCentroCosto('CC-1');
    expect(cmp.centrosCostoSeleccionados()).toEqual(['CC-2']);
    expect(cmp.centroCostoActivo('CC-1')).toBe(false);
  });

  it('alternarTrabajadorManual cambia a "seleccionManual" y mantiene el set', () => {
    const { componentInstance: cmp } = TestBed.createComponent(
      NominaMensualV2PasoAlcanceComponent,
    );

    expect(cmp.trabajadorManualSeleccionado('emp-1')).toBe(false);

    cmp.alternarTrabajadorManual('emp-1');
    expect(cmp.tipoAlcanceSeleccionado()).toBe('seleccionManual');
    expect(cmp.trabajadorManualSeleccionado('emp-1')).toBe(true);

    cmp.alternarTrabajadorManual('emp-1');
    expect(cmp.trabajadorManualSeleccionado('emp-1')).toBe(false);
  });

  it('inicialesEmpleado delega en el util y devuelve las dos primeras iniciales', () => {
    const { componentInstance: cmp } = TestBed.createComponent(
      NominaMensualV2PasoAlcanceComponent,
    );
    expect(cmp.inicialesEmpleado('María Pérez González')).toBe('MP');
    expect(cmp.inicialesEmpleado('  ana  ')).toBe('A');
  });
});
