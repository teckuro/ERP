import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const srcRoot = path.join(root, 'src');

const replacements = [
  [/shared\/components\/ui\/data-grid\.component/g, 'shared/components/ui/data-grid'],
  [/shared\/components\/ui\/badge\.component/g, 'shared/components/ui/primitives/badge.component'],
  [/shared\/components\/ui\/button\.component/g, 'shared/components/ui/primitives/button.component'],
  [/shared\/components\/ui\/card\.component/g, 'shared/components/ui/primitives/card.component'],
  [
    /shared\/components\/ui\/page-title\.component/g,
    'shared/components/ui/layout/page-title.component',
  ],
  [
    /shared\/components\/ui\/page-actions\.component/g,
    'shared/components/ui/layout/page-actions.component',
  ],
  [
    /shared\/components\/ui\/record-breadcrumb\.component/g,
    'shared/components/ui/layout/record-breadcrumb.component',
  ],
  [
    /shared\/components\/ui\/record-editor-header\.component/g,
    'shared/components/ui/layout/record-editor-header.component',
  ],
  [/shared\/components\/ui\/tabbar-folder\.component/g, 'shared/components/ui/layout/tabbar-folder.component'],
  [/shared\/components\/ui\/tabbar\.component/g, 'shared/components/ui/layout/tabbar.component'],
  [/shared\/components\/ui\/tabs\.component/g, 'shared/components/ui/layout/tabs.component'],
  [/shared\/components\/ui\/stepper\.component/g, 'shared/components/ui/layout/stepper.component'],
  [
    /shared\/components\/ui\/search-select\.component/g,
    'shared/components/ui/forms/search-select.component',
  ],
  [
    /shared\/components\/ui\/field-help-tip\.component/g,
    'shared/components/ui/forms/field-help-tip.component',
  ],
  [
    /shared\/components\/ui\/calendar-input\.component/g,
    'shared/components/ui/forms/calendar-input/calendar-input.component',
  ],
  [
    /shared\/components\/ui\/message-box\.types/g,
    'shared/components/ui/feedback/message-box/message-box.types',
  ],
  [
    /shared\/components\/ui\/message-box\.component/g,
    'shared/components/ui/feedback/message-box/message-box.component',
  ],
  [
    /shared\/components\/ui\/workspace-loading\.component/g,
    'shared/components/ui/feedback/workspace-loading/workspace-loading.component',
  ],
];

function walk(dir, files = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      if (ent.name === 'node_modules' || ent.name === '.angular') continue;
      walk(p, files);
    } else if (/\.(ts|html)$/.test(ent.name) && !ent.name.endsWith('.bak')) {
      files.push(p);
    }
  }
  return files;
}

let changed = 0;
for (const file of walk(srcRoot)) {
  if (file.includes(`${path.sep}shared${path.sep}components${path.sep}ui${path.sep}`)) continue;
  let text = fs.readFileSync(file, 'utf8');
  const orig = text;
  for (const [re, repl] of replacements) {
    text = text.replace(re, repl);
  }
  if (text !== orig) {
    fs.writeFileSync(file, text);
    changed++;
    console.log(path.relative(root, file));
  }
}
console.log('updated files:', changed);
