import { describe, expect, it } from 'vitest';

import {
  evaluarEtapaFlujoCompleto,
  FLUJO_COMPLETO_ETAPAS,
  destinoRevisarBloqueosAbreTrabajadores,
  revisionRailConBorradorAlDia,
  shellDebePriorizarValidacionLocal,
} from './proceso-mensual-flujo-completo.rules';

describe('proceso-mensual-flujo-completo.rules', () => {
  it('matriz de etapas cubre el flujo RRHH de punta a punta', () => {
    expect(FLUJO_COMPLETO_ETAPAS.map((e) => e.id)).toEqual([
      'sin_verificar',
      'listo_generar',
      'borrador_pendiente_trabajadores',
      'borrador_revision_al_dia',
      'calculo_con_bloqueos',
      'calculo_listo_guardar',
      'resultado_guardado',
      'aprobado_confirmar',
    ]);
  });

  it.each(FLUJO_COMPLETO_ETAPAS.map((e) => [e.id, e] as const))(
    'etapa %s resuelve estado y CTA esperados',
    (id) => {
      const { alineada, esperada, resuelta } = evaluarEtapaFlujoCompleto(id);
      expect(alineada, `estado=${resuelta.estadoClave} cta=${resuelta.accionPrincipal.label}`).toBe(true);
      expect(esperada.shellUsaValidacionLocal).toBe(true);
    },
  );

  it('usa una unica accion local para el CTA visible Confirmar nomina', () => {
    const acciones = FLUJO_COMPLETO_ETAPAS
      .map((etapa) => evaluarEtapaFlujoCompleto(etapa.id).resuelta.accionPrincipal)
      .filter((accion) => accion.label === 'Confirmar nómina')
      .map((accion) => accion.accionLocal);

    expect(new Set(acciones)).toEqual(new Set(['confirmarNomina']));
  });

  it('borrador con revision al dia no pide Generar nomina en CTA principal', () => {
    const { resuelta } = evaluarEtapaFlujoCompleto('borrador_revision_al_dia');
    expect(resuelta.accionPrincipal.label).not.toBe('Generar nómina');
    expect(resuelta.accionPrincipal.label).toBe('Confirmar nómina');
  });

  it('revisarBloqueos abre detalle trabajadores en workspace', () => {
    expect(destinoRevisarBloqueosAbreTrabajadores()).toBe(true);
  });

  it('shell con revisarBloqueos tiene correccion paralela pero validacion es prioritaria', () => {
    expect(shellDebePriorizarValidacionLocal('revisarBloqueos')).toBe(true);
    expect(shellDebePriorizarValidacionLocal('generarBase')).toBe(false);
  });

  it('rail con borrador y revision al dia confirma nomina', () => {
    const cta = revisionRailConBorradorAlDia({
      baseGenerada: true,
      puedeGenerarNomina: false,
      puedeCalcular: true,
      hayPendientesRevisionTrabajadores: false,
      revisionTrabajadoresCompleta: true,
    });
    expect(cta.label).toBe('Confirmar nómina');
    expect(cta.accionLocal).toBe('confirmarNomina');
    expect(cta.usarPanel).toBe(false);
  });

  it('rail con pendientes de trabajador abre panel', () => {
    const cta = revisionRailConBorradorAlDia({
      baseGenerada: true,
      puedeGenerarNomina: false,
      puedeCalcular: true,
      hayPendientesRevisionTrabajadores: true,
      revisionTrabajadoresCompleta: false,
    });
    expect(cta.usarPanel).toBe(true);
    expect(cta.label).toBe('Revisar trabajadores');
  });
});
