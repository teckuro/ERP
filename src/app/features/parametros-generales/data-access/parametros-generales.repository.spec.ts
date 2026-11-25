import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

import { SUPABASE_CLIENT } from '../../../core/services/supabase.service';
import { ParametrosGeneralesRepository } from './parametros-generales.repository';

type Respuesta = { data: { periodo: string | null }[] | null; error: unknown };

/** Cliente falso: cada `from(tabla).select().not()` queda pendiente hasta que el test lo resuelva. */
function crearClienteDiferido() {
  const pendientes = new Map<string, (r: Respuesta) => void>();
  const from = vi.fn((tabla: string) => ({
    select: () => ({
      not: () => new Promise<Respuesta>((resolve) => pendientes.set(tabla, resolve)),
    }),
  }));
  return { cliente: { from }, from, pendientes };
}

function crearRepositorio(cliente: unknown): ParametrosGeneralesRepository {
  TestBed.configureTestingModule({
    providers: [ParametrosGeneralesRepository, { provide: SUPABASE_CLIENT, useValue: cliente }],
  });
  return TestBed.inject(ParametrosGeneralesRepository);
}

describe('ParametrosGeneralesRepository.listarPeriodosConDatosMensuales', () => {
  it('consulta las cinco tablas en paralelo y une los periodos sin duplicados, del más reciente', async () => {
    const { cliente, from, pendientes } = crearClienteDiferido();
    const repository = crearRepositorio(cliente);

    const promesa = repository.listarPeriodosConDatosMensuales();

    // Las cinco consultas salen antes de que se resuelva ninguna.
    expect(from).toHaveBeenCalledTimes(5);
    expect([...pendientes.keys()].sort()).toEqual([
      'ley_16744_parametros',
      'parametros_generales',
      'tabla_impuesto_unico',
      'tramo_carga',
      'tramo_impuesto',
    ]);

    pendientes.get('parametros_generales')!({ data: [{ periodo: '2026-10-01' }], error: null });
    pendientes.get('tramo_carga')!({ data: [{ periodo: '2026-11-01' }, { periodo: '2026-10-01' }], error: null });
    pendientes.get('tramo_impuesto')!({ data: [{ periodo: 'basura' }, { periodo: null }], error: null });
    pendientes.get('tabla_impuesto_unico')!({ data: null, error: null });
    pendientes.get('ley_16744_parametros')!({ data: [{ periodo: '2025-12-01' }], error: null });

    await expect(promesa).resolves.toEqual(['2026-11', '2026-10', '2025-12']);
  });

  it('lanza un error para el usuario si alguna consulta falla', async () => {
    const { cliente, pendientes } = crearClienteDiferido();
    const repository = crearRepositorio(cliente);

    const promesa = repository.listarPeriodosConDatosMensuales();
    for (const [tabla, resolver] of pendientes) {
      resolver(
        tabla === 'tramo_carga'
          ? { data: null, error: { message: 'JWT expired' } }
          : { data: [], error: null },
      );
    }

    await expect(promesa).rejects.toThrow(/sesión expiró/i);
  });
});
