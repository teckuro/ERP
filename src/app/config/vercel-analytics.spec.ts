import { sanitizarEvento } from './vercel-analytics';

describe('sanitizarEvento (Vercel Analytics)', () => {
  const origen = 'https://erp.example.app';
  const limpiar = (ruta: string) =>
    sanitizarEvento({ type: 'pageview', url: origen + ruta })?.url.replace(origen, '');

  it('reemplaza UUID, ids numéricos y RUT por [id]', () => {
    expect(limpiar('/empleados/8f3c1a2b-1111-2222-3333-444455556666')).toBe('/empleados/[id]');
    expect(limpiar('/remuneraciones/nominas/45/generador')).toBe('/remuneraciones/nominas/[id]/generador');
    expect(limpiar('/empleados/12.345.678-K')).toBe('/empleados/[id]');
  });

  it('quita query string y hash (filtros y tokens de Supabase)', () => {
    expect(limpiar('/empleados?rut=12345678-9')).toBe('/empleados');
    expect(limpiar('/actualizar-contrasena#access_token=abc')).toBe('/actualizar-contrasena');
  });

  it('deja intactas las rutas sin datos sensibles', () => {
    expect(limpiar('/parametros')).toBe('/parametros');
  });

  it('descarta eventos con URL inválida', () => {
    expect(sanitizarEvento({ type: 'pageview', url: 'no-es-url' })).toBeNull();
  });
});
