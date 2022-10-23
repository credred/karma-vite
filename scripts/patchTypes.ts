// tsc not bundle dts
// MIT Licensed https://github.com/vitejs/vite/blob/main/LICENSE

import { parse } from '@babel/parser';
import chalk from 'chalk';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import MagicString from 'magic-string';
import { isNumber } from 'lodash';

// transform the "export default" statement to "export =" statement for dts
console.log(chalk.green(chalk.bold(`patched export default statement`)));

export default function patchTypes(file: string) {
  if (!existsSync(file)) {
    console.log(chalk.red(`${file} not exist`));
    throw `${file} not exist`;
  }
  const content = readFileSync(file, 'utf-8');
  const str = new MagicString(content);
  const ast = parse(content, {
    sourceType: 'module',
    plugins: ['typescript', 'classProperties'],
  });
  for (const statement of ast.program.body) {
    if (statement.type === 'ExportDefaultDeclaration') {
      const declaration = statement.declaration;
      if (isNumber(statement.start) && isNumber(declaration.start)) {
        str.overwrite(statement.start, declaration.start - 1, 'export =');
      } else {
        throw new Error('patchTypes failed');
      }
    }
  }
  writeFileSync(file, str.toString());
}
