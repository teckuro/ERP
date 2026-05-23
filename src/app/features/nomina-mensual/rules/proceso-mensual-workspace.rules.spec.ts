import { describe, expect, it } from 'vitest';

import type { ProcesoMensualAccionPrincipalVm } from './proceso-mensual-estado-operativo.rules';
import {
  buildAlertasPeriodoResumen,
  buildBitacoraEtapas,
  buildNominaDetallePanelCopy,
  buildNominaFrameView,
  buildNominaGuiaPanelCopy,
  buildResumenRevisionTrabajadores,
  resolveNominaVisualFrame,
  suggestNominaWorkspaceTab,
} from './proceso-mensual-workspace.rules';
import type { ProcesoMensualEstadoOperativoVm } from './proceso-mensual-estado-operativo.rules';

const accionLocal = (label: string): ProcesoMensualAccionPrincipalVm => ({
  label,
  descripcion: '',
  tipo: 'local',
  accionLocal: 'validarPeriodo',
});

const estadoBase = (overrides: Partial<ProcesoMensualEstadoOperativoVm> = {}): ProcesoMensualEstadoOperativoVm =>
  ({
    estadoClave: 'pendiente_validacion',
    titulo: 'Sin generar',
    descripcion: '',
    severidad: 'neutral',
    accionPrincipal: accionLocal('Generar nómina'),
    etapaActiva: 'validar',
    disclosureActivo: 'base',
    timeline: [],
    queFaltaAhora: [],
    accionesRapidas: [],
    bloqueos: [],
    advertencias: [],
    informaciones: [],
    trabajadoresPendientesRevision: [],
    ...overrides,
  }) as ProcesoMensualEstadoOperativoVm;

