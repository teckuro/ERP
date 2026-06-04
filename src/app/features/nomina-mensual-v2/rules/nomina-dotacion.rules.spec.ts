import { describe, expect, it } from 'vitest';

import type { FilaTrabajadorNominaResumen } from '../../nomina-mensual/models/nomina-periodo.models';
import {
  clasificarFilasParaPreview,
  puedeAplicarAccionMasiva,
  puedeAsignarSegmento,
  puedeAvanzarDotacion,
} from './nomina-dotacion.rules';

function fila(estado: FilaTrabajadorNominaResumen['estado']): FilaTrabajadorNominaResumen {
  return {
    trabajadorId: `t-${estado}`,
    nombre: `Persona ${estado}`,
    rut: '11111111-1',
    estado,
    totalIncidenciasCriticas: 0,
    totalAdvertencias: 0,
    totalMovimientos: 0,
    tieneDatosBancarios: true,
    tieneDatosPrevisionales: true,
  };
}

describe('nomina-dotacion.rules', () => {
  it('permite acciones masivas en todos los estados menos bloqueado', () => {
    expect(puedeAplicarAccionMasiva(fila('listo'))).toBe(true);
    expect(puedeAplicarAccionMasiva(fila('advertencia'))).toBe(true);
    expect(puedeAplicarAccionMasiva(fila('critico'))).toBe(true);
    expect(puedeAplicarAccionMasiva(fila('bloqueado'))).toBe(false);
  });

  it('permite asignar segmento sólo si el trabajador no está bloqueado', () => {
    expect(puedeAsignarSegmento(fila('listo'))).toBe(true);
    expect(puedeAsignarSegmento(fila('bloqueado'))).toBe(false);
  });

  it('bloquea avance cuando la dotación está vacía', () => {
    const resultado = puedeAvanzarDotacion([]);
    expect(resultado.puede).toBe(false);
    expect(resultado.motivo).toMatch(/dotación/i);
  });

  it('bloquea avance cuando hay al menos un trabajador bloqueado', () => {
    const resultado = puedeAvanzarDotacion([fila('listo'), fila('bloqueado')]);
    expect(resultado.puede).toBe(false);
    expect(resultado.motivo).toMatch(/bloqueados/i);
  });

  it('permite avanzar cuando todos los trabajadores están listos o con advertencias', () => {
    const resultado = puedeAvanzarDotacion([fila('listo'), fila('advertencia'), fila('critico')]);
    expect(resultado.puede).toBe(true);
    expect(resultado.motivo).toBeUndefined();
  });

  it('separa filas aplicables y descartadas para preview de acción masiva', () => {
    const { aplicables, descartadas } = clasificarFilasParaPreview([
      fila('listo'),
      fila('bloqueado'),
      fila('advertencia'),
    ]);
    expect(aplicables.map((f) => f.estado)).toEqual(['listo', 'advertencia']);
    expect(descartadas.map((f) => f.estado)).toEqual(['bloqueado']);
  });
});
