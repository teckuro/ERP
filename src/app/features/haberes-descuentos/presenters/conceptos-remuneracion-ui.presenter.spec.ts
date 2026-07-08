import { describe, expect, it } from 'vitest';

import {
  chipsImpactoLiquidacionUi,
  emptyStateCatalogo,
  etiquetaReglaCalculoUi,
  etiquetaTipoConceptoHd,
  limitacionesConceptoUi,
  resumenImpactoLiquidacionUi,
  resumenLreCompacto,
  resumenPieConcepto,
  subtituloDetalleConcepto,
} from './conceptos-remuneracion-ui.presenter';

describe('conceptos-remuneracion-ui.presenter', () => {
  it('arma empty state según permiso de alta', () => {
    expect(emptyStateCatalogo(true).emptyDescription).toContain('Nuevo concepto');
    expect(emptyStateCatalogo(false).emptyDescription).toContain('administrador');
  });

  it('resume LRE en una línea compacta', () => {
    expect(
      resumenLreCompacto({
        idCatalogoLre: 1,
        codigoLre: '2101',
        nombreLre: 'Sueldo',
        moduloLre: 'Remuneraciones',
        grupoLre: 'Haberes',
        clasificacionLre: 'Imponible',
      }),
    ).toEqual({
      principal: '2101 · Sueldo — Remuneraciones',
      secundario: 'Haberes · Imponible',
    });
  });

  it('arma resumen del pie del modal', () => {
    expect(
      resumenPieConcepto({
        tipo: 'HABER',
        naturaleza: 'IMPONIBLE',
        lre: {
          idCatalogoLre: 1,
          codigoLre: '2101',
          nombreLre: 'Sueldo',
          moduloLre: 'Remuneraciones',
          grupoLre: null,
          clasificacionLre: null,
        },
        vigenciaInicio: '2026-03-01',
        vigente: true,
      }),
    ).toContain('Haber');
    expect(
      resumenPieConcepto({
        tipo: 'HABER',
        naturaleza: 'IMPONIBLE',
        lre: {
          idCatalogoLre: 1,
          codigoLre: '2101',
          nombreLre: 'Sueldo',
          moduloLre: 'Remuneraciones',
          grupoLre: null,
          clasificacionLre: null,
        },
        vigenciaInicio: '2026-03-01',
        vigente: true,
      }),
    ).toContain('LRE 2101');
    expect(
      resumenPieConcepto({
        tipo: 'HABER',
        naturaleza: 'IMPONIBLE',
        lre: {
          idCatalogoLre: 1,
          codigoLre: '2101',
          nombreLre: 'Sueldo',
          moduloLre: 'Remuneraciones',
          grupoLre: null,
          clasificacionLre: null,
        },
        vigenciaInicio: '2026-03-01',
        vigente: true,
      }),
    ).toContain('previsional');
  });

  it('resume impacto en liquidación según tipo y naturaleza', () => {
    expect(resumenImpactoLiquidacionUi('APORTE_EMPLEADOR', 'NO_IMPONIBLE')).toContain(
      'Sin impacto',
    );
    expect(resumenImpactoLiquidacionUi('HABER', 'IMPONIBLE')).toContain('previsional');
    expect(chipsImpactoLiquidacionUi('DESCUENTO', 'NO_IMPONIBLE')).toContain('Afecta líquido');
  });

  it('humaniza reglas y limitaciones', () => {
    const regla = etiquetaReglaCalculoUi({
      idReglaConceptoCalculo: 1,
      codigoRegla: 'RB01',
      baseCalculo: 'Sueldo base',
      calculoAutomatico: true,
      activo: true,
    });
    expect(regla).toContain('automática');
    expect(regla).toContain('Sueldo base');
    expect(regla).not.toContain('RB01');

    const limitaciones = limitacionesConceptoUi({
      puedeRevisar: true,
      puedeEditar: false,
      puedeEliminar: false,
      puedeAsignar: false,
      puedeCrear: true,
      motivosBloqueo: ['Edición bloqueada: concepto de sistema.'],
    });
    expect(limitaciones.some((l) => l.includes('asignación manual'))).toBe(true);
    expect(limitaciones.some((l) => l.includes('Edición bloqueada'))).toBe(true);
  });

  it('subtitulo detalle usa etiquetas RRHH', () => {
    expect(subtituloDetalleConcepto({ codigo: 'BON01', tipo: 'HABER' }, 'Vigente')).toBe(
      'BON01 · Haber · Vigente',
    );
    expect(etiquetaTipoConceptoHd('DESCUENTO')).toBe('Descuento');
  });
});