describe('proceso-mensual-workspace.rules', () => {
  it('buildNominaFrameView en generando evita lenguaje de sistema', () => {
    const vm = buildNominaFrameView({
      frame: 'generando',
      estadoClave: 'pendiente_validacion',
      accion: accionLocal('Generar nómina'),
      periodoEtiqueta: 'Mayo 2026',
      bloqueosCount: 0,
      advertenciasCount: 0,
      trabajadoresCount: 0,
      resumenRevisionTrabajadores: 'sin observaciones disponibles',
      accionPeriodoEnCurso: false,
    });

    expect(vm.texto).toContain('Estamos revisando');
    expect(vm.texto.toLowerCase()).not.toContain('el sistema');
    expect(vm.texto.toLowerCase()).not.toContain('snapshot');
  });

  it('buildNominaFrameView en_revision con base_lista usa chip Borrador generado', () => {
    const vm = buildNominaFrameView({
      frame: 'en_revision',
      estadoClave: 'base_lista',
      accion: accionLocal('Revisar trabajadores'),
      periodoEtiqueta: 'Mayo 2026',
      bloqueosCount: 0,
      advertenciasCount: 0,
      trabajadoresCount: 3,
      resumenRevisionTrabajadores: '2 listos, 1 por revisar y 0 bloqueados',
      accionPeriodoEnCurso: false,
    });

    expect(vm.chip).toBe('Borrador generado');
    expect(vm.titulo).toContain('Borrador');
  });

  it('buildNominaFrameView liquidaciones usa chip Liquidaciones disponibles', () => {
    const vm = buildNominaFrameView({
      frame: 'liquidaciones_generadas',
      estadoClave: 'liquidaciones_disponibles',
      accion: accionLocal('Ver liquidaciones'),
      periodoEtiqueta: 'Mayo 2026',
      bloqueosCount: 0,
      advertenciasCount: 0,
      trabajadoresCount: 0,
      resumenRevisionTrabajadores: 'sin observaciones disponibles',
      accionPeriodoEnCurso: false,
    });

    expect(vm.chip).toBe('Liquidaciones disponibles');
    expect(vm.info.toLowerCase()).not.toContain('snapshot');
  });

  it('buildAlertasPeriodoResumen en evaluacion', () => {
    const vm = buildAlertasPeriodoResumen({
      validando: true,
      tieneResultado: false,
      bloqueosCount: 0,
      advertenciasCount: 0,
    });
    expect(vm.modo).toBe('evaluando');
    expect(vm.mensaje).toContain('Preparando');
  });

  it('buildAlertasPeriodoResumen usa tieneResultado como prevalidación (no solo store)', () => {
    const sinPrevalidacion = buildAlertasPeriodoResumen({
      validando: false,
      tieneResultado: false,
      bloqueosCount: 2,
      advertenciasCount: 1,
    });
    expect(sinPrevalidacion.modo).toBe('sin-evaluar');

    const conPrevalidacion = buildAlertasPeriodoResumen({
      validando: false,
      tieneResultado: true,
      bloqueosCount: 2,
      advertenciasCount: 1,
    });
    expect(conPrevalidacion.modo).not.toBe('sin_verificar');
  });

  it('buildBitacoraEtapas normaliza tildes en resumen activo', () => {
    const etapas = buildBitacoraEtapas({
      estado: estadoBase({ etapaActiva: 'validar' }),
      tieneResultado: false,
      tienePreNomina: false,
      tieneCalculo: false,
      tieneSnapshot: false,
      tieneAprobacion: false,
      nominaCerrada: false,
    });
    const validar = etapas.find((e) => e.clave === 'validar');
    expect(validar?.resumen).toContain('Verificación en curso');
  });

  it('buildNominaGuiaPanelCopy confirmar expone aside', () => {
    const guia = buildNominaGuiaPanelCopy('lista_para_confirmar', 'Mayo 2026');
    expect(guia.variant).toBe('confirmar');
    expect(guia.asideTitulo).toContain('Mayo 2026');
  });

  it('buildNominaDetallePanelCopy oficial sin snapshot', () => {
    const detalle = buildNominaDetallePanelCopy('confirmada');
    expect(detalle.titulo).toBe('Versión oficial del período');
    expect(detalle.campo4).toBe('Estado');
    expect(detalle.estadoOficialLabel).toBe('Base oficial para liquidaciones');
  });

  it('buildNominaDetallePanelCopy periodo usa total liquido estimado', () => {
    const detalle = buildNominaDetallePanelCopy('sin_generar');
    expect(detalle.campo4).toBe('Total líquido estimado');
  });

  it('buildResumenRevisionTrabajadores evita calculados', () => {
    const texto = buildResumenRevisionTrabajadores({
      listos: 2,
      porRevisar: 1,
      bloqueados: 0,
      tieneDatos: true,
    });
    expect(texto).toContain('listos');
    expect(texto.toLowerCase()).not.toContain('calculad');
  });

  it('buildBitacoraEtapas tolera estado sin listas de mensajes', () => {
    const etapas = buildBitacoraEtapas({
      estado: estadoBase({ advertencias: undefined as any, bloqueos: undefined as any }),
      tieneResultado: true,
      tienePreNomina: false,
      tieneCalculo: false,
      tieneSnapshot: false,
      tieneAprobacion: false,
      nominaCerrada: false,
    });

    expect(etapas.find((e) => e.clave === 'validar')).toBeTruthy();
    expect(etapas.map((e) => e.clave)).toContain('base');
  });

  it('resolveNominaVisualFrame mapea base_lista a en_revision', () => {
    expect(
      resolveNominaVisualFrame({
        validando: false,
        generandoPreNomina: false,
        calculandoPreliminar: false,
        rehidratandoPeriodo: false,
        estadoClave: 'base_lista',
      }),
    ).toBe('en_revision');
  });

  it('suggestNominaWorkspaceTab evita resumen como tab inicial visible', () => {
    expect(suggestNominaWorkspaceTab('sin_generar')).toBe('parametros');
    expect(suggestNominaWorkspaceTab('en_revision')).toBe('trabajadores');
    expect(suggestNominaWorkspaceTab('lista_para_confirmar')).toBe('trabajadores');
  });
});
