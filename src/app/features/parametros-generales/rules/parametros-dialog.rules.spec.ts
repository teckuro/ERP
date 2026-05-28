import { describe, expect, it } from 'vitest';

import {
  buildParametrosConfirmacionModificacionDialog,
  buildParametrosDecisionConfigClienteDialog,
  buildParametrosExitoClienteConfigDialog,
  buildParametrosReconciliacionDiferenciasDialog,
} from './parametros-dialog.rules';

describe('parametros-dialog.rules', () => {
  it('construye confirmación de modificación con período', () => {
    expect(buildParametrosConfirmacionModificacionDialog('2026-05')).toMatchObject({
      kind: 'confirmar-guardado',
      variant: 'warning',
      message: 'Revisa el impacto antes de actualizar la configuración cliente.',
      sections: expect.any(Array),
      secondaryLabel: 'Cancelar',
    });
  });

  it('describe origen de configuración cliente desde referencia', () => {
    expect(buildParametrosExitoClienteConfigDialog('2026-05', 'referencia', '2026-04').detail).toBe(
      'Configuración creada desde referencia 2026-04.',
    );
  });

  it('limita decisión de configuración cliente a dos acciones auxiliares', () => {
    const dialog = buildParametrosDecisionConfigClienteDialog('2026-05', [
      { label: 'Usar oficiales', action: 'usar-oficiales' },
      { label: 'Usar referencia anterior', action: 'usar-referencia' },
    ]);

    expect(dialog.secondaryAction).toBe('usar-oficiales');
    expect(dialog.tertiaryAction).toBe('usar-referencia');
    expect(dialog.primaryLabel).toBe('Crear desde cero');
  });

  it('expone acciones de reconciliación sin mutar datos', () => {
    expect(buildParametrosReconciliacionDiferenciasDialog('2026-05', [{ campo: 'uf', oficial: 38000, cliente: 40000 }])).toMatchObject({
      kind: 'reconciliacion-diferencias',
      title: 'Configuración distinta a los parámetros oficiales del mes',
      message: expect.stringContaining('no coinciden con la carga oficial del mes'),
      detail: expect.stringContaining('UF'),
      secondaryAction: 'actualizar-con-oficiales',
      tertiaryAction: 'revisar-despues',
    });
  });
});
