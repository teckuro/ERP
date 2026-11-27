import type {
  ParametroGeneral,
  ParametrosGeneralesCatalogos,
  ParametrosGeneralesClienteConfig,
  PeriodoRemuneracionEstadoInfo,
} from '../models/parametro-general.model';
import { describe, expect, it } from 'vitest';

import {
  compararOficialCliente,
  crearClienteConfigDesdeOficiales,
  debeMostrarAvisoDiferenciasParametrosOficialesMes,
  evaluarCompletitudParametrosMensual,
  hayReconciliacionOficialClientePendiente,
  huellaDiferenciasOficialesCliente,
  resolverEstadoVisualParametros,
  resolverOficialParaComparacionCliente,
  resolverOpcionesBaseConfigCliente,
} from './parametros-completitud.rules';

describe('parametros-completitud.rules', () => {
  const periodo = '2026-05';

  it('marca pendiente oficial sanna si el snapshot parametros_generales viene null', () => {
    const resultado = evaluarCompletitudParametrosMensual({
      periodo,
      periodoRemuneracion: periodoInfo('cargado'),
      oficial: parametroOficial({ sanna: null }),
      clienteConfig: clienteConfig(),
      catalogos: catalogosCompletos(),
    });

    expect(resultado.grupos.oficialesMensuales.completo).toBe(false);
    expect(resultado.pendientes.some((p) => p.includes('SANNA'))).toBe(true);
  });

  it('marca cerrado solo cuando oficiales, configuracion, vigencias y consistencia estan completos', () => {
    const resultado = evaluarCompletitudParametrosMensual({
      periodo,
      periodoRemuneracion: periodoInfo('cerrado'),
      oficial: parametroOficial(),
      clienteConfig: clienteConfig(),
      catalogos: catalogosCompletos(),
    });

    expect(resultado.estadoCalculado).toBe('cerrado');
    expect(resultado.porcentaje).toBe(100);
    expect(resultado.pendientes).toEqual([]);
    expect(resultado.diferencias).toEqual([]);
  });

  it('mantiene estado corregido cuando el periodo esta completo y sin diferencias', () => {
    const resultado = evaluarCompletitudParametrosMensual({
      periodo,
      periodoRemuneracion: periodoInfo('corregido'),
      oficial: parametroOficial(),
      clienteConfig: clienteConfig(),
      catalogos: catalogosCompletos(),
    });

    expect(resultado.estadoCalculado).toBe('corregido');
    expect(resultado.porcentaje).toBe(100);
  });

  it('queda parcial si existen datos oficiales pero falta configuracion cliente', () => {
    const resultado = evaluarCompletitudParametrosMensual({
      periodo,
      periodoRemuneracion: periodoInfo('cargado'),
      oficial: parametroOficial(),
      clienteConfig: null,
      catalogos: catalogosCompletos(),
    });

    expect(resultado.estadoCalculado).toBe('parcial');
    expect(resultado.grupos.configuracionCliente.completo).toBe(false);
    expect(resultado.pendientes).toContain('Falta configuración cliente del período.');
  });

  it('queda pendiente si no hay datos oficiales mensuales aunque exista configuracion cliente', () => {
    const resultado = evaluarCompletitudParametrosMensual({
      periodo,
      periodoRemuneracion: periodoInfo('parcial'),
      oficial: null,
      clienteConfig: clienteConfig(),
      catalogos: catalogosCompletos(),
    });

    expect(resultado.estadoCalculado).toBe('pendiente');
    expect(resultado.grupos.oficialesMensuales.completo).toBe(false);
    expect(resultado.pendientes).toContain('Datos oficiales del período.');
  });

  it('mes sin datos oficiales no evalua consistencia (no 1/1 artificial)', () => {
    const resultado = evaluarCompletitudParametrosMensual({
      periodo,
      periodoRemuneracion: periodoInfo('pendiente'),
      oficial: null,
      clienteConfig: null,
      catalogos: catalogosCompletos(),
    });

    expect(resultado.grupos.consistencia.total).toBe(0);
    expect(resultado.grupos.consistencia.completos).toBe(0);
    expect(resultado.grupos.consistencia.porcentaje).toBe(0);
  });

  it('no marca cargado ni 100% cuando la UI muestra referencia anterior pero los oficiales actuales faltan', () => {
    const catalogosActuales = catalogosCompletos();
    catalogosActuales.tramosCarga = [];
    catalogosActuales.tramosImpuesto = [];
    catalogosActuales.tablaImpuestoUnico = [];
    catalogosActuales.ley16744Parametros = [];

    const resultado = evaluarCompletitudParametrosMensual({
      periodo,
      periodoRemuneracion: periodoInfo('parcial'),
      oficial: null,
      clienteConfig: clienteConfig(),
      catalogos: catalogosActuales,
    });

    expect(resultado.estadoCalculado).toBe('pendiente');
    expect(resultado.porcentaje).toBeLessThan(100);
    expect(resultado.grupos.oficialesMensuales.completo).toBe(false);
    expect(resultado.pendientes).toContain('Datos oficiales del período.');
    expect(resultado.pendientes).toContain('Faltan tramos de carga familiar.');
  });

  it('valida trabajo pesado por solape de vigencia y no por fila mensual exacta', () => {
    const catalogos = catalogosCompletos();
    catalogos.trabajosPesados = [
      {
        ...catalogos.trabajosPesados[0],
        periodo: '2026-04',
        vigenciaInicio: '2026-04-15',
        vigenciaFin: '2026-06-30',
      },
    ];

    const resultado = evaluarCompletitudParametrosMensual({
      periodo,
      periodoRemuneracion: periodoInfo('cargado'),
      oficial: parametroOficial(),
      clienteConfig: clienteConfig(),
      catalogos,
    });

    expect(resultado.grupos.vigencias.completo).toBe(true);
    expect(resultado.pendientes).not.toContain('Falta vigencia aplicable de trabajo pesado.');
  });

  it('queda parcial si no existe vigencia aplicable de trabajo pesado', () => {
    const catalogos = catalogosCompletos();
    catalogos.trabajosPesados = [
      {
        ...catalogos.trabajosPesados[0],
        vigenciaInicio: '2026-01-01',
        vigenciaFin: '2026-04-30',
      },
    ];

    const resultado = evaluarCompletitudParametrosMensual({
      periodo,
      periodoRemuneracion: periodoInfo('cargado'),
      oficial: parametroOficial(),
      clienteConfig: clienteConfig(),
      catalogos,
    });

    expect(resultado.estadoCalculado).toBe('parcial');
    expect(resultado.grupos.vigencias.completo).toBe(false);
    expect(resultado.pendientes).toContain('Falta vigencia aplicable de trabajo pesado.');
  });

  it('marca valores oficiales en cero como pendientes (p. ej. UF del mes)', () => {
    const resultado = evaluarCompletitudParametrosMensual({
      periodo,
      periodoRemuneracion: periodoInfo('parcial'),
      oficial: parametroOficial({ uf: 0 }),
      clienteConfig: clienteConfig(),
      catalogos: catalogosCompletos(),
    });

    expect(resultado.pendientes).toContain('El valor UF mensual no puede quedar en cero en datos oficiales del período.');
    expect(resultado.grupos.oficialesMensuales.completo).toBe(false);
  });

  it('detecta diferencias oficial cliente y no marca cerrado', () => {
    const resultado = evaluarCompletitudParametrosMensual({
      periodo,
      periodoRemuneracion: periodoInfo('cerrado'),
      oficial: parametroOficial(),
      clienteConfig: clienteConfig({ uf: 40000 }),
      catalogos: catalogosCompletos(),
    });

    expect(resultado.estadoCalculado).toBe('cargado');
    expect(resultado.grupos.consistencia.completo).toBe(false);
    expect(resultado.reconciliacionPendiente).toBe(true);
    expect(resultado.diferencias).toEqual([
      { campo: 'uf', oficial: 38000, cliente: 40000 },
    ]);
    expect(resultado.advertencias).toContain(
      'Existen diferencias pendientes entre valores oficiales y configuración cliente.',
    );
  });

  it('resuelve estado visual pendiente de reconciliacion cuando hay oficiales y diferencias', () => {
    const estado = resolverEstadoVisualParametros({
      estadoCalculado: 'cargado',
      oficialActual: true,
      clienteConfig: true,
      referenciaAnterior: false,
      diferencias: true,
    });

    expect(estado).toBe('pendiente_reconciliacion');
  });

  it('diferencias sin decision quedan pendientes de reconciliacion', () => {
    const resultado = evaluarCompletitudParametrosMensual({
      periodo,
      periodoRemuneracion: periodoInfo('cargado'),
      oficial: parametroOficial(),
      clienteConfig: clienteConfig({ uf: 40000, estadoReconciliacionOficial: 'pendiente' }),
      catalogos: catalogosCompletos(),
    });

    expect(resultado.diferencias).toHaveLength(1);
    expect(resultado.reconciliacionPendiente).toBe(true);
    expect(resultado.grupos.consistencia.completo).toBe(false);
  });

  it('actualizar con oficiales genera payload cliente actualizado sin mutar oficial', () => {
    const oficial = parametroOficial({ uf: 38100 });
    const actual = clienteConfig({ uf: 40000 });

    const payload = crearClienteConfigDesdeOficiales(oficial, actual, periodo);

    expect(payload.uf).toBe(38100);
    expect(oficial.uf).toBe(38100);
    expect(actual.uf).toBe(40000);
  });

  it('mantener mi configuracion conserva valores y persiste decision cliente_confirmado', () => {
    const resultado = evaluarCompletitudParametrosMensual({
      periodo,
      periodoRemuneracion: periodoInfo('cargado'),
      oficial: parametroOficial(),
      clienteConfig: clienteConfig({
        uf: 40000,
        estadoReconciliacionOficial: 'cliente_confirmado',
        fechaReconciliacionOficial: '2026-05-02T12:00:00',
        fechaActualizacion: '2026-05-02T12:00:00',
      }),
      catalogos: catalogosCompletos(),
    });

    expect(resultado.diferencias).toEqual([{ campo: 'uf', oficial: 38000, cliente: 40000 }]);
    expect(resultado.reconciliacionPendiente).toBe(false);
    expect(resultado.grupos.consistencia.completo).toBe(true);
    expect(resultado.advertencias).toEqual([]);
  });

  it('reconciliacion pendiente si config cliente se edito despues de mantener configuracion', () => {
    const oficial = parametroOficial();
    const cliente = clienteConfig({
      uf: 40000,
      topeAfpUf: 99,
      estadoReconciliacionOficial: 'cliente_confirmado',
      fechaReconciliacionOficial: '2026-05-02T12:00:00',
      fechaActualizacion: '2026-05-20T08:00:00',
    });
    const resultado = evaluarCompletitudParametrosMensual({
      periodo,
      periodoRemuneracion: periodoInfo('cargado'),
      oficial,
      clienteConfig: cliente,
      catalogos: catalogosCompletos(),
    });

    expect(resultado.reconciliacionPendiente).toBe(true);
    expect(resultado.grupos.consistencia.completo).toBe(false);
    expect(
      debeMostrarAvisoDiferenciasParametrosOficialesMes({
        periodoRemuneracion: periodoInfo('cargado'),
        oficial,
        clienteConfig: cliente,
        diferencias: resultado.diferencias,
      }),
    ).toBe(true);
  });

  it('compara con ultimo hasta periodo cuando no hay fila exacta del mes', () => {
    const ultimoMes = parametroOficial({ periodo: '2026-05', uf: 38000 });
    const cliente = clienteConfig({ uf: 6_000_000 });
    const resuelto = resolverOficialParaComparacionCliente({
      periodoSeleccionado: periodo,
      filaExacta: null,
      ultimoHastaPeriodo: ultimoMes,
      referenciaVisual: null,
    });

    expect(resuelto.origen).toBe('ultimo_hasta_periodo');
    expect(compararOficialCliente(resuelto.oficial, cliente)).toEqual([
      { campo: 'uf', oficial: 38000, cliente: 6_000_000 },
    ]);

    const resultado = evaluarCompletitudParametrosMensual({
      periodo,
      periodoRemuneracion: periodoInfo('cargado'),
      oficial: null,
      oficialParaComparacion: resuelto.oficial,
      clienteConfig: cliente,
      catalogos: catalogosCompletos(),
    });

    expect(resultado.diferencias).toEqual([{ campo: 'uf', oficial: 38000, cliente: 6_000_000 }]);
    expect(
      debeMostrarAvisoDiferenciasParametrosOficialesMes({
        periodoRemuneracion: periodoInfo('cargado'),
        oficial: resuelto.oficial,
        clienteConfig: cliente,
        diferencias: resultado.diferencias,
      }),
    ).toBe(true);
  });

  it('reconciliacion pendiente tras actualizar con oficiales y volver a editar', () => {
    const oficial = parametroOficial();
    const cliente = clienteConfig({
      uf: 40000,
      estadoReconciliacionOficial: 'actualizado_con_oficiales',
      fechaReconciliacionOficial: '2026-05-10T12:00:00',
      fechaActualizacion: '2026-05-20T08:00:00',
    });
    const diferencias = compararOficialCliente(oficial, cliente);

    expect(diferencias.length).toBeGreaterThan(0);
    expect(hayReconciliacionOficialClientePendiente(cliente, diferencias)).toBe(true);
  });

  it('debe mostrar aviso aunque el calendario del periodo este pendiente', () => {
    const oficial = parametroOficial();
    const cliente = clienteConfig({ uf: 40000, estadoReconciliacionOficial: 'pendiente' });
    const diferencias = [{ campo: 'uf' as const, oficial: 38000, cliente: 40000 }];

    expect(
      debeMostrarAvisoDiferenciasParametrosOficialesMes({
        periodoRemuneracion: periodoInfo('pendiente'),
        oficial,
        clienteConfig: cliente,
        diferencias,
      }),
    ).toBe(true);
  });

  it('no debe mostrar aviso si el calendario del periodo esta en error', () => {
    const oficial = parametroOficial();
    const cliente = clienteConfig({ uf: 40000 });
    const diferencias = [{ campo: 'uf' as const, oficial: 38000, cliente: 40000 }];

    expect(
      debeMostrarAvisoDiferenciasParametrosOficialesMes({
        periodoRemuneracion: periodoInfo('error'),
        oficial,
        clienteConfig: cliente,
        diferencias,
      }),
    ).toBe(false);
  });

  it('reconciliacion pendiente si confirmo sin fecha de decision y hay diferencias', () => {
    const resultado = evaluarCompletitudParametrosMensual({
      periodo,
      periodoRemuneracion: periodoInfo('cargado'),
      oficial: parametroOficial(),
      clienteConfig: clienteConfig({
        uf: 40000,
        estadoReconciliacionOficial: 'cliente_confirmado',
        fechaReconciliacionOficial: null,
        fechaActualizacion: '2026-05-20T08:00:00',
      }),
      catalogos: catalogosCompletos(),
    });

    expect(resultado.reconciliacionPendiente).toBe(true);
  });

  it('debe mostrar aviso en periodo parcial si hay diferencias tras editar config', () => {
    const oficial = parametroOficial();
    const cliente = clienteConfig({
      uf: 40000,
      estadoReconciliacionOficial: 'cliente_confirmado',
      fechaReconciliacionOficial: '2026-05-01T10:00:00',
      fechaActualizacion: '2026-05-18T14:00:00',
    });
    const diferencias = [{ campo: 'uf' as const, oficial: 38000, cliente: 40000 }];

    expect(
      debeMostrarAvisoDiferenciasParametrosOficialesMes({
        periodoRemuneracion: periodoInfo('parcial'),
        oficial,
        clienteConfig: cliente,
        diferencias,
      }),
    ).toBe(true);
  });

  it('debe mostrar aviso cuando el periodo esta cargado y hay diferencias sin decision', () => {
    const oficial = parametroOficial();
    const cliente = clienteConfig({ uf: 40000, estadoReconciliacionOficial: 'pendiente' });
    const diferencias = [{ campo: 'uf' as const, oficial: 38000, cliente: 40000 }];

    expect(
      debeMostrarAvisoDiferenciasParametrosOficialesMes({
        periodoRemuneracion: periodoInfo('cargado'),
        oficial,
        clienteConfig: cliente,
        diferencias,
      }),
    ).toBe(true);
  });

  it('debe mostrar aviso cuando hay diferencias aunque ya confirmo mantener configuracion', () => {
    const oficial = parametroOficial({ fechaActualizacion: '2026-05-01T10:00:00' });
    const cliente = clienteConfig({
      uf: 40000,
      estadoReconciliacionOficial: 'cliente_confirmado',
      fechaReconciliacionOficial: '2026-05-02T12:00:00',
    });
    const diferencias = [{ campo: 'uf' as const, oficial: 38000, cliente: 40000 }];

    expect(
      debeMostrarAvisoDiferenciasParametrosOficialesMes({
        periodoRemuneracion: periodoInfo('cargado'),
        oficial,
        clienteConfig: cliente,
        diferencias,
      }),
    ).toBe(true);
  });

  it('debe mostrar aviso tras revisar despues si persisten diferencias', () => {
    const oficial = parametroOficial({ fechaActualizacion: '2026-05-10T08:00:00' });
    const cliente = clienteConfig({
      uf: 40000,
      estadoReconciliacionOficial: 'revisar_despues',
      fechaReconciliacionOficial: '2026-05-01T12:00:00',
    });
    const diferencias = [{ campo: 'uf' as const, oficial: 38000, cliente: 40000 }];

    expect(
      debeMostrarAvisoDiferenciasParametrosOficialesMes({
        periodoRemuneracion: periodoInfo('cargado'),
        oficial,
        clienteConfig: cliente,
        diferencias,
      }),
    ).toBe(true);
  });

  it('genera huella estable para no repetir el mismo aviso en la sesion', () => {
    const diferencias = [
      { campo: 'uf' as const, oficial: 38000, cliente: 40000 },
      { campo: 'sanna' as const, oficial: 0.03, cliente: 0.04 },
    ];

    expect(huellaDiferenciasOficialesCliente(diferencias)).toBe(
      huellaDiferenciasOficialesCliente([...diferencias].reverse()),
    );
  });

  it('revisar despues registra decision y no mantiene la reconciliacion en bucle', () => {
    const resultado = evaluarCompletitudParametrosMensual({
      periodo,
      periodoRemuneracion: periodoInfo('cargado'),
      oficial: parametroOficial(),
      clienteConfig: clienteConfig({
        uf: 40000,
        estadoReconciliacionOficial: 'revisar_despues',
        origenReconciliacion: 'revisar_despues',
        fechaReconciliacionOficial: '2026-05-10T12:00:00',
        fechaActualizacion: '2026-05-10T12:00:00',
      }),
      catalogos: catalogosCompletos(),
    });

    expect(resultado.diferencias).toEqual([{ campo: 'uf', oficial: 38000, cliente: 40000 }]);
    expect(resultado.reconciliacionPendiente).toBe(false);
    expect(resultado.grupos.consistencia.completo).toBe(true);
    expect(resultado.advertencias).toEqual([]);
  });

  it('decision cliente_confirmado no se muestra como pendiente bloqueante', () => {
    const resultado = evaluarCompletitudParametrosMensual({
      periodo,
      periodoRemuneracion: periodoInfo('cargado'),
      oficial: parametroOficial(),
      clienteConfig: clienteConfig({
        uf: 40000,
        estadoReconciliacionOficial: 'cliente_confirmado',
        fechaReconciliacionOficial: '2026-05-10T12:00:00',
        fechaActualizacion: '2026-05-10T12:00:00',
      }),
      catalogos: catalogosCompletos(),
    });

    const estado = resolverEstadoVisualParametros({
      estadoCalculado: resultado.estadoCalculado,
      oficialActual: true,
      clienteConfig: true,
      referenciaAnterior: false,
      diferencias: resultado.reconciliacionPendiente,
    });

    expect(estado).toBe('cargado');
  });

  it('resuelve estado visual con referencia anterior sin tratarlo como cargado', () => {
    const estado = resolverEstadoVisualParametros({
      estadoCalculado: 'pendiente',
      oficialActual: false,
      clienteConfig: false,
      referenciaAnterior: true,
      diferencias: false,
    });

    expect(estado).toBe('referencia_anterior');
  });

  it('resuelve oficiales actuales sin configuracion como configuracion pendiente', () => {
    const estado = resolverEstadoVisualParametros({
      estadoCalculado: 'parcial',
      oficialActual: true,
      clienteConfig: false,
      referenciaAnterior: false,
      diferencias: false,
    });

    expect(estado).toBe('oficial_sin_config');
  });

  it('prioriza configuracion parcial sobre referencia cuando no hay oficiales actuales', () => {
    const estado = resolverEstadoVisualParametros({
      estadoCalculado: 'pendiente',
      oficialActual: false,
      clienteConfig: true,
      referenciaAnterior: true,
      diferencias: false,
    });

    expect(estado).toBe('configuracion_parcial');
  });

  it('resuelve sin base disponible cuando faltan oficiales, cliente y referencia', () => {
    const estado = resolverEstadoVisualParametros({
      estadoCalculado: 'pendiente',
      oficialActual: false,
      clienteConfig: false,
      referenciaAnterior: false,
      diferencias: false,
    });

    expect(estado).toBe('sin_base');
  });

  it('no ofrece usar referencia como base cuando no existe referencia anterior', () => {
    const opciones = resolverOpcionesBaseConfigCliente({
      ultimaConfigDisponible: false,
      referenciaAnteriorDisponible: false,
      oficialesActualesDisponibles: false,
    });

    expect(opciones).toEqual(['cero', 'cancelar']);
    expect(opciones).not.toContain('referencia');
  });

  it('ofrece referencia anterior solo como opcion de base cuando esta disponible', () => {
    const opciones = resolverOpcionesBaseConfigCliente({
      ultimaConfigDisponible: true,
      referenciaAnteriorDisponible: true,
      oficialesActualesDisponibles: false,
    });

    expect(opciones).toEqual(['cero', 'ultima', 'referencia', 'cancelar']);
  });

  it('ofrece valores oficiales actuales sin mezclar referencia anterior', () => {
    const opciones = resolverOpcionesBaseConfigCliente({
      ultimaConfigDisponible: false,
      referenciaAnteriorDisponible: false,
      oficialesActualesDisponibles: true,
    });

    expect(opciones).toEqual(['cero', 'oficiales', 'cancelar']);
  });

  it('crea payload cliente desde oficiales sin modificar la fuente oficial', () => {
    const oficial = parametroOficial({ periodo: '2026-05', uf: 38100 });
    const actual = clienteConfig({
      descuentosBasePorDia: true,
      gratificacion: false,
      immGratificacion: 3.5,
      idCcafEntidad: 2,
      idOrganismoAdministradorLey16744: 3,
    });

    const payload = crearClienteConfigDesdeOficiales(oficial, actual, '2026-05');

    expect(payload.periodo).toBe('2026-05');
    expect(payload.uf).toBe(38100);
    expect(payload.descuentosBasePorDia).toBe(true);
    expect(payload.gratificacion).toBe(false);
    expect(payload.immGratificacion).toBe(3.5);
    expect(payload.idCcafEntidad).toBe(2);
    expect(payload.idOrganismoAdministradorLey16744).toBe(3);
    expect(oficial.periodo).toBe('2026-05');
    expect(oficial.uf).toBe(38100);
  });

  it('prioriza estado error ante falla tecnica o error de carga', () => {
    const resultado = evaluarCompletitudParametrosMensual({
      periodo,
      periodoRemuneracion: periodoInfo('cargado'),
      oficial: parametroOficial(),
      clienteConfig: clienteConfig(),
      catalogos: catalogosCompletos(),
      errorTecnico: true,
    });

    expect(resultado.estadoCalculado).toBe('error');
    expect(resultado.grupos.tecnico.completo).toBe(false);
    expect(resultado.errores).toContain('Existe una falla técnica o error de carga asociado al período.');
  });
});

