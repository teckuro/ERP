import { execSync } from 'child_process';
import fs from 'fs';
const html = execSync('git show HEAD:src/app/features/empleados/containers/ficha-empleado-container/ficha-empleado-container.html', { encoding: 'utf8' });
const methods = ['validationBlockingItems','validationPendingCount','mensajeExitoValidacion','mensajeErrorValidacion','confirmPayrollValidation','sectionValidationSections','mensajeErrorSeccion','mensajeExitoSeccion','tituloExitoSeccion','isValidatingPayroll','cancelPayrollValidation','validarFichaParaRemuneraciones','dismissSectionError','dismissSectionSuccess'];
function prefixFacade(chunk) {
  let s = chunk;
  for (const m of methods) {
    s = s.replace(new RegExp('(?<![.\\w])' + m + '\\(', 'g'), 'f.' + m + '(');
  }
  s = s.replace(/\(click\)="([a-zA-Z]+)\(/g, (match, name) => (methods.includes(name) ? '(click)="f.' + name + '(' : match));
  return s;
}
const start = html.indexOf('@if (mensajeExitoValidacion()');
const end = html.indexOf('<div class="employee-record-shell">');
const inner = prefixFacade(html.slice(start, end));
const out = '@let f = facade;\n@if (f.empleado()) {\n' + inner + '\n}\n';
fs.writeFileSync('src/app/features/empleados/containers/ficha-empleado-container/components/ficha-empleado-overlays/ficha-empleado-overlays.component.html', out);
console.log('overlays ok');
