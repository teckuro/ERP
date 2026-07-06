import { describe, expect, it } from 'vitest';

import { construirEmptySalidaExterna } from './salida-externa-vacio.rules';

describe('salida-externa-vacio.rules', () => {
  it('previred incluye copy y icono de exportación', () => {
    const vm = construirEmptySalidaExterna('previred');
    expect(vm.title).toContain('Previred');
    expect(vm.icon).toBe('upload');
    expect(vm.primaryLabel).toBe('Ir a liquidaciones oficiales');
  });

  it('lre incluye copy y icono de libro', () => {
    const vm = construirEmptySalidaExterna('lre');
    expect(vm.title).toContain('libro');
    expect(vm.icon).toBe('file-spreadsheet');
    expect(vm.chipLabel).toBe('Sin exportables');
  });
});
