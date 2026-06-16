import { TestBed } from '@angular/core/testing';
import { describe, expect, it, vi } from 'vitest';

import { UsuarioPreferenciaUiService } from './usuario-preferencia-ui.service';
import { SUPABASE_CLIENT } from './supabase.service';

describe('UsuarioPreferenciaUiService', () => {
  it('estaEstablecida delega en preferencia_ui_establecida', async () => {
    const rpc = vi.fn().mockResolvedValue({ data: true, error: null });
    TestBed.configureTestingModule({
      providers: [{ provide: SUPABASE_CLIENT, useValue: { rpc } }],
    });
    const service = TestBed.inject(UsuarioPreferenciaUiService);
    await expect(service.estaEstablecida('nomina.calculo.expand_desglose.v1')).resolves.toBe(
      true,
    );
    expect(rpc).toHaveBeenCalledWith('preferencia_ui_establecida', {
      p_clave: 'nomina.calculo.expand_desglose.v1',
    });
  });

  it('guardar delega en guardar_preferencia_ui', async () => {
    const rpc = vi.fn().mockResolvedValue({ data: null, error: null });
    TestBed.configureTestingModule({
      providers: [{ provide: SUPABASE_CLIENT, useValue: { rpc } }],
    });
    const service = TestBed.inject(UsuarioPreferenciaUiService);
    await service.guardar('nomina.calculo.expand_desglose.v1', { cerrado: true });
    expect(rpc).toHaveBeenCalledWith('guardar_preferencia_ui', {
      p_clave: 'nomina.calculo.expand_desglose.v1',
      p_valor: { cerrado: true },
    });
  });
});
