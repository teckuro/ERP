import { evaluarConceptoAccionesPermitidas } from './concepto-acciones.rules';

const ref = new Date(2026, 4, 15);

describe('evaluarConceptoAccionesPermitidas', () => {
  it('permite revisar y asignar haber vigente; permite editar sin admin', () => {
    const a = evaluarConceptoAccionesPermitidas(
      {
        tipo: 'HABER',
        esSistema: false,
        calculoAutomatico: false,
        vigente: true,
        vigenciaInicio: '2026-01-01',
        vigenciaFin: '2026-12-31',
      },
      ref,
      false,
    );
    expect(a.puedeRevisar).toBe(true);
    expect(a.puedeAsignar).toBe(true);
    expect(a.puedeEditar).toBe(true);
    expect(a.puedeEliminar).toBe(false);
    expect(a.puedeCrear).toBe(false);
  });

  it('bloquea edición sin admin en concepto protegido', () => {
    const a = evaluarConceptoAccionesPermitidas(
      {
        tipo: 'HABER',
        esSistema: true,
        calculoAutomatico: false,
        vigente: true,
        vigenciaInicio: '2026-01-01',
        vigenciaFin: '2026-12-31',
      },
      ref,
      false,
    );
    expect(a.puedeEditar).toBe(false);
    expect(a.motivosBloqueo.length).toBeGreaterThan(0);
  });

  it('permite edición con modo admin en concepto sistema', () => {
    const a = evaluarConceptoAccionesPermitidas(
      {
        tipo: 'HABER',
        esSistema: true,
        calculoAutomatico: false,
        vigente: true,
        vigenciaInicio: null,
        vigenciaFin: null,
      },
      ref,
      true,
    );
    expect(a.puedeEditar).toBe(true);
  });
});
