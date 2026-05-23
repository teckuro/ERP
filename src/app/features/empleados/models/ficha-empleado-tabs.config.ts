import {
  ETIQUETAS_TAB_FICHA_EMPLEADO,
  type ClaveTabFichaEmpleado,
} from '../rules/ficha-empleado-presentacion.rules';

export type { ClaveTabFichaEmpleado };

export interface ItemTabFichaEmpleado {
  id: ClaveTabFichaEmpleado;
  label: string;
}

export const FICHA_EMPLEADO_TABS: readonly ItemTabFichaEmpleado[] = (
  Object.entries(ETIQUETAS_TAB_FICHA_EMPLEADO) as [ClaveTabFichaEmpleado, string][]
).map(([id, label]) => ({ id, label }));

export type FichaEmpleadoSaveTarget = 'general' | 'laboral' | 'remuneracion' | 'prevision' | 'pago';

export function fichaSaveTargetForTab(
  idTab: ClaveTabFichaEmpleado,
): FichaEmpleadoSaveTarget | null {
  switch (idTab) {
    case 'general':
    case 'laboral':
    case 'remuneracion':
    case 'prevision':
    case 'pago':
      return idTab;
    case 'documentos':
    case 'historial':
      return null;
  }
}

export const FICHA_DETALLE_BLOCK_IDS: Readonly<Record<string, string>> = {
  'Identificación legal': 'identificacion',
  'Nombre del colaborador': 'nombre',
  'Información personal y contacto': 'base',
  'Domicilio particular': 'ubicacion',
  'Relación laboral': 'relacion',
  'Condiciones especiales': 'condiciones-especiales',
  Contrato: 'contrato',
  'Centro de costo y estado': 'centro-costo',
  Remuneración: 'remuneracion',
  'Cargas familiares': 'cargas',
  'Zona extrema': 'zona-extrema',
  'Beneficio semana corrida': 'semana-corrida',
  'Régimen previsional': 'regimen',
  AFP: 'afp',
  'IPS (Ex INP)': 'ips',
  Salud: 'salud',
  APVI: 'apvi',
  'Cuenta de abono': 'cuenta',
};

export const FICHA_COMPONENT_BLOCK_IDS: Readonly<Record<string, string>> = {
  'zona-extrema': 'zonaExtrema',
  'semana-corrida': 'semanaCorrida',
  'centro-costo': 'centroCosto',
};

export function fichaBlockIdFromTitle(title: string): string {
  return FICHA_DETALLE_BLOCK_IDS[title] ?? title.toLowerCase().replace(/\s+/g, '-');
}

export function fichaComponentBlockId(blockId: string): string {
  return FICHA_COMPONENT_BLOCK_IDS[blockId] ?? blockId;
}

import type { EmpleadoFichaValidacionItem } from '../rules/empleado-diagnostico.rules';

/** Primer paso del wizard avanzado asociado a cada bloque de ficha (fallback). */
export const FICHA_CLAVE_TAB_WIZARD_STEP_FALLBACK: Readonly<Partial<Record<ClaveTabFichaEmpleado, number>>> = {
  general: 0,
  laboral: 2,
  remuneracion: 3,
  prevision: 5,
  pago: 7,
};

export function wizardStepDesdeClaveTab(
  clave: ClaveTabFichaEmpleado,
  items: readonly EmpleadoFichaValidacionItem[],
): number {
  const pending = items.find(
    (item) => item.tabFicha === clave && item.visible && !item.complete,
  );
  if (pending) {
    return pending.wizardStep;
  }
  return FICHA_CLAVE_TAB_WIZARD_STEP_FALLBACK[clave] ?? 0;
}
