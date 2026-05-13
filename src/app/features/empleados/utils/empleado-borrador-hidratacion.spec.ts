import { EmpleadoFichaDetalle } from '../models/empleado-listado.model';
import { normalizarBorradorAvanzadoParaFormulario } from './empleado-borrador-hidratacion';

type FichaFormValue = EmpleadoFichaDetalle['formValue'];

function formValue(overrides: Partial<FichaFormValue> = {}): FichaFormValue {
  return {
    datosPersonales: {
      rut: '12.345.678-5',
      nombres: 'Test',
      apellidoPaterno: 'Borrador',
      apellidoMaterno: '',
      fechaNacimiento: '1990-01-01',
      sexo: 'F',
      pasaporte: '',
      idPais: 1,
      estadoCivil: 'SOLTERO',
    },
    contacto: {
      email: '',
      telefono: '',
      direccion: '\u2014',
      numeroDireccion: '',
      departamentoDireccion: '',
      observacionesDireccion: '',
      idComuna: 100,
    },
    contrato: {
      relacionLaboral: 'CONTRATO',
      idSucursal: 1,
      idDepartamentoEmpresa: 2,
      idCentroCosto: null,
      cargo: 'Sin cargo',
      fechaContrato: '2026-05-02',
      tipoContrato: 'INDEFINIDO',
      idTipoTrabajador: 10,
      idTipoJornada: 20,
      seguroCesantia: true,
      fechaIngreso: '2026-05-02',
      fechaTermino: '',
      sueldoBase: 0,
      idMoneda: 30,
      sueldoVariable: false,
      horasSemanales: 45,
      diasSemanales: 5,
      distribucionJornada: '',
      tiempoColacionMinutos: null,
      tipoGratificacion: 'LEGAL_ART_50',
      gratificacionProporcional: false,
      semanaCorridaActiva: false,
      semanaCorridaDiasLaborables: [],
      zonaExtremaActiva: false,
      zonaExtremaTerritorio: '',
      zonaExtremaPorcentaje: null,
      estado: 'borrador',
      cargas: 0,
      idTramoCarga: null,
    },
    perfilLaboral: {
      pensionado: false,
      pensionadoInvalidezParcial: false,
      pensionadoInvalidezTotal: false,
      exentoCotizacionPension: false,
      trabajadorAdolescenteProtegido: false,
      autorizacionMenorRegistrada: false,
      tecnicoExtranjeroExento: false,
      discapacidad: false,
      vigenciaInicio: '2026-05-02',
      vigenciaFin: '',
      respaldoRegistrado: false,
      observacion: '',
    },
    previsionSalud: {
      tipoRegimenPrevisional: 'NINGUNA',
      idAfp: null,
      idMonedaCuenta2: null,
      valorCuenta2: null,
      idEntidadPrevisionalIps: null,
      idExCajaPrevisional: null,
      idRegimenExCaja: null,
      nombreExCaja: '',
      regimenExCaja: '',
      tasaExCaja: null,
      idSalud: null,
      idMonedaPlan: null,
      valorPlan: null,
      adicionalAugeGes: null,
      tieneApv: false,
      idInstitucionApv: null,
      idMonedaApv: null,
      montoApv: null,
      idFormaPagoApv: null,
      depositoConvenidoApvi: null,
    },
    bancario: {
      idBanco: 5,
      idTipoCuentaBancaria: 6,
      numeroCuenta: 'DRAFT-ABC123',
    },
    ...overrides,
  };
}

