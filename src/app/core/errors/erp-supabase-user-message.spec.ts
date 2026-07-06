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

  it('traduce plantilla mensual faltante sin jerga técnica', () => {
    const msg = mensajeErrorSupabaseParaUsuario(
      new Error('previsualizar_creacion_nomina: la empresa 1 no tiene plantilla mensual MES activa'),
      'crear la nómina',
    );
    expect(msg).toContain('configuración base');
    expect(msg).not.toContain('Plantillas de ciclos');
    expect(msg).not.toContain('npm run');
  });

  it('usa mensaje genérico con contexto', () => {
    const msg = mensajeErrorSupabaseParaUsuario(new Error('Algo raro'), 'cargar nóminas');
    expect(msg).toBe('No se pudo cargar nóminas. Intente de nuevo o contacte a soporte.');
  });

  it('traduce columna BD faltante', () => {
    const msg = mensajeErrorSupabaseParaUsuario(
      { code: '42703', message: 'column "motivo_cierre" does not exist' },
      'crear la nómina',
    );
    expect(msg).toContain('desactualizado');
  });
});
