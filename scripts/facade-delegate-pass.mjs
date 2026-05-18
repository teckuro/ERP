import fs from 'node:fs';

const p =
  'src/app/features/nomina-mensual/containers/proceso-mensual-container/facade/proceso-mensual-presentacion.facade.ts';
let c = fs.readFileSync(p, 'utf8');

c = c.replace(/@Component\(\{[\s\S]*?\}\)\n/, '');
c = c.replace(/import \{ CommonModule \} from '@angular\/common';\n/, '');
c = c.replace(/import \{ RouterLink \} from '@angular\/router';\n/, '');
c = c.replace(/import \{ LucideAngularModule \} from 'lucide-angular';\n\n/, '');
c = c.replace(/import \{ MessageBoxComponent \} from '[^']+';\n/, '');
c = c.replace(/import \{ DataGridComponent \} from '[^']+';\n/, '');
c = c.replace("import { ProcesoMensualService } from '../../services/proceso-mensual.service';\n", '');
c = c.replace(
  /import \{\s*RecordBreadcrumbComponent,\s*type RecordBreadcrumbItem,\s*\} from '[^']+';\n/,
  "import { type RecordBreadcrumbItem } from '../../../../shared/components/ui/record-breadcrumb.component';\n",
);

c = c.replace(/  constructor\(\) \{[\s\S]*?  \}\n\n/, '');

const blocks = [
  [
    /  validarPeriodo\(\): void \{[\s\S]*?  \}\n\n  generarPreNomina/,
    '  validarPeriodo(): void {\n    this.store.validarPeriodo();\n  }\n\n  generarPreNomina',
  ],
  [
    /  generarPreNomina\(\): void \{[\s\S]*?  \}\n\n  calcularPreliminar/,
    '  generarPreNomina(): void {\n    this.store.generarPreNomina();\n  }\n\n  calcularPreliminar',
  ],
  [
    /  calcularPreliminar\(\): void \{[\s\S]*?  \}\n\n  guardarSnapshotPreliminar/,
    `  calcularPreliminar(): void {
    if (!this.puedeCalcularPreliminar()) return;
    this.store.calcularPreliminar();
  }

  guardarSnapshotPreliminar`,
  ],
  [
    /  private ejecutarGuardarSnapshotPreliminar\(\): void \{[\s\S]*?  \}\n\n  verSnapshotActivo/,
    '  private ejecutarGuardarSnapshotPreliminar(): void {\n    this.store.ejecutarGuardarSnapshotPreliminar();\n  }\n\n  verSnapshotActivo',
  ],
  [
    /  verSnapshotActivo\(\): void \{[\s\S]*?  \}\n\n  consultarDetalleResultadoGuardado/,
    '  verSnapshotActivo(): void {\n    this.store.verSnapshotActivo();\n  }\n\n  consultarDetalleResultadoGuardado',
  ],
  [
    /  consultarDetalleResultadoGuardado\(\): void \{[\s\S]*?  \}\n\n  private resetearEstadoPeriodo/,
    '  consultarDetalleResultadoGuardado(): void {\n    this.store.consultarDetalleResultadoGuardado();\n  }\n\n  private resetearEstadoPeriodo',
  ],
  [
    /  private resetearEstadoPeriodo\(\): void \{[\s\S]*?  \}\n\n  recalcularYReemplazarSnapshot/,
    `  private resetearEstadoPeriodo(): void {
    this.store.resetearEstadoPeriodo();
    this.confirmacionProceso.set(null);
    this.actaOperativaPreparada.set(false);
  }

  recalcularYReemplazarSnapshot`,
  ],
  [
    /  recalcularYReemplazarSnapshot\(\): void \{[\s\S]*?  \}\n\n  etiquetaEstadoGlobal/,
    '  recalcularYReemplazarSnapshot(): void {\n    this.store.recalcularYReemplazarSnapshot();\n  }\n\n  etiquetaEstadoGlobal',
  ],
  [
    /  private ejecutarAprobacionOperativa\([\s\S]*?  \}\n\n  revisarBaseNomina/,
    '  private ejecutarAprobacionOperativa(advertenciasAprobacion: string[]): void {\n    this.store.ejecutarAprobacionOperativa(advertenciasAprobacion);\n  }\n\n  revisarBaseNomina',
  ],
  [
    /  private ejecutarCierreNominaOperativa\(\): void \{[\s\S]*?  \}\n\n  confirmarAccionProceso/,
    '  private ejecutarCierreNominaOperativa(): void {\n    this.store.ejecutarCierreNominaOperativa();\n  }\n\n  confirmarAccionProceso',
  ],
];

for (const [re, rep] of blocks) {
  if (!re.test(c)) console.warn('no match', rep.slice(0, 40));
  c = c.replace(re, rep);
}

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

fs.writeFileSync(p, c);
console.log('done', c.split('\n').length);
