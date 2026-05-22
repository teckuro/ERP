import type { ProcesoMensualAccionLocal, ProcesoMensualEstadoClave } from './proceso-mensual-estado-operativo.rules';
import {
  resolverEstadoOperativoProcesoMensual,
  type ProcesoMensualEstadoOperativoInput,
} from './proceso-mensual-estado-operativo.rules';
import {
  buildRevisionRailCta,
  resolveWorkspaceTargetFromAccionLocal,
  resolveWorkspaceTargetFromDetalleTab,
  type RevisionRailContext,
} from './proceso-mensual-flow-nav.rules';
import { resolveAccionCorreccionDesdeFrameCta } from './proceso-mensual-correccion.rules';

/** Etapas del flujo RRHH documentado en nomina-mensual-confirmacion-flow.md */
export type FlujoCompletoEtapaId =
  | 'sin_verificar'
  | 'listo_generar'
  | 'borrador_pendiente_trabajadores'
  | 'borrador_revision_al_dia'
  | 'calculo_con_bloqueos'
  | 'calculo_listo_guardar'
  | 'resultado_guardado'
  | 'aprobado_confirmar';

export interface FlujoCompletoEtapaEsperada {
  id: FlujoCompletoEtapaId;
  input: ProcesoMensualEstadoOperativoInput;
  estadoClave: ProcesoMensualEstadoClave;
  ctaLabel: string;
  ctaAccionLocal?: ProcesoMensualAccionLocal;
  /** Shell debe usar validación local antes que dispatcher de corrección. */
  shellUsaValidacionLocal: boolean;
}