function periodoInfo(estado: PeriodoRemuneracionEstadoInfo['estado']): PeriodoRemuneracionEstadoInfo {
  return {
    codigo: '2026-05',
    estado,
    fechaInicio: '2026-05-01',
    fechaFin: '2026-05-31',
  };
}

function parametroOficial(overrides: Partial<ParametroGeneral> = {}): ParametroGeneral {
  return {
    periodo: '2026-05',
    uf: 38000,
    utm: 69000,
    uta: 828000,
    sueldoMinimo: 529000,
    sueldoMinimo18a65: 529000,
    sueldoMinimoMenor18Mayor65: 394622,
    sueldoMinimoCasaParticular: 529000,
    ingresoMinimoNoRemuneracional: 340988,
    topeAfpUf: 87.8,
    topeAfp: 3336400,
    topeIpsUf: 60,
    topeIps: 2280000,
    topeCesantiaUf: 131.9,
    topeCesantia: 5012200,
    topeApvMensualUf: 50,
    topeApvMensual: 1900000,
    topeApvAnualUf: 600,
    topeApvAnual: 22800000,
    topeDepositoConvenidoAnualUf: 900,
    topeDepositoConvenidoAnual: 34200000,
    topeAfpVoluntario: 1900000,
    sis: 1.49,
    sanna: 0.03,
    seguroSocialExpectativaVida: 0.1,
    aporteEmpleadorAfp: 1,
    saludObligatoria: 7,
    saludCcaf: 0.6,
    saludFonasaConCcaf: 6.4,
    descuentosBasePorDia: false,
    afcTrabajadorIndefinido: 0.6,
    afcEmpleadorIndefinido: 2.4,
    afcEmpleadorPlazo: 3,
    afcEmpleadorIndefinidoOnceAnosMas: 0.8,
    afcEmpleadorCasaParticular: 3,
    trabajoPesadoEmpleador: 2,
    trabajoPesadoTrabajador: 2,
    trabajoMenosPesadoEmpleador: 1,
    trabajoMenosPesadoTrabajador: 1,
    gratificacion: true,
    immGratificacion: 4.75,
    fechaActualizacion: '2026-05-01T00:00:00',
    ...overrides,
  };
}

