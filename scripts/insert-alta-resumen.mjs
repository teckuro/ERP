import fs from 'fs';
const path = 'src/app/features/empleados/components/form-empleado/form-empleado.ts';
let src = fs.readFileSync(path, 'utf8');
if (!src.includes('altaResumenEstadoPanel')) {
  const insert = `  altaResumenEstadoPanel(): FichaEstadoPanelVm {
    const snapshot = this.buildFichaValidacionSnapshot();
    const diagnostico = evaluarDiagnosticoFichaEmpleado(snapshot);
    const estado = this.form.controls.contrato.controls.estado.value ?? 'en_proceso';
    return buildAltaResumenEstadoPanel({
      diagnostico,
      pasoAltaAvanzada: this.isAdvancedMode() ? this.pasoWizardActivo() : null,
      estadoFicha: 'INCOMPLETO',
      estadoLaboral: estado,
      aptoParaRemuneracionesRegistro: false,
    });
  }

  altaResumenFaltantes(): FaltanteFichaEmpleado[] {
    return this.altaResumenEstadoPanel().faltantes;
  }

  irAlFaltanteResumenAlta(issue: FaltanteFichaEmpleado): void {
    const diagnostico = evaluarDiagnosticoFichaEmpleado(this.buildFichaValidacionSnapshot());
    this.selectWizardStep(wizardStepDesdeFaltanteAlta(issue, diagnostico.items));
  }

`;
  src = src.replace('  perfilLaboralWizardStepIndex(): number {', insert + '  perfilLaboralWizardStepIndex(): number {');
}
if (!src.includes('FaltanteFichaEmpleado')) {
  src = src.replace(
    "} from '../../rules/empleado-alta-diagnostico.rules';",
    "} from '../../rules/empleado-alta-diagnostico.rules';\nimport type { FaltanteFichaEmpleado, FichaEstadoPanelVm } from '../../models/ficha-empleado.vm';",
  );
}
fs.writeFileSync(path, src);
console.log('done', src.includes('altaResumenEstadoPanel'));
