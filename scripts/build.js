//@ts-check
const path = require('path');
const { build } = require('vite');
const { cac } = require('cac');
const { execSync } = require('child_process');
const rimraf = require('rimraf');

const cli = cac('vite');
const outDir = 'dist';

cli
  .command('[root]', 'build')
  .option('-w, --watch', `[boolean] rebuilds when modules have changed on disk`)
  .action((root, options) => {
    rimraf.sync(path.join(root ? path.resolve(root, outDir) : outDir, '/*'));
    console.log('tsc building for declaration...');
    execSync('npx tsc');

    void build({
      root,
      build: {
        watch: options.watch,
        target: 'node10',
        outDir: outDir,
        lib: {
          entry: 'lib/index.ts',
          formats: ['cjs'],
          fileName: () => 'index.js',
        },
      },
    });
    void build({
      root,
      build: {
        watch: options.watch,
        target: 'es2018',
        outDir: outDir,
        lib: {
          entry: 'lib/public/viteClientMock/index.ts',
          formats: ['es'],
          fileName: () => 'viteClientMock.js',
        },
      },
    });
  });

cli.parse();
