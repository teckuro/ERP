/**
 * Catálogo Lucide del Administrador de Nóminas.
 *
 * Registrar en `app.config.ts` con:
 * `LucideAngularModule.pick({ ...otrosModulos, ...ADMIN_NOMINAS_LUCIDE_ICONS })`
 *
 * Los templates y presenters usan nombres kebab-case (`list-plus`, `circle-alert`, …).
 * Este archivo es la fuente de verdad de los símbolos importados.
 */

import {
  ArrowLeftRight,
  ArrowRight,
  Calculator,
  CircleAlert,
  CircleCheck,
  Clock,
  Eye,
  FileCheck,
  GitBranch,
  History,
  ListPlus,
  LoaderCircle,
  Lock,
  Minus,
  OctagonX,
  Receipt,
  RefreshCw,
  Repeat,
  Settings,
  ShieldCheck,
  Trash2,
  TriangleAlert,
  Users,
  X,
} from 'lucide-angular/src/icons';

/** Iconos usados por bandeja, modales historial/resumen y presenters del módulo. */
export const ADMIN_NOMINAS_LUCIDE_ICONS = {
  ArrowLeftRight,
  ArrowRight,
  Calculator,
  CircleAlert,
  CircleCheck,
  Clock,
  Eye,
  FileCheck,
  GitBranch,
  History,
  ListPlus,
  LoaderCircle,
  Lock,
  Minus,
  OctagonX,
  Receipt,
  RefreshCw,
  Repeat,
  Settings,
  ShieldCheck,
  Trash2,
  TriangleAlert,
  Users,
  X,
} as const;
