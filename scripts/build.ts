import path from 'node:path';
import { cac } from 'cac';
import rimraf from 'rimraf';
import dts from 'vite-plugin-dts';
import chalk from 'chalk';
import patchTypes from './patchTypes';
import type { InlineConfig } from 'vite';

const cli = cac('vite');

const outDir = 'dist';
const commonConfig: InlineConfig = {
  clearScreen: false,
  build: {
    outDir: outDir,
    emptyOutDir: false,
    minify: false,
  },
};

/**
 * removing global flags before passing as command specific sub-configs
 */
function cleanOptions(options) {
  const ret = { ...options };
  delete ret['--'];
  delete ret.coreOnly;
  delete ret.emptyOutDir;
  delete ret.w;
  return ret;
}

cli
  .command('[root]', 'build')
  .option('--coreOnly', `[boolean] build only the core module`)
  .option(
    '--emptyOutDir',
    `[boolean] force empty outDir when it's outside of root`,
  )
  .option(
    '--sourcemap',
    `[boolean] output source maps for build (default: false)`,
  )
  .option('-w, --watch', `[boolean] rebuilds when modules have changed on disk`)
  .action(async (root, options) => {
    const { coreOnly } = options;
    const emptyOutDir = options.emptyOutDir ?? !coreOnly;
    const buildOptions = cleanOptions(options);
    emptyOutDir &&
      rimraf.sync(path.join(root ? path.resolve(root, outDir) : outDir, '/*'));

    console.log(chalk.bgBlue('building core...'));
    // eslint-disable-next-line node/no-unsupported-features/es-syntax
    const { build, mergeConfig } = await import('vite');

    await build(
      mergeConfig(commonConfig, {
        root,
        legacy: {
          buildSsrCjsExternalHeuristics: true,
        },
        build: {
          target: 'node12',
          ...buildOptions,
          // to achieve @rollup-node-resolve plugin effect
          ssr: true,
          rollupOptions: {
            input: 'lib/index.ts',
            output: {
              exports: 'default',
            },
            external: [
              // vite will auto collect externals from rollupOptions.input, but vite will delete the 'vite' text from
              // collected externals. so we should manual declare this external.
              'vite',
            ],
          },
        },
        plugins: [
          !coreOnly &&
            dts({
              staticImport: true,
              skipDiagnostics: false,
              // The plugin will report `TS2742` error if set this field to true, but running tsc command will not report an error.
              logDiagnostics: false,
              afterBuild() {
                const file = path.resolve(__dirname, '../dist/index.d.ts');
                patchTypes(file);
              },
            }),
        ],
      }),
    );
    if (!coreOnly) {
      console.log(chalk.bgBlue('building viteClientMock...'));
      await build(
        mergeConfig(commonConfig, {
          root,
          build: {
            target: 'es2018',
            ...buildOptions,
            lib: {
              entry: 'lib/public/viteClientMock/index.ts',
              formats: ['es'],
              fileName: () => 'viteClientMock.js',
            },
            rollupOptions: {
              external: ['@vite/env'],
            },
          },
        }),
      );
    }
  });

cli.parse();
