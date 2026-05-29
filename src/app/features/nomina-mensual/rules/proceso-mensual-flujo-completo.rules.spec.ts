import { describe, expect, it } from 'vitest';

import {
  resolverEstadoOperativoProcesoMensual,
  type ProcesoMensualEstadoOperativoInput,
} from './proceso-mensual-estado-operativo.rules';
import {
  evaluarEtapaFlujoCompleto,
  FLUJO_COMPLETO_ETAPAS,
  destinoRevisarBloqueosAbreTrabajadores,
  revisionRailConBorradorAlDia,
  shellDebePriorizarValidacionLocal,
} from './proceso-mensual-flujo-completo.rules';

/** Input base con prerrequisitos cumplidos hasta el resultado guardado. */
function inputAprobarEmitirCerrar(
  overrides: Partial<ProcesoMensualEstadoOperativoInput>,
): ProcesoMensualEstadoOperativoInput {
  return {
    periodoValido: true,
    tienePrevalidacion: true,
    parametrosOperativos: true,
    bloqueosPrevalidacion: [],
    advertenciasPrevalidacion: [],
    informacionesPrevalidacion: [],
    baseGenerada: true,
    calculoGenerado: true,
    calculoConBloqueos: false,
    calculoConAdvertencias: false,
    bloqueosCalculo: [],
    advertenciasCalculo: [],
    resultadoGuardado: true,
    aprobadoOperativamente: false,
    cerradoOperativamente: false,
    liquidacionesDisponibles: false,
    puedeGenerarBase: false,
    puedeCalcular: false,
    puedeGuardarResultado: false,
    puedeAprobar: false,
    puedeCerrar: false,
    ...overrides,
  };
}

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

  it('etapas previas a la aprobacion usan accion local confirmarNomina con salida visible unica', () => {
    const confirmacion = FLUJO_COMPLETO_ETAPAS
      .map((etapa) => evaluarEtapaFlujoCompleto(etapa.id).resuelta.accionPrincipal)
      .filter((accion) => accion.accionLocal === 'confirmarNomina')
      .map((accion) => accion.label);

    expect(new Set(confirmacion)).toEqual(new Set([
      'Calcular nómina preliminar',
      'Guardar revisión',
    ]));
  });

  it('split del flujo: aprobar -> emitir -> cerrar usa acciones locales separadas', () => {
    const guardado = evaluarEtapaFlujoCompleto('resultado_guardado').resuelta.accionPrincipal;
    expect(guardado.accionLocal).toBe('aprobarResultado');
    expect(guardado.label).toBe('Aprobar nómina');

    const cierre = evaluarEtapaFlujoCompleto('aprobado_confirmar').resuelta.accionPrincipal;
    expect(cierre.accionLocal).toBe('cerrarNomina');
    expect(cierre.label).toBe('Confirmar nómina');
  });

  it('borrador con revisión al día no pide Generar nómina en CTA principal', () => {
    const { resuelta } = evaluarEtapaFlujoCompleto('borrador_revision_al_dia');
    expect(resuelta.accionPrincipal.label).not.toBe('Generar nómina');
    expect(resuelta.accionPrincipal.label).toBe('Calcular nómina preliminar');
  });

  it('revisarBloqueos abre detalle trabajadores en workspace', () => {
    expect(destinoRevisarBloqueosAbreTrabajadores()).toBe(true);
  });

  it('shell con revisarBloqueos tiene correccion paralela pero validacion es prioritaria', () => {
    expect(shellDebePriorizarValidacionLocal('revisarBloqueos')).toBe(true);
    expect(shellDebePriorizarValidacionLocal('generarBase')).toBe(false);
  });

  it('rail con borrador y revision al dia calcula preliminar', () => {
    const cta = revisionRailConBorradorAlDia({
      baseGenerada: true,
      puedeGenerarNomina: false,
      puedeCalcular: true,
      hayPendientesRevisionTrabajadores: false,
      revisionTrabajadoresCompleta: true,
    });
    expect(cta.label).toBe('Calcular nómina preliminar');
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

// Paridad con el smoke autenticado app-level: snapshot -> validar -> aprobar -> emitir -> cerrar.
// Verifica que la pantalla exponga el orden aprobar -> emitir -> cerrar y que cada acción
// solo se habilite en su estado correcto, bloqueando transiciones inválidas.
describe('flujo app-level aprobar -> emitir -> cerrar (estado operativo)', () => {
  it('paso 1 (aprobar): resultado guardado ofrece "Aprobar nómina" habilitada', () => {
    const vm = resolverEstadoOperativoProcesoMensual(inputAprobarEmitirCerrar({ puedeAprobar: true }));
    expect(vm.estadoClave).toBe('resultado_guardado');
    expect(vm.accionPrincipal.tipo).toBe('local');
    expect(vm.accionPrincipal.accionLocal).toBe('aprobarResultado');
    expect(vm.accionPrincipal.label).toBe('Aprobar nómina');
    expect(vm.accionPrincipal.disabled ?? false).toBe(false);
  });

  it('paso 1 gating: sin puedeAprobar la acción de aprobar queda deshabilitada', () => {
    const vm = resolverEstadoOperativoProcesoMensual(
      inputAprobarEmitirCerrar({ puedeAprobar: false, razonNoPuedeAprobar: 'Faltan datos' }),
    );
    expect(vm.accionPrincipal.accionLocal).toBe('aprobarResultado');
    expect(vm.accionPrincipal.disabled).toBe(true);
  });

  it('paso 2 (emitir): aprobada sin liquidaciones enruta a "Generar liquidaciones"', () => {
    const vm = resolverEstadoOperativoProcesoMensual(
      inputAprobarEmitirCerrar({ aprobadoOperativamente: true, liquidacionesDisponibles: false }),
    );
    expect(vm.estadoClave).toBe('aprobado_operativamente');
    expect(vm.accionPrincipal.tipo).toBe('ruta');
    expect(vm.accionPrincipal.label).toBe('Generar liquidaciones');
    expect(vm.accionPrincipal.ruta).toBe('/remuneraciones/liquidaciones');
  });

  it('paso 2 bloquea cerrar antes de emitir: no ofrece cerrarNomina sin liquidaciones', () => {
    const vm = resolverEstadoOperativoProcesoMensual(
      // Aun con puedeCerrar=true, sin liquidaciones el cierre no debe ofrecerse.
      inputAprobarEmitirCerrar({ aprobadoOperativamente: true, liquidacionesDisponibles: false, puedeCerrar: true }),
    );
    expect(vm.accionPrincipal.accionLocal).not.toBe('cerrarNomina');
    expect(vm.accionPrincipal.label).toBe('Generar liquidaciones');
  });

  it('paso 3 (cerrar): aprobada con liquidaciones ofrece "Confirmar nómina" habilitada', () => {
    const vm = resolverEstadoOperativoProcesoMensual(
      inputAprobarEmitirCerrar({ aprobadoOperativamente: true, liquidacionesDisponibles: true, puedeCerrar: true }),
    );
    expect(vm.estadoClave).toBe('aprobado_operativamente');
    expect(vm.accionPrincipal.tipo).toBe('local');
    expect(vm.accionPrincipal.accionLocal).toBe('cerrarNomina');
    expect(vm.accionPrincipal.label).toBe('Confirmar nómina');
    expect(vm.accionPrincipal.disabled ?? false).toBe(false);
  });

  it('paso 3 gating: sin puedeCerrar la acción de cerrar queda deshabilitada', () => {
    const vm = resolverEstadoOperativoProcesoMensual(
      inputAprobarEmitirCerrar({
        aprobadoOperativamente: true,
        liquidacionesDisponibles: true,
        puedeCerrar: false,
        razonNoPuedeCerrar: 'Falta emitir',
      }),
    );
    expect(vm.accionPrincipal.accionLocal).toBe('cerrarNomina');
    expect(vm.accionPrincipal.disabled).toBe(true);
  });

  it('estado final cerrado no permite re-aprobar ni re-cerrar', () => {
    const vm = resolverEstadoOperativoProcesoMensual(
      inputAprobarEmitirCerrar({
        aprobadoOperativamente: true,
        cerradoOperativamente: true,
        liquidacionesDisponibles: true,
      }),
    );
    expect(vm.estadoClave).toBe('liquidaciones_disponibles');
    expect(vm.accionPrincipal.accionLocal).not.toBe('aprobarResultado');
    expect(vm.accionPrincipal.accionLocal).not.toBe('cerrarNomina');
  });

  it('secuencia on-screen respeta el orden aprobar -> emitir -> cerrar', () => {
    const aprobar = resolverEstadoOperativoProcesoMensual(
      inputAprobarEmitirCerrar({ puedeAprobar: true }),
    ).accionPrincipal.label;
    const emitir = resolverEstadoOperativoProcesoMensual(
      inputAprobarEmitirCerrar({ aprobadoOperativamente: true, liquidacionesDisponibles: false }),
    ).accionPrincipal.label;
    const cerrar = resolverEstadoOperativoProcesoMensual(
      inputAprobarEmitirCerrar({ aprobadoOperativamente: true, liquidacionesDisponibles: true, puedeCerrar: true }),
    ).accionPrincipal.label;

    expect([aprobar, emitir, cerrar]).toEqual([
      'Aprobar nómina',
      'Generar liquidaciones',
      'Confirmar nómina',
    ]);
  });
});
