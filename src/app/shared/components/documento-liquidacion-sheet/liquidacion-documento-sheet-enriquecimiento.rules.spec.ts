import { describe, expect, it } from 'vitest';

import {
  enriquecerDocumentoDesdeCalculo,
  enriquecerDocumentoDesdeLiquidacionOficial,
  formatearNumeroDocumentoLiquidacion,
  leerActorRevisionDesdeMetadata,
  leerAutorizadoPorDesdeMetadata,
  leerDocumentoEntregadoPorDesdeMetadata,
  leerPagoRegistradoPorDesdeMetadata,
  leerRectificacionSolicitadaPorDesdeMetadata,
  mapDiasTrabajadosDesdeFicha,
  mapInstitucionesEmpresaDesdeParametros,
  mapTrabajadorMetaDesdeFichaEmpleado,
  normalizarEtiquetaConceptoDocumento,
} from './liquidacion-documento-sheet-enriquecimiento.rules';
import type { EmpleadoFichaDetalle } from '../../../features/empleados/models/empleado-listado.model';
import type { ParametrosGeneralesCatalogos } from '../../../features/parametros-generales/models/parametro-general.model';
import type { LiquidacionCalculada } from '../../../features/nomina-mensual/models/proceso-mensual.model';
import type {
  LiquidacionConcepto,
  LiquidacionTrabajador,
} from '../../../features/liquidaciones-oficiales/models/liquidacion-oficial.model';

function trabajadorMock(parcial: Partial<LiquidacionTrabajador> = {}): LiquidacionTrabajador {
  return {
    idLiquidacionTrabajador: 24,
    idPersona: 5,
    idContrato: null,
    rut: '12.345.678-9',
    nombreTrabajador: 'Ana Pérez',
    cargo: 'Analista',
    centroCosto: 'Operaciones',
    fechaIngreso: '2020-06-06',
    diasTrabajados: 28,
    baseImponible: 900_000,
    baseTributable: 800_000,
    totalHaberes: 920_000,
    totalDescuentos: 150_000,
    totalAportesEmpleadorReferencia: 12_000,
    liquidoPagar: 770_000,
    estado: 'generada',
    observaciones: [],
    metadata: {
      afp: 'Cuprum',
      salud: 'Fonasa',
      tipoContrato: 'Indefinido',
      sueldoBase: 900_000,
      tasaAfp: 11.44,
      mutual: 'ACHS',
      ccaf: 'Los Andes',
      email: 'ana@empresa.cl',
      cargas: 2,
    },
    ...parcial,
  };
}

function concepto(parcial: Partial<LiquidacionConcepto>): LiquidacionConcepto {
  return {
    idLiquidacionConcepto: 1,
    idLiquidacionTrabajador: 24,
    idConcepto: null,
    codigo: null,
    codigoLre: null,
    nombre: 'Concepto',
    tipo: 'descuento',
    clasificacion: null,
    cantidad: null,
    base: null,
    tasa: null,
    monto: 0,
    orden: 1,
    metadata: {},
    ...parcial,
  };
}

function trabajadorRpcMock(): LiquidacionTrabajador {
  return {
    idLiquidacionTrabajador: 24,
    idPersona: 5,
    idContrato: null,
    rut: '12.345.678-9',
    nombreTrabajador: 'Ana Pérez',
    cargo: null,
    centroCosto: null,
    fechaIngreso: null,
    diasTrabajados: null,
    baseImponible: 900_000,
    baseTributable: 800_000,
    totalHaberes: 920_000,
    totalDescuentos: 150_000,
    totalAportesEmpleadorReferencia: 12_000,
    liquidoPagar: 770_000,
    estado: 'generada',
    observaciones: [],
    metadata: {
      idCalculoTrabajador: 100,
      estadoSnapshot: 'calculado_preliminar',
      sueldoBase: 900_000,
      cotizacionAfp: 100_000,
      cotizacionSalud: 40_000,
      cotizacionAfc: 5_000,
      cotizacionAfcEmpleador: 0,
      camposNoDisponiblesEnSnapshot: [
        'id_contrato',
        'cargo',
        'centro_costo',
        'fecha_ingreso',
        'dias_trabajados',
      ],
    },
  };
}

