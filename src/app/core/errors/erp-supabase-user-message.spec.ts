import { describe, expect, it } from 'vitest';

import { mensajeErrorSupabaseParaUsuario } from './erp-supabase-user-message';

describe('mensajeErrorSupabaseParaUsuario', () => {
  it('traduce error de api key ausente', () => {
    const msg = mensajeErrorSupabaseParaUsuario(
      { message: 'No API key found in request' },
      'cargar datos',
    );
    expect(msg).toContain('app-config.json');
    expect(msg).toContain('anon');
  });

  it('traduce configuración faltante', () => {
    const msg = mensajeErrorSupabaseParaUsuario(
      new Error('Supabase no esta configurado'),
      'iniciar',
    );
    expect(msg).toContain('app-config.json');
  });

  it('traduce tabla inexistente', () => {
    const msg = mensajeErrorSupabaseParaUsuario(
      { code: '42P01', message: 'relation does not exist' },
      'exportar',
    );
    expect(msg).toContain('tablas necesarias');
    expect(msg).toContain('exportar');
  });

  it('traduce RPC inexistente', () => {
    const msg = mensajeErrorSupabaseParaUsuario(
      { code: 'PGRST202', message: 'Could not find the function' },
      'registrar',
    );
    expect(msg).toContain('servicios necesarios');
  });

  it('traduce sesión expirada', () => {
    const msg = mensajeErrorSupabaseParaUsuario(new Error('JWT expired'), 'guardar');
    expect(msg).toContain('sesión');
  });

  it('traduce error de red', () => {
    const msg = mensajeErrorSupabaseParaUsuario(new Error('Failed to fetch'), 'consultar');
    expect(msg).toContain('conexión');
  });

  it('usa mensaje genérico con contexto', () => {
    const msg = mensajeErrorSupabaseParaUsuario(new Error('Algo raro'), 'cargar nóminas');
    expect(msg).toContain('cargar nóminas');
  });
});
