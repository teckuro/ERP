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
      message: 'Se actualizarán los parámetros del período 2026-05.',
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
    expect(buildParametrosReconciliacionDiferenciasDialog()).toMatchObject({
      kind: 'reconciliacion-diferencias',
      secondaryAction: 'actualizar-con-oficiales',
      tertiaryAction: 'revisar-despues',
    });
  });
});
