import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, expect, it } from 'vitest';

import type { ActaOperativaPeriodoViewModel } from '../../models/acta-operativa-periodo.model';
import { ActaOperativaPeriodoComponent } from './acta-operativa-periodo.component';

const vm = (overrides: Partial<ActaOperativaPeriodoViewModel> = {}): ActaOperativaPeriodoViewModel => ({
  estado: 'LISTA',
  modoCompacto: false,
  titulo: 'Lista para preparar acta',
  descripcion: 'El periodo tiene contexto suficiente para preparar la evidencia.',
  periodoLabel: 'Mayo 2026',
  estadoLabel: 'Lista',
  estadoTone: 'success',
  accionLabel: 'Preparar acta para liquidaciones',
  accionDisponible: true,
  preparada: false,
  contexto: [
    { label: 'Periodo', valor: 'Mayo 2026', estado: 'listo' },
    { label: 'Parametros', valor: 'Listos', estado: 'listo' },
  ],
  decision: {
    titulo: 'Decision operativa',
    descripcion: 'El periodo esta listo para preparar respaldo.',
  },
  evidencia: [
    { label: 'Periodo revisado', estado: 'incluida' },
    { label: 'Estado de validaciones', estado: 'incluida' },
  ],
  pendientes: ['Sin pendientes visibles en esta revision.'],
  observaciones: [],
  alcance: 'Vista preparatoria sin persistencia formal en esta fase.',
  ...overrides,
});

describe('ActaOperativaPeriodoComponent', () => {
  let fixture: ComponentFixture<ActaOperativaPeriodoComponent>;

  async function render(input = vm()): Promise<ActaOperativaPeriodoComponent> {
    await TestBed.configureTestingModule({
      imports: [ActaOperativaPeriodoComponent],
      providers: [provideRouter([])],
    }).compileComponents();
    fixture = TestBed.createComponent(ActaOperativaPeriodoComponent);
    fixture.componentRef.setInput('vm', input);
    fixture.detectChanges();
    return fixture.componentInstance;
  }

  it('renderiza titulo, estado, contexto y evidencia', async () => {
    await render();
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Acta operativa del período');
    expect(text).toContain('Lista');
    expect(text).toContain('Mayo 2026');
    expect(text).toContain('Periodo revisado');
  });

  it('no emite CTA cuando esta bloqueada', async () => {
    const component = await render(vm({
      estado: 'BLOQUEADA',
      estadoLabel: 'Bloqueada',
      estadoTone: 'error',
      accionDisponible: false,
    }));
    let emitted = false;
    component.prepararActa.subscribe(() => { emitted = true; });
    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    button.click();
    expect(button.disabled).toBe(true);
    expect(emitted).toBe(false);
  });

  it('emite prepararActa cuando esta lista', async () => {
    const component = await render();
    let emitted = false;
    component.prepararActa.subscribe(() => { emitted = true; });
    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    button.click();
    expect(emitted).toBe(true);
  });

  it('en modo compacto no renderiza grilla extensa de evidencia', async () => {
    await render(vm({
      estado: 'BLOQUEADA',
      modoCompacto: true,
      titulo: 'Acta operativa del período',
      descripcion: 'Disponible después de validar el período.',
      notaCompacta: 'Primero valida el período para habilitar el respaldo operativo.',
      accionDisponible: false,
      contexto: [],
      evidencia: [],
    }));
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Disponible después de validar el período');
    expect(fixture.nativeElement.querySelector('.nom-acta__context-strip')).toBeNull();
    expect(fixture.nativeElement.querySelector('.nom-acta__evidence-list')).toBeNull();
  });

  it('en estado preparada muestra nota y accion secundaria', async () => {
    await render(vm({
      estado: 'PREPARADA',
      titulo: 'Acta preparada',
      estadoLabel: 'Acta preparada',
      estadoTone: 'success',
      accionDisponible: false,
      preparada: true,
      alcance: 'Acta preparada en esta sesion. La generacion formal se implementara en Liquidaciones oficiales.',
    }));
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Acta preparada');
    expect(text).toContain('generacion formal');
    expect(text).toContain('Ir a Liquidaciones oficiales');
  });
});
