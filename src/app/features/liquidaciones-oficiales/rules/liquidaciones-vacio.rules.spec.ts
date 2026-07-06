import { describe, expect, it } from 'vitest';

import { crearNominaResumen } from '../../nomina-mensual/models/nomina-periodo.models';
import {
  construirActaVaciaLiquidaciones,
  periodosEjemploResumenes,
  resolverEscenarioVacioLiquidaciones,
} from './liquidaciones-vacio.rules';

describe('liquidaciones-vacio.rules', () => {
  it('sin resúmenes resuelve sin_nominas', () => {
    expect(resolverEscenarioVacioLiquidaciones([], [])).toBe('sin_nominas');
    const acta = construirActaVaciaLiquidaciones([]);
    expect(acta.chipLabel).toBe('Sin nóminas');
    expect(acta.primaryLabel).toBe('Crear nómina en administrador');
    expect(acta.primaryFilled).toBe(true);
    expect(acta.kicker).toBe('Siguiente paso');
  });

  it('solo nóminas en borrador resuelve nominas_en_preparacion', () => {
    const resumenes = [
      crearNominaResumen({ id: 'n1', periodo: '2026-06', estado: 'borrador' }),
      crearNominaResumen({ id: 'n2', periodo: '2026-05', estado: 'aprobada' }),
    ];
    expect(resolverEscenarioVacioLiquidaciones(resumenes, [])).toBe('nominas_en_preparacion');
    const acta = construirActaVaciaLiquidaciones(resumenes);
    expect(acta.chipLabel).toBe('Nóminas en preparación');
    expect(acta.description).toContain('2 nómina(s) en curso');
    expect(acta.description).toContain('2026-06 · 2026-05');
  });

  it('nómina liquidada sin cálculo vigente resuelve sin_comprobantes', () => {
    const resumenes = [
      crearNominaResumen({
        id: 'n1',
        estado: 'liquidada',
        evidenciaCalculo: { versionCalculo: 1, calculoVigente: false },
      }),
    ];
    expect(resolverEscenarioVacioLiquidaciones(resumenes, [])).toBe('sin_comprobantes');
    const acta = construirActaVaciaLiquidaciones(resumenes);
    expect(acta.title).toBe('Sin comprobantes materializados');
  });

  it('periodosEjemploResumenes trunca a dos períodos', () => {
    const resumenes = [
      crearNominaResumen({ periodo: '2026-01' }),
      crearNominaResumen({ periodo: '2026-03' }),
      crearNominaResumen({ periodo: '2026-02' }),
    ];
    expect(periodosEjemploResumenes(resumenes)).toBe('2026-03 · 2026-02');
  });
});
