import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { describe, expect, it, beforeEach, vi } from 'vitest';

import type { NominaPeriodoResumen } from '../../models/nomina-periodo.models';
import { AdministradorNominasContainer } from './administrador-nominas-container';

function configurarTestBed(navigateSpy = vi.fn().mockResolvedValue(true)): { navigate: ReturnType<typeof vi.fn> } {
  TestBed.configureTestingModule({
    providers: [
      {
        provide: Router,
        useValue: { navigate: navigateSpy },
      },
    ],
  });
  return { navigate: navigateSpy };
}

describe('AdministradorNominasContainer (smoke)', () => {
  beforeEach(() => {
    configurarTestBed();
  });

  it('Test 33 — se instancia y carga resúmenes del adapter mock', () => {
    const fixture = TestBed.createComponent(AdministradorNominasContainer);
    const cmp = fixture.componentInstance;
    expect(cmp).toBeTruthy();
    expect(cmp.resumenes().length).toBeGreaterThan(0);
  });

  it('Test 34 — los KPIs reflejan la carga inicial del adapter', () => {
    const fixture = TestBed.createComponent(AdministradorNominasContainer);
    const cmp = fixture.componentInstance;
    const kpis = cmp.kpis();
    expect(kpis.total).toBe(cmp.resumenes().length);
    expect(kpis.items).toHaveLength(4);
  });

  it('Test 35 — abrirNuevaNomina / cerrarNuevaNomina alternan el flag del modal', () => {
    const fixture = TestBed.createComponent(AdministradorNominasContainer);
    const cmp = fixture.componentInstance;
    expect(cmp.modalNuevaAbierto()).toBe(false);
    cmp.abrirNuevaNomina();
    expect(cmp.modalNuevaAbierto()).toBe(true);
    cmp.cerrarNuevaNomina();
    expect(cmp.modalNuevaAbierto()).toBe(false);
  });

  it('Test 36 — abrirResumen carga el ResumenValidacionNomina del adapter para la fila', () => {
    const fixture = TestBed.createComponent(AdministradorNominasContainer);
    const cmp = fixture.componentInstance;
    const fila = cmp.resumenes()[0]!;

    cmp.abrirResumen(fila);
    expect(cmp.resumenSeleccionado()).not.toBeNull();
    expect(cmp.nominaSeleccionada()?.id).toBe(fila.id);

    cmp.cerrarResumen();
    expect(cmp.resumenSeleccionado()).toBeNull();
    expect(cmp.nominaSeleccionada()).toBeNull();
  });

  it('Test 37 — abrirGenerador navega a /remuneraciones/nomina-mensual-v2 con queryParams puente', () => {
    const navigate = vi.fn().mockResolvedValue(true);
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [{ provide: Router, useValue: { navigate } }],
    });

    const fixture = TestBed.createComponent(AdministradorNominasContainer);
    const cmp = fixture.componentInstance;
    const fila = cmp.resumenes()[0]!;

    cmp.abrirGenerador(fila);

    expect(navigate).toHaveBeenCalledOnce();
    expect(navigate).toHaveBeenCalledWith(
      ['/remuneraciones/nomina-mensual-v2'],
      { queryParams: { periodo: fila.periodo, nominaPeriodoId: fila.id } },
    );
  });

  it('Test 38 — onNominaCreada agrega un resumen nuevo al inicio y cierra el modal', () => {
    const fixture = TestBed.createComponent(AdministradorNominasContainer);
    const cmp = fixture.componentInstance;
    const total = cmp.resumenes().length;

    cmp.abrirNuevaNomina();
    expect(cmp.modalNuevaAbierto()).toBe(true);

    const nuevaResumen: NominaPeriodoResumen | null = (() => {
      const nominaMock = {
        id: 'nom-test-001',
        periodo: '2026-07',
        empresaId: 'emp-001',
        empresaNombre: 'Empresa de prueba',
        tipo: 'mensual' as const,
        estado: 'borrador' as const,
        segmentos: [],
        movimientos: [],
        incidencias: [],
        trabajadorIds: [],
        totalHaberes: 0,
        totalDescuentos: 0,
        totalLiquido: 0,
        createdAt: '2026-07-01T00:00:00.000Z',
        updatedAt: '2026-07-01T00:00:00.000Z',
      };
      cmp.onNominaCreada(nominaMock);
      return cmp.resumenes()[0];
    })();

    expect(cmp.resumenes()).toHaveLength(total + 1);
    expect(nuevaResumen?.id).toBe('nom-test-001');
    expect(cmp.modalNuevaAbierto()).toBe(false);
  });
});
