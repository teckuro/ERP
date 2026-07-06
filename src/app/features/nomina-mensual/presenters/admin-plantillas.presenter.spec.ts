import { describe, expect, it } from 'vitest';

import type { NominaPlantillaCiclo } from '../models/nomina-plantilla-ciclo.models';
import {
  COLUMNAS_ADMIN_PLANTILLAS,
  crearFiltrosAdminPlantillas,
  estadoActivoToLabel,
  naturalezaPlantillaToLabel,
  ordenarPlantillasOperativas,
  PERSISTENCIA_GRILLA_PLANTILLAS,
  tipoPlantillaToLabel,
} from './admin-plantillas.presenter';

const PLANTILLA_BASE: NominaPlantillaCiclo = {
  id: 'plant-1',
  empresaId: '7',
  codigo: 'MES',
  nombre: 'Mes calendario',
  tipo: 'mensual',
  naturaleza: 'liquidacion_legal',
  reglaFechaPago: { tipo: 'ultimo_dia_habil' },
  politicaFinSemana: 'adelantar',
  reglaAnticipo: null,
  descripcion: null,
  activo: true,
  version: 1,
  createdAt: '',
  updatedAt: '',
};

describe('admin-plantillas.presenter', () => {
  it('expone una clave de persistencia estable', () => {
    expect(PERSISTENCIA_GRILLA_PLANTILLAS).toBe('admin-plantillas-ciclos-grid-v1');
  });

  it('tipoPlantillaToLabel traduce los cuatro tipos visibles', () => {
    expect(tipoPlantillaToLabel('mensual')).toBe('Mensual');
    expect(tipoPlantillaToLabel('quincenal')).toBe('Quincenal');
    expect(tipoPlantillaToLabel('semanal')).toBe('Semanal');
    expect(tipoPlantillaToLabel('extraordinaria')).toBe('Extraordinaria');
  });

  it('naturalezaPlantillaToLabel traduce las cuatro naturalezas', () => {
    expect(naturalezaPlantillaToLabel('liquidacion_legal')).toBe('Liquidación legal');
    expect(naturalezaPlantillaToLabel('anticipo')).toBe('Anticipo');
    expect(naturalezaPlantillaToLabel('pago_extraordinario')).toBe('Pago extraordinario');
    expect(naturalezaPlantillaToLabel('rectificacion')).toBe('Rectificación');
  });

  it('estadoActivoToLabel distingue activa de inactiva', () => {
    expect(estadoActivoToLabel(true)).toBe('Activa');
    expect(estadoActivoToLabel(false)).toBe('Inactiva');
  });

  it('COLUMNAS_ADMIN_PLANTILLAS incluye una columna por dimensión clave', () => {
    const ids = COLUMNAS_ADMIN_PLANTILLAS.map((c) => c.id);
    expect(ids).toEqual([
      'codigo',
      'nombre',
      'tipo',
      'naturaleza',
      'reglaFechaPago',
      'politicaFinSemana',
      'version',
      'activo',
      'acciones',
    ]);
  });

  it('crearFiltrosAdminPlantillas produce filtros de tipo, naturaleza y estado', () => {
    const filtros = crearFiltrosAdminPlantillas([PLANTILLA_BASE]);
    const ids = filtros.map((f) => f.id);
    expect(ids).toContain('tipo');
    expect(ids).toContain('naturaleza');
    expect(ids).toContain('estado');
  });

  it('filtro estado evalúa activo=true / activo=false coherentemente', () => {
    const filtros = crearFiltrosAdminPlantillas([PLANTILLA_BASE]);
    const filtroEstado = filtros.find((f) => f.id === 'estado');
    expect(filtroEstado?.predicate?.(PLANTILLA_BASE, 'true')).toBe(true);
    expect(filtroEstado?.predicate?.(PLANTILLA_BASE, 'false')).toBe(false);
    expect(filtroEstado?.predicate?.(PLANTILLA_BASE, '')).toBe(true);
  });

  it('ordenarPlantillasOperativas pone activas primero', () => {
    const inactiva: NominaPlantillaCiclo = {
      ...PLANTILLA_BASE,
      id: 'plant-old',
      activo: false,
      version: 0,
    };
    const activaQuincenal: NominaPlantillaCiclo = {
      ...PLANTILLA_BASE,
      id: 'plant-q',
      codigo: 'QUIN',
      tipo: 'quincenal',
      activo: true,
    };
    const orden = ordenarPlantillasOperativas([inactiva, PLANTILLA_BASE, activaQuincenal]);
    expect(orden.map((p) => p.id)).toEqual(['plant-1', 'plant-q', 'plant-old']);
  });

  it('ordenarPlantillasOperativas resuelve códigos iguales por versión descendente', () => {
    const v1: NominaPlantillaCiclo = { ...PLANTILLA_BASE, id: 'v1', activo: false, version: 1 };
    const v2: NominaPlantillaCiclo = { ...PLANTILLA_BASE, id: 'v2', activo: false, version: 2 };
    const orden = ordenarPlantillasOperativas([v1, v2]);
    expect(orden.map((p) => p.id)).toEqual(['v2', 'v1']);
  });
});
