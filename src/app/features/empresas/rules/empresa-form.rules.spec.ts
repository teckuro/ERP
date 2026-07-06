import { validarEmpresaForm, crearEmpresaFormVacio } from './empresa-form.rules';

describe('empresa-form.rules', () => {
  it('exige razón social y RUT válido', () => {
    const payload = crearEmpresaFormVacio();
    payload.razonSocial = '';
    const result = validarEmpresaForm(payload, '12345678-9');
    expect(result.valido).toBe(false);
    expect(result.errores).toContain('Indica la razón social.');
  });

  it('exige organismo mutual cuando aplica mutual', () => {
    const payload = {
      ...crearEmpresaFormVacio(),
      razonSocial: 'Empresa Prueba',
      rut: '12345678',
      dv: '9',
      aplicaMutual: true,
      idOrganismoMutual: null,
    };
    const result = validarEmpresaForm(payload, '12.345.678-9');
    expect(result.valido).toBe(false);
    expect(result.errores).toContain('Selecciona el organismo mutual.');
  });

  it('acepta empresa sin mutual', () => {
    const payload = {
      ...crearEmpresaFormVacio(),
      razonSocial: 'Empresa Prueba',
      rut: '12345678',
      dv: '9',
      aplicaMutual: false,
    };
    const result = validarEmpresaForm(payload, '12.345.678-9');
    expect(result.valido).toBe(true);
  });
});
