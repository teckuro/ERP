import { TestBed } from '@angular/core/testing';
import { describe, expect, it, beforeEach, vi } from 'vitest';

import { PeriodoActivoService } from '../../../../../../core/services/periodo-activo.service';
import {
  filaTieneIncidenciaAlcance,
  obtenerTrabajadoresConIncidencias,
} from '../../../../presenters/nomina-alcance-grid.presenter';
import type { FilaEmpleadoNomina } from '../../../../presenters/nomina-empleados-grid.presenter';
import { NominaEmpleadosCargaService } from '../../../../services/nomina-empleados-carga.service';
import { NominaMensualV2OrquestadorPort } from '../../facade/nomina-mensual-v2-orquestador.port';
import { NominaMensualV2PasoAlcanceComponent } from './nomina-mensual-v2-paso-alcance.component';

function crearFilaEmpleadoBase(overrides: Partial<FilaEmpleadoNomina> = {}): FilaEmpleadoNomina {
  return {
    id: 'emp-1',
    nombreCompleto: 'Juan Pérez',
    rut: '12.345.678-9',
    cargo: 'Operario',
    centroCosto: 'Planta A',
    jornada: 'Completa',
    estadoNomina: 'listo',
    etiquetaEstadoNomina: 'Listo',
    datosBancarios: 'completo',
    etiquetaDatosBancarios: 'Completo',
    contrato: 'vigente',
    etiquetaContrato: 'Vigente',
    documentacion: 'completa',
    etiquetaDocumentacion: 'Completa',
    afpSaludAsignada: true,
    etiquetaAfpSalud: 'Asignada',
    ...overrides,
  };
}

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

  it('expone las tres opciones de alcance del presenter (sin "contrato", se hará en otra fase)', () => {
    const { componentInstance: cmp } = TestBed.createComponent(
      NominaMensualV2PasoAlcanceComponent,
    );
    const ids = cmp.opcionesAlcance.map((opcion) => opcion.id);
    expect(ids).toEqual(['empresaCompleta', 'grupo', 'seleccionManual']);
    expect(cmp.opcionesAlcance).toHaveLength(3);
  });

  it('seleccionarTipoAlcance ignora opciones deshabilitadas o ya preparadas', () => {
    const { componentInstance: cmp } = TestBed.createComponent(
      NominaMensualV2PasoAlcanceComponent,
    );
    cmp.tipoAlcanceSeleccionado.set(null);

    cmp.seleccionarTipoAlcance('grupo', 'deshabilitado');
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

  it('metricasAlcance: sin tipo elegido muestra solo "Encontrados"', () => {
    const { componentInstance: cmp } = TestBed.createComponent(
      NominaMensualV2PasoAlcanceComponent,
    );
    cmp.tipoAlcanceSeleccionado.set(null);
    const ids = cmp.metricasAlcance().map((m) => m.id);
    expect(ids).toEqual(['workers']);
  });

  it('metricasAlcance: con tipo elegido muestra Encontrados/Incluidos/Excluidos y oculta Bloqueados si es 0', () => {
    const { componentInstance: cmp } = TestBed.createComponent(
      NominaMensualV2PasoAlcanceComponent,
    );
    cmp.tipoAlcanceSeleccionado.set('empresaCompleta');
    const ids = cmp.metricasAlcance().map((m) => m.id);
    expect(ids).toContain('workers');
    expect(ids).toContain('active');
    expect(ids).toContain('pending');
    expect(ids).not.toContain('blocker');
  });

  it('etiquetaSeveridadChecklistAlcance mapea cada status a una etiqueta operativa', () => {
    const { componentInstance: cmp } = TestBed.createComponent(
      NominaMensualV2PasoAlcanceComponent,
    );
    expect(cmp.etiquetaSeveridadChecklistAlcance('success')).toBe('Listo');
    expect(cmp.etiquetaSeveridadChecklistAlcance('warning')).toBe('Revisar');
    expect(cmp.etiquetaSeveridadChecklistAlcance('error')).toBe('Bloqueo');
    expect(cmp.etiquetaSeveridadChecklistAlcance('pending')).toBe('Pendiente');
  });

  it('claseSeveridadChecklistAlcance entrega la clase modificadora correcta', () => {
    const { componentInstance: cmp } = TestBed.createComponent(
      NominaMensualV2PasoAlcanceComponent,
    );
    expect(cmp.claseSeveridadChecklistAlcance('success')).toBe(
      'nmv2-paso-alcance__checklist-severity--correcto',
    );
    expect(cmp.claseSeveridadChecklistAlcance('warning')).toBe(
      'nmv2-paso-alcance__checklist-severity--advertencia',
    );
    expect(cmp.claseSeveridadChecklistAlcance('error')).toBe(
      'nmv2-paso-alcance__checklist-severity--bloqueante',
    );
    expect(cmp.claseSeveridadChecklistAlcance('pending')).toBe(
      'nmv2-paso-alcance__checklist-severity--neutro',
    );
  });

  it('alcanceVacioRequiereSeleccion es true solo si elegí grupo o seleccionManual sin incluir trabajadores', () => {
    const { componentInstance: cmp } = TestBed.createComponent(
      NominaMensualV2PasoAlcanceComponent,
    );

    cmp.tipoAlcanceSeleccionado.set(null);
    expect(cmp.alcanceVacioRequiereSeleccion()).toBe(false);

    cmp.tipoAlcanceSeleccionado.set('empresaCompleta');
    expect(cmp.alcanceVacioRequiereSeleccion()).toBe(false);

    cmp.tipoAlcanceSeleccionado.set('grupo');
    cmp.centrosCostoSeleccionados.set([]);
    expect(cmp.alcanceVacioRequiereSeleccion()).toBe(true);

    cmp.tipoAlcanceSeleccionado.set('seleccionManual');
    cmp.idsTrabajadoresManuales.set([]);
    expect(cmp.alcanceVacioRequiereSeleccion()).toBe(true);
  });

  describe('Panel de incidencias (A6)', () => {
    it('filaTieneIncidenciaAlcance: detecta cada dimensión que rompe el alcance', () => {
      expect(filaTieneIncidenciaAlcance(crearFilaEmpleadoBase())).toBe(false);
      expect(filaTieneIncidenciaAlcance(crearFilaEmpleadoBase({ estadoNomina: 'observado' }))).toBe(true);
      expect(filaTieneIncidenciaAlcance(crearFilaEmpleadoBase({ contrato: 'vencido' }))).toBe(true);
      expect(filaTieneIncidenciaAlcance(crearFilaEmpleadoBase({ datosBancarios: 'pendiente' }))).toBe(true);
      expect(filaTieneIncidenciaAlcance(crearFilaEmpleadoBase({ afpSaludAsignada: false }))).toBe(true);
      expect(filaTieneIncidenciaAlcance(crearFilaEmpleadoBase({ centroCosto: 'Sin asignar' }))).toBe(true);
      expect(filaTieneIncidenciaAlcance(crearFilaEmpleadoBase({ jornada: 'Sin jornada' }))).toBe(true);
      expect(filaTieneIncidenciaAlcance(crearFilaEmpleadoBase({ documentacion: 'incompleta' }))).toBe(true);
    });

    it('obtenerTrabajadoresConIncidencias filtra solo los incluidos que tienen pendientes', () => {
      const filas: FilaEmpleadoNomina[] = [
        crearFilaEmpleadoBase({ id: 'emp-1' }),
        crearFilaEmpleadoBase({ id: 'emp-2', contrato: 'vencido' }),
        crearFilaEmpleadoBase({ id: 'emp-3', estadoNomina: 'observado', etiquetaEstadoNomina: 'Observado' }),
        crearFilaEmpleadoBase({ id: 'emp-4', datosBancarios: 'pendiente' }),
      ];

      const resultado = obtenerTrabajadoresConIncidencias(filas, ['emp-1', 'emp-2', 'emp-3']);
      const ids = resultado.map((fila) => fila.id);
      expect(ids).toEqual(['emp-2', 'emp-3']);
    });

    it('mostrarPanelIncidencias es false para seleccionManual aunque haya incidencias', () => {
      const { componentInstance: cmp } = TestBed.createComponent(
        NominaMensualV2PasoAlcanceComponent,
      );
      cmp.filasPeriodo.set([
        crearFilaEmpleadoBase({ id: 'emp-1', contrato: 'vencido' }),
      ]);
      cmp.tipoAlcanceSeleccionado.set('seleccionManual');
      cmp.idsTrabajadoresManuales.set(['emp-1']);

      expect(cmp.mostrarPanelIncidencias()).toBe(false);
    });

    it('mostrarPanelIncidencias es true para empresaCompleta cuando hay incidencias', () => {
      const { componentInstance: cmp } = TestBed.createComponent(
        NominaMensualV2PasoAlcanceComponent,
      );
      cmp.filasPeriodo.set([
        crearFilaEmpleadoBase({ id: 'emp-1' }),
        crearFilaEmpleadoBase({ id: 'emp-2', contrato: 'vencido' }),
      ]);
      cmp.tipoAlcanceSeleccionado.set('empresaCompleta');

      expect(cmp.mostrarPanelIncidencias()).toBe(true);
      expect(cmp.trabajadoresConIncidencias()).toHaveLength(1);
      expect(cmp.trabajadoresConIncidencias()[0].id).toBe('emp-2');
    });
  });
});
