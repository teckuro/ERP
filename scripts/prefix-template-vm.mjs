import fs from 'node:fs';

const members = [
  'seleccionarNominaWorkspaceTab', 'abrirDetalleOperativo', 'bitacoraRailEtapas', 'alertasPeriodoResumen',
  'estadoOperativo', 'ejecutarAccionValidacion', 'accionPeriodoEnCurso', 'nominaWorkspaceTab',
  'dashboardResumen', 'snapshotActivo', 'periodoActivo', 'nominaResumenSuperior', 'nominaFrame',
  'cierreOperativo', 'nominaPendientesVisuales', 'clasePendienteVisual', 'etiquetaPendienteVisual',
  'payrollWorkerDetailRows', 'formatoMonto', 'resultadoPreliminar', 'baseNominaTrazabilidad',
  'nominaHistorialVisual', 'detalleOperativoAbierto', 'detalleOperativoTabActivo', 'detalleOperativoTabs',
  'seleccionarDetalleOperativoTab', 'cerrarDetalleOperativo', 'payrollParametroSeguimientoItems',
  'payrollMovimientoRecurrenteSeguimientoItems', 'payrollResultadoSeguimientoItems',
  'payrollWorkerDetailColumns', 'payrollWorkerDetailFilters', 'validando', 'generandoPreNomina',
  'calculandoPreliminar', 'guardandoSnapshot', 'aprobandoResultado', 'cerrandoNomina',
];

function prefix(html) {
  let out = '@let f = facade;\n@let frame = f.nominaFrame();\n@let resumen = f.nominaResumenSuperior();\n' + html;
  for (const m of members.sort((a, b) => b.length - a.length)) {
    const re = new RegExp(`(?<!f\\.)\\b${m}\\b`, 'g');
    out = out.replace(re, `f.${m}`);
  }
  return out;
}

const containerHtml = fs.readFileSync(
  'src/app/features/nomina-mensual/containers/proceso-mensual-container/proceso-mensual-container.html',
  'utf8',
);
const lines = containerHtml.split('\n');
const workspace = lines.slice(27, 289).join('\n');
const modal = lines.slice(290, 471).join('\n');

fs.mkdirSync(
  'src/app/features/nomina-mensual/containers/proceso-mensual-container/components/proceso-mensual-workspace',
  { recursive: true },
);
fs.mkdirSync(
  'src/app/features/nomina-mensual/containers/proceso-mensual-container/components/proceso-mensual-detalle-modal',
  { recursive: true },
);

fs.writeFileSync(
  'src/app/features/nomina-mensual/containers/proceso-mensual-container/components/proceso-mensual-workspace/proceso-mensual-workspace.component.html',
  prefix(workspace),
);
fs.writeFileSync(
  'src/app/features/nomina-mensual/containers/proceso-mensual-container/components/proceso-mensual-detalle-modal/proceso-mensual-detalle-modal.component.html',
  prefix(modal),
);
console.log('extracted');