describe('normalizarBorradorAvanzadoParaFormulario', () => {
  it('limpia cuenta DRAFT y deja banco pendiente', () => {
    const normalized = normalizarBorradorAvanzadoParaFormulario(formValue(), 7);

    expect(normalized.bancario['numeroCuenta']).toBe('');
    expect(normalized.bancario['idBanco']).toBeNull();
    expect(normalized.bancario['idTipoCuentaBancaria']).toBeNull();
  });

  it('limpia cargo Sin cargo y fechas tecnicas del contrato', () => {
    const normalized = normalizarBorradorAvanzadoParaFormulario(formValue(), 2);

    expect(normalized.contrato['cargo']).toBe('');
    expect(normalized.contrato['fechaIngreso']).toBe('');
    expect(normalized.contrato['fechaContrato']).toBe('');
  });

  it('limpia sueldo base cero para que remuneracion quede pendiente', () => {
    const normalized = normalizarBorradorAvanzadoParaFormulario(formValue(), 3);

    expect(normalized.contrato['sueldoBase']).toBeNull();
  });

  it('no hidrata NINGUNA como regimen previsional real en borrador', () => {
    const normalized = normalizarBorradorAvanzadoParaFormulario(formValue(), 5);

    expect(normalized.previsionSalud['tipoRegimenPrevisional']).toBeNull();
  });

  it('limpia pasos futuros cuando el paso guardado es 2', () => {
    const normalized = normalizarBorradorAvanzadoParaFormulario(formValue(), 2);

    expect(normalized.contrato['idTipoTrabajador']).toBeNull();
    expect(normalized.contrato['idTipoJornada']).toBeNull();
    expect(normalized.contrato['tipoContrato']).toBeNull();
    expect(normalized.contrato['tipoGratificacion']).toBeNull();
    expect(normalized.previsionSalud['tipoRegimenPrevisional']).toBeNull();
    expect(normalized.bancario['numeroCuenta']).toBe('');
  });

  it('sin sueldo base valido elimina ids de jornada aunque el paso guardado sea 5', () => {
    const base = formValue();
    const normalized = normalizarBorradorAvanzadoParaFormulario(
      {
        ...base,
        perfilLaboral: {
      pensionado: false,
      pensionadoInvalidezParcial: false,
      pensionadoInvalidezTotal: false,
      exentoCotizacionPension: false,
      trabajadorAdolescenteProtegido: false,
      autorizacionMenorRegistrada: false,
      tecnicoExtranjeroExento: false,
      discapacidad: false,
      vigenciaInicio: '2026-05-02',
      vigenciaFin: '',
      respaldoRegistrado: false,
      observacion: '',
    },
    previsionSalud: {
          ...base.previsionSalud,
          tipoRegimenPrevisional: 'AFP',
          idAfp: 1,
          idSalud: 2,
          idMonedaPlan: 1,
          valorPlan: 10000,
          adicionalAugeGes: 0,
        },
        contrato: {
          ...base.contrato,
          sueldoBase: 0,
          idTipoTrabajador: 88,
          idTipoJornada: 2,
          idMoneda: 30,
          horasSemanales: 45,
          diasSemanales: 5,
        },
      },
      5,
    );

    expect(normalized.contrato['sueldoBase']).toBeNull();
    expect(normalized.contrato['idTipoTrabajador']).toBeNull();
    expect(normalized.contrato['idMoneda']).toBeNull();
  });

  it('cuenta vacia sin DRAFT deja banco y tipo cuenta pendientes', () => {
    const base = formValue();
    const normalized = normalizarBorradorAvanzadoParaFormulario(
      {
        ...base,
        bancario: { idBanco: 1, idTipoCuentaBancaria: 2, numeroCuenta: '   ' },
      },
      7,
    );

    expect(normalized.bancario['idBanco']).toBeNull();
    expect(normalized.bancario['idTipoCuentaBancaria']).toBeNull();
  });

  it('conserva tipoContrato en paso 3 si el contrato base ya es coherente', () => {
    const base = formValue();
    const normalized = normalizarBorradorAvanzadoParaFormulario(
      {
        ...base,
        contrato: {
          ...base.contrato,
          cargo: 'Analista',
          idSucursal: 1,
          fechaIngreso: '2026-01-01',
          fechaContrato: '2026-01-01',
          tipoContrato: 'INDEFINIDO',
          sueldoBase: 500_000,
          idTipoTrabajador: 9,
          idMoneda: 1,
        },
      },
      3,
    );

    expect(normalized.contrato['tipoContrato']).toBe('INDEFINIDO');
    expect(normalized.contrato['idTipoTrabajador']).toBe(9);
  });

  it('APVI incompleto desactiva Tiene APVI y limpia campos', () => {
    const base = formValue();
    const normalized = normalizarBorradorAvanzadoParaFormulario(
      {
        ...base,
        perfilLaboral: {
      pensionado: false,
      pensionadoInvalidezParcial: false,
      pensionadoInvalidezTotal: false,
      exentoCotizacionPension: false,
      trabajadorAdolescenteProtegido: false,
      autorizacionMenorRegistrada: false,
      tecnicoExtranjeroExento: false,
      discapacidad: false,
      vigenciaInicio: '2026-05-02',
      vigenciaFin: '',
      respaldoRegistrado: false,
      observacion: '',
    },
    previsionSalud: {
          ...base.previsionSalud,
          tipoRegimenPrevisional: 'AFP',
          idAfp: 1,
          idSalud: 1,
          idMonedaPlan: 1,
          valorPlan: 1,
          adicionalAugeGes: 0,
          tieneApv: true,
          idInstitucionApv: null,
          idMonedaApv: null,
          montoApv: null,
          idFormaPagoApv: null,
          depositoConvenidoApvi: null,
        },
      },
      7,
    );

    expect(normalized.previsionSalud['tieneApv']).toBe(false);
    expect(normalized.previsionSalud['idInstitucionApv']).toBeNull();
  });
});
