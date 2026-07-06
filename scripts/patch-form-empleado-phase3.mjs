import fs from 'fs';
const path = 'src/app/features/empleados/components/form-empleado/form-empleado.ts';
let src = fs.readFileSync(path, 'utf8');

src = src.replace(
  /import \{\s*evaluarDiagnosticoFichaEmpleado,\s*type EmpleadoFichaValidacionSnapshot,\s*\} from "\.\.\/\.\.\/rules\/empleado-ficha-validacion\.rules";/,
  `import {
  buildAltaResumenEstadoPanel,
  evaluarDiagnosticoFichaEmpleado,
  mapDiagnosticoItemsToEvaluatedRules,
  wizardStepDesdeFaltanteAlta,
  type EmpleadoFichaValidacionSnapshot,
} from '../../rules/empleado-alta-diagnostico.rules';
import type { FaltanteFichaEmpleado, FichaEstadoPanelVm } from '../../models/ficha-empleado.vm';`,
);

src = src.replace(
  /\n  private getAllValidationRules\(\): ValidationRule\[\] \{[\s\S]*?\n  private evaluateValidationRules\(\): EvaluatedValidationRule\[\] \{/,
  '\n  private evaluateValidationRules(): EvaluatedValidationRule[] {',
);

src = src.replace(
  /return evaluarDiagnosticoFichaEmpleado\(this\.buildFichaValidacionSnapshot\(\)\)\s*\.items\s*\.map\(\(item\) => \(\{[\s\S]*?\}\)\);/,
  `return mapDiagnosticoItemsToEvaluatedRules(
      evaluarDiagnosticoFichaEmpleado(this.buildFichaValidacionSnapshot()),
    );`,
);

src = src.replace(
  /pasoAltaAvanzada: null,/,
  'pasoAltaAvanzada: this.isAdvancedMode() ? this.pasoWizardActivo() : null,',
);

src = src.replace(
  /\n  private resolveWizardStep\(rule: ValidationRule\): number \{[\s\S]*?\n  \}\n\n  private wizardStepsForTab/,
  '\n  private wizardStepsForTab',
);

src = src.replace(
  /\n  private rule\([\s\S]*?\n  \}\n\n  private validationSortWeight/,
  '\n  private validationSortWeight',
);

src = src.replace(
  /\ninterface ValidationRule \{[\s\S]*?\n\}\n\ninterface PerfilLaboralAutoDetection/,
  '\ninterface PerfilLaboralAutoDetection',
);

const marker = '  summaryWizardStepIndex(): number {\n    return this.totalSteps - 1;\n  }';
const addition = `  summaryWizardStepIndex(): number {
    return this.totalSteps - 1;
  }

  altaResumenEstadoPanel(): FichaEstadoPanelVm {
    const snapshot = this.buildFichaValidacionSnapshot();
    const diagnostico = evaluarDiagnosticoFichaEmpleado(snapshot);
    const estado = this.form.controls.contrato.controls.estado.value ?? 'en_proceso';
    return buildAltaResumenEstadoPanel({
      diagnostico,
      pasoAltaAvanzada: this.isAdvancedMode() ? this.pasoWizardActivo() : null,
      estadoFicha: 'INCOMPLETO',
      estadoLaboral: estado,
      aptoParaRemuneracionesRegistro: false,
      humanizeBloqueo: (bloqueo) => this.humanizeValidationMessage(bloqueo),
    });
  }

  altaResumenFaltantes(): FaltanteFichaEmpleado[] {
    return this.altaResumenEstadoPanel().faltantes;
  }

  irAlFaltanteResumenAlta(issue: FaltanteFichaEmpleado): void {
    const diagnostico = evaluarDiagnosticoFichaEmpleado(this.buildFichaValidacionSnapshot());
    const step = wizardStepDesdeFaltanteAlta(issue, diagnostico.items);
    this.selectWizardStep(step);
  }`;

if (!src.includes('altaResumenEstadoPanel')) {
  src = src.replace(marker, addition);
}

fs.writeFileSync(path, src, 'utf8');
console.log('patched ok');
