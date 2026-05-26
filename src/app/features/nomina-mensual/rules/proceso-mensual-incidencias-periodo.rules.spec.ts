import { describe, expect, it } from 'vitest';

import {
  buildIncidenciasPeriodo,
  ordenarIncidencias,
  type IncidenciaPeriodo,
} from './proceso-mensual-incidencias-periodo.rules';

describe('proceso-mensual-incidencias-periodo.rules', () => {
  it('deduplica incidencias iguales por codigo y ambito', () => {
    const view = buildIncidenciasPeriodo({
      bloqueosOperativos: [{
        codigo: 'PARAM_UF',
        titulo: 'UF pendiente',
        descripcion: 'Falta UF del período',
        severidad: 'danger',
        ruta: '/parametros',
      }],
      advertenciasOperativas: [],
      resultadoBloqueos: [{
        codigo: 'PARAM_UF',
        titulo: 'UF pendiente (cálculo)',
        descripcion: 'Falta UF del período',
      }],
      resultadoAdvertencias: [],
      expedienteProblemas: [{
        severidad: 'bloqueo',
        titulo: 'PARAM_UF',
        detalle: 'Falta UF del período',
      }],
    });

    expect(view.todas).toHaveLength(1);
    expect(view.todas[0]?.origen).toBe('calculo');
    expect(view.todas[0]?.severidad).toBe('bloqueo');
  });

  it('mantiene separadas incidencias por trabajador con codigo + idPersona', () => {
    const view = buildIncidenciasPeriodo({
      bloqueosOperativos: [],
      advertenciasOperativas: [],
      resultadoBloqueos: [],
      resultadoAdvertencias: [],
      expedienteProblemas: [
        { severidad: 'bloqueo', titulo: 'ISSUE_TRAB', detalle: 'A', idPersona: 1 },
        { severidad: 'bloqueo', titulo: 'ISSUE_TRAB', detalle: 'B', idPersona: 2 },
      ],
    });

    expect(view.todas).toHaveLength(2);
    expect(view.porAmbito.trabajadores).toHaveLength(2);
  });

  it('conserva mayor severidad al fusionar duplicados', () => {
    const view = buildIncidenciasPeriodo({
      bloqueosOperativos: [],
      advertenciasOperativas: [{
        codigo: 'MV_BORRADOR',
        titulo: 'Movimiento en borrador',
        descripcion: 'Revisar',
        severidad: 'warning',
      }],
      resultadoBloqueos: [{
        codigo: 'MV_BORRADOR',
        titulo: 'Movimiento bloqueado',
        descripcion: 'No aprobado',
      }],
      resultadoAdvertencias: [],
    });

    expect(view.todas).toHaveLength(1);
    expect(view.todas[0]?.severidad).toBe('bloqueo');
  });

  it('prefiere origen calculo sobre prevalidacion a igual severidad', () => {
    const view = buildIncidenciasPeriodo({
      bloqueosOperativos: [{
        codigo: 'CALC_X',
        titulo: 'Prevalidación',
        descripcion: 'Desde prevalidación',
        severidad: 'danger',
      }],
      advertenciasOperativas: [],
      resultadoBloqueos: [{
        codigo: 'CALC_X',
        titulo: 'Cálculo',
        descripcion: 'Desde cálculo',
      }],
      resultadoAdvertencias: [],
    });

    expect(view.todas[0]?.origen).toBe('calculo');
    expect(view.todas[0]?.titulo).toBe('Cálculo');
  });

  it('resumen coincide con lista deduplicada', () => {
    const view = buildIncidenciasPeriodo({
      bloqueosOperativos: [{
        codigo: 'B1',
        titulo: 'Bloqueo',
        descripcion: 'Uno',
        severidad: 'danger',
      }],
      advertenciasOperativas: [{
        codigo: 'A1',
        titulo: 'Aviso',
        descripcion: 'Dos',
        severidad: 'warning',
      }],
      informacionesOperativas: [{
        codigo: 'I1',
        titulo: 'Info',
        descripcion: 'Tres',
        severidad: 'info',
      }],
      resultadoBloqueos: [],
      resultadoAdvertencias: [],
    });

    expect(view.resumen.bloqueos + view.resumen.advertencias + view.resumen.infos).toBe(view.todas.length);
    expect(view.resumen.bloqueos).toBe(1);
    expect(view.resumen.advertencias).toBe(1);
    expect(view.resumen.infos).toBe(1);
  });

  it('expediente con trabajador expone accion revisar trabajador', () => {
    const view = buildIncidenciasPeriodo({
      bloqueosOperativos: [],
      advertenciasOperativas: [],
      resultadoBloqueos: [],
      resultadoAdvertencias: [],
      expedienteProblemas: [{
        severidad: 'bloqueo',
        titulo: 'FICHA_INCOMPLETA',
        detalle: 'Falta validar ficha',
        idPersona: 5,
      }],
    });

    expect(view.todas[0]?.accion?.label).toBe('Revisar trabajador');
    expect(view.todas[0]?.accion?.tipo).toBe('tab');
  });

  it('expediente de parametros expone ruta a parametros', () => {
    const view = buildIncidenciasPeriodo({
      bloqueosOperativos: [],
      advertenciasOperativas: [],
      resultadoBloqueos: [],
      resultadoAdvertencias: [],
      expedienteProblemas: [{
        severidad: 'bloqueo',
        titulo: 'PARAM_UF',
        detalle: 'Falta UF del período',
      }],
    });

    expect(view.todas[0]?.accion?.tipo).toBe('ruta');
    expect(view.todas[0]?.accion?.destino).toBe('/parametros');
  });

  it('pendiente sin accionLabel sugiere etiqueta por ambito', () => {
    const view = buildIncidenciasPeriodo({
      bloqueosOperativos: [{
        codigo: 'MV_BORRADOR',
        titulo: 'Movimiento pendiente',
        descripcion: 'Revisar borrador',
        severidad: 'danger',
      }],
      advertenciasOperativas: [],
      resultadoBloqueos: [],
      resultadoAdvertencias: [],
    });

    expect(view.todas[0]?.accion?.label).toBe('Revisar movimiento');
  });

  it('porAmbito parametros coincide con filtro manual', () => {
    const view = buildIncidenciasPeriodo({
      bloqueosOperativos: [{
        codigo: 'PARAM_X',
        titulo: 'Parámetros',
        descripcion: 'Falta catálogo',
        severidad: 'danger',
        ruta: '/parametros',
      }],
      advertenciasOperativas: [{
        codigo: 'TRAB_Y',
        titulo: 'Trabajador',
        descripcion: 'Revisar ficha',
        severidad: 'warning',
      }],
      resultadoBloqueos: [],
      resultadoAdvertencias: [],
    });

    const manual = view.todas.filter((inc) => inc.ambito === 'parametros');
    expect(view.porAmbito.parametros).toEqual(manual);
    expect(view.porAmbito.parametros).toHaveLength(1);
  });

  it('deduplica PARAMETROS_SIN_FILA y parametros_generales del expediente', () => {
    const view = buildIncidenciasPeriodo({
      bloqueosOperativos: [{
        codigo: 'PARAMETROS_SIN_FILA',
        titulo: 'Parámetros del período por revisar',
        descripcion: 'Faltan parámetros generales del período',
        severidad: 'danger',
        ruta: '/parametros',
      }],
      advertenciasOperativas: [],
      resultadoBloqueos: [],
      resultadoAdvertencias: [],
      expedienteProblemas: [{
        severidad: 'bloqueo',
        titulo: 'parametros_generales',
        detalle: 'Faltan parámetros generales del período',
      }],
    });

    expect(view.todas).toHaveLength(1);
    expect(view.todas[0]?.ambito).toBe('parametros');
  });

  it('deduplica por mensaje humanizado aunque el codigo difiera', () => {
    const mensaje = 'Falta el valor UF mensual para el período seleccionado';
    const view = buildIncidenciasPeriodo({
      bloqueosOperativos: [{
        codigo: 'UF_NULL',
        titulo: 'UF pendiente',
        descripcion: mensaje,
        severidad: 'danger',
        ruta: '/parametros',
      }],
      advertenciasOperativas: [],
      resultadoBloqueos: [],
      resultadoAdvertencias: [],
      expedienteProblemas: [{
        severidad: 'bloqueo',
        titulo: 'valor_uf_mensual',
        detalle: mensaje,
      }],
    });

    expect(view.todas).toHaveLength(1);
    expect(view.todas[0]?.ambito).toBe('parametros');
  });

  it('oculta advertencia obsoleta de empresa Ley 16.744 aunque venga de cálculo o expediente', () => {
    const detalle =
      'Falta datos de empresa Ley 16.744. se calcula solo tasa basica si existe.';
    const view = buildIncidenciasPeriodo({
      bloqueosOperativos: [],
      advertenciasOperativas: [{
        codigo: 'LEY_16744_EMPRESA_INCOMPLETA',
        titulo: 'Advertencia del resultado',
        descripcion: detalle,
        severidad: 'warning',
      }],
      resultadoBloqueos: [],
      resultadoAdvertencias: [],
      expedienteProblemas: [{
        severidad: 'advertencia',
        titulo: 'LEY_16744_EMPRESA_INCOMPLETA',
        detalle,
        trabajador: 'Ana Pérez · 12.345.678-9',
      }],
    });

    expect(view.todas).toHaveLength(0);
  });

  it('deduplica SANNA repetida por trabajador en expediente', () => {
    const detalle =
      'SANNA no definido en parametros_generales.sanna; queda pendiente sin afectar liquido trabajador.';
    const view = buildIncidenciasPeriodo({
      bloqueosOperativos: [],
      advertenciasOperativas: [{
        codigo: 'SANNA_NO_DEFINIDO',
        titulo: 'Advertencia del resultado',
        descripcion: detalle,
        severidad: 'warning',
      }],
      resultadoBloqueos: [],
      resultadoAdvertencias: [],
      expedienteProblemas: [
        {
          severidad: 'advertencia',
          titulo: 'SANNA_NO_DEFINIDO',
          detalle,
          trabajador: 'Ana Pérez · 12.345.678-9',
        },
        {
          severidad: 'advertencia',
          titulo: 'SANNA_NO_DEFINIDO',
          detalle,
          trabajador: 'Luis Gómez · 98.765.432-1',
        },
      ],
    });

    expect(view.todas).toHaveLength(1);
    expect(view.todas[0]?.ambito).toBe('parametros');
  });

  it('no duplica expediente y prevalidacion con misma clave', () => {
    const view = buildIncidenciasPeriodo({
      bloqueosOperativos: [{
        codigo: 'SANNA_NO_DEFINIDO',
        titulo: 'SANNA',
        descripcion: 'No definido',
        severidad: 'warning',
      }],
      advertenciasOperativas: [],
      resultadoBloqueos: [],
      resultadoAdvertencias: [],
      expedienteProblemas: [{
        severidad: 'advertencia',
        titulo: 'SANNA_NO_DEFINIDO',
        detalle: 'No definido',
      }],
    });

    expect(view.todas).toHaveLength(1);
  });

  it('ordena por severidad bloqueo advertencia info', () => {
    const crudas: IncidenciaPeriodo[] = [
      {
        id: 'I1',
        severidad: 'info',
        ambito: 'periodo',
        titulo: 'Info',
        detalle: 'Info',
        origen: 'prevalidacion',
        prioridad: 3,
      },
      {
        id: 'B1',
        severidad: 'bloqueo',
        ambito: 'parametros',
        titulo: 'Bloqueo',
        detalle: 'Bloqueo',
        origen: 'prevalidacion',
        prioridad: 1,
      },
      {
        id: 'A1',
        severidad: 'advertencia',
        ambito: 'resultado',
        titulo: 'Aviso',
        detalle: 'Aviso',
        origen: 'calculo',
        prioridad: 2,
      },
    ];

    expect(ordenarIncidencias(crudas).map((inc) => inc.severidad)).toEqual([
      'bloqueo',
      'advertencia',
      'info',
    ]);

    const view = buildIncidenciasPeriodo({
      bloqueosOperativos: [{
        codigo: 'B1',
        titulo: 'Bloqueo',
        descripcion: 'Uno',
        severidad: 'danger',
      }],
      advertenciasOperativas: [{
        codigo: 'A1',
        titulo: 'Aviso',
        descripcion: 'Dos',
        severidad: 'warning',
      }],
      informacionesOperativas: [{
        codigo: 'I1',
        titulo: 'Info',
        descripcion: 'Tres',
        severidad: 'info',
      }],
      resultadoBloqueos: [],
      resultadoAdvertencias: [],
    });

    expect(view.todas.map((inc) => inc.severidad)).toEqual(['bloqueo', 'advertencia', 'info']);
  });

  it('porDetalleTab coincide con filtro manual por tab operativo', () => {
    const view = buildIncidenciasPeriodo({
      bloqueosOperativos: [
        {
          codigo: 'PARAM_A',
          titulo: 'Parámetro A',
          descripcion: 'A',
          severidad: 'danger',
          ruta: '/parametros',
        },
        {
          codigo: 'PARAM_B',
          titulo: 'Parámetro B',
          descripcion: 'B',
          severidad: 'danger',
          ruta: '/parametros',
        },
      ],
      advertenciasOperativas: [{
        codigo: 'TRAB_X',
        titulo: 'Trabajador',
        descripcion: 'Revisar',
        severidad: 'warning',
      }],
      resultadoBloqueos: [],
      resultadoAdvertencias: [{
        codigo: 'RESULT_WARN',
        titulo: 'Resultado',
        descripcion: 'Advertencia resultado',
      }],
    });

    const tabs = ['parametros', 'trabajadores', 'resultado'] as const;
    for (const tab of tabs) {
      const manual = view.todas.filter((inc) => {
        if (tab === 'parametros') return inc.ambito === 'parametros';
        if (tab === 'trabajadores') {
          return (
            inc.ambito === 'trabajadores'
            || inc.ambito === 'movimientos'
            || inc.ambito === 'recurrentes'
          );
        }
        return inc.ambito === 'resultado' || inc.ambito === 'calculo';
      });
      expect(view.porDetalleTab[tab]).toEqual(manual);
    }
    expect(view.porDetalleTab.movimientos_recurrentes).toEqual([]);
  });

  it('conserva accion si alguna duplicada la define', () => {
    const view = buildIncidenciasPeriodo({
      bloqueosOperativos: [{
        codigo: 'PARAM_Z',
        titulo: 'Sin acción',
        descripcion: 'Detalle',
        severidad: 'danger',
      }],
      advertenciasOperativas: [],
      resultadoBloqueos: [{
        codigo: 'PARAM_Z',
        titulo: 'Con acción',
        descripcion: 'Detalle',
        ruta: '/parametros',
        accionLabel: 'Revisar parámetros',
      }],
      resultadoAdvertencias: [],
    });

    expect(view.todas[0]?.accion).toMatchObject({
      tipo: 'ruta',
      label: 'Revisar parámetros',
    });
  });
});