function clienteConfig(
  overrides: Partial<ParametrosGeneralesClienteConfig> = {},
): ParametrosGeneralesClienteConfig {
  const base = parametroOficial();
  return {
    ...base,
    periodo: '2026-05',
    descuentosBasePorDia: false,
    gratificacion: true,
    immGratificacion: 4.75,
    idCcafEntidad: 1,
    idOrganismoAdministradorLey16744: 1,
    estadoReconciliacionOficial: 'pendiente',
    fechaReconciliacionOficial: null,
    origenReconciliacion: null,
    observacionReconciliacion: null,
    fechaActualizacion: '2026-05-01T00:00:00',
    ...overrides,
  };
}

function catalogosCompletos(): ParametrosGeneralesCatalogos {
  return {
    afp: [
      {
        idAfp: 1,
        codigo: 'HABITAT',
        nombre: 'AFP Habitat',
        periodo: null,
        tasaObligatoria: 10,
        comision: 1.27,
        sis: 1.49,
        tasaEmpleador: 0,
        vigente: true,
        vigenciaInicio: '2026-01-01',
        vigenciaFin: null,
      },
    ],
    isapres: [
      {
        idSalud: 1,
        codigo: 'FONASA',
        nombre: 'Fonasa',
        tipo: 'FONASA',
        porcentajeCotizacion: 7,
        periodo: null,
        vigente: true,
        vigenciaInicio: '2026-01-01',
        vigenciaFin: null,
      },
    ],
    saludInstituciones: [],
    tramosCarga: [{ idTramo: 1, periodo: '2026-05', tramo: 'A', desde: 0, hasta: 100, valor: 1000 }],
    tramosImpuesto: [{ idTramo: 1, periodo: '2026-05', desde: 0, hasta: 100, factor: 0, rebaja: 0 }],
    tablaImpuestoUnico: [
      { id: 1, tramo: 1, desde: 0, hasta: 100, factor: 0, rebaja: 0, vigenciaInicio: '2026-05-01', vigenciaFin: null },
    ],
    reformaPensiones: [
      {
        idParametro: 1,
        nombre: 'seguro_social',
        valorDecimal: 0.1,
        valorEntero: null,
        periodo: null,
        vigenciaInicio: '2026-01-01',
        vigenciaFin: null,
      },
    ],
    trabajosPesados: [
      {
        idTrabajoPesadoParametro: 1,
        codigo: 'TP',
        periodo: '2026-05',
        nombre: 'Trabajo pesado',
        tasaTrabajador: 2,
        tasaEmpleador: 2,
        tasaTotal: 4,
        requiereDictamenCen: true,
        fuente: null,
        vigente: true,
        vigenciaInicio: '2026-05-01',
        vigenciaFin: null,
      },
    ],
    reformaPrevisional: [
      {
        idReformaPrevisionalParametro: 1,
        periodo: null,
        vigenciaInicio: '2026-01-01',
        vigenciaFin: null,
        aporteEmpleadorTotal: 1,
        cuentaCapitalizacionIndividual: 0.1,
        cotizacionRentabilidadProtegida: 0.1,
        seguroSocialSisCev: 0.1,
        fappSeguroSocial: 0.1,
        fuente: null,
      },
    ],
    ley16744Parametros: [
      {
        idLey16744Parametro: 1,
        codigo: 'BASE',
        periodo: '2026-05',
        cotizacionBasicaEmpleador: 0.93,
        descripcionTasaAdicional: null,
        fuenteFinanciamiento: null,
        fuenteOrganismos: null,
        vigente: true,
        vigenciaInicio: '2026-05-01',
        vigenciaFin: null,
      },
    ],
    organismosLey16744: [
      {
        idOrganismoAdministradorLey16744: 1,
        codigo: 'MUTUAL',
        nombre: 'Mutual',
        tipo: 'mutual',
        vigente: true,
        periodo: null,
      },
    ],
    ccafEntidades: [
      {
        idCcafEntidad: 1,
        codigo: 'CCAF',
        nombre: 'CCAF',
        vigente: true,
        fuente: null,
        periodo: null,
      },
    ],
    apvInstituciones: [],
    apvFormasPago: [],
    afcParametros: [
      {
        idAfcParametro: 1,
        codigoTipoContrato: 'indefinido',
        aplicaSeguro: true,
        aplicaTrabajador: true,
        tasaTrabajador: 0.6,
        tasaEmpleador: 2.4,
        periodo: null,
        vigenciaInicio: '2026-01-01',
        vigenciaFin: null,
        observacion: null,
      },
    ],
  };
}
