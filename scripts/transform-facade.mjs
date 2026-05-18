import fs from 'node:fs';

const p = 'src/app/features/nomina-mensual/containers/proceso-mensual-container/facade/proceso-mensual-presentacion.facade.ts';
let c = fs.readFileSync(p, 'utf8');

c = c.replace(/@Component\(\{[\s\S]*?\}\)\n/, '');
c = c.replace('export class ProcesoMensualContainer', 'export class ProcesoMensualPresentacionFacade');
c = c.replace(
  "import { ChangeDetectionStrategy, Component, HostListener, computed, effect, inject, signal, untracked } from '@angular/core';",
  "import { HostListener, Injectable, computed, effect, inject, signal, untracked } from '@angular/core';",
);
c = c.replace(
  "import type { ActaOperativaPeriodoViewModel } from '../../models/acta-operativa-periodo.model';",
  `import type { ActaOperativaPeriodoViewModel } from '../../models/acta-operativa-periodo.model';
import { ProcesoMensualPeriodoStore } from '../store/proceso-mensual-periodo.store';
import { formatoFechaHoraNomina, formatoMontoNomina, horaCortaNomina } from '../utils/proceso-mensual-presentacion.formato';`,
);
c = c.replace(
  'export class ProcesoMensualPresentacionFacade {',
  '@Injectable()\nexport class ProcesoMensualPresentacionFacade {\n  readonly store = inject(ProcesoMensualPeriodoStore);',
);
c = c.replace(/  readonly periodoActivo = inject\(PeriodoActivoService\);\n  readonly procesoMensual = inject\(ProcesoMensualService\);\n\n/, '  readonly periodoActivo = inject(PeriodoActivoService);\n\n');

const signals = [
  'resultado', 'preNomina', 'calculo', 'snapshotActivo', 'validando', 'generandoPreNomina', 'calculandoPreliminar',
  'guardandoSnapshot', 'consultandoSnapshot', 'consultandoSnapshotCompleto', 'errorEjecucion', 'errorGuardadoResultado',
  'errorAprobacionOperativa', 'errorCierreOperativo', 'errorSnapshotCompleto', 'exitoGuardadoResultado',
  'identificadorResultadoGuardadoActual', 'aprobacionOperativa', 'aprobandoResultado', 'cerrandoNomina', 'snapshotCompleto',
];

for (const s of signals) {
  c = c.replace(new RegExp(`  readonly ${s} = signal<[^;]+;\\n`, 'g'), '');
}
c = c.replace(/  readonly periodoSeleccionado = computed\(\(\) => this\.periodoActivo\.periodoYm\(\)\);\n/, '');
c = c.replace(/  constructor\(\) \{[\s\S]*?  \}\n\n/, '');

for (const s of signals) {
  c = c.replaceAll(`this.${s}.set`, `this.store.${s}.set`);
  c = c.replaceAll(`this.${s}()`, `this.store.${s}()`);
}
c = c.replaceAll('this.periodoSeleccionado()', 'this.store.periodoSeleccionado()');
c = c.replaceAll('this.procesoMensual', 'this.store.procesoMensual');

c = c.replace(/  validarPeriodo\(\): void \{[\s\S]*?  \}\n\n  generarPreNomina/, '  validarPeriodo(): void { this.store.validarPeriodo(); }\n\n  generarPreNomina');
c = c.replace(/  generarPreNomina\(\): void \{[\s\S]*?  \}\n\n  calcularPreliminar/, '  generarPreNomina(): void { this.store.generarPreNomina(); }\n\n  calcularPreliminar');
c = c.replace(/  calcularPreliminar\(\): void \{[\s\S]*?  \}\n\n  guardarSnapshotPreliminar/, '  calcularPreliminar(): void { this.store.calcularPreliminar(); }\n\n  guardarSnapshotPreliminar');
c = c.replace(/  private ejecutarGuardarSnapshotPreliminar\(\): void \{[\s\S]*?  \}\n\n  verSnapshotActivo/, '  private ejecutarGuardarSnapshotPreliminar(): void { this.store.ejecutarGuardarSnapshotPreliminar(); }\n\n  verSnapshotActivo');
c = c.replace(/  verSnapshotActivo\(\): void \{[\s\S]*?  \}\n\n  consultarDetalleResultadoGuardado/, '  verSnapshotActivo(): void { this.store.verSnapshotActivo(); }\n\n  consultarDetalleResultadoGuardado');
c = c.replace(/  private resetearEstadoPeriodo\(\): void \{[\s\S]*?  \}\n\n  recalcularYReemplazarSnapshot/, '  private resetearEstadoPeriodo(): void { this.store.resetearEstadoPeriodo(); }\n\n  recalcularYReemplazarSnapshot');
c = c.replace(/  recalcularYReemplazarSnapshot\(\): void \{[\s\S]*?  \}\n\n  etiquetaEstadoGlobal/, '  recalcularYReemplazarSnapshot(): void { this.store.recalcularYReemplazarSnapshot(); }\n\n  etiquetaEstadoGlobal');
c = c.replace(/  private ejecutarAprobacionOperativa\([\s\S]*?  \}\n\n  revisarBaseNomina/, '  private ejecutarAprobacionOperativa(advertenciasAprobacion: string[]): void { this.store.ejecutarAprobacionOperativa(advertenciasAprobacion); }\n\n  revisarBaseNomina');
c = c.replace(/  private ejecutarCierreNominaOperativa\(\): void \{[\s\S]*?  \}\n\n  confirmarAccionProceso/, '  private ejecutarCierreNominaOperativa(): void { this.store.ejecutarCierreNominaOperativa(); }\n\n  confirmarAccionProceso');
c = c.replace(/  private cargarSnapshotActivo\([\s\S]*?  \}\n\n  private cargarSnapshotCompletoActivo/, '  private cargarSnapshotActivo(): void {}\n\n  private cargarSnapshotCompletoActivo');
c = c.replace(/  private cargarSnapshotCompletoActivo\([\s\S]*?  \}\n\n  private aplicarSnapshotActivo/, '  private cargarSnapshotCompletoActivo(): void {}\n\n  private aplicarSnapshotActivo');
c = c.replace(/  private aplicarSnapshotActivo\([\s\S]*?  \}\n\n  private aprobacionDesdeSnapshot/, '  private aplicarSnapshotActivo(): void {}\n\n  private aprobacionDesdeSnapshot');
c = c.replace(/  private aprobacionDesdeSnapshot\([\s\S]*?  \}\n\n  private etiquetaEstadoSnapshotTrabajador/, '  private aprobacionDesdeSnapshot(): null { return null; }\n\n  private etiquetaEstadoSnapshotTrabajador');

c = c.replace(/  formatoMonto\(valor/g, '  formatoMonto(valor');
c = c.replace(/  private formatoMonto\([\s\S]*?  \}\n\n  private formatoFechaHora/, '  formatoMonto(valor: number | null | undefined): string { return formatoMontoNomina(valor); }\n\n  private formatoFechaHora');
c = c.replace(/  private formatoFechaHora\([\s\S]*?  \}\n\n  private horaCorta/, '  private formatoFechaHora(valor: string | null | undefined): string { return formatoFechaHoraNomina(valor); }\n\n  private horaCorta');
c = c.replace(/  private horaCorta\([\s\S]*?  \}\n\n  private resumenRevisionTrabajadores/, '  private horaCorta(valor: string | null | undefined): string { return horaCortaNomina(valor); }\n\n  private resumenRevisionTrabajadores');

fs.writeFileSync(p, c);
console.log('done', c.split('\n').length, 'lines');
