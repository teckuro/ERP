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
    estado: 'cerrada',
    totalTrabajadores: 24,
    totalHaberes: 12_500_000,
    totalDescuentos: 2_100_000,
    totalLiquido: 10_400_000,
    fechaPago: '2026-06-30',
    closedAt: '2026-06-28T18:00:00Z',
    proximoPaso: 'liquidaciones',
    evidenciaCalculo: {
      idCalculoPeriodo: 42,
      versionCalculo: 3,
      calculoVigente: true,
    },
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
  it('Test 28 — indicadores expone totales del período y versión de cálculo', () => {
    const fixture = TestBed.createComponent(AdminNominasModalResumenNominaComponent);
    fixture.componentRef.setInput('nomina', nominaMock());
    fixture.componentRef.setInput('resumen', resumenOk());
    const indicadores = fixture.componentInstance.indicadores();
    expect(indicadores.map((m) => m.id)).toContain('liquido');
    expect(indicadores.find((m) => m.id === 'liquido')?.destacado).toBe(true);
    expect(indicadores.find((m) => m.id === 'version')?.valor).toBe('v3');
  });

  it('Test 29 — situacion es tono "ok" cuando la nómina está cerrada', () => {
    const fixture = TestBed.createComponent(AdminNominasModalResumenNominaComponent);
    fixture.componentRef.setInput('nomina', nominaMock());
    fixture.componentRef.setInput('resumen', resumenOk());
    const situacion = fixture.componentInstance.situacion();
    expect(situacion.tono).toBe('ok');
    expect(situacion.texto.toLowerCase()).toContain('cerrada');
  });

  it('Test 30 — situacion es pendiente cuando la nómina está liquidada', () => {
    const fixture = TestBed.createComponent(AdminNominasModalResumenNominaComponent);
    fixture.componentRef.setInput('nomina', crearNominaResumen({
      ...nominaMock(),
      estado: 'liquidada',
      proximoPaso: 'cierre',
    }));
    fixture.componentRef.setInput('resumen', resumenOk());
    const situacion = fixture.componentInstance.situacion();
    expect(situacion.tono).toBe('pendiente');
    expect(situacion.texto.toLowerCase()).toContain('liquidaciones');
  });

  it('Test 31 — mientras carga usa overlay viewport; danger ante error', () => {
    const fixture = TestBed.createComponent(AdminNominasModalResumenNominaComponent);
    fixture.componentRef.setInput('nomina', nominaMock());
    fixture.componentRef.setInput('cargando', true);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('app-workspace-loading')).toBeTruthy();
    expect(fixture.componentInstance.variantModal()).toBe('info');

    fixture.componentRef.setInput('cargando', false);
    fixture.componentRef.setInput('error', 'Fallo de red');
    fixture.detectChanges();
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

  it('Test 33 — mensajeModal describe el cierre cuando la nómina está cerrada', () => {
    const fixture = TestBed.createComponent(AdminNominasModalResumenNominaComponent);
    fixture.componentRef.setInput('nomina', nominaMock());
    fixture.componentRef.setInput('resumen', resumenOk());
    expect(fixture.componentInstance.mensajeModal().toLowerCase()).toContain('cerrado');
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

  it('Test 35 — acciones expone Ver liquidaciones cuando hay cálculo vigente', () => {
    const fixture = TestBed.createComponent(AdminNominasModalResumenNominaComponent);
    fixture.componentRef.setInput('nomina', nominaMock());
    fixture.componentRef.setInput('cargando', true);
    expect(fixture.componentInstance.acciones()).toHaveLength(0);

    fixture.componentRef.setInput('cargando', false);
    fixture.componentRef.setInput('resumen', resumenOk());
    const acciones = fixture.componentInstance.acciones();
    expect(acciones.some((a) => a.value === 'liquidaciones')).toBe(true);
  });

  it('Test 35b — sin liquidaciones ofrece Abrir/Continuar nómina', () => {
    const fixture = TestBed.createComponent(AdminNominasModalResumenNominaComponent);
    fixture.componentRef.setInput(
      'nomina',
      crearNominaResumen({
        estado: 'aprobada',
        naturaleza: 'liquidacion_legal',
        evidenciaCalculo: undefined,
        proximoPaso: 'liquidaciones',
      }),
    );
    fixture.componentRef.setInput('cargando', false);
    fixture.componentRef.setInput('resumen', resumenOk());
    const acciones = fixture.componentInstance.acciones();
    expect(acciones.some((a) => a.value === 'abrir')).toBe(true);
    expect(acciones.some((a) => a.value === 'liquidaciones')).toBe(false);
  });
});
