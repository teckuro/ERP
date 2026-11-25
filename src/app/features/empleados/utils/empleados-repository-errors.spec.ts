import { buildRepositoryError } from './empleados-repository-errors';

describe('buildRepositoryError', () => {
  it('no expone el detalle técnico desconocido de Postgres', () => {
    const error = buildRepositoryError(
      'No fue posible cargar las comunas.',
      'relation "public.comuna_x" does not exist',
    );

    expect(error.message).toBe('No fue posible cargar las comunas.');
  });

  it('agrega la causa humanizada cuando RLS rechaza la escritura (SEC-08)', () => {
    const error = buildRepositoryError(
      'No fue posible guardar la ficha.',
      'new row violates row-level security policy for table "persona"',
    );

    expect(error.message).toBe(
      'No fue posible guardar la ficha. Tu perfil es de solo consulta: puedes revisar la información, pero no guardar cambios.',
    );
    expect(error.message).not.toContain('persona');
  });

  it('agrega la causa humanizada cuando la sesión expiró', () => {
    const error = buildRepositoryError('No fue posible cargar el listado de empleados.', 'JWT expired');

    expect(error.message).toContain('Su sesión expiró');
  });

  it('conserva el detalle de negocio generado por el repositorio', () => {
    const error = buildRepositoryError(
      'No fue posible validar las condiciones laborales seleccionadas.',
      'Condiciones no encontradas: NOCTURNA, ALTURA',
    );

    expect(error.message).toBe(
      'No fue posible validar las condiciones laborales seleccionadas. Condiciones no encontradas: NOCTURNA, ALTURA',
    );
  });

  it('devuelve solo el mensaje de negocio sin detalle', () => {
    expect(buildRepositoryError('No fue posible cargar los bancos.').message).toBe(
      'No fue posible cargar los bancos.',
    );
  });
});