function fichaMock(): EmpleadoFichaDetalle {
  return {
    id: 5,
    idContrato: 1,
    rut: '12.345.678-9',
    nombre: 'Ana Pérez',
    cargo: 'Analista',
    departamento: 'Operaciones',
    fechaIngreso: '2020-06-06',
    sueldoBase: 900_000,
    monedaContrato: 'CLP',
    estado: 'activo',
    estadoFicha: 'VALIDO',
    aptoParaRemuneraciones: true,
    pasoAltaAvanzada: null,
    historial: [],
    formValue: {
      datosPersonales: {},
      contacto: { email: 'ana@empresa.cl' },
      contrato: {
        cargo: 'Analista',
        fechaIngreso: '2020-06-06',
        fechaTermino: null,
        tipoContrato: 'INDEFINIDO',
        cargas: 2,
        sueldoBase: 900_000,
      },
      perfilLaboral: {},
      previsionSalud: {
        idAfp: 1,
        idSalud: 2,
        tipoSalud: 'FONASA',
        tieneApv: false,
      },
      bancario: {},
    },
  };
}

function catalogosMock(): ParametrosGeneralesCatalogos {
  return {
    afp: [
      {
        idAfp: 1,
        codigo: 'CUP',
        nombre: 'Cuprum',
        periodo: '2026-05',
        tasaObligatoria: 10.17,
        comision: 1.27,
        sis: null,
        tasaEmpleador: null,
        vigente: true,
        vigenciaInicio: null,
        vigenciaFin: null,
      },
    ],
    isapres: [],
    saludInstituciones: [
      {
        idSalud: 2,
        codigo: 'FON',
        nombre: 'Fonasa',
        tipo: 'FONASA',
        porcentajeCotizacion: 7,
        periodo: null,
        vigente: true,
        vigenciaInicio: null,
        vigenciaFin: null,
      },
    ],
    tramosCarga: [],
    tramosImpuesto: [],
    tablaImpuestoUnico: [],
    reformaPensiones: [],
    trabajosPesados: [],
    reformaPrevisional: [],
    ley16744Parametros: [],
    organismosLey16744: [
      {
        idOrganismoAdministradorLey16744: 1,
        codigo: 'ACHS',
        nombre: 'ACHS',
        tipo: 'mutual',
        vigente: true,
        periodo: null,
      },
    ],
    ccafEntidades: [
      {
        idCcafEntidad: 3,
        codigo: 'LA',
        nombre: 'Los Andes',
        vigente: true,
        fuente: null,
        periodo: null,
      },
    ],
    apvInstituciones: [],
    apvFormasPago: [],
    afcParametros: [],
  };
}

