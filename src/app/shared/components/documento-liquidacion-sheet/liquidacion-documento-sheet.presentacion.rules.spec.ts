import { describe, expect, it } from 'vitest';

import { sanitizarLiquidacionDocumentoSheetVm } from './liquidacion-documento-sheet.presentacion.rules';
import type { LiquidacionDocumentoSheetVm } from './liquidacion-documento-sheet.model';

function vmBase(parcial: Partial<LiquidacionDocumentoSheetVm> = {}): LiquidacionDocumentoSheetVm {
  return {
    periodoLabel: 'mayo 2026',
    periodoCorto: 'MAY-26',
    fechaPago: null,
    empresa: { razonSocial: 'Empresa Prueba' },
    trabajador: {
      nombre: 'Ana Pérez',
      rut: '12.345.678-9',
      sueldoBase: 0,
      diasTrabajados: 30,
      afp: 'Cuprum',
      tasaAfp: 11.44,
    },
    haberesImponibles: [
      { descripcion: 'Sueldo base', monto: 900_000 },
      { descripcion: 'Línea cero', monto: 0 },
    ],
    haberesNoImponibles: [],
    descuentosLegales: [{ descripcion: 'Previsión', monto: 100_000 }],
    descuentosVoluntarios: [],
    subtotalHaberesImponibles: 900_000,
    subtotalHaberesNoImponibles: 0,
    subtotalDescuentosLegales: 100_000,
    subtotalDescuentosVoluntarios: 0,
    totalHaberes: 900_000,
    totalDescuentos: 100_000,
    baseImponiblePrevisional: 900_000,
    baseTributable: 800_000,
    cotizacionSis: 12_000,
    cotizacionSanna: 0,
    cotizacionLey16744: 0,
    liquidoAPago: 800_000,
    liquidoEnPalabras: 'ochocientos mil pesos',
    ...parcial,
  };
}

describe('sanitizarLiquidacionDocumentoSheetVm', () => {
  it('elimina líneas con monto 0 en haberes', () => {
    const resultado = sanitizarLiquidacionDocumentoSheetVm(vmBase());
    expect(resultado.haberesImponibles).toHaveLength(1);
    expect(resultado.haberesImponibles[0]?.descripcion).toBe('Sueldo base');
  });

  it('mantiene subtotales Gael aunque falten no imponibles', () => {
    const resultado = sanitizarLiquidacionDocumentoSheetVm(vmBase());
    expect(resultado.mostrarSubtotalImponibles).toBe(true);
    expect(resultado.mostrarSubtotalNoImponibles).toBe(true);
    expect(resultado.mostrarDetalle).toBe(true);
  });

  it('no muestra aportes del empleador en layout Gael', () => {
    const resultado = sanitizarLiquidacionDocumentoSheetVm(vmBase());
    expect(resultado.mostrarAportesEmpleador).toBe(false);
    expect(resultado.textoAportesEmpleador).toBeNull();
  });

  it('arma texto AFP con tasa', () => {
    const resultado = sanitizarLiquidacionDocumentoSheetVm(vmBase());
    expect(resultado.textoAfpDetalle).toBe('Cuprum (11,44%)');
    expect(resultado.valorDiasTrabajados).toBe('30');
  });

  it('muestra caja de líquido y totales en columnas', () => {
    const resultado = sanitizarLiquidacionDocumentoSheetVm(vmBase());
    expect(resultado.mostrarCajaLiquido).toBe(true);
    expect(resultado.mostrarLiquidoEnDescuentos).toBe(true);
    expect(resultado.mostrarBonificacionesVacias).toBe(true);
    expect(resultado.valorTextoLegal).toContain('Recibí a plena conformidad');
  });

  it('suma otros descuentos desde voluntarios si no vienen en cierre', () => {
    const resultado = sanitizarLiquidacionDocumentoSheetVm(
      vmBase({
        descuentosVoluntarios: [{ descripcion: 'Anticipo', monto: 50_000 }],
        subtotalDescuentosVoluntarios: 50_000,
        totalDescuentos: 150_000,
      }),
    );
    expect(resultado.montoOtrosDescuentos).toBe(50_000);
    expect(resultado.mostrarBonificacionesVacias).toBe(true);
  });

  it('separa autorizado por quien autorizó y firma del empleador', () => {
    const resultado = sanitizarLiquidacionDocumentoSheetVm(
      vmBase({
        empresa: {
          razonSocial: 'Empresa Prueba',
          nombreFirmaEmpleador: 'Juan Pérez',
        },
        cierre: {
          autorizadoPor: 'María González Rojas',
        },
      }),
    );
    expect(resultado.valorAutorizadoPor).toBe('María González Rojas');
    expect(resultado.valorFirmaEmpleador).toBe('Juan Pérez');
  });
});
