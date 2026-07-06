import { describe, expect, it } from 'vitest';

import { puedeEditarTipoConcepto, resolverConceptoPermisosUi } from './concepto-permisos.rules';

describe('concepto-permisos.rules', () => {
  it('APORTE solo editable por administrador remuneraciones', () => {
    const operador = resolverConceptoPermisosUi('operador_remuneraciones');
    const admin = resolverConceptoPermisosUi('admin_remuneraciones');
    expect(puedeEditarTipoConcepto('APORTE_EMPLEADOR', operador)).toBe(false);
    expect(puedeEditarTipoConcepto('APORTE_EMPLEADOR', admin)).toBe(true);
    expect(puedeEditarTipoConcepto('HABER', operador)).toBe(true);
  });

  it('consulta no puede editar catálogo', () => {
    const permisos = resolverConceptoPermisosUi('consulta_remuneraciones');
    expect(permisos.puedeEditarCatalogo).toBe(false);
    expect(permisos.esSoloConsulta).toBe(true);
  });
});