describe('liquidacion-documento-sheet-enriquecimiento.rules', () => {
  it('formatea folio S-0024-26', () => {
    expect(formatearNumeroDocumentoLiquidacion(24, '2026-05')).toBe('S-0024-26');
  });

  it('normaliza etiquetas RRHH de conceptos', () => {
    expect(normalizarEtiquetaConceptoDocumento('Cotizacion AFP trabajador')).toBe('Previsión (AFP)');
    expect(normalizarEtiquetaConceptoDocumento('Seguro de cesantia trabajador')).toBe(
      'Seguro de cesantía',
    );
    expect(normalizarEtiquetaConceptoDocumento('Gratificacion legal art. 50')).toBe(
      'Gratificación legal',
    );
  });

  it('enriquece preview de cálculo con parámetros del período', () => {
    const liquidacion = {
      periodo: '2026-05',
      idPersona: 9,
      rut: '1-9',
      nombreCompleto: 'Test',
      haberesImponibles: [],
      haberesNoImponibles: [],
      descuentosLegales: [],
      descuentosVoluntarios: [{ codigo: 'ANT', descripcion: 'Anticipo', monto: 10_000, origen: 'x' }],
      baseImponiblePrevisional: 0,
      baseTributable: 0,
      gratificacionLegal: 0,
      asignacionFamiliar: 0,
      cotizacionAfp: 0,
      cotizacionSalud: 0,
      cotizacionAfc: 0,
      cotizacionAfcEmpleador: 0,
      cotizacionSis: 0,
      cotizacionSanna: 0,
      cotizacionLey16744: 0,
      impuestoUnico: 0,
      totalHaberes: 0,
      totalDescuentos: 10_000,
      liquidoAPago: 0,
      issues: [],
      trazabilidad: [{ codigo: 'AFP_TASA_APLICADA', valorResultado: 10.58, valorEntrada: null, origen: 'x', tabla: 'x', campo: 'x', formula: 'x' }],
      estado: 'calculado_preliminar',
    } as LiquidacionCalculada;

    const extras = enriquecerDocumentoDesdeCalculo({
      liquidacion,
      periodo: '2026-05',
      parametros: { uf: 39_000, utm: 68_000 },
      trabajadorMeta: { afp: 'Modelo', diasTrabajados: 30 },
      empresa: { razonSocial: 'Demo' },
      idReferencia: 9,
    });

    expect(extras.detalle.uf).toBe(39_000);
    expect(extras.detalle.utm).toBe(68_000);
    expect(extras.trabajadorMeta.tasaAfp).toBe(10.58);
    expect(extras.cierre.anticipos).toBe(10_000);
    expect(extras.numeroDocumento).toBe('S-0009-26');
  });

  it('enriquece documento oficial con metadata completa (mock ideal)', () => {
    const trabajador = trabajadorMock({
      metadata: {
        afp: 'Cuprum',
        salud: 'Fonasa',
        tipoContrato: 'Indefinido',
        sueldoBase: 900_000,
        tasaAfp: 11.44,
        mutual: 'ACHS',
        ccaf: 'Los Andes',
        email: 'ana@empresa.cl',
        cargas: 2,
        autorizadoPor: 'María González Rojas',
      },
    });
    const conceptos = [
      concepto({ nombre: 'Anticipo quincena', tipo: 'descuento', monto: 50_000 }),
      concepto({ nombre: 'Cotización AFP', tipo: 'descuento', monto: 100_000, tasa: 11.44 }),
    ];
    const extras = enriquecerDocumentoDesdeLiquidacionOficial({
      trabajador,
      conceptos,
      periodo: '2026-05',
      parametros: { uf: 39_179.12, utm: 68_306 },
      empresa: {
        razonSocial: 'Empresa Demo',
        nombreFirmaEmpleador: 'Juan Pérez',
        textoPie: 'Texto legal empresa',
      },
      emision: {
        idLiquidacionEmision: 1,
        idLiquidacionTrabajador: 24,
        idLiquidacionPeriodo: 1,
        versionLiquidacion: 1,
        usuarioId: null,
        usuarioLabel: 'RRHH Demo',
        canal: 'vista_oficial',
        emitidoEn: '2026-05-31T12:00:00.000Z',
        metadata: {},
      },
    });

    expect(extras.numeroDocumento).toBe('S-0024-26');
    expect(extras.detalle.uf).toBe(39_179.12);
    expect(extras.detalle.utm).toBe(68_306);
    expect(extras.detalle.diasBase).toBe(30);
    expect(extras.detalle.ausencias).toBe(2);
    expect(extras.detalle.cargas).toBe(2);
    expect(extras.trabajadorMeta.afp).toBe('Cuprum');
    expect(extras.trabajadorMeta.tasaAfp).toBe(11.44);
    expect(extras.trabajadorMeta.ccaf).toBe('Los Andes');
    expect(extras.trabajadorMeta.email).toBe('ana@empresa.cl');
    expect(extras.cierre.anticipos).toBe(50_000);
    expect(extras.cierre.unidadNegocio).toBe('Operaciones');
    expect(extras.cierre.emitidoPor).toBe('RRHH Demo');
    expect(extras.cierre.autorizadoPor).toBe('María González Rojas');
    expect(extras.fechaEmision).toBeTruthy();
  });

  it('completa campos faltantes desde ficha y parámetros cuando el RPC solo trae montos', () => {
    const trabajador = trabajadorRpcMock();
    const conceptos = [
      concepto({ nombre: 'Cotizacion AFP trabajador', tipo: 'descuento', monto: 100_000 }),
      concepto({ nombre: 'Cotizacion salud Fonasa', tipo: 'descuento', monto: 40_000 }),
    ];
    const ficha = fichaMock();
    const catalogos = catalogosMock();

    const extras = enriquecerDocumentoDesdeLiquidacionOficial({
      trabajador,
      conceptos,
      periodo: '2026-05',
      parametros: { uf: 39_179.12, utm: 68_306 },
      ficha,
      catalogos,
      configCliente: {
        periodo: '2026-05',
        idCcafEntidad: 3,
        idOrganismoAdministradorLey16744: 1,
        descuentosBasePorDia: false,
        gratificacion: true,
        immGratificacion: null,
        estadoReconciliacionOficial: 'cliente_confirmado',
        fechaReconciliacionOficial: null,
        origenReconciliacion: null,
        observacionReconciliacion: null,
        fechaActualizacion: null,
      },
    });

    expect(extras.trabajadorMeta.cargo).toBe('Analista');
    expect(extras.trabajadorMeta.email).toBe('ana@empresa.cl');
    expect(extras.trabajadorMeta.tipoContrato).toBe('Indefinido');
    expect(extras.trabajadorMeta.afp).toBe('Cuprum');
    expect(extras.trabajadorMeta.tasaAfp).toBeCloseTo(11.44, 2);
    expect(extras.trabajadorMeta.salud).toBe('Fonasa');
    expect(extras.trabajadorMeta.mutual).toBe('ACHS');
    expect(extras.trabajadorMeta.ccaf).toBe('Los Andes');
    expect(extras.detalle.cargas).toBe(2);
    expect(extras.detalle.diasTrabajados).toBe(30);
    expect(extras.cierre.unidadNegocio).toBe('Operaciones');
  });

  it('resuelve mutual y CCAF desde config cliente', () => {
    const inst = mapInstitucionesEmpresaDesdeParametros(
      {
        periodo: '2026-05',
        idCcafEntidad: 3,
        idOrganismoAdministradorLey16744: 1,
        descuentosBasePorDia: false,
        gratificacion: true,
        immGratificacion: null,
        estadoReconciliacionOficial: 'cliente_confirmado',
        fechaReconciliacionOficial: null,
        origenReconciliacion: null,
        observacionReconciliacion: null,
        fechaActualizacion: null,
      },
      catalogosMock(),
    );
    expect(inst.mutual).toBe('ACHS');
    expect(inst.ccaf).toBe('Los Andes');
  });

  it('calcula días trabajados desde ficha con convención base 30', () => {
    expect(mapDiasTrabajadosDesdeFicha(fichaMock(), '2026-05')).toBe(30);
  });

  it('mapTrabajadorMetaDesdeFichaEmpleado resuelve AFP y salud por catálogo', () => {
    const meta = mapTrabajadorMetaDesdeFichaEmpleado(fichaMock(), catalogosMock());
    expect(meta.afp).toBe('Cuprum');
    expect(meta.salud).toBe('Fonasa');
    expect(meta.tasaAfp).toBeCloseTo(11.44, 2);
  });

  it('lee actores RRHH desde metadata denormalizada LIQ-AUDIT-01', () => {
    const metadata = {
      autorizadoPor: 'Ana Autorizadora',
      autorizacion: {
        usuarioNombre: 'Ana Autorizadora',
        registradoEn: '2026-07-09T10:00:00.000Z',
      },
      pago: {
        usuarioNombre: 'Pedro Pagos',
        registradoEn: '2026-07-09T11:00:00.000Z',
      },
      documentoEntrega: {
        usuarioNombre: 'Luis Entrega',
        registradoEn: '2026-07-09T12:00:00.000Z',
      },
      rectificacionSolicitada: {
        usuarioNombre: 'Rosa Rectifica',
        registradoEn: '2026-07-09T13:00:00.000Z',
      },
    };

    expect(leerAutorizadoPorDesdeMetadata(metadata)).toBe('Ana Autorizadora');
    expect(leerActorRevisionDesdeMetadata(metadata, 'autorizacion')?.usuarioNombre).toBe('Ana Autorizadora');
    expect(leerPagoRegistradoPorDesdeMetadata(metadata)?.usuarioNombre).toBe('Pedro Pagos');
    expect(leerDocumentoEntregadoPorDesdeMetadata(metadata)?.usuarioNombre).toBe('Luis Entrega');
    expect(leerRectificacionSolicitadaPorDesdeMetadata(metadata)?.usuarioNombre).toBe('Rosa Rectifica');
  });
});
