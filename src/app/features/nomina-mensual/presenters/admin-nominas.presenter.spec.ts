import { describe, expect, it } from 'vitest';

import { crearNominaResumen } from '../models/nomina-periodo.models';
import type { NominaPeriodoResumen } from '../models/nomina-periodo.models';
import {
  COLUMNAS_ADMIN_NOMINAS,
  crearFiltrosAdminNominas,
  filtrarResumenes,
  mensajeEmptyFiltradoAdminNominas,
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
  it('Test 1 — COLUMNAS_ADMIN_NOMINAS expone 7 columnas en el orden esperado (NOIA-ADM-NOM-BANDEJA-02)', () => {
    expect(COLUMNAS_ADMIN_NOMINAS).toHaveLength(7);
    expect(COLUMNAS_ADMIN_NOMINAS.map((c) => c.id)).toEqual([
      'periodo',
      'empresa',
      'estado',
      'proximoPaso',
      'trabajadores',
      'actualizada',
      'acciones',
    ]);
    const acciones = COLUMNAS_ADMIN_NOMINAS.find((c) => c.id === 'acciones');
    expect(acciones?.header).toBe('Acciones');
    expect(acciones?.align).toBe('center');
    expect(acciones?.headerClass).toContain('text-center');
    expect(acciones?.headerClass).toContain('font-semibold');
    expect(acciones?.sortable).toBe(false);
    expect(PERSISTENCIA_GRILLA_ADMIN).toBe('admin-nominas-grid-v2');
  });

  it('Test 2 — crearFiltrosAdminNominas genera filtros con IDs únicos y vista operativa con 3 opciones (sin duplicado con Estado)', () => {
    const filtros = crearFiltrosAdminNominas(muestraResumenes());
    const ids = filtros.map((f) => f.id);

    expect(new Set(ids).size).toBe(filtros.length);
    expect(ids).toContain('busqueda');
    expect(ids[0]).toBe('vistaOperativa');
    expect(ids).toContain('conIncidencias');
    expect(ids).toContain('periodo');
    expect(ids).toContain('estado');
    expect(ids).toContain('tipo');
    expect(filtros[0]?.initialValue).toBe('requiere-accion');

    const opciones = (filtros[0]?.options ?? []) as Array<{ value: string }>;
    expect(opciones.map((o) => o.value)).toEqual([
      'requiere-accion',
      'con-criticas',
      'todas',
    ]);
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

  it('Test 8 — vista operativa concentra el resumen dentro de la grilla (3 opciones)', () => {
    expect(filtrarResumenes(muestraResumenes(), { vistaOperativa: 'con-criticas' })
      .map((fila) => fila.id)).toEqual(['r-1']);
    expect(filtrarResumenes(muestraResumenes(), { vistaOperativa: 'todas' }))
      .toHaveLength(4);
    expect(filtrarResumenes(muestraResumenes(), { vistaOperativa: 'requiere-accion' })
      .some((fila) => fila.estado === 'cerrada')).toBe(false);
  });

  it('Test 9 — filtra por naturaleza cuando hay rectificaciones', () => {
    const resumenes = [
      ...muestraResumenes(),
      crearNominaResumen({
        id: 'r-5',
        periodo: '2026-06',
        naturaleza: 'rectificacion',
        estado: 'borrador',
      }),
    ];
    const filtradas = filtrarResumenes(resumenes, { naturaleza: 'rectificacion' });
    expect(filtradas).toHaveLength(1);
    expect(filtradas[0]?.id).toBe('r-5');
  });

  it('Test 10 — búsqueda libre incluye naturaleza (rectificación)', () => {
    const resumenes = [
      crearNominaResumen({
        id: 'r-rect',
        naturaleza: 'rectificacion',
        empresaNombre: 'Demo SpA',
      }),
    ];
    const filtradas = filtrarResumenes(resumenes, { busqueda: 'rectificacion' });
    expect(filtradas).toHaveLength(1);
  });

  it('mensajeEmptyFiltradoAdminNominas avisa cuando todas quedan fuera de requiere-accion', () => {
    const resumenes = [
      crearNominaResumen({ id: 'cerrada-1', estado: 'cerrada', requiereAccion: false }),
      crearNominaResumen({ id: 'cerrada-2', estado: 'liquidada', requiereAccion: false }),
    ];
    const mensaje = mensajeEmptyFiltradoAdminNominas(resumenes);
    expect(mensaje?.title).toContain('requieran acción');
    expect(mensaje?.description).toContain('2 nóminas');
    expect(mensaje?.description).toContain('Todas');
  });
});
