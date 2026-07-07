import { describe, expect, it } from 'vitest';

import { crearNominaResumen } from '../../nomina-mensual/models/nomina-periodo.models';
import { puedeExportarPreviredNomina } from './previred-exportacion-ui.rules';

describe('previred-exportacion-ui.rules', () => {
  it('permite exportar nómina liquidada con trabajadores', () => {
    const nomina = crearNominaResumen({ estado: 'liquidada', totalTrabajadores: 3 });
    expect(puedeExportarPreviredNomina(nomina)).toBe(true);
  });

  it('bloquea nómina sin trabajadores o en borrador', () => {
    expect(puedeExportarPreviredNomina(crearNominaResumen({ estado: 'liquidada', totalTrabajadores: 0 }))).toBe(false);
    expect(puedeExportarPreviredNomina(crearNominaResumen({ estado: 'aprobada', totalTrabajadores: 2 }))).toBe(false);
  });

  it('acepta cabecera de nómina con trabajadorIds', () => {
    expect(
      puedeExportarPreviredNomina({ estado: 'cerrada', trabajadorIds: ['1', '2'] }),
    ).toBe(true);
  });
});
