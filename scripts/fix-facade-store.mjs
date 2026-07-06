import fs from 'node:fs';

const p =
  'src/app/features/nomina-mensual/containers/proceso-mensual-container/facade/proceso-mensual-presentacion.facade.ts';
let c = fs.readFileSync(p, 'utf8');

c = c.replace(/@Component\(\{[\s\S]*?\}\)\n/, '');
c = c.replace(
  /import \{ CommonModule \} from '@angular\/common';\nimport \{ RouterLink \} from '@angular\/router';\nimport \{ LucideAngularModule \} from 'lucide-angular';\n\n/,
  '',
);
c = c.replace(
  /import \{ MessageBoxComponent \} from '[^']+';\nimport \{ DataGridComponent \} from '[^']+';\n/,
  '',
);
c = c.replace(
  /import \{\s*RecordBreadcrumbComponent,\s*type RecordBreadcrumbItem,\s*\} from '[^']+';\n/,
  "import { type RecordBreadcrumbItem } from '../../../../shared/components/ui/record-breadcrumb.component';\n",
);
c = c.replace("import { ProcesoMensualService } from '../../services/proceso-mensual.service';\n", '');
c = c.replace(
  '} from \'./models/proceso-mensual-container.vm\';',
  "} from '../models/proceso-mensual-container.vm';",
);
c = c.replace(
  '} from \'./models/proceso-mensual-grid.config\';',
  "} from '../models/proceso-mensual-grid.config';",
);

c = c.replace(
  '  readonly periodoActivo = inject(PeriodoActivoService);\n  readonly procesoMensual = inject(ProcesoMensualService);\n\n',
  '  readonly periodoActivo = inject(PeriodoActivoService);\n\n',
);

const storeSignals = [
  'resultado',
  'preNomina',
  'calculo',
  'snapshotActivo',
  'validando',
  'generandoPreNomina',
  'calculandoPreliminar',
  'guardandoSnapshot',
  'consultandoSnapshot',
  'consultandoSnapshotCompleto',
  'errorEjecucion',
  'errorGuardadoResultado',
  'errorAprobacionOperativa',
  'errorCierreOperativo',
  'errorSnapshotCompleto',
  'exitoGuardadoResultado',
  'identificadorResultadoGuardadoActual',
  'aprobacionOperativa',
  'aprobandoResultado',
  'cerrandoNomina',
  'snapshotCompleto',
];

for (const s of storeSignals) {
  c = c.replace(new RegExp(`  readonly ${s} = signal<[^>]+>\\([^)]*\\);\\n`, 'g'), '');
}

c = c.replace(
  /  readonly periodoSeleccionado = computed\(\(\) => this\.periodoActivo\.periodoYm\(\)\);\n/,
  '',
);

// period state accessors
const accessors = storeSignals
  .map(
    (s) =>
      `  readonly ${s} = this.store.${s};`,
  )
  .join('\n');
c = c.replace(
  '  readonly store = inject(ProcesoMensualPeriodoStore);',
  `  readonly store = inject(ProcesoMensualPeriodoStore);\n  readonly periodoSeleccionado = this.store.periodoSeleccionado;\n${accessors}`,
);

// accionPeriodoEnCurso -> store
c = c.replace(
  /  accionPeriodoEnCurso\(\): boolean \{[\s\S]*?  \}\n\n  seleccionarNominaWorkspaceTab/,
  '  accionPeriodoEnCurso(): boolean {\n    return this.store.accionPeriodoEnCurso();\n  }\n\n  seleccionarNominaWorkspaceTab',
);

// async delegates
const delegates = [
  ['validarPeriodo', 'validarPeriodo'],
  ['generarPreNomina', 'generarPreNomina'],
  ['calcularPreliminar', 'calcularPreliminar'],
  ['ejecutarGuardarSnapshotPreliminar', 'ejecutarGuardarSnapshotPreliminar'],
  ['verSnapshotActivo', 'verSnapshotActivo'],
  ['recalcularYReemplazarSnapshot', 'recalcularYReemplazarSnapshot'],
  ['resetearEstadoPeriodo', 'resetearEstadoPeriodo'],
];
for (const [method, storeMethod] of delegates) {
  const re = new RegExp(`  ${method}\\(\\): void \\{[\\s\\S]*?\\n  \\}\\n`, 'm');
  const replacement =
    method === 'resetearEstadoPeriodo'
      ? `  private ${method}(): void {\n    this.store.${storeMethod}();\n    this.confirmacionProceso.set(null);\n    this.detalleOperativoAbierto.set(false);\n    this.detalleOperativoTabActivo.set('trabajadores');\n    this.nominaWorkspaceTab.set('guia');\n    this.actaOperativaPreparada.set(false);\n  }\n`
      : `  ${method.startsWith('private ') ? 'private ' : ''}${method.replace('private ', '')}(): void {\n    this.store.${storeMethod}();\n  }\n`;
  if (re.test(c)) {
    c = c.replace(re, replacement);
  }
}

c = c.replace(
  /  private ejecutarAprobacionOperativa\([\s\S]*?  \}\n\n  revisarBaseNomina/,
  '  private ejecutarAprobacionOperativa(advertenciasAprobacion: string[]): void {\n    this.store.ejecutarAprobacionOperativa(advertenciasAprobacion);\n  }\n\n  revisarBaseNomina',
);
c = c.replace(
  /  private ejecutarCierreNominaOperativa\(\): void \{[\s\S]*?  \}\n\n  confirmarAccionProceso/,
  '  private ejecutarCierreNominaOperativa(): void {\n    this.store.ejecutarCierreNominaOperativa();\n  }\n\n  confirmarAccionProceso',
);

// remove stub private snapshot helpers if present
c = c.replace(/  private cargarSnapshotActivo\(\): void \{\}\n\n/g, '');
c = c.replace(/  private cargarSnapshotCompletoActivo\(\): void \{\}\n\n/g, '');
c = c.replace(/  private aplicarSnapshotActivo\(\): void \{\}\n\n/g, '');
c = c.replace(/  private aprobacionDesdeSnapshot\(\): null \{ return null; \}\n\n/g, '');

// nominaEstaCerradaOperativamente
c = c.replace(
  /  nominaEstaCerradaOperativamente\(\): boolean \{[\s\S]*?  \}\n/,
  '  nominaEstaCerradaOperativamente(): boolean {\n    return this.store.nominaEstaCerradaOperativamente();\n  }\n',
);

fs.writeFileSync(p, c);
console.log('lines', c.split('\n').length);
