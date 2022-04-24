//@ts-check
const path = require('path');
const { build } = require('vite');
const { cac } = require('cac');
const rimraf = require('rimraf');
const dts = require('vite-plugin-dts');

const cli = cac('vite');
const outDir = 'dist';

cli
  .command('[root]', 'build')
  .option('-w, --watch', `[boolean] rebuilds when modules have changed on disk`)
  .action((root, options) => {
    rimraf.sync(path.join(root ? path.resolve(root, outDir) : outDir, '/*'));

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
        rollupOptions: {
          external: [
            /node_modules/,
            // vite not support trigger Node.js core module as external by default https://github.com/vitejs/vite/issues/7821
            'path',
          ],
        },
      },
      plugins: [
        dts.default({
          staticImport: true,
          skipDiagnostics: false,
          // The plugin will report `TS2742` error if set this field to true, but running tsc command will not report an error.
          logDiagnostics: false,
        }),
      ],
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
