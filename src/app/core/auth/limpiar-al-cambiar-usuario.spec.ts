import { Injectable, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it, vi } from 'vitest';

import { AuthService } from './auth.service';
import { limpiarAlCambiarUsuario } from './limpiar-al-cambiar-usuario';

const limpiar = vi.fn();

@Injectable({ providedIn: 'root' })
class ServicioConCache {
  readonly generacion = limpiarAlCambiarUsuario(limpiar);
}

function preparar(usuarioInicial: string | null) {
  limpiar.mockClear();
  const usuario = signal<{ id: string } | null>(usuarioInicial ? { id: usuarioInicial } : null);
  TestBed.configureTestingModule({
    providers: [{ provide: AuthService, useValue: { currentUser: usuario } }],
  });
  TestBed.inject(ServicioConCache);
  TestBed.tick();
  return usuario;
}

function generacion(): number {
  return TestBed.inject(ServicioConCache).generacion();
}

describe('limpiarAlCambiarUsuario', () => {
  it('no limpia al crearse ni cuando se refresca la sesión del mismo usuario', () => {
    const usuario = preparar('u-1');

    usuario.set({ id: 'u-1' });
    TestBed.tick();

    expect(limpiar).not.toHaveBeenCalled();
  });

  it('limpia al cerrar sesión', () => {
    const usuario = preparar('u-1');

    usuario.set(null);
    TestBed.tick();

    expect(limpiar).toHaveBeenCalledTimes(1);
  });

  it('limpia cuando entra otro usuario en la misma pestaña', () => {
    const usuario = preparar('u-1');

    usuario.set({ id: 'u-2' });
    TestBed.tick();

    expect(limpiar).toHaveBeenCalledTimes(1);
  });

  it('la generación sube solo cuando cambia el usuario', () => {
    const usuario = preparar('u-1');
    const inicial = generacion();

    usuario.set({ id: 'u-1' });
    TestBed.tick();
    expect(generacion()).toBe(inicial);

    usuario.set(null);
    TestBed.tick();
    expect(generacion()).toBe(inicial + 1);
  });
});
