import fs from 'node:fs';

const src =
  'src/app/features/nomina-mensual/containers/proceso-mensual-container/proceso-mensual-container.ts';
let c = fs.readFileSync(src, 'utf8');

c = c.replace(
  "import { ChangeDetectionStrategy, Component, HostListener, computed, effect, inject, signal, untracked } from '@angular/core';",
  "import { HostListener, Injectable, computed, effect, inject, signal, untracked } from '@angular/core';",
);
c = c.replace(/import \{ CommonModule \} from '@angular\/common';\n/, '');
c = c.replace(/import \{ RouterLink \} from '@angular\/router';\n/, '');
c = c.replace(/import \{ LucideAngularModule \} from 'lucide-angular';\n\n/, '');
c = c.replace(/import \{ MessageBoxComponent \} from '[^']+';\n/, '');
c = c.replace(/import \{ DataGridComponent \} from '[^']+';\n/, '');
c = c.replace(
  /import \{\s*RecordBreadcrumbComponent,\s*type RecordBreadcrumbItem,\s*\} from '[^']+';\n/,
  "import { type RecordBreadcrumbItem } from '../../../../shared/components/ui/record-breadcrumb.component';\n",
);
c = c.replace("import { ProcesoMensualService } from '../../services/proceso-mensual.service';\n", '');
c = c.replace(
  "import type { ActaOperativaPeriodoViewModel } from '../../models/acta-operativa-periodo.model';",
  `import type { ActaOperativaPeriodoViewModel } from '../../models/acta-operativa-periodo.model';
import { ProcesoMensualPeriodoStore } from '../store/proceso-mensual-periodo.store';
import { formatoFechaHoraNomina, formatoMontoNomina, horaCortaNomina } from '../utils/proceso-mensual-presentacion.formato';`,
);
c = c.replace(
  "} from './models/proceso-mensual-grid.config';",
  "} from '../models/proceso-mensual-grid.config';",
);
c = c.replace(
  "} from './models/proceso-mensual-container.vm';",
  "} from '../models/proceso-mensual-container.vm';",
);
c = c.replace(/@Component\(\{[\s\S]*?\}\)\n/, '');
c = c.replace('export class ProcesoMensualContainer', '@Injectable()\nexport class ProcesoMensualPresentacionFacade');

const storeSignals = [
  'resultado', 'preNomina', 'calculo', 'snapshotActivo', 'validando', 'generandoPreNomina',
  'calculandoPreliminar', 'guardandoSnapshot', 'consultandoSnapshot', 'consultandoSnapshotCompleto',
  'errorEjecucion', 'errorGuardadoResultado', 'errorAprobacionOperativa', 'errorCierreOperativo',
  'errorSnapshotCompleto', 'exitoGuardadoResultado', 'identificadorResultadoGuardadoActual',
  'aprobacionOperativa', 'aprobandoResultado', 'cerrandoNomina', 'snapshotCompleto',
];

const header = `export class ProcesoMensualPresentacionFacade {
  readonly store = inject(ProcesoMensualPeriodoStore);
  readonly periodoActivo = inject(PeriodoActivoService);

  readonly breadcrumbItems: readonly RecordBreadcrumbItem[] = [
    { label: 'Remuneraciones', link: '/remuneraciones' },
    { label: 'Nómina mensual' },
  ];

  readonly periodoSeleccionado = this.store.periodoSeleccionado;
${storeSignals.map((s) => `  readonly ${s} = this.store.${s};`).join('\n')}
  readonly confirmacionProceso = signal<ConfirmacionProcesoMensualView | null>(null);
  readonly detalleOperativoAbierto = signal(false);
  readonly detalleOperativoTabActivo = signal<DetalleOperativoTab>('trabajadores');
  readonly nominaWorkspaceTab = signal<NominaWorkspaceTab>('guia');
  readonly actaOperativaPreparada = signal(false);

  accionPeriodoEnCurso(): boolean {
    return this.store.accionPeriodoEnCurso();
  }
`;

