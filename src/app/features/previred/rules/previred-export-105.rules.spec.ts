import type { LiquidacionTrabajador } from '../../liquidaciones-oficiales/models/liquidacion-oficial.model';
import { construirArchivo105Previred } from './previred-export-105.rules';

function trabajador(overrides: Partial<LiquidacionTrabajador> = {}): LiquidacionTrabajador {
  return {
    idLiquidacionTrabajador: 1,
    idPersona: 10,
    idContrato: 20,
    rut: '11.111.111-1',
    nombreTrabajador: 'Pérez López Ana',
    cargo: 'Analista',
    centroCosto: 'CC01',
    fechaIngreso: '2024-01-01',
    diasTrabajados: 30,
    baseImponible: 1_500_000,
    baseTributable: 1_200_000,
    totalHaberes: 1_600_000,
    totalDescuentos: 300_000,
    totalAportesEmpleadorReferencia: 50_000,
    liquidoPagar: 1_300_000,
    estado: 'generada',
    observaciones: [],
    metadata: {},
    ...overrides,
  };
}

describe('previred-export-105.rules', () => {
  it('genera archivo 861 chars por trabajador con campos reforma', () => {
    const archivo = construirArchivo105Previred({
      periodo: '2026-08',
      catalogoCampoArchivo: [],
      parametrosEmpresa: {
        codigoCcaf: '01',
        codigoMutual: '01',
        tasaExpectativaVida: 0.009,
      },
      trabajadores: [
        {
          trabajador: trabajador(),
          conceptos: [
            {
              idLiquidacionConcepto: 1,
              idLiquidacionTrabajador: 1,
              idConcepto: 1,
              codigo: 'AFP',
              codigoLre: '3141',
              nombre: 'AFP',
              tipo: 'descuento',
              clasificacion: 'descuento_legal',
              cantidad: null,
              base: null,
              tasa: null,
              monto: 165_000,
              orden: 1,
              metadata: {},
            },
          ],
          enriquecido: {
            idPersona: 10,
            idContrato: 20,
            rut: '11111111',
            dv: '1',
            apellidoPaterno: 'Pérez',
            apellidoMaterno: 'López',
            nombres: 'Ana',
            sexo: 'F',
            nacionalidad: 0,
            regimenPrevisional: 'AFP',
            tipoTrabajador: 0,
            tipoJornada: 1,
            codigoAfp: '33',
            saludTipo: 'FONASA',
            codigoSalud: '07',
            seguroCesantia: false,
            cargasSimples: 0,
            cargasMaternales: 0,
            cargasInvalidas: 0,
            tramoAsignacionFamiliar: 'D',
            centroCosto: 'CC01',
          },
          novedades: [],
          rentaImponibleMesAnterior: null,
        },
      ],
    });

    expect(archivo.totalLineas).toBe(1);
    expect(archivo.listoParaEnvio105).toBe(true);
    const linea = archivo.contenido.split('\r\n')[0];
    expect(linea.length).toBe(861);
    expect(linea.slice(748, 756)).toBe('00000001');
  });
});
