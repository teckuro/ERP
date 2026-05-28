import { describe, expect, it } from 'vitest';

import {
  contieneNomenclaturaTecnica,
  extraerCamposFaltaDatoOficial,
  extraerCamposOficialesPendientes,
  humanizarFaltaDatoOficial,
  humanizarPendienteActa,
  limpiarCopyTecnicoNomina,
  limpiarYUnirMensajes,
  mensajeCampoOficialEnCero,
  mensajeFaltaCampoOficial,
} from './proceso-mensual-copy-limpio.rules';

describe('proceso-mensual-copy-limpio.rules', () => {
  it('es null-safe', () => {
    expect(limpiarCopyTecnicoNomina(null)).toBe('');
    expect(limpiarCopyTecnicoNomina(undefined)).toBe('');
    expect(limpiarCopyTecnicoNomina('   ')).toBe('');
  });

  it('reemplaza parametros_generales', () => {
    expect(limpiarCopyTecnicoNomina('parametros_generales')).toBe('Parámetros generales del período');
  });

  it('limpia ruta parametros_generales.sanna del motor', () => {
    const salida = limpiarCopyTecnicoNomina(
      'SANNA no definido en parametros_generales.sanna; queda pendiente sin afectar liquido trabajador.',
    );
    expect(salida).not.toMatch(/per[ií]odo\.sanna/i);
    expect(salida).toContain('SANNA');
    expect(salida).toContain('líquido del trabajador');
  });

  it('reemplaza periodo_remuneracion', () => {
    expect(limpiarCopyTecnicoNomina('periodo_remuneracion')).toBe('Calendario del período');
  });

  it('reemplaza sis_fila_mensual', () => {
    expect(limpiarCopyTecnicoNomina('sis_fila_mensual')).toBe('Dato SIS mensual');
  });

  it('reemplaza sis_null', () => {
    expect(limpiarCopyTecnicoNomina('sis_null')).toContain('SIS');
    expect(limpiarCopyTecnicoNomina('sis_null')).not.toContain('sis_null');
  });

  it('reemplaza FALTANTE', () => {
    expect(limpiarCopyTecnicoNomina('FALTANTE')).toBe('pendiente');
  });

  it('elimina punto y coma iniciales finales y entre fragmentos', () => {
    expect(limpiarCopyTecnicoNomina('; Falta valor SIS')).toBe('Falta valor SIS');
    expect(limpiarCopyTecnicoNomina('Falta valor SIS;')).toBe('Falta valor SIS');
    expect(limpiarCopyTecnicoNomina('parametros_generales; sis_null;')).not.toContain(';');
    expect(limpiarCopyTecnicoNomina('Parámetros generales; SIS no disponible;')).toBe(
      'Parámetros generales. SIS no disponible',
    );
  });

  it('transforma snake_case desconocido en texto humano', () => {
    const salida = limpiarCopyTecnicoNomina('base_calculo_sis');
    expect(salida).toBe('Base calculo SIS');
    expect(contieneNomenclaturaTecnica(salida)).toBe(false);
    expect(limpiarCopyTecnicoNomina('asd_dasd_sda')).not.toMatch(/asd_dasd_sda/);
  });

  it('no altera texto ya correcto', () => {
    const texto = 'Revise trabajadores y parámetros antes de confirmar la nómina.';
    expect(limpiarCopyTecnicoNomina(texto)).toBe(texto);
  });

  it('une mensajes sin punto y coma crudo', () => {
    const unido = limpiarYUnirMensajes([
      'parametros_generales FALTANTE',
      'sis_null',
    ]);
    expect(unido).not.toContain(';');
    expect(unido).not.toContain('sis_null');
  });

  it('detecta nomenclatura tecnica', () => {
    expect(contieneNomenclaturaTecnica('parametros_generales')).toBe(true);
    expect(contieneNomenclaturaTecnica('Parámetros del período')).toBe(false);
  });

  it('humaniza Falta dato oficial con campo sanna', () => {
    const salida = humanizarFaltaDatoOficial('Falta dato oficial: sanna.');
    expect(salida).toContain('SANNA');
    expect(salida).not.toMatch(/\bsanna\b/);
    expect(salida).toContain('datos oficiales del período');
  });

  it('extraerCamposOficialesPendientes deduplica y distingue cero', () => {
    expect(
      extraerCamposFaltaDatoOficial(
        'Falta dato oficial: sanna. Falta dato oficial: uf. Falta dato oficial: sanna.',
      ),
    ).toEqual(['sanna', 'uf']);
    expect(
      extraerCamposOficialesPendientes('Dato oficial en cero: uf. Falta dato oficial: utm.'),
    ).toEqual(expect.arrayContaining([
      { campo: 'uf', motivo: 'cero' },
      { campo: 'utm', motivo: 'falta' },
    ]));
    expect(mensajeFaltaCampoOficial('uf')).toContain('UF mensual');
    expect(mensajeCampoOficialEnCero('uf')).toContain('no puede quedar en cero');
    expect(
      extraerCamposOficialesPendientes(
        'El valor UF mensual no puede quedar en cero en datos oficiales del período.',
      ),
    ).toEqual([{ campo: 'uf', motivo: 'cero' }]);
  });

  it('humanizarPendienteActa quita prefijo duplicado de parámetros', () => {
    const { titulo, descripcion } = humanizarPendienteActa(
      'Parámetros del período pendientes',
      'Parámetros del período pendientes: Falta dato oficial: sanna.',
    );
    expect(titulo).toBe('Datos oficiales del período');
    expect(descripcion).toContain('SANNA');
    expect(descripcion).not.toMatch(/Parámetros del período pendientes:/i);
  });
});
