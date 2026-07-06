import { describe, expect, it } from 'vitest';

import type { ConceptoMantenimientoFila } from '../../haberes-descuentos/models/haber-descuento-asignacion.model';
import type { EntradaMensualPeriodo } from '../entradas/models/entrada-mensual-periodo.model';
import { advertenciasEntradasConceptoReservadoContrato } from './proceso-mensual-concepto-reservado-prevalidacion.rules';

function entrada(overrides: Partial<EntradaMensualPeriodo> = {}): EntradaMensualPeriodo {
  return {
    idEntrada: 'novedad:1',
    origen: 'novedad_mensual',
    origenId: 1,
    periodo: '2026-05',
    idPersona: 1,
    idContrato: 10,
    idConcepto: 99,
    tipoEntrada: 'haber',
    categoria: 'haber_variable',
    tipoMovimiento: 'haber',
    cantidad: null,
    unidad: null,
    monto: 100000,
    moneda: 'CLP',
    estado: 'aprobada',
    fechaEvento: null,
    observacion: null,
    referenciaExterna: null,
    requiereRevision: false,
    bloqueaProceso: false,
    warnings: [],
    metadata: {},
    ...overrides,
  };
}

function concepto(overrides: Partial<ConceptoMantenimientoFila> = {}): ConceptoMantenimientoFila {
  return {
    idConcepto: 99,
    codigo: 'SUELDO_BASE',
    codigoMotor: null,
    nombre: 'Sueldo base',
    tipo: 'HABER',
    naturaleza: 'IMPONIBLE',
    idCatalogoLre: null,
    codigoLre: null,
    nombreLre: null,
    moduloLre: null,
    grupoLre: null,
    clasificacionLre: null,
    imponible: true,
    tributable: true,
    afectaAfp: false,
    afectaSalud: false,
    afectaAfc: false,
    afectaSis: false,
    afectaLiquido: false,
    esSistema: false,
    calculoAutomatico: false,
    vigente: true,
    vigenciaInicio: null,
    vigenciaFin: null,
    ordenImpresion: 0,
    estrategiaLre: 'DIRECTO',
    requiereExportacionLre: true,
    observacionNormativaLre: null,
    ...overrides,
  };
}

describe('advertenciasEntradasConceptoReservadoContrato', () => {
  it('genera advertencia cuando hay entradas con concepto reservado', () => {
    const advertencias = advertenciasEntradasConceptoReservadoContrato(
      [entrada()],
      [concepto()],
    );

    expect(advertencias).toHaveLength(1);
    expect(advertencias[0]?.codigo).toBe('ENTRADAS_CONCEPTO_SUELDO_BASE');
    expect(advertencias[0]?.severidad).toBe('ADVERTENCIA');
  });

  it('no repite advertencia para el mismo concepto', () => {
    const advertencias = advertenciasEntradasConceptoReservadoContrato(
      [entrada(), entrada({ idEntrada: 'novedad:2', idPersona: 2 })],
      [concepto()],
    );

    expect(advertencias).toHaveLength(1);
  });

  it('ignora conceptos no reservados', () => {
    const advertencias = advertenciasEntradasConceptoReservadoContrato(
      [entrada({ idConcepto: 20 })],
      [concepto({ idConcepto: 20, codigo: 'BONO', nombre: 'Bono productividad' })],
    );

    expect(advertencias).toHaveLength(0);
  });
});
