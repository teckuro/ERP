import { describe, expect, it } from 'vitest';

import { ParametrosValoresTabComponent } from './parametros-valores-tab.component';

function tab(periodoYm: string, periodoIndicadoresYm: string | null, editable = false): ParametrosValoresTabComponent {
  const componente = new ParametrosValoresTabComponent();
  componente.periodoYm = periodoYm;
  componente.periodoIndicadoresYm = periodoIndicadoresYm;
  componente.officialEditable = editable;
  return componente;
}

describe('ParametrosValoresTabComponent.notaUf', () => {
  it('con carga oficial del mes, la UF es la del último día del período', () => {
    expect(tab('2026-11', '2026-11').notaUf).toBe('Valor al último día del período (30 nov 2026)');
  });

  it('sin carga oficial, avisa que la UF mostrada es la de la referencia', () => {
    expect(tab('2026-12', '2026-11').notaUf).toBe(
      'Referencia: valor al 30 nov 2026. Falta la carga oficial del período.',
    );
  });

  it('en edición se captura la UF del período seleccionado', () => {
    expect(tab('2026-12', '2026-11', true).notaUf).toBe('Valor al último día del período (31 dic 2026)');
  });
});