function inputFlujo(overrides: Partial<ProcesoMensualEstadoOperativoInput>): ProcesoMensualEstadoOperativoInput {
  return {
    periodoValido: true,
    tienePrevalidacion: false,
    parametrosOperativos: false,
    bloqueosPrevalidacion: [],
    advertenciasPrevalidacion: [],
    informacionesPrevalidacion: [],
    baseGenerada: false,
    calculoGenerado: false,
    calculoConBloqueos: false,
    calculoConAdvertencias: false,
    bloqueosCalculo: [],
    advertenciasCalculo: [],
    resultadoGuardado: false,
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

/** Matriz de referencia del flujo completo (contrato RRHH). */
export const FLUJO_COMPLETO_ETAPAS: readonly FlujoCompletoEtapaEsperada[] = [
  {
    id: 'sin_verificar',
    input: inputFlujo({ periodoValido: true }),
    estadoClave: 'pendiente_validacion',
    ctaLabel: 'Verificar período',
    ctaAccionLocal: 'validarPeriodo',
    shellUsaValidacionLocal: true,
  },
  {
    id: 'listo_generar',
    input: inputFlujo({
      tienePrevalidacion: true,
      parametrosOperativos: true,
      puedeGenerarBase: true,
    }),
    estadoClave: 'listo_para_generar_base',
    ctaLabel: 'Generar nómina',
    ctaAccionLocal: 'generarBase',
    shellUsaValidacionLocal: true,
  },
  {
    id: 'borrador_pendiente_trabajadores',
    input: inputFlujo({
      tienePrevalidacion: true,
      baseGenerada: true,
      puedeCalcular: true,
      revisionTrabajadoresCompleta: false,
    }),
    estadoClave: 'base_lista',
    ctaLabel: 'Revisar trabajadores',
    ctaAccionLocal: 'calcularPreliminar',
    shellUsaValidacionLocal: true,
  },
  {
    id: 'borrador_revision_al_dia',
    input: inputFlujo({
      tienePrevalidacion: true,
      baseGenerada: true,
      puedeCalcular: true,
      revisionTrabajadoresCompleta: true,
    }),
    estadoClave: 'base_lista',
    ctaLabel: 'Confirmar nómina',
    ctaAccionLocal: 'confirmarNomina',
    shellUsaValidacionLocal: true,
  },
  {
    id: 'calculo_con_bloqueos',
    input: inputFlujo({
      tienePrevalidacion: true,
      baseGenerada: true,
      calculoGenerado: true,
      calculoConBloqueos: true,
      bloqueosCalculo: [{
        codigo: 'CALC-BLOQ',
        titulo: 'Trabajador bloqueado',
        descripcion: 'Revise el trabajador.',
        severidad: 'danger',
      }],
    }),
    estadoClave: 'resultado_con_bloqueos',
    ctaLabel: 'Revisar trabajadores',
    ctaAccionLocal: 'revisarBloqueos',
    shellUsaValidacionLocal: true,
  },
  {
    id: 'calculo_listo_guardar',
    input: inputFlujo({
      tienePrevalidacion: true,
      baseGenerada: true,
      calculoGenerado: true,
      puedeGuardarResultado: true,
    }),
    estadoClave: 'resultado_listo_para_guardar',
    ctaLabel: 'Confirmar nómina',
    ctaAccionLocal: 'confirmarNomina',
    shellUsaValidacionLocal: true,
  },
  {
    id: 'resultado_guardado',
    input: inputFlujo({
      tienePrevalidacion: true,
      baseGenerada: true,
      calculoGenerado: true,
      resultadoGuardado: true,
      puedeAprobar: true,
    }),
    estadoClave: 'resultado_guardado',
    ctaLabel: 'Confirmar nómina',
    ctaAccionLocal: 'confirmarNomina',
    shellUsaValidacionLocal: true,
  },
  {
    id: 'aprobado_confirmar',
    input: inputFlujo({
      tienePrevalidacion: true,
      baseGenerada: true,
      calculoGenerado: true,
      resultadoGuardado: true,
      aprobadoOperativamente: true,
      puedeCerrar: true,
    }),
    estadoClave: 'aprobado_operativamente',
    ctaLabel: 'Confirmar nómina',
    ctaAccionLocal: 'confirmarNomina',
    shellUsaValidacionLocal: true,
  },
];

export function resolverEtapaFlujoCompleto(id: FlujoCompletoEtapaId): FlujoCompletoEtapaEsperada {
  const etapa = FLUJO_COMPLETO_ETAPAS.find((item) => item.id === id);
  if (!etapa) {
    throw new Error(`Etapa de flujo desconocida: ${id}`);
  }
  return etapa;
}

export function evaluarEtapaFlujoCompleto(id: FlujoCompletoEtapaId): {
  esperada: FlujoCompletoEtapaEsperada;
  resuelta: ReturnType<typeof resolverEstadoOperativoProcesoMensual>;
  alineada: boolean;
} {
  const esperada = resolverEtapaFlujoCompleto(id);
  const resuelta = resolverEstadoOperativoProcesoMensual(esperada.input);
  const alineada =
    resuelta.estadoClave === esperada.estadoClave
    && resuelta.accionPrincipal.label === esperada.ctaLabel
    && (esperada.ctaAccionLocal == null || resuelta.accionPrincipal.accionLocal === esperada.ctaAccionLocal);
  return { esperada, resuelta, alineada };
}

/** Rail alineado con revisión al día + borrador. */
export function revisionRailConBorradorAlDia(ctx: RevisionRailContext) {
  const tab = 'trabajadores' as const;
  return buildRevisionRailCta(tab, resolveWorkspaceTargetFromDetalleTab(tab), ctx);
}

export function shellDebePriorizarValidacionLocal(ctaAccion: ProcesoMensualAccionLocal): boolean {
  const accionCorreccion = resolveAccionCorreccionDesdeFrameCta({
    ctaTipo: 'local',
    ctaLabel: 'CTA',
    ctaAccion,
  });
  return accionCorreccion != null;
}

export function destinoRevisarBloqueosAbreTrabajadores(): boolean {
  const destino = resolveWorkspaceTargetFromAccionLocal('revisarBloqueos');
  return destino?.detalleVista === 'trabajadores' && destino.tabVisible === 'detalle_mensual';
}
