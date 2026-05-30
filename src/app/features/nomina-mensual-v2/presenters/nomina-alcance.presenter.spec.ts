import type { FilaEmpleadoNomina } from './nomina-empleados-grid.presenter';
import { calcularResultadoAlcance } from './nomina-alcance.presenter';

function fila(id: string, centroCosto = 'Administración'): FilaEmpleadoNomina {
  return {
    id,
    nombreCompleto: `Trabajador ${id}`,
    rut: '12.345.678-9',
    cargo: 'Analista',
    centroCosto,
    jornada: 'Completa',
    estadoNomina: 'listo',
    etiquetaEstadoNomina: 'Listo',
    datosBancarios: 'completo',
    etiquetaDatosBancarios: 'Completo',
    contrato: 'vigente',
    etiquetaContrato: 'Vigente',
    documentacion: 'completa',
    etiquetaDocumentacion: 'Completa',
    afpSaludAsignada: true,
    etiquetaAfpSalud: 'Asignada',
  };
}

describe('nomina-alcance.presenter', () => {
  const filas = [fila('1'), fila('2', 'Operaciones')];

  it('bloquea avance sin trabajadores incluidos en seleccion manual', () => {
    const resultado = calcularResultadoAlcance({
      tipo: 'seleccionManual',
      filas,
      idsTrabajadoresManuales: [],
    });

    expect(resultado.estado).toBe('bloqueado');
    expect(resultado.idsTrabajadoresIncluidos).toEqual([]);
  });

  it('incluye todos los trabajadores en empresa completa', () => {
    const resultado = calcularResultadoAlcance({
      tipo: 'empresaCompleta',
      filas,
    });

    expect(resultado.idsTrabajadoresIncluidos).toEqual(['1', '2']);
    expect(resultado.resumen.trabajadoresIncluidos).toBe(2);
  });

  it('filtra por centro de costo en alcance grupo', () => {
    const resultado = calcularResultadoAlcance({
      tipo: 'grupo',
      filas,
      centrosCostoSeleccionados: ['Operaciones'],
    });

    expect(resultado.idsTrabajadoresIncluidos).toEqual(['2']);
  });
});
