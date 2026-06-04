import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import { crearNominaResumen } from '../../../../models/nomina-periodo.models';
import type {
  IncidenciaNomina,
  ResumenValidacionNomina,
} from '../../../../models/nomina-periodo.models';
import { AdminNominasModalResumenNominaComponent } from './admin-nominas-modal-resumen-nomina.component';

function resumenOk(): ResumenValidacionNomina {
  return {
    totalTrabajadores: 24,
    listosParaCalculo: 22,
    conIncidenciasCriticas: 0,
    conAdvertencias: 2,
    conMovimientosEspeciales: 1,
    puedeCalcular: true,
    puedeCerrar: true,
    incidenciasCriticas: [],
    advertencias: [
      {
        id: 'inc-adv-1',
        nominaPeriodoId: 'nom-1',
        severidad: 'advertencia',
        tipo: 'movimiento-borrador',
        mensaje: 'Hay 2 movimientos en borrador.',
        bloqueante: false,
      },
    ],
  };
}

function resumenBloqueado(): ResumenValidacionNomina {
  const critica: IncidenciaNomina = {
    id: 'inc-crit-1',
    nominaPeriodoId: 'nom-1',
    severidad: 'critica',
    tipo: 'datos-bancarios-faltantes',
    mensaje: 'Trabajador sin datos bancarios.',
    bloqueante: true,
    trabajadorId: 'trab-001',
  };
  return {
    totalTrabajadores: 24,
    listosParaCalculo: 23,
    conIncidenciasCriticas: 1,
    conAdvertencias: 0,
    conMovimientosEspeciales: 0,
    puedeCalcular: false,
    puedeCerrar: false,
    incidenciasCriticas: [critica],
    advertencias: [],
  };
}

describe('AdminNominasModalResumenNominaComponent', () => {
  it('Test 28 — métricas reflejan los totales del ResumenValidacionNomina', () => {
    const fixture = TestBed.createComponent(AdminNominasModalResumenNominaComponent);
    fixture.componentRef.setInput('resumen', resumenOk());
    const metricas = fixture.componentInstance.metricas();
    expect(metricas).toHaveLength(5);
    expect(metricas.find((m) => m.id === 'total')?.value).toBe(24);
    expect(metricas.find((m) => m.id === 'listos')?.value).toBe(22);
    expect(metricas.find((m) => m.id === 'advertencias')?.value).toBe(2);
  });

  it('Test 29 — mensajeGuardia es positivo cuando puedeCalcular Y puedeCerrar', () => {
    const fixture = TestBed.createComponent(AdminNominasModalResumenNominaComponent);
    fixture.componentRef.setInput('resumen', resumenOk());
    expect(fixture.componentInstance.mensajeGuardia()).toContain('habilitada para avanzar');
  });

  it('Test 30 — mensajeGuardia bloquea cuando hay críticas y puedeCalcular es false', () => {
    const fixture = TestBed.createComponent(AdminNominasModalResumenNominaComponent);
    fixture.componentRef.setInput('resumen', resumenBloqueado());
    const mensaje = fixture.componentInstance.mensajeGuardia();
    expect(mensaje.toLowerCase()).toContain('crítica');
  });

  it('Test 31 — contextoVista expone empresa, periodo y badge cuando se entrega nomina', () => {
    const fixture = TestBed.createComponent(AdminNominasModalResumenNominaComponent);
    fixture.componentRef.setInput('resumen', resumenOk());
    fixture.componentRef.setInput(
      'nomina',
      crearNominaResumen({
        empresaNombre: 'Constructora Andes Ltda.',
        periodo: '2026-06',
        tipo: 'mensual',
        estado: 'calculada',
      }),
    );
    const contexto = fixture.componentInstance.contextoVista();
    expect(contexto).not.toBeNull();
    expect(contexto!.empresa).toBe('Constructora Andes Ltda.');
    expect(contexto!.periodo).toBe('2026-06');
    expect(contexto!.tipo).toBe('Mensual');
    expect(contexto!.badge.variant).toBe('info');
  });

  it('Test 32 — cerrarModal emite (cerrar)', () => {
    const fixture = TestBed.createComponent(AdminNominasModalResumenNominaComponent);
    fixture.componentRef.setInput('resumen', resumenOk());
    let cerrado = false;
    fixture.componentInstance.cerrar.subscribe(() => { cerrado = true; });
    fixture.componentInstance.cerrarModal();
    expect(cerrado).toBe(true);
  });
});
