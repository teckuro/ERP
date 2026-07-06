import { describe, expect, it } from 'vitest';

import {
  buscarControlPorRuta,
  esCampoFormularioEnfocable,
  obtenerCampoEnfocable,
} from './empleado-alta-foco.util';

describe('empleado-alta-foco.util', () => {
  it('obtiene input enfocable por data-field-path', () => {
    const host = document.createElement('div');
    host.innerHTML = `
      <input data-field-path="datosPersonales.rut" type="text" />
    `;

    const field = buscarControlPorRuta(host, 'datosPersonales.rut');
    expect(field?.tagName).toBe('INPUT');
  });

  it('obtiene input dentro de host con data-field-path', () => {
    const host = document.createElement('div');
    const wrapper = document.createElement('app-calendar-input');
    wrapper.setAttribute('data-field-path', 'datosPersonales.fechaNacimiento');
    const input = document.createElement('input');
    wrapper.appendChild(input);
    host.appendChild(wrapper);

    const field = buscarControlPorRuta(host, 'datosPersonales.fechaNacimiento');
    expect(field).toBe(input);
  });

  it('esCampoFormularioEnfocable reconoce button habilitado', () => {
    const btn = document.createElement('button');
    expect(esCampoFormularioEnfocable(btn)).toBe(true);
    expect(obtenerCampoEnfocable(btn)).toBe(btn);
  });
});
