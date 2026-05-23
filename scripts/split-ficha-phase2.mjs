import fs from 'fs';
const path = 'src/app/features/empleados/containers/ficha-empleado-container/ficha-empleado-container.html';
const html = fs.readFileSync(path, 'utf8');
const methods = ['validationBlockingItems','validationPendingCount','mensajeExitoValidacion','mensajeErrorValidacion','confirmPayrollValidation','sectionValidationSections','mensajeErrorSeccion','mensajeExitoSeccion','tituloExitoSeccion','isValidatingPayroll','isLoadingCatalogs','isEditingCurrentTab','isEditingBlock','ejecutarAccionPrincipalPanel','validarFichaParaRemuneraciones','cancelPayrollValidation','dismissSectionError','dismissSectionSuccess','expedienteNavItems','employeeInitials','fichaEstadoPanel','tabActivoDescription','editComponentForBlock','editVisibleBlocks','saveBlockButtonLabel','tabActivoLabel','historyColumns','trackHistoryRow','progressStyle','isSavingSection','saveBlockHint','navegarFaltante','detailBlocks','historyRows','canEditBlock','startEditing','cancelEditing','saveSection','selectTab','tabActivo','catalogos','isMissingValue','isLoading','mensajeError','empleado'];
function prefixFacade(chunk) {
  let s = chunk;
  for (const m of methods) { s = s.replace(new RegExp('(?<![.\\w])' + m + '\\(', 'g'), 'f.' + m + '('); }
  s = s.replace(/\(click\)="([a-zA-Z]+)\(/g, (match, name) => methods.includes(name) ? '(click)="f.' + name + '(' : match);
  s = s.replace(/\(ngSubmit\)="([a-zA-Z]+)\(/g, (match, name) => methods.includes(name) ? '(ngSubmit)="f.' + name + '(' : match);
  s = s.replace(/\[formGroup\]="form"/g, '[formGroup]="f.form"');
  s = s.replace(/\[columns\]="historyColumns"/g, '[columns]="f.historyColumns"');
  s = s.replace(/\[trackBy\]="trackHistoryRow"/g, '[trackBy]="f.trackHistoryRow"');
  s = s.replace(/\{\{ tabs\.length \}\}/g, '{{ f.tabs.length }}');
  s = s.replace(/\[img\]="alertIcon"/g, '[img]="f.alertIcon"');
  s = s.replace(/\[img\]="chevronRightIcon"/g, '[img]="f.chevronRightIcon"');
  s = s.replace(/\[img\]="editIcon"/g, '[img]="f.editIcon"');
  s = s.replace(/\[img\]="emptyFieldIcon"/g, '[img]="f.emptyFieldIcon"');
  return s;
}
const overlayStart = html.indexOf('@if (mensajeExitoValidacion()');
const overlayEnd = html.indexOf('<div class="employee-record-shell">');
const overlaysHtml = '@let f = facade;\n' + prefixFacade(html.slice(overlayStart, overlayEnd));
let workspaceHtml = html.slice(html.indexOf('<section class="employee-file-page"'), overlayStart) + html.slice(overlayEnd);
workspaceHtml = prefixFacade(workspaceHtml);
workspaceHtml = workspaceHtml.replace(/<header class="employee-record-header"[\s\S]*?<\/header>/, '<app-empleado-record-header [employee]="employee" [initials]="f.employeeInitials(employee)" />');
workspaceHtml = workspaceHtml.replace(/<aside class="employee-record-status"[\s\S]*?<\/aside>/, '<app-empleado-diagnostico-panel [estado]="estado" [progressStyle]="f.progressStyle(employee)" [validando]="f.isValidatingPayroll()" (navegarFaltante)="f.navegarFaltante($event)" (accionPrincipal)="f.ejecutarAccionPrincipalPanel()" />');
workspaceHtml = workspaceHtml.replace(/<nav class="employee-record-tabbar"[\s\S]*?<\/nav>/, '<app-empleado-expediente-rail [items]="f.expedienteNavItems(employee)" [totalBloques]="f.tabs.length" (seleccionarTab)="f.selectTab($event)" />');
fs.writeFileSync('src/app/features/empleados/containers/ficha-empleado-container/components/ficha-empleado-overlays/ficha-empleado-overlays.component.html', overlaysHtml);
fs.writeFileSync('src/app/features/empleados/containers/ficha-empleado-container/components/ficha-empleado-workspace/ficha-empleado-workspace.component.html', '@let f = facade;\n' + workspaceHtml.trim());
console.log('ok');
