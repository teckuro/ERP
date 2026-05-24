import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { loadRuntimeConfig } from '../../config/runtime-config';
import {
  AsistentePreguntorError,
  AsistentePreguntorService,
} from './asistente-preguntor.service';
import { SUPABASE_CLIENT } from './supabase.service';

describe('AsistentePreguntorService', () => {
  let service: AsistentePreguntorService;
  let invoke: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          supabaseUrl: 'https://test.supabase.co',
          supabaseAnonKey: 'anon-key',
          asistentePreguntorFunction: 'super-service',
        }),
      }),
    );
    await loadRuntimeConfig();

    invoke = vi.fn().mockResolvedValue({
      data: { respuesta: 'Respuesta de prueba' },
      error: null,
    });

    TestBed.configureTestingModule({
      providers: [
        AsistentePreguntorService,
        {
          provide: SUPABASE_CLIENT,
          useValue: {
            auth: {
              getSession: async () => ({
                data: { session: { access_token: 'token-test' } },
              }),
            },
            functions: { invoke },
          },
        },
      ],
    });

    service = TestBed.inject(AsistentePreguntorService);
  });

  it('invoca la edge function con el body correcto', async () => {
    const texto = await service.consultar('¿Qué revisar?');
    expect(texto).toBe('Respuesta de prueba');
    expect(invoke).toHaveBeenCalledWith('super-service', {
      body: { pregunta: '¿Qué revisar?' },
    });
  });

  it('rechaza pregunta vacía', async () => {
    await expect(service.consultar('   ')).rejects.toBeInstanceOf(
      AsistentePreguntorError,
    );
    expect(invoke).not.toHaveBeenCalled();
  });
});
