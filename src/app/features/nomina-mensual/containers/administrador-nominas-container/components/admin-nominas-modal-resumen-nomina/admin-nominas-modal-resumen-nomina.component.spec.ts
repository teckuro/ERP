import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import { crearNominaResumen } from '../../../../models/nomina-periodo.models';
import type {
  IncidenciaNomina,
  ResumenValidacionNomina,
} from '../../../../models/nomina-periodo.models';
import { AdminNominasModalResumenNominaComponent } from './admin-nominas-modal-resumen-nomina.component';

function nominaMock() {
  return crearNominaResumen({
    empresaNombre: 'Constructora Andes Ltda.',
    periodo: '2026-06',
    tipo: 'mensual',
    estado: 'calculada',
    totalTrabajadores: 24,
    proximoPaso: 'validacion',
  });
}

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
  it('Test 28 — métricas muestra listos/total y movimientos especiales sin repetir conteos de la grilla', () => {
    const fixture = TestBed.createComponent(AdminNominasModalResumenNominaComponent);
    fixture.componentRef.setInput('nomina', nominaMock());
    fixture.componentRef.setInput('resumen', resumenOk());
    const metricas = fixture.componentInstance.metricas();
    expect(metricas.map((m) => m.id)).toEqual(['listos', 'especiales']);
    expect(metricas.find((m) => m.id === 'listos')?.display).toBe('22 / 24');
    expect(metricas.find((m) => m.id === 'listos')?.tone).toBe('warning');
    expect(metricas.find((m) => m.id === 'especiales')?.display).toBe('1');
  });

  it('Test 29 — situacion es tono "ok" cuando puedeCalcular Y puedeCerrar', () => {
    const fixture = TestBed.createComponent(AdminNominasModalResumenNominaComponent);
    fixture.componentRef.setInput('nomina', nominaMock());
    fixture.componentRef.setInput('resumen', resumenOk());
    const situacion = fixture.componentInstance.situacion();
    expect(situacion?.tono).toBe('ok');
    expect(situacion?.texto.toLowerCase()).toContain('lista');
  });

  it('Test 30 — situacion es "bloqueada" cuando hay críticas y puedeCalcular es false', () => {
    const fixture = TestBed.createComponent(AdminNominasModalResumenNominaComponent);
    fixture.componentRef.setInput('nomina', nominaMock());
    fixture.componentRef.setInput('resumen', resumenBloqueado());
    const situacion = fixture.componentInstance.situacion();
    expect(situacion?.tono).toBe('bloqueada');
    expect(situacion?.texto.toLowerCase()).toContain('crítica');
  });

  it('Test 31 — variantModal usa loading mientras carga y danger ante error', () => {
    const fixture = TestBed.createComponent(AdminNominasModalResumenNominaComponent);
    fixture.componentRef.setInput('nomina', nominaMock());
    fixture.componentRef.setInput('cargando', true);
    expect(fixture.componentInstance.variantModal()).toBe('loading');

    fixture.componentRef.setInput('cargando', false);
    fixture.componentRef.setInput('error', 'Fallo de red');
    expect(fixture.componentInstance.variantModal()).toBe('danger');
  });

  it('Test 32 — cerrarModal emite (cerrar)', () => {
    const fixture = TestBed.createComponent(AdminNominasModalResumenNominaComponent);
    fixture.componentRef.setInput('nomina', nominaMock());
    fixture.componentRef.setInput('resumen', resumenOk());
    let cerrado = false;
    fixture.componentInstance.cerrar.subscribe(() => { cerrado = true; });
    fixture.componentInstance.cerrarModal();
    expect(cerrado).toBe(true);
  });

  it('Test 33 — metricas omite movimientos especiales cuando el conteo es cero', () => {
    const fixture = TestBed.createComponent(AdminNominasModalResumenNominaComponent);
    fixture.componentRef.setInput('nomina', nominaMock());
    fixture.componentRef.setInput('resumen', resumenBloqueado());
    const metricas = fixture.componentInstance.metricas();
    expect(metricas.map((m) => m.id)).toEqual(['listos']);
    expect(metricas[0].display).toBe('23 / 24');
  });

  it('Test 34 — observaciones unifica críticas y advertencias en una sola lista', () => {
    const fixture = TestBed.createComponent(AdminNominasModalResumenNominaComponent);
    fixture.componentRef.setInput('nomina', nominaMock());
    fixture.componentRef.setInput('resumen', resumenOk());
    const obs = fixture.componentInstance.observaciones();
    expect(obs).toHaveLength(1);
    expect(obs[0].tono).toBe('warning');
    expect(obs[0].icono).toBe('triangle-alert');

    fixture.componentRef.setInput('resumen', resumenBloqueado());
    const obsBloq = fixture.componentInstance.observaciones();
    expect(obsBloq).toHaveLength(1);
    expect(obsBloq[0].tono).toBe('danger');
  });

  it('Test 35 — acciones expone CTA primaria solo cuando hay resumen cargado', () => {
    const fixture = TestBed.createComponent(AdminNominasModalResumenNominaComponent);
    fixture.componentRef.setInput('nomina', nominaMock());
    fixture.componentRef.setInput('cargando', true);
    expect(fixture.componentInstance.acciones()).toHaveLength(0);

    fixture.componentRef.setInput('cargando', false);
    fixture.componentRef.setInput('resumen', resumenOk());
    const acciones = fixture.componentInstance.acciones();
    expect(acciones.some((a) => a.value === 'generador')).toBe(true);
  });
});
