import { TestBed } from '@angular/core/testing';
import { describe, expect, it, beforeEach } from 'vitest';

import { AdminNominasModalNuevaNominaComponent } from './admin-nominas-modal-nueva-nomina.component';
import { NominaPeriodoMockAdapterService } from '../../../../services/nomina-periodo-mock-adapter.service';

function crearComponente(): AdminNominasModalNuevaNominaComponent {
  const fixture = TestBed.createComponent(AdminNominasModalNuevaNominaComponent);
  return fixture.componentInstance;
}

describe('AdminNominasModalNuevaNominaComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [NominaPeriodoMockAdapterService],
    });
  });

  it('Test 23 — inicializa con período actual (AAAA-MM) y primera empresa preseleccionada', () => {
    const cmp = crearComponente();
    expect(cmp.periodo()).toMatch(/^\d{4}-(0[1-9]|1[0-2])$/);
    expect(cmp.empresaId().length).toBeGreaterThan(0);
    expect(cmp.tipo()).toBe('mensual');
    expect(cmp.puedeCrear()).toBe(true);
  });

  it('Test 24 — período inválido invalida el botón crear', () => {
    const cmp = crearComponente();
    cmp.setPeriodo('2026/06');
    expect(cmp.periodoEsValido()).toBe(false);
    expect(cmp.puedeCrear()).toBe(false);

    cmp.setPeriodo('2026-06');
    expect(cmp.periodoEsValido()).toBe(true);
    expect(cmp.puedeCrear()).toBe(true);
  });

  it('Test 25 — confirmar emite (creada) con NominaPeriodo válida y estado "borrador"', () => {
    const cmp = crearComponente();
    cmp.setPeriodo('2026-07');
    cmp.setTipo('extraordinaria');

    let emitted: { id: string; periodo: string; tipo: string; estado: string } | null = null;
    cmp.creada.subscribe((nomina) => {
      emitted = {
        id: nomina.id,
        periodo: nomina.periodo,
        tipo: nomina.tipo,
        estado: nomina.estado,
      };
    });

    cmp.confirmar();
    expect(emitted).not.toBeNull();
    expect(emitted!.periodo).toBe('2026-07');
    expect(emitted!.tipo).toBe('extraordinaria');
    expect(emitted!.estado).toBe('borrador');
    expect(emitted!.id).toMatch(/^nom-borrador-/);
  });

  it('Test 26 — cerrarModal emite (cerrar) sin payload', () => {
    const cmp = crearComponente();
    let cerrado = false;
    cmp.cerrar.subscribe(() => { cerrado = true; });
    cmp.cerrarModal();
    expect(cerrado).toBe(true);
  });

  it('Test 27 — confirmar con período inválido NO emite (creada)', () => {
    const cmp = crearComponente();
    cmp.setPeriodo('invalido');
    let emitidoCount = 0;
    cmp.creada.subscribe(() => { emitidoCount += 1; });
    cmp.confirmar();
    expect(emitidoCount).toBe(0);
  });
});
