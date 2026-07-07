import type { LiquidacionTrabajador } from '../../liquidaciones-oficiales/models/liquidacion-oficial.model';
import { evaluarAptitudPreviredTrabajador } from './previred-trabajador-validacion.rules';

function trabajador(overrides: Partial<LiquidacionTrabajador> = {}): LiquidacionTrabajador {
  return {
    idLiquidacionTrabajador: 1,
    idPersona: 10,
    idContrato: 20,
    rut: '11.111.111-1',
    nombreTrabajador: 'Pérez López Ana',
    cargo: 'Analista',
    centroCosto: null,
    fechaIngreso: '2024-01-01',
    diasTrabajados: 30,
    baseImponible: 1_000_000,
    baseTributable: 800_000,
    totalHaberes: 1_100_000,
    totalDescuentos: 200_000,
    totalAportesEmpleadorReferencia: 0,
    liquidoPagar: 900_000,
    estado: 'generada',
    observaciones: [],
    metadata: {},
    ...overrides,
  };
}

function enriquecidoOk() {
  return {
    idPersona: 10,
    idContrato: 20,
    rut: '11111111',
    dv: '1',
    apellidoPaterno: 'Pérez',
    apellidoMaterno: 'López',
    nombres: 'Ana',
    sexo: 'F' as const,
    nacionalidad: 0 as const,
    regimenPrevisional: 'AFP' as const,
    tipoTrabajador: 0,
    tipoJornada: 1 as const,
    codigoAfp: '33',
    saludTipo: 'FONASA' as const,
    codigoSalud: '07',
    seguroCesantia: false,
    cargasSimples: 0,
    cargasMaternales: 0,
    cargasInvalidas: 0,
    tramoAsignacionFamiliar: 'D',
    centroCosto: null,
  };
}

describe('previred-trabajador-validacion.rules', () => {
  it('apto cuando ficha y previsión están completas', () => {
    const r = evaluarAptitudPreviredTrabajador({
      trabajador: trabajador(),
      enriquecido: enriquecidoOk(),
    });
    expect(r.apto).toBe(true);
    expect(r.bloqueos).toHaveLength(0);
  });

  it('bloquea sin enriquecido (ficha/vista)', () => {
    const r = evaluarAptitudPreviredTrabajador({
      trabajador: trabajador(),
      enriquecido: null,
    });
    expect(r.apto).toBe(false);
    expect(r.bloqueos.some((b) => b.includes('ficha no disponible'))).toBe(true);
  });

  it('bloquea sexo faltante', () => {
    const r = evaluarAptitudPreviredTrabajador({
      trabajador: trabajador(),
      enriquecido: { ...enriquecidoOk(), sexo: null },
    });
    expect(r.apto).toBe(false);
    expect(r.bloqueos.some((b) => b.includes('sexo'))).toBe(true);
  });

  it('bloquea AFP código 00', () => {
    const r = evaluarAptitudPreviredTrabajador({
      trabajador: trabajador(),
      enriquecido: { ...enriquecidoOk(), codigoAfp: '00' },
    });
    expect(r.apto).toBe(false);
    expect(r.bloqueos.some((b) => b.includes('AFP'))).toBe(true);
  });
});
