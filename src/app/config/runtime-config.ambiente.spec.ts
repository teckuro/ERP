import { describe, expect, it } from 'vitest';

import { etiquetaAmbiente } from './runtime-config';

describe('etiquetaAmbiente', () => {
  it('muestra DEV siempre que la base es la de pruebas', () => {
    expect(etiquetaAmbiente('dev', 'localhost')).toBe('dev');
    expect(etiquetaAmbiente('dev', 'erp-preview.vercel.app')).toBe('dev');
  });

  it('advierte PRODUCCIÓN cuando se usa la base real desde un equipo local', () => {
    expect(etiquetaAmbiente('prod', 'localhost')).toBe('prod-local');
    expect(etiquetaAmbiente('prod', '127.0.0.1')).toBe('prod-local');
    expect(etiquetaAmbiente(undefined, 'localhost')).toBe('prod-local');
  });

  it('no muestra aviso en el sitio publicado', () => {
    expect(etiquetaAmbiente('prod', 'erp-beta-bay.vercel.app')).toBeNull();
  });
});
