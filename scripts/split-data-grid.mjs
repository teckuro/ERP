import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = path.join(root, 'src/app/shared/components/ui/data-grid.component.ts');
const outDir = path.join(root, 'src/app/shared/components/ui/data-grid');

const lines = fs.readFileSync(src, 'utf8').split(/\r?\n/);

const typesStart = 40;
const typesEnd = 160;
const dirStart = 162;
const dirEnd = 178;
const templateStart = 192;
const templateEnd = 1007;
const stylesStart = 1011;
const stylesEnd = 1773;
const classStart = 1777;

fs.mkdirSync(outDir, { recursive: true });

const typesBody = lines.slice(typesStart - 1, typesEnd).join('\n');
const typesFile =
  "import type { MessageBoxVariant } from '../feedback/message-box/message-box.types';\n\n" +
  typesBody +
  '\n';
fs.writeFileSync(path.join(outDir, 'data-grid.types.ts'), typesFile);

const dirImports =
  "import { Directive, Input, TemplateRef } from '@angular/core';\n" +
  "import type { DataGridCellContext } from './data-grid.types';\n\n";
const dirBody = lines.slice(dirStart - 1, dirEnd).join('\n');
fs.writeFileSync(path.join(outDir, 'data-grid.directives.ts'), dirImports + dirBody + '\n');

const template = lines.slice(templateStart - 1, templateEnd).join('\n');
fs.writeFileSync(path.join(outDir, 'data-grid.component.html'), template + '\n');

const css = lines.slice(stylesStart - 1, stylesEnd).join('\n');
fs.writeFileSync(path.join(outDir, 'data-grid.component.css'), css + '\n');

const header = lines
  .slice(0, 38)
  .join('\n')
  .replace("from './card.component'", "from '../primitives/card.component'")
  .replace(
    "from './calendar-input.component'",
    "from '../forms/calendar-input/calendar-input.component'",
  )
  .replace(
    "from './message-box.component'",
    "from '../feedback/message-box/message-box.component'",
  );

const reexports =
  "\nexport * from './data-grid.types';\n" +
  "export { DataGridCellDirective, DataGridPrimaryActionMenuDirective } from './data-grid.directives';\n" +
  "import { DataGridCellDirective, DataGridPrimaryActionMenuDirective } from './data-grid.directives';\n" +
  "import type { MessageBoxVariant } from '../feedback/message-box/message-box.types';\n";

const decorator = `@Component({
  selector: 'app-data-grid',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LucideAngularModule,
    CardComponent,
    CalendarInputComponent,
    MessageBoxComponent,
  ],
  templateUrl: './data-grid.component.html',
  styleUrl: './data-grid.component.css',
})
`;

const noticeInterface = `interface DataGridNotice {
  variant: Exclude<MessageBoxVariant, 'loading'>;
  title: string;
  message: string;
}

`;

const classSection = lines.slice(classStart - 1).join('\n');
const componentBody = header + reexports + '\n' + decorator + noticeInterface + classSection;
fs.writeFileSync(path.join(outDir, 'data-grid.component.ts'), componentBody + '\n');

fs.writeFileSync(
  path.join(outDir, 'index.ts'),
  "export * from './data-grid.types';\n" +
    "export * from './data-grid.directives';\n" +
    "export * from './data-grid.component';\n",
);

fs.unlinkSync(src);
console.log('split ok:', outDir);
