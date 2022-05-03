// tsc not bundle dts
// MIT Licensed https://github.com/vitejs/vite/blob/main/LICENSE

const { parse } = require('@babel/parser');
const chalk = require('chalk');
const { existsSync, readFileSync, writeFileSync } = require('fs');
const MagicString = require('magic-string');

// transform the "export default" statement to "export =" statement for dts
console.log(chalk.green(chalk.bold(`patched export default statement`)));

/**
 * @param {string} file
 */
module.exports = function patchTypes(file) {
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
      str.overwrite(statement.start, declaration.start - 1, 'export =');
    }
  }
  writeFileSync(file, str.toString());
};
