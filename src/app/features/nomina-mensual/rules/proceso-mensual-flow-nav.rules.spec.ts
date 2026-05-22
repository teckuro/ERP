import { describe, expect, it } from 'vitest';

import {
  appendNominaFlowQuery,
  buildNominaFlowReturnUrl,
  buildRevisionRailCta,
  mostrarResumenAmpliadoEnRail,
  debeRehidratarDesdeFlowQuery,
  detalleTabUsaModal,
  filtrarPendientesRailSecundarios,
  idPersonaDesdeFlowQuery,
  NOMINA_FLOW_RETURN_PATH,
  periodoYmDesdeFlowQuery,
  resolveFlowDestinoPorFrame,
  resolveNominaEstadoRrhh,
  resolveWorkspaceTargetFromAccionLocal,
  resolveWorkspaceTargetFromDetalleTab,
} from './proceso-mensual-flow-nav.rules';

describe('proceso-mensual-flow-nav.rules', () => {
  it('resolveWorkspaceTargetFromDetalleTab envía trabajadores al panel', () => {
    expect(resolveWorkspaceTargetFromDetalleTab('trabajadores')).toEqual({
      tabVisible: 'detalle_mensual',
      detalleVista: 'trabajadores',
      legacyTab: 'trabajadores',
    });
  });

  it('resolveWorkspaceTargetFromDetalleTab deja resultado en modal', () => {
    expect(resolveWorkspaceTargetFromDetalleTab('resultado')).toBeNull();
    expect(detalleTabUsaModal('resultado')).toBe(true);
  });

  it('revisarBloqueos abre detalle trabajadores', () => {
    expect(resolveWorkspaceTargetFromAccionLocal('revisarBloqueos')?.detalleVista).toBe('trabajadores');
  });

  it('appendNominaFlowQuery agrega periodo y retorno', () => {
    const url = appendNominaFlowQuery('/remuneraciones/novedades-mensuales', '2026-05');
    expect(url).toContain('periodo=2026-05');
    expect(url).toContain('returnTo=%2Fremuneraciones%2Fproceso-mensual');
  });

  it('appendNominaFlowQuery incluye idPersona cuando aplica', () => {
    const url = appendNominaFlowQuery('/remuneraciones/novedades-mensuales', '2026-05', 42);
    expect(url).toContain('idPersona=42');
  });

  it('idPersonaDesdeFlowQuery valida entero positivo', () => {
    expect(idPersonaDesdeFlowQuery({ idPersona: '10' })).toBe(10);
    expect(idPersonaDesdeFlowQuery({ idPersona: '0' })).toBeNull();
    expect(idPersonaDesdeFlowQuery({ idPersona: 'x' })).toBeNull();
  });

  it('buildNominaFlowReturnUrl conserva contexto de retorno', () => {
    const url = buildNominaFlowReturnUrl('2026-05', 7);
    expect(url).toContain(NOMINA_FLOW_RETURN_PATH);
    expect(url).toContain('periodo=2026-05');
    expect(url).toContain('idPersona=7');
  });

  it('resolveNominaEstadoRrhh mapea frames visibles', () => {
    expect(resolveNominaEstadoRrhh('lista_para_confirmar').etiqueta).toBe('Lista para confirmar');
    expect(resolveNominaEstadoRrhh('sin_generar').etiqueta).toBe('Sin generar');
  });

  it('periodoYmDesdeFlowQuery valida formato', () => {
    expect(periodoYmDesdeFlowQuery({ periodo: '2026-05' })).toBe('2026-05');
    expect(periodoYmDesdeFlowQuery({ periodo: 'invalid' })).toBeNull();
  });

  it('resolveFlowDestinoPorFrame alinea en_revision a trabajadores', () => {
    expect(resolveFlowDestinoPorFrame('en_revision').detalleVista).toBe('trabajadores');
  });

  it('debeRehidratarDesdeFlowQuery exige returnTo de nomina mensual', () => {
    expect(debeRehidratarDesdeFlowQuery({ periodo: '2026-05', returnTo: NOMINA_FLOW_RETURN_PATH })).toBe(true);
    expect(debeRehidratarDesdeFlowQuery({ periodo: '2026-05' })).toBe(false);
  });

  it('buildRevisionRailCta prioriza panel para trabajadores', () => {
    const destino = resolveWorkspaceTargetFromDetalleTab('trabajadores');
    const cta = buildRevisionRailCta('trabajadores', destino);
    expect(cta.usarPanel).toBe(true);
    expect(cta.label).toBe('Revisar trabajadores');
  });

  it('buildRevisionRailCta etiqueta movimientos como revision de trabajadores', () => {
    const cta = buildRevisionRailCta('trabajadores', {
      tabVisible: 'detalle_mensual',
      detalleVista: 'trabajadores',
      legacyTab: 'trabajadores',
      filtroMasivo: 'con_movimientos',
    });
    expect(cta.usarPanel).toBe(true);
    expect(cta.label).toBe('Revisar trabajadores');
  });

  it('buildRevisionRailCta sin pendientes y sin base ofrece generar nomina', () => {
    const cta = buildRevisionRailCta('trabajadores', resolveWorkspaceTargetFromDetalleTab('trabajadores'), {
      baseGenerada: false,
      puedeGenerarNomina: true,
      puedeCalcular: false,
      hayPendientesRevisionTrabajadores: false,
      revisionTrabajadoresCompleta: true,
    });
    expect(cta.label).toBe('Generar nómina');
    expect(cta.accionLocal).toBe('generarBase');
    expect(cta.usarPanel).toBe(false);
  });

  it('buildRevisionRailCta con borrador y revision al dia confirma nomina', () => {
    const cta = buildRevisionRailCta('trabajadores', resolveWorkspaceTargetFromDetalleTab('trabajadores'), {
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

  it('buildRevisionRailCta sin nomina generada no ofrece ver resumen del periodo', () => {
    const cta = buildRevisionRailCta('resumen', null, {
      baseGenerada: false,
      puedeGenerarNomina: false,
      puedeCalcular: false,
      hayPendientesRevisionTrabajadores: false,
      hayFichasPendientesPrevalidacion: false,
      revisionTrabajadoresCompleta: true,
    });
    expect(cta.label).not.toBe('Ver resumen del período');
    expect(cta.tabModal).toBeUndefined();
  });

  it('buildRevisionRailCta sin base y con fichas pendientes abre revision guiada', () => {
    const cta = buildRevisionRailCta('resumen', null, {
      baseGenerada: false,
      puedeGenerarNomina: false,
      puedeCalcular: false,
      hayPendientesRevisionTrabajadores: false,
      hayFichasPendientesPrevalidacion: true,
      revisionTrabajadoresCompleta: true,
    });
    expect(cta.label).toBe('Revisar trabajadores');
    expect(cta.revisarFichasGuiada).toBe(true);
  });

  it('mostrarResumenAmpliadoEnRail exige nomina generada y vista trabajadores', () => {
    expect(mostrarResumenAmpliadoEnRail({ nominaGenerada: true, vistaTrabajadores: true })).toBe(true);
    expect(mostrarResumenAmpliadoEnRail({ nominaGenerada: false, vistaTrabajadores: true })).toBe(false);
    expect(mostrarResumenAmpliadoEnRail({ nominaGenerada: true, vistaTrabajadores: false })).toBe(false);
  });

  it('filtrarPendientesRailSecundarios omite acciones que ya viven en trabajadores', () => {
    const filtrados = filtrarPendientesRailSecundarios(
      [
        {
          codigo: 'A',
          titulo: 'Advertencia A',
          descripcion: 'Detalle',
          severidad: 'warning',
          accionLabel: 'Revisar trabajadores',
        },
        {
          codigo: 'M',
          titulo: 'Movimientos',
          descripcion: 'Revise movimientos por trabajador',
          severidad: 'warning',
          accionLabel: 'Revisar movimientos',
        },
        {
          codigo: 'B',
          titulo: 'Parámetros',
          descripcion: 'Falta UF',
          severidad: 'danger',
          accionLabel: 'Revisar parámetros',
        },
        {
          codigo: 'C',
          titulo: 'Fichas',
          descripcion: 'Revise',
          severidad: 'warning',
          accionLabel: 'Revisar fichas',
        },
      ],
      'Revisar trabajadores',
    );
    expect(filtrados).toHaveLength(0);
  });

  it('filtrarPendientesRailSecundarios omite parametros si listos', () => {
    const filtrados = filtrarPendientesRailSecundarios(
      [
        {
          codigo: 'PARAM_X',
          titulo: 'Parámetros',
          descripcion: 'Opcional',
          severidad: 'warning',
          accionLabel: 'Revisar parámetros',
        },
        {
          codigo: 'ADV-003',
          titulo: 'Fichas',
          descripcion: 'Revise',
          severidad: 'warning',
          accionLabel: 'Revisar fichas',
        },
      ],
      'Revisar movimientos',
      2,
      { omitirParametrosSiListos: true },
    );
    expect(filtrados).toHaveLength(0);
  });
});
