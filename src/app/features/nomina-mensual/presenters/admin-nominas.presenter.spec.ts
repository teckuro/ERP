import { describe, expect, it } from 'vitest';

import { crearNominaResumen } from '../models/nomina-periodo.models';
import type { NominaPeriodoResumen } from '../models/nomina-periodo.models';
import {
  COLUMNAS_ADMIN_NOMINAS,
  crearFiltrosAdminNominas,
  filtrarResumenes,
  PERSISTENCIA_GRILLA_ADMIN,
} from './admin-nominas.presenter';

function muestraResumenes(): NominaPeriodoResumen[] {
  return [
    crearNominaResumen({
      id: 'r-1',
      periodo: '2026-06',
      empresaId: 'emp-001',
      empresaNombre: 'Constructora Andes Ltda.',
      tipo: 'mensual',
      estado: 'dotacion_generada',
      totalIncidenciasCriticas: 2,
      totalAdvertencias: 5,
    }),
    crearNominaResumen({
      id: 'r-2',
      periodo: '2026-05',
      empresaId: 'emp-001',
      empresaNombre: 'Constructora Andes Ltda.',
      tipo: 'mensual',
      estado: 'cerrada',
      totalIncidenciasCriticas: 0,
      totalAdvertencias: 1,
    }),
    crearNominaResumen({
      id: 'r-3',
      periodo: '2026-06',
      empresaId: 'emp-002',
      empresaNombre: 'Servicios Logística Ltda.',
      tipo: 'mensual',
      estado: 'borrador',
      totalIncidenciasCriticas: 0,
      totalAdvertencias: 0,
    }),
    crearNominaResumen({
      id: 'r-4',
      periodo: '2026-05',
      empresaId: 'emp-001',
      empresaNombre: 'Constructora Andes Ltda.',
      tipo: 'extraordinaria',
      estado: 'calculada',
      totalIncidenciasCriticas: 0,
      totalAdvertencias: 0,
    }),
  ];
}

describe('admin-nominas.presenter — columnas y filtros declarativos', () => {
  it('Test 1 — COLUMNAS_ADMIN_NOMINAS expone 9 columnas en el orden esperado', () => {
    expect(COLUMNAS_ADMIN_NOMINAS).toHaveLength(9);
    expect(COLUMNAS_ADMIN_NOMINAS.map((c) => c.id)).toEqual([
      'periodo',
      'empresa',
      'tipo',
      'trabajadores',
      'segmentos',
      'incidencias',
      'estado',
      'actualizada',
      'acciones',
    ]);
    expect(PERSISTENCIA_GRILLA_ADMIN).toBe('admin-nominas-grid-v1');
  });

  it('Test 2 — crearFiltrosAdminNominas genera filtros con IDs únicos y conserva el filtro búsqueda + observaciones', () => {
    const filtros = crearFiltrosAdminNominas(muestraResumenes());
    const ids = filtros.map((f) => f.id);

    expect(new Set(ids).size).toBe(filtros.length);
    expect(ids).toContain('busqueda');
    expect(ids).toContain('conIncidencias');
    expect(ids).toContain('periodo');
    expect(ids).toContain('estado');
    expect(ids).toContain('tipo');
  });
});

describe('admin-nominas.presenter — filtrarResumenes', () => {
  it('Test 3 — filtra por estado="borrador"', () => {
    const filtradas = filtrarResumenes(muestraResumenes(), { estado: 'borrador' });
    expect(filtradas).toHaveLength(1);
    expect(filtradas[0].id).toBe('r-3');
  });

  it('Test 4 — filtra "observaciones=criticas" solo retorna filas con críticas > 0', () => {
    const filtradas = filtrarResumenes(muestraResumenes(), { observaciones: 'criticas' });
    expect(filtradas).toHaveLength(1);
    expect(filtradas[0].id).toBe('r-1');
    expect(filtradas[0].totalIncidenciasCriticas).toBeGreaterThan(0);
  });

  it('Test 5 — búsqueda libre matchea texto sobre empresa, período y etiquetas', () => {
    const porEmpresa = filtrarResumenes(muestraResumenes(), { busqueda: 'Andes' });
    expect(porEmpresa.every((r) => r.empresaNombre.includes('Andes'))).toBe(true);
    expect(porEmpresa).toHaveLength(3);

    const porPeriodo = filtrarResumenes(muestraResumenes(), { busqueda: '2026-05' });
    expect(porPeriodo).toHaveLength(2);
  });

  it('Test 6 — filtro "observaciones=advertencias" excluye filas con críticas', () => {
    const filtradas = filtrarResumenes(muestraResumenes(), { observaciones: 'advertencias' });
    expect(filtradas).toHaveLength(1);
    expect(filtradas[0].id).toBe('r-2');
  });

  it('Test 7 — combinación de filtros opera con AND (estado + tipo)', () => {
    const filtradas = filtrarResumenes(muestraResumenes(), {
      estado: 'calculada',
      tipo: 'extraordinaria',
    });
    expect(filtradas).toHaveLength(1);
    expect(filtradas[0].id).toBe('r-4');
  });
});
