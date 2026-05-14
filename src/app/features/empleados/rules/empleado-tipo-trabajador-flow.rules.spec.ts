import { describe, expect, it } from 'vitest';

import {
  buscarTipoTrabajadorBase,
  esTipoTrabajadorBase,
  tipoTrabajadorBaseParaRelacion,
} from './empleado-tipo-trabajador-flow.rules';

describe('empleado-tipo-trabajador-flow.rules', () => {
  it('deriva DEPENDIENTE para contrato e INDEPENDIENTE para honorarios', () => {
    expect(tipoTrabajadorBaseParaRelacion('CONTRATO')).toBe('DEPENDIENTE');
    expect(tipoTrabajadorBaseParaRelacion('HONORARIOS')).toBe('INDEPENDIENTE');
  });

  it('normaliza etiquetas base sin tratar condiciones especiales como tipo trabajador', () => {
    expect(esTipoTrabajadorBase(' dependiente ', 'DEPENDIENTE')).toBe(true);
    expect(esTipoTrabajadorBase('INDEPENDIENTE', 'INDEPENDIENTE')).toBe(true);
    expect(esTipoTrabajadorBase('Dependiente pensionado', 'DEPENDIENTE')).toBe(false);
    expect(esTipoTrabajadorBase('Técnico extranjero exento', 'INDEPENDIENTE')).toBe(false);
  });

  it('encuentra el id real del catalogo por categoria base', () => {
    const options = [
      { value: 9, label: 'INDEPENDIENTE' },
      { value: 4, label: 'DEPENDIENTE' },
    ];

    expect(buscarTipoTrabajadorBase(options, 'DEPENDIENTE')?.value).toBe(4);
    expect(buscarTipoTrabajadorBase(options, 'INDEPENDIENTE')?.value).toBe(9);
  });
});
