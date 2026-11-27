import { describe, expect, it } from 'vitest';

import {
  buildParametrosConfirmacionModificacionDialog,
  buildParametrosConfirmarAbandonarEdicionDialog,
  buildParametrosDecisionConfigClienteDialog,
  buildParametrosErrorCargaDialog,
  buildParametrosExitoClienteConfigDialog,
  buildParametrosFormularioInvalidoDialog,
  buildParametrosReconciliacionDiferenciasDialog,
  detalleDiferenciasOficialesCliente,
} from './parametros-dialog.rules';

describe('parametros-dialog.rules', () => {
  it('construye confirmación de modificación con período formateado', () => {
    expect(buildParametrosConfirmacionModificacionDialog('2026-05')).toMatchObject({
      kind: 'confirmar-guardado',
      variant: 'warning',
      title: 'Confirmar modificación',
      sections: expect.any(Array),
      primaryLabel: 'Confirmar modificación',
      secondaryLabel: 'Cancelar',
    });
  });

  it('describe origen de configuración cliente desde referencia con periodo formateado', () => {
    expect(buildParametrosExitoClienteConfigDialog('2026-05', 'referencia', '2026-04').detail).toBe(
      'Base utilizada: referencia de Abril 2026.',
    );
  });

  it('limita decisión de configuración cliente a tres acciones auxiliares', () => {
    const dialog = buildParametrosDecisionConfigClienteDialog('2026-05', [
      { label: 'Usar oficiales', action: 'usar-oficiales' },
      { label: 'Usar referencia anterior', action: 'usar-referencia' },
      { label: 'Usar última configuración', action: 'usar-ultima-config' },
    ]);

    expect(dialog.secondaryAction).toBe('usar-oficiales');
    expect(dialog.tertiaryAction).toBe('usar-referencia');
    expect(dialog.fourthAction).toBe('usar-ultima-config');
    expect(dialog.primaryLabel).toBe('Crear desde cero');
  });

  it('expone acciones de reconciliación sin mutar datos', () => {
    expect(
      buildParametrosReconciliacionDiferenciasDialog('2026-05', [{ campo: 'uf', oficial: 38000, cliente: 40000 }]),
    ).toMatchObject({
      kind: 'reconciliacion-diferencias',
      title: 'Diferencias con los datos oficiales',
      message: expect.stringContaining('No se actualizará nada automáticamente'),
      detail: expect.stringContaining('UF'),
      secondaryAction: 'actualizar-con-oficiales',
      tertiaryAction: 'revisar-despues',
    });
  });

  it('detalle de diferencias usa etiqueta RRHH para tope AFP en UF', () => {
    const detalle = detalleDiferenciasOficialesCliente('2026-05', [
      { campo: 'topeAfpUf', oficial: 87.8, cliente: 99 },
    ]);

    expect(detalle).toContain('Tope AFP (UF)');
    expect(detalle).not.toContain('topeAfpUf');
  });

  it('detalle advierte desviacion extrema respecto al valor oficial', () => {
    const detalle = detalleDiferenciasOficialesCliente('2026-05', [
      { campo: 'uf', oficial: 38000, cliente: 6_000_000 },
    ]);

    expect(detalle).toContain('El valor guardado se aparta mucho del oficial del mes');
    expect(detalle).toContain('UF');
  });

  it('detalle indica comparacion con referencia de otro periodo formateado', () => {
    const detalle = detalleDiferenciasOficialesCliente(
      '2026-05',
      [{ campo: 'uf', oficial: 38000, cliente: 40000 }],
      { periodoReferenciaOficial: '2026-04' },
    );

    expect(detalle).toContain('Comparación con referencia del período Abril 2026');
  });

  it('form inválido lista campos pendientes cuando se le pasan', () => {
    const dialog = buildParametrosFormularioInvalidoDialog(['UF', 'UTM']);
    expect(dialog.detail).toBe('Campos por corregir: UF, UTM.');
  });

  it('form inválido sin lista muestra mensaje genérico', () => {
    const dialog = buildParametrosFormularioInvalidoDialog();
    expect(dialog.detail).toContain('campos obligatorios');
  });

  it('error de carga envuelve detalle técnico con etiqueta neutra', () => {
    const dialog = buildParametrosErrorCargaDialog('PGRST116: violates RLS policy', '2026-05');
    expect(dialog.detail).toContain('Código técnico (uso interno): PGRST116');
    expect(dialog.detail).toContain('Mayo 2026');
  });

  it('confirmar abandono de edición ofrece descartar o seguir editando', () => {
    const dialog = buildParametrosConfirmarAbandonarEdicionDialog();
    expect(dialog).toMatchObject({
      kind: 'confirmar-abandonar-edicion',
      variant: 'confirm',
      title: 'Cambios sin guardar',
      primaryLabel: 'Descartar y cambiar',
      secondaryLabel: 'Seguir editando',
    });
  });

  it('confirmar abandono al cancelar no habla de cambiar de período', () => {
    const dialog = buildParametrosConfirmarAbandonarEdicionDialog('cancelar');
    expect(dialog.primaryLabel).toBe('Descartar cambios');
    expect(dialog.message).not.toContain('período');
  });

  it('detalle de diferencias muestra cifras con formato y unidad', () => {
    const detalle = detalleDiferenciasOficialesCliente('2026-11', [
      { campo: 'uf', oficial: 41439.89, cliente: 41000 },
      { campo: 'topeAfpUf', oficial: 90, cliente: 87.8 },
      { campo: 'sis', oficial: 1.79, cliente: 1.5 },
      { campo: 'saludCcaf', oficial: 4.2, cliente: 4 },
    ]);

    expect(detalle).toContain('UF: $41.439,89 oficial, $41.000,00 en tu configuración');
    expect(detalle).toContain('Tope AFP (UF): 90 UF oficial, 87,8 UF en tu configuración');
    expect(detalle).toContain('SIS: 1,79 % oficial, 1,5 % en tu configuración');
    expect(detalle).toContain('Salud CCAF');
    expect(detalle).not.toContain('saludCcaf');
  });
});