c = c.replace(/export class ProcesoMensualPresentacionFacade \{[\s\S]*?  seleccionarNominaWorkspaceTab/, header + '\n  seleccionarNominaWorkspaceTab');

c = c.replace(/  constructor\(\) \{[\s\S]*?  \}\n\n/, '');

for (const s of storeSignals) {
  c = c.replaceAll(`this.${s}.set`, `this.store.${s}.set`);
  c = c.replaceAll(`this.${s}()`, `this.store.${s}()`);
}
c = c.replaceAll('this.periodoSeleccionado()', 'this.store.periodoSeleccionado()');
c = c.replaceAll('this.procesoMensual', 'this.store.procesoMensual');

// async delegates
c = c.replace(/  validarPeriodo\(\): void \{[\s\S]*?  \}\n\n  generarPreNomina/, '  validarPeriodo(): void {\n    this.store.validarPeriodo();\n  }\n\n  generarPreNomina');
c = c.replace(/  generarPreNomina\(\): void \{[\s\S]*?  \}\n\n  calcularPreliminar/, '  generarPreNomina(): void {\n    this.store.generarPreNomina();\n  }\n\n  calcularPreliminar');
c = c.replace(
  /  calcularPreliminar\(\): void \{[\s\S]*?  \}\n\n  guardarSnapshotPreliminar/,
  `  calcularPreliminar(): void {
    if (!this.puedeCalcularPreliminar()) return;
    this.store.calcularPreliminar();
  }

  guardarSnapshotPreliminar`,
);
c = c.replace(/  private ejecutarGuardarSnapshotPreliminar\(\): void \{[\s\S]*?  \}\n\n  verSnapshotActivo/, '  private ejecutarGuardarSnapshotPreliminar(): void {\n    this.store.ejecutarGuardarSnapshotPreliminar();\n  }\n\n  verSnapshotActivo');
c = c.replace(/  verSnapshotActivo\(\): void \{[\s\S]*?  \}\n\n  consultarDetalleResultadoGuardado/, '  verSnapshotActivo(): void {\n    this.store.verSnapshotActivo();\n  }\n\n  consultarDetalleResultadoGuardado');
c = c.replace(
  /  consultarDetalleResultadoGuardado\(\): void \{[\s\S]*?  \}\n\n  private resetearEstadoPeriodo/,
  '  consultarDetalleResultadoGuardado(): void {\n    this.store.consultarDetalleResultadoGuardado();\n  }\n\n  private resetearEstadoPeriodo',
);
c = c.replace(
  /  private resetearEstadoPeriodo\(\): void \{[\s\S]*?  \}\n\n  recalcularYReemplazarSnapshot/,
  `  private resetearEstadoPeriodo(): void {
    this.store.resetearEstadoPeriodo();
    this.confirmacionProceso.set(null);
    this.actaOperativaPreparada.set(false);
  }

  recalcularYReemplazarSnapshot`,
);
c = c.replace(/  recalcularYReemplazarSnapshot\(\): void \{[\s\S]*?  \}\n\n  etiquetaEstadoGlobal/, '  recalcularYReemplazarSnapshot(): void {\n    this.store.recalcularYReemplazarSnapshot();\n  }\n\n  etiquetaEstadoGlobal');

c = c.replace(
  /  private ejecutarAprobacionOperativa\([\s\S]*?  \}\n\n  revisarBaseNomina/,
  '  private ejecutarAprobacionOperativa(advertenciasAprobacion: string[]): void {\n    this.store.ejecutarAprobacionOperativa(advertenciasAprobacion);\n  }\n\n  revisarBaseNomina',
);
c = c.replace(
  /  private ejecutarCierreNominaOperativa\(\): void \{[\s\S]*?  \}\n\n  confirmarAccionProceso/,
  '  private ejecutarCierreNominaOperativa(): void {\n    this.store.ejecutarCierreNominaOperativa();\n  }\n\n  confirmarAccionProceso',
);

// remove private snapshot helpers (store owns them)
c = c.replace(/  private cargarSnapshotActivo\([\s\S]*?  \}\n\n  private cargarSnapshotCompletoActivo/, '');
c = c.replace(/  private cargarSnapshotCompletoActivo\([\s\S]*?  \}\n\n  private aplicarSnapshotActivo/, '');
c = c.replace(/  private aplicarSnapshotActivo\([\s\S]*?  \}\n\n  private aprobacionDesdeSnapshot/, '');
c = c.replace(/  private aprobacionDesdeSnapshot\([\s\S]*?  \}\n\n  private etiquetaEstadoSnapshotTrabajador/, '  private etiquetaEstadoSnapshotTrabajador');

c = c.replace(
  /  formatoMonto\(valor: number \| null \| undefined\): string \{[\s\S]*?  \}\n\n  private formatoFechaHora/,
  '  formatoMonto(valor: number | null | undefined): string {\n    return formatoMontoNomina(valor);\n  }\n\n  private formatoFechaHora',
);
c = c.replace(
  /  private formatoFechaHora\(valor: string \| null \| undefined\): string \{[\s\S]*?  \}\n\n  private horaCorta/,
  '  private formatoFechaHora(valor: string | null | undefined): string {\n    return formatoFechaHoraNomina(valor);\n  }\n\n  private horaCorta',
);
c = c.replace(
  /  private horaCorta\(valor: string \| null \| undefined\): string \{[\s\S]*?  \}\n\n  private resumenRevisionTrabajadores/,
  '  private horaCorta(valor: string | null | undefined): string {\n    return horaCortaNomina(valor);\n  }\n\n  private resumenRevisionTrabajadores',
);

// nominaEstaCerrada - if exists
c = c.replace(
  /  nominaEstaCerradaOperativamente\(\): boolean \{[\s\S]*?  \}\n/,
  '  nominaEstaCerradaOperativamente(): boolean {\n    return this.store.nominaEstaCerradaOperativamente();\n  }\n',
);

const out =
  'src/app/features/nomina-mensual/containers/proceso-mensual-container/facade/proceso-mensual-presentacion.facade.ts';
fs.writeFileSync(out, c);
console.log('facade', c.split('\n').length, 'lines');
