const ts = require('./frontend/node_modules/typescript/lib/typescript.js');
const fs = require('fs');
const content = fs.readFileSync('frontend/src/pages/GoalsPage.tsx', 'utf8');

const sourceFile = ts.createSourceFile('GoalsPage.tsx', content, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);

const diagnostics = sourceFile.parseDiagnostics;
console.log('Parse diagnostics count:', diagnostics.length);
for (const d of diagnostics) {
  const pos = sourceFile.getLineAndCharacterOfPosition(d.start);
  console.log('Line ' + (pos.line + 1) + ':' + (pos.character + 1) + ' - ' + d.messageText);
}
