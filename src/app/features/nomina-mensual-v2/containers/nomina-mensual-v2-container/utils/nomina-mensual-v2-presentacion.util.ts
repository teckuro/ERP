import type { ChecklistStatus, StatusTone } from '../../../models/nomina-mensual-v2.models';
import type { SeveridadChecklistEmpleados } from '../../../presenters/nomina-empleados-validacion.presenter';

export function claseTono(tone: StatusTone): string {
  return `tone-${tone}`;
}

export function tonoBadgeMetrica(tone: StatusTone): 'blue' | 'green' | 'amber' | 'red' | 'slate' {
  switch (tone) {
    case 'blue':
      return 'blue';
    case 'green':
      return 'green';
    case 'amber':
      return 'amber';
    case 'red':
      return 'red';
    default:
      return 'slate';
  }
}

export function claseChecklist(status: ChecklistStatus): string {
  return `status-${status}`;
}

export function claseSeveridadChecklist(severidad: SeveridadChecklistEmpleados): string {
  switch (severidad) {
    case 'correcto':
      return 'empleados-checklist-severidad--correcto';
    case 'advertencia':
      return 'empleados-checklist-severidad--advertencia';
    case 'bloqueante':
      return 'empleados-checklist-severidad--bloqueante';
  }
}

export function claseChipFiltroChecklist(severidad: SeveridadChecklistEmpleados | null): string {
  switch (severidad) {
    case 'bloqueante':
      return 'empleados-filtro-chip nomina-chip empleados-filtro-chip--bloqueante nomina-chip--danger';
    case 'advertencia':
      return 'empleados-filtro-chip nomina-chip empleados-filtro-chip--advertencia nomina-chip--warning';
    default:
      return 'empleados-filtro-chip nomina-chip empleados-filtro-chip--neutro nomina-chip--neutral';
  }
}

export function inicialesNombre(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

export function iconoMetrica(metricId: string): string {
  if (metricId.includes('worker') || metricId.includes('workers') || metricId.includes('active') || metricId.includes('employees') || metricId.includes('processed')) {
    return 'users';
  }
  if (metricId.includes('contract')) return 'file-text';
  if (metricId.includes('bank')) return 'landmark';
  if (metricId.includes('document')) return 'folder-open';
  if (metricId.includes('earning')) return 'circle-dollar-sign';
  if (metricId.includes('deduction')) return 'minus-circle';
  if (metricId.includes('license')) return 'calendar';
  if (metricId.includes('recurring')) return 'repeat-2';
  if (metricId.includes('hash') || metricId.includes('integrity')) return 'fingerprint';
  if (metricId.includes('blocker')) return 'octagon-x';
  if (metricId.includes('warning')) return 'triangle-alert';
  if (metricId.includes('net')) return 'wallet';
  if (metricId.includes('sent')) return 'send';
  if (metricId.includes('pending')) return 'clock-3';
  if (metricId.includes('signature')) return 'file-check-2';
  if (metricId.includes('period')) return 'calendar-days';
  if (metricId.includes('state')) return 'badge-check';
  if (metricId.includes('issued')) return 'file-check-2';
  if (metricId.includes('rules')) return 'shield-check';
  return 'activity';
}

export function iconoEstado(tone: StatusTone): string {
  switch (tone) {
    case 'green':
      return 'check-circle-2';
    case 'amber':
      return 'triangle-alert';
    case 'red':
      return 'circle-alert';
    case 'blue':
      return 'info';
    case 'purple':
      return 'sparkles';
    case 'gray':
      return 'circle';
  }
}

export function iconoChecklist(status: ChecklistStatus): string {
  switch (status) {
    case 'success':
      return 'check-circle-2';
    case 'warning':
      return 'triangle-alert';
    case 'error':
      return 'circle-alert';
    case 'pending':
      return 'clock-3';
  }
}
